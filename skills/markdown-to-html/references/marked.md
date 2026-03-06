# Marked

## 快速轉換方法

`SKILL.md` 中 `### 快速轉換方法` 的擴充部分。

### 方法 1：CLI (建議用於單個檔案)

```bash
# 將檔案轉換為 HTML
marked -i input.md -o output.html

# 直接轉換字串
marked -s "# Hello World"

# 輸出：<h1>Hello World</h1>
```

### 方法 2：Node.js 指令稿

```javascript
import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';

const markdown = readFileSync('input.md', 'utf-8');
const html = marked.parse(markdown);
writeFileSync('output.html', html);
```

### 方法 3：瀏覽器用法

```html
<script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
<script>
  const html = marked.parse('# Markdown Content');
  document.getElementById('output').innerHTML = html;
</script>
```

---

## 逐步工作流

`SKILL.md` 中 `### 逐步工作流` 的擴充部分。

### 工作流 1：單個檔案轉換

1. 確保已安裝 marked：`npm install -g marked`
2. 執行轉換：`marked -i README.md -o README.html`
3. 驗證輸出檔案已建立

### 工作流 2：批次轉換 (多個檔案)

建立一個指令稿 `convert-all.js`：

```javascript
import { marked } from 'marked';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const inputDir = './docs';
const outputDir = './html';

readdirSync(inputDir)
  .filter(file => file.endsWith('.md'))
  .forEach(file => {
    const markdown = readFileSync(join(inputDir, file), 'utf-8');
    const html = marked.parse(markdown);
    const outputFile = basename(file, '.md') + '.html';
    writeFileSync(join(outputDir, outputFile), html);
    console.log(`已轉換：${file} → ${outputFile}`);
  });
```

使用此指令執行：`node convert-all.js`

### 工作流 3：使用自定義選項進行轉換

```javascript
import { marked } from 'marked';

// 配置選項
marked.setOptions({
  gfm: true,           // GitHub Flavored Markdown
  breaks: true,        // 將 \n 轉換為 <br>
  pedantic: false,     // 不遵循原始的 markdown.pl
});

const html = marked.parse(markdownContent);
```

### 工作流 4：完整的 HTML 文件

將轉換後的內容包裹在完整的 HTML 模板中：

```javascript
import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'fs';

const markdown = readFileSync('input.md', 'utf-8');
const content = marked.parse(markdown);

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文件</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
  </style>
</head>
<body>
${content}
</body>
</html>`;

writeFileSync('output.html', html);
```
