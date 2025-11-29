---
description: 'ReactJS 開發標準與最佳實踐'
applyTo: '**/*.jsx, **/*.tsx, **/*.js, **/*.ts, **/*.css, **/*.scss'
---

# ReactJS 開發指引

依據官方文件 https://react.dev，建構高品質 ReactJS 應用程式的指引，包含現代設計模式、hooks 與最佳實踐。

## 專案情境
- 最新 React 版本（React 19+）
- 使用 TypeScript 提升型別安全（如適用）
- 以函式元件與 hooks 為預設模式
- 遵循 React 官方風格指南與最佳實踐
- 採用現代建構工具（Vite、Create React App 或自訂 Webpack）
- 實作正確的元件組合與重用模式

## 開發標準

### 架構
- 以函式元件與 hooks 為主要設計模式
- 元件組合優於繼承
- 依功能或領域組織元件，提升延展性
- 明確區分展示型與容器型元件
- 使用自訂 hooks 實現可重用的狀態邏輯
- 建立正確的元件階層與資料流

### TypeScript 整合
- 使用 TypeScript 介面定義 props、state 與元件
- 為事件處理器與 refs 定義正確型別
- 適當實作泛型元件
- 在 `tsconfig.json` 啟用嚴格模式，確保型別安全
- 善用 React 內建型別（`React.FC`、`React.ComponentProps` 等）
- 為元件變體與狀態建立 union 型別

### 元件設計
- 遵循單一職責原則
- 使用具描述性且一致的命名
- 以 TypeScript 或 PropTypes 實作 props 驗證
- 設計可測試且可重用的元件
- 保持元件精簡，聚焦單一關注點
- 採用組合模式（render props、children as functions）

### 狀態管理
- 使用 `useState` 管理本地元件狀態
- 複雜狀態邏輯採用 `useReducer`
- 以 `useContext` 跨元件樹共享狀態
- 複雜應用可考慮外部狀態管理（Redux Toolkit、Zustand）
- 實作正確的狀態正規化與資料結構
- 伺服器狀態管理建議用 React Query 或 SWR

### Hooks 與 Effect
- 使用 `useEffect` 並正確設置依賴陣列，避免無限迴圈
- 在 effect 中實作清理函式，防止記憶體洩漏
- 針對效能優化適時使用 `useMemo` 與 `useCallback`
- 建立自訂 hooks 實現可重用的狀態邏輯
- 遵循 hooks 規則（僅於頂層呼叫）
- 使用 `useRef` 存取 DOM 元素或儲存可變值

### 樣式
- 採用 CSS Modules、Styled Components 或現代 CSS-in-JS
- 實作響應式設計，優先行動裝置
- 遵循 BEM 或類似 CSS 命名規則
- 使用 CSS 變數（custom properties）實現主題化
- 實作一致的間距、字型與色彩系統
- 以正確 ARIA 屬性與語意 HTML 提升無障礙性

### 效能優化
- 適時使用 `React.memo` 進行元件記憶化
- 以 `React.lazy` 與 `Suspense` 實作程式碼分割
- 以 tree shaking 與動態匯入優化 bundle 大小
- 適度使用 `useMemo` 與 `useCallback`，避免不必要重渲染
- 大型清單建議用虛擬捲動
- 以 React DevTools 追蹤效能瓶頸

### 資料擷取
- 採用現代資料擷取函式庫（React Query、SWR、Apollo Client）
- 正確處理載入、錯誤與成功狀態
- 處理競態條件與請求取消
- 以樂觀更新提升使用者體驗
- 實作正確快取策略
- 處理離線情境與網路錯誤

### 錯誤處理
- 以 Error Boundaries 實現元件級錯誤處理
- 資料擷取時正確處理錯誤狀態
- 為錯誤情境設計備援 UI
- 適當記錄錯誤以利除錯
- 處理 effect 與事件處理器中的非同步錯誤
- 提供具意義的錯誤訊息給使用者

### 表單與驗證
- 表單輸入建議用受控元件
- 以 Formik、React Hook Form 等函式庫實作表單驗證
- 正確處理表單送出與錯誤狀態
- 表單需具備無障礙功能（label、ARIA 屬性）
- 採用防抖驗證提升使用者體驗
- 處理檔案上傳與複雜表單情境

### 路由
- 用 React Router 實現前端路由
- 實作巢狀路由與路由保護
- 正確處理路由參數與查詢字串
- 以 lazy loading 實現路由程式碼分割
- 實作正確的導覽模式與返回鍵處理
- 實作麵包屑與導覽狀態管理

### 測試
- 以 React Testing Library 撰寫元件單元測試
- 測試元件行為而非實作細節
- 使用 Jest 作為測試執行與斷言函式庫
- 複雜元件互動建議撰寫整合測試
- 適當模擬外部相依與 API 呼叫
- 測試無障礙功能與鍵盤操作

### 安全性
- 過濾使用者輸入，防止 XSS 攻擊
- 資料渲染前請驗證與跳脫
- 所有外部 API 呼叫請用 HTTPS
- 實作正確的認證與授權模式
- 避免將敏感資料存於 localStorage 或 sessionStorage
- 使用 Content Security Policy (CSP) 標頭

### 無障礙
- 正確使用語意 HTML 元素
- 實作正確的 ARIA 屬性與角色
- 確保所有互動元件可鍵盤操作
- 為圖片與圖示提供替代文字
- 實作正確的色彩對比
- 以螢幕閱讀器與無障礙工具測試

## 實作流程
1. 規劃元件架構與資料流
2. 建立專案結構與資料夾組織
3. 定義 TypeScript 介面與型別
4. 實作核心元件與樣式
5. 加入狀態管理與資料擷取邏輯
6. 實作路由與導覽
7. 加入表單處理與驗證
8. 實作錯誤處理與載入狀態
9. 增加元件與功能測試覆蓋率
10. 優化效能與 bundle 大小
11. 確保無障礙合規
12. 增加文件與程式碼註解

## 其他指引
- 遵循 React 命名慣例（元件用 PascalCase，函式用 camelCase）
- 使用具意義的 commit 訊息，維持乾淨的 git 歷史
- 實作正確的程式碼分割與 lazy loading 策略
- 以 JSDoc 註解複雜元件與自訂 hooks
- 使用 ESLint 與 Prettier 維持一致程式碼格式
- 定期更新相依套件並檢查安全性
- 依不同部署階段設定正確環境參數
- 用 React Developer Tools 除錯與效能分析

## 常見設計模式
- 高階元件（HOC）處理橫切關注
- Render props 模式實現元件組合
- 複合元件實現相關功能
- Provider 模式分享 context 狀態
- 容器/展示型元件分離
- 自訂 hooks 抽取可重用邏輯
