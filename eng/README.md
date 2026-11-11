# 貢獻者報告（維護人員） 🚧

此目錄包含用於維護存放庫的建置指令碼與公用程式。

## 建置指令碼

### `update-readme.mjs`
從存放庫內容（agent、prompt、instruction、skill、hook、collection）產生主要的 README.md 與說明文件檔案。

### `generate-marketplace.mjs`
自動從 `plugins/` 資料夾中的所有外掛程式目錄產生 `.github/plugin/marketplace.json`。GitHub Copilot CLI 會使用此檔案來探索並安裝此存放庫中的外掛程式。

**運作方式：**
- 掃描 `plugins/` 中的所有目錄
- 讀取每個外掛程式根目錄的 `plugin.json` 以取得 metadata
- 產生包含所有可用外掛程式的整合 `marketplace.json`
- 作為 `npm run build` 的一部分自動執行

**手動執行方式：**
```bash
npm run plugin:generate-marketplace
```

### `generate-website-data.mjs`
從存放庫內容為網站產生 JSON 資料檔案。

### `review-routing.mjs`
供 Review Routing 與 Review Escalation 工作流程使用的檢閱者路由與檢閱 SLA 呈報。檢閱者集區位於 `.github/review-routing.yml`；請參閱 [docs/maintainers/review-routing.md](../docs/maintainers/review-routing.md)。

```bash
node eng/review-routing.mjs validate      # 驗證 .github/review-routing.yml
node --test eng/review-routing.test.mjs   # 單元測試
```

## 檢閱自動化

詳情請參閱 [docs/maintainers/canvas-evidence-and-metrics.md](../docs/maintainers/canvas-evidence-and-metrics.md)。

- `canvas-smoke-test.mjs` — canvas 延伸模組的靜態檢查、預覽驗證、具體化以及安裝冒煙測試（`canvas-smoke-test` 檢查）。
- `review-metrics.mjs` — 計算每週檢閱營運指標並將其發布至追蹤 issue。
- `lib/review-automation-github.mjs` — `review-metrics.mjs` 所使用的小型 GitHub API 用戶端（在本地使用 `GITHUB_TOKEN` 或 `gh` CLI）。

## 貢獻者工具

- `contributor-report.mjs` — 為缺少的貢獻者產生已合併 PR 的 Markdown 報告（包含共用協助程式）。
- `add-missing-contributors.mjs` — 隨選維護人員指令碼，自動將缺少的貢獻者新增至 `.all-contributorsrc`（從已合併的 PR 檔案推斷貢獻類型，然後執行 all-contributors CLI）。

## 維護人員重要注意事項

- 報告採隨選產生，並輸出至 `reports/contributor-report.md` 以供人工檢閱。
- 報告輸出刻意保持精簡：受影響 PR 的單一清單，以及新增缺少貢獻者的一條指令。
- 此存放庫需要完整的 Git 歷程記錄以進行精確分析。在 CI 中，請設定 `fetch-depth: 0`。
- 連結：[all-contributors CLI 說明文件](https://allcontributors.org/docs/en/cli)

## 隨選指令碼（非 CI）

這些是維護人員公用程式。它們刻意設計為僅隨選使用（但後續可串接至 CI）。

### `add-missing-contributors.mjs`

- 用途：偵測缺少的貢獻者、從其已合併的 PR 檔案推斷貢獻類型，並執行 `npx all-contributors add ...` 以更新 `.all-contributorsrc`。
- 需求：
	- 可用的 GitHub CLI (`gh`)（用於查詢已合併的 PR）。
	- `.all-contributorsrc` 存在。
	- 設定驗證權杖以避免匿名 GitHub 速率限制：
		- 設定 `GITHUB_TOKEN`（慣用），或為 `gh` CLI 設定 `GH_TOKEN`。
		- 若你在本地使用 `PRIVATE_TOKEN`，`contributor-report.mjs` 會將其對應至 `GITHUB_TOKEN`。

## 平緩關閉

- `contributor-report.mjs` 會在檔案開頭呼叫來自 `eng/utils/graceful-shutdown.mjs` 的 `setupGracefulShutdown('script-name')` 以附加訊號／例外狀況處理常式。

## 測試與維護

- 協助程式函式具備小型、確定性的行為，並包含 JSDoc 註解。
- `contributor-report.mjs` 中的 `getMissingContributors` 函式是從 `all-contributors check` 輸出偵測缺少貢獻者的唯一真實來源。
