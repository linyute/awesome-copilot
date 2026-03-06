# 佈景主題設定 (Theming)

## FluentDesignTheme（建議使用） (FluentDesignTheme (recommended))

主要的佈景主題設定元件。請將其放在應用程式的根目錄。

```razor
<FluentDesignTheme Mode="DesignThemeModes.System"
                   OfficeColor="OfficeColor.Teams"
                   StorageName="mytheme" />
```

### 參數 (Parameters)

| 參數 | 類型 | 預設值 | 說明 |
|---|---|---|---|
| `Mode` | `DesignThemeModes` | `System` | `Light`、`Dark` 或 `System`（遵循作業系統） |
| `CustomColor` | `string?` | null | 十六進位強調色（例如 `"#0078D4"`） |
| `OfficeColor` | `OfficeColor?` | null | 預設強調色：`Teams`、`Word`、`Excel`、`PowerPoint`、`Outlook`、`OneNote` |
| `NeutralBaseColor` | `string?` | null | 中性色盤基礎十六進位顏色 |
| `StorageName` | `string?` | null | 將佈景主題以該鍵值保存到 localStorage |
| `Direction` | `LocalizationDirection?` | null | `Ltr` 或 `Rtl` |
| `OnLuminanceChanged` | `EventCallback<LuminanceChangedEventArgs>` | | 當深色/淺色模式變更時觸發 |
| `OnLoaded` | `EventCallback<LoadedEventArgs>` | | 從儲存空間載入佈景主題時觸發 |

### 雙向繫結 (Two-way binding)

```razor
<FluentDesignTheme @bind-Mode="@themeMode"
                   @bind-OfficeColor="@officeColor"
                   @bind-CustomColor="@customColor"
                   StorageName="mytheme" />

<FluentSelect Items="@(Enum.GetValues<DesignThemeModes>())"
              @bind-SelectedOption="@themeMode"
              OptionText="@(m => m.ToString())" />

@code {
    private DesignThemeModes themeMode = DesignThemeModes.System;
    private OfficeColor? officeColor = OfficeColor.Teams;
    private string? customColor;
}
```

### 重要：JS 互通相依性 (Important: JS interop dependency)

`FluentDesignTheme` 內部使用 JavaScript 互通。它 **無法** 在伺服器端預先轉譯 (pre-rendering) 期間運作。如果您需要對佈景主題變更做出反應：

```csharp
// 請使用 OnAfterRenderAsync，而非 OnInitialized
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // 此處可安全地與設計權杖互動
    }
}
```

## FluentDesignSystemProvider（進階） (FluentDesignSystemProvider (advanced))

用於將設計權杖限定在元件樹的某個子樹範圍內。提供 50 多個 CSS 自訂屬性。

```razor
<FluentDesignSystemProvider AccentBaseColor="#0078D4"
                            NeutralBaseColor="#808080"
                            BaseLayerLuminance="0.95">
    <FluentButton Appearance="Appearance.Accent">套用主題的按鈕</FluentButton>
</FluentDesignSystemProvider>
```

## 設計權杖類別（以 DI 為基礎，進階） (Design Token Classes (DI-based, advanced))

用於透過相依性插入 (Dependency Injection) 進行程式化權杖控制。每個權杖都是一個產生的服務。

```csharp
@inject AccentBaseColor AccentBaseColor

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // 為特定元素設定權杖
        await AccentBaseColor.SetValueFor(myElement, "#FF0000".ToSwatch());

        // 讀取權杖值
        var currentColor = await AccentBaseColor.GetValueFor(myElement);

        // 移除覆寫
        await AccentBaseColor.DeleteValueFor(myElement);
    }
}
```

## 可用的 DesignThemeModes (Available DesignThemeModes)

- `DesignThemeModes.Light` — 淺色主題
- `DesignThemeModes.Dark` — 深色主題
- `DesignThemeModes.System` — 遵循作業系統偏好

## 可用的 OfficeColor 預設值 (Available OfficeColor presets)

`Teams`、`Word`、`Excel`、`PowerPoint`、`Outlook`、`OneNote`、`Loop`、`Planner`、`SharePoint`、`Stream`、`Sway`、`Viva`、`VivaEngage`、`VivaInsights`、`VivaLearning`、`VivaTopics`。
