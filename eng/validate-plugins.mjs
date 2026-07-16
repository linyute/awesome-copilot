#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";
import { readExternalPlugins } from "./external-plugin-validation.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const EXTENSIONS_DIR = path.join(ROOT_FOLDER, "extensions");

// 驗證相關函式
function validateName(name, folderName) {
  const errors = [];
  if (!name || typeof name !== "string") {
    errors.push("name 為必填，且必須為字串");
    return errors;
  }
  if (name.length < 1 || name.length > 50) {
    errors.push("name 長度必須介於 1 到 50 個字元之間");
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push("name 只能包含小寫字母、數字與連字號");
  }
  if (name !== folderName) {
    errors.push(`name "${name}" 必須與資料夾名稱 "${folderName}" 相符`);
  }
  return errors;
}

function validateDescription(description) {
  if (!description || typeof description !== "string") {
    return "description 為必填，且必須為字串";
  }
  if (description.length < 1 || description.length > 500) {
    return "description 長度必須介於 1 到 500 個字元之間";
  }
  return null;
}

function validateVersion(version) {
  if (!version || typeof version !== "string") {
    return "version 為必填，且必須為字串";
  }
  return null;
}

function validateKeywords(keywords) {
  if (keywords === undefined) return null;
  if (!Array.isArray(keywords)) {
    return "keywords 必須為陣列";
  }
  if (keywords.length > 10) {
    return "最多允許 10 個 keywords";
  }
  for (const keyword of keywords) {
    if (typeof keyword !== "string") {
      return "所有 keywords 必須為字串";
    }
    if (!/^[a-z0-9-]+$/.test(keyword)) {
      return `keyword "${keyword}" 只能包含小寫字母、數字與連字號`;
    }
    if (keyword.length < 1 || keyword.length > 30) {
      return `keyword "${keyword}" 長度必須介於 1 到 30 個字元`;
    }
  }
  return null;
}

function arraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function sortPluginEntries(entries) {
  return [...entries].sort((left, right) => left.localeCompare(right));
}

function parseJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    return { parseError: err.message };
  }
}

function getExtensionFolderNames() {
  if (!fs.existsSync(EXTENSIONS_DIR)) {
    return [];
  }

  return fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      const extensionEntryPoint = path.join(EXTENSIONS_DIR, entry.name, "extension.mjs");
      return fs.existsSync(extensionEntryPoint);
    })
    .map((entry) => entry.name)
    .sort();
}

function validateSpecPaths(plugin) {
  const errors = [];
  const specs = {
    agents: { prefix: "./agents/", suffix: ".md", repoDir: "agents", repoSuffix: ".agent.md" },
    skills: { prefix: "./skills/", suffix: "/", repoDir: "skills", repoFile: "SKILL.md" },
  };

  for (const [field, spec] of Object.entries(specs)) {
    const arr = plugin[field];
    if (arr === undefined) continue;
    if (!Array.isArray(arr)) {
      errors.push(`${field} 必須為陣列`);
      continue;
    }
    if (!arraysEqual(arr, sortPluginEntries(arr))) {
      errors.push(`${field} 必須按字母順序排序`);
    }
    for (let i = 0; i < arr.length; i++) {
      const p = arr[i];
      if (typeof p !== "string") {
        errors.push(`${field}[${i}] 必須為字串`);
        continue;
      }
      if (!p.startsWith("./")) {
        errors.push(`${field}[${i}] 必須以 "./" 開頭`);
        continue;
      }
      if (!p.startsWith(spec.prefix)) {
        errors.push(`${field}[${i}] 必須以 "${spec.prefix}" 開頭`);
        continue;
      }
      if (!p.endsWith(spec.suffix)) {
        errors.push(`${field}[${i}] 必須以 "${spec.suffix}" 結尾`);
        continue;
      }
      // 檢查來源檔案在 repo 根目錄是否存在
      const basename = p.slice(spec.prefix.length, p.length - spec.suffix.length);
      if (field === "skills") {
        const skillDir = path.join(ROOT_FOLDER, spec.repoDir, basename);
        const skillFile = path.join(skillDir, spec.repoFile);
        if (!fs.existsSync(skillFile)) {
          errors.push(`${field}[${i}] 找不到來源： ${spec.repoDir}/${basename}/SKILL.md`);
        }
      } else {
        const srcFile = path.join(ROOT_FOLDER, spec.repoDir, basename + spec.repoSuffix);
        if (!fs.existsSync(srcFile)) {
          errors.push(`${field}[${i}] 找不到來源： ${spec.repoDir}/${basename}${spec.repoSuffix}`);
        }
      }
    }
  }
  return errors;
}

