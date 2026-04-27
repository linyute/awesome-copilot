# GitHub Copilot SDK 食譜 (Cookbook)

本食譜收集了簡短且聚焦的訣竅 (recipes)，展示如何跨語言使用 GitHub Copilot SDK 完成常見任務。每個訣竅都刻意保持簡短且實用，並附上可複製貼上的程式碼片段，以及指向更完整範例和測試的指標。

## 依語言分類的訣竅

### .NET (C#)

- [Ralph Loop](dotnet/ralph-loop.md): 建構自主的 AI 程式碼編寫迴圈，在每次迭代時使用全新的上下文、規劃/建構模式以及背壓 (backpressure)。
- [錯誤處理](dotnet/error-handling.md): 優雅地處理錯誤，包括連線失敗、逾時和清理工作。
- [多重呼叫](dotnet/multiple-sessions.md): 同時管理多個獨立的對話。
- [管理本機檔案](dotnet/managing-local-files.md): 使用 AI 驅動的群組策略，依據 Metadata 來組織檔案。
- [PR 視覺化](dotnet/pr-visualization.md): 使用 GitHub MCP Server 產生互動式的 PR 年齡圖表。
- [持久化呼叫](dotnet/persisting-sessions.md): 在重新啟動後儲存並恢復對話。
- [無障礙報告](dotnet/accessibility-report.md): 使用 Playwright MCP Server 產生 WCAG 無障礙報告。

### Node.js / TypeScript

- [Ralph Loop](nodejs/ralph-loop.md): 建構自主的 AI 程式碼編寫迴圈，在每次迭代時使用全新的上下文、規劃/建構模式以及背壓。
- [錯誤處理](nodejs/error-handling.md): 優雅地處理錯誤，包括連線失敗、逾時和清理工作。
- [多重呼叫](nodejs/multiple-sessions.md): 同時管理多個獨立的對話。
- [管理本機檔案](nodejs/managing-local-files.md): 使用 AI 驅動的群組策略，依據 Metadata 來組織檔案。
- [PR 視覺化](nodejs/pr-visualization.md): 使用 GitHub MCP Server 產生互動式的 PR 年齡圖表。
- [持久化呼叫](nodejs/persisting-sessions.md): 在重新啟動後儲存並恢復對話。
- [無障礙報告](nodejs/accessibility-report.md): 使用 Playwright MCP Server 產生 WCAG 無障礙報告。

### Python

- [Ralph Loop](python/ralph-loop.md): 建構自主的 AI 程式碼編寫迴圈，在每次迭代時使用全新的上下文、規劃/建構模式以及背壓。
- [錯誤處理](python/error-handling.md): 優雅地處理錯誤，包括連線失敗、逾時和清理工作。
- [多重呼叫](python/multiple-sessions.md): 同時管理多個獨立的對話。
- [管理本機檔案](python/managing-local-files.md): 使用 AI 驅動的群組策略，依據 Metadata 來組織檔案。
- [PR 視覺化](python/pr-visualization.md): 使用 GitHub MCP Server 產生互動式的 PR 年齡圖表。
- [持久化呼叫](python/persisting-sessions.md): 在重新啟動後儲存並恢復對話。
- [無障礙報告](python/accessibility-report.md): 使用 Playwright MCP Server 產生 WCAG 無障礙報告。

### Go

- [Ralph Loop](go/ralph-loop.md): 建構自主的 AI 程式碼編寫迴圈，在每次迭代時使用全新的上下文、規劃/建構模式以及背壓。
- [錯誤處理](go/error-handling.md): 優雅地處理錯誤，包括連線失敗、逾時和清理工作。
- [多重呼叫](go/multiple-sessions.md): 同時管理多個獨立的對話。
- [管理本機檔案](go/managing-local-files.md): 使用 AI 驅動的群組策略，依據 Metadata 來組織檔案。
- [PR 視覺化](go/pr-visualization.md): 使用 GitHub MCP Server 產生互動式的 PR 年齡圖表。
- [持久化呼叫](go/persisting-sessions.md): 在重新啟動後儲存並恢復對話。
- [無障礙報告](go/accessibility-report.md): 使用 Playwright MCP Server 產生 WCAG 無障礙報告。

### Java

- [Ralph Loop](java/ralph-loop.md): 建構自主的 AI 程式碼編寫迴圈，在每次迭代時使用全新的上下文、規劃/建構模式以及背壓。
- [錯誤處理](java/error-handling.md): 優雅地處理錯誤，包括連線失敗、逾時和清理工作。
- [多重呼叫](java/multiple-sessions.md): 同時管理多個獨立的對話。
- [管理本機檔案](java/managing-local-files.md): 使用 AI 驅動的群組策略，依據 Metadata 來組織檔案。
- [PR 視覺化](java/pr-visualization.md): 使用 GitHub MCP Server 產生互動式的 PR 年齡圖表。
- [持久化呼叫](java/persisting-sessions.md): 在重新啟動後儲存並恢復對話。
- [無障礙報告](java/accessibility-report.md): 使用 Playwright MCP Server 產生 WCAG 無障礙報告。

## 如何使用

- 瀏覽上方的語言區塊並開啟訣竅連結
- 每個訣竅在 `recipe/` 子資料夾中都包含了可執行的範例以及特定語言的工具
- 查看現有的範例和測試以獲取工作參考：
  - Node.js 範例: `nodejs/examples/basic-example.ts`
  - E2E 測試: `go/e2e`, `python/e2e`, `nodejs/test/e2e`, `dotnet/test/Harness`

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

### Java

```bash
cd java/recipe
jbang <FileName>.java
```

## 貢獻

- 透過在您語言的 `cookbook/` 資料夾中建立 markdown 檔案，以及在 `recipe/` 中建立可執行的範例來提議或新增訣竅
- 請遵循 [CONTRIBUTING.md](../../CONTRIBUTING.md) 中的儲存庫指導方針

## 狀態

食譜結構已完成，在 5 種支援的語言中共有 7 個訣竅。每個訣竅都包含 markdown 文件和可執行的範例。
