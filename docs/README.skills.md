# 🎯 代理程式技能 (Agent Skills)

代理程式技能是包含指引與隨附資源的獨立資料夾，可增強專門任務的 AI 能力。基於 [代理程式技能規格](https://agentskills.io/specification)，每個技能都包含一個 `SKILL.md` 檔案，其中包含代理程式按需載入的詳細指引。

技能與其他基本資源的不同之處在於支援隨附資產 (指令碼、程式碼範例、參考資料)，代理程式在執行專門任務時可以使用這些資產。
### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-skills) 以獲取有關如何貢獻新代理程式技能、改進現有技能以及分享您的使用案例的準則。

### 如何使用代理程式技能

**包含內容：**
- 每個技能都是一個包含 `SKILL.md` 指引檔案的資料夾
- 技能可能包含輔助指令碼、程式碼範本或參考資料
- 技能遵循代理程式技能規格以實現最大相容性

**何時使用：**
- 技能非常適合受益於隨附資源的複雜、可重複工作流程
- 當您除了指引外還需要程式碼範本、輔助工具或參考資料時，請使用技能
- 技能提供漸進式揭露 — 僅在特定任務需要時才載入

**用法：**
- 瀏覽下方的技能表格以尋找相關功能
- 將技能資料夾複製到您的本機技能目錄
- 在提示中引用技能，或讓代理程式自動發現它們

| 名稱 | 說明 | 隨附資產 |
| ---- | ----------- | -------------- |
| [add-educational-comments](../skills/add-educational-comments/SKILL.md) | 為指定檔案新增教育性註解，如果未提供檔案，則提示要求註解檔案。 | 無 |
| [agent-governance](../skills/agent-governance/SKILL.md) | 為 AI 代理程式系統增加治理、安全和信任控制的模式與技術。在以下情況使用此技能：<br />- 建構呼叫外部工具（API、資料庫、檔案系統）的 AI 代理程式<br />- 為代理程式工具使用實作以策略為基礎的存取控制<br />- 增加語義意圖分類以偵測危險的提示詞<br />- 為多代理程式工作流建立信任評分系統<br />- 為代理程式動作和決策建構稽核追蹤<br />- 對代理程式強制執行速率限制、內容篩選或工具限制<br />- 使用任何代理程式框架（PydanticAI、CrewAI、OpenAI Agents、LangChain、AutoGen） | 無 |
| [agentic-eval](../skills/agentic-eval/SKILL.md) | 評估與改進 AI 代理輸出結果的模式與技術。在以下情況使用此技能：<br />- 實作自我批評與反思迴圈<br />- 為品質關鍵的生成建構評估者-優化者流程<br />- 建立測試驅動的程式碼精煉工作流<br />- 設計基於量表或以 LLM 為評審的評估系統<br />- 為代理輸出（程式碼、報告、分析）加入疊代改進<br />- 衡量並提升代理回應品質 | 無 |
| [ai-prompt-engineering-safety-review](../skills/ai-prompt-engineering-safety-review/SKILL.md) | 全面性的 AI 提示工程安全審查與改進提示。分析提示的安全性、偏見、資安漏洞與有效性，並提供詳細的改進建議，涵蓋多種原理框架、測試方法與教育內容。 | 無 |
| [appinsights-instrumentation](../skills/appinsights-instrumentation/SKILL.md) | 為應用程式安裝檢測以將有用的遙測資料傳送至 Azure App Insights | `LICENSE.txt`<br />`examples/appinsights.bicep`<br />`references/ASPNETCORE.md`<br />`references/AUTO.md`<br />`references/NODEJS.md`<br />`references/PYTHON.md`<br />`scripts/appinsights.ps1` |
| [apple-appstore-reviewer](../skills/apple-appstore-reviewer/SKILL.md) | 擔任程式碼庫的審查人員，提供有關尋找 Apple App Store 最佳化或遭拒原因的指示。 | 無 |
| [arch-linux-triage](../skills/arch-linux-triage/SKILL.md) | 使用 pacman、systemd 和滾動更新最佳實踐來分類並解決 Arch Linux 問題。 | 無 |
| [architecture-blueprint-generator](../skills/architecture-blueprint-generator/SKILL.md) | 全面性的專案架構藍圖產生器，能分析程式碼庫並建立詳細的架構文件。自動偵測技術堆疊與架構模式，產生視覺化原理圖，記錄實作模式，並提供可延展的藍圖以維持架構一致性並指引新開發。 | 無 |
| [aspire](../skills/aspire/SKILL.md) | Aspire 技能涵蓋 Aspire CLI、AppHost 編排 (orchestration)、服務探索 (service discovery)、整合 (integrations)、MCP 伺服器、VS Code 延伸模組、開發容器 (Dev Containers)、GitHub Codespaces、範本、儀表板和部署。當使用者要求建立、執行、偵錯、設定、部署或疑難排解 Aspire 分散式應用程式時使用。 | `references/architecture.md`<br />`references/cli-reference.md`<br />`references/dashboard.md`<br />`references/deployment.md`<br />`references/integrations-catalog.md`<br />`references/mcp-server.md`<br />`references/polyglot-apis.md`<br />`references/testing.md`<br />`references/troubleshooting.md` |
| [aspnet-minimal-api-openapi](../skills/aspnet-minimal-api-openapi/SKILL.md) | 建立具備正確 OpenAPI 文件的 ASP.NET Minimal API 端點 | 無 |
| [az-cost-optimize](../skills/az-cost-optimize/SKILL.md) | 分析應用程式所用的 Azure 資源（IaC 檔案及/或目標資源群組中的資源），並最佳化成本——針對發現的最佳化項目建立 GitHub issue。 | 無 |
| [azure-deployment-preflight](../skills/azure-deployment-preflight/SKILL.md) | 對 Azure 的 Bicep 部署執行全方位的發布前驗證（preflight validation），包含範本語法驗證、模擬分析（what-if analysis）及權限檢查。在任何部署到 Azure 的動作之前使用此技能，以預覽變更、識別潛在問題並確保部署成功。當使用者提到部署到 Azure、驗證 Bicep 檔案、檢查部署權限、預覽基礎架構變更、執行 what-if 或為 azd provision 做準備時啟動。 | `references/ERROR-HANDLING.md`<br />`references/REPORT-TEMPLATE.md`<br />`references/VALIDATION-COMMANDS.md` |
| [azure-devops-cli](../skills/azure-devops-cli/SKILL.md) | 透過 CLI 管理 Azure DevOps 資源，包括專案、存放庫、管線、建構、提取要求、工作項目、構件和服務端點。在處理 Azure DevOps、az 指令、devops 自動化、CI/CD，或使用者提到 Azure DevOps CLI 時使用。 | `references/advanced-usage.md`<br />`references/boards-and-iterations.md`<br />`references/org-and-security.md`<br />`references/pipelines-and-builds.md`<br />`references/repos-and-prs.md`<br />`references/variables-and-agents.md`<br />`references/workflows-and-patterns.md` |
| [azure-pricing](../skills/azure-pricing/SKILL.md) | 使用 Azure 零售價格 API (prices.azure.com) 獲取即時 Azure 零售價格，並估算 Copilot Studio 代理人點數消耗。當使用者詢問任何 Azure 服務的成本、想要比較 SKU 價格、需要定價資料進行成本估算、提到 Azure 定價、Azure 成本、Azure 帳單，或詢問 Copilot Studio 定價、Copilot 點數或代理人使用量估算時使用。涵蓋運算、儲存、網路、資料庫、AI、Copilot Studio 以及所有其他 Azure 服務系列。 | `references/COPILOT-STUDIO-RATES.md`<br />`references/COST-ESTIMATOR.md`<br />`references/REGIONS.md`<br />`references/SERVICE-NAMES.md` |
| [azure-resource-health-diagnose](../skills/azure-resource-health-diagnose/SKILL.md) | 分析 Azure 資源健康狀態，診斷日誌與遙測問題，並針對發現的問題建立修復計畫。 | 無 |
| [azure-resource-visualizer](../skills/azure-resource-visualizer/SKILL.md) | 分析 Azure 資源群組並產生詳細的 Mermaid 架構圖，顯示個別資源之間的關係。當使用者要求提供其 Azure 資源的圖表或協助理解資源之間的相互關係時，請使用此技能。 | `LICENSE.txt`<br />`assets/template-architecture.md` |
| [azure-role-selector](../skills/azure-role-selector/SKILL.md) | 當使用者詢問在給定所需權限的情況下應為識別指派哪個角色時，此 Agent 會協助他們了解符合需求且具備最小權限存取權的角色，以及如何套用該角色。 | `LICENSE.txt` |
| [azure-static-web-apps](../skills/azure-static-web-apps/SKILL.md) | 協助使用 SWA CLI 建立、設定與部署 Azure Static Web Apps。用於將靜態網站部署到 Azure、設定 SWA 本地開發、設定 staticwebapp.config.json、將 Azure Functions API 加入到 SWA，或為 Static Web Apps 設定 GitHub Actions CI/CD。 | 無 |
| [bigquery-pipeline-audit](../skills/bigquery-pipeline-audit/SKILL.md) | 稽核 Python + BigQuery 管線的成本安全性、等冪性和生產就緒程度。傳回包含確切修補位置的結構化報告。 | 無 |
| [boost-prompt](../skills/boost-prompt/SKILL.md) | 互動式提示優化工作流程：反覆詢問範疇、交付成果、限制條件；將最終 markdown 複製到剪貼簿；絕不撰寫程式碼。需安裝 Joyride 擴充套件。 | 無 |
| [breakdown-epic-arch](../skills/breakdown-epic-arch/SKILL.md) | 針對 Epic，根據產品需求文件產生高階技術架構的提示。 | 無 |
| [breakdown-epic-pm](../skills/breakdown-epic-pm/SKILL.md) | 針對新 Epic 產生 Epic 產品需求文件（PRD）的提示。此 PRD 將作為產生技術架構規格的輸入。 | 無 |
| [breakdown-feature-implementation](../skills/breakdown-feature-implementation/SKILL.md) | 針對詳細功能實作計畫的提示，遵循 Epoch monorepo 結構。 | 無 |
| [breakdown-feature-prd](../skills/breakdown-feature-prd/SKILL.md) | 針對新功能產生產品需求文件（PRD）的提示，根據 Epic 內容。 | 無 |
| [breakdown-plan](../skills/breakdown-plan/SKILL.md) | 議題規劃與自動化提示，產生具 Epic > Feature > Story/Enabler > Test 層級、依賴、優先順序與自動追蹤的完整專案規劃。 | 無 |
| [breakdown-test](../skills/breakdown-test/SKILL.md) | 測試規劃與品質保證提示，產生完整測試策略、任務分解與品質驗證計畫，適用於 GitHub 專案管理。 | 無 |
| [centos-linux-triage](../skills/centos-linux-triage/SKILL.md) | 使用與 RHEL 相容的工具、具備 SELinux 意識的實踐以及 firewalld 來分類並解決 CentOS 問題。 | 無 |
| [chrome-devtools](../skills/chrome-devtools/SKILL.md) | 使用 Chrome DevTools MCP 進行專家級的瀏覽器自動化、除錯和效能分析。用於與網頁互動、擷取螢幕截圖、分析網路流量以及分析效能概況。 | 無 |
| [code-exemplars-blueprint-generator](../skills/code-exemplars-blueprint-generator/SKILL.md) | 技術中立的提示產生器，可建立可自訂的 AI 提示以掃描程式碼庫並找出高品質程式碼範例。支援多種程式語言（.NET、Java、JavaScript、TypeScript、React、Angular、Python），可調整分析深度、分類方式與文件格式，協助建立程式標準並維持團隊一致性。 | 無 |
| [comment-code-generate-a-tutorial](../skills/comment-code-generate-a-tutorial/SKILL.md) | 將此 Python 指令稿轉換為完善且適合初學者的專案，重構程式碼、加入清楚的教學註解，並產生完整的 markdown 指南。 | 無 |
| [containerize-aspnet-framework](../skills/containerize-aspnet-framework/SKILL.md) | 將 ASP.NET .NET Framework 專案容器化，並根據專案需求建立 Dockerfile 與 .dockerfile 檔案。 | 無 |
| [containerize-aspnetcore](../skills/containerize-aspnetcore/SKILL.md) | 將 ASP.NET Core 專案容器化，依專案需求建立 Dockerfile 與 .dockerfile，並客製化設定。 | 無 |
| [context-map](../skills/context-map/SKILL.md) | 在進行變更前產生所有與任務相關檔案的地圖 | 無 |
| [conventional-commit](../skills/conventional-commit/SKILL.md) | 用於使用結構化 XML 格式生成常規提交訊息的提示和工作流程。指導使用者根據常規提交規範建立標準化、描述性的提交訊息，包括說明、範例和驗證。 | 無 |
| [convert-plaintext-to-md](../skills/convert-plaintext-to-md/SKILL.md) | 依據提示中的指示，或如果傳入文件化的選項，則依循該選項的指示，將文字型文件轉換為 Markdown。 | 無 |
| [copilot-cli-quickstart](../skills/copilot-cli-quickstart/SKILL.md) | 當有人想要從零開始學習 GitHub Copilot CLI 時，請使用此技能。 提供互動式的逐步教學課程，包含獨立的開發人員與非開發人員路線， 以及隨需問答。只需說「開始教學」或提出問題即可！ 注意：此技能專門針對 GitHub Copilot CLI，並使用 CLI 特定的工具 (ask_user, sql, fetch_copilot_cli_documentation)。 | 無 |
| [copilot-instructions-blueprint-generator](../skills/copilot-instructions-blueprint-generator/SKILL.md) | 技術中立的藍圖產生器，用於建立完整的 copilot-instructions.md 文件，指引 GitHub Copilot 產生符合專案標準、架構模式與精確技術版本的程式碼，方法是分析現有程式碼庫模式並避免假設。 | 無 |
| [copilot-sdk](../skills/copilot-sdk/SKILL.md) | 使用 GitHub Copilot SDK 建構 Agentic 應用程式。適用於在應用程式中嵌入 AI Agent、建立自訂工具、實作串流回應、管理工作階段、連接到 MCP 伺服器或建立自訂 Agent。觸發條件包括 Copilot SDK、GitHub SDK、Agentic 應用程式、嵌入 Copilot、可程式化 Agent、MCP 伺服器、自訂 Agent。 | 無 |
| [copilot-spaces](../skills/copilot-spaces/SKILL.md) | 使用 Copilot Spaces 為對話提供專案特定上下文。當使用者提到「Copilot 空間 (Space)」、想要從共享知識庫載入上下文、探索可用空間，或詢問以精心策劃的專案文件、程式碼與指令為基礎的問題時，使用此技能。 | 無 |
| [copilot-usage-metrics](../skills/copilot-usage-metrics/SKILL.md) | 使用 GitHub CLI 和 REST API 擷取並顯示組織與企業的 GitHub Copilot 使用計量。 | `get-enterprise-metrics.sh`<br />`get-enterprise-user-metrics.sh`<br />`get-org-metrics.sh`<br />`get-org-user-metrics.sh` |
| [cosmosdb-datamodeling](../skills/cosmosdb-datamodeling/SKILL.md) | 逐步指南，用於捕獲 NoSQL 用例的關鍵應用程式需求，並使用最佳實踐和常見模式生成 Azure Cosmos DB 資料 NoSQL 模型設計，產生的文件：「cosmosdb_requirements.md」檔案和「cosmosdb_data_model.md」檔案 | 無 |
| [create-agentsmd](../skills/create-agentsmd/SKILL.md) | 用於為儲存庫生成 AGENTS.md 檔案的提示 | 無 |
| [create-architectural-decision-record](../skills/create-architectural-decision-record/SKILL.md) | 建立 AI 最佳化決策文件的架構決策記錄（ADR）文件。 | 無 |
| [create-github-action-workflow-specification](../skills/create-github-action-workflow-specification/SKILL.md) | 為現有 GitHub Actions CI/CD 工作流程建立正式規格文件，優化 AI 解析與工作流程維護。 | 無 |
| [create-github-issue-feature-from-specification](../skills/create-github-issue-feature-from-specification/SKILL.md) | 使用 feature_request.yml 樣板，根據規格文件建立 GitHub 功能請求 Issue。 | 無 |
| [create-github-issues-feature-from-implementation-plan](../skills/create-github-issues-feature-from-implementation-plan/SKILL.md) | 根據實作計畫的各階段，使用 feature_request.yml 或 chore_request.yml 樣板建立 GitHub Issue。 | 無 |
| [create-github-issues-for-unmet-specification-requirements](../skills/create-github-issues-for-unmet-specification-requirements/SKILL.md) | 針對規格文件中尚未實作的需求，使用 feature_request.yml 樣板建立 GitHub Issue。 | 無 |
| [create-github-pull-request-from-specification](../skills/create-github-pull-request-from-specification/SKILL.md) | 使用 pull_request_template.md 範本從規範檔案為功能請求建立 GitHub Pull Request。 | 無 |
| [create-implementation-plan](../skills/create-implementation-plan/SKILL.md) | 為新功能、重構現有程式碼或升級套件、設計、架構或基礎建設建立新的實作計畫文件。 | 無 |
| [create-llms](../skills/create-llms/SKILL.md) | 根據 llms.txt 規範，依據儲存庫結構從零建立 llms.txt 文件。 | 無 |
| [create-oo-component-documentation](../skills/create-oo-component-documentation/SKILL.md) | 依循業界最佳實踐與架構文件標準，為物件導向元件建立完整且標準化的文件。 | 無 |
| [create-readme](../skills/create-readme/SKILL.md) | 為專案建立 README.md 文件 | 無 |
| [create-specification](../skills/create-specification/SKILL.md) | 為解決方案建立新的規格文件，並針對生成式 AI 優化。 | 無 |
| [create-spring-boot-java-project](../skills/create-spring-boot-java-project/SKILL.md) | 建立 Spring Boot Java 專案骨架 | 無 |
| [create-spring-boot-kotlin-project](../skills/create-spring-boot-kotlin-project/SKILL.md) | 建立 Spring Boot Kotlin 專案骨架 | 無 |
| [create-technical-spike](../skills/create-technical-spike/SKILL.md) | 建立時間限制的技術探索文件，用於在實作之前研究和解決關鍵開發決策。 | 無 |
| [create-tldr-page](../skills/create-tldr-page/SKILL.md) | 從文件 URL 和命令範例建立 tldr 頁面，需要 URL 和命令名稱。 | 無 |
| [create-web-form](../skills/create-web-form/SKILL.md) | 建立強健且具備無障礙空間的網頁表單，並遵循 HTML 結構、CSS 樣式、JavaScript 互動、表單驗證及伺服器端處理的最佳實作。當被要求「建立表單」、「建構網頁表單」、「加入聯絡表單」、「製作註冊表單」或建構任何帶有資料處理的 HTML 表單時使用。涵蓋 PHP 與 Python 後端、MySQL 資料庫整合、REST API、XML 資料交換、無障礙空間 (ARIA) 以及漸進式網頁應用程式。 | `references/accessibility.md`<br />`references/aria-form-role.md`<br />`references/css-styling.md`<br />`references/form-basics.md`<br />`references/form-controls.md`<br />`references/form-data-handling.md`<br />`references/html-form-elements.md`<br />`references/html-form-example.md`<br />`references/hypertext-transfer-protocol.md`<br />`references/javascript.md`<br />`references/php-cookies.md`<br />`references/php-forms.md`<br />`references/php-json.md`<br />`references/php-mysql-database.md`<br />`references/progressive-web-app.md`<br />`references/python-as-web-framework.md`<br />`references/python-contact-form.md`<br />`references/python-flask-app.md`<br />`references/python-flask.md`<br />`references/security.md`<br />`references/styling-web-forms.md`<br />`references/web-api.md`<br />`references/web-performance.md`<br />`references/xml.md` |
| [csharp-async](../skills/csharp-async/SKILL.md) | 取得 C# 非同步程式設計最佳實踐 | 無 |
| [csharp-docs](../skills/csharp-docs/SKILL.md) | 確保 C# 類型使用 XML 註解進行文件化，並遵循文件化的最佳實踐。 | 無 |
| [csharp-mcp-server-generator](../skills/csharp-mcp-server-generator/SKILL.md) | 使用工具、提示和正確配置生成完整的 C# MCP 伺服器專案 | 無 |
| [csharp-mstest](../skills/csharp-mstest/SKILL.md) | 獲取 MSTest 3.x/4.x 單元測試的最佳實務，包含現代化斷言 API 和資料驅動測試 | 無 |
| [csharp-nunit](../skills/csharp-nunit/SKILL.md) | 取得 NUnit 單元測試最佳實踐，包括資料驅動測試 | 無 |
| [csharp-tunit](../skills/csharp-tunit/SKILL.md) | 取得 TUnit 單元測試最佳實踐，包括資料驅動測試 | 無 |
| [csharp-xunit](../skills/csharp-xunit/SKILL.md) | 取得 XUnit 單元測試最佳實踐，包括資料驅動測試 | 無 |
| [datanalysis-credit-risk](../skills/datanalysis-credit-risk/SKILL.md) | 適用於貸前建模的信用風險資料清洗和變數篩選管線。當處理需要品質評估、缺失值分析或建模前變數選擇的原始信用資料時使用。它涵蓋資料載入與格式化、異常期間篩選、缺失率計算、高缺失變數移除、低 IV 變數篩選、高 PSI 變數移除、Null Importance 去噪、高相關性變數移除，以及清洗報告產生。適用情境為信用風險資料清洗、變數篩選、貸前建模預處理。 | `references/analysis.py`<br />`references/func.py`<br />`scripts/example.py` |
| [dataverse-python-advanced-patterns](../skills/dataverse-python-advanced-patterns/SKILL.md) | 使用進階模式、錯誤處理和最佳化技術，為 Dataverse SDK 生成生產程式碼。 | 無 |
| [dataverse-python-production-code](../skills/dataverse-python-production-code/SKILL.md) | 使用 Dataverse SDK 產生具備錯誤處理、最佳化和最佳實務的生產就緒 Python 程式碼 | 無 |
| [dataverse-python-quickstart](../skills/dataverse-python-quickstart/SKILL.md) | 使用官方模式生成 Python SDK 設定 + CRUD + 批次 + 分頁程式碼片段。 | 無 |
| [dataverse-python-usecase-builder](../skills/dataverse-python-usecase-builder/SKILL.md) | 為特定的 Dataverse SDK 使用案例產生完整的解決方案，並提供架構建議 | 無 |
| [debian-linux-triage](../skills/debian-linux-triage/SKILL.md) | 使用 apt、systemd 和具備 AppArmor 意識的指南來分類並解決 Debian Linux 問題。 | 無 |
| [declarative-agents](../skills/declarative-agents/SKILL.md) | 適用於 Microsoft 365 Copilot 宣告式代理程式的完整開發套件，包含三個全面的工作流程 (基本、進階、驗證)、TypeSpec 支援和 Microsoft 365 Agents Toolkit 整合 | 無 |
| [devops-rollout-plan](../skills/devops-rollout-plan/SKILL.md) | 為基礎設施和應用程式變更產生包含預檢、逐步部署、驗證訊號、復原程序和溝通計畫的全面部署計畫 | 無 |
| [documentation-writer](../skills/documentation-writer/SKILL.md) | Diátaxis 文件專家。一位專業的技術寫作人員，專精於建立高品質的軟體文件，並遵循 Diátaxis 技術文件撰寫框架的原則和結構。 | 無 |
| [dotnet-best-practices](../skills/dotnet-best-practices/SKILL.md) | 確保 .NET/C# 程式碼符合本解決方案/專案的最佳實踐。 | 無 |
| [dotnet-design-pattern-review](../skills/dotnet-design-pattern-review/SKILL.md) | 檢查 C#/.NET 程式碼設計模式實作並提出改進建議。 | 無 |
| [dotnet-upgrade](../skills/dotnet-upgrade/SKILL.md) | 用於全面 .NET 框架升級分析和執行的即用型提示 | 無 |
| [editorconfig](../skills/editorconfig/SKILL.md) | 根據專案分析與使用者偏好，產生全面且最佳實踐導向的 .editorconfig 設定檔。 | 無 |
| [ef-core](../skills/ef-core/SKILL.md) | 取得 Entity Framework Core 最佳實踐 | 無 |
| [entra-agent-user](../skills/entra-agent-user/SKILL.md) | 從代理程式識別碼在 Microsoft Entra ID 中建立代理程式使用者，讓 AI 代理程式在 Microsoft 365 和 Azure 環境中能以具備使用者識別功能的數位員工身分運作。 | 無 |
| [excalidraw-diagram-generator](../skills/excalidraw-diagram-generator/SKILL.md) | 根據自然語言描述生成 Excalidraw 圖表。當被要求「建立圖表」、「製作流程圖」、「視覺化流程」、「繪製系統架構」、「建立心智圖」或「生成 Excalidraw 檔案」時使用。支援流程圖、關聯圖、心智圖和系統架構圖。輸出可以直接在 Excalidraw 中開啟的 .excalidraw JSON 檔案。 | `references/element-types.md`<br />`references/excalidraw-schema.md`<br />`scripts/.gitignore`<br />`scripts/README.md`<br />`scripts/add-arrow.py`<br />`scripts/add-icon-to-diagram.py`<br />`scripts/split-excalidraw-library.py`<br />`templates/business-flow-swimlane-template.excalidraw`<br />`templates/class-diagram-template.excalidraw`<br />`templates/data-flow-diagram-template.excalidraw`<br />`templates/er-diagram-template.excalidraw`<br />`templates/flowchart-template.excalidraw`<br />`templates/mindmap-template.excalidraw`<br />`templates/relationship-template.excalidraw`<br />`templates/sequence-diagram-template.excalidraw` |
| [fabric-lakehouse](../skills/fabric-lakehouse/SKILL.md) | 使用此技能獲取關於 Fabric Lakehouse 及其功能的背景資訊，適用於軟體系統和 AI 驅動的功能。它提供 Lakehouse 資料元件的說明、使用結構描述和捷徑進行組織、存取控制以及程式碼範例。此技能支援使用者使用最佳實作來設計、建構和最佳化 Lakehouse 解決方案。 | `references/getdata.md`<br />`references/pyspark.md` |
| [fedora-linux-triage](../skills/fedora-linux-triage/SKILL.md) | 使用 dnf、systemd 和具備 SELinux 意識的指南來分類並解決 Fedora 問題。 | 無 |
| [finalize-agent-prompt](../skills/finalize-agent-prompt/SKILL.md) | 使用 AI 代理程式的角色來潤飾提示，以供終端使用者使用。 | 無 |
| [finnish-humanizer](../skills/finnish-humanizer/SKILL.md) | 偵測並移除芬蘭語文字中由 AI 產生的標記，使其聽起來像是芬蘭母語人士編寫的。當被要求對芬蘭語文字進行「人性化」、「自然化」或「移除 AI 感」時，或是在編輯包含芬蘭語內容的 .md/.txt 檔案時使用。可識別 26 種模式（12 種芬蘭語特定模式 + 14 種通用模式）和 4 種風格標記。 | `references/patterns.md` |
| [first-ask](../skills/first-ask/SKILL.md) | 互動式、由輸入工具驅動的任務細化工作流程：在執行任務之前詢問範圍、可交付成果、約束；需要 Joyride 擴展。 | 無 |
| [flowstudio-power-automate-build](../skills/flowstudio-power-automate-build/SKILL.md) | 使用 FlowStudio MCP 伺服器建構、架構並部署 Power Automate 雲端流程。當被要求執行下列工作時載入此技能：建立流程、建構新流程、部署流程定義、架構 Power Automate 工作流程、建構流程 JSON、更新現有流程的動作、修補流程定義、將動作加入流程、接通連線，或從頭開始產生工作流程定義。需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app | `references/action-patterns-connectors.md`<br />`references/action-patterns-core.md`<br />`references/action-patterns-data.md`<br />`references/build-patterns.md`<br />`references/flow-schema.md`<br />`references/trigger-types.md` |
| [flowstudio-power-automate-debug](../skills/flowstudio-power-automate-debug/SKILL.md) | 使用 FlowStudio MCP 伺服器對失敗的 Power Automate 雲端流程進行偵錯。當被要求執行下列工作時載入此技能：流程偵錯、調查失敗的執行記錄、了解流程失敗原因、檢視動作輸出、尋找流程錯誤的根本原因、修正損壞的 Power Automate 流程、診斷逾時、追蹤 DynamicOperationRequestFailure、檢查連接器驗證錯誤、讀取執行記錄中的錯誤詳細資料，或排除運算式故障。需要 FlowStudio MCP 訂閱 — 請參閱 https://mcp.flowstudio.app | `references/common-errors.md`<br />`references/debug-workflow.md` |
| [flowstudio-power-automate-mcp](../skills/flowstudio-power-automate-mcp/SKILL.md) | 透過 FlowStudio MCP 伺服器連接並操作 Power Automate 雲端流程。 當需要執行以下任務時使用：列出流程、讀取流程定義、檢查執行歷程記錄、檢查 動作輸出、重新提交執行、取消執行中的流程、檢視連線、取得 觸發程序 URL、驗證定義、監視流程健康狀況，或任何需要 透過 MCP 工具與 Power Automate API 溝通的任務。也可用於 Power Platform 環境探索與連線管理。需要 FlowStudio MCP 訂閱或相容的伺服器 — 請參閱 https://mcp.flowstudio.app | `references/MCP-BOOTSTRAP.md`<br />`references/action-types.md`<br />`references/connection-references.md`<br />`references/tool-reference.md` |
| [fluentui-blazor](../skills/fluentui-blazor/SKILL.md) | 在 Blazor 應用程式中使用 Microsoft Fluent UI Blazor 元件庫 (Microsoft.FluentUI.AspNetCore.Components NuGet 套件) 的指南。 當使用者正在使用 Fluent UI 元件建構 Blazor 應用程式、設定該函式庫、 使用 FluentUI 元件（如 FluentButton、FluentDataGrid、FluentDialog、 FluentToast、FluentNavMenu、FluentTextField、FluentSelect、 FluentAutocomplete、FluentDesignTheme）或任何以 "Fluent" 為字首的元件時使用。 也可用於疑難排解缺少的提供者 (providers)、JS 互通 (interop) 問題或佈景主題設定。 | `references/DATAGRID.md`<br />`references/LAYOUT-AND-NAVIGATION.md`<br />`references/SETUP.md`<br />`references/THEMING.md` |
| [folder-structure-blueprint-generator](../skills/folder-structure-blueprint-generator/SKILL.md) | 技術無關的專案資料夾結構分析與文件產生器，能自動偵測專案型態（.NET、Java、React、Angular、Python、Node.js、Flutter），產生詳細藍圖，包含視覺化選項、命名慣例、檔案放置模式與擴充範本，協助多種技術棧維持一致的程式碼組織。 | 無 |
| [game-engine](../skills/game-engine/SKILL.md) | 使用 HTML5、Canvas、WebGL 和 JavaScript 建構網頁遊戲引擎和遊戲的專家技能。當被要求建立遊戲、建構遊戲引擎、實作遊戲物理、處理碰撞偵測、設定遊戲迴圈、管理精靈 (sprites)、增加遊戲控制或處理 2D/3D 轉譯時使用。涵蓋平台跳躍遊戲、打磚塊風格遊戲、迷宮遊戲、圖塊地圖 (tilemaps)、音訊、透過 WebRTC 的多人遊戲以及遊戲發行的技術。 | `assets/2d-maze-game.md`<br />`assets/2d-platform-game.md`<br />`assets/gameBase-template-repo.md`<br />`assets/paddle-game-template.md`<br />`assets/simple-2d-engine.md`<br />`references/3d-web-games.md`<br />`references/algorithms.md`<br />`references/basics.md`<br />`references/game-control-mechanisms.md`<br />`references/game-engine-core-principles.md`<br />`references/game-publishing.md`<br />`references/techniques.md`<br />`references/terminology.md`<br />`references/web-apis.md` |
| [gen-specs-as-issues](../skills/gen-specs-as-issues/SKILL.md) | 本流程協助你系統性地識別缺漏功能、排序優先級，並產生詳細規格以利實作。 | 無 |
| [generate-custom-instructions-from-codebase](../skills/generate-custom-instructions-from-codebase/SKILL.md) | GitHub Copilot 的遷移與程式碼演進指令產生器。分析兩個專案版本（分支、提交或發行版）之間的差異，產生精確指令，協助 Copilot 在技術遷移、大型重構或框架升級時維持一致性。 | 無 |
| [gh-cli](../skills/gh-cli/SKILL.md) | GitHub CLI (gh) 關於儲存庫、議題、提取請求、Actions、專案、發佈 (releases)、Gists、Codespaces、組織、擴充功能以及所有透過命令列進行之 GitHub 操作的全面參考手冊。 | 無 |
| [git-commit](../skills/git-commit/SKILL.md) | 使用約定式提交（Conventional Commit）訊息分析、智慧暫存和訊息生成來執行 git commit。當使用者要求提交變更、建立 git commit 或提及「/commit」時使用。支援：(1) 從變更中自動偵測類型和範圍，(2) 從 diff 生成約定式提交訊息，(3) 帶有選用類型/範圍/描述覆寫的互動式提交，(4) 用於邏輯分組的智慧檔案暫存 | 無 |
| [git-flow-branch-creator](../skills/git-flow-branch-creator/SKILL.md) | 智慧型 Git Flow 分支建立工具，分析 git 狀態與差異，依 nvie Git Flow 分支模型自動建立語意分支。 | 無 |
| [github-copilot-starter](../skills/github-copilot-starter/SKILL.md) | 根據技術堆疊為新專案設定完整的 GitHub Copilot 配置 | 無 |
| [github-issues](../skills/github-issues/SKILL.md) | 使用 MCP 工具建立、更新與管理 GitHub 議題 (Issues)。當使用者想要建立錯誤報告、功能請求或工作議題、更新現有議題、加入標籤/指派者/里程碑、設定議題欄位 (日期、優先級、自定義欄位)、設定議題類型或管理議題工作流程時，請使用此技能。適用於「建立議題」、「提報錯誤」、「請求功能」、「更新議題 X」、「設定優先級」、「設定開始日期」或任何 GitHub 議題管理任務等請求。 | `references/dependencies.md`<br />`references/images.md`<br />`references/issue-fields.md`<br />`references/issue-types.md`<br />`references/projects.md`<br />`references/search.md`<br />`references/sub-issues.md`<br />`references/templates.md` |
| [go-mcp-server-generator](../skills/go-mcp-server-generator/SKILL.md) | 使用官方的 github.com/modelcontextprotocol/go-sdk 建立一個具有適當結構、依賴項和實作的完整 Go MCP 伺服器專案。 | 無 |
| [image-manipulation-image-magick](../skills/image-manipulation-image-magick/SKILL.md) | 使用 ImageMagick 處理和操作影像。支援調整大小、格式轉換、批次處理以及擷取影像 Metadata。適用於處理影像、建立縮圖、調整桌布大小或執行批次影像操作。 | 無 |
| [import-infrastructure-as-code](../skills/import-infrastructure-as-code/SKILL.md) | 使用 Azure CLI 探索功能與 Azure 驗證模組 (Azure Verified Modules, AVM)，將現有的 Azure 資源匯入 Terraform。當被要求反向工程現有的 Azure 基礎設施、從現有的訂閱/資源群組/資源識別碼產生基礎設施即程式碼 (IaC)、對應相依性、從下載的模組原始碼衍生精確的匯入位址、防止設定漂移，以及產生可供驗證與規劃且基於 AVM 的 Terraform 檔案（適用於任何 Azure 資源型別）時使用。 | 無 |
| [java-add-graalvm-native-image-support](../skills/java-add-graalvm-native-image-support/SKILL.md) | GraalVM Native Image 專家：為 Java 應用程式新增 native image 支援，建置專案、分析建置錯誤、套用修正，並依據 Oracle 最佳實務反覆處理直到成功編譯。 | 無 |
| [java-docs](../skills/java-docs/SKILL.md) | 確保 Java 型別皆有 Javadoc 註解，並遵循最佳文件化實踐。 | 無 |
| [java-junit](../skills/java-junit/SKILL.md) | 取得 JUnit 5 單元測試最佳實踐，包括資料驅動測試 | 無 |
| [java-mcp-server-generator](../skills/java-mcp-server-generator/SKILL.md) | 使用官方 MCP Java SDK、反應式串流和可選的 Spring Boot 整合，在 Java 中建立一個完整的 Model Context Protocol 伺服器專案。 | 無 |
| [java-refactoring-extract-method](../skills/java-refactoring-extract-method/SKILL.md) | 使用 Java 語言中的提取方法進行重構 | 無 |
| [java-refactoring-remove-parameter](../skills/java-refactoring-remove-parameter/SKILL.md) | 使用 Java 語言中的移除參數進行重構 | 無 |
| [java-springboot](../skills/java-springboot/SKILL.md) | 取得 Spring Boot 應用程式開發最佳實踐。 | 無 |
| [javascript-typescript-jest](../skills/javascript-typescript-jest/SKILL.md) | 使用 Jest 撰寫 JavaScript/TypeScript 測試的最佳實踐，包括模擬策略、測試結構與常見模式。 | 無 |
| [kotlin-mcp-server-generator](../skills/kotlin-mcp-server-generator/SKILL.md) | 使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫，產生一個具有適當結構、依賴項和實作的完整 Kotlin MCP 伺服器專案。 | 無 |
| [kotlin-springboot](../skills/kotlin-springboot/SKILL.md) | 取得使用 Spring Boot 與 Kotlin 開發應用程式的最佳實踐。 | 無 |
| [legacy-circuit-mockups](../skills/legacy-circuit-mockups/SKILL.md) | 使用 HTML5 Canvas 繪圖技術產生麵包板電路模擬圖與視覺圖表。當被要求建立電路佈局、視覺化電子元件放置、繪製麵包板圖表、模擬 6502 建置、產生復古電腦電路圖或設計老式電子專案時使用。支援 555 計時器、W65C02S 微處理器、28C256 EEPROM、W65C22 VIA 晶片、7400 系列邏輯閘、LED、電阻、電容、開關、按鈕、晶體及導線。 | `references/28256-eeprom.md`<br />`references/555.md`<br />`references/6502.md`<br />`references/6522.md`<br />`references/6C62256.md`<br />`references/7400-series.md`<br />`references/assembly-compiler.md`<br />`references/assembly-language.md`<br />`references/basic-electronic-components.md`<br />`references/breadboard.md`<br />`references/common-breadboard-components.md`<br />`references/connecting-electronic-components.md`<br />`references/emulator-28256-eeprom.md`<br />`references/emulator-6502.md`<br />`references/emulator-6522.md`<br />`references/emulator-6C62256.md`<br />`references/emulator-lcd.md`<br />`references/lcd.md`<br />`references/minipro.md`<br />`references/t48eeprom-programmer.md` |
| [make-repo-contribution](../skills/make-repo-contribution/SKILL.md) | 對程式碼的所有變更都必須遵循存放庫中記載的指引。在提交任何問題、建立分支、產生提交或建立提取要求 (PR) 之前，必須進行搜尋以確保遵循正確的步驟。每當被要求建立問題、提交訊息、推送程式碼或建立 PR 時，請使用此技能以確保一切執行正確。 | `assets/issue-template.md`<br />`assets/pr-template.md` |
| [make-skill-template](../skills/make-skill-template/SKILL.md) | 從提示語或透過複製此範本來建立新的 GitHub Copilot Agent Skills。當被要求「建立技能」、「製作新技能」、「建構技能架構」或使用隨附資源建構專門的 AI 能力時使用。產生具備正確 Frontmatter、目錄結構以及選用的 scripts/references/assets 資料夾的 SKILL.md 檔案。 | 無 |
| [markdown-to-html](../skills/markdown-to-html/SKILL.md) | 將 Markdown 檔案轉換為 HTML，類似於 `marked.js`、`pandoc`、`gomarkdown/markdown` 或類似工具；或是編寫自定義指令稿來將 Markdown 轉換為 HTML，以及/或者在 `jekyll/jekyll`、`gohugoio/hugo` 或類似的使用 Markdown 文件並將其轉換為 HTML 輸出的網頁模板系統上工作。當被要求「將 markdown 轉換為 html」、「將 md 轉換為 html」、「渲染 markdown」、「從 markdown 產生 html」，或者在處理 .md 檔案以及/或者將 markdown 轉換為 HTML 輸出的網頁模板系統時使用。支援 GFM、CommonMark 和標準 Markdown 版本的 CLI 和 Node.js 工作流。 | `references/basic-markdown-to-html.md`<br />`references/basic-markdown.md`<br />`references/code-blocks-to-html.md`<br />`references/code-blocks.md`<br />`references/collapsed-sections-to-html.md`<br />`references/collapsed-sections.md`<br />`references/gomarkdown.md`<br />`references/hugo.md`<br />`references/jekyll.md`<br />`references/marked.md`<br />`references/pandoc.md`<br />`references/tables-to-html.md`<br />`references/tables.md`<br />`references/writing-mathematical-expressions-to-html.md`<br />`references/writing-mathematical-expressions.md` |
| [mcp-cli](../skills/mcp-cli/SKILL.md) | 透過命令列介面（CLI）與 MCP (Model Context Protocol) 伺服器互動。當你需要透過 MCP 伺服器與外部工具、API 或資料源進行互動，列出可用的 MCP 伺服器/工具，或從命令列呼叫 MCP 工具時使用。 | 無 |
| [mcp-configure](../skills/mcp-configure/SKILL.md) | 為 GitHub Copilot 設定搭配您的 Dataverse 環境的 MCP 伺服器。 | 無 |
| [mcp-copilot-studio-server-generator](../skills/mcp-copilot-studio-server-generator/SKILL.md) | 建立一個完整的 MCP 伺服器實作，針對 Copilot Studio 整合進行優化，並具有適當的綱要約束和可串流 HTTP 支援 | 無 |
| [mcp-create-adaptive-cards](../skills/mcp-create-adaptive-cards/SKILL.md) | 為基於 MCP 的 API 外掛程式新增調適型卡片回應範本，以便在 Microsoft 365 Copilot 中視覺化呈現資料 | 無 |
| [mcp-create-declarative-agent](../skills/mcp-create-declarative-agent/SKILL.md) | 透過整合具有驗證、工具選取和組態的 MCP 伺服器，為 Microsoft 365 Copilot 建立宣告式代理程式 | 無 |
| [mcp-deploy-manage-agents](../skills/mcp-deploy-manage-agents/SKILL.md) | 在 Microsoft 365 系統管理中心部署和管理基於 MCP 的宣告式代理程式，包含治理、指派和組織發佈 | 無 |
| [meeting-minutes](../skills/meeting-minutes/SKILL.md) | 為內部會議生成簡潔、具備行動力的會議紀錄。包含 Metadata、出席者、議程、決策、行動項目（負責人 + 截止日期）以及後續步驟。 | 無 |
| [memory-merger](../skills/memory-merger/SKILL.md) | 將領域記憶檔案中的成熟經驗合併到其指令檔案中。語法：`/memory-merger >domain [scope]`，其中 scope 為 `global` (預設)、`user`、`workspace` 或 `ws`。 | 無 |
| [mentoring-juniors](../skills/mentoring-juniors/SKILL.md) | 針對初級開發者與 AI 新手的蘇格拉底式引導。透過提問進行引導，絕不直接給出答案。觸發詞： "help me understand", "explain this code", "I'm stuck", "Im stuck", "I'm confused", "Im confused", "I don't understand", "I dont understand", "can you teach me", "teach me", "mentor me", "guide me", "what does this error mean", "why doesn't this work", "why does not this work", "I'm a beginner", "Im a beginner", "I'm learning", "Im learning", "I'm new to this", "Im new to this", "walk me through", "how does this work", "what's wrong with my code", "what's wrong", "can you break this down", "ELI5", "step by step", "where do I start", "what am I missing", "newbie here", "junior dev", "first time using", "how do I", "what is", "is this right", "not sure", "need help", "struggling", "show me", "help me debug", "best practice", "too complex", "overwhelmed", "lost", "debug this", "/socratic", "/hint", "/concept", "/pseudocode"。漸進式線索系統、教學技巧與成功指標。 | 無 |
| [microsoft-code-reference](../skills/microsoft-code-reference/SKILL.md) | 查詢 Microsoft API 參考、尋找可執行的程式碼範例，並驗證 SDK 程式碼是否正確。在處理 Azure SDK、.NET 函式庫或 Microsoft API 時使用——用以尋找正確的方法、檢查參數、取得可執行的範例或疑難排解錯誤。透過查詢官方文件來捕捉虛構的方法、錯誤的簽章以及淘汰的模式。 | 無 |
| [microsoft-docs](../skills/microsoft-docs/SKILL.md) | 查詢 Microsoft 官方文件，以尋找 Azure、.NET、Agent Framework、Aspire、VS Code、GitHub 等各方面的概念、教學和程式碼範例。預設使用 Microsoft Learn MCP，對於 learn.microsoft.com 以外的內容則使用 Context7 和 Aspire MCP。 | 無 |
| [microsoft-skill-creator](../skills/microsoft-skill-creator/SKILL.md) | 使用 Learn MCP 工具為 Microsoft 技術建立代理程式技能。當使用者想要建立一個技能，用來教導代理程式關於任何 Microsoft 技術、函式庫、架構或服務 (Azure, .NET, M365, VS Code, Bicep 等) 時使用。深入調查主題，然後產生一個混合技能，將核心知識儲存在本機，同時實現動態的深度調查。 | `references/skill-templates.md` |
| [mkdocs-translations](../skills/mkdocs-translations/SKILL.md) | 產生 mkdocs 文件堆疊的語言翻譯。 | 無 |
| [model-recommendation](../skills/model-recommendation/SKILL.md) | 分析聊天模式或提示檔案，並根據任務複雜度、所需功能和成本效益推薦最佳 AI 模型 | 無 |
| [msstore-cli](../skills/msstore-cli/SKILL.md) | 用於將 Windows 應用程式發佈到 Microsoft Store 的 Microsoft Store 開發者 CLI (msstore)。當被要求設定 Store 認證、列出 Store 應用程式、檢查提交狀態、發佈提交、管理套件發行、為 Store 發佈設定 CI/CD 或與小組中心 (Partner Center) 整合時使用。支援 Windows App SDK/WinUI、UWP、.NET MAUI、Flutter、Electron、React Native 和 PWA 應用程式。 | 無 |
| [multi-stage-dockerfile](../skills/multi-stage-dockerfile/SKILL.md) | 為任意語言或框架建立最佳化的多階段 Dockerfile | 無 |
| [my-issues](../skills/my-issues/SKILL.md) | 列出目前儲存庫中屬於我的 issue | 無 |
| [my-pull-requests](../skills/my-pull-requests/SKILL.md) | 列出目前儲存庫中屬於我的 pull request | 無 |
| [nano-banana-pro-openrouter](../skills/nano-banana-pro-openrouter/SKILL.md) | 透過 OpenRouter 使用 Gemini 3 Pro Image 模型產生或編輯影像。用於純提示詞影像產生、影像編輯和多影像合成；支援 1K/2K/4K 輸出。 | `assets/SYSTEM_TEMPLATE`<br />`scripts/generate_image.py` |
| [next-intl-add-language](../skills/next-intl-add-language/SKILL.md) | 為 Next.js + next-intl 應用程式新增語言 | 無 |
| [noob-mode](../skills/noob-mode/SKILL.md) | 針對非技術背景 Copilot CLI 使用者的淺白用語翻譯層。將每個核准提示、錯誤訊息與技術輸出翻譯成清晰、無術語的英文 (在此為繁體中文)，並附帶顏色標示的風險指標。 | `references/examples.md`<br />`references/glossary.md` |
| [nuget-manager](../skills/nuget-manager/SKILL.md) | 管理 .NET 專案/解決方案中的 NuGet 套件。當要新增、移除或更新 NuGet 套件版本時，請使用此技能。它強制使用 `dotnet` CLI 進行套件管理，並規定僅在更新版本時才能直接編輯檔案，並提供嚴格的操作程序。 | 無 |
| [openapi-to-application-code](../skills/openapi-to-application-code/SKILL.md) | 從 OpenAPI 規格產生完整且可用於生產環境的應用程式 | 無 |
| [pdftk-server](../skills/pdftk-server/SKILL.md) | 使用命令列工具 pdftk (PDFtk Server) 處理 PDF 檔案的技能。當被要求合併 PDF、分割 PDF、旋轉頁面、加密或解密 PDF、填寫 PDF 表單、套用浮水印、圖章重疊、擷取中繼資料、將文件拆分為頁面、修復損毀的 PDF、附加或擷取檔案，或從命令列執行任何 PDF 操作時使用。 | `references/download.md`<br />`references/pdftk-cli-examples.md`<br />`references/pdftk-man-page.md`<br />`references/pdftk-server-license.md`<br />`references/third-party-materials.md` |
| [penpot-uiux-design](../skills/penpot-uiux-design/SKILL.md) | 使用 MCP 工具在 Penpot 中建立專業 UI/UX 設計的全面指南。當執行以下操作時使用此技能：(1) 為網頁、行動裝置或桌面應用程式建立新的 UI/UX 設計，(2) 使用元件和權杖 (Tokens) 建構設計系統，(3) 設計儀表板、表單、導覽或登陸頁面，(4) 套用無障礙標準和最佳實踐，(5) 遵循平台指南 (iOS, Android, Material Design)，(6) 審查或改進現有的 Penpot 設計以提高可用性。觸發詞：「設計 UI」、「建立介面」、「建構佈局」、「設計儀表板」、「建立表單」、「設計登陸頁面」、「使其具備無障礙性」、「設計系統」、「元件函式庫」。 | `references/accessibility.md`<br />`references/component-patterns.md`<br />`references/platform-guidelines.md`<br />`references/setup-troubleshooting.md` |
| [php-mcp-server-generator](../skills/php-mcp-server-generator/SKILL.md) | 使用官方 PHP SDK 產生一個完整的 PHP 模型內容協定伺服器專案，包含工具、資源、提示和測試 | 無 |
| [plantuml-ascii](../skills/plantuml-ascii/SKILL.md) | 使用 PlantUML 文字模式產生 ASCII 藝術圖表。當使用者要求建立 ASCII 圖表、基於文字的圖表、對終端機友善的圖表，或提及 plantuml ascii、文字圖表、ascii 藝術圖表時使用。支援：將 PlantUML 圖表轉換為 ASCII 藝術、建立 ASCII 格式的時序圖、類別圖、流程圖，以及使用 -utxt 參數產生強化 Unicode 的 ASCII 藝術。 | 無 |
| [playwright-automation-fill-in-form](../skills/playwright-automation-fill-in-form/SKILL.md) | 使用 Playwright MCP 自動填寫表單 | 無 |
| [playwright-explore-website](../skills/playwright-explore-website/SKILL.md) | 使用 Playwright MCP 進行網站探索測試 | 無 |
| [playwright-generate-test](../skills/playwright-generate-test/SKILL.md) | 根據情境使用 Playwright MCP 產生 Playwright 測試 | 無 |
| [polyglot-test-agent](../skills/polyglot-test-agent/SKILL.md) | 使用多代理程式管線為任何程式語言產生全面的、可執行的單元測試。當被要求產生測試、編寫單元測試、改善測試涵蓋率、增加測試涵蓋率、建立測試檔案或測試程式碼庫時使用。支援 C#、TypeScript、JavaScript、Python、Go、Rust、Java 等。協調研究、規劃與實作階段，以產出符合專案慣例且可編譯、可通過的測試。 | `unit-test-generation.prompt.md` |
| [postgresql-code-review](../skills/postgresql-code-review/SKILL.md) | PostgreSQL 專屬程式碼審查助手，聚焦 PostgreSQL 最佳實踐、反模式與獨特品質標準。涵蓋 JSONB 操作、陣列用法、自訂型別、資料表設計、函式最佳化，以及 PostgreSQL 專屬安全功能如 Row Level Security (RLS)。 | 無 |
| [postgresql-optimization](../skills/postgresql-optimization/SKILL.md) | 專為 PostgreSQL 設計的開發助理，聚焦於 PostgreSQL 獨有功能、進階資料型別，以及 PostgreSQL 專屬能力。涵蓋 JSONB 操作、陣列型別、自訂型別、範圍/幾何型別、全文檢索、視窗函式，以及 PostgreSQL 擴充套件生態系統。 | 無 |
| [power-apps-code-app-scaffold](../skills/power-apps-code-app-scaffold/SKILL.md) | 使用 PAC CLI 設定、SDK 整合和連接器組態，建立一個完整的 Power Apps Code App 專案 | 無 |
| [power-bi-dax-optimization](../skills/power-bi-dax-optimization/SKILL.md) | 用於改進 DAX 計算的效能、可讀性和可維護性的綜合性 Power BI DAX 公式最佳化提示。 | 無 |
| [power-bi-model-design-review](../skills/power-bi-model-design-review/SKILL.md) | 用於評估模型架構、關係和最佳化機會的綜合性 Power BI 資料模型設計檢閱提示。 | 無 |
| [power-bi-performance-troubleshooting](../skills/power-bi-performance-troubleshooting/SKILL.md) | 系統化的 Power BI 效能疑難排解提示，用於識別、診斷和解決 Power BI 模型、報表和查詢中的效能問題。 | 無 |
| [power-bi-report-design-consultation](../skills/power-bi-report-design-consultation/SKILL.md) | Power BI 報表視覺化設計提示，用於建立有效、使用者友善且易於存取的報表，並具有最佳圖表選擇和版面配置設計。 | 無 |
| [power-platform-mcp-connector-suite](../skills/power-platform-mcp-connector-suite/SKILL.md) | 產生完整的 Power Platform 自訂連接器，並整合 MCP 以用於 Copilot Studio - 包括架構產生、疑難排解和驗證 | 無 |
| [powerbi-modeling](../skills/powerbi-modeling/SKILL.md) | 用於建構最佳化資料模型的 Power BI 語義模型建立助手。當處理 Power BI 語義模型、建立量值、設計星狀結構描述、組態關聯、實作 RLS 或最佳化模型效能時使用。針對 DAX 計算、資料表關聯、維度/事實資料表設計、命名慣例、模型文件、基數、交叉篩選方向、計算群組以及資料模型最佳實踐等查詢觸發。在提供建議之前，始終先使用 power-bi-modeling MCP 工具連接到作用中的模型，以了解資料結構。 | `references/MEASURES-DAX.md`<br />`references/PERFORMANCE.md`<br />`references/RELATIONSHIPS.md`<br />`references/RLS.md`<br />`references/STAR-SCHEMA.md` |
| [prd](../skills/prd/SKILL.md) | 為軟體系統和人工智慧（AI）驅動的功能產出高品質的產品需求文件 (PRD)。包含摘要、使用者故事、技術規格和風險分析。 | 無 |
| [project-workflow-analysis-blueprint-generator](../skills/project-workflow-analysis-blueprint-generator/SKILL.md) | 全面且技術中立的提示產生器，用於記錄端到端應用程式工作流程。可自動偵測專案架構模式、技術堆疊與資料流模式，產生詳細的實作藍圖，涵蓋進入點、服務層、資料存取、錯誤處理與測試方法，支援多種技術如 .NET、Java/Spring、React 及微服務架構。 | 無 |
| [prompt-builder](../skills/prompt-builder/SKILL.md) | 引導使用者建立高品質 GitHub Copilot 提示，包含正確結構、工具與最佳實踐。 | 無 |
| [pytest-coverage](../skills/pytest-coverage/SKILL.md) | 執行 pytest 測試並產生覆蓋率報告，找出缺少覆蓋率的程式碼行，並將覆蓋率提高到 100%。 | 無 |
| [python-mcp-server-generator](../skills/python-mcp-server-generator/SKILL.md) | 使用工具、資源和適當的配置，在 Python 中建立一個完整的 MCP 伺服器專案 | 無 |
| [quasi-coder](../skills/quasi-coder/SKILL.md) | 專家級 10x 工程師技能，用於從簡寫、類程式碼 (quasi-code) 與自然語言描述中解釋並實作程式碼。當協作者提供不完整的程式碼片段、虛擬程式碼 (pseudo-code) 或包含潛在打錯字或不正確術語的描述時使用。擅長將非技術或半技術描述轉換為生產等級品質的程式碼。 | 無 |
| [readme-blueprint-generator](../skills/readme-blueprint-generator/SKILL.md) | 智慧型 README.md 產生提示，分析專案文件結構並建立完整的儲存庫說明文件。會掃描 .github/copilot 目錄下的檔案及 copilot-instructions.md，萃取專案資訊、技術堆疊、架構、開發流程、程式標準與測試方法，並產生結構良好、格式正確、具交叉參照且以開發者為主的 Markdown 文件。 | 無 |
| [refactor](../skills/refactor/SKILL.md) | 進行精確的程式碼重構，在不改變行為的情況下提高可維護性。涵蓋提取函式、重新命名變數、拆解龐大函式（god functions）、提高型別安全性、消除程式碼異味以及應用設計模式。比 repo-rebuilder 的影響較小；用於漸進式改進。 | 無 |
| [refactor-method-complexity-reduce](../skills/refactor-method-complexity-reduce/SKILL.md) | 重構給定的方法 `${input:methodName}`，透過擷取輔助方法將其認知複雜度 (cognitive complexity) 降低至 `${input:complexityThreshold}` 或以下。 | 無 |
| [refactor-plan](../skills/refactor-plan/SKILL.md) | 規劃具有適當順序與回滾步驟的多檔案重構 | 無 |
| [remember](../skills/remember/SKILL.md) | 一個微提示，提醒代理它是一個互動式程式設計師。當 Copilot 可以存取 REPL 時 (可能透過 Backseat Driver)，在 Clojure 中效果很好。適用於任何具有代理可以使用的即時 REPL 的系統。根據您的工作流程和/或工作區中的任何特定提醒調整提示。 | 無 |
| [remember-interactive-programming](../skills/remember-interactive-programming/SKILL.md) | 一個微提示，提醒代理它是一個互動式程式設計師。當 Copilot 可以存取 REPL 時 (可能透過 Backseat Driver)，在 Clojure 中效果很好。適用於任何具有代理可以使用的即時 REPL 的系統。根據您的工作流程和/或工作區中的任何特定提醒調整提示。 | 無 |
| [repo-story-time](../skills/repo-story-time/SKILL.md) | 根據提交紀錄產生完整的儲存庫摘要與敘事故事 | 無 |
| [review-and-refactor](../skills/review-and-refactor/SKILL.md) | 依照定義指令審查並重構專案程式碼 | 無 |
| [ruby-mcp-server-generator](../skills/ruby-mcp-server-generator/SKILL.md) | 使用官方 MCP Ruby SDK gem 在 Ruby 中建立一個完整的模型上下文協定伺服器專案。 | 無 |
| [rust-mcp-server-generator](../skills/rust-mcp-server-generator/SKILL.md) | 使用官方 rmcp SDK 產生一個完整的 Rust 模型上下文協定伺服器專案，包含工具、提示、資源和測試 | 無 |
| [scoutqa-test](../skills/scoutqa-test/SKILL.md) | 當使用者要求「測試此網站」、「執行探索性測試」、「檢查協助工具問題」、「驗證登入流程是否正常」、「尋找此頁面上的錯誤」或要求自動化 QA 測試時，應使用此技能。針對網頁應用程式測試情境觸發，包括使用 ScoutQA CLI 的煙霧測試、協助工具稽核、電子商務流程和使用者流程驗證。重要提示：在實作網頁應用程式功能後，請主動使用此技能來驗證它們是否正常運作 - 不要等待使用者要求測試。 | 無 |
| [shuffle-json-data](../skills/shuffle-json-data/SKILL.md) | 透過在隨機化項目之前驗證結構描述一致性，安全地隨機排列重複的 JSON 物件。 | 無 |
| [snowflake-semanticview](../skills/snowflake-semanticview/SKILL.md) | 使用 Snowflake CLI (snow) 建立、修改及驗證 Snowflake 語義檢視表 (semantic views)。當被要求使用 CREATE/ALTER SEMANTIC VIEW 建構語義檢視表/語義層定義或進行疑難排解、透過 CLI 向 Snowflake 驗證語義檢視表 DDL，或引導進行 Snowflake CLI 安裝與連線設定時使用。 | 無 |
| [sponsor-finder](../skills/sponsor-finder/SKILL.md) | 使用 GitHub CLI 與 REST API 尋找 GitHub 存放庫的相依項目中哪些可以透過 GitHub Sponsors 進行贊助。使用 deps.dev API 跨 npm、PyPI、Cargo、Go、RubyGems、Maven 與 NuGet 進行相依性解析。檢查 npm funding 中繼資料、FUNDING.yml 檔案以及網頁搜尋。驗證每個連結。顯示直接與遞移相依項目以及 OSSF Scorecard 專案健康資料。使用 /sponsor 後跟 GitHub 擁有者/存放庫（例如 "/sponsor expressjs/express"）進行呼叫。 | 無 |
| [sql-code-review](../skills/sql-code-review/SKILL.md) | 通用 SQL 程式碼審查助手，針對所有 SQL 資料庫（MySQL、PostgreSQL、SQL Server、Oracle）進行全面安全性、可維護性與程式碼品質分析。重點檢查 SQL 注入防護、存取控制、程式標準與反模式偵測。可搭配 SQL 優化 prompt，完整涵蓋開發流程。 | 無 |
| [sql-optimization](../skills/sql-optimization/SKILL.md) | 通用 SQL 效能最佳化助理，針對所有 SQL 資料庫（MySQL、PostgreSQL、SQL Server、Oracle）提供查詢調校、索引策略與資料庫效能分析。涵蓋執行計畫分析、分頁最佳化、批次操作與效能監控指引。 | 無 |
| [structured-autonomy-generate](../skills/structured-autonomy-generate/SKILL.md) | 結構化自主實作生成器提示 | 無 |
| [structured-autonomy-implement](../skills/structured-autonomy-implement/SKILL.md) | 結構化自主實作提示 | 無 |
| [structured-autonomy-plan](../skills/structured-autonomy-plan/SKILL.md) | 結構化自主規劃提示 | 無 |
| [suggest-awesome-github-copilot-agents](../skills/suggest-awesome-github-copilot-agents/SKILL.md) | 根據目前的存放庫內容和對話歷史記錄，從 awesome-copilot 存放庫中建議相關的 GitHub Copilot 自定義 Agent 檔案，避免與此存放庫中現有的自定義 Agent 重複，並識別需要更新的過時 Agent。 | 無 |
| [suggest-awesome-github-copilot-instructions](../skills/suggest-awesome-github-copilot-instructions/SKILL.md) | 根據目前的儲存庫內容和對話歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot instruction 檔案，避免與此儲存庫中現有的 instruction 重複，並識別需要更新的過時 instruction。 | 無 |
| [suggest-awesome-github-copilot-skills](../skills/suggest-awesome-github-copilot-skills/SKILL.md) | 根據目前的存放庫內容與對話歷史，從 awesome-copilot 存放庫建議相關的 GitHub Copilot 技能，同時避免與此存放庫中現有的技能重複，並識別出需要更新的過時技能。 | 無 |
| [swift-mcp-server-generator](../skills/swift-mcp-server-generator/SKILL.md) | 使用官方 MCP Swift SDK 套件，在 Swift 中產生完整的模型上下文協定伺服器專案。 | 無 |
| [technology-stack-blueprint-generator](../skills/technology-stack-blueprint-generator/SKILL.md) | 全方位技術堆疊原理圖產生器，能分析程式碼庫並建立詳細的架構文件。自動偵測技術堆疊、程式語言及多平台（.NET、Java、JavaScript、React、Python）實作模式。產生可設定的原理圖，包含版本資訊、授權細節、使用模式、程式規範及視覺化圖表。提供可直接實作的範本，並維持架構一致性以引導開發。 | 無 |
| [terraform-azurerm-set-diff-analyzer](../skills/terraform-azurerm-set-diff-analyzer/SKILL.md) | 分析 AzureRM Provider 的 Terraform 計畫 (plan) JSON 輸出，以區分誤報差異 (Set 類型屬性中的僅順序變更) 與實際資源變更。在審核 Azure 資源 (如 Application Gateway、Load Balancer、Firewall、Front Door、NSG 以及其他具有 Set 類型屬性且因內部順序變更而導致偽造差異的資源) 的 terraform 計畫輸出時使用。 | `references/azurerm_set_attributes.json`<br />`references/azurerm_set_attributes.md`<br />`scripts/.gitignore`<br />`scripts/README.md`<br />`scripts/analyze_plan.py` |
| [tldr-prompt](../skills/tldr-prompt/SKILL.md) | 建立 Copilot 檔案 (提示、代理程式、指令、集合)、MCP 伺服器或來自 URL 和查詢的文件，以產生 tldr 摘要。 | 無 |
| [transloadit-media-processing](../skills/transloadit-media-processing/SKILL.md) | 使用 Transloadit 處理媒體檔案（影片、音訊、影像、文件）。當被要求將影片編碼為 HLS/MP4、產生縮圖、調整影像大小或增加浮水印、擷取音訊、串接剪輯、增加字幕、對文件進行 OCR 或執行任何媒體處理管線時使用。涵蓋 86 個以上用於大規模檔案轉換的處理機器人 (robots)。 | 無 |
| [typescript-mcp-server-generator](../skills/typescript-mcp-server-generator/SKILL.md) | 在 TypeScript 中產生一個完整的 MCP 伺服器專案，包含工具、資源和適當的組態。 | 無 |
| [typespec-api-operations](../skills/typespec-api-operations/SKILL.md) | 為 TypeSpec API 外掛程式新增具有正確路由、參數和調適型卡片的 GET、POST、PATCH 和 DELETE 作業 | 無 |
| [typespec-create-agent](../skills/typespec-create-agent/SKILL.md) | 為 Microsoft 365 Copilot 產生包含指令、能力和交談啟動器的完整 TypeSpec 宣告式代理程式 | 無 |
| [typespec-create-api-plugin](../skills/typespec-create-api-plugin/SKILL.md) | 產生包含 REST 作業、驗證和調適型卡片的 Microsoft 365 Copilot TypeSpec API 外掛程式 | 無 |
| [update-avm-modules-in-bicep](../skills/update-avm-modules-in-bicep/SKILL.md) | 更新 Bicep 檔案中的 Azure Verified Modules (AVM) 至最新版本。 | 無 |
| [update-implementation-plan](../skills/update-implementation-plan/SKILL.md) | 根據新需求或更新，將現有的實作計畫檔案更新，以提供新功能、重構現有程式碼或升級套件、設計、架構或基礎設施。 | 無 |
| [update-llms](../skills/update-llms/SKILL.md) | 根據 llms.txt 規範，更新根目錄的 llms.txt 文件以反映文件或規格的變更。 | 無 |
| [update-markdown-file-index](../skills/update-markdown-file-index/SKILL.md) | 將指定資料夾的檔案索引／表格更新至指定的 markdown 文件區段。 | 無 |
| [update-oo-component-documentation](../skills/update-oo-component-documentation/SKILL.md) | 依據業界最佳實務與架構文件標準，更新現有物件導向元件文件。 | 無 |
| [update-specification](../skills/update-specification/SKILL.md) | 根據新需求或現有程式碼更新，優化解決方案的規格文件，並使其適合生成式 AI 使用。 | 無 |
| [vscode-ext-commands](../skills/vscode-ext-commands/SKILL.md) | 在 VS Code 延伸模組中貢獻指令的指南。標示命名慣例、可見性、在地化及其他相關屬性，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。 | 無 |
| [vscode-ext-localization](../skills/vscode-ext-localization/SKILL.md) | VS Code 延伸模組正確在地化的指南，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。 | 無 |
| [web-coder](../skills/web-coder/SKILL.md) | 專家級 10x 工程師，具備網頁開發、網際網路協定與網頁標準的全面知識。當處理 HTML、CSS、JavaScript、網頁 API、HTTP/HTTPS、網頁安全性、效能最佳化、無障礙性或任何網頁/網際網路概念時使用。專精於精確翻譯網頁術語，並在前端與後端開發中實作現代網頁標準。 | `references/accessibility.md`<br />`references/architecture-patterns.md`<br />`references/browsers-engines.md`<br />`references/css-styling.md`<br />`references/data-formats-encoding.md`<br />`references/development-tools.md`<br />`references/glossary.md`<br />`references/html-markup.md`<br />`references/http-networking.md`<br />`references/javascript-programming.md`<br />`references/media-graphics.md`<br />`references/performance-optimization.md`<br />`references/security-authentication.md`<br />`references/servers-infrastructure.md`<br />`references/web-apis-dom.md`<br />`references/web-protocols-standards.md` |
| [web-design-reviewer](../skills/web-design-reviewer/SKILL.md) | 此技能可對在本機或遠端執行的網站進行視覺檢查，以識別並修正設計問題。觸發條件包括「審閱網站設計」、「檢查 UI」、「修正版面配置」、「尋找設計問題」等請求。可偵測回應式設計、無障礙性、視覺一致性以及版面破裂等問題，並在原始程式碼層級進行修正。 | `references/framework-fixes.md`<br />`references/visual-checklist.md` |
| [webapp-testing](../skills/webapp-testing/SKILL.md) | 使用 Playwright 與本地網頁應用程式互動和測試的工具包。支援驗證前端功能、偵錯 UI 行為、擷取瀏覽器螢幕截圖以及檢視瀏覽器日誌。 | `test-helper.js` |
| [what-context-needed](../skills/what-context-needed/SKILL.md) | 在回答問題前詢問 Copilot 需要檢視哪些檔案 | 無 |
| [winapp-cli](../skills/winapp-cli/SKILL.md) | Windows 應用程式開發 CLI (winapp)，用於建構、打包與部署 Windows 應用程式。當需要初始化 Windows 應用程式專案、建立 MSIX 套件、產生 AppxManifest.xml、管理開發憑證、為除錯加入套件身分、簽署套件、發佈至 Microsoft Store、建立外部目錄或存取 Windows SDK 建構工具時使用。支援 .NET (csproj)、C++、Electron、Rust、Tauri 以及針對 Windows 的跨平台框架。 | 無 |
| [winmd-api-search](../skills/winmd-api-search/SKILL.md) | 尋找並探索 Windows 桌面 API。在建構需要平台能力的特性時使用 —— 如相機、檔案存取、通知、UI 控制項、AI/ML、感測器、網路等。探索適用於特定任務的 API 並獲取完整的類型細節 (方法、屬性、事件、列舉值)。 | `LICENSE.txt`<br />`scripts/Invoke-WinMdQuery.ps1`<br />`scripts/Update-WinMdCache.ps1`<br />`scripts/cache-generator/CacheGenerator.csproj`<br />`scripts/cache-generator/Directory.Build.props`<br />`scripts/cache-generator/Directory.Build.targets`<br />`scripts/cache-generator/Directory.Packages.props`<br />`scripts/cache-generator/Program.cs` |
| [winui3-migration-guide](../skills/winui3-migration-guide/SKILL.md) | UWP 到 WinUI 3 遷移參考。將舊版 UWP API 對應至正確的 Windows App SDK 等效項目，並附帶遷移前後的程式碼片段。涵蓋命名空間變更、執行緒 (CoreDispatcher 到 DispatcherQueue)、視窗化 (CoreWindow 到 AppWindow)、對話方塊、選取器、分享、列印、背景工作以及最常見的 Copilot 程式碼產生錯誤。 | 無 |
| [workiq-copilot](../skills/workiq-copilot/SKILL.md) | 引導 Copilot CLI 如何使用 WorkIQ CLI/MCP 伺服器來查詢 Microsoft 365 Copilot 資料（電子郵件、會議、文件、Teams、人員），以獲取即時背景資訊、摘要和建議。 | 無 |
| [write-coding-standards-from-file](../skills/write-coding-standards-from-file/SKILL.md) | 撰寫一個程式碼標準文件，該文件使用作為參數傳遞給提示的檔案和/或資料夾中的程式碼樣式。 | 無 |
