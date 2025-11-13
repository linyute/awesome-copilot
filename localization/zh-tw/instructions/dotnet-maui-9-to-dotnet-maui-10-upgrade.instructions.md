---
description: '指示，用於將 .NET MAUI 應用程式從版本 9 升級到版本 10，包括重大變更、已棄用的 API 和 ListView 到 CollectionView 的遷移策略。'
applyTo: '**/*.csproj, **/*.cs, **/*.xaml'
---

# 從 .NET MAUI 9 升級到 .NET MAUI 10

本指南協助您將 .NET MAUI 應用程式從 .NET 9 升級到 .NET 10，重點關注需要程式碼更新的重大變更和已棄用的 API。

---

## 目錄

1. [快速入門](#quick-start)
2. [更新目標框架](#update-target-framework)
3. [重大變更 (P0 - 必須修正)](#breaking-changes-p0---must-fix)
   - [MessagingCenter 改為內部](#messagingcenter-made-internal)
   - [ListView 和 TableView 已棄用](#listview-and-tableview-deprecated)
4. [已棄用的 API (P1 - 應盡快修正)](#deprecated-apis-p1---fix-soon)
5. [建議的變更 (P2)](#recommended-changes-p2)
6. [大量遷移工具](#bulk-migration-tools)
7. [測試您的升級](#testing-your-upgrade)
8. [疑難排解](#troubleshooting)

---

## 快速入門

**五步驟升級流程：**

1. **更新 TargetFramework** 至 `net10.0`
2. **更新 CommunityToolkit.Maui** 至 12.3.0 或更高版本（如果您使用它）- 必要
3. **修正重大變更** - MessagingCenter (P0)
4. **遷移 ListView/TableView 至 CollectionView** (P0 - 關鍵)
5. **修正已棄用的 API** - 動畫方法、DisplayAlert、IsBusy (P1)

> ⚠️ **重大變更**：
> - CommunityToolkit.Maui **必須**為 12.3.0 或更高版本
> - ListView 和 TableView 現已廢棄（最耗時的遷移工作）

---

## 更新目標框架

### 單一平台

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>
```

### 多平台

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net10.0-android;net10.0-ios;net10.0-maccatalyst;net10.0-windows10.0.19041.0</TargetFrameworks>
  </PropertyGroup>
</Project>
```

### 選用：Linux 相容性 (GitHub Copilot, WSL 等)

> 💡 **適用於 Linux 開發**：如果您在 Linux 上建置（例如 GitHub Codespaces, WSL 或使用 GitHub Copilot），可以透過條件式排除 iOS/Mac Catalyst 目標來讓您的專案在 Linux 上編譯：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- 從 Android 開始 (始終支援) -->
    <TargetFrameworks>net10.0-android</TargetFrameworks>
    
    <!-- 僅在不在 Linux 上時新增 iOS/Mac Catalyst -->
    <TargetFrameworks Condition="!$([MSBuild]::IsOSPlatform('linux'))">$(TargetFrameworks);net10.0-ios;net10.0-maccatalyst</TargetFrameworks>
    
    <!-- 僅在 Windows 上新增 Windows -->
    <TargetFrameworks Condition="$([MSBuild]::IsOSPlatform('windows'))">$(TargetFrameworks);net10.0-windows10.0.19041.0</TargetFrameworks>
  </PropertyGroup>
</Project>
```

**優點：**
- ✅ 在 Linux 上成功編譯（無需 iOS/Mac 工具）
- ✅ 可與 GitHub Codespaces 和 Copilot 搭配使用
- ✅ 根據建置 OS 自動包含正確的目標
- ✅ 切換作業系統環境時無需變更

**參考：** [dotnet/maui#32186](https://github.com/dotnet/maui/pull/32186)

### 更新必要的 NuGet 套件

> ⚠️ **關鍵**：如果您使用 CommunityToolkit.Maui，則**必須**更新至 12.3.0 或更高版本。早期版本與 .NET 10 不相容，並會導致編譯錯誤。

```bash
# 更新 CommunityToolkit.Maui (如果您使用它)
dotnet add package CommunityToolkit.Maui --version 12.3.0

# 將其他常用套件更新為 .NET 10 相容版本
dotnet add package Microsoft.Maui.Controls --version 10.0.0
```

**檢查您的所有 NuGet 套件：**
```bash
# 列出所有套件並檢查更新
dotnet list package --outdated

# 將所有套件更新為最新相容版本
dotnet list package --outdated | grep ">" | cut -d '>' -f 1 | xargs -I {} dotnet add package {}
```

---

## 重大變更 (P0 - 必須修正)

### MessagingCenter 改為內部

**狀態：** 🚨 **重大變更** - `MessagingCenter` 現已設為 `internal`，無法存取。

**您將看到的錯誤：**
```
error CS0122: 'MessagingCenter' is inaccessible due to its protection level
```

**所需遷移：**

#### 步驟 1：安裝 CommunityToolkit.Mvvm

```bash
dotnet add package CommunityToolkit.Mvvm --version 8.3.0
```

#### 步驟 2：定義訊息類別

```csharp
// 舊版：無需訊息類別
MessagingCenter.Send(this, "UserLoggedIn", userData);

// 新版：建立訊息類別
public class UserLoggedInMessage
{
    public UserData Data { get; set; }
    
    public UserLoggedInMessage(UserData data)
    {
        Data = data;
    }
}
```

#### 步驟 3：更新 Send 呼叫

```csharp
// ❌ 舊版 (在 .NET 10 中已損壞)
using Microsoft.Maui.Controls;

MessagingCenter.Send(this, "UserLoggedIn", userData);
MessagingCenter.Send<App, string>(this, "StatusChanged", "Active");

// ✅ 新版 (必要)
using CommunityToolkit.Mvvm.Messaging;

WeakReferenceMessenger.Default.Send(new UserLoggedInMessage(userData));
WeakReferenceMessenger.Default.Send(new StatusChangedMessage("Active"));
```

#### 步驟 4：更新 Subscribe 呼叫

```csharp
// ❌ 舊版 (在 .NET 10 中已損壞)
MessagingCenter.Subscribe<App, UserData>(this, "UserLoggedIn", (sender, data) =>
{
    // 處理訊息
    CurrentUser = data;
});

// ✅ 新版 (必要)
WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, (recipient, message) =>
{
    // 處理訊息
    CurrentUser = message.Data;
});
```

#### ⚠️ 重要行為差異：重複訂閱

**WeakReferenceMessenger** 在您嘗試對同一接收者多次註冊相同訊息類型時，會擲出 `InvalidOperationException`（MessagingCenter 允許這樣做）：

```csharp
// ❌ 這會在 WeakReferenceMessenger 中擲出 InvalidOperationException
WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, (r, m) => Handler1(m));
WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, (r, m) => Handler2(m)); // ❌ 擲出！

// ✅ 解決方案 1：在重新註冊前取消註冊
WeakReferenceMessenger.Default.Unregister<UserLoggedInMessage>(this);
WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, (r, m) => Handler1(m));

// ✅ 解決方案 2：在一次註冊中處理多個動作
WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, (r, m) => 
{
    Handler1(m);
    Handler2(m);
});
```

**為何這很重要：** 如果您的程式碼在多個地方訂閱相同的訊息（例如，在頁面建構函式和 `OnAppearing` 中），您將會遇到執行階段崩潰。

#### 步驟 5：完成時取消註冊

```csharp
// ❌ 舊版
MessagingCenter.Unsubscribe<App, UserData>(this, "UserLoggedIn");

// ✅ 新版 (關鍵 - 防止記憶體洩漏)
WeakReferenceMessenger.Default.Unregister<UserLoggedInMessage>(this);

// 或取消此接收者的所有訊息
WeakReferenceMessenger.Default.UnregisterAll(this);
```

#### 完成前後範例

**之前 (.NET 9)：**
```csharp
// 傳送者
public class LoginViewModel
{
    public async Task LoginAsync()
    {
        var user = await AuthService.LoginAsync(username, password);
        MessagingCenter.Send(this, "UserLoggedIn", user);
    }
}

// 接收者
public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        
        MessagingCenter.Subscribe<LoginViewModel, User>(this, "UserLoggedIn", (sender, user) =>
        {
            WelcomeLabel.Text = $"歡迎，{user.Name}！";
        });
    }
    
    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        MessagingCenter.Unsubscribe<LoginViewModel, User>(this, "UserLoggedIn");
    }
}
```

**之後 (.NET 10)：**
```csharp
// 1. 定義訊息
public class UserLoggedInMessage
{
    public User User { get; }
    
    public UserLoggedInMessage(User user)
    {
        User = user;
    }
}

// 2. 傳送者
public class LoginViewModel
{
    public async Task LoginAsync()
    {
        var user = await AuthService.LoginAsync(username, password);
        WeakReferenceMessenger.Default.Send(new UserLoggedInMessage(user));
    }
}

// 3. 接收者
public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        
        WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, (recipient, message) =>
        {
            WelcomeLabel.Text = $"歡迎，{message.User.Name}！";
        });
    }
    
    protected override void OnDisappearing()
    {
        base.OnDisappearing();
        WeakReferenceMessenger.Default.UnregisterAll(this);
    }
}
```

**主要差異：**
- ✅ 類型安全的訊息類別
- ✅ 無魔術字串
- ✅ 更佳的 IntelliSense 支援
- ✅ 更易於重構
- ⚠️ **必須記得取消註冊！**

---

### ListView 和 TableView 已棄用

**狀態：** 🚨 **已棄用 (P0)** - `ListView`、`TableView` 和所有 `Cell` 類型現已廢棄。請遷移到 `CollectionView`。

**您將看到的警告：**
```
warning CS0618: 'ListView' is obsolete: 'ListView is deprecated. Please use CollectionView instead.'
warning CS0618: 'TableView' is obsolete: 'Please use CollectionView instead.'
warning CS0618: 'TextCell' is obsolete: 'The controls which use TextCell (ListView and TableView) are obsolete. Please use CollectionView instead.'
```

**已棄用的類型：**
- `ListView` → `CollectionView`
- `TableView` → `CollectionView`（對於設定頁面，請考慮使用帶有 `BindableLayout` 的垂直 `StackLayout`）
- `TextCell` → 具有 `Label`(s) 的自訂 `DataTemplate`
- `ImageCell` → 具有 `Image` + `Label`(s) 的自訂 `DataTemplate`
- `EntryCell` → 自訂 `Entry` 的 `DataTemplate`
- `SwitchCell` → 自訂 `Switch` 的 `DataTemplate`
- `ViewCell` → `DataTemplate`

**影響：** 這是一個**重大**的破壞性變更。`ListView` 和 `TableView` 是 MAUI 應用程式中最常用的控制項之一。

#### 為何這需要時間

將 `ListView`/`TableView` 轉換為 `CollectionView` 並非簡單的尋找替換：

1. **不同的事件模型** - `ItemSelected` → `SelectionChanged`，參數不同
2. **不同的分組** - `GroupDisplayBinding` 不再存在
3. **內容動作** - 必須轉換為 `SwipeView`
4. **項目大小** - `HasUnevenRows` 的處理方式不同
5. **特定平台的程式碼** - 需要移除 iOS/Android 的 ListView 平台組態
6. **需要測試** - `CollectionView` 的虛擬化方式不同，可能會影響效能

#### 遷移策略

**步驟 1：盤點您的 ListView**

```bash
# 尋找所有 ListView/TableView 的用法
grep -r "ListView\|TableView" --include="*.xaml" --include="*.cs" .
```

**步驟 2：基本 ListView → CollectionView**

**之前 (ListView)：**
```xaml
<ListView ItemsSource="{Binding Items}"
          ItemSelected="OnItemSelected"
          HasUnevenRows="True">
    <ListView.ItemTemplate>
        <DataTemplate>
            <TextCell Text="{Binding Title}"
                     Detail="{Binding Description}" />
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>
```

**之後 (CollectionView)：**
```xaml
<CollectionView ItemsSource="{Binding Items}"
                SelectionMode="Single"
                SelectionChanged="OnSelectionChanged">
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <VerticalStackLayout Padding="10">
                <Label Text="{Binding Title}" 
                       FontAttributes="Bold" />
                <Label Text="{Binding Description}"
                       FontSize="12"
                       TextColor="{StaticResource Gray600}" />
            </VerticalStackLayout>
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```

> ⚠️ **注意：** `CollectionView` 預設具有 `SelectionMode="None"`（停用選取）。您必須明確設定 `SelectionMode="Single"` 或 `SelectionMode="Multiple"` 來啟用選取。

**程式碼後置變更：**
```csharp
// ❌ 舊版 (ListView)
void OnItemSelected(object sender, SelectedItemChangedEventArgs e)
{
    if (e.SelectedItem == null)
        return;
        
    var item = (MyItem)e.SelectedItem;
    // 處理選取
    
    // 取消選取
    ((ListView)sender).SelectedItem = null;
}

