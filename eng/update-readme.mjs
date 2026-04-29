#!/usr/bin/env node

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {
  AGENTS_DIR,
  AKA_INSTALL_URLS,
  DOCS_DIR,
  HOOKS_DIR,
  INSTRUCTIONS_DIR,
  PLUGINS_DIR,
  repoBaseUrl,
  ROOT_FOLDER,
  SKILLS_DIR,
  TEMPLATES,
  vscodeInsidersInstallImage,
  vscodeInstallImage,
  WORKFLOWS_DIR,
} from "./constants.mjs";
import {
  extractMcpServerConfigs,
  parseFrontmatter,
  parseHookMetadata,
  parseSkillMetadata,
  parseWorkflowMetadata,
} from "./yaml-parser.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 從 API 獲取的 MCP 註冊表伺服器名稱 (已轉為小寫) 快取
let MCP_REGISTRY_SET = null;

/**
 * 從 GitHub MCP 註冊表 API 載入並快取 MCP 註冊表伺服器名稱集。
 *
 * 行為：
 * - 若已有快取 (MCP_REGISTRY_SET)，則立即回傳。
 * - 使用游標型分頁從 https://api.mcp.github.com/v0.1/servers/ 獲取所有頁面。
 * - 透過回傳空陣列安全地處理網路錯誤或格式錯誤的 JSON。
 * - 從 data[].server.name 提取伺服器名稱。
 * - 將名稱標準化為小寫以進行不分大小寫的比對。
 * - 每次 README 構建執行期間僅呼叫 API 一次 (快取供後續呼叫使用)。
 *
 * 副作用：
 * - 修改模組範圍變數 MCP_REGISTRY_SET。
 * - 若獲取或解析註冊表失敗，則在主控台記錄警告。
 *
 * @returns {Promise<{ name: string, displayName: string }[]>} 包含名稱與小寫顯示名稱的伺服器條目陣列。若 API 無法連線或回傳錯誤資料，則可能為空。
 *
 * @throws {none} 所有錯誤皆在內部捕捉；失敗將導致回傳空陣列。
 */
