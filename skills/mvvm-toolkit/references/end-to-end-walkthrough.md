# 端對端逐步解說：WinUI 3 筆記應用程式

一個示範完整 MVVM Toolkit 案例的極簡筆記應用程式：
`ObservableObject`/`ObservableRecipient`、`[ObservableProperty]`、
`[RelayCommand]`、`[NotifyCanExecuteChangedFor]`、`WeakReferenceMessenger`，
以及 `Microsoft.Extensions.DependencyInjection`。

此逐步解說模擬了官方教學課程：
<https://learn.microsoft.com/en-us/windows/apps/tutorials/winui-mvvm-toolkit/intro>。

> 同樣的模式也適用於 WPF、MAUI、Uno 和 Avalonia — 只有
> XAML、導覽和 `App` 啟動引導有所不同。

---

## 專案結構

```
MyApp/                  ← WinUI 3 應用程式專案
  App.xaml.cs
  Views/
    AllNotesPage.xaml
    NotePage.xaml
MyApp.Shared/           ← .NET 類別函式庫 — ViewModels + 服務
  ViewModels/
    AllNotesViewModel.cs
    NoteViewModel.cs
  Services/
    INotesService.cs
    FileSystemNotesService.cs
  Messages/
    NoteSavedMessage.cs
    NoteDeletedMessage.cs
MyApp.Tests/            ← xUnit / MSTest 專案 — VM 單元測試
```

將 ViewModels 放在獨立的函式庫中是推薦的模式：該
函式庫沒有 UI 相依性，因此 VM 可以隔離進行單元測試。

---

## 1. 模型

純 POCO — 無工具箱相依性。

```csharp
public sealed record NoteSummary(string Filename, string Preview, DateTime LastModified);
```

---

## 2. 服務

```csharp
public interface INotesService
{
    Task<IReadOnlyList<NoteSummary>> GetAllAsync();
    Task<string> LoadAsync(string filename);
    Task SaveAsync(string filename, string text);
    Task DeleteAsync(string filename);
}

public sealed class FileSystemNotesService(string rootFolder) : INotesService
{
    public async Task<IReadOnlyList<NoteSummary>> GetAllAsync()
    {
        var files = Directory.GetFiles(rootFolder, "*.txt");
        var summaries = new List<NoteSummary>(files.Length);
        foreach (var f in files)
        {
            var text = await File.ReadAllTextAsync(f);
            summaries.Add(new NoteSummary(
                Path.GetFileName(f),
                text.Length > 60 ? text[..60] : text,
                File.GetLastWriteTime(f)));
        }
        return summaries;
    }

    public Task<string> LoadAsync(string filename) =>
        File.ReadAllTextAsync(Path.Combine(rootFolder, filename));

    public Task SaveAsync(string filename, string text) =>
        File.WriteAllTextAsync(Path.Combine(rootFolder, filename), text);

    public Task DeleteAsync(string filename)
    {
        File.Delete(Path.Combine(rootFolder, filename));
        return Task.CompletedTask;
    }
}
```

---

## 3. 訊息

```csharp
public sealed record NoteSavedMessage(string Filename);
public sealed record NoteDeletedMessage(string Filename);
```

---

## 4. 列表 ViewModel

```csharp
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using CommunityToolkit.Mvvm.Messaging;

public sealed partial class AllNotesViewModel : ObservableRecipient,
    IRecipient<NoteSavedMessage>,
    IRecipient<NoteDeletedMessage>
{
    private readonly INotesService notes;

    public AllNotesViewModel(INotesService notes, IMessenger messenger)
        : base(messenger)
    {
        this.notes = notes;
        IsActive = true;   // 開始接聽訊息
    }

    public ObservableCollection<NoteSummary> Notes { get; } = new();

    [RelayCommand]
    private async Task LoadAsync()
    {
        Notes.Clear();
        foreach (var n in await notes.GetAllAsync())
            Notes.Add(n);
    }

    public void Receive(NoteSavedMessage message) => _ = LoadAsync();
    public void Receive(NoteDeletedMessage message) => _ = LoadAsync();
}
```

