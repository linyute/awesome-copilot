---
applyTo: 'wp-content/plugins/**,wp-content/themes/**,**/*.php,**/*.inc,**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.css,**/*.scss,**/*.json'
description: 'WordPress 外掛程式與佈景主題的編碼、安全性與測試規則'
---

# WordPress 開發 — Copilot 指引

**目標：** 產生安全、高效、可測試且符合 WordPress 官方實務的 WordPress 程式碼。偏好使用 hooks、小型函式、相依性注入（合理情況下）以及明確的關注點分離。

## 1) 核心原則
- 切勿修改 WordPress 核心。透過 **actions** 與 **filters** 進行擴充。
- 針對外掛程式，請務必在入口 PHP 檔案中包含標頭並防範直接執行。
- 使用唯一前綴或 PHP 命名空間以避免全域衝突。
- 排隊載入（Enqueue）素材；切勿在 PHP 範本中內嵌原始 `<script>`/`<style>`。
- 使面向使用者的字串可翻譯，並載入正確的 text domain。

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

## 2) 編碼標準 (PHP, JS, CSS, HTML)
- 遵循 **WordPress 編碼標準 (WPCS)** 並為公開 API 撰寫 DocBlocks。
- PHP：在適當處偏好嚴格比較（`===`、`!==`）。依據 WPCS 保持陣列語法與間距的一致性。
- JS：符合 WordPress JS 風格；針對區塊／編輯器程式碼偏好使用 `@wordpress/*` 套件。
- CSS：在有幫助時使用類似 BEM 的類別命名；避免特異性過高的選取器。
- 相容 PHP 7.4+ 的模式，除非專案指定更高版本。避免使用目標 WP/PHP 版本不支援的功能。

### Linting 設定建議
```xml
<?xml version="1.0"?>
<!-- phpcs.xml -->
<ruleset name="Project WPCS">
  <description>WordPress Coding Standards for this project.</description>
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

`composer.json`（程式碼片段）：

```json
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

`package.json`（程式碼片段）：

