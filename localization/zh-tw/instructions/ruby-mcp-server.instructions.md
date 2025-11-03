---
description: '使用官方 MCP Ruby SDK gem 在 Ruby 中建立模型上下文協定 (MCP) 伺服器的最佳實踐和模式。'
applyTo: "**/*.rb, **/Gemfile, **/*.gemspec, **/Rakefile"
---

# Ruby MCP 伺服器開發指南

在 Ruby 中建立 MCP 伺服器時，請遵循使用官方 Ruby SDK 的這些最佳實踐和模式。

## 安裝

將 MCP gem 添加到您的 Gemfile：

```ruby
gem 'mcp'
```

然後執行：

```bash
bundle install
```

## 伺服器設定

建立 MCP 伺服器實例：

```ruby
require 'mcp'

server = MCP::Server.new(
  name: 'my_server',
  version: '1.0.0'
)
```

## 添加工具

使用類別或程式碼塊定義工具：

### 作為類別的工具

```ruby
class GreetTool < MCP::Tool
  tool_name 'greet'
  description '生成問候訊息'
  
  input_schema(
    properties: {
      name: { type: 'string', description: '要問候的名稱' }
    },
    required: ['name']
  )
  
  output_schema(
    properties: {
      message: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' }
    },
    required: ['message']
  )
  
  annotations(
    read_only_hint: true,
    idempotent_hint: true
  )
  
  def self.call(name:, server_context:)
    MCP::Tool::Response.new([{
      type: 'text',
      text: "Hello, #{name}! Welcome to MCP."
    }], structured_content: {
      message: "Hello, #{name}!",
      timestamp: Time.now.iso8601
    })
  end
end

server = MCP::Server.new(
  name: 'my_server',
  tools: [GreetTool]
)
```

### 帶有程式碼塊的工具

```ruby
server.define_tool(
  name: 'calculate',
  description: '執行數學計算',
  input_schema: {
    properties: {
      operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['operation', 'a', 'b']
  },
  annotations: {
    read_only_hint: true,
    idempotent_hint: true
  }
) do |args, server_context|
  operation = args['operation']
  a = args['a']
  b = args['b']
  
  result = case operation
  when 'add' then a + b
  when 'subtract' then a - b
  when 'multiply' then a * b
  when 'divide'
    return MCP::Tool::Response.new([{ type: 'text', text: '除數為零' }], is_error: true) if b == 0
    a / b
  else
    return MCP::Tool::Response.new([{ type: 'text', text: "未知操作: #{operation}" }], is_error: true)
  end
  
  MCP::Tool::Response.new([{ type: 'text', text: "結果: #{result}" }])
end
```

## 添加資源

定義資料存取資源：

```ruby
# 註冊資源
resource = MCP::Resource.new(
  uri: 'resource://data/example',
  name: 'example-data',
  description: '範例資源資料',
  mime_type: 'application/json'
)

server = MCP::Server.new(
  name: 'my_server',
  resources: [resource]
)

# 定義讀取處理程式
server.resources_read_handler do |params|
  case params[:uri]
  when 'resource://data/example'
    [{
      uri: params[:uri],
      mimeType: 'application/json',
      text: { message: '範例資料', timestamp: Time.now }.to_json
    }]
  else
    raise "未知資源: #{params[:uri]}"
  end
end
```

## 添加提示

定義提示模板：

### 作為類別的提示

```ruby
class CodeReviewPrompt < MCP::Prompt
  prompt_name 'code_review'
  description '生成程式碼審查提示'
  
  arguments [
    MCP::Prompt::Argument.new(
      name: 'language',
      description: '程式語言',
      required: true
    ),
    MCP::Prompt::Argument.new(
      name: 'focus',
      description: '審查重點領域',
      required: false
    )
  ]
  
  def self.template(args, server_context:)
    language = args['language'] || 'Ruby'
    focus = args['focus'] || '一般品質'
    
    MCP::Prompt::Result.new(
      description: "針對 #{language} 的程式碼審查，重點關注 #{focus}",
      messages: [
        MCP::Prompt::Message.new(
          role: 'user',
          content: MCP::Content::Text.new("請審查此 #{language} 程式碼，重點關注 #{focus}。")
        ),
        MCP::Prompt::Message.new(
          role: 'assistant',
          content: MCP::Content::Text.new("我將審查程式碼，重點關注 #{focus}。請分享程式碼。")
        )
      ]
    )
  end
end

server = MCP::Server.new(
  name: 'my_server',
  prompts: [CodeReviewPrompt]
)
```

### 帶有程式碼塊的提示

