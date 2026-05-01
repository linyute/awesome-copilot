---
name: md-to-docx
description: 將 Markdown 檔案轉換為格式專業、包含內建 PNG 圖片的 Word (.docx) 文件 — 純 JavaScript 實作，無需外部工具
---

# Markdown 轉 Word (.docx) 技能

將 Markdown (`.md`) 檔案轉換為格式專業、包含內建 PNG 圖片的 Word (`.docx`) 文件。透過 `docx` 和 `marked` npm 套件使用 **純 JavaScript** 實作 — 無需 Pandoc、LibreOffice 或任何原生二進位檔案。

## 如何轉換

```bash
# 安裝相依性 (一次性，在 scripts 資料夾中執行)
cd skills/md-to-docx/scripts && npm install

# 進行轉換 (在工作區根目錄執行)
node skills/md-to-docx/scripts/md-to-docx.mjs <input.md> [output.docx]
```

如果省略 `output.docx`，則預設在目前目錄中產生 `<input-basename>.docx`。

## 技能資料夾內容

| 檔案 | 用途 |
|------|---------|
| `SKILL.md` | 此指令檔案 |
| `scripts/md-to-docx.mjs` | Node.js Markdown 轉 Word 轉換器 |
| `scripts/package.json` | 相依性 (`docx`, `marked`) |

## 前提條件

| 需求 | 版本 | 備註 |
|-------------|---------|-------|
| **Node.js** | 18+ | 必要執行階段 |
| **`docx`** | 9+ | 純 JS Word 文件產生器 |
| **`marked`** | 15+ | Markdown 解析器 |

無需原生二進位檔案。無需系統層級安裝。適用於 Windows、macOS 和 Linux。

## 功能

此轉換器可：

- **提取 YAML front-matter** — 使用 `title`, `date`, `version`, `audience` 產生標題頁
- **產生標題頁** — 包含專案名稱、副標題、日期、版本和對象
- **產生目錄** — 根據 H1-H3 標題建置
- **嵌入 PNG 圖片** — 解析相對於輸入 `.md` 檔案的 `![alt](path)` 參考，讀取 PNG 並將其內嵌在 Word 文件中
- **具備樣式的輸出** — 使用 Calibri 字型、彩色標題 (`#1F3864`)、具備交替列顏色的樣式表格、Consolas 字型的程式碼區塊
- **處理所有 Markdown 元素** — 包含標題、段落、表格、程式碼區塊、清單、圖片、連結、水平線

## 圖片嵌入

轉換器會自動嵌入 Markdown 中參考的 PNG 圖片：

```markdown
![高階架構圖](diagrams/high-level-architecture.drawio.png)
```

圖片路徑會解析為**相對於輸入 Markdown 檔案**的路徑。程式會讀取 PNG，從 PNG 標頭提取尺寸，並在保持長寬比的前提下，將圖片縮放至 6 英吋寬度以內。

若找不到圖片檔案，則會插入預留位置 `[找不到圖片：<路徑>]`。

## Front-Matter 格式

```yaml
---
title: 專案名稱 — 專案摘要
date: 2025-01-15
version: 1.0
audience: 工程團隊、架構師、利益相關者
---
```

標題會根據 `—` 或 `–` 分割成主標題和副標題，用於標題頁。
