---
name: mvvm-toolkit
description: 'CommunityToolkit.Mvvm (MVVM 工具包) 核心：來源產生器 ([ObservableProperty]、[RelayCommand]、[NotifyPropertyChangedFor]、[NotifyCanExecuteChangedFor]、[NotifyDataErrorInfo])、基礎類別 (ObservableObject / ObservableValidator / ObservableRecipient)、指令 (RelayCommand / AsyncRelayCommand) 和驗證。配套技能：用於發佈/訂閱的 mvvm-toolkit-messenger，以及用於 Microsoft.Extensions.DependencyInjection 配置的 mvvm-toolkit-di。適用於 WPF、WinUI 3、MAUI、Uno 和 Avalonia。'
---

# CommunityToolkit.Mvvm (核心)

在開發或審核使用 `CommunityToolkit.Mvvm` 8.x 的應用程式中的 ViewModel、屬性、
指令或驗證時，請使用此技能。

> **配套技能。** 載入 **`mvvm-toolkit-messenger`** 以進行 `IMessenger`
> 發佈/訂閱模式。載入 **`mvvm-toolkit-di`** 以進行
> `Microsoft.Extensions.DependencyInjection` 整合。

> **快速回顧。** 在 `partial` 類別中的私有欄位上使用 `[ObservableProperty]`；
> 在執行個體方法上使用 `[RelayCommand]`；繼承自
> `ObservableObject` (如果是輸入表單則為 `ObservableValidator`，
> 使用 `IMessenger` 時則為 `ObservableRecipient`)。

---

## 套件與設定

```xml
<ItemGroup>
  <PackageReference Include="CommunityToolkit.Mvvm" Version="8.*" />
</ItemGroup>
```

目標：`netstandard2.0`、`netstandard2.1`、`net6.0`+。適用於 .NET、.NET
Framework、Mono。來源產生器隨附於同一個 NuGet 中 — 不需要額外的分析器
參照。

命名空間：

```csharp
using CommunityToolkit.Mvvm.ComponentModel;   // ObservableObject, [ObservableProperty]
using CommunityToolkit.Mvvm.Input;             // [RelayCommand], RelayCommand, AsyncRelayCommand
```

> **通用規則。** 每個使用 `[ObservableProperty]` 或 `[RelayCommand]` 的型別
> — 以及任何巢狀架構中的外層型別 — 都必須宣告為 `partial`。
> 否則，產生器會發出
> `MVVMTK0008` / `MVVMTK0042`。

---

## 來源產生器速查表

| 屬性 | 套用於 | 產生 |
|-----------|-----------|-----------|
| `[ObservableProperty]` | 私有欄位 | 公用 `INotifyPropertyChanged` 屬性 + `OnXxxChanging`/`OnXxxChanged` 部分方法掛勾 |
| `[NotifyPropertyChangedFor(nameof(Other))]` | 可觀察欄位 | 同時為列出的屬性引發 `PropertyChanged` |
| `[NotifyCanExecuteChangedFor(nameof(MyCommand))]` | 可觀察欄位 | 在變更時呼叫 `MyCommand.NotifyCanExecuteChanged()` |
| `[NotifyDataErrorInfo]` | `ObservableValidator` 上的可觀察欄位 | 從 setter 呼叫 `ValidateProperty(value)` |
| `[NotifyPropertyChangedRecipients]` | `ObservableRecipient` 上的可觀察欄位 | 變更後執行 `Broadcast(old, new)` |
| `[RelayCommand]` | 執行個體方法 | 延遲載入的 `RelayCommand` / `AsyncRelayCommand`，公開為 `IRelayCommand` / `IAsyncRelayCommand` |
| `[RelayCommand(CanExecute = nameof(CanX))]` | 執行個體方法 | 將 `CanExecute` 連接至方法或屬性 |
| `[RelayCommand(IncludeCancelCommand = true)]` | 帶有 `CancellationToken` 的非同步方法 | 同時產生 `XxxCancelCommand` |
| `[RelayCommand(AllowConcurrentExecutions = true)]` | 非同步方法 | 允許佇列/平行呼叫 (預設在執行時停用) |
| `[RelayCommand(FlowExceptionsToTaskScheduler = true)]` | 非同步方法 | 透過 `ExecutionTask` 公開例外狀況，而不是等待並重新擲回 |
| `[property: SomeAttr]` | 可觀察欄位或 `[RelayCommand]` 方法 | 將 `SomeAttr` 轉發到產生的屬性上 (例如 `[JsonIgnore]`) |

