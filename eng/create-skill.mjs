#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { dump } from "js-yaml";
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
    console.log("🎯 Agent Skills Creator");
    console.log(
      "This tool will help you create a new skill following the Agent Skills specification.\n"
    );

    const parsed = parseArgs();

    // 取得 skill 名稱
    let skillName = parsed.name;
    if (!skillName) {
      skillName = await prompt("Skill 名稱（僅限小寫字母與連字號）：");
    }

    // 驗證 skill 名稱格式
    if (!skillName) {
      console.error("❌ 需要提供 Skill 名稱");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(skillName)) {
      console.error(
        "❌ Skill 名稱只能包含小寫英文字母、數字與連字號"
      );
      process.exit(1);
    }

    const skillFolder = path.join(SKILLS_DIR, skillName);

    // 檢查資料夾是否已存在
    if (fs.existsSync(skillFolder)) {
      console.log(`⚠️  Skill 資料夾 ${skillName} 已存在於 ${skillFolder}`);
      console.log("💡 請選擇不同名稱或編輯現有的 skill。");
      process.exit(1);
    }

    // 取得說明描述
    let description = parsed.description;
    if (!description) {
      description = await prompt(
        "說明描述（此 skill 的用途與使用時機）："
      );
    }

    if (!description || description.trim().length < 10) {
      console.error(
        "❌ 需要提供說明描述，且長度至少須 10 個字元（上限 1024）"
      );
      process.exit(1);
    }

    // 取得 skill 標題（顯示名稱）
    const defaultTitle = skillName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let skillTitle = await prompt(`Skill title (default: ${defaultTitle}): `);
    if (!skillTitle.trim()) {
      skillTitle = defaultTitle;
    }

    // 建立 skill 資料夾
    fs.mkdirSync(skillFolder, { recursive: true });

    // 建立 SKILL.md 範本
    const frontmatter = dump(
      { name: skillName, description },
      { forceQuotes: true, quotingType: "'", lineWidth: -1 }
    );
    const skillMdContent = `---
${frontmatter}---

# ${skillTitle}

此 skill 提供 [此 skill 功能的簡短概觀]。

## 何時使用此 Skill

請在需要執行下列作業時使用此 skill：
- [主要使用案例]
- [次要使用案例]
- [其他使用案例]

## 先決條件

- [必要的工具／環境]
- [選用相依性]

## 核心功能

### 1. [功能名稱]
[此功能作用的說明描述]

### 2. [功能名稱]
[此功能作用的說明描述]

## 使用範例

### 範例 1：[使用案例]
\`\`\`[language]
// 範例程式碼或指示
\`\`\`

### 範例 2：[使用案例]
\`\`\`[language]
// 範例程式碼或指示
\`\`\`

## 指引

1. **[指引 1]** - [說明]
2. **[指引 2]** - [說明]
3. **[指引 3]** - [說明]

## 常見模式

### 模式：[模式名稱]
\`\`\`[language]
// 範例模式
\`\`\`

### 模式：[模式名稱]
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

    console.log(`\n✅ Created skill folder: ${skillFolder}`);
    console.log(`✅ Created SKILL.md: ${skillFilePath}`);

    // 詢問是否要新增隨附資產
    const addAssets = await prompt(
      "\n是否要新增隨附資產？（協助程式指令碼、範本等）[y/N]："
    );

    if (addAssets.toLowerCase() === "y" || addAssets.toLowerCase() === "yes") {
      console.log(
        "\n📁 你現在可以手動或使用編輯器將檔案新增至 skill 資料夾。"
      );
      console.log(
        "   常見隨附資產：協助程式指令碼、程式碼範本、參考資料"
      );
      console.log(`   Skill 資料夾位置：${skillFolder}`);
    }

    console.log("\n📝 後續步驟：");
    console.log("1. 編輯 SKILL.md 以完成 skill 指示");
    console.log("2. 將任何隨附資產（指令碼、範本、資料）新增至 skill 資料夾");
    console.log("3. 執行 'npm run skill:validate' 驗證 skill");
    console.log("4. 執行 'npm run build' 產生說明文件");

    console.log("\n📖 資源：");
    console.log(
      "   - Anthropic Skills Spec: https://agentskills.io/specification"
    );
    console.log(
      "   - 專案說明文件：AGENTS.md（Agent Skills 章節）"
    );
  } catch (error) {
    console.error(`❌ 建立 skill 範本時發生錯誤：${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 執行互動式建立流程
createSkillTemplate();
