#!/usr/bin/env node
// 提交閘門（Submission gate）：彙總檢查評估、合併風險等級、核准政策、
// PR 狀態機、狀態留言呈現，以及 PR 指令。
// 由 .github/workflows/submission-gate*.yml 和 pr-commands.yml 使用。
// 詳見 docs/maintainers/submission-gate.md。

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as yaml from "js-yaml";

export const GATE_CHECK_NAME = "submission-gate";
// 可信寫入者（trusted writer）所發佈之檢查執行蓋上的 external_id。
export const GATE_CHECK_EXTERNAL_ID = "submission-gate-writer";
const CONTRIBUTOR_RESULT_JOB = "pr-check";
export const GATE_WORKFLOW_FILE = "submission-gate.yml";
export const STATUS_MARKER = "<!-- submission-gate-status -->";
export const RISK_TIERS = ["low", "medium", "high"];
export const RISK_LABELS = RISK_TIERS.map((tier) => `merge-risk:${tier}`);
export const STATE_LABELS = [
  "awaiting-automation",
  "requires-submitter-fixes",
  "ready-for-review",
  "review-in-progress",
  "approved",
];
export const PR_EVENTS = new Set(["pull_request", "pull_request_review"]);
// 帶有這些標籤的 PR，其狀態標籤由另一個工作流管理。
export const STATE_LABEL_OWNERS = ["external-plugin"];

const WRITE_PERMISSIONS = new Set(["admin", "maintain", "write"]);
const MAINTAINER_PERMISSIONS = new Set(["admin", "maintain"]);
const RERUNNABLE_CONCLUSIONS = new Set(["failure", "cancelled", "timed_out", "startup_failure"]);

const STATE_DISPLAY = {
  "awaiting-automation": { icon: "⏳", text: "等待自動化" },
  "requires-submitter-fixes": { icon: "🛠️", text: "需要提交者修正" },
  "ready-for-review": { icon: "👀", text: "準備好在評審" },
  "review-in-progress": { icon: "💬", text: "評審進行中" },
  approved: { icon: "✅", text: "已核准" },
};

// ---------------------------------------------------------------------------
// 設定與路徑比對
// ---------------------------------------------------------------------------

/** 將 GitHub Actions 風格的路徑 glob 轉換為 RegExp。 */
export function globToRegExp(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          source += "(?:.*/)?";
          i += 2;
        } else {
          source += ".*";
          i += 1;
        }
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

const globCache = new Map();
export function matchesAny(filePath, globs = []) {
  return globs.some((glob) => {
    if (!globCache.has(glob)) globCache.set(glob, globToRegExp(glob));
    return globCache.get(glob).test(filePath);
  });
}

function readYamlIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return yaml.load(fs.readFileSync(filePath, "utf8"));
}

/** 載入閘門、風險等級，以及（可選的）評審路由設定。 */
export function loadGateConfig(rootDir = process.cwd()) {
  const gate = readYamlIfExists(path.join(rootDir, ".github", "submission-gate.yml"));
  const tiers = readYamlIfExists(path.join(rootDir, ".github", "risk-tiers.yml"));
  if (!gate || !Array.isArray(gate.checks)) throw new Error(".github/submission-gate.yml 不存在，或沒有 checks");
  if (!tiers || !tiers.high || !tiers.medium || !tiers.low) throw new Error(".github/risk-tiers.yml 缺少某個 tier");

  // 缺少路由檔案是受支援的退路。若檔案存在但無法解析，則必須
  // 以失敗為安全（fail closed）：把它當成缺失會放寬領域/所有權人的核准要求。
  let routing;
  try {
    routing = readYamlIfExists(path.join(rootDir, ".github", "review-routing.yml"));
  } catch (error) {
    throw new Error(`.github/review-routing.yml 無法解析：${error.message}`);
  }
  if (routing !== null && routing !== undefined && (typeof routing !== "object" || Array.isArray(routing))) {
    throw new Error(".github/review-routing.yml 必須是 mapping");
  }
  if (routing?.pools !== undefined && (typeof routing.pools !== "object" || routing.pools === null || Array.isArray(routing.pools))) {
    throw new Error(".github/review-routing.yml 的 `pools` 必須是 mapping");
  }
  return { gate, tiers, routing: routing ?? null };
}

function fileNames(files) {
  const names = [];
  for (const file of files) {
    names.push(file.filename);
    if (file.previous_filename) names.push(file.previous_filename);
  }
  return names;
}

