# RelayCommand 實作範例

`RelayCommand` / `AsyncRelayCommand` 與 `[RelayCommand]` 產生器的
實作範例。預設為產生器屬性（generator-attribute）樣式；手動建構函式
模式針對進階案例列於底部。

---
## 同步命令

```csharp
[RelayCommand]
private void IncrementCounter() => Counter++;
```

```xml
<Button Command="{x:Bind ViewModel.IncrementCounterCommand}" Content="+1"/>
```

## 帶有參數的同步命令

```csharp
[RelayCommand]
private void RemoveItem(Item item) => Items.Remove(item);
```

```xml
<Button Command="{x:Bind ViewModel.RemoveItemCommand}"
        CommandParameter="{x:Bind Item}" Content="Remove"/>
```

產生器會根據參數類型選擇 `IRelayCommand<Item>`。

## 帶有 `CanExecute` 的同步命令

```csharp
[ObservableProperty]
[NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
private string? text;

[RelayCommand(CanExecute = nameof(CanSubmit))]
private void Submit() => service.Submit(Text!);

private bool CanSubmit() => !string.IsNullOrWhiteSpace(Text);
```

`[NotifyCanExecuteChangedFor]` 會在 `Text` 變更時自動引發
`CanExecuteChanged` — 若沒有它，即使在使用者輸入後，
按鈕仍會保持停用狀態。

---

## 非同步命令

```csharp
[RelayCommand]
private async Task LoadAsync()
{
    Items.Clear();
    foreach (var item in await service.GetItemsAsync())
        Items.Add(item);
}
```

將 UI 繫結至 `LoadCommand.IsRunning` 以顯示旋轉進度條：

```xml
<ProgressRing IsActive="{x:Bind ViewModel.LoadCommand.IsRunning, Mode=OneWay}"/>
```

## 帶有取消功能的非同步命令

```csharp
[RelayCommand(IncludeCancelCommand = true)]
private async Task DownloadAsync(CancellationToken token)
{
    try
    {
        await using var stream = await http.GetStreamAsync(url, token);
        // ...
    }
    catch (OperationCanceledException)
    {
        // 預期行為 — 使用者已取消。
    }
}
```

```xml
<Button Command="{x:Bind ViewModel.DownloadCommand}" Content="Download"/>
<Button Command="{x:Bind ViewModel.DownloadCancelCommand}" Content="Cancel"/>
```

`DownloadCancelCommand.CanExecute` 會自動連動至
`DownloadCommand.IsRunning`。

## 帶有並行處理的非同步命令

```csharp
[RelayCommand(AllowConcurrentExecutions = true)]
private async Task PingAsync(string host)
{
    await pingService.PingAsync(host);
}
```

預設情況下（`AllowConcurrentExecutions = false`）當前一個執行
尚在等待時，會回報命令為停用。若為重疊呼叫也安全的
「發後不理」（fire-and-forget）模式，請設定為 `true`。

## 向 UI 呈現錯誤的非同步命令

```csharp
[RelayCommand(FlowExceptionsToTaskScheduler = true)]
private async Task SyncAsync(CancellationToken token)
{
    await syncService.SyncAsync(token);
}
```

```xml
<TextBlock Text="{x:Bind ViewModel.SyncCommand.ExecutionTask.Exception, Mode=OneWay}"/>
```

若無 `FlowExceptionsToTaskScheduler = true`，`SyncAsync` 中未
捕獲的例外將導致應用程式當機（與同步命令相同）。設定後，例外會
透過 `ExecutionTask` 呈現，並傳遞（bubbles）至
`TaskScheduler.UnobservedTaskException`。

## 顯示非同步命令狀態

```xml
<StackPanel>
    <ProgressRing IsActive="{x:Bind ViewModel.SyncCommand.IsRunning, Mode=OneWay}"/>
    <TextBlock Text="{x:Bind ViewModel.SyncCommand.ExecutionTask.Status, Mode=OneWay}"/>
</StackPanel>
```

`IAsyncRelayCommand` 的實用屬性：


