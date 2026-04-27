# 依據 Metadata 進行檔案分組

使用 Copilot 根據檔案的 Metadata，智慧地組織資料夾中的檔案。

> **可執行的範例：** [recipe/ManagingLocalFiles.java](recipe/ManagingLocalFiles.java)
>
> ```bash
> jbang recipe/ManagingLocalFiles.java
> ```

## 範例情境

您有一個包含許多檔案的資料夾，並希望根據檔案類型、建立日期、大小或其他屬性等 Metadata 將它們組織到子資料夾中。Copilot 可以分析這些檔案並建議或執行分組策略。

## 範例程式碼

**用法：**
```bash
# 用於特定資料夾 (建議)
jbang recipe/ManagingLocalFiles.java /path/to/your/folder

# 或在不帶參數的情況下執行，以使用安全的預設值 (暫存目錄)
jbang recipe/ManagingLocalFiles.java
```

**程式碼：**
```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.events.SessionIdleEvent;
import com.github.copilot.sdk.events.ToolExecutionCompleteEvent;
import com.github.copilot.sdk.events.ToolExecutionStartEvent;
import com.github.copilot.sdk.json.MessageOptions;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.SessionConfig;
import java.nio.file.Paths;
import java.util.concurrent.CountDownLatch;

public class ManagingLocalFiles {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();

            // 建立工作階段
            var session = client.createSession(
                new SessionConfig().setOnPermissionRequest(PermissionHandler.APPROVE_ALL).setModel("gpt-5")).get();

            // 設定事件處理常式
            var done = new CountDownLatch(1);

            session.on(AssistantMessageEvent.class, msg -> 
                System.out.println("\nCopilot: " + msg.getData().content())
            );

            session.on(ToolExecutionStartEvent.class, evt -> 
                System.out.println("  → 執行中: " + evt.getData().toolName())
            );

            session.on(ToolExecutionCompleteEvent.class, evt -> 
                System.out.println("  ✓ 已完成: " + evt.getData().toolCallId())
            );

            session.on(SessionIdleEvent.class, evt -> done.countDown());

            // 要求 Copilot 組織檔案 - 使用安全範例資料夾
            // 實際使用時，請替換為您的目標資料夾
            String targetFolder = args.length > 0 ? args[0] : 
                System.getProperty("java.io.tmpdir") + "/example-files";

            String prompt = String.format("""
                分析 "%s" 中的檔案，並展示您將如何將它們組織到子資料夾中。

                1. 首先，列出所有檔案及其 Metadata
                2. 預覽依檔案副檔名進行分組
                3. 建議適當的子資料夾 (例如 "images", "documents", "videos")
                
                重要提示：請勿移動任何檔案。僅顯示計劃。
                """, targetFolder);

            session.send(new MessageOptions().setPrompt(prompt));

            // 等待完成
            done.await();

            session.close();
        }
    }
}
```

## 分組策略

### 依檔案副檔名

```java
// 分組檔案如下：
// images/   -> .jpg, .png, .gif
// documents/ -> .pdf, .docx, .txt
// videos/   -> .mp4, .avi, .mov
```

### 依建立日期

```java
// 分組檔案如下：
// 2024-01/ -> 建立於 2024 年 1 月的檔案
// 2024-02/ -> 建立於 2024 年 2 月的檔案
```

### 依檔案大小

```java
// 分組檔案如下：
// tiny-under-1kb/
// small-under-1mb/
// medium-under-100mb/
// large-over-100mb/
```

## 測試執行模式

為了安全起見，您可以要求 Copilot 僅預覽更改：

```java
String prompt = String.format("""
    分析 "%s" 中的檔案，並向我展示您將如何
    依檔案類型組織它們。請勿移動任何檔案 — 僅向我展示計劃。
    """, targetFolder);

session.send(new MessageOptions().setPrompt(prompt));
```

## 使用 AI 分析進行自訂分組

讓 Copilot 根據檔案內容決定最佳分組：

```java
String prompt = String.format("""
    檢視 "%s" 中的檔案並建議一個邏輯組織方式。
    考慮：
    - 檔案名稱及其可能包含的內容
    - 檔案類型及其典型用途
    - 可能指示專案或事件的日期模式

    提出具有描述性且實用的資料夾名稱。
    """, targetFolder);

session.send(new MessageOptions().setPrompt(prompt));
```

## 互動式檔案組織

```java
//DEPS com.github:copilot-sdk-java:0.2.1-java.1
import com.github.copilot.sdk.CopilotClient;
import com.github.copilot.sdk.events.AssistantMessageEvent;
import com.github.copilot.sdk.json.MessageOptions;
import com.github.copilot.sdk.json.PermissionHandler;
import com.github.copilot.sdk.json.SessionConfig;
import java.io.BufferedReader;
import java.io.InputStreamReader;

public class InteractiveFileOrganizer {
    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient();
             var reader = new BufferedReader(new InputStreamReader(System.in))) {
            
            client.start().get();

            var session = client.createSession(
                new SessionConfig().setOnPermissionRequest(PermissionHandler.APPROVE_ALL).setModel("gpt-5")).get();

            session.on(AssistantMessageEvent.class, msg -> 
                System.out.println("\nCopilot: " + msg.getData().content())
            );

            System.out.print("輸入要組織的資料夾路徑: ");
            String folderPath = reader.readLine();

            String initialPrompt = String.format("""
                分析 "%s" 中的檔案並建議一個組織策略。
                在進行任何更改之前等待我的確認。
                """, folderPath);

            session.send(new MessageOptions().setPrompt(initialPrompt));

            // 互動式迴圈
            System.out.println("\n輸入命令 (或輸入 'exit' 結束)：");
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.equalsIgnoreCase("exit")) {
                    break;
                }
                session.send(new MessageOptions().setPrompt(line));
            }

            session.close();
        }
    }
}
```

## 安全考量

1. **移動前確認**：要求 Copilot 在執行移動前進行確認
2. **處理重複檔案**：考慮如果存在同名檔案會發生什麼情況
3. **保留原始檔案**：對於重要檔案，考慮使用複製而非移動
4. **使用測試執行進行測試**：務必先進行測試執行以預覽更改
