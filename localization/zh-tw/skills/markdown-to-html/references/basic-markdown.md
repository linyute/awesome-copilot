# 基本寫作與格式設定語法

在 GitHub 上使用簡單語法為您的散文和程式碼建立複雜的格式。

## 標題

若要建立標題，請在標題文字前新增一到六個 <kbd>#</kbd> 符號。您使用的 <kbd>#</kbd> 數量將決定標題的階層層級和字體大小。

```markdown
# 第一級標題
## 第二級標題
### 第三級標題
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示範例 h1、h2 和 h3 標頭，其字體大小和視覺重量依序遞減以顯示階層層級。](https://docs.github.com/assets/images/help/writing/headings-rendered.png)

當您使用兩個或多個標題時，GitHub 會自動產生一個目錄，您可以透過按一下檔案標頭中的「大綱」選單圖示 <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-list-unordered" aria-label="目錄" role="img"><path d="M5.75 2.5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5ZM2 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-6a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM2 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg> 來存取。目錄中列出了每個標題，您可以按一下標題以導覽至選取的章節。

![README 檔案的螢幕擷取畫面，其中顯示了目錄的下拉式選單。目錄圖示以深橘色框出。](https://docs.github.com/assets/images/help/repository/headings-toc.png)

## 設定文字樣式

您可以在留言欄位和 `.md` 檔案中，使用粗體、斜體、刪除線、下標或上標文字來表示強調。

| 樣式           | 語法               | 鍵盤快速鍵                                                                            | 範例                         | 輸出                       |                                                   |
| -------------- | ------------------ | ------------------------------------------------------------------------------------- | ---------------------------- | -------------------------- | ------------------------------------------------- |
| 粗體           | `** **` 或 `__ __` | <kbd>Command</kbd>+<kbd>B</kbd> (Mac) 或 <kbd>Ctrl</kbd>+<kbd>B</kbd> (Windows/Linux) | `**這是粗體文字**`           | **這是粗體文字**           |                                                   |
| 斜體           | `* *` 或 `_ _`     | <kbd>Command</kbd>+<kbd>I</kbd> (Mac) 或 <kbd>Ctrl</kbd>+<kbd>I</kbd> (Windows/Linux) | `_這是斜體文字_`             | *這是斜體文字*             |                                                   |
| 刪除線         | `~~ ~~` 或 `~ ~`   | 無                                                                                    | `~~這是錯誤的文字~~`         | ~~這是錯誤的文字~~         |                                                   |
| 粗體與巢狀斜體 | `** **` 和 `_ _`   | 無                                                                                    | `**這段文字_非常_重要**`     | **這段文字 *非常* 重要**   |                                                   |
| 全部粗體與斜體 | `*** ***`          | 無                                                                                    | `***所有這些文字都很重要***` | ***所有這些文字都很重要*** | <!-- markdownlint-disable-line emphasis-style --> |
| 下標           | `<sub> </sub>`     | 無                                                                                    | `這是 <sub>下標</sub> 文字`  | 這是 <sub>下標</sub> 文字  |                                                   |
| 上標           | `<sup> </sup>`     | 無                                                                                    | `這是 <sup>上標</sup> 文字`  | 這是 <sup>上標</sup> 文字  |                                                   |
| 底線           | `<ins> </ins>`     | 無                                                                                    | `這是 <ins>底線</ins> 文字`  | 這是 <ins>底線</ins> 文字  |                                                   |

## 引用文字

您可以使用 <kbd>></kbd> 來引用文字。

```markdown
這不是引用文字

