---
mode: 'agent'
description: '在 TypeScript 中產生一個完整的 MCP 伺服器專案，包含工具、資源和適當的組態。'
---

# 產生 TypeScript MCP 伺服器

在 TypeScript 中建立一個完整的模型上下文協定 (MCP) 伺服器，並具有以下規格：

## 要求

1. **專案結構**：建立一個具有適當目錄結構的新 TypeScript/Node.js 專案
2. **NPM 套件**：包含 @modelcontextprotocol/sdk、zod@3，以及 express (用於 HTTP) 或 stdio 支援
3. **TypeScript 組態**：具有 ES 模組支援的適當 tsconfig.json
4. **伺服器類型**：選擇 HTTP (帶有 Streamable HTTP 傳輸) 或基於 stdio 的伺服器
5. **工具**：建立至少一個具有適當結構描述驗證的實用工具
6. **錯誤處理**：包含全面的錯誤處理和驗證

## 實作細節

### 專案設定
- 使用 `npm init` 初始化並建立 package.json
- 安裝依賴項：`@modelcontextprotocol/sdk`、`zod@3` 和特定於傳輸的套件
- 使用 ES 模組組態 TypeScript：package.json 中的 `"type": "module"`
- 新增開發依賴項：`tsx` 或 `ts-node` 用於開發
- 建立適當的 .gitignore 檔案

### 伺服器組態
- 使用 `McpServer` 類別進行高階實作
- 設定伺服器名稱和版本
- 選擇適當的傳輸 (StreamableHTTPServerTransport 或 StdioServerTransport)
- 對於 HTTP：使用適當的中介軟體和錯誤處理設定 Express
- 對於 stdio：直接使用 StdioServerTransport

### 工具實作
- 使用 `registerTool()` 方法和描述性名稱
- 使用 zod 定義輸入和輸出驗證的結構描述
- 提供清晰的 `title` 和 `description` 欄位
- 在結果中同時傳回 `content` 和 `structuredContent`
- 使用 try-catch 區塊實作適當的錯誤處理
- 在適當的情況下支援非同步操作

### 資源/提示設定 (可選)
- 使用 `registerResource()` 和 ResourceTemplate 新增資源以用於動態 URI
- 使用 `registerPrompt()` 和引數結構描述新增提示
- 考慮新增完成支援以提供更好的使用者體驗

### 程式碼品質
- 使用 TypeScript 確保類型安全
- 一致地遵循 async/await 模式
- 在傳輸關閉事件上實作適當的清理
- 使用環境變數進行組態
- 為複雜邏輯新增行內註解
- 以清晰的關注點分離來組織程式碼

## 要考慮的範例工具類型
- 資料處理和轉換
- 外部 API 整合
- 檔案系統操作 (讀取、搜尋、分析)
- 資料庫查詢
- 文字分析或摘要 (帶有取樣)
- 系統資訊擷取

## 組態選項
- **對於 HTTP 伺服器**：
  - 透過環境變數進行連接埠組態
  - 瀏覽器用戶端的 CORS 設定
  - 工作階段管理 (無狀態與有狀態)
  - 本機伺服器的 DNS 重新綁定保護

- **對於 stdio 伺服器**：
  - 適當的 stdin/stdout 處理
  - 基於環境的組態
  - 處理程序生命週期管理

## 測試指南
- 解釋如何執行伺服器 (`npm start` 或 `npx tsx server.ts`)
- 提供 MCP Inspector 命令：`npx @modelcontextprotocol/inspector`
- 對於 HTTP 伺服器，包含連接 URL：`http://localhost:PORT/mcp`
- 包含範例工具呼叫
- 新增常見問題的疑難排解提示

## 要考慮的其他功能
- LLM 驅動工具的取樣支援
- 互動式工作流程的使用者輸入引導
- 具有啟用/停用功能的動態工具註冊
- 用於批量更新的通知去抖動
- 用於高效資料參考的資源連結

產生一個完整、可投入生產的 MCP 伺服器，具有全面的文件、類型安全和錯誤處理。
