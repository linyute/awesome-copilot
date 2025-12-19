# Kotlin MCP 伺服器開發

使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫以 Kotlin 建立模型上下文協定 (MCP) 伺服器的完整工具包。包括最佳實踐說明、用於產生伺服器的提示，以及用於指導的專家聊天模式。

**標籤：** kotlin, mcp, model-context-protocol, kotlin-multiplatform, server-development, ktor

## 此集合中的項目

| 標題 | 類型 | 描述 | MCP 伺服器 |
| ----- | ---- | ----------- | ----------- |
| [Kotlin MCP 伺服器開發準則](../instructions/kotlin-mcp-server.instructions.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Fkotlin-mcp-server.instructions.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode-insiders%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Fkotlin-mcp-server.instructions.md) | 指示 | 使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫在 Kotlin 中建構模型上下文協定 (MCP) 伺服器的最佳實踐和模式。 |  |
| [Kotlin MCP 伺服器專案產生器](../prompts/kotlin-mcp-server-generator.prompt.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fkotlin-mcp-server-generator.prompt.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode-insiders%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fkotlin-mcp-server-generator.prompt.md) | 提示 | 使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫，產生一個具有適當結構、依賴項和實作的完整 Kotlin MCP 伺服器專案。 |  |
| [Kotlin MCP 伺服器開發專家](../agents/kotlin-mcp-expert.agent.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Fkotlin-mcp-expert.agent.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Fkotlin-mcp-expert.agent.md) | 代理程式 | 使用官方 SDK 建構 Kotlin 中的模型上下文協定 (MCP) 伺服器的專家助理。 [查看用法](#kotlin-mcp-伺服器開發專家) |  |

## 集合用法

### Kotlin MCP 伺服器開發專家

推薦

此聊天模式為使用 Kotlin 建立 MCP 伺服器提供專家指導。

此聊天模式非常適合：
- 使用 Kotlin 建立新的 MCP 伺服器專案
- 使用協程和 kotlinx.serialization 實作型別安全的工具
- 使用 Ktor 設定 stdio 或 SSE 傳輸
- 偵錯協程模式和 JSON 結構描述問題
- 學習官方 SDK 的 Kotlin MCP 最佳實踐
- 建立多平台 MCP 伺服器 (JVM, Wasm, iOS)

為了獲得最佳結果，請考慮：
- 使用指示檔案為 Kotlin MCP 開發設定上下文
- 使用提示產生帶有 Gradle 的初始專案結構
- 切換到專家聊天模式以獲得詳細的實作協助
- 指定您需要 stdio 或 SSE/HTTP 傳輸
- 提供有關您需要哪些工具或功能的詳細資訊
- 提及您是否需要多平台支援或特定目標

---

*此集合包含 **Kotlin MCP 伺服器開發** 的 3 個精選項目。*