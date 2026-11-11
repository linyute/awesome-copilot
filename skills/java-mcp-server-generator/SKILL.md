---
name: java-mcp-server-generator
description: '當使用者想要在 Java 或 Spring Boot 應用程式中建立模型上下文協定（Model Context Protocol, MCP）伺服器時，請使用此技能。當使用者想要 AI agent（例如 GitHub Copilot 或 Claude）使用 Java 程式碼、API 或資料庫時，也可以使用。即使使用者未提及「MCP」，也可以使用。此技能會使用 MCP Java SDK 2.x 建立 Maven 或 Gradle 專案，包含工具、JUnit 測試與用戶端設定。請勿用於 Quarkus/Quarkiverse MCP 伺服器（請使用 `quarkus-mcp-server-sse` 指引）、MCP 用戶端或以其他語言撰寫的伺服器。'
compatibility: 'JDK 17 或更新版本、Maven 3.9 或更新版本或 Gradle 9 或更新版本，以及下載依賴項所需的網路連線。MCP Inspector 也需要使用 Node.js。'
---

# Java MCP 伺服器產生器

使用官方 [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) 2.x 在 Java 中建立模型上下文協定（MCP）伺服器。SDK 2.0.x 支援 MCP 規格修訂版 [2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) 及較早的修訂版。SDK 3.x 將新增修訂版 [2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)。

## 工作流程

複製此核取清單並追蹤您的進度：

- [ ] 步驟 1：建立專案。
- [ ] 步驟 2：撰寫伺服器。
- [ ] 步驟 3：撰寫測試。
- [ ] 步驟 4：建構直到測試通過。
- [ ] 步驟 5：設定用戶端。

### 步驟 1：建立專案

預設使用 Maven。若專案使用 Gradle 或使用者要求使用 Gradle，請參閱 [references/gradle.md](references/gradle.md)。將其用於步驟 1、步驟 4 與步驟 5。

建立以下配置：

```text
project-name/
├── pom.xml
└── src/
    ├── main/java/com/example/McpServerApp.java
    └── test/java/com/example/McpServerAppTest.java
```

撰寫 `pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>mcp-server-demo</artifactId>
  <version>0.1.0</version>

  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.modelcontextprotocol.sdk</groupId>
        <artifactId>mcp-bom</artifactId>
        <version>2.0.1</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
      <dependency>
        <groupId>org.junit</groupId>
        <artifactId>junit-bom</artifactId>
        <version>6.1.3</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <dependency>
      <groupId>io.modelcontextprotocol.sdk</groupId>
      <artifactId>mcp</artifactId>
    </dependency>
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-simple</artifactId>
      <version>2.0.17</version>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-shade-plugin</artifactId>
        <version>3.6.2</version>
        <executions>
          <execution>
            <phase>package</phase>
            <goals>
              <goal>shade</goal>
            </goals>
            <configuration>
              <createDependencyReducedPom>false</createDependencyReducedPom>
              <transformers>
                <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                  <mainClass>com.example.McpServerApp</mainClass>
                </transformer>
              </transformers>
            </configuration>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
</project>
```

- `mcp` artifact 包含 `mcp-core` 與 Jackson 3 JSON 映射器 `mcp-json-jackson3`。
- `slf4j-simple` 會將 SDK 記錄寫入 stderr。
- shade 外掛程式會建立包含所有依賴項的單一可執行 JAR。

### 步驟 2：撰寫伺服器

從此範本開始：

```java
package com.example;

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

    static SyncToolSpecification divideTool() {
        Tool tool = Tool.builder("divide", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "a", Map.of("type", "number", "description", "Dividend"),
                                "b", Map.of("type", "number", "description", "Divisor")),
                        "required", List.of("a", "b")))
                .description("Divide a by b.")
                .build();

        return SyncToolSpecification.builder()
                .tool(tool)
                .callHandler((exchange, request) -> {
                    double a = ((Number) request.arguments().get("a")).doubleValue();
                    double b = ((Number) request.arguments().get("b")).doubleValue();
                    if (b == 0) {
                        return CallToolResult.builder().addTextContent("b must not be zero.").isError(true).build();
                    }
                    return CallToolResult.builder().addTextContent(String.valueOf(a / b)).build();
                })
                .build();
    }

    public static void main(String[] args) {
        McpServer.sync(new StdioServerTransportProvider(McpJsonDefaults.getMapper()))
                .serverInfo("demo", "0.1.0")
                .capabilities(ServerCapabilities.builder().tools(false).build())
                .tools(divideTool())
                .build();
    }
}
```

接著修改範本以符合使用者的要求：

1. 將 `divideTool()` 替換為使用者要求的工具。為每個工具建立一個方法。
2. 為每個工具提供 JSON Schema `inputSchema` 與 `description`。說明會告知模型何時使用該工具。
3. 當用戶端必須取得機器可讀資料時，為工具新增 `.outputSchema(Map)`。使用 `CallToolResult.builder().structuredContent(map)` 回傳資料。亦可為舊版用戶端新增相同的文字內容資料。
4. 使用 `.annotations(ToolAnnotations.builder().readOnlyHint(true).build())` 標註唯讀工具。對具破壞性的工具使用 `destructiveHint(true)`。
5. 僅在使用者要求時新增資源（resource）、資源範本（resource template）與提示（prompt）。並在 `ServerCapabilities` 中啟用它們。

預設使用 stdio。僅在使用者要求遠端伺服器、HTTP 伺服器或 Spring Boot 時參閱 [references/streamable-http.md](references/streamable-http.md)。

### 步驟 3：撰寫測試

