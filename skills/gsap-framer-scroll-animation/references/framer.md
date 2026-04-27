# Framer Motion (Motion v12) — 完整參考文件

> Framer Motion 在 2025 年中更名為 **Motion**。npm 套件現在是 `motion`，
> 匯入路徑為 `motion/react`。所有 API 均相同。`framer-motion` 仍可使用。

## 目錄
1. [套件與匯入路徑](#package--import-paths)
2. [兩種類型的捲動動畫](#two-types-of-scroll-animation)
3. [useScroll — 選項參考](#usescroll--options-reference)
4. [useTransform — 完整參考](#usetransform--full-reference)
5. [使用 useSpring 進行平滑化](#usespring-for-smoothing)
6. [搭配 Copilot 提示詞的食譜範例](#recipes-with-copilot-prompts)
   - 捲動進度條
   - 可重複使用的 ScrollReveal 包裝器
   - 視差圖層
   - 水平捲動區段
   - 使用 clipPath 的圖片顯露效果
   - 捲動連結的導覽列（隱藏/顯示）
   - 交錯顯示的卡片網格
   - 捲動時的 3D 傾斜
7. [用於交錯效果的 Variants 模式](#variants-pattern-for-stagger)
8. [Motion Value 事件](#motion-value-events)
9. [Next.js 與 App Router 注意事項](#nextjs--app-router-notes)
10. [協助工具 (Accessibility)](#accessibility)
11. [常見的 Copilot 陷阱](#common-copilot-pitfalls)

---

## 套件與匯入路徑

```bash
npm install motion          # 建議使用（2025 年更名）
npm install framer-motion   # 仍然有效 — API 相同
```

```js
// 建議做法 (Motion v12+)
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'motion/react';

// 舊版做法 — 仍然有效
import { motion, useScroll, useTransform } from 'framer-motion';
```

**Motion v12 新功能 (2025):**
- 透過瀏覽器 ScrollTimeline API 實現硬體加速捲動
- `useScroll` 與 `scroll()` 現在預設為 GPU 加速
- 新顏色類型：`oklch`、`oklab`、`color-mix` 可直接進行動畫處理
- 完整支援 React 19 + 並行渲染 (concurrent rendering)

---

## 兩種類型的捲動動畫

### 捲動觸發 (Scroll-triggered)（當元件進入視埠時觸發一次）

```jsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
>
  內容
</motion.div>
```

`viewport.margin` — 負值會在元件完全進入檢視前觸發動畫。
`viewport.once` — `true` 表示僅執行一次動畫，永不反轉。

### 捲動連結 (Scroll-linked)（連續且與捲動位置綁定）

```jsx
const { scrollYProgress } = useScroll();
const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
return <motion.div style={{ opacity }}>內容</motion.div>;
```

該值會在每個捲動影格更新 — 必須使用 `style` 屬性，而非 `animate`。

---

## useScroll — 選項參考

```js
const {
  scrollX,          // 絕對水平捲動（像素）
  scrollY,          // 絕對垂直捲動（像素）
  scrollXProgress,  // 位移之間的水平進度 0→1
  scrollYProgress,  // 位移之間的垂直進度 0→1
} = useScroll({
  // 追蹤可捲動元件而非視埠
  container: containerRef,

  // 追蹤容器內元件的位置
  target: targetRef,

  // 定義追蹤開始與結束的時間
  // 格式：["目標位置 容器位置", "目標位置 容器位置"]
  offset: ['start end', 'end start'],
  // 常見位移配對：
  // ['start end', 'end start']    = 當元件在檢視中任何位置時進行追蹤
  // ['start end', 'end end']      = 從元件進入到頁面底部進行追蹤
  // ['start start', 'end start']  = 當元件從頂部離開時進行追蹤
  // ['center center', 'end start']= 從中心對中心到離開進行追蹤

  // 當內容大小變更時更新（些微效能消耗，預設為 false）
  trackContentSize: false,
});
```

**位移字串值 (Offset string values)：**
- `start` = `0` = 頂部/左側邊緣
- `center` = `0.5` = 中間
- `end` = `1` = 底部/右側邊緣
- 數字 0–1 也有效：`[0, 1]` = `['start', 'end']`

---

## useTransform — 完整參考

```js
// 將 motion 值從一個範圍映射到另一個範圍
const y = useTransform(scrollYProgress, [0, 1], [0, -200]);

// 多點插值
const opacity = useTransform(
  scrollYProgress,
  [0, 0.2, 0.8, 1],
  [0, 1, 1, 0]
);

// 非數字值（顏色、字串）
const color = useTransform(
  scrollYProgress,
  [0, 0.5, 1],
  ['#6366f1', '#ec4899', '#f97316']
);

// CSS 字串值
const clipPath = useTransform(
  scrollYProgress,
  [0, 1],
  ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)']
);

// 停用限制 (Disable clamping)（允許輸出範圍外的值）
const y = useTransform(scrollYProgress, [0, 1], [0, -200], { clamp: false });

// 從多個輸入進行轉換
const combined = useTransform(
  [scrollX, scrollY],
  ([x, y]) => Math.sqrt(x * x + y * y)
);
```

**規則：** `useTransform` 的輸出是一個 `MotionValue`。它必須放入 `motion.*` 元件的 `style` 屬性中。普通的 `<div style={{ y }}>` **無法**運作 — 必須是 `<motion.div style={{ y }}>`。

---

## 使用 useSpring 進行平滑化

將任何 MotionValue 包裝在 `useSpring` 中以加入彈簧物理效果 — 非常適合讓進度條感覺更生動。

```js
const { scrollYProgress } = useScroll();

const smooth = useSpring(scrollYProgress, {
  stiffness: 100,   // 越高 = 反應越快/越乾脆
  damping: 30,      // 越高 = 彈跳越少
  restDelta: 0.001  // 停止的精準度閾值
});

return <motion.div style={{ scaleX: smooth }} />;
```

若要獲得細微的延遲感（而非物理效果），請改用具有 `clamp: false` 和漸變範圍的 `useTransform`。

---

## 搭配 Copilot 提示詞的食譜範例

### 1. 捲動進度條

**Copilot 聊天提示詞：**
```
Framer Motion: fixed scroll progress bar at top of page.
useScroll for page scroll progress, useSpring to smooth scaleX.
stiffness 100, damping 30. Grows left to right.
```

```tsx
'use client';
import { useScroll, useSpring, motion } from 'motion/react';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100, damping: 30, restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 bg-indigo-500 origin-left z-50"
    />
  );
}
```

---

### 2. 可重複使用的 ScrollReveal 包裝器

**Copilot 聊天提示詞：**
```
Framer Motion: reusable ScrollReveal component that wraps children with 
fade-in-up entrance animation using whileInView. Props: delay (default 0), 
duration (default 0.6), once (default true). viewport margin -80px.
TypeScript. 'use client'.
```

```tsx
'use client';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
}

export function ScrollReveal({
  children, delay = 0, duration = 0.6, once = true, className
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 使用方式：
// <ScrollReveal delay={0.2}><h2>區段標題</h2></ScrollReveal>
```

---

### 3. 視差圖層

**Copilot 聊天提示詞：**
```
Framer Motion parallax section: background moves y from 0% to 30% (slow),
foreground text moves y from 50 to -50px (fast). 
Both use target ref with offset ['start end', 'end start'].
Fade out at top and bottom using opacity useTransform [0, 0.3, 0.7, 1] → [0,1,1,0].
```

```tsx
'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const textY        = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity      = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.jpg)', y: backgroundY, scale: 1.2 }}
      />
      <motion.div style={{ y: textY, opacity }} className="relative z-10 text-center text-white">
        <h2 className="text-6xl font-bold">視差標題</h2>
        <p className="text-xl mt-4">以不同的速度捲動</p>
      </motion.div>
    </section>
  );
}
```

---

### 4. 水平捲動區段

**Copilot 聊天提示詞：**
```
Framer Motion horizontal scroll: 4 cards scroll horizontally as user scrolls vertically.
Outer container ref height 300vh controls speed (sticky pattern).
useScroll tracks outer container, useTransform maps scrollYProgress to x '0%' → '-75%'.
```

```tsx
'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const cards = [
  { id: 1, title: '第一張卡片',   color: 'bg-indigo-500' },
  { id: 2, title: '第二張卡片',   color: 'bg-pink-500'   },
  { id: 3, title: '第三張卡片',   color: 'bg-amber-500'  },
  { id: 4, title: '第四張卡片',   color: 'bg-teal-500'   },
];

export function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ x, width: `${cards.length * 100}vw` }}
          className="flex gap-6 h-full items-center px-8"
        >
          {cards.map(card => (
            <div
              key={card.id}
              className={`${card.color} w-screen h-[70vh] rounded-2xl flex items-center justify-center flex-shrink-0`}
            >
              <h3 className="text-white text-4xl font-bold">{card.title}</h3>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
```

---

### 5. 使用 clipPath 的圖片顯露效果

**Copilot 聊天提示詞：**
```
Framer Motion: image reveals left to right as it scrolls into view.
useScroll target ref, offset ['start end', 'center center'].
useTransform clipPath from 'inset(0% 100% 0% 0%)' to 'inset(0% 0% 0% 0%)'.
Also scale from 1.15 to 1.
```

```tsx
'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function ImageReveal({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)']
  );
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <div ref={ref} className="overflow-hidden rounded-xl">
      <motion.img
        src={src} alt={alt}
        style={{ clipPath, scale }}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
```

---

### 6. 捲動連結的導覽列（向下捲動時隱藏）

**Copilot 聊天提示詞：**
```
Framer Motion navbar: transparent when at top, white with shadow after 80px.
Hide by sliding up when scrolling down, reveal when scrolling up.
Use useScroll, useMotionValueEvent to detect direction.
Animate y, backgroundColor, boxShadow with motion.nav.
```

```tsx
'use client';
import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden,   setHidden]   = useState(false);
  const prevRef = useRef(0);

  useMotionValueEvent(scrollY, 'change', latest => {
    const nextScrolled = latest > 80;
    const nextHidden = latest > prevRef.current && latest > 200;
    setScrolled(current => (current === nextScrolled ? current : nextScrolled));
    setHidden(current => (current === nextHidden ? current : nextHidden));
    prevRef.current = latest;
  });

  return (
    <motion.nav
      animate={{
        y: hidden ? -80 : 0,
        backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0)',
        boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.08)' : 'none',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
    >
      {/* 導覽連結 */}
    </motion.nav>
  );
}
```

---

### 7. 交錯顯示的卡片網格

**Copilot 聊天提示詞：**
```
Framer Motion: card grid with stagger entrance. Use variants: 
container has staggerChildren 0.1, delayChildren 0.2.
Each card: hidden (opacity 0, y 40, scale 0.96) → visible (opacity 1, y 0, scale 1).
Trigger with whileInView on the container. Once.
```

```tsx
'use client';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const cardVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }
  }
};

export function CardGrid({ cards }: { cards: { id: number; title: string }[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className="grid grid-cols-3 gap-6"
    >
      {cards.map(card => (
        <motion.div key={card.id} variants={cardVariants}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <h3>{card.title}</h3>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

---

### 8. 捲動時的 3D 傾斜

**Copilot 聊天提示詞：**
```
Framer Motion: 3D perspective card that rotates on X axis as it scrolls through view.
rotateX 15→0→-15, scale 0.9→1→0.9, opacity 0→1→0.
Target ref with offset ['start end', 'end start']. Wrap in perspective container.
```

```tsx
'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15,  0, -15]);
  const scale   = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1,  0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <div ref={ref} style={{ perspective: '1000px' }}>
      <motion.div
        style={{ rotateX, scale, opacity }}
        className="bg-white rounded-2xl p-8 shadow-lg"
      >
        {children}
      </motion.div>
    </div>
  );
}
```

---

## 用於交錯效果的 Variants 模式

Variants 會自動從父元件傳播到子元件 — 您不需要手動向下傳遞它們。

```tsx
const parent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,   // 每個子元件之間的延遲
      delayChildren: 0.2,      // 第一個子元件開始前的初始延遲
      when: 'beforeChildren',  // 父元件在子元件之前執行動畫
    }
  }
};

const child = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// 具有 `variants={child}` 的子元件會在父元件
// 於 'hidden' 和 'visible' 之間切換時自動獲得交錯效果
```

---

## Motion Value 事件

```tsx
import { useScroll, useMotionValueEvent } from 'motion/react';

const { scrollY } = useScroll();

// 在每次變更時觸發 — 用於命令式副作用 (imperative side effects)
useMotionValueEvent(scrollY, 'change', latest => {
  console.log('捲動位置：', latest);
});

// 偵測捲動方向
const [direction, setDirection] = useState<'up' | 'down'>('down');

useMotionValueEvent(scrollY, 'change', current => {
  const diff = current - scrollY.getPrevious()!;
  setDirection(diff > 0 ? 'down' : 'up');
});
```

**何時使用 `useMotionValueEvent` 與 `useTransform`：**
- 當您想要一個能平滑執行動畫的 CSS 值（y、不透明度、顏色）時，請使用 `useTransform`。
- 當您想要觸發 React 狀態變更或副作用時，請使用 `useMotionValueEvent`。

---

## Next.js 與 App Router 注意事項

```tsx
// 每個使用 motion hook 的檔案都必須是 Client Component
'use client';

// 對於 App Router 中的頁面層級捲動追蹤，請在已是
// client 元件的 layout 中使用 useScroll — 不要嘗試在 Server Components 中使用它

// 如果您需要 SSR 安全的捲動動畫，請使用以下方式進行門控：
import { useEffect, useState } from 'react';
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null; // 或顯示骨架屏 (skeleton)
```

**建議的 Next.js App Router 模式：**
1. 將所有 `motion.*` 元件保留在獨立的 `'use client'` 檔案中。
2. 將它們匯入 Server Components — 它們將自動在客戶端渲染。
3. 在 layout 層級使用 `AnimatePresence` 進行頁面切換。

---

## 協助工具 (Accessibility)

```tsx
import { useReducedMotion } from 'motion/react';

export function AnimatedCard() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
    >
      內容
    </motion.div>
  );
}
```

或者在偏好減少動態效果時，停用所有捲動連結的轉換 (transforms)：
```tsx
const prefersReducedMotion = useReducedMotion();
const y = useTransform(
  scrollYProgress, [0, 1],
  prefersReducedMotion ? [0, 0] : [100, -100]  // 如果減少動態，則不移動
);
```

---

## 常見的 Copilot 陷阱

**缺少 'use client'：** Copilot 經常忘記在 Next.js App Router 檔案中加入此指令。
每個使用 `useScroll`、`useTransform`、`motion.*` 或任何 hook 的檔案，頂部都需要 `'use client'`。

**在普通 div 上使用 style 屬性：** Copilot 有時會寫出 `<div style={{ y }}>`，其中 `y` 是 MotionValue。
這會無聲地失效。必須是 `<motion.div style={{ y }}>`。

**舊的匯入路徑：** Copilot 仍會產生 `from 'framer-motion'`（有效但屬舊版）。
目前的標準做法是：`from 'motion/react'`。

**忘記在 useScroll 中設定 offset：** 如果沒有 `offset`，`scrollYProgress` 會追蹤整個頁面
從 0 到 1 的進度 — 而非元件的位置。元件層級的追蹤請務必傳遞 `target` + `offset`。

**target 缺少 ref：** Copilot 有時會寫出 `target: ref` 但忘記將 `ref` 附加到 DOM 元件上。
```tsx
const ref = useRef(null);
const { scrollYProgress } = useScroll({ target: ref }); // ← 傳遞了 ref
return <div ref={ref}>...</div>;                          // ← 附加了 ref
```

**將 animate 屬性用於捲動連結的值：** 捲動連結的值必須使用 `style`，而非 `animate`。
`animate` 在掛載/卸載時執行，而非在捲動時執行。
```tsx
// ❌ 錯誤
<motion.div animate={{ opacity }} />

// ✅ 正確
<motion.div style={{ opacity }} />
```

**未平滑化捲動進度：** 原始的 `scrollYProgress` 在細微動態上可能會顯得生硬。
對於需要精緻感的進度條和 UI 元件，請將其包裝在 `useSpring` 中。
