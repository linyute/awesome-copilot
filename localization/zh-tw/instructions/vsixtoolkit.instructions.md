---
description: '使用 Community.VisualStudio.Toolkit 進行 Visual Studio 擴充功能 (VSIX) 開發的指引'
applyTo: '**/*.cs, **/*.vsct, **/*.xaml, **/source.extension.vsixmanifest'
---

# 使用 Community.VisualStudio.Toolkit 進行 Visual Studio 擴充功能開發

## 範圍

**這些指令僅適用於使用 `Community.VisualStudio.Toolkit` 的 Visual Studio 擴充功能。**

透過檢查以下內容來驗證專案是否使用該工具組：
- `Community.VisualStudio.Toolkit.*` NuGet 套件參考
- `ToolkitPackage` 基礎類別（而非原始的 `AsyncPackage`）
- 指令使用 `BaseCommand<T>` 模式

**如果專案使用原始 VSSDK（直接使用 `AsyncPackage`）或新的 `VisualStudio.Extensibility` 模型，請勿套用這些指令。**

## 目標

- 產生非同步優先、執行緒安全的擴充功能程式碼
- 使用工具組抽象化（`VS.*` 協助程式、`BaseCommand<T>`、`BaseOptionModel<T>`）
- 確保所有 UI 遵循 Visual Studio 主題
- 遵循 VSSDK 和 VSTHRD 分析器規則
- 產出可測試、易於維護的擴充功能程式碼
- 當存放庫中存在 `.editorconfig` 時，**遵循 `.editorconfig` 設定**

## 程式碼風格 (.editorconfig)

**如果存放庫中存在 `.editorconfig` 檔案，則所有產生和修改的程式碼都必須遵循其規則。**

這包括但不限於：
- 縮排風格（Tab 或空格）和大小
- 行尾和末尾換行要求
- 命名慣例（欄位、屬性、方法等）
- 程式碼風格偏好（`var` 用法、運算式主體、大括號等）
- 分析器嚴重性層級和隱藏規則

在產生程式碼之前，請檢查存放庫根目錄中的 `.editorconfig` 並套用其設定。如有疑問，請與檔案中正在編輯之程式碼周圍的風格保持一致。

## .NET Framework 和 C# 語言限制

**Visual Studio 擴充功能的目標是 .NET Framework 4.8**，但可以使用現代 C# 語法（最高到 C# 14），受限於 .NET Framework 執行階段所強加的限制。

### ✅ 支援的現代 C# 功能
- 主要建構函式 (Primary constructors)
- 檔案範圍命名空間 (File-scoped namespaces)
- 全域 Using (Global usings)
- 模式比對 (Pattern matching)（所有形式）
- 記錄 (Records)（有限制）
- `init` 存取子
- 目標類型的 `new` (Target-typed `new`)
- 可為 Null 的參考型別 (Nullable reference types)（僅註釋）
- 原始字串常值 (Raw string literals)
- 集合運算式 (Collection expressions)

### ❌ 不支援 (.NET Framework 限制)
- `Span<T>`, `ReadOnlySpan<T>`, `Memory<T>`（無執行階段支援）
- `IAsyncEnumerable<T>`（無 Polyfill 套件）
- 預設介面實作
- `Index` 和 `Range` 型別（無 `^` 和 `..` 運算子的執行階段支援）
- 結構上的 `init`-only setter（執行階段限制）
- 某些 `System.Text.Json` 功能

### 最佳實務
編寫程式碼時，優先使用 .NET Framework 4.8 中可用的 API。如果需要現代 API，請檢查是否存在 Polyfill NuGet 套件（例如，用於 `IAsyncEnumerable<T>` 的 `Microsoft.Bcl.AsyncInterfaces`）。

## 範例提示詞行為

### ✅ 良好建議
- 「建立一個使用 `BaseCommand<T>` 開啟目前檔案所在資料夾的指令」
- 「新增一個具有布林值設定且使用 `BaseOptionModel<T>` 的選項頁面」
- 「為 C# 檔案撰寫一個標記提供者 (tagger provider) 來醒目提示 TODO 註釋」
- 「在處理檔案時顯示狀態列進度指示器」

### ❌ 避免
- 建議使用原始 `AsyncPackage` 而非 `ToolkitPackage`
- 直接使用 `OleMenuCommandService` 而非 `BaseCommand<T>`
- 在未先切換到 UI 執行緒的情況下建立 WPF 元素
- 在 UI 工作中使用 `.Result`, `.Wait()` 或 `Task.Run`
- 硬編碼顏色而非使用 VS 主題顏色

