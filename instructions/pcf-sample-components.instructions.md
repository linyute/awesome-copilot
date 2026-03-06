---
description: '如何使用和執行 PowerApps-Samples 儲存庫中的 PCF 範例元件'
applyTo: '**/*.{ts,tsx,js,json,xml,pcfproj,csproj}'
---

# 如何使用範例元件

本節列出的所有範例元件都可以從 [github.com/microsoft/PowerApps-Samples/tree/master/component-framework](https://github.com/microsoft/PowerApps-Samples/tree/master/component-framework) 下載，以便您可以在模型導向應用程式或畫布應用程式中試用它們。

本節中的個別範例元件主題為您提供範例元件的概述、其視覺外觀以及指向完整範例元件的連結。

## 在您試用範例元件之前

若要試用範例元件，您必須先：

- [下載](https://docs.github.com/repositories/working-with-files/using-files/downloading-source-code-archives#downloading-source-code-archives-from-the-repository-view) 或 [複製](https://docs.github.com/repositories/creating-and-managing-repositories/cloning-a-repository) 此儲存庫 [github.com/microsoft/PowerApps-Samples](https://github.com/microsoft/PowerApps-Samples)。
- 安裝 [適用於 Windows 的 Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction#install-power-platform-cli-for-windows)。

## 試用範例元件

遵循 [README.md](https://github.com/microsoft/PowerApps-Samples/blob/master/component-framework/README.md) 中的步驟來產生包含控制項的解決方案，以便您可以在模型導向應用程式或畫布應用程式中匯入並試用範例元件。

## 如何執行範例元件

使用以下步驟在模型導向應用程式或畫布應用程式中匯入並試用範例元件。

### 逐步程序

1. **下載或複製儲存庫**
   - [下載](https://docs.github.com/repositories/working-with-files/using-files/downloading-source-code-archives#downloading-source-code-archives-from-the-repository-view) 或 [複製](https://docs.github.com/repositories/creating-and-managing-repositories/cloning-a-repository) [github.com/microsoft/PowerApps-Samples](https://github.com/microsoft/PowerApps-Samples)。

2. **開啟開發人員命令提示字元**
   - 開啟 [Visual Studio 的開發人員命令提示字元](https://learn.microsoft.com/visualstudio/ide/reference/command-prompt-powershell) 並導覽至 `component-framework` 資料夾。
   - 在 Windows 上，您可以在「開始」中輸入 `developer command prompt` 以開啟開發人員命令提示字元。

3. **安裝相依性**
   - 導覽至您要試用的元件，例如 `IncrementControl`，並執行：
   ```bash
   npm install
   ```

4. **還原專案**
   - 命令完成後，執行：
   ```bash
   msbuild /t:restore
   ```

5. **建立解決方案資料夾**
   - 在範例元件資料夾內建立一個新資料夾：
   ```bash
   mkdir IncrementControlSolution
   ```

6. **導覽至解決方案資料夾**
   ```bash
   cd IncrementControlSolution
   ```

7. **初始化解決方案**
   - 在您建立的資料夾中，執行 `pac solution init` 命令：
   ```bash
   pac solution init --publisher-name powerapps_samples --publisher-prefix sample
   ```
   > **注意**：此命令會在資料夾中建立一個名為 `IncrementControlSolution.cdsproj` 的新檔案。

8. **新增元件參考**
   - 執行 `pac solution add-reference` 命令，並將 `path` 設定為 `.pcfproj` 檔案的位置：
   ```bash
   pac solution add-reference --path ../../IncrementControl
   ```
   或
   ```bash
   pac solution add-reference --path ../../IncrementControl/IncrementControl.pcfproj
   ```
   > **重要事項**：參考包含您要新增之控制項的 `.pcfproj` 檔案的資料夾。

9. **建構解決方案**
   - 若要從您的解決方案專案產生一個 zip 檔案，請執行以下三個命令：
   ```bash
   msbuild /t:restore
   msbuild /t:rebuild /restore /p:Configuration=Release
   msbuild
   ```
   - 產生的解決方案 zip 檔案將位於 `IncrementControlSolution\bin\debug` 資料夾中。

10. **匯入解決方案**
    - 現在您有了 zip 檔案，您有兩個選項：
      - 手動將 [解決方案匯入](https://learn.microsoft.com/powerapps/maker/data-platform/import-update-export-solutions) 到您的環境中，使用 [make.powerapps.com](https://make.powerapps.com/)。
      - 或者，若要使用 Power Apps CLI 命令匯入解決方案，請參閱 [連線到您的環境](https://learn.microsoft.com/powerapps/developer/component-framework/import-custom-controls#connecting-to-your-environment) 和 [部署](https://learn.microsoft.com/powerapps/developer/component-framework/import-custom-controls#deploying-code-components) 章節。

11. **將元件新增至應用程式**
    - 最後，若要將程式碼元件新增至您的模型導向和畫布應用程式，請參閱：
      - [將元件新增至模型導向應用程式](https://learn.microsoft.com/powerapps/developer/component-framework/add-custom-controls-to-a-field-or-entity)
      - [將元件新增至畫布應用程式](https://learn.microsoft.com/powerapps/developer/component-framework/component-framework-for-canvas-apps#add-components-to-a-canvas-app)

## 可用的範例元件

儲存庫包含許多範例元件，包括：

- AngularJSFlipControl
- CanvasGridControl
- ChoicesPickerControl
- ChoicesPickerReactControl
- CodeInterpreterControl
- ControlStateAPI
- DataSetGrid
- DeviceApiControl
- FacepileReactControl
- FluentThemingAPIControl
- FormattingAPIControl
- IFrameControl
- ImageUploadControl
- IncrementControl
- LinearInputControl
- LocalizationAPIControl
- LookupSimpleControl
- MapControl
- ModelDrivenGridControl
- MultiSelectOptionSetControl
- NavigationAPIControl
- ObjectOutputControl
- PowerAppsGridCustomizerControl
- PropertySetTableControl
- ReactStandardControl
- TableControl
- TableGrid
- WebAPIControl

每個範例都展示了 Power Apps Component Framework 的不同方面，並且可以作為您自己的元件的學習資源或起點。
