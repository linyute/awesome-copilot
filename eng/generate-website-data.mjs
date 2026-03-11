#!/usr/bin/env node

/**
 * 為 GitHub Pages 網站產生 JSON Metadata 檔案。
 * 此指令碼從代理程式、指引、技能、勾點與外掛程式中提取 Metadata，
 * 並將其寫入 website/data/ 以供用戶端搜尋與顯示。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AGENTS_DIR,
  COOKBOOK_DIR,
  HOOKS_DIR,
  INSTRUCTIONS_DIR,
  PLUGINS_DIR,
  ROOT_FOLDER,
  SKILLS_DIR,
  WORKFLOWS_DIR,
} from "./constants.mjs";
import { getGitFileDates } from "./utils/git-dates.mjs";
import {
  parseFrontmatter,
  parseHookMetadata,
  parseSkillMetadata,
  parseWorkflowMetadata,
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
 * 從檔名或 Front Matter 中提取標題
 */
function extractTitle(filePath, frontmatter) {
  if (frontmatter?.name) {
    return frontmatter.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  // 備用方案：使用檔名
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
 * 產生代理程式 Metadata
 */
function generateAgentsData(gitDates) {
  const agents = [];
  const files = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".agent.md"));

  // 追蹤所有不重複的值以供篩選使用
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

  // 排序並連同篩選 Metadata 一併回傳
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
 * 產生勾點 Metadata (類似技能 - 以資料夾為基礎)
 */
function generateHooksData(gitDates) {
  const hooks = [];

  // 檢查勾點目錄是否存在
  if (!fs.existsSync(HOOKS_DIR)) {
    return {
      items: hooks,
      filters: {
        hooks: [],
        tags: [],
      },
    };
  }

  // 取得所有勾點資料夾 (目錄)
  const hookFolders = fs.readdirSync(HOOKS_DIR).filter((file) => {
    const filePath = path.join(HOOKS_DIR, file);
    return fs.statSync(filePath).isDirectory();
  });

  // 追蹤所有不重複的值以供篩選使用
  const allHookTypes = new Set();
  const allTags = new Set();

  for (const folder of hookFolders) {
    const hookPath = path.join(HOOKS_DIR, folder);
    const metadata = parseHookMetadata(hookPath);
    if (!metadata) continue;

    const relativePath = path
      .relative(ROOT_FOLDER, hookPath)
      .replace(/\\/g, "/");
    const readmeRelativePath = `${relativePath}/README.md`;

    // 追蹤不重複的值
    (metadata.hooks || []).forEach((h) => allHookTypes.add(h));
    (metadata.tags || []).forEach((t) => allTags.add(t));

    hooks.push({
      id: folder,
      title: metadata.name,
      description: metadata.description,
      hooks: metadata.hooks || [],
      tags: metadata.tags || [],
      assets: metadata.assets || [],
      path: relativePath,
      readmeFile: readmeRelativePath,
      lastUpdated: gitDates.get(readmeRelativePath) || null,
    });
  }

  // 排序並連同篩選 Metadata 一併回傳
  const sortedHooks = hooks.sort((a, b) => a.title.localeCompare(b.title));

  return {
    items: sortedHooks,
    filters: {
      hooks: Array.from(allHookTypes).sort(),
      tags: Array.from(allTags).sort(),
    },
  };
}

/**
 * 產生工作流程 Metadata (獨立的 .md 檔案)
 */
function generateWorkflowsData(gitDates) {
  const workflows = [];

  if (!fs.existsSync(WORKFLOWS_DIR)) {
    return {
      items: workflows,
      filters: {
        triggers: [],
      },
    };
  }

  const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter((file) => {
    return file.endsWith(".md") && file !== ".gitkeep";
  });

  const allTriggers = new Set();

  for (const file of workflowFiles) {
    const filePath = path.join(WORKFLOWS_DIR, file);
    const metadata = parseWorkflowMetadata(filePath);
    if (!metadata) continue;

    const relativePath = path
      .relative(ROOT_FOLDER, filePath)
      .replace(/\\/g, "/");

    (metadata.triggers || []).forEach((t) => allTriggers.add(t));

    const id = path.basename(file, ".md");
    workflows.push({
      id,
      title: metadata.name,
      description: metadata.description,
      triggers: metadata.triggers || [],
      path: relativePath,
      lastUpdated: gitDates.get(relativePath) || null,
    });
  }

  const sortedWorkflows = workflows.sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return {
    items: sortedWorkflows,
    filters: {
      triggers: Array.from(allTriggers).sort(),
    },
  };
}

/**
 * 將 applyTo 欄位解析為模式陣列
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
 * 從 glob 模式中提取副檔名
 */
function extractExtensionFromPattern(pattern) {
  // 比對如 **.ts, **/*.js, *.py 等模式
  const match = pattern.match(/\*\.(\w+)$/);
  if (match) return `.${match[1]}`;

  // 比對如 **/*.{ts,tsx} 等模式
  const braceMatch = pattern.match(/\*\.\{([^}]+)\}$/);
  if (braceMatch) {
    return braceMatch[1].split(",").map((ext) => `.${ext.trim()}`);
  }

  return null;
}

