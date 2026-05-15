# 來源產生器參考

`CommunityToolkit.Mvvm` 8.x 來源產生器的完整屬性參考，
以及每個產生器產生的程式碼。

> **通用規則。** 每個使用這些屬性的型別 —— 以及
> 每個封裝型別（如果是巢狀的）—— 都必須宣告為 `partial`。
> 產生器會發出一個同層的 partial 類別宣告；如果沒有 `partial`，
> 編譯器會回報 `MVVMTK0008` / `MVVMTK0042`。

---

## `[ObservableProperty]`

從私有欄位產生一個可觀察屬性。

```csharp
using CommunityToolkit.Mvvm.ComponentModel;

public partial class SampleViewModel : ObservableObject
{
    [ObservableProperty]
    private string? name;
}
```

產生的程式碼（簡化版）：

```csharp
public string? Name
{
    get => name;
    set
    {
        if (!EqualityComparer<string?>.Default.Equals(name, value))
        {
            string? oldValue = name;
            OnNameChanging(value);
            OnNameChanging(oldValue, value);
            OnPropertyChanging();
            name = value;
            OnNameChanged(value);
            OnNameChanged(oldValue, value);
            OnPropertyChanged();
        }
    }
}

partial void OnNameChanging(string? value);
partial void OnNameChanging(string? oldValue, string? newValue);
partial void OnNameChanged(string? value);
partial void OnNameChanged(string? oldValue, string? newValue);
```

### 命名

- 欄位 `name` → 屬性 `Name`
- 欄位 `_name` → 屬性 `Name`
- 欄位 `m_name` → 屬性 `Name`
- 欄位 `Name` (PascalCase) → **錯誤** (與產生的屬性衝突)

### 勾點 (Hooks)

實作 partial 方法的任何子集。未實作的勾點會被
編譯器省略 —— 零執行階段成本。

```csharp
[ObservableProperty]
private ChildViewModel? selectedItem;

partial void OnSelectedItemChanging(ChildViewModel? oldValue, ChildViewModel? newValue)
{
    if (oldValue is not null) oldValue.IsSelected = false;
    if (newValue is not null) newValue.IsSelected = true;
}
```

勾點方法是沒有主體宣告的 `partial` 方法 —— 您不能加入
明確的可存取性（不能使用 `public`/`private`）。

---

## `[NotifyPropertyChangedFor(nameof(Other))]`

當此欄位變更時，為額外的屬性引發 `PropertyChanged` 事件。
可以堆疊多個屬性以用於多個目標。

```csharp
[ObservableProperty]
[NotifyPropertyChangedFor(nameof(FullName))]
[NotifyPropertyChangedFor(nameof(Initials))]
private string? firstName;
```

將其用於衍生/計算屬性：

```csharp
public string FullName => $"{FirstName} {LastName}";
public string Initials => $"{FirstName?[0]}{LastName?[0]}";
```

---

## `[NotifyCanExecuteChangedFor(nameof(MyCommand))]`

當此欄位變更時呼叫 `MyCommand.NotifyCanExecuteChanged()`。
目標必須是 `IRelayCommand` (或 `IAsyncRelayCommand`) 屬性。

```csharp
[ObservableProperty]
[NotifyCanExecuteChangedFor(nameof(SaveCommand))]
[NotifyCanExecuteChangedFor(nameof(SubmitCommand))]
private string? name;

[RelayCommand(CanExecute = nameof(CanSave))]
private Task SaveAsync() => repo.SaveAsync(Name!);

private bool CanSave() => !string.IsNullOrWhiteSpace(Name);
```

> **`MVVMTK0016`** 會在目標不是同一個型別中可存取的
> `IRelayCommand` 屬性時引發。

---

## `[NotifyDataErrorInfo]`

僅在繼承自 `ObservableValidator` 的型別中有效。在產生的 setter 內部加入
`ValidateProperty(value)` 呼叫，以便在每次指派時執行 DataAnnotation
驗證器。

```csharp
using System.ComponentModel.DataAnnotations;

public partial class RegistrationViewModel : ObservableValidator
{
    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Required, MinLength(2), MaxLength(100)]
    private string? name;

    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Required, EmailAddress]
    private string? email;
}
```

只有衍生自 `ValidationAttribute` 的屬性才會轉發到
產生的屬性。除非您使用 `[property: ]`（見下文），
否則其他屬性將被忽略處理。

---

## `[NotifyPropertyChangedRecipients]`

僅在繼承自 `ObservableRecipient` 的型別中有效。在成功設定值後加入
`Broadcast(oldValue, newValue)` 呼叫，將 `PropertyChangedMessage<T>`
傳送給使用中 `IMessenger` 的所有接收者。

```csharp
public partial class SelectionViewModel : ObservableRecipient
{
    [ObservableProperty]
    [NotifyPropertyChangedRecipients]
    private Item? selectedItem;
}
```

訂閱者可以使用以下程式碼進行監聽：

```csharp
WeakReferenceMessenger.Default.Register<SelectionViewModel, PropertyChangedMessage<Item>>(
    this,
    static (r, m) =>
    {
        if (m.PropertyName == nameof(SelectionViewModel.SelectedItem))
            r.Handle(m.NewValue);
    });
```

---

## `[RelayCommand]`

從執行個體方法產生延遲載入 (Lazy) 的 `RelayCommand` / `AsyncRelayCommand`。
透過 `IRelayCommand` / `IAsyncRelayCommand` 介面將其公開。

