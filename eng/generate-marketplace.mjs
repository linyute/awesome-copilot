#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const EXTERNAL_PLUGINS_FILE = path.join(ROOT_FOLDER, "plugins", "external.json");
const MARKETPLACE_FILE = path.join(ROOT_FOLDER, ".github/plugin", "marketplace.json");

/**
 * 驗證外部套件項目是否具備必要欄位以及非本地來源
 * @param {object} plugin - 外部套件項目
 * @param {number} index - 陣列中的索引 (用於錯誤訊息)
 * @returns {string[]} - 驗證錯誤訊息陣列
 */
function validateExternalPlugin(plugin, index) {
  const errors = [];
  const prefix = `external.json[${index}]`;

  if (!plugin.name || typeof plugin.name !== "string") {
    errors.push(`${prefix}: "name" 為必填且必須是字串`);
  }
  if (!plugin.description || typeof plugin.description !== "string") {
    errors.push(`${prefix}: "description" 為必填且必須是字串`);
  }
  if (!plugin.version || typeof plugin.version !== "string") {
    errors.push(`${prefix}: "version" 為必填且必須是字串`);
  }

  if (!plugin.source) {
    errors.push(`${prefix}: "source" 為必填`);
  } else if (typeof plugin.source === "string") {
    errors.push(`${prefix}: "source" 必須是物件 (外部套件不允許使用本地檔案路徑)`);
  } else if (typeof plugin.source === "object") {
    if (!plugin.source.source) {
      errors.push(`${prefix}: "source.source" 為必填 (例如 "github", "url", "npm", "pip")`);
    }
  } else {
    errors.push(`${prefix}: "source" 必須是物件`);
  }

  return errors;
}

/**
 * 從 external.json 讀取外部套件項目
 * @returns {Array} - 外部套件項目陣列 (依原樣合併)
 */
function readExternalPlugins() {
  if (!fs.existsSync(EXTERNAL_PLUGINS_FILE)) {
    return [];
  }

  try {
    const content = fs.readFileSync(EXTERNAL_PLUGINS_FILE, "utf8");
    const plugins = JSON.parse(content);
    if (!Array.isArray(plugins)) {
      console.warn("警告：external.json 必須包含一個陣列");
      return [];
    }

    // 驗證每個項目
    let hasErrors = false;
    for (let i = 0; i < plugins.length; i++) {
      const errors = validateExternalPlugin(plugins[i], i);
      if (errors.length > 0) {
        errors.forEach(e => console.error(`錯誤：${e}`));
        hasErrors = true;
      }
    }
    if (hasErrors) {
      console.error("錯誤：external.json 包含無效項目");
      process.exit(1);
    }

    return plugins;
  } catch (error) {
    console.error(`讀取 external.json 時出錯：${error.message}`);
    return [];
  }
}

/**
 * 從 plugin.json 檔案讀取套件 Metadata
 * @param {string} pluginDir - 套件目錄路徑
 * @returns {object|null} - 套件 Metadata，若未找到則為 null
 */
function readPluginMetadata(pluginDir) {
  const pluginJsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");

  if (!fs.existsSync(pluginJsonPath)) {
    console.warn(`警告：找不到 ${path.basename(pluginDir)} 的 plugin.json`);
    return null;
  }

  try {
    const content = fs.readFileSync(pluginJsonPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`讀取 ${path.basename(pluginDir)} 的 plugin.json 時出錯：`, error.message);
    return null;
  }
}

/**
 * 從套件目錄產生 marketplace.json
 */
function generateMarketplace() {
  console.log("正在產生 marketplace.json...");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：在 ${PLUGINS_DIR} 找不到套件目錄`);
    process.exit(1);
  }

  // 讀取所有套件目錄
  const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  console.log(`找到 ${pluginDirs.length} 個套件目錄`);

  // 讀取每個套件的 Metadata
  const plugins = [];
  for (const dirName of pluginDirs) {
    const pluginPath = path.join(PLUGINS_DIR, dirName);
    const metadata = readPluginMetadata(pluginPath);

    if (metadata) {
      plugins.push({
        name: metadata.name,
        source: dirName,
        description: metadata.description,
        version: metadata.version || "1.0.0"
      });
      console.log(`✓ 已新增套件：${metadata.name}`);
    } else {
      console.log(`✗ 已跳過：${dirName} (無有效的 plugin.json)`);
    }
  }

  // 讀取外部套件並依原樣合併
  const externalPlugins = readExternalPlugins();
  if (externalPlugins.length > 0) {
    console.log(`\n找到 ${externalPlugins.length} 個外部套件`);

    // 針對重複名稱發出警告
    const localNames = new Set(plugins.map(p => p.name));
    for (const ext of externalPlugins) {
      if (localNames.has(ext.name)) {
        console.warn(`警告：外部套件 "${ext.name}" 與本地套件同名`);
      }
      plugins.push(ext);
      console.log(`✓ 已新增外部套件：${ext.name}`);
    }
  }

  // 依名稱排序所有套件 (不區分大小寫)
  plugins.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // 建立 marketplace.json 結構
  const marketplace = {
    name: "awesome-copilot",
    metadata: {
      description: "社群驅動的 GitHub Copilot 套件、代理、提示與技能集合",
      version: "1.0.0",
      pluginRoot: "./plugins"
    },
    owner: {
      name: "GitHub",
      email: "copilot@github.com"
    },
    plugins: plugins
  };

  // 確保目錄存在
  const marketplaceDir = path.dirname(MARKETPLACE_FILE);
  if (!fs.existsSync(marketplaceDir)) {
    fs.mkdirSync(marketplaceDir, { recursive: true });
  }

  // 寫入 marketplace.json
  fs.writeFileSync(MARKETPLACE_FILE, JSON.stringify(marketplace, null, 2) + "\n");

  console.log(`\n✓ 成功產生 marketplace.json，共 ${plugins.length} 個套件 (${plugins.length - externalPlugins.length} 個本地，${externalPlugins.length} 個外部)`);
  console.log(`  位置：${MARKETPLACE_FILE}`);
}

// 執行指令稿
generateMarketplace();
