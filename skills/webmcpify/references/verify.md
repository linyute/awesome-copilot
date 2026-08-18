# 驗證 — 在真實瀏覽器中證明每個工具均能運作 (Verify)

## 環境

- **當前 Chrome**（API 在試用期間有所調整 — 舊版的
  `navigator.modelContextTesting` 介面於 2026-07 被移除，取而代之的是
  生產環境的 `document.modelContext.getTools()/executeTool()`）。
- 啟用方式：`chrome://flags/#enable-webmcp-testing`，或使用
  `--enable-features=WebMCP,WebMCPTesting` 啟動（涵蓋當前與舊版建構）。
- **僅限有介面 (Headed)** — 根據設計，WebMCP 需要可見的分頁。在 CI 中，於
  `xvfb-run` 下執行。無介面 (Headless) 永遠無法運作；切勿朝此方向修復。
- 透過 `app.startCommand` 在本地執行的應用程式，僅針對開發/測試資料執行。
- 每個工具的資訊清單項目會指出執行位置與方式：`route`（導覽至該處）、
  `auth`（使用記錄的測試載具登入；針對具角色範圍的工具在每個角色下
  進行驗證）、`examples`（執行什麼內容）、`expect`（斷言什麼內容）、
  `cleanup`（在測試後如何復原變更狀態工具的影響）。

## 列舉/執行介面（探測，而非假設）

在頁面上下文中，優先使用生產環境介面，並針對舊版建構提供後備方案：

```js
const mc = document.modelContext ?? navigator.modelContext;
const tools = mc?.getTools
  ? await mc.getTools()
  : await navigator.modelContextTesting?.listTools();   // 於 2026-07 移除；僅供舊版使用
```

產生的斷言必須遵循的協定事實：

- 列舉的 `inputSchema` 是**字串化的** JSON Schema — 在與資訊清單項目
  比較之前先進行 `JSON.parse`。
- `executeTool(...)` 解析為**字串結果，或當執行導覽時為 `null`**
  （對於提交導覽的宣告式表單而言屬正常）。
- 執行與宣告式驗證失敗 **會拒絕 Promise** — 它們不會解析為
  `"ERROR: ..."`。只有遵循執行階段慣例的命令式工具才會以
  `"ERROR: ..."` 字串解析。根據個別工具的 `kind` 相應進行斷言。
- **註冊是非同步的** — `registerTool()` 傳回一個 Promise，因此在頁面載入的瞬間
  工具並不可列舉。輪詢它（樣板中的 `waitForTool`）或等待 `toolchange` 事件；
  絕不要在 `goto` 之後立即斷言存在。
- **變更狀態的宣告式表單會在執行中途暫停**：Chrome 填寫表單，然後
  在讓 `executeTool` 完成之前等待真實的提交互動 —
  單獨等待它會死結並導致逾時。使用並行模式：啟動未等待的
  `executeTool` → 等待代理程式填寫的值出現 → 點擊提交 → 等待結果
  （完整範例見樣板）。
- 這些介面僅供代理程式/測試架構使用 — 它們絕不能出現在發布的
  應用程式程式碼中。

對於 **宣告式** 工具，還要驗證*合成的*結構描述：表單控制項 →
結構描述對應僅被部分指定，因此請檢查每個標註的控制項在實際目標
Chrome 建構中是否呈現為預期的屬性。

## 逐項工具檢查

1. 已註冊（輪詢 — 註冊是非同步的）且具有預期的名稱、（剖析後的）
   結構描述 **以及** 列舉工具上的資訊清單 `annotations`。舊版
   `modelContextTesting` 後備方案無法列舉註釋 — 在此處跳過該
   斷言並在報告中註明差距。
2. 有效範例執行：根據 `expect` 斷言結果 — `expect.result` 作為解析字串的
   子字串，或當 `executeTool` 解析為 `null` 時 `expect.navigation` 作為目的地
   （它進行了導覽）— **以及** 作為 **差異 (delta)** 的 `expect.ui`
   狀態（在執行*之前*擷取相關狀態；僅確認螢幕上已存在的內容可見性
   並不能證明任何事情）。回報成功但 UI 未變更的工具屬於 **失敗**
   （UI 穩定規則）。因為執行可能會導覽，所以在 `beforeEach` 中還原
   資訊清單 `route`，而非 `beforeAll`。
