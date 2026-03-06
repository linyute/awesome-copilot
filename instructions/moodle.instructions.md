---
applyTo: '**/*.php, **/*.js, **/*.mustache, **/*.xml, **/*.css, **/*.scss'
description: 'GitHub Copilot 在 Moodle 專案內容中產生程式碼的指引。'
---

# 專案內容背景

此存放區包含一個 Moodle 專案。請確保產生的任何程式碼皆與此專案使用的特定 Moodle 版本相容 (例如：Moodle 3.11, 4.1 LTS 或更新版本)。

包含內容有：
- 外掛程式 (plugin) 開發 (local, block, mod, auth, enrol, tool 等)
- 佈景主題自定義
- CLI 指令碼
- 使用 Moodle API 與外部服務整合

# 程式碼標準

- 遵循官方 Moodle 程式碼撰寫指引：https://moodledev.io/general/development/policies/codingstyle
- PHP 必須與核心版本相容 (例如：PHP 7.4 / 8.0 / 8.1)。
- 如果會破壞相容性，請不要使用核心不支援的現代語法。
- 類別命名必須使用 Moodle 命名空間。
- 遵循 Moodle 的標準外掛程式目錄配置 (例如：classes/output, classes/form, db/, lang/, templates/…)。
- 強制使用 Moodle 安全函式：
  - 使用帶有 SQL 預留位置的 `$DB`
  - `require_login()`, `require_capability()`
  - 使用 `required_param()` / `optional_param()` 處理參數

# 程式碼產生規則

- 在外掛程式中建立新的 PHP 類別時，請使用與外掛程式元件名稱相符的 Moodle 元件 (Frankenstyle) 命名空間，例如：`local_myplugin`、`mod_forum`、`block_mycatalog`、`tool_mytool`。
- 在外掛程式中，務必遵守以下結構：
  - /db
  - /lang
  - /classes
  - /templates
  - /version.php
  - /settings.php
  - /lib.php (僅在必要時)

- 針對 HTML 使用渲染器 (renderers) 和 Mustache 範本。不要將 HTML 混入 PHP 中。
- 在 JavaScript 程式碼中，使用 AMD 模組，而非內嵌指令碼 (inline scripts)。
- 盡可能優先使用 Moodle API 函式，而非手寫程式碼。
- 不要發明不存在的 Moodle 函式。

# Copilot 應能回答的範例

- 「產生一個包含 version.php、settings.php 和 lib.php 的基礎本機外掛程式。」
- 「在 db/install.xml 中建立一個新資料表，並在 db/upgrade.php 中建立升級指令碼。」
- 「使用 moodleform 產生一個 Moodle 表單。」
- 「建立一個使用 Mustache 顯示資料表的渲染器。」

# 預期風格

- 在 Moodle 內容背景下提供清晰且具體的答案。
- 務必包含具備完整路徑的檔案。
- 若有多種實作方式，請使用 Moodle 推薦的方法。
