# GSAP ScrollTrigger — 完整參考文件

## 目錄
1. [安裝與註冊](#installation--registration)
2. [ScrollTrigger 設定參考](#scrolltrigger-config-reference)
3. [Start / End 語法解析](#start--end-syntax-decoded)
4. [toggleActions 值](#toggleactions-values)
5. [搭配 Copilot 提示詞的食譜範例](#recipes-with-copilot-prompts)
   - 漸進式批次顯露 (Fade-in batch reveal)
   - 擦除動畫 (Scrub animation)
   - 固定時間軸 (Pinned timeline)
   - 視差圖層 (Parallax layers)
   - 水平捲動 (Horizontal scroll)
   - 字元交錯文字效果 (Character stagger text)
   - 捲動貼齊 (Scroll snap)
   - 進度條 (Progress bar)
   - ScrollSmoother
   - 捲動計數器 (Scroll counter)
6. [React 整合 (useGSAP)](#react-integration-usegsap)
7. [Lenis 平滑捲動](#lenis-smooth-scroll)
8. [使用 matchMedia 進行回應式設計](#responsive-with-matchmedia)
9. [協助工具 (Accessibility)](#accessibility)
10. [效能與清理 (Performance & Cleanup)](#performance--cleanup)
11. [常見的 Copilot 陷阱](#common-copilot-pitfalls)

---

## 安裝與註冊

```bash
npm install gsap
# React
npm install gsap @gsap/react
```

```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother'; // 選用
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
```

CDN (純 JS):
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14/dist/ScrollTrigger.min.js"></script>
```

---

## ScrollTrigger 設定參考

```js
gsap.to('.element', {
  x: 500,
  ease: 'none',          // 擦除動畫 (scrub animations) 請使用 'none'
  scrollTrigger: {
    trigger: '.section',         // 以其位置觸發動畫的元件
    start: 'top 80%',            // "[觸發邊緣] [視埠邊緣]"
    end: 'bottom 20%',           // 動畫結束位置
    scrub: 1,                    // 將進度與捲動連結；使用 true 表示即時擦除，或使用數字表示平滑延遲
    pin: true,                   // 在捲動期間固定觸發元件；可傳入選擇器/元件以固定其他東西
    pinSpacing: true,            // 在固定元件下方增加空間（預設值：true）
    markers: true,               // 除錯標記 — 請在正式環境中移除
    toggleActions: 'play none none reverse', // onEnter onLeave onEnterBack onLeaveBack
    toggleClass: 'active',       // 啟動時加入/移除的 CSS 類別
    snap: { snapTo: 'labels', duration: 0.3, ease: 'power1.inOut' }, // 或使用數字（如 1）來依增量貼齊
    fastScrollEnd: true,         // 如果使用者捲動過快，則強制完成
    horizontal: false,           // 若為水平捲動容器則設為 true
    anticipatePin: 1,            // 減少固定跳動（預期秒數）
    invalidateOnRefresh: true,   // 在調整大小時重新計算位置
    id: 'my-trigger',            // 用於 ScrollTrigger.getById()
    onEnter: () => {},
    onLeave: () => {},
    onEnterBack: () => {},
    onLeaveBack: () => {},
    onUpdate: self => console.log(self.progress), // 0 到 1
    onToggle: self => console.log(self.isActive),
  }
});
```

---

## Start / End 語法解析

格式：`"[觸發位置] [視埠位置]"`

| 值 | 意義 |
|---|---|
| `"top bottom"` | 觸發元件頂部接觸到視埠底部 — 進入檢視 |
| `"top 80%"` | 觸發元件頂部到達視埠頂部往下 80% 的位置 |
| `"top center"` | 觸發元件頂部到達視埠中心 |
| `"top top"` | 觸發元件頂部到達視埠頂部 |
| `"center center"` | 中心對齊 |
| `"bottom top"` | 觸發元件底部到達視埠頂部 — 離開檢視 |
| `"+=200"` | 觸發位置後 200 像素 |
| `"-=100"` | 觸發位置前 100 像素 |
| `"+=200%"` | 觸發後增加 200% 的視埠高度 |

---

## toggleActions 值

```
toggleActions: "play pause resume reset"
                ^      ^      ^        ^
              onEnter onLeave onEnterBack onLeaveBack
```

| 值 | 效果 |
|---|---|
| `play` | 從目前位置播放 |
| `pause` | 在目前位置暫停 |
| `resume` | 從暫停處恢復 |
| `reverse` | 反向播放 |
| `reset` | 跳至開始 |
| `restart` | 從頭播放 |
| `none` | 不執行任何動作 |

最常用於進入動畫的設定：`"play none none none"`（動畫執行一次，不反轉）。

---

## 搭配 Copilot 提示詞的食譜範例

### 1. 漸進式批次顯露 (Fade-in Batch Reveal)

**Copilot 聊天提示詞：**
```
Using GSAP ScrollTrigger.batch, animate all .card elements: 
fade in from opacity 0, y 50 when they enter the viewport at 85%.
Stagger 0.15s between cards. Animate once (no reverse).
```

```js
gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.batch('.card', {
  onEnter: elements => {
    gsap.from(elements, {
      opacity: 0,
      y: 50,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power2.out',
    });
  },
  start: 'top 85%',
});
```

為何使用 `batch` 而非個別的 ScrollTrigger：batch 會將同時進入的元件分組到同一個動畫呼叫中，這比為每個元件建立一個 ScrollTrigger 效能更好。

---

### 2. 擦除動畫 (Scrub Animation)（捲動連結）

**Copilot 聊天提示詞：**
```
GSAP scrub: animate .hero-image scale from 1 to 1.3 and opacity to 0
as the user scrolls past .hero-section. 
Perfectly synced to scroll position, no pin.
```

```js
gsap.to('.hero-image', {
  scale: 1.3,
  opacity: 0,
  ease: 'none',   // 關鍵：擦除動畫需使用線性緩動 (linear easing)
  scrollTrigger: {
    trigger: '.hero-section',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  }
});
```

---

### 3. 固定時間軸 (Pinned Timeline)

**Copilot 聊天提示詞：**
```
GSAP pinned timeline: pin .story-section while a sequence plays —
fade in .title (y: 60), scale .image to 1, slide .text from x: 80.
Total scroll distance 300vh. Scrub 1 for smoothness.
```

```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '.story-section',
    start: 'top top',
    end: '+=300%',
    pin: true,
    scrub: 1,
    anticipatePin: 1,
  }
});

tl
  .from('.title',  { opacity: 0, y: 60, duration: 1 })
  .from('.image',  { scale: 0.85, opacity: 0, duration: 1 }, '-=0.3')
  .from('.text',   { x: 80, opacity: 0, duration: 1 }, '-=0.3');
```

---

### 4. 視差圖層 (Parallax Layers)

**Copilot 聊天提示詞：**
```
GSAP parallax: background image moves yPercent -20 (slow),
foreground text moves yPercent -60 (fast). Both scrubbed to scroll, no pin.
Trigger is .parallax-section, start top bottom, end bottom top.
```

```js
// 慢速背景
gsap.to('.parallax-bg', {
  yPercent: -20,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  }
});

// 快速前景
gsap.to('.parallax-fg', {
  yPercent: -60,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  }
});
```

---

### 5. 水平捲動區段

**Copilot 聊天提示詞：**
```
GSAP horizontal scroll: 4 .panel elements inside .panels-container.
Pin .horizontal-section, scrub 1, snap per panel.
End should use offsetWidth so it recalculates on resize.
```

```js
const sections = gsap.utils.toArray('.panel');

gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: 'none',
  scrollTrigger: {
    trigger: '.horizontal-section',
    pin: true,
    scrub: 1,
    snap: 1 / (sections.length - 1),
    end: () => `+=${document.querySelector('.panels-container').offsetWidth}`,
    invalidateOnRefresh: true,
  }
});
```

所需的 HTML：
```html
<div class="horizontal-section">
  <div class="panels-container">
    <div class="panel">1</div>
    <div class="panel">2</div>
    <div class="panel">3</div>
    <div class="panel">4</div>
  </div>
</div>
```

所需的 CSS：
```css
.horizontal-section { overflow: hidden; }
.panels-container   { display: flex; flex-wrap: nowrap; width: 400vw; }
.panel              { width: 100vw; height: 100vh; flex-shrink: 0; }
```

---

### 6. 字元交錯文字顯露效果 (Character Stagger Text Reveal)

**Copilot 聊天提示詞：**
```
Split .hero-title into characters using SplitType.
Animate each char: opacity 0→1, y 80→0, rotateX -90→0.
Stagger 0.03s, ease back.out(1.7). Trigger when heading enters at 85%.
```

```bash
npm install split-type
```

```js
import SplitType from 'split-type';

const text = new SplitType('.hero-title', { types: 'chars' });

gsap.from(text.chars, {
  opacity: 0,
  y: 80,
  rotateX: -90,
  stagger: 0.03,
  duration: 0.6,
  ease: 'back.out(1.7)',
  scrollTrigger: {
    trigger: '.hero-title',
    start: 'top 85%',
    toggleActions: 'play none none none',
  }
});
```

---

### 7. 捲動貼齊區段 (Scroll Snap Sections)

**Copilot 聊天提示詞：**
```
GSAP: each full-height section scales from 0.9 to 1 when it enters view.
Also add global scroll snapping between sections using ScrollTrigger.create snap.
```

```js
const sections = gsap.utils.toArray('section');

sections.forEach(section => {
  gsap.from(section, {
    scale: 0.9,
    opacity: 0.6,
    scrollTrigger: {
      trigger: section,
      start: 'top 90%',
      toggleActions: 'play none none reverse',
    }
  });
});

ScrollTrigger.create({
  snap: {
    snapTo: (progress) => {
      const step = 1 / (sections.length - 1);
      return Math.round(progress / step) * step;
    },
    duration: { min: 0.2, max: 0.5 },
    ease: 'power1.inOut',
  }
});
```

---

### 8. 捲動進度條

**Copilot 聊天提示詞：**
```
GSAP: fixed progress bar at top of page. scaleX 0→1 linked to 
full page scroll, scrub 0.3 for slight smoothing. transformOrigin left center.
```

```js
gsap.to('.progress-bar', {
  scaleX: 1,
  ease: 'none',
  transformOrigin: 'left center',
  scrollTrigger: {
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.3,
  }
});
```

```css
.progress-bar {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 4px;
  background: #6366f1;
  transform-origin: left;
  transform: scaleX(0);
  z-index: 999;
}
```

---

### 9. ScrollSmoother 設定

**Copilot 聊天提示詞：**
```
Set up GSAP ScrollSmoother with smooth: 1.5, effects: true.
Show the required wrapper HTML structure.
Add data-speed and data-lag to parallax elements.
```

```bash
# ScrollSmoother 是 gsap 的一部分 — 不需要額外安裝
```

```js
import { ScrollSmoother } from 'gsap/ScrollSmoother';
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth: 1.5,
  effects: true,
  smoothTouch: 0.1,
});
```

```html
<div id="smooth-wrapper">
  <div id="smooth-content">
    <img data-speed="0.5" src="bg.jpg" />      <!-- 50% 捲動速度 -->
    <div data-lag="0.3" class="float">...</div> <!-- 0.3 秒延遲 -->
  </div>
</div>
```

---

### 10. 動畫數字計數器

**Copilot 聊天提示詞：**
```
GSAP: animate .counter elements from 0 to their data-target value 
when they enter the viewport. Duration 2s, ease power2.out.
Format with toLocaleString. Animate once.
```

```js
document.querySelectorAll('.counter').forEach(el => {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: parseInt(el.dataset.target, 10),
    duration: 2,
    ease: 'power2.out',
    onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString(); },
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none none',
    }
  });
});
```

```html
<span class="counter" data-target="12500">0</span>
```

---

## React 整合 (useGSAP)

```bash
npm install gsap @gsap/react
```

```jsx
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);
```

**為何使用 useGSAP 而非 useEffect：**
`useGSAP` 會在元件卸載時自動清理其中建立的所有 ScrollTrigger — 避免記憶體洩漏。它也能正確處理 React 嚴格模式 (Strict Mode) 的雙次呼叫。您可以將其視為 GSAP 專用的 `useLayoutEffect` 替換方案。

**Copilot 聊天提示詞：**
```
React: use useGSAP from @gsap/react to animate .card elements inside containerRef.
Fade in from y 60, opacity 0, stagger 0.12, scrollTrigger start top 80%.
Scope to containerRef so selectors don't match outside this component.
```

```jsx
export function AnimatedSection() {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.from('.card', {
      opacity: 0,
      y: 60,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <div className="card">第一項</div>
      <div className="card">第二項</div>
    </div>
  );
}
```

**React 中的固定時間軸：**
```jsx
export function PinnedStory() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true, scrub: 1,
        start: 'top top', end: '+=200%',
      }
    });
    tl.from('.story-title', { opacity: 0, y: 40 })
      .from('.story-image', { scale: 0.85, opacity: 0 }, '-=0.2')
      .from('.story-text',  { opacity: 0, x: 40 }, '-=0.2');
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef}>
      <h2 className="story-title">第一章</h2>
      <img className="story-image" src="/photo.jpg" alt="" />
      <p className="story-text">故事開始。</p>
    </section>
  );
}
```

**Next.js 說明：** 請在 `useGSAP` 或 `useLayoutEffect` 中執行 `gsap.registerPlugin(ScrollTrigger)` — 或使用門控：
```js
if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);
```

---

## Lenis 平滑捲動

```bash
npm install lenis
```

**Copilot 聊天提示詞：**
```
Integrate Lenis smooth scroll with GSAP ScrollTrigger.
Add lenis.raf to gsap.ticker. Set lagSmoothing to 0.
Destroy lenis on unmount if in React.
```

```js
import Lenis from 'lenis';
import { useEffect } from 'react';

