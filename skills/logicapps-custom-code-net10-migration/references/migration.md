# 必要遷移程序

## 識別並界定專案範圍

自訂程式碼是一個 SDK 樣式的**函式庫**，帶有 Workflows SDK 套件與
`LogicAppFolderToPublish`。目的地包含帶有
`Microsoft.Azure.Functions.ExtensionBundle.Workflows` 套件的 `host.json` 以及本機
`APP_KIND=workflowapp` 設定。這些檢查可防止誤用一般的 .NET／Functions 升級。
請勿假設名為 Functions 的資料夾包含獨立的 Function 應用程式。

在編輯前，請檢視工作區根目錄、現有工作與有效的工具設定。檢查繼承的
`global.json`、`Directory.Build.*`、集中式套件管理以及匯入／條件式
屬性。多個專案或共用的 SDK／套件檔案需要明確的
選擇與影響審查。輔助程式會刻意停止，而非自行猜測。

[11 月 5 日公告](https://techcommunity.microsoft.com/blog/IntegrationsonAzureBlog/logic-apps-standard-custom-code-now-supports-net-10/4570808)
記錄了搭配 VS Code 延伸模組 5.1013.2 與 Logic Apps
Standard 延伸模組套件 1.194.31 的 .NET 10 自訂程式碼支援。遷移前請驗證這些發行先決條件。

請勿顯示本機設定、承載（payloads）或包含認證的差異。輔助程式僅回報
檔案名稱與變更類別，絕不回報本機設定值。其暫存寫入可能包含
本機設定；正常完成後會在取代後移除它們，而非保留永久備份。
強制終止可能會繞過清理並留下名為
`.<original filename>.<random>` 的檔案，包含含有認證的 `.local.settings.json.*`。
在套用前，請驗證原始碼控制與部署排除項目涵蓋這些名稱；
僅比對 `local.settings.json` 的排除項目是不夠的。在提交或封裝前檢查是否有殘留檔案，
並透過核准的機密處理程序僅移除已確認屬於遷移擁有的檔案，且不顯示其內容。
保留現有的忽略規則；輔助程式不會自動新增排除項目。

在進行任何驗證建置前，請檢視自訂目標、發佈相依性與
儲存庫建置工作，確認是否有網路／部署影響。當存在自訂發佈 hooks 或未解析的 hook 運算式時，
輔助程式會拒絕引入建置時發佈（publish-on-build）。
它會保留現有的建置時發佈 hook，但會回報自訂發佈 hooks；
保留並不代表允許執行它們。在建置前（包含在可拋棄式複本中），
請透過單獨授權的變更來檢視或停用外部影響。

取代寫入會保留 Windows 擁有權、群組、自由選擇存取控制清單（discretionary ACLs）、完整性標籤
與 ACL 繼承保護，或 Linux 擁有權、模式與存取控制延伸屬性。
在設定位元組進入暫存檔案之前，就會先套用存取限制。
無法讀取／寫入的存取 Metadata、加密的 Windows 檔案系統檔案與其他
POSIX 平台會封鎖套用，而非退回為僅限模式的取代。

## 必要設定對齊

| 設定 | 變更 |
|---|---|
| `TargetFramework` | `net8`/`net8.0` 至 `net10.0`；函式庫身份／配置維持不變 |
| Workflows SDK | 升級至 `1.4.1`；採用前請先審查較新的目標 |
| Worker SDK | 至少為已審查的 `2.0.7`；保留已經較新的穩定版本 |
| `CopyLocalLockFileAssemblies` | `true` |
| 建置時發佈（Publish on build） | 保留現有 hook；當自訂發佈 hooks 需要副作用審查時封鎖插入 |
| 主機 `Values.LOGIC_APPS_CUSTOMCODE_DOTNETVERSION` | 確切為 `net10.0` |
| 主機 `Values.FUNCTIONS_INPROC_NET8_ENABLED` | 保留 `1`；主機仍需要此設定，且為輔助程式先決條件 |
| Functions 編輯器部署路徑 | 僅取代 `net8`/`net8.0` 路徑元件 |

此處的版本為選定的遷移基準，而非獨立建立的通用最低需求。
Workflows SDK 1.4.1 取代了有錯誤的 1.4.0 版本。在套用遷移或還原前，
請從核准的 NuGet 摘要驗證可用性。仍需要對 1.4.1 進行還原／建置／執行階段驗證。

## 條件式相依性、建置保護措施與偵錯

若 Worker 已被直接參考，輔助程式會將其對齊至已審查的 `2.51.0`，
同時保留較新的穩定版本。它不會僅因框架變更而新增缺少的 Worker 參考。
僅在應用程式／建置證據需要時才新增相依性；保留原始碼並無法確立相容性。

Worker Core 2.51.0 相依於 Microsoft.Extensions.Hosting 10.0.0。當選取直接 Worker
參考時，輔助程式會將低於 `10.0.0` 的現有直接 Logging／Logging.Abstractions
固定版本（pins）提高，並保留較新的版本。若無直接 Worker 參考，則會保留
記錄固定版本。請保留相依性，而非不加區分地刪除它們。
其他直接框架系列固定版本也可能導致還原衝突：請檢視實際的
還原診斷並僅對齊受影響的相依性。請勿全面升級具有獨立版本控制的套件，
例如 Microsoft.Extensions.Azure。

請勿僅為了此遷移而新增 ApplicationInsights.WorkerService、Http.AspNetCore 或 ASP.NET Core 框架參考。
現有的應用程式需求維持不變。

**僅在全新建置因缺少 function-JSON 掃描目錄而失敗時**，使用輔助程式旗標 `--ensure-output-directory`
新增此保護機制。該失敗是在 Workflows SDK 1.4.0 中觀察到的；請勿假設 1.4.1 需要此因應措施。

```xml
<Target Name="EnsureOutputDirectory" BeforeTargets="DeleteFunctionJsonFoldersTarget">
  <MakeDir Directories="$(MSBuildProjectDirectory)\bin\$(Configuration)\$(TargetFramework)"
           Condition="!Exists('$(MSBuildProjectDirectory)\bin\$(Configuration)\$(TargetFramework)')" />
</Target>
```

`FindFunctionJsonFolders` 是一個工作（task），而非目標（target）。輔助程式僅在現有無效 hook 的內容
符合該狹義因應措施時才修復它；它會拒絕衝突的自訂目標。
修復現有保護機制會保留其預期的保護作用；預設不會插入缺少的保護機制。
它會保留無關的自訂目標（包含無效的範例複製目標），並回報誤導性的 `net472` 目標以供審查。

## 保留主機與工作區設定

請勿更改現有的 `FUNCTIONS_WORKER_RUNTIME=dotnet`、
`FUNCTIONS_INPROC_NET8_ENABLED=1`、`APP_KIND=workflowapp` 或多語言背景工作
設定。請勿新增同處理序（in-process）.NET 10 旗標或將 Logic Apps 主機設定為
`dotnet-isolated`。保留 host.json、連線、身份驗證、工作流程定義、
忽略規則、設計階段設定與工作區／工作名稱。

請勿新增 `Program.cs` 或將函式庫轉換為獨立的背景工作主機。在 `OutputType=Library` 時，
`Main()` 方法不會自動執行。除非實際診斷需要單獨授權的原始碼變更，
否則請保留現有的實作／工作流程；在測試前請勿承諾它們能未經修改地編譯或執行。

輔助程式會保留來源專案路徑與特定機器的 Node 設定。
若移動解決方案，請在執行階段與設計階段設定中明確更新 `ProjectDirectoryPath`
並驗證 Node 可執行檔。重新定位並非目標框架遷移的隱含副作用。

輔助程式預設會保持所有偵錯程式設定不變。若要求／需要協調的
工作流程／自訂程式碼啟動，請在模擬執行與套用中使用 `--integrated-debug`。
這會新增一個同時包含 `coreclr` 與 `isCodeless=true` 執行階段的 `logicapp` 啟動項目，
同時保留舊的附加設定。預設 `coreclr` 主機的現有整合項目會被更新，
而不會覆寫無關屬性；多個不明確的候選項目需要手動選取。請選取該項目進行協調偵錯。
比較專案之間的差異並非通用的 .NET 10 需求。

Functions 部署路徑並非 Logic Apps 發佈路徑。若要求部署，共用的缺少
預先部署工作需要單獨審查；此技能未授權任何部署。
保留 `-nodeReuse:false` 與受控 Node／.NET PATH 慣例。

## 驗證關卡

1. 檢視**已解析的 VS Code 選取** .NET 與 Core Tools 可執行檔。驗證 SDK
   10、.NET 10 執行階段、現有 .NET 8 主機執行階段，以及任何已需要的 ASP.NET
   執行階段。檢視有效的使用者／工作區／資料夾工具設定；請勿將文字
   環境變數運算式注入設定中並假設會通用展開。
2. 使用明確核准的 NuGet 設定／來源進行還原。遵循組織
   Proxy 原則；未經適當授權，請勿替換為 nuget.org、安裝 SDK 或接受新的授權條款。
   輔助程式絕不執行還原。
3. 使用該可執行檔執行最小的儲存庫建置／分析器指令。例如：

   ```powershell
   & $dotnet restore $project --configfile $approvedNuGetConfig
   if ($LASTEXITCODE -ne 0) { throw 'Restore failed.' }
   & $dotnet build $project --configuration Debug --no-restore -nodeReuse:false
   if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
   ```

   解決真正的套件／API 失敗；未經單獨授權的原始碼變更，請勿抑制警告、排除函式或重寫 C#。
4. 在安全的可拋棄式複本中測試全新建置。SDK 清理會移除 `lib\custom`；
   請勿清理另一個作用中主機的輸出。若缺少 SDK 掃描目錄，請檢視並套用
   `--ensure-output-directory`，然後重試失敗的建置。請勿使用此旗標來掩蓋無關的失敗。
   確認 `<host>\lib\custom\net10.0` 包含**原始**專案組件／相依性，且產生的每個函式 Metadata
   存在於 `<host>\lib\custom` 下。檢視語言／函式庫參考與函式身份。
   僅有 `Functions\bin` 與獨立的 `functions.metadata` 是不夠的。
5. 在啟動主機前確認安全的本機觸發程序／連線影響。開啟現有的
   多根工作區，執行自訂程式碼建置工作，若已選取則啟動整合式偵錯程式
   （否則保留可運作的啟動／附加路徑），並驗證主機就緒狀態與函式探索。
   透過支援的觸發程序執行適當的現有工作流程，並檢視實際的本機函式結果；
   使用原始身份與非敏感 fixtures。
6. 驗證後僅停止工作擁有的工作階段／服務，除非要求保留它們。
   分開回報設定、建置與執行證據，包含已跳過的檢查。

## 後續部署先決條件（僅供回報）

針對 Azure 執行，已部署的 Logic Apps **應用程式設定**必須同時包含
`LOGIC_APPS_CUSTOMCODE_DOTNETVERSION=net10.0` 與 `FUNCTIONS_INPROC_NET8_ENABLED=1`。
即使自訂程式碼以 .NET 10 為目標，仍然需要 .NET 8 主機旗標。

透過 VS Code 中的 Logic Apps 延伸模組進行部署會將這些設定複製到 Azure。
管線部署必須明確包含這兩個應用程式設定。僅有本機設定檔並無法設定 Azure 應用程式。
即使僅進行本機遷移，也請回報這些先決條件，並將它們與已完成的本機變更區分開來。

請分開驗證預期的已部署執行階段是否支援 .NET 10 自訂程式碼。
請勿將變更 Azure 資源或部署／IaC 設定作為此技能的副作用。
任何此類變更都需要單獨界定範圍並經授權的工作，並進行目標／環境驗證。
產生的組件與 Metadata 既不確立雲端支援，也不代表成功的本機／已部署執行。

輔助程式沒有通用的套件／主機支援保證。較新的 Workflows SDK 行為、
其他配置與已部署主機支援需要最新的權威驗證。上述公告記錄了 .NET 10 支援；
套件版本仍為已審查的基準，且預期的執行階段設定與執行仍需要驗證。