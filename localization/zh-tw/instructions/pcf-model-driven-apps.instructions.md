---
description: '適用於模型導向應用程式的程式碼元件實作與設定'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 適用於模型導向應用程式的程式碼元件

Power Apps Component Framework 讓開發人員能夠擴展模型導向應用程式中的視覺化效果。專業開發人員可以使用 [Microsoft Power Platform CLI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/get-powerapps-cli) 來建立、偵錯、匯入和新增程式碼元件到模型導向應用程式中。

## 元件使用方式

您可以將程式碼元件新增到：
- 欄位
- 網格
- 子網格

在模型導向應用程式中。

> **重要事項**：Power Apps Component Framework 預設為模型導向應用程式啟用。請參閱 [適用於畫布應用程式的程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/component-framework-for-canvas-apps) 以了解如何為畫布應用程式啟用 Power Apps Component Framework。

## 實作程式碼元件

在開始建立程式碼元件之前，請確保您已安裝使用 Power Apps Component Framework 開發元件所需的所有 [必要條件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/create-custom-controls-using-pcf#prerequisites)。

[建立您的第一個程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript) 一文說明了建立程式碼元件的逐步程序。

## 將程式碼元件新增到模型導向應用程式

若要將程式碼元件新增到模型導向應用程式中的欄位或表格，請參閱 [將程式碼元件新增到模型導向應用程式](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/add-custom-controls-to-a-field-or-entity)。

### 範例

**線性滑桿控制項：**

![新增線性滑桿控制項](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/media/add-slider.png)

**資料集網格元件：**

![資料集網格元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/add-dataset-component.png)

## 更新現有程式碼元件

每當您更新程式碼元件並希望在執行時看到更改時，您都需要在資訊清單檔案中增加版本屬性。

**最佳實務**：建議您每當進行更改時，都應增加元件的版本。

## 另請參閱

- [Power Apps Component Framework 總覽](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/overview)
- [建立您的第一個程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)
- [學習 Power Apps Component Framework](https://learn.microsoft.com/en-us/training/paths/use-power-apps-component-framework)
