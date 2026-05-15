# 疑難排解

CommunityToolkit.Mvvm 8.x 的常見錯誤、診斷和注意事項。

---

## 原始碼產生器診斷 (`MVVMTK0xxx`)

產生器會發佈編號診斷。最常見的診斷如下：

| 代碼 | 意義 | 修正 |
|------|---------|-----|
| `MVVMTK0008` | 包含型別（或封裝型別）不是 `partial` | 在類別宣告**以及**每個封裝型別中加入 `partial` |
| `MVVMTK0016` | `[NotifyCanExecuteChangedFor]` 目標不是可存取的 `IRelayCommand` 屬性 | 確保目標是同型別上由 `[RelayCommand]` 產生的命令（或手動宣告的 `IRelayCommand` 屬性） |
| `MVVMTK0017` | `[NotifyDataErrorInfo]` 用於 `ObservableValidator` 之外 | 繼承自 `ObservableValidator` 或移除該屬性 |
| `MVVMTK0018` | `[NotifyPropertyChangedRecipients]` 用於 `ObservableRecipient` 之外 | 繼承自 `ObservableRecipient` 或移除該屬性 |
| `MVVMTK0030` | `[ObservableProperty]` 用於未實作 `INotifyPropertyChanged` 的型別（且類別層級的 `[INotifyPropertyChanged]` / `[ObservableObject]` 屬性也缺失） | 繼承自 `ObservableObject` 或將 `[INotifyPropertyChanged]` / `[ObservableObject]` 套用至該型別 |
| `MVVMTK0042` | `[ObservableProperty]` 欄位屬於沒有正確 `partial` 宣告的泛型型別 | 與 `MVVMTK0008` 相同的修正方式（加入 `partial`） |

在以下網址搜尋完整表格：
<https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/generators/errors/>

---

## 「屬性名稱與欄位名稱衝突」

```text
'SampleViewModel' already contains a definition for 'Name'
```

您使用了 PascalCase 命名欄位：

```csharp
[ObservableProperty]
private string Name;   // ❌ 與產生的屬性衝突
```

請改用 lowerCamel（或加上前綴）：

```csharp
[ObservableProperty]
private string? name;   // ✅ 產生 Name
```

---

## 「Setter 從未引發 `PropertyChanged`」

可能的原因：

1. **指派了相同的參考。** 產生器使用
   `EqualityComparer<T>.Default.Equals` 來偵測變更。對於您更動了
   相同執行個體的參考型別，比較器會傳回 `true` 並略過通知。
   請替換執行個體而不是更動它。
2. **屬性設定為相同的值。** 相同的值 → 根據設計
   不會發出通知。
3. **需要自訂比較器。** 對於預設相等性錯誤的實值型別，
   請手動撰寫屬性並呼叫
   `SetProperty(ref field, value, comparer)`。

---

## 「ContentDialog 擲回 `InvalidOperationException`」(WinUI 3)

這不是工具箱的問題，但通常發生在 `[RelayCommand]` 非同步方法中。
在呼叫 `ShowAsync()` 之前設定 `XamlRoot`。詳情請參閱
`winui3-migration-guide` 技能。

---

## 非同步 `[RelayCommand]` 吞掉例外狀況

預設行為：包裝的工作（task）會被等候，且例外狀況會在同步內容
（synchronization context）上重新擲回。如果您的方法是 `async void`，
產生器會將其包裝為同步的 `RelayCommand`，例外狀況會變成
未被觀察。**務必從 `[RelayCommand]` 方法傳回 `Task`。**

如果 UI 繫結到 `ExecutionTask.Exception` 來呈現錯誤，請選擇開啟
`FlowExceptionsToTaskScheduler = true`：

```csharp
[RelayCommand(FlowExceptionsToTaskScheduler = true)]
private async Task LoadAsync(CancellationToken token) { /* ... */ }
```

---

## 取消似乎沒有作用

- 確保包裝的方法宣告了 `CancellationToken` 參數。
- 將權杖（token）向下傳遞給被等候的 API（`HttpClient.GetAsync(url, token)`、
  `Task.Delay(ms, token)` 等）。
- 捕捉 `OperationCanceledException`，讓 UI 不會看到錯誤。

---

## 訊息中心處理常式（Messenger handler）從未觸發

