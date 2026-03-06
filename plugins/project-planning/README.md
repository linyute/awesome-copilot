# 專案規劃與管理外掛程式 (Project Planning & Management Plugin)

為開發團隊提供的軟體專案規劃、功能拆解、epic 管理、實作規劃與任務組織工具與指引。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install project-planning@awesome-copilot
```

## 包含內容 (What's Included)

### 指令 (斜線指令) (Commands (Slash Commands))

| 指令 | 描述 |
|---------|-------------|
| `/project-planning:breakdown-feature-implementation` | 用於建立詳細功能實作計畫的提示，遵循 Epoch monorepo 結構。 |
| `/project-planning:breakdown-feature-prd` | 根據 Epic 建立新功能產品需求文件 (PRD) 的提示。 |
| `/project-planning:breakdown-epic-arch` | 根據產品需求文件為 Epic 建立高階技術架構的提示。 |
| `/project-planning:breakdown-epic-pm` | 為新 Epic 建立 Epic 產品需求文件 (PRD) 的提示。此 PRD 將作為產生技術架構規格的輸入。 |
| `/project-planning:create-implementation-plan` | 為新功能、重構現有程式碼或升級套件、設計、架構或基礎架構建立新的實作計畫檔案。 |
| `/project-planning:update-implementation-plan` | 使用新需求或更新需求來更新現有的實作計畫檔案，以提供新功能、重構現有程式碼或升級套件、設計、架構或基礎架構。 |
| `/project-planning:create-github-issues-feature-from-implementation-plan` | 使用 feature_request.yml 或 chore_request.yml 範本從實作計畫階段建立 GitHub Issues。 |
| `/project-planning:create-technical-spike` | 建立限時的技術探針 (technical spike) 文件，用於在實作前研究並解決關鍵開發決策。 |

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `task-planner` | 用於建立具體執行計畫的任務規劃員 — 由 microsoft/edge-ai 提供 |
| `task-researcher` | 用於全面專案分析的任務研究專家 — 由 microsoft/edge-ai 提供 |
| `planner` | 為新功能或重構現有程式碼產生實作計畫。 |
| `plan` | 戰略規劃與架構助手，專注於實作前的周全分析。協助開發人員瞭解程式碼庫、釐清需求並制定全面的實作策略。 |
| `prd` | 以 Markdown 格式產生全面的產品需求文件 (PRD)，詳述使用者故事、驗收標準、技術考量與指標。可選擇在使用者確認後建立 GitHub issue。 |
| `implementation-plan` | 為新功能或重構現有程式碼產生實作計畫。 |
| `research-technical-spike` | 透過詳盡的調查與受控實驗，系統地研究並驗證技術探針文件。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
