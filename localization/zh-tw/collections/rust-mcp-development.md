# Rust MCP 伺服器開發

使用官方 rmcp SDK 以 Rust 建立高效能模型上下文協定伺服器，支援 async/await、程序巨集和型別安全實作。

**標籤：** rust, mcp, model-context-protocol, server-development, sdk, tokio, async, macros, rmcp

## 此集合中的項目

| Title | Type | Description | MCP Servers |
| ----- | ---- | ----------- | ----------- |
| [Rust MCP 伺服器開發最佳實踐](../instructions/rust-mcp-server.instructions.md)<br />[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Frust-mcp-server.instructions.md)<br />[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode-insiders%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Frust-mcp-server.instructions.md) | Instruction | 使用官方 rmcp SDK 和 async/await 模式在 Rust 中建立模型上下文協定伺服器的最佳實踐 |  |
| [Rust Mcp Server Generator](../prompts/rust-mcp-server-generator.prompt.md)<br />[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Frust-mcp-server-generator.prompt.md)<br />[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode-insiders%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Frust-mcp-server-generator.prompt.md) | Prompt | 使用官方 rmcp SDK 產生一個完整的 Rust 模型上下文協定伺服器專案，包含工具、提示、資源和測試 |  |
| [Rust MCP 專家](../agents/rust-mcp-expert.agent.md)<br />[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Frust-mcp-expert.agent.md)<br />[![Install in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Frust-mcp-expert.agent.md) | Agent | 使用 rmcp SDK 和 tokio 非同步執行時的 Rust MCP 伺服器開發專家助理 [see usage](#rust-mcp-專家) |  |

## 集合用法

### Rust MCP 專家

推薦

此聊天模式為使用 Rust 建立 MCP 伺服器提供專家指導。

此聊天模式非常適合：
- 使用 Rust 建立新的 MCP 伺服器專案
- 使用 tokio 執行時實作非同步處理器
- 使用 rmcp 程序巨集建立工具
- 設定 stdio、SSE 或 HTTP 傳輸
- 偵錯非同步 Rust 和所有權問題
- 學習官方 rmcp SDK 的 Rust MCP 最佳實踐
- 使用 Arc 和 RwLock 進行效能優化

為了獲得最佳結果，請考慮：
- 使用指示檔案為 Rust MCP 開發設定上下文
- 使用提示產生初始專案結構
- 切換到專家聊天模式以獲得詳細的實作協助
- 指定您需要的傳輸類型
- 提供有關您需要哪些工具或功能的詳細資訊
- 提及您是否需要 OAuth 身份驗證

---

*此集合包含 **Rust MCP 伺服器開發** 的 3 個精選項目。*