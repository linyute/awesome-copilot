---
name: 'roslyn-analyzers'
description: '建構、審查、偵錯、封裝及測試 Roslyn 診斷分析器、程式碼修正提供者與增量原始程式碼產生器。適用於 DiagnosticAnalyzer、CodeFixProvider、IIncrementalGenerator、IOperation 分析、Microsoft.CodeAnalysis 相依性釘選、Roslyn 測試載具、C#/VB 測試以及分析器 NuGet 封裝。'
---

# Roslyn 分析器與原始程式碼產生器

當新增或變更 Roslyn 分析器、程式碼修正、原始程式碼產生器、測試、相依性或套件配置時，請使用此工作流程。首先檢查儲存機制的目標架構、集中套件管理、測試架構、分析器與產生器慣例、診斷識別碼 (Diagnostic ID) 配置、本地化以及封裝。除非既定慣例與下列相容性規則衝突，否則請予以保留。

## 不可妥協的設計規則

- 盡可能優先使用基於 `IOperation` 的分析。註冊最窄適用的 `OperationKind`，並檢查具型別的作業，例如 `IInvocationOperation`、`IAwaitOperation` 或 `IObjectCreationOperation`。這通常只需一個分析器即可同時支援 C# 和 VB，並能直接存取符號與轉換。
- 僅對本質上的語法規則或 `IOperation` 無法充分表示的語法使用語法分析。語法節點回呼已具有 `SemanticModel`；請勿呼叫 `Compilation.GetSemanticModel` 或從中擷取另一個語意模型。重複建立語意模型成本高昂，且通常表示作業或符號動作是更好的抽象概念。
- 每個分析器都必須支援 C#。VB.NET 支援為選用，直到有要求或儲存機制既有慣例有所規範為止。語言中立的作業分析器可以宣告兩種語言。若承諾支援 VB，請在測試中納入等效的 C# 和 VB 程式碼片段；不要僅憑共用實作就推斷 VB 的正確性。
- 將分析器與程式碼修正提供者保留在不同的組件中。分析器專案絕不能參照 Roslyn Workspaces 套件。Workspaces 相依性僅屬於程式碼修正和測試專案。
- 分析器回呼必須是無狀態或並行安全的。呼叫 `EnableConcurrentExecution()`。使用 `ConfigureGeneratedCodeAnalysis(...)` 明確選擇產生的程式碼處理方式；遵循儲存機制政策，而非默默接受預設值。
- 在 API 公開語彙基元 (token) 之處遵守取消作業。不要在靜態狀態中保留編譯、作業、語法樹狀結構、符號或語意模型。
- 避免使用 `InternalsVisibleTo`。透過分析器的公用 `DiagnosticAnalyzer` 和 `CodeFixProvider` API 以及 Roslyn 測試載具來測試分析器。當直接測試確實有用時，小型分析器協助程式可以是 public，但大多數行為應該進行端對端測試。
- 集中管理 metadata 名稱和成員名稱，而不是散播神奇字串 (magic strings)。對完整限定型別名稱、命名空間和 API 成員名稱使用單一共用靜態目錄。
- 絕不要透過呼叫 `ToDisplayString()` 並將結果與字串常值比較來識別符號（包括屬性類別）。從 `Compilation` 中依 metadata 名稱解析一次預期的具名型別。要解析方法、屬性、欄位或事件，請先解析其包含型別，然後依名稱與特徵標記選取預期的成員。使用 `SymbolEqualityComparer.Default.Equals(actual, expected)` 比較遇到的符號。當泛型取代不相關時，以 `OriginalDefinition` 比較具名型別、屬性、欄位和事件；比較方法時，先以 `ReducedFrom ?? method` 取代已簡化的延伸方法，再取 `OriginalDefinition`。正規化預期的與遇到的符號，並在型別引數是比對的一部分時，單獨檢查型別引數。顯示字串是用於呈現而非識別，且可能因格式化、別名、限定、可為 null 性及其他上下文而異。
- 記載每個診斷識別碼。當儲存機制使用 Docfx 時，請將分析器文件放在其 Docfx 樹狀結構下（通常是 `docfx/analyzers`），並將每個頁面納入相關的目錄中。
- 將每個分析器組件的版本設定得足夠精確，使每次認可 (commit) 都產生唯一的組件版本。使用 Nerdbank.GitVersioning 時，請給予每個分析器專案自己的 `version.json`，並將 `assemblyVersion.precision` 設定為 `revision`，同時確保全儲存機制範圍的 MSBuild 屬性不會阻止搜尋到該檔案。
- 原始程式碼產生器必須實作 `IIncrementalGenerator`，而非 `ISourceGenerator`。設計提供者圖形，使未變更的輸入保持快取，且不會重新產生輸出。
- 原始程式碼產生器必須使用小型 `SourceWriter` 抽象概念，以確保確定性的換行、縮排、編碼和平衡輸出。從 [SourceWriter.cs](./references/SourceWriter.cs) 開始，並根據接收端儲存機制調整其命名空間和目標架構詳細資料。

