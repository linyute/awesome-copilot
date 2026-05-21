import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";

export const EXTERNAL_PLUGINS_FILE = path.join(ROOT_FOLDER, "plugins", "external.json");

export const EXTERNAL_PLUGIN_POLICIES = Object.freeze({
  marketplace: Object.freeze({
    allowedSourceTypes: ["github"],
    requireAuthor: true,
    requireRepository: true,
    requireKeywords: true,
    requireLicense: false,
    requireImmutableRef: false,
  }),
  publicSubmission: Object.freeze({
    allowedSourceTypes: ["github"],
    requireAuthor: true,
    requireRepository: true,
    requireKeywords: true,
    requireLicense: true,
    requireImmutableRef: true,
  }),
});

const EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS = Object.freeze([
  "plugin.json",
  ".github/plugin/plugin.json",
  ".plugin/plugin.json",
]);

function resolvePolicy(policy) {
  if (!policy) {
    return EXTERNAL_PLUGIN_POLICIES.marketplace;
  }

  if (typeof policy === "string") {
    const resolved = EXTERNAL_PLUGIN_POLICIES[policy];
    if (!resolved) {
      throw new Error(`未知的外部外掛程式驗證策略 "${policy}"`);
    }

    return resolved;
  }

  return {
    ...EXTERNAL_PLUGIN_POLICIES.marketplace,
    ...policy,
  };
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePluginName(name, prefix, errors) {
  if (!isNonEmptyString(name)) {
    errors.push(`${prefix}: "name" 是必填項，且必須為非空字串`);
    return;
  }

  if (name.length > 50) {
    errors.push(`${prefix}: "name" 必須在 50 個字元以內`);
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push(`${prefix}: "name" 只能包含小寫字母、數字和連字號`);
  }
}

function validateDescription(description, prefix, errors) {
  if (!isNonEmptyString(description)) {
    errors.push(`${prefix}: "description" 是必填項，且必須為非空字串`);
    return;
  }

  if (description.length > 500) {
    errors.push(`${prefix}: "description" 必須在 500 個字元以內`);
  }
}

function validateVersion(version, prefix, errors) {
  if (!isNonEmptyString(version)) {
    errors.push(`${prefix}: "version" 是必填項，且必須為非空字串`);
    return;
  }

  if (version.length > 100) {
    errors.push(`${prefix}: "version" 必須在 100 個字元以內`);
  }
}

function validateKeywords(keywords, prefix, errors, warnings, required) {
  if (keywords === undefined) {
    if (required) {
      errors.push(`${prefix}: "keywords" 是必填項，且必須是小寫標籤陣列`);
    }
    return;
  }

  if (!Array.isArray(keywords)) {
    errors.push(`${prefix}: "keywords" 必須是一個陣列`);
    return;
  }

  if (keywords.length > 10) {
    errors.push(`${prefix}: "keywords" 不能超過 10 個項目`);
  }

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    if (!isNonEmptyString(keyword)) {
      errors.push(`${prefix}: "keywords[${i}]" 必須是非空字串`);
      continue;
    }

    if (!/^[a-z0-9-]+$/.test(keyword)) {
      errors.push(`${prefix}: "keywords[${i}]" 只能包含小寫字母、數字和連字號`);
    }

    if (keyword.length > 30) {
      errors.push(`${prefix}: "keywords[${i}]" 必須在 30 個字元以內`);
    }
  }

  if (keywords.length === 0) {
    if (required) {
      errors.push(`${prefix}: "keywords" 必須包含至少一個項目`);
    } else {
      warnings.push(`${prefix}: "keywords" 為空；建議至少提供一個關鍵字以利搜尋`);
    }
  }
}

function validateHttpsUrl(value, fieldName, prefix, errors, options = {}) {
  if (!isNonEmptyString(value)) {
    errors.push(`${prefix}: "${fieldName}" 必須是非空字串`);
    return;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${prefix}: "${fieldName}" 必須是有效的 URL`);
    return;
  }

  if (parsed.protocol !== "https:") {
    errors.push(`${prefix}: "${fieldName}" 必須使用 https`);
  }

  if (options.githubOnly && parsed.hostname !== "github.com") {
    errors.push(`${prefix}: "${fieldName}" 必須指向 https://github.com/...`);
  }
}

