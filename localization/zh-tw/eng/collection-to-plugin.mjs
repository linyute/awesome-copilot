#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import { COLLECTIONS_DIR, ROOT_FOLDER } from "./constants.mjs";
import {
  parseCollectionYaml,
  parseFrontmatter,
  parseHookMetadata,
} from "./yaml-parser.mjs";

const PLUGINS_DIR = path.join(ROOT_FOLDER, "plugins");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { collection: undefined, mode: "migrate", all: false };

  // 從環境變數檢查模式 (由 npm 腳本設定)
  if (process.env.PLUGIN_MODE === "refresh") {
    out.mode = "refresh";
  }

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--collection" || a === "-c") {
      out.collection = args[i + 1];
      i++;
    } else if (a.startsWith("--collection=")) {
      out.collection = a.split("=")[1];
    } else if (a === "--refresh" || a === "-r") {
      out.mode = "refresh";
    } else if (a === "--migrate" || a === "-m") {
      out.mode = "migrate";
    } else if (a === "--all" || a === "-a") {
      out.all = true;
    } else if (!a.startsWith("-") && !out.collection) {
      out.collection = a;
    }
  }

  return out;
}

/**
 * 列出可用的 collection
 */
function listCollections() {
  if (!fs.existsSync(COLLECTIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(COLLECTIONS_DIR)
    .filter((file) => file.endsWith(".collection.yml"))
    .map((file) => file.replace(".collection.yml", ""));
}

/**
 * 列出具有對應 collection 的現有 plugin
 */
function listExistingPlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) {
    return [];
  }

  const collections = listCollections();
  const plugins = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  // 僅返回具有相符 collection 的 plugin
  return plugins.filter((plugin) => collections.includes(plugin));
}

/**
 * 從 destPath 建立一個指向 srcPath 的符號連結 (symlink)
 * 使用相對路徑以確保可攜性
 */
function createSymlink(srcPath, destPath) {
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 計算從目的地到來源的相對路徑
  const relativePath = path.relative(destDir, srcPath);

  // 如果存在現有檔案/符號連結，則將其移除
  try {
    const stats = fs.lstatSync(destPath);
    if (stats) {
      fs.unlinkSync(destPath);
    }
  } catch {
    // 檔案不存在，沒關係
  }

  fs.symlinkSync(relativePath, destPath);
}

/**
 * 建立目錄的符號連結
 */
function symlinkDirectory(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  const parentDir = path.dirname(destDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // 計算從目的地到來源的相對路徑
  const relativePath = path.relative(parentDir, srcDir);

  // 如果存在現有目錄/符號連結，則將其移除
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }

  fs.symlinkSync(relativePath, destDir);
}

/**
 * 產生 plugin.json 內容
 */
function generatePluginJson(collection) {
  return {
    name: collection.id,
    description: collection.description,
    version: "1.0.0",
    author: {
      name: "Awesome Copilot Community",
    },
    repository: "https://github.com/github/awesome-copilot",
    license: "MIT",
  };
}

/**
 * 取得不含副檔名的基礎名稱以供顯示
 */
function getDisplayName(filePath, kind) {
  const basename = path.basename(filePath);
  if (kind === "prompt") {
    return basename.replace(".prompt.md", "");
  } else if (kind === "agent") {
    return basename.replace(".agent.md", "");
  } else if (kind === "instruction") {
    return basename.replace(".instructions.md", "");
  } else if (kind === "hook") {
    // 對於像 hooks/<hook>/README.md 這樣以資料夾為基礎的 hook，使用資料夾名稱。
    if (basename.toLowerCase() === "readme.md") {
      return path.basename(path.dirname(filePath));
    }
    return basename.replace(".hook.md", "");
  } else if (kind === "skill") {
    return path.basename(filePath);
  }
  return basename;
}

/**
 * 為 plugin 產生 README.md 內容
 */
