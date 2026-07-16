#!/usr/bin/env node

/**
 * 為 GitHub Pages 網站產生 JSON metadata 檔案。
 * 此腳本會從 agents、instructions、skills 與 plugins 擷取 metadata
 * 並寫入 website/data/ 供客戶端搜尋與顯示使用。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  AGENTS_DIR,
  COOKBOOK_DIR,
  EXTENSIONS_DIR,
  INSTRUCTIONS_DIR,
  PLUGINS_DIR,
  ROOT_FOLDER,
  SKILLS_DIR,
} from "./constants.mjs";
import { getGitFileDates } from "./utils/git-dates.mjs";
import {
  parseFrontmatter,
  parseSkillMetadata,
  parseYamlFile,
} from "./yaml-parser.mjs";

const __filename = fileURLToPath(import.meta.url);

const WEBSITE_DIR = path.join(ROOT_FOLDER, "website");
const WEBSITE_DATA_DIR = path.join(WEBSITE_DIR, "public", "data");
const WEBSITE_SOURCE_DATA_DIR = path.join(WEBSITE_DIR, "data");

/**
 * 確保輸出目錄存在
 */
function ensureDataDir() {
  if (!fs.existsSync(WEBSITE_DATA_DIR)) {
    fs.mkdirSync(WEBSITE_DATA_DIR, { recursive: true });
  }
}

/**
 * 從檔名或 frontmatter 擷取標題
 */
function extractTitle(filePath, frontmatter) {
  if (frontmatter?.name) {
    return frontmatter.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  // 若無則以檔名為備援
  const basename = path.basename(filePath);
  const name = basename
    .replace(/\.(agent|prompt|instructions)\.md$/, "")
    .replace(/\.md$/, "");
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * 將 kebab/snake 名稱轉為可讀的顯示名稱。
 */
function formatDisplayName(value) {
  const acronymMap = new Map([
    ["ai", "AI"],
    ["api", "API"],
    ["cli", "CLI"],
    ["css", "CSS"],
    ["html", "HTML"],
    ["json", "JSON"],
    ["llm", "LLM"],
    ["mcp", "MCP"],
    ["ui", "UI"],
    ["ux", "UX"],
    ["vscode", "VS Code"],
  ]);

  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (acronymMap.has(lower)) {
        return acronymMap.get(lower);
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function normalizeText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

/**
 * 將作者欄位（npm 字串格式或 { name, url } 物件）正規化為
 * { name, url? } | null。若沒有可用名稱則回傳 null。
 */
function normalizeAuthor(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name } : null;
  }
  if (typeof value === "object") {
    const name = normalizeText(value.name);
    if (!name) return null;
    const url = normalizeText(value.url);
    return url ? { name, url } : { name };
  }
  return null;
}

/**
 * 取得某目錄下所有檔案的最新 git 修改日期
 */
function getDirectoryLastUpdated(gitDates, relativeDirPath) {
  const prefix = `${relativeDirPath}/`;
  let latestDate = null;
  let latestTime = 0;

  for (const [filePath, date] of gitDates.entries()) {
    if (!filePath.startsWith(prefix)) continue;
    const timestamp = Date.parse(date);
    if (!Number.isNaN(timestamp) && timestamp > latestTime) {
      latestTime = timestamp;
      latestDate = date;
    }
  }

  return latestDate;
}

/**
 * 取得目前檢出的 commit SHA
 */
function getCurrentCommitSha() {
  return execSync("git --no-pager rev-parse HEAD", {
    cwd: ROOT_FOLDER,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

/**
 * 產生 agents metadata
 */
function generateAgentsData(gitDates) {
  const agents = [];
  const files = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".agent.md"));

  // 蒐集所有 filter 的唯一值
  const allModels = new Set();
  const allTools = new Set();

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const frontmatter = parseFrontmatter(filePath);
    const relativePath = path
      .relative(ROOT_FOLDER, filePath)
      .replace(/\\/g, "/");

    const model = frontmatter?.model || null;
    const tools = frontmatter?.tools || [];
    const handoffs = frontmatter?.handoffs || [];

    // 蒐集唯一值
    if (model) allModels.add(model);
    tools.forEach((t) => allTools.add(t));

    agents.push({
      id: file.replace(".agent.md", ""),
      title: extractTitle(filePath, frontmatter),
      description: frontmatter?.description || "",
      model: model,
      tools: tools,
      hasHandoffs: handoffs.length > 0,
      handoffs: handoffs.map((h) => ({
        label: h.label || "",
        agent: h.agent || "",
      })),
      mcpServers: frontmatter?.["mcp-servers"]
        ? Object.keys(frontmatter["mcp-servers"])
        : [],
      path: relativePath,
      filename: file,
      lastUpdated: gitDates.get(relativePath) || null,
    });
  }

  // 排序並回傳含 filter metadata 的結果
  const sortedAgents = agents.sort((a, b) => a.title.localeCompare(b.title));

  return {
    items: sortedAgents,
    filters: {
      models: ["(none)", ...Array.from(allModels).sort()],
      tools: Array.from(allTools).sort(),
    },
  };
}

/**
 * 將 applyTo 欄位解析為 pattern 陣列
 */
function parseApplyToPatterns(applyTo) {
  if (!applyTo) return [];

  // 處理陣列格式
  if (Array.isArray(applyTo)) {
    return applyTo.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  // 處理字串格式（逗號分隔）
  if (typeof applyTo === "string") {
    return applyTo
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  return [];
}

/**
 * 從 glob pattern 擷取檔案副檔名
 */
function extractExtensionFromPattern(pattern) {
  // 匹配 **.ts, **/*.js, *.py 等
  const match = pattern.match(/\*\.(\w+)$/);
  if (match) return `.${match[1]}`;

  // 匹配 **/*.{ts,tsx}
  const braceMatch = pattern.match(/\*\.\{([^}]+)\}$/);
  if (braceMatch) {
    return braceMatch[1].split(",").map((ext) => `.${ext.trim()}`);
  }

  return null;
}

/**
 * 產生 instructions metadata
 */
function generateInstructionsData(gitDates) {
  const instructions = [];
  const files = fs
    .readdirSync(INSTRUCTIONS_DIR)
    .filter((f) => f.endsWith(".instructions.md"));

  // 蒐集所有 pattern 與 extension 作為 filters
  const allPatterns = new Set();
  const allExtensions = new Set();

  for (const file of files) {
    const filePath = path.join(INSTRUCTIONS_DIR, file);
    const frontmatter = parseFrontmatter(filePath);
    const relativePath = path
      .relative(ROOT_FOLDER, filePath)
      .replace(/\\/g, "/");

    const applyToRaw = frontmatter?.applyTo || null;
    const applyToPatterns = parseApplyToPatterns(applyToRaw);

    // 從 patterns 擷取 extensions
    const extensions = [];
    for (const pattern of applyToPatterns) {
      allPatterns.add(pattern);
      const ext = extractExtensionFromPattern(pattern);
      if (ext) {
        if (Array.isArray(ext)) {
          ext.forEach((e) => {
            extensions.push(e);
            allExtensions.add(e);
          });
        } else {
          extensions.push(ext);
          allExtensions.add(ext);
        }
      }
    }

    instructions.push({
      id: file.replace(".instructions.md", ""),
      title: extractTitle(filePath, frontmatter),
      description: frontmatter?.description || "",
      applyTo: applyToRaw,
      applyToPatterns: applyToPatterns,
      extensions: [...new Set(extensions)],
      path: relativePath,
      filename: file,
      lastUpdated: gitDates.get(relativePath) || null,
    });
  }

  const sortedInstructions = instructions.sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return {
    items: sortedInstructions,
    filters: {
      patterns: Array.from(allPatterns).sort(),
      extensions: ["(none)", ...Array.from(allExtensions).sort()],
    },
  };
}

/**
 * 產生 skills metadata
 */
function generateSkillsData(gitDates) {
  const skills = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    return { items: [], filters: { hasAssets: ["Yes", "No"] } };
  }

  const folders = fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());

  for (const folder of folders) {
    const skillPath = path.join(SKILLS_DIR, folder);
    const metadata = parseSkillMetadata(skillPath);

    if (metadata) {
      const relativePath = path
        .relative(ROOT_FOLDER, skillPath)
        .replace(/\\/g, "/");

      // 取得 skill 資料夾下的所有檔案
      const files = getFolderFiles(skillPath, relativePath);

      // 以 SKILL.md 的最後更新時間作為 lastUpdated
      const skillFilePath = `${relativePath}/SKILL.md`;
      const title = metadata.name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const searchText = [
        title,
        metadata.description,
        folder,
        metadata.name,
        relativePath,
      ]
        .join(" ")
        .toLowerCase();

      skills.push({
        id: folder,
        name: metadata.name,
        title,
        description: metadata.description,
        assets: metadata.assets,
        hasAssets: metadata.assets.length > 0,
        assetCount: metadata.assets.length,
        path: relativePath,
        skillFile: skillFilePath,
        files: files,
        lastUpdated: gitDates.get(skillFilePath) || null,
        searchText,
      });
    }
  }

  const sortedSkills = skills.sort((a, b) => a.title.localeCompare(b.title));

  return {
    items: sortedSkills,
    filters: {
      hasAssets: ["Yes", "No"],
    },
  };
}

/**
 * 取得資料夾內的所有檔案（遞迴）
 */
function getFolderFiles(skillPath, relativePath) {
  const files = [];

  function walkDir(dir, relDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else {
        // 取得檔案大小
        const stats = fs.statSync(fullPath);
        files.push({
          path: `${relativePath}/${relPath}`,
          name: relPath,
          size: stats.size,
        });
      }
    }
  }

  walkDir(skillPath, "");
  return files;
}

