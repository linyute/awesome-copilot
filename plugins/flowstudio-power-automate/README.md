# FlowStudio Power Automate 外掛模組

賦予您的 AI 代理人與您在 Power Automate 入口網站中相同的能見度。Graph API 僅傳回最上層的執行狀態 — 代理人無法看到動作輸入、迴圈反覆運算、巢狀失敗或流程的擁有者。Flow Studio MCP 公開了這一切。

此外掛模組包含涵蓋完整生命週期的五個技能：連線、除錯、建構、監視與管理 Power Automate 雲端流程。

需要 [FlowStudio MCP](https://mcp.flowstudio.app) 訂閱。

## 目前代理人無法看到的內容

| 您在入口網站看到的內容 | 代理人透過 Graph API 看到的內容 |
| ----------------------------------------- | -------------------------------- |
| 動作輸入與輸出 | 執行通過或失敗（無詳細資訊） |
| 迴圈反覆運算資料 | 無 |
| 子流程失敗 | 僅有最上層錯誤代碼 |
| 流程健全狀況與失敗率 | 無 |
| 誰建立了流程、使用哪些連接器 | 無 |

Flow Studio MCP 填補了這些差距。

## 安裝

```bash
copilot plugin install flowstudio-power-automate@awesome-copilot
```

## 包含內容

### 技能

| 技能 | 說明 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flowstudio-power-automate-mcp` | 基礎技能 — 驗證設定、可重複使用的 MCP 協助程式 (Python + Node.js)、透過 `list_skills`/`tool_search` 探索工具、過大回應處理。請先載入。 |
| `flowstudio-power-automate-debug` | 逐步診斷工作流程 — 動作層級的輸入與輸出，而不僅是錯誤代碼。跨巢狀子流程與迴圈反覆運算識別根本原因。 |
| `flowstudio-power-automate-build` | 從頭建構並部署流程定義 — 載入 `create-flow`、探索連接器作業、解析動態選項/屬性、連接連線範本、部署並透過重新提交進行測試。 |
| `flowstudio-power-automate-monitoring` | 來自快取存放區的流程健康狀態 — 失敗率、包含補救提示的執行歷史記錄、建立者清冊、Power Apps、環境與連線計數。 |
| `flowstudio-power-automate-governance` | 治理工作流程 — 依業務影響分類流程、偵測孤立資源、稽核連接器、管理通知規則、計算封存分數。 |

前三個技能呼叫即時 Power Automate API。監視與治理技能從包含彙總統計資料與治理中繼資料的每日快取快照中讀取。

## 先決條件

- [FlowStudio MCP](https://mcp.flowstudio.app) 訂閱
- MCP 端點：`https://mcp.flowstudio.app/mcp`
- API 金鑰（作為 `x-api-key` 標頭傳遞 — 非 Bearer）

## 開始使用

1. 安裝外掛模組
2. 在 [mcp.flowstudio.app](https://mcp.flowstudio.app) 取得您的 API 金鑰
3. 在 VS Code (`.vscode/mcp.json`) 中設定 MCP 連線：

   ```json
   {
     "servers": {
       "flowstudio": {
         "type": "http",
         "url": "https://mcp.flowstudio.app/mcp",
         "headers": { "x-api-key": "<YOUR_TOKEN>" }
       }
     }
   }
   ```
4. 要求 Copilot 列出您的流程、除錯失敗、建構新流程、檢查流程健康狀態或執行治理審查

## 來源

此外掛模組是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群導向的 GitHub Copilot 擴充功能集合。

技能來源：[ninihen1/power-automate-mcp-skills](https://github.com/ninihen1/power-automate-mcp-skills)

## 授權條款

MIT
