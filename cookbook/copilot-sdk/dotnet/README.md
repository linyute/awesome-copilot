# Microsoft Copilot SDK 食譜 — .NET (C#)

此資料夾收錄使用 Microsoft Copilot SDK 搭配 .NET 的簡短實用食譜。套件名稱與程式碼範例反映了目前從 GitHub Copilot SDK 分階段轉型的狀況。

## 食譜

- [錯誤處理](error-handling.md)：優雅地處理錯誤，包括連線失敗、逾時與清理。
- [多個工作階段](multiple-sessions.md)：同時管理多個獨立的對話。
- [管理本機檔案](managing-local-files.md)：使用 AI 驅動的分組策略，按 Metadata 組織檔案。
- [PR 視覺化](pr-visualization.md)：使用 GitHub MCP 伺服器產生互動式 PR 時長圖表。
- [持續性工作階段](persisting-sessions.md)：跨重新啟動儲存並恢復工作階段。
- [Ralph Loop](ralph-loop.md)：執行無人值守的代理循環，反覆迭代任務直至完成。
- [協助工具報告](accessibility-report.md)：稽核網頁的無障礙問題並即時串流結果。
- [程序內執行階段](in-process-runtime.md)：在程序內執行 Copilot 執行階段，而非啟動獨立的 CLI 程序。

## 貢獻

藉由在此資料夾中建立 Markdown 檔案並在上方建立連結來新增食譜。遵循 [CONTRIBUTING.md](../../../CONTRIBUTING.md) 中的儲存庫指引。

## 狀態

這些食譜現已完成並可供使用；隨著新場景的增加，此 Cookbook 將持續演進。
