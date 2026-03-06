# 摺疊區塊轉換為 HTML

## `<details>` 區塊 (Markdown 中的原始 HTML)

### Markdown

````md
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

---

### 剖析後的 HTML

```html
<details>
  <summary>摺疊區塊的秘訣</summary>

  <h3>您可以新增標題</h3>

  <p>您可以在摺疊區塊中新增文字。</p>

  <p>您也可以新增圖片或程式碼區塊。</p>

  <pre><code class="language-ruby">
puts "Hello World"
</code></pre>
</details>
```

#### 注意事項：

* **`<details>` 內部**的 Markdown 仍會被正常剖析。
* 語法高亮透過 `class="language-ruby"` 被保留。

---

## 預設為開啟 (`open` 屬性)

### Markdown

````md
<details open>

<summary>摺疊區塊的秘訣</summary>

### 您可以新增標題

您可以在摺疊區塊中新增文字。

您也可以新增圖片或程式碼區塊。

    ```ruby
    puts "Hello World"
    ```

</details>
````

### 剖析後的 HTML

```html
<details open>
  <summary>摺疊區塊的秘訣</summary>

  <h3>您可以新增標題</h3>

  <p>您可以在摺疊區塊中新增文字。</p>

  <p>您也可以新增圖片或程式碼區塊。</p>

  <pre><code class="language-ruby">
puts "Hello World"
</code></pre>
</details>
```

## 核心規則

* `<details>` 和 `<summary>` 是**原始 HTML**，而非 Markdown 語法
* `<details>` 內部的 Markdown **仍會被剖析**
* 語法高亮在摺疊區塊內可以正常運作
* 使用 `<summary>` 作為**可點擊的標籤**

## 包含行內 HTML 和 SVG 的段落

### Markdown

```md
您可以透過使用 `<details>` 標籤建立摺疊區塊，來精簡您的 Markdown。
```

### 剖析後的 HTML

```html
<p>
  您可以透過使用 <code>&lt;details&gt;</code> 標籤建立摺疊區塊，來精簡您的 Markdown。
</p>
```

---

### Markdown (保留行內 SVG)

```md
`<details>` 區塊內的任何 Markdown 都會被摺疊，直到讀者按一下 <svg ...></svg> 來展開詳細資訊。
```

### 剖析後的 HTML

```html
<p>
  <code>&lt;details&gt;</code> 區塊內的任何 Markdown 都會被摺疊，直到讀者按一下
  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16"
       class="octicon octicon-triangle-right"
       aria-label="右三角形圖示"
       role="img">
    <path d="m6.427 4.427 3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177Z"></path>
  </svg>
  來展開詳細資訊。
</p>
```
