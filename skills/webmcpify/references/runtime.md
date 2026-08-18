# 執行階段 — 供應商化與樣板連結 (Runtime)

從此技能的 `templates/` 目錄複製到目標專案中
（建議路徑：`src/webmcp/`）：

- **TypeScript 專案**：`templates/webmcpify.ts` + `templates/webmcp.d.ts`；
  **React TSX 專案額外需要** `templates/webmcp-jsx.d.ts`（宣告式屬性的
  JSX 型別宣告 — 這是一個模組檔案；保持與 `webmcp.d.ts` 分離，
  後者必須保持為全域指令碼檔案）。
- **JavaScript 專案**：`templates/webmcpify.js` — **僅限 ES 模組** (`export`)：
  透過打包工具或 `<script type="module">` 載入。對於 CommonJS/傳統指令碼
  專案，改為轉譯或供應商化 TS 變體。

**採用供應商化 (Vendor)，而非新增相依性** — 執行階段體積小、採 MIT 授權，且目標存放庫
不應為源試用 API 增加相依性。在每個複製的檔案中 **保留完整的 MIT 聲明標頭**：
授權的保留條件要求版權行和授權聲明隨程式碼一起傳播，而標頭就是該聲明 —
切勿將其修剪為純連結。
在資訊清單中記錄複製的檔案路徑
(`pipeline.setup.runtimeVendored: ["src/webmcp/webmcpify.ts", ...]`)。

它所提供的功能：

| 匯出項目 | 用途 |
|---|---|
| `getModelContext()` | 唯一參照 `document.modelContext` / 已棄用的 `navigator.modelContext` 之處 — 規範變更保持為單一檔案的修復 |
| `isWebMCPAvailable()` | 功能偵測 — 應用程式在沒有 WebMCP 的情況下必須以完全相同的方式運作 |
| `createToolScope(key, tools, options?)` | 在單一 AbortController 下註冊工具集；傳回帶有 `ready: Promise<boolean>` 的**可呼叫處置控制代碼**（true = 所有註冊皆已認可；false = 無 WebMCP / 重複鍵 / 失敗 / 優先被處置 — 絕不拒絕）。在註冊前驗證協定；在發生任何失敗時**復原整個範圍**，包括同步擲回錯誤的舊版 `registerTool`（透過 `options.onError` 回報，預設為 `console.error` — 在完成前處置時不呼叫）。已處於活動狀態的鍵會傳回無操作 (no-op) 控制代碼 — 在 React StrictMode 下安全 |
| `dispatchAndWait(event, detail?, timeoutMs?)` | 將 `execute()` 橋接至應用程式本身的事件/狀態流程。分派的詳細資訊帶有 `requestId` 以及 `signal` — 一個在逾時時中止的 AbortSignal；將其傳遞給 `fetch()` 並在中止後略過狀態認可。僅在元件以明確的**布林值** `ok` 確認後解析；缺少/非布林值的 `ok` 完成會**依預設關閉 (fails closed)** 為 `"ERROR: ..."` 字串，逾時和 `ok: false` 亦同（自我修正慣例 — 絕不拒絕）。對於確認涉及網路來回傳遞的工具（郵件發送器、緩慢的 API），傳遞明確的 `timeoutMs`（例如 `20_000`）而非依賴預設的 10 秒 |
| `singleFlight(fn, busyMessage?)` | 將工具的 `execute` 序列化：當一個呼叫正在進行中時，後續呼叫會立即解析為忙碌的 `"ERROR: ..."` 字串，而不是競爭共用的 UI 狀態 |

驗證附註：當打包工具替換 `process.env.NODE_ENV`（Vite/webpack 自動替換；esbuild 透過 `--define`）
且其值不是 `'production'` 時，預算檢查會自動啟用；未打包的專案預設為關閉 — 在
開發期間傳遞 `{ validate: true }`。

## 完成協定（整合者容易出錯的部分）

