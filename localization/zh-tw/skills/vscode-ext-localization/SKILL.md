---
name: vscode-ext-localization
description: 'VS Code 延伸模組正確在地化的指南，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。'
---

# VS Code 延伸模組在地化

此技能可協助您在地化 VS Code 延伸模組的各個面向

## 何時使用此技能

當您需要執行下列操作時，請使用此技能：
- 在地化新建立或現有的貢獻組態 (設定)、指令、功能表、檢視或逐步解說 (walkthroughs)
- 在地化延伸模組原始程式碼中包含且顯示給終端使用者的全新或現有訊息或其他字串資源

# 說明

VS Code 在地化由三種不同的方法組成，具體取決於正在在地化的資源。當建立或更新新的可在地化資源時，必須建立/更新所有目前可用語言的對應在地化內容。

1. 在 `package.json` 中定義的組態，如設定、指令、功能表、檢視、ViewsWelcome、逐步解說標題和說明。
  -> 專屬的 `package.nls.LANGID.json` 檔案，例如巴西葡萄牙語 (`pt-br`) 在地化的 `package.nls.pt-br.json`
2. 逐步解說內容 (定義在各自的 `Markdown` 檔案中)
  -> 專屬的 `Markdown` 檔案，例如巴西葡萄牙語在地化的 `walkthrough/someStep.pt-br.md`
3. 位於延伸模組原始程式碼 (JavaScript 或 TypeScript 檔案) 中的訊息和字串
  -> 專屬的 `bundle.l10n.pt-br.json`，用於巴西葡萄牙語在地化
