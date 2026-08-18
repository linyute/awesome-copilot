---
name: 'system-commandline-cli'
description: '在以 System.CommandLine 建構的 .NET 專案中新增、修改或審查 CLI 指令時使用此技能。觸發條件包括：建立新的 CLI 指令、新增選項或引數、連結指令處理常式、註冊子指令、建構指令群組，或任何有關 CLI 指令結構的架構決策。當使用者提及「System.CommandLine」、「CommandBase」、「SetAction」、「ParseResult」、「RootCommand」、「subcommand」或要求向 CLI 新增動詞時也可使用。請勿用於一般 C# 撰寫、Web API、UI 工作或非 CLI 專案。'
---

# System.CommandLine CLI 開發人員技能 (System.CommandLine CLI Developer Skill)

您正在處理使用 **System.CommandLine v2.x.x** 建構的 .NET CLI 應用程式，目標為 **.NET 8 或更新版本**或任何 **.NET Standard 2.0** 實作，包括 **.NET Framework 4.6.1 或更新版本**以及 **.NET Core 2.0 或更新版本**。
建立或修改 CLI 指令時請嚴格遵循這些規則與模式。

---

## 架構概觀

```
<CLI Project>/
├── Program.cs                       # 進入點與指令呼叫
└── Commands/
    ├── CommandBase.cs               # 所有指令的基底類別
    ├── GlobalOptions.cs             # 定義 CLI 的全域選項
    ├── RootCommand.cs               # 註冊頂層指令
    └── <Group>/                     # 每個指令群組一個資料夾
        ├── <Group>Command.cs        # 註冊其子項目的父指令
        └── <Group><Verb>Command.cs  # 包含其處理常式的分葉指令
```


---

## 規則 1 — 優先使用專案特定的指令基底類別

優先定義繼承自 `System.CommandLine.Command` 的專案特定抽象 `CommandBase`。具體指令應繼承自此基底類別，以便共用行為和慣例保持集中。

```csharp
internal abstract class CommandBase : Command
{
    protected CommandBase(string name, string? description = null)
        : base(name, description)
    {
    }
}

internal sealed class MyCommand : CommandBase
{
    public MyCommand()
        : base("command-name", "Help text shown in --help")
    {
        this.SetAction(CommandHandler);
    }

    private async Task<int> CommandHandler(
        ParseResult parseResult,
        CancellationToken cancellationToken)
    {
        // 實作
        return 0;
    }
}
```

當專案已具有指令基底類別時，請保留其既定慣例。否則，當指令需要共用行為時引入一個；當基底類別沒有增加實質價值時，簡單的應用程式可以直接繼承自 `Command`。

---

## 規則 2 — 選項與引數

### 定義選項

```csharp
private readonly Option<string> _myOption;

// 在建構函式中：
_myOption = new Option<string>("--my-option")
{
    Description = "Clear description of what this option does",
    Required = true,   // 或 false
};
_myOption.Aliases.Add("-m");       // 新增簡短別名
this.Options.Add(_myOption);
```

### 定義引數（位置引數）

```csharp
private readonly Argument<string> _fileArgument;

// 在建構函式中：
_fileArgument = new Argument<string>("file")
{
    Description = "Path to the input file"
};
this.Arguments.Add(_fileArgument);
```

### 在處理常式中讀取值

```csharp
// 必填選項/引數 — 使用 GetValue：
var value = parseResult.GetValue(_myOption);
```

---

## 規則 3 — 指令處理常式模式

處理常式是透過 `SetAction` 連結的**非同步方法**：

```csharp
this.SetAction(CommandHandler);

private async Task<int> CommandHandler(ParseResult parseResult, CancellationToken cancellationToken)
{
    // 1. 讀取選項/引數值
    // 2. 載入工作階段設定（若需要）
    // 3. 提早驗證設定 — 快速失敗並提供清楚的錯誤
    // 4. 執行業務邏輯
    // 5. 使用 Console 輸出結果

    return 0; // 或非零結束代碼
}
```

---

## 規則 4 — 指令群組（帶有子指令的父項）

**群組指令**註冊子項目，但**不**呼叫 `SetAction`：

```csharp
internal class MyGroupCommand : CommandBase
{
    public MyGroupCommand()
        : base("mygroup", "Manages my-group resources")
    {
        this.Subcommands.Add(new MyGroupListCommand());
        this.Subcommands.Add(new MyGroupCreateCommand());
        this.Subcommands.Add(new MyGroupDeleteCommand());
    }
}
```

當直接呼叫具有實質行為時，指令可以同時定義動作和子指令。

---

## 規則 5 — 註冊

- **頂層指令** → 在 `RootCommand.cs` 中註冊：
  ```csharp
  this.Subcommands.Add(new MyGroupCommand());
  ```

- **子指令** → 在父指令的建構函式內部註冊：
  ```csharp
  this.Subcommands.Add(new MyGroupCreateCommand());
  ```

---

## 規則 6 — 破壞性操作的使用者確認

```csharp
Console.WriteLine("Are you sure you want to delete X? This action cannot be undone. (yes/no)");
var confirmation = Console.ReadLine();
if (confirmation?.ToLower() != "yes" && confirmation?.ToLower() != "y")
{
    Console.WriteLine("Operation cancelled.");
    return 0;
}
```

---

## 規則 7 — 指令邏輯

每個指令的邏輯應位於實作介面的一個或多個**服務類別**中。
指令透過**相依性插入 (DI)** 接收介面，而非具體實作。
指令處理常式不應包含業務邏輯。
指令處理常式應該輕量，僅負責：
1. 剖析輸入
2. 驗證設定
3. 呼叫服務方法
4. 輸出結果

