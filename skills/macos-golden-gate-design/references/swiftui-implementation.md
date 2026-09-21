# 原生實作模式

## 從結構著手，而非視覺效果

先建構正常的 macOS 層級。具代表性的 SwiftUI 根檢視如下所示：

```swift
struct BrowserView: View {
    @State private var selection: Item.ID?
    @State private var query = ""
    @State private var showsInspector = false

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Section("Favorites") {
                    Label("Recents", systemImage: "clock")
                    Label("Downloads", systemImage: "arrow.down.circle")
                }
            }
            .listStyle(.sidebar)
            .navigationTitle("Library")
        } detail: {
            ItemTable(selection: $selection)
                .navigationTitle("Items")
        }
        .searchable(text: $query)
        .toolbar {
            ToolbarItemGroup {
                Button("Change View", systemImage: "square.grid.2x2") {
                    // Change the content presentation.
                }
                Button("Show Inspector", systemImage: "sidebar.trailing") {
                    showsInspector.toggle()
                }
            }
        }
        .inspector(isPresented: $showsInspector) {
            ItemInspector(selection: selection)
        }
    }
}
```

這是一個結構範例，而非要求必須使用這些確切控制項。請注意缺少了什麼：

- `NavigationSplitView` 周圍沒有圓角外殼
- 沒有為每個欄位新增材質背景
- `List`、`Table` 或檢查器周圍沒有卡片
- 沒有自訂標題橫幅

讓場景與原生元件提供平台外觀。

## 場景與視窗架構

選擇與產品相符的場景：

- `WindowGroup` 用於一般的多視窗應用程式內容
- `DocumentGroup` 用於文件導向應用程式
- `Settings` 用於偏好設定
- `MenuBarExtra` 用於功能表列公用程式
- 額外的 `Window` 或視窗群組用於個別的輔助工作流程

為每個視窗提供：

- 連貫的標題
- 原生工具列與功能表指令
- 逼真的最小尺寸
- 適合其角色的還原行為
- 鍵盤快速鍵
- 可調整大小的內容

不要僅為了模仿設計模型而使用視覺上自訂的無邊框視窗。若修改了工具列可見性或將內容延伸至標題列，請保留可拖曳區域、協助工具標題、視窗控制按鈕（traffic lights）、調整大小與視窗狀態行為。

## 側邊欄、欄位與檢查器

優先使用：

- `NavigationSplitView` 用於雙欄或三欄導覽
- 搭配 `.listStyle(.sidebar)` 的 `List(selection:)` 作為來源清單
- `.inspector(isPresented:content:)` 作為從屬後緣檢查器
- 僅在內容有實際寬度需求時使用 `navigationSplitViewColumnWidth`
- 當該欄位擁有更深層導覽時，在欄位內使用 `NavigationStack`

不要使用圓角矩形的 `HStack` 來重現分割檢視欄位。原生分割檢視提供調整大小、收合行為、分隔線、焦點與平台適應能力。

## 清單、表格、表單與設定

使用：

- `List` 用於可巡覽或異質資料列
- `Table` 用於密集、欄位式資料
- `OutlineGroup`、階層式 `List`、`NSOutlineView` 或 `NSTableView` 用於樹狀結構
- `Form` 用於具標籤的控制項與設定
- `Section` 用於語意群組
- 沒有內容時使用 `ContentUnavailableView` 或原生空白狀態構圖

讓原生資料列背景、選取、交替表格資料列、分隔線與標頭發揮作用。避免新增：

- 對整個清單或表格套用 `.background(.material, in: RoundedRectangle(...))`
- 每個資料列背後加上圓角矩形
- 靜態表單區段上的陰影
- 與原生選取衝突的手動選取膠囊

僅在明確封閉具有語意實用性時才使用 `GroupBox`，不要將其作為預設區段元件。

## 工具列與搜尋

搭配語意配置使用 `.toolbar`、`ToolbarItem` 與 `ToolbarItemGroup`。讓系統自適應間距與溢位。

- 將導覽與側邊欄控制項置於前緣。
- 讓標題參與標題列或工具列。
- 將搜尋置於 `.searchable` 自然放置之處；在 macOS 上通常是工具列後緣。
- 保持高頻動作可見，並將次要動作移至功能表或系統溢位。
- 僅在符號為人熟知時使用純符號控制項，並提供協助工具標籤。
- 適當時在功能表列中放置對等指令。
- 最多使用一個顯著的主要動作。

對於 macOS 27 SDK 功能（如工具列可見性優先順序、溢位群組或固定後緣配置），在編寫程式碼前，請先在 Apple 文件中驗證確切的當前符號與可用性。不要根據螢幕截圖或 WWDC 改述憑空捏造搶鮮版（beta）API。

## Liquid Glass

首先，使用當前 SDK 重新建構並檢查標準控制項。許多系統元件會自動採用並改進 Liquid Glass。

