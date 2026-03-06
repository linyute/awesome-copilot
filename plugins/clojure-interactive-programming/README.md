# Clojure 互動式程式設計外掛程式

用於 REPL 優先的 Clojure 工作流程工具，包含 Clojure 指引、互動式程式設計聊天模式以及支援指引。
## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install clojure-interactive-programming@awesome-copilot
```
## 包含內容
### 命令 (斜線命令)

| 命令 | 說明 |
|---------|-------------|
| `/clojure-interactive-programming:remember-interactive-programming` | 一個微提示詞，提醒 Agent 它是一位互動式程式設計師。當 Copilot 可以存取 REPL (可能透過 Backseat Driver) 時，在 Clojure 中效果極佳。適用於 Agent 可以使用的任何具有即時 REPL 的系統。可針對您工作流程和/或工作區中的任何特定提醒來調整提示詞。 |
### Agent

| Agent | 說明 |
|-------|-------------|
| `clojure-interactive-programming` | 專業 Clojure 結對程式設計師，採用 REPL 優先方法論、架構監督與互動式問題解決。執行品質標準、防止規避做法，並在修改檔案前透過即時 REPL 評估來漸進式開發解決方案。 |
## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能收藏。
## 授權

MIT
