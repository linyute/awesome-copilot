---
name: 'microsoft-store-publisher'
description: '在 Microsoft Partner Center 中準備、驗證、提交並監控 Windows 桌面應用程式。適用於 MSIX 封裝、Store 識別資訊、產品清單、WACK、Partner Center 自動化、認證審查與發佈。'
---

# Microsoft Store 發行者

當使用者希望將 Windows 應用程式發布到
Microsoft Store、建立或驗證 MSIX、完成 Partner Center
提交、回應認證審查結果，或監控發佈狀態時，使用此技能。

此技能適用於 Windows 桌面應用程式（包括使用 `runFullTrust`
的已封裝傳統 Win32 應用程式）。它基于一個成功的端到端
提交經驗，使用了 Partner Center、未簽章的 Store MSIX、
Windows App Certification Kit，以及針對 Partner Center
目前網頁元件的瀏覽器自動化。

## 必要的安全保障措施

將 Partner Center 視為生產環境中的發布系統。

1. 在未取得新近、針對該動作用戶
   確認之前，絕不接受 Microsoft 應用程式開發者協議或其他具約束力的協議。
2. 在所有章節完成、最終
   套件已驗證，且取得新近、針對該動作用戶
   確認之前，絕不按下 **Submit for certification**。
3. 在未取得針對該特定動作的確認之前，
   絕不取消認證、刪除提交、變更定價、
   變更市場可售範圍、手動發布，或傳送 Partner Center 回饋。
4. 絕不輸入、取得、顯示、儲存或揭露密碼、通行金鑰、
   權杖、救援碼、MFA 碼或付款資訊。讓使用者自行完成
   憑證與作業系統的驗證提示。
5. 不要將使用者日常使用的瀏覽器設定檔用於自動化。
   使用專用的持久化設定檔，讓使用者互動式完成驗證。
6. 不要推斷法律、商標、專利、隱私、出口管制或
   開放原始碼的合規性。識別疑慮，並說明何時
   交由專業人士審查較為妥當。
7. 不要僅憑結束代碼就宣稱 WACK 通過。找到並
   閱讀產生的報告，並核實其整體結果。
8. 在檢查套件的識別資訊、發行者、顯示
   名稱、架構、版本與簽章狀態之前，不要上傳套件。

## 本技能中的檔案

- `references/submission-playbook.md` - 完整的提交流程。
- `references/msix-checklist.md` - 套件與 manifest 的需求。
- `references/partner-center-dom.md` - 已知路由、文字、角色、
  自訂元素、選擇器與自動化的特殊行為。
- `references/worked-example.md` - 一次成功的完整
  信任（full-trust）桌面應用程式提交的具體經驗教訓。
- `scripts/partner-center-control.mjs` - 針對專用
  Edge 設定檔的 Playwright 控制器。
- `scripts/inspect-msix.ps1` - 上傳前解開並檢查 MSIX。
- `scripts/invoke-wack.ps1` - 執行 WACK，然後找到、驗證並儲存
  其 XML 與 HTML 報告。
- `templates/run-full-trust-rationale.md` - 受限功能的說明。
- `templates/certification-notes.md` - 測試者指引。
- `templates/store-listing.md` - 清單內容工作表。
- `templates/submission-record.json` - 持久的識別資訊、
  套件、驗證與認證交接記錄。

執行每個階段之前，先閱讀相關的參考文件。Microsoft 會
變更 UI，因此不要依賴記憶中的 Partner Center 標籤。

## 端到端工作流

### 1. 確認範圍與準備狀況

收集或判定以下項目：

- 應用程式名稱與保留的 Store 產品名稱。
- 儲存庫與建構命令。
- 應用程式版本與預計的 MSIX 版本。
- 支援的架構與最低 Windows 版本。
- 該應用程式是 WinUI、UWP、已封裝 Win32、Electron、
  Wails、Tauri、.NET，或其他桌面技術。
- 原生可執行檔、輔助程序、服務、驅動程式、啟動工作、
  通訊協定處理器、檔案關聯、編解碼器與受限功能。
