---
description: '.NET MAUI 元件與應用程式模式'
applyTo: '**/*.xaml, **/*.cs'
---

# .NET MAUI

## .NET MAUI 程式風格與結構

- 撰寫符合慣例且高效的 .NET MAUI 與 C# 程式碼。
- 遵循 .NET 及 .NET MAUI 慣例。
- 小型元件可用內嵌函式，複雜邏輯則分離至 code-behind 或服務類別。
- 適用時請使用 async/await，確保 UI 操作不阻塞。

## 命名慣例

- 元件名稱、方法名稱及公開成員採用 PascalCase。
- 私有欄位與區域變數使用 camelCase。
- 介面名稱加上 "I" 前綴（如：IUserService）。

## .NET MAUI 與 .NET 專屬指引

- 善用 .NET MAUI 內建元件生命週期功能（如 OnAppearing、OnDisappearing）。
- 有效運用資料繫結（{Binding}）。
- 元件與服務結構應遵循職責分離原則。
- 一律使用最新版本 C#，目前如 C# 13 的 record 型別、模式比對、全域 using。

## 錯誤處理與驗證

- 為 .NET MAUI 頁面與 API 呼叫實作妥善錯誤處理。
- 後端錯誤追蹤請使用日誌，前端可用 MAUI Community Toolkit 的 Logger 捕捉 UI 層錯誤。
- 表單驗證可用 FluentValidation 或 DataAnnotations。

## MAUI API 與效能最佳化

- 善用 MAUI 內建元件生命週期功能（如 OnAppearing、OnDisappearing）。
- API 呼叫或可能阻塞主執行緒的 UI 行為請用非同步方法（async/await）。
- 透過有效運用 OnPropertyChanged()，減少不必要的元件重繪。
- 盡量縮減元件渲染樹，僅在必要時重繪，適時使用 BatchBegin() 與 BatchCommit()。

## 快取策略

- 常用資料可用記憶體快取，MAUI 應用建議用 IMemoryCache。
- 大型應用需多用戶或多端共享狀態時，可考慮分散式快取（如 Redis 或 SQL Server Cache）。
- API 呼叫可快取回應，避免重複請求，提升使用者體驗。

## 狀態管理函式庫

- 跨元件狀態共享請用相依性注入與 .NET MAUI Community Toolkit。

## API 設計與整合

- 與外部 API 或自家後端溝通請用 HttpClient 或其他合適服務。
- API 呼叫請用 try-catch 處理錯誤，並在 UI 給予適當回饋。

## 測試與除錯

- 元件與服務測試可用 xUnit、NUnit 或 MSTest。
- 模擬相依物件時可用 Moq 或 NSubstitute。

## 安全性與認證

- 需要時於 MAUI 應用實作認證與授權，API 認證可用 OAuth 或 JWT。
- 所有網路通訊均使用 HTTPS，並確保正確實施 CORS 政策。

## API 文件與 Swagger

- 後端 API 服務請用 Swagger/OpenAPI 產生 API 文件。
- 模型與 API 方法請加上 XML 文件註解，以強化 Swagger 文件。