`dispatchAndWait` 在元件觸發帶有 `detail: { ok: boolean, message?: string, error?: string }` 的
`tool-completion-<requestId>` 時解析。`ok` 必須是明確的布林值 — 任何其他內容均會
依預設關閉為 ERROR 結果。**在非同步工作真正完成後** 觸發它 — 等待的 fetch、
已認可的狀態、呈現的結果 — 絕不能在剛*啟動*動作後立即觸發。代理程式根據
螢幕上的內容進行方案規劃；過早觸發完成會產生錯誤的通過狀態。

強化的元件橋接（React 範例 — 依架構調整）。五個子句：
**(1)** 完成事件從觀察已認可狀態的 effect 中觸發、**(2)**
可用性檢查門檻、**(3)** 單一飛行 (single-flight)、**(4)** 透過
`detail.signal` 協調逾時、**(5)** 卸載取消。

```tsx
const pending = useRef<{ requestId: string; count: number } | null>(null);
const [results, setResults] = useState<Ticket[] | null>(null);

useEffect(() => {
  if (!isWebMCPAvailable()) return;                       // (2) 僅在 WebMCP 存在時附加
  let inFlight = false;
  const onSearch = async (e: Event) => {
    const { query, requestId, signal } = (e as CustomEvent).detail;
    const fail = (error: string) =>
      window.dispatchEvent(new CustomEvent(`tool-completion-${requestId}`, {
        detail: { ok: false, error },
      }));
    if (inFlight) return fail('A search is already running.'); // (3) 單一飛行
    inFlight = true;
    try {
      const found = await runSearch(query, { signal });   // (4) 執行階段在逾時時會中止此訊號
      if (signal?.aborted) return;                        // (4) 已逾時 — 執行階段已回應；無後續認可
      pending.current = { requestId, count: found.length };
      setResults(found);                                  // 認可 → 下方的 effect 進行確認
    } catch (err) {
      if (signal?.aborted) return;
      fail(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      inFlight = false;
    }
  };
  window.addEventListener('webmcp:search_tickets', onSearch);
  return () => window.removeEventListener('webmcp:search_tickets', onSearch); // (5) 卸載時分離
}, []);

useEffect(() => {
  if (!pending.current || results === null) return;       // (1) 在認可呈現後確認
  const { requestId, count } = pending.current;
  pending.current = null;
  window.dispatchEvent(new CustomEvent(`tool-completion-${requestId}`, {
    detail: { ok: true, message: `Search finished — ${count} results are now visible.` },
  }));
}, [results]);
```

為什麼需要子句 (1)：React 18 批次處理呈現 — 在 `await` 之後設定的狀態
在處理常式的下一行執行時 **尚未呈現在螢幕上**，因此在此處分派
完成會在使用者（以及代理程式的下一個快照）看到之前就回報成功。
從以更新狀態為索引鍵的 effect 進行分派可確保認可已實際發生。
等效項：Vue `await nextTick()`；Svelte `await tick()` — 然後以行內方式分派。

## 連結模式

```tsx
// 啟動程序（全應用程式工具，靜態註冊 — 預設方式）：
import { createToolScope } from './webmcp/webmcpify';
import { appTools } from './webmcp/tools';
createToolScope('app', appTools);

// 個別檢視工具（僅在確實繫結於檢視時）：
useEffect(() => createToolScope('tickets-view', ticketViewTools), []);
// 控制代碼即為處置函式 → React 在卸載時執行它。StrictMode 的
// 雙重掛載是安全的：第二次呼叫為無操作，在註冊完成前的卸載
// 會靜默復原（ready → false，無 onError）。

// 當您需要知道註冊是否已認可時：
const handle = createToolScope('app', appTools);
handle.ready.then((ok) => { if (!ok) console.warn('WebMCP tools not active'); });
```

具角色範圍的 SaaS 註冊 — 在認證變更時處置並重新建立：

```ts
let dispose: (() => void) | undefined;
export function syncToolsForUser(user: User | null) {
  dispose?.();
  const tools = [...publicTools, ...(user ? memberTools : []),
                 ...(user?.role === 'admin' ? adminTools : [])];
  dispose = createToolScope('auth-scoped', tools);
}
// 在登入、登出、角色變更、租戶切換時呼叫
```
