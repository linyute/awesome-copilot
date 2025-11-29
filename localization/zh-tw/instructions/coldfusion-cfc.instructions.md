---
description: 'CFC 元件與應用程式模式的 ColdFusion 程式碼標準'
applyTo: "**/*.cfc"
---

# CFC 檔案的 ColdFusion 程式碼標準

- 盡可能使用 CFScript 以獲得更簡潔的語法。
- 避免使用已棄用的標籤與函式。
- 遵循變數與元件的一致命名慣例。
- 使用 `cfqueryparam` 防止 SQL 注入。
- 在 `<cfoutput>` 區塊內使用 `##` 跳脫 CSS 雜湊符號。

# 其他最佳實務

- 適當時，對元件屬性與方法使用 `this` 範圍。
- 使用目的、參數與返回值文件化所有函式 (使用 Javadoc 或類似樣式)。
- 對函式與變數使用存取修飾符 (`public`、`private`、`package`、`remote`)。
- 偏好依賴注入以進行元件協作。
- 避免在 setter/getter 中使用業務邏輯；保持它們簡單。
- 在 public/remote 方法中驗證與淨化所有輸入參數。
- 根據需要，在方法內使用 `cftry`/`cfcatch` 進行錯誤處理。
- 避免在 CFC 中硬編碼配置或憑證。
- 使用一致的縮排 (2 個空格，依據全域標準)。
- 在元件內邏輯地分組相關方法。
- 對方法與屬性使用有意義、具描述性的名稱。
- 避免使用已棄用或不必要的 `cfcomponent` 屬性。

- 盡可能使用三元運算子
- 確保一致的 Tab 對齊。
