---
description: '使用官方 MCP Ruby SDK gem 在 Ruby 中建立一個完整的模型上下文協定伺服器專案。'
agent: agent
---

# Ruby MCP 伺服器產生器

使用官方 Ruby SDK 在 Ruby 中建立一個完整、可投入生產的 MCP 伺服器。

## 專案產生

當要求建立 Ruby MCP 伺服器時，產生一個具有以下結構的完整專案：

```
my-mcp-server/
├── Gemfile
├── Rakefile
├── lib/
│   ├── my_mcp_server.rb
│   ├── my_mcp_server/
│   │   ├── server.rb
│   │   ├── tools/
│   │   │   ├── greet_tool.rb
│   │   │   └── calculate_tool.rb
│   │   ├── prompts/
│   │   │   └── code_review_prompt.rb
│   │   └── resources/
│   │       └── example_resource.rb
├── bin/
│   └── mcp-server
├── test/
│   ├── test_helper.rb
│   └── tools/
│       ├── greet_tool_test.rb
│       └── calculate_tool_test.rb
└── README.md
```

## Gemfile 模板

```ruby
source 'https://rubygems.org'

gem 'mcp', '~> 0.4.0'

group :development, :test do
  gem 'minitest', '~> 5.0'
  gem 'rake', '~> 13.0'
  gem 'rubocop', '~> 1.50'
end
```

## Rakefile 模板

```ruby
require 'rake/testtask'
require 'rubocop/rake_task'

Rake::TestTask.new(:test) do |t|
  t.libs << 'test'
  t.libs << 'lib'
  t.test_files = FileList['test/**/*_test.rb']
end

RuboCop::RakeTask.new

task default: %i[test rubocop]
```

## lib/my_mcp_server.rb 模板

```ruby
# frozen_string_literal: true

require 'mcp'
require_relative 'my_mcp_server/server'
require_relative 'my_mcp_server/tools/greet_tool'
require_relative 'my_mcp_server/tools/calculate_tool'
require_relative 'my_mcp_server/prompts/code_review_prompt'
require_relative 'my_mcp_server/resources/example_resource'

module MyMcpServer
  VERSION = '1.0.0'
end
```

## lib/my_mcp_server/server.rb 模板

```ruby
# frozen_string_literal: true

module MyMcpServer
  class Server
    attr_reader :mcp_server
    
    def initialize(server_context: {})
      @mcp_server = MCP::Server.new(
        name: 'my_mcp_server',
        version: MyMcpServer::VERSION,
        tools: [
          Tools::GreetTool,
          Tools::CalculateTool
        ],
        prompts: [
          Prompts::CodeReviewPrompt
        ],
        resources: [
          Resources::ExampleResource.resource
        ],
        server_context: server_context
      )
      
      setup_resource_handler
    end
    
    def handle_json(json_string)
      mcp_server.handle_json(json_string)
    end
    
    def start_stdio
      transport = MCP::Server::Transports::StdioTransport.new(mcp_server)
      transport.open
    end
    
    private
    
    def setup_resource_handler
      mcp_server.resources_read_handler do |params|
        Resources::ExampleResource.read(params[:uri])
      end
    end
  end
end
```

## lib/my_mcp_server/tools/greet_tool.rb 模板

```ruby
# frozen_string_literal: true

module MyMcpServer
  module Tools
    class GreetTool < MCP::Tool
      tool_name 'greet'
      description '產生問候訊息'
      
      input_schema(
        properties: {
          name: {
            type: 'string',
            description: '要問候的名稱'
          }
        },
        required: ['name']
      )
      
      output_schema(
        properties: {
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        },
        required: ['message', 'timestamp']
      )
      
      annotations(
        read_only_hint: true,
        idempotent_hint: true
      )
      
      def self.call(name:, server_context:)
        timestamp = Time.now.iso8601
        message = "Hello, #{name}! Welcome to MCP."
        
        structured_data = {
          message: message,
          timestamp: timestamp
        }
        
        MCP::Tool::Response.new(
          [{ type: 'text', text: message }],
          structured_content: structured_data
        )
      end
    end
  end
end
```

## lib/my_mcp_server/tools/calculate_tool.rb 模板

