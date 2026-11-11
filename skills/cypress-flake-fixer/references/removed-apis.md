# 依主要版本劃分的 Cypress 已移除或變更之 API

掃描器會將這些報告為 CY007。當安裝的主要版本已拒絕使用某項目時，該項目將被評級為 `error`。請務必對照[官方移轉指引](https://docs.cypress.io/app/references/migration-guide)以確認確切目標版本的細節。

## Cypress 16

需要 Node.js 22、24 或 26+。

| 已移除或變更 | 替代方案 |
|---|---|
| `Cypress.env()` | 機敏值使用 `cy.env([...])`，公開值使用 `Cypress.expose()` |
| 測試或測試套件組態物件中的 `env` | `expose` |
| `allowCypressEnv` 組態選項 | 刪除 |
| `cy.exec()`, `execTimeout` | `setupNodeEvents` 中的 `cy.task()`，`taskTimeout` |
| `.end()` | 刪除該呼叫 |
| `cy.getCookie()`, `cy.getCookies()`, `cy.getAllCookies()`, `cy.getAllLocalStorage()`, `cy.getAllSessionStorage()` | 現為查詢 (queries)：鏈結 `.should()`；使用 `Cypress.Commands.overwriteQuery()` 進行覆寫 |
| 測試期間呼叫 `Cypress.config('viewportWidth' / 'viewportHeight' / 'blockHosts', v)` | 使用 `cy.viewport(w, h)`；在測試組態物件中使用 `{ blockHosts: '...' }` |
| `experimentalMemoryManagement: true` | 刪除（預設已開啟，更名為 `manageBrowserMemory`） |
| `experimentalMemoryManagement: false` | `manageBrowserMemory: false` |
| `experimentalFastVisibility` | 刪除；`visibilityStrategy` 預設為 `'modern'` |
| `experimentalSourceRewriting` | 刪除；若原本用於處理 SRI 錯誤，改用 `removeSRIAttributes` |
| `keystrokeDelay` 預設為 10 | 預設改為 0；僅在應用程式需要時向單一 `.type()` 傳入 `{ delay: 10 }` |
| CoffeeScript 測試規格、支援檔案、測試載體 (fixtures) | 轉換為 JavaScript 或 TypeScript |
| `cypress/angular-zoneless` | `cypress/angular` |
| 將 Electron 作為測試瀏覽器 | 已淘汰：設定 `defaultBrowser: 'chrome'` 或傳入 `--browser chrome` |

16 中的元件測試最低版本需求：Angular 21、Vite 8、Next.js 15.0.4。

### 移轉 `Cypress.env()`

針對每個鍵 (key) 判斷其值是否屬於機敏資訊。

**公開值**（特性旗標、API 版本、公開 URL）純屬機械式替換，因為 `Cypress.expose()` 與它所取代的 API 一樣是同步的：

```js
// cypress.config.js
module.exports = defineConfig({
  expose: { apiVersion: 'v2', featureNewCheckout: true },   // 從 env 移出
  env: { apiKey: process.env.API_KEY },                     // 機敏資訊保留在 env
})

// 修正前
const version = Cypress.env('apiVersion')
// 修正後
const version = Cypress.expose('apiVersion')
```

- CLI：`--env apiVersion=v2` 改為 `--expose apiVersion=v2`（簡寫為 `-x`）。
- 個別測試：`it('...', { env: { flag: true } }, ...)` 改為 `{ expose: { flag: true } }`。
- `CYPRESS_*` 環境變數會填入 `env` 而非 `expose`。由 CI 作為 `CYPRESS_apiVersion` 插入的公開值，必須透過 `cy.env()` 讀取，或在組態檔案中複製至 `expose`（`expose: { apiVersion: process.env.API_VERSION }`）。

**機敏值**需要調整程式碼結構，因為 `cy.env()` 是一個非同步命令：

```js
// 修正前：在模組範圍讀取，任何位置皆可使用
const apiKey = Cypress.env('apiKey')
it('lists users', () => {
  cy.request({ url: '/api/users', headers: { Authorization: `Bearer ${apiKey}` } })
})

// 修正後：在測試內部讀取，在回呼內部使用
it('lists users', () => {
  cy.env(['apiKey']).then(({ apiKey }) => {
    cy.request({ url: '/api/users', headers: { Authorization: `Bearer ${apiKey}` } })
  })
})
```

- `cy.env()` 接受鍵的陣列並產生一個物件。未定義的鍵會產生 `undefined`。
- 它不能在模組範圍或測試/勾點外部呼叫。
- 它不能設定值。過去使用 `Cypress.env('token', value)` 在步驟之間傳遞狀態的程式碼，應改為在單一測試中使用別名，或跨測試使用一對 `set`/`get` 工作 (tasks)。
- 產生的值不會被遮罩。不要針對它們進行判斷提示或將它們傳遞給 `.its()`。
- 在 `cy.origin()` 內部，請在回呼內部呼叫 `cy.env()`。

呼叫 `Cypress.env()` 的**外掛程式**在 Cypress 16 上會擲出錯誤。請在同一個變更中將它們升級。已知最低版本需求：`@cypress/grep` 6.0.0、`@cypress/code-coverage` 4.0.0、`cypress-mailpit` 2.0.0。升級前請在其他 Cypress 外掛程式的 `node_modules` 中搜尋 `Cypress.env(`。

在 Cypress 15.10 至 15.x 上，移轉後設定 `allowCypressEnv: false` 可讓任何殘留的 `Cypress.env()` 呼叫提前失敗。升級至 16 時請移除此選項。

### 移轉 `cy.exec()`

```js
// cypress.config.js
const { execFileSync } = require('node:child_process')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        seedDatabase(fixture) {
          execFileSync('node', ['scripts/seed.js', fixture], { stdio: 'inherit' })
          return null
        },
      })
    },
  },
})

// 修正前
cy.exec('node scripts/seed.js users')
// 修正後
cy.task('seedDatabase', 'users')
```

- 工作必須傳回一個值或 `null`。傳回 `undefined` 會導致工作失敗。
- 搭配引數陣列使用 `execFileSync`，避免測試輸入傳入 Shell 中。
- 工作預設會在 60 秒後逾時；針對耗時較長的工作請設定 `taskTimeout`。

## Cypress 15

需要 Node.js 20、22 或 24+（放棄對 18 與 23 的支援）。

| 已移除或變更 | 替代方案 |
|---|---|
| `cy.stub(obj, 'method', fn)` | `cy.stub(obj, 'method').callsFake(fn)` |
| `cy.exec(...).its('code')` | `exitCode` |
| `Cypress.SelectorPlayground` | `Cypress.ElementSelector` |
| Webpack 4 | Webpack 5 |
| 透過 CDP 進行 Firefox 自動化 | 僅支援 WebDriver BiDi；Firefox 135+（自 15.19 起為 140+） |
| 搭配 `@cypress/vite-dev-server` 的 CommonJS 組態 | ESM 組態（`.mjs`、`"type": "module"` 或 `cypress.config.ts`） |

## Cypress 14

| 已移除或變更 | 替代方案 |
|---|---|
| 針對不同子網域的命令可在沒有 `cy.origin()` 的情況下運作 | 將其包裝在 `cy.origin()` 中；`injectDocumentDomain` 為已淘汰的應急方案 |
| `experimentalSkipDomainInjection` | 已移除 |
| `experimentalJustInTimeCompile` | `justInTimeCompile` |

## Cypress 13

| 已移除或變更 | 替代方案 |
|---|---|
| `video` 預設為 `true` | 預設為 `false`；若 CI 依賴影片請明確啟用 |
| `videoUploadOnPasses` | 已移除 |

## Cypress 12

| 已移除或變更 | 替代方案 |
|---|---|
| `cy.server()`, `cy.route()` | `cy.intercept()` |
| `Cypress.Cookies.preserveOnce()`, `Cypress.Cookies.defaults()` | `cy.session()` |
| `experimentalSessionAndOrigin` | 刪除；`cy.session()` 與 `cy.origin()` 已穩定 |
| 測試之間共用頁面與儲存狀態 | `testIsolation` 已開啟：每個測試皆從具有清空 Cookie 與儲存空間的空白頁面開始 |

從 `cy.route()` 移轉至 `cy.intercept()` 不僅僅是重新命名。改變測試行為的差異包括：

- `cy.intercept()` 會 glob 比對包含查詢字串的完整 URL。`cy.intercept('/api/users')` 永遠不會符合 `/api/users?page=2`；請使用 `'/api/users*'` 或 `{ pathname: '/api/users' }`。
- 當未指定 HTTP 方法時，`cy.intercept()` 會比對所有 HTTP 方法。而 `cy.route()` 預設為 `GET`。
- 當有多個攔截器相符時，最近定義的攔截器會優先執行。在 `beforeEach` 中定義一般 stub，並在測試內部定義覆寫。
- 從瀏覽器快取提供的回應永遠不會到達網路層，因此攔截器不會觸發，進而導致 `cy.wait('@alias')` 逾時。請在測試伺服器上停用快取標頭。
- `cy.intercept()` 也會捕捉 `fetch` 請求與靜態資源，而 `cy.route()` 則不會。
