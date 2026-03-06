# 可執行的食譜範例

此資料夾包含針對每份 Cookbook 食譜的獨立、可執行的 TypeScript 範例。每個檔案都可以直接使用 `tsx` 或透過 npm 指令碼執行。

## 先決條件

- Node.js 18 或更高版本
- 安裝相依性（這會連結至儲存庫中的本機 SDK）：

```bash
npm install
```

## 執行範例

每個 `.ts` 檔案都是一個完整、可執行的程式。您可以用兩種方式執行它們：

### 使用 npm 指令碼：

```bash
npm run <指令碼名稱>
```

### 直接使用 tsx：

```bash
npx tsx <檔名>.ts
```

### 可用的食譜

| 食譜                 | npm 指令碼                     | 直接命令                          | 說明                                       |
| -------------------- | ------------------------------ | --------------------------------- | ------------------------------------------ |
| 錯誤處理             | `npm run error-handling`       | `npx tsx error-handling.ts`       | 示範錯誤處理模式                           |
| 多個工作階段         | `npm run multiple-sessions`    | `npx tsx multiple-sessions.ts`    | 管理多個獨立的對話                         |
| 管理本機檔案         | `npm run managing-local-files` | `npx tsx managing-local-files.ts` | 使用 AI 分組組織檔案                       |
| PR 視覺化            | `npm run pr-visualization`     | `npx tsx pr-visualization.ts`     | 產生 PR 時長圖表                           |
| 持續性工作階段       | `npm run persisting-sessions`  | `npx tsx persisting-sessions.ts`  | 跨重新啟動儲存並恢復工作階段               |

### 帶有引數的範例

**針對特定儲存庫的 PR 視覺化：**

```bash
npx tsx pr-visualization.ts --repo github/copilot-sdk
```

**管理本機檔案（先編輯檔案以更改目標資料夾）：**

```bash
# 先編輯 managing-local-files.ts 中的 targetFolder 變數
npx tsx managing-local-files.ts
```

## 本機 SDK 開發

`package.json` 使用 `"*"` 引用本機 Copilot SDK，這會解析為本機 SDK 原始碼。這意味著：

- 對 SDK 原始碼的變更會立即生效
- 無需從 npm 發佈或安裝
- 非常適合測試與開發

如果您修改了 SDK 原始碼，可能需要重新建置：

```bash
cd ../../src
npm run build
```

## TypeScript 功能

這些範例使用現代 TypeScript/Node.js 功能：

- 頂層 await (Top-level await)（需要在 package.json 中設定 `"type": "module"`）
- ESM 匯入
- 使用 TypeScript 的型別安全
- async/await 模式

## 學習資源

- [TypeScript 文件](https://www.typescriptlang.org/docs/)
- [Node.js 文件](https://nodejs.org/docs/latest/api/)
- [GitHub Copilot SDK for Node.js](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md)
- [上層 Cookbook](../README.md)
