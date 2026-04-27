# 第 4 階段：部署代理 (Deployment Agent)

此檔案包含第 4 階段的詳細說明。當使用者在第 3 階段 (程式碼審查) 完成後核准部署時，請閱讀並遵循此檔案。

---

**🚨🚨🚨 第 4 階段強制執行順序 — 絕不可跳過任何步驟 🚨🚨🚨**

必須按順序執行下列 5 個步驟。不得遺漏或跳過任何步驟。
即使使用者以「部署它」、「開始吧」、「執行」等急切的要求要求部署，也請務必從步驟 1 開始按順序執行。

```
步驟 1：核實先決條件 (az login, 訂閱, 資源群組)
    ↓
步驟 2：What-if 驗證 (az deployment group what-if) ← 「務必執行」
    ↓
步驟 3：產生預覽圖 (02_arch_diagram_preview.html) ← 「務必產生」
    ↓
步驟 4：使用者最終確認後進行實際部署 (az deployment group create)
    ↓
步驟 5：產生部署結果圖 (03_arch_diagram_result.html)
```

**絕不可執行下列操作：**
- 未經 What-if 就直接執行 `az deployment group create`
- 跳過產生預覽圖 (`02_arch_diagram_preview.html`)
- 在未向使用者展示 What-if 結果的情況下直接進行部署
- 僅提供 `az` 指令讓使用者手動執行

---

### 步驟 1：核實先決條件

```powershell
# 核實 az CLI 安裝與登入狀態
az account show 2>&1
```

若未登入，請要求使用者執行 `az login`。
代理絕不可直接輸入或儲存認證資訊。

建立資源群組：
```powershell
az group create --name "<RG名稱>" --location "<位置>"  # 位置已在第 1 階段確認
```
→ 確認成功後進入下一步

### 步驟 2：驗證 (Validate) → What-if 驗證 — 🚨 必要項目

**請勿跳過此步驟。無論使用者多麼急切要求部署，務必執行此步驟。**

**步驟 2-A：先執行驗證 (快速預先驗證)**

當存在 Azure 政策違規、資源參考錯誤等問題時，`what-if` 可能會**無限期卡死且不顯示錯誤訊息**。
為了防止這種情況，**務必先執行 `validate`**。驗證會快速回傳錯誤。

```powershell
# validate — 快速捕捉政策違規、結構定義錯誤、參數問題
az deployment group validate `
  --resource-group "<RG名稱>" `
  --parameters main.bicepparam
```

- **驗證成功** → 進入步驟 2-B (what-if)
- **驗證失敗** → 分析錯誤訊息、修正 Bicep、重新編譯並再次驗證
  - Azure 政策違規 (`RequestDisallowedByPolicy`) → 在 Bicep 中反映政策要求 (例如：`azureADOnlyAuthentication: true`)
  - 結構定義錯誤 → 修正 API 版本/屬性
  - 參數錯誤 → 修正參數檔案

**步驟 2-B：執行 What-if**

在驗證通過後執行 what-if。

**選取參數傳遞方法：**
- 若所有 `@secure()` 參數皆有預設值 → 使用 `.bicepparam`
- 若有任何 `@secure()` 參數需要使用者輸入 → 使用 `--template-file` + JSON 參數檔案

```powershell
# 方法 1：使用 .bicepparam (當所有 @secure() 參數皆有預設值時)
az deployment group what-if `
  --resource-group "<RG名稱>" `
  --parameters main.bicepparam

# 方法 2：使用 JSON 參數檔案 (當有 @secure() 參數需要使用者輸入時)
az deployment group what-if `
  --resource-group "<RG名稱>" `
  --template-file main.bicep `
  --parameters main.parameters.json `
  --parameters secureParam='數值'
```
→ 摘要 What-if 結果並向使用者呈現。

**⏱️ What-if 執行方法與逾時處理：**

What-if 會在 Azure 伺服器端執行資源驗證，因此視服務/區域而定可能需要一些時間。
**呼叫 powershell 工具時，務必設定 `initial_wait: 300` (5 分鐘)。** 若 5 分鐘內未完成，則會自動逾時。

