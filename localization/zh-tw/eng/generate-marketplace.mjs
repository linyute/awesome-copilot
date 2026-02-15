#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const MARKETPLACE_FILE = path.join(ROOT_FOLDER, ".github", "plugin", "marketplace.json");

/**
 * 從 plugin.json 檔案讀取外掛程式 Metadata
 * @param {string} pluginDir - 外掛程式目錄的路徑
 * @returns {object|null} - 外掛程式 Metadata，若未找到則為 null
 */
function readPluginMetadata(pluginDir) {
  const pluginJsonPath = path.join(pluginDir, ".github", "plugin", "plugin.json");
  
  if (!fs.existsSync(pluginJsonPath)) {
    console.warn(`警告：找不到 ${path.basename(pluginDir)} 的 plugin.json`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(pluginJsonPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`讀取 ${path.basename(pluginDir)} 的 plugin.json 時發生錯誤：`, error.message);
    return null;
  }
}

/**
 * 從外掛程式目錄產生 marketplace.json
 */
function generateMarketplace() {
  console.log("正在產生 marketplace.json...");
  
  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：在 ${PLUGINS_DIR} 找不到外掛程式目錄`);
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
        source: `./plugins/${dirName}`,
        description: metadata.description,
        version: metadata.version || "1.0.0"
      });
      console.log(`✓ 已新增外掛程式：${metadata.name}`);
    } else {
      console.log(`✗ 已跳過：${dirName}（無有效的 plugin.json）`);
    }
  }
  
  // 建立 marketplace.json 結構
  const marketplace = {
    name: "awesome-copilot",
    metadata: {
      description: "由社群驅動的 GitHub Copilot 外掛程式、代理程式、提示詞和技能集合",
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
  
  console.log(`\n✓ 成功產生包含 ${plugins.length} 個外掛程式的 marketplace.json`);
  console.log(`  位置：${MARKETPLACE_FILE}`);
}

// 執行指令碼
generateMarketplace();
