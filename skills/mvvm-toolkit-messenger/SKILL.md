---
name: mvvm-toolkit-messenger
description: 'CommunityToolkit.Mvvm Messenger pub/sub 用於 ViewModel（或任何物件）之間的解耦通訊。涵蓋 WeakReferenceMessenger 與 StrongReferenceMessenger、IRecipient<TMessage>、RequestMessage<T> / AsyncRequestMessage<T> / CollectionRequestMessage<T>、ValueChangedMessage<T>、頻道 (tokens) 以及 ObservableRecipient 啟用生命週期。適用於 WPF、WinUI 3, .NET MAUI、Uno 和 Avalonia。'
---

# CommunityToolkit.Mvvm Messenger

用於 ViewModel（或任何物件）的發佈/訂閱 (Pub/sub) 訊息傳遞，且不強制使用共用
參考圖形。為 `CommunityToolkit.Mvvm` 8.x 的一部分。

> **TL;DR.** 預設使用 `WeakReferenceMessenger.Default`。使用 `(recipient, message)`
> lambda 運算式並加上 `static` 修飾詞來註冊處理常式，如此便不會擷取
> `this`。繼承自 `ObservableRecipient` 並在啟用/停用時切換
> `IsActive`，即可獲得自動註冊/取消註冊。

---

## 何時使用此技能

- 兩個或多個 ViewModel 需要對事件（登入、佈景主題變更、
  儲存、導覽）做出反應，而彼此不持有參考
- ViewModel 需要向另一個 VM 請求值（請求/回覆）
- 您正在使用頻道權杖 (channel tokens) 將事件範圍限定在子系統或視窗
- 診斷「我的處理常式從未觸發」或弱參考接收者 (weak-reference recipient) 生命週期
  問題

有關來源產生器、基底類別和指令，請參閱 **`mvvm-toolkit`** 
技能。有關 DI 佈線（註冊 `IMessenger` 執行個體），請參閱
**`mvvm-toolkit-di`**。

---

## 選擇實作方式

| 類型 | 何時使用 |
|------|------|
| `WeakReferenceMessenger.Default` | **預設。** 接收者以弱參考方式持有 — 即使在註冊期間也符合 GC 資格。內部修剪會在完整 GC 期間執行；不需要手動呼叫 `Cleanup()`。 |
| `StrongReferenceMessenger.Default` | 分析工具 (Profiler) 顯示 messenger 非常頻繁使用且配置很重要。接收者會被固定直到您呼叫 `Unregister`。忘記取消註冊會導致記憶體洩漏。 |
| 自訂 `IMessenger` 執行個體 | 每個視窗/每個範圍（例如：每個應用程式視窗一個 messenger）。直接建構，透過 DI 插入。 |

`ObservableRecipient` 的無參數建構函式使用
`WeakReferenceMessenger.Default`。將不同的 `IMessenger` 傳遞給其
建構函式以進行覆寫。

---

## 定義訊息

工具箱隨附基底類別；任何類別皆可運作。

```csharp
using CommunityToolkit.Mvvm.Messaging.Messages;

// 單一承載廣播 (Single-payload broadcast)
public sealed class LoggedInUserChangedMessage(User user)
    : ValueChangedMessage<User>(user);

// 自訂圖形 (records 非常適合用於此處)
public sealed record ThemeChangedMessage(AppTheme NewTheme);

// 空訊號
public sealed record RefreshRequestedMessage;
```

---

## 註冊接收者

### Lambda 樣式（推薦）

```csharp
WeakReferenceMessenger.Default.Register<MyViewModel, ThemeChangedMessage>(
    this,
    static (recipient, message) => recipient.OnThemeChanged(message.NewTheme));
```

`static` 修飾詞可防止意外的終止作業配置 (closure allocation)，並將
`this` 排除在 lambda 之外 — 請改用 `recipient` 參數。

### `IRecipient<TMessage>` 介面樣式

```csharp
public sealed class MyViewModel : ObservableRecipient,
    IRecipient<ThemeChangedMessage>,
    IRecipient<RefreshRequestedMessage>
{
    public void Receive(ThemeChangedMessage message) { /* ... */ }
    public void Receive(RefreshRequestedMessage message) { /* ... */ }
}
```

`ObservableRecipient.OnActivated()` 會呼叫 `Messenger.RegisterAll(this)`，
這會訂閱該型別實作的所有 `IRecipient<T>` 介面。
如果您沒有使用 `ObservableRecipient`，請手動註冊：

```csharp
WeakReferenceMessenger.Default.RegisterAll(this);
```

---

## 傳送訊息

```csharp
WeakReferenceMessenger.Default.Send(new ThemeChangedMessage(AppTheme.Dark));

// 空承載 (Empty payloads) 使用無參數多載：
WeakReferenceMessenger.Default.Send<RefreshRequestedMessage>();
```

---

## 頻道 (權杖)

使用權杖 (token)（任何可比較相等的値 — `int`、`string`、`Guid`）
將訊息範圍限定在子系統或視窗：

