#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { SKILLS_DIR } from "./constants.mjs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { name: undefined, description: undefined };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--name" || a === "-n") {
      out.name = args[i + 1];
      i++;
    } else if (a.startsWith("--name=")) {
      out.name = a.split("=")[1];
    } else if (a === "--description" || a === "-d") {
      out.description = args[i + 1];
      i++;
    } else if (a.startsWith("--description=")) {
      out.description = a.split("=")[1];
    } else if (!a.startsWith("-") && !out.name) {
      out.name = a;
    }
  }

  return out;
}

async function createSkillTemplate() {
  try {
    console.log("🎯 代理程式技能建立器");
    console.log(
      "此工具將幫助您建立一個遵循代理程式技能規範的新技能。\n"
    );

    const parsed = parseArgs();

    // 獲取技能名稱
    let skillName = parsed.name;
    if (!skillName) {
      skillName = await prompt("技能名稱 (小寫，僅限連字號): ");
    }

    // 驗證技能名稱格式
    if (!skillName) {
      console.error("❌ 技能名稱為必填項目");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(skillName)) {
      console.error(
        "❌ 技能名稱只能包含小寫字母、數字和連字號"
      );
      process.exit(1);
    }

    const skillFolder = path.join(SKILLS_DIR, skillName);

    // 檢查資料夾是否已存在
    if (fs.existsSync(skillFolder)) {
      console.log(`⚠️ 技能資料夾 ${skillName} 已存在於 ${skillFolder}`);
      console.log("💡 請選擇不同的名稱或編輯現有技能。");
      process.exit(1);
    }

    // 獲取描述
    let description = parsed.description;
    if (!description) {
      description = await prompt(
        "描述 (此技能的作用和使用時機): "
      );
    }

    if (!description || description.trim().length < 10) {
      console.error(
        "❌ 描述為必填項目，且必須至少 10 個字元 (最大 1024)"
      );
      process.exit(1);
    }

    // 獲取技能標題 (顯示名稱)
    const defaultTitle = skillName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let skillTitle = await prompt(`技能標題 (預設: ${defaultTitle}): `);
    if (!skillTitle.trim()) {
      skillTitle = defaultTitle;
    }

    // 建立技能資料夾
    fs.mkdirSync(skillFolder, { recursive: true });

    // 建立 SKILL.md 範本
    const skillMdContent = `---
name: ${skillName}
description: ${description}
---

# ${skillTitle}

此技能提供 [此技能作用的簡要概述]。

## 何時使用此技能

當您需要時使用此技能:
- [主要用途]
- [次要用途]
- [其他用途]

## 先決條件

- [所需工具/環境]
- [選用依賴項]

## 核心功能

### 1. [功能名稱]
[此功能作用的描述]

### 2. [功能名稱]
[此功能作用的描述]

## 使用範例

### 範例 1: [用途]
\`\`\`[language]
// 範例程式碼或指示
\`\`\`

### 範例 2: [用途]
\`\`\`[language]
// 範例程式碼或指示
\`\`\`

## 指南

1. **[指南 1]** - [解釋]
2. **[指南 2]** - [解釋]
3. **[指南 3]** - [解釋]

## 常見模式

### 模式: [模式名稱]
\`\`\`[language]
// 範例模式
\`\`\`

### 模式: [模式名稱]
\`\`\`[language]
// 範例模式
\`\`\`

## 限制

- [限制 1]
- [限制 2]
- [限制 3]
`;

    const skillFilePath = path.join(skillFolder, "SKILL.md");
    fs.writeFileSync(skillFilePath, skillMdContent);

    console.log(`\n✅ 已建立技能資料夾: ${skillFolder}`);
    console.log(`✅ 已建立 SKILL.md: ${skillFilePath}`);

    // 詢問是否要新增捆綁資產
    const addAssets = await prompt(
      "\n您是否要新增捆綁資產？ (輔助腳本、範本等) [y/N]: "
    );

    if (addAssets.toLowerCase() === "y" || addAssets.toLowerCase() === "yes") {
      console.log(
        "\n📁 您現在可以手動或使用編輯器將檔案新增到技能資料夾。"
      );
      console.log(
        "   常見的捆綁資產：輔助腳本、程式碼範本、參考資料"
      );
      console.log(`   技能資料夾位置: ${skillFolder}`);
    }

    console.log("\n📝 後續步驟:");
    console.log("1. 編輯 SKILL.md 以完成技能指示");
    console.log("2. 將任何捆綁資產 (腳本、範本、資料) 新增到技能資料夾");
    console.log("3. 執行 'npm run skill:validate' 以驗證技能");
    console.log("4. 執行 'npm run build' 以產生文件");

    console.log("\n📖 資源:");
    console.log(
      "   - Anthropic 技能規範: https://agentskills.io/specification"
    );
    console.log(
      "   - 專案文件: AGENTS.md (代理程式技能部分)"
    );
  } catch (error) {
    console.error(`❌ 建立技能範本時發生錯誤: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 執行互動式建立流程
createSkillTemplate();