function validateCuratedPluginExtensionRefs(plugin) {
  const errors = [];
  const extensionRefs = plugin?.["x-awesome-copilot"]?.extensions;
  if (extensionRefs === undefined) {
    return errors;
  }

  if (!Array.isArray(extensionRefs)) {
    errors.push('x-awesome-copilot.extensions 必須為陣列');
    return errors;
  }

  if (!arraysEqual(extensionRefs, sortPluginEntries(extensionRefs))) {
    errors.push('x-awesome-copilot.extensions 必須按字母順序排序');
  }

  const knownExtensions = new Set(getExtensionFolderNames());
  for (let i = 0; i < extensionRefs.length; i++) {
    const ref = extensionRefs[i];
    if (typeof ref !== "string") {
      errors.push(`x-awesome-copilot.extensions[${i}] 必須為字串`);
      continue;
    }
    if (!ref.startsWith("./extensions/")) {
      errors.push(`x-awesome-copilot.extensions[${i}] 必須以 "./extensions/" 開頭`);
      continue;
    }

    const normalized = ref.replace(/^\.\/extensions\//, "").replace(/\/$/, "");
    if (!normalized) {
      errors.push(`x-awesome-copilot.extensions[${i}] 必須包含 extension 資料夾名稱`);
      continue;
    }
    if (!knownExtensions.has(normalized)) {
      errors.push(`x-awesome-copilot.extensions[${i}] 找不到來源： extensions/${normalized}`);
    }
  }

  return errors;
}

function validatePlugin(folderName) {
  const pluginDir = path.join(PLUGINS_DIR, folderName);
  const errors = [];
  let parsedPlugin = null;

  // 規則 1: 必須存在 .github/plugin/plugin.json
  const pluginJsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    errors.push("缺少必要檔案：.github/plugin/plugin.json");
    return errors;
  }

  // 規則 2: 必須存在 README.md
  const readmePath = path.join(pluginDir, "README.md");
  if (!fs.existsSync(readmePath)) {
    errors.push("缺少必要檔案：README.md");
  }

  // 解析 plugin.json
  let plugin;
  try {
    const raw = fs.readFileSync(pluginJsonPath, "utf-8");
    plugin = JSON.parse(raw);
    parsedPlugin = plugin;
  } catch (err) {
    errors.push(`解析 plugin.json 失敗：${err.message}`);
    return { errors, plugin: parsedPlugin };
  }

  // 規則 3 & 4: name, description, version
  const nameErrors = validateName(plugin.name, folderName);
  errors.push(...nameErrors);

  const descError = validateDescription(plugin.description);
  if (descError) errors.push(descError);

  const versionError = validateVersion(plugin.version);
  if (versionError) errors.push(versionError);

  // 規則 5: keywords（或向後相容使用 tags）
  const keywordsError = validateKeywords(plugin.keywords ?? plugin.tags);
  if (keywordsError) errors.push(keywordsError);

  // 規則 6: agents, commands, skills 路徑
  const specErrors = validateSpecPaths(plugin);
  errors.push(...specErrors);

  const extensionRefErrors = validateCuratedPluginExtensionRefs(plugin);
  errors.push(...extensionRefErrors);

  return { errors, plugin: parsedPlugin };
}

function validateExtensionScreenshotPath(extensionDir, pathValue, fieldName, errors) {
  if (!pathValue || typeof pathValue !== "string") {
    errors.push(`${fieldName} 必須為字串路徑`);
    return;
  }

  const normalizedPath = pathValue.replace(/^\.\/+/, "");
  const absolutePath = path.join(extensionDir, normalizedPath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`${fieldName} 找不到： ${normalizedPath}`);
  }
}

