# Gem Team 多代理人編排外掛程式

一個用於複雜專案執行的模組化多代理人團隊，具有基於 DAG 的規劃、平行執行、TDD 驗證和自動化測試。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install gem-team@awesome-copilot
```

## 包含內容

### 代理人

| 代理人 | 描述 |
|-------|-------------|
| `gem-orchestrator` | 協調多代理人工作流程、委派任務、透過 runSubagent 綜合結果 |
| `gem-researcher` | 研究專家：收集程式碼庫上下文、識別相關檔案/模式、傳回結構化發現 |
| `gem-planner` | 根據研究發現，透過事前分析和任務分解建立基於 DAG 的計畫 |
| `gem-implementer` | 執行 TDD 程式碼變更、確保驗證、維護品質 |
| `gem-chrome-tester` | 透過 Chrome 開發者工具自動化瀏覽器測試、UI/UX 驗證 |
| `gem-devops` | 管理容器、CI/CD 管線和基礎設施部署 |
| `gem-reviewer` | 關鍵任務的安全守門員 — OWASP、秘密、合規性 |
| `gem-documentation-writer` | 產生技術文件、圖表、維護程式碼與文件的一致性 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