`ObservableRecipient` 的 `OnActivated`（當 `IsActive` 變為
`true` 時呼叫）會自動串接 `IRecipient<T>` 處理常式。

---

## 5. 編輯器 ViewModel

```csharp
public sealed partial class NoteViewModel : ObservableRecipient
{
    private readonly INotesService notes;

    public NoteViewModel(INotesService notes, IMessenger messenger)
        : base(messenger)
    {
        this.notes = notes;
    }

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    [NotifyCanExecuteChangedFor(nameof(DeleteCommand))]
    private string? filename;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    private string? text;

    [RelayCommand]
    private async Task LoadAsync(string filename)
    {
        Filename = filename;
        Text = await notes.LoadAsync(filename);
    }

    [RelayCommand(CanExecute = nameof(CanSave))]
    private async Task SaveAsync()
    {
        await notes.SaveAsync(Filename!, Text!);
        Messenger.Send(new NoteSavedMessage(Filename!));
    }

    [RelayCommand(CanExecute = nameof(CanDelete))]
    private async Task DeleteAsync()
    {
        await notes.DeleteAsync(Filename!);
        Messenger.Send(new NoteDeletedMessage(Filename!));
        Filename = null;
        Text = null;
    }

    private bool CanSave() =>
        !string.IsNullOrWhiteSpace(Filename) && !string.IsNullOrEmpty(Text);

    private bool CanDelete() => !string.IsNullOrWhiteSpace(Filename);
}
```

---

## 6. 組合根 (`App.xaml.cs`)

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using CommunityToolkit.Mvvm.Messaging;

public partial class App : Application
{
    public IHost Host { get; }

    public App()
    {
        InitializeComponent();

        var notesRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MyApp", "notes");
        Directory.CreateDirectory(notesRoot);

        Host = Microsoft.Extensions.Hosting.Host
            .CreateDefaultBuilder()
            .ConfigureServices((_, services) =>
            {
                services.AddSingleton<INotesService>(_ => new FileSystemNotesService(notesRoot));
                services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default);

                services.AddSingleton<AllNotesViewModel>();
                services.AddTransient<NoteViewModel>();
            })
            .Build();
    }

    public static T GetService<T>() where T : class =>
        ((App)Current).Host.Services.GetRequiredService<T>();
}
```

---

## 7. 串接檢視表

`AllNotesPage.xaml.cs`：

```csharp
public sealed partial class AllNotesPage : Page
{
    public AllNotesViewModel ViewModel { get; } = App.GetService<AllNotesViewModel>();

    public AllNotesPage()
    {
        InitializeComponent();
    }

    protected override async void OnNavigatedTo(NavigationEventArgs e)
    {
        base.OnNavigatedTo(e);
        await ViewModel.LoadCommand.ExecuteAsync(null);
    }
}
```

`AllNotesPage.xaml`：

```xml
<Page x:Class="MyApp.Views.AllNotesPage"
      xmlns:vm="using:MyApp.Shared.ViewModels">
    <Grid RowDefinitions="Auto,*">
        <CommandBar>
            <AppBarButton Icon="Add" Label="新增" Click="OnNewClicked"/>
            <AppBarButton Icon="Refresh" Label="重新整理"
                          Command="{x:Bind ViewModel.LoadCommand}"/>
        </CommandBar>
        <ListView Grid.Row="1"
                  ItemsSource="{x:Bind ViewModel.Notes}"
                  ItemClick="OnNoteClicked"
                  IsItemClickEnabled="True">
            <ListView.ItemTemplate>
                <DataTemplate x:DataType="vm:NoteSummary">
                    <StackPanel>
                        <TextBlock Text="{x:Bind Filename}" FontWeight="SemiBold"/>
                        <TextBlock Text="{x:Bind Preview}"
                                   TextTrimming="CharacterEllipsis"/>
                    </StackPanel>
                </DataTemplate>
            </ListView.ItemTemplate>
        </ListView>
    </Grid>
