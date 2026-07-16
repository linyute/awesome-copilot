---
description: 'Svelte 5 與 SvelteKit 2 開發標準與最佳實踐，針對元件化使用者介面與全端應用程式'
applyTo: '**/*.svelte, **/*.ts, **/*.js, **/*.css, **/*.scss, **/*.json'
---

# Svelte 5 與 SvelteKit 開發說明

Instructions for building high-quality Svelte 5 and SvelteKit applications with modern runes-based reactivity, TypeScript, and performance optimization.

> [!NOTE]
> 本指南中的範例與 API 目標為 Svelte 5.x 與 SvelteKit 2.x。標示為實驗性的功能（`await` 表達式與遠端函式）需要開啟設定旗標，且在穩定前可能會變更。

## 專案背景
- Svelte 5.x 搭配 runes 系統 ($state, $derived, $effect, $props, $bindable)
- SvelteKit 2.x 用於具檔案路由的全端應用程式
- TypeScript 提供類型安全與更佳開發者體驗
- 使用 CSS 自訂屬性進行元件範圍樣式
- 漸進式增強與效能優先的開發方針
- 現代建置工具（Vite）具備最佳化功能

## 核心概念

### 架構
- 使用 Svelte 5 runes 系統取代傳統 store，以實現所有反應性
- 依功能或領域組織元件，以提升延展性
- 將展示元件與邏輯較重的元件分離
- 將可重用的邏輯抽成可組合函式
- 使用 slots 與 snippets 實作正確的元件組合
- 以 SvelteKit 的檔案路由配合正確的 load 函式

### 元件設計
- 遵循單一職責原則設計元件
- 預設使用 `<script lang="ts">` 並搭配 runes 語法
- 元件保持小且聚焦於單一關切點
- 使用 TypeScript 標註實作正確的 prop 驗證
- 使用 `{#snippet}` 區塊在元件內重用模板邏輯
- 使用 slots 進行元件組合與內容投影
- 傳遞 `children` snippet 以實作彈性父子組合
- 設計元件須可測試且可重用
- 偏好使用 attachments（`{@attach}`，Svelte 5.29+）而非 actions（`use:`）處理 DOM 互動與第三方函式庫整合——attachments 可回應狀態並乾淨地組合
- 命名慣例：PascalCase 用於元件，camelCase 用於函式與變數
- 使用 JSDoc 註解說明複雜元件與邏輯

## 反應性與狀態

### Svelte 5 Runes 系統
- 使用 `$state()` 進行本地反應性狀態管理
- 使用 `$derived()` 產生計算值與耗費計算資源的結果
- 使用 `$derived.by()` 處理超出簡單表達式的複雜計算
- 谨慎使用 `$effect()`——應以 `$derived` 或函式綁定取代以同步狀態
- 使用 `$effect.pre()` 於 DOM 更新前執行程式碼
- 使用 `untrack()` 防止在 effect 中讀寫同一狀態時產生無限迴圈
- 以 `$props()` 定義元件屬性，並以 TypeScript 註解解構
- 使用 `$bindable()` 在元件間實作雙向資料繫結
- 使用函式綁定（`bind:value={() => value, (v) => (value = v)}`）在需要衍生或驗證值時
- 從傳統 store 遷移至 runes 以提升效能
- 直接覆寫 derived 值以支援樂觀 UI 模式（Svelte 5.25+）

### 狀態管理
- 使用 `$state()` 管理本地元件狀態
- 透過 `createContext()` 輔助函式建立類型安全的 context，取代原始的 `setContext`/`getContext`
- 使用 context API 在元件樹中共享反應性狀態
- 避免在 SSR 中使用全域 `$state` 模組——應使用 context 防止跨請求的資料洩漏
- 從 `$app/state`（`page`, `navigating`, `updated`）讀取 SvelteKit 應用與導覽狀態；`$app/stores` 為 SvelteKit < 2.12 的舊版對應
- 為複雜資料結構保持正規化狀態
- 偏好使用 `$derived()` 而非 `$effect()` 產生計算值
- 為客戶端資料實作適當的狀態持久化

### Effect 最佳實踐
- **避免** 使用 `$effect()` 同步狀態——改用 `$derived()`
- **應** 使用 `$effect()` 處理副作用：分析、日誌、DOM 操作
- **應** 從 effect 回傳清理函式以正確拆除
- 使用 `$effect.pre()` 在 DOM 更新前執行程式碼（例如捲動位置）
- 使用 `$effect.root()` 在元件生命週期外手動控制 effect
- 使用 `untrack()` 於 effect 中讀取狀態而不建立相依性
- 記得：effect 中的 async 程式碼在 `await` 後不會追蹤相依性

## SvelteKit 模式

### 路由與版面布局
- 使用 `+page.svelte` 作為具備適當 SEO 的頁面元件
- 實作 `+layout.svelte` 以提供共享版面與導覽
- 使用 SvelteKit 的檔案路由系統處理路由

