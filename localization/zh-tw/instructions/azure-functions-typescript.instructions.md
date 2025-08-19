---
description: 'Azure Functions 的 TypeScript 模式'
applyTo: '**/*.ts, **/*.js, **/*.json'
---

## 程式碼產生指引
- 產生現代化的 Node.js TypeScript 程式碼
- 非同步程式碼請使用 `async/await`
- 優先使用 Node.js v20 內建模組，避免額外安裝套件
- 一律使用 Node.js 非同步函式，例如用 `node:fs/promises` 取代 `fs`，避免阻塞事件迴圈
- 新增任何額外相依套件前，請先徵詢意見
- API 以 Azure Functions 並使用 `@azure/functions@4` 套件建構
- 每個端點應有獨立函式檔案，命名規則為：`src/functions/<resource-name>-<http-verb>.ts`
- 當 API 有變更時，請同步更新 OpenAPI 原理圖（如有）及 `README.md` 文件
