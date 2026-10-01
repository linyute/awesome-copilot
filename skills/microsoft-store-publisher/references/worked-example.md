# 實作範例：完整信任桌面接收器

此範例記錄了一次成功的 Microsoft Store 提交中的
決策與失敗。它是先前範例（prior art），而非可以
不檢視新應用程式就直接複製的模板。

## 產品與套件

- 產品：Mirror Me Phone Display
- Store 產品 ID、套件身分識別名稱、發佈者 ID、發佈者顯示
  名稱與套件家族名稱：精確複製自 Partner Center 的
  **Product identity**。這些值特定於單一開發者帳戶，所以
  不在這裡重複。發佈者 ID 的形式為 `CN=<GUID>`，而
  套件家族名稱是身分識別名稱、一個底線，以及
  一個 13 字元的發佈者雜湊值。
- 應用程式版本：`0.2.4`
- MSIX 版本：`1.2.4.0`
- 架構：x64
- 最低 Windows 版本：`10.0.22000.0`

應用程式版本低於 1.0，但 MSIX 不允許第一組組件
為零。該建構將 `0.2.4` 映射為 `1.2.4.0`。第四組組件
為 Store 使用保持為零。

## 套件模型

該應用程式是 Wails 與 Win32 桌面應用程式，包含：

- `packagedClassicApp`
- `mediumIL`
- `runFullTrust`
- 封裝的 `windows.startupTask`
- 同一執行檔的 `--receiver-worker` 模式
- 原生 DNS-SD、Media Foundation、GDI 與 WASAPI 整合
- 無權限提升
- 無服務
- 無驅動程式
- 無全域系統設定
- 無雲端後端

Store MSIX 刻意保持未簽章。Microsoft 在
認證完成後為 Store 套件簽章。

## 第一次套件遭拒

首次上傳使用了正確的應用程式視覺名稱，但保留了：

```xml
<Properties>
  <DisplayName>MirrorMe</DisplayName>
</Properties>
```

`MirrorMe` 不是預留的 Store 名稱。Partner Center 拒絕了該套件。

修正方式是參數化每個顯示名稱位置，並用以下內容重新建構：

```xml
<Properties>
  <DisplayName>Mirror Me Phone Display</DisplayName>
</Properties>
```

應用程式的視覺顯示名稱與 StartupTask 顯示名稱
都被改為相同的預留名稱。

教訓：驗證 `Package/Properties/DisplayName`，
而不只是 `uap:VisualElements/@DisplayName`。

## 名稱與商標決策

曾考慮包含 `AirPlay` 的名稱，但 Apple 的命名指引
使得未經許可在產品名稱中使用通訊協定商標並不理想。

預留的名稱避開了該商標。相容性措辭
改用在了商品列表中：

> 相容於來自 AirPlay 支援裝置的螢幕鏡像。

商品列表中也聲明：

> AirPlay 是 Apple Inc. 的商標。本應用程式與 Apple
> 沒有關聯，也未獲 Apple 背書。

教訓：當商標不應該出現於產品名稱時，
在描述中使用通訊協定相容性措辭。

## Partner Center 設定

定價與可取得性：

- 免費
- 所有現在與未來的市場
- 公開且可被搜尋到
- 認證完成後自動發布

屬性：

- 主要類別：Utilities + tools（工具）
- 次要類別：Photo + video（相片與影片）
- 個人資訊使用：是
- 已提供隱私權、網站與支援 URL
- 未支援的功能與無障礙聲明保持停用

年齡分級：

- 應用程式類型：All Other App Types（所有其他應用程式類型）
- 線上內容：是，因為應用程式顯示來自
  已配對手機的即時內容
- 銷售者策劃的成人內容：否
- 使用者通訊：否
- 購買項目與獎勵：否
- 精確位置共享：否
- 瀏覽器行為：否
- 結果：所有年齡分級，包含 ESRB Everyone 與 Microsoft 3+

教訓：顯示外部即時內容可能算作線上內容，
但並不會讓應用程式變成瀏覽器、通訊服務或成人內容目錄。

## 完整信任說明

說明涵蓋：

- Wails 與原生 Win32 桌面架構
- 同一執行檔的接收器工作程序
- DNS-SD 發現
- Media Foundation、GDI 與 WASAPI
- 封裝的啟動工作行為
- 通知區域與生命週期整合
- 無權限提升、驅動程式、服務、全域系統設定或雲端後端

教訓：指名具體的原生行為，並明確排除應用程式
未使用的更高風險系統整合。

## Store 商品列表

商品列表包含：

- 具體的連線步驟
- 同一網路需求
- 配對 PIN 行為
- 本機隱私權行為
- 防火牆與多播需求
- 受保護內容與 DRM 限制
- Apple 商標所有權聲明
- GPL v3 或更高版本與對應原始碼（corresponding-source）資訊
- 真實的亮色與暗色應用程式螢幕擷取畫面

