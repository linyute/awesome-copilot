# HTML 與標記參考 (HTML & Markup Reference)

HTML5、標記語言與文件結構的全面參考。

## 核心概念

### HTML (超文字標記語言)
用於建立網頁與網頁應用程式的標準標記語言。

**相關術語**：HTML5、XHTML、標記 (Markup)、語義化 HTML (Semantic HTML)

### 元件 (Elements)
HTML 文件的建構區塊。每個元件都有起始/結束標籤（空元件除外）。

**常見元件**：
- `<div>` - 通用容器
- `<span>` - 行內容器
- `<article>` - 獨立內容
- `<section>` - 主題分組
- `<nav>` - 導覽連結
- `<header>` - 介紹性內容
- `<footer>` - 頁尾內容
- `<main>` - 主要內容
- `<aside>` - 輔助內容

### 屬性 (Attributes)
提供 HTML 元件額外資訊的屬性。

**常見屬性**：
- `id` - 唯一識別碼
- `class` - CSS 類別名稱
- `src` - 圖片/指令碼的來源 URL
- `href` - 超連結參考
- `alt` - 替代文字
- `title` - 提示標題
- `data-*` - 自訂資料屬性
- `aria-*` - 無障礙性屬性

### 空元件 (Void Elements)
不具備內容且沒有結束標籤的元件。

**範例**：`<img>`、`<br>`、`<hr>`、`<input>`、`<meta>`、`<link>`

## 語義化 HTML (Semantic HTML)

### 什麼是語義化 HTML？
清楚地向瀏覽器與開發者描述其意義的 HTML。

**優點**：
- 改善無障礙性
- 更好的 SEO
- 易於維護
- 內建意義與結構

### 語義化元件

| 元件 | 用途 | 使用時機 |
|---------|---------|-------------|
| `<article>` | 獨立完整的內容 | 部落格文章、新聞報導 |
| `<section>` | 內容的主題分組 | 章節、分頁內容 |
| `<nav>` | 導覽連結 | 主選單、麵包屑 (Breadcrumbs) |
| `<aside>` | 離題內容 | 側邊欄、相關連結 |
| `<header>` | 介紹性內容 | 頁面/區段標頭 |
| `<footer>` | 頁尾內容 | 版權資訊、聯絡資訊 |
| `<main>` | 主要內容 | 頁面的主要核心內容 |
| `<figure>` | 獨立的內容 | 附帶說明的圖片 |
| `<figcaption>` | figure 的說明 | 圖片描述 |
| `<time>` | 日期/時間 | 發布日期 |
| `<mark>` | 標記文字 | 搜尋結果 |
| `<details>` | 可展開的細節 | 摺疊選單、常見問題 |
| `<summary>` | details 的摘要 | 摺疊選單標題 |

### 範例：語義化文件結構

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>語義化頁面範例</title>
</head>
<body>
  <header>
    <h1>網站標題</h1>
    <nav aria-label="主導覽">
      <ul>
        <li><a href="/">首頁</a></li>
        <li><a href="/about">關於</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <article>
      <header>
        <h2>文章標題</h2>
        <time datetime="2026-03-04">2026 年 3 月 4 日</time>
      </header>
      <p>文章內容顯示於此...</p>
      <footer>
        <p>作者：王小明</p>
      </footer>
    </article>
  </main>
  
  <aside>
    <h3>相關內容</h3>
    <ul>
      <li><a href="/related">相關章節</a></li>
    </ul>
  </aside>
  
  <footer>
    <p>&copy; 2026 公司名稱</p>
  </footer>
