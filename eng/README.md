# 貢獻者報告 (維護者) 🚧

此目錄包含用於維護儲存庫的建構指令碼和公用程式。

## 建構指令碼

### `update-readme.mjs`
從儲存庫內容（代理程式、提示詞、指示、技能、勾點、集合）產生主要的 README.md 和文件檔案。

### `generate-marketplace.mjs`
從 `plugins/` 資料夾中的所有外掛程式目錄自動產生 `.github/plugin/marketplace.json`。GitHub Copilot CLI 使用此檔案來探索並安裝此儲存庫中的外掛程式。

**運作方式：**
- 掃描 `plugins/` 中的所有目錄
- 讀取每個外掛程式的 `.github/plugin/plugin.json` 以取得 Metadata
- 產生包含所有可用外掛程式的合併 `marketplace.json`
- 作為 `npm run build` 的一部分自動執行

**手動執行：**
```bash
npm run plugin:generate-marketplace
```

### `generate-website-data.mjs`
從儲存庫內容產生網站的 JSON 資料檔案。

## 貢獻者工具

- `contributor-report.mjs` — 為遺漏的貢獻者產生已合併 PR 的 Markdown 報告（包含共用的輔助函式）。
- `add-missing-contributors.mjs` — 隨需維護者指令碼，自動將遺漏的貢獻者新增至 `.all-contributorsrc`（從合併的 PR 檔案推斷貢獻類型，然後執行 all-contributors CLI）。

## 維護者注意事項

- 報告是隨需產生的，並輸出到 `reports/contributor-report.md` 以供人工檢閱。
- 報告輸出刻意保持極簡：受影響 PR 的單一清單，以及一個用於新增遺漏貢獻者的指令。
- 此儲存庫需要完整的 Git 歷程記錄以進行精確分析。在 CI 中，請設定 `fetch-depth: 0`。
- 連結：[all-contributors CLI 文件](https://allcontributors.org/docs/en/cli)

## 隨需指令碼（非 CI）

這些是維護者公用程式。它們刻意僅限於隨需執行（但稍後可以連接到 CI）。

### `add-missing-contributors.mjs`

- 目的：偵測遺漏的貢獻者，從其合併的 PR 檔案推斷貢獻類型，並執行 `npx all-contributors add ...` 以更新 `.all-contributorsrc`。
- 需求：
	- 可使用 GitHub CLI (`gh`)（用於查詢已合併的 PR）。
	- `.all-contributorsrc` 已存在。
	- 設定驗證權杖以避免匿名 GitHub 速率限制：
		- 設定 `GITHUB_TOKEN`（建議），或為 `gh` CLI 設定 `GH_TOKEN`。
		- 如果您在本地使用 `PRIVATE_TOKEN`，`contributor-report.mjs` 會將其對應至 `GITHUB_TOKEN`。

## 優雅關機

- `contributor-report.mjs` 在檔案開頭處呼叫來自 `eng/utils/graceful-shutdown.mjs` 的 `setupGracefulShutdown('script-name')` 以附加訊號/異常處理常式。

## 測試與維護

- 輔助函式具有小型、決定性的行為，並包含 JSDoc 註解。
- `contributor-report.mjs` 中的 `getMissingContributors` 函式是從 `all-contributors check` 輸出中偵測遺漏貢獻者的單一事實來源。
