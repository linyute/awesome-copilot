---
description: '建構 Next.js (App Router) 應用程式的最佳實作，包含現代快取、工具以及伺服器/用戶端界限 (對齊 Next.js 16.1.1)。'
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css'
---

# 供 LLM 使用的 Next.js 最佳實作 (2026)

_最後更新時間：2026 年 1 月 (對齊 Next.js 16.1.1)_

此文件摘要了建構、結構化與維護 Next.js 應用程式最新且具權威性的最佳實作。其目的是供 LLM 與開發者使用，以確保程式碼品質、可維護性與延展性。

---

## 1. 專案結構與組織 (Project Structure & Organization)

- **針對所有新專案使用 `app/` 目錄** (App Router)。優先使用它而非舊有的 `pages/` 目錄。
- **頂層資料夾：**
  - `app/` — 路由、佈局、頁面與路由處理常式 (Route handlers)
  - `public/` — 靜態資產 (圖片、字體等)
  - `lib/` — 共用公用程式、API 用戶端與邏輯
  - `components/` — 可重用的 UI 元件
  - `contexts/` — React Context 提供者
  - `styles/` — 全域與模組化樣式表
  - `hooks/` — 自訂 React Hooks
  - `types/` — TypeScript 型別定義
- **同地協作 (Colocation)：** 將檔案 (元件、樣式、測試) 放置在靠近使用它們的位置，但避免過深的巢狀結構。
- **路由群組 (Route Groups)：** 使用括號 (例如：`(admin)`) 將路由分組，而不影響 URL 路徑。
- **私有資料夾 (Private Folders)：** 使用 `_` 作為前置詞 (例如：`_internal`) 以排除在路由之外，並標示為實作細節。
- **功能資料夾 (Feature Folders)：** 對於大型應用程式，依功能進行分組 (例如：`app/dashboard/`, `app/auth/`)。
- **使用 `src/`** (選填)：將所有原始碼放置於 `src/` 中，以與設定檔區隔。

## 2. Next.js 16+ App Router 最佳實作

### 2.1. 伺服器與用戶端元件整合 (App Router)

**絕不要在伺服器元件 (Server Component) 內部使用具備 `{ ssr: false }` 的 `next/dynamic`。** 這是不受支援的，且會導致建構/執行階段錯誤。

**正確的做法：**

- 如果您需要在伺服器元件中使用用戶端元件 (例如：使用 Hooks、瀏覽器 API 或僅限用戶端使用的函式庫的元件)，您必須：
  1. 將所有僅限用戶端使用的邏輯/UI 移至專用的用戶端元件 (頂部帶有 `'use client'`)。
  2. 直接在伺服器元件中匯入並使用該用戶端元件 (不需要使用 `next/dynamic`)。
  3. 如果您需要組合多個僅限用戶端使用的元素 (例如：帶有個人資料下拉選單的導覽列)，請建立一個包含所有這些元素的單一用戶端元件。

**範例：**

