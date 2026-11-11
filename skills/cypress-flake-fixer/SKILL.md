---
name: cypress-flake-fixer
description: '在現有的 Cypress 測試套件中尋找並修正容易導致不穩定的反模式，以及在 Cypress 12 至 16 中移除的 API。隨附零相依性的掃描器，用於偵測固定的 cy.wait() 延遲、指派命令傳回值、async/await、force: true、動作後的鏈結呼叫、.then() 內部的單次 expect()、條件式測試，以及已移除的 API（如 Cypress.env()、cy.exec()、cy.server()/cy.route()）。適用於被要求修復不穩定的 Cypress 測試、移除 cy.wait、穩定或強化 Cypress 測試套件、稽核 Cypress 規格檔、偵錯「detached from the DOM」錯誤，或準備升級至 Cypress 15 或 16 時。'
---

# Cypress 不穩定測試修復器 (Cypress Flake Fixer)

針對現有的 Cypress 測試套件進行程式碼模式稽核，找出導致非預期失敗的原因，並在不藉助重試機制、拉長逾時時間或使用 `force: true` 掩蓋問題的情況下進行修復。

## 何時使用此技能

- Cypress 測試規格在本機通過但在 CI 中失敗，或每隔幾次執行就會失敗一次
- 測試套件包含 `cy.wait(<數字>)`、`{ force: true }`，或只有按特定順序執行才能通過的測試
- 錯誤訊息提及「detached from the DOM」、「timed out retrying」，或主體「is no longer attached」
- 專案正在進行跨主要版本（12 到 16）的 Cypress 升級
- 需要對 Cypress 測試程式碼進行審查

若要從頭開始撰寫新的 Cypress 測試，遵循編程標準即可。本技能旨在診斷並修復現有的測試套件。

## 先決條件

- Node.js 18 或更新版本以執行掃描器（零相依性，不需要安裝 Cypress）
- 從 `package.json` 讀取 Cypress 版本。修正方式因主要版本而異

## 工作流程

### 1. 掃描

```bash
node ./scripts/scan-cypress.mjs <project-root>
node ./scripts/scan-cypress.mjs <project-root> --json          # 機器可讀格式
node ./scripts/scan-cypress.mjs <project-root> --strict        # 加入低信心度規則
node ./scripts/scan-cypress.mjs cypress/e2e/checkout.cy.ts     # 單一檔案
```

掃描器會從最近的 `package.json` 讀取 Cypress 版本，並將已移除的 API 分級：若安裝的主要版本已拒絕使用則標記為 `error`，若升級時會發生中斷則標記為 `warn`。執行 `--list-rules` 可檢視規則目錄。

掃描結果屬於啟發式推斷。編輯前請先開啟各位置進行確認。

### 2. 在進行任何變更前先測量

當目標是修復特定的不穩定規格時，請先記錄其失敗頻率。沒有基準就無法區分是真正修復還是單純運氣好。

```bash
for i in $(seq 1 20); do npx cypress run --spec "cypress/e2e/checkout.cy.ts" --quiet || echo "FAIL $i"; done
```

若某個規格在 10 次執行中失敗 1 次，在修復後大約需要連續成功執行 30 次，才能證實修復有效。

### 3. 依此順序修復

| 順序 | 規則 | 優先修復原因 |
|---|---|---|
| 1 | CY002, CY003, CY007 評級為 `error` | 測試本身錯誤或已損毀；其他修正需建立在正確的命令流程之上 |
| 2 | CY001, intercept 順序 | 基於時間的等待是測試不穩定的最大單一來源 |
| 3 | CY005, CY006 | 損毀的可重試性 (retry-ability) 會導致 DOM 分離 (detached-DOM) 與單次判斷提示失敗 |
| 4 | CY004 | `force: true` 會掩蓋真實的重疊、動畫或停用狀態 |
| 5 | CY008, CY010, CY012 | 狀態洩漏與順序相依性 |
| 6 | CY013, CY101, CY102 | 選取器與判斷提示衛生習慣 |

每條規則的修正前後程式碼請參閱 [references/anti-patterns.md](./references/anti-patterns.md)。已移除 API 的替代方案請參閱 [references/removed-apis.md](./references/removed-apis.md)。僅閱讀正在修復之規則的章節，切勿預先載入兩份完整檔案。