function validateAuthor(author, prefix, errors, required) {
  if (author === undefined) {
    if (required) {
      errors.push(`${prefix}: "author" 是必填項`);
    }
    return;
  }

  if (!author || typeof author !== "object" || Array.isArray(author)) {
    errors.push(`${prefix}: "author" 必須是一個物件`);
    return;
  }

  if (!isNonEmptyString(author.name)) {
    errors.push(`${prefix}: "author.name" 是必填項，且必須為非空字串`);
  }

  if (author.url !== undefined) {
    validateHttpsUrl(author.url, "author.url", prefix, errors);
  }
}

function validateLicense(license, prefix, errors, required) {
  if (license === undefined) {
    if (required) {
      errors.push(`${prefix}: "license" 是必填項`);
    }
    return;
  }

  if (!isNonEmptyString(license)) {
    errors.push(`${prefix}: "license" 必須是非空字串`);
  }
}

function validateRepository(repository, prefix, errors, required) {
  if (repository === undefined) {
    if (required) {
      errors.push(`${prefix}: "repository" 是必填項`);
    }
    return;
  }

  validateHttpsUrl(repository, "repository", prefix, errors, { githubOnly: true });
}

function validateHomepage(homepage, prefix, errors) {
  if (homepage === undefined) {
    return;
  }

  validateHttpsUrl(homepage, "homepage", prefix, errors);
}

function formatExpectedPluginRootMessage() {
  return EXTERNAL_PLUGIN_ROOT_MANIFEST_PATHS.map((manifestPath) => `"${manifestPath}"`).join(", ");
}

function validateRelativePath(pathValue, prefix, errors) {
  if (!isNonEmptyString(pathValue)) {
    errors.push(`${prefix}: 提供時，"source.path" 必須是非空字串`);
    return;
  }

  if (pathValue === "/") {
    return;
  }

  const normalized = path.posix.normalize(pathValue);
  const segments = pathValue.split("/");

  if (pathValue.startsWith("/") || pathValue.startsWith("../") || normalized !== pathValue || segments.includes("..")) {
    errors.push(`${prefix}: "source.path" 必須是存放庫內安全的相對路徑`);
  }

  if (pathValue.includes("\\")) {
    errors.push(`${prefix}: "source.path" 必須使用正斜線 (forward slashes)`);
  }

  if (normalized === ".") {
    errors.push(`${prefix}: "source.path" 必須為 "/"（代表存放庫根目錄）或是相對於存放庫根的外掛根目錄`);
  }

  if (path.posix.basename(normalized) === "plugin.json") {
    errors.push(
      `${prefix}: "source.path" 必須指向外掛根目錄，而不是 manifest 檔案；相對於 "source.path"，預期為 ${formatExpectedPluginRootMessage()} 中的其中一項`
    );
  }
}

function validateImmutableRef(ref, prefix, errors) {
  if (!isNonEmptyString(ref)) {
    errors.push(`${prefix}: 提供時，"source.ref" 必須是非空字串`);
    return;
  }

  if (ref.startsWith("refs/heads/")) {
    errors.push(`${prefix}: "source.ref" 必須是標記 (tag) 或提交 SHA，而不是分支參考`);
    return;
  }

  if (["main", "master", "develop", "development", "dev", "trunk"].includes(ref)) {
    errors.push(`${prefix}: "source.ref" 必須是標記 (tag) 或提交 SHA，而不是分支名稱`);
  }

  if (ref.startsWith("refs/") && !ref.startsWith("refs/tags/")) {
    errors.push(`${prefix}: "source.ref" 必須是標記參考或提交 SHA`);
  }
}

function validateGitHubSource(source, prefix, errors, requireImmutableRef) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    errors.push(`${prefix}: "source" 必須是一個物件`);
    return;
  }

  if (source.source !== "github") {
    errors.push(`${prefix}: "source.source" 必須是 "github"`);
  }

  if (!isNonEmptyString(source.repo)) {
    errors.push(`${prefix}: "source.repo" 是必填項，且必須為非空字串`);
  } else if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repo)) {
    errors.push(`${prefix}: "source.repo" 格式必須為 "owner/repo"`);
  }

  if (source.path !== undefined) {
    validateRelativePath(source.path, prefix, errors);
  }

  if (source.ref !== undefined) {
    validateImmutableRef(source.ref, prefix, errors);
  } else if (requireImmutableRef) {
    errors.push(`${prefix}: 公開外部外掛程式提交必須提供 "source.ref"`);
  }
}