/**
 * 從資料夾取得所有 agent markdown 檔案
 */
function getAgentFiles(agentDir, pluginRootPath) {
  if (!fs.existsSync(agentDir)) return [];

  return fs
    .readdirSync(agentDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      kind: "agent",
      path: `${pluginRootPath}/agents/${f}`,
    }));
}

/**
 * 為具有專屬詳細頁面的資源（agent, skill, instruction, extension）建立 id -> { title, url } 的索引
 */
function buildResourceIndex({ agents, skills, instructions, extensions }) {
  const toMap = (items, urlPrefix) => {
    const map = new Map();
    for (const item of items || []) {
      if (!item?.id) continue;
      map.set(item.id, {
        title: item.title || item.id,
        url: `/${urlPrefix}/${item.id}/`,
      });
    }
    return map;
  };
  const extensionMap = new Map();
  for (const item of extensions || []) {
    if (!item?.id) continue;

    const entry = {
      title: item.name || item.title || item.id,
      url: `/extension/${item.id}/`,
    };
    const keys = [
      item.id,
      item.extensionId,
      item.path ? pluginItemCandidateId(item.path) : null,
    ].filter(Boolean);

    for (const key of keys) {
      if (!extensionMap.has(key)) {
        extensionMap.set(key, entry);
      }
    }
  }

  return {
    agent: toMap(agents, "agent"),
    skill: toMap(skills, "skill"),
    instruction: toMap(instructions, "instruction"),
    extension: extensionMap,
  };
}

/**
 * 從 plugin item path 推導候選 resource id
 * "./skills/foo/" -> "foo",
 * "plugins/x/agents/bar.md" -> "bar".
 */
