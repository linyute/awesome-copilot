# 🔌 外掛程式 (Plugins)

圍繞特定主題、工作流程或使用案例組織的相關代理程式與技能精選外掛程式。外掛程式可直接透過 GitHub Copilot CLI 或 VS Code 安裝。

> **Awesome Copilot 為預設的外掛程式市集** — 在 Copilot CLI 或 VS Code 中皆無需額外設定即可使用。
### 如何貢獻

請參閱 [CONTRIBUTING.md](../CONTRIBUTING.md#adding-plugins) 以獲取有關如何貢獻新外掛程式、改進現有外掛程式以及分享您的使用案例的準則。

### 如何使用外掛程式

**瀏覽外掛程式：**
- ⭐ 精選外掛程式會被醒目提示並顯示在清單頂端
- 探索按主題分組相關自定義設定的外掛程式
- 每個外掛程式都包含針對特定工作流程的代理程式與技能
- 外掛程式讓針對特定情境採用完整的工具包變得容易

**在 Copilot CLI 中尋找與安裝：**
- 在互動式 Copilot 工作階段中瀏覽市集： \`/plugin marketplace browse awesome-copilot\`
- 安裝外掛程式： \`copilot plugin install <plugin-name>@awesome-copilot\`

**在 VS Code 中尋找與安裝：**
- 開啟 Extensions 搜尋視圖並輸入 \`@agentPlugins\` 以瀏覽可用外掛程式
- 或開啟指令面板並執行 \`Chat: Plugins\`

| 名稱 | 說明 | 項目 | 標籤 |
| ---- | ----------- | ----- | ---- |
| [automate-this](../plugins/automate-this/README.md) | 錄製您執行手動程序的螢幕，將影片放在您的桌面，讓 Copilot CLI 逐影格進行分析，以建構可運作的自動化腳本。支援包含音訊逐字稿的旁白錄製。 | 1 個項目 | automation, screen-recording, workflow, video-analysis, process-automation, scripting, productivity, copilot-cli |
| [awesome-copilot](../plugins/awesome-copilot/README.md) | 協助您發現與產生精選 GitHub Copilot 代理程式、指令、提示詞與技能的 Meta 提示詞。 | 4 個項目 | github-copilot, discovery, meta, prompt-engineering, agents |
| [azure-cloud-development](../plugins/azure-cloud-development/README.md) | 全方位的 Azure 雲端開發工具，包含基礎架構即程式碼、無伺服器函式、架構模式，以及建構具延展性雲端應用程式的成本最佳化。 | 11 個項目 | azure, cloud, infrastructure, bicep, terraform, serverless, architecture, devops |
| [cast-imaging](../plugins/cast-imaging/README.md) | 使用 CAST Imaging 進行軟體分析、影響評估、結構品質諮詢與架構審查的專業代理程式完整集合。 | 3 個項目 | cast-imaging, software-analysis, architecture, quality, impact-analysis, devops |
| [clojure-interactive-programming](../plugins/clojure-interactive-programming/README.md) | REPL 優先的 Clojure 工作流程工具，具有 Clojure 指令、互動式程式設計對話模式及支援引導。 | 2 個項目 | clojure, repl, interactive-programming |
| [context-engineering](../plugins/context-engineering/README.md) | 透過更好的內容管理來最大化 GitHub Copilot 效能的工具與技術。包含結構化程式碼指南、用於規劃多檔案變更的代理程式，以及內容感知開發的提示詞。 | 4 個項目 | context, productivity, refactoring, best-practices, architecture |
| [copilot-sdk](../plugins/copilot-sdk/README.md) | 跨多種程式語言使用 GitHub Copilot SDK 建構應用程式。包含 C#、Go、Node.js/TypeScript 以及 Python 的詳盡指令，協助您建立 AI 驅動的應用程式。 | 1 個項目 | copilot-sdk, sdk, csharp, go, nodejs, typescript, python, ai, github-copilot |
| [csharp-dotnet-development](../plugins/csharp-dotnet-development/README.md) | C# 與 .NET 開發的必備提示詞、指令與對話模式，包含測試、文件與最佳實作。 | 9 個項目 | csharp, dotnet, aspnet, testing |
| [csharp-mcp-development](../plugins/csharp-mcp-development/README.md) | 使用官方 SDK 在 C# 中建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳實作指令、用於產生伺服器的提示詞，以及提供引導的專家對話模式。 | 2 個項目 | csharp, mcp, model-context-protocol, dotnet, server-development |
| [database-data-management](../plugins/database-data-management/README.md) | 適用於 PostgreSQL、SQL Server 的資料庫管理、SQL 最佳化與資料管理工具，以及通用資料庫開發最佳實作。 | 6 個項目 | database, sql, postgresql, sql-server, dba, optimization, queries, data-management |
| [dataverse-sdk-for-python](../plugins/dataverse-sdk-for-python/README.md) | 建構適用於 Microsoft Dataverse 之生產等級 Python 整合的完整集合。包含官方文件、最佳實作、進階功能、檔案操作以及程式碼產生提示詞。 | 4 個項目 | dataverse, python, integration, sdk |
| [devops-oncall](../plugins/devops-oncall/README.md) | 一組專注的提示詞、指令與對話模式，協助進行事件分類並使用 DevOps 工具與 Azure 資源快速回應。 | 3 個項目 | devops, incident-response, oncall, azure |
| [doublecheck](../plugins/doublecheck/README.md) | 針對 AI 輸出的三層驗證流程。擷取主張、尋找來源並標記幻覺風險，以便人類在採取行動前進行驗證。 | 2 個項目 | verification, hallucination, fact-check, source-citation, trust, safety |
| [edge-ai-tasks](../plugins/edge-ai-tasks/README.md) | 適用於中高階使用者與大型程式碼庫的任務研究員與任務規劃員 - 由 microsoft/edge-ai 提供 | 2 個項目 | architecture, planning, research, tasks, implementation |
| [flowstudio-power-automate](../plugins/flowstudio-power-automate/README.md) | 透過 FlowStudio MCP 伺服器管理 Power Automate 雲端流程的完整工具組。包含用於連線至 MCP 伺服器、偵錯失敗的流程執行記錄，以及根據自然語言建構並部署流程的技能。 | 3 個項目 | power-automate, power-platform, flowstudio, mcp, model-context-protocol, cloud-flows, workflow-automation |
| [frontend-web-dev](../plugins/frontend-web-dev/README.md) | 現代前端網頁開發的必備提示詞、指令與對話模式，包含 React、Angular、Vue、TypeScript 以及 CSS 框架。 | 4 個項目 | frontend, web, react, typescript, javascript, css, html, angular, vue |
| [gem-team](../plugins/gem-team/README.md) | 一個模組化的多代理程式團隊，用於執行複雜專案，具備基於 DAG 的規劃、平行執行、TDD 驗證，以及由充滿活力的團隊領導帶領的自動化測試。 | 8 個項目 | multi-agent, orchestration, dag-planning, parallel-execution, tdd, verification, automation, security, prd |
| [go-mcp-development](../plugins/go-mcp-development/README.md) | 使用官方 github.com/modelcontextprotocol/go-sdk 在 Go 中建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳實作指令、用於產生伺服器的提示詞，以及提供引導的專家對話模式。 | 2 個項目 | go, golang, mcp, model-context-protocol, server-development, sdk |
| [java-development](../plugins/java-development/README.md) | Java 開發的提示詞與指令完整集合，包含 Spring Boot、Quarkus、測試、文件與最佳實作。 | 4 個項目 | java, springboot, quarkus, jpa, junit, javadoc |
| [java-mcp-development](../plugins/java-mcp-development/README.md) | 使用官方 MCP Java SDK 並結合回應式串流與 Spring Boot 整合，在 Java 中建構 Model Context Protocol 伺服器的完整工具組。 | 2 個項目 | java, mcp, model-context-protocol, server-development, sdk, reactive-streams, spring-boot, reactor |
| [kotlin-mcp-development](../plugins/kotlin-mcp-development/README.md) | 使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫在 Kotlin 中建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳實作指令、用於產生伺服器的提示詞，以及提供引導的專家對話模式。 | 2 個項目 | kotlin, mcp, model-context-protocol, kotlin-multiplatform, server-development, ktor |
| [mcp-m365-copilot](../plugins/mcp-m365-copilot/README.md) | 為 Microsoft 365 Copilot 建構整合 Model Context Protocol 之宣告式代理程式的完整集合 | 4 個項目 | mcp, m365-copilot, declarative-agents, api-plugins, model-context-protocol, adaptive-cards |
| [napkin](../plugins/napkin/README.md) | Copilot CLI 的視覺化白板協作。在您的瀏覽器中開啟一個互動式白板，您可以在其中繪圖、素描並新增便利貼 — 然後將所有內容分享回 Copilot。Copilot 會查看您的繪圖並透過分析、建議和想法進行回應。 | 1 個項目 | whiteboard, visual, collaboration, brainstorming, non-technical, drawing, sticky-notes, accessibility, copilot-cli, ux |
| [noob-mode](../plugins/noob-mode/README.md) | 適用於非技術性 Copilot CLI 使用者的淺顯易懂翻譯層。將每個核准提示、錯誤訊息與技術輸出翻譯成清晰、無術語的內容，並附帶顏色標記的風險指標。 | 1 個項目 | accessibility, plain-english, non-technical, beginner, translation, copilot-cli, ux |
| [openapi-to-application-csharp-dotnet](../plugins/openapi-to-application-csharp-dotnet/README.md) | 從 OpenAPI 規格產生生產等級的 .NET 應用程式。包含 ASP.NET Core 專案架構、控制器產生、Entity Framework 整合以及 C# 最佳實作。 | 2 個項目 | openapi, code-generation, api, csharp, dotnet, aspnet |
| [openapi-to-application-go](../plugins/openapi-to-application-go/README.md) | 從 OpenAPI 規格產生生產等級的 Go 應用程式。包含專案架構、處理常式產生、中介軟體設定以及 REST API 的 Go 最佳實作。 | 2 個項目 | openapi, code-generation, api, go, golang |
| [openapi-to-application-java-spring-boot](../plugins/openapi-to-application-java-spring-boot/README.md) | 從 OpenAPI 規格產生生產等級的 Spring Boot 應用程式。包含專案架構、REST 控制器產生、服務層組織以及 Spring Boot 最佳實作。 | 2 個項目 | openapi, code-generation, api, java, spring-boot |
| [openapi-to-application-nodejs-nestjs](../plugins/openapi-to-application-nodejs-nestjs/README.md) | 從 OpenAPI 規格產生生產等級的 NestJS 應用程式。包含專案主體結構建置、控制器與服務產生、TypeScript 最佳實作以及企業級模式。 | 2 個項目 | openapi, code-generation, api, nodejs, typescript, nestjs |
| [openapi-to-application-python-fastapi](../plugins/openapi-to-application-python-fastapi/README.md) | 從 OpenAPI 規格產生生產等級的 FastAPI 應用程式。包含專案主體結構建置、路由產生、相依性注入，以及用於非同步 API 的 Python 最佳實作。 | 2 個項目 | openapi, code-generation, api, python, fastapi |
| [oracle-to-postgres-migration-expert](../plugins/oracle-to-postgres-migration-expert/README.md) | 用於 .NET 解決方案中 Oracle 到 PostgreSQL 應用程式遷移的專家代理。執行程式碼編輯、執行指令，並呼叫擴充工具，以將 .NET/Oracle 資料存取模式遷移至 PostgreSQL。 | 8 個項目 | oracle, postgresql, database-migration, dotnet, sql, migration, integration-testing, stored-procedures |
| [ospo-sponsorship](../plugins/ospo-sponsorship/README.md) | 為開源專案辦公室 (OSPO) 提供的工具與資源，用於透過 GitHub Sponsors、Open Collective 及其他資助平台識別、評估並管理開源相依項目的贊助。 | 1 個項目 |  |
| [partners](../plugins/partners/README.md) | 由 GitHub 合作夥伴建立的自訂代理程式 | 20 個項目 | devops, security, database, cloud, infrastructure, observability, feature-flags, cicd, migration, performance |
| [pcf-development](../plugins/pcf-development/README.md) | 使用 Power Apps 元件架構為模型驅動與畫布應用程式開發自訂程式碼元件的完整工具包 | 0 個項目 | power-apps, pcf, component-framework, typescript, power-platform |
| [php-mcp-development](../plugins/php-mcp-development/README.md) | 使用官方 PHP SDK 建構 Model Context Protocol 伺服器的完整資源，具備基於屬性的探索功能，包含最佳實作、專案產生以及專家協助 | 2 個項目 | php, mcp, model-context-protocol, server-development, sdk, attributes, composer |
| [polyglot-test-agent](../plugins/polyglot-test-agent/README.md) | 用於在任何程式語言中產生全面單元測試的多代理程式管道。使用專門的代理程式編排研究、規劃和實作階段，以產生符合專案慣例且可編譯、通過測試的內容。 | 9 個項目 | testing, unit-tests, polyglot, test-generation, multi-agent, tdd, csharp, typescript, python, go |
| [power-apps-code-apps](../plugins/power-apps-code-apps/README.md) | Power Apps Code Apps 開發的完整工具包，包含專案主體結構建置、開發標準，以及整合 Power Platform 建構程式碼優先應用程式的專家指引。 | 2 個項目 | power-apps, power-platform, typescript, react, code-apps, dataverse, connectors |
| [power-bi-development](../plugins/power-bi-development/README.md) | 全面的 Power BI 開發資源，包含資料模型建構、DAX 最佳化、效能調校、視覺化設計、安全性最佳實作，以及建構企業級 Power BI 解決方案的 DevOps/ALM 指引。 | 8 個項目 | power-bi, dax, data-modeling, performance, visualization, security, devops, business-intelligence |
| [power-platform-mcp-connector-development](../plugins/power-platform-mcp-connector-development/README.md) | 為 Microsoft Copilot Studio 提供整合 Model Context Protocol 的 Power Platform 自訂連接器開發完整工具包 | 3 個項目 | power-platform, mcp, copilot-studio, custom-connector, json-rpc |
| [project-planning](../plugins/project-planning/README.md) | 為開發團隊提供軟體專案規劃、功能拆解、Epic 管理、實作規劃以及工作組織的工具與指引。 | 15 個項目 | planning, project-management, epic, feature, implementation, task, architecture, technical-spike |
| [python-mcp-development](../plugins/python-mcp-development/README.md) | 使用官方 SDK 搭配 FastMCP 在 Python 中建構 Model Context Protocol (MCP) 伺服器的完整工具包。包含最佳實作指南、用於產生伺服器的提示，以及提供引導的專家對話模式。 | 2 個項目 | python, mcp, model-context-protocol, fastmcp, server-development |
| [ruby-mcp-development](../plugins/ruby-mcp-development/README.md) | 使用官方 MCP Ruby SDK gem 搭配 Rails 整合支援，在 Ruby 中建構 Model Context Protocol 伺服器的完整工具包。 | 2 個項目 | ruby, mcp, model-context-protocol, server-development, sdk, rails, gem |
| [rug-agentic-workflow](../plugins/rug-agentic-workflow/README.md) | 包含編排器以及實作與 QA 子代理程式的三代理程式工作流程，用於編排軟體交付。 | 3 個項目 | agentic-workflow, orchestration, subagents, software-engineering, qa |
| [rust-mcp-development](../plugins/rust-mcp-development/README.md) | 使用官方 rmcp SDK 搭配 async/await、程序巨集與型別安全實作，在 Rust 中建構高效能的 Model Context Protocol 伺服器。 | 2 個項目 | rust, mcp, model-context-protocol, server-development, sdk, tokio, async, macros, rmcp |
| [security-best-practices](../plugins/security-best-practices/README.md) | 安全性框架、無障礙指南、效能最佳化與程式碼品質最佳實作，用於建構安全、可維護且高效能的應用程式。 | 1 個項目 | security, accessibility, performance, code-quality, owasp, a11y, optimization, best-practices |
| [software-engineering-team](../plugins/software-engineering-team/README.md) | 7 個專門的代理程式，涵蓋從 UX 設計與架構到安全性與 DevOps 的完整軟體開發生命週期。 | 7 個項目 | team, enterprise, security, devops, ux, architecture, product, ai-ethics |
| [structured-autonomy](../plugins/structured-autonomy/README.md) | 卓越的規劃，精簡的實作 | 3 個項目 |  |
| [swift-mcp-development](../plugins/swift-mcp-development/README.md) | 使用官方 MCP Swift SDK 搭配現代並行功能，在 Swift 中建構 Model Context Protocol 伺服器的完整集合。 | 2 個項目 | swift, mcp, model-context-protocol, server-development, sdk, ios, macos, concurrency, actor, async-await |
| [technical-spike](../plugins/technical-spike/README.md) | 用於建立、管理與研究技術探究 (Technical Spike) 的工具，旨在於進行解決方案的規格制定與實作前減少未知因素與假設。 | 2 個項目 | technical-spike, assumption-testing, validation, research |
| [testing-automation](../plugins/testing-automation/README.md) | 用於編寫測試、測試自動化與測試驅動開發的完整集合，包含單元測試、整合測試以及端對端測試策略。 | 9 個項目 | testing, tdd, automation, unit-tests, integration, playwright, jest, nunit |
| [typescript-mcp-development](../plugins/typescript-mcp-development/README.md) | 使用官方 SDK 在 TypeScript/Node.js 中建構 Model Context Protocol (MCP) 伺服器的完整工具包。包含最佳實作指南、用於產生伺服器的提示，以及提供引導的專家對話模式。 | 2 個項目 | typescript, mcp, model-context-protocol, nodejs, server-development |
| [typespec-m365-copilot](../plugins/typespec-m365-copilot/README.md) | 使用 TypeSpec 進行 Microsoft 365 Copilot 擴充，建構宣告式代理程式與 API 外掛程式的完整提示、指令與資源集合。 | 3 個項目 | typespec, m365-copilot, declarative-agents, api-plugins, agent-development, microsoft-365 |
| [winui3-development](../plugins/winui3-development/README.md) | WinUI 3 與 Windows App SDK 開發代理程式、指令與遷移指南。防止常見的 UWP API 誤用，並引導桌面 Windows 應用程式採用正確的 WinUI 3 模式。 | 2 個項目 | winui, winui3, windows-app-sdk, xaml, desktop, windows |
