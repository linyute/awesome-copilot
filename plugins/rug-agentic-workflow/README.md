# RUG 代理式工作流程外掛程式 (RUG Agentic Workflow Plugin)

用於協調軟體交付的三代理程式工作流程，包含一個調度員 (orchestrator) 以及實作與 QA 子代理程式 (subagent)。

## 安裝 (Installation)

```bash
# 使用 Copilot CLI
copilot plugin install rug-agentic-workflow@awesome-copilot
```

## 包含內容 (What's Included)

### 代理程式 (Agents)

| 代理程式 | 描述 |
|-------|-------------|
| `rug-orchestrator` | 純調度代理程式，負責拆解請求、將所有工作委派給子代理程式、驗證結果並重複執行直到完成。 |
| `swe-subagent` | 用於實作任務的資深軟體工程師子代理程式：功能開發、除錯、重構與測試。 |
| `qa-subagent` | 用於測試計畫、尋找錯誤、邊緣案例分析與實作驗證的細緻 QA 子代理程式。 |

## 來源 (Source)

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權 (License)

MIT
