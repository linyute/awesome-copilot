---
description: '使用官方 PHP SDK、基於屬性的發現和多種傳輸選項，建立模型上下文協定 (MCP) 伺服器的最佳實踐'
applyTo: '**/*.php'
---

# PHP MCP 伺服器開發最佳實踐

本指南提供了使用與 The PHP Foundation 合作維護的官方 PHP SDK 建立模型上下文協定 (MCP) 伺服器的最佳實踐。

## 安裝與設定

### 透過 Composer 安裝

```bash
composer require mcp/sdk
```

### 專案結構

組織您的 PHP MCP 伺服器專案：

```
my-mcp-server/
├── composer.json
├── src/
│   ├── Tools/
│   │   ├── Calculator.php
│   │   └── FileManager.php
│   ├── Resources/
│   │   ├── ConfigProvider.php
│   │   └── DataProvider.php
│   ├── Prompts/
│   │   └── PromptGenerator.php
│   └── Server.php
├── server.php           # 伺服器進入點
└── tests/
    └── ToolsTest.php
```

### Composer 配置

```json
{
    "name": "your-org/mcp-server",
    "description": "MCP Server for...",
    "type": "project",
    "require": {
        "php": "^8.2",
        "mcp/sdk": "^0.1"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    }
}
```

## 伺服器實作

### 具有屬性發現的基本伺服器

建立您的伺服器進入點：

```php
#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

use Mcp\\Server;
use Mcp\\Server\\Transport\\StdioTransport;

$server = Server::builder()
    ->setServerInfo('My MCP Server', '1.0.0')
    ->setDiscovery(__DIR__, ['.'])
    ->build();

$transport = new StdioTransport();

$server->run($transport);
```

### 具有快取的伺服器

使用 PSR-16 快取以獲得更好的效能：

```php
use Symfony\\Component\\Cache\\Adapter\\FilesystemAdapter;
use Symfony\\Component\\Cache\\Psr16Cache;

$cache = new Psr16Cache(new FilesystemAdapter('mcp-discovery'));

$server = Server::builder()
    ->setServerInfo('My MCP Server', '1.0.0')
    ->setDiscovery(
        basePath: __DIR__,
        scanDirs: ['.', 'src'],
        excludeDirs: ['vendor', 'tests'],
        cache: $cache
    )
    ->build();
```

### 手動註冊

以程式設計方式註冊功能：

```php
use App\\Tools\\Calculator;
use App\\Resources\\Config;

$server = Server::builder()
    ->setServerInfo('My MCP Server', '1.0.0')
    ->addTool([Calculator::class, 'add'], 'add')
    ->addTool([Calculator::class, 'multiply'], 'multiply')
    ->addResource([Config::class, 'getSettings'], 'config://app/settings')
    ->build();
```

## 工具開發

### 具有屬性的簡單工具

```php
<?php

namespace App\\Tools;

use Mcp\\Capability\\Attribute\\McpTool;

class Calculator
{
    /**
     * 將兩個數字相加。
     *
     * @param int $a 第一個數字
     * @param int $b 第二個數字
     * @return int 兩個數字的總和
     */
    #[McpTool]
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

### 具有自訂名稱的工具

```php
use Mcp\\Capability\\Attribute\\McpTool;

class FileManager
{
    /**
     * 從檔案系統讀取檔案內容。
     */
    #[McpTool(name: 'read_file')]
    public function readFileContent(string $path): string
    {
        if (!file_exists($path)) {
            throw new \InvalidArgumentException("File not found: {$path}");
        }

        return file_get_contents($path);
    }
}
```

### 具有驗證和結構描述的工具

```php
use Mcp\\Capability\\Attribute\\{McpTool, Schema};

class UserManager
{
    #[McpTool(name: 'create_user')]
    public function createUser(
        #[Schema(format: 'email')]
        string $email,

        #[Schema(minimum: 18, maximum: 120)]
        int $age,

        #[Schema(
            pattern: '^[A-Z][a-z]+$',
            description: 'Capitalized first name'
        )]
        string $firstName
    ): array
    {
        return [
            'id' => uniqid(),
            'email' => $email,
            'age' => $age,
            'firstName' => $firstName
        ];
    }
}
```

### 具有複雜回傳類型的工具

```php
use Mcp\\Schema\\Content\\{TextContent, ImageContent};

