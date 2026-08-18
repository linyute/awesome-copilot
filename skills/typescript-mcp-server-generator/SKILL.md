---
name: 'typescript-mcp-server-generator'
description: '使用 MCP TypeScript SDK v2 (@modelcontextprotocol/server) 在 TypeScript 中產生完整的 MCP 伺服器專案，包含工具、資源和適當的組態設定'
---

# 產生 TypeScript MCP 伺服器

使用 **MCP TypeScript SDK v2** 在 TypeScript 中建立一個完整的模型情境通訊協定 (Model Context Protocol, MCP) 伺服器，並符合以下規格：

## 需求

1. **專案結構**：建立具有適當目錄結構的新 TypeScript/Node.js 專案
2. **NPM 套件**：v1 單體套件 `@modelcontextprotocol/sdk` 已停用。請使用聚焦的 v2 套件：
   - `@modelcontextprotocol/server` — 伺服器實作（透過 `@modelcontextprotocol/server/stdio` 子路徑提供 stdio 傳輸）
   - `@modelcontextprotocol/node` — Node HTTP 傳輸 (`NodeStreamableHTTPServerTransport`)，或框架配接器：`@modelcontextprotocol/express`、`@modelcontextprotocol/hono`、`@modelcontextprotocol/fastify` — 每個配接器都需要隨同安裝其對等框架（例如 `@modelcontextprotocol/express` + `express`）
   - `@modelcontextprotocol/core` — 共用通訊協定結構描述（從此處匯入 `*Schema` 常數，而非從 `sdk/types.js` 匯入）
   - `zod@^4.2` — v2 需要 Zod 4.2+；請勿使用 zod@3
3. **執行階段**：Node.js 20+（v2 最低需求）；ESM 優先並設定 `"type": "module"`（同時提供 CommonJS 建構版本，因此需要時 `require()` 仍可運作）
4. **伺服器類型**：在 HTTP (Streamable HTTP 傳輸) 或基於 stdio 的伺服器之間進行選擇。SSE 和 WebSocket 傳輸已在 v2 中移除 — 請勿產生它們。
5. **工具**：建立至少一個具有適當結構描述驗證的實用工具
6. **錯誤處理**：納入全方位的錯誤處理與驗證

## 實作細節

### 專案設定
- 使用 `npm init` 進行初始化並建立 package.json
- 安裝相依項目：`@modelcontextprotocol/server`、`zod@^4.2` 以及傳輸套件 — 普通 Node HTTP 使用 `@modelcontextprotocol/node`，或框架配接器及其對等框架（例如 `npm install @modelcontextprotocol/express express`）
- 在 package.json 中設定帶有 ES 模組的 TypeScript：`"type": "module"`
- 新增開發相依項目：用於開發的 `tsx` 或 `ts-node`
- 建立適當的 .gitignore 檔案

### 伺服器組態設定
- 使用來自 `@modelcontextprotocol/server` 的 `McpServer` 類別進行高階實作
- 設定伺服器名稱與版本
- 選擇適當的傳輸方式：
   - HTTP (Node)：來自 `@modelcontextprotocol/node` 的 `NodeStreamableHTTPServerTransport`
   - HTTP (Web 標準執行階段)：來自 `@modelcontextprotocol/server` 的 `WebStandardStreamableHTTPServerTransport`
   - stdio：來自 `@modelcontextprotocol/server/stdio` 的 `StdioServerTransport`
- 對於 HTTP：偏好使用框架配接器（`@modelcontextprotocol/express` 等），並具備適當的中介軟體和錯誤處理
- 請注意 v2 使用 Web 標準 `Headers`/`Request` 型別；使用 `ctx.http?.req?.headers.get('x-custom')` 讀取標頭

### 工具實作
- 使用帶有組態物件的 `registerTool()` — v1 可變引數 `.tool()` 簽章已不存在：
   ```typescript
   server.registerTool('greet', {
     description: 'Greet user',
     inputSchema: z.object({ name: z.string() })
   }, async ({ name }, ctx) => {
     return { content: [{ type: 'text', text: `Hello, ${name}!` }] };
   });
   ```
