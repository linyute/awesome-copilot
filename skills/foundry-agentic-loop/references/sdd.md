# 規格驅動開發 (Spec-driven development, SDD)

SDD 將簡短需求轉化為已部署且具可重現性的解決方案：使用 azd 與 Bicep (AVM) 佈建全新 Foundry 專案與 Azure 資源，無金鑰且受全面監視。`foundry-agentic-loop-workflow` 動態工作流程循序執行四個階段。每個階段在具備全新情境的子代理人中執行，遵循其階段指引，必須通過證據關卡並留下持久成品：

| 階段 | 指引 | 關卡證據 | 成品 |
| --- | --- | --- | --- |
| Specify | [specify.md](specify.md) | 對 EARS 條件、契約、工作串流、驗證對應、放置與 RBAC 判定結果進行獨立檢閱 | `docs/spec.md`, `.azure/deployment-plan.md` |
| Implement | [implement.md](implement.md) | `azd provision`、託管檢查點、平行工作串流整合、建置與單元測試 | `docs/implementation.md` |
| Verify | [verify.md](verify.md) | 本機 E2E 與契約測試、獨立規格符合性檢閱、agent 評估 | `docs/verify.md` |
| Deploy | [deploy.md](deploy.md) | `azd up`、健全狀況檢查、已部署的冒煙測試與 E2E 測試 | `docs/deploy.md` |

在每個階段中，由負責人執行工作，具備全新情境的檢閱者重新執行檢查，修復者最多可進行 `maxFixLoops` 輪。唯有檢閱者的判定結果能放行關卡。Implement 會平行執行不相交的工作串流。

各階段會協調現有成品而非從頭開始，因此重新執行是安全的。經驗教訓寫入 `docs/LOOP.md`。每次執行都會將飛行記錄寫入 `.agentic-loop/runs/<runId>.json`，狀態包含 `running`、`awaiting-approval`、`blocked`、`deployed`、`verified`（或在 `to` 提前結束時為 `specified`/`implemented`）或 `error`，並在啟動時、繼續執行後的首個步驟、每個關卡與檢查點，以及結束時進行儲存。無法寫入記錄會使執行暫停在 `blocked-record-<step>`。每個工作區同時僅有一個作用中的執行：`.agentic-loop/active-run.json` 持有其租用權 (lease)，且在該租用權未滿 30 分鐘時拒絕啟動第二個執行。

## 啟動執行

