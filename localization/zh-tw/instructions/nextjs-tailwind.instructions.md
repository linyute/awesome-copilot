---
description: 'Next.js + Tailwind 開發標準與指引'
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css'
---

# Next.js + Tailwind 開發指引

本指引適用於高品質 Next.js 應用程式，採用 Tailwind CSS 樣式與 TypeScript。

## 專案背景

- 最新 Next.js（App Router）
- TypeScript 型別安全
- Tailwind CSS 樣式設計

## 開發標準

### 架構
- App Router，支援伺服端與用戶端元件
- 依功能/領域分組路由
- 實作正確的錯誤邊界
- 預設使用 React Server Components
- 優先採用靜態最佳化

### TypeScript
- 啟用嚴格模式
- 型別定義清晰
- 以型別守衛處理錯誤
- 執行期型別驗證採用 Zod

### 樣式
- Tailwind CSS，色彩配置一致
- 響應式設計模式
- 支援深色模式
- 遵循容器查詢最佳實踐
- 維持語意化 HTML 結構

### 狀態管理
- 伺服端狀態用 React Server Components
- 用戶端狀態用 React hooks
- 正確處理載入與錯誤狀態
- 適時採用樂觀更新

### 資料擷取
- 伺服端元件直接查詢資料庫
- 載入狀態用 React Suspense
- 錯誤處理與重試邏輯完善
- 快取失效策略

### 安全性
- 輸入驗證與消毒
- 正確認證檢查
- CSRF 防護
- 實作速率限制
- API 路由安全處理

### 效能
- 圖片最佳化（next/image）
- 字型最佳化（next/font）
- 路由預先載入
- 正確程式碼分割
- 套件大小最佳化

## 實作流程
1. 規劃元件階層
2. 定義型別與介面
3. 實作伺服端邏輯
4. 建立用戶端元件
5. 加入錯誤處理
6. 實作響應式樣式
7. 加入載入狀態
8. 撰寫測試
