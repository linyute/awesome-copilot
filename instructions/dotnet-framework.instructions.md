---
description: '針對 .NET Framework 專案的操作指引。包含專案結構、C# 語言版本、NuGet 管理與最佳實踐。'
applyTo: '**/*.csproj, **/*.cs'
---

# .NET Framework 開發

## 建置與編譯需求
- 請一律使用 `msbuild /t:rebuild` 來建置解決方案或專案，而非使用 `dotnet build`

## 專案檔案管理

### 非 SDK 風格專案結構
.NET Framework 專案採用舊式專案格式，與現代 SDK 風格專案有顯著差異：

- **明確檔案納入**：所有新原始檔 **必須** 以 `<Compile>` 元素明確加入至專案檔（`.csproj`）
  - .NET Framework 專案不會像 SDK 風格專案自動納入目錄下的檔案
  - 範例：`<Compile Include="Path\To\NewFile.cs" />`

- **無隱式匯入**：與 SDK 風格專案不同，.NET Framework 專案不會自動匯入常用命名空間或組件
 
- **建置組態**：需明確包含 Debug/Release 組態的 `<PropertyGroup>` 區段

- **輸出路徑**：明確定義 `<OutputPath>` 與 `<IntermediateOutputPath>`

- **目標框架**：使用 `<TargetFrameworkVersion>` 而非 `<TargetFramework>`
  - 範例：`<TargetFrameworkVersion>v4.7.2</TargetFrameworkVersion>`

## NuGet 套件管理
- 在 .NET Framework 專案中安裝或更新 NuGet 套件需同時變更多個檔案，流程複雜。因此，**請勿嘗試在此專案安裝或更新 NuGet 套件**。
- 若需變更 NuGet 參考，請請使用者透過 Visual Studio NuGet 套件管理器或套件管理主控台操作。
- 推薦 NuGet 套件時，請確保其相容於 .NET Framework 或 .NET Standard 2.0（不可僅支援 .NET Core 或 .NET 5+）。

## C# 語言版本為 7.3
- 本專案僅限使用 C# 7.3 功能，請勿使用：

### C# 8.0+ 功能（不支援）：
  - Using 宣告（`using var stream = ...`）
  - Await using（`await using var resource = ...`）
  - Switch 運算式（`variable switch { ... }`）
  - Null-coalescing 賦值（`??=`）
  - Range 與 index 運算子（`array[1..^1]`, `array[^1]`）
  - 預設介面方法
  - 結構體 readonly 成員
  - 靜態區域函式
  - Nullable 參考型別（`string?`, `#nullable enable`）

### C# 9.0+ 功能（不支援）：
  - Record（`public record Person(string Name)`）
  - Init-only 屬性（`{ get; init; }`）
  - 頂層程式（無 Main 方法的程式）
  - Pattern matching 增強
  - 目標型別 new 運算式（`List<string> list = new()`）

### C# 10+ 功能（不支援）：
  - 全域 using 宣告
  - 檔案範疇命名空間
  - Record 結構體
  - Required 成員

### 請改用（C# 7.3 相容）：
  - 傳統 using 陳述式（加大括號）
  - Switch 陳述式取代 switch 運算式
  - 明確 null 檢查取代 null-coalescing 賦值
  - 陣列切片請用手動索引
  - 抽象類別或介面取代預設介面方法

## 環境注意事項（Windows 環境）
- 請使用 Windows 風格路徑（反斜線，如 `C:\path\to\file.cs`）
- 建議終端機操作時使用 Windows 指令
- 操作檔案系統時請考慮 Windows 特性

## 常見 .NET Framework 問題與最佳實踐

### 非同步/等待模式
- **ConfigureAwait(false)**：在函式庫程式碼中一律使用 `ConfigureAwait(false)` 以避免死結：
  ```csharp
  var result = await SomeAsyncMethod().ConfigureAwait(false);
  ```
- **避免同步包裝非同步**：請勿使用 `.Result`、`.Wait()` 或 `.GetAwaiter().GetResult()`。這些同步包裝非同步模式會導致死結與效能不佳。請一律使用 `await` 執行非同步呼叫。

### DateTime 處理
- **時間戳請用 DateTimeOffset**：絕對時間點請優先用 `DateTimeOffset` 取代 `DateTime`
- **指定 DateTimeKind**：使用 `DateTime` 時請明確指定 `DateTimeKind.Utc` 或 `DateTimeKind.Local`
- **文化格式化**：序列化/解析時請用 `CultureInfo.InvariantCulture`

### 字串操作
- **多次串接請用 StringBuilder**：多次字串串接請用 `StringBuilder`
- **字串比較請指定 StringComparison**：
  ```csharp
  string.Equals(other, StringComparison.OrdinalIgnoreCase)
  ```

### 記憶體管理
- **Dispose 模式**：針對非受控資源請正確實作 `IDisposable`
- **使用 using 陳述式**：一律用 using 包裝 `IDisposable` 物件
- **避免大型物件堆積**：物件請小於 85KB 以避免 LOH 配置

### 設定管理
- **請用 ConfigurationManager**：透過 `ConfigurationManager.AppSettings` 取得應用程式設定
- **連線字串**：請存放於 `<connectionStrings>` 區段，勿放於 `<appSettings>`
- **組態轉換**：環境特定設定請用 web.config/app.config 轉換

### 例外處理
- **捕捉特定例外**：請捕捉特定例外型別，勿用泛用 `Exception`
- **勿吞掉例外**：請一律記錄或適當重新拋出例外
- **使用 using 管理資源**：即使發生例外也能確保正確清理

### 效能考量
- **避免裝箱**：注意值型別與泛型的裝箱/拆箱
- **字串內部化**：常用字串可酌用 `string.Intern()`
- **延遲初始化**：昂貴物件請用 `Lazy<T>` 延遲建立
- **熱路徑避免反射**：`MethodInfo`、`PropertyInfo` 請快取
