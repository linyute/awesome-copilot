# Gem Team 多 Agent 編排外掛程式

一個用於複雜專案執行的模組化多 Agent 團隊，具備基於 DAG 的規劃、平行執行、TDD 驗證及自動化測試功能。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install gem-team@awesome-copilot
```

## 包含內容

### Agent

| Agent | 說明 |
|-------|-------------|
| `gem-orchestrator` | 團隊領導者 - 以充滿活力的公告協調多 Agent 工作流程、委派任務，並透過 runSubagent 綜合結果 |
| `gem-researcher` | 研究專家：收集程式碼庫內容、識別相關檔案/模式，並傳回結構化發現 |
| `gem-planner` | 根據研究發現，透過事前分析 (pre-mortem analysis) 和任務分解建立基於 DAG 的計劃 |
| `gem-implementer` | 執行 TDD 程式碼變更，確保驗證，並維護品質 |
| `gem-browser-tester` | 使用 Chrome DevTools MCP、Playwright、Agent Browser 自動化 E2E 場景。使用瀏覽器自動化工具和視覺驗證技術進行 UI/UX 驗證 |
| `gem-devops` | 管理容器、CI/CD 管線和基礎架構部署 |
| `gem-reviewer` | 關鍵任務的安全性守門員 — OWASP、秘密 (secrets)、合規性 |
| `gem-documentation-writer` | 產生技術文件、圖表，並維護程式碼與文件的一致性 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個由社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
