---
agent: "agent"
description: "撰寫一個程式碼標準文件，該文件使用作為參數傳遞給提示的檔案和/或資料夾中的程式碼樣式。"
tools: ['createFile', 'editFiles', 'fetch', 'githubRepo', 'search', 'testFailure']
---

# 從檔案撰寫程式碼標準

使用現有檔案的語法來建立專案的標準和樣式指南。如果傳遞了多個檔案或一個資料夾，則遍歷資料夾中的每個檔案，將檔案的資料附加到臨時記憶體或檔案中，然後在完成時將臨時資料作為單一實例使用；就像它是作為標準和樣式指南基礎的檔案名稱一樣。

## 規則和配置

以下是一組準配置的 `boolean` 和 `string[]` 變數。處理 `true` 或每個變數的其他值的條件在二級標題 `## 變數和參數配置條件` 下。

提示的參數具有文字定義。有一個必需的參數 **`${fileName}`**，以及幾個可選參數 **`${folderName}`**、**`${instructions}`** 和任何 **`[configVariableAsParameter]`**。

### 配置變數

* addStandardsTest = false;
* addToREADME = false;
* addToREADMEInsertions = ["atBegin", "middle", "beforeEnd", "bestFitUsingContext"];
  - 預設為 **beforeEnd**。
* createNewFile = true;
* fetchStyleURL = true;
* findInconsistencies = true;
* fixInconsistencies = true;
* newFileName = ["CONTRIBUTING.md", "STYLE.md", "CODE_OF_CONDUCT.md", "CODING_STANDARDS.md", "DEVELOPING.md", "CONTRIBUTION_GUIDE.md", "GUIDELINES.md", "PROJECT_STANDARDS.md", "BEST_PRACTICES.md", "HACKING.md"];
  - 對於 `${newFileName}` 中的每個檔案，如果檔案不存在，則使用該檔案名稱並 `break`，否則繼續下一個 `${newFileName}` 中的檔案名稱。
* outputSpecToPrompt = false;
* useTemplate = "verbose"; // 或 "v"
  - 可能的值為 `[["v", "verbose"], ["m", "minimal"], ["b", "best fit"], ["custom"]]`。
  - 選擇提示檔案底部二級標題 `## 程式碼標準範本` 下的兩個範例範本之一，或使用更合適的其他組合。
  - 如果是 **custom**，則按請求套用。

### 作為提示參數的配置變數

如果任何變數名稱按原樣或作為相似但明顯相關的文字值傳遞給提示，則使用傳遞給提示的值覆蓋預設變數值。

### 提示參數

* **fileName** = 將被分析的檔案名稱，分析內容包括：縮排、變數命名、註釋、條件程序、函式（function）程序以及檔案程式碼（code）語言的其他語法相關資料（data）。
* folderName = 將用於從多個檔案中提取資料（data）到一個聚合資料集中的資料夾名稱，該資料集將被分析的內容包括：縮排、變數命名、註釋、條件程序、函式（function）程序以及檔案程式碼（code）語言的其他語法相關資料（data）。
* instructions = 將為獨特案例提供的額外指令、規則和程序。
* [configVariableAsParameter] = 如果傳遞，將覆蓋配置 `${useTemplate}` 的預設狀態。範例（example）：
  - useTemplate = 如果傳遞，將覆蓋配置 `${useTemplate}` 預設值。值為 `[["v", "verbose"], ["m", "minimal"], ["b", "best fit"]]`。

#### 必需和可選參數

* **fileName** - 必需
* folderName - *可選*
* instructions - *可選*
* [configVariableAsParameter] - *可選*

## 變數和參數配置條件

### `${fileName}.length > 1 || ${folderName} != undefined`

* 如果為 true，將 `${fixInconsistencies}` 切換為 false。

### `${addToREADME} == true`

* 將程式碼標準插入到 `README.md` 中，而不是輸出到提示或建立新檔案。
* 如果為 true，將 `${createNewFile}` 和 `${outputSpecToPrompt}` 都切換為 false。

