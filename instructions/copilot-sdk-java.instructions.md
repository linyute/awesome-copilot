---
applyTo: '**/*.java, **/pom.xml'
description: '本文件提供使用 GitHub Copilot SDK for Java 構建 Java 應用程式的指南。'
name: 'GitHub Copilot SDK Java 說明'
---

## 核心原則

- 本 SDK 目前處於公開預覽階段，可能會發生重大變更 (breaking changes)。
- 基於 SDK 的使用需要 Java 17 或更高版本。某些範例使用了較新的 JDK 功能，因此需要 JDK 21 或更高版本（例如，透過 `Executors.newVirtualThreadPerTaskExecutor()` 使用虛擬執行緒，以及 `switch` 模式匹配）。**強烈建議使用 Java 25 或更高版本**。
- 需要安裝 GitHub Copilot CLI 並將其加入系統 PATH。
- 所有非同步操作均使用 `CompletableFuture`。
- 實作 `AutoCloseable` 以進行資源清理（try-with-resources）。
- 設定類別 (configuration classes) 的 getter 會回傳 `Optional<T>`（或 `OptionalInt`/`OptionalDouble`），以區分「未設定」與明確的值；setter 接受原始型別並回傳 `this` 以支援鏈式呼叫。若需要取消設定，請使用 `clear` 方法。

## 安裝

### Maven

```xml
<dependency>
    <groupId>com.github</groupId>
    <artifactId>copilot-sdk-java</artifactId>
    <version>${copilot-sdk-java.version}</version>
</dependency>
```

### Gradle

```groovy
implementation "com.github:copilot-sdk-java:${copilotSdkJavaVersion}"
```

## 客戶端初始化

### 基本客戶端設定

```java
try (var client = new CopilotClient()) {
    client.start().get();
    // 使用客戶端...
}
```

### 虛擬執行緒 (JDK 25+)

JDK 21 引入了虛擬執行緒，但直到 JDK 25 才修復了顯著的效能錯誤，這使得 JDK 25 成為生產環境中使用虛擬執行緒的最低推薦版本。在 JDK 25+ 上，請使用虛擬執行緒執行器以獲得顯著提升的可擴展性。SDK 的非同步操作將在虛擬執行緒上執行，而不是預設的 `ForkJoinPool`：

```java
var options = new CopilotClientOptions()
    .setExecutor(Executors.newVirtualThreadPerTaskExecutor());

try (var client = new CopilotClient(options)) {
    client.start().get();
    // 使用客戶端...
}
```

### 客戶端設定選項

建立 `CopilotClient` 時，請使用 `CopilotClientOptions`：

- `cliPath` - CLI 可執行檔的路徑（預設值："copilot"，從 PATH 中尋找）
- `cliArgs` - 在 SDK 管理的旗標之前預先加入的額外參數
- `cliUrl` - 現有 CLI 伺服器的 URL（例如 "localhost:8080"）。提供此值時，客戶端將不會啟動程序
- `port` - 伺服器連接埠（預設值：0，即隨機連接埠，僅在 `useStdio` 為 false 時有效）
- `useStdio` - 使用 stdio 傳輸而非 TCP（預設值：true）
- `logLevel` - 日誌層級："error", "warn", "info", "debug", "trace"（預設值："info"）
- `autoStart` - 第一次請求時自動啟動伺服器（預設值：true）
- `autoRestart` - 當崩潰時自動重新啟動（預設值：true）
- `cwd` - CLI 程序的工作目錄
- `environment` - CLI 程序所需的環境變數
- `gitHubToken` - 用於驗證的 GitHub Token
- `useLoggedInUser` - 使用已登入的 `gh` CLI 驗證（預設值：true，除非提供了 token）
- `onListModels` - 用於 BYOK 場景的自訂模型清單處理器
- `remote` - 啟用 Mission Control / 雲端工作階段整合（預設值：false）
- `telemetry` - 用於 OpenTelemetry 匯出的 `TelemetryConfig`（自 1.2.0 起）
- `sessionIdleTimeoutSeconds` - 工作階段自動關閉前的閒置超時時間（自 1.3.0 起）
- `executor` - 用於非同步操作的自訂 `Executor`（預設值：ForkJoinPool）
- `tcpConnectionToken` - 用於 TCP 傳輸驗證的安全性 Token