</body>
</html>
```

## 文件結構

### Doctype
宣告文件型別與 HTML 版本。

```html
<!DOCTYPE html>
```

### Head 區段
包含關於文件的 Metadata。

**常見元件**：
- `<meta>` - Metadata（字元編碼、視埠、描述）
- `<title>` - 頁面標題（顯示於瀏覽器分頁）
- `<link>` - 外部資源（樣式表、圖示）
- `<script>` - JavaScript 檔案
- `<style>` - 行內 CSS

### Metadata 範例

```html
<head>
  <!-- 字元編碼 -->
  <meta charset="UTF-8">
  
  <!-- 回應式視埠 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- SEO metadata -->
  <meta name="description" content="供搜尋引擎使用的頁面描述">
  <meta name="keywords" content="html, 網頁, 開發">
  <meta name="author" content="作者姓名">
  
  <!-- Open Graph (社交媒體) -->
  <meta property="og:title" content="頁面標題">
  <meta property="og:description" content="頁面描述">
  <meta property="og:image" content="https://example.com/image.jpg">
  
  <!-- Favicon (網站圖示) -->
  <link rel="icon" type="image/png" href="/favicon.png">
  
  <!-- 樣式表 -->
  <link rel="stylesheet" href="styles.css">
  
  <!-- 預載關鍵資源 -->
  <link rel="preload" href="critical.css" as="style">
  <link rel="preconnect" href="https://api.example.com">
</head>
```

## 表單與輸入

### 表單元件

```html
<form action="/submit" method="POST">
  <!-- 文字輸入 -->
  <label for="name">姓名：</label>
  <input type="text" id="name" name="name" required>
  
  <!-- 電子郵件輸入 -->
  <label for="email">電子郵件：</label>
  <input type="email" id="email" name="email" required>
  
  <!-- 密碼輸入 -->
  <label for="password">密碼：</label>
  <input type="password" id="password" name="password" minlength="8" required>
  
  <!-- 下拉選單 -->
  <label for="country">國家：</label>
  <select id="country" name="country">
    <option value="">請選擇...</option>
    <option value="tw">台灣</option>
    <option value="us">美國</option>
  </select>
  
  <!-- 文字區域 -->
  <label for="message">訊息：</label>
  <textarea id="message" name="message" rows="4"></textarea>
  
  <!-- 核取方塊 -->
  <label>
    <input type="checkbox" name="terms" required>
    我同意服務條款
  </label>
  
  <!-- 選項按鈕 -->
  <fieldset>
    <legend>請選擇一個選項：</legend>
    <label>
      <input type="radio" name="option" value="a">
      選項 A
    </label>
    <label>
      <input type="radio" name="option" value="b">
      選項 B
    </label>
  </fieldset>
  
  <!-- 提交按鈕 -->
  <button type="submit">提交</button>
</form>
```

### 輸入類型 (Input Types)

| 型別 | 用途 | 範例 |
|------|---------|---------|
| `text` | 單行文字 | `<input type="text">` |
| `email` | 電子郵件地址 | `<input type="email">` |
| `password` | 密碼欄位 | `<input type="password">` |
| `number` | 數字輸入 | `<input type="number" min="0" max="100">` |
| `tel` | 電話號碼 | `<input type="tel">` |
| `url` | URL | `<input type="url">` |
| `date` | 日期選擇器 | `<input type="date">` |
| `time` | 時間選擇器 | `<input type="time">` |
| `file` | 檔案上傳 | `<input type="file" accept="image/*">` |
| `checkbox` | 核取方塊 | `<input type="checkbox">` |
| `radio` | 選項按鈕 | `<input type="radio">` |
| `range` | 滑桿 | `<input type="range" min="0" max="100">` |
| `color` | 顏色選擇器 | `<input type="color">` |
| `search` | 搜尋欄位 | `<input type="search">` |

## 相關標記語言

### XML (可延伸標記語言)
一種用於以同時具備人類可讀與機器可讀格式編碼文件的標記語言。

**與 HTML 的主要差異**：
- 所有標籤必須正確關閉
- 標籤區分大小寫
- 屬性必須使用引號包圍
- 允許自訂標籤名稱

### XHTML (可延伸超文字標記語言)
以 XML 重新建構的 HTML。語法規則比 HTML 更嚴格。

### MathML (數學標記語言)
用於在網頁上顯示數學符號的標記語言。

```html
<math>
  <mrow>
    <msup>
      <mi>x</mi>
      <mn>2</mn>
    </msup>
    <mo>+</mo>
    <mn>1</mn>
  </mrow>
