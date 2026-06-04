#!/usr/bin/env node

/**
 * 為 GitHub Pages 網站生成 JSON 中繼資料檔案。
 * 此指令碼從代理 (agents)、指示 (instructions)、技能 (skills)、掛鉤 (hooks) 和外掛 (plugins) 中提取中繼資料
 * 並將其寫入 website/data/ 以供用戶端搜尋和顯示。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  AGENTS_DIR,
  COOKBOOK_DIR,
  EXTENSIONS_DIR,
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
 * 從檔名或 frontmatter 提取標題
 */
function extractTitle(filePath, frontmatter) {
  if (frontmatter?.name) {
    return frontmatter.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  // Fallback to filename
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
 * 將 kebab/snake 命名轉換為可讀的標題。
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

/**
 * 尋找目錄下任何檔案的最新 git 修改日期。
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
 * 取得目前取出儲存庫的提交 SHA。
 */
function getCurrentCommitSha() {
  return execSync("git --no-pager rev-parse HEAD", {
    cwd: ROOT_FOLDER,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

/**
 * 生成代理 (agents) 中繼資料
 */
function generateAgentsData(gitDates) {
  const agents = [];
  const files = fs
    .readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".agent.md"));

  // Track all unique values for filters
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

    // Track unique values
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

  // Sort and return with filter metadata
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
 * 生成掛鉤 (hooks) 中繼資料 (與技能類似 - 基於資料夾)
 */
function generateHooksData(gitDates) {
  const hooks = [];

  // Check if hooks directory exists
  if (!fs.existsSync(HOOKS_DIR)) {
    return {
      items: hooks,
      filters: {
        hooks: [],
        tags: [],
      },
    };
  }

  // Get all hook folders (directories)
  const hookFolders = fs.readdirSync(HOOKS_DIR).filter((file) => {
    const filePath = path.join(HOOKS_DIR, file);
    return fs.statSync(filePath).isDirectory();
  });

  // Track all unique values for filters
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

    // Track unique values
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

  // Sort and return with filter metadata
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
 * 生成工作流 (workflows) 中繼資料（扁平的 .md 檔案）
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

  // Handle array format
  if (Array.isArray(applyTo)) {
    return applyTo.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  // Handle string format (comma-separated)
  if (typeof applyTo === "string") {
    return applyTo
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  return [];
}

/**
 * 從 glob 模式提取副檔名
 */
function extractExtensionFromPattern(pattern) {
  // Match patterns like **.ts, **/*.js, *.py, etc.
  const match = pattern.match(/\*\.(\w+)$/);
  if (match) return `.${match[1]}`;

  // Match patterns like **/*.{ts,tsx}
  const braceMatch = pattern.match(/\*\.\{([^}]+)\}$/);
  if (braceMatch) {
    return braceMatch[1].split(",").map((ext) => `.${ext.trim()}`);
  }

  return null;
}

/**
 * 生成指示 (instructions) 中繼資料
 */
function generateInstructionsData(gitDates) {
  const instructions = [];
  const files = fs
    .readdirSync(INSTRUCTIONS_DIR)
    .filter((f) => f.endsWith(".instructions.md"));

  // Track all unique patterns and extensions for filters
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

    // Extract extensions from patterns
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
 * 生成技能 (skills) 中繼資料
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

      // Get all files in the skill folder recursively
      const files = getSkillFiles(skillPath, relativePath);

      // Get last updated from SKILL.md file
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
        // Get file size
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
 * 從資料夾取得所有代理 (agent) Markdown 檔案
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
 * 生成外掛 (plugins) 中繼資料
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

      // Build items list from spec fields (agents, commands, skills)
      const items = [
        ...agentItems,
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
        searchText: `${data.name || dir.name} ${data.description || ""
          } ${tags.join(" ")}`.toLowerCase(),
      });
    } catch (e) {
      console.warn(`Failed to parse plugin: ${dir.name}`, e.message);
    }
  }

  // Load external plugins from plugins/external.json
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
              `Skipping external plugin with missing name/description`
            );
            continue;
          }

          // Skip if a local plugin with the same name already exists
          if (plugins.some((p) => p.id === ext.name)) {
            console.warn(
              `Skipping external plugin "${ext.name}" — local plugin with same name exists`
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
          `  ✓ Loaded ${addedCount} external plugin(s)`
        );
      }
    } catch (e) {
      console.warn(`Failed to parse external plugins: ${e.message}`);
    }
  }

  // Collect all unique tags
  const allTags = [...new Set(plugins.flatMap((p) => p.tags))].sort();

  const sortedPlugins = plugins.sort((a, b) => a.name.localeCompare(b.name));

  return {
    items: sortedPlugins,
    filters: { tags: allTags },
  };
}

