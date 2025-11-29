---
description: '使用 TypeScript SDK 建構模型上下文協定 (MCP) 伺服器的指示'
applyTo: '**/*.ts, **/*.js, **/package.json'
---

# TypeScript MCP 伺服器開發

## 指示

- 使用 **@modelcontextprotocol/sdk** npm 套件: `npm install @modelcontextprotocol/sdk`
- 從特定路徑匯入: `@modelcontextprotocol/sdk/server/mcp.js`, `@modelcontextprotocol/sdk/server/stdio.js` 等。
- 使用 `McpServer` 類別 進行高階伺服器實作，並自動處理協定
- 使用 `Server` 類別 進行低階控制，並手動處理請求
- 使用 **zod** 進行輸入/輸出綱要驗證: `npm install zod@3`
- 始終為工具、資源和提示提供 `title` 欄位，以獲得更好的 UI 顯示
- 對於 HTTP 伺服器，請使用 `StreamableHTTPServerTransport` 搭配 Express 或類似框架
- 對於本地整合，請使用 `StdioServerTransport` 進行基於 stdio 的通訊
- 每個請求建立新的傳輸實例，以防止請求 ID 衝突 (無狀態模式)
- 對於有狀態伺服器，使用 `sessionIdGenerator` 進行會話管理
- 為本地伺服器啟用 DNS 重新綁定保護: `enableDnsRebindingProtection: true`
- 配置 CORS 標頭並公開 `Mcp-Session-Id` 以供基於瀏覽器的用戶端使用
- 使用 `ResourceTemplate` 處理帶有 URI 參數的動態資源: `new ResourceTemplate('resource://{param}', { list: undefined })`
- 使用 `@modelcontextprotocol/sdk/server/completable.js` 中的 `completable()` 包裝函式支援更好的使用者體驗補全
- 使用 `server.server.createMessage()` 實作取樣，以從用戶端請求 LLM 補全
- 使用 `server.server.elicitInput()` 在工具執行期間請求額外的使用者輸入
- 啟用通知去抖動以進行批量更新: `debouncedNotificationMethods: ['notifications/tools/list_changed']`
- 動態更新: 對已註冊的項目呼叫 `.enable()`、`.disable()`、`.update()` 或 `.remove()` 以發出 `listChanged` 通知
- 使用 `@modelcontextprotocol/sdk/shared/metadataUtils.js` 中的 `getDisplayName()` 獲取 UI 顯示名稱
- 使用 MCP Inspector 測試伺服器: `npx @modelcontextprotocol/inspector`

## 最佳實踐

- 保持工具實作專注於單一職責
- 為 LLM 理解提供清晰、描述性的標題和描述
- 為所有參數和回傳值使用正確的 TypeScript 類型
- 使用 try-catch 區塊實作全面的錯誤處理
- 在工具結果中回傳 `isError: true` 以表示錯誤情況
- 對於所有非同步操作使用 async/await
- 正確關閉資料庫連線並清理資源
- 在處理之前驗證輸入參數
- 使用結構化日誌進行偵錯，而不會污染 stdout/stderr
- 在公開檔案系統或網路存取時考慮安全性影響
- 在傳輸關閉事件上實作適當的資源清理
- 使用環境變數進行配置 (埠、API 密鑰等)
- 清晰地文件化工具功能和限制
- 使用多個用戶端進行測試以確保相容性

## 常見模式

### 基本伺服器設定 (HTTP)
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const server = new McpServer({
    name: 'my-server',
    version: '1.0.0'
});

const app = express();
app.use(express.json());

app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });
    
    res.on('close', () => transport.close());
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

app.listen(3000);
```

### 基本伺服器設定 (stdio)
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
    name: 'my-server',
    version: '1.0.0'
});

// ... 註冊工具、資源、提示 ...

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 簡單工具
```typescript
import { z } from 'zod';

server.registerTool(
    'calculate',
    {
        title: '計算機',
        description: '執行基本計算',
        inputSchema: { a: z.number(), b: z.number(), op: z.enum(['+', '-', '*', '/']) },
        outputSchema: { result: z.number() }
    },
    async ({ a, b, op }) => {
        const result = op === '+' ? a + b : op === '-' ? a - b : 
                      op === '*' ? a * b : a / b;
        const output = { result };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output
        };
    }
);
```

### 動態資源
```typescript
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

server.registerResource(
    'user',
    new ResourceTemplate('users://{userId}', { list: undefined }),
    {
        title: '使用者設定檔',
        description: '擷取使用者設定檔資料'
    },
    async (uri, { userId }) => ({
        contents: [{
            uri: uri.href,
            text: `使用者 ${userId} 的資料在此`
        }]
    })
);
```

### 帶有取樣的工具
```typescript
server.registerTool(
    'summarize',
    {
        title: '文字摘要器',
        description: '使用 LLM 摘要文字',
        inputSchema: { text: z.string() },
        outputSchema: { summary: z.string() }
    },
    async ({ text }) => {
        const response = await server.server.createMessage({
            messages: [{
                role: 'user',
                content: { type: 'text', text: `摘要: ${text}` }
            }],
            maxTokens: 500
        });
        
        const summary = response.content.type === 'text' ? 
            response.content.text : '無法摘要';
        const output = { summary };
        return {
            content: [{ type: 'text', text: JSON.stringify(output) }],
            structuredContent: output
        };
    }
);
```

### 帶有補全的提示
```typescript
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';

server.registerPrompt(
    'review',
    {
        title: '程式碼審查',
        description: '專注於特定方面的程式碼審查',
        argsSchema: {
            language: completable(z.string(), value => 
                ['typescript', 'python', 'javascript', 'java']
                    .filter(l => l.startsWith(value))
            ),
            code: z.string()
        }
    },
    ({ language, code }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `審查此 ${language} 程式碼:\n\n${code}`
            }
        }]
    })
);
```

### 錯誤處理
```typescript
server.registerTool(
    'risky-operation',
    {
        title: '危險操作',
        description: '可能失敗的操作',
        inputSchema: { input: z.string() },
        outputSchema: { result: z.string() }
    },
    async ({ input }) => {
        try {
            const result = await performRiskyOperation(input);
            const output = { result };
            return {
                content: [{ type: 'text', text: JSON.stringify(output) }],
                structuredContent: output
            };
        } catch (err: unknown) {
            const error = err as Error;
            return {
                content: [{ type: 'text', text: `錯誤: ${error.message}` }],
                isError: true
            };
        }
    }
);
```
