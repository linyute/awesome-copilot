# CSS 與樣式參考 (CSS & Styling Reference)

階層式樣式表 (Cascading Style Sheets)、版面配置系統以及現代樣式技術的全面參考。

## 核心概念

### CSS (階層式樣式表)

用於描述 HTML 文件呈現方式的樣式表語言。

**三種套用 CSS 的方式**：

1. **行內 (Inline)**：`<div style="color: blue;">`
2. **內部 (Internal)**：HTML 中的 `<style>` 標籤
3. **外部 (External)**：獨立的 `.css` 檔案（建議使用）

### 階層 (The Cascade)

當多個規則同時指向同一個元件時，用以決定套用哪一條 CSS 規則的演算法。

**優先權順序**（由高至低）：

1. 行內樣式
2. ID 選取器 (`#id`)
3. 類別選取器 (`.class`)、屬性選取器、虛擬類別
4. 元件選取器 (`div`、`p`)
5. 繼承屬性

**重要提示**：`!important` 宣告會覆蓋正常的權重計算（請謹慎使用）

### CSS 選取器 (CSS Selectors)

| 選取器 | 範例 | 說明 |
|----------|---------|-------------|
| 元件 (Element) | `p` | 選取所有 `<p>` 元件 |
| 類別 (Class) | `.button` | 選取具備 `class="button"` 的元件 |
| ID | `#header` | 選取具備 `id="header"` 的元件 |
| 全域 (Universal) | `*` | 選取所有元件 |
| 後代 (Descendant) | `div p` | `<div>` 內部的 `<p>`（任何層級） |
| 子代 (Child) | `div > p` | `<div>` 的直接子代 `<p>` |
| 相鄰兄弟 (Adjacent Sibling) | `h1 + p` | 緊接在 `<h1>` 後方的 `<p>` |
| 一般兄弟 (General Sibling) | `h1 ~ p` | 在 `<h1>` 之後的所有 `<p>` 兄弟元件 |
| 屬性 (Attribute) | `[type="text"]` | 具備特定屬性的元件 |
| 屬性包含 | `[href*="example"]` | 包含子字串 |
| 屬性開頭為 | `[href^="https"]` | 以字串開頭 |
| 屬性結尾為 | `[href$=".pdf"]` | 以字串結尾 |

### 虛擬類別 (Pseudo-Classes)

根據狀態或位置選取元件：

```css
/* 連結狀態 */
a:link { color: blue; }
a:visited { color: purple; }
a:hover { color: red; }
a:active { color: orange; }
a:focus { outline: 2px solid blue; }

/* 結構相關 */
li:first-child { font-weight: bold; }
li:last-child { border-bottom: none; }
li:nth-child(odd) { background: #f0f0f0; }
li:nth-child(3n) { color: red; }
p:not(.special) { color: gray; }

/* 表單狀態 */
input:required { border-color: red; }
input:valid { border-color: green; }
input:invalid { border-color: red; }
input:disabled { opacity: 0.5; }
input:checked + label { font-weight: bold; }
```

### 虛擬元件 (Pseudo-Elements)

對元件的特定部分套用樣式：

```css
/* 第一行/第一個字母 */
p::first-line { font-weight: bold; }
p::first-letter { font-size: 2em; }

/* 產生的內容 */
.quote::before { content: '"'; }
.quote::after { content: '"'; }

/* 選取內容 */
::selection { background: yellow; color: black; }

/* 預留位置 */
input::placeholder { color: #999; }
```

## 盒模型 (Box Model)

每個元件都是一個矩形盒子，包含：

1. **內容 (Content)**：實際內容（文字、圖片）
2. **內距 (Padding)**：內容周圍、邊框內部的空間
3. **邊框 (Border)**：包圍在內距外的線條
4. **外距 (Margin)**：邊框外部的空間

