# 來源與檢查途徑

建構此技能所使用的來源快照：2026-09-13。

macOS 27 文件、SDK 符號與 Figma 套件可能會變更。在提出與發布關鍵或搶鮮版（beta）敏感的主張前，請重新整理即時來源。

## 權威規則

- 使用 Apple 產品頁面、Apple 開發者文件、Human Interface Guidelines、Apple 發布說明與 Apple WWDC 講次作為主要來源。
- 使用 Apple 官方 Figma 社群清單建立套件出處。
- 重複複製的 Figma 設計檔案是工作複本，並非獨立的出處證明。
- 僅使用第三方文章探索主要來源或了解迴響。
- 若 Apple 來源與套件意見分歧，優先採用當前記載的平台行為並註明差異。
- 除非產品明確需要固定的自訂設計權杖（token），否則不要將 Figma 數值引用為程式碼常數。

## Apple macOS 27 與發布來源

- macOS 27 Golden Gate: https://www.apple.com/os/macos/
- macOS 27 發布說明: https://developer.apple.com/documentation/macos-release-notes/macos-27-release-notes
- macOS 開發者概覽: https://developer.apple.com/macos/
- macOS 新功能: https://developer.apple.com/macos/whats-new/
- 宣布 macOS 27 設計套件的 Apple Developer 新聞: https://developer.apple.com/news/?id=e2lxw9l1
- Apple Design Resources: https://developer.apple.com/design/resources/
- SF Symbols: https://developer.apple.com/sf-symbols/

## Liquid Glass 指引

- Liquid Glass 概覽: https://developer.apple.com/documentation/technologyoverviews/liquid-glass
- 採用 Liquid Glass: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- 將 Liquid Glass 套用至自訂 SwiftUI 檢視: https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views
- `glassEffect(_:in:)`: https://developer.apple.com/documentation/swiftui/view/glasseffect(_:in:)
- `GlassEffectContainer`: https://developer.apple.com/documentation/swiftui/glasseffectcontainer
- `Glass.interactive(_:)`: https://developer.apple.com/documentation/swiftui/glass/interactive(_:)
- `glassEffectUnion(id:namespace:)`: https://developer.apple.com/documentation/swiftui/view/glasseffectunion(id:namespace:)
- `GlassButtonStyle`: https://developer.apple.com/documentation/swiftui/glassbuttonstyle
- 使用 Liquid Glass 的 Landmarks 範例: https://developer.apple.com/documentation/swiftui/landmarks-building-an-app-with-liquid-glass

## Human Interface Guidelines

- HIG 根目錄: https://developer.apple.com/design/human-interface-guidelines
- 為 macOS 設計: https://developer.apple.com/design/human-interface-guidelines/designing-for-macos
- 側邊欄: https://developer.apple.com/design/human-interface-guidelines/sidebars
- 工具列: https://developer.apple.com/design/human-interface-guidelines/toolbars
- 視窗: https://developer.apple.com/design/human-interface-guidelines/windows
- 材質: https://developer.apple.com/design/human-interface-guidelines/materials
- 色彩: https://developer.apple.com/design/human-interface-guidelines/color
- 排版: https://developer.apple.com/design/human-interface-guidelines/typography
- 元件: https://developer.apple.com/design/human-interface-guidelines/components
- 功能表列: https://developer.apple.com/design/human-interface-guidelines/the-menu-bar
- 呈現方式: https://developer.apple.com/design/human-interface-guidelines/presentation

## SwiftUI 與 AppKit 實作來源

- SwiftUI 架構: https://developer.apple.com/documentation/swiftui
- `NavigationSplitView`: https://developer.apple.com/documentation/swiftui/navigationsplitview
- 新增搜尋: https://developer.apple.com/documentation/swiftui/adding-a-search-interface-to-your-app
- `ToolbarItemPlacement`: https://developer.apple.com/documentation/swiftui/toolbaritemplacement
- 自訂 macOS 視窗樣式與還原: https://developer.apple.com/documentation/swiftui/customizing-window-styles-and-state-restoration-behavior-in-macos
- `backgroundExtensionEffect()`: https://developer.apple.com/documentation/swiftui/view/backgroundextensioneffect()
- 使用 SwiftUI 建構與自訂功能表列: https://developer.apple.com/documentation/swiftui/building-and-customizing-the-menu-bar-with-swiftui
- AppKit `NSGlassEffectView`: https://developer.apple.com/documentation/appkit/nsglasseffectview
- AppKit 檢視與控制項: https://developer.apple.com/documentation/appkit/views-and-controls
- 減少透明度訊號: https://developer.apple.com/documentation/appkit/nsworkspace/accessibilitydisplayshouldreducetransparency

## WWDC 講次