/** 適用於此 PR 的檢查，對應每個工作流的分支與路徑篩選條件。 */
export function selectApplicableChecks(checks, files, baseRef) {
  const names = fileNames(files);
  return checks.filter((check) => {
    const branches = check.branches;
    if (Array.isArray(branches) && branches.length > 0 && !branches.includes("*") && !branches.includes(baseRef)) {
      return false;
    }
    if (Array.isArray(check.paths) && check.paths.length > 0) {
      return names.some((name) => matchesAny(name, check.paths));
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// 風險等級
// ---------------------------------------------------------------------------

function addedLines(patch) {
  if (typeof patch !== "string") return [];
  return patch
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
}

/**
 * 將 PR 分類到唯一的一個合併風險等級。
 * `incompleteFiles` 表示變更檔案清單已被 GitHub 截斷；此情況會以失敗為安全（fail closed）判定為高風險。
 * @returns {{tier: 'low'|'medium'|'high', reasons: string[]}}
 */
export function classifyRisk({ files, labels = [], contributorRisk = null, tiers, incompleteFiles = false }) {
  const high = tiers.high || {};
  const low = tiers.low || {};
  const reasons = [];

  if (incompleteFiles) reasons.push("GitHub 未回傳完整的變更檔案清單，因此此 PR 被視為高風險");

  for (const file of files) {
    for (const name of fileNames([file])) {
      if (matchesAny(name, high.exclude_paths || [])) continue;
      if (matchesAny(name, high.paths || [])) {
        reasons.push(`\`${name}\` 是高風險路徑（自動化、腳本、MCP 設定、hooks 或評審政策）`);
        break;
      }
    }
  }

  // GitHub 對二進位檔案與非常大的 diff 會省略 `patch`。若新增行無法掃描的文字檔案，
  // 會以失敗為安全（fail closed）處理，而不是跳過能力（capability）觸發條件。
  const capabilities = high.capabilities || [];
  const unscannable = files.filter(
    (file) =>
      file.status !== "removed" &&
      typeof file.patch !== "string" &&
      Number(file.additions ?? 1) > 0 &&
      !matchesAny(file.filename, high.unscanned_paths || []) &&
      capabilities.some((capability) => !Array.isArray(capability.files) || matchesAny(file.filename, capability.files))
  );
  for (const file of unscannable) {
    reasons.push(`\`${file.filename}\` 沒有可供掃描特權能力的 diff`);
  }

  for (const capability of capabilities) {
    const pattern = new RegExp(capability.pattern);
    for (const file of files) {
      if (Array.isArray(capability.files) && !matchesAny(file.filename, capability.files)) continue;
      if (addedLines(file.patch).some((line) => pattern.test(line))) {
        reasons.push(`於 \`${file.filename}\` 發現 ${capability.description}`);
      }
    }
  }

  for (const label of high.labels || []) {
    if (labels.includes(label)) reasons.push(`標籤 \`${label}\` 表示高貢獻者風險訊號`);
  }
  if (String(contributorRisk || "").toUpperCase() === "HIGH" && !reasons.some((r) => r.includes("contributor-risk"))) {
    reasons.push("貢獻者聲望檢查回報了高貢獻者風險訊號");
  }

  if (reasons.length > 0) return { tier: "high", reasons: [...new Set(reasons)] };

  const names = fileNames(files);
  if (names.every((name) => matchesAny(name, low.paths || []))) {
    return { tier: "low", reasons: ["只有文件、Metadata 或自動產生的檔案有變更"] };
  }

  const small = low.small_update || {};
  const maxLines = Number(small.max_changed_lines ?? 0);
  const totalChanges = files.reduce((sum, file) => sum + Number(file.changes ?? (file.additions || 0) + (file.deletions || 0)), 0);
  const onlyModifiesResources = files.every(
    (file) =>
      file.status === "modified" &&
      (matchesAny(file.filename, low.paths || []) || matchesAny(file.filename, small.resource_paths || []))
  );
  if (onlyModifiesResources && totalChanges <= maxLines) {
    return {
      tier: "low",
      reasons: [`對現有資源的小型更新（${totalChanges} 行變更），無新增或移除檔案`],
    };
  }

  const mediumReasons = [];
  const added = files.filter((file) => file.status === "added").map((file) => file.filename);
  if (added.length > 0) mediumReasons.push(`新增 ${added.length} 個檔案，例如 \`${added[0]}\``);
  if (files.some((file) => ["removed", "renamed"].includes(file.status))) mediumReasons.push("移除或重新命名檔案");
  if (totalChanges > maxLines) mediumReasons.push(`變更 ${totalChanges} 行（低風險上限為 ${maxLines}）`);
  if (mediumReasons.length === 0) mediumReasons.push("變更了低風險文件與資源路徑之外的檔案");
  return { tier: "medium", reasons: mediumReasons };
}

// ---------------------------------------------------------------------------
// 核准
// ---------------------------------------------------------------------------

/** 將 review-routing.yml 正規化為「池金鑰 -> 小寫 login 的 Set」的 Map。 */
export function normalizeRouting(routing) {
  const pools = new Map();
  const source = routing?.pools || routing?.teams || {};
  if (!source || typeof source !== "object") return pools;
  for (const [key, value] of Object.entries(source)) {
    const logins = new Set();
    const add = (list) => {
      if (!Array.isArray(list)) return;
      for (const entry of list) {
        const login = typeof entry === "string" ? entry : entry?.login;
        if (typeof login === "string" && login.trim()) logins.add(login.trim().replace(/^@/, "").toLowerCase());
      }
    };
    if (Array.isArray(value)) add(value);
    else {
      add(value?.reviewers);
      add(value?.members);
      add(value?.backup);
    }
    pools.set(key, logins);
  }
  return pools;
}

function unionPools(pools, keys) {
  const union = new Set();
  for (const key of keys) for (const login of pools.get(key) || []) union.add(login);
  return union;
}

/** PR 觸及的領域範圍（用於選擇領域評審池）。 */
export function touchedDomains(files, domains = {}) {
  const names = fileNames(files);
  return Object.entries(domains)
    .filter(([, domain]) => names.some((name) => matchesAny(name, domain.paths || [])))
    .map(([id, domain]) => ({ id, pools: domain.pools || [] }));
}

/**
 * 依據某等級的核准政策評估評審。
 * `permissions` 對應小寫 login -> 儲存庫權限（admin|maintain|write|triage|read|none）。
 */
export function evaluateApprovals({ tier, tiers, reviews = [], author, permissions = new Map(), routing = null, files = [] }) {
  const policy = tiers[tier]?.approvals || {};
  const required = Number(policy.required || 1);
  const pools = normalizeRouting(routing);
  const allPoolMembers = unionPools(pools, [...pools.keys()]);
  const authorLogin = String(author || "").toLowerCase();

  const qualified = (login) => WRITE_PERMISSIONS.has(permissions.get(login)) || allPoolMembers.has(login);

  const latest = new Map();
  const reviewed = new Set();
  const sorted = [...reviews].sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));
  for (const review of sorted) {
    const login = String(review.user?.login || "").toLowerCase();
    if (!login || login === authorLogin || review.user?.type === "Bot") continue;
    if (review.state === "PENDING") continue;
    reviewed.add(login);
    if (["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state)) latest.set(login, review.state);
  }

  const approvers = [...latest].filter(([login, state]) => state === "APPROVED" && qualified(login)).map(([login]) => login);
  const changesRequestedBy = [...latest]
    .filter(([login, state]) => state === "CHANGES_REQUESTED" && qualified(login))
    .map(([login]) => login);
  const reviewers = [...reviewed].filter(qualified);

  const missing = [];
  const notes = [];
  const requirements = [`${required} 個核准${required === 1 ? "" : "s"}（來自具寫入權限的評審者）`];
  if (approvers.length < required) missing.push(`${required - approvers.length} 個核准(s)`);

  const coreMembers = unionPools(pools, tiers.core_pools || []);
  if (policy.require_domain || policy.require_owner) {
    const kind = policy.require_owner ? "資源所有權人" : "領域評審者";
    const touched = touchedDomains(files, tiers.domains).flatMap((domain) => domain.pools);
    // 位於所有領域之外的檔案（文件、Metadata）由核心池（core pools）負責。
    const ownsUntouched = fileNames(files).some(
      (name) => !Object.values(tiers.domains || {}).some((domain) => matchesAny(name, domain.paths || []))
    );
    const domainPoolKeys = [...new Set([...touched, ...(ownsUntouched ? tiers.core_pools || [] : [])])];
    const domainMembers = unionPools(pools, domainPoolKeys);
    if (domainMembers.size > 0) {
      requirements.push(`包含一位 ${kind}（${domainPoolKeys.join(", ")}）`);
      if (!approvers.some((login) => domainMembers.has(login) || coreMembers.has(login))) {
        missing.push(`來自 ${domainPoolKeys.join("/")} 評審池中 ${kind} 的一個核准`);
      }
    } else {
      notes.push(`目前尚無有負責人的評審池擁有這些檔案；任何具寫入權限的評審者都算作 ${kind}。`);
    }
  }

  if (policy.require_core) {
    if (coreMembers.size > 0) {
      requirements.push("包含一位核心維護者");
      if (!approvers.some((login) => coreMembers.has(login))) missing.push("來自核心維護者的一個核准");
    } else {
      requirements.push("包含一位具 admin 或 maintain 權限的維護者");
      notes.push("core-maintainers 池目前尚無負責人；改需一位具 admin 或 maintain 權限的核准者。");
      if (!approvers.some((login) => MAINTAINER_PERMISSIONS.has(permissions.get(login)))) {
        missing.push("來自具 admin 或 maintain 權限的維護者的一個核准");
      }
    }
  }

  if (changesRequestedBy.length > 0) missing.push(`${changesRequestedBy.join(", ")} 所要求變更的處理`);

  return {
    tier,
    required,
    requirement: requirements.join(", "),
    approvers,
    changesRequestedBy,
    reviewers,
    missing,
    notes,
    satisfied: missing.length === 0,
  };
}

// ---------------------------------------------------------------------------
// 檢查評估
// ---------------------------------------------------------------------------

function toRegExps(patterns = []) {
  return patterns.map((pattern) => new RegExp(pattern));
}

/** 判定一次失敗的工作流執行屬於基礎設施失敗還是貢獻失敗。 */
export function classifyFailure(check, jobs, infrastructureSteps = []) {
  if (check.failure_kind === "infrastructure") {
    return { category: "infrastructure", detail: "工作流未成功完成" };
  }
  if (!Array.isArray(jobs)) {
    return { category: "contribution", detail: "檢查回報了失敗" };
  }
  const contributionPatterns = toRegExps(check.contribution_steps);
  const infraPatterns = toRegExps(infrastructureSteps);
  const failedJobs = jobs.filter((job) => ["failure", "timed_out", "cancelled", "startup_failure"].includes(job.conclusion));
  if (failedJobs.length === 0) {
    return { category: "infrastructure", detail: "工作流在任何工作（job）執行前就已失敗" };
  }

  let infraDetail = null;
  for (const job of failedJobs) {
    if (job.conclusion !== "failure") {
      infraDetail ??= `工作（job）\`${job.name}\` ${job.conclusion.replace("_", " ")}`;
      continue;
    }
    const step = (job.steps || []).find((candidate) => candidate.conclusion === "failure");
    if (!step) {
      infraDetail ??= `工作（job）\`${job.name}\` 在步驟（step）之外失敗`;
      continue;
    }
    if (contributionPatterns.some((pattern) => pattern.test(step.name))) {
      return { category: "contribution", detail: `失敗的步驟：\`${step.name}\`` };
    }
    if (infraPatterns.some((pattern) => pattern.test(step.name))) {
      infraDetail ??= `失敗的步驟：\`${step.name}\``;
      continue;
    }
    return { category: "contribution", detail: `失敗的步驟：\`${step.name}\`` };
  }
  return { category: "infrastructure", detail: infraDetail || "工作流未成功完成" };
}

/**
 * 評估一個適用的檢查。
 * `observation` 為 {found, status, conclusion, url, jobs}。`gaveUp` 表示閘門已停止等待。
 */
export function evaluateCheck(check, observation, { gaveUp = false, infrastructureSteps = [] } = {}) {
  const base = {
    id: check.id,
    title: check.title || check.id,
    required: check.required !== false,
    url: observation?.url || null,
    hint: check.hint || null,
    category: null,
  };

  if (!observation || !observation.found) {
    if (!gaveUp) return { ...base, outcome: "pending", detail: "等待檢查開始" };
    if (check.optional) return { ...base, outcome: "skipped", detail: "此提交未回報結果" };
    return {
      ...base,
      outcome: "failure",
      category: "infrastructure",
      detail: "檢查未對此提交回報結果",
    };
  }

  if (observation.status !== "completed") {
    if (!gaveUp) return { ...base, outcome: "pending", detail: observation.status === "queued" ? "佇列中" : "執行中" };
    return { ...base, outcome: "failure", category: "infrastructure", detail: "閘門停止等待前未完成" };
  }

  switch (observation.conclusion) {
    case "success":
    case "neutral":
      return { ...base, outcome: "pass", detail: "通過" };
    case "skipped":
      if (check.optional || check.allow_skip || check.required === false) {
        return { ...base, outcome: "skipped", detail: "被其工作流略過" };
      }
      return {
        ...base,
        outcome: "failure",
        category: "infrastructure",
        detail: "被其工作流略過，因此從未驗證此提交",
      };
    case "action_required":
      return {
        ...base,
        outcome: "failure",
        category: "infrastructure",
        detail: "等待維護者核准此 PR 的工作流執行",
      };
    case "cancelled":
    case "timed_out":
    case "startup_failure":
    case "stale":
      return {
        ...base,
        outcome: "failure",
        category: "infrastructure",
        detail: `工作流 ${String(observation.conclusion).replace("_", " ")}`,
      };
    case "failure": {
      const { category, detail } = classifyFailure(check, observation.jobs, infrastructureSteps);
      return { ...base, outcome: "failure", category, detail };
    }
    default:
      return {
        ...base,
        outcome: "failure",
        category: "infrastructure",
        detail: `未預期的結論 \`${observation.conclusion}\``,
      };
  }
}

/** 將檢查結果分組為與閘門相關的區桶（buckets）。 */
export function summarizeChecks(results) {
  const failures = results.filter((result) => result.outcome === "failure");
  return {
    results,
    passed: results.filter((result) => result.outcome === "pass" || result.outcome === "skipped"),
    // 只有必需的檢查會擋住閘門；參考性（required: false）檢查永遠不會阻擋。
    pending: results.filter((result) => result.outcome === "pending" && result.required),
    advisoryPending: results.filter((result) => result.outcome === "pending" && !result.required),
    contributionFailures: failures.filter((result) => result.required && result.category === "contribution"),
    infrastructureFailures: failures.filter((result) => result.required && result.category === "infrastructure"),
    warnings: failures.filter((result) => !result.required),
  };
}

/** PR 狀態機。回傳 STATE_LABELS 中的一個值。 */
export function computeState({ automation, approvals }) {
  if (automation.contributionFailures.length > 0 || approvals.changesRequestedBy.length > 0) {
    return "requires-submitter-fixes";
  }
  if (automation.pending.length > 0 || automation.infrastructureFailures.length > 0) return "awaiting-automation";
  if (approvals.satisfied) return "approved";
  if (approvals.reviewers.length > 0) return "review-in-progress";
  return "ready-for-review";
}

/** 以人類可讀的方式說明閘門未通過的原因。 */
export function gateFailureSummary(evaluation) {
  const lines = [];
  const { automation, approvals } = evaluation;
  if (automation.contributionFailures.length > 0) {
    lines.push(`貢獻失敗：${automation.contributionFailures.map((r) => r.title).join(", ")}`);
  }
  if (automation.infrastructureFailures.length > 0) {
    lines.push(
      `基礎設施失敗（非貢獻所導致；留言 /rerun-checks 可重新執行）：${automation.infrastructureFailures
        .map((r) => r.title)
        .join(", ")}`
    );
  }
  if (automation.pending.length > 0) lines.push(`仍在等待：${automation.pending.map((r) => r.title).join(", ")}`);
  if (!approvals.satisfied) lines.push(`等待評審中（merge-risk:${evaluation.risk.tier}）：尚需 ${approvals.missing.join("; ")}`);
  return lines;
}

// ---------------------------------------------------------------------------
// 呈現
// ---------------------------------------------------------------------------

/** 中和不受信任的文字，使其可安全嵌入 markdown（提及、表格、HTML）。 */
export function sanitize(text, maxLength = 300) {
  let value = String(text ?? "")
    .replace(/@/g, "@\u200b")
    .replace(/[<>]/g, (char) => (char === "<" ? "&lt;" : "&gt;"))
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
  if (value.length > maxLength) value = `${value.slice(0, maxLength - 1)}…`;
  return value;
}

function outcomeCell(result) {
  if (result.outcome === "pass") return "✅ 通過";
  if (result.outcome === "skipped") return "⏭️ 已略過";
  if (result.outcome === "pending") return result.required ? "⏳ 等待中" : "⏳ 等待中（參考性、不阻擋）";
  if (!result.required) return "⚠️ 失敗（參考性、不阻擋）";
  return result.category === "contribution" ? "❌ 貢獻失敗" : "🔧 基礎設施失敗";
}

export function renderStatusComment(evaluation, { gateRunUrl = null } = {}) {
  const { state, risk, automation, approvals, reviewAssignment, headSha } = evaluation;
  const display = STATE_DISPLAY[state];
  const tierDescription = evaluation.tierDescription || "";
  const lines = [
    STATUS_MARKER,
    `## 🚦 提交狀態：${display.icon} ${display.text}`,
    "",
    `**風險等級：** \`merge-risk:${risk.tier}\`${tierDescription ? ` — ${tierDescription}` : ""}`,
    `**合併所需：** 通過 \`${GATE_CHECK_NAME}\` 檢查，外加 ${approvals.requirement}。`,
    "",
    "<details><summary>為何屬於此等級</summary>",
    "",
    ...risk.reasons.slice(0, 15).map((reason) => `- ${sanitize(reason, 200)}`),
    ...(risk.reasons.length > 15 ? [`- …及另外 ${risk.reasons.length - 15} 項`] : []),
    "",
    "</details>",
    "",
    "### 自動檢查",
    "",
  ];

  if (automation.results.length === 0) {
    lines.push("_沒有自動檢查適用於此 PR。_");
  } else {
    lines.push("| 檢查 | 狀態 | 詳細資訊 |", "|---|---|---|");
    for (const result of automation.results) {
      const detail = result.url ? `${sanitize(result.detail)} · [日誌](${result.url})` : sanitize(result.detail);
      lines.push(`| ${sanitize(result.title)} | ${outcomeCell(result)} | ${detail} |`);
    }
  }

  const actions = [];
  for (const result of automation.contributionFailures) {
    actions.push(`- **${sanitize(result.title)}** 失敗。${result.hint ? sanitize(result.hint, 400) : "請查看日誌以取得詳細資訊。"}`);
  }
  if (approvals.changesRequestedBy.length > 0) {
    actions.push(`- 處理 ${approvals.changesRequestedBy.map((login) => `\`${login}\``).join(", ")} 所要求的變更，然後推送更新。`);
  }
  if (automation.infrastructureFailures.length > 0) {
    actions.push(
      `- 🔧 ${automation.infrastructureFailures.map((r) => sanitize(r.title)).join(", ")} 遇到自動化問題，**並非**由你的貢獻所導致。留言 \`/rerun-checks\` 重試；若持續失敗，維護者會收到通知。`
    );
  }
  if (automation.warnings.length > 0) {
    actions.push(`- ⚠️ 參考性檢查未完成（${automation.warnings.map((r) => sanitize(r.title)).join(", ")}）。這不會阻擋此 PR。`);
  }
  if (actions.length > 0) lines.push("", "### 需要採取的行動", "", ...actions);

  const reviewerLinks = [
    ...reviewAssignment.users.map((login) => `[${sanitize(login, 60)}](https://github.com/${encodeURIComponent(login)})`),
    ...reviewAssignment.teams.map((slug) => `團隊 \`${sanitize(slug, 80)}\``),
  ];
  lines.push(
    "",
    "### 評審",
    "",
    `- **核准：** ${approvals.approvers.length}/${approvals.required}${approvals.approvers.length > 0 ? ` (${approvals.approvers.map((login) => `\`${login}\``).join(", ")})` : ""}`,
    `- **指派評審者：** ${reviewerLinks.length > 0 ? reviewerLinks.join(", ") : "尚未指派 — 留言 \`/request-review\` 即可要求指派"}`,
    `- **評審目標日期：** ${reviewAssignment.due ? sanitize(reviewAssignment.due, 40) : "未設定"}`
  );
  if (!approvals.satisfied && approvals.missing.length > 0) lines.push(`- **仍需要：** ${approvals.missing.map((item) => sanitize(item, 200)).join("; ")}`);
  for (const note of approvals.notes) lines.push(`- _${sanitize(note, 300)}_`);

  lines.push(
    "",
    "### 指令",
    "",
    "| 指令 | 執行者 | 作用 |",
    "|---|---|---|",
    "| \`/rerun-checks\` | PR 作者、維護者 | 重新執行失敗或未完成的檢查，並重新評估此閘門 |",
    "| \`/request-review\` | PR 作者、維護者 | 請評審輪值指派一位評審者（新增 \`needs-reviewer\` 標籤） |",
    "",
    `<sub>已針對 ${headSha ? `\`${headSha.slice(0, 7)}\`` : "最新提交"}${gateRunUrl ? ` · [閘門執行](${gateRunUrl})` : ""} · 此留言由系統自動維護 — 詳見 [提交閘門文件](https://github.com/github/awesome-copilot/blob/main/docs/maintainers/submission-gate.md)。</sub>`
  );
  return `${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// 指令
// ---------------------------------------------------------------------------

/**
 * 解析一個 PR 指令。指令必須位於留言開頭（與工作流的
 * 大小寫不敏感的 `startsWith` 篩選條件相符）；該行之後的內容一律忽略。
 */
export function parsePrCommand(body) {
  const match = /^\/(rerun-checks|request-review)(?:\s|$)/i.exec(String(body || ""));
  return match ? { command: match[1].toLowerCase() } : null;
}

/** 判斷留言者是否可執行 PR 指令：PR 作者或具寫入權限的使用者。 */
export function canRunPrCommand({ commenter, prAuthor, permission }) {
  if (!commenter) return false;
  if (String(commenter).toLowerCase() === String(prAuthor || "").toLowerCase()) return true;
  return WRITE_PERMISSIONS.has(permission);
}

// ---------------------------------------------------------------------------
// GitHub API 編排
// ---------------------------------------------------------------------------

function workflowFile(run) {
  return path.posix.basename(String(run.path || "").split("@")[0]);
}

/** 對每個工作流檔案，取得特定提交的最新工作流執行，僅限 PR 觸發的執行。 */
export function latestRunsByWorkflow(runs) {
  const latest = new Map();
  for (const run of runs) {
    if (!PR_EVENTS.has(run.event)) continue;
    const file = workflowFile(run);
    const previous = latest.get(file);
    const newer =
      !previous ||
      new Date(run.created_at) > new Date(previous.created_at) ||
      (run.created_at === previous.created_at && run.id > previous.id);
    if (newer) latest.set(file, run);
  }
  return latest;
}

export async function listRunsForSha(github, { owner, repo, headSha }) {
  return github.paginate(github.rest.actions.listWorkflowRunsForRepo, {
    owner,
    repo,
    head_sha: headSha,
    per_page: 100,
  });
}

export async function observeChecks(github, { owner, repo, headSha, checks }) {
  const latest = latestRunsByWorkflow(await listRunsForSha(github, { owner, repo, headSha }));
  const observations = new Map();

  for (const check of checks) {
    if (check.workflow) {
      const run = latest.get(check.workflow);
      if (!run) {
        observations.set(check.id, { found: false });
        continue;
      }
      const observation = { found: true, status: run.status, conclusion: run.conclusion, url: run.html_url, runId: run.id };
      if (run.status === "completed" && run.conclusion === "failure" && check.failure_kind !== "infrastructure") {
        observation.jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
          owner,
          repo,
          run_id: run.id,
          filter: "latest",
          per_page: 100,
        });
      }
      observations.set(check.id, observation);
    } else if (check.check_name) {
      const { data } = await github.rest.checks.listForRef({
        owner,
        repo,
        ref: headSha,
        check_name: check.check_name,
        filter: "latest",
        per_page: 100,
      });
      const checkRun = [...(data.check_runs || [])].sort(
        (a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0)
      )[0];
      if (!checkRun) {
        observations.set(check.id, { found: false });
        continue;
      }
      const observation = {
        found: true,
        status: checkRun.status,
        conclusion: checkRun.conclusion,
        url: checkRun.html_url,
      };
      if (checkRun.status === "completed" && checkRun.conclusion === "failure") {
        try {
          const { data: job } = await github.rest.actions.getJobForWorkflowRun({ owner, repo, job_id: checkRun.id });
          observation.jobs = [job];
        } catch {
          observation.jobs = undefined;
        }
      }
      observations.set(check.id, observation);
    } else {
      observations.set(check.id, { found: false });
    }
  }
  return { observations, latestRuns: latest };
}

function evaluateObservations(applicable, observations, { elapsedMs, timeoutMs, graceMs, finalized, infrastructureSteps }) {
  const found = [...observations.values()].filter((observation) => observation.found);
  const othersDone = found.every((observation) => observation.status === "completed");
  const timedOut = elapsedMs >= timeoutMs;
  const graceOver = finalized || (elapsedMs >= graceMs && othersDone);
  return applicable.map((check) => {
    const observation = observations.get(check.id);
    const gaveUp = timedOut || (!observation?.found && graceOver);
    return evaluateCheck(check, observation, { gaveUp, infrastructureSteps });
  });
}

/** 貢獻者檢查執行的 PR 工作（job）是否成功；若是，則其結果 artefact 必須存在。 */
export async function contributorResultExpected(github, { owner, repo, run }) {
  if (run?.status !== "completed" || run.conclusion !== "success") return false;
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRun, {
    owner,
    repo,
    run_id: run.id,
    filter: "latest",
    per_page: 100,
  });
  return jobs.some((job) => job.name === CONTRIBUTOR_RESULT_JOB && job.conclusion === "success");
}

/** 以 gh CLI 下載貢獻者聲望 artefact（僅能升高風險方向的訊號）。 */
export function readContributorRiskArtifact({ owner, repo, runId, headSha, token }) {
  if (!runId) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contributor-check-"));
  try {
    execFileSync(
      "gh",
      ["run", "download", String(runId), "--repo", `${owner}/${repo}`, "--name", "contributor-check-result", "--dir", dir],
      { env: { ...process.env, GH_TOKEN: token || process.env.GH_TOKEN || process.env.GITHUB_TOKEN }, stdio: "pipe", timeout: 60_000 }
    );
    const resultPath = path.join(dir, "result.json");
    if (!fs.existsSync(resultPath) || fs.statSync(resultPath).size > 64 * 1024) return null;
    const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    if (result.schema_version !== "contributor-check-result/v1" || result.head_sha !== headSha) return null;
    const risk = String(result.overall_risk || "").toUpperCase();
    return ["HIGH", "MEDIUM", "LOW", "NONE", "UNKNOWN"].includes(risk) ? risk : null;
  } catch {
    return null;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function lookupPermissions(github, { owner, repo, reviews, author }) {
  const permissions = new Map();
  const authorLogin = String(author || "").toLowerCase();
  for (const review of reviews) {
    const login = String(review.user?.login || "").toLowerCase();
    if (!login || login === authorLogin || permissions.has(login)) continue;
    try {
      const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ owner, repo, username: review.user.login });
      permissions.set(login, data.role_name === "maintain" ? "maintain" : data.permission);
    } catch {
      // 以失敗為安全：author_association（例如 COLLABORATOR）不等於具有寫入權限。
      permissions.set(login, "none");
    }
  }
  return permissions;
}

/** 已要求的評審者，加上由評審路由維護的評審期限標籤。 */
export function reviewAssignmentFrom(pr, labels) {
  const dueLabel = labels.find((label) => label.startsWith("review-due:"));
  return {
    users: (pr.requested_reviewers || []).map((user) => user.login),
    teams: (pr.requested_teams || []).map((team) => team.slug),
    due: dueLabel ? dueLabel.slice("review-due:".length) : null,
    overdue: labels.includes("review-overdue"),
    escalated: labels.includes("review-escalated"),
  };
}

/**
 * 端到端評估一個 PR。
 * @param {object} options
 * @param {boolean} [options.wait] 輪詢直到適用檢查完成（閘門模式）
 * @param {boolean|"auto"} [options.finalized] 將未回報的檢查視為最終狀態：true 用於閘門
 *   完成後（writer），"auto" 用於 head 提交的閘門執行已完成時（sweeps）
 */
export async function evaluateSubmission(github, options) {
  const {
    owner,
    repo,
    pullNumber,
    config,
    expectedHeadSha = null,
    wait = false,
    finalized = false,
    token = null,
    log = () => {},
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = () => Date.now(),
    readContributorRisk = readContributorRiskArtifact,
  } = options;

  const { data: initialPr } = await github.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  const headSha = initialPr.head.sha;
  if (expectedHeadSha && expectedHeadSha !== headSha) {
    log(`PR #${pullNumber} 的 head 是 ${headSha}，而非 ${expectedHeadSha}；較新的評估會接手處理。`);
    return { stale: true, pr: initialPr, headSha };
  }
  const files = await github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number: pullNumber, per_page: 100 });
  // listFiles 最多列出 3,000 個檔案；被截斷的清單不可信，不能用於檢查或風險判斷。
  const incompleteFiles = Number.isInteger(initialPr.changed_files) && files.length < initialPr.changed_files;
  const applicable = selectApplicableChecks(config.gate.checks, files, initialPr.base.ref);

  const waitConfig = config.gate.wait || {};
  const timeoutMs = Number(waitConfig.timeout_minutes ?? 40) * 60_000;
  const intervalMs = Number(waitConfig.interval_seconds ?? 30) * 1000;
  const graceMs = Number(waitConfig.report_grace_minutes ?? 8) * 60_000;
  const infrastructureSteps = config.gate.infrastructure_steps || [];
  const start = now();

  let results;
  let latestRuns;
  for (;;) {
    const observed = await observeChecks(github, { owner, repo, headSha, checks: applicable });
    latestRuns = observed.latestRuns;
    const elapsedMs = now() - start;
    const isFinal =
      finalized === true || (finalized === "auto" && latestRuns.get(GATE_WORKFLOW_FILE)?.status === "completed");
    results = evaluateObservations(applicable, observed.observations, {
      elapsedMs: wait ? elapsedMs : 0,
      timeoutMs: wait ? timeoutMs : Number.POSITIVE_INFINITY,
      graceMs,
      finalized: isFinal,
      infrastructureSteps,
    });
    const pending = results.filter((result) => result.outcome === "pending" && result.required);
    const blockingContribution = results.some((result) => result.required && result.category === "contribution");
    if (!wait || pending.length === 0 || blockingContribution || elapsedMs >= timeoutMs) break;
    log(`等待 ${pending.map((result) => result.title).join(", ")}`);
    await sleep(intervalMs);
  }

  // 等待後重新讀取 PR 狀態：標籤與評審可能已變更。若 head 已移動，
  // 這些結果描述的是舊提交，不可套用到新的提交。
  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  if (pr.head.sha !== headSha) {
    log(`PR 的 head 在評估期間從 ${headSha} 移動到 ${pr.head.sha}；捨棄此次評估。`);
    return { stale: true, pr, headSha };
  }
  // 適用的檢查取決於基礎分支；重新指定目標的 PR 需要一次全新的評估。
  if (pr.base.ref !== initialPr.base.ref) {
    log(`PR 的 base 在評估期間從 ${initialPr.base.ref} 變更到 ${pr.base.ref}；捨棄此次評估。`);
    return { stale: true, pr, headSha };
  }
  const labels = (pr.labels || []).map((label) => label.name);
  const reviews = await github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number: pullNumber, per_page: 100 });

  const contributorRun = latestRuns?.get("contributor-check.yml");
  let contributorRisk = null;
  if (contributorRun?.status === "completed") {
    let expected;
    try {
      expected = await contributorResultExpected(github, { owner, repo, run: contributorRun });
    } catch {
      expected = true;
    }
    contributorRisk = readContributorRisk({ owner, repo, runId: contributorRun.id, headSha, token });
    // 被略過的執行（bot 作者）沒有訊號。成功執行的 PR 工作（job）必然留下了可讀的
    // 結果；若遺失可能掩蓋 HIGH 訊號，因此以失敗為安全，直到後續的 sweep 讀取為止。
    if (contributorRisk === null && expected) {
      results.push({
        id: "contributor-risk-signal",
        title: "貢獻者風險訊號",
        required: true,
        url: contributorRun.html_url || null,
        hint: "每小時一次的 Submission Gate Writer sweep 會重試此項；若問題持續，維護者可重新執行貢獻者檢查。",
        outcome: "failure",
        category: "infrastructure",
        detail: "貢獻者檢查成功，但其結果 artefact 遺失、無法讀取，或屬於另一個提交",
      });
    }
  }

  if (incompleteFiles) {
    results.push({
      id: "changed-files",
      title: "變更檔案清單",
      required: true,
      url: null,
      hint: null,
      outcome: "failure",
      category: "infrastructure",
      detail: `GitHub 只回報了 ${initialPr.changed_files} 個變更檔案中的 ${files.length} 個；請拆分 PR，或請維護者人工評審`,
    });
  }
  const impostors = await findImpostorGateChecks(github, { owner, repo, headSha });
  if (impostors.length > 0) {
    results.push({
      id: "gate-integrity",
      title: "閘門完整性",
      required: true,
      url: impostors[0].html_url || null,
      hint: `請從此 PR 移除名為 \`${GATE_CHECK_NAME}\` 的工作流工作（job）；只有 Submission Gate Writer 可以回報該檢查。`,
      outcome: "failure",
      category: "contribution",
      detail: `此提交另回報了 ${impostors.length} 個名為 \`${GATE_CHECK_NAME}\` 的檢查執行`,
    });
  }

  const risk = classifyRisk({ files, labels, contributorRisk, tiers: config.tiers, incompleteFiles });
  if (impostors.length > 0) {
    risk.tier = "high";
    risk.reasons.unshift(`另一個工作流對此提交回報了 \`${GATE_CHECK_NAME}\` 檢查`);
  }
  const permissions = await lookupPermissions(github, { owner, repo, reviews, author: pr.user?.login });
  const approvals = evaluateApprovals({
    tier: risk.tier,
    tiers: config.tiers,
    reviews,
    author: pr.user?.login,
    permissions,
    routing: config.routing,
    files,
  });
  const automation = summarizeChecks(results);
  const state = computeState({ automation, approvals });

  return {
    stale: false,
    pr,
    headSha,
    baseRef: pr.base.ref,
    files,
    labels,
    reviewsSignature: reviewsSignature(reviews),
    riskLabelInputs: [...(config.tiers.high?.labels || [])],
    riskLabelSignature: riskLabelSignature(labels, config.tiers.high?.labels),
    risk,
    tierDescription: config.tiers[risk.tier]?.description || "",
    automation,
    approvals,
    state,
    passed: state === "approved",
    reviewAssignment: reviewAssignmentFrom(pr, labels),
    gateRun: latestRuns?.get(GATE_WORKFLOW_FILE) || null,
  };
}

