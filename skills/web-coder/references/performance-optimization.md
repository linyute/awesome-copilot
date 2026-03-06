# 效能與最佳化參考 (Performance & Optimization Reference)

網頁效能指標、最佳化技術與核心網頁指標 (Core Web Vitals) 的全面參考。

## 核心網頁指標 (Core Web Vitals)

Google 用於衡量使用者體驗的指標。

### 最大內容繪製 (Largest Contentful Paint, LCP)

衡量載入效能 - 當最大的內容元件變為可見的時間。

**目標**：< 2.5 秒

**最佳化方法**：
- 減少伺服器回應時間
- 最佳化圖片
- 移除阻礙轉譯的資源
- 使用 CDN
- 實作延遲載入 (Lazy loading)
- 預載關鍵資源

```html
<link rel="preload" href="hero-image.jpg" as="image">
```

### 首次輸入延遲 (FID) → 下次繪製互動 (Interaction to Next Paint, INP)

FID（已遭取代）衡量輸入回應能力。INP 是新的指標。

**INP 目標**：< 200 毫秒

**最佳化方法**：
- 最小化 JavaScript 執行時間
- 拆分長工作 (Long tasks)
- 使用 Web Workers
- 最佳化第三方指令碼
- 使用 `requestIdleCallback`

### 累計版面配置位移 (Cumulative Layout Shift, CLS)

衡量視覺穩定性 - 意外的版面配置位移。

**目標**：< 0.1

**最佳化方法**：
- 指定圖片/影片尺寸
- 避免在現有內容上方插入內容
- 使用 CSS `aspect-ratio`
- 為動態內容保留空間

```html
<img src="image.jpg" width="800" height="600" alt="照片">

<style>
  .video-container {
    aspect-ratio: 16 / 9;
  }
</style>
```

## 其他效能指標

### 首次內容繪製 (First Contentful Paint, FCP)
第一個內容元件轉譯的時間。  
**目標**：< 1.8 秒

### 第一個位元組時間 (Time to First Byte, TTFB)
瀏覽器收到回應的第一個位元組所需的時間。  
**目標**：< 600 毫秒

### 互動時間 (Time to Interactive, TTI)
頁面變得可以完全互動的時間。  
**目標**：< 3.8 秒

### 速度指數 (Speed Index)
內容在視覺上顯示的速度。  
**目標**：< 3.4 秒

### 總封鎖時間 (Total Blocking Time, TBT)
所有長工作封鎖時間的總和。  
**目標**：< 200 毫秒

## 圖片最佳化

### 格式選擇

| 格式 | 最適合用於 | 優點 | 缺點 |
|--------|----------|------|------|
| JPEG | 照片 | 檔案小、支援廣泛 | 失真壓縮、不支援透明 |
| PNG | 圖形、透明需求 | 無損壓縮、支援透明 | 檔案較大 |
| WebP | 現代瀏覽器 | 檔案小、支援透明 | 對舊版瀏覽器支援有限 |
| AVIF | 最新格式 | 壓縮率最佳 | 支援度有限 |
| SVG | 圖示、標誌 | 可縮放、檔案小 | 不適合照片 |

### 回應式圖片

```html
<!-- 使用 picture 元件進行藝術指導 (Art direction) -->
<picture>
  <source media="(min-width: 1024px)" srcset="large.webp" type="image/webp">
  <source media="(min-width: 768px)" srcset="medium.webp" type="image/webp">
  <source media="(min-width: 1024px)" srcset="large.jpg">
  <source media="(min-width: 768px)" srcset="medium.jpg">
  <img src="small.jpg" alt="回應式圖片">
</picture>

<!-- 使用 srcset 進行解析度切換 -->
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w,
          image-800.jpg 800w,
          image-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px,
         (max-width: 1000px) 800px,
         1200px"
  alt="圖片">

<!-- 延遲載入 -->
<img src="image.jpg" loading="lazy" alt="延遲載入的圖片">
```

### 圖片壓縮

- 使用 ImageOptim、Squoosh 或 Sharp 等工具
- JPEG 目標品質設為 80-85%
- 使用漸進式 (Progressive) JPEG
- 移除 Metadata (Metadata)

## 程式碼最佳化

### 縮減 (Minification)

移除空格、註釋、縮短名稱：

