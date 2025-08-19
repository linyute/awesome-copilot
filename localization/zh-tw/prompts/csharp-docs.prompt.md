---
mode: 'agent'
tools: ['changes', 'codebase', 'editFiles', 'problems']
description: '確保 C# 型別以 XML 註解文件化，並遵循文件最佳實踐。'
---

# C# 文件最佳實踐

- 公開成員應以 XML 註解文件化。
- 也建議對內部成員進行文件化，特別是複雜或不易理解者。
- 方法描述請使用 `<summary>`，簡要說明方法用途。
- 方法參數請使用 `<param>`。
- 方法回傳值請使用 `<returns>`。
- 其他補充資訊請使用 `<remarks>`，可包含實作細節、使用說明或其他相關內容。
- 使用 `<example>` 提供成員的使用範例。
- 方法可能拋出的例外請使用 `<exception>` 文件化。
- 參考其他型別或成員請使用 `<see>` 與 `<seealso>`。
- 若需繼承基底類別或介面的文件，請使用 `<inheritdoc/>`。
  - 除非行為有重大變更，否則應文件化差異。
- 泛型型別或方法的型別參數請使用 `<typeparam>`。
- 文件中引用型別參數請使用 `<typeparamref>`。
- 行內程式碼片段請使用 `<c>`。
- 程式碼區塊請使用 `<code>`。
- 語言特定保留字如 `null`、`true`、`false`、`int`、`bool` 等請使用 `<see langword>`。
