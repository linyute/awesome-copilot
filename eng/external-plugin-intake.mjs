#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_FOLDER } from "./constants.mjs";
import { readExternalPlugins, validateExternalPlugin } from "./external-plugin-validation.mjs";

const ISSUE_FORM_MARKER = "<!-- external-plugin-submission -->";
const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

const REQUIRED_CHECKLIST_ITEMS = [
  "此外掛程式位於公開的 GitHub 存放庫中。",
  "我提供的 ref 是不可變的發布標記或完整的 40 字元提交 SHA，而不是分支。",
  "此提交符合此存放庫的貢獻、安全性和負責任的 AI 策略。",
  "此外掛程式尚未列在 Awesome Copilot 市集中。",
];

const FIELD_TITLES = Object.freeze({
  pluginName: "外掛程式名稱",
  shortDescription: "簡短描述",
  githubRepository: "GitHub 存放庫",
  pluginPath: "存放庫內的外掛程式路徑",
  immutableRef: "待審核的不可變參考 (Immutable ref)",
  version: "版本",
  license: "授權識別碼",
  authorName: "作者姓名",
  authorUrl: "作者 URL",
  homepageUrl: "首頁 URL",
  keywords: "關鍵字",
  additionalNotes: "給審核者的補充說明",
  submissionChecklist: "提交檢查清單",
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
  return message.replace(/^external\.json\[0\]:\s*/, "提交: ");
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

async function validateRemoteRepository(repo, ref, errors, warnings, token) {
  const encodedRepo = encodeRepoPath(repo);
  const repositoryResponse = await fetchGitHubJson(`/repos/${encodedRepo}`, token);

  if (!repositoryResponse.ok) {
    if (repositoryResponse.status === 404) {
      errors.push(`提交: 找不到 GitHub 存放庫 "${repo}"`);
    } else {
      errors.push(`提交: 無法檢查 GitHub 存放庫 "${repo}" (HTTP ${repositoryResponse.status})`);
    }
    return;
  }

  if (repositoryResponse.data?.private) {
    errors.push(`提交: GitHub 存放庫 "${repo}" 必須是公開的`);
  }

  if (repositoryResponse.data?.archived) {
    warnings.push(`提交: GitHub 存放庫 "${repo}" 已封存`);
  }

  if (!ref) {
    return;
  }

  if (/^[0-9a-f]{40}$/i.test(ref)) {
    const commitResponse = await fetchGitHubJson(`/repos/${encodedRepo}/commits/${encodeURIComponent(ref)}`, token);
    if (!commitResponse.ok) {
      errors.push(`提交: 在 GitHub 存放庫 "${repo}" 中找不到提交 "${ref}"`);
    }
    return;
  }

  const tagName = ref.startsWith("refs/tags/") ? ref.slice("refs/tags/".length) : ref;
  const tagResponse = await fetchGitHubJson(`/repos/${encodedRepo}/git/ref/tags/${encodeURIComponent(tagName)}`, token);

  if (tagResponse.ok) {
    return;
  }

  if (/^[0-9a-f]+$/i.test(ref) && ref.length !== 40) {
    errors.push('提交: "待審核的不可變參考" 中的提交 SHA 必須使用完整的 40 字元 SHA');
    return;
  }

  if (!tagResponse.ok) {
    errors.push(`提交: 在 GitHub 存放庫 "${repo}" 中找不到標記 "${ref}"`);
  }
}

export function parseExternalPluginIssueBody(body) {
  const sections = parseIssueFormSections(body);
  const errors = [];

  function requiredField(title) {
    const value = stripNoResponse(sections.get(title));
    if (!value) {
      errors.push(`提交: "${title}" 是必填項`);
    }
    return value;
  }

  const pluginName = requiredField(FIELD_TITLES.pluginName);
  const shortDescription = requiredField(FIELD_TITLES.shortDescription);
  const repoInput = normalizeGitHubRepo(requiredField(FIELD_TITLES.githubRepository));
  const immutableRef = requiredField(FIELD_TITLES.immutableRef);
  const version = requiredField(FIELD_TITLES.version);
  const license = requiredField(FIELD_TITLES.license);
  const authorName = requiredField(FIELD_TITLES.authorName);

  const pluginPath = stripNoResponse(sections.get(FIELD_TITLES.pluginPath));
  const authorUrl = stripNoResponse(sections.get(FIELD_TITLES.authorUrl));
  const homepageUrl = stripNoResponse(sections.get(FIELD_TITLES.homepageUrl));
  const keywords = parseKeywords(sections.get(FIELD_TITLES.keywords));
  const additionalNotes = stripNoResponse(sections.get(FIELD_TITLES.additionalNotes));
  const checkedItems = parseChecklist(sections.get(FIELD_TITLES.submissionChecklist));

  for (const item of REQUIRED_CHECKLIST_ITEMS) {
    if (!checkedItems.has(item)) {
      errors.push(`提交: 檢查清單項目必須勾選: "${item}"`);
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
    },
  };

  return {
    markerPresent: normalizeMultilineText(body).includes(ISSUE_FORM_MARKER),
    errors,
    plugin,
    additionalNotes,
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
      errors.push(`提交: 外掛程式名稱 "${parsed.plugin.name}" 與現有的外掛程式 "${matchingName}" 衝突`);
    }
  }

  if (parsed.plugin?.source?.repo && parsed.plugin?.source?.ref) {
    await validateRemoteRepository(parsed.plugin.source.repo, parsed.plugin.source.ref, errors, warnings, token);
  }

  const dedupedErrors = [...new Set(errors)];
  const dedupedWarnings = [...new Set(warnings)];
  const valid = dedupedErrors.length === 0;
  const marker = "<!-- external-plugin-intake -->";
  const normalizedKeywords = parsed.plugin?.keywords?.length ? parsed.plugin.keywords.join(", ") : "_未提供_";
  const notes = parsed.additionalNotes ?? "_未提供額外的說明。_";
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
        "## ✅ 外部外掛程式收錄通過",
        "",
        `此提交已通過自動化收錄驗證，準備好供維護者審核。`,
        "",
        `- **外掛程式:** ${parsed.plugin.name}`,
        `- **存放庫:** ${parsed.plugin.repository}`,
        `- **參考 (Ref):** ${parsed.plugin.source.ref}`,
        `- **關鍵字:** ${normalizedKeywords}`,
        "",
        "### 標準 external.json 內容",
        "",
        payload,
        "",
        "### 審核者說明",
        "",
        notes,
        dedupedWarnings.length > 0
          ? ["", "### 警告", "", ...dedupedWarnings.map((warning) => `- ${warning}`)].join("\n")
          : "",
      ].filter(Boolean).join("\n")
    : [
        marker,
        "## ❌ 外部外掛程式收錄失敗",
        "",
        "此提交未通過自動化收錄驗證，因此該 Issue 已關閉。",
        "請更新 Issue 表單，然後重新開啟 Issue 以再次執行收錄驗證。",
        "",
        "### 需要修正的項目",
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
    console.error("用法: node ./eng/external-plugin-intake.mjs <github-event.json>");
    process.exit(1);
  }

  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const result = await evaluateExternalPluginIssue({ issue: event.issue, token: process.env.GITHUB_TOKEN });
  process.stdout.write(JSON.stringify(result));
}