class ReportGenerator
{
    #[McpTool]
    public function generateReport(string $type): array
    {
        return [
            new TextContent('Report generated:'),
            TextContent::code($this->generateCode($type), 'php'),
            new TextContent('Summary: All checks passed.')
        ];
    }

    #[McpTool]
    public function getChart(string $chartType): ImageContent
    {
        $imageData = $this->generateChartImage($chartType);

        return new ImageContent(
            data: base64_encode($imageData),
            mimeType: 'image/png'
        );
    }
}
```

### 具有匹配表達式的工具

```php
#[McpTool(name: 'calculate')]
public function performCalculation(float $a, float $b, string $operation): float
{
    return match($operation) {
        'add' => $a + $b,
        'subtract' => $a - $b,
        'multiply' => $a * $b,
        'divide' => $b != 0 ? $a / $b :
            throw new \InvalidArgumentException('Division by zero'),
        default => throw new \InvalidArgumentException('Invalid operation')
    };
}
```

## 資源實作

### 靜態資源

```php
<?php

namespace App\\Resources;

use Mcp\\Capability\\Attribute\\McpResource;

class ConfigProvider
{
    /**
     * 提供目前的應用程式配置。
     */
    #[McpResource(
        uri: 'config://app/settings',
        name: 'app_settings',
        mimeType: 'application/json'
    )]
    public function getSettings(): array
    {
        return [
            'version' => '1.0.0',
            'debug' => false,
            'features' => ['auth', 'logging']
        ];
    }
}
```

### 具有變數的資源範本

```php
use Mcp\\Capability\\Attribute\\McpResourceTemplate;

class UserProvider
{
    /**
     * 透過 ID 和區段擷取使用者設定檔資訊。
     */
    #[McpResourceTemplate(
        uriTemplate: 'user://{userId}/profile/{section}',
        name: 'user_profile',
        description: 'User profile data by section',
        mimeType: 'application/json'
    )]
    public function getUserProfile(string $userId, string $section): array
    {
        // 變數順序必須與 URI 範本順序匹配
        return $this->users[$userId][$section] ??
            throw new \InvalidArgumentException("Profile section not found");
    }
}
```

### 具有檔案內容的資源

```php
use Mcp\\Schema\\Content\\{TextResourceContents, BlobResourceContents};

class FileProvider
{
    #[McpResource(uri: 'file://readme.txt', mimeType: 'text/plain')]
    public function getReadme(): TextResourceContents
    {
        return new TextResourceContents(
            uri: 'file://readme.txt',
            mimeType: 'text/plain',
            text: file_get_contents(__DIR__ . '/README.txt')
        );
    }

    #[McpResource(uri: 'file://image.png', mimeType: 'image/png')]
    public function getImage(): BlobResourceContents
    {
        $imageData = file_get_contents(__DIR__ . '/image.png');

        return new BlobResourceContents(
            uri: 'file://image.png',
            mimeType: 'image/png',
            blob: base64_encode($imageData)
        );
    }
}
```

## 提示實作

### 基本提示

```php
<?php

namespace App\\Prompts;

use Mcp\\Capability\\Attribute\\McpPrompt;

class PromptGenerator
{
    /**
     * 產生程式碼審查請求提示。
     */
    #[McpPrompt(name: 'code_review')]
    public function reviewCode(string $language, string $code, string $focus = 'general'): array
    {
        return [
            ['role' => 'assistant', 'content' => 'You are an expert code reviewer.'],
            ['role' => 'user', 'content' => "Review this {$language} code focusing on {$focus}:\n\n```{$language}\n{$code}\n```"]
        ];
    }
}
```

### 具有混合內容的提示

```php
use Mcp\\Schema\\Content\\{TextContent, ImageContent};
use Mcp\\Schema\\PromptMessage;
use Mcp\\Schema\\Enum\\Role;

#[McpPrompt]
public function analyzeImage(string $imageUrl, string $question): array
{
    $imageData = file_get_contents($imageUrl);

    return [
        new PromptMessage(Role::Assistant, [
            new TextContent('You are an image analysis expert.')
        ]),
        new PromptMessage(Role::User, [
            new TextContent($question),
            new ImageContent(
                data: base64_encode($imageData),
                mimeType: 'image/jpeg'
            )
        ])
    ];
}
```

## 完成提供者

### 值列表完成

```php
use Mcp\\Capability\\Attribute\\{McpPrompt, CompletionProvider};

