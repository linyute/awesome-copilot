# 基於 MCP 的 M365 代理程式收藏

一套完整的提示字元與指示收藏，用於建置整合 Model Context Protocol (MCP) 的 Microsoft 365 Copilot 宣告式代理程式。

## 概觀

Model Context Protocol (MCP) 是一個通用標準，允許 AI 模型透過標準化的伺服器端點與外部系統整合。此收藏提供您建置、部署及管理基於 MCP 的宣告式代理程式所需的一切，以自訂功能擴充 Microsoft 365 Copilot。

## 什麼是 Model Context Protocol？

MCP 是一個開放協定，旨在簡化 AI 模型連接到外部資料來源與工具的方式。MCP 提供了一致的介面，取代了為每個系統撰寫自訂程式碼的需要，可用於：

- **伺服器 Metadata**：探索可用的工具與功能
- **工具列表**：獲取函式定義與結構描述 (schemas)
- **工具執行**：呼叫具有參數的工具並接收結果

對於 Microsoft 365 Copilot，這代表您可以建立代理程式，透過點選設定即可連接到任何相容於 MCP 的伺服器，而無需撰寫自訂程式碼。

## 收藏內容

### 提示字元

1. **建立宣告式代理程式** ([mcp-create-declarative-agent.prompt.md](../prompts/mcp-create-declarative-agent.prompt.md))
   - 使用 Microsoft 365 Agents Toolkit 建構宣告式代理程式
   - 設定整合工具匯入的 MCP 伺服器
   - 設定 OAuth 2.0 或 SSO 驗證
   - 為資料擷取設定回應語義 (response semantics)
   - 封裝並部署代理程式進行測試

2. **建立調適型卡片** ([mcp-create-adaptive-cards.prompt.md](../prompts/mcp-create-adaptive-cards.prompt.md))
   - 設計靜態與動態調適型卡片 (Adaptive Card) 範本
   - 設定回應語義 (data_path, properties, template_selector)
   - 使用範本語言處理條件式與資料繫結
   - 建立可在各個 Copilot 介面使用的響應式卡片
   - 實作使用者互動的卡片動作

3. **部署與管理代理程式** ([mcp-deploy-manage-agents.prompt.md](../prompts/mcp-deploy-manage-agents.prompt.md))
   - 透過 Microsoft 365 系統管理中心部署代理程式
   - 設定組織或公用商店發佈
   - 管理代理程式生命週期 (發佈、部署、封鎖、移除)
   - 設定控管與合規性控制
   - 監控代理程式使用情況與效能

### 指示

**MCP M365 Copilot 開發指南** ([mcp-m365-copilot.instructions.md](../instructions/mcp-m365-copilot.instructions.md))
- MCP 伺服器設計與工具選擇的最佳做法
- 檔案組織與專案結構
- 回應語義設定模式
- 調適型卡片設計原則
- 安全性、控管與合規性需求
- 測試與部署工作流程

## 核心概念

### 宣告式代理程式

宣告式代理程式是透過組態檔案而非程式碼來定義的：
- **declarativeAgent.json**：代理程式指示、功能、對話啟動器
- **ai-plugin.json**：MCP 伺服器工具、回應語義、調適型卡片範本
- **mcp.json**：MCP 伺服器 URL、驗證組態
- **manifest.json**：用於封裝的 Teams 應用程式資訊清單 (manifest)

### MCP 伺服器整合

Microsoft 365 Agents Toolkit 提供了一個視覺化介面用於：
1. **Scaffold** (架構) 一個新的代理程式專案
2. **新增 MCP 動作**以連接到伺服器
3. 從伺服器的可用函式中**選擇工具**
4. **設定驗證** (OAuth 2.0, SSO)
5. **產生檔案** (代理程式組態、外掛程式資訊清單)
6. 在 m365.cloud.microsoft/chat 中**測試**

### 驗證模式

**OAuth 2.0 靜態註冊：**
- 向服務提供者預先註冊 OAuth 應用程式
- 將認證儲存在 .env.local 中 (絕不提交)
- 在 ai-plugin.json 驗證組態中引用
- 使用者同意一次，權杖 (tokens) 儲存在外掛程式保險庫中

