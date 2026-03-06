# 配置與導覽 (Layout and Navigation)

## 配置元件 (Layout Components)

### FluentLayout

根配置容器。用作最外層的結構元件。

```razor
<FluentLayout Orientation="Orientation.Vertical">
    <FluentHeader>...</FluentHeader>
    <FluentBodyContent>...</FluentBodyContent>
    <FluentFooter>...</FluentFooter>
</FluentLayout>
```

### FluentHeader / FluentFooter

`FluentLayout` 內部的固定標題和頁尾區段。

```razor
<FluentHeader Height="50">
    <FluentStack Orientation="Orientation.Horizontal" HorizontalAlignment="HorizontalAlignment.SpaceBetween">
        <span>應用程式標題</span>
        <FluentButton>設定</FluentButton>
    </FluentStack>
</FluentHeader>
```

### FluentBodyContent

`FluentLayout` 內部的主要可捲動內容區域。

### FluentStack

用於水平或垂直配置的 Flexbox 容器。

```razor
<FluentStack Orientation="Orientation.Horizontal"
             HorizontalGap="10"
             VerticalGap="10"
             HorizontalAlignment="HorizontalAlignment.Center"
             VerticalAlignment="VerticalAlignment.Center"
             Wrap="true"
             Width="100%">
    <FluentButton>一</FluentButton>
    <FluentButton>二</FluentButton>
</FluentStack>
```

參數：`Orientation`、`HorizontalGap`、`VerticalGap`、`HorizontalAlignment`、`VerticalAlignment`、`Wrap`、`Width`。

### FluentGrid / FluentGridItem

12 欄回應式網格系統。

```razor
<FluentGrid Spacing="3" Justify="JustifyContent.Center" AdaptiveRendering="true">
    <FluentGridItem xs="12" sm="6" md="4" lg="3">
        卡片 1
    </FluentGridItem>
    <FluentGridItem xs="12" sm="6" md="4" lg="3">
        卡片 2
    </FluentGridItem>
</FluentGrid>
```

大小參數（`xs`、`sm`、`md`、`lg`、`xl`、`xxl`）代表 12 欄中的佔用欄數。使用 `AdaptiveRendering="true"` 隱藏放不下的項目。

### FluentMainLayout (便利元件)

預先組合的配置，包含標題、導覽功能表和內容區域。

```razor
<FluentMainLayout Header="@header"
                  SubHeader="@subheader"
                  NavMenuContent="@navMenu"
                  Body="@body"
                  HeaderHeight="50"
                  NavMenuWidth="250"
                  NavMenuTitle="導覽" />
```

## 導覽元件 (Navigation Components)

### FluentNavMenu

支援鍵盤動作的可收合導覽功能表。

```razor
<FluentNavMenu Width="250"
               Collapsible="true"
               @bind-Expanded="@menuExpanded"
               Title="主導覽"
               CollapsedChildNavigation="true"
               Margin="4px 0">
    <FluentNavLink Href="/" Icon="@(Icons.Regular.Size20.Home)" Match="NavLinkMatch.All">
        首頁
    </FluentNavLink>
    <FluentNavLink Href="/counter" Icon="@(Icons.Regular.Size20.NumberSymbol)">
        計數器
    </FluentNavLink>
    <FluentNavGroup Title="系統管理" Icon="@(Icons.Regular.Size20.Shield)" @bind-Expanded="@adminExpanded">
        <FluentNavLink Href="/admin/users">使用者</FluentNavLink>
        <FluentNavLink Href="/admin/roles">角色</FluentNavLink>
    </FluentNavGroup>
</FluentNavMenu>
```

關鍵參數：
- `Width` — 以像素為單位的寬度（收合時為 40px）
- `Collapsible` — 啟用展開/收合切換
- `Expanded` / `ExpandedChanged` — 可繫結的收合狀態
- `CollapsedChildNavigation` — 收合時顯示群組的彈出功能表
- `CustomToggle` — 用於行動裝置漢堡按鈕模式
- `Title` — 用於無障礙功能的 aria-label

### FluentNavGroup

導覽功能表內部的可展開群組。

```razor
<FluentNavGroup Title="設定"
                Icon="@(Icons.Regular.Size20.Settings)"
                @bind-Expanded="@settingsExpanded"
                Gap="2">
    <FluentNavLink Href="/settings/general">一般</FluentNavLink>
    <FluentNavLink Href="/settings/profile">個人檔案</FluentNavLink>
</FluentNavGroup>
```

參數：`Title`、`Expanded`/`ExpandedChanged`、`Icon`、`IconColor`、`HideExpander`、`Gap`、`MaxHeight`、`TitleTemplate`。

### FluentNavLink

具有作用中狀態追蹤的導覽連結。

```razor
<FluentNavLink Href="/page"
               Icon="@(Icons.Regular.Size20.Document)"
               Match="NavLinkMatch.Prefix"
               Target="_blank"
               Disabled="false">
    頁面標題
</FluentNavLink>
```

參數：`Href`、`Target`、`Match`（預設為 `NavLinkMatch.Prefix` 或 `All`）、`ActiveClass`、`Icon`、`IconColor`、`Disabled`、`Tooltip`。

所有導覽元件皆繼承自 `FluentNavBase`，其提供：`Icon`、`IconColor`、`CustomColor`、`Disabled`、`Tooltip`。

### FluentBreadcrumb / FluentBreadcrumbItem

```razor
<FluentBreadcrumb>
    <FluentBreadcrumbItem Href="/">首頁</FluentBreadcrumbItem>
    <FluentBreadcrumbItem Href="/products">產品</FluentBreadcrumbItem>
    <FluentBreadcrumbItem>目前頁面</FluentBreadcrumbItem>
</FluentBreadcrumb>
```

### FluentTab / FluentTabs

```razor
<FluentTabs @bind-ActiveTabId="@activeTab">
    <FluentTab Id="tab1" Label="詳細資訊">
        詳細內容
    </FluentTab>
    <FluentTab Id="tab2" Label="記錄">
        歷史內容
    </FluentTab>
</FluentTabs>
```
