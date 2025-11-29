---
mode: 'agent'
description: '使用工具、提示和正確配置生成完整的 C# MCP 伺服器專案'
---

# 生成 C# MCP 伺服器

使用以下規範在 C# 中建立完整的模型上下文協定 (MCP) 伺服器：

## 要求

1. **專案結構**：建立具有正確目錄結構的新 C# 主控台應用程式
2. **NuGet 套件**：包含 ModelContextProtocol (預發行版) 和 Microsoft.Extensions.Hosting
3. **日誌配置**：將所有日誌配置為 stderr，以避免干擾 stdio 傳輸
4. **伺服器設定**：使用主機建構器模式和正確的 DI 配置
5. **工具**：建立至少一個具有正確屬性和描述的有用工具
6. **錯誤處理**：包含正確的錯誤處理和驗證

## 實作細節

### 基本專案設定
- 使用 .NET 8.0 或更高版本
- 建立主控台應用程式
- 使用 --prerelease 旗標新增必要的 NuGet 套件
- 將日誌配置為 stderr

### 伺服器配置
- 使用 `Host.CreateApplicationBuilder` 進行 DI 和生命週期管理
- 使用 stdio 傳輸配置 `AddMcpServer()`
- 使用 `WithToolsFromAssembly()` 進行自動工具發現
- 確保伺服器使用 `RunAsync()` 執行

### 工具實作
- 在工具類別上使用 `[McpServerToolType]` 屬性
- 在工具方法上使用 `[McpServerTool]` 屬性
- 為工具和參數新增 `[Description]` 屬性
- 在適當的情況下支援非同步操作
- 包含正確的參數驗證

### 程式碼品質
- 遵循 C# 命名慣例
- 包含 XML 文件註解
- 使用可為 Null 的參考類型
- 使用 McpProtocolException 實作正確的錯誤處理
- 使用結構化日誌進行偵錯

## 要考慮的範例工具類型
- 檔案操作 (讀取、寫入、搜尋)
- 資料處理 (轉換、驗證、分析)
- 外部應用程式介面整合 (HTTP 請求)
- 系統操作 (執行命令、檢查狀態)
- 資料庫操作 (查詢、更新)

## 測試指南
- 解釋如何執行伺服器
- 提供使用 MCP 用戶端測試的範例命令
- 包含疑難排解提示

生成一個完整、可投入生產的 MCP 伺服器，並提供全面的文件和錯誤處理。
