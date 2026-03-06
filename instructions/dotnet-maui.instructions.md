---
description: '.NET MAUI component and application patterns'
applyTo: '**/*.xaml, **/*.cs'
---

# .NET MAUI

## .NET MAUI 程式碼風格與結構

- 撰寫符合慣例且高效的 .NET MAUI 與 C# 程式碼。
- 遵循 .NET 與 .NET MAUI 的慣例。
- 將 UI（Views）專注於版面配置與綁定，將邏輯放入 ViewModels 與 services。
- 對 I/O 與長時間執行的工作使用 async/await，以維持 UI 回應性。

## 命名慣例

- 對元件名稱、方法名稱與公開成員使用 PascalCase。
- 私有欄位與區域變數使用 camelCase。
- 介面名稱以 "I" 為前綴（例如：IUserService）。

## .NET MAUI 與 .NET 相關指引

- 利用 .NET MAUI 內建的元件生命週期（例如 OnAppearing、OnDisappearing）。
- 有效使用資料綁定（`{Binding}`）與 MVVM 模式。
- 遵循關注點分離（Separation of Concerns）來結構化元件與服務。
- 使用專案目標 .NET SDK 支援的語言版本；避免要求預覽語言功能，除非專案已設定支援。

## 重要規則（一致性）

- 絕對不要使用 ListView（已過時）。改用 CollectionView。
- 絕對不要使用 TableView（已過時）。改用 CollectionView 或 Grid/VerticalStackLayout。
- 絕對不要使用 Frame（已過時）。改用 Border。
- 絕對不要使用 `*AndExpand` 佈局選項（已過時）。改用 Grid 與明確大小。
- 絕對不要在 StackLayout/VerticalStackLayout/HorizontalStackLayout 中放置 ScrollView 或 CollectionView（可能破壞捲動與虛擬化）。改用 Grid 作為父容器。
- 絕對不要在執行時參考 `.svg` 圖檔。使用 PNG/JPG 資源。
- 絕對不要混用 Shell 導航與 NavigationPage/TabbedPage/FlyoutPage。
- 絕對不要使用 renderers。使用 handlers。
- 不要設定 `BackgroundColor`；使用 `Background`（支援漸層/brush 並為偏好的現代 API）。

## 版面配置與控制元件選擇

- 優先使用 `VerticalStackLayout`/`HorizontalStackLayout`，而非 `StackLayout Orientation="..."`（效能更佳）。
- 對於小型且非捲動列表（≤20 項）使用 `BindableLayout`；對較大或可捲動列表使用 `CollectionView`。
- 複雜版面配置或需細分空間時優先使用 `Grid`。
- 使用 `Border` 取代 `Frame` 作為容器的邊框/背景。

## Shell 導航

- 使用 Shell 作為主要的導航容器。
- 使用 `Routing.RegisterRoute(...)` 註冊路由，並以 `Shell.Current.GoToAsync(...)` 導航。
- 在啟動時設定 `MainPage`；避免頻繁變更。
- 不要在 Shell 中巢狀使用 tabs。

## 錯誤處理與驗證

- 在 .NET MAUI 頁面與 API 呼叫中實作適當的錯誤處理。
- 使用日誌記錄應用程式錯誤；對可回復的錯誤顯示友善訊息給使用者。
- 表單驗證可使用 FluentValidation 或 DataAnnotations。

## MAUI API 與效能優化

- 優先使用編譯綁定（compiled bindings）以提升效能與正確性。
  - 在 XAML 中為頁面/範本設定 `x:DataType`。
  - 優先在 C# 中使用表達式式綁定。
  - 在 CI 中考慮啟用更嚴格的 XAML 編譯（例如 `MauiStrictXamlCompilation=true`）。
- 避免過度巢狀的版面配置（尤其是巢狀 StackLayouts）。優先使用 Grid。
- 綁定策略：
  - 當值不變時使用 `OneTime`。
  - 僅對可編輯值使用 `TwoWay`。
  - 避免綁定靜態常數；直接設定它們。
- 從背景工作更新 UI 時使用 `Dispatcher.Dispatch()` 或 `Dispatcher.DispatchAsync()`：
  - 當有 Page、View 或其他 BindableObject 的參考時，優先使用 `BindableObject.Dispatcher`。
  - 在沒有 BindableObject 的 services 或 ViewModels 中注入 `IDispatcher`。
  - 若無法取得 Dispatcher，將 `MainThread.BeginInvokeOnMainThread(...)` 作為備援。
  - 避免使用已過時的 `Device.BeginInvokeOnMainThread`。

## 資源與資產

- 圖片放在 `Resources/Images/`，字型放在 `Resources/Fonts/`，原始資產放在 `Resources/Raw/`。
- 以 PNG/JPG 參考圖片（例如：`<Image Source="logo.png" />`），避免使用 `.svg`。
- 使用適當尺寸的圖片以避免記憶體膨脹。

## 狀態管理

- 優先使用 DI 管理的 services 來處理共用狀態與跨切面關注事項；將 ViewModels 綁定於導覽/頁面生命週期。

## API 設計與整合

- 使用 HttpClient 或其他適當的 service 與外部 API 或後端溝通。
- 對 API 呼叫實作錯誤處理（try-catch），並在 UI 中提供適當的使用者反饋。

## 儲存與 Secrets

- 使用 `SecureStorage` 儲存 secrets （令牌、刷新令牌），並處理例外（例如：裝置不支援、金鑰變更或損毀），透過清除/重置並重新驗證的方式回復。
- 避免將祕密儲存在 Preferences 中。

## 測試與偵錯

- 使用 xUnit、NUnit 或 MSTest 測試元件與服務。
- 使用 Moq 或 NSubstitute 模擬相依性。

## 安全性與驗證

- 在需要的情況下於 MAUI 應用中實作驗證與授權，使用 OAuth 或 JWT 作為 API 驗證。
- 對所有網路通訊使用 HTTPS 並確保正確的 CORS 政策。

## 常見陷阱

- 經常變更 `MainPage` 會導致導覽問題。
- 父子視圖同時註冊手勢辨識器會互相衝突；必要時使用 `InputTransparent = true`。
- 未解除訂閱事件或釋放資源會導致記憶體洩漏；務必解除訂閱與釋放。
- 過度巢狀的版面配置會降低效能；扁平化視覺層級會更好。
- 僅在模擬器測試會遺漏真機的邊界情況；請在實機上測試。