## 實作工作流程

1. 寫下必須回報的範例以及不得回報的擦身而過情況。在實作前確定確切的診斷範圍與訊息引數。
2. 判斷規則是否為語意規則。依序優先選擇：作業動作、作業區塊動作、符號動作、註冊上述動作之一的編譯開始動作，最後才是語法動作。
3. 在編譯開始動作中，使用 `Compilation.GetTypeByMetadataName` 一次性解析已知的具名型別。從結果的包含型別中，依名稱與完整特徵標記解析預期的成員；`GetTypeByMetadataName` 不會解析方法、屬性、欄位或事件。若所需的型別或成員不存在，則不註冊任何內部動作。在已註冊的回呼中擷取已解析的 `ISymbol`，並使用 `SymbolEqualityComparer.Default.Equals` 比較遇到的符號。當泛型取代不相關時，在比較之前，使用 `OriginalDefinition` 正規化預期的與遇到的具名型別、屬性、欄位和事件；這包括將 `AttributeData.AttributeClass` 與已解析的泛型屬性定義進行比較。對於方法，使用 `(method.ReducedFrom ?? method).OriginalDefinition` 正規化每個 `IMethodSymbol`，使已建構的泛型方法和已簡化的延伸方法與其宣告相符。當型別引數重要時，單獨檢查它們。絕不要使用 `ToDisplayString()` 加上字串常值作為符號識別的替代。在選取成員時，依適當情況檢查 metadata 名稱、參數數、包含型別和特徵標記；不要僅憑簡單的方法名稱來識別 API。
4. 定義穩定的診斷識別碼與描述項。遵循儲存機制在分類、嚴重性、本地化、說明連結、遙測標籤和發行追蹤方面的做法。
5. 新增或更新診斷的文件頁面，並將描述項的 `HelpLinkUri` 連接至其發佈的 URL。
6. 回報最小且有用的原始程式碼位置。除非是有意為之，否則避免在產生的程式碼上產生診斷。
7. 在獨立的程式碼修正組件中新增或更新程式碼修正。保留 trivia、使用語法產生器或具型別的語法 API、在適當之處標註可簡化/可格式化的節點、為相異動作提供穩定的等效索引鍵，並僅在批次套用正確時才提供 `FixAllProvider`。
8. 在此規則的單一測試類別中新增正向、反向、邊界和程式碼修正測試。
9. 驗證每個分析器專案是否都具有每次認可組件版本控制，且其實際遵守專案本地的版本設定。
10. 先執行窄範圍的測試類別或方法，接著是測試專案，最後是儲存機制的正常建構或分析器驗證。遵守儲存機制的測試執行器語法；不要假設支援 VSTest `--filter`。

對於原始程式碼產生器，請將步驟 1-8 替換為：定義產生的 API 範例和無效輸入診斷；建立每個獨立輸入的模型；建構增量提供者圖形；使用 `SourceWriter` 呈現；並在繼續進行版本控制、封裝和儲存機制驗證之前，測試輸出、診斷、確定性與增量快取。

## 分析器模式

這是語意規則的慣用架構。根據本地慣例調整描述項建構和產生的程式碼政策。

