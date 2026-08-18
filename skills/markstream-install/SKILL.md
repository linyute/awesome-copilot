---
name: 'markstream-install'
description: '為 Vue、React、Svelte、Angular、Nuxt 和 Vue 2 應用程式安裝與設定 Markstream 串流 Markdown 轉譯器。用於套件選取、最低限度的對等相依性、CSS 順序、SSR 邊界、串流模式與轉譯器設定。'
license: 'MIT'
compatibility: '使用 Vue 3、Nuxt 3/4、Vue 2.6/2.7、React 18+、Next.js、Angular 20+ 或 Svelte 5 的 JavaScript 或 TypeScript 前端專案。'
metadata:
  source: 'https://github.com/Simon-He95/markstream-vue'
  documentation: 'https://markstream.simonhe.me/'
---

# Markstream 安裝 (Markstream Install)

將適當的 [Markstream](https://github.com/Simon-He95/markstream-vue) 套件整合到現有應用程式中，無需安裝不必要的選用相依性或削弱其安全性預設值。

在選取套件或對等項之前，請先閱讀 [references/scenarios.md](references/scenarios.md)。

## 何時使用

當使用者要求執行以下操作時使用此技能：

- 為 AI 聊天或文件介面新增串流 Markdown 轉譯；
- 在 Vue、Nuxt、React、Next.js、Svelte、Angular 或 Vue 2 中安裝 Markstream；
- 修復損壞的 Markstream 安裝、遺失的樣式或 SSR 失敗；
- 使用 Markstream 取代其他 Markdown 轉譯器；
- 在靜態、平滑串流與外部剖析的 AST 輸入之間進行選擇。

## 工作流程

### 1. 檢查主控應用程式

在變更相依性之前，請檢查：

- `package.json` 中的架構與版本；
- 套件管理員 lockfile；
- 應用程式是否使用 SSR；
- 重設 (reset)、Tailwind、UnoCSS 或設計系統樣式；
- 所需的選用功能：程式碼醒目提示、增強的檔案/Diff 介面、Monaco、Mermaid、D2、資訊圖表區塊或 KaTeX。

不要僅僅因為來源存放庫名為 `markstream-vue` 就假設 Vue 套件是正確的。從情境表中選取特定於架構的套件。

### 2. 安裝最小相依性集合

恰好安裝一個架構套件。僅在請求的 UI 使用其功能時才新增選用的對等項。

範例：

```bash
npm install markstream-vue
npm install markstream-react
npm install markstream-svelte
npm install markstream-angular
npm install markstream-vue2
```

保留存放庫現有的套件管理員。請勿搶先安裝每個選用的對等項。

### 3. 依正確順序連結樣式

在 Markstream 樣式之前匯入應用程式重設 (resets)。明確匯入套件 CSS；不要依賴元件匯入來注入它。

對於 Tailwind 或 UnoCSS，在元件層中使用相關的套件子路徑：

```css
@import 'markstream-vue/index.css' layer(components);
```

針對 React、Svelte、Angular 或 Vue 2 使用相符的套件名稱。如果啟用了數學轉譯，還要匯入：

```css
@import 'katex/dist/katex.min.css';
```

Vue CLI 4 和其他基於 Webpack 4 的 Vue 2 應用程式無法解析套件匯出對應 (export maps)。在這些專案中，直接匯入已發佈的檔案：

```ts
import 'markstream-vue2/dist/index.css'
```

### 4. 新增最小可運作轉譯器

對於靜態文件和大多數串流聊天介面，優先使用 `content`。Markstream 內建的平滑串流可以調節不規則的權杖傳遞速度，而無需主控端維護 AST。

對於 Vue 3 聊天介面，從以下內容開始：

```vue
<MarkdownRender
  mode="chat"
  :content="markdown"
  :final="false"
  smooth-streaming="auto"
  :fade="false"
  typewriter
/>
```

對於已完成的聊天歷史記錄，保持相同的轉譯器模式並關閉調節：

```vue
<MarkdownRender
  mode="chat"
  :content="markdown"
  :final="true"
  :smooth-streaming="false"
  :fade="true"
  :typewriter="false"
/>
```

在 React、Svelte 和 Angular 中，使用等效的 camelCase 或架構繫結語法。在串流時保持 `smoothStreaming="auto"`、`fade=false` 和 `typewriter=true`；對於已完成的歷史記錄使用 `smoothStreaming=false` 和 `typewriter=false`。

僅在 worker、共用 AST 存放區、自訂轉換或另一個應用程式層已擁有剖析邏輯時，才使用 `nodes` 加上 `final`。

### 5. 處理特定於架構的邊界

- 在 Nuxt 中，將僅限瀏覽器的選用對等項保留在用戶端邊界之後。
- 在 Next.js 中，針對即時 SSE 或 WebSocket 串流，在 `'use client'` 元件內部使用根目錄 `markstream-react` 項目。針對具有融合 (hydration) 的 SSR 優先 HTML 使用 `markstream-react/next`，或針對僅伺服器端轉譯使用 `markstream-react/server`。
- 僅在 Svelte 5 中使用 `markstream-svelte`。
- 確認 Angular 應用程式符合當前的 `markstream-angular` 版本需求。
- 在 Vue 3 中，將 `mode="chat"` 用於 AI 聊天，將 `mode="docs"` 用於豐富文件，將 `mode="minimal"` 用於輕量級非聊天介面。
- 對於長篇 Vue 3 對話或現有的訊息虛擬化工具，在新增第二個虛擬化工具之前請查閱 Markstream 效能指南。

### 6. 保留安全預設值

HTML 原則預設為 `safe`，且 Mermaid 使用嚴格模式。除非使用者明確指出需要它的受信任舊版介面，否則請勿放寬任一設定。將任何例外狀況的範圍限定在該介面。

### 7. 驗證

執行最小的相關建構、型別檢查或測試指令。確認：

1. 選取的套件與架構相符；
2. 僅新增了請求的選用對等項；
3. 樣式在重設之後載入；
4. SSR 頁面不會在伺服器上評估僅限瀏覽器的對等項；
5. 靜態內容和至少一次增量更新能夠正確轉譯。

回報選取的套件、新增的對等項、CSS 位置、串流輸入選擇和驗證指令。

## 官方參考資料

- [安裝 (Installation)](https://markstream.simonhe.me/guide/installation)
- [AI 聊天與串流 (AI chat and streaming)](https://markstream.simonhe.me/guide/ai-chat-streaming)
- [效能 (Performance)](https://markstream.simonhe.me/guide/performance)
- [疑難排解 (Troubleshooting)](https://markstream.simonhe.me/guide/troubleshooting)
- [元件覆寫 (Component overrides)](https://markstream.simonhe.me/guide/component-overrides)
