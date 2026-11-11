---
name: pr-artifact-explorer
description: '在 Artifact Explorer 畫布中開啟、共用與檢查 GitHub PR、Issue、工作流程執行（包含排程、手動及其他無 PR 的執行）、Actions 工件，以及本機或 HTTP(S) Web 預覽，具備檢視區預設集、縮放、螢幕截圖與可復原的下載作業。'
---

# Artifact Explorer

使用 `pr-artifact-explorer` 畫布向使用者展示 Pull Request、Issue、工作流程執行、Actions 工件與網頁。

## 如何操控畫布

下方的動作名稱（`open_target`、`share`，...）是**畫布動作，而非獨立工具**。永遠執行：

1. 呼叫 `list_canvas_capabilities { canvasId: "pr-artifact-explorer" }` 探索動作及其結構結構描述。
2. 呼叫 `open_canvas { canvasId: "pr-artifact-explorer", instanceId: "<由您選擇的控制代碼>" }` 開啟或聚焦面板。
3. 使用相同的 `instanceId` 呼叫 `invoke_canvas_action { instanceId, actionName, input }`。

## 開啟目標

使用 `open_target { input }` 呼叫 `invoke_canvas_action`（或開啟輸入 `repository`、`pullNumber`、`runId`、`artifactId`、`url`、`route`、帶有執行篩選條件的 `view: "runs"`，加上 `preset`/`width`/`height`/`zoom`）。`input` 接受：

- GitHub PR/Issue URL 或 `owner/repo#123`；Issue 僅顯示詳細資料
- 不需要 PR 的 Actions 連結與請求：`https://github.com/<owner>/<repo>/actions`（亦包含 `?query=event%3Aschedule`、`/actions/workflows/<file>.yml`）、`https://github.com/<owner>/<repo>/actions/runs/<run>`、`owner/repo actions`、`owner/repo run 123`、`show scheduled runs in owner/repo`
- 真實工件永久連結（`https://github.com/<owner>/<repo>/actions/runs/<run>/artifacts/<id>`）、帶有存放庫的工件 ID，或共用的檔案總管連結/路由，例如 `#/docs`、`#/artifact/owner%2Frepo/0/456?file=index.html`、`#/browser?v=...`
- `http(s)://` 與 `localhost` URL（瀏覽器預覽）
- 有限自然語言：`open PR 123 in owner/repo`、`show localhost:3000 on mobile`、`go back`、`zoom 150%`、`tablet`、`1280x720`、`screenshot`

使用 `share { input, preset?, zoom?, width?, height? }` 產生提供給使用者的連結、路由與文字。工件共用保留存放庫/工件/檔案識別（非預覽連接埠）；接收者將其貼入畫布或 `open_target` 中。

## 沒有 Pull Request 的工作流程執行

許多執行沒有 PR：`schedule`（cron）、`workflow_dispatch`、`push`、`release`、`workflow_run` 等。使用 `open_runs { repository, event?, status?, branch?, workflow?, excludePullRequests?, hasArtifacts? }` 開啟存放庫的**工作流程執行**清單（例如 cron 執行為 `event: "schedule"`；`excludePullRequests` 與 `hasArtifacts` 預設為 true，因此傳遞 false 以納入 PR 執行或無工件的執行），以及使用 `open_run { repository, runId }` 開啟單次執行及其工件。適用相同的工件預覽、瀏覽器檢視表、共用與重新執行行為；從執行開啟的工件保留 `?run=<id>` 路由以便導覽列回溯至執行。執行列顯示延遲載入的工件計數；分支篩選器會自動完成真實分支。路由使用 `nopr=0` 與 `artifacts=0` 來關閉這些預設值。

## 工件

`inspect_artifact { repository, artifactId }` 啟動背景作業。下載超過軟性限制仍會繼續；達到限制時會提示使用者輸入更大的數值（`set_limit { kind, value }`；該數值必須至少為目前進度）。檢查 `job_status`；在 `interrupted` 或 `failed` 作業後使用 `retry_job`（會重複使用已完成的 ZIP），且僅在被要求時使用 `cancel_job`。絕不要執行工件程式或建構指令碼：工件僅能作為靜態網站與檔案進行檢查或預覽。

