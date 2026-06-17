---
description: '全面的 Vue 3 開發標準與最佳實踐：Composition API、`<script setup>`、完整響應式系統、編譯器巨集 (defineModel/defineSlots/defineOptions)、內建元件 (Teleport/Suspense/Transition/KeepAlive)、provide/inject、組合式函式 (composables)、Pinia、Vue Router、TypeScript、測試、效能、SSR 以及安全性。'
applyTo: '**/*.vue, **/*.ts, **/*.js, **/*.css, **/*.scss'
---

# Vue 3 開發指南

構建生產級 Vue 3 應用程式的權威指南。預設使用 **Composition API** 搭配 `<script setup lang="ts">`、現代響應式系統以及官方生態系統 (Pinia, Vue Router, Vite, Vitest)。優先選擇以下慣用法，而非舊有的 Options API 和 Vue 2 模式。

## 專案背景
- Vue 3.4+（在專案版本允許的情況下，使用 3.5+ 的功能，如 `useTemplateRef`、`useId` 和響應式 props 解構）。
- 以 `<script setup lang="ts">` 單檔案元件 (SFC) 作為預設開發風格。
- 全面使用 TypeScript：元件、組合式函式、Store 和路由。
- 使用 Pinia 進行狀態管理；使用 Vue Router 進行路由；使用 Vite 進行建置/開發。
- 使用 Vitest + Vue Test Utils（或 Testing Library for Vue）進行測試。

## 開發風格與元件設計
- 使用 `<script setup>` — 它比 `setup()` 或 Options API 更簡潔、執行更快，且具有更好的類型推導。
- 每個元件僅負擔單一職責；將大型元件拆分為多個專注的小型元件，並配合組合式函式。
- SFC 的順序應為 `<script setup>`、`<template>`、`<style scoped>`。
- 元件名稱使用 PascalCase（大駝峰式）；使用多單字名稱（例如 `UserCard` 而非 `Card`），以避免與原生元素衝突。
- 元件專屬的類型應就近放置，並將共用類型提升至 `types/` 模組中。

## 編譯器巨集 (Compiler Macros，無需匯入)
- `defineProps<T>()` — 從 TypeScript 介面/類型宣告有類型的 props，以獲得完整的推導。
- `withDefaults(defineProps<T>(), { ... })` — 提供 prop 預設值（或在 3.5+ 中使用響應式 props 解構搭配預設值）。
- `defineEmits<{ change: [id: number]; update: [value: string] }>()` — 宣告有類型的事件。
- `defineModel<T>()` (3.4+) — 在元件上實作 `v-model` 的規範方式；支援多個 model、參數和修飾符。
- `defineExpose({ ... })` — 明確暴露公共命令式 API；預設不暴露任何內容。
- `defineSlots<{ default(props: { item: T }): any }>()` — 為具名/作用域插槽定義類型。
- `defineOptions({ name, inheritAttrs })` — 在 `<script setup>` 內部設定元件選項。
- 絕不要直接變更 props — 應發出事件、使用 `defineModel` 或使用 `computed`/`ref` 衍生局部狀態。

## 響應式系統 (Reactivity System)
### 核心原語 (Core primitives)
- `ref()` 用於原始型別和單一可替換的參考；在 script 中透過 `.value` 存取（在 template 中會自動解包）。
- `reactive()` 用於深層響應式物件/集合；絕不要直接解構它（會破壞響應式） — 請使用 `toRefs()`/`toRef()`。
- `computed()` 用於衍生值；保持 getter 為純函式且無副作用。使用可寫入的 computed (`get`/`set`) 處理雙向衍生狀態。
- 只要是在「衍生」一個值而非執行副作用時，優先選擇 `computed` 而非 `watch`。

