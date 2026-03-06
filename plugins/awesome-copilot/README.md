# Awesome Copilot 外掛程式

Meta 提示詞可協助您探索並產生精選的 GitHub Copilot Agent、收藏、指引、提示詞與技能。

## 安裝

```bash
# 使用 Copilot CLI
copilot plugin install awesome-copilot@awesome-copilot
```

## 包含內容

### 命令 (斜線命令)

| 命令 | 說明 |
|---------|-------------|
| `/awesome-copilot:suggest-awesome-github-copilot-collections` | 根據目前儲存庫內容與聊天歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot 收藏，提供自動下載與安裝收藏資產，並識別需要更新的過時收藏資產。 |
| `/awesome-copilot:suggest-awesome-github-copilot-instructions` | 根據目前儲存庫內容與聊天歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot 指引檔案，避免與此儲存庫中現有的指引重複，並識別需要更新的過時指引。 |
| `/awesome-copilot:suggest-awesome-github-copilot-prompts` | 根據目前儲存庫內容與聊天歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot 提示詞檔案，避免與此儲存庫中現有的提示詞重複，並識別需要更新的過時提示詞。 |
| `/awesome-copilot:suggest-awesome-github-copilot-agents` | 根據目前儲存庫內容與聊天歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot 自訂 Agent 檔案，避免與此儲存庫中現有的自訂 Agent 重複，並識別需要更新的過時 Agent。 |
| `/awesome-copilot:suggest-awesome-github-copilot-skills` | 根據目前儲存庫內容與聊天歷史記錄，從 awesome-copilot 儲存庫建議相關的 GitHub Copilot 技能，避免與此儲存庫中現有的技能重複，並識別需要更新的過時技能。 |

### Agent

| Agent | 說明 |
|-------|-------------|
| `meta-agentic-project-scaffold` | Meta Agentic 專案建立協助工具，可協助使用者有效地建立並管理專案工作流程。 |

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能收藏。

## 授權

MIT
