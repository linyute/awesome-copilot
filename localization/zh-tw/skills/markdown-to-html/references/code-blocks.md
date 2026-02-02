# 建立並醒目提示程式碼區塊

使用圍欄程式碼區塊 (fenced code blocks) 分享程式碼範例並啟用語法高亮。

## 圍欄程式碼區塊

您可以透過在程式碼區塊前後放置三個反引號 <code>\`\`\`</code> 來建立圍欄程式碼區塊。我們建議在程式碼區塊前後各留一行空行，以使原始格式更易於閱讀。

````text
```
function test() {
  console.log("注意此函式前的空行嗎？");
}
```
````

![呈現後的 GitHub Markdown 螢幕擷取畫面，顯示使用三個反引號建立程式碼區塊。該區塊以 「function test() {」 開頭。](https://docs.github.com/assets/images/help/writing/fenced-code-block-rendered.png)

> \[!TIP]
> 若要在清單中保留您的格式，請務必將非圍欄程式碼區塊縮排八個空格。

若要在圍欄程式碼區塊中顯示三個反引號，請將它們包裹在四個反引號內。

`````text
````
```
看！您可以看到我的反引號。
```
````
`````

![呈現後的 Markdown 螢幕擷取畫面，顯示當您在四個反引號之間編寫三個反引號時，它們在呈現後的內容中是可見的。](https://docs.github.com/assets/images/help/writing/fenced-code-show-backticks-rendered.png)

如果您經常編輯程式碼片段和表格，啟用 GitHub 上所有留言欄位的等寬字型可能會對您有所幫助。如需詳細資訊，請參閱[關於在 GitHub 上編寫與格式化](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/about-writing-and-formatting-on-github#enabling-fixed-width-fonts-in-the-editor)。

## 語法高亮

<!-- 如果您對此功能進行變更，請檢查是否有任何變更影響 /get-started/learning-about-github/github-language-support 中列出的語言。如果有，請相應地更新語言支援文章。 -->

您可以新增選用的語言識別碼，以在圍欄程式碼區塊中啟用語法高亮。

語法高亮會變更原始碼的顏色和樣式，使其更易於閱讀。

例如，若要對 Ruby 程式碼進行語法高亮：

````text
```ruby
require 'redcarpet'
markdown = Redcarpet.new("Hello World!")
puts markdown.to_html
```
````

這將顯示具有語法高亮的程式碼區塊：

![GitHub 上顯示的三行 Ruby 程式碼螢幕擷取畫面。程式碼的元素以紫色、藍色和紅色字體顯示，以提高可掃描性。](https://docs.github.com/assets/images/help/writing/code-block-syntax-highlighting-rendered.png)

> \[!TIP]
> 當您建立一個也希望在 GitHub Pages 網站上進行語法高亮的圍欄程式碼區塊時，請使用小寫語言識別碼。如需詳細資訊，請參閱[關於 GitHub Pages 和 Jekyll](https://docs.github.com/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll#syntax-highlighting)。

我們使用 [Linguist](https://github.com/github-linguist/linguist) 來執行語言偵測，並選取[第三方文法](https://github.com/github-linguist/linguist/blob/main/vendor/README.md)進行語法高亮。您可以在[語言 YAML 檔案](https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml)中找出哪些關鍵字是有效的。

## 建立圖表

您也可以使用程式碼區塊在 Markdown 中建立圖表。GitHub 支援 Mermaid、GeoJSON、TopoJSON 和 ASCII STL 語法。如需詳細資訊，請參閱[建立圖表](https://docs.github.com/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)。

## 延伸閱讀

* [GitHub Flavored Markdown 規範](https://github.github.com/gfm/)
* [基本寫作與格式設定語法](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
