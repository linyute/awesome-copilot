---
applyTo: '**'
description: '基於 Core Web Vitals (LCP, INP, CLS) 的全面網頁效能標準，包含 50+ 反模式、檢測正規表示式、針對現代網頁框架的特定修正與現代 API 指引。'
---

# 效能標準 (Performance Standards)

網頁應用程式開發的全面效能規則。每個反模式 (anti-pattern) 皆包含嚴重性分類、檢測方法、受影響的 Core Web Vitals 指標以及修正程式碼範例。

**嚴重性等級：**

- **CRITICAL (關鍵)** — 直接使 Core Web Vital 劣化至「差」的閾值以下。合併前必須修正。
- **IMPORTANT (重要)** — 顯著影響使用者體驗。在同一個開發週期內修正。
- **SUGGESTION (建議)** — 優化機會。規劃於未來迭代中處理。

---

## Core Web Vitals 快速參考

### LCP (最大內容繪製)

**良好：< 2.5s | 需要改善：2.5-4s | 差：> 4s**

衡量最大可見內容元素完成渲染的時間。分為四個連續階段：

| 階段 | 目標 | 衡量項目 |
|-------|--------|-----------------|
| TTFB | ~40% 的預算 | 伺服器回應時間 |
| 資源載入延遲 | < 10% | TTFB 與 LCP 資源開始擷取之間的時間 |
| 資源載入持續時間 | ~40% | LCP 資源的下載時間 |
| 元素渲染延遲 | < 10% | 下載與繪製之間的時間 |

### INP (互動至下一次繪製)

**良好：< 200ms | 需要改善：200-500ms | 差：> 500ms**

衡量所有使用者互動的延遲，並報告最差值。分為三個階段：

| 階段 | 優化 |
|-------|-------------|
| 輸入延遲 | 中斷長任務，讓出 (yield) 給瀏覽器 |
| 處理時間 | 保持處理常式 < 50ms |
| 呈現延遲 | 最小化 DOM 大小，避免強制佈局 |

> **診斷工具**：使用 Long Animation Frames (LoAF) API (Chrome 123+) 來偵錯 INP 問題。LoAF 提供比舊版 Long Tasks API 更好的歸因，包括指令碼來源與渲染時間。

### CLS (累計版面配置位移)

**良好：< 0.1 | 需要改善：0.1-0.25 | 差：> 0.25**

版面配置位移來源：缺少維度的圖像、動態注入內容、Web 字型 FOUT、延遲載入的廣告。使用者互動後 500ms 內的位移可豁免。

---

## 載入與 LCP 反模式 (L1-L10)

### L1: 未提取關鍵 CSS 的渲染阻塞 CSS

- **嚴重性**：CRITICAL
- **檢測**：`<head>` 中的 `<link.*rel="stylesheet"` 載入大型 CSS
- **CWV**：LCP

```html
<!-- 錯誤 -->
<link rel="stylesheet" href="/styles/main.css" />

<!-- 正確 — 內嵌關鍵 CSS (建構時提取)，預載其餘部分 -->
<style>/* 關鍵首屏 CSS，由 Critters/Beasties 等工具內嵌 */</style>
<link rel="preload" href="/styles/main.css" as="style" />
<link rel="stylesheet" href="/styles/main.css" />
```

建議採用建構時的關鍵 CSS 提取 (例如 Critters, Beasties, Next.js `experimental.optimizeCss`)，並搭配一般的 `<link rel="stylesheet">`。避免使用舊式的 `media="print" onload="this.media='all'"` 技巧：在嚴格的 CSP (無 `'unsafe-inline'` / 無 `script-src-attr 'unsafe-inline'`) 下，內嵌事件處理程式會被封鎖，導致樣式表永遠無法啟動，造成樣式回歸。若確實必須延遲載入非關鍵 CSS，請透過 **外部** 指令碼進行切換，而非使用內嵌處理程式。

### L2: 渲染阻塞同步指令碼

- **嚴重性**：CRITICAL
- **檢測**：`<script.*src=` 未使用 `async|defer|type="module"`
- **CWV**：LCP