/**
 * 生成畫布擴充功能 (canvas extensions) 中繼資料
 */
function generateExtensionsData(gitDates, commitSha) {
  const extensions = [];

  if (!fs.existsSync(EXTENSIONS_DIR)) {
    return { items: [] };
  }

  const extensionDirs = fs
    .readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const dir of extensionDirs) {
    const relPath = `extensions/${dir.name}`;
    extensions.push({
      id: dir.name,
      name: formatDisplayName(dir.name),
      path: relPath,
      ref: commitSha,
      lastUpdated: getDirectoryLastUpdated(gitDates, relPath),
    });
  }

  const sortedExtensions = extensions.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return { items: sortedExtensions };
}

/**
 * 從 website/data/tools.yml 生成工具中繼資料
 */
function generateToolsData() {
  const toolsFile = path.join(WEBSITE_SOURCE_DATA_DIR, "tools.yml");

  if (!fs.existsSync(toolsFile)) {
    console.warn("No tools.yml file found at", toolsFile);
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

  // Sort with featured first, then alphabetically
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
 * 生成用於搜尋的合併索引
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
      searchText: `${instruction.title} ${instruction.description} ${instruction.applyTo || ""
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
      searchText: `${workflow.title} ${workflow.description
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
 * 從 cookbook.yml 生成範例/指南資料
 */
function generateSamplesData() {
  const cookbookYamlPath = path.join(COOKBOOK_DIR, "cookbook.yml");

  if (!fs.existsSync(cookbookYamlPath)) {
    console.warn(
      "Warning: cookbook/cookbook.yml not found, skipping samples generation"
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
    console.warn("Warning: Invalid cookbook.yml format");
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

  // First pass: collect all known language IDs across cookbooks
  cookbookManifest.cookbooks.forEach((cookbook) => {
    cookbook.languages.forEach((lang) => allLanguages.add(lang.id));
  });

  const cookbooks = cookbookManifest.cookbooks.map((cookbook) => {

    // Process recipes and add file paths
    const recipes = cookbook.recipes.map((recipe) => {
      // Collect tags
      if (recipe.tags) {
        recipe.tags.forEach((tag) => allTags.add(tag));
      }

      totalRecipes++;

      // External recipes link to an external URL — skip local file resolution
      if (recipe.external) {
        if (recipe.url) {
          try {
            new URL(recipe.url);
          } catch {
            console.warn(`Warning: Invalid URL for external recipe "${recipe.id}": ${recipe.url}`);
          }
        } else {
          console.warn(`Warning: External recipe "${recipe.id}" is missing a url`);
        }

        // Derive languages from tags that match known language IDs
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

      // Build variants with file paths for each language
      const variants = {};
      cookbook.languages.forEach((lang) => {
        const docPath = `${cookbook.path}/${lang.id}/${recipe.id}.md`;
        const examplePath = `${cookbook.path}/${lang.id}/recipe/${recipe.id}${lang.extension}`;

        // Check if files exist
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
 * 主函數
 */
async function main() {
  console.log("正在生成網站資料...\n");

  ensureDataDir();

  // Load git dates for all resource files (single efficient git command)
  console.log("正在載入 git 歷史記錄以取得最後更新日期...");
  const gitDates = getGitFileDates(
    [
      "agents/",
      "instructions/",
      "hooks/",
      "workflows/",
      "skills/",
      "extensions/",
      "plugins/",
    ],
    ROOT_FOLDER
  );
  console.log(`✓ 已載入 ${gitDates.size} 個檔案的日期\n`);

  // Generate all data
  const commitSha = getCurrentCommitSha();

  const agentsData = generateAgentsData(gitDates);
  const agents = agentsData.items;
  console.log(
    `✓ 已生成 ${agents.length} 個代理 (${agentsData.filters.models.length} 個模型, ${agentsData.filters.tools.length} 個工具)`
  );

  const hooksData = generateHooksData(gitDates);
  const hooks = hooksData.items;
  console.log(
    `✓ 已生成 ${hooks.length} 個掛鉤 (${hooksData.filters.hooks.length} 個掛鉤類型, ${hooksData.filters.tags.length} 個標籤)`
  );

  const workflowsData = generateWorkflowsData(gitDates);
  const workflows = workflowsData.items;
  console.log(
    `✓ 已生成 ${workflows.length} 個工作流 (${workflowsData.filters.triggers.length} 個觸發器)`
  );

  const instructionsData = generateInstructionsData(gitDates);
  const instructions = instructionsData.items;
  console.log(
    `✓ 已生成 ${instructions.length} 個指示 (${instructionsData.filters.extensions.length} 個擴充功能)`
  );

  const skillsData = generateSkillsData(gitDates);
  const skills = skillsData.items;
  console.log(`✓ 已生成 ${skills.length} 個技能`);

  const pluginsData = generatePluginsData(gitDates);
  const plugins = pluginsData.items;
  console.log(
    `✓ 已生成 ${plugins.length} 個外掛 (${pluginsData.filters.tags.length} 個標籤)`
  );

  const extensionsData = generateExtensionsData(gitDates, commitSha);
  const extensions = extensionsData.items;
  console.log(`✓ 已生成 ${extensions.length} 個擴充功能`);

  const toolsData = generateToolsData();
  const tools = toolsData.items;
  console.log(
    `✓ 已生成 ${tools.length} 個工具 (${toolsData.filters.categories.length} 個類別)`
  );

  const samplesData = generateSamplesData();
  console.log(
    `✓ 已在 ${samplesData.totalCookbooks} 本指南中生成 ${samplesData.totalRecipes} 個食譜 (${samplesData.filters.languages.length} 種語言, ${samplesData.filters.tags.length} 個標籤)`
  );

  // Count contributors from .all-contributorsrc for manifest stats
  const contributorsRcPath = path.join(ROOT_FOLDER, ".all-contributorsrc");
  const contributorCount = fs.existsSync(contributorsRcPath)
    ? (JSON.parse(fs.readFileSync(contributorsRcPath, "utf-8")).contributors || []).length
    : 0;

  const searchIndex = generateSearchIndex(
    agents,
    instructions,
    hooks,
    workflows,
    skills,
    plugins
  );
  console.log(`✓ 已生成包含 ${searchIndex.length} 個項目的搜尋索引`);

  // Write JSON files
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
    path.join(WEBSITE_DATA_DIR, "extensions.json"),
    JSON.stringify(extensionsData, null, 2)
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

  // Generate a manifest with counts and timestamps
  const manifest = {
    generated: new Date().toISOString(),
    counts: {
      agents: agents.length,
      instructions: instructions.length,
      skills: skills.length,
      hooks: hooks.length,
      workflows: workflows.length,
      plugins: plugins.length,
      extensions: extensions.length,
      tools: tools.length,
      contributors: contributorCount,
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
  console.error("生成網站資料時發生錯誤：", err);
  process.exit(1);
});