function pluginItemCandidateId(itemPath) {
  const trimmed = String(itemPath || "")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
  const base = trimmed.split("/").pop() || "";
  return base
    .replace(/\.agent\.md$/i, "")
    .replace(/\.prompt\.md$/i, "")
    .replace(/\.instructions\.md$/i, "")
    .replace(/\.md$/i, "");
}

/**
 * 為 plugin item ({ kind, path }) 補上顯示標題，若有詳細頁則加上 detailUrl
 */
function resolvePluginItem(item, resourceIndex) {
  const candidateId = pluginItemCandidateId(item.path);
  const lookup = resourceIndex?.[item.kind];
  const match = lookup?.get(candidateId);

  return {
    ...item,
    title: match?.title || item.title || candidateId || item.path,
    detailUrl: match?.url || null,
  };
}

/**
 * 產生 plugins metadata
 */
function generatePluginsData(gitDates, resourceIndex = {}) {
  const plugins = [];
  const extensionEntriesByName = new Map();

  if (!fs.existsSync(PLUGINS_DIR)) {
    return { items: [], filters: { tags: [] } };
  }

  const pluginDirs = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  if (fs.existsSync(EXTENSIONS_DIR)) {
    const extensionDirs = fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
      .filter((entry) => {
        if (!entry.isDirectory()) return false;
        return fs.existsSync(path.join(EXTENSIONS_DIR, entry.name, "extension.mjs"));
      })
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    for (const extensionDirName of extensionDirs) {
      const extensionDir = path.join(EXTENSIONS_DIR, extensionDirName);
      const pluginJsonPath = path.join(extensionDir, ".github", "plugin", "plugin.json");
      if (!fs.existsSync(pluginJsonPath)) {
        continue;
      }

      try {
        const extensionPlugin = JSON.parse(fs.readFileSync(pluginJsonPath, "utf-8"));
        const pluginName = normalizeText(extensionPlugin.name, extensionDirName);
        const pluginDescription = normalizeText(extensionPlugin.description, "Canvas extension");
        const extensionKeywords = Array.isArray(extensionPlugin.keywords)
          ? [...new Set(extensionPlugin.keywords.filter((keyword) => typeof keyword === "string").map((keyword) => keyword.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
          : [];
        const relPath = `extensions/${extensionDirName}`;
        const extensionItem = resolvePluginItem(
          {
            kind: "extension",
            path: relPath,
          },
          resourceIndex
        );
        const extReadmePath = path.join(extensionDir, "README.md");
        const extReadmeFile = fs.existsSync(extReadmePath)
          ? `${relPath}/README.md`
          : null;

        extensionEntriesByName.set(pluginName, {
          id: pluginName,
          name: pluginName,
          description: pluginDescription,
          path: relPath,
          readmeFile: extReadmeFile,
          version: normalizeText(extensionPlugin.version, null),
          tags: extensionKeywords,
          itemCount: 1,
          items: [extensionItem],
          generatedFromExtension: true,
          lastUpdated: getDirectoryLastUpdated(gitDates, relPath),
          searchText: `${pluginName} ${pluginDescription} ${extensionKeywords.join(" ")} canvas extension`.toLowerCase(),
        });
      } catch (e) {
        console.warn(`解析 extension plugin manifest ${extensionDirName} 失敗：${e.message}`);
      }
    }
  }

  for (const dir of pluginDirs) {
    const pluginDir = path.join(PLUGINS_DIR, dir.name);
    const jsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");

    if (!fs.existsSync(jsonPath)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const relPath = `plugins/${dir.name}`;
      const extensionRefs = Array.isArray(data?.["x-awesome-copilot"]?.extensions)
        ? data["x-awesome-copilot"].extensions
        : [];
      const extensionItems = extensionRefs
        .map((entry) => normalizeText(entry))
        .filter(Boolean)
        .map((entry) => entry.replace(/^\.\/+/, "").replace(/\/$/, ""))
        .filter((entry) => entry.startsWith("extensions/"))
        .map((entry) => ({
          kind: "extension",
          path: entry,
        }));

      const agentItems = (data.agents || []).flatMap((agent) => {
        const agentPath = agent.replace("./", "");
        const fullPath = path.join(pluginDir, agentPath);

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
          return getAgentFiles(fullPath, relPath);
        }

        return [
          {
            kind: "agent",
            path: `${relPath}/${agentPath}`,
          },
        ];
      });

      // 解析 mcpServers：支援指向 .mcp.json 檔案的路徑或內嵌物件
      const mcpItems = [];
      if (data.mcpServers) {
        let mcpServersObj = null;
        let mcpConfigPath = relPath;
        if (typeof data.mcpServers === "string") {
          const manifestMcpPath = data.mcpServers.replace(/^\.\//, "");
          mcpConfigPath = manifestMcpPath ? `${relPath}/${manifestMcpPath}` : relPath;
          const mcpJsonPath = path.join(pluginDir, manifestMcpPath);
          if (fs.existsSync(mcpJsonPath)) {
            try {
              const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
              mcpServersObj = mcpJson.mcpServers || mcpJson;
            } catch {
              // 忽略解析錯誤
            }
          }
        } else if (typeof data.mcpServers === "object") {
          mcpServersObj = data.mcpServers;
        }
        if (mcpServersObj) {
          for (const serverName of Object.keys(mcpServersObj)) {
            mcpItems.push({ kind: "mcp", path: mcpConfigPath, title: serverName });
          }
        }
      }

      // 從規格欄位（agents, commands, skills, mcpServers）建立 items 列表
      const items = [
        ...agentItems,
        ...(data.commands || []).map((p) => ({ kind: "prompt", path: p })),
        ...(data.skills || []).map((p) => ({ kind: "skill", path: p })),
        ...extensionItems,
        ...mcpItems,
      ].map((item) => resolvePluginItem(item, resourceIndex));

      const tags = data.keywords || data.tags || [];
      const pluginName = data.name || dir.name;

      const readmePath = path.join(pluginDir, "README.md");
      const readmeFile = fs.existsSync(readmePath)
        ? `${relPath}/README.md`
        : null;

      plugins.push({
        id: dir.name,
        name: pluginName,
        description: data.description || "",
        path: relPath,
        readmeFile,
        version: normalizeText(data.version, null),
        tags: tags,
        itemCount: items.length,
        items: items,
        lastUpdated: getDirectoryLastUpdated(gitDates, relPath),
        searchText: `${pluginName} ${data.description || ""}
          ${tags.join(" ")}`.toLowerCase(),
      });
      extensionEntriesByName.delete(pluginName);
    } catch (e) {
      console.warn(`解析 plugin ${dir.name} 失敗：${e.message}`);
    }
  }

  for (const extensionPlugin of extensionEntriesByName.values()) {
    plugins.push(extensionPlugin);
  }

  // 從 plugins/external.json 載入外部 plugins
  const externalJsonPath = path.join(PLUGINS_DIR, "external.json");
  if (fs.existsSync(externalJsonPath)) {
    try {
      const externalPlugins = JSON.parse(
        fs.readFileSync(externalJsonPath, "utf-8")
      );
      if (Array.isArray(externalPlugins)) {
        let addedCount = 0;
        for (const ext of externalPlugins) {
          if (!ext.name || !ext.description) {
            console.warn(
              `跳過缺少 name/description 的外部 plugin`
            );
            continue;
          }

          // 若本地已有同名 plugin，則跳過
          if (plugins.some((p) => p.id === ext.name)) {
            console.warn(
              `跳過外部 plugin "${ext.name}" — 本地已存在同名 plugin`
            );
            continue;
          }

          const tags = ext.keywords || ext.tags || [];

          plugins.push({
            id: ext.name,
            name: ext.name,
            description: ext.description || "",
            path: `plugins/${ext.name}`,
            version: normalizeText(ext.version, null),
            tags: tags,
            itemCount: 0,
            items: [],
            external: true,
            repository: ext.repository || null,
            homepage: ext.homepage || null,
            author: ext.author || null,
            license: ext.license || null,
            source: ext.source || null,
            lastUpdated: null,
            searchText: `${ext.name} ${ext.description || ""} ${tags.join(
              " "
            )} ${ext.author?.name || ""} ${ext.repository || ""}`.toLowerCase(),
          });
          addedCount++;
        }
        console.log(
          `  ✓ 已載入 ${addedCount} 個外部 plugin`
        );
      }
    } catch (e) {
      console.warn(`解析 external plugins 失敗：${e.message}`);
    }
  }

  // 蒐集所有唯一 tags
  const allTags = [...new Set(plugins.flatMap((p) => p.tags))].sort();

  const sortedPlugins = plugins.sort((a, b) => a.name.localeCompare(b.name));

  return {
    items: sortedPlugins,
    filters: { tags: allTags },
  };
}

/**
 * 產生 Canvas extensions metadata
 */
function getImageMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeByExtension = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return mimeByExtension[extension] || "application/octet-stream";
}

function resolveImageUrl(value, ref) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }
  const repoPath = normalized.replace(/\\/g, "/").replace(/^\/+/, "");
  return buildRepoImageUrl(repoPath, ref);
}

