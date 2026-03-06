#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

// 驗證函式
function validateName(name, folderName) {
  const errors = [];
  if (!name || typeof name !== "string") {
    errors.push("name 是必填欄位且必須為字串");
    return errors;
  }
  if (name.length < 1 || name.length > 50) {
    errors.push("name 的長度必須介於 1 到 50 個字元之間");
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push("name 必須僅包含小寫字母、數字與連字號");
  }
  if (name !== folderName) {
    errors.push(`name「${name}」必須與資料夾名稱「${folderName}」相符`);
  }
  return errors;
}

function validateDescription(description) {
  if (!description || typeof description !== "string") {
    return "description 是必填欄位且必須為字串";
  }
  if (description.length < 1 || description.length > 500) {
    return "description 的長度必須介於 1 到 500 個字元之間";
  }
  return null;
}

function validateVersion(version) {
  if (!version || typeof version !== "string") {
    return "version 是必填欄位且必須為字串";
  }
  return null;
}

function validateKeywords(keywords) {
  if (keywords === undefined) return null;
  if (!Array.isArray(keywords)) {
    return "keywords 必須是陣列";
  }
  if (keywords.length > 10) {
    return "最多僅允許 10 個關鍵字";
  }
  for (const keyword of keywords) {
    if (typeof keyword !== "string") {
      return "所有關鍵字必須為字串";
    }
    if (!/^[a-z0-9-]+$/.test(keyword)) {
      return `關鍵字「${keyword}」必須僅包含小寫字母、數字與連字號`;
    }
    if (keyword.length < 1 || keyword.length > 30) {
      return `關鍵字「${keyword}」的長度必須介於 1 到 30 個字元之間`;
    }
  }
  return null;
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
      errors.push(`${field} 必須是陣列`);
      continue;
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
      // 驗證存放區根目錄中是否存在原始程式檔案
      const basename = p.slice(spec.prefix.length, p.length - spec.suffix.length);
      if (field === "skills") {
        const skillDir = path.join(ROOT_FOLDER, spec.repoDir, basename);
        const skillFile = path.join(skillDir, spec.repoFile);
        if (!fs.existsSync(skillFile)) {
          errors.push(`${field}[${i}] 找不到原始程式：${spec.repoDir}/${basename}/SKILL.md`);
        }
      } else {
        const srcFile = path.join(ROOT_FOLDER, spec.repoDir, basename + spec.repoSuffix);
        if (!fs.existsSync(srcFile)) {
          errors.push(`${field}[${i}] 找不到原始程式：${spec.repoDir}/${basename}${spec.repoSuffix}`);
        }
      }
    }
  }
  return errors;
}

function validatePlugin(folderName) {
  const pluginDir = path.join(PLUGINS_DIR, folderName);
  const errors = [];

  // 規則 1：必須具備 .github/plugin/plugin.json
  const pluginJsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    errors.push("缺少必要檔案：.github/plugin/plugin.json");
    return errors;
  }

  // 規則 2：必須具備 README.md
  const readmePath = path.join(pluginDir, "README.md");
  if (!fs.existsSync(readmePath)) {
    errors.push("缺少必要檔案：README.md");
  }

  // 解析 plugin.json
  let plugin;
  try {
    const raw = fs.readFileSync(pluginJsonPath, "utf-8");
    plugin = JSON.parse(raw);
  } catch (err) {
    errors.push(`解析 plugin.json 失敗：${err.message}`);
    return errors;
  }

  // 規則 3 與 4：名稱、說明、版本
  const nameErrors = validateName(plugin.name, folderName);
  errors.push(...nameErrors);

  const descError = validateDescription(plugin.description);
  if (descError) errors.push(descError);

  const versionError = validateVersion(plugin.version);
  if (versionError) errors.push(versionError);

  // 規則 5：關鍵字 (keywords，或為了向後相容的標籤 tags)
  const keywordsError = validateKeywords(plugin.keywords ?? plugin.tags);
  if (keywordsError) errors.push(keywordsError);

  // 規則 6：代理程式 (Agents)、命令 (Commands)、技能 (Skills) 的路徑
  const specErrors = validateSpecPaths(plugin);
  errors.push(...specErrors);

  return errors;
}

// 驗證外掛程式的主功能
function validatePlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    console.log("未找到外掛程式目錄 - 已跳過驗證");
    return true;
  }

  const pluginDirs = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (pluginDirs.length === 0) {
    console.log("未找到外掛程式目錄 - 已跳過驗證");
    return true;
  }

  console.log(`正在驗證 ${pluginDirs.length} 個外掛程式...\n`);

  let hasErrors = false;
  const seenNames = new Set();

  for (const dir of pluginDirs) {
    console.log(`正在驗證 ${dir}...`);

    const errors = validatePlugin(dir);

    if (errors.length > 0) {
      console.error(`❌ ${dir}：`);
      errors.forEach((e) => console.error(`   - ${e}`));
      hasErrors = true;
    } else {
      console.log(`✅ ${dir} 是有效的`);
    }

    // 規則 10：重複名稱
    if (seenNames.has(dir)) {
      console.error(`❌ 重複的外掛程式名稱「${dir}」`);
      hasErrors = true;
    } else {
      seenNames.add(dir);
    }
  }

  if (!hasErrors) {
    console.log(`\n✅ 所有 ${pluginDirs.length} 個外掛程式皆有效`);
  }

  return !hasErrors;
}

// 執行驗證
try {
  const isValid = validatePlugins();
  if (!isValid) {
    console.error("\n❌ 外掛程式驗證失敗");
    process.exit(1);
  }
  console.log("\n🎉 外掛程式驗證通過");
} catch (error) {
  console.error(`驗證期間發生錯誤：${error.message}`);
  process.exit(1);
}
