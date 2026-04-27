///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.events.SessionIdleEvent;
import com.github.copilot.sdk.events.ToolExecutionCompleteEvent;
import com.github.copilot.sdk.events.ToolExecutionStartEvent;
import com.github.copilot.sdk.json.MessageOptions;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.SessionConfig;
import java.util.concurrent.CountDownLatch;

public class ManagingLocalFiles {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 建立作業階段
            var session = client.createSession(
                new SessionConfig().setOnPermissionRequest(PermissionHandler.APPROVE_ALL).setModel("gpt-5")).get();

            // 設定事件處理常式
            var done = new CountDownLatch(1);

            session.on(AssistantMessageEvent.class, msg -> 
                System.out.println("\nCopilot: " + msg.getData().content())
            );

            session.on(ToolExecutionStartEvent.class, evt -> 
                System.out.println("  → 正在執行: " + evt.getData().toolName())
            );

            session.on(ToolExecutionCompleteEvent.class, evt -> 
                System.out.println("  ✓ 已完成: " + evt.getData().toolCallId())
            );

            session.on(SessionIdleEvent.class, evt -> done.countDown());

            // 要求 Copilot 整理檔案 - 使用安全的範例資料夾
            // 若要實際使用，請替換為您的目標資料夾
            String targetFolder = args.length > 0 ? args[0] : 
                System.getProperty("java.io.tmpdir") + "/example-files";

            String prompt = String.format("""
                分析 "%s" 中的檔案，並顯示您將如何將它們整理至子資料夾。

                1. 首先，列出所有檔案及其 Metadata
                2. 預覽依檔案副檔名分組
                3. 建議適當的子資料夾 (例如: "images", "documents", "videos")
                
                重要: 請勿移動任何檔案。僅顯示計畫。
                """, targetFolder);

            session.send(new MessageOptions().setPrompt(prompt));

            // 等待完成
            done.await();

            session.close();
        }
    }
}
