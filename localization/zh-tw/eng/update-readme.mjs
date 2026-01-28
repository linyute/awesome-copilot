#!/usr/bin/env node

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {
  AGENTS_DIR,
  AKA_INSTALL_URLS,
  COLLECTIONS_DIR,
  DOCS_DIR,
  INSTRUCTIONS_DIR,
  PROMPTS_DIR,
  repoBaseUrl,
  ROOT_FOLDER,
  SKILLS_DIR,
  TEMPLATES,
  vscodeInsidersInstallImage,
  vscodeInstallImage,
} from "./constants.mjs";
import {
  extractMcpServerConfigs,
  parseCollectionYaml,
  parseFrontmatter,
  parseSkillMetadata,
} from "./yaml-parser.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP 註冊伺服器名稱（小寫）的快取，從 API 獲取
let MCP_REGISTRY_SET = null;
/**
 * 從 GitHub MCP 註冊 API 載入並快取 MCP 註冊伺服器名稱集合。
 *
 * 行為：
 * - 如果快取集合已存在 (MCP_REGISTRY_SET)，則立即回傳。
 * - 使用基於游標的分頁從 https://api.mcp.github.com/v0.1/servers/ 獲取所有頁面
 * - 透過回傳空陣列安全地處理網路錯誤或格式錯誤的 JSON。
 * - 從以下位置提取伺服器名稱：data[].server.name
 * - 將名稱標準化為小寫以進行不區分大小寫的匹配
 * - 每個 README 建構執行只會命中 API 一次（後續呼叫會快取）
 *
 * 副作用：
 * - 修改模組範圍變數 MCP_REGISTRY_SET。
 * - 如果獲取或解析註冊失敗，則會將警告記錄到控制台。
 *
 * @returns {Promise<{ name: string, displayName: string }[]>} 包含名稱和小寫 displayName 的伺服器項目陣列。
 * 如果 API 無法存取或回傳格式錯誤的資料，則可能為空。
 *
 * @throws {none} 所有錯誤都在內部捕獲；失敗會導致空陣列。
 */