// ✅ 新版 (CollectionView)
void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
{
    if (e.CurrentSelection.Count == 0)
        return;
        
    var item = (MyItem)e.CurrentSelection.FirstOrDefault();
    // 處理選取
    
    // 取消選取 (可選)
    ((CollectionView)sender).SelectedItem = null;
}
```

**步驟 3：分組 ListView → 分組 CollectionView**

**之前 (分組 ListView)：**
```xaml
<ListView ItemsSource="{Binding GroupedItems}"
          IsGroupingEnabled="True"
          GroupDisplayBinding="{Binding Key}">
    <ListView.ItemTemplate>
        <DataTemplate>
            <TextCell Text="{Binding Name}" />
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>
```

**之後 (分組 CollectionView)：**
```xaml
<CollectionView ItemsSource="{Binding GroupedItems}"
                IsGrouped="true">
    <CollectionView.GroupHeaderTemplate>
        <DataTemplate>
            <Label Text="{Binding Key}"
                   FontAttributes="Bold"
                   BackgroundColor="{StaticResource Gray100}"
                   Padding="10,5" />
        </DataTemplate>
    </CollectionView.GroupHeaderTemplate>
    
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <VerticalStackLayout Padding="20,10">
                <Label Text="{Binding Name}" />
            </VerticalStackLayout>
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```

**步驟 4：內容動作 → SwipeView**

> ⚠️ **平台注意事項：** `SwipeView` 需要觸控輸入。在 Windows 桌面版上，它僅適用於觸控螢幕，不適用於滑鼠/觸控板。請考慮為桌面情境提供替代 UI（例如按鈕、右鍵選單）。

**之前 (帶有 ContextActions 的 ListView)：**
```xaml
<ListView.ItemTemplate>
    <DataTemplate>
        <ViewCell>
            <ViewCell.ContextActions>
                <MenuItem Text="刪除" 
                         IsDestructive="True"
                         Command="{Binding Source={RelativeSource AncestorType={x:Type local:MyPage}}, Path=DeleteCommand}"
                         CommandParameter="{Binding .}" />
            </ViewCell.ContextActions>
            
            <Label Text="{Binding Title}" Padding="10" />
        </ViewCell>
    </DataTemplate>
