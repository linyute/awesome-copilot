---
description: 'Power Apps Component Framework 的限制與約束'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 限制

透過 Power Apps Component Framework，您可以建立自己的程式碼元件，以改善 Power Apps 和 Power Pages 中的使用者體驗。儘管您可以建立自己的元件，但仍有一些限制會限制開發人員在程式碼元件中實作某些功能。以下是一些限制：

## 1. Dataverse 相依 API 不適用於畫布應用程式

Microsoft Dataverse 相依 API，包括 WebAPI，尚未適用於 Power Apps 畫布應用程式。有關個別 API 的可用性，請參閱 [Power Apps Component Framework API 參考](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/)。

## 2. 捆綁外部函式庫或使用平台函式庫

程式碼元件應使用 [React 控制項和平台函式庫](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/react-controls-platform-libraries) 或將所有程式碼，包括外部函式庫內容，捆綁到主要程式碼包中。

要查看 Power Apps 命令列介面如何協助將外部函式庫內容捆綁到元件專屬套件的範例，請參閱 [Angular flip 元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/sample-controls/angular-flip-control) 範例。

## 3. 不要使用 HTML Web 儲存物件

程式碼元件不應使用 HTML Web 儲存物件，例如 `window.localStorage` 和 `window.sessionStorage`，來儲存資料。在本機儲存在使用者瀏覽器或行動用戶端上的資料不安全，且不保證可靠可用。

## 4. 畫布應用程式不支援自訂驗證

Power Apps 畫布應用程式不支援程式碼元件中的自訂驗證。請改用連接器來取得資料並執行動作。

## 相關主題

- [Power Apps Component Framework API 參考](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/)
- [Power Apps Component Framework 總覽](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview)
