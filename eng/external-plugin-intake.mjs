#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_FOLDER } from "./constants.mjs";
import { readExternalPlugins, validateExternalPlugin } from "./external-plugin-validation.mjs";

export const ISSUE_FORM_MARKER = "<!-- external-plugin-submission -->";
export const EXTERNAL_PLUGIN_INTAKE_COMMENT_MARKER = "<!-- external-plugin-intake -->";
export const RERUN_INTAKE_COMMAND = "/rerun-intake";
export const MARK_READY_FOR_REVIEW_COMMAND = "/mark-ready-for-review";
const RERUN_INTAKE_COMMAND_PATTERN = new RegExp(
  `^\\s*${RERUN_INTAKE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
  "m",
);
const MARK_READY_FOR_REVIEW_COMMAND_PATTERN = new RegExp(
  `^\\s*${MARK_READY_FOR_REVIEW_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
  "m",
);
const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

// Each entry is a Set of equivalent checklist item texts (new + legacy aliases).
// A submission passes if the checked items contain at least one text from each Set.
const REQUIRED_CHECKLIST_ITEMS = [
  new Set(["此外掛位於公開的 GitHub 儲存庫中。"]),
  new Set([
    "我提供的 ref 和/或 sha 是不可變的（發行標籤和/或完整的 40 字元提交 SHA），而不是分支。",
    // Legacy text used in the original issue template
    "我提供的 ref 是不可變的發行標籤或完整的 40 字元提交 SHA，而不是分支。",
  ]),
  new Set(["此提交遵循本儲存庫的貢獻、安全和負責任 AI 政策。"]),
  new Set(["此外掛尚未在 Awesome Copilot 市場中列出。"]),
];

const FIELD_TITLES = Object.freeze({
  pluginName: "外掛名稱",
  shortDescription: "簡短描述",
  githubRepository: "GitHub 儲存庫",
  pluginPath: "儲存庫內的外掛路徑",
  immutableRef: "待審核的 Ref",
  immutableSha: "待審核的提交 SHA",
  version: "版本",
  license: "授權識別碼",
  authorName: "作者姓名",
  authorUrl: "作者 URL",
  homepageUrl: "首頁 URL",
  keywords: "關鍵字",
  additionalNotes: "給審核者的額外附註",
  submissionChecklist: "提交核對清單",
});

// Legacy field title used in the original issue template (before the ref/sha split)
const LEGACY_FIELD_TITLES = Object.freeze({
  immutableRef: "待審核的不可變 Ref",
});

function normalizeMultilineText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n");
}

function stripNoResponse(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeMultilineText(value).trim();
  if (!normalized || normalized === "_無回應_") {
    return undefined;
  }

  return normalized;
}

