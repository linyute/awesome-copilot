#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_FOLDER } from "../lib/constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const EXTENSIONS_DIR = path.join(ROOT_FOLDER, "extensions");
const COPILOT_NAMESPACE = "com.github.copilot";
const AWESOME_COPILOT_NAMESPACE = "com.github.awesome-copilot";
const COPILOT_CONTENT_DIR = COPILOT_NAMESPACE;

/**
 * 遞迴複製目錄。
 */
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 將相對於外掛程式的路徑解析為存放庫根目錄來源檔案。
 *
 *   ./agents/foo.md   → ROOT/agents/foo.agent.md
 *   ./skills/baz/      → ROOT/skills/baz/
 */
function resolveSource(relPath) {
  const basename = path.basename(relPath, ".md");
  if (relPath.startsWith("./agents/")) {
    return path.join(ROOT_FOLDER, "agents", `${basename}.agent.md`);
  }
  if (relPath.startsWith("./skills/")) {
    // 移除結尾斜線並取得 skill 資料夾名稱
    const skillName = relPath.replace(/^\.\/skills\//, "").replace(/\/$/, "");
    return path.join(ROOT_FOLDER, "skills", skillName);
  }
  if (relPath.startsWith("./extensions/")) {
    const extensionName = relPath.replace(/^\.\/extensions\//, "").replace(/\/$/, "");
    return path.join(ROOT_FOLDER, "extensions", extensionName);
  }
  if (relPath.startsWith("./hooks/")) {
    return path.join(ROOT_FOLDER, "hooks", relPath.replace(/^\.\/hooks\//, ""));
  }
  return null;
}

function readExtensionReferences(metadata, pluginName) {
  const extensionData = metadata.extensions?.[AWESOME_COPILOT_NAMESPACE];
  const directories = extensionData?.extensions ?? [];
  if (!Array.isArray(directories) ||
      directories.some((entry) => typeof entry !== "string" || !entry.startsWith("./extensions/"))) {
    throw new Error(`extensions["${AWESOME_COPILOT_NAMESPACE}"].extensions 必須包含相對於外掛程式的路徑`);
  }

  const names = new Set(directories.map((entry) =>
    entry.replace(/^\.\/extensions\//, "").replace(/\/$/, "")
  ));
  if (fs.existsSync(path.join(EXTENSIONS_DIR, pluginName, "extension.mjs"))) {
    names.add(pluginName);
  }

  return [...names].sort();
}

export function materializePlugins() {
  console.log("正在具體化外掛程式檔案...\n");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：在 ${PLUGINS_DIR} 找不到 plugins 目錄`);
    process.exit(1);
  }

  const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  let totalAgents = 0;
  let totalSkills = 0;
  let totalExtensions = 0;
  let warnings = 0;
  let errors = 0;

  for (const dirName of pluginDirs) {
    const pluginPath = path.join(PLUGINS_DIR, dirName);
    const pluginJsonPath = path.join(pluginPath, "plugin.json");

    if (!fs.existsSync(pluginJsonPath)) {
      continue;
    }

    let metadata;
    try {
      metadata = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
    } catch (err) {
      console.error(`錯誤：無法剖析 ${pluginJsonPath}：${err.message}`);
      errors++;
      continue;
    }

    const pluginName = metadata.name || dirName;

    const composition = metadata.extensions?.[AWESOME_COPILOT_NAMESPACE] ?? {};

    // 處理存放庫組合欄位。
    for (const field of ["agents", "hooks", "skills"]) {
      const entries = composition[field];
      if (!Array.isArray(entries)) continue;
      for (const relPath of entries) {
        const src = resolveSource(relPath);
        if (!src) {
          console.warn(`  ⚠ ${pluginName}：未知的 ${field} 路徑格式：${relPath}`);
          warnings++;
          continue;
        }
        if (!fs.existsSync(src)) {
          console.warn(`  ⚠ ${pluginName}：找不到 ${field} 來源：${src}`);
          warnings++;
          continue;
        }
        const relativeDestination = relPath.replace(/^\.\//, "").replace(/\/$/, "");
        const dest = field === "skills"
          ? path.join(pluginPath, relativeDestination)
          : path.join(pluginPath, COPILOT_CONTENT_DIR, relativeDestination);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        if (fs.statSync(src).isDirectory()) copyDirRecursive(src, dest);
        else fs.copyFileSync(src, dest);
        if (field === "agents") totalAgents++;
        if (field === "skills") totalSkills++;
      }
    }

    // 處理在存放庫命名空間中宣告的可重複使用擴充功能。
    const extensionRefs = readExtensionReferences(metadata, pluginName);
    for (const extensionName of extensionRefs) {
      const relPath = `./extensions/${extensionName}`;
      const src = resolveSource(relPath);
      if (!src) {
        console.warn(`  ⚠ ${pluginName}：未知的擴充功能路徑格式：${relPath}`);
        warnings++;
        continue;
      }
      if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
        console.warn(`  ⚠ ${pluginName}：找不到擴充功能來源目錄：${src}`);
        warnings++;
        continue;
      }
      const dest = path.join(pluginPath, COPILOT_CONTENT_DIR, "extensions", extensionName);
      copyDirRecursive(src, dest);
      totalExtensions++;
    }

    // 為 marketplace 分支發出符合規格的提供資訊清單。
    // 來源資訊清單保留存放庫組合欄位以供建構工具使用。
    // 提供資訊清單僅保留 Agent Plugins v1.0.0 欄位；標準
    // skill 從 skills/ 探索，而 Copilot 專屬內容從 com.github.copilot/ 探索。
    const SPEC_FIELDS = new Set(["$schema", "name", "version", "description", "author",
      "homepage", "repository", "license", "keywords", "extensions"]);
    const AGENT_PLUGINS_SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";

    const served = { "$schema": AGENT_PLUGINS_SCHEMA };
    for (const [key, val] of Object.entries(metadata)) {
      if (SPEC_FIELDS.has(key) && key !== "$schema") {
        if (key === "extensions") {
          const copilot = val?.[COPILOT_NAMESPACE];
          if (copilot) {
            served.extensions = { [COPILOT_NAMESPACE]: { ...copilot } };
          }
        } else {
          served[key] = val;
        }
      }
    }

    fs.writeFileSync(pluginJsonPath, JSON.stringify(served, null, 2) + "\n", "utf8");

    const counts = [];
    if (composition.agents?.length) counts.push(`${composition.agents.length} 個 Agent`);
    if (composition.skills?.length) counts.push(`${composition.skills.length} 個 Skill`);
    if (extensionRefs.length) counts.push(`${extensionRefs.length} 個擴充功能`);
    if (counts.length) {
      console.log(`✓ ${pluginName}: ${counts.join(", ")}`);
    }
  }

  console.log(`\n完成。已複製 ${totalAgents} 個 Agent、${totalSkills} 個 Skill、${totalExtensions} 個擴充功能。`);
  if (warnings > 0) {
    console.log(`${warnings} 個警告。`);
  }
  if (errors > 0) {
    console.error(`${errors} 個錯誤。`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  materializePlugins();
}