```csharp
using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Operations;

[DiagnosticAnalyzer(LanguageNames.CSharp)]
public sealed class AvoidBlockingAnalyzer : DiagnosticAnalyzer
{
    public const string DiagnosticId = "LIB0001";

    private static readonly DiagnosticDescriptor Rule = new(
        DiagnosticId,
        "Avoid blocking calls",
        "Do not call '{0}'",
        "Usage",
        DiagnosticSeverity.Warning,
        isEnabledByDefault: true);

    public override ImmutableArray<DiagnosticDescriptor> SupportedDiagnostics => [Rule];

    public override void Initialize(AnalysisContext context)
    {
        context.EnableConcurrentExecution();
        context.ConfigureGeneratedCodeAnalysis(GeneratedCodeAnalysisFlags.None);
        context.RegisterCompilationStartAction(static context =>
        {
            INamedTypeSymbol? taskType = context.Compilation.GetTypeByMetadataName(KnownApis.Task.FullName);
            if (taskType is null)
            {
                return;
            }

            context.RegisterOperationAction(
                operationContext => AnalyzeInvocation(operationContext, taskType),
                OperationKind.Invocation);
        });
    }

    private static void AnalyzeInvocation(OperationAnalysisContext context, INamedTypeSymbol taskType)
    {
        var invocation = (IInvocationOperation)context.Operation;
        IMethodSymbol method = invocation.TargetMethod;
        if (method.Name == KnownApis.Task.Wait &&
            SymbolEqualityComparer.Default.Equals(method.ContainingType, taskType))
        {
            context.ReportDiagnostic(Diagnostic.Create(
                Rule,
                invocation.Syntax.GetLocation(),
                method.Name));
        }
    }
}

public static class KnownApis
{
    public static class Task
    {
        public const string FullName = "System.Threading.Tasks.Task";
        public const string Wait = "Wait";
    }
}
```

當支援兩種語言時，僅在所有分析和診斷位置實際上均為語言中立，或兩種語言已分別處理並測試時，才使用 `[DiagnosticAnalyzer(LanguageNames.CSharp, LanguageNames.VisualBasic)]`。

## 語法分析例外

僅在語法本身控制規則時才使用語法回呼。若語意資訊不可避免，請使用回呼現有的語意模型：

```csharp
private static void AnalyzeNode(SyntaxNodeAnalysisContext context)
{
    var invocation = (InvocationExpressionSyntax)context.Node;
    ISymbol? symbol = context.SemanticModel.GetSymbolInfo(invocation, context.CancellationToken).Symbol;
    // 請勿呼叫 context.Compilation.GetSemanticModel(invocation.SyntaxTree)。
}
```

在選擇此模式之前，請檢查 `IInvocationOperation.TargetMethod`、`IArgumentOperation.Parameter`、`IConversionOperation` 或其他作業是否提供相同的資訊。

## 增量原始程式碼產生器

一律實作 `IIncrementalGenerator`。不要使用 `AsSourceGenerator` 包裝 `ISourceGenerator`；那樣會保留舊的執行模型，而非為增量性而設計。

建構具有以下特性的管線：

- 使用 `SyntaxProvider.ForAttributeWithMetadataName` 進行屬性 (attribute) 驅動的探索。否則，使用帶有極輕量語法述詞的 `CreateSyntaxProvider`，且僅在其轉換中執行語意工作。
- 立即將語法和符號轉換為小型不可變、依值相等 (value-equatable) 的模型，且僅包含產生所需的資訊。不要將 `SyntaxNode`、`ISymbol`、`SemanticModel` 或 `Compilation` 帶入後續階段，因為它們的識別項變更會使快取失效。
- 將獨立輸入保留在獨立的提供者中。盡可能晚地合併提供者。避免僅為了方便而將每個項目與 `CompilationProvider` 合併。
- 除非單一輸出確實相依於完整集合，否則避免使用 `Collect()`。偏好每個模型產生一個輸出，因此編輯一個宣告只會使該輸出失效。
- 使用穩定的相等性比較。Record 與不可變實值型別 (immutable value types) 是良好的模型；當一般相等性無法代表語意等效時，請新增 `WithComparer`。
- 保持轉換與輸出回呼為靜態、純粹、具確定性且能感知取消作業。不要讀取外圍檔案、時鐘、環境狀態或可變靜態狀態。將設定、附加檔案、分析器設定選項和剖析選項模型化為明確的提供者。
- 在開發或測試增量行為時，為提供者指定 `WithTrackingName` 標籤。
- 產生穩定且具防衝突性的提示名稱 (hint names)。在發出輸出之前明確排序任何彙總的輸入。
- 使用產生器診斷回報無效的使用者輸入，而非擲回例外狀況。產生器的例外狀況會呈現為編譯器失敗。
- 呼叫 `AddSource` 時使用帶有明確編碼的 `SourceText`。

精簡的管線應如下所示：

