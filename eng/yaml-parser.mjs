// 使用 vfile-matter 解析 Front Matter 的 YAML 解析器
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

/**
 * 安全的檔案操作包裝函式
 */
function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`處理檔案 ${filePath} 時發生錯誤：${error.message}`);
    return defaultValue;
  }
}

/**
 * 使用 vfile-matter 從 Markdown 檔案中解析 Front Matter
 * 適用於任何具有 YAML Front Matter 的 Markdown 檔案 (代理程式、提示、指引)
 * @param {string} filePath - Markdown 檔案的路徑
 * @returns {object|null} 解析後的 Front Matter 物件，發生錯誤時回傳 null
 */
function parseFrontmatter(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const file = new VFile({ path: filePath, value: content });

      // 使用 vfile-matter 解析 Front Matter
      matter(file);

      // 解析後的 Front Matter 現在位於 file.data.matter 中
      const frontmatter = file.data.matter;

      // 標準化可能累積結尾換行/空格的字串欄位
      if (frontmatter) {
        if (typeof frontmatter.name === "string") {
          frontmatter.name = frontmatter.name.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.title === "string") {
          frontmatter.title = frontmatter.title.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.description === "string") {
          // 僅移除結尾空白/換行；保留內部格式
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
 * 提取代理程式 Metadata，包含 MCP 伺服器資訊
 * @param {string} filePath - 代理程式檔案路徑
 * @returns {object|null} 包含名稱、說明、工具與 MCP 伺服器的代理程式 Metadata 物件
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
 * 從代理程式檔案中提取 MCP 伺服器名稱
 * @param {string} filePath - 代理程式檔案路徑
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
 * 從代理程式檔案中提取完整的 MCP 伺服器設定
 * @param {string} filePath - 代理程式檔案路徑
 * @returns {Array<{name:string,type?:string,command?:string,args?:string[],url?:string,headers?:object}>}
 */
function extractMcpServerConfigs(filePath) {
  const metadata = extractAgentMetadata(filePath);
  if (!metadata || !metadata.mcpServers) return [];
  return Object.entries(metadata.mcpServers).map(([name, cfg]) => {
    // 確保不會修改原始設定
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
 * 解析 SKILL.md Front Matter 並列出技能資料夾中的隨附資產
 * @param {string} skillPath - 技能資料夾路徑
 * @returns {object|null} 包含名稱、說明與資產陣列的技能 Metadata
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
          `位於 ${skillPath} 的技能無效：Front Matter 缺少名稱或說明`
        );
        return null;
      }

      // 列出隨附資產 (除了 SKILL.md 以外的所有檔案)，並遞迴搜尋子目錄
      const getAllFiles = (dirPath, arrayOfFiles = []) => {
        const files = fs.readdirSync(dirPath);
        const assetPaths = ['references', 'assets', 'scripts'];

        files.forEach((file) => {
          const filePath = path.join(dirPath, file);
          if (fs.statSync(filePath).isDirectory() && assetPaths.includes(file)) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else {
            const relativePath = path.relative(skillPath, filePath);
            if (relativePath !== "SKILL.md") {
              // 將路徑分隔符號標準化為正斜線，以確保跨平台一致性
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
 * 從勾點資料夾解析勾點 Metadata (與技能類似)
 * @param {string} hookPath - 勾點資料夾路徑
 * @returns {object|null} 勾點 Metadata，發生錯誤時回傳 null
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
          `位於 ${hookPath} 的勾點無效：Front Matter 缺少名稱或說明`
        );
        return null;
      }

      // 若 hooks.json 存在，則從中提取勾點事件
      let hookEvents = [];
      const hooksJsonPath = path.join(hookPath, "hooks.json");
      if (fs.existsSync(hooksJsonPath)) {
        try {
          const hooksJsonContent = fs.readFileSync(hooksJsonPath, "utf8");
          const hooksConfig = JSON.parse(hooksJsonContent);
          // 從 hooks 物件中提取所有勾點事件名稱
          if (hooksConfig.hooks && typeof hooksConfig.hooks === "object") {
            hookEvents = Object.keys(hooksConfig.hooks);
          }
        } catch (error) {
          console.warn(
            `解析位於 ${hookPath} 的 hooks.json 失敗：${error.message}`
          );
        }
      }

      // 列出隨附資產 (除了 README.md 以外的所有檔案)，並遞迴搜尋子目錄
      const getAllFiles = (dirPath, arrayOfFiles = []) => {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
          const filePath = path.join(dirPath, file);
          if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
          } else {
            const relativePath = path.relative(hookPath, filePath);
            if (relativePath !== "README.md") {
              // 將路徑分隔符號標準化為正斜線，以確保跨平台一致性
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
 * 從獨立的 .md 工作流程檔案中解析工作流程 Metadata
 * @param {string} filePath - 工作流程 .md 檔案路徑
 * @returns {object|null} 工作流程 Metadata，發生錯誤時回傳 null
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
          `位於 ${filePath} 的工作流程無效：Front Matter 缺少名稱或說明`
        );
        return null;
      }

      // 從 'on' 欄位提取觸發條件 (最上層的鍵)
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
 * 解析通用的 YAML 檔案 (用於 tools.yml 及其他設定檔)
 * @param {string} filePath - YAML 檔案路徑
 * @returns {object|null} 解析後的 YAML 物件，發生錯誤時回傳 null
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
  parseSkillMetadata,
  parseHookMetadata,
  parseWorkflowMetadata,
  parseYamlFile,
  safeFileOperation,
};