</ListView.ItemTemplate>
```

**之後 (帶有 SwipeView 的 CollectionView)：**
```xaml
<CollectionView.ItemTemplate>
    <DataTemplate>
        <SwipeView>
            <SwipeView.RightItems>
                <SwipeItems>
                    <SwipeItem Text="刪除"
                              BackgroundColor="Red"
                              Command="{Binding Source={RelativeSource AncestorType={x:Type local:MyPage}}, Path=DeleteCommand}"
                              CommandParameter="{Binding .}" />
                </SwipeItems>
            </SwipeView.RightItems>
            
            <VerticalStackLayout Padding="10">
                <Label Text="{Binding Title}" />
            </VerticalStackLayout>
        </SwipeView>
    </DataTemplate>
</CollectionView.ItemTemplate>
```

**步驟 5：設定頁面的 TableView → 替代方法**

`TableView` 通常用於設定頁面。以下是現代的替代方法：

**選項 1：帶有分組資料的 CollectionView**
```xaml
<CollectionView ItemsSource="{Binding SettingGroups}"
                IsGrouped="true"
                SelectionMode="None">
    <CollectionView.GroupHeaderTemplate>
        <DataTemplate>
            <Label Text="{Binding Title}" 
                   FontAttributes="Bold"
                   Margin="10,15,10,5" />
        </DataTemplate>
    </CollectionView.GroupHeaderTemplate>
    
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <Grid Padding="15,10" ColumnDefinitions="*,Auto">
                <Label Text="{Binding Title}" 
                       VerticalOptions="Center" />
                <Switch Grid.Column="1" 
                        IsToggled="{Binding IsEnabled}"
                        IsVisible="{Binding ShowSwitch}" />
            </Grid>
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```

**選項 2：垂直 StackLayout（適用於小型設定清單）**
```xaml
<ScrollView>
    <VerticalStackLayout BindableLayout.ItemsSource="{Binding Settings}"
                        Spacing="10"
                        Padding="15">
        <BindableLayout.ItemTemplate>
            <DataTemplate>
                <Border StrokeThickness="0"
                       BackgroundColor="{StaticResource Gray100}"
                       Padding="15,10">
                    <Grid ColumnDefinitions="*,Auto">
                        <Label Text="{Binding Title}" 
                              VerticalOptions="Center" />
                        <Switch Grid.Column="1" 
                                IsToggled="{Binding IsEnabled}" />
                    </Grid>
                </Border>
            </DataTemplate>
        </BindableLayout.ItemTemplate>
    </VerticalStackLayout>
</ScrollView>
```

**步驟 6：移除特定平台的 ListView 程式碼**

如果您使用了特定平台的 ListView 功能，請將其移除：

```csharp
// ❌ 舊版 - 移除這些 using 語句 (現在 .NET 10 中已棄用)
using Microsoft.Maui.Controls.PlatformConfiguration;
using Microsoft.Maui.Controls.PlatformConfiguration.iOSSpecific;
using Microsoft.Maui.Controls.PlatformConfiguration.AndroidSpecific;

// ❌ 舊版 - 移除 ListView 的平台組態 (現在 .NET 10 中已棄用)
myListView.On<iOS>().SetSeparatorStyle(SeparatorStyle.FullWidth);
myListView.On<Android>().IsFastScrollEnabled();

// ❌ 舊版 - 移除 Cell 的平台組態 (現在 .NET 10 中已棄用)
viewCell.On<iOS>().SetDefaultBackgroundColor(Colors.White);
viewCell.On<Android>().SetIsContextActionsLegacyModeEnabled(false);
```

**遷移：** `CollectionView` 沒有類似的特定平台組態。如果您需要特定平台的樣式設定：

```csharp
// ✅ 新版 - 使用條件式編譯
#if IOS
var backgroundColor = Colors.White;
#elif ANDROID
var backgroundColor = Colors.Transparent;
#endif

