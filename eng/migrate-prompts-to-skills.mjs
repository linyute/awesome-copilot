#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER, SKILLS_DIR } from "./constants.mjs";
import { parseFrontmatter } from "./yaml-parser.mjs";

const PROMPTS_DIR = path.join(ROOT_FOLDER, "prompts");
/**
 * 將提示檔案轉換為技能資料夾
 * @param {string} promptFilePath - 提示檔案的完整路徑
 * @returns {object} 包含成功狀態與詳細資訊的結果
 */
function convertPromptToSkill(promptFilePath) {
  const filename = path.basename(promptFilePath);
  const baseName = filename.replace(".prompt.md", "");

  console.log(`\n正在轉換：${baseName}`);

  // 解析提示檔案的 Front Matter
  const frontmatter = parseFrontmatter(promptFilePath);
  const content = fs.readFileSync(promptFilePath, "utf8");

  // 提取 Front Matter 之後的內容
  const frontmatterEndMatch = content.match(/^---\n[\s\S]*?\n---\n/);
  const mainContent = frontmatterEndMatch
    ? content.substring(frontmatterEndMatch[0].length).trim()
    : content.trim();

  // 建立技能資料夾
  const skillFolderPath = path.join(SKILLS_DIR, baseName);
  if (fs.existsSync(skillFolderPath)) {
    console.log(`  ⚠️  技能資料夾已存在：${baseName}`);
    return { success: false, reason: "already-exists", name: baseName };
  }

  fs.mkdirSync(skillFolderPath, { recursive: true });

  // 為 SKILL.md 構建新的 Front Matter
  const skillFrontmatter = {
    name: baseName,
    description: frontmatter?.description || `從 ${filename} 轉換而來的技能`,
  };

  // 構建 SKILL.md 內容
  const skillContent = `---
name: ${skillFrontmatter.name}
description: '${skillFrontmatter.description.replace(/'/g, "'''")}'
---

${mainContent}
`;

  // 寫入 SKILL.md
  const skillFilePath = path.join(skillFolderPath, "SKILL.md");
  fs.writeFileSync(skillFilePath, skillContent, "utf8");

  console.log(`  ✓ 已建立技能：${baseName}`);
  return { success: true, name: baseName, path: skillFolderPath };
}

/**
 * 遷移主函式
 */
function main() {
  console.log("=".repeat(60));
  console.log("開始將提示 (Prompt) 遷移為技能 (Skills)");
  console.log("=".repeat(60));

  // 檢查提示目錄是否存在
  if (!fs.existsSync(PROMPTS_DIR)) {
    console.error(`錯誤：找不到提示目錄：${PROMPTS_DIR}`);
    process.exit(1);
  }

  // 取得所有提示檔案
  const promptFiles = fs
    .readdirSync(PROMPTS_DIR)
    .filter((file) => file.endsWith(".prompt.md"))
    .map((file) => path.join(PROMPTS_DIR, file));

  console.log(`找到 ${promptFiles.length} 個待轉換的提示檔案\n`);

  const results = {
    success: [],
    alreadyExists: [],
    failed: [],
  };

  // 轉換每個提示
  for (const promptFile of promptFiles) {
    try {
      const result = convertPromptToSkill(promptFile);
      if (result.success) {
        results.success.push(result.name);
      } else if (result.reason === "already-exists") {
        results.alreadyExists.push(result.name);
      } else {
        results.failed.push(result.name);
      }
    } catch (error) {
      const baseName = path.basename(promptFile, ".prompt.md");
      console.error(`  ✗ 轉換 ${baseName} 時發生錯誤：${error.message}`);
      results.failed.push(baseName);
    }
  }

  // 列印摘要
  console.log("\n" + "=".repeat(60));
  console.log("遷移摘要");
  console.log("=".repeat(60));
  console.log(`✓ 成功轉換：${results.success.length}`);
  console.log(`⚠ 已存在：${results.alreadyExists.length}`);
  console.log(`✗ 失敗：${results.failed.length}`);
  console.log(`總計處理：${promptFiles.length}`);

  if (results.failed.length > 0) {
    console.log("\n失敗的轉換：");
    results.failed.forEach((name) => console.log(`  - ${name}`));
  }

  if (results.alreadyExists.length > 0) {
    console.log("\n已跳過 (已存在)：");
    results.alreadyExists.forEach((name) => console.log(`  - ${name}`));
  }

  console.log("\n✅ 遷移完成！");
  console.log(
    "\n後續步驟：\n" +
      "1. 執行 'npm run skill:validate' 以驗證所有新技能\n" +
      "2. 更新外掛程式資訊清單，改為引用技能而非命令 (Commands)\n" +
      "3. 測試完成後移除 prompts 目錄\n"
  );
}

// 執行遷移
main();
