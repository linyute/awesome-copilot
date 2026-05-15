# 相依性插入

MVVM Toolkit 刻意 **不隨附自己的 DI 容器** — 它
整合了 `Microsoft.Extensions.DependencyInjection`，這是與
ASP.NET Core、工作者服務 (Worker services) 及 .NET 通用主機 (Generic Host) 相同的
容器。

> **預設使用建構函式插入。** 透過需要它們的型別之建構函式解析
> 服務與子 ViewModel。在使用者程式碼中應避免使用
> 服務定位器 (service-locator) 模式 (`Ioc.Default.GetService<T>()`)。

---

## 建議的組合根 (Generic Host)

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

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

通用主機 (Generic Host) 的優點：

- 透過 `Microsoft.Extensions.Configuration` 進行 `appsettings.json` 組態繫結
- 透過 `Microsoft.Extensions.Logging` 內建記錄
- 用於背景工作的託管服務 (`IHostedService`)
- 開發建構中的範圍驗證

> 在 WPF 和 Windows Forms 上，將主機存留期與
> 應用程式存留期整合 — 請參閱
> [在 WPF 應用程式中使用 .NET 通用主機](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/app-development/how-to-use-host-builder)。

---

## 組合根 (不使用 Generic Host)

當您不需要組態/記錄/裝載時，請直接建構供應者
(provider)：

```csharp
public partial class App : Application
{
    public IServiceProvider Services { get; }

    public App()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IFilesService, FilesService>();
        services.AddTransient<ContactViewModel>();
        Services = services.BuildServiceProvider();
    }

    public static T GetService<T>() where T : class =>
        ((App)Current).Services.GetRequiredService<T>();
}
```

---

## 建構函式插入

透過建構函式插入服務與子 ViewModel：

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

為什麼建構函式插入優於服務定位器 (service locator)：

- 相依性在呼叫端是明確且可見的。
- 單元測試可以插入假物件 (fakes)/模擬物件 (mocks)，而無需訴諸執行階段技巧。
- DI 容器會在啟動時驗證相依性圖表
  (在開發環境中使用 `BuildServiceProvider(validateScopes: true)`)。
- 沒有隱藏的執行階段失敗 — 遺漏註冊會立即擲回例外。

---

## 存留期 (Lifetimes)

| 存留期 | 方法 | XAML 應用程式中的典型用途 |
|----------|--------|--------------------------|
| Singleton | `AddSingleton<T>` | 殼層 (Shell)/主視窗 VM、設定、檔案/HTTP 服務、共享的 `IMessenger`、應用程式範圍的快取 |
| Transient | `AddTransient<T>` | 每個頁面或每個文件的 ViewModel (每次解析都會產生新執行個體) |
| Scoped | `AddScoped<T>` | 在用戶端應用程式中很少需要；當您建立明確的 `IServiceScope` 時很有用 (例如每個視窗的範圍、內嵌 HTTP 的每個請求範圍) |

```csharp
services.AddSingleton<ShellViewModel>();      // 應用程式存留期內僅 1 個執行個體
services.AddTransient<NoteViewModel>();        // 每次解析時產生新執行個體
services.AddScoped<DialogService>();           // 每個範圍 1 個 (罕見)
```

---

## 在檢視 (View) 中解析

在程式碼後置 (code-behind) 中解析頁面的根 ViewModel，然後讓它提取
自己的相依性：

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
針對 `DataContext` 使用 `{Binding Xxx}` 進行繫結。

對於導覽架構 (WinUI 3 `Frame.Navigate`、MAUI Shell、Prism、
MVVMCross)，讓架構解析頁面，而頁面則從 DI 解析其
ViewModel。避免手動建立 ViewModel。

---

## `IMessenger` 註冊

工具箱提供了兩種實作。請註冊您需要的實作一次，
並在各處插入 `IMessenger`：

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

多個訊息傳遞者 (例如每個視窗一個) 也是有效的 — 請使用
具名服務 (keyed services) 或作為限定範圍 (scoped) 的執行個體來註冊它們。

---

## 具名服務 (Keyed services，.NET 8+)

當您有同一介面的多個實作，且
想要透過索引鍵 (key) 選擇其中一個時非常有用：

```csharp
services.AddKeyedSingleton<IExporter, CsvExporter>("csv");
services.AddKeyedSingleton<IExporter, JsonExporter>("json");

public sealed partial class ExportViewModel(
    [FromKeyedServices("csv")] IExporter csvExporter,
    [FromKeyedServices("json")] IExporter jsonExporter)
    : ObservableObject
{ /* ... */ }
```

---

## 測試接縫 (Testing seams)

在測試中，透過建構函式插入的相依性非常容易替換。使用
`Moq` (或 `NSubstitute` / `FakeItEasy`)：

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

如果您發現需要模擬 (mock) `Ioc.Default` 或靜態狀態，代表該
ViewModel 正在使用服務定位器 (service locator) — 請重構為
建構函式插入。

---

## 舊有功能：`Ioc.Default`

工具箱隨附了 `CommunityToolkit.Mvvm.DependencyInjection.Ioc`，用於
無法使用建構函式插入的情況 (例如：為設計階段資料在 XAML 中
產生的 ViewModel、`ValueConverter`、控制項範本)。

設定：

```csharp
Ioc.Default.ConfigureServices(
    new ServiceCollection()
        .AddSingleton<IFilesService, FilesService>()
        .AddTransient<ContactViewModel>()
        .BuildServiceProvider());
```

解析：

```csharp
var files = Ioc.Default.GetRequiredService<IFilesService>();
```

僅將此視為最後手段。在 ViewModel、服務以及任何
可以透過 DI 傳遞的類別中，請優先使用建構函式插入。

---

## 常見錯誤

1. **在 ViewModel 建構函式內部透過 `Ioc` 解析子項目。**
   這會隱藏相依性。請改為透過建構函式插入子 VM (或處理中心/工廠)。
2. **將所有項目註冊為 Singleton。** 將「每個文件」的 ViewModel
   註冊為 Singleton 會使其成為所有文件共享的狀態 — 這是一個
   隱蔽的資料損毀錯誤。針對每個執行個體的 VM，請使用 `AddTransient`。
3. **建構多個 `ServiceProvider` 執行個體。** 每次呼叫
   `BuildServiceProvider()` 都會產生一個全新的容器 — Singleton 
   將無法共用。請在啟動時建構一次，然後重複使用。
4. **在長效物件中擷取 `IServiceProvider` 本身。**
   這暗示了服務定位器 (service-locator) 模式。請插入您需要的
   特定相依性。
5. **忘記在開發環境中連結範圍驗證。** 請使用
   `Host.CreateDefaultBuilder()` (它會在開發環境中設定 `ValidateScopes` 
   和 `ValidateOnBuild`)，這樣註冊錯誤會在啟動時失敗，
   而不是在首次使用時才出錯。
