---
applyTo: '**/*.java, **/application*.properties, **/application*.yml, **/application*.yaml'
description: 'Quarkus MCP 伺服器開發標準與指示，包含可串流 HTTP（建議使用）以及舊版 HTTP SSE 傳輸方式'
---
# Quarkus MCP 伺服器

僅在專案使用 Quarkus MCP 伺服器擴充功能（`mcp-server-http` 或舊版 `mcp-server-sse`）時套用這些指示。

使用 Java 21、Quarkus 及可串流 HTTP 傳輸方式（亦支援舊版 HTTP SSE）建構 MCP 伺服器。

## 技術堆疊

- 搭配 Quarkus 框架的 Java 21
- MCP 伺服器擴充功能：`mcp-server-http`（`io.quarkiverse.mcp:quarkus-mcp-server-http`），同時提供兩種傳輸方式：位於 `http://localhost:8080/mcp/sse` 的舊版 HTTP/SSE，以及位於 `http://localhost:8080/mcp` 的可串流 HTTP（建議使用；SSE 在 MCP 規格中已被棄用）
- 最近的 Quarkus 平台 BOM 未管理 `mcp-server-sse`（已驗證：3.40.1 中不存在）；Quarkus CLI 在被要求時會默默地降級回退到較舊的平台串流。僅在維護已依賴它的現有專案時使用它。
- 用於相依性插入的 CDI

## 快速開始

```bash
quarkus create app --no-code -x rest-client-jackson,qute,mcp-server-http your-domain-mcp-server
```

## 結構

- 使用標準 Java 命名慣例（PascalCase 類別、camelCase 方法）
- 依套件組織：`model`、`repository`、`service`、`mcp`
- 對不可變資料模型使用 Record 類型
- 不可變資料的狀態管理必須由存放庫層（repository layer）管理
- 為 public 方法新增 Javadoc

## MCP 工具

- 必須是 `@ApplicationScoped` CDI bean 中的 public 方法
- 使用 `@Tool(name="tool_name", description="clear description")`
- 絕不傳回 `null` - 改為傳回錯誤訊息
- 始終驗證參數並妥善處理錯誤

## 架構

- 關注點分離：MCP 工具 → 服務層 → 存放庫（Repository）
- 使用建構函式插入（在單一建構函式上 `@Inject` 是可選的）
- 讓資料操作具備執行緒安全
- 使用 `Optional<T>` 避免 NullPointerException

## 常見問題

- 請勿將商務邏輯放在 MCP 工具中（使用服務層）
- 對於預期的商務錯誤，請擲出 `io.quarkiverse.mcp.server.ToolCallException`（其訊息會變成失敗的工具結果）；請勿讓其他未處理的例外狀況逸出，因為它們會被回報為一般內部錯誤
- 不要忘記驗證輸入參數
- 使用邊界案例（null、空輸入）進行測試