# Canvas 檢閱佐證與檢閱指標

本指引涵蓋 [#4184](https://github.com/github/awesome-copilot/issues/4184) 的第 3 階段（「安全加速」）：

1. [Canvas 檢閱佐證](#canvas-review-evidence)：`canvas-smoke-test` 檢查。
2. [每週營運指標](#weekly-operating-metrics)：`.github/review-metrics.yml` 與 `.github/workflows/review-metrics.yml`。
3. [延後實施：自動合併](#deferred-auto-merge)。
4. [移植至 MOS3 的可行性](#portability-to-mos3)。

第 1 階段負責檢閱者路由（CODEOWNERS、`.github/review-routing.yml`、檢閱者標籤）。第 2 階段負責 `submission-gate` 檢查、`merge-risk:*` 層級以及狀態標籤。本階段取用這些訊號，並在它們尚不存在時順暢降級。

## Canvas review evidence

### 執行項目

`.github/workflows/canvas-smoke-test.yml` 會在對 `main` 提出且變更 `extensions/**`、`plugins/**` 或檢查器及其工作流程的 PR 上執行。它會先執行檢查器的目標偵測，而無需安裝相依套件或 Copilot CLI；一般未新增、移除或參考 canvas 延伸模組的純外掛程式變更會略過耗時的步驟。Canvas 延伸模組仍然僅在 `extensions/` 下提交，因此 `validate-canvas-extensions.yml` 保留其現有範圍且未變更。`canvas-smoke-test` 作業回報：

- **略過（成功）**：當 PR 未變更任何 canvas 延伸模組或包含延伸模組的外掛程式路徑時（包括一般的純外掛程式變更與純檢查器／工作流程變更）。
- **通過（已接受移除）**：當延伸模組目錄與其外掛程式皆已刪除時。若僅刪除 `extension.mjs`，或保留仍參考已刪除延伸模組（或曾為其直接外掛程式）的外掛程式，則會失敗。
- **通過或失敗**：在其他情況下，由 `.github/scripts/canvas/canvas-smoke-test.mjs` 判定。

針對每個受影響的延伸模組，檢查器會執行：

| 領域 | 檢查項目 |
|---|---|
| 模組圖 | 剖析 `extension.mjs` 與每個可連線的本地模組**而不執行它** (`vm.SourceTextModule` / `vm.compileFunction`)。連線能力依循靜態匯入、常值動態 `import()` 呼叫以及常值 CommonJS `require()` 呼叫（字串、範本常值與正規表示式內具呼叫形式的文字會被忽略）。`package.json` 的 `imports` 別名 (`#name`) 透過相同的檢查進行解析；檢查器無法分析的別名形式會失敗。每個可連線的參考都必須解析至延伸模組內部的檔案、Node.js 內建功能、主機提供的 `@github/copilot-sdk` 或執行階段相依性 (`dependencies`、`optionalDependencies`、`peerDependencies`)。遠端 (`http:`/`https:`)、`data:`、絕對路徑、`..`、缺少、僅限 `devDependencies` 以及未宣告的參考均會失敗。無法從 `extension.mjs` 連線的模組（通常是提供給 canvas webview 的瀏覽器資產）則會產生警告。 |
| 檔案 | 缺少被參考的檔案、不安全的路徑（`..`、絕對路徑、`file:` URL）、符號連結、已認可的 `node_modules`、原生二進位檔（ELF、PE、Mach-O、`.node`、`.dll`、`.so`、WebAssembly）、可執行的 Git 模式以及超過 5 MB 的檔案均會失敗。Shell、批次檔、PowerShell、Python、Ruby 與 Perl 指令碼、shebang 檔案以及無法識別的二進位檔會回報為給檢閱者的警告。 |
| 預覽 | `assets/preview.png` 必須存在、能解碼為真正的 PNG（簽章、區塊 CRC、`IHDR`、調色盤、`IEND`、解壓縮影像資料與篩選器位元組）、大小最多 5 MB、解碼後最多 256 MiB 的影像資料（在解壓縮前檢查），並符合最小尺寸。 |
| 外掛程式 | 在暫存複本中以 `.github/scripts/catalog/materialize-plugins.mjs` 實體化外掛程式，針對 Agent Plugins 結構描述驗證所提供的 `plugin.json`，並確認 `com.github.copilot/extensions/<id>/extension.mjs` 存在。 |
| 安裝 | 使用 GitHub Copilot CLI 從暫時本地市集安裝已實體化的外掛程式，在移除所有權杖的隔離 `COPILOT_HOME` 中執行，並透過 `copilot plugin list --json` 進行驗證。CI 使用 `--install require`。 |
| 功能宣告 | 摘要延伸模組所使用的功能（例如檔案系統、子處理程序、網路、`process.env`、動態程式碼），讓檢閱者能與宣告的用途進行比對。 |

預覽最小尺寸預設為 **400 × 160 px**。每個現有的預覽皆符合此標準；最小的分別為 475 × 440、720 × 165、544 × 306 與 657 × 270。可透過存放庫變數 `CANVAS_PREVIEW_MIN_WIDTH` 與 `CANVAS_PREVIEW_MIN_HEIGHT` 變更下限，或在本地使用 `--min-preview-width` 與 `--min-preview-height`。

### 檢閱成品

該作業會將精簡報告寫入作業摘要，並上傳 `canvas-smoke-test-results` 成品（保留 7 天），其中包含 `report.md`、`results.json` 與預覽影像。報告包含外掛程式與延伸模組的 metadata、已變更檔案、功能摘要、預覽以及每項驗證與冒煙測試結果。

`.github/workflows/canvas-smoke-test-comment.yml` 遵循存放庫的讀取者／寫入者分離原則。讀取者 (`canvas-smoke-test.yml`) 使用唯讀權杖且無任何密碼安全性資料來執行不受信任的 PR 內容。寫入者從 `main` 透過 `workflow_run` 執行，並在寫入前將成品繫結至觸發的執行：PR 必須以此存放庫為目標，其來源存放庫、分支與 SHA 必須與該執行相符，且必須出現在 `workflow_run.pull_requests` 中或是具備該 head 的唯一開啟 PR。它還會消除 `@` 提及，並更新標記有 `<!-- canvas-smoke-test -->` 的單一 PR 評論。對於從未產生報告的略過 PR，它不會發表評論。

### 在本機執行

```bash
node .github/scripts/canvas/canvas-smoke-test.mjs --all --install never          # 每個延伸模組，不進行 CLI 安裝
node .github/scripts/canvas/canvas-smoke-test.mjs --changed-files changed.txt   # 僅限 diff 涉及的內容
node --test .github/scripts/canvas/canvas-smoke-test.test.mjs
```

結束代碼：`0` 通過或略過，`1` 貢獻問題，`2` 基礎結構錯誤。

### 選用的錯誤交接

位於 `.github/extensions/` 下的存放庫本地 canvas 提供
針對已處理錯誤的**傳送至代理人**動作。錯誤邊欄托盤採外加形式：現有的
訊息、遞補 UI、重試與復原控制項仍可使用。托盤
使用正常的文件流，移至作用中對話方塊／抽屜的互動範圍內，
且不會覆蓋決策控制項。關閉
僅會移除托盤項目；它不會重試操作或啟動代理人。
位於 `extensions/` 下的公開 canvas 不包含此功能。
預期的重新連線通知、本地驗證指引與內容失效
警告保留其現有呈現方式，不提供修復交接。
預期的 API 通知在回應與轉譯器中皆帶有 `handoff: false`，因此
擷取擷取動作無法將可復原的衝突轉變為修復請求。實際的
部分失敗，包含 GitHub 動作之後失敗的本地回條，仍符合資格。
詳細檢視檢驗也保留此分類，包含過期項目與
自掃描後變更的資源。重設後重新載入失敗仍符合資格；
交接絕不會重複執行重設。

按一下**傳送至代理人**會在 `github/awesome-copilot` 中請求一個子專案工作階段
以調查並嘗試修正。托盤會在傳送前顯示
有界限且已遮蔽的診斷文字。上下文包含延伸模組
來源目錄、canvas、操作與已列入允許清單的存放庫／項目識別碼，
而非請求主體、標頭、環境變數、原始堆疊、URL 查詢字串
或片段。常見認證、完整的 Authorization/Proxy-Authorization 與
Cookie/Set-Cookie 欄位以及私密金鑰在兩側都會被遮蔽，並進行具界限的
輸入處理。已解碼的 JSON 字串欄位在重新序列化前會被遮蔽。
JSON 診斷訊息（包含前綴 JSON 以及編碼在字串欄位內的 JSON）
在進行文字遮蔽前會以具界限的巢狀深度進行檢查。無效或不完整
的內嵌 JSON 會以保守方式取代而非直接轉發。
在傳送前請檢閱顯示的文字；切勿在錯誤訊息中包含機敏資料。
子工作階段已受指示不得進行認可、推送、發布 PR、變更認證或
重複破壞性／遠端操作。

受支援的延伸模組 API 會加入目前工作階段；它不會直接
建立應用程式子工作階段。因此，交接會使用 `session.send` 向父
代理人傳送請求，而父代理人會使用 `create_session`，並透過 canvas 的
`record_error_handoff` 動作回報實際傳回的子項識別碼（或建立錯誤）。
**訊息准入不代表成功。**當父代理人
處於忙碌或等待核准時，托盤會保持擱置狀態。自初始分派起經過兩分鐘
仍未獲得確認（包括停滯的網路請求或回應主體），它會指示使用者
檢查父對話；它絕不會自動建立另一個子項。分派失敗、
子項建立失敗與不確定的回條仍保持可見，而非顯示
成功的交接。傳輸拒絕屬於不確定的分派，而非最終的
建立失敗：托盤在相同的期限內保持輪詢，並在不重新傳送提示的情況下
接受相符的子項回條。
分派完成絕不封鎖狀態輪詢，因此即使訊息傳輸
尚未平穩，記錄的回條仍可使用。
關閉 canvas 會使未完成的回條失效。
回條保持可見，直到明確關閉；新的診斷不會驅逐它們。
交接 POST 也需要隨機的每個執行個體功能權杖，僅在
canvas URL 片段中傳遞，而非透過 HTTP 提供的 HTML 或指令碼傳遞。僅憑 Origin 與 Host 標頭無法
授權交接，且一個執行個體無法讀取或提交另一個執行個體的請求。
支援已註冊的 `127.0.0.1` 與 `localhost` URL，且 Origin 必須
與完全相符的已註冊 Host 一致，同時連線仍限制在 loopback。
權杖絕不包含在診斷提示中，並在 canvas 關閉時過期。

實作位於 `.github/scripts/canvas/error-handoff/runtime.mjs` 中。每個適用的
存放庫本地 canvas 皆包含一份產生的 `error-handoff.mjs` 複本，以使其
延伸模組保持自包含。同步指令碼僅針對
`.github/extensions/`。在規範標準模組中進行變更，然後重新產生：

```bash
node .github/scripts/canvas/sync-canvas-error-handoff.mjs
node .github/scripts/canvas/sync-canvas-error-handoff.mjs --check
node --test .github/scripts/canvas/canvas-error-handoff.test.mjs
```

Canvas 進入點使用其支援的 SDK `createCanvas` 與 `joinSession` 函式來設定協助程式；
HTTP 伺服器則使用其 `createServer` 包裝器。只有
已註冊的 canvas 文件會取得用戶端指令碼。其他 HTML、成品預覽、
下載、SSE 與 API 回應保留其原始傳遞行為。現有的
CSP（包含僅限 nonce 與僅限行內的指令碼原則）均予以保留。

用戶端會偵測失敗的同源擷取以及明確標記為看板擁有的
錯誤介面（包含標記的失敗浮動通知），但不包括轉譯的 Markdown／檔案內容。
缺少輸入的提示與其他預期的工作流程通知不會標記為進行交接。
取消與內容失效通知不是修復錯誤。完全相同的
已遮蔽訊息在文件生命週期內共用一次交接，即使在關閉後亦然；
第一項操作會保留為上下文。
對於沒有語意錯誤選取器的錯誤，僅將失敗狀態標記為
`data-agent-error`（在復原時清除），或呼叫
`window.canvasErrorHandoff?.report(message, operation)`。切勿標記成功
浮動通知、整個文件、使用者內容或包含認證的容器。
這些看板中的其他錯誤表面應使用標記或回報 API。

## 每週營運指標

`.github/workflows/review-metrics.yml` 於每週一 14:00 UTC 以及隨選執行。`.github/scripts/review/review-metrics.mjs` 收集唯讀資料，然後：

- 將報告寫入作業摘要並上傳 `review-metrics` 成品（`metrics.json` 與 `report.md`，保留 90 天）；
- 更新標有 `review-metrics` 的追蹤 issue 內容，首次執行時會建立並置頂它；
- 將該週的報告作為評論新增至該 issue，以使趨勢保持可見。

### 定義

所有時間皆為 UTC。時間範圍為前 `window_days`（預設為 7）天。機器人撰寫的 PR 會從貢獻計數與檢閱時間中排除。**維護人員檢閱**是指具備寫入權限且非 PR 作者亦非機器人的使用者所提交的檢閱。

| 指標 | 定義 |
|---|---|
| 依狀態劃分的開啟中貢獻 | 針對 `main` 開啟的非草稿貢獻 PR，依第 2 階段狀態標籤分組；沒有狀態標籤的 PR 為 `unlabeled`。開啟的 `external-plugin` issue 則依其狀態標籤分組。 |
| 依風險層級劃分的開啟中貢獻 | 相同的 PR 依 `merge-risk:*` 分組；沒有風險層級標籤的 PR 為 `unclassified`。 |
| 初次檢閱時間 | 針對在此時間範圍內獲得第一次維護人員檢閱的 PR：初次檢閱時間減去建立時間與最後 ready-for-review 事件中較晚發生者。在該開始時間之前提交的檢閱（例如在 PR 回退至草稿之前）會被忽略。中位數與 p90（線性插值），以實際經過的小時數或天數計算。 |
| 合併時間 | 針對在此時間範圍內合併的 PR：合併時間減去建立時間。中位數與 p90。 |
| 每個維護人員的檢閱數 | 在該時間範圍內提交的維護人員檢閱次數，以及各維護人員檢閱的不同 PR 數量。 |
| 檢閱者集中度 | 基於每個維護人員檢閱的不同 PR 數量。**最高檢閱者佔比**為最忙碌維護人員的佔比。**HHI**（赫芬達爾-赫希曼指數）為平方佔比總和 × 10,000：10,000 表示一位檢閱者處理了所有工作，高於 2,500 即代表高度集中。**有效檢閱者數**為 1 除以未縮放的 HHI。 |
| 超過 2 個與 4 個工作天的項目 | 等待維護人員時間超過各目標的項目：自計時開始以來沒有維護人員檢閱且沒有 `requires-submitter-fixes` 的開啟中非草稿 PR（計時於建立或最後一次 ready-for-review 事件開始），以及標有 `ready-for-review` 或 `awaiting-approval` 的 `external-plugin` issue（計時於最後一次新增該標籤時開始）。工作天僅計算星期一至星期五，非整天以分數計算。 |
| 自動化失敗率 | 針對所設定的 `automation_workflows`：在時間範圍內建立且結論為 `failure`、`timed_out` 或 `startup_failure` 的執行次數，除以已完成的執行次數（排除 `cancelled`、`skipped`、`neutral`、`action_required` 與 `stale`）。尚未存在的工作流程列為 "not found"。 |

`.github/review-metrics.yml` 設定時間範圍、目標、標籤集、工作流程與追蹤 issue。缺少標籤絕不會導致錯誤。

### 在本機執行

```bash
node .github/scripts/review/review-metrics.mjs --repo github/awesome-copilot --dry-run --output-dir ./metrics
node --test .github/scripts/review/review-metrics.test.mjs
```

## 延後實施：自動合併

本階段曾提出安全的自動合併方案，但已在合併前移除。從自動化機制啟用 GitHub 自動合併會將繞過存放庫與組織政策（必要檢閱者與 Copilot 程式碼檢閱核准）的做法規則化，且其觸發條件會擴大受攻擊面；此存放庫不使用 `pull_request_target` ([#2625](https://github.com/github/awesome-copilot/pull/2625))。該功能延後至維護人員與 GitHub 安全團隊一起檢核此做法後再行實施。在那之前，一旦 `submission-gate` 通過，維護人員便會合併 PR。

## 移植至 MOS3 的可行性

#4184 自動化由存放庫本機設定與自包含指令碼驅動，因此另一個存放庫（例如 MOS3）可以透過複製檔案與編輯設定而非修改程式碼來採用它。

| 成品 | 階段 | 如何移植 | 存放庫專屬設定 |
|---|---|---|---|
| 包含團隊擁有者的 `CODEOWNERS` | 1 | 複製結構 | 團隊名稱與路徑模式 |
| `.github/review-routing.yml` | 1 | 複製並編輯 | 檢閱者集區、目標、呈報 |
| `.github/risk-tiers.yml` | 2 | 複製並編輯 | 路徑與風險分類規則 |
| `submission-gate` 檢查 | 2 | 複製工作流程與指令碼 | 各層級的必要檢查；僅在存在 canvas 延伸模組之處納入 `canvas-smoke-test` |
| `canvas-smoke-test` (`.github/scripts/canvas/canvas-smoke-test.mjs`, `canvas-smoke-test.yml`, `canvas-smoke-test-comment.yml`) | 3 | 在存放庫提供 canvas 延伸模組與 `.github/scripts/catalog/materialize-plugins.mjs` 的情況下原樣複製 | `CANVAS_PREVIEW_MIN_WIDTH` 與 `CANVAS_PREVIEW_MIN_HEIGHT` 變數 |
| `.github/review-metrics.yml`, `.github/scripts/review/review-metrics.mjs`, `.github/workflows/review-metrics.yml` | 3 | 原樣複製 | 狀態與風險標籤、自動化工作流程清單、追蹤 issue 標題 |
| `.github/scripts/review/lib/review-automation-github.mjs` | 3 | 原樣複製 | 無（使用 `GITHUB_TOKEN` 或 `gh` CLI） |

第 3 階段指令碼僅依賴 Node.js 22 與 `js-yaml`。工作流程將自動執行限制在 `github.repository_owner == 'github'`；移植時請更新該條件。`.github/workflows/setup-labels.yml` 會建立 `review-metrics` 標籤。

### 其他市集：`microsoft/azure-dev-tools`

[`microsoft/azure-dev-tools`](https://github.com/microsoft/azure-dev-tools) 是另一個 Copilot 外掛程式市集 (`copilot plugin marketplace add microsoft/azure-dev-tools`，市集 ID 為 `azure-dev-tools`)。它提供諸如 `azure-functions-hosted-skills`、`azure-resources-query`、`azure-cost-health-check` 與 `azure-sre-agent` 等 canvas 外掛程式，以及純 skill 的 `canvas-authoring` 外掛程式。它可以重複使用相同的檢閱模型：CODEOWNERS 團隊、`review-routing.yml`、風險層級、`submission-gate`、`canvas-smoke-test` 與指標工作流程。

- **直接對應：**
  - Canvas 冒煙測試與預覽佐證：模組圖、功能摘要、不安全路徑、二進位檔與 `assets/preview.png` 檢查。
  - 風險層級與 `submission-gate` 規則。
  - 每週指標。
- **差異之處：**
  - 這些外掛程式為第一方且由 Microsoft 擁有，因此資源所有權更多來自 CODEOWNERS 團隊而非貢獻者 front matter。貢獻者歷程記錄訊號在該處較不重要。
  - 其發行版本固定至各外掛程式不可變動的標籤，而 awesome-copilot 則從預設分支實體化外掛程式。請將冒煙測試的安裝步驟指向該發行標籤的外掛程式來源。將發行標籤或版本提升視為其專屬的風險層級，且一律需要維護人員檢閱。
  - 沒有 canvas 延伸模組的外掛程式（例如 `canvas-authoring`）會將 `canvas-smoke-test` 回報為略過。該檢查的版面配置偵測（`extensions/<id>/` 加上相符的 `plugins/<id>/plugin.json`）可能需要根據該存放庫的結構進行調整。