var grid = new Grid
{
    BackgroundColor = backgroundColor,
    // ... 其餘的 Cell 內容
};
```

或在 XAML 中：
```xaml
<CollectionView.ItemTemplate>
    <DataTemplate>
        <Grid>
            <Grid.BackgroundColor>
                <OnPlatform x:TypeArguments="Color">
                    <On Platform="iOS" Value="White" />
                    <On Platform="Android" Value="Transparent" />
                </OnPlatform>
            </Grid.BackgroundColor>
            <!-- Cell 內容 -->
        </Grid>
    </DataTemplate>
</CollectionView.ItemTemplate>
```

#### 常見模式與陷阱

**1. 空視圖**
```xaml
<!-- CollectionView 內建支援 EmptyView -->
<CollectionView ItemsSource="{Binding Items}">
    <CollectionView.EmptyView>
        <ContentView>
            <VerticalStackLayout Padding="50" VerticalOptions="Center">
                <Label Text="找不到項目" 
                       HorizontalTextAlignment="Center" />
            </VerticalStackLayout>
        </ContentView>
    </CollectionView.EmptyView>
    <!-- ... -->
</CollectionView>
```

**2. 下拉重新整理**
```xaml
<RefreshView IsRefreshing="{Binding IsRefreshing}"
             Command="{Binding RefreshCommand}">
    <CollectionView ItemsSource="{Binding Items}">
        <!-- ... -->
    </CollectionView>
</RefreshView>
```

**3. 項目間距**
```xaml
<!-- 使用 ItemsLayout 來設定間距 -->
<CollectionView ItemsSource="{Binding Items}">
    <CollectionView.ItemsLayout>
        <LinearItemsLayout Orientation="Vertical" 
                          ItemSpacing="10" />
    </CollectionView.ItemsLayout>
    <!-- ... -->
</CollectionView>
```

**4. 標頭和頁尾**
```xaml
<CollectionView ItemsSource="{Binding Items}">
    <CollectionView.Header>
        <Label Text="我的列表" 
               FontSize="24" 
               Padding="10" />
    </CollectionView.Header>
    
    <CollectionView.Footer>
        <Label Text="列表結尾" 
               Padding="10" 
               HorizontalTextAlignment="Center" />
    </CollectionView.Footer>
    
    <!-- ItemTemplate -->
</CollectionView>
```

**5. 載入更多 / 無限捲動**
```xaml
<CollectionView ItemsSource="{Binding Items}"
                RemainingItemsThreshold="5"
                RemainingItemsThresholdReachedCommand="{Binding LoadMoreCommand}">
    <!-- ItemTemplate -->
</CollectionView>
```

**6. 項目大小優化**

`CollectionView` 使用 `ItemSizingStrategy` 來控制項目測量：

```xaml
<!-- 預設：每個項目單獨測量 (類似 HasUnevenRows="True") -->
<CollectionView ItemSizingStrategy="MeasureAllItems">
    <!-- ... -->
</CollectionView>

<!-- 效能：僅測量第一個項目，其餘項目使用相同高度 -->
<CollectionView ItemSizingStrategy="MeasureFirstItem">
    <!-- 當所有項目高度一致時使用此選項 -->
</CollectionView>
```

> 💡 **效能提示：** 如果您的列表項目高度一致，請使用 `ItemSizingStrategy="MeasureFirstItem"` 以獲得處理大型列表時的更佳效能。

#### .NET 10 Handler 變更 (iOS/Mac Catalyst)

> ℹ️ **.NET 10 預設在 iOS 和 Mac Catalyst 上使用新的優化 CollectionView 和 CarouselView Handler**，提供更佳的效能和穩定性。

**如果您先前已選擇啟用 .NET 9 中的新 Handler**，現在應**移除**此程式碼：

```csharp
// ❌ 在 .NET 10 中移除此程式碼 (這些 Handler 現已成為預設)
#if IOS || MACCATALYST
builder.ConfigureMauiHandlers(handlers =>
{
    handlers.AddHandler<CollectionView, CollectionViewHandler2>();
    handlers.AddHandler<CarouselView, CarouselViewHandler2>();
});
#endif
```

優化的 Handler 在 .NET 10 中會自動使用 - 無需組態！

**僅當您遇到問題時**，才能還原為舊版 Handler：

```csharp
// 在 MauiProgram.cs 中 - 僅在需要時
#if IOS || MACCATALYST
builder.ConfigureMauiHandlers(handlers =>
{
    handlers.AddHandler<Microsoft.Maui.Controls.CollectionView, 
                        Microsoft.Maui.Controls.Handlers.Items.CollectionViewHandler>();
});
#endif
```

不過，Microsoft 建議使用新的預設 Handler 以獲得最佳結果。

#### 測試檢查清單

遷移後，請測試以下情境：

- [ ] **項目選取**是否正常運作
- [ ] **分組列表**是否顯示正確的標頭
- [ ] **滑動動作**（如果使用）在 iOS 和 Android 上是否都能運作
- [ ] 列表為空時是否顯示**空視圖**
- [ ] **下拉重新整理**是否運作（如果使用）
- [ ] **捲動效能**是否可接受（特別是對於大型列表）
- [ ] **項目大小**是否正確（CollectionView 預設自動調整大小）
- [ ] **選取視覺狀態**是否正確顯示/隱藏
- [ ] **資料繫結**是否正確更新列表
- [ ] 從列表項目進行的**導覽**是否正常運作

#### 遷移複雜性因素

`ListView` 到 `CollectionView` 的遷移很複雜，因為：
- 每個 `ListView` 可能有獨特的行為
- 需要更新特定平台的程式碼
- 需要廣泛的測試
- 內容動作需要轉換為 `SwipeView`
- 分組列表需要更新範本
- 可能需要 ViewModel 的變更

#### 快速參考：ListView vs CollectionView

| 功能 | ListView | CollectionView |
|---|---|---|
| **選取事件** | `ItemSelected` | `SelectionChanged` |
| **選取參數** | `SelectedItemChangedEventArgs` | `SelectionChangedEventArgs` |
| **取得選取的項目** | `e.SelectedItem` | `e.CurrentSelection.FirstOrDefault()` |
| **內容功能表** | `ContextActions` | `SwipeView` |
| **分組** | `IsGroupingEnabled="True"` | `IsGrouped="true"` |
| **分組標頭** | `GroupDisplayBinding` | `GroupHeaderTemplate` |
| **偶數列** | `HasUnevenRows="False"` | 自動調整大小（預設） |
| **空狀態** | 手動 | `EmptyView` 屬性 |
| **Cell** | TextCell、ImageCell 等 | 自訂 DataTemplate |

---

## 已棄用的 API (P1 - 應盡快修正)

這些 API 在 .NET 10 中仍然可用，但會顯示編譯器警告。它們將在未來版本中移除。

### 1. 動畫方法

**狀態：** ⚠️ **已棄用** - 所有同步動畫方法均已替換為非同步版本。

**您將看到的警告：**
```
warning CS0618: 'ViewExtensions.FadeTo(VisualElement, double, uint, Easing)' is obsolete: 'Please use FadeToAsync instead.'
```

**遷移表格：**

| 舊方法 | 新方法 | 範例 |
|---|---|---|
| `FadeTo()` | `FadeToAsync()` | `await view.FadeToAsync(0, 500);` |
| `ScaleTo()` | `ScaleToAsync()` | `await view.ScaleToAsync(1.5, 300);` |
| `TranslateTo()` | `TranslateToAsync()` | `await view.TranslateToAsync(100, 100, 250);` |
| `RotateTo()` | `RotateToAsync()` | `await view.RotateToAsync(360, 500);` |
| `RotateXTo()` | `RotateXToAsync()` | `await view.RotateXToAsync(45, 300);` |
| `RotateYTo()` | `RotateYToAsync()` | `await view.RotateYToAsync(45, 300);` |
| `ScaleXTo()` | `ScaleXToAsync()` | `await view.ScaleXToAsync(2.0, 300);` |
| `ScaleYTo()` | `ScaleYToAsync()` | `await view.ScaleYToAsync(2.0, 300);` |
| `RelRotateTo()` | `RelRotateToAsync()` | `await view.RelRotateToAsync(90, 300);` |
| `RelScaleTo()` | `RelScaleToAsync()` | `await view.RelScaleToAsync(0.5, 300);` |
| `LayoutTo()` | `LayoutToAsync()` | 請參閱下方的特殊說明 |

#### 遷移範例

**簡單動畫：**
```csharp
// ❌ 舊版 (已棄用)
await myButton.FadeTo(0, 500);
await myButton.ScaleTo(1.5, 300);
await myButton.TranslateTo(100, 100, 250);

