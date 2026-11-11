--- name: 'webmcpify' description:
'WebMCP 代理技能 — 將任何 Web
應用程式具可驗證性地具備代理能力：透過原生瀏覽器模型上下文（命令式或宣告式表單）盤點使用者動作、
提出並取得工具資訊清單核准、實作與供應商化執行階段、修復並驗證。當使用者要求為網站或
Web 應用程式新增 WebMCP/代理人工具時使用。' ---

# webmcpify — 讓任何 Web 應用程式可驗證地就緒以支援代理人

你正在執行 webmcpify 管線。它接受現有的 Web
應用程式，並透過符合規格的 WebMCP 工具（原生命令式
`document.modelContext` 或宣告式
HTML 表單）使其對瀏覽器端 AI
代理人可操作。每個階段皆產生可檢查的成效；每個工具在宣稱完成之前皆在真實瀏覽器中經過驗證。

```
DETECT ──▶ INVENTORY ──▶ [HUMAN GATE: manifest approval] ──▶ INTEGRATE ──▶ VERIFY ──▶ HEAL ──▶ AUDIT
              ▲  loop            per-area batches on big apps    ▲  loop      ▲ loop    ▲ loop
              └── per area                                       └── per manifest entry ──┘
```

你所需的一切皆隨附於此技能目錄中：`references/`
中的階段指引、`templates/`
中的可複製執行階段與測試載具檔案，以及 `scripts/`
中的輔助程式。除了用於驗證的 Chrome 或 Playwright 之外，目標專案不需要安裝任何套件。

**超出範圍**（請停下並說明）：純後端 MCP 伺服器（此為一般 MCP
領域）；在不受支援的過舊瀏覽器上進行深度相容性填補（此 API 仰賴現代瀏覽器能力）。

## 叫用模式

使用者可傳遞引數（`/webmcpify <mode>` 或純文字）：

| 引數 | 執行內容 | 停止於 |
|---|---|---|
| *(無)* | 完整管線 | 報告 |
| `inventory` | 僅偵測 + 盤點 | 閘門（輸出資訊清單草案） |
| `integrate` | 偵測、盤點、閘門、整合 | 驗證之前 |
| `verify` | 偵測並驗證現有工具 | 報告 |
| `heal` | 驗證並修復失敗 | 報告 |
| `workbench` | 啟動視覺檢查工作台 | 互動式主控台 |

任何其他文字皆為範圍界定指引（例如「僅限結帳區域」、「跳過管理員檢視表」）。

## 基本原則（不可協商，在每個階段皆強制執行）

1.
**零無關變更。**
產生的每個
diff
區塊都必須追溯至明確的工具實作或整合需求。
2.
**人工閘門至高無上。**
未經明確核准的資訊清單，絕不整合任何異動型工具。
3.
**安全來源是硬性前提。**
驗證永遠在安全上下文（HTTPS
或
localhost）中執行。
4.
**供應商化而非增加相依性。**
執行階段檔案直接複製至專案中，
不引入額外的外部套件。
5.
**異動操作絕無自動提交。**
禁止在異動型表單上加入
`toolautosubmit`。
6.
**誠實命名與結構描述。**
動詞開頭，忠實反映立即執行與流程起始的差異。
7.
**嚴格的錯誤邊界。**
任何無效輸入皆在呼叫副作用前被攔截並傳回結構化錯誤。








8.
**清理異動副作用。**
異動型測試必須在每次執行之間清除測試資料。

9.
**瀏覽器存取範圍限於目標應用程式。
**
使用專屬的測試設定檔與隔離上下文，
絕不重複使用或存取
個人的日常認證資訊與
瀏覽歷程。

## 最新且具權威性的指引