**單一登入 (SSO)：**
- 使用 Microsoft Entra ID 進行驗證
- 為 M365 使用者提供無縫體驗
- 無需額外登入
- 組織內部代理程式的理想選擇

### 回應語義

從 MCP 伺服器回應中擷取並格式化資料：

```json
{
  "response_semantics": {
    "data_path": "$.items[*]",
    "properties": {
      "title": "$.name",
      "subtitle": "$.description",
      "url": "$.html_url"
    },
    "static_template": { ... }
  }
}
```

- **data_path**：擷取陣列或物件的 JSONPath
- **properties**：將回應欄位對應到 Copilot 屬性
- **template_selector**：根據回應選擇動態範本
- **static_template**：用於視覺格式化的調適型卡片

### 調適型卡片

代理程式輸出的豐富視覺化回應：

**靜態範本：**
- 在 ai-plugin.json 中定義一次
- 用於具有相同結構的所有回應
- 效能更好且更易於維護

**動態範本：**
- 在 API 回應本文中傳回
- 透過 template_selector JSONPath 選擇
- 對於多樣化的回應結構非常有用

**範本語言：**
- `${property}`：資料繫結
- `${if(condition, true, false)}`：條件式
- `${formatNumber(value, decimals)}`：格式化
- `$when`：條件式元件轉譯

## 部署選項

### 組織部署
- IT 管理員部署給所有使用者或特定群組
- 需要在 Microsoft 365 系統管理中心核准
- 內部商務代理程式的最佳選擇
- 完整的控管與合規性控制

### 代理程式商店
- 提交至合作夥伴中心進行驗證
- 對所有 Copilot 使用者公開可用
- 嚴格的安全性與合規性審查
- 適合合作夥伴建置的代理程式

## 合作夥伴範例

### monday.com
任務與專案管理整合：
- 直接從 Copilot 建立任務
- 查詢專案狀態與更新
- 將工作項目指派給團隊成員
- 檢視期限與里程碑

### Canva
設計自動化功能：
- 產生品牌內容
- 建立社群媒體圖形
- 存取設計範本
- 以多種格式匯出

### Sitecore
內容管理整合：
- 搜尋內容存放庫
- 建立與更新內容項目
- 管理工作流程與核准
- 在內容中預覽

## 入門指南

### 前提條件
- Microsoft 365 Agents Toolkit 擴充功能 (v6.3.x 或更新版本)
- GitHub 帳號 (用於 OAuth 範例)
- Microsoft 365 Copilot 授權
- 存取相容於 MCP 的伺服器

### 快速開始
1. 在 VS Code 中安裝 Microsoft 365 Agents Toolkit
2. 使用**建立宣告式代理程式**提示字元架構專案
3. 新增 MCP 伺服器 URL 並選擇工具
4. 使用 OAuth 或 SSO 設定驗證
5. 使用**建立調適型卡片**提示字元設計回應範本
6. 在 m365.cloud.microsoft/chat 測試代理程式
7. 使用**部署與管理代理程式**提示字元進行發佈

### 開發工作流程
```
1. 架構代理程式專案
   ↓
2. 連接 MCP 伺服器
   ↓
3. 匯入工具
   ↓
4. 設定驗證
   ↓
5. 設計調適型卡片
   ↓
6. 在本機測試
   ↓
7. 部署到組織
   ↓
8. 監控與反覆運算
```

## 最佳做法

### MCP 伺服器設計
- 僅匯入必要的工具 (避免範圍過大)
- 使用安全驗證 (OAuth 2.0, SSO)
- 個別測試每個工具
- 驗證伺服器端點為 HTTPS
- 選擇工具時考慮權杖限制

### 代理程式指示
- 對代理程式功能提供具體且清晰的說明
- 提供如何互動的範例
- 為代理程式可以/不可以做的事情設定界線
- 使用對話啟動器引導使用者

### 回應格式化
- 使用 JSONPath 擷取相關資料
- 清晰對應屬性 (標題、副標題、URL)
- 設計易於閱讀的調適型卡片
- 在各個 Copilot 介面 (聊天、Teams、Outlook) 測試卡片