測試會將伺服器作為子行程啟動，並使用 SDK 用戶端連線至該伺服器。為每個工具與每個錯誤結果撰寫測試：

```java
package com.example;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.ServerParameters;
import io.modelcontextprotocol.client.transport.StdioClientTransport;
import io.modelcontextprotocol.json.McpJsonDefaults;
import io.modelcontextprotocol.spec.McpSchema.CallToolRequest;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import io.modelcontextprotocol.spec.McpSchema.TextContent;

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
    void divide() {
        CallToolResult result = client.callTool(
                CallToolRequest.builder("divide").arguments(Map.of("a", 6, "b", 3)).build());
        assertEquals("2.0", ((TextContent) result.content().get(0)).text());
    }

    @Test
    void divideByZero() {
        CallToolResult result = client.callTool(
                CallToolRequest.builder("divide").arguments(Map.of("a", 1, "b", 0)).build());
        assertTrue(result.isError());
        assertTrue(((TextContent) result.content().get(0)).text().contains("must not be zero"));
    }
}
```

- 測試使用執行 Maven 的 JDK 之 `java` 指令。請勿使用來自 `PATH` 的 `java` 指令。
- 測試使用真實的 stdio 傳輸與真實的 JSON-RPC 訊息。

### 步驟 4：建構直到測試通過

1. 執行 `mvn verify`。此指令會編譯程式碼、執行測試，並產生 `target/mcp-server-demo-0.1.0.jar`。
2. 若測試失敗，請閱讀錯誤訊息。修正伺服器或測試。
3. 再次執行 `mvn verify`。
4. 僅在建構成功時繼續進行。

### 步驟 5：設定用戶端

針對 VS Code，撰寫 `.vscode/mcp.json`：

```json
{
  "servers": {
    "demo": {
      "type": "stdio",
      "command": "java",
      "args": ["-jar", "/absolute/path/to/project/target/mcp-server-demo-0.1.0.jar"]
    }
  }
}
```

針對 Claude Desktop，將相同的 `command` 與 `args` 放入 `claude_desktop_config.json` 的 `mcpServers` 鍵下方。

針對 HTTP 伺服器，使用 [references/streamable-http.md](references/streamable-http.md) 中的用戶端設定。

告知使用者以下事項：

- `java -jar target/mcp-server-demo-0.1.0.jar` 會啟動 stdio 伺服器。伺服器會在 stdin 上等待主機連線。SDK 記錄會輸出至 stderr。
- 若要手動測試伺服器，請使用相同指令啟動 MCP Inspector。Inspector 需要使用 Node.js。

## 注意事項

SDK 2.x 變更了 SDK 0.x 與 1.x 的許多模式。請勿複製舊版本的範例。請閱讀[遷移指南](https://github.com/modelcontextprotocol/java-sdk/blob/main/MIGRATION-2.0.md)以取得完整清單。

- 使用優先接收必要欄位的 builder：`Tool.builder(name, inputSchema)`、`Resource.builder(uri, name)`、`Prompt.builder(name)`、`TextContent.builder(text)` 與 `ReadResourceResult.builder(contents)`。不帶引數的 builder 已被廢棄。
- 必要欄位不可為 `null`。`null` 值會導致 `IllegalArgumentException`。
- 工具名稱必須包含 1 到 128 個字元：英文字母、數字、`_`、`-` 與 `.`。伺服器 builder 會以 `IllegalArgumentException` 拒絕不合法的名稱。執行時期的 `addTool()` 則不會檢查名稱。
- `inputSchema` 與 `outputSchema` 為 `Map<String, Object>` 值。`JsonSchema` record 已被廢棄。
- 當您呼叫 `build()` 或 `addTool()` 時，伺服器會依據 JSON Schema 2020-12 檢查每個 schema。不正確的 schema 會導致 `IllegalArgumentException`。
- SDK 會依據 `inputSchema` 驗證工具引數。它也會依據 `outputSchema` 驗證 `structuredContent`。若驗證失敗，用戶端會收到 `isError` 設為 `true` 的工具結果。因此，處理常式只會收到合法的引數。
- 若工具具有 `outputSchema`，請在每個成功的結果中回傳 `structuredContent`。若缺少它，SDK 會回傳 `isError` 設為 `true` 的工具結果。
- 對於模型必須讀取的錯誤，請回傳帶有 `isError(true)` 的 `CallToolResult`。
- 請勿因工具失敗而擲出例外狀況或 `McpError`。用戶端會收到 JSON-RPC 錯誤，而非工具結果。許多主機不會將此錯誤顯示給模型。
- 在 stdio 伺服器中，stdout 是協定通訊通道。請勿呼叫 `System.out.println()`。
- 使用 SLF4J 記錄至 stderr。Logback 的預設主控台 appender 會寫入 stdout。若使用 Logback，請將其目標設為 `System.err`。
- Spring 傳輸已移至 [Spring AI](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-overview.html) 2.0 及更新版本（群組 `org.springframework.ai`）。請勿使用 `io.modelcontextprotocol.sdk:mcp-spring-*` artifacts。
- 請勿使用已廢棄的 SSE 傳輸。遠端伺服器請使用 Streamable HTTP。
- 2026-07-28 修訂版廢棄了以下功能（[SEP-2577](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2577)）。請勿將它們新增至新伺服器：
  - **取樣（Sampling）**（`exchange.createMessage()`）：直接呼叫 LLM 提供者 API。
  - **協定記錄（Protocol logging）**（`exchange.loggingNotification()`）：使用 SLF4J。
  - **根目錄（Roots）**（`exchange.listRoots()`）：從工具引數、資源 URI 或伺服器設定中取得路徑。
