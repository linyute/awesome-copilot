---
name: drawio
description: 產生 draw.io 圖表為 .drawio 檔案，並匯出為包含嵌入 XML 的 PNG/SVG/PDF
---

# Draw.io 圖表技能

產生 draw.io 圖表為原生的 `.drawio` 檔案，並將其匯出為可嵌入 Word 文件的 PNG 圖片。

## 如何建立圖表

1. 為請求的圖表**產生 `mxGraphModel` 格式的 draw.io XML**
2. 使用建立/編輯檔案工具將 **XML 寫入** `.drawio` 檔案
3. 使用隨附的匯出指令碼**匯出為 PNG**

## 隨附的匯出指令碼

此技能包含 `drawio-to-png.mjs`，這是一個具備兩個算繪後端的 Node.js 匯出指令碼：

1. **draw.io CLI** (像素級完美，速度最快) — 如果已安裝 draw.io 桌面版，則自動使用
2. **無頭瀏覽器中的官方 draw.io 檢視器** (像素級完美，需要 Chromium/Edge) — 當 CLI 不可用時作為備援

### 用法

```bash
# 安裝相依性 (一次性，在 scripts 資料夾中執行)
cd skills/drawio/scripts && npm install

# 匯出單一圖表
node skills/drawio/scripts/drawio-to-png.mjs <input.drawio> [output.png]

# 匯出目錄中所有的 .drawio 檔案
node skills/drawio/scripts/drawio-to-png.mjs --dir <directory>

# 強制使用特定的算繪器
node skills/drawio/scripts/drawio-to-png.mjs --renderer=cli|viewer|auto <input.drawio>
```

### 技能資料夾內容

| 檔案 | 用途 |
|------|---------|
| `SKILL.md` | 此指令檔案 |
| `scripts/drawio-to-png.mjs` | Node.js 匯出指令碼 (CLI + 瀏覽器備援) |
| `scripts/package.json` | 相依性 (`puppeteer-core`) |

## 支援的匯出格式

| 格式 | 嵌入 XML | 備註 |
|--------|-----------|-------|
| `png` | 是 | 隨處可視，可在 draw.io 中編輯 |
| `svg` | 是 | 可縮放，可在 draw.io 中編輯 |
| `pdf` | 是 | 可列印，可在 draw.io 中編輯 |

## Draw.io XML 樣式慣例

使用這些樣式以確保圖表的一致性與專業性：

```xml
<!-- 主要服務 (醒目提示) -->
<mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;strokeWidth=2;arcSize=12;shadow=1;" />

<!-- 外部系統 -->
<mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;" />

<!-- 成功/處理階段 -->
<mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" />

<!-- 警告/品質閘道 -->
<mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" />

<!-- 錯誤/失敗路徑 -->
<mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" />

<!-- 資料儲存 (圓柱體) -->
<mxCell style="shape=cylinder3;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;" />

<!-- 箭頭 -->
<mxCell style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#6c8ebf;strokeWidth=2;" />
```

## 定位 draw.io CLI

首先嘗試 `drawio` (如果已加入 PATH 則有效)，否則退而求其次：

- **Windows**: `"C:\Program Files\draw.io\draw.io.exe"`
- **macOS**: `/Applications/draw.io.app/Contents/MacOS/draw.io`
- **Linux**: `drawio` (透過 snap/apt/flatpak)

### CLI 匯出指令

```bash
drawio -x -f png -e -b 10 -o <output.png> <input.drawio>
```

旗標： `-x` (匯出)、`-f` (格式)、`-e` (嵌入圖表 XML)、`-b` (邊框)、`-o` (輸出路徑)。
