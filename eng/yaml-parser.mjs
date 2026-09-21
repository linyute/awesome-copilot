// 使用 vfile-matter 進行 frontmatter 解析的 YAML 解析器
import fs from "fs";
import * as yaml from "js-yaml";
import path from "path";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`Error processing file ${filePath}: ${error.message}`);
    return defaultValue;
  }
}

/**
 * 決定是否應將符號連結 (symlink) 項目排除在隨附資產清單之外。
 *
 * 目錄符號連結會被略過，因為跟隨其可能遍歷至資料夾外部或形成循環。
 * 中斷的連結也會被略過。檔案符號連結會被保留：
 * 外掛程式具體化 (materialization) 會解引用它們，因此它們確實是隨附內容。
 *
 * @param {string} filePath - 符號連結項目的路徑
 * @returns {boolean} 當該項目應被略過時為 True
 */
function skipsAsBundledAsset(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return true;
  }
}

const BUILD_OUTPUT_DIRECTORIES = new Set(["bin", "obj"]);

/**
 * 使用 vfile-matter 從 Markdown 檔案中解析 frontmatter
 * 適用於任何帶有 YAML frontmatter 的 Markdown 檔案 (agents, prompts, instructions)
 * @param {string} filePath - Markdown 檔案的路徑
 * @returns {object|null} 解析出的 frontmatter 物件，若發生錯誤則為 null
 */
function parseFrontmatter(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const file = new VFile({ path: filePath, value: content });

      // 使用 vfile-matter 解析 frontmatter
      matter(file);

      // frontmatter 現已可在 file.data.matter 中取得
      const frontmatter = file.data.matter;

      // 正規化可能累積尾隨換行/空格的字串欄位
      if (frontmatter) {
        if (typeof frontmatter.name === "string") {
          frontmatter.name = frontmatter.name.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.title === "string") {
          frontmatter.title = frontmatter.title.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.description === "string") {
          // 僅移除尾隨空白/換行；保留內部格式
          frontmatter.description = frontmatter.description.replace(
            /[\s\r\n]+$/g,
            ""
          );
        }
      }

      return frontmatter;
    },
    filePath,
    null
  );
}

/**
 * 擷取包含 MCP 伺服器資訊的 agent metadata
 * @param {string} filePath - agent 檔案路徑
 * @returns {object|null} 包含 name、description、tools 和 mcp-servers 的 agent metadata 物件
 */
function extractAgentMetadata(filePath) {
  const frontmatter = parseFrontmatter(filePath);

  if (!frontmatter) {
    return null;
  }

  return {
    name: typeof frontmatter.name === "string" ? frontmatter.name : null,
    description:
      typeof frontmatter.description === "string"
        ? frontmatter.description
        : null,
    tools: frontmatter.tools || [],
    mcpServers: frontmatter["mcp-servers"] || {},
  };
}

/**
 * 從 agent 檔案中擷取 MCP 伺服器名稱
 * @param {string} filePath - agent 檔案路徑
 * @returns {string[]} MCP 伺服器名稱陣列
 */
function extractMcpServers(filePath) {
  const metadata = extractAgentMetadata(filePath);

  if (!metadata || !metadata.mcpServers) {
    return [];
  }

  return Object.keys(metadata.mcpServers);
}

/**
 * 從 agent 檔案中擷取完整的 MCP 伺服器設定
 * @param {string} filePath - agent 檔案路徑
 * @returns {Array<{name:string,type?:string,command?:string,args?:string[],url?:string,headers?:object}>}
 */
function extractMcpServerConfigs(filePath) {
  const metadata = extractAgentMetadata(filePath);
  if (!metadata || !metadata.mcpServers) return [];
  return Object.entries(metadata.mcpServers).map(([name, cfg]) => {
    // 確保我們不會變更原始 cfg
    const copy = { ...cfg };
    return {
      name,
      type: typeof copy.type === "string" ? copy.type : undefined,
      command: typeof copy.command === "string" ? copy.command : undefined,
      args: Array.isArray(copy.args) ? copy.args : undefined,
      url: typeof copy.url === "string" ? copy.url : undefined,
      headers:
        typeof copy.headers === "object" && copy.headers !== null
          ? copy.headers
          : undefined,
    };
  });
}

/**
 * 解析 SKILL.md frontmatter 並列出技能資料夾中的隨附資產
 * @param {string} skillPath - 技能資料夾路徑
 * @returns {object|null} 包含 name、description 和 assets 陣列的技能 metadata
 */
