---
description: '為 Microsoft 365 Copilot 建構基於 MCP 的宣告式 Agent 和 API 外掛程式的最佳實踐，並整合 Model Context Protocol'
applyTo: '**/{*mcp*,*agent*,*plugin*,declarativeAgent.json,ai-plugin.json,mcp.json,manifest.json}'
---

# 基於 MCP 的 M365 Copilot 開發指南

## 核心原則

### Model Context Protocol 優先
- 利用 MCP 伺服器進行外部系統整合
- 從伺服器端點匯入工具，而非手動定義
- 讓 MCP 處理結構 (Schema) 探索和函式生成
- 在 Agents Toolkit 中使用點選式工具選擇

### 宣告式優於命令式
- 透過配置定義 Agent 行為，而非程式碼
- 使用 `declarativeAgent.json` 定義指示和能力
- 在 `ai-plugin.json` 中指定工具和操作
- 在 `mcp.json` 中配置 MCP 伺服器

### 安全與治理
- 始終使用 OAuth 2.0 或 SSO 進行驗證
- 工具選擇遵循最小權限原則
- 驗證 MCP 伺服器端點是否安全
- 部署前審查合規性要求

### 以使用者為中心的設計
- 建立調適型卡片 (Adaptive Cards) 以提供豐富的視覺回應
- 提供清晰的交談啟動器
- 針對不同中心 (Hubs) 的響應式體驗進行設計
- 在組織部署前進行徹底測試

## MCP 伺服器設計

### 伺服器選擇
選擇具備以下特點的 MCP 伺服器：
- 公開與使用者任務相關的工具
- 支援安全驗證（OAuth 2.0, SSO）
- 提供可靠的執行時間和效能
- 遵循 MCP 規範標準
- 回傳結構良好的回應資料

### 工具匯入策略
- 僅匯入必要的工具（避免範圍過大）
- 對來自同一伺服器的相關工具進行分組
- 在組合前單獨測試每個工具
- 選擇多個工具時考量 Token 限制

### 驗證配置
**OAuth 2.0 靜態註冊：**
```json
{
  "type": "OAuthPluginVault",
  "reference_id": "YOUR_AUTH_ID",
  "client_id": "github_client_id",
  "client_secret": "github_client_secret",
  "authorization_url": "https://github.com/login/oauth/authorize",
  "token_url": "https://github.com/login/oauth/access_token",
  "scope": "repo read:user"
}
```

**SSO (Microsoft Entra ID)：**
```json
{
  "type": "OAuthPluginVault",
  "reference_id": "sso_auth",
  "authorization_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  "scope": "User.Read"
}
```

## 檔案組織

### 專案結構
```
project-root/
├── appPackage/
│   ├── manifest.json           # Teams 應用程式資訊清單
│   ├── declarativeAgent.json   # Agent 配置（指示、能力）
│   ├── ai-plugin.json          # API 外掛程式定義
│   ├── color.png               # 應用程式圖示顏色
│   └── outline.png             # 應用程式圖示輪廓
├── .vscode/
│   └── mcp.json               # MCP 伺服器配置
├── .env.local                  # 憑證（絕不提交）
└── teamsapp.yml               # Teams Toolkit 配置
```

### 關鍵檔案

**declarativeAgent.json：**
- Agent 名稱與描述
- 行為指示
- 交談啟動器
- 能力（來自外掛程式的操作）

**ai-plugin.json：**
- MCP 伺服器工具匯入
- 回應語義（data_path, properties）
- 靜態調適型卡片模板
- 函式定義（自動生成）

**mcp.json：**
- MCP 伺服器 URL
- 伺服器 Metadata 端點
- 驗證參考

**.env.local：**
- OAuth 用戶端憑證
- API 金鑰與秘密
- 環境特定配置
- **重要**：新增至 `.gitignore`

## 回應語義最佳實踐

### 資料路徑 (Data Path) 配置
使用 JSONPath 擷取相關資料：
```json
{
  "data_path": "$.items[*]",
  "properties": {
    "title": "$.name",
    "subtitle": "$.description", 
    "url": "$.html_url"
  }
}
```

### 模板選擇
對於動態模板：
```json
{
  "data_path": "$",
  "template_selector": "$.templateType",
  "properties": {
    "title": "$.title",
    "url": "$.url"
  }
}
```

### 靜態模板
在 `ai-plugin.json` 中定義以保持格式一致：
- 當所有回應都遵循相同結構時使用
- 效能優於動態模板
- 易於維護和版本控制

## 調適型卡片 (Adaptive Card) 指南

### 設計原則
- **單欄佈局**：垂直堆疊元素
- **靈活寬度**：使用 "stretch" 或 "auto"，而非固定像素
- **響應式設計**：在 Chat、Teams、Outlook 中測試
- **最小化複雜度**：保持卡片簡單且易於掃描

### 模板語言模式
**條件判斷：**
```json
{
  "type": "TextBlock",
  "text": "${if(status == 'active', '✅ 啟用', '❌ 停用')}"
}
```

**資料繫結：**
```json
{
  "type": "TextBlock",
  "text": "${title}",
  "weight": "bolder"
}
```

**數字格式化：**
```json
{
  "type": "TextBlock",
  "text": "分數：${formatNumber(score, 0)}"
}
```

**條件渲染：**
```json
{
  "type": "Container",
  "$when": "${count(items) > 0}",
  "items": [ ... ]
}
```

