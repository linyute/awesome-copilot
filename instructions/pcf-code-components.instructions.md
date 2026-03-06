---
description: '了解程式碼元件的結構與實作'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 程式碼元件

程式碼元件是一種解決方案元件，可以包含在解決方案檔案中並匯入到不同的環境。它們可以新增到模型導向應用程式和畫布應用程式中。

## 三個核心元素

程式碼元件由三個元素組成：

1. **資訊清單**
2. **元件實作**
3. **資源**

> **注意**：使用 Power Apps Component Framework 的程式碼元件定義和實作對於模型導向應用程式和畫布應用程式是相同的。唯一的區別是設定部分。

## 資訊清單

資訊清單是 `ControlManifest.Input.xml` 中繼資料檔案，它定義了元件。它是一個 XML 文件，描述了：

- 元件的名稱
- 可以設定的資料類型，可以是 `field` 或 `dataset`
- 在新增元件時可以在應用程式中設定的任何屬性
- 元件所需的資源檔案列表

### 資訊清單目的

當使用者設定程式碼元件時，資訊清單檔案中的資料會篩選可用的元件，以便只有在該情境下有效的元件才可供設定。資訊清單檔案中定義的屬性會呈現為設定欄位，以便使用者可以指定值。這些屬性值隨後在執行時可供元件使用。

更多資訊：[資訊清單結構描述參考](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/)

## 元件實作

程式碼元件使用 TypeScript 實作。每個程式碼元件必須包含一個實作程式碼元件介面中描述的方法的物件。[Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction) 使用 `pac pcf init` 命令自動產生一個帶有存根實作的 `index.ts` 檔案。

### 必要方法

元件物件實作這些生命週期方法：

- **init** (必需) - 頁面載入時呼叫
- **updateView** (必需) - 應用程式資料變更時呼叫
- **getOutputs** (可選) - 使用者變更資料時回傳值
- **destroy** (必需) - 頁面關閉時呼叫

### 元件生命週期

#### 頁面載入

頁面載入時，應用程式使用資訊清單中的資料建立一個物件：

```typescript
var obj = new <"namespace on manifest">.<"constructor on manifest">();
```

範例：
```typescript
var controlObj = new SampleNameSpace.LinearInputComponent();
```

然後頁面會初始化元件：

```typescript
controlObj.init(context, notifyOutputChanged, state, container);
```

**初始化參數：**

| 參數 | 描述 |
|-----------|-------------|
| `context` | 包含有關元件如何設定以及所有參數的所有資訊。透過 `context.parameters.<property name from manifest>` 存取輸入屬性。包括 Power Apps Component Framework API。 |
| `notifyOutputChanged` | 每當元件有新的輸出準備好非同步檢索時，提醒框架。 |
| `state` | 如果使用 `setControlState` 方法明確儲存，則包含來自先前頁面載入的元件資料。 |
| `container` | 開發人員可以將 HTML 元素附加到 UI 的 HTML div 元素。 |

#### 使用者變更資料

當使用者與您的元件互動以變更資料時，呼叫 `init` 方法中傳遞的 `notifyOutputChanged` 方法。平台透過呼叫 `getOutputs` 方法回應，該方法回傳使用者所做變更的值。對於 `field` 元件，這通常是新值。

#### 應用程式變更資料

如果平台變更資料，它會呼叫元件的 `updateView` 方法，並將新的上下文物件作為參數傳遞。應實作此方法以更新元件中顯示的值。

#### 頁面關閉

當使用者導航離開頁面時，程式碼元件失去範圍，為物件分配的所有記憶體都會被清除。然而，某些方法 (例如事件處理常式) 可能會保留並根據瀏覽器實作消耗記憶體。

**最佳實務：**
- 實作 `setControlState` 方法以在同一會話中儲存資訊以供下次使用
- 實作 `destroy` 方法以在頁面關閉時移除清理程式碼，例如事件處理常式

## 資源

資訊清單檔案中的資源節點指的是元件實作其視覺化所需的資源。每個程式碼元件必須有一個資源檔案來建構其視覺化。工具產生的 `index.ts` 檔案是一個 `code` 資源。必須至少有 1 個程式碼資源。

### 額外資源

您可以在資訊清單中定義額外資源檔案：

- CSS 檔案
- 圖片網頁資源
- 用於當地語系化的 Resx 網頁資源

更多資訊：[資源元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resources)

## 相關資源

- [建立和建構程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/create-custom-controls-using-pcf)
- [了解如何使用解決方案封裝和分發擴充功能](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm)
