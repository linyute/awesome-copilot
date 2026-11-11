# Microsoft Copilot SDK Cookbook

本食譜彙整了簡短且聚焦的範例，說明如何使用 Microsoft Copilot SDK，以不同程式語言完成常見工作。SDK 正分階段從 GitHub Copilot SDK 過渡而來，目前不需要立即進行任何變更。這些範例中的套件名稱、命名空間和儲存庫連結，仍維持目前發布的形式；詳情請參閱[官方過渡公告](https://github.blog/changelog/2026-10-28-github-copilot-sdk-is-becoming-microsoft-copilot-sdk/)。每個範例都刻意保持簡短實用，並提供可直接複製貼上的程式碼片段，以及更完整範例和測試的參考連結。

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
- [處理程序內執行階段](java/in-process-runtime.md): 將原生 Copilot 執行階段程式庫載入 JVM 程序中，而非另行啟動獨立的執行階段程序。

## 如何使用

- 瀏覽上方的語言區塊並開啟訣竅連結
- 每個訣竅在 `recipe/` 子資料夾中都包含了可執行的範例以及特定語言的工具
- 如需依特定版本參考，請查看官方 SDK 儲存庫 `java/v1.0.21` 標籤中的現有範例和測試：
  - [Node.js 範例](https://github.com/github/copilot-sdk/blob/java/v1.0.21/nodejs/examples/basic-example.ts)
  - 端對端測試：[Go](https://github.com/github/copilot-sdk/tree/java/v1.0.21/go/internal/e2e)、[Python](https://github.com/github/copilot-sdk/tree/java/v1.0.21/python/e2e)、[Node.js](https://github.com/github/copilot-sdk/tree/java/v1.0.21/nodejs/test/e2e)、[.NET](https://github.com/github/copilot-sdk/tree/java/v1.0.21/dotnet/test/Harness)、[Java](https://github.com/github/copilot-sdk/tree/java/v1.0.21/java/sdk/src/test/java/com/github/copilot/e2e)

## 執行範例

執行範例前，請先參閱您所使用語言之食譜 README 中的先決條件：

 - [.NET](dotnet/recipe/README.md#prerequisites)
 - [Node.js](nodejs/recipe/README.md#prerequisites)
 - [Python](python/recipe/README.md#prerequisites)
 - [Go](go/recipe/README.md#prerequisites)
 - [Java](java/recipe/README.md#prerequisites)

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

此食譜涵蓋 5 種語言：.NET 和 Java 各有 8 個範例，Node.js、Python 和 Go 則各有 7 個共用範例。每個範例都包含 Markdown 說明文件和可執行的程式碼。