**Naming.** 欄位 `name` / `_name` / `m_name` → `Name`。方法 `LoadAsync` →
`LoadCommand` (移除 `Async` 字尾；
也會移除開頭的 `On`)。

請參閱 [`references/source-generators.md`](references/source-generators.md) 以取得
完整的屬性參照與產生的程式碼範例。

---

## ViewModel 模式

### 簡單的可觀察屬性

```csharp
public partial class ContactViewModel : ObservableObject
{
    [ObservableProperty]
    private string? name;
}
```

### 掛勾：`OnXxxChanging` / `OnXxxChanged`

```csharp
[ObservableProperty]
private string? name;

partial void OnNameChanged(string? value) =>
    Logger.LogInformation("Name changed to {Name}", value);
```

提供單一引數 `(value)` 和兩個引數 `(oldValue, newValue)` 的多載。
僅實作您需要的掛勾；未實作的掛勾會被編譯器省略
(零執行階段成本)。

### 相依屬性 + 相依指令

```csharp
[ObservableProperty]
[NotifyPropertyChangedFor(nameof(FullName))]
[NotifyCanExecuteChangedFor(nameof(SaveCommand))]
private string? firstName;

[ObservableProperty]
[NotifyPropertyChangedFor(nameof(FullName))]
[NotifyCanExecuteChangedFor(nameof(SaveCommand))]
private string? lastName;

public string FullName => $"{FirstName} {LastName}".Trim();
```

### 封裝不可觀察的模型

```csharp
public sealed class ObservableUser(User user) : ObservableObject
{
    public string Name
    {
        get => user.Name;
        set => SetProperty(user.Name, value, user, (u, n) => u.Name = n);
    }
}
```

傳遞靜態 lambda (無擷取狀態) 以保持呼叫不產生記憶體配置。

---

## 指令

```csharp
[RelayCommand]
private void Refresh() => Items.Reset();

[RelayCommand]
private async Task LoadAsync()
{
    foreach (var item in await service.GetItemsAsync())
        Items.Add(item);
}

[RelayCommand(IncludeCancelCommand = true)]
private async Task DownloadAsync(CancellationToken token)
{
    await using var stream = await http.GetStreamAsync(url, token);
    // ...
}

[RelayCommand(CanExecute = nameof(CanSave))]
private Task SaveAsync() => repo.SaveAsync(Name!);

private bool CanSave() => !string.IsNullOrWhiteSpace(Name);
```

僅在您必須明確擁有指令的存留期或從非顯著來源組合指令時，才使用手動的
`RelayCommand` / `AsyncRelayCommand` 建構函式。
屬性樣式涵蓋了約 95% 的情況。

請參閱 [`references/relaycommand-cookbook.md`](references/relaycommand-cookbook.md)
以取得同步 / 非同步 / 可取消 / 並行 / 錯誤公開的作法。

---

## 基礎類別選擇

| 基礎類別 | 使用時機 |
|------------|---------|
| `ObservableObject` | 預設。`INotifyPropertyChanged` + `INotifyPropertyChanging` + `SetProperty` 多載 + 用於 `Task` 屬性的 `SetPropertyAndNotifyOnCompletion` |
| `ObservableValidator` | ViewModel 需要 `INotifyDataErrorInfo` (表單、設定輸入) |
| `ObservableRecipient` | ViewModel 傳送或接收 `IMessenger` 訊息 — 請參閱 **`mvvm-toolkit-messenger`** 技能 |

C# 是單一繼承：`ObservableValidator` 和 `ObservableRecipient` 均繼承自
`ObservableObject`，因此結合兩者需要使用組合 (例如，將 `IMessenger` 注入
`ObservableValidator`)。

---

## 驗證

```csharp
using System.ComponentModel.DataAnnotations;

public sealed partial class RegistrationViewModel : ObservableValidator
{
    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Required, MinLength(2), MaxLength(100)]
    private string? name;

    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Required, EmailAddress]
    private string? email;

    [RelayCommand]
    private void Submit()
    {
        ValidateAllProperties();
        if (HasErrors) return;
        // submit...
    }
}
```