```java
var options = new CopilotClientOptions()
    .setCliPath("/path/to/copilot")
    .setLogLevel("debug")
    .setAutoStart(true)
    .setAutoRestart(true)
    .setGitHubToken(System.getenv("GITHUB_TOKEN"));

try (var client = new CopilotClient(options)) {
    client.start().get();
    // 使用客戶端...
}
```

### 手動伺服器控制

若需明確控制：
```java
var client = new CopilotClient(new CopilotClientOptions().setAutoStart(false));
client.start().get();
// 使用客戶端...
client.stop().get();
```

當 `stop()` 花費時間過長時，請使用 `forceStop()`。

## 工作階段管理

### 建立工作階段

使用 `SessionConfig` 進行設定。**必須**提供權限處理器：

```java
var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setStreaming(true)
    .setTools(List.of(...))
    .setSystemMessage(new SystemMessageConfig()
        .setMode(SystemMessageMode.APPEND)
        .setContent("自訂指令"))
    .setAvailableTools(List.of("tool1", "tool2"))
    .setExcludedTools(List.of("tool3"))
    .setProvider(new ProviderConfig().setType("openai"))
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

### 工作階段設定選項

- `sessionId` - 自訂工作階段 ID
- `clientName` - 應用程式名稱
- `model` - 模型名稱（"gpt-5", "claude-sonnet-4.5" 等）
- `reasoningEffort` - "low", "medium", "high", "xhigh"
- `tools` - 暴露給 CLI 的自訂工具
- `systemMessage` - 系統訊息自訂
- `availableTools` - 允許的工具名稱清單
- `excludedTools` - 禁止的工具名稱清單
- `provider` - 自訂 API 提供者設定 (BYOK)
- `streaming` - 啟用串流回應區塊（預設值：false）
- `workingDirectory` - 工作階段的工作目錄
- `mcpServers` - MCP 伺服器設定
- `customAgents` - 自訂代理設定
- `agent` - 按名稱預選代理
- `infiniteSessions` - 無限工作階段設定
- `skillDirectories` - Skill SKILL.md 目錄
- `disabledSkills` - 要禁用的技能
- `configDir` - 設定檔目錄路徑
- `hooks` - 工作階段生命週期掛鉤
- `onPermissionRequest` - **必要的**權限處理器
- `onUserInputRequest` - 使用者輸入處理器
- `onEvent` - 在工作階段建立前註冊的事件處理器

所有 setter 皆回傳 `SessionConfig` 以支援方法鏈式呼叫。

### 恢復工作階段

```java
var session = client.resumeSession(sessionId, new ResumeSessionConfig()
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

### 工作階段操作

- `session.getSessionId()` - 取得工作階段識別碼
- `session.send(prompt)` / `session.send(MessageOptions)` - 發送訊息，回傳 `CompletableFuture<String>`（訊息 ID，用於關聯）
- `session.sendAndWait(prompt)` / `session.sendAndWait(MessageOptions)` - 發送並等待回應（60秒超時）
- `session.sendAndWait(options, timeoutMs)` - 發送並自訂超時等待
- `session.abort()` - 中止目前處理
- `session.getMessages()` - 取得所有事件/訊息
- `session.setModel(modelId)` - 切換到不同的模型
- `session.setModel(modelId, reasoningEffort)` - 使用推理力度切換模型 ("low", "medium", "high", "xhigh")
- `session.setModel(modelId, reasoningEffort, modelCapabilities)` - 使用 `ModelCapabilitiesOverride` 切換模型（自 1.3.0 起）
- `session.log(message)` / `session.log(message, "warning", false)` / `session.log(message, "error", false)` - 將訊息記錄到工作階段時間軸，層級為 "info", "warning" 或 "error"
- `session.log(message, level, ephemeral, url)` - 使用可點擊的 URL 連結記錄訊息
- `session.close()` - 清理資源

## 事件處理

### 事件訂閱模式

使用 `CompletableFuture` 等待工作階段事件：

```java
var done = new CompletableFuture<Void>();

session.on(event -> {
    if (event instanceof AssistantMessageEvent msg) {
        System.out.println(msg.getData().content());
    } else if (event instanceof SessionIdleEvent) {
        done.complete(null);
    }
});

session.send(new MessageOptions().setPrompt("Hello"));
done.get();
```

### 型別安全的事件處理

使用型別化的 `on()` 多載以獲得編譯時安全性：

```java
var done = new java.util.concurrent.CompletableFuture<Void>();

session.on(AssistantMessageEvent.class, msg -> {
    System.out.println(msg.getData().content());
});

session.on(SessionIdleEvent.class, idle -> {
    done.complete(null);
});
```

### 取消訂閱事件

`on()` 方法回傳一個 `Closeable`：

```java
var subscription = session.on(event -> { /* 處理器 */ });
// 之後...
subscription.close();
```

### 事件型別

使用模式匹配（Java 17+）進行事件處理：

```java
session.on(event -> {
    if (event instanceof UserMessageEvent userMsg) {
        // 處理使用者訊息
    } else if (event instanceof AssistantMessageEvent assistantMsg) {
        System.out.println(assistantMsg.getData().content());
    } else if (event instanceof AssistantMessageDeltaEvent delta) {
        System.out.print(delta.getData().deltaContent());
    } else if (event instanceof ToolExecutionStartEvent toolStart) {
        // 工具執行開始
    } else if (event instanceof ToolExecutionCompleteEvent toolComplete) {
        // 工具執行完成
    } else if (event instanceof SessionStartEvent start) {
        // 工作階段開始
    } else if (event instanceof SessionIdleEvent idle) {
        // 工作階段閒置（處理完成）
    } else if (event instanceof SessionErrorEvent error) {
        System.err.println("錯誤: " + error.getData().message());
    }
});
```

### 事件錯誤處理

控制如何處理事件處理器中的錯誤：

```java
// 設定自訂錯誤處理器
session.setEventErrorHandler(ex -> {
    logger.error("事件處理器錯誤", ex);
});

// 或設定錯誤傳播策略
session.setEventErrorPolicy(EventErrorPolicy.SUPPRESS_AND_LOG_ERRORS);
```

`EventErrorPolicy` 值：
- `PROPAGATE_AND_LOG_ERRORS` - 發生錯誤時停止事件分派（預設值）
- `SUPPRESS_AND_LOG_ERRORS` - 繼續分派，並記錄錯誤

## 串流回應

### 啟用串流

在 `SessionConfig` 中設定 `streaming(true)`：

```java
var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setStreaming(true)
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

### 處理串流事件

處理 delta 事件（增量）與最終事件：

需要 Java 21+，但建議 25。

```java
var done = new CompletableFuture<Void>();

session.on(event -> {
    switch (event) {
        case AssistantMessageDeltaEvent delta ->
            // 增量文字區塊
            System.out.print(delta.getData().deltaContent());
        case AssistantReasoningDeltaEvent reasoningDelta ->
            // 增量推理區塊（依模型而定）
            System.out.print(reasoningDelta.getData().deltaContent());
        case AssistantMessageEvent msg ->
            // 最終完整訊息
            System.out.println("\n--- 最終 ---\n" + msg.getData().content());
        case AssistantReasoningEvent reasoning ->
            // 最終推理內容
            System.out.println("--- 推理 ---\n" + reasoning.getData().content());
        case SessionIdleEvent idle ->
            done.complete(null);
        default -> { }
    }
});

session.send(new MessageOptions().setPrompt("跟我說個故事"));
done.get();
```

注意：無論串流設定如何，最終事件 (`AssistantMessageEvent`, `AssistantReasoningEvent`) 總是會被發送。

## 自訂工具

### 定義工具

使用 `ToolDefinition.create()` 以及 JSON Schema 參數與 `ToolHandler`：

```java
var tool = ToolDefinition.create(
    "get_weather",
    "獲取指定位置的天氣",
    Map.of(
        "type", "object",
        "properties", Map.of(
            "location", Map.of("type", "string", "description", "城市名稱")
        ),
        "required", List.of("location")
    ),
    invocation -> {
        String location = (String) invocation.getArguments().get("location");
        return CompletableFuture.completedFuture("在 " + location + " 天氣晴朗");
    }
);

var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setTools(List.of(tool))
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

### 型別安全的工具參數

使用 `getArgumentsAs()` 反序列化為型別化的 record 或 class：

```java
record WeatherArgs(String location, String unit) {}

var tool = ToolDefinition.create(
    "get_weather",
    "獲取指定位置的天氣",
    Map.of(
        "type", "object",
        "properties", Map.of(
            "location", Map.of("type", "string"),
            "unit", Map.of("type", "string", "enum", List.of("celsius", "fahrenheit"))
        ),
        "required", List.of("location")
    ),
    invocation -> {
        var args = invocation.getArgumentsAs(WeatherArgs.class);
        return CompletableFuture.completedFuture(
            Map.of("temp", 72, "unit", args.unit(), "location", args.location())
        );
    }
);
```

### 覆寫內建工具

```java
var override = ToolDefinition.createOverride(
    "built_in_tool_name",
    "自訂描述",
    Map.of("type", "object", "properties", Map.of(...)),
    invocation -> CompletableFuture.completedFuture("自訂結果")
);
```

### 跳過權限檢查（自 1.2.0 起）

使用 `createSkipPermission()` 定義一個跳過 CLI 權限請求流程的工具：

```java
var tool = ToolDefinition.createSkipPermission(
    "safe_read_only_tool",
    "一個不需要權限確認的工具",
    Map.of("type", "object", "properties", Map.of(...)),
    invocation -> CompletableFuture.completedFuture("結果")
);
```

### 工具回傳型別

- 回傳任何可 JSON 序列化的值（String, Map, List, record, POJO）
- SDK 會自動序列化回傳值並傳回給 CLI

### 工具執行流程

當 Copilot 呼叫工具時，客戶端會自動：
1. 反序列化參數
2. 執行你的處理器函式
3. 序列化回傳值
4. 回應 CLI

## 權限處理

### 必要的權限處理器

建立或恢復工作階段時，權限處理器是**強制性的**：

```java
// 批准所有請求（僅用於開發/測試）
new SessionConfig()
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)

// 自訂權限邏輯
new SessionConfig()
    .setOnPermissionRequest((request, invocation) -> {
        if ("dangerous-action".equals(request.getKind())) {
            return CompletableFuture.completedFuture(
                new PermissionRequestResult().setKind(PermissionRequestResultKind.DENIED)
            );
        }
        return CompletableFuture.completedFuture(
            new PermissionRequestResult().setKind(PermissionRequestResultKind.APPROVED)
        );
    })
```

## 使用者輸入處理

處理代理發出的使用者輸入請求：

```java
new SessionConfig()
    .setOnUserInputRequest((request, invocation) -> {
        System.out.println("代理詢問: " + request.getQuestion());
        String answer = scanner.nextLine();
        return CompletableFuture.completedFuture(
            new UserInputResponse()
                .setAnswer(answer)
                .setWasFreeform(true)
        );
    })
```

## 系統訊息自訂

### 附加模式 (預設 - 保留防護措施)

```java
var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setSystemMessage(new SystemMessageConfig()
        .setMode(SystemMessageMode.APPEND)
        .setContent("""
            <workflow_rules>
            - 務必檢查安全性漏洞
            - 適用時建議效能改進
            </workflow_rules>
            """))
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

### 取代模式 (完全控制 - 移除防護措施)

```java
var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setSystemMessage(new SystemMessageConfig()
        .setMode(SystemMessageMode.REPLACE)
        .setContent("你是一個有用的助理。"))
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

## 檔案附件

使用 `Attachment` 將檔案附加到訊息：

```java
session.send(new MessageOptions()
    .setPrompt("分析此檔案")
    .setAttachments(List.of(
        new Attachment("file", "/path/to/file.java", "我的檔案")
    ))
);
```

## 訊息傳遞模式

使用 `MessageOptions` 中的 `mode` 屬性：

- `"enqueue"` - 將訊息加入佇列等待處理（預設值）
- `"immediate"` - 立即處理訊息

```java
session.send(new MessageOptions()
    .setPrompt("...")
    .setMode("enqueue")
);
```

## 便利工具：發送並等待

使用 `sendAndWait()` 發送訊息並阻塞等待助理回應：

```java
// 使用預設 60 秒超時
AssistantMessageEvent response = session.sendAndWait("2+2 等於多少?").get();
System.out.println(response.getData().content());

// 自訂超時
AssistantMessageEvent response = session.sendAndWait(
    new MessageOptions().setPrompt("寫一個長故事"),
    120_000  // 120 秒
).get();
```

## 多重工作階段

工作階段是獨立的，可以同時執行：

```java
var session1 = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();

var session2 = client.createSession(new SessionConfig()
    .setModel("claude-sonnet-4.5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();

session1.send(new MessageOptions().setPrompt("來自工作階段 1 的問候"));
session2.send(new MessageOptions().setPrompt("來自工作階段 2 的問候"));
```

## 自帶金鑰 (BYOK)

透過 `ProviderConfig` 使用自訂 API 提供者：

```java
// OpenAI
var session = client.createSession(new SessionConfig()
    .setProvider(new ProviderConfig()
        .setType("openai")
        .setBaseUrl("https://api.openai.com/v1")
        .setApiKey("sk-..."))
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();

// Azure OpenAI
var session = client.createSession(new SessionConfig()
    .setProvider(new ProviderConfig()
        .setType("azure")
        .setAzure(new AzureOptions()
            .setEndpoint("https://my-resource.openai.azure.com")
            .setDeployment("gpt-4"))
        .setBearerToken("..."))
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

## 工作階段生命週期管理

### 列出工作階段

```java
var sessions = client.listSessions().get();
for (var metadata : sessions) {
    System.out.println("工作階段: " + metadata.getSessionId());
}
```

### 過濾工作階段

使用 `SessionListFilter` 依據工作目錄、Git 根目錄、儲存庫或分支縮小搜尋結果：

```java
var filter = new SessionListFilter()
    .setRepository("owner/repo")
    .setBranch("main");

var sessions = client.listSessions(filter).get();
```

### 刪除工作階段

```java
client.deleteSession(sessionId).get();
```

### 檢查連線狀態

```java
var state = client.getState();
```

### 生命週期事件訂閱

```java
AutoCloseable subscription = client.onLifecycle(event -> {
    System.out.println("生命週期事件: " + event);
});
// 之後...
subscription.close();
```

### 過濾生命週期事件

訂閱特定的生命週期事件型別：

```java
AutoCloseable subscription = client.onLifecycle("session.created", event -> {
    System.out.println("新的工作階段已建立");
});
```

## 錯誤處理

### 標準異常處理

```java
try {
    var session = client.createSession(new SessionConfig()
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
    ).get();
    session.sendAndWait("Hello").get();
} catch (ExecutionException ex) {
    Throwable cause = ex.getCause();
    System.err.println("錯誤: " + cause.getMessage());
} catch (Exception ex) {
    System.err.println("錯誤: " + ex.getMessage());
}
```

### 工作階段錯誤事件

監控 `SessionErrorEvent` 以處理執行階段錯誤：

```java
session.on(SessionErrorEvent.class, error -> {
    System.err.println("工作階段錯誤: " + error.getData().message());
});
```

## 連線測試

使用 `ping()` 驗證伺服器連線：

```java
var response = client.ping("測試訊息").get();
```

## 狀態與驗證

```java
// 取得 CLI 版本與通訊協定資訊
var status = client.getStatus().get();

// 檢查驗證狀態
var authStatus = client.getAuthStatus().get();

// 列出可用模型
var models = client.listModels().get();
```

## 資源清理

### 使用 try-with-resources 自動清理

務必使用 try-with-resources 進行自動棄置：

```java
try (var client = new CopilotClient()) {
    client.start().get();
    try (var session = client.createSession(new SessionConfig()
            .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get()) {
        // 使用工作階段...
    }
}
// 資源自動清理
```

### 手動清理

若不使用 try-with-resources：

```java
var client = new CopilotClient();
try {
    client.start().get();
    // 使用客戶端...
} finally {
    client.stop().get();
}
```

## 最佳實踐

1. **務必使用 try-with-resources** 來管理 `CopilotClient` 與 `CopilotSession`
2. **務必提供權限處理器** - 建立與恢復工作階段時為必須
3. **正確使用 `CompletableFuture`** - 呼叫 `.get()` 進行阻塞，或透過 `.thenApply()`/`.thenCompose()` 鏈式呼叫
4. **使用 `sendAndWait()`** 處理簡單的請求-回應模式，而非手動處理事件
5. **處理 `SessionErrorEvent`** 以獲得強健的錯誤處理能力
6. **使用模式匹配**（switch 配合密封型別）處理事件
7. **啟用串流** 以提升互動場景下的 UX
8. **在不再需要時關閉事件訂閱** (`Closeable`)
9. **使用 `SystemMessageMode.APPEND`** 來保留安全性防護措施
10. **提供具描述性的工具名稱與說明**，以幫助模型理解
11. **在串流啟用時同時處理增量 (delta) 與最終事件**
12. **使用 `getArgumentsAs()`** 進行型別安全的工具參數反序列化

## 常見模式

### 簡單查詢-回應

```java
try (var client = new CopilotClient()) {
    client.start().get();

    try (var session = client.createSession(new SessionConfig()
            .setModel("gpt-5")
            .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get()) {

        var response = session.sendAndWait("2+2 等於多少?").get();
        System.out.println(response.getData().content());
    }
}
```

### 事件驅動對話

```java
try (var client = new CopilotClient()) {
    client.start().get();

    try (var session = client.createSession(new SessionConfig()
            .setModel("gpt-5")
            .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get()) {

        var done = new CompletableFuture<Void>();

        session.on(AssistantMessageEvent.class, msg ->
            System.out.println(msg.getData().content()));

        session.on(SessionIdleEvent.class, idle ->
            done.complete(null));

        session.send(new MessageOptions().setPrompt("2+2 等於多少?"));
        done.get();
    }
}
```

### 多輪對話

```java
try (var session = client.createSession(new SessionConfig()
        .setModel("gpt-5")
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get()) {

    var response1 = session.sendAndWait("法國的首都是哪裡?").get();
    System.out.println(response1.getData().content());

    var response2 = session.sendAndWait("它的人口是多少?").get();
    System.out.println(response2.getData().content());
}
```

### 具有複雜回傳型別的工具

```java
record UserInfo(String id, String name, String email, String role) {}

var tool = ToolDefinition.create(
    "get_user",
    "檢索使用者資訊",
    Map.of(
        "type", "object",
        "properties", Map.of(
            "userId", Map.of("type", "string", "description", "使用者 ID")
        ),
        "required", List.of("userId")
    ),
    invocation -> {
        String userId = (String) invocation.getArguments().get("userId");
        return CompletableFuture.completedFuture(
            new UserInfo(userId, "John Doe", "john@example.com", "Developer")
        );
    }
);
```

### 工作階段掛鉤

```java
var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
    .setHooks(new SessionHooks()
        .setOnPreToolUse((input, invocation) -> {
            System.out.println("即將執行工具: " + input.getToolName());
            // 使用 PreToolUseHookOutput 的靜態工廠方法:
            // PreToolUseHookOutput.allow()
            // PreToolUseHookOutput.deny()
            // PreToolUseHookOutput.deny("原因")
            // PreToolUseHookOutput.ask()
            return CompletableFuture.completedFuture(PreToolUseHookOutput.allow());
        })
        .setOnPostToolUse((output, invocation) -> {
            System.out.println("工具執行完成: " + output);
            return CompletableFuture.completedFuture(null);
        })
        .setOnUserPromptSubmitted((prompt, invocation) -> {
            // 在處理前攔截使用者提示詞
            return CompletableFuture.completedFuture(null);
        })
        .setOnSessionStart((event, invocation) -> {
            return CompletableFuture.completedFuture(null);
        })
        .setOnSessionEnd((event, invocation) -> {
            return CompletableFuture.completedFuture(null);
        }))
).get();
```

## MCP 伺服器設定

透過 `SessionConfig.setMcpServers()` 設定 Model Context Protocol 伺服器：

### 基於 Stdio 的 MCP 伺服器

```java
var mcpServers = Map.of(
    "my-server", new McpStdioServerConfig()
        .setCommand("node")
        .setArgs(List.of("path/to/server.js"))
);

var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setMcpServers(mcpServers)
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

### HTTP/SSE MCP 伺服器

```java
var mcpServers = Map.of(
    "remote-server", new McpHttpServerConfig()
        .setUrl("https://my-mcp-server.example.com/sse")
);

var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setMcpServers(mcpServers)
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```

## 模型能力覆寫（自 1.3.0 起）

為 BYOK 或自訂提供者覆寫模型能力：

```java
var capabilities = new ModelCapabilitiesOverride()
    .setSupports(new ModelCapabilitiesOverride.Supports()
        .setVision(true)
        .setReasoningEffort(true))
    .setLimits(new ModelCapabilitiesOverride.Limits()
        .setMaxPromptTokens(128000));

var session = client.createSession(new SessionConfig()
    .setModel("custom-model")
    .setModelCapabilities(capabilities)
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
).get();
```
