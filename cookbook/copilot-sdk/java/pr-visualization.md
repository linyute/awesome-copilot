# 建立 PR 帳齡圖表

> **示範權限：** 這些範例僅在隔離且可信任的示範情境中使用
> `PermissionHandler.APPROVE_ALL`。若要使用不受信任的提示或工作區，請先改用
> 限制較嚴格的權限處理器。

使用 Copilot 的內建功能，建構一個互動式 CLI 工具，為 GitHub 儲存庫視覺化提取要求 (pull request) 的帳齡分佈。

> **可執行的範例：** [recipe/PRVisualization.java](recipe/PRVisualization.java)
>
> ```bash
> jbang recipe/PRVisualization.java
> ```

## 範例場景

您想了解儲存庫中的 PR 已開啟了多長時間。此工具會偵測目前的 Git 儲存庫或接受儲存庫作為輸入，然後讓 Copilot 透過 GitHub MCP Server 擷取 PR 資料並產生圖表影像。

## 使用方式

```bash
# 從目前的 git 儲存庫自動偵測
jbang recipe/PRVisualization.java

# 明確指定一個儲存庫
jbang recipe/PRVisualization.java github/copilot-sdk
```

## 完整範例: PRVisualization.java

```java
//DEPS com.github:copilot-sdk-java:1.0.21
import com.github.copilot.CopilotClient;
import com.github.copilot.generated.AssistantMessageEvent;
import com.github.copilot.generated.ToolExecutionStartEvent;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.PermissionHandler;
import com.github.copilot.rpc.SessionConfig;
import com.github.copilot.rpc.SystemMessageConfig;
import com.github.copilot.rpc.ToolSearchConfig;
import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.regex.Pattern;

public class PRVisualization {

    public static void main(String[] args) throws Exception {
        System.out.println("🔍 PR 帳齡圖表產生器\n");

        // 決定儲存庫
        String repo;
        if (args.length > 0) {
            repo = args[0];
            System.out.println("📦 使用指定的儲存庫: " + repo);
        } else if (isGitRepo()) {
            String detected = getGitHubRemote();
            if (detected != null && !detected.isEmpty()) {
                repo = detected;
                System.out.println("📦 偵測到 GitHub 儲存庫: " + repo);
            } else {
                System.out.println("⚠️  找到 Git 儲存庫但未偵測到 GitHub 遠端。");
                repo = promptForRepo();
            }
        } else {
            System.out.println("📁 不在 Git 儲存庫中。");
            repo = promptForRepo();
        }

        if (repo == null || !repo.contains("/")) {
            System.err.println("❌ 儲存庫格式無效。預期格式: owner/repo");
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
                您正在分析以下 GitHub 儲存庫的提取要求 (pull request): %s/%s
                目前的工作目錄是: %s
                </context>

                <instructions>
                - 使用 GitHub MCP Server 工具來擷取 PR 資料
                - 使用您的檔案和程式碼執行工具來產生圖表
                - 將任何產生的影像儲存到目前的工作目錄
                - 回應請保持簡潔
                </instructions>
                """, owner, repoName, cwd);

            var session = client.createSession(
                new SessionConfig().setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setModel("gpt-5")
                    .setToolSearch(new ToolSearchConfig().setEnabled(true).setDeferThreshold(20))
                    .setSystemMessage(new SystemMessageConfig().setContent(systemMessage))
            ).get();

            // 設定事件處理
            session.on(AssistantMessageEvent.class, msg -> 
                System.out.println("\n🤖 " + msg.getData().content() + "\n")
            );

            session.on(ToolExecutionStartEvent.class, evt -> 
                System.out.println("  ⚙️  " + evt.getData().toolName())
            );

            // 初始提示 - 讓 Copilot 找出詳細資訊
            System.out.println("\n📊 開始分析...\n");

            String prompt = String.format("""
                擷取 %s/%s 上週的開啟中提取要求。
                計算每個 PR 的帳齡 (以天為單位)。
                然後產生一個長條圖影像，顯示 PR 帳齡的分佈
                (將它們分組到合理的貯槽中，例如 <1 天、1-3 天等)。
                將圖表儲存為目前目錄下的 "pr-age-chart.png"。
                最後，摘要 PR 健康狀況 - 平均帳齡、最舊的 PR，以及有多少可能被視為陳舊。
                """, owner, repoName);

            session.sendAndWait(new MessageOptions().setPrompt(prompt)).get();

            // 互動式工作階段迴圈
            System.out.println("\n💡 詢問後續問題或輸入 \"exit\" 退出。\n");
            System.out.println("範例:");
            System.out.println("  - \"擴展到上個月\"");
            System.out.println("  - \"顯示最舊的 5 個 PR\"");
            System.out.println("  - \"改為產生圓餅圖\"");
            System.out.println("  - \"改按作者分組而不是按帳齡\"");
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
    // Git & GitHub 偵測
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
            // 略過
        }
        return null;
    }

    private static String promptForRepo() throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        System.out.print("輸入 GitHub 儲存庫 (owner/repo): ");
        String line = reader.readLine();
        if (line == null) {
            throw new EOFException("讀取儲存庫名稱時遇到輸入結尾");
        }
        return line.trim();
    }
}
```

