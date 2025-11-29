---
description: '使用官方 MCP Swift SDK 套件，在 Swift 中產生完整的模型上下文協定伺服器專案。'
mode: agent
---

# Swift MCP 伺服器產生器

使用官方 Swift SDK 套件，在 Swift 中產生一個完整、可投入生產的 MCP 伺服器。

## 專案產生

當要求建立 Swift MCP 伺服器時，請產生一個具有以下結構的完整專案：

```
my-mcp-server/
├── Package.swift
├── Sources/
│   └── MyMCPServer/
│       ├── main.swift
│       ├── Server.swift
│       ├── Tools/
│       │   ├── ToolDefinitions.swift
│       │   └── ToolHandlers.swift
│       ├── Resources/
│       │   ├── ResourceDefinitions.swift
│       │   └── ResourceHandlers.swift
│       └── Prompts/
│           ├── PromptDefinitions.swift
│           └── PromptHandlers.swift
├── Tests/
│   └── MyMCPServerTests/
│       └── ServerTests.swift
└── README.md
```

## Package.swift 範本

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyMCPServer",
    platforms: [
        .macOS(.v13),
        .iOS(.v16),
        .watchOS(.v9),
        .tvOS(.v16),
        .visionOS(.v1)
    ],
    dependencies: [
        .package(
            url: "https://github.com/modelcontextprotocol/swift-sdk.git",
            from: "0.10.0"
        ),
        .package(
            url: "https://github.com/apple/swift-log.git",
            from: "1.5.0"
        ),
        .package(
            url: "https://github.com/swift-server/swift-service-lifecycle.git",
            from: "2.0.0"
        )
    ],
    targets: [
        .executableTarget(
            name: "MyMCPServer",
            dependencies: [
                .product(name: "MCP", package: "swift-sdk"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "ServiceLifecycle", package: "swift-service-lifecycle")
            ]
        ),
        .testTarget(
            name: "MyMCPServerTests",
            dependencies: ["MyMCPServer"]
        )
    ]
)
```

## main.swift 範本

```swift
import MCP
import Logging
import ServiceLifecycle

struct MCPService: Service {
    let server: Server
    let transport: Transport
    
    func run() async throws {
        try await server.start(transport: transport) { clientInfo, capabilities in
            logger.info("Client connected", metadata: [
                "name": .string(clientInfo.name),
                "version": .string(clientInfo.version)
            ])
        }
        
        // Keep service running
        try await Task.sleep(for: .days(365 * 100))
    }
    
    func shutdown() async throws {
        logger.info("Shutting down MCP server")
        await server.stop()
    }
}

var logger = Logger(label: "com.example.mcp-server")
logger.logLevel = .info

do {
    let server = await createServer()
    let transport = StdioTransport(logger: logger)
    let service = MCPService(server: server, transport: transport)
    
    let serviceGroup = ServiceGroup(
        services: [service],
        configuration: .init(
            gracefulShutdownSignals: [.sigterm, .sigint]
        ),
        logger: logger
    )
    
    try await serviceGroup.run()
} catch {
    logger.error("Fatal error", metadata: ["error": .string("\(error)")])
    throw error
}
```

## Server.swift 範本

```swift
import MCP
import Logging

func createServer() async -> Server {
    let server = Server(
        name: "MyMCPServer",
        version: "1.0.0",
        capabilities: .init(
            prompts: .init(listChanged: true),
            resources: .init(subscribe: true, listChanged: true),
            tools: .init(listChanged: true)
        )
    )
    
    // Register tool handlers
    await registerToolHandlers(server: server)
    
    // Register resource handlers
    await registerResourceHandlers(server: server)
    
    // Register prompt handlers
    await registerPromptHandlers(server: server)
    
    return server
}
```

## ToolDefinitions.swift 範本

```swift
import MCP

