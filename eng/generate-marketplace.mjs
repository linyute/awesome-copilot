#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { ROOT_FOLDER } from "./constants.mjs";
import { readExternalPlugins } from "./external-plugin-validation.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");
const EXTENSIONS_DIR = path.join(ROOT_FOLDER, "extensions");
const MARKETPLACE_FILE = path.join(ROOT_FOLDER, ".github/plugin", "marketplace.json");

/**
 * 從 plugin.json 讀取 plugin 的 metadata
 * @param {string} pluginDir - plugin 目錄路徑
 * @returns {object|null} - plugin metadata，若找不到則回傳 null
 */
function readPluginMetadata(pluginDir) {
  const pluginJsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");

  if (!fs.existsSync(pluginJsonPath)) {
    console.warn(`警告：在 ${path.basename(pluginDir)} 找不到 plugin.json`);
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
 * 產生 marketplace.json
 */
function generateMarketplace() {
  console.log("正在產生 marketplace.json...");

  if (!fs.existsSync(PLUGINS_DIR) && !fs.existsSync(EXTENSIONS_DIR)) {
    console.error(`錯誤：找不到 plugins 目錄 (${PLUGINS_DIR}) 或 extensions 目錄 (${EXTENSIONS_DIR})`);
    process.exit(1);
  }

  const plugins = [
    ...collectLocalPluginsFromRoot(PLUGINS_DIR, "plugins"),
    ...collectLocalPluginsFromRoot(
      EXTENSIONS_DIR,
      "extensions",
      (entryName) => fs.existsSync(path.join(EXTENSIONS_DIR, entryName, "extension.mjs"))
    )
  ];

  console.log(`找到 ${plugins.length} 個本地 plugin manifest`);

  // 讀取 external plugins 並直接合併
  const { plugins: externalPlugins, errors: externalErrors, warnings: externalWarnings } = readExternalPlugins({
    localPluginNames: plugins.map((plugin) => plugin.name),
    policy: "marketplace",
  });
  externalWarnings.forEach((warning) => console.warn(`警告：${warning}`));
  if (externalErrors.length > 0) {
    externalErrors.forEach((error) => console.error(`錯誤：${error}`));
    console.error("錯誤：external.json 包含無效的條目");
    process.exit(1);
  }

  if (externalPlugins.length > 0) {
    console.log(`\n找到 ${externalPlugins.length} 個外部 plugin`);
    for (const ext of externalPlugins) {
      plugins.push(ext);
      console.log(`✓ 已加入外部 plugin：${ext.name}`);
    }
  }

  // 依名稱（不區分大小寫）排序所有 plugin
  plugins.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // 建立 marketplace.json 結構
  const marketplace = {
    name: "awesome-copilot",
    metadata: {
      description: "社群驅動的 GitHub Copilot plugin、agent、prompt 與 skill 集合",
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

  console.log(`\n✓ 成功產生 marketplace.json，總共 ${plugins.length} 個 plugin（本地 ${plugins.length - externalPlugins.length}、外部 ${externalPlugins.length}）`);
  console.log(`  位置：${MARKETPLACE_FILE}`);
}

// 執行腳本
generateMarketplace();
