---
name: winui3-migration-guide
description: 'UWP 到 WinUI 3 遷移參考。將舊版 UWP API 對應至正確的 Windows App SDK 等效項目，並附帶遷移前後的程式碼片段。涵蓋命名空間變更、執行緒 (CoreDispatcher 到 DispatcherQueue)、視窗化 (CoreWindow 到 AppWindow)、對話方塊、選取器、分享、列印、背景工作以及最常見的 Copilot 程式碼產生錯誤。'
---

# WinUI 3 遷移指南 (WinUI 3 Migration Guide)

在將 UWP 應用程式遷移至 WinUI 3 / Windows App SDK 時，或在驗證產生的程式碼是否使用正確的 WinUI 3 API 而非舊版 UWP 模式時，請使用此技能。

---

## 命名空間變更 (Namespace Changes)

所有 `Windows.UI.Xaml.*` 命名空間皆移至 `Microsoft.UI.Xaml.*`：

| UWP 命名空間 | WinUI 3 命名空間 |
|--------------|-------------------|
| `Windows.UI.Xaml` | `Microsoft.UI.Xaml` |
| `Windows.UI.Xaml.Controls` | `Microsoft.UI.Xaml.Controls` |
| `Windows.UI.Xaml.Media` | `Microsoft.UI.Xaml.Media` |
| `Windows.UI.Xaml.Input` | `Microsoft.UI.Xaml.Input` |
| `Windows.UI.Xaml.Data` | `Microsoft.UI.Xaml.Data` |
| `Windows.UI.Xaml.Navigation` | `Microsoft.UI.Xaml.Navigation` |
| `Windows.UI.Xaml.Shapes` | `Microsoft.UI.Xaml.Shapes` |
| `Windows.UI.Composition` | `Microsoft.UI.Composition` |
| `Windows.UI.Input` | `Microsoft.UI.Input` |
| `Windows.UI.Colors` | `Microsoft.UI.Colors` |
| `Windows.UI.Text` | `Microsoft.UI.Text` |
| `Windows.UI.Core` | `Microsoft.UI.Dispatching` (用於發送器) |

---

## 前三大常見的 Copilot 錯誤 (Top 3 Most Common Copilot Mistakes)

### 1. 未設定 XamlRoot 的 ContentDialog (ContentDialog Without XamlRoot)

```csharp
// ❌ 錯誤 —— 在 WinUI 3 中會擲回 InvalidOperationException
var dialog = new ContentDialog
{
    Title = "錯誤",
    Content = "發生了一些問題。",
    CloseButtonText = "確定"
};
await dialog.ShowAsync();
```

```csharp
// ✅ 正確 —— 在顯示前設定 XamlRoot
var dialog = new ContentDialog
{
    Title = "錯誤",
    Content = "發生了一些問題。",
    CloseButtonText = "確定",
    XamlRoot = this.Content.XamlRoot  // WinUI 3 的必要設定
};
await dialog.ShowAsync();
```

### 2. 使用 MessageDialog 而非 ContentDialog (MessageDialog Instead of ContentDialog)

```csharp
// ❌ 錯誤 —— UWP API，在 WinUI 3 桌面版中不可用
var dialog = new Windows.UI.Popups.MessageDialog("您確定嗎？", "確認");
await dialog.ShowAsync();
```

```csharp
// ✅ 正確 —— 使用 ContentDialog
var dialog = new ContentDialog
{
    Title = "確認",
    Content = "您確定嗎？",
    PrimaryButtonText = "是",
    CloseButtonText = "否",
    XamlRoot = this.Content.XamlRoot
};
var result = await dialog.ShowAsync();
if (result == ContentDialogResult.Primary)
{
    // 使用者已確認
}
```

### 3. 使用 CoreDispatcher 而非 DispatcherQueue (CoreDispatcher Instead of DispatcherQueue)

```csharp
// ❌ 錯誤 —— WinUI 3 中不存在 CoreDispatcher
await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () =>
{
    StatusText.Text = "完成";
});
```

