# 連接器探索、驗證機制與連線

在進行連接器探索、連線作業、身分識別或 ACL 變更之前為強制必讀。
基準：`logicapp` 1.0.0b1。套用 `SKILL.md` 的授權／秘密規則。雲端變更
需要明確授權的訂用帳戶、資源群組、應用程式、位置與範圍。
下列大寫名稱為預留位置，非實際探索出的連接器 Metadata。

## 探索實際的作業與驗證機制支援

針對內建／服務提供者 (service-provider) 連接器，請先透過
強制性的本機執行階段程序建立經授權且就緒的主機。查詢其目錄：

```azurecli
az logicapp connector list --local --port 7071
az logicapp connector show --local --port 7071 --connector CONNECTOR
az logicapp connector operation list --local --port 7071 --connector CONNECTOR
az logicapp connector operation show --local --port 7071 --connector CONNECTOR --operation OPERATION
```

針對受控連接器，使用預期的訂用帳戶檢查區域 ARM 目錄：

```azurecli
az logicapp connector managed list --location LOCATION --subscription SUBSCRIPTION_ID
az logicapp connector managed show --location LOCATION --connector CONNECTOR --subscription SUBSCRIPTION_ID
az logicapp connector managed operation list --location LOCATION --connector CONNECTOR --subscription SUBSCRIPTION_ID
az logicapp connector managed operation show --location LOCATION --connector CONNECTOR --operation OPERATION --subscription SUBSCRIPTION_ID
```

這些目錄彼此不可互換。記錄精確的連接器／作業識別碼、連線
類別、參數集、必要輸入以及支援的驗證機制。若 Metadata 未能
確立身分識別支援或本機認證行為，請參閱權威連接器
文件。請勿將驗證錯誤視為不支援身分識別的佐證。
請勿從觸發程序作業推斷動作，亦不可套用類似連接器的參數結構。

## 預設使用受控識別

針對新連線，一律使用受控識別，除非客戶明確要求其他
方法，或該連接器／作業不支援受控識別。若不支援，請在
連接認證配置之前先說明佐證並確立替代方案。絕對不可為了
排除失敗而無提示地降級為連線字串、服務主體或 OAuth。

針對既有專案，保留正常運作的驗證機制，除非移轉已獲授權。
可建議受支援的身分識別移轉方案，但不可在未經要求的情況下逕行執行。

針對新專案交付：

1. 設定連接器支援的以身分識別為基礎的本機連接配置。本機處理程序會使用
   其記錄的開發認證機制，而非已部署應用程式的身分識別。
   驗證所選取的本機主體；請勿假設通用的 `DefaultAzureCredential`。
2. 針對經授權的部署／佈建，預設啟用應用程式身分識別。保留既有的
   身分識別慣例；否則選取系統指派。針對明確的穩定／共用／預先佈建主體
   需求，使用使用者指派。
3. 分開確認應用程式主體、連線授權／存取政策以及資料平面存取權限。
   僅在最窄的適當範圍內指派所需角色。
4. 若 Azure 變更超出範圍，請設定允許的本機檔案，並回報未完成的
   應用程式身分識別／授權先決條件。請勿宣稱雲端身分識別已啟用。

身分識別指派屬於累加性質，並不會自動授與連接器存取權：

```azurecli
az logicapp identity show --resource-group GROUP --name APP --subscription SUBSCRIPTION_ID
az logicapp identity assign --resource-group GROUP --name APP --system-assigned --subscription SUBSCRIPTION_ID
```

僅在需要且獲授權時才執行指派，隨後驗證其狀態。針對獲授權的
使用者指派身分識別，重複使用 `--user-assigned IDENTITY_RESOURCE_ID`。
請勿隱含建立使用者指派資源或附加無關的身分識別。
移除身分識別是一項會明確影響存取權限的作業，絕不可當作測試後的清理步驟：

```azurecli
az logicapp identity remove --resource-group GROUP --name APP --system-assigned --subscription SUBSCRIPTION_ID
```

僅使用選定的身分識別旗標，而非所有旗標。在移除前先確認相依的連線。

## 建立本機服務提供者連線

建立前先檢查目前的別名、設定名稱、參考以及忽略規則。
`connection create` 會寫入本機 `connections.json`；設定則寫入至
`local.settings.json`。此本機作業不會啟用任何雲端身分識別。
明確選取探索到的身分識別參數集；該命令的預設參數集
並非此 Skill 的驗證政策。