const lenis = new Lenis({ duration: 1.2, smoothWheel: true });

const raf = (time) => lenis.raf(time * 1000);
gsap.ticker.add(raf);
gsap.ticker.lagSmoothing(0);
lenis.on('scroll', ScrollTrigger.update);

// React 清理
useEffect(() => {
  return () => {
    lenis.destroy();
    gsap.ticker.remove(raf);
  };
}, []);
```

---

## 使用 matchMedia 進行回應式設計

**Copilot 聊天提示詞：**
```
Use gsap.matchMedia to animate x: 200 on desktop (min-width: 768px)
and y: 100 on mobile. Both should skip animation if prefers-reduced-motion is set.
```

```js
const mm = gsap.matchMedia();

mm.add({
  isDesktop: '(min-width: 768px)',
  isMobile:  '(max-width: 767px)',
  noMotion:  '(prefers-reduced-motion: reduce)',
}, context => {
  const { isDesktop, isMobile, noMotion } = context.conditions;
  if (noMotion) return;

  gsap.from('.box', {
    x: isDesktop ? 200 : 0,
    y: isMobile  ? 100 : 0,
    opacity: 0,
    scrollTrigger: { trigger: '.box', start: 'top 80%' }
  });
});
```

---

## 協助工具 (Accessibility)

```js
// 使用 prefers-reduced-motion 保護所有捲動動畫
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!prefersReducedMotion.matches) {
  gsap.from('.box', {
    opacity: 0, y: 50,
    scrollTrigger: { trigger: '.box', start: 'top 85%' }
  });
} else {
  // 立即顯示元件，不執行動畫
  gsap.set('.box', { opacity: 1, y: 0 });
}
```

或是使用具有 `prefers-reduced-motion: reduce` 條件的 `gsap.matchMedia()`（見上文）。

---

## 效能與清理 (Performance & Cleanup)

```js
// 終止特定的觸發器
const st = ScrollTrigger.create({ ... });
st.kill();

