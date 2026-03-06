---
applyTo: 'wp-content/plugins/**,wp-content/themes/**,**/*.php,**/*.inc,**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.css,**/*.scss,**/*.json'
description: 'WordPress 外掛程式和佈景主題的程式碼、安全性與測試規則'
---

# WordPress 開發 — Copilot 指示

**目標:** 產生安全、高效能、可測試且符合官方 WordPress 實踐的 WordPress 程式碼。偏好使用掛鉤 (hooks)、小型函式、依賴注入 (在合理情況下)，以及明確的職責分離。

## 1) 核心原則
- 絕不修改 WordPress 核心。透過 **動作 (actions)** 和 **過濾器 (filters)** 進行擴展。
- 對於外掛程式，始終在入口 PHP 檔案中包含標頭並防護直接執行。
- 使用獨特的字首或 PHP 命名空間以避免全域衝突。
- 將資產排入佇列；絕不在 PHP 模板中內聯原始的 `<script>`/`<style>`。
- 使面向使用者的字串可翻譯並載入正確的文本域。

### 最小外掛程式標頭與防護
```php
<?php
defined('ABSPATH') || exit;
/**
 * Plugin Name: Awesome Feature
 * Description: 範例外掛程式骨架。
 * Version: 0.1.0
 * Author: Example
 * License: GPL-2.0-or-later
 * Text Domain: awesome-feature
 * Domain Path: /languages
 */
```

## 2) 程式碼標準 (PHP, JS, CSS, HTML)
- 遵循 **WordPress 程式碼標準 (WPCS)** 並為公共 API 編寫 DocBlocks。
- PHP: 在適當情況下偏好嚴格比較 (`===`, `!==`)。根據 WPCS 保持陣列語法和間距的一致性。
- JS: 符合 WordPress JS 風格；對於區塊/編輯器程式碼，偏好 `@wordpress/*` 套件。
- CSS: 在有幫助時使用類似 BEM 的類別命名；避免過於特定的選擇器。
- PHP 7.4+ 相容模式，除非專案指定更高版本。避免使用目標 WP/PHP 版本不支援的功能。

### Linting 設定建議
```xml
<!-- phpcs.xml -->
<?xml version="1.0"?>
<ruleset name="Project WPCS">
  <description>此專案的 WordPress 程式碼標準。</description>
  <file>./</file>
  <exclude-pattern>vendor/*</exclude-pattern>
  <exclude-pattern>node_modules/*</exclude-pattern>
  <rule ref="WordPress"/>
  <rule ref="WordPress-Docs"/>
  <rule ref="WordPress-Extra"/>
  <rule ref="PHPCompatibility"/>
  <config name="testVersion" value="7.4-"/>
</ruleset>
```

```json
// composer.json (片段)
{
  "require-dev": {
    "dealerdirect/phpcodesniffer-composer-installer": "^1.0",
    "wp-coding-standards/wpcs": "^3.0",
    "phpcompatibility/php-compatibility": "^9.0"
  },
  "scripts": {
    "lint:php": "phpcs -p",
    "fix:php": "phpcbf -p"
  }
}
```

```json
// package.json (片段)
{
  "devDependencies": {
    "@wordpress/eslint-plugin": "^x.y.z"
  },
  "scripts": {
    "lint:js": "eslint ."
  }
}
```