## 專案結構

```
src/
├── Commands/           # 指令處理常式（功能表項目、工具列按鈕）
├── Options/            # 設定/選項頁面
├── Services/           # 商務邏輯和服務
├── Tagging/            # ITagger 實作（語法醒目提示、大綱）
├── Adornments/         # 編輯器裝飾（IntraTextAdornment、邊界）
├── QuickInfo/          # QuickInfo/工具提示提供者
├── SuggestedActions/   # 燈泡動作
├── Handlers/           # 事件處理常式（格式化文件、貼上等）
├── Resources/          # 圖片、圖示、授權檔案
├── source.extension.vsixmanifest  # 擴充功能資訊清單
├── VSCommandTable.vsct            # 指令定義（功能表、按鈕）
├── VSCommandTable.cs              # 自動產生的指令 ID
└── *Package.cs                    # 主要套件類別
```

## Community.VisualStudio.Toolkit 模式

### 全域 Using

使用該工具組的擴充功能應在 Package 檔案中具有這些全域 Using：

```csharp
global using System;
global using Community.VisualStudio.Toolkit;
global using Microsoft.VisualStudio.Shell;
global using Task = System.Threading.Tasks.Task;
```

### 套件類別 (Package Class)

```csharp
[PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
[InstalledProductRegistration(Vsix.Name, Vsix.Description, Vsix.Version)]
[ProvideMenuResource("Menus.ctmenu", 1)]
[Guid(PackageGuids.YourExtensionString)]
[ProvideOptionPage(typeof(OptionsProvider.GeneralOptions), Vsix.Name, "General", 0, 0, true, SupportsProfiles = true)]
public sealed class YourPackage : ToolkitPackage
{
    protected override async Task InitializeAsync(CancellationToken cancellationToken, IProgress<ServiceProgressData> progress)
    {
        await this.RegisterCommandsAsync();
    }
}
```

### 指令

指令使用 `[Command]` 屬性並繼承自 `BaseCommand<T>`：

```csharp
[Command(PackageIds.YourCommandId)]
internal sealed class YourCommand : BaseCommand<YourCommand>
{
    protected override async Task ExecuteAsync(OleMenuCmdEventArgs e)
    {
        // 指令實作
    }

    // 選填：控制指令狀態（啟用、勾選、可見）
    protected override void BeforeQueryStatus(EventArgs e)
    {
        Command.Checked = someCondition;
        Command.Enabled = anotherCondition;
    }
}
```

### 選項頁面

```csharp
internal partial class OptionsProvider
{
    [ComVisible(true)]
    public class GeneralOptions : BaseOptionPage<General> { }
}

public class General : BaseOptionModel<General>
{
    [Category("Category Name")]
    [DisplayName("Setting Name")]
    [Description("Description of the setting.")]
    [DefaultValue(true)]
    public bool MySetting { get; set; } = true;
}
```

## MEF 元件

### 標記提供者 (Tagger Providers)

使用 `[Export]` 和適當的 `[ContentType]` 屬性：

```csharp
[Export(typeof(IViewTaggerProvider))]
[ContentType("CSharp")]
[ContentType("Basic")]
[TagType(typeof(IntraTextAdornmentTag))]
[TextViewRole(PredefinedTextViewRoles.Document)]
internal sealed class YourTaggerProvider : IViewTaggerProvider
{
    [Import]
    internal IOutliningManagerService OutliningManagerService { get; set; }

    public ITagger<T> CreateTagger<T>(ITextView textView, ITextBuffer buffer) where T : ITag
    {
        if (textView == null || !(textView is IWpfTextView wpfTextView))
            return null;

        if (textView.TextBuffer != buffer)
            return null;

        return wpfTextView.Properties.GetOrCreateSingletonProperty(
            () => new YourTagger(wpfTextView)) as ITagger<T>;
    }
}
```

### QuickInfo 來源

```csharp
[Export(typeof(IAsyncQuickInfoSourceProvider))]
[Name("YourQuickInfo")]
[ContentType("code")]
[Order(Before = "Default Quick Info Presenter")]
internal sealed class YourQuickInfoSourceProvider : IAsyncQuickInfoSourceProvider
{
    public IAsyncQuickInfoSource TryCreateQuickInfoSource(ITextBuffer textBuffer)
    {
        return textBuffer.Properties.GetOrCreateSingletonProperty(
            () => new YourQuickInfoSource(textBuffer));
    }
}
```