async function loadMcpRegistryNames() {
  if (MCP_REGISTRY_SET) return MCP_REGISTRY_SET;

  try {
    console.log("正在從 API 獲取 MCP 註冊表...");
    const allServers = [];
    let cursor = null;
    const apiUrl = "https://api.mcp.github.com/v0.1/servers/";

    // 使用游標型分頁獲取所有頁面
    do {
      const url = cursor
        ? `${apiUrl}?cursor=${encodeURIComponent(cursor)}`
        : apiUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API 回傳狀態碼 ${response.status}`);
      }

      const json = await response.json();
      const servers = json?.servers || [];

      // 從回應中提取伺服器名稱與顯示名稱
      for (const entry of servers) {
        const serverName = entry?.server?.name;
        if (serverName) {
          // 嘗試從 GitHub Metadata 獲取 displayName，若無則使用伺服器名稱
          const displayName =
            entry?.server?._meta?.[
              "io.modelcontextprotocol.registry/publisher-provided"
            ]?.github?.displayName || serverName;

          allServers.push({
            name: serverName,
            displayName: displayName.toLowerCase(),
            // 同時儲存原始完整名稱以供比對
            fullName: serverName.toLowerCase(),
          });
        }
      }

      // 取得分頁的下一個游標
      cursor = json?.metadata?.nextCursor || null;
    } while (cursor);

    console.log(`已從 MCP 註冊表載入 ${allServers.length} 個伺服器`);
    MCP_REGISTRY_SET = allServers;
  } catch (e) {
    console.warn(`從 API 載入 MCP 註冊表失敗：${e.message}`);
    MCP_REGISTRY_SET = [];
  }

  return MCP_REGISTRY_SET;
}

// Add error handling utility
/**
 * 安全的檔案操作包裝函式
 */
function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`處理檔案 ${filePath} 時發生錯誤：${error.message}`);
    return defaultValue;
  }
}

/**
 * 提取標題
 */
function extractTitle(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      // 步驟 1：嘗試使用 vfile-matter 從 Front Matter 獲取標題
      const frontmatter = parseFrontmatter(filePath);

      if (frontmatter) {
        // 檢查 name 欄位
        if (frontmatter.name && typeof frontmatter.name === "string") {
          return frontmatter.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }

      // 步驟 2：針對提示/代理程式/指引檔案，尋找 Front Matter 之後的標題
      if (
        filePath.includes(".prompt.md") ||
        filePath.includes(".agent.md") ||
        filePath.includes(".instructions.md")
      ) {
        // 尋找 Front Matter 結束後的第一個標題
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

          // 僅在 Front Matter 結束後尋找標題
          if (frontmatterEnded || !inFrontmatter) {
            // 追蹤程式碼區塊，忽略其中的標題
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

        // 步驟 3：若未找到標題，則為提示/對話模式/指引檔案格式化檔名
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

      // 步驟 4：針對其他檔案，尋找第一個標題 (排除程式碼區塊)
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

      // 步驟 5：備用方案：使用檔名
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

/**
 * 提取說明
 */
function extractDescription(filePath) {
  return safeFileOperation(
    () => {
      // 使用 vfile-matter 解析所有檔案類型的 Front Matter
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
 * 格式化任意多行文字，使其能在 Markdown 表格儲存格中安全呈現。
 * - 將換行符號轉換為 <br /> 以保留分行
 * - 轉義管線符號 (|) 以避免破壞表格欄位
 * - 去除每行開頭/結尾的空白
 * - 摺疊連續的多個空白行
 * 此功能應套用於表格中所有檔案類型的說明描述。
 *
 * @param {string|null|undefined} text
 * @returns {string} 表格安全內容
 */
function formatTableCell(text) {
  if (text === null || text === undefined) return "";
  let s = String(text);
  // 標準化換行符號
  s = s.replace(/\r\n/g, "\n");
  // 分行、修剪，並移除多餘的空行
  const lines = s
    .split("\n")
    .map((l) => l.trim())
    .filter((_, idx, arr) => {
      // 保留單個空行，移除連續空行
      if (arr[idx] !== "") return true;
      return arr[idx - 1] !== ""; // 允許一個空行，移除重複項
    });
  s = lines.join("\n");
  // 轉義表格管線符號
  s = s.replace(/\|/g, "&#124;");
  // 將剩餘的換行符號轉換為 <br /> 以便在單個儲存格中呈現
  s = s.replace(/\n/g, "<br />");
  return s.trim();
}

/**
 * 建立勳章
 */
function makeBadges(link, type) {
  const aka = AKA_INSTALL_URLS[type] || AKA_INSTALL_URLS.instructions;

  const vscodeUrl = `${aka}?url=${encodeURIComponent(
    `vscode:chat-${type}/install?url=${repoBaseUrl}/${link}`
  )}`;
  const insidersUrl = `${aka}?url=${encodeURIComponent(
    `vscode-insiders:chat-${type}/install?url=${repoBaseUrl}/${link}`
  )}`;

  return `[![在 VS Code 安裝](${vscodeInstallImage})](${vscodeUrl})<br />[![在 VS Code Insiders 安裝](${vscodeInsidersInstallImage})](${insidersUrl})`;
}

/**
 * 產生包含所有指引表格的指引區段
 */
function generateInstructionsSection(instructionsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(instructionsDir)) {
    return "";
  }

  // 取得所有指引檔案
  const instructionFiles = fs
    .readdirSync(instructionsDir)
    .filter((file) => file.endsWith(".instructions.md"));

  // 將指引檔案對應為包含標題的物件以便排序
  const instructionEntries = instructionFiles.map((file) => {
    const filePath = path.join(instructionsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 按標題字母順序排序
  instructionEntries.sort((a, b) => a.title.localeCompare(b.title));

  console.log(`找到 ${instructionEntries.length} 個指引檔案`);

  // 若未找到檔案則回傳空字串
  if (instructionEntries.length === 0) {
    return "";
  }

  // 建立表格標題
  let instructionsContent =
    "| 標題 | 說明 |\n| ----- | ----------- |\n";

  // 為每個指引檔案產生表格行
  for (const entry of instructionEntries) {
    const { file, filePath, title } = entry;
    const link = encodeURI(`instructions/${file}`);

    // 檢查 Front Matter 中是否有說明描述
    const customDescription = extractDescription(filePath);

    // 建立安裝連結的勳章
    const badges = makeBadges(link, "instructions");

    if (customDescription && customDescription !== "null") {
      // 使用 Front Matter 中的說明描述，確保表格安全
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${formatTableCell(
        customDescription
      )} |\n`;
    } else {
      // 備用方案 - 使用標題最後一個單字作為說明，若有結尾 's' 則移除
      const topic = title.split(" ").pop().replace(/s$/, "");
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${topic} 特定的編碼標準與最佳實作 |\n`;
    }
  }

  return `${TEMPLATES.instructionsSection}\n${TEMPLATES.instructionsUsage}\n\n${instructionsContent}`;
}

/**
 * 為代理程式產生 MCP 伺服器連結
 * @param {string[]} servers - MCP 伺服器名稱陣列
 * @param {{ name: string, displayName: string }[]} registryNames - 預先載入的註冊表名稱，避免非同步呼叫
 * @returns {string} - 格式化後帶有勳章的 MCP 伺服器連結
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
      // 支援字串名稱或帶有設定的物件
      const serverObj = typeof entry === "string" ? { name: entry } : entry;
      const serverName = String(serverObj.name).trim();

      // 構建純設定 JSON (stdio 無須名稱/類型；僅 command+args+env)
      let configPayload = {};
      if (serverObj.type && serverObj.type.toLowerCase() === "http") {
        // HTTP: url + headers
        configPayload = {
          url: serverObj.url || "",
          headers: serverObj.headers || {},
        };
      } else {
        // 本地/stdio: command + args + env
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

      // 同時對顯示名稱與完整名稱進行比對 (不分大小寫)
      const serverNameLower = serverName.toLowerCase();
      const registryEntry = registryNames.find((entry) => {
        // 完全符合顯示名稱或完整名稱
        if (
          entry.displayName === serverNameLower ||
          entry.fullName === serverNameLower
        ) {
          return true;
        }

        // 檢查 serverName 是否符合斜線後的完整名稱部分
        // 例如："apify" 符合 "com.apify/apify-mcp-server"
        const nameParts = entry.fullName.split("/");
        if (nameParts.length > 1 && nameParts[1]) {
          // 檢查是否符合第二部分 (斜線後的部分)
          const secondPart = nameParts[1]
            .replace("-mcp-server", "")
            .replace("-mcp", "");
          if (secondPart === serverNameLower) {
            return true;
          }
        }

        // 檢查 serverName 是否符合不分大小寫的顯示名稱
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
 * 產生包含所有代理程式表格的代理程式區段
 * @param {string} agentsDir - 目錄路徑
 * @param {{ name: string, displayName: string }[]} registryNames - 預先載入的 MCP 註冊表名稱
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
 * 產生包含所有勾點表格的勾點區段
 */
function generateHooksSection(hooksDir) {
  if (!fs.existsSync(hooksDir)) {
    console.log(`勾點目錄不存在：${hooksDir}`);
    return "";
  }

  // 取得所有勾點資料夾 (目錄)
  const hookFolders = fs.readdirSync(hooksDir).filter((file) => {
    const filePath = path.join(hooksDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  // 解析每個勾點資料夾
  const hookEntries = hookFolders
    .map((folder) => {
      const hookPath = path.join(hooksDir, folder);
      const metadata = parseHookMetadata(hookPath);
      if (!metadata) return null;

      return {
        folder,
        name: metadata.name,
        description: metadata.description,
        hooks: metadata.hooks,
        tags: metadata.tags,
        assets: metadata.assets,
      };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`找到 ${hookEntries.length} 個勾點`);

  if (hookEntries.length === 0) {
    return "";
  }

  // 建立表格標題
  let content =
    "| 名稱 | 說明 | 事件 | 隨附資產 |\n| ---- | ----------- | ------ | -------------- |\n";

  // 為每個勾點產生表格行
  for (const hook of hookEntries) {
    const link = `../hooks/${hook.folder}/README.md`;
    const events = hook.hooks.length > 0 ? hook.hooks.join(", ") : "不適用";
    const assetsList =
      hook.assets.length > 0
        ? hook.assets.map((a) => `\`${a}\``).join("<br />")
        : "無";

    content += `| [${hook.name}](${link}) | ${formatTableCell(
      hook.description
    )} | ${events} | ${assetsList} |\n`;
  }

  return `${TEMPLATES.hooksSection}\n${TEMPLATES.hooksUsage}\n\n${content}`;
}

