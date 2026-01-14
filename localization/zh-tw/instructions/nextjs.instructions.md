---
description: "使用現代快取、工具以及伺服器/用戶端邊界（與 Next.js 16.1.1 對齊）建構 Next.js (App Router) 應用程式的最佳實務。"
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css'
---

# LLM 的 Next.js 最佳實務 (2026)

_最後更新日期：2026 年 1 月（與 Next.js 16.1.1 對齊）_

本文件總結了建構、組織和維護 Next.js 應用程式最新且具權威性的最佳實務。旨在供 LLM 和開發人員使用，以確保程式碼品質、可維護性和延展性。

---

## 1. 專案結構與組織

- **使用 `app/` 目錄** (App Router) 處理所有新專案。優先於舊有的 `pages/` 目錄。
- **頂層資料夾：**
  - `app/` — 路由、版面配置 (layouts)、頁面和路由處理常式 (route handlers)
  - `public/` — 靜態資產（圖片、字體等）
  - `lib/` — 共用公用程式、API 用戶端和邏輯
  - `components/` — 可重複使用的 UI 元件
  - `contexts/` — React Context 提供者
  - `styles/` — 全域和模組化樣式表
  - `hooks/` — 自訂 React hooks
  - `types/` — TypeScript 型別定義
- **同地協作 (Colocation)：** 將檔案（元件、樣式、測試）放置在靠近使用位置的地方，但避免過深的巢狀結構。
- **路由群組：** 使用括號（例如：`(admin)`）將路由分組，而不影響 URL 路徑。
- **私有資料夾：** 以 `_` 為前綴（例如：`_internal`）以退出路由系統並表示實作細節。

- **功能資料夾：** 對於大型應用程式，按功能分組（例如：`app/dashboard/`、`app/auth/`）。
- **使用 `src/`**（選填）：將所有原始程式碼放在 `src/` 中，以便與組態檔案分開。

## 2.1. 伺服器與用戶端元件整合 (App Router)

**切勿在伺服器元件 (Server Component) 內部使用帶有 `{ ssr: false }` 的 `next/dynamic`。** 這麼做是不受支援的，並會導致建構或執行階段錯誤。

**正確方法：**

- 如果你需要在伺服器元件內部使用用戶端元件 (Client Component)（例如：使用 hooks、瀏覽器 API 或僅限用戶端程式庫的元件），你必須：
  1. 將所有僅限用戶端的邏輯/UI 移至專用的用戶端元件中（在頂部加上 `'use client'`）。
  2. 直接在伺服器元件中匯入並使用該用戶端元件（不需要使用 `next/dynamic`）。
  3. 如果你需要組合多個僅限用戶端的元素（例如：帶有個人資料下拉選單的導覽列），請建立一個包含所有這些元素的單一用戶端元件。

**範例：**

```tsx
// 伺服器元件
import DashboardNavbar from "@/components/DashboardNavbar";

export default async function DashboardPage() {
  // ...伺服器邏輯...
  return (
    <>
      <DashboardNavbar /> {/* 這是一個用戶端元件 */}
      {/* ...頁面的其餘伺服器渲染部分... */}
    </>
  );
}
```

**原因：**

- 伺服器元件無法使用僅限用戶端的功能，或在停用 SSR 的情況下使用動態匯入。
- 用戶端元件可以在伺服器元件內部渲染，但反之則不行。

**總結：**
務必將僅限用戶端的 UI 移至用戶端元件中，並直接在你的伺服器元件中匯入它。切勿在伺服器元件中使用帶有 `{ ssr: false }` 的 `next/dynamic`。

## 2.2. Next.js 16+ 非同步請求 API (App Router)

- **假設伺服器元件和路由處理常式中的請求繫結資料是非同步的。** 在 Next.js 16 中，App Router 中的 `cookies()`、`headers()` 和 `draftMode()` 等 API 是非同步的。
- **留意路由 Props：** 在伺服器元件中，`params` / `searchParams` 可能是 Promises。應優先使用 `await` 處理它們，而不是將它們視為一般物件。
- **避免意外的動態渲染：** 存取請求資料（cookies/headers/searchParams）會使路由進入動態行為。應有意識地讀取它們，並在適當時將動態部分隔離在 `Suspense` 邊界後。

---

## 2. 元件最佳實務

- **元件類型：**
  - **伺服器元件** (預設)：用於資料擷取、重度邏輯和非互動式 UI。
  - **用戶端元件**：在頂部加上 `'use client'`。用於互動、狀態或瀏覽器 API。
- **何時建立元件：**
  - 如果 UI 模式被重複使用超過一次。
  - 如果頁面的某個部分很複雜或自成一體。
  - 如果它可以提高可讀性或可測試性。
- **命名慣例：**
  - 元件檔案和匯出使用 `PascalCase`（例如：`UserCard.tsx`）。
  - Hooks 使用 `camelCase`（例如：`useUser.ts`）。
  - 靜態資產使用 `snake_case` 或 `kebab-case`（例如：`logo_dark.svg`）。
  - 將 Context 提供者命名為 `XyzProvider`（例如：`ThemeProvider`）。
- **檔案命名：**
  - 檔案名稱與元件名稱一致。
  - 對於單一匯出的檔案，預設匯出 (default export) 該元件。
  - 對於多個相關元件，使用 `index.ts` 桶狀檔案 (barrel file)。
- **元件位置：**
  - 將共用元件放在 `components/`。
  - 將特定於路由的元件放在相關的路由資料夾中。
- **Props：**
  - 為 props 使用 TypeScript 介面 (interfaces)。
  - 優先使用明確的 prop 型別和預設值。
- **測試：**
  - 將測試與元件同地協作（例如：`UserCard.test.tsx`）。

