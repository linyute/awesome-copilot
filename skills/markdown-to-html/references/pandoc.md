# Pandoc 參考

Pandoc 是一款通用的文件轉換器，可以在眾多標記格式之間進行轉換，包括 Markdown、HTML、LaTeX、Word 等等。

## 安裝

### Windows

```powershell
# 使用 Chocolatey
choco install pandoc

# 使用 Scoop
scoop install pandoc

# 或從 https://pandoc.org/installing.html 下載安裝程式
```

### macOS

```bash
# 使用 Homebrew
brew install pandoc
```

### Linux

```bash
# Debian/Ubuntu
sudo apt-get install pandoc

# Fedora
sudo dnf install pandoc

# 或從 https://pandoc.org/installing.html 下載
```

## 基本用法

### 將 Markdown 轉換為 HTML

```bash
# 基本轉換
pandoc input.md -o output.html

# 產生包含頁首的獨立文件
pandoc input.md -s -o output.html

# 使用自定義 CSS
pandoc input.md -s --css=style.css -o output.html
```

### 轉換為其他格式

```bash
# 轉換為 PDF (需要 LaTeX)
pandoc input.md -s -o output.pdf

# 轉換為 Word
pandoc input.md -s -o output.docx

# 轉換為 LaTeX
pandoc input.md -s -o output.tex

# 轉換為 EPUB
pandoc input.md -s -o output.epub
```

### 從其他格式轉換

```bash
# HTML 轉換為 Markdown
pandoc -f html -t markdown input.html -o output.md

# Word 轉換為 Markdown
pandoc input.docx -o output.md

# LaTeX 轉換為 HTML
pandoc -f latex -t html input.tex -o output.html
```

## 常見選項

| 選項 | 描述 |
|--------|-------------|
| `-f, --from <format>` | 輸入格式 |
| `-t, --to <format>` | 輸出格式 |
| `-s, --standalone` | 產生獨立文件 |
| `-o, --output <file>` | 輸出檔案 |
| `--toc` | 包含目錄 |
| `--toc-depth <n>` | 目錄深度 (預設值：3) |
| `-N, --number-sections` | 為章節標題編號 |
| `--css <url>` | 連結到 CSS 樣式表 |
| `--template <file>` | 使用自定義模板 |
| `--metadata <key>=<value>` | 設定 Metadata |
| `--mathml` | 針對數學運算式使用 MathML |
| `--mathjax` | 針對數學運算式使用 MathJax |
| `-V, --variable <key>=<value>` | 設定模板變數 |

## Markdown 擴充功能

Pandoc 支援許多 Markdown 擴充功能：

```bash
# 啟用特定擴充功能
pandoc -f markdown+emoji+footnotes input.md -o output.html

# 停用特定擴充功能
pandoc -f markdown-pipe_tables input.md -o output.html

# 使用嚴格的 Markdown 語法
pandoc -f markdown_strict input.md -o output.html
```

### 常見擴充功能

| 擴充功能 | 描述 |
|-----------|-------------|
| `pipe_tables` | 管道表格 (預設為開啟) |
| `footnotes` | 支援註腳 |
| `emoji` | 表情符號簡碼 |
| `smart` | 智慧引號與破折號 |
| `task_lists` | 任務清單核取方塊 |
| `strikeout` | 刪除線文字 |
| `superscript` | 上標文字 |
| `subscript` | 下標文字 |
| `raw_html` | 原始 HTML 透傳 |

## 模板 (Templates)

### 使用內建模板

```bash
# 檢視預設模板
pandoc -D html

# 使用自定義模板
pandoc --template=mytemplate.html input.md -o output.html
```

### 模板變數

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>$title$</title>
  $for(css)$
  <link rel="stylesheet" href="$css$">
  $endfor$
</head>
<body>
$body$
</body>
</html>
```

## YAML Metadata

在您的 Markdown 檔案中包含 Metadata：

```markdown
---
title: 我的文件
author: 小明
date: 2025-01-28
abstract: |
  這是摘要內容。
---

# 簡介

在此輸入文件內容...
```

## 篩選器 (Filters)

### 使用 Lua 篩選器

```bash
pandoc --lua-filter=filter.lua input.md -o output.html
```

Lua 篩選器範例 (`filter.lua`)：

```lua
function Header(el)
  if el.level == 1 then
    el.classes:insert("main-title")
  end
  return el
end
```

### 使用 Pandoc 篩選器

```bash
pandoc --filter pandoc-citeproc input.md -o output.html
```

## 批次轉換

### Bash 指令稿

```bash
#!/bin/bash
for file in *.md; do
  pandoc "$file" -s -o "${file%.md}.html"
done
```

### PowerShell 指令稿

```powershell
Get-ChildItem -Filter *.md | ForEach-Object {
  $output = $_.BaseName + ".html"
  pandoc $_.Name -s -o $output
}
```

## 資源

- [Pandoc 使用者指南](https://pandoc.org/MANUAL.html)
- [Pandoc 演示](https://pandoc.org/demos.html)
- [Pandoc 常見問題解答 (FAQ)](https://pandoc.org/faqs.html)
- [GitHub 套件庫](https://github.com/jgm/pandoc)