### 偵聽器 (Watchers)
- `watch(source, cb, options)` 用於明確的相依項；`watchEffect(cb)` 用於自動追蹤相依項。
- 謹慎使用偵聽器選項：`{ immediate: true }`、`{ deep: true }`、`{ once: true }` (3.4+) 以及當您需要先更新 DOM 時使用 `flush: 'post'`。
- 使用 `onCleanup`/`onWatcherCleanup` 回呼註冊清理函式，以取消過時的非同步工作（如防抖、fetch、監聽器）。
- 當手動偵聽器的生命週期超過其自然作用域時，應透過其回傳的控制代碼停止它。

### 進階響應式（有意識地使用）
- `shallowRef` / `shallowReactive` 用於大型或外部管理的資料，以跳過深層追蹤。
- `readonly()` 用於提供共用狀態的不可變視圖。
- `toRef` / `toRefs` 用於在解構時保持響應式；`toRaw`/`markRaw` 用於對非響應式物件（如類別實例、第三方客戶端）退出響應式。
- `effectScope()` 用於將相關副作用分組並統一處置（在組合式函式/函式庫中很有用）。
- `customRef` 用於防抖/節流或與儲存裝置綁定的 ref。

## 組合式函式 (Composables，可重複使用的邏輯)
- 提取有狀態、可重複使用的邏輯到 `composables/` 下的 `useXxx()` 函式中。
- 接受 ref 或 getter 作為輸入，並回傳 ref 或 computed；使用 `toValue()`/`MaybeRefOrGetter` 來規範化 ref 或普通值的輸入。
- 在組合式函式內部進行設定與銷毀（`onMounted`/`onUnmounted` 或 `tryOnScopeDispose`），確保呼叫者不會造成記憶體流失。
- 保持組合式函式在設定階段是同步的；將非同步操作暴露為回傳的函式。
- 善用 VueUse 滿足常見需求，而非重新實作（例如 `useStorage`、`useEventListener`、`useDebounceFn`）。

## 生命週期與副作用 (Lifecycle & Effects)
- 使用 `onMounted`、`onBeforeMount`、`onUpdated`、`onBeforeUnmount`、`onUnmounted`、`onActivated`/`onDeactivated`（配合 `<KeepAlive>`）以及 `onErrorCaptured`。
- 務必在 `onUnmounted` 中清理計時器、監聽器、觀察者和訂閱。
- 針對 SSR 應保護僅限瀏覽器的 API (`window`, `document`)；在 `onMounted` 中執行它們。

## 範本最佳實踐 (Template Best Practices)
- 始終在 `v-for` 上設定穩定且唯一的 `:key`；當項目會重新排序或變更時，絕不使用陣列索引作為 key。
- 絕不要在同一個元素上同時使用 `v-if` 和 `v-for` — 應透過 `computed` 先進行過濾。
- `v-show` 用於頻繁切換的元素；`v-if` 用於條件式掛載。
- 使用 `v-memo` 跳過昂貴靜態子樹的重新渲染，並使用 `v-once` 處理僅需渲染一次的內容。
- 一致地使用 `:` (v-bind) 和 `@` (v-on) 縮寫；使用 `<template>` 對節點進行分組，以避免不必要的包裝元素。
- 避免在範本中使用沉重的運算式 — 將它們移至 `computed` 或方法中。

## 插槽 (Slots)
- 使用具名插槽進行佈局擴充，使用作用域插槽 (`<slot :item="item" />` + `#default="{ item }"`) 向父元件暴露資料。
- 提供合理的預設插槽內容。
- 在適當情況下使用 `v-slot` (`#`) 縮寫和動態插槽名稱。

## 內建元件 (Built-in Components)
- `<Teleport to="body">` 用於必須脫離溢出/層疊上下文的互動視窗 (modals)、通知 (toasts) 和工具提示 (tooltips)。
- `<Suspense>` 配合 `#default` / `#fallback` 用於非同步設定和延遲載入元件；請搭配錯誤處理。
- `<Transition>` / `<TransitionGroup>` 用於進入/離開和列表動畫（在分組項目上設定 `:key`）。
- `<KeepAlive>`（配合 `include`/`exclude`/`max`）在切換時快取元件狀態；處理 `onActivated`/`onDeactivated`。
- `<component :is="...">` 用於動態元件；`defineAsyncComponent(() => import('...'))` 用於程式碼拆分/延遲載入，並可搭配載入中/錯誤元件。

