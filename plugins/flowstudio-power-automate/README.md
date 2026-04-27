# FlowStudio Power Automate 外掛程式

為您的 AI 代理程式提供與您在 Power Automate 入口網站中相同的檢視權限。Graph API 僅回傳最高層級的執行狀態 — 代理程式無法查看動作輸入、迴圈迭代、巢狀失敗或流程擁有者。Flow Studio MCP 公開了所有這些資訊。

此外掛程式包含五種技能，涵蓋完整生命週期：連接、偵錯、建構、監控與管理 Power Automate 雲端流程。

需要 [FlowStudio MCP](https://mcp.flowstudio.app) 訂閱。

## 代理程式目前無法看到的資訊

| 您在入口網站中看到的內容 | 代理程式透過 Graph API 看到的內容 |
|---|---|
| 動作輸入與輸出 | 執行成功或失敗（無詳細資訊） |
| 迴圈迭代資料 | 無 |
| 子流程失敗 | 僅最高層級錯誤代碼 |
| 流程健康狀態與失敗率 | 無 |
| 誰建構了流程、它使用了哪些連接器 | 無 |

Flow Studio MCP 填補了這些空白。

## 安裝

```bash
copilot plugin install flowstudio-power-automate@awesome-copilot
```

## 包含的內容

### 技能

| 技能 | 描述 |
|-------|-------------|
| `flowstudio-power-automate-mcp` | 核心連接設定、工具探索與運作 — 列出流程、讀取定義、檢查執行、重新提交、取消。 |
| `flowstudio-power-automate-debug` | 逐步診斷工作流程 — 動作層級的輸入與輸出，而不僅是錯誤代碼。跨巢狀子流程與迴圈迭代識別根本原因。 |
| `flowstudio-power-automate-build` | 從零建構與部署流程定義 — 鷹架觸發器 (scaffold triggers)、連線連接器、部署，並透過重新提交進行測試。 |
| `flowstudio-power-automate-monitoring` | 從快取儲存庫獲取的流程健康狀態 — 失敗率、包含修復提示的執行紀錄、建立者清單、Power Apps、環境與連接器計數。 |
| `flowstudio-power-automate-governance` | 管理工作流程 — 依業務影響分類流程、偵測孤立資源、稽核連接器、管理通知規則、計算封存分數。 |

前三項技能呼叫即時 Power Automate API。監控與管理技能則讀取自每日快取快照，其中包含彙總統計資料與管理 Metadata。

## 前置需求

- [FlowStudio MCP](https://mcp.flowstudio.app) 訂閱
- MCP 端點：`https://mcp.flowstudio.app/mcp`
- API 金鑰（作為 `x-api-key` 標頭傳遞 — 非 Bearer）

## 入門

1. 安裝外掛程式
2. 在 [mcp.flowstudio.app](https://mcp.flowstudio.app) 取得您的 API 金鑰
3. 在 VS Code (`.vscode/mcp.json`) 中設定 MCP 連接：
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
4. 請 Copilot 列出您的流程、偵錯失敗、建構新流程、檢查流程健康狀態或執行管理審查

## 來源

此外掛程式是 [Awesome Copilot](https://github.com/github/awesome-copilot) 的一部分，這是一個社群驅動的 GitHub Copilot 擴充功能集合。

技能來源：[ninihen1/power-automate-mcp-skills](https://github.com/ninihen1/power-automate-mcp-skills)

## 授權

MIT
