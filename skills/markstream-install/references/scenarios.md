# 安裝情境 (Install Scenarios)

## 套件選取

| 主控應用程式 | 套件 |
|----------|---------|
| Vue 3 / Nuxt 3 或 4 | `markstream-vue` |
| Vue 2.6 | `markstream-vue2` 加上 `@vue/composition-api`；在掛載應用程式前註冊外掛程式 |
| Vue 2.7 | `markstream-vue2`；使用 Vue 內建的 Composition API 且不要安裝 `@vue/composition-api` |
| React 18+ / Next.js | `markstream-react` |
| Angular 20+ | `markstream-angular` |
| Svelte 5 | `markstream-svelte` |

## 對等項選取

| 功能 | 對等項 | 受支援的套件 | 啟用方式 |
|---------|------|--------------------|------------|
| 輕量級醒目提示程式碼區塊 | `stream-markdown` | `markstream-vue`, `markstream-vue2`, `markstream-react` | 將套件的 `MarkdownCodeBlockNode` 設定為 `code_block` 覆寫 |
| 增強的程式碼區塊與檔案/Diff 介面 | `stream-diffs` | `markstream-vue` | 安裝以取得複製、預覽、展開、語法醒目提示和檔案/Diff 功能 |
| Monaco 支援的程式碼區塊 | `stream-monaco` | 所有架構套件 | 僅在需要 Monaco 互動時安裝 |
| Mermaid 圖表 | `mermaid` | 所有架構套件 | 在轉譯 Mermaid 圍欄時安裝 |
| D2 圖表 | `@terrastruct/d2` | 所有架構套件 | 在轉譯 D2 圍欄時安裝 |
| 資訊圖表區塊 | `@antv/infographic` | 所有架構套件 | 在轉譯資訊圖表圍欄時安裝 |
| KaTeX 數學式 | `katex` | 所有架構套件 | 在轉譯數學式時安裝並載入 KaTeX CSS |

## CSS 檢查清單

- 先載入重設 (reset) 樣式。
- 在重設之後載入特定於架構的 Markstream CSS。
- 在 Tailwind 或 UnoCSS 專案中，使用 `@import '...' layer(components)`。
- 啟用數學式時匯入 KaTeX CSS。
- 直接轉譯獨立節點元件時，使用相關套件的根類別（例如 `.markstream-vue`、`.markstream-react` 或 `.markstream-svelte`）將其包裝。

## 輸入選擇

- `content`：靜態文件、低頻更新以及大多數 SSE 或權杖串流聊天介面。
- 具有內建平滑串流的 `content`：可見輸出應獨立於原始區塊節奏進行調節的不規則 AI 串流。
  - `smoothStreaming="auto"` 或 `smooth-streaming="auto"` 是預設值。
  - 當 `typewriter=true` 或 `maxLiveNodes <= 0` / `max-live-nodes <= 0` 時啟用自動調節。
  - `typewriter` 控制游標，預設為 `false`。
  - `fade` 控制節點進入與串流文字淡入效果。
- `nodes` 加上 `final`：worker 預先剖析的內容、共用 AST 存放區、自訂 AST 轉換，或其他層已擁有剖析邏輯的情況。