```csharp
[RelayCommand]
private void Refresh() => Items.Reset();
```

```csharp
private RelayCommand? refreshCommand;
public IRelayCommand RefreshCommand =>
    refreshCommand ??= new RelayCommand(Refresh);
```

### 命名

- `Refresh` → `RefreshCommand`
- `OnRefresh` → `RefreshCommand` (移除開頭的 `On`)
- `LoadAsync` → `LoadCommand` (移除結尾的 `Async`)
- `OnLoadAsync` → `LoadCommand` (兩者皆移除)

### 具備參數的同步指令

```csharp
[RelayCommand]
private void GreetUser(User user) => Console.WriteLine($"Hello {user.Name}");
```

產生 `IRelayCommand<User> GreetUserCommand` (具備型別的指令)。

### 不具備取消功能的非同步指令

```csharp
[RelayCommand]
private async Task GreetUserAsync()
{
    var user = await users.GetCurrentAsync();
    Console.WriteLine($"Hello {user.Name}");
}
```

產生由 `AsyncRelayCommand` 支援的
`IAsyncRelayCommand GreetUserCommand`。

### 具備取消功能的非同步指令

```csharp
[RelayCommand]
private async Task GreetUserAsync(CancellationToken token)
{
    try
    {
        var user = await users.GetCurrentAsync(token);
        Console.WriteLine($"Hello {user.Name}");
    }
    catch (OperationCanceledException) { /* 預期中的 */ }
}
```

工具箱會將 `CancellationToken` 傳播給包裝的方法。呼叫
`GreetUserCommand.Cancel()` 會發出訊號。

### `IncludeCancelCommand = true`

產生成對的 `XxxCancelCommand`，其 `CanExecute` 已連結到
基礎非同步指令's `IsRunning` 狀態 —— 將其繫結到「取消」按鈕：

```csharp
[RelayCommand(IncludeCancelCommand = true)]
private async Task DownloadAsync(CancellationToken token) { /* ... */ }
```

```xml
<Button Command="{x:Bind ViewModel.DownloadCommand}" Content="Download"/>
<Button Command="{x:Bind ViewModel.DownloadCancelCommand}" Content="Cancel"/>
```

### `CanExecute = nameof(MethodOrProperty)`

```csharp
[RelayCommand(CanExecute = nameof(CanGreetUser))]
private void GreetUser(User? user) => Console.WriteLine($"Hello {user!.Name}");

private bool CanGreetUser(User? user) => user is not null;
```

`CanExecute` 成員在指令繫結時首次呼叫，
並在每次指令的 `NotifyCanExecuteChanged` 執行時再次呼叫（使用
`[NotifyCanExecuteChangedFor]` 以在繫結狀態
變更時自動連結）。

### `AllowConcurrentExecutions = true`

預設值為 `false`：當有呼叫正在進行時，指令會報告
自己為不可執行。設定為 `true` 則允許佇列/平行呼叫。

```csharp
[RelayCommand(AllowConcurrentExecutions = true)]
private async Task PingAsync() { /* fire-and-keep-going */ }
```

當包裝的方法接受 `CancellationToken` 且**不**允許並行執行時，
在已有呼叫擱置時要求新的執行會先
取消之前的權杖 (Token)。

### `FlowExceptionsToTaskScheduler = true`

預設值為 await-and-rethrow（例外狀況會導致應用程式當機，模擬同步
指令）。設定為 `true` 會改為透過 `ExecutionTask` 和
`TaskScheduler.UnobservedTaskException` 路由例外狀況 —— 當 UI 繫結到
`ExecutionTask.Status` 以轉譯錯誤狀態時非常有用。

```csharp
[RelayCommand(FlowExceptionsToTaskScheduler = true)]
private async Task LoadAsync(CancellationToken token) { /* ... */ }
```

---

## `[property: SomeAttribute(...)]`

將屬性 (Attribute) 轉發到產生的屬性 (Property) 上（適用於
`[ObservableProperty]` 欄位或 `[RelayCommand]` 方法）。

```csharp
[ObservableProperty]
[property: JsonRequired]
[property: JsonPropertyName("name")]
private string? username;

[RelayCommand]
[property: JsonIgnore]
private void GreetUser(User user) { /* ... */ }
```

將其用於序列化屬性 (`[JsonIgnore]`, `[JsonPropertyName]`, `[XmlElement]`)、
資料屬性 (`[Display(Name=...)]`) 或任何其他
需要存在於屬性/指令上，而非欄位/方法上的
屬性。

---

## `[INotifyPropertyChanged]` (類別層級)

僅在無法繼承自 `ObservableObject` 時使用（例如：該型別
已經繼承自不同的基底類別）。在型別本身產生
`INotifyPropertyChanged` 基礎結構。

```csharp
using CommunityToolkit.Mvvm.ComponentModel;

[INotifyPropertyChanged]
public partial class MyControl : UserControl
{
    [ObservableProperty]
    private string? caption;
}
```

盡可能優先使用 `ObservableObject` (或 `ObservableValidator` /
`ObservableRecipient`) 繼承。類別層級的屬性主要存在於
繼承受限的案例，例如自訂控制項和平台
基底型別。

還有 `[ObservableObject]` (類別層級) 可用於相同目的，如果您希望在
不使用繼承的情況下，在型別上產生完整的 `SetProperty<T>` API 介面
而不使用繼承。
