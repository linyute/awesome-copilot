---
description: 'Next.js + Tailwind 開發標準與指引'
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css'
---

# Next.js + Tailwind 開發指引

用於建構高品質 Next.js 應用程式（搭配 Tailwind CSS 樣式設計與 TypeScript）的指引。

## 專案背景

- 遵循 `package.json` 與 lockfile 中已安裝的 Next.js、React 與 Tailwind 版本；請勿將升級相依性作為功能或修復的副作用。
- 使用專案現有的路由器與建置設定。以下指引以 App Router 為目標。
- 使用 TypeScript 確保型別安全
- 使用 Tailwind CSS 進行樣式設計

### 版本特定行為
- 針對 Next.js 15+，請以非同步方式處理 `cookies`、`headers`、`draftMode`、路由 `params` 與頁面 `searchParams` 等請求 API。Next.js 16 已移除其暫時的同步相容性。
- 針對 Next.js 15+，請勿假設 `fetch` 或 `GET` 路由處理常式預設會被快取。請針對已安裝的版本刻意選擇快取與重新驗證策略，並在變更資料後測試資料新鮮度。
- Next.js 16 預設使用 Turbopack 進行開發與建置。變更建置指令碼前請先檢查自訂 Webpack 設定；當專案需要時，請保留明確的 Webpack 建置。
- 針對 Tailwind v4，請使用 CSS 優先設定（`@import "tailwindcss"` 與佈景主題變數）以及適當的 Vite 或 PostCSS 整合。除非要求遷移，否則請保留 v3 專案的設定與瀏覽器支援需求。

參考資料：[Next.js 15 升級指南](https://nextjs.org/docs/15/app/guides/upgrading/version-15)、[Next.js 16 升級指南](https://nextjs.org/docs/app/guides/upgrading/version-16)、[Tailwind v4 升級指南](https://tailwindcss.com/docs/upgrade-guide)。

## 開發標準

### 架構
- 採用支援伺服器與用戶端元件的 App Router
- 依功能／領域將路由分組
- 實作適當的錯誤邊界
- 預設使用 React 伺服器元件（React Server Components）
- 在可能的情況下善用靜態最佳化

### TypeScript
- 啟用嚴格模式（Strict mode）
- 清楚的型別定義
- 使用型別防衛（type guards）進行適當的錯誤處理
- 使用 Zod 進行執行期型別驗證

### 樣式設計
- 使用一致調色盤的 Tailwind CSS
- 響應式設計模式
- 支援深色模式
- 遵循容器查詢最佳實務
- 維持語意化 HTML 結構

### 狀態管理
- 使用 React 伺服器元件處理伺服器狀態
- 使用 React hooks 處理用戶端狀態
- 適當的載入與錯誤狀態
- 在適當時機採用樂觀更新

### 資料擷取
- 使用伺服器元件直接進行資料庫查詢
- 使用 React Suspense 處理載入狀態
- 適當的錯誤處理與重試邏輯
- 快取失效策略

### 安全性
- 輸入驗證與清理
- 適當的驗證檢查
- CSRF 防護
- 實作速率限制
- 安全的 API 路由處理

### 效能
- 使用 next/image 進行圖片最佳化
- 使用 next/font 進行字型最佳化
- 路由預先擷取
- 適當的程式碼分割
- 套件大小最佳化

## 實作流程
1. 規劃元件階層結構
2. 定義型別與介面
3. 實作伺服器端邏輯
4. 建構用戶端元件
5. 加入適當的錯誤處理
6. 實作響應式樣式
7. 加入載入狀態
8. 撰寫測試