### 卡片元素用法
- **TextBlock**：標題、描述、Metadata
- **FactSet**：鍵值對（狀態、日期、ID）
- **Image**：圖示、縮圖（使用 size: "small"）
- **Container**：將相關內容分組
- **ActionSet**：後續操作的按鈕

## 測試與部署

### 本地測試工作流
1. **佈建 (Provision)**：Teams Toolkit → Provision
2. **部署 (Deploy)**：Teams Toolkit → Deploy
3. **正式載入 (Sideload)**：將應用程式上傳至 Teams
4. **測試**：造訪 [m365.cloud.microsoft/chat](https://m365.cloud.microsoft/chat)
5. **反覆運算**：修復問題並重新部署

### 部署前檢查清單
- [ ] 所有 MCP 伺服器工具均已單獨測試
- [ ] 驗證流程可端對端運作
- [ ] 調適型卡片在各個中心正確轉譯
- [ ] 回應語義成功擷取預期資料
- [ ] 錯誤處理提供清晰訊息
- [ ] 交談啟動器相關且清晰
- [ ] Agent 指示引導正確行為
- [ ] 合規性與安全性已審查

### 部署選項
**組織部署：**
- IT 管理員部署給所有或選定使用者
- 需要在 Microsoft 365 系統管理中心獲得核准
- 最適合內部業務 Agent

**Agent 商店：**
- 提交至合作夥伴中心進行驗證
- 開放給所有 Copilot 使用者
- 需要經過嚴格的安全審查

## 常見模式

### 多工具 Agent
從多個 MCP 伺服器匯入工具：
```json
{
  "mcpServers": {
    "github": {
      "url": "https://github-mcp.example.com"
    },
    "jira": {
      "url": "https://jira-mcp.example.com"
    }
  }
}
```

### 搜尋與顯示
1. 工具從 MCP 伺服器擷取資料
2. 回應語義擷取相關欄位
3. 調適型卡片顯示格式化結果
4. 使用者可以從卡片按鈕採取行動

### 已驗證的操作
1. 使用者觸發需要驗證的工具
2. OAuth 流程重新導向以取得同意
3. 存取權杖 (Access token) 儲存在外掛程式保存庫中
4. 後續請求使用儲存的權杖

## 錯誤處理

### MCP 伺服器錯誤
- 在 Agent 回應中提供清晰的錯誤訊息
- 如果可用，改用替代工具
- 記錄錯誤以便偵錯
- 引導使用者重試或使用替代方法

### 驗證失敗
- 檢查 `.env.local` 中的 OAuth 憑證
- 驗證範圍 (Scopes) 是否與所需權限匹配
- 先在 Copilot 之外測試驗證流程
- 確保權杖重新整理邏輯正常運作

### 回應解析失敗
- 在回應語義中驗證 JSONPath 運算式
- 優雅地處理缺失或 null 資料
- 在適當情況下提供預設值
- 使用各種 API 回應進行測試

## 效能最佳化

### 工具選擇
- 僅匯入必要的工具（減少 Token 使用量）
- 避免從多台伺服器匯入重複的工具
- 測試每個工具對回應時間的影響

### 回應大小
- 使用 `data_path` 過濾不必要的資料
- 儘可能限制結果集
- 對大型資料集考慮分頁
- 保持調適型卡片輕量化

### 快取策略
- MCP 伺服器應在適當情況下進行快取
- Agent 回應可能會被 M365 快取
- 對時間敏感的資料考慮快取失效機制

## 安全最佳實踐

### 憑證管理
- **絕不** 將 `.env.local` 提交至原始碼控制
- 對所有秘密使用環境變數
- 定期輪換 OAuth 憑證
- 開發與生產環境使用不同的憑證

### 資料隱私
- 僅要求最低限度的必要範圍
- 避免記錄敏感的使用者資料
- 審查資料落地 (Data Residency) 要求
- 遵循合規政策（GDPR 等）

### 伺服器驗證
- 確保 MCP 伺服器受信任且安全
- 僅檢查 HTTPS 端點
- 審查伺服器的隱私權政策
- 測試注入攻擊弱點

## 治理與合規性

### 管理員控制
Agent 可以是：
- **封鎖**：防止使用
- **部署**：分配給特定使用者/群組
- **發佈**：開放給全組織使用

### 監控
追蹤：
- Agent 的使用情況和採用率
- 錯誤率和效能
- 使用者回饋與滿意度
- 安全事件

### 稽核要求
維持：
- Agent 配置的變更歷史記錄
- 敏感操作的存取記錄
- 部署的核准記錄
- 合規性證明

## 資源與參考

### 官方文件
- [Build Declarative Agents with MCP (DevBlogs)](https://devblogs.microsoft.com/microsoft365dev/build-declarative-agents-for-microsoft-365-copilot-with-mcp/)
- [Build MCP Plugins (Learn)](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/build-mcp-plugins)
- [API Plugin Adaptive Cards (Learn)](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/api-plugin-adaptive-cards)
- [Manage Copilot Agents (Learn)](https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-copilot-agents-integrated-apps)

### 工具與 SDK
- Microsoft 365 Agents Toolkit (VS Code extension v6.3.x+)
- 用於 Agent 封裝的 Teams Toolkit
- 調適型卡片設計器 (Adaptive Cards Designer)
- MCP 規範文件

### 合作夥伴範例
- monday.com：任務管理整合
- Canva：設計自動化
- Sitecore：內容管理
