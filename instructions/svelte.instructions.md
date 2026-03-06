---
description: 'Svelte 5 和 SvelteKit 開發標準和最佳實務，用於以元件為基礎的使用者介面和全疊層應用程式'
applyTo: '**/*.svelte, **/*.ts, **/*.js, **/*.css, **/*.scss, **/*.json'
---

# Svelte 5 和 SvelteKit 開發指令

使用現代符文（runes）反應性、TypeScript 和效能優化建構高品質 Svelte 5 和 SvelteKit 應用程式的指令。

## 專案背景
- 具備符文系統（$state, $derived, $effect, $props, $bindable）的 Svelte 5.x
- 用於具備檔案型路由之全疊層應用程式的 SvelteKit
- 用於型別安全和更好開發人員體驗的 TypeScript
- 具備 CSS 自定義屬性的元件範圍樣式
- 漸進式增強和效能優先的方法
- 具備優化功能的現代建構工具 (Vite)

## 核心概念

### 架構
- 對於所有反應性使用 Svelte 5 符文系統，而非遺留的儲存
- 依功能或網域組織元件以實現延展性
- 將簡報元件與邏輯密集型元件分開
- 將可重複使用的邏輯提取到可組合函式中
- 使用插槽（slots）和程式碼片段（snippets）實作正確的元件組合
- 使用 SvelteKit 的檔案型路由和正確的載入函式

