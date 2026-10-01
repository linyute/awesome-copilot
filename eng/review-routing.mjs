// 為 pull request 提供評審員路由（reviewer routing）與 SLA 升級機制。
//
// 設定檔位於 .github/review-routing.yml。純規畫（planning）
// 函式（planRouting、planEscalation、工作天輔助函式）在
// review-routing.test.mjs 中進行單元測試；非同步執行器會以
// Review Routing 與 Review Escalation 工作流所發出的 GitHub REST 呼叫來包裝這些函式。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REVIEW_ROUTING_CONFIG_PATH = path.join(__dirname, "..", ".github", "review-routing.yml");

export const INTENT_LABELS = Object.freeze([
  "agent",
  "canvas-extension",
  "external-plugin",
  "hooks",
  "instructions",
  "new-submission",
  "plugin",
  "skills",
  "website-update",
  "workflow",
]);

export const INTENT_ARTIFACT_SCHEMA = "label-pr-intent-result/v1";
export const ROUTING_REQUEST_ARTIFACT_SCHEMA = "review-routing-request/v1";

export const COMMENT_MARKERS = Object.freeze({
  overdue: "<!-- review-routing:overdue -->",
  escalated: "<!-- review-routing:escalated -->",
});

const LOGIN_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const TEAM_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DUE_LABEL_RETENTION_DAYS = 14;

/** GitHub Actions 每個 matrix 最多允許 256 個 job。 */
export const MAX_MATRIX_TARGETS = 256;

/**
 * 將 sweep 目標上限設為單一 matrix 可執行的數量；剩餘的部分
 * 會由下一次排程執行接手（規畫具冪等性），因此不會有任何遺漏。
 */
export function limitTargets(targets, max = MAX_MATRIX_TARGETS) {
  return { targets: targets.slice(0, max), deferred: Math.max(0, targets.length - max) };
}

// ---------------------------------------------------------------------------
// 設定（Configuration）
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateLoginList(value, where, errors) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push(`${where} 必須是 GitHub 登入名的清單`);
    return [];
  }
  const logins = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !LOGIN_PATTERN.test(entry)) {
      errors.push(`${where} 包含無效的 GitHub 登入名：${JSON.stringify(entry)}`);
      continue;
    }
    logins.push(entry);
  }
  return logins;
}

/**
 * 驗證並正規化已解析的 review-routing.yml 文件。
 * @returns {{ config: object|null, errors: string[] }}
 */
export function normalizeReviewRoutingConfig(raw) {
  const errors = [];
  if (!isPlainObject(raw)) {
    return { config: null, errors: ["設定檔必須是 YAML mapping"] };
  }
  if (raw.version !== 1) errors.push("version 必須是 1");

  const sla = isPlainObject(raw.sla) ? raw.sla : {};
  if (!isPlainObject(raw.sla)) errors.push("sla 必須是 mapping");
  const firstReviewBusinessDays = sla.first_review_business_days;
  const escalationBusinessDays = sla.escalation_business_days;
  if (!Number.isInteger(firstReviewBusinessDays) || firstReviewBusinessDays < 1) {
    errors.push("sla.first_review_business_days 必須是正整數");
  }
  if (!Number.isInteger(escalationBusinessDays) || escalationBusinessDays <= firstReviewBusinessDays) {
    errors.push("sla.escalation_business_days 必須是介於 sla.first_review_business_days 以上的整數");
  }
  const holidays = [];
  for (const holiday of sla.holidays ?? []) {
    const key = holiday instanceof Date ? holiday.toISOString().slice(0, 10) : holiday;
    if (typeof key !== "string" || !DATE_KEY_PATTERN.test(key)) {
      errors.push(`sla.holidays 包含無效的日期：${JSON.stringify(holiday)}`);
    } else {
      holidays.push(key);
    }
  }

  const rawLabels = isPlainObject(raw.labels) ? raw.labels : {};
  const labels = {
    needsReviewer: rawLabels.needs_reviewer,
    duePrefix: rawLabels.due_prefix,
    overdue: rawLabels.overdue,
    escalated: rawLabels.escalated,
  };
  for (const [key, value] of Object.entries(labels)) {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`labels.${key} 必須是非空字串`);
    }
  }

  const pools = {};
  if (!isPlainObject(raw.pools) || Object.keys(raw.pools).length === 0) {
    errors.push("pools 必須是非空的 mapping");
  } else {
    for (const [name, pool] of Object.entries(raw.pools)) {
      if (!isPlainObject(pool)) {
        errors.push(`pools.${name} 必須是 mapping`);
        continue;
      }
      if (pool.team !== undefined && pool.team !== null && (typeof pool.team !== "string" || !TEAM_PATTERN.test(pool.team))) {
        errors.push(`pools.${name}.team 必須使用 "<org>/<team-slug>" 格式`);
      }
      pools[name] = {
        name,
        team: pool.team ?? null,
        reviewers: validateLoginList(pool.reviewers, `pools.${name}.reviewers`, errors),
        backup: validateLoginList(pool.backup, `pools.${name}.backup`, errors),
      };
    }
  }

  const escalationPool = raw.escalation_pool;
  const defaultPool = raw.default_pool;
  if (!pools[escalationPool]) errors.push("escalation_pool 必須指定一個已設定的池");
  if (!pools[defaultPool]) errors.push("default_pool 必須指定一個已設定的池");

  const routes = [];
  if (!Array.isArray(raw.routes)) {
    errors.push("routes 必須是清單");
  } else {
    raw.routes.forEach((route, index) => {
      if (!isPlainObject(route) || typeof route.label !== "string" || route.label.trim() === "") {
        errors.push(`routes[${index}] 必須包含 label`);
        return;
      }
      if (!pools[route.pool]) {
        errors.push(`routes[${index}]（${route.label}）參考了未知的池 ${JSON.stringify(route.pool)}`);
        return;
      }
      routes.push({ label: route.label, pool: route.pool });
    });
  }

  const skipLabels = Array.isArray(raw.skip_labels) ? raw.skip_labels.filter((label) => typeof label === "string") : [];
  if (raw.skip_labels !== undefined && raw.skip_labels !== null && !Array.isArray(raw.skip_labels)) {
    errors.push("skip_labels 必須是清單");
  }

  if (typeof raw.dry_run !== "boolean") {
    errors.push("dry_run 必須是 true 或 false");
  }

  const config = {
    version: raw.version,
    dryRun: raw.dry_run === true,
    sla: { firstReviewBusinessDays, escalationBusinessDays, holidays },
    labels,
    pools,
    routes,
    escalationPool,
    defaultPool,
    unavailable: validateLoginList(raw.unavailable, "unavailable", errors),
    skipAuthors: Array.isArray(raw.skip_authors) ? raw.skip_authors.filter((login) => typeof login === "string") : [],
    skipLabels,
  };

  return { config: errors.length === 0 ? config : null, errors };
}

