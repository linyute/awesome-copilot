# Partner Center DOM 與自動化參考

Partner Center 是以自訂 Web 元件建置的單頁應用程式。
以下細節是觀察到的模式，而非永久的合約。
在每個會變更狀態的操作之前，先檢視實際的 DOM。

## 路由

```text
Store 開發者首頁
https://storedeveloper.microsoft.com/

產品概觀
https://partner.microsoft.com/en-US/dashboard/products/{productId}/overview

協議
https://partner.microsoft.com/en-US/dashboard/account/v3/settings/agreements

提交區段
https://partner.microsoft.com/en-US/dashboard/products/{productId}/submissions/{submissionId}/availability
https://partner.microsoft.com/en-US/dashboard/products/{productId}/submissions/{submissionId}/properties
https://partner.microsoft.com/en-US/dashboard/products/{productId}/submissions/{submissionId}/ageratings
https://partner.microsoft.com/en-US/dashboard/products/{productId}/submissions/{submissionId}/packages
https://partner.microsoft.com/en-US/dashboard/products/{productId}/submissions/{submissionId}/managelanguages?producttype=app
https://partner.microsoft.com/en-US/dashboard/products/{productId}/submissions/{submissionId}/options

額外測試資訊（產品層級，不屬於任何提交）
https://partner.microsoft.com/en-US/dashboard/products/{productId}/suppinfo/additionaltestinginfo
```

從概觀頁面的錨點找出目前的 `submissionId`，
而非憑猜測。

## 產品概觀

觀察到的卡片錨點使用類似以下的可存取標籤：

```text
定價與可取得性 狀態：- 完成
屬性 狀態：- 完成
年齡分級 狀態：- 完成
套件 狀態：- 完成
Store 商品列表 狀態：- 完成
提交選項
```

使用 `anchors` 取得它們目前的 `href` 值。

最終的控制項通常可以發現為：

```javascript
page.getByRole("button", {
  name: "Submit for certification",
  exact: true
})
```

在請求核准之前，以及在核准之後，
都要立即讀取 `disabled`。

提交成功後，概觀文字會變為：

```text
認證中
認證狀態
提交
前處理
認證
發布
```

這四個步驟各是一個 `he-subway-stop` 元素。目前的步驟
帶有 `current` 屬性。以下程式碼列出各步驟並標示目前的步驟：

```javascript
[...document.querySelectorAll("he-subway-stop")].map(
  (stop) =>
    stop.innerText.trim() + (stop.hasAttribute("current") ? " (current)" : ""),
);
```

提交之後，區段卡片的標籤可能從 `Complete` 變為
`Read only`。套件檔案名稱與 `Validated` 文字可能不再
顯示於概觀。這是已提交版本被鎖定期間的預期行為。
當產品已處於 `In certification` 狀態後，不要把
`Validated` 的消失解讀為套件出現問題。

提交後可能立即出現選用的回饋對話框。
在未取得單獨核准之前，不要選擇評分或按下其 **Submit** 按鈕。

產品認證期間，概觀也會提供 **Cancel
certification** 按鈕。除非針對該確切操作取得核准，否則絕不點擊。

## 協議

觀察到目前的協議列位於：

```html
<accexp_he-data-grid>
```

觀察到接受控制項為：

```html
<accexp_he-button
  appearance="link"
  testid="agreement-accept-now-button"
  type="button">
  接受
</accexp_he-button>
```

有用的定位器：

```javascript
page.getByText("Accept", { exact: true })
```

可能存在多個 `Accept` 控制項，包含來自不同
方案的協議。請檢視資料表的順序與列的上下文。
如果存在多個匹配，不要只憑文字點擊。

接受之後，該列可能不會出現確認
對話框就直接更新。請驗證：

- 目標列的 `Not Accepted` 已消失。
- 協議版本仍可見。
- 顯示接受日期。

## 年齡分級

一旦問卷草稿存在，`ageratings` 路由就會重定向到
`ageratings/summary`。該頁面顯示分級預覽與一個
`he-checkbox`，勾選它即表示同意 IARC 使用條款，並聲明
使用者已達法定成年年齡。勾選即接受有約束力的協議，請先取得核准。

觀察到該核取方塊的行為：

- 它的真正輸入項在 shadow DOM 中，標籤為空。`getByLabel` 會
  逾時，點擊內部輸入項也無法勾選。
- 它的標籤包含指向 IARC 條款的連結，因此點擊標籤
  文字可能會開啟連結，而非勾選方塊。
- 點擊 `he-checkbox` 宿主元素左側邊緣 8 像素處，
  且距頂部不超過 12 像素（方塊繪製的位置），即可勾選它。

儲存是一個 `he-button`，在方塊被勾選前保持停用。
儲存成功後，標題會從 `Age ratings preview` 變為
`Age ratings`，而 `Current Rating ID` 在認證完成前顯示 `Pending`。

## 定價

在儲存基本價格之前，定價與可取得性頁面會警告：

```text
未為可購買產品建立 PriceSchedule。您必須為此產品設定價格。
```

基本價格使用兩個 `he-select` 元素：

- `he-select[label="Currency"]` 列出市場及其貨幣，例如
  `USD - United States`（值為 `US`）。大約 240 個選項
  只會在清單開啟之後才會載入。
- `he-select[label="Retail price"]` 在選擇貨幣之前保持停用，
  之後會列出價格等級：`0`、`0.99` 等。沒有 `Free`
  選項。等級 `0` 代表產品免費。

每個 `he-select` 都在 shadow DOM 中保留一個
`input[role="combobox"]`，因此控制器的 `comboboxes` 命令
會列出它們。索引依賴頁面，所以在使用索引之前
先重新列出。要選擇選項時，只在目標 `he-select` 內搜尋，例如：