### 安全性與控管
- 絕不將認證提交到原始碼控制系統
- 為祕密資訊使用環境變數
- 遵循最小權限原則
- 審查合規性需求
- 監控代理程式使用情況與效能

## 常見使用案例

### 資料擷取
- 搜尋外部系統
- 擷取使用者特定資訊
- 查詢資料庫或 API
- 彙整來自多個來源的資料

### 任務自動化
- 建立工單或任務
- 更新紀錄或狀態
- 觸發工作流程
- 排程動作

### 內容產生
- 建立文件或設計
- 產生報告或摘要
- 將資料格式化為範本
- 以多種格式匯出

### 整合案例
- 連接 CRM 系統
- 整合專案管理工具
- 存取知識庫
- 連接到自訂商務應用程式

## 疑難排解

### 代理程式未出現在 Copilot 中
- 驗證代理程式已在系統管理中心部署
- 檢查使用者是否在指派的群組中
- 確認代理程式未被封鎖
- 重新整理 Copilot 介面

### 驗證錯誤
- 驗證 .env.local 中的 OAuth 認證
- 檢查範圍 (scopes) 是否符合必要的權限
- 獨立測試驗證流程
- 驗證 MCP 伺服器可存取

### 回應格式化問題
- 使用範本資料測試 JSONPath 運算式
- 驗證 data_path 擷取到預期的陣列/物件
- 檢查屬性對應是否正確
- 使用各種回應結構測試調適型卡片

### 效能問題
- 監控 MCP 伺服器回應時間
- 減少匯入的工具數量
- 最佳化回應資料大小
- 在適當的地方使用快取

## 資源

### 官方文件
- [使用 MCP 建置宣告式代理程式 (DevBlogs)](https://devblogs.microsoft.com/microsoft365dev/build-declarative-agents-for-microsoft-365-copilot-with-mcp/)
- [建置 MCP 外掛程式 (Microsoft Learn)](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/build-mcp-plugins)
- [API 外掛程式調適型卡片 (Microsoft Learn)](https://learn.microsoft.com/zh-tw/microsoft-365-copilot/extensibility/api-plugin-adaptive-cards)
- [管理 Copilot 代理程式 (Microsoft Learn)](https://learn.microsoft.com/zh-tw/microsoft-365/admin/manage/manage-copilot-agents-integrated-apps)

### 工具與擴充功能
- [Microsoft 365 Agents Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)
- [調適型卡片設計工具 (Adaptive Cards Designer)](https://adaptivecards.io/designer/)
- [Teams Toolkit](https://learn.microsoft.com/zh-tw/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)

### MCP 資源
- [Model Context Protocol 規格](https://modelcontextprotocol.io/)
- [MCP 伺服器目錄](https://github.com/modelcontextprotocol/servers)
- 社群 MCP 伺服器與範例

### 管理與控管
- [Microsoft 365 系統管理中心](https://admin.microsoft.com/)
- [Power Platform 系統管理中心](https://admin.powerplatform.microsoft.com/)
- [合作夥伴中心](https://partner.microsoft.com/) (用於代理程式提交)

## 支援與社群

- 加入 [Microsoft 365 開發者社群](https://developer.microsoft.com/zh-tw/microsoft-365/community)
- 在 [Microsoft Q&A](https://learn.microsoft.com/zh-tw/answers/products/) 提問
- 在 [Microsoft 365 Copilot GitHub 討論區](https://github.com/microsoft/copilot-feedback) 分享回饋

## 下一步？

在掌握基於 MCP 的代理程式後，探索：
- **進階工具組合**：結合多個 MCP 伺服器
- **自訂驗證流程**：實作自訂 OAuth 提供者
- **複雜的調適型卡片**：具有動態資料的多動作卡片
- **代理程式分析**：追蹤使用模式並進行最佳化
- **多代理程式協調**：建置可協作的代理程式

---

*此收藏由社群維護，反映了基於 MCP 的 M365 Copilot 代理程式開發的目前最佳做法。歡迎提供貢獻與回饋！*