僅在下列情況下使用自訂玻璃效果：

- 該元素為自訂控制項或精簡浮動表面
- 材質能傳達其提升或互動
- 標準按鈕、工具列項目、功能表、彈出視窗或材質尚未表達該需求

最小的自訂 SwiftUI 表面可以使用記載的效果：

```swift
if #available(macOS 26.0, *) {
    Label("Live", systemImage: "waveform")
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .glassEffect(.regular, in: .capsule)
}
```

對於附近的多個自訂玻璃元素，使用 `GlassEffectContainer` 以便系統轉譯並協調其形狀。僅在設計確實需要合併、變形或指標回應時，才使用 `glassEffectUnion`、ID、轉場或互動式玻璃。

請勿：

- 將整個根檢視置於 `GlassEffectContainer` 中
- 將 `glassEffect` 套用至每個導覽資料列或內容區段
- 硬式編碼模糊、不透明度、折射、反光或陰影配方來偽造系統玻璃
- 將 Figma 效果權杖（token）數值複製到實際執行環境轉譯程式碼中

## 背景延伸與捲動邊緣

`backgroundExtensionEffect()` 可將視覺豐富的詳細內容延伸至側邊欄或檢查器下方。將其用於具備延續價值的影像或沉浸式內容。它不是通用窗格背景，也不構成將大量文字內容置於模糊之下的理由。

使用系統的捲動邊緣行為，在內容於下方捲動時保持浮動標題與工具列控制項清晰易讀。在 macOS 27 上，標準行為可能會在文字需要更強烈區隔之處解析為硬邊緣。在採用自訂漸層之前，優先使用自動或語意系統行為。

## AppKit 等效項目

對於 AppKit：

- 使用 `NSWindow` 與標準標題列行為
- 使用 `NSSplitViewController` 作為結構欄位
- 使用 `NSToolbar` 作為指令與搜尋
- 使用來源清單 `NSOutlineView` 或 `NSTableView`
- 使用標準控制項與呈現 API
- 在支援的系統上將 `NSGlassEffectView` 用於必要的自訂動態玻璃表面
- 將 `NSVisualEffectView` 用於傳統材質背景或相容的舊目標

Apple 說明的 macOS 27 AppKit 改進包含延伸至邊緣的側邊欄、側邊欄後方內容、半粗體側邊欄選取、浮動標題文字的硬捲動邊緣行為、側邊欄上方有邊框工具列項目上的玻璃，以及新的同心圓角支援（例如 `NSViewCornerConfiguration` 與 `NSViewCornerRadius.containerConcentric`）。請對照已安裝的 macOS 27 SDK 驗證符號。

## 協助工具實作

優先使用原生元件，因為其材質與狀態行為會自動適應。對於自訂 AppKit 材質：

- 檢查 `NSWorkspace.shared.accessibilityDisplayShouldReduceTransparency`
- 觀察 `accessibilityDisplayOptionsDidChangeNotification`
- 當要求減少透明度時，以不透明或穩定的替代項目取代半透明背景

此外亦測試：

- `accessibilityDifferentiateWithoutColor`
- 增加對比與焦點可見度
- 減少動態效果
- VoiceOver 標籤、角色、數值與遍歷巡覽
- 全鍵盤操控
- 非使用中視窗強調程度

不要僅使用協助工具設定將一種硬式編碼視覺配方換成另一種。保留語意顏色與原生行為。

## 移轉順序

對於現有應用程式：

1. 使用當前 Xcode 與 SDK 進行建構。
2. 擷取在淺色、深色、作用中、非作用中、窄與寬狀態下的當前介面。
3. 以原生場景與分割檢視取代自訂根外殼。
4. 從側邊欄、內容、表格、表單與檢查器區域中移除多餘背景。
5. 透過間距、排版、原生分隔線與選取來還原層級。
6. 以原生工具列與功能表指令取代自訂指令列。
7. 檢查架構自動提供了哪些玻璃效果。
8. 僅新增剩餘必要的自訂玻璃。
9. 驗證協助工具設定與使用者選擇的色調。
10. 建置、執行並將真實應用程式與官方 Figma 參考進行比較。

## 程式碼審查問題

- 是否有任何 `RoundedRectangle`、`.background`、`.overlay`、陰影或材質修飾詞包裝了結構窗格？
- 自訂 `HStack` 是否在重新實作 `NavigationSplitView`？
- 自訂標頭是否在重新實作視窗標題列或工具列？
- 原生選取與資料列樣式是否僅為了裝飾而被覆寫？
- 自訂玻璃是否解決了真實互動問題？
- 每個受可用性條件限制的 API 是否都存在於當前 SDK 中？
- 在透明度降低時應用程式是否仍保持清晰？
- 調整大小是否保留窗格層級而未變成堆疊卡片？
