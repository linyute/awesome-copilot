---
description: 'WinUI 3 與 Windows App SDK 程式碼撰寫指引。防止常見的 UWP API 誤用，強制對桌面 Windows 應用程式使用正確的 XAML 命名空間、執行緒、視窗化與 MVVM 模式。'
applyTo: '**/*.xaml, **/*.cs, **/*.csproj'
---

# WinUI 3 / Windows App SDK

## 關鍵規則 — 絕不可使用舊版 UWP API (Critical Rules — NEVER Use Legacy UWP APIs)

這些 UWP 模式對於 WinUI 3 桌面應用程式而言是「錯誤」的。請務必使用 Windows App SDK 的等效項目。

- **絕不可**使用 `Windows.UI.Popups.MessageDialog`。請使用已設定 `XamlRoot` 的 `ContentDialog`。
- **絕不可**在未先設定 `dialog.XamlRoot = this.Content.XamlRoot` 的情況下顯示 `ContentDialog`。
- **絕不可**使用 `CoreDispatcher.RunAsync` 或 `Dispatcher.RunAsync`。請使用 `DispatcherQueue.TryEnqueue`。
- **絕不可**使用 `Window.Current`。請透過靜態的 `App.MainWindow` 屬性追蹤主視窗。
- **絕不可**使用 `Windows.UI.Xaml.*` 命名空間。請使用 `Microsoft.UI.Xaml.*`。
- **絕不可**使用 `Windows.UI.Composition`。請使用 `Microsoft.UI.Composition`。
- **絕不可**使用 `Windows.UI.Colors`。請使用 `Microsoft.UI.Colors`。
- **絕不可**使用 `ApplicationView` 或 `CoreWindow` 進行視窗管理。請使用 `Microsoft.UI.Windowing.AppWindow`。
- **絕不可**使用 `CoreApplicationViewTitleBar`。請使用 `AppWindowTitleBar`。
- **絕不可**使用 `GetForCurrentView()` 模式 (例如：`UIViewSettings.GetForCurrentView()`)。這些在桌面 WinUI 3 中並不存在。請改用 `AppWindow` API。
- **絕不可**直接使用 UWP `PrintManager`。請搭配視窗控制代碼 (window handle) 使用 `IPrintManagerInterop`。
- **絕不可**直接使用 `DataTransferManager` 進行分享。請搭配視窗控制代碼使用 `IDataTransferManagerInterop`。
- **絕不可**使用 UWP `IBackgroundTask`。請使用 `Microsoft.Windows.AppLifecycle` 啟用 (activation)。
- **絕不可**使用 `WebAuthenticationBroker`。請使用 `OAuth2Manager` (Windows App SDK 1.7+)。

## XAML 模式 (XAML Patterns)

- 預設的 XAML 命名空間對應至 `Microsoft.UI.Xaml`，而非 `Windows.UI.Xaml`。
- 偏好使用 `{x:Bind}` 而非 `{Binding}`，以獲得已編譯、類型安全且效能更高的繫結 (bindings)。
- 在使用 `{x:Bind}` 時，於 `DataTemplate` 元素上設定 `x:DataType` — 這是範本中已編譯繫結的必要條件。在 Page/UserControl 上，`x:DataType` 可啟用編譯時期繫結驗證，但若 DataContext 不會變更則非嚴格必要。
- 針對動態值使用 `Mode=OneWay`，針對靜態值使用 `Mode=OneTime`，僅針對可編輯輸入使用 `Mode=TwoWay`。
- 請勿繫結靜態常數 — 直接在 XAML 中設定它們。

## 執行緒 (Threading)

- 使用 `DispatcherQueue.TryEnqueue(() => { ... })` 從背景執行緒更新 UI。
- `TryEnqueue` 回傳 `bool` 而非 `Task` — 它是「發後不理 (fire-and-forget)」模式。
- 在發送 (dispatching) 前，使用 `DispatcherQueue.HasThreadAccess` 檢查執行緒存取權限。
- WinUI 3 使用標準的 STA (非 UWP 的 ASTA)。沒有內建的重新進入 (reentrancy) 保護 — 對於會發送訊息的非同步程式碼應保持謹慎。

## 視窗化 (Windowing)

- 透過 `WindowNative.GetWindowHandle` → `Win32Interop.GetWindowIdFromWindow` → `AppWindow.GetFromWindowId` 從 WinUI 3 `Window` 取得 `AppWindow`。
- 使用 `AppWindow` 進行調整大小、移動、標題與呈現器 (presenter) 操作。
- 自訂標題列：使用 `AppWindow.TitleBar` 屬性，而非 `CoreApplicationViewTitleBar`。
- 將主視窗追蹤為 `App.MainWindow` (於 `OnLaunched` 中設定的靜態屬性)。

