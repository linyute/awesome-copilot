# Messenger 模式

`CommunityToolkit.Mvvm.Messaging` 在 ViewModel (或任何物件) 之間提供
解耦的發佈/訂閱，而無需強制共享參考圖。

## 選擇實作方式

| 類型 | 何時使用 |
|------|------------|
| `WeakReferenceMessenger.Default` | **預設。** 接收者以弱參考持有 — 即使仍註冊也符合 GC 資格。內部修剪在完整的 GC 期間執行。不需要手動 `Cleanup()`。 |
| `StrongReferenceMessenger.Default` | 當分析顯示 messenger 是熱點且配置 (allocation) 很重要時使用。接收者會固定直到您 `Unregister`。忘記取消註冊會導致記憶體流失。 |
| 自訂 `IMessenger` 實例 | 每個視窗/每個範圍的 messenger (例如：每個應用程式視窗一個)。直接建構並透過 DI 注入。 |

`ObservableRecipient` 的無參數建構函式使用
`WeakReferenceMessenger.Default`。將不同的 `IMessenger` 傳遞給其
建構函式以進行覆寫。

---

## 定義訊息

工具箱提供了一些您可以繼承的基底類別，但任何類別
都可以。

### 純負載 (Plain payload)

```csharp
public sealed record ThemeChangedMessage(AppTheme NewTheme);
```

### `ValueChangedMessage<T>`

```csharp
using CommunityToolkit.Mvvm.Messaging.Messages;

public sealed class LoggedInUserChangedMessage(User user)
    : ValueChangedMessage<User>(user);
```

透過 `.Value` 存取負載。

### 空訊號 (Empty signal)

```csharp
public sealed record RefreshRequestedMessage;
```

對於沒有負載的「立即重新載入」或「立即儲存」廣播非常有用。

---

## 註冊接收者

### Lambda 樣式 (建議)

```csharp
WeakReferenceMessenger.Default.Register<MyViewModel, ThemeChangedMessage>(
    this,
    static (recipient, message) => recipient.OnThemeChanged(message.NewTheme));
```

`static` 修飾詞確保 lambda 不會擷取 `this` (或任何
區域變數)，使其保持無配置 (allocation-free) 並防止透過結束外部範圍
(closure) 擷取意外產生回到接收者的強參考。

### `IRecipient<TMessage>` 介意樣式

```csharp
public sealed class MyViewModel : ObservableRecipient,
    IRecipient<ThemeChangedMessage>,
    IRecipient<RefreshRequestedMessage>
{
    public void Receive(ThemeChangedMessage message) { /* ... */ }
    public void Receive(RefreshRequestedMessage message) { /* ... */ }
}
```

`ObservableRecipient.OnActivated()` 呼叫 `Messenger.RegisterAll(this)`，
這會訂閱該型別實作的每個 `IRecipient<T>` 介面。

如果您不使用 `ObservableRecipient`，請手動註冊：

```csharp
WeakReferenceMessenger.Default.RegisterAll(this);
```

---

## 傳送訊息

```csharp
WeakReferenceMessenger.Default.Send(new ThemeChangedMessage(AppTheme.Dark));

// 空負載可以使用無參數的多載：
WeakReferenceMessenger.Default.Send<RefreshRequestedMessage>();
```

---

## 頻道 (權杖)

透過具名頻道傳送/接收，將訊息範圍限制在子系統中。
權杖可以是任何可比較相等性的值 (通常是 `int`、`string` 或 `Guid`)。

```csharp
const int LeftPaneChannel = 1;
const int RightPaneChannel = 2;

WeakReferenceMessenger.Default.Register<MyViewModel, RefreshRequestedMessage, int>(
    this, LeftPaneChannel,
    static (r, _) => r.RefreshLeft());

WeakReferenceMessenger.Default.Send(new RefreshRequestedMessage(), LeftPaneChannel);
```

不帶權杖傳送的訊息使用預設的共享頻道，且
**不會**傳送給具備頻道範圍的接收者。

---

## 請求 / 回覆

對於接收者應向傳送者提供回傳值的詢問式案例，
請使用 `RequestMessage<T>` 系列。

