// 用於集合檔案和使用 vfile-matter 進行前置內容解析的 YAML 解析器
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`處理檔案 ${filePath} 時發生錯誤: ${error.message}`);
    return defaultValue;
  }
}

/**
 * 解析集合 YAML 檔案 (.collection.yml)
 * 集合是沒有前置內容分隔符號的純 YAML 檔案
 * @param {string} filePath - 集合檔案的路徑
 * @returns {object|null} 解析後的集合物件或錯誤時為 null
 */
function parseCollectionYaml(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");

      // 集合是純 YAML 檔案，直接使用 js-yaml 進行解析
      return yaml.load(content, { schema: yaml.JSON_SCHEMA });
    },
    filePath,
    null
  );
}

/**
 * 使用 vfile-matter 從 Markdown 檔案解析前置內容
 * 適用於任何具有 YAML 前置內容的 Markdown 檔案 (代理程式、提示、指示)
 * @param {string} filePath - Markdown 檔案的路徑
 * @returns {object|null} 解析後的前置內容物件或錯誤時為 null
 */
function parseFrontmatter(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const file = new VFile({ path: filePath, value: content });

      // 使用 vfile-matter 解析前置內容
      matter(file);

      // 前置內容現在可在 file.data.matter 中取得
      const frontmatter = file.data.matter;

      // 標準化可能累積尾隨換行符號/空格的字串欄位
      if (frontmatter) {
        if (typeof frontmatter.name === "string") {
          frontmatter.name = frontmatter.name.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.title === "string") {
          frontmatter.title = frontmatter.title.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.description === "string") {
          // 僅移除尾隨的空白字元/換行符號；保留內部格式
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
 * 提取代理程式 Metadata，包括 MCP 伺服器資訊
 * @param {string} filePath - 代理程式檔案的路徑
 * @returns {object|null} 包含名稱、描述、工具和 mcp-servers 的代理程式 Metadata 物件
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
 * @param {string} filePath - 代理程式檔案的路徑
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
 * @param {string} filePath - 代理程式檔案的路徑
 * @returns {Array<{name:string,type?:string,command?:string,args?:string[],url?:string,headers?:object}>}
 */
function extractMcpServerConfigs(filePath) {
  const metadata = extractAgentMetadata(filePath);
  if (!metadata || !metadata.mcpServers) return [];
  return Object.entries(metadata.mcpServers).map(([name, cfg]) => {
    // 確保我們不會更改原始設定
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
 * 解析 SKILL.md 前置內容並列出技能資料夾中的捆綁資產
 * @param {string} skillPath - 技能資料夾的路徑
 * @returns {object|null} 包含名稱、描述和資產陣列的技能 Metadata
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
          `位於 ${skillPath} 的技能無效: 前置內容中缺少名稱或描述`
        );
        return null;
      }

      // 列出捆綁資產 (除了 SKILL.md 之外的所有檔案)
      const assets = fs
        .readdirSync(skillPath)
        .filter((file) => {
          const filePath = path.join(skillPath, file);
          return file !== "SKILL.md" && fs.statSync(filePath).isFile();
        })
        .sort();

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

export {
  parseCollectionYaml,
  parseFrontmatter,
  extractAgentMetadata,
  extractMcpServers,
  extractMcpServerConfigs,
  parseSkillMetadata,
  safeFileOperation,
};
