# Web Performance 參考

這是一份整合了 Web Performance 概念、最佳化技術和 Performance API 的參考指南，資料來源為 Mozilla 開發者網路 (MDN)。

---

## 目錄

1. [Web Performance 概觀](#1-web-performance-overview)
2. [效能基礎](#2-performance-fundamentals)
3. [效能最佳實作](#3-performance-best-practices)
4. [HTML 效能](#4-html-performance)
5. [JavaScript 效能](#5-javascript-performance)
6. [CSS 效能](#6-css-performance)
7. [Performance API](#7-performance-api)
8. [效能資料](#8-performance-data)
9. [伺服器計時 (Server Timing)](#9-server-timing)
10. [使用者計時 (User Timing)](#10-user-timing)

---

## 1. Web Performance 概觀

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/Performance>

### 定義

**Web Performance** 涵蓋了：

- 客觀測量（載入時間、每秒幀數、可互動時間）
- 載入和回應時間的感知使用者體驗
- 使用者互動期間的流暢度（捲動、動畫、按鈕回應能力）

### 建議時間

| 目標 | 門檻 |
|--------|-----------|
| 網頁載入指示 | 1 秒 |
| 閒置 (Idling) | 50ms |
| 動畫 | 16.7ms (60 FPS) |
| 使用者輸入回應 | 50-200ms |

使用者會放棄回應緩慢的網站。目標是盡量縮短載入和回應時間，同時加入能夠隱藏延遲的功能，盡快最大化可用性和互動性。

### 關鍵效能指標

| 指標 | 全名 | 定義 |
|--------|-----------|------------|
| **FCP** | First Contentful Paint | 內容首次出現的時間 |
| **LCP** | Largest Contentful Paint | 最大內容元素可見的時間 |
| **CLS** | Cumulative Layout Shift | 視覺穩定性 |
| **INP** | Interaction to Next Paint | 對使用者輸入的回應能力 |
| **TTFB** | Time to First Byte | 伺服器回應時間 |
| **TTI** | Time to Interactive | 網頁變得完全可互動的時間 |
| **Jank** | -- | 非流暢的動畫或捲動 |

### Performance API 類別

- **高精度計時 (High-precision timing)**：透過穩定的單調時鐘 (monotonic clock) 進行次毫秒監控
- **導覽計時 (Navigation Timing)**：網頁導覽的指標（DOMContentLoaded、載入時間）
- **資源計時 (Resource Timing)**：個別資源的詳細網路計時
- **使用者計時 (User Timing)**：自訂標記和測量
- **長動畫幀 (Long Animation Frames, LoAF)**：識別造成卡頓 (janky) 的動畫
- **伺服器計時 (Server Timing)**：後端效能指標

### 相關瀏覽器 API

- **Page Visibility API**：追蹤文件可見性狀態
- **Background Tasks API** (`requestIdleCallback()`)：佇列非阻塞工作
- **Intersection Observer API**：非同步監控元件可見性
- **Network Information API**：偵測連線類型以提供適應性內容
- **Battery Status API**：針對電力受限的裝置進行最佳化
- **Beacon API**：將效能資料傳送到分析工具
- **Media Capabilities API**：檢查裝置的媒體支援情況

### 資源載入提示

- **DNS-prefetch**：預先解析功能網域名稱
- **Preconnect**：建立早期連線
- **Prefetch**：在需要前預先載入資源
- **Preload**：提早載入關鍵資源

### 監控方法

- **真實使用者監控 (Real User Monitoring, RUM)**：來自真實使用者的長期趨勢分析
- **合成監控 (Synthetic Monitoring)**：開發期間的受控迴歸測試

---

## 2. 效能基礎

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance>

### 為什麼 Web Performance 很重要

- 促進無障礙空間和包容性設計
- 提升使用者體驗和留存率
- 直接影響業務目標和轉換率

### 核心元件

- 網頁載入效能
- 瀏覽器中的內容轉譯
- 使用者代理 (User Agent) 的能力和限制
- 不同使用者群體的效能表現

### 感知效能

專注於使用者感知而非原始毫秒數的指標：

- **網頁載入時間** -- 初始內容的可用性
- **回應能力** -- 互動回饋速度
- **動畫流暢度** -- 視覺流動性
- **捲動流暢度** -- 捲動互動品質

### 最佳化領域

| 領域 | 重點 | 影響 |
|------|-------|--------|
| **多媒體 (影像)** | 根據裝置能力、大小、像素密度進行媒體最佳化 | 減少每張影像的位元組數 |
| **多媒體 (影片)** | 影片壓縮，移除背景影片的音軌 | 減少檔案大小 |
| **JavaScript** | 互動式體驗的最佳實作 | 提升回應能力、電池壽命 |
| **HTML** | DOM 節點最小化、最佳屬性排序 | 提升載入和轉譯時間 |
| **CSS** | 功能特定的最佳化 | 防止對效能產生負面影響 |

### 效能策略

- **效能預算**：設定資產大小限制
- **效能文化**：組織的承諾
- **迴歸預防**：避免隨時間推移產生的臃腫
- **行動優先方法**：回應式影像和適應性媒體傳遞

---

## 3. 效能最佳實作

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/Best_practices>

### 核心最佳實作

1. **學習關鍵轉譯路徑 (Critical Rendering Path)** -- 瞭解瀏覽器如何轉譯網頁以最佳化效能
2. **使用資源提示 (Resource Hints)** -- `rel=preconnect`, `rel=dns-prefetch`, `rel=prefetch`, `rel=preload`
3. **最小化 JavaScript** -- 只載入目前網頁所需的 JavaScript
4. **最佳化 CSS** -- 處理 CSS 效能因素，盡可能非同步載入 CSS
5. **使用 HTTP/2** -- 在您的伺服器或 CDN 上部署 HTTP/2
6. **使用 CDN** -- 顯著縮短資源載入時間
7. **壓縮資源** -- 使用 gzip、Brotli 或 Zopfli 壓縮
8. **最佳化影像** -- 盡可能使用 CSS 動畫或 SVG
9. **實作延遲載入 (Lazy Loading)** -- 延遲載入可視區域外的內容；在 `<img>` 元件上使用 `loading` 屬性
10. **專注於使用者感知** -- 感知效能與實際計時同樣重要

### 非同步 CSS 載入

```html
<link
  id="my-stylesheet"
  rel="stylesheet"
  href="/path/to/my.css"
  media="print" />
<noscript><link rel="stylesheet" href="/path/to/my.css" /></noscript>
```

```javascript
const stylesheet = document.getElementById("my-stylesheet");
stylesheet.addEventListener("load", () => {
  stylesheet.media = "all";
});
```

### 關鍵 CSS 內嵌 (Inlining)

- 使用 `<style>` 標籤內嵌首屏 (above-the-fold) 內容的 CSS
- 防止未樣式化文字閃爍 (FOUT)
- 提升感知效能

### JavaScript 載入

- 在 script 標籤上使用 `async` 或 `defer` 屬性
- JavaScript 僅會阻塞 DOM 中位於 script 標籤之後的元件轉譯

### Web Font 最佳實作

1. **字型格式選擇**：使用 WOFF 和 WOFF2（內建壓縮）；使用 gzip 或 Brotli 壓縮 EOT 和 TTF
2. **字型載入策略**：使用 `font-display: swap` 以防止轉譯阻塞；最佳化 `font-weight` 以緊密匹配 Web Font
3. **避免使用圖示字型 (Icon Fonts)**：改用壓縮後的 SVG；將 SVG 資料內嵌在 HTML 中以避免額外的 HTTP 請求

### 工具與測量

- [Firefox 開發者工具](https://firefox-source-docs.mozilla.org/devtools-user/performance/index.html)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/)
- [WebPageTest.org](https://www.webpagetest.org/)
- [Chrome 使用者體驗報告](https://developer.chrome.com/docs/crux/)
- `window.performance.timing`（原生 Performance API）

### 應避免的實作

- 下載不必要的全部內容
- 使用未壓縮的媒體檔案

---

## 4. HTML 效能

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/HTML>

### 主要的 HTML 相關效能瓶頸

- 影像和影片檔案大小（替換元件）
- 嵌入式內容傳遞（`<iframe>` 元件）
- 資源載入順序

### 回應式影像處理

**針對不同螢幕寬度使用 `srcset` 和 `sizes`：**

```html
<img
  srcset="480w.jpg 480w, 800w.jpg 800w"
  sizes="(width <= 600px) 480px, 800px"
  src="800w.jpg"
  alt="Family portrait" />
```

**針對不同裝置解析度使用 `srcset`：**

```html
<img
  srcset="320w.jpg, 480w.jpg 1.5x, 640w.jpg 2x"
  src="640w.jpg"
  alt="Family portrait" />
```

**使用 `<picture>` 元件：**

```html
<picture>
  <source media="(width < 800px)" srcset="narrow-banner-480w.jpg" />
  <source media="(width >= 800px)" srcset="wide-banner-800w.jpg" />
  <img src="large-banner-800w.jpg" alt="Dense forest scene" />
</picture>
```

### 延遲載入 (Lazy Loading)

**影像：**

```html
<img src="800w.jpg" alt="Family portrait" loading="lazy" />
```

**影片（停用預先載入）：**

```html
<video controls preload="none" poster="poster.jpg">
  <source src="video.webm" type="video/webm" />
  <source src="video.mp4" type="video/mp4" />
</video>
```

**Iframe：**

```html
<iframe src="https://example.com" loading="lazy" width="600" height="400"></iframe>
```

### Iframe 最佳實作

除非絕對必要，否則避免使用嵌入式 `<iframe>` 元件。問題包括：

- 需要額外的 HTTP 請求
- 建立一個獨立的頁面實例（成本高昂）
- 無法共用快取的資產
- 需要獨立的 CSS 和 JavaScript 處理

**替代方案：** 使用 `fetch()` 和 DOM 腳本將內容載入到同一個頁面中。

### HTML 中的 JavaScript 載入

**`async` 屬性** -- 與 DOM 解析平行擷取，不阻塞轉譯：

```html
<script async src="index.js"></script>
```

**`defer` 屬性** -- 在文件解析後但在 `DOMContentLoaded` 事件前執行。

**模組載入** -- 將程式碼分割為模組，並根據需要載入部分內容。

### 資源預先載入 (Preloading)

```html
<link rel="preload" href="sintel-short.mp4" as="video" type="video/mp4" />
```

其他用於效能的 `rel` 屬性：

- `rel="dns-prefetch"` -- 預先擷取 DNS 查詢
- `rel="preconnect"` -- 預先建立連線
- `rel="modulepreload"` -- 預先載入 JavaScript 模組
- `rel="prefetch"` -- 為未來的導覽載入資源

### 資源載入順序

1. **HTML** 首先依來源順序進行解析
2. **CSS** 進行解析；開始擷取連結的資產（影像、字型）
3. **JavaScript** 進行解析並執行（預設會阻塞隨後的 HTML 解析）
4. 為 HTML 元件計算**樣式**
5. 將樣式化內容**轉譯**到螢幕上

### 關鍵重點

HTML 本身簡單且快速。重點在於：

- 最小化下載的位元組數（影像和影片）
- 控制資產載入順序 (async, defer, preload)
- 減少不必要的嵌入內容 (iframes)
- 回應式提供替換元件 (srcset, picture, 媒體查詢)

相對於最佳化媒體資產，HTML 檔案大小縮減帶來的效益微乎其微。

---

## 5. JavaScript 效能

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/JavaScript>

### 核心原則

**先測量。** 在實作技術之前，使用瀏覽器網路和效能工具來識別真正需要最佳化的部分。

### 最佳化下載

- **使用最少量的 JavaScript** -- 對於靜態體驗避免使用框架
- **移除未使用的程式碼** -- 刪除未使用的功能
- **利用內建瀏覽器功能**：內建表單驗證、原生 `<video>` 播放器、CSS 動畫，而非 JavaScript 函式庫
- **最小化 (Minification)** -- 減少檔案字元數和位元組數
- **壓縮** -- gzip（標準）或 Brotli（通常優於 gzip）
- **模組打包工具 (Module bundlers)** -- 使用 webpack 進行最佳化和程式碼分割 (code splitting)

### 提早載入關鍵資產

```html
<!-- 預先載入標準 JavaScript -->
<link rel="preload" href="important-js.js" as="script" />

<!-- 預先載入 JavaScript 模組 -->
<link rel="modulepreload" href="important-module.js" />
```

### 延後非關鍵 JavaScript

**Async:**

```html
<script async src="main.js"></script>
```

**Defer:**

```html
<script defer src="main.js"></script>
```

**動態載入：**

```javascript
const scriptElem = document.createElement("script");
scriptElem.src = "index.js";
scriptElem.addEventListener("load", () => {
  init();
});
document.head.append(scriptElem);
```

**動態模組匯入：**

```javascript
import("./modules/myModule.js").then((module) => {
  // 使用載入的模組
});
```

### 分解長任務

超過 50ms 的任務是會阻塞主執行緒的「長任務」。使用任務讓出 (task yielding)：

```javascript
function yieldFunc() {
  if ("scheduler" in window && "yield" in scheduler) {
    return scheduler.yield();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function main() {
  const tasks = [a, b, c, d, e];
  while (tasks.length > 0) {
    const task = tasks.shift();
    task();
    await yieldFunc();
  }
}
```

### 動畫最佳實作

- 減少非必要的動畫
- 為低功率裝置的使用者提供退出選項
- 偏好 CSS 動畫而非 JavaScript（更快且更有效率）
- 對於畫布 (canvas) 動畫，使用 `requestAnimationFrame()`：

```javascript
function loop() {
  ctx.fillStyle = "rgb(0 0 0 / 25%)";
  ctx.fillRect(0, 0, width, height);
  for (const ball of balls) {
    ball.draw();
    ball.update();
  }
  requestAnimationFrame(loop);
}
loop();
```

### 事件效能

- 使用 `removeEventListener()` 移除不必要的事件接聽程式
- 使用事件委派 (event delegation)（在父代上使用單一接聽程式，而非在子代上使用多個）：

```javascript
parent.addEventListener("click", (event) => {
  if (event.target.matches(".child")) {
    // 處理子代點擊
  }
});
```

### 高效率程式碼模式

**批次 DOM 變更：**

```javascript
const fragment = document.createDocumentFragment();
for (let i = 0; i < items.length; i++) {
  const li = document.createElement("li");
  li.textContent = items[i];
  fragment.appendChild(li);
}
ul.appendChild(fragment); // 單一 DOM 操作
```

**提早結束迴圈：**

```javascript
for (let i = 0; i < array.length; i++) {
  if (array[i] === toFind) {
    processMatchingArray(array);
    break;
  }
}
```

**將工作移出迴圈：**

```javascript
// 僅擷取一次，在記憶體中進行迭代
const response = await fetch(`/results?number=${number}`);
const results = await response.json();
for (let i = 0; i < number; i++) {
  processResult(results[i]);
}
```

### 卸載計算

- **非同步 JavaScript** -- `async`/`await` 用於非阻塞 I/O
- **Web Workers** -- 將沉重的計算卸載到獨立的執行緒
- **WebGPU** -- 使用系統 GPU 進行高效能計算

---

## 6. CSS 效能

> **來源：** <https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/CSS>

### 轉譯與 CSSOM 最佳化

**移除不必要的樣式：**

- 僅解析使用的 CSS 規則
- 清除開發期間加入的未使用樣式

**將 CSS 分割為獨立模組：**

```html
<!-- 轉譯阻塞 (Render-blocking) -->
<link rel="stylesheet" href="styles.css" />

<!-- 非阻塞媒體查詢 -->
<link rel="stylesheet" href="print.css" media="print" />
<link rel="stylesheet" href="mobile.css" media="screen and (width <= 480px)" />
```

**最小化並壓縮 CSS** 作為建構流程的一部分，並在伺服器上使用 gzip 壓縮。

**簡化選擇器：**

```css
/* 避免過於複雜的選擇器 */
body div#main-content article.post h2.headline {
  font-size: 24px;
}

/* 偏好簡單選擇器 */
.headline {
  font-size: 24px;
}
```

**避免通用過度套用：**

```css
/* 有問題的用法 */
body * {
  font-size: 14px;
  display: flex;
}
```

**使用 CSS 精靈圖 (sprites) 減少 HTTP 請求** -- 將多個小圖片合併為一個檔案，並使用 `background-position`。

**預先載入關鍵資產：**

```html
<link rel="preload" href="style.css" as="style" />
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin />
```

### 動畫效能

**會引起重排 (reflow)/重繪 (repaint) 的屬性（應避免動畫化）：**

- 尺寸：`width`, `height`, `border`, `padding`
- 位置：`margin`, `top`, `bottom`, `left`, `right`
- 佈局：`align-content`, `align-items`, `flex`
- 視覺效果：`box-shadow`

**可安全進行動畫的屬性（GPU 加速）：**

- `transform`
- `opacity`
- `filter`

**尊重使用者偏好：**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 進階最佳化

**`will-change` 屬性**（僅作為最後手段使用）：

```css
.element {
  will-change: opacity, transform;
}
```

**CSS 包含 (Containment)：**

```css
article {
  contain: content;
}
```

**`content-visibility`（直到需要時才跳過轉譯）：**

```css
article {
  content-visibility: auto;
  contain-intrinsic-size: 1000px;
}
```

### 字型效能

**提早載入重要字型：**

```html
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin />
```

**僅載入必要的字符 (glyphs)：**

```css
@font-face {
  font-family: "Open Sans";
  src: url("font.woff2") format("woff2");
  unicode-range: U+0025-00FF;
}
```

**定義字型顯示行為：**

```css
@font-face {
  font-family: "someFont";
  src: url("font.woff") format("woff");
  font-display: fallback;
}
```

**字型提示：**

- 最多僅使用 2-3 種字型
- 盡可能偏好網頁安全字型 (web-safe fonts)
- 對於第三方字型提供商考慮使用 `rel="preconnect"`

---

## 7. Performance API

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/API/Performance_API>

### 概觀

Performance API 是一組用於測量網頁應用程式效能的標準。它提供內建指標，並讓開發者能夠在瀏覽器的效能時間軸中加入具有高精度時間戳記的自訂測量。

在 `Window` 和 `Worker` 全域範圍中皆可透過 `Window.performance` 和 `WorkerGlobalScope.performance` 使用。

### 核心概念

每個效能指標都由一個 `PerformanceEntry` 表示，包含：`name`、`duration`、`startTime` 和 `type`。

大多數項目會自動記錄，並可透過以下方式存取：

- `Performance.getEntries()`
- `PerformanceObserver`（偏好方法）

### 主要介面

**效能管理：**

- `Performance` -- 存取效能測量的主要介面
- `PerformanceEntry` -- 所有效能指標的基礎介面
- `PerformanceObserver` -- 接聽記錄的新效能項目

**自訂測量：**

- `PerformanceMark` -- 效能時間軸上的自訂標記
- `PerformanceMeasure` -- 兩個項目之間的自訂測量

**內建指標：**

| 介面 | 用途 |
|-----------|---------|
| `PerformanceNavigationTiming` | 文件導覽計時（載入時間等） |
| `PerformanceResourceTiming` | 資源（影像、指令碼、CSS、fetch 呼叫）的網路指標 |
| `PerformancePaintTiming` | 網頁建構期間的繪製操作 |
| `PerformanceEventTiming` | 事件延遲與 Interaction to Next Paint (INP) |
| `LargestContentfulPaint` | 最大可見內容的繪製時間 |
| `LayoutShift` | 網頁佈局穩定性指標 |
| `PerformanceLongTaskTiming` | 阻塞轉譯的長時間運行任務 |
| `PerformanceLongAnimationFrameTiming` | 長動畫幀指標 |
| `PerformanceServerTiming` | 來自 `Server-Timing` HTTP 標頭的伺服器指標 |

### 使用模式

```javascript
// 使用 PerformanceObserver (建議)
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});
observer.observe({ entryTypes: ["navigation", "resource", "paint"] });

// 自訂測量
performance.mark("start-operation");
// ... 執行工作 ...
performance.mark("end-operation");
performance.measure("operation-duration", "start-operation", "end-operation");
```

---

## 8. 效能資料

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Performance_data>

### 效能項目類型

| 項目類型 | 介面 | 用途 |
|------------|-----------|---------|
| `"element"` | PerformanceElementTiming | 特定 DOM 元件的載入與轉譯時間 |
| `"event"` | PerformanceEventTiming | 瀏覽器對事件觸發的回應時間 |
| `"first-input"` | PerformanceEventTiming | First Input Delay 測量 |
| `"largest-contentful-paint"` | LargestContentfulPaint | 網頁載入期間的最大繪製 |
| `"layout-shift"` | LayoutShift | 網頁佈局位移指標 |
| `"longtask"` | PerformanceLongTaskTiming | 持續 50ms 或更長的工作 |
| `"mark"` | PerformanceMark | 自訂開發者時間戳記 |
| `"measure"` | PerformanceMeasure | 時間戳記之間的自訂測量 |
| `"navigation"` | PerformanceNavigationTiming | 導覽與初始網頁載入指標 |
| `"paint"` | PerformancePaintTiming | 網頁載入期間的關鍵繪製時刻 |
| `"resource"` | PerformanceResourceTiming | 資源擷取持續時間 |
| `"visibility-state"` | VisibilityStateEntry | 分頁可見性狀態變更 |

### 存取效能資料

**方法 1：PerformanceObserver（偏好）**

```javascript
function logEventDuration(entries) {
  const events = entries.getEntriesByType("event");
  for (const event of events) {
    console.log(
      `事件處理程式耗時：${event.processingEnd - event.processingStart} 毫秒`
    );
  }
}

const observer = new PerformanceObserver(logEventDuration);
observer.observe({ type: "event", buffered: true });
```

PerformanceObserver 的優點：

- 自動過濾重複項目
- 閒置期間非同步遞送
- 某些項目類型是必需的
- 較低的效能影響

**方法 2：直接查詢方法**

```javascript
performance.getEntries();              // 所有項目
performance.getEntriesByType(type);    // 特定類型的項目
performance.getEntriesByName(name);    // 特定名稱的項目
```

### 效能項目緩衝區大小

| 項目類型 | 最大緩衝區大小 |
|------------|----------------|
| `"resource"` | 250 (可調整) |
| `"longtask"` | 200 |
| `"element"` | 150 |
| `"event"` | 150 |
| `"layout-shift"` | 150 |
| `"largest-contentful-paint"` | 150 |
| `"visibility-state"` | 50 |
| `"mark"` | 無限 |
| `"measure"` | 無限 |
| `"navigation"` | 無限 |
| `"paint"` | 2 (固定) |
| `"first-input"` | 1 (固定) |

### 處理丟棄的項目

```javascript
function perfObserver(list, observer, droppedEntriesCount) {
  list.getEntries().forEach((entry) => {
    // 處理項目
  });
  if (droppedEntriesCount > 0) {
    console.warn(
      `由於緩衝區已滿，丟棄了 ${droppedEntriesCount} 個項目。`
    );
  }
}
const observer = new PerformanceObserver(perfObserver);
observer.observe({ type: "resource", buffered: true });
```

### JSON 序列化

所有效能項目皆提供 `toJSON()` 方法：

```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(entry.toJSON());
  });
});
observer.observe({ type: "event", buffered: true });
```

### 選用指標

某些指標需要明確設定：

- **Element Timing** -- 在元件中加入 `elementtiming` 屬性
- **User Timing** -- 在相關點呼叫 Performance API 方法
- **Server Timing** -- 伺服器傳送 `Server-Timing` HTTP 標頭

---

## 9. 伺服器計時 (Server Timing)

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Server_timing>

### 什麼是伺服器計時？

伺服器計時是 Performance API 的一部分，允許伺服器將有關請求-回應週期的指標傳遞給使用者代理。它會呈現後端伺服器計時指標，例如資料庫讀取/寫入時間、CPU 時間和檔案系統存取。

### Server-Timing HTTP 標頭範例

```http
// 無值的單一指標
Server-Timing: missedCache

// 有值的單一指標
Server-Timing: cpu;dur=2.4

// 有描述和值的單一指標
Server-Timing: cache;desc="Cache Read";dur=23.2

// 有值的兩個指標
Server-Timing: db;dur=53, app;dur=47.2

// 將 Server-Timing 作為 trailer
Trailer: Server-Timing
--- 回應主體 ---
Server-Timing: total;dur=123.4
```

### 在 JavaScript 中擷取伺服器指標

伺服器計時指標儲存為 `PerformanceServerTiming` 項目，可透過 `PerformanceResourceTiming.serverTiming` 屬性在 `"navigation"` 和 `"resource"` 效能項目中存取。

```javascript
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    entry.serverTiming.forEach((serverEntry) => {
      console.log(
        `${serverEntry.name} (${serverEntry.description}) 持續時間：${serverEntry.duration}`
      );
      // 記錄 "cache (Cache Read) duration: 23.2"
      // 記錄 "db () duration: 53"
      // 記錄 "app () duration: 47.2"
    });
  });
});

["navigation", "resource"].forEach((type) =>
  observer.observe({ type, buffered: true })
);
```

### 隱私與安全性考量

- `Server-Timing` 標頭可能洩漏敏感的應用程式和基礎設施資訊；指標應僅傳回給已驗證的使用者
- `PerformanceServerTiming` 預設限制為同源
- 使用 `Timing-Allow-Origin` 標頭來指定允許跨域的網域
- 在某些瀏覽器中僅適用於安全內容 (HTTPS)
- 伺服器、用戶端和中間代理伺服器之間沒有時鐘同步；伺服器時間戳記可能無法有意義地對應到用戶端時間軸的 `startTime`

---

## 10. 使用者計時 (User Timing)

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/User_timing>

### 概觀

使用者計時是 Performance API 的一部分，允許您使用高精度時間戳記測量應用程式效能。它由兩個主要元件組成：

- **`PerformanceMark`** 項目 -- 應用程式中任何位置的命名標記
- **`PerformanceMeasure`** 項目 -- 兩個標記之間的時間測量

### 加入效能標記

```javascript
// 基本標記
performance.mark("login-started");
performance.mark("login-finished");

// 帶有選項的進階標記
performance.mark("login-started", {
  startTime: 12.5,
  detail: { htmlElement: myElement.id },
});
```

### 測量標記之間的持續時間

```javascript
const loginMeasure = performance.measure(
  "login-duration",
  "login-started",
  "login-finished"
);
console.log(loginMeasure.duration);
```

**從事件時間戳記到標記的進階測量：**

```javascript
loginButton.addEventListener("click", (clickEvent) => {
  fetch(loginURL).then((data) => {
    renderLoggedInUser(data);
    const marker = performance.mark("login-finished");
    performance.measure("login-click", {
      detail: { htmlElement: myElement.id },
      start: clickEvent.timeStamp,
      end: marker.startTime,
    });
  });
});
```

### 觀察效能測量

```javascript
function perfObserver(list, observer) {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === "mark") {
      console.log(`${entry.name}'s startTime: ${entry.startTime}`);
    }
    if (entry.entryType === "measure") {
      console.log(`${entry.name}'s duration: ${entry.duration}`);
    }
  });
}
const observer = new PerformanceObserver(perfObserver);
observer.observe({ entryTypes: ["measure", "mark"] });
```

### 擷取標記與測量

```javascript
// 所有項目
const entries = performance.getEntries();

// 依類型過濾
const marks = performance.getEntriesByType("mark");
const measures = performance.getEntriesByType("measure");

// 依名稱擷取
const debugMarks = performance.getEntriesByName("debug-mark", "mark");
```

### 移除標記與測量

```javascript
// 清除所有標記
performance.clearMarks();

// 移除特定標記
performance.clearMarks("myMarker");

// 清除所有測量
performance.clearMeasures();

// 移除特定測量
performance.clearMeasures("myMeasure");
```

### 優於 Date.now() 和 performance.now() 的點

- 有意義的名稱以便於組織
- 整合瀏覽器開發者工具 (Performance 面板)
- 與 `PerformanceObserver` 等其他 Performance API 無縫搭配
- 整體而言與工具的整合度更高