兩張螢幕擷取畫面在上傳前調整為 Store 建議的寬度。

## 螢幕擷取畫面上傳的怪癖

Partner Center 在每次螢幕擷取畫面上傳之後都會
建立新的隱藏檔案輸入項。透過輸入項索引 `0` 上傳兩張
螢幕擷取畫面，會指向或取代第一張；第二張必須使用下一個輸入項索引。

教訓：每次上傳後重新計算 `input[type="file"]`，
並對下一張影像使用新建立的輸入項。

## 認證說明

測試備註說明了：

- 同一網路的設定
- iPhone 控制中心與螢幕鏡像的連線流程
- PIN 配對
- 全螢幕與通知區域行為
- 封裝的 StartupTask 行為
- 同一執行檔的工作程序架構
- 防火牆與多播需求
- 受保護內容的限制
- 商標與非關聯措辭

不需要任何憑證。

## WACK

WACK 命令傳回退出碼零，但請求的 XML 報告
未找到。真正的報告生成為：

```text
%LOCALAPPDATA%\Microsoft\AppCertKit\MirrorMe-WACK-report.htm
```

HTML 報告顯示：

```text
Overall result: PASSED
```

必要與選用測試都已通過。

教訓：找到並解析產生的報告。
不要只信任程序的退出碼。

之後提交另一個完整信任桌面應用程式時使用了
WACK 10.0.26100.8249：

- 以 `.htm` 結尾的報告路徑以退出碼 -1 失敗，
  並出現 `The report output file path should point to a XML file.`
- 以 `.xml` 結尾的路徑成功。WACK 將 XML 報告寫入該路徑，
  並將 HTML 渲染版本寫入 `%LOCALAPPDATA%\Microsoft\AppCertKit\<相同基底名稱>.htm`，
  兩者都在它結束之前完成。
- XML 根元素 `REPORT` 帶有 `OVERALL_RESULT`、`VERSION`（工具包
  版本）、`APP_NAME`（套件身分識別名稱，而非顯示名稱）、
  `APP_VERSION`、`PARTIAL_RUN` 與 `ReportGenerationTime`。HTML 報告
  顯示相同的報告時間，將兩個檔案連結在一起。
- `OVERALL_RESULT` 是 `PASS`、`FAIL` 或 `WARNING`。HTML 報告將它們
  顯示為 `PASSED`、`FAILED` 與 `PASSED WITH WARNINGS`。原始的
  `invoke-wack.ps1` 只讀取 `Overall result:` 之後的第一個字，所以
  它會將 `PASSED WITH WARNINGS` 報告為 `PASSED`。
- 選用的 `Blocked executables` 測試失敗，但整體結果
  仍是 `PASS`。WACK 標記了對程序啟動 API
  `kernel32.dll!CreateProcessW` 的引用，以及主要執行檔中對
  受封鎖執行檔（如 `Cmd`、`powershell` 與 `REG`）的引用，
  以及隨附輔助執行檔中的 `bash` 與 `reg`。報告說選用測試
  「僅供參考，不會在 Microsoft Store 上架過程中
  用於評估您的應用程式」。
- `%LOCALAPPDATA%\Microsoft\AppCertKit` 也存放了大約 30 個不相干的 XML 檔案，
  例如日誌與任務排程。只有根元素為 `REPORT` 的
  檔案才是 WACK 報告。

教訓：將 XML 報告視為唯一事實來源，讓其身分識別
名稱與版本與套件相符，且只有在沒有 XML 報告時
才退回使用 HTML 報告。

## 協議與最終提交

Partner Center 要求：

- App Developer Agreement - Windows Store
- Version 8.11

該精確協議作為有約束力的法律協議呈交給使用者。
在明確核准之後，Windows 協議列被接受，並透過
其接受日期驗證。

重新載入後，每個區段都恢復為 `Complete`，套件恢復為
`Validated`，**Submit for certification** 也變為啟用。

已告知使用者核准會自動發布產品。
在取得新的明確核准後，該按鈕被按下一次。Partner Center
變為：

```text
認證中
提交
前處理
認證
發布
```

提交後出現選用的回饋問卷，未被觸動。

## 提交時的殘留風險

- 廣泛的實體裝置與網路測試尚未完成。
- 罕見的結束卡住問題尚未被確定排除。
- 對通訊協定互通性、商標、編解碼器專利與
  GPL 分發的法務審查仍屬審慎之舉。
- `runFullTrust` 仍需要 Microsoft 的認證核准。

教訓：通過套件驗證與 WACK 不會消除產品、
互通性、法務或受限制功能的風險。
