# Deploy 階段

將已驗證的解決方案發佈至 `.azure/deployment-plan.md` 中的目標。套用 [skill 預設值](../SKILL.md#defaults) 並使用 `microsoft-foundry` 進行平台操作。從工作區根目錄執行 azd，並在行內設定 `AZURE_DEV_USER_AGENT=microsoft_foundry_skill`。

## 1. 預檢 (Preflight)

以唯讀方式執行這些檢查，並一次回報所有缺口。

- **工具：** `az`、`azd` 與 `bicep` 正常運作。`azd ext list` 符合 `azure.yaml` 中的 `requiredVersions`。`azd auth login --check-status` 成功。若 az 已登入但 azd 未登入，執行 `azd config set auth.useAzCliAuth true`。
- **目標：** `azd env get-values` 與部署計畫的訂用帳戶、資源群組、區域與環境相符。出現任何不符合即停止。
- **封裝：**
  - Agents 隨附 `uv.lock` 或鎖定的需求檔案，絕不包含 `agent-framework` 元套件 (meta-package)。
  - Agents 具備 `.agentignore`；容器具備 `.dockerignore`。
  - 進入點使用 LF 換行字元 (`.gitattributes`)。
  - 每個元件皆已啟用遙測。

## 2. 部署 (Deploy)

在工作流程執行內部，`approve-deploy-v1`（或稍後的 `approve-deploy-r<n>[-a<k>]-v1`）核准僅涵蓋其記錄指紋的此區段：首先確認 `azd env get-values` 與 `az account show` 符合核准的環境、訂用帳戶、位置、資源群組以及 Foundry 帳戶、專案與資源群組，若有任何不同，不變更任何內容並回報封鎖。將每項健全狀況與 E2E 檢查回報為證據項目。否則先詢問，摘要針對指定環境與訂用帳戶的資源、費用、安全性與區域影響。

1. 當基礎結構變更時，為每個 `infra.layers` 名稱執行 `azd provision --preview <layer> --no-prompt`（單純的 `--preview` 在多層情況下會失敗）並檢閱刪除與替換情況。遇到未預期的變更即停止。
2. 執行 `azd up --no-prompt`，或在基礎結構未變更時執行 `azd deploy --no-prompt`。等待其完成，記錄結束代碼，並重新讀取[部署後的授權](azd-layout.md#grants-after-deploy)。
3. 從 `azd env get-values` 讀取端點 (`SERVICE_<NAME>_URI`, `AGENT_<NAME>_RESPONSES_ENDPOINT`)。確認每個 container app 皆具備作用中且狀況良好的修訂版 (`az containerapp revision list`)。
4. 針對每個 agent，執行：
   - `azd ai agent show <agent>` 以取得端點與測試營 (playground) URL；
   - `azd ai agent invoke <agent> "<scenario>"`;
   - `azd ai agent monitor <agent> --session-id <id>`，搭配來自 invoke 之 `Session:` 列的識別碼，以讀取其記錄。

   針對 424 `session_not_ready` 或 502 熱身回應，使用退避機制重試最多 5 分鐘。
5. 針對部署的前端重新執行 E2E 測試套件，並採用 `docs/verify.md` 中記錄的並行數，加上遞延至 Deploy 的每項檢查。

## 3. 常見失敗狀況

| 徵兆 | 修正方式 |
| --- | --- |
| `QuotaExceeded`, `InsufficientQuota` | 在另一個核准的區域中重新執行放置檢查，或降低容量 |
| `Conflict` (名稱已被使用)，虛刪除 (soft-deleted) 帳戶 | 為環境新增後綴，或在獲得核准後進行清除 (purge) |
| `ImagePullBackOff` | 檢查 ACR push、應用程式身分識別的 AcrPull 以及 `AZURE_CONTAINER_REGISTRY_ENDPOINT` |
| `InvalidTemplate`, `InvalidResourceName` | 執行 `az bicep build`；檢查 AVM 版本與名稱長度限制 |
| `AuthorizationFailed` | 執行 RBAC 預檢並向擁有者提供授權區塊 |
| `Hosted agents can only be called through the agent endpoint` | 使用 `https://ai.azure.com/.default` 範圍呼叫 `{project}/agents/{agent}/endpoint/protocols/openai` |
| Agent 相依性解析失敗 | 鎖定子套件及其可轉移匯入項目 |
| 攔截勾點因缺少 `AZURE_TENANT_ID` 或 `AGENT_*` 變數而失敗 | 在攔截勾點中從 `azd env get-values` 匯出該變數；將攔截勾點排在部署之後 |

## 4. 記錄 (Record)

1. 在 `.env` 中 upsert `DEPLOYED_FRONTEND`。
2. 編寫 `docs/deploy.md`，內容包含：
   - 環境、訂用帳戶、資源群組與區域；
   - 資源與 agent 版本；
   - 端點與測試營連結；
   - 檢查結果；
   - 費用驅動因素；
   - 復原 (`azd deploy` 先前版本) 與拆除清理 (`azd down --purge`，接著處理來自 `docs/implementation.md` 的 Entra 應用程式註冊，僅在獲得核准後執行)。
3. 重新整理根目錄 `README.md`，包含概觀、架構、執行與部署方式，以及所有 `docs/` 的連結。

## 關卡 (Gate)

僅在滿足以下條件時通過：

- azd 結束代碼為 0；
- 修訂版本狀況良好；
- 每個託管 agent 均有回應；
- 已部署的 E2E 套件與遞延的檢查皆通過。

以 `{name, url}` 回報狀態、摘要、成品、假設、問題、經驗教訓與端點。