下列範本示範巢狀參數與運算式，並非通用的輸入
名稱。請將 `ENDPOINT_PARAMETER`、`IDENTITY_PARAMETER_SET` 及其他預留位置替換為
探索到的實際數值。`authProvider.Type` 欄位亦必須針對該連接器進行確認。

POSIX Shell 範例；請使用該 Shell 的實際專案路徑：

```bash
az logicapp connection create --path App --name ALIAS --connector CONNECTOR --parameter-set IDENTITY_PARAMETER_SET --parameter "ENDPOINT_PARAMETER=@appsetting('ENDPOINT_SETTING')" --parameter authProvider.Type=ManagedServiceIdentity --app-setting ENDPOINT_SETTING=NONSECRET_ENDPOINT
```

Windows PowerShell 呼叫 `az.cmd` 時可能會遺失運算式的引號。請使用其 Windows
專用的停止剖析語法語彙基元 (stop-parsing token)，並將所有剩餘引數放在同一實體行中：

```powershell
az logicapp connection create --path App --name ALIAS --connector CONNECTOR --parameter-set IDENTITY_PARAMETER_SET --% --parameter "ENDPOINT_PARAMETER=@appsetting('ENDPOINT_SETTING')" --parameter authProvider.Type=ManagedServiceIdentity --app-setting ENDPOINT_SETTING=NONSECRET_ENDPOINT
```

在 `--%` 之後，PowerShell 變數將不會展開；請勿貼上預期會替換的變數。
在建構呼叫命令之前先解析非機密的常值。在其他 Shell／平台上，
請使用其引號規則；切勿複製 `--%`。必須精確保留 `@appsetting('NAME')`。
多個參數請重複使用 `--parameter`；點號代表巢狀數值。絕不可在
`--parameter` 或 `--app-setting` 中置入機密數值。

僅在獲得核准的非身分識別方法中，透過核准的安全來源取得
秘密，並直接將其透過管道輸入至 stdin。`--secret` 指定的是設定名稱，而非其數值。
範例假設環境變數已安全提供：

```powershell
$env:CONNECTOR_SECRET | az logicapp connection create --path App --name ALIAS --connector CONNECTOR --secret SECRET_SETTING
```

```bash
printf '%s' "$CONNECTOR_SECRET" | az logicapp connection create --path App --name ALIAS --connector CONNECTOR --secret SECRET_SETTING
```

當預設的連線字串繫結不符時，請使用探索到的 `--secret-parameter`。
絕不要為了診斷而 echo 秘密、將其置於命令常值中，或寫入純文字受測物。
透過適當的存取控制、Git 排除以及部署排除來保護必要的本機設定。
在適當情況下，對已部署的設定使用受支援的秘密存放區／Key Vault 參考；
請勿假設執行階段能接受任意的設定範本。

若連線／設定名稱已存在，建立作業將會失敗。`--force` 代表經審查的替換，
而非等冪性、秘密復原或授權繞過。

**檢查關卡：** 正確且已探索到的配置與設定參考、受保護的儲存體、已選取的本機
主體與權限已驗證或明確受阻；無洩漏的認證。

## 建立 Azure 受控 API 連線

請使用不同名稱的命令，而非已淘汰的 `connection create --managed-api` 語意：

```azurecli
az logicapp connection managed create --resource-group GROUP --logic-app-name APP --name CONNECTION --connector CONNECTOR --location LOCATION --auth-mode managed-identity --subscription SUBSCRIPTION_ID
```

先決條件：已為應用程式指派既有身分識別；探索到連接器／驗證機制支援；
已部署既有且具備強 VFS ETag 的有效 `connections.json`。遺失的檔案、弱
修訂版本或無效配置必須透過經授權的部署來解決，而非
無條件的檔案替換。此命令會建立 V2 ARM 連線、存取政策
以及應用程式檔案配置。這些是互相偶合的資源，並非一項交易 (transaction)。

`--name` 指定連線資源的名稱；`--logic-app-name` 指定應用程式名稱。僅對
已指派給該應用程式的身分識別使用 `--user-assigned-identity ID`。
當核准的方法有需要時，使用探索到的 `--parameter-set`、非秘密的重複 `--parameter`，
以及 stdin `--secret-parameter NAME`。

允許的驗證模式包括 `managed-identity`、`oauth`、`raw` 與
`service-principal`；模式可用並不證明它適用於所有連接器。
OAuth 屬於預設原則的例外情況，需要互動式同意：

```azurecli
az logicapp connection managed create --resource-group GROUP --logic-app-name APP --name CONNECTION --connector CONNECTOR --location LOCATION --auth-mode oauth --subscription SUBSCRIPTION_ID
```