func getToolDefinitions() -> [Tool] {
    [
        Tool(
            name: "greet",
            description: "產生問候訊息",
            inputSchema: .object([
                "type": .string("object"),
                "properties": .object([
                    "name": .object([
                        "type": .string("string"),
                        "description": .string("要問候的名稱")
                    ])
                ]),
                "required": .array([.string("name")])
            ])
        ),
        Tool(
            name: "calculate",
            description: "執行數學計算",
            inputSchema: .object([
                "type": .string("object"),
                "properties": .object([
                    "operation": .object([
                        "type": .string("string"),
                        "enum": .array([
                            .string("add"),
                            .string("subtract"),
                            .string("multiply"),
                            .string("divide")
                        ]),
                        "description": .string("要執行的操作")
                    ]),
                    "a": .object([
                        "type": .string("number"),
                        "description": .string("第一個運算元")
                    ]),
                    "b": .object([
                        "type": .string("number"),
                        "description": .string("第二個運算元")
                    ])
                ]),
                "required": .array([
                    .string("operation"),
                    .string("a"),
                    .string("b")
                ])
            ])
        )
    ]
}
```

## ToolHandlers.swift 範本

```swift
import MCP
import Logging

private let logger = Logger(label: "com.example.mcp-server.tools")

func registerToolHandlers(server: Server) async {
    await server.withMethodHandler(ListTools.self) { _ in
        logger.debug("列出可用的工具")
        return .init(tools: getToolDefinitions())
    }
    
    await server.withMethodHandler(CallTool.self) { params in
        logger.info("工具呼叫", metadata: ["name": .string(params.name)])
        
        switch params.name {
        case "greet":
            return handleGreet(params: params)
            
        case "calculate":
            return handleCalculate(params: params)
            
        default:
            logger.warning("請求了未知工具", metadata: ["name": .string(params.name)])
            return .init(
                content: [.text("未知工具: \(params.name)")],
                isError: true
            )
        }
    }
}

private func handleGreet(params: CallTool.Params) -> CallTool.Result {
    guard let name = params.arguments?["name"]?.stringValue else {
        return .init(
            content: [.text("缺少 'name' 參數")],
            isError: true
        )
    }
    
    let greeting = "Hello, \(name)! Welcome to MCP."
    logger.debug("產生問候語", metadata: ["name": .string(name)])
    
    return .init(
        content: [.text(greeting)],
        isError: false
    )
}

private func handleCalculate(params: CallTool.Params) -> CallTool.Result {
    guard let operation = params.arguments?["operation"]?.stringValue,
          let a = params.arguments?["a"]?.doubleValue,
          let b = params.arguments?["b"]?.doubleValue else {
        return .init(
            content: [.text("缺少或無效的參數")],
            isError: true
        )
    }
    
    let result: Double
    switch operation {
    case "add":
        result = a + b
    case "subtract":
        result = a - b
    case "multiply":
        result = a * b
    case "divide":
        guard b != 0 else {
            return .init(
                content: [.text("除以零")],
                isError: true
            )
        }
        result = a / b
    default:
        return .init(
            content: [.text("未知操作: \(operation)")],
            isError: true
        )
    }
    
    logger.debug("執行計算", metadata: [
        "operation": .string(operation),
        "result": .string("\(result)")
    ])
    
    return .init(
        content: [.text("結果: \(result)")],
        isError: false
    )
}
```

## ResourceDefinitions.swift 範本

```swift
import MCP

func getResourceDefinitions() -> [Resource] {
    [
        Resource(
            name: "範例資料",
            uri: "resource://data/example",
            description: "範例資源資料",
            mimeType: "application/json"
        ),
        Resource(
            name: "組態",
            uri: "resource://config",
            description: "伺服器組態",
            mimeType: "application/json"
        )
    ]
}
```

## ResourceHandlers.swift 範本

```swift
import MCP
import Logging
import Foundation

private let logger = Logger(label: "com.example.mcp-server.resources")

