# FluentDataGrid

`FluentDataGrid<TGridItem>` 是一個用於顯示表格式資料的強型別泛型元件。

## 基本用法 (Basic Usage)

```razor
<FluentDataGrid Items="@people" TGridItem="Person">
    <PropertyColumn Property="@(p => p.Name)" Sortable="true" />
    <PropertyColumn Property="@(p => p.Email)" />
    <PropertyColumn Property="@(p => p.BirthDate)" Format="yyyy-MM-dd" />
    <TemplateColumn Title="動作">
        <FluentButton OnClick="@(() => Edit(context))">編輯</FluentButton>
    </TemplateColumn>
</FluentDataGrid>
```

**關鍵點**：資料欄 (Columns) 是子元件，而非屬性。請在 grid 內使用 `PropertyColumn`、`TemplateColumn` 和 `SelectColumn`。

## 資料欄類型 (Column Types)

### PropertyColumn

繫結到屬性運算式。自動從屬性名稱或 `[Display]` 屬性衍生標題。

```razor
<PropertyColumn Property="@(p => p.Name)" Sortable="true" />
<PropertyColumn Property="@(p => p.Price)" Format="C2" Title="單價" />
<PropertyColumn Property="@(p => p.Category)" Comparer="@StringComparer.OrdinalIgnoreCase" />
```

參數：`Property`（必要）、`Format`、`Title`、`Sortable`、`SortBy`、`Comparer`、`IsDefaultSortColumn`、`InitialSortDirection`、`Class`、`Tooltip`。

### TemplateColumn

透過轉譯片段進行完整的自訂轉譯。`context` 是 `TGridItem`。

```razor
<TemplateColumn Title="狀態" SortBy="@statusSort">
    <FluentBadge Appearance="Appearance.Accent"
                 BackgroundColor="@(context.IsActive ? "green" : "red")">
        @(context.IsActive ? "活躍" : "非活躍")
    </FluentBadge>
</TemplateColumn>
```

### SelectColumn

核取方塊選取欄。

```razor
<SelectColumn TGridItem="Person"
              SelectMode="DataGridSelectMode.Multiple"
              @bind-SelectedItems="@selectedPeople" />
```

模式：`DataGridSelectMode.Single`、`DataGridSelectMode.Multiple`。

## 資料源 (Data Sources)

兩種互斥的方法：

### 記憶體內 (IQueryable) (In-memory (IQueryable))

```razor
<FluentDataGrid Items="@people.AsQueryable()" TGridItem="Person">
    ...
</FluentDataGrid>
```

### 伺服器端 / 自訂 (ItemsProvider) (Server-side / Custom (ItemsProvider))

```razor
<FluentDataGrid ItemsProvider="@peopleProvider" TGridItem="Person">
    ...
</FluentDataGrid>

@code {
    private GridItemsProvider<Person> peopleProvider = async request =>
    {
        var result = await PeopleService.GetPeopleAsync(
            request.StartIndex,
            request.Count ?? 50,
            request.GetSortByProperties().FirstOrDefault());

        return GridItemsProviderResult.From(result.Items, result.TotalCount);
    };
}
```

### EF Core 配接器 (EF Core Adapter)

```csharp
// Program.cs
builder.Services.AddDataGridEntityFrameworkAdapter();
```

```razor
<FluentDataGrid Items="@dbContext.People" TGridItem="Person">
    ...
</FluentDataGrid>
```

## 分頁 (Pagination)

```razor
<FluentDataGrid Items="@people" Pagination="@pagination" TGridItem="Person">
    ...
</FluentDataGrid>

<FluentPaginator State="@pagination" />

@code {
    private PaginationState pagination = new() { ItemsPerPage = 10 };
}
```

## 虛擬化 (Virtualization)

對於大型資料集，請啟用虛擬化：

```razor
<FluentDataGrid Items="@people" Virtualize="true" ItemSize="46" TGridItem="Person">
    ...
</FluentDataGrid>
```

`ItemSize` 是以像素為單位的預估資料列高度（預設值各異）。對於捲動位置計算非常重要。

## 關鍵參數 (Key Parameters)

| 參數 | 類型 | 說明 |
|---|---|---|
| `Items` | `IQueryable<TGridItem>?` | 記憶體內資料源 |
| `ItemsProvider` | `GridItemsProvider<TGridItem>?` | 非同步資料提供者 |
| `Pagination` | `PaginationState?` | 分頁狀態 |
| `Virtualize` | `bool` | 啟用虛擬化 |
| `ItemSize` | `float` | 預估資料列高度 (px) |
| `ItemKey` | `Func<TGridItem, object>?` | 用於 `@key` 的穩定鍵值 |
| `ResizableColumns` | `bool` | 啟用資料欄大小調整 |
| `HeaderCellAsButtonWithMenu` | `bool` | 可排序的標題 UI |
| `GridTemplateColumns` | `string?` | CSS grid-template-columns |
| `Loading` | `bool` | 顯示載入指示器 |
| `ShowHover` | `bool` | 暫留時醒目提示資料列 |
| `OnRowClick` | `EventCallback<FluentDataGridRow<TGridItem>>` | 資料列點擊處理常式 |
| `OnRowDoubleClick` | `EventCallback<FluentDataGridRow<TGridItem>>` | 資料列連按兩下處理常式 |
| `OnRowFocus` | `EventCallback<FluentDataGridRow<TGridItem>>` | 資料列聚焦處理常式 |

## 排序 (Sorting)

```razor
<PropertyColumn Property="@(p => p.Name)" Sortable="true" IsDefaultSortColumn="true"
                InitialSortDirection="SortDirection.Ascending" />
```

或使用自訂排序：

```razor
<TemplateColumn Title="全名" SortBy="@(GridSort<Person>.ByAscending(p => p.LastName).ThenAscending(p => p.FirstName))">
    @context.LastName, @context.FirstName
</TemplateColumn>
```
