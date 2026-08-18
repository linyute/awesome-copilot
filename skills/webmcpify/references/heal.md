# 修復 — 失敗分類法 → 修復方案 (Heal)

一次處理一個失敗的工具。每次修復後重新驗證。觸發驗證
失敗計為 attempt 0；每個修復週期遞增 `attempts`。當 `attempts`
= 3 時 → 標記為 `skipped` 並附帶阻礙附註（這是最終報告中對
人員的明確升級呈報，而非靜默捨棄）並繼續下一個。**切勿** 擴大
diff、停用檢查或偽造傳回值以強制通過。**變更狀態的
工具：** 在每次嘗試之間執行資訊清單中的 `cleanup` — 在未清理
的情況下重試變更會導致資料重複。

**修復修正的是實作，而非協定。** 資訊清單是
經人員核准的協定：如果正確的修復會變更工具的 `inputSchema`、
`description`、`mutating` 類別、`annotations` 或 `expect`，請將其
帶回關卡進行小型重新核准 — 切勿靜默編輯資訊清單以符合程式碼。

## 分類法

| 徵狀 | 可能原因 | 修復方案 |
|---|---|---|
| 工具未出現在列舉中 | **註冊是非同步的** — 測試在 `registerTool()` 完成前就進行了斷言；或註冊從未執行（未達到啟動程序，檢視未掛載）或使用了錯誤的 Chrome 建構/旗標 | 首先讓測試輪詢 (`waitForTool`) 或等待 `toolchange` — 僅在仍然失敗時，追蹤註冊呼叫；在測試環境中確認 `isWebMCPAvailable()`；使用當前 Chrome + `--enable-features=WebMCP,WebMCPTesting` |
| 整個範圍缺失 | 批次中的某個註冊被拒絕（重複名稱、無效結構描述、原則）— 執行階段復原了整個範圍 | 檢查主控台中的 `onError` 報告；修復有問題的工具協定 |
| 路由變更後工具缺失 | 範圍因導覽而處置（過度限定範圍） | 移至靜態應用程式層級註冊，除非確實繫結於檢視 |
| 宣告式工具遺失 | `toolname` 拼寫錯誤、框架未包含 `allow="tools"`，或頁面發送了 `Origin-Agent-Cluster: ?0` | 修復屬性；檢查 Permissions-Policy `tools` 和來源索引鍵標頭 |
| 結構描述不相符（宣告式） | 控制項缺少 `name`、說明無法解析、此建構中不支援該控制項型別 | 新增 `name`/`toolparamdescription`/`label[for]`；不支援的控制項 → 將該表單切換為命令式 |
| 結構描述不相符（命令式） | 資訊清單與程式碼脫節 | 讓程式碼符合獲核准的資訊清單；若資訊清單有誤，那是協定變更 — 將其帶回關卡重新核准（見上方），切勿靜默更新 |
| 斷言將物件與字串進行比較 | 列舉的 `inputSchema` 是字串化的 JSON Schema | 比較前進行 `JSON.parse`（請參閱 `verify.md`） |
| `executeTool` 意外傳回 `null` | 執行進行了導覽（對於提交導覽的宣告式表單而言屬正常） | 斷言導覽後的頁面，而非傳回值 |
| `executeTool` 拒絕執行 | 違反結構描述或宣告式驗證失敗 — 拒絕執行正是這些問題的失敗訊號 | 對於宣告式工具的無效輸入測試，斷言拒絕執行，而非 `"ERROR:"` 字串 |
| 變更狀態的宣告式執行掛起直至逾時 | Chrome 填寫了表單，然後**暫停執行等待真實的提交互動** — 單獨等待 `executeTool` 會導致死結 | 使用規格樣板中的並行模式：啟動未等待的 `executeTool` → 等待代理程式填寫的值 → 點擊提交 → 等待。**切勿透過新增 `toolautosubmit` 進行修復**（基本規則 5） |
| 後端儘管認證正確仍以 403/CORS 拒絕測試架構 | 端點**將生產 `Origin` 列入允許清單**（郵件發送器、表單閘道）— 本機測試架構來源在工具邏輯執行前被拒絕，且不存在本機修復方案 | 使用環境限制的伺服器端重放驗證實際路徑（下方 §Origin 允許清單端點），僅在 `approval.productionSideEffect` 中記錄了生產副作用核准時進行；若無核准，將實際路徑標記為 `skipped` 並附帶阻礙附註 |
| 執行逾時 / 在 UI 仍載入時出現假成功 | 在非同步工作完成前觸發了完成事件，或缺少接聽程式/使用了錯誤的事件名稱 | 在等待實際工作完成後觸發帶有 `{ ok, message/error }` 的 `tool-completion-<requestId>`（`runtime.md` 協定） |
| 傳回成功但 UI 未變更 | `execute()` 繞過了真實的 UI 路徑（平行實作） | 重寫以呼叫 UI 所使用的相同處理常式/儲存庫動作/端點 |
| 無效輸入成功解析（命令式） | 缺少程式碼內驗證 | 在程式碼中嚴格驗證；傳回 `"ERROR: <what/how to fix>"` |
| Fetch 提交的表單：代理程式未取得任何內容 | 使用了 `preventDefault()` 但沒有 `respondWith()` | 新增 `e.agentInvoked → e.respondWith(promise)` 橋接 |
| 手動運作正常，但在 Playwright 中失敗 | 無介面 (Headless)、缺少旗標或設定檔未包含該旗標 | 使用有介面 + 旗標；持續性上下文；在 CI 中使用 `xvfb-run` |
| 測試中 `execute()` 出現 401/403 | 工具註冊在已認證範圍之外，或測試工作階段缺少資訊清單 `auth` 欄位中的角色 | 將註冊限制在角色範圍內；使用記錄的測試載具登入 |
| 不穩定：單獨執行通過，但在套件中失敗 | 工具執行之間存在共用狀態 | 為每次工具執行隔離測試資料（使用 `cleanup`）；不要透過重新排序測試來掩蓋問題 |

## Origin 允許清單端點 — 重放模式

某些生產後端（郵件發送器、表單閘道）將生產環境的
`Origin` 標頭列入允許清單並拒絕其他所有請求 — 本機測試架構永遠無法
直接執行實際路徑。當（且僅當）關卡核准了真實的
生產副作用 (`approval.productionSideEffect`) 時，使用環境限制的重放
驗證實際路徑：在 Playwright 中攔截應用程式自身的請求，並在伺服器端
（Node 上下文 — 不受瀏覽器 CORS 限制）使用生產 `Origin` 重新發出：

```ts
// 環境限制：僅在 WEBMCP_LIVE_MUTATIONS=1 時執行 — 在 CI 中絕不預設開啟。
if (process.env.WEBMCP_LIVE_MUTATIONS === '1') {
  await page.route('**/api/contact', async (route) => {
    const response = await context.request.fetch(route.request(), {
      headers: { ...route.request().headers(), origin: 'https://example.com' }, // 生產環境 Origin
    });
    await route.fulfill({ response });
  });
}
```

這會導致真實的生產副作用。將每個測試負載標記為
`[webmcpify verification]`，執行資訊清單的 `cleanup`，在
`report.md` 中列出該影響，且在 CI 中絕不要預設啟用該閘門。

## 修復之後

為狀態為 `integrated` 或 `verified` 的 **所有** 工具重新執行一次驗證
（不僅僅是已修復的工具）— 修復一個工具可能會取消註冊或破壞另一個工具；
範圍衝突是典型的案例。只有在此之後才評估結束條件。