> 這是引用文字
```

引用文字會縮排，左側有一條垂直線，並使用灰色字體顯示。

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示一般文字與引用文字之間的差異。](https://docs.github.com/assets/images/help/writing/quoted-text-rendered.png)

> \[!NOTE]
> 檢視對話時，您可以透過醒目提示文字，然後輸入 <kbd>R</kbd>，自動在留言中引用文字。您可以按一下 <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-kebab-horizontal" aria-label="水平三點圖示" role="img"><path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path></svg>，然後按一下「引用回覆」來引用整則留言。如需有關鍵盤快速鍵的詳細資訊，請參閱[鍵盤快速鍵](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts)。

## 引用程式碼

您可以使用單個反引號在句子中標出程式碼或指令。反引號內的文字將不會被格式化。您也可以按下 <kbd>Command</kbd>+<kbd>E</kbd> (Mac) 或 <kbd>Ctrl</kbd>+<kbd>E</kbd> (Windows/Linux) 鍵盤快速鍵，在 Markdown 的一行內插入程式碼區塊的反引號。

```markdown
使用 `git status` 列出所有尚未提交的新檔案或修改過的檔案。
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示被反引號包圍的字元以等寬字體顯示，並以淺灰色醒目提示。](https://docs.github.com/assets/images/help/writing/inline-code-rendered.png)

若要將程式碼或文字格式化為獨立的區塊，請使用三個反引號。

````markdown
一些基本的 Git 指令如下：
```
git status
git add
git commit
```
````

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示一個沒有語法高亮的簡單程式碼區塊。](https://docs.github.com/assets/images/help/writing/code-block-rendered.png)

如需詳細資訊，請參閱[建立並醒目提示程式碼區塊](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks)。

如果您經常編輯程式碼片段和表格，啟用 GitHub 上所有留言欄位的等寬字型可能會對您有所幫助。如需詳細資訊，請參閱[關於在 GitHub 上編寫與格式化](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github#enabling-fixed-width-fonts-in-the-editor)。

## 支援的色彩模型

在議題 (Issue)、提取要求 (Pull Request) 和討論 (Discussion) 中，您可以使用反引號在句子中標出色彩。反引號內支援的色彩模型將顯示該色彩的視覺化效果。

```markdown
淺色模式的背景色彩為 `#ffffff`，深色模式為 `#000000`。
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示反引號內的 HEX 值如何建立小色圈，此處分別為白色和黑色。](https://docs.github.com/assets/images/help/writing/supported-color-models-rendered.png)

以下是目前支援的色彩模型。

| 色彩 | 語法                      | 範例                              | 輸出                                                                                                                                                                               |
| ---- | ------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HEX  | <code>`#RRGGBB`</code>    | <code>`#0969DA`</code>            | ![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示 HEX 值 #0969DA 如何以藍色圈顯示。](https://docs.github.com/assets/images/help/writing/supported-color-models-hex-rendered.png)       |
| RGB  | <code>`rgb(R,G,B)`</code> | <code>`rgb(9, 105, 218)`</code>   | ![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示 RGB 值 9, 105, 218 如何以藍色圈顯示。](https://docs.github.com/assets/images/help/writing/supported-color-models-rgb-rendered.png)   |
| HSL  | <code>`hsl(H,S,L)`</code> | <code>`hsl(212, 92%, 45%)`</code> | ![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示 HSL 值 212, 92%, 45% 如何以藍色圈顯示。](https://docs.github.com/assets/images/help/writing/supported-color-models-hsl-rendered.png) |

> \[!NOTE]
>
> * 支援的色彩模型在反引號內不能有任何前導或結尾空格。
> * 色彩的視覺化效果僅在議題、提取要求和討論中受支援。

## 連結

您可以將連結文字包裹在方括號 `[ ]` 中，然後將 URL 包裹在括號 `( )` 中，以建立行內連結。您也可以使用鍵盤快速鍵 <kbd>Command</kbd>+<kbd>K</kbd> 來建立連結。當您選取文字後，可以從剪貼簿貼上 URL，以自動根據選取內容建立連結。

您也可以透過醒目提示文字並使用鍵盤快速鍵 <kbd>Command</kbd>+<kbd>V</kbd> 來建立 Markdown 超連結。如果您想用連結替換文字，請使用鍵盤快速鍵 <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>。

`此網站是使用 [GitHub Pages](https://pages.github.com/) 建置的。`

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示方括號內的文字「GitHub Pages」如何呈現為藍色超連結。](https://docs.github.com/assets/images/help/writing/link-rendered.png)

> [!NOTE]
> 當留言中寫入有效的 URL 時，GitHub 會自動建立連結。如需詳細資訊，請參閱[自動連結的參考資料和 URL](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls)。

## 章節連結

您可以直接連結至任何具有標題的章節。若要在呈現後的檔案中檢視自動產生的錨點，請將滑鼠游標停留在章節標題上，以顯示 <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-link" aria-label="連結" role="img"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg> 圖示，然後按一下該圖示即可在瀏覽器中顯示錨點。

![套件庫 README 的螢幕擷取畫面。在章節標題的左側，一個連結圖示以深橘色框出。](https://docs.github.com/assets/images/help/repository/readme-links.png)

如果您需要判斷正在編輯的檔案中標題的錨點，可以使用以下基本規則：

* 字母轉換為小寫。
* 空格替換為連字號 (`-`)。任何其他空格或標點符號字元都會被移除。
* 移除前導和結尾空格。
* 移除標記格式，僅保留內容 (例如，`_斜體_` 變為 `斜體`)。
* 如果標題自動產生的錨點與同一文件中的早期錨點相同，則會透過附加連字號和自動遞增的整數來產生唯一識別碼。

如需有關 URI 片段需求的詳細資訊，請參閱 [RFC 3986：通用資源識別碼 (URI)：通用語法，第 3.5 節](https://www.rfc-editor.org/rfc/rfc3986#section-3.5)。

下方的程式碼區塊示範了在呈現內容中從標題產生錨點所使用的基本規則。

```markdown
# 範例標題

## 範例章節

## 這將是關於希臘字母 Θ 的一個「有幫助的」章節！
包含片段中不允許字元、UTF-8 字元、第一個和第二個單字之間連續兩個空格以及格式的標題。

## 此標題在檔案中不具唯一性

文字 1

## 此標題在檔案中不具唯一性

文字 2

# 以上範例標題的連結

範例章節連結：[連結文字](#範例章節)。

有幫助的章節連結：[連結文字](#這將是關於希臘字母-θ-的一個有幫助的章節)。

第一個非唯一章節連結：[連結文字](#此標題在檔案中不具唯一性)。

第二個非唯一章節連結：[連結文字](#此標題在檔案中不具唯一性-1)。
```

> \[!NOTE]
> 如果您編輯標題，或變更具有「相同」錨點的標題順序，您也需要更新與這些標題的所有連結，因為錨點將會變更。

## 相對連結

您可以在呈現後的檔案中定義相對連結和圖片路徑，以協助讀者導覽至套件庫中的其他檔案。

相對連結是相對於目前檔案的連結。例如，如果您的套件庫根目錄中有一個 README 檔案，而在 *docs/CONTRIBUTING.md* 中有另一個檔案，則 README 中指向 *CONTRIBUTING.md* 的相對連結可能如下所示：

```text
[此專案的貢獻準則](docs/CONTRIBUTING.md)
```

GitHub 會根據您目前所在的任何分支自動轉換您的相對連結或圖片路徑，以便連結或路徑始終有效。連結路徑將相對於目前檔案。以 `/` 開頭的連結將相對於套件庫根目錄。您可以使用所有相對連結運算元，例如 `./` 和 `../`。

您的連結文字應位於同一行。下方的範例將無法運作。

```markdown
[此專案的
貢獻準則](docs/CONTRIBUTING.md)
```

對於複製 (clone) 您套件庫的使用者而言，相對連結較為容易。絕對連結在您套件庫的副本中可能無法運作 - 我們建議使用相對連結來參考套件庫中的其他檔案。

## 自定義錨點

您可以使用標準 HTML 錨點標籤 (`<a name="unique-anchor-name"></a>`) 為文件中的任何位置建立導覽錨點。若要避免歧義引用，請對錨點標籤使用唯一的命名配置，例如在 `name` 屬性值中新增字首。

> \[!NOTE]
> 自定義錨點將不包含在文件大綱/目錄中。

您可以使用賦予錨點的 `name` 屬性值來連結至自定義錨點。語法與連結至為標題自動產生的錨點時完全相同。

例如：

```markdown
# 章節標題

此章節的一些本文。

<a name="my-custom-anchor-point"></a>
我想提供直接連結的一些文字，但它沒有自己的標題。

(… 更多內容…)

[連往該自定義錨點的連結](#my-custom-anchor-point)
```

> \[!TIP]
> 自動標題連結的自動命名和編號行為不會考慮自定義錨點。

## 換行

如果您在套件庫的議題、提取要求或討論中寫作，GitHub 會自動呈現換行：

```markdown
這個範例
將跨越兩行
```

但是，如果您在 .md 檔案中寫作，上方的範例將呈現在同一行，沒有換行。若要在 .md 檔案中建立換行，您需要包含下列其中一項：

* 在第一行末尾包含兩個空格。
  <pre>
  這個範例&nbsp;&nbsp;
  將跨越兩行
  </pre>

* 在第一行末尾包含反斜線。

  ```markdown
  這個範例\
  將跨越兩行
  ```

* 在第一行末尾包含 HTML 單行換行標籤。

  ```markdown
  這個範例<br/>
  將跨越兩行
  ```

如果您在兩行之間留一行空行，.md 檔案以及議題、提取要求和討論中的 Markdown 都會將這兩行呈現為由空行分隔：

```markdown
這個範例

將有一個空行分隔這兩行
```

## 圖片

您可以透過新增 <kbd>!</kbd> 並將替代文字包裹在 `[ ]` 中來顯示圖片。替代文字是圖片中資訊的簡短文字等效內容。接著，將圖片連結包裹在括號 `()` 中。

`![GitHub 議題上的留言螢幕擷取畫面，其中顯示了一張在 Markdown 中新增的 Octocat 微笑並舉起觸手的圖片。](https://myoctocat.com/assets/images/base-octocat.svg)`

![GitHub 議題上的留言螢幕擷取畫面，其中顯示了一張在 Markdown 中新增的 Octocat 微笑並舉起觸手的圖片。](https://docs.github.com/assets/images/help/writing/image-rendered.png)

GitHub 支援在您的議題、提取要求、討論、留言和 `.md` 檔案中嵌入圖片。您可以顯示套件庫中的圖片、新增線上圖片連結或上傳圖片。如需詳細資訊，請參閱[上傳資產](#上傳資產)。

> \[!NOTE]
> 當您想要顯示套件庫中的圖片時，請使用相對連結而非絕對連結。

以下是使用相對連結顯示圖片的一些範例。

| 上下文                                 | 相對連結                                                               |
| -------------------------------------- | ---------------------------------------------------------------------- |
| 在同一分支的 `.md` 檔案中              | `/assets/images/electrocat.png`                                        |
| 在另一分支的 `.md` 檔案中              | `/../main/assets/images/electrocat.png`                                |
| 在套件庫的議題、提取要求和留言中       | `../blob/main/assets/images/electrocat.png?raw=true`                   |
| 在另一個套件庫的 `.md` 檔案中          | `/../../../../github/docs/blob/main/assets/images/electrocat.png`      |
| 在另一個套件庫的議題、提取要求和留言中 | `../../../github/docs/blob/main/assets/images/electrocat.png?raw=true` |

> \[!NOTE]
> 上表中的最後兩個相對連結僅在檢視者對包含這些圖片的私有套件庫至少具有讀取權限時，才適用於私有套件庫中的圖片。

如需詳細資訊，請參閱[相對連結](#相對連結)。

### Picture 元素

支援 `<picture>` HTML 元素。

## 清單

您可以透過在文字的一行或多行前加上 <kbd>-</kbd>、<kbd>*</kbd> 或 <kbd>+</kbd> 來製作無序清單。

```markdown
- 喬治·華盛頓
* 約翰·亞當斯
+ 湯瑪斯·傑佛遜
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示前三任美國總統姓名的點狀清單。](https://docs.github.com/assets/images/help/writing/unordered-list-rendered.png)

若要排序您的清單，請在每行前加上數字。

```markdown
1. 詹姆斯·麥迪遜
2. 詹姆斯·門羅
3. 約翰·昆西·亞當斯
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示第四、五、六任美國總統姓名的編號清單。](https://docs.github.com/assets/images/help/writing/ordered-list-rendered.png)

### 巢狀清單

您可以透過在另一個項目下方縮排一個或多個清單項目來建立巢狀清單。

若要使用 GitHub 上的網頁編輯器或使用等寬字型的文字編輯器 (如 [Visual Studio Code](https://code.visualstudio.com/)) 建立巢狀清單，您可以直觀地對齊清單。在巢狀清單項目前輸入空格字元，直到清單標記字元 (<kbd>-</kbd> 或 <kbd>*</kbd>) 直接位於其上方項目內容的第一個字元下方。

```markdown
1. 第一個清單項目
   - 第一個巢狀清單項目
     - 第二個巢狀清單項目
```

> \[!NOTE]
> 在網頁編輯器中，您可以先醒目提示所需的行，然後分別使用 <kbd>Tab</kbd> 或 <kbd>Shift</kbd>+<kbd>Tab</kbd> 來增加或減少一或多行文字的縮排。

![Visual Studio Code 中的 Markdown 螢幕擷取畫面，顯示巢狀編號行和項目符號的縮排。](https://docs.github.com/assets/images/help/writing/nested-list-alignment.png)

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示一個編號項目，其後跟著兩個不同巢狀層級的巢狀項目符號。](https://docs.github.com/assets/images/help/writing/nested-list-example-1.png)

若要在 GitHub 上的留言編輯器 (不使用等寬字型) 中建立巢狀清單，您可以查看巢狀清單上方的清單項目，並計算項目內容之前出現的字元數。然後在巢狀清單項目前輸入該數量的空格字元。

在此範例中，您可以透過縮排巢狀清單項目至少五個空格，在清單項目 `100. 第一個清單項目` 下新增一個巢狀清單項目，因為 `第一個清單項目` 之前有五個字元 (`100. `)。

```markdown
100. 第一個清單項目
     - 第一個巢狀清單項目
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示一個以數字 100 為字首的編號項目，其後跟著一個縮排一級的項目符號。](https://docs.github.com/assets/images/help/writing/nested-list-example-3.png)

您可以使用相同的方法建立多個層級的巢狀清單。例如，由於第一個巢狀清單項目在巢狀清單內容 `第一個巢狀清單項目` 之前有七個字元 (`␣␣␣␣␣-␣`)，因此您需要將第二個巢狀清單項目至少再縮排兩個字元 (最少九個空格)。

```markdown
100. 第一個清單項目
     - 第一個巢狀清單項目
       - 第二個巢狀清單項目
```

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示一個以數字 100 為字首的編號項目，其後跟著兩個不同巢狀層級的項目符號。](https://docs.github.com/assets/images/help/writing/nested-list-example-2.png)

如需更多範例，請參閱 [GitHub Flavored Markdown 規範](https://github.github.com/gfm/#example-265)。

## 任務清單

若要建立任務清單，請在清單項目前加上連字號和空格，後跟 `[ ]`。若要將任務標記為完成，請使用 `[x]`。

```markdown
- [x] #739
- [ ] https://github.com/octo-org/octo-repo/issues/740
- [ ] 當所有任務都完成時，為體驗增加驚喜 :tada:
```

![顯示呈現後的 markdown 版本的螢幕擷取畫面。對議題的參考資料會呈現為議題標題。](https://docs.github.com/assets/images/help/writing/task-list-rendered-simple.png)

如果任務清單項目的描述以括號開頭，則需要使用 <kbd>\</kbd> 進行逸出：

`- [ ] (選用) 開啟追蹤議題`

如需詳細資訊，請參閱[關於任務清單](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-task-lists)。

## 提及人員與團隊

您可以透過輸入 <kbd>@</kbd> 加上使用者名稱或團隊名稱，在 GitHub 上提及人員或[團隊](https://docs.github.com/en/organizations/organizing-members-into-teams)。這會觸發通知並引起他們對對話的注意。如果您編輯留言以提及人員的使用者名稱或團隊名稱，他們也會收到通知。如需有關通知的詳細資訊，請參閱[關於通知](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications)。

> \[!NOTE]
> 只有在人員對套件庫具有讀取權限，且如果套件庫由組織擁有，該人員是組織成員時，才會收到提及通知。

`@github/support 您對這些更新有什麼看法？`

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示團隊提及「@github/support」呈現為粗體、可點擊的文字。](https://docs.github.com/assets/images/help/writing/mention-rendered.png)

當您提及父團隊時，其子團隊的成員也會收到通知，從而簡化了與多個群組人員的溝通。如需詳細資訊，請參閱[關於組織團隊](https://docs.github.com/en/organizations/organizing-members-into-teams/about-teams)。

輸入 <kbd>@</kbd> 符號將帶出專案中人員或團隊的清單。該清單會在您輸入時進行篩選，因此一旦找到您要尋找的人員或團隊名稱，您可以使用方向鍵選取它，然後按 tab 或 enter 以完成名稱。對於團隊，輸入 @organization/team-name，該團隊的所有成員都將訂閱對話。

自動完成結果僅限於套件庫協作者和對話執行緒中的任何其他參與者。

## 參考議題與提取要求

您可以透過輸入 <kbd>#</kbd> 帶出套件庫中建議的議題與提取要求清單。輸入議題或提取要求的編號或標題以篩選清單，然後按 tab 或 enter 以完成醒目提示的結果。

如需詳細資訊，請參閱[自動連結的參考資料和 URL](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls)。

## 參考外部資源

如果為套件庫配置了自定義自動連結參考資料，則對外部資源 (例如 JIRA 議題或 Zendesk 工單) 的參考資料會轉換為短連結。若要了解您的套件庫中有哪些可用的自動連結，請聯絡具有該套件庫管理權限的人員。如需詳細資訊，請參閱[配置自動連結以參考外部資源](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/configuring-autolinks-to-reference-external-resources)。

## 上傳資產

您可以透過拖放、從檔案瀏覽器中選取或貼上來上傳圖片等資產。您可以將資產上傳到套件庫中的議題、提取要求、留言和 `.md` 檔案。

## 使用表情符號

您可以透過輸入 `:表情符號代碼:` (冒號後跟表情符號名稱) 來在您的寫作中新增表情符號。

`@octocat :+1: 這個 PR 看起來很棒 - 準備好合併了！ :shipit:`

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示 +1 和 shipit 的表情符號代碼如何視覺化呈現為表情符號。](https://docs.github.com/assets/images/help/writing/emoji-rendered.png)

輸入 <kbd>:</kbd> 將帶出建議的表情符號清單。該清單會在您輸入時進行篩選，因此一旦找到您要尋找的表情符號，請按 **Tab** 或 **Enter** 以完成醒目提示的結果。

如需可用表情符號及其代碼的完整清單，請參閱 [Emoji-Cheat-Sheet](https://github.com/ikatyang/emoji-cheat-sheet/blob/github-actions-auto-update/README.md)。

## 段落

您可以透過在文字行之間留出一個空行來建立新段落。

## 註腳

您可以使用此括號語法為您的內容新增註腳：

```text
這是一個簡單的註腳[^1]。

註腳也可以有多行[^2]。

[^1]: 我的參考資料。
[^2]: 若要在註腳中新增換行，請在行尾新增 2 個空格。  
這是第二行。
```

註腳將呈現如下：

![呈現後的 Markdown 螢幕擷取畫面，顯示用於表示註腳的上標數字，以及註解內選用的換行。](https://docs.github.com/assets/images/help/writing/footnote-rendered.png)

> \[!NOTE]
> 註腳在 Markdown 中的位置不影響註腳呈現的位置。您可以在參考註腳後立即編寫註腳，註腳仍將呈現於 Markdown 的底部。維基 (Wiki) 不支援註腳。

## 提醒 (Alerts)

**提醒 (Alerts)**，有時也稱為 **註釋 (callouts)** 或 **告誡 (admonitions)**，是一種基於區塊引言語法的 Markdown 擴充功能，可用於強調關鍵資訊。在 GitHub 上，它們會以獨特的顏色和圖示顯示，以指示內容的重要性。

僅在提醒對使用者成功至關重要時才使用，且每篇文章限制為一兩個，以防止讀者負荷過重。此外，應避免連續放置提醒。提醒不能嵌套在其他元素中。

若要新增提醒，請使用指定提醒類型的特殊區塊引言行，後跟標準區塊引言中的提醒資訊。有五種提醒類型可用：

```markdown
> [!NOTE]
> 使用者即使在瀏覽內容時也應了解的有用的資訊。

> [!TIP]
> 讓事情做得更好或更輕鬆的有用的建議。

> [!IMPORTANT]
> 使用者為達成目標需要了解的關鍵資訊。

> [!WARNING]
> 需要使用者立即注意以避免問題的緊急資訊。

> [!CAUTION]
> 關於某些行動的風險或負面結果的建議。
```

以下是呈現後的提醒：

![呈現後的 Markdown 提醒螢幕擷取畫面，顯示 Note、Tip、Important、Warning 和 Caution 如何以不同顏色的文字和圖示呈現。](https://docs.github.com/assets/images/help/writing/alerts-rendered.png)

## 使用註解隱藏內容

您可以透過將內容放在 HTML 註解中，指示 GitHub 從呈現後的 Markdown 中隱藏內容。

```text
<!-- 此內容將不會顯示在呈現後的 Markdown 中 -->
```

## 忽略 Markdown 格式

您可以透過在 Markdown 字元前使用 <kbd>\</kbd>，指示 GitHub 忽略 (或逸出) Markdown 格式。

`讓我們將 \*我們的-新-專案\* 重新命名為 \*我們的-舊-專案\*。`

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示反斜線如何防止星號轉換為斜體。](https://docs.github.com/assets/images/help/writing/escaped-character-rendered.png)

如需有關反斜線的詳細資訊，請參閱 Daring Fireball 的 [Markdown 語法](https://daringfireball.net/projects/markdown/syntax#backslash)。

> \[!NOTE]
> 議題或提取要求的標題中將不會忽略 Markdown 格式。

## 停用 Markdown 渲染

檢視 Markdown 檔案時，您可以按一下檔案頂部的「程式碼」以停用 Markdown 渲染並改為檢視檔案的原始碼。

![套件庫中 Markdown 檔案的螢幕擷取畫面，顯示與檔案互動的選項。一個標記為「程式碼」的按鈕以深橘色框出。](https://docs.github.com/assets/images/help/writing/display-markdown-as-source-global-nav-update.png)

停用 Markdown 渲染可讓您使用原始碼檢視功能，例如行連結，這在檢視呈現後的 Markdown 檔案時是無法做到的。

## 延伸閱讀

*[GitHub Flavored Markdown 規範](https://github.github.com/gfm/)
*[關於在 GitHub 上編寫與格式化](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github)
*[使用進階格式設定](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting)
*[GitHub 寫作快速入門](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/quickstart-for-writing-on-github)