### 建議動作（燈泡）

```csharp
[Export(typeof(ISuggestedActionsSourceProvider))]
[Name("Your Suggested Actions")]
[ContentType("text")]
internal sealed class YourSuggestedActionsSourceProvider : ISuggestedActionsSourceProvider
{
    public ISuggestedActionsSource CreateSuggestedActionsSource(ITextView textView, ITextBuffer textBuffer)
    {
        return new YourSuggestedActionsSource(textView, textBuffer);
    }
}
```

## 執行緒指引

### 執行 WPF 操作時務必切換到 UI 執行緒

```csharp
await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync(cancellationToken);
// 現在可以安全地建立/修改 WPF 元素
```

### 背景工作

```csharp
ThreadHelper.JoinableTaskFactory.RunAsync(async () =>
{
    await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync();
    await VS.Commands.ExecuteAsync("View.TaskList");
});
```

## VSSDK 和執行緒分析器規則

擴充功能應強制執行這些分析器規則。新增至 `.editorconfig`：

```ini
dotnet_diagnostic.VSSDK*.severity = error
dotnet_diagnostic.VSTHRD*.severity = error
```

### 效能規則
| ID | 規則 | 修正方式 |
|----|------|-----|
| **VSSDK001** | 繼承自 `AsyncPackage` | 使用 `ToolkitPackage`（繼承自 AsyncPackage） |
| **VSSDK002** | `AllowsBackgroundLoading = true` | 新增至 `[PackageRegistration]` |

### 執行緒規則 (VSTHRD)
| ID | 規則 | 修正方式 |
|----|------|-----|
| **VSTHRD001** | 避免使用 `.Wait()` | 使用 `await` |
| **VSTHRD002** | 避免使用 `JoinableTaskFactory.Run` | 使用 `RunAsync` 或 `await` |
| **VSTHRD010** | COM 呼叫需要 UI 執行緒 | `await ThreadHelper.JoinableTaskFactory.SwitchToMainThreadAsync()` |
| **VSTHRD100** | 不使用 `async void` | 使用 `async Task` |
| **VSTHRD110** | 觀察非同步結果 | `await task;` 或使用 pragma 隱藏 |

## Visual Studio 主題化

**所有 UI 必須遵循 VS 主題（淺色、深色、藍色、高對比）**

### 使用環境顏色的 WPF 主題化

```xml
<!-- MyControl.xaml -->
<UserControl x:Class="MyExt.MyControl"
             xmlns:vsui="clr-namespace:Microsoft.VisualStudio.PlatformUI;assembly=Microsoft.VisualStudio.Shell.15.0">
    <Grid Background="{DynamicResource {x:Static vsui:EnvironmentColors.ToolWindowBackgroundBrushKey}}">
        <TextBlock Foreground="{DynamicResource {x:Static vsui:EnvironmentColors.ToolWindowTextBrushKey}}"
                   Text="Hello, themed world!" />
    </Grid>
</UserControl>
```

### 工具組自動主題化（建議）

該工具組為 WPF UserControl 提供自動主題化：

```xml
<UserControl x:Class="MyExt.MyUserControl"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:toolkit="clr-namespace:Community.VisualStudio.Toolkit;assembly=Community.VisualStudio.Toolkit"
             toolkit:Themes.UseVsTheme="True">
    <!-- 控制項會自動獲得 VS 樣式 -->
</UserControl>
```

對於對話方塊視窗，請使用 `DialogWindow`：

```xml
<platform:DialogWindow
    x:Class="MyExt.MyDialog"
    xmlns:platform="clr-namespace:Microsoft.VisualStudio.PlatformUI;assembly=Microsoft.VisualStudio.Shell.15.0"
    xmlns:toolkit="clr-namespace:Community.VisualStudio.Toolkit;assembly=Community.VisualStudio.Toolkit"
    toolkit:Themes.UseVsTheme="True">
</platform:DialogWindow>
```

### 常見主題顏色權杖 (Tokens)

| 類別 | 權杖 | 用法 |
|----------|-------|-------|
| **背景** | `EnvironmentColors.ToolWindowBackgroundBrushKey` | 視窗/面板背景 |
| **前景** | `EnvironmentColors.ToolWindowTextBrushKey` | 文字 |
| **指令列** | `EnvironmentColors.CommandBarTextActiveBrushKey` | 功能表項目 |
| **連結** | `EnvironmentColors.ControlLinkTextBrushKey` | 超連結 |

