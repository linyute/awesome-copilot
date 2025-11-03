---
mode: 'agent'
description: '使用工具、資源和適當的配置，在 Python 中建立一個完整的 MCP 伺服器專案'
---

# 建立 Python MCP 伺服器

使用以下規範在 Python 中建立一個完整的模型上下文協定 (MCP) 伺服器：

## 要求

1. **專案結構**: 使用 uv 建立一個具有適當結構的新 Python 專案
2. **依賴項**: 使用 uv 包含 mcp[cli] 套件
3. **傳輸類型**: 選擇 stdio (用於本地) 或 streamable-http (用於遠端)
4. **工具**: 建立至少一個具有適當類型提示的實用工具
5. **錯誤處理**: 包含全面的錯誤處理和驗證

## 實作細節

### 專案設定
- 使用 `uv init project-name` 初始化
- 新增 MCP SDK: `uv add "mcp[cli]"`
- 建立主伺服器檔案 (例如，`server.py`)
- 為 Python 專案新增 `.gitignore`
- 使用 `if __name__ == "__main__"` 配置直接執行

### 伺服器配置
- 使用 `mcp.server.fastmcp` 中的 `FastMCP` 類別
- 設定伺服器名稱和可選的說明
- 選擇傳輸方式：stdio (預設) 或 streamable-http
- 對於 HTTP：可選地配置主機、埠和無狀態模式

### 工具實作
- 在函式上使用 `@mcp.tool()` 裝飾器
- 始終包含類型提示 - 它們會自動產生結構描述
- 編寫清晰的 docstrings - 它們會成為工具描述
- 使用 Pydantic 模型或 TypedDicts 進行結構化輸出
- 支援 I/O 綁定任務的非同步操作
- 包含適當的錯誤處理

### 資源/提示設定 (可選)
- 使用 `@mcp.resource()` 裝飾器新增資源
- 對於動態資源使用 URI 模板: `"resource://{param}"`
- 使用 `@mcp.prompt()` 裝飾器新增提示
- 從提示中回傳字串或訊息列表

### 程式碼品質
- 對所有函式參數和回傳使用類型提示
- 為工具、資源和提示編寫 docstrings
- 遵循 PEP 8 風格指南
- 對於非同步操作使用 async/await
- 實作上下文管理器以進行資源清理
- 為複雜邏輯新增行內註解

## 可考慮的範例工具類型
- 資料處理和轉換
- 檔案系統操作 (讀取、分析、搜尋)
- 外部 API 整合
- 資料庫查詢
- 文字分析或產生 (帶有取樣)
- 系統資訊檢索
- 數學或科學計算

## 配置選項
- **對於 stdio 伺服器**:
  - 簡單的直接執行
  - 使用 `uv run mcp dev server.py` 進行測試
  - 安裝到 Claude: `uv run mcp install server.py`
  
- **對於 HTTP 伺服器**:
  - 透過環境變數進行埠配置
  - 為了延展性而採用無狀態模式: `stateless_http=True`
  - JSON 回應模式: `json_response=True`
  - 瀏覽器用戶端的 CORS 配置
  - 掛載到現有的 ASGI 伺服器 (Starlette/FastAPI)

## 測試指南
- 解釋如何執行伺服器:
  - stdio: `python server.py` 或 `uv run server.py`
  - HTTP: `python server.py` 然後連接到 `http://localhost:PORT/mcp`
- 使用 MCP Inspector 測試: `uv run mcp dev server.py`
- 安裝到 Claude Desktop: `uv run mcp install server.py`
- 包含範例工具呼叫
- 新增故障排除提示

## 可考慮的其他功能
- 用於日誌記錄、進度和通知的上下文使用
- 用於 AI 驅動工具的 LLM 取樣
- 用於互動式工作流程的使用者輸入引導
- 共享資源 (資料庫、連接) 的生命週期管理
- 使用 Pydantic 模型進行結構化輸出
- 用於 UI 顯示的圖示
- 使用 Image 類別處理影像
- 支援完成以提供更好的使用者體驗

## 最佳實踐
- 到處使用類型提示 - 它們不是可選的
- 盡可能回傳結構化資料
- 記錄到 stderr (或使用上下文日誌記錄) 以避免 stdout 污染
- 適當地清理資源
- 及早驗證輸入
- 提供清晰的錯誤訊息
- 在 LLM 整合之前獨立測試工具

建立一個具有類型安全、適當錯誤處理和全面文件的完整、可投入生產的 MCP 伺服器。
