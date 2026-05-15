---
name: mvvm-toolkit-di
description: '將 CommunityToolkit.Mvvm ViewModel 接入 Microsoft.Extensions.DependencyInjection。涵蓋 .NET 通用主機 (Generic Host) 組合根、建構函式插入 (Constructor Injection)、服務存留期 (Singleton / Transient / Scoped)、IMessenger 註冊、在檢視 (View) 中解析 ViewModel、具名服務 (Keyed Services)、測試縫隙，以及舊版 Ioc.Default 逃生艙。適用於 WPF、WinUI 3、.NET MAUI、Uno 和 Avalonia。'
---

# CommunityToolkit.Mvvm + `Microsoft.Extensions.DependencyInjection`

MVVM 工具組刻意**不隨附 DI 容器** — 它與
`Microsoft.Extensions.DependencyInjection` 結合使用，這也是 ASP.NET
Core、背景工作服務 (Worker services) 和 .NET 通用主機所使用的相同容器。

> **重點摘錄。** 在啟動時建構一次服務提供者 (優先使用
> `Host.CreateDefaultBuilder()`)。註冊服務和 ViewModel。
> 透過建構函式插入。在使用者程式碼中避免使用 `Ioc.Default.GetService<T>()`
> 。

---

## 何時使用此技能

- 為新的 XAML 應用程式 (WPF、WinUI 3、
  MAUI、Uno、Avalonia) 建立組合根 (Composition Root)
- 選擇服務/VM 的存留期
- 註冊一次 `IMessenger` 並將其插入到 `ObservableRecipient`
  ViewModel 中
- 解析頁面的 ViewModel 而不與服務定位器 (Service Locator) 耦合
- 診斷「嘗試啟動 Y 時
  無法解析類型為 X 的服務」

有關原始碼產生器和 ViewModel 模式，請參閱 **`mvvm-toolkit`**
技能。有關 Messenger 發佈/訂閱，請參閱 **`mvvm-toolkit-messenger`**。

---

## 建議的組合根 (通用主機)

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using CommunityToolkit.Mvvm.Messaging;

public partial class App : Application
{
    public IHost Host { get; }

    public App()
    {
        Host = Microsoft.Extensions.Hosting.Host
            .CreateDefaultBuilder()
            .ConfigureServices((_, services) =>
            {
                services.AddSingleton<IFilesService, FilesService>();
                services.AddSingleton<ISettingsService, SettingsService>();
                services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default);

                services.AddSingleton<ShellViewModel>();
                services.AddTransient<ContactViewModel>();
                services.AddTransient<EditorViewModel>();
            })
            .Build();
    }

    public static T GetService<T>() where T : class =>
        ((App)Current).Host.Services.GetRequiredService<T>();
}
```

通用主機的優點：

- 透過 `Microsoft.Extensions.Configuration` 進行 `appsettings.json` 繫結
- 透過 `Microsoft.Extensions.Logging` 進行記錄
- 用於背景工作的託管服務 (`IHostedService`)
- 開發組建中的範圍驗證

> WPF 和 Windows Forms 必須將主機存留期與應用程式存留期整合
> — 請參閱
> [在 WPF 應用程式中使用 .NET 通用主機](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/app-development/how-to-use-host-builder)。

### 不使用通用主機

當您只需要服務容器且希望零額外相依性時：

```csharp
var services = new ServiceCollection();
services.AddSingleton<IFilesService, FilesService>();
services.AddTransient<ContactViewModel>();
ServiceProvider provider = services.BuildServiceProvider();
```

---

## 建構函式插入

透過建構函式插入服務和子 ViewModel：

```csharp
public sealed partial class ContactViewModel(
    IFilesService files,
    IMessenger messenger,
    ILogger<ContactViewModel> logger)
    : ObservableRecipient(messenger)
{
    [ObservableProperty]
    private string? name;

    [RelayCommand]
    private async Task SaveAsync()
    {
        logger.LogInformation("Saving {Name}", Name);
        await files.SaveAsync(Name!);
    }
}
```

為什麼建構函式插入優於服務定位器：

- 相依性在呼叫端是明確且可見的
- 單元測試直接插入虛設常數/模擬物件 (fakes/mocks)
- DI 容器在啟動時驗證相依性圖表
- 遺漏註冊會立即拋出異常，而不是在第一次使用時

---

## 存留期

| 存留期 | 方法 | XAML 應用程式中的典型用途 |
|----------|--------|--------------------------|
| Singleton | `AddSingleton<T>` | 殼層 (Shell)/主視窗 VM、設定、檔案/HTTP 服務、共用的 `IMessenger`、應用程式範圍的快取 |
| Transient | `AddTransient<T>` | 每個頁面或每個文件的 ViewModel (每次解析時都有新的執行個體) |
| Scoped | `AddScoped<T>` | 在用戶端應用程式中很少需要；適用於明確的 `IServiceScope` (例如，每個視窗的範圍) |

```csharp
services.AddSingleton<ShellViewModel>();   // 應用程式存留期內只有 1 個執行個體
services.AddTransient<NoteViewModel>();    // 每次解析時都有新的執行個體
services.AddScoped<DialogService>();       // 每個範圍 1 個 (罕見)
```

---

## 在檢視中解析

在程式碼後置 (Code-behind) 中解析頁面的根 ViewModel，然後讓它自行拉取其
自身的相依性：

```csharp
public sealed partial class ContactPage : Page
{
    public ContactViewModel ViewModel { get; }