## Provide / Inject (相依性注入)
- 使用 `InjectionKey<T>` (`Symbol`) 為注入定義類型以確保安全：`provide(key, value)` / `inject(key)`。
- 提供預設值或斷言其存在，以避免 `undefined`。
- 優先使用 `readonly()` 提供狀態，防止子元件直接修改；改為暴露明確的更新函式。
- 將注入用於橫切關注點 (cross-cutting concerns)；將 Pinia 用於全域共用狀態。

## 自定義指令與外掛程式 (Custom Directives & Plugins)
- 使用 `mounted`/`updated` 等掛鉤開發指令；保持它們專注於 DOM（例如 `v-focus`、`v-click-outside`）。
- 將全域設定（路由器、Pinia、i18n、UI 函式庫）封裝為外掛程式，透過 `app.use(...)` 呼叫；在 `main.ts` 中註冊全域配置。

## 使用 Pinia 進行狀態管理
- 將 Pinia 用於共用/跨元件狀態；元件專屬狀態應保持局部化（使用 `ref`/`reactive`）。
- 優先使用 **setup store**：`defineStore('user', () => { const user = ref(...); const isLoggedIn = computed(...); function login(){}; return { user, isLoggedIn, login } })`。
- 每個領域使用一個 store；將 action 用於非同步/副作用，並保持 getter 為純函式且同步。
- 使用 `storeToRefs()` 進行解構以保留響應式；使用 `$patch` 進行批次變更，`$reset` 還原狀態，以及 `$subscribe`/`$onAction` 處理橫切關注點。
- 正確處理 SSR 注入 (hydration)，並保持 store 為可序列化的。

## 使用 Vue Router 進行路由
- 使用延遲載入 `component: () => import('...')` 定義路由，以實現自動程式碼拆分。
- 使用導航守衛 (`beforeEach`、`beforeEnter`、`beforeRouteLeave`) 處理身分驗證和未儲存變更檢查；務必精確呼叫一次 `next()` 或回傳結果。
- 使用 `route.meta`（定義類型）處理每條路由的配置，如 `requiresAuth`。
- 透過 `useRoute()` 讀取參數/查詢，透過 `useRouter()` 進行導航；將 `route.params` 視為響應式的（偵聽它，不要快取它）。
- 配置 `scrollBehavior` 以實現可預測的捲動位置還原；在可用時啟用類型化路由。

## TypeScript 整合
- 透過泛型編譯器巨集定義 props/emits/slots，而非執行時的物件語法。
- 當推導過於狹窄時，明確定義 ref 的類型：`ref<User | null>(null)`。
- 使用 `useTemplateRef<HTMLInputElement>('input')` (3.5+) 或 `ref<HTMLInputElement | null>(null)` 定義範本 ref。
- 使用 `<script setup lang="ts" generic="T">` 建立泛型元件。
- 使用 `InjectionKey<T>` 為 provide/inject 定義類型；透過 Pinia store 的推導回傳值定義其類型。

## 樣式 (Styling)
- 預設使用 `<style scoped>`；有意識地使用 `:deep()`、`:slotted()` 和 `:global()` 選擇器。
- 在 `<style>` 中使用 `v-bind()` 根據響應式狀態驅動 CSS；優先選擇 CSS 自定義屬性 (variables) 進行主題設定。
- 在大型團隊中考慮使用 CSS Modules (`<style module>`) 為類別名稱進行隔離。

## 表單與驗證
- 使用 `v-model` 綁定輸入（自定義輸入則使用 `defineModel`）；使用修飾符 `.lazy`、`.number`、`.trim`。
- 對於非簡單表單，結合使用架構函式庫 (Zod/Yup) 與表單函式庫 (VeeValidate 或 FormKit)。
- 客戶端驗證僅為了 UX — 務必在伺服器端進行驗證與過濾。