### 資料載入與變更
- 使用 `+page.server.ts` 執行伺服器端資料載入與 API 呼叫
- 在 `+page.server.ts` 中實作表單動作以處理資料變更
- 使用 `+server.ts` 建立 API 端點與伺服器端邏輯
- 使用 SvelteKit 的 load 函式取得伺服器端與通用資料
- 實作適當的載入、錯誤與成功狀態
- 在伺服器 load 函式中以 Promise 處理串流資料
- 使用 `invalidate()` 與 `invalidateAll()` 管理快取
- 實作樂觀更新提升使用者體驗
- 優雅地處理離線情境與網路錯誤

### 遠端函式（實驗性）
- 使用遠端函式（SvelteKit 2.27+）實作型別安全的客戶端‑伺服器呼叫，始終在伺服器執行；於 `.remote.ts` 檔案中定義 `query`、`form`、`command` 或 `prerender`
- 於 `svelte.config.js` 中設定 `kit.experimental.remoteFunctions` 與 `compilerOptions.experimental.async` 以啟用
- 使用 `query` 讀取資料，並在標記中直接以 `await getPosts()` 解決：
```ts
// src/routes/blog/data.remote.ts
import { query } from '$app/server';
import * as db from '$lib/server/database';

export const getPosts = query(async () => {
  return await db.sql`SELECT title, slug FROM post ORDER BY published_at DESC`;
});
```
- 遠端檔案可匯入 `$lib/server` 模組取得機密與資料庫存取，但不得放在 `src/lib/server` 內

### 表單與驗證
- 使用 SvelteKit 的表單動作處理伺服器端表單
- 以 `use:enhance` 實作漸進式增強
- 使用 `bind:value` 建立受控表單輸入
- 在客戶端與伺服器端皆驗證資料
- 處理檔案上傳與複雜表單情境
- 以標籤與 ARIA 屬性提供正確的無障礙支援

## UI 與樣式設計

### 樣式設計
- 於 `<style>` 區塊內使用元件範圍樣式
- 使用 CSS 自訂屬性打造主題與設計系統
- 以 `class:` 指令實作條件樣式
- 採用 BEM 或實用程式優先的 CSS 規範
- 採取行動優先的響應式設計
- 盡量少用 `:global()` 於真正的全域樣式

### 轉場與動畫
- 使用 `transition:` 指令實作進出動畫（fade、slide、scale、fly）
- 使用 `in:` 與 `out:` 分別定義進入與退出轉場
- 使用 `animate:` 搭配 `flip` 實作平滑的列表重新排序
- 為品牌動態設計建立自訂轉場
- 使用 `|local` 修飾子僅在直接變更時觸發轉場
- 結合 keyed `{#each}` 區塊與轉場實作列表動畫

## TypeScript 整合
- 在 `tsconfig.json` 中啟用 strict 模式以達到最高類型安全
- 以 TypeScript 標註 props：`let { name }: { name: string } = $props()`
- 為事件處理函式、refs 與 SvelteKit 產生的類型加上型別
- 使用泛型建立可重用的元件
- 利用 SvelteKit 生成的 `$types.ts` 檔案
- 使用 `svelte-check` 實作正確的型別檢查
- 盡可能使用型別推斷以減少樣板程式碼

## 程式碼品質

### 效能最佳化
- 使用 keyed `{#each}` 區塊提升列表渲染效能
- 以動態 `import()` 實作懶載入；在 Svelte 5 中元件預設為動態——將匯入的元件指派給大寫變數並以 `<Component />` 渲染（`<svelte:component>` 在 runes 模式已不需要）
- 使用 `$derived()` 處理昂貴運算以避免不必要的重新計算
- 使用 `$derived.by()` 處理需要多行敘述的複雜衍生值
- 避免使用 `$effect()` 產生衍生狀態——效能較 `$derived()` 差
- 利用 SvelteKit 的自動程式碼分割與預載功能
- 透過 tree shaking 與正確匯入優化 bundle 大小
- 在抽象層使用 `$effect.tracking()` 有條件地建立反應式監聽器

### 錯誤處理
- 實作 `+error.svelte` 頁面作為路由層級的錯誤邊界
- 使用 `<svelte:boundary>`（Svelte 5.3+）在元件層級捕捉渲染與 effect 錯誤，提供 `failed` snippet（可使用 `reset`）或 `onerror` 處理器作為備援 UI
- 在 load 函式與表單動作中使用 try/catch 來捕獲錯誤
- 提供有意義的錯誤訊息與備援 UI
- 以適當方式記錄錯誤以協助除錯
- 在表單驗證錯誤時提供使用者友善的回饋
- 使用 SvelteKit 的 `error()` 與 `redirect()` 輔助函式產生正確的回應
- 使用實驗性的 `await` 語法（Svelte 5.36+，需在 `experimental.async` 中啟用）時，先以 `<svelte:boundary>` 的 `pending` snippet 顯示首次渲染 UI，之後以 `$effect.pending()` 處理載入狀態

### 安全性
- 對使用者輸入進行消毒以防止 XSS 攻擊
- 小心使用 `@html` 指令並驗證 HTML 內容
- 在 load 函式與表單動作中驗證與消毒資料

### 無障礙設計
- 使用語意化 HTML 元素與正確的層級標題
- 為所有互動元素實作鍵盤導覽
- 提供適切的 ARIA 標籤與說明文字
- 確保顏色對比符合 WCAG 指南
- 為動態內容實作焦點管理

