# 安裝與設定 (Setup and Configuration)

## NuGet 套件 (NuGet Packages)

| 套件 | 目的 |
|---|---|
| `Microsoft.FluentUI.AspNetCore.Components` | 核心元件庫（必要） |
| `Microsoft.FluentUI.AspNetCore.Components.Icons` | 圖示套件（選用，建議安裝） |
| `Microsoft.FluentUI.AspNetCore.Components.Emojis` | 表情符號套件（選用） |
| `Microsoft.FluentUI.AspNetCore.Components.DataGrid.EntityFrameworkAdapter` | 適用於 DataGrid 的 EF Core 配接器（選用） |
| `Microsoft.FluentUI.AspNetCore.Components.DataGrid.ODataAdapter` | 適用於 DataGrid 的 OData 配接器（選用） |

## Program.cs 註冊 (Program.cs Registration)

```csharp
builder.Services.AddFluentUIComponents();
```

### 設定選項 (LibraryConfiguration) (Configuration Options (LibraryConfiguration))

| 屬性 | 類型 | 預設值 | 備註 |
|---|---|---|---|
| `UseTooltipServiceProvider` | `bool` | `true` | 註冊 `ITooltipService`。若為 true，您 **必須** 將 `<FluentTooltipProvider>` 增加至配置中 |
| `RequiredLabel` | `MarkupString` | 紅色 `*` | 必填欄位指示器的自訂標記 |
| `HideTooltipOnCursorLeave` | `bool` | `false` | 當游標離開錨點和工具提示時關閉工具提示 |
| `ServiceLifetime` | `ServiceLifetime` | `Scoped` | 僅限 `Scoped` 或 `Singleton`。`Transient` 會擲回例外！ |
| `ValidateClassNames` | `bool` | `true` | 根據 `^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$` 驗證 CSS 類別名稱 |
| `CollocatedJavaScriptQueryString` | `Func<string, string>?` | `v={version}` | JS 檔案的快取清除 (Cache-busting) |

### 依裝載模型劃分的 ServiceLifetime (ServiceLifetime by hosting model)

| 裝載模型 | ServiceLifetime |
|---|---|
| Blazor Server | `Scoped` (預設值) |
| Blazor WebAssembly 獨立式 | `Singleton` |
| Blazor Web App (互動式) | `Scoped` (預設值) |
| Blazor Hybrid (MAUI) | `Singleton` |

## MainLayout.razor 範本 (MainLayout.razor Template)

```razor
@inherits LayoutComponentBase

<FluentLayout>
    <FluentHeader Height="50">
        我的應用程式
    </FluentHeader>

    <FluentStack Orientation="Orientation.Horizontal" HorizontalGap="0" Style="height: 100%;">
        <FluentNavMenu Width="250" Collapsible="true" Title="導覽">
            <FluentNavLink Href="/" Icon="@(Icons.Regular.Size20.Home)" Match="NavLinkMatch.All">首頁</FluentNavLink>
            <FluentNavLink Href="/counter" Icon="@(Icons.Regular.Size20.NumberSymbol)">計數器</FluentNavLink>
            <FluentNavGroup Title="設定" Icon="@(Icons.Regular.Size20.Settings)">
                <FluentNavLink Href="/settings/general">一般</FluentNavLink>
                <FluentNavLink Href="/settings/profile">個人檔案</FluentNavLink>
            </FluentNavGroup>
        </FluentNavMenu>

        <FluentBodyContent>
            <FluentStack Orientation="Orientation.Vertical" Style="padding: 1rem;">
                @Body
            </FluentStack>
        </FluentBodyContent>
    </FluentStack>
</FluentLayout>

@* 必要提供者 — 請放置在 FluentLayout 之後 *@
<FluentToastProvider />
<FluentDialogProvider />
<FluentMessageBarProvider />
<FluentTooltipProvider />
<FluentKeyCodeProvider />

@* 佈景主題 — 請放置在根目錄 *@
<FluentDesignTheme Mode="DesignThemeModes.System"
                   OfficeColor="OfficeColor.Teams"
                   StorageName="mytheme" />
```

或使用便利元件：

```razor
<FluentMainLayout Header="@header"
                  NavMenuContent="@navMenu"
                  Body="@body"
                  HeaderHeight="50"
                  NavMenuWidth="250"
                  NavMenuTitle="導覽" />

@code {
    private RenderFragment header = @<span>我的應用程式</span>;
    private RenderFragment navMenu = @<div>
        <FluentNavLink Href="/">首頁</FluentNavLink>
    </div>;
    private RenderFragment body = @<div>@Body</div>;
}
```

## _Imports.razor

將此內容增加至您的 `_Imports.razor`：

```razor
@using Microsoft.FluentUI.AspNetCore.Components
@using Icons = Microsoft.FluentUI.AspNetCore.Components.Icons
```

## 靜態網頁構件 (Static Web Assets)

無須手動增加 `<link>` 或 `<script>` 標記。該函式庫使用：
- **CSS**：`reboot.css` (標準化) + 元件範圍內的 CSS — 透過靜態網頁構件自動載入
- **JS**：`lib.module.js` — 透過 Blazor 的 JS 初始化程式系統自動載入
- 特定元件的 JS（例如 DataGrid, Autocomplete） — 視需要延遲載入

所有內容皆由 `_content/Microsoft.FluentUI.AspNetCore.Components/` 提供。

## 註冊的服務 (Services Registered)

由 `AddFluentUIComponents()` 自動註冊的服務：

| 服務 | 實作 | 目的 |
|---|---|---|
| `GlobalState` | `GlobalState` | 共用的應用程式狀態 |
| `IToastService` | `ToastService` | 浮動通知（需要 `FluentToastProvider`） |
| `IDialogService` | `DialogService` | 對話方塊和面板（需要 `FluentDialogProvider`） |
| `IMessageService` | `MessageService` | 訊息列（需要 `FluentMessageBarProvider`） |
| `IKeyCodeService` | `KeyCodeService` | 鍵盤快速鍵（需要 `FluentKeyCodeProvider`） |
| `IMenuService` | `MenuService` | 快顯功能表 |
| `ITooltipService` | `TooltipService` | 工具提示（需要 `FluentTooltipProvider`，需透過 `UseTooltipServiceProvider` 加入） |
