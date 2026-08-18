# AI Team Orchestration

執行一個輕量級、角色分離的 AI 開發團隊，具備靈活的工具、開發人員選定的模型、適度的規劃以及選用的 QA。

## 包含內容

### Agent

| Agent | 提及方式 | 角色 |
|---|---|---|
| **Producer** (Remy) | `@ai-team-producer` | 範疇、規劃、協調、分流分類與合併 |
| **Dev Team** (Nova, Sage, Milo) | `@ai-team-dev` | 適應技術堆疊的實作、測試、自我審查與 Pull Request |
| **QA** (Ivy) | `@ai-team-qa` | 選用性的獨立行為測試與修復驗證 |

這些 agent 刻意省略了 `tools` 和 `model` frontmatter。它們會繼承開發人員啟用的內建工具、MCP 和擴充功能工具，並使用開發人員選定的模型。角色界限仍維持在指示以及正常的權限與核准控制機制中。

### 技能

`/ai-team-orchestration` 提供：

- 精簡的專案概要範本；
- 適度的工作計畫範本；
- 具備不同觀點的腦力激盪指引；
- 適用於多 agent 工作的實用反模式。

## 預設工作流程

```text
Plan -> Implement -> Test -> optional review or QA -> Merge -> update project state
```

使用符合工作需求的最輕量流程。小型變更可直接進行；實質性或具風險的變更則可受益於簡短的計畫、獨立審查或專責的 QA。

## 快速入門

### 規劃

```text
@ai-team-producer Help me define the next useful outcome for this project.
Use /ai-team-orchestration and keep planning proportional to the work.
```

### 實作

```text
@ai-team-dev Read the repository instructions and active plan or issue.
Implement the requested outcome, run relevant checks, self-review the diff,
and prepare the pull request. Do not merge.
```

### 選用 QA

```text
@ai-team-qa Test the pull request against its acceptance criteria.
Focus on important behavior and regressions. Report Ready, Ready with minor
follow-ups, or Blocked with reproducible findings.
```

## 原則

- Producer 負責協調，但從不實作應用程式程式碼。
- Dev 負責實作與驗證，但從不合併或宣稱獨立核准。
- QA 為選用項目，獨立驗證行為而無需修復應用程式原始碼。
- 儲存庫貢獻原則與平台保護機制定義了 Git 和合併行為。
- 重要情境與錯誤應留存在持久的專案檔案或問題追蹤器中，而非僅存在於聊天中。

## 起源

此外掛程式源自於 [Arcade After Dark](https://github.com/denis-a-evdokimov/guess-and-get)，這是一個透過不同規劃、實作、設計和 QA 視角所建構的多 agent 專案。