```css
.box {
  /* 內容尺寸 */
  width: 300px;
  height: 200px;
  
  /* 內距 */
  padding: 20px; /* 四週 */
  padding: 10px 20px; /* 垂直 | 水平 */
  padding: 10px 20px 15px 25px; /* 上 | 右 | 下 | 左 */
  
  /* 邊框 */
  border: 2px solid #333;
  border-radius: 8px;
  
  /* 外距 */
  margin: 20px auto; /* 垂直 | 水平 (auto 可置中) */
  
  /* Box-sizing 變更寬度/高度的運算方式 */
  box-sizing: border-box; /* 寬度/高度包含內距與邊框 */
}
```

## 版面配置系統 (Layout Systems)

### Flexbox (彈性盒模型)

一維版面配置系統（列或行）：

```css
.container {
  display: flex;
  
  /* 方向 */
  flex-direction: row; /* row | row-reverse | column | column-reverse */
  
  /* 換行 */
  flex-wrap: wrap; /* nowrap | wrap | wrap-reverse */
  
  /* 主軸對齊 (Main axis alignment) */
  justify-content: center; /* flex-start | flex-end | center | space-between | space-around | space-evenly */
  
  /* 交叉軸對齊 (Cross axis alignment) */
  align-items: center; /* flex-start | flex-end | center | stretch | baseline */
  
  /* 多行交叉軸對齊 */
  align-content: center; /* flex-start | flex-end | center | space-between | space-around | stretch */
  
  /* 項目間的間距 */
  gap: 1rem;
}

.item {
  /* 增長係數 */
  flex-grow: 1; /* 佔用可用空間 */
  
  /* 收縮係數 */
  flex-shrink: 1; /* 必要時可以收縮 */
  
  /* 基準尺寸 */
  flex-basis: 200px; /* 增長/收縮前的初始大小 */
  
  /* 簡寫 */
  flex: 1 1 200px; /* grow | shrink | basis */
  
  /* 個別對齊 */
  align-self: flex-end; /* 覆蓋容器的 align-items 設定 */
  
  /* 順序 */
  order: 2; /* 變更視覺順序 (預設：0) */
}
```

### CSS Grid (網格版面配置)

二維版面配置系統（行與列）：

```css
.container {
  display: grid;
  
  /* 定義欄位 (Columns) */
  grid-template-columns: 200px 1fr 1fr; /* 固定 | 彈性 | 彈性 */
  grid-template-columns: repeat(3, 1fr); /* 三個等寬欄位 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 回應式 */
  
  /* 定義列 (Rows) */
  grid-template-rows: 100px auto 50px; /* 固定 | 自動 | 固定 */
  
  /* 具名區域 */
  grid-template-areas:
    "header header header"
    "sidebar main main"
    "footer footer footer";
  
  /* 單元格間距 */
  gap: 1rem; /* 列與欄間距 */
  row-gap: 1rem;
  column-gap: 2rem;
  
  /* 對齊 */
  justify-items: start; /* 在單元格內水平對齊項目 */
  align-items: start; /* 在單元格內垂直對齊項目 */
  justify-content: center; /* 在容器內水平對齊整個網格 */
  align-content: center; /* 在容器內垂直對齊整個網格 */
}

.item {
  /* 跨越欄位 */
  grid-column: 1 / 3; /* 開始 / 結束 */
  grid-column: span 2; /* 跨越 2 欄 */
  
  /* 跨越列 */
  grid-row: 1 / 3;
  grid-row: span 2;
  
  /* 具名區域 */
  grid-area: header;
  
  /* 個別對齊 */
  justify-self: center; /* 水平對齊 */
  align-self: center; /* 垂直對齊 */
}
```

### Grid vs Flexbox

| 使用案例 | 最佳選擇 |
|----------|-------------|
| 一維版面配置（列或行） | Flexbox |
| 二維版面配置（行與列） | Grid |
| 沿單一軸線對齊項目 | Flexbox |
| 建立複雜的頁面佈局 | Grid |
| 在項目之間分配空間 | Flexbox |
| 精確控制行與列 | Grid |
| 內容優先的回應式設計 | Flexbox |
| 配置優先的回應式設計 | Grid |

