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

// 每一項都是一個等效檢查清單項目文字的 Set (新 + 舊別名)。
// 如果勾選的項目至少包含每個 Set 中的一個文字，則提交通過。
const REQUIRED_CHECKLIST_ITEMS = [
  new Set(["The plugin lives in a public GitHub repository."]),
  new Set([
    "The ref and/or sha I provided is immutable (release tag and/or full 40-character commit SHA), not a branch.",
    // 原始 Issue 範本中使用的舊文字
    "The ref I provided is an immutable release tag or full 40-character commit SHA, not a branch.",
  ]),
  new Set(["This submission follows this repository's contribution, security, and responsible AI policies."]),
  new Set(["This plugin is not already listed in the Awesome Copilot marketplace."]),
];

const FIELD_TITLES = Object.freeze({
  pluginName: "外掛程式名稱",
  shortDescription: "簡短描述",
  githubRepository: "GitHub 儲存庫",
  pluginPath: "儲存庫內的外掛程式路徑",
  immutableRef: "待審核的 Ref",
  immutableSha: "待審核的 Commit SHA",
  version: "版本",
  license: "授權標識符",
  authorName: "作者姓名",
  authorUrl: "作者 URL",
  homepageUrl: "首頁 URL",
  keywords: "關鍵字",
  additionalNotes: "給審核者的補充說明",
  submissionChecklist: "提交檢查清單",
});

// 原始 Issue 範本中使用的舊欄位標題 (在 ref/sha 分拆之前)
const LEGACY_FIELD_TITLES = Object.freeze({
  immutableRef: "待審核的固定 Ref",
});
const EXTERNAL_CANVAS_KEYWORD = "canvas";
const EXTERNAL_CANVAS_PREVIEW_PATH = "assets/preview.png";
const EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS = Object.freeze([
  ".github/plugin/plugin.json",
  ".plugin/plugin.json",
  "plugin.json",
]);

function normalizeMultilineText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n");
}