### 元件設計
- 元件遵循單一職責原則
- 預設使用具備符文語法的 <script lang="ts">
- 保持元件精簡並專注於單一關注點
- 使用 TypeScript 註解實作正確的 prop 驗證
- 在元件內使用 {#snippet} 區塊來處理可重複使用的範本邏輯
- 使用插槽進行元件組合和內容投影
- 傳遞 children 程式碼片段以進行靈活的父子組合
- 將元件設計為可測試且可重複使用的

## 反應性和狀態

### Svelte 5 符文系統
- 使用 $state() 進行反應性區域狀態管理
- 實作 $derived() 用於計算值和昂貴的計算
- 對於超出簡單運算式的複雜計算使用 $derived.by()
- 謹慎使用 $effect() - 偏好使用 $derived 或函式繫結進行狀態同步
- 實作 $effect.pre() 以在 DOM 更新前執行程式碼
- 使用 untrack() 防止在 effect 中讀取/寫入相同狀態時產生無限迴圈
- 使用 $props() 定義元件 props 並使用 TypeScript 註解進行解構
- 使用 $bindable() 進行元件間的雙向資料繫結
- 從遺留的儲存遷移到符文以獲得更好的效能
- 直接覆寫衍生值以實現樂觀 UI 模式 (Svelte 5.25+)

### 狀態管理
- 使用 $state() 處理區域元件狀態
- 使用 createContext() 輔助程式實作型別安全內容，優於原始的 setContext/getContext
- 使用內容 API 在元件樹下游共享反應性狀態
- 避免在 SSR 中使用全域 $state 模組 - 使用內容以防止跨請求資料洩漏
- 需要時對全域應用程式狀態使用 SvelteKit 儲存
- 對於複雜資料結構保持狀態正規化
- 對於計算值，偏好使用 $derived() 而非 $effect()
- 為用戶端資料實作正確的狀態持久化

### Effect 最佳實務
- **避免** 使用 $effect() 同步狀態 - 改用 $derived()
- **務必** 將 $effect() 用於副作用：分析、記錄、DOM 操作
- **務必** 從 effect 回傳清理函式以進行正確的卸載
- 當程式碼必須在 DOM 更新前執行時（例如：捲動位置），使用 $effect.pre()
- 對於元件生命週期之外的手動控制 effect，使用 $effect.root()
- 使用 untrack() 在不建立 effect 相依性的情況下讀取狀態
- 請記住：effect 中的非同步程式碼在 await 之後不會追蹤相依性

## SvelteKit 模式

### 路由和佈局
- 將 +page.svelte 用於具備正確 SEO 的頁面元件
- 為共用佈局和導覽實作 +layout.svelte
- 使用 SvelteKit 的檔案型系統處理路由

### 資料載入和變動
- 將 +page.server.ts 用於伺服器端資料載入和 API 呼叫
- 在 +page.server.ts 中實作表單動作以進行資料變動
- 將 +server.ts 用於 API 端點和伺服器端邏輯
- 將 SvelteKit 的載入函式用於伺服器端和通用資料擷取
- 實作正確的載入、錯誤和成功狀態
- 在伺服器載入函式中使用 promise 處理串流資料
- 將 invalidate() 和 invalidateAll() 用於快取管理
- 實作樂觀更新以獲得更好的使用者體驗
- 優雅地處理離線情境和網路錯誤

### 表單和驗證
- 使用 SvelteKit 的表單動作進行伺服器端表單處理
- 使用 use:enhance 實作漸進式增強
- 將 bind:value 用於受控表單輸入
- 在用戶端和伺服器端同時驗證資料
- 處理檔案上傳和複雜的表單情境
- 使用標籤和 ARIA 屬性實作正確的可存取性

## UI 和樣式

### 樣式
- 使用具備 <style> 區塊的元件範圍樣式
- 為佈景主題和設計系統實作 CSS 自定義屬性
- 將 class: 指令用於條件式樣式
- 遵循 BEM 或公用程式優先的 CSS 慣例
- 使用行動優先的方法實作回應式設計
- 謹慎使用 :global() 處理真正的全域樣式

### 轉換和動畫
- 使用 transition: 指令處理進入/離開動畫（淡入淡出、滑動、縮放、飛行）
- 將 in: 和 out: 用於個別的進入/離開轉換
- 使用具備 flip 的 animate: 指令進行平滑的列表重排
- 為品牌動態設計建立自定義轉換
- 使用 |local 修飾符僅在直接更改時觸發轉換
- 將轉換與具備鍵值的 {#each} 區塊結合以進行列表動畫

## TypeScript 和工具

### TypeScript 整合
- 在 tsconfig.json 中啟用嚴格模式以獲得最大程度的型別安全
- 使用 TypeScript 註解 props：let { name }: { name: string } = $props()
- 為事件處理常式、參照和 SvelteKit 產生的型別標註型別
- 為可重複使用的元件使用泛型型別
- 利用 SvelteKit 產生的 $types.ts 檔案
- 使用 svelte-check 實作正確的型別檢查
- 盡可能利用型別推論以減少樣板程式碼

### 開發工具
- 使用 ESLint 搭配 eslint-plugin-svelte 和 Prettier 以保持程式碼一致性
- 使用 Svelte 開發人員工具進行偵錯和效能分析
- 保持相依性更新並稽核安全性弱點
- 使用 JSDoc 記錄複雜的元件和邏輯
- 遵循 Svelte 的命名慣例（元件使用 PascalCase，函式使用 camelCase）

## 實際運作準備

### 效能優化
- 使用具備鍵值的 {#each} 區塊進行高效的列表渲染
- 使用動態匯入和 <svelte:component> 實作延遲載入
- 將 $derived() 用於昂貴的計算，以避免不必要的重新計算
- 對於需要多個陳述式的複雜衍生值，使用 $derived.by()
- 避免將 $effect() 用於衍生狀態 - 其效能低於 $derived()
- 利用 SvelteKit 的自動程式碼分割和預先載入
- 透過 tree shaking 和正確的匯入優化套件大小
- 使用 Svelte 開發人員工具進行分析以識別效能瓶頸
- 在抽象中使用 $effect.tracking() 以有條件地建立反應性接聽程式

### 錯誤處理
- 為路由層級的錯誤邊界實作 +error.svelte 頁面
- 在載入函式和表單動作中使用 try/catch 區塊
- 提供具意義的錯誤訊息和遞補 UI
- 適當地記錄錯誤以進行偵錯和監控
- 在表單中處理驗證錯誤並提供正確的使用者回饋
- 使用 SvelteKit 的 error() 和 redirect() 輔助程式進行正確的回應
- 使用 $effect.pending() 追蹤擱置中的 promise 以顯示載入狀態

### 測試
- 使用 Vitest 和 Testing Library 為元件撰寫單元測試
- 測試元件行為，而非實作細節
- 將 Playwright 用於使用者工作流程的端對端測試
- 適當模擬 SvelteKit 的載入函式和 儲存
- 徹底測試表單動作和 API 端點
- 使用 axe-core 實作可存取性測試

### 安全性
- 清理使用者輸入以防止 XSS 攻擊
- 小心使用 @html 指令並驗證 HTML 內容
- 使用 SvelteKit 實作正確的 CSRF 保護
- 在載入函式和表單動作中驗證並清理資料
- 對於所有外部 API 呼叫和實際部署使用 HTTPS
- 使用正確的工作階段管理安全地儲存敏感資料

### 可存取性
- 使用語義化 HTML 元件和正確的標題階層
- 為所有互動元件實作鍵盤導覽
- 提供正確的 ARIA 標籤和描述
- 確保色彩對比度符合 WCAG 指南
- 使用螢幕助讀程式和可存取性工具進行測試
- 為動態內容實作焦點管理

### 部署
- 使用環境變數進行不同部署階段的組態
- 使用 SvelteKit 的 meta 標籤和結構化資料實作正確的 SEO
- 根據代管平台使用適當的 SvelteKit 配接器部署

## 實作程序
1. 初始化具備 TypeScript 和所需配接器的 SvelteKit 專案
2. 使用正確的資料夾組織設定專案結構
3. 定義 TypeScript 介面和元件 props
4. 使用 Svelte 5 符文實作核心元件
5. 使用 SvelteKit 新增路由、佈局和導覽
6. 實作資料載入和表單處理
7. 使用自定義屬性和回應式設計新增樣式系統
8. 實作錯誤處理和載入狀態
9. 增加全面的測試涵蓋範圍
10. 優化效能和套件大小
11. 確保符合可存取性規範
12. 使用適當的 SvelteKit 配接器進行部署

## 常見模式
- 具備插槽的無渲染元件，用於靈活的 UI 組合
- 用於橫切關注點和 DOM 操作的自定義動作（use: 指令）
- 元件內用於可重複使用範本邏輯的 {#snippet} 區塊
- 使用 createContext() 進行元件樹狀態共享的型別安全內容
- 使用 use:enhance 對表單和互動功能進行漸進式增強
- 具備用戶端水合作用的伺服器端渲染，以獲得最佳效能
- 用於雙向繫結的函式繫結（bind:value={() => value, setValue}）
- 避免將 $effect() 用於狀態同步 - 改用 $derived() 或回呼函式