```javascript
// 縮減前
function calculateTotal(price, tax) {
  const total = price + (price * tax);
  return total;
}

// 縮減後
function t(p,x){return p+p*x}
```

**工具**：Terser (JS)、cssnano (CSS)、html-minifier

### 程式碼拆分 (Code Splitting)

將程式碼拆分為較小的區塊，並依需求載入：

```javascript
// 動態匯入
button.addEventListener('click', async () => {
  const module = await import('./heavy-module.js');
  module.run();
});

// React 延遲載入
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Webpack 程式碼拆分
import(/* webpackChunkName: "lodash" */ 'lodash').then(({ default: _ }) => {
  // 使用 lodash
});
```

### Tree Shaking

在建構過程中移除未使用的程式碼：

```javascript
// 僅匯入有使用的部分
import { debounce } from 'lodash-es';

// 使用 ESM 匯出可啟用 tree shaking
export { function1, function2 };
```

### 壓縮

啟用 gzip 或 brotli 壓縮：

```nginx
# nginx 設定
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# brotli (壓縮率更好)
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

## 快取策略

### 快取控制標頭 (Cache-Control Headers)

```http
# 不可變資產 (具備版本號的 URL)
Cache-Control: public, max-age=31536000, immutable

# HTML (一律重新驗證)
Cache-Control: no-cache

# API 回應 (短時間快取)
Cache-Control: private, max-age=300

# 不進行快取
Cache-Control: no-store
```

### Service Workers

進階快取控制：

```javascript
// 快取優先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 網路優先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 過時同步驗證 (Stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('dynamic').then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return response || fetchPromise;
      });
    })
  );
});
```

## 載入策略

### 關鍵轉譯路徑 (Critical Rendering Path)

1. 從 HTML 建構 DOM
2. 從 CSS 建構 CSSOM
3. 合併 DOM + CSSOM 成為轉譯樹 (Render tree)
4. 計算版面配置 (Layout)
5. 繪製 (Paint) 像素

### 資源提示 (Resource Hints)

```html
<!-- DNS 預取 -->
<link rel="dns-prefetch" href="//example.com">

<!-- 預先連線 (DNS + TCP + TLS) -->
<link rel="preconnect" href="https://fonts.googleapis.com">

<!-- 預取 (下個頁面的低優先權資源) -->
<link rel="prefetch" href="next-page.js">

<!-- 預載 (當前頁面的高優先權資源) -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 預先轉譯 (在背景轉譯下個頁面) -->
<link rel="prerender" href="next-page.html">
```

### 延遲載入 (Lazy Loading)

#### 圖片 - 原生延遲載入

    <img src="image.jpg" loading="lazy">

```javascript
// 使用 Intersection Observer 進行自訂延遲載入
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img);
});
```

### 關鍵 CSS (Critical CSS)

將首屏 (Above-the-fold) CSS 以行內方式呈現，延遲其餘部分：

```html
<head>
  <style>
    /* 行內關鍵 CSS */
    body { margin: 0; font-family: sans-serif; }
    .header { height: 60px; background: #333; }
  </style>
  
  <!-- 延遲載入非關鍵 CSS -->
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
```

## JavaScript 效能

### 防震 (Debouncing) 與節流 (Throttling)

```javascript
// 防震 - 延遲一段時間後執行
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// 用法
const handleSearch = debounce((query) => {
  // 搜尋邏輯
}, 300);

// 節流 - 在特定間隔內最多執行一次
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 用法
const handleScroll = throttle(() => {
  // 捲動邏輯
}, 100);
```

### 長工作 (Long Tasks)

使用 `requestIdleCallback` 進行拆分：

```javascript
function processLargeArray(items) {
  let index = 0;
  
  function processChunk() {
    const deadline = performance.now() + 50; // 50 毫秒預算
    
    while (index < items.length && performance.now() < deadline) {
      // 處理項目
      processItem(items[index]);
      index++;
    }
    
    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }
  
  requestIdleCallback(processChunk);
}
```

### Web Workers

將繁重計算移出主執行緒 (Main thread)：

```javascript
// main.js
const worker = new Worker('worker.js');
worker.postMessage({ data: largeDataset });

worker.onmessage = (event) => {
  console.log('結果：', event.data);
};

// worker.js
self.onmessage = (event) => {
  const result = heavyComputation(event.data);
  self.postMessage(result);
};
```

## 效能監控

### Performance API

```javascript
// 導覽計時 (Navigation timing)
const navTiming = performance.getEntriesByType('navigation')[0];
console.log('DOM 已載入：', navTiming.domContentLoadedEventEnd);
console.log('頁面已載入：', navTiming.loadEventEnd);

// 資源計時 (Resource timing)
const resources = performance.getEntriesByType('resource');
resources.forEach(resource => {
  console.log(resource.name, resource.duration);
});

// 標記與衡量自訂計時
performance.mark('start-task');
// 執行工作
performance.mark('end-task');
performance.measure('task-duration', 'start-task', 'end-task');

const measure = performance.getEntriesByName('task-duration')[0];
console.log('工作耗時：', measure.duration, '毫秒');

// 效能條目觀察器
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('效能條目：', entry);
  }
});
observer.observe({ entryTypes: ['measure', 'mark', 'resource'] });
```

### Web Vitals 函式庫

```javascript
import { getLCP, getFID, getCLS } from 'web-vitals';