```csharp
// ✅ 正確 —— 使用 DispatcherQueue
DispatcherQueue.TryEnqueue(() =>
{
    StatusText.Text = "完成";
});

// 使用優先權：
DispatcherQueue.TryEnqueue(DispatcherQueuePriority.High, () =>
{
    ProgressBar.Value = 100;
});
```

---

## 視窗化遷移 (Windowing Migration)

### 視窗參考 (Window Reference)

```csharp
// ❌ 錯誤 —— WinUI 3 中不存在 Window.Current
var currentWindow = Window.Current;
```

```csharp
// ✅ 正確 —— 在 App 類別中使用靜態屬性
public partial class App : Application
{
    public static Window MainWindow { get; private set; }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        MainWindow = new MainWindow();
        MainWindow.Activate();
    }
}
// 在任何地方存取：App.MainWindow
```

### 視窗管理 (Window Management)

| UWP API | WinUI 3 API |
|---------|-------------|
| `ApplicationView.TryResizeView()` | `AppWindow.Resize()` |
| `AppWindow.TryCreateAsync()` | `AppWindow.Create()` |
| `AppWindow.TryShowAsync()` | `AppWindow.Show()` |
| `AppWindow.TryConsolidateAsync()` | `AppWindow.Destroy()` |
| `AppWindow.RequestMoveXxx()` | `AppWindow.Move()` |
| `AppWindow.GetPlacement()` | `AppWindow.Position` 屬性 |
| `AppWindow.RequestPresentation()` | `AppWindow.SetPresenter()` |

### 標題列 (Title Bar)

| UWP API | WinUI 3 API |
|---------|-------------|
| `CoreApplicationViewTitleBar` | `AppWindowTitleBar` |
| `CoreApplicationView.TitleBar.ExtendViewIntoTitleBar` | `AppWindow.TitleBar.ExtendsContentIntoTitleBar` |

---

## 對話方塊與選取器遷移 (Dialogs and Pickers Migration)

### 檔案/資料夾選取器 (File/Folder Pickers)

```csharp
// ❌ 錯誤 —— UWP 樣式，沒有視窗控制代碼 (window handle)
var picker = new FileOpenPicker();
picker.FileTypeFilter.Add(".txt");
var file = await picker.PickSingleFileAsync();
```

```csharp
// ✅ 正確 —— 使用視窗控制代碼進行初始化
var picker = new FileOpenPicker();
var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(App.MainWindow);
WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd);
picker.FileTypeFilter.Add(".txt");
var file = await picker.PickSingleFileAsync();
```

## 執行緒遷移 (Threading Migration)

| UWP 模式 | WinUI 3 等效項目 |
|-------------|-------------------|
| `CoreDispatcher.RunAsync(priority, callback)` | `DispatcherQueue.TryEnqueue(priority, callback)` |
| `Dispatcher.HasThreadAccess` | `DispatcherQueue.HasThreadAccess` |
| `CoreDispatcher.ProcessEvents()` | 無等效項目 —— 需重構非同步程式碼 |
| `CoreWindow.GetForCurrentThread()` | 不可用 —— 請改用 `DispatcherQueue.GetForCurrentThread()` |

**關鍵差異**：UWP 使用具備內建重新進入 (reentrancy) 封鎖功能的 ASTA (Application STA)。WinUI 3 使用標準 STA 且不具備此保護。當非同步程式碼發送訊息時，請留意重新進入問題。

---

## 背景工作遷移 (Background Tasks Migration)

```csharp
// ❌ 錯誤 —— UWP IBackgroundTask
public sealed class MyTask : IBackgroundTask
{
    public void Run(IBackgroundTaskInstance taskInstance) { }
}
```

```csharp
// ✅ 正確 —— Windows App SDK AppLifecycle
using Microsoft.Windows.AppLifecycle;

// 註冊以進行啟用
var args = AppInstance.GetCurrent().GetActivatedEventArgs();
if (args.Kind == ExtendedActivationKind.AppNotification)
{
    // 處理背景啟用
}
```

---

## 應用程式設定遷移 (App Settings Migration)