// ✅ 新版 (必要)
await myButton.FadeToAsync(0, 500);
await myButton.ScaleToAsync(1.5, 300);
await myButton.TranslateToAsync(100, 100, 250);
```

**連續動畫：**
```csharp
// ❌ 舊版
await image.FadeTo(0, 300);
await image.ScaleTo(0.5, 300);
await image.FadeTo(1, 300);

// ✅ 新版
await image.FadeToAsync(0, 300);
await image.ScaleToAsync(0.5, 300);
await image.FadeToAsync(1, 300);
```

**平行動畫：**
```csharp
// ❌ 舊版
await Task.WhenAll(
    image.FadeTo(0, 300),
    image.ScaleTo(0.5, 300),
    image.RotateTo(360, 300)
);

// ✅ 新版
await Task.WhenAll(
    image.FadeToAsync(0, 300),
    image.ScaleToAsync(0.5, 300),
    image.RotateToAsync(360, 300)
);
```

**支援取消：**
```csharp
// 新版：非同步方法支援取消
CancellationTokenSource cts = new();

try
{
    await view.FadeToAsync(0, 2000);
}
catch (TaskCanceledException)
{
    // 動畫已被取消
}

// 從其他地方取消
cts.Cancel();
```

#### 特殊情況：LayoutTo

`LayoutToAsync()` 已被棄用，並附帶特殊訊息：「使用 Translation 來動畫佈局變更。」

```csharp
// ❌ 舊版 (已棄用)
await view.LayoutToAsync(new Rect(100, 100, 200, 200), 250);

// ✅ 新版 (改用 TranslateToAsync)
await view.TranslateToAsync(100, 100, 250);

// 或直接動畫 Translation 屬性
var animation = new Animation(v => view.TranslationX = v, 0, 100);
animation.Commit(view, "MoveX", length: 250);
```

---

### 2. DisplayAlert 和 DisplayActionSheet

**狀態：** ⚠️ **已棄用** - 同步方法已替換為非同步版本。

**您將看到的警告：**
```
warning CS0618: 'Page.DisplayAlert(string, string, string)' is obsolete: 'Use DisplayAlertAsync instead'
```

#### 遷移範例

**DisplayAlert：**
```csharp
// ❌ 舊版 (已棄用)
await DisplayAlert("成功", "資料已成功儲存", "確定");
await DisplayAlert("錯誤", "儲存失敗", "取消");
bool result = await DisplayAlert("確認", "是否刪除此項目？", "是", "否");

// ✅ 新版 (必要)
await DisplayAlertAsync("成功", "資料已成功儲存", "確定");
await DisplayAlertAsync("錯誤", "儲存失敗", "取消");
bool result = await DisplayAlertAsync("確認", "是否刪除此項目？", "是", "否");
```

**DisplayActionSheet：**
```csharp
// ❌ 舊版 (已棄用)
string action = await DisplayActionSheet(
    "選擇一個動作",
    "取消",
    "刪除",
    "編輯", "共用", "複製"
);

// ✅ 新版 (必要)
string action = await DisplayActionSheetAsync(
    "選擇一個動作",
    "取消",
    "刪除",
    "編輯", "共用", "複製"
);
```

**在 ViewModel 中 (搭配 IDispatcher)：**
```csharp
// 如果您從 ViewModel 呼叫，則需要 Page 的存取權
public class MyViewModel
{
    private readonly IDispatcher _dispatcher;
    private readonly Page _page;
    
    public MyViewModel(IDispatcher dispatcher, Page page)
    {
        _dispatcher = dispatcher;
        _page = page;
    }
    