function parseIssueFormSections(body) {
  const normalized = normalizeMultilineText(body);
  const sections = new Map();
  const matches = [...normalized.matchAll(/^###\s+(.+)$/gm)];

  for (let index = 0; index < matches.length; index += 1) {
    const heading = matches[index][1].trim();
    const start = matches[index].index + matches[index][0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : normalized.length;
    const content = normalized.slice(start, end).trim();
    sections.set(heading, content);
  }

  return sections;
}

function normalizeGitHubRepo(value) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const urlMatch = trimmed.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  return trimmed.replace(/^github\.com\//i, "").replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
}

function parseKeywords(value) {
  const normalized = stripNoResponse(value);
  if (!normalized) {
    return undefined;
  }

  const keywords = normalized
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return keywords.length > 0 ? keywords : undefined;
}

function parseChecklist(value) {
  const checked = new Set();
  const normalized = normalizeMultilineText(value);

  for (const match of normalized.matchAll(/^- \[(x|X)\] (.+)$/gm)) {
    checked.add(match[2].trim());
  }

  return checked;
}

function readLocalPluginNames() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    return [];
  }

  return fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function toSubmissionError(message) {
  return message.replace(/^external\.json\[0\]:\s*/, "提交： ");
}

async function fetchGitHubJson(apiPath, token) {
  const response = await fetch(`https://api.github.com${apiPath}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "awesome-copilot-external-plugin-intake",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 404) {
    return { ok: false, status: 404, data: null };
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

function encodeRepoPath(repo) {
  const [owner, name] = String(repo).split("/");
  return `${encodeURIComponent(owner ?? "")}/${encodeURIComponent(name ?? "")}`;
}

async function validateRemoteRepository(repo, { ref, sha }, errors, warnings, token) {
  const encodedRepo = encodeRepoPath(repo);
  const repositoryResponse = await fetchGitHubJson(`/repos/${encodedRepo}`, token);

  if (!repositoryResponse.ok) {
    if (repositoryResponse.status === 404) {
      errors.push(`提交：找不到 GitHub 儲存庫 "${repo}"`);
    } else {
      errors.push(`提交：無法檢查 GitHub 儲存庫 "${repo}" (HTTP ${repositoryResponse.status})`);
    }
    return;
  }

  if (repositoryResponse.data?.private) {
    errors.push(`提交：GitHub 儲存庫 "${repo}" 必須是公開的`);
  }

  if (repositoryResponse.data?.archived) {
    warnings.push(`提交：GitHub 儲存庫 "${repo}" 已封存`);
  }

  if (sha) {
    if (/^[0-9a-f]{40}$/i.test(sha)) {
      const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/commits/${encodeURIComponent(sha)}`, token);
      if (!commitResponse.ok) {
        errors.push(`提交：在 GitHub 儲存庫 "${repo}" 中找不到提交 "${sha}"`);
      }
    }
  }

  if (!ref) {
    return;
  }

  if (/^[0-9a-f]{40}$/i.test(ref)) {
    const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/commits/${encodeURIComponent(ref)}`, token);
    if (!commitResponse.ok) {
      errors.push(`提交：在 GitHub 儲存庫 "${repo}" 中找不到提交 "${ref}"`);
    }
    return;
  }

  if (ref.startsWith("refs/heads/") || ["main", "master", "develop", "development", "dev", "trunk"].includes(ref)) {
    return;
  }

  if (ref.startsWith("refs/") && !ref.startsWith("refs/tags/")) {
    return;
  }

  const tagName = ref.startsWith("refs/tags/") ? ref.slice("refs/tags/".length) : ref;
  const tagResponse = await fetchGitHubJson(`/repos/${encodedRepo}/git/ref/tags/${encodeURIComponent(tagName)}`, token);

  if (tagResponse.ok) {
    return;
  }

  if (/^[0-9a-f]+$/i.test(ref) && ref.length !== 40) {
    errors.push('提交：「待審核的 Ref」中的提交 SHA 必須使用完整的 40 字元 SHA，或者在「待審核的提交 SHA」中提交');
    return;
  }

  if (!tagResponse.ok) {
    errors.push(`提交：在 GitHub 儲存庫 "${repo}" 中找不到標籤 "${ref}"`);
  }
}

export function parseExternalPluginIssueBody(body) {
  const sections = parseIssueFormSections(body);
  const errors = [];

  function requiredField(title) {
    const value = stripNoResponse(sections.get(title));
    if (!value) {
      errors.push(`提交：必須填寫 "${title}"`);
    }
    return value;
  }

  const pluginName = requiredField(FIELD_TITLES.pluginName);
  const shortDescription = requiredField(FIELD_TITLES.shortDescription);
  const repoInput = normalizeGitHubRepo(requiredField(FIELD_TITLES.githubRepository));
  // Support both the current field title and the legacy title used before the ref/sha split
  const immutableRef = stripNoResponse(
    sections.get(FIELD_TITLES.immutableRef) ?? sections.get(LEGACY_FIELD_TITLES.immutableRef),
  );
  const immutableSha = stripNoResponse(sections.get(FIELD_TITLES.immutableSha));
  const version = requiredField(FIELD_TITLES.version);
  const license = requiredField(FIELD_TITLES.license);
  const authorName = requiredField(FIELD_TITLES.authorName);

  const pluginPath = stripNoResponse(sections.get(FIELD_TITLES.pluginPath));
  const authorUrl = stripNoResponse(sections.get(FIELD_TITLES.authorUrl));
  const homepageUrl = stripNoResponse(sections.get(FIELD_TITLES.homepageUrl));
  const keywords = parseKeywords(sections.get(FIELD_TITLES.keywords));
  const additionalNotes = stripNoResponse(sections.get(FIELD_TITLES.additionalNotes));
  const checkedItems = parseChecklist(sections.get(FIELD_TITLES.submissionChecklist));

  if (!immutableRef && !immutableSha) {
    errors.push(`提交：必須提供 "${FIELD_TITLES.immutableRef}" 或 "${FIELD_TITLES.immutableSha}" 其中之一`);
  }

  for (const equivalents of REQUIRED_CHECKLIST_ITEMS) {
    let isChecked = false;
    for (const text of equivalents) {
      if (checkedItems.has(text)) {
        isChecked = true;
        break;
      }
    }
    if (!isChecked) {
      // Report using the canonical (first) text in each equivalents Set
      const [canonical] = equivalents;
      errors.push(`提交：必須勾選核對清單項目： "${canonical}"`);
    }
  }

  const plugin = {
    name: pluginName,
    description: shortDescription,
    version,
    author: {
      name: authorName,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    repository: repoInput ? `https://github.com/${repoInput}` : undefined,
    ...(homepageUrl ? { homepage: homepageUrl } : {}),
    ...(license ? { license } : {}),
    ...(keywords ? { keywords } : {}),
    source: {
      source: "github",
      repo: repoInput,
      ...(pluginPath ? { path: pluginPath } : {}),
      ...(immutableRef ? { ref: immutableRef } : {}),
      ...(immutableSha ? { sha: immutableSha } : {}),
    },
  };

  return {
    markerPresent: normalizeMultilineText(body).includes(ISSUE_FORM_MARKER),
    errors,
    plugin,
    additionalNotes,
  };
}