### 4. 將每個固定等待替換為其所代表的條件

切勿直接刪除 `cy.wait(n)` 或換成隨意猜測的值。先理清該延遲原本涵蓋了什麼：

| 該等待所涵蓋的內容 | 替換為 |
|---|---|
| 網路請求 | 在觸發前註冊 `cy.intercept(...).as('x')`，接著執行 `cy.wait('@x')` |
| 請求或狀態變更後的轉譯 | 針對產生的 DOM 進行 `.should()` 斷言 |
| 防抖 (debounce)、節流 (throttle)、輪詢間隔或提示訊息 (toast) 逾時 | 在 `cy.visit()` 前呼叫 `cy.clock()`，接著呼叫 `cy.tick(ms)` |
| CSS 動畫或轉場 | 針對最終狀態進行判斷提示；Cypress 在操作前本就會等待元素停止移動 |
| 伺服器轉譯 HTML 的用戶端水合作用 (hydration) | 應用程式在水合作用完成時設定的信號（參見常見陷阱） |
| 未知 | 在 `npx cypress open` 中執行測試，在命令記錄 (Command Log) 中選取該等待，並讀取在此期間發生的請求與 DOM 變更 |

### 5. 驗證

1. 單獨執行已變更的規格，重複執行次數至少與基準測試相同。
2. 重新執行掃描器並比較每條規則的計數。
3. 執行一次完整測試套件，以捕捉由該變更所暴露出的順序相依性問題。

## 修復本身應遵循的規則

- 僅修改測試程式碼。若測試暴露出應用程式錯誤（重複提交、遺漏載入狀態、UI 競爭條件），請回報問題而非繞過它。
- 不要提高 `defaultCommandTimeout`、新增 `retries` 或新增 `{ force: true }` 來讓測試通過。這些都會將可見的失敗轉變為更慢或被隱藏的失敗。
- 不要將 `cy.wait(2000)` 替換為 `cy.wait(5000)`，或替換為針對已存在元素呼叫的 `.should('exist')`。
- 每個認可 (commit) 保持一個規則類別，以便二分搜尋 (bisect) 回歸問題。
- 優先修復 `cypress/support` 中的共用自訂命令。命令內部的固定等待會在呼叫它的每個測試中執行。

## 常見陷阱

- **在請求可能觸發之前註冊 `cy.intercept()`。** 對於在頁面載入時發出的請求，這意味著要在 `cy.visit()` 之前註冊。在請求發出後才註冊的攔截器永遠不會相符，且 `cy.wait('@alias')` 會隨網路速度不定時發生逾時。
- **每個 `cy.wait('@alias')` 只取用一個請求。** 若應用程式呼叫該端點兩次，第一次等待會在第一次呼叫時解析，而判斷提示則會針對過期資料執行。針對每次預期的呼叫等待一次，或直接對 DOM 進行判斷提示。
- **GraphQL 所有操作都使用同一個 URL。** 在處理函式內部設定別名：`cy.intercept('POST', '/graphql', (req) => { if (req.body.operationName === 'GetOrders') req.alias = 'getOrders' })`。
- **`.should('not.exist')` 在元素轉譯之前就會通過。** 用它來等待載入微調圖示 (spinner) 消失時，在緩慢頁面上會立刻判定成功。請針對正向的最終狀態進行判斷提示。
- **伺服器轉譯的應用程式在掛載處理函式之前即可接受點擊。** 在 Next.js、Nuxt、SvelteKit 和 Remix 中，按鈕在伺服器 HTML 中是可見且啟用的，因此 Cypress 會在水合作用期間點擊它，導致毫無反應。請讓應用程式在水合作用完成時設定標記（例如透過掛載 effect 在 `<body>` 上設定 `data-hydrated` 屬性），並在 `cy.visit()` 之後對其進行判斷提示。
- **鏈結呼叫中間的 `.should()` 會固定主體。** 其後的查詢無法跨越該判斷提示重新查詢，因此重新轉譯會產生 detached-DOM 錯誤。請在該判斷提示處將鏈結呼叫拆開。
- **`.then()` 即便內部沒有判斷提示也會中斷重試鏈結。** 其前面的所有操作都只會執行一次。
- **Cypress 16 在按鍵之間沒有延遲進行鍵入**（`keystrokeDelay` 預設值由 10 改為 0）。每次按鍵都會重新轉譯或對輸入進行防抖的欄位，現在可能會漏掉字元或只觸發一次。鍵入後應針對欄位的值進行判斷提示，而非還原延遲設定。
- **Cypress 16 將 Cookie 與儲存取得器轉換為查詢。** `cy.getCookie()`、`cy.getCookies()`、`cy.getAllCookies()`、`cy.getAllLocalStorage()` 和 `cy.getAllSessionStorage()` 現在會對鏈結的 `.should()` 判斷提示進行重試，消除對驗證 Cookie 等待的需求。
- **執行 `cy.session()` 後頁面呈現空白。** 其後若缺少 `cy.visit()`，看起來會像是不穩定的選取器失敗。
- **`testIsolation: false` 會跨測試共用狀態。** 若組態設定了此項，所有順序相依的失敗都是預期行為而非不穩定。診斷前請檢查組態。
- **除非設定回報，否則重試機制會隱藏不穩定現象。** 若要找出不穩定測試而非掩蓋它們，請使用會重試且依然判定失敗的實驗性策略：

  ```js
  retries: {
    experimentalStrategy: 'detect-flake-but-always-fail',
    experimentalOptions: { maxRetries: 2, stopIfAnyPassed: true },
    openMode: true,
    runMode: true,
  }
  ```

