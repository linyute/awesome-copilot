---
name: 'resx-source-generator-migration'
description: '將在 .resx 背後使用已簽入之 .designer.cs 檔案的專案，遷移至改用原始程式碼產生器 (source-generator)'
disable-model-invocation: true
---

你的目標是將專案遷移為對 .resx 檔案使用原始程式碼產生器 (source-generator)，而非已簽入的 .designer.cs 檔案。

## 使用者輸入

使用以下的使用者輸入補充底下的指示。
使用者輸入可能是指向 msbuild 專案檔的絕對路徑或儲存機制相對路徑，或是包含待遷移 msbuild 專案的目錄。

```text
$ARGUMENTS
```

## 遷移

完成以下每個子小節。

### 選擇採用原始程式碼產生器

在新增套件之前，先檢查目標的套件管理設定以及已設定的 NuGet 來源：

1. 若儲存機制集中管理套件版本，且已存在 `Microsoft.CodeAnalysis.ResxSourceGenerator` 的 `PackageVersion`，請將此不帶版本的參考新增至專案檔中的 `ItemGroup`：

```xml
<PackageReference Include="Microsoft.CodeAnalysis.ResxSourceGenerator" PrivateAssets="all" />
```

2. 若不存在集中版本，請選取與目標 SDK/編譯器相容的套件版本，並遵循儲存機制既有的版本管理模式。在 `PackageReference` 上指定版本，或新增對應的集中 `PackageVersion`。
3. 驗證已設定的 NuGet 來源是否能解析所選套件。若無法解析，請在變更摘要摘要設定（feed configuration）前先詢問使用者。

### 移除 .resx 程式碼後置 (code-behind) 檔案的痕跡

搜尋與 resx 檔案相關的任何 msbuild 項目。
它們通常成對出現，如下所示：

```xml
<ItemGroup>
  <Compile Update="Strings.Designer.cs">
    <DesignTime>True</DesignTime>
    <AutoGen>True</AutoGen>
    <DependentUpon>Strings.resx</DependentUpon>
  </Compile>
</ItemGroup>

<ItemGroup>
  <EmbeddedResource Update="Strings.resx">
    <Generator>ResXFileCodeGenerator</Generator>
    <LastGenOutput>Strings.Designer.cs</LastGenOutput>
  </EmbeddedResource>
</ItemGroup>
```

請注意，你也可能會在 .resx 項目中看到 `<Generator>PublicResXFileCodeGenerator</Generator>`（或以 `<CustomTool>` 取代 `<Generator>`）作為 metadata。

對於要遷移的每個強型別 .resx 檔案，請使用以下所有訊號來識別其產生的 designer 檔案：

- `EmbeddedResource` 項目上的 `LastGenOutput` metadata；
- 其 `DependentUpon` metadata 指向該 .resx 檔案的 `Compile` 項目；以及
- 磁碟上相符的 `*.Designer.cs` 檔案，即使 SDK 隱式包含該檔案且不存在 `Compile` 項目也是如此。

在刪除候選檔案之前，請檢查其內容並確認它是產生的資源存取子，例如包含 `ResourceManager`、`Culture` 以及擷取資源值之屬性的類別。僅憑相符的檔案名稱是不夠的。請勿刪除包含 UI 初始化（例如 `InitializeComponent`）的 WinForms 或控制項 designer 檔案；這些檔案通常位於同名的 .resx 檔案旁，且其 `DependentUpon` metadata 指向表單或控制項原始程式碼檔案，而非 .resx 檔案。

另外請確認該 designer 所公開的每個資源皆為字串，且該 .resx 檔案不包含影像、圖示、位元組陣列、序列化物件或其他非字串值。此原始程式碼產生器會發出由 `ResourceManager.GetString` 支援的字串存取子；它並非非字串資源屬性的相容替代方案。如果存在任何非字串資源，請勿刪除 designer 或遷移該資源檔。保留其既有的產生方式，或者若套件會處理該檔案，請設定 `<GenerateSource>false</GenerateSource>`。

在刪除之前，請在方案中搜尋存取子型別的每次使用與宣告。`ResXFileCodeGenerator` 會發出非靜態類別，而此原始程式碼產生器則發出 `static partial` 類別。請找出物件建構、執行個體存取、繼承、作為泛型型別引數使用（包含 `IStringLocalizer<T>`），以及具有執行個體成員、基底型別或介面的現有 partial 宣告。在遷移前，請將每個不相容的使用重構為靜態產生的 API，並使每個 partial 宣告相容。若這樣做不合適，請保留現有的 designer，並為該資源檔案設定 `<GenerateSource>false</GenerateSource>`。

對於每個關聯的 designer 檔案：

1. 從磁碟中刪除 `*.Designer.cs` 檔案。
2. 當專案中存在其明確的 MSBuild 項目時，將其移除。

