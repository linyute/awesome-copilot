# CSS 樣式設定參考

這是一份整合式的參考資料，涵蓋了 CSS 屬性、選擇器、虛擬類別 (pseudo-classes)、At-rules、盒模型 (box model)、Flexbox、Grid 以及媒體查詢 (media queries)。

---

## 目錄

1. [CSS 屬性參考](#1-css-properties-reference)
2. [CSS 選擇器](#2-css-selectors)
3. [虛擬類別與虛擬元件](#3-pseudo-classes-and-pseudo-elements)
4. [CSS At-Rules](#4-css-at-rules)
5. [CSS 樣式設定基礎](#5-css-styling-basics)
6. [盒模型](#6-the-box-model)
7. [Flexbox 佈局](#7-flexbox-layout)
8. [Grid 佈局](#8-grid-layout)
9. [媒體查詢](#9-media-queries)

---

## 1. CSS 屬性參考

> 來源： https://www.w3schools.com/cssref/index.php

### 背景 (Background)

| 屬性 | 描述 |
|---|---|
| `background` | 所有背景屬性的縮寫 |
| `background-color` | 設定背景顏色 |
| `background-image` | 設定一個或多個背景影像 |
| `background-position` | 設定背景影像的起始位置 |
| `background-repeat` | 設定背景影像如何重複 |
| `background-size` | 設定背景影像的大小 (`cover`, `contain`, 長度) |
| `background-attachment` | 設定背景是否隨內容捲動 (`scroll`, `fixed`, `local`) |
| `background-clip` | 定義背景延伸的範圍 (`border-box`, `padding-box`, `content-box`) |
| `background-origin` | 指定背景影像的定位區域 |

### 邊框 (Border)

| 屬性 | 描述 |
|---|---|
| `border` | border-width, border-style, border-color 的縮寫 |
| `border-width` | 設定邊框寬度 |
| `border-style` | 設定樣式 (`none`, `solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `inset`, `outset`) |
| `border-color` | 設定邊框顏色 |
| `border-radius` | 設定圓角 |
| `border-top` / `border-right` / `border-bottom` / `border-left` | 個別側邊的邊框 |
| `border-collapse` | 設定表格邊框是否合併為單一邊框 |
| `border-spacing` | 設定相鄰單元格邊框之間的距離 |
| `border-image` | 使用影像作為邊框的縮寫 |
| `outline` | 在邊框外繪製的線條（不佔用空間） |
| `outline-offset` | 在輪廓與元件邊緣之間增加空間 |

### 盒模型 / 尺寸 (Box Model / Dimensions)

| 屬性 | 描述 |
|---|---|
| `width` / `height` | 設定元件寬度/高度 |
| `min-width` / `min-height` | 設定最小寬度/高度 |
| `max-width` / `max-height` | 設定最大寬度/高度 |
| `margin` | 設定外距（top, right, bottom, left 的縮寫） |
| `padding` | 設定內距（top, right, bottom, left 的縮寫） |
| `box-sizing` | 定義如何計算寬度/高度 (`content-box`, `border-box`) |
| `overflow` | 控制內容溢出 (`visible`, `hidden`, `scroll`, `auto`) |
| `overflow-x` / `overflow-y` | 分別控制水平/垂直溢出 |

### 顏色與透明度 (Color and Opacity)

| 屬性 | 描述 |
|---|---|
| `color` | 設定文字顏色 |
| `opacity` | 設定透明度級別 (0.0 到 1.0) |

### 顯示與可見性 (Display and Visibility)

| 屬性 | 描述 |
|---|---|
| `display` | 控制顯示行為 (`block`, `inline`, `inline-block`, `flex`, `grid`, `none` 等) |
| `visibility` | 控制可見性 (`visible`, `hidden`, `collapse`) |
| `float` | 將元件放置在其容器的左側或右側 |
| `clear` | 指定元件的哪些側面不允許有浮動元件 |
| `position` | 設定定位方法 (`static`, `relative`, `absolute`, `fixed`, `sticky`) |
| `top` / `right` / `bottom` / `left` | 定位元件的位移量 |
| `z-index` | 設定定位元件的堆疊順序 |

### 字體排印 / 字型 (Typography / Font)

| 屬性 | 描述 |
|---|---|
| `font` | 字型屬性的縮寫 |
| `font-family` | 設定字型（例如： `"Arial", sans-serif`） |
| `font-size` | 設定文字大小 |
| `font-weight` | 設定粗細 (`normal`, `bold`, `100`-`900`) |
| `font-style` | 設定樣式 (`normal`, `italic`, `oblique`) |
| `font-variant` | 設定小型大寫字母或其他變體 |
| `line-height` | 設定行高 |
| `letter-spacing` | 設定字元間距 |
| `word-spacing` | 設定單字間距 |

### 文字 (Text)

| 屬性 | 描述 |
|---|---|
| `text-align` | 設定水平對齊 (`left`, `right`, `center`, `justify`) |
| `text-decoration` | 為文字增加裝飾 (`none`, `underline`, `overline`, `line-through`) |
| `text-transform` | 控制大小寫 (`uppercase`, `lowercase`, `capitalize`) |
| `text-indent` | 文字區塊第一行縮排 |
| `text-shadow` | 為文字增加陰影 |
| `white-space` | 控制如何處理空白字元 |
| `word-break` | 控制單字的斷行規則 |
| `word-wrap` / `overflow-wrap` | 允許長單字斷行並換到下一行 |
| `vertical-align` | 設定行內或表格單元格元件的垂直對齊 |
| `direction` | 設定文字方向 (`ltr`, `rtl`) |

### 清單 (List)

| 屬性 | 描述 |
|---|---|
| `list-style` | 清單屬性的縮寫 |
| `list-style-type` | 設定項目符號類型 (`disc`, `circle`, `square`, `decimal`, `none` 等) |
| `list-style-position` | 設定標記位置 (`inside`, `outside`) |
| `list-style-image` | 使用影像作為清單標記 |

### 表格 (Table)

| 屬性 | 描述 |
|---|---|
| `border-collapse` | 合併表格單元格邊框 (`collapse`, `separate`) |
| `border-spacing` | 設定單元格之間的間距（當為 `separate` 時） |
| `caption-side` | 設定表格標題的位置 (`top`, `bottom`) |
| `empty-cells` | 控制空單元格的顯示 (`show`, `hide`) |
| `table-layout` | 設定表格佈局演算法 (`auto`, `fixed`) |

### 轉換與過渡 (Transform and Transition)

| 屬性 | 描述 |
|---|---|
| `transform` | 套用 2D 或 3D 轉換 (`translate`, `rotate`, `scale`, `skew`, `matrix`) |
| `transform-origin` | 設定轉換的起始點 |
| `transition` | 過渡屬性的縮寫 |
| `transition-property` | 指定要過渡的屬性 |
| `transition-duration` | 設定過渡所需的時間 |
| `transition-timing-function` | 設定速度曲線 (`ease`, `linear`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier()`) |
| `transition-delay` | 設定過渡開始前的延遲 |

### 動畫 (Animation)

| 屬性 | 描述 |
|---|---|
| `animation` | 動畫屬性的縮寫 |
| `animation-name` | 命名 `@keyframes` 動畫 |
| `animation-duration` | 動畫所需時間 |
| `animation-timing-function` | 動畫的速度曲線 |
| `animation-delay` | 開始前的延遲 |
| `animation-iteration-count` | 重複次數（`infinite` 為循環） |
| `animation-direction` | 動畫是否交替方向 (`normal`, `reverse`, `alternate`) |
| `animation-fill-mode` | 動畫前後套用的樣式 (`none`, `forwards`, `backwards`, `both`) |
| `animation-play-state` | 暫停或執行動畫 (`running`, `paused`) |

### Flexbox (容器)

| 屬性 | 描述 |
|---|---|
| `display: flex` | 建立 Flex 容器 |
| `flex-direction` | 設定主軸方向 (`row`, `column`, `row-reverse`, `column-reverse`) |
| `flex-wrap` | 控制換行 (`nowrap`, `wrap`, `wrap-reverse`) |
| `flex-flow` | `flex-direction` 和 `flex-wrap` 的縮寫 |
| `justify-content` | 沿著主軸對齊項目 |
| `align-items` | 沿著交叉軸對齊項目 |
| `align-content` | 對齊換行後的列 |
| `gap` / `row-gap` / `column-gap` | 設定 Flex 項目之間的間距 |

### Flexbox (項目)

| 屬性 | 描述 |
|---|---|
| `flex` | `flex-grow`, `flex-shrink`, `flex-basis` 的縮寫 |
| `flex-grow` | 項目相對於其他項目的增長比例 |
| `flex-shrink` | 項目相對於其他項目的收縮比例 |
| `flex-basis` | 分配空間前的預設大小 |
| `order` | 設定 Flex 項目的視覺順序 |
| `align-self` | 為單個項目覆蓋容器的 `align-items` |

### Grid (容器)

| 屬性 | 描述 |
|---|---|
| `display: grid` | 建立 Grid 容器 |
| `grid-template-columns` | 定義欄軌道大小 |
| `grid-template-rows` | 定義列軌道大小 |
| `grid-template-areas` | 定義命名的網格區域 |
| `grid-template` | rows, columns, areas 的縮寫 |
| `gap` / `row-gap` / `column-gap` | 網格軌道之間的間距 |
| `grid-auto-rows` / `grid-auto-columns` | 隱式建立之軌道的大小 |
| `grid-auto-flow` | 控制自動放置演算法 (`row`, `column`, `dense`) |
| `justify-items` / `align-items` | 在單元格內對齊項目 |
| `justify-content` / `align-content` | 在容器內對齊網格 |

### Grid (項目)

| 屬性 | 描述 |
|---|---|
| `grid-column` | `grid-column-start` / `grid-column-end` 的縮寫 |
| `grid-row` | `grid-row-start` / `grid-row-end` 的縮寫 |
| `grid-area` | 將項目分配到命名區域，或列/欄放置的縮寫 |
| `justify-self` / `align-self` | 在單元格內對齊單個項目 |

### 其他常見屬性

| 屬性 | 描述 |
|---|---|
| `cursor` | 設定滑鼠指標類型 (`pointer`, `default`, `grab`, `text` 等) |
| `box-shadow` | 為元件增加陰影效果 |
| `filter` | 套用圖形效果 (`blur()`, `brightness()`, `contrast()`, `grayscale()` 等) |
| `clip-path` | 將元件裁剪為特定形狀 |
| `object-fit` | 替換元件 (img, video) 如何適應其容器 (`fill`, `contain`, `cover`, `none`) |
| `object-position` | 替換元件內容在其盒子內的位置 |
| `resize` | 元件是否可調整大小 (`none`, `both`, `horizontal`, `vertical`) |
| `user-select` | 控制文字是否可被選取 (`none`, `auto`, `text`, `all`) |
| `pointer-events` | 控制元件是否對指標事件做出反應 |
| `content` | 與 `::before` 和 `::after` 虛擬元件搭配使用 |
| `counter-reset` / `counter-increment` | 建立並遞增 CSS 計數器 |
| `will-change` | 向瀏覽器提示即將發生的變更以進行最佳化 |
| `aspect-ratio` | 為元件設定偏好的長寬比 |
| `accent-color` | 設定表單控制項的強調色 |
| `scroll-behavior` | 控制平滑捲動 (`auto`, `smooth`) |

---

## 2. CSS 選擇器

> 來源： https://www.w3schools.com/cssref/css_selectors.php

### 基本選擇器

| 選擇器 | 範例 | 描述 |
|---|---|---|
| `*` | `* { }` | 選取所有元件 |
| `element` | `p { }` | 選取所有 `<p>` 元件 |
| `.class` | `.intro { }` | 選取所有 `class="intro"` 的元件 |
| `#id` | `#firstname { }` | 選取 `id="firstname"` 的元件 |
| `element.class` | `p.intro { }` | 選取 `class="intro"` 的 `<p>` 元件 |

### 群組化 (Grouping)

| 選擇器 | 範例 | 描述 |
|---|---|---|
| `sel1, sel2` | `div, p { }` | 選取所有 `<div>` 和所有 `<p>` 元件 |

### 組合選擇器 (Combinator Selectors)

| 選擇器 | 範例 | 描述 |
|---|---|---|
| `ancestor descendant` | `div p { }` | 選取 `<div>` 內部的所有 `<p>`（任何深度） |
| `parent > child` | `div > p { }` | 選取作為 `<div>` 直接子代的 `<p>` |
| `element + sibling` | `div + p { }` | 選取緊接在 `<div>` 之後的第一個 `<p>` |
| `element ~ siblings` | `div ~ p { }` | 選取 `<div>` 之後作為同層的所有 `<p>` |

### 屬性選擇器 (Attribute Selectors)

| 選擇器 | 範例 | 描述 |
|---|---|---|
| `[attr]` | `[target] { }` | 具有 `target` 屬性的元件 |
| `[attr=value]` | `[target="_blank"] { }` | `target` 等於 `_blank` 的元件 |
| `[attr~=value]` | `[title~="flower"] { }` | 屬性包含單字 `flower` |
| `[attr\|=value]` | `[lang\|="en"] { }` | 屬性以 `en` 開頭（精確符合或後接 `-`） |
| `[attr^=value]` | `a[href^="https"] { }` | 屬性值以 `https` 開頭 |
| `[attr$=value]` | `a[href$=".pdf"] { }` | 屬性值以 `.pdf` 結尾 |
| `[attr*=value]` | `a[href*="w3schools"] { }` | 屬性值包含 `w3schools` |

---

## 3. 虛擬類別與虛擬元件

> 來源： https://www.w3schools.com/cssref/css_ref_pseudo_classes.php

### 虛擬類別 (Pseudo-Classes)

虛擬類別根據狀態或位置選取元件。

**連結與使用者動作狀態：**

| 虛擬類別 | 描述 |
|---|---|
| `:link` | 未訪問過的連結 |
| `:visited` | 已訪問過的連結 |
| `:hover` | 滑鼠指標停留其上的元件 |
| `:active` | 正在被啟用的元件（例如被點擊） |
| `:focus` | 獲得焦點的元件 |
| `:focus-within` | 包含已獲得焦點元件的元件 |
| `:focus-visible` | 透過鍵盤（而非滑鼠）聚焦的元件 |

**表單 / 輸入狀態：**

| 虛擬類別 | 描述 |
|---|---|
| `:checked` | 已勾選的核取方塊或選項按鈕 |
| `:disabled` | 停用的表單元件 |
| `:enabled` | 啟用的表單元件 |
| `:required` | 具有 `required` 屬性的表單元件 |
| `:optional` | 不具備 `required` 屬性的表單元件 |
| `:valid` | 具有有效值的表單元件 |
| `:invalid` | 具有無效值的表單元件 |
| `:in-range` | 數值在指定範圍內的輸入項 |
| `:out-of-range` | 數值在指定範圍外的輸入項 |
| `:read-only` | 具有 `readonly` 屬性的元件 |
| `:read-write` | 不具備 `readonly` 屬性的元件 |
| `:placeholder-shown` | 目前顯示預留位置文字的輸入元件 |
| `:default` | 預設的表單元件 |
| `:indeterminate` | 處於不定狀態的核取方塊/選項按鈕 |

**結構化虛擬類別：**

| 虛擬類別 | 描述 |
|---|---|
| `:first-child` | 其父代的第一個子元件 |
| `:last-child` | 其父代的最後一個子元件 |
| `:nth-child(n)` | 第 n 個子元件 (`n`, `2n`, `odd`, `even`, `3n+1` 等) |
| `:nth-last-child(n)` | 從末尾開始計算的第 n 個子元件 |
| `:only-child` | 其父代唯一的子元件 |
| `:first-of-type` | 父代中同類型元件的第一個 |
| `:last-of-type` | 父代中同類型元件的最後一個 |
| `:nth-of-type(n)` | 同類型元件的第 n 個 |
| `:nth-last-of-type(n)` | 從末尾開始計算的同類型元件第 n 個 |
| `:only-of-type` | 父代中唯一的同類型元件 |
| `:root` | 文件的根元件（通常是 `<html>`） |
| `:empty` | 沒有子代或文字的元件 |

**其他虛擬類別：**

| 虛擬類別 | 描述 |
|---|---|
| `:not(selector)` | 不符合選擇器的元件 |
| `:is(selector)` | 符合清單中任何一個選擇器的元件 |
| `:where(selector)` | 與 `:is()` 相同，但權重為零 |
| `:has(selector)` | 父代選擇器 -- 若元件具有符合選擇器的後代則相符 |
| `:target` | 其 ID 符合 URL 片段（例如 `#section1`）的元件 |
| `:lang(language)` | 具有指定語言屬性的元件 |

### 虛擬元件 (Pseudo-Elements)

虛擬元件用於設定元件特定部分的樣式。

| 虛擬元件 | 描述 |
|---|---|
| `::before` | 在元件內容之前插入內容 |
| `::after` | 在元件內容之後插入內容 |
| `::first-line` | 為區塊元件的第一行設定樣式 |
| `::first-letter` | 為區塊元件的第一個字母設定樣式 |
| `::selection` | 為使用者選取/醒目提示的部分設定樣式 |
| `::placeholder` | 為輸入項的預留位置文字設定樣式 |
| `::marker` | 為清單項目的標記（項目符號/數字）設定樣式 |
| `::backdrop` | 為對話方塊或全螢幕元件背後的幕簾設定樣式 |

---

## 4. CSS At-Rules

> 來源： https://www.w3schools.com/cssref/css_ref_atrules.php

| At-Rule | 描述 |
|---|---|
| `@charset` | 指定樣式表的字元編碼（例如 `@charset "UTF-8";`） |
| `@import` | 匯入外部樣式表 (`@import url("style.css");`) |
| `@font-face` | 定義要在文件中使用的自訂字型 |
| `@keyframes` | 為 `animation-name` 定義動畫關鍵幀 |
| `@media` | 根據媒體查詢條件式地套用樣式 |
| `@supports` | 僅在瀏覽器支援給定 CSS 功能時才套用樣式 |
| `@page` | 為列印頁面定義樣式（頁邊距、大小等） |
| `@layer` | 宣告階層層級以控制權重順序 |
| `@container` | 根據容器元件的大小套用樣式 |
| `@property` | 註冊具有定義語法、繼承和初始值的自訂屬性 |
| `@scope` | 將樣式限制在特定的 DOM 子樹 |
| `@starting-style` | 為元件首次出現時的 CSS 過渡定義樣式 |
| `@counter-style` | 為清單標記定義自訂計數器樣式 |
| `@namespace` | 宣告用於 CSS 選擇器的 XML 命名空間 |
| `@color-profile` | 定義用於 `color()` 函式的色彩描述檔 |

### 常見 At-Rule 範例

```css
/* @font-face -- 定義自訂字型 */
@font-face {
  font-family: "MyFont";
  src: url("myfont.woff2") format("woff2"),
       url("myfont.woff") format("woff");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* @keyframes -- 定義動畫 */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* @media -- 回應式樣式 */
@media screen and (max-width: 768px) {
  .container { flex-direction: column; }
}

/* @supports -- 功能偵測 */
@supports (display: grid) {
  .container { display: grid; }
}

/* @layer -- 階層層級 */
@layer base, components, utilities;
@layer base {
  body { margin: 0; }
}

/* @container -- 容器查詢 */
@container (min-width: 400px) {
  .card { grid-template-columns: 1fr 1fr; }
}
```

---

## 5. CSS 樣式設定基礎

> 來源： https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics

### 什麼是 CSS？

**CSS (階層式樣式表, Cascading Style Sheets)** 用於設定網頁的樣式與版面配置。它控制字型、顏色、尺寸、間距、佈局、動畫及其他視覺面向。

### CSS 語法

```css
選擇器 {
  屬性: 值;
  屬性: 值;
}
```

一個**規則 (rule)**（或稱為**規則集, ruleset**）由一個**選擇器 (selector)** 和一個包含一個或多個**宣告 (declarations)**（屬性-值對）的**宣告區塊 (declaration block)** 組成。

### 將 CSS 套用到 HTML

有三種方法可以套用 CSS：

1. **外部樣式表 (External Stylesheet)**（建議）：
   ```html
   <link rel="stylesheet" href="styles.css">
   ```

2. **內部樣式表 (Internal Stylesheet)**：
   ```html
   <style>
     p { color: red; }
   </style>
   ```

3. **行內樣式 (Inline Styles)**（盡可能避免）：
   ```html
   <p style="color: red;">文字</p>
   ```

### 階層 (Cascade)、權重 (Specificity) 與繼承 (Inheritance)

- **階層**：當多個規則目標為同一個元件時，在其他條件相同的情況下，後面的規則會覆蓋前面的規則。
- **權重**：愈具體的選擇器會覆蓋較不具體的選擇器。權重排名（低到高）：
  - 類型選擇器 (`p`, `div`) 和虛擬元件
  - 類別選擇器 (`.intro`)、屬性選擇器和虛擬類別
  - ID 選擇器 (`#main`)
  - 行內樣式
  - `!important`（覆蓋所有規則，請謹慎使用）
- **繼承**：某些屬性（主要是文字相關）會由子元件繼承；其他屬性（主要是佈局相關）則不會。

### 數值與單位

| 單位 | 類型 | 描述 |
|---|---|---|
| `px` | 絕對 | 像素（最常見的絕對單位） |
| `em` | 相對 | 相對於父元件的字型大小 |
| `rem` | 相對 | 相對於根元件的字型大小 |
| `%` | 相對 | 相對於父元件數值的百分比 |
| `vw` / `vh` | 相對 | 視窗寬度 / 高度的 1% |
| `vmin` / `vmax` | 相對 | 較小/較大視窗維度的 1% |
| `ch` | 相對 | 字元 `0` 的寬度 |
| `fr` | 分數 | 可用空間的一等份（僅限 Grid） |

### 顏色值

```css
color: red;                        /* 具名顏色 */
color: #ff0000;                    /* 十六進位 */
color: #f00;                       /* 十六進位縮寫 */
color: rgb(255, 0, 0);             /* RGB */
color: rgba(255, 0, 0, 0.5);      /* 帶 Alpha 通道的 RGB */
color: rgb(255 0 0 / 50%);        /* 現代 RGB 語法 */
color: hsl(0, 100%, 50%);         /* HSL */
color: hsla(0, 100%, 50%, 0.5);   /* 帶 Alpha 通道的 HSL */
color: hsl(0 100% 50% / 50%);     /* 現代 HSL 語法 */
```

---

## 6. 盒模型 (Box Model)

> 來源： https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model

### 四個層級

每個 CSS 元件都被一個具有四個層級（由內而外）的盒子包圍：

1. **內容盒 (Content Box)** -- 顯示內容的地方；使用 `width` 和 `height` 設定大小
2. **內距盒 (Padding Box)** -- 內容周圍的空間；使用 `padding` 設定大小
3. **邊框盒 (Border Box)** -- 包裹內容和內距；使用 `border` 設定大小
4. **外距盒 (Margin Box)** -- 元件最外層的空間；使用 `margin` 設定大小

### 標準 vs. 替代盒模型

**標準（預設 -- `content-box`）：**
```css
.box {
  width: 350px;       /* 僅內容寬度 */
  padding: 25px;
  border: 5px solid black;
  margin: 10px;
}
/* 總轉譯寬度： 350 + 25 + 25 + 5 + 5 = 410px */
```

**替代 (`border-box`)：**
```css
.box {
  box-sizing: border-box;
  width: 350px;       /* 包含內距和邊框 */
  padding: 25px;
  border: 5px solid black;
  margin: 10px;
}
/* 總轉譯寬度： 350px（內容區域會收縮以適應） */
```

**建議的全域重設：**
```css
html {
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}
```

### 區塊 (Block) vs. 行內 (Inline) vs. 行內區塊 (Inline-Block)

| 行為 | 區塊 | 行內 | 行內區塊 |
|---|---|---|---|
| 會換行 | 是 | 否 | 否 |
| 遵循 `width`/`height` | 是 | 否 | 是 |
| 內距/外距會推開其他元件 | 是 | 僅限左右 | 是 |
| 預設填滿容器寬度 | 是 | 否 | 否 |
| 常見元件 | `div`, `p`, `h1`-`h6`, `section` | `a`, `span`, `em`, `strong` | --（透過 CSS 設定） |

### 外距收縮 (Margin Collapsing)

當相鄰區塊元件的垂直外距接觸時，它們會發生收縮：

- **兩個正外距**：取較大值
- **兩個負外距**：取最小（最負）值
- **一正一負**：兩者相加（相減）

```css
.one { margin-bottom: 50px; }
.two { margin-top: 30px; }
/* 結果： 兩者之間有 50px 的間隙（而非 80px） */
```

### 縮寫表示法

```css
/* 所有四個側面 */
margin: 10px;                      /* 所有側面皆為 10px */
margin: 10px 20px;                 /* 垂直 10px, 水平 20px */
margin: 10px 20px 30px;            /* 頂部 10px, 水平 20px, 底部 30px */
margin: 10px 20px 30px 40px;       /* 頂部、右側、底部、左側（順時針） */
```

---

## 7. Flexbox 佈局

> 來源： https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox

Flexbox 是一種用於將項目排列成列或欄的**一維**佈局方法。

### 軸線 (Axes)

- **主軸 (Main Axis)**：項目排列的方向（預設：水平）
- **交叉軸 (Cross Axis)**：與主軸垂直的方向（預設：垂直）

### 容器屬性 (Container Properties)

```css
.container {
  display: flex;               /* 或 inline-flex */

  /* 方向 */
  flex-direction: row;         /* row | row-reverse | column | column-reverse */

  /* 換行 */
  flex-wrap: nowrap;           /* nowrap | wrap | wrap-reverse */

  /* 方向 + 換行的縮寫 */
  flex-flow: row wrap;

  /* 主軸對齊 */
  justify-content: flex-start; /* flex-start | flex-end | center |
                                  space-between | space-around | space-evenly */

  /* 交叉軸對齊 */
  align-items: stretch;        /* stretch | flex-start | flex-end |
                                  center | baseline */

  /* 多行交叉軸對齊（換行時） */
  align-content: stretch;      /* stretch | flex-start | flex-end | center |
                                  space-between | space-around */

  /* 間距 */
  gap: 10px;                   /* row-gap 和 column-gap 的縮寫 */
}
```

### 項目屬性 (Item Properties)

```css
.item {
  /* 增長/收縮行為（縮寫） */
  flex: 1;                     /* flex-grow: 1, flex-shrink: 1, flex-basis: 0 */
  flex: 1 200px;               /* flex-grow: 1, flex-basis: 200px */

  /* 個別屬性 */
  flex-grow: 0;                /* 項目增長比例 (0 = 不增長) */
  flex-shrink: 1;              /* 項目收縮比例 (0 = 不收縮) */
  flex-basis: auto;            /* 空間分配前的預設大小 */

  /* 視覺順序 */
  order: 0;                    /* 較小的值排在前面；預設值為 0 */

  /* 個別交叉軸對齊 */
  align-self: auto;            /* auto | flex-start | flex-end | center |
                                  baseline | stretch */
}
```

### 常見模式

```css
/* 等寬欄位 */
.item { flex: 1; }

/* 水平與垂直置中一個項目 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 回應式換行佈局 */
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.item {
  flex: 1 1 300px;   /* 增長, 收縮, 最小寬度 300px */
}

/* 固定頁尾 (Sticky footer) 佈局 */
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main { flex: 1; }
```

---

## 8. Grid 佈局

> 來源： https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids

CSS Grid 是一種用於將內容組織成列和欄的**二維**佈局系統。

### 容器屬性 (Container Properties)

```css
.container {
  display: grid;               /* 或 inline-grid */

  /* 定義欄與列 */
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;

  /* 使用 repeat() */
  grid-template-columns: repeat(3, 1fr);

  /* 回應式 auto-fill / auto-fit */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

  /* 命名的區域 */
  grid-template-areas:
    "header  header  header"
    "sidebar content content"
    "footer  footer  footer";

  /* 軌道之間的間距 */
  gap: 20px;
  column-gap: 20px;
  row-gap: 20px;

  /* 隱式建立之軌道的大小 */
  grid-auto-rows: minmax(100px, auto);
  grid-auto-columns: 1fr;

  /* 自動放置演算法 */
  grid-auto-flow: row;         /* row | column | dense */

  /* 在單元格內對齊所有項目 */
  justify-items: stretch;      /* start | end | center | stretch */
  align-items: stretch;        /* start | end | center | stretch */

  /* 在容器內對齊網格 */
  justify-content: start;      /* start | end | center | stretch |
                                  space-between | space-around | space-evenly */
  align-content: start;
}
```

### 關鍵函式

| 函式 | 描述 |
|---|---|
| `repeat(count, size)` | 重複軌道定義（例如： `repeat(3, 1fr)`） |
| `minmax(min, max)` | 為軌道設定最小值與最大值 |
| `auto-fill` | 在容器內建立儘可能多的軌道（保留空軌道） |
| `auto-fit` | 建立儘可能多的軌道，然後收縮空軌道 |
| `fit-content(max)` | 根據內容調整軌道大小，最高不超過最大值 |

### `fr` 單位

`fr` 單位代表可用空間的一等份：
```css
grid-template-columns: 2fr 1fr 1fr;
/* 第一欄獲得 50%，其他兩欄各獲得 25% */
```

### 項目屬性 (Item Properties)

```css
.item {
  /* 依線條編號放置 */
  grid-column: 1 / 3;         /* 從第 1 條線開始，到第 3 條線結束 */
  grid-row: 1 / 2;

  /* 依跨度放置 */
  grid-column: 1 / span 2;    /* 從第 1 條線開始，橫跨 2 欄 */

  /* 全寬項目 */
  grid-column: 1 / -1;        /* 從第 1 條線到最後一條線 */

  /* 依具名區域放置 */
  grid-area: header;

  /* 單元格內的自我對齊 */
  justify-self: center;       /* start | end | center | stretch */
  align-self: center;
}
```

### 具名網格區域範例

```css
.container {
  display: grid;
  grid-template-columns: 1fr 3fr;
  grid-template-areas:
    "header  header"
    "sidebar content"
    "footer  footer";
  gap: 20px;
}

header  { grid-area: header; }
aside   { grid-area: sidebar; }
main    { grid-area: content; }
footer  { grid-area: footer; }
```

### 子網格 (Subgrid)

網格項目可以繼承其父代的軌道定義：
```css
.nested {
  display: grid;
  grid-template-columns: subgrid;
}
```

### 顯式 vs. 隱式網格

- **顯式網格 (Explicit grid)**：由 `grid-template-columns` / `grid-template-rows` 定義的軌道
- **隱式網格 (Implicit grid)**：為溢出內容自動產生的軌道；由 `grid-auto-rows` / `grid-auto-columns` 控制

---

## 9. 媒體查詢 (Media Queries)

> 來源： https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries

### 語法

```css
@media media-type and (media-feature) {
  /* CSS 規則 */
}
```

### 媒體類型

| 類型 | 描述 |
|---|---|
| `all` | 所有裝置（預設） |
| `screen` | 螢幕（顯示器、手機、平板） |
| `print` | 列印預覽與列印頁面 |

### 常見媒體特性 (Features)

| 特性 | 描述 | 範例 |
|---|---|---|
| `width` / `min-width` / `max-width` | 視窗寬度 | `(min-width: 768px)` |
| `height` / `min-height` / `max-height` | 視窗高度 | `(min-height: 600px)` |
| `orientation` | 直向或橫向 | `(orientation: landscape)` |
| `hover` | 使用者是否可以懸停？ | `(hover: hover)` |
| `pointer` | 指標裝置精準度 | `(pointer: fine)` 或 `(pointer: coarse)` |
| `prefers-color-scheme` | 使用者的色彩配置偏好 | `(prefers-color-scheme: dark)` |
| `prefers-reduced-motion` | 使用者偏好減少動畫 | `(prefers-reduced-motion: reduce)` |
| `aspect-ratio` | 視窗長寬比 | `(aspect-ratio: 16/9)` |
| `resolution` | 裝置像素密度 | `(min-resolution: 2dppx)` |

### 邏輯運算子

```css
/* AND -- 所有條件皆須成立 */
@media screen and (min-width: 600px) and (orientation: landscape) { }

/* OR -- 以逗號分隔；任何一個條件成立即可 */
@media (min-width: 600px), (orientation: landscape) { }

/* NOT -- 反轉整個查詢結果 */
@media not screen and (min-width: 600px) { }

/* 範圍語法（現代） */
@media (30em <= width <= 50em) { }
```

### 行動優先 (Mobile-First) 回應式設計

從行動裝置樣式開始，然後為較大的螢幕增加複雜性：

```css
/* 基礎樣式（行動裝置） */
.container {
  width: 90%;
  margin: 0 auto;
}

/* 中型螢幕（平板） */
@media screen and (min-width: 40em) {
  .container {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 20px;
  }

  nav ul {
    display: flex;
  }
}

/* 大型螢幕（桌機） */
@media screen and (min-width: 70em) {
  .container {
    max-width: 1200px;
  }
}
```

### 視窗 Meta 標籤 (必須)

務必在 HTML 的 `<head>` 中包含此標籤，回應式設計才能在行動裝置上運作：

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### 常見斷點 (Breakpoints)

雖然沒有通用的斷點，但常用的數值包括：

| 標籤 | 斷點 |
|---|---|
| 小型手機 | `< 576px` |
| 手機 / 大型手機 | `>= 576px` |
| 平板 | `>= 768px` |
| 桌機 | `>= 992px` |
| 大型桌機 | `>= 1200px` |
| 特大型螢幕 | `>= 1400px` |

**最佳實作**：不要針對特定裝置。相反地，應在內容需要的地方增加斷點 -- 當行長變得太長或佈局崩潰時。

### 無需媒體查詢的回應式設計

現代 CSS 佈局方法本質上就可以是回應式的：

```css
/* 自動回應式網格 -- 不需要媒體查詢 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* 流體字體排印 */
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}
```

### 列印樣式

```css
@media print {
  nav, .sidebar, footer {
    display: none;
  }

  body {
    font-size: 12pt;
    color: black;
    background: white;
  }

  a[href]::after {
    content: " (" attr(href) ")";
  }
}
```

### 深色模式支援

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #e0e0e0;
  }

  body {
    background-color: var(--bg-color);
    color: var(--text-color);
  }
}
```

---

## 快速語法速查表

```css
/* 變數（自訂屬性） */
:root {
  --primary: #3498db;
  --spacing: 1rem;
}
.element {
  color: var(--primary);
  padding: var(--spacing);
}

/* 巢狀（現代 CSS） */
.card {
  background: white;
  & .title {
    font-size: 1.5rem;
  }
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
}

/* 邏輯屬性 (Logical Properties) */
margin-inline: auto;          /* 左右外距 */
margin-block: 1rem;           /* 上下外距 */
padding-inline-start: 1rem;   /* LTR 時為左內距，RTL 時為右內距 */

/* 容器查詢 */
.card-container {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .card { flex-direction: row; }
}

/* 捲動貼齊 (Scroll Snap) */
.scroll-container {
  scroll-snap-type: x mandatory;
}
.scroll-item {
  scroll-snap-align: start;
}
```

---

*此參考資料由 w3schools.com 和 developer.mozilla.org (MDN Web Docs) 的內容彙編而成。如需完整詳情，請造訪各章節上方列出的來源 URL。*