## 定位 (Positioning)

### 定位類型

```css
/* Static (預設) - 正常流向 */
.static { position: static; }

/* Relative - 相對於正常位置的偏移 */
.relative {
  position: relative;
  top: 10px; /* 向下移動 10px */
  left: 20px; /* 向右移動 20px */
}

/* Absolute - 脫離流向，相對於最近的已定位祖先元件進行定位 */
.absolute {
  position: absolute;
  top: 0;
  right: 0;
}

/* Fixed - 脫離流向，相對於視埠 (Viewport) 進行定位 */
.fixed {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

/* Sticky - 根據捲動在 relative 與 fixed 之間切換 */
.sticky {
  position: sticky;
  top: 0; /* 捲動時貼齊頂部 */
}
```

### 內嵌屬性 (Inset Properties)

定位的簡寫方式：

```css
.element {
  position: absolute;
  inset: 0; /* 所有邊：top, right, bottom, left = 0 */
  inset: 10px 20px; /* 垂直 | 水平 */
  inset: 10px 20px 30px 40px; /* 上 | 右 | 下 | 左 */
}
```

### 堆疊上下文 (Stacking Context)

使用 `z-index` 控制層級：

```css
.behind { z-index: 1; }
.ahead { z-index: 10; }
.top { z-index: 100; }
```

**注意**：`z-index` 僅在已定位元件（非 `static`）上有效

## 回應式設計 (Responsive Design)

### 媒體查詢 (Media Queries)

根據裝置特性套用樣式：

```css
/* 行動裝置優先方法 */
.container {
  padding: 1rem;
}

/* 平板電腦及以上 */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}

/* 橫向模式 */
@media (orientation: landscape) {
  .header { height: 60px; }
}

/* 高 DPI 螢幕 */
@media (min-resolution: 192dpi) {
  .logo { background-image: url('logo@2x.png'); }
}

/* 深色模式偏好 */
@media (prefers-color-scheme: dark) {
  body {
    background: #222;
    color: #fff;
  }
}

/* 減少動態偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 回應式單位 (Responsive Units)

| 單位 | 說明 | 範例 |
|------|-------------|---------|
| `px` | 像素（絕對單位） | `16px` |
| `em` | 相對於父元件的 font-size | `1.5em` |
| `rem` | 相對於根元件的 font-size | `1.5rem` |
| `%` | 相對於父元件 | `50%` |
| `vw` | 視埠寬度 (1vw = 視埠寬度的 1%) | `50vw` |
| `vh` | 視埠高度 | `100vh` |
| `vmin` | vw 或 vh 兩者中較小的一個 | `10vmin` |
| `vmax` | vw 或 vh 兩者中較大的一個 | `10vmax` |
| `ch` | 字元 "0" 的寬度 | `40ch` |
| `fr` | 可用空間的比例（僅限 Grid） | `1fr` |

### 回應式圖片

```css
img {
  max-width: 100%;
  height: auto;
}

