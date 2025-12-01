---
agent: agent
description: '使用官方 io.modelcontextprotocol:kotlin-sdk 函式庫，產生一個具有適當結構、依賴項和實作的完整 Kotlin MCP 伺服器專案。'
---

# Kotlin MCP 伺服器專案產生器

產生一個完整、可投入生產的 Kotlin Model Context Protocol (MCP) 伺服器專案。

## 專案要求

您將建立一個具有以下功能的 Kotlin MCP 伺服器：

1. **專案結構**：基於 Gradle 的 Kotlin 專案佈局
2. **依賴項**：官方 MCP SDK、Ktor 和 kotlinx 函式庫
3. **伺服器設定**：配置 MCP 伺服器與傳輸
4. **工具**：至少 2-3 個具有類型輸入/輸出的實用工具
5. **錯誤處理**：適當的異常處理和驗證
6. **文件**：包含設定和使用說明的 README
7. **測試**：帶有協程的基本測試結構

## 範本結構

```
myserver/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── src/
│   ├── main/
│   │   └── kotlin/
│   │       └── com/example/myserver/
│   │           ├── Main.kt
│   │           ├── Server.kt
│   │           ├── config/
│   │           │   └── Config.kt
│   │           └── tools/
│   │               ├── Tool1.kt
│   │               └── Tool2.kt
│   └── test/
│       └── kotlin/
│           └── com/example/myserver/
│               └── ServerTest.kt
└── README.md
```

## build.gradle.kts 範本

```kotlin
plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    application
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.modelcontextprotocol:kotlin-sdk:0.7.2")
    
    // Ktor for transports
    implementation("io.ktor:ktor-server-netty:3.0.0")
    implementation("io.ktor:ktor-client-cio:3.0.0")
    
    // Serialization
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")
    
    // Logging
    implementation("io.github.oshai:kotlin-logging-jvm:7.0.0")
    implementation("ch.qos.logback:logback-classic:1.5.12")
    
    // Testing
    testImplementation(kotlin("test"))
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
}

application {
    mainClass.set("com.example.myserver.MainKt")
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(17)
}
```

## settings.gradle.kts 範本

```kotlin
rootProject.name = "{{PROJECT_NAME}}"
```

## Main.kt 範本

```kotlin
package com.example.myserver

import io.modelcontextprotocol.kotlin.sdk.server.StdioServerTransport
import kotlinx.coroutines.runBlocking
import io.github.oshai.kotlinlogging.KotlinLogging

private val logger = KotlinLogging.logger {}

fun main() = runBlocking {
    logger.info { "Starting MCP server..." }
    
    val config = loadConfig()
    val server = createServer(config)
    
    // Use stdio transport
    val transport = StdioServerTransport()
    
    logger.info { "Server '${config.name}' v${config.version} ready" }
    server.connect(transport)
}
```

## Server.kt 範本

```kotlin
package com.example.myserver

import io.modelcontextprotocol.kotlin.sdk.server.Server
import io.modelcontextprotocol.kotlin.sdk.server.ServerOptions
import io.modelcontextprotocol.kotlin.sdk.Implementation
import io.modelcontextprotocol.kotlin.sdk.ServerCapabilities
import com.example.myserver.tools.registerTools

fun createServer(config: Config): Server {
    val server = Server(
        serverInfo = Implementation(
            name = config.name,
            version = config.version
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
        config.description
    }
    
    // Register all tools
    server.registerTools()
    
    return server
}
```

## Config.kt 範本

```kotlin
package com.example.myserver.config

import kotlinx.serialization.Serializable

@Serializable
data class Config(
    val name: String = "{{PROJECT_NAME}}",
    val version: String = "1.0.0",
    val description: String = "{{PROJECT_DESCRIPTION}}"
)

fun loadConfig(): Config {
    return Config(
        name = System.getenv("SERVER_NAME") ?: "{{PROJECT_NAME}}",
        version = System.getenv("VERSION") ?: "1.0.0",
        description = System.getenv("DESCRIPTION") ?: "{{PROJECT_DESCRIPTION}}"
    )
}
```

## Tool1.kt 範本

```kotlin
package com.example.myserver.tools

import io.modelcontextprotocol.kotlin.sdk.server.Server
import io.modelcontextprotocol.kotlin.sdk.CallToolRequest
import io.modelcontextprotocol.kotlin.sdk.CallToolResult
import io.modelcontextprotocol.kotlin.sdk.TextContent
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonObject
import kotlinx.serialization.json.putJsonArray

fun Server.registerTool1() {
    addTool(
        name = "tool1",
        description = "Description of what tool1 does",
        inputSchema = buildJsonObject {
            put("type", "object")
            putJsonObject("properties") {
                putJsonObject("param1") {
                    put("type", "string")
                    put("description", "First parameter")
                }
                putJsonObject("param2") {
                    put("type", "integer")
                    put("description", "Optional second parameter")
                }
            }
            putJsonArray("required") {
                add("param1")
            }
        }
    ) { request: CallToolRequest ->
        // Extract and validate parameters
        val param1 = request.params.arguments["param1"] as? String
            ?: throw IllegalArgumentException("param1 is required")
        val param2 = (request.params.arguments["param2"] as? Number)?.toInt() ?: 0
        
        // Perform tool logic
        val result = performTool1Logic(param1, param2)
        
        CallToolResult(
            content = listOf(
                TextContent(text = result)
            )
        )
    }
}

private fun performTool1Logic(param1: String, param2: Int): String {
    // Implement tool logic here
    return "Processed: $param1 with value $param2"
}
```

