---
name: fluentui-blazor
description: >
  在 Blazor 應用程式中使用 Microsoft Fluent UI Blazor 元件庫
  (Microsoft.FluentUI.AspNetCore.Components NuGet 套件) 的指南。
  當使用者正在使用 Fluent UI 元件建構 Blazor 應用程式、設定該函式庫、
  使用 FluentUI 元件（如 FluentButton、FluentDataGrid、FluentDialog、
  FluentToast、FluentNavMenu、FluentTextField、FluentSelect、
  FluentAutocomplete、FluentDesignTheme）或任何以 "Fluent" 為字首的元件時使用。
  也可用於疑難排解缺少的提供者 (providers)、JS 互通 (interop) 問題或佈景主題設定。
---

# Fluent UI Blazor — 取用者使用指南 (Consumer Usage Guide)

此技能教導如何在 Blazor 應用程式中正確使用 **Microsoft.FluentUI.AspNetCore.Components**（版本 4）NuGet 套件。

## 關鍵規則 (Critical Rules)

### 1. 無須手動增加 `<script>` 或 `<link>` 標記

該函式庫會透過 Blazor 的靜態網頁構件和 JS 初始化程式自動載入所有 CSS 和 JS。**絕不要告訴使用者為核心函式庫增加 `<script>` 或 `<link>` 標記。**

### 2. 對於以服務為基礎的元件，提供者是強制的

必須將這些提供者元件 **務必** 增加到根配置（例如 `MainLayout.razor`），其對應的服務才能運作。若沒有它們，服務呼叫將 **靜默失敗**（無錯誤，無 UI）。

```razor
<FluentToastProvider />
<FluentDialogProvider />
<FluentMessageBarProvider />
<FluentTooltipProvider />
<FluentKeyCodeProvider />
```

### 3. Program.cs 中的服務註冊

```csharp
builder.Services.AddFluentUIComponents();

// 或使用設定：
builder.Services.AddFluentUIComponents(options =>
{
    options.UseTooltipServiceProvider = true;  // 預設值：true
    options.ServiceLifetime = ServiceLifetime.Scoped; // 預設值
});
```

**ServiceLifetime 規則：**
- `ServiceLifetime.Scoped` — 適用於 Blazor Server / 互動式 (預設值)
- `ServiceLifetime.Singleton` — 適用於獨立的 Blazor WebAssembly
- `ServiceLifetime.Transient` — **會擲回 `NotSupportedException`**

### 4. 圖示需要個別的 NuGet 套件

```
dotnet add package Microsoft.FluentUI.AspNetCore.Components.Icons
```

搭配 `@using` 別名的用法：

```razor
@using Icons = Microsoft.FluentUI.AspNetCore.Components.Icons

<FluentIcon Value="@(Icons.Regular.Size24.Save)" />
<FluentIcon Value="@(Icons.Filled.Size20.Delete)" Color="@Color.Error" />
```

模式：`Icons.[Variant].[Size].[Name]`
- 變體 (Variants)：`Regular`, `Filled`
- 大小 (Sizes)：`Size12`, `Size16`, `Size20`, `Size24`, `Size28`, `Size32`, `Size48`

自訂影像：`Icon.FromImageUrl("/path/to/image.png")`

**絕不要使用字串形式的圖示名稱** — 圖示是強型別類別。

### 5. 清單元件繫結模型

`FluentSelect<TOption>`、`FluentCombobox<TOption>`、`FluentListbox<TOption>` 和 `FluentAutocomplete<TOption>` 的運作方式與 `<InputSelect>` 不同。它們使用：

- `Items` — 資料源 (`IEnumerable<TOption>`)
- `OptionText` — 用於擷取顯示文字的 `Func<TOption, string?>`
- `OptionValue` — 用於擷取值字串的 `Func<TOption, string?>`
- `SelectedOption` / `SelectedOptionChanged` — 用於單選繫結
- `SelectedOptions` / `SelectedOptionsChanged` — 用於多選繫結

```razor
<FluentSelect Items="@countries"
              OptionText="@(c => c.Name)"
              OptionValue="@(c => c.Code)"
              @bind-SelectedOption="@selectedCountry"
              Label="國家" />
```

**不要** 像這樣（錯誤模式）：
```razor
@* 錯誤 — 不要使用 InputSelect 模式 *@
<FluentSelect @bind-Value="@selectedValue">
    <option value="1">一</option>
</FluentSelect>
```

