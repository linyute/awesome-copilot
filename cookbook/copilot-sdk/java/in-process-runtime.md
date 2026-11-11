# 行程內執行階段 (In-Process Runtime)

將原生 Copilot 執行階段函式庫載入至 JVM 行程中，而不是繁衍
獨立的執行階段行程。

> **可執行的範例：** [recipe/InProcessRuntime.java](recipe/InProcessRuntime.java)
>
> ```bash
> # Linux x64 (glibc)；請在下方選擇適用於您平台的分類器。
> jbang --deps com.github:copilot-sdk-java-runtime:1.0.21:linux-x64 recipe/InProcessRuntime.java
> ```

## 範例情境

根據預設，`CopilotClient` 會繁衍子行程並透過 stdio 或 TCP 進行通訊。
需要避免獨立執行階段行程的宿主，可以將原生 Copilot
執行階段函式庫載入至 JVM 行程中。

行程內裝載僅移除了獨立的 Copilot 執行階段行程。已啟用的
內建工具（例如 Shell 執行、設定的本機 MCP 伺服器，以及
應用程式定義的工具處理常式）仍可能根據其實作、
設定、權限與沙箱原則啟動子行程。掛鉤與
擴充功能也可能啟動子行程。模型請求仍需要驗證
與網路存取；行程內傳輸並非沙箱。

> **示範權限：** 這些範例僅在隔離且受信任的示範中使用
> `PermissionHandler.APPROVE_ALL`。在處理不受信任的提示詞
> 或工作區之前，請將其替換為限制性權限處理常式。

## 先決條件

請使用 Java 17 或更新版本以及 SDK 1.0.21。建議使用 JDK 25 或更新版本，但這不是
行程內操作所必需的。除了 SDK 之外，請明確宣告 JNA 以及與
SDK 相同版本的平台專屬 runtime-classifier JAR。
此範例已使用 JNA 5.19.1 進行測試；JNA 與原生函式庫皆非
JDK 的一部分。

```xml
<dependencies>
    <dependency>
        <groupId>com.github</groupId>
        <artifactId>copilot-sdk-java</artifactId>
        <version>1.0.21</version>
    </dependency>
    <dependency>
        <groupId>com.github</groupId>
        <artifactId>copilot-sdk-java-runtime</artifactId>
        <version>1.0.21</version>
        <classifier>linux-x64</classifier>
    </dependency>
    <dependency>
        <groupId>net.java.dev.jna</groupId>
        <artifactId>jna</artifactId>
        <version>5.19.1</version>
    </dependency>
</dependencies>
```

針對 glibc Linux 請選擇 `linux-x64` 或 `linux-arm64`，針對 musl Linux 請選擇
`linuxmusl-x64` 或 `linuxmusl-arm64`，針對 Windows 請選擇 `win32-x64` 或 `win32-arm64`，
針對 macOS 請選擇 `darwin-x64` 或 `darwin-arm64`。glibc Linux 分類器需要
glibc 2.28 或更新版本。musl 分類器動態連結 musl，專為
相容的 musl 架構發行版本（例如 Alpine Linux）設計。僅支援
x64 與 ARM64。

JBang 會從食譜的 `//DEPS` 指示詞解析 SDK 與 JNA；請如上方所示
使用 `--deps` 傳入 runtime-classifier JAR。例如在 Apple Silicon 上：

```bash
jbang --deps com.github:copilot-sdk-java-runtime:1.0.21:darwin-arm64 recipe/InProcessRuntime.java
```

行程內 API 已於 Java SDK 1.0.21 中提供，並針對上方列出的平台發行了
執行階段分類器。成品可用性並不意味著
此食譜已在每個目標上經過測試。此食譜的原生冒煙測試已在
macOS arm64 上執行，未包含模型請求或 MCP/瀏覽器端對端執行。
請在每個部署平台上驗證啟動、模型請求與關閉。

## 使用行程內連線

```java
import com.github.copilot.AllowCopilotExperimental;
import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.*;
import java.util.concurrent.TimeUnit;

@AllowCopilotExperimental
public class InProcessExample {
    public static void main(String[] args) throws Exception {
        var options = new CopilotClientOptions()
            .setConnection(RuntimeConnection.forInProcess());

        try (var client = new CopilotClient(options)) {
            client.start().get(30, TimeUnit.SECONDS);

            try (var session = client.createSession(new SessionConfig()
                    .setModel("auto")
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL))
                    .get(30, TimeUnit.SECONDS)) {
                var response = session.sendAndWait(new MessageOptions()
                        .setPrompt("Hello from the in-process runtime!"))
                    .get(60, TimeUnit.SECONDS);
                System.out.println(response.getData().content());
            }

            client.stop().get(30, TimeUnit.SECONDS);
        }
    }
}
```

