#!/usr/bin/env node

/**
 * 為 GitHub Pages 網站產生 JSON Metadata 檔案。
 * 此指令碼從代理 (agents)、提示 (prompts)、指令 (instructions)、技能 (skills) 和集合 (collections) 中擷取 Metadata
 * 並將其寫入 website/data/ 以供用戶端進行搜尋和顯示。
 */

import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {
  AGENTS_DIR,
  COLLECTIONS_DIR,
  COOKBOOK_DIR,
  INSTRUCTIONS_DIR,
  PROMPTS_DIR,
  ROOT_FOLDER,
  SKILLS_DIR,
} from "./constants.mjs";
import {
  parseCollectionYaml,
  parseFrontmatter,
  parseSkillMetadata,
  parseYamlFile,
} from "./yaml-parser.mjs";
import { getGitFileDates } from "./utils/git-dates.mjs";

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
 * 從檔名或 Frontmatter 中擷取標題
 */
function extractTitle(filePath, frontmatter) {
  if (frontmatter?.title) return frontmatter.title;
  if (frontmatter?.name) {
    return frontmatter.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  // 退回使用檔名 (Fallback to filename)
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
 * 產生代理 (agents) Metadata
 */
function generateAgentsData(gitDates) {
  const agents = [];
  const files = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".agent.md"));

  // 追蹤所有不重複的值以用於篩選器
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

    // 追蹤不重複的值
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

  // 排序並連同篩選器 Metadata 一併回傳
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
 * 產生提示 (prompts) Metadata
 */
function generatePromptsData(gitDates) {
  const prompts = [];
  const files = fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith(".prompt.md"));

  // 追蹤所有不重複的工具以用於篩選器
  const allTools = new Set();

  for (const file of files) {
    const filePath = path.join(PROMPTS_DIR, file);
    const frontmatter = parseFrontmatter(filePath);
    const relativePath = path
      .relative(ROOT_FOLDER, filePath)
      .replace(/\\/g, "/");

    const tools = frontmatter?.tools || [];
    tools.forEach((t) => allTools.add(t));

    prompts.push({
      id: file.replace(".prompt.md", ""),
      title: extractTitle(filePath, frontmatter),
      description: frontmatter?.description || "",
      agent: frontmatter?.agent || null,
      model: frontmatter?.model || null,
      tools: tools,
      path: relativePath,
      filename: file,
      lastUpdated: gitDates.get(relativePath) || null,
    });
  }

  const sortedPrompts = prompts.sort((a, b) => a.title.localeCompare(b.title));

  return {
    items: sortedPrompts,
    filters: {
      tools: Array.from(allTools).sort(),
    },
  };
}

/**
 * 將 applyTo 欄位剖析為模式陣列
 */
