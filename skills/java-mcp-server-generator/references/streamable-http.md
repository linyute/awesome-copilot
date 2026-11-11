# 可串流 HTTP 伺服器

僅在遠端伺服器時使用此傳輸方式。本機伺服器請使用 stdio。

## Servlet 伺服器

`HttpServletStreamableServerTransportProvider` 是 Jakarta Servlet。它位於 `mcp` artifact 中。在 `pom.xml` 中新增 servlet 容器，例如嵌入式 Tomcat：

```xml
<dependency>
  <groupId>org.apache.tomcat.embed</groupId>
  <artifactId>tomcat-embed-core</artifactId>
  <version>11.0.26</version>
</dependency>
```

在 Gradle 中，新增 `implementation("org.apache.tomcat.embed:tomcat-embed-core:11.0.26")`。

替換 `McpServerApp.java` 中的 `main` 方法：

```java
public static void main(String[] args) throws Exception {
    int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

    HttpServletStreamableServerTransportProvider transport = HttpServletStreamableServerTransportProvider.builder()
            .jsonMapper(McpJsonDefaults.getMapper())
            .mcpEndpoint("/mcp")
            .securityValidator(DefaultServerTransportSecurityValidator.builder()
                    .allowedHost("localhost:" + port)
                    .allowedHost("127.0.0.1:" + port)
                    .allowedOrigin("http://localhost:*")
                    .build())
            .build();

    McpServer.sync(transport)
            .serverInfo("demo", "0.1.0")
            .capabilities(ServerCapabilities.builder().tools(false).build())
            .tools(divideTool())
            .build();

    Tomcat tomcat = new Tomcat();
    tomcat.setPort(port);
    tomcat.getConnector();
    Context context = tomcat.addContext("", null);
    Tomcat.addServlet(context, "mcp", transport).setAsyncSupported(true);
    context.addServletMappingDecoded("/mcp", "mcp");
    tomcat.start();
    tomcat.getServer().await();
}
```

新增這些匯入：`org.apache.catalina.Context`、`org.apache.catalina.startup.Tomcat`、`io.modelcontextprotocol.server.transport.DefaultServerTransportSecurityValidator` 與 `io.modelcontextprotocol.server.transport.HttpServletStreamableServerTransportProvider`。移除 `StdioServerTransportProvider` 的匯入。

用戶端連線至 `http://HOST:PORT/mcp`。針對 VS Code，撰寫 `.vscode/mcp.json`：

```json
{
  "servers": {
    "demo": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

## Spring Boot 伺服器

使用 [Spring AI](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html) 2.0 或更新版本的 MCP starter。Spring AI 2.0 使用 Spring Boot 4。請使用 `spring-boot-starter-parent` 4.0.x。匯入 `org.springframework.ai:spring-ai-bom` 版本 2.0.1 並新增 `spring-ai-starter-mcp-server-webmvc`。針對 WebFlux，請新增 `spring-ai-starter-mcp-server-webflux`。

將工具撰寫為 Spring bean 上的標註方法：

```java
@Component
class CalculatorTools {

    @McpTool(name = "add", description = "Add two integers")
    public int add(@McpToolParam(description = "First number") int a,
            @McpToolParam(description = "Second number") int b) {
        return a + b;
    }
}
```

這些標註位於 `org.springframework.ai.mcp.annotation` 中。在 `application.properties` 中設定伺服器識別資訊與傳輸方式：

```properties
spring.ai.mcp.server.name=demo
spring.ai.mcp.server.version=0.1.0
spring.ai.mcp.server.protocol=STREAMABLE
```

此 starter 會在 `/mcp` 提供端點服務。

## 注意事項

- HTTP 傳輸預設不會檢查 `Host` 與 `Origin` 標頭。這也適用於 Spring AI starter。若不進行檢查，惡意網頁可利用 DNS rebinding 呼叫本機伺服器。務必設定 `securityValidator(DefaultServerTransportSecurityValidator.builder()...build())`。驗證器會以 HTTP 403 拒絕未知的 `Origin`，並以 HTTP 421 拒絕未知的 `Host`。
- 在 Spring AI 中，宣告您自己的 `WebMvcStreamableServerTransportProvider` bean 來設定驗證器。如此一來，starter 便不會建立其自身的 bean：

  ```java
  @Bean
  WebMvcStreamableServerTransportProvider webMvcStreamableServerTransportProvider() {
      return WebMvcStreamableServerTransportProvider.builder()
              .jsonMapper(McpJsonDefaults.getMapper())
              .mcpEndpoint("/mcp")
              .securityValidator(DefaultServerTransportSecurityValidator.builder()
                      .allowedHost("localhost:8080")
                      .allowedOrigin("http://localhost:*")
                      .build())
              .build();
  }
  ```

- 針對 WebFlux，以相同方式宣告 `WebFluxStreamableServerTransportProvider` bean。其 builder 使用 `messageEndpoint("/mcp")`，而非 `mcpEndpoint`。
- 嵌入式 Tomcat 會監聽所有網路介面。對於公開主機，請將其名稱新增至 `allowedHost`。在伺服器前端加入身分驗證。
- SDK 不具備授權機制。對於遠端伺服器，請在 servlet filter 中或使用 Spring Security 新增授權。
- `HttpServletStatelessServerTransport` 會建立無工作階段（session）的伺服器。當必須有多個複本回應請求時，請將其與 `McpServer.sync(transport)` 搭配使用。無狀態伺服器無法向用戶端傳送請求。也請在其 builder 上設定 `securityValidator`。
- 針對瀏覽器用戶端，請在 servlet 容器中新增 CORS。允許 `Mcp-*` 請求標頭。公開 `Mcp-Session-Id` 回應標頭。
