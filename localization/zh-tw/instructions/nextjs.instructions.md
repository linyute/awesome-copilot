---
applyTo: '**'
---

# Next.js 給 LLM 的最佳實踐（2025）

_最後更新：2025 年 7 月_

本文件彙整最新且權威的 Next.js 應用程式建構、結構與維護最佳實踐，供 LLM 與開發者參考，以確保程式碼品質、可維護性與延展性。

---

## 1. 專案結構與組織

- **所有新專案請使用 `app/` 目錄（App Router）**，優先於舊版 `pages/` 目錄。
- **頂層資料夾：**
  - `app/` — 路由、版型、頁面與路由處理器
  - `public/` — 靜態資源（圖片、字型等）
  - `lib/` — 共用工具、API 客戶端與邏輯
  - `components/` — 可重用 UI 元件
  - `contexts/` — React context 提供者
  - `styles/` — 全域與模組化樣式表
  - `hooks/` — 自訂 React hooks
  - `types/` — TypeScript 型別定義
- **共置（Colocation）：** 檔案（元件、樣式、測試）請放在使用處附近，但避免過度巢狀。
- **路由分組：** 用括號（如 `(admin)`）分組路由，不影響 URL 路徑。
- **私有資料夾：** 以 `_` 前綴（如 `_internal`）表示不參與路由且為實作細節。

- **功能資料夾：** 大型應用可依功能分組（如 `app/dashboard/`、`app/auth/`）。
- **可選用 `src/`：** 所有原始碼可放在 `src/`，與設定檔分離。

## 2.1. 伺服端與用戶端元件整合（App Router）

**絕不可在伺服端元件中使用 `next/dynamic` 並設 `{ ssr: false }`。** 這不被支援，會造成建構或執行錯誤。

**正確做法：**
- 若需在伺服端元件中使用用戶端元件（如使用 hooks、瀏覽器 API 或僅用戶端函式庫），請：
  1. 將所有僅用戶端邏輯/UI 移至獨立用戶端元件（檔案頂部加 `'use client'`）。
  2. 直接在伺服端元件中匯入並使用該用戶端元件（不需 `next/dynamic`）。
  3. 若需組合多個用戶端元素（如含個人選單的導覽列），請建立一個包含所有元素的用戶端元件。

**範例：**

```tsx
// 伺服端元件
import DashboardNavbar from '@/components/DashboardNavbar';

export default async function DashboardPage() {
  // ...伺服端邏輯...
  return (
    <>
      <DashboardNavbar /> {/* 這是用戶端元件 */}
      {/* ...其餘伺服端渲染頁面... */}
    </>
  );
}
```

**原因：**
- 伺服端元件不可用僅用戶端功能或停用 SSR 的動態匯入。
- 用戶端元件可嵌入伺服端元件，但反之不可。

**總結：**
所有僅用戶端 UI 請移至用戶端元件，並直接在伺服端元件匯入。絕不可在伺服端元件用 `next/dynamic` 並設 `{ ssr: false }`。

---

## 2. 元件最佳實踐

- **元件類型：**
  - **伺服端元件**（預設）：用於資料擷取、重邏輯與非互動式 UI。
  - **用戶端元件：** 檔案頂部加 `'use client'`。用於互動、狀態或瀏覽器 API。
- **何時建立元件：**
  - UI 模式重複使用超過一次
  - 頁面某區塊複雜或自成一格
  - 有助於提升可讀性或可測試性
- **命名慣例：**
  - 元件檔案與匯出用 `PascalCase`（如 `UserCard.tsx`）
  - hooks 用 `camelCase`（如 `useUser.ts`）
  - 靜態資源用 `snake_case` 或 `kebab-case`（如 `logo_dark.svg`）
  - context 提供者命名為 `XyzProvider`（如 `ThemeProvider`）
- **檔案命名：**
  - 檔名與元件名稱一致
  - 單一匯出檔案請預設匯出元件
  - 多個相關元件用 `index.ts` barrel 檔
- **元件位置：**
  - 共用元件放在 `components/`
  - 路由專屬元件放在對應路由資料夾
- **Props：**
  - 用 TypeScript 介面定義 props
  - 優先明確型別與預設值
- **測試：**
  - 測試檔與元件共置（如 `UserCard.test.tsx`）

## 3. 命名慣例（一般）

- **資料夾：** `kebab-case`（如 `user-profile/`）
- **檔案：** 元件用 `PascalCase`，工具/hook 用 `camelCase`，靜態資源用 `kebab-case`
- **變數/函式：** `camelCase`
- **型別/介面：** `PascalCase`
- **常數：** `UPPER_SNAKE_CASE`

## 4. API 路由（Route Handlers）

- **除非需要極低延遲或地理分散，否則優先使用 API 路由而非 Edge Functions。**
- **位置：** API 路由放在 `app/api/`（如 `app/api/users/route.ts`）。
- **HTTP 方法：** 匯出以 HTTP 動詞命名的 async 函式（`GET`、`POST` 等）。
- **請求/回應：** 用 Web `Request` 與 `Response` API。進階功能用 `NextRequest`/`NextResponse`。
- **動態參數：** 用 `[param]` 建立動態 API 路由（如 `app/api/users/[id]/route.ts`）。
- **驗證：** 所有輸入都要驗證與消毒。可用 `zod` 或 `yup`。
- **錯誤處理：** 回傳正確 HTTP 狀態碼與錯誤訊息。
- **認證：** 以中介軟體或伺服端 session 檢查保護敏感路由。

## 5. 一般最佳實踐

- **TypeScript：** 所有程式碼皆用 TypeScript。`tsconfig.json` 啟用 `strict` 模式。
- **ESLint & Prettier：** 強制程式碼風格與檢查。用官方 Next.js ESLint 設定。
- **環境變數：** 機密請存於 `.env.local`，絕不可提交至版本控制。
- **測試：** 用 Jest、React Testing Library 或 Playwright。所有關鍵邏輯與元件都要寫測試。
- **無障礙：** 用語意化 HTML 與 ARIA 屬性。以螢幕閱讀器測試。
- **效能：**
  - 用內建圖片與字型最佳化。
  - 非同步資料用 Suspense 與載入狀態。
  - 避免大型用戶端 bundle，邏輯盡量放伺服端元件。
- **安全性：**
  - 所有使用者輸入都要消毒。
  - 正式環境用 HTTPS。
  - 設定安全 HTTP 標頭。
- **文件：**
  - 撰寫清楚的 README 與程式註解。
  - 公開 API 與元件都要有文件。

# 避免不必要的範例檔案

除非使用者明確要求展示、Storybook 或文件元件，否則請勿在主程式碼庫建立範例/展示檔（如 ModalExample.tsx）。預設保持儲存庫乾淨且以生產為主。

# 永遠使用最新文件與指南
- 每次 Next.js 相關請求，請先搜尋最新 Next.js 文件、指南與範例。
- 若有可用工具，請用下列工具取得最新文件：
  - `resolve_library_id` 解析套件/函式庫名稱
  - `get_library_docs` 取得最新文件
