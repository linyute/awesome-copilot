---
name: 'create-canvas-extension'
description: '在 awesome-copilot 存放庫中建立或註冊畫布擴充功能。當被要求搭建新畫布擴充功能的基礎結構、建立其 plugin.json、將可重複使用的擴充功能新增至一或多個外掛程式，或移轉擴充功能中繼資料時使用。擴充功能是 extensions/ 下的可重複使用原始碼；可交付的外掛程式宣示說明則屬於 plugins/。'
argument-hint: '[選用的擴充功能名稱或說明]'
---

# 建立畫布擴充功能

僅在 `github/awesome-copilot` 存放庫中使用此技能。畫布擴充功能是可重複使用的原始碼元件。它們在 `extensions/` 下沒有 `plugin.json`。

## 必要決策

在建立檔案之前，請先詢問每個缺少的值：

1. **擴充功能 ID**：小寫 kebab-case，與原始碼資料夾和外掛程式名稱相符。
2. **顯示中繼資料**：
   - description (說明)
   - version (版本，預設為 `1.0.0`)
   - author (作者名稱與選用的 URL)
   - keywords (關鍵字，小寫、連字號分隔，最多 10 個)
   - repository 與 license (存放庫與授權，適當時預設為存放庫 URL 與 `MIT`)
3. **畫布進入點**：確認擴充功能是否已有 `extension.mjs`。如果沒有，僅在使用者提供足夠實作詳細資訊時才建立最簡進入點；否則建立目錄並留下明確的 TODO。
4. **預覽影像**：取得現有的 `assets/preview.png` 路徑或要求使用者新增。請勿虛構二進位影像或靜默使用具誤導性的預留位置。
5. **外掛程式註冊**：
   - 對於獨立可安裝的畫布外掛程式，建立 `plugins/<extension-id>`。
   - 對於屬於現有外掛程式的擴充功能，詢問父外掛程式 ID 並將 `./extensions/<extension-id>` 新增至該外掛程式的 `extensions.com.github.awesome-copilot.extensions`。
   - 如果擴充功能應由多個外掛程式交付，收集所有外掛程式 ID 並將相同的擴充功能 ID 新增至每個對應檔案。

## 要建立的檔案

對於新的擴充功能外掛程式，建立以下結構：

```text
extensions/<extension-id>/
├── extension.mjs
└── assets/
    └── preview.png

plugins/<extension-id>/
├── plugin.json
└── README.md
```

擴充功能原始碼可能包含額外檔案，例如 `package.json`、畫布資產或支援模組。將所有可重複使用的實作檔案保留在 `extensions/<extension-id>/` 下。

以以下形式建立 `plugins/<extension-id>/plugin.json`：

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "<extension-id>",
  "description": "<description>",
  "version": "1.0.0",
  "author": {
    "name": "<author>"
  },
  "repository": "https://github.com/github/awesome-copilot",
  "license": "MIT",
  "keywords": [
    "<keyword>"
  ],
  "extensions": {
    "com.github.copilot": {
      "logo": "assets/preview.png"
    },
    "com.github.awesome-copilot": {
      "extensions": [
        "./extensions/<extension-id>"
      ]
    }
  }
}
```

將 Agent Plugins 欄位保留在資訊清單的頂層。存放庫組成僅隸屬於 `extensions.com.github.awesome-copilot`；請勿將 `agents`、`commands`、`hooks` 或 `skills` 放在頂層或直接放在 `extensions` 下。MCP 伺服器應在外掛程式根目錄的 `mcp.json` 中宣告，絕不可放在 `plugin.json` 中。請勿新增 `x-awesome-copilot`、`standalone` 或其他存放庫專用的頂層欄位。

對於現有的父外掛程式，建立或更新：

```text
plugins/<parent-plugin>/plugin.json (`extensions.com.github.awesome-copilot.extensions`)
```

其 `extensions` 屬性必須包含已排序的存放庫相對路徑：

```json
{
  "extensions": [
    "./extensions/<extension-id>"
  ]
}
```

請勿將擴充功能原始碼複製到父外掛程式中。實體化會從根目錄 `extensions/` 解析 ID，因此相同的原始碼可由多個外掛程式搭售。

## 工作流程

1. 編輯前檢查存放庫：
   - 確認 `extensions/<extension-id>` 與 `plugins/<extension-id>` 尚未衝突
   - 檢查目標父外掛程式（如果有的話）
   - 檢查預覽影像與進入點是否已存在
2. 僅詢問上述決策中遺漏的必要問題。
3. 建立包含必要檔案的原始碼與外掛程式目錄。
4. 若要建立新的進入點，請保持精簡並清楚標記實作 TODO，而不是捏造行為。
5. 為每個應交付擴充功能的父外掛程式新增或更新 `extensions.com.github.awesome-copilot.extensions`。保持路徑依字母順序排序且唯一。
6. 確保不存在 `extensions/<extension-id>/.github/plugin/plugin.json`。
7. 執行：

   ```bash
   npm run plugin:validate
   npm run build
   npm run website:data
   ```

8. 回報建立的路徑、交付擴充功能的外掛程式，以及任何遺漏的使用者提供資產或 TODO。

## 現有擴充功能移轉

移轉現有擴充功能時：

1. 將其現有宣示說明移至 `plugins/<extension-id>/plugin.json`。
2. 將宣示說明更新為以命名空間為基礎的 `extensions.com.github.copilot.logo` 形式。
3. 從 `extensions/<extension-id>` 移除舊宣示說明。
4. 在任何父外掛程式的 `extensions.com.github.awesome-copilot.extensions` 中註冊擴充功能。
5. 執行上述驗證與建構命令。