function parseApplyToPatterns(applyTo) {
  if (!applyTo) return [];

  // 處理陣列格式
  if (Array.isArray(applyTo)) {
    return applyTo.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  // 處理字串格式 (以逗號分隔)
  if (typeof applyTo === "string") {
    return applyTo
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  return [];
}

/**
 * 從 Glob 模式中擷取副檔名
 */
function extractExtensionFromPattern(pattern) {
  // 匹配像是 **.ts, **/*.js, *.py 等模式
  const match = pattern.match(/\*\*?\.(\w+)$/);
  if (match) return `.${match[1]}`;

  // 匹配像是 **/*.{ts,tsx} 的模式
  const braceMatch = pattern.match(/\*\*?\/\*\.\{([^}]+)\}\*?$/);
  if (braceMatch) {
    return braceMatch[1].split(",").map((ext) => `.${ext.trim()}`);
  }

  return null;
}

/**
 * 產生指令 (instructions) Metadata
 */
function generateInstructionsData(gitDates) {
  const instructions = [];
  const files = fs
    .readdirSync(INSTRUCTIONS_DIR)
    .filter((f) => f.endsWith(".instructions.md"));

  // 追蹤所有不重複的模式和副檔名以用於篩選器
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

    // 從模式中擷取副檔名
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
 * 根據技能名稱和說明對技能進行分類
 */
function categorizeSkill(name, description) {
  const text = `${name} ${description}`.toLowerCase();

  if (text.includes("azure") || text.includes("appinsights")) return "Azure";
  if (
    text.includes("github") ||
    text.includes("gh-cli") ||
    text.includes("git-commit") ||
    text.includes("git ")
  )
    return "Git & GitHub";
  if (text.includes("vscode") || text.includes("vs code")) return "VS Code";
  if (
    text.includes("test") ||
    text.includes("qa") ||
    text.includes("playwright")
  )
    return "Testing";
  if (
    text.includes("microsoft") ||
    text.includes("m365") ||
    text.includes("workiq")
  )
    return "Microsoft";
  if (text.includes("cli") || text.includes("command")) return "CLI Tools";
  if (
    text.includes("diagram") ||
    text.includes("plantuml") ||
    text.includes("visual")
  )
    return "Diagrams";
  if (
    text.includes("nuget") ||
    text.includes("dotnet") ||
    text.includes(".net")
  )
    return ".NET";

  return "Other";
}

/**
 * 產生技能 (skills) Metadata
 */
function generateSkillsData(gitDates) {
  const skills = [];

  if (!fs.existsSync(SKILLS_DIR)) {
    return { items: [], filters: { categories: [], hasAssets: ["Yes", "No"] } };
  }

  const folders = fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => fs.statSync(path.join(SKILLS_DIR, f)).isDirectory());

  const allCategories = new Set();

  for (const folder of folders) {
    const skillPath = path.join(SKILLS_DIR, folder);
    const metadata = parseSkillMetadata(skillPath);

    if (metadata) {
      const relativePath = path
        .relative(ROOT_FOLDER, skillPath)
        .replace(/\\/g, "/");
      const category = categorizeSkill(metadata.name, metadata.description);
      allCategories.add(category);

      // 遞迴取得技能資料夾中的所有檔案
      const files = getSkillFiles(skillPath, relativePath);

      // 從 SKILL.md 檔案取得最後更新時間
      const skillFilePath = `${relativePath}/SKILL.md`;

      skills.push({
        id: folder,
        name: metadata.name,
        title: metadata.name
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        description: metadata.description,
        assets: metadata.assets,
        hasAssets: metadata.assets.length > 0,
        assetCount: metadata.assets.length,
        category: category,
        path: relativePath,
        skillFile: skillFilePath,
        files: files,
        lastUpdated: gitDates.get(skillFilePath) || null,
      });
    }
  }

  const sortedSkills = skills.sort((a, b) => a.title.localeCompare(b.title));

  return {
    items: sortedSkills,
    filters: {
      categories: Array.from(allCategories).sort(),
      hasAssets: ["Yes", "No"],
    },
  };
}

/**
 * 遞迴取得技能資料夾中的所有檔案
 */
function getSkillFiles(skillPath, relativePath) {
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
 * 產生集合 (collections) Metadata
 */
function generateCollectionsData(gitDates) {
  const collections = [];

  if (!fs.existsSync(COLLECTIONS_DIR)) {
    return collections;
  }

  const files = fs
    .readdirSync(COLLECTIONS_DIR)
    .filter((f) => f.endsWith(".collection.yml"));

  // 追蹤所有不重複的標籤
  const allTags = new Set();

  for (const file of files) {
    const filePath = path.join(COLLECTIONS_DIR, file);
    const data = parseCollectionYaml(filePath);
    const relativePath = path
      .relative(ROOT_FOLDER, filePath)
      .replace(/\\/g, "/");

    if (data) {
      const tags = data.tags || [];
      tags.forEach((t) => allTags.add(t));

      // 特色項目 (featured) 可能在頂層或巢狀於 display 下
      const featured = data.featured || data.display?.featured || false;

      collections.push({
        id: file.replace(".collection.yml", ""),
        name: data.name || file.replace(".collection.yml", ""),
        description: data.description || "",
        tags: tags,
        featured: featured,
        items: (data.items || []).map((item) => ({
          path: item.path,
          kind: item.kind,
          usage: item.usage || null,
        })),
        path: relativePath,
        filename: file,
        lastUpdated: gitDates.get(relativePath) || null,
      });
    }
  }

  // 以特色項目優先排序，然後按字母順序排序
  const sortedCollections = collections.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    items: sortedCollections,
    filters: {
      tags: Array.from(allTags).sort(),
    },
  };
}

/**
 * 從 website/data/tools.yml 產生工具 (tools) Metadata
 */
function generateToolsData() {
  const toolsFile = path.join(WEBSITE_SOURCE_DATA_DIR, "tools.yml");

  if (!fs.existsSync(toolsFile)) {
    console.warn("在以下路徑找不到 tools.yml 檔案：", toolsFile);
    return { items: [], filters: { categories: [], tags: [] } };
  }

  const data = parseYamlFile(toolsFile);

  if (!data || !data.tools) {
    return { items: [], filters: { categories: [], tags: [] } };
  }

  const allCategories = new Set();
  const allTags = new Set();

  const tools = data.tools.map((tool) => {
    const category = tool.category || "Other";
    allCategories.add(category);

    const tags = tool.tags || [];
    tags.forEach((t) => allTags.add(t));

    return {
      id: tool.id,
      name: tool.name,
      description: tool.description || "",
      category: category,
      featured: tool.featured || false,
      requirements: tool.requirements || [],
      features: tool.features || [],
      links: tool.links || {},
      configuration: tool.configuration || null,
      tags: tags,
    };
  });

  // 以特色項目優先排序，然後按字母順序排序
  const sortedTools = tools.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    items: sortedTools,
    filters: {
      categories: Array.from(allCategories).sort(),
      tags: Array.from(allTags).sort(),
    },
  };
}

/**
 * 產生組合的搜尋索引
 */