### 主題感知圖示

使用來自 VS 影像編目 (Image Catalog) 的 `KnownMonikers` 作為主題感知圖示：

```csharp
public ImageMoniker IconMoniker => KnownMonikers.Settings;
```

在 VSCT 中：
```xml
<Icon guid="ImageCatalogGuid" id="Settings"/>
<CommandFlag>IconIsMoniker</CommandFlag>
```

## 常見 VS SDK API

### VS 協助程式方法 (Community.VisualStudio.Toolkit)

```csharp
// 狀態列
await VS.StatusBar.ShowMessageAsync("訊息");
await VS.StatusBar.ShowProgressAsync("正在處理...", currentStep, totalSteps);

// 解決方案/專案
Solution solution = await VS.Solutions.GetCurrentSolutionAsync();
IEnumerable<SolutionItem> items = await VS.Solutions.GetActiveItemsAsync();
bool isOpen = await VS.Solutions.IsOpenAsync();

// 文件
DocumentView docView = await VS.Documents.GetActiveDocumentViewAsync();
string text = docView?.TextBuffer?.CurrentSnapshot.GetText();
await VS.Documents.OpenAsync(fileName);
await VS.Documents.OpenInPreviewTabAsync(fileName);

// 指令
await VS.Commands.ExecuteAsync("View.TaskList");

// 設定
await VS.Settings.OpenAsync<OptionsProvider.GeneralOptions>();

// 訊息方塊
await VS.MessageBox.ShowAsync("標題", "訊息");
await VS.MessageBox.ShowErrorAsync("擴充功能名稱", ex.ToString());

// 事件
VS.Events.SolutionEvents.OnAfterOpenProject += OnAfterOpenProject;
VS.Events.DocumentEvents.Saved += OnDocumentSaved;
```

### 處理設定

```csharp
// 同步讀取設定
var value = General.Instance.MyOption;

// 非同步讀取設定
var general = await General.GetLiveInstanceAsync();
var value = general.MyOption;

// 寫入設定
General.Instance.MyOption = newValue;
General.Instance.Save();

// 或非同步方式
general.MyOption = newValue;
await general.SaveAsync();

// 監聽設定變更
General.Saved += OnSettingsSaved;
```

### 文字緩衝區操作

```csharp
// 獲取快照 (snapshot)
ITextSnapshot snapshot = textBuffer.CurrentSnapshot;

// 獲取行
ITextSnapshotLine line = snapshot.GetLineFromLineNumber(lineNumber);
string lineText = line.GetText();

// 建立追蹤範圍 (tracking span)
ITrackingSpan trackingSpan = snapshot.CreateTrackingSpan(span, SpanTrackingMode.EdgeInclusive);

// 編輯緩衝區
using (ITextEdit edit = textBuffer.CreateEdit())
{
    edit.Replace(span, newText);
    edit.Apply();
}

// 在插入點 (caret) 位置插入
DocumentView docView = await VS.Documents.GetActiveDocumentViewAsync();
if (docView?.TextView != null)
{
    SnapshotPoint position = docView.TextView.Caret.Position.BufferPosition;
    docView.TextBuffer?.Insert(position, "要插入的文字");
}
```

## VSCT 指令表

### 功能表/指令結構

```xml
<Commands package="YourPackage">
  <Menus>
    <Menu guid="YourPackage" id="SubMenu" type="Menu">
      <Parent guid="YourPackage" id="MenuGroup"/>
      <Strings>
        <ButtonText>功能表名稱</ButtonText>
        <CommandName>功能表名稱</CommandName>
        <CanonicalName>.YourExtension.MenuName</CanonicalName>
      </Strings>
    </Menu>
  </Menus>

  <Groups>
    <Group guid="YourPackage" id="MenuGroup" priority="0x0600">
      <Parent guid="guidSHLMainMenu" id="IDM_VS_CTXT_CODEWIN"/>
    </Group>
  </Groups>

  <Buttons>
    <Button guid="YourPackage" id="CommandId" type="Button">
      <Parent guid="YourPackage" id="MenuGroup"/>
      <Icon guid="ImageCatalogGuid" id="Settings"/>
      <CommandFlag>IconIsMoniker</CommandFlag>
      <CommandFlag>DynamicVisibility</CommandFlag>
      <Strings>
        <ButtonText>指令名稱</ButtonText>
        <CanonicalName>.YourExtension.CommandName</CanonicalName>
      </Strings>
    </Button>
  </Buttons>
</Commands>

<Symbols>
  <GuidSymbol name="YourPackage" value="{guid-here}">
    <IDSymbol name="MenuGroup" value="0x0001"/>
    <IDSymbol name="CommandId" value="0x0100"/>
  </GuidSymbol>
</Symbols>
```