重新執行產生成品的工件工作流程是僅限 UI 的、需使用者確認的動作（工件列或執行頁面上的重新執行按鈕）。切勿自行嘗試或呼叫其 API；若使用者想要全新工件，請告訴他們使用該按鈕。它重複使用原始認可、ref 與執行者，限制在 30 天與 50 次重新執行內，且僅請求執行，而非直接提供現成工件。

## 瀏覽器預覽

- `navigate_browser { url, preset?, zoom? }` 開啟 http(s) URL，包含 localhost。
- `set_viewport { preset: native | mobile | tablet | desktop | custom, width?, height?, orientation? }` 設定模擬的頁面大小。
- `set_zoom { zoom, fit? }` 縮放檢視表而不變更檢視區。
- `screenshot { mode?: "fresh" | "controlled", url?, preset?, width?, height?, fullPage? }` 取得真實 Chromium PNG 並儲存於會話 `files/artifact-explorer-screenshots` 資料夾底下。`fresh`（預設）重新算繪 URL 並標記為 `fresh-render`；`controlled` 擷取即時隔離的 Chromium 頁面（`controlled-current`）。
- `controlled_navigate { url, preset?, ... }`、`controlled_back`、`controlled_forward`、`controlled_refresh`、`controlled_close` 操控帶有真實歷史紀錄的隔離 Chromium（記憶體內設定檔，無登入狀態）；對封鎖 iframe 的網站使用它。導覽失敗作為錯誤傳回，絕不顯示空白頁。若缺少 Playwright 或 Chromium，將傳回的設定指示轉達給使用者（包含已停用之 `PR_ARTIFACT_EXPLORER_PLAYWRIGHT` 變數的 `playwright_config_unsupported` 錯誤）；切勿靜默安裝。
- 禁止嵌入框架（X-Frame-Options / CSP）的頁面會被回報且不會被繞過。

## 預覽檔案

- 僅針對靜態網站 HTML 工件，關聯式**瀏覽器檢視表**動作才會出現在預覽工具列中；它不是全域導覽項目。使用 `open_target` / `navigate_browser` 或 `#/browser?v=...` 路由直接開啟 URL。
- `.webm`、`.mp4` 與 `.mov` 使用內建 `<video controls>` 進行範圍跳轉搜尋（整個項目進行一次 CRC/大小驗證，之後重複使用）。編解碼器支援取決於瀏覽器（WebM VP8/VP9 最可靠；H.264 MP4/MOV 可能無法播放），因此失敗時會顯示說明與下載備用選項。
- 每個檔案在「下載」旁均有緊湊的**預覽 / 原始檔**切換開關（路由中為 `&view=raw`）。原始檔對文字顯示確切原始碼，對二進位檔案顯示受限、標記部分的十六進位+ASCII 檢視表；不安全/加密的項目會說明原因並保留 ZIP 下載。
- 瀏覽器 chrome 與持有的工件 HTML 遵循繼承的畫布佈景主題（初始與即時變更）；受控 Chromium 與擷取遵循目前的色彩架構。外部網站保留其自身的佈景主題。
- **在預設瀏覽器中開啟**（共用與說明功能表）在作業系統瀏覽器中啟動目前的 http(s) 目標。持有的工件網站由此畫布的 loopback 伺服器提供服務，並在畫布關閉時停止。
- JUnit XML（`testsuites`/`testsuite` 根）算繪包含總計、狀態篩選器、搜尋以及 failure/error/skipped/stdout/stderr 詳細資料的原生報告；XML 原始碼與下載維持可用。格式錯誤的報告會退回顯示帶有錯誤的原始碼；其他 XML 使用一般檢視器。

## 復原

若畫布表現異常，呼叫 `restart_canvas`：它保留連接埠、權杖與執行中的作業。使用 `docs` 開啟內建的 Docs 標籤頁，其中也列出鍵盤快速鍵（按 `?`）。