    public async Task ShowAlertAsync()
    {
        await _dispatcher.DispatchAsync(async () =>
        {
            await _page.DisplayAlertAsync("資訊", "來自 ViewModel 的訊息", "確定");
        });
    }
}
```

---

### 3. Page.IsBusy

**狀態：** ⚠️ **已棄用** - 此屬性將在 .NET 11 中移除。

**您將看到的警告：**
```
warning CS0618: 'Page.IsBusy' is obsolete: 'Page.IsBusy has been deprecated and will be removed in .NET 11'
```

**為何被棄用：**
- 各平台行為不一致
- 自訂選項有限
- 與現代 MVVM 模式不相容

#### 遷移範例

**簡單頁面：**
```xaml
<!-- ❌ 舊版 (已棄用) -->
<ContentPage IsBusy="{Binding IsLoading}">
    <StackLayout>
        <Label Text="內容在此" />
    </StackLayout>
</ContentPage>

<!-- ✅ 新版 (建議) -->
<ContentPage>
    <Grid>
        <!-- 主要內容 -->
        <StackLayout>
            <Label Text="內容在此" />
        </StackLayout>
        
        <!-- 載入指示器覆蓋層 -->
        <ActivityIndicator IsRunning="{Binding IsLoading}"
                          IsVisible="{Binding IsLoading}"
                          Color="{StaticResource Primary}"
                          VerticalOptions="Center"
                          HorizontalOptions="Center" />
    </Grid>
</ContentPage>
```

**搭配載入覆蓋層：**
```xaml
<!-- ✅ 較佳：自訂載入覆蓋層 -->
<ContentPage>
    <Grid>
        <!-- 主要內容 -->
        <ScrollView>
            <VerticalStackLayout Padding="20">
                <Label Text="您的內容在此" />
            </VerticalStackLayout>
        </ScrollView>
        
        <!-- 載入覆蓋層 -->
        <Grid IsVisible="{Binding IsLoading}"
              BackgroundColor="#80000000">
            <VerticalStackLayout VerticalOptions="Center"
                               HorizontalOptions="Center"
                               Spacing="10">
                <ActivityIndicator IsRunning="True"
                                 Color="White" />
                <Label Text="載入中..."
                       TextColor="White" />
            </VerticalStackLayout>
        </Grid>
    </Grid>
</ContentPage>
```

**在程式碼後置中：**
```csharp
// ❌ 舊版 (已棄用)
public partial class MyPage : ContentPage
{
    async Task LoadDataAsync()
    {
        IsBusy = true;
        try
        {
            await LoadDataFromServerAsync();
        }
        finally
        {
            IsBusy = false;
        }
    }
}

// ✅ 新版 (建議)
public partial class MyPage : ContentPage
{
    async Task LoadDataAsync()
    {
        LoadingIndicator.IsVisible = true;
        LoadingIndicator.IsRunning = true;
        try
        {
            await LoadDataFromServerAsync();
        }
        finally
        {
            LoadingIndicator.IsVisible = false;
            LoadingIndicator.IsRunning = false;
        }
    }
}
```

**在 ViewModel 中：**
```csharp
public class MyViewModel : INotifyPropertyChanged
{
    private bool _isLoading;
    public bool IsLoading
    {
        get => _isLoading;
        set
        {
            _isLoading = value;
            OnPropertyChanged();
        }
    }
    