其他進入點：`TrySetProperty`、`ValidateProperty(value, name)`、
`ClearAllErrors()`、`GetErrors(propertyName)`。自訂規則支援
`[CustomValidation]` 方法和自訂 `ValidationAttribute` 子類別。

請參閱 [`references/validation.md`](references/validation.md) 以取得完整驗證器的
功能範疇。

---

## 常見陷阱

1. **忘記使用 `partial`。** 類別 (以及每個外層型別) 都必須是 `partial`。
   編譯錯誤 `MVVMTK0008` / `MVVMTK0042`。
2. **使用 PascalCase 欄位名稱。** `[ObservableProperty] private string Name;`
   與產生的屬性發生衝突。請使用 `name`、`_name` 或 `m_name`。
3. **在 `[RelayCommand]` 上使用 `async void`。** 產生器僅將傳回 `Task` 的
   方法封裝為 `IAsyncRelayCommand`。`async void` 會變成同步的
   `RelayCommand`，且例外狀況將無法被觀察到。請務必傳回
   `Task`。
4. **忘記使用 `[NotifyCanExecuteChangedFor]`。** 即使 `CanSave()` 現在會
   傳回 `true`，儲存按鈕仍保持停用狀態。
5. **修改 `[ObservableProperty]` 欄位所持有的同一個參照。**
   `EqualityComparer<T>.Default` 傳回 `true`，不會觸發通知。請替換執行
   個體，而不是修改它。

如需完整的診斷資料表 (`MVVMTK0xxx`) 和更多陷阱，請參閱
[`references/troubleshooting.md`](references/troubleshooting.md)。

---

## 端對端迷你逐步解說

一個雙窗格筆記應用程式，示範產生器 + 指令 +
`[NotifyCanExecuteChangedFor]`：

```csharp
public sealed partial class NoteViewModel(INotesService notes,
    IMessenger messenger) : ObservableRecipient(messenger)
{
    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    [NotifyCanExecuteChangedFor(nameof(DeleteCommand))]
    private string? filename;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    private string? text;

    [RelayCommand(CanExecute = nameof(CanSave))]
    private Task SaveAsync()
    {
        Messenger.Send(new NoteSavedMessage(Filename!));
        return notes.SaveAsync(Filename!, Text!);
    }

    [RelayCommand(CanExecute = nameof(CanDelete))]
    private Task DeleteAsync() => notes.DeleteAsync(Filename!);

    private bool CanSave() =>
        !string.IsNullOrWhiteSpace(Filename) && !string.IsNullOrEmpty(Text);
    private bool CanDelete() => !string.IsNullOrWhiteSpace(Filename);
}
```

如需完整的範例 (DI 配置、View 程式碼後置、XAML、單元測試)，請參閱
[`references/end-to-end-walkthrough.md`](references/end-to-end-walkthrough.md)。

---

## 參考資料與配套技能

| 主題 | 位置 |
|-------|-------|
| 來源產生器屬性參照 | [`references/source-generators.md`](references/source-generators.md) |
| RelayCommand 作法 | [`references/relaycommand-cookbook.md`](references/relaycommand-cookbook.md) |
| 驗證深入探討 | [`references/validation.md`](references/validation.md) |
| 完整的筆記應用程式逐步解說 | [`references/end-to-end-walkthrough.md`](references/end-to-end-walkthrough.md) |
| `MVVMTK0xxx` 診斷與陷阱 | [`references/troubleshooting.md`](references/troubleshooting.md) |
| **Messenger 發佈/訂閱** | 配套技能：**`mvvm-toolkit-messenger`** |
| **`Microsoft.Extensions.DependencyInjection` 配置** | 配套技能：**`mvvm-toolkit-di`** |

外部來源：

- 工具包概覽：<https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/>
- WinUI MVVM 工具包教學：<https://learn.microsoft.com/en-us/windows/apps/tutorials/winui-mvvm-toolkit/intro>
- 原始碼：<https://github.com/CommunityToolkit/dotnet>
- 範例：<https://github.com/CommunityToolkit/MVVM-Samples>