export function parseRerunIntakeCommand(body) {
  return RERUN_INTAKE_COMMAND_PATTERN.test(String(body ?? ""));
}

export function parseMarkReadyForReviewCommand(body) {
  const text = String(body ?? "");
  if (!MARK_READY_FOR_REVIEW_COMMAND_PATTERN.test(text)) {
    return undefined;
  }

  const commandLine = text.split(/\r?\n/).find((line) => MARK_READY_FOR_REVIEW_COMMAND_PATTERN.test(line));
  const reason = commandLine?.replace(MARK_READY_FOR_REVIEW_COMMAND_PATTERN, "").trim();

  return {
    command: MARK_READY_FOR_REVIEW_COMMAND,
    reason: reason || undefined,
  };
}

function normalizeQualityGateResult(rawResult) {
  const defaults = {
    overall_status: "not_run",
    skill_validator_status: "not_run",
    smoke_status: "not_run",
    failure_class: "none",
    summary: "",
    skill_validator_output: "",
    smoke_output: "",
  };

  if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
    return defaults;
  }

  return {
    ...defaults,
    ...rawResult,
  };
}

function buildQualityGatesCommentSection(qualityResult) {
  const skillState = qualityResult.skill_validator_status || "not_run";
  const smokeState = qualityResult.smoke_status || "not_run";
  const summaryText = String(qualityResult.summary || "").trim() || "_未提供品質門禁詳細資訊。_";

  const sections = [
    "### 品質門禁摘要",
    "",
    "| 門禁 | 狀態 |",
    "|---|---|",
    `| skill-validator | ${skillState} |`,
    `| 安裝冒煙測試 | ${smokeState} |`,
    "",
    summaryText,
  ];

  const skillOutput = String(qualityResult.skill_validator_output || "").trim();
  if (skillOutput) {
    sections.push(
      "",
      "<details>",
      "<summary>skill-validator 輸出</summary>",
      "",
      "```text",
      skillOutput,
      "```",
      "",
      "</details>",
    );
  }

  const smokeOutput = String(qualityResult.smoke_output || "").trim();
  if (smokeOutput) {
    sections.push(
      "",
      "<details>",
      "<summary>安裝冒煙測試輸出</summary>",
      "",
      "```text",
      smokeOutput,
      "```",
      "",
      "</details>",
    );
  }

  return sections.join("\n");
}