1. **檢查進行中的執行。** 使用 `dynamic_workflows_manage` (`runs`) 列出執行項目，並將其與此工作區的 `.agentic-loop/runs/` 記錄進行比對。若有執行中或暫停的回合，進行回報並提供繼續執行的選項，而非啟動第二個執行。
2. **在 Chat 中進行預檢**（唯讀）：`az account show`、`azd auth login --check-status`、`azd ai agent --help` (azd Foundry 擴充功能)、`microsoft-foundry` 與引導程序。一次回報所有缺口，並在安裝或升級工具前先詢問。
3. **進行一次性釐清確認。** 僅針對答案會改變規格的問題提出具選項的詢問：使用者、資料、工具、UX 或合規性。從 canvas 提示詞取得訂用帳戶、區域與 azd 環境。否則確認目前的 az 預設訂用帳戶，將區域交由 Specify 的放置檢查決定，並推導出簡短的環境名稱（例如 `claims-triage-dev`）。
4. **鎖定模式。** upsert 根目錄 `AGENTS.md` 的 SDD 區段（[鎖定設定](../SKILL.md#choose-the-mode)）。工作流程亦會寫入此檔案，並拒絕鎖定為快速原型製作的工作區。
5. **啟動**工作流程，使用 `run_dynamic_workflow`，`name: "foundry-agentic-loop-workflow"`，並帶入以下 `args`：

   | 引數 | 用途 |
   | --- | --- |
   | `brief` | 必要。自給自足，包含使用者的回答與決策 |
   | `subscriptionId`, `location`, `environmentName` | 已知時傳入 Azure 目標 |
   | `scenarioId` | Canvas 提示詞範本 |
   | `autonomy` | `gated` (預設值) 暫停以待規格核准；`auto` 略過核准 |
   | `maxFixLoops` | 每個階段關卡的修復輪次，0–5 (預設為 2) |
   | `skipDeploy` | 在 Verify 後停止 |
   | `from` | 從此階段重新執行；除非最新記錄已通過所有先前階段否則予以拒絕 |
   | `to` | 要執行的最後階段 (預設為 `Deploy`)；當 `from` 與 `to` 設定為同一個階段時代表單獨執行該階段 |

   僅在使用者設定時傳遞 `limits`；預設值為 250 個子代理人、4 個並行數與 12 小時的作用中時間。
6. 回報執行識別碼與後續檢查點。執行在背景繼續進行，並在 Chat 中發佈階段與關卡訊息；Foundry Agentic Loop canvas 的 Build 索引標籤顯示即時 agents 運作。在抵達檢查點之前無需任何輸入。切勿主動輪詢；執行在暫停或結束時會自動發出通知。

## 檢查點與復原

**即時狀態優先。** 針對狀態、核准、繼續或部署請求，在讀取其飛行記錄之前，先使用 `dynamic_workflows_manage`（`runs`，接著 `inspect-run`）讀取該執行。執行狀態為最具權威性的依據：已取消的執行會保留其上次儲存的記錄狀態。

暫停時會發佈 `Needs you:` 訊息。請在單一訊息中進行回覆：何處暫停與原因、需要檢閱的檔案，接著將選項呈現為 `ask_user` 選項（核准或繼續、先修改或修正、維持暫停）。

| 暫停點 | 意義 | 請求時的 Chat 動作 |
| --- | --- | --- |
| `approve-spec-v1` | 規格就緒可供檢閱 | 摘要範圍、假設、區域與費用驅動因素；將請求的修改套用至成品中 |
| `approve-spec-r<n>-v1` | 自規格核准以來規格或計畫有變更，在 Implement 第 n 輪前觸發 | 摘要變更內容；核准將記錄新指紋 |
| `approve-deploy-v1` | 經由驗證並就緒可供部署 (一律暫停) | 摘要資源、費用、安全性與區域影響；套用請求的修改而不進行部署 |
| `approve-deploy-r<n>-v1`, `approve-deploy-r<n>-a<k>-v1` | 自部署核准以來部署計畫、規格、verify 報告或 azd 目標有變更，在第 n 輪之前或在其嘗試 k 之後觸發 | 摘要變更內容；核准將記錄新指紋 |
| `blocked-record-<step>` | 無法寫入飛行記錄 | 修正顯示的路徑或權限，然後繼續執行 |
| `blocked-<phase>-r<n>` | 關卡在修復輪次後仍失敗、子代理人結束兩次且未繳交報告 (通常為提供者錯誤)，或需要做出決策 (權限、配額、費用、安全性) | 在飛行記錄的 `phases` 中列出該階段與輪次的每個問題，而非僅列出記錄中的第一個。在成品中修正並驗證每個根本原因，記錄證據與 `docs/LOOP.md` 經驗教訓。繼續執行會啟動第 n+1 輪，從目前狀態接續進行；其檢閱首先確認這些問題已解決。若要改為接受某個問題，僅在使用者明確決策下，於繼續執行前將 `[{"issue": "<exact issue>", "reason": "..."}]` 寫入 `.agentic-loop/waivers/<runId>.json`。在第 20 輪之後，啟動新執行或使用 `from` 與 `to` 單獨重新執行該階段。 |

- 僅在使用者提出要求時，才使用 `run_dynamic_workflow` 與 `resumeFromRunId` 繼續執行。當 canvas 提示詞指出「Do not resume the run」時，切勿繼續：canvas 會負責繼續該執行。
- **活躍度 (Liveness)。** 工作流程子代理人不會出現在 `list_agents` 或 `read_agent` 中，且單一 Implement 步驟可能執行超過一小時而無記錄變更。Canvas Build 索引標籤會顯示即時子代理人活動。切勿為了打破卡住狀態而取消、暫停或重新啟動執行；唯有使用者才能做出該決定。
- **提供者錯誤。** 結束且未繳交報告的子代理人會重試一次，並附帶從目前狀態接續進行的指示；第二次遺漏將封鎖該階段，但工作串流工作者除外，其工作將由整合步驟完成。檢查工作階段記錄，然後繼續執行。
- **推理程度 (Effort)。** 子代理人繼承工作階段的模型與推論深度 (reasoning effort)。優先採用 medium 或 high：maximum effort 會大幅倍增步驟時間。
- 因 `workflow_limit_reached` 而以 `error` 結束的執行，在獲得核准並僅調高該限制後即可繼續。針對其他錯誤，使用 `dynamic_workflows_manage` (`inspect-run`) 讀取該執行，修正原因並啟動新執行。
- 切勿放寬關卡、跳過階段或將未經驗證的檢查回報為通過。
- 針對單一具名階段，將 `from` 與 `to` 皆設定為該階段來啟動工作流程；僅設定 `from` 亦會執行後續的每個階段。在沒有工作流程的情況下，自行依序遵循階段指引，檢查每個關卡並在相同的核准點暫停：在 `azd provision`、`azd deploy` 或 `azd up` 之前先行詢問。

## SDD 預設值

- **放置：** 在選定的訂用帳戶中建立全新資源群組。除非規格另有需求，否則模型採用 `gpt-5.4-mini`。除非使用者指定，否則偏好區域為 `eastus2`（針對歐盟資料落地為 `swedencentral`）。在持久化 `AZURE_LOCATION` 之前由[聯合放置檢查](foundry-models.md)決定；在部署計畫中記錄偏好與部署的區域。
- **命名：** azd 環境 `<solution>-<stage>` 在 20 個字元以內；資源群組為 `rg-<environment>`，在樣板架構建立後立即以 `azd env set AZURE_RESOURCE_GROUP` 設定，以取代帶有隨機雜湊的預設值。檢查 `az group exists`，發生衝突時新增簡短後綴。
- **Skills 優先：** 可重複使用的 agent 行為編寫於 `skills/<name>/SKILL.md` 的 Foundry skills 中，並宣告為 `host: azure.ai.skill` 服務，使 `azd deploy` 能為其進行版本控管。Agents 在執行階段從 toolbox 載入它們，因此映像檔絕不複製 `skills/`。使用 skills 的 agents 執行於 Copilot SDK 上；基本 agents 與圖形工作流程使用 MAF。
- **Toolbox：** 單一 `host: azure.ai.toolbox` 服務承載 skills、MCP 工具（每個皆透過 `host: azure.ai.connection` 服務）與基礎。Agents 在 `uses` 中列出它，並將其 `TOOLBOX_<NAME>_MCP_ENDPOINT` 對應至 `TOOLBOX_ENDPOINT`（[toolbox 指引](foundry-toolbox.md)）。未獲升級核准的舊版 azd 擴充功能降級回退至循序 `postprovision` 攔截勾點。
- **基礎結構：** 在空白 `.scaffold` 資料夾中使用 `azd ai agent init .` 架構 Basic 範例，然後將其移入定位（[樣板架構](azd-layout.md#scaffold-into-an-existing-workspace)）；絕不在執行 `azd init -t <template>` 後接續 agent init（這會重寫提供者）。`azure.yaml` 隨後使用兩個 `infra.layers`：`foundry`（`provider: microsoft.foundry`：帳戶、專案與在 `services.ai-project` 中的模型部署）與 `app`（搭配 AVM 的 Bicep，`dependsOn: [foundry]`），用於使用者指派的身分識別、連接至專案的 Log Analytics 與 Application Insights、透過受控識別提取的單一 ACR、Container Apps 環境與應用程式，以及每一列 RBAC。Agents 使用 `host: azure.ai.agent`；MCP 伺服器、後端與前端使用具備 `docker.remoteBuild: true` 的 `host: containerapp`。僅在需要狀態時使用 Cosmos DB for NoSQL。除非必要否則不使用私人網路。配置：[azd-layout.md](azd-layout.md)。
- **身分識別：** 使用者指派的受控識別。Bicep 在佈建時建立 [RBAC 契約](rbac-contract.md)列；具等冪性的 `postdeploy` 攔截勾點建立執行階段執行個體列與 MCP Easy Auth 允許清單。[RBAC 預檢](rbac-preflight.md)在 Specify 中執行；`BLOCKED` 會停止執行並向擁有者提供現成可用的授權區塊。
- **存放庫：** `.gitignore` 涵蓋 `.azure/*`（保留 `!.azure/deployment-plan.md`）、`.env` 與建置輸出。Python 相依性遵循[相依性契約](foundry-hosted-agent.md#python-dependency-contract-requirementstxt)並以 `uv.lock` 或鎖定需求檔案進行鎖定。`.gitattributes` 設定 `* text=auto eol=lf`。
- **評估：** Verify 一律在規格情境上執行小型 agent 評估（任務遵循度、意圖解析，以及具佐證時的基礎佐證性）；內容安全來自 Foundry 防護措施。僅在收到請求時新增定期或 CI 評估。

## 拆除清理 (Teardown)

僅在收到請求且針對指定環境與訂用帳戶獲得明確核准時：從工作區執行 `azd down --purge --force`。它會刪除資源群組並清除虛刪除的 Foundry 資源。Entra 應用程式註冊位於資源群組外部：在獲得相同核准下，使用 `az ad app delete --id <appId>` 刪除記錄於 `docs/implementation.md` 中的註冊項目。
