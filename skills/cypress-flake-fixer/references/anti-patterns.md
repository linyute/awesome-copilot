# Cypress 反模式：修正前與修正後

每個掃描器規則對應一個章節。各章節展示失敗的程式碼型態、導致測試不穩定的原因，以及替代方案。

## CY001 fixed-wait (固定等待)

```js
// 修正前
cy.get('[data-cy=save]').click()
cy.wait(3000)
cy.get('[data-cy=toast]').should('contain', 'Saved')

// 修正後：該等待原本是為了涵蓋網路請求
cy.intercept('PUT', '/api/profile').as('saveProfile')
cy.get('[data-cy=save]').click()
cy.wait('@saveProfile').its('response.statusCode').should('eq', 200)
cy.get('[data-cy=toast]').should('contain', 'Saved')
```

延遲時間在慢速機器上往往太短（造成測試不穩定），在一般機器上又太長（拖慢整體測試套件）。當等待是為了涵蓋應用程式中的計時器時，請模擬時鐘：

```js
cy.clock()
cy.visit('/search')
cy.get('[data-cy=query]').type('shoes')
cy.tick(300) // 防抖 (debounce) 間隔
cy.get('[data-cy=result]').should('have.length.greaterThan', 0)
```

`cy.clock()` 必須在 `cy.visit()` 之前執行，以擷取應用程式在載入時所建立的計時器。

## CY002 assigned-return-value (指派傳回值)

```js
// 修正前
const row = cy.get('[data-cy=row]').first()
row.click()
row.should('have.class', 'selected')

// 修正後
cy.get('[data-cy=row]').first().as('row')
cy.get('@row').click()
cy.get('@row').should('have.class', 'selected')
```

命令傳回的是可鏈結物件 (chainable)，而非 DOM 元素。重複使用變數會將新命令鏈結到僅擷取過一次的主體上。別名則會在每次讀取時重新執行查詢。

若要在稍後的測試中使用某個值，請巢狀處理或為該值設定別名：

```js
cy.get('[data-cy=order-id]').invoke('text').as('orderId')
cy.get('@orderId').then((orderId) => {
  cy.visit(`/orders/${orderId}`)
})
```

`cy.stub()` 與 `cy.spy()` 是同步的，可以直接進行變數指派。

## CY003 async-await (使用非同步語法)

```js
// 修正前
it('loads the user', async () => {
  const user = await cy.request('/api/me')
  expect(user.body.name).to.eq('Ada')
})

// 修正後
it('loads the user', () => {
  cy.request('/api/me').its('body.name').should('eq', 'Ada')
})
```

命令並非 Promise。`await` 會在錯誤的時間點解析或永遠不解析，且 `async` 測試函式傳回的 Promise 會與 Cypress 自身的佇列產生競爭。在 `cy.then()` 或 `cy.wrap(promise)` 內部等待真實的 Promise 是允許的。

## CY004 force-true (強制執行)

```js
// 修正前
cy.get('[data-cy=submit]').click({ force: true })

// 修正後：該按鈕原本被 Cookie 橫幅遮蔽
cy.get('[data-cy=cookie-accept]').click()
cy.get('[data-cy=cookie-banner]').should('not.exist')
cy.get('[data-cy=submit]').click()
```

請閱讀在加入 `force` 之前 Cypress 印出的可操作性 (actionability) 錯誤。它會指明原因：

| 錯誤訊息 | 常見原因 | 修正方式 |
|---|---|---|
| is being covered by another element | 覆蓋層、固定置頂頁首、橫幅、提示訊息 | 關閉它，或使用 `scrollIntoView()` 捲動並對位置進行判斷提示 |
| is not visible | 折疊選單、`display: none`、尺寸為零 | 先開啟父層元素 |
| is disabled | 表單尚未驗證有效、請求處理中 | 在操作前判斷提示 `.should('be.enabled')` |
| is animating | 轉場動畫仍在執行 | 對最終狀態進行判斷提示；切勿全域停用檢查 |

對於隱藏在樣式控制項後方的原生輸入項（例如自訂檔案上傳或核取方塊），使用 `force: true` 是合法的。保留此類用法並加上註解。

## CY005 chain-after-action (動作後鏈結呼叫)

```js
// 修正前
cy.get('[data-cy=todo]').first().click().find('[data-cy=delete]').click()

// 修正後
cy.get('[data-cy=todo]').first().click()
cy.get('[data-cy=todo]').first().find('[data-cy=delete]').click()
```

動作只會執行一次。若它觸發了重新轉譯，沿鏈結傳遞下去的主體將是舊元素，下一條命令便會因 detached-DOM 錯誤而失敗，或操作在已不在螢幕上的節點。新的 `cy.get()` 則會重新查詢。

當元素不可能被替換時，鏈結呼叫是沒問題的：例如在一般輸入框上執行 `cy.get(input).focus().clear().type('x')`。

## CY006 one-shot-assertion (單次判斷提示)

```js
// 修正前
cy.get('[data-cy=count]').then(($el) => {
  expect(Number($el.text())).to.eq(3)
})

// 修正後：簡單情況
cy.get('[data-cy=count]').should('have.text', '3')

// 修正後：當數值需要處理時
cy.get('[data-cy=count]').should(($el) => {
  expect(Number($el.text())).to.eq(3)
})
```

`.then()` 會以元素在該瞬間所包含的內容僅執行其回呼一次。`.should(callback)` 則會持續重新執行查詢與回呼，直到不再擲出例外為止。請勿在 `.should()` 回呼內部呼叫 `cy` 命令。