/**
 * 產生包含所有代理型工作流程表格的工作流程區段
 */
function generateWorkflowsSection(workflowsDir) {
  if (!fs.existsSync(workflowsDir)) {
    console.log(`工作流程目錄不存在：${workflowsDir}`);
    return "";
  }

  // 取得所有 .md 工作流程檔案 (扁平結構，無子資料夾)
  const workflowFiles = fs.readdirSync(workflowsDir).filter((file) => {
    return file.endsWith(".md") && file !== ".gitkeep";
  });

  // 解析每個工作流程檔案
  const workflowEntries = workflowFiles
    .map((file) => {
      const filePath = path.join(workflowsDir, file);
      const metadata = parseWorkflowMetadata(filePath);
      if (!metadata) return null;

      return {
        file,
        name: metadata.name,
        description: metadata.description,
        triggers: metadata.triggers,
        tags: metadata.tags,
      };
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`找到 ${workflowEntries.length} 個工作流程`);

  if (workflowEntries.length === 0) {
    return "";
  }

  // 建立表格標題
  let content =
    "| 名稱 | 說明 | 觸發條件 |\n| ---- | ----------- | -------- |\n";

  // 為每個工作流程產生表格行
  for (const workflow of workflowEntries) {
    const link = `../workflows/${workflow.file}`;
    const triggers =
      workflow.triggers.length > 0 ? workflow.triggers.join(", ") : "不適用";

    content += `| [${workflow.name}](${link}) | ${formatTableCell(
      workflow.description
    )} | ${triggers} |\n`;
  }

  return `${TEMPLATES.workflowsSection}\n${TEMPLATES.workflowsUsage}\n\n${content}`;
}

/**
 * 產生包含所有技能表格的技能區段
 */
function generateSkillsSection(skillsDir) {
  if (!fs.existsSync(skillsDir)) {
    console.log(`技能目錄不存在：${skillsDir}`);
    return "";
  }

  // 取得所有技能資料夾 (目錄)
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

  // 建立表格標題
  let content =
    "| 名稱 | 說明 | 隨附資產 |\n| ---- | ----------- | -------------- |\n";

  // 為每個技能產生表格行
  for (const skill of skillEntries) {
    const link = `../skills/${skill.folder}/SKILL.md`;
    const assetsList =
      skill.assets.length > 0
        ? skill.assets.map((a) => `\`${a}\``).join("<br />")
        : "無";

    content += `| [${
      skill.name
    }](${link})<br />\`gh skills install github/awesome-copilot ${
      skill.folder
    }\` | ${formatTableCell(skill.description)} | ${assetsList} |\n`;
  }

  return `${TEMPLATES.skillsSection}\n${TEMPLATES.skillsUsage}\n\n${content}`;
}

/**
 * 代理程式的整合產生器 (未來合併使用)
 * @param {Object} cfg
 * @param {string} cfg.dir - 目錄路徑
 * @param {string} cfg.extension - 要比對的副檔名 (例如 .agent.md)
 * @param {string} cfg.linkPrefix - 連結前綴資料夾名稱
 * @param {string} cfg.badgeType - 勳章鍵值 (mode, agent)
 * @param {boolean} cfg.includeMcpServers - 是否包含 MCP 伺服器欄位
 * @param {string} cfg.sectionTemplate - 區段標題範本
 * @param {string} cfg.usageTemplate - 用法子標題範本
 * @param {{ name: string, displayName: string }[]} cfg.registryNames - 預先載入的 MCP 註冊表名稱
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
    console.log(`整合模式區段缺少目錄：${dir}`);
    return "";
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(extension));

  const entries = files.map((file) => {
    const filePath = path.join(dir, file);
    return { file, filePath, title: extractTitle(filePath) };
  });

  entries.sort((a, b) => a.title.localeCompare(b.title));
  console.log(
    `整合模式產生器：副檔名為 ${extension} 的檔案共有 ${entries.length} 個`
  );
  if (entries.length === 0) return "";

  let header = "| 標題 | 說明 |";
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
 * 從外掛程式目錄讀取並解析 plugin.json 檔案。
 */
function readPluginJson(pluginDir) {
  const jsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * 產生包含所有外掛程式表格的外掛程式區段
 */
function generatePluginsSection(pluginsDir) {
  // 檢查外掛程式目錄是否存在，若不存在則建立
  if (!fs.existsSync(pluginsDir)) {
    console.log("外掛程式目錄不存在，正在建立...");
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  // 取得所有外掛程式目錄
  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // 將外掛程式目錄對應為包含名稱的物件以便排序
  const pluginEntries = pluginDirs
    .map((dir) => {
      const pluginDir = path.join(pluginsDir, dir);
      const plugin = readPluginJson(pluginDir);

      if (!plugin) {
        console.warn(`解析外掛程式失敗：${dir}`);
        return null;
      }

      const pluginId = plugin.name || dir;
      const name = plugin.name || dir;
      const isFeatured = plugin.featured === true;
      return { dir, pluginDir, plugin, pluginId, name, isFeatured };
    })
    .filter((entry) => entry !== null);

  // 區分精選外掛程式與一般外掛程式
  const featuredPlugins = pluginEntries.filter((entry) => entry.isFeatured);
  const regularPlugins = pluginEntries.filter((entry) => !entry.isFeatured);

  // 每一組分別按名稱字母順序排序
  featuredPlugins.sort((a, b) => a.name.localeCompare(b.name));
  regularPlugins.sort((a, b) => a.name.localeCompare(b.name));

  // 合併：精選優先，隨後為一般外掛
  const sortedEntries = [...featuredPlugins, ...regularPlugins];

  console.log(
    `找到 ${pluginEntries.length} 個外掛程式 (${featuredPlugins.length} 個為精選)`
  );

  // 若無外掛程式則回傳空字串
  if (sortedEntries.length === 0) {
    return "";
  }

  // 建立表格標題
  let pluginsContent =
    "| 名稱 | 說明 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個外掛程式產生表格行
  for (const entry of sortedEntries) {
    const { plugin, dir, name, isFeatured } = entry;
    const description = formatTableCell(plugin.description || "No description");
    const itemCount =
      (plugin.agents || []).length +
      (plugin.commands || []).length +
      (plugin.skills || []).length;
    const keywords = plugin.keywords ? plugin.keywords.join(", ") : "";

    const link = `../plugins/${dir}/README.md`;
    const displayName = isFeatured ? `⭐ ${name}` : name;

    pluginsContent += `| [${displayName}](${link}) | ${description} | ${itemCount} items | ${keywords} |\n`;
  }

  return `${TEMPLATES.pluginsSection}\n${TEMPLATES.pluginsUsage}\n\n${pluginsContent}`;
}

/**
 * 為主 README 產生精選外掛程式區段
 */
function generateFeaturedPluginsSection(pluginsDir) {
  // 檢查外掛程式目錄是否存在
  if (!fs.existsSync(pluginsDir)) {
    return "";
  }

  // 取得所有外掛程式目錄
  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // 將外掛程式目錄對應為物件，並篩選出精選外掛
  const featuredPlugins = pluginDirs
    .map((dir) => {
      const pluginDir = path.join(pluginsDir, dir);
      return safeFileOperation(
        () => {
          const plugin = readPluginJson(pluginDir);
          if (!plugin) return null;

          // 僅包含 featured: true 的外掛程式
          if (!plugin.featured) return null;

          const name = plugin.name || dir;
          const description = formatTableCell(
            plugin.description || "暫無說明"
          );
          const keywords = plugin.keywords ? plugin.keywords.join(", ") : "";
          const itemCount =
            (plugin.agents || []).length +
            (plugin.commands || []).length +
            (plugin.skills || []).length;

          return {
            dir,
            plugin,
            pluginId: name,
            name,
            description,
            keywords,
            itemCount,
          };
        },
        pluginDir,
        null
      );
    })
    .filter((entry) => entry !== null);

  // 按名稱字母順序排序
  featuredPlugins.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`找到 ${featuredPlugins.length} 個精選外掛程式`);

  // 若無精選外掛程式則回傳空字串
  if (featuredPlugins.length === 0) {
    return "";
  }

  // 建立表格標題
  let featuredContent =
    "| 名稱 | 說明 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個精選外掛程式產生表格行
  for (const entry of featuredPlugins) {
    const { dir, name, description, keywords, itemCount } = entry;
    const readmeLink = `plugins/${dir}/README.md`;

    featuredContent += `| [${name}](${readmeLink}) | ${description} | ${itemCount} 個項目 | ${keywords} |\n`;
  }

  return `${TEMPLATES.featuredPluginsSection}\n\n${featuredContent}`;
}

/**
 * 實用工具：僅在內容變更時才寫入檔案
 */
function writeFileIfChanged(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const original = fs.readFileSync(filePath, "utf8");
    if (original === content) {
      console.log(
        `${path.basename(filePath)} 已是最新的。無須變更。`
      );
      return;
    }
  }
  fs.writeFileSync(filePath, content);
  console.log(
    `${path.basename(filePath)} ${exists ? "已更新" : "已建立"} 成功！`
  );
}

/**
 * 使用現有的產生器構建各類別的 README 內容，並將標題升級為 H1
 */
function buildCategoryReadme(
  sectionBuilder,
  dirPath,
  headerLine,
  usageLine,
  registryNames = []
) {
  const section = sectionBuilder(dirPath, registryNames);
  if (section && section.trim()) {
    // 將獨立 README 檔案中的第一個 Markdown 標題層級從 ## 升級為 #
    return section.replace(/^##\s/m, "# ");
  }
  // 若未找到任何條目時的備用內容
  return `${headerLine}\n\n${usageLine}\n\n_No entries found yet._`;
}

/**
 * 執行邏輯封裝於非同步函式中
 */
async function main() {
  try {
    console.log("正在產生類別 README 檔案...");

    // 在開始時僅載入一次 MCP 註冊表名稱
    const registryNames = await loadMcpRegistryNames();

    // 透過將區段標題轉換為 H1，為獨立檔案組合標題
    const instructionsHeader = TEMPLATES.instructionsSection.replace(
      /^##\s/m,
      "# "
    );
    const agentsHeader = TEMPLATES.agentsSection.replace(/^##\s/m, "# ");
    const hooksHeader = TEMPLATES.hooksSection.replace(/^##\s/m, "# ");
    const workflowsHeader = TEMPLATES.workflowsSection.replace(/^##\s/m, "# ");
    const skillsHeader = TEMPLATES.skillsSection.replace(/^##\s/m, "# ");
    const pluginsHeader = TEMPLATES.pluginsSection.replace(/^##\s/m, "# ");

    const instructionsReadme = buildCategoryReadme(
      generateInstructionsSection,
      INSTRUCTIONS_DIR,
      instructionsHeader,
      TEMPLATES.instructionsUsage,
      registryNames
    );
    // 產生代理程式 (Agents) README
    const agentsReadme = buildCategoryReadme(
      generateAgentsSection,
      AGENTS_DIR,
      agentsHeader,
      TEMPLATES.agentsUsage,
      registryNames
    );

    // 產生勾點 (Hooks) README
    const hooksReadme = buildCategoryReadme(
      generateHooksSection,
      HOOKS_DIR,
      hooksHeader,
      TEMPLATES.hooksUsage,
      registryNames
    );

    // 產生工作流程 (Workflows) README
    const workflowsReadme = buildCategoryReadme(
      generateWorkflowsSection,
      WORKFLOWS_DIR,
      workflowsHeader,
      TEMPLATES.workflowsUsage,
      registryNames
    );

    // 產生技能 (Skills) README
    const skillsReadme = buildCategoryReadme(
      generateSkillsSection,
      SKILLS_DIR,
      skillsHeader,
      TEMPLATES.skillsUsage,
      registryNames
    );

    // 產生外掛程式 (Plugins) README
    const pluginsReadme = buildCategoryReadme(
      generatePluginsSection,
      PLUGINS_DIR,
      pluginsHeader,
      TEMPLATES.pluginsUsage,
      registryNames
    );

    // 確保 docs 目錄存在，以便輸出各類別檔案
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }

    // 將各類別輸出內容寫入 docs 資料夾
    writeFileIfChanged(
      path.join(DOCS_DIR, "README.instructions.md"),
      instructionsReadme
    );
    writeFileIfChanged(path.join(DOCS_DIR, "README.agents.md"), agentsReadme);
    writeFileIfChanged(path.join(DOCS_DIR, "README.hooks.md"), hooksReadme);
    writeFileIfChanged(
      path.join(DOCS_DIR, "README.workflows.md"),
      workflowsReadme
    );
    writeFileIfChanged(path.join(DOCS_DIR, "README.skills.md"), skillsReadme);
    writeFileIfChanged(path.join(DOCS_DIR, "README.plugins.md"), pluginsReadme);

    // 外掛程式 README 是具有權威性的 (已存在於每個外掛程式資料夾中)

    // 產生精選外掛程式區段並更新主 README.md
    console.log("正在使用精選外掛程式更新主 README.md...");
    const featuredSection = generateFeaturedPluginsSection(PLUGINS_DIR);

    if (featuredSection) {
      const mainReadmePath = path.join(ROOT_FOLDER, "README.md");

      if (fs.existsSync(mainReadmePath)) {
        let readmeContent = fs.readFileSync(mainReadmePath, "utf8");

        // 定義標記以識別要插入精選外掛程式的位置
        const startMarker = "## 🌟 Featured Plugins";
        const endMarker = "## MCP Server";

        // 檢查該區段是否已存在
        const startIndex = readmeContent.indexOf(startMarker);

        if (startIndex !== -1) {
          // 區段已存在，進行取代
          const endIndex = readmeContent.indexOf(endMarker, startIndex);
          if (endIndex !== -1) {
            // 取代現有區段
            const beforeSection = readmeContent.substring(0, startIndex);
            const afterSection = readmeContent.substring(endIndex);
            readmeContent =
              beforeSection + featuredSection + "\n\n" + afterSection;
          }
        } else {
          // 區段不存在，插入到 "## MCP Server" 之前
          const mcpIndex = readmeContent.indexOf(endMarker);
          if (mcpIndex !== -1) {
            const beforeMcp = readmeContent.substring(0, mcpIndex);
            const afterMcp = readmeContent.substring(mcpIndex);
            readmeContent = beforeMcp + featuredSection + "\n\n" + afterMcp;
          }
        }

        writeFileIfChanged(mainReadmePath, readmeContent);
        console.log("主 README.md 已更新精選外掛程式");
      } else {
        console.warn(
          "找不到 README.md，跳過精選外掛程式更新"
        );
      }
    } else {
      console.log("未找到可加入 README.md 的精選外掛程式");
    }
  } catch (error) {
    console.error(`產生類別 README 檔案時發生錯誤：${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行主函式
main().catch((error) => {
  console.error(`致命錯誤：${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