檢查清單：

1. 接收者註冊的是**精確的**訊息型別，而不是基底型別。
   **不**考慮繼承。
2. 使用相同的 `IMessenger` 執行個體進行傳送和註冊
   （`WeakReferenceMessenger.Default` 對比注入的每個視窗訊息中心）。
3. 傳送者和接收者之間的權杖（token，即頻道）必須相符。
4. 使用 `WeakReferenceMessenger` 時，接收者可能已經被
   記憶體回收。請在某處持有強參考（通常 DI
   容器會對單一執行個體（singleton）VM 執行此操作）。
5. 使用 `ObservableRecipient` 時，`IsActive` 必須為 `true` —— `OnActivated`
   協助註冊 `IRecipient<T>` 處理常式。

---

## `OnActivated` 從未執行

`ObservableRecipient.OnActivated` 會在 `IsActive` 從 `false` 翻轉為
`true` 時被呼叫。如果您從未設定 `IsActive = true`，則不會註冊任何處理常式。
常見模式：

```csharp
protected override void OnNavigatedTo(NavigationEventArgs e)
{
    base.OnNavigatedTo(e);
    ViewModel.IsActive = true;
}

protected override void OnNavigatedFrom(NavigationEventArgs e)
{
    base.OnNavigatedFrom(e);
    ViewModel.IsActive = false;
}
```

---

## 使用 `StrongReferenceMessenger` 造成的記憶體洩漏

強參考接收者會被固定，直到您呼叫 `Unregister`。您可以：

- 繼承自 `ObservableRecipient`（在 `OnDeactivated` 中自動取消註冊）。
- 切換到 `WeakReferenceMessenger.Default`。
- 在您的處置（dispose）/ 拆除路徑中呼叫 `messenger.UnregisterAll(this)`。

---

## 「無法同時繼承 `ObservableValidator` 和 `ObservableRecipient`」

C# 僅支援單一繼承 —— 請擇一。如果您兩者都需要：

- 繼承自 `ObservableRecipient`（或 `ObservableValidator`）。
- 透過組合方式在旁注入 `IMessenger`（或實作驗證）
  進行組合。

或者在包裝了這兩個部分的自訂基底型別上使用類別層級的
`[INotifyPropertyChanged]` / `[ObservableObject]` 屬性。

---

## DI 容器無法建構 ViewModel

徵兆：`InvalidOperationException` 提到「無法解析服務
型別 'X' 當嘗試啟動 'MyViewModel' 時」。

原因：

- 建構函式參數型別未註冊。加入 `services.AddX(...)`。
- 多個模稜兩可的建構函式 —— 容器會挑選其相依性皆已註冊的最長
  建構函式。如果兩個建構函式皆符合資格，則會擲回例外狀況。
  將其中一個標記為標準建構函式
  或消除歧義。
- 將限定範圍（scoped）的服務注入到單一執行個體（singleton）中
  （在具有範圍驗證的開發模式下）。請更改生命週期
  或注入 `IServiceScopeFactory` 並從範圍中解析。

---

## XAML 無法解析命名空間

```text
The type 'local:ContactViewModel' was not found.
```

XAML 命名空間對應需要參考組件（assembly）且
命名空間必須相符。如果 VM 位於類別函式庫中，則對應需要
組件名稱：

```xml
xmlns:vm="using:MyApp.Shared.ViewModels;assembly=MyApp.Shared"
```

（WPF 語法略有不同：`xmlns:vm="clr-namespace:...;assembly=..."`。）

---

## 「設計時資料（Design-time data）未顯示任何內容」

設計時 XAML 編輯器在不使用 DI 容器的情況下具現化頁面。
您可以：

- 提供一個無參數建構函式來引導（bootstrap）設計時 VM。
- 使用 `d:DataContext="{d:DesignInstance Type=vm:ContactViewModel, IsDesignTimeCreatable=True}"`。
- 使用具有硬編碼範例資料的獨立設計時 ViewModel 類別。

---

## 更多資訊

- 所有 `MVVMTK0xxx` 錯誤：
  <https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/generators/errors/>
- 原始碼：<https://github.com/CommunityToolkit/dotnet>
- 範例應用程式：<https://aka.ms/mvvmtoolkit/samples>
