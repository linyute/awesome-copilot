# Python MCP 伺服器開發

使用官方 SDK 和 FastMCP 以 Python 建立模型上下文協定 (MCP) 伺服器的完整工具包。包括最佳實踐說明、用於產生伺服器的提示，以及用於指導的專家聊天模式。

**標籤：** python, mcp, model-context-protocol, fastmcp, server-development

## 此集合中的項目

| 標題 | 類型 | 描述 | MCP 伺服器 |
| ----- | ---- | ----------- | ----------- |
| [Python MCP 伺服器開發](../instructions/python-mcp-server.instructions.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Fpython-mcp-server.instructions.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode-insiders%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Fpython-mcp-server.instructions.md) | 指示 | 使用 Python SDK 建立模型上下文協定 (MCP) 伺服器的指示 |  |
| [建立 Python MCP 伺服器](../prompts/python-mcp-server-generator.prompt.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fpython-mcp-server-generator.prompt.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode-insiders%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fpython-mcp-server-generator.prompt.md) | 提示 | 使用工具、資源和適當的配置，在 Python 中建立一個完整的 MCP 伺服器專案 |  |
| [Python MCP 伺服器專家](../agents/python-mcp-expert.agent.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Fpython-mcp-expert.agent.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Fpython-mcp-expert.agent.md) | 代理程式 | 使用 Python 開發模型上下文協定 (MCP) 伺服器的專家協助 [查看用法](#python-mcp-伺服器專家) |  |

## 集合用法

### Python MCP 伺服器專家

推薦

此聊天模式為使用 FastMCP 以 Python 建立 MCP 伺服器提供專家指導。

此聊天模式非常適合：
- 使用 Python 建立新的 MCP 伺服器專案
- 使用 Pydantic 模型和結構化輸出實作型別安全的工具
- 設定 stdio 或可串流 HTTP 傳輸
- 偵錯型別提示和結構描述驗證問題
- 學習 FastMCP 的 Python MCP 最佳實踐
- 優化伺服器效能和資源管理

為了獲得最佳結果，請考慮：
- 使用指示檔案為 Python/FastMCP 開發設定上下文
- 使用提示產生帶有 uv 的初始專案結構
- 切換到專家聊天模式以獲得詳細的實作協助
- 指定您需要 stdio 或 HTTP 傳輸
- 提供有關您需要哪些工具或功能的詳細資訊
- 提及您是否需要結構化輸出、取樣或引導

---

*此集合包含 **Python MCP 伺服器開發** 的 3 個精選項目。*