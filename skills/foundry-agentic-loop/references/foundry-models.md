# Foundry 模型選取器 (Foundry models selector)

為解決方案所需的每個部署選擇模型、版本、SKU、容量與區域。SDD 在 `azure.yaml` 中的 `services.ai-project.deployments[]` 下宣告部署（[azd-layout.md](azd-layout.md#azureyaml)），並由 `azd provision` 建立。Rapid 重複使用專案的部署，並在新增部署前先詢問。兩者皆將選取結果記錄於 `.azure/deployment-plan.md`。透過 `microsoft-foundry` 解析即時配額、可用性與佈建命令。

> 目錄每月皆會變動。請透過 `microsoft-foundry` 以及 [Azure 直接銷售模型](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure) 與 [區域可用性](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability) 頁面即時解析精確版本、SKU、註冊狀態與區域可用性；切勿憑記憶抄寫版本號。

## 依任務分類的起始建議

推薦最合適的項目，僅在費用、區域、配額或註冊受阻時提供替代方案。實際執行環境優先選用正式發行 (GA) 版本，並在部署前標記預覽版 (Preview) 或需要註冊的模型。

| 任務 | 起始建議 | 視需要考慮 |
| --- | --- | --- |
| 對話、agents、工具 | `gpt-5.4-mini` (SDD 預設值) | 考量費用時選 nano 層級；困難推論或極長情境時選旗艦層級 |
| 深度推論 | 目前的 GPT 旗艦模型 | 考量費用時選 o 系列 mini |
| 撰寫程式碼 | 目前的 Codex 模型 | 極大情境長度時選 `gpt-4.1` |
| 多模態輸入 | `gpt-5.4-mini` | 長情境時選旗艦模型 |
| 內嵌向量 (Embeddings) | `text-embedding-3-large` | 考量費用時選 `text-embedding-3-small` |
| 重新排序 (Rerank) | Cohere rerank (目前版本) | 考量延遲時選其快速層級 |
| 影像、音訊、影片、文件 AI | 該系列目前的 GA 模型 | 僅在獲得核准時使用預覽模型 |
| 費用最佳化路由 | `model-router` | 僅在有提供的區域（少數區域） |

## 聯合區域與容量預檢 (Joint region and capacity preflight)

將放置決策視為針對特定訂用帳戶的單一決策，而非靜態的模型查詢。在保留 `AZURE_LOCATION` 或宣告部署之前，驗證每個候選區域中的所有必要資源：

| 資源 | 即時驗證項目 |
| --- | --- |
| Foundry 模型 | 精確模型、版本、SKU、所請求的容量/配額與註冊狀態 |
| Azure AI Search | 所需 SKU 可用性與區域功能支援 |
| Foundry 託管 agents | 目標專案/帳戶架構的託管 agent 可用性 |
| 預覽版相依項目 | 所需提供者/功能註冊與區域可用性 |

從偏好的區域開始，接著透過維護的 `microsoft-foundry` 指引使用目標訂用帳戶的即時可用性與配額檢查。若有任何必要資源失敗，拒絕該候選區域，並對能滿足**完整**資源集的替代方案進行排序；除非架構明確支援跨區域放置，否則切勿獨立移動單一資源。

將放置決策寫入 `./.azure/deployment-plan.md`：

| 欄位 | 數值 |
| --- | --- |
| 偏好位置 | 使用者/資料落地偏好 |
| 部署位置 | 通過聯合預檢的第一個候選位置 |
| 證據 | 模型/版本/SKU/容量、Search SKU、託管 agent 與預覽檢查 |
| 差異 | 部署位置與偏好位置不同的原因，或填入 `none` |

當部署位置與偏好位置不同時，在繼續實作前更新 `./docs/spec.md` (SDD)。

## 記錄選取結果

僅在通過聯合預檢後：

- 設定區域：`azd env set AZURE_LOCATION "<region>"` (SDD)。
- 在 `azure.yaml` 的 `services.ai-project.deployments[]` 中宣告每個部署，包含部署 `name`、模型 `name`、`format` (`OpenAI`, `Microsoft`, `MistralAI`, `Cohere`, `DeepSeek`, `Meta`, `xAI`, ...)、`version`，以及 `sku` 的 `name` (通常為 `GlobalStandard`) 與 `capacity` (每分鐘數千權杖)。
- 將偏好與部署位置、每個部署與證據記錄於 `.azure/deployment-plan.md`。

## 工作流程

1. 從規格或摘要中取得任務與模態（對話、推論、撰寫程式碼、多模態、內嵌、重新排序、影像產生、影片、音訊、文件 AI）；僅在兩者皆未說明時才詢問。
2. 針對任務推薦起始點，並即時解析其目前的 GA 版本。
3. 確認偏好區域。以 `eastus2` 為起點（涵蓋最廣的 Azure OpenAI 範圍）；針對歐盟資料落地優先選用 `swedencentral`。
4. 確認容量。預設值：**100** (對話 / 推論 / 撰寫程式碼)，**30** (內嵌向量)，**50** (影像 / 音訊)。當一個端對端請求會進行數次模型呼叫時，在剩餘配額內將對話容量調整至至少為其估計權杖的四倍，以便 Verify 能並行執行 E2E 案例。GlobalStandard 依權杖計費，因此預留空間不產生費用；在部署計畫中記錄容量規劃。
5. 在部署前明確標記任何**需要註冊**或**預覽版**模型。
6. 為模型及每個同地放置的必要服務執行即時聯合預檢；僅對完整的放置方案進行排名。
7. [記錄選取結果](#記錄選取結果)。
8. **調節實際可用性。** 若佈建選取了不同的模型或位置，請立即更新 `./docs/spec.md` 與 `./.azure/deployment-plan.md`。
