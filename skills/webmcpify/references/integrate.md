# 整合 — 各技術堆疊的模式 (Integrate)

> 線上時優先參考即時官方指南：
> `npx -y modern-web-guidance@latest retrieve "webmcp,agentic-forms,agentic-javascript-tools"`。
> 以下模式遵循 Google 的參考實作
> (GoogleChromeLabs/webmcp-tools) 與 W3C CG 草案。

## 宣告式 — 標準 HTML 表單

適用於純 HTML、SSG 發出、伺服器端呈現以及架構呈現的
（非受控）表單 — 任何存在帶有具名控制項之真實 `<form>` 的地方。
註釋現有表單；請勿重構其結構。

```html
<form toolname="request_quote"
      tooldescription="Requests a project quote. A team member replies within one business day."
      action="/contact" method="post">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required
         toolparamdescription="Email address for the reply">
  <!-- …現有欄位，每個欄位均帶有 label[for] + name + toolparamdescription… -->
  <button type="submit">Request quote</button>
</form>
```

規則：
- 瀏覽器從控制項推導 JSON Schema — 每個控制項都需要
  `name`、可解析的說明（`toolparamdescription` → `label[for]` 文字 →
  `aria-description`）以及正確的 HTML 限制條件。選項按鈕群組：說明放置於
  外層的 `<fieldset>` 上。
- `toolautosubmit` **僅限** 用於純讀取表單（搜尋/篩選/可用性）。
  絕不用於聯絡/結帳/設定/訊息表單。
- 透過 Fetch 提交的表單 (`preventDefault()`) 必須將結果傳回給
  代理程式 — 最常見的整合錯誤是被吞沒的提交：

```js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const result = doSubmit(new FormData(e.target))
    .then(() => 'Request received. Reply within one business day.');
  if (e.agentInvoked) e.respondWith(result); // 傳遞 PROMISE，而非值
});
```

- 選擇性 UX（逐字引自 Chrome 文件）：使用
  `form:tool-form-active` / `:tool-submit-active` CSS 虛擬類別設定代理程式活動樣式。
- 導覽至感謝頁面的表單：`executeTool` 在導覽時傳回 `null`
  （符合預期）。目標頁面上的 JSON-LD `{"@type":"Message","text":"…"}` 區塊
  是盡力而為的點綴 — 該機制仍在規範討論中；
  絕不要使行為依賴於它。

### 架構附註 — React

- 在環境型別旁提供 `templates/webmcp-jsx.d.ts`，以便嚴格的 TSX
  接受 `toolname`/`tooldescription`/`toolparamdescription`（它擴充了
  React 屬性介面；它是一個模組檔案 — 保持與
  `webmcp.d.ts` 分離）。
- 型別宣告為字串值（布林屬性樣式）：寫入
  `toolautosubmit=""` — 且僅在純讀取表單上使用（基本規則 5）。
- 在 `onSubmit` 中，WebMCP 欄位位於原生 (NATIVE) 事件上：

  ```tsx
  const native = e.nativeEvent as SubmitEvent;
  if (native.agentInvoked) native.respondWith?.(doSubmit(new FormData(e.currentTarget))
    .then(() => 'Request received. Reply within one business day.'));
  ```

  傳遞結果字串的 PROMISE，而非已解析的值。

## 命令式 — SPA 與動態應用程式

使用隨附的執行階段 (`runtime.md`)。每個應用程式的工具位於專用模組中
（例如 `src/webmcp/tools.ts`），與元件分離：

```ts
import { createToolScope, dispatchAndWait } from './webmcpify';

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
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input: Record<string, unknown>) {
    const q = String(input.query ?? '').trim();
    if (!q) return 'ERROR: `query` must be a non-empty string.';
    return dispatchAndWait('webmcp:search_tickets', { query: q });
  },
};
```

關鍵規則：
- **`execute()` 包裝現有的 UI 程式碼路徑** — 發送相同的事件 / 呼叫
  相同的儲存庫動作 / 存取與按鈕相同的 API。絕不使用平行實作。
- **僅在介面狀態穩定後傳回**：元件接聽程式
  等待實際工作完成，然後觸發帶有結果負載的完成事件
  (`{ ok, message | error }`) — 完整協定與元件範例見
  `runtime.md`。在工作完成前給出假成功是錯誤的通過狀態。
- 傳回簡短字串；錯誤以 `"ERROR: <what and how to fix>"` 形式傳回，以便模型可以
  自我修正。輸出長度限制在約 1.5k 字元。
- 在程式碼中嚴格驗證，在結構描述中寬鬆驗證 — 並保持**與
  表單原生 HTML 限制條件一致**：當工具包裝表單時，在獨立的複本上探測真實的
  限制條件，而非重新實作它們 —
  `const probe = emailInput.cloneNode() as HTMLInputElement; probe.value = value;`
  然後在 `!probe.checkValidity()` 時拒絕。`execute()` 必須恰好拒絕
  表單本身會拒絕的內容。

### 註冊與生命週期

- **靜態註冊是預設方式**：在啟動程序時一次性註冊全應用程式工具。
- **僅針對**在其檢視之外沒有意義的工具進行個別檢視註冊 — 透過
  檢視掛載/卸載中的 `createToolScope`（React `useEffect` 清理、Vue
  `onUnmounted`、Angular `DestroyRef`）。過度限定範圍會使工具集閃爍，並在
  方案規劃中途讓代理程式停滯。
- 註冊失敗會復原該範圍並透過 `onError` 呈現 — 在整合期間檢查
  主控台；無聲無息缺失的工具集通常意味著重複的
  名稱或無效的結構描述導致批次被拒絕。

### 身分驗證 / 角色 (SaaS)

切勿註冊目前工作階段無法透過 UI 使用的工具。在
登入/登出/角色變更/租戶切換時：處置該範圍並重新註冊
正確的集合 (`runtime.md` §Wiring)。伺服器仍會重新檢查所有內容（基本
規則 3）— 角色範圍的註冊是 UX 衛生考量，而非安全性機制。

## 源試用 / 旗標說明

WebMCP 是 Chrome 源試用（149→，穩定里程碑仍為估計值）。對於
生產環境公開，來源需要一個權杖：
`<meta http-equiv="origin-trial" content="TOKEN">` 或 `Origin-Trial` 回應
標頭 — 在 Chrome Origin Trials 主控台註冊。對於本地工作，
`chrome://flags/#enable-webmcp-testing`。Chrome **會靜默忽略** 過期的
權杖，因此不能依賴 WebMCP 必須存在（基本規則 4）。在設定時向目標存放庫的
README 新增簡短說明，並在 `pipeline.setup.originTrialNoted` 中記錄修改的
檔案路徑（例如 `["README.md"]`）。
