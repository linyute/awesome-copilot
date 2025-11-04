#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { parseCollectionYaml, parseFrontmatter } = require("./yaml-parser");
const {
  ROOT_FOLDER,
  COLLECTIONS_DIR,
  MAX_COLLECTION_ITEMS,
} = require("./constants");

// 驗證函式
function validateCollectionId(id) {
  if (!id || typeof id !== "string") {
    return "ID 為必填項且必須是字串";
  }
  if (!/^[a-z0-9-]+$/.test(id)) {
    return "ID 只能包含小寫字母、數字和連字號";
  }
  if (id.length < 1 || id.length > 50) {
    return "ID 必須介於 1 到 50 個字元之間";
  }
  return null;
}

function validateCollectionName(name) {
  if (!name || typeof name !== "string") {
    return "名稱為必填項且必須是字串";
  }
  if (name.length < 1 || name.length > 100) {
    return "名稱必須介於 1 到 100 個字元之間";
  }
  return null;
}

function validateCollectionDescription(description) {
  if (!description || typeof description !== "string") {
    return "描述為必填項且必須是字串";
  }
  if (description.length < 1 || description.length > 500) {
    return "描述必須介於 1 到 500 個字元之間";
  }
  return null;
}

function validateCollectionTags(tags) {
  if (tags && !Array.isArray(tags)) {
    return "標籤必須是陣列";
  }
  if (tags && tags.length > 10) {
    return "最多允許 10 個標籤";
  }
  if (tags) {
    for (const tag of tags) {
      if (typeof tag !== "string") {
        return "所有標籤都必須是字串";
      }
      if (!/^[a-z0-9-]+$/.test(tag)) {
        return `標籤 "${tag}" 只能包含小寫字母、數字和連字號`;
      }
      if (tag.length < 1 || tag.length > 30) {
        return `標籤 "${tag}" 必須介於 1 到 30 個字元之間`;
      }
    }
  }
  return null;
}

function validateAgentFile(filePath) {
  try {
    const agent = parseFrontmatter(filePath);

    if (!agent) {
      return `項目 ${filePath} 代理程式檔案無法解析`;
    }

    // Validate name field
    if (!agent.name || typeof agent.name !== "string") {
      return `項目 ${filePath} 代理程式必須有 'name' 欄位`;
    }
    if (agent.name.length < 1 || agent.name.length > 50) {
      return `項目 ${filePath} 代理程式名稱必須介於 1 到 50 個字元之間`;
    }

    // Validate description field
    if (!agent.description || typeof agent.description !== "string") {
      return `項目 ${filePath} 代理程式必須有 'description' 欄位`;
    }
    if (agent.description.length < 1 || agent.description.length > 500) {
      return `項目 ${filePath} 代理程式描述必須介於 1 到 500 個字元之間`;
    }

    // Validate tools field (optional)
    if (agent.tools !== undefined && !Array.isArray(agent.tools)) {
      return `項目 ${filePath} 代理程式 'tools' 必須是陣列`;
    }

    // Validate mcp-servers field (optional)
    if (agent["mcp-servers"]) {
      if (
        typeof agent["mcp-servers"] !== "object" ||
        Array.isArray(agent["mcp-servers"])
      ) {
        return `項目 ${filePath} 代理程式 'mcp-servers' 必須是物件`;
      }

      // Validate each MCP server configuration
      for (const [serverName, serverConfig] of Object.entries(
        agent["mcp-servers"]
      )) {
        if (!serverConfig || typeof serverConfig !== "object") {
          return `項目 ${filePath} 代理程式 MCP 伺服器 '${serverName}' 必須是物件`;
        }

        if (!serverConfig.type || typeof serverConfig.type !== "string") {
          return `項目 ${filePath} 代理程式 MCP 伺服器 '${serverName}' 必須有 'type' 欄位`;
        }

        // For local type servers, command is required
        if (serverConfig.type === "local" && !serverConfig.command) {
          return `項目 ${filePath} 代理程式 MCP 伺服器 '${serverName}' 類型為 'local' 時必須有 'command' 欄位`;
        }

        // Validate args if present
        if (
          serverConfig.args !== undefined &&
          !Array.isArray(serverConfig.args)
        ) {
          return `項目 ${filePath} 代理程式 MCP 伺服器 '${serverName}' 'args' 必須是陣列`;
        }

        // Validate tools if present
        if (
          serverConfig.tools !== undefined &&
          !Array.isArray(serverConfig.tools)
        ) {
          return `項目 ${filePath} 代理程式 MCP 伺服器 '${serverName}' 'tools' 必須是陣列`;
        }

        // Validate env if present
        if (serverConfig.env !== undefined) {
          if (
            typeof serverConfig.env !== "object" ||
            Array.isArray(serverConfig.env)
          ) {
            return `項目 ${filePath} 代理程式 MCP 伺服器 '${serverName}' 'env' 必須是物件`;
          }
        }
      }
    }

    return null; // All validations passed
  } catch (error) {
    return `項目 ${filePath} 代理程式檔案驗證失敗：${error.message}`;
  }
}