function getImageAssetFiles(extensionDir) {
  const assetDir = path.join(extensionDir, "assets");

  if (!fs.existsSync(assetDir)) {
    return [];
  }

  const imageExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
  ]);

  return fs
    .readdirSync(assetDir)
    .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function pickAssetFile(files, preferredNames) {
  const preferredLookup = new Set(preferredNames.map((name) => name.toLowerCase()));
  for (const file of files) {
    if (preferredLookup.has(file.toLowerCase())) {
      return file;
    }
  }
  return files[0] || null;
}

function getExtensionAssetInfo(extensionDir, relPath, ref) {
  const files = getImageAssetFiles(extensionDir);

  if (files.length === 0) {
    return null;
  }

  const iconAsset = pickAssetFile(files, [
    "icon.png",
    "icon.jpg",
    "icon.jpeg",
    "icon.webp",
    "icon.gif",
    "preview.png",
    "preview.jpg",
    "preview.jpeg",
    "preview.webp",
    "preview.gif",
    "screenshot.png",
    "screenshot.jpg",
    "screenshot.jpeg",
    "screenshot.webp",
    "screenshot.gif",
    "image.png",
    "image.jpg",
    "image.jpeg",
    "image.webp",
    "image.gif",
  ]);
  const galleryAsset = pickAssetFile(files, [
    "gallery.png",
    "gallery.jpg",
    "gallery.jpeg",
    "gallery.webp",
    "gallery.gif",
    "preview.png",
    "preview.jpg",
    "preview.jpeg",
    "preview.webp",
    "preview.gif",
    "screenshot.png",
    "screenshot.jpg",
    "screenshot.jpeg",
    "screenshot.webp",
    "screenshot.gif",
    "image.png",
    "image.jpg",
    "image.jpeg",
    "image.webp",
    "image.gif",
  ]);

  const iconFile = iconAsset || galleryAsset;
  const galleryFile = galleryAsset || iconAsset;
  const iconPath = iconFile ? `${relPath}/assets/${iconFile}` : null;
  const galleryPath = galleryFile ? `${relPath}/assets/${galleryFile}` : null;

  return {
    screenshots: {
      icon: iconPath
        ? {
          path: iconPath,
          type: getImageMimeType(iconPath),
        }
        : null,
      gallery: galleryPath
        ? {
          path: galleryPath,
          type: getImageMimeType(galleryPath),
        }
        : null,
    },
    assetPath: iconPath,
    imageUrl: iconPath ? buildRepoImageUrl(iconPath, ref) : null,
  };
}

