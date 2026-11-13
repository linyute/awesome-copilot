# Logic Apps 自訂程式碼 .NET 10 遷移技能

## 安裝

使用 GitHub CLI 2.90.0 或更新版本（`gh skill` 目前為預覽版），檢視該技能
並跨專案為 Copilot 安裝：

```powershell
gh skill preview github/awesome-copilot logicapps-custom-code-net10-migration
gh skill install github/awesome-copilot logicapps-custom-code-net10-migration --agent github-copilot --scope user
```

若要進行專案範圍的安裝，請在目標儲存庫中使用 `--scope project`。
安裝會讓代理程式可使用該技能；它不會執行遷移。

或者，將這**整個資料夾**複製到受支援的技能目錄中。個人安裝請使用
`<user profile>\.copilot\skills\logicapps-custom-code-net10-migration`；
專案安裝請使用 `.github\skills\logicapps-custom-code-net10-migration`。
僅複製原始碼儲存庫並不會安裝該技能。不需要任何外掛程式或第三方
Python 套件。此套件採用 MIT 授權。

## 先決條件

[11 月 5 日公告](https://techcommunity.microsoft.com/blog/IntegrationsonAzureBlog/logic-apps-standard-custom-code-now-supports-net-10/4570808)
記錄了發行先決條件與遷移設定：

- Azure Logic Apps (Standard) VS Code 延伸模組 5.1013.2，或支援 .NET 10 自訂程式碼的更新版本。
- Logic Apps Standard 延伸模組套件 1.194.31。
- VS Code 選取的 .NET 10 SDK／執行階段，以及現有的 .NET 8 主機執行階段。
- 用於離線設定輔助程式及其測試的 Python 3.11+。

## 使用方式

使用如下請求呼叫已安裝的技能：

> 使用 logicapps-custom-code-net10-migration 將此 Logic Apps Standard .NET 8 自訂程式碼工作區遷移至 .NET 10。保留主機與函式身份。

輔助程式也可以直接使用 Python 3.11+ 執行：

```powershell
python ".\scripts\migrate.py" --root "C:\src\MySolution"
python ".\scripts\migrate.py" --root "C:\src\MySolution" --apply
```

預設為模擬執行（dry run）。結束代碼 `0` 代表有效的計畫或成功的設定套用，
而非通過建置／執行階段測試；結束代碼 `1` 代表阻礙／失敗。針對多個專案，
請加上 `--project "C:\src\MySolution\CustomCode\Utilities.csproj"`。

預設遷移會保留缺少的直接 Worker 參考、未選取直接 Worker 時現有的
記錄固定版本（logging pins），以及所有偵錯程式設定。現有的 Worker
參考會對齊至已審查的基準，並調整相依的記錄固定版本。
請勿將範例相依性集合解讀為通用最低需求。

遷移目標為 `Microsoft.Azure.Workflows.Webjobs.Sdk` **1.4.1**，以納入
1.4.0 的錯誤修正。在套用遷移或還原套件前，請確認可從核准的
NuGet 摘要取得 1.4.1。設定測試並無法確立套件還原、建置或執行階段相容性。

條件式選項（在模擬執行與套用中包含相同選項）：

```powershell
python ".\scripts\migrate.py" --root "C:\src\MySolution" --integrated-debug
python ".\scripts\migrate.py" --root "C:\src\MySolution" --integrated-debug --apply
python ".\scripts\migrate.py" --root "C:\src\MySolution" --ensure-output-directory
python ".\scripts\migrate.py" --root "C:\src\MySolution" --ensure-output-directory --apply
```

針對協調的工作流程／自訂程式碼啟動，請使用 `--integrated-debug`，而非僅因
目標框架變更而使用。僅在 SDK 目錄掃描需要全新建置因應措施時，
才使用 `--ensure-output-directory`。無需此旗標即可修復狹義識別的現有
損壞保護機制。當兩者皆適用時，選項可以合併使用。

輔助程式支援直接、無條件的 SDK 樣式專案設定與 UTF-8
JSON/JSONC 設定（會保留註解與尾隨逗號）。它會從 `LogicAppFolderToPublish`
解析主機，且不假設範例資料夾或組件名稱。
使用 `--integrated-debug` 時，它會附加一個整合式偵錯程式項目並保留現有項目，
或更新明確的現有整合式啟動器。專案 XML 空白／註解會被保留，
但 XML 序列化器細節（如自閉合標籤間距）可能會變更。

它會拒絕不明確的配置、加密的本機設定、外部主機根目錄、條件式
或集中管理的套件／屬性定義、明確匯入、繼承的
`Directory.Build.*`/`Directory.Packages.props`/`global.json`，以及未經審查的較新 Workflows
SDK 目標。這些情況需要代理程式主導的審查；請參閱隨附程序。
缺少的工作區／工作檔案會回報為手動後續追蹤，而非私自捏造。

自訂發佈 hooks 與未解析的 hook 運算式會阻礙新增建置時發佈（publish-on-build）。
現有的建置／發佈 hooks 會被保留，但未經授權執行：在進行任何驗證建置前
（即使在可拋棄式複本中），請先檢視其網路／部署影響。

套用時會將原始檔案保留在記憶體中以便回滾，並檢查並行變更。
不會有意建立永久備份、網路存取、套件安裝、建置、主機執行或 Azure 操作。
必要時請透過您核准的程序檢查並備份設定。請勿與另一個正在修改相同檔案的編輯器／主機同時執行。

**寫入中斷警告：** 暫存檔案在原始檔案旁使用 `.<original filename>.<random>`。
強制終止可能會繞過清理程序，並將認證留在 `.local.settings.json.*` 中。
在套用前，請驗證原始碼控制與部署排除項目涵蓋這些暫存名稱，
而不僅是 `local.settings.json`。在提交或封裝前檢查是否有殘留檔案，
並透過您核准的機密處理程序僅移除已確認屬於遷移擁有的檔案，且不顯示其內容。

在暫存檔案接收設定位元組之前，會先複製現有的存取限制：
Windows 安全性描述元（包含繼承保護與完整性標籤），
或 Linux 擁有權、權限與存取控制延伸屬性。
當無法保留 Metadata 時，套用將會封鎖；其他 POSIX 平台與
加密的 Windows 檔案系統檔案需要手動遷移。

針對後續部署，Azure 應用程式設定必須同時包含
`LOGIC_APPS_CUSTOMCODE_DOTNETVERSION=net10.0` 與 `FUNCTIONS_INPROC_NET8_ENABLED=1`。
.NET 10 自訂程式碼仍然需要 .NET 8 主機旗標。輔助程式在遷移前
需要該主機旗標並會保留它。

透過 VS Code 中的 Logic Apps 延伸模組進行部署會將這些設定複製到 Azure。
若透過管線部署，請在其部署設定中明確包含這兩個應用程式設定。
僅有本機設定檔並無法設定 Azure 應用程式。請分開驗證已部署的執行階段。
輔助程式會回報這些先決條件，且不會執行任何 Azure 變更。

此技能會保留函式庫輸出，且不會建立 `Program.cs`：函式庫的 `Main()`
不會自動執行。原始碼／API 相容性仍需透過建置／執行階段檢查。

執行隨附的標準函式庫測試：

```powershell
python -m unittest discover -s ".\tests" -v
```

這些測試會練習合成的專案設定與失敗行為，而非真實的
工作流程執行或正式環境支援。套件基準來自檢視過的
Workflows SDK 1.4.0 目標與 Worker 2.51.0 套件 Metadata。更新後的 1.4.1 目標
仍需要還原／建置／執行階段驗證。上述公告記錄了 .NET 10 自訂程式碼支援；
請分開驗證選取的本機／已部署執行階段。

## 來源出處

改編自採用 MIT 授權的
[commit 2ee2905 的 custom-code-net10 技能](https://github.com/wsilveiranz/custom-code-net10/tree/2ee2905c84b2589972a354f0006a036420770ce0/skills/logicapps-custom-code-net10-migration)。
輔助程式與最初的 30 個迴歸測試來自該修訂版。此貢獻新增了
審查驅動的目標比對、發佈副作用與存取控制保護措施，以及額外的迴歸測試。