/** 套用恰好一個風險標籤與一個狀態標籤，並 upsert 狀態留言。 */
export async function syncPullRequestStatus(
  github,
  { owner, repo, evaluation, gateRunUrl = null, publishCheck = false, log = () => {} }
) {
  const issueNumber = evaluation.pr.number;

  // 在寫入前最後再驗證一次，讓較慢的執行無法覆寫較新的 head 或評審狀態。
  const { data: fresh } = await github.rest.pulls.get({ owner, repo, pull_number: issueNumber });
  if (fresh.state !== "open") {
    log(`PR #${issueNumber} 已不再是開啟狀態；不再更新。`);
    return { updated: false, reason: "closed" };
  }
  if (fresh.head.sha !== evaluation.headSha) {
    log(`PR #${issueNumber} 的 head 已移動到 ${fresh.head.sha}；不套用針對 ${evaluation.headSha} 的評估。`);
    return { updated: false, reason: "head-changed" };
  }
  if (evaluation.baseRef !== undefined && fresh.base.ref !== evaluation.baseRef) {
    log(`PR #${issueNumber} 的 base 已變更到 ${fresh.base.ref}；不套用針對 ${evaluation.baseRef} 的評估。`);
    return { updated: false, reason: "base-changed" };
  }
  if (evaluation.riskLabelSignature !== undefined) {
    const freshLabels = (fresh.labels || []).map((label) => label.name);
    if (riskLabelSignature(freshLabels, evaluation.riskLabelInputs) !== evaluation.riskLabelSignature) {
      log(`PR #${issueNumber} 的風險標籤在評估期間已變更；較新的評估會更新它。`);
      return { updated: false, reason: "labels-changed" };
    }
  }
  if (evaluation.reviewsSignature !== undefined) {
    const reviews = await github.paginate(github.rest.pulls.listReviews, { owner, repo, pull_number: issueNumber, per_page: 100 });
    if (reviewsSignature(reviews) !== evaluation.reviewsSignature) {
      log(`PR #${issueNumber} 的評審在評估期間已變更；較新的評估會更新它。`);
      return { updated: false, reason: "reviews-changed" };
    }
  }

  // 先發佈權威檢查，讓強制執行從不需要等待標籤或留言。
  if (publishCheck) await publishGateCheck(github, { owner, repo, evaluation, detailsUrl: gateRunUrl, log });

  const current = new Set((fresh.labels || []).map((label) => label.name));
  // 外部插件收件（external-plugin-pr-quality-gates-writer.yml）擁有其 PR 上共享的
  // 狀態標籤；在那邊只管理風險標籤與留言。
  const manageState = !STATE_LABEL_OWNERS.some((label) => current.has(label));
  const desired = new Set([`merge-risk:${evaluation.risk.tier}`, ...(manageState ? [evaluation.state] : [])]);
  const managed = new Set([...RISK_LABELS, ...(manageState ? STATE_LABELS : [])]);

  const toAdd = [...desired].filter((label) => !current.has(label));
  const toRemove = [...current].filter((label) => managed.has(label) && !desired.has(label));
  const errors = [];
  try {
    if (toAdd.length > 0) await github.rest.issues.addLabels({ owner, repo, issue_number: issueNumber, labels: toAdd });
    for (const name of toRemove) {
      try {
        await github.rest.issues.removeLabel({ owner, repo, issue_number: issueNumber, name });
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
  } catch (error) {
    errors.push(`標籤：${error.message}`);
  }

  try {
    const body = renderStatusComment(evaluation, { gateRunUrl });
    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
    });
    const existing = comments.find(
      (comment) => comment.user?.login === "github-actions[bot]" && String(comment.body || "").includes(STATUS_MARKER)
    );
    if (existing) {
      if (existing.body !== body) await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
    } else {
      await github.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body });
    }
  } catch (error) {
    errors.push(`狀態留言：${error.message}`);
  }

  log(`PR #${issueNumber}: state=${evaluation.state} risk=${evaluation.risk.tier} (+${toAdd.join(",") || "無"} -${toRemove.join(",") || "無"})`);
  if (errors.length > 0) throw new Error(`已發佈閘門檢查，但無法同步 ${errors.join("; ")}`);
  return { updated: true };
}

