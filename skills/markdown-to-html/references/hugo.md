# Hugo 參考

Hugo 是世界上速度最快的靜態網站產生器。它能在毫秒內建構網站，並支援進階內容管理功能。

## 安裝

### Windows

```powershell
# 使用 Chocolatey
choco install hugo-extended

# 使用 Scoop
scoop install hugo-extended

# 使用 Winget
winget install Hugo.Hugo.Extended
```

### macOS

```bash
# 使用 Homebrew
brew install hugo
```

### Linux

```bash
# Debian/Ubuntu (snap)
snap install hugo --channel=extended

# 使用套件管理員 (可能不是最新版本)
sudo apt-get install hugo

# 或從 https://gohugo.io/installation/ 下載
```

## 快速入門

### 建立新網站

```bash
# 建立網站
hugo new site mysite
cd mysite

# 初始化 git 並新增佈景主題
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
echo "theme = 'ananke'" >> hugo.toml

# 建立第一篇文章
hugo new content posts/my-first-post.md

# 啟動開發伺服器
hugo server -D
```

### 目錄結構

```
mysite/
├── archetypes/      # 內容模板
│   └── default.md
├── assets/          # 待處理資產 (SCSS, JS)
├── content/         # Markdown 內容
│   └── posts/
├── data/            # 資料檔案 (YAML, JSON, TOML)
├── i18n/            # 國際化 (多語系)
├── layouts/         # 模板
│   ├── _default/
│   ├── partials/
│   └── shortcodes/
├── static/          # 靜態檔案 (按原樣複製)
├── themes/          # 佈景主題
└── hugo.toml        # 配置檔案
```

## CLI 指令

| 指令 | 描述 |
|---------|-------------|
| `hugo new site <name>` | 建立新網站 |
| `hugo new content <path>` | 建立內容檔案 |
| `hugo` | 建構到 `public/` 目錄 |
| `hugo server` | 啟動開發伺服器 |
| `hugo mod init` | 初始化 Hugo 模組 (Modules) |
| `hugo mod tidy` | 清理模組 |

### 建構選項

```bash
# 基本建構
hugo

# 包含縮減功能的建構
hugo --minify

# 包含草稿的建構
hugo -D

# 針對特定環境進行建構
hugo --environment production

# 建構到自定義目錄
hugo -d ./dist

# 詳細輸出
hugo -v
```

### 伺服器選項

```bash
# 包含草稿啟動
hugo server -D

# 繫結到所有介面
hugo server --bind 0.0.0.0

# 自定義連接埠
hugo server --port 8080

# 停用即時重新載入
hugo server --disableLiveReload

# 導覽至變更的內容
hugo server --navigateToChanged
```

## 配置 (hugo.toml)

```toml
# 基本設定
baseURL = 'https://example.com/'
languageCode = 'en-us'
title = '我的 Hugo 網站'
theme = 'ananke'

# 建構設定
[build]
  writeStats = true

# Markdown 配置
[markup]
  [markup.goldmark]
    [markup.goldmark.extensions]
      definitionList = true
      footnote = true
      linkify = true
      strikethrough = true
      table = true
      taskList = true
    [markup.goldmark.parser]
      autoHeadingID = true
      autoHeadingIDType = 'github'
    [markup.goldmark.renderer]
      unsafe = false
  [markup.highlight]
    style = 'monokai'
    lineNos = true

# 分類法 (Taxonomies)
[taxonomies]
  category = 'categories'
  tag = 'tags'
  author = 'authors'

# 選單
[menus]
  [[menus.main]]
    name = '首頁'
    pageRef = '/'
    weight = 10
  [[menus.main]]
    name = '文章'
    pageRef = '/posts'
    weight = 20

# 參數
[params]
  description = '我的超讚網站'
  author = '小明'
```

## Front Matter

Hugo 支援 TOML、YAML 和 JSON 格式的 front matter：

### TOML (預設)

```markdown
+++
title = '我的第一篇文章'
date = 2025-01-28T12:00:00-05:00
draft = false
tags = ['hugo', '教學']
categories = ['部落格']
author = '小明'
+++

內容在此...
```

### YAML