```csharp
[Generator(LanguageNames.CSharp)]
public sealed class FactoryGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        IncrementalValuesProvider<TypeModel> models = context.SyntaxProvider
            .ForAttributeWithMetadataName(
                "Product.GenerateFactoryAttribute",
                static (node, _) => node is TypeDeclarationSyntax,
                static (attributeContext, cancellationToken) =>
                    TypeModel.Create(attributeContext, cancellationToken))
            .WithTrackingName("FactoryModels");

        context.RegisterSourceOutput(models, static (productionContext, model) =>
        {
            var writer = new SourceWriter();
            writer.WriteLine("// <auto-generated/>");
            writer.WriteLine($"namespace {model.Namespace};");
            writer.WriteLine();
            writer.WriteLine($"partial class {model.TypeName}");
            writer.WriteLine('{');
            writer.Indentation++;
            writer.WriteLine($"public static {model.TypeName} Create() => new();");
            writer.Indentation--;
            writer.WriteLine('}');
            productionContext.AddSource(model.HintName, writer.ToSourceText());
        });
    }
}
```

模型建立步驟必須將符號資料標準化為字串、布林值、列舉和其他不可變值，驗證不受支援的宣告，逸出識別碼，並衍生穩定的提示名稱。輸出回呼應僅呈現模型。使用完整的 [SourceWriter.cs](./references/SourceWriter.cs) 範例，而非臨時的 `StringBuilder` 串接，然後根據儲存機制調整縮排樣式和架構相容性。

### 產生器測試

使用 `GeneratorDriver` 或儲存機制的產生器測試載具來測試原始程式碼產生器。涵蓋：

- 精確產生的提示名稱與原始程式碼文字；
- 多個與巢狀宣告、命名空間、泛型、逸出識別碼與 partial 型別；
- 格式錯誤或不受支援的輸入及其診斷位置；
- 取用附加檔案、分析器設定選項與剖析選項時的狀況；
- 獨立於輸入列舉與作業系統換行字元的確定性輸出；
- 使用相同輸入進行第二次驅動器執行，該執行應快取所有預期的追蹤步驟；
- 微幅變更的輸入僅重新執行受影響的管線和輸出；
- 編譯產生的輸出且沒有非預期的診斷。

在測試中啟用增量步驟追蹤，並根據使用中的 Roslyn 版本斷言執行原因，例如快取 (cached)、未變更 (unchanged)、已修改 (modified) 或新產生 (newly produced)。不要滿足於僅快照的測試：相同的產生文字可能會掩蓋重新計算所有內容的管線。

## 診斷文件與說明連結

為每個診斷代碼建立一個可被探索的文件頁面。有用的頁面包括：

- 診斷識別碼、標題、分類與預設嚴重性；
- 觸發診斷的確切條件；
- 為何回報的模式有問題；
- 不良與修正後的 C# 範例；
- 承諾支援 VB 時的 VB 範例；
- 相關時的例外狀況、設定、隱藏指引與程式碼修正行為。

若儲存機制具有 Docfx 網站，請將這些頁面置於其既有的分析器文件區域下，通常為：

```text
docfx/
    analyzers/
        LIB0001.md
    toc.yml
```

遵循網站現有的 URL 與導覽慣例。將每個頁面新增至適用的 `toc.yml`，以便呈現且可供探索。描述項的說明連結必須是 Docfx 將產生的公用 GitHub Pages URL，而非原始碼樹狀結構路徑。當所有診斷共用相同路由時，集中進行建構：

```csharp
private static string GetHelpLink(string diagnosticId)
        => $"https://example.github.io/product/analyzers/{diagnosticId}.html";

private static readonly DiagnosticDescriptor Rule = new(
        id: DiagnosticId,
        title: "Avoid blocking calls",
        messageFormat: "Do not call '{0}'",
        category: "Usage",
        defaultSeverity: DiagnosticSeverity.Warning,
        isEnabledByDefault: true,
        helpLinkUri: GetHelpLink(DiagnosticId));
```

從儲存機制的 Docfx 設定和部署設定中衍生確切的主機名稱、基底路徑、輸出副檔名、大小寫與路由。確認產生的網站路由與 `HelpLinkUri` 相符；不要僅僅假設 Markdown 路徑會對應至預期的 URL。當不存在 Docfx 資料夾時，請遵循儲存機制既有的文件系統，或建立等效的永久頁面與公用說明 URL。

## 專案與相依性界限

一般的方案具有三個專案：

```text
Product.Analyzers          -> 僅 Microsoft.CodeAnalysis.Common/CSharp
Product.CodeFixes          -> Product.Analyzers + Roslyn Workspaces/Features API
Product.Analyzers.Tests    -> 分析器 + 程式碼修正專案 + 當前測試套件
```

保守地設定分析器組件的目標，通常為 `netstandard2.0`，除非主機要求另有規定。將分析器的 Roslyn 版本視為主機相容性下限，而非例行浮動的相依性。