function getIntakeStateFromQualityResult(baseResult, qualityResult) {
  if (!baseResult.valid) {
    return "rejected";
  }

  if (qualityResult.failure_class === "submitter_fixes") {
    return "requires-submitter-fixes";
  }

  if (qualityResult.failure_class === "infra") {
    return "awaiting-review";
  }

  return "ready-for-review";
}

function buildMergedIntakeComment(baseResult, qualityResult) {
  if (!baseResult.valid) {
    return baseResult.commentBody;
  }

  const marker = baseResult.commentMarker ?? EXTERNAL_PLUGIN_INTAKE_COMMENT_MARKER;
  const qualitySection = buildQualityGatesCommentSection(qualityResult);

  const intro =
    qualityResult.failure_class === "submitter_fixes"
      ? "## ⚠️ 外部外掛引入需要提交者修復"
      : qualityResult.failure_class === "infra"
        ? "## ⚠️ 外部外掛引入無法完成品質檢查"
        : "## ✅ 外部外掛引入通過";

  const statusLine =
    qualityResult.failure_class === "submitter_fixes"
      ? "此提交已通過中繼資料驗證，但品質門禁發現了在進入維護者審核之前必須修復的問題。請更新問題詳細資訊或來源外掛，然後留言 `/rerun-intake`。"
      : qualityResult.failure_class === "infra"
        ? "此提交已通過中繼資料驗證，但自動化品質檢查遇到了基礎架構問題。維護者應重新執行引入，或在審核後使用明確的覆蓋指令。"
        : "此提交已通過自動化引入驗證和品質檢查，準備好供維護者審核。";

  return [
    marker,
    intro,
    "",
    statusLine,
    "",
    `- **外掛：** ${baseResult.plugin?.name ?? "未知"}`,
    `- **儲存庫：** ${baseResult.plugin?.repository ?? "未知"}`,
    baseResult.plugin?.source?.ref ? `- **Ref：** ${baseResult.plugin.source.ref}` : undefined,
    baseResult.plugin?.source?.sha ? `- **SHA：** ${baseResult.plugin.source.sha}` : undefined,
    "",
    qualitySection,
    "",
    "### 標準 external.json 有效載荷",
    "",
    "```json",
    JSON.stringify(baseResult.plugin ?? {}, null, 2),
    "```",
    baseResult.warnings?.length
      ? ["", "### 警告", "", ...baseResult.warnings.map((warning) => `- ${warning}`)].join("\n")
      : "",
  ].filter(Boolean).join("\n");
}

export function applyQualityGateResult(baseEvaluation, qualityGateResult) {
  const baseResult = typeof baseEvaluation === "string" ? JSON.parse(baseEvaluation) : baseEvaluation;
  const qualityResult = normalizeQualityGateResult(
    typeof qualityGateResult === "string" ? JSON.parse(qualityGateResult) : qualityGateResult,
  );
  const intakeState = getIntakeStateFromQualityResult(baseResult, qualityResult);

  return {
    ...baseResult,
    qualityGates: qualityResult,
    intakeState,
    commentBody: buildMergedIntakeComment(baseResult, qualityResult),
  };
}