### 同步請求

```csharp
public sealed class CurrentUserRequest : RequestMessage<User> { }

// 接收者
WeakReferenceMessenger.Default.Register<UserService, CurrentUserRequest>(
    this,
    static (r, m) => m.Reply(r.CurrentUser));

// 呼叫者
User user = WeakReferenceMessenger.Default.Send<CurrentUserRequest>();
```

如果沒有接收者呼叫 `Reply`，從 `CurrentUserRequest` 到 `User` 的
隱含轉換會擲回異常。若要先檢查，請擷取訊息：

```csharp
var request = WeakReferenceMessenger.Default.Send<CurrentUserRequest>();
if (request.HasReceivedResponse)
{
    User user = request.Response;
}
```

### 非同步請求

```csharp
public sealed class CurrentUserRequest : AsyncRequestMessage<User> { }

WeakReferenceMessenger.Default.Register<UserService, CurrentUserRequest>(
    this,
    static (r, m) => m.Reply(r.GetCurrentUserAsync()));

User user = await WeakReferenceMessenger.Default.Send<CurrentUserRequest>();
```

### 集合請求 (Fan-in)

`CollectionRequestMessage<T>` 和 `AsyncCollectionRequestMessage<T>` 會
從處理該訊息的每個接收者收集 `Reply`：

```csharp
public sealed class OpenDocumentsRequest : CollectionRequestMessage<Document> { }

var responses = WeakReferenceMessenger.Default.Send<OpenDocumentsRequest>();
foreach (Document doc in responses) { /* ... */ }
```

---

## 取消註冊

當接收者的生命週期結束時，務必取消註冊。使用
`WeakReferenceMessenger` 時，這是為了效能 (修剪無效項目)；
使用 `StrongReferenceMessenger` 時，則是為了避免記憶體流失。

```csharp
WeakReferenceMessenger.Default.Unregister<ThemeChangedMessage>(this);
WeakReferenceMessenger.Default.Unregister<ThemeChangedMessage, int>(this, LeftPaneChannel);
WeakReferenceMessenger.Default.UnregisterAll(this);
```

當 `IsActive` 切換為 `false` 時，`ObservableRecipient.OnDeactivated()`
會為您取消註冊所有內容 — 請在啟動流程 (例如：頁面 `OnNavigatedTo`)
中設定 `IsActive = true`，並在關閉時設定 `IsActive = false`。

---

## 生命週期陷阱

1. **結束外部範圍 (Closure) 擷取的 `this`。** 避免使用會
   隱含擷取封閉型 `this` 的 `(r, m) => OnX(m)` lambda。請使用
   `(r, m) => r.OnX(m)`，以便傳入接收者。
2. **長生命週期的強參考接收者。** 使用 `StrongReferenceMessenger` 時，
   忘記 `UnregisterAll` 會讓接收者 (及其整個物件圖) 永久保持存活。
3. **繼承的訊息型別。** 為 `BaseMessage` 註冊的處理常式
   **不會**針對 `DerivedMessage : BaseMessage` 被呼叫。註冊您
   想要處理的每個具體型別處理。
4. **多次 `ObservableRecipient` 啟動。** 在沒有中間停用的
   情況下設定兩次 `IsActive = true` 會擲回異常 — 請保護該切換開關。
5. **UI 執行緒封送 (Marshalling)。** Messenger 與執行緒無關。
   如果處理常式更新 UI，請手動進行封送
   (`DispatcherQueue.TryEnqueue` / `Dispatcher.BeginInvoke`)。

---

## 多個 Messenger

常見的架構是每個視窗或每個範圍一個 messenger：

```csharp
services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default);  // 全域應用程式
services.AddScoped<WindowScopedMessenger>();                        // 每個視窗
```

將適當的 `IMessenger` 注入 ViewModel 建構函式：

```csharp
public sealed partial class WindowViewModel(IMessenger messenger)
    : ObservableRecipient(messenger) { /* ... */ }
```

這會將廣播隔離到單個視窗 — 對於多視窗桌面應用程式
(WinUI 3、WPF、MAUI 桌面版、Avalonia) 非常有用。

