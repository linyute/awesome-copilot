---
description: '使用 MCP Java SDK 2.x 在 Java 中建構模型上下文協定 (Model Context Protocol, MCP) 伺服器的指示'
applyTo: '**/*.java, **/pom.xml, **/build.gradle, **/build.gradle.kts'
---

# Java MCP 伺服器開發

這些指示適用於 [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) 2.x。SDK 2.0.x 支援 MCP 規格修訂版 [2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) 以及較早的修訂版。SDK 3.x 將會加入修訂版 [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)。

> **範圍：** 僅將這些指示套用至直接使用 MCP Java SDK 的專案。請勿將其套用至 Quarkus 或 Quarkiverse MCP 伺服器；針對這些伺服器請使用 `quarkus-mcp-server-sse` 指示。

## 指示

- 匯入 BOM `io.modelcontextprotocol.sdk:mcp-bom:2.0.1` 並新增 `io.modelcontextprotocol.sdk:mcp` 成品（artifact）。
- 在 Gradle 中，使用 `implementation(platform("io.modelcontextprotocol.sdk:mcp-bom:2.0.1"))` 匯入 BOM。另外新增 `testRuntimeOnly("org.junit.platform:junit-platform-launcher")`。若沒有它，`test` 工作會失敗。
- `mcp` 成品包含 `mcp-core` 以及 Jackson 3 JSON 應對器（mapper）`mcp-json-jackson3`。
- 請勿使用來自 SDK 0.x 或 1.x 的程式碼。當您更新伺服器時，請閱讀[移轉指南](https://github.com/modelcontextprotocol/java-sdk/blob/main/MIGRATION-2.0.md)。
- 套件為 `io.modelcontextprotocol.server`、`io.modelcontextprotocol.spec` 與 `io.modelcontextprotocol.json`。協定型別巢狀定義在 `McpSchema` 中。
- 使用 `McpServer.sync(transport)` 或 `McpServer.async(transport)` 建立伺服器。設定 `serverInfo(name, version)` 和 `capabilities(...)`，然後呼叫 `build()`。
- 大多數伺服器請使用同步（sync）伺服器。僅在工具程式碼不會封鎖執行緒時，才將非同步（async）伺服器與 Project Reactor（`Mono`）搭配使用。
- 對於 stdio 傳輸，使用 `new StdioServerTransportProvider(McpJsonDefaults.getMapper())`。
- 僅啟用伺服器使用的功能（capabilities）：`ServerCapabilities.builder().tools(false).resources(false, true).prompts(true).completions().build()`。`tools(listChanged)` 和 `prompts(listChanged)` 會啟用清單變更通知。`resources(subscribe, listChanged)` 也會啟用資源訂閱。
- 使用 `SyncToolSpecification.builder().tool(tool).callHandler((exchange, request) -> ...)` 註冊工具。處理常式會從 `request.arguments()` 取得 `Map` 形式的引數。
- 使用優先接收必要欄位的建構器（builder）：`Tool.builder(name, inputSchema)`、`Resource.builder(uri, name)`、`ResourceTemplate.builder(uriTemplate, name)`、`Prompt.builder(name)`、`TextContent.builder(text)` 以及 `ReadResourceResult.builder(contents)`。不帶引數的建構器已被棄用。
- 必要欄位不可為 `null`。`null` 值會導致 `IllegalArgumentException`。
- 工具名稱必須具有 1 到 128 個字元：字母、數字、`_`、`-` 和 `.`。伺服器建構器會以 `IllegalArgumentException` 拒絕不正確的名稱。執行時期的 `addTool()` 則不檢查名稱。
- 將 `inputSchema` 和 `outputSchema` 作為 `Map<String, Object>` 值提供。`JsonSchema` record 已被棄用。
- 當您呼叫 `build()` 或 `addTool()` 時，伺服器會依據 JSON Schema 2020-12 檢查每個結構描述。不正確的結構描述會導致 `IllegalArgumentException`。
- SDK 會在呼叫處理常式之前依據 `inputSchema` 驗證引數。它也會依據 `outputSchema` 驗證 `structuredContent`。若驗證失敗，客戶端會收到 `isError` 設為 `true` 的工具結果。
- 若工具具有 `outputSchema`，請在每個成功的結果中傳回 `structuredContent`。如果沒有，SDK 會傳回 `isError` 設為 `true` 的工具結果。
- 對於機器可讀的輸出，請在工具上設定 `outputSchema` 並傳回 `CallToolResult.builder().structuredContent(map)`。同時為較舊的客戶端新增相同資料作為文字內容。
- 使用 `ToolAnnotations.builder().readOnlyHint(true).build()` 設定工具提示。對具破壞性的工具使用 `destructiveHint(true)`。
- 對於模型必須讀取的錯誤，傳回 `CallToolResult.builder().addTextContent(message).isError(true).build()`。
- 請勿為工具失敗擲出例外狀況或 `McpError`。客戶端會收到 JSON-RPC 錯誤，而非工具結果。許多主機不會向模型顯示此錯誤。
- 僅針對協定錯誤（例如未知的資源 URI）使用 `McpError.builder(McpSchema.ErrorCodes.INVALID_PARAMS).message(...).build()`。
- 使用 `SyncResourceSpecification` 註冊資源，使用 `SyncResourceTemplateSpecification` 註冊資源範本，使用 `SyncPromptSpecification` 註冊 prompt，使用 `SyncCompletionSpecification` 註冊自動補全。
- 使用 RFC 6570 URI 範本定義資源範本，例如 `users://{id}`。
- 僅在 `request.progressToken()` 不為 `null` 時，使用 `exchange.progressNotification(...)` 回報進度。
- 使用 `exchange.createElicitation(ElicitFormRequest.builder(message, requestedSchema).build())` 取得使用者輸入。首先，確保 `exchange.getClientCapabilities().elicitation()` 不為 `null`。
- 對於瀏覽器中的流程（例如 OAuth 或付款），請使用 `ElicitUrlRequest.builder(message, url, elicitationId)`。首先，確保 `exchange.getClientCapabilities().elicitation().url()` 不為 `null`。請勿在表單 elicitation 中傳送認證資訊。
- 請勿使用取樣（`exchange.createMessage()`）。修訂版 2026-07-28 已將其棄用。請直接呼叫 LLM 提供者 API。
- 請勿使用協定記錄（`exchange.loggingNotification()`）。修訂版 2026-07-28 已將其棄用。請使用 SLF4J 進行記錄。
- 請勿使用 roots（`exchange.listRoots()`）。修訂版 2026-07-28 已將其棄用。請從工具引數、資源 URI 或伺服器組態取得路徑。
- 在執行時期使用 `server.addTool(...)` 和 `server.removeTool(name)` 新增或移除工具。然後呼叫 `server.notifyToolsListChanged()`。
- 在 stdio 伺服器中，stdout 是協定通道。請勿呼叫 `System.out.println()`。請使用 `slf4j-simple`（它會寫入 stderr），或將 Logback 主控台 appender 的目標設定為 `System.err`。
- 對於遠端伺服器，請使用可串流 HTTP。SSE 傳輸已被棄用。
- 對於 Servlet 容器，請使用 `HttpServletStreamableServerTransportProvider`。對於無工作階段（sessionless）的伺服器，請使用 `HttpServletStatelessServerTransport`。
- 預設情況下，HTTP 傳輸不會檢查 `Host` 和 `Origin` 標頭。請務必設定 `securityValidator(DefaultServerTransportSecurityValidator.builder()...build())`。這也適用於 Spring AI starters。
- SDK 沒有授權機制。對於遠端伺服器，請在 Servlet 篩選器中或使用 Spring Security 新增授權。
- 對於 Spring Boot，請使用 [Spring AI](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html) 2.0 或更新版本的 MCP starters，例如 `spring-ai-starter-mcp-server-webmvc`。請勿使用 `io.modelcontextprotocol.sdk:mcp-spring-*` 成品。
- 在 Spring AI 中，將工具寫為帶有 `@McpTool` 與 `@McpToolParam`（來自 `org.springframework.ai.mcp.annotation`）的 bean 方法。
- 對於瀏覽器客戶端，請設定 CORS。允許 `Mcp-*` 請求標頭。公開 `Mcp-Session-Id` 回應標頭。
- 使用 `maven-shade-plugin` 將 stdio 伺服器封裝為單一可執行 JAR。在 Gradle 中，使用 `application` 外掛程式和來自 `installDist` 的啟動指令碼。請勿使用 `./gradlew run` 作為客戶端指令。
- 使用 `McpClient.sync(new StdioClientTransport(params, McpJsonDefaults.getMapper()))` 測試伺服器。SDK 沒有記憶體內傳輸。
- 使用 MCP Inspector 手動測試伺服器。

## 最佳實踐

- 賦予每個工具單一職責。
- 撰寫清楚的工具說明。該說明會告知模型何時使用該工具。
- 在 `inputSchema` 的每個屬性中新增 `description`。
- 將每個工具規格放在獨立的方法中。這使工具易於測試。
- 在非同步伺服器中，請勿封鎖事件迴圈。使用 `Mono.fromCallable(...).subscribeOn(Schedulers.boundedElastic())` 執行會封鎖的程式碼。
- 使用環境變數進行組態設定。
- 當工具提供對檔案系統或網路的存取權限時，請格外謹慎。

## 常見模式

程式碼片段並未顯示所有匯入項目。協定型別巢狀定義在 `io.modelcontextprotocol.spec.McpSchema` 中。`Mono` 位於 `reactor.core.publisher`，而 `Schedulers` 位於 `reactor.core.scheduler`。

### 基本伺服器設定 (stdio)

```java
import java.util.List;
import java.util.Map;

import io.modelcontextprotocol.json.McpJsonDefaults;
import io.modelcontextprotocol.server.McpServer;
import io.modelcontextprotocol.server.McpServerFeatures.SyncToolSpecification;
import io.modelcontextprotocol.server.transport.StdioServerTransportProvider;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import io.modelcontextprotocol.spec.McpSchema.ServerCapabilities;
import io.modelcontextprotocol.spec.McpSchema.Tool;

public final class McpServerApp {

    static SyncToolSpecification addTool() {
        Tool tool = Tool.builder("add", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "a", Map.of("type", "integer", "description", "第一個數字"),
                                "b", Map.of("type", "integer", "description", "第二個數字")),
                        "required", List.of("a", "b")))
                .description("將兩個整數相加。")
                .build();

        return SyncToolSpecification.builder()
                .tool(tool)
                .callHandler((exchange, request) -> {
                    long a = ((Number) request.arguments().get("a")).longValue();
                    long b = ((Number) request.arguments().get("b")).longValue();
                    return CallToolResult.builder().addTextContent(String.valueOf(a + b)).build();
                })
                .build();
    }

    public static void main(String[] args) {
        McpServer.sync(new StdioServerTransportProvider(McpJsonDefaults.getMapper()))
                .serverInfo("my-server", "0.1.0")
                .capabilities(ServerCapabilities.builder().tools(false).build())
                .tools(addTool())
                .build();
    }
}
```

### 具結構化輸出的工具

```java
static SyncToolSpecification wordCountTool() {
    Tool tool = Tool.builder("word_count", Map.of(
                    "type", "object",
                    "properties", Map.of("text", Map.of("type", "string")),
                    "required", List.of("text")))
            .description("計算文字中的字數。")
            .outputSchema(Map.of(
                    "type", "object",
                    "properties", Map.of("words", Map.of("type", "integer")),
                    "required", List.of("words")))
            .annotations(ToolAnnotations.builder().readOnlyHint(true).build())
            .build();

    return SyncToolSpecification.builder()
                .tool(tool)
                .callHandler((exchange, request) -> {
                String text = (String) request.arguments().get("text");
                int words = text.isBlank() ? 0 : text.trim().split("\\s+").length;
                return CallToolResult.builder()
                        .addTextContent("{\"words\":" + words + "}")
                        .structuredContent(Map.of("words", words))
                        .build();
            })
            .build();
}
```

### 錯誤處理

```java
static SyncToolSpecification divideTool() {
    Tool tool = Tool.builder("divide", Map.of(
                    "type", "object",
                    "properties", Map.of("a", Map.of("type", "number"), "b", Map.of("type", "number")),
                    "required", List.of("a", "b")))
            .description("將 a 除以 b。")
            .build();

    return SyncToolSpecification.builder()
            .tool(tool)
            .callHandler((exchange, request) -> {
                double a = ((Number) request.arguments().get("a")).doubleValue();
                double b = ((Number) request.arguments().get("b")).doubleValue();
                if (b == 0) {
                    return CallToolResult.builder().addTextContent("b 絕不能為零。").isError(true).build();
                }
                return CallToolResult.builder().addTextContent(String.valueOf(a / b)).build();
            })
            .build();
}
```

### 資源與資源範本

```java
static SyncResourceSpecification configResource() {
    return new SyncResourceSpecification(
            Resource.builder("config://app", "app-config").mimeType("application/json").build(),
            (exchange, request) -> ReadResourceResult.builder(List.of(
                    TextResourceContents.builder(request.uri(), "{\"debug\":false}")
                            .mimeType("application/json")
                            .build()))
                    .build());
}

static SyncResourceTemplateSpecification userResource() {
    return new SyncResourceTemplateSpecification(
            ResourceTemplate.builder("users://{id}", "user").build(),
            (exchange, request) -> {
                String id = request.uri().substring("users://".length());
                return ReadResourceResult.builder(List.of(
                        TextResourceContents.builder(request.uri(), "User " + id).build()))
                        .build();
            });
}
```

使用 `.resources(configResource())` 和 `.resourceTemplates(userResource())` 註冊它們。

### 包含自動補全的 Prompt

```java
static SyncPromptSpecification reviewPrompt() {
    Prompt prompt = Prompt.builder("code-review")
            .description("以特定語言審查程式碼。")
            .arguments(List.of(PromptArgument.builder("language").required(true).build()))
            .build();

    return new SyncPromptSpecification(prompt, (exchange, request) -> GetPromptResult.builder(List.of(
                    PromptMessage.builder(Role.USER,
                            TextContent.builder("Review this " + request.arguments().get("language") + " code.").build())
                            .build()))
            .build());
}

static SyncCompletionSpecification languageCompletion() {
    List<String> languages = List.of("java", "kotlin", "scala");
    return new SyncCompletionSpecification(new PromptReference("code-review"),
            (exchange, request) -> new CompleteResult(new CompleteResult.CompleteCompletion(
                    languages.stream().filter(l -> l.startsWith(request.argument().value())).toList(), null, false)));
}
```

使用 `.prompts(reviewPrompt())` 和 `.completions(languageCompletion())` 註冊它們。

### 具進度回報的非同步工具

```java
static AsyncToolSpecification lookupTool() {
    Tool tool = Tool.builder("lookup", Map.of(
                    "type", "object",
                    "properties", Map.of("query", Map.of("type", "string")),
                    "required", List.of("query")))
            .description("在緩慢的後端中查詢 query。")
            .build();

    return AsyncToolSpecification.builder()
            .tool(tool)
            .callHandler((exchange, request) -> {
                Object token = request.progressToken();
                Mono<Void> progress = token == null ? Mono.empty()
                        : exchange.progressNotification(
                                ProgressNotification.builder(token, 0.5).total(1.0).message("Halfway").build());
                return progress.then(Mono.fromCallable(() -> slowLookup((String) request.arguments().get("query")))
                        .subscribeOn(Schedulers.boundedElastic())
                        .map(text -> CallToolResult.builder().addTextContent(text).build()));
            })
            .build();
}
```

在 `McpServer.async(transport)` 上註冊它。

### 可串流 HTTP 伺服器 (Servlet)

```java
HttpServletStreamableServerTransportProvider transport = HttpServletStreamableServerTransportProvider.builder()
        .jsonMapper(McpJsonDefaults.getMapper())
        .mcpEndpoint("/mcp")
        .securityValidator(DefaultServerTransportSecurityValidator.builder()
                .allowedHost("localhost:8080")
                .allowedOrigin("http://localhost:*")
                .build())
        .build();

McpServer.sync(transport)
        .serverInfo("my-server", "0.1.0")
        .capabilities(ServerCapabilities.builder().tools(false).build())
        .tools(addTool())
        .build();
```

該傳輸為 Jakarta Servlet。在 Servlet 容器中將其註冊於 `/mcp` 並啟用非同步支援。

### Spring AI 工具

```java
@Component
class CalculatorTools {

    @McpTool(name = "add", description = "將兩個整數相加")
    public int add(@McpToolParam(description = "第一個數字") int a,
            @McpToolParam(description = "第二個數字") int b) {
        return a + b;
    }
}
```

### 整合測試

```java
class McpServerAppTest {

    private static McpSyncClient client;

    @BeforeAll
    static void startServer() {
        String java = Path.of(System.getProperty("java.home"), "bin", "java").toString();
        ServerParameters server = ServerParameters.builder(java)
                .args("-cp", System.getProperty("java.class.path"), McpServerApp.class.getName())
                .build();
        client = McpClient.sync(new StdioClientTransport(server, McpJsonDefaults.getMapper())).build();
        client.initialize();
    }

    @AfterAll
    static void stopServer() {
        client.close();
    }

    @Test
    void add() {
        CallToolResult result = client.callTool(
                CallToolRequest.builder("add").arguments(Map.of("a", 2, "b", 3)).build());
        assertEquals("5", ((TextContent) result.content().get(0)).text());
    }
}
```