export function validateExternalPlugin(plugin, index, options = {}) {
  const policy = resolvePolicy(options.policy ?? options);
  const errors = [];
  const warnings = [];
  const prefix = `external.json[${index}]`;

  if (!plugin || typeof plugin !== "object" || Array.isArray(plugin)) {
    return {
      errors: [`${prefix}: 項目必須是一個物件`],
      warnings,
    };
  }

  validatePluginName(plugin.name, prefix, errors);
  validateDescription(plugin.description, prefix, errors);
  validateVersion(plugin.version, prefix, errors);
  validateAuthor(plugin.author, prefix, errors, policy.requireAuthor);
  validateRepository(plugin.repository, prefix, errors, policy.requireRepository);
  validateHomepage(plugin.homepage, prefix, errors);
  validateLicense(plugin.license, prefix, errors, policy.requireLicense);
  validateKeywords(plugin.keywords ?? plugin.tags, prefix, errors, warnings, policy.requireKeywords);

  if (plugin.tags !== undefined && plugin.keywords === undefined) {
    warnings.push(`${prefix}: 建議優先使用 "keywords" 而非舊有的 "tags"`);
  }

  if (!plugin.source) {
    errors.push(`${prefix}: "source" 是必填項`);
  } else if (typeof plugin.source === "string") {
    errors.push(`${prefix}: "source" 必須是一個物件 (外部外掛程式不允許使用本地檔案路徑)`);
  } else if (!policy.allowedSourceTypes.includes(plugin.source.source)) {
    errors.push(`${prefix}: "source.source" 必須是以下之一: ${policy.allowedSourceTypes.join(", ")}`);
  } else if (plugin.source.source === "github") {
    validateGitHubSource(plugin.source, prefix, errors, policy.requireImmutableRef);
  }

  return { errors, warnings };
}

export function validateExternalPlugins(plugins, options = {}) {
  const policy = resolvePolicy(options.policy ?? options);
  const errors = [];
  const warnings = [];
  const localNames = new Map(
    (options.localPluginNames ?? []).map((name) => [String(name).toLowerCase(), String(name)])
  );
  const seenExternalNames = new Map();

  if (!Array.isArray(plugins)) {
    return {
      errors: ["external.json 必須包含一個陣列"],
      warnings,
    };
  }

  plugins.forEach((plugin, index) => {
    const result = validateExternalPlugin(plugin, index, { policy });
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (!isNonEmptyString(plugin?.name)) {
      return;
    }

    const normalizedName = plugin.name.toLowerCase();
    const duplicateIndex = seenExternalNames.get(normalizedName);
    if (duplicateIndex !== undefined) {
      errors.push(`external.json[${index}]: 重複的外掛程式名稱 "${plugin.name}" 已被 external.json[${duplicateIndex}] 使用`);
    } else {
      seenExternalNames.set(normalizedName, index);
    }

    const localDuplicate = localNames.get(normalizedName);
    if (localDuplicate) {
      errors.push(`external.json[${index}]: 外掛程式名稱 "${plugin.name}" 與本地外掛程式 "${localDuplicate}" 衝突`);
    }
  });

  return { errors, warnings };
}

export function readExternalPlugins(options = {}) {
  const filePath = options.filePath ?? EXTERNAL_PLUGINS_FILE;

  if (!fs.existsSync(filePath)) {
    return {
      plugins: [],
      errors: [],
      warnings: [],
    };
  }

  let plugins;
  try {
    const content = fs.readFileSync(filePath, "utf8");
    plugins = JSON.parse(content);
  } catch (error) {
    return {
      plugins: [],
      errors: [`讀取 ${path.basename(filePath)} 時發生錯誤: ${error.message}`],
      warnings: [],
    };
  }

  const { errors, warnings } = validateExternalPlugins(plugins, options);
  return { plugins, errors, warnings };
}