```html
<!-- 錯誤 -->
<script src="/vendor/analytics.js"></script>

<!-- 正確 -->
<script src="/vendor/analytics.js" defer></script>
```

### L3: 缺少對關鍵來源的預連線 (Preconnect)

- **嚴重性**：IMPORTANT
- **檢測**：缺少 `<link rel="preconnect">` 的第三方 API/CDN URL
- **CWV**：LCP

```html
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="https://analytics.example.com" />
```

### L4: 缺少 LCP 資源的預載 (Preload)

- **嚴重性**：CRITICAL
- **檢測**：LCP 圖像/字型未預載
- **CWV**：LCP

```html
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />
```

### L5: 主要內容的用戶端資料擷取

- **嚴重性**：CRITICAL
- **檢測**：`useEffect.*fetch|useEffect.*axios|ngOnInit.*subscribe`
- **CWV**：LCP

```tsx
// 錯誤 — 內容在 JS 執行 + API 呼叫後出現
'use client';
function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <div>{data?.title}</div>;
}

// 正確 — Server Component 在 HTML 發送前擷取資料
async function Page() {
  const data = await fetch('https://api.example.com/data').then(r => r.json());
  return <div>{data.title}</div>;
}
```

### L6: 過多的重新導向鏈 (Redirect Chains)

- **嚴重性**：IMPORTANT
- **檢測**：多次連續重新導向 (HTTP 301/302 鏈)
- **CWV**：LCP

每次重新導向會增加 200-300ms。最多僅允許一次重新導向。

### L7: LCP 元素缺少 fetchpriority

- **嚴重性**：IMPORTANT
- **檢測**：首屏 Hero 圖像缺少 `fetchpriority="high"` 或 `priority` 屬性
- **CWV**：LCP

```tsx
// Next.js
<Image src="/hero.webp" alt="Hero" width={1200} height={600} priority />

// Angular
<img ngSrc="/hero.webp" alt="Hero" width="1200" height="600" priority>

// 一般 HTML
<img src="/hero.webp" alt="Hero" width="1200" height="600" fetchpriority="high" />
```

### L8: Head 中的第三方指令碼未設定 Async/Defer

- **嚴重性**：IMPORTANT
- **檢測**：`<script.*src="https://` 未設定 `async|defer`
- **CWV**：LCP

延遲載入非必要指令碼。針對聊天視窗等使用 Facade 模式。

### L9: 過大的初始 HTML (>14KB)

- **嚴重性**：SUGGESTION
- **檢測**：伺服器渲染 HTML 大於 14KB
- **CWV**：LCP

減少內嵌 CSS/JS，移除空白字元，使用帶有 Suspense 邊界的串流 SSR。

### L10: 缺少壓縮

- **嚴重性**：IMPORTANT
- **檢測**：伺服器未回傳 `content-encoding: br` 或 `gzip`
- **CWV**：LCP

於 CDN/伺服器層級啟用 Brotli (比 gzip 縮小 15-25%)。

---

## 渲染與水合 (Hydration) 反模式 (R1-R8)

### R1: 整個元件樹標記為 "use client"

- **嚴重性**：CRITICAL
- **檢測**：頂層 Layout 或頁面元件使用 `"use client"`
- **CWV**：LCP + INP

將 `"use client"` 下放到需要互動性的葉元件 (leaf components) 中。

### R2: 非同步資料缺少 Suspense 邊界

- **嚴重性**：IMPORTANT
- **檢測**：Server Components 執行資料擷取卻沒有 `<Suspense>`
- **CWV**：LCP

```tsx
// 正確 — 立即串流 Shell，並逐步填入資料
async function Page() {
  const user = await getUser();
  return (
    <div>
      <Header user={user} />
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
    </div>
  );
}
```

### R3: 動態用戶端內容導致水合不匹配 (Hydration Mismatch)

- **嚴重性**：IMPORTANT
- **檢測**：SSR 元件中使用 `Date.now()|Math.random()|window\.innerWidth`
- **CWV**：CLS