/**
 * 產生指引 Metadata
 */
function generateInstructionsData(gitDates) {
  const instructions = [];
  const files = fs
    .readdirSync(INSTRUCTIONS_DIR)
    .filter((f) => f.endsWith(".instructions.md"));

  // 追蹤所有不重複的模式與副檔名以供篩選使用
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

    // 從模式中提取副檔名
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
 * 根據技能名稱與說明進行分類
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
 * 產生技能 Metadata
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

      // 從 SKILL.md 檔案取得最後更新日期
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
 * 產生外掛程式 Metadata
 */
function generatePluginsData(gitDates) {
  const plugins = [];

  if (!fs.existsSync(PLUGINS_DIR)) {
    return { items: [], filters: { tags: [] } };
  }

  const pluginDirs = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of pluginDirs) {
    const pluginDir = path.join(PLUGINS_DIR, dir.name);
    const jsonPath = path.join(pluginDir, ".github/plugin", "plugin.json");

    if (!fs.existsSync(jsonPath)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const relPath = `plugins/${dir.name}`;
      const dates = gitDates[relPath] || gitDates[`${relPath}/`] || {};

      // 根據規格欄位 (agents, commands, skills) 建立項目清單
      const items = [
        ...(data.agents || []).map((p) => ({ kind: "agent", path: p })),
        ...(data.commands || []).map((p) => ({ kind: "prompt", path: p })),
        ...(data.skills || []).map((p) => ({ kind: "skill", path: p })),
      ];

      const tags = data.keywords || data.tags || [];

      plugins.push({
        id: dir.name,
        name: data.name || dir.name,
        description: data.description || "",
        path: relPath,
        tags: tags,
        itemCount: items.length,
        items: items,
        lastUpdated: dates.lastModified || null,
        searchText: `${data.name || dir.name} ${
          data.description || ""
        } ${tags.join(" ")}`.toLowerCase(),
      });
    } catch (e) {
      console.warn(`解析外掛程式 ${dir.name} 失敗：`, e.message);
    }
  }

  // 從 plugins/external.json 載入外部外掛
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
              `跳過缺少名稱或描述的外部外掛`
            );
            continue;
          }

          // Skip if a local plugin with the same name already exists
          if (plugins.some((p) => p.id === ext.name)) {
            console.warn(
              `跳過外部外掛 "${ext.name}" — 本機已存在相同名稱的外掛`
            );
            continue;
          }

          const tags = ext.keywords || ext.tags || [];

          plugins.push({
            id: ext.name,
            name: ext.name,
            description: ext.description || "",
            path: `plugins/${ext.name}`,
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
          `  ✓ 載入 ${addedCount} 個外部外掛`
        );
      }
    } catch (e) {
      console.warn(`解析外部外掛失敗：${e.message}`);
    }
  }

  // 收集所有不重複的標籤
  const allTags = [...new Set(plugins.flatMap((p) => p.tags))].sort();

  const sortedPlugins = plugins.sort((a, b) => a.name.localeCompare(b.name));

  return {
    items: sortedPlugins,
    filters: { tags: allTags },
  };
}

/**
 * 從 website/data/tools.yml 產生工具 Metadata
 */