## 最佳實務

### 1. 效能

- 在處理大型文件之前檢查檔案/緩衝區大小
- 使用 `NormalizedSnapshotSpanCollection` 進行高效的範圍操作
- 盡可能快取解析結果
- 在程式庫程式碼中使用 `ConfigureAwait(false)`

```csharp
// 跳過大型檔案
if (buffer.CurrentSnapshot.Length > 150000)
    return null;
```

### 2. 錯誤處理

- 使用 try-catch 包裹外部操作
- 適當地記錄錯誤
- 絕不讓例外狀況導致 VS 崩潰

```csharp
try
{
    // 操作
}
catch (Exception ex)
{
    await ex.LogAsync();
}
```

### 3. 可處置資源 (Disposable Resources)

- 在標記提供者 (taggers) 和其他長效物件上實作 `IDisposable`
- 在 Dispose 中取消訂閱事件

```csharp
public void Dispose()
{
    if (!_isDisposed)
    {
        _buffer.Changed -= OnBufferChanged;
        _isDisposed = true;
    }
}
```

### 4. 內容類型 (Content Types)

`[ContentType]` 屬性的常見內容類型：
- `"text"` - 所有文字檔案
- `"code"` - 所有程式碼檔案
- `"CSharp"` - C# 檔案
- `"Basic"` - VB.NET 檔案
- `"CSS"`, `"LESS"`, `"SCSS"` - 樣式檔案
- `"TypeScript"`, `"JavaScript"` - 指令碼檔案
- `"HTML"`, `"HTMLX"` - HTML 檔案
- `"XML"` - XML 檔案
- `"JSON"` - JSON 檔案

### 5. 影像與圖示

使用來自 VS 影像編目的 `KnownMonikers`：

```csharp
public ImageMoniker IconMoniker => KnownMonikers.Settings;
```

在 VSCT 中：
```xml
<Icon guid="ImageCatalogGuid" id="Settings"/>
<CommandFlag>IconIsMoniker</CommandFlag>
```

## 測試

- 使用 `[VsTestMethod]` 進行需要 VS 上下文的測試
- 盡可能模擬 (Mock) VS 服務
- 將商務邏輯與 VS 整合分開進行測試

## 常見陷阱

| 陷阱 | 解決方案 |
|---------|----------|
| 封鎖 UI 執行緒 | 務必使用 `async`/`await` |
| 在背景執行緒上建立 WPF | 先呼叫 `SwitchToMainThreadAsync()` |
| 忽略取消權杖 (cancellation tokens) | 在非同步鏈中傳遞它們 |
| VSCommandTable.cs 不一致 | 修改 VSCT 後重新產生 |
| 硬編碼 GUID | 使用 `PackageGuids` 和 `PackageIds` 常數 |
| 吞掉例外狀況 | 使用 `await ex.LogAsync()` 記錄 |
| 缺少 DynamicVisibility | `BeforeQueryStatus` 正常運作所需 |
| 使用 `.Result`, `.Wait()` | 會導致死結；務必使用 `await` |
| 硬編碼顏色 | 使用 VS 主題顏色 (`EnvironmentColors`) |
| `async void` 方法 | 改用 `async Task` |

## 驗證

建構並驗證擴充功能：

```bash
msbuild /t:rebuild
```

確保在 `.editorconfig` 中啟用了分析器：

```ini
dotnet_diagnostic.VSSDK*.severity = error
dotnet_diagnostic.VSTHRD*.severity = error
```

在發布前於 VS 實驗執行個體 (Experimental Instance) 中進行測試。

## NuGet 套件

| 套件 | 用途 |
|---------|---------|
| `Community.VisualStudio.Toolkit.17` | 簡化 VS 擴充功能開發 |
| `Microsoft.VisualStudio.SDK` | 核心 VS SDK |
| `Microsoft.VSSDK.BuildTools` | VSIX 建構工具 |
| `Microsoft.VisualStudio.Threading.Analyzers` | 執行緒分析器 |
| `Microsoft.VisualStudio.SDK.Analyzers` | VSSDK 分析器 |

