#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_FOLDER } from "./constants.mjs";
import { readExternalPlugins, validateExternalPlugin } from "./external-plugin-validation.mjs";

export const ISSUE_FORM_MARKER = "<!-- external-plugin-submission -->";
export const EXTERNAL_PLUGIN_INTAKE_COMMENT_MARKER = "<!-- external-plugin-intake -->";
export const RERUN_INTAKE_COMMAND = "/rerun-intake";
const RERUN_INTAKE_COMMAND_PATTERN = new RegExp(
  `^\\s*${RERUN_INTAKE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
  "m",
);
const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

// 每一項都是一組等效的核取清單項目文字（包含新版與舊版別名）。
// 提交通過的條件是已勾選項目包含每一組中的至少一個文字。
const REQUIRED_CHECKLIST_ITEMS = [
  new Set(["The plugin lives in a public GitHub repository."]),
  new Set([
    "The ref and/or sha I provided is immutable (release tag and/or full 40-character commit SHA), not a branch.",
    // 原始 Issue 範本中使用的舊版文字
    "The ref I provided is an immutable release tag or full 40-character commit SHA, not a branch.",
  ]),
  new Set(["This submission follows this repository's contribution, security, and responsible AI policies."]),
  new Set(["This plugin is not already listed in the Awesome Copilot marketplace."]),
];

const FIELD_TITLES = Object.freeze({
  pluginName: "Plugin name",
  shortDescription: "Short description",
  githubRepository: "GitHub repository",
  pluginPath: "Plugin path inside the repository",
  immutableRef: "Ref to review",
  immutableSha: "Commit SHA to review",
  version: "Version",
  license: "License identifier",
  authorName: "Author name",
  authorUrl: "Author URL",
  homepageUrl: "Homepage URL",
  keywords: "Keywords",
  additionalNotes: "Additional notes for reviewers",
  submissionChecklist: "Submission checklist",
});

// 在 ref/sha 拆分前，原始 Issue 範本中使用的舊版欄位標題
const LEGACY_FIELD_TITLES = Object.freeze({
  immutableRef: "Immutable ref to review",
});

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
      errors.push(`submission: 找不到 GitHub 儲存庫 "${repo}"`);
    } else {
      errors.push(`submission: 無法檢查 GitHub 儲存庫 "${repo}" (HTTP ${repositoryResponse.status})`);
    }
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
      const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/commits/${encodeURIComponent(sha)}`, token);
      if (!commitResponse.ok) {
        errors.push(`submission: 在 GitHub 儲存庫 "${repo}" 中找不到提交 "${sha}"`);
      }
    }
  }

  if (!ref) {
    return;
  }

  if (/^[0-9a-f]{40}$/i.test(ref)) {
    const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/commits/${encodeURIComponent(ref)}`, token);
    if (!commitResponse.ok) {
      errors.push(`submission: 在 GitHub 儲存庫 "${repo}" 中找不到提交 "${ref}"`);
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
    errors.push('submission: "Ref to review" 中的提交 SHA 必須使用完整的 40 字元 SHA，或者提交到 "Commit SHA to review"');
    return;
  }

  if (!tagResponse.ok) {
    errors.push(`submission: 在 GitHub 儲存庫 "${repo}" 中找不到標籤 "${ref}"`);
  }
}

export function parseExternalPluginIssueBody(body) {
  const sections = parseIssueFormSections(body);
  const errors = [];

  function requiredField(title) {
    const value = stripNoResponse(sections.get(title));
    if (!value) {
      errors.push(`submission: "${title}" 是必填項`);
    }
    return value;
  }

  const pluginName = requiredField(FIELD_TITLES.pluginName);
  const shortDescription = requiredField(FIELD_TITLES.shortDescription);
  const repoInput = normalizeGitHubRepo(requiredField(FIELD_TITLES.githubRepository));
  // 支援目前的欄位標題以及 ref/sha 拆分前使用的舊版標題
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
    errors.push(`submission: "${FIELD_TITLES.immutableRef}" 或 "${FIELD_TITLES.immutableSha}" 其中之一是必填項`);
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
      // 使用每個等效 Set 中的規範（第一個）文字進行回報
      const [canonical] = equivalents;
      errors.push(`submission: 必須勾選核取清單項目："${canonical}"`);
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
      errors.push(`submission: 外掛名稱 "${parsed.plugin.name}" 與現有的外掛 "${matchingName}" 衝突`);
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
        "## ✅ 外部外掛受理通過",
        "",
        `此提交已通過自動受理驗證，準備好由維護者進行審核。`,
        "",
        `- **外掛：** ${parsed.plugin.name}`,
        `- **儲存庫：** ${parsed.plugin.repository}`,
        parsed.plugin.source.ref ? `- **Ref：** ${parsed.plugin.source.ref}` : undefined,
        parsed.plugin.source.sha ? `- **SHA：** ${parsed.plugin.source.sha}` : undefined,
        `- **關鍵字：** ${normalizedKeywords}`,
        "",
        "### 規範 external.json 內容",
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
        "## ❌ 外部外掛受理失敗",
        "",
        "此提交未通過自動受理驗證，因此該 Issue 已被關閉。",
        `請編輯 Issue 表單以解決下列修復事項，然後由 Issue 作者或維護者留言 \`${RERUN_INTAKE_COMMAND}\` 以重新執行此已關閉提交的受理流程。`,
        "",
        "### 必要的修復事項",
        "",
        ...dedupedErrors.map((error) => `- ${error}`),
        dedupedWarnings.length > 0
          ? ["", "### 警告", "", ...dedupedWarnings.map((warning) => `- ${warning}`)].join("\n")
          : "",
      ].filter(Boolean).join("\n");

  return {
    valid,
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
    console.error("用法：node ./eng/external-plugin-intake.mjs <github-event.json>");
    process.exit(1);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const result = await evaluateExternalPluginIssue({ issue: event.issue, token: process.env.GITHUB_TOKEN });
  process.stdout.write(JSON.stringify(result));
}
