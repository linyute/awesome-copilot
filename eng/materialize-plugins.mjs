#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

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
 * 將外掛程式相對路徑解析為存放區根目錄的原始程式檔案。
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
    // 移除結尾斜線並取得技能資料夾名稱
    const skillName = relPath.replace(/^\.\/skills\//, "").replace(/\/$/, "");
    return path.join(ROOT_FOLDER, "skills", skillName);
  }
  return null;
}

// 實體化外掛程式檔案的主要邏輯
function materializePlugins() {
  console.log("正在實體化外掛程式檔案...\n");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：在 ${PLUGINS_DIR} 找不到 Plugins 目錄`);
    process.exit(1);
  }

  // 取得所有外掛程式目錄並排序
  const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  let totalAgents = 0;
  let totalSkills = 0;
  let warnings = 0;
  let errors = 0;

  for (const dirName of pluginDirs) {
    const pluginPath = path.join(PLUGINS_DIR, dirName);
    const pluginJsonPath = path.join(pluginPath, ".github/plugin", "plugin.json");

    if (!fs.existsSync(pluginJsonPath)) {
      continue;
    }

    let metadata;
    try {
      metadata = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
    } catch (err) {
      console.error(`錯誤：解析 ${pluginJsonPath} 失敗：${err.message}`);
      errors++;
      continue;
    }

    const pluginName = metadata.name || dirName;

    // 處理代理程式 (Agents)
    if (Array.isArray(metadata.agents)) {
      for (const relPath of metadata.agents) {
        const src = resolveSource(relPath);
        if (!src) {
          console.warn(`  ⚠ ${pluginName}：未知的路徑格式：${relPath}`);
          warnings++;
          continue;
        }
        if (!fs.existsSync(src)) {
          console.warn(`  ⚠ ${pluginName}：找不到原始程式：${src}`);
          warnings++;
          continue;
        }
        const dest = path.join(pluginPath, relPath.replace(/^\.\//, ""));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        totalAgents++;
      }
    }

    // 處理技能 (Skills)
    if (Array.isArray(metadata.skills)) {
      for (const relPath of metadata.skills) {
        const src = resolveSource(relPath);
        if (!src) {
          console.warn(`  ⚠ ${pluginName}：未知的路徑格式：${relPath}`);
          warnings++;
          continue;
        }
        if (!fs.existsSync(src) || !fs.statSync(src).isDirectory()) {
          console.warn(`  ⚠ ${pluginName}：找不到原始目錄：${src}`);
          warnings++;
          continue;
        }
        const dest = path.join(pluginPath, relPath.replace(/^\.\//, "").replace(/\/$/, ""));
        copyDirRecursive(src, dest);
        totalSkills++;
      }
    }

    // 重新寫入 plugin.json 以使用資料夾路徑而非個別檔案路徑。
    // 在暫存環境中，./agents/foo.md 等路徑指向個別原始檔案。
    // 在主分支上，實體化之後，我們只需要包含這些檔案的目錄。
    const rewritten = { ...metadata };
    let changed = false;

    for (const field of ["agents", "commands"]) {
      if (Array.isArray(rewritten[field]) && rewritten[field].length > 0) {
        const dirs = [...new Set(rewritten[field].map(p => path.dirname(p)))];
        rewritten[field] = dirs;
        changed = true;
      }
    }

    if (Array.isArray(rewritten.skills) && rewritten.skills.length > 0) {
      // 技能已經是資料夾引用 (./skills/name/)；移除結尾斜線
      rewritten.skills = rewritten.skills.map(p => p.replace(/\/$/, ""));
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(pluginJsonPath, JSON.stringify(rewritten, null, 2) + "\n", "utf8");
    }

    const counts = [];
    if (metadata.agents?.length) counts.push(`${metadata.agents.length} 個代理程式`);
    if (metadata.skills?.length) counts.push(`${metadata.skills.length} 個技能`);
    if (counts.length) {
      console.log(`✓ ${pluginName}：${counts.join(", ")}`);
    }
  }

  console.log(`
完成。已複製 ${totalAgents} 個代理程式，${totalSkills} 個技能。`);
  if (warnings > 0) {
    console.log(`有 ${warnings} 個警告。`);
  }
  if (errors > 0) {
    console.error(`有 ${errors} 個錯誤。`);
    process.exit(1);
  }
}

materializePlugins();
