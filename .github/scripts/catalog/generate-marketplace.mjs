#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ROOT_FOLDER } from "../lib/constants.mjs";
import { readExternalPlugins } from "../external-plugins/external-plugin-validation.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const MARKETPLACE_FILE = path.join(ROOT_FOLDER, ".github/plugin", "marketplace.json");

/**
 * 從 plugin.json 檔案讀取外掛程式中繼資料
 * @param {string} pluginDir - 外掛程式目錄路徑
 * @returns {object|null} - 外掛程式中繼資料，若找不到則為 null
 */
function readPluginMetadata(pluginDir) {
  const pluginJsonPath = path.join(pluginDir, "plugin.json");

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

function collectLocalPluginsFromRoot(rootDir, sourcePrefix, includeEntry = () => true) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => includeEntry(entry.name))
    .map(entry => entry.name)
    .sort();

  const plugins = [];
  for (const dirName of entries) {
    const pluginPath = path.join(rootDir, dirName);
    const metadata = readPluginMetadata(pluginPath);

    if (!metadata) {
      continue;
    }

    plugins.push({
      name: metadata.name,
      source: `${sourcePrefix}/${dirName}`,
      description: metadata.description,
      version: metadata.version || "1.0.0"
    });
  }

  return plugins;
}

/**
 * 從外掛程式目錄產生 marketplace.json
 */
export function generateMarketplace() {
  console.log("正在產生 marketplace.json...");

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.error(`錯誤：找不到外掛程式目錄 (${PLUGINS_DIR})`);
    process.exit(1);
  }

  const plugins = collectLocalPluginsFromRoot(PLUGINS_DIR, "plugins");

  console.log(`找到 ${plugins.length} 個本地外掛程式資訊清單`);

  // 讀取外部外掛程式並照原樣合併
  const { plugins: externalPlugins, errors: externalErrors, warnings: externalWarnings } = readExternalPlugins({
    localPluginNames: plugins.map((plugin) => plugin.name),
    policy: "marketplace",
  });
  externalWarnings.forEach((warning) => console.warn(`警告：${warning}`));
  if (externalErrors.length > 0) {
    externalErrors.forEach((error) => console.error(`錯誤：${error}`));
    console.error("錯誤：external.json 包含無效項目");
    process.exit(1);
  }

  if (externalPlugins.length > 0) {
    console.log(`\n找到 ${externalPlugins.length} 個外部外掛程式`);
    for (const ext of externalPlugins) {
      plugins.push(ext);
      console.log(`✓ 已新增外部外掛程式：${ext.name}`);
    }
  }

  // 依名稱排序所有外掛程式（不區分大小寫）
  plugins.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // 建立 marketplace.json 結構
  const marketplace = {
    name: "awesome-copilot",
    metadata: {
      description: "Community-driven collection of GitHub Copilot plugins, agents, prompts, and skills",
      version: "1.0.0"
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

  console.log(`\n✓ 成功產生包含 ${plugins.length} 個外掛程式的 marketplace.json（${plugins.length - externalPlugins.length} 個本地，${externalPlugins.length} 個外部）`);
  console.log(`  位置：${MARKETPLACE_FILE}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateMarketplace();
}
