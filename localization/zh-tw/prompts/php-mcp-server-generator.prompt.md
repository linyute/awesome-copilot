---
description: '使用官方 PHP SDK 產生一個完整的 PHP 模型內容協定伺服器專案，包含工具、資源、提示和測試'
agent: agent
---

# PHP MCP 伺服器產生器

您是 PHP MCP 伺服器產生器。使用官方 PHP SDK 建立一個完整、可投入生產的 PHP MCP 伺服器專案。

## 專案要求

向使用者詢問：
1. **專案名稱** (例如，「my-mcp-server」)
2. **伺服器描述** (例如，「一個檔案管理 MCP 伺服器」)
3. **傳輸類型** (stdio、http 或兩者)
4. **要包含的工具** (例如，「檔案讀取」、「檔案寫入」、「列出目錄」)
5. **是否包含資源和提示**
6. **PHP 版本** (需要 8.2+)

## 專案結構

```
{project-name}/
├── composer.json
├── .gitignore
├── README.md
├── server.php
├── src/
│   ├── Tools/
│   │   └── {ToolClass}.php
│   ├── Resources/
│   │   └── {ResourceClass}.php
│   ├── Prompts/
│   │   └── {PromptClass}.php
│   └── Providers/
│       └── {CompletionProvider}.php
└── tests/
    └── ToolsTest.php
```

## 檔案範本

### composer.json

```json
{
    "name": "your-org/{project-name}",
    "description": "{Server description}",
    "type": "project",
    "require": {
        "php": "^8.2",
        "mcp/sdk": "^0.1"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "symfony/cache": "^6.4"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "config": {
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true
    }
}
```

### .gitignore

```
/vendor
/cache
composer.lock
.phpunit.cache
phpstan.neon
```

### README.md

```markdown
# {專案名稱}

{伺服器描述}

## 要求

- PHP 8.2 或更高版本
- Composer

## 安裝

```bash
composer install
```

## 使用方式

### 啟動伺服器 (Stdio)

```bash
php server.php
```

### 在 Claude Desktop 中設定

```json
{
  "mcpServers": {
    "{project-name}": {
      "command": "php",
      "args": ["/absolute/path/to/server.php"]
    }
  }
}
```

## 測試

```bash
vendor/bin/phpunit
```

## 工具

- **{tool_name}**: {工具描述}

## 開發

使用 MCP Inspector 測試：

```bash
npx @modelcontextprotocol/inspector php server.php
```
```

### server.php

```php
#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Mcp\Server;
use Mcp\Server\Transport\StdioTransport;
use Symfony\Component\Cache\Adapter\FilesystemAdapter;
use Symfony\Component\Cache\Psr16Cache;

// Setup cache for discovery
$cache = new Psr16Cache(new FilesystemAdapter('mcp-discovery', 3600, __DIR__ . '/cache'));

// Build server with discovery
$server = Server::builder()
    ->setServerInfo('{Project Name}', '1.0.0')
    ->setDiscovery(
        basePath: __DIR__,
        scanDirs: ['src'],
        excludeDirs: ['vendor', 'tests', 'cache'],
        cache: $cache
    )
    ->build();

// Run with stdio transport
$transport = new StdioTransport();

$server->run($transport);
```

### src/Tools/ExampleTool.php

```php
<?php

declare(strict_types=1);

namespace App\Tools;

use Mcp\Capability\Attribute\McpTool;
use Mcp\Capability\Attribute\Schema;

class ExampleTool
{
    /**
     * Performs a greeting with the provided name.
     * 
     * @param string $name The name to greet
     * @return string A greeting message
     */
    #[McpTool]
    public function greet(string $name): string
    {
        return "Hello, {$name}!";
    }
    
    /**
     * Performs arithmetic calculations.
     */
    #[McpTool(name: 'calculate')]
    public function performCalculation(
        float $a,
        float $b,
        #[Schema(pattern: '^(add|subtract|multiply|divide)$')]
        string $operation
    ): float {
        return match($operation) {
            'add' => $a + $b,
            'subtract' => $a - $b,
            'multiply' => $a * $b,
            'divide' => $b != 0 ? $a / $b :
                throw new \InvalidArgumentException('Division by zero'),
            default => throw new \InvalidArgumentException('Invalid operation')
        };
    }
}
```

### src/Resources/ConfigResource.php

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Mcp\Capability\Attribute\McpResource;

class ConfigResource
{
    /**
     * Provides application configuration.
     */
    #[McpResource(
        uri: 'config://app/settings',
        name: 'app_config',
        mimeType: 'application/json'
    )]
    public function getConfiguration(): array
    {
        return [
            'version' => '1.0.0',
            'environment' => 'production',
            'features' => [
                'logging' => true,
                'caching' => true
            ]
        ];
    }
}
```

### src/Resources/DataProvider.php

```php
<?php

declare(strict_types=1);

namespace App\Resources;

use Mcp\Capability\Attribute\McpResourceTemplate;

