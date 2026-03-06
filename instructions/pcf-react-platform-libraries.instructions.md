---
description: '適用於 PCF 元件的 React 控制項和平台函式庫'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# React 控制項與平台函式庫

當您使用 React 和平台函式庫時，您使用的是 Power Apps 平台所使用的相同基礎結構。這表示您不再需要為每個控制項個別封裝 React 和 Fluent 函式庫。所有控制項都共用一個共同的函式庫實例和版本，以提供無縫且一致的體驗。

## 優點

透過重複使用現有的平台 React 和 Fluent 函式庫，您可以預期：

- **減少控制項套件大小**
- **最佳化的解決方案套件**
- **更快的執行時間傳輸、腳本編寫和控制項呈現**
- **與 Power Apps Fluent 設計系統的設計和主題對齊**

> **注意**：隨著 GA 版本發布，所有現有的虛擬控制項將繼續運作。但是，應使用最新的 CLI 版本 (>=1.37) 重建和部署它們，以利於未來平台 React 版本升級。

## 必要條件

與任何元件一樣，您必須安裝 [Visual Studio Code](https://code.visualstudio.com/Download) 和 [Microsoft Power Platform CLI](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/powerapps-cli#install-microsoft-power-platform-cli)。

> **注意**：如果您已安裝適用於 Windows 的 Power Platform CLI，請務必使用 `pac install latest` 命令執行最新版本。Visual Studio Code 的 Power Platform 工具應自動更新。

## 建立 React 元件

> **注意**：這些說明假設您之前已建立程式碼元件。如果您沒有，請參閱 [建立您的第一個元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)。

`pac pcf init` 命令有一個新的 `--framework` (`-fw`) 參數。將此參數的值設定為 `react`。

### 命令參數

| 參數 | 值 |
|-----------|-------|
| --name | ReactSample |
| --namespace | SampleNamespace |
| --template | field |
| --framework | react |
| --run-npm-install | true (預設) |

### PowerShell 命令

以下 PowerShell 命令使用參數捷徑，建立 React 元件專案並執行 `npm-install`：

```powershell
pac pcf init -n ReactSample -ns SampleNamespace -t field -fw react -npm
```

您現在可以使用 `npm start` 像往常一樣在測試工具中建置和檢視控制項。

建置控制項後，您可以將其封裝在解決方案中，並將其用於模型導向應用程式 (包括自訂頁面) 和畫布應用程式，就像標準程式碼元件一樣。

## 與標準元件的差異

### ControlManifest.Input.xml

[控制元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/control) `control-type` 屬性設定為 `virtual` 而不是 `standard`。

> **注意**：更改此值不會將元件從一種類型轉換為另一種類型。

在 [資源元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resources) 中，找到兩個新的 [平台函式庫元素](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/platform-library) 子元素：

```xml
<resources>
  <code path="index.ts" order="1" />
  <platform-library name="React" version="16.14.0" />
  <platform-library name="Fluent" version="9.46.2" />
</resources>
```

> **注意**：有關有效平台函式庫版本的更多資訊，請參閱支援的平台函式庫清單。

**建議**：我們建議將平台函式庫用於 Fluent 8 和 9。如果您不使用 Fluent，則應移除 `platform-library` 元素，其中 `name` 屬性值為 `Fluent`。

### Index.ts

用於控制項初始化的 [ReactControl.init](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/init) 方法沒有 `div` 參數，因為 React 控制項不直接呈現 DOM。相反，[ReactControl.updateView](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/updateview) 返回一個 ReactElement，其中包含 React 格式的實際控制項詳細資訊。

### bundle.js

React 和 Fluent 函式庫未包含在套件中，因為它們是共用的，因此 bundle.js 的大小更小。

## 範例控制項

以下控制項包含在範例中。它們的功能與標準版本相同，但由於它們是虛擬控制項，因此提供更好的效能。

| 範例 | 描述 | 連結 |
|--------|-------------|------|
| ChoicesPickerReact | 轉換為 React 控制項的標準 ChoicesPickerControl | ChoicesPickerReact 範例 |
| FacepileReact | 轉換為 React 控制項的 ReactStandardControl | FacepileReact |

## 支援的平台函式庫清單

平台函式庫在建置和執行時都可供使用平台函式庫功能的控制項使用。目前，平台提供以下版本，並且是目前支援的最高版本。

| 函式庫 | 套件 | 建置版本 | 執行時版本 |
|---------|---------|---------------|-----------------|
| React | react | 16.14.0 | 17.0.2 (模型), 16.14.0 (畫布) |
| Fluent | @fluentui/react | 8.29.0 | 8.29.0 |
| Fluent | @fluentui/react | 8.121.1 | 8.121.1 |
| Fluent | @fluentui/react-components | >=9.4.0 <=9.46.2 | 9.68.0 |

> **注意**：應用程式在執行時可能會載入更高相容版本的平台函式庫，但該版本可能不是可用的最新版本。Fluent 8 和 Fluent 9 都受支援，但不能在同一個資訊清單中同時指定。

## 常見問題

### 問：我可以使用平台函式庫將現有的標準控制項轉換為 React 控制項嗎？

答：否。您必須使用新範本建立一個新控制項，然後更新資訊清單和 index.ts 方法。作為參考，比較上面描述的標準和 react 範例。

### 問：我可以在 Power Pages 中使用 React 控制項和平台函式庫嗎？

答：否。React 控制項和平台函式庫目前僅支援畫布和模型導向應用程式。在 Power Pages 中，React 控制項不會根據其他欄位的變更而更新。

## 相關文件

- [什麼是程式碼元件？](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/custom-controls-overview)
- [畫布應用程式的程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/component-framework-for-canvas-apps)
- [建立和建構程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/create-custom-controls-using-pcf)
- [學習 Power Apps Component Framework](https://learn.microsoft.com/en-us/training/paths/use-power-apps-component-framework)
- [在 Power Pages 中使用程式碼元件](https://learn.microsoft.com/en-us/power-apps/maker/portals/component-framework)
