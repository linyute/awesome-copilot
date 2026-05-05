#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const MATERIALIZED_SPECS = {
  agents: {
    path: "agents",
    restore(dirPath) {
      return collectFiles(dirPath).map((relativePath) => `./agents/${relativePath}`);
    },
  },
  commands: {
    path: "commands",
    restore(dirPath) {
      return collectFiles(dirPath).map((relativePath) => `./commands/${relativePath}`);
    },
  },
  skills: {
    path: "skills",
    restore(dirPath) {
      return collectSkillDirectories(dirPath).map((relativePath) => `./skills/${relativePath}/`);
    },
  },
};

/**
 * 從已實體化的檔案還原清單
 * @param {string} pluginPath - 外掛路徑
 * @returns {boolean} - 是否有變更
 */
export function restoreManifestFromMaterializedFiles(pluginPath) {
  const pluginJsonPath = path.join(pluginPath, ".github/plugin", "plugin.json");
  if (!fs.existsSync(pluginJsonPath)) {
    return false;
  }

  let plugin;
  try {
    plugin = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
  } catch (error) {
    throw new Error(`無法解析 ${pluginJsonPath}: ${error.message}`);
  }

  let changed = false;
  for (const [field, spec] of Object.entries(MATERIALIZED_SPECS)) {
    if (Array.isArray(plugin[field])) {
      const sortedEntries = sortPluginEntries(plugin[field]);
      if (!arraysEqual(plugin[field], sortedEntries)) {
        plugin[field] = sortedEntries;
        changed = true;
      }
    }

    const materializedPath = path.join(pluginPath, spec.path);
    if (!fs.existsSync(materializedPath) || !fs.statSync(materializedPath).isDirectory()) {
      continue;
    }

    const restored = spec.restore(materializedPath);
    if (!arraysEqual(plugin[field], restored)) {
      plugin[field] = restored;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(pluginJsonPath, JSON.stringify(plugin, null, 2) + "\n", "utf8");
  }

  return changed;
}

/**
 * 清除外掛
 * @param {string} pluginPath - 外掛路徑
 * @returns {object} - 清除結果
 */
function cleanPlugin(pluginPath) {
  const manifestUpdated = restoreManifestFromMaterializedFiles(pluginPath);
  if (manifestUpdated) {
    console.log(`  已更新 ${path.basename(pluginPath)}/.github/plugin/plugin.json`);
  }

  let removed = 0;
  for (const { path: subdir } of Object.values(MATERIALIZED_SPECS)) {
    const target = path.join(pluginPath, subdir);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      const count = countFiles(target);
      fs.rmSync(target, { recursive: true, force: true });
      removed += count;
      console.log(`  已移除 ${path.basename(pluginPath)}/${subdir}/ (${count} 個檔案)`);
    }
  }

  return { removed, manifestUpdated };
}

/**
 * 計算目錄下的檔案數量
 * @param {string} dir - 目錄路徑
 * @returns {number} - 檔案數量
 */
function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

/**
 * 收集目錄下的所有檔案
 * @param {string} dir - 目錄路徑
 * @param {string} [rootDir=dir] - 根目錄路徑
 * @returns {string[]} - 檔案清單
 */
function collectFiles(dir, rootDir = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath, rootDir));
    } else {
      files.push(toPosixPath(path.relative(rootDir, entryPath)));
    }
  }
  return files.sort();
}

/**
 * 收集目錄下的技能目錄
 * @param {string} dir - 目錄路徑
 * @param {string} [rootDir=dir] - 根目錄路徑
 * @returns {string[]} - 技能目錄清單
 */
function collectSkillDirectories(dir, rootDir = dir) {
  const skillDirs = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    if (fs.existsSync(path.join(entryPath, "SKILL.md"))) {
      skillDirs.push(toPosixPath(path.relative(rootDir, entryPath)));
      continue;
    }

    skillDirs.push(...collectSkillDirectories(entryPath, rootDir));
  }
  return skillDirs.sort();
}

/**
 * 比較陣列內容是否相等
 * @param {Array} left - 左陣列
 * @param {Array} right - 右陣列
 * @returns {boolean} - 相等性
 */
function arraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

/**
 * 使用 localeCompare 對外掛條目排序，並回傳新的排序後陣列。
 * @param {string[]} entries - 要排序的外掛條目字串陣列。
 * @returns {string[]} 回傳一個新的排序後陣列。
 */
function sortPluginEntries(entries) {
  return [...entries].sort((left, right) => left.localeCompare(right));
}

/**
 * 轉換為 POSIX 相容路徑
 * @param {string} filePath - 檔案路徑
 * @returns {string} - POSIX 路徑
 */
function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

/**
 * 主程式
 */
function main() {
  console.log("正在從外掛清除已實體化的檔案...\n");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：在 ${PLUGINS_DIR} 找不到 plugins 目錄`);
    process.exit(1);
  }

  const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  let total = 0;
  let manifestsUpdated = 0;
  for (const dirName of pluginDirs) {
    const { removed, manifestUpdated } = cleanPlugin(path.join(PLUGINS_DIR, dirName));
    total += removed;
    if (manifestUpdated) {
      manifestsUpdated++;
    }
  }

  console.log();
  if (total === 0 && manifestsUpdated === 0) {
    console.log("✅ 未發現已實體化的檔案。外掛已是乾淨狀態。");
  } else {
    console.log(`✅ 從外掛移除 ${total} 個已實體化的檔案。`);
    if (manifestsUpdated > 0) {
      console.log(`✅ 已更新 ${manifestsUpdated} 個外掛清單，以還原並標準化規格條目。`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
