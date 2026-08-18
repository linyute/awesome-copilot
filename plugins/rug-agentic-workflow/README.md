# RUG Agentic Workflow 外掛程式

由協調器加上實作與品管 (QA) 子 agent 組成的三 agent 工作流程，用於協調軟體交付。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install rug-agentic-workflow@awesome-copilot
```

## 包含內容

### Agents

| Agent | 描述 |
|-------|-------------|
| `rug-orchestrator` | 純協調 agent，負責拆解請求、將所有工作委派給子 agent、驗證結果，並重複此流程直到完成。 |
| `swe-subagent` | 資深軟體工程師子 agent，負責實作工作：功能開發、除錯、重構與測試。 |
| `qa-subagent` | 嚴謹的品管 (QA) 子 agent，負責測試規劃、尋找錯誤、邊界案例分析與實作驗證。 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
