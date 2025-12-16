---
description: 'VueJS 3 開發標準與最佳實務，採用 Composition API 與 TypeScript'
applyTo: '**/*.vue, **/*.ts, **/*.js, **/*.scss'
---

# VueJS 3 開發指引

本指引適用於以 Composition API、TypeScript 及現代最佳實務建構高品質 VueJS 3 應用程式。

## 專案架構
- Vue 3.x，預設採用 Composition API
- TypeScript 強型別
- 單一檔案元件（.vue），採用 `<script setup>` 語法
- 現代建構工具（推薦 Vite）
- Pinia 作為應用程式狀態管理
- 官方 Vue 風格指南與最佳實務

## 開發標準

### 架構
- 優先採用 Composition API（setup 函式與 composable）而非 Options API
- 依功能或領域組織元件與 composable，提升延展性
- UI 元件（展示型）與邏輯元件（容器型）分離
- 可重用邏輯請抽出至 `composables/` 目錄
- Pinia store 模組依領域組織，明確定義 actions、state、getters

### TypeScript 整合
- `tsconfig.json` 啟用嚴格模式，確保型別安全
- 使用 `defineComponent` 或 `<script setup lang="ts">` 搭配 `defineProps`、`defineEmits`
- 使用 `PropType<T>` 定義型別化 props 與預設值
- 複雜 props 與 state 結構請用 interface 或型別別名
- 事件處理、ref、`useRoute`/`useRouter` 皆定義型別
- 元件與 composable 可泛型化

### 元件設計
- 元件遵循單一職責原則
- 元件名稱採 PascalCase，檔名採 kebab-case
- 元件保持精簡，聚焦單一功能
- 優先使用 `<script setup>` 語法，簡潔高效
- props 以 TypeScript 驗證，僅必要時用執行期檢查
- 優先使用 slot 與 scoped slot 彈性組合

### 狀態管理
- 全域狀態用 Pinia，store 以 `defineStore` 定義
- 簡單區域狀態用 `ref`、`reactive` 於 setup
- 衍生狀態用 `computed`
- 複雜結構請正規化狀態
- Pinia store actions 處理非同步邏輯
- store plugin 用於持久化或除錯

### Composition API 模式
- 可重用邏輯請寫成 composable，如 `useFetch`、`useAuth`
- `watch`、`watchEffect` 精確指定依賴
- 副作用請於 `onUnmounted` 或 `watch` 清理
- 深層相依注入僅偶爾用 `provide`/`inject`
- 資料請用 `useAsyncData` 或第三方工具（Vue Query）

### 樣式
- 元件級樣式用 `<style scoped>` 或 CSS Modules
- 可考慮 utility-first 框架（如 Tailwind CSS）快速開發
- class 命名遵循 BEM 或函式型 CSS
- 主題與設計 token 用 CSS 自訂屬性
- 手機優先、響應式設計用 CSS Grid 與 Flexbox
- 樣式需無障礙（對比、聚焦狀態）

### 效能最佳化
- 動態匯入與 `defineAsyncComponent` 實現元件延遲載入
- `<Suspense>` 處理非同步元件載入備援
- 靜態或少變動元素用 `v-once`、`v-memo`
- Vue DevTools 效能分析
- 避免不必要 watcher，優先用 `computed`
- 移除未用程式碼並善用 Vite 最佳化

### 資料擷取
- 用 composable（如 `useFetch`）或 Vue Query 函式庫
- 明確處理 loading、error、success 狀態
- 元件卸載或參數變更時取消過時請求
- 樂觀更新，失敗時回滾
- 快取回應並背景重新驗證

### 錯誤處理
- 全域錯誤處理用 `app.config.errorHandler`
- 風險邏輯用 try/catch，提供友善訊息
- 元件本地錯誤邊界用 `errorCaptured` hook
- 優雅顯示備援 UI 或錯誤提示
- 錯誤可記錄至外部服務（Sentry、LogRocket）

### 表單與驗證
- 表單驗證可用 VeeValidate 或 @vueuse/form
- 表單採用受控 v-model 綁定
- 驗證可用 blur 或 input 並加上防抖提升效能
- 檔案上傳與多步驟表單請用 composable 處理
- 標籤、錯誤提示、聚焦管理皆需無障礙

### 路由
- Vue Router 4，採用 `createRouter` 與 `createWebHistory`
- 實現巢狀路由與路由層級程式碼分割
- 路由保護用導航守衛（`beforeEnter`、`beforeEach`）
- `setup` 內用 `useRoute`、`useRouter` 實現程式化導航
- 妥善管理 query 參數與動態片段
- 麵包屑資料用 route meta 欄位

### 測試
- 元件單元測試用 Vue Test Utils 與 Vitest
- 聚焦行為而非實作細節
- 用 `mount`、`shallowMount` 隔離元件
- 全域插件（router、Pinia）可 mock
- 端對端測試用 Cypress 或 Playwright
- 無障礙測試可整合 axe-core

### 安全性
- 避免使用 `v-html`，如需 HTML 輸入請嚴格消毒
- 用 CSP 標頭防範 XSS 與注入攻擊
- 樣板與指令資料皆需驗證與跳脫
- 所有 API 請求皆用 HTTPS
- 敏感 token 請存於 HTTP-only cookie，勿用 localStorage

### 無障礙
- 使用語意化 HTML 元素與 ARIA 屬性
- 管理模態與動態內容聚焦
- 互動元件皆需鍵盤操作
- 圖片與圖示皆加上有意義的 alt 文字
- 色彩對比需符合 WCAG AA 標準

## 實作流程
1. 規劃元件與 composable 架構
2. 以 Vue 3 與 TypeScript 初始化 Vite 專案
3. 定義 Pinia store 與 composable
4. 建立核心 UI 元件與版型
5. 整合路由與導覽
6. 實作資料擷取與狀態邏輯
7. 建立表單並處理驗證與錯誤
8. 加入全域錯誤處理與備援 UI
9. 加入單元與 E2E 測試
10. 效能與 bundle 最佳化
11. 確保無障礙合規
12. 文件化元件、composable 與 store

## 其他指引
- 遵循 Vue 官方風格指南（vuejs.org/style-guide）
- 使用 ESLint（`plugin:vue/vue3-recommended`）與 Prettier 保持程式碼一致性
- commit 訊息具意義，維持乾淨 git 歷史
- 定期更新相依套件並檢查漏洞
- 複雜邏輯請用 JSDoc/TSDoc 註解
- 除錯與效能分析請用 Vue DevTools

## 常見模式
- 無渲染元件與 scoped slot 彈性 UI
- provide/inject 實現複合元件
- 自訂指令處理橫切關注
- Teleport 實現模態與覆蓋層
- plugin 系統管理全域工具（i18n、分析）
- composable 工廠實現參數化邏輯
