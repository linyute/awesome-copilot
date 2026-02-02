# 使用摺疊區塊整理資訊

您可以透過使用 `<details>` 標籤建立摺疊區塊，來精簡您的 Markdown。

## 建立摺疊區塊

您可以透過建立讀者可以選擇展開的摺疊區塊，來暫時隱藏 Markdown 的某些章節。例如，當您想在議題留言中包含技術細節，而這些細節可能不對每位讀者都有意義或讓他們感興趣時，您可以將這些細節放在摺疊區塊中。

`<details>` 區塊內的任何 Markdown 都會被摺疊，直到讀者按一下 <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-triangle-right" aria-label="右三角形圖示" role="img"><path d="m6.427 4.427 3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177Z"></path></svg> 來展開詳細資訊。

在 `<details>` 區塊內，使用 `<summary>` 標籤來讓讀者知道裡面有什麼。標籤會出現在 <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-triangle-right" aria-label="右三角形圖示" role="img"><path d="m6.427 4.427 3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177Z"></path></svg> 的右側。

````markdown
<details>

<summary>摺疊區塊的秘訣</summary>

### 您可以新增標題

您可以在摺疊區塊中新增文字。

您也可以新增圖片或程式碼區塊。

```ruby
   puts "Hello World"
```

</details>
````

`<summary>` 標籤內的 Markdown 預設會被摺疊：

![此頁面上方 Markdown 在 GitHub 上呈現的螢幕擷取畫面，顯示一個向右的箭頭和標題 「摺疊區塊的秘訣」。](https://docs.github.com/assets/images/help/writing/collapsed-section-view.png)

讀者按一下 <svg version="1.1" width="16" height="16" viewBox="0 0 16 16" class="octicon octicon-triangle-right" aria-label="右三角形圖示" role="img"><path d="m6.427 4.427 3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177Z"></path></svg> 後，詳細資訊會展開：

![此頁面上方 Markdown 在 GitHub 上呈現的螢幕擷取畫面。摺疊區塊包含標題、文字、圖片和程式碼區塊。](https://docs.github.com/assets/images/help/writing/open-collapsed-section.png)

(選用) 若要使該章節預設顯示為開啟，請在 `<details>` 標籤中新增 `open` 屬性：

```html
<details open>
```

## 延伸閱讀

* [GitHub Flavored Markdown 規範](https://github.github.com/gfm/)
* [基本寫作與格式設定語法](https://docs.github.com/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