</math>
```

### SVG (可縮放向量圖形)
基於 XML 的標記語言，用於描述二維向量圖形。

```html
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="blue" />
</svg>
```

## 字元編碼與參考

### 字元編碼 (Character Encoding)
定義字元如何表示為位元組。

**UTF-8**：通用字元編碼標準（建議使用）

```html
<meta charset="UTF-8">
```

### 字元參考 (Character References)
在 HTML 中表示特殊字元的方法。

**具名實體 (Named Entities)**：
- `&lt;` - 小於 (<)
- `&gt;` - 大於 (>)
- `&amp;` - & 符號 (&)
- `&quot;` - 引號 (")
- `&apos;` - 單引號 (')
- `&nbsp;` - 不換行空格
- `&copy;` - 版權所有 (©)

**數字實體 (Numeric Entities)**：
- `&#60;` - 小於 (<)
- `&#169;` - 版權所有 (©)
- `&#8364;` - 歐元 (€)

## 區塊 vs 行內內容

### 區塊層級內容 (Block-Level Content)
在版面配置中建立「區塊」的元件，會從新的一行開始。

**範例**：`<div>`、`<p>`、`<h1>`-`<h6>`、`<article>`、`<section>`、`<header>`、`<footer>`、`<nav>`、`<aside>`、`<ul>`、`<ol>`、`<li>`

### 行內層級內容 (Inline-Level Content)
不會從新的一行開始，且僅佔用必要寬度的元件。

**範例**：`<span>`、`<a>`、`<strong>`、`<em>`、`<img>`、`<code>`、`<abbr>`、`<cite>`

## 最佳實踐 (Best Practices)

### 應做事項 (Do's)
- ✅ 使用語義化 HTML 元件
- ✅ 包含正確的文件結構 (DOCTYPE, html, head, body)
- ✅ 將字元編碼設定為 UTF-8
- ✅ 為圖片使用具描述性的 `alt` 屬性
- ✅ 將標籤 (label) 與表單輸入建立關聯
- ✅ 正確使用標題層級 (h1 → h2 → h3)
- ✅ 使用 W3C 驗證器驗證 HTML
- ✅ 必要時使用正確的 ARIA 角色
- ✅ 為回應式設計包含 meta viewport

### 禁忌事項 (Don'ts)
- ❌ 當有語義化元件可用時，不要使用 `<div>`
- ❌ 跳過標題層級 (h1 → h3)
- ❌ 使用表格進行版面配置
- ❌ 忘記關閉標籤（空元件除外）
- ❌ 過度使用行內樣式
- ❌ 遺漏圖片的 `alt` 屬性
- ❌ 建立沒有標籤的表單
- ❌ 使用已遭取代的元件 (`<font>`、`<center>`、`<blink>`)

## 來自 MDN 的術語表 (Glossary Terms)

**涵蓋的核心術語**：
- 抽象 (Abstraction)
- 無障礙樹 (Accessibility tree)
- 無障礙描述 (Accessible description)
- 無障礙名稱 (Accessible name)
- 屬性 (Attribute)
- 區塊層級內容 (Block-level content)
- 麵包屑 (Breadcrumb)
- 瀏覽內容 (Browsing context)
- 字元 (Character)
- 字元編碼 (Character encoding)
- 字元參考 (Character reference)
- 字元集 (Character set)
- Doctype
- 文件環境 (Document environment)
- 元件 (Element)
- 實體 (Entity)
- 標頭 (Head)
- HTML
- HTML5
- 超連結 (Hyperlink)
- 超文字 (Hypertext)
- 行內層級內容 (Inline-level content)
- 標記 (Markup)
- MathML
- Metadata
- 語義 (Semantics)
- SVG
- 標籤 (Tag)
- 空元件 (Void element)
- XHTML
- XML

## 額外資源

- [MDN HTML 參考](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [W3C HTML 規格](https://html.spec.whatwg.org/)
- [HTML5 Doctor](http://html5doctor.com/)
- [W3C 標記驗證服務](https://validator.w3.org/)
