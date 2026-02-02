# GitHub Copilot SDK Cookbook

此 Cookbook 收集了小型、專注的食譜，展示如何使用 GitHub Copilot SDK 跨語言完成常見任務。每份食譜都刻意保持簡短且實用，包含可複製貼上的片段以及指向更完整範例與測試的指標。

## 按語言分類的食譜

### .NET (C#)

- [錯誤處理](dotnet/error-handling.md)：優雅地處理錯誤，包括連線失敗、逾時與清理。
- [多個工作階段](dotnet/multiple-sessions.md)：同時管理多個獨立的對話。
- [管理本機檔案](dotnet/managing-local-files.md)：使用 AI 驅動的分組策略，按 Metadata 組織檔案。
- [PR 視覺化](dotnet/pr-visualization.md)：使用 GitHub MCP 伺服器產生互動式 PR 時長圖表。
- [持續性工作階段](dotnet/persisting-sessions.md)：跨重新啟動儲存並恢復工作階段。

### Node.js / TypeScript

- [錯誤處理](nodejs/error-handling.md)：優雅地處理錯誤，包括連線失敗、逾時與清理。
- [多個工作階段](nodejs/multiple-sessions.md)：同時管理多個獨立的對話。
- [管理本機檔案](nodejs/managing-local-files.md)：使用 AI 驅動的分組策略，按 Metadata 組織檔案。
- [PR 視覺化](nodejs/pr-visualization.md)：使用 GitHub MCP 伺服器產生互動式 PR 時長圖表。
- [持續性工作階段](nodejs/persisting-sessions.md)：跨重新啟動儲存並恢復工作階段。

### Python

- [錯誤處理](python/error-handling.md)：優雅地處理錯誤，包括連線失敗、逾時與清理。
- [多個工作階段](python/multiple-sessions.md)：同時管理多個獨立的對話。
- [管理本機檔案](python/managing-local-files.md)：使用 AI 驅動的分組策略，按 Metadata 組織檔案。
- [PR 視覺化](python/pr-visualization.md)：使用 GitHub MCP 伺服器產生互動式 PR 時長圖表。
- [持續性工作階段](python/persisting-sessions.md)：跨重新啟動儲存並恢復工作階段。

### Go

- [錯誤處理](go/error-handling.md)：優雅地處理錯誤，包括連線失敗、逾時與清理。
- [多個工作階段](go/multiple-sessions.md)：同時管理多個獨立的對話。
- [管理本機檔案](go/managing-local-files.md)：使用 AI 驅動的分組策略，按 Metadata 組織檔案。
- [PR 視覺化](go/pr-visualization.md)：使用 GitHub MCP 伺服器產生互動式 PR 時長圖表。
- [持續性工作階段](go/persisting-sessions.md)：跨重新啟動儲存並恢復工作階段。

## 如何使用

- 瀏覽上方的語言章節並開啟食譜連結
- 每份食譜都在 `recipe/` 子資料夾中包含可執行的範例，並附帶特定語言的工具
- 查看現有的範例與測試以獲取工作參考：
  - Node.js 範例：`nodejs/examples/basic-example.ts`
  - E2E 測試：`go/e2e`、`python/e2e`、`nodejs/test/e2e`、`dotnet/test/Harness`

## 執行範例

### .NET

```bash
cd dotnet/cookbook/recipe
dotnet run <filename>.cs
```

### Node.js

```bash
cd nodejs/cookbook/recipe
npm install
npx tsx <filename>.ts
```

### Python

```bash
cd python/cookbook/recipe
pip install -r requirements.txt
python <filename>.py
```

### Go

```bash
cd go/cookbook/recipe
go run <filename>.go
```

## 貢獻

- 藉由在您語言的 `cookbook/` 資料夾中建立一個 Markdown 檔案，並在 `recipe/` 中建立一個可執行的範例，來提議或新增一份新食譜
- 遵循 [CONTRIBUTING.md](../../CONTRIBUTING.md) 中的儲存庫指引

## 狀態

Cookbook 結構已完成，包含所有 4 種受支援語言的 4 份食譜。每份食譜都包含 Markdown 文件與可執行範例。
