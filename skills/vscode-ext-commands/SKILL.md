---
name: vscode-ext-commands
description: '在 VS Code 延伸模組中貢獻指令的指南。標示命名慣例、可見性、在地化及其他相關屬性，遵循 VS Code 延伸模組開發指南、函式庫及最佳實務。'
---

# VS Code 延伸模組指令貢獻

此技能可協助您在 VS Code 延伸模組中貢獻指令

## 何時使用此技能

當您需要執行下列操作時，請使用此技能：
- 為您的 VS Code 延伸模組新增或更新指令

# 說明

VS Code 指令必須一律定義 `title`，無論其類別、可見性或位置為何。我們針對每種「類型」的指令使用一些模式，其特性說明如下：

* 一般指令：預設情況下，所有指令都應該可以在指令面板 (Command Palette) 中存取，必須定義 `category`，且除非該指令將在側邊欄中使用，否則不需要 `icon`。

* 側邊欄 (Side Bar) 指令：其名稱遵循特殊模式，以底線 (`_`) 開頭並以 `#sideBar` 結尾，例如 `_extensionId.someCommand#sideBar`。必須定義 `icon`，且可能具備也可能不具備某些 `enablement` 規則。側邊欄專屬指令不應在指令面板中顯示。將其貢獻至 `view/title` 或 `view/item/context` 時，我們必須告知其顯示的 *順序/位置 (order/position)*，且我們可以使用「相對於其他指令/按鈕」等詞彙，以便您識別要使用的正確 `group`。此外，為新指令定義顯示條件 (`when`) 也是一種良好的做法。