針對僅限用戶端的數值使用 `useEffect`，或針對已知差異使用 `suppressHydrationWarning`。

### R4: 緩慢資料來源缺少串流

- **嚴重性**：IMPORTANT
- **檢測**：頁面等待所有資料取得後才發送 HTML
- **CWV**：LCP (TTFB)

使用帶有 Suspense 邊界的串流 SSR。Shell 立即串流；緩慢資料逐步填入。

### R5: 不穩定的參考 (References) 導致重新渲染

- **嚴重性**：IMPORTANT
- **檢測**：JSX 中內嵌 `style=\{\{|onClick=\{\(\) =>`
- **CWV**：INP

React 19+ 啟用 React Compiler (獨立的 babel/SWC 建構外掛)：自動記憶化 (memoization)。若無編譯器：使用 `useMemo`/`useCallback` 提取或記憶化。Angular：OnPush。Vue：`computed()`。

### R6: 大型清單缺少虛擬化 (Virtualization)

- **嚴重性**：IMPORTANT
- **檢測**：`.map(` 渲染 >100 個項目且無虛擬捲動
- **CWV**：INP

使用 TanStack Virtual, react-window, Angular CDK Virtual Scroll, 或 vue-virtual-scroller。

### R7: SSR 立即隱藏的內容

- **嚴重性**：SUGGESTION
- **檢測**：伺服器渲染 `display: none` 元件
- **CWV**：LCP (TTFB)

針對 Modal、抽屜、下拉選單使用用戶端渲染。Angular：`@defer`。React：`React.lazy`。

### R8: 清單項目缺少 `key` 屬性

- **嚴重性**：IMPORTANT
- **檢測**：`.map(` 未設定 `key=` 屬性
- **CWV**：INP

```tsx
// 正確 — 穩定且唯一 key
{items.map(item => <Row key={item.id} data={item} />)}
```

若清單可重排序，絕對不要使用陣列索引做為 key。

---

## JavaScript 執行階段與 INP 反模式 (J1-J8)

### J1: 事件處理常式中的長時間同步任務

- **嚴重性**：CRITICAL
- **檢測**：處理常式執行繁重運算 (>50ms)
- **CWV**：INP

```typescript
// 正確 — 讓出給瀏覽器
async function handleClick() {
  setLoading(true);
  await (globalThis.scheduler?.yield?.() ?? new Promise(r => setTimeout(r, 0)));
  const result = expensiveComputation(data);
  setResult(result);
}
```

將繁重工作移至 Web Worker 以獲得最佳結果。

> **注意**：`scheduler.yield()` 支援於 Chrome 129+, Firefox 129+，但截至 2026 年 4 月尚未支援 Safari。備援方案：`await (globalThis.scheduler?.yield?.() ?? new Promise(r => setTimeout(r, 0)))`。

### J2: 佈局顛簸 (Layout Thrashing)

- **嚴重性**：CRITICAL
- **檢測**：迴圈中使用 `offsetHeight|offsetWidth|getBoundingClientRect|clientHeight`
- **CWV**：INP

```typescript
// 正確 — 先批次讀取，再批次寫入
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => { el.style.height = `${heights[i] + 10}px`; });
```

### J3: setInterval/setTimeout 缺少清理

- **嚴重性**：IMPORTANT
- **檢測**：`setInterval|setTimeout` 未清理
- **影響**：記憶體

```tsx
useEffect(() => {
  const id = setInterval(() => fetchData(), 5000);
  return () => clearInterval(id);
}, []);
```

### J4: addEventListener 缺少 removeEventListener

- **嚴重性**：IMPORTANT
- **檢測**：`addEventListener` 未清理
- **影響**：記憶體

```tsx
useEffect(() => {
  const controller = new AbortController();
  window.addEventListener('resize', handleResize, { signal: controller.signal });
  return () => controller.abort();
}, []);
```

### J5: 脫離的 DOM 節點參考

- **嚴重性**：SUGGESTION
- **檢測**：持有已移除 DOM 元素參考的變數
- **影響**：記憶體