`--no-browser` 會印出同意 URL，但仍需要能夠連線至 CLI
機器回送接聽程式 (loopback listener) 的瀏覽器；它無法實現無人值守的同意流程。同意逾時預設為
300 秒；僅在經過審慎評估時才以 `--consent-timeout` 覆寫。必須具備
已連線狀態；僅有 `consent.confirmed: false` 本身並不代表失敗，因為回呼常態上
不包含授權碼。

當同意、政策或配置失敗時，ARM 連線／政策可能會殘留，且認證／
存取權可能已變更。此時僅會嘗試受防護的檔案項目還原。在復原或重試之前，
檢查回報的資源、修訂版本、政策與檔案狀態。絕不可
假設逾時會自動清理資源、自動刪除保留的資源，或從
不完整的 ARM 讀回結果中還原認證／存取權。
`--force` 不會繞過強修訂版本、政策身分識別檢查或並行限制。

## 檢查、測試與保留別名

```azurecli
az logicapp connection list --resource-group GROUP --name APP --subscription SUBSCRIPTION_ID --output table
az logicapp connection show --resource-group GROUP --name APP --connection ALIAS --class managedApiConnections --subscription SUBSCRIPTION_ID
az logicapp connection test --resource-group GROUP --name APP --connection ALIAS --subscription SUBSCRIPTION_ID
```

list／show 讀取的是應用程式已部署的 `connections.json`，而非協調後的 ARM 清查。
未連接配置的資源不會出現；懸空的檔案參考可能會殘留。經過遮蔽處理的 URL／數值
並不保證提供者錯誤或工作流程承載不含秘密。設定名稱運算式
在未解析數值的情況下依然可見。

| 測試結果 | 結束代碼 | 必要回應 |
|---|---|---|
| `passed` | 0 | 連線測試通過；仍須驗證必要的商業行為 |
| `failed` | 1 | 檢查平台失敗原因 |
| `authorizationFailed` | 1 | 驗證主體／授權；執行經精確授權的作業 |
| `couldNotReach` | 1 | 解決連線可達性問題；遵循 HTTP 429 的 `retryAfter` |
| `noTestAvailable` | 3 | 未驗證，非通過；在獲授權時執行工作流程 |

預設保留穩定運作的現有別名。若要整併，請追蹤所有工作流程參考、
確認資源共用／所有權、授權移轉，並一併更新相依參考。
Designer 產生的名稱並非重複的證明，亦非刪除的許可。
將環境專屬的資源參考保持為可設定；將執行階段 URL／金鑰保留在
受保護的設定中，而非納入原始碼控制的常值內。

## 刪除連線或變更存取權

在取消連結／撤銷任何內容之前，先評估影響並取得明確授權：

```azurecli
az logicapp connection delete --resource-group GROUP --name APP --connection ALIAS --subscription SUBSCRIPTION_ID
az logicapp connection acl list --resource-group GROUP --connection RESOURCE_NAME --subscription SUBSCRIPTION_ID
az logicapp connection acl show --resource-group GROUP --connection RESOURCE_NAME --policy POLICY_NAME --subscription SUBSCRIPTION_ID
az logicapp connection acl add --resource-group GROUP --connection RESOURCE_NAME --object-id PRINCIPAL_ID --subscription SUBSCRIPTION_ID
az logicapp connection acl remove --resource-group GROUP --connection RESOURCE_NAME --policy POLICY_NAME --subscription SUBSCRIPTION_ID
```

僅選取預期的作業；這些並非循序步驟。ACL 需要 V2 連線；
每個主體允許一項政策。移除作業會立即移除該主體的存取權。
僅針對先前核准的目標／影響使用 `--yes`。

受控刪除會在取消連結前檢查所有權、使用全新的精確強 ETag，並在 ARM 清理前
確認取消連結。無效／跨範圍的資源識別碼即使加上 `--keep-resource` 也會遭到拒絕；
請明確管理跨範圍資源，切勿透過繞過檢查來處理。
僅有可證明為專屬的系統指派政策才符合自動移除資格。
共用的使用者指派政策／資源將會保留，即使該身分識別屬於此應用程式亦然。
所有權佐證模稜兩可／不完整時，會附帶理由保留資源。
`--keep-resource` 會刻意保留連線且不會撤銷共用存取權。
被參考的應用程式設定會予以回報，但不會被刪除。衝突、部分取消連結與後續的
清理失敗均需要檢查；請勿無條件重試或重新播放舊的配置。

**檢查關卡：** 預期的配置／存取權已驗證、所需的資料平面授權分開驗證，
且保留／共用的資源或不確定的影響已明確回報。
