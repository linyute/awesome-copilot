# Ralph Loop: 自主 AI 任務迴圈

建構自主程式碼編寫迴圈，讓 AI 代理程式挑選任務、實作任務、根據反壓（測試、建構）進行驗證、提交並重複執行 —— 每次反覆運算都在全新的內容視窗中進行。

> **可執行的範例：** [recipe/ralph-loop.cs](recipe/ralph-loop.cs)
>
> ```bash
> cd dotnet
> dotnet run recipe/ralph-loop.cs
> ```

## 什麼是 Ralph Loop？

[Ralph loop](https://ghuntley.com/ralph/) 是一種自主開發工作流，AI 代理程式在隔離的內容視窗中反覆執行任務。關鍵見解是：**狀態儲存在磁碟上，而非模型內容中**。每次反覆運算都會重新開始，從檔案中讀取目前狀態，執行一個任務，將結果寫回磁碟，然後結束。

```
┌─────────────────────────────────────────────────┐
│                   loop.sh                       │
│  while true:                                    │
│    ┌─────────────────────────────────────────┐  │
│    │  全新工作階段 (隔離內容)                   │  │
│    │                                         │  │
│    │  1. 讀取 PROMPT.md + AGENTS.md           │  │
│    │  2. 研究 specs/* 和程式碼                 │  │
│    │  3. 從計畫中挑選下一個任務                 │  │
│    │  4. 實作 + 執行測試                       │  │
│    │  5. 更新計畫、提交、結束                   │  │
│    └─────────────────────────────────────────┘  │
│    ↻ 下一次反覆運算 (全新內容)                     │
└─────────────────────────────────────────────────┘
```

**核心原則：**

- **每次反覆運算使用全新內容**：每個迴圈都會建立一個新的工作階段 —— 不累積內容，始終處於「智慧區域」
- **磁碟作為共享狀態**：`IMPLEMENTATION_PLAN.md` 在反覆運算之間持久化，並作為協調機制
- **反壓引導品質**：測試、建構和 Lint 會拒絕不佳的工作 —— 代理程式必須在提交前修正問題
- **兩種模式**：規劃 (PLANNING，差異分析 → 產生計畫) 和建構 (BUILDING，根據計畫實作)

## 簡易版本

最簡化的 Ralph loop —— SDK 等同於 `while :; do cat PROMPT.md | copilot ; done`：

```csharp
using GitHub.Copilot.SDK;

var client = new CopilotClient();
await client.StartAsync();

try
{
    var prompt = await File.ReadAllTextAsync("PROMPT.md");
    var maxIterations = 50;

    for (var i = 1; i <= maxIterations; i++)
    {
        Console.WriteLine($"\n=== 反覆運算 {i}/{maxIterations} ===");

        // 每次反覆運算使用全新工作階段 —— 內容隔離是關鍵點
        var session = await client.CreateSessionAsync(
            new SessionConfig { Model = "gpt-5.1-codex-mini" });
        try
        {
            var done = new TaskCompletionSource<string>();
            session.On(evt =>
            {
                if (evt is AssistantMessageEvent msg)
                    done.TrySetResult(msg.Data.Content);
            });

            await session.SendAsync(new MessageOptions { Prompt = prompt });
            await done.Task;
        }
        finally
        {
            await session.DisposeAsync();
        }

        Console.WriteLine($"反覆運算 {i} 完成。");
    }
}
finally
{
    await client.StopAsync();
}
```

這就是您開始所需的一切。提示字檔案告訴代理程式該做什麼；代理程式讀取專案檔案、執行工作、提交並結束。迴圈以乾淨的狀態重新啟動。

## 理想版本

完整的 Ralph 模式，包含規劃和建構模式，符合 [Ralph Playbook](https://github.com/ClaytonFarr/ralph-playbook) 架構：

```csharp
using GitHub.Copilot.SDK;

// 剖析引數：dotnet run [plan] [max_iterations]
var mode = args.Contains("plan") ? "plan" : "build";
var maxArg = args.FirstOrDefault(a => int.TryParse(a, out _));
var maxIterations = maxArg != null ? int.Parse(maxArg) : 50;
var promptFile = mode == "plan" ? "PROMPT_plan.md" : "PROMPT_build.md";

var client = new CopilotClient();
await client.StartAsync();

Console.WriteLine(new string('━', 40));
Console.WriteLine($"模式:   {mode}");
Console.WriteLine($"提示字: {promptFile}");
Console.WriteLine($"上限:    {maxIterations} 次反覆運算");
Console.WriteLine(new string('━', 40));

try
{
    var prompt = await File.ReadAllTextAsync(promptFile);

    for (var i = 1; i <= maxIterations; i++)
    {
        Console.WriteLine($"\n=== 反覆運算 {i}/{maxIterations} ===");

        // 每次反覆運算使用全新工作階段 —— 每個任務都能獲得完整的內容預算
        var session = await client.CreateSessionAsync(
            new SessionConfig
            {
                Model = "gpt-5.1-codex-mini",
                // 將代理程式固定在專案目錄
                WorkingDirectory = Environment.CurrentDirectory,
                // 自動核准工具呼叫以進行自動化執行
                OnPermissionRequest = (_, _) => Task.FromResult(
                    new PermissionRequestResult { Kind = "approved" }),
            });
        try
        {
            var done = new TaskCompletionSource<string>();
            session.On(evt =>
            {
                // 記錄工具使用情況以提高可見性
                if (evt is ToolExecutionStartEvent toolStart)
                    Console.WriteLine($"  ⚙ {toolStart.Data.ToolName}");
                else if (evt is AssistantMessageEvent msg)
                    done.TrySetResult(msg.Data.Content);
            });

            await session.SendAsync(new MessageOptions { Prompt = prompt });
            await done.Task;
        }
        finally
        {
            await session.DisposeAsync();
        }

        Console.WriteLine($"\n反覆運算 {i} 完成。");
    }

    Console.WriteLine($"\n已達到最大反覆運算次數：{maxIterations}");
}
finally
{
    await client.StopAsync();
}
```

### 必要的專案檔案

理想版本預期專案中有以下檔案結構：

```
project-root/
├── PROMPT_plan.md              # 規劃模式指令
├── PROMPT_build.md             # 建構模式指令
├── AGENTS.md                   # 操作指南 (建構/測試指令)
├── IMPLEMENTATION_PLAN.md      # 任務清單 (由規劃模式產生)
├── specs/                      # 需求規格 (每個主題一個)
│   ├── auth.md
│   └── data-pipeline.md
└── src/                        # 您的原始程式碼
```

### `PROMPT_plan.md` 範例

```markdown
0a. 研究 `specs/*` 以了解應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md (如果存在) 以了解目前的計畫。
0c. 研究 `src/` 以了解現有程式碼和共享公用程式。

1. 將規格與程式碼進行比較 (差異分析)。建立或更新
   IMPLEMENTATION_PLAN.md 作為尚未實作任務的優先順序項目清單。
   請勿實作任何內容。

重要提示：請勿假設功能缺失 —— 先搜尋程式碼庫進行確認。
優先更新現有公用程式，而非建立臨時副本。
```

### `PROMPT_build.md` 範例

```markdown
0a. 研究 `specs/*` 以了解應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md。
0c. 研究 `src/` 以供參考。

1. 從 IMPLEMENTATION_PLAN.md 中選擇最重要的項目。在進行變更前，
   請搜尋程式碼庫 (請勿假設尚未實作)。
2. 實作後，執行測試。如果功能缺失，請新增。
3. 當您發現問題時，立即更新 IMPLEMENTATION_PLAN.md。
4. 當測試通過時，更新 IMPLEMENTATION_PLAN.md，然後執行 `git add -A`
   接著 `git commit` 並附上描述性訊息。

5. 撰寫文件時，請記錄原因。
6. 完整地實作。請勿使用佔位符或存根 (stubs)。
7. 保持 IMPLEMENTATION_PLAN.md 為最新狀態 —— 未來的反覆運算取決於它。
```

### `AGENTS.md` 範例

保持簡短 (約 60 行)。每次反覆運算都會載入它，因此內容過多會浪費內容視窗空間。

```markdown
## 建構與執行

dotnet build

## 驗證

- 測試：`dotnet test`
- 建構：`dotnet build --no-restore`
```

## 最佳實務

1. **每次反覆運算使用全新內容**：絕不跨反覆運算累積內容 —— 這就是重點所在
2. **磁碟是您的資料庫**：`IMPLEMENTATION_PLAN.md` 是隔離工作階段之間的共享狀態
3. **反壓至關重要**：在 `AGENTS.md` 中定義測試、建構、Lint —— 代理程式在提交前必須通過它們
4. **從規劃模式開始**：先產生計畫，然後切換到建構模式
5. **觀察並調整**：觀察初期的反覆運算，當代理程式在特定方面失敗時，在提示字中加入護欄
6. **計畫是可丟棄的**：如果代理程式偏離軌道，請刪除 `IMPLEMENTATION_PLAN.md` 並重新規劃
7. **保持 `AGENTS.md` 簡短**：每次反覆運算都會載入 —— 僅包含操作資訊，不包含進度記錄
8. **使用沙箱**：代理程式以全權工具存取權限自主執行 —— 請將其隔離
9. **設定 `WorkingDirectory`**：將工作階段固定在您的專案根目錄，以便工具操作能正確解析路徑
10. **自動核准權限**：使用 `OnPermissionRequest` 允許工具呼叫，而不中斷迴圈

## 何時使用 Ralph Loop

**適用於：**

- 根據規格實作功能，並進行測試驅動驗證
- 大型重構，可分解為許多小任務
- 無人值守、長時間執行的開發，具有明確的需求
- 任何可以透過反壓 (測試/建構) 驗證正確性的工作

**不適用於：**

- 迴圈中需要人為判斷的任務
- 不會從反覆運算中受益的一次性操作
- 沒有可測試驗收標準的模糊需求
- 方向不明確的探索性原型設計

## 延伸閱讀

- [錯誤處理](error-handling.md) —— 長時間執行工作階段的逾時模式和正常關閉
- [持久化工作階段](persisting-sessions.md) —— 跨重啟儲存並恢復工作階段
