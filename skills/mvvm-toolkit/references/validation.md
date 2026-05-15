# 使用 `ObservableValidator` 進行驗證

`ObservableValidator` 擴充了 `ObservableObject` 並支援 `INotifyDataErrorInfo`，
整合了
`System.ComponentModel.DataAnnotations` 驗證屬性。

---

## 快速入門

```csharp
using System.ComponentModel.DataAnnotations;
using CommunityToolkit.Mvvm.ComponentModel;

public sealed partial class RegistrationViewModel : ObservableValidator
{
    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Required]
    [MinLength(2), MaxLength(100)]
    private string? name;

    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Required, EmailAddress]
    private string? email;

    [ObservableProperty]
    [NotifyDataErrorInfo]
    [Range(13, 120)]
    private int age;

    [RelayCommand]
    private void Submit()
    {
        ValidateAllProperties();
        if (HasErrors) return;
        // 提交...
    }
}
```

`[NotifyDataErrorInfo]` 會讓產生的 setter 在每次
成功設定後呼叫 `ValidateProperty(value)`，因此驗證會在
使用者輸入時執行。

---

## 手動 `SetProperty` 驗證

如果你是手動撰寫屬性而不是使用 `[ObservableProperty]`，
請透過 `bool validate` 參數加入驗證：

```csharp
[Required, MinLength(2), MaxLength(100)]
public string? Name
{
    get => name;
    set => SetProperty(ref name, value, validate: true);
}
```

---

## `TrySetProperty`

有時你只想在驗證成功時才設定屬性：

```csharp
[Required, EmailAddress]
public string? Email
{
    get => email;
    set
    {
        if (TrySetProperty(ref email, value, out IReadOnlyCollection<ValidationResult> errors))
        {
            // 值通過驗證；成功
        }
        else
        {
            // 檢查錯誤
        }
    }
}
```

---

## `ValidateAllProperties()`

強制對類型中每個具有至少一個
`ValidationAttribute` 的公用屬性進行驗證。在提交前呼叫：

```csharp
[RelayCommand(CanExecute = nameof(CanSubmit))]
private void Submit()
{
    ValidateAllProperties();
    if (HasErrors) return;
    submitter.Submit(this);
}

private bool CanSubmit() => !HasErrors;
```

搭配輸入欄位上的 `[NotifyCanExecuteChangedFor]`，以及
`ErrorsChanged` 的接聽程式 (或覆寫 `OnErrorsChanged`)，以在
使用者輸入時保持按鈕狀態同步。

---

## `ValidateProperty(value, propertyName)`

手動觸發單一屬性的驗證 — 當屬性 `A` 的驗證
取決於屬性 `B` 時非常有用：

```csharp
[Range(20, 80)]
[ObservableProperty]
private int b;

[Range(10, 100)]
[GreaterThan(nameof(B))]
[ObservableProperty]
private int a;

partial void OnBChanged(int value)
{
    // 重新執行 A 的驗證，因為它取決於 B。
    ValidateProperty(A, nameof(A));
}
```

---

## `ClearAllErrors()`

重設錯誤狀態 — 通常在成功提交後或重設
表單時使用：

```csharp
[RelayCommand]
private void Reset()
{
    Name = null;
    Email = null;
    Age = 0;
    ClearAllErrors();
}
```

---

## 自訂驗證方法 (`[CustomValidation]`)

```csharp
[Required, MinLength(3)]
[CustomValidation(typeof(RegistrationViewModel), nameof(ValidateUsername))]
[ObservableProperty]
private string? username;

public static ValidationResult ValidateUsername(string? value, ValidationContext context)
{
    var vm = (RegistrationViewModel)context.ObjectInstance;
    if (vm.userService.IsTaken(value!))
        return new ValidationResult("使用者名稱已被佔用。");
    return ValidationResult.Success!;
}
```

該方法必須是 `static` 並接受 `(value, ValidationContext)`。使用
`context.ObjectInstance` 以存取 ViewModel。

---

## 自訂 `ValidationAttribute`

對於可重複使用的規則，請建立 `ValidationAttribute` 的子類別：

```csharp
public sealed class GreaterThanAttribute(string otherPropertyName)
    : ValidationAttribute
{
    public string OtherPropertyName { get; } = otherPropertyName;

    protected override ValidationResult? IsValid(object? value, ValidationContext ctx)
    {
        var instance = ctx.ObjectInstance;
        var other = instance.GetType().GetProperty(OtherPropertyName)?.GetValue(instance);
        if (((IComparable)value!).CompareTo(other) > 0)
            return ValidationResult.Success;
        return new ValidationResult($"必須大於 {OtherPropertyName}。");
    }
}
```

套用至屬性：

```csharp
[Range(10, 100)]
[GreaterThan(nameof(B))]
[ObservableProperty]
private int a;
```

---

## 在檢視中讀取錯誤

`ObservableValidator` 實作了 `INotifyDataErrorInfo`。當 `ValidatesOnNotifyDataErrors=True` (WPF)
或透過控制項範本 (WinUI 3, MAUI) 時，XAML 堆疊會自動呈現
`ErrorsChanged`。要在程式碼中檢查錯誤：

```csharp
foreach (ValidationResult result in vm.GetErrors(nameof(vm.Name)))
{
    Console.WriteLine(result.ErrorMessage);
}

// 跨所有屬性
foreach (ValidationResult result in vm.GetErrors())
{
    Console.WriteLine(result.ErrorMessage);
}

bool any = vm.HasErrors;
```

訂閱變更：

```csharp
vm.ErrorsChanged += (s, e) =>
{
    Debug.WriteLine($"Errors changed for {e.PropertyName}");
};
```

---

## 提示

- 將 `ValidateAllProperties()` 與 `[NotifyCanExecuteChangedFor]` 結合使用，讓
  「提交」按鈕即時反映有效性狀態。
- 將驗證規則保留在 ViewModel 中 (或透過自訂屬性)，而不要
  放在模型中 — 模型應該是單純的 DTO。
- 對於網路或非同步驗證 (例如「使用者名稱是否已被佔用？」)，使用
  `[CustomValidation]` 呼叫非同步查閱的同步包裝函式
  (或者分開執行非同步檢查，並透過
  `AddError(propertyName, ...)` 樣式的協助程式呈現結果，如果你是自行撰寫的話)。
- `ObservableValidator` 無法同時繼承自 `ObservableRecipient` —
  如果你需要傳訊功能，請插入 `IMessenger` 並直接呼叫 `Send`。