function generateReadme(collection, items) {
  const lines = [];

  // 標題來自 collection 名稱
  const title = collection.name || collection.id;
  lines.push(`# ${title} Plugin`);
  lines.push("");
  lines.push(collection.description);
  lines.push("");

  // 安裝區段
  lines.push("## 安裝方式");
  lines.push("");
  lines.push("```bash");
  lines.push("# 使用 Copilot CLI");
  lines.push(`copilot plugin install ${collection.id}@awesome-copilot`);
  lines.push("```");
  lines.push("");

  lines.push("## 包含內容");
  lines.push("");

  // 指令 (prompts)
  const prompts = items.filter((item) => item.kind === "prompt");
  if (prompts.length > 0) {
    lines.push("### 指令 (斜線指令)");
    lines.push("");
    lines.push("| 指令 | 描述 |");
    lines.push("|---------|-------------|");
    for (const item of prompts) {
      const name = getDisplayName(item.path, "prompt");
      const description =
        item.frontmatter?.description || item.frontmatter?.title || name;
      lines.push(`| \`/${collection.id}:${name}\` | ${description} |`);
    }
    lines.push("");
  }

  // Agents
  const agents = items.filter((item) => item.kind === "agent");
  if (agents.length > 0) {
    lines.push("### Agents");
    lines.push("");
    lines.push("| Agent | 描述 |");
    lines.push("|-------|-------------|");
    for (const item of agents) {
      const name = getDisplayName(item.path, "agent");
      const description =
        item.frontmatter?.description || item.frontmatter?.name || name;
      lines.push(`| \`${name}\` | ${description} |`);
    }
    lines.push("");
  }

  // Hooks
  const hooks = items.filter((item) => item.kind === "hook");
  if (hooks.length > 0) {
    lines.push("### Hooks");
    lines.push("");
    lines.push("| Hook | 描述 | 事件 |");
    lines.push("|------|-------------|-------|");
    for (const item of hooks) {
      const name = getDisplayName(item.path, "hook");
      const description =
        item.frontmatter?.description || item.frontmatter?.name || name;
      // 從 hooks.json 而非 frontmatter 擷取事件
      const hookFolderPath = path.join(ROOT_FOLDER, path.dirname(item.path));
      const hookMeta = parseHookMetadata(hookFolderPath);
      const event =
        hookMeta?.hooks?.length > 0 ? hookMeta.hooks.join(", ") : "N/A";
      lines.push(`| \`${name}\` | ${description} | ${event} |`);
    }
    lines.push("");
  }

  // Skills
  const skills = items.filter((item) => item.kind === "skill");
  if (skills.length > 0) {
    lines.push("### Skills");
    lines.push("");
    lines.push("| Skill | 描述 |");
    lines.push("|-------|-------------|");
    for (const item of skills) {
      const name = getDisplayName(item.path, "skill");
      const description = item.frontmatter?.description || name;
      lines.push(`| \`${name}\` | ${description} |`);
    }
    lines.push("");
  }

  // 原始碼
  lines.push("## 原始碼");
  lines.push("");
  lines.push(
    "此 plugin 是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個由社群驅動的 GitHub Copilot 擴充功能集合。"
  );
  lines.push("");
  lines.push("## 授權條款");
  lines.push("");
  lines.push("MIT");

  return lines.join("\n");
}

/**
 * 將 collection 轉換為 plugin
 * @param {string} collectionId - collection ID
 * @param {string} mode - "migrate" 用於首次建立，"refresh" 用於更新現有的
 * @param {boolean} silent - 如果為 true，則在發生錯誤時返回 false 而非結束執行 (用於批次模式)
 * @returns {boolean} - 如果成功則為 True
 */
