# 工作階段持續性與恢復

在應用程式重新啟動時儲存並還原對話工作階段。

> **可執行的範例：** [recipe/PersistingSessions.java](recipe/PersistingSessions.java)
>
> ```bash
> jbang recipe/PersistingSessions.java
> ```

## 範例情境

您希望使用者即使在關閉並重新開啟您的應用程式後，也能夠繼續對話。Copilot SDK 會自動將工作階段狀態儲存到磁碟 — 您只需要提供一個穩定的工作階段 ID 並在稍後恢復。

## 建立具有自訂 ID 的工作階段

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.json.MessageOptions;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.SessionConfig;

public class CreateSessionWithId {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 建立具有易記 ID 的工作階段
            var session = client.createSession(
                new SessionConfig()
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setSessionId("user-123-conversation")
                    .setModel("gpt-5")
            ).get();

            session.on(AssistantMessageEvent.class, msg ->
                System.out.println(msg.getData().content())
            );

            session.sendAndWait(new MessageOptions()
                .setPrompt("Let's discuss TypeScript generics")).get();

            // 工作階段 ID 會被保留
            System.out.println("Session ID: " + session.getSessionId());

            // 關閉工作階段，但將資料保留在磁碟上
            session.close();
        }
    }
}
```

## 恢復工作階段

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.json.MessageOptions;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.ResumeSessionConfig;

public class ResumeSession {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 恢復之前的工作階段
            var session = client.resumeSession(
                "user-123-conversation",
                new ResumeSessionConfig()
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
            ).get();

            session.on(AssistantMessageEvent.class, msg ->
                System.out.println(msg.getData().content())
            );

            // 先前的內容已恢復
            session.sendAndWait(new MessageOptions()
                .setPrompt("我們剛才在討論什麼？")).get();

            session.close();
        }
    }
}
```

## 列出可用的工作階段

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;

public class ListSessions {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            var sessions = client.listSessions().get();
            for (var sessionInfo : sessions) {
                System.out.println("工作階段：" + sessionInfo.getSessionId());
            }
        }
    }
}
```

## 永久刪除工作階段

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;

public class DeleteSession {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 從磁碟移除工作階段及其所有資料
            client.deleteSession("user-123-conversation").get();
            System.out.println("工作階段已刪除");
        }
    }
}
```

## 取得工作階段歷程紀錄

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.events.UserMessageEvent;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.ResumeSessionConfig;

public class SessionHistory {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            var session = client.resumeSession(
                "user-123-conversation",
                new ResumeSessionConfig()
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
            ).get();

            var messages = session.getMessages().get();
            for (var event : messages) {
                if (event instanceof AssistantMessageEvent msg) {
                    System.out.printf("[助理] %s%n", msg.getData().content());
                } else if (event instanceof UserMessageEvent userMsg) {
                    System.out.printf("[使用者] %s%n", userMsg.getData().content());
                } else {
                    System.out.printf("[%s]%n", event.getType());
                }
            }

            session.close();
        }
    }
}
```

## 包含工作階段管理功能的完整範例

這個互動式範例讓您能從命令列建立、恢復或列出工作階段。

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.json.*;
import java.util.Scanner;

public class SessionManager {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient();
             var scanner = new Scanner(System.in)) {

            client.start().get();

            System.out.println("工作階段管理員");
            System.out.println("1. 建立新工作階段");
            System.out.println("2. 恢復現有工作階段");
            System.out.println("3. 列出工作階段");
            System.out.print("請選擇一個選項：");

            int choice = scanner.nextInt();
            scanner.nextLine();

            switch (choice) {
                case 1 -> {
                    System.out.print("輸入工作階段 ID：");
                    String sessionId = scanner.nextLine();
                    var session = client.createSession(
                        new SessionConfig()
                            .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                            .setSessionId(sessionId)
                            .setModel("gpt-5")
                    ).get();

                    session.on(AssistantMessageEvent.class, msg ->
                        System.out.println("\nCopilot: " + msg.getData().content())
                    );

                    System.out.println("已建立工作階段：" + sessionId);
                    chatLoop(session, scanner);
                    session.close();
                }

                case 2 -> {
                    System.out.print("輸入要恢復的工作階段 ID：");
                    String resumeId = scanner.nextLine();
                    try {
                        var session = client.resumeSession(
                            resumeId,
                            new ResumeSessionConfig()
                                .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                        ).get();

                        session.on(AssistantMessageEvent.class, msg ->
                            System.out.println("\nCopilot: " + msg.getData().content())
                        );

                        System.out.println("已恢復工作階段：" + resumeId);
                        chatLoop(session, scanner);
                        session.close();
                    } catch (Exception ex) {
                        System.err.println("恢復工作階段失敗：" + ex.getMessage());
                    }
                }

                case 3 -> {
                    var sessions = client.listSessions().get();
                    System.out.println("\n可用的工作階段：");
                    for (var s : sessions) {
                        System.out.println("  - " + s.getSessionId());
                    }
                }

                default -> System.out.println("無效的選擇");
            }
        }
    }

    static void chatLoop(Object session, Scanner scanner) throws Exception {
        System.out.println("\n開始對話 (輸入 'exit' 結束)：");
        while (true) {
            System.out.print("\n您：");
            String input = scanner.nextLine();
            if (input.equalsIgnoreCase("exit")) break;

            // 使用無反射方法：將其轉型為工作階段類別
            var s = (com.github.copilot.sdk.CopilotSession) session;
            s.sendAndWait(new MessageOptions().setPrompt(input)).get();
        }
    }
}
```

## 檢查工作階段是否存在

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.json.*;

public class CheckSession {
    public static boolean sessionExists(CopilotClient client, String sessionId) {
        try {
            var sessions = client.listSessions().get();
            return sessions.stream()
                .anyMatch(s -> s.getSessionId().equals(sessionId));
        } catch (Exception ex) {
            return false;
        }
    }

    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            String sessionId = "user-123-conversation";

            if (sessionExists(client, sessionId)) {
                System.out.println("工作階段已存在，正在恢復...");
                var session = client.resumeSession(
                    sessionId,
                    new ResumeSessionConfig()
                        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                ).get();
                // ... 使用工作階段 ...
                session.close();
            } else {
                System.out.println("工作階段不存在，正在建立新的...");
                var session = client.createSession(
                    new SessionConfig()
                        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                        .setSessionId(sessionId)
                        .setModel("gpt-5")
                ).get();
                // ... 使用工作階段 ...
                session.close();
            }
        }
    }
}
```

## 最佳實務

1. **使用具意義的工作階段 ID**：在工作階段 ID 中包含使用者 ID 或內容 (例如：`"user-123-chat"`、`"task-456-review"`)
2. **處理遺失的工作階段**：在恢復前檢查工作階段是否存在 — 使用 `listSessions()` 或捕捉來自 `resumeSession()` 的例外狀況
3. **清理舊的工作階段**：定期使用 `deleteSession()` 刪除不再需要的工作階段
4. **錯誤處理**：務必將恢復操作包裝在 try-catch 區塊中 — 工作階段可能已被刪除或已過期
5. **工作區感知**：工作階段與工作區路徑綁定；在跨環境恢復時請確保一致性
