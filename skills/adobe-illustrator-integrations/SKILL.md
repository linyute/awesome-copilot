---
name: adobe-illustrator-integrations
description: '建構、偵錯、封裝及記錄 Adobe Illustrator 整合：CEP 擴充功能面板、C++ SDK 外掛程式 (.aip)、即將推出的 UXP 外掛程式、驅動 Illustrator 的 MCP 伺服器、電腦使用自動化，以及在 Illustrator 中執行 ExtendScript 的作業系統指令碼 (批次檔、PowerShell、bash、AppleScript)。適用於建立或修正 Illustrator 擴充功能或外掛程式、在指令碼、擴充功能或外掛程式之間進行選擇、將 AI 工具連線至 Illustrator、從命令列自動化 Illustrator，或為即將發布的 Illustrator 工具撰寫安裝與使用說明文件。可與用於 ExtendScript DOM 的 adobe-illustrator-scripting 搭配使用。'
---

# Adobe Illustrator 整合

針對圍繞 Illustrator 指令碼的所有環節提供指引：使用者點擊的面板、新增工具的原生外掛程式、從外部啟動 Illustrator 工作的命令列或 AI agent，以及隨附提供的說明文件。有關 Illustrator DOM 本身（文件、圖層、路徑、顏色、匯出），請使用 **adobe-illustrator-scripting** 技能。

## 何時使用此技能

- 選擇如何交付 Illustrator 功能：指令碼、CEP 擴充功能、C++ 外掛程式、UXP 外掛程式、MCP 伺服器或作業系統自動化指令碼
- 建構或修復 CEP 擴充功能面板（HTML、JavaScript 及 ExtendScript 主機）
- 使用 Illustrator SDK 建構或修復 C++ 外掛程式 (`.aip`)
- 從批次檔、PowerShell、bash、Python 或 AppleScript 執行 `.jsx` 指令碼，包括傳遞參數與讀取結果
- 建構或審查可讓 AI 工具驅動 Illustrator 的 MCP 伺服器
- 在沒有指令碼途徑時，透過電腦使用工具在 Illustrator 中操作
- 撰寫供人工逐步遵循的操作指引，或為即將發布的資產、指令碼、擴充功能或外掛程式撰寫安裝與使用說明文件
- 組織 Illustrator 專案的檔案（原始檔、連結資產、匯出成品、文件），使自動化程序能夠找到它們

## 指令碼、擴充功能或外掛程式

Adobe 官方術語：

- **指令碼 (script)** 是針對 Illustrator 指令碼物件模型執行的 ExtendScript (`.jsx`)、AppleScript 或 VBScript。除了 ScriptUI 對話方塊之外，它沒有常駐的 UI。
- **擴充功能 (extension)** 是一個 CEP 面板：由 Illustrator 託管的 HTML 與 JavaScript UI，透過 `CSInterface.evalScript` 呼叫 ExtendScript。
- **外掛程式 (plug-in)** 是使用 Illustrator C++ SDK 建構的原生程式碼 (`.aip`)。在已執行 UXP 的應用程式中（Photoshop、InDesign、Premiere Pro），「plugin」也指 UXP 外掛程式；Illustrator UXP 外掛程式尚未公開釋出。