```ruby
server.define_prompt(
  name: 'analyze',
  description: '分析主題',
  arguments: [
    MCP::Prompt::Argument.new(name: 'topic', description: '要分析的主題', required: true),
    MCP::Prompt::Argument.new(name: 'depth', description: '分析深度', required: false)
  ]
) do |args, server_context:|
  topic = args['topic']
  depth = args['depth'] || '基本'
  
  MCP::Prompt::Result.new(
    description: "對 #{topic} 進行 #{depth} 級別的分析",
    messages: [
      MCP::Prompt::Message.new(
        role: 'user',
        content: MCP::Content::Text.new("請分析: #{topic}")
      ),
      MCP::Prompt::Message.new(
        role: 'assistant',
        content: MCP::Content::Text.new("我將提供 #{topic} 的 #{depth} 分析")
      )
    ]
  )
end
```

## 傳輸配置

### 標準 I/O 傳輸

對於本地命令列應用程式：

```ruby
require 'mcp'

server = MCP::Server.new(
  name: 'my_server',
  tools: [MyTool]
)

transport = MCP::Server::Transports::StdioTransport.new(server)
transport.open
```

### HTTP 傳輸 (Rails)

對於 Rails 應用程式：

```ruby
class McpController < ApplicationController
  def index
    server = MCP::Server.new(
      name: 'rails_server',
      version: '1.0.0',
      tools: [SomeTool],
      prompts: [MyPrompt],
      server_context: { user_id: current_user.id }
    )
    
    render json: server.handle_json(request.body.read)
  end
end
```

### 可串流 HTTP 傳輸

對於伺服器傳送事件：

```ruby
server = MCP::Server.new(name: 'my_server')
transport = MCP::Server::Transports::StreamableHTTPTransport.new(server)
server.transport = transport

# 當工具改變時，通知客戶端
server.define_tool(name: 'new_tool') { |**args| { result: 'ok' } }
server.notify_tools_list_changed
```

## 伺服器上下文

將上下文資訊傳遞給工具和提示：

```ruby
server = MCP::Server.new(
  name: 'my_server',
  tools: [AuthenticatedTool],
  server_context: {
    user_id: current_user.id,
    request_id: request.uuid,
    auth_token: session[:token]
  }
)

class AuthenticatedTool < MCP::Tool
  def self.call(query:, server_context:)
    user_id = server_context[:user_id]
    # 使用 user_id 進行授權
    
    MCP::Tool::Response.new([{ type: 'text', text: '已授權' }])
  end
end
```

## 配置

### 異常報告

配置異常報告：

```ruby
MCP.configure do |config|
  config.exception_reporter = ->(exception, server_context) {
    # 報告給您的錯誤追蹤服務
    Bugsnag.notify(exception) do |report|
      report.add_metadata(:mcp, server_context)
    end
  }
end
```

### 檢測

監控 MCP 伺服器效能：

```ruby
MCP.configure do |config|
  config.instrumentation_callback = ->(data) {
    # 記錄檢測資料
    Rails.logger.info("MCP: #{data.inspect}")
    
    # 或發送到指標服務
    StatsD.timing("mcp.#{data[:method]}.duration", data[:duration])
    StatsD.increment("mcp.#{data[:method]}.count")
  }
end
```

檢測資料包括：
- `method`：呼叫的協定方法 (例如 "tools/call")
- `tool_name`：呼叫的工具名稱
- `prompt_name`：呼叫的提示名稱
- `resource_uri`：呼叫的資源 URI
- `error`：如果查詢失敗的錯誤程式碼
- `duration`：持續時間 (秒)

### 協定版本

覆寫協定版本：

```ruby
configuration = MCP::Configuration.new(protocol_version: '2025-06-18')
server = MCP::Server.new(name: 'my_server', configuration: configuration)
```

## 工具註釋

提供有關工具行為的 Metadata：

```ruby
class DataTool < MCP::Tool
  annotations(
    read_only_hint: true,      # 工具只讀取資料
    destructive_hint: false,   # 工具不銷毀資料
    idempotent_hint: true,     # 相同輸入 = 相同輸出
    open_world_hint: false     # 工具在封閉上下文中操作
  )
  
  def self.call(**args, server_context:)
    # 實作
  end
end
```

## 工具輸出 Schema

定義預期的輸出結構：

```ruby
class WeatherTool < MCP::Tool
  output_schema(
    properties: {
      temperature: { type: 'number' },
      condition: { type: 'string' },
      humidity: { type: 'integer' }
    },
    required: ['temperature', 'condition']
  )
  
  def self.call(location:, server_context:)
    weather_data = {
      temperature: 72.5,
      condition: '晴朗',
      humidity: 45
    }
    
    # 根據 schema 驗證
    output_schema.validate_result(weather_data)
    
    MCP::Tool::Response.new(
      [{ type: 'text', text: weather_data.to_json }],
      structured_content: weather_data
    )
  end
end
```

## 回應中的結構化內容

返回帶有文字的結構化資料：

```ruby
class APITool < MCP::Tool
  def self.call(endpoint:, server_context:)
    api_data = call_api(endpoint)
    
    MCP::Tool::Response.new(
      [{ type: 'text', text: api_data.to_json }],
      structured_content: api_data
    )
  end
end
```