在單次執行的命令之後（例如 `cy.request()`、`cy.task()`、`cy.wait('@alias')` 與 `cy.env()`），使用 `.then()` 是正確的。

## CY008 conditional-on-dom (基於 DOM 的條件判斷)

```js
// 修正前
cy.get('body').then(($body) => {
  if ($body.find('[data-cy=promo-modal]').length) {
    cy.get('[data-cy=promo-close]').click()
  }
})

// 修正後：控制條件本身
cy.intercept('GET', '/api/promotions', { body: [] })
cy.visit('/')
cy.get('[data-cy=promo-modal]').should('not.exist')
```

`if` 會在任意時刻僅執行一次。若強制對話框在 50 毫秒後才轉譯，測試將會在對話框仍開啟的狀態下繼續執行。請從源頭消除不確定性：模擬回應、預置資料，或設定決定分支走向的 Cookie 或特性旗標。

## CY009 exclusive-or-debug (獨佔執行或偵錯語法)

在認可 (commit) 之前，請移除 `.only`、`cy.pause()` 與 `cy.debug()`。已認可的 `.only` 會在無訊息的情況下停用規格中的所有其他測試。

## CY010 cleanup-in-after-hook (在 after 勾點中清理)

```js
// 修正前
afterEach(() => { cy.task('db:reset') })

// 修正後
beforeEach(() => { cy.task('db:reset') })
```

當執行被取消、瀏覽器當機或開發者重新整理執行器時，`after` 勾點不會執行。這會導致下一次執行從受污染的狀態開始。優先在事前重設也能將失敗狀態保留在現場以供偵錯。

## CY011 absolute-local-visit (造訪本機絕對路徑)

在 `cypress.config` 中設定 `baseUrl`，並呼叫 `cy.visit('/login')`。若不設定，Cypress 會在隨機的 localhost 連接埠上載入，並在第一次執行 `cy.visit()` 時重新載入，且同一個規格將無法針對其他環境執行。

## CY012 ui-login-without-session (未使用 session 的 UI 登入)

```js
// cypress/support/commands.js
Cypress.Commands.add('login', (email) => {
  cy.session(['login', email], () => {
    cy.env(['userPassword']).then(({ userPassword }) => {
      cy.request('POST', '/api/login', { email, password: userPassword })
    })
  }, {
    validate() {
      cy.request('/api/me').its('status').should('eq', 200)
    },
  })
})

// 在測試規格中
beforeEach(() => {
  cy.login('ada@example.com')
  cy.visit('/dashboard')
})
```

- 將改變工作階段的每個輸入項放入 `id` 陣列中，絕不可放入密碼。
- 執行 `cy.session()` 後頁面為空白；請呼叫 `cy.visit()`。
- 在舊於 15.10 的 Cypress 版本中，請使用 `Cypress.env('userPassword')` 代替 `cy.env()` 來讀取密碼。
- 保留一個透過 UI 登入的測試。其餘測試皆應使用快取的工作階段。

## CY013 positional-selector 與 CY101 brittle-selector (位置選取器與脆弱選取器)

```js
// 修正前
cy.get('ul.results > li:nth-child(2) .btn-primary').click()

// 修正後
cy.get('[data-cy=result]').eq(1).find('[data-cy=open]').click()
// 或者，當該資料列可由內容識別時
cy.contains('[data-cy=result]', 'Invoice 1042').find('[data-cy=open]').click()
```

類別名稱會隨樣式修改而變更，位置則會隨排序與資料而變動。在缺少 `data-cy` 屬性時，請為應用程式新增這些屬性；這對於測試修復來說是完全合法的應用程式修改。

## CY102 negative-assertion-as-wait (將否定判斷提示當作等待)

```js
// 修正前
cy.get('[data-cy=save]').click()
cy.get('[data-cy=spinner]').should('not.exist')
cy.get('[data-cy=status]').should('have.text', 'Saved')

// 修正後
cy.get('[data-cy=save]').click()
cy.get('[data-cy=status]').should('have.text', 'Saved')
```

若微調圖示尚未轉譯，`should('not.exist')` 會立即通過。針對最終狀態的判斷提示本就會等待適當時機。僅在正向判斷提示已證明頁面達到預期狀態之後，才保留否定判斷提示。

## CY103 variable-wait (變數等待)

帶有數值常數的 `cy.wait(TIMEOUT)` 只是換了名稱的 CY001。若變數儲存的是 `'@orders'`，則 `cy.wait(alias)` 是沒問題的。請檢查其宣告。

## 掃描器無法察覺的模式

- **攔截器註冊太晚。** 比較 `cy.intercept()` 與觸發請求的動作或 `cy.visit()` 之間的先後順序。
- **共用可變測試資料。** 當測試規格平行執行時，兩個編輯同一筆預置記錄的規格會發生衝突。請為每個測試建立各自獨立的記錄。
- **順序相依性。** 使用 `.only` 執行失敗的測試。若它單獨執行時失敗，代表先前有其他測試在為它設定狀態。
- **時間與地區設定 (Locale)。** 針對格式化日期或「今天」的判斷提示在接近午夜或不同時區時會失敗。使用 `cy.clock(new Date(2025, 0, 15))` 固定時鐘。
- **第三方指令碼。** 分析工具與聊天小工具會以不可預測的方式拖慢頁面載入速度。使用 `blockHosts` 組態選項將其封鎖。
- **視角 (Viewport) 相依的版面配置。** 在斷點以下收折的選單，在 CI 視角不同時會有不同的行為。請在組態中設定 `viewportWidth` 與 `viewportHeight`。
