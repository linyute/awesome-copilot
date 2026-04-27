///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.events.*;
import com.github.copilot.sdk.json.*;

public class PersistingSessions {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 建立具有自訂 ID 的作業階段，以便稍後恢復
            var session = client.createSession(
                new SessionConfig()
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setSessionId("user-123-conversation")
                    .setModel("gpt-5")
            ).get();

            session.on(AssistantMessageEvent.class,
                msg -> System.out.println(msg.getData().content()));

            session.sendAndWait(new MessageOptions()
                .setPrompt("讓我們討論 TypeScript generics")).get();

            System.out.println("\n作業階段 ID: " + session.getSessionId());

            // 關閉作業階段，但將資料儲存於磁碟以便稍後恢復
            session.close();
            System.out.println("作業階段已關閉 — 資料已儲存於磁碟。");
        }
    }
}