getLCP(console.log);
getFID(console.log);
getCLS(console.log);
```

## 內容傳遞網路 (Content Delivery Network, CDN)

透過全域伺服器發送內容，以實現更快的傳遞。

**優點**：
- 降低延遲
- 改善載入時間
- 提高可用性
- 降低頻寬成本

**熱門 CDN**：
- Cloudflare
- Amazon CloudFront
- Fastly
- Akamai

## 最佳實踐

### 應做事項 (Do's)
- ✅ 最佳化圖片（格式、壓縮、大小）
- ✅ 縮減並壓縮程式碼
- ✅ 實作快取策略
- ✅ 使用 CDN 處理靜態資產
- ✅ 延遲載入非關鍵資源
- ✅ 延遲執行非關鍵 JavaScript
- ✅ 行內化關鍵 CSS
- ✅ 使用 HTTP/2 或 HTTP/3
- ✅ 監控核心網頁指標
- ✅ 設定效能預算

### 禁忌事項 (Don'ts)
- ❌ 提供未經最佳化的圖片
- ❌ 使用指令碼阻礙轉譯
- ❌ 導致版面配置位移
- ❌ 發送過多的 HTTP 請求
- ❌ 載入未使用的程式碼
- ❌ 在主執行緒上使用同步操作
- ❌ 忽略效能指標
- ❌ 忘記行動裝置的效能

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- bfcache
- 頻寬 (Bandwidth)
- Brotli 壓縮 (Brotli compression)
- 程式碼拆分 (Code splitting)
- 壓縮字典傳輸 (Compression Dictionary Transport)
- 累計版面配置位移 (CLS)
- Delta
- 首次內容繪製 (FCP)
- 首次 CPU 閒置 (First CPU idle)
- 首次輸入延遲 (FID)
- 首次有效繪製 (FMP)
- 首次繪製 (FP)
- 漸進式降級 (Graceful degradation)
- gzip 壓縮 (gzip compression)
- 下次繪製互動 (INP)
- 延遲 (Jank)
- 抖動 (Jitter)
- 最大內容繪製 (LCP)
- 延遲 (Latency)
- 延遲載入 (Lazy load)
- 長工作 (Long task)
- 無損壓縮 (Lossless compression)
- 失真壓縮 (Lossy compression)
- 縮減 (Minification)
- 網路頻寬限制 (Network throttling)
- 頁面載入時間 (Page load time)
- 頁面預測 (Page prediction)
- 感知效能 (Perceived performance)
- 預取 (Prefetch)
- 預先轉譯 (Prerender)
- 漸進式增強 (Progressive enhancement)
- RAIL
- 即時使用者監控 (RUM)
- 重排 (Reflow)
- 阻礙轉譯 (Render-blocking)
- 重繪 (Repaint)
- 資源計時 (Resource Timing)
- 來回通訊時間 (RTT)
- 伺服器計時 (Server Timing)
- 速度指數 (Speed index)
- 投機解析 (Speculative parsing)
- 綜合監控 (Synthetic monitoring)
- 第一個位元組時間 (TTFB)
- 互動時間 (TTI)
- Tree shaking
- 網頁效能 (Web performance)
- Zstandard 壓縮 (Zstandard compression)

## 額外資源

- [Web.dev Performance](https://web.dev/performance/)
- [MDN 效能 (Performance)](https://developer.mozilla.org/en-US/docs/Web/Performance)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