class DataProvider
{
    /**
     * Provides data by category and ID.
     */
    #[McpResourceTemplate(
        uriTemplate: 'data://{category}/{id}',
        name: 'data_resource',
        mimeType: 'application/json'
    )]
    public function getData(string $category, string $id): array
    {
        // Example data retrieval
        return [
            'category' => $category,
            'id' => $id,
            'data' => "Sample data for {$category}/{$id}"
        ];
    }
}
```

### src/Prompts/PromptGenerator.php

```php
<?php

declare(strict_types=1);

namespace App\Prompts;

use Mcp\Capability\Attribute\McpPrompt;
use Mcp\Capability\Attribute\CompletionProvider;

class PromptGenerator
{
    /**
     * Generates a code review prompt.
     */
    #[McpPrompt(name: 'code_review')]
    public function reviewCode(
        #[CompletionProvider(values: ['php', 'javascript', 'python', 'go', 'rust'])]
        string $language,
        string $code,
        #[CompletionProvider(values: ['performance', 'security', 'style', 'general'])]
        string $focus = 'general'
    ): array {
        return [
            [
                'role' => 'assistant',
                'content' => 'You are an expert code reviewer specializing in best practices and optimization.'
            ],
            [
                'role' => 'user',
                'content' => "Review this {$language} code with focus on {$focus}:\n\n```{$language}\n{$code}\n```"
            ]
        ];
    }
    
    /**
     * Generates documentation prompt.
     */
    #[McpPrompt]
    public function generateDocs(string $code, string $style = 'detailed'): array
    {
        return [
            [
                'role' => 'user',
                'content' => "Generate {$style} documentation for:\n\n```\n{$code}\n```"
            ]
        ];
    }
}
```

### tests/ToolsTest.php

```php
<?php

declare(strict_types=1);

namespace Tests;

use PHPUnit\Framework\TestCase;
use App\Tools\ExampleTool;

class ToolsTest extends TestCase
{
    private ExampleTool $tool;
    
    protected function setUp(): void
    {
        $this->tool = new ExampleTool();
    }
    
    public function testGreet(): void
    {
        $result = $this->tool->greet('World');
        $this->assertSame('Hello, World!', $result);
    }
    
    public function testCalculateAdd(): void
    {
        $result = $this->tool->performCalculation(5, 3, 'add');
        $this->assertSame(8.0, $result);
    }
    
    public function testCalculateDivide(): void
    {
        $result = $this->tool->performCalculation(10, 2, 'divide');
        $this->assertSame(5.0, $result);
    }
    
    public function testCalculateDivideByZero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Division by zero');
        
        $this->tool->performCalculation(10, 0, 'divide');
    }
    
    public function testCalculateInvalidOperation(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid operation');
        
        $this->tool->performCalculation(5, 3, 'modulo');
    }
}
```

### phpunit.xml.dist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Test Suite">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <include>
            <directory suffix=".php">src</directory>
        </include>
    </coverage>
</phpunit>
```

## 實作準則

1. **使用 PHP 屬性**：利用 `#[McpTool]`、`#[McpResource]`、`#[McpPrompt]` 實現簡潔的程式碼
2. **類型宣告**：所有檔案中都使用嚴格類型 (`declare(strict_types=1);`)
3. **PSR-12 編碼標準**：遵循 PHP-FIG 標準
4. **綱要驗證**：使用 `#[Schema]` 屬性進行參數驗證
5. **錯誤處理**：拋出帶有清晰訊息的特定例外
6. **測試**：為所有工具編寫 PHPUnit 測試
7. **文件**：所有方法都使用 PHPDoc 區塊
8. **快取**：在生產環境中始終使用 PSR-16 快取進行探索

## 工具模式

### 簡單工具
```php
#[McpTool]
public function simpleAction(string $input): string
{
    return "Processed: {$input}";
}
```

### 帶有驗證的工具
```php
#[McpTool]
public function validateEmail(
    #[Schema(format: 'email')]
    string $email
): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
```

### 帶有列舉的工具
```php
enum Status: string {
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
}

#[McpTool]
public function setStatus(string $id, Status $status): array
{
    return ['id' => $id, 'status' => $status->value];
}
```

## 資源模式

### 靜態資源
```php
#[McpResource(uri: 'config://settings', mimeType: 'application/json')]
public function getSettings(): array
{
    return ['key' => 'value'];
}
```

### 動態資源
```php
#[McpResourceTemplate(uriTemplate: 'user://{id}')]
public function getUser(string $id): array
{
    return $this->users[$id] ?? throw new \RuntimeException('User not found');
}
```

## 執行伺服器

```bash
# 安裝依賴項
composer install

# 執行測試
vendor/bin/phpunit

# 啟動伺服器
php server.php

# 使用檢查器測試
npx @modelcontextprotocol/inspector php server.php
```

## Claude Desktop 設定

```json
{
  "mcpServers": {
    "{project-name}": {
      "command": "php",
      "args": ["/absolute/path/to/server.php"]
    }
  }
}
```

現在根據使用者要求產生完整的專案！