export function loadReviewRoutingConfig(filePath = REVIEW_ROUTING_CONFIG_PATH) {
  const raw = yaml.load(fs.readFileSync(filePath, "utf8"));
  const { config, errors } = normalizeReviewRoutingConfig(raw);
  if (!config) {
    throw new Error(`無效的評審路由設定（${filePath}）：\n- ${errors.join("\n- ")}`);
  }
  return config;
}

// ---------------------------------------------------------------------------
// 工作天運算（UTC 日期以 YYYY-MM-DD 作為 key）
// ---------------------------------------------------------------------------

export function toDateKey(value) {
  if (typeof value === "string" && DATE_KEY_PATTERN.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`無效的日期：${value}`);
  return date.toISOString().slice(0, 10);
}

function shiftDateKey(key, days) {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isBusinessDay(value, holidays = []) {
  const key = toDateKey(value);
  const weekday = new Date(`${key}T00:00:00.000Z`).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !holidays.includes(key);
}

/**
 * 從 `start` 起移動 `days` 個工作天（負值則向前移動）。
 * 週末與已設定的假期會被略過。回傳 YYYY-MM-DD key。
 */
export function addBusinessDays(start, days, holidays = []) {
  let key = toDateKey(start);
  const step = days >= 0 ? 1 : -1;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    key = shiftDateKey(key, step);
    if (isBusinessDay(key, holidays)) remaining -= 1;
  }
  return key;
}

/**
 * 針對 review-due 標籤為 `dueDate` 的 PR 的 SLA 里程標。
 * - routedOn：PR 被路由的工作天（dueDate - first_review_business_days）
 * - dueDate：首次審查的最後一個工作天
 * - overdueOn：dueDate 之後的第一個工作天（請求備援評審員）
 * - escalateOn：routedOn + escalation_business_days（請求核心池）
 */
export function slaMilestones(dueDate, config) {
  const { firstReviewBusinessDays, escalationBusinessDays, holidays } = config.sla;
  const routedOn = addBusinessDays(dueDate, -firstReviewBusinessDays, holidays);
  return {
    routedOn,
    dueDate,
    overdueOn: addBusinessDays(dueDate, 1, holidays),
    escalateOn: addBusinessDays(routedOn, escalationBusinessDays, holidays),
  };
}

// ---------------------------------------------------------------------------
// 標籤、評審員與審查的輔助函式
// ---------------------------------------------------------------------------

const lower = (value) => String(value ?? "").toLowerCase();

export function isBotLogin(login) {
  return /\[bot\]$/i.test(String(login ?? ""));
}

export function labelNames(labels = []) {
  return labels.map((label) => (typeof label === "string" ? label : label?.name)).filter(Boolean);
}

export function dueLabelName(dateKey, config) {
  return `${config.labels.duePrefix}${dateKey}`;
}

export function parseDueLabels(names, config) {
  const prefix = config.labels.duePrefix;
  return [...names]
    .filter((name) => name.startsWith(prefix))
    .map((name) => ({ name, date: name.slice(prefix.length) }))
    .filter(({ date }) => DATE_KEY_PATTERN.test(date))
    .sort((left, right) => left.date.localeCompare(right.date));
}