/** 輸入風險分類之標籤的指紋（如 `high.labels`，例如 `needs-review:HIGH`）。 */
export function riskLabelSignature(labels, inputs = []) {
  const watched = new Set(inputs);
  return [...new Set(labels)].filter((label) => watched.has(label)).sort().join(",");
}

/** 評審清單的穩定指紋，用於偵測評估期間新到的評審。 */
export function reviewsSignature(reviews) {
  return reviews.map((review) => `${review.id}:${review.state}`).join(",");
}

async function listGateCheckRuns(github, { owner, repo, headSha }) {
  const { data } = await github.rest.checks.listForRef({
    owner,
    repo,
    ref: headSha,
    check_name: GATE_CHECK_NAME,
    filter: "all",
    per_page: 100,
  });
  return data.check_runs || [];
}

/** 該提交上名為 `submission-gate` 的檢查執行中，未由閘門寫入者發佈者。 */
export async function findImpostorGateChecks(github, { owner, repo, headSha }) {
  const runs = await listGateCheckRuns(github, { owner, repo, headSha });
  return runs.filter((run) => run.external_id !== GATE_CHECK_EXTERNAL_ID);
}

/**
 * 在 PR 的 head 提交上發佈必需的 `submission-gate` 檢查。只有可信的
 * writer 會呼叫此函式，因此無法透過編輯由 PR 控制的工作流來滿足該檢查。
 */