## 對話方塊與選取器 (Dialogs and Pickers)

- **ContentDialog**：在呼叫 `ShowAsync()` 前，務必先設定 `dialog.XamlRoot = this.Content.XamlRoot`。
- **檔案/資料夾選取器**：使用 `WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd)` 進行初始化，其中 `hwnd` 來自 `WindowNative.GetWindowHandle(App.MainWindow)`。
- **分享/列印**：搭配視窗控制代碼使用 COM 互通介面 (`IDataTransferManagerInterop`, `IPrintManagerInterop`)。

## MVVM 與資料繫結 (MVVM and Data Binding)

- 偏好使用 `CommunityToolkit.Mvvm` (`[ObservableProperty]`, `[RelayCommand]`) 作為 MVVM 基礎架構。
- 使用 `Microsoft.Extensions.DependencyInjection` 進行服務註冊與插入 (injection)。
- 讓 UI (檢視表 Views) 專注於版面配置與繫結；將邏輯保留在 ViewModel 與服務中。
- 針對 I/O 與耗時工作使用 `async`/`await` 以保持 UI 回應。

## 專案設定 (Project Setup)

- 目標框架設定為 `net10.0-windows10.0.22621.0` (或適用於專案目標 SDK 的 TFM)。
- 在專案檔案中設定 `<UseWinUI>true</UseWinUI>`。
- 參考最新穩定版本的 `Microsoft.WindowsAppSDK` NuGet 套件。
- 使用 `System.Text.Json` 搭配來源產生器 (source generators) 進行 JSON 序列化。

## C# 程式碼樣式 (C# Code Style)

- 使用檔案範圍命名空間 (file-scoped namespaces)。
- 啟用可為 Null 的參考類型 (nullable reference types)。使用 `is null` / `is not null` 而非 `== null`。
- 偏好使用模式比對 (pattern matching) 而非搭配 Null 檢查的 `as`/`is`。
- 類型、函式、屬性使用 PascalCase。私有欄位使用 camelCase。
- Allman 大括號樣式 (左大括號位於獨立新行)。
- 對於內建類型偏好使用明確類型；僅在類型從右側顯而易見時才使用 `var`。

## 無障礙 (Accessibility)

- 在所有互動式控制項上設定 `AutomationProperties.Name`。
- 在區段標頭上使用 `AutomationProperties.HeadingLevel`。
- 使用 `AutomationProperties.AccessibilityView="Raw"` 隱藏裝飾性元素。
- 確保完整的鍵盤導覽 (Tab, Enter, Space, 方向鍵)。
- 符合 WCAG 顏色對比度要求。

## 效能 (Performance)

- 偏好使用已編譯的 `{x:Bind}` 而非反射式的 `{Binding}`。
- **NativeAOT**：在 Native AOT 編譯下，反射式的 `{Binding}` 完全無法運作。僅支援已編譯的 `{x:Bind}`。若專案使用 NativeAOT，請排除萬難使用 `{x:Bind}`。
- 針對非立即需要的 UI 元素使用 `x:Load` 或 `x:DeferLoadStrategy`。
- 針對大型清單使用具備虛擬化功能的 `ItemsRepeater`。
- 避免深層版面配置巢狀 — 偏好使用 `Grid` 而非巢狀的 `StackPanel` 鏈結。
- 針對所有 I/O 使用 `async`/`await`；絕不可封鎖 UI 執行緒。

## 應用程式設定 (封裝 vs 未封裝) (App Settings (Packaged vs Unpackaged))

- **封裝應用程式**：`ApplicationData.Current.LocalSettings` 可如預期運作。
- **未封裝應用程式**：使用自訂設定檔案 (例如：位於 `Environment.GetFolderPath(SpecialFolder.LocalApplicationData)` 的 JSON)。
- 請勿假設 `ApplicationData` 一律可用 — 請先檢查封裝狀態。

## 字體排版 (Typography)

- **務必**使用內建的 TextBlock 樣式 (`CaptionTextBlockStyle`, `BodyTextBlockStyle`, `BodyStrongTextBlockStyle`, `SubtitleTextBlockStyle`, `TitleTextBlockStyle`, `TitleLargeTextBlockStyle`, `DisplayTextBlockStyle`)。
- 偏好使用內建的 TextBlock 樣式，而非硬編碼 `FontSize`, `FontWeight` 或 `FontFamily`。
- 字體：Segoe UI Variable 是預設字體 — 請勿變更它。
- 對所有 UI 文字使用句首大寫 (sentence casing)。


## 主題與顏色 (Theming & Colors)