為發佈的分析器專案選擇確切的一個 Roslyn 參考組件版本。將其與程式碼修正測試或儲存機制其餘部分使用的最新 Roslyn 版本分開獨立釘選。將分析器相依性的整個遞移封閉 (transitive closure) 釘選為彼此相容的版本，包括在還原中出現的套件，例如 `System.Collections.Immutable`、`System.Memory`、`System.Reflection.Metadata`、`System.Runtime.CompilerServices.Unsafe` 以及 `System.Threading.Tasks.Extensions`。僅直接釘選 `Microsoft.CodeAnalysis.*` 是不夠的：較新的集中管理遞移相依性可能會導致分析器在較舊的編譯器主機中失敗。

在集中套件管理下，於儲存機制根目錄建立專用的 `Directory.Packages.Analyzers.props`，且僅針對發佈的分析器、原始程式碼產生器和程式碼修正專案匯入它。不要將這些覆寫混入一般的 `Directory.Packages.props` 中：獨立的檔案使相容性界限清晰可見，並允許相依性自動化工具對其進行特殊處理。

使用此三部分模式。

首先，讓每個發佈的分析器、原始程式碼產生器和程式碼修正專案匯入一個共用的 props 檔案，例如 `src/AnalyzerCompatibility.props`。該檔案應識別專案：

```xml
<Project>
    <PropertyGroup>
        <!-- 設定此項是為了讓 Directory.Packages.Analyzers.props 可以套用特定於分析器專案的版本覆寫。 -->
        <IsAnalyzerCompatibilityProject>true</IsAnalyzerCompatibilityProject>
    </PropertyGroup>
</Project>
```

其次，在集中套件版本可用之後，從全儲存機制範圍的 props 或 targets 檔案有條件地匯入專用套件檔案：

```xml
<Import Project="$(MSBuildThisFileDirectory)Directory.Packages.Analyzers.props"
                Condition="'$(IsAnalyzerCompatibilityProject)' == 'true'" />
```

第三，複製此 `Directory.Packages.Analyzers.props` 結構，並根據支援的最舊編譯器或 SDK 主機調整基準註解、Roslyn 版本和遞移版本。僅針對儲存機制的集中套件檔案已宣告的套件使用 `Update`；使用 `Include` 為原本僅遞移的套件新增釘選。此範例假設 Roslyn 套件已宣告，且列出的執行階段相依性為新釘選：

```xml
<Project>
    <!-- 選擇這些版本是為了支援此處指名的最舊編譯器/SDK 主機。 -->
  <PropertyGroup>
        <CodeAnalysisVersionForAnalyzers>4.11.0</CodeAnalysisVersionForAnalyzers>
      <!-- 將分析器相容性釘選套用至僅以遞移方式參照的套件。 -->
      <CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>
  </PropertyGroup>
  <ItemGroup>
        <PackageVersion Update="Microsoft.CodeAnalysis" Version="$(CodeAnalysisVersionForAnalyzers)" />
        <PackageVersion Update="Microsoft.CodeAnalysis.Common" Version="$(CodeAnalysisVersionForAnalyzers)" />
        <PackageVersion Update="Microsoft.CodeAnalysis.CSharp" Version="$(CodeAnalysisVersionForAnalyzers)" />
        <PackageVersion Include="Microsoft.CodeAnalysis.CSharp.Workspaces" Version="$(CodeAnalysisVersionForAnalyzers)" />
        <PackageVersion Update="Microsoft.CodeAnalysis.VisualBasic" Version="$(CodeAnalysisVersionForAnalyzers)" />
        <PackageVersion Include="Microsoft.CodeAnalysis.VisualBasic.Workspaces" Version="$(CodeAnalysisVersionForAnalyzers)" />
        <PackageVersion Include="Microsoft.Bcl.AsyncInterfaces" Version="8.0.0" />
        <PackageVersion Include="System.Collections.Immutable" Version="8.0.0" />
        <PackageVersion Include="System.Memory" Version="4.5.5" />
        <PackageVersion Include="System.Reflection.Metadata" Version="8.0.0" />
        <PackageVersion Include="System.Runtime.CompilerServices.Unsafe" Version="6.0.0" />
        <PackageVersion Include="System.Text.Json" Version="8.0.0" />
        <PackageVersion Include="System.Threading.Tasks.Extensions" Version="4.5.4" />
  </ItemGroup>
</Project>
```

