---
description: '畫布應用程式的程式碼元件實作、安全性與設定'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 畫布應用程式的程式碼元件

專業開發人員可以使用 Power Apps Component Framework 來建立可在其畫布應用程式中使用的程式碼元件。應用程式製造者可以使用 Power Apps Component Framework 透過 [Microsoft Power Platform CLI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/get-powerapps-cli) 建立、匯入和新增程式碼元件到畫布應用程式中。

> **注意**：某些 API 可能在畫布應用程式中不可用。我們建議您檢查每個 API 以確定其可用性。

## 安全性考量

> **警告**：程式碼元件包含可能不是由 Microsoft 產生且在 Power Apps Studio 中呈現時可能存取安全性權杖和資料的程式碼。將程式碼元件新增到畫布應用程式時，請確保程式碼元件解決方案來自受信任的來源。當播放畫布應用程式時，不存在此漏洞。

### Power Apps Studio 中的安全性警告

當您在 Power Apps Studio 中開啟包含程式碼元件的畫布應用程式時，會出現有關潛在不安全程式碼的警告訊息。Power Apps Studio 環境中的程式碼元件可以存取安全性權杖；因此，只能開啟來自受信任來源的元件。

**最佳實務：**
- 管理員和系統自訂員應在將所有程式碼元件匯入環境之前對其進行審查和驗證
- 僅在驗證後才向製造者提供元件
- 當您使用非受控解決方案匯入程式碼元件或使用 `pac pcf push` 安裝您的程式碼元件時，會顯示 `Default` 發佈者

![安全性警告](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/canvas-app-safety-warning.png)

## 必要條件

- 需要 Power Apps 授權。更多資訊：[Power Apps Component Framework 授權](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview#licensing)
- 需要系統管理員權限才能在環境中啟用 Power Apps Component Framework 功能

## 啟用 Power Apps Component Framework 功能

若要將程式碼元件新增到應用程式，您需要在您要使用它們的每個環境中啟用 Power Apps Component Framework 功能。預設情況下，Power Apps 元件功能已為模型導向應用程式啟用。

### 為畫布應用程式啟用步驟：

1. 登入 [Power Apps](https://powerapps.microsoft.com/)
2. 選取 **設定** ![設定](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/settings.png)，然後選取 **管理中心**

   ![設定和管理中心](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/select-admin-center-from-settings.png)

3. 在左側窗格中，選取 **環境**，選取您要啟用此功能的環境，然後選取 **設定**
4. 展開 **產品**，然後選取 **功能**
5. 從可用功能列表中，開啟 **Power Apps 畫布應用程式的元件框架**，然後選取 **儲存**

   ![啟用 Power Apps Component Framework](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/enable-pcf-feature.png)

## 實作程式碼元件

在您的環境中啟用 Power Apps Component Framework 功能後，您可以開始實作程式碼元件的邏輯。有關逐步教學課程，請參閱 [建立您的第一個程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)。

**建議**：在開始實作之前，請檢查畫布應用程式中程式碼元件的 [限制](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/limitations)。

## 將元件新增到畫布應用程式

1. 進入 Power Apps Studio
2. 建立新的畫布應用程式，或編輯您要新增程式碼元件的現有應用程式

   > **重要事項**：請確保包含程式碼元件的解決方案 .zip 檔案已在您繼續下一步之前 [匯入](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/import-update-export-solutions) 到 Microsoft Dataverse 中。

3. 在左側窗格中，選取 **新增 (+)**，然後選取 **取得更多元件**

   ![插入元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/insert-code-components-using-get-more-components.png)

4. 選取 **程式碼** 索引標籤，從列表中選取一個元件，然後選取 **匯入**

   ![匯入元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/insert-component-add-sample-component.png)

5. 在左側窗格中，選取 **+**，展開 **程式碼元件**，然後選取該元件以將其新增到應用程式中

   ![新增元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/add-sample-component-from-list.png)

> **注意**：您也可以透過選取 **插入 > 自訂 > 匯入元件** 來新增元件。此選項將在未來版本中移除，因此我們建議使用上述流程。

### 元件屬性

在屬性索引標籤中，您會注意到程式碼元件屬性會顯示出來。

![預設程式碼元件屬性窗格](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/property-pane-with-parameters.png)

> **注意**：現有的程式碼元件可以透過更新程式碼元件的資訊清單版本來重新匯入，如果您希望這些屬性在預設的屬性索引標籤中可用。與以前一樣，這些屬性將繼續在進階屬性索引標籤中可用。

## 從畫布應用程式中刪除程式碼元件

1. 開啟您新增程式碼元件的應用程式
2. 在左側窗格中，選取 **樹狀檢視**，然後選取您新增程式碼元件的螢幕
3. 在元件旁邊，選取 **更多 (...)**，然後選取 **刪除**

   ![刪除程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/delete-code-component.png)

4. 儲存應用程式以查看更改

## 更新現有程式碼元件

每當您更新程式碼元件並希望看到執行時更改時，您需要在資訊清單檔案中更改 `version` 屬性。我們建議您每當進行更改時，都更改元件的版本。

> **注意**：現有的程式碼元件僅在應用程式關閉或在 Power Apps Studio 中重新開啟時才會更新。當您重新開啟應用程式時，它會要求您更新程式碼元件。簡單地刪除或將程式碼元件重新新增到應用程式中不會更新元件。請先發佈更新解決方案中的所有自訂內容，否則程式碼元件的更新將不會出現。

## 另請參閱

- [Power Apps Component Framework 總覽](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview)
- [建立您的第一個程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)
- [學習 Power Apps Component Framework](https://learn.microsoft.com/en-us/training/paths/use-power-apps-component-framework)