actor ResourceState {
    private var subscriptions: Set<String> = []
    
    func addSubscription(_ uri: String) {
        subscriptions.insert(uri)
    }
    
    func removeSubscription(_ uri: String) {
        subscriptions.remove(uri)
    }
    
    func isSubscribed(_ uri: String) -> Bool {
        subscriptions.contains(uri)
    }
}

private let state = ResourceState()

func registerResourceHandlers(server: Server) async {
    await server.withMethodHandler(ListResources.self) { params in
        logger.debug("列出可用資源")
        return .init(resources: getResourceDefinitions(), nextCursor: nil)
    }
    
    await server.withMethodHandler(ReadResource.self) { params in
        logger.info("讀取資源", metadata: ["uri": .string(params.uri)])
        
        switch params.uri {
        case "resource://data/example":
            let jsonData = """
            {
                "message": "範例資源資料",
                "timestamp": "\(Date())"
            }
            """
            return .init(contents: [
                .text(jsonData, uri: params.uri, mimeType: "application/json")
            ])
            
        case "resource://config":
            let config = """
            {
                "serverName": "MyMCPServer",
                "version": "1.0.0"
            }
            """
            return .init(contents: [
                .text(config, uri: params.uri, mimeType: "application/json")
            ])
            
        default:
            logger.warning("請求了未知資源", metadata: ["uri": .string(params.uri)])
            throw MCPError.invalidParams("未知資源 URI: \(params.uri)")
        }
    }
    
    await server.withMethodHandler(ResourceSubscribe.self) { params in
        logger.info("用戶端訂閱資源", metadata: ["uri": .string(params.uri)])
        await state.addSubscription(params.uri)
        return .init()
    }
    
    await server.withMethodHandler(ResourceUnsubscribe.self) { params in
        logger.info("用戶端取消訂閱資源", metadata: ["uri": .string(params.uri)])
        await state.removeSubscription(params.uri)
        return .init()
    }
}
```

## PromptDefinitions.swift 範本

```swift
import MCP

func getPromptDefinitions() -> [Prompt] {
    [
        Prompt(
            name: "code-review",
            description: "產生程式碼審查提示",
            arguments: [
                .init(name: "language", description: "程式語言", required: true),
                .init(name: "focus", description: "審查重點領域", required: false)
            ]
        )
    ]
}
```

## PromptHandlers.swift 範本

```swift
import MCP
import Logging

private let logger = Logger(label: "com.example.mcp-server.prompts")

func registerPromptHandlers(server: Server) async {
    await server.withMethodHandler(ListPrompts.self) { params in
        logger.debug("列出可用提示")
        return .init(prompts: getPromptDefinitions(), nextCursor: nil)
    }
    
    await server.withMethodHandler(GetPrompt.self) { params in
        logger.info("取得提示", metadata: ["name": .string(params.name)])
        
        switch params.name {
        case "code-review":
            return handleCodeReviewPrompt(params: params)
            
        default:
            logger.warning("請求了未知提示", metadata: ["name": .string(params.name)])
            throw MCPError.invalidParams("未知提示: \(params.name)")
        }
    }
}

private func handleCodeReviewPrompt(params: GetPrompt.Params) -> GetPrompt.Result {
    guard let language = params.arguments?["language"]?.stringValue else {
        return .init(
            description: "缺少語言參數",
            messages: []
        )
    }
    
    let focus = params.arguments?["focus"]?.stringValue ?? "一般品質"
    
    let description = "針對 \(language) 的程式碼審查，重點在於 \(focus)"
    let messages: [Prompt.Message] = [
        .user("請審查此 \(language) 程式碼，重點在於 \(focus)。"),
        .assistant("我將審查程式碼，重點在於 \(focus)。請分享程式碼。"),
        .user("這是要審查的程式碼：[在此貼上程式碼]")
    ]
    
    logger.debug("產生程式碼審查提示", metadata: [
        "language": .string(language),
        "focus": .string(focus)
    ])
    
    return .init(description: description, messages: messages)
}
```

## ServerTests.swift 範本

```swift
import XCTest
@testable import MyMCPServer

