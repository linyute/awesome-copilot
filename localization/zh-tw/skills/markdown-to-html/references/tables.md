# 使用表格整理資訊

您可以建立表格來整理留言、議題、提取要求和維基 (Wiki) 中的資訊。

## 建立表格

您可以使用管道符號 `|` 和連字號 `-` 來建立表格。連字號用於建立每一欄的標題，而管道符號則分隔每一欄。您必須在表格前包含一個空行，以便其正確渲染。

```markdown

| 第一個標題  | 第二個標題 |
| ------------- | ------------- |
| 內容儲存格  | 內容儲存格  |
| 內容儲存格  | 內容儲存格  |
```

![GitHub Markdown 表格呈現為兩個相等欄位的螢幕擷取畫面。標題以粗體顯示，交替的內容列具有灰色陰影。](https://docs.github.com/assets/images/help/writing/table-basic-rendered.png)

表格兩端的管道符號是選用的。

儲存格的寬度可以不同，且不需要在欄內完全對齊。標題列的每一欄中必須至少有三個連字號。

```markdown
| 指令 | 描述 |
| --- | --- |
| git status | 列出所有新檔案或修改過的檔案 |
| git diff | 顯示尚未暫存的檔案差異 |
```

![具有兩個不同寬度欄位的 GitHub Markdown 表格螢幕擷取畫面。資料列列出了指令 「git status」 和 「git diff」 及其說明。](https://docs.github.com/assets/images/help/writing/table-varied-columns-rendered.png)

如果您經常編輯程式碼片段和表格，啟用 GitHub 上所有留言欄位的等寬字型可能會對您有所幫助。如需詳細資訊，請參閱[關於在 GitHub 上編寫與格式化](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github#enabling-fixed-width-fonts-in-the-editor)。

## 格式化表格內的內容

您可以在表格內使用[格式設定](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)，例如連結、行內程式碼區塊和文字樣式：

```markdown
| 指令 | 描述 |
| --- | --- |
| `git status` | 列出所有*新檔案或修改過的*檔案 |
| `git diff` | 顯示**尚未**暫存的檔案差異 |
```

![指令格式化為程式碼區塊的 GitHub Markdown 表格螢幕擷取畫面。說明中使用了粗體和斜體格式。](https://docs.github.com/assets/images/help/writing/table-inline-formatting-rendered.png)

您可以透過在標題列內的連字號左側、右側或兩側包含冒號 `:`，將文字對齊欄位的左側、右側或中間。

```markdown
| 左對齊 | 置中對齊 | 右對齊 |
| :---         |     :---:      |          ---: |
| git status   | git status     | git status    |
| git diff     | git diff       | git diff      |
```

![GitHub 上呈現的具有三欄的 Markdown 表格螢幕擷取畫面，顯示如何將儲存格內的文字設定為左對齊、置中或右對齊。](https://docs.github.com/assets/images/help/writing/table-aligned-text-rendered.png)

若要在儲存格內包含管道符號 `|` 作為內容，請在管道符號前使用 `\`：

```markdown
| 名稱 | 字元 |
| ---      | ---       |
| 反引號 | `         |
| 管道 | \|        |
```

![GitHub 上呈現的 Markdown 表格螢幕擷取畫面，顯示通常用於關閉儲存格的管道符號在前面加上反斜線時如何顯示。](https://docs.github.com/assets/images/help/writing/table-escaped-character-rendered.png)

## 延伸閱讀

* [GitHub Flavored Markdown 規範](https://github.github.com/gfm/)
* [基本寫作與格式設定語法](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
