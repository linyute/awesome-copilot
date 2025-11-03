---
description: 'Astro 針對內容驅動網站的開發標準與最佳實務'
applyTo: '**/*.astro, **/*.ts, **/*.js, **/*.md, **/*.mdx'
---

# Astro 開發指示

建立高品質 Astro 應用程式的指示，遵循內容驅動、伺服器優先的架構與現代最佳實務。

## 專案情境
- Astro 5.x 搭配 Islands Architecture 與 Content Layer API
- TypeScript 用於型別安全與透過自動生成型別提供更好的開發者體驗
- 內容驅動網站 (部落格、行銷、電子商務、文件)
- 伺服器優先渲染與選擇性客戶端水合
- 支援多種 UI 框架 (React、Vue、Svelte、Solid 等)
- 預設為靜態網站生成 (SSG)，可選伺服器端渲染 (SSR)
- 透過現代內容載入與建構優化提升效能

## 開發標準

### 架構
- 採用 Islands Architecture：預設伺服器渲染，選擇性水合
- 使用內容集合組織內容，以實現型別安全的 Markdown/MDX 管理
- 依功能或內容型別組織專案以實現延展性
- 使用基於元件的架構，清晰分離關注點
- 實作漸進式增強模式
- 遵循多頁應用程式 (MPA) 方法而非單頁應用程式 (SPA) 模式

### TypeScript 整合
- 使用建議的 v5.0 設定配置 `tsconfig.json`：
```json
{
  "extends": "astro/tsconfigs/base",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```
- 型別自動生成於 `.astro/types.d.ts` (取代 `src/env.d.ts`)
- 執行 `astro sync` 以生成/更新型別定義
- 使用 TypeScript 介面定義元件屬性
- 利用內容集合與 Content Layer API 的自動生成型別

### 元件設計
- 使用 `.astro` 元件處理靜態、伺服器渲染的內容
- 僅在需要互動性時才匯入框架元件 (React、Vue、Svelte)  
- 遵循 Astro 的元件腳本結構：前置碼在頂部，範本在下方
- 使用遵循 PascalCase 慣例的有意義的元件名稱
- 保持元件專注且可組合
- 實作適當的屬性驗證與預設值

### 內容集合

#### 現代內容層 API (v5.0+)
- 使用新的 Content Layer API 在 `src/content.config.ts` 中定義集合
- 使用內建載入器：`glob()` 用於基於檔案的內容，`file()` 用於單一檔案
- 透過新的載入系統提升效能與延展性
- Content Layer API 範例：
```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).optional()
  })
});
```

#### 舊版集合 (向後相容)
- 舊版 `type: 'content'` 集合仍透過自動 `glob()` 實作支援
- 透過新增明確的 `loader` 配置來遷移現有集合
- 使用 `getCollection()` 與 `getEntry()` 進行型別安全查詢
- 透過前置碼驗證與自動生成型別組織內容

### 檢視轉換與客戶端路由
- 在佈局頭部使用 `<ClientRouter />` 元件啟用 (v5.0 中從 `<ViewTransitions />` 更名)
- 從 `astro:transitions` 匯入：`import { ClientRouter } from 'astro:transitions'`
- 提供類似 SPA 的導航，無需完整頁面重新載入
- 使用 CSS 與 `view-transition-name` 自訂轉換動畫
- 透過持久性島嶼在頁面導航中保持狀態
- 使用 `transition:persist` 指令保留元件狀態

### 效能優化
- 預設為零 JavaScript - 僅在需要時新增互動性
- 策略性地使用客戶端指令 (`client:load`、`client:idle`、`client:visible`)
- 實作圖像與元件的延遲載入
- 透過 Astro 的內建優化優化靜態資產
- 利用 Content Layer API 加速內容載入與建構
- 透過避免不必要的客戶端 JavaScript 最小化套件大小

### 樣式
- 預設在 `.astro` 元件中使用作用域樣式
- 在需要時實作 CSS 預處理 (Sass、Less)
- 使用 CSS 自訂屬性進行主題與設計系統
- 遵循行動優先響應式設計原則
- 透過語義 HTML 與適當的 ARIA 屬性確保可存取性
- 考慮使用實用程式優先框架 (Tailwind CSS) 進行快速開發

### 客戶端互動性
- 使用框架元件 (React、Vue、Svelte) 處理互動元素
- 選擇正確的水合策略根據使用者互動模式
- 在框架邊界內實作狀態管理
- 仔細處理客戶端路由以保持 MPA 優勢
- 使用 Web 元件實現框架無關的互動性
- 使用儲存或自訂事件在島嶼之間共享狀態

### API 路由與 SSR
- 在 `src/pages/api/` 中建立 API 路由以實現動態功能
- 使用適當的 HTTP 方法與狀態碼
- 實作請求驗證與錯誤處理
- 啟用 SSR 模式以滿足動態內容需求
- 使用中介軟體進行驗證與請求處理
- 安全地處理環境變數

### SEO 與 Meta 管理
- 使用 Astro 的內建 SEO 元件與 meta 標籤管理
- 實作適當的 Open Graph 與 Twitter Card 中繼資料
- 自動生成網站地圖以實現更好的搜尋索引
- 使用語義 HTML 結構以實現更好的可存取性與 SEO
- 實作結構化資料 (JSON-LD) 以實現豐富的摘要
- 優化頁面標題與描述以供搜尋引擎使用

### 圖像優化
- 使用 Astro 的 `<Image />` 元件進行自動優化
- 實作具有適當 `srcset` 生成的響應式圖像
- 針對現代瀏覽器使用 WebP 與 AVIF 格式
- 延遲載入折疊下方的圖像
- 提供適當的替代文字以實現可存取性
- 在建構時優化圖像以獲得更好的效能

### 資料擷取
- 在元件前置碼中建構時擷取資料
- 使用動態匯入進行條件式資料載入
- 實作外部 API 呼叫的適當錯誤處理
- 在建構過程中快取昂貴的操作
- 使用 Astro 的內建 `fetch` 進行自動 TypeScript 推斷
- 適當地處理載入狀態與回退

### 建構與部署
- 透過 Astro 的內建優化優化靜態資產
- 配置靜態 (SSG) 或混合 (SSR) 渲染的部署
- 使用環境變數進行配置管理
- 啟用生產建構的壓縮與快取

## Key Astro v5.0 Updates

### Breaking Changes
- **ClientRouter**：使用 `<ClientRouter />` 而非 `<ViewTransitions />`
- **TypeScript**：自動生成型別在 `.astro/types.d.ts` 中 (執行 `astro sync`)
- **Content Layer API**：新的 `glob()` 與 `file()` 載入器以提升效能

### Migration Example
```typescript
// 現代內容層 API
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({ title: z.string(), pubDate: z.date() })
});
```

## 實作準則

### 開發工作流程
1. 使用 `npm create astro@latest` 搭配 TypeScript 範本
2. 使用適當的載入器配置 Content Layer API
3. 使用 `astro sync` 設定 TypeScript 以進行型別生成
4. 使用 Islands Architecture 建立佈局元件
5. 實作具有 SEO 與效能優化的內容頁面

### Astro 專屬最佳實務
- **Islands Architecture**：伺服器優先，透過客戶端指令選擇性水合
- **Content Layer API**：使用 `glob()` 與 `file()` 載入器進行可延展的內容管理
- **零 JavaScript**：預設為靜態渲染，僅在需要時新增互動性
- **檢視轉換**：透過 `<ClientRouter />` 啟用類似 SPA 的導航
- **型別安全**：利用內容集合的自動生成型別
- **效能**：透過內建圖像優化與最小客戶端套件進行優化
