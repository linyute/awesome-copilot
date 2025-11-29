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

// 從 github-mcp-registry.json 載入的 MCP 註冊表伺服器名稱 (小寫) 快取
let MCP_REGISTRY_SET = null;
/**
 * 載入並快取 MCP 註冊表伺服器顯示名稱 (小寫) 的集合。
 *
 * 行為：
 * - 如果快取集合已存在 (MCP_REGISTRY_SET)，則立即傳回。
 * - 嘗試從與此指令碼相同的目錄中讀取名為 "github-mcp-registry.json" 的 JSON 註冊表檔案。
 * - 透過傳回空集合來安全處理遺失檔案或格式錯誤的 JSON。
 * - 從 json.payload.mcpRegistryRoute.serversData.servers 中提取伺服器顯示名稱。
 * - 將名稱正規化為小寫並將其儲存在集合中，以進行 O(1) 成員檢查。
 *
 * 副作用：
 * - 修改模組範圍變數 MCP_REGISTRY_SET。
 * - 如果讀取或解析註冊表失敗，則向控制台記錄警告。
 *
 * @returns {{ name: string, displayName: string }[]} 小寫伺服器顯示名稱的集合。如果註冊表檔案不存在、無法讀取或格式錯誤，則可能為空。
 *
 * @throws {none} 所有錯誤都在內部捕獲；失敗會導致空集合。
 */
function loadMcpRegistryNames() {
  if (MCP_REGISTRY_SET) return MCP_REGISTRY_SET;
  try {
    const registryPath = path.join(__dirname, "github-mcp-registry.json");
    if (!fs.existsSync(registryPath)) {
      MCP_REGISTRY_SET = [];
      return MCP_REGISTRY_SET;
    }
    const raw = fs.readFileSync(registryPath, "utf8");
    const json = JSON.parse(raw);
    const servers = json?.payload?.mcpRegistryRoute?.serversData?.servers || [];
    MCP_REGISTRY_SET = servers.map((s) => ({
      name: s.name,
      displayName: s.display_name.toLowerCase(),
    }));
  } catch (e) {
    console.warn(`載入 MCP 註冊表失敗：${e.message}`);
    MCP_REGISTRY_SET = [];
  }
  return MCP_REGISTRY_SET;
}

// 新增錯誤處理公用程式
/**
 * 安全檔案操作包裝函式
 */
function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`處理檔案 ${filePath} 時發生錯誤：${error.message}`);
    return defaultValue;
  }
}

