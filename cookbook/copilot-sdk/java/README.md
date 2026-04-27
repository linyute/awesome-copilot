# GitHub Copilot SDK 食譜 — Java

此資料夾收錄了使用 GitHub Copilot SDK 搭配 Java 的簡短且實用的食譜。每個食譜都力求簡潔、可直接複製貼上，並指向更完整的範例和測試。所有範例都可以使用 [JBang](https://www.jbang.dev/) 直接執行。

## 食譜

- [Ralph Loop](ralph-loop.md)：建構具有每次反覆運算新上下文、計劃/建構模式以及背壓 (backpressure) 的自主 AI 程式碼編寫迴圈。
- [錯誤處理](error-handling.md)：優雅地處理錯誤，包括連線失敗、逾時和清理。
- [多個工作階段](multiple-sessions.md)：同時管理多個獨立的對話。
- [管理本地檔案](managing-local-files.md)：使用 AI 驅動的分組策略，根據 Metadata 組織檔案。
- [PR 視覺化](pr-visualization.md)：使用 GitHub MCP Server 產生互動式 PR 帳齡圖表。
- [持續性工作階段](persisting-sessions.md)：跨重新啟動儲存並恢復工作階段。
- [協助工具報告](accessibility-report.md)：使用 Playwright MCP server 產生 WCAG 協助工具報告。

## 貢獻

藉由在此資料夾中建立 markdown 檔案並在上方連結它，來新增食譜。請遵循 [CONTRIBUTING.md](../../../CONTRIBUTING.md) 中的儲存庫指南。

## 狀態

這些食譜是完整的實用範例，可以直接使用或針對您自己的專案進行調整。