/**
 * 用於路由決策的標籤。當 `intentLabels` 是陣列（來自
 * Label PR Intent artifact）時，它為權威來源：現有的 intent 標籤
 * 會被它取代，即使它是空陣列也一樣。`null` 表示「使用目前的標籤」。
 */
export function effectiveLabelNames(currentLabels, intentLabels = null) {
  const current = labelNames(currentLabels);
  if (intentLabels === null || intentLabels === undefined) return new Set(current);
  return new Set([...current.filter((name) => !INTENT_LABELS.includes(name)), ...intentLabels]);
}

export function selectPool(names, config) {
  const set = new Set(names);
  const route = config.routes.find((candidate) => set.has(candidate.label));
  return route ? route.pool : config.defaultPool;
}

export function teamSlug(team) {
  return team ? team.split("/").pop() : null;
}

function isTeamRequested(pr, slug) {
  return Boolean(slug) && (pr.requested_teams ?? []).some((team) => lower(team?.slug) === lower(slug));
}

/** 統計各評審員（以小寫登入名計）在所有開啟 PR 上的未完成審查請求數。 */
export function computeReviewLoad(openPulls = []) {
  const load = new Map();
  for (const pull of openPulls) {
    for (const reviewer of pull.requested_reviewers ?? []) {
      const key = lower(reviewer?.login);
      if (key) load.set(key, (load.get(key) ?? 0) + 1);
    }
  }
  return load;
}

/**
 * 選出未完成審查請求數最少的合格候選人。
 * 平手時依 `seed`（PR 編號）輪替，使指派分散於整個池。
 */
export function pickReviewer(candidates, { exclude = new Set(), load = new Map(), seed = 0 } = {}) {
  const seen = new Set();
  const eligible = [];
  for (const login of candidates) {
    const key = lower(login);
    if (!key || seen.has(key) || exclude.has(key) || isBotLogin(login)) continue;
    seen.add(key);
    eligible.push(login);
  }
  if (eligible.length === 0) return null;
  const minLoad = Math.min(...eligible.map((login) => load.get(lower(login)) ?? 0));
  const tied = eligible.filter((login) => (load.get(lower(login)) ?? 0) === minLoad);
  return tied[Math.abs(Number(seed) || 0) % tied.length];
}

function isAfterBoundary(submittedAt, since) {
  if (!since) return true;
  if (!submittedAt) return false;
  if (DATE_KEY_PATTERN.test(since)) return toDateKey(submittedAt) >= since;
  return Date.parse(submittedAt) >= Date.parse(since);
}

/**
 * 當作者以外的任何人（且非 bot）在 `since`（ISO 時間戳記，
 * 或 YYYY-MM-DD 日期 key）或之後提交過審查時，回傳 true。
 */
export function hasHumanReview(reviews = [], author, since = null) {
  return reviews.some((review) => {
    const login = review?.user?.login;
    if (!login || isBotLogin(login) || review.user.type === "Bot") return false;
    if (lower(login) === lower(author)) return false;
    if (review.state === "PENDING") return false;
    return isAfterBoundary(review.submitted_at, since);
  });
}

/** 已提交非 PENDING 審查的登入名（不含作者與 bot）。 */
function submittedReviewers(reviews, author) {
  return reviews
    .filter((review) => review?.state !== "PENDING")
    .map((review) => review?.user?.login)
    .filter((login) => login && !isBotLogin(login) && lower(login) !== lower(author));
}

/**
 * 能滿足某個池的個人：該池的評審員與備援人員，外加可審查
 * 任何 PR 的升級（核心）池。對 `unavailable` 評審員的
 * PENDING 請求不計入；但其已提交的審查則計入。
 */
export function coveringReviewers(pr, reviews, poolName, config) {
  const pool = config.pools[poolName];
  const escalation = config.pools[config.escalationPool];
  const cover = new Set([...pool.reviewers, ...pool.backup, ...escalation.reviewers].map(lower));
  const unavailable = new Set(config.unavailable.map(lower));
  const author = lower(pr.user?.login);
  const logins = [
    ...(pr.requested_reviewers ?? []).map((reviewer) => reviewer?.login).filter((login) => !unavailable.has(lower(login))),
    ...submittedReviewers(reviews, author),
  ];
  const result = [];
  for (const login of logins) {
    const key = lower(login);
    if (key && key !== author && cover.has(key) && !result.some((existing) => lower(existing) === key)) result.push(login);
  }
  return result;
}

function skipped(pr, reason, extra = {}) {
  return { prNumber: pr?.number, action: "skip", reason, ...extra };
}

function exclusionSet(pr, config) {
  const requested = (pr.requested_reviewers ?? []).map((reviewer) => reviewer?.login).filter(Boolean);
  return new Set([pr.user?.login, ...requested, ...config.unavailable].filter(Boolean).map(lower));
}