function extractTitle(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // 步驟 1：嘗試使用 vfile-matter 從 frontmatter 取得標題
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

      // 步驟 2：對於提示/代理程式/指示檔案，在 frontmatter 之後尋找標題
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

          // 僅在 frontmatter 結束後尋找標題
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

        // 步驟 3：如果找不到標題，則格式化提示/聊天模式/指示檔案的檔案名稱
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

      // 步驟 4：對於其他檔案，尋找第一個標題 (但不在程式碼區塊中)
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

      // 步驟 5：回退到檔案名稱
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
      // Use vfile-matter to parse frontmatter for all file types
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
 * 產生包含所有指示表格的指示區塊
 */
function generateInstructionsSection(instructionsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(instructionsDir)) {
    return "";
  }

  // 取得所有指示檔案
  const instructionFiles = fs
    .readdirSync(instructionsDir)
    .filter((file) => file.endsWith(".instructions.md"));

  // 將指示檔案映射到具有標題的物件以進行排序
  const instructionEntries = instructionFiles.map((file) => {
    const filePath = path.join(instructionsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 按標題字母順序排序
  instructionEntries.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`找到 ${instructionEntries.length} 個指示檔案`);

  // 如果找不到檔案，則傳回空字串
  if (instructionEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let instructionsContent =
    "| Title | Description |\n| ----- | ----------- |\n";

  // 為每個指示檔案產生表格列
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
      // 回退到預設方法 - 使用標題的最後一個字作為描述，如果存在則移除尾隨的 's'
      const topic = title.split(" ").pop().replace(/s$/, "");
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${topic} specific coding standards and best practices |\n`;
    }
  }

  return `${TEMPLATES.instructionsSection}\n${TEMPLATES.instructionsUsage}\n\n${instructionsContent}`;
}

/**
 * 產生包含所有提示表格的提示區塊
 */
function generatePromptsSection(promptsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(promptsDir)) {
    return "";
  }

  // 取得所有提示檔案
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

  console.log(`找到 ${promptEntries.length} 個提示檔案`);

  // 如果找不到檔案，則傳回空字串
  if (promptEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let promptsContent = "| Title | Description |\n| ----- | ----------- |\n";

  // 為每個提示檔案產生表格列
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
 * 為代理程式產生 MCP 伺服器連結
 * @param {string[]} servers - MCP 伺服器名稱陣列
 * @returns {string} - 帶有徽章的格式化 MCP 伺服器連結
 */
function generateMcpServerLinks(servers) {
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

  const registryNames = loadMcpRegistryNames();

  return servers
    .map((entry) => {
      // 支援字串名稱或帶有組態的物件
      const serverObj = typeof entry === "string" ? { name: entry } : entry;
      const serverName = String(serverObj.name).trim();

      // 建立僅限組態的 JSON (stdio 沒有名稱/類型；只有命令+參數+環境變數)
      let configPayload = {};
      if (serverObj.type && serverObj.type.toLowerCase() === "http") {
        // HTTP：url + 標頭
        configPayload = {
          url: serverObj.url || "",
          headers: serverObj.headers || {},
        };
      } else {
        // 本機/stdio：命令 + 參數 + 環境變數
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

      const registryEntry = registryNames.find(
        (entry) => entry.displayName === serverName.toLowerCase()
      );
      const serverLabel = registryEntry
        ? `[${serverName}](${`https://github.com/mcp/${registryEntry.name}`})`
        : serverName;
      return `${serverLabel}<br />${installBadgeUrls}`;
    })
    .join("<br />");
}

/**
 * 產生包含所有代理程式表格的代理程式區塊
 */
function generateAgentsSection(agentsDir) {
  return generateUnifiedModeSection({
    dir: agentsDir,
    extension: ".agent.md",
    linkPrefix: "agents",
    badgeType: "agent",
    includeMcpServers: true,
    sectionTemplate: TEMPLATES.agentsSection,
    usageTemplate: TEMPLATES.agentsUsage,
  });
}

/**
 * 聊天模式和代理程式的統一產生器 (未來整合)
 * @param {Object} cfg
 * @param {string} cfg.dir - 目錄路徑
 * @param {string} cfg.extension - 要匹配的檔案副檔名 (例如 .agent.md, .agent.md)
 * @param {string} cfg.linkPrefix - 連結前綴資料夾名稱
 * @param {string} cfg.badgeType - 徽章鍵 (模式、代理程式)
 * @param {boolean} cfg.includeMcpServers - 是否包含 MCP 伺服器欄位
 * @param {string} cfg.sectionTemplate - 區塊標題模板
 * @param {string} cfg.usageTemplate - 用法副標題模板
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
  } = cfg;

  if (!fs.existsSync(dir)) {
    console.log(`統一模式區塊缺少目錄：${dir}`);
    return "";
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(extension));

  const entries = files.map((file) => {
    const filePath = path.join(dir, file);
    return { file, filePath, title: extractTitle(filePath) };
  });

  entries.sort((a, b) => a.title.localeCompare(b.title));
  console.log(
    `統一模式產生器：擴展名為 ${extension} 的 ${entries.length} 個檔案`
  );
  if (entries.length === 0) return "";

  let header = "| Title | Description |";
  if (includeMcpServers) header += " MCP Servers |";
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
      mcpServerCell = generateMcpServerLinks(servers);
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
 * 產生包含所有集合表格的集合區塊
 */
function generateCollectionsSection(collectionsDir) {
  // 檢查集合目錄是否存在，如果不存在則建立它
  if (!fs.existsSync(collectionsDir)) {
    console.log("集合目錄不存在，正在建立...");
    fs.mkdirSync(collectionsDir, { recursive: true });
  }

  // 取得所有集合檔案
  const collectionFiles = fs
    .readdirSync(collectionsDir)
    .filter((file) => file.endsWith(".collection.yml"));

  // 將集合檔案映射到具有名稱的物件以進行排序
  const collectionEntries = collectionFiles
    .map((file) => {
      const filePath = path.join(collectionsDir, file);
      const collection = parseCollectionYaml(filePath);

      if (!collection) {
        console.warn(`解析集合失敗：${file}`);
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

  // 組合：精選優先，然後是常規
  const sortedEntries = [...featuredCollections, ...regularCollections];

  console.log(
    `找到 ${collectionEntries.length} 個集合檔案 (${featuredCollections.length} 個精選)`
  );

  // 如果沒有集合，則傳回空字串
  if (sortedEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let collectionsContent =
    "| Name | Description | Items | Tags |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個集合檔案產生表格列
  for (const entry of sortedEntries) {
    const { collection, collectionId, name, isFeatured } = entry;
    const description = collection.description || "無描述";
    const itemCount = collection.items ? collection.items.length : 0;
    const tags = collection.tags ? collection.tags.join(", ") : "無";

    const link = `../collections/${collectionId}.md`;
    const displayName = isFeatured ? `⭐ ${name}` : name;

    collectionsContent += `| [${displayName}](${link}) | ${description} | ${itemCount} items | ${tags} |\n`;
  }

  return `${TEMPLATES.collectionsSection}\n${TEMPLATES.collectionsUsage}\n\n${collectionsContent}`;
}

/**
 * 為主 README 產生精選集合區塊
 */
function generateFeaturedCollectionsSection(collectionsDir) {
  // 檢查集合目錄是否存在
  if (!fs.existsSync(collectionsDir)) {
    return "";
  }

  // 取得所有集合檔案
  const collectionFiles = fs
    .readdirSync(collectionsDir)
    .filter((file) => file.endsWith(".collection.yml"));

  // 將集合檔案映射到具有名稱的物件以進行排序，篩選精選
  const featuredCollections = collectionFiles
    .map((file) => {
      const filePath = path.join(collectionsDir, file);
      return safeFileOperation(
        () => {
          const collection = parseCollectionYaml(filePath);
          if (!collection) return null;

          // 僅包含 featured: true 的集合
          if (!collection.display?.featured) return null;

          const collectionId =
            collection.id || path.basename(file, ".collection.yml");
          const name = collection.name || collectionId;
          const description = collection.description || "無描述";
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

  console.log(`找到 ${featuredCollections.length} 個精選集合`);

  // 如果沒有精選集合，則傳回空字串
  if (featuredCollections.length === 0) {
    return "";
  }

  // 建立表格標頭
  let featuredContent =
    "| Name | Description | Items | Tags |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個精選集合產生表格列
  for (const entry of featuredCollections) {
    const { collectionId, name, description, tags, itemCount } = entry;
    const readmeLink = `collections/${collectionId}.md`;

    featuredContent += `| [${name}](${readmeLink}) | ${description} | ${itemCount} items | ${tags} |\n`;
  }

  return `${TEMPLATES.featuredCollectionsSection}\n\n${featuredContent}`;
}

/**
 * 產生個別集合 README 檔案
 */
function generateCollectionReadme(collection, collectionId) {
  if (!collection || !collection.items) {
    return `# ${collectionId}\n\n找不到集合或集合無效。`;
  }

  const name = collection.name || collectionId;
  const description = collection.description || "未提供描述。";
  const tags = collection.tags ? collection.tags.join(", ") : "無";

  let content = `# ${name}\n\n${description}\n\n`;

  if (collection.tags && collection.tags.length > 0) {
    content += `**標籤：** ${tags}\n\n`;
  }

  content += `## 此集合中的項目\n\n`;

  // 檢查集合是否有任何代理程式以確定表格結構 (未來：聊天模式可能會遷移)
  const hasAgents = collection.items.some((item) => item.kind === "agent");

  // 產生適當的表格標頭
  if (hasAgents) {
    content += `| Title | Type | Description | MCP Servers |\n| ----- | ---- | ----------- | ----------- |\n`;
  } else {
    content += `| Title | Type | Description |\n| ----- | ---- | ----------- |\n`;
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
    const description = extractDescription(filePath) || "無描述";

    const typeDisplay =
      item.kind === "chat-mode"
        ? "Chat Mode"
        : item.kind === "instruction"
        ? "Instruction"
        : item.kind === "agent"
        ? "Agent"
        : "Prompt";
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
      ? `${description} [see usage](#${title
          .replace(/\s+/g, "-")
          .toLowerCase()})`
      : description;

    // 如果集合有代理程式，則產生 MCP 伺服器欄位
    content += buildCollectionRow({
      hasAgents,
      title,
      link,
      badges,
      typeDisplay,
      usageDescription,
      filePath,
      kind: item.kind,
    });
    // 為每個集合產生用法區塊
    if (item.usage && item.usage.trim()) {
      collectionUsageContent.push(
        `### ${title}\n\n${item.usage.trim()}\n\n---\n\n`
      );
    }
  }

  // 如果任何項目定義了用法，則附加用法區塊
  if (collectionUsageContent.length > 0) {
    content += `\n${collectionUsageHeader}${collectionUsageContent.join("")}`;
  } else if (collection.display?.show_badge) {
    content += "\n---\n";
  }

  // 如果 show_badge 為 true，則在結尾處可選的徽章註釋
  if (collection.display?.show_badge) {
    content += `*此集合包含 **${name}** 的 ${items.length} 個精選項目。*`;
  }

  return content;
}

/**
 * 為集合項目建立單個 markdown 表格列。
 * 當存在代理程式時，處理可選的 MCP 伺服器欄位。
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
}) {
  if (hasAgents) {
    // 目前只有代理程式有 MCP 伺服器；未來的遷移可能會擴展到聊天模式。
    const mcpServers =
      kind === "agent" ? extractMcpServerConfigs(filePath) : [];
    const mcpServerCell =
      mcpServers.length > 0 ? generateMcpServerLinks(mcpServers) : "";
    return `| [${title}](${link})<br />${badges} | ${typeDisplay} | ${usageDescription} | ${mcpServerCell} |\n`;
  }
  return `| [${title}](${link})<br />${badges} | ${typeDisplay} | ${usageDescription} |\n`;
}

// 公用程式：僅在內容更改時寫入檔案
function writeFileIfChanged(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const original = fs.readFileSync(filePath, "utf8");
    if (original === content) {
      console.log(
        `${path.basename(filePath)} 已是最新狀態。無需更改。`
      );
      return;
    }
  }
  fs.writeFileSync(filePath, content);
  console.log(
    `${path.basename(filePath)} ${exists ? "已成功更新" : "已成功建立"}！`
  );
}

// 使用現有產生器建立每個類別的 README 內容，將標題升級為 H1
function buildCategoryReadme(sectionBuilder, dirPath, headerLine, usageLine) {
  const section = sectionBuilder(dirPath);
  if (section && section.trim()) {
    // Upgrade the first markdown heading level from ## to # for standalone README files
    return section.replace(/^##\s/m, "# ");
  }
  // 找不到項目時的回退內容
  return `${headerLine}\n\n${usageLine}\n\n_尚未找到任何項目。_`;
}

// 主要執行
try {
  console.log("正在產生類別 README 檔案...");

  // 透過將區塊標頭轉換為 H1 來為獨立檔案撰寫標頭
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
    TEMPLATES.instructionsUsage
  );
  const promptsReadme = buildCategoryReadme(
    generatePromptsSection,
    PROMPTS_DIR,
    promptsHeader,
    TEMPLATES.promptsUsage
  );

  // 產生代理程式 README
  const agentsReadme = buildCategoryReadme(
    generateAgentsSection,
    AGENTS_DIR,
    agentsHeader,
    TEMPLATES.agentsUsage
  );

  // 產生集合 README
  const collectionsReadme = buildCategoryReadme(
    generateCollectionsSection,
    COLLECTIONS_DIR,
    collectionsHeader,
    TEMPLATES.collectionsUsage
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
          collectionId
        );
        const readmeFile = path.join(COLLECTIONS_DIR, `${collectionId}.md`);
        writeFileIfChanged(readmeFile, readmeContent);
      }
    }
  }

  // 產生精選集合區塊並更新主 README.md
  console.log("正在使用精選集合更新主 README.md...");
  const featuredSection = generateFeaturedCollectionsSection(COLLECTIONS_DIR);

  if (featuredSection) {
    const mainReadmePath = path.join(ROOT_FOLDER, "README.md");

    if (fs.existsSync(mainReadmePath)) {
      let readmeContent = fs.readFileSync(mainReadmePath, "utf8");

      // 定義標記以識別插入精選集合的位置
      const startMarker = "## 🌟 Featured Collections";
      const endMarker = "## MCP Server";

      // 檢查區塊是否已存在
      const startIndex = readmeContent.indexOf(startMarker);

      if (startIndex !== -1) {
        // 區塊存在，替換它
        const endIndex = readmeContent.indexOf(endMarker, startIndex);
        if (endIndex !== -1) {
          // 替換現有區塊
          const beforeSection = readmeContent.substring(0, startIndex);
          const afterSection = readmeContent.substring(endIndex);
          readmeContent =
            beforeSection + featuredSection + "\n\n" + afterSection;
        }
      } else {
        // 區塊不存在，在 "## MCP Server" 之前插入它
        const mcpIndex = readmeContent.indexOf(endMarker);
        if (mcpIndex !== -1) {
          const beforeMcp = readmeContent.substring(0, mcpIndex);
          const afterMcp = readmeContent.substring(mcpIndex);
          readmeContent = beforeMcp + featuredSection + "\n\n" + afterMcp;
        }
      }

      writeFileIfChanged(mainReadmePath, readmeContent);
      console.log("主 README.md 已使用精選集合更新");
    } else {
      console.warn("找不到 README.md，跳過精選集合更新");
    }
  } else {
    console.log("找不到要新增到 README.md 的精選集合");
  }
} catch (error) {
  console.error(`產生類別 README 檔案時發生錯誤：${error.message}`);
  process.exit(1);
}