function buildRepoImageUrl(assetPath, ref) {
  const encodedAssetPath = assetPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://raw.githubusercontent.com/github/awesome-copilot/${ref}/${encodedAssetPath}`;
}

function extractCanvasMetadataFromSource(source) {
  const constants = new Map();
  const constantPattern =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`([^`$]*)`)\s*;/g;
  let constantMatch = constantPattern.exec(source);
  while (constantMatch) {
    const key = constantMatch[1];
    const value = constantMatch[2] ?? constantMatch[3] ?? constantMatch[4] ?? "";
    constants.set(key, value.replace(/\\n/g, "\n").trim());
    constantMatch = constantPattern.exec(source);
  }

  function resolveExpression(expr) {
    const trimmed = normalizeText(expr);
    if (!trimmed) return null;
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
    }
    if (trimmed.startsWith("`") && trimmed.endsWith("`") && !trimmed.includes("${")) {
      return trimmed.slice(1, -1);
    }
    return constants.get(trimmed) || null;
  }

  function findMatchingBrace(startIndex) {
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let escaped = false;
    for (let i = startIndex; i < source.length; i++) {
      const char = source[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (!inDouble && !inTemplate && char === "'" && !inSingle) {
        inSingle = true;
        continue;
      }
      if (inSingle && char === "'") {
        inSingle = false;
        continue;
      }
      if (!inSingle && !inTemplate && char === '"' && !inDouble) {
        inDouble = true;
        continue;
      }
      if (inDouble && char === '"') {
        inDouble = false;
        continue;
      }
      if (!inSingle && !inDouble && char === "`" && !inTemplate) {
        inTemplate = true;
        continue;
      }
      if (inTemplate && char === "`") {
        inTemplate = false;
        continue;
      }
      if (inSingle || inDouble || inTemplate) {
        continue;
      }
      if (char === "{") depth++;
      if (char === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  function readProp(head, key) {
    const pattern = new RegExp(`\\b${key}\\s*:\\s*([^,\\n]+)`);
    const match = pattern.exec(head);
    return resolveExpression(match?.[1]);
  }

  const canvases = [];
  let cursor = 0;
  while (cursor < source.length) {
    const createCanvasIndex = source.indexOf("createCanvas(", cursor);
    if (createCanvasIndex === -1) {
      break;
    }
    const objectStart = source.indexOf("{", createCanvasIndex);
    if (objectStart === -1) {
      break;
    }
    const objectEnd = findMatchingBrace(objectStart);
    if (objectEnd === -1) {
      break;
    }
    const objectContent = source.slice(objectStart + 1, objectEnd);
    const header = objectContent.slice(0, 1400);
    const id = readProp(header, "id");
    const displayName = readProp(header, "displayName");
    const description = readProp(header, "description");
    if (id || displayName || description) {
      canvases.push({
        id: id || null,
        displayName: displayName || null,
        description: description || null,
      });
    }
    cursor = objectEnd + 1;
  }

  return canvases;
}

function getExtensionCanvasFiles(extensionDir) {
  const queue = [extensionDir];
  const files = [];
  while (queue.length > 0) {
    const currentDir = queue.shift();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
        files.push(absolutePath);
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function normalizeExternalScreenshotRole(value, ref) {
  if (!value) return null;
  if (typeof value === "string") {
    const type = getImageMimeType(value);
    return {
      path: value.replace(/\\/g, "/"),
      type,
      imageUrl: resolveImageUrl(value, ref),
    };
  }
  const pathValue = normalizeText(value.path);
  const urlValue = normalizeText(value.url);
  if (!pathValue && !urlValue) return null;
  const imagePath = pathValue ? pathValue.replace(/\\/g, "/") : null;
  const type = normalizeText(value.type) || getImageMimeType(imagePath || urlValue);
  const imageUrl = resolveImageUrl(urlValue || imagePath, ref);
  return {
    path: imagePath,
    type,
    imageUrl,
  };
}

function normalizeExtensionScreenshotRole(value, relPath, ref) {
  if (!value) return null;
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) {
      return {
        path: null,
        type: getImageMimeType(value),
        imageUrl: value,
      };
    }

    const normalized = value.replace(/\\/g, "/").replace(/^\.\/+/, "");
    const repoPath = normalized.startsWith(`${relPath}/`) ? normalized : `${relPath}/${normalized}`;
    return {
      path: repoPath,
      type: getImageMimeType(repoPath),
      imageUrl: buildRepoImageUrl(repoPath, ref),
    };
  }

  const pathValue = normalizeText(value.path);
  const urlValue = normalizeText(value.url);
  if (!pathValue && !urlValue) return null;
  const pathEntry = pathValue
    ? normalizeExtensionScreenshotRole(pathValue, relPath, ref)
    : null;
  const urlEntry = urlValue
    ? normalizeExtensionScreenshotRole(urlValue, relPath, ref)
    : null;

  return {
    path: pathEntry?.path || null,
    type: normalizeText(value.type) || pathEntry?.type || urlEntry?.type || null,
    imageUrl: urlEntry?.imageUrl || pathEntry?.imageUrl || null,
  };
}