function commonSkip(pr, names, config) {
  if (!pr || pr.state !== "open") return skipped(pr, "not-open");
  if (pr.draft) return skipped(pr, "draft");
  const author = lower(pr.user?.login);
  if (config.skipAuthors.some((login) => lower(login) === author)) return skipped(pr, "skipped-author");
  const skipLabel = config.skipLabels.find((label) => names.has(label));
  if (skipLabel) return skipped(pr, "skipped-label", { label: skipLabel });
  return null;
}

/**
 * 為某個池選擇要請求誰：先選池的評審員，再選池的備援人員，
 * 接著是升級池，最後是池的團隊（除非已被請求）。
 */
function pickPoolRequest(pr, poolName, config, load, alsoExclude = []) {
  const pool = config.pools[poolName];
  const escalation = config.pools[config.escalationPool];
  const exclude = exclusionSet(pr, config);
  for (const login of alsoExclude) exclude.add(lower(login));
  const tiers = [
    ["pool", pool.reviewers],
    ["backup", pool.backup],
    ["escalation-pool", escalation.reviewers],
  ];
  for (const [source, candidates] of tiers) {
    const login = pickReviewer(candidates, { exclude, load, seed: pr.number });
    if (login) return { reviewers: [login], teamReviewers: [], source };
  }
  const slug = teamSlug(pool.team);
  if (slug && !isTeamRequested(pr, slug)) return { reviewers: [], teamReviewers: [slug], source: "team" };
  return { reviewers: [], teamReviewers: [], source: slug ? "existing-team-request" : "none" };
}

const hasRequest = (plan) => plan.reviewers.length > 0 || plan.teamReviewers.length > 0;

// ---------------------------------------------------------------------------
// 規畫（Planning）
// ---------------------------------------------------------------------------

/**
 * 決定 PR 的路由方式。純函式：不執行任何 I/O。
 * @param {object} args
 * @param {object} args.pr        Pull request（REST 形狀：number、state、draft、user、labels、requested_reviewers、requested_teams）
 * @param {object[]} args.reviews 該 PR 上的審查
 * @param {Map} args.load         各評審員未完成的審查請求數（見 computeReviewLoad）
 * @param {string[]|null} args.intentLabels 來自 Label PR Intent artifact 的權威 intent 標籤，或 null
 */
export function planRouting({ pr, reviews = [], load = new Map(), config, now = new Date(), intentLabels = null }) {
  const names = effectiveLabelNames(pr?.labels, intentLabels);
  const skip = commonSkip(pr, names, config);
  if (skip) return skip;

  const author = pr.user?.login ?? "";
  const reviewRequested = names.has(config.labels.needsReviewer);
  const dueLabels = parseDueLabels(names, config);
  const routed = dueLabels.length > 0;
  const poolName = selectPool(names, config);

  if (!reviewRequested && !routed && hasHumanReview(reviews, author)) return skipped(pr, "already-reviewed", { pool: poolName });

  // needs-reviewer 永遠請求一位新的評審員（目前未被請求、
  // 也尚未審查過的人）；否則，任何已涵蓋目標池的個人
  // （已被請求或已審查）即已足夠。
  let request;
  if (reviewRequested) {
    request = pickPoolRequest(pr, poolName, config, load, submittedReviewers(reviews, author));
    // 沒有可請求的新人：保留 needs-reviewer 與目前的 SLA，
    // 以便稍後有評審員可用時，下一次執行能重試。
    if (!hasRequest(request)) return skipped(pr, "no-reviewer-available", { pool: poolName });
  } else {
    const covering = coveringReviewers(pr, reviews, poolName, config);
    request = covering.length > 0 ? { reviewers: [], teamReviewers: [], source: "covered" } : pickPoolRequest(pr, poolName, config, load);
  }

  if (routed && !reviewRequested) {
    // 已路由：僅在目標池改變且未被涵蓋時才採取動作。
    // SLA（due 標籤）維持原狀。若未設定任何個人，
    // 任何人的審查都算數，因此不會反覆重新請求團隊。
    if (!hasRequest(request)) return skipped(pr, "already-routed", { pool: poolName });
    if (request.reviewers.length === 0 && hasHumanReview(reviews, author)) return skipped(pr, "already-routed", { pool: poolName });
    return {
      prNumber: pr.number,
      action: "route",
      reason: "pool-changed",
      pool: poolName,
      ...request,
      dueDate: dueLabels[dueLabels.length - 1].date,
      addLabels: [],
      removeLabels: [],
    };
  }

  const dueDate = addBusinessDays(now, config.sla.firstReviewBusinessDays, config.sla.holidays);
  const dueLabel = dueLabelName(dueDate, config);
  const removeLabels = [];
  if (reviewRequested) {
    // 重新加上之前，先移除所有 due 標籤（即使是日期相同的那個），
    // 以便該標籤的 `labeled` 事件標記新 SLA 週期的開始。
    removeLabels.push(...dueLabels.map((label) => label.name));
    const prLabels = new Set(labelNames(pr.labels));
    for (const label of [config.labels.needsReviewer, config.labels.overdue, config.labels.escalated]) {
      if (prLabels.has(label)) removeLabels.push(label);
    }
  }

  return {
    prNumber: pr.number,
    action: "route",
    reason: reviewRequested ? "needs-reviewer" : "unrouted",
    pool: poolName,
    ...request,
    dueDate,
    addLabels: [dueLabel],
    removeLabels,
  };
}

