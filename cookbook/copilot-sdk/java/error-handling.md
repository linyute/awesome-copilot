# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

> **示範權限：** 這些範例僅在隔離且可信任的示範環境中使用
> `PermissionHandler.APPROVE_ALL`。在使用不受信任的提示或工作區之前，請改用限制較嚴格的權限處理器。

> **可執行的範例：** [recipe/ErrorHandling.java](recipe/ErrorHandling.java)
>
> ```bash
> jbang recipe/ErrorHandling.java
> ```

## 範例情境

您需要處理各種錯誤狀況，例如連線失敗、逾時和無效的回應。

## 基礎 try-with-resources

Java 的 `try-with-resources` 可確保即使發生例外狀況，用戶端也始終會被清理。

```java
//DEPS com.github:copilot-sdk-java:1.0.21

import com.github.copilot.*;
import com.github.copilot.rpc.*;

public class BasicErrorHandling {
    public static void main(String[] args) {
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(
                new SessionConfig()
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setModel("gpt-5")).get();

            var response = session.sendAndWait(
                new MessageOptions().setPrompt("哈囉！")).get();
            System.out.println(response.getData().content());

            session.close();
        } catch (Exception ex) {
            System.err.println("錯誤: " + ex.getMessage());
        }
    }
}
```

## 處理特定錯誤類型

每個 `CompletableFuture.get()` 呼叫都會將失敗包裝在 `ExecutionException` 中。請解開原因以檢查真正的錯誤。

```java
import java.io.IOException;
import java.util.concurrent.ExecutionException;

try (var client = new CopilotClient()) {
    client.start().get();
} catch (ExecutionException ex) {
    var cause = ex.getCause();
    if (cause instanceof IOException) {
        System.err.println("找不到 Copilot CLI 或無法連線: " + cause.getMessage());
    } else {
        System.err.println("未預期的錯誤: " + cause.getMessage());
    }
} catch (InterruptedException ex) {
    Thread.currentThread().interrupt();
    System.err.println("啟動用戶端時被中斷。");
}
```

## 逾時處理

在 `CompletableFuture` 上使用多載的 `get(timeout, unit)` 來強制執行時間限制。

```java
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

var session = client.createSession(
    new SessionConfig()
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
        .setModel("gpt-5")).get();

try {
    var response = session.sendAndWait(
        new MessageOptions().setPrompt("複雜的問題..."))
        .get(30, TimeUnit.SECONDS);

    System.out.println(response.getData().content());
} catch (TimeoutException ex) {
    System.err.println("請求在 30 秒後逾時。");
    session.abort().get();
}
```

## 中止請求

藉由呼叫 `session.abort()` 來取消進行中的請求。

```java
var session = client.createSession(
    new SessionConfig()
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
        .setModel("gpt-5")).get();

// 在不等待的情況下開始請求
session.send(new MessageOptions().setPrompt("寫一個很長的故事..."));

// 在某些條件後中止
Thread.sleep(5000);
session.abort().get();
System.out.println("請求已中止。");
```

## 優雅關閉

當程序被中斷時，使用 JVM 關閉掛鉤 (shutdown hook) 來進行清理。

```java
var client = new CopilotClient();
client.start().get();

Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    System.out.println("正在關閉...");
    try {
        client.close();
    } catch (Exception ex) {
        System.err.println("清理錯誤: " + ex.getMessage());
    }
}));
```

`client.stop()` 會回傳 `CompletableFuture`；請觀察其結果，以捕捉 SDK 回報的錯誤，而不要只依賴會隱藏清理錯誤的 `close()`。程序內 FFI 清理也可能記錄錯誤或以非同步方式繼續執行，因此 stop 完成並不代表所有原生資源的清理階段都已成功。如果優雅停止超出應用程式的關閉期限，請使用 `client.forceStop()` 在本機終止連線與工作階段。

## Try-with-resources (巢狀)

處理多個工作階段時，請巢狀化 `try-with-resources` 區塊，以保證每個資源都已關閉。

```java
try (var client = new CopilotClient()) {
    client.start().get();

    try (var session = client.createSession(
            new SessionConfig()
                .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                .setModel("gpt-5")).get()) {

        session.sendAndWait(
            new MessageOptions().setPrompt("哈囉！")).get();
    } // 工作階段在這裡關閉

} // 用戶端在這裡關閉
```

## 標記訊息來源