async function loadMcpRegistryNames() {
  if (MCP_REGISTRY_SET) return MCP_REGISTRY_SET;

  try {
    console.log("從 API 獲取 MCP 註冊...");
    const allServers = [];
    let cursor = null;
    const apiUrl = "https://api.mcp.github.com/v0.1/servers/";

    // 使用基於游標的分頁獲取所有頁面
    do {
      const url = cursor
        ? `${apiUrl}?cursor=${encodeURIComponent(cursor)}`
        : apiUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 回傳狀態 ${response.status}`);
      }

      const json = await response.json();
      const servers = json?.servers || [];

      // 從回應中提取伺服器名稱和顯示名稱
      for (const entry of servers) {
        const serverName = entry?.server?.name;
        if (serverName) {
          // 嘗試從 GitHub Metadata 獲取顯示名稱，如果沒有則回退到伺服器名稱
          const displayName =
            entry?.server?._meta?.[
              "io.modelcontextprotocol.registry/publisher-provided"
            ]?.github?.displayName || serverName;

          allServers.push({
            name: serverName,
            displayName: displayName.toLowerCase(),
            // 同時儲存用於匹配的原始完整名稱
            fullName: serverName.toLowerCase(),
          });
        }
      }

      // 獲取用於分頁的下一個游標
      cursor = json?.metadata?.nextCursor || null;
    } while (cursor);

    console.log(`從 MCP 註冊載入 ${allServers.length} 個伺服器`);
    MCP_REGISTRY_SET = allServers;
  } catch (e) {
    console.warn(`從 API 載入 MCP 註冊失敗: ${e.message}`);
    MCP_REGISTRY_SET = [];
  }

  return MCP_REGISTRY_SET;
}

// 新增錯誤處理公用程式
/**
 * 安全檔案作業包裝器
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

      // 步驟 1：嘗試使用 vfile-matter 從前置內容獲取標題
      const frontmatter = parseFrontmatter(filePath);

      if (frontmatter) {
        // 檢查標題欄位
        if (frontmatter.title && typeof frontmatter.title === "string") {
          return frontmatter.title;
        }

        // 檢查名稱欄位並轉換為標題格式
        if (frontmatter.name && typeof frontmatter.name === "string") {
          return frontmatter.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }

      // 步驟 2：對於提示/代理程式/指示檔案，在前置內容後尋找標題
      if (
        filePath.includes(".prompt.md") ||
        filePath.includes(".agent.md") ||
        filePath.includes(".instructions.md")
      ) {
        // 在前置內容後尋找第一個標題
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

          // 只在前置內容結束後尋找標題
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

      // 步驟 4：對於其他檔案，尋找第一個標題（但不在程式碼區塊中）
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
      // 使用 vfile-matter 解析所有檔案類型的前置內容
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

/**
 * 格式化任意多行文字，以便在 Markdown 表格儲存格中安全呈現。
 * - 透過轉換為 <br /> 來保留換行符
 * - 逃脫管道字元 (|) 以避免破壞表格欄位
 * - 修剪每行的前導/尾隨空格
 * - 摺疊多個連續空白行
 * 在表格中使用時，應將此應用於所有檔案類型的描述。
 *
 * @param {string|null|undefined} text
 * @returns {string} 表格安全內容
 */
function formatTableCell(text) {
  if (text === null || text === undefined) return "";
  let s = String(text);
  // 正規化行尾
  s = s.replace(/\r\n/g, "\n");
  // 分割行、修剪、刪除空群組同時保留意圖的中斷
  const lines = s
    .split("\n")
    .map((l) => l.trim())
    .filter((_, idx, arr) => {
      // 保留單個空白行，移除連續空白行
      if (arr[idx] !== "") return true;
      return arr[idx - 1] !== ""; // 允許一個空白行，移除重複項
    });
  s = lines.join("\n");
  // 逃脫表格管道
  s = s.replace(/\|/g, "&#124;");
  // 轉換剩餘的換行符為 <br />，用於單一儲存格呈現
  s = s.replace(/\n/g, "<br />");
  return s.trim();
}

function makeBadges(link, type) {
  const aka = AKA_INSTALL_URLS[type] || AKA_INSTALL_URLS.instructions;

  const vscodeUrl = `${aka}?url=${encodeURIComponent(
    `vscode:chat-${type}/install?url=${repoBaseUrl}/${link}`
  )}`;
  const insidersUrl = `${aka}?url=${encodeURIComponent(
    `vscode-insiders:chat-${type}/install?url=${repoBaseUrl}/${link}`
  )}`;

  return `[![在 VS Code 中安裝](${vscodeInstallImage})](${vscodeUrl})<br />[![在 VS Code Insiders 中安裝](${vscodeInsidersInstallImage})](${insidersUrl})`;
}

/**
 * 產生指示區段，其中包含所有指示的表格
 */
function generateInstructionsSection(instructionsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(instructionsDir)) {
    return "";
  }

  // 獲取所有指示檔案
  const instructionFiles = fs
    .readdirSync(instructionsDir)
    .filter((file) => file.endsWith(".instructions.md"));

  // 將指示檔案映射到包含用於排序的標題的物件
  const instructionEntries = instructionFiles.map((file) => {
    const filePath = path.join(instructionsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 按字母順序依標題排序
  instructionEntries.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`找到 ${instructionEntries.length} 個指示檔案`);

  // 如果找不到檔案，則回傳空字串
  if (instructionEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let instructionsContent =
    "| 標題 | 描述 |\n| ----- | ----------- |\n";

  // 為每個指示檔案產生表格列
  for (const entry of instructionEntries) {
    const { file, filePath, title } = entry;
    const link = encodeURI(`instructions/${file}`);

    // 檢查前置內容中是否有描述
    const customDescription = extractDescription(filePath);

    // 建立安裝連結的徽章
    const badges = makeBadges(link, "instructions");

    if (customDescription && customDescription !== "null") {
      // 使用前置內容中的描述, table-safe
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${formatTableCell(
        customDescription
      )} |\n`;
    } else {
      // 回退到預設方法 - 使用標題的最後一個單字作為描述，如果存在則移除尾隨的 's'
      const topic = title.split(" ").pop().replace(/s$/, "");
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${topic} 特定程式碼標準和最佳實踐 |\n`;
    }
  }

  return `${TEMPLATES.instructionsSection}\n${TEMPLATES.instructionsUsage}\n\n${instructionsContent}`;
}

/**
 * 產生提示區段，其中包含所有提示的表格
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

  // 將提示檔案映射到包含用於排序的標題的物件
  const promptEntries = promptFiles.map((file) => {
    const filePath = path.join(promptsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 按字母順序依標題排序
  promptEntries.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`找到 ${promptEntries.length} 個提示檔案`);

  // 如果找不到檔案，則回傳空字串
  if (promptEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let promptsContent = "| 標題 | 描述 |\n| ----- | ----------- |\n";

  // 為每個提示檔案產生表格列
  for (const entry of promptEntries) {
    const { file, filePath, title } = entry;
    const link = encodeURI(`prompts/${file}`);

    // 檢查前置內容中是否有描述
    const customDescription = extractDescription(filePath);

    // 建立安裝連結的徽章
    const badges = makeBadges(link, "prompt");

    if (customDescription && customDescription !== "null") {
      promptsContent += `| [${title}](../${link})<br />${badges} | ${formatTableCell(
        customDescription
      )} |\n`;
    } else {
      promptsContent += `| [${title}](../${link})<br />${badges} | | |\n`;
    }
  }

  return `${TEMPLATES.promptsSection}\n${TEMPLATES.promptsUsage}\n\n${promptsContent}`;
}

/**
 * 為代理程式產生 MCP 伺服器連結
 * @param {string[]} servers - MCP 伺服器名稱陣列
 * @param {{ name: string, displayName: string }[]} registryNames - 預載入的註冊名稱以避免非同步呼叫
 * @returns {string} - 格式化的 MCP 伺服器連結與徽章
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
      // 支援字串名稱或包含設定的物件
      const serverObj = typeof entry === "string" ? { name: entry } : entry;
      const serverName = String(serverObj.name).trim();

      // 建構僅限設定的 JSON (stdio 沒有名稱/類型；只有命令+參數+環境變數)
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
        `[![安裝 MCP](${badges[0].url})](https://aka.ms/awesome-copilot/install/mcp-vscode?name=${serverName}&config=${encodedConfig})`,
        `[![安裝 MCP](${badges[1].url})](https://aka.ms/awesome-copilot/install/mcp-vscodeinsiders?name=${serverName}&config=${encodedConfig})`,
        `[![安裝 MCP](${badges[2].url})](https://aka.ms/awesome-copilot/install/mcp-visualstudio/mcp-install?${encodedConfig})`,
      ].join("<br />");

      // 針對 displayName 和完整名稱進行匹配（不區分大小寫）
      const serverNameLower = serverName.toLowerCase();
      const registryEntry = registryNames.find((entry) => {
        // displayName 或 fullName 精確匹配
        if (
          entry.displayName === serverNameLower ||
          entry.fullName === serverNameLower
        ) {
          return true;
        }

        // 檢查 serverName 是否匹配斜線後完整名稱的一部分
        // 例如，「apify」匹配「com.apify/apify-mcp-server」
        const nameParts = entry.fullName.split("/");
        if (nameParts.length > 1 && nameParts[1]) {
          // 檢查是否匹配第二部分（斜線後）
          const secondPart = nameParts[1]
            .replace("-mcp-server", "")
            .replace("-mcp", "");
          if (secondPart === serverNameLower) {
            return true;
          }
        }

        // 檢查 serverName 是否匹配 displayName（忽略大小寫）
        return entry.displayName === serverNameLower;
      });
      const serverLabel = registryEntry
        ? `[${serverName}](${`https://github.com/mcp/${registryEntry.name}`})`
        : serverName;
      return `${serverLabel}<br />${installBadgeUrls}`;
    })
    .join("<br />");
}

