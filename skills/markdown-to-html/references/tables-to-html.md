# 表格轉換為 HTML

## 建立表格

### Markdown

```markdown

| 第一個標題 | 第二個標題 |
| ---------- | ---------- |
| 內容儲存格 | 內容儲存格 |
| 內容儲存格 | 內容儲存格 |
```

### 剖析後的 HTML

```html
<table>
 <thead>
  <tr>
   <th>第一個標題</th>
   <th>第二個標題</th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>內容儲存格</td>
   <td>內容儲存格</td>
  </tr>
  <tr>
   <td>內容儲存格</td>
   <td>內容儲存格</td>
  </tr>
 </tbody>
</table>
```

### Markdown

```markdown
| 指令       | 描述                         |
| ---------- | ---------------------------- |
| git status | 列出所有新檔案或修改過的檔案 |
| git diff   | 顯示尚未暫存的檔案差異       |
```

### 剖析後的 HTML

```html
<table>
 <thead>
  <tr>
   <th>指令</th>
   <th>描述</th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>git status</td>
   <td>列出所有新檔案或修改過的檔案</td>
  </tr>
  <tr>
   <td>git diff</td>
   <td>顯示尚未暫存的檔案差異</td>
  </tr>
 </tbody>
</table>
```

## 格式化表格中的內容

### Markdown

```markdown
| 指令         | 描述                           |
| ------------ | ------------------------------ |
| `git status` | 列出所有*新檔案或修改過的*檔案 |
| `git diff`   | 顯示**尚未**暫存的檔案差異     |
```

### 剖析後的 HTML

```html
<table>
 <thead>
  <tr>
   <th>指令</th>
   <th>描述</th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td><code>git status</code></td>
   <td>列出所有<em>新檔案或修改過的</em>檔案</td>
  </tr>
  <tr>
   <td><code>git diff</code></td>
   <td>顯示<strong>尚未</strong>暫存的檔案差異</td>
  </tr>
 </tbody>
</table>
```

### Markdown

```markdown
| 左對齊     |  置中對齊  |     右對齊 |
| :--------- | :--------: | ---------: |
| git status | git status | git status |
| git diff   |  git diff  |   git diff |
```

### 剖析後的 HTML

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

### Markdown

```markdown
| 名稱   | 字元 |
| ------ | ---- |
| 反引號 | `    |
| 管道   | \|   |
```

### 剖析後的 HTML

```html
<table>
 <thead>
  <tr>
   <th>名稱</th>
   <th>字元</th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>反引號</td>
   <td>`</td>
  </tr>
  <tr>
   <td>管道</td>
   <td>|</td>
  </tr>
 </tbody>
</table>
```
