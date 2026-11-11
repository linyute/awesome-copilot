# Verify 階段

在公開曝露任何內容之前，證明實作符合 `docs/spec.md`。套用 [skill 預設值](../SKILL.md#defaults)，並使用 `microsoft-foundry` 進行 agent 操作。在重新執行時，重新讀取 `docs/verify.md` 並僅重新執行尚未通過的檢查，加上其修正所觸及的任何內容。

在 Deploy 獲得核准之前，前端與後端僅在本機執行且絕不進行部署，即使使用內部輸入亦然。僅在程式碼變更時重新部署託管 agent 或其呼叫的 MCP 伺服器。基礎結構修正可在應用程式映像檔來自 `${SERVICE_<NAME>_IMAGE_NAME=}` 時重新佈建（[映像檔參數](azd-layout.md#container-app-settings)），但絕不可新增公用輸入。

從工作區根目錄執行每個 azd 命令，並在行內設定 `AZURE_DEV_USER_AGENT=microsoft_foundry_skill`。

## 1. 預檢 (Preflight)

- **azure.yaml：** 每個 agent 皆具備 `kind: hosted`、`protocols` 以及 `entryPoint` 存在的 `codeConfiguration`。每個 Container Apps 名稱為 32 個字元以內。
- **基礎結構：** `az bicep build --file infra/app/main.bicep` 成功。
- **相依性：** 已鎖定。
- **本機設定：** 從 `azd env get-values` 佈線 `.env` 與任何本機設定。僅顯示索引鍵名稱，絕不顯示數值。密碼秘密透過受控識別解析，絕不以常值形式呈現。

## 2. 本機執行 (Run locally)

1. 在背景啟動每個元件並開啟遙測：
   - MCP 伺服器
   - 後端
   - 前端
   - 每個 agent 執行 `azd ai agent run --no-client`

   以逾時機制輪詢就緒狀態。若元件啟動失敗，停止並回報其結束代碼與關鍵記錄行。
2. 為每個 agent 執行 `azd ai agent invoke --local "<scenario>"`；它僅證明就緒狀態與 skill 載入：使用 `AgenticIdentityToken` 的 toolbox 呼叫在本機會失敗 ("requires AgentInstanceClientId and AgentBlueprintClientId")。檢查後端健全狀況路由，並檢查 UI 是否正常載入。
3. 一旦 UI 正常運作，在 `.env` 中 upsert `LOCAL_FRONTEND`。為使用者保持應用程式執行（可用時採離線分離模式），並記錄如何啟動它。

## 3. 測試 (Test)

| 檢查 | 證據 |
| --- | --- |
| **驗收** | 每個 EARS ID 一個自動化測試：針對凍結契約的契約測試，以及透過前端 `/api` Proxy 執行的 E2E 測試（具 UI 時使用 Playwright）。以 c = max(1, ⌊0.8 × TPM × 每案例分鐘數 ÷ 每案例權杖數⌋) 並行執行 E2E 案例，此數值由單一案例的 Responses `usage` 與持續時間衡量得出（TPM = 容量 × 1000），並在 `docs/verify.md` 中記錄 c 及其輸入。重試後的 429 視為失敗。 |
| **託管** | 針對已部署版本執行 `azd ai agent invoke <agent> "<scenario>"`。若 agent 程式碼有變更請先執行 `azd deploy <agent>`。使用退避機制重試 424 或 502 熱身回應。 |
| **遙測** | 來自此執行的追蹤（包含後端 span）抵達 Application Insights（查詢過去 30 分鐘內的 `requests` 或 `dependencies`）。本機匯出工具以開發者身分登入（[observability](observability.md)）。 |
| **評估** | 將來自規格情境的至少 10 列寫入 `tests/eval/dataset.jsonl`。執行 `azd ai agent eval generate --agent <svc> --dataset tests/eval/dataset.jsonl --out-file tests/eval/<svc>.eval.yaml --evaluator builtin.task_adherence --evaluator builtin.intent_resolution`，當 agent 具備基礎時新增 `builtin.groundedness`。接著執行 `azd ai agent eval run --agent <svc> --config tests/eval/<svc>.eval.yaml`，每個 agent 一個設定，檢查其 `Agent: <name> v<N>` 列指名該 agent 與剛部署的版本，並保留設定與結果。 |
| **檢閱** | 全新情境的檢閱者對照每個需求、契約與 RBAC 列檢查程式碼與證據，並從 container app 修訂版本確認在 Implement 關卡之後建立的前端或後端修訂版皆未執行新映像檔（重新佈建可能會新增相同映像檔的修訂版）。 |

## 4. 修正 (Fix)

1. 在最小範圍內修正根本原因。
2. 每次修正後重新執行失敗的檢查，並在最後一次修正後重新執行完整套件一次。
3. 將經驗教訓 upsert 至 `docs/LOOP.md`（[範本](../assets/loop-template.md)）。

契約或範圍變更需先寫入 `docs/spec.md`。切勿為了放行通過而放寬測試或閾值。

針對失敗的評估列，讀取其個別列的結果。評審可能會判定正確的拒絕回答為失敗：當該列儲存的工具呼叫與輸出符合契約時，將其記錄為具備該證據的評估程式偽陰性 (false negative) 並保留 agent 的行為。切勿僅為了提高分數而變更 agent。

## 5. 記錄 (Record)

編寫 `docs/verify.md`，內容包含：

- 環境與本機 URL；
- 將每個需求 ID 對應至其測試、結果與證據的表格；
- 評估分數與指向該執行的連結；
- 遙測證據；
- 手動測試步驟；
- 遞延至 Deploy 的檢查及其原因；
- 待決問題。

## 關卡 (Gate)

僅在滿足以下條件時通過：

- 每個元件皆在此次執行中啟動；
- 每個驗收條件皆具備通過的測試、工作流程提示詞中列出的人工核准豁免（絕不可自行授與），或僅有已部署應用程式才能證明的檢查（例如 Easy Auth 或公用輸入）遞延至 Deploy；
- 報告列出證據項目（`{claim, source, result}`，最多 12 個）；缺乏證據的通過算作失敗；
- 每個評估程式皆達到規格的閾值（預設通過率為 0.8）；
- 追蹤抵達 Application Insights；
- 檢閱未發現未解決的缺陷。

回報：狀態、摘要、成品、假設、問題與經驗教訓。
