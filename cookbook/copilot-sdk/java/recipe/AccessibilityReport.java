///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.events.*;
import com.github.copilot.sdk.json.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * 無障礙檢視報告產生器 — 使用 Playwright MCP 伺服器來分析網頁，
 * 並產生符合 WCAG 標準的無障礙檢視報告。
 *
 * 使用方式:
 *   jbang AccessibilityReport.java
 */
public class AccessibilityReport {
    public static void main(String[] args) throws Exception {
        System.out.println("=== 無障礙檢視報告產生器 ===\n");

        var reader = new BufferedReader(new InputStreamReader(System.in));

        System.out.print("輸入要分析的網址: ");
        String urlLine = reader.readLine();
        if (urlLine == null) {
            System.out.println("未提供網址。結束執行。");
            return;
        }
        String url = urlLine.trim();
        if (url.isEmpty()) {
            System.out.println("未提供網址。結束執行。");
            return;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        System.out.printf("%n正在分析: %s%n", url);
        System.out.println("請稍候...\n");

        try (var client = new CopilotClient()) {
            client.start().get();

            // 設定 Playwright MCP 伺服器以進行瀏覽器自動化
            Map<String, Object> mcpConfig = Map.of(
                "type", "local",
                "command", "npx",
                "args", List.of("@playwright/mcp@latest"),
                "tools", List.of("*")
            );

            var session = client.createSession(
                new SessionConfig()
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setModel("claude-opus-4.6")
                    .setStreaming(true)
                    .setMcpServers(Map.of("playwright", mcpConfig))
            ).get();

            // 逐 token 串流輸出
            var idleLatch = new CountDownLatch(1);

            session.on(AssistantMessageDeltaEvent.class,
                ev -> System.out.print(ev.getData().deltaContent()));

            session.on(SessionIdleEvent.class,
                ev -> idleLatch.countDown());

            session.on(SessionErrorEvent.class, ev -> {
                System.err.printf("%n錯誤: %s%n", ev.getData().message());
                idleLatch.countDown();
            });

            String prompt = """
                使用 Playwright MCP 伺服器來分析此網頁的無障礙檢視: %s

                請:
                1. 使用 playwright-browser_navigate 瀏覽至該網址
                2. 使用 playwright-browser_snapshot 拍攝無障礙檢視快照
                3. 分析該快照並提供詳細的無障礙檢視報告

                請使用表情符號指示符格式化報告:
                - 📊 無障礙檢視報告標題
                - ✅ 運作良好的部分 (表格：類別、狀態、詳細資訊)
                - ⚠️ 發現的問題 (表格：嚴重程度、問題、WCAG 準則、建議)
                - 📋 統計摘要 (連結、標題、可聚焦元件、地標)
                - ⚙️ 優先建議事項

                使用 ✅ 代表通過，🔴 代表嚴重等級問題，🟡 代表中等嚴重等級，❌ 代表缺少項目。
                包含來自網頁分析的實際發現。
                """.formatted(url);

            session.send(new MessageOptions().setPrompt(prompt));
            idleLatch.await();

            System.out.println("\n\n=== 報告完成 ===\n");

            // 提示使用者產生測試
            System.out.print("您想要產生 Playwright 無障礙檢視測試嗎? (y/n): ");
            String generateTestsLine = reader.readLine();
            String generateTests = generateTestsLine == null ? "" : generateTestsLine.trim();

            if (generateTests.equalsIgnoreCase("y") || generateTests.equalsIgnoreCase("yes")) {
                var testLatch = new CountDownLatch(1);

                session.on(SessionIdleEvent.class,
                    ev -> testLatch.countDown());

                String testPrompt = """
                    根據您剛才為 %s 產生的無障礙檢視報告，
                    使用 Java 建立 Playwright 無障礙檢視測試。

                    包含以下測試: lang 屬性、標題、標題階層、alt 文字、
                    地標、跳過導覽、焦點指示符和觸控目標。
                    使用 Playwright 的無障礙檢視測試功能並加上有幫助的註解。
                    輸出完整的測試檔案。
                    """.formatted(url);

                System.out.println("\n正在產生無障礙檢視測試...\n");
                session.send(new MessageOptions().setPrompt(testPrompt));
                testLatch.await();

                System.out.println("\n\n=== 測試已產生 ===");
            }

            session.close();
        }
    }
}