function convertCollectionToPlugin(
  collectionId,
  mode = "migrate",
  silent = false
) {
  const collectionFile = path.join(
    COLLECTIONS_DIR,
    `${collectionId}.collection.yml`
  );

  if (!fs.existsSync(collectionFile)) {
    if (silent) {
      console.warn(`⚠️  找不到 collection 檔案：${collectionId}`);
      return false;
    }
    console.error(`❌ 找不到 collection 檔案：${collectionFile}`);
    process.exit(1);
  }

  const collection = parseCollectionYaml(collectionFile);
  if (!collection) {
    if (silent) {
      console.warn(`⚠️  剖析 collection 失敗：${collectionId}`);
      return false;
    }
    console.error(`❌ 剖析 collection 失敗：${collectionFile}`);
    process.exit(1);
  }

  const pluginDir = path.join(PLUGINS_DIR, collectionId);
  const pluginExists = fs.existsSync(pluginDir);

  if (mode === "migrate") {
    // Migrate 模式：如果 plugin 已存在則失敗
    if (pluginExists) {
      if (silent) {
        console.warn(`⚠️  Plugin 已存在：${collectionId}`);
        return false;
      }
      console.error(`❌ Plugin 已存在：${pluginDir}`);
      console.log(
        "💡 使用 'npm run plugin:refresh' 來更新現有的 plugin。"
      );
      process.exit(1);
    }
    console.log(`\n📦 正在將 collection "${collectionId}" 遷移至 plugin...`);
  } else {
    // Refresh 模式：如果 plugin 不存在則失敗
    if (!pluginExists) {
      if (silent) {
        console.warn(`⚠️  Plugin 不存在：${collectionId}`);
        return false;
      }
      console.error(`❌ Plugin 不存在：${pluginDir}`);
      console.log(
        "💡 先使用 'npm run plugin:migrate' 來建立新的 plugin。"
      );
      process.exit(1);
    }
    console.log(`\n🔄 正在從 collection 重新整理 plugin "${collectionId}"...`);
    // 移除現有的 plugin 目錄以進行重新整理
    fs.rmSync(pluginDir, { recursive: true });
  }

  // 建立 plugin 目錄結構
  fs.mkdirSync(path.join(pluginDir, ".github", "plugin"), { recursive: true });

  // 處理項目並收集 Metadata
  const processedItems = [];
  const stats = { prompts: 0, agents: 0, instructions: 0, skills: 0 };

  for (const item of collection.items || []) {
    const srcPath = path.join(ROOT_FOLDER, item.path);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  找不到來源檔案，跳過：${item.path}`);
      continue;
    }

    let destPath;
    let frontmatter = null;

    switch (item.kind) {
      case "prompt":
        // Prompts 存放到 commands/ 並使用 .md 副檔名
        const promptName = path
          .basename(item.path)
          .replace(".prompt.md", ".md");
        destPath = path.join(pluginDir, "commands", promptName);
        frontmatter = parseFrontmatter(srcPath);
        stats.prompts++;
        break;

      case "agent":
        // Agents 存放到 agents/ 並使用 .md 副檔名
        const agentName = path.basename(item.path).replace(".agent.md", ".md");
        destPath = path.join(pluginDir, "agents", agentName);
        frontmatter = parseFrontmatter(srcPath);
        stats.agents++;
        break;

      case "instruction":
        // Plugin 不支援 Instructions - 追蹤以進行總結
        stats.instructions++;
        continue;

      case "skill":
        // Skills 是資料夾 - 路徑可以是資料夾或 SKILL.md 檔案
        let skillSrcDir = srcPath;
        let skillMdPath;

        // 如果路徑指向 SKILL.md，則使用父目錄作為 skill 資料夾
        if (item.path.endsWith("SKILL.md")) {
          skillSrcDir = path.dirname(srcPath);
          skillMdPath = srcPath;
        } else {
          skillMdPath = path.join(srcPath, "SKILL.md");
        }

        const skillName = path.basename(skillSrcDir);
        destPath = path.join(pluginDir, "skills", skillName);

        // 驗證來源是否為目錄
        if (!fs.statSync(skillSrcDir).isDirectory()) {
          console.warn(
            `⚠️  Skill 路徑不是目錄，跳過：${item.path}`
          );
          continue;
        }

        symlinkDirectory(skillSrcDir, destPath);

        // 嘗試取得 SKILL.md 的 frontmatter
        if (fs.existsSync(skillMdPath)) {
          frontmatter = parseFrontmatter(skillMdPath);
        }
        stats.skills++;
        processedItems.push({ ...item, frontmatter });
        continue; // 已連結

      default:
        console.warn(
          `⚠️  未知的項目種類 "${item.kind}"，跳過：${item.path}`
        );
        continue;
    }

    // 建立指向來源檔案的符號連結
    createSymlink(srcPath, destPath);
    processedItems.push({ ...item, frontmatter });
  }

  // 產生 plugin.json
  const pluginJson = generatePluginJson(collection);
  fs.writeFileSync(
    path.join(pluginDir, ".github", "plugin", "plugin.json"),
    JSON.stringify(pluginJson, null, 2) + "\n"
  );

  // 產生 README.md
  const readme = generateReadme(collection, processedItems);
  fs.writeFileSync(path.join(pluginDir, "README.md"), readme + "\n");

  // 列印總結
  console.log(`\n✅ 已建立 Plugin：${pluginDir}`);
  console.log("\n📊 總結：");
  if (stats.prompts > 0)
    console.log(`   - 指令 (prompts)：${stats.prompts}`);
  if (stats.agents > 0) console.log(`   - Agents：${stats.agents}`);
  if (stats.skills > 0) console.log(`   - Skills：${stats.skills}`);

  console.log("\n📁 產生的檔案：");
  console.log(
    `   - ${path.join(pluginDir, ".github", "plugin", "plugin.json")}`
  );
  console.log(`   - ${path.join(pluginDir, "README.md")}`);
  if (stats.prompts > 0)
    console.log(`   - ${path.join(pluginDir, "commands", "*.md")}`);
  if (stats.agents > 0)
    console.log(`   - ${path.join(pluginDir, "agents", "*.md")}`);
  if (stats.skills > 0)
    console.log(`   - ${path.join(pluginDir, "skills", "*")}`);

  // 關於被排除的 instructions 的說明
  if (stats.instructions > 0) {
    console.log(
      `\n📋 說明：排除了 ${stats.instructions} 個 instruction (Plugin 不支援)`
    );
  }
  return true;
}

async function main() {
  try {
    const parsed = parseArgs();
    const isRefresh = parsed.mode === "refresh";

    console.log(isRefresh ? "🔄 Plugin 重新整理" : "📦 Plugin 遷移");
    console.log(
      isRefresh
        ? "此工具會從 collection 重新整理現有的 plugin。\n"
        : "此工具會將 collection 遷移至新的 plugin。\n"
    );

    // 處理 --all 旗標 (僅在 refresh 模式下有效)
    if (parsed.all) {
      if (!isRefresh) {
        console.error("❌ --all 旗標僅在 plugin:refresh 下有效");
        process.exit(1);
      }

      const existingPlugins = listExistingPlugins();
      if (existingPlugins.length === 0) {
        console.log("找不到具有相符 collection 的現有 plugin。");
        process.exit(0);
      }

      console.log(`找到 ${existingPlugins.length} 個要重新整理的 plugin：\n`);

      let successCount = 0;
      let failCount = 0;

      for (const pluginId of existingPlugins) {
        const success = convertCollectionToPlugin(pluginId, "refresh", true);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      console.log(`\n${"=".repeat(50)}`);
      console.log(`✅ 已重新整理：${successCount} 個 plugin`);
      if (failCount > 0) {
        console.log(`⚠️  失敗：${failCount} 個 plugin`);
      }
      return;
    }

    let collectionId = parsed.collection;
    if (!collectionId) {
      // 列出可用的 collection
      const collections = listCollections();
      if (collections.length === 0) {
        console.error("❌ 在 collections 目錄中找不到任何 collection");
        process.exit(1);
      }

      console.log("可用的 collections：");
      collections.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
      console.log("");

      collectionId = await prompt(
        "輸入 collection ID (或清單中的數字)："
      );

      // 檢查使用者是否輸入了數字
      const num = parseInt(collectionId, 10);
      if (!isNaN(num) && num >= 1 && num <= collections.length) {
        collectionId = collections[num - 1];
      }
    }

    if (!collectionId) {
      console.error("❌ 需要 collection ID");
      process.exit(1);
    }

    convertCollectionToPlugin(collectionId, parsed.mode);
  } catch (error) {
    console.error(`❌ 錯誤：${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