    public async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            await LoadDataFromServerAsync();
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

---

## 建議的變更 (P2)

這些變更雖然建議進行，但並非立即需要。請考慮在下次重構週期中進行遷移。

### Application.MainPage

**狀態：** ⚠️ **已棄用** - 此屬性將在未來版本中移除。

**您將看到的警告：**
```
warning CS0618: 'Application.MainPage' is obsolete: 'This property is deprecated. Initialize your application by overriding Application.CreateWindow...'
```

#### 遷移範例

```csharp
// ❌ 舊版 (已棄用)
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new AppShell();
    }
    
    // 後續更改頁面
    public void SwitchToLoginPage()
    {
        MainPage = new LoginPage();
    }
}

// ✅ 新版 (建議)
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }
    
    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new AppShell());
    }
    
    // 後續更改頁面
    public void SwitchToLoginPage()
    {
        if (Windows.Count > 0)
        {
            Windows[0].Page = new LoginPage();
        }
    }
}
```

**CreateWindow 的優點：**
- 更好的多視窗支援
- 更明確的初始化
- 更清晰的職責劃分
- 與 Shell 搭配效果更好

---

## 大量遷移工具

使用這些尋找/取代模式來快速更新您的程式碼庫。

### Visual Studio / VS Code

**正規表示式模式 - 尋找/取代**

#### 動畫方法

```regex
尋找：    \.FadeTo\(
取代： .FadeToAsync(

尋找：    \.ScaleTo\(
取代： .ScaleToAsync(

尋找：    \.TranslateTo\(
取代： .TranslateToAsync(

尋找：    \.RotateTo\(
取代： .RotateToAsync(

尋找：    \.RotateXTo\(
取代： .RotateXToAsync(

尋找：    \.RotateYTo\(
取代： .RotateYToAsync(

尋找：    \.ScaleXTo\(
取代： .ScaleXToAsync(

尋找：    \.ScaleYTo\(
取代： .ScaleYToAsync(

尋找：    \.RelRotateTo\(
取代： .RelRotateToAsync(

尋找：    \.RelScaleTo\(
取代： .RelScaleToAsync(
```

#### 顯示方法

```regex
尋找：    DisplayAlert\(
取代： DisplayAlertAsync(

尋找：    DisplayActionSheet\(
取代： DisplayActionSheetAsync(
```

#### 偵測 ListView/TableView (需要手動遷移)

**⚠️ 注意：** `ListView`/`TableView` 的遷移**無法自動化**。請使用以下搜尋來尋找相關的實例：

```bash
# 在 XAML 中尋找所有 ListView 的用法
grep -r "<ListView" --include="*.xaml" .

# 在 XAML 中尋找所有 TableView 的用法
grep -r "<TableView" --include="*.xaml" .

# 在 C# 程式碼中尋找 ListView
grep -r "new ListView\|ListView " --include="*.cs" .

# 在 XAML 中尋找 Cell 類型
grep -r "TextCell\|ImageCell\|EntryCell\|SwitchCell\|ViewCell" --include="*.xaml" .

# 尋找 ItemSelected 事件處理器 (需要更改為 SelectionChanged)
grep -r "ItemSelected=" --include="*.xaml" .
grep -r "ItemSelected\s*\+=" --include="*.cs" .

# 尋找 ContextActions (需要更改為 SwipeView)
grep -r "ContextActions" --include="*.xaml" .

# 尋找特定平台的 ListView 程式碼 (需要移除)
grep -r "PlatformConfiguration.*ListView" --include="*.cs" .
```

**建立遷移清單：**
```bash
# 產生所有 ListView/TableView 實例的報告
echo "=== ListView/TableView 遷移清單 ===" > migration-report.txt
echo "" >> migration-report.txt
echo "XAML ListView 實例：" >> migration-report.txt
grep -rn "<ListView" --include="*.xaml" . >> migration-report.txt
echo "" >> migration-report.txt
echo "XAML TableView 實例：" >> migration-report.txt
grep -rn "<TableView" --include="*.xaml" . >> migration-report.txt
echo "" >> migration-report.txt
echo "ItemSelected 事件處理器：" >> migration-report.txt
grep -rn "ItemSelected" --include="*.xaml" --include="*.cs" . >> migration-report.txt
echo "" >> migration-report.txt
cat migration-report.txt
```

### PowerShell 腳本

```powershell
# 在所有 .cs 檔案中取代動畫方法
Get-ChildItem -Path . -Recurse -Filter *.cs | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # 動畫方法
    $content = $content -replace '\.FadeTo\(', '.FadeToAsync('
    $content = $content -replace '\.ScaleTo\(', '.ScaleToAsync('
    $content = $content -replace '\.TranslateTo\(', '.TranslateToAsync('
    $content = $content -replace '\.RotateTo\(', '.RotateToAsync('
    $content = $content -replace '\.RotateXTo\(', '.RotateXToAsync('
    $content = $content -replace '\.RotateYTo\(', '.RotateYToAsync('
    $content = $content -replace '\.ScaleXTo\(', '.ScaleXToAsync('
    $content = $content -replace '\.ScaleYTo\(', '.ScaleYToAsync('
    $content = $content -replace '\.RelRotateTo\(', '.RelRotateToAsync('
    $content = $content -replace '\.RelScaleTo\(', '.RelScaleToAsync('
    
    # 顯示方法
    $content = $content -replace 'DisplayAlert\(', 'DisplayAlertAsync('
    $content = $content -replace 'DisplayActionSheet\(', 'DisplayActionSheetAsync('
    
    Set-Content $_.FullName $content
}

Write-Host "✅ 遷移完成！"
```

---

## 測試您的升級

### 建置驗證

```bash
# 清除方案
dotnet clean

# 還原套件
dotnet restore

# 為每個平台建置
dotnet build -f net10.0-android -c Release
dotnet build -f net10.0-ios -c Release
dotnet build -f net10.0-maccatalyst -c Release
dotnet build -f net10.0-windows -c Release

# 檢查警告
dotnet build --no-incremental 2>&1 | grep -i "warning CS0618"
```

### 將警告視為錯誤 (暫時)

```xml
<!-- 新增至您的 .csproj 以捕捉所有已棄用 API 的使用 -->
<PropertyGroup>
  <WarningsAsErrors>CS0618</WarningsAsErrors>
</PropertyGroup>
```

### 測試檢查清單

- [ ] 應用程式成功在所有平台上啟動
- [ ] 所有動畫都能正常運作
- [ ] 對話方塊（提示框/動作表單）顯示正常
- [ ] 載入指示器正常運作（如果您使用了 IsBusy）
- [ ] 元件間通訊正常運作（MessagingCenter 替換）
- [ ] 建置輸出中沒有 CS0618 警告
- [ ] 沒有與已棄用 API 相關的執行階段例外狀況

---

## 疑難排解

### 錯誤：「MessagingCenter」因其保護層級而無法存取

**原因：** 在 .NET 10 中，`MessagingCenter` 現在是 `internal`（內部）。

**解決方案：**
1. 安裝 `CommunityToolkit.Mvvm` 套件。
2. 替換為 `WeakReferenceMessenger`（請參閱 [MessagingCenter 區段](#messagingcenter-made-internal)）。
3. 為每個訊息類型建立訊息類別。
4. 別忘了取消註冊！

---

### 警告：動畫方法已棄用

**原因：** 使用同步動畫方法（`FadeTo`、`ScaleTo` 等）。

**快速修正：**
```bash
# 使用「大量遷移工具」區段中的 PowerShell 腳本
# 或使用尋找/取代模式
```

**手動修正：**
在每個動畫方法呼叫的結尾加上 `Async`：
- `FadeTo` → `FadeToAsync`
- `ScaleTo` → `ScaleToAsync`
- 等等。

---

### Page.IsBusy 無法再正常運作

**原因：** `IsBusy` 仍然可用，但已被棄用。

**解決方案：** 替換為明確的 `ActivityIndicator`（請參閱 [IsBusy 區段](#3-pageisbusy)）。

---

### 建置失敗，顯示「找不到目標框架 'net10.0'」

**原因：** 未安裝 .NET 10 SDK 或未安裝最新版本。

**解決方案：**
```bash
# 檢查 SDK 版本
dotnet --version  # 應為 10.0.100 或更高版本

# 從以下連結安裝 .NET 10 SDK：
# https://dotnet.microsoft.com/download/dotnet/10.0

# 更新工作負載
dotnet workload update
```

---

### MessagingCenter 遷移破壞現有程式碼

**常見問題：**

1. **忘記取消註冊：**
   ```csharp
   // ⚠️ 如果您沒有取消註冊，將會發生記憶體洩漏
   protected override void OnDisappearing()
   {
       base.OnDisappearing();
       WeakReferenceMessenger.Default.UnregisterAll(this);
   }
   ```

2. **訊息類型錯誤：**
   ```csharp
   // ❌ 錯誤
   WeakReferenceMessenger.Default.Register<UserLoggedIn>(this, handler);
   WeakReferenceMessenger.Default.Send(new UserData());  // 類型錯誤！
   
   // ✅ 正確
   WeakReferenceMessenger.Default.Register<UserLoggedInMessage>(this, handler);
   WeakReferenceMessenger.Default.Send(new UserLoggedInMessage(userData));
   ```

3. **接收者參數混淆：**
   ```csharp
   // 接收者參數是註冊的物件 (this)
   WeakReferenceMessenger.Default.Register<MyMessage>(this, (recipient, message) =>
   {
       // recipient == this
       // message == 已傳送的訊息
   });
   ```

---

### 遷移後動畫未完成

**原因：** 忘記使用 `await` 關鍵字。

```csharp
// ❌ 錯誤 - 動畫會執行，但程式碼會立即繼續
view.FadeToAsync(0, 500);
DoSomethingElse();

// ✅ 正確 - 等待動畫完成
await view.FadeToAsync(0, 500);
DoSomethingElse();
```

---

### 警告：ListView/TableView/TextCell 已棄用

**原因：** 使用已棄用的 `ListView`、`TableView` 或 `Cell` 類型。

**解決方案：** 遷移到 `CollectionView`（請參閱 [ListView 和 TableView 區段](#listview-and-tableview-deprecated)）。

**快速決策指南：**
- **簡單列表** → 具有自訂 `DataTemplate` 的 `CollectionView`
- **設定頁面（少於 20 個項目）** → 具有 `BindableLayout` 的 `VerticalStackLayout`
- **設定頁面（超過 20 個項目）** → 分組的 `CollectionView`
- **分組資料列表** → 具有 `IsGrouped="True"` 的 `CollectionView`

---

### CollectionView 沒有 SelectedItem 事件

**原因：** `CollectionView` 使用 `SelectionChanged` 而非 `ItemSelected`。

**解決方案：**
```csharp
// ❌ 舊版 (ListView)
void OnItemSelected(object sender, SelectedItemChangedEventArgs e)
{
    var item = e.SelectedItem as MyItem;
}

// ✅ 新版 (CollectionView)
void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
{
    var item = e.CurrentSelection.FirstOrDefault() as MyItem;
}
```

---

### 特定平台的 ListView 組態已棄用

**原因：** 使用 `Microsoft.Maui.Controls.PlatformConfiguration.*Specific.ListView` 擴充功能。

**錯誤：**
```
warning CS0618: 'ListView' is obsolete: 'With the deprecation of ListView, this class is obsolete. Please use CollectionView instead.'
```

**解決方案：**
1. 移除特定平台的 ListView 使用宣告：
   ```csharp
   // ❌ 移除這些
   using Microsoft.Maui.Controls.PlatformConfiguration;
   using Microsoft.Maui.Controls.PlatformConfiguration.iOSSpecific;
   using Microsoft.Maui.Controls.PlatformConfiguration.AndroidSpecific;
   ```

2. 移除特定平台的 ListView 呼叫：
   ```csharp
   // ❌ 移除這些
   myListView.On<iOS>().SetSeparatorStyle(SeparatorStyle.FullWidth);
   myListView.On<Android>().IsFastScrollEnabled();
   viewCell.On<iOS>().SetDefaultBackgroundColor(Colors.White);
   ```

3. `CollectionView` 具有不同的平台自訂選項 - 請參閱 `CollectionView` 文件以取得替代方案。

---

### ListView 遷移後 CollectionView 效能問題

**常見原因：**

1. **未使用 DataTemplate 快取：**
   ```xaml
   <!-- ❌ 效能不佳 -->
   <CollectionView.ItemTemplate>
       <DataTemplate>
           <ComplexView />
       </DataTemplate>
   </CollectionView.ItemTemplate>
   
   <!-- ✅ 較佳 - 使用較簡單的範本 -->
   <CollectionView.ItemTemplate>
       <DataTemplate>
           <VerticalStackLayout Padding="10">
               <Label Text="{Binding Title}" />
           </VerticalStackLayout>
       </DataTemplate>
   </CollectionView.ItemTemplate>
   ```

2. **複雜的巢狀佈局：**
   - 避免在 `ItemTemplate` 中使用深度巢狀佈局。
   - 可能時使用 `Grid` 而非 `StackLayout`。
   - 考慮使用 `FlexLayout` 處理複雜佈局。

3. **影像未快取：**
   ```xaml
   <Image Source="{Binding ImageUrl}"
          Aspect="AspectFill"
          HeightRequest="80"
          WidthRequest="80">
       <Image.Behaviors>
           <!-- 如有需要，請新增快取行為 -->
       </Image.Behaviors>
   </Image>
   ```

---

## 快速參考卡

### 優先檢查清單

**必須修正 (P0 - 重大/關鍵)：**
- [ ] 將 `MessagingCenter` 替換為 `WeakReferenceMessenger`
- [ ] 將 `ListView` 遷移到 `CollectionView`
- [ ] 將 `TableView` 遷移到 `CollectionView` 或 `BindableLayout`
- [ ] 將 `TextCell`、`ImageCell` 等替換為自訂 `DataTemplates`
- [ ] 將 `ContextActions` 轉換為 `SwipeView`
- [ ] 移除特定平台的 ListView 組態

**應修正 (P1 - 已棄用)：**
- [ ] 更新動畫方法：加上 `Async` 後綴
- [ ] 更新 `DisplayAlert` → `DisplayAlertAsync`
- [ ] 更新 `DisplayActionSheet` → `DisplayActionSheetAsync`  
- [ ] 將 `Page.IsBusy` 替換為 `ActivityIndicator`

**建議修正 (P2)：**
- [ ] 將 `Application.MainPage` 遷移到 `CreateWindow`

### 常見模式

```csharp
// 動畫
await view.FadeToAsync(0, 500);

// 提示框
await DisplayAlertAsync("標題", "訊息", "確定");

// 訊息傳遞
WeakReferenceMessenger.Default.Send(new MyMessage());
WeakReferenceMessenger.Default.Register<MyMessage>(this, (r, m) => { });
WeakReferenceMessenger.Default.UnregisterAll(this);

// 載入中
IsLoading = true;
try { await LoadAsync(); } 
finally { IsLoading = false; }
```

---

## 其他資源

- **官方文件：** https://learn.microsoft.com/dotnet/maui/
- **遷移指南：** https://learn.microsoft.com/dotnet/maui/migration/
- **GitHub 問題：** https://github.com/dotnet/maui/issues
- **CommunityToolkit.Mvvm：** https://learn.microsoft.com/dotnet/communitytoolkit/mvvm/

---

**文件版本：** 2.0  
**最後更新：** 2025 年 11 月  
**適用於：** .NET MAUI 10.0.100 及更高版本