## 錯誤處理
- 使用 `onErrorCaptured` 處理元件樹邊界，使用 `app.config.errorHandler` 作為全域掛鉤。
- 使用 `<Suspense>` + 錯誤回退方案包裝非同步/延遲載入邊界。
- 向使用者顯示友好的錯誤；將診斷資訊記錄到您的監控流水線中。

## 效能 (Performance)
- 程式碼拆分路由和重型元件 (`defineAsyncComponent`, 動態 `import()`)。
- 使用 `computed` 進行快取，使用 `v-memo`/`v-once` 處理靜態子樹，並使用 `shallowRef`/`shallowReactive` 處理大型資料集。
- 虛擬化長列表（例如 `vue-virtual-scroller`）；對大型資料進行分頁或視窗化。
- 避免不必要的深層響應式，並避免在範本中內嵌建立新的物件/陣列字面量。
- 在 3.5+ 中，考慮為 SSR 使用延遲注入策略，以減少可互動時間 (TTI)。

## SSR / 元框架 (Meta-frameworks)
- 除非有理由自行實作 SSR，否則優先選擇 Nuxt 進行 SSR/SSG/混合渲染。
- 保持程式碼為同構的 (isomorphic)：保護瀏覽器 API、避免跨請求的模組級共用可變狀態，並確保 store 是請求作用域的。
- 匹配伺服器端和客戶端的輸出，以防止注入不一致 (hydration mismatches)。

## 無障礙性 (Accessibility)
- 優先使用語義化 HTML；僅在填補真正缺口時才添加 ARIA。
- 確保完全的鍵盤可操作性和可見的焦點狀態。
- 管理路由變更及開啟/關閉對話框時的焦點（在互動視窗中擷取焦點）。
- 為僅含圖示的控制項提供具備無障礙名稱 (`aria-label`)；將標籤與輸入項關聯。

## 安全性 (Security)
- 絕不要使用 `v-html` 渲染不受信任的輸入；如果不可避免，請先進行過濾（例如使用 DOMPurify）。
- 避免從不受信任的來源使用動態的 `:is`/`:href`/`:src`；驗證 URL（封鎖 `javascript:` 方案）。
- 將秘密金鑰保留在伺服器端；僅有意識地暴露預期公開的、以 `VITE_` 為前綴的環境變數。
- 在應用程式層套用內容安全原則 (CSP) 和標準的 CSRF/XSS 防護。

## 測試 (Testing)
- 將組合式函式作為純函式進行單元測試；使用 Vue Test Utils / Testing Library 進行元件測試。
- 測試可觀察的行為和渲染輸出，而非內部實作細節。
- 使用 `createTestingPinia` 模擬 store；根據需要存根 (stub) 路由器和非同步邊界。
- 透過端對端測試 (Playwright 或 Cypress) 涵蓋關鍵的使用者旅程。

## 工具鏈 (Tooling)
- 使用 Vite 搭配官方 Vue 外掛程式；在 CI 中啟用 `vue-tsc` 進行類型檢查。
- 使用 ESLint (`eslint-plugin-vue`) 和 Prettier；啟用 Volar/Vue 官方延伸模組以獲得最佳開發體驗。
- 透過 `import.meta.env` 管理帶有 `VITE_` 前綴的環境變數。

## 應避免的反模式
- 在同一個程式碼庫中隨意混用 Options API 和 Composition API。
- 直接變更 props，或是在解構 `reactive()`/Pinia store 時不使用 `toRefs`/`storeToRefs`。
- 對於應使用 `computed` 的值使用了 `watch`。
- 在同一個元素上同時使用 `v-if` 和 `v-for`；使用陣列索引作為 `:key`。
- 在範本中編寫沉重的邏輯；在大型資料上使用無限制的深層響應式。
- 因跳過 `onUnmounted` 清理而導致計時器/監聽器洩漏。
- 透過 `v-html` 渲染不受信任的 HTML。
