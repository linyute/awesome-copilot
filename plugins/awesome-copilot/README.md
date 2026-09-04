# Awesome Copilot 外掛程式

中繼提示（Meta prompts），協助您探索與產生精選的 GitHub Copilot agent、集合、指示、提示和技能。

## 安裝

```bash
# Using Copilot CLI
copilot plugin install awesome-copilot@awesome-copilot
```

## 先決條件

- 必須已安裝 [Docker](https://www.docker.com/) 且可於 `PATH` 中使用。
- 此外掛程式會透過執行 `docker run ... ghcr.io/microsoft/mcp-dotnet-samples/awesome-copilot:latest` 啟動其隨附的 MCP 伺服器。

## 包含內容

### 指令（斜線指令）

| 指令                                                           | 說明                                                                                                                                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/awesome-copilot:suggest-awesome-github-copilot-collections`  | 根據目前儲存庫情境與聊天記錄，建議來自 awesome-copilot 儲存庫的相關 GitHub Copilot 集合，提供集合資產的自動下載與安裝，並識別需要更新的過期集合資產。                   |
| `/awesome-copilot:suggest-awesome-github-copilot-instructions` | 根據目前儲存庫情境與聊天記錄，建議來自 awesome-copilot 儲存庫的相關 GitHub Copilot 指示檔案，避免與此儲存庫中的現有指示重複，並識別需要更新的過期指示。                 |
| `/awesome-copilot:suggest-awesome-github-copilot-agents`       | 根據目前儲存庫情境與聊天記錄，建議來自 awesome-copilot 儲存庫的相關 GitHub Copilot 自訂 Agent 檔案，避免與此儲存庫中的現有自訂 agent 重複，並識別需要更新的過期 agent。 |
| `/awesome-copilot:suggest-awesome-github-copilot-skills`       | 根據目前儲存庫情境與聊天記錄，建議來自 awesome-copilot 儲存庫的相關 GitHub Copilot 技能，避免與此儲存庫中的現有技能重複，並識別需要更新的過期技能。                     |

### Agent

| Agent                           | 說明                                                                  |
| ------------------------------- | --------------------------------------------------------------------- |
| `meta-agentic-project-scaffold` | 中繼 agent 架構專案建立助理，協助使用者有效地建立和管理專案工作流程。 |

### MCP 伺服器

此外掛程式包含於 [`./mcp.json`](./mcp.json) 中設定的 `awesome-copilot` MCP 伺服器。若無法使用 Docker，MCP 啟動將會失敗。

## 來源

此外掛程式為 [Awesome Copilot](https://github.com/github/awesome-copilot)（GitHub Copilot 擴充功能的社群驅動集合）的一部分。

## 授權條款

MIT
