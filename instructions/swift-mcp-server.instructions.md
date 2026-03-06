---
description: '使用官方 MCP Swift SDK 套件，在 Swift 中建構模型內容協定 (MCP) 伺服器的最佳實踐和模式。'
applyTo: "**/*.swift, **/Package.swift, **/Package.resolved"
---

# Swift MCP 伺服器開發指南

在 Swift 中建構 MCP 伺服器時，請遵循這些最佳實踐和模式，並使用官方 Swift SDK。

## 伺服器設定

使用 `Server` 類別建立具有功能的 MCP 伺服器：

```swift
import MCP

let server = Server(
    name: "MyServer",
    version: "1.0.0",
    capabilities: .init(
        prompts: .init(listChanged: true),
        resources: .init(subscribe: true, listChanged: true),
        tools: .init(listChanged: true)
    )
)
```

## 新增工具

使用 `withMethodHandler` 註冊工具處理程式：

```swift
// Register tool list handler
await server.withMethodHandler(ListTools.self) { _ in
    let tools = [
        Tool(
            name: "search",
            description: "Search for information",
            inputSchema: .object([
                "properties": .object([
                    "query": .string("Search query"),
                    "limit": .number("Maximum results")
                ]),
                "required": .array([.string("query")])
            ])
        )
    ]
    return .init(tools: tools)
}

// Register tool call handler
await server.withMethodHandler(CallTool.self) { params in
    switch params.name {
    case "search":
        let query = params.arguments?["query"]?.stringValue ?? ""
        let limit = params.arguments?["limit"]?.intValue ?? 10
        
        // Perform search
        let results = performSearch(query: query, limit: limit)
        
        return .init(
            content: [.text("Found \(results.count) results")],
            isError: false
        )
        
    default:
        return .init(
            content: [.text("Unknown tool")],
            isError: true
        )
    }
}
```

## 新增資源

實作資源處理程式以進行資料存取：

```swift
// Register resource list handler
await server.withMethodHandler(ListResources.self) { params in
    let resources = [
        Resource(
            name: "Data File",
            uri: "resource://data/example.txt",
            description: "Example data file",
            mimeType: "text/plain"
        )
    ]
    return .init(resources: resources, nextCursor: nil)
}

// Register resource read handler
await server.withMethodHandler(ReadResource.self) { params in
    switch params.uri {
    case "resource://data/example.txt":
        let content = loadResourceContent(uri: params.uri)
        return .init(contents: [
            Resource.Content.text(
                content,
                uri: params.uri,
                mimeType: "text/plain"
            )
        ])
        
    default:
        throw MCPError.invalidParams("Unknown resource URI: \(params.uri)")
    }
}

// Register resource subscribe handler
await server.withMethodHandler(ResourceSubscribe.self) { params in
    // Track subscription for notifications
    subscriptions.insert(params.uri)
    print("Client subscribed to \(params.uri)")
    return .init()
}
```

## 新增提示

實作提示處理程式以進行範本對話：

```swift
// Register prompt list handler
await server.withMethodHandler(ListPrompts.self) { params in
    let prompts = [
        Prompt(
            name: "analyze",
            description: "Analyze a topic",
            arguments: [
                .init(name: "topic", description: "Topic to analyze", required: true),
                .init(name: "depth", description: "Analysis depth", required: false)
            ]
        )
    ]
    return .init(prompts: prompts, nextCursor: nil)
}

// Register prompt get handler
await server.withMethodHandler(GetPrompt.self) { params in
    switch params.name {
    case "analyze":
        let topic = params.arguments?["topic"]?.stringValue ?? "general"
        let depth = params.arguments?["depth"]?.stringValue ?? "basic"
        
        let description = "Analysis of \(topic) at \(depth) level"
        let messages: [Prompt.Message] = [
            .user("Please analyze this topic: \(topic)"),
            .assistant("I'll provide a \(depth) analysis of \(topic)")
        ]
        
        return .init(description: description, messages: messages)
        
    default:
        throw MCPError.invalidParams("Unknown prompt: \(params.name)")
    }
}
```

## 傳輸組態

### 標準輸入輸出傳輸

用於本地子程序通訊：

```swift
import MCP
import Logging

let logger = Logger(label: "com.example.mcp-server")
let transport = StdioTransport(logger: logger)

try await server.start(transport: transport)
```

### HTTP 傳輸 (用戶端)

用於遠端伺服器連線：

```swift
let transport = HTTPClientTransport(
    endpoint: URL(string: "http://localhost:8080")!,
    streaming: true  // Enable Server-Sent Events
)

try await client.connect(transport: transport)
```

## 並發和 Actor

伺服器是一個 Actor，確保執行緒安全存取：

```swift
actor ServerState {
    private var subscriptions: Set<String> = []
    private var cache: [String: Any] = [:]
    
    func addSubscription(_ uri: String) {
        subscriptions.insert(uri)
    }
    
    func getSubscriptions() -> Set<String> {
        return subscriptions
    }
}

let state = ServerState()

await server.withMethodHandler(ResourceSubscribe.self) { params in
    await state.addSubscription(params.uri)
    return .init()
}
```

## 錯誤處理

將 Swift 的錯誤處理與 `MCPError` 搭配使用：