export async function publishGateCheck(github, { owner, repo, evaluation, detailsUrl = null, log = () => {} }) {
  const pending = evaluation.automation.pending.length > 0;
  const display = STATE_DISPLAY[evaluation.state];
  const reasons = gateFailureSummary(evaluation);
  const output = {
    title: `${display.text} · merge-risk:${evaluation.risk.tier}`,
    summary: (evaluation.passed
      ? "所有必需的檢查均已通過，且此風險等級所需的核准都已具備。"
      : reasons.map((line) => `- ${sanitize(line, 1000)}`).join("\n") || `狀態：${evaluation.state}`
    ).slice(0, 60_000),
  };
  const fields = pending
    ? { status: "in_progress", output }
    : { status: "completed", conclusion: evaluation.passed ? "success" : "failure", completed_at: new Date().toISOString(), output };
  if (detailsUrl) fields.details_url = detailsUrl;

  const runs = await listGateCheckRuns(github, { owner, repo, headSha: evaluation.headSha });
  const ours = runs.filter((run) => run.external_id === GATE_CHECK_EXTERNAL_ID).sort((a, b) => b.id - a.id);
  const impostors = runs.length > ours.length;
  // external_id 並非來源證明：任何能用 `checks: write` 執行工作流的人
  // 都可以設定它。修正任何針對失敗評估宣稱成功的副本。
  const disagreeing = evaluation.passed ? [] : ours.filter((run) => run.conclusion === "success");
  if (disagreeing.length > 0) {
    log(`正在修正 ${disagreeing.length} 個針對失敗評估回報成功的 \`${GATE_CHECK_NAME}\` 執行。`);
  }
  // 通常就地更新最新的執行；當另一個來源回報同名檢查時，
  // 建立更新的執行，讓 writer 的結果成為最新的一個。
  if (ours.length > 0 && !impostors) {
    await github.rest.checks.update({ owner, repo, check_run_id: ours[0].id, ...fields });
    for (const run of disagreeing.filter((candidate) => candidate.id !== ours[0].id)) {
      await github.rest.checks.update({ owner, repo, check_run_id: run.id, ...fields });
    }
  } else {
    await github.rest.checks.create({
      owner,
      repo,
      name: GATE_CHECK_NAME,
      head_sha: evaluation.headSha,
      external_id: GATE_CHECK_EXTERNAL_ID,
      ...fields,
    });
  }
}

