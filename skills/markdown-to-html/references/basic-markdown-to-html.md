# 基本 Markdown 轉換為 HTML

## 標題

### Markdown

```md
# 基本寫作與格式設定語法
```

### 剖析後的 HTML

```html
<h1>基本寫作與格式設定語法</h1>
```

```md
## 標題
```

```html
<h2>標題</h2>
```

```md
### 第三級標題
```

```html
<h3>第三級標題</h3>
```

### Markdown

```md
標題 2
---
```

### 剖析後的 HTML

```html
<h2>標題 2</h2>
```

---

## 段落

### Markdown

```md
在 GitHub 上使用簡單語法為您的散文和程式碼建立複雜的格式。
```

### 剖析後的 HTML

```html
<p>在 GitHub 上使用簡單語法為您的散文和程式碼建立複雜的格式。</p>
```

---

## 行內格式設定

### 粗體

```md
**這是粗體文字**
```

```html
<strong>這是粗體文字</strong>
```

---

### 斜體

```md
_這是斜體文字_
```

```html
<em>這是斜體文字</em>
```

---

### 粗體 + 斜體

```md
***所有這些文字都很重要***
```

```html
<strong><em>所有這些文字都很重要</em></strong>
```

---

### 刪除線 (GFM)

```md
~~這是錯誤的文字~~
```

```html
<del>這是錯誤的文字</del>
```

---

### 下標 / 上標 (原始 HTML 透傳)

```md
這是 <sub>下標</sub> 文字
```

```html
<p>這是 <sub>下標</sub> 文字</p>
```

```md
這是 <sup>上標</sup> 文字
```

```html
<p>這是 <sup>上標</sup> 文字</p>
```

---

## 區塊引言

### Markdown

```md
> 這是一段引言文字
```

### 剖析後的 HTML

```html
<blockquote>
  <p>這是一段引言文字</p>
</blockquote>
```

---

### GitHub 提醒 (NOTE)

```md
> [!NOTE]
> 有用的資訊。
```

```html
<blockquote class="markdown-alert markdown-alert-note">
  <p><strong>Note</strong></p>
  <p>有用的資訊。</p>
</blockquote>
```

> ⚠️ `markdown-alert-*` 類別是 GitHub 特有的，不是標準 Markdown。

---

## 行內程式碼

```md
使用 `git status` 列出檔案。
```

```html
<p>使用 <code>git status</code> 列出檔案。</p>
```

---

## 程式碼區塊

### Markdown

````md
```markdown
git status
git add
```
````

### 剖析後的 HTML

```html
<pre><code class="language-markdown">
git status
git add
</code></pre>
```

---

## 表格

### Markdown

```md
| 樣式 | 語法 |
|------|--------|
| 粗體 | ** ** |
```

### 剖析後的 HTML

```html
<table>
  <thead>
    <tr>
      <th>樣式</th>
      <th>語法</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>粗體</td>
      <td><strong> </strong></td>
    </tr>
  </tbody>
</table>
```

---

## 連結

### Markdown

```md
[GitHub Pages](https://pages.github.com/)
```

### 剖析後的 HTML

```html
<a href="https://pages.github.com/">GitHub Pages</a>
```

---

## 圖片

### Markdown

```md
![替代文字](image.png)
```

### 剖析後的 HTML

```html
<img src="image.png" alt="替代文字">
```

---

## 清單

### 無序清單

```md
- 喬治·華盛頓
- 約翰·亞當斯
```

```html
<ul>
  <li>喬治·華盛頓</li>
  <li>約翰·亞當斯</li>
</ul>
```

---

### 有序清單

```md
1. 詹姆斯·麥迪遜
2. 詹姆斯·門羅
```

```html
<ol>
  <li>詹姆斯·麥迪遜</li>
  <li>詹姆斯·門羅</li>
</ol>
```

---

### 巢狀清單

```md
1. 第一個項目
   - 巢狀項目
```

```html
<ol>
  <li>
    第一個項目
    <ul>
      <li>巢狀項目</li>
    </ul>
  </li>
</ol>
```

---

## 任務清單 (GitHub Flavored Markdown)

```md
- [x] 已完成
- [ ] 待處理
```

```html
<ul>
  <li>
    <input type="checkbox" checked disabled> 已完成
  </li>
  <li>
    <input type="checkbox" disabled> 待處理
  </li>
</ul>
```

---

## 提及

```md
@github/support
```

```html
<a href="https://github.com/github/support" class="user-mention">@github/support</a>
```

---

## 註腳

### Markdown

```md
這是一個註腳[^1]。

[^1]: 我的參考資料。
```

### 剖析後的 HTML

```html
<p>
  這是一個註腳
  <sup id="fnref-1">
    <a href="#fn-1">1</a>
  </sup>。
</p>

<section class="footnotes">
  <ol>
    <li id="fn-1">
      <p>我的參考資料。</p>
    </li>
  </ol>
</section>
```

---

## HTML 註解 (隱藏內容)

```md
<!-- 此內容將不會顯示 -->
```

```html
<!-- 此內容將不會顯示 -->
```

---

## 逸出 Markdown 字元

```md
\*不是斜體\*
```

```html
<p>*不是斜體*</p>
```

---

## 表情符號 (Emoji)

```md
:+1:
```

```html
<img class="emoji" alt="👍" src="...">
```

(GitHub 會將表情符號替換為 `<img>` 標籤。)

---