## 3) 安全性與資料處理
- **輸出時逸出，輸入時淨化。**
  - 逸出: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()`。
  - 淨化: `sanitize_text_field()`, `sanitize_email()`, `sanitize_key()`, `absint()`, `intval()`。
- **表單、AJAX、REST 的功能與 Nonces**:
  - 使用 `wp_nonce_field()` 新增 Nonces 並透過 `check_admin_referer()` / `wp_verify_nonce()` 驗證。
  - 使用 `current_user_can( 'manage_options' /* 或特定功能 */ )` 限制變更。
- **資料庫:** 始終使用帶有佔位符的 `$wpdb->prepare()`；絕不串聯不受信任的輸入。
- **上傳:** 驗證 MIME/類型並使用 `wp_handle_upload()`/`media_handle_upload()`。

## 4) 國際化 (i18n)
- 使用您的文本域將使用者可見的字串包裝在翻譯函式中:
  - `__( 'Text', 'awesome-feature' )`, `_x()`, `esc_html__()`。
- 使用 `load_plugin_textdomain()` 或 `load_theme_textdomain()` 載入翻譯。
- 在 `/languages` 中保留一個 `.pot` 檔案並確保一致的域使用。

## 5) 效能
- 將繁重邏輯延遲到特定掛鉤；除非必要，否則避免在 `init`/`wp_loaded` 上執行昂貴的工作。
- 對於昂貴的查詢，使用暫存或物件快取；規劃失效。
- 僅將您需要的內容排入佇列，並有條件地 (前端與後端；特定畫面/路由)。
- 偏好分頁/參數化查詢，而非無限制的迴圈。

## 6) 管理員 UI 與設定
- 對於選項頁面，使用 **設定 API**；為每個設定提供 `sanitize_callback`。
- 對於表格，遵循 `WP_List_Table` 模式。對於通知，使用管理員通知 API。
- 避免直接 HTML 輸出複雜的 UI；偏好使用帶有逸出的模板或小型檢視輔助函式。

## 7) REST API
- 使用 `register_rest_route()` 註冊；始終設定 `permission_callback`。
- 透過 `args` 綱要驗證/淨化請求參數。
- 回傳 `WP_REST_Response` 或可清晰映射到 JSON 的陣列/物件。

## 8) 區塊與編輯器 (Gutenberg)
- 使用 `block.json` + `register_block_type()`；依賴 `@wordpress/*` 套件。
- 在需要時提供伺服器渲染回呼 (動態區塊)。
- E2E 測試應涵蓋：插入區塊 → 編輯 → 儲存 → 前端渲染。

## 9) 資產載入
```php
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'af-frontend',
    plugins_url('assets/frontend.css', __FILE__),
    [],
    '0.1.0'
  );

  wp_enqueue_script(
    'af-frontend',
    plugins_url('assets/frontend.js', __FILE__),
    [ 'wp-i18n', 'wp-element' ],
    '0.1.0',
    true
  );
});
```
- 如果多個元件依賴相同的資產，請先使用 `wp_register_style/script` 註冊。
- 對於管理員畫面，掛鉤到 `admin_enqueue_scripts` 並檢查畫面 ID。

## 10) 測試
### PHP 單元/整合
- 使用 **WordPress 測試套件** 搭配 `PHPUnit` 和 `WP_UnitTestCase`。
- 測試：淨化、功能檢查、REST 權限、資料庫查詢、掛鉤。
- 偏好使用工廠 (`self::factory()->post->create()` 等) 來設定測試夾具。

```xml
<!-- phpunit.xml.dist (最小) -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php" colors="true">
  <testsuites>
    <testsuite name="外掛程式測試套件">
      <directory suffix="Test.php">tests/</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

```php
// tests/bootstrap.php (最小草圖)
<?php
$_tests_dir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';
require_once $_tests_dir . '/includes/functions.php';
tests_add_filter( 'muplugins_loaded', function () {
  require dirname(__DIR__) . '/awesome-feature.php';
} );
require $_tests_dir . '/includes/bootstrap.php';
```
### E2E
- 使用 Playwright (或 Puppeteer) 進行編輯器/前端流程。
- 涵蓋基本使用者旅程和迴歸 (區塊插入、設定儲存、前端渲染)。

## 11) 文件與提交
- 保持 `README.md` 最新：安裝、使用方式、功能、掛鉤/過濾器和測試指示。
- 使用清晰、命令式的提交訊息；參考問題/票證並總結影響。

## 12) Copilot 必須確保的事項 (清單)
- ✅ 獨特的字首/命名空間；沒有意外的全域變數。  
- ✅ 任何寫入操作 (AJAX/REST/表單) 的 Nonce + 功能檢查。  
- ✅ 輸入已淨化；輸出已逸出。  
- ✅ 使用者可見字串已使用正確的文本域進行國際化。  
- ✅ 資產已透過 API 排入佇列 (沒有內聯腳本/樣式)。  
- ✅ 已為新行為新增/更新測試。  
- ✅ 程式碼通過 PHPCS (WPCS) 和 ESLint (如適用)。  
- ✅ 避免直接資料庫串聯；始終準備查詢。