function parseSkillMetadata(skillPath) {
  return safeFileOperation(
    () => {
      const skillFile = path.join(skillPath, "SKILL.md");
      if (!fs.existsSync(skillFile)) {
        return null;
      }

      const frontmatter = parseFrontmatter(skillFile);

      // 驗證必要欄位
      if (!frontmatter?.name || !frontmatter?.description) {
        console.warn(
          `Invalid skill at ${skillPath}: missing name or description in frontmatter`
        );
        return null;
      }

      // 列出隨附資產 (除 SKILL.md 以外的所有檔案)，遞迴檢查子目錄。
      // 略過目錄符號連結：跟隨符號連結可能會脫離技能資料夾。
      const getAllFiles = (dirPath, arrayOfFiles = []) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        entries.forEach((entry) => {
          const filePath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            if (BUILD_OUTPUT_DIRECTORIES.has(entry.name)) return;
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else if (
            !entry.isSymbolicLink() ||
            !skipsAsBundledAsset(filePath)
          ) {
            const relativePath = path.relative(skillPath, filePath);
            if (relativePath !== "SKILL.md") {
              // 將路徑分隔符正規化為正斜線以確保跨平台一致性
              arrayOfFiles.push(relativePath.replace(/\\/g, "/"));
            }
          }
        });

        return arrayOfFiles;
      };

      const assets = getAllFiles(skillPath).sort();

      return {
        name: frontmatter.name,
        description: frontmatter.description,
        assets,
        path: skillPath,
      };
    },
    skillPath,
    null
  );
}

/**
 * 從 hook 資料夾解析 hook metadata (類似於 skills)
 * @param {string} hookPath - hook 資料夾路徑
 * @returns {object|null} Hook metadata，若發生錯誤則為 null
 */
function parseHookMetadata(hookPath) {
  return safeFileOperation(
    () => {
      const readmeFile = path.join(hookPath, "README.md");
      if (!fs.existsSync(readmeFile)) {
        return null;
      }

      const frontmatter = parseFrontmatter(readmeFile);

      // 驗證必要欄位
      if (!frontmatter?.name || !frontmatter?.description) {
        console.warn(
          `Invalid hook at ${hookPath}: missing name or description in frontmatter`
        );
        return null;
      }

      // 若 hooks.json 存在，從中擷取 hook 事件
      let hookEvents = [];
      const hooksJsonPath = path.join(hookPath, "hooks.json");
      if (fs.existsSync(hooksJsonPath)) {
        try {
          const hooksJsonContent = fs.readFileSync(hooksJsonPath, "utf8");
          const hooksConfig = JSON.parse(hooksJsonContent);
          // 從 hooks 物件中擷取所有 hook 事件名稱
          if (hooksConfig.hooks && typeof hooksConfig.hooks === "object") {
            hookEvents = Object.keys(hooksConfig.hooks);
          }
        } catch (error) {
          console.warn(
            `Failed to parse hooks.json at ${hookPath}: ${error.message}`
          );
        }
      }

      // 列出隨附資產 (除 README.md 以外的所有檔案)，遞迴檢查子目錄。
      // 略過目錄符號連結：跟隨符號連結可能會脫離 hook 資料夾。
      const getAllFiles = (dirPath, arrayOfFiles = []) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        entries.forEach((entry) => {
          const filePath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else if (
            !entry.isSymbolicLink() ||
            !skipsAsBundledAsset(filePath)
          ) {
            const relativePath = path.relative(hookPath, filePath);
            if (relativePath !== "README.md") {
              // 將路徑分隔符正規化為正斜線以確保跨平台一致性
              arrayOfFiles.push(relativePath.replace(/\\/g, "/"));
            }
          }
        });

        return arrayOfFiles;
      };

      const assets = getAllFiles(hookPath).sort();

      return {
        name: frontmatter.name,
        description: frontmatter.description,
        hooks: hookEvents,
        tags: frontmatter.tags || [],
        assets,
        path: hookPath,
      };
    },
    hookPath,
    null
  );
}

/**
 * 從獨立的 .md workflow 檔案解析 workflow metadata
 * @param {string} filePath - workflow .md 檔案路徑
 * @returns {object|null} Workflow metadata，若發生錯誤則為 null
 */
function parseWorkflowMetadata(filePath) {
  return safeFileOperation(
    () => {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const frontmatter = parseFrontmatter(filePath);

      // 驗證必要欄位
      if (!frontmatter?.name || !frontmatter?.description) {
        console.warn(
          `Invalid workflow at ${filePath}: missing name or description in frontmatter`
        );
        return null;
      }

      // 從 'on' 欄位 (最上層索引鍵) 擷取觸發條件
      const onField = frontmatter.on;
      const triggers = [];
      if (onField && typeof onField === "object") {
        triggers.push(...Object.keys(onField));
      } else if (typeof onField === "string") {
        triggers.push(onField);
      }

      return {
        name: frontmatter.name,
        description: frontmatter.description,
        triggers,
        path: filePath,
      };
    },
    filePath,
    null
  );
}

/**
 * 解析一般 YAML 檔案 (用於 tools.yml 和其他組態設定檔)
 * @param {string} filePath - YAML 檔案路徑
 * @returns {object|null} 解析後的 YAML 物件，若發生錯誤則為 null
 */
function parseYamlFile(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      return yaml.load(content, { schema: yaml.JSON_SCHEMA });
    },
    filePath,
    null
  );
}

export {
  extractAgentMetadata,
  extractMcpServerConfigs,
  extractMcpServers,
  parseFrontmatter,
  parseHookMetadata,
  parseSkillMetadata,
  parseWorkflowMetadata,
  parseYamlFile,
  safeFileOperation,
};
