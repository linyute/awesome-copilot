---
agent: 'agent'
tools: ['changes','search/codebase', 'edit/editFiles', 'findTestFiles', 'search', 'writeTest']
description: '為 Next.js + next-intl 應用程式新增語言'
---

這是一份使用 next-intl 進行國際化的 Next.js 專案新增語言指南。

- 此應用程式的 i18n 採用 next-intl。
- 所有翻譯檔案皆位於 `./messages` 目錄。
- UI 元件為 `src/components/language-toggle.tsx`。
- 路由與中介軟體設定檔案為：
  - `src/i18n/routing.ts`
  - `src/middleware.ts`

新增語言時：

- 請將 `en.json` 的所有內容完整翻譯為新語言。目標是讓新語言的 JSON 條目皆有完整翻譯。
- 在 `routing.ts` 與 `middleware.ts` 中新增路徑。
- 在 `language-toggle.tsx` 中新增語言選項。
