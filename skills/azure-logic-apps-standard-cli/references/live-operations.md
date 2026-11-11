# 線上工作流程、執行與診斷

在進行執行階段工作流程檢查／匯出／變更、叫用、診斷、
取消或重放之前為強制必讀。基準：`logicapp` 1.0.0b1。套用 `SKILL.md` 的目標選取、
授權、機密輸出以及強制性執行階段就緒規則。

## 目標選取與檢查

本機範例使用先前已驗證過且位於連接埠 7071 的主機。雲端對等命令則將
`--local --port 7071` 替換為 `--resource-group GROUP --name APP --subscription SUBSCRIPTION_ID`。
明確選取的 API `--context NAME` 會替換那些目標旗標；請勿混用。
帳戶選取仍獨立於內容環境 (context)。

工作流程的 list／show／export／set／delete 查詢的是可連線的執行階段，而非離線路徑。
離線工作請讀取編寫的檔案並執行 `workflow validate --path PROJECT_ROOT`。
主機必須就緒，但不需要有正在進行的工作流程執行。

```azurecli
az logicapp workflow list --local --port 7071 --max-items 10 --output table
az logicapp workflow show --local --port 7071 --workflow Orders
az logicapp workflow export --local --port 7071 --workflow Orders --output-path Orders.backup.json
```

List 會傳回 `value` 加上 `nextContinuationToken`；可使用 `--max-items` 與
`--continuation-token` (別名為 `--next-token`) 進行分頁。請原封不動傳遞 Token；它們是位移量 (offsets)，
而非快照 (snapshots)。庫存變更可能會導致分頁邊界偏移。Show 會傳回完整的
編寫工作流程與 ETag；表格輸出會省略定義／修訂版本詳細資訊。
Export 會保留編寫的種類／組態，並回報其來源 ETag。

Export 是針對單一工作流程，而非應用程式備份：它不會下載設定、連線、
產物或已解析的運算式數值。定義中可能包含機密的常值。
在將匯出內容保存至共用位置或原始碼控制之前，請進行審查／保護。請使用全新的
一般 `.json` 目的地，僅在經過審查的替換情況下才使用 `--force`。

## 替換或刪除單一既有線上工作流程

先決條件：明確核准選取的目標／影響、保留匯出內容與修訂版本、
協調多個寫入者，以及針對 `set` 備妥經審查的完整替換檔案。

```azurecli
az logicapp workflow set --local --port 7071 --workflow Orders --file Orders.edited.json --if-match SAVED_ETAG --allow-non-atomic
```

依據 Shell 規則為實際儲存的 ETag 加上引號，並保留其精確數值。
`set` 接受完整的原始工作流程檔案，而非純定義或修補檔 (patch)。它會保留種類、
要求工作流程必須存在、執行靜態驗證與已完成的目標執行階段驗證，
並驗證寫入的位元組。它不會發佈共用設定／連線，也不會新增
雲端工作流程。未完成的驗證 HTTP 202 並非已完成的預先檢查 (preflight)。

刪除作業具備相同的核准、保留匯出、修訂版本與非不可分割先決條件：

```azurecli
az logicapp workflow delete --local --port 7071 --workflow Orders --if-match SAVED_ETAG --allow-non-atomic
```

這兩個命令除非 `--yes` 已獲得明確授權，否則都會跳出提示。即使未提供選用的 `--if-match`，
精確的強修訂版本檢查依然適用；提供它則會綁定至稍早編輯時的
修訂版本。萬用字元、弱修訂版本以及 `--force` 繞過均不被支援。

即使加上 `--yes`，依然必須提供 `--allow-non-atomic`。VFS 可能會產生競爭或殘留部分寫入；
不保證具備復原機制 (rollback)。並行刪除可能會允許在寫入期間重新建立。
衝突或不確定的接收結果需要進行檢查，而非盲目重試或無條件還原。
唯讀／從套件執行 (run-from-package) 的目標可能會拒絕寫入；此時應改用經授權的完整部署。

Delete 僅會移除該工作流程的 `workflow.json`，而不會移除其資料夾／同級／共用檔案、
作用中執行或歷程記錄。檔案不存在並不立即代表執行階段已完成移除。
Set 位元組驗證並非重新載入／執行的證明。在變更後，請分開檢查
執行階段 Metadata 並測試獲核准的行為。

**檢查關卡：** 保留的匯出／修訂版本、驗證後的檔案結果、分開的執行階段觀察，
以及若任一驗證不完整時提供的明確不確定性／復原指引。

## 啟用或停用單一已部署的工作流程

僅支援已部署的 Standard Stateful／Stateless 工作流程，不支援本機線上狀態 API。
確認設定讀取／寫入權限，並協調**所有**應用程式設定寫入者：

```azurecli
az logicapp workflow disable --resource-group GROUP --name APP --workflow Orders --allow-non-atomic --subscription SUBSCRIPTION_ID
```

當要求的是啟用作業時，改用 `workflow enable`；請勿兩者皆執行。
這些命令會設定 `Workflows.<workflow-name>.FlowState`。底層 API 會替換
整個應用程式設定對應表：儘管有快照檢查與讀回，無關的並行變更仍可能會遺失。
即使加上 `--yes`，仍必須明確核准承擔該非不可分割風險。
不提供保證的復原機制、捏造的 ETag 防護或自動重試。

將 `configuredState` 與 `runtimeState`／收斂狀態分開讀取。擱置中或未知的
收斂狀態並非停止分派的證明。即使是已收斂的 Metadata 也無法證明
執行已排空。停用並不會取消正在處理／擱置中的執行、停止應用程式或清除
歷史記錄；啟用則可能會處理積壓的工作。設定變更可能會引發代管／重新載入效應。

