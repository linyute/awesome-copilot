# FlowStudio Power Automate 外掛程式

賦予您的 AI 代理程式與您在 Power Automate 入口網站中擁有的相同能見度。Graph API 僅傳回頂層的執行狀態 — 代理程式無法查看動作輸入、迴圈反覆項目、巢狀失敗或流程的所有者。Flow Studio MCP 會公開所有這些資訊。

此外掛程式包含五項涵蓋完整生命週期的技能：連接、偵錯、建置、監控及控管 Power Automate 雲端流程。

需要 [FlowStudio MCP](https://mcp.flowstudio.app) 訂閱。

## 目前代理程式無法看到的內容

| 您在入口網站中看到的內容 | 代理程式透過 Graph API 看到的內容 |
| ----------------------------------------- | -------------------------------- |
| 動作輸入與輸出 | 執行通過或失敗 (無詳細資訊) |
| 迴圈反覆項目資料 | 無 |
| 子流程失敗 | 僅限頂層錯誤代碼 |
| 流程健全狀況與失敗率 | 無 |
| 誰建置了流程、使用了哪些連接器 | 無 |

Flow Studio MCP 填補了這些空白。

## 安裝

```bash
copilot plugin install flowstudio-power-automate@awesome-copilot
```

## 包含內容

### 技能

| 技能 | 說明 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flowstudio-power-automate-mcp` | 基礎技能 — 驗證設定、可重複使用的 MCP 輔助程式 (Python + Node.js)、透過 `list_skills`/`tool_search` 進行工具探索、超大回應處理。請先載入此技能。 |
| `flowstudio-power-automate-debug` | 逐步診斷工作流程 — 提供動作層級的輸入與輸出，而不僅僅是錯誤代碼。識別跨巢狀子流程和迴圈反覆項目的根本原因。 |
| `flowstudio-power-automate-build` | 從頭開始建置並部署流程定義 — 腳手架觸發器、佈線連接、部署，並透過重新提交進行測試。 |
| `flowstudio-power-automate-monitoring` | 來自快取儲存庫的流程健全狀況 — 失敗率、包含修復提示的執行歷程記錄、建立者清單、Power Apps、環境和連接計數。 |
| `flowstudio-power-automate-governance` | 控管工作流程 — 按業務影響對流程進行分類、偵測孤立資源、稽核連接器、管理通知規則、計算封存分數。 |

前三項技能會呼叫即時的 Power Automate API。監控與控管技能則從具有彙總統計資料和控管中繼資料的每日快取快照中讀取。

## 前提條件

- [FlowStudio MCP](https://mcp.flowstudio.app) 訂閱
- MCP 端點：`https://mcp.flowstudio.app/mcp`
- API 金鑰 (作為 `x-api-key` 標頭傳遞 — 非 Bearer)

## 入門指南

1. 安裝外掛程式
2. 在 [mcp.flowstudio.app](https://mcp.flowstudio.app) 取得您的 API 金鑰
3. 在 VS Code 中設定 MCP 連接 (`.vscode/mcp.json`)：
   
   ```json
   {
     "servers": {
       "flowstudio": {
         "type": "http",
         "url": "https://mcp.flowstudio.app/mcp",
         "headers": { "x-api-key": "<您的權杖>" }
       }
     }
   }
   ```
4. 要求 Copilot 列出您的流程、對失敗進行偵錯、建置新流程、檢查流程健全狀況或執行控管檢閱

## 原始資料

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

技能原始碼：[ninihen1/power-automate-mcp-skills](https://github.com/ninihen1/power-automate-mcp-skills)

## 授權

MIT
