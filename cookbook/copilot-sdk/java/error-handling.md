# 錯誤處理模式

在您的 Copilot SDK 應用程式中優雅地處理錯誤。

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
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.json.*;

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

## 處理工具錯誤

定義工具時，請回傳一個錯誤字串來向模型發出失敗訊號，而不是拋出例外狀況。

```java
import com.github.copilot.sdk.json.ToolDefinition;
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