3. 無效範例：**首先證明工具存在**（來自從未註冊之工具的拒絕不是驗證拒絕）。
   然後：命令式 → 解析為 `"ERROR: ..."`；宣告式/結構描述違規 → 拒絕執行。
   具有 `examples.invalid: null` 的零參數讀取工具改為採用雙重結果斷言：
   `{"unexpected": true}` 可以因為驗證原因被拒絕，或者良性解析 —
   兩者均通過；工具/介面缺失則判定為失敗。
4. 變更狀態的工具：針對一次性資料執行，透過 UI 所使用的相同讀取路徑
   驗證變更，然後執行資訊清單的 `cleanup` — 沒有有效清理機制的
   `mutating: "server"` 工具會在關卡處受阻，且修復循環中對變更狀態工具的
   重試必須在每次嘗試之間進行清理。

## 測試架構

具現化 `templates/webmcp.spec.ts`（隨附於此技能）— Playwright、
有介面的持續性 Chrome、從資訊清單產生的每個工具一個 describe 區塊，
包含真實斷言（絕不使用註解掉的預留位置）。將產生的規格檔案放置在
存放庫現有的 e2e 測試旁邊。

**沒有測試設定的存放庫 — 獨立測試架構方法。** 規格檔案保留在
`.webmcpify/webmcp.spec.ts` 中（單一事實來源，根據關卡的
`commitWebmcpifyDir` 選擇進行認可）；Playwright 安裝位於存放庫外部的
暫存測試架構中，因此目標不會增加相依性：

```sh
mkdir -p /tmp/webmcpify-harness && cd /tmp/webmcpify-harness
npm init -y && npm i -D @playwright/test typescript @types/node
cat > playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: process.env.WEBMCP_SPEC_DIR,   // → <target-repo>/.webmcpify
  workers: 1,                              // 一個共用的有介面 Chrome — 絕不平行化
});
EOF
WEBMCP_SPEC_DIR=<target-repo>/.webmcpify WEBMCP_BASE_URL=http://localhost:5173 \
NODE_PATH=/tmp/webmcpify-harness/node_modules npx playwright test
```

`NODE_PATH` 允許存放庫外的規格檔案解析 `@playwright/test`；如果目標的
工具鏈忽略 `NODE_PATH`，改為建立符號連結：
`ln -s /tmp/webmcpify-harness/node_modules <target-repo>/.webmcpify/node_modules`
（並確保它未被認可）。在報告中註明驗證是從獨立測試架構執行的。

**替代方案：** Puppeteer 提供了第一方實驗性 WebMCP API
(https://pptr.dev/guides/webmcp) — 當目標存放庫已使用 Puppeteer 時優先使用它。

## 工具選取評估（建議使用；對於 SaaS 規模的工具集為強制性）

結構描述層級的驗證證明了工具 *可以運作*，而不是 LLM 會 *選取* 它們。
對於公開超過少數幾個工具的應用程式，執行 Google 的 **WebMCP Evals CLI**
(GoogleChromeLabs/webmcp-tools, `evals-cli`)：根據資訊清單範例為每個工具撰寫
一個評估案例（「使用者說 X → 預期帶有引數 Z 的工具 Y」）並執行它們 —
這能捕捉到 Playwright 無法捕捉的模糊名稱/說明以及重疊的工具。

## 手動 QA（在報告中告知人員）

- DevTools → **Application → WebMCP 窗格**：即時工具清單、呼叫記錄、
  帶有可編輯參數的「Run tool」。
- **Model Context Tool Inspector** Chrome 擴充功能（由 Google 的 François
  Beaufort 開發）：工具 *選取* 的自然語言冒煙測試。
- Chrome 的 WebMCP 稽核會標記宣告式表單上遺失的 `toolname`/`toolparamdescription`/
  `label[for]`/`name`。