## 3. 命名慣例 (通用)

- **資料夾：** `kebab-case`（例如：`user-profile/`）
- **檔案：** 元件使用 `PascalCase`，公用程式/hooks 使用 `camelCase`，靜態資產使用 `kebab-case`
- **變數/函式：** `camelCase`
- **型別/介面：** `PascalCase`
- **常數：** `UPPER_SNAKE_CASE`

## 4. API 路由 (路由處理常式)

- **優先使用 API 路由而非 Edge Functions**，除非你需要極低延遲或地理分佈。
- **位置：** 將 API 路由放在 `app/api/`（例如：`app/api/users/route.ts`）。
- **HTTP 方法：** 匯出以 HTTP 動詞（`GET`、`POST` 等）命名的非同步函式。
- **請求/回應：** 使用 Web `Request` 和 `Response` API。對於進階功能使用 `NextRequest`/`NextResponse`。
- **動態區段：** 為動態 API 路由使用 `[param]`（例如：`app/api/users/[id]/route.ts`）。
- **驗證：** 務必驗證並清理輸入。使用 `zod` 或 `yup` 等程式庫。
- **錯誤處理：** 回傳適當的 HTTP 狀態碼和錯誤訊息。
- **身分驗證：** 使用中介軟體 (middleware) 或伺服器端對話 (session) 檢查來保護敏感路由。

### 路由處理常式使用說明 (效能)

- **不要從伺服器元件中呼叫你自己的路由處理常式**（例如：`fetch('/api/...')`）只為了重複使用邏輯。應優先將共用邏輯擷取到模組中（例如：`lib/`）並直接呼叫，以避免額外的伺服器跳轉。

## 5. 一般最佳實務

- **TypeScript：** 對所有程式碼使用 TypeScript。在 `tsconfig.json` 中啟用 `strict` 模式。
- **ESLint & Prettier：** 強制執行程式碼風格和 linting。使用官方的 Next.js ESLint 組態。在 Next.js 16 中，建議透過 ESLint CLI 執行 ESLint（而非 `next lint`）。
- **環境變數：** 將祕密資訊儲存在 `.env.local` 中。切勿將祕密資訊提交到版本控制系統。
  - 在 Next.js 16 中，`serverRuntimeConfig` / `publicRuntimeConfig` 已移除。請改用環境變數。
  - `NEXT_PUBLIC_` 變數會在**建構時內嵌**（建構後變更它們不會影響已部署的建構版本）。
  - 如果你確實需要在動態內容中進行環境變數的執行階段評估，請遵循 Next.js 指引（例如：在讀取 `process.env` 之前呼叫 `connection()`）。
- **測試：** 使用 Jest、React Testing Library 或 Playwright。為所有關鍵邏輯和元件撰寫測試。
- **協助工具 (Accessibility)：** 使用語義化的 HTML 和 ARIA 屬性。使用螢幕閱讀器進行測試。
- **效能：**
  - 使用內建的圖片 (Image) 和字體 (Font) 最佳化。
  - 優先使用 **Cache 元件** (`cacheComponents` + `use cache`)，而非舊有的快取模式。
  - 為非同步資料使用 Suspense 和載入狀態 (loading states)。
  - 避免大型用戶端組合包 (bundles)；將大部分邏輯保留在伺服器元件中。
- **安全性：**
  - 清理所有使用者輸入。
  - 在生產環境中使用 HTTPS。
  - 設定安全的 HTTP 標頭。
  - 伺服器動作 (Server Actions) 和路由處理常式應優先使用伺服器端授權；切勿信任用戶端輸入。
- **文件：**
  - 撰寫清晰的 README 和程式碼註釋。
  - 記錄公開 API 和元件。

## 6. 快取與重新驗證 (Next.js 16 Cache 元件)

- **在 App Router 中優先使用 Cache 元件進行 memoization/快取。**
  - 透過 `cacheComponents: true` 在 `next.config.*` 中啟用。
  - 使用 **`use cache` 指令** 將元件/函式納入快取。
- **有意識地使用快取標記 (cache tagging) 和生命週期：**
  - 使用 `cacheTag(...)` 將快取結果與標記關聯。
  - 使用 `cacheLife(...)` 控制快取生命週期（預設設定或自訂組態檔）。
- **重新驗證指引：**
  - 在大多數情況下，優先使用 `revalidateTag(tag, 'max')` (stale-while-revalidate)。
  - 單一引數形式 `revalidateTag(tag)` 為舊有/已過時用法。
  - 當你需要「讀取自撰內容」(read-your-writes) / 立即一致性時，在**伺服器動作**內部使用 `updateTag(...)`。
- **避免對新程式碼使用 `unstable_cache`**；將其視為舊有功能並遷移至 Cache 元件。

## 7. 工具更新 (Next.js 16)

- **Turbopack 是預設的開發建構工具。** 透過 `next.config.*` 中的頂層 `turbopack` 欄位進行組態（不要使用已移除的 `experimental.turbo`）。
- **型別化路由 (Typed routes)** 已透過 `typedRoutes` 穩定（需要 TypeScript）。

# 避免不必要的範例檔案

除非使用者明確要求即時範例、Storybook 故事或明確的文件元件，否則請勿在主程式碼庫中建立範例/示範檔案（例如 `ModalExample.tsx`）。預設情況下，請保持存放庫乾淨且專注於生產環境。

# 務必使用最新文件和指南

- 對於每個 Next.js 相關的請求，首先搜尋最新的 Next.js 文件、指南和範例。
- 如果可用，使用以下工具來擷取和搜尋文件：
  - `resolve_library_id`：在文件中解析套件/函式庫名稱。
  - `get_library_docs`：獲取最新的文件。