- 隱私政策、支援 URL、網站、授權條款、通知，以及
  對應原始碼義務。
- 認證所需的實際裝置與網路需求。
- 使用者在登入時希望選取的 Microsoft 帳戶。

在建議變更套件之前，先檢查儲存庫。搜尋現有的
manifest 範本、封裝腳本、簽章腳本、應用程式圖示、
版本來源、隱私文件、第三方通知與啟動行為。

### 2. 保留產品並取得識別資訊

在 Partner Center 中保留一個可使用的產品名稱。除非使用者
擁有使用這些詞彙的書面權利，
否則產品名稱中要避免使用受商標保護的詞彙。

保留完成後，在下列位置取得精確的數值：

**Product management > Product identity**

- Store 產品 ID
- 套件識別名稱
- 發行者 ID，通常為 `CN=...` 值
- 發行者顯示名稱
- 套件家族名稱
- 保留的產品顯示名稱
- 公開 Store URL

絕不要猜測這些值。MSIX 必須精確使用 Partner Center 的數值。

### 3. 建構 Store 套件

遵循 `references/msix-checklist.md`。

重要的預設規則：

- 提交到 Microsoft Store 的 MSIX 應該未簽章。Microsoft
  會在認證後簽章。
- 在 Store 外分發的套件，必須使用憑證簽章，
  且其主體必須與 manifest 的發行者精確相符。
- 提交 Store 之前，版本第四段必須為 `0`，
  因為該段保留給 Microsoft 使用。
- 版本第一段必須不為零。
- `Package/Properties/DisplayName` 必須精確匹配一個保留的產品名稱。
  只匹配應用程式的視覺顯示名稱是不夠的。

優先用可重複執行的建構腳本，該腳本應：

1. 驗證輸入的版本與識別數值。
2. 建構或接收生產環境可執行檔。
3. 準備 manifest、可執行檔、資源、授權條款、隱私資訊、
   通知與原始碼連結。
4. 使用 `makeappx.exe` 封裝。
5. 將產生的 MSIX 解開到驗證目錄。
6. 驗證解開後的可執行檔雜湊值。
7. 輸出一份包含識別數值與 SHA-256 雜湊值的 JSON 收據。

### 4. 檢查與測試 MSIX

執行：

```powershell
.\scripts\inspect-msix.ps1 `
  -PackagePath '<path-to-package.msix>' `
  -ExpectedIdentityName '<Partner Center 識別名稱>' `
  -ExpectedPublisher '<Partner Center 發行者 ID>' `
  -ExpectedDisplayName '<保留的產品名稱>'
```

此腳本屬於本技能目錄，而不一定是應用程式
儲存庫。在呼叫之前先解析其完整路徑。

在可能的情歡下，以真實的套件識別資訊安裝並
操作已封裝的應用程式。測試：

- 首次啟動與升級。
- 啟动工作與持久化設定。
- 輔助程序啟動。
- 系統匣行為與乾淨結束。
- 網路發現與防火牆行為。
- 以套件識別資訊進行的檔案與登錄存取。
- 解除安裝與資料保留行為。
- 受限功能行為。

### 5. 執行 WACK

執行：

```powershell
# 從提升權限的 PowerShell 終端機執行此命令。
.\scripts\invoke-wack.ps1 `
  -PackagePath '<path-to-package.msix>' `
  -ReportPath '<artifact-directory>\WACK-report.xml'
```

WACK 命令列執行器需要提升權限。模型不得
代使用者核准作業系統的驗證提示。

WACK 只接受以 `.xml` 結尾的報告路徑。任何其他
副檔名都會以結束代碼 -1 失敗，並顯示 `The report output
file path should point to a XML file.`。目前版本的套件會將
XML 報告寫入要求的路徑，並將其 HTML 呈現寫入 `%LOCALAPPDATA%\Microsoft\AppCertKit\<same base name>.htm`。
之前某次執行只在那個資料夾留下了 HTML 報告，沒有 XML 報告。

該腳本：

- 永遠傳給 WACK 一個 `.xml` 路徑。以 `.htm` 或
  `.html` 結尾的 `-ReportPath` 指定要儲存的 HTML 報告，
  XML 報告會以相同的基本名稱儲存在旁邊。
