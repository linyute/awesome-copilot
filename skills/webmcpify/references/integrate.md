# 整合 — 依技術堆疊分類的模式

> 閱讀 [Chrome
指南](https://developer.chrome.com/docs/ai/webmcp)
與 [CG
草案](https://webmachinelearning.github.io/web-machine-learning-model-context-protocol/)
取得原生 API 規格。

## 宣告式 — 標準 HTML 表單

適用於純 HTML、SSG
發出、伺服器轉譯與框架轉譯（不受控）表單
— 任何存在真實 `<form>` 的地方。

```html
<form toolname="request_quote"
      tooldescription="Requests a project quote. A team member replies within one business day."
      action="/contact" method="post">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required
         toolparamdescription="Email address for the reply">
  <!-- …existing fields, each with label[for] + name + toolparamdescription… -->
  <button type="submit">Request quote</button>
</form>
```

規則： -
瀏覽器從控制項衍生出
JSON Schema —
每個控制項都需要
`name`、可解析的說明與類型。
- 異動型表單需要明確提交
— 絕不要加入
`toolautosubmit`。
- 使用 `respondWith()` 傳回結構化結果給呼叫端代理人：

```js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const result = doSubmit(new FormData(e.target))
    .then(() => 'Request received. Reply within one business day.');
  if (e.agentInvoked) e.respondWith(result); // pass the PROMISE, not a value
});
```

- 選用
UX（逐字引用自
Chrome
文件）：使用
`form:tool-
form-active`
/
`:tool-submit-active`
CSS
虛擬類別設定代理人活動的樣式。

### 框架注意事項 — React

- 將
`templates/webmcp-jsx.d.ts`
與環境類型一起供應商化，以便嚴格
TSX 接受
`toolname`/`tooldescription`/`toolparamdescription`。



  ```tsx
  const native = e.nativeEvent as SubmitEvent;
  if (native.agentInvoked) native.respondWith?.(doSubmit(new FormData(e.currentTarget))
    .then(() => 'Request received. Reply within one business day.'));
  ```

傳遞結果字串的 PROMISE，而非已經解析的值。

## 命令式 — SPA 與動態應用程式

使用供應商化執行階段
(`runtime.md`)。工具存在於每個應用程式的專用模組中（例如 `src/webmcp/tools.ts`），與元件解耦。

```ts
import { createToolScope, dispatchAndWait, singleFlight } from './webmcpify';

export const searchTicketsTool = {
  name: 'search_tickets',
  description: 'Searches tickets in the currently open project and shows results on screen.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search terms, exactly as the user phrased them.' },
    },
    required: ['query'],
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true, consequentialHint: false },
  execute: singleFlight(async (input: Record<string, unknown>, options?: ToolExecuteCallbackOptions) => {
    const q = String(input.query ?? '').trim();
    if (!q) return 'ERROR: `query` must be a non-empty string.';
    return dispatchAndWait('webmcp:search_tickets', { query: q }, 10000, options?.signal);
  }),
};
```

執行選項必須透過包裝函
式未經修改地抵達橋接器；
對於省略第二個引數的舊版瀏覽器，
請使用
`options?.signal`。

> **原生 I/O 相容性** — `getTools()` 在舊版 Chrome 上可能會將 `inputSchema` 作為字串傳回，而在目前的實作中則傳回物件。測試載具相容性輔助函式會自動處理此差異。

重要規則：
-
**註解描述風險；
它們不強制執行風險。









**
僅對具有不可逆、
破壞性或財務
影響的操作使用
`conseque
ntialHint:
true`。
-
嚴格驗證輸入；
在呼叫任何副作用之
前回傳結構化錯誤：

  ```ts
  execute: async (input) => {
    const route = validateProjectDraft(input); // throws/returns an error before acting
    const result = { opened: true, surface: 'project-create', route, prefilled: false };
    setTimeout(() => {
      openProjectCreation(route); // the same path the visible UI uses
      disposeRouteTools();
    }, 0);
    return result;
  }
  ```

`null`
仍是瀏覽器擁有的導覽*
*宣告式表單**的結果；
應用程式的
`execute()`
處理常式必須回傳
JSON
安全的結果。

### 註冊與生命週期

-
**靜態註冊為預設值**：在
啟動時註冊全應用程式工具一次。
-
**僅針對檢視表特定工
具使用個別檢視表註冊*
*（例如僅存在於特定畫
面上的篩選或檢查工具）。

### 框架生命週期接受度

僅在擁有的 UI
掛載/融合後於瀏覽器中註冊；絕不在
SSR
期間執行瀏覽器全域物件。請在各框架中使用適當的生命週期掛勾：

-
React：在
`useEffect`
內部建立範圍並回傳其處置器。
開發嚴格模式會
重複設定/清理；
處置器可防止重複註冊。

這些是整合指南，
而非經測試的框架版本認證。
在資訊清單與
驗證報告中記錄實際的框架/瀏覽器版本。

### 身分驗證 / 角色 (SaaS)

絕不要註冊目前工作階段無法透過
UI
使用的工具。
在登入/登出/角色變更/租戶切換時：處置現有工具範圍並根據新的使用者權限重新建立。

## 來源試用 / 旗標備註

WebMCP 是一項
Chrome
來源試用（149→，穩定里程碑仍在估計中）。
對於生產環境暴露，來源需要試用權杖；本機開發使用
`--enable-blink-features=WebMCPTesting`。



