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
| [agentic-eval](../skills/agentic-eval/SKILL.md) | 評估與改進 AI 代理輸出結果的模式與技術。在以下情況使用此技能：<br />- 實作自我批評與反思迴圈<br />- 為品質關鍵的生成建構評估者-優化者流程<br />- 建立測試驅動的程式碼精煉工作流<br />- 設計基於量表或以 LLM 為評審的評估系統<br />- 為代理輸出（程式碼、報告、分析）加入疊代改進<br />- 衡量並提升代理回應品質 | 無 |
| [appinsights-instrumentation](../skills/appinsights-instrumentation/SKILL.md) | 為應用程式安裝檢測以將有用的遙測資料傳送至 Azure App Insights | `examples/appinsights.bicep`<br />`references/ASPNETCORE.md`<br />`references/AUTO.md`<br />`references/NODEJS.md`<br />`references/PYTHON.md`<br />`scripts/appinsights.ps1` |
| [azure-deployment-preflight](../skills/azure-deployment-preflight/SKILL.md) | 對 Azure 的 Bicep 部署執行全方位的發布前驗證（preflight validation），包含範本語法驗證、模擬分析（what-if analysis）及權限檢查。在任何部署到 Azure 的動作之前使用此技能，以預覽變更、識別潛在問題並確保部署成功。當使用者提到部署到 Azure、驗證 Bicep 檔案、檢查部署權限、預覽基礎架構變更、執行 what-if 或為 azd provision 做準備時啟動。 | `references/ERROR-HANDLING.md`<br />`references/REPORT-TEMPLATE.md`<br />`references/VALIDATION-COMMANDS.md` |
| [azure-devops-cli](../skills/azure-devops-cli/SKILL.md) | 使用帶有 Azure DevOps 擴充功能的 Azure CLI 管理 Azure DevOps 資源，包括專案、儲存庫、流程、建構、提取請求、工作項目、成品和服務端點。在處理 Azure DevOps、az 命令、devops 自動化、CI/CD 或使用者提及 Azure DevOps CLI 時使用。 | 無 |
| [azure-resource-visualizer](../skills/azure-resource-visualizer/SKILL.md) | 分析 Azure 資源群組並產生詳細的 Mermaid 架構圖，顯示個別資源之間的關係。當使用者要求提供其 Azure 資源的圖表或協助理解資源之間的相互關係時，請使用此技能。 | `assets/template-architecture.md` |
| [azure-role-selector](../skills/azure-role-selector/SKILL.md) | 當使用者詢問在給定所需權限的情況下應為識別指派哪個角色時，此 Agent 會協助他們了解符合需求且具備最小權限存取權的角色，以及如何套用該角色。 | 無 |
| [azure-static-web-apps](../skills/azure-static-web-apps/SKILL.md) | 協助使用 SWA CLI 建立、設定與部署 Azure Static Web Apps。用於將靜態網站部署到 Azure、設定 SWA 本地開發、設定 staticwebapp.config.json、將 Azure Functions API 加入到 SWA，或為 Static Web Apps 設定 GitHub Actions CI/CD。 | 無 |
| [chrome-devtools](../skills/chrome-devtools/SKILL.md) | 使用 Chrome DevTools MCP 進行專家級的瀏覽器自動化、除錯和效能分析。用於與網頁互動、擷取螢幕截圖、分析網路流量以及分析效能概況。 | 無 |
| [gh-cli](../skills/gh-cli/SKILL.md) | GitHub CLI (gh) 關於儲存庫、議題、提取請求、Actions、專案、發佈 (releases)、Gists、Codespaces、組織、擴充功能以及所有透過命令列進行之 GitHub 操作的全面參考手冊。 | 無 |
| [git-commit](../skills/git-commit/SKILL.md) | 使用約定式提交（Conventional Commit）訊息分析、智慧暫存和訊息生成來執行 git commit。當使用者要求提交變更、建立 git commit 或提及「/commit」時使用。支援：(1) 從變更中自動偵測類型和範圍，(2) 從 diff 生成約定式提交訊息，(3) 帶有選用類型/範圍/描述覆寫的互動式提交，(4) 用於邏輯分組的智慧檔案暫存 | 無 |
| [github-issues](../skills/github-issues/SKILL.md) | 使用 MCP 工具建立、更新及管理 GitHub issue。當使用者想要建立錯誤回報、功能要求或任務 issue、更新現有 issue、加入標籤/指派人員/里程碑，或管理 issue 工作流程時，請使用此技能。觸發條件包括「建立一個 issue」、「回報一個錯誤」、「要求一個功能」、「更新 issue X」或任何 GitHub issue 管理任務等請求。 | `references/templates.md` |
| [image-manipulation-image-magick](../skills/image-manipulation-image-magick/SKILL.md) | 使用 ImageMagick 處理和操作影像。支援調整大小、格式轉換、批次處理以及擷取影像 Metadata。適用於處理影像、建立縮圖、調整桌布大小或執行批次影像操作。 | 無 |
| [legacy-circuit-mockups](../skills/legacy-circuit-mockups/SKILL.md) | 使用 HTML5 Canvas 繪圖技術產生麵包板電路模擬圖與視覺圖表。當被要求建立電路佈局、視覺化電子元件放置、繪製麵包板圖表、模擬 6502 建置、產生復古電腦電路圖或設計老式電子專案時使用。支援 555 計時器、W65C02S 微處理器、28C256 EEPROM、W65C22 VIA 晶片、7400 系列邏輯閘、LED、電阻、電容、開關、按鈕、晶體及導線。 | `references/28256-eeprom.md`<br />`references/555.md`<br />`references/6502.md`<br />`references/6522.md`<br />`references/6C62256.md`<br />`references/7400-series.md`<br />`references/assembly-compiler.md`<br />`references/assembly-language.md`<br />`references/basic-electronic-components.md`<br />`references/breadboard.md`<br />`references/common-breadboard-components.md`<br />`references/connecting-electronic-components.md`<br />`references/emulator-28256-eeprom.md`<br />`references/emulator-6502.md`<br />`references/emulator-6522.md`<br />`references/emulator-6C62256.md`<br />`references/emulator-lcd.md`<br />`references/lcd.md`<br />`references/minipro.md`<br />`references/t48eeprom-programmer.md` |
| [make-skill-template](../skills/make-skill-template/SKILL.md) | 從提示語或透過複製此範本來建立新的 GitHub Copilot Agent Skills。當被要求「建立技能」、「製作新技能」、「建構技能架構」或使用隨附資源建構專門的 AI 能力時使用。產生具備正確 Frontmatter、目錄結構以及選用的 scripts/references/assets 資料夾的 SKILL.md 檔案。 | 無 |
| [mcp-cli](../skills/mcp-cli/SKILL.md) | 透過命令列介面（CLI）與 MCP (Model Context Protocol) 伺服器互動。當你需要透過 MCP 伺服器與外部工具、API 或資料源進行互動，列出可用的 MCP 伺服器/工具，或從命令列呼叫 MCP 工具時使用。 | 無 |
| [microsoft-code-reference](../skills/microsoft-code-reference/SKILL.md) | 查詢 Microsoft API 參考、尋找可執行的程式碼範例，並驗證 SDK 程式碼是否正確。在處理 Azure SDK、.NET 函式庫或 Microsoft API 時使用——用以尋找正確的方法、檢查參數、取得可執行的範例或疑難排解錯誤。透過查詢官方文件來捕捉虛構的方法、錯誤的簽章以及淘汰的模式。 | 無 |
| [microsoft-docs](../skills/microsoft-docs/SKILL.md) | 查詢 Microsoft 官方文件以理解概念、尋找教學並學習服務如何運作。用於 Azure、.NET、Microsoft 365、Windows、Power Platform 以及所有 Microsoft 技術。從 learn.microsoft.com 和其他 Microsoft 官方網站取得準確、最新的資訊——架構概觀、快速入門、組態指南、限制以及最佳實踐。 | 無 |
| [nuget-manager](../skills/nuget-manager/SKILL.md) | 管理 .NET 專案/解決方案中的 NuGet 套件。當要新增、移除或更新 NuGet 套件版本時，請使用此技能。它強制使用 `dotnet` CLI 進行套件管理，並規定僅在更新版本時才能直接編輯檔案，並提供嚴格的操作程序。 | 無 |
| [plantuml-ascii](../skills/plantuml-ascii/SKILL.md) | 使用 PlantUML 文字模式產生 ASCII 藝術圖表。當使用者要求建立 ASCII 圖表、基於文字的圖表、對終端機友善的圖表，或提及 plantuml ascii、文字圖表、ascii 藝術圖表時使用。支援：將 PlantUML 圖表轉換為 ASCII 藝術、建立 ASCII 格式的時序圖、類別圖、流程圖，以及使用 -utxt 參數產生強化 Unicode 的 ASCII 藝術。 | 無 |
| [prd](../skills/prd/SKILL.md) | 為軟體系統和人工智慧（AI）驅動的功能產出高品質的產品需求文件 (PRD)。包含摘要、使用者故事、技術規格和風險分析。 | 無 |
| [refactor](../skills/refactor/SKILL.md) | 進行精確的程式碼重構，在不改變行為的情況下提高可維護性。涵蓋提取函式、重新命名變數、拆解龐大函式（god functions）、提高型別安全性、消除程式碼異味以及應用設計模式。比 repo-rebuilder 的影響較小；用於漸進式改進。 | 無 |
| [scoutqa-test](../skills/scoutqa-test/SKILL.md) | 當使用者要求「測試此網站」、「執行探索性測試」、「檢查協助工具問題」、「驗證登入流程是否正常」、「尋找此頁面上的錯誤」或要求自動化 QA 測試時，應使用此技能。針對網頁應用程式測試情境觸發，包括使用 ScoutQA CLI 的煙霧測試、協助工具稽核、電子商務流程和使用者流程驗證。重要提示：在實作網頁應用程式功能後，請主動使用此技能來驗證它們是否正常運作 - 不要等待使用者要求測試。 | 無 |
| [snowflake-semanticview](../skills/snowflake-semanticview/SKILL.md) | 使用 Snowflake CLI (snow) 建立、修改及驗證 Snowflake 語義檢視表 (semantic views)。當被要求使用 CREATE/ALTER SEMANTIC VIEW 建構語義檢視表/語義層定義或進行疑難排解、透過 CLI 向 Snowflake 驗證語義檢視表 DDL，或引導進行 Snowflake CLI 安裝與連線設定時使用。 | 無 |
| [vscode-ext-commands](../skills/vscode-ext-commands/SKILL.md) | 在 VS Code 延伸模組中貢獻指令的指南。標示命名慣例、可見性、在地化及其他相關屬性，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。 | 無 |
| [vscode-ext-localization](../skills/vscode-ext-localization/SKILL.md) | VS Code 延伸模組正確在地化的指南，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。 | 無 |
| [web-design-reviewer](../skills/web-design-reviewer/SKILL.md) | 此技能可對在本機或遠端執行的網站進行視覺檢查，以識別並修正設計問題。觸發條件包括「審閱網站設計」、「檢查 UI」、「修正版面配置」、「尋找設計問題」等請求。可偵測回應式設計、無障礙性、視覺一致性以及版面破裂等問題，並在原始程式碼層級進行修正。 | `references/framework-fixes.md`<br />`references/visual-checklist.md` |
| [webapp-testing](../skills/webapp-testing/SKILL.md) | 使用 Playwright 與本地網頁應用程式互動和測試的工具包。支援驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖以及檢視瀏覽器日誌。 | `test-helper.js` |
| [workiq-copilot](../skills/workiq-copilot/SKILL.md) | 引導 Copilot CLI 如何使用 WorkIQ CLI/MCP 伺服器來查詢 Microsoft 365 Copilot 資料（電子郵件、會議、文件、Teams、人員），以獲取即時背景資訊、摘要和建議。 | 無 |
