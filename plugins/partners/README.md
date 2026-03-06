# 合作夥伴外掛程式 (Partners Plugin)

由 GitHub 合作夥伴建立的自訂代理程式

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install partners@awesome-copilot
```

## 包含內容 (What's Included)

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `amplitude-experiment-implementation` | 此自訂代理程式使用 Amplitude 的 MCP 工具在 Amplitude 內部署新實驗，實現無縫的變體測試功能與產品功能的推出。 |
| `apify-integration-expert` | 將 Apify Actors 整合到程式碼庫中的專家代理程式。處理 Actor 選擇、工作流程設計、跨 JavaScript/TypeScript 與 Python 的實作、測試以及生產等級部署。 |
| `arm-migration` | Arm 雲端遷移助手加速將 x86 工作負載移至 Arm 基礎架構。它會掃描儲存庫中的架構假設、移植問題、容器基礎映像檔與相依項目不相容性，並建議針對 Arm 最佳化的變更。它可以驅動多架構容器建構、驗證效能並引導最佳化，直接在 GitHub 內實現平滑的跨平台部署。 |
| `diffblue-cover` | 使用 Diffblue Cover 為 Java 應用程式建立單元測試的專家代理程式。 |
| `droid` | 為 Droid CLI 提供安裝指引、使用範例與自動化模式，重點在於用於 CI/CD 與非互動式自動化的 droid exec |
| `dynatrace-expert` | Dynatrace 專家代理程式將觀測能力與安全性功能直接整合到 GitHub 工作流程中，使開發團隊能夠透過自主分析追蹤、記錄與 Dynatrace 發現，來調查事件、驗證部署、分級錯誤、偵測效能迴歸、驗證版本並管理安全性弱點。這使得能夠直接在儲存庫中針對已識別的問題進行精確的補救。 |
| `elasticsearch-observability` | 我們的專家 AI 助手，用於除錯程式碼 (O11y)、最佳化向量搜尋 (RAG)，並使用即時 Elastic 資料補救安全性威脅。 |
| `jfrog-sec` | 用於自動化安全性補救的專用應用程式安全性代理程式。驗證套件與版本合規性，並使用 JFrog 安全性情資建議弱點修復。 |
| `launchdarkly-flag-cleanup` | 專業的 GitHub Copilot 代理程式，使用 LaunchDarkly MCP 伺服器安全地自動化功能旗標 (feature flag) 清除工作流程。此代理程式確定移除就緒性、識別正確的前向值，並建立 PR 以在移除過時旗標與更新過時預設值的同時保留生產行為。 |
| `lingodotdev-i18n` | 使用系統化、查核表驅動的方法在網頁應用程式中實作國際化 (i18n) 的專家。 |
| `monday-bug-fixer` | 從 Monday.com 平台資料強化任務情境的精英除錯代理程式。收集相關項目、文件、評論、epic 與需求，以透過全面的 PR 交付生產等級的修復。 |
| `mongodb-performance-advisor` | 分析 MongoDB 資料庫效能，提供查詢與索引最佳化見解，並提供具體建議以改善資料庫的整體用法。 |
| `neo4j-docker-client-generator` | 從具備適當最佳實務的 GitHub issue 產生簡單、高品質 Python Neo4j 用戶端函式庫的 AI 代理程式 |
| `neon-migration-specialist` | 使用 Neon 的分支工作流程實現零停機時間的安全性 Postgres 遷移。在隔離的資料庫分支中測試結構定義變更，進行徹底驗證，然後套用至生產環境 — 全部自動化並支援 Prisma、Drizzle 或您喜愛的 ORM。 |
| `neon-optimization-analyzer` | 使用 Neon 的分支工作流程自動識別並修復緩慢的 Postgres 查詢。分析執行計畫，在隔離的資料庫分支中測試最佳化，並透過具體的程式碼修復提供清晰的前後效能指標。 |
| `octopus-deploy-release-notes-mcp` | 在 Octopus Deploy 中為版本產生發行說明。此 MCP 伺服器的工具提供了對 Octopus Deploy API 的存取。 |
| `stackhawk-security-onboarding` | 使用產生的組態與 GitHub Actions 工作流程，為您的儲存庫自動設定 StackHawk 安全性測試 |
| `terraform` | 具備自動化 HCP Terraform 工作流程的 Terraform 基礎架構專家。利用 Terraform MCP 伺服器進行登錄檔整合、工作區管理與執行協調。使用最新的供應商/模組版本產生合規程式碼，管理私有登錄檔，自動化變數集，並透過適當的驗證與安全性實務協調基礎架構部署。 |
| `pagerduty-incident-responder` | 透過分析事件情境、識別最近的程式碼變更並透過 GitHub PR 建議修復來回應 PagerDuty 事件。 |
| `comet-opik` | 統一的 Comet Opik 代理程式，用於檢測 LLM 應用程式、管理提示/專案、審核提示，並透過最新的 Opik MCP 伺服器調查追蹤/指標。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