```ruby
# frozen_string_literal: true

module MyMcpServer
  module Tools
    class CalculateTool < MCP::Tool
      tool_name 'calculate'
      description '執行數學計算'
      
      input_schema(
        properties: {
          operation: {
            type: 'string',
            description: '要執行的操作',
            enum: ['add', 'subtract', 'multiply', 'divide']
          },
          a: {
            type: 'number',
            description: '第一個運算元'
          },
          b: {
            type: 'number',
            description: '第二個運算元'
          }
        },
        required: ['operation', 'a', 'b']
      )
      
      output_schema(
        properties: {
          result: { type: 'number' },
          operation: { type: 'string' }
        },
        required: ['result', 'operation']
      )
      
      annotations(
        read_only_hint: true,
        idempotent_hint: true
      )
      
      def self.call(operation:, a:, b:, server_context:)
        result = case operation
                 when 'add' then a + b
                 when 'subtract' then a - b
                 when 'multiply' then a * b
                 when 'divide'
                   return error_response('除數為零') if b.zero?
                   a / b.to_f
                 else
                   return error_response("未知操作: #{operation}")
                 end
        
        structured_data = {
          result: result,
          operation: operation
        }
        
        MCP::Tool::Response.new(
          [{ type: 'text', text: "結果: #{result}" }],
          structured_content: structured_data
        )
      end
      
      def self.error_response(message)
        MCP::Tool::Response.new(
          [{ type: 'text', text: message }],
          is_error: true
        )
      end
    end
  end
end
```

## lib/my_mcp_server/prompts/code_review_prompt.rb 模板

```ruby
# frozen_string_literal: true

module MyMcpServer
  module Prompts
    class CodeReviewPrompt < MCP::Prompt
      prompt_name 'code_review'
      description '產生程式碼審查提示'
      
      arguments [
        MCP::Prompt::Argument.new(
          name: 'language',
          description: '程式語言',
          required: true
        ),
        MCP::Prompt::Argument.new(
          name: 'focus',
          description: '審查重點領域 (例如，效能、安全性)',
          required: false
        )
      ]
      
      meta(
        version: '1.0',
        category: 'development'
      )
      
      def self.template(args, server_context:)
        language = args['language'] || 'Ruby'
        focus = args['focus'] || 'general quality'
        
        MCP::Prompt::Result.new(
          description: "針對 #{language} 程式碼進行審查，重點關注 #{focus}",
          messages: [
            MCP::Prompt::Message.new(
              role: 'user',
              content: MCP::Content::Text.new(
                "請審查這段 #{language} 程式碼，重點關注 #{focus}。"
              )
            ),
            MCP::Prompt::Message.new(
              role: 'assistant',
              content: MCP::Content::Text.new(
                "我將審查程式碼，重點關注 #{focus}。請分享程式碼。"
              )
            ),
            MCP::Prompt::Message.new(
              role: 'user',
              content: MCP::Content::Text.new(
                '[在此貼上程式碼]'
              )
            )
          ]
        )
      end
    end
  end
end
```

## lib/my_mcp_server/resources/example_resource.rb 模板

```ruby
# frozen_string_literal: true

module MyMcpServer
  module Resources
    class ExampleResource
      RESOURCE_URI = 'resource://data/example'
      
      def self.resource
        MCP::Resource.new(
          uri: RESOURCE_URI,
          name: 'example-data',
          description: '範例資源資料',
          mime_type: 'application/json'
        )
      end
      
      def self.read(uri)
        return [] unless uri == RESOURCE_URI
        
        data = {
          message: '範例資源資料',
          timestamp: Time.now.iso8601,
          version: MyMcpServer::VERSION
        }
        
        [{
          uri: uri,
          mimeType: 'application/json',
          text: data.to_json
        }]
      end
    end
  end
end
```

## bin/mcp-server 模板

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative '../lib/my_mcp_server'

begin
  server = MyMcpServer::Server.new
  server.start_stdio
rescue Interrupt
  warn "\n正在關閉伺服器..."
  exit 0
rescue StandardError => e
  warn "錯誤: #{e.message}"
  warn e.backtrace.join("\n")
  exit 1
end
```

使檔案可執行:
```bash
chmod +x bin/mcp-server
```

## test/test_helper.rb 模板

```ruby
# frozen_string_literal: true

$LOAD_PATH.unshift File.expand_path('../lib', __dir__)
require 'my_mcp_server'
require 'minitest/autorun'
```

## test/tools/greet_tool_test.rb 模板

```ruby
# frozen_string_literal: true

require 'test_helper'

module MyMcpServer
  module Tools
    class GreetToolTest < Minitest::Test
      def test_greet_with_name
        response = GreetTool.call(
          name: 'Ruby',
          server_context: {}
        )
        
        refute response.is_error
        assert_equal 1, response.content.length
        assert_match(/Ruby/, response.content.first[:text])
        
        assert response.structured_content
        assert_equal 'Hello, Ruby! Welcome to MCP.', response.structured_content[:message]
      end
      
      def test_output_schema_validation
        response = GreetTool.call(
          name: 'Test',
          server_context: {}
        )
        
        assert response.structured_content.key?(:message)
        assert response.structured_content.key?(:timestamp)
      end
    end
  end