## 運作原理

1. **儲存庫偵測**: 檢查命令列引數 → git 遠端 → 提示使用者
2. **無需自訂工具**: 完全依賴 Copilot CLI 的內建功能：
   - **GitHub MCP Server** — 從 GitHub 擷取 PR 資料
   - **檔案工具** — 儲存產生的圖表影像
   - **程式碼執行** — 使用 Python/matplotlib 或其他方法產生圖表
3. **互動式工作階段**: 在初始分析之後，使用者可以要求調整

## 為什麼使用這種方法？

| 面項            | 自訂工具          | 內建 Copilot                      |
| --------------- | ----------------- | --------------------------------- |
| 程式碼複雜度   | 高                | **極小**                          |
| 維護             | 您負責維護        | **Copilot 維護**                  |
| 彈性             | 固定邏輯          | **AI 決定最佳方法**               |
| 圖表類型         | 您編寫的內容      | **Copilot 能產生的任何類型**      |
| 資料分組         | 硬編碼的貯槽      | **智慧分組**                      |

## 使用工具搜尋延遲載入工具

GitHub MCP Server 除了檔案和程式碼執行工具外，還可以公開許多工具。設定
`SessionConfig.setToolSearch(...)`，即可依類別和執行階段政策延遲載入符合條件的
MCP 與 SDK 定義外部工具，之後再透過中繼資料搜尋來探索這些工具。延遲載入不會
追蹤工具的使用頻率：

```java
import com.github.copilot.rpc.ToolSearchConfig;

var session = client.createSession(new SessionConfig()
    .setModel("auto")
    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
    .setToolSearch(new ToolSearchConfig()
        .setEnabled(true)
        .setDeferThreshold(20))
).get();
```

- `setEnabled(true)` 會明確啟用工具搜尋。若未設定，則交由執行階段控制是否自動
    啟用；這取決於模型能力、傳輸方式、執行階段設定、停用開關及實驗設定。設為
    `false` 會停用搜尋延遲載入，但不會停用獨立的工具篩選、政策或可用性設定。
- `setDeferThreshold(20)` 只有在套用工具集和代理程式篩選後，有效工具目錄中的
    工具數量**嚴格超過 20 個**時，才會考慮延遲載入。計數包含內建工具、MCP 工具
    和 SDK 定義的工具，但不包含搜尋工具或代管搜尋機制。
- 超過門檻後，符合條件的 MCP 與 SDK 定義外部工具會延遲載入；並非所有工具都會
    延遲載入，也不是只有前 20 個之後的工具才會延遲載入。一般內建工具和豁免工具
    仍會立即載入，因此直接可見的工具數量沒有固定值。豁免項目包括標記為
    `defer: "never"` 的工具、搜尋工具本身、GitHub MCP `web_search`、Bluebird MCP
    工具，以及明確選取的代理程式工具（除非該代理程式選擇延遲載入）。
- 若未設定 `enabled` 或 `deferThreshold`，則由所選執行階段決定。SDK 1.0.21
    隨附的執行階段使用 30 作為門檻；明確設定這些值可避免依賴特定版本的預設值。
    只有執行階段判定已啟用工具搜尋時，明確設定的門檻才會生效。

設定的範圍是工作階段，恢復工作階段時也適用。若子代理程式需要不同於執行階段
預設值的設定，必須自行覆寫。工具搜尋會在每一輪依據目前的目錄進行解析；若結果
穩定，可能會重複使用，但模型、傳輸方式、設定、執行階段控管或實驗設定有所變更
時，可能會觸發重新解析。搜尋會依中繼資料排序，優先考量名稱，其次是描述和參數
中繼資料；部分搜尋路徑也會使用命名空間／伺服器中繼資料。

## 最佳實踐

1. **從自動偵測開始**: 在提示使用者之前，讓工具從 git 遠端偵測儲存庫
2. **使用系統訊息**: 提供關於儲存庫和工作目錄的上下文，以便 Copilot 可以自主行動
3. **限制工具權限**：僅在隔離且可信任的示範環境中使用 `PermissionHandler.APPROVE_ALL`。對於不可信任的提示或工作區（包括 GitHub MCP 和圖表產生工具），請使用限制較嚴格的處理常式。
4. **互動式後續行動**: 讓使用者透過對話方式精進分析，而不是要求重新啟動
5. **在本地端儲存成品**: 指示 Copilot 將產生的圖表儲存到目前的目錄中，以便輕鬆存取