- WWDC25 — 認識 Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- WWDC25 — 深入了解新設計系統: https://developer.apple.com/videos/play/wwdc2025/356/
- WWDC25 — 使用新設計建構 SwiftUI 應用程式: https://developer.apple.com/videos/play/wwdc2025/323/
- WWDC25 — 使用新設計建構 AppKit 應用程式: https://developer.apple.com/videos/play/wwdc2025/310/
- WWDC26 — 將您的 AppKit 應用程式現代化: https://developer.apple.com/videos/play/wwdc2026/289/
- WWDC26 — Platforms State of the Union: https://developer.apple.com/videos/play/wwdc2026/112/
- WWDC26 — SwiftUI 的新功能: https://developer.apple.com/videos/play/wwdc2026/269/
- WWDC26 — Platforms State of the Union 總結: https://developer.apple.com/videos/play/wwdc2026/122/

WWDC26 AppKit 與 State of the Union 講次對 macOS 27 改進特別重要：延伸至邊緣的側邊欄、側邊欄下方內容、浮動標題更強硬的捲動邊緣區隔、更新的工具列玻璃、更緊湊的視窗幾何結構、互動式玻璃、使用者色調控制與協助工具適應。

## 官方 Figma 套件

- 官方社群清單: https://www.figma.com/community/file/1651309434229735362/macos-27
- 清單顯示的建立者: Apple
- 清單描述: Apple 的官方 macOS 27 UI 套件
- 觀察到的清單更新: 2026 年 7 月 24 日
- 清單宣告的涵蓋範圍: 元件、文字樣式、色彩樣式、材質、側邊欄、工具列、表格、按鈕、功能表、指標、深色模式、視窗狀態、視窗、警示、彈出視窗、工作表、對話方塊、桌面範本、系統顏色、鮮明度與 SF Symbols。
- 在使用函式庫之前安裝最新 SF Symbols 版本。
- 遵循官方清單連結或說明的 Apple Design Resources 授權。

### 當前工作複本節點

工作複本檔案 key: `BgkMzbnUpf3DwLMkAbQVCL`

- 範例概覽: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=121-18094&p=f
- 清單範例: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8153&p=f
- 表單範例: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8152&p=f
- 整合工具列加標題: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8159&p=f
- 展開工具列加標題: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8161&p=f
- 整合精簡工具列加標題: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8163&p=f
- 預設標題列與側邊欄: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8165&p=f
- 公用程式視窗: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4440-8167&p=f
- 側邊欄頁面: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=207-14495&p=f
- 淺色側邊欄範例: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=4358-6073&p=f
- 工具列頁面: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=207-14501&p=f
- 視窗頁面: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=207-14504&p=f
- 材質頁面: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=483-8848&p=f
- 淺色 Liquid Glass 樣本: https://www.figma.com/design/BgkMzbnUpf3DwLMkAbQVCL/macOS-27--Community-?node-id=483-9316&p=f

## Figma 外掛程式工作流程

可用時使用 Figma 外掛程式獲取精確的節點辨識依據：

1. 從 URL 解析檔案 key 與節點 ID。
2. 僅將 metadata 用於廣泛探索或頁面地圖。
3. 為最小的相關節點要求設計內文。
4. 要求螢幕擷取畫面作為視覺真實依據。
5. 當實作需要權杖或樣式時要求變數定義。
6. 對於大型節點，個別擷取子項目，而非將廣泛的頁面回應視為完整。
7. 記錄檢查了哪個節點。

使用 `figma:figma-design-to-code` 進行實作擷取，並使用 `figma:figma-swiftui` 進行 SwiftUI 對應。若 Figma 配額阻擋額外讀取，請在已驗證的檔案上使用 Ego 並記錄限制。

## Ego 工作流程

當 Figma 檔案已在 Ego 中開啟時：

1. 呼叫 `$ego-browser`。
2. 呼叫 `listTaskSpaces()`。
3. 使用 `claimTaskSpace(spaceId)` 認領使用者擁有的 Space，或使用 `takeOverTaskSpace(spaceId)` 恢復代理人擁有的 Space。
4. 檢查前驗證當前 URL、檔案 key 與節點 ID。
5. 對 Figma chrome 使用語意快照，對畫布使用螢幕擷取畫面。
6. 選取精確圖層或直接巡覽至精確節點 URL。
7. 除非使用者要求關閉，否則保留要求的概覽或交接頁面開啟。

未認領或建立 TaskSpace 時，不要聲稱已透過 Ego 的代理人 API 檢查一般瀏覽器分頁。

## Firecrawl 重新整理工作流程

使用 `$firecrawl-search` 進行聚焦的當前探索，當使用者要求詳盡涵蓋時使用 `$firecrawl-deep-research`。

建議查詢：

- `site:developer.apple.com macOS 27 Liquid Glass sidebar toolbar window`
- `site:developer.apple.com/documentation/swiftui macOS 27 glassEffect toolbar NavigationSplitView`
- `site:developer.apple.com/design/human-interface-guidelines macOS sidebar toolbar windows materials`
- `site:developer.apple.com/videos/play/wwdc2026 macOS 27 Liquid Glass`
- `site:developer.apple.com macOS 27 release notes AppKit SwiftUI design`

先搜尋，再擷取確切主要頁面。對於詳盡的重新整理，使用十個以上相異搜尋、閱讀至少 25 個相異相關來源、記錄 URL 與日期，並將直接來源陳述與統整區隔開來。