- **務必**針對筆刷與顏色使用 `{ThemeResource}`，以自動支援淺色、深色與高對比主題。
- **絕不可**對 UI 元素硬編碼顏色值 (`#FFFFFF`, `Colors.White` 等)。請使用主題資源，例如 `TextFillColorPrimaryBrush`, `CardBackgroundFillColorDefaultBrush`, `CardStrokeColorDefaultBrush`。
- 針對使用者的輔助色調色盤，使用 `SystemAccentColor` (及其 `Light1`–`Light3`, `Dark1`–`Dark3` 變體)。
- 針對邊框：使用 `CardStrokeColorDefaultBrush` 或 `ControlStrokeColorDefaultBrush`。

## 間距與版面配置 (Spacing & Layout)

- 使用 **4px 網格系統**：所有邊距 (margins)、填補 (padding) 與間距值必須為 4px 的倍數。
- 標準間距：4 (緊湊), 8 (控制項), 12 (小間隔), 16 (內容填補), 24 (大間隔)。
- 為了效能，偏好使用 `Grid` 而非深層巢狀的 `StackPanel` 鏈結。
- 針對內容尺寸的列/欄使用 `Auto`，針對比例尺寸使用 `*`。避免使用固定的像素尺寸。
- 使用 `VisualStateManager` 搭配 `AdaptiveTrigger`，在斷點 (640px, 1008px) 進行響應式版面配置。
- 對小型控制項使用 `ControlCornerRadius` (4px)，對卡片、對話方塊、飛出視窗使用 `OverlayCornerRadius` (8px)。

## 材質與高度 (Materials & Elevation)

- 針對應用程式視窗底色使用 **Mica** (`MicaBackdrop`)。需要上層為透明層才能透出。
- 僅針對暫時性介面 (飛出視窗、選單、導覽窗格) 使用 **Acrylic**。
- 針對 Mica 上方的內容層使用 `LayerFillColorDefaultBrush`。
- 針對高度使用具備 Z 軸 `Translation` 的 `ThemeShadow`。卡片：4–8 px, 飛出視窗：32 px, 對話方塊：128 px。

## 動態與轉換 (Motion & Transitions)

- 使用內建的主題轉換 (`EntranceThemeTransition`, `RepositionThemeTransition`, `ContentThemeTransition`, `AddDeleteThemeTransition`)。
- 當已有內建轉換存在時，避免自訂腳本動畫 (storyboard animations)。

## 控制項選取 (Control Selection)

- 使用 `NavigationView` 作為主要應用程式導覽 (而非自訂側邊欄)。
- 使用 `InfoBar` 作為持續性的應用程式內通知 (而非自訂橫幅)。
- 使用 `TeachingTip` 提供情境指引 (而非自訂彈出視窗)。
- 使用 `NumberBox` 進行數值輸入 (而非手動驗證的 TextBox)。
- 針對開關設定使用 `ToggleSwitch` (而非 CheckBox)。
- 使用 `ItemsView` 作為現代化的集合控制項，用於顯示具備內建選取、虛擬化與版面配置彈性的資料。
- 針對標準虛擬化清單與格線使用 `ListView`/`GridView`，特別是需要內建選取支援時。
- 僅在需要完全掌控轉譯且不需要內建選取或互動處理的完全自訂虛擬化版面配置中，才使用 `ItemsRepeater`。
- 使用 `Expander` 製作可摺疊區段 (而非自訂可見性切換)。

## 錯誤處理 (Error Handling)

- 務必將 `async void` 事件處理常式封裝在 try/catch 中，以防止未處理的崩潰。
- 使用 `InfoBar` (設定 `Severity = Error`) 顯示面向使用者的錯誤訊息，而非將 `ContentDialog` 用於例行錯誤。
- 處理 `App.UnhandledException` 以進行記錄與優雅復原。

## 測試 (Testing)

- **絕不可**使用純 MSTest 或 xUnit 專案來執行會具現化 WinUI 3 XAML 類型的測試。請使用 **Unit Test App (WinUI in Desktop)** 專案，它提供了 Xaml 執行階段與 UI 執行緒。
- 對純邏輯測試使用 `[TestMethod]`。對任何會建立或與 `Microsoft.UI.Xaml` 類型 (控制項、頁面、使用者元件) 互動的測試，使用 `[UITestMethod]`。
- 將可測試的商務邏輯放置在與主應用程式分離的 **Class Library (WinUI in Desktop)** 專案中。
- 在執行測試前先建構解決方案，以啟用 Visual Studio 測試探索。

## 資源與在地化 (Resources & Localization)

- 將面對使用者的字串儲存在 `Resources.resw` 檔案中，而非程式碼或 XAML 字面值中。
- 在 XAML 中使用 `x:Uid` 進行在地化文字繫結。
- 使用具備 DPI 限定詞的圖片資產 (`logo.scale-200.png`)；參考時不使用標度限定詞 (`ms-appx:///Assets/logo.png`)。
