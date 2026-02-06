# 專案規劃與管理延伸模組

適用於開發團隊的軟體專案規劃、功能拆解、Epic 管理、實作規劃和任務組織的工具與指引。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install project-planning@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 描述 |
|---------|-------------|
| `/project-planning:breakdown-feature-implementation` | 用於建立詳細功能實作計劃的提示，遵循 Epoch Monorepo 結構。 |
| `/project-planning:breakdown-feature-prd` | 用於根據 Epic 為新功能建立產品需求文件 (PRD) 的提示。 |
| `/project-planning:breakdown-epic-arch` | 用於根據產品需求文件為 Epic 建立高階技術架構的提示。 |
| `/project-planning:breakdown-epic-pm` | 用於為新 Epic 建立 Epic 產品需求文件 (PRD) 的提示。此 PRD 將作為產生技術架構規範的輸入。 |
| `/project-planning:create-implementation-plan` | 為新功能、重構現有程式碼或升級套件、設計、架構或基礎結構建立新的實作計劃檔案。 |
| `/project-planning:update-implementation-plan` | 使用新需求或更新需求來更新現有的實作計劃檔案，以提供新功能、重構現有程式碼或升級套件、設計、架構或基礎結構。 |
| `/project-planning:create-github-issues-feature-from-implementation-plan` | 使用 feature_request.yml 或 chore_request.yml 範本根據實作計劃階段建立 GitHub Issue。 |
| `/project-planning:create-technical-spike` | 建立限時的技術研究 (Technical Spike) 文件，用於在實作前研究並解決關鍵的開發決策。 |

### Agent

| Agent | 描述 |
|-------|-------------|
| `task-planner` | 用於建立具體可執行實作計劃的任務規劃員 - 由 microsoft/edge-ai 提供 |
| `task-researcher` | 專門用於全面專案分析的任務研究專家 - 由 microsoft/edge-ai 提供 |
| `planner` | 為新功能或重構現有程式碼產生實作計劃。 |
| `plan` | 策略規劃與架構助手，專注於實作前的深思慮分析。協助開發人員理解程式碼庫、釐清需求，並制定全面的實作策略。 |
| `prd` | 以 Markdown 格式產生全面的產品需求文件 (PRD)，詳述使用者故事、驗收標準、技術考量和指標。可選擇在使用者確認後建立 GitHub Issue。 |
| `implementation-plan` | 為新功能或重構現有程式碼產生實作計劃。 |
| `research-technical-spike` | 透過詳盡的調查和受控的實驗，系統地研究並驗證技術研究文件。 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
