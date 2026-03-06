#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const MATERIALIZED_DIRS = ["agents", "commands", "skills"];

// 清理外掛程式目錄中的實體化檔案
function cleanPlugin(pluginPath) {
  let removed = 0;
  for (const subdir of MATERIALIZED_DIRS) {
    const target = path.join(pluginPath, subdir);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      const count = countFiles(target);
      fs.rmSync(target, { recursive: true, force: true });
      removed += count;
      console.log(`  已移除 ${path.basename(pluginPath)}/${subdir}/ (${count} 個檔案)`);
    }
  }
  return removed;
}

// 遞迴計算目錄中的檔案數量
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

function main() {
  console.log("正在從外掛程式中清理實體化檔案...\n");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：在 ${PLUGINS_DIR} 找不到 plugins 目錄`);
    process.exit(1);
  }

  // 取得所有外掛程式目錄並排序
  const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  let total = 0;
  for (const dirName of pluginDirs) {
    total += cleanPlugin(path.join(PLUGINS_DIR, dirName));
  }

  console.log();
  if (total === 0) {
    console.log("✅ 未找到實體化檔案。外掛程式已經是乾淨的。");
  } else {
    console.log(`✅ 已從外掛程式中移除 ${total} 個實體化檔案。`);
  }
}

main();
