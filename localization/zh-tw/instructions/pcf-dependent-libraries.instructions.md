---
description: '在 PCF 元件中使用相依函式庫'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 相依函式庫 (預覽)

[本主題為預發佈文件，可能會有所變更。]

對於模型導向應用程式，您可以重複使用包含在另一個元件中的預建函式庫，該函式庫作為多個元件的相依項載入。

在多個控制項中擁有預建函式庫的副本是不理想的。重複使用現有函式庫可以提高效能，尤其是在函式庫很大時，透過減少所有使用該函式庫的元件的載入時間。函式庫重複使用也有助於減少建置過程中的維護負擔。

## 之前與之後

**之前**：每個 PCF 元件中包含的自訂函式庫檔案
![顯示每個 pcf 元件中包含的自訂函式庫檔案的圖表](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/dependent-library-before-example.png)

**之後**：元件從函式庫控制項呼叫共用函式
![顯示元件從函式庫控制項呼叫共用函式的圖表](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/dependent-library-after-example.png)

## 實作步驟

若要使用相依函式庫，您需要：

1. 建立包含該函式庫的 **函式庫元件**。此元件可以提供某些功能，或者只是一個函式庫的容器。
2. 配置另一個元件以依賴由函式庫元件載入的函式庫。

預設情況下，函式庫在相依元件載入時載入，但您可以將其配置為按需載入。

這樣，您就可以在函式庫控制項中獨立維護該函式庫，並且相依控制項無需將該函式庫捆綁在其中。

## 運作方式

您需要將組態資料新增到您的元件專案中，以便建置過程按照您希望的方式部署您的函式庫。透過新增或編輯以下檔案來設定此組態資料：

- **featureconfig.json**
- **webpack.config.js**
- 編輯資訊清單結構描述以 **註冊相依項**

### featureconfig.json

新增此檔案可覆寫元件的預設功能旗標，而無需修改 `node_modules` 資料夾中產生的檔案。

**功能旗標：**

| 旗標 | 描述 |
|------|-------------|
| `pcfResourceDependency` | 啟用元件使用函式庫資源。 |
| `pcfAllowCustomWebpack` | 啟用元件使用自訂 Web 套件。對於定義函式庫資源的元件，必須啟用此功能。 |

預設情況下，這些值為 `off`。將它們設定為 `on` 可覆寫預設值。

**範例 1：**
```json
{ 
  "pcfAllowCustomWebpack": "on" 
} 
```

**範例 2：**
```json
{ 
   "pcfResourceDependency": "on",
   "pcfAllowCustomWebpack": "off" 
} 
```

### webpack.config.js

元件的建置過程使用 [Webpack](https://webpack.js.org/) 將程式碼和相依項捆綁成一個可部署的資產。若要將您的函式庫從此捆綁中排除，請在專案根資料夾中新增一個 `webpack.config.js` 檔案，該檔案將函式庫的別名指定為 `externals`。[深入了解 Webpack 外部配置選項](https://webpack.js.org/configuration/externals/)

當函式庫別名為 `myLib` 時，此檔案可能如下所示：

```javascript
/* eslint-disable */ 
"use strict"; 

module.exports = { 
  externals: { 
    "myLib": "myLib" 
  }, 
}  
```

### 註冊相依項

在資訊清單結構描述的 [資源](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resources) 中使用 [相依性元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/dependency)。

```xml
<resources>
  <dependency
    type="control"
    name="samples_SampleNS.SampleStubLibraryPCF"
    order="1"
  />
  <code path="index.ts" order="2" />
</resources>
```

### 作為元件按需載入的相依項

您可以按需載入相依函式庫，而不是在元件載入時載入它。按需載入為更複雜的控制項提供了靈活性，使其僅在需要時才載入相依項，尤其是在相依函式庫很大時。

![顯示從函式庫使用函式的圖表，其中函式庫是按需載入的](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/dependent-library-on-demand-load.png)

若要啟用按需載入，您需要：

**步驟 1**：將這些 [平台動作元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/platform-action)、[功能使用元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/feature-usage) 和 [使用功能元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/uses-feature) 子元素新增到 [控制項元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/control)：

```xml
<platform-action action-type="afterPageLoad" />
<feature-usage>
   <uses-feature name="Utility"
      required="true" />
</feature-usage>
```

**步驟 2**：將 [相依性元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/dependency) 的 `load-type` 屬性設定為 `onDemand`。

```xml
<dependency type="control"
      name="samples_SampleNamespace.StubLibrary"
      load-type="onDemand" />
```

## 後續步驟

試試一個引導您建立相依函式庫的教學課程：

[教學課程：在元件中使用相依函式庫](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/tutorial-use-dependent-libraries)
