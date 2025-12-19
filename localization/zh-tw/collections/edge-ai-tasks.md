# microsoft/edge-ai 的任務

適用於中級到專家使用者和大型程式碼庫的任務研究員和任務規劃器 - 由 microsoft/edge-ai 提供

**標籤：** architecture, planning, research, tasks, implementation

## 此集合中的項目

| 標題 | 類型 | 描述 | MCP 伺服器 |
| ----- | ---- | ----------- | ----------- |
| [任務研究員指引](../agents/task-researcher.agent.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Ftask-researcher.agent.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Ftask-researcher.agent.md) | 代理程式 | 任務研究專家，協助進行全面性專案分析 - 由 microsoft/edge-ai 提供 [查看用法](#任務研究員指引) |  |
| [任務規劃指引](../agents/task-planner.agent.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Ftask-planner.agent.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/agent?url=vscode-insiders%3Achat-agent%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Fagents%2Ftask-planner.agent.md) | 代理程式 | 任務規劃工具，協助建立可執行的實作計畫 - 由 microsoft/edge-ai 提供 [查看用法](#任務規劃指引) |  |
| [任務計畫實作指引](../instructions/task-implementation.instructions.md)<br />[![在 VS Code 中安裝](https://img.shields.io/badge/VS_Code-Install-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Ftask-implementation.instructions.md)<br />[![在 VS Code Insiders 中安裝](https://img.shields.io/badge/VS_Code_Insiders-Install-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://aka.ms/awesome-copilot/install/instructions?url=vscode-insiders%3Achat-instructions%2Finstall%3Furl%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Flinyute%2Fawesome-copilot%2Fmain%2Flocalization%2Fzh-tw%2Finstructions%2Ftask-implementation.instructions.md) | 指示 | 以漸進式追蹤與變更記錄實作任務計畫的指引 - 由 microsoft/edge-ai 提供 [查看用法](#任務計畫實作指引) |  |

## 集合用法

### 任務研究員指引

現在您可以針對您的任務進行研究迭代！

```markdown, research.prompt.md
---
mode: task-researcher
name: 研究 microsoft fabric 即時智慧 terraform 支援
---
檢閱 microsoft fabric 即時智慧的文件
並提出如何將此支援實作到我們的 terraform 元件中的想法。
```

研究結果將傾倒到 .copilot-tracking/research/*-research.md 檔案中，並將包含 GHCP 的發現以及在實作期間有用的範例和架構。

此外，任務研究員將提供額外的實作想法，您可以與 GitHub Copilot 合作選擇要專注的正確想法。

---

### 任務規劃指引

此外，任務研究員將提供額外的實作想法，您可以與 GitHub Copilot 合作選擇要專注的正確想法。

```markdown, task-plan.prompt.md
---
mode: task-planner
name: 規劃 microsoft fabric 即時智慧 terraform 支援
---
#file: .copilot-tracking/research/*-fabric-rti-blueprint-modification-research.md
建立一個計劃以支援將 fabric rti 新增到此專案
```

`task-planner` 將協助您建立實作任務的計劃。它將使用您充分研究的想法或建立新的研究（如果尚未提供）。

`task-planner` 將產生三個（3）檔案，這些檔案將由 `task-implementation.instructions.md` 使用。

* `.copilot-tracking/plan/*-plan.instructions.md`

  * 一個新產生的指示檔案，其中包含作為階段和任務清單的計劃。
* `.copilot-tracking/details/*-details.md`

  * 實作的詳細資訊，計劃檔案會參考此檔案以獲取具體詳細資訊（如果您有大型計劃，這很重要）。
* `.copilot-tracking/prompts/implement-*.prompt.md`

  * 一個新產生的提示檔案，它將建立一個 `.copilot-tracking/changes/*-changes.md` 檔案並繼續實作變更。

繼續使用 `task-planner` 迭代計劃，直到您對程式碼庫的完成內容完全滿意為止。

---

### 任務計畫實作指引

繼續使用 `task-planner` 迭代計劃，直到您對程式碼庫的完成內容完全滿意為止。

當您準備好實作計劃時，**建立一個新聊天**並切換到 `Agent` 模式，然後啟動新產生的提示。

```markdown, implement-fabric-rti-changes.prompt.md
---
mode: agent
name: 實作 microsoft fabric 即時智慧 terraform 支援
---
/implement-fabric-rti-blueprint-modification phaseStop=true
```

此提示的額外好處是將計劃作為指示附加，這有助於在整個對話中保持計劃的上下文。

**專家警告** ->>使用 `phaseStop=false` 讓 Copilot 不間斷地實作整個計劃。此外，您可以使用 `taskStop=true` 讓 Copilot 在每個任務實作後停止，以進行更精細的細節控制。

要使用這些產生的指示和提示，您需要相應地更新您的 `settings.json`：

```json
    "chat.instructionsFilesLocations": {
        // 現有的指示資料夾...
        ".copilot-tracking/plans": true
    },
    "chat.promptFilesLocations": {
        // 現有的提示資料夾...
        ".copilot-tracking/prompts": true
    },
```

---