- 使用本次執行在要求路徑下的 XML 報告，否則
  使用 `%LOCALAPPDATA%\Microsoft\AppCertKit` 中最新的 WACK
  報告。它會跳過之前執行的檔案，以及 WACK 儲存在該資料夾的
  無關 XML 檔案，並在報告仍是未完成的中期報告時持續等待。
- 依報告時間將 HTML 報告與 XML 報告配對，然後
  將兩份都儲存在 `-ReportPath` 旁邊。
- 依 HTML 報告顯示的方式，回報 XML 的 `OVERALL_RESULT`：
  `PASS` 為 `PASSED`、`FAIL` 為 `FAILED`、`WARNING` 為
  `PASSED WITH WARNINGS`，中期報告為 `INCOMPLETE`。
  只有在沒有 XML 報告時才會使用 HTML 結果。
- 在結果不是 `PASSED`、並非所有測試都已執行、XML 與 HTML
  報告不一致、`appcert.exe` 以錯誤結束，或報告的
  套件識別名稱或版本與套件不符時失敗。針對
  bundle 會改為發出警告，因此需要手動檢查名稱與版本。
- 在 `nonPassingTests` 中列出所有未通過的測試，
  並附上 WACK 對它們的訊息。僅有 HTML 的結果會讓這個清單為空。

找到報告後，腳本會輸出一個 JSON 摘要，然後
若 `passed` 為 `false` 便擲出例外。在 `passed` 為 `true` 之前，
不要繼續提交。`PASSED WITH WARNINGS` 不等於 `PASSED`：修正它所列出的
測試並重新執行 WACK。
閱讀 `warnings` 中的每一項。選用測試的失敗不會阻擋 Store
上架，但需要調查。

將結果記錄到提交記錄：`overallResult` 記為 `wack.result`、
`xmlReport` 記為 `wack.reportPath`、`kitVersion` 記為
`wack.kitVersion`，`reportTime` 記為 `wack.testedAt`。若
`resultSource` 為 `html`，使用 `htmlReport` 作為報告路徑，
並從 HTML 報告的標頭複製套件版本與報告時間。

要在不重新執行 WACK 的情況下解析並驗證現有報告：

```powershell
.\scripts\invoke-wack.ps1 `
  -PackagePath '<path-to-package.msix>' `
  -ReportPath '<artifact-directory>\verified-WACK-report.xml' `
  -ExistingReportPath '<existing-WACK-report.xml>'
