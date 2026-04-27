# 產生協助工具報告

建構一個 CLI 工具，使用 Playwright MCP server 分析網頁協助工具，並產生詳細的 WCAG 相容報告，且可選擇產生測試。

> **可執行的範例：** [recipe/AccessibilityReport.java](recipe/AccessibilityReport.java)
>
> ```bash
> jbang recipe/AccessibilityReport.java
> ```

## 範例情境

您想要稽核網站的協助工具合規性。此工具使用 Playwright 導覽至 URL，擷取協助工具快照，並產生一份結構化報告，涵蓋 WCAG 標準，例如地標 (landmarks)、標題階層、焦點管理和觸控目標。它還可以產生 Playwright 測試檔案，以自動執行未來的協助工具檢查。

## 先決條件

安裝 [JBang](https://www.jbang.dev/) 並確保 `npx` 可用於 Playwright MCP server (已安裝 Node.js)：

```bash
# macOS (使用 Homebrew)
brew install jbangdev/tap/jbang

# 驗證 npx 是否可用 (Playwright MCP 所需)
npx --version
```

## 用法

```bash
jbang recipe/AccessibilityReport.java
# 提示時輸入 URL
```

## 完整範例：AccessibilityReport.java

```java
///usr/bin/env jbang "$0" "$@" ; exit $?
//DEPS com.github:copilot-sdk-java:0.2.1-java.1

import com.github.copilot.sdk.*;
import com.github.copilot.sdk.events.*;
import com.github.copilot.sdk.json.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class AccessibilityReport {
    public static void main(String[] args) throws Exception {
        System.out.println("=== 協助工具報告產生器 ===\n");

        var reader = new BufferedReader(new InputStreamReader(System.in));

        System.out.print("輸入要分析的 URL: ");
        String url = reader.readLine().trim();
        if (url.isEmpty()) {
            System.out.println("未提供 URL。正在退出。");
            return;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }

        System.out.printf("正在分析：", url);
        System.out.println("請稍候...\n");

        try (var client = new CopilotClient()) {
            client.start().get();

            // 設定 Playwright MCP server 以進行瀏覽器自動化
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

            // 逐個權杖 (token) 串流輸出
            var idleLatch = new CountDownLatch(1);

            session.on(AssistantMessageDeltaEvent.class,
                ev -> System.out.print(ev.getData().deltaContent()));

            session.on(SessionIdleEvent.class,
                ev -> idleLatch.countDown());

            session.on(SessionErrorEvent.class, ev -> {
                System.err.printf("錯誤：%s%n", ev.getData().message());
                idleLatch.countDown();
            });

            String prompt = """
                使用 Playwright MCP server 分析此網頁的協助工具：

                請：
                1. 使用 playwright-browser_navigate 導覽至該 URL
                2. 使用 playwright-browser_snapshot 擷取協助工具快照
                3. 分析快照並提供詳細的協助工具報告

                使用表情符號指示器格式化報告：
                - 📊 協助工具報告標題
                - ✅ 運作良好的部分 (包含類別、狀態、詳細資訊的表格)
                - ⚠️ 發現的問題 (包含嚴重性、問題、WCAG 標準、建議的表格)
                - 📋 統計摘要 (連結、標題、可聚焦元素、地標)
                - ⚙️ 優先建議

                使用 ✅ 表示通過，🔴 表示高嚴重性問題，🟡 表示中嚴重性問題，❌ 表示缺失項目。
                包含來自頁面分析的實際發現。
                """.formatted(url);

            session.send(new MessageOptions().setPrompt(prompt));
            idleLatch.await();

            System.out.println("\n\n=== 報告完成 ===\n");

            // 提示使用者產生測試
            System.out.print("您是否要產生 Playwright 協助工具測試？(y/n): ");
            String generateTests = reader.readLine().trim();

            if (generateTests.equalsIgnoreCase("y") || generateTests.equalsIgnoreCase("yes")) {
                var testLatch = new CountDownLatch(1);

                session.on(SessionIdleEvent.class,
                    ev -> testLatch.countDown());

                String testPrompt = """
                    根據您剛才為  產生的協助工具報告，
                    在 Java 中建立 Playwright 協助工具測試。

                    包含以下測試：lang 屬性、標題、標題階層、替代文字、
                    地標 (landmarks)、略過導覽、焦點指示器和觸控目標。
                    使用 Playwright 的協助工具測試功能並加上實用的註解。
                    輸出完整的測試檔案。
                    """.formatted(url);

                System.out.println("\n正在產生協助工具測試...\n");
                session.send(new MessageOptions().setPrompt(testPrompt));
                testLatch.await();

                System.out.println("\n\n=== 測試已產生 ===");
            }

            session.close();
        }
    }
}
```

## 運作方式

1. **Playwright MCP server**：設定執行 `@playwright/mcp` 的本地 MCP server，以提供瀏覽器自動化工具
2. **串流輸出**：使用 `streaming: true` 和 `AssistantMessageDeltaEvent` 進行即時逐個權杖輸出
3. **協助工具快照**：Playwright 的 `browser_snapshot` 工具可擷取頁面的完整協助工具樹
4. **結構化報告**：提示詞設計了一致的符合 WCAG 的報告格式，並帶有表情符號嚴重性指示器
5. **測試產生**：可選擇根據分析結果產生 Playwright 協助工具測試

## 核心概念

### MCP server 設定

此食譜設定了一個與工作階段並行執行的本地 MCP server：

```java
Map<String, Object> mcpConfig = Map.of(
    "type", "local",
    "command", "npx",
    "args", List.of("@playwright/mcp@latest"),
    "tools", List.of("*")
);

var session = client.createSession(
    new SessionConfig()
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
        .setMcpServers(Map.of("playwright", mcpConfig))
).get();
```

這讓模型可以存取 Playwright 瀏覽器工具，例如 `browser_navigate`、`browser_snapshot` 和 `browser_click`。

### 搭配事件進行串流

與 `sendAndWait` 不同，此食譜使用串流來取得即時輸出：

```java
session.on(AssistantMessageDeltaEvent.class,
    ev -> System.out.print(ev.getData().deltaContent()));

session.on(SessionIdleEvent.class,
    ev -> idleLatch.countDown());
```

`CountDownLatch` 會將主執行緒與非同步事件串流同步 — 當工作階段進入閒置狀態時，閂鎖會釋放，程式繼續執行。

## 範例互動

```
=== 協助工具報告產生器 ===

輸入要分析的 URL: github.com

正在分析：https://github.com
請稍候...

📊 協助工具報告：GitHub (github.com)

✅ 運作良好的部分
| 類別 | 狀態 | 詳細資訊 |
|----------|--------|---------|
| 語言 | ✅ 通過 | lang="en" 已正確設定 |
| 頁面標題 | ✅ 通過 | "GitHub" 可被辨識 |
| 標題階層 | ✅ 通過 | 正確的 H1/H2 結構 |
| 影像 | ✅ 通過 | 所有影像皆有替代文字 |

⚠️ 發現的問題
| 嚴重性 | 問題 | WCAG 標準 | 建議 |
|----------|-------|----------------|----------------|
| 🟡 中 | 某些連結缺少描述性文字 | 2.4.4 | 為僅限圖示的連結新增 aria-label |

📋 統計摘要
- 總連結數：47
- 總標題數：8 (1× H1，正確階層)
- 可聚焦元素：52
- 發現的地標：橫幅 ✅、導覽 ✅、主內容 ✅、頁尾 ✅

=== 報告完成 ===

您是否要產生 Playwright 協助工具測試？(y/n): y

正在產生協助工具測試...
[產生的測試檔案輸出...]

=== 測試已產生 ===
```