```javascript
page
  .locator('he-select[label="Retail price"]')
  .getByRole("option", { name: "0", exact: true });
```

儲存是 `input[type="submit"][value="Save draft"]`。儲存成功
會重定向到產品概觀。重新開啟頁面以驗證
價格與市場。變更定價需要針對該變更取得核准。

## 儲存區段

- 屬性、套件與提交選項：`click-role button Save`
  會儲存並重定向到產品概觀。
- 定價與可取得性：**Save draft**，如上所述。
- 額外測試資訊：認證備註欄位是
  `textarea#certificationNotesDescription`（6000 字元上限）。
  其儲存控制項是連結 `<a aria-label="Save description">`，
  因此 `click-role button Save` 找不到它。改用
  `click-text-ancestor "Save description"`。

每次儲存後，重新開啟該區段並驗證值是否已持久化。

## 輸入項與 Web 元件

Partner Center 混用了標準輸入項與自訂元素，例如：

```text
he-button
he-checkbox
he-select
he-subway-stop
accexp_he-button
accexp_he-data-grid
```

Playwright 的 role、label 與精確文字定位器在這些
元件上通常有效。如果無效，請檢視：

- `tagName`
- `role`
- `aria-label`
- `aria-labelledby`
- `href`
- `disabled`
- `testid`
- 祖先文字
- `outerHTML`

避免使用不穩妥的自動生成 CSS 類別名稱。

觀察到的輸入項怪癖：

- `he-checkbox` 將真正的輸入項放在 shadow DOM 中，
  標籤為空，因此 `getByLabel` 與控制器的 `check-label`
  和 `uncheck-label` 會逾時。使用精確標籤文字的 `click-text`
  可以切換大多數核取方塊。年齡分級條款方塊是例外，見「年齡分級」一節。
- 單選標籤內部的 `span` 會攔截指標事件，因此
  Playwright 的 `check()` 可能失敗。點擊標籤即可。
- 精確文字匹配必須包含彎引號撇號（U+2019），
  即 Partner Center 使用它們的位置。

## 檔案上傳

套件與螢幕擷取畫面的上傳使用隱藏的：

```css
input[type="file"]
```

觀察到的螢幕擷取畫面行為：

1. 上傳螢幕擷取畫面會建立另一個隱藏的檔案輸入項。
2. 重複使用輸入項索引 `0` 可能會取代第一張螢幕擷取畫面。
3. 每張額外的螢幕擷取畫面都使用下一個檔案輸入項索引上傳。
4. 每次上傳後，等待處理完成並重新計算輸入項數量。
5. 儲存之前，確認每張目標螢幕擷取畫面都可見。

使用真實的應用程式螢幕擷取畫面。必要時在 Partner Center 之外調整大小。

## 載入與過期狀態

Partner Center 可能暫時顯示：

- 未顯示 `Complete` 的區段標籤。
- 未顯示套件檔案名稱的套件卡片。
- 接受協議後停用的提交按鈕。
- 重新載入後只有導覽外框。

不要立即編輯。等待、重新載入並重新讀取頁面。
有效的模式是：

1. 直接導覽到產品概觀。
2. 等待 8 到 15 秒。
3. 讀取主體文字。
4. 如果缺少區段狀態，重新載入一次。
5. 再等待並驗證。

## 身份驗證重定向

Partner Center 可能在 session 過期時，
將已驗證的產品的頁面重定向到 Microsoft 的帳戶
選擇器。在讀取產品或協議狀態之前，確認目前 URL 仍屬於 `partner.microsoft.com`。

如果使用者先前指定了要使用的精確帳戶，
只選擇該帳戶。絕不要輸入或取得憑證。
如果 Microsoft 要求密碼、通行密钥 (passkey)、MFA、CAPTCHA 或
作業系統身份驗證，請停下交由使用者操作。
登入後，直接導覽回目標產品或協議 URL，並重新讀取頁面。

## 多個分頁

多個 Partner Center 分頁可能導致自動化指向錯誤的頁面。
隨附的控制器：

- 使用 `pages` 列出所有頁面。
- 優先選擇最近開啟的 Partner Center 頁面。
- 接受 `PARTNER_CENTER_PAGE_INDEX` 以選擇精確的頁面。

在每個會變更狀態的命令之前，檢查 `status`。

## 安全的檢視命令

```powershell
node .\partner-center-control.mjs status
node .\partner-center-control.mjs pages
node .\partner-center-control.mjs text
node .\partner-center-control.mjs anchors
node .\partner-center-control.mjs inputs
node .\partner-center-control.mjs radios
node .\partner-center-control.mjs comboboxes
node .\partner-center-control.mjs find-text "Accept"
node .\partner-center-control.mjs match-context "Accept"
node .\partner-center-control.mjs button-state "Submit for certification"
```

`combo-options <index>` 在控制器的說明中被列為唯讀，
但它會點擊下拉組合框以開啟清單。它不會選擇選項
或儲存，但會變更頁面。先執行 `comboboxes` 確認索引，
如果開啟的清單造成干擾，之後執行 `reload`。

## 會變更狀態的命令

控制器會拒絕這些命令，除非
`PARTNER_CENTER_ALLOW_WRITE=1`：

- `click-role`
- `click-text`
- `click-text-index`
- `click-text-ancestor`
- `fill-label`
- `fill-selector`
- `check-label`
- `uncheck-label`
- `check-name`（輸入產品名稱並點擊 **Check availability**）
- `select-combo`
- `add-combo-token`
- `upload-file`
- `upload-file-index`

環境變數是技術上的保護機制，不是使用者核准。
必要時先取得核准，為單一操作設定它，執行
該操作，然後清除它。
