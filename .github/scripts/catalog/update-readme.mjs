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
  publishedArtifactBaseUrl,
  ROOT_FOLDER,
  SKILLS_DIR,
  sourceContentBaseUrl,
  TEMPLATES,
  vscodeInsidersInstallImage,
  vscodeInstallImage,
  WORKFLOWS_DIR,
} from "../lib/constants.mjs";
import {
  parseFrontmatter,
  parseHookMetadata,
  parseSkillMetadata,
  parseWorkflowMetadata,
} from "../lib/yaml-parser.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXTENSIONS_DIR = path.join(ROOT_FOLDER, "extensions");

// 新增錯誤處理工具
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
        // 檢查 name 欄位
        if (frontmatter.name && typeof frontmatter.name === "string") {
          return frontmatter.name
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }

      // 步驟 2：針對 prompt/agent/instructions 檔案，在 frontmatter 之後尋找標題
      if (
        filePath.includes(".prompt.md") ||
        filePath.includes(".agent.md") ||
        filePath.includes(".instructions.md")
      ) {
        // 尋找 frontmatter 之後的第一個標題
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

          // 只在 frontmatter 結束後才尋找標題
          if (frontmatterEnded || !inFrontmatter) {
            // 追蹤程式碼區塊，以忽略其中的標題
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

        // 步驟 3：若未找到標題，則為 prompt/chatmode/instructions 檔案格式化檔案名稱
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

      // 步驟 4：針對其他檔案，尋找第一個標題（但不含程式碼區塊內的標題）
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

      // 步驟 5：退回使用檔案名稱
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
      // 使用 vfile-matter 解析所有檔案類別的 frontmatter
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
 * 格式化任意多行文字，以便安全地渲染在 markdown 表格儲存格內。
 * - 轉換為 <br /> 以保留換行
 * - 逸出直線字元（|），以避免破壞表格欄
 * - 修剪每行首尾的空白
 * - 合併連續的多個空白行
 * 當描述用於表格中時，應對所有檔案類別套用此函式。
 *
 * @param {string|null|undefined} text
 * @returns {string} 對表格安全的內容
 */
function formatTableCell(text) {
  if (text === null || text === undefined) return "";
  let s = String(text);
  // 正規化換行結尾
  s = s.replace(/\r\n/g, "\n");
  // 分割各行、修剪空白、移除空白群組，同時保留有意的換行
  const lines = s
    .split("\n")
    .map((l) => l.trim())
    .filter((_, idx, arr) => {
      // 保留單一空白行，移除連續的空白行
      if (arr[idx] !== "") return true;
      return arr[idx - 1] !== ""; // 允許一個空白行，移除重複
    });
  s = lines.join("\n");
  // 逸出表格中的直線
  s = s.replace(/\|/g, "&#124;");
  // 將剩餘的換行轉換為 <br />，以單一儲存格方式呈現
  s = s.replace(/\n/g, "<br />");
  return s.trim();
}

function makeBadges(link, type, linkIntent = "source") {
  const aka = AKA_INSTALL_URLS[type] || AKA_INSTALL_URLS.instructions;
  const rawBaseUrl =
    linkIntent === "published" ? publishedArtifactBaseUrl : sourceContentBaseUrl;

  const vscodeUrl = `${aka}?url=${encodeURIComponent(
    `vscode:chat-${type}/install?url=${rawBaseUrl}/${link}`
  )}`;
  const insidersUrl = `${aka}?url=${encodeURIComponent(
    `vscode-insiders:chat-${type}/install?url=${rawBaseUrl}/${link}`
  )}`;

  return `[![在 VS Code 中安裝](${vscodeInstallImage})](${vscodeUrl})<br />[![在 VS Code Insiders 中安裝](${vscodeInsidersInstallImage})](${insidersUrl})`;
}

/**
 * 產生 instructions 章節，並以表格列出所有指令
 */
function generateInstructionsSection(instructionsDir) {
  // 檢查目錄是否存在
  if (!fs.existsSync(instructionsDir)) {
    return "";
  }

  // 取得所有指令檔案
  const instructionFiles = fs
    .readdirSync(instructionsDir)
    .filter((file) => file.endsWith(".instructions.md"));

  // 將指令檔案對應為含標題的物件，以利排序
  const instructionEntries = instructionFiles.map((file) => {
    const filePath = path.join(instructionsDir, file);
    const title = extractTitle(filePath);
    return { file, filePath, title };
  });

  // 依標題字母順序排序
  instructionEntries.sort((a, b) => a.title.localeCompare(b.title, "en"));

  console.log(`找到 ${instructionEntries.length} 個指令檔案`);

  // 若未找到檔案，回傳空字串
  if (instructionEntries.length === 0) {
    return "";
  }

  // 建立表格標題列
  let instructionsContent =
    "| 標題 | 描述 |\n| ----- | ----------- |\n";

  // 為每個指令檔案產生表格列
  for (const entry of instructionEntries) {
    const { file, filePath, title } = entry;
    const link = encodeURI(`instructions/${file}`);

    // 檢查 frontmatter 中是否有描述
    const customDescription = extractDescription(filePath);

    // 為安裝連結建立徽章
    const badges = makeBadges(link, "instructions", "source");

    if (customDescription && customDescription !== "null") {
      // 使用 frontmatter 中的描述，並確保對表格安全
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${formatTableCell(
        customDescription
      )} |\n`;
    } else {
      // 退回預設方式 - 使用標題的最後一個單字作為描述，若結尾有 's' 則移除
      const topic = title.split(" ").pop().replace(/s$/, "");
      instructionsContent += `| [${title}](../${link})<br />${badges} | ${topic} 的特定程式碼標準與最佳實務 |\n`;
    }
  }

  return `${TEMPLATES.instructionsSection}\n${TEMPLATES.instructionsUsage}\n\n${instructionsContent}`;
}

/**
 * 產生 agents 章節，並以表格列出所有 agents
 * @param {string} agentsDir - 目錄路徑
 */
function generateAgentsSection(agentsDir) {
  return generateUnifiedModeSection({
    dir: agentsDir,
    extension: ".agent.md",
    linkPrefix: "agents",
    badgeType: "agent",
    sectionTemplate: TEMPLATES.agentsSection,
    usageTemplate: TEMPLATES.agentsUsage,
  });
}

/**
 * 產生 hooks 章節，並以表格列出所有 hooks
 */
function generateHooksSection(hooksDir) {
  if (!fs.existsSync(hooksDir)) {
    console.log(`Hooks 目錄不存在：${hooksDir}`);
    return "";
  }

  // 取得所有 hook 資料夾（目錄）
  const hookFolders = fs.readdirSync(hooksDir).filter((file) => {
    const filePath = path.join(hooksDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  // 解析每個 hook 資料夾
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

  console.log(`找到 ${hookEntries.length} 個 hook`);

  if (hookEntries.length === 0) {
    return "";
  }

  // 建立表格標題列
  let content =
    "| 名稱 | 描述 | 事件 | 內建資產 |\n| ---- | ----------- | ------ | -------------- |\n";

  // 為每個 hook 產生表格列
  for (const hook of hookEntries) {
    const link = `../hooks/${hook.folder}/README.md`;
    const events = hook.hooks.length > 0 ? hook.hooks.join(", ") : "N/A";
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
 * 產生 workflows 章節，並以表格列出所有 agentic workflows
 */
function generateWorkflowsSection(workflowsDir) {
  if (!fs.existsSync(workflowsDir)) {
    console.log(`Workflows 目錄不存在：${workflowsDir}`);
    return "";
  }

  // 取得所有 .md workflow 檔案（扁平結構，無子資料夾）
  const workflowFiles = fs.readdirSync(workflowsDir).filter((file) => {
    return file.endsWith(".md") && file !== ".gitkeep";
  });

  // 解析每個 workflow 檔案
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

  console.log(`找到 ${workflowEntries.length} 個 workflow`);

  if (workflowEntries.length === 0) {
    return "";
  }

  // 建立表格標題列
  let content =
    "| 名稱 | 描述 | 觸發器 |\n| ---- | ----------- | -------- |\n";

  // 為每個 workflow 產生表格列
  for (const workflow of workflowEntries) {
    const link = `../workflows/${workflow.file}`;
    const triggers =
      workflow.triggers.length > 0 ? workflow.triggers.join(", ") : "N/A";

    content += `| [${workflow.name}](${link}) | ${formatTableCell(
      workflow.description
    )} | ${triggers} |\n`;
  }

  return `${TEMPLATES.workflowsSection}\n${TEMPLATES.workflowsUsage}\n\n${content}`;
}

/**
 * 產生 skills 章節，並以表格列出所有 skills
 */
function generateSkillsSection(skillsDir) {
  if (!fs.existsSync(skillsDir)) {
    console.log(`Skills 目錄不存在：${skillsDir}`);
    return "";
  }

  // 取得所有 skill 資料夾（目錄）
  const skillFolders = fs.readdirSync(skillsDir).filter((file) => {
    const filePath = path.join(skillsDir, file);
    return fs.statSync(filePath).isDirectory();
  });

  // 解析每個 skill 資料夾
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

  console.log(`找到 ${skillEntries.length} 個 skill`);

  if (skillEntries.length === 0) {
    return "";
  }

  // 建立表格標題列
  let content =
    "| 名稱 | 描述 | 內建資產 |\n| ---- | ----------- | -------------- |\n";

  // 為每個 skill 產生表格列
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
 * 統一產生器，用於 agents（未來將整合）
 * @param {Object} cfg
 * @param {string} cfg.dir - 目錄路徑
 * @param {string} cfg.extension - 要比對的檔案副檔名（例如 .agent.md、.agent.md）
 * @param {string} cfg.linkPrefix - 連結前綴的資料夾名稱
 * @param {string} cfg.badgeType - 徽章金鑰（mode、agent）
 * @param {string} cfg.sectionTemplate - 章節標題範本
 * @param {string} cfg.usageTemplate - 用法副標題範本
 */
function generateUnifiedModeSection(cfg) {
  const {
    dir,
    extension,
    linkPrefix,
    badgeType,
    sectionTemplate,
    usageTemplate,
  } = cfg;

  if (!fs.existsSync(dir)) {
    console.log(`統一模式章節缺少目錄：${dir}`);
    return "";
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(extension));

  const entries = files.map((file) => {
    const filePath = path.join(dir, file);
    return { file, filePath, title: extractTitle(filePath) };
  });

  entries.sort((a, b) => a.title.localeCompare(b.title, "en"));
  console.log(
    `統一模式產生器：副檔名 ${extension} 共 ${entries.length} 個檔案`
  );
  if (entries.length === 0) return "";

  let content = "| Title | Description |\n| ----- | ----------- |\n";

  for (const { file, filePath, title } of entries) {
    const link = encodeURI(`${linkPrefix}/${file}`);
    const description = extractDescription(filePath);
    const badges = makeBadges(link, badgeType, "source");

    const descCell =
      description && description !== "null" ? formatTableCell(description) : "";
    content += `| [${title}](../${link})<br />${badges} | ${descCell} |\n`;
  }

  return `${sectionTemplate}\n${usageTemplate}\n\n${content}`;
}

/**
 * 從 plugin 目錄讀取並解析 plugin.json 檔案。
 */
function readPluginJson(pluginDir) {
  const jsonPath = path.join(pluginDir, "plugin.json");
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * 產生 plugins 章節，並以表格列出所有 plugins
 */
function generatePluginsSection(pluginsDir) {
  // 檢查 plugins 目錄是否存在，若不存在則建立
  if (!fs.existsSync(pluginsDir)) {
    console.log("Plugins 目錄不存在，正在建立...");
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  // 取得所有 plugin 目錄
  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // 將 plugin 目錄對應為含名稱的物件，以利排序
  const pluginEntries = pluginDirs
    .map((dir) => {
      const pluginDir = path.join(pluginsDir, dir);
      const plugin = readPluginJson(pluginDir);

      if (!plugin) {
        console.warn(`解析 plugin 失敗：${dir}`);
        return null;
      }

      const pluginId = plugin.name || dir;
      const name = plugin.name || dir;
      const isFeatured = plugin.featured === true;
      return { dir, pluginDir, plugin, pluginId, name, isFeatured };
    })
    .filter((entry) => entry !== null);

  // 將精選與一般 plugin 分開
  const featuredPlugins = pluginEntries.filter((entry) => entry.isFeatured);
  const regularPlugins = pluginEntries.filter((entry) => !entry.isFeatured);

  // 將各群組依名稱字母順序排序
  featuredPlugins.sort((a, b) => a.name.localeCompare(b.name));
  regularPlugins.sort((a, b) => a.name.localeCompare(b.name));

  // 組合：精選在前，一般在其後
  const sortedEntries = [...featuredPlugins, ...regularPlugins];

  console.log(
    `找到 ${pluginEntries.length} 個 plugin（其中 ${featuredPlugins.length} 個為精選）`
  );

  // 若沒有 plugin，回傳空字串
  if (sortedEntries.length === 0) {
    return "";
  }

  // 建立表格標題列
  let pluginsContent =
    "| 名稱 | 描述 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個 plugin 產生表格列
  for (const entry of sortedEntries) {
    const { plugin, dir, name, isFeatured } = entry;
    const description = formatTableCell(plugin.description || "無描述");
    const composition = plugin.extensions?.["com.github.awesome-copilot"] || {};
    const extensionReferences = Array.isArray(composition.extensions)
      ? composition.extensions.length
      : 0;
    const implicitExtension =
      fs.existsSync(path.join(EXTENSIONS_DIR, entry.pluginId, "extension.mjs")) &&
      !(Array.isArray(composition.extensions) && composition.extensions.some(
        (reference) => reference === `./extensions/${entry.pluginId}`
      ))
      ? 1
      : 0;
    const itemCount =
      (composition.agents || []).length +
      (composition.skills || []).length +
      extensionReferences +
      implicitExtension;
    const keywords = plugin.keywords ? plugin.keywords.join(", ") : "";

    const link = `../plugins/${dir}/README.md`;
    const displayName = isFeatured ? `⭐ ${name}` : name;

    pluginsContent += `| [${displayName}](${link}) | ${description} | ${itemCount} 個項目 | ${keywords} |\n`;
  }

  const publishedManifestUrl = `${publishedArtifactBaseUrl}/.github/plugin/marketplace.json`;
  const sourceTreeUrl =
    "https://github.com/linyute/awesome-copilot/tree/main/plugins";
  const pluginLinkGuidance = [
    "",
    `- 已發佈的市集 manifest（供工具使用）：\`${publishedManifestUrl}\``,
    `- 來源 plugin 內容（由人工撰寫）：\`${sourceTreeUrl}\``,
  ].join("\n");

  return `${TEMPLATES.pluginsSection}\n${TEMPLATES.pluginsUsage}${pluginLinkGuidance}\n\n${pluginsContent}`;
}

/**
 * 為主 README 產生精選 plugins 章節
 */
function generateFeaturedPluginsSection(pluginsDir) {
  // 檢查 plugins 目錄是否存在
  if (!fs.existsSync(pluginsDir)) {
    return "";
  }

  // 取得所有 plugin 目錄
  const pluginDirs = fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  // 將 plugin 目錄對應為物件，並篩選出精選項目
  const featuredPlugins = pluginDirs
    .map((dir) => {
      const pluginDir = path.join(pluginsDir, dir);
      return safeFileOperation(
        () => {
          const plugin = readPluginJson(pluginDir);
          if (!plugin) return null;

          // 只包含 featured: true 的 plugin
          if (!plugin.featured) return null;

          const name = plugin.name || dir;
          const description = formatTableCell(
            plugin.description || "無描述"
          );
          const keywords = plugin.keywords ? plugin.keywords.join(", ") : "";
          const composition = plugin.extensions?.["com.github.awesome-copilot"] || {};
          const extensionReferences = Array.isArray(composition.extensions)
            ? composition.extensions.length
            : 0;
          const implicitExtension =
            fs.existsSync(path.join(EXTENSIONS_DIR, name, "extension.mjs")) &&
            !(Array.isArray(composition.extensions) && composition.extensions.some(
              (reference) => reference === `./extensions/${name}`
            ))
            ? 1
            : 0;
          const itemCount =
            (composition.agents || []).length +
            (composition.skills || []).length +
            extensionReferences +
            implicitExtension;

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

  // 依名稱字母順序排序
  featuredPlugins.sort((a, b) => a.name.localeCompare(b.name));

  console.log(`找到 ${featuredPlugins.length} 個精選 plugin`);

  // 若沒有精選 plugin，回傳空字串
  if (featuredPlugins.length === 0) {
    return "";
  }

  // 建立表格標題列
  let featuredContent =
    "| 名稱 | 描述 | 項目 | 標籤 |\n| ---- | ----------- | ----- | ---- |\n";

  // 為每個精選 plugin 產生表格列
  for (const entry of featuredPlugins) {
    const { dir, name, description, keywords, itemCount } = entry;
    const readmeLink = `plugins/${dir}/README.md`;

    featuredContent += `| [${name}](${readmeLink}) | ${description} | ${itemCount} 個項目 | ${keywords} |\n`;
  }

  return `${TEMPLATES.featuredPluginsSection}\n\n${featuredContent}`;
}

// 工具函式：僅在內容變更時寫入檔案
function writeFileIfChanged(filePath, content) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const original = fs.readFileSync(filePath, "utf8");
    if (original === content) {
      console.log(
        `${path.basename(filePath)} 已是最新，無需變更。`
      );
      return;
    }
  }
  fs.writeFileSync(filePath, content);
  console.log(
    `${path.basename(filePath)} ${exists ? "已更新" : "已建立"}成功！`
  );
}

// 使用現有產生器建立各分類 README 內容，並將標題升級為 H1
function buildCategoryReadme(
  sectionBuilder,
  dirPath,
  headerLine,
  usageLine
) {
  const section = sectionBuilder(dirPath);
  if (section && section.trim()) {
    // 針對獨立的 README 檔案，將第一個 markdown 標題層級從 ## 升級為 #
    return section.replace(/^##\s/m, "# ");
  }
  // 找不到任何項目時的退回內容
  return `${headerLine}\n\n${usageLine}\n\n_尚未找到任何項目。_`;
}

// 將主要執行包裝在 async 函式中
async function main() {
  try {
    console.log("正在產生各分類的 README 檔案...");

    // 將章節標題轉換為 H1，以建立獨立檔案的標頭
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
      TEMPLATES.instructionsUsage
    );
    // 產生 agents README
    const agentsReadme = buildCategoryReadme(
      generateAgentsSection,
      AGENTS_DIR,
      agentsHeader,
      TEMPLATES.agentsUsage
    );

    // 產生 hooks README
    const hooksReadme = buildCategoryReadme(
      generateHooksSection,
      HOOKS_DIR,
      hooksHeader,
      TEMPLATES.hooksUsage
    );

    // 產生 workflows README
    const workflowsReadme = buildCategoryReadme(
      generateWorkflowsSection,
      WORKFLOWS_DIR,
      workflowsHeader,
      TEMPLATES.workflowsUsage
    );

    // 產生 skills README
    const skillsReadme = buildCategoryReadme(
      generateSkillsSection,
      SKILLS_DIR,
      skillsHeader,
      TEMPLATES.skillsUsage
    );

    // 產生 plugins README
    const pluginsReadme = buildCategoryReadme(
      generatePluginsSection,
      PLUGINS_DIR,
      pluginsHeader,
      TEMPLATES.pluginsUsage
    );

    // 確保 docs 目錄存在，以用於分類輸出
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }

    // 將分類輸出寫入 docs 資料夾
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

    // Plugin README 為最終依據（已存在於每個 plugin 資料夾中）

    // 產生精選 plugins 章節並更新主 README.md
    console.log("正在以精選 plugins 更新主 README.md...");
    const featuredSection = generateFeaturedPluginsSection(PLUGINS_DIR);

    if (featuredSection) {
      const mainReadmePath = path.join(ROOT_FOLDER, "README.md");

      if (fs.existsSync(mainReadmePath)) {
        let readmeContent = fs.readFileSync(mainReadmePath, "utf8");

        // 定義標記，以識別要插入精選 plugins 的位置
        const startMarker = "## 🌟 Featured Plugins";
        const endMarker = "## MCP Server";

        // 檢查該章節是否已存在
        const startIndex = readmeContent.indexOf(startMarker);

        if (startIndex !== -1) {
          // 章節已存在，取代它
          const endIndex = readmeContent.indexOf(endMarker, startIndex);
          if (endIndex !== -1) {
            // 取代現有的章節
            const beforeSection = readmeContent.substring(0, startIndex);
            const afterSection = readmeContent.substring(endIndex);
            readmeContent =
              beforeSection + featuredSection + "\n\n" + afterSection;
          }
        } else {
          // 章節不存在，插入至 "## MCP Server" 之前
          const mcpIndex = readmeContent.indexOf(endMarker);
          if (mcpIndex !== -1) {
            const beforeMcp = readmeContent.substring(0, mcpIndex);
            const afterMcp = readmeContent.substring(mcpIndex);
            readmeContent = beforeMcp + featuredSection + "\n\n" + afterMcp;
          }
        }

        writeFileIfChanged(mainReadmePath, readmeContent);
        console.log("主 README.md 已以精選 plugins 更新");
      } else {
        console.warn("找不到 README.md，略過精選 plugins 更新");
      }
    } else {
      console.log("找不到可新增至 README.md 的精選 plugins");
    }
  } catch (error) {
    console.error(`產生分類 README 檔案時發生錯誤：${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// 執行 main 函式
main().catch((error) => {
  console.error(`致命錯誤：${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
