# gomarkdown/markdown 參考

用於剖析 Markdown 並渲染 HTML 的 Go 函式庫。快速、具可擴充性且執行緒安全。

## 安裝

```bash
# 新增到您的 Go 專案
go get github.com/gomarkdown/markdown

# 安裝 CLI 工具
go install github.com/gomarkdown/mdtohtml@latest
```

## 基本用法

### 簡單轉換

```go
package main

import (
    "fmt"
    "github.com/gomarkdown/markdown"
)

func main() {
    md := []byte("# Hello World\n\n這段是 **粗體** 文字。")
    html := markdown.ToHTML(md, nil, nil)
    fmt.Println(string(html))
}
```

### 使用 CLI 工具

```bash
# 將檔案轉換為 HTML
mdtohtml input.md output.html

# 輸出到標準輸出 (stdout)
mdtohtml input.md
```

## 解析器 (Parser) 配置

### 常見擴充功能

```go
import (
    "github.com/gomarkdown/markdown"
    "github.com/gomarkdown/markdown/parser"
)

// 建立帶有擴充功能的解析器
extensions := parser.CommonExtensions | parser.AutoHeadingIDs
p := parser.NewWithExtensions(extensions)

// 剖析 markdown
doc := p.Parse(md)
```

### 可用的解析器擴充功能