/**
 * 解析 workflow_run 對應的開啟中 PR，不信任任何 artefact 內容，
 * 對應 label-pr-intent-writer.yml 的做法。回傳 PR 編號或 null。
 */
export async function resolvePullRequestForWorkflowRun(github, { owner, repo, workflowRun }) {
  const expectedBase = `${owner}/${repo}`.toLowerCase();
  const headRepository = String(workflowRun.head_repository?.full_name || "");
  const headBranch = String(workflowRun.head_branch || "");
  const [headOwner] = headRepository.split("/");
  if (!headOwner || !headBranch) return null;

  const candidates = [];
  for (const pullRequest of workflowRun.pull_requests || []) candidates.push(pullRequest.number);
  if (candidates.length === 0) {
    const open = await github.paginate(github.rest.pulls.list, {
      owner,
      repo,
      state: "open",
      head: `${headOwner}:${headBranch}`,
      per_page: 100,
    });
    for (const pullRequest of open) candidates.push(pullRequest.number);
  }

  const matches = [];
  for (const number of new Set(candidates)) {
    const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: number });
    if (
      pr.state === "open" &&
      pr.head.sha === workflowRun.head_sha &&
      String(pr.head?.ref || "") === headBranch &&
      String(pr.head?.repo?.full_name || "").toLowerCase() === headRepository.toLowerCase() &&
      String(pr.base?.repo?.full_name || "").toLowerCase() === expectedBase
    ) {
      matches.push(number);
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/** 為 head 提交重新執行失敗或未完成的 PR 工作流，然後重新評估閘門。 */
export async function rerunChecks(github, { owner, repo, headSha }) {
  const latest = latestRunsByWorkflow(await listRunsForSha(github, { owner, repo, headSha }));
  const rerun = [];
  const skipped = [];
  for (const [file, run] of latest) {
    const label = run.name || file;
    if (file === GATE_WORKFLOW_FILE) continue;
    if (run.status !== "completed") continue;
    if (run.conclusion === "action_required") {
      skipped.push({ name: label, reason: "等待維護者核准工作流執行" });
      continue;
    }
    if (!RERUNNABLE_CONCLUSIONS.has(run.conclusion)) continue;
    try {
      await github.rest.actions.reRunWorkflowFailedJobs({ owner, repo, run_id: run.id });
      rerun.push(label);
    } catch {
      try {
        await github.rest.actions.reRunWorkflow({ owner, repo, run_id: run.id });
        rerun.push(label);
      } catch (error) {
        skipped.push({ name: label, reason: `無法重新執行（${error.status || error.message}）` });
      }
    }
  }

  const gateRun = latest.get(GATE_WORKFLOW_FILE);
  if (!gateRun) {
    skipped.push({ name: "提交閘門", reason: "尚未對此提交執行" });
  } else if (gateRun.status !== "completed") {
    skipped.push({ name: gateRun.name || "提交閘門", reason: "正在執行中，會接續處理重新執行" });
  } else if (gateRun.conclusion === "action_required") {
    skipped.push({ name: gateRun.name || "提交閘門", reason: "等待維護者核准工作流執行" });
  } else {
    try {
      await github.rest.actions.reRunWorkflow({ owner, repo, run_id: gateRun.id });
      rerun.push(gateRun.name || "提交閘門");
    } catch (error) {
      skipped.push({ name: gateRun.name || "提交閘門", reason: `無法重新執行（${error.status || error.message}）` });
    }
  }
  return { rerun, skipped };
}

export const PR_COMMAND_SCHEMA = "pr-command-request/v1";
export const COMMAND_CLAIM_REACTION = "eyes";
export const COMMAND_DONE_REACTION = "rocket";

/**
 * 驗證唯讀 PR Commands 工作流上傳的不受信任 artefact。只採用其中的
 * 留言與 PR 編號；其餘一切都從 API 重新讀取。
 */
export function validatePrCommandRequest(request, { workflowRunId }) {
  const fail = (message) => {
    throw new Error(`無效的 PR 指令請求：${message}`);
  };
  if (!request || typeof request !== "object") fail("不是物件");
  if (request.schema_version !== PR_COMMAND_SCHEMA) fail("schema_version 不符預期");
  if (!Number.isSafeInteger(request.pr_number) || request.pr_number < 1) fail("pr_number 無效");
  if (!Number.isSafeInteger(request.comment_id) || request.comment_id < 1) fail("comment_id 無效");
  if (String(request.run_id ?? "") !== String(workflowRunId)) fail("run_id 與 workflow_run 不符");
  return { prNumber: request.pr_number, commentId: request.comment_id };
}

/**
 * 代可信的 PR Commands Writer 執行一個 PR 指令。從 API 重新讀取留言、PR，
 * 以及留言者的權限，因此偽造的 artefact 最多只能指向一個
 * 已經要求該指令的真實留言。
 */
export async function runPrCommand(
  github,
  { owner, repo, prNumber, commentId, config, defaultBranch = "main", log = () => {} }
) {
  const { data: comment } = await github.rest.issues.getComment({ owner, repo, comment_id: commentId });
  const issueUrlSuffix = `/repos/${owner}/${repo}/issues/${prNumber}`.toLowerCase();
  if (!String(comment.issue_url || "").toLowerCase().endsWith(issueUrlSuffix)) {
    throw new Error(`留言 ${commentId} 不屬於 #${prNumber}`);
  }
  if (comment.user?.type === "Bot") return { status: "ignored", reason: "bot 留言" };
  const parsed = parsePrCommand(comment.body);
  if (!parsed) return { status: "ignored", reason: "沒有受支援的指令" };

  // 👀 = 已接手（行動前寫入），🚀 = 已完成（僅在回覆發佈後寫入）。
  // 只有完成標記才會抑制重放，因此中途失敗的執行可以重試。
  const reactions = await github.paginate(github.rest.reactions.listForIssueComment, {
    owner,
    repo,
    comment_id: commentId,
    per_page: 100,
  });
  if (
    reactions.some(
      (reaction) => reaction.content === COMMAND_DONE_REACTION && reaction.user?.login === "github-actions[bot]"
    )
  ) {
    return { status: "ignored", reason: "已處理" };
  }

  const { data: pr } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
  if (pr.state !== "open") return { status: "ignored", reason: "PR 未開啟" };
  if (String(pr.base?.repo?.full_name || "").toLowerCase() !== `${owner}/${repo}`.toLowerCase()) {
    throw new Error(`PR #${prNumber} 的目標不是 ${owner}/${repo}`);
  }

  const commenter = comment.user?.login;
  let permission = "none";
  try {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ owner, repo, username: commenter });
    permission = data.permission;
  } catch (error) {
    log(`無法讀取 ${commenter} 的權限：${error.status || error.message}`);
  }
  if (!canRunPrCommand({ commenter, prAuthor: pr.user?.login, permission })) {
    return { status: "ignored", reason: `${commenter} 不是 PR 作者，也不是維護者` };
  }

  await github.rest.reactions.createForIssueComment({ owner, repo, comment_id: commentId, content: COMMAND_CLAIM_REACTION });

  const dispatch = async (workflowId, ref, inputs) => {
    try {
      await github.rest.actions.createWorkflowDispatch({ owner, repo, workflow_id: workflowId, ref, inputs });
      return true;
    } catch (error) {
      log(`無法觸發（dispatch）${workflowId}：${error.status || error.message}`);
      return false;
    }
  };
  const list = (items) => items.map((item) => `\`${sanitize(item, 80)}\``).join(", ");

  const lines = [];
  if (parsed.command === "rerun-checks") {
    const result = await rerunChecks(github, { owner, repo, headSha: pr.head.sha });
    await dispatch("submission-gate-writer.yml", defaultBranch, { pr_number: String(pr.number) });
    lines.push(`🔁 對 \`${pr.head.sha.slice(0, 7)}\` 執行 \`/rerun-checks\``, "");
    lines.push(result.rerun.length > 0 ? `正在重新執行：${list(result.rerun)}。` : "沒有失敗或未完成的檢查可重新執行。");
    for (const skipped of result.skipped) lines.push(`- ${sanitize(skipped.name, 80)} ${sanitize(skipped.reason, 200)}.`);
    lines.push("", "檢查完成時，狀態留言會更新。");
  } else {
    const settings = config.gate.commands?.request_review || {};
    const label = settings.label || "needs-reviewer";
    await github.rest.issues.addLabels({ owner, repo, issue_number: pr.number, labels: [label] });
    const dispatched = settings.dispatch_workflow
      ? await dispatch(settings.dispatch_workflow, settings.dispatch_ref || defaultBranch, { pr_number: String(pr.number) })
      : false;
    const requested = [
      ...(pr.requested_reviewers || []).map((user) => user.login),
      ...(pr.requested_teams || []).map((team) => team.slug),
    ];
    lines.push(
      `🙋 已新增 \`${label}\`。${dispatched ? "評審路由正在指派評審者。" : "評審路由會在下次執行時接手。"}`
    );
    if (requested.length > 0) lines.push("", `已要求：${list(requested)}。`);
  }

  await github.rest.issues.createComment({ owner, repo, issue_number: pr.number, body: lines.join("\n") });
  await github.rest.reactions.createForIssueComment({ owner, repo, comment_id: commentId, content: COMMAND_DONE_REACTION });
  return { status: "handled", command: parsed.command };
}
