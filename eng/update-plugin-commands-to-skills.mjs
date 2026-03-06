#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { PLUGINS_DIR } from "./constants.mjs";

/**
 * 將 plugin.json 中的命令引用轉換為技能引用
 * @param {string} pluginJsonPath - plugin.json 檔案的路徑
 * @returns {object} 包含成功狀態與詳細資訊的結果
 */
function updatePluginManifest(pluginJsonPath) {
  const pluginDir = path.dirname(path.dirname(path.dirname(pluginJsonPath)));
  const pluginName = path.basename(pluginDir);

  console.log(`\n正在處理外掛程式：${pluginName}`);

  // 讀取並解析 plugin.json
  let plugin;
  try {
    const content = fs.readFileSync(pluginJsonPath, "utf8");
    plugin = JSON.parse(content);
  } catch (error) {
    console.log(`  ✗ 讀取/解析時發生錯誤：${error.message}`);
    return { success: false, name: pluginName, reason: "parse-error" };
  }

  // 檢查外掛程式是否具有 commands 欄位
  if (!plugin.commands || !Array.isArray(plugin.commands)) {
    console.log(`  ℹ  未找到 commands 欄位`);
    return { success: false, name: pluginName, reason: "no-commands" };
  }

  const commandCount = plugin.commands.length;
  console.log(`  找到 ${commandCount} 個待轉換的命令`);

  // 驗證並將命令轉換為技能格式
  // 命令： "./commands/foo.md" → 技能： "./skills/foo/"
  const validCommands = plugin.commands.filter((cmd) => {
    if (typeof cmd !== "string") {
      console.log(`  ⚠  正在跳過非字串格式的命令條目：${JSON.stringify(cmd)}`);
      return false;
    }
    if (!cmd.startsWith("./commands/") || !cmd.endsWith(".md")) {
      console.log(`  ⚠  正在跳過格式異常的命令：${cmd}`);
      return false;
    }
    return true;
  });
  const skills = validCommands.map((cmd) => {
    const basename = path.basename(cmd, ".md");
    return `./skills/${basename}/`;
  });
  // 如果 skills 陣列不存在或不是陣列，則將其初始化
  if (!Array.isArray(plugin.skills)) {
    plugin.skills = [];
  }
  // 將轉換後的命令加入 skills 陣列，並排除重複條目
  const allSkills = new Set(plugin.skills);
  for (const skillPath of skills) {
    allSkills.add(skillPath);
  }
  plugin.skills = Array.from(allSkills);

  // 移除 commands 欄位
  delete plugin.commands;

  // 寫入更新後的 plugin.json
  try {
    fs.writeFileSync(
      pluginJsonPath,
      JSON.stringify(plugin, null, 2) + "\n",
      "utf8"
    );
    console.log(`  ✓ 已將 ${commandCount} 個命令轉換為技能`);
    return { success: true, name: pluginName, count: commandCount };
  } catch (error) {
    console.log(`  ✗ 寫入檔案時發生錯誤：${error.message}`);
    return { success: false, name: pluginName, reason: "write-error" };
  }
}

/**
 * 更新所有外掛程式資訊清單的主函式
 */
function main() {
  console.log("=".repeat(60));
  console.log("正在更新外掛程式資訊清單：命令 (Commands) → 技能 (Skills)");
  console.log("=".repeat(60));

  // 檢查外掛程式目錄是否存在
  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：找不到外掛程式目錄：${PLUGINS_DIR}`);
    process.exit(1);
  }

  // 尋找所有 plugin.json 檔案
  const pluginDirs = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  console.log(`找到 ${pluginDirs.length} 個外掛程式目錄\n`);

  const results = {
    updated: [],
    noCommands: [],
    failed: [],
  };

  // 處理每個外掛程式
  for (const dirName of pluginDirs) {
    const pluginJsonPath = path.join(
      PLUGINS_DIR,
      dirName,
      ".github/plugin",
      "plugin.json"
    );

    if (!fs.existsSync(pluginJsonPath)) {
      console.log(`\n正在跳過 ${dirName}：未找到 plugin.json`);
      continue;
    }

    const result = updatePluginManifest(pluginJsonPath);
    if (result.success) {
      results.updated.push({ name: result.name, count: result.count });
    } else if (result.reason === "no-commands") {
      results.noCommands.push(result.name);
    } else {
      results.failed.push(result.name);
    }
  }

  // 列印摘要
  console.log("\n" + "=".repeat(60));
  console.log("更新摘要");
  console.log("=".repeat(60));
  console.log(`✓ 已更新的外掛程式：${results.updated.length}`);
  console.log(`ℹ 無 commands 欄位：${results.noCommands.length}`);
  console.log(`✗ 失敗：${results.failed.length}`);
  console.log(`總計處理：${pluginDirs.length}`);

  if (results.updated.length > 0) {
    console.log("\n已更新的外掛程式：");
    results.updated.forEach(({ name, count }) =>
      console.log(`  - ${name} (${count} 個命令 → 技能)`)
    );
  }

  if (results.failed.length > 0) {
    console.log("\n更新失敗：");
    results.failed.forEach((name) => console.log(`  - ${name}`));
  }

  console.log("\n✅ 外掛程式資訊清單更新完成！");
  console.log(
    "\n後續步驟：\n" +
      "1. 執行 'npm run plugin:validate' 以驗證所有更新後的外掛程式\n" +
      "2. 測試外掛程式是否運作正常\n"
  );
}

// 執行更新
main();
