# Clojure Interactive Programming 外掛程式

用於 REPL 優先 Clojure 工作流程的工具，包含 Clojure 指示、互動式程式設計聊天模式及支援指引。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install clojure-interactive-programming@awesome-copilot
```

## 包含內容

### 指令（斜線指令）

| 指令 | 說明 |
|---------|-------------|
| `/clojure-interactive-programming:remember-interactive-programming` | 提醒 agent 其為互動式程式設計師的微提示。當 Copilot 可以存取 REPL（可能透過 Backseat Driver）時，在 Clojure 中效果極佳。適用於任何具有 agent 可使用的即時 REPL 系統。可根據工作流程及/或工作區中的任何特定提醒調整此提示。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `clojure-interactive-programming` | 具備 REPL 優先方法論、架構監督與互動式問題解決能力的 Clojure 專家配對程式設計師。強制執行品質標準、避免權宜作法，並在修改檔案之前透過即時 REPL 評估循序漸進地開發解決方案。 |

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot)（GitHub Copilot 擴充功能的社群驅動集合）的一部分。

## 授權條款

MIT
