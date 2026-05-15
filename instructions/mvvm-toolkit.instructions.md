---
description: 'CommunityToolkit.Mvvm (MVVM Toolkit) 在 WPF、WinUI 3、.NET MAUI、Uno 平台與 Avalonia 中的 ViewModel、命令、訊息、驗證及相依性注入 (DI) 程式碼慣例。'
applyTo: '**/*.cs, **/*.xaml, **/*.csproj'
---

# CommunityToolkit.Mvvm (MVVM Toolkit)

每當專案參考 `CommunityToolkit.Mvvm` 時，這些規則即適用。
如需深入參考與端對端範例，請載入 `mvvm-toolkit` 技能。

## 套件與語言

- 在 `.csproj` 中參考 `CommunityToolkit.Mvvm` 8.x (or 更新版本)。請勿為新專案安裝舊版的 `Microsoft.Toolkit.Mvvm` (7.x)。
- C# `LangVersion` 必須支援來源產生器 (source generators) (現代 SDK 中的預設設定)。

## ViewModel 基底類別

- 預設將 ViewModel 繼承自 `ObservableObject`。
- 僅在 ViewModel 需要 `INotifyDataErrorInfo` (表單、設定、輸入驗證) 時使用 `ObservableValidator`。
- 僅在 ViewModel 傳送或接收 `IMessenger` 訊息時使用 `ObservableRecipient`。
- 當可以使用工具箱基底類別之一時，切勿手動實作 `INotifyPropertyChanged`。如果類別無法繼承自工具箱基底類別 (例如：自訂控制項)，請改為套用類別層級的 `[ObservableObject]` 或 `[INotifyPropertyChanged]` 屬性。

## 屬性

- 將每個使用 `[ObservableProperty]` 的型別宣告為 `partial` (若為巢狀，則宣告每個封裝型別)。
- 對名為 `name`、`_name` 或 `m_name` 的私有欄位套用 `[ObservableProperty]` — 切勿使用 PascalCase。讓產生器發出公用屬性。
- 當欄位符合 `[ObservableProperty]` 資格時，請勿手動撰寫 `SetProperty(ref field, value)` 樣板程式碼。
- 使用 `[NotifyPropertyChangedFor(nameof(Derived))]` 為衍生/計算屬性引發變更通知。
- 使用 `[NotifyCanExecuteChangedFor(nameof(XxxCommand))]` 以便在指令輸入變更時重新評估 `CanExecute`。
- 實作 `OnXxxChanging` / `OnXxxChanged` 分部方法掛鉤，以處理屬性變更時的副作用 — 請勿訂閱您自己的 `PropertyChanged` 事件。
- 使用 `[property: SomeAttribute]` 將屬性 (例如：`[JsonIgnore]`, `[JsonPropertyName(...)]`) 轉發到產生的屬性上。

## 指令

- 對執行個體方法使用 `[RelayCommand]`，優於手動建構 `RelayCommand` / `AsyncRelayCommand` 執行個體。
- `[RelayCommand]` 方法必須回傳 `void` 或 `Task` (或 `Task<T>`)。切勿使用 `async void` — 否則異常將變得無法觀察。
- 對於可取消的非同步工作，請宣告一個 `CancellationToken` 參數，並選擇性地設定 `IncludeCancelCommand = true` 以公開成對的 `XxxCancelCommand`。
- 使用 `CanExecute = nameof(...)` 加上 `[NotifyCanExecuteChangedFor]` 於輸入上，以維持按鈕啟用/停用狀態的同步。
- `AllowConcurrentExecutions` 預設為 `false` (預設值)。僅在重疊呼叫明確安全且符合預期時才設定為 `true`。
- 預設錯誤原則為 await-and-rethrow。僅在 UI 繫結至 `ExecutionTask` 以轉譯錯誤狀態時，才設定 `FlowExceptionsToTaskScheduler = true`。

## 訊息傳遞