連線 API 屬於實驗性質。`@AllowCopilotExperimental` 讓該類別選擇加入
SDK 註釋處理器所執行的宣告層級檢查；
方法主體內部僅限運算式的使用方式不會被檢查。該處理器必須
由編譯器或建構工具啟用。專案也可以改為傳入
`-Acopilot.experimental.allowed=true`，以在該編譯器呼叫中處理的
每個原始碼中選擇加入。建構工具設定請參閱
[指定版本的實驗性 API 指引](https://github.com/github/copilot-sdk/blob/java/v1.0.21/java/README.md#using-experimental-apis)。

行程內模式並未為工作階段、事件、工具、權限或掛鉤引入獨立的
Java API。共享 API 與傳輸管線並未在此實驗性傳輸中建立
完整的端對端支援：請針對所選的 SDK 與原生函式庫版本，
驗證您依賴的功能。原生工作者執行緒、
回呼生命週期、失敗隔離與關閉與
子行程傳輸不同。擴充功能/外掛程式工具可能還需要擴充功能
啟動提供者與外部執行階段。

## 運作方式

SDK 使用 JNA 載入 `runtime.node` 原生函式庫，並透過其 C ABI
交換 JSON-RPC 框架與回呼，而非透過子行程傳輸。
runtime-classifier JAR 包含 `copilot-runtime`（在 Windows 上為
`copilot-runtime.exe`）子行程包裝函式與相鄰的 `runtime.node` 原生函式庫。
行程內傳輸會載入函式庫；子行程傳輸則會啟動包裝函式。
將分類器或 JNA 新增至類別路徑並不會改變傳輸的選擇。

從 runtime-classifier JAR 解壓縮的檔案會依 SDK 版本、原生
套件版本與平台分類器進行快取。明確設定或偵測到的
檔案系統函式庫可以改為直接載入。

食譜使用 `//JAVA_OPTIONS --enable-native-access=ALL-UNNAMED` 授予原生存取權，
因為 JBang 會將相依性放置在類別路徑上。由 JNA 執行受限制的
JNI/原生操作，而非由 SDK 直接執行。對於一般類別路徑應用程式，
請將 `--enable-native-access=ALL-UNNAMED` 傳遞給 `java`；對於模組路徑啟動，
請使用 `--enable-native-access=com.sun.jna`。JNA 建議在完全模組化的
設定中使用其 `jna-jpms` 成品。

在 JDK 17-23 上，JNA/JNI 載入不需要此旗標。在 JDK 24-25 上，
預設的 illegal-native-access 模式會發出警告，而 `--illegal-native-access=deny`
則需要授予權限。未來的 JDK 預計將拒絕設為預設值。
相較於 JDK 24，建議優先選擇 JDK 25，以取得較新的虛擬執行緒/原生呼叫釘選行為。

明確的 `RuntimeConnection.forInProcess()` 設定對此食譜而言已足夠。
行程全域傳輸覆寫及其優先順序請參閱
[SDK 參考資料](https://github.com/github/copilot-sdk/blob/java/v1.0.21/java/sdk/src/main/java/com/github/copilot/CopilotClient.java)。

若要檢查原生啟動以及透過 FFI 傳輸的行程內 Ping 來回行程，
而無需驗證或提出模型請求，請新增 `--ping`：

```bash
jbang --deps com.github:copilot-sdk-java-runtime:1.0.21:linux-x64 recipe/InProcessRuntime.java --ping
```

Ping 不會執行帳戶驗證、模型探索或網路請求。
食譜明確選擇了行程內連線，因此成功的啟動
與 Ping 展示了原生函式庫載入以及透過 FFI 的 JSON-RPC 請求/回應，
而非透過其他傳輸的連線。接著呼叫
`client.stop().get(30, TimeUnit.SECONDS)` 來練習正常關閉路徑。
`stop()` 的完成或 try-with-resources 均不能證明每個原生
拆除階段都已成功：某些 FFI 清理失敗會以非同步方式記錄或重試，
且 `close()` 會隱藏清理失敗。

## 限制

- **共享函式庫，獨立宿主**：用戶端共享一個已載入的原生函式庫與
  行程全域基礎結構，包括原生工作者。每個用戶端都會建立
  自己的執行階段宿主/伺服器引擎與 FFI 連線。環境與
  作業系統工作目錄會在每個宿主啟動時分別擷取；
  後續的行程變更不會更新現有的宿主或其預設值。
- **拒絕的行程選項**：`CopilotClientOptions` 上的 `setEnvironment`、`setTelemetry`、`setCwd` 與
  `setCliArgs` 在行程內模式下會由用戶端建構函式同步拒絕，
  而不是由 setter 拒絕或僅在啟動時拒絕。
  CLI 路徑、URL、TCP 與非 stdio 選項也與明確的
  行程內連線發生衝突。請透過宿主行程環境設定遙測；
  它無法依用戶端而異。
- **每個 JVM 一個原生函式庫路徑**：用戶端可以重複使用相同的函式庫，但
  載入防護會比較正規化的絕對路徑，而非建構中繼資料或
  內容。即使是不同路徑上的相同函式庫也會被拒絕。SDK
  特意在 JVM 的生命週期內保留該函式庫，因為原生工作者
  的存活時間可能比用戶端更長；未公開任何卸載操作。
- **平台相依性**：分類器必須符合作業系統與架構，
  且 JNA 必須可用。缺少或不相符的函式庫會導致啟動失敗。
- **工作階段與用戶端關閉**：工作階段關閉會淘汰 Java 端資源並
  分離該連線；最後一次分離會銷毀記憶體中的工作階段，但
  保留可繼續的資料。用戶端關閉會嘗試關閉其工作階段、關閉
  其本身的執行階段宿主，並關閉其 FFI 連線/宿主。它不會卸載
  函式庫或關閉其他用戶端的宿主。

## 最佳做法

1. **測試每個部署平台**：在您支援的每個作業系統與架構上驗證
   啟動、模型輪次與關閉。
2. **優先選擇預設傳輸**，除非有避免 SDK 子行程的需求。
3. **關閉資源**：針對工作階段與用戶端使用巢狀 try-with-resources。
   關閉連線並不會卸載原生函式庫。
4. **及早設定全行程值**：在啟動 JVM 之前設定環境與工作目錄，
   而非假設個別用戶端覆寫有效。