| 選項 | 是什麼 | UI | 安裝位置 | 交付形式 | 何時選擇 |
| --- | --- | --- | --- | --- | --- |
| 手動操作指引 | 人員遵循的步驟 | Illustrator 自有介面 | 無 | 一份文件 | 該工作極為罕見，或每一步都需要人為判斷 |
| ExtendScript 指令碼 | 在 Illustrator 中執行的 `.jsx` | 選用的 ScriptUI 對話方塊 | `Presets/<locale>/Scripts` 或任何位置 (檔案 > 指令碼 > 其他指令碼) | `.jsx` 檔案 | 單一動作、批次工作或由其他工具呼叫的步驟 |
| CEP 擴充功能 | HTML 面板加上 ExtendScript 主機 | 可停靠的面板 | CEP `extensions` 資料夾 | 已簽署的 `.zxp` | 使用者需要包含控制項與預覽畫面的常駐面板 |
| C++ 外掛程式 | 來自 Illustrator SDK 的原生 `.aip` | 工具、選單、通知器、原生對話方塊 | Plug-ins 資料夾或附加外掛程式資料夾 | 依作業系統及主要版本的 `.aip` | 需要自訂工具、即時效果、極高效能或指令碼無法觸及的事件 |
| UXP 外掛程式 | 現代 JavaScript 外掛程式模型 | 面板與對話方塊 | 透過 Creative Cloud | `.ccx` | 提前規劃；Illustrator 的公開測試版預計於 2027 年春季推出 |
| MCP 伺服器 | 由 AI 工具呼叫並在 Illustrator 中執行指令碼的處理程序 | AI 工具的對話介面 | AI 工具的 MCP 設定 | 套件或存放庫 | Agent 需要透過工具建立或檢查圖稿 |
| 作業系統自動化 | 啟動指令碼的批次檔、PowerShell、bash 或 AppleScript | 無 | 任何位置 | 指令碼檔案 | Illustrator 工作只是較大管線中的其中一個步驟 |

從滿足需求的最低層級開始。能正常運作的指令碼是每個更高層級的核心：CEP 面板、MCP 工具和作業系統指令碼最終都會呼叫 ExtendScript。

## 擴充性時間表

摘自 Adobe 的公告「投資 Creative Cloud 擴充性的未來」(blog.developer.adobe.com，2026 年 9 月)：

- Illustrator UXP 外掛程式：於 2027 年春季推出公開測試版。
- Illustrator、After Effects 與 Media Encoder 中的 CEP：Adobe Marketplace 將於 2028 年 12 月停止接受新的 CEP 提交，且自 2028 年 12 月起 CEP 將預設停用。
- CEP 將於 2029 年 12 月起從這些應用程式中移除，各應用程式的 UXP 公開測試版與從新版本移除 CEP 之間至少會有兩年時間。
- ExtendScript 不受此過渡影響。

因此，現今建構的 CEP 擴充功能仍有數年的工作壽命。請將其邏輯保留在面板呼叫的純 ExtendScript 檔案中，這些檔案可以原封不動地轉移到 UXP 外掛程式或 MCP 伺服器。

## 工作流程

1. **範疇設定**：使用者要做什麼、必須在哪個 Illustrator 版本和作業系統上執行，以及由誰安裝。
2. 從上表中**選擇層級**。
3. 先使用 adobe-illustrator-scripting 技能**撰寫 ExtendScript 核心**，撰寫為接受純設定物件並回傳結果字串的函式，以便任何前端都能呼叫它們。
4. **新增前端**：
   - CEP 面板：[references/cep-extensions.md](references/cep-extensions.md)（資料夾配置、manifest、`CSInterface`、偵錯模式、簽署、安裝）
   - C++ 外掛程式：[references/cpp-plugins.md](references/cpp-plugins.md)（SDK、建構、PiPL、套件組合 suites、通知器、偵錯）
   - 命令列、MCP 伺服器或電腦使用：[references/automation-and-mcp.md](references/automation-and-mcp.md)（COM、AppleScript、參數、結果、MCP 設計、安全性）
5. 在真實文件的複本上於 **Illustrator 內部進行測試**：執行每個選項，匯出結果的 PNG，並將其與預期輸出進行比較。
6. **封裝**：CEP 封裝為已簽署的 ZXP，外掛程式封裝為各作業系統的 `.aip`，指令碼和伺服器則封裝為具版本號的資料夾或套件。
7. 使用 [references/publishing-docs.md](references/publishing-docs.md) **撰寫說明文件**：需求條件、相容性、各作業系統的安裝步驟、附有螢幕截圖的逐步解說、GIF、疑難排解以及變更記錄。

## 從 Illustrator 外部執行指令碼

