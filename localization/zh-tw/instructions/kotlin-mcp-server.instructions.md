---
description: '使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫在 Kotlin 中建構模型上下文協定 (MCP) 伺服器的最佳實踐和模式。'
applyTo: "**/*.kt, **/*.kts, **/build.gradle.kts, **/settings.gradle.kts"
---

# Kotlin MCP 伺服器開發準則

在 Kotlin 中建構 MCP 伺服器時，請遵循使用官方 Kotlin SDK 的這些最佳實踐和模式。

## 伺服器設定

使用 `Server` 類別建立 MCP 伺服器：

```kotlin
import io.modelcontextprotocol.kotlin.sdk.server.Server
import io.modelcontextprotocol.kotlin.sdk.server.ServerOptions
import io.modelcontextprotocol.kotlin.sdk.Implementation
import io.modelcontextprotocol.kotlin.sdk.ServerCapabilities

val server = Server(
    serverInfo = Implementation(
        name = "my-server",
        version = "1.0.0"
    ),
    options = ServerOptions(
        capabilities = ServerCapabilities(
            tools = ServerCapabilities.Tools(),
            resources = ServerCapabilities.Resources(
                subscribe = true,
                listChanged = true
            ),
            prompts = ServerCapabilities.Prompts(listChanged = true)
        )
    )
) {
    "Server description goes here"
}
```

## 新增工具

使用 `server.addTool()` 註冊具有類型請求/回應處理的工具：

```kotlin
import io.modelcontextprotocol.kotlin.sdk.CallToolRequest
import io.modelcontextprotocol.kotlin.sdk.CallToolResult
import io.modelcontextprotocol.kotlin.sdk.TextContent

server.addTool(
    name = "search",
    description = "Search for information",
    inputSchema = buildJsonObject {
        put("type", "object")
        putJsonObject("properties") {
            putJsonObject("query") {
                put("type", "string")
                put("description", "The search query")
            }
            putJsonObject("limit") {
                put("type", "integer")
                put("description", "Maximum results to return")
            }
        }
        putJsonArray("required") {
            add("query")
        }
    }
) { request: CallToolRequest ->
    val query = request.params.arguments["query"] as? String
        ?: throw IllegalArgumentException("query is required")
    val limit = (request.params.arguments["limit"] as? Number)?.toInt() ?: 10
    
    // Perform search
    val results = performSearch(query, limit)
    
    CallToolResult(
        content = listOf(
            TextContent(
                text = results.joinToString("\n")
            )
        )
    )
}
```

## 新增資源

使用 `server.addResource()` 提供可存取的資料：

```kotlin
import io.modelcontextprotocol.kotlin.sdk.ReadResourceRequest
import io.modelcontextprotocol.kotlin.sdk.ReadResourceResult
import io.modelcontextprotocol.kotlin.sdk.TextResourceContents

server.addResource(
    uri = "file:///data/example.txt",
    name = "Example Data",
    description = "Example resource data",
    mimeType = "text/plain"
) { request: ReadResourceRequest ->
    val content = loadResourceContent(request.uri)
    
    ReadResourceResult(
        contents = listOf(
            TextResourceContents(
                text = content,
                uri = request.uri,
                mimeType = "text/plain"
            )
        )
    )
}
```

## 新增提示

使用 `server.addPrompt()` 建立可重複使用的提示範本：

```kotlin
import io.modelcontextprotocol.kotlin.sdk.GetPromptRequest
import io.modelcontextprotocol.kotlin.sdk.GetPromptResult
import io.modelcontextprotocol.kotlin.sdk.PromptMessage
import io.modelcontextprotocol.kotlin.sdk.Role

server.addPrompt(
    name = "analyze",
    description = "Analyze a topic",
    arguments = listOf(
        PromptArgument(
            name = "topic",
            description = "The topic to analyze",
            required = true
        )
    )
) { request: GetPromptRequest ->
    val topic = request.params.arguments?.get("topic") as? String
        ?: throw IllegalArgumentException("topic is required")
    
    GetPromptResult(
        description = "Analyze the given topic",
        messages = listOf(
            PromptMessage(
                role = Role.User,
                content = TextContent(
                    text = "Analyze this topic: $topic"
                )
            )
        )
    )
}
```

## 傳輸組態

### Stdio 傳輸

用於 stdin/stdout 上的通訊：

```kotlin
import io.modelcontextprotocol.kotlin.sdk.server.StdioServerTransport

suspend fun main() {
    val transport = StdioServerTransport()
    server.connect(transport)
}
```

### 搭配 Ktor 的 SSE 傳輸

用於使用伺服器傳送事件的 HTTP 型通訊：

```kotlin
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.modelcontextprotocol.kotlin.sdk.server.mcp

fun main() {
    embeddedServer(Netty, port = 8080) {
        mcp {
            Server(
                serverInfo = Implementation(
                    name = "sse-server",
                    version = "1.0.0"
                ),
                options = ServerOptions(
                    capabilities = ServerCapabilities(
                        tools = ServerCapabilities.Tools()
                    )
                )
            ) {
                "SSE-based MCP server"
            }
        }
    }.start(wait = true)
}
```

## 協程使用

所有 MCP 作業都是暫停函式。請正確使用 Kotlin 協程：

