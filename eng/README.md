# 貢獻者回報（維護者）🚧

此目錄包含用於維護本倉庫的建構腳本與工具。

## 建構腳本

### `update-readme.mjs`
根據倉庫內容（agents、prompts、instructions、skills、hooks、collections）產生主要的 README.md 與文件。

### `generate-marketplace.mjs`
會自動根據 `plugins/` 資料夾中的所有 plugin 目錄，產生 `.github/plugin/marketplace.json`。此檔案供 GitHub Copilot CLI 用來從本倉庫發現並安裝 plugins。

**運作方式：**
- 掃描 `plugins/` 中的所有目錄
- 讀取每個 plugin 根目錄下的 `plugin.json` 以取得 Metadata
- 產生一份彙整所有可用 plugins 的 `marketplace.json`
- 作為 `npm run build` 的一部分自動執行

**手動執行：**
```bash
npm run plugin:generate-marketplace
```

### `generate-website-data.mjs`
根據倉庫內容為網站產生 JSON 資料檔案。

### `review-routing.mjs`
供 Review Routing 與 Review Escalation 工作流使用的審查者路由（routing）與審查 SLA 升級。審查者集（pools）位於 `.github/review-routing.yml`；請參閱 [docs/maintainers/review-routing.md](../docs/maintainers/review-routing.md)。

```bash
node eng/review-routing.mjs validate      # 驗證 .github/review-routing.yml
node --test eng/review-routing.test.mjs   # 單元測試
```

## 貢獻者工具

- `contributor-report.mjs` — 為缺少貢獻者的已合併 PR 產生 Markdown 回報（包含共用 helper 函式）。
- `add-missing-contributors.mjs` — 按需執行的維護者腳本，會自動將缺少的貢獻者新增至 `.all-contributorsrc`（從已合併 PR 的檔案推斷貢獻類型，然後執行 all-contributors CLI）。

## 維護者重要事項

- 回報為按需產生，並輸出至 `reports/contributor-report.md` 供人工檢視。
- 回報輸出刻意保持精簡：一份受影響 PR 的清單，以及一個用來新增缺少貢獻者的指令。
- 本倉庫需要完整的 git 歷史才能精確分析。在 CI 中請設定 `fetch-depth: 0`。
- 連結：[all-contributors CLI 文件](https://allcontributors.org/docs/en/cli)

## 按需腳本（非 CI）

這些是維護者工具。刻意設計為僅按需執行（日後也可整合進 CI）。

### `add-missing-contributors.mjs`

- 目的：偵測缺少的貢獻者，從其已合併 PR 的檔案推斷貢獻類型，並執行 `npx all-contributors add ...` 以更新 `.all-contributorsrc`。
- 需求：
	- 已安裝 GitHub CLI（`gh`），用於查詢已合併的 PR。
	- `.all-contributorsrc` 存在。
	- 已設定驗證 token，以避免匿名 GitHub 速率限制：
		- 設定 `GITHUB_TOKEN`（優先），或為 `gh` CLI 設定 `GH_TOKEN`。
		- 若你在本機使用 `PRIVATE_TOKEN`，`contributor-report.mjs` 會將其對應到 `GITHUB_TOKEN`。

## 正常結束

- `contributor-report.mjs` 會在檔案開頭呼叫來自 `eng/utils/graceful-shutdown.mjs` 的 `setupGracefulShutdown('script-name')`，以掛載訊號／例外處理程式。

## 測試與維護

- Helper 函式行為小且具確定性，並包含 JSDoc 註解。
- `contributor-report.mjs` 中的 `getMissingContributors` 函式，是根據 `all-contributors check` 輸出偵測缺少貢獻者的單一真實來源（single source of truth）。