#[McpPrompt]
public function generateContent(
    #[CompletionProvider(values: ['blog', 'article', 'tutorial', 'guide'])]
    string $contentType,

    #[CompletionProvider(values: ['beginner', 'intermediate', 'advanced'])]
    string $difficulty
): array
{
    return [
        ['role' => 'user', 'content' => "Create a {$difficulty} level {$contentType}"]
    ];
}
```

### 列舉完成

```php
enum Priority: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
}

enum Status
{
    case DRAFT;
    case PUBLISHED;
    case ARCHIVED;
}

#[McpResourceTemplate(uriTemplate: 'tasks/{taskId}')]
public function getTask(
    string $taskId,

    #[CompletionProvider(enum: Priority::class)]
    string $priority,

    #[CompletionProvider(enum: Status::class)]
    string $status
): array
{
    return $this->tasks[$taskId] ?? [];
}
```

### 自訂完成提供者

```php
use Mcp\\Capability\\Prompt\\Completion\\ProviderInterface;

class UserIdCompletionProvider implements ProviderInterface
{
    public function __construct(
        private DatabaseService $db
    ) {}

    public function getCompletions(string $currentValue): array
    {
        return $this->db->searchUserIds($currentValue);
    }
}

#[McpResourceTemplate(uriTemplate: 'user://{userId}/profile')]
public function getUserProfile(
    #[CompletionProvider(provider: UserIdCompletionProvider::class)]
    string $userId
): array
{
    return $this->users[$userId] ??
        throw new \InvalidArgumentException('User not found');
}
```

## 傳輸選項

### 標準輸入輸出傳輸

用於命令列整合（預設）：

```php
use Mcp\\Server\\Transport\\StdioTransport;

$transport = new StdioTransport();
$server->run($transport);
```

### HTTP 傳輸

用於基於網路的整合：

```php
use Mcp\\Server\\Transport\\StreamableHttpTransport;
use Nyholm\\Psr7\\Factory\\Psr17Factory;

$psr17Factory = new Psr17Factory();

$request = $psr17Factory->createServerRequestFromGlobals();

$transport = new StreamableHttpTransport(
    $request,
    $psr17Factory,  // 回應工廠
    $psr17Factory   // 串流工廠
);

$response = $server->run($transport);

// 在您的網路框架中傳送回應
foreach ($response->getHeaders() as $name => $values) {
    foreach ($values as $value) {
        header("$name: $value", false);
    }
}

http_response_code($response->getStatusCode());
echo $response->getBody();
```

## 會話管理

### 記憶體內會話（預設）

```php
$server = Server::builder()
    ->setServerInfo('My Server', '1.0.0')
    ->setSession(ttl: 7200) // 2 小時
    ->build();
```

### 基於檔案的會話

```php
use Mcp\\Server\\Session\\FileSessionStore;

$server = Server::builder()
    ->setServerInfo('My Server', '1.0.0')
    ->setSession(new FileSessionStore(__DIR__ . '/sessions'))
    ->build();
```

### 自訂會話儲存

```php
use Mcp\\Server\\Session\\InMemorySessionStore;

$server = Server::builder()
    ->setServerInfo('My Server', '1.0.0')
    ->setSession(new InMemorySessionStore(3600))
    ->build();
```

## 錯誤處理

### 工具中的例外處理

```php
#[McpTool]
public function divideNumbers(float $a, float $b): float
{
    if ($b === 0.0) {
        throw new \InvalidArgumentException('Division by zero is not allowed');
    }

    return $a / $b;
}

#[McpTool]
public function processFile(string $filename): string
{
    if (!file_exists($filename)) {
        throw new \InvalidArgumentException("File not found: {$filename}");
    }

    if (!is_readable($filename)) {
        throw new \RuntimeException("File not readable: {$filename}");
    }

    return file_get_contents($filename);
}
```

### 自訂錯誤回應

SDK 會自動將例外轉換為 MCP 用戶端理解的 JSON-RPC 錯誤回應。

## 測試

### 工具的 PHPUnit 測試

```php
<?php

namespace Tests;

use PHPUnit\\Framework\\TestCase;
use App\\Tools\\Calculator;

class CalculatorTest extends TestCase
{
    private Calculator $calculator;

    protected function setUp(): void
    {
        $this->calculator = new Calculator();
    }

