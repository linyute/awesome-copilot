---
mode: 'agent'
tools: ['changes', 'codebase', 'editFiles', 'problems']
description: '確保 C# 類型使用 XML 註解進行文件化，並遵循文件化的最佳實踐。'
---

# C# 文件化最佳實踐

- 公共成員應使用 XML 註解進行文件化。
- 鼓勵文件化內部成員，特別是如果它們複雜或不言自明。
- 使用 `<summary>` 描述方法。這應該是方法功能的簡要概述。
- 使用 `<param>` 描述方法參數。
- 使用 `<paramref>` 在文件中引用參數。
- 使用 `<returns>` 描述方法返回值。
- 使用 `<remarks>` 提供附加資訊，其中可以包括實作細節、使用注意事項或任何其他相關上下文。
- 使用 `<example>` 提供成員的使用範例。
- 使用 `<exception>` 文件化方法拋出的例外。
- 使用 `<see langword>` 描述語言特定的關鍵字，例如 `null`、`true`、`false`、`int`、`bool` 等。
- 使用 `<see cref>` 在行內（在句子中）引用其他類型或成員。
- 使用 `<seealso>` 在線上文件的「另請參閱」部分中獨立（不在句子中）引用其他類型或成員。
- 使用 `<inheritdoc/>` 從基類或介面繼承文件。
  - 除非有重大行為變更，在這種情況下您應該文件化差異。
- 使用 `<typeparam>` 描述泛型類型或方法中的類型參數。
- 使用 `<typeparamref>` 在文件中引用類型參數。
- 使用 `<c>` 描述行內程式碼片段。
- 使用 `<code>` 描述程式碼塊。`<code>` 標籤應放置在 `<example>` 標籤內。使用 `language` 屬性添加程式碼範例的語言，例如 `<code language="csharp">`。
