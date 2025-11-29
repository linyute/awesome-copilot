// 使用 vfile-matter 進行集合檔案和 frontmatter 解析的 YAML 解析器
import fs from "fs";
import yaml from "js-yaml";
import { VFile } from "vfile";
import { matter } from "vfile-matter";

function safeFileOperation(operation, filePath, defaultValue = null) {
  try {
    return operation();
  } catch (error) {
    console.error(`處理檔案 ${filePath} 時發生錯誤：${error.message}`);
    return defaultValue;
  }
}

/**
 * 解析集合 YAML 檔案 (.collection.yml)
 * 集合是沒有 frontmatter 分隔符號的純 YAML 檔案
 * @param {string} filePath - 集合檔案的路徑
 * @returns {object|null} 解析後的集合物件或錯誤時為 null
 */
function parseCollectionYaml(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");

      // 集合是純 YAML 檔案，直接使用 js-yaml 解析
      return yaml.load(content, { schema: yaml.JSON_SCHEMA });
    },
    filePath,
    null
  );
}

/**
 * 使用 vfile-matter 從 markdown 檔案解析 frontmatter
 * 適用於任何具有 YAML frontmatter 的 markdown 檔案 (代理程式、提示、指示)
 * @param {string} filePath - markdown 檔案的路徑
 * @returns {object|null} 解析後的 frontmatter 物件或錯誤時為 null
 */
function parseFrontmatter(filePath) {
  return safeFileOperation(
    () => {
      const content = fs.readFileSync(filePath, "utf8");
      const file = new VFile({ path: filePath, value: content });

      // 使用 vfile-matter 解析 frontmatter
      matter(file);

      // frontmatter 現在可在 file.data.matter 中取得
      const frontmatter = file.data.matter;

      //正規化可能累積尾隨換行符/空格的字串欄位
      if (frontmatter) {
        if (typeof frontmatter.name === "string") {
          frontmatter.name = frontmatter.name.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.title === "string") {
          frontmatter.title = frontmatter.title.replace(/[\r\n]+$/g, "").trim();
        }
        if (typeof frontmatter.description === "string") {
          // Remove only trailing whitespace/newlines; preserve internal formatting
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
 * 提取代理程式中繼資料，包括 MCP 伺服器資訊
 * @param {string} filePath - 代理程式檔案的路徑
 * @returns {object|null} 包含名稱、描述、工具和 mcp-servers 的代理程式中繼資料物件
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
 * 從代理程式檔案中提取完整的 MCP 伺服器組態
 * @param {string} filePath - 代理程式檔案的路徑
 * @returns {Array<{name:string,type?:string,command?:string,args?:string[],url?:string,headers?:object}>}
 */
function extractMcpServerConfigs(filePath) {
  const metadata = extractAgentMetadata(filePath);
  if (!metadata || !metadata.mcpServers) return [];
  return Object.entries(metadata.mcpServers).map(([name, cfg]) => {
    // 確保我們不會修改原始組態
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

export {
  parseCollectionYaml,
  parseFrontmatter,
  extractAgentMetadata,
  extractMcpServers,
  extractMcpServerConfigs,
  safeFileOperation,
};