服務類別應透過 DI 注入到指令建構函式中，而非直接具現化。

---

## 規則 8 — 相依性插入 (Dependency Injection)

服務在 `Program.cs` 中註冊：

```csharp
serviceCollection.TryAddSingleton<IMyService, MyServiceImpl>();
```

在 `ServiceProviderExtensions.cs` 中新增便利的擴充方法：

```csharp
public static IMyService GetMyService(this ServiceProvider provider)
    => provider.GetRequiredService<IMyService>();
```

---

## 規則 9 — 命名慣例

| 元素 | 慣例 | 範例 |
|---------|-----------|---------|
| CLI 指令名稱 | 小寫 kebab-case | `agent create`, `set show` |
| 指令類別 | PascalCase + `Command` 後置詞 | `AgentCreateCommand` |
| 選項欄位 | `_camelCaseOption` (private readonly) | `_projectNameOption` |
| 選項長名稱 | `--kebab-case` | `--project-name` |
| 選項簡短別名 | `-x` (1-2 個字元) | `-p`, `-id`, `-md` |
| 引數欄位 | `_camelCaseArgument` | `_fileArgument` |
| 命名空間 | `MyProject.Commands.<Group>` | `MyProject.Commands.Agent` |
| 資料夾 | `Commands/<Group>/` | `Commands/Agent/` |

---

## 規則 10 — 可見性

- 所有指令類別皆為 `internal`。

---

## 規則 11 — 全域選項與驗證

在 `GlobalOptions.cs` 中一次性定義整個指令樹共用的選項。在註冊、驗證和讀取選項時重複使用相同的
`Option<T>` 執行個體。

```csharp
internal static class GlobalOptions
{
    public static readonly Option<string> EndpointOption = CreateEndpointOption();

    private static Option<string> CreateEndpointOption()
    {
        var option = new Option<string>(...);

        // 新增選項說明、別名與 Required 旗標
        // 將驗證新增至選項的 Validators 集合

        return option;
    }
}
```

### 在指令中使用全域選項

透過受保護的 `CommandBase` 協助程式公開重複的剖析或轉換：

```csharp
/// <summary>Resolves the validated endpoint from the global option.</summary>
protected Uri GetEndpoint(ParseResult parseResult)
{
    var baseUrl = parseResult.GetValue(GlobalOptions.EndpointOption)!;
    return new Uri(baseUrl);
}

/// <summary>Resolves the optional key from the global option.</summary>
protected string? GetKey(ParseResult parseResult)
    => parseResult.GetValue(GlobalOptions.KeyOption);
```

從分葉指令的處理常式中使用這些協助程式。指令不得將全域選項新增至其本身的
`Options` 集合中；根節點上的遞迴註冊已使它們在其 `ParseResult` 中可用。

```csharp
private async Task<int> CommandHandler(
    ParseResult parseResult,
    CancellationToken cancellationToken)
{
    var endpoint = GetEndpoint(parseResult);
    var key = GetKey(parseResult);

    ...

    return 0;
}
```

僅在不需要共用轉換或後備邏輯時，才在分葉處理常式中直接讀取全域選項。
務必使用靜態 `GlobalOptions` 符號；切勿使用相同的別名建立第二個 `Option<T>`。

遵循以下要求：

1. 設定 `Recursive = true`，以便每個後代指令都接受該選項。
2. 將每個全域選項恰好一次新增至 `RootCommand.Options`；不要在分葉指令上重複新增。
3. 透過共用符號讀取值，例如
   `parseResult.GetValue(GlobalOptions.Endpoint)`，最好在 `CommandBase` 協助程式之後。
4. 將驗證新增至選項的 `Validators` 集合，使無效輸入成為剖析錯誤且
   不呼叫指令處理常式。不要依賴 `new Uri(...)` 或下游服務的例外狀況。
5. 將端點選項驗證為非空白的絕對 `http` 或 `https` URI。拒絕不受支援的配置 (schemes)、
   相對 URI、查詢字串和片段，因為附加固定的端點路徑會改變其含義。
6. 對於選用的機密選項（例如 `--key`），允許省略但拒絕明確提供的空白或
   僅包含空格的值。在不進行記錄、顯示、修剪或以其他方式修改的情況下驗證該值。
7. 保持驗證與推導分開。
8. 使用指明選項名稱和所接受格式的穩定、可據以採取行動的驗證訊息。
9. 透過根剖析器測試全域選項，包括預設值、明確的有效值、無效值，
   以及在具代表性的子指令之前和之後的放置。驗證無效輸入可防止處理常式執行。

---

## 規則 12 — 新指令檢查清單

建立新指令時，請驗證：

1. ✅ 當存在專案的指令基底類別或提供有意義的共用行為時，繼承自該基底類別
2. ✅ 建構函式將 `name`、`description` 傳遞給基底類別
3. ✅ 所有選項均具有 `Description`、`Required`
4. ✅ 透過 `this.SetAction(CommandHandler)` 連結處理常式
5. ✅ 處理常式簽章：`async Task<int> CommandHandler(ParseResult, CancellationToken)`
6. ✅ 在父項中註冊指令（RootCommand 或群組指令）
7. ✅ 類別為 `internal`
8. ✅ 檔案放置於 `Commands/<Group>/` 資料夾中
9. ✅ 命名空間與資料夾相符：`MyProject.CLI.Commands.<Group>`