| 平台 | 途徑 | 附註 |
| --- | --- | --- |
| Windows | COM `Illustrator.Application` | `DoJavaScriptFile(JavaScriptFile, [Arguments], [ExecutionMode])` 與 `DoJavaScript(JavaScriptCode, [Arguments], [ExecutionMode])`；ExecutionMode 1 絕不顯示偵錯工具 |
| macOS | AppleScript `do javascript` | `do javascript "$.evalFile(new File(arguments[0]))" with arguments {scriptPath}`，路徑作為引數傳遞給 `osascript`，因此絕不會進入指令碼原始碼；請檢查對應版本的確切應用程式名稱 |
| 兩者皆適用 | VS Code ExtendScript Debugger | Adobe 提供用於對執行中應用程式執行與偵錯 `.jsx` 的擴充功能 |
| Windows (舊版) | ExtendScript Toolkit `-run` | 32 位元，無法在 macOS 10.15 或更新版本上執行；僅保留給舊版管線 |

透過附隨的 `key=value` 檔案傳遞參數（在 ES3 中無需 JSON 剖析器或 `eval`），並讓指令碼將其結果寫入檔案，因為各啟動工具之間的 `arguments` 處理方式有所不同。模式請參閱 [references/automation-and-mcp.md](references/automation-and-mcp.md)。

## 人員手動遵循的操作指引

當交付項目是一組步驟而非程式碼時（針對複雜圖形，或供使用者下載的資產）：

- 指明檢查步驟時所使用的 Illustrator 版本，並完整寫出選單路徑 (`物件 > 路徑 > 位移複製路徑`)。
- 每個步驟一個動作，並註明面板與要設定的值 (`筆畫面板：粗細 2 pt，將筆畫對齊內側`)。
- 在每組步驟後顯示預期結果，並附上螢幕截圖或小型 PNG。
- 標記在 Windows 和 macOS 上有所不同的步驟（快速鍵、檔案對話方塊、字型路徑）。
- 當存在指令碼時，在手動途徑旁提供指令碼途徑。

## 防護措施

- 在使用者文件的複本上操作；切勿在沒有備份的情況下覆寫原始檔案。
- 在寫入 Adobe 的安裝資料夾、系統 CEP 資料夾或登錄檔之前先詢問。
- 開發模式 (`PlayerDebugMode`) 僅限於開發用機器。請向使用者交付已簽署的 ZXP。
- 切勿提交簽署憑證、憑證密碼、API 金鑰或權杖。從環境變數讀取機密資訊。
- 優先使用指令碼、COM 或 AppleScript，而非透過 UI 點擊；僅在沒有指令碼途徑時使用電腦使用。
- 絕不要針對登入、授權或帳戶對話方塊進行自動化。
- 來自 Adobe Fonts 的字型無法隨附在外掛程式或擴充功能中；請改將它們記載為需求條件。
- 特定版本的詳細資訊（CEP 版本、SDK 版本、選單名稱）可能會變更；請註明檢查過的版本並指向 Adobe 的文件。

## 參考資料

- [references/cep-extensions.md](references/cep-extensions.md)：從資料夾配置到已簽署 ZXP 的 CEP 面板
- [references/cpp-plugins.md](references/cpp-plugins.md)：使用 Illustrator SDK 的 C++ 外掛程式
- [references/automation-and-mcp.md](references/automation-and-mcp.md)：命令列執行、MCP 伺服器與電腦使用
- [references/publishing-docs.md](references/publishing-docs.md)：已發布 Illustrator 工具的安裝與使用說明文件
- Adobe CEP Resources (CEP 12 cookbook, `CSInterface.js`, ZXPSignCMD)：[Adobe-CEP/CEP-Resources](https://github.com/Adobe-CEP/CEP-Resources)
- Adobe CEP 入門指南 (封裝、簽署、散布)：[Adobe-CEP/Getting-Started-guides](https://github.com/Adobe-CEP/Getting-Started-guides)
- UXP 與 CEP 時間表：[Investing in the future of Creative Cloud extensibility](https://blog.developer.adobe.com/en/publish/2026/09/investing-in-the-future-of-creative-cloud-extensibility-uxp-comes-to-our-flagship-applications)
