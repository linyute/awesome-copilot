# ⚡ 代理型工作流程 (Agentic Workflows)

[代理型工作流程](https://github.github.com/gh-aw) 是在 GitHub Actions 中執行編碼代理程式的 AI 驅動存放區自動化。這些工作流程以 Markdown 搭配自然語言指引定義，可實作事件觸發與排程的自動化，並具備內建護欄與安全性優先設計。
### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-agentic-workflows) 以獲取有關如何貢獻新工作流程、改進現有工作流程以及分享您的使用案例的準則。

### 如何使用代理型工作流程

**包含內容：**
- 每個工作流程都是一個包含 YAML Front Matter 與自然語言指引的獨立 `.md` 檔案
- 工作流程透過 `gh aw compile` 編譯為 `.lock.yml` GitHub Actions 檔案
- 工作流程遵循 [GitHub 代理型工作流程規格](https://github.github.com/gh-aw)

**安裝方式：**
- 安裝 `gh aw` CLI 延伸模組：`gh extension install github/gh-aw`
- 將工作流程 `.md` 檔案複製到您存放區的 `.github/workflows/` 目錄
- 使用 `gh aw compile` 進行編譯以產生 `.lock.yml` 檔案
- 同時提交 `.md` 與 `.lock.yml` 檔案

**啟動/使用方式：**
- 工作流程根據其配置的觸發條件 (排程、事件、斜線命令) 自動執行
- 使用 `gh aw run <workflow>` 手動觸發執行
- 使用 `gh aw status` 與 `gh aw logs` 監控執行狀況

**何時使用：**
- 自動化問題分類與標籤指派
- 產生每日狀態報告
- 自動維護文件
- 執行排程程式碼品質檢查
- 回應問題與 PR 中的斜線命令
- 編排多步驟的存放區自動化

| 名稱 | 說明 | 觸發條件 |
| ---- | ----------- | -------- |
| [OSPO 組織健康報告](../workflows/ospo-org-health.md) | GitHub 組織的每週全面健康報告。突顯過期 Issue/PR、合併時間分析、貢獻者排行榜，以及需要人員關注的可執行項目。 | schedule, workflow_dispatch |
| [OSPO 貢獻者報告](../workflows/ospo-contributors-report.md) | 組織儲存庫中的每月貢獻者活動指標。 | schedule, workflow_dispatch |
| [OSPO 過時儲存庫報告](../workflows/ospo-stale-repos.md) | 識別組織中非作用中的儲存庫，並產生封存建議報告。 | schedule, workflow_dispatch |
| [每日 Issue 報告](../workflows/daily-issues-report.md) | 產生每日未解決 Issue 與近期活動的摘要，並以 GitHub Issue 形式呈現 | schedule |
| [每週註解同步](../workflows/weekly-comment-sync.md) | 每週執行的工作流程，旨在尋找過時的程式碼註解或 README 片段，進行僅限文字的同步更新，並在需要變更時開啟一個草稿提取請求。 | schedule, workflow_dispatch |
| [開源釋出合規檢查器](../workflows/ospo-release-compliance-checker.md) | 針對開源釋出需求分析目標儲存庫，並將詳細的合規報告作為 Issue 留言發佈。 | issues, workflow_dispatch |
| [關聯性摘要 (Relevance Summary)](../workflows/relevance-summary.md) | 手動觸發的工作流程，將所有帶有 /relevance-check 回應的未結 Issue 與 PR 彙總到單一 Issue 中 | workflow_dispatch |
| [關聯性檢查 (Relevance Check)](../workflows/relevance-check.md) | 評估 Issue 或 Pull Request 是否仍與專案相關的斜線指令 | slash_command, roles |