```

僅在沒有 XML 報告存在時才傳入 `.htm` 報告。給定
XML 報告時，腳本會搜尋具有相同基本名稱的 HTML 報告
（位於其旁邊或 `%LOCALAPPDATA%\Microsoft\AppCertKit`），
並在報告時間相符時使用它。給定 HTML 報告時，若兩者相符，
它會使用旁邊的 XML 報告。

### 6. 謹慎地自動化 Partner Center

當應用程式原生的瀏覽器或電腦操作
工具可以可靠地檢查與操作頁面時，優先使用它們。
當 Partner Center 網頁元件或檔案上傳不可靠時，
使用 `scripts/partner-center-control.mjs` 作為備援。

設定：

```powershell
Set-Location '<skill-directory>\scripts'
npm install
$env:PARTNER_CENTER_PROFILE = '<dedicated-profile-directory>'
node .\partner-center-control.mjs launch
```

將 `launch` 作為附帶的 background 程序執行。
使用者在專用的 Edge 視窗中完成 Microsoft
驗證。在另一個命令流程中，使用下列唯讀命令：

```powershell
node .\partner-center-control.mjs status
node .\partner-center-control.mjs pages
node .\partner-center-control.mjs text
node .\partner-center-control.mjs anchors
node .\partner-center-control.mjs overview-state
node .\partner-center-control.mjs agreement-state
node .\partner-center-control.mjs button-state "Submit for certification"
```

變更狀態的控制器命令需要：

```powershell
$env:PARTNER_CENTER_ALLOW_WRITE = '1'
```

僅在使用者已核准該特定動作之後才設定它。
在動作完成後移除它，使後續命令安全失敗（fail closed）。

在使用選擇器之前，先閱讀 `references/partner-center-dom.md`。

### 7. 完成每個提交章節

閱讀 `references/submission-playbook.md`。典型的章節包括：

- 定價與可售範圍
- 屬性
- 年齡評級
- 套件
- Store 清單
- 提交選項
- 額外測試資訊

儲存每個章節後，重新載入並驗證其已持久化。
Partner Center 在其 API 仍在載入期間，
可能暫時不顯示完成狀態。在判定某章節未完成之前，先等待並重新載入。

不要做出缺乏依據的行銷或無障礙聲明。使用真實的
應用程式截圖。直白地說明網路、硬體、帳戶與
受保護內容的限制。

針對 `runFullTrust`，說明精確的原生功能、輔助程序、
Windows API、啟動整合，以及為何沙箱應用程式
模型不足夠。說明該應用程式是否使用提升權限、服務、
驅動程式、全域系統設定或雲端後端。

### 8. 最終的就緒檢查

在請求提交核准之前，驗證：

- 每個 Partner Center 章節都顯示 **Complete**。
- 套件顯示 **Validated**。
- `invoke-wack.ps1` 對最終套件報告了 `passed: true`：
  WACK 整體結果為 **PASSED**，且報告的識別名稱
  與版本與套件相符。
- 套件識別資訊與顯示名稱符合 Partner Center。
- 提交到 Store 時，套件為未簽章。
- 隱私、支援、網站、授權條款與通知皆可存取。
- 認證備註已儲存，並包含可重現的測試指引。
- 受限功能皆有說明。
- 發佈時間與使用者的意圖一致。
- 沒有隱藏任何已知的阻礙因素。

### 9. 協議接受

若 Partner Center 顯示一份已更新的協議：

1. 開啟協議頁面，並確認精確的協議名稱與版本。
2. 告知使用者，這是一份規範開發者
   帳戶與 Store 提交的具約束力法律協議。
3. 請求明確核准，以接受該精確版本。
4. 在核准後，重新檢查頁面。
5. 只接受目標的那一行，且只接受一次。
6. 驗證狀態已從 `Not Accepted` 變更為接受日期。

不要重複使用其他協議或先前動作的核准。

### 10. 提交認證

當按鈕啟用時：

1. 說明提交會將產品送往 Microsoft 認證，
   以及核准後是否會自動發佈。
2. 請求明確核准，以按下 **Submit for certification**。
3. 在核准後，重新檢查按鈕。
4. 點擊一次。
5. 未經單獨核准，不要提交選用的回饋問卷。
6. 驗證概況頁顯示 **In certification**，
   並顯示認證流程。

### 11. 監控與回應

認證通常會在數小時內完成，但也可能需要
數個工作天。監控：

- 提交
- 前置處理
- 認證
- 發佈

若認證失敗，精確引述該審查發現，將它對應
到套件、清單、政策或測試行為，做出最小且
完整的修正，在需要時以更高的套件版本重新
建構，重新執行檢查與 WACK，並取得新的提交核准。

若產品已核准，從未登入（未驗證）的情境中
驗證公開 Store URL。不要只因為 Partner Center
表示發佈已完成，就宣稱它已上線。

## 輸出標準

報告具體狀態：

- 產品 ID 與保留的名稱。
- 套件路徑、套件版本、架構、簽章狀態與 SHA-256。
- WACK 結果與報告路徑。
- 已完成的 Partner Center 章節。
- 協議名稱與接受狀態。
- 認證流程階段。
- 精確的阻礙因素與下一步動作。

除非已從 Partner Center 讀回結果狀態，
或已檢查所產生的產物，否則不要報告變更已完成。

對於耗時較長的提交，將 `templates/submission-record.json`
複製到一個 session 產物目錄，並在每次有意義的狀態變更後
更新它。不要將帳戶識別資訊、私人 URL、憑證或瀏覽器
設定檔資料提交到應用程式儲存庫。
