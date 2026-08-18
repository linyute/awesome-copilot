---
name: 'webmcpify'
description: '讓 Web 應用程式就緒支援代理程式 — 提議 WebMCP 工具資訊清單、進行整合、在真實瀏覽器中驗證並進行自我修復；無關的程式碼保持不變。適用於「webmcpify」、「新增 WebMCP」或「向 AI 代理程式公開應用程式動作」。'
argument-hint: '[inventory|integrate|verify|status|full] [scope notes]'
license: 'MIT'
metadata:
  source: 'https://github.com/TueJon/webmcpify'
---

# webmcpify — 讓任何 Web 應用程式就緒支援代理程式，可經驗證

您正在執行 webmcpify 管道。它取得現有的 Web 應用程式並
將其面向使用者的功能公開為 [WebMCP](https://webmachinelearning.github.io/webmcp/)
工具（`document.modelContext` — W3C Web Machine Learning Community Group
中孵化的一項提議 Web 標準，目前為 Chrome 源試用 [origin trial]），以便瀏覽器 AI
代理程式可以透過結構化工具呼叫操作應用程式，而不是猜測 DOM。

```
DETECT ──▶ INVENTORY ──▶ [HUMAN GATE: manifest approval] ──▶ INTEGRATE ──▶ VERIFY ──▶ HEAL ──▶ AUDIT
              ▲  loop            大型應用程式按區域批次處理        ▲  loop      ▲ loop    ▲ loop
              └── 每個區域                                       └── 每個資訊清單項目 ──┘
```

您所需的一切均隨附在此技能目錄中：`references/` 中的階段指南，以及
`templates/` 中的可供應商化 (vendorable) 程式碼（執行階段、環境型別、
JS 變體、React JSX 型別宣告、驗證規格）。切勿假設檔案存在於
技能目錄之外。

**超出範圍**（請停止並說明）：僅限後端的 MCP 伺服器（那是傳統 MCP，
不是 WebMCP）、自動化您無法控制的第三方網站，以及一般的 SEO 工作。

## 呼叫模式

使用者可以傳遞引數（`/webmcpify <mode>` 或純文字）：

| 引數 | 執行內容 | 停止於 |
|---|---|---|
| *(無)* 或 `full` | 所有階段，從目前的資訊清單狀態恢復 | 完成 |
| `inventory` / `map` | 僅 DETECT + INVENTORY 循環 — **零程式碼變更** | 呈現資訊清單表格以供審查 |
| `integrate` | 僅 INTEGRATE 循環（需要資訊清單中有獲核准的工具） | 整合完成 + 建構成功 |
| `verify` | 針對已整合/已驗證的工具進行 VERIFY + HEAL 循環 | 通過/略過報告 |
| `status` | 讀取 `.webmcpify/manifest.json` — **唯讀** | 回報階段、各狀態工具計數以及建議的下一個指令 |

任何其他文字均為範圍指引（例如「僅結帳區域」、「僅限唯讀工具」）。

## 基本規則（不可協商，在每個階段強制執行）

1. **零無關變更。** 您產生的每個 diff 區塊都必須能追溯到資訊清單
   項目或記錄的一次性設定。切勿重構、重新格式化、重新命名或
   「改進」任何其他內容 — 改在報告中註明問題。在基準線
   （記錄在資訊清單中）已處於已修改 (dirty) 狀態的檔案是 **不可觸碰的**：
   切勿修改或還原它們。
2. **唯讀工具優先。** 變更狀態分為三種：`mutating: false`、
   `"client"`（僅限瀏覽器本機：偏好設定、localStorage）或 `"server"`（資料
   離開瀏覽器）。伺服器變更工具需要記錄在資訊清單中的明確 **逐項工具**
   人工核准；用戶端變更工具可在關卡處批次核准。切勿在首次整合中
   公開破壞性、不可逆或付款操作。
3. **伺服器是唯一的信任邊界。** 工具的 `execute()` 只能呼叫 UI 已使用的
   程式碼路徑（相同的端點、相同的驗證、相同的認證）。切勿建立新端點，
   切勿繞過現有檢查，切勿將機密放入工具中。
4. **符合規範且無相依性。** 透過帶有 AbortSignal 生命週期的 `document.modelContext.registerTool()`
   進行註冊（功能偵測已棄用的 `navigator.modelContext` 後備方案）。
   無第三方 WebMCP 執行階段相依性。一切均經過功能偵測：
   在沒有 WebMCP 的瀏覽器中，應用程式表現完全相同。
5. **切勿在變更狀態的表單上使用 `toolautosubmit`** — 無論是 `mutating: "client"`
   還是 `"server"` 均不可。僅在純讀取表單（搜尋、篩選、可用性）上使用。
6. **狀態保留在檔案中，而非您的上下文。** 持續讀取/寫入 `.webmcpify/`；
   假設您的上下文在任何兩個步驟之間都可能被清除。不可分割地 (atomically) 寫入資訊清單
   （先寫入 `manifest.json.tmp`，然後重新命名覆蓋 `manifest.json`）。
7. **認可是選擇性加入的。** 除非人員在關卡處選擇了認可原則（見下文），
   否則切勿進行認可。若沒有 git 或沒有權限，請將變更保留在工作樹中，
   並僅在資訊清單中記錄進度。

## 最新權威指引

WebMCP 是一項持續發展的源試用 API — 該介面在試用期間已經發生了變化
（測試 API 於 2026-07 移除；`navigator` → `document`）。在階段 2 之前，若
網路可用，請提取 Google 當前的官方指南，而不是依賴記憶：

```sh
npx -y modern-web-guidance@latest retrieve "webmcp,agentic-forms,agentic-javascript-tools"
```

如果離線，請使用 `references/integrate.md` — 但當兩者衝突時，優先使用即時指南。

## 狀態通訊協定 — 目標存放庫中的 `.webmcpify/`

| 檔案 | 用途 |
|---|---|
| `manifest.json` | 單一事實來源（下方結構描述；不可分割寫入） |
| `areas/<id>.tools.json` | 清單扇出期間的子代理分區輸出（合併後刪除） |
| `report.md` | 面向人員的持續報告；在結束時定稿 |

**恢復規則：** 如果 `manifest.json` 存在，則繼續執行 — 不重新計算已記錄的
任何內容。**優先合併殘留分區**：在重新指派任何子代理之前，先將任何現有的
`areas/<id>.tools.json` 檔案合併到資訊清單中（將這些區域標記為 `inventoried`，
刪除分區）。然後在 `pipeline.phase`、第一個 `pending` 區域或第一個狀態
非終態的工具處繼續。終態狀態：`verified`、`skipped`、`rejected`。

**階段轉換**（在條件成立的瞬間執行不可分割的資訊清單寫入）：

- `detect → inventory`：記錄了 `app`，擷取了 `baselineSha`/`baselineDirty`。
- `inventory → gate`：無 `pending` 區域，完整性檢查已執行。
- `gate → integrate`：每個 `discovered` 工具均為 `approved`/`rejected`，且
  設定了 `commitPolicy` + `commitWebmcpifyDir`。
- `integrate → verify`：沒有剩餘的 `approved` 工具（每個皆為 `integrated` 或終態），
  建構成功。
- `verify → heal`：驗證循環造訪了每個 `integrated` 工具且 ≥1 個為 `failed`
  （無失敗則直接進入 `audit`）。
- `heal → audit`：無工具為 `failed` 且修復後的完整重新驗證通過。
- `audit → done`：每個 diff 區塊均已對應或標記，`report.md` 已定稿。

資訊清單結構描述 (Webmcpify Manifest v3)：

```jsonc
{
  "webmcpify": 3,
  "app": { "stack": "react-vite", "typescript": true, "entry": "src/main.tsx",
           "baseUrl": "http://localhost:5173", "startCommand": "npm run dev",
           "authFixtures": {                    // 驗證如何取得每個工作階段
             "member": { "obtain": "npm run seed:test-user, then sign in at /login",
                         "account": "member@example.test",
                         "env": ["TEST_MEMBER_PASSWORD"] }  // 僅限環境變數名稱 — 絕不包含機密值
           } },
  "pipeline": {
    "phase": "inventory",          // detect|inventory|gate|integrate|verify|heal|audit|done — 轉換規則見上方
    "setup": {                     // 每個一次性設定步驟建立/修改的路徑 ([] = 尚未完成)
      "runtimeVendored": ["src/webmcp/webmcpify.ts", "src/webmcp/webmcp.d.ts"],
      "harnessInstalled": [".webmcpify/webmcp.spec.ts"],
      "originTrialNoted": ["README.md"]
    },
    "baselineSha": "abc1234",      // 管道啟動時的 HEAD；若無 git 則為 null
    "baselineDirty": ["src/wip.ts"], // 啟動時已修改的路徑 — 不可觸碰（基本規則 1）
    "commitPolicy": null,          // 在關卡處設定："commit-per-batch" | "no-commit"
    "commitWebmcpifyDir": null,    // 在關卡處設定：是否認可 .webmcpify/ 本身？true | false
    "blockers": []                 // 例如 "app won't start locally: needs $API_KEY" — 在關卡處呈現
  },
  "areas": [
    { "id": "checkout", "paths": ["src/features/checkout/"], "status": "pending" } // pending|inventoried
  ],
  "tools": [
    {
      "id": "create_ticket",
      "area": "tickets",
      "kind": "imperative",        // imperative | declarative
      "mutating": "server",        // false | "client" (僅限瀏覽器本機：偏好設定, localStorage) | "server" (資料離開瀏覽器)
      "priority": 1,               // 1 = 優先公開；2/3 = 後續波次
      "description": "Creates a new ticket in the currently open project.",
      "inputSchema": { /* JSON Schema */ },
      "annotations": { "readOnlyHint": false, "untrustedContentHint": false }, // 驗證會在列舉的工具上斷言這些屬性
      "source": ["src/features/tickets/NewTicket.tsx:42"], // 其包裝的 UI 程式碼路徑
      "route": "/projects/demo/tickets",                    // 驗證導覽到的位置
      "auth": ["role:member"],     // "none" | "session" | ["role:<name>", ...] — 鍵入 app.authFixtures；驗證針對每個列出的角色執行一次
      "examples": { "valid": { "title": "Test ticket" }, "invalid": {} },
                                   // invalid: 僅針對無參數/空參數的 readOnlyHint 工具為 null —
                                   // 驗證隨後斷言雙重結果：拒絕 或 成功解析且無副作用
      "expect": { "result": "created", "navigation": null, "ui": "new row appears in the ticket list" },
                                   // 恰好為 result|navigation 之一：result = 解析字串的子字串；
                                   // navigation = 當 executeTool 解析為 null 時的目的地 URL/模式（它進行了導覽）
      "cleanup": "delete the created ticket via the UI's own delete path (test data only)", // mutating:"server" 必填，"client" 建議填寫
      "status": "discovered",      // discovered|approved|rejected*|integrated|verified*|failed|skipped*  (* = 終態)
      "approval": null,            // 伺服器變更工具，一旦獲核准：{ "note": "...", "at": "2026-07-12",
                                   //   "productionSideEffect": null } — 僅在驗證不可避免地導致真實生產影響時設定 (請參閱 VERIFY：生產副作用原則)
      "attempts": 0,               // 修復週期；觸發驗證失敗為 attempt 0
      "batchCommit": null,         // commit-per-batch 下的 sha — 在一個認可之後記錄至資訊清單
      "notes": ""
    }
  ],
  "log": [ "2026-07-12 inventory: area checkout done, 4 candidates" ]
}
```

**v2→v3 移轉：** 恢復 `"webmcpify": 2` 資訊清單會在首次寫入時就地移轉 — `auth`
字串 → 陣列；`setup` 布林值 → 路徑陣列（`false` → `[]`；`true` → 從 git/`log` 復原路徑，
否則 `null` = 已完成但未記錄，稽核對這些檔案僅進行標記）；`mutating: true` → `"server"`；
新增 `annotations`（預設來自清單表格）、`blockers: []`、`commitWebmcpifyDir: null`、
`expect.navigation: null`；然後遞增至 3。

## 階段 0 — DETECT (偵測)

識別技術堆疊、建構 + 開發伺服器指令、是否為 TypeScript、身分驗證模型
（包括驗證如何取得每個測試工作階段 → `app.authFixtures`）、測試設定，
以及應用程式如何在本地啟動；記錄在 `app` 下。記錄 git 基準線：
`pipeline.baselineSha` = 目前 HEAD 且 `pipeline.baselineDirty` = `git status
--porcelain` 路徑（若無 git 均為 `null`/`[]`）。若應用程式無法在本機啟動，
將阻礙項目附加到 `pipeline.blockers` — 整合可繼續進行，但驗證將受阻，
且必須在關卡處呈現。詳細資訊：`references/inventory.md`。

## 階段 1 — INVENTORY (清單盤點；循環，可擴展至任何規模)

**切勿在一次處理中映射整個大型程式碼庫。**

1. **區域地圖優先（輕量、結構化）：** 從路由器設定、頁面目錄或導覽
   列舉路由/檢視/功能模組 — 不讀取實作檔案。將每個區域以
   `"pending"` 寫入 `areas`。
2. **清單循環 — 每次反覆運算一個區域：** 僅深度讀取該區域的檔案；針對
   每個使用者動作草擬一個候選工具（慣例、工具數量預算與重疊規則：
   `references/inventory.md`），填寫所有資訊清單欄位，包括 `route`、`auth`、
   `annotations`、`examples`、`expect` 和 `cleanup`（`mutating: "server"` 必填，
   `"client"` 建議填寫）— 驗證階段僅根據這些欄位執行。附加為 `"discovered"`，
   將該區域標記為 `"inventoried"`，寫入資訊清單，重複進行。
   - **子代理扇出：** 子代理絕不寫入 `manifest.json`。每個子代理僅寫入
     其自己的 `areas/<id>.tools.json` 分區 — 結構描述為
     `{ "webmcpifyShard": 3, "area": "<id>", "tools": [ /* 完整 v3 工具項目 */ ] }`，
     不可分割地寫入 (tmp + rename)。您（協調員）依序將分區合併到
     資訊清單中，然後刪除它們；在恢復時，在重新指派之前優先合併
     現有分區（恢復規則）。
3. **結束條件：** 沒有殘留的 `pending` 區域，加上一次完整性檢查 — 瀏覽應用程式
   導覽並詢問「是否有遺漏任何可見的使用者操作？」

## GATE — 資訊清單核准（主要檢查點）

簡明扼要地呈現資訊清單（id、區域、種類、變更狀態、優先級、單行說明）—
在大型應用程式上按區域批次呈現。要求人員在可能的情況下透過一次交流做出
決定：

1. 哪些工具是 `approved` vs `rejected`（**`rejected` 為終態** — 被拒絕的工具
   會從後續的所有階段和結束條件中排除）。`mutating: "server"` 工具需要個別
   確認 → 記錄在 `approval` 中；`mutating: "client"` 工具可以批次核准。
2. **認可原則**：`commit-per-batch`（每個整合批次均進行認可，可還原 —
   在乾淨的基準線上推薦）或 `no-commit`（保留未認可的變更供人員審查/認可）→
   `pipeline.commitPolicy`。以及 `.webmcpify/` 本身是否應被認可（建議：
   是 — 它記錄了整合過程）→ `pipeline.commitWebmcpifyDir`。
3. `pipeline.blockers` 中的每個項目（例如應用程式無法啟動）。如果驗證某個工具
   不可避免地會導致真實的生產副作用（例如帶有 Origin 允許清單端點的
   郵件發送器），請在此處獲得核准並將其記錄在工具的 `approval.productionSideEffect`
   中 — 請參閱 VERIFY。

在呈現 **之前** 將 `references/security.md` 套用至每個變更狀態的工具。

## 階段 2 — INTEGRATE (整合；循環)

首先進行一次性設定 — 在 `pipeline.setup` 中記錄建立/修改的檔案
**路徑**（例如 `runtimeVendored: ["src/webmcp/webmcpify.ts", ...]`）：從此技能的
`templates/` 提供執行階段（`webmcpify.ts`，或非 TS 專案的 `webmcpify.js`，加上
TS 的 `webmcp.d.ts` 和 React TSX 的 `webmcp-jsx.d.ts` — 保留完整的 MIT 標頭；
請參閱 `references/runtime.md`），並在目標 README 中註明源試用/旗標需求
(`originTrialNoted`)。然後循環：

1. 挑選下一批 `approved` 工具 — 一個區域或 ≤5 個工具。
2. 根據 `references/integrate.md` 進行實作：標準 HTML 表單的宣告式屬性
   （包括架構呈現的和 fetch 攔截的表單）；透過提供的執行階段為非表單
   或受控狀態動作進行命令式註冊。
3. 建構 + 型別檢查；僅修復該批次破壞的內容。
4. 將工具標記為 `"integrated"`，寫入資訊清單。在 `commit-per-batch` 下：
   暫存前需要 **乾淨的索引**（無關的已暫存變更 → 停止並提出）；**僅按路徑暫存該批次的檔案** —
   絕不使用 `git add -A`、`-u`、`.` 或 `commit -a`；認可 `feat(webmcp): expose <ids> (webmcpify)`。
   認可 SHA 會在 **下一次** 資訊清單寫入時記錄在 `batchCommit` 中 — 即晚一個認可
   （資訊清單不能包含其自身認可的 SHA）。切勿修改 (amend) 先前的批次認可。
5. 重複直到沒有剩餘的 `approved` 工具。

## 階段 3 — VERIFY (驗證；循環)

根據 `references/verify.md` 從 `templates/webmcp.spec.ts` 進行一次性設定（真實的有介面 Chrome；
生產環境 `getTools()`/`executeTool()` 介面，帶有舊版後備探針）。然後遍歷每個
`integrated` 工具，使用其資訊清單 `route`、`auth`、`examples`、`expect` 和 `annotations` 欄位：

- 斷言該工具已使用預期的結構描述（列舉的 `inputSchema` 是*字串化的* JSON Schema —
  比較前需先剖析）**以及** 資訊清單 `annotations` 進行註冊；
- 執行有效範例（變更狀態的工具：僅限開發/測試資料，然後執行 `cleanup`）和
  一個無效範例（`invalid: null` 零參數讀取工具：雙重結果斷言 — 請參閱 `references/verify.md`）；
- 根據 `expect` 斷言傳回的結果 **以及** 產生的 UI 狀態（UI **差異**，或
  當執行解析為 `null` 時的 `expect.navigation`）。

通過 → `"verified"`。失敗 → `"failed"` + 失敗附註。角色範圍工具：針對 `auth`
中列出的每個角色執行一次循環，透過相符的 `app.authFixtures` 項目登入。

**生產副作用原則** — 當工具的驗證不可避免地導致真實的生產影響時
（例如實際發送了電子郵件），必須同時具備以下三項：(1) 人員在關卡處核准，
記錄在 `approval.productionSideEffect` 中；(2) 每個測試負載均標記為
`[webmcpify verification]`；(3) 該影響列在 `report.md` 中。若無記錄的核准，
請勿執行實際路徑 — 將該工具標記為 `skipped` 並附帶阻礙附註。

## 階段 4 — HEAL (修復；循環)

當有任何工具處於 `"failed"` 時：透過 `references/heal.md` 進行診斷，**僅** 修復該工具的
整合 — **僅限實作** 修復；若修復會變更已核准的協定（結構描述、說明、
`mutating` 類別、`annotations`、`expect`），請返回關卡重新核准，而不是靜默變更
資訊清單。觸發驗證失敗為 attempt 0；每個修復週期遞增 `attempts` 並重新驗證。
當 `attempts` = 3 時 → `"skipped"` 並附帶清楚的阻礙附註（明確向人員升級呈報，
而非靜默捨棄）。切勿擴大 diff 或偽造通過結果。修復後，為狀態為 `integrated` 或
`verified` 的 **所有** 工具重新執行一次驗證（修復一個工具可能會破壞另一個工具 —
範圍衝突）。

**結束條件：** 每個工具皆為 `verified`、`skipped` 或 `rejected`；建構成功。

## 最終階段 — AUDIT (稽核) + 報告

1. **Diff 稽核（僅標記，絕不自動還原）：** 收集管道的變更 —
   在 `commit-per-batch` 下為 `git diff <baselineSha>..HEAD` **加上索引與未追蹤的檔案**，
   或在 `no-commit` 下為工作樹 + 索引 + 未追蹤檔案。每個 diff 區塊都必須對應至
   資訊清單項目或記錄的 `pipeline.setup` 路徑。未對應的區塊 → **在報告中標記它**
   並附上檔案/行號和建議處置；切勿自行還原任何內容。位於 `baselineDirty` 檔案中的
   區塊 → 不可觸碰，僅作標記。若無 `baselineSha`，稽核資訊清單 `source` 欄位和
   `pipeline.setup` 路徑中指名的檔案（由 v2→v3 移轉記錄為 `null` 的設定項目：
   對這些檔案退回為僅標記）。
2. 定稿 `.webmcpify/report.md`：每個區域的工具覆蓋率、被略過/被拒絕的工具及其
   原因、安全性說明（存在哪些變更狀態的工具、如何防護它們、任何記錄的生產副作用）、
   如何手動測試（旗標、DevTools WebMCP 窗格、檢查器擴充功能），以及每個需要
   人工處理的阻礙項目。
3. 告知人員：公開了什麼、略過了什麼以及原因，以及如何進行試用。

## 參考資料（依需求閱讀，非預先閱讀）

- `references/inventory.md` — 區域對應、命名/結構描述慣例、預算/重疊
- `references/integrate.md` — 針對各技術堆疊的宣告式 + 命令式模式
- `references/runtime.md` — 供應商化 + 連結 `templates/` 執行階段
- `references/verify.md` — 測試架構設定：旗標、介面、Playwright/Puppeteer、評估
- `references/heal.md` — 失敗分類法 → 修復方案
- `references/security.md` — 安全檢查清單（在關卡前與稽核時套用）
