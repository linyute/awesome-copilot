# 修復 — 失敗分類學 → 修復措施

計數前先分類。在重試前保留
`failure.class`、`failure.signature` 以及目前的 `contractRevision`：

- `contract` — 一類工具共享的架構/結果/生命週期規則；
- `environment` — 安全來源、瀏覽器/設定檔/顯示、應用程式啟動、後端/CORS；
- `implementation` — 該工具的應用程式連線 wiring 錯誤；
- `external-policy` — 真實的上游或生產來源限制；
- `flaky` — 相同且未修改的路徑產生不一致的獨立結果；
- `client-capacity` — 目標用戶端無法列舉/選取預期的集合。

`attempts`
僅計算在相同經核准的契約修訂版下，針對相同失敗特徵的獨立重試次數。
共享的契約或環境錯誤屬於單一根本原因，
而非每個工具一次失敗嘗試：請修復它，在人工核准的契約變更時遞增
`contractRevision`，然後清除受影響之每個工具的
`failure` 並重設
`attempts`。在連續三次獨立的實作/不穩定重試失敗後，`skipped`
必須指名類別、特徵以及在目前契約下導致該工具無法運作的證據。僅有原始計數絕不足夠。**切勿**擴大
diff、停用檢查或偽造傳回值來強行通過。**異動型工具：**在重試之間執行資訊清單的
`cleanup` — 未經清除就重試異動會複製資料。

**修復失敗，而非分數。**來自第三方 WebMCP
檢查器/檢查程式的低分本身並非失敗：這些清單混合了規格功能、慣例以及臆造的檢查。請先將各項發現分類
(`references/discovery.md`)。若它是在說明文件或
Chrome
文件中確認的**真實規格違規**，則測試載具有缺口 —
請加入遺失的斷言，觀察其失敗，然後像修復其他失敗一樣進行修復。若它是慣例或臆造的檢查，請報告並停止：不要加入
`toolaction`
屬性，不要為了滿足宣告式檢查而新增表單，不要盲目追逐瀏覽器端的 `window.ai`。

**修復是針對實作，而非契約。**資訊清單是經人工核准的契約：若正確的修復會變更工具的
`inputSchema`、`description`、`mutating`
類別、`annotations` 或
`expect`，請將其帶回閘門作為迷你重新核准流程 — 絕不要悄悄編輯資訊清單以符合程式碼。

## 分類學