使用 `MessageOptions.setSource(...)`，在診斷非預期回合時區分歸因於使用者的訊息、
應用程式內容或其他代理程式的訊息：

```java
import com.github.copilot.rpc.MessageSource;

session.sendAndWait(new MessageOptions()
    .setPrompt("上一個版本有哪些變更？")
    .setSource(MessageSource.USER)).get();

session.sendAndWait(new MessageOptions()
    .setPrompt("重新執行失敗的步驟並回報結果。")
    .setSource(MessageSource.SYSTEM)).get();

session.sendAndWait(new MessageOptions()
    .setPrompt("摘要目前尚未結案的事件。")
    .setSource(MessageSource.agent("incident-bot"))).get();
```

省略 `source` 時會交由所選的執行階段處理；SDK 1.0.21 隨附的執行階段會將其視為使用者來源，
等同於 `MessageSource.USER`。此歸因並不能證明訊息確實由真人輸入。
`MessageSource.agent(id)` 會序列化為 `"agent-<id>"`；傳入識別碼時請勿加上此前綴。
此工廠僅拒絕 `null`，不會正規化前綴，也不會驗證空白值、格式或長度限制。請驗證跨越信任邊界的識別碼。
來源值和代理程式 ID 可能出現在事件、歷史記錄、佇列快照及診斷資訊中，因此請勿在其中放入機密資料。

來源是呼叫端提供、會影響行為的來源資訊，不是經過驗證的身分。執行階段可能會將其用於佇列處理與導引、
可見性與篩選、代理程式間路由、對話／內容重建，以及真人授權證據的分類。來源本身無法授予、拒絕或回應權限要求，
但來源分類可能間接影響自動核准。切勿只依據來源值授權操作。

`MessageSource.SYSTEM` 並非模型的 system 角色訊息：它不會變更模型可見的角色、修改工作階段的 system prompt，
也不會提高指令優先級。獨立的傳遞 `mode` 用來控制佇列接納（預設為 `enqueue`），
或嘗試導引進行中的回合（`immediate`）；它與來源彼此獨立，但來源仍可能影響執行階段的處理方式。

`send(...)` 和 `sendAndWait(...)` 會保留相同的來源值。非使用者歸因會保存在持久化的 `user.message` 事件中，
並在重播時還原。使用者來源會以未設定來源的形式儲存，因此明確指定 `USER` 與省略來源在持久化後無法區分。

## 處理工具錯誤

定義工具時，請回傳一個錯誤字串來向模型發出失敗訊號，而不是拋出例外狀況。

```java
import com.github.copilot.rpc.ToolDefinition;
import java.util.concurrent.CompletableFuture;

var readFileTool = ToolDefinition.create(
    "read_file",
    "從磁碟讀取檔案",
    Map.of(
        "type", "object",
        "properties", Map.of(
            "path", Map.of("type", "string", "description", "檔案路徑")
        ),
        "required", List.of("path")
    ),
    invocation -> {
        try {
            var path = (String) invocation.getArguments().get("path");
            var content = java.nio.file.Files.readString(
                java.nio.file.Path.of(path));
            return CompletableFuture.completedFuture(content);
        } catch (java.io.IOException ex) {
            return CompletableFuture.completedFuture(
                "錯誤: 無法讀取檔案: " + ex.getMessage());
        }
    }
);

// 建立工作階段時註冊工具
var session = client.createSession(
    new SessionConfig()
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
        .setModel("gpt-5")
        .setTools(List.of(readFileTool))
).get();
```

## 最佳實務

1. **使用 try-with-resources**：務必將 `CopilotClient` (以及工作階段，如果是 `AutoCloseable`) 包裝在 try-with-resources 中，以保證清理。
2. **解開 `ExecutionException`**：呼叫 `getCause()` 來檢查真正的錯誤 — 外部的 `ExecutionException` 只是 `CompletableFuture` 的包裝。
3. **還原中斷旗標**：捕捉 `InterruptedException` 時，呼叫 `Thread.currentThread().interrupt()` 以保留中斷狀態。
4. **設定逾時**：針對任何可能無限期阻塞的呼叫，請使用 `get(timeout, TimeUnit)` 而不是單純的 `get()`。
5. **回傳工具錯誤，不要拋出**：從 `CompletableFuture` 回傳錯誤字串，讓模型可以優雅地恢復。
6. **記錄錯誤**：擷取錯誤詳細資訊以供偵錯 — 對於生產環境應用程式，請考慮使用像 SLF4J 這樣的記錄框架。