function generateSearchIndex(
  agents,
  prompts,
  instructions,
  skills,
  collections
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

  for (const prompt of prompts) {
    index.push({
      type: "prompt",
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      path: prompt.path,
      lastUpdated: prompt.lastUpdated,
      searchText: `${prompt.title} ${prompt.description}`.toLowerCase(),
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
      searchText: `${instruction.title} ${instruction.description} ${
        instruction.applyTo || ""
      }`.toLowerCase(),
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
      searchText: `${skill.title} ${skill.description}`.toLowerCase(),
    });
  }

  for (const collection of collections) {
    index.push({
      type: "collection",
      id: collection.id,
      title: collection.name,
      description: collection.description,
      path: collection.path,
      tags: collection.tags,
      lastUpdated: collection.lastUpdated,
      searchText: `${collection.name} ${
        collection.description
      } ${collection.tags.join(" ")}`.toLowerCase(),
    });
  }

  return index;
}

/**
 * 從 cookbook.yml 產生範例 (samples)/操作手冊 (cookbook) 資料
 */
function generateSamplesData() {
  const cookbookYamlPath = path.join(COOKBOOK_DIR, "cookbook.yml");

  if (!fs.existsSync(cookbookYamlPath)) {
    console.warn(
      "警告：找不到 cookbook/cookbook.yml，略過範例產生作業"
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
    console.warn("警告：無效的 cookbook.yml 格式");
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

  const cookbooks = cookbookManifest.cookbooks.map((cookbook) => {
    // 收集語言
    cookbook.languages.forEach((lang) => allLanguages.add(lang.id));

    // 處理食譜並加入檔案路徑
    const recipes = cookbook.recipes.map((recipe) => {
      // 收集標籤
      if (recipe.tags) {
        recipe.tags.forEach((tag) => allTags.add(tag));
      }

      // 為每種語言建構包含檔案路徑的變體 (variants)
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

      totalRecipes++;

      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        tags: recipe.tags || [],
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
 * 主函式
 */
async function main() {
  console.log("正在產生網站資料...\n");

  ensureDataDir();

  // 載入所有資源檔案的 Git 日期（使用單一高效率的 git 命令）
  console.log("載入 Git 紀錄以取得檔案最後更新時間...");
  const gitDates = getGitFileDates(
    ["agents/", "prompts/", "instructions/", "skills/", "collections/"],
    ROOT_FOLDER
  );
  console.log(`✓ 已載入 ${gitDates.size} 個檔案的日期紀錄\n`);

  // 產生所有資料
  const agentsData = generateAgentsData(gitDates);
  const agents = agentsData.items;
  console.log(
    `✓ 已產生 ${agents.length} 個代理 (${agentsData.filters.models.length} 個模型，${agentsData.filters.tools.length} 個工具)`
  );

  const promptsData = generatePromptsData(gitDates);
  const prompts = promptsData.items;
  console.log(
    `✓ 已產生 ${prompts.length} 個提示 (${promptsData.filters.tools.length} 個工具)`
  );

  const instructionsData = generateInstructionsData(gitDates);
  const instructions = instructionsData.items;
  console.log(
    `✓ 已產生 ${instructions.length} 個指令 (${instructionsData.filters.extensions.length} 個副檔名)`
  );

  const skillsData = generateSkillsData(gitDates);
  const skills = skillsData.items;
  console.log(
    `✓ 已產生 ${skills.length} 個技能 (${skillsData.filters.categories.length} 個類別)`
  );

  const collectionsData = generateCollectionsData(gitDates);
  const collections = collectionsData.items;
  console.log(
    `✓ 已產生 ${collections.length} 個集合 (${collectionsData.filters.tags.length} 個標籤)`
  );

  const toolsData = generateToolsData();
  const tools = toolsData.items;
  console.log(
    `✓ 已產生 ${tools.length} 個工具 (${toolsData.filters.categories.length} 個類別)`
  );

  const samplesData = generateSamplesData();
  console.log(
    `✓ 在 ${samplesData.totalCookbooks} 本操作手冊中已產生 ${samplesData.totalRecipes} 個食譜 (${samplesData.filters.languages.length} 種語言，${samplesData.filters.tags.length} 個標籤)`
  );

  const searchIndex = generateSearchIndex(
    agents,
    prompts,
    instructions,
    skills,
    collections
  );
  console.log(`✓ 已產生包含 ${searchIndex.length} 個項目的搜尋索引`);

  // 寫入 JSON 檔案
  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "agents.json"),
    JSON.stringify(agentsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "prompts.json"),
    JSON.stringify(promptsData, null, 2)
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
    path.join(WEBSITE_DATA_DIR, "collections.json"),
    JSON.stringify(collectionsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "tools.json"),
    JSON.stringify(toolsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "samples.json"),
    JSON.stringify(samplesData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "search-index.json"),
    JSON.stringify(searchIndex, null, 2)
  );

  // 產生包含計數和時間戳記的資訊清單 (manifest)
  const manifest = {
    generated: new Date().toISOString(),
    counts: {
      agents: agents.length,
      prompts: prompts.length,
      instructions: instructions.length,
      skills: skills.length,
      collections: collections.length,
      tools: tools.length,
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
