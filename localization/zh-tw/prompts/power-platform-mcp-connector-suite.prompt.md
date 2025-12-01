---
description: 產生完整的 Power Platform 自訂連接器，並整合 MCP 以用於 Copilot Studio - 包括架構產生、疑難排解和驗證
agent: agent
---

# Power Platform MCP 連接器套件

產生完整的 Power Platform 自訂連接器實作，並整合模型上下文協定 (MCP) 以用於 Microsoft Copilot Studio。

## Copilot Studio 中的 MCP 功能

**目前支援：**
- ✅ **工具**：LLM 可以呼叫的函式 (經使用者批准)
- ✅ **資源**：代理程式可以讀取的檔案狀資料 (必須是工具輸出)

**尚未支援：**
- ❌ **提示**：預先編寫的範本 (為未來支援做準備)

## 連接器產生

建立完整的 Power Platform 連接器，包含：

**核心檔案：**
- `apiDefinition.swagger.json` 包含 `x-ms-agentic-protocol: mcp-streamable-1.0`
- `apiProperties.json` 包含連接器中繼資料和驗證
- `script.csx` 包含用於 MCP JSON-RPC 處理的自訂 C# 轉換
- `readme.md` 包含連接器文件

**MCP 整合：**
- 用於 JSON-RPC 2.0 通訊的 POST `/mcp` 端點
- McpResponse 和 McpErrorResponse 架構定義
- Copilot Studio 限制合規性 (無參考類型，單一類型)
- 資源整合為工具輸出 (支援資源和工具；尚未支援提示)

## 架構驗證和疑難排解

**驗證架構以符合 Copilot Studio 規範：**
- ✅ 工具輸入/輸出中沒有參考類型 (`$ref`)
- ✅ 僅限單一類型值 (不是 `["string", "number"]`)
- ✅ 原始類型：字串、數字、整數、布林值、陣列、物件
- ✅ 資源作為工具輸出，而不是單獨的實體
- ✅ 所有端點的完整 URI

**常見問題和修復：**
- 工具已篩選 → 移除參考類型，使用原始類型
- 類型錯誤 → 具有驗證邏輯的單一類型
- 資源不可用 → 包含在工具輸出中
- 連線失敗 → 驗證 `x-ms-agentic-protocol` 標頭

## 上下文變數

- **連接器名稱**：[連接器的顯示名稱]
- **伺服器目的**：[MCP 伺服器應完成的任務]
- **所需工具**：[要實作的 MCP 工具清單]
- **資源**：[要提供的資源類型]
- **驗證**：[無、api-key、oauth2、基本]
- **主機環境**：[Azure Function、Express.js 等]
- **目標 API**：[要整合的外部 API]

## 產生模式

### 模式 1: 完整新連接器
從頭開始產生新的 Power Platform MCP 連接器的所有檔案，包括 CLI 驗證設定。

### 模式 2: 架構驗證
使用 paconn 和驗證工具分析並修復現有架構以符合 Copilot Studio 規範。

### 模式 3: 整合疑難排解
使用 CLI 偵錯工具診斷並解決 Copilot Studio 的 MCP 整合問題。

### 模式 4: 混合連接器
為現有的 Power Platform 連接器添加 MCP 功能，並提供適當的驗證工作流程。

### 模式 5: 認證準備
準備連接器以提交 Microsoft 認證，並提供完整的中繼資料和驗證合規性。

### 模式 6: OAuth 安全強化
實作 OAuth 2.0 驗證，並透過 MCP 安全最佳實踐和進階權杖驗證進行增強。

## 預期輸出

**1. apiDefinition.swagger.json**
- 帶有 Microsoft 擴充功能的 Swagger 2.0 格式
- MCP 端點：`POST /mcp` 帶有適當的協定標頭
- 符合規範的架構定義 (僅限原始類型)
- McpResponse/McpErrorResponse 定義

**2. apiProperties.json**
- 連接器中繼資料和品牌 (需要 `iconBrandColor`)
- 驗證配置
- 用於 MCP 轉換的策略範本

**3. script.csx**
- JSON-RPC 2.0 訊息處理
- 請求/回應轉換
- MCP 協定合規性邏輯
- 錯誤處理和驗證

**4. 實作指南**
- 工具註冊和執行模式
- 資源管理策略
- Copilot Studio 整合步驟
- 測試和驗證程序

## 驗證清單

### 技術合規性
- [ ] MCP 端點中的 `x-ms-agentic-protocol: mcp-streamable-1.0`
- [ ] 任何架構定義中沒有參考類型
- [ ] 所有類型欄位都是單一類型 (不是陣列)
- [ ] 資源作為工具輸出包含
- [ ] script.csx 中的 JSON-RPC 2.0 合規性
- [ ] 整個過程中的完整 URI 端點
- [ ] Copilot Studio 代理程式的清晰描述
- [ ] 驗證已正確配置
- [ ] 用於 MCP 轉換的策略範本
- [ ] 生成式編排相容性

### CLI 驗證
- [ ] **paconn validate**：`paconn validate --api-def apiDefinition.swagger.json` 無錯誤通過
- [ ] **pac CLI 就緒**：連接器可以使用 `pac connector create/update` 建立/更新
- [ ] **指令碼驗證**：script.csx 在 pac CLI 上傳期間通過自動驗證
- [ ] **套件驗證**：`ConnectorPackageValidator.ps1` 成功執行

### OAuth 和安全要求
- [ ] **OAuth 2.0 增強**：標準 OAuth 2.0 與 MCP 安全最佳實踐實作
- [ ] **權杖驗證**：實作權杖受眾驗證以防止傳遞攻擊
- [ ] **自訂安全邏輯**：script.csx 中增強的驗證以符合 MCP 規範
- [ ] **狀態參數保護**：保護狀態參數以防止 CSRF
- [ ] **HTTPS 強制執行**：所有生產端點僅使用 HTTPS
- [ ] **MCP 安全實踐**：在 OAuth 2.0 中實作混淆代理攻擊預防

### 認證要求
- [ ] **完整中繼資料**：settings.json 包含產品和服務資訊
- [ ] **圖示合規性**：PNG 格式，230x230 或 500x500 尺寸
- [ ] **文件**：認證就緒的 readme 包含全面的範例
- [ ] **安全合規性**：OAuth 2.0 透過 MCP 安全實踐、隱私權政策進行增強
- [ ] **驗證流程**：OAuth 2.0 與自訂安全驗證已正確配置

## 使用範例

```yaml
模式: 完整新連接器
連接器名稱: 客戶分析 MCP
伺服器目的: 客戶資料分析和洞察
所需工具:
  - searchCustomers: 依據條件尋找客戶
  - getCustomerProfile: 擷取詳細客戶資料
  - analyzeCustomerTrends: 產生趨勢分析
資源:
  - 客戶設定檔 (JSON 資料)
  - 分析報告 (結構化資料)
驗證: oauth2
主機環境: Azure Function
目標 API: CRM REST API
```