</Page>
```

`NotePage.xaml.cs`：

```csharp
public sealed partial class NotePage : Page
{
    public NoteViewModel ViewModel { get; } = App.GetService<NoteViewModel>();

    public NotePage()
    {
        InitializeComponent();
    }

    protected override async void OnNavigatedTo(NavigationEventArgs e)
    {
        base.OnNavigatedTo(e);
        if (e.Parameter is string filename)
            await ViewModel.LoadCommand.ExecuteAsync(filename);
        ViewModel.IsActive = true;
    }

    protected override void OnNavigatedFrom(NavigationEventArgs e)
    {
        ViewModel.IsActive = false;
        base.OnNavigatedFrom(e);
    }
}
```

`NotePage.xaml`：

```xml
<Page x:Class="MyApp.Views.NotePage">
    <Grid RowDefinitions="Auto,*,Auto">
        <TextBox Header="檔案名稱" Text="{x:Bind ViewModel.Filename, Mode=TwoWay}"/>
        <TextBox Grid.Row="1"
                 AcceptsReturn="True" TextWrapping="Wrap"
                 Text="{x:Bind ViewModel.Text, Mode=TwoWay}"/>
        <StackPanel Grid.Row="2" Orientation="Horizontal" Spacing="8">
            <Button Content="儲存"  Command="{x:Bind ViewModel.SaveCommand}"/>
            <Button Content="刪除" Command="{x:Bind ViewModel.DeleteCommand}"/>
        </StackPanel>
    </Grid>
</Page>
```

---

## 8. 具代表性的單元測試

```csharp
using CommunityToolkit.Mvvm.Messaging;

public sealed class NoteViewModelTests
{
    private sealed class FakeNotesService : INotesService
    {
        public List<(string filename, string text)> Saved { get; } = new();
        public Task<IReadOnlyList<NoteSummary>> GetAllAsync() => Task.FromResult<IReadOnlyList<NoteSummary>>(Array.Empty<NoteSummary>());
        public Task<string> LoadAsync(string filename) => Task.FromResult(string.Empty);
        public Task SaveAsync(string filename, string text)
        {
            Saved.Add((filename, text));
            return Task.CompletedTask;
        }
        public Task DeleteAsync(string filename) => Task.CompletedTask;
    }

    [Fact]
    public async Task SaveCommand_persists_and_broadcasts()
    {
        var notes = new FakeNotesService();
        var messenger = new WeakReferenceMessenger();
        string? receivedFilename = null;
        messenger.Register<NoteSavedMessage>(new object(), (_, m) => receivedFilename = m.Filename);

        var vm = new NoteViewModel(notes, messenger)
        {
            Filename = "hello.txt",
            Text = "world"
        };

        await vm.SaveCommand.ExecuteAsync(null);

        Assert.Single(notes.Saved);
        Assert.Equal("hello.txt", notes.Saved[0].filename);
        Assert.Equal("world", notes.Saved[0].text);
        Assert.Equal("hello.txt", receivedFilename);
    }
}
```

---

## 從此範例中學到的重點

1. **VM 應放在無 UI 的類別函式庫中。** 工具箱唯一的相依性是
   `netstandard2.0+`，因此 VM 可以在沒有 UI 主機的情況下進行測試。
2. **處處使用建構函式插入（Constructor injection）。** 組合根知道如何
   建構所有物件；ViewModels 和服務透過參數接收其
   相依性。
3. **`IMessenger` 是跨 VM 的黏合劑。** `WeakReferenceMessenger.Default`
   是正確的預設值。列表 VM 透過 `IRecipient<T>` 進行接聽；
   編輯器 VM 透過 `Messenger.Send` 進行發佈。
4. **`[NotifyCanExecuteChangedFor]` 讓「儲存/刪除」按鈕與文字輸入保持同步**
   — 無需手動串接。
5. **`ObservableRecipient.IsActive`** 控制訂閱生命週期 —
   請在 `OnNavigatedTo` / `OnNavigatedFrom`（或框架中等效的
   啟用勾點）中進行設定。
