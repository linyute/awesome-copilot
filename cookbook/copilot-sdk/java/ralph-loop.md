# Ralph 迴圈：自主 AI 任務迴圈

建構自主編碼迴圈，其中 AI 代理會挑選任務、實作任務、根據反壓（測試、建構）進行驗證、提交並重複 —— 每次迭代都在新的上下文視窗中進行。

> **可執行的範例：** [recipe/RalphLoop.java](recipe/RalphLoop.java)
>
> ```bash
> jbang recipe/RalphLoop.java
> ```

## 什麼是 Ralph 迴圈？

[Ralph 迴圈](https://ghuntley.com/ralph/) 是一個自主開發工作流程，其中 AI 代理在隔離的上下文視窗中循環執行任務。關鍵見解：**狀態存在於硬碟上，而非模型上下文中**。每次迭代都重新開始，從檔案中讀取當前狀態，執行一個任務，將結果寫回硬碟並結束。

```
┌─────────────────────────────────────────────────┐
│                   loop.sh                       │
│  while true:                                    │
│    ┌─────────────────────────────────────────┐  │
│    │  新的工作階段（隔離的上下文）           │  │
│    │                                         │  │
│    │  1. 讀取 PROMPT.md + AGENTS.md          │  │
│    │  2. 研究 specs/* 和程式碼               │  │
│    │  3. 從計畫中挑選下一個任務              │  │
│    │  4. 實作 + 執行測試                     │  │
│    │  5. 更新計畫、提交、結束                │  │
│    └─────────────────────────────────────────┘  │
│    ↻ 下一次迭代（新的上下文）                   │
└─────────────────────────────────────────────────┘
```

**核心原則：**

- **每次迭代都有新的上下文**：每個迴圈都會建立一個新的工作階段 —— 沒有上下文累積，始終處於「智慧區域」
- **硬碟作為共享狀態**：`IMPLEMENTATION_PLAN.md` 在迭代之間保持不變，並作為協調機制
- **反壓引導品質**：測試、建構和 Lint 會拒絕不佳的工作 —— 代理必須在提交前修正問題
- **兩種模式**：規劃（差異分析 → 產生計畫）和建構（根據計畫實作）

## 簡單版本

最小的 Ralph 迴圈 —— 相當於 SDK 的 `while :; do cat PROMPT.md | copilot ; done`：

```java
///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.events.*;
import com.github.copilot.sdk.json.*;
import java.nio.file.*;

public class SimpleRalphLoop {
    public static void main(String[] args) throws Exception {
        String promptFile = args.length > 0 ? args[0] : "PROMPT.md";
        int maxIterations = args.length > 1 ? Integer.parseInt(args[1]) : 50;

        try (var client = new CopilotClient()) {
            client.start().get();

            String prompt = Files.readString(Path.of(promptFile));

            for (int i = 1; i <= maxIterations; i++) {
                System.out.printf("%n=== 迭代 %d/%d ===%n", i, maxIterations);

                // 每次迭代都有新的工作階段 —— 上下文隔離是重點
                var session = client.createSession(
                    new SessionConfig()
                        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                        .setModel("gpt-5.1-codex-mini")
                        .setWorkingDirectory(System.getProperty("user.dir"))
                ).get();

                try {
                    session.sendAndWait(new MessageOptions().setPrompt(prompt)).get();
                } finally {
                    session.close();
                }

                System.out.printf("迭代 %d 完成。%n", i);
            }
        }
    }
}
```

這就是您開始使用所需的一切。提示檔案告訴代理要做什麼；代理讀取專案檔案、執行工作、提交並結束。迴圈以全新的狀態重新啟動。

## 理想版本

完整的 Ralph 模式，包含規劃和建構模式，符合 [Ralph 指南](https://github.com/ClaytonFarr/ralph-playbook) 架構：

```java
///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.events.*;
import com.github.copilot.sdk.json.*;
import java.nio.file.*;
import java.util.Arrays;

public class RalphLoop {
    public static void main(String[] args) throws Exception {
        // 解析 CLI 參數：jbang RalphLoop.java [plan] [max_iterations]
        boolean planMode = Arrays.asList(args).contains("plan");
        String mode = planMode ? "plan" : "build";
        int maxIterations = Arrays.stream(args)
            .filter(a -> a.matches("\\d+"))
            .findFirst()
            .map(Integer::parseInt)
            .orElse(50);

        String promptFile = planMode ? "PROMPT_plan.md" : "PROMPT_build.md";
        System.out.printf("模式：%s | 提示：%s%n", mode, promptFile);

        try (var client = new CopilotClient()) {
            client.start().get();

            String prompt = Files.readString(Path.of(promptFile));

            for (int i = 1; i <= maxIterations; i++) {
                System.out.printf("%n=== 迭代 %d/%d ===%n", i, maxIterations);

                var session = client.createSession(
                    new SessionConfig()
                        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                        .setModel("gpt-5.1-codex-mini")
                        .setWorkingDirectory(System.getProperty("user.dir"))
                ).get();

                // 記錄工具使用情況以提高可見性
                session.on(ToolExecutionStartEvent.class,
                    ev -> System.out.printf("  ⚙ %s%n", ev.getData().toolName()));

                try {
                    session.sendAndWait(new MessageOptions().setPrompt(prompt)).get();
                } finally {
                    session.close();
                }

                System.out.printf("迭代 %d 完成。%n", i);
            }
        }
    }
}
```

### 所需的專案檔案

理想版本預期您的專案中具有此檔案結構：

```
專案根目錄/
├── PROMPT_plan.md              # 規劃模式指令
├── PROMPT_build.md             # 建構模式指令
├── AGENTS.md                   # 操作指南（建構/測試指令）
├── IMPLEMENTATION_PLAN.md      # 任務列表（由規劃模式產生）
├── specs/                      # 需求規格（每個主題一個）
│   ├── auth.md
│   └── data-pipeline.md
└── src/                        # 您的原始程式碼
```

### `PROMPT_plan.md` 範例

```markdown
0a. 研究 `specs/*` 以了解應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md（如果存在）以了解目前的計畫。
0c. 研究 `src/` 以了解現有的程式碼和共享公用程式。

1. 將規格與程式碼進行比較（差異分析）。建立或更新
   IMPLEMENTATION_PLAN.md 作為尚未實作任務的優先順序項目列表。
   請勿實作任何內容。

重要事項：請勿假設功能缺失 —— 請先搜尋程式碼庫以確認。
優先更新現有的公用程式，而不是建立臨時複本。
```

### `PROMPT_build.md` 範例

```markdown
0a. 研究 `specs/*` 以了解應用程式規格。
0b. 研究 IMPLEMENTATION_PLAN.md。
0c. 研究 `src/` 以供參考。

1. 從 IMPLEMENTATION_PLAN.md 中選擇最重要的項目。在進行更改之前，
   請搜尋程式碼庫（不要假設未實作）。
2. 實作後，執行測試。如果功能缺失，請將其加入。
3. 當您發現問題時，請立即更新 IMPLEMENTATION_PLAN.md。
4. 當測試通過時，更新 IMPLEMENTATION_PLAN.md，然後執行 `git add -A`，
   接著執行 `git commit` 並加上說明訊息。

5. 撰寫文件時，請記錄原因（why）。
6. 完整實作。不使用佔位符或存根（stubs）。
7. 保持 IMPLEMENTATION_PLAN.md 為最新狀態 —— 未來的迭代取決於它。
```

### `AGENTS.md` 範例

保持簡短（約 60 行）。它在每次迭代都會載入，因此過於臃腫會浪費上下文。

```markdown
## 建構與執行

mvn compile

## 驗證

- 測試：`mvn test`
- 類型檢查：`mvn compile`
- Lint：`mvn checkstyle:check`
```

## 最佳實踐

1. **每次迭代都有新的上下文**：切勿在迭代之間累積上下文 —— 這就是重點所在
2. **硬碟是您的資料庫**：`IMPLEMENTATION_PLAN.md` 是隔離工作階段之間的共享狀態
3. **反壓至關重要**：`AGENTS.md` 中的測試、建構、Lint —— 代理必須在提交前通過它們
4. **從規劃模式開始**：先產生計畫，然後切換到建構模式
5. **觀察並調整**：觀察早期的迭代，當代理以特定方式失敗時，在提示中加入防護措施
6. **計畫是可丟棄的**：如果代理偏離軌道，請刪除 `IMPLEMENTATION_PLAN.md` 並重新規劃
7. **保持 `AGENTS.md` 簡短**：它在每次迭代都會載入 —— 僅包含操作資訊，不包含進度記錄
8. **使用沙箱**：代理自主執行並具有完整的工具存取權限 —— 請將其隔離
9. **設定 `workingDirectory`**：將工作階段固定在您的專案根目錄，以便工具操作能正確解析路徑
10. **自動核准權限**：使用 `PermissionHandler.APPROVE_ALL` 允許工具呼叫而不中斷迴圈

## 何時使用 Ralph 迴圈

**適用於：**

- 使用測試驅動驗證從規格實作功能
- 分解為許多小任務的大型重構
- 具有明確需求的無人值守、長期執行的開發
- 任何可以透過反壓（測試/建構）驗證正確性的工作

**不適用於：**

- 在迴圈中需要人類判斷的任務
- 不會從迭代中受益的一次性操作
- 沒有可測試驗收標準的模糊需求
- 方向不明確的探索性原型設計

## 延伸閱讀

- [錯誤處理](error-handling.md) —— 長期執行工作階段的逾時模式和正常關閉
- [持續工作階段](persisting-sessions.md) —— 在重新啟動之間儲存並恢復工作階段
