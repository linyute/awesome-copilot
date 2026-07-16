---
description: 'Astro 7 開發標準與最佳實踐，適用於內容驅動的網站'
applyTo: '**/*.astro, **/*.ts, **/*.js, **/*.md, **/*.mdx'
---

# Astro 開發說明

建立高品質 Astro 應用程式的指引，遵循內容驅動、伺服器優先的架構與現代最佳實踐。

> [!NOTE]
> 本指南中的範例與 API 目標為 Astro 7.x。

## 專案背景
- Astro 7.x 搭配 Islands 架構與 Content Layer API
- 使用 TypeScript 以提升類型安全與更佳開發者體驗，並自動產生類型
- 內容驅動的網站（部落格、行銷、電子商務、文件）
- 伺服器優先渲染，搭配選擇性客戶端 hydration
- 支援多種 UI 函式庫（React、Vue、Svelte、Solid 等）
- 預設使用靜態網站生成（SSG），可選擇伺服器端渲染（SSR）

## 開發標準

### 架構
- 採用 Islands 架構：預設伺服器渲染，選擇性進行 hydrate
- 使用 Content Collections 組織內容，以類型安全管理 Markdown/MDX
- 依功能或內容類型規劃專案結構，以提升延展性
- 採用元件化架構，明確職責分離
- 實作漸進式增強模式
- 採取多頁面應用（MPA）方式，而非單頁面應用（SPA）

### TypeScript 整合
- 在 `tsconfig.json` 中擴充 Astro 的基礎設定：
```json
{
  "extends": "astro/tsconfigs/base",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```
- 類型會自動產生於 `.astro/types.d.ts`；變更 collections 或設定後執行 `astro sync`
- 使用 TypeScript 介面定義元件屬性
- 利用自動產生的類型支援 content collections 與 Content Layer API

### 元件設計
- 使用 `.astro` 元件呈現靜態、伺服器渲染內容
- 僅在需要互動時才匯入框架元件（React、Vue、Svelte）
- 遵循 Astro 元件腳本結構：前端資料放在最上方，模板在下方
- 使用具意義的元件名稱，遵循 PascalCase 命名慣例
- 保持元件聚焦且可組合
- 實作正確的屬性驗證與預設值
- 撰寫有效且完整閉合的 HTML：編譯器會在未關閉的標籤拋錯，且不會自動修正無效的巢狀（例如區塊元素置於 `<p>` 內）

### Content Collections
- 在 `src/content.config.ts` 中使用 Content Layer API 定義 collections
- 使用內建載入器：`glob()` 讀取檔案型別內容，`file()` 用於單一資料檔案
- 從 `astro/zod` 匯入 `z`（而非 `astro:content`），優先使用頂層 Zod 輔助函式，如 `z.email()`、`z.url()`
- 使用類型安全的 `getCollection()` 與 `getEntry()` 來查詢內容
- 範例 collection 定義：
```typescript
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

### 檢視轉場與客戶端路由
- 在版面 `<head>` 中加入 `<ClientRouter />` 元件以啟用
- 從 `astro:transitions` 匯入：`import { ClientRouter } from 'astro:transitions'`
- 提供類似 SPA 的導覽，無需完整頁面重新載入
- 使用 CSS 以及 view‑transition‑name 自訂轉場動畫
- 使用持久化 islands 維持頁面導覽間的狀態
- 使用 `transition:persist` 指令保留元件狀態

### 效能最佳化
- 預設不含 JavaScript，只在需要時加入互動
- 策略性使用客戶端指令（`client:load`、`client:idle`、`client:visible`）
- 為影像與元件實作懶載入
- 使用 Astro 內建的最佳化功能優化靜態資源
- 利用 Content Layer API 加速內容載入與建構
- 透過避免不必要的客戶端 JavaScript 來縮小 bundle 大小

### 樣式設計
- 預設在 `.astro` 元件中使用作用域樣式
- 需要時導入 CSS 前處理（Sass、Less）
- 使用 CSS 自訂屬性打造主題與設計系統
- 採用行動優先的響應式設計原則
- 以語意化 HTML 及正確的 ARIA 屬性確保無障礙
- 考慮使用實用程式優先框架（Tailwind CSS）加速開發
- Astro 預設使用 JSX 規則移除空白 (`compressHTML: 'jsx'`)，若需顯示空格，於行內元素間加上明確的 `{" "}`

### 客戶端互動性
- 使用框架元件（React、Vue、Svelte）實作互動元素
- 依使用者互動模式選擇適當的 hydration 策略
- 在框架範圍內實作狀態管理
- 小心處理客戶端路由，以維持 MPA 的好處
- 使用 Web Components 以免除框架限制的互動
- 透過 store 或自訂事件在 islands 之間共享狀態

### 伺服器 Islands
- 使用 `server:defer` 讓伺服器 island 按需渲染，且不阻塞頁面其余部分
- 透過 `slot="fallback"` 提供載入狀態的備援內容
- 需要配置 SSR 適配器（按需渲染）
- 範例：
```astro
---
import Avatar from '../components/Avatar.astro';
---
<Avatar server:defer>
  <div slot="fallback">Loading…</div>
</Avatar>
```

### Actions
- 在 `src/actions/index.ts` 中定義類型安全的伺服器函式，並優先使用它們，而非臨時 API 路由，處理變更與表單
- 使用 Zod schema 驗證輸入；設定 `accept: 'form'` 以處理 HTML 表單提交
- 從客戶端透過 `astro:actions` 模組呼叫 actions，並處理 `{ data, error }` 結果
- 範例：
```typescript
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  subscribe: defineAction({
    accept: 'form',
    input: z.object({ email: z.email() }),
    handler: async ({ email }) => {
      // persist the subscription
      return { success: true };
    },
  }),
};
```

### 工作階段
- 使用 `Astro.session`（`get`, `set`）讀寫伺服器端狀態，取代濫用 cookies
- 需要配置具備 session 儲存功能的 SSR 適配器
- 適用於購物車、快訊、以及其他不應存於客戶端的每位訪客資料

### API 路由與 SSR
- 在 `src/pages/api/` 建立 API 路由，以提供動態功能
- 使用正確的 HTTP 方法與狀態碼
- 實作請求驗證與錯誤處理
- 為動態內容需求啟用 SSR 模式
- 使用中介層處理驗證與請求流程
- 安全管理環境變數

### SEO 與 Meta 管理
- 使用 Astro 內建的 SEO 元件與 meta 標籤管理
- 實作正確的 Open Graph 與 Twitter Card 資訊
- 自動產生 Sitemap，以提升搜尋引擎索引
- 採用語意化 HTML 結構，提升無障礙與 SEO
- 使用結構化資料（JSON‑LD）提供豐富摘要
- 為搜尋引擎最佳化頁面標題與描述

### 影像最佳化
- 使用 Astro 的 `<Image />` 元件自動最佳化影像
- 透過正確的 srcset 產生實作響應式影像
- 使用 WebP 與 AVIF 格式以支援現代瀏覽器
- 在頁面折疊以下的影像採取懶載入
- 為無障礙提供適當的 alt 文字
- 在建構階段最佳化影像，以提升效能

### 資料取得
- 在元件 frontmatter 於建構時取得資料
- 使用動態匯入以條件式載入資料
- 為外部 API 呼叫實作正確的錯誤處理
- 在建構過程中快取高成本操作
- 使用 Astro 內建的 fetch，搭配自動 TypeScript 推斷
- 適當處理載入狀態與備援方案