function mention(login) {
  return `@${login}`;
}

const FOOTER = "_由 Review Escalation 工作流自動執行 — 請參閱 `docs/maintainers/review-routing.md`。_";

/**
 * 決定一個已路由的 PR 是否逾期或必須升級。純函式：不執行任何 I/O。
 * @param {string|null} args.routedAt 目前 due 標籤被加上時的 ISO 時間戳記（SLA 週期的開始）
 */
export function planEscalation({ pr, reviews = [], load = new Map(), config, now = new Date(), routedAt = null }) {
  const names = new Set(labelNames(pr?.labels));
  const skip = commonSkip(pr, names, config);
  if (skip) return skip;

  const dueLabels = parseDueLabels(names, config);
  if (dueLabels.length === 0) return skipped(pr, "not-routed");

  const author = pr.user?.login ?? "";
  const dueDate = dueLabels[dueLabels.length - 1].date;
  const milestones = slaMilestones(dueDate, config);
  const hasOverdue = names.has(config.labels.overdue);
  const hasEscalated = names.has(config.labels.escalated);
  const base = { prNumber: pr.number, ...milestones, routedAt };
  // due 標籤只隱含一個工作天；顯示時優先採用實際的路由時間
  // （例如週末或假期）。
  const routedOnDisplay = routedAt ? toDateKey(routedAt) : milestones.routedOn;

  if (hasHumanReview(reviews, author, routedAt ?? milestones.routedOn)) {
    const removeLabels = dueLabels.map((label) => label.name);
    if (hasOverdue) removeLabels.push(config.labels.overdue);
    if (hasEscalated) removeLabels.push(config.labels.escalated);
    return { ...base, action: "reviewed", reviewers: [], teamReviewers: [], addLabels: [], removeLabels };
  }

  const today = toDateKey(now);
  const poolName = selectPool(names, config);
  const pool = config.pools[poolName];
  const escalation = config.pools[config.escalationPool];
  const exclude = exclusionSet(pr, config);
  const escalationTeam = escalation.team;
  const escalationSlug = teamSlug(escalationTeam);

  if (today >= milestones.escalateOn) {
    if (hasEscalated) return { ...base, action: "none", state: "escalated" };
    const reviewer = pickReviewer(escalation.reviewers, { exclude, load, seed: pr.number });
    const reviewers = reviewer ? [reviewer] : [];
    const teamReviewers = escalationSlug && !isTeamRequested(pr, escalationSlug) ? [escalationSlug] : [];
    const addLabels = [config.labels.escalated];
    if (!hasOverdue) addLabels.push(config.labels.overdue);
    const requested = [...reviewers.map(mention), ...(teamReviewers.length > 0 ? [mention(escalationTeam)] : [])];
    const body = [
      COMMENT_MARKERS.escalated,
      "### 🚨 審查已升級",
      "",
      `此 pull request 已於 ${routedOnDisplay} 路由至 **${poolName}** 評審員池，且在 ${config.sla.escalationBusinessDays} 個工作天內未收到審查。`,
      "",
      requested.length > 0
        ? `正在升級至 **${config.escalationPool}** 池：已請求 ${requested.join(", ")}。`
        : `正在升級至 **${config.escalationPool}** 池${escalationTeam ? ` (${mention(escalationTeam)})` : ""}。其評審員已遭請求或不可用，因此未額外請求評審員。`,
      "",
      FOOTER,
    ].join("\n");
    return { ...base, action: "escalate", pool: poolName, reviewers, teamReviewers, addLabels, removeLabels: [], comment: body };
  }

  if (today >= milestones.overdueOn) {
    if (hasOverdue) return { ...base, action: "none", state: "overdue" };
    const backup = pickReviewer(pool.backup, { exclude, load, seed: pr.number }) ?? pickReviewer(escalation.reviewers, { exclude, load, seed: pr.number });
    const reviewers = backup ? [backup] : [];
    let teamReviewers = [];
    let fallbackTeam = null;
    if (!backup) {
      for (const team of [pool.team, escalationTeam]) {
        const slug = teamSlug(team);
        if (slug && !isTeamRequested(pr, slug)) {
          teamReviewers = [slug];
          fallbackTeam = team;
          break;
        }
      }
    }
    const currentlyRequested = (pr.requested_reviewers ?? []).map((reviewer) => reviewer?.login).filter((login) => login && !isBotLogin(login));
    let assignment;
    if (backup) assignment = `正在請求備援評審員 ${mention(backup)}。`;
    else if (fallbackTeam) assignment = `沒有可用的個別備援評審員；正在請求 ${mention(fallbackTeam)} 團隊。`;
    else assignment = "沒有可用的額外評審員：已設定的備援人員與團隊已遭請求或不可用。";
    const body = [
      COMMENT_MARKERS.overdue,
      "### ⏰ 審查已逾期",
      "",
      `此 pull request 已於 ${routedOnDisplay} 路由至 **${poolName}** 評審員池；首次審查的期限為 ${milestones.dueDate}。`,
      "",
      currentlyRequested.length > 0 ? `目前已請求：${currentlyRequested.map(mention).join(", ")}。` : "目前沒有已請求的個別評審員。",
      assignment,
      "",
      `若仍未收到審查，此 pull request 將於 ${milestones.escalateOn} 升級至 **${config.escalationPool}** 池。`,
      "",
      FOOTER,
    ].join("\n");
    return { ...base, action: "overdue", pool: poolName, reviewers, teamReviewers, addLabels: [config.labels.overdue], removeLabels: [], comment: body };
  }

  return { ...base, action: "none", state: "on-track" };
}

