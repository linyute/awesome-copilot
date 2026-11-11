# 執行階段 Skills 目錄 (Run skills catalog)

可重複使用的**執行階段 (run-phase)** agent skills。與[建置 skills 目錄](build-skills-catalog.md)（安裝用來協助*建構*應用程式的 skills）不同，這些是 **agent 本身在執行時期所執行**的 skills。

**重複使用，而非重新產生。** 當提示詞**明確指名**這些 skills 之一時，將其重複使用為 `./skills/<skill-name>/` 中的本機編寫成品，接著使用目前的 `microsoft-foundry` 指引與支援的命令發佈/更新其受控管版本並將其附加至 agent 的 toolbox。驗證 agent 是否載入並使用該版本。同時亦可重複使用此目錄之外明確提供的來源。若指定的來源無法解析，請詢問而非無提示地產生替代項目；僅在真正為全新 skill 或使用者核准替換時才編寫新 skill。

這是一組入門範例，而非詳盡無遺的清單。

| 存放庫 (Repository)       | Skill                            | 當提示詞明確指名以下項目時重複使用 |
| ------------------------- | -------------------------------- | -------------------------------------- |
| `github/awesome-copilot` | `eyeball`                        | 視覺化檢查轉譯的 UI 或螢幕截圖，並回報畫面內容或不合規格之處 |
| `github/awesome-copilot` | `finalize-agent-prompt`          | 潤飾並定稿 agent 的系統 / 指示提示詞 |
| `github/awesome-copilot` | `gtm-enterprise-account-planning`| 建立企業進入市場客戶計畫 |
| `github/awesome-copilot` | `gtm-product-led-growth`         | 規劃產品主導成長 (PLG) 進入市場策略 |
| `github/awesome-copilot` | `incident-postmortem`            | 草擬結構化事件檢討報告 (時間軸、影響、根本原因、行動項目) |
| `github/awesome-copilot` | `linkedin-post-formatter`        | 將內容格式化為適合 LinkedIn 發佈的貼文 |
| `github/awesome-copilot` | `md-to-docx`                     | 將 Markdown 轉換為 DOCX 文件 |
| `github/awesome-copilot` | `roundup`                        | 將多個來源或項目摘要為單一綜述 |
| `github/awesome-copilot` | `tldr-prompt`                    | 為長篇內容產生簡明扼要的重點摘要 (TL;DR) |
| `aiappsgbb/agentic-loop`  | `factory-operations-triage`     | 針對智慧工廠異常、維護訊號與品質偏差進行分流，並附帶具證據佐證的操作員行動 |
| `aiappsgbb/agentic-loop`  | `production-flow-optimizer`     | 診斷生產瓶頸並提出安全、考量條件限制的流程與排班計畫 |
| `aiappsgbb/agentic-loop`  | `care-gap-outreach-planner`     | 排定照護缺口優先順序並準備考量同意權的病患外展服務，而不做出臨床決策 |
| `aiappsgbb/agentic-loop`  | `post-discharge-care-coordinator` | 出院後協調追蹤任務、病患回應與基於規則的呈報流程 |
| `aiappsgbb/agentic-loop`  | `loan-file-readiness-reviewer`  | 審核貸款檔案的完整性、一致性、新鮮度與可追溯的例外狀況 |
| `aiappsgbb/agentic-loop`  | `mortgage-underwriting-coordinator` | 彙整證據、條件與合規檢查以供人工房貸核保審查 |

針對宣告存放庫的目錄內 skills，向使用者說明來源存放庫，然後使用與建置 skills 相同的命令進行安裝：

```bash
gh skill install <repository> <skill> --agent github-copilot --scope project
```

在 skill 本機就緒後，在 Foundry 上建立它、進行版本控管並將其附加至 toolbox。
