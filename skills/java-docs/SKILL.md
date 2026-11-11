---
name: 'java-docs'
description: '確保 Java 型別已具備 Javadoc 註解記錄，並遵循文件的最佳做法。'
---

# Java 文件 (Javadoc) 最佳做法

## 原則

- 僅記錄程式碼實際執行的內容：先閱讀實作、呼叫端與測試。絕不捏造未經驗證的行為、閾值、執行緒安全、可為 null 性或例外狀況；若不確定，請省略或詢問。
- 保留專案現有的文件風格（語言、標籤順序、註解形式 `/** */` 與 `///`）。除非使用者要求，否則不要重寫現有註解或對程式碼庫進行大規模文件化；將變更限制在請求範圍內。
- 在使用較新功能之前檢查 JDK 等級 (`maven.compiler.release`, 工具鏈, `java -version`)，並保持在其範圍內。

## 慣例

- `@since` 僅標註引入該 API 的真實版本；`@deprecated` 需附帶原因與替代方案，並與 `@Deprecated` 一併使用。
- 僅在專案已使用時才使用 `@author` 與 `@version`。
- 程式碼區塊，依 JDK 等級而定：
  - 任何 JDK：`<pre>{@code ... }</pre>`（行首的 `@` 需跳脫，括號需對稱）。
  - JDK 18+：行內程式碼使用 `{@snippet :  ... }`，或範例檔案放置於 `snippet-files/` 的 `{@snippet file="Example.java" region="demo"}`（範例優先選用；`javadoc` 不會編譯或驗證 snippet 原始碼，因此若需要此保證，請在獨立的建置/測試原始碼集中編譯與測試該檔案）。視需要使用 `// @highlight substring="x"` 與 `// @replace` 標記。
  - 僅限 JDK 23+ (JEP 467)：使用 `///` 的 Markdown 文件註解，使用 `[Type#member]` 建立連結與圍欄程式碼區塊。僅在專案已使用或使用者要求，且組建執行 JDK 23+ `javadoc` 時使用。

## 驗證

- 執行 `mvn -q javadoc:javadoc`（或 `./gradlew javadoc`），針對單一檔案執行 `javadoc -Xdoclint:all -d target/javadoc-check <files>`；修正您引入的每個警告/錯誤（缺少 `@param`、錯誤的 HTML、未解析的 `{@link}`、未知的標籤）。
- 回報記錄了哪些內容與執行的命令；陳述任何無法從程式碼中驗證的主張。