```powershell
# 呼叫 powershell 工具時務必設定 initial_wait: 300
# mode: "sync", initial_wait: 300
az deployment group what-if `
  --resource-group "<RG名稱>" `
  --parameters main.bicepparam
```

**5 分鐘內完成** → 正常執行 (摘要結果 → 預覽圖 → 部署確認)

**5 分鐘內未完成 (逾時)** → 立即使用 `stop_powershell` 停止，並為使用者提供選項：

```
ask_user({
  question: "What-if 驗證未在 5 分鐘內完成。Azure 伺服器回應延遲。您想要如何繼續？",
  choices: [
    "重試 (推薦)",
    "跳過 What-if 並直接部署"
  ]
})
```

**若選取「重試」**：以 `initial_wait: 300` 重新執行相同指令。最多重試 2 次。
**若選取「跳過 What-if 並直接部署」**：
- 根據第 1 階段的草案產生預覽圖
- 告知使用者相關風險：
  > **⚠️ 正在不經過 What-if 驗證的情況下進行部署。** 可能會發生非預期的資源變更。請在部署後於 Azure 入口網站核實。

**絕不可執行下列操作：**
- 執行時未設定 `initial_wait`，導致無限期等待
- 代理擅自決定「what-if 是選配的」並跳過
- 在發生逾時後，未詢問使用者便自動切換至部署
- 以「部署會比較快」等理由跳過 what-if

### 步驟 3：根據 What-if 結果產生預覽圖 — 🚨 必要項目

**請勿跳過此步驟。當 What-if 成功時，務必產生預覽圖。**

使用 What-if 結果中的實際部署資源 (資源名稱、類型、位置、數量) 重新產生架構圖。
保留第 1 階段的草案 (`01_arch_diagram_draft.html`) 原封不動，並將預覽圖產生為 `02_arch_diagram_preview.html`。
草案可隨時重新開啟。

```
## 即將部署的架構 (根據 What-if)

[互動式架構圖連結 — 02_arch_diagram_preview.html]
(設計草案：01_arch_diagram_draft.html)

即將建立的資源 (共 N 項)：
[What-if 結果摘要表]

要部署這些資源嗎？(是/否)
```

當使用者確認後進入步驟 4。**在產生預覽圖之前，請勿進行部署。**

### 步驟 4：實際部署

僅在使用者審閱過預覽圖與 What-if 結果並核准部署後才執行。
**使用與 What-if 相同的參數傳遞方法。**

```powershell
$deployName = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 方法 1：使用 .bicepparam
az deployment group create `
  --resource-group "<RG名稱>" `
  --parameters main.bicepparam `
  --name $deployName `
  2>&1 | Tee-Object -FilePath deployment.log

# 方法 2：使用 JSON 參數檔案
az deployment group create `
  --resource-group "<RG名稱>" `
  --template-file main.bicep `
  --parameters main.parameters.json `
  --name $deployName `
  2>&1 | Tee-Object -FilePath deployment.log
```

部署期間定期監控進度：
```powershell
az deployment group show `
  --resource-group "<RG名稱>" `
  --name "<部署名稱>" `
  --query "{status:properties.provisioningState, duration:properties.duration}" `
  -o table
```

### 處理部署失敗

當部署失敗時，某些資源可能會維持在「失敗 (Failed)」狀態。在這種狀態下重新部署會導致如 `AccountIsNotSucceeded` 之類的錯誤。

**⚠️ 資源刪除是破壞性指令。務必先向使用者說明情況並取得核准後再執行。**

```
[資源名稱] 在部署期間失敗。
若要重新部署，必須先刪除失敗的資源。

要刪除並重新部署嗎？(是/否)
```

在使用者核准後，刪除失敗的資源並重新部署。

**🔹 處理虛刪除 (Soft-delete) 的資源 (防止重新部署被阻擋)：**

當資源群組在部署失敗後被刪除時，Cognitive Services (Foundry)、Key Vault 等資源會維持在**虛刪除狀態**。
使用相同名稱重新部署會導致 `FlagMustBeSetForRestore`、`Conflict` 等錯誤。

**在重新部署前務必進行檢查：**
```powershell
# 檢查虛刪除的 Cognitive Services
az cognitiveservices account list-deleted -o table

