---
description: 'ColdFusion cfm 檔案和應用程式模式'
applyTo: "**/*.cfm"
---

# ColdFusion 編碼標準

- 盡可能使用 CFScript 以獲得更簡潔的語法。
- 避免使用已棄用的標籤和函式。
- 遵循變數和元件的一致命名慣例。
- 使用 `cfqueryparam` 防止 SQL 注入。
- 在 `<cfoutput>` 區塊內使用 `##` 轉義 CSS 雜湊符號。
- 在 `<cfoutput>` 區塊內使用 HTMX 時，請使用雙雜湊符號 (##) 轉義雜湊符號 (#)，以防止意外的變數插值。
- 如果您在 HTMX 目標檔案中，請確保第一行是：`<cfsetting showDebugOutput = "false">`

# 其他最佳實踐

- 使用 `Application.cfc` 進行應用程式設定和請求處理。
- 將程式碼組織成可重用的 CFC（元件）以維護。
- 驗證和清理所有使用者輸入。
- 使用 `cftry`/`cfcatch` 進行錯誤處理和日誌記錄。
- 避免在原始檔案中硬編碼憑證或敏感資料。
- 使用一致的縮排（2 個空格，依據全域標準）。
- 註解複雜邏輯並記錄函式的目的和參數。
- 偏好使用 `cfinclude` 共享模板，但避免循環包含。

- 盡可能使用三元運算子
- 確保一致的 Tab 對齊。
