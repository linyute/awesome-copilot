---
mode: 'agent'
tools: ['changes', 'search/codebase', 'edit/editFiles', 'problems']
description: '確保 Java 型別皆有 Javadoc 註解，並遵循最佳文件化實踐。'
---

# Java 文件（Javadoc）最佳實踐

- 公開與受保護成員需撰寫 Javadoc 註解。
- 建議複雜或不易理解的 package-private 與 private 成員也加註解。
- Javadoc 註解首句為摘要描述，需簡明扼要說明方法用途並以句號結尾。
- 方法參數使用 `@param`，描述以小寫字母開頭且不加句號。
- 回傳值使用 `@return`。
- 方法丟出例外使用 `@throws` 或 `@exception`。
- 參考其他型別或成員使用 `@see`。
- 使用 `{@inheritDoc}` 繼承基底類別或介面文件。
  - 若有重大行為差異，需補充說明。
- 泛型型別或方法參數使用 `@param <T>`。
- 內嵌程式碼片段使用 `{@code}`。
- 程式碼區塊使用 `<pre>{@code ... }</pre>`。
- 新增功能請加上 `@since`（如版本號）。
- 使用 `@version` 標註成員版本。
- 使用 `@author` 標註程式作者。
- 若成員已棄用，請加上 `@deprecated` 並提供替代方案。
