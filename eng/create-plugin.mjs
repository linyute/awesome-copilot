#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 封裝 readline 的提問功能為 Promise
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// 解析命令列引數
function parseArgs() {
  const args = process.argv.slice(2);
  const out = { name: undefined, keywords: undefined };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--name" || a === "-n") {
      out.name = args[i + 1];
      i++;
    } else if (a.startsWith("--name=")) {
      out.name = a.split("=")[1];
    } else if (a === "--keywords" || a === "--tags" || a === "-t") {
      out.keywords = args[i + 1];
      i++;
    } else if (a.startsWith("--keywords=") || a.startsWith("--tags=")) {
      out.keywords = a.split("=")[1];
    } else if (!a.startsWith("-") && !out.name) {
      // 第一個位置引數 -> 名稱
      out.name = a;
    } else if (!a.startsWith("-") && out.name && !out.keywords) {
      // 第二個位置引數 -> 關鍵字
      out.keywords = a;
    }
  }

  if (Array.isArray(out.keywords)) {
    out.keywords = out.keywords.join(",");
  }

  return out;
}

// 建立新外掛程式的主要邏輯
async function createPlugin() {
  try {
    console.log("🔌 外掛程式建立工具 (Plugin Creator)");
    console.log("此工具將協助您建立新的外掛程式。\n");

    const parsed = parseArgs();

    // 取得外掛程式 ID
    let pluginId = parsed.name;
    if (!pluginId) {
      pluginId = await prompt("外掛程式 ID (僅限小寫字母與連字號)：");
    }

    if (!pluginId) {
      console.error("❌ 必須提供外掛程式 ID");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(pluginId)) {
      console.error(
        "❌ 外掛程式 ID 必須僅包含小寫字母、數字與連字號"
      );
      process.exit(1);
    }

    const pluginDir = path.join(PLUGINS_DIR, pluginId);

    // 檢查外掛程式是否已存在
    if (fs.existsSync(pluginDir)) {
      console.log(
        `⚠️  外掛程式 ${pluginId} 已存在於 ${pluginDir}`
      );
      console.log("💡 請改為編輯該外掛程式，或選擇不同的 ID。");
      process.exit(1);
    }

    // 取得顯示名稱
    const defaultDisplayName = pluginId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let displayName = await prompt(
      `顯示名稱 (預設：${defaultDisplayName})：`
    );
    if (!displayName.trim()) {
      displayName = defaultDisplayName;
    }

    // 取得說明
    const defaultDescription = `${displayName} 的專屬外掛程式。`;
    let description = await prompt(
      `說明 (預設：${defaultDescription})：`
    );
    if (!description.trim()) {
      description = defaultDescription;
    }

    // 取得關鍵字
    let keywords = [];
    let keywordInput = parsed.keywords;
    if (!keywordInput) {
      keywordInput = await prompt(
        "關鍵字 (以逗號分隔，或直接按 Enter 使用預設值)："
      );
    }

    if (keywordInput && keywordInput.toString().trim()) {
      keywords = keywordInput
        .toString()
        .split(",")
        .map((kw) => kw.trim())
        .filter((kw) => kw);
    } else {
      keywords = pluginId.split("-").slice(0, 3);
    }

    // 建立目錄結構
    const githubPluginDir = path.join(pluginDir, ".github", "plugin");
    fs.mkdirSync(githubPluginDir, { recursive: true });

    // 產生 plugin.json
    const pluginJson = {
      name: pluginId,
      description,
      version: "1.0.0",
      keywords,
      author: { name: "Awesome Copilot Community" },
      repository: "https://github.com/github/awesome-copilot",
      license: "MIT",
    };

    fs.writeFileSync(
      path.join(githubPluginDir, "plugin.json"),
      JSON.stringify(pluginJson, null, 2) + "\n"
    );

    // 產生 README.md
    const readmeContent = `# ${displayName} 外掛程式

${description}

## 安裝方式

\`\`\`bash
copilot plugin install ${pluginId}@awesome-copilot
\`\`\`

## 包含內容

_在此處加入您的外掛程式內容。_

## 原始碼

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 專案的一部分。

## 授權條款

MIT
`;

    fs.writeFileSync(path.join(pluginDir, "README.md"), readmeContent);

    console.log(`\n✅ 已建立外掛程式：${pluginDir}`);
    console.log("\n📝 後續步驟：");
    console.log(`1. 將代理程式、提示或指引加入 plugins/${pluginId}/`);
    console.log(`2. 使用您的 Metadata 更新 plugins/${pluginId}/.github/plugin/plugin.json`);
    console.log(`3. 編輯 plugins/${pluginId}/README.md 以描述您的外掛程式`);
    console.log("4. 執行 'npm run build' 以重新產生文件");
  } catch (error) {
    console.error(`❌ 建立外掛程式時發生錯誤：${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createPlugin();
