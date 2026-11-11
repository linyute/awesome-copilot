# Specify 階段

為 agentic 解決方案編寫單一事實來源 (source of truth)。套用 [skill 預設值](../SKILL.md#defaults)。此階段不對 Azure 進行任何變更。

## 操作模式 (Operating mode)

- 閱讀需求簡述、任何 canvas 情境、現有的 `docs/spec.md`、`.azure/deployment-plan.md`、`README.md` 以及 `docs/LOOP.md` 經驗教訓。更新現有成品而非從頭開始。
- **互動式：** 僅針對答案會改變範圍的問題（使用者、資料、工具、UX 或合規性）提出具選項的詢問，一次問完。
- **在工作流程中：** 絕不提問。採用記錄記載的預設值，若無適用項目則採行最安全合理的預設值，將其記錄在 Assumptions 底下並繼續進行。僅針對權限、配額、費用或安全性的決策傳回 `blocked`。

## 子命令 (Sub-commands)

| 命令 | 動作 |
| --- | --- |
| *(無)* | 建立或更新這兩個成品 |
| `sync` | 從目前程式碼與 `docs/*.md` 更新規格；列出任何偏差 |
| `reverse` | 從現有或快速原型工作區推導規格（根目錄 `README.md`、`azure.yaml`、`src/`） |
| `validate` | 執行下列檢查清單並僅回報缺口 |
| `devcontainer` | 將 [devcontainer.json](../assets/devcontainer.json) 複製至 `.devcontainer/devcontainer.json`；它鎖定了經過測試的 azd 與 uv 版本，因此請刻意升級並記錄變更 |

## 步驟 (Steps)

1. **預檢 (唯讀)。** 執行 `az account show`、`azd auth login --check-status` 與 `azd ext list`，並記錄訂用帳戶、租用戶與已登入主體。針對模型與區域執行[聯合放置檢查](foundry-models.md)，並針對呼叫者執行 [RBAC 預檢](rbac-preflight.md)。執行 `az group exists -n rg-<env>` 並在發生衝突時新增簡短後綴。
2. **規格 (Spec)。** 從 [spec-template.md](../assets/spec-template.md) 編寫 `docs/spec.md`：
   - 以 EARS 形式編寫驗收條件：「當 <觸發條件> 時，<系統> 應 <回應>」。
   - 凍結[實作契約](implementation-contract.md)。
   - 將建構拆分為至多四個具專屬檔案的工作串流。
   - 將每個需求對應至驗證檢查。
   - 套用[應用程式存取預設值](../SKILL.md#defaults)：僅在所有應用程式資料皆為範例、合成或公開資料時才設定為無需終端使用者登入；針對私有或特定使用者資料，詢問存取模型並預設為內部輸入 (internal ingress) 或 Entra 登入。
   - 保持比例原則：凍結介面、結構描述、驗證、錯誤與決策，並將內部演算法、儲存配置與重試機制留給 Implement 處理，除非需求簡述另有要求。大多數規格書篇幅約在 600 行左右。
3. **部署計畫。** 從 [deployment-plan-template.md](../assets/deployment-plan-template.md) 編寫 `.azure/deployment-plan.md`。它涵蓋目標、放置證據、RBAC 判定結果與授權區塊、資源、費用驅動因素以及環境變數。
4. **存放庫。** 確保 `.gitignore` 涵蓋 `.azure/*`（保留 `!.azure/deployment-plan.md`）、`.env` 與建置輸出，且 `.gitattributes` 設定 `* text=auto eol=lf`。僅在收到要求時進行認可 (commit)。
5. **檢閱。** 在工作流程中，全新情境的檢閱者會檢查成品。在互動模式下，自行執行 `validate`。

## 驗證檢查清單 (Validate checklist)

- 不殘留任何 `[NEEDS CLARIFICATION]` 標記。每個待決項目皆為具備預設值與負責人的 Assumption。
- 每個功能性需求皆具備 EARS 條件與驗證列。非功能性需求皆可衡量。
- 契約指名每個服務、環境變數、端點、結構描述、通訊協定與驗證方法。其版本列要求精確的鎖定版本與映像檔標籤，在 Implement 時解析為最新穩定發行版本，並在產生任何程式碼前驗證 `github-copilot-sdk` API。
- 種子資料與決策規則（規格第 9–10 節）使每個情境的成果皆可從凍結的事實推導計算。表格結構完整，且未出現任何憑證或 `Authorization` 常值。
- 至多有四個工作串流，且各自擁有不相交的檔案。
- 規格符合比例原則：不凍結需求簡述未要求的內部演算法、儲存配置或重試機制。
- 規格記錄存取模型與其原因。在具備終端使用者登入時，指名 SPA 預先授權以及自動化瀏覽器測試如何取得使用者權杖。
- 放置顯示該模型在該區域內具備配額且可使用。RBAC 判定結果為 `READY`，或為附帶現成可用授權區塊的 `BLOCKED`。
- 附隨 skills 僅在需求有所需要時出現。

## 關卡 (Gate)

僅在兩個檔案皆存在且檢查清單全部符合時通過。回報：狀態、摘要、成品、假設、問題與經驗教訓。
