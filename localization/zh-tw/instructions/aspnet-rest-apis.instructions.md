---
description: '使用 ASP.NET 建構 REST API 的指引'
applyTo: '**/*.cs, **/*.json'
---

# ASP.NET REST API 開發

## 指引
- 引導使用者以 ASP.NET Core 10 建立第一個 REST API。
- 說明傳統 Web API 控制器與新式 Minimal API 方法。
- 為每個實作決策提供教學背景，幫助使用者理解底層概念。
- 強調 API 設計、測試、文件與部署的最佳實踐。
- 著重於解釋與程式碼範例並重，而非僅實作功能。

## API 設計基礎

- 說明 REST 架構原則及其在 ASP.NET Core API 的應用。
- 引導使用者設計具意義的資源導向 URL 及正確 HTTP 動詞使用。
- 展示傳統控制器式 API 與 Minimal API 的差異。
- 說明狀態碼、內容協商與回應格式化在 REST 架構中的角色。
- 幫助使用者根據專案需求選擇 Controllers 或 Minimal APIs。

## 專案設定與結構

- 引導使用者以適當範本建立 ASP.NET Core 10 Web API 專案。
- 說明每個產生檔案與資料夾的用途，幫助理解專案結構。
- 展示如何用功能資料夾或領域驅動設計原則組織程式碼。
- 示範模型、服務與資料存取層的正確分離。
- 說明 ASP.NET Core 10 的 Program.cs 與設定系統，包括環境專屬設定。

## 建立控制器式 API

- 引導建立具正確資源命名與 HTTP 動詞實作的 RESTful 控制器。
- 說明屬性路由及其優於傳統路由的優點。
- 展示模型繫結、驗證及 [ApiController] 標註的角色。
- 說明控制器中的相依性注入運作方式。
- 解釋動作回傳型別（IActionResult、ActionResult<T>、特定型別）及其使用時機。

## 實作 Minimal APIs

- 引導使用者以 Minimal API 語法實作相同端點。
- 說明端點路由系統及如何組織路由群組。
- 展示 Minimal API 的參數繫結、驗證與相依性注入。
- 示範大型 Minimal API 應用的結構化方式以維持可讀性。
- 與控制器式方法比較，幫助使用者理解差異。

## 資料存取模式

- 引導以 Entity Framework Core 實作資料存取層。
- 說明開發與正式環境可用選項（SQL Server、SQLite、In-Memory）。
- 展示 repository 模式實作及其適用時機。
- 示範資料庫遷移與資料種子化。
- 說明高效查詢模式，避免常見效能問題。

## 驗證與授權

- 引導以 JWT Bearer token 實作驗證。
- 說明 OAuth 2.0 與 OpenID Connect 在 ASP.NET Core 的應用。
- 示範角色型與政策型授權實作。
- 展示與 Microsoft Entra ID（前 Azure AD）整合。
- 說明如何一致性保護控制器式與 Minimal API。

## 驗證與錯誤處理

- 引導以資料註解與 FluentValidation 實作模型驗證。
- 說明驗證流程及自訂驗證回應方式。
- 示範以中介軟體實作全域例外處理策略。
- 展示如何建立一致的 API 錯誤回應。
- 說明問題細節（RFC 9457）標準化錯誤回應的實作。

## API 版本管理與文件

- 引導實作與說明 API 版本管理策略。
- 示範 Swagger/OpenAPI 實作與正確文件化。
- 展示如何記錄端點、參數、回應與驗證。
- 說明控制器式與 Minimal API 的版本管理。
- 引導建立有助於消費者的 API 文件。

## 日誌與監控

- 引導以 Serilog 或其他提供者實作結構化日誌。
- 說明日誌層級及其使用時機。
- 示範與 Application Insights 整合以收集遙測。
- 展示如何實作自訂遙測與請求追蹤相關性 ID。
- 說明如何監控 API 效能、錯誤與使用模式。

## 測試 REST API

- 引導建立控制器、Minimal API 端點與服務的單元測試。
- 說明 API 端點整合測試方法。
- 示範如何模擬相依性以提升測試效果。
- 展示驗證與授權邏輯測試方式。
- 說明測試驅動開發原則在 API 開發中的應用。

## 效能最佳化

- 引導實作快取策略（記憶體、分散式、回應快取）。
- 說明非同步程式設計模式及其對 API 效能的重要性。
- 示範大型資料集的分頁、篩選與排序。
- 展示壓縮與其他效能最佳化方法。
- 說明如何測量與基準 API 效能。

## 部署與 DevOps

- 引導以 .NET 內建容器支援將 API 容器化（`dotnet publish --os linux --arch x64 -p:PublishProfile=DefaultContainer`）。
- 說明手動建立 Dockerfile 與 .NET 容器發佈功能的差異。
- 說明 ASP.NET Core 應用的 CI/CD 流程。
- 示範部署至 Azure App Service、Azure Container Apps 或其他主機選項。
- 展示如何實作健康檢查與就緒探針。
- 說明不同部署階段的環境專屬設定。
