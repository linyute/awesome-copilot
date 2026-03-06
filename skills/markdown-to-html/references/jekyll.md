# Jekyll 參考

Jekyll 是一個靜態網站產生器，它能將 Markdown 內容轉換為完整的網站。它具備部落格功能，並為 GitHub Pages 提供支援。

## 安裝

### 先決條件

- Ruby 2.7.0 或更高版本
- RubyGems
- GCC 和 Make

### 安裝 Jekyll

```bash
# 安裝 Jekyll 和 Bundler
gem install jekyll bundler
```

### 特定平台安裝

```bash
# macOS (先安裝 Xcode CLI 工具)
xcode-select --install
gem install jekyll bundler

# Ubuntu/Debian
sudo apt-get install ruby-full build-essential zlib1g-dev
gem install jekyll bundler

# Windows (使用 RubyInstaller)
# 從 https://rubyinstaller.org/ 下載
gem install jekyll bundler
```

## 快速入門

### 建立新網站

```bash
# 建立新的 Jekyll 網站
jekyll new myblog

# 進入網站目錄
cd myblog

# 建構並提供服務
bundle exec jekyll serve

# 開啟 http://localhost:4000
```

### 目錄結構

```
myblog/
├── _config.yml      # 網站配置
├── _posts/          # 部落格文章
│   └── 2025-01-28-welcome.md
├── _layouts/        # 頁面模板
├── _includes/       # 可重複使用的元件
├── _data/           # 資料檔案 (YAML, JSON, CSV)
├── _sass/           # Sass 部分檔案
├── assets/          # CSS, JS, 圖片
├── index.md         # 首頁
└── Gemfile          # Ruby 相依性
```

## CLI 指令

| 指令 | 描述 |
|---------|-------------|
| `jekyll new <name>` | 建立新網站 |
| `jekyll build` | 建構到 `_site/` 目錄 |
| `jekyll serve` | 在本地建構並提供服務 |
| `jekyll clean` | 移除產生的檔案 |
| `jekyll doctor` | 檢查問題 |

### 建構選項

```bash
# 建構網站
bundle exec jekyll build

# 在生產環境中建構
JEKYLL_ENV=production bundle exec jekyll build

# 建構到自定義目錄
bundle exec jekyll build --destination ./public

# 使用增量再生進行建構
bundle exec jekyll build --incremental
```

### 服務選項

```bash
# 包含即時重新載入提供服務
bundle exec jekyll serve --livereload

# 包含草稿文章
bundle exec jekyll serve --drafts

# 指定連接埠
bundle exec jekyll serve --port 8080

# 繫結到所有介面
bundle exec jekyll serve --host 0.0.0.0
```

## 配置 (_config.yml)

```yaml
# 網站設定
title: 我的部落格
description: 一個很棒的部落格
baseurl: ""
url: "https://example.com"

# 建構設定
markdown: kramdown
theme: minima
plugins:
  - jekyll-feed
  - jekyll-seo-tag

# Kramdown 設定
kramdown:
  input: GFM
  syntax_highlighter: rouge
  hard_wrap: false

# 集合 (Collections)
collections:
  docs:
    output: true
    permalink: /docs/:name/

# 預設值
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "post"

# 排除處理
exclude:
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor
```

## Front Matter

每個內容檔案都需要 YAML 格式的 front matter：

```markdown
---
layout: post
title: "我的第一篇文章"
date: 2025-01-28 12:00:00 -0500
categories: blog tutorial
tags: [jekyll, markdown]
author: 小明
excerpt: "簡短的介紹..."
published: true
---

內容在此...
```

## Markdown 處理器

### Kramdown (預設)

```yaml
# _config.yml
markdown: kramdown
kramdown:
  input: GFM                    # GitHub Flavored Markdown
  syntax_highlighter: rouge
  syntax_highlighter_opts:
    block:
      line_numbers: true
```

### CommonMark

```ruby
# Gemfile
gem 'jekyll-commonmark-ghpages'
```

```yaml
# _config.yml
markdown: CommonMarkGhPages
commonmark:
  options: ["SMART", "FOOTNOTES"]
  extensions: ["strikethrough", "autolink", "table"]
```

## Liquid 模板

### 變數

```liquid
{{ page.title }}
{{ site.title }}
{{ content }}
{{ page.date | date: "%Y年%m月%d日" }}
```

### 迴圈

```liquid
{% for post in site.posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
    <p>{{ post.excerpt }}</p>
  </article>
{% endfor %}
```

### 條件判斷

```liquid
{% if page.title %}
  <h1>{{ page.title }}</h1>
{% endif %}

{% unless page.draft %}
  {{ content }}
{% endunless %}
```

### 包含 (Includes)

```liquid
{% include header.html %}
{% include footer.html param="value" %}
```

## 版面配置 (Layouts)

### 基本版面 (_layouts/default.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ page.title }} | {{ site.title }}</title>
  <link rel="stylesheet" href="{{ '/assets/css/style.css' | relative_url }}">
</head>
<body>
  {% include header.html %}
  <main>
    {{ content }}
  </main>
  {% include footer.html %}
</body>
</html>
```

### 文章版面 (_layouts/post.html)

```html
---
layout: default
---
<article>
  <h1>{{ page.title }}</h1>
  <time>{{ page.date | date: "%Y年%m月%d日" }}</time>
  {{ content }}
</article>
```

## 外掛程式

### 常見外掛程式

```ruby
# Gemfile
group :jekyll_plugins do
  gem 'jekyll-feed'        # RSS 摘要
  gem 'jekyll-seo-tag'     # SEO Meta 標籤
  gem 'jekyll-sitemap'     # XML 網站地圖
  gem 'jekyll-paginate'    # 分頁
  gem 'jekyll-archives'    # 封存頁面
end
```

### 使用外掛程式

```yaml
# _config.yml
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
```

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| Ruby 3.0+ webrick 錯誤 | 執行 `bundle add webrick` |
| 權限遭拒 | 使用 `--user-install` 或 rbenv |
| 建構緩慢 | 使用 `--incremental` |
| Liquid 錯誤 | 檢查是否有未逸出的 `{` `}` |
| 編碼問題 | 在配置中新增 `encoding: utf-8` |
| 外掛程式未載入 | 同時新增到 Gemfile 和 _config.yml |

## 資源

- [Jekyll 文件](https://jekyllrb.com/docs/)
- [Liquid 模板語言](https://shopify.github.io/liquid/)
- [Kramdown 文件](https://kramdown.gettalong.org/)
- [GitHub 套件庫](https://github.com/jekyll/jekyll)
- [Jekyll 佈景主題](https://jekyllthemes.io/)