## 資源

- [Community.VisualStudio.Toolkit](https://github.com/VsixCommunity/Community.VisualStudio.Toolkit)
- [VS 擴充性文件](https://learn.microsoft.com/en-us/visualstudio/extensibility/)
- [VSIX 社群範例](https://github.com/VsixCommunity/Samples)

## README 和 Marketplace 展示

一份好的 README 在 GitHub 和 VS Marketplace 上都能發揮作用。Marketplace 使用 README.md 作為擴充功能的說明頁面。

### README 結構

```markdown
[marketplace]: https://marketplace.visualstudio.com/items?itemName=Publisher.ExtensionName
[repo]: https://github.com/user/repo

# 擴充功能名稱

[![Build](https://github.com/user/repo/actions/workflows/build.yaml/badge.svg)](...)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/Publisher.ExtensionName)][marketplace]
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/Publisher.ExtensionName)][marketplace]

從 [Visual Studio Marketplace][marketplace] 下載此擴充功能
或取得 [CI 建構版本](http://vsixgallery.com/extension/ExtensionId/)。

--------------------------------------

**用一句話吸引使用者購買/下載擴充功能的宣傳語。**

![螢幕截圖](art/screenshot.png)

## 功能

### 功能 1
附帶螢幕截圖的描述...

## 如何使用
...

## 授權
[Apache 2.0](LICENSE)
```

### README 最佳實務

| 元素 | 指引 |
|---------|-----------|
| **標題** | 使用與 vsixmanifest 中 `DisplayName` 相同的名稱 |
| **宣傳語** | 粗體，緊接在徽章 (badges) 之後的一句話價值主張 |
| **螢幕截圖** | 放置在 `/art` 資料夾中，使用相對路徑 (`art/image.png`) |
| **圖片大小** | 保持在 1MB 以下，寬度 800-1200px 以確保清晰度 |
| **徽章** | 版本、下載次數、評分、建構狀態 |
| **功能章節** | 針對每個主要功能使用 H3 (`###`) 並附帶螢幕截圖 |
| **鍵盤快速鍵** | 格式化為 **Ctrl+M, Ctrl+C**（粗體） |
| **表格** | 非常適合比較選項或列出功能 |
| **連結** | 在頂部使用參考樣式連結，使 Markdown 更簡潔 |

### VSIX 資訊清單 (source.extension.vsixmanifest)

```xml
<Metadata>
  <Identity Id="ExtensionName.guid-here" Version="1.0.0" Language="en-US" Publisher="Your Name" />
  <DisplayName>擴充功能名稱</DisplayName>
  <Description xml:space="preserve">低於 200 字元且具吸引力的簡短描述。這會出現在搜尋結果和擴充功能動態磚中。</Description>
  <MoreInfo>https://github.com/user/repo</MoreInfo>
  <License>Resources\LICENSE.txt</License>
  <Icon>Resources\Icon.png</Icon>
  <PreviewImage>Resources\Preview.png</PreviewImage>
  <Tags>關鍵字 1, 關鍵字 2, 關鍵字 3</Tags>
</Metadata>
```

### 資訊清單最佳實務

| 元素 | 指引 |
|---------|-----------|
| **DisplayName** | 3-5 個字，不要包含 "for Visual Studio"（已隱含） |
| **Description** | 200 字元以下，專注於價值而非功能。出現在搜尋結果中 |
| **Tags** | 5-10 個相關關鍵字，以逗號分隔，有助於提高可發現性 |
| **Icon** | 128x128 或 256x256 PNG，簡單設計且在小尺寸下清晰可見 |
| **PreviewImage** | 200x200 PNG，可以與圖示相同，或是功能螢幕截圖 |
| **MoreInfo** | 連結到 GitHub 存放庫以獲取文件和問題追蹤 |

### 撰寫技巧

1. **以利益領先，而非功能** - 「停止與 XML 註釋搏鬥」優於「XML 註釋格式化程式」
2. **展示，而非空談** - 螢幕截圖比描述更有說服力
3. **使用一致的術語** - 確保 README、資訊清單和 UI 之間的用語一致
4. **保持描述易於掃描** - 短段落、點列式項目、表格
5. **包含鍵盤快速鍵** - 使用者喜愛生產力技巧
6. **新增「為什麼」章節** - 在提供解決方案之前先解釋問題
