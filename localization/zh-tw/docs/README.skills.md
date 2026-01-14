# 🎯 代理程式技能

代理程式技能是自成一體的資料夾，包含指示和捆綁資源，可增強 AI 針對專業任務的應用程式能力。根據 [代理程式技能規範](https://agentskills.io/specification)，每個技能都包含一個 `SKILL.md` 檔案，其中包含代理程式按需載入的詳細指示。

技能與其他基本類型不同，它支援捆綁資產（腳本、程式碼範例、參考資料），代理程式可以在執行專業任務時利用這些資產。
### 如何使用代理程式技能

**包含內容：**
- 每個技能都是一個資料夾，包含一個 `SKILL.md` 指示檔案
- 技能可能包含輔助腳本、程式碼範本或參考資料
- 技能遵循代理程式技能規範以實現最大相容性

**何時使用：**
- 技能非常適合複雜、可重複的工作流程，這些工作流程可受益於捆綁資源
- 當您需要程式碼範本、輔助公用程式或參考資料以及指示時，請使用技能
- 技能提供漸進式揭露 - 僅在需要特定任務時載入

**用法：**
- 瀏覽下面的技能表以搜尋相關功能
- 將技能資料夾複製到您的本機技能目錄
- 在您的提示中參考技能或讓代理程式自動探索它們

| 名稱 | 描述 | 捆綁資產 |
| ---- | ----------- | -------------- |
| [appinsights-instrumentation](../skills/appinsights-instrumentation/SKILL.md) | 為應用程式安裝檢測以將有用的遙測資料傳送至 Azure App Insights | `examples/appinsights.bicep`<br />`references/ASPNETCORE.md`<br />`references/AUTO.md`<br />`references/NODEJS.md`<br />`references/PYTHON.md`<br />`scripts/appinsights.ps1` |
| [azure-resource-visualizer](../skills/azure-resource-visualizer/SKILL.md) | 分析 Azure 資源群組並產生詳細的 Mermaid 架構圖，顯示個別資源之間的關係。當使用者要求提供其 Azure 資源的圖表或協助理解資源之間的相互關係時，請使用此技能。 | `assets/template-architecture.md` |
| [azure-role-selector](../skills/azure-role-selector/SKILL.md) | 當使用者詢問在給定所需權限的情況下應為識別指派哪個角色時，此 Agent 會協助他們了解符合需求且具備最小權限存取權的角色，以及如何套用該角色。 | 無 |
| [github-issues](../skills/github-issues/SKILL.md) | 使用 MCP 工具建立、更新及管理 GitHub issue。當使用者想要建立錯誤回報、功能要求或任務 issue、更新現有 issue、加入標籤/指派人員/里程碑，或管理 issue 工作流程時，請使用此技能。觸發條件包括「建立一個 issue」、「回報一個錯誤」、「要求一個功能」、「更新 issue X」或任何 GitHub issue 管理任務等請求。 | `references/templates.md` |
| [nuget-manager](../skills/nuget-manager/SKILL.md) | 管理 .NET 專案/解決方案中的 NuGet 套件。當要新增、移除或更新 NuGet 套件版本時，請使用此技能。它強制使用 `dotnet` CLI 進行套件管理，並規定僅在更新版本時才能直接編輯檔案，並提供嚴格的操作程序。 | 無 |
| [snowflake-semanticview](../skills/snowflake-semanticview/SKILL.md) | 使用 Snowflake CLI (snow) 建立、變更和驗證 Snowflake 語意檢視表。當被要求使用 CREATE/ALTER SEMANTIC VIEW 建構語意檢視表/語意層定義或對其進行疑難排解、透過 CLI 對 Snowflake 驗證語意檢視表 DDL，或是引導 Snowflake CLI 安裝和連線設定時使用。 | 無 |
| [vscode-ext-commands](../skills/vscode-ext-commands/SKILL.md) | 在 VS Code 延伸模組中貢獻指令的指南。標示命名慣例、可見性、在地化及其他相關屬性，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。 | 無 |
| [vscode-ext-localization](../skills/vscode-ext-localization/SKILL.md) | VS Code 延伸模組正確在地化的指南，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。 | 無 |
| [webapp-testing](../skills/webapp-testing/SKILL.md) | 使用 Playwright 與本地網頁應用程式互動和測試的工具包。支援驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖以及檢視瀏覽器日誌。 | `test-helper.js` |