在階段 2 之前，請閱讀目前的 [Chrome
指南](https://developer.chrome.com/docs/ai/webmcp)
與 [CG
草案](https://webmachinelearning.github.io/web-machine-learning-model-context-protocol/)。它們記錄了原生
API 與宣告式表單屬性。

閱讀指引無需執行任何套件。
若使用者選擇使用特定工具鏈，


請遵循相應的說明文件。

## 狀態協定 — 目標儲存庫中的 `.webmcpify/`

| 檔案 | 用途 |
|---|---|
| `manifest.json` | 經核准的工具清單與狀態 |
| `manifest.lock` | 跨行程鎖定與日誌保護 |
| `report.md` | 最終審核與驗證報告 |
| `evidence/` | 產生的測試實證與執行日誌 |

**繼續執行規則：**
若
`manifest.json`
存在，重用已記錄的成果，
其契約修訂版與
程式碼庫修訂版相符。
僅重新評估受程式碼變更影響的項目。

盤點判定唯
有在產生它
的原則下才
可重複使用。
若原則指紋變更，


請重新執行盤點。

**階段轉換**（在條件滿足的瞬間進行不可分割的資訊清單寫入）：

- `detect →
inventory`: 已記錄
`app`，`app.secureContext
=== true` 已在真實瀏覽器中確認。
- `inventory → gate`:
已建立完整的候選工具清單與區域對應。 -
`gate → integrate`:
人工已核准資訊清單中的工具集合。 -
`integrate → verify`:
已完成執行階段供應商化與工具連接。 -
`verify → heal`:
存在失敗的工具斷言需要介入修復。 -
`heal → audit`: 所有工具皆達終態（`verified`、`skipped` 或 `rejected`）。

資訊清單結構描述（Webmcpify Manifest v4）：

```jsonc
{
  "webmcpify": 4,
  // Omit until the helper's first execution-capable open; it then writes and preserves this UUID.
  "mutationLockIdentity": "2d734e2d-1537-41a7-b8b5-0af6e932019e",
  "app": { "stack": "react-vite", "typescript": true, "entry": "src/main.tsx",
           "baseUrl": "https://app.example.test", "startCommand": "npm run dev",
           "verificationOrigin": "https://app.example.test",
           "secureContext": true,
           "backendOrigins": ["http://localhost:3000"],
           "corsAllowlist": ["https://app.example.test"],
           "authFixtures": {                    // how verify OBTAINS each session
             "member": { "obtain": "npm run seed:test-user, then sign in at /login",
                         "account": "member@example.test",
                         "env": ["TEST_MEMBER_PASSWORD"] }  // env var NAMES only — never secret values
           } },
  "pipeline": {
    "phase": "inventory",          // detect|inventory|gate|integrate|verify|heal|audit|done — transition rules above
    "coverageTarget": "parity",     // REQUIRED before inventory: "curated" | "parity"; never silently default
    "inventoryPolicy": {
      "revision": 1,
      "fingerprint": "sha256:<normalized-gates>",
      "gates": {
        "identity": "exclude auth/login/session/password/MFA/SSO",
        "tenancy_billing": "exclude signup/registration/payment/billing/subscription",
        "credentials": "exclude tools returning credentials/tokens/keys/JWTs/signed URLs/cookies",
        "irreversible_delete": "only open the app's own confirmation UI"
      }
    },
    "setup": {                     // PATHS created/modified per one-time setup step ([] = not done yet)
      "runtimeVendored": ["src/webmcp/webmcpify.ts", "src/webmcp/webmcp.d.ts"],
      "harnessInstalled": [".webmcpify/webmcp.spec.ts", ".webmcpify/webmcp-compat.js", ".webmcpify/mutation-journal.ts", ".webmcpify/mutation-journal.js"],
      "originTrialNoted": ["README.md"]
    },
    "discovery": null,             // optional off-page layer (references/discovery.md). Stays null unless
                                   //   the human approves publishing; then, written BEFORE the first file:
                                   //   { "at": "2026-08-06",
                                   //     "publishedTools": ["get_faq"], // ids cleared for PUBLIC listing
                                   //     "paths": [],                   // artifacts, appended AS each is written ([] = none yet)
                                   //     "complete": false }            // true only when every artifact exists and the drift test passes
                                   //   Absent field = null. A record written before this key existed has no
                                   //   `complete`: read that as false, re-check the artifacts, persist the flag.
    "baselineSha": "abc1234",      // HEAD at pipeline start; null if no git
    "baselineDirty": ["src/wip.ts"], // paths dirty at start — untouchable (ground rule 1)
    "commitPolicy": null,          // set at the gate: "commit-per-batch" | "no-commit"
    "commitWebmcpifyDir": null,    // set at the gate: commit .webmcpify/ itself? true | false
    "blockers": []                 // e.g. "app won't start locally: needs $API_KEY" — surfaced at the gate
  },
  "areas": [
    { "id": "tickets", "paths": ["src/features/tickets/"], "routes": ["/projects/:id/tickets"],
      "status": "inventoried",      // pending|inventoried
      "policyFingerprint": "sha256:<normalized-gates>",
      "exclusions": [{ "gate": "identity", "reason": "login form" }] }
  ],
  "routeCoverage": [
    { "route": "/projects/:id/tickets", "area": "tickets", "auth": ["role:member"],
      "interactions": [
        { "element": "New ticket button", "source": "src/features/tickets/List.tsx:42",
          "tool": "create_ticket", "reason": null },
        { "element": "Account menu", "source": "src/layout/AccountMenu.tsx:18",
          "tool": null, "reason": "identity gate: logout/session action" }
      ] }
  ],
  "tools": [
    {
      "id": "create_ticket",
      "area": "tickets",
      "kind": "imperative",        // imperative | declarative
      "mutating": "server",        // false | "client" (browser-local only: prefs, localStorage) | "server" (data leaves the browser)
      "priority": 1,               // 1 = expose first; 2/3 = later waves
      "description": "Creates a new ticket in the currently open project.",
      "inputSchema": { /* JSON Schema */ },
      "annotations": { "readOnlyHint": false, "untrustedContentHint": false, "consequentialHint": false }, // verify asserts all recorded hints
      "source": ["src/features/tickets/NewTicket.tsx:42"], // the UI code path it wraps
      "route": "/projects/demo/tickets",                    // where verify navigates
      "auth": ["role:member"],     // "none" | "session" | ["role:<name>", ...] — keys into app.authFixtures; verify runs once per listed role
      "examples": { "valid": { "title": "Test ticket" }, "invalid": {} },
                                   // invalid: null ONLY for readOnlyHint tools with no/empty params —
                                   // verify then asserts dual-outcome: rejects OR resolves with no side effect
      "expect": { "result": "created", "navigation": null, "ui": "new row appears in the ticket list" },
                                   // result = substring of the serialized structured result;
                                   // navigation = destination URL/pattern after a declarative submit or deferred imperative route action
      "cleanup": "delete the created ticket via the UI's own delete path (test data only)", // required for mutating:"server", recommended for "client"
      "status": "discovered",      // discovered|approved|rejected*|integrated|verified*|failed|skipped*  (* = terminal)
      "approval": null,            // server-mutating tools, once approved: { "note": "...", "at": "2026-07-12",
                                   //   "productionSideEffect": null } — set only when verification unavoidably
                                   //   causes a real production effect (see VERIFY: production side-effect policy)
      "contractRevision": 1,
      "mutationExecutions": [],    // durable pre-dispatch journal; references/reverify.md
      "verifiedAgainst": null,     // successful evidence record; see references/reverify.md (absent = unknown)
      "failure": null,             // on failure: { "class": "contract|implementation|environment|external-policy|flaky|client-capacity", "signature": "...", "contractRevision": 1 }
      "attempts": 0,               // independent retries of this failure signature under this contract revision
      "batchCommit": null,         // sha under commit-per-batch — lands in the manifest one commit LATER
      "notes": ""
    }
  ],
  "log": [ "2026-07-12 inventory: area checkout done, 4 candidates" ]
}
```

**v2/v3→v4
遷移：**
首先執行現有的轉換邏輯，
並在新結構中保留舊有的實證記錄。
初始化
`mutationE
xecutions:
[]`。

## 階段 0 — 偵測 (DETECT)

**第一個瀏覽器閘門是安全上下文。**
僅讀取足以啟動應用程式的設定，接著在
Chromium
中開啟候選來源並斷言
`window.isSecureContext
=== true`。若未通過，請立即停止並報告。

擷取應用程式對後端來源的絕對路徑假設與確切的
CORS
允許清單。
在記錄的測試載具來源上驗
證應用程式是否能正常啟動。

在盤點之前明確選擇
`pipeline.coverageT
arget`：`curated`（預設，
≤15
個高價值動作）或
`complete`（完整巡訪並對應所有可操作檢視表）。

識別技術堆疊、建構與
開發伺服器指令、
是否使用
TypeS
cript、
驗證模式以及
是否有現有
的測試設定。

## 階段 1 — 盤點 (INVENTORY)（迴圈；可調整至任何規模）

**絕不要單次嘗試盤點整個大型程式碼庫。**

1.
**區域對應優先（輕量、
結構化）：**
列舉路由/檢視表/功能區域，


建立系統化清單。
2.
**循序巡訪區域：**
針對每個區域辨識使用者動作，
決定候選工具名稱與型別。
3.
**分類風險與異動性：**
標記
`mutating
`（`false`、
`"client"`、
`"server"`）與
相關註解提示。
4.
**排除受管制項目：**
套用安全原則閘門，
將驗證/計費等敏感
動作排除並記錄理由。

## 閘門 — 資訊清單核准（主要的檢查點）

簡潔呈現資訊清單（ID、
區域、種類、異動性、
優先順序、一行摘要），並要求人類明確裁決：

1. 哪些工具被
`approved`
與
`rejected`（
**`rejected`
是終態**，管線不會再嘗試整合它）。
2.
對於異動型工具，
確認其副作用可被接受且具備相應的清理路徑。
3.
是否核准真實生產副作用的重放驗證（若適用）。



若人類變更了範圍閘門，請更新
`pipeline.inventoryPolicy`，
記錄核准時間，並推進至階段
2。

在將任何異動型工具呈現給人類之前，對其套用 `references/security.md` 的所有安全檢核項目。

## 階段 2 — 整合 (INTEGRATE)（迴圈）

首先進行單次設定 —
記錄在資訊清單
`pipeline.ve
ndoredFiles`
中所建立/修改的
檔案**路徑**。
從範本複製執行階段檔案至專案中。

1. 選取下一批
`approved`
工具 —
一個區域或 ≤5
個工具。 2.
針對宣告式工具，為
`<form>`
加上
`toolname`、說明與
`respondWith()`
橋接。 3.
針對命令式工具，在專用模組中建立結構描述與處理常式，並在
UI
掛載時註冊工具範圍。

**選用的
探索層**
—
`/.we
ll-kn
own/w
ebmcp`
資訊清單。
僅在取得
明確的人
工揭露授
權時建立，
且僅包含公開無
認證的工具子集。

## 選用 — 工作台 (WORKBENCH)（視覺檢查）

當使用者要求以視覺化方式檢查或試用工具時，請參閱
`references/workbench.md`。





代理人負責啟動並在事後停止工作台處理程序。

工作台永遠是唯讀的
：僅能列出觀察到的、
未被排除且已核准的資訊清單工具。


禁止透過工作台發
出未經核准的異動。

使用核准的資訊清單作為預期實證，



並將即時頁面作為觀
察實證進行逐項核對。

## 階段 3 — 驗證 (VERIFY)（迴圈）

從
`templates/we
bmcp.spec.ts`
加上隨附的主機端相容性輔助函式與



日誌通訊協定進行單次設定。
在真實瀏覽器中執行斷言。

-
斷言工具已成功註冊且結構描述符合預期。
-
斷言以有效輸入呼叫時產生正確的結構化傳回值。
-
斷言以無效輸入呼叫時被正確拒絕並傳回清楚的錯誤訊息。




通過 → `"verified"`。失敗
→ `"failed"` +
失敗附註。角色範圍的工具在每個記錄的角色下皆必須成功通過驗證。

**生產副作用政策**
—
當工具的驗證無可避免地接觸即時外部端點時，
唯有在閘門取得明確核准的情況下才可執行重放驗證；
否則標記為
`skipped`。

## 階段 4 — 修復 (HEAL)（迴圈）

在每次重試前保留並協調異動日誌項目；




根據
`reference
s/heal.md`
對失敗進行分類。
修復針對實作，而非契約。
若修復需要修改結構描述或說明，
請帶回閘門重新核准。
連續三次獨立重試失敗後，
將該工具標記為
`skipped`
並記錄完整實證。

**結束條件：** 每個工具皆為 `verified`、`skipped` 或 `rejected`；建構通過且無回溯錯誤。

## 最終階段 — 稽核 (AUDIT) + 報告

1.
**Diff
稽核（僅旗標標記，
絕不自動還原）：**
收集管線接觸的所有檔案，
確認無任何無關變更。
2.
**安全性與原則檢查：**
依據
`references/
security.md`
進行最後審核。
3. **產生
`report.md`：**
包含已驗證工具清單、涵蓋範圍摘要、手動
QA
步驟以及任何已跳過項目的理由。

## 參考資料（依需求閱讀，非預先研讀）

- `references/inventory.md` — 區域對應、命名/結構描述慣例、預算與原則閘門。
- `references/integrate.md` — 依技術堆疊分類的整合模式、生命週期與宣告式表單。
- `references/runtime.md` — 執行階段 API、完成契約與取消處理。
- `references/verify.md` — 瀏覽器環境、測試載具設定與評估指引。
- `references/heal.md` — 失敗分類學、重放模式與修復指南。
- `references/security.md` — 威脅模型、原則與人機協同檢核清單。
- `references/discovery.md` — 發布中繼資料與第三方稽核指引。
- `references/workbench.md` — 視覺檢查器與互動契約。
- `references/reverify.md` — 變更後的重新驗證與耐久日誌通訊協定。
