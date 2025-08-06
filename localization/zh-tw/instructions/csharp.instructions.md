---
description: 'C# 應用程式建構指引'
applyTo: '**/*.cs'
---

# C# 開發

## C# 指引
- 一律使用最新版本 C#，目前為 C# 13 功能。
- 每個函式都要撰寫清楚且簡潔的註解。

## 一般指引
- 審查程式碼變更時僅提出高信心建議。
- 程式碼需具良好可維護性，並註明設計決策原因。
- 處理邊界案例並撰寫清楚的例外處理。
- 使用函式庫或外部相依時，需在註解中說明用途與目的。

## 命名慣例

- 元件名稱、方法名稱與公開成員皆用 PascalCase。
- 私有欄位與區域變數用 camelCase。
- 介面名稱加 "I" 前綴（如 IUserService）。

## 格式化

- 遵循 `.editorconfig` 定義的程式碼格式。
- 優先使用檔案範圍命名空間宣告與單行 using 指令。
- 所有程式區塊（如 `if`、`for`、`while`、`foreach`、`using`、`try` 等）開頭大括號前需換行。
- 方法的最終 return 陳述式需獨立一行。
- 優先使用模式比對與 switch 運算式。
- 參考成員名稱時用 `nameof`，勿用字串。
- 所有公開 API 需撰寫 XML 文件註解，並於適用時加入 `<example>` 與 `<code>` 文件。

## 專案設定與結構

- 指導使用者建立新 .NET 專案並選用適合的範本。
- 說明每個產生檔案與資料夾的用途，幫助理解專案結構。
- 示範如何用功能資料夾或領域驅動設計原則組織程式碼。
- 展示模型、服務與資料存取層的職責分離。
- 說明 ASP.NET Core 9 的 Program.cs 與設定系統，包括環境特定設定。

## 可空參考型別

- 變數宣告時預設為不可空，並於入口點檢查 `null`。
- 一律用 `is null` 或 `is not null`，勿用 `== null` 或 `!= null`。
- 信任 C# 的 null 標註，型別系統保證不可 null 時不需額外檢查。

## 資料存取模式

- 指導使用 Entity Framework Core 實作資料存取層。
- 說明開發與正式環境可用選項（SQL Server、SQLite、In-Memory）。
- 示範 repository 模式實作及其適用時機。
- 展示資料庫遷移與資料種子化實作。
- 說明高效查詢模式，避免常見效能問題。

## 認證與授權

- 指導使用者用 JWT Bearer token 實作認證。
- 說明 OAuth 2.0 與 OpenID Connect 在 ASP.NET Core 的概念。
- 示範角色式與政策式授權實作。
- 展示與 Microsoft Entra ID（前 Azure AD）整合。
- 說明如何一致性保護控制器式與 Minimal API。

## 驗證與錯誤處理

- 指導用資料註解與 FluentValidation 實作模型驗證。
- 說明驗證管線與自訂驗證回應方式。
- 示範用中介軟體實作全域例外處理策略。
- 展示如何建立一致的 API 錯誤回應。
- 說明 RFC 7807 問題細節標準化錯誤回應實作。

## API 版本管理與文件

- 指導實作與說明 API 版本管理策略。
- 示範 Swagger/OpenAPI 實作與文件撰寫。
- 展示如何記錄端點、參數、回應與認證。
- 說明控制器式與 Minimal API 的版本管理。
- 指導撰寫有意義的 API 文件，協助消費者理解。

## 日誌與監控

- 指導用 Serilog 或其他提供者實作結構化日誌。
- 說明日誌層級及其適用時機。
- 示範整合 Application Insights 進行遙測收集。
- 展示自訂遙測與關聯 ID 實作，追蹤請求。
- 說明如何監控 API 效能、錯誤與使用模式。

## 測試

- 關鍵路徑一律需有測試案例。
- 指導建立單元測試。
- 不得產生「Act」、「Arrange」或「Assert」註解。
- 測試方法名稱與大小寫請複製鄰近檔案既有風格。
- 說明 API 端點整合測試方法。
- 示範如何模擬相依物件進行有效測試。
- 展示認證與授權邏輯測試方法。
- 說明測試驅動開發原則於 API 開發的應用。

## 效能最佳化

- 指導實作快取策略（記憶體、分散式、回應快取）。
- 說明非同步程式設計模式及其對 API 效能的重要性。
- 示範大量資料分頁、篩選與排序。
- 展示壓縮與其他效能最佳化方法。
- 說明如何測量與基準 API 效能。

## 部署與 DevOps

- 指導用 .NET 內建容器支援（`dotnet publish --os linux --arch x64 -p:PublishProfile=DefaultContainer`）將 API 容器化。
- 說明手動 Dockerfile 建立與 .NET 容器發佈功能差異。
- 說明 NET 應用 CI/CD 流程。
- 示範部署至 Azure App Service、Azure Container Apps 或其他主機選項。
- 展示健康檢查與就緒探針實作。
- 說明不同部署階段的環境特定設定。

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 翻譯為繁體中文，可能包含錯誤。如發現不適當或錯誤的翻譯，請至 [issue](../../issues) 回報。
