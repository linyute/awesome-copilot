---
description: '在 Power Pages 網站中使用程式碼元件'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 在 Power Pages 中使用程式碼元件

Power Pages 現在支援使用 Power Apps Component Framework 建立的模型導向應用程式的控制項。若要在 Power Pages 網站網頁中使用程式碼元件：

![使用元件框架建立程式碼元件，然後將程式碼元件新增至模型導向應用程式表單，並在入口網站的基本表單內設定程式碼元件欄位](https://learn.microsoft.com/en-us/power-pages/configure/media/component-framework/steps.png)

完成這些步驟後，使用者可以使用包含相關 [表單](https://learn.microsoft.com/en-us/power-pages/getting-started/add-form) 元件的網頁與程式碼元件互動。

## 必要條件

- 您需要系統管理員權限才能在環境中啟用程式碼元件功能
- 您的 Power Pages 網站版本需要為 [9.3.3.x](https://learn.microsoft.com/en-us/power-apps/maker/portals/versions/version-9.3.3.x) 或更高版本
- 您的入門網站套件需要為 [9.2.2103.x](https://learn.microsoft.com/en-us/power-apps/maker/portals/versions/package-version-9.2.2103) 或更高版本

## 建立與封裝程式碼元件

若要了解如何在 Power Apps Component Framework 中建立與封裝程式碼元件，請參閱 [建立您的第一個元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)。

### 支援的欄位類型與格式

Power Pages 支援受限制的欄位類型與格式以使用程式碼元件。下表列出了所有支援的欄位資料類型與格式：

**支援的類型：**
- 貨幣
- DateAndTime.DateAndTime
- DateAndTime.DateOnly
- 十進位
- 列舉
- 浮點數
- 多重
- 選項集
- SingleLine.Email
- SingleLine.Phone
- SingleLine.Text
- SingleLine.TextArea
- SingleLine.Ticker
- SingleLine.URL
- TwoOptions
- 整數

更多資訊：[屬性清單與描述](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property#remarks)。

### Power Pages 中不支援的程式碼元件

不支援以下程式碼元件 API：
- [Device.captureAudio](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/device/captureaudio)
- [Device.captureImage](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/device/captureimage)
- [Device.captureVideo](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/device/capturevideo)
- [Device.getBarcodeValue](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/device/getbarcodevalue)
- [Device.getCurrentPosition](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/device/getcurrentposition)
- [Device.pickFile](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/device/pickfile)
- [公用程式](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility)

**其他限制：**
- `uses-feature` [元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/uses-feature) 不得設定為 true
- Power Apps Component Framework [不支援的值元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property#value-elements-that-are-not-supported)
- 不支援 Power Apps Component Framework (PCF) 控制項綁定到表單中的多個欄位

## 將程式碼元件新增至模型導向應用程式中的欄位

若要了解如何將程式碼元件新增至模型導向應用程式中的欄位，請參閱 [將程式碼元件新增至欄位](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/add-custom-controls-to-a-field-or-entity#add-a-code-component-to-a-column)。

> **重要事項**：Power Pages 的程式碼元件可透過使用「Web」用戶端選項的網頁瀏覽器使用。

### 使用資料工作區新增

您也可以使用 [資料工作區](https://learn.microsoft.com/en-us/power-pages/configure/data-workspace-forms) 將程式碼元件新增至表單。

1. 在資料工作區表單設計工具中編輯 Dataverse 表單時，選取一個欄位
2. 選擇「+ 元件」並為該欄位選取適當的元件

   ![將元件新增至表單](https://learn.microsoft.com/en-us/power-pages/configure/media/component-framework/add-component-to-form.png)

3. 選取「儲存」並「發佈表單」

## 設定 Power Pages 網站以使用程式碼元件

將程式碼元件新增至模型導向應用程式中的欄位後，您可以設定 Power Pages 以在表單上使用該程式碼元件。

有兩種方法可以啟用程式碼元件：

### 在設計工作室中啟用程式碼元件

若要使用設計工作室在表單上啟用程式碼元件：

1. 將 [表單新增至頁面](https://learn.microsoft.com/en-us/power-pages/getting-started/add-form) 後，選取您新增程式碼元件的欄位並選取「編輯欄位」
2. 選取「啟用自訂元件」欄位

   ![在設計工作室中啟用自訂元件](https://learn.microsoft.com/en-us/power-pages/configure/media/component-framework/enable-code-component.png)

3. 當您預覽網站時，您應該會看到已啟用自訂元件

### 在入口網站管理應用程式中啟用程式碼元件

若要使用入口網站管理應用程式將程式碼元件新增至基本表單：

1. 開啟 [入口網站管理](https://learn.microsoft.com/en-us/power-pages/configure/portal-management-app) 應用程式
2. 在左側窗格中，選取「基本表單」
3. 選取您要新增程式碼元件的表單
4. 選取「相關」
5. 選取「基本表單中繼資料」
6. 選取「新增基本表單中繼資料」
7. 將「類型」選取為「屬性」
8. 選取「屬性邏輯名稱」
9. 輸入「標籤」
10. 對於「控制樣式」，選取「程式碼元件」
11. 儲存並關閉表單

## 使用入口網站 Web API 的程式碼元件

程式碼元件可以建立並新增到網頁，該網頁可以使用 [入口網站 Web API](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview) 執行建立、擷取、更新和刪除動作。此功能允許在開發入口網站解決方案時提供更大的自訂選項。更多資訊：[實作範例入口網站 Web API 元件](https://learn.microsoft.com/en-us/power-pages/configure/implement-webapi-component)。

## 後續步驟

[教學課程：在入口網站中使用程式碼元件](https://learn.microsoft.com/en-us/power-pages/configure/component-framework-tutorial)

## 另請參閱

- [Power Apps Component Framework 總覽](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview)
- [建立您的第一個元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)
- [將程式碼元件新增至模型導向應用程式中的欄位或表格](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/add-custom-controls-to-a-field-or-entity)