| 擴充功能 | 描述 |
|-----------|-------------|
| `parser.CommonExtensions` | 表格、圍欄程式碼、自動連結、刪除線 |
| `parser.Tables` | 支援管道表格 (Pipe tables) |
| `parser.FencedCode` | 帶有語言標籤的圍欄程式碼區塊 |
| `parser.Autolink` | 自動偵測 URL |
| `parser.Strikethrough` | ~~刪除線~~ 文字 |
| `parser.SpaceHeadings` | 標題中的 # 後需要空格 |
| `parser.HeadingIDs` | 自定義標題 ID {#id} |
| `parser.AutoHeadingIDs` | 自動產生標題 ID |
| `parser.Footnotes` | 支援註腳 |
| `parser.NoEmptyLineBeforeBlock` | 區塊前不需要空行 |
| `parser.HardLineBreak` | 換行符變為 `<br>` |
| `parser.MathJax` | 支援 MathJax |
| `parser.SuperSubscript` | 上標^script^ 和 下標~script~ |
| `parser.Mmark` | 支援 Mmark 語法 |

## HTML 渲染器 (Renderer) 配置

### 常見旗標

```go
import (
    "github.com/gomarkdown/markdown"
    "github.com/gomarkdown/markdown/html"
    "github.com/gomarkdown/markdown/parser"
)

// 解析器
p := parser.NewWithExtensions(parser.CommonExtensions)

// 渲染器
htmlFlags := html.CommonFlags | html.HrefTargetBlank
opts := html.RendererOptions{
    Flags: htmlFlags,
    Title: "我的文件",
    CSS: "style.css",
}
renderer := html.NewRenderer(opts)

// 轉換
html := markdown.ToHTML(md, p, renderer)
```

### 可用的 HTML 旗標

| 旗標 | 描述 |
|------|-------------|
| `html.CommonFlags` | 常見且合理的預設值 |
| `html.HrefTargetBlank` | 在連結中新增 `target="_blank"` |
| `html.CompletePage` | 產生完整的 HTML 文件 |
| `html.UseXHTML` | 使用 XHTML 輸出 |
| `html.FootnoteReturnLinks` | 在註腳中新增返回連結 |
| `html.FootnoteNoHRTag` | 註腳前不顯示 `<hr>` |
| `html.Smartypants` | 智慧標點符號 |
| `html.SmartypantsFractions` | 智慧分數 (1/2 → ½) |
| `html.SmartypantsDashes` | 智慧破折號 (-- → –) |
| `html.SmartypantsLatexDashes` | LaTeX 風格的破折號 |

### 渲染器選項

```go
opts := html.RendererOptions{
    Flags:          htmlFlags,
    Title:          "文件標題",
    CSS:            "path/to/style.css",
    Icon:           "favicon.ico",
    Head:           []byte("<meta name='author' content='...'>"),
    RenderNodeHook: customRenderHook,
}
```

## 完整範例

```go
package main

import (
    "os"
    "github.com/gomarkdown/markdown"
    "github.com/gomarkdown/markdown/html"
    "github.com/gomarkdown/markdown/parser"
)

func mdToHTML(md []byte) []byte {
    // 帶有擴充功能的解析器
    extensions := parser.CommonExtensions |
                  parser.AutoHeadingIDs |
                  parser.NoEmptyLineBeforeBlock
    p := parser.NewWithExtensions(extensions)
    doc := p.Parse(md)

    // 帶有選項的 HTML 渲染器
    htmlFlags := html.CommonFlags | html.HrefTargetBlank
    opts := html.RendererOptions{Flags: htmlFlags}
    renderer := html.NewRenderer(opts)

    return markdown.Render(doc, renderer)
}

func main() {
    md, _ := os.ReadFile("input.md")
    html := mdToHTML(md)
    os.WriteFile("output.html", html, 0644)
}
```

## 安全性：消毒輸出 (Sanitizing Output)

**重要提示：** gomarkdown 不會消毒 HTML 輸出。對於不受信任的輸入，請使用 Bluemonday：

```go
import (
    "github.com/microcosm-cc/bluemonday"
    "github.com/gomarkdown/markdown"
)

// 將 markdown 轉換為可能不安全的 HTML
maybeUnsafeHTML := markdown.ToHTML(md, nil, nil)

// 使用 Bluemonday 消毒
p := bluemonday.UGCPolicy()
safeHTML := p.SanitizeBytes(maybeUnsafeHTML)
```

### Bluemonday 原則 (Policies)

| 原則 | 描述 |
|--------|-------------|
| `UGCPolicy()` | 使用者產生的內容 (最常見) |
| `StrictPolicy()` | 移除所有 HTML |
| `StripTagsPolicy()` | 移除標籤，保留文字 |
| `NewPolicy()` | 建立自定義原則 |

## 處理 AST

### 存取 AST

```go
import (
    "github.com/gomarkdown/markdown/ast"
    "github.com/gomarkdown/markdown/parser"
)

p := parser.NewWithExtensions(parser.CommonExtensions)
doc := p.Parse(md)

// 走訪 AST
ast.WalkFunc(doc, func(node ast.Node, entering bool) ast.WalkStatus {
    if heading, ok := node.(*ast.Heading); ok && entering {
        fmt.Printf("找到第 %d 級標題\n", heading.Level)
    }
    return ast.GoToNext
})
```

### 自定義渲染器

```go
type MyRenderer struct {
    *html.Renderer
}

func (r *MyRenderer) RenderNode(w io.Writer, node ast.Node, entering bool) ast.WalkStatus {
    // 自定義渲染邏輯
    if heading, ok := node.(*ast.Heading); ok && entering {
        fmt.Fprintf(w, "<h%d class='custom'>", heading.Level)
        return ast.GoToNext
    }
    return r.Renderer.RenderNode(w, node, entering)
}
```

## 處理換行符

Windows 和 Mac 的換行符需要正規化：

```go
// 在解析前正規化換行符
normalized := parser.NormalizeNewlines(input)
html := markdown.ToHTML(normalized, nil, nil)
```

## 資源

- [套件文件](https://pkg.go.dev/github.com/gomarkdown/markdown)
- [進階處理指南](https://blog.kowalczyk.info/article/cxn3/advanced-markdown-processing-in-go.html)
- [GitHub 套件庫](https://github.com/gomarkdown/markdown)
- [CLI 工具](https://github.com/gomarkdown/mdtohtml)
- [Bluemonday 消毒工具](https://github.com/microcosm-cc/bluemonday)