這些範例中的 XML 註解是必需的，並非裝飾。在接收端儲存機制中保留等效的註解，解釋為何存在 `IsAnalyzerCompatibilityProject`、為何在目的不明顯時存在條件式匯入、釘選的版本支援哪個最舊主機，以及為何這些版本刻意不同於儲存機制預設值。當有助於維護者選擇正確的編譯器基準時，在基準註解中或旁邊包含 Roslyn 版本支援文件 URL。未來的相依性更新必須保留或更新這些註解，以免使用者將刻意的相容性釘選誤認為過期的套件。

上述版本是結構性範例，並非通用建議。透過檢查解析後的相依性圖形，為選定的最舊主機重新計算完整的套件集合。保留 Roslyn 或產生器在編譯器處理序中載入的每個套件，即使儲存機制沒有直接參照它。`Workspaces` 項目集中釘選程式碼修正專案的版本，但絕不能被分析器或原始程式碼產生器專案參照。測試專案應保留在 `IsAnalyzerCompatibilityProject` 之外，並使用最新經儲存機制核可的 Roslyn 和分析器測試套件，以便測試也能掌握與目前 API 和編譯器的相容性。

一律優先選擇最新可用版本的 `Microsoft.CodeAnalysis.Analyzers`。它是開發時期的分析器套件，而不是編譯器主機的執行階段相依性，因此不需要與 `Microsoft.CodeAnalysis`、`Microsoft.CodeAnalysis.Common`、C#/VB 或 Workspaces 套件版本相符，且不得被退回至分析器相容性基準。將其保持在儲存機制的正常最新版本更新路徑上，並在參照時不將其流向取用者：

```xml
<PackageReference Include="Microsoft.CodeAnalysis.Analyzers" PrivateAssets="all" />
```

請勿將其集中版本設定為 `$(CodeAnalysisVersionForAnalyzers)`，也不要將其納入排除於次要或主要相依性更新的套件中。此例外特別適用於 `Microsoft.CodeAnalysis.Analyzers`；隨發佈分析器或產生器一起載入的套件仍然屬於嚴格釘選的相容性封閉。

設定相依性自動化工具，使分析器基準不會跨 Roslyn 版本升級。對於 Renovate，請隔離分析器版本檔案或套件群組並禁止更新：

```json
{
  "packageRules": [
    {
      "matchFileNames": ["Directory.Packages.Analyzers.props"],
      "enabled": false
    }
  ]
}
```

對於 Dependabot，為每個分析器基準套件使用 `ignore` 項目，其中 `update-types` 包含 `version-update:semver-major`、`version-update:semver-minor` 和 `version-update:semver-patch`。請納入釘選的遞移套件，而不僅是 `Microsoft.CodeAnalysis.*`。若工具無法區分僅用於分析器的集中版本與全儲存機制版本，請將分析器釘選放在專用檔案/目錄中，或將這些升級設為手動。

使用還原圖形或資產檔案驗證相依性隔離，且在可行時，將建構出的分析器載入至支援的最舊編譯器/IDE 主機中。在最新的 SDK 上建構成功並不能證明主機相容性。

## 程式碼修正界限

程式碼修正專案可以參照諸如 `Microsoft.CodeAnalysis.CSharp.Workspaces` 或 `Microsoft.CodeAnalysis.VisualBasic.Workspaces` 之類的套件；分析器專案則不能。從分析器的角度來看，程式碼修正應保持選用。修正應該：

- 僅在診斷可安全修正時註冊；
- 防禦性地從診斷範圍中尋找目標節點；
- 保留開頭/結尾 trivia 和匯入；
- 在適當之處使用 `Simplifier.Annotation` 和 `Formatter.Annotation`；
- 傳回新文件或方案，而不變更共用狀態；
- 支援取消作業並避免封鎖非同步 Roslyn API；
- 使用有意義且穩定的等效索引鍵，特別是當多個修正共用標題時；
- 僅在修正不會衝突或相依於套用順序時才傳回批次修正器。

## 唯一組件版本

分析器主機會根據組件識別身分來快取並識別組件。因此，每個可能變更分析器的認可都應該產生唯一、精確的組件版本；僅依賴套件版本或檔案版本是不夠的。

使用 Nerdbank.GitVersioning 時，請直接在每個分析器專案目錄中放置 `version.json`，包括每個語言專屬的分析器組件（當它們分開時）：

```json
{
    "$schema": "https://raw.githubusercontent.com/dotnet/Nerdbank.GitVersioning/main/src/NerdBank.GitVersioning/version.schema.json",
    "inherit": true,
    "assemblyVersion": {
        "precision": "revision"
    }
}
```

