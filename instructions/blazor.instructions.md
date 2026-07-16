---
description: 'Blazor 元件與應用程式設計模式'
applyTo: '**/*.razor, **/*.razor.cs, **/*.razor.css'
---

## Blazor 程式風格與結構

- 撰寫符合慣例且高效的 Blazor 與 C# 程式碼。
- 遵循 .NET 與 Blazor 的慣例。
- 適當使用 Razor 元件進行元件化 UI 開發。
- 小型元件可用內嵌函式，複雜邏輯則分離至 code-behind 或服務類別。
- 適用時請使用 async/await，確保 UI 操作不阻塞。

## 命名慣例

- 元件名稱、方法名稱與公開成員皆用 PascalCase。
- 私有欄位與區域變數用 camelCase。
- 介面名稱加 "I" 前綴（如 IUserService）。

## Blazor 與 .NET 特定指引

- 善用 Blazor 內建元件生命週期（如 OnInitializedAsync, OnParametersSetAsync）。
- 有效運用 @bind 進行資料繫結。
- 利用相依性注入（Dependency Injection）注入 Blazor 服務。
- 元件與服務結構遵循職責分離原則。
- 一律使用最新 C# 版本，目前如 C# 14 的 record 型別、模式比對、全域 using 等功能。

## 錯誤處理與驗證

- 為 Blazor 頁面與 API 呼叫實作適當錯誤處理。
- 後端錯誤追蹤請用日誌，Blazor UI 層可用 ErrorBoundary 等工具捕捉錯誤。
- 表單驗證可用 FluentValidation 或 DataAnnotations。

## Blazor API 與效能最佳化

- 根據專案需求選用 Blazor Server 或 WebAssembly。
- API 呼叫或可能阻塞主執行緒的 UI 行為請用非同步方法（async/await）。
- Razor 元件最佳化：減少不必要的重繪，善用 StateHasChanged()。
- 精簡元件渲染樹，避免不必要重繪，適時使用 ShouldRender()。
- 使用 EventCallbacks 高效處理使用者互動，事件觸發時僅傳遞必要資料。

## 快取策略

- Blazor Server 應用常用資料可用記憶體快取（IMemoryCache）。
- Blazor WebAssembly 可用 localStorage 或 sessionStorage 快取應用狀態。
- 大型應用需多用戶或多端共享狀態時，可用分散式快取（如 Redis 或 SQL Server Cache）。
- API 呼叫可快取回應，避免重複請求，提升使用者體驗。

## 狀態管理函式庫

- 基本元件間狀態共享可用 Blazor 內建 Cascading Parameters 與 EventCallbacks。
- 應用複雜時可用 Fluxor 或 BlazorState 等進階狀態管理函式庫。
- Blazor WebAssembly 客戶端狀態持久化可用 Blazored.LocalStorage 或 Blazored.SessionStorage。
- Blazor Server 端可用 Scoped Services 與 StateContainer 模式管理使用者會話狀態，並減少重繪。

## API 設計與整合

- 與外部 API 或後端溝通請用 HttpClient 或其他適合服務。
- API 呼叫請用 try-catch 處理錯誤，並在 UI 給予適當回饋。

## 測試與除錯

- 所有單元測試與整合測試都應支援跨 IDE（Visual Studio、VS Code、JetBrains Rider）運行，使貢獻者不會因為付費授權（SKU）而受限。
- 請使用 xUnit、NUnit 或 MSTest 測試 Blazor 元件與服務。
- 測試期間請使用 Moq 或 NSubstitute 來模擬（mocking）依賴項。
- 請使用瀏覽器開發者工具偵錯 Blazor UI 問題，並使用 IDE 的偵錯器處理後端與伺服器端的問題。
- 進行效能分析與最佳化時，請使用 IDE 的診斷工具，或使用 `dotnet-trace` / `dotnet-counters` 進行跨平台分析。

## 資安與認證

- 需認證與授權時，Blazor 應用可用 ASP.NET Identity 或 JWT Token 進行 API 認證。
- 所有網路通訊皆用 HTTPS，並正確設置 CORS 政策。

## API 文件與 Swagger

- 後端 API 服務請用 Swagger/OpenAPI 產生 API 文件。
- 模型與 API 方法請加上 XML 文件註解，以增強 Swagger 文件。