```csharp
const int LeftPaneChannel = 1;

WeakReferenceMessenger.Default.Register<MyViewModel, RefreshRequestedMessage, int>(
    this, LeftPaneChannel,
    static (r, _) => r.RefreshLeft());

WeakReferenceMessenger.Default.Send(new RefreshRequestedMessage(), LeftPaneChannel);
```

未帶權杖傳送的訊息會使用預設的共用頻道 — 它們
**不會**傳遞給限定頻道範圍的接收者。

---

## 請求 / 回覆

對於接收者向傳送者提供回傳值的詢問式案例，
請使用 `RequestMessage<T>` 系列。

### 同步請求

```csharp
public sealed class CurrentUserRequest : RequestMessage<User> { }

WeakReferenceMessenger.Default.Register<UserService, CurrentUserRequest>(
    this,
    static (r, m) => m.Reply(r.CurrentUser));

User user = WeakReferenceMessenger.Default.Send<CurrentUserRequest>();
```

如果沒有接收者呼叫 `Reply`，則從 `CurrentUserRequest` 到 `User` 
隱含轉換將會擲回例外狀況。請先擷取訊息進行檢查：

```csharp
var request = WeakReferenceMessenger.Default.Send<CurrentUserRequest>();
if (request.HasReceivedResponse)
    User user = request.Response;
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

`CollectionRequestMessage<T>` 和 `AsyncCollectionRequestMessage<T>`
會從每個回應的接收者收集 `Reply`：

```csharp
public sealed class OpenDocumentsRequest : CollectionRequestMessage<Document> { }

var docs = WeakReferenceMessenger.Default.Send<OpenDocumentsRequest>();
foreach (Document doc in docs) { /* ... */ }
```

---

## 生命週期

即使使用 `WeakReferenceMessenger`，在關閉接收者時也應明確取消註冊
— 這會修剪停用項目並提高效能：

```csharp
WeakReferenceMessenger.Default.Unregister<ThemeChangedMessage>(this);
WeakReferenceMessenger.Default.Unregister<ThemeChangedMessage, int>(this, LeftPaneChannel);
WeakReferenceMessenger.Default.UnregisterAll(this);
```

當 `IsActive` 切換為 `false` 時，`ObservableRecipient.OnDeactivated()` 
會自動執行此操作。請從您的啟用掛勾 (activation hook) 設定它：

```csharp
protected override void OnNavigatedTo(NavigationEventArgs e)
{
    base.OnNavigatedTo(e);
    ViewModel.IsActive = true;
}

protected override void OnNavigatedFrom(NavigationEventArgs e)
{
    ViewModel.IsActive = false;
    base.OnNavigatedFrom(e);
}
```

---

## 常見陷阱

1. **在 lambda 中擷取 `this`。** `(r, m) => OnX(m)` 會隱含擷取 `this`；
   這會配置一個終止作業 (closure) 並混淆生命週期。請務必搭配 `static`
   使用 `(r, m) => r.OnX(m)`。
2. **未呼叫 `Unregister` 的強參考接收者。** 使用 `StrongReferenceMessenger`
   時，接收者（及其整個物件圖形）會永遠固定。請繼承自 `ObservableRecipient`
   （在 `OnDeactivated` 中自動取消註冊）或
   呼叫 `UnregisterAll(this)`。
3. **繼承的訊息型別。** 為 `BaseMessage` 註冊的處理常式**不會**針對
   `DerivedMessage : BaseMessage` 被呼叫。
   請為每個具體型別進行註冊。
4. **錯誤的 messenger 執行個體。** 透過 `WeakReferenceMessenger.Default`
   傳送，但透過插入的每個視窗專屬 messenger 註冊，意味著訊息永遠不會送達。
   請在所有地方使用相同的 `IMessenger`（通常透過
   `ObservableRecipient(messenger)` 插入）。
5. **`OnActivated` 從未執行。** `ObservableRecipient` 僅在 `IsActive`
   從 `false` 切換為 `true` 時註冊 `IRecipient<T>` 處理常式。
6. **跨執行緒更新。** Messenger 與執行緒無關。如果處理常式更新 UI，
   請手動進行封送處理 (marshal)
   (`DispatcherQueue.TryEnqueue` / `Dispatcher.BeginInvoke`)。

---

## 多個 messenger（每個視窗限定範圍）

```csharp
services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default); // 應用程式範圍
services.AddScoped<WindowScopedMessenger>();                       // 每個視窗
```

將適當的 `IMessenger` 插入 ViewModel 建構函式中：

```csharp
public sealed partial class WindowViewModel(IMessenger messenger)
    : ObservableRecipient(messenger) { }
```

這會將廣播隔離在單個視窗中 — 對於多視窗
桌面應用程式（WinUI 3、WPF、MAUI 桌面版、Avalonia）非常有用。

---

## 參考資料

| 主題 | 檔案 |
|-------|------|
| 完整深入探討（更多頻道/生命週期範例、診斷） | [`references/messenger-patterns.md`](references/messenger-patterns.md) |

外部連結：

- Messenger 文件：<https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/messenger>
- `WeakReferenceMessenger` API：<https://learn.microsoft.com/en-us/dotnet/api/communitytoolkit.mvvm.messaging.weakreferencemessenger>
- 原始程式碼：<https://github.com/CommunityToolkit/dotnet>
