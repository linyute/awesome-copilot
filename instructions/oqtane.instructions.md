---
description: 'Oqtane 模組模式'
applyTo: '**/*.razor, **/*.razor.cs, **/*.razor.css'
---

## Blazor 程式碼風格和結構

- 編寫慣用且高效的 Blazor 和 C# 程式碼。
- 遵循 .NET 和 Blazor 慣例。
- 適當地使用 Razor 元件進行基於元件的 UI 開發。
- 適當地使用 Blazor 元件進行基於元件的 UI 開發。
- 對於較小的元件，偏好使用內聯函式，但將複雜邏輯分離到程式碼後置或服務類別中。
- 應在適用情況下使用 Async/await 以確保非阻塞 UI 操作。


## 命名慣例

- 元件名稱、方法名稱和公共成員使用 PascalCase。
- 私有欄位和局部變數使用 camelCase。
- 介面名稱以「I」為前綴 (例如，IUserService)。

## Blazor 和 .NET 特定準則

- 利用 Blazor 內建的元件生命週期功能 (例如，OnInitializedAsync、OnParametersSetAsync)。
- 有效地使用 @bind 進行資料繫結。
- 在 Blazor 中利用依賴注入來處理服務。
- 遵循關注點分離原則來組織 Blazor 元件和服務。
- 始終使用最新版本的 C#，目前是 C# 13 的功能，例如記錄類型、模式匹配和全域 using。

## Oqtane 特定準則
- 請參閱 [Main Oqtane repo](https://github.com/oqtane/oqtane.framework) 中的基底類別和模式。
- 遵循模組開發的客戶端伺服器模式。
- 客戶端專案在 modules 資料夾中包含各種模組。
- 客戶端模組中的每個動作都是一個獨立的 razor 檔案，它繼承自 ModuleBase，其中 index.razor 是預設動作。
- 對於複雜的客戶端處理，例如獲取資料，請建立一個繼承自 ServiceBase 的服務類別，並將其放在 services 資料夾中。每個模組一個服務類別。
- 客戶端服務應使用 ServiceBase 方法呼叫伺服器端點。
- 伺服器專案包含 MVC 控制器，每個模組一個，與客戶端服務呼叫匹配。每個控制器將呼叫由 DI 管理的伺服器端服務或儲存庫。
- 伺服器專案使用模組的儲存庫模式，每個模組一個儲存庫類別以匹配控制器。

## 錯誤處理和驗證

- 為 Blazor 頁面和 API 呼叫實作適當的錯誤處理。
- 使用基底類別中內建的 Oqtane 記錄方法。
- 使用記錄來追蹤後端錯誤，並考慮使用 ErrorBoundary 等工具在 Blazor 中捕獲 UI 層級錯誤。
- 在表單中使用 FluentValidation 或 DataAnnotations 實作驗證。

## Blazor API 和效能最佳化

- 根據專案需求最佳化使用 Blazor 伺服器端或 WebAssembly。
- 對於可能阻塞主執行緒的 API 呼叫或 UI 動作，使用非同步方法 (async/await)。
- 透過減少不必要的重新渲染並有效使用 StateHasChanged() 來最佳化 Razor 元件。
- 透過避免不必要的重新渲染來最小化元件渲染樹，在適當情況下使用 ShouldRender()。
- 使用 EventCallbacks 有效處理使用者互動，在觸發事件時僅傳遞最少的資料。

## 快取策略

- 對於常用資料實作記憶體快取，特別是對於 Blazor Server 應用程式。使用 IMemoryCache 進行輕量級快取解決方案。
- 對於 Blazor WebAssembly，利用 localStorage 或 sessionStorage 在使用者會話之間快取應用程式狀態。
- 對於需要跨多個使用者或客戶端共享狀態的較大型應用程式，考慮分散式快取策略 (例如 Redis 或 SQL Server Cache)。
- 透過儲存回應來快取 API 呼叫，以避免在資料不太可能更改時進行冗餘呼叫，從而改善使用者體驗。

## 狀態管理函式庫

- 使用 Blazor 內建的級聯參數和 EventCallbacks 在元件之間進行基本狀態共享。
- 在適當情況下使用基底類別中內建的 Oqtane 狀態管理，例如 PageState 和 SiteState。
- 當應用程式複雜度增加時，避免添加額外的依賴項，例如 Fluxor 或 BlazorState。
- 對於 Blazor WebAssembly 中的客戶端狀態持久性，考慮使用 Blazored.LocalStorage 或 Blazored.SessionStorage 來維護頁面重新載入之間的狀態。
- 對於伺服器端 Blazor，使用 Scoped Services 和 StateContainer 模式來管理使用者會話中的狀態，同時最小化重新渲染。

## API 設計和整合

- 使用服務基底方法與外部 API 或伺服器專案後端進行通訊。
- 使用 try-catch 為 API 呼叫實作錯誤處理，並在 UI 中提供適當的使用者回饋。

## Visual Studio 中的測試和偵錯

- 所有單元測試和整合測試都應在 Visual Studio Enterprise 中完成。
- 使用 xUnit、NUnit 或 MSTest 測試 Blazor 元件和服務。
- 在測試期間使用 Moq 或 NSubstitute 模擬依賴項。
- 使用瀏覽器開發人員工具偵錯 Blazor UI 問題，並使用 Visual Studio 的偵錯工具偵錯後端和伺服器端問題。
- 對於效能分析和最佳化，依賴 Visual Studio 的診斷工具。

## 安全性和驗證

- 使用內建的 Oqtane 基底類別成員 (例如 User.Roles) 實作驗證和授權。
- 所有網路通訊都使用 HTTPS，並確保實作適當的 CORS 策略。
