# 貢獻者報告 (維護者) 🚧

此目錄包含一個輕量級的協助工具，用於產生關於缺失貢獻者的人類可讀報告。

- `contributor-report.mjs` — 為缺失的貢獻者產生已合併 PR 的 markdown 報告 (包含共用的協助工具)。
- `add-missing-contributors.mjs` — 隨選的維護者腳本，可自動將缺失的貢獻者新增至 `.all-contributorsrc` (從已合併的 PR 檔案中推斷貢獻類型，然後執行 all-contributors 命令列介面)。

## 維護者重點筆記

- 報告是隨選產生的，並輸出至 `reports/contributor-report.md` 以供人工檢視。
- 報告輸出刻意保持極簡：單一的受影響 PR 列表，以及一個用於新增缺失貢獻者的指令。
- 此儲存庫需要完整的 git 歷史紀錄以進行精確分析。在 CI 中，請設定 `fetch-depth: 0`。
- 連結：[all-contributors 命令列介面文件](https://allcontributors.org/docs/en/cli)

## 隨選腳本 (非 CI)

這些是維護者公用程式。它們刻意設計為僅限隨選 (但稍後可以整合至 CI 中)。

### `add-missing-contributors.mjs`

- 目的：偵測缺失的貢獻者，從其已合併的 PR 檔案中確定其貢獻類型，並執行 `npx all-contributors add ...` 以更新 `.all-contributorsrc`。
- 需求：
	- 具備 GitHub 命令列介面 (`gh`) (用於查詢已合併的 PR)。
	- `.all-contributorsrc` 檔案存在。
	- 已設定驗證權杖以避免匿名 GitHub 速率限制：
		- 設定 `GITHUB_TOKEN` (偏好)，或為 `gh` 命令列介面設定 `GH_TOKEN`。
		- 如果您在本地端使用 `PRIVATE_TOKEN`，`contributor-report.mjs` 會將其對應至 `GITHUB_TOKEN`。

## 優雅關閉

- `contributor-report.mjs` 在檔案開頭呼叫來自 `eng/utils/graceful-shutdown.mjs` 的 `setupGracefulShutdown('script-name')`，以掛載訊號/異常處理程式。

## 測試與維護

- 協助函式具有小型、確定性的行為，並包含 JSDoc 註解。
- `contributor-report.mjs` 中的 `getMissingContributors` 函式是從 `all-contributors check` 輸出中偵測缺失貢獻者的唯一事實來源。
