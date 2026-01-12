# 框架特定修正指南 (Framework-specific Fix Guide)

本文件說明針對各個框架與樣式方法的特定修正技巧。

---

## 純 CSS / SCSS

### 修正版面溢出

```css
/* 修正前：發生溢出 */
.container {
  width: 100%;
}

/* 修正後：控制溢出 */
.container {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
```

### 預防文字遭截斷

```css
/* 單行截斷 */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 多行截斷 */
.text-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 自動換行 */
.text-wrap {
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
```

### 間距統一

```css
/* 使用 CSS 自訂屬性統一間距 */
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

.card {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
```

### 改進對比度

```css
/* 修正前：對比度不足 */
.text {
  color: #999999;
  background-color: #ffffff;
}

/* 修正後：符合 WCAG AA 標準 */
.text {
  color: #595959; /* 對比率 7:1 */
  background-color: #ffffff;
}
```

---

## Tailwind CSS

### 版面配置修正

```jsx
{/* 修正前：溢出 */}
<div className="w-full">
  <img src="..." />
</div>

{/* 修正後：溢出控制 */}
<div className="w-full max-w-full overflow-hidden">
  <img src="..." className="w-full h-auto object-contain" />
</div>
```

### 預防文字遭截斷

```jsx
{/* 單行截斷 */}
<p className="truncate">長文字...</p>

{/* 多行截斷 */}
<p className="line-clamp-3">長文字...</p>

{/* 允許換行 */}
<p className="break-words">長文字...</p>
```

### 回應式支援

```jsx
{/* 行動裝置優先的回應式設計 */}
<div className="
  flex flex-col gap-4
  md:flex-row md:gap-6
  lg:gap-8
">
  <div className="w-full md:w-1/2 lg:w-1/3">
    內容
  </div>
</div>
```

### 間距統一 (Tailwind Config)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
}
```

### 無障礙性改進

```jsx
{/* 加入焦點狀態 */}
<button className="
  bg-blue-500 text-white
  hover:bg-blue-600
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
">
  按鈕
</button>

{/* 改進對比度 */}
<p className="text-gray-700 bg-white"> {/* 從 text-gray-500 變更 */}
  可讀性佳的文字
</p>
```

---

## React + CSS 模組 (CSS Modules)

### 在模組範圍內修正

```css
/* Component.module.css */

/* 修正前 */
.container {
  display: flex;
}

/* 修正後：加入溢出控制 */
.container {
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  max-width: 100%;
}
```

### 元件端修正

```jsx
// Component.jsx
import styles from './Component.module.css';

// 修正前
<div className={styles.container}>

// 修正後：加入條件類別
<div className={`${styles.container} ${isOverflow ? styles.overflow : ''}`}>
```

---

## styled-components / Emotion

### 樣式修正

```jsx
// 修正前
const Container = styled.div`
  width: 100%;
`;

// 修正後
const Container = styled.div`
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;
```

### 回應式支援

```jsx
const Card = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
```

### 與主題保持一致

```jsx
// theme.js
export const theme = {
  colors: {
    primary: '#2563eb',
    text: '#1f2937',
    textLight: '#4b5563', // 改進對比度
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  },
};

// 使用方式
const Text = styled.p`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;
```

---

## Vue (限定範圍樣式 - Scoped Styles)

### 修正限定範圍樣式

```vue
<template>
  <div class="container">
    <p class="text">內容</p>
  </div>
</template>

<style scoped>
/* 僅套用於此元件 */
.container {
  max-width: 100%;
  overflow: hidden;
}

.text {
  /* 修正：改進對比度 */
  color: #374151; /* 原本：#9ca3af */
}

/* 回應式 */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
</style>
```

### 深度選擇器 (影響子元件)

```vue
<style scoped>
/* 覆蓋子元件樣式 (請謹慎使用) */
:deep(.child-class) {
  margin-bottom: 1rem;
}
</style>
```

---

## Next.js / App Router

### 全域樣式修正

```css
/* app/globals.css */
:root {
  --foreground: #171717;
  --background: #ffffff;
}

/* 預防版面溢出 */
html, body {
  max-width: 100vw;
  overflow-x: hidden;
}

/* 預防圖片溢出 */
img {
  max-width: 100%;
  height: auto;
}
```

### 版面配置元件修正

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50">
          {/* 頁首 */}
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <footer>
          {/* 頁尾 */}
        </footer>
      </body>
    </html>
  );
}
```

---

## 常見模式

### 修正 Flexbox 版面配置問題

```css
/* 修正前：項目溢出 */
.flex-container {
  display: flex;
  gap: 1rem;
}

/* 修正後：換行與尺寸控制 */
.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-item {
  flex: 1 1 300px; /* 延伸, 縮減, 基準 */
  min-width: 0; /* 預防 flexbox 溢出問題 */
}
```

### 修正 Grid 版面配置問題

```css
/* 修正前：固定欄數 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

/* 修正後：自動調整 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}
```

### 整理 z-index

```css
/* 系統化 z-index */
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-tooltip: 500;
}

.modal {
  z-index: var(--z-modal);
}
```

### 加入焦點狀態

```css
/* 為所有互動式元件加入焦點狀態 */
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* 自訂焦點輪廓 */
.custom-focus:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.5);
}
```

---

## 偵錯技巧

### 視覺化元件邊界

```css
/* 僅在開發期間使用 */
* {
  outline: 1px solid red !important;
}
```

### 偵測溢出

```javascript
// 在控制台執行以偵測溢出元件
document.querySelectorAll('*').forEach(el => {
  if (el.scrollWidth > el.clientWidth) {
    console.log('水平溢出 (Horizontal overflow)：', el);
  }
  if (el.scrollHeight > el.clientHeight) {
    console.log('垂直溢出 (Vertical overflow)：', el);
  }
});
```

### 檢查對比率

```javascript
// 使用 Chrome DevTools Lighthouse 或 axe DevTools
// 或在下列網站檢查：
// https://webaim.org/resources/contrastchecker/
```