| 屬性 | 類型 | 用途 |
|----------|------|---------|
| `ExecutionTask` | `Task?` | 目前執行中（或上次已完成）的工作 |
| `IsRunning` | `bool` | 當工作正在進行時為 `true` |
| `CanBeCanceled` | `bool` | 若封裝的函式接受 `CancellationToken` 則為 `true` |
| `IsCancellationRequested` | `bool` | 對執行中的工作呼叫 `Cancel()` 後為 `true` |

方法：

| 方法 | 用途 |
|--------|---------|
| `Cancel()` | 發送訊號給作用中的 `CancellationToken` |
| `NotifyCanExecuteChanged()` | 重新評估 `CanExecute` 並引發 `CanExecuteChanged` |

---

## 將屬性（Attributes）轉發至產生的命令屬性（Property）

```csharp
[RelayCommand]
[property: JsonIgnore]
[property: Description("Saves the current document")]
private Task SaveAsync() => repo.SaveAsync(Text!);
```

產生器會產出套用了 `[JsonIgnore]` 與 `[Description]` 的
`SaveCommand` — 這在 ViewModel 需要序列化時非常有用。

---

## 手動建立 `RelayCommand` / `AsyncRelayCommand`

當您需要以下功能時，請使用手動建構函式：

- 由多個方法組成或動態重建的命令
- 由外部 Observable 建立的 `CanExecute` 述詞（predicate）
- 儲存在欄位（field）中的 ICommand 執行個體（罕見；產生器的延遲屬性
  幾乎能滿足所有情況）

```csharp
public sealed class CounterViewModel : ObservableObject
{
    public CounterViewModel()
    {
        IncrementCommand = new RelayCommand(() => Counter++);
        DecrementCommand = new RelayCommand(() => Counter--, () => Counter > 0);
    }

    [ObservableProperty]
    private int counter;

    public IRelayCommand IncrementCommand { get; }
    public IRelayCommand DecrementCommand { get; }
}
```

```csharp
public sealed class DownloadViewModel : ObservableObject
{
    public DownloadViewModel()
    {
        DownloadCommand = new AsyncRelayCommand(DownloadAsync, () => CanDownload);
    }

    [ObservableProperty]
    private bool canDownload = true;

    public IAsyncRelayCommand DownloadCommand { get; }

    private async Task DownloadAsync()
    {
        CanDownload = false;
        try { await http.DownloadAsync(); }
        finally { CanDownload = true; }
    }
}
```

使用 `SomeCommand.NotifyCanExecuteChanged()` 手動觸發
`CanExecute` 的重新評估。

---

## 從單一命令執行 `Task.WhenAll`

```csharp
[RelayCommand]
private async Task SyncAllAsync(CancellationToken token)
{
    var tasks = providers.Select(p => p.SyncAsync(token));
    await Task.WhenAll(tasks);
}
```

若您希望為每個供應商（provider）進行個別的進度追蹤，請改為
每個供應商公開一個命令。

---

## 常見錯誤

1. **使用 `async void` 而非 `async Task`。** 產生器僅會將回傳 `Task`
   的方法封裝為 `IAsyncRelayCommand`。`async void` 會變成同步的
   `RelayCommand`，且例外將無法被觀察。
2. **遺忘 `[NotifyCanExecuteChangedFor]`。** 即使 `CanX()` 現在會回傳
   `true`，按鈕仍會保持停用狀態。
3. **對不可取消的命令呼叫 `Cancel()`。** 只有封裝方法接受
   `CancellationToken` 的命令才會處理 `Cancel()`。
4. **擷取 `OperationCanceledException` 並以不同類型重新拋出。**
   這會遺失取消語義；`ExecutionTask.IsCanceled` 將為 `false`。
   請讓 `OperationCanceledException` 傳遞（或直接回傳）。
5. **在另一個 `[RelayCommand]` 中等待 `IAsyncRelayCommand.ExecuteAsync()`。**
   建議直接呼叫底層方法，以避免對取消/並行語義進行
   重複封裝。