### 6. FluentAutocomplete 特定事項

- 使用 `ValueText`（而非 `Value` — 已過時）作為搜尋輸入文字
- `OnOptionsSearch` 是用於篩選選項的必要回呼
- 預設值為 `Multiple="true"`

```razor
<FluentAutocomplete TOption="Person"
                    OnOptionsSearch="@OnSearch"
                    OptionText="@(p => p.FullName)"
                    @bind-SelectedOptions="@selectedPeople"
                    Label="搜尋人員" />

@code {
    private void OnSearch(OptionsSearchEventArgs<Person> args)
    {
        args.Items = allPeople.Where(p =>
            p.FullName.Contains(args.Text, StringComparison.OrdinalIgnoreCase));
    }
}
```

### 7. 對話方塊服務模式

**不要切換 `<FluentDialog>` 標記的可見性。** 服務模式如下：

1. 建立一個實作 `IDialogContentComponent<TData>` 的內容元件：

```csharp
public partial class EditPersonDialog : IDialogContentComponent<Person>
{
    [Parameter] public Person Content { get; set; } = default!;

    [CascadingParameter] public FluentDialog Dialog { get; set; } = default!;

    private async Task SaveAsync()
    {
        await Dialog.CloseAsync(Content);
    }

    private async Task CancelAsync()
    {
        await Dialog.CancelAsync();
    }
}
```

2. 透過 `IDialogService` 顯示對話方塊：

```csharp
[Inject] private IDialogService DialogService { get; set; } = default!;

private async Task ShowEditDialog()
{
    var dialog = await DialogService.ShowDialogAsync<EditPersonDialog, Person>(
        person,
        new DialogParameters
        {
            Title = "編輯人員",
            PrimaryAction = "儲存",
            SecondaryAction = "取消",
            Width = "500px",
            PreventDismissOnOverlayClick = true,
        });

    var result = await dialog.Result;
    if (!result.Cancelled)
    {
        var updatedPerson = result.Data as Person;
    }
}
```

對於便利對話方塊：
```csharp
await DialogService.ShowConfirmationAsync("您確定嗎？", "是", "否");
await DialogService.ShowSuccessAsync("完成！");
await DialogService.ShowErrorAsync("發生錯誤。");
```

### 8. 浮動通知 (Toast notifications)

```csharp
[Inject] private IToastService ToastService { get; set; } = default!;

ToastService.ShowSuccess("項目已成功儲存");
ToastService.ShowError("儲存失敗");
ToastService.ShowWarning("請檢查您的輸入");
ToastService.ShowInfo("有新更新可用");
```

`FluentToastProvider` 參數：`Position`（預設值 `TopRight`）、`Timeout`（預設值 7000ms）、`MaxToastCount`（預設值 4）。

### 9. 設計權杖和佈景主題僅在轉譯後生效

設計權杖 (Design tokens) 依賴 JS 互通。**絕不要在 `OnInitialized` 中設定它們** — 請使用 `OnAfterRenderAsync`。

```razor
<FluentDesignTheme Mode="DesignThemeModes.System"
                   OfficeColor="OfficeColor.Teams"
                   StorageName="mytheme" />
```

### 10. FluentEditForm vs EditForm

只有在 `FluentWizard` 步驟內（每步驗證）才需要 `FluentEditForm`。對於一般表單，請搭配 Fluent 表單元件使用標準的 `EditForm`：

```razor
<EditForm Model="@model" OnValidSubmit="HandleSubmit">
    <DataAnnotationsValidator />
    <FluentTextField @bind-Value="@model.Name" Label="姓名" Required />
    <FluentSelect Items="@options"
                  OptionText="@(o => o.Label)"
                  @bind-SelectedOption="@model.Category"
                  Label="類別" />
    <FluentValidationSummary />
    <FluentButton Type="ButtonType.Submit" Appearance="Appearance.Accent">儲存</FluentButton>
</EditForm>
```

請使用 `FluentValidationMessage` 和 `FluentValidationSummary` 取代標準 Blazor 驗證元件，以符合 Fluent 風格。

## 參考檔案 (Reference files)

如需特定主題的詳細指南，請參閱：

- [安裝與設定](references/SETUP.md)
- [配置與導覽](references/LAYOUT-AND-NAVIGATION.md)
- [資料方格](references/DATAGRID.md)
- [佈景主題設定](references/THEMING.md)