// ---------------------------------------------------------------------------
// GitHub I/O
// ---------------------------------------------------------------------------

function createActions({ github, owner, repo, config, log }) {
  const dryRun = config.dryRun;
  const say = (message) => log?.info?.(message);
  const warn = (message) => (log?.warning ?? log?.info)?.(message);

  async function ensureDueLabel(name) {
    try {
      await github.rest.issues.createLabel({ owner, repo, name, color: "C5DEF5", description: "首次審查目標日期（評審路由）" });
    } catch (error) {
      if (error.status !== 422) throw error;
    }
  }

  return {
    /**
     * 套用一份規畫。先執行評審員請求；若失敗，則不變更任何
     * 標籤或評論，以便下一次執行重試。失敗時回傳 false。
     */
    async apply(plan) {
      const prefix = `${dryRun ? "[dry-run] " : ""}PR #${plan.prNumber}`;
      if (plan.reviewers?.length || plan.teamReviewers?.length) {
        say(`${prefix}：請求評審員=${plan.reviewers.join(",") || "-"} 團隊=${plan.teamReviewers.join(",") || "-"}`);
        if (!dryRun) {
          try {
            await github.rest.pulls.requestReviewers({
              owner,
              repo,
              pull_number: plan.prNumber,
              reviewers: plan.reviewers,
              team_reviewers: plan.teamReviewers,
            });
          } catch (error) {
            plan.requestError = error.message;
            warn(`${prefix}：評審員請求失敗；標籤維持不變，以便下一次執行重試：${error.message}`);
            return false;
          }
        }
      }
      for (const name of plan.removeLabels ?? []) {
        say(`${prefix}：移除標籤 ${name}`);
        if (dryRun) continue;
        try {
          await github.rest.issues.removeLabel({ owner, repo, issue_number: plan.prNumber, name });
        } catch (error) {
          if (error.status !== 404) throw error;
        }
      }
      if (plan.addLabels?.length) {
        say(`${prefix}：新增標籤 ${plan.addLabels.join(", ")}`);
        if (!dryRun) {
          for (const name of plan.addLabels) {
            if (name.startsWith(config.labels.duePrefix)) await ensureDueLabel(name);
          }
          await github.rest.issues.addLabels({ owner, repo, issue_number: plan.prNumber, labels: plan.addLabels });
        }
      }
      if (plan.comment) {
        say(`${prefix}：發佈 ${plan.action} 評論`);
        if (!dryRun) await github.rest.issues.createComment({ owner, repo, issue_number: plan.prNumber, body: plan.comment });
      }
      return true;
    },
  };
}

async function listOpenPulls(github, owner, repo) {
  return github.paginate(github.rest.pulls.list, { owner, repo, state: "open", per_page: 100 });
}

async function listReviews(github, owner, repo, pullNumber) {
  return github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number: pullNumber, per_page: 100 });
}

/** 該 PR 上 `labelName` 最近一次 `labeled` 事件的時間戳記，或 null。 */
export async function findLabelAddedAt(github, owner, repo, issueNumber, labelName) {
  const events = await github.paginate(github.rest.issues.listEvents, { owner, repo, issue_number: issueNumber, per_page: 100 });
  let latest = null;
  for (const event of events) {
    if (event?.event === "labeled" && event.label?.name === labelName && event.created_at) {
      if (!latest || Date.parse(event.created_at) > Date.parse(latest)) latest = event.created_at;
    }
  }
  return latest;
}

async function currentRoutedAt(github, owner, repo, pr, config) {
  const dueLabels = parseDueLabels(labelNames(pr.labels), config);
  if (dueLabels.length === 0) return null;
  return findLabelAddedAt(github, owner, repo, pr.number, dueLabels[dueLabels.length - 1].name);
}

/**
 * 路由單一 PR（讀取、規畫、套用）。呼叫者必須對每個 PR 串行化。
 * @param {string[]|null} intentLabels 來自 Label PR Intent artifact 的權威 intent 標籤
 * @param {string|null} expectedHeadSha 若 PR head 在 artifact 產生後已移動，則略過
 */
