# 專案規劃與管理外掛程式

適用於開發團隊的軟體專案規劃、功能拆解、Epic 管理、實作規劃以及工作組織的工具與指引。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install project-planning@awesome-copilot
```

## 包含內容

### 命令 (斜線命令)

| 命令 | 描述 |
|---------|-------------|
| `/project-planning:breakdown-feature-implementation` | 建立詳細功能實作計畫的提示，遵循 Epoch monorepo 架構。 |
| `/project-planning:breakdown-feature-prd` | 根據 Epic 建立新功能產品需求文件 (PRD) 的提示。 |
| `/project-planning:breakdown-epic-arch` | 根據產品需求文件為 Epic 建立高階技術架構的提示。 |
| `/project-planning:breakdown-epic-pm` | 為新 Epic 建立 Epic 產品需求文件 (PRD) 的提示。此 PRD 將作為產生技術架構規格的輸入。 |
| `/project-planning:create-implementation-plan` | 為新功能、重構現有程式碼或升級套件、設計、架構或基礎架構建立新的實作計畫檔案。 |
| `/project-planning:update-implementation-plan` | 以全新或更新的需求來更新現有實作計畫檔案，以提供新功能、重構現有程式碼或升級套件、設計、架構或基礎架構。 |
| `/project-planning:create-github-issues-feature-from-implementation-plan` | 使用 feature_request.yml 或 chore_request.yml 範本從實作計畫階段建立 GitHub Issue。 |
| `/project-planning:create-technical-spike` | 建立具備時限的技術探討 (technical spike) 文件，以便在實作前研究並解決關鍵開發決策。 |

### Agents

| Agent | 描述 |
|-------|-------------|
| `task-planner` | 用於建立可據以執行之實作計畫的工作規劃工具 — 由 microsoft/edge-ai 提供 |
| `task-researcher` | 負責全方位專案分析的工作研究專家 — 由 microsoft/edge-ai 提供 |
| `planner` | 為新功能或重構現有程式碼產生實作計畫。 |
| `plan` | 策略規劃與架構助理，專注於實作前的深思熟慮分析。協助開發人員了解程式碼庫、釐清需求並制定全方位的實作策略。 |
| `prd` | 以 Markdown 格式產生全方位的產品需求文件 (PRD)，詳細說明使用者故事、驗收準則、技術考量與指標。在使用者確認後可選擇建立 GitHub Issue。 |
| `implementation-plan` | 為新功能或重構現有程式碼產生實作計畫。 |
| `research-technical-spike` | 透過詳盡調查與對照實驗，系統化地研究並驗證技術探討 (technical spike) 文件。 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