當元素移除時，將參考設為 `null`。

### J6: 同步 XHR

- **嚴重性**：CRITICAL
- **檢測**：帶有同步旗標的 `XMLHttpRequest`
- **CWV**：INP

使用 `fetch()` (永遠為非同步)。

### J7: 主執行緒上的繁重運算

- **嚴重性**：IMPORTANT
- **檢測**：元件程式碼中的 CPU 密集型操作
- **CWV**：INP

移動至 Web Worker 或透過 `scheduler.yield()` 切分為多個區塊。

### J8: 缺少 Effect 清理

- **嚴重性**：IMPORTANT
- **檢測**：`useEffect` 未回傳清理函式；`subscribe` 未取消訂閱
- **影響**：記憶體

React：從 `useEffect` 回傳清理函式。Angular：`takeUntilDestroyed()`。Vue：`onUnmounted`。

---

## CSS 效能反模式 (C1-C7)

### C1: 使用觸發佈局屬性的動畫

- **嚴重性**：CRITICAL
- **檢測**：`animation:|transition:` 使用 `top|left|width|height|margin|padding`
- **CWV**：INP

```css
/* 錯誤 — 主執行緒，<60fps */
.card { transition: width 0.3s, height 0.3s; }

/* 正確 — GPU 合成器，60fps */
.card { transition: transform 0.3s, opacity 0.3s; }
.card:hover { transform: scale(1.05); }
```

### C2: 頁面外區段缺少 content-visibility

- **嚴重性**：SUGGESTION
- **檢測**：長頁面未設定 `content-visibility: auto`
- **CWV**：INP