然後檢查所有匯入的 `Directory.Build.props`、`Directory.Build.targets` 和專案 SDK props 是否有 `GitVersionBaseDirectory`。儲存機制可能會將該屬性設定為共用根目錄，以便版本計算僅執行一次；這可能導致專案本地的 `version.json` 被忽略。在每個分析器專案檔中，將其重設為分析器專案本身的目錄：

```xml
<PropertyGroup>
    <!-- 遵守此分析器專案的 version.json，並為每次認可產生唯一的組件識別身分。 -->
    <GitVersionBaseDirectory>$(MSBuildProjectDirectory)</GitVersionBaseDirectory>
</PropertyGroup>
```

在設定該值的任何共用屬性匯入之後套用此覆寫，或以其他方式確保一般 MSBuild 優先順序使專案本地值生效。不要盲目新增覆寫：首先找出控制指派，並確認評估後的分析器專案使用了哪個 `version.json`。

驗證建構後的組件，而不僅僅是檢查 MSBuild 原始碼。在可行時，從兩個不同的認可建構相同的分析器，並確認 `AssemblyName.Version` 有所不同。至少應檢查評估後的 `GitVersionBaseDirectory`、選定的版本檔案以及產生的組件版本。對每個分析器組件重複此操作，而不僅僅是封裝或程式碼修正專案。

## 測試結構

使用 `Microsoft.CodeAnalysis.Testing` 或儲存機制既有的等效項目。為分析器和程式碼修正行為保留每個診斷規則一個測試類別。不要建立個別的程式碼修正測試類別。即使診斷刻意沒有修正，也請使用 `EmptyCodeFixProvider` 具現化相同的分析器加程式碼修正載具；這會將該規則的所有案例和設定保留在一起。

使用 `System.Diagnostics.CodeAnalysis` 中的 `[StringSyntax("c#-test")]` 標註每個接受 C# 原始程式碼的驗證器/協助程式參數。這會在測試呼叫端啟用語法突顯和語言服務。請從 [CSharpCodeFixVerifier.cs](./references/CSharpCodeFixVerifier.cs) 開始取得完整範例，並將該屬性套用至僅分析器和產生器測試協助程式。若目標架構未定義 `StringSyntaxAttribute`，請使用儲存機制的相容性/polyfill 模式。

當 C# 原始程式碼指派給區域變數而非直接傳遞給標註的參數時，請在常值前加入語言註解：

```csharp
const string source = /* lang=c#-test */ """
    // 這裡放置 C# 程式碼
    """;
```

偏好行內標記而非寫死的行/欄範圍：

```csharp
using Verify = CSharpCodeFixVerifier<AvoidBlockingAnalyzer, AvoidBlockingCodeFix>;

public class AvoidBlockingTests
{
    [Fact]
    public async Task ReportsBlockingCallAndFixesIt()
    {
        const string source = /* lang=c#-test */ """
            using System.Threading.Tasks;
            class C
            {
                void M(Task task) => [|task.Wait()|];
            }
            """;
        const string fixedSource = /* lang=c#-test */ """
            using System.Threading.Tasks;
            class C
            {
                async Task M(Task task) => await task;
            }
            """;

        await Verify.VerifyCodeFixAsync(source, fixedSource);
    }

    [Fact]
    public async Task DoesNotReportAwaitedTask()
    {
        const string source = /* lang=c#-test */ """
            using System.Threading.Tasks;
            class C
            {
                async Task M(Task task) => await task;
            }
            """;

        await Verify.VerifyAnalyzerAsync(source);
    }
}
```

對單一診斷使用 `[|bad code|]`，當診斷需要不同的描述項、引數或位置時，使用具名標記如 `{|#0:bad code|}`。使用明確的 `DiagnosticResult` 物件指定識別碼、嚴重性、引數與額外位置，但在載具支援的情況下將它們附加至標記位置。寫死的 `WithSpan(line, column, ...)` 是無法以標記表達位置時的最後手段。

若沒有程式碼修正：

```csharp
using Verify = CSharpCodeFixVerifier<AvoidBlockingAnalyzer, EmptyCodeFixProvider>;
```

需要支援 VB 時，使用對應的 Visual Basic 驗證器，並納入 VB 原始碼、修正後原始碼與反向程式碼片段。保持各語言間共用行為案例的一致性，同時保留語言專屬的剖析器/參考設定。

至少測試：

