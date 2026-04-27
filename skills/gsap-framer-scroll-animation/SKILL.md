---
name: gsap-framer-scroll-animation
description: '每當使用者想要建立捲動動畫、捲動效果、視差、捲動觸發的顯露效果、固定區段、水平捲動、文字動畫，或任何與捲動位置綁定的動態（在純 JS、React 或 Next.js 中）時，請使用此技能。涵蓋了 GSAP ScrollTrigger（固定、擦除、貼齊、時間軸、水平捲動、ScrollSmoother、matchMedia）和 Framer Motion / Motion v12（useScroll、useTransform、useSpring、whileInView、variants）。即使使用者只提到「捲動動畫」、「捲動時淡入」、「做出像 Apple 那樣的捲動效果」、「視差效果」、「固定區段」、「捲動進度條」或「進入動畫」，也要使用此技能。此技能也會針對 GSAP 或 Framer Motion 程式碼產生的 Copilot 提示詞模式觸發。請搭配 premium-frontend-ui 技能以獲得創意理念和設計層級的精緻感。'
metadata:
  author: 'Utkarsh Patrikar'
  author_url: 'https://github.com/utkarsh232005'
---

# GSAP & Framer Motion — 捲動動畫技能

提供生產級別的捲動動畫，包含 GitHub Copilot 提示詞、即插即用的程式碼食譜，以及深入的 API 參考資料。

> **設計夥伴：** 本技能提供捲動驅動動態的「技術實作」。
> 關於指導「如何」以及「何時」執行動畫的「創意理念」、設計原則和優質美學，請務必交叉參考 **premium-frontend-ui** 技能。
> 兩者結合形成一套完整的方案：premium-frontend-ui 決定「什麼」與「為什麼」；本技能則實現「如何做」。

## 快速函式庫選擇器

| 需求 | 使用 |
|---|---|
| 純 JS, Webflow, Vue | **GSAP** |
| 固定 (Pinning), 水平捲動, 複雜時間軸 | **GSAP** |
| React / Next.js, 宣告式風格 | **Framer Motion** |
| whileInView 進入動畫 | **Framer Motion** |
| 在同一個 Next.js 應用程式中使用兩者 | 請參閱參考文件中的說明 |

閱讀相關參考檔案以獲取完整食譜和 Copilot 提示詞：

- **GSAP** → `references/gsap.md` — ScrollTrigger API、所有食譜、React 整合
- **Framer Motion** → `references/framer.md` — useScroll、useTransform、所有食譜

## 設定（務必先執行）

### GSAP
```bash
npm install gsap
```
```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger); // 務必在任何 ScrollTrigger 用法之前呼叫
```

### Framer Motion (Motion v12, 2025)
```bash
npm install motion   # 2025 年中之後的新套件名稱
# 或者：npm install framer-motion — 仍然有效，API 相同
```
```js
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
// 舊版：import { motion } from 'framer-motion' — 同樣有效
```

## 工作流程

1. 解釋使用者意圖，判斷 GSAP 或 Framer Motion 是否為最適合的選擇。
2. 閱讀 `references/` 中相關的參考文件，瞭解詳細的 API 和模式。
3. 如果尚未安裝必要的套件，請建議進行安裝。
4. 實作動畫結構的架構，並遵循要求的格式（React 元件、hook 需求或純 JS）。
5. 套用正確的工具（捲動 vs 檢視中元件），確保具備協助工具選項，且 hook 不會導致無限重複渲染。

## 5 種最常見的捲動模式

快速參考 — 完整的食譜與 Copilot 提示詞請見參考檔案。

### 1. 進入時淡入 (GSAP)
```js
gsap.from('.card', {
  opacity: 0, y: 50, stagger: 0.15, duration: 0.8,
  scrollTrigger: { trigger: '.card', start: 'top 85%' }
});
```

### 2. 進入時淡入 (Framer Motion)
```jsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.6 }}
/>
```

### 3. 擦除 / 捲動連結 (GSAP)
```js
gsap.to('.hero-img', {
  scale: 1.3, opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
});
```

### 4. 捲動連結 (Framer Motion)
```jsx
const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
return <motion.div style={{ y }} />;
```

### 5. 固定時間軸 (GSAP)
```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: '.section', pin: true, scrub: 1, start: 'top top', end: '+=200%' }
});
tl.from('.title', { opacity: 0, y: 60 }).from('.img', { scale: 0.85 });
```

## 關鍵規則（務必遵守）

- **GSAP**：使用前務必呼叫 `gsap.registerPlugin(ScrollTrigger)`
- **GSAP 擦除 (scrub)**：務必使用 `ease: 'none'` — 在擦除模式啟動時，使用緩動會感覺不自然
- **GSAP React**：使用 `@gsap/react` 中的 `useGSAP`，絕不使用純 `useEffect` — 它會自動清理 ScrollTrigger
- **GSAP 除錯**：開發期間加入 `markers: true`；在正式環境前移除
- **Framer**：`useTransform` 的輸出必須進入 `motion.*` 元件的 `style` 屬性，而非普通 div
- **Framer Next.js**：在任何使用 motion hook 的檔案頂部務必加入 `'use client'`
- **兩者**：僅針對 `transform` 和 `opacity` 執行動畫 — 避免使用 `width`、`height`、`box-shadow`
- **協助工具**：務必檢查 `prefers-reduced-motion` — 模式請參閱各個參考檔案
- **優質精緻感**：遵循 **premium-frontend-ui** 技能原則來處理動態時間、緩動曲線和克制 — 動畫應該是增色，而非喧賓奪主

## Copilot 提示詞技巧

- 預先提供 Copilot 完整的選擇器、基礎圖片和捲動範圍 — 模糊的提示詞會產生模糊的程式碼
- 對於 GSAP，務必指定：選擇器、start/end 字串，以及是否需要 scrub 或 toggleActions
- 對於 Framer，務必指定：使用哪個 hook (useScroll vs whileInView)、位移值 (offset)，以及要轉換的屬性
- 詢問 `/fix` 時請貼上精確的錯誤訊息 — 搭配實際錯誤，Copilot 的修復效果會顯著提升
- 在 Copilot 聊天中使用 `@workspace` 範圍，以便其讀取您現有的元件結構

## 參考檔案

| 檔案 | 內容 |
|---|---|
| `references/gsap.md` | 完整 ScrollTrigger API 參考、10 種食譜、React (useGSAP)、Lenis、matchMedia、協助工具 |
| `references/framer.md` | 完整 useScroll / useTransform API、8 種食譜、variants、Motion v12 說明、Next.js 提示 |

## 相關技能

| 技能 | 關係 |
|---|---|
| **premium-frontend-ui** | 創意理念、設計原則和美學指南 — 定義了「何時」以及「為什麼」執行動畫 |