final class ServerTests: XCTestCase {
    func testGreetTool() async throws {
        let params = CallTool.Params(
            name: "greet",
            arguments: ["name": .string("Swift")]
        )
        
        let result = handleGreet(params: params)
        
        XCTAssertFalse(result.isError ?? true)
        XCTAssertEqual(result.content.count, 1)
        
        if case .text(let message) = result.content[0] {
            XCTAssertTrue(message.contains("Swift"))
        } else {
            XCTFail("預期文字內容")
        }
    }
    
    func testCalculateTool() async throws {
        let params = CallTool.Params(
            name: "calculate",
            arguments: [
                "operation": .string("add"),
                "a": .number(5),
                "b": .number(3)
            ]
        )
        
        let result = handleCalculate(params: params)
        
        XCTAssertFalse(result.isError ?? true)
        XCTAssertEqual(result.content.count, 1)
        
        if case .text(let message) = result.content[0] {
            XCTAssertTrue(message.contains("8"))
        } else {
            XCTFail("預期文字內容")
        }
    }
    
    func testDivideByZero() async throws {
        let params = CallTool.Params(
            name: "calculate",
            arguments: [
                "operation": .string("divide"),
                "a": .number(10),
                "b": .number(0)
            ]
        )
        
        let result = handleCalculate(params: params)
        
        XCTAssertTrue(result.isError ?? false)
    }
}
```

## README.md 範本

```markdown
# MyMCPServer

使用 Swift 建構的模型上下文協定伺服器。

## 功能

- ✅ 工具：greet, calculate
- ✅ 資源：範例資料、組態
- ✅ 提示：程式碼審查
- ✅ 使用 ServiceLifecycle 優雅關機
- ✅ 使用 swift-log 結構化記錄
- ✅ 完整的測試覆蓋率

## 要求

- Swift 6.0+
- macOS 13+, iOS 16+, 或 Linux

## 安裝

```bash
swift build -c release
```

## 用法

執行伺服器：

```bash
swift run
```

或使用記錄：

```bash
LOG_LEVEL=debug swift run
```

## 測試

```bash
swift test
```

## 開發

伺服器使用：
- [MCP Swift SDK](https://github.com/modelcontextprotocol/swift-sdk) - MCP 協定實作
- [swift-log](https://github.com/apple/swift-log) - 結構化記錄
- [swift-service-lifecycle](https://github.com/swift-server/swift-service-lifecycle) - 優雅關機

## 專案結構

- `Sources/MyMCPServer/main.swift` - 帶有 ServiceLifecycle 的進入點
- `Sources/MyMCPServer/Server.swift` - 伺服器組態
- `Sources/MyMCPServer/Tools/` - 工具定義和處理程式
- `Sources/MyMCPServer/Resources/` - 資源定義和處理程式
- `Sources/MyMCPServer/Prompts/` - 提示定義和處理程式
- `Tests/` - 單元測試

## 授權

MIT
```

## 產生指示

1. **詢問專案名稱和描述**
2. **產生所有檔案** 並使用適當的命名
3. **使用基於 Actor 的狀態** 以確保執行緒安全
4. **包含全面的記錄** 與 swift-log
5. **使用 ServiceLifecycle 實作優雅關機**
6. **為所有處理程式新增測試**
7. **使用現代 Swift 並行** (async/await)
8. **遵循 Swift 命名慣例** (camelCase, PascalCase)
9. **包含錯誤處理** 並使用適當的 MCPError
10. **使用文件註解記錄公共 API**

## 建構與執行

```bash
# 建構
swift build

# 執行
swift run

# 測試
swift test

# 發行建構
swift build -c release

# 安裝
swift build -c release
cp .build/release/MyMCPServer /usr/local/bin/
```

## 與 Claude Desktop 整合

新增至 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "/path/to/MyMCPServer"
    }
  }
}
```