### 更新 EmbeddedResource 項目

在移除 metadata 之前，先對每個 .resx 檔案進行分類。遷移先前使用 `ResXFileCodeGenerator` 或 `PublicResXFileCodeGenerator`，或者有關聯產生之 designer 檔案的強型別資源。架構與 designer 資源（例如 WinForms 表單資源）通常不得產生存取子；請在其 `EmbeddedResource` 項目中加入此 metadata 以保留它們：

```xml
<GenerateSource>false</GenerateSource>
```

否則原始程式碼產生器預設會為非特定文化特性 (non-culture) 的 .resx 檔案產生存取子，這可能會與表單或其他架構產生的型別產生型別名稱衝突。

依照以下方式處理每個正在遷移的強型別 `EmbeddedResource`：

1. 移除 `LastGenOutput` metadata。
2. 若 `Generator` 或 `CustomTool` metadata 設定為 `PublicResXFileCodeGenerator`，請在該項目中新增 `<Public>true</Public>` metadata。
3. 移除 `Generator`（或 `CustomTool`）metadata。
4. 若 `EmbeddedResource` 項目在移除這些 metadata 後沒有剩餘的 metadata，請僅在驗證 SDK 已隱式包含該 .resx 檔案且已啟用預設 embedded-resource 項目之後，才將其移除。否則請保留明確的 `Include` 或等效項目，使資源保留在建構後的組件中。
5. 若你看到 `CustomToolNamespace` metadata，請參閱該主題的特殊章節。

## `CustomToolNamespace` metadata 特殊處理

當 `EmbeddedResource` 項目具有 `CustomToolNamespace` metadata 時，需要進行特殊處理。

`ClassName` metadata 會取代 `CustomToolNamespace`，但請注意它需要完整的類別名稱，而不僅僅是命名空間。例如，若原本為：

```xml
<EmbeddedResource Update="Strings.resx">
  <Generator>ResXFileCodeGenerator</Generator>
  <LastGenOutput>Strings.Designer.cs</LastGenOutput>
  <CustomToolNamespace>My.Namespace</CustomToolNamespace>
</EmbeddedResource>
```

它將變成：

```xml
<EmbeddedResource Update="Strings.resx">
  <ClassName>My.Namespace.Strings</ClassName>
</EmbeddedResource>
```

**在開始遷移之前，向使用者呈現以下選項：**

1. **偏好做法：** 捨棄 `CustomToolNamespace` metadata 並接受預設產生的命名空間和類別名稱。這可能需要修正參照舊版所產生程式碼後置檔案的原始程式碼。若沒有 `ClassName` metadata，原始程式碼產生的類別將位於 `<RootNamespace>.<RelativeFolderPath>` 命名空間中，並以 resx 檔案名稱命名。考慮在受影響的檔案中新增 using 別名：
   ```csharp
   using SomeResourceFile = FullNamespace.TypeName;
   ```

2. 將其重寫為 `ClassName` metadata，包含完整命名空間和類別名稱（例如 `MyNamespace.MyResources`）。此值將成為所產生存取子的完整型別名稱；除非個別覆寫，否則原生的值仍為資訊清單資源名稱。

### 解決命名空間/型別衝突

當編譯器發出關於型別與命名空間共用相同名稱的錯誤時（其中識別碼與包含 .resx 檔案的目錄名稱相符）：
- 將 .resx 檔案移出該資料夾以移除衝突的命名空間宣告，或
- 完整限定型別參照以解決建構中斷問題。

## 偵錯提示

- 使用 `/p:EmitCompilerGeneratedFiles=true` 進行建構，以將原始程式碼產生的檔案寫入磁碟以供檢查。
- 你可能還需要 `/p:CompilerGeneratedFilesOutputPath=<path>` 以避免 Windows 路徑長度問題。

## 驗證

建構遷移後的專案。

建構成功後，請依據取用方式驗證每個資源系列：

1. 對於每個已遷移的中性字串資源，使用儲存機制現有的測試或可用的 .NET 測試/主控台主機存取至少一個產生的屬性，並驗證它是否傳回預期的字串。當 `pwsh` 可用時，從 PowerShell 使用反映 (Reflection) 是一種選用做法，而非必要條件。
2. 對於特定文化特性的附屬 (satellite) 資源，切換至具代表性的文化特性，並驗證中性存取子是否傳回預期的本地化字串。不要期望為每個附屬檔案產生個別的存取子。
3. 對於標記為 `GenerateSource=false` 的架構、designer、非字串或其他資源，執行其實際取用者，例如具現化 WinForms 表單/控制項，或透過保留的資源 API 載入影像/物件。
4. 確認每個 .resx 檔案仍內嵌在預期的主要或附屬組件中。