```kotlin
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.async

server.addTool(
    name = "parallel-search",
    description = "Search multiple sources in parallel"
) { request ->
    coroutineScope {
        val source1 = async { searchSource1(query) }
        val source2 = async { searchSource2(query) }
        
        val results = source1.await() + source2.await()
        
        CallToolResult(
            content = listOf(TextContent(text = results.joinToString("\n")))
        )
    }
}
```

## 錯誤處理

使用 Kotlin 的例外處理並提供有意義的錯誤訊息：

```kotlin
server.addTool(
    name = "validate-input",
    description = "Process validated input"
) { request ->
    try {
        val input = request.params.arguments["input"] as? String
            ?: throw IllegalArgumentException("input is required")
        
        require(input.isNotBlank()) { "input cannot be blank" }
        
        val result = processInput(input)
        
        CallToolResult(
            content = listOf(TextContent(text = result))
        )
    } catch (e: IllegalArgumentException) {
        CallToolResult(
            isError = true,
            content = listOf(TextContent(text = "Validation error: ${e.message}"))
        )
    }
}
```

## 搭配 kotlinx.serialization 的 JSON Schema

使用 kotlinx.serialization 進行類型安全的 JSON Schema：

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*

@Serializable
data class SearchInput(
    val query: String,
    val limit: Int = 10,
    val filters: List<String> = emptyList()
)

fun createToolSchema(): JsonObject = buildJsonObject {
    put("type", "object")
    putJsonObject("properties") {
        putJsonObject("query") {
            put("type", "string")
            put("description", "Search query")
        }
        putJsonObject("limit") {
            put("type", "integer")
            put("default", 10)
        }
        putJsonObject("filters") {
            put("type", "array")
            putJsonObject("items") {
                put("type", "string")
            }
        }
    }
    putJsonArray("required") {
        add("query")
    }
}
```

## Gradle 組態

正確設定您的 `build.gradle.kts`：

```kotlin
plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.modelcontextprotocol:kotlin-sdk:0.7.2")
    
    // For client transport
    implementation("io.ktor:ktor-client-cio:3.0.0")
    
    // For server transport
    implementation("io.ktor:ktor-server-netty:3.0.0")
    
    // For JSON serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    
    // For coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
}
```

## 多平台支援

Kotlin SDK 支援 Kotlin 多平台 (JVM、Wasm、iOS)：

```kotlin
kotlin {
    jvm()
    js(IR) {
        browser()
        nodejs()
    }
    wasmJs()
    
    sourceSets {
        commonMain.dependencies {
            implementation("io.modelcontextprotocol:kotlin-sdk:0.7.2")
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
        }
    }
}
```

## 資源生命週期

處理資源更新和訂閱：

```kotlin
server.addResource(
    uri = "file:///dynamic/data",
    name = "Dynamic Data",
    description = "Frequently updated data",
    mimeType = "application/json"
) { request ->
    // Provide current state
    ReadResourceResult(
        contents = listOf(
            TextResourceContents(
                text = getCurrentData(),
                uri = request.uri,
                mimeType = "application/json"
            )
        )
    )
}

// Notify clients when resource changes
server.notifyResourceListChanged()
```

## 測試

使用 Kotlin 協程測試公用程式測試您的 MCP 工具：

```kotlin
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals

class ServerTest {
    @Test
    fun testSearchTool() = runTest {
        val server = createTestServer()
        
        val request = CallToolRequest(
            params = CallToolParams(
                name = "search",
                arguments = mapOf("query" to "test", "limit" to 5)
            )
        )
        
        val result = server.callTool(request)
        
        assertEquals(false, result.isError)
        assert(result.content.isNotEmpty())
    }
}
```

## 常見模式

### 記錄

使用 Kotlin 記錄函式庫進行結構化記錄：

```kotlin
import io.github.oshai.kotlinlogging.KotlinLogging

private val logger = KotlinLogging.logger {}

server.addTool(
    name = "logged-operation",
    description = "Operation with logging"
) { request ->
    logger.info { "Tool called with args: ${request.params.arguments}" }
    
    try {
        val result = performOperation(request)
        logger.info { "Operation succeeded" }
        result
    } catch (e: Exception) {
        logger.error(e) { "Operation failed" }
        throw e
    }
}
```

### 組態

使用資料類別進行組態：

```kotlin
import kotlinx.serialization.Serializable

@Serializable
data class ServerConfig(
    val name: String = "my-server",
    val version: String = "1.0.0",
    val port: Int = 8080,
    val enableTools: Boolean = true
)

fun loadConfig(): ServerConfig {
    // Load from environment or config file
    return ServerConfig(
        name = System.getenv("SERVER_NAME") ?: "my-server",
        version = System.getenv("VERSION") ?: "1.0.0"
    )
}
```

### 依賴注入

使用建構函式注入以進行可測試性：

```kotlin
class MyServer(
    private val dataService: DataService,
    private val config: ServerConfig
) {
    fun createServer() = Server(
        serverInfo = Implementation(
            name = config.name,
            version = config.version
        )
    ) {
        "MCP Server with DI"
    }.apply {
        addTool(
            name = "fetch-data",
            description = "Fetch data using injected service"
        ) { request ->
            val data = dataService.fetchData()
            CallToolResult(
                content = listOf(TextContent(text = data))
            )
        }
    }
}

```