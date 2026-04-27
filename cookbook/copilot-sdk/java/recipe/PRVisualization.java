///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.events.ToolExecutionStartEvent;
import com.github.copilot.sdk.json.MessageOptions;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.SessionConfig;
import com.github.copilot.sdk.json.SystemMessageConfig;
import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.regex.Pattern;

public class PRVisualization {

    public static void main(String[] args) throws Exception {
        System.out.println("🔍 PR 年齡圖表產生器\n");

        // 判斷儲存庫
        String repo;
        if (args.length > 0) {
            repo = args[0];
            System.out.println("📦 使用指定的儲存庫: " + repo);
        } else if (isGitRepo()) {
            String detected = getGitHubRemote();
            if (detected != null && !detected.isEmpty()) {
                repo = detected;
                System.out.println("📦 偵測到的 GitHub 儲存庫: " + repo);
            } else {
                System.out.println("⚠️  找到 Git 儲存庫但未偵測到 GitHub 遠端。");
                repo = promptForRepo();
            }
        } else {
            System.out.println("📁 不在 git 儲存庫中。");
            repo = promptForRepo();
        }

        if (repo == null || !repo.contains("/")) {
            System.err.println("❌ 無效的儲存庫格式。預期為: owner/repo");
            System.exit(1);
        }

        String[] parts = repo.split("/", 2);
        String owner = parts[0];
        String repoName = parts[1];

        // 建立 Copilot 用戶端
        try (var client = new CopilotClient()) {
            client.start().get();

            String cwd = System.getProperty("user.dir");
            var systemMessage = String.format("""
                <context>
                您正在分析 GitHub 儲存庫的 Pull Request: %s/%s
                目前的作業目錄為: %s
                </context>

                <instructions>
                - 使用 GitHub MCP Server 工具來擷取 PR 資料
                - 使用您的檔案和程式碼執行工具來產生圖表
                - 將任何產生的影像儲存至目前的作業目錄
                - 回覆請簡潔
                </instructions>
                """, owner, repoName, cwd);

            var session = client.createSession(
                new SessionConfig().setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setModel("gpt-5")
                    .setSystemMessage(new SystemMessageConfig().setContent(systemMessage))
            ).get();

            // 設定事件處理
            session.on(AssistantMessageEvent.class, msg -> 
                System.out.println("\n🤖 " + msg.getData().content() + "\n")
            );

            session.on(ToolExecutionStartEvent.class, evt -> 
                System.out.println("  ⚙️  " + evt.getData().toolName())
            );

            // 初始提示 - 讓 Copilot 自行判斷詳細資料
            System.out.println("\n📊 開始分析...\n");

            String prompt = String.format("""
                擷取 %s/%s 上週以來開啟的 pull requests。
                計算每個 PR 的年齡 (以天數計)。
                然後產生顯示 PR 年齡分佈的長條圖影像
                (將它們分組至合理的區間，例如 <1 天、1-3 天等)。
                將圖表以 "pr-age-chart.png" 為名儲存於目前目錄。
                最後，總結 PR 品質 - 平均年齡、最舊的 PR，以及多少可能被視為已過時。
                """, owner, repoName);

            session.sendAndWait(new MessageOptions().setPrompt(prompt)).get();

            // 互動式迴圈
            System.out.println("\n💡 詢問後續問題或輸入 \"exit\" 以退出。\n");
            System.out.println("範例:");
            System.out.println("  - \"擴展至上個月\"");
            System.out.println("  - \"顯示我 5 個最舊的 PR\"");
            System.out.println("  - \"改為產生圓餅圖\"");
            System.out.println("  - \"依作者而非年齡分組\"");
            System.out.println();

            try (var reader = new BufferedReader(new InputStreamReader(System.in))) {
                while (true) {
                    System.out.print("您: ");
                    String input = reader.readLine();
                    if (input == null) break;
                    input = input.trim();

                    if (input.isEmpty()) continue;
                    if (input.equalsIgnoreCase("exit") || input.equalsIgnoreCase("quit")) {
                        System.out.println("👋 再見!");
                        break;
                    }

                    session.sendAndWait(new MessageOptions().setPrompt(input)).get();
                }
            }

            session.close();
        }
    }

    // ============================================================================
    // Git 與 GitHub 偵測
    // ============================================================================

    private static boolean isGitRepo() {
        try {
            Process proc = Runtime.getRuntime().exec(new String[]{"git", "rev-parse", "--git-dir"});
            return proc.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private static String getGitHubRemote() {
        try {
            Process proc = Runtime.getRuntime().exec(new String[]{"git", "remote", "get-url", "origin"});
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(proc.getInputStream()))) {
                String remoteURL = reader.readLine();
                if (remoteURL == null) return null;
                remoteURL = remoteURL.trim();

                // 處理 SSH: git@github.com:owner/repo.git
                var sshPattern = Pattern.compile("git@github\\.com:(.+/.+?)(?:\\.git)?$");
                var sshMatcher = sshPattern.matcher(remoteURL);
                if (sshMatcher.find()) {
                    return sshMatcher.group(1);
                }

                // 處理 HTTPS: https://github.com/owner/repo.git
                var httpsPattern = Pattern.compile("https://github\\.com/(.+/.+?)(?:\\.git)?$");
                var httpsMatcher = httpsPattern.matcher(remoteURL);
                if (httpsMatcher.find()) {
                    return httpsMatcher.group(1);
                }
            }
        } catch (Exception e) {
            // 忽略
        }
        return null;
    }

    private static String promptForRepo() throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        System.out.print("輸入 GitHub 儲存庫 (owner/repo): ");
        String line = reader.readLine();
        if (line == null) {
            throw new EOFException("讀取儲存庫名稱時輸入結束");
        }
        return line.trim();
    }
}