function generateToolsData() {
  const toolsFile = path.join(WEBSITE_SOURCE_DATA_DIR, "tools.yml");

  if (!fs.existsSync(toolsFile)) {
    console.warn("在以下位置找不到 tools.yml：", toolsFile);
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

  // 先按精選排序，再按字母順序排序
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
 * 產生用於搜尋的組合索引
 */
function generateSearchIndex(
  agents,
  instructions,
  hooks,
  workflows,
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
      searchText: `${instruction.title} ${instruction.description} ${
        instruction.applyTo || ""
      }`.toLowerCase(),
    });
  }

  for (const hook of hooks) {
    index.push({
      type: "hook",
      id: hook.id,
      title: hook.title,
      description: hook.description,
      path: hook.readmeFile,
      lastUpdated: hook.lastUpdated,
      searchText: `${hook.title} ${hook.description} ${hook.hooks.join(
        " "
      )} ${hook.tags.join(" ")}`.toLowerCase(),
    });
  }

  for (const workflow of workflows) {
    index.push({
      type: "workflow",
      id: workflow.id,
      title: workflow.title,
      description: workflow.description,
      path: workflow.path,
      lastUpdated: workflow.lastUpdated,
      searchText: `${workflow.title} ${
        workflow.description
      } ${workflow.triggers.join(" ")}`.toLowerCase(),
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
 * 從 cookbook.yml 產生範例/食譜 (cookbook) 資料
 */
function generateSamplesData() {
  const cookbookYamlPath = path.join(COOKBOOK_DIR, "cookbook.yml");

  if (!fs.existsSync(cookbookYamlPath)) {
    console.warn(
      "警告：找不到 cookbook/cookbook.yml，跳過範例產生"
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

  // 第一輪：收集所有食譜中已知的語言 ID
  cookbookManifest.cookbooks.forEach((cookbook) => {
    cookbook.languages.forEach((lang) => allLanguages.add(lang.id));
  });

  const cookbooks = cookbookManifest.cookbooks.map((cookbook) => {

    // 處理食譜並加入檔案路徑
    const recipes = cookbook.recipes.map((recipe) => {
      // 收集標籤
      if (recipe.tags) {
        recipe.tags.forEach((tag) => allTags.add(tag));
      }

      totalRecipes++;

      // 外部食譜連結至外部 URL — 跳過本地檔案解析
      if (recipe.external) {
        if (recipe.url) {
          try {
            new URL(recipe.url);
          } catch {
            console.warn(`警告：外部食譜「${recipe.id}」具有無效的 URL：${recipe.url}`);
          }
        } else {
          console.warn(`警告：外部食譜「${recipe.id}」缺少 URL`);
        }

        // 從與已知語言 ID 相符的標籤中推導語言
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

      // 為每種語言建立包含檔案路徑的變體 (variants)
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
 * 主函式
 */
async function main() {
  console.log("正在產生網站資料...\n");

  ensureDataDir();

  // 為所有資源檔案載入 Git 日期 (使用單一高效的 Git 命令)
  console.log("正在載入 Git 歷程記錄以獲取最後更新日期...");
  const gitDates = getGitFileDates(
    ["agents/", "instructions/", "hooks/", "workflows/", "skills/", "plugins/"],
    ROOT_FOLDER
  );
  console.log(`✓ 已載入 ${gitDates.size} 個檔案的日期\n`);

  // 產生所有資料
  const agentsData = generateAgentsData(gitDates);
  const agents = agentsData.items;
  console.log(
    `✓ 已產生 ${agents.length} 個代理程式 (${agentsData.filters.models.length} 個模型，${agentsData.filters.tools.length} 個工具)`
  );

  const hooksData = generateHooksData(gitDates);
  const hooks = hooksData.items;
  console.log(
    `✓ 已產生 ${hooks.length} 個勾點 (${hooksData.filters.hooks.length} 種勾點類型，${hooksData.filters.tags.length} 個標籤)`
  );

  const workflowsData = generateWorkflowsData(gitDates);
  const workflows = workflowsData.items;
  console.log(
    `✓ 已產生 ${workflows.length} 個工作流程 (${workflowsData.filters.triggers.length} 種觸發條件)`
  );

  const instructionsData = generateInstructionsData(gitDates);
  const instructions = instructionsData.items;
  console.log(
    `✓ 已產生 ${instructions.length} 個指引 (${instructionsData.filters.extensions.length} 種副檔名)`
  );

  const skillsData = generateSkillsData(gitDates);
  const skills = skillsData.items;
  console.log(
    `✓ 已產生 ${skills.length} 個技能 (${skillsData.filters.categories.length} 個類別)`
  );

  const pluginsData = generatePluginsData(gitDates);
  const plugins = pluginsData.items;
  console.log(
    `✓ 已產生 ${plugins.length} 個外掛程式 (${pluginsData.filters.tags.length} 個標籤)`
  );

  const toolsData = generateToolsData();
  const tools = toolsData.items;
  console.log(
    `✓ 已產生 ${tools.length} 個工具 (${toolsData.filters.categories.length} 個類別)`
  );

  const samplesData = generateSamplesData();
  console.log(
    `✓ 已在 ${samplesData.totalCookbooks} 個食譜中產生了 ${samplesData.totalRecipes} 份食譜 (${samplesData.filters.languages.length} 種語言，${samplesData.filters.tags.length} 個標籤)`
  );

  const searchIndex = generateSearchIndex(
    agents,
    instructions,
    hooks,
    workflows,
    skills,
    plugins
  );
  console.log(`✓ 已產生包含 ${searchIndex.length} 個項目的搜尋索引`);

  // 寫入 JSON 檔案
  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "agents.json"),
    JSON.stringify(agentsData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "hooks.json"),
    JSON.stringify(hooksData, null, 2)
  );

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "workflows.json"),
    JSON.stringify(workflowsData, null, 2)
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

  // 產生包含計數與時間戳記的資訊清單 (manifest)
  const manifest = {
    generated: new Date().toISOString(),
    counts: {
      agents: agents.length,
      instructions: instructions.length,
      skills: skills.length,
      hooks: hooks.length,
      workflows: workflows.length,
      plugins: plugins.length,
      tools: tools.length,
      samples: samplesData.totalRecipes,
      total: searchIndex.length,
    },
  };

  fs.writeFileSync(
    path.join(WEBSITE_DATA_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n✓ 所有資料皆已寫入 website/public/data/`);
}

main().catch((err) => {
  console.error("產生網站資料時發生錯誤：", err);
  process.exit(1);
});
