# 合作夥伴外掛程式

由 GitHub 合作夥伴建立的自訂 Agent

## 安裝

```bash
# Using Copilot CLI
copilot plugin install partners@awesome-copilot
```

## 內含項目

### Agent

| Agent | 說明 |
|-------|-------------|
| `amplitude-experiment-implementation` | 此自訂 Agent 使用 Amplitude 的 MCP 工具在 Amplitude 內部署新實驗，實現無縫的變體測試功能與產品功能推出。 |
| `apify-integration-expert` | 將 Apify Actors 整合至程式碼庫的專家 Agent。處理 Actor 選取、工作流程設計、跨 JavaScript/TypeScript 和 Python 的實作、測試以及可用於生產環境的部署。 |
| `arm-migration` | Arm 雲端移轉助理可加速將 x86 工作負載移轉至 Arm 基礎結構。它會掃描存放庫中的架構假設、可攜性問題、容器基底映像檔與相依性不相容性，並建議針對 Arm 最佳化的變更。它可以推動多架構容器建構、驗證效能並引導最佳化，直接在 GitHub 內實現順暢的跨平台部署。 |
| `diffblue-cover` | 使用 Diffblue Cover 為 Java 應用程式建立單元測試的專家 Agent。 |
| `droid` | 提供 Droid CLI 的安裝指引、使用範例和自動化模式，重點在於用於 CI/CD 和非互動式自動化的 droid exec |
| `dynatrace-expert` | Dynatrace 專家 Agent 將可觀測性與安全性功能直接整合到 GitHub 工作流程中，使開發團隊能夠透過自主分析追蹤、記錄和 Dynatrace 調查結果來調查事件、驗證部署、分類分流錯誤、偵測效能退化、驗證版本發佈以及管理安全性弱點。這使得能夠直接在存放庫內針對已識別的問題進行針對性且精準的修復。 |
| `elasticsearch-observability` | 我們的專家 AI 助手，用於偵錯程式碼 (O11y)、最佳化向量搜尋 (RAG)，以及使用即時 Elastic 資料修復安全性威脅。 |
| `jfrog-sec` | 專門用於自動化安全性修復的應用程式安全性 Agent。驗證套件與版本合規性，並使用 JFrog 安全情報提供弱點修復建議。 |
| `launchdarkly-flag-cleanup` | 專門的 GitHub Copilot Agent，使用 LaunchDarkly MCP 伺服器安全地自動化功能旗標清除工作流程。此 Agent 會判定移除準備程度、識別正確的前向值，並建立 PR 以在移除過時旗標和更新陳舊預設值的同時保留生產環境行為。 |
| `lingodotdev-i18n` | 使用系統化、檢查清單驅動的方法在 Web 應用程式中實作國際化 (i18n) 的專家。 |
| `monday-bug-fixer` | 精英錯誤修復 Agent，從 Monday.com 平台資料豐富任務情境。收集相關項目、文件、註解、Epic 與需求，以透過全方位的 PR 提供生產環境品質的修復。 |
| `mongodb-performance-advisor` | 分析 MongoDB 資料庫效能，提供查詢和索引最佳化見解，並提供切實可行的建議以改善資料庫的整體使用情況。 |
| `neo4j-docker-client-generator` | AI Agent，可依據 GitHub issue 遵循適當的最佳做法產生簡潔、高品質的 Python Neo4j 用戶端函式庫 |
| `neon-migration-specialist` | 使用 Neon 的分支工作流程進行零停機時間的安全 Postgres 移轉。在隔離的資料庫分支中測試結構描述變更，進行全面驗證，然後套用至生產環境 — 全部自動化，並支援 Prisma、Drizzle 或您喜愛的 ORM。 |
| `neon-optimization-analyzer` | 使用 Neon 的分支工作流程自動識別並修正緩慢的 Postgres 查詢。分析執行計畫，在隔離的資料庫分支中測試最佳化，並透過可執行的程式碼修正提供清晰的前後效能指標。 |
| `octopus-deploy-release-notes-mcp` | 為 Octopus Deploy 中的版本發佈產生版本資訊。此 MCP 伺服器的工具提供對 Octopus Deploy API 的存取權限。 |
| `stackhawk-security-onboarding` | 透過產生的設定與 GitHub Actions 工作流程，自動為您的存放庫設定 StackHawk 安全性測試 |
| `terraform` | 具備自動化 HCP Terraform 工作流程的 Terraform 基礎結構專家。利用 Terraform MCP 伺服器進行登錄表整合、工作區管理和執行協調。使用最新的提供者/模組版本產生合規程式碼、管理私人登錄表、自動化變數集，並透過適當的驗證與安全實踐協調整體基礎結構部署。 |
| `pagerduty-incident-responder` | 透過分析事件情境、識別最近的程式碼變更，並透過 GitHub PR 建議修正方案來回應 PagerDuty 事件。 |
| `comet-opik` | 統一的 Comet Opik Agent，用於檢測 LLM 應用程式、管理提示/專案、稽核提示，並透過最新的 Opik MCP 伺服器調查追蹤/指標。 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個由社群驅動的 GitHub Copilot 擴充功能集合。

## 授權條款

MIT