```markdown
---
title: "我的第一篇文章"
date: 2025-01-28T12:00:00-05:00
draft: false
tags: ["hugo", "教學"]
---

內容在此...
```

## 模板 (Templates)

### 基礎模板 (_default/baseof.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ .Title }} | {{ .Site.Title }}</title>
  {{ partial "head.html" . }}
</head>
<body>
  {{ partial "header.html" . }}
  <main>
    {{ block "main" . }}{{ end }}
  </main>
  {{ partial "footer.html" . }}
</body>
</html>
```

### 單一頁面 (_default/single.html)

```html
{{ define "main" }}
<article>
  <h1>{{ .Title }}</h1>
  <time>{{ .Date.Format "2006年1月2日" }}</time>
  {{ .Content }}
</article>
{{ end }}
```

### 列表頁面 (_default/list.html)

```html
{{ define "main" }}
<h1>{{ .Title }}</h1>
{{ range .Pages }}
  <article>
    <h2><a href="{{ .Permalink }}">{{ .Title }}</a></h2>
    <p>{{ .Summary }}</p>
  </article>
{{ end }}
{{ end }}
```

## Shortcodes

### 內建 Shortcodes

```markdown
{{< figure src="/images/photo.jpg" title="我的照片" >}}

{{< youtube dQw4w9WgXcQ >}}

{{< gist user 12345 >}}

{{< highlight go >}}
fmt.Println("Hello")
{{< /highlight >}}
```

### 自定義 Shortcode (layouts/shortcodes/alert.html)

```html
<div class="alert alert-{{ .Get "type" | default "info" }}">
  {{ .Inner | markdownify }}
</div>
```

用法：

```markdown
{{< alert type="warning" >}}
**警告：** 這很重要！
{{< /alert >}}
```

## 內容組織

### 頁面束 (Page Bundles)

```
content/
├── posts/
│   └── my-post/           # 頁面束
│       ├── index.md       # 內容
│       └── image.jpg      # 資源
└── _index.md              # 章節頁面
```

### 存取資源

```html
{{ $image := .Resources.GetMatch "image.jpg" }}
{{ with $image }}
  <img src="{{ .RelPermalink }}" alt="...">
{{ end }}
```

## Hugo Pipes (資產處理)

### SCSS 編譯

```html
{{ $styles := resources.Get "scss/main.scss" | toCSS | minify }}
<link rel="stylesheet" href="{{ $styles.RelPermalink }}">
```

### JavaScript 組合 (Bundling)

```html
{{ $js := resources.Get "js/main.js" | js.Build | minify }}
<script src="{{ $js.RelPermalink }}"></script>
```

## 分類法 (Taxonomies)

### 配置

```toml
[taxonomies]
  tag = 'tags'
  category = 'categories'
```

### 在 Front Matter 中使用

```markdown
+++
tags = ['go', 'hugo']
categories = ['教學']
+++
```

### 列出分類項目

```html
{{ range .Site.Taxonomies.tags }}
  <a href="{{ .Page.Permalink }}">{{ .Page.Title }} ({{ .Count }})</a>
{{ end }}
```

## 多語系網站

```toml
defaultContentLanguage = 'en'

[languages]
  [languages.en]
    title = 'My Site'
    weight = 1
  [languages.zh-tw]
    title = '我的網站'
    weight = 2
```

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 找不到頁面 (Page not found) | 檢查配置中的 `baseURL` |
| 佈景主題未載入 | 驗證 `themes/` 或 Hugo 模組中的佈景主題路徑 |
| 建構緩慢 | 使用 `--templateMetrics` 偵錯 |
| 原始 HTML 未顯示 | 在 goldmark 配置中設定 `unsafe = true` |
| 圖片未載入 | 檢查 `static/` 資料夾結構 |
| 模組錯誤 | 執行 `hugo mod tidy` |
| CSS 未更新 | 清除瀏覽器快取或使用指紋辨識 (fingerprinting) |

## 資源

- [Hugo 文件](https://gohugo.io/documentation/)
- [Hugo 佈景主題](https://themes.gohugo.io/)
- [Hugo 論壇 (Discourse)](https://discourse.gohugo.io/)
- [GitHub 套件庫](https://github.com/gohugoio/hugo)
- [快速參考](https://gohugo.io/quick-reference/)