    public function testAdd(): void
    {
        $result = $this->calculator->add(5, 3);
        $this->assertSame(8, $result);
    }

    public function testDivideByZero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Division by zero');

        $this->calculator->divide(10, 0);
    }
}
```

### 測試伺服器發現

```php
public function testServerDiscoversTools(): void
{
    $server = Server::builder()
        ->setServerInfo('Test Server', '1.0.0')
        ->setDiscovery(__DIR__ . '/../src', ['.'])
        ->build();

    $capabilities = $server->getCapabilities();

    $this->assertArrayHasKey('tools', $capabilities);
    $this->assertNotEmpty($capabilities['tools']);
}
```

## 效能最佳實踐

### 使用發現快取

在生產環境中始終使用快取：

```php
use Symfony\\Component\\Cache\\Adapter\\RedisAdapter;
use Symfony\\Component\\Cache\\Psr16Cache;

$redis = new \Redis();
$redis->connect('127.0.0.1', 6379);

$cache = new Psr16Cache(new RedisAdapter($redis));

$server = Server::builder()
    ->setServerInfo('My Server', '1.0.0')
    ->setDiscovery(
        basePath: __DIR__,
        scanDirs: ['src'],
        excludeDirs: ['vendor', 'tests', 'var'],
        cache: $cache
    )
    ->build();
```

### 優化掃描目錄

只掃描必要的目錄：

```php
$server = Server::builder()
    ->setDiscovery(
        basePath: __DIR__,
        scanDirs: ['src/Tools', 'src/Resources'],  // 特定目錄
        excludeDirs: ['vendor', 'tests', 'var', 'cache']
    )
    ->build();
```

### 使用 OPcache

在生產環境中啟用 OPcache 以獲得更好的 PHP 效能：

```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0
```

## 框架整合

### Laravel 整合

```php
// app/Console/Commands/McpServer.php
namespace App\\Console\\Commands;

use Illuminate\\Console\\Command;
use Mcp\\Server;
use Mcp\\Server\\Transport\\StdioTransport;

class McpServer extends Command
{
    protected $signature = 'mcp:serve';
    protected $description = 'Start MCP server';

    public function handle()
    {
        $server = Server::builder()
            ->setServerInfo('Laravel MCP Server', '1.0.0')
            ->setDiscovery(app_path(), ['Tools', 'Resources'])
            ->build();

        $transport = new StdioTransport();
        $server->run($transport);
    }
}
```

### Symfony 整合

```php
// 使用 symfony/mcp-bundle 進行原生整合
composer require symfony/mcp-bundle
```

## 部署

### Docker 部署

```dockerfile
FROM php:8.2-cli

# 安裝擴充功能
RUN docker-php-ext-install pdo pdo_mysql

# 安裝 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 設定工作目錄
WORKDIR /app

# 複製應用程式
COPY . /app

# 安裝依賴項
RUN composer install --no-dev --optimize-autoloader

# 使伺服器可執行
RUN chmod +x /app/server.php

CMD ["php", "/app/server.php"]
```

### Systemd 服務

```ini
[Unit]
Description=MCP PHP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mcp-server
ExecStart=/usr/bin/php /var/www/mcp-server/server.php
Restart=always

[Install]
WantedBy=multi-user.target
```

## MCP 用戶端配置

### Claude Desktop 配置

```json
{
  "mcpServers": {
    "php-server": {
      "command": "php",
      "args": ["/absolute/path/to/server.php"]
    }
  }
}
```

### MCP Inspector 測試

```bash
npx @modelcontextprotocol/inspector php /path/to/server.php
```

## 其他資源

- [官方 PHP SDK 儲存庫](https://github.com/modelcontextprotocol/php-sdk)
- [MCP 元素文件](https://github.com/modelcontextprotocol/php-sdk/blob/main/docs/mcp-elements.md)
- [伺服器建構器文件](https://github.com/modelcontextprotocol/php-sdk/blob/main/docs/server-builder.md)
- [傳輸文件](https://github.com/modelcontextprotocol/php-sdk/blob/main/docs/transports.md)
- [範例](https://github.com/modelcontextprotocol/php-sdk/blob/main/docs/examples.md)
- [MCP 規範](https://spec.modelcontextprotocol.io/)
- [模型上下文協定](https://modelcontextprotocol.io/)