end
```

## test/tools/calculate_tool_test.rb 模板

```ruby
# frozen_string_literal: true

require 'test_helper'

module MyMcpServer
  module Tools
    class CalculateToolTest < Minitest::Test
      def test_addition
        response = CalculateTool.call(
          operation: 'add',
          a: 5,
          b: 3,
          server_context: {}
        )
        
        refute response.is_error
        assert_equal 8, response.structured_content[:result]
      end
      
      def test_subtraction
        response = CalculateTool.call(
          operation: 'subtract',
          a: 10,
          b: 4,
          server_context: {}
        )
        
        refute response.is_error
        assert_equal 6, response.structured_content[:result]
      end
      
      def test_multiplication
        response = CalculateTool.call(
          operation: 'multiply',
          a: 6,
          b: 7,
          server_context: {}
        )
        
        refute response.is_error
        assert_equal 42, response.structured_content[:result]
      end
      
      def test_division
        response = CalculateTool.call(
          operation: 'divide',
          a: 15,
          b: 3,
          server_context: {}
        )
        
        refute response.is_error
        assert_equal 5.0, response.structured_content[:result]
      end
      
      def test_division_by_zero
        response = CalculateTool.call(
          operation: 'divide',
          a: 10,
          b: 0,
          server_context: {}
        )
        
        assert response.is_error
        assert_match(/除數為零/, response.content.first[:text])
      end
      
      def test_unknown_operation
        response = CalculateTool.call(
          operation: 'modulo',
          a: 10,
          b: 3,
          server_context: {}
        )
        
        assert response.is_error
        assert_match(/未知操作/, response.content.first[:text])
      end
    end
  end
end
```

## README.md 模板

```markdown
# 我的 MCP 伺服器

使用 Ruby 和官方 MCP Ruby SDK 建立的模型上下文協定伺服器。

## 功能

- ✅ 工具: greet, calculate
- ✅ 提示: code_review
- ✅ 資源: example-data
- ✅ 輸入/輸出結構描述
- ✅ 工具註釋
- ✅ 結構化內容
- ✅ 完整的測試覆蓋率

## 要求

- Ruby 3.0 或更高版本

## 安裝

```bash
bundle install
```

## 用法

### Stdio 傳輸

執行伺服器:

```bash
bundle exec bin/mcp-server
```

然後傳送 JSON-RPC 請求:

```bash
{"jsonrpc":"2.0","id":"1","method":"ping"}
{"jsonrpc":"2.0","id":"2","method":"tools/list"}
{"jsonrpc":"2.0","id":"3","method":"tools/call","params":{"name":"greet","arguments":{"name":"Ruby"}}}
```

### Rails 整合

新增到您的 Rails 控制器:

```ruby
class McpController < ApplicationController
  def index
    server = MyMcpServer::Server.new(
      server_context: { user_id: current_user.id }
    )
    render json: server.handle_json(request.body.read)
  end
end
```

## 測試

執行測試:

```bash
bundle exec rake test
```

執行 linter:

```bash
bundle exec rake rubocop
```

執行所有檢查:

```bash
bundle exec rake
```

## 與 Claude Desktop 整合

新增到 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "bundle",
      "args": ["exec", "bin/mcp-server"],
      "cwd": "/path/to/my-mcp-server"
    }
  }
}
```

## 專案結構

```
my-mcp-server/
├── Gemfile              # 依賴項
├── Rakefile             # 建構任務
├── lib/                 # 原始程式碼
│   ├── my_mcp_server.rb # 主要進入點
│   └── my_mcp_server/   # 模組命名空間
│       ├── server.rb    # 伺服器設定
│       ├── tools/       # 工具實作
│       ├── prompts/     # 提示模板
│       └── resources/   # 資源處理器
├── bin/                 # 可執行檔
│   └── mcp-server       # Stdio 伺服器
├── test/                # 測試套件
│   ├── test_helper.rb   # 測試配置
│   └── tools/           # 工具測試
└── README.md            # 此檔案
```

## 授權

MIT
```

## 產生指令

1. **詢問專案名稱和描述**
2. **產生所有檔案**，並具有適當的命名和模組結構
3. **使用類別作為工具和提示** 以更好地組織
4. **包含輸入/輸出結構描述** 以確保類型安全
5. **新增工具註釋** 以提供行為提示
6. **在回應中包含結構化內容**
7. **為所有工具實作全面的測試**
8. **遵循 Ruby 慣例** (snake_case, 模組, frozen_string_literal)
9. **新增適當的錯誤處理**，並帶有 is_error 標誌
10. **提供 stdio 和 HTTP** 使用範例