### `${addToREADMEInsertions} == "atBegin"`

* 如果 `${addToREADME}` 為 true，則在 `README.md` 檔案的標題之後，將程式碼標準資料插入到 **開頭**。

### `${addToREADMEInsertions} == "middle"`

* 如果 `${addToREADME}` 為 true，則將程式碼標準資料插入到 `README.md` 檔案的 **中間**，將標準標題更改為與 `README.md` 組合相匹配。

### `${addToREADMEInsertions} == "beforeEnd"`

* 如果 `${addToREADME}` 為 true，則將程式碼標準資料插入到 `README.md` 檔案的 **結尾**，在最後一個字元後插入一個新行，然後在新行上插入資料。

### `${addToREADMEInsertions} == "bestFitUsingContext"`

* 如果 `${addToREADME}` 為 true，則根據 `README.md` 組合的上下文和資料（data）流，將程式碼標準資料插入到 `README.md` 檔案的 **最合適的行**。

### `${addStandardsTest} == true`

* 一旦程式碼標準檔案完成，撰寫一個測試檔案以確保傳遞給它的檔案符合程式碼標準。

### `${createNewFile} == true`

* 使用來自 `${newFileName}` 的值或其中一個可能的值建立一個新檔案。
* 如果為 true，將 `${outputSpecToPrompt}` 和 `${addToREADME}` 都切換為 false。

### `${fetchStyleURL} == true`

* 此外，使用從三級標題 `### 擷取連結` 下巢狀連結擷取的資料（data）作為上下文，為新檔案、提示或 `README.md` 建立標準、規範和樣式資料。
* 對於 `### 擷取連結` 中的每個相關項目，執行 `#fetch ${item}`。

### `${findInconsistencies} == true`

* 評估與縮排、換行、註釋、條件和函式（function）巢狀、字串的引號包裝器（即 `'` 或 `"`）等相關的語法，並進行分類。
* 對於每個類別，進行計數，如果一個項目與大多數計數不匹配，則提交到臨時記憶體。
* 根據 `${fixInconsistencies}` 的狀態，要麼編輯並修復低計數類別以匹配大多數，要麼將儲存（store）在臨時記憶體中的不一致性輸出到提示。

### `${fixInconsistencies} == true`

* 編輯並修復語法資料（data）的低計數類別，以匹配大多數對應的語法資料（data），使用儲存（store）在臨時記憶體中的不一致性。

### `typeof ${newFileName} == "string"`

* 如果明確定義為 `string`，則使用來自 `${newFileName}` 的值建立一個新檔案。

### `typeof ${newFileName} != "string"`

* 如果 **不是** 明確定義為 `string`，而是 `object` 或陣列，則使用來自 `${newFileName}` 的值建立一個新檔案，方法是套用此規則：
  - 對於 `${newFileName}` 中的每個檔案名稱，如果檔案不存在，則使用該檔案名稱並 `break`，否則繼續下一個。

### `${outputSpecToPrompt} == true`

* 將程式碼標準輸出到提示，而不是建立檔案或新增到 README。
* 如果為 true，將 `${createNewFile}` 和 `${addToREADME}` 都切換為 false。

### `${useTemplate} == "v" || ${useTemplate} == "verbose"`

* 在組合程式碼標準的資料（data）時，使用三級標題 `### "v", "verbose"` 下的資料（data）作為指導範本。

### `${useTemplate} == "m" || ${useTemplate} == "minimal"`

* 在組合程式碼標準的資料（data）時，使用三級標題 `### "m", "minimal"` 下的資料（data）作為指導範本。

### `${useTemplate} == "b" || ${useTemplate} == "best"`

* 根據從 `${fileName}` 提取的資料（data），使用三級標題 `### "v", "verbose"` 或 `### "m", "minimal"` 下的資料（data），並使用最合適的作為組合程式碼標準資料（data）時的指導範本。

### `${useTemplate} == "custom" || ${useTemplate} == "<ANY_NAME>"`

