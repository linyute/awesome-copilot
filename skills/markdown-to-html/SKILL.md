---
name: markdown-to-html
description: '將 Markdown 檔案轉換為 HTML，類似於 `marked.js`、`pandoc`、`gomarkdown/markdown` 或類似工具；或是編寫自定義指令稿來將 Markdown 轉換為 HTML，以及/或者在 `jekyll/jekyll`、`gohugoio/hugo` 或類似的使用 Markdown 文件並將其轉換為 HTML 輸出的網頁模板系統上工作。當被要求「將 markdown 轉換為 html」、「將 md 轉換為 html」、「渲染 markdown」、「從 markdown 產生 html」，或者在處理 .md 檔案以及/或者將 markdown 轉換為 HTML 輸出的網頁模板系統時使用。支援 GFM、CommonMark 和標準 Markdown 版本的 CLI 和 Node.js 工作流。'
---

# Markdown 轉換為 HTML

使用 marked.js 函式庫將 Markdown 文件轉換為 HTML，或編寫資料轉換指令稿的專家技能；在此情況下，指令稿類似於 [markedJS/marked](https://github.com/markedjs/marked) 套件庫。對於自定義指令稿，知識不限於 `marked.js`，還會利用來自 [pandoc](https://github.com/jgm/pandoc) 和 [gomarkdown/markdown](https://github.com/gomarkdown/markdown) 等工具的資料轉換方法；以及 [jekyll/jekyll](https://github.com/jekyll/jekyll) 和 [gohugoio/hugo](https://github.com/gohugoio/hugo) 等模板系統。

轉換指令稿或工具應能處理單個檔案、批次轉換和進階配置。

## 何時使用此技能

- 使用者要求「將 markdown 轉換為 html」或「轉換 md 檔案」
- 使用者想要將「markdown 渲染」為 HTML 輸出
- 使用者需要從 .md 檔案產生 HTML 文件
- 使用者正在從 Markdown 內容建構靜態網站
- 使用者正在建構將 markdown 轉換為 html 的模板系統
- 使用者正在為現有的模板系統開發工具、小元件或自定義模板
- 使用者想要預覽渲染後的 HTML 格式 Markdown

## 將 Markdown 轉換為 HTML

### 基本核心轉換

更多資訊請參閱 [basic-markdown-to-html.md](references/basic-markdown-to-html.md)

```text
    ```markdown
    # 第一級標題
    ## 第二級標題

    包含[連結](https://example.com)的句子，以及像 `<p>段落標籤</p>` 這樣的 HTML 片段。

    - `ul` 清單項目 1
    - `ul` 清單項目 2

    1. `ol` 清單項目 1
    2. `ol` 清單項目 1

    | 表格項目 | 描述 |
    | 一 | 一是數字 `1` 的拼法。 |
    | 二 | 二是數字 `2` 的拼法。 |

    ```js
    var one = 1;
    var two = 2;

    function simpleMath(x, y) {
     return x + y;
    }
    console.log(simpleMath(one, two));
    ```
    ```

    ```html
    <h1>第一級標題</h1>
    <h2>第二級標題</h2>

    <p>包含 <a href="https://example.com">連結</a> 的句子，以及像 <code>&lt;p&gt;段落標籤&lt;/p&gt;</code> 這樣的 HTML 片段。</p>

    <ul>
     <li>`ul` 清單項目 1</li>
     <li>`ul` 清單項目 2</li>
    </ul>

    <ol>
     <li>`ol` 清單項目 1</li>
     <li>`ol` 清單項目 2</li>
    </ol>

    <table>
     <thead>
      <tr>
       <th>表格項目</th>
       <th>描述</th>
      </tr>
     </thead>
     <tbody>
      <tr>
       <td>一</td>
       <td>一是數字 `1` 的拼法。</td>
      </tr>
      <tr>
       <td>二</td>
       <td>二是數字 `2` 的拼法。</td>
      </tr>
     </tbody>
    </table>

    <pre>
     <code>var one = 1;
     var two = 2;

     function simpleMath(x, y) {
      return x + y;
     }
     console.log(simpleMath(one, two));</code>
    </pre>
    ```
```

### 程式碼區塊轉換

更多資訊請參閱 [code-blocks-to-html.md](references/code-blocks-to-html.md)

```text

    ```markdown
    在此輸入您的程式碼
    ```

    ```html
    <pre><code class="language-md">
    在此輸入您的程式碼
    </code></pre>
    ```

    ```js
    console.log("Hello world");
    ```

    ```html
    <pre><code class="language-js">
    console.log("Hello world");
    </code></pre>
    ```

    ```markdown
      ```

      ```
      可見的反引號
      ```

      ```
    ```

    ```html
      <pre><code>
      ```

      可見的反引號

      ```
      </code></pre>
    ```
```

### 摺疊區塊轉換

更多資訊請參閱 [collapsed-sections-to-html.md](references/collapsed-sections-to-html.md)

```text
    ```markdown
    <details>
    <summary>更多資訊</summary>

    ### 內部的標題

    - 清單
    - **格式設定**
    - 程式碼區塊

        ```js
        console.log("Hello");
        ```

    </details>
    ```

    ```html
    <details>
    <summary>更多資訊</summary>

    <h3>內部的標題</h3>

    <ul>
     <li>清單</li>
     <li><strong>格式設定</strong></li>
     <li>程式碼區塊</li>
    </ul>

    <pre>
     <code class="language-js">console.log("Hello");</code>
    </pre>

    </details>
    ```
```

### 數學運算式轉換

更多資訊請參閱 [writing-mathematical-expressions-to-html.md](references/writing-mathematical-expressions-to-html.md)

```text
    ```markdown
    此句子使用 `$` 分隔符號來顯示行內數學運算式：$\\sqrt{3x-1}+(1+x)^2$
    ```

    ```html
    <p>此句子使用 <code>$</code> 分隔符號來顯示行內數學運算式：
     <math-renderer><math xmlns="http://www.w3.org/1998/Math/MathML">
      <msqrt><mn>3</mn><mi>x</mi><mo>−</mo><mn>1</mn></msqrt>
      <mo>+</mo><mo>(</mo><mn>1</mn><mo>+</mo><mi>x</mi>
      <msup><mo>)</mo><mn>2</mn></msup>
     </math>
    </math-renderer>
    </p>
    ```

    ```markdown
    **柯西-史瓦茲不等式**\
    $$\\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\leq \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)$$
    ```

    ```html
    <p><strong>柯西-史瓦茲不等式</strong><br>
     <math-renderer>
      <math xmlns="http://www.w3.org/1998/Math/MathML">
       <msup>
        <mrow><mo>(</mo>
         <munderover><mo data-mjx-texclass="OP">∑</mo>
          <mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi>
         </munderover>
         <msub><mi>a</mi><mi>k</mi></msub>
         <msub><mi>b</mi><mi>k</mi></msub>
         <mo>)</mo>
        </mrow>
        <mn>2</mn>
       </msup>
       <mo>≤</mo>
       <mrow><mo>(</mo>
        <munderover><mo>∑</mo>
         <mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow>
         <mi>n</mi>
        </munderover>
        <msubsup><mi>a</mi><mi>k</mi><mn>2</mn></msubsup>
        <mo>)</mo>
       </mrow>
       <mrow><mo>(</mo>
         <munderover><mo>∑</mo>
          <mrow><mi>k</mi><mo>=</mo><mn>1</mn></mrow>
          <mi>n</mi>
         </munderover>
         <msubsup><mi>b</mi><mi>k</mi><mn>2</mn></msubsup>
         <mo>)</mo>
       </mrow>
      </math>
     </math-renderer></p>
    ```
```

### 表格轉換

更多資訊請參閱 [tables-to-html.md](references/tables-to-html.md)

```text
    ```markdown
    | 第一個標題  | 第二個標題 |
    | ------------- | ------------- |
    | 內容儲存格  | 內容儲存格  |
    | 內容儲存格  | 內容儲存格  |
    ```

    ```html
    <table>
     <thead><tr><th>第一個標題</th><th>第二個標題</th></tr></thead>
     <tbody>
      <tr><td>內容儲存格</td><td>內容儲存格</td></tr>
      <tr><td>內容儲存格</td><td>內容儲存格</td></tr>
     </tbody>
    </table>
    ```

    ```markdown
    | 左對齊 | 置中對齊 | 右對齊 |
    | :---         |     :---:      |          ---: |
    | git status   | git status     | git status    |
    | git diff     | git diff       | git diff      |
    ```

    ```html
    <table>
      <thead>
       <tr>
        <th align="left">左對齊</th>
        <th align="center">置中對齊</th>
        <th align="right">右對齊</th>
       </tr>
      </thead>
      <tbody>
       <tr>
        <td align="left">git status</td>
        <td align="center">git status</td>
        <td align="right">git status</td>
       </tr>
       <tr>
        <td align="left">git diff</td>
        <td align="center">git diff</td>
        <td align="right">git diff</td>
       </tr>
      </tbody>
    </table>
    ```
```

## 使用 [`markedJS/marked`](references/marked.md)

### 先決條件

- 已安裝 Node.js (用於 CLI 或程式化使用)
- 全域安裝 marked 用於 CLI：`npm install -g marked`
- 或本地安裝：`npm install marked`

### 快速轉換方法

請參閱 [marked.md](references/marked.md) **快速轉換方法**

### 逐步工作流

請參閱 [marked.md](references/marked.md) **逐步工作流**

### CLI 配置

### 使用配置檔案

建立 `~/.marked.json` 用於持久性選項：

```json
{
  "gfm": true,
  "breaks": true
}
```

或使用自定義配置：

```bash
marked -i input.md -o output.html -c config.json
```

### CLI 選項參考

| 選項 | 描述 |
|--------|-------------|
| `-i, --input <file>` | 輸入 Markdown 檔案 |
| `-o, --output <file>` | 輸出 HTML 檔案 |
| `-s, --string <string>` | 解析字串而非檔案 |
| `-c, --config <file>` | 使用自定義配置檔案 |
| `--gfm` | 啟用 GitHub Flavored Markdown |
| `--breaks` | 將換行符轉換為 `<br>` |
| `--help` | 顯示所有選項 |

### 安全警告

⚠️ **Marked 不會消毒輸出 HTML。** 對於不受信任的輸入，請使用消毒劑：

```javascript
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const unsafeHtml = marked.parse(untrustedMarkdown);
const safeHtml = DOMPurify.sanitize(unsafeHtml);
```

建議的消毒劑：

- [DOMPurify](https://github.com/cure53/DOMPurify) (建議)
- [sanitize-html](https://github.com/apostrophecms/sanitize-html)
- [js-xss](https://github.com/leizongmin/js-xss)

### 支援的 Markdown 版本

| 版本 | 支援程度 |
|--------|---------|
| 原始 Markdown | 100% |
| CommonMark 0.31 | 98% |
| GitHub Flavored Markdown | 97% |

### 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 檔案開頭有特殊字元 | 去除零寬度字元：`content.replace(/^[​‌‍﻿]/,"")` |
| 程式碼區塊未高亮 | 新增語法高亮工具，如 highlight.js |
| 表格未渲染 | 確保已設定 `gfm: true` 選項 |
| 換行符被忽略 | 在選項中設定 `breaks: true` |
| XSS 漏洞疑慮 | 使用 DOMPurify 消毒輸出 |

## 使用 [`pandoc`](references/pandoc.md)

### 先決條件

- 已安裝 Pandoc (從 <https://pandoc.org/installing.html> 下載)
- 用於 PDF 輸出：安裝 LaTeX (macOS 為 MacTeX，Windows 為 MiKTeX，Linux 為 texlive)
- 終端機/命令提示字元存取權限

### 快速轉換方法

#### 方法 1：CLI 基本轉換

```bash
# 將 markdown 轉換為 HTML
pandoc input.md -o output.html

# 轉換為獨立文件 (包含頁首/頁尾)
pandoc input.md -s -o output.html

# 明確指定格式
pandoc input.md -f markdown -t html -s -o output.html
```

#### 方法 2：篩選器模式 (互動式)

```bash
# 以篩選器模式啟動 pandoc
pandoc

# 輸入 markdown，然後按下 Ctrl-D (Linux/macOS) 或 Ctrl-Z+Enter (Windows)
Hello *pandoc*!
# 輸出：<p>Hello <em>pandoc</em>!</p>
```

#### 方法 3：格式轉換

```bash
# HTML 轉換為 Markdown
pandoc -f html -t markdown input.html -o output.md

# Markdown 轉換為 LaTeX
pandoc input.md -s -o output.tex

# Markdown 轉換為 PDF (需要 LaTeX)
pandoc input.md -s -o output.pdf

# Markdown 轉換為 Word
pandoc input.md -s -o output.docx
```

### CLI 配置

| 選項 | 描述 |
|--------|-------------|
| `-f, --from <format>` | 輸入格式 (markdown, html, latex 等) |
| `-t, --to <format>` | 輸出格式 (html, latex, pdf, docx 等) |
| `-s, --standalone` | 產生包含頁首/頁尾的獨立文件 |
| `-o, --output <file>` | 輸出檔案 (從副檔名推斷) |
| `--mathml` | 將 TeX 數學轉換為 MathML |
| `--metadata title="Title"` | 設定文件 Metadata |
| `--toc` | 包含目錄 |
| `--template <file>` | 使用自定義模板 |
| `--help` | 顯示所有選項 |

### 安全警告

⚠️ **Pandoc 會忠實地處理輸入。** 轉換不受信任的 markdown 時：

- 使用 `--sandbox` 模式停用外部檔案存取
- 在處理前驗證輸入
- 如果在瀏覽器中顯示，請消毒 HTML 輸出

```bash
# 對於不受信任的輸入，在沙盒模式下執行
pandoc --sandbox input.md -o output.html
```

### 支援的 Markdown 版本

| 版本 | 支援程度 |
|--------|---------|
| Pandoc Markdown | 100% (原生) |
| CommonMark | 完整 (使用 `-f commonmark`) |
| GitHub Flavored Markdown | 完整 (使用 `-f gfm`) |
| MultiMarkdown | 部分 |

### 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| PDF 產生失敗 | 安裝 LaTeX (MacTeX, MiKTeX 或 texlive) |
| Windows 上的編碼問題 | 在使用 pandoc 前執行 `chcp 65001` |
| 缺少獨立頁首 | 對完整文件新增 `-s` 旗標 |
| 數學運算式未渲染 | 使用 `--mathml` 或 `--mathjax` 選項 |
| 表格未渲染 | 確保表格語法正確使用管道 (pipes) 和虛線 (dashes) |

## 使用 [`gomarkdown/markdown`](references/gomarkdown.md)

### 先決條件

- 已安裝 Go 1.18 或更高版本
- 安裝函式庫：`go get github.com/gomarkdown/markdown`
- 用於 CLI 工具：`go install github.com/gomarkdown/mdtohtml@latest`

### 快速轉換方法

#### 方法 1：簡單轉換 (Go)

```go
package main

import (
    "fmt"
    "github.com/gomarkdown/markdown"
)

func main() {
    md := []byte("# Hello World\n\nThis is **bold** text.")
    html := markdown.ToHTML(md, nil, nil)
    fmt.Println(string(html))
}
```

#### 方法 2：CLI 工具

```bash
# 安裝 mdtohtml
go install github.com/gomarkdown/mdtohtml@latest

# 轉換檔案
mdtohtml input.md output.html

# 轉換檔案 (輸出到標準輸出 stdout)
mdtohtml input.md
```

#### 方法 3：自定義解析器和渲染器

```go
package main

import (
    "github.com/gomarkdown/markdown"
    "github.com/gomarkdown/markdown/html"
    "github.com/gomarkdown/markdown/parser"
)

func mdToHTML(md []byte) []byte {
    // 建立帶有擴充功能的解析器
    extensions := parser.CommonExtensions | parser.AutoHeadingIDs | parser.NoEmptyLineBeforeBlock
    p := parser.NewWithExtensions(extensions)
    doc := p.Parse(md)

    // 建立帶有擴充功能的 HTML 渲染器
    htmlFlags := html.CommonFlags | html.HrefTargetBlank
    opts := html.RendererOptions{Flags: htmlFlags}
    renderer := html.NewRenderer(opts)

    return markdown.Render(doc, renderer)
}
```

### CLI 配置

`mdtohtml` CLI 工具的選項很少：

```bash
mdtohtml 輸入檔案 [輸出檔案]
```

對於進階配置，請以程式化方式搭配解析器和渲染器選項使用 Go 函式庫：

| 解析器擴充功能 | 描述 |
|------------------|-------------|
| `parser.CommonExtensions` | 表格、圍欄程式碼 (fenced code)、自動連結、刪除線等 |
| `parser.AutoHeadingIDs` | 為標題產生 ID |
| `parser.NoEmptyLineBeforeBlock` | 區塊前不需要空行 |
| `parser.MathJax` | 為 LaTeX 數學運算式提供 MathJax 支援 |

| HTML 旗標 | 描述 |
|-----------|-------------|
| `html.CommonFlags` | 常用的 HTML 輸出旗標 |
| `html.HrefTargetBlank` | 在連結中新增 `target="_blank"` |
| `html.CompletePage` | 產生完整的 HTML 頁面 |
| `html.UseXHTML` | 產生 XHTML 輸出 |

### 安全警告

⚠️ **gomarkdown 不會消毒輸出 HTML。** 對於不受信任的輸入，請使用 Bluemonday：

```go
import (
    "github.com/microcosm-cc/bluemonday"
    "github.com/gomarkdown/markdown"
)

maybeUnsafeHTML := markdown.ToHTML(md, nil, nil)
html := bluemonday.UGCPolicy().SanitizeBytes(maybeUnsafeHTML)
```

建議的消毒劑：[Bluemonday](https://github.com/microcosm-cc/bluemonday)

### 支援的 Markdown 版本

| 版本 | 支援程度 |
|--------|---------|
| 原始 Markdown | 100% |
| CommonMark | 高 (搭配擴充功能) |
| GitHub Flavored Markdown | 高 (表格、圍欄程式碼、刪除線) |
| MathJax/LaTeX 數學 | 透過擴充功能支援 |
| Mmark | 支援 |

### 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 未解析 Windows/Mac 換行符 | 使用 `parser.NormalizeNewlines(input)` |
| 表格未渲染 | 啟用 `parser.Tables` 擴充功能 |
| 程式碼區塊未高亮 | 整合 Chroma 等語法高亮工具 |
| 數學運算式未渲染 | 啟用 `parser.MathJax` 擴充功能 |
| XSS 漏洞 | 使用 Bluemonday 消毒輸出 |

## 使用 [`jekyll`](references/jekyll.md)

### 先決條件

- Ruby 版本 2.7.0 或更高
- RubyGems
- GCC 和 Make (用於原生擴充功能)
- 安裝 Jekyll 和 Bundler：`gem install jekyll bundler`

### 快速轉換方法

#### 方法 1：建立新網站

```bash
# 建立新的 Jekyll 網站
jekyll new myblog

# 切換到網站目錄
cd myblog

# 在本地建構並提供服務
bundle exec jekyll serve

# 存取路徑為 http://localhost:4000
```

#### 方法 2：建構靜態網站

```bash
# 將網站建構到 _site 目錄
bundle exec jekyll build

# 在生產環境中建構
JEKYLL_ENV=production bundle exec jekyll build
```

#### 方法 3：即時重新載入開發

```bash
# 包含即時重新載入功能提供服務
bundle exec jekyll serve --livereload

# 包含草稿提供服務
bundle exec jekyll serve --drafts
```

### CLI 配置

| 指令 | 描述 |
|---------|-------------|
| `jekyll new <path>` | 建立新的 Jekyll 網站 |
| `jekyll build` | 將網站建構到 `_site` 目錄 |
| `jekyll serve` | 在本地建構並提供服務 |
| `jekyll clean` | 移除產生的檔案 |
| `jekyll doctor` | 檢查配置問題 |

| 服務選項 | 描述 |
|---------------|-------------|
| `--livereload` | 在變更時重新載入瀏覽器 |
| `--drafts` | 包含草稿文章 |
| `--port <port>` | 設定伺服器連接埠 (預設值：4000) |
| `--host <host>` | 設定伺服器主機 (預設值：localhost) |
| `--baseurl <url>` | 設定基準 URL |

### 安全警告

⚠️ **Jekyll 安全考量事項：**

- 避免在生產環境中使用 `safe: false`
- 在 `_config.yml` 中使用 `exclude` 防止敏感檔案被發佈
- 如果接受外部輸入，請消毒使用者產生的內容
- 保持 Jekyll 和外掛程式更新

```yaml
# _config.yml 安全設定
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor
```

### 支援的 Markdown 版本

| 版本 | 支援程度 |
|--------|---------|
| Kramdown (預設) | 100% |
| CommonMark | 透過外掛程式 (jekyll-commonmark) 支援 |
| GitHub Flavored Markdown | 透過外掛程式 (jekyll-commonmark-ghpages) 支援 |
| RedCarpet | 透過外掛程式支援 (已棄用) |

在 `_config.yml` 中配置 markdown 處理器：

```yaml
markdown: kramdown
kramdown:
  input: GFM
  syntax_highlighter: rouge
```

### 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| Ruby 3.0+ 無法提供服務 | 執行 `bundle add webrick` |
| Gem 相依性錯誤 | 執行 `bundle install` |
| 建構緩慢 | 使用 `--incremental` 旗標 |
| Liquid 語法錯誤 | 檢查內容中是否有未逸出的 `{` |
| 外掛程式未載入 | 新增到 `_config.yml` 的外掛程式清單中 |

## 使用 [`hugo`](references/hugo.md)

### 先決條件

- 已安裝 Hugo (從 <https://gohugo.io/installation/> 下載)
- Git (建議用於佈景主題和模組)
- Go (選用，用於 Hugo Modules)

### 快速轉換方法

#### 方法 1：建立新網站

```bash
# 建立新的 Hugo 網站
hugo new site mysite

# 切換到網站目錄
cd mysite

# 新增佈景主題
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
echo "theme = 'ananke'" >> hugo.toml

# 建立內容
hugo new content posts/my-first-post.md

# 啟動開發伺服器
hugo server -D
```

#### 方法 2：建構靜態網站

```bash
# 將網站建構到 public 目錄
hugo

# 包含縮減功能進行建構
hugo --minify

# 針對特定環境進行建構
hugo --environment production
```

#### 方法 3：開發伺服器

```bash
# 包含草稿啟動伺服器
hugo server -D

# 啟動包含即時重新載入的伺服器，並繫結到所有介面
hugo server --bind 0.0.0.0 --baseURL http://localhost:1313/

# 使用特定連接埠啟動
hugo server --port 8080
```

### CLI 配置

| 指令 | 描述 |
|---------|-------------|
| `hugo new site <name>` | 建立新的 Hugo 網站 |
| `hugo new content <path>` | 建立新的內容檔案 |
| `hugo` | 將網站建構到 `public` 目錄 |
| `hugo server` | 啟動開發伺服器 |
| `hugo mod init` | 初始化 Hugo Modules |

| 建構選項 | 描述 |
|---------------|-------------|
| `-D, --buildDrafts` | 包含草稿內容 |
| `-E, --buildExpired` | 包含過期的內容 |
| `-F, --buildFuture` | 包含未來日期的內容 |
| `--minify` | 縮減輸出 |
| `--gc` | 建構後執行垃圾回收 |
| `-d, --destination <path>` | 輸出目錄 |

| 伺服器選項 | 描述 |
|---------------|-------------|
| `--bind <ip>` | 要繫結的介面 |
| `-p, --port <port>` | 連接埠號碼 (預設值：1313) |
| `--liveReloadPort <port>` | 即時重新載入連接埠 |
| `--disableLiveReload` | 停用即時重新載入 |
| `--navigateToChanged` | 導覽至變更的內容 |

### 安全警告

⚠️ **Hugo 安全考量事項：**

- 在 `hugo.toml` 中為外部指令配置安全原則
- 對公共套件庫謹慎使用 `--enableGitInfo`
- 驗證使用者產生內容的 shortcode 參數

```toml
# hugo.toml 安全設定
[security]
  enableInlineShortcodes = false
  [security.exec]
    allow = ['^go$', '^npx$', '^postcss$']
  [security.funcs]
    getenv = ['^HUGO_', '^CI$']
  [security.http]
    methods = ['(?i)GET|POST']
    urls = ['.*']
```

### 支援的 Markdown 版本

| 版本 | 支援程度 |
|--------|---------|
| Goldmark (預設) | 100% (符合 CommonMark) |
| GitHub Flavored Markdown | 完整 (表格、刪除線、自動連結) |
| CommonMark | 100% |
| Blackfriday (舊版) | 已棄用，不建議使用 |

在 `hugo.toml` 中配置 markdown：

```toml
[markup]
  [markup.goldmark]
    [markup.goldmark.extensions]
      definitionList = true
      footnote = true
      linkify = true
      strikethrough = true
      table = true
      taskList = true
    [markup.goldmark.renderer]
      unsafe = false  # 設定為 true 以允許原始 HTML
```

### 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 路徑出現 「Page not found」 | 檢查配置中的 `baseURL` |
| 佈景主題未載入 | 驗證 `themes/` 或 Hugo Modules 中的佈景主題 |
| 建構緩慢 | 使用 `--templateMetrics` 識別瓶頸 |
| 原始 HTML 未渲染 | 在 goldmark 配置中設定 `unsafe = true` |
| 圖片未載入 | 檢查 `static/` 資料夾結構 |
| 模組錯誤 | 執行 `hugo mod tidy` |

## 參考資料

### 編寫和設定 Markdown 樣式

- [basic-markdown.md](references/basic-markdown.md)
- [code-blocks.md](references/code-blocks.md)
- [collapsed-sections.md](references/collapsed-sections.md)
- [tables.md](references/tables.md)
- [writing-mathematical-expressions.md](references/writing-mathematical-expressions.md)
- Markdown 指南：<https://www.markdownguide.org/basic-syntax/>
- 設定 Markdown 樣式：<https://github.com/sindresorhus/github-markdown-css>

### [`markedJS/marked`](references/marked.md)

- 官方文件：<https://marked.js.org/>
- 進階選項：<https://marked.js.org/using_advanced>
- 擴充性：<https://marked.js.org/using_pro>
- GitHub 套件庫：<https://github.com/markedjs/marked>

### [`pandoc`](references/pandoc.md)

- 入門：<https://pandoc.org/getting-started.html>
- 官方文件：<https://pandoc.org/MANUAL.html>
- 擴充性：<https://pandoc.org/extras.html>
- GitHub 套件庫：<https://github.com/jgm/pandoc>

### [`gomarkdown/markdown`](references/gomarkdown.md)

- 官方文件：<https://pkg.go.dev/github.com/gomarkdown/markdown>
- 進階配置：<https://pkg.go.dev/github.com/gomarkdown/markdown@v0.0.0-20250810172220-2e2c11897d1a/html>
- Markdown 處理：<https://blog.kowalczyk.info/article/cxn3/advanced-markdown-processing-in-go.html>
- GitHub 套件庫：<https://github.com/gomarkdown/markdown>

### [`jekyll`](references/jekyll.md)

- 官方文件：<https://jekyllrb.com/docs/>
- 配置選項：<https://jekyllrb.com/docs/configuration/options/>
- 外掛程式：<https://jekyllrb.com/docs/plugins/>
  - [安裝](https://jekyllrb.com/docs/plugins/installation/)
  - [產生器 (Generators)](https://jekyllrb.com/docs/plugins/generators/)
  - [轉換器 (Converters)](https://jekyllrb.com/docs/plugins/converters/)
  - [指令](https://jekyllrb.com/docs/plugins/commands/)
  - [標籤 (Tags)](https://jekyllrb.com/docs/plugins/tags/)
  - [篩選器](https://jekyllrb.com/docs/plugins/filters/)
  - [掛鉤 (Hooks)](https://jekyllrb.com/docs/plugins/hooks/)
- GitHub 套件庫：<https://github.com/jekyll/jekyll>

### [`hugo`](references/hugo.md)

- 官方文件：<https://gohugo.io/documentation/>
- 所有設定：<https://gohugo.io/configuration/all/>
- 編輯器外掛程式：<https://gohugo.io/tools/editors/>
- GitHub 套件庫：<https://github.com/gohugoio/hugo>