// 終止所有觸發器（例如在頁面轉場時）
ScrollTrigger.killAll();

// 重新整理所有觸發器位置（在動態內容載入後）
ScrollTrigger.refresh();
```

**效能規則：**
- 僅針對 `transform` 和 `opacity` 執行動畫 — 這類屬性支援 GPU 加速，不會導致版面重新計算
- 避免針對 `width`、`height`、`top`、`left`、`box-shadow`、`filter` 執行動畫
- 針對大量相似元件請使用 `ScrollTrigger.batch()` — 這比為每個元件建立一個觸發器效能好得多
- 謹慎使用 `will-change: transform` — 僅在主動執行動畫的元件上使用
- 正式環境部署前務必移除 `markers: true`

---

## 常見的 Copilot 陷阱

**忘記執行 registerPlugin：** Copilot 經常遺漏 `gsap.registerPlugin(ScrollTrigger)`。
在使用任何 ScrollTrigger 之前，請務必先註冊。

**擦除動畫使用錯誤的 ease：** 即使在擦除動畫中，Copilot 也常預設使用 `power2.out`。
當 `scrub: true` 或 `scrub: 數字` 時，請務必使用 `ease: 'none'`。

**在 React 中使用 useEffect 而非 useGSAP：** Copilot 常產生 `useEffect` — 請務必更換為 `useGSAP`。

**水平捲動使用靜態的 end 值：** Copilot 有時會寫成 `end: "+=" + container.offsetWidth`。
正確做法是：`end: () => "+=" + container.offsetWidth`（函式形式可在調整大小時重新計算）。

**正式環境殘留 markers：** Copilot 會加入 `markers: true` 並遺留在程式碼中。請務必移除。

**長動畫在擦除時未固定：** 在未固定的情況下對長跨度的時間軸進行擦除，會導致元件捲出檢視。請加入 `pin: true` 或縮短捲動距離。