- 預設使用 `WeakReferenceMessenger.Default`。僅在分析顯示訊息傳遞器過熱時才切換至 `StrongReferenceMessenger.Default`，並記錄生命週期保證。
- 使用 `static` 修飾詞搭配 `(recipient, message)` Lambda 形式註冊處理常式 — 切勿在 Lambda 中捕捉 `this`。
- 偏好在 `ObservableRecipient` ViewModel 上使用 `IRecipient<TMessage>` 介面，以便在 `IsActive = true` 時，`RegisterAll(this)` 能自動完成所有連線。
- 在啟用時 (例如：`OnNavigatedTo`) 設定 `IsActive = true`，在停用時 (例如：`OnNavigatedFrom`) 設定 `IsActive = false`。
- 傳送訊息時不考慮繼承 — 請明確註冊每個具體的訊息型別。
- 使用通道權杖 (`int` / `string` / `Guid` 多載) 將訊息範圍限制在子系統或視窗，以避免多個取用者發生衝突。

## 相依性注入 (DI)

- 使用 `Microsoft.Extensions.DependencyInjection` 進行服務與 ViewModel 註冊。偏好使用 .NET 泛型主機 (`Host.CreateDefaultBuilder()`)，以便自動完成設定、記錄與範圍驗證。
- 在組合根目錄 (通常是 `App.xaml.cs`) 中註冊服務與 ViewModel。在頁面建構函式或透過導覽框架從 DI 解析頁面的根 ViewModel。
- 透過建構函式注入服務與子 ViewModel。請勿從 ViewModel、服務或任何 DI 容器可以建構的型別內部呼叫 `Ioc.Default.GetService<T>()`。
- 生命週期：
  - `AddSingleton<T>()` — 外殼/主視窗 VM、設定、檔案/HTTP 服務、共享的 `IMessenger`。
  - `AddTransient<T>()` — 每個頁面或每個文件的 VM。
  - `AddScoped<T>()` — 僅在明確使用 `IServiceScope` 時使用；在用戶端應用程式中很少需要。
- 註冊 `IMessenger` 一次 (`services.AddSingleton<IMessenger>(WeakReferenceMessenger.Default)`)，並透過 `ObservableRecipient(messenger)` 建構函式注入。

## 驗證

- 使用 `ObservableValidator` 加上 `[NotifyDataErrorInfo]` 與 DataAnnotation 屬性 (`[Required]`, `[Range]`, `[EmailAddress]`, `[MinLength]`, `[MaxLength]`, `[CustomValidation]`)。
- 在提交表單前呼叫 `ValidateAllProperties()`；檢查 `HasErrors` 且若為 `true` 則退出。
- 在成功提交後或重設表單時，使用 `ClearAllErrors()` 重設錯誤狀態。
- 對於跨屬性規則，請從變更屬性的 `OnXxxChanged` 掛鉤呼叫 `ValidateProperty(value, nameof(Other))`。

## XAML

- 對於 WinUI 3 / UWP，偏好 `{x:Bind}` (編譯繫結) 優於 `{Binding}`。明確設定 `Mode=OneWay` 或 `Mode=TwoWay` — `{x:Bind}` 預設為 `OneTime`。
- 將 `Command="{x:Bind ViewModel.SaveCommand}"` 直接繫結至產生的指令屬性。
- 繫結非同步指令狀態 (`IsRunning`, `ExecutionTask.Status`, `ExecutionTask.Exception`) 以呈現進度/錯誤，而非封鎖 UI 執行緒。

## 應避免的事項

- `[ObservableProperty] private string Name;` — PascalCase 欄位與產生的屬性衝突；請使用 lowerCamel。
- 在 `[ObservableProperty]` 旁手動呼叫 `RaisePropertyChanged(nameof(X))` — 會產生重複通知。
- 從 ViewModel 建構函式內部呼叫 `Ioc.Default.GetService<T>()` — 隱藏相依性，破壞單元測試。
- 使用 `StrongReferenceMessenger` 但未呼叫 `OnDeactivated` / `UnregisterAll` — 會固定接收者並造成外洩。
- 在訊息 Lambda 中捕捉 `this` — 會造成終結器分配與生命週期混淆。務必搭配 `static` 使用 `(r, m) => r.OnX(m)`。
- 在 `[RelayCommand]` 方法上使用 `async void` — 請改回傳 `Task`。
- 變更 `[ObservableProperty]` 欄位所持有的同一個參考 — 相等比較子會回傳 `true`且不會引發變更通知。請改為替換執行個體。
- 同時繼承自 `ObservableValidator` 與 `ObservableRecipient` — 這是不可能的；請使用組合方式 (注入 `IMessenger` 或手動實作驗證)。
