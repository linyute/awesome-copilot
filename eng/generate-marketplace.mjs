#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";
import { readExternalPlugins } from "./external-plugin-validation.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const MARKETPLACE_FILE = path.join(ROOT_FOLDER, ".github/plugin", "marketplace.json");

/**
 * 從 plugin.json 檔案讀取外掛程式 Metadata
 * @param {string} pluginDir - 外掛程式目錄路徑
 * @returns {object|null} - 外掛程式 Metadata，若找不到則傳回 null
 */
function readPluginMetadata(pluginDir) {
  const pluginJsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");

  if (!fs.existsSync(pluginJsonPath)) {
    console.warn(`警告: 在 ${path.basename(pluginDir)} 中找不到 plugin.json`);
    return null;
  }

  try {
    const content = fs.readFileSync(pluginJsonPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`讀取 ${path.basename(pluginDir)} 的 plugin.json 時發生錯誤:`, error.message);
    return null;
  }
}

/**
 * 從外掛程式目錄產生 marketplace.json
 */
function generateMarketplace() {
  console.log("正在產生 marketplace.json...");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤: 在 ${PLUGINS_DIR} 找不到外掛程式目錄`);
    process.exit(1);
  }

  // 讀取所有外掛程式目錄
  const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

  console.log(`找到 ${pluginDirs.length} 個外掛程式目錄`);

  // 讀取每個外掛程式的 Metadata
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
      console.log(`✓ 已新增外掛程式: ${metadata.name}`);
    } else {
      console.log(`✗ 已跳過: ${dirName} (無有效的 plugin.json)`);
    }
  }

  // 讀取外部外掛程式並直接合併
  const { plugins: externalPlugins, errors: externalErrors, warnings: externalWarnings } = readExternalPlugins({
    localPluginNames: plugins.map((plugin) => plugin.name),
    policy: "marketplace",
  });
  externalWarnings.forEach((warning) => console.warn(`警告: ${warning}`));
  if (externalErrors.length > 0) {
    externalErrors.forEach((error) => console.error(`錯誤: ${error}`));
    console.error("錯誤: external.json 包含無效項目");
    process.exit(1);
  }

  if (externalPlugins.length > 0) {
    console.log(`\n找到 ${externalPlugins.length} 個外部外掛程式`);
    for (const ext of externalPlugins) {
      plugins.push(ext);
      console.log(`✓ 已新增外部外掛程式: ${ext.name}`);
    }
  }

  // 依名稱排序所有外掛程式 (不區分大小寫)
  plugins.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // 建立 marketplace.json 結構
  const marketplace = {
    name: "awesome-copilot",
    metadata: {
      description: "由社群驅動的 GitHub Copilot 外掛程式、Agent、提示詞 (Prompts) 和技能 (Skills) 集合",
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

  console.log(`\n✓ 成功產生包含 ${plugins.length} 個外掛程式的 marketplace.json (${plugins.length - externalPlugins.length} 個本地，${externalPlugins.length} 個外部)`);
  console.log(`  位置: ${MARKETPLACE_FILE}`);
}

// 執行腳本
generateMarketplace();