/* 使用 picture 元件進行藝術指導 (Art direction) */
```

```html
<picture>
  <source media="(min-width: 1024px)" srcset="large.jpg">
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <img src="small.jpg" alt="回應式圖片">
</picture>
```

## 字體排版 (Typography)

```css
.text {
  /* 字型系列 */
  font-family: 'Helvetica Neue', Arial, sans-serif;
  
  /* 字型大小 */
  font-size: 16px; /* 基礎大小 */
  font-size: 1rem; /* 相對於根元件 */
  font-size: clamp(14px, 2vw, 20px); /* 具備最小/最大值的回應式大小 */
  
  /* 字型粗細 */
  font-weight: normal; /* 400 */
  font-weight: bold; /* 700 */
  font-weight: 300; /* 細體 */
  
  /* 字型樣式 */
  font-style: italic;
  
  /* 行高 */
  line-height: 1.5; /* font-size 的 1.5 倍 */
  line-height: 24px;
  
  /* 字距 */
  letter-spacing: 0.05em;
  
  /* 文字對齊 */
  text-align: left; /* left | right | center | justify */
  
  /* 文字裝飾 */
  text-decoration: underline;
  text-decoration: none; /* 移除連結下劃線 */
  
  /* 文字轉換 */
  text-transform: uppercase; /* uppercase | lowercase | capitalize */
  
  /* 詞距 */
  word-spacing: 0.1em;
  
  /* 空白處理 */
  white-space: nowrap; /* 不換行 */
  white-space: pre-wrap; /* 保留空格，自動換行 */
  
  /* 文字溢位 */
  overflow: hidden;
  text-overflow: ellipsis; /* 文字溢位時顯示 ... */
  
  /* 單字斷行 */
  word-wrap: break-word; /* 斷開長單字 */
  overflow-wrap: break-word; /* 現代版本 */
}
```

## 色彩 (Colors)

```css
.colors {
  /* 具名色彩 */
  color: red;
  
  /* 十六進位 (Hex) */
  color: #ff0000; /* 紅色 */
  color: #f00; /* 簡寫 */
  color: #ff0000ff; /* 具備 Alpha 通道 */
  
  /* RGB */
  color: rgb(255, 0, 0);
  color: rgba(255, 0, 0, 0.5); /* 具備 Alpha 通道 */
  color: rgb(255 0 0 / 0.5); /* 現代語法 */
  
  /* HSL (色相、飽和度、亮度) */
  color: hsl(0, 100%, 50%); /* 紅色 */
  color: hsla(0, 100%, 50%, 0.5); /* 具備 Alpha 通道 */
  color: hsl(0 100% 50% / 0.5); /* 現代語法 */
  
  /* 色彩關鍵字 */
  color: currentColor; /* 繼承色彩 */
  color: transparent;
}
```

### CSS 色彩空間 (CSS Color Space)

用於更廣色域的現代色彩空間：

```css
.modern-colors {
  /* Display P3 (Apple 裝置) */
  color: color(display-p3 1 0 0);
  
  /* Lab 色彩空間 */
  color: lab(50% 125 0);
  
  /* LCH 色彩空間 */
  color: lch(50% 125 0deg);
}
```

## 動畫與過渡 (Animations and Transitions)

### 過渡 (Transitions)

狀態之間的平滑變更：

```css
.button {
  background: blue;
  color: white;
  transition: all 0.3s ease;
  /* transition: 屬性 持續時間 時間函式 延遲 */
}

.button:hover {
  background: darkblue;
  transform: scale(1.05);
}

/* 個別屬性 */
.element {
  transition-property: opacity, transform;
  transition-duration: 0.3s, 0.5s;
  transition-timing-function: ease, ease-in-out;
  transition-delay: 0s, 0.1s;
}
```

### 關鍵幀動畫 (Keyframe Animations)

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeIn 0.5s ease forwards;
  /* animation: 名稱 持續時間 時間函式 延遲 迭代次數 方向 填滿模式 */
}

/* 多個關鍵幀 */
@keyframes slide {
  0% { transform: translateX(0); }
  50% { transform: translateX(100px); }
  100% { transform: translateX(0); }
}

.slider {
  animation: slide 2s infinite alternate;
}
```

## 轉換 (Transforms)

```css
.transform {
  /* Translate (移動) */
  transform: translate(50px, 100px); /* X, Y */
  transform: translateX(50px);
  transform: translateY(100px);
  
  /* Rotate (旋轉) */
  transform: rotate(45deg);
  
  /* Scale (縮放) */
  transform: scale(1.5); /* 150% 大小 */
  transform: scale(2, 0.5); /* X, Y 不同縮放比 */
  
  /* Skew (傾斜) */
  transform: skew(10deg, 5deg);
  
  /* 多重轉換 */
  transform: translate(50px, 0) rotate(45deg) scale(1.2);
  
  /* 3D 轉換 */
  transform: rotateX(45deg) rotateY(30deg);
  transform: perspective(500px) translateZ(100px);
}
```