```json
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
- **輸出時逸出（Escape），輸入時淨化（Sanitize）。**
  - 逸出：`esc_html()`、`esc_attr()`、`esc_url()`、`wp_kses_post()`。
  - 淨化：`sanitize_text_field()`、`sanitize_email()`、`sanitize_key()`、`absint()`、`intval()`。
- 針對表單、AJAX、REST 使用 **權限（Capabilities）與 Nonces**：
  - 使用 `wp_nonce_field()` 新增 nonce，並透過 `check_admin_referer()` / `wp_verify_nonce()` 驗證。
  - 使用 `current_user_can( 'manage_options' /* 或特定權限 */ )` 限制變更操作。
- **資料庫：** 務必使用帶有佔位符的 `$wpdb->prepare()`；切勿串接不受信任的輸入。
- **上傳：** 驗證 MIME／類型，並使用 `wp_handle_upload()`/`media_handle_upload()`。

## 4) 國際化 (i18n)
- 使用帶有您的 text domain 的翻譯函式包裝使用者可見的字串：
  - `__( 'Text', 'awesome-feature' )`、`_x()`、`esc_html__()`。
- 針對 WordPress.org 外掛程式，依賴自 WordPress 4.6 以來的 WordPress 自動翻譯載入。若支援較舊的 WordPress 需要 `load_plugin_textdomain()`，請在 `init` 時呼叫。
- 在 `/languages` 中保留 `.pot` 並確保 domain 使用一致。除非特定 WordPress.org 需求有所規定，否則切勿發布開發用或已編譯的翻譯產物（例如 `.po`、`.mo`、`.l10n.php` 或已編譯的 `.json` 檔案）。

## 5) 效能
- 將繁重邏輯推遲至特定 hooks；除非必要，避免在 `init`/`wp_loaded` 執行高耗能工作。
- 針對高耗能查詢使用 transients 或物件快取；規劃失效機制。
- 僅排隊載入所需項目並採用條件式載入（前端對比後端管理；特定畫面／路由）。
- 偏好分頁／參數化查詢而非無限制的迴圈。

## 6) 管理員 UI 與設定
- 針對選項頁面使用 **Settings API**；為每個設定提供 `sanitize_callback`。
- 針對表格，遵循 `WP_List_Table` 模式。針對提示訊息，使用管理員提示 API。
- 針對複雜 UI 避免直接 echo HTML；偏好範本或帶有逸出處理的小型檢視表輔助程式。

## 7) REST API
- 使用 `register_rest_route()` 註冊；務必設定 `permission_callback`。
- 透過 `args` 結構描述驗證／淨化請求引數。
- 傳回 `WP_REST_Response` 或可乾淨對應至 JSON 的陣列／物件。

## 8) 區塊與編輯器 (Gutenberg)
- 使用 `block.json` + `register_block_type()`；依賴 `@wordpress/*` 套件。
- 需要時提供伺服器端轉譯回呼（動態區塊）。
- 端對端測試應涵蓋：插入區塊 → 編輯 → 儲存 → 前端轉譯。

## 9) 素材載入 (Asset Loading)
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
- 若多個元件依賴相同素材，先使用 `wp_register_style/script` 註冊。
- 針對管理員畫面，掛鉤至 `admin_enqueue_scripts` 並檢查畫面識別碼。

## 10) 測試
### PHP 單元／整合測試
- 使用帶有 `PHPUnit` 與 `WP_UnitTestCase` 的 **WordPress 測試套件**。
- 測試：淨化、權限檢查、REST 權限、資料庫查詢、hooks。
- 偏好使用 factories（`self::factory()->post->create()` 等）建立測試資料（fixtures）。

```xml
<!-- phpunit.xml.dist (最小設定) -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/bootstrap.php" colors="true">
  <testsuites>
    <testsuite name="Plugin Test Suite">
      <directory suffix="Test.php">tests/</directory>
    </testsuite>
  </testsuites>
</phpunit>
```

```php
// tests/bootstrap.php (最小草稿)
<?php
$_tests_dir = getenv('WP_TESTS_DIR') ?: '/tmp/wordpress-tests-lib';
require_once $_tests_dir . '/includes/functions.php';
tests_add_filter( 'muplugins_loaded', function () {
  require dirname(__DIR__) . '/awesome-feature.php';
} );
require $_tests_dir . '/includes/bootstrap.php';
```
### 端對端測試 (E2E)
- 使用 Playwright（或 Puppeteer）進行編輯器／前端流程測試。
- 涵蓋基本使用者旅程與回歸（區塊插入、設定儲存、前端轉譯）。

## 11) 文件與認可 (Commits)
- 保持 `README.md` 最新狀態：安裝、用法、權限、hooks/filters 與測試指引。
- 使用清楚、祈使句的認可訊息；參照 issues/tickets 並摘要影響。

<!-- markdownlint-disable MD013 -->

## 12) WordPress.org 目錄審查

- 為每個全域符號與持久性識別碼加上至少四個字元的專屬外掛程式前綴：函式、類別、介面、traits、常數、命名空間、選項、transients、metadata、hooks、shortcodes、cron 事件、指令碼／樣式控制代碼以及在地化 JavaScript 物件名稱。切勿使用 `wp_`、`_`、`__` 或通用前綴（如 `ai`、`seo`、`wc` 或 `woo`）。切勿使用 `function_exists()` 或 `class_exists()` 防護來隱藏命名衝突；請保留給真正共用的函式庫。遷移重新命名的選項鍵，讓現有安裝能保留其設定。
- 在帶有前綴的常數中從 `__FILE__` 定義主要外掛程式檔案、目錄與 URL；將版本保留在外掛程式標頭中，並視需要透過帶前綴的常數公開。切勿使用 `WP_PLUGIN_DIR`、`WP_CONTENT_DIR`、`WP_CONTENT_URL`、`WPMU_PLUGIN_DIR` 或寫死路徑來尋找外掛程式檔案。在執行階段使用 `wp_upload_dir()` 解析上傳儲存位置。
- 適當情況下將資料儲存在資料庫或媒體庫中。若必須使用檔案系統儲存，請僅寫入執行階段上傳目錄內的特定外掛程式目錄下、保護非公開檔案、使用 `sanitize_file_name( basename( $path ) )` 淨化使用者提供的基本名稱，並使用 `WP_Filesystem`。切勿寫入外掛程式、佈景主題、核心或其他外掛程式的目錄，或任意使用者提供的路徑。
- 在發行封存中僅隨附正式環境檔案。使用 `.distignore` 或 10up 忽略清單排除開發工具、`node_modules`、測試、展示、快取、CI metadata、發行指令碼與編譯後的翻譯。從乾淨、最好是 `--no-dev` 的相依性樹以 `wp dist-archive` 建構，並檢查產生的 ZIP 而非工作樹。
- 保持隨附的第三方函式庫為當前穩定發行版本，並驗證發行封存中所包含的版本。當審查需要可讀原始碼時，切勿隨附經過混淆或僅最小化的程式碼。
- 切勿在 WordPress.org 託管的外掛程式中隨附自我更新檢查程式或連線至外部更新端點。移除指向 WordPress.org 以外的 `Update URI` 值，並依賴目錄更新程式。
- 每個 `register_setting()` 呼叫都必須指定 `sanitize_callback`。針對陣列與巢狀值使用專用回呼；純量淨化器不足以處理結構化選項。
- 在 `readme.txt` 中，使 `Contributors:` 成為區分大小寫、以逗號分隔的真實 WordPress.org 使用者名稱列表，並包含擁有該外掛程式代稱（slug）的帳號。
- 切勿對可執行內容或樣式表內容使用原始 `<script>` 或 `<style>` 標籤。使用 WordPress API 排隊載入檔案、使用 `wp_add_inline_script()` 或 `wp_add_inline_style()` 附加內聯內容，並針對管理員畫面使用 `admin_enqueue_scripts`。非執行資料佔位符必須提出合理解釋並進行逸出處理。
- 在輸出點使用最符合情境的窄範圍函式逸出每個動態值：URL 使用 `esc_url()`、屬性使用 `esc_attr()`、文字使用 `esc_html()`，允許的 HTML 使用 `wp_kses()` 或 `wp_kses_post()`。切勿在沒有特定 `--` 理由的情況下抑制逸出檢查。
- 當暗示關聯時，避免在外掛程式名稱或代稱中使用商標與其他專案名稱。以真正獨特的名稱開頭；若引用第三方服務，請明確說明無附屬關係。
- 針對每個遠端服務，在 `readme.txt` 中揭露使用了什麼服務、為何使用、傳送了什麼資料、何時傳送，以及其服務條款與隱私權政策的連結。未經明確同意切勿追蹤使用者、載入遠端程式碼或劫持管理員儀表板。
- 驗證 `readme.txt` 中的 `Plugin URI`、`Author URI` 以及存放庫、文件、條款與隱私權 URL 為公開且可成功解析。移除失效或私有連結。
- 保持 `readme.txt` 正確且完整：包含 `Stable tag`、`Requires at least`、`Requires PHP`、`Tested up to`、`License`、`License URI`、清楚的設定與使用步驟，以及安裝路徑中目前的外掛程式代稱。

### WordPress.org 自我稽核

```bash
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "function |^[[:space:]]*((abstract|final|readonly)[[:space:]]+)*(class|trait|interface|enum)[[:space:]]|namespace |define\(|const |^[[:space:]]*global[[:space:]]" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "(add|get|update|delete)_option\(|(add|get|update|delete)_site_option\(|(get|update|delete)_network_option\(|(set|get|delete)_transient\(|(set|get|delete)_site_transient\(" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "register_meta\(|(add|get|update|delete)_(post|user|term|comment)_meta\(|add_shortcode\(|wp_schedule_(single_)?event\(|wp_next_scheduled\(|wp_clear_scheduled_hook\(" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "do_action\(|apply_filters\(|add_action\(|add_filter\(|wp_(register|enqueue)_(script|style)\(|wp_localize_script\(|wp_set_script_translations\(|wp_add_inline_(script|style)\(" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "WP_PLUGIN_DIR|WP_CONTENT_DIR|WP_CONTENT_URL|WPMU_PLUGIN_DIR|ABSPATH|__DIR__" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "file_put_contents|fopen|fwrite|fputs|mkdir|unlink|rename\(|copy\(" .
grep -rniE --exclude-dir=vendor --exclude-dir=node_modules "plugin-?update-?checker|PucFactory|pre_set_site_transient_update_plugins|puc_" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "wp_remote_|curl_|file_get_contents\('https?://|https?://" .
grep -rnE --include='*.php' --exclude-dir=vendor --exclude-dir=node_modules "<script|<style" .
grep -rn --exclude-dir=vendor --exclude-dir=node_modules "load_plugin_textdomain\|phpcs:ignore\|phpcs:disable" .
grep -rnE "^(Stable tag|Requires at least|Requires PHP|Tested up to|License|License URI|Contributors):" readme.txt
find . -type f \( -name '*.po' -o -name '*.mo' -o -name '*.l10n.php' -o -name 'phpunit.xml*' -o -name '*.phpunit*' -o -name '*.result.cache' \)
./vendor/bin/phpcs --standard=phpcs.xml .
wp plugin check my-plugin
wp dist-archive . my-plugin.zip
unzip -l my-plugin.zip
```

這些命令是起點而非完整的字首檢查：它們會顯示宣告與註冊／存取呼叫位置（選項、站台／網路選項、transients、metadata、shortcodes、cron 事件、hooks、素材控制代碼與在地化指令碼物件），但您仍必須閱讀每個符合的行以確認實際的選項鍵、hook/shortcode/cron 字串名稱、指令碼／樣式控制代碼與在地化 JavaScript 物件名稱均帶有前綴。審查每個符合項目，切勿將本機無警告視為核准，並檢查實際封存檔是否有不需要的檔案與過期的隨附相依性。

## 13) Copilot 必須確保的事項 (檢查清單)

- ✅ 唯一的前綴／命名空間；無意外的全域變數。  
- ✅ 任何寫入操作（AJAX/REST/表單）皆具備 Nonce + 權限檢查。  
- ✅ 輸入已淨化；輸出已逸出。  
- ✅ 使用者可見字串已使用正確的 text domain 包裝於 i18n 中。  
- ✅ 素材透過 API 排隊載入（無內聯 script/style）。  
- ✅ 針對新行為新增／更新測試。  
- ✅ 程式碼通過 PHPCS (WPCS) 與 ESLint（適用時）。  
- ✅ 避免直接串接資料庫查詢；務必 prepare 查詢。
- ✅ WordPress.org metadata、公開 URL、貢獻者擁有權與外部服務揭露均正確無誤。
- ✅ 發行封存僅包含正式環境檔案，且無自我更新檢查程式或未經審查的隨附函式庫。
- ✅ 檔案系統寫入限制在核准的執行階段位置，且所有設定皆具有淨化回呼。

<!-- markdownlint-enable MD013 -->
