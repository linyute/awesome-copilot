#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import {
  parseCollectionYaml,
  extractMcpServers,
  extractMcpServerConfigs,
  parseFrontmatter,
} from "./yaml-parser.mjs";
import {
  TEMPLATES,
  AKA_INSTALL_URLS,
  repoBaseUrl,
  vscodeInstallImage,
  vscodeInsidersInstallImage,
  ROOT_FOLDER,
  PROMPTS_DIR,
  AGENTS_DIR,
  COLLECTIONS_DIR,
  INSTRUCTIONS_DIR,
  DOCS_DIR,
} from "./constants.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 API 獲取 MCP 註冊伺服器名稱的快取 (小寫)
let MCP_REGISTRY_SET = null;
/**
 * 從 GitHub MCP 註冊 API 載入並快取 MCP 註冊伺服器名稱的集合。
 *
 * 行為:
 * - 如果快取集合已存在 (MCP_REGISTRY_SET)，則立即返回。
 * - 使用基於游標的分頁從 https://api.mcp.github.com/v0.1/servers/ 獲取所有頁面
 * - 通過返回一個空陣列來安全處理網路錯誤或格式錯誤的 JSON。
 * - 從以下位置提取伺服器名稱: data[].server.name
 * - 將名稱標準化為小寫以進行不區分大小寫的匹配
 * - 每個 README 建構執行只命中 API 一次 (針對後續呼叫進行快取)
 *
 * 副作用:
 * - 變更模組範圍變數 MCP_REGISTRY_SET。
 * - 如果獲取或解析註冊失敗，則向控制台記錄警告。
 *
 * @returns {Promise<{ name: string, displayName: string }[]>} 包含名稱和小寫 displayName 的伺服器項目陣列。如果 API 無法訪問或返回格式錯誤的資料，則可能為空。
 *
 * @throws {none} 所有錯誤都在內部捕獲；失敗將導致空陣列。
 */
async function loadMcpRegistryNames() {
  if (MCP_REGISTRY_SET) return MCP_REGISTRY_SET;

  try {
    console.log('正在從 API 獲取 MCP 註冊...');
    const allServers = [];
    let cursor = null;
    const apiUrl = 'https://api.mcp.github.com/v0.1/servers/';

    // 使用基於游標的分頁獲取所有頁面
    do {
      const url = cursor ? `${apiUrl}?cursor=${encodeURIComponent(cursor)}` : apiUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 返回狀態 ${response.status}`);
      }

      const json = await response.json();
      const servers = json?.servers || [];

      // 從響應中提取伺服器名稱和顯示名稱
      for (const entry of servers) {
        const serverName = entry?.server?.name;
        if (serverName) {
          // 嘗試從 GitHub 元資料中獲取顯示名稱，如果沒有則回退到伺服器名稱
          const displayName =
            entry?.server?._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.github?.displayName ||
            serverName;

          allServers.push({
            name: serverName,
            displayName: displayName.toLowerCase(),
            // 同時儲存原始完整名稱以進行匹配
            fullName: serverName.toLowerCase(),
          });
        }
      }

      // 獲取用於分頁的下一個游標
      cursor = json?.metadata?.nextCursor || null;
    } while (cursor);

    console.log(`從 MCP 註冊中載入了 ${allServers.length} 個伺服器`);
    MCP_REGISTRY_SET = allServers;
  } catch (e) {
    console.warn(`從 API 載入 MCP 註冊失敗: ${e.message}`);
    MCP_REGISTRY_SET = [];
  }

  return MCP_REGISTRY_SET;
}

// 添加錯誤處理工具
/**
 * 安全檔案操作封裝
 */
function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`處理檔案 ${filePath} 時發生錯誤: ${error.message}`);
    return defaultValue;
  }
}

function extractTitle(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // 步驟 1: 嘗試使用 vfile-matter 從 frontmatter 獲取標題
      const frontmatter = parseFrontmatter(filePath);

      if (frontmatter) {
        // 檢查標題欄位
        if (frontmatter.title && typeof frontmatter.title === "string") {
          return frontmatter.title;
        }

        // 檢查名稱欄位並轉換為標題大小寫
        if (frontmatter.name && typeof frontmatter.name === "string") {
          return frontmatter.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }

      // 步驟 2: 對於提示/代理/指令檔案，在 frontmatter 之後尋找標題
      if (
        filePath.includes(".prompt.md") ||
        filePath.includes(".agent.md") ||
        filePath.includes(".instructions.md")
      ) {
        // 在 frontmatter 之後尋找第一個標題
        let inFrontmatter = false;
        let frontmatterEnded = false;
        let inCodeBlock = false;

        for (const line of lines) {
          if (line.trim() === "---") {
            if (!inFrontmatter) {
              inFrontmatter = true;
            } else if (inFrontmatter && !frontmatterEnded) {
              frontmatterEnded = true;
            }
            continue;
          }

          // 只在 frontmatter 結束後尋找標題
          if (frontmatterEnded || !inFrontmatter) {
            // 追蹤程式碼區塊以忽略其中的標題
            if (
              line.trim().startsWith("```") ||
              line.trim().startsWith("````")
            ) {
              inCodeBlock = !inCodeBlock;
              continue;
            }

            if (!inCodeBlock && line.startsWith("# ")) {
              return line.substring(2).trim();
            }
          }
        }

        // 步驟 3: 如果找不到標題，則格式化提示/聊天模式/指令檔案的檔案名稱
        const basename = path.basename(
          filePath,
          filePath.includes(".prompt.md")
            ? ".prompt.md"
            : filePath.includes(".agent.md")
            ? ".agent.md"
            : ".instructions.md"
        );
        return basename
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // 步驟 4: 對於其他檔案，尋找第一個標題 (但不在程式碼區塊中)
      let inCodeBlock = false;
      for (const line of lines) {
        if (line.trim().startsWith("```") || line.trim().startsWith("````")) {
          inCodeBlock = !inCodeBlock;
          continue;
        }

        if (!inCodeBlock && line.startsWith("# ")) {
          return line.substring(2).trim();
        }
      }

      // 步驟 5: 回退到檔案名稱
      const basename = path.basename(filePath, path.extname(filePath));
      return basename
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    },
    filePath,
    path
      .basename(filePath, path.extname(filePath))
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

