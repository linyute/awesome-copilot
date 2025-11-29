#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { COLLECTIONS_DIR } from "./constants.mjs";

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
  const out = { id: undefined, tags: undefined };

  // 簡單的長/短選項解析
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--id" || a === "-i") {
      out.id = args[i + 1];
      i++;
    } else if (a.startsWith("--id=")) {
      out.id = a.split("=")[1];
    } else if (a === "--tags" || a === "-t") {
      out.tags = args[i + 1];
      i++;
    } else if (a.startsWith("--tags=")) {
      out.tags = a.split("=")[1];
    } else if (!a.startsWith("-") && !out.id) {
      // 第一個位置參數 -> id
      out.id = a;
    } else if (!a.startsWith("-") && out.id && !out.tags) {
      // 第二個位置參數 -> 標籤
      out.tags = a;
    }
  }

  // 將標籤正規化為字串 (逗號分隔) 或 undefined
  if (Array.isArray(out.tags)) {
    out.tags = out.tags.join(",");
  }

  return out;
}

async function createCollectionTemplate() {
  try {
    console.log("🎯 集合建立程式");
    console.log("此工具將協助您建立新的集合清單。\n");

    // 解析 CLI 參數，如果缺少則回退到互動式提示
    const parsed = parseArgs();
    // 取得集合 ID
    let collectionId = parsed.id;
    if (!collectionId) {
      collectionId = await prompt("集合 ID (僅限小寫、連字號)： ");
    }

    // 驗證集合 ID 格式
    if (!collectionId) {
      console.error("❌ 集合 ID 為必填項");
      process.exit(1);
    }

    if (!/^[a-z0-9-]+$/.test(collectionId)) {
      console.error(
        "❌ 集合 ID 只能包含小寫字母、數字和連字號"
      );
      process.exit(1);
    }

    const filePath = path.join(
      COLLECTIONS_DIR,
      `${collectionId}.collection.yml`
    );

    // 檢查檔案是否已存在
    if (fs.existsSync(filePath)) {
      console.log(
        `⚠️ 集合 ${collectionId} 已存在於 ${filePath}`
      );
      console.log("💡 請改為編輯該檔案或選擇不同的 ID。");
      process.exit(1);
    }

    // 確保集合目錄存在
    if (!fs.existsSync(COLLECTIONS_DIR)) {
      fs.mkdirSync(COLLECTIONS_DIR, { recursive: true });
    }

    // 取得集合名稱
    const defaultName = collectionId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    let collectionName = await prompt(
      `集合名稱 (預設值: ${defaultName})： `
    );
    if (!collectionName.trim()) {
      collectionName = defaultName;
    }

    // 取得描述
    const defaultDescription = `與${collectionName.toLowerCase()}相關的提示和指令、代理程式集合。`;
    let description = await prompt(
      `描述 (預設值: ${defaultDescription})： `
    );
    if (!description.trim()) {
      description = defaultDescription;
    }

    // 取得標籤 (來自 CLI 或提示)
    let tags = [];
    let tagInput = parsed.tags;
    if (!tagInput) {
      tagInput = await prompt(
        "標籤 (逗號分隔，或按 Enter 鍵使用預設值)： "
      );
    }

    if (tagInput && tagInput.toString().trim()) {
      tags = tagInput
        .toString()
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    } else {
      // 從集合 ID 產生一些預設標籤
      tags = collectionId.split("-").slice(0, 3);
    }

    // 模板內容
    const template = `id: ${collectionId}
name: ${collectionName}
description: ${description}
tags: [${tags.join(", ")}]
items:
  # 在此處新增您的集合項目
  # 範例：
  # - path: prompts/example.prompt.md
  #   kind: prompt
  # - path: instructions/example.instructions.md
  #   kind: instruction
  # - path: agents/example.agent.md
  #   kind: agent
    # - path: agents/example.agent.md
    #   kind: agent
    #   usage: |
    #     此代理程式需要安裝範例 MCP 伺服器。
    #     組態任何必要的環境變數 (例如，EXAMPLE_API_KEY)。
display:
  ordering: alpha # 或 "manual" 以保留上述順序
  show_badge: false # 設定為 true 以在項目上顯示集合徽章
`;

    fs.writeFileSync(filePath, template);
    console.log(`✅ 已建立集合模板：${filePath}`);
    console.log("\n📝 後續步驟：");
    console.log("1. 編輯集合清單以新增您的項目");
    console.log("2. 視需要更新名稱、描述和標籤");
    console.log("3. 執行 'npm run collection:validate' 以進行驗證");
    console.log("4. 執行 'npm start' 以產生文件");
    console.log("\n📄 集合模板內容：");
    console.log(template);
  } catch (error) {
    console.error(`❌ 建立集合模板時發生錯誤：${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 執行互動式建立程式
createCollectionTemplate();