    public ContactPage()
    {
        ViewModel = App.GetService<ContactViewModel>();
        InitializeComponent();
    }
}
```

在 XAML 中使用 `{x:Bind ViewModel.Xxx}` (編譯繫結) 或
針對 `DataContext` 的 `{Binding Xxx}` 進行繫結。

對於導覽框架 (WinUI 3 `Frame.Navigate`、MAUI Shell、Prism、
MVVMCross)，讓框架解析頁面，而頁面從 DI 中解析其
ViewModel。不要手動 `new` ViewModel。

---

## `IMessenger` 註冊

註冊一次您需要的 Messenger，在各處插入 `IMessenger`：

```csharp
services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default);
// 或
services.AddSingleton<IMessenger>(StrongReferenceMessenger.Default);
```

接著：

```csharp
public sealed partial class MyViewModel(IMessenger messenger)
    : ObservableRecipient(messenger) { }
```

對於每個視窗的 Messenger，使用具名服務 (Keyed Services) 或作為範圍 (Scoped)
執行個體註冊，並將其插入到每個視窗的 ViewModel 中。

有關 Messenger 的介面範圍，請參閱 **`mvvm-toolkit-messenger`** 技能。

---

## 具名服務 (.NET 8+)

透過索引鍵解析相同介面的不同實作：

```csharp
services.AddKeyedSingleton<IExporter, CsvExporter>("csv");
services.AddKeyedSingleton<IExporter, JsonExporter>("json");

public sealed partial class ExportViewModel(
    [FromKeyedServices("csv")] IExporter csvExporter,
    [FromKeyedServices("json")] IExporter jsonExporter)
    : ObservableObject { /* ... */ }
```

---

## 測試縫隙

建構函式插入的相依性在測試中極易替換。使用
`Moq`：

```csharp
[Fact]
public async Task Save_calls_files_service()
{
    var files = new Mock<IFilesService>();
    var messenger = new WeakReferenceMessenger();
    var logger = NullLogger<ContactViewModel>.Instance;

    var vm = new ContactViewModel(files.Object, messenger, logger)
    {
        Name = "Ada"
    };

    await vm.SaveCommand.ExecuteAsync(null);

    files.Verify(f => f.SaveAsync("Ada"), Times.Once);
}
```

如果您正在模擬 (Mocking) `Ioc.Default` 或全域狀態，表示 ViewModel 正在使用
服務定位器 — 請將其重構為建構函式插入。

---

## 舊版：`Ioc.Default`

`CommunityToolkit.Mvvm.DependencyInjection.Ioc` 是一個逃生艙，適用於
無法使用建構函式插入的情況 — 例如在 XAML 中具現化的 VM
(用於設計時資料)、`ValueConverter`、控制控制項範本。

```csharp
Ioc.Default.ConfigureServices(
    new ServiceCollection()
        .AddSingleton<IFilesService, FilesService>()
        .AddTransient<ContactViewModel>()
        .BuildServiceProvider());

var files = Ioc.Default.GetRequiredService<IFilesService>();
```

將其視為最後手段。在 ViewModel、服務以及 DI 容器可以建構的任何類別中，
請優先使用建構函式插入。

---

## 常見陷阱

1. **在 VM 建構函式中使用 `Ioc.Default.GetService<T>()`。** 隱藏了
   相依性，破壞了單元測試，並阻止了啟動時圖表驗證。
2. **所有東西都使用 `Singleton`。** 註冊為 Singleton 的「每個文件」VM
   會變成所有文件之間的共用狀態 — 導致細微的資料損毀。
   請為每個執行個體的 VM 使用 `AddTransient`。
3. **多次呼叫 `BuildServiceProvider()`。** 每次呼叫都是一個新的
   容器 — Singleton 不會共用。請在啟動時建構一次。
4. **在長效物件中擷取 `IServiceProvider`。** 這表示使用了
   服務定位器模式。請插入您需要的特定相依性。
5. **在開發中沒有範圍驗證。** 使用 `Host.CreateDefaultBuilder()`
   (它會在開發中設定 `ValidateScopes` 和 `ValidateOnBuild`) 以便
   註冊錯誤在啟動時就失敗，而不是在第一次使用時才失敗。
6. **從根提供者解析範圍 (Scoped) 服務。** 它們
   實際上被提升為 Singleton 存留期 — 若沒有範圍驗證，此警告將保持
   靜默。
   請更改存留期或從明確的 `IServiceScope` 解析。

---

## 參考資料

| 主題 | 檔案 |
|-------|------|
| 深入探討 (通用主機設定、存留期、具名服務、測試模式、舊版 Ioc) | [`references/dependency-injection.md`](references/dependency-injection.md) |

外部：

- DI 概觀：<https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection>
- DI 用法：<https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection-usage>
- MVVM 工具組 Ioc 頁面：<https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/ioc>
- 通用主機：<https://learn.microsoft.com/en-us/dotnet/core/extensions/generic-host>