| Symptom | Likely cause | Fix |
|---|---|---|
| 工具自列舉中缺席 | Insecure verification origin; **registration is async**; bootstrap/view not reached; reused Chrome profile; wrong headed Chrome/flags | FIRST assert `window.isSecureContext` and `document.modelContext`, then poll (`waitForTool`) or await `toolchange`; only then trace registration. `WebMCPTesting` does not waive secure context |
| 頁面從未啟動 | Absolute backend URL points at an absent localhost service, or CORS allow-list pins another exact origin/port | Capture console + failed requests; correct the verification origin/backend environment before changing tool code. Classify `environment` |
| 整個範圍缺席 | A registration in the batch rejected (duplicate name, invalid schema, policy) — the runtime rolls back the entire scope | Check console for the `onError` report; fix the offending tool contract |
| 路由變更後工具缺席 | Scope disposed by navigation (over-scoping) | Move to static app-level registration unless genuinely view-bound |
| 宣告式工具遺失 | `toolname` typo, frame without `allow="tools"`, or page sends `Origin-Agent-Cluster: ?0` | Fix attribute; check Permissions-Policy `tools` and origin-keying headers |
| 結構描述不符 (宣告式) | Control lacks `name`, description not resolvable, unsupported control type in this build | Add `name`/`toolparamdescription`/`label[for]`; unsupported controls → switch that form to imperative |
| 結構描述不符 (命令式) | Manifest and code drifted | Make code match the approved manifest; if the manifest was wrong, that's a contract change — take it back to the gate for re-approval (see above), never silently update it |
| 斷言比較物件與字串 | Enumerated `inputSchema` may be stringified (native lag) or object (spec) — handle both | `typeof === 'string' ? JSON.parse(s) : s ?? {type:'object',properties:{}}` before comparing (see `verify.md`) |
| `executeTool` returns `null` unexpectedly | A declarative submission navigated; or an imperative handler returned bare `null` | Declarative navigation: assert the destination. Imperative: return a structured result and defer route-changing UI/disposal one event-loop task; the runtime guard converts accidental absence into a structured error |
| `executeTool` rejects | Schema violation or declarative-validation failure — rejection IS the failure signal for these | For invalid-input tests on declarative tools, assert rejection, not an `"ERROR:"` string |
| 異動型宣告式執行卡住直到逾時 | Chrome fills the form, then **pauses the execution awaiting a real submit interaction** — awaiting `executeTool` alone deadlocks | Use the concurrent pattern in the spec template: start `executeTool` unawaited → wait for the agent-filled value → click submit → await. **NEVER heal by adding `toolautosubmit`** (ground rule 5) |
| 儘管驗證正確，後端仍以 403/CORS 拒絕測試載具 | The endpoint **allow-lists the production `Origin`** (mailers, form gateways) — the localhost harness origin is refused before the tool logic runs, and no local fix exists | Verify the live path with the env-gated server-side replay (§Origin-allow-listed endpoints below), only with the production side-effect approval recorded in `approval.productionSideEffect` (see §Origin-allow-listed endpoints below); without it, mark the live path `skipped` with a blocker note |
| 執行逾時 / 在 UI 仍在載入時回傳預製的成功 | Completion event fired before the async work finished, or listener missing/wrong event name | Fire `tool-completion-<requestId>` with `{ ok, message/error }` AFTER awaiting the real work (`runtime.md` contract) |
| 傳回成功但 UI 未改變 | `execute()` bypassed the real UI path (parallel implementation) | Rewrite to call the same handler/store action/endpoint the UI uses |
| 無效輸入成功解析 (命令式) | Missing in-code validation | Validate strictly in code; return `"ERROR: <what/how to fix>"` |
| 透過 Fetch 提交的表單：代理人未取得任何內容 | `preventDefault()` without `respondWith()` | Add the `e.agentInvoked → e.respondWith(promise)` bridge |
| 手動可運作，但在 Playwright 中失敗 | Headless, missing flags/display/Chrome, or shared profile whose existing instance ignored the flag | Provision current Chrome + display; use headed persistent context with a dedicated `WEBMCP_PROFILE_DIR` |
| 401/403 from `execute()` in test | Tool registered outside the authenticated scope, or test session lacks the role in the manifest `auth` field | Role-scope the registration; sign in with the recorded fixture |
| 不穩定：單獨通過，在測試套件中失敗 | Shared state between tool executions | Isolate test data per tool run (use `cleanup`); don't reorder tests to hide it |

## 來源允許清單端點 — 重放模式

某些生產後端（郵件傳送程式、表單閘道）會將生產
`Origin` 標頭列入允許清單並拒絕其他所有請求 —
本機測試載具來源永遠無法直接執行即時路徑。當（且僅當）閘門核准了真實的生產副作用
(`approval.productionSideEffect`)
時，透過受環境管制的重放來驗證即時路徑：在
Playwright
中攔截應用程式本身的請求，並在伺服器端（Node 上下文 — 不受瀏覽器 CORS 限制）以生產 `Origin` 重新發出：

```ts
// Env-gated: runs only with WEBMCP_LIVE_MUTATIONS=1 — never default-on in CI.
if (process.env.WEBMCP_LIVE_MUTATIONS === '1') {
  await page.route('**/api/contact', async (route) => {
    const response = await context.request.fetch(route.request(), {
      headers: { ...route.request().headers(), origin: 'https://example.com' }, // the prod Origin
    });
    await route.fulfill({ response });
  });
}
```

這會導致真實的生產副作用。將每個酬載標記為 `[webmcpify
verification]`，執行資訊清單的 `cleanup`，在
`report.md` 中列出該效果，且在 CI 中絕不預設啟用此閘門。

## 修復之後

針對狀態為 `integrated` 或 `verified`
的**所有**工具重新執行一次驗證（不僅是已修復的工具）—
修復一個工具可能會取消註冊或損壞另一個工具；範圍衝突是典型的案例。唯有此時才能評估結束條件。
