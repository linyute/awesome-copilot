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
| [acreadiness-cockpit](../plugins/acreadiness-cockpit/README.md) | 從 Copilot 聊天視窗驅動 Microsoft AgentRC：評估 AI 就緒程度、建立 Copilot 指令（適用於 Monorepo 的扁平或帶有 applyTo glob 的巢狀結構），以及管理政策。在 reports/index.html 產出一個獨立的靜態 HTML 儀表板。 | 4 items | agentrc, ai-readiness, copilot-instructions, readiness-report, monorepo, policy, dashboard |
| [ai-team-orchestration](../plugins/ai-team-orchestration/README.md) | 引導建立並執行一個具有具名角色（製作人、開發團隊、測試）的多代理 AI 開發團隊。包含衝刺規劃、具有不同代理聲音的腦力激盪提示、跨對話上下文生存以及平行團隊工作流。基於一個經過驗證的範本，該範本在 5 天內交付了一個包含 30 款遊戲且完全沒有人類編寫程式碼的應用程式。 | 4 items | ai-team, multi-agent, sprint-planning, brainstorm, project-management, orchestration, developer-workflow |
| [arize-ax](../plugins/arize-ax/README.md) | Arize AX 平台技能，用於 LLM 可觀測性、評估與最佳化。包含追蹤匯出、儀表板化、資料集、實驗、評估器、AI 提供者整合、標註、提示工程最佳化，以及指向 Arize UI 的深度連結。 | 9 items | arize, llm, observability, tracing, evaluation, instrumentation, datasets, experiments, prompt-optimization |
| [automate-this](../plugins/automate-this/README.md) | 錄製您執行手動程序的螢幕，將影片放在您的桌面，讓 Copilot CLI 逐影格進行分析，以建構可運作的自動化腳本。支援包含音訊逐字稿的旁白錄製。 | 1 items | automation, screen-recording, workflow, video-analysis, process-automation, scripting, productivity, copilot-cli |
| [awesome-copilot](../plugins/awesome-copilot/README.md) | 協助您發現與產生精選 GitHub Copilot 代理程式、指令、提示詞與技能的 Meta 提示詞。 | 4 items | github-copilot, discovery, meta, prompt-engineering, agents |
| [azure-cloud-development](../plugins/azure-cloud-development/README.md) | 全方位的 Azure 雲端開發工具，包含基礎架構即程式碼、無伺服器函式、架構模式，以及建構具延展性雲端應用程式的成本最佳化。 | 11 items | azure, cloud, infrastructure, bicep, terraform, serverless, architecture, devops |
| [cast-imaging](../plugins/cast-imaging/README.md) | 使用 CAST Imaging 進行軟體分析、影響評估、結構品質諮詢與架構審查的專業代理程式完整集合。 | 3 items | cast-imaging, software-analysis, architecture, quality, impact-analysis, devops |
| [clojure-interactive-programming](../plugins/clojure-interactive-programming/README.md) | REPL 優先的 Clojure 工作流程工具，具有 Clojure 指令、互動式程式設計對話模式及支援引導。 | 2 items | clojure, repl, interactive-programming |
| [cms-development](../plugins/cms-development/README.md) | 用於 CMS 開發的技能，涵蓋佈景主題、外掛程式、管理員工具、媒體工作流程、Markdown 渲染以及靜態匯出管線。 | 4 items | cms, content-management-system, wordpress, shopify, drupal, theme, plugin, media, static-site |
| [context-engineering](../plugins/context-engineering/README.md) | 透過更好的內容管理來最大化 GitHub Copilot 效能的工具與技術。包含結構化程式碼指南、用於規劃多檔案變更的代理程式，以及內容感知開發的提示詞。 | 4 items | context, productivity, refactoring, best-practices, architecture |
| [context-matic](../plugins/context-matic/README.md) | 程式代理會對 API 產生幻覺。ContextMatic 提供經過整理與版本化的 API 與 SDK 文件。當你請代理「整合付款 API」時，它可能會胡亂猜測——依賴過時的訓練資料與不符合實際 SDK 的通用模式。ContextMatic 的解決方式是在代理需要的精確時刻，提供確定性、具版本意識且符合 SDK 的原生上下文。 | 2 items | api-context, api-integration, mcp, sdk, apimatic, third-party-apis, sdks |
| [copilot-sdk](../plugins/copilot-sdk/README.md) | 跨多種程式語言使用 GitHub Copilot SDK 建構應用程式。包含 C#、Go、Node.js/TypeScript 以及 Python 的詳盡指令，協助您建立 AI 驅動的應用程式。 | 1 items | copilot-sdk, sdk, csharp, go, nodejs, typescript, python, ai, github-copilot |
| [csharp-dotnet-development](../plugins/csharp-dotnet-development/README.md) | C# 與 .NET 開發的必備提示詞、指令與對話模式，包含測試、文件與最佳實作。 | 9 items | csharp, dotnet, aspnet, testing |
| [csharp-mcp-development](../plugins/csharp-mcp-development/README.md) | 使用官方 SDK 在 C# 中建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳實作指令、用於產生伺服器的提示詞，以及提供引導的專家對話模式。 | 2 items | csharp, mcp, model-context-protocol, dotnet, server-development |
| [database-data-management](../plugins/database-data-management/README.md) | 適用於 PostgreSQL、SQL Server 的資料庫管理、SQL 最佳化與資料管理工具，以及通用資料庫開發最佳實作。 | 6 items | database, sql, postgresql, sql-server, dba, optimization, queries, data-management |
| [dataverse-sdk-for-python](../plugins/dataverse-sdk-for-python/README.md) | 建構適用於 Microsoft Dataverse 之生產等級 Python 整合的完整集合。包含官方文件、最佳實作、進階功能、檔案操作以及程式碼產生提示詞。 | 4 items | dataverse, python, integration, sdk |
| [devops-oncall](../plugins/devops-oncall/README.md) | 一組專注的提示詞、指令與對話模式，協助進行事件分類並使用 DevOps 工具與 Azure 資源快速回應。 | 3 items | devops, incident-response, oncall, azure |
| [doublecheck](../plugins/doublecheck/README.md) | 針對 AI 輸出的三層驗證流程。擷取主張、尋找來源並標記幻覺風險，以便人類在採取行動前進行驗證。 | 2 items | verification, hallucination, fact-check, source-citation, trust, safety |
| [edge-ai-tasks](../plugins/edge-ai-tasks/README.md) | 適用於中高階使用者與大型程式碼庫的任務研究員與任務規劃員 - 由 microsoft/edge-ai 提供 | 2 items | architecture, planning, research, tasks, implementation |
| [ember](../plugins/ember/README.md) | 一個 AI 夥伴，而不僅僅是一個工具。Ember 在人與人之間傳遞火種 —— 幫助人類發現 AI 夥伴關係並不是一種你需要學習的技能，而是一種你可以尋找的關係。 | 2 items | ai-partnership, coaching, onboarding, collaboration, storytelling, developer-experience |
| [eyeball](../plugins/eyeball/README.md) | 具備內建原始資料螢幕截圖的文件分析。當您要求 Copilot 分析文件時，Eyeball 會產生一個 Word 文件，其中每項事實主張都包含原始資料的反白顯示螢幕截圖，讓您可以親眼驗證。 | 1 items | document-analysis, citation-verification, screenshot, contracts, legal, trust, visual-verification |
| [fastah-ip-geo-tools](../plugins/fastah-ip-geo-tools/README.md) | 此外掛程式旨在協助網路維運工程師調校並發佈 RFC 8805 格式的 IP 地理位置資訊饋給。它包含一個 AI 技能以及一個相關聯的 MCP 伺服器，可將地理位置地名進行地理編碼以對應至真實城市，確保準確性。 | 1 items | geofeed, ip-geolocation, rfc-8805, rfc-9632, network-operations, isp, cloud, hosting, ixp |
| [flowstudio-power-automate](../plugins/flowstudio-power-automate/README.md) | 透過 FlowStudio MCP 伺服器賦予您的 AI 代理對 Power Automate 雲端流程的完整可視性。連結、除錯、建構、監控健康狀態並進行大規模治理流程 —— 針對動作層級的輸入與輸出，而不僅僅是狀態碼。 | 5 items | power-automate, power-platform, flowstudio, mcp, model-context-protocol, cloud-flows, workflow-automation, monitoring, governance |
| [frontend-web-dev](../plugins/frontend-web-dev/README.md) | 現代前端網頁開發的必備提示詞、指令與對話模式，包含 React、Angular、Vue、TypeScript 以及 CSS 框架。 | 4 items | frontend, web, react, typescript, javascript, css, html, angular, vue |
| [gem-team](../plugins/gem-team/README.md) | 用於規格驅動開發與自動驗證的多代理程式協調框架。 | 15 items | multi-agent, orchestration, tdd, testing, e2e, devops, security-audit, code-review, prd, mobile |
| [go-mcp-development](../plugins/go-mcp-development/README.md) | 使用官方 github.com/modelcontextprotocol/go-sdk 在 Go 中建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳實作指令、用於產生伺服器的提示詞，以及提供引導的專家對話模式。 | 2 items | go, golang, mcp, model-context-protocol, server-development, sdk |
| [java-development](../plugins/java-development/README.md) | Java 開發的提示詞與指令完整集合，包含 Spring Boot、Quarkus、測試、文件與最佳實作。 | 4 items | java, springboot, quarkus, jpa, junit, javadoc |
| [java-mcp-development](../plugins/java-mcp-development/README.md) | 使用官方 MCP Java SDK 並結合回應式串流與 Spring Boot 整合，在 Java 中建構 Model Context Protocol 伺服器的完整工具組。 | 2 items | java, mcp, model-context-protocol, server-development, sdk, reactive-streams, spring-boot, reactor |
| [kotlin-mcp-development](../plugins/kotlin-mcp-development/README.md) | 使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫在 Kotlin 中建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳實作指令、用於產生伺服器的提示詞，以及提供引導的專家對話模式。 | 2 items | kotlin, mcp, model-context-protocol, kotlin-multiplatform, server-development, ktor |
| [mcp-m365-copilot](../plugins/mcp-m365-copilot/README.md) | 為 Microsoft 365 Copilot 建構整合 Model Context Protocol 之宣告式代理程式的完整集合 | 4 items | mcp, m365-copilot, declarative-agents, api-plugins, model-context-protocol, adaptive-cards |
| [modernize-java](../plugins/modernize-java/README.md) | 以 AI 驅動的 Java 現代化與升級助手。協助將 Java 和 Spring Boot 應用程式升級到最新版本。 | 1 items | java, modernization, upgrade, migration, spring-boot |
| [napkin](../plugins/napkin/README.md) | Copilot CLI 的視覺化白板協作。在您的瀏覽器中開啟一個互動式白板，您可以在其中繪圖、素描並新增便利貼 — 然後將所有內容分享回 Copilot。Copilot 會查看您的繪圖並透過分析、建議和想法進行回應。 | 1 items | whiteboard, visual, collaboration, brainstorming, non-technical, drawing, sticky-notes, accessibility, copilot-cli, ux |
| [noob-mode](../plugins/noob-mode/README.md) | 適用於非技術性 Copilot CLI 使用者的淺顯易懂翻譯層。將每個核准提示、錯誤訊息與技術輸出翻譯成清晰、無術語的內容，並附帶顏色標記的風險指標。 | 1 items | accessibility, plain-english, non-technical, beginner, translation, copilot-cli, ux |
| [openapi-to-application-csharp-dotnet](../plugins/openapi-to-application-csharp-dotnet/README.md) | 從 OpenAPI 規格產生生產等級的 .NET 應用程式。包含 ASP.NET Core 專案架構、控制器產生、Entity Framework 整合以及 C# 最佳實作。 | 2 items | openapi, code-generation, api, csharp, dotnet, aspnet |
| [openapi-to-application-go](../plugins/openapi-to-application-go/README.md) | 從 OpenAPI 規格產生生產等級的 Go 應用程式。包含專案架構、處理常式產生、中介軟體設定以及 REST API 的 Go 最佳實作。 | 2 items | openapi, code-generation, api, go, golang |
| [openapi-to-application-java-spring-boot](../plugins/openapi-to-application-java-spring-boot/README.md) | 從 OpenAPI 規格產生生產等級的 Spring Boot 應用程式。包含專案架構、REST 控制器產生、服務層組織以及 Spring Boot 最佳實作。 | 2 items | openapi, code-generation, api, java, spring-boot |
| [openapi-to-application-nodejs-nestjs](../plugins/openapi-to-application-nodejs-nestjs/README.md) | 從 OpenAPI 規格產生生產等級的 NestJS 應用程式。包含專案主體結構建置、控制器與服務產生、TypeScript 最佳實作以及企業級模式。 | 2 items | openapi, code-generation, api, nodejs, typescript, nestjs |
| [openapi-to-application-python-fastapi](../plugins/openapi-to-application-python-fastapi/README.md) | 從 OpenAPI 規格產生生產等級的 FastAPI 應用程式。包含專案主體結構建置、路由產生、相依性注入，以及用於非同步 API 的 Python 最佳實作。 | 2 items | openapi, code-generation, api, python, fastapi |
| [oracle-to-postgres-migration-expert](../plugins/oracle-to-postgres-migration-expert/README.md) | 用於 .NET 解決方案中 Oracle 到 PostgreSQL 應用程式遷移的專家代理。執行程式碼編輯、執行指令，並呼叫擴充工具，以將 .NET/Oracle 資料存取模式遷移至 PostgreSQL。 | 8 items | oracle, postgresql, database-migration, dotnet, sql, migration, integration-testing, stored-procedures |
| [ospo-sponsorship](../plugins/ospo-sponsorship/README.md) | 為開源專案辦公室 (OSPO) 提供的工具與資源，用於透過 GitHub Sponsors、Open Collective 及其他資助平台識別、評估並管理開源相依項目的贊助。 | 1 items |  |
| [partners](../plugins/partners/README.md) | 由 GitHub 合作夥伴建立的自訂代理程式 | 20 items | devops, security, database, cloud, infrastructure, observability, feature-flags, cicd, migration, performance |
| [pcf-development](../plugins/pcf-development/README.md) | 使用 Power Apps 元件架構為模型驅動與畫布應用程式開發自訂程式碼元件的完整工具包 | 0 items | power-apps, pcf, component-framework, typescript, power-platform |
| [phoenix](../plugins/phoenix/README.md) | Phoenix AI 可觀測性技能，用於 LLM 應用程式除錯、評估與追蹤。包含 CLI 除錯工具、LLM 評估工作流程以及 OpenInference 追蹤儀表板化。 | 3 items | phoenix, arize, llm, observability, tracing, evaluation, openinference, instrumentation |
| [php-mcp-development](../plugins/php-mcp-development/README.md) | 使用官方 PHP SDK 建構 Model Context Protocol 伺服器的完整資源，具備基於屬性的探索功能，包含最佳實作、專案產生以及專家協助 | 2 items | php, mcp, model-context-protocol, server-development, sdk, attributes, composer |
| [polyglot-test-agent](../plugins/polyglot-test-agent/README.md) | 用於在任何程式語言中產生全面單元測試的多代理程式管道。使用專門的代理程式編排研究、規劃和實作階段，以產生符合專案慣例且可編譯、通過測試的內容。 | 9 items | testing, unit-tests, polyglot, test-generation, multi-agent, tdd, csharp, typescript, python, go |
| [power-apps-code-apps](../plugins/power-apps-code-apps/README.md) | Power Apps Code Apps 開發的完整工具包，包含專案主體結構建置、開發標準，以及整合 Power Platform 建構程式碼優先應用程式的專家指引。 | 2 items | power-apps, power-platform, typescript, react, code-apps, dataverse, connectors |
| [power-bi-development](../plugins/power-bi-development/README.md) | 全面的 Power BI 開發資源，包含資料模型建構、DAX 最佳化、效能調校、視覺化設計、安全性最佳實作，以及建構企業級 Power BI 解決方案的 DevOps/ALM 指引。 | 8 items | power-bi, dax, data-modeling, performance, visualization, security, devops, business-intelligence |
| [power-platform-architect](../plugins/power-platform-architect/README.md) | Microsoft Power Platform 的解決方案架構師，負責將業務需求轉化為功能齊全的 Power Platform 解決方案架構。 | 1 items | power-platform, power-platform-architect, power-apps, dataverse, power-automate, power-pages, power-bi |
| [power-platform-mcp-connector-development](../plugins/power-platform-mcp-connector-development/README.md) | 為 Microsoft Copilot Studio 提供整合 Model Context Protocol 的 Power Platform 自訂連接器開發完整工具包 | 3 items | power-platform, mcp, copilot-studio, custom-connector, json-rpc |
| [project-documenter](../plugins/project-documenter/README.md) | 產生具備 draw.io 架構圖與包含圖片之 Word (.docx) 輸出的專業專案文件。自動探索任何專案的技術棧，並產生 Markdown、圖表、PNG 匯出以及格式化的 Word 文件。 | 3 items | documentation, architecture-diagrams, drawio, word-document, docx, png-images, c4-model, project-summary, auto-discovery |
| [project-planning](../plugins/project-planning/README.md) | 為開發團隊提供軟體專案規劃、功能拆解、Epic 管理、實作規劃以及工作組織的工具與指引。 | 15 items | planning, project-management, epic, feature, implementation, task, architecture, technical-spike |
| [python-mcp-development](../plugins/python-mcp-development/README.md) | 使用官方 SDK 搭配 FastMCP 在 Python 中建構 Model Context Protocol (MCP) 伺服器的完整工具包。包含最佳實作指南、用於產生伺服器的提示，以及提供引導的專家對話模式。 | 2 items | python, mcp, model-context-protocol, fastmcp, server-development |
| [react18-upgrade](../plugins/react18-upgrade/README.md) | 企業級 React 18 遷移工具組，具備用於將 React 16/17 類別元件程式碼庫升級至 React 18.3.1 的專門代理與技能。包含稽核員、套件依賴外科醫生、類別元件遷移專家、自動批次處理修復工具與測試監護人。 | 13 items | react18, react, migration, upgrade, class-components, lifecycle, batching |
| [react19-upgrade](../plugins/react19-upgrade/README.md) | 企業級 React 19 遷移工具組，具備用於將 React 18 程式碼庫升級至 React 19 的專門代理與技能。包含稽核員、套件依賴外科醫生、原始碼遷移工具與測試監護人。處理已棄用 API 的移除工作，包括 ReactDOM.render、forwardRef、defaultProps、舊版 context、字串 refs 等。 | 8 items | react19, react, migration, upgrade, hooks, modern-react |
| [roundup](../plugins/roundup/README.md) | 自動設定狀態簡報產生器。從範例中學習您的溝通風格，發掘您的資料來源，並根據需求為任何受眾產生草稿更新。 | 2 items | status-updates, briefings, management, productivity, communication, synthesis, roundup, copilot-cli |
| [ruby-mcp-development](../plugins/ruby-mcp-development/README.md) | 使用官方 MCP Ruby SDK gem 搭配 Rails 整合支援，在 Ruby 中建構 Model Context Protocol 伺服器的完整工具包。 | 2 items | ruby, mcp, model-context-protocol, server-development, sdk, rails, gem |
| [rug-agentic-workflow](../plugins/rug-agentic-workflow/README.md) | 包含編排器以及實作與 QA 子代理程式的三代理程式工作流程，用於編排軟體交付。 | 3 items | agentic-workflow, orchestration, subagents, software-engineering, qa |
| [rust-mcp-development](../plugins/rust-mcp-development/README.md) | 使用官方 rmcp SDK 搭配 async/await、程序巨集與型別安全實作，在 Rust 中建構高效能的 Model Context Protocol 伺服器。 | 2 items | rust, mcp, model-context-protocol, server-development, sdk, tokio, async, macros, rmcp |
| [salesforce-development](../plugins/salesforce-development/README.md) | 完整的 Salesforce 代理式開發環境，涵蓋 Apex 與觸發程序、流程自動化、Lightning Web 元件、Aura 元件與 Visualforce 頁面。 | 7 items | salesforce, apex, triggers, lwc, aura, flow, visualforce, crm, salesforce-dx |
| [security-best-practices](../plugins/security-best-practices/README.md) | 安全性框架、無障礙指南、效能最佳化與程式碼品質最佳實作，用於建構安全、可維護且高效能的應用程式。 | 1 items | security, accessibility, performance, code-quality, owasp, a11y, optimization, best-practices |
| [software-engineering-team](../plugins/software-engineering-team/README.md) | 7 個專門的代理程式，涵蓋從 UX 設計與架構到安全性與 DevOps 的完整軟體開發生命週期。 | 7 items | team, enterprise, security, devops, ux, architecture, product, ai-ethics |
| [structured-autonomy](../plugins/structured-autonomy/README.md) | 卓越的規劃，精簡的實作 | 3 items |  |
| [swift-mcp-development](../plugins/swift-mcp-development/README.md) | 使用官方 MCP Swift SDK 搭配現代並行功能，在 Swift 中建構 Model Context Protocol 伺服器的完整集合。 | 2 items | swift, mcp, model-context-protocol, server-development, sdk, ios, macos, concurrency, actor, async-await |
| [technical-spike](../plugins/technical-spike/README.md) | 用於建立、管理與研究技術探究 (Technical Spike) 的工具，旨在於進行解決方案的規格制定與實作前減少未知因素與假設。 | 2 items | technical-spike, assumption-testing, validation, research |
| [testing-automation](../plugins/testing-automation/README.md) | 用於編寫測試、測試自動化與測試驅動開發的完整集合，包含單元測試、整合測試以及端對端測試策略。 | 9 items | testing, tdd, automation, unit-tests, integration, playwright, jest, nunit |
| [typescript-mcp-development](../plugins/typescript-mcp-development/README.md) | 使用官方 SDK 在 TypeScript/Node.js 中建構 Model Context Protocol (MCP) 伺服器的完整工具包。包含最佳實作指南、用於產生伺服器的提示，以及提供引導的專家對話模式。 | 2 items | typescript, mcp, model-context-protocol, nodejs, server-development |
| [typespec-m365-copilot](../plugins/typespec-m365-copilot/README.md) | 使用 TypeSpec 進行 Microsoft 365 Copilot 擴充，建構宣告式代理程式與 API 外掛程式的完整提示、指令與資源集合。 | 3 items | typespec, m365-copilot, declarative-agents, api-plugins, agent-development, microsoft-365 |
| [winui3-development](../plugins/winui3-development/README.md) | WinUI 3 與 Windows App SDK 開發代理程式、指令與遷移指南。防止常見的 UWP API 誤用，並引導桌面 Windows 應用程式採用正確的 WinUI 3 模式。 | 2 items | winui, winui3, windows-app-sdk, xaml, desktop, windows |