```swift
await server.withMethodHandler(CallTool.self) { params in
    do {
        guard let query = params.arguments?["query"]?.stringValue else {
            throw MCPError.invalidParams("Missing query parameter")
        }
        
        let result = try performOperation(query: query)
        
        return .init(
            content: [.text(result)],
            isError: false
        )
    } catch let error as MCPError {
        return .init(
            content: [.text(error.localizedDescription)],
            isError: true
        )
    } catch {
        return .init(
            content: [.text("Unexpected error: \(error.localizedDescription)")],
            isError: true
        )
    }
}
```

## 帶有 Value 型別的 JSON Schema

將 `Value` 型別用於 JSON 綱要：

```swift
let schema = Value.object([
    "type": .string("object"),
    "properties": .object([
        "name": .object([
            "type": .string("string"),
            "description": .string("User's name")
        ]),
        "age": .object([
            "type": .string("integer"),
            "minimum": .number(0),
            "maximum": .number(150)
        ]),
        "email": .object([
            "type": .string("string"),
            "format": .string("email")
        ])
    ]),
    "required": .array([.string("name")])
])
```

## Swift Package Manager 設定

建立您的 `Package.swift`：

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyMCPServer",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    dependencies: [
        .package(
            url: "https://github.com/modelcontextprotocol/swift-sdk.git",
            from: "0.10.0"
        ),
        .package(
            url: "https://github.com/apple/swift-log.git",
            from: "1.5.0"
        )
    ],
    targets: [
        .executableTarget(
            name: "MyMCPServer",
            dependencies: [
                .product(name: "MCP", package: "swift-sdk"),
                .product(name: "Logging", package: "swift-log")
            ]
        )
    ]
)
```

## 使用 ServiceLifecycle 優雅關閉

使用 Swift Service Lifecycle 進行適當關閉：

```swift
import MCP
import ServiceLifecycle
import Logging

struct MCPService: Service {
    let server: Server
    let transport: Transport
    
    func run() async throws {
        try await server.start(transport: transport)
        try await Task.sleep(for: .days(365 * 100))
    }
    
    func shutdown() async throws {
        await server.stop()
    }
}

let logger = Logger(label: "com.example.mcp-server")
let transport = StdioTransport(logger: logger)
let mcpService = MCPService(server: server, transport: transport)

let serviceGroup = ServiceGroup(
    services: [mcpService],
    configuration: .init(
        gracefulShutdownSignals: [.sigterm, .sigint]
    ),
    logger: logger
)

try await serviceGroup.run()
```

## Async/Await 模式

所有伺服器操作都使用 Swift 並發：

```swift
await server.withMethodHandler(CallTool.self) { params in
    async let result1 = fetchData1()
    async let result2 = fetchData2()
    
    let combined = await "\(result1) and \(result2)"
    
    return .init(
        content: [.text(combined)],
        isError: false
    )
}
```

## 日誌記錄

使用 swift-log 進行結構化日誌記錄：

```swift
import Logging

let logger = Logger(label: "com.example.mcp-server")

await server.withMethodHandler(CallTool.self) { params in
    logger.info("Tool called", metadata: [
        "name": .string(params.name),
        "args": .string("\(params.arguments ?? [:])")
    ])
    
    // Process tool call
    
    logger.debug("Tool completed successfully")
    
    return .init(content: [.text("Result")], isError: false)
}
```

## 測試

使用 async/await 測試您的伺服器：

```swift
import XCTest
@testable import MyMCPServer

final class ServerTests: XCTestCase {
    func testToolCall() async throws {
        let server = createTestServer()
        
        // Test tool call logic
        let params = CallTool.Params(
            name: "search",
            arguments: ["query": .string("test")]
        )
        
        // Verify behavior
        XCTAssertNoThrow(try await processToolCall(params))
    }
}
```

## 初始化掛鉤

使用初始化掛鉤驗證用戶端連線：

```swift
try await server.start(transport: transport) { clientInfo, clientCapabilities in
    // Validate client
    guard clientInfo.name != "BlockedClient" else {
        throw MCPError.invalidRequest("Client not allowed")
    }
    
    // Check capabilities
    if clientCapabilities.sampling == nil {
        logger.warning("Client doesn't support sampling")
    }
    
    logger.info("Client connected", metadata: [
        "name": .string(clientInfo.name),
        "version": .string(clientInfo.version)
    ])
}
```

## 常見模式

### 內容型別

處理不同的內容型別：

```swift
return .init(
    content: [
        .text("Plain text response"),
        .image(imageData, mimeType: "image/png", metadata: [
            "width": 1024,
            "height": 768
        ]),
        .resource(
            uri: "resource://data",
            mimeType: "application/json",
            text: jsonString
        )
    ],
    isError: false
)
```

### 嚴格組態

使用嚴格模式以在缺少功能時快速失敗：

```swift
let client = Client(
    name: "StrictClient",
    version: "1.0.0",
    configuration: .strict
)

// Will throw immediately if capability not available
try await client.listTools()
```

### 請求批次處理

高效地傳送多個請求：

```swift
var tasks: [Task<CallTool.Result, Error>] = []

try await client.withBatch { batch in
    for i in 0..<10 {
        tasks.append(
            try await batch.addRequest(
                CallTool.request(.init(
                    name: "process",
                    arguments: ["id": .number(Double(i))]
                ))
            )
        )
    }
}

for (index, task) in tasks.enumerated() {
    let result = try await task.value
    print("\(index): \(result.content)")
}
```
