///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.events.*;
import com.github.copilot.sdk.json.*;
import java.nio.file.*;

/**
 * 簡單 Ralph 迴圈 — 讀取 PROMPT.md 並在每次迭代時於全新的作業階段中執行。
 *
 * 使用方式:
 *   jbang RalphLoop.java                  # 預設: PROMPT.md, 50 次迭代
 *   jbang RalphLoop.java PROMPT.md 20     # 自訂提示檔案, 20 次迭代
 */
public class RalphLoop {
    public static void main(String[] args) throws Exception {
        String promptFile = args.length > 0 ? args[0] : "PROMPT.md";
        int maxIterations = args.length > 1 ? Integer.parseInt(args[1]) : 50;

        System.out.printf("Ralph 迴圈 — 提示: %s, 最大迭代次數: %d%n", promptFile, maxIterations);

        try (var client = new CopilotClient()) {
            client.start().get();

            String prompt = Files.readString(Path.of(promptFile));

            for (int i = 1; i <= maxIterations; i++) {
                System.out.printf("%n=== 迭代 %d/%d ===%n", i, maxIterations);

                // 每次迭代均使用全新的作業階段 — 上下文隔離正是其目的
                var session = client.createSession(
                    new SessionConfig()
                        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                        .setModel("gpt-5.1-codex-mini")
                        .setWorkingDirectory(System.getProperty("user.dir"))
                ).get();

                // 記錄工具使用以供可視化
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

        System.out.println("\n所有迭代完成。");
    }
}
