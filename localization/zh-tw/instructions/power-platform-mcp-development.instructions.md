---
description: '用於開發 Power Platform 自訂連接器的說明，其中包含適用於 Microsoft Copilot Studio 的模型內容協定 (MCP) 整合'
applyTo: '**/*.{json,csx,md}'
---

# Power Platform MCP 自訂連接器開發

## 說明

### MCP 協定整合
- 始終實作 JSON-RPC 2.0 標準以進行 MCP 通訊
- 使用 `x-ms-agentic-protocol: mcp-streamable-1.0` 標頭以實現 Copilot Studio 相容性
- 建構端點以支援標準 REST 操作和 MCP 工具呼叫
- 轉換回應以符合 Copilot Studio 限制 (不支援參考類型，僅支援單一類型)

### 結構描述設計最佳實務
- 從 JSON 結構描述中移除 `$ref` 和其他參考類型，因為 Copilot Studio 無法處理它們
- 在結構描述定義中使用單一類型而不是類型陣列
- 將 `anyOf`/`oneOf` 建構扁平化為單一結構描述以實現 Copilot Studio 相容性
- 確保所有工具輸入結構描述都是自包含的，沒有外部參考

### 驗證和安全性
- 在 Power Platform 限制內實作帶有 MCP 安全性最佳實務的 OAuth 2.0
- 使用連線參數集進行彈性驗證組態
- 驗證權杖受眾以防止傳遞攻擊
- 新增 MCP 特定安全性標頭以增強驗證
- 支援多種驗證方法 (OAuth 標準、OAuth 增強、API 金鑰回退)

### 自訂指令碼實作
- 在自訂指令碼 (script.csx) 中處理 JSON-RPC 轉換
- 使用 JSON-RPC 錯誤回應格式實作適當的錯誤處理
- 在驗證流程中新增權杖驗證和受眾檢查
- 轉換 MCP 伺服器回應以實現 Copilot Studio 相容性
- 使用連線參數進行動態安全性組態

### Swagger 定義指南
- 使用 Swagger 2.0 規格以實現 Power Platform 相容性
- 為每個端點實作適當的 `operationId` 值
- 使用適當的類型和描述定義清晰的參數結構描述
- 為所有成功和錯誤案例新增全面的回應結構描述
- 包含適當的 HTTP 狀態碼和回應標頭

### 資源和工具管理
- 建構 MCP 資源，使其可在 Copilot Studio 中作為工具輸出使用
- 確保資源內容的正確 MIME 類型宣告
- 新增受眾和優先順序註釋以實現更好的 Copilot Studio 整合
- 實作資源轉換以滿足 Copilot Studio 要求

### 連線參數組態
- 使用列舉下拉式選單進行 OAuth 版本和安全性層級選取
- 提供清晰的參數描述和約束
- 支援多個驗證參數集以用於不同的部署情境
- 適當時包含驗證規則和預設值
- 透過連線參數值啟用動態組態

### 錯誤處理和記錄
- 實作遵循 JSON-RPC 2.0 錯誤格式的全面錯誤回應
- 新增驗證、驗證和轉換步驟的詳細記錄
- 提供有助於疑難排解的清晰錯誤訊息
- 包含與錯誤條件一致的適當 HTTP 狀態碼

### 測試和驗證
- 使用實際的 MCP 伺服器實作測試連接器
- 驗證結構描述轉換是否與 Copilot Studio 正常運作
- 驗證所有支援參數集的驗證流程
- 確保各種失敗情境的適當錯誤處理
- 測試連線參數組態和動態行為

## 其他指南

### Power Platform 認證要求
- 包含全面的文件 (readme.md、CUSTOMIZE.md)
- 提供清晰的設定和組態說明
- 記錄所有驗證選項和安全性考量
- 包含適當的發行者和堆疊擁有者資訊
- 確保符合 Power Platform 連接器認證標準

### MCP 伺服器相容性
- 設計為與標準 MCP 伺服器實作相容
- 支援常見的 MCP 方法，例如 `tools/list`、`tools/call`、`resources/list`
- 適當地處理 `mcp-streamable-1.0` 協定的串流回應
- 實作適當的協定協商和功能偵測

### Copilot Studio 整合
- 確保工具定義在 Copilot Studio 的限制內正常運作
- 從 Copilot Studio 介面測試資源存取和工具呼叫
- 驗證轉換後的結構描述在對話中產生預期的行為
- 確認與 Copilot Studio 的代理程式框架的正確整合