## 自訂方法

定義自訂 JSON-RPC 方法：

```ruby
server = MCP::Server.new(name: 'my_server')

# 帶有結果的自訂方法
server.define_custom_method(method_name: 'add') do |params|
  params[:a] + params[:b]
end

# 自訂通知 (返回 nil)
server.define_custom_method(method_name: 'notify') do |params|
  puts "通知: #{params[:message]}"
  nil
end
```

## 通知

發送列表更改通知：

```ruby
server = MCP::Server.new(name: 'my_server')
transport = MCP::Server::Transports::StreamableHTTPTransport.new(server)
server.transport = transport

# 當工具改變時通知
server.define_tool(name: 'new_tool') { |**args| { result: 'ok' } }
server.notify_tools_list_changed

# 當提示改變時通知
server.define_prompt(name: 'new_prompt') { |args, **_| MCP::Prompt::Result.new(...) }
server.notify_prompts_list_changed

# 當資源改變時通知
server.notify_resources_list_changed
```

## 資源模板

使用 URI 模板定義動態資源：

```ruby
resource_template = MCP::ResourceTemplate.new(
  uri_template: 'users://{user_id}/profile',
  name: 'user-profile',
  description: '使用者個人資料資料',
  mime_type: 'application/json'
)

server = MCP::Server.new(
  name: 'my_server',
  resource_templates: [resource_template]
)
```

## 錯誤處理

在工具中正確處理錯誤：

```ruby
class RiskyTool < MCP::Tool
  def self.call(data:, server_context:)
    begin
      result = risky_operation(data)
      MCP::Tool::Response.new([{ type: 'text', text: result }])
    rescue ValidationError => e
      MCP::Tool::Response.new(
        [{ type: 'text', text: "無效輸入: #{e.message}" }],
        is_error: true
      )
    rescue => e
      # 將被 exception_reporter 捕獲並報告
      raise
    end
  end
end
```

## 測試

為您的 MCP 伺服器編寫測試：

```ruby
require 'minitest/autorun'
require 'mcp'

class MyToolTest < Minitest::Test
  def test_greet_tool
    response = GreetTool.call(name: 'Ruby', server_context: {}) 
    
    assert_equal 1, response.content.length
    assert_match(/Ruby/, response.content.first[:text])
    refute response.is_error
  end
  
  def test_invalid_input
    response = CalculateTool.call(operation: 'divide', a: 10, b: 0, server_context: {}) 
    
    assert response.is_error
  end
end
```

## 客戶端使用

建立 MCP 客戶端以連接到伺服器：

```ruby
require 'mcp'
require 'faraday'

# HTTP 傳輸
http_transport = MCP::Client::HTTP.new(
  url: 'https://api.example.com/mcp',
  headers: { 'Authorization' => "Bearer #{token}" }
)

client = MCP::Client.new(transport: http_transport)

# 列出工具
tools = client.tools
tools.each do |tool|
  puts "工具: #{tool.name}"
  puts "描述: #{tool.description}"
end

# 呼叫工具
response = client.call_tool(
  tool: tools.first,
  arguments: { message: 'Hello, world!' }
)
```

## 最佳實踐

1. **為複雜工具使用類別** - 更好的組織和可測試性
2. **定義輸入/輸出 Schema** - 確保類型安全和驗證
3. **添加註釋** - 幫助客戶端理解工具行為
4. **包含結構化內容** - 提供文字和結構化資料
5. **使用 server_context** - 傳遞身份驗證和請求上下文
6. **配置異常報告** - 監控生產中的錯誤
7. **實作檢測** - 追蹤效能指標
8. **發送通知** - 讓客戶端了解更改
9. **驗證輸入** - 在處理前檢查參數
10. **遵循 Ruby 慣例** - 使用 snake_case，正確縮排

## 常見模式

### 身份驗證工具

```ruby
class AuthenticatedTool < MCP::Tool
  def self.call(**args, server_context:)
    user_id = server_context[:user_id]
    raise '未經授權' unless user_id
    
    # 處理身份驗證請求
    MCP::Tool::Response.new([{ type: 'text', text: '成功' }])
  end
end
```

### 分頁資源

```ruby
server.resources_read_handler do |params|
  uri = params[:uri]
  page = params[:page] || 1
  
  data = fetch_paginated_data(page)
  
  [{
    uri: uri,
    mimeType: 'application/json',
    text: data.to_json
  }]
end
```

### 動態提示

```ruby
class DynamicPrompt < MCP::Prompt
  def self.template(args, server_context:)
    user_id = server_context[:user_id]
    user_data = User.find(user_id)
    
    MCP::Prompt::Result.new(
      description: "為 #{user_data.name} 量身定制的提示",
      messages: generate_messages_for(user_data)
    )
  end
end
```