```css
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

### C3: will-change 永久應用

- **嚴重性**：SUGGESTION
- **檢測**：基礎 CSS 中的 `will-change:` (而非 `:hover|:focus`)
- **影響**：記憶體

僅在互動時應用，或讓瀏覽器自動優化。

### C4: 大量未使用的 CSS

- **嚴重性**：IMPORTANT
- **檢測**：CSS 中 >50% 的規則未使用
- **CWV**：LCP

使用 PurgeCSS, Tailwind purge, 或 critters。針對路由進行 CSS 程式碼分割。

### C5: 熱路徑中的通用選擇器

- **嚴重性**：SUGGESTION
- **檢測**：CSS 中的 `\* \{`
- **CWV**：INP

```css
/* 正確 — 零特異性重設 */
:where(*, *::before, *::after) { box-sizing: border-box; }
```

### C6: 缺少 CSS 封裝 (Containment)

- **嚴重性**：SUGGESTION
- **檢測**：複雜元件缺少 `contain` 屬性
- **CWV**：INP

```css
.sidebar { contain: layout style paint; }
```

### C7: 路由切換缺少 View Transitions API

- **嚴重性**：SUGGESTION
- **檢測**：SPA 路由變更未使用 View Transitions API
- **CWV**：CLS (感知上)

```javascript
// 使用 View Transitions 進行平滑路由變更 (需功能檢查)
if (document.startViewTransition) {
  document.startViewTransition(() => {
    // 更新 DOM / 導覽
  });
} else {
  // 備援: 直接更新 DOM
}
```

同文件轉換在所有主流瀏覽器皆支援。跨文件轉換支援於 Chrome/Edge 126+, Safari 18.5+。呼叫前務必進行功能檢查 — 不支援的瀏覽器若無防護會拋出錯誤。

---

## 圖像、媒體與字型反模式 (I1-I8)

### I1: 圖像缺少尺寸

- **嚴重性**：CRITICAL
- **檢測**：`<img` 未使用 `width=` 與 `height=`
- **CWV**：CLS

務必在圖像上設定 `width` 與 `height`，或在 CSS 中使用 `aspect-ratio`。

### I2: 首屏圖像延遲載入 (Lazy Loading)

- **嚴重性**：CRITICAL
- **檢測**：Hero/Banner 圖像設定 `loading="lazy"`
- **CWV**：LCP

```html
<!-- 正確 — 高優先順序立即載入 -->
<img src="/hero.webp" alt="Hero" fetchpriority="high" />
```

### I3: 僅支援舊版格式 (JPEG/PNG)

- **嚴重性**：IMPORTANT
- **檢測**：圖像未提供 WebP/AVIF 替代方案
- **CWV**：LCP

```html
<picture>
  <source srcset="/hero.avif" type="image/avif" />
  <source srcset="/hero.webp" type="image/webp" />
  <img src="/hero.jpg" alt="Hero" width="1200" height="600" />
</picture>
```

### I4: 缺少回應式 srcset/sizes

- **嚴重性**：IMPORTANT
- **檢測**：`<img` 缺少 `srcset`
- **CWV**：LCP

```html
<img src="/hero-800.jpg" alt="Hero"
     srcset="/hero-400.jpg 400w, /hero-800.jpg 800w, /hero-1200.jpg 1200w"
     sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px" />
```

### I5: 字型缺少 font-display

- **嚴重性**：IMPORTANT
- **檢測**：`@font-face` 缺少 `font-display`
- **CWV**：CLS

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* 或 "optional" 以獲得最佳 CLS */
}
```

### I6: 關鍵字型未預載

- **嚴重性**：IMPORTANT
- **檢測**：自訂字型缺少 `<link rel="preload">`
- **CWV**：LCP + CLS

```html
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />
```

### I7: 當子集字型足夠時載入完整字型

- **嚴重性**：SUGGESTION
- **檢測**：字型檔案 > 50KB WOFF2
- **CWV**：LCP

使用 `unicode-range`、透過 glyphhanger 進行子集化，或使用 `next/font` (自動子集化 Google 字型)。

### I8: 未優化 SVG

- **嚴重性**：SUGGESTION
- **檢測**：包含編輯器中繼資料的 SVG
- **CWV**：LCP (次要)

```bash
npx svgo input.svg -o output.svg
```

---

## 捆綁 (Bundle) 與 Tree Shaking 反模式 (B1-B6)

### B1: Barrel File 匯入整個模組

- **嚴重性**：IMPORTANT
- **檢測**：`from '\.\/(?:.*\/index|components)'`
- **CWV**：INP

```typescript
// 錯誤
import { Button } from './components';

// 正確 — 直接匯入
import { Button } from './components/Button';
```

### B2: CommonJS require() 導致無法 Tree Shaking

- **嚴重性**：IMPORTANT
- **檢測**：前端程式碼中的 `require(`
- **CWV**：INP

使用 ESM `import/export`。以 `import` 取代 `require`。

### B3: 小型工具引入大型相依性

- **嚴重性**：IMPORTANT
- **檢測**：`from "moment"|from "lodash"` (完整匯入)
- **CWV**：INP

```typescript
// 正確 — Tree-shakeable 替代方案
import { format } from 'date-fns';
import { pick } from 'lodash-es';

// 最佳 — 原生 JS
const formatted = new Intl.DateTimeFormat('en').format(date);
```

### B4: 路由分割缺少動態匯入

- **嚴重性**：CRITICAL
- **檢測**：所有路由元件皆靜態匯入
- **CWV**：INP

```tsx
// Next.js: 透過基於檔案路由自動化
// React:
const Page = React.lazy(() => import('./pages/Page'));
// Angular:
{ path: 'settings', loadComponent: () => import('./pages/settings.component') }
// Vue:
const Page = defineAsyncComponent(() => import('./pages/Page.vue'));
```

### B5: package.json 缺少 sideEffects

- **嚴重性**：SUGGESTION
- **檢測**：函式庫 package.json 未定義 `"sideEffects"` 欄位
- **CWV**：INP

```json
{ "sideEffects": false }
```

### B6: 重複相依性

- **嚴重性**：SUGGESTION
- **檢測**：同一函式庫存在多個版本
- **CWV**：INP

```bash
npm dedupe
```

---

## 框架特定：Next.js (NX1-NX6)

### NX1: 未使用 next/image

- **嚴重性**：IMPORTANT
- **檢測**：`.tsx` 中的 `<img ` 而非 `<Image>`
- **CWV**：LCP + CLS

```tsx
import Image from 'next/image';
<Image src="/hero.jpg" alt="Hero" width={1200} height={600} priority />
```

### NX2: 針對部分預渲染 (Partial Prerendering) 未使用 Cache 元件

- **嚴重性**：IMPORTANT
- **檢測**：Next.js 16+ 專案的頁面缺少 `"use cache"` 指令
- **CWV**：LCP

```typescript
// 錯誤 — 整頁動態
export default async function Page() {
  const data = await fetchData(); // 阻塞整頁渲染
  return <div>{data.title}</div>;
}

// 正確 — 啟用帶有 "use cache" 的部分預渲染
// next.config.ts: { cacheComponents: true }
"use cache";
export default async function Page() {
  const data = await fetchData(); // 靜態 shell 立即渲染，動態內容串流
  return <div>{data.title}</div>;
}
```

於 `next.config.ts` 設定 `cacheComponents: true`。在檔案、元件或函式層級使用 `"use cache"`。靜態 shell 立即載入；動態內容透過 Suspense 邊界進行串流。

### NX3: Server-Renderable 元件不必要的 "use client"

- **嚴重性**：IMPORTANT
- **檢測**：元件未使用 Hook 或瀏覽器 API，卻標記了 `"use client"`
- **CWV**：INP

移除僅渲染靜態內容元件上的 `"use client"`。

### NX4: 在 useEffect 中擷取資料，而非伺服器端

- **嚴重性**：CRITICAL
- **檢測**：Next.js App Router 頁面中的 `useEffect` + `fetch`
- **CWV**：LCP

直接在 Server Components 中擷取資料 (非同步函式主體)。

### NX5: 缺少 next/font

- **嚴重性**：IMPORTANT
- **檢測**：CSS/HTML 中的 `fonts.googleapis|fonts.gstatic`
- **CWV**：CLS + LCP

```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
```

### NX6: 可快取伺服器函式缺少 "use cache"

- **嚴重性**：IMPORTANT
- **檢測**：Next.js 16+ 中 `cacheComponents: true` 且非同步伺服器函式未定義 `"use cache"`
- **CWV**：LCP

```typescript
// 錯誤 — 每次請求皆擷取資料
async function getProducts() {
  return await db.products.findMany();
}

// 正確 — 以重新驗證進行快取
"use cache";
import { cacheLife } from 'next/cache';
async function getProducts() {
  cacheLife('hours');
  return await db.products.findMany();
}
```

`"use cache"` 取代了舊有的 `unstable_cache` 與 `fetch` 快取選項。使用 `cacheLife()` 與 `cacheTag()` 進行細粒度控制。

---

## 框架特定：Angular (NG1-NG6)

### NG1: 呈現元件預設變更偵測

- **嚴重性**：IMPORTANT
- **檢測**：元件未設定 `ChangeDetectionStrategy.OnPush` (Angular <19) 或未使用 signals (Angular 19+)
- **CWV**：INP

```typescript
// Angular <19: 使用 OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  ...
})

// Angular 19+: 使用訊號 (signals) 優先採用無區域 (zoneless)
// app.config.ts: provideZonelessChangeDetection()
@Component({ ... })
export class ProductCard {
  product = input.required<Product>(); // 訊號輸入
  price = computed(() => this.product().price * 1.19); // 衍生訊號
}
```

Angular 19+：偏好採用訊號的無區域變更偵測。使用訊號反應機制時，OnPush 為不必要的。Angular 20+ 具備穩定的無區域支援。

### NG2: 未使用 NgOptimizedImage

- **嚴重性**：IMPORTANT
- **檢測**：`.component.html` 中的 `<img` 未設定 `ngSrc`
- **CWV**：LCP + CLS

```html
<img ngSrc="/hero.jpg" alt="Hero" width="1200" height="600" priority />
```

### NG3: 螢幕下方內容缺少 @defer

- **嚴重性**：SUGGESTION
- **檢測**：螢幕下方重型元件過早載入 (Angular 17+)
- **CWV**：INP

```html
@defer (on viewport) {
  <app-heavy-chart [data]="chartData" />
} @placeholder {
  <div class="chart-skeleton"></div>
}
```

### NG4: 未使用訊號處理響應式狀態

- **嚴重性**：SUGGESTION
- **檢測**：Angular 19+ 中類別屬性未設定為訊號
- **CWV**：INP

使用 `signal()` 處理響應式狀態，`computed()` 處理衍生值。訊號 API (`signal()`, `computed()`, `effect()`) 自 Angular 20 起已穩定。

### NG5: 完整水合但缺少增量水合

- **嚴重性**：IMPORTANT
- **檢測**：Angular 19+ SSR 應用程式未設定 `withIncrementalHydration()`
- **CWV**：LCP, INP

```typescript
// 錯誤 — 完整水合阻塞互動性
provideClientHydration()

// 正確 — 具備觸發條件的增量水合
provideClientHydration(withIncrementalHydration())
```

使用 `@defer` 觸發條件 (`on viewport`, `on interaction`) 按需水合元件。透過延遲非關鍵元件的水合來降低 TTI。

### NG6: Angular 20+ 專案仍在使用 zone.js

- **嚴重性**：SUGGESTION
- **檢測**：polyfills 陣列中的 `zone.js`，Angular 20+ 專案缺少 `provideZonelessChangeDetection()`
- **CWV**：INP

```typescript
// app.config.ts
export const appConfig = {
  providers: [
    provideZonelessChangeDetection(), // 從 Bundle 中移除 ~15-30KB
    // ...
  ]
};
```

使用訊號的無區域變更偵測可減少 Bundle 大小並提升執行階段效能。自 Angular 20 起穩定。

---

## 框架特定：React (RX1-RX4)

### RX1: 缺少 React Compiler 採用

- **嚴重性**：SUGGESTION
- **檢測**：React 19+ 專案中手動編寫 `useMemo|useCallback`
- **CWV**：INP

啟用 React Compiler (v19+) 以自動記憶化。移除手動包裹。

### RX2: 針對昂貴更新缺少 useTransition

- **嚴重性**：IMPORTANT
- **檢測**：狀態更新導致昂貴重新渲染但未使用 `useTransition`
- **CWV**：INP

```tsx
const [isPending, startTransition] = useTransition();
function handleFilter(value) {
  startTransition(() => setFilter(value));
}
```

### RX3: 針對昂貴渲染缺少 useDeferredValue

- **嚴重性**：IMPORTANT
- **檢測**：來自快速變更輸入的昂貴渲染
- **CWV**：INP

```tsx
const deferredQuery = useDeferredValue(query);
const results = expensiveFilter(items, deferredQuery);
```

### RX4: 缺少用於路由分割的 React.lazy

- **嚴重性**：IMPORTANT
- **檢測**：路由元件為靜態匯入
- **CWV**：INP

```tsx
const Settings = React.lazy(() => import('./pages/Settings'));
```

---

## 框架特定：Vue (VU1-VU4)

### VU1: 針對大型資料結構使用 reactive()

- **嚴重性**：IMPORTANT
- **檢測**：對大型陣列或深層物件使用 `reactive(`
- **CWV**：INP

針對大型資料使用 `shallowRef()` 或 `shallowReactive()`。

### VU2: 昂貴清單渲染缺少 v-memo

- **嚴重性**：SUGGESTION
- **檢測**：大型清單未設定 `v-memo`
- **CWV**：INP

```vue
<div v-for="item in items" :key="item.id" v-memo="[item.id, item.updatedAt]">
  <ExpensiveItem :data="item" />
</div>
```

### VU3: 缺少 defineAsyncComponent

- **嚴重性**：IMPORTANT
- **檢測**：重量級元件靜態匯入
- **CWV**：INP

```typescript
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'));
```

### VU4: 針對效能關鍵元件未使用 Vapor Mode

- **嚴重性**：SUGGESTION
- **檢測**：Vue 3.6+ 中效能關鍵元件使用虛擬 DOM
- **CWV**：INP

Vue 3.6+ Vapor Mode 將範本編譯為直接 DOM 操作，繞過虛擬 DOM。用於效能關鍵的子樹。可與標準元件混用。

---

## 資源提示快速參考

| 提示 | 目的 | 使用時機 |
|------|---------|-------------|
| `preconnect` | 提早 DNS + TCP + TLS | 關鍵第三方來源 (API, CDN, 字型) |
| `preload` | 立即擷取，高優先順序 | LCP 圖像，關鍵字型 |
| `prefetch` | 未來導覽的低優先順序 | 下頁資產 |
| `dns-prefetch` | 僅 DNS 解析 | 非關鍵第三方來源 |
| `modulepreload` | 預載 + 解析 ES 模組 | 關鍵 JS 模組 |
| `<script type="speculationrules">` | 預抓取/預渲染下一次導覽 | 可能的下一頁 (Chrome 121+, 漸進增強) |

---

## 圖像優化快速參考

| 面向 | 建議 |
|--------|---------------|
| 格式 | WebP (小 25-34%), AVIF (小 50%) |
| LCP 圖像 | `fetchpriority="high"` 或框架 `priority` 屬性 |
| 螢幕下方 | `loading="lazy"` |
| 尺寸 | 永遠設定 `width` + `height` |
| 回應式 | `srcset` + `sizes` 或框架 Image 元件 |
| 壓縮 | 相片品質 75-85 |

---

## 字型載入快速參考

| 策略 | 適用對象 | CLS 影響 |
|----------|---------|-----------|
| `font-display: swap` | 正文文字 | 輕微 FOUT，最小 CLS |
| `font-display: optional` | 所有字型 (最佳 CLS) | 無 FOUT，無 CLS |
| `next/font` | Next.js 專案 | 零 CLS |
| 可變字型 (Variable fonts) | 多種字重 | 所有字重共用單一檔案 |

規則：僅預載 1-2 種關鍵字型，使用 WOFF2，針對所需字元進行子集化，儘可能自託管。

---

## 效能檢查清單 (CWV)

### LCP (< 2.5s)
- [ ] LCP 圖像具備 `fetchpriority="high"` 或 `priority` 屬性
- [ ] LCP 圖像若未在 HTML 原始碼中則預載
- [ ] 螢幕上方圖像未使用 `loading="lazy"`
- [ ] 關鍵 CSS 已內嵌或提取
- [ ] 無渲染阻塞指令碼 (使用 `defer` 或 `async`)
- [ ] 預連線至關鍵第三方來源
- [ ] 主要內容伺服器渲染 (非用戶端擷取)
- [ ] 圖像使用現代格式 (WebP/AVIF) 並搭配回應式 `srcset`
- [ ] 啟用壓縮 (偏好 Brotli)
- [ ] 字型透過 `font-display: swap` 或 `optional` 進行預載

### INP (< 200ms)
- [ ] 事件處理常式完成時間 < 50ms
- [ ] 長任務切分為較小區塊
- [ ] 實作基於路由的程式碼分割
- [ ] 繁重運算移至 Web Worker
- [ ] 具有 > 100 個項目的清單已虛擬化
- [ ] 無 Barrel file 匯入 (直接元件匯入)
- [ ] 使用 ESM 匯入 (而非 CommonJS `require`)
- [ ] `"use client"` 僅用於需要互動性的元件
- [ ] 未動畫化觸發佈局的 CSS 屬性
- [ ] 實作 Effect 清理 (無洩漏監聽器/計時器)

### CLS (< 0.1)
- [ ] 所有圖像具備 `width` 與 `height` 屬性
- [ ] 字型使用 `font-display: swap` 或 `optional`
- [ ] 沒有動態注入內容置於既有內容上方
- [ ] 廣告/嵌入物件預留空間
- [ ] 無水合不匹配
- [ ] `content-visibility: auto` 已設定 `contain-intrinsic-size`