export async function routePullRequest({ github, owner, repo, config, prNumber, intentLabels = null, expectedHeadSha = null, now = new Date(), log }) {
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
  if (expectedHeadSha && pr.head?.sha !== expectedHeadSha) {
    log?.info?.(`PR #${prNumber}：已略過（head 已移動；較新的 intent 執行會路由它）`);
    return skipped(pr, "stale-head");
  }
  const [reviews, openPulls] = await Promise.all([listReviews(github, owner, repo, prNumber), listOpenPulls(github, owner, repo)]);
  const plan = planRouting({ pr, reviews, load: computeReviewLoad(openPulls), config, now, intentLabels });
  if (plan.action === "route") {
    await createActions({ github, owner, repo, config, log }).apply(plan);
  } else {
    log?.info?.(`PR #${prNumber}：已略過（${plan.reason}）`);
  }
  return plan;
}

/** 唯讀：為每個開啟的 PR 規畫路由。用於決定一次 sweep 應路由哪些 PR。 */
export async function planRoutingSweep({ github, owner, repo, config, now = new Date() }) {
  const openPulls = await listOpenPulls(github, owner, repo);
  const load = computeReviewLoad(openPulls);
  const plans = [];
  for (const pr of openPulls) {
    if (pr.draft) continue;
    const reviews = await listReviews(github, owner, repo, pr.number);
    plans.push(planRouting({ pr, reviews, load, config, now }));
  }
  return plans;
}

/** 對單一已路由的 PR 強制執行 SLA（讀取、規畫、套用）。呼叫者必須對每個 PR 串行化。 */
export async function escalatePullRequest({ github, owner, repo, config, prNumber, now = new Date(), log }) {
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
  const [reviews, openPulls, routedAt] = await Promise.all([
    listReviews(github, owner, repo, prNumber),
    listOpenPulls(github, owner, repo),
    currentRoutedAt(github, owner, repo, pr, config),
  ]);
  const plan = planEscalation({ pr, reviews, load: computeReviewLoad(openPulls), config, now, routedAt });
  if (["reviewed", "overdue", "escalate"].includes(plan.action)) {
    await createActions({ github, owner, repo, config, log }).apply(plan);
  } else {
    log?.info?.(`PR #${prNumber}：無動作（${plan.reason ?? plan.state}）`);
  }
  return plan;
}

/** 唯讀：為每個已路由的開啟 PR 規畫 SLA 強制執行。 */
export async function planEscalationSweep({ github, owner, repo, config, now = new Date() }) {
  const openPulls = await listOpenPulls(github, owner, repo);
  const load = computeReviewLoad(openPulls);
  const plans = [];
  for (const pr of openPulls) {
    if (pr.draft || parseDueLabels(labelNames(pr.labels), config).length === 0) continue;
    const [reviews, routedAt] = await Promise.all([listReviews(github, owner, repo, pr.number), currentRoutedAt(github, owner, repo, pr, config)]);
    plans.push(planEscalation({ pr, reviews, load, config, now, routedAt }));
  }
  return plans;
}

