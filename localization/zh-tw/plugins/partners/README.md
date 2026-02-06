# 合作夥伴延伸模組

由 GitHub 合作夥伴建立的自訂 Agent

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install partners@awesome-copilot
```

## 包含內容

### Agent

| Agent | 描述 |
|-------|-------------|
| `amplitude-experiment-implementation` | 此自訂 Agent 使用 Amplitude 的 MCP 工具在 Amplitude 內部署新的實驗，實現無縫的變體測試功能和產品功能推布。 |
| `apify-integration-expert` | 將 Apify Actor 整合到程式碼庫的專家 Agent。處理 Actor 選擇、工作流設計、跨 JavaScript/TypeScript 和 Python 的實作、測試以及生產級部署。 |
| `arm-migration` | Arm 雲端遷移助手可加速將 x86 工作負載移動到 Arm 基礎結構。它會掃描存放庫中的架構假設、移植問題、容器基礎映像和相依性不相容性，並建議針對 Arm 最佳化的變更。它可以驅動多架構容器建置、驗證效能並引導最佳化，從而在 GitHub 內部直接實現順暢的跨平台部署。 |
| `diffblue-cover` | 使用 Diffblue Cover 為 Java 應用程式建立單元測試的專家 Agent。 |
| `droid` | 提供 Droid CLI 的安裝指引、使用範例和自動化模式，重點在於用於 CI/CD 和非互動式自動化的 droid exec |
| `dynatrace-expert` | Dynatrace 專家 Agent 將觀測能力和安全性功能直接整合到 GitHub 工作流中，使開發團隊能夠透過自主分析追蹤、記錄和 Dynatrace 發現結果來調查事件、驗證部署、分類錯誤、偵測效能迴歸、驗證版本並管理安全性漏洞。這可以在存放庫中直接對識別出的問題進行有針對性且精確的修復。 |
| `elasticsearch-observability` | 我們的專家級 AI 助手，用於調試程式碼 (O11y)、最佳化向量搜尋 (RAG)，並使用即時 Elastic 資料修復安全性威脅。 |
| `jfrog-sec` | 用於自動化安全性修復的專屬應用程式安全性 Agent。驗證套件和版本合規性，並使用 JFrog 安全性情資建議弱點修補程式。 |
| `launchdarkly-flag-cleanup` | 專門的 GitHub Copilot Agent，使用 LaunchDarkly MCP 伺服器安全地自動化功能旗標 (Feature Flag) 清理工作流。此 Agent 會確定移除準備就緒情況、識別正確的前進值，並建立 PR，在移除過時旗標和更新陳舊預設值的同時保留生產行為。 |
| `lingodotdev-i18n` | 使用系統化、核取清單驅動的方法在網頁應用程式中實作國際化 (i18n) 的專家。 |
| `monday-bug-fixer` | 精銳的錯誤修復 Agent，可從 Monday.com 平台資料豐富任務內容。收集相關項目、文件、評論、Epic 和需求，以提供具有完整 PR 的生產級修復。 |
| `mongodb-performance-advisor` | 分析 MongoDB 資料庫效能，提供查詢和索引最佳化洞察，並提供具體建議以改善資料庫的整體使用。 |
| `neo4j-docker-client-generator` | 根據 GitHub Issue 產生簡單、高品質且符合正確最佳做法的 Python Neo4j 用戶端函式庫的 AI Agent |
| `neon-migration-specialist` | 使用 Neon 的分支工作流進行安全且零停機時間的 Postgres 遷移。在隔離的資料庫分支中測試結構描述變更、進行全面驗證，然後套用到生產環境——全部自動化，並支援 Prisma、Drizzle 或您偏好的 ORM。 |
| `neon-optimization-analyzer` | 使用 Neon 的分支工作流自動識別並修復緩慢的 Postgres 查詢。分析執行計劃，在隔離的資料庫分支中測試最佳化，並提供具有具體程式碼修復的清晰前後效能指標。 |
| `octopus-deploy-release-notes-mcp` | 為 Octopus Deploy 中的版本產生版本資訊。此 MCP 伺服器的工具提供對 Octopus Deploy API 的存取。 |
| `stackhawk-security-onboarding` | 透過產生的設定和 GitHub Actions 工作流，為您的存放庫自動設定 StackHawk 安全性測試 |
| `terraform` | 具有自動化 HCP Terraform 工作流的 Terraform 基礎結構專家。利用 Terraform MCP 伺服器進行登錄檔整合、工作區管理和執行協調。使用最新的供應商/模組版本產生合規的程式碼、管理私有登錄檔、自動化變數集，並透過正確的驗證和安全性做法協調基礎結構部署。 |
| `pagerduty-incident-responder` | 透過分析突發事件內容、識別最近的程式碼變更並透過 GitHub PR 建議修復方案來回應 PagerDuty 突發事件。 |
| `comet-opik` | 用於檢測 LLM 應用程式、管理提示/專案、稽核提示，以及透過最新的 Opik MCP 伺服器調查追蹤/指標的統一 Comet Opik Agent。 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