/**
 * 產生代理程式區段，其中包含所有代理程式的表格
 * @param {string} agentsDir - 目錄路徑
 * @param {{ name: string, displayName: string }[]} registryNames - 預載入的 MCP 註冊名稱
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
 * 產生技能區段，其中包含所有技能的表格
 */
function generateSkillsSection(skillsDir) {
  if (!fs.existsSync(skillsDir)) {
    console.log(`技能目錄不存在: ${skillsDir}`);
    return "";
  }

  // 獲取所有技能資料夾 (目錄)
  const skillFolders = fs.readdirSync(skillsDir).filter((file) => {
    const filePath = path.join(skillsDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  // 解析每個技能資料夾
  const skillEntries = skillFolders
    .map((folder) => {
      const skillPath = path.join(skillsDir, folder);
      const metadata = parseSkillMetadata(skillPath);
      if (!metadata) return null;

      return {
        folder,
        name: metadata.name,
        description: metadata.description,
        assets: metadata.assets,
      };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`找到 ${skillEntries.length} 個技能`);

  if (skillEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let content =
    "| 名稱 | 描述 | 捆綁資產 |\n| ---- | ----------- | -------------- |\n";

  // 為每個技能產生表格列
  for (const skill of skillEntries) {
    const link = `../skills/${skill.folder}/SKILL.md`;
    const assetsList =
      skill.assets.length > 0
        ? skill.assets.map((a) => `\`${a}\``).join("<br />")
        : "無";

    content += `| [${skill.name}](${link}) | ${formatTableCell(
      skill.description
    )} | ${assetsList} |\n`;
  }

  return `${TEMPLATES.skillsSection}\n${TEMPLATES.skillsUsage}\n\n${content}`;
}

/**
 * 代理程式的統一產生器 (未來整合)
 * @param {Object} cfg
 * @param {string} cfg.dir - 目錄路徑
 * @param {string} cfg.extension - 要匹配的檔案副檔名 (例如 .agent.md, .agent.md)
 * @param {string} cfg.linkPrefix - 連結前綴資料夾名稱
 * @param {string} cfg.badgeType - 徽章鍵 (模式, 代理程式)
 * @param {boolean} cfg.includeMcpServers - 是否包含 MCP 伺服器欄位
 * @param {string} cfg.sectionTemplate - 區段標題範本
 * @param {string} cfg.usageTemplate - 用法副標題範本
 * @param {{ name: string, displayName: string }[]} cfg.registryNames - 預載入的 MCP 註冊名稱
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
    `統一模式產生器：${entries.length} 個檔案的副檔名為 ${extension}`
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

    const descCell =
      description && description !== "null" ? formatTableCell(description) : "";
    if (includeMcpServers) {
      content += `| [${title}](../${link})<br />${badges} | ${descCell} | ${mcpServerCell} |\n`;
    } else {
      content += `| [${title}](../${link})<br />${badges} | ${descCell} |\n`;
    }
  }

  return `${sectionTemplate}\n${usageTemplate}\n\n${content}`;
}

/**
 * 產生集合區段，其中包含所有集合的表格
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

  // 將集合檔案映射到包含用於排序的名稱的物件
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

  // 排序每個組別（按名稱字母順序）
  featuredCollections.sort((a, b) => a.name.localeCompare(b.name));
  regularCollections.sort((a, b) => a.name.localeCompare(b.name));

  // 組合：精選在前，然後是常規
  const sortedEntries = [...featuredCollections, ...regularCollections];

  console.log(
    `找到 ${collectionEntries.length} 個集合檔案 (${featuredCollections.length} 個精選)`
  );

  // 如果找不到集合，則回傳空字串
  if (sortedEntries.length === 0) {
    return "";
  }

  // 建立表格標頭
  let collectionsContent =
    "| 名稱 | 描述 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個集合檔案產生表格列
  for (const entry of sortedEntries) {
    const { collection, collectionId, name, isFeatured } = entry;
    const description = formatTableCell(
      collection.description || "無描述"
    );
    const itemCount = collection.items ? collection.items.length : 0;
    const tags = collection.tags ? collection.tags.join(", ") : "";

    const link = `../collections/${collectionId}.md`;
    const displayName = isFeatured ? `⭐ ${name}` : name;

    collectionsContent += `| [${displayName}](${link}) | ${description} | ${itemCount} 個項目 | ${tags} |\n`;
  }

  return `${TEMPLATES.collectionsSection}\n${TEMPLATES.collectionsUsage}\n\n${collectionsContent}`;
}

/**
 * 為主要 README 產生精選集合區段
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

  // 將集合檔案映射到包含用於排序的名稱的物件，並篩選出精選項目
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
          const description = formatTableCell(
            collection.description || "無描述"
          );
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

  // 如果沒有精選集合，則回傳空字串
  if (featuredCollections.length === 0) {
    return "";
  }

  // 建立表格標頭
  let featuredContent =
    "| 名稱 | 描述 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個精選集合產生表格列
  for (const entry of featuredCollections) {
    const { collectionId, name, description, tags, itemCount } = entry;
    const readmeLink = `collections/${collectionId}.md`;

    featuredContent += `| [${name}](${readmeLink}) | ${description} | ${itemCount} 個項目 | ${tags} |\n`;
  }

  return `${TEMPLATES.featuredCollectionsSection}\n\n${featuredContent}`;
}

/**
 * 產生單個集合的 README 檔案
 * @param {Object} collection - 集合物件
 * @param {string} collectionId - 集合 ID
 * @param {{ name: string, displayName: string }[]} registryNames - 預載入的 MCP 註冊名稱
 */
function generateCollectionReadme(
  collection,
  collectionId,
  registryNames = []
) {
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

  // 檢查集合是否包含任何代理程式以確定表格結構 (未來：聊天模式可能會遷移)
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
    const description = extractDescription(filePath) || "無描述";

    const typeDisplay =
      item.kind === "instruction"
        ? "指示"
        : item.kind === "agent"
        ? "代理程式"
        : item.kind === "skill"
        ? "技能"
        : "提示";
    const link = `../${item.path}`;

    // 為每個項目建立安裝徽章 (技能不使用聊天安裝徽章)
    const badgeType =
      item.kind === "instruction"
        ? "instructions"
        : item.kind === "agent"
        ? "agent"
        : item.kind === "skill"
        ? null
        : "prompt";
    const badges = badgeType ? makeBadges(item.path, badgeType) : "";

    const usageDescription = item.usage
      ? `${description} [查看用法](#${title
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
      registryNames,
    });
    // 為每個集合產生用法區段
    if (item.usage && item.usage.trim()) {
      collectionUsageContent.push(
        `### ${title}\n\n${item.usage.trim()}\n\n---\n\n`
      );
    }
  }

  // 如果有任何項目定義了用法，則附加用法區段
  if (collectionUsageContent.length > 0) {
    content += `\n${collectionUsageHeader}${collectionUsageContent.join("")}`;
  } else if (collection.display?.show_badge) {
    content += "\n---\n";
  }

  // 如果集合的 display.show_badge 為 true，則在結尾處提供選用徽章備註
  if (collection.display?.show_badge) {
    content += `*此集合包含 **${name}** 的 ${items.length} 個精選項目。*`;
  }

  return content;
}

/**
 * 為集合項目建構單個 Markdown 表格列。
 * 處理代理程式存在時的選用 MCP 伺服器欄位。
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
  const titleCell = badges
    ? `[${title}](${link})<br />${badges}`
    : `[${title}](${link})`;

  // 確保描述適用於表格
  const safeUsage = formatTableCell(usageDescription);

  if (hasAgents) {
    // 目前只有代理程式有 MCP 伺服器；
    const mcpServers =
      kind === "agent" ? extractMcpServerConfigs(filePath) : [];
    const mcpServerCell =
      mcpServers.length > 0
        ? generateMcpServerLinks(mcpServers, registryNames)
        : "";
    return `| ${titleCell} | ${typeDisplay} | ${safeUsage} | ${mcpServerCell} |\n`;
  }
  return `| ${titleCell} | ${typeDisplay} | ${safeUsage} |\n`;
}

// 公用程式：只有在內容變更時才寫入檔案
function writeFileIfChanged(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const original = fs.readFileSync(filePath, "utf8");
    if (original === content) {
      console.log(
        `${path.basename(filePath)} 已是最新狀態。無需變更。`
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
function buildCategoryReadme(
  sectionBuilder,
  dirPath,
  headerLine,
  usageLine,
  registryNames = []
) {
  const section = sectionBuilder(dirPath, registryNames);
  if (section && section.trim()) {
    // 將獨立 README 檔案的第一個 Markdown 標題層級從 ## 升級為 #
    return section.replace(/^##\s/m, "# ");
  }
  // 如果找不到項目，則回退內容
  return `${headerLine}\n\n${usageLine}\n\n_目前沒有找到任何項目。_`;
}

// 主執行封裝在非同步函式中
async function main() {
  try {
    console.log("正在產生類別 README 檔案...");

    // 在開頭載入一次 MCP 註冊名稱
    const registryNames = await loadMcpRegistryNames();

    // 透過將區段標題轉換為 H1 來撰寫獨立檔案的標頭
    const instructionsHeader = TEMPLATES.instructionsSection.replace(
      /^##\s/m,
      "# "
    );
    const promptsHeader = TEMPLATES.promptsSection.replace(/^##\s/m, "# ");
    const agentsHeader = TEMPLATES.agentsSection.replace(/^##\s/m, "# ");
    const skillsHeader = TEMPLATES.skillsSection.replace(/^##\s/m, "# ");
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
    // 產生代理程式 README
    const agentsReadme = buildCategoryReadme(
      generateAgentsSection,
      AGENTS_DIR,
      agentsHeader,
      TEMPLATES.agentsUsage,
      registryNames
    );

    // 產生技能 README
    const skillsReadme = buildCategoryReadme(
      generateSkillsSection,
      SKILLS_DIR,
      skillsHeader,
      TEMPLATES.skillsUsage,
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

    // 確保 DOCS 目錄存在以用於類別輸出
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }

    // 將類別輸出寫入 DOCS 資料夾
    writeFileIfChanged(
      path.join(DOCS_DIR, "README.instructions.md"),
      instructionsReadme
    );
    writeFileIfChanged(path.join(DOCS_DIR, "README.prompts.md"), promptsReadme);
    writeFileIfChanged(path.join(DOCS_DIR, "README.agents.md"), agentsReadme);
    writeFileIfChanged(path.join(DOCS_DIR, "README.skills.md"), skillsReadme);
    writeFileIfChanged(
      path.join(DOCS_DIR, "README.collections.md"),
      collectionsReadme
    );

    // 產生單個集合的 README 檔案
    if (fs.existsSync(COLLECTIONS_DIR)) {
      console.log("正在產生單個集合的 README 檔案...");

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

        // 定義標記以識別插入精選集合的位置
        const startMarker = "## 🌟 精選集合";
        const endMarker = "## MCP 伺服器";

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
          // 區段不存在，在 "## MCP 伺服器" 之前插入它
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
        console.warn(
          "找不到 README.md，跳過精選集合更新"
        );
      }
    } else {
      console.log("沒有找到要新增到 README.md 的精選集合");
    }
  } catch (error) {
    console.error(`產生類別 README 檔案時發生錯誤: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行主函式
main().catch((error) => {
  console.error(`嚴重錯誤: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