## CSS 變數（自訂屬性） (CSS Variables)

```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --spacing: 1rem;
  --border-radius: 4px;
}

.element {
  color: var(--primary-color);
  padding: var(--spacing);
  border-radius: var(--border-radius);
  
  /* 具備後備值 */
  color: var(--accent-color, red);
}

/* 動態變更 */
.dark-theme {
  --primary-color: #0056b3;
  --background: #222;
  --text: #fff;
}
```

## CSS 預處理器 (CSS Preprocessors)

### 常見特性

- 變數 (Variables)
- 巢狀 (Nesting)
- Mixins（可重用的樣式）
- 函式 (Functions)
- 匯入 (Imports)

**熱門預處理器**：Sass/SCSS、Less、Stylus

## 最佳實踐 (Best Practices)

### 應做事項 (Do's)

- ✅ 使用外部樣式表
- ✅ 優先使用類別選取器而非 ID 選取器
- ✅ 保持低權重 (Specificity)
- ✅ 使用回應式單位 (rem, em, %)
- ✅ 採用行動裝置優先方法
- ✅ 使用 CSS 變數進行主題設定
- ✅ 邏輯性地組織 CSS
- ✅ 使用簡寫屬性
- ✅ 為生產環境縮減 CSS 檔案

### 禁忌事項 (Don'ts)

- ❌ 過度使用 `!important`
- ❌ 使用行內樣式
- ❌ 使用固定的像素寬度
- ❌ 過度巢狀選取器
- ❌ 手動撰寫供應商前綴 (Vendor prefixes)（請使用 Autoprefixer）
- ❌ 忘記進行跨瀏覽器測試
- ❌ 使用 ID 進行樣式設定
- ❌ 忽略 CSS 權重問題

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：

- 對齊容器 (Alignment container)
- 對齊對象 (Alignment subject)
- 長寬比 (Aspect ratio)
- 基準線 (Baseline)
- 區塊（CSS）(Block (CSS))
- 週邊外框 (Bounding box)
- 交叉軸 (Cross Axis)
- CSS
- CSS 物件模型 (CSSOM)
- CSS 像素 (CSS pixel)
- CSS 預處理器 (CSS preprocessor)
- 描述符 (CSS) (Descriptor (CSS))
- 後備對齊 (Fallback alignment)
- 彈性 (Flex)
- Flex 容器 (Flex container)
- Flex 項目 (Flex item)
- Flexbox
- 流向相關值 (Flow relative values)
- 網格 (Grid)
- 網格區域 (Grid areas)
- 網格軸 (Grid Axis)
- 網格單元 (Grid Cell)
- 網格行 (Grid Column)
- 網格容器 (Grid container)
- 網格線 (Grid lines)
- 網格列 (Grid Row)
- 網格軌跡 (Grid Tracks)
- 間距 (Gutters)
- 墨水溢位 (Ink overflow)
- 內嵌屬性 (Inset properties)
- 版面配置模式 (Layout mode)
- 邏輯屬性 (Logical properties)
- 主軸 (Main axis)
- 媒體查詢 (Media query)
- 物理屬性 (Physical properties)
- 像素 (Pixel)
- 屬性（CSS）(Property (CSS))
- 虛擬類別 (Pseudo-class)
- 虛擬元件 (Pseudo-element)
- 選取器（CSS）(Selector (CSS))
- 堆疊上下文 (Stacking context)
- 樣式來源 (Style origin)
- 樣式表 (Stylesheet)
- 供應商前綴 (Vendor prefix)

## 額外資源

- [MDN CSS 參考](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [CSS Tricks Flexbox 完整指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Tricks Grid 完整指南](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Can I Use](https://caniuse.com/) - 瀏覽器相容性表格