```tsx
// 伺服器元件 (Server Component)
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

- 伺服器元件無法使用僅限用戶端使用的功能，或在停用 SSR 的情況下使用動態匯入。
- 用戶端元件可以渲染在伺服器元件內部，但反之則不行。

**摘要：**
務必將僅限用戶端使用的 UI 移至用戶端元件，並直接在您的伺服器元件中匯入。絕不要在伺服器元件中使用具備 `{ ssr: false }` 的 `next/dynamic`。

### 2.2. Next.js 16+ 非同步請求 API (App Router)

- **假設伺服器元件與路由處理常式中的請求相關資料是非同步的。** 在 Next.js 16 中，App Router 內的 `cookies()`、`headers()` 與 `draftMode()` 等 API 皆為非同步。
- **留意路由 Props：** 在伺服器元件中，`params` / `searchParams` 可能是 Promises。應優先使用 `await` 處理它們，而非將其視為一般物件。
- **避免意外觸發動態渲染：** 存取請求資料 (cookies/headers/searchParams) 會使路由轉向動態行為。請有意識地讀取它們，並在適當時將動態部分隔離在 `Suspense` 邊界之後。

---

## 3. 元件最佳實作 (Component Best Practices)

- **元件類別：**
  - **伺服器元件 (Server Components)** (預設)：用於資料獲取、重型邏輯與非互動式 UI。
  - **用戶端元件 (Client Components)**：在頂部加入 `'use client'`。用於互動性、狀態或瀏覽器 API。
- **何時建立元件：**
  - 如果某個 UI 模式被重用超過一次。
  - 如果頁面的某個區段過於複雜或具備獨立性。
  - 如果它能改善程式碼可讀性或可測試性。
- **命名規範：**
  - 元件檔案與匯出使用 `PascalCase` (例如：`UserCard.tsx`)。
  - Hooks 使用 `camelCase` (例如：`useUser.ts`)。
  - 靜態資產使用 `snake_case` 或 `kebab-case` (例如：`logo_dark.svg`)。
  - 將 Context 提供者命名為 `XyzProvider` (例如：`ThemeProvider`)。
- **檔案命名：**
  - 檔案名稱應與元件名稱一致。
  - 對於單一匯出的檔案，使用預設匯出 (default export) 該元件。
  - 對於多個相關元件，使用 `index.ts` 桶狀檔案 (barrel file)。
- **元件位置：**
  - 將共用元件放置於 `components/` 中。
  - 將路由專屬的元件放置在相關路由資料夾內。
- **Props：**
  - 針對 Props 使用 TypeScript 介面 (interfaces)。
  - 偏好明確的 Prop 型別與預設值。
- **測試：**
  - 將測試與元件放在同一處 (例如：`UserCard.test.tsx`)。

## 4. 命名規範 (一般)

- **資料夾：** `kebab-case` (例如：`user-profile/`)
- **檔案：** 元件使用 `PascalCase`，公用程式/Hooks 使用 `camelCase`，靜態資產使用 `kebab-case`
- **變數/函式：** `camelCase`
- **型別/介面：** `PascalCase`
- **常數：** `UPPER_SNAKE_CASE`

## 5. API 路由 (路由處理常式)

- **優先使用 API 路由而非 Edge Functions**，除非您需要極低延遲或地理分佈。
- **位置：** 將 API 路由放置於 `app/api/` 中 (例如：`app/api/users/route.ts`)。
- **HTTP 方法：** 匯出以 HTTP 動詞命名的非同步函式 (`GET`, `POST` 等)。
- **請求/回應：** 使用 Web `Request` 與 `Response` API。進階功能請使用 `NextRequest`/`NextResponse`。
- **動態區段：** 針對動態 API 路由使用 `[param]` (例如：`app/api/users/[id]/route.ts`)。
- **驗證：** 務必驗證與清理輸入。使用如 `zod` 或 `yup` 等函式庫。
- **錯誤處理：** 回傳適當的 HTTP 狀態碼與錯誤訊息。
- **驗證 (Authentication)：** 使用中介軟體 (middleware) 或伺服器端工作階段 (session) 檢查來保護敏感路由。

### 路由處理常式使用說明 (效能)

- **不要為了重用邏輯而從伺服器元件中呼叫您自己的路由處理常式** (例如：`fetch('/api/...')`)。應優先將共用邏輯擷取至模組中 (例如：`lib/`) 並直接呼叫，以避免額外的伺服器跳轉。

## 6. 一般最佳實作

- **TypeScript：** 針對所有程式碼使用 TypeScript。在 `tsconfig.json` 中啟用 `strict` 模式。
- **ESLint & Prettier：** 強制執行程式碼風格與 Linting。使用官方的 Next.js ESLint 設定。在 Next.js 16 中，建議透過 ESLint CLI 執行 ESLint (而非使用 `next lint`)。
- **環境變數：** 將秘密資訊儲存於 `.env.local`。切勿將秘密資訊提交至版本控制系統。
  - 在 Next.js 16 中，`serverRuntimeConfig` / `publicRuntimeConfig` 已被移除。請改用環境變數。
  - `NEXT_PUBLIC_` 變數會在 **建構階段被內嵌 (inlined)** (建構後更改它們不會影響已佈署的建構產物)。
  - 如果您確實在動態脈絡中需要執行階段評估環境變數，請遵循 Next.js 指引 (例如：在讀取 `process.env` 之前呼叫 `connection()`)。
- **測試：** 使用 Jest, React Testing Library 或 Playwright。針對所有關鍵邏輯與元件撰寫測試。
- **協助工具 (Accessibility)：** 使用語義化 HTML 與 ARIA 屬性。使用螢幕閱讀器進行測試。
- **效能：**
  - 使用內建的圖片與字體優化。
  - 優先使用 **快取元件 (Cache Components)** (`cacheComponents` + `use cache`) 而非舊有的快取模式。
  - 針對非同步資料使用 Suspense 與載入狀態 (loading states)。
  - 避免大型用戶端套件 (client bundles)；將大多數邏輯保留在伺服器元件中。
- **安全性：**
  - 清理所有使用者輸入。
  - 在正式環境中使用 HTTPS。
  - 設定安全的 HTTP 標頭。
  - 對於伺服器操作 (Server Actions) 與路由處理常式，優先使用伺服器端授權；永不信任用戶端輸入。
- **文件：**
  - 撰寫清晰的 README 與程式碼註釋。
  - 紀錄公開的 API 與元件。

## 7. 快取與重新驗證 (Next.js 16 快取元件)

- **在 App Router 中優先使用快取元件進行記憶化 (memoization)/快取。**
  - 透過 `cacheComponents: true` 在 `next.config.*` 中啟用。
  - 使用 **`use cache` 指令** 將元件/函式納入快取。
- **有意識地使用快取標記 (cache tagging) 與生命週期：**
  - 使用 `cacheTag(...)` 將快取結果與標記關聯。
  - 使用 `cacheLife(...)` 控制快取生命週期 (預設集或自訂設定檔)。
- **重新驗證指引：**
  - 在大多數情況下，偏好使用 `revalidateTag(tag, 'max')` (stale-while-revalidate)。
  - 單一參數形式的 `revalidateTag(tag)` 已過時/不建議使用。
  - 當您需要「讀取自己寫入的內容 (read-your-writes)」/ 立即一致性時，在 **伺服器操作 (Server Actions)** 內部使用 `updateTag(...)`。
- **避免在新程式碼中使用 `unstable_cache`**；將其視為舊有產物並遷移至快取元件。

## 8. 工具更新 (Next.js 16)

- **Turbopack 是預設的開發套件封裝工具 (dev bundler)。** 透過 `next.config.*` 中的頂層 `turbopack` 欄位進行設定 (不要使用已移除的 `experimental.turbo`)。
- **型別路由 (Typed routes)** 已透過 `typedRoutes` 穩定化 (需要 TypeScript)。

## 9. 避免不必要的範例檔案

除非使用者明確要求即時範例、Storybook 故事或明確的文件元件，否則不要在主程式碼庫中建立範例/展示檔案 (如 ModalExample.tsx)。預設情況下保持儲存庫整潔且專注於正式環境。

## 10. 務必使用最新的文件與指引

- 對於每個與 Next.js 相關的請求，首先搜尋最新版本的 Next.js 文件、指引與範例。
- 如果可用，請使用下列工具獲取與搜尋文件：
  - `resolve_library_id` 用於解析文件中的套件/函式庫名稱。
  - `get_library_docs` 用於獲取最新文件。