# 檢查虛刪除的 Key Vault
az keyvault list-deleted -o table
```

**解決選項 (向使用者提供選項)：**
```
ask_user({
  question: "發現先前部署留下的虛刪除資源。您想要如何處理？",
  choices: [
    "清除 (Purge) 並重新部署 (推薦) - 徹底刪除後建立新的",
    "以復原模式重新部署 - 恢復現有資源"
  ]
})
```

**注意 — 設定了 `enablePurgeProtection: true` 的 Key Vault：**
- 無法清除 (必須等到保留期滿)
- 無法以相同名稱重新建立
- **解決方案：變更 Key Vault 名稱**並重新部署 (例如：在 `uniqueString()` 種子中加入時間戳記)
- 向使用者說明情況，並指引其變更名稱

### 步驟 5：部署完成 — 根據實際資源產生架構圖並回報

一旦部署完成，查詢實際部署的資源並產生最終的架構圖。

**步驟 1：查詢部署的資源**
```powershell
az resource list --resource-group "<RG名稱>" --output json
```

**步驟 2：根據實際資源產生架構圖**

從查詢結果中擷取資源名稱、類型、SKU 與端點，並使用內建架構圖引擎產生最終架構圖。
請注意檔案名稱，避免覆蓋先前的圖表：
- `01_arch_diagram_draft.html` — 設計草案 (保留)
- `02_arch_diagram_preview.html` — What-if 預覽 (保留)
- `03_arch_diagram_result.html` — 部署結果最終版

將實際部署的資源資訊填入架構圖的 services JSON 中：
- `name`：實際資源名稱 (例如：`foundry-duru57kxgqzxs`)
- `sku`：實際 SKU
- `details`：實際數值，如端點、位置等

**步驟 3：回報**
```
## 部署完成！

[互動式架構圖 — 03_arch_diagram_result.html]
(設計草案：01_arch_diagram_draft.html | What-if 預覽：02_arch_diagram_preview.html)

已建立的資源 (共 N 項)：
[從實際部署結果中動態擷取的資源名稱、類型與端點]

## 後續步驟
1. 在 Azure 入口網站中核實資源
2. 檢查私人端點連線狀態
3. 如有需要，提供額外的組態指引

## 清理指令 (若有需要)
az group delete --name <RG名稱> --yes --no-wait
```

---

### 處理部署後的架構變更請求

**當使用者在部署完成後要求新增/變更/刪除資源時，請勿直接執行 Bicep/部署。**
請務必先回到第 1 階段並更新架構。

**流程：**

1. **確認使用者意圖** — 先詢問他們是否要在目前已部署的架構上進行增量變更：
   ```
   您是否要在目前已部署的架構中加入一台 VM？
   目前的組態：[已部署服務摘要]
   ```

2. **回到第 1 階段 — 套用差異確認規則 (Delta Confirmation Rule)**
   - 使用現有的部署結果 (`03_arch_diagram_result.html`) 作為目前狀態的基準
   - 核實新服務的必要欄位 (SKU、網路連接、區域可用性等)
   - 透過 ask_user 確認未定項目
   - 進行事實核實 (擷取 MS 文件 + 交叉驗證)

3. **產生更新後的架構圖**
   - 將現有的部署資源與新資源結合，產生 `04_arch_diagram_update_draft.html`
   - 向使用者展示並取得確認：
   ```
   ## 更新後的架構

   [互動式架構圖 — 04_arch_diagram_update_draft.html]
   (前次部署結果：03_arch_diagram_result.html)

   **變更內容：**
   - 新增：[新服務列表]
   - 移除：[移除的服務列表] (若有)

   要以此組態繼續執行嗎？
   ```

4. **確認後，依序執行第 2 → 3 → 4 階段**
   - 在現有的 Bicep 中累加新增資源模組
   - 審查 → What-if → 部署 (增量部署)

**絕不可執行下列操作：**
- 在部署後要求變更時，跳過更新架構圖而直接進行 Bicep 產生
- 忽略現有的部署狀態，孤立地建立新資源
- 未與使用者確認是否在現有架構上累加變更就直接執行