- **CY005 需依情況判斷。** 對於永不重新轉譯的輸入框執行 `cy.get(input).clear().type('x')` 是沒有問題的。但當元素屬於清單、會重新掛載欄位的表單函式庫，或任何由非同步狀態驅動的元件時，請拆分鏈結。

## 報告格式

```markdown
## Cypress 不穩定測試稽核：<scope>

- Cypress 版本：<range>, major <n>
- 掃描檔案數：<n>
- 基準測試：<spec> 在 <n> 次執行中失敗 <f> 次

| 規則 | 修正前 | 修正後 | 備註 |
|---|---|---|---|
| CY001 固定等待 | 14 | 0 | 9 個替換為 intercept 別名，5 個替換為判斷提示 |

### 未修正
- <location>: <原因，例如需要修改應用程式程式碼>

### 發現的應用程式問題
- <測試暴露出的行為>

### 驗證
- <spec>: 變更後 <n> 次執行中有 <n> 次通過
```

## 疑難排解

| 問題 | 解決方案 |
|---|---|
| 掃描器回報「No Cypress files found」 | 傳入包含 `cypress/` 或 `*.cy.*` 檔案的資料夾。不在慣例路徑下的規格可傳入明確檔案路徑 |
| 發現項目為誤報 | 在同一行或前一行新增 `// cy-scan-ignore CY0xx` 並附上原因 |
| 版本顯示「not detected」 | 傳入 `--cypress-major <n>`；在 Monorepo 中，從相依於 Cypress 的套件目錄執行掃描器 |
| 修正後測試僅在 CI 中失敗 | 比較檢視區 (viewport)、瀏覽器與 CPU。使用 CI 瀏覽器搭配 `--browser chrome --headless` 在本機執行，並節流 CPU 以暴露時間差異 |
| 變更後 `cy.wait('@alias')` 逾時 | 攔截器在請求發出後才註冊、URL 模式缺少查詢字串（加上 `*`），或請求從快取提供而從未經過網路 |

## 參考資料

- [references/anti-patterns.md](./references/anti-patterns.md)：每個掃描器規則的修正前後程式碼
- [references/removed-apis.md](./references/removed-apis.md)：依 Cypress 主要版本劃分的已移除 API，附帶 `Cypress.env()` 與 `cy.exec()` 的移轉程式碼
- [Cypress 可重試性 (retry-ability)](https://docs.cypress.io/app/core-concepts/retry-ability)
- [Cypress 移轉指引 (migration guide)](https://docs.cypress.io/app/references/migration-guide)
