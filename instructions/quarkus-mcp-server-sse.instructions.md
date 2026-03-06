---
applyTo: '*'
description: 'Quarkus 與 MCP Server 及 HTTP SSE 傳輸開發標準與指引'
---
# Quarkus MCP Server

使用 Java 21、Quarkus 及 HTTP SSE 傳輸建構 MCP 伺服器。

## 技術堆疊

- Java 21 搭配 Quarkus 框架
- MCP Server 擴充套件：`mcp-server-sse`
- CDI 用於相依性注入
- MCP 端點：`http://localhost:8080/mcp/sse`

## 快速開始

```bash
quarkus create app --no-code -x rest-client-jackson,qute,mcp-server-sse your-domain-mcp-server
```

## 結構

- 請使用標準 Java 命名慣例（類別用 PascalCase，方法用 camelCase）
- 套件組織：`model`、`repository`、`service`、`mcp`
- 不可變資料模型請用 Record 型別
- 不可變資料的狀態管理需由 repository 層負責
- 公開方法請加上 Javadoc

## MCP 工具

- 必須為 `@ApplicationScoped` CDI bean 中的公開方法
- 使用 `@Tool(name="tool_name", description="清楚描述")`
- 絕不可回傳 `null`，請回傳錯誤訊息
- 一律驗證參數並妥善處理錯誤

## 架構

- 職責分離：MCP 工具 → Service 層 → Repository
- 相依性注入請用 `@Inject`
- 資料操作需具備執行緒安全
- 請用 `Optional<T>` 避免 null pointer 例外

## 常見問題

- 請勿將商業邏輯寫在 MCP 工具（請用 service 層）
- MCP 工具請勿丟出例外（請回傳錯誤字串）
- 請勿忘記驗證輸入參數
- 請用邊界案例測試（null、空輸入等）