## tools/ToolRegistry.kt 範本

```kotlin
package com.example.myserver.tools

import io.modelcontextprotocol.kotlin.sdk.server.Server

fun Server.registerTools() {
    registerTool1()
    registerTool2()
    // Register additional tools here
}
```

## ServerTest.kt 範本

```kotlin
package com.example.myserver

import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class ServerTest {
    
    @Test
    fun `test server creation`() = runTest {
        val config = Config(
            name = "test-server",
            version = "1.0.0",
            description = "Test server"
        )
        
        val server = createServer(config)
        
        assertEquals("test-server", server.serverInfo.name)
        assertEquals("1.0.0", server.serverInfo.version)
    }
    
    @Test
    fun `test tool1 execution`() = runTest {
        val config = Config()
        val server = createServer(config)
        
        // Test tool execution
        // Note: You'll need to implement proper testing utilities
        // for calling tools in the server
    }
}
```

## README.md 範本

```markdown
# {{PROJECT_NAME}}

使用 Kotlin 建立的 Model Context Protocol (MCP) 伺服器。

## 描述

{{PROJECT_DESCRIPTION}}

## 要求

- Java 17 或更高版本
- Kotlin 2.1.0

## 安裝

建構專案：

```bash
./gradlew build
```

## 使用方式

使用 stdio 傳輸執行伺服器：

```bash
./gradlew run
```

或建構並執行 jar：

```bash
./gradlew installDist
./build/install/{{PROJECT_NAME}}/bin/{{PROJECT_NAME}}
```

## 配置

透過環境變數進行配置：

- `SERVER_NAME`：伺服器名稱（預設值：`{{PROJECT_NAME}}`）
- `VERSION`：伺服器版本（預設值：`1.0.0`）
- `DESCRIPTION`：伺服器描述

## 可用工具

### tool1
{{TOOL1_DESCRIPTION}}

**輸入：**
- `param1` (字串，必填)：第一個參數
- `param2` (整數，選填)：第二個參數

**輸出：**
- 操作的文字結果

## 開發

執行測試：

```bash
./gradlew test
```

建構：

```bash
./gradlew build
```

使用自動重新載入執行（開發）：

```bash
./gradlew run --continuous
```

## 多平台

此專案使用 Kotlin 多平台，可以針對 JVM、Wasm 和 iOS。
請參閱 `build.gradle.kts` 以取得平台配置。

## 授權

MIT

## 產生指示

產生 Kotlin MCP 伺服器時：

1. **Gradle 設定**：建立包含所有依賴項的適當 `build.gradle.kts`
2. **套件結構**：遵循 Kotlin 套件慣例
3. **類型安全**：使用資料類別和 kotlinx.serialization
4. **協程**：所有操作都應該是掛起函式
5. **錯誤處理**：使用 Kotlin 異常和驗證
6. **JSON 結構**：使用 `buildJsonObject` 建立工具結構
7. **測試**：包含協程測試工具
8. **日誌記錄**：使用 kotlin-logging 進行結構化日誌記錄
9. **配置**：使用資料類別和環境變數
10. **文件**：公共 API 的 KDoc 註釋

## 最佳實踐

- 對於所有非同步操作使用掛起函式
- 利用 Kotlin 的空安全和類型系統
- 使用資料類別處理結構化資料
- 應用 kotlinx.serialization 處理 JSON
- 使用密封類別處理結果類型
- 使用 Result/Either 模式實作適當的錯誤處理
- 使用 kotlinx-coroutines-test 編寫測試
- 使用依賴注入實現可測試性
- 遵循 Kotlin 編碼慣例
- 使用有意義的名稱和 KDoc 註釋

## 傳輸選項

### Stdio 傳輸
```kotlin
val transport = StdioServerTransport()
server.connect(transport)
```

### SSE 傳輸 (Ktor)
```kotlin
embeddedServer(Netty, port = 8080) {
    mcp {
        Server(/*...*/) { "Description" }
    }
}.start(wait = true)
```

## 多平台配置

對於多平台專案，新增至 `build.gradle.kts`：

```kotlin
kotlin {
    jvm()
    js(IR) { nodejs() }
    wasmJs()
    
    sourceSets {
        commonMain.dependencies {
            implementation("io.modelcontextprotocol:kotlin-sdk:0.7.2")
        }
    }
}
```
