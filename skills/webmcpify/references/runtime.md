# 執行階段 — 供應商化與連接範本

從本技能的 `templates/`
目錄複製至目標專案中（建議：`src/webmcp/`）：

- **TypeScript
專案**：`templates/webmcpify.ts`
+
`templates/webmcp.d.ts`；
**React TSX 專案額外加入**
`templates/useWebMCPBridge.ts`。
- **JavaScript 專案**：`templates/webmcpify.js`。

**供應商化
(Vendor)，而非相依**
—
執行階段非常精簡、採用
MIT
授權，且目標儲存庫絕不能因為一個源自測試的
API 而增加相依套件。

所提供的功能：

| 匯出項目 | 用途 |
|---|---|
| `getModelContext()` | The ONLY place `document.modelContext` / deprecated `navigator.modelContext` is referenced — spec churn stays a one-file fix |
| `isWebMCPAvailable()` | Feature detection — the app must work identically without WebMCP |
| `createToolScope(key, tools, options?)` | Registers a tool set under one AbortController; returns a **callable dispose handle** carrying `ready: Promise<boolean>` (true = all registrations committed; false = no WebMCP / duplicate key / failure / disposed first — never rejects). Missing WebMCP remains a safe no-op, but development builds warn once with secure-origin/Chrome/flag diagnostics. Validates contracts BEFORE registering; forwards execution options unchanged and wraps every imperative `execute()` so bare `null`/`undefined` becomes a structured error; **rolls back the whole scope** on any registration failure, including sync-throwing legacy `registerTool` (reported via `options.onError`, default `console.error` — NOT called when disposed before settling). An already-active key returns a no-op handle — safe under React StrictMode |
| `dispatchAndWait(event, detail?, timeoutMs?, callerSignal?)` | Bridges `execute()` to the app's own event/state flow. The dispatched detail carries `requestId` plus `signal` — an AbortSignal aborted on timeout or caller cancellation; pass it to `fetch()` and skip state commits once aborted. Resolves only after the component confirms with an explicit **boolean** `ok`; a completion with missing/non-boolean `ok` **fails closed** to an `"ERROR: ..."` string, as do timeouts and `ok: false` (self-correction convention — never rejects). For tools whose confirmation involves a network round-trip (mailers, slow APIs), pass an explicit `timeoutMs` (e.g. `20_000`) instead of relying on the 10 s default |
| `singleFlight(fn, busyMessage?)` | Serializes a tool's `execute`: while one call is in flight, further calls resolve immediately to a busy `"ERROR: ..."` string instead of racing shared UI state |

驗證備註：當打包工具替換
`process.env.NODE_ENV`
時，預算檢查會自動啟用（Vite/webpack
會自動處理；針對 esbuild 請手動傳遞 `--define`）。

結果備註：應用程式工具必須傳回
JSON
安全的值。命令式工具禁止傳回單純的
`null` 與
`undefined`；
執行階段保護會將空傳回轉換為結構化錯誤。


取消備註
(2026-10-05)：將
`options?.signal`
作為第四個橋接引數傳遞，包括在
`singleFlight`
內部。
中止的工具呼叫會在不發送請求的情況下提早退出。

## 完成契約（整合者容易犯錯的部分）

`dispatchAndWait`
在元件觸發帶有 `detail: {
ok: boolean,
message?: string,
error?: string }` 的
`tool-completion-<requestId>` 事件時解析。

強化的元件橋接器（React 範例 —
請依框架調整）。五個子句：**(1)**
完成事件從效果中觸發，**(2)** 僅在 WebMCP
存在時附加，**(3)** 檢查 ID，**(4)** 清除計時器，**(5)** 在卸載時取消接聽。

```tsx
const pending = useRef<{ requestId: string; count: number } | null>(null);
const [results, setResults] = useState<Ticket[] | null>(null);

useEffect(() => {
  if (!isWebMCPAvailable()) return;                       // (2) attach only when WebMCP exists
  let inFlight = false;
  const onSearch = async (e: Event) => {
    const { query, requestId, signal } = (e as CustomEvent).detail;
    const fail = (error: string) =>
      window.dispatchEvent(new CustomEvent(`tool-completion-${requestId}`, {
        detail: { ok: false, error },
      }));
    if (inFlight) return fail('A search is already running.'); // (3) single-flight
    inFlight = true;
    try {
      const found = await runSearch(query, { signal });   // (4) the runtime aborts this signal on timeout or caller cancellation
      if (signal?.aborted) return;                        // (4) cancelled/timed out — runtime already answered; no late commits
      pending.current = { requestId, count: found.length };
      setResults(found);                                  // commit → the effect below confirms
    } catch (err) {
      if (signal?.aborted) return;
      fail(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      inFlight = false;
    }
  };
  window.addEventListener('webmcp:search_tickets', onSearch);
  return () => window.removeEventListener('webmcp:search_tickets', onSearch); // (5) unmount detaches
}, []);

useEffect(() => {
  if (!pending.current || results === null) return;       // (1) confirm AFTER the commit rendered
  const { requestId, count } = pending.current;
  pending.current = null;
  window.dispatchEvent(new CustomEvent(`tool-completion-${requestId}`, {
    detail: { ok: true, message: `Search finished — ${count} results are now visible.` },
  }));
}, [results]);
```

為何需要子句
(1)：React 18
會批次處理轉譯 —
當事件處理常式的下一行執行時，`await`
之後設定的狀態**尚未顯示在畫面上**。效果可保證在
DOM 提交後才引發完成。

## 連接模式

```tsx
// bootstrap (app-wide tools, static registration — the default):
import { createToolScope } from './webmcp/webmcpify';
import { appTools } from './webmcp/tools';
createToolScope('app', appTools);

// per-view tools (only when genuinely view-bound):
useEffect(() => createToolScope('tickets-view', ticketViewTools), []);
// the handle IS the dispose fn → React runs it on unmount. StrictMode's
// double-mount is safe: the second call no-ops, an unmount before registration
// settles rolls back silently (ready → false, no onError).

// when you need to know registration committed:
const handle = createToolScope('app', appTools);
handle.ready.then((ok) => { if (!ok) console.warn('WebMCP tools not active'); });
```

角色範圍的 SaaS 註冊 — 在驗證狀態變更時處置並重新建立：

```ts
let dispose: (() => void) | undefined;
export function syncToolsForUser(user: User | null) {
  dispose?.();
  const tools = [...publicTools, ...(user ? memberTools : []),
                 ...(user?.role === 'admin' ? adminTools : [])];
  dispose = createToolScope('auth-scoped', tools);
}
// call on login, logout, role change, tenant switch
```
