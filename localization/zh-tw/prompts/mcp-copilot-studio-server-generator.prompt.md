---
description: 建立一個完整的 MCP 伺服器實作，針對 Copilot Studio 整合進行優化，並具有適當的綱要約束和可串流 HTTP 支援
agent: agent
---

# Power Platform MCP 連接器產生器

建立一個完整的 Power Platform 自訂連接器，其中包含適用於 Microsoft Copilot Studio 的模型內容協定 (MCP) 整合。此提示會建立所有必要的檔案，遵循 Power Platform 連接器標準並支援 MCP 可串流 HTTP。

## 指示

建立一個完整的 MCP 伺服器實作，該實作：

1. **使用 Copilot Studio MCP 模式：**
   - 實作 `x-ms-agentic-protocol: mcp-streamable-1.0`
   - 支援 JSON-RPC 2.0 通訊協定
   - 在 `/mcp` 提供可串流 HTTP 端點
   - 遵循 Power Platform 連接器結構

2. **綱要合規性要求：**
   - 工具輸入/輸出中**沒有參考類型** (由 Copilot Studio 篩選)
   - **僅限單一類型值** (不是多種類型的陣列)
   - **避免列舉輸入** (解釋為字串，而不是列舉)
   - 使用基本類型：字串、數字、整數、布林值、陣列、物件
   - 確保所有端點都傳回完整的 URI

3. **要包含的 MCP 元件：**
   - **工具**：供語言模型呼叫的函式 (✅ Copilot Studio 支援)
   - **資源**：來自工具的檔案狀資料輸出 (✅ Copilot Studio 支援 - 必須是工具輸出才能存取)
   - **提示**：用於特定任務的預定義範本 (❌ Copilot Studio 尚未支援)

4. **實作結構：**
   ```
   /apiDefinition.swagger.json  (Power Platform 連接器綱要)
   /apiProperties.json         (連接器 Metadata 和組態)
   /script.csx                 (自訂程式碼轉換和邏輯)
   /server/                    (MCP 伺服器實作)
   /tools/                     (個別 MCP 工具)
   /resources/                 (MCP 資源處理程式)
   ```

## 上下文變數

- **伺服器目的**：[描述 MCP 伺服器應完成的任務]
- **所需工具**：[要實作的特定工具清單]
- **資源**：[要提供的資源類型]
- **驗證**：[驗證方法：無、api-key、oauth2]
- **主機環境**：[Azure Function、Express.js、FastAPI 等]
- **目標 API**：[要整合的外部 API]

## 預期輸出

產生：

1. **apiDefinition.swagger.json** 包含：
   - 適當的 `x-ms-agentic-protocol: mcp-streamable-1.0`
   - POST `/mcp` 的 MCP 端點
   - 符合規範的綱要定義 (沒有參考類型)
   - McpResponse 和 McpErrorResponse 定義

2. **apiProperties.json** 包含：
   - 連接器 Metadata 和品牌
   - 驗證組態
   - 如果需要，則為原則範本

3. **script.csx** 包含：
   - 用於要求/回應轉換的自訂 C# 程式碼
   - MCP JSON-RPC 訊息處理邏輯
   - 資料驗證和處理函式
   - 錯誤處理和記錄功能

4. **MCP 伺服器程式碼** 包含：
   - JSON-RPC 2.0 要求處理程式
   - 工具註冊和執行
   - 資源管理 (作為工具輸出)
   - 適當的錯誤處理
   - Copilot Studio 相容性檢查

5. **個別工具**：
   - 僅接受基本類型輸入
   - 傳回結構化輸出
   - 需要時將資源包含為輸出
   - 為 Copilot Studio 提供清晰的描述

6. **部署組態** 適用於：
   - Power Platform 環境
   - Copilot Studio 代理程式整合
   - 測試和驗證

## 驗證清單

確保產生的程式碼：
- [ ] 綱要中沒有參考類型
- [ ] 所有類型欄位都是單一類型
- [ ] 透過字串進行列舉處理並進行驗證
- [ ] 透過工具輸出可用的資源
- [ ] 完整的 URI 端點
- [ ] 符合 JSON-RPC 2.0
- [ ] 適當的 x-ms-agentic-protocol 標頭
- [ ] McpResponse/McpErrorResponse 綱要
- [ ] Copilot Studio 的清晰工具描述
- [ ] 產生式協調相容

## 使用範例

```yaml
伺服器目的: 客戶資料管理和分析
所需工具: 
  - searchCustomers
  - getCustomerDetails
  - analyzeCustomerTrends
資源:
  - 客戶設定檔
  - 分析報告
驗證: oauth2
主機環境: Azure Function
目標 API: CRM System REST API
```