* 使用傳遞的自訂提示、指令、範本或其他資料（data）作為組合程式碼標準資料（data）時的指導範本。

## **if** `${fetchStyleURL} == true`

根據程式語言，對於下面列表中的每個連結，執行 `#fetch (URL)`，如果程式語言是 `${fileName} == [<Language> Style Guide]`。

### 擷取連結

- [C Style Guide](https://users.ece.cmu.edu/~eno/coding/CCodingStandard.html)
- [C# Style Guide](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [C++ Style Guide](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
- [Go Style Guide](https://github.com/golang-standards/project-layout)
- [Java Style Guide](https://coderanch.com/wiki/718799/Style)
- [AngularJS App Style Guide](https://github.com/mgechev/angularjs-style-guide)
- [jQuery Style Guide](https://contribute.jquery.org/style-guide/js/)
- [JavaScript Style Guide](https://www.w3schools.com/js/js_conventions.asp)
- [JSON Style Guide](https://google.github.io/styleguide/jsoncstyleguide.xml)
- [Kotlin Style Guide](https://kotlinlang.org/docs/coding-conventions.html)
- [Markdown Style Guide](https://cirosantilli.com/markdown-style-guide/)
- [Perl Style Guide](https://perldoc.perl.org/perlstyle)
- [PHP Style Guide](https://phptherightway.com/)
- [Python Style Guide](https://peps.python.org/pep-0008/)
- [Ruby Style Guide](https://rubystyle.guide/)
- [Rust Style Guide](https://github.com/rust-lang/rust/tree/HEAD/src/doc/style-guide/src)
- [Swift Style Guide](https://www.swift.org/documentation/api-design-guidelines/)
- [TypeScript Style Guide](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Visual Basic Style Guide](https://en.wikibooks.org/wiki/Visual_Basic/Coding_Standards)
- [Shell Script Style Guide](https://google.github.io/styleguide/shellguide.html)
- [Git Usage Style Guide](https://github.com/agis/git-style-guide)
- [PowerShell Style Guide](https://github.com/PoshCode/PowerShellPracticeAndStyle)
- [CSS](https://cssguidelin.es/)
- [Sass Style Guide](https://sass-guidelin.es/)
- [HTML Style Guide](https://github.com/marcobiedermann/html-style-guide)
- [Linux kernel Style Guide](https://www.kernel.org/doc/html/latest/process/coding-style.html)
- [Node.js Style Guide](https://github.com/felixge/node-style-guide)
- [SQL Style Guide](https://www.sqlstyle.guide/)
- [Angular Style Guide](https://angular.dev/style-guide)
- [Vue Style Guide](https://vuejs.org/style-guide/rules-strongly-recommended.html)
- [Django Style Guide](https://docs.djangoproject.com/en/dev/internals/contributing/writing-code/coding-style/)

## 程式碼標準範本

### `"m", "minimal"`

```text
    ```markdown
    ## 1. 簡介
    *   **目的：** 簡要說明建立程式碼標準的原因（例如，提高程式碼（code）品質、可維護性和團隊協作）。
    *   **範圍：** 定義此規範適用於哪些語言、專案或模組。

    ## 2. 命名慣例
    *   **變數：** `camelCase`
    *   **函式（function）/方法：** `PascalCase` 或 `camelCase`。
    *   **類別（class）/結構：** `PascalCase`。
    *   **常數：** `UPPER_SNAKE_CASE`。

    ## 3. 格式化和樣式
    *   **縮排：** 每個縮排使用 4 個空格（或 tab）。
    *   **行長度：** 將行限制為最大 80 或 120 個字元。
    *   **大括號：** 使用「K&R」樣式（開頭大括號在同一行）或「Allman」樣式（開頭大括號在新行）。
    *   **空行：** 指定用於分隔邏輯程式碼（code）區塊的空行數。

    ## 4. 註釋
    *   **文件字串/函式（function）註釋：** 描述函式（function）的目的、參數和回傳值。
    *   **行內註釋：** 解釋複雜或不明顯的邏輯。
    *   **檔案標頭：** 指定檔案標頭中應包含哪些資訊（information），例如作者、日期和檔案描述。

    ## 5. 錯誤處理
    *   **一般：** 如何處理和記錄錯誤。
    *   **細節：** 使用哪些例外類型，以及錯誤訊息中應包含哪些資訊（information）。

    ## 6. 最佳實踐和反模式
    *   **一般：** 列出要避免的常見反模式（例如，全域（global）變數、魔術數字）。
    *   **特定語言：** 基於專案程式碼（code）語言的具體建議。

    ## 7. 範例（example）
    *   提供一個小的程式碼（code）範例（example），演示規則的正確套用。
    *   提供一個小的程式碼（code）範例（example），演示不正確的實作以及如何修復它。

    ## 8. 貢獻和執行
    *   解釋如何執行標準（例如，透過程式碼（code）檢閱）。
    *   提供一個關於如何貢獻標準文件本身的指南。
    ```
```

### `"v", verbose"`

```text
    ```markdown

    # 樣式指南

    本文件定義了此專案中使用的樣式和慣例。
    除非另有說明，否則所有貢獻都應遵循這些規則。

    ## 1. 一般程式碼（code）樣式

    - 偏好清晰度而非簡潔性。
    - 保持函式（function）和方法小巧且集中。
    - 避免重複邏輯；偏好共享的輔助/公用程式。
    - 移除未使用的變數、匯入、程式碼（code）路徑和檔案。

    ## 2. 命名慣例

    使用描述性名稱。避免縮寫，除非是眾所周知的。

    | 項目             | 慣例                 | 範例（example）     |
    | Variables       | `lower_snake_case`   | `buffer_size`      |
    | Functions       | `lower_snake_case()` | `read_file()`      |
    | Constants       | `UPPER_SNAKE_CASE`   | `MAX_RETRIES`      |
    | Types/Structs   | `PascalCase`         | `FileHeader`       |
    | File Names      | `lower_snake_case`   | `file_reader.c`    |

    ## 3. 格式化規則

    - 縮排：**4 個空格**
    - 行長度：**最大 100 個字元**
    - 編碼：**UTF-8**，無 BOM
    - 檔案以換行符結尾

    ### 大括號（以 C 語言為範例（example），請根據您的語言調整）

        ```c
        if (condition) {
            do_something();
        } else {
            do_something_else();
        }
        ```

    ### 間距

    - 關鍵字後一個空格：`if (x)`，而不是 `if(x)`
    - 頂層函式（function）之間一個空行

    ## 4. 註釋和文件

    - 解釋 *為什麼*，而不是 *是什麼*，除非意圖不明確。
    - 隨著程式碼（code）更改，保持註釋最新。
    - 公共函式（function）應包含目的和參數的簡短描述。

    推薦標籤：

        ```text
        TODO: 後續工作
        FIXME: 已知不正確的行為
        NOTE: 不明顯的設計決策
        ```

    ## 5. 錯誤處理

    - 明確處理錯誤條件。
    - 避免靜默失敗；要麼回傳錯誤，要麼適當地記錄它們。
    - 在失敗時回傳之前，清理資源（檔案、記憶體（memory）、控制代碼）。

    ## 6. 提交和檢閱實踐

    ### 提交
    - 每次提交一個邏輯更改。
    - 撰寫清晰的提交訊息：

        ```text
        簡短摘要（最多約 50 個字元）
        可選的更長上下文和基本原理說明。
        ```

    ### 檢閱
    - 保持拉取請求合理地小。
    - 在檢閱討論中保持尊重和建設性。
    - 處理請求的更改或解釋您不同意的原因。

    ## 7. 測試

    - 為新功能撰寫測試。
    - 測試應是確定性的（沒有種子設定的隨機性）。
    - 偏好可讀的測試案例，而不是複雜的測試抽象。

    ## 8. 本指南的更改

    樣式會演變。
    透過開啟問題或傳送修補程式來更新本文件，以提出改進建議。
    ```
```
