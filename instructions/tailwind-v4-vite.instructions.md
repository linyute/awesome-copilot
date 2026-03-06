---
description: '使用官方 @tailwindcss/vite 套件為 Vite 專案安裝與設定 Tailwind CSS v4+'
applyTo: 'vite.config.ts, vite.config.js, **/*.css, **/*.tsx, **/*.ts, **/*.jsx, **/*.js'
---

# 使用 Vite 安裝 Tailwind CSS v4+

使用官方 Vite 套件安裝與設定 Tailwind CSS 第 4 版及更高版本的說明。Tailwind CSS v4 導入了簡化的設定，在大多數情況下不再需要 PostCSS 設定與 tailwind.config.js。

## Tailwind CSS v4 的關鍵變更

- **使用 Vite 套件時不需要 PostCSS 設定**
- **不需要 tailwind.config.js** - 設定是透過 CSS 完成的
- **新的 @tailwindcss/vite 套件** 取代了基於 PostCSS 的方法
- **CSS 優先設定** 使用 `@theme` 指令
- **自動內容偵測** - 不需要指定內容路徑

## 安裝步驟

### 第 1 步：安裝相依套件

安裝 `tailwindcss` 與 `@tailwindcss/vite` 套件：

```bash
npm install tailwindcss @tailwindcss/vite
```

### 第 2 步：設定 Vite 套件

將 `@tailwindcss/vite` 套件新增到您的 Vite 設定檔：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

對於使用 Vite 的 React 專案：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

### 第 3 步：匯入 Tailwind CSS

將 Tailwind CSS 匯入新增到您的主 CSS 檔案（例如 `src/index.css` 或 `src/App.css`）：

```css
@import "tailwindcss";
```

### 第 4 步：在進入點驗證 CSS 匯入

確保您的主 CSS 檔案已在應用程式進入點中匯入：

```typescript
// src/main.tsx 或 src/main.ts
import './index.css'
```

### 第 5 步：啟動開發伺服器

執行開發伺服器以驗證安裝：

```bash
npm run dev
```

## 在 Tailwind v4 中不要做的事

### 不要建立 tailwind.config.js

Tailwind v4 使用 CSS 優先設定。除非您有特定的遺留需求，否則不要建立 `tailwind.config.js` 檔案。

```javascript
// ❌ 在 Tailwind v4 中不需要
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 不要為 Tailwind 建立 postcss.config.js

使用 `@tailwindcss/vite` 套件時，不需要為 Tailwind 進行 PostCSS 設定。

```javascript
// ❌ 使用 @tailwindcss/vite 時不需要
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 不要使用舊指令

舊的 `@tailwind` 指令已被單一匯入取代：

```css
/* ❌ 舊版 - 不要在 Tailwind v4 中使用 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ 新版 - 在 Tailwind v4 中使用此指令 */
@import "tailwindcss";
```

## CSS 優先設定 (Tailwind v4)

### 自定義主題設定

在 CSS 中使用 `@theme` 指令來定製您的設計權杖 (design tokens)：

```css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --font-sans: 'Inter', system-ui, sans-serif;
  --radius-lg: 0.75rem;
}
```

### 新增自定義公用程式 (Utilities)

直接在 CSS 中定義自定義公用程式：

```css
@import "tailwindcss";

@utility content-auto {
  content-visibility: auto;
}

@utility scrollbar-hidden {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

### 新增自定義變體 (Variants)

在 CSS 中定義自定義變體：

```css
@import "tailwindcss";

@variant hocus (&:hover, &:focus);
@variant group-hocus (:merge(.group):hover &, :merge(.group):focus &);
```

## 驗證清單

安裝後，驗證：

- [ ] `tailwindcss` 與 `@tailwindcss/vite` 存在於 `package.json` 的相依套件中
- [ ] `vite.config.ts` 包含 `tailwindcss()` 套件
- [ ] 主 CSS 檔案包含 `@import "tailwindcss";`
- [ ] CSS 檔案已在應用程式進入點中匯入
- [ ] 開發伺服器執行時無錯誤
- [ ] Tailwind 公用程式類別（例如 `text-blue-500`、`p-4`）正確渲染

## 使用範例

使用簡單的元件測試安裝：

```tsx
export function TestComponent() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600 underline">
        你好，Tailwind CSS v4！
      </h1>
    </div>
  )
}
```

## 疑難排解

### 樣式未套用

1. 驗證 CSS 匯入語句為 `@import "tailwindcss";`（不是舊指令）
2. 確保 CSS 檔案已在您的進入點中匯入
3. 檢查 Vite 設定是否包含 `tailwindcss()` 套件
4. 清除 Vite 快取：`rm -rf node_modules/.vite && npm run dev`

### 找不到套件錯誤

如果您看到 "Cannot find module '@tailwindcss/vite'"：

```bash
npm install @tailwindcss/vite
```

### TypeScript 錯誤

如果 TypeScript 找不到 Vite 套件的類型，請確保您有正確的匯入：

```typescript
import tailwindcss from '@tailwindcss/vite'
```

## 從 Tailwind v3 遷移

如果是從 Tailwind v3 遷移：

1. 移除 `tailwind.config.js`（將定製內容移至 CSS `@theme`）
2. 移除 `postcss.config.js`（如果僅用於 Tailwind）
3. 解除安裝舊套件：`npm uninstall postcss autoprefixer`
4. 安裝新套件：`npm install tailwindcss @tailwindcss/vite`
5. 將 `@tailwind` 指令取代為 `@import "tailwindcss";`
6. 更新 Vite 設定以使用 `@tailwindcss/vite` 套件

## 參考資料

- 官方文件：https://tailwindcss.com/docs/installation/using-vite
- Tailwind CSS v4 升級指南：https://tailwindcss.com/docs/upgrade-guide