針對經授權的本機啟動組態，配套程序是在本機設定的 `Values` 下編輯
對應的 FlowState 機碼，並僅重新啟動所擁有的主機。
這並非線上本機啟用／停用 API；請保留其他設定並保護數值。
進行任何重新啟動時，均須遵循強制性的本機執行階段程序。

## 叫用並觀察獲核准的行為

確立實際的工作流程／觸發程序名稱、種類、承載、環境以及允許的外部
影響。本機叫用仍可能會變更真實服務的資料。

```azurecli
az logicapp run start --local --port 7071 --workflow Orders --trigger manual --payload-file payload.json
```

檢查結構化結果，並擷取**實際**傳回的執行識別碼 (若存在)。
請勿猜測識別碼，亦不可從已接受的叫用推斷已成功完成。
針對具有實際識別碼的 Stateful 執行：

```azurecli
az logicapp run wait --local --port 7071 --workflow Orders --run-id RUN_ID --timeout 300 --interval 5
az logicapp run show --local --port 7071 --workflow Orders --run-id RUN_ID
```

| `run wait` 結束代碼 | 意義 |
|---|---|
| 0 | 觀察到 Succeeded |
| 4 | 觀察到另一個終端狀態 |
| 2 | CLI 觀察期限截止，非工作流程 TimedOut |
| 1 | 觀察／通訊協定錯誤 |

等待並不會取消、重試或復原執行。請分開驗證所需的輸出與
影響；工作流程狀態本身並不代表商業邏輯的正確性。

Stateful 歷史記錄／控制命令並非通用的 Stateless 控制項目，即使存在
Stateless 偵錯歷史記錄亦然。針對 Stateless 工作，請視情況使用受支援的叫用回應、
獲核准的遙測或原生測試。回報缺少的持久佐證；
請勿僅為了讓診斷看起來像 Stateful 行為而啟用歷史記錄／變更種類。

## 在執行階段可連線時進行診斷

從執行與動作 Metadata 開始著手，而非僅依賴主控台輸出：

```azurecli
az logicapp run list --local --port 7071 --workflow Orders --status Failed --max-items 10
az logicapp run show --local --port 7071 --workflow Orders --run-id RUN_ID
az logicapp run action list --local --port 7071 --workflow Orders --run-id RUN_ID
az logicapp run action show --local --port 7071 --workflow Orders --run-id RUN_ID --action ACTION_NAME
```

原封不動遵循受支援的執行清單接續 Token。跳過的相依動作
不一定是根本失敗原因。運算式失敗可能會有 Metadata 錯誤但沒有輸出；
失敗的 HTTP 動作反而可能含有實用的回應內容。
僅在需要且獲授權時才擷取具上限的已記錄內容：

```azurecli
az logicapp run action show-content --local --port 7071 --workflow Orders --run-id RUN_ID --action ACTION_NAME --max-bytes 16384
```

輸出預設會顯示；僅在需要時使用 `--content inputs`。承載／提供者錯誤
即使有預設的 URL 遮蔽處理，仍可能包含秘密。內容連結包含 SAS 認證：
除非需要立即診斷，否則請勿使用 `--show-content-urls`；絕不要保存或
共用原始連結。檢查結束代碼為 0 代表讀取成功，而非工作流程成功。

**檢查關卡：** 在可用情況下提供實際失敗動作／平台佐證，或對缺少的
歷史記錄／回應／遙測提出精確說明。在停止所擁有的主機之前完成診斷。

## 僅在明確核准下取消或重放

這些 Stateful 作業可能會影響外部系統。它們不是自動診斷
步驟。在使用確認繞過旗標 `--yes` 之前，請先確立具體目標與影響。

```azurecli
az logicapp run cancel --local --port 7071 --workflow Orders --run-id RUN_ID --wait --timeout 60 --interval 2
```

認可 (acknowledgement) 並不等於觀察到的取消狀態。搭配 wait 時，結束代碼 0 代表觀察到 Cancelled
或已處於終端狀態且未變更的來源；4 代表另一個終端成果；2 代表
觀察期限截止；1 代表觀察／通訊協定錯誤。請檢查結構化結果。
取消無法復原影響，亦無法保證進行中的動作立即停止。逾時不會發送
額外的取消請求或進行重試。

根據已驗證的來源佐證，精確選擇一種重放類型：

| 作業 | 必要來源與解讀 |
|---|---|
| `run resubmit` | 已完成之 `--run-id` 中已執行的單一 `--action`；執行階段必須明確宣告 `canResubmit=true` |
| `trigger history resubmit` | 選定之 `--workflow` 與 `--trigger` 所保留且已引發的精確 `--history-name`；非執行識別碼 |

```azurecli
az logicapp run resubmit --local --port 7071 --workflow Orders --run-id COMPLETED_RUN_ID --action ACTION_NAME
```

```azurecli
az logicapp trigger history resubmit --local --port 7071 --workflow Orders --trigger manual --history-name HISTORY_ID
```

這兩者為替代方案。動作重新提交會使用來源版本與保留的先前
結果搭配目前的設定／連線。選取／相依的動作可能會重複產生影響。
觸發程序重放是不同的作業，並非不合資格動作的後備方案。兩者皆非就地
繼續或剛好一次 (exactly-once) 的復原。請勿啟用執行階段功能來繞過資格限制。

HTTP 202 代表接受，非完成。僅等待服務傳回的 `newRunId`。
`acceptedNewRunIdUnknown` 需要回報不確定性；請勿選取最新的執行、
替換識別碼、透過 Location URL 憑空創造身分識別，或自動重試。

**檢查關卡：** 已要求、已接受、已觀察與未知的成果維持分開界定。
在考慮刻意復原之前，先回報不確定的影響與保留的資源。
