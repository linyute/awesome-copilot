# 用於 Illustrator 的 C++ 外掛程式

外掛程式是使用 Illustrator SDK 建構的原生程式碼，Illustrator 會在啟動時載入它。它可以新增工具、選單項目、即時效果、檔案格式和通知器，且在大型文件上的執行速度遠快於 ExtendScript。但它的建構、發行和維護工作量也最為龐大，因為每個 Illustrator 主要版本與每個作業系統都必須重新建構。

只有在指令碼或 CEP 面板無法完成工作時才選擇外掛程式：對滑鼠拖曳做出反應的自訂工具、即時效果、檔案格式、指令碼無法察覺的事件，或針對數千個物件的極致效能需求。

## 取得 SDK

- 登入 Adobe Developer Console (`developer.adobe.com/console`)，開啟下載區域，並選擇適用於您作業系統的 Illustrator SDK。請使用與目標 Illustrator 主要版本相符的 SDK。
- 下載內容包含標頭檔、說明文件（入門指南、API 參考資料、移植注意事項）、位於 `samplecode/` 下的範例外掛程式，以及建構工具。
- 入門指南列出了支援的編譯器版本：Windows 上為 Visual Studio，macOS 上為 Xcode。請使用這些版本；較新的版本可能需要升級專案。

## 建構與載入

1. 開啟範例專案（例如 Annotator 範例）並先不加修改直接建構，以驗證工具鏈。
2. 輸出在 Windows 上為 `.aip` 檔案，在 macOS 上為 `.aip` 套件組合 (bundle)。
3. 載入方式為將其複製到 Illustrator 的 `Plug-ins` 資料夾中，或者更好的做法是讓 Illustrator 指向開發資料夾：偏好設定 > 外掛程式與暫存磁碟 > 附加外掛程式資料夾，然後重新啟動 Illustrator。
4. 外掛程式僅在啟動時載入。替換 `.aip` 之前請先關閉 Illustrator。

## PiPL 資源

每個外掛程式都包含一個 PiPL（外掛程式屬性清單，plug-in property list）資源，載明其名稱、進入點以及所需的 Illustrator 版本。自 Illustrator 25.1 起，PiPL 資源改由 SDK 工具資料夾中的指令碼產生，而非在資源檔中手動編輯（Adobe 開發者部落格，「An Illustrator 25.1 Update for Plugin Developers」）。請遵循範例專案中執行產生器的建構步驟。

## 進入點與訊息

Illustrator 會使用呼叫端、選取器與訊息指標來呼叫單一匯出函式。SDK 範例共用一個 `common` 資料夾：`Main.cpp` 匯出進入點，而 `Plugin` 基底類別將呼叫端與選取器配對路由至虛擬方法，因此請從範例開始，而非自行編寫：

```cpp
// SDK 範例匯出的進入點形式；基底類別將
// 呼叫端/選取器配對路由至虛擬方法，例如 StartupPlugin、ShutdownPlugin、
// GoMenuItem、Notify 以及工具處理常式。
extern "C" ASAPI ASErr PluginMain(char* caller, char* selector, void* message);
```

- **啟動與關閉**：在啟動時取得套件組合 (suites)、新增選單、工具與通知器；在關閉時釋放所有項目。
- **套件組合 (Suites)**：Illustrator 的 API 是一組具版本的函式表（套件組合 suites），例如圖稿 (art)、路徑 (path)、文件 (document)、選單 (menu)、工具 (tool)、通知器 (notifier) 和計時器 (timer) 套件組合。透過主機傳入的基本套件組合取得它們，檢查傳回的錯誤，並在完成後將其釋放。
- **通知器 (Notifiers)**：訂閱選取項目變更或文件開啟與關閉等事件；保持處理常式輕巧快速。
- **計時器 (Timers)**：用於週期性工作；絕不封鎖 UI 執行緒。

## 使用者介面

原生外掛程式可直接新增工具與選單項目。對於具有複雜控制項的面板，常見的設計是將外掛程式與傳送事件給它的 CEP 面板配對，讓 UI 採用 HTML，而繁重的工作交由原生程式碼處理。請查看對應版本的 SDK 範例以了解支援的 UI 做法，因為此做法在各版本間有所變動。

## 偵錯

- 建構 Debug 設定，並將 Illustrator 設為要啟動的程式（Visual Studio：專案偵錯設定中的 Command；Xcode：配置架構 Scheme 的 Run 可執行檔），或附加至正在執行的 Illustrator。
- 保留一份測試文件的複本；原生當機將導致 Illustrator 一併終止。
- 記錄至暫存資料夾中的檔案，而非在迴圈中顯示警示對話方塊。

## 版本與發布散布

- 針對每個 Illustrator 主要版本重新建構並重新測試；請閱讀 SDK 的移植注意事項以了解 API 變更。
- 每個作業系統交付一個建構版本。在 macOS 上，簽署並公證套件組合，以便 Gatekeeper 允許其載入。在 Windows 上，使用程式碼簽署憑證為二進位檔案簽署。
- 在相容性表格中記錄支援的 Illustrator 版本與作業系統（參閱 publishing-docs.md）。
- UXP 外掛程式即將登陸 Illustrator（預計於 2027 年春季推出公開測試版）。對於只需要面板和編寫指令碼的新專案，請考慮目前使用 CEP 面板，日後再改用 UXP；將原生程式碼保留給只有原生程式碼才能處理的情境。

## 發布前檢查清單

- [ ] 針對各作業系統及目標 Illustrator 主要版本，在 Release 模式下皆能順暢編譯建構
- [ ] 能從乾淨的附加外掛程式資料夾及 `Plug-ins` 資料夾中成功載入
- [ ] 啟動與關閉時皆能釋放每個套件組合，並移除每個通知器與計時器
- [ ] 在大型真實文件的複本上完成測試，且每個動作後復原功能皆可正常運作
- [ ] 已完成簽署（在 macOS 上已完成公證）
- [ ] 安裝、解除安裝與相容性說明皆已記錄妥當