function resolveExtensionScreenshots(pluginJson, extensionDir, relPath, ref) {
  const inferredAssets = getExtensionAssetInfo(extensionDir, relPath, ref);
  const inferredIcon = inferredAssets?.screenshots?.icon
    ? {
      path: inferredAssets.screenshots.icon.path,
      type: inferredAssets.screenshots.icon.type,
      imageUrl: inferredAssets.screenshots.icon.path
        ? buildRepoImageUrl(inferredAssets.screenshots.icon.path, ref)
        : null,
    }
    : null;
  const inferredGallery = inferredAssets?.screenshots?.gallery
    ? {
      path: inferredAssets.screenshots.gallery.path,
      type: inferredAssets.screenshots.gallery.type,
      imageUrl: inferredAssets.screenshots.gallery.path
        ? buildRepoImageUrl(inferredAssets.screenshots.gallery.path, ref)
        : null,
    }
    : null;

  const logoEntry = normalizeExtensionScreenshotRole(pluginJson?.logo, relPath, ref);
  const screenshotConfig = pluginJson?.["x-awesome-copilot"]?.screenshots || {};
  const iconEntry = normalizeExtensionScreenshotRole(screenshotConfig.icon, relPath, ref);
  const galleryRaw = screenshotConfig.gallery;
  const firstGalleryEntry = Array.isArray(galleryRaw) ? galleryRaw[0] : galleryRaw;
  const galleryEntry = normalizeExtensionScreenshotRole(firstGalleryEntry, relPath, ref);

  const finalIcon = iconEntry || logoEntry || inferredIcon;
  const finalGallery = galleryEntry || logoEntry || inferredGallery || finalIcon;

  return {
    screenshots: {
      icon: finalIcon
        ? {
          path: finalIcon.path,
          type: finalIcon.type,
        }
        : null,
      gallery: finalGallery
        ? {
          path: finalGallery.path,
          type: finalGallery.type,
        }
        : null,
    },
    assetPath: finalIcon?.path || inferredAssets?.assetPath || null,
    imageUrl: finalIcon?.imageUrl || inferredAssets?.imageUrl || null,
  };
}

