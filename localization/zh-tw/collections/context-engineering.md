# 上下文工程

透過更好的上下文管理來最大化 GitHub Copilot 成效的工具與技術。包含結構化程式碼的指引、用於規劃多檔案變更的代理程式 (agent)，以及用於上下文感知開發的提示詞。

**標籤：** context, productivity, refactoring, best-practices, architecture

## 此集合中的項目

| 標題 | 類型 | 描述 | MCP 伺服器 |
| ----- | ---- | ----------- | ----------- |
| [上下文工程](../instructions/context-engineering.instructions.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Fcontext-engineering.instructions.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode-insiders%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Fcontext-engineering.instructions.md) | 指示 | 透過更好的上下文管理來結構化程式碼與專案，以最大化 GitHub Copilot 成效的指引 |  |
| [Context Architect](../agents/context-architect.agent.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Fcontext-architect.agent.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Fcontext-architect.agent.md) | 代理程式 | 一個透過識別相關內容和相依性來協助規劃和執行多檔案變更的 Agent [查看用法](#context-architect) |  |
| [上下文地圖 (Context Map)](../prompts/context-map.prompt.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fcontext-map.prompt.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode-insiders%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fcontext-map.prompt.md) | 提示 | 在進行變更前產生所有與任務相關檔案的地圖 [查看用法](#上下文地圖-(context-map)) |  |
| [你需要什麼上下文？](../prompts/what-context-needed.prompt.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fwhat-context-needed.prompt.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode-insiders%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Fwhat-context-needed.prompt.md) | 提示 | 在回答問題前詢問 Copilot 需要檢視哪些檔案 [查看用法](#你需要什麼上下文？) |  |
| [重構計畫 (Refactor Plan)](../prompts/refactor-plan.prompt.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Frefactor-plan.prompt.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/prompt?url=vscode-insiders%3Achat-prompt%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fprompts%2Frefactor-plan.prompt.md) | 提示 | 規劃具有適當順序與回滾步驟的多檔案重構 [查看用法](#重構計畫-(refactor-plan)) |  |

## 集合用法

### Context Architect

建議使用

Context Architect 代理程式透過對應相依性
並在進行修改前識別所有相關檔案，來協助規劃多檔案變更。

在以下情況使用此代理程式：
- 規劃跨越多個檔案的重構
- 新增涉及多個模組的功能
- 調查程式碼庫中不熟悉的部分

使用範例：
```
@context-architect 我需要對所有 API 端點新增速率限制。
涉及哪些檔案，以及最佳方法是什麼？
```

為了獲得最佳結果：
- 描述高階目標，而不僅僅是當前任務
- 在提供檔案之前，先讓代理程式進行搜尋
- 在核准變更前檢視內容地圖 (context map)

---

### 上下文地圖 (Context Map)

選用

在任何重大變更前使用，以了解影響範圍。
產生檔案、相依性與測試的結構化地圖。

---

### 你需要什麼上下文？

選用

當 Copilot 給出通用或錯誤的答案時使用。
要求 Copilot 明確列出其需要檢視的檔案。

---

### 重構計畫 (Refactor Plan)

選用

用於多檔案重構。產生包含驗證步驟
與回滾程序的階段性計畫。

---

*此集合包含 **上下文工程** 的 5 個精選項目。*