function validateExtensionManifest(folderName) {
  const extensionDir = path.join(EXTENSIONS_DIR, folderName);
  const errors = [];
  let parsedPlugin = null;

  const pluginJsonPath = path.join(extensionDir, ".github/plugin", "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    errors.push("缺少必要檔案：.github/plugin/plugin.json");
    return { errors, plugin: parsedPlugin };
  }

  const parsed = parseJsonFile(pluginJsonPath);
  if (parsed.parseError) {
    errors.push(`解析 plugin.json 失敗：${parsed.parseError}`);
    return { errors, plugin: parsedPlugin };
  }

  parsedPlugin = parsed;

  const nameErrors = validateName(parsed.name, folderName);
  errors.push(...nameErrors);

  const descError = validateDescription(parsed.description);
  if (descError) errors.push(descError);

  const versionError = validateVersion(parsed.version);
  if (versionError) errors.push(versionError);

  const keywordsError = validateKeywords(parsed.keywords ?? parsed.tags);
  if (keywordsError) errors.push(keywordsError);

  // Extension 慣例：logo 必須是正好 "assets/preview.png"
  if (parsed.logo !== "assets/preview.png") {
    errors.push('logo 必須正好為 "assets/preview.png"（extension 慣例）');
  } else {
    validateExtensionScreenshotPath(extensionDir, parsed.logo, "logo", errors);
  }

  // Extension 慣例：不得帶有 x-awesome-copilot
  if (parsed["x-awesome-copilot"] !== undefined) {
    errors.push("不得包含 x-awesome-copilot 欄位（請改用慣例化的 logo）");
  }

  // Extension 慣例：extensions 欄位必須是 "."
  if (parsed.extensions !== ".") {
    errors.push('extensions 欄位必須正好為 "."（extension 慣例）');
  }

  return { errors, plugin: parsedPlugin };
}

// 主驗證函式
function validatePlugins() {
  const pluginDirs = fs.existsSync(PLUGINS_DIR)
    ? fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    : [];
  const extensionDirs = getExtensionFolderNames();

  if (pluginDirs.length === 0 && extensionDirs.length === 0) {
    console.log("未找到 plugins 或 extension plugin manifest — 已跳過驗證");
    return true;
  }

  console.log(`驗證 ${pluginDirs.length} 個 plugins...\n`);
  console.log(`驗證 ${extensionDirs.length} 個 extensions 作為 plugin 來源...\n`);

  let hasErrors = false;
  const seenNames = new Set();
  const localPluginNames = [];

  for (const dir of pluginDirs) {
    console.log(`驗證 ${dir}...`);

    const { errors, plugin } = validatePlugin(dir);

    if (errors.length > 0) {
      console.error(`❌ ${dir}:`);
      errors.forEach((e) => console.error(`   - ${e}`));
      hasErrors = true;
    } else {
      console.log(`✅ ${dir} 驗證通過`);
    }

    if (plugin?.name) {
      if (seenNames.has(plugin.name)) {
        console.error(`❌ 重複的 plugin 名稱 "${plugin.name}"`);
        hasErrors = true;
      } else {
        seenNames.add(plugin.name);
        localPluginNames.push(plugin.name);
      }
    }
  }

  if (extensionDirs.length > 0) {
    console.log("");
  }

  for (const dir of extensionDirs) {
    console.log(`驗證 extension ${dir}...`);
    const { errors, plugin } = validateExtensionManifest(dir);

    if (errors.length > 0) {
      console.error(`❌ extension ${dir}:`);
      errors.forEach((e) => console.error(`   - ${e}`));
      hasErrors = true;
    } else {
      console.log(`✅ extension ${dir} 驗證通過`);
    }

    if (plugin?.name) {
      if (seenNames.has(plugin.name)) {
        console.error(`❌ 重複的 plugin 名稱 "${plugin.name}"`);
        hasErrors = true;
      } else {
        seenNames.add(plugin.name);
        localPluginNames.push(plugin.name);
      }
    }
  }

  console.log("\n驗證外部 plugin 目錄...");
  const { plugins: externalPlugins, errors: externalErrors, warnings: externalWarnings } = readExternalPlugins({
    localPluginNames,
    policy: "marketplace",
  });

  externalWarnings.forEach((warning) => console.warn(`⚠️  ${warning}`));

  if (externalErrors.length > 0) {
    console.error("❌ external.json:");
    externalErrors.forEach((error) => console.error(`   - ${error}`));
    hasErrors = true;
  } else {
    console.log(`✅ external.json 驗證通過（${externalPlugins.length} 個外部 plugins）`);
  }

  if (!hasErrors) {
    console.log(`\n✅ 所有 ${pluginDirs.length} 個 plugins、${extensionDirs.length} 個 extensions，以及外部目錄均驗證通過`);
  }

  return !hasErrors;
}

// 執行驗證
try {
  const isValid = validatePlugins();
  if (!isValid) {
    console.error("\n❌ Plugin 驗證失敗");
    process.exit(1);
  }
  console.log("\n🎉 Plugin 驗證通過");
} catch (error) {
  console.error(`驗證過程發生錯誤：${error.message}`);
  process.exit(1);
}