function validateCollectionItems(items) {
  if (!items || !Array.isArray(items)) {
    return "項目為必填項且必須是陣列";
  }
  if (items.length < 1) {
    return "至少需要一個項目";
  }
  if (items.length > MAX_COLLECTION_ITEMS) {
    return `最多允許 ${MAX_COLLECTION_ITEMS} 個項目`;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== "object") {
      return `項目 ${i + 1} 必須是物件`;
    }
    if (!item.path || typeof item.path !== "string") {
      return `項目 ${i + 1} 必須有路徑字串`;
    }
    if (!item.kind || typeof item.kind !== "string") {
      return `項目 ${i + 1} 必須有種類字串`;
    }
    if (!["prompt", "instruction", "chat-mode", "agent"].includes(item.kind)) {
      return `項目 $
        ${i + 1}
      種類必須是以下之一：prompt, instruction, chat-mode, agent`;
    }

    // Validate file path exists
    const filePath = path.join(ROOT_FOLDER, item.path);
    if (!fs.existsSync(filePath)) {
      return `項目 ${i + 1} 檔案不存在：${item.path}`;
    }

    // Validate path pattern matches kind
    if (item.kind === "prompt" && !item.path.endsWith(".prompt.md")) {
      return `項目 $
        ${i + 1}
      種類為 "prompt" 但路徑未以 .prompt.md 結尾`;
    }
    if (
      item.kind === "instruction" &&
      !item.path.endsWith(".instructions.md")
    ) {
      return `項目 $
        ${i + 1}
      種類為 "instruction" 但路徑未以 .instructions.md 結尾`;
    }
    if (item.kind === "chat-mode" && !item.path.endsWith(".chatmode.md")) {
      return `項目 $
        ${i + 1}
      種類為 "chat-mode" 但路徑未以 .chatmode.md 結尾`;
    }
    if (item.kind === "agent" && !item.path.endsWith(".agent.md")) {
      return `項目 $
        ${i + 1}
      種類為 "agent" 但路徑未以 .agent.md 結尾`;
    }

    // Validate agent-specific frontmatter
    if (item.kind === "agent") {
      const agentValidation = validateAgentFile(filePath, i + 1);
      if (agentValidation) {
        return agentValidation;
      }
    }
  }
  return null;
}

function validateCollectionDisplay(display) {
  if (display && typeof display !== "object") {
    return "顯示必須是物件";
  }
  if (display) {
    //正規化排序和 show_badge，以防 YAML 解析器留下內聯註釋
    const normalize = (val) => {
      if (typeof val !== "string") return val;
      //剝離任何以 '#' 開頭的內聯註釋
      const hashIndex = val.indexOf("#");
      if (hashIndex !== -1) {
        val = val.substring(0, hashIndex).trim();
      }
      //如果存在，也剝離周圍的引號
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.substring(1, val.length - 1);
      }
      return val.trim();
    };

    if (display.ordering) {
      const normalizedOrdering = normalize(display.ordering);
      if (!["manual", "alpha"].includes(normalizedOrdering)) {
        return "顯示排序必須是 'manual' 或 'alpha'";
      }
    }

    if (display.show_badge !== undefined) {
      const raw = display.show_badge;
      const normalizedBadge = normalize(raw);
      //接受布林值或字串布林值
      if (typeof normalizedBadge === "string") {
        if (!["true", "false"].includes(normalizedBadge.toLowerCase())) {
          return "顯示 show_badge 必須是布林值";
        }
      } else if (typeof normalizedBadge !== "boolean") {
        return "顯示 show_badge 必須是布林值";
      }
    }
  }
  return null;
}

function validateCollectionManifest(collection, filePath) {
  const errors = [];

  const idError = validateCollectionId(collection.id);
  if (idError) errors.push(`ID: ${idError}`);

  const nameError = validateCollectionName(collection.name);
  if (nameError) errors.push(`Name: ${nameError}`);

  const descError = validateCollectionDescription(collection.description);
  if (descError) errors.push(`Description: ${descError}`);

  const tagsError = validateCollectionTags(collection.tags);
  if (tagsError) errors.push(`Tags: ${tagsError}`);

  const itemsError = validateCollectionItems(collection.items);
  if (itemsError) errors.push(`Items: ${itemsError}`);

  const displayError = validateCollectionDisplay(collection.display);
  if (displayError) errors.push(`Display: ${displayError}`);

  return errors;
}

// 主要驗證函式
function validateCollections() {
  if (!fs.existsSync(COLLECTIONS_DIR)) {
    console.log("找不到集合目錄 - 跳過驗證");
    return true;
  }

  const collectionFiles = fs
    .readdirSync(COLLECTIONS_DIR)
    .filter((file) => file.endsWith(".collection.yml"));

  if (collectionFiles.length === 0) {
    console.log("找不到集合檔案 - 跳過驗證");
    return true;
  }

  console.log(`正在驗證 ${collectionFiles.length} 個集合檔案...`);

  let hasErrors = false;
  const usedIds = new Set();

  for (const file of collectionFiles) {
    const filePath = path.join(COLLECTIONS_DIR, file);
    console.log(`\n正在驗證 ${file}...`);

    const collection = parseCollectionYaml(filePath);
    if (!collection) {
      console.error(`❌ 解析 ${file} 失敗`);
      hasErrors = true;
      continue;
    }

    // 驗證集合結構
    const errors = validateCollectionManifest(collection, filePath);

    if (errors.length > 0) {
      console.error(`❌ ${file} 中的驗證錯誤：`);
      errors.forEach((error) => console.error(`   - ${error}`));
      hasErrors = true;
    } else {
      console.log(`✅ ${file} 有效`);
    }

    // 檢查重複的 ID
    if (collection.id) {
      if (usedIds.has(collection.id)) {
        console.error(
          `❌ 在 ${file} 中找到重複的集合 ID "${collection.id}"`
        );
        hasErrors = true;
      } else {
        usedIds.add(collection.id);
      }
    }
  }

  if (!hasErrors) {
    console.log(`\n✅ 所有 ${collectionFiles.length} 個集合都有效`);
  }

  return !hasErrors;
}

// 執行驗證
try {
  const isValid = validateCollections();
  if (!isValid) {
    console.error("\n❌ 集合驗證失敗");
    process.exit(1);
  }
  console.log("\n🎉 集合驗證通過");
} catch (error) {
  console.error(`驗證期間發生錯誤：${error.message}`);
  process.exit(1);
}