- 結構描述必須是完整的 Zod 物件 (`z.object({...})`) — 原始形狀物件 (`{ name: z.string() }`) 已被棄用
- 提供清晰的 `title` 和 `description` 欄位
- 在結果中同時回傳 `content` 和 `structuredContent`
- 處理常式的第二個參數是結構化的 `ctx` 物件（取代 v1 的 `extra`）：`ctx.mcpReq.signal`、`ctx.mcpReq.id`、`ctx.mcpReq.send(...)`、`ctx.mcpReq.notify(...)`
- 使用 try-catch 區塊實作適當的錯誤處理；使用 v2 錯誤階層（`ProtocolError`、`SdkError`、帶有 `.status` 的 `SdkHttpError`）取代 v1 `McpError`/`StreamableHTTPError`
- 在適當之處支援非同步操作

### 資源/提示詞設定（選用）
- 使用帶有 ResourceTemplate 的 `registerResource()` 新增動態 URI 資源
- 使用帶有引數結構描述的 `registerPrompt()` 新增提示詞（與 `registerTool()` 相同的組態物件風格）
- 考慮新增自動完成支援以獲得更佳的使用者體驗；請注意 v2 `completable()` 包裝器順序：`completable(z.string(), callback).optional()`（選用套用於外部）

### 程式碼品質
- 使用 TypeScript 確保型別安全
- 一致遵循 async/await 模式
- 在傳輸關閉事件中實作適當的清理
- 使用環境變數進行組態設定
- 為複雜邏輯新增內嵌註解
- 透過明確的關注點分離來組織程式碼結構

## 值得考慮的範例工具類型
- 資料處理與轉換
- 外部 API 整合
- 檔案系統操作（讀取、搜尋、分析）
- 資料庫查詢
- 文字分析或摘要（透過多輪 `input_required` 模式由 LLM 輔助）
- 系統資訊擷取

## 組態選項
- **針對 HTTP 伺服器**：
   - 透過環境變數進行連接埠組態設定
   - 針對瀏覽器用戶端的 CORS 設定
   - 工作階段管理（無狀態 vs 具狀態）
   - 本地伺服器的 DNS 重新繫結 (rebinding) 保護
   - 嚴格的 `Content-Type` 處理：v2 會拒絕非 `application/json` 的 POST 內文
   
- **針對 stdio 伺服器**：
   - 適當的 stdin/stdout 處理
   - 基於環境的組態設定
   - 處理序生命週期管理

## 移轉現有的 v1 伺服器
- 先執行官方 codemod：`npx @modelcontextprotocol/codemod@latest v1-to-v2 .`
- 然後搜尋 `@mcp-codemod-error` 標記以尋找需要人工判斷的部分（傳輸選擇、標頭讀取、錯誤分類）
- 將 `McpError + ErrorCode` 檢查替換為新的錯誤類別；HTTP 狀態現在位於 `error.status`，而非 `error.code`
- `Server.createMessage()`、`listRoots()`、`sendLoggingMessage()` 以及 `roots`/`sampling`/`logging` 功能欄位在 v2 中已被棄用 — 在新程式碼中請避免使用它們

## 測試指引
- 說明如何執行伺服器 (`npm start` 或 `npx tsx server.ts`)
- 提供 MCP Inspector 指令：`npx @modelcontextprotocol/inspector`
- 針對 HTTP 伺服器，包含連線 URL：`http://localhost:PORT/mcp`
- 包含範例工具呼叫
- 為常見問題新增疑難排解提示

## 值得考慮的額外功能
- 使用多輪 `input_required` 模式的 LLM 驅動工具（取代已棄用 sampling 子系統的 v2 替代方案）
- 用於互動式工作流程的使用者輸入引導 (elicitation)
- 具備啟用/停用功能的動態工具註冊
- 針對大量更新的通知去抖動 (debouncing)
- 用於高效率資料參照的資源連結

產生一個完整、可用於生產環境的 MCP 伺服器，並附帶完整的說明文件、型別安全和錯誤處理。