| 情境 | 封裝應用程式 (Packaged) | 未封裝應用程式 (Unpackaged) |
|----------|-------------|----------------|
| 簡單設定 | `ApplicationData.Current.LocalSettings` | 位於 `LocalApplicationData` 的 JSON 檔案 |
| 本機檔案儲存 | `ApplicationData.Current.LocalFolder` | `Environment.GetFolderPath(SpecialFolder.LocalApplicationData)` |

---

## GetForCurrentView() 替換方案 (GetForCurrentView() Replacements)

所有 `GetForCurrentView()` 模式在 WinUI 3 桌面應用程式中皆不可用：

| UWP API | WinUI 3 替換方案 |
|---------|-------------------|
| `UIViewSettings.GetForCurrentView()` | 使用 `AppWindow` 屬性 |
| `ApplicationView.GetForCurrentView()` | `AppWindow.GetFromWindowId(windowId)` |
| `DisplayInformation.GetForCurrentView()` | Win32 `GetDpiForWindow()` 或 `XamlRoot.RasterizationScale` |
| `CoreApplication.GetCurrentView()` | 不可用 —— 請手動追蹤視窗 |
| `SystemNavigationManager.GetForCurrentView()` | 直接在 `NavigationView` 中處理返回導覽 |

---

## 測試遷移 (Testing Migration)

UWP 單元測試專案無法在 WinUI 3 中運作。您必須遷移至 WinUI 3 測試專案範本。

| UWP | WinUI 3 |
|-----|---------|
| 單元測試應用程式 (通用 Windows) | **單元測試應用程式 (桌面版 WinUI)** |
| 具備 UWP 類型的標準 MSTest 專案 | 必須使用 WinUI 測試應用程式以獲取 Xaml 執行階段 |
| 針對所有測試使用 `[TestMethod]` | 針對邏輯測試使用 `[TestMethod]`，針對 XAML/UI 測試使用 `[UITestMethod]` |
| 類別庫 (通用 Windows) | **類別庫 (桌面版 WinUI)** |

```csharp
// ✅ WinUI 3 單元測試 —— 針對任何 XAML 互動使用 [UITestMethod]
[UITestMethod]
public void TestMyControl()
{
    var control = new MyLibrary.MyUserControl();
    Assert.AreEqual(expected, control.MyProperty);
}
```

**關鍵點**：`[UITestMethod]` 屬性會告知測試執行器在 XAML UI 執行緒上執行該測試，這是具現化任何 `Microsoft.UI.Xaml` 類型所必需的。

---

## 遷移檢查清單 (Migration Checklist)

1. [ ] 將所有 `Windows.UI.Xaml.*` 的 using 指令替換為 `Microsoft.UI.Xaml.*`
2. [ ] 將 `Windows.UI.Colors` 替換為 `Microsoft.UI.Colors`
3. [ ] 將 `CoreDispatcher.RunAsync` 替換為 `DispatcherQueue.TryEnqueue`
4. [ ] 將 `Window.Current` 替換為 `App.MainWindow` 靜態屬性
5. [ ] 在所有 `ContentDialog` 執行個體中加入 `XamlRoot`
6. [ ] 使用 `InitializeWithWindow.Initialize(picker, hwnd)` 初始化所有選取器 (picker)
7. [ ] 將 `MessageDialog` 替換為 `ContentDialog`
8. [ ] 將 `ApplicationView`/`CoreWindow` 替換為 `AppWindow`
9. [ ] 將 `CoreApplicationViewTitleBar` 替換為 `AppWindowTitleBar`
10. [ ] 將所有 `GetForCurrentView()` 呼叫替換為 `AppWindow` 的等效方案
11. [ ] 更新分享 (Share) 與列印 (Print) 管理員的互通性實作
12. [ ] 將 `IBackgroundTask` 替換為 `AppLifecycle` 啟用
13. [ ] 更新專案檔案：將 TFM 設定為 `net10.0-windows10.0.22621.0`，並加入 `<UseWinUI>true</UseWinUI>`
14. [ ] 將單元測試遷移至「單元測試應用程式 (桌面版 WinUI)」專案；針對 XAML 測試使用 `[UITestMethod]`
15. [ ] 測試封裝與未封裝的配置