function stripNoResponse(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = normalizeMultilineText(value).trim();
  if (!normalized || normalized === "_No response_") {
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

function hasCanvasKeyword(plugin) {
  return (plugin?.keywords ?? []).some(
    (keyword) => String(keyword).trim().toLowerCase() === EXTERNAL_CANVAS_KEYWORD,
  );
}

function normalizeRepoRelativePath(value) {
  const normalized = stripNoResponse(value);
  if (!normalized || normalized === "/") {
    return "";
  }

  return normalized.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

function joinRepoPath(...segments) {
  return segments
    .map((segment) => String(segment ?? "").trim())
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/");
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
  return message.replace(/^external\.json\[0\]:\s*/, "submission: ");
}

function isGitHubRateLimitResponse(response, data) {
  if (response.status === 429 || response.status === 503) {
    return true;
  }

  if (response.status !== 403) {
    return false;
  }

  const message = String(data?.message ?? "").toLowerCase();
  return (
    response.headers.get("retry-after") !== null ||
    response.headers.get("x-ratelimit-remaining") === "0" ||
    message.includes("rate limit") ||
    message.includes("secondary rate limit")
  );
}

function getGitHubApiErrorReason(response, data) {
  const message = String(data?.message ?? "").toLowerCase();

  if (response.status === 429) {
    return "已達到速率限制";
  }

  if (response.status === 503) {
    if (message.includes("secondary rate limit")) {
      return "已達到次要速率限制";
    }
    return "服務無法使用";
  }

  if (response.status === 403 && isGitHubRateLimitResponse(response, data)) {
    if (message.includes("secondary rate limit")) {
      return "已達到次要速率限制";
    }
    return "已達到速率限制";
  }

  if (response.status === 0) {
    return "網路錯誤";
  }

  return response.statusText || `HTTP ${response.status}`;
}

async function fetchGitHubJson(apiPath, token) {
  try {
    const response = await fetch(`https://api.github.com${apiPath}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "awesome-copilot-external-plugin-intake",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.ok) {
      return { kind: "found", ok: true, status: response.status, data };
    }

    if (response.status === 404) {
      return { kind: "notFound", ok: false, status: 404, data: null };
    }

    return {
      kind: "apiError",
      ok: false,
      status: response.status,
      data,
      reason: getGitHubApiErrorReason(response, data),
    };
  } catch (error) {
    return {
      kind: "apiError",
      ok: false,
      status: 0,
      data: null,
      reason: "網路錯誤",
      error,
    };
  }
}

function encodeRepoContentPath(value) {
  return String(value)
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function fetchGitHubFile(repo, filePath, ref, token) {
  const encodedRepo = encodeRepoPath(repo);
  const encodedPath = encodeRepoContentPath(filePath);
  return fetchGitHubJson(
    `/repos/${encodedRepo}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`,
    token,
  );
}

function decodeGitHubFileContent(fileResponse) {
  const encodedContent = fileResponse?.data?.content;
  if (!encodedContent || typeof encodedContent !== "string") {
    return null;
  }

  const normalized = encodedContent.replace(/\n/g, "");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function encodeRepoPath(repo) {
  const [owner, name] = String(repo).split("/");
  return `${encodeURIComponent(owner ?? "")}/${encodeURIComponent(name ?? "")}`;
}

async function validateRemoteRepository(repo, { ref, sha }, errors, warnings, token) {
  const encodedRepo = encodeRepoPath(repo);
  const repositoryResponse = await fetchGitHubJson(`/repos/${encodedRepo}`, token);

  if (repositoryResponse.kind === "notFound") {
    errors.push(`submission: 找不到 GitHub 儲存庫 "${repo}"`);
    return;
  }

  if (repositoryResponse.kind === "apiError") {
    const statusText = repositoryResponse.status ? `HTTP ${repositoryResponse.status}` : "網路錯誤";
    warnings.push(
      `submission: 無法驗證 GitHub 儲存庫 "${repo}" (${statusText}${repositoryResponse.reason ? ` — ${repositoryResponse.reason}` : ""}); 維護者應重新執行 intake`,
    );
    return;
  }

  if (repositoryResponse.data?.private) {
    errors.push(`submission: GitHub 儲存庫 "${repo}" 必須是公開的`);
  }

  if (repositoryResponse.data?.archived) {
    warnings.push(`submission: GitHub 儲存庫 "${repo}" 已封存`);
  }

  if (sha) {
    if (/^[0-9a-f]{40}$/i.test(sha)) {
      const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/git/commits/${encodeURIComponent(sha)}`, token);
      if (commitResponse.kind === "notFound") {
        errors.push(`submission: 在 GitHub 儲存庫 "${repo}" 中找不到 Commit "${sha}"`);
      } else if (commitResponse.kind === "apiError") {
        const statusText = commitResponse.status ? `HTTP ${commitResponse.status}` : "網路錯誤";
        warnings.push(
          `submission: 無法驗證 GitHub 儲存庫 "${repo}" 中的 Commit "${sha}" (${statusText}${commitResponse.reason ? ` — ${commitResponse.reason}` : ""}); 維護者應重新執行 intake`,
        );
      }
    }
  }

  if (!ref) {
    return;
  }

  if (/^[0-9a-f]{40}$/i.test(ref)) {
    const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/git/commits/${encodeURIComponent(ref)}`, token);
    if (commitResponse.kind === "notFound") {
      errors.push(`submission: 在 GitHub 儲存庫 "${repo}" 中找不到 Commit "${ref}"`);
    } else if (commitResponse.kind === "apiError") {
      const statusText = commitResponse.status ? `HTTP ${commitResponse.status}` : "網路錯誤";
      warnings.push(
        `submission: 無法驗證 GitHub 儲存庫 "${repo}" 中的 Commit "${ref}" (${statusText}${commitResponse.reason ? ` — ${commitResponse.reason}` : ""}); 維護者應重新執行 intake`,
      );
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

  if (tagResponse.kind === "found") {
    return;
  }

  if (/^[0-9a-f]+$/i.test(ref) && ref.length !== 40) {
    errors.push('submission: "待審核的 Ref" 中的 Commit SHA 必須使用完整的 40 字元 SHA，或在 "待審核的 Commit SHA" 中提交');
    return;
  }

  if (tagResponse.kind === "notFound") {
    errors.push(`submission: 在 GitHub 儲存庫 "${repo}" 中找不到標籤 "${ref}"`);
  } else if (tagResponse.kind === "apiError") {
    const statusText = tagResponse.status ? `HTTP ${tagResponse.status}` : "網路錯誤";
    warnings.push(
      `submission: 無法驗證 GitHub 儲存庫 "${repo}" 中的標籤 "${ref}" (${statusText}${tagResponse.reason ? ` — ${tagResponse.reason}` : ""}); 維護者應重新執行 intake`,
    );
  }
}

async function validateCanvasPluginMetadata(plugin, errors, warnings, token) {
  const repo = plugin?.source?.repo;
  const sha = plugin?.source?.sha;
  const ref = plugin?.source?.ref;
  const releaseLocator = sha || ref;
  const releaseLocatorDescription = sha ? `commit "${sha}"` : `ref "${ref}"`;
  const pluginRoot = normalizeRepoRelativePath(plugin?.source?.path);

  if (!releaseLocator) {
    errors.push('submission: 帶有"canvas"標籤的插件必須提供"Ref to review"和/或"Commit SHA to review"。');
    return;
  }

  if (!repo) {
    return;
  }

  let manifest = null;
  let manifestPath = null;
  let sawManifestApiError = false;

  const manifestCandidates = EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS.map((relativePath) =>
    joinRepoPath(pluginRoot, relativePath),
  );

  for (const candidatePath of manifestCandidates) {
    const response = await fetchGitHubFile(repo, candidatePath, releaseLocator, token);
    if (response.kind === "notFound") {
      continue;
    }

    if (response.kind === "apiError") {
      sawManifestApiError = true;
      continue;
    }

    if (response.data?.type !== "file") {
      continue;
    }

    const decoded = decodeGitHubFileContent(response);
    if (!decoded) {
      errors.push(`submission: 無法解碼插件清單 "${candidatePath}" at ${releaseLocatorDescription}`);
      return;
    }

    try {
      manifest = JSON.parse(decoded);
      manifestPath = candidatePath;
      break;
    } catch (error) {
      errors.push(
        `submission: 插件清單 "${candidatePath}" 位於 ${releaseLocatorDescription} 處，不是有效的 JSON (${error.message})`,
      );
      return;
    }
  }

  if (!manifest) {
    if (sawManifestApiError) {
      warnings.push(
        `submission: 無法驗證 GitHub 倉庫 "${repo}" 中位於 ${releaseLocatorDescription} 的 canvas 插件清單；維護者應重新執行 intake 指令。`,
      );
      return;
    }

    const expectedPaths = manifestCandidates.map((candidatePath) => `"${candidatePath}"`).join(", ");
    errors.push(
      `submission: 帶有 "canvas" 標籤的插件必須在 ${releaseLocatorDescription} 中的 ${expectedPaths} 之一包含清單檔案`,
    );
    return;
  }

  if (manifest.logo !== EXTERNAL_CANVAS_PREVIEW_PATH) {
    errors.push(
      `submission: 帶有 "canvas" 標籤的插件必須在 ${releaseLocatorDescription} 中的 ${expectedPaths} 之一包含清單檔案。`,
    );
  }

  const previewPath = joinRepoPath(pluginRoot, EXTERNAL_CANVAS_PREVIEW_PATH);
  const previewResponse = await fetchGitHubFile(repo, previewPath, releaseLocator, token);
  if (previewResponse.kind === "notFound") {
    errors.push(
      `submission: 帶有 "canvas "標籤的插件必須在 ${releaseLocatorDescription} 處包含 "${EXTERNAL_CANVAS_PREVIEW_PATH}"。`,
    );
  } else if (previewResponse.kind === "apiError") {
    warnings.push(
      `submission: 無法驗證 GitHub 倉庫 "${repo}" 中位於 ${releaseLocatorDescription} 的 "${EXTERNAL_CANVAS_PREVIEW_PATH}"；維護者應重新執行 intake`
    );
  } else if (previewResponse.data?.type !== "file") {
    errors.push(
      `submission: "${EXTERNAL_CANVAS_PREVIEW_PATH}" 必須是 ${releaseLocatorDescription} 中的一個文件`,
    );
  }
}

export function parseExternalPluginIssueBody(body) {
  const sections = parseIssueFormSections(body);
  const errors = [];

  function requiredField(title) {
    const value = stripNoResponse(sections.get(title));
    if (!value) {
      errors.push(`submission: "${title}" 為必填項目`);
    }
    return value;
  }

  const pluginName = requiredField(FIELD_TITLES.pluginName);
  const shortDescription = requiredField(FIELD_TITLES.shortDescription);
  const repoInput = normalizeGitHubRepo(requiredField(FIELD_TITLES.githubRepository));
  // 同時支援目前的欄位標題以及 ref/sha 分拆之前的舊標題
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
    errors.push(`submission: "${FIELD_TITLES.immutableRef}" 或 "${FIELD_TITLES.immutableSha}" 其中之一為必填`);
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
      // 使用每個等效 Set 中的規範 (第一個) 文字進行回報
      const [canonical] = equivalents;
      errors.push(`submission: 檢查清單項目必須勾選: "${canonical}"`);
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
    vally_lint_status: "not_run",
    smoke_status: "not_run",
    version_match_status: "not_run",
    failure_class: "none",
    summary: "",
    vally_lint_output: "",
    smoke_output: "",
    version_match_output: "",
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
  const vallyState = qualityResult.vally_lint_status || "not_run";
  const smokeState = qualityResult.smoke_status || "not_run";
  const versionMatchState = qualityResult.version_match_status || "not_run";
  const summaryText = String(qualityResult.summary || "").trim() || "_未提供品質閘門 (quality gate) 詳細資訊。_";

  const sections = [
    "### 品質閘門摘要",
    "",
    "| 閘門 | 狀態 |",
    "|---|---|",
    `| vally lint | ${vallyState} |`,
    `| 安裝冒煙測試 | ${smokeState} |`,
    `| 版本匹配 | ${versionMatchState} |`,
    "",
    summaryText,
  ];

  const vallyOutput = String(qualityResult.vally_lint_output || "").trim();
  if (vallyOutput) {
    sections.push(
      "",
      "<details>",
      "<summary>vally lint 輸出</summary>",
      "",
      "```text",
      vallyOutput,
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
      "<summary>安裝冒煙測試 (smoke test) 輸出</summary>",
      "",
      "```text",
      smokeOutput,
      "```",
      "",
      "</details>",
    );
  }

  const versionMatchOutput = String(qualityResult.version_match_output || "").trim();
  if (versionMatchOutput) {
    sections.push(
      "",
      "<details>",
      "<summary>版本匹配 (version match) 輸出</summary>",
      "",
      "```text",
      versionMatchOutput,
      "```",
      "",
      "</details>",
    );
  }

  return sections.join("\n");
}

function getIntakeStateFromQualityResult(baseResult, qualityResult) {
  if (!baseResult.valid) {
    return "requires-submitter-fixes";
  }

  if (qualityResult.failure_class === "submitter_fixes") {
    return "requires-submitter-fixes";
  }

  if (qualityResult.failure_class === "infra") {
    return "awaiting-review";
  }

  return "ready-for-review";
}

function buildMergedIntakeComment(baseResult, qualityResult, runId, owner, repo) {
  if (!baseResult.valid) {
    return baseResult.commentBody;
  }

  const marker = baseResult.commentMarker ?? EXTERNAL_PLUGIN_INTAKE_COMMENT_MARKER;
  const qualitySection = buildQualityGatesCommentSection(qualityResult);
  const runLink = runId && owner && repo ? `_[查看工作流程執行狀況](https://github.com/${owner}/${repo}/actions/runs/${runId})_` : "";

  const intro =
    qualityResult.failure_class === "submitter_fixes"
      ? "## ⚠️ 外部外掛程式攝取需要提交者修正"
      : qualityResult.failure_class === "infra"
        ? "## ⚠️ 外部外掛程式攝取無法完成品質檢查"
        : "## ✅ 外部外掛程式攝取已通過";

  const statusLine =
    qualityResult.failure_class === "submitter_fixes"
      ? "此提交已通過中繼資料驗證，但品質閘門發現必須在進行維護者審核之前修正的問題。請更新 Issue 詳細資訊或來源外掛程式，然後留言 `/rerun-intake`。"
      : qualityResult.failure_class === "infra"
        ? "此提交已通過中繼資料驗證，但自動品質檢查遇到基礎設施問題。維護者應重新執行攝取，或在審核後使用明確的覆蓋 (override) 指令。"
        : "此提交已通過自動攝取驗證和品質檢查，已準備好供維護者審核。";

  return [
    marker,
    intro,
    "",
    statusLine,
    "",
    `- **外掛程式:** ${baseResult.plugin?.name ?? "未知"}`,
    `- **儲存庫:** ${baseResult.plugin?.repository ?? "未知"}`,
    baseResult.plugin?.source?.ref ? `- **Ref:** [\`${baseResult.plugin.source.ref.replaceAll('\`', '\\\`')}\`](https://github.com/${encodeRepoPath(baseResult.plugin.source.repo)}/tree/${encodeURIComponent(baseResult.plugin.source.ref).replaceAll("%2F", "/")})` : undefined,
    baseResult.plugin?.source?.sha ? `- **SHA:** [\`${baseResult.plugin.source.sha.replaceAll('\`', '\\\`')}\`](https://github.com/${encodeRepoPath(baseResult.plugin.source.repo)}/tree/${encodeURIComponent(baseResult.plugin.source.sha).replaceAll("%2F", "/")})` : undefined,
    "",
    qualitySection,
    "",
    "",
    "### 規範 external.json 內容 (payload)",
    "",
    "",
    "```json",
    JSON.stringify(baseResult.plugin ?? {}, null, 2),
    "```",
    baseResult.warnings?.length
      ? ["", "### 警告", "", ...baseResult.warnings.map((warning) => `- ${warning}`)].join("\n")
      : "",
    runLink ? `\n${runLink}` : "",
  ].join("\n");
}

export function applyQualityGateResult(baseEvaluation, qualityGateResult, runId, owner, repo) {
  const baseResult = typeof baseEvaluation === "string" ? JSON.parse(baseEvaluation) : baseEvaluation;
  const qualityResult = normalizeQualityGateResult(
    typeof qualityGateResult === "string" ? JSON.parse(qualityGateResult) : qualityGateResult,
  );
  const intakeState = getIntakeStateFromQualityResult(baseResult, qualityResult);

  return {
    ...baseResult,
    qualityGates: qualityResult,
    intakeState,
    commentBody: buildMergedIntakeComment(baseResult, qualityResult, runId, owner, repo),
  };
}

export async function evaluateExternalPluginIssue({ issue, token, runId, owner, repo } = {}) {
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
  const isCanvasPlugin = hasCanvasKeyword(parsed.plugin);

  if (parsed.plugin?.name) {
    const matchingName = duplicateNames.find(
      (name) => String(name).toLowerCase() === String(parsed.plugin.name).toLowerCase(),
    );
    if (matchingName) {
      errors.push(`submission: 外掛程式名稱 "${parsed.plugin.name}" 與現有的外掛程式 "${matchingName}" 衝突`);
    }
  }

  if (parsed.plugin?.source?.repo && (parsed.plugin?.source?.ref || parsed.plugin?.source?.sha)) {
    await validateRemoteRepository(parsed.plugin.source.repo, parsed.plugin.source, errors, warnings, token);
  }

  if (isCanvasPlugin) {
    await validateCanvasPluginMetadata(parsed.plugin, errors, warnings, token);
  }

  const dedupedErrors = [...new Set(errors)];
  const dedupedWarnings = [...new Set(warnings)];
  const valid = dedupedErrors.length === 0;
  const marker = EXTERNAL_PLUGIN_INTAKE_COMMENT_MARKER;
  const normalizedKeywords = parsed.plugin?.keywords?.length ? parsed.plugin.keywords.join(", ") : "_未提供_";
  const notes = parsed.additionalNotes ?? "_未提供額外說明。_";
  const payload = parsed.plugin
    ? [
        "```json",
        JSON.stringify(parsed.plugin, null, 2),
        "```",
      ].join("\n")
    : "```json\n{}\n```";

  const runLink = runId && owner && repo ? `_[查看工作流程執行狀況](https://github.com/${owner}/${repo}/actions/runs/${runId})_` : "";

  const commentBody = valid
    ? [
        marker,
        "## ✅ 外部外掛程式攝取已通過",
        "",
        `此提交已通過自動攝取驗證，已準備好供維護者審核。`,
        "",
        `- **外掛程式:** ${parsed.plugin.name}`,
        `- **儲存庫:** ${parsed.plugin.repository}`,
        parsed.plugin.source.ref ? `- **Ref:** [\`${parsed.plugin.source.ref.replaceAll('\`', '\\\`')}\`](https://github.com/${encodeRepoPath(parsed.plugin.source.repo)}/tree/${encodeURIComponent(parsed.plugin.source.ref).replaceAll("%2F", "/")})` : undefined,
        parsed.plugin.source.sha ? `- **SHA:** [\`${parsed.plugin.source.sha.replaceAll('\`', '\\\`')}\`](https://github.com/${encodeRepoPath(parsed.plugin.source.repo)}/tree/${encodeURIComponent(parsed.plugin.source.sha).replaceAll("%2F", "/")})` : undefined,
        `- **關鍵字:** ${normalizedKeywords}`,
        "",
        "",
        "### 規範 external.json 內容 (payload)",
        "",
        "",
        payload,
        "",
        "### 審核者說明",
        "",
        "",
        notes,
        dedupedWarnings.length > 0
          ? ["", "### 警告", "", ...dedupedWarnings.map((warning) => `- ${warning}`)].join("\n")
          : "",
        runLink ? `\n${runLink}` : "",
      ].join("\n")
    : [
        marker,
        "## ⚠️ 外部外掛程式攝取需要提交者修正",
        "",
        "此提交未通過自動攝取驗證，尚無法進行維護者審核。",
        `請編輯 Issue 表單以處理下方的修正。當 Issue 被編輯時，攝取會自動重新執行，或者 Issue 作者/維護者可以留言 \`${RERUN_INTAKE_COMMAND}\` 以根據需求重新執行。`,
        "",
        "### 需要修正的項目",
        "",
        ...dedupedErrors.map((error) => `- ${error}`),
        dedupedWarnings.length > 0
          ? ["", "### 警告", "", ...dedupedWarnings.map((warning) => `- ${warning}`)].join("\n")
          : "",
        runLink ? `\n${runLink}` : "",
      ].join("\n");

  return {
    valid,
    intakeState: valid ? "ready-for-review" : "requires-submitter-fixes",
    markerPresent: parsed.markerPresent,
    errors: dedupedErrors,
    warnings: dedupedWarnings,
    plugin: parsed.plugin,
    isCanvasPlugin,
    commentBody,
    commentMarker: marker,
  };
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  const eventPath = process.argv[2];
  if (!eventPath) {
    console.error("用法: node ./eng/external-plugin-intake.mjs <github-event.json> [runId] [owner] [repo]");
    process.exit(1);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const runId = process.argv[3];
  const owner = process.argv[4];
  const repo = process.argv[5];
  const result = await evaluateExternalPluginIssue({ issue: event.issue, token: process.env.GITHUB_TOKEN, runId, owner, repo });
  process.stdout.write(JSON.stringify(result));
}
