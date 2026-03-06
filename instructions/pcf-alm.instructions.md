---
description: 'PCF 程式碼元件的應用程式生命週期管理 (ALM)'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj,sln}'
---

# 程式碼元件應用程式生命週期管理 (ALM)

ALM 是一個術語，用於描述軟體應用程式的生命週期管理，其中包括開發、維護和治理。更多資訊：[使用 Microsoft Power Platform 的應用程式生命週期管理 (ALM)](https://learn.microsoft.com/en-us/power-platform/alm/overview-alm)。

本文從 Microsoft Dataverse 中程式碼元件的角度，描述了生命週期管理特定方面的考量和策略：

1. 開發和偵錯 ALM 考量
2. 程式碼元件解決方案策略
3. 版本控制和部署更新
4. 畫布應用程式 ALM 考量

## 開發和偵錯 ALM 考量

開發程式碼元件時，您將遵循以下步驟：

1. 使用 `pac pcf init` 從範本建立程式碼元件專案 (`pcfproj`)。更多資訊：[建立和建構程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/create-custom-controls-using-pcf)。
2. 實作程式碼元件邏輯。更多資訊：[元件實作](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/custom-controls-overview#component-implementation)。
3. 使用本機測試工具偵錯程式碼元件。更多資訊：[偵錯程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls)。
4. 建立解決方案專案 (`cdsproj`) 並將程式碼元件專案新增為參考。更多資訊：[封裝程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/import-custom-controls)。
5. 以發佈模式建構程式碼元件，以進行分發和部署。

### 部署到 Dataverse 的兩種方法

當您的程式碼元件準備好在模型導向應用程式、畫布應用程式或入口網站中進行測試時：

1. **`pac pcf push`**：這會將單個程式碼元件部署到由 `--solution-unique-name` 參數指定的解決方案，或者在未指定解決方案時部署到臨時 PowerAppsTools 解決方案。

2. **使用 `pac solution init` 和 `msbuild`**：建構一個 `cdsproj` 解決方案專案，該專案引用了一個或多個程式碼元件。每個程式碼元件都使用 `pac solution add-reference` 添加到 `cdsproj`。一個解決方案專案可以包含對多個程式碼元件的引用，而程式碼元件專案可能只包含一個程式碼元件。

下圖顯示了 `cdsproj` 和 `pcfproj` 專案之間的一對多關係：

![cdsproj 和 pcfproj 專案之間的一對多關係](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/code-component-projects.png)

更多資訊：[封裝程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/import-custom-controls#package-a-code-component)。

## 建構 pcfproj 程式碼元件專案

建構 `pcfproj` 專案時，產生的 JavaScript 取決於用於建構的命令以及 `pcfproj` 檔案中的 `PcfBuildMode`。

您通常不會將以開發模式建構的程式碼元件部署到 Microsoft Dataverse 中，因為它通常太大而無法匯入，並且可能導致執行時效能變慢。更多資訊：[部署到 Microsoft Dataverse 後的偵錯](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls#debugging-after-deploying-into-microsoft-dataverse)。

為了使 `pac pcf push` 產生發佈建構，`PcfBuildMode` 是透過在 `OutputPath` 元素下新增新元素來在 `pcfproj` 內部設定的：

```xml
<PropertyGroup>
   <Name>my-control</Name>
   <ProjectGuid>6aaf0d27-ec8b-471e-9ed4-7b3bbc35bbab</ProjectGuid>
   <OutputPath>$(MSBuildThisFileDirectory)out\controls</OutputPath>
   <PcfBuildMode>production</PcfBuildMode>
</PropertyGroup>
```

### 建構命令

| 命令 | 預設行為 | 使用 PcfBuildMode=production |
|---------|-----------------|------------------------------|
| npm start watch | 始終開發 |   |
| pac pcf push | 開發建構 | 發佈建構 |
| npm run build | 開發建構 | `npm run build -- --buildMode production` |

更多資訊：[封裝程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/import-custom-controls#package-a-code-component)。

## 建構 .cdsproj 解決方案專案

建構解決方案專案 (`.cdsproj`) 時，您可以選擇將輸出產生為受控或非受控解決方案。受控解決方案用於部署到任何非該解決方案開發環境的環境。這包括測試、UAT、SIT 和生產環境。更多資訊：[受控和非受控解決方案](https://learn.microsoft.com/en-us/power-platform/alm/solution-concepts-alm#managed-and-unmanaged-solutions)。

`SolutionPackagerType` 包含在由 `pac solution init` 建立的 `.cdsproj` 檔案中，但最初已註解掉。取消註解該部分並設定為受控、非受控或兩者。

```xml
<!-- Solution Packager 覆寫，取消註解以使用：SolutionPackagerType (Managed, Unmanaged, Both) -->
<PropertyGroup>
   <SolutionPackageType>Managed</SolutionPackageType>
</PropertyGroup>
```

### 建構設定結果

| 命令 | SolutionPackagerType | 結果 |
|---------|-------------------|---------|
| msbuild | Managed | 受控解決方案內的開發建構 |
| msbuild /p:configuration=Release | Managed | 受控解決方案內的發佈建構 |
| msbuild | Unmanaged | 非受控解決方案內的開發建構 |
| msbuild /p:configuration=Release | Unmanaged | 非受控解決方案內的發佈建構 |

更多資訊：[封裝程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/import-custom-controls#package-a-code-component)。

## 使用程式碼元件進行原始程式碼控制

開發程式碼元件時，建議您使用原始程式碼控制提供者，例如 Azure DevOps 或 GitHub。使用 git 原始程式碼控制提交變更時，`pac pcf init` 範本提供的 `.gitignore` 檔案將確保某些檔案不會新增到原始程式碼控制中，因為它們要麼由 `npm` 還原，要麼作為建構過程的一部分產生：

```
# 相依項
/node_modules

# 產生目錄
**/generated

# 輸出目錄
/out

# msbuild 輸出目錄
/bin
/obj
```

由於 `/out` 資料夾被排除，因此產生的 `bundle.js` 檔案 (及相關資源) 將不會新增到原始程式碼控制中。當您的程式碼元件手動建構或作為自動化建構管線的一部分建構時，`bundle.js` 將使用最新的程式碼建構，以確保包含所有變更。

此外，建構解決方案時，任何關聯的解決方案 zip 檔案都不會提交到原始程式碼控制。相反，輸出將作為二進位發佈成品發佈。

## 將 SolutionPackager 與程式碼元件一起使用

除了原始程式碼控制 `pcfproj` 和 `cdsproj` 之外，[SolutionPackager](https://learn.microsoft.com/en-us/power-platform/alm/solution-packager-tool) 還可以用於將解決方案逐步解壓縮到其各自的部分，作為一系列 XML 檔案，可以提交到原始程式碼控制中。這樣做的好處是，可以以人類可讀的格式建立中繼資料的完整圖片，以便您可以使用提取請求或類似的方式追蹤變更。

> **注意**：目前，SolutionPackager 與使用 `pac solution clone` 的區別在於，它可以用於從 Dataverse 解決方案逐步匯出變更。

### 範例解決方案結構

一旦使用 `SolutionPackager /action: Extract` 解壓縮包含程式碼元件的解決方案，它將看起來類似於：

```
.
├── Controls
│   └── prefix_namespace.ControlName
│       ├── bundle.js *
│       └── css
│          └── ControlName.css *
│       ├── ControlManifest.xml *
│       └── ControlManifest.xml.data.xml
├── Entities
│   └── Contact
│       ├── FormXml
│       │   └── main
│       │       └── {3d60f361-84c5-eb11-bacc-000d3a9d0f1d}.xml
│       ├── Entity.xml
│       └── RibbonDiff.xml
└── Other
    ├── Customizations.xml
    └── Solution.xml
```

在 `Controls` 資料夾下，您可以看到每個包含在解決方案中的程式碼元件都有子資料夾。將此資料夾結構提交到原始程式碼控制時，您將排除帶星號 (*) 標記的檔案，因為它們將在建構相應元件的 `pcfproj` 專案時輸出。

唯一需要的檔案是 `*.data.xml` 檔案，因為它們包含描述封裝過程所需資源的中繼資料。

更多資訊：[SolutionPackager 命令列引數](https://learn.microsoft.com/en-us/power-platform/alm/solution-packager-tool#solutionpackager-command-line-arguments)。

## 程式碼元件解決方案策略

程式碼元件使用 Dataverse 解決方案部署到下游環境。在解決方案內部部署程式碼元件有兩種策略：

### 1. 分段解決方案

使用 `pac solution init` 建立解決方案專案，然後使用 `pac solution add-reference` 新增一個或多個程式碼元件。然後，此解決方案可以匯出並匯入到下游環境中，其他分段解決方案將依賴於程式碼元件解決方案，以便它必須首先部署到該環境中。

**採用分段解決方案方法的原因：**

1. **版本控制生命週期** - 您希望以獨立於解決方案其他部分的生命週期開發、部署和版本控制程式碼元件。這在「融合團隊」情境中很常見，其中開發人員建立的程式碼元件由應用程式製造者使用。

2. **共用使用** - 您希望在多個環境之間共用您的程式碼元件，因此不想將您的程式碼元件與任何其他解決方案元件耦合。這可能是如果您是 ISV 或開發用於組織不同部分的程式碼元件。

### 2. 單一解決方案

在 Dataverse 環境中建立單一解決方案，然後將程式碼元件與其他解決方案元件 (例如表格、模型導向應用程式或畫布應用程式) 一起新增，這些元件又會引用這些程式碼元件。此解決方案可以匯出並匯入到下游環境中，而無需任何解決方案間的相依性。

### 解決方案生命週期總覽

![解決方案策略](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/solution-strategies.png)

更多資訊：[使用解決方案封裝和分發擴充功能](https://learn.microsoft.com/en-us/powerapps/developer/data-platform/introduction-solutions)。

## 程式碼元件和自動化建構管線

除了手動建構和部署您的程式碼元件解決方案之外，您還可以使用自動化建構管線建構和封裝您的程式碼元件。

- 如果您使用 Azure DevOps，您可以使用 [適用於 Azure DevOps 的 Microsoft Power Platform 建構工具](https://learn.microsoft.com/en-us/power-platform/alm/devops-build-tools)。
- 如果您使用 GitHub，您可以使用 [Power Platform GitHub Actions](https://learn.microsoft.com/en-us/power-platform/alm/devops-github-actions)。

### 自動化建構管線的優點

- **省時** - 消除手動任務使建構和封裝更快
- **可重複** - 每次都執行相同操作，不依賴於團隊成員
- **版本控制一致性** - 相對於以前版本的自動版本控制
- **可維護** - 建構所需的一切都包含在原始程式碼控制中

## 版本控制和部署更新

部署和更新您的程式碼元件時，擁有一致的版本控制策略很重要。一個常見的版本控制策略是 [語義化版本控制](https://semver.org/)，其格式為：`主要.次要.修補`。

### 遞增 PATCH 版本

`ControlManifest.Input.xml` 將程式碼元件版本儲存在控制項元素中：

```xml
<control namespace="..." constructor="..." version="1.0.0" display-name-key="..." description-key="..." control-type="...">
```

當部署程式碼元件的更新時，`ControlManifest.Input.xml` 中的版本必須至少遞增其 PATCH (版本的最後一部分)，才能檢測到變更。

**更新版本的命令：**

```bash
# 將 PATCH 版本遞增一
pac pcf version --strategy manifest

# 指定確切的 PATCH 值 (例如，在自動化建構管線中)
pac pcf version --patchversion <PATCH VERSION>
```

### 何時遞增 MAJOR 和 MINOR 版本

建議將程式碼元件版本的主要和次要版本與分發的 Dataverse 解決方案保持同步。

[Dataverse 解決方案有四個部分](https://learn.microsoft.com/en-us/powerapps/maker/data-platform/update-solutions#understanding-version-numbers-for-updates)：`主要.次要.建構.修訂`。

| 程式碼元件 | Dataverse 解決方案 | 備註 |
|----------------|-------------------|--------|
| MAJOR | MAJOR | 使用管線變數或上次提交的值設定 |
| MINOR | MINOR | 使用管線變數或上次提交的值設定 |
| PATCH | BUILD | $(Build.BuildId) |
| --- | REVISION | $(Rev:r) |

## 畫布應用程式 ALM 考量

在畫布應用程式中使用程式碼元件與在模型導向應用程式中有所不同。必須透過在「插入」面板上選取「取得更多元件」來明確將程式碼元件新增到應用程式。一旦程式碼元件新增到畫布應用程式，它將作為內容包含在應用程式定義中。

若要在部署後更新程式碼元件的新版本 (並遞增控制項版本)，應用程式製造者必須首先在 Power Apps Studio 中開啟應用程式，並在「更新程式碼元件」對話框中提示時選取「更新」。然後必須儲存並發佈應用程式，才能在使用者播放應用程式時使用新版本。

![更新程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/media/upgrade-code-component.png)

如果應用程式未更新或使用「跳過」，則應用程式將繼續使用舊版本的程式碼元件，即使它不存在於環境中，因為它已被新版本覆蓋。

由於應用程式包含程式碼元件的副本，因此可以在單一環境中從不同的畫布應用程式中並行執行不同版本的程式碼元件。但是，您不能在同一個應用程式中並行執行不同版本的程式碼元件。

> **注意**：儘管目前您可以在未將匹配的程式碼元件部署到該環境的情況下匯入畫布應用程式，但建議您始終確保應用程式更新為使用最新版本的程式碼元件，並且相同的版本首先部署到該環境或作為相同解決方案的一部分。

## 相關文件

- [使用 Microsoft Power Platform 的應用程式生命週期管理 (ALM)](https://learn.microsoft.com/en-us/power-platform/alm/overview-alm)
- [Power Apps Component Framework API 參考](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/)
- [建立您的第一個元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/implementing-controls-using-typescript)
- [偵錯程式碼元件](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/debugging-custom-controls)