export async function evaluateExternalPluginIssue({ issue, token } = {}) {
  const issueBody = issue?.body ?? "";
  const parsed = parseExternalPluginIssueBody(issueBody);
  const errors = [...parsed.errors];
  const warnings = [];

  const localPluginNames = readLocalPluginNames();
  const { plugins: existingExternalPlugins } = readExternalPlugins({ policy: "marketplace" });
  const duplicateNames = [
    ...localPluginNames,
    ...existingExternalPlugins.map((plugin) => plugin.name).filter(Boolean),
  ];

  const validationResult = validateExternalPlugin(parsed.plugin, 0, { policy: "publicSubmission" });
  errors.push(...validationResult.errors.map(toSubmissionError));
  warnings.push(...validationResult.warnings.map(toSubmissionError));

  if (parsed.plugin?.name) {
    const matchingName = duplicateNames.find(
      (name) => String(name).toLowerCase() === String(parsed.plugin.name).toLowerCase(),
    );
    if (matchingName) {
      errors.push(`提交：外掛名稱 "${parsed.plugin.name}" 與現有的外掛 "${matchingName}" 衝突`);
    }
  }

  if (parsed.plugin?.source?.repo && (parsed.plugin?.source?.ref || parsed.plugin?.source?.sha)) {
    await validateRemoteRepository(parsed.plugin.source.repo, parsed.plugin.source, errors, warnings, token);
  }

  const dedupedErrors = [...new Set(errors)];
  const dedupedWarnings = [...new Set(warnings)];
  const valid = dedupedErrors.length === 0;
  const marker = EXTERNAL_PLUGIN_INTAKE_COMMENT_MARKER;
  const normalizedKeywords = parsed.plugin?.keywords?.length ? parsed.plugin.keywords.join(", ") : "_未提供_";
  const notes = parsed.additionalNotes ?? "_未提供額外附註。_";
  const payload = parsed.plugin
    ? [
        "```json",
        JSON.stringify(parsed.plugin, null, 2),
        "```",
      ].join("\n")
    : "```json\n{}\n```";

  const commentBody = valid
    ? [
        marker,
        "## ✅ 外部外掛引入通過",
        "",
        `此提交已通過自動化引入驗證，準備好供維護者審核。`,
        "",
        `- **外掛：** ${parsed.plugin.name}`,
        `- **儲存庫：** ${parsed.plugin.repository}`,
        parsed.plugin.source.ref ? `- **Ref：** ${parsed.plugin.source.ref}` : undefined,
        parsed.plugin.source.sha ? `- **SHA：** ${parsed.plugin.source.sha}` : undefined,
        `- **關鍵字：** ${normalizedKeywords}`,
        "",
        "### 標準 external.json 有效載荷",
        "",
        payload,
        "",
        "### 審核者附註",
        "",
        notes,
        dedupedWarnings.length > 0
          ? ["", "### 警告", "", ...dedupedWarnings.map((warning) => `- ${warning}`)].join("\n")
          : "",
      ].filter(Boolean).join("\n")
    : [
        marker,
        "## ❌ 外部外掛引入失敗",
        "",
        "此提交未通過自動化引入驗證，因此該問題已關閉。",
        `請編輯問題表單以解決下方的修復事項，然後讓問題作者或維護者留言 \`${RERUN_INTAKE_COMMAND}\` 以針對此已關閉的提交重新執行引入。`,
        "",
        "### 必要的修復",
        "",
        ...dedupedErrors.map((error) => `- ${error}`),
        dedupedWarnings.length > 0
          ? ["", "### 警告", "", ...dedupedWarnings.map((warning) => `- ${warning}`)].join("\n")
          : "",
      ].filter(Boolean).join("\n");

  return {
    valid,
    intakeState: valid ? "ready-for-review" : "rejected",
    markerPresent: parsed.markerPresent,
    errors: dedupedErrors,
    warnings: dedupedWarnings,
    plugin: parsed.plugin,
    commentBody,
    commentMarker: marker,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  const eventPath = process.argv[2];
  if (!eventPath) {
    console.error("Usage: node ./eng/external-plugin-intake.mjs <github-event.json>");
    process.exit(1);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const result = await evaluateExternalPluginIssue({ issue: event.issue, token: process.env.GITHUB_TOKEN });
  process.stdout.write(JSON.stringify(result));
}
