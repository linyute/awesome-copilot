---
description: '開發 PCF 程式碼元件的最佳實務與指南'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj,css,html}'
---

# 程式碼元件的最佳實務與指南

開發、部署和維護程式碼元件需要跨多個領域的知識組合。本文概述了為專業人員開發程式碼元件的既定最佳實務和指南。

## Power Apps Component Framework

### 避免將開發建構部署到 Dataverse

程式碼元件可以建構在 [生產模式或開發模式](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-alm#building-pcfproj-code-component-projects) 中。避免將開發建構部署到 Dataverse，因為它們會對效能產生不利影響，甚至可能因其大小而無法部署。即使您計畫稍後部署發佈建構，如果沒有自動化發佈管線，也很容易忘記重新部署。更多資訊：[偵錯自訂控制項](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls)。

### 避免使用不支援的框架方法

這些包括使用 `ComponentFramework.Context` 上存在的未記錄內部方法。這些方法可能有效，但由於不支援，它們在未來版本中可能會停止運作。不支援使用存取主機應用程式 HTML 文件物件模型 (DOM) 的控制項腳本。主機應用程式 DOM 中超出程式碼元件邊界的任何部分都可能在不通知的情況下更改。

### 使用 `init` 方法請求網路所需資源

當託管上下文載入程式碼元件時，首先會呼叫 `init` 方法。使用此方法請求任何網路資源 (例如中繼資料)，而不是等待 `updateView` 方法。如果在請求返回之前呼叫 `updateView` 方法，則您的程式碼元件必須處理此狀態並提供視覺化載入指示器。

### 清理 `destroy` 方法中的資源

當從瀏覽器 DOM 中移除程式碼元件時，託管上下文會呼叫 `destroy` 方法。使用 `destroy` 方法關閉任何 `WebSockets` 並移除在容器元素外部新增的事件處理常式。如果您使用 React，請在 `destroy` 方法中使用 `ReactDOM.unmountComponentAtNode`。以這種方式清理資源可防止程式碼元件在給定瀏覽器會話中載入和卸載所引起的任何效能問題。

### 避免不必要地呼叫資料集屬性的重新整理

如果您的程式碼元件是資料集類型，則綁定的資料集屬性會公開一個 `refresh` 方法，該方法會導致託管上下文重新載入資料。不必要地呼叫此方法會影響您的程式碼元件的效能。

### 最大程度地減少對 `notifyOutputChanged` 的呼叫

在某些情況下，UI 控制項的更新 (例如按鍵或滑鼠移動事件) 不希望每次都呼叫 `notifyOutputChanged`，因為更多的呼叫會導致更多的事件傳播到父上下文。相反，請考慮在控制項失去焦點或使用者的觸控或滑鼠事件完成時使用事件。

### 檢查 API 可用性

為不同主機 (模型導向應用程式、畫布應用程式、入口網站) 開發程式碼元件時，請務必檢查您正在使用的 API 在這些平台上是否可用。例如，`context.webAPI` 在畫布應用程式中不可用。有關個別 API 的可用性，請參閱 [Power Apps Component Framework API 參考](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/)。

### 管理傳遞給 `updateView` 的暫時空屬性值

當資料未就緒時，會將空值傳遞給 `updateView` 方法。您的元件應考慮這種情況，並預期資料可能為空，並且後續的 `updateView` 循環可以包含更新的值。`updateView` 對於 [標準](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/control/updateview) 和 [React](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/updateview) 元件都可用。

## 模型導向應用程式

### 不要直接與 `formContext` 互動

如果您有使用用戶端 API 的經驗，您可能習慣於與 `formContext` 互動以存取屬性、控制項和呼叫 API 方法 (例如 `save`、`refresh` 和 `setNotification`)。程式碼元件預計可在模型導向應用程式、畫布應用程式和儀表板等各種產品中運作，因此它們不能依賴 `formContext`。

一個解決方法是將程式碼元件綁定到欄位，並將 `OnChange` 事件處理常式新增到該欄位。程式碼元件可以更新欄位值，並且 `OnChange` 事件處理常式可以存取 `formContext`。未來將新增對自訂事件的支援，這將使在不新增欄位設定的情況下進行控制項外部的變更。

### 限制對 `WebApi` 的呼叫次數和資料大小

使用 `context.WebApi` 方法時，請限制呼叫次數和資料量。每次呼叫 `WebApi` 時，它都會計入使用者的 API 權利和服務保護限制。執行記錄的 CRUD 操作時，請考慮酬載的大小。一般而言，請求酬載越大，您的程式碼元件速度越慢。

## 畫布應用程式

### 最小化螢幕上的元件數量

每次將元件新增到畫布應用程式時，渲染都需要有限的時間。每個新增的元件都會增加渲染時間。在使用開發人員效能工具將更多元件新增到螢幕時，請仔細測量程式碼元件的效能。

目前，每個程式碼元件都捆綁自己的共享函式庫，例如 Fluent UI 和 React。載入同一函式庫的多個實例不會多次載入這些函式庫。然而，載入多個不同的程式碼元件會導致瀏覽器載入這些函式庫的多個捆綁版本。將來，這些函式庫將能夠載入並與程式碼元件共享。

### 允許製造者樣式化您的程式碼元件

當應用程式製造者從畫布應用程式內部使用程式碼元件時，他們希望使用與應用程式其餘部分匹配的樣式。使用輸入屬性為主題元素 (例如顏色和大小) 提供自訂選項。使用 Microsoft Fluent UI 時，將這些屬性對應到函式庫提供的主題元素。未來，將新增對程式碼元件的主題支援，以使此過程更容易。

### 遵循畫布應用程式效能最佳實務

畫布應用程式從應用程式內部和解決方案檢查器提供廣泛的最佳實務。在新增程式碼元件之前，請確保您的應用程式遵循這些建議。更多資訊請參閱：

- [改善畫布應用程式效能的秘訣](https://learn.microsoft.com/en-us/powerapps/maker/canvas-apps/performance-tips)
- [Power Apps 中最佳化效能的考量](https://powerapps.microsoft.com/blog/considerations-for-optimized-performance-in-power-apps/)

## TypeScript 和 JavaScript

### ES5 與 ES6

預設情況下，程式碼元件的目標是 ES5 以支援較舊的瀏覽器。如果您不想支援這些較舊的瀏覽器，可以在 `pcfproj` 資料夾的 `tsconfig.json` 中將目標更改為 ES6。更多資訊：[ES5 與 ES6](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls#es5-vs-es6)。

### 模組匯入

始終捆綁作為程式碼元件一部分所需的模組，而不是使用需要使用 `SCRIPT` 標籤載入的腳本。例如，如果您想使用非 Microsoft 圖表 API，其中範例顯示將 `<script type="text/javascript" src="somechartlibrary.js></script>` 新增到頁面，這在程式碼元件中是不支援的。捆綁所有必需的模組可將程式碼元件與其他函式庫隔離，並支援在離線模式下執行。

> **注意**：目前不支援使用元件資訊清單中的函式庫節點在元件之間共享函式庫。

### Linting

Linting 是指工具掃描程式碼是否存在潛在問題。`pac pcf init` 使用的範本會將 `eslint` 模組安裝到您的專案並透過新增 `.eslintrc.json` 檔案進行設定。

若要設定，請在命令列使用：

```bash
npx eslint --init
```

然後在提示時回答以下問題：

- **您希望如何使用 ESLint？** 回答：檢查語法、查找問題並強制執行程式碼樣式
- **您的專案使用哪種類型的模組？** 回答：JavaScript 模組 (import/export)
- **您的專案使用哪個框架？** 回答：React
- **您的程式碼在哪裡執行？** 回答：瀏覽器
- **您希望如何定義專案的樣式？** 回答：回答有關您的樣式的問題
- **您希望您的設定檔採用什麼格式？** 回答：JSON
- **您使用什麼樣的縮排樣式？** 回答：空格
- **您對字串使用什麼引號？** 回答：單引號
- **您使用什麼行尾符號？** 回答：Windows
- **您是否需要分號？** 回答：是

在使用 `eslint` 之前，您需要將一些腳本新增到 `package.json`：

```json
"scripts": {
   ...
   "lint": "eslint MY_CONTROL_NAME --ext .ts,.tsx",
   "lint:fix": "npm run lint -- --fix"
}
```

現在在命令列中，您可以使用：

```bash
npm run lint:fix
```

此外，您可以透過新增到 `.eslintrc.json` 來新增要忽略的檔案：

```json
"ignorePatterns": ["**/generated/*.ts"]
```

## HTML 瀏覽器使用者介面開發

### 使用 Microsoft Fluent UI React

[Fluent UI React](https://developer.microsoft.com/fluentui#/get-started/web) 是官方的 [開源](https://github.com/microsoft/fluentui) React 前端框架，旨在建立可無縫融入各種 Microsoft 產品的體驗。Power Apps 本身使用 Fluent UI，這表示您可以建立與應用程式其餘部分一致的使用者介面。

#### 使用 Fluent 中的基於路徑的匯入來減少套件大小

目前，`pac pcf init` 使用的程式碼元件範本不會使用 tree-shaking，這是 `webpack` 檢測匯入但未使用的模組並將其刪除的過程。如果您使用以下命令從 Fluent UI 匯入，它會匯入並捆綁整個函式庫：

```typescript
import { Button } from '@fluentui/react'
```

為了避免匯入和捆綁整個函式庫，您可以使用基於路徑的匯入，其中使用顯式路徑匯入特定的函式庫元件：

```typescript
import { Button } from '@fluentui/react/lib/Button';
```

使用特定路徑可以減少您在開發和發佈建構中的套件大小。

#### 優化 React 渲染

使用 React 時，請遵循 React 特定的最佳實務，以最大程度地減少元件的渲染：

- 僅在綁定屬性或框架方面更改需要 UI 反映更改時，才在 `updateView` 方法中呼叫 `ReactDOM.render`。您可以使用 `updatedProperties` 來確定哪些已更改。
- 盡可能使用 `PureComponent` (帶有類別元件) 或 `React.memo` (帶有函式元件) 以避免不必要的重新渲染。
- 對於大型 React 元件，將您的 UI 解構為更小的元件以提高效能。
- 避免在渲染函式中使用箭頭函式和函式綁定，因為這些實務會在每次渲染時建立一個新的回呼閉包。

### 檢查輔助功能

確保程式碼元件可供存取，以便僅使用鍵盤和螢幕閱讀器使用者可以使用它們：

- 提供鍵盤導航替代方案以替代滑鼠/觸控事件
- 確保設定 `alt` 和 [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) (Accessible Rich Internet Applications) 屬性，以便螢幕閱讀器宣布程式碼元件介面的準確表示
- 現代瀏覽器開發人員工具提供有用的方法來檢查輔助功能

更多資訊：[在 Power Apps 中建立可存取的畫布應用程式](https://learn.microsoft.com/en-us/powerapps/maker/canvas-apps/accessible-apps)。

### 始終使用非同步網路呼叫

進行網路呼叫時，切勿使用同步阻塞請求，因為這會導致應用程式停止回應並導致效能緩慢。更多資訊：[非同步互動 HTTP 和 HTTPS 資源](https://learn.microsoft.com/en-us/power-apps/developer/model-driven-apps/best-practices/business-logic/interact-http-https-resources-asynchronously)。

### 為多個瀏覽器撰寫程式碼

模型導向應用程式、畫布應用程式和入口網站都支援多個瀏覽器。請務必僅使用所有現代瀏覽器都支援的技術，並針對您的目標受眾使用代表性的瀏覽器集進行測試。

- [限制和設定](https://learn.microsoft.com/en-us/powerapps/maker/canvas-apps/limits-and-config)
- [支援的網頁瀏覽器](https://learn.microsoft.com/en-us/power-platform/admin/supported-web-browsers-and-mobile-devices)
- [Office 使用的瀏覽器](https://learn.microsoft.com/en-us/office/dev/add-ins/concepts/browsers-used-by-office-web-add-ins)

### 程式碼元件應計畫支援多個用戶端和螢幕格式

程式碼元件可以在多個用戶端 (模型導向應用程式、畫布應用程式、入口網站) 和螢幕格式 (行動裝置、平板電腦、網頁) 中呈現。

- 使用 `trackContainerResize` 允許程式碼元件回應可用寬度和高度的變化
- `allocatedHeight` 和 `allocatedWidth` 可以與 `getFormFactor` 結合使用，以確定程式碼元件是在行動裝置、平板電腦還是網頁用戶端上執行
- 實作 `setFullScreen` 允許使用者擴展以使用可用的整個螢幕，在空間有限的情況下
- 如果程式碼元件無法在給定的容器大小中提供有意義的體驗，則應適當地禁用功能並向使用者提供回饋

### 始終使用作用域 CSS 規則

當您使用 CSS 為程式碼元件實作樣式時，請確保 CSS 使用自動產生應用於元件容器 `DIV` 元素的 CSS 類別來作用域化到您的元件。如果您的 CSS 是全域作用域的，它可能會破壞呈現程式碼元件的表單或螢幕的現有樣式。

例如，如果您的命名空間是 `SampleNamespace`，並且您的程式碼元件名稱是 `LinearInputComponent`，您將使用以下方式新增自訂 CSS 規則：

```css
.SampleNamespace\.LinearInputComponent rule-name
```

### 避免使用 Web 儲存物件

程式碼元件不應使用 HTML Web 儲存物件 (例如 `window.localStorage` 和 `window.sessionStorage`) 來儲存資料。在本機儲存在使用者瀏覽器或行動用戶端上的資料不安全，且不保證可靠可用。

## ALM/Azure DevOps/GitHub

請參閱有關 [程式碼元件應用程式生命週期管理 (ALM)](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-alm) 的文章，了解使用 ALM/Azure DevOps/GitHub 進行程式碼元件的最佳實務。

## 相關文件

- [什麼是程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/custom-controls-overview)
- [畫布應用程式的程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/component-framework-for-canvas-apps)
- [建立和建構程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/create-custom-controls-using-pcf)
- [學習 Power Apps Component Framework](https://learn.microsoft.com/en-us/training/paths/use-power-apps-component-framework)
- [在 Power Pages 中使用程式碼元件](https://learn.microsoft.com/en-us/power-apps/maker/portals/component-framework)
