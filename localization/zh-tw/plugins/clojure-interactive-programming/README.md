# Clojure 互動式程式設計延伸模組

用於 REPL 優先 Clojure 工作流的工具，具有 Clojure 指令、互動式程式設計對話模式及支援指引。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install clojure-interactive-programming@awesome-copilot
```

## 包含內容

### 指令 (斜線指令)

| 指令 | 描述 |
|---------|-------------|
| `/clojure-interactive-programming:remember-interactive-programming` | 一個微型提示，提醒 Agent 它是一位互動式程式設計師。當 Copilot 可以存取 REPL 時（可能透過 Backseat Driver），在 Clojure 中運作良好。適用於 Agent 可以使用的任何具有即時 REPL 的系統。根據您的工作流和/或工作區中的任何特定提醒來調整提示。 |

### Agent

| Agent | 描述 |
|-------|-------------|
| `clojure-interactive-programming` | 專家級 Clojure 結對程式設計師，採用 REPL 優先方法論、架構監督和互動式問題解決。強制執行品質標準，防止權宜措施，並在修改檔案之前透過即時 REPL 評估逐步開發解決方案。 |

## 來源

此延伸模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

## 授權

MIT