function extractDescription(filePath) {
  return safeFileOperation(
    () => {
      // 使用 vfile-matter 解析所有檔案類型的 frontmatter
      const frontmatter = parseFrontmatter(filePath);

      if (frontmatter && frontmatter.description) {
        return frontmatter.description;
      }

      return null;
    },
    filePath,
    null
  );
}

function makeBadges(link, type) {
  const aka = AKA_INSTALL_URLS[type] || AKA_INSTALL_URLS.instructions;

  const vscodeUrl = `${aka}?url=${encodeURIComponent(
    `vscode:chat-${type}/install?url=${repoBaseUrl}/${link}`
  )}`;
  const insidersUrl = `${aka}?url=${encodeURIComponent(
    `vscode-insiders:chat-${type}/install?url=${repoBaseUrl}/${link}`
  )}`;

  return `[![Install in VS Code](${vscodeInstallImage})](${vscodeUrl})<br />[![Install in VS Code Insiders](${vscodeInsidersInstallImage})](${insidersUrl})`;
}

/**
 * 產生包含所有指令表的指令區段
 */
function generateInstructionsSection(instructionsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(instructionsDir)) {
    return "";
  }

  // 獲取所有指令檔案
  const instructionFiles = fs
    .readdirSync(instructionsDir)
    .filter((file) => file.endsWith(".instructions.md"));

  // 將指令檔案映射到具有標題的物件以進行排序
  const instructionEntries = instructionFiles.map((file) => {
    const filePath = path.join(instructionsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 按標題字母順序排序
  instructionEntries.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`找到了 ${instructionEntries.length} 個指令檔案`);

  // 如果沒有找到檔案，則返回空字串
  if (instructionEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let instructionsContent =
    "| Title | Description |\n| ----- | ----------- |\n";

  // 為每個指令檔案產生表格行
  for (const entry of instructionEntries) {
    const { file, filePath, title } = entry;
    const link = encodeURI(`instructions/${file}`);

    // 檢查 frontmatter 中是否有描述
    const customDescription = extractDescription(filePath);

    // 建立安裝連結的徽章
    const badges = makeBadges(link, "instructions");

    if (customDescription && customDescription !== "null") {
      // 使用 frontmatter 中的描述
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${customDescription} |\n`;
    } else {
      // 回退到預設方法 - 使用標題的最後一個詞作為描述，如果存在則刪除尾隨的 's'
      const topic = title.split(" ").pop().replace(/s$/, "");
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${topic} specific coding standards and best practices |\n`;
    }
  }

  return `${TEMPLATES.instructionsSection}\n${TEMPLATES.instructionsUsage}\n\n${instructionsContent}`;
}

/**
 * 產生包含所有提示的提示區段
 */
function generatePromptsSection(promptsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(promptsDir)) {
    return "";
  }

  // 獲取所有提示檔案
  const promptFiles = fs
    .readdirSync(promptsDir)
    .filter((file) => file.endsWith(".prompt.md"));

  // 將提示檔案映射到具有標題的物件以進行排序
  const promptEntries = promptFiles.map((file) => {
    const filePath = path.join(promptsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 按標題字母順序排序
  promptEntries.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`找到了 ${promptEntries.length} 個提示檔案`);

  // 如果沒有找到檔案，則返回空字串
  if (promptEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let promptsContent = "| Title | Description |\n| ----- | ----------- |\n";

  // 為每個提示檔案產生表格行
  for (const entry of promptEntries) {
    const { file, filePath, title } = entry;
    const link = encodeURI(`prompts/${file}`);

    // 檢查 frontmatter 中是否有描述
    const customDescription = extractDescription(filePath);

    // 建立安裝連結的徽章
    const badges = makeBadges(link, "prompt");

    if (customDescription && customDescription !== "null") {
      promptsContent += `| [${title}](../${link})<br />${badges} | ${customDescription} |\n`;
    } else {
      promptsContent += `| [${title}](../${link})<br />${badges} | | |\n`;
    }
  }

  return `${TEMPLATES.promptsSection}\n${TEMPLATES.promptsUsage}\n\n${promptsContent}`;
}

/**
 * 為代理產生 MCP 伺服器連結
 * @param {string[]} servers - MCP 伺服器名稱陣列
 * @param {{ name: string, displayName: string }[]} registryNames - 為避免非同步呼叫而預先載入的註冊名稱
 * @returns {string} - 帶有徽章的格式化 MCP 伺服器連結
 */
function generateMcpServerLinks(servers, registryNames) {
  if (!servers || servers.length === 0) {
    return "";
  }

  const badges = [
    {
      type: "vscode",
      url: "https://img.shields.io/badge/Install-VS_Code-0098FF?style=flat-square",
      badgeUrl: (serverName) =>
        `https://aka.ms/awesome-copilot/install/mcp-vscode?vscode:mcp/by-name/${serverName}/mcp-server`,
    },
    {
      type: "insiders",
      url: "https://img.shields.io/badge/Install-VS_Code_Insiders-24bfa5?style=flat-square",
      badgeUrl: (serverName) =>
        `https://aka.ms/awesome-copilot/install/mcp-vscode?vscode-insiders:mcp/by-name/${serverName}/mcp-server`,
    },
    {
      type: "visualstudio",
      url: "https://img.shields.io/badge/Install-Visual_Studio-C16FDE?style=flat-square",
      badgeUrl: (serverName) =>
        `https://aka.ms/awesome-copilot/install/mcp-visualstudio?vscode:mcp/by-name/${serverName}/mcp-server`,
    },
  ];

  return servers
    .map((entry) => {
      // 支援字串名稱或帶有配置的物件
      const serverObj = typeof entry === "string" ? { name: entry } : entry;
      const serverName = String(serverObj.name).trim();

      // 建構僅包含配置的 JSON (沒有 stdio 的名稱/類型；只有命令+參數+環境)
      let configPayload = {};
      if (serverObj.type && serverObj.type.toLowerCase() === "http") {
        // HTTP: URL + 標頭
        configPayload = {
          url: serverObj.url || "",
          headers: serverObj.headers || {},
        };
      } else {
        // 本地/stdio: 命令 + 參數 + 環境
        configPayload = {
          command: serverObj.command || "",
          args: Array.isArray(serverObj.args)
            ? serverObj.args.map(encodeURIComponent)
            : [],
          env: serverObj.env || {},
        };
      }

      const encodedConfig = encodeURIComponent(JSON.stringify(configPayload));

      const installBadgeUrls = [
        `[![Install MCP](${badges[0].url})](https://aka.ms/awesome-copilot/install/mcp-vscode?name=${serverName}&config=${encodedConfig})`,
        `[![Install MCP](${badges[1].url})](https://aka.ms/awesome-copilot/install/mcp-vscodeinsiders?name=${serverName}&config=${encodedConfig})`,
        `[![Install MCP](${badges[2].url})](https://aka.ms/awesome-copilot/install/mcp-visualstudio/mcp-install?${encodedConfig})`,
      ].join("<br />");

      // 匹配 displayName 和全名 (不區分大小寫)
      const serverNameLower = serverName.toLowerCase();
      const registryEntry = registryNames.find(
        (entry) => {
          // 精確匹配 displayName 或 fullName
          if (entry.displayName === serverNameLower || entry.fullName === serverNameLower) {
            return true;
          }

          // 檢查 serverName 是否與斜線後的全名的一部分匹配
          // 例如，"apify" 匹配 "com.apify/apify-mcp-server"
          const nameParts = entry.fullName.split('/');
          if (nameParts.length > 1 && nameParts[1]) {
            // 檢查它是否匹配第二部分 (斜線後)
            const secondPart = nameParts[1].replace('-mcp-server', '').replace('-mcp', '');
            if (secondPart === serverNameLower) {
              return true;
            }
          }

          // 檢查 serverName 是否匹配不區分大小寫的 displayName
          return entry.displayName === serverNameLower;
        }
      );
      const serverLabel = registryEntry
        ? `[${serverName}](${`https://github.com/mcp/${registryEntry.name}`})`
        : serverName;
      return `${serverLabel}<br />${installBadgeUrls}`;
    })
    .join("<br />");
}

/**
 * Generate the agents section with a table of all agents
 * @param {string} agentsDir - Directory path
 * @param {{ name: string, displayName: string }[]} registryNames - Pre-loaded MCP registry names
 */
function generateAgentsSection(agentsDir, registryNames = []) {
  return generateUnifiedModeSection({
    dir: agentsDir,
    extension: ".agent.md",
    linkPrefix: "agents",
    badgeType: "agent",
    includeMcpServers: true,
    sectionTemplate: TEMPLATES.agentsSection,
    usageTemplate: TEMPLATES.agentsUsage,
    registryNames,
  });
}

/**
 * 聊天模式和代理的統一產生器 (未來整合)
 * @param {Object} cfg
 * @param {string} cfg.dir - 目錄路徑
 * @param {string} cfg.extension - 要匹配的檔案副檔名 (例如 .agent.md, .agent.md)
 * @param {string} cfg.linkPrefix - 連結前綴資料夾名稱
 * @param {string} cfg.badgeType - 徽章鍵 (mode, agent)
 * @param {boolean} cfg.includeMcpServers - 是否包含 MCP 伺服器欄位
 * @param {string} cfg.sectionTemplate - 區段標題模板
 * @param {string} cfg.usageTemplate - 用法副標題模板
 * @param {{ name: string, displayName: string }[]} cfg.registryNames - 預先載入的 MCP 註冊名稱
 */
function generateUnifiedModeSection(cfg) {
  const {
    dir,
    extension,
    linkPrefix,
    badgeType,
    includeMcpServers,
    sectionTemplate,
    usageTemplate,
    registryNames = [],
  } = cfg;

  if (!fs.existsSync(dir)) {
    console.log(`統一模式區段缺少目錄: ${dir}`);
    return "";
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(extension));

  const entries = files.map((file) => {
    const filePath = path.join(dir, file);
    return { file, filePath, title: extractTitle(filePath) };
  });

  entries.sort((a, b) => a.title.localeCompare(b.title));
  console.log(
    `統一模式產生器: 擴展名為 ${extension} 的 ${entries.length} 個檔案`
  );
  if (entries.length === 0) return "";

  let header = "| 標題 | 描述 |";
  if (includeMcpServers) header += " MCP 伺服器 |";
  let separator = "| ----- | ----------- |";
  if (includeMcpServers) separator += " ----------- |";

  let content = `${header}\n${separator}\n`;

  for (const { file, filePath, title } of entries) {
    const link = encodeURI(`${linkPrefix}/${file}`);
    const description = extractDescription(filePath);
    const badges = makeBadges(link, badgeType);
    let mcpServerCell = "";
    if (includeMcpServers) {
      const servers = extractMcpServerConfigs(filePath);
      mcpServerCell = generateMcpServerLinks(servers, registryNames);
    }

    if (includeMcpServers) {
      content += `| [${title}](../${link})<br />${badges} | ${
        description && description !== "null" ? description : ""
      } | ${mcpServerCell} |\n`;
    } else {
      content += `| [${title}](../${link})<br />${badges} | ${
        description && description !== "null" ? description : ""
      } |\n`;
    }
  }

  return `${sectionTemplate}\n${usageTemplate}\n\n${content}`;
}

/**
 * 產生包含所有集合表的集合區段
 */
function generateCollectionsSection(collectionsDir) {
  // 檢查集合目錄是否存在，如果不存在則建立
  if (!fs.existsSync(collectionsDir)) {
    console.log("集合目錄不存在，正在建立...");
    fs.mkdirSync(collectionsDir, { recursive: true });
  }

  // 獲取所有集合檔案
  const collectionFiles = fs
    .readdirSync(collectionsDir)
    .filter((file) => file.endsWith(".collection.yml"));

  // 將集合檔案映射到具有名稱的物件以進行排序
  const collectionEntries = collectionFiles
    .map((file) => {
      const filePath = path.join(collectionsDir, file);
      const collection = parseCollectionYaml(filePath);

      if (!collection) {
        console.warn(`解析集合失敗: ${file}`);
        return null;
      }

      const collectionId =
        collection.id || path.basename(file, ".collection.yml");
      const name = collection.name || collectionId;
      const isFeatured = collection.display?.featured === true;
      return { file, filePath, collection, collectionId, name, isFeatured };
    })
    .filter((entry) => entry !== null); // 移除失敗的解析

  // 分離精選和常規集合
  const featuredCollections = collectionEntries.filter(
    (entry) => entry.isFeatured
  );
  const regularCollections = collectionEntries.filter(
    (entry) => !entry.isFeatured
  );

  // 按名稱字母順序排序每個組
  featuredCollections.sort((a, b) => a.name.localeCompare(b.name));
  regularCollections.sort((a, b) => a.name.localeCompare(b.name));

  // 合併: 精選優先，然後是常規
  const sortedEntries = [...featuredCollections, ...regularCollections];

  console.log(
    `找到了 ${collectionEntries.length} 個集合檔案 (${featuredCollections.length} 個精選)`
  );

  // 如果沒有集合，則返回空字串
  if (sortedEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let collectionsContent =
    "| 名稱 | 描述 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個集合檔案產生表格行
  for (const entry of sortedEntries) {
    const { collection, collectionId, name, isFeatured } = entry;
    const description = collection.description || "沒有提供描述";
    const itemCount = collection.items ? collection.items.length : 0;
    const tags = collection.tags ? collection.tags.join(", ") : "";

    const link = `../collections/${collectionId}.md`;
    const displayName = isFeatured ? `⭐ ${name}` : name;

    collectionsContent += `| [${displayName}](${link}) | ${description} | ${itemCount} 項目 | ${tags} |\n`;
  }

  return `${TEMPLATES.collectionsSection}\n${TEMPLATES.collectionsUsage}\n\n${collectionsContent}`;
}

/**
 * 為主要的 README 產生精選集合區段
 */
function generateFeaturedCollectionsSection(collectionsDir) {
  // 檢查集合目錄是否存在
  if (!fs.existsSync(collectionsDir)) {
    return "";
  }

  // 獲取所有集合檔案
  const collectionFiles = fs
    .readdirSync(collectionsDir)
    .filter((file) => file.endsWith(".collection.yml"));

  // 將集合檔案映射到具有名稱的物件以進行排序，並過濾精選的
  const featuredCollections = collectionFiles
    .map((file) => {
      const filePath = path.join(collectionsDir, file);
      return safeFileOperation(
        () => {
          const collection = parseCollectionYaml(filePath);
          if (!collection) return null;

          // 只包含 featured: true 的集合
          if (!collection.display?.featured) return null;

          const collectionId =
            collection.id || path.basename(file, ".collection.yml");
          const name = collection.name || collectionId;
          const description = collection.description || "沒有提供描述";
          const tags = collection.tags ? collection.tags.join(", ") : "";
          const itemCount = collection.items ? collection.items.length : 0;

          return {
            file,
            collection,
            collectionId,
            name,
            description,
            tags,
            itemCount,
          };
        },
        filePath,
        null
      );
    })
    .filter((entry) => entry !== null); // 移除非精選和失敗的解析

  // 按名稱字母順序排序
  featuredCollections.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`找到了 ${featuredCollections.length} 個精選集合`);

  // 如果沒有精選集合，則返回空字串
  if (featuredCollections.length === 0) {
    return "";
  }

  // 建立表格標頭
  let featuredContent =
    "| 名稱 | 描述 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個精選集合產生表格行
  for (const entry of featuredCollections) {
    const { collectionId, name, description, tags, itemCount } = entry;
    const readmeLink = `collections/${collectionId}.md`;

    featuredContent += `| [${name}](${readmeLink}) | ${description} | ${itemCount} 項目 | ${tags} |\n`;
  }

  return `${TEMPLATES.featuredCollectionsSection}\n\n${featuredContent}`;
}

/**
 * 產生單獨的集合 README 檔案
 * @param {Object} collection - 集合物件
 * @param {string} collectionId - 集合 ID
 * @param {{ name: string, displayName: string }[]} registryNames - 預先載入的 MCP 註冊名稱
 */
function generateCollectionReadme(collection, collectionId, registryNames = []) {
  if (!collection || !collection.items) {
    return `# ${collectionId}\n\n找不到集合或集合無效。`;
  }

  const name = collection.name || collectionId;
  const description = collection.description || "沒有提供描述。";
  const tags = collection.tags ? collection.tags.join(", ") : "無";

  let content = `# ${name}\n\n${description}\n\n`;

  if (collection.tags && collection.tags.length > 0) {
    content += `**標籤:** ${tags}\n\n`;
  }

  content += `## 此集合中的項目\n\n`;

  // 檢查集合是否有任何代理以確定表格結構 (未來: 聊天模式可能會遷移)
  const hasAgents = collection.items.some((item) => item.kind === "agent");

  // 產生適當的表格標頭
  if (hasAgents) {
    content += `| 標題 | 類型 | 描述 | MCP 伺服器 |\n| ----- | ---- | ----------- | ----------- |\n`;
  } else {
    content += `| 標題 | 類型 | 描述 |\n| ----- | ---- | ----------- |\n`;
  }

  let collectionUsageHeader = "## 集合用法\n\n";
  let collectionUsageContent = [];

  // 根據 display.ordering 設定排序項目
  const items = [...collection.items];
  if (collection.display?.ordering === "alpha") {
    items.sort((a, b) => {
      const titleA = extractTitle(path.join(ROOT_FOLDER, a.path));
      const titleB = extractTitle(path.join(ROOT_FOLDER, b.path));
      return titleA.localeCompare(titleB);
    });
  }

  for (const item of items) {
    const filePath = path.join(ROOT_FOLDER, item.path);
    const title = extractTitle(filePath);
    const description = extractDescription(filePath) || "沒有描述";

    const typeDisplay =
      item.kind === "chat-mode"
        ? "聊天模式"
        : item.kind === "instruction"
        ? "指令"
        : item.kind === "agent"
        ? "代理"
        : "提示";
    const link = `../${item.path}`;

    // 為每個項目建立安裝徽章
    const badges = makeBadges(
      item.path,
      item.kind === "instruction"
        ? "instructions"
        : item.kind === "chat-mode"
        ? "mode"
        : item.kind === "agent"
        ? "agent"
        : "prompt"
    );

    const usageDescription = item.usage
      ? `${description} [查看用法](#${title
          .replace(/\s+/g, "-")
          .toLowerCase()})`
      : description;

    // 如果集合有代理，則產生 MCP 伺服器欄位
    content += buildCollectionRow({
      hasAgents,
      title,
      link,
      badges,
      typeDisplay,
      usageDescription,
      filePath,
      kind: item.kind,
      registryNames,
    });
    // 為每個集合產生用法區段
    if (item.usage && item.usage.trim()) {
      collectionUsageContent.push(
        `### ${title}\n\n${item.usage.trim()}\n\n---\n\n`
      );
    }
  }

  // 如果有定義任何用法的項目，則附加用法區段
  if (collectionUsageContent.length > 0) {
    content += `\n${collectionUsageHeader}${collectionUsageContent.join("")}`;
  } else if (collection.display?.show_badge) {
    content += "\n---\n";
  }

  // 如果 show_badge 為 true，則在結尾處可選地添加徽章備註
  if (collection.display?.show_badge) {
    content += `*此集合包含 **${name}** 的 ${items.length} 個精選項目。*`;
  }

  return content;
}

/**
 * 為集合項目建立單個 markdown 表格行。
 * 當代理存在時處理可選的 MCP 伺服器欄位。
 */
function buildCollectionRow({
  hasAgents,
  title,
  link,
  badges,
  typeDisplay,
  usageDescription,
  filePath,
  kind,
  registryNames = [],
}) {
  if (hasAgents) {
    // 目前只有代理具有 MCP 伺服器；未來的遷移可能會擴展到聊天模式。
    const mcpServers =
      kind === "agent" ? extractMcpServerConfigs(filePath) : [];
    const mcpServerCell =
      mcpServers.length > 0 ? generateMcpServerLinks(mcpServers, registryNames) : "";
    return `| [${title}](${link})<br />${badges} | ${typeDisplay} | ${usageDescription} | ${mcpServerCell} |\n`;
  }
  return `| [${title}](${link})<br />${badges} | ${typeDisplay} | ${usageDescription} |\n`;
}

// 工具程式: 僅在內容變更時寫入檔案
function writeFileIfChanged(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const original = fs.readFileSync(filePath, "utf8");
    if (original === content) {
      console.log(
        `${path.basename(filePath)} 已是最新狀態。無需任何變更。`
      );
      return;
    }
  }
  fs.writeFileSync(filePath, content);
  console.log(
    `${path.basename(filePath)} ${exists ? "已成功更新" : "已成功建立"}！`
  );
}

// 使用現有產生器建構每個類別的 README 內容，將標題升級為 H1
function buildCategoryReadme(sectionBuilder, dirPath, headerLine, usageLine, registryNames = []) {
  const section = sectionBuilder(dirPath, registryNames);
  if (section && section.trim()) {
    // 將獨立 README 檔案的第一個 markdown 標題級別從 ## 升級到 #
    return section.replace(/^##\s/m, "# ");
  }
  // 如果沒有找到任何條目，則回退內容
  return `${headerLine}\n\n${usageLine}\n\n_尚未找到任何條目。_`;
}

// 主要執行包裝在非同步函式中
async function main() {
  try {
    console.log("正在產生類別 README 檔案...");

    // 在開始時載入 MCP 註冊名稱一次
    const registryNames = await loadMcpRegistryNames();

    // 通過將區段標頭轉換為 H1 來組合獨立檔案的標頭
    const instructionsHeader = TEMPLATES.instructionsSection.replace(
      /^##\s/m,
      "# "
    );
    const promptsHeader = TEMPLATES.promptsSection.replace(/^##\s/m, "# ");
    const agentsHeader = TEMPLATES.agentsSection.replace(/^##\s/m, "# ");
    const collectionsHeader = TEMPLATES.collectionsSection.replace(
      /^##\s/m,
      "# "
    );

    const instructionsReadme = buildCategoryReadme(
      generateInstructionsSection,
      INSTRUCTIONS_DIR,
      instructionsHeader,
      TEMPLATES.instructionsUsage,
      registryNames
    );
    const promptsReadme = buildCategoryReadme(
      generatePromptsSection,
      PROMPTS_DIR,
      promptsHeader,
      TEMPLATES.promptsUsage,
      registryNames
    );
    // 產生代理 README
    const agentsReadme = buildCategoryReadme(
      generateAgentsSection,
      AGENTS_DIR,
      agentsHeader,
      TEMPLATES.agentsUsage,
      registryNames
    );

  // 產生集合 README
  const collectionsReadme = buildCategoryReadme(
    generateCollectionsSection,
    COLLECTIONS_DIR,
    collectionsHeader,
    TEMPLATES.collectionsUsage,
    registryNames
  );

  // 確保 docs 目錄存在以用於類別輸出
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  // 將類別輸出寫入 docs 資料夾
  writeFileIfChanged(
    path.join(DOCS_DIR, "README.instructions.md"),
    instructionsReadme
  );
  writeFileIfChanged(path.join(DOCS_DIR, "README.prompts.md"), promptsReadme);
  writeFileIfChanged(path.join(DOCS_DIR, "README.agents.md"), agentsReadme);
  writeFileIfChanged(
    path.join(DOCS_DIR, "README.collections.md"),
    collectionsReadme
  );

  // 產生個別集合 README 檔案
  if (fs.existsSync(COLLECTIONS_DIR)) {
    console.log("正在產生個別集合 README 檔案...");

    const collectionFiles = fs
      .readdirSync(COLLECTIONS_DIR)
      .filter((file) => file.endsWith(".collection.yml"));

    for (const file of collectionFiles) {
      const filePath = path.join(COLLECTIONS_DIR, file);
      const collection = parseCollectionYaml(filePath);

      if (collection) {
        const collectionId =
          collection.id || path.basename(file, ".collection.yml");
        const readmeContent = generateCollectionReadme(
          collection,
          collectionId,
          registryNames
        );
        const readmeFile = path.join(COLLECTIONS_DIR, `${collectionId}.md`);
        writeFileIfChanged(readmeFile, readmeContent);
      }
    }
  }

  // 產生精選集合區段並更新主要 README.md
  console.log("正在使用精選集合更新主要 README.md...");
  const featuredSection = generateFeaturedCollectionsSection(COLLECTIONS_DIR);

  if (featuredSection) {
    const mainReadmePath = path.join(ROOT_FOLDER, "README.md");

    if (fs.existsSync(mainReadmePath)) {
      let readmeContent = fs.readFileSync(mainReadmePath, "utf8");

      // 定義標記以識別要插入精選集合的位置
      const startMarker = "## 🌟 Featured Collections";
      const endMarker = "## MCP Server";

      // 檢查區段是否已存在
      const startIndex = readmeContent.indexOf(startMarker);

      if (startIndex !== -1) {
        // 區段存在，替換它
        const endIndex = readmeContent.indexOf(endMarker, startIndex);
        if (endIndex !== -1) {
          // 替換現有區段
          const beforeSection = readmeContent.substring(0, startIndex);
          const afterSection = readmeContent.substring(endIndex);
          readmeContent =
            beforeSection + featuredSection + "\n\n" + afterSection;
        }
      } else {
        // 區段不存在，在 "## MCP Server" 之前插入它
        const mcpIndex = readmeContent.indexOf(endMarker);
        if (mcpIndex !== -1) {
          const beforeMcp = readmeContent.substring(0, mcpIndex);
          const afterMcp = readmeContent.substring(mcpIndex);
          readmeContent = beforeMcp + featuredSection + "\n\n" + afterMcp;
        }
      }

      writeFileIfChanged(mainReadmePath, readmeContent);
      console.log("主要 README.md 已使用精選集合更新");
    } else {
      console.warn("未找到 README.md，跳過精選集合更新");
    }
  } else {
    console.log("找不到要新增到 README.md 的精選集合");
  }
  } catch (error) {
    console.error(`產生類別 README 檔案時發生錯誤: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行主要函式
main().catch((error) => {
  console.error(`嚴重錯誤: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
