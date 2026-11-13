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
- 已發佈的市集 manifest（供工具使用）：`https://raw.githubusercontent.com/linyute/awesome-copilot/marketplace/.github/plugin/marketplace.json`
- 來源 plugin 內容（由人工撰寫）：`https://github.com/linyute/awesome-copilot/tree/main/plugins`

| 名稱 | 描述 | 項目 | 標籤 |
| ---- | ----------- | ----- | ---- |
| [accessibility-kanban](../plugins/accessibility-kanban/README.md) | 管理無障礙問題的看板，可讓您規劃、追蹤並完成補救工作。 | 1 個項目 | accessibility, github-issues, issue-triage, kanban-board, planning-workflow, status-tracking |
| [acreadiness-cockpit](../plugins/acreadiness-cockpit/README.md) | 從 Copilot 聊天中推動 Microsoft AgentRC：評估 AI 整備度、產生 Copilot 指示（平面或具備 monorepo 的 applyTo glob 巢狀結構），並管理原則。在 reports/index.html 產生獨立的靜態 HTML 儀表板。 | 4 個項目 | agentrc, ai-readiness, copilot-instructions, readiness-report, monorepo, policy, dashboard |
| [adobe-illustrator](../plugins/adobe-illustrator/README.md) | Adobe Illustrator 指令碼撰寫、擴充功能與外掛程式開發、MCP 和命令列自動化，以及 Creative Cloud 資產管理，由 Adobe Creative Cloud 專家技術美術代理人主導。 | 3 個項目 | adobe-illustrator, illustrator, extendscript, cep, uxp, creative-cloud, graphic-design, automation, mcp |
| [agent-radar](../plugins/agent-radar/README.md) | 在您的電腦上檢視 Copilot 代理人、其子代理人、其命令以及其資料流向的即時地圖。 | 1 個項目 | agents, canvas, copilot-extension, data-flow, mcp, observability, subagents, token-usage |
| [ai-credits-breakdown](../plugins/ai-credits-breakdown/README.md) | 精確檢視您自己的 GitHub Copilot AI 額度消耗去向：依日期、存放庫、模型、呼叫類型以及提示快取狀態統計費用，完全由您電腦上的 Copilot 遙測資料在私密環境下建構。 | 1 個項目 | ai-credits, canvas, copilot-extension, cost-tracking, token-usage, usage-analytics |
| [ai-team-orchestration](../plugins/ai-team-orchestration/README.md) | 執行輕量級、角色分離的 AI 開發團隊，具備彈性的工具、開發者選定的模型、合宜的規劃以及可選的 QA。 | 4 個項目 | ai-team, multi-agent, sprint-planning, brainstorm, project-management, orchestration, developer-workflow |
| [apng-studio](../plugins/apng-studio/README.md) | 用於從影格建構動態 PNG (APNG) 檔案的互動式 GitHub Copilot 應用程式畫布擴充功能。繪製或上傳影格、調整每個影格的時間與合成、即時預覽、透過 QR 碼將結果傳送到您的手機，並匯出動態 .png。 | 1 個項目 | animated-png, apng, copilot-canvas, frame-animation, image-export, interactive-canvas |
| [arcade-canvas](../plugins/arcade-canvas/README.md) | 在 Agent 運作時，於 Copilot 畫布中暢玩六款復古 Phaser 迷你遊戲。 | 1 個項目 | arcade-games, copilot-canvas, interactive-canvas, phaser, retro-games, session-breaks |
| [arch](../plugins/arch/README.md) | 架構與現代化工具套件：為本機複製的存放庫產出具引用的架構文件，並在需要時產生自動執行文件模式的分階段現代化計劃。 | 1 個項目 | architecture, modernization, documentation, migration, onboarding |
| [arize-ax](../plugins/arize-ax/README.md) | 用於 LLM 可觀測性、評估與最佳化的 Arize AX 平台技能。包含追蹤匯出、檢測、資料集、實驗、評估器、AI 提供者整合、註解、提示最佳化，以及指向 Arize 使用者介面的深層連結。 | 9 個項目 | arize, llm, observability, tracing, evaluation, instrumentation, datasets, experiments, prompt-optimization |
| [automate-this](../plugins/automate-this/README.md) | 錄製您執行手動流程的螢幕畫面，將影片放到桌面上，讓 Copilot CLI 逐格分析以建構可運作的自動化指令碼。支援包含音訊轉錄的旁白錄影。 | 1 個項目 | automation, screen-recording, workflow, video-analysis, process-automation, scripting, productivity, copilot-cli |
| [awesome-copilot](../plugins/awesome-copilot/README.md) | 協助您探索與產生精選 GitHub Copilot Agent、指示、提示及技能的 Meta 提示。 | 4 個項目 | github-copilot, discovery, meta, prompt-engineering, agents |
| [aws-cloud-development](../plugins/aws-cloud-development/README.md) | 全方位的 AWS 雲端開發工具，包含基礎設施即程式碼、無伺服器函式、架構模式以及用於建構具延展性雲端應用程式的成本最佳化。 | 8 個項目 | aws, cloud, infrastructure, cloudformation, terraform, serverless, architecture, devops, cdk |
| [azure-cloud-development](../plugins/azure-cloud-development/README.md) | 全方位的 Azure 雲端開發工具，包含基礎設施即程式碼、無伺服器函式、架構模式以及用於建構具延展性雲端應用程式的成本最佳化。 | 11 個項目 | azure, cloud, infrastructure, bicep, terraform, serverless, architecture, devops |
| [backlog-swipe-triage](../plugins/backlog-swipe-triage/README.md) | 快速滑動瀏覽待辦清單問題，以進行指派、需要資訊、延後、關閉或忽略等分流決策。 | 1 個項目 | agent-assignment, backlog-triage, github-issues, issue-prioritization, swipe-interface, workflow-automation |
| [backrooms-canvas](../plugins/backrooms-canvas/README.md) | 在 Agent 運作時，於 Copilot 畫布中漫步於無盡的第一人稱後室；它們的狀態會如幽靈般浮現於牆面上。 | 1 個項目 | backrooms, copilot-canvas, interactive-canvas, first-person, procedural-generation, session-breaks |
| [cast-imaging](../plugins/cast-imaging/README.md) | 使用 CAST Imaging 進行軟體分析、影響評估、結構品質諮詢及架構審查的專業 Agent 全方位集合。 | 3 個項目 | cast-imaging, software-analysis, architecture, quality, impact-analysis, devops |
| [chat-cards](../plugins/chat-cards/README.md) | GHCP 畫布中的互動式卡片組：分頁卡片、表格、SVG 圖表、顯示/隱藏區段、編號大綱、轉譯的 Markdown 文件、短片，以及提交內容會傳回對話作為提示詞的表單。 | 1 個項目 | interactive-cards, charts, forms, education, visual-explanations |
| [chromium-control-canvas](../plugins/chromium-control-canvas/README.md) | 開啟一個真實的 Chromium 視窗，讓您可以從 Copilot 畫布控制面板與 Agent 動作進行導覽與互動。 | 1 個項目 | browser-control, chromium-browser, interactive-canvas, playwright-automation, screenshots, ui-testing, web-navigation |
| [chronicle-stats](../plugins/chronicle-stats/README.md) | 依日期、模型與工作階段檢視您本機的 Copilot Token 使用量，並取得更具效率的使用提示。 | 1 個項目 | ai-usage, canvas, chronicle, copilot-extension, cost-awareness, insights, productivity, token-usage |
| [clojure-interactive-programming](../plugins/clojure-interactive-programming/README.md) | 適用於 REPL 優先 Clojure 工作流程的工具，具備 Clojure 指示、互動式程式設計聊天模式及支援指引。 | 2 個項目 | clojure, repl, interactive-programming |
| [cms-development](../plugins/cms-development/README.md) | 涵蓋佈景主題、外掛、管理工具、媒體工作流程、Markdown 轉譯與靜態匯出管線的 CMS 開發技能。 | 3 個項目 | cms, content-management-system, wordpress, shopify, drupal, theme, plugin, media, static-site |
| [color-orb](../plugins/color-orb/README.md) | 一個視覺球體，使用者可要求 Agent 為其重新著色，同時在畫布中顯示即時活動記錄。 | 1 個項目 | agent-actions, color-picker, interactive-demo, realtime-updates, sse-events, visual-feedback |
| [context-engineering](../plugins/context-engineering/README.md) | 透過更好的上下文管理將 GitHub Copilot 效益最大化的工具與技術。包含結構化程式碼的指引、用於規劃多檔案變更的 Agent，以及用於上下文感知開發的提示詞。 | 4 個項目 | context, productivity, refactoring, best-practices, architecture |
| [context-matic](../plugins/context-matic/README.md) | 程式碼撰寫 Agent 容易對 API 產生幻覺。ContextMatic 為它們提供經策劃且具版本控制的 API 與 SDK 文件。當您要求 Agent「整合付款 API」時，它往往會胡亂猜測——退回使用過時的訓練資料以及與您實際 SDK 不符的通用模式。ContextMatic 透過在精確需要的時刻為 Agent 提供確定性、具版本感知且 SDK 原生的上下文來解決此問題。 | 2 個項目 | api-context, api-integration, mcp, sdk, apimatic, third-party-apis, sdks |
| [convert-to-md](../plugins/convert-to-md/README.md) | 一組將常見文件格式轉換為 Markdown 的 Copilot Skill，以便精準分析、摘要、搜尋或擷取其內容。只需告訴 Copilot 您的需求——系統會自動呼叫適當的 Skill 並在幕後完成轉換。 | 3 個項目 | skills, configuration, copilot, convert-word-to-md, convert-excel-to-md, convert-pdf-to-md |
| [copilot-sdk](../plugins/copilot-sdk/README.md) | 使用 Microsoft Copilot SDK 建置應用程式，並從 GitHub Copilot SDK 遷移，支援多種程式語言。包含 C#、Go、Node.js/TypeScript 與 Python 的操作指南。 | 1 個項目 | copilot-sdk, sdk, csharp, go, nodejs, typescript, python, ai, github-copilot |
| [csharp-dotnet-development](../plugins/csharp-dotnet-development/README.md) | 適用於 C# 與 .NET 開發的基本提示詞、指示與聊天模式，包含測試、文件與最佳做法。 | 10 個項目 | csharp, dotnet, aspnet, testing |
| [database-data-management](../plugins/database-data-management/README.md) | 適用於 PostgreSQL、SQL Server 的資料庫管理、SQL 最佳化與資料管理工具，以及一般資料庫開發的最佳做法。 | 6 個項目 | database, sql, postgresql, sql-server, dba, optimization, queries, data-management |
| [dataverse-sdk-for-python](../plugins/dataverse-sdk-for-python/README.md) | 用於建構與 Microsoft Dataverse 的正式環境就緒 Python 整合之完整集合。包含官方文件、最佳做法、進階功能、檔案操作與程式碼產生提示詞。 | 4 個項目 | dataverse, python, integration, sdk |
| [demotivational-calendar](../plugins/demotivational-calendar/README.md) | 一個具備日期感知功能的消極日曆畫布，為每個月與每一天提供原創的每日沮喪金句。 | 1 個項目 | calendar, daily, demotivation, humor, offline |
| [devops-oncall](../plugins/devops-oncall/README.md) | 一組專注的提示詞、指示與聊天模式，協助分流事件並使用 DevOps 工具與 Azure 資源迅速回應。 | 3 個項目 | devops, incident-response, oncall, azure |
| [diagram-viewer](../plugins/diagram-viewer/README.md) | 轉譯圖表、按一下節點以向下深入探研，並直接在畫布中檢視 Agent 產生的說明。 | 1 個項目 | architecture-mapping, canvas-navigation, exploratory-analysis, interactive-diagrams, node-drilldown, relationship-visualization |
| [doublecheck](../plugins/doublecheck/README.md) | AI 輸出的三層驗證管線。擷取主張、尋找來源並標記幻覺風險，以便人員在採取行動前進行驗證。 | 2 個項目 | verification, hallucination, fact-check, source-citation, trust, safety |
| [draw](../plugins/draw/README.md) | 在 Copilot 畫布中繪製簡易圖表：形狀、保持連接的箭號、文字以及自由繪製的畫筆。Copilot 能夠讀取、建立與編輯同一份繪圖、整理其版面配置，並將其匯出為 PNG 或 SVG。 | 1 個項目 | architecture-diagrams, canvas, diagrams, drawing, flowcharts, whiteboard |
| [edge-ai-tasks](../plugins/edge-ai-tasks/README.md) | 適用於中進階到專家使用者與大型程式碼庫的任務研究員 (Task Researcher) 與任務規劃員 (Task Planner)——由 microsoft/edge-ai 提供 | 2 個項目 | architecture, planning, research, tasks, implementation |
| [edit-tutorial](../plugins/edit-tutorial/README.md) | 將 Copilot 在工作階段中所做的程式碼編輯轉化為互動式課程：透過變更前後檢視與測驗，逐步引導瀏覽每項變更，接著進行實作練習以變化這些編輯內容，讓您親自完成變更。 | 1 個項目 | agent-edits, code-walkthrough, guided-exercise, interactive-tutorial, learning, onboarding |
| [ember](../plugins/ember/README.md) | AI 夥伴，而非單純的工具。Ember 在人與人之間傳遞薪火——協助人們發現 AI 夥伴關係並非學習得來，而是自然探尋而得。 | 7 個項目 | ai-partnership, coaching, onboarding, collaboration, storytelling, developer-experience |
| [eyeball](../plugins/eyeball/README.md) | 具備內嵌來源螢幕擷取畫面的文件分析。當您要求 Copilot 分析文件時，Eyeball 會產生一個 Word 文件，其中每項事實主張都包含來自來源資料的高亮螢幕擷取畫面，讓您可以親自驗證。 | 1 個項目 | document-analysis, citation-verification, screenshot, contracts, legal, trust, visual-verification |
| [fastah-ip-geo-tools](../plugins/fastah-ip-geo-tools/README.md) | 此外掛程式適用於希望調整並發佈 RFC 8805 格式 IP 地理位置摘要的網路維運工程師。它由一個 AI Skill 和一個相關的 MCP 伺服器組成，可將地理位置地名進行地理編碼以對應到真實城市來確保準確性。 | 1 個項目 | geofeed, ip-geolocation, rfc-8805, rfc-9632, network-operations, isp, cloud, hosting, ixp |
| [feedback-themes](../plugins/feedback-themes/README.md) | 依影響程度探索分組的客戶意見反應訊號，並深入探討主題以指引產品的後續步驟。 | 1 個項目 | customer-feedback, impact-prioritization, product-insights, signal-grouping, theme-analysis, trend-discovery |
| [flight-map-canvas](../plugins/flight-map-canvas/README.md) | 一個 GitHub Copilot 畫布，可產生能使用 3D 控制項探索 Google 地圖的檢視，彷彿飛行模擬器一般。Agent 可以將飛行傳送至任何地方，並回報它們正在處理的工作。 | 1 個項目 | copilot-canvas, flight-simulator, geography, google-maps, interactive-canvas, session-breaks, threejs |
| [flowstudio-power-automate](../plugins/flowstudio-power-automate/README.md) | 透過 FlowStudio MCP 伺服器讓您的 AI Agent 能夠完全掌握 Power Automate 雲端流程。大規模連線、偵錯、建構、監視健康狀態並控管流程——提供動作層級的輸入與輸出，而不僅僅是狀態碼。 | 5 個項目 | power-automate, power-platform, flowstudio, mcp, model-context-protocol, cloud-flows, workflow-automation, monitoring, governance |
| [fluentui-blazor](../plugins/fluentui-blazor/README.md) | 使用 Microsoft Fluent UI Blazor 函式庫建構 Blazor 應用程式。結合了提供正確使用模式（提供者、服務註冊、圖示、對話方塊、資料格線、佈景主題設定）的 fluentui-blazor skill 與官方 Fluent UI Blazor MCP 伺服器，可即時查閱元件、參數、列舉、圖示和文件，並提供 v4 至 v5 移轉指南。 | 1 個項目 | fluentui, blazor, dotnet, components, aspnetcore, mcp, model-context-protocol, migration, icons, theming |
| [foundry-agentic-loop](../plugins/foundry-agentic-loop/README.md) | 在 Microsoft Foundry、GitHub 和 Azure 上建構代理人解決方案。在現有 Foundry 專案中製作原型，或執行規格驅動開發 (SDD)：在事證門檻背後透過 azd 進行規格制定、實作、驗證與部署的動態工作流程。隨附包含 61 個產業提示詞範本庫的畫布、即時工作流程檢視表與 Foundry 啟用功能，再加上可從過往執行中汲取經驗的改進模式。 | 3 個項目 | agentic-loop, microsoft-foundry, azure, hosted-agents, spec-driven-development, rapid-prototyping, dynamic-workflow, canvas, azd, copilot-sdk |
| [foundry-hosted-agent-copilotkit](../plugins/foundry-hosted-agent-copilotkit/README.md) | 在 Microsoft Foundry 託管代理人（Microsoft Agent Framework）上建構 CopilotKit + AG-UI Web 應用程式：串接、Foundry 原生基元、真人介入核准、azd 部署與偵錯 — 並使用 Microsoft Learn 與 Foundry MCP 伺服器進行即時基礎資料支援。 | 1 個項目 | copilotkit, ag-ui, microsoft-foundry, hosted-agents, agent-framework, human-in-the-loop, azure |
| [frontend-web-dev](../plugins/frontend-web-dev/README.md) | 適用於現代前端 Web 開發的基本提示詞、指示與聊天模式，包含 React、Angular、Vue、TypeScript 與 CSS 框架。 | 4 個項目 | frontend, web, react, typescript, javascript, css, html, angular, vue |
| [gem-team](../plugins/gem-team/README.md) | 用於規格驅動開發與自動化驗證的自我學習多代理人協調整體架構。具備更智慧的工具呼叫與更精簡的情境。 | 14 個項目 | multi-agent, orchestration, tdd, testing, e2e, devops, security-audit, code-review, prd, mobile |
| [gesture-review](../plugins/gesture-review/README.md) | 透過即時相機畫面檢閱 Pull Request，並使用比讚/倒讚手勢進行核准或拒絕。 | 1 個項目 | camera-input, gesture-control, github-prs, hands-free, mediapipe, pull-request-review |
| [git-worktree-explorer](../plugins/git-worktree-explorer/README.md) | 透過工作樹、分支、認可以及選用的 GitHub 提取要求情境資訊，將作用中的 Git 存放庫視覺化。 | 1 個項目 | branch-visualization, canvas, commit-history, git, repository-topology, worktrees |
| [github-security](../plugins/github-security/README.md) | 檢閱您工作階段的變更以找出弱點，並修復程式碼掃描警示 | 1 個項目 | security, code-scanning, canvas, ghas, alert, finding |
| [globestudio](../plugins/globestudio/README.md) | 製作點陣世界地圖與 3D 動畫地球儀並將其放入網站中。搭售 globestudio 技能（將設計撰寫為單一設定並嵌入為 iframe、React 元件或 Web 元件）以及託管的 Globestudio MCP 伺服器（提供預設集、分享連結與嵌入程式碼）。免費、MIT 授權、無需 API 金鑰。 | 1 個項目 | globe, maps, dotted-map, 3d-globe, data-visualization, embed, react, web-component, mcp, design |
| [go-mcp-development](../plugins/go-mcp-development/README.md) | 使用官方 github.com/modelcontextprotocol/go-sdk 在 Go 中建構模型情境協定 (MCP) 伺服器的完整工具包。包含最佳做法指示、用於產生伺服器的提示詞，以及提供指引的專家聊天模式。 | 2 個項目 | go, golang, mcp, model-context-protocol, server-development, sdk |
| [java-development](../plugins/java-development/README.md) | 適用於 Java 開發的完整提示詞與指示集合，包含 Spring Boot、Quarkus、測試、文件與最佳做法。 | 4 個項目 | java, springboot, quarkus, jpa, junit, javadoc |
| [java-mcp-development](../plugins/java-mcp-development/README.md) | 使用官方 MCP Java SDK 2.x 在 Java 中建置 Model Context Protocol (MCP) 伺服器。包含可產生伺服器專案的技能，以及提供指引的專家代理程式。 | 2 個項目 | java, mcp, model-context-protocol, mcp-java-sdk, server-development, spring-ai |
| [java-modernization-studio](../plugins/java-modernization-studio/README.md) | 從互動式畫布推動適用於 Java 的 GitHub Copilot 應用程式現代化工作流程：環境整備度、存放庫評估、排定優先順序的計劃與進度、驗證關卡，以及基於存放庫真實產出物的一鍵執行預定義工作。 | 1 個項目 | app-modernization, assessment-dashboard, azure-migration, java-modernization, legacy-java, modernization-cockpit, validation-gates |
| [jupyter-notebooks](../plugins/jupyter-notebooks/README.md) | 在互動式 Copilot 畫布中建立、編輯、執行、儲存及設定檢查點 Jupyter 筆記本。 | 1 個項目 | data-analysis, interactive-notebooks, jupyter, python |
| [kotlin-mcp-development](../plugins/kotlin-mcp-development/README.md) | 使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫在 Kotlin 中建構模型情境協定 (MCP) 伺服器的完整工具包。包含最佳做法指示、用於產生伺服器的提示詞，以及提供指引的專家聊天模式。 | 2 個項目 | kotlin, mcp, model-context-protocol, kotlin-multiplatform, server-development, ktor |
| [mcp-m365-copilot](../plugins/mcp-m365-copilot/README.md) | 為 Microsoft 365 Copilot 建構具備模型情境協定整合之宣告式 Agent 的完整集合 | 4 個項目 | mcp, m365-copilot, declarative-agents, api-plugins, model-context-protocol, adaptive-cards |
| [modernization-workflow](../plugins/modernization-workflow/README.md) | 視覺化並指引適用於 .NET、Java 與 C++ 應用程式存放庫的 GitHub Copilot Modernize CLI Assess、Plan 與 Execute 工作流程。 | 1 個項目 | app-modernization, assessment-dashboard, azure-migration, cpp-modernization, dotnet-modernization, java-modernization, modernization-canvas, modernize-cli |
| [napkin](../plugins/napkin/README.md) | 適用於 Copilot CLI 的視覺化白板協作工具。在瀏覽器中開啟互動式白板，您可以在其中繪圖、繪製草圖並新增便利貼 — 然後將所有內容分享回 Copilot。Copilot 會檢視您的繪圖並以分析、建議與構想進行回覆。 | 1 個項目 | whiteboard, visual, collaboration, brainstorming, non-technical, drawing, sticky-notes, accessibility, copilot-cli, ux |
| [noob-mode](../plugins/noob-mode/README.md) | 適用於非技術背景 Copilot CLI 使用者的白話英文翻譯層。將每個核准提示、錯誤訊息與技術輸出轉換為清晰、無行話的英文，並附帶顏色標示的風險指標。 | 1 個項目 | accessibility, plain-english, non-technical, beginner, translation, copilot-cli, ux |
| [openapi-to-application-csharp-dotnet](../plugins/openapi-to-application-csharp-dotnet/README.md) | 從 OpenAPI 規格產生可用於生產環境的 .NET 應用程式。包含 ASP.NET Core 專案結構建置、控制器產生、Entity Framework 整合以及 C# 最佳做法。 | 2 個項目 | openapi, code-generation, api, csharp, dotnet, aspnet |
| [openapi-to-application-go](../plugins/openapi-to-application-go/README.md) | 從 OpenAPI 規格產生可用於生產環境的 Go 應用程式。包含專案結構建置、處理常式產生、中介軟體設定以及 REST API 的 Go 最佳做法。 | 2 個項目 | openapi, code-generation, api, go, golang |
| [openapi-to-application-java-spring-boot](../plugins/openapi-to-application-java-spring-boot/README.md) | 從 OpenAPI 規格產生可用於生產環境的 Spring Boot 應用程式。包含專案結構建置、REST 控制器產生、服務層組織以及 Spring Boot 最佳做法。 | 2 個項目 | openapi, code-generation, api, java, spring-boot |
| [openapi-to-application-nodejs-nestjs](../plugins/openapi-to-application-nodejs-nestjs/README.md) | 從 OpenAPI 規格產生可用於生產環境的 NestJS 應用程式。包含專案結構建置、控制器與服務產生、TypeScript 最佳做法以及企業級模式。 | 2 個項目 | openapi, code-generation, api, nodejs, typescript, nestjs |
| [openapi-to-application-python-fastapi](../plugins/openapi-to-application-python-fastapi/README.md) | 從 OpenAPI 規格產生可用於生產環境的 FastAPI 應用程式。包含專案結構建置、路由產生、相依性注入 (dependency injection) 以及非同步 API 的 Python 最佳做法。 | 2 個項目 | openapi, code-generation, api, python, fastapi |
| [oracle-to-postgres-migration-expert](../plugins/oracle-to-postgres-migration-expert/README.md) | 用於 .NET 解決方案中 Oracle 至 PostgreSQL 應用程式移轉的專家 Agent。執行程式碼編輯、執行命令並呼叫擴充功能工具，將 .NET/Oracle 資料存取模式移轉至 PostgreSQL。 | 9 個項目 | oracle, postgresql, database-migration, dotnet, sql, migration, integration-testing, stored-procedures |
| [ospo-sponsorship](../plugins/ospo-sponsorship/README.md) | 供開放原始碼計畫辦公室 (OSPO) 透過 GitHub Sponsors、Open Collective 和其他資助平台識別、評估與管理開放原始碼相依性贊助的工具與資源。 | 1 個項目 |  |
| [partners](../plugins/partners/README.md) | 由 GitHub 合作夥伴建立的自訂 Agent | 20 個項目 | devops, security, database, cloud, infrastructure, observability, feature-flags, cicd, migration, performance |
| [pcf-development](../plugins/pcf-development/README.md) | 使用適用於模型導向與畫布應用程式的 Power Apps Component Framework 開發自訂程式碼元件的完整工具包 | 0 個項目 | power-apps, pcf, component-framework, typescript, power-platform |
| [phoenix](../plugins/phoenix/README.md) | 用於 LLM 應用程式偵錯、評估和追蹤的 Phoenix AI 可觀測性技能。包含 CLI 偵錯工具、LLM 評估工作流程以及 OpenInference 追蹤檢測。 | 3 個項目 | phoenix, arize, llm, observability, tracing, evaluation, openinference, instrumentation |
| [php-mcp-development](../plugins/php-mcp-development/README.md) | 使用官方 PHP SDK 透過基於屬性的探索建構 Model Context Protocol 伺服器的完整資源，包含最佳做法、專案產生和專家協助 | 2 個項目 | php, mcp, model-context-protocol, server-development, sdk, attributes, composer |
| [power-apps-code-apps](../plugins/power-apps-code-apps/README.md) | Power Apps Code Apps 開發的完整工具包，包含專案樣板、開發標準，以及透過 Power Platform 整合建構程式碼優先應用程式的專家指引。 | 2 個項目 | power-apps, power-platform, typescript, react, code-apps, dataverse, connectors |
| [power-bi-development](../plugins/power-bi-development/README.md) | 全方位的 Power BI 開發資源，包含資料模型化、DAX 最佳化、效能調校、視覺效果設計、安全性最佳做法，以及用於建構企業級 Power BI 解決方案的 DevOps/ALM 指引。 | 8 個項目 | power-bi, dax, data-modeling, performance, visualization, security, devops, business-intelligence |
| [power-platform-architect](../plugins/power-platform-architect/README.md) | Microsoft Power Platform 的解決方案架構師，將業務需求轉化為可運作的 Power Platform 解決方案架構。 | 1 個項目 | power-platform, power-platform-architect, power-apps, dataverse, power-automate, power-pages, power-bi |
| [power-platform-mcp-connector-development](../plugins/power-platform-mcp-connector-development/README.md) | 開發具有 Model Context Protocol 整合之 Microsoft Copilot Studio 專用 Power Platform 自訂連接器的完整工具包 | 3 個項目 | power-platform, mcp, copilot-studio, custom-connector, json-rpc |
| [pr-artifact-explorer](../plugins/pr-artifact-explorer/README.md) | 瀏覽拉取請求與工作流程執行（包括沒有 PR 的排程及手動執行），並安全地探索 GitHub Actions 成品，包括測試結果、靜態網站、終端機錄影及原始碼檔案。 | 2 個項目 | actions-artifacts, artifact-browser, canvas, copilot-extension, github-actions, pull-requests, test-results |
| [pr-review](../plugins/pr-review/README.md) | 在唯讀畫布中檢閱 GitHub 提取請求（pull request），具備 AI 分組的變更、可展開的 Diff，以及限定於群組、檔案或程式碼片段（hunk）範圍的問題諮詢功能。 | 1 個項目 | canvas, code-review, copilot-extension, pull-request, pull-request-review |
| [project-documenter](../plugins/project-documenter/README.md) | 產生具有 draw.io 架構圖和內嵌影像的 Word (.docx) 輸出的專業專案文件。自動探索任何專案的技術堆疊並產生 Markdown、圖表、PNG 匯出和格式化 Word 文件。 | 3 個項目 | documentation, architecture-diagrams, drawio, word-document, docx, png-images, c4-model, project-summary, auto-discovery |
| [project-planning](../plugins/project-planning/README.md) | 適用於開發團隊的軟體專案規劃、功能拆解、Epic 管理、實作規劃與任務組織的工具與指引。 | 15 個項目 | planning, project-management, epic, feature, implementation, task, architecture, technical-spike |
| [python-mcp-development](../plugins/python-mcp-development/README.md) | 使用官方 MCP Python SDK v2（MCPServer）以 Python 建置 Model Context Protocol (MCP) 伺服器。包含可產生伺服器專案的技能與提供指引的專家代理程式。 | 2 個項目 | python, mcp, model-context-protocol, mcp-python-sdk, server-development |
| [react18-upgrade](../plugins/react18-upgrade/README.md) | 企業級 React 18 移轉工具包，配備專門的代理程式與技能，用於將 React 16/17 類別元件程式碼庫升級至 React 18.3.1。包含稽核員、相依性外科醫生、類別元件移轉專家、自動批次處理修復器以及測試守護者。 | 13 個項目 | react18, react, migration, upgrade, class-components, lifecycle, batching |
| [react19-upgrade](../plugins/react19-upgrade/README.md) | 企業級 React 19 移轉工具包，配備專門的代理程式與技能，用於將 React 18 程式碼庫升級至 React 19。包含稽核員、相依性外科醫生、原始程式碼移轉器以及測試守護者。處理已棄用 API 的移除，包含 ReactDOM.render、forwardRef、defaultProps、舊版 context、字串 refs 等。 | 8 個項目 | react19, react, migration, upgrade, hooks, modern-react |
| [release-notes-showcase](../plugins/release-notes-showcase/README.md) | 撰寫並修飾可隨時發布的發行說明，具備貢獻者重點標註與便於匯出的輸出格式。 | 1 個項目 | changelog, contributor-callouts, email-export, launch-summary, product-updates, release-notes |
| [repo-actions-hub](../plugins/repo-actions-hub/README.md) | 從 Copilot 畫布瀏覽存放庫 GitHub Actions 工作流程、檢查最近的執行記錄，以及手動觸發 workflow_dispatch 執行。 | 1 個項目 | actions, canvas, copilot-extension, github-actions, recent-runs, workflow-dispatch |
| [roundup](../plugins/roundup/README.md) | 自我設定的狀態簡報產生器。從範例學習您的溝通風格、探索您的資料來源，並依需求為任何對象產生草擬更新。 | 2 個項目 | status-updates, briefings, management, productivity, communication, synthesis, roundup, copilot-cli |
| [ruby-mcp-development](../plugins/ruby-mcp-development/README.md) | 在 Ruby 中使用官方 MCP Ruby SDK gem 建構 Model Context Protocol 伺服器的完整工具包，支援 Rails 整合。 | 2 個項目 | ruby, mcp, model-context-protocol, server-development, sdk, rails, gem |
| [rug-agentic-workflow](../plugins/rug-agentic-workflow/README.md) | 用於協調整合軟體交付的三代理程式工作流程，包含協調器加上實作與品管 (QA) 子代理程式。 | 3 個項目 | agentic-workflow, orchestration, subagents, software-engineering, qa |
| [rust-mcp-development](../plugins/rust-mcp-development/README.md) | 在 Rust 中使用官方 rmcp SDK 搭配 async/await、程序巨集和型別安全實作，建構高效能 Model Context Protocol 伺服器。 | 2 個項目 | rust, mcp, model-context-protocol, server-development, sdk, tokio, async, macros, rmcp |
| [salesforce-development](../plugins/salesforce-development/README.md) | 完整的 Salesforce 代理程式開發環境，涵蓋 Apex 與觸發程序、Flow 自動化、Lightning Web 元件、Aura 元件和 Visualforce 頁面。 | 7 個項目 | salesforce, apex, triggers, lwc, aura, flow, visualforce, crm, salesforce-dx |
| [security-best-practices](../plugins/security-best-practices/README.md) | 用於建構安全、可維護且高效能應用程式的安全性架構、無障礙指引、效能最佳化和程式碼品質最佳做法。 | 1 個項目 | security, accessibility, performance, code-quality, owasp, a11y, optimization, best-practices |
| [sentry-triage](../plugins/sentry-triage/README.md) | 在 Copilot 畫布中掃描即時 Sentry 問題，依緊急程度分組，並移交問題以進行追蹤或建立修復 PR。 | 1 個項目 | canvas, copilot-canvas, copilot-extension, error-triage, incident-response, on-call, sentry |
| [signals-dashboard](../plugins/signals-dashboard/README.md) | 即時 Workshop 儀表板，具備代理人訊號、誠實度校準、成本感知工作台設定檔，以及預設關閉的本地委派。 | 1 個項目 | agent-signals, dashboard, multi-agent, coordination, canvas, local-delegation |
| [site-studio](../plugins/site-studio/README.md) | 逐節規劃、草擬並追蹤個人網站 — 一個共享畫布，供您與 Agent 一同編寫內容、檢視進度並審閱每項變更。 | 1 個項目 | agent-collaboration, content-authoring, personal-website, progress-tracking, section-planning, site-builder |
| [skill-image-gen](../plugins/skill-image-gen/README.md) | 直接在您的編碼工作流程中使用 AI 產生影像。支援 OpenAI (gpt-image-2) 和 Google Gemini。自備 API 金鑰 — 該技能將在首次使用時引導您完成設定。 | 1 個項目 | image-generation, openai, gemini, ai, art, sprites, textures, icons |
| [software-engineering-team](../plugins/software-engineering-team/README.md) | 7 個專業 Agent，涵蓋從 UX 設計與架構到安全性與 DevOps 的完整軟體開發生命週期。 | 7 個項目 | team, enterprise, security, devops, ux, architecture, product, ai-ethics |
| [structured-autonomy](../plugins/structured-autonomy/README.md) | 高品質規劃，精簡實作 | 3 個項目 |  |
| [swift-mcp-development](../plugins/swift-mcp-development/README.md) | 在 Swift 中使用官方 MCP Swift SDK 與新式並行功能建構 Model Context Protocol 伺服器的完整集合。 | 2 個項目 | swift, mcp, model-context-protocol, server-development, sdk, ios, macos, concurrency, actor, async-await |
| [technical-spike](../plugins/technical-spike/README.md) | 用於建立、管理和研究技術探究 (Technical Spike) 的工具，以便在進行解決方案的規格制定與實作之前減少未知數和假設。 | 2 個項目 | technical-spike, assumption-testing, validation, research |
| [testing-automation](../plugins/testing-automation/README.md) | 用於撰寫測試、測試自動化和測試驅動開發的完整集合，包含單元測試、整合測試與端對端測試策略。 | 9 個項目 | testing, tdd, automation, unit-tests, integration, playwright, jest, nunit |
| [the-workshop](../plugins/the-workshop/README.md) | 不再充當 AI Agent 之間的總機 — 直接指導團隊。The Workshop 將長時間執行的 AI Agent (工作桌) 放在同一個空間中處理相同工作，各自擁有記憶體與歷程記錄，並共享同一個工作區，讓您直接指導工作而非轉達。 | 7 個項目 | multi-agent, coordination, desks, persistent-memory, agent-signals, developer-experience |
| [tiny-tool-town-submitter](../plugins/tiny-tool-town-submitter/README.md) | 檢查存放庫、提升 Tiny Tool Town 整備度、提交其收錄 Issue，並啟動修復工作。 | 1 個項目 | github-issues, open-source, project-readiness, repository-analysis, submission-workflow, tiny-tool-town |
| [token-pacman](../plugins/token-pacman/README.md) | 將即時工作階段 AI 額度使用量視覺化為小精靈遊戲盤，包含小豆子、鬼魂、水果里程碑以及遊戲結束限制。 | 1 個項目 | ai-credits, copilot-canvas, interactive-canvas, pac-man, quota-tracking, session-usage |
| [typescript-mcp-development](../plugins/typescript-mcp-development/README.md) | 在 TypeScript/Node.js 中使用官方 SDK 建構 Model Context Protocol (MCP) 伺服器的完整工具組。包含最佳做法指示、用於產生伺服器的提示，以及提供指引的專家聊天模式。 | 2 個項目 | typescript, mcp, model-context-protocol, nodejs, server-development |
| [typespec-m365-copilot](../plugins/typespec-m365-copilot/README.md) | 提示、指示與資源的完整集合，用於使用 TypeSpec 建構宣告式 Agent 和 API 外掛程式以擴充 Microsoft 365 Copilot 功能。 | 3 個項目 | typespec, m365-copilot, declarative-agents, api-plugins, agent-development, microsoft-365 |
| [uizze](../plugins/uizze/README.md) | 透過專注的 UIZZE 工作流程、可選的真實畫面佐證，以及實用的完成度檢查，打造符合產品需求的介面。 | 1 個項目 | ui, design, frontend, ios, web, design-review, quality-gate |
| [visual-pr](../plugins/visual-pr/README.md) | 在提取要求說明中擷取、標註並嵌入螢幕擷取畫面和 GIF 動畫示範。包含以 Playwright 為基礎的 UI 擷取、PIL 影像標註、適用於 GitHub 與 Azure DevOps 的 PR 嵌入工作流程，以及可變計時的螢幕錄影。 | 4 個項目 | screenshots, pull-request, before-after, annotations, playwright, gif, screen-recording, visual |
| [where-was-i](../plugins/where-was-i/README.md) | 重建您的開發情境 (分支、提交、未提交的工作、PR 線索)，並觸發繼續提示以迅速繼續工作。 | 1 個項目 | branch-state, developer-context, git-history, interrupt-recovery, pull-request-context, resume-work |
| [windows-app-storage-inspector-cleanup](../plugins/windows-app-storage-inspector-cleanup/README.md) | 檢查 Windows 應用程式儲存空間、了解本機磁碟使用狀況，並安全地將核准的清理項目移至資源回收筒。 | 1 個項目 | app-storage, canvas, cleanup, storage, windows |
| [work-hub](../plugins/work-hub/README.md) | 適用於 GitHub Copilot 的通用跨存放庫控制中心畫布，具備新手引導、焦點規劃、存放庫健全狀況、工作訊號及工作階段清理功能。 | 1 個項目 | cross-repo-dashboard, focus-planning, repo-health, session-cleanup, work-triage, workflow-visibility |