/** 刪除已超過保留期限、且沒有任何開啟 PR 使用的 `review-due:*` 標籤。 */
export async function cleanupStaleDueLabels({ github, owner, repo, config, now = new Date(), log }) {
  const openPulls = await listOpenPulls(github, owner, repo);
  const active = new Set(openPulls.flatMap((pr) => parseDueLabels(labelNames(pr.labels), config).map((label) => label.name)));
  const cutoff = shiftDateKey(toDateKey(now), -DUE_LABEL_RETENTION_DAYS);
  const repoLabels = await github.paginate(github.rest.issues.listLabelsForRepo, { owner, repo, per_page: 100 });
  const deleted = [];
  for (const { name, date } of parseDueLabels(labelNames(repoLabels), config)) {
    if (date >= cutoff || active.has(name)) continue;
    log?.info?.(`${config.dryRun ? "[dry-run] " : ""}刪除陳舊標籤 ${name}`);
    deleted.push(name);
    if (config.dryRun) continue;
    try {
      await github.rest.issues.deleteLabel({ owner, repo, name });
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  return deleted;
}

// ---------------------------------------------------------------------------
// workflow_run artifact 驗證
// ---------------------------------------------------------------------------

/**
 * 驗證 reader workflow 的 artifact，並確認它屬於一個開啟的 PR，
 * 且其 head 與觸發該 workflow_run 的一致。對照
 * label-pr-intent-writer.yml 中的檢查項目。
 * @returns {Promise<{ prNumber: number, headSha: string, intentLabels: string[]|null } | { skip: string }>}
 *   對 Label PR Intent artifact 而言 intentLabels 是陣列，對 needs-reviewer 請求而言為 null。
 */
export async function resolveWorkflowRunArtifact({ github, owner, repo, workflowRun, artifact }) {
  const fail = (message) => {
    throw new Error(`無效的評審路由 artifact：${message}`);
  };

  if (!isPlainObject(artifact)) fail("artifact 必須是物件");
  const schema = artifact.schema_version;
  if (schema !== INTENT_ARTIFACT_SCHEMA && schema !== ROUTING_REQUEST_ARTIFACT_SCHEMA) fail("schema_version 不符預期");
  if (artifact.event !== "pull_request") fail("event 不符預期");
  if (!Number.isInteger(artifact.pr_number) || artifact.pr_number < 1) fail("pr_number 無效");
  if (!/^[0-9a-f]{40}$/i.test(String(artifact.head_sha || ""))) fail("head_sha 無效");
  if (workflowRun?.event !== "pull_request") fail("workflow_run event 不符預期");
  if (String(artifact.run_id || "") !== String(workflowRun.id)) fail("run_id 與 workflow_run 不符");
  if (artifact.head_sha !== workflowRun.head_sha) fail("head_sha 與 workflow_run 不符");

  let intentLabels = null;
  if (schema === INTENT_ARTIFACT_SCHEMA) {
    intentLabels = validateIntentLabels(artifact.desired_labels, fail);
  }

  const prNumber = artifact.pr_number;
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
  if (pr.state !== "open") return { skip: `PR #${prNumber} 未處於開啟狀態` };

  const expectedBase = `${owner}/${repo}`.toLowerCase();
  if (lower(pr.base?.repo?.full_name) !== expectedBase) fail(`PR #${prNumber} 並非指向這個儲存庫`);
  if (pr.head?.sha !== workflowRun.head_sha) return { skip: `PR #${prNumber} 的 artifact 已過期` };

  const runHeadRepository = String(workflowRun.head_repository?.full_name || "");
  const [headOwner, headName] = runHeadRepository.split("/");
  const runHeadRef = String(workflowRun.head_branch || "");
  if (!headOwner || !headName || !runHeadRef || lower(pr.head?.repo?.full_name) !== lower(runHeadRepository) || String(pr.head?.ref || "") !== runHeadRef) {
    fail(`PR #${prNumber} 的 head 與 workflow_run 不符`);
  }

  const runPulls = Array.isArray(workflowRun.pull_requests) ? workflowRun.pull_requests : [];
  if (runPulls.length > 0) {
    if (!runPulls.some((pull) => pull.number === prNumber)) fail(`PR #${prNumber} 不存在於 workflow_run.pull_requests 中`);
  } else {
    const candidates = await github.paginate(github.rest.pulls.list, {
      owner,
      repo,
      state: "open",
      head: `${headOwner}:${runHeadRef}`,
      per_page: 100,
    });
    const matches = candidates.filter(
      (candidate) =>
        candidate.head?.sha === workflowRun.head_sha &&
        String(candidate.head?.ref || "") === runHeadRef &&
        lower(candidate.head?.repo?.full_name) === lower(runHeadRepository) &&
        lower(candidate.base?.repo?.full_name) === expectedBase
    );
    if (matches.length !== 1 || matches[0].number !== prNumber) fail(`PR #${prNumber} 無法與 workflow_run 唯一對應`);
  }

  return { prNumber, headSha: artifact.head_sha, intentLabels };
}

/** 驗證 intent 標籤清單；遇到未知標籤時透過 `fail`（預設為 Error）擲出例外。 */
export function validateIntentLabels(value, fail = (message) => { throw new Error(message); }) {
  if (!Array.isArray(value)) fail("desired_labels 無效");
  for (const label of value) {
    if (!INTENT_LABELS.includes(label)) fail(`預料之外的 desired label：${label}`);
  }
  return [...value];
}

// ---------------------------------------------------------------------------
// 報告（Reporting）
// ---------------------------------------------------------------------------

export function formatResultsSummary(results, { title, dryRun }) {
  const lines = [`## ${title}${dryRun ? "（dry run）" : ""}`, ""];
  if (results.length === 0) {
    lines.push("_沒有需要處理的 pull request。_");
    return lines.join("\n");
  }
  lines.push("| PR | 操作 | 池 | 評審員 | 新增的標籤 | 移除的標籤 | 備註 |", "|---:|---|---|---|---|---|---|");
  for (const result of results) {
    const reviewers = [...(result.reviewers ?? []), ...(result.teamReviewers ?? []).map((team) => `team:${team}`)].join(", ");
    const notes = [result.reason, result.source, result.state, result.requestError && `請求失敗：${result.requestError}`].filter(Boolean).join("; ");
    lines.push(
      `| #${result.prNumber} | ${result.action} | ${result.pool ?? ""} | ${reviewers} | ${(result.addLabels ?? []).join(", ")} | ${(result.removeLabels ?? []).join(", ")} | ${notes} |`
    );
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI：`node eng/review-routing.mjs validate [path]`
// ---------------------------------------------------------------------------

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command = "validate", filePath = REVIEW_ROUTING_CONFIG_PATH] = process.argv.slice(2);
  if (command !== "validate") {
    console.error("用法：node eng/review-routing.mjs validate [config-path]");
    process.exit(2);
  }
  try {
    const config = loadReviewRoutingConfig(filePath);
    const pools = Object.values(config.pools)
      .map((pool) => `${pool.name}：${pool.reviewers.length} 位評審員、${pool.backup.length} 位備援`)
      .join("\n  ");
    console.log(`✓ ${path.relative(process.cwd(), filePath)} 是有效的${config.dryRun ? "（已啟用 dry_run）" : ""}\n  ${pools}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