function generateCanvasManifest(gitDates, commitSha) {
  const items = [];

  if (!fs.existsSync(EXTENSIONS_DIR)) {
    return { items: [], filters: { keywords: [] } };
  }

  const extensionDirs = fs
    .readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      const extensionEntryPoint = path.join(
        EXTENSIONS_DIR,
        entry.name,
        "extension.mjs"
      );
      return fs.existsSync(extensionEntryPoint);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const dir of extensionDirs) {
    const relPath = `extensions/${dir.name}`;
    const extensionDir = path.join(EXTENSIONS_DIR, dir.name);
    const packageJsonPath = path.join(extensionDir, "package.json");
    const packageJson = fs.existsSync(packageJsonPath)
      ? JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
      : {};
    const pluginJsonPath = path.join(extensionDir, ".github", "plugin", "plugin.json");
    const pluginJson = fs.existsSync(pluginJsonPath)
      ? JSON.parse(fs.readFileSync(pluginJsonPath, "utf-8"))
      : {};
    const keywordsSource = Array.isArray(pluginJson.keywords)
      ? pluginJson.keywords
      : Array.isArray(packageJson.keywords)
        ? packageJson.keywords
        : [];
    const keywords = [...new Set(
      keywordsSource
        .filter((keyword) => typeof keyword === "string")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
    const extensionDescription = normalizeText(
      pluginJson.description,
      normalizeText(packageJson.description, "Canvas extension")
    );
    const extensionName = normalizeText(pluginJson.name, normalizeText(packageJson.name, dir.name));
    const extensionVersion = normalizeText(pluginJson.version, normalizeText(packageJson.version, "1.0.0"));
    const readmeFile = fs.existsSync(path.join(extensionDir, "README.md"))
      ? `${relPath}/README.md`
      : null;
    const screenshots = resolveExtensionScreenshots(pluginJson, extensionDir, relPath, commitSha);
    const canvasFiles = getExtensionCanvasFiles(extensionDir);
    const canvases = [];
    for (const canvasFile of canvasFiles) {
      const source = fs.readFileSync(canvasFile, "utf-8");
      canvases.push(...extractCanvasMetadataFromSource(source));
    }
    const canvasEntries = canvases.length > 0
      ? canvases
      : [{ id: dir.name, displayName: formatDisplayName(dir.name), description: extensionDescription }];
    const installUrl = `https://github.com/github/awesome-copilot/tree/main/${relPath.replace(
      /\\/g,
      "/"
    )}`;
    const installCommand = `copilot plugin install ${extensionName}@awesome-copilot`;

    for (const canvas of canvasEntries) {
      const canvasId = normalizeText(canvas.id, dir.name);
      const canvasName = normalizeText(canvas.displayName, formatDisplayName(canvasId));
      const canvasDescription = normalizeText(extensionDescription, canvas.description);
      items.push({
        id: canvasId,
        canvasId,
        extensionId: dir.name,
        extensionName,
        pluginName: extensionName,
        name: canvasName,
        version: extensionVersion,
        readmeFile,
        description: canvasDescription,
        path: relPath,
        ref: commitSha,
        lastUpdated: getDirectoryLastUpdated(gitDates, relPath),
        screenshots: screenshots?.screenshots || { icon: null, gallery: null },
        imageUrl: screenshots?.imageUrl || null,
        assetPath: screenshots?.assetPath || null,
        installUrl,
        installCommand,
        sourceUrl: null,
        external: false,
        author: normalizeAuthor(pluginJson.author),
        keywords,
      });
    }
  }

  const externalJsonPath = path.join(EXTENSIONS_DIR, "external.json");
  if (fs.existsSync(externalJsonPath)) {
    try {
      const externalExtensions = JSON.parse(
        fs.readFileSync(externalJsonPath, "utf-8")
      );
      if (Array.isArray(externalExtensions)) {
        for (const ext of externalExtensions) {
          const name = normalizeText(ext?.name);
          const installUrl = normalizeText(ext?.installUrl);
          const sourceUrl = normalizeText(ext?.sourceUrl || installUrl);
          if (!name || !installUrl) {
            continue;
          }

          const id = normalizeText(ext?.id || name.toLowerCase().replace(/\s+/g, "-"));
          const keywords = Array.isArray(ext?.keywords)
            ? [...new Set(ext.keywords.filter((keyword) => typeof keyword === "string").map((keyword) => keyword.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
            : Array.isArray(ext?.tags)
              ? [...new Set(ext.tags.filter((keyword) => typeof keyword === "string").map((keyword) => keyword.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
              : [];
          const iconScreenshot =
            normalizeExternalScreenshotRole(ext?.screenshots?.icon, commitSha) ||
            normalizeExternalScreenshotRole(ext?.iconPath, commitSha) ||
            normalizeExternalScreenshotRole(ext?.imagePath, commitSha) ||
            normalizeExternalScreenshotRole(ext?.iconUrl, commitSha) ||
            normalizeExternalScreenshotRole(ext?.imageUrl, commitSha);
          const galleryScreenshot =
            normalizeExternalScreenshotRole(ext?.screenshots?.gallery, commitSha) ||
            normalizeExternalScreenshotRole(ext?.galleryPath, commitSha) ||
            normalizeExternalScreenshotRole(ext?.galleryUrl, commitSha) ||
            iconScreenshot;
          const screenshots = {
            icon: iconScreenshot
              ? {
                path: iconScreenshot.path,
                type: iconScreenshot.type,
              }
              : null,
            gallery: galleryScreenshot
              ? {
                path: galleryScreenshot.path,
                type: galleryScreenshot.type,
              }
              : null,
          };
          const imageUrl = iconScreenshot?.imageUrl || null;
          const assetPath = iconScreenshot?.path || null;
          const canvasId = normalizeText(ext?.canvasId, id);

          items.push({
            id,
            canvasId,
            extensionId: id,
            extensionName: name,
            pluginName: null,
            name,
            version: normalizeText(ext?.version, "1.0.0"),
            readmeFile: null,
            description: normalizeText(ext?.description, "External canvas extension"),
            path: null,
            ref: null,
            lastUpdated: null,
            screenshots,
            imageUrl,
            assetPath,
            installUrl,
            installCommand: null,
            sourceUrl: sourceUrl || null,
            external: true,
            author: normalizeAuthor(ext?.author),
            keywords,
          });
        }
      }
    } catch (e) {
      console.warn(`解析 external extensions 失敗：${e.message}`);
    }
  }

  const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));
  const keywordFilters = [...new Set(sortedItems.flatMap((item) => item.keywords || []))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    items: sortedItems,
    filters: {
      keywords: keywordFilters,
    },
  };
}

function generateExtensionsData(extensionManifestData) {
  if (!extensionManifestData || !Array.isArray(extensionManifestData.items)) {
    return { items: [], filters: { keywords: [] } };
  }

  const items = extensionManifestData.items.map((item) => ({
    ...item,
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    screenshots: item.screenshots || { icon: null, gallery: null },
  }));
  const filters = {
    keywords: [...new Set(items.flatMap((item) => item.keywords))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  };

  return { items, filters };
}

/**
 * 產生綜合搜尋索引
 */
function generateSearchIndex(
  agents,
  instructions,
  skills,
  plugins
) {
  const index = [];

  for (const agent of agents) {
    index.push({
      type: "agent",
      id: agent.id,
      title: agent.title,
      description: agent.description,
      path: agent.path,
      lastUpdated: agent.lastUpdated,
      searchText: `${agent.title} ${agent.description} ${agent.tools.join(
        " "
      )}`.toLowerCase(),
    });
  }

  for (const instruction of instructions) {
    index.push({
      type: "instruction",
      id: instruction.id,
      title: instruction.title,
      description: instruction.description,
      path: instruction.path,
      lastUpdated: instruction.lastUpdated,
      searchText: `${instruction.title} ${instruction.description} ${instruction.applyTo || ""}`.toLowerCase(),
    });
  }

  for (const skill of skills) {
    index.push({
      type: "skill",
      id: skill.id,
      title: skill.title,
      description: skill.description,
      path: skill.skillFile,
      lastUpdated: skill.lastUpdated,
      searchText: skill.searchText,
    });
  }

  for (const plugin of plugins) {
    index.push({
      type: "plugin",
      id: plugin.id,
      title: plugin.name,
      description: plugin.description,
      path: plugin.path,
      tags: plugin.tags,
      lastUpdated: plugin.lastUpdated,
      searchText: plugin.searchText,
    });
  }

  return index;
}

/**
 * 從 cookbook.yml 產生 samples/cookbook 資料
 */
function generateSamplesData() {
  const cookbookYamlPath = path.join(COOKBOOK_DIR, "cookbook.yml");

  if (!fs.existsSync(cookbookYamlPath)) {
    console.warn(
      "警告：找不到 cookbook/cookbook.yml，跳過 samples 產生"
    );
    return {
      cookbooks: [],
      totalRecipes: 0,
      totalCookbooks: 0,
      filters: { languages: [], tags: [] },
    };
  }

  const cookbookManifest = parseYamlFile(cookbookYamlPath);
  if (!cookbookManifest || !cookbookManifest.cookbooks) {
    console.warn("警告：cookbook.yml 格式不正確");
    return {
      cookbooks: [],
      totalRecipes: 0,
      totalCookbooks: 0,
      filters: { languages: [], tags: [] },
    };
  }

  const allLanguages = new Set();
  const allTags = new Set();
  let totalRecipes = 0;

  // 第一遍：蒐集所有 cookbook 中已知的 language IDs
  cookbookManifest.cookbooks.forEach((cookbook) => {
    cookbook.languages.forEach((lang) => allLanguages.add(lang.id));
  });

  const cookbooks = cookbookManifest.cookbooks.map((cookbook) => {

    // 處理 recipes 並加入檔案路徑
    const recipes = cookbook.recipes.map((recipe) => {
      // 收集 tags
      if (recipe.tags) {
        recipe.tags.forEach((tag) => allTags.add(tag));
      }

      totalRecipes++;

      // external recipe 連到外部 URL — 跳過本地檔案解析
      if (recipe.external) {
        if (recipe.url) {
          try {
            new URL(recipe.url);
          } catch {
            console.warn(`警告：外部 recipe "${recipe.id}" 的 URL 無效： ${recipe.url}`);
          }
        } else {
          console.warn(`警告：外部 recipe "${recipe.id}" 缺少 url`);
        }

        // 從 tags 推導語言（符合已知 language IDs）
        const recipeLanguages = (recipe.tags || []).filter((tag) => allLanguages.has(tag));

        return {
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          tags: recipe.tags || [],
          languages: recipeLanguages,
          external: true,
          url: recipe.url || null,
          author: recipe.author || null,
          variants: {},
        };
      }

      // 為每種語言建立 variants 的檔案路徑
      const variants = {};
      cookbook.languages.forEach((lang) => {
        const docPath = `${cookbook.path}/${lang.id}/${recipe.id}.md`;
        const examplePath = `${cookbook.path}/${lang.id}/recipe/${recipe.id}${lang.extension}`;

        // 檢查檔案是否存在
        const docFullPath = path.join(ROOT_FOLDER, docPath);
        const exampleFullPath = path.join(ROOT_FOLDER, examplePath);

        if (fs.existsSync(docFullPath)) {
          variants[lang.id] = {
            doc: docPath,
            example: fs.existsSync(exampleFullPath) ? examplePath : null,
          };
        }
      });

      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        tags: recipe.tags || [],
        languages: Object.keys(variants),
        variants,
      };
    });

    return {
      id: cookbook.id,
      name: cookbook.name,
      description: cookbook.description,
      path: cookbook.path,
      featured: cookbook.featured || false,
      languages: cookbook.languages,
      recipes,
    };
  });

  return {
    cookbooks,
    totalRecipes,
    totalCookbooks: cookbooks.length,
    filters: {
      languages: Array.from(allLanguages).sort(),
      tags: Array.from(allTags).sort(),
    },
  };
}

/**
 * 主流程
 */
async function main() {
  console.log("產生網站資料中...\n");

  ensureDataDir();

  // 載入 git 日期以取得最後更新時間（一次效率較高的 git 指令）
  console.log("載入 git 歷史以取得最後更新日期...");
  const gitDates = getGitFileDates(
    [
      "agents/",
      "instructions/",
      "skills/",
      "extensions/",
      "plugins/",
    ],
    ROOT_FOLDER
  );
  console.log(`✓ 已載入 ${gitDates.size} 個檔案的日期\n`);

  // 產生所有資料
  const commitSha = getCurrentCommitSha();

  const agentsData = generateAgentsData(gitDates);
  const agents = agentsData.items;
  console.log(
    `✓ 已產生 ${agents.length} 個 agents（${agentsData.filters.models.length} 種 model, ${agentsData.filters.tools.length} 種工具）`
  );

  const instructionsData = generateInstructionsData(gitDates);
  const instructions = instructionsData.items;
  console.log(
    `✓ 已產生 ${instructions.length} 個 instructions（${instructionsData.filters.extensions.length} 種 extension）`
  );

  const skillsData = generateSkillsData(gitDates);
  const skills = skillsData.items;
  console.log(`✓ 已產生 ${skills.length} 個 skills`);

  const extensionManifestData = generateCanvasManifest(gitDates, commitSha);
  const extensionsData = generateExtensionsData(extensionManifestData);
  const extensions = extensionsData.items;
  console.log(
    `✓ 已產生 ${extensions.length} 個 extensions（${extensionsData.filters.keywords.length} 個關鍵字）`
  );

  const resourceIndex = buildResourceIndex({
    agents,
    skills,
    instructions,
    extensions,
  });
  const pluginsData = generatePluginsData(gitDates, resourceIndex);
  const plugins = pluginsData.items;
  console.log(
    `✓ 已產生 ${plugins.length} 個 plugins（${pluginsData.filters.tags.length} 個標籤）`
  );

  const samplesData = generateSamplesData();
  console.log(
    `✓ 已產生 ${samplesData.totalRecipes} 個 recipe，來自 ${samplesData.totalCookbooks} 個 cookbook（${samplesData.filters.languages.length} 種語言，${samplesData.filters.tags.length} 種標籤）`
  );

  // 從 .all-contributorsrc 計算貢獻者數量作為 manifest 統計
  const contributorsRcPath = path.join(ROOT_FOLDER, ".all-contributorsrc");
  const contributorCount = fs.existsSync(contributorsRcPath)
    ? (JSON.parse(fs.readFileSync(contributorsRcPath, "utf-8")).contributors || []).length
    : 0;

  const searchIndex = generateSearchIndex(
    agents,
    instructions,
    skills,
    plugins
  );
  console.log(`✓ 已產生搜尋索引，共 ${searchIndex.length} 項`);

  // 寫入 JSON 檔案
  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "agents.json"),
    JSON.stringify(agentsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "instructions.json"),
    JSON.stringify(instructionsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "skills.json"),
    JSON.stringify(skillsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "plugins.json"),
    JSON.stringify(pluginsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "extensions.json"),
    JSON.stringify(extensionsData, null, 2)
  );


  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "samples.json"),
    JSON.stringify(samplesData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "search-index.json"),
    JSON.stringify(searchIndex, null, 2)
  );

  // 產生含統計與時間戳的 manifest
  const manifest = {
    generated: new Date().toISOString(),
    counts: {
      agents: agents.length,
      instructions: instructions.length,
      skills: skills.length,
      plugins: plugins.length,
      extensions: extensions.length,
      contributors: contributorCount,
      samples: samplesData.totalRecipes,
      total: searchIndex.length,
    },
  };

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n✓ 所有資料已寫入 website/public/data/`);
}

main().catch((err) => {
  console.error("產生網站資料時發生錯誤：", err);
  process.exit(1);
});