- 帶有確切診斷範圍的直接正向案例；
- 直接的反向案例；
- 與符號比對相關的完整限定、別名、泛型、繼承、多載與擴充方法形式；
- 相關時的 Null 屬性 (nullability)、隱含轉換、條件式存取、Lambda/區域函式與格式錯誤的程式碼；
- 缺少選用參照的型別或組件；
- 根據宣告政策產生的程式碼；
- 每個提供的程式碼動作與等效索引鍵；
- 宣傳時的全域修正 (fix-all) 行為；
- 保留 trivia、匯入與格式化；
- 針對承諾的每項跨語言行為同時測試 C# 與 VB。

優先使用測試架構提供的參考組件定義，而非從執行中執行階段複製的參考。僅新增情境所需的 metadata 參考和附加檔案。在測試語言版本敏感的語法時，保持測試剖析選項明確。

## 封裝

偏好將分析器組件與其服務的函式庫打包在同一個 NuGet 套件中，使取用者能自動接收診斷。將分析器 DLL 放在適合語言的分析器路徑下，例如 `analyzers/dotnet/cs` 和 `analyzers/dotnet/vb`；不要將它們放在 `lib` 下。根據目標主機/套件慣例納入程式碼修正組件及其所需相依性。

同樣將原始程式碼產生器作為分析器資產進行封裝，通常位於 `analyzers/dotnet/cs` 下。保持產生器執行階段相依性獨立且極簡，因為編譯器主機不會像一般應用程式專案那樣解析相依性。從已封裝的取用者專案驗證產生器載入與產生的輸出。

獨立的 `Product.Analyzers` 套件也是有效做法。在該模型中，主函式庫套件應相依於它並帶有適當的資產 metadata，以便分析器流向取用者而不會成為執行階段相依性。驗證封裝後的 `.nupkg`，而不僅是建構輸出：檢查路徑、相依性、附屬資源、build/buildTransitive 資產，並驗證分析器能從範例取用者專案載入。

## 審查檢查清單

- 實作使用最窄適用的 `IOperation` 或符號動作。
- 每個原始程式碼產生器均實作 `IIncrementalGenerator`，使用不可變且依值相等的管線模型，並具有證明快取與選擇性重新計算的測試。
- 產生的程式碼使用共用的 `SourceWriter` 進行確定性的格式化與編碼。
- 沒有語法回呼會擷取另一個語意模型。
- C# 行為已實作並經過測試；承諾的 VB 行為具有等效的 VB 測試。
- 分析器與程式碼修正組件是分開的，且分析器沒有 Workspaces 相依性。
- 發佈的 Roslyn 參考及其遞移相依性封閉一致地釘選至單一相容性基準。
- `Microsoft.CodeAnalysis.Analyzers` 使用最新可用版本作為私有開發相依性，且不受發佈 Roslyn 基準的拘束。
- 發佈的分析器、原始程式碼產生器和程式碼修正專案設定了 `IsAnalyzerCompatibilityProject`，有條件地匯入專用的 `Directory.Packages.Analyzers.props`，並保留說明相容性基準與覆寫機制的 XML 註解。
- Renovate 或 Dependabot 無法在任何 SemVer 層級（修補程式、次要或主要）自動推進該基準。
- API/型別/成員名稱來自共用目錄，而非散佈的常值。
- 符號與屬性比對會從編譯中解析預期的命名型別，並從其包含型別中依名稱與簽章解析預期的成員。當泛型取代不相關時，使用 `OriginalDefinition` 正規化預期與實際遇到的命名型別、屬性、欄位和事件，使用 `(method.ReducedFrom ?? method).OriginalDefinition` 正規化方法，然後使用 `SymbolEqualityComparer.Default`；它會單獨檢查相關的型別引數，且從不以字面值比較 `ToDisplayString()` 的輸出。
- 每個診斷識別碼都有文件頁面、存在於網站導覽中，且具有與發佈 URL 相符的 `HelpLinkUri`。
- 每個分析器專案在每次認可時產生唯一的組件版本；使用 Nerdbank.GitVersioning 時，其本地 `version.json` 使用修訂版本精度，且任何共用的 `GitVersionBaseDirectory` 均已正確覆寫。
- 測試盡可能使用行內標記，並涵蓋正向與反向行為。
- C# 驗證器參數使用 `[StringSyntax("c#-test")]`，且區域 C# 原始程式碼常值在有用時使用 `/* lang=c#-test */`。
- 單一規則導向的測試類別包含分析器與程式碼修正案例，需要時使用 `EmptyCodeFixProvider`。
- 測試執行公用 API，不使用 `InternalsVisibleTo`。
- 封裝後的套件正確放置分析器資產，並已從取用者專案進行測試。
- 聚焦測試、完整測試專案和儲存機制建構均通過，沒有新的分析器警告。
