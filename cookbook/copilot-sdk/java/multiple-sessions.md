# 使用多個工作階段

同時管理多個獨立對話。

> **可執行的範例：** [recipe/MultipleSessions.java](recipe/MultipleSessions.java)
>
> ```bash
> jbang recipe/MultipleSessions.java
> ```

## 範例場景

您需要平行執行多個對話，每個對話都有自己的上下文和歷程記錄。

## Java

```java
///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.json.*;

public class MultipleSessions {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 建立多個獨立的工作階段
            var session1 = client.createSession(new SessionConfig()
                .setModel("gpt-5")
                .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();
            var session2 = client.createSession(new SessionConfig()
                .setModel("gpt-5")
                .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();
            var session3 = client.createSession(new SessionConfig()
                .setModel("claude-sonnet-4.5")
                .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();

            // 每個工作階段都維護自己的對話歷程記錄
            session1.sendAndWait(new MessageOptions().setPrompt("您正在協助處理一個 Python 專案")).get();
            session2.sendAndWait(new MessageOptions().setPrompt("您正在協助處理一個 TypeScript 專案")).get();
            session3.sendAndWait(new MessageOptions().setPrompt("您正在協助處理一個 Go 專案")).get();

            // 後續訊息保留在各自的上下文中
            session1.sendAndWait(new MessageOptions().setPrompt("我該如何建立虛擬環境？")).get();
            session2.sendAndWait(new MessageOptions().setPrompt("我該如何設定 tsconfig？")).get();
            session3.sendAndWait(new MessageOptions().setPrompt("我該如何初始化模組？")).get();

            // 清理所有工作階段
            session1.close();
            session2.close();
            session3.close();
        }
    }
}
```

## 自訂工作階段 ID

使用自訂 ID 以便於追蹤：

```java
var session = client.createSession(new SessionConfig()
    .setSessionId("user-123-chat")
    .setModel("gpt-5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();

System.out.println(session.getSessionId()); // "user-123-chat"
```

## 列出工作階段

```java
var sessions = client.listSessions().get();
System.out.println(sessions);
// [SessionInfo{sessionId="user-123-chat", ...}, ...]
```

## 刪除工作階段

```java
// 刪除特定工作階段
client.deleteSession("user-123-chat").get();
```

## 使用 CompletableFuture 管理工作階段生命週期

使用 `CompletableFuture.allOf` 平行建立工作階段並傳送訊息：

```java
import java.util.concurrent.CompletableFuture;

// 平行建立所有工作階段
var f1 = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL));
var f2 = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL));
var f3 = client.createSession(new SessionConfig()
    .setModel("claude-sonnet-4.5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL));

CompletableFuture.allOf(f1, f2, f3).get();

var s1 = f1.get();
var s2 = f2.get();
var s3 = f3.get();

// 平行傳送訊息
CompletableFuture.allOf(
    s1.sendAndWait(new MessageOptions().setPrompt("解釋 Java records")),
    s2.sendAndWait(new MessageOptions().setPrompt("解釋 sealed classes")),
    s3.sendAndWait(new MessageOptions().setPrompt("解釋模式比對"))
).get();
```

## 提供自訂 Executor

為平行工作階段工作提供您自己的執行緒池：

```java
import java.util.concurrent.Executors;

var executor = Executors.newFixedThreadPool(4);

var client = new CopilotClient(new CopilotClientOptions()
    .setExecutor(executor));
client.start().get();

// 工作階段現在在自訂 Executor 上執行
var session = client.createSession(new SessionConfig()
    .setModel("gpt-5")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();

session.sendAndWait(new MessageOptions().setPrompt("您好！")).get();

session.close();
client.stop().get();
executor.shutdown();
```

## 使用案例

- **多使用者應用程式**：每個使用者一個工作階段
- **多任務工作流程**：為不同任務使用個別的工作階段
- **A/B 測試**：比較來自不同模型的內容
