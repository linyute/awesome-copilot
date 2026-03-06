---
name: import-infrastructure-as-code
description: '使用 Azure CLI 探索功能與 Azure 驗證模組 (Azure Verified Modules, AVM)，將現有的 Azure 資源匯入 Terraform。當被要求反向工程現有的 Azure 基礎設施、從現有的訂閱/資源群組/資源識別碼產生基礎設施即程式碼 (IaC)、對應相依性、從下載的模組原始碼衍生精確的匯入位址、防止設定漂移，以及產生可供驗證與規劃且基於 AVM 的 Terraform 檔案（適用於任何 Azure 資源型別）時使用。'
---

# 匯入基礎設施即程式碼 (Azure -> 搭配 AVM 的 Terraform) (Import Infrastructure as Code (Azure -> Terraform with AVM))

使用探索資料與 Azure 驗證模組 (Azure Verified Modules)，將現有的 Azure 基礎設施轉換為可維護的 Terraform 程式碼。

## 何時使用此技能 (When to Use This Skill)

當使用者要求執行以下動作時使用此技能：

- 將現有的 Azure 資源匯入 Terraform
- 從現有的 Azure 環境產生 IaC
- 處理 AVM 支援的任何 Azure 資源型別（並記錄合理的非 AVM 回退方案）
- 從訂閱或資源群組重建基礎設施
- 對應探索到的 Azure 資源之間的相依性
- 使用 AVM 模組而非手寫的 `azurerm_*` 資源

## 先決條件 (Prerequisites)

- 已安裝 Azure CLI 並已通過驗證 (`az login`)
- 具有目標訂閱或資源群組的存取權限
- 已安裝 Terraform CLI
- 可存取 Terraform Registry 與 AVM 索引來源的網路權限

## 輸入 (Inputs)

| 參數 | 必要 | 預設值 | 說明 |
|---|---|---|---|
| `subscription-id` | 否 | 作用中的 CLI 上下文 | 用於訂閱範圍探索與上下文設定的 Azure 訂閱 |
| `resource-group-name` | 否 | 無 | 用於資源群組範圍探索的 Azure 資源群組 |
| `resource-id` | 否 | 無 | 用於特定資源範圍探索的一或多個 Azure ARM 資源識別碼 |

至少需要 `subscription-id`、`resource-group-name` 或 `resource-id` 其中之一。

## 逐步工作流 (Step-by-Step Workflows)

### 1) 收集必要範圍（強制性） (Collect Required Scope (Mandatory))

在執行探索指令前，請先要求以下其中一種範圍：

- 訂閱範圍：`<subscription-id>`
- 資源群組範圍：`<resource-group-name>`
- 特定資源範圍：一個或多個 `<resource-id>` 值

範圍處理規則：

- 將 Azure ARM 資源識別碼（例如 `/subscriptions/.../providers/...`）視為雲端資源識別碼，而非本機檔案系統路徑。
- 僅將資源識別碼用於 Azure CLI 的 `--ids` 引數（例如 `az resource show --ids <resource-id>`）。
- 除非使用者明確說明資源識別碼是本機檔案路徑，否則絕不要將其傳遞給讀取檔案的指令（`cat`、`ls`、`read_file`、glob 搜尋）。
- 如果使用者已經提供了一個有效的範圍，除非後續指令失敗需要更多資訊，否則不要再要求額外的範圍輸入。
- 不要詢問可以從已提供的範圍值中得到答案的後續問題。

如果缺少範圍，請明確要求並停止後續動作。

### 2) 驗證並設定內容 (Authenticate and Set Context)

僅執行所選範圍所需的指令。

針對訂閱範圍：

```bash
az login
az account set --subscription <subscription-id>
az account show --query "{subscriptionId:id, name:name, tenantId:tenantId}" -o json
```

預期輸出：包含 `subscriptionId`、`name` 和 `tenantId` 的 JSON 物件。

針對資源群組或特定資源範圍，仍需執行 `az login`，但如果作用中內容已正確，則 `az account set` 是選用的。

使用特定資源範圍時，優先執行以 `--ids` 為基礎的直接指令，避免在不需要的情況下針對訂閱或資源群組進行額外的探索提示。

### 3) 執行探索指令 (Run Discovery Commands)

使用選定的範圍探索資源。確保獲取所有必要的資訊，以便精確產生 Terraform 程式碼。

```bash
# 訂閱範圍
az resource list --subscription <subscription-id> -o json

# 資源群組範圍
az resource list --resource-group <resource-group-name> -o json

# 特定資源範圍
az resource show --ids <resource-id-1> <resource-id-2> ... -o json
```

預期輸出：包含 Azure 資源中繼資料（`id`、`type`、`name`、`location`、`tags`、`properties`）的 JSON 物件或陣列。

### 4) 在產生程式碼前解決相依性 (Resolve Dependencies Before Code Generation)

解析匯出的 JSON 並對應：

- 父子關係（例如：NIC -> 子網 -> VNet）
- `properties` 中的跨資源參考
- Terraform 建立的順序

重要事項：產生以下文件並將其儲存到專案根目錄的 docs 資料夾中。
- `exported-resources.json`：包含所有探索到的資源及其中繼資料，包括相依性與參考。
- `EXPORTED-ARCHITECTURE.MD`：根據探索到的資源及其關係提供的人類可讀架構概覽。

### 5) 選擇 Azure 驗證模組 (Required) (Select Azure Verified Modules (Required))

針對每種資源型別使用最新的 AVM 版本。

### Terraform Registry

- 搜尋 "avm" + 資源名稱
- 依 "Partner" 標籤篩選以尋找官方 AVM 模組
- 範例：搜尋 "avm storage account" → 依 Partner 篩選

### 官方 AVM 索引 (Official AVM Index)

> **注意：** 以下連結一律指向 main 分支上 CSV 檔案的最新版本。根據設計，這意味著檔案內容會隨時間更迭。如果您需要特定時間點的版本，請考慮在 URL 中使用特定的版本發行標籤。

- **Terraform 資源模組 (Resource Modules)**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/TerraformResourceModules.csv`
- **Terraform 模式模組 (Pattern Modules)**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/TerraformPatternModules.csv`
- **Terraform 公用程式模組 (Utility Modules)**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/TerraformUtilityModules.csv`

### 個別模組資訊 (Individual Module information)

如果本機 `.terraform` 資料夾中沒有模組資訊，請使用 `web` 工具或其他合適的 MCP 方法獲取。

使用 AVM 來源：

- Registry：`https://registry.terraform.io/modules/Azure/<module>/azurerm/latest`
- GitHub：`https://github.com/Azure/terraform-azurerm-avm-res-<service>-<resource>`

只要 AVM 模組存在，優先使用 AVM 模組而非手寫的 `azurerm_*` 資源。

從 GitHub 存放庫獲取模組資訊時，存放庫根目錄中的 README.md 檔案通常包含模組的所有詳細資訊，例如：https://raw.githubusercontent.com/Azure/terraform-azurerm-avm-res-<service>-<resource>/refs/heads/main/README.md

### 5a) 在編寫任何程式碼前先閱讀模組 README（強制性） (Read the Module README Before Writing Any Code (Mandatory))

**此步驟非選用。** 在為模組編寫任何一行 HCL 之前，請獲取並閱讀該模組的完整 README。不要依賴於對原始 `azurerm` 提供者的知識或以往使用其他 AVM 模組的經驗。

針對每個選定的 AVM 模組，獲取其 README：

```text
https://raw.githubusercontent.com/Azure/terraform-azurerm-avm-res-<service>-<resource>/refs/heads/main/README.md
```

或者，如果執行 `terraform init` 後模組已下載：

```bash
cat .terraform/modules/<module_key>/README.md
```

在編寫程式碼之前，從 README 中擷取並記錄：

1. **必要輸入 (Required Inputs)** — 模組要求的每個輸入。此處列出的任何子資源（NIC、延伸模組、子網、公用 IP）都在模組 **內部** 進行管理。請 **不要** 為這些資源建立獨立的模組區塊。
2. **選用輸入 (Optional Inputs)** — 確切的 Terraform 變數名稱及其宣告的 `type`。不要假設它們與原始 `azurerm` 提供者的引數名稱或區塊形狀匹配。
3. **用法範例 (Usage examples)** — 檢查使用了哪種資源群組識別碼（`parent_id` 還是 `resource_group_name`）、子資源如何表示（內嵌地圖還是獨立模組），以及每個輸入預期的語法。

#### 將模組規則視為模式而非假設 (Apply module rules as patterns, not assumptions)

使用以下經驗作為匯入失敗常見之「不匹配類型」的範例。不要假設這些確切名稱適用於每個 AVM 模組。請務必驗證每個選定模組的 README 和 `variables.tf`。

**`avm-res-compute-virtualmachine`（任何版本）**

- `network_interfaces` 是一個 **必要輸入**。NIC 由 VM 模組擁有。絕不要在 VM 模組旁建立獨立的 `avm-res-network-networkinterface` 模組 — 請在 `network_interfaces` 下內嵌定義每個 NIC。
- 受信任啟動 (TrustedLaunch) 透過頂層布林值 `secure_boot_enabled = true` 和 `vtpm_enabled = true` 表示。`security_type` 引數僅存在於 `os_disk` 下，用於機密 VM 磁碟加密，不得用於受信任啟動。
- `boot_diagnostics` 是 `bool` 而非物件。請使用 `boot_diagnostics = true`；如果需要儲存體 URI，請使用獨立的 `boot_diagnostics_storage_account_uri` 變數。
- 延伸模組透過 `extensions` 地圖在模組內部管理。不要建立獨立的延伸模組資源。

**`avm-res-network-virtualnetwork`（任何版本）**

- 此模組由 AzAPI 提供者而非 `azurerm` 支援。請使用 `parent_id`（完整的資源群組資源識別碼字串）來指定資源群組，而非 `resource_group_name`。
- README 中的每個範例都顯示 `parent_id`；沒有一個顯示 `resource_group_name`。

所有 AVM 模組的通則：

- 在建立同級模組前，先從 **必要輸入** 判斷子資源的擁有權。
- 從 **選用輸入** 和 `variables.tf` 判斷接受的變數名稱與型別。
- 從 README 用法範例判斷識別碼風格與輸入形狀。
- 不要從原始 `azurerm_*` 資源推斷引數名稱。

### 6) 產生 Terraform 檔案 (Generate Terraform Files)

### 在編寫匯入區塊前先檢查模組原始碼（強制性） (Before Writing Import Blocks — Inspect Module Source (Mandatory))

在 `terraform init` 下載模組後，請先檢查每個模組的原始碼檔案，以在編寫任何 `import {}` 區塊前確定確切的 Terraform 資源位址。絕不要憑記憶編寫匯入位址。

#### 步驟 A — 識別提供者與資源標籤

```bash
grep "^resource" .terraform/modules/<module_key>/main*.tf
```

這會揭示模組使用的是 `azurerm_*` 還是 `azapi_resource` 標籤。例如：`avm-res-network-virtualnetwork` 公開的是 `azapi_resource "vnet"`，而非 `azurerm_virtual_network "this"`。

#### 步驟 B — 識別子模組與巢狀路徑

```bash
grep "^module" .terraform/modules/<module_key>/main*.tf
```

如果子資源是在子模組（子網、延伸模組等）中管理的，則匯入位址必須包含每個中間模組標籤：

```text
module.<root_module_key>.module.<child_module_key>["<map_key>"].<resource_type>.<label>[<index>]
```

#### 步驟 C — 檢查 `count` vs `for_each`

```bash
grep -n "count\|for_each" .terraform/modules/<module_key>/main*.tf
```

任何使用 `count` 的資源在匯入位址中都需要索引。當 `count = 1` 時（例如：條件式的 Linux vs Windows 選擇），位址必須以 `[0]` 結尾。使用 `for_each` 的資源則使用字串鍵值，而非數值索引。

#### 已知的匯入位址模式（取自經驗範例） (Known import address patterns (examples from lessons learned))

這些僅為範例。請將其作為推論範本，然後從目前匯入之模組的下載原始碼中衍生確切位址。

| 資源 | 正確的匯入 `to` 位址模式 |
|---|---|
| 以 AzAPI 為基礎的 VNet | `module.<vnet_key>.azapi_resource.vnet` |
| 子網（巢狀，基於 count） | `module.<vnet_key>.module.subnet["<subnet_name>"].azapi_resource.subnet[0]` |
| Linux VM（基於 count） | `module.<vm_key>.azurerm_linux_virtual_machine.this[0]` |
| VM NIC | `module.<vm_key>.azurerm_network_interface.virtualmachine_network_interfaces["<nic_key>"]` |
| VM 延伸模組（預設 deploy_sequence=5） | `module.<vm_key>.module.extension["<ext_name>"].azurerm_virtual_machine_extension.this` |
| VM 延伸模組（deploy_sequence=1–4） | `module.<vm_key>.module.extension_<n>["<ext_name>"].azurerm_virtual_machine_extension.this` |
| NSG-NIC 關聯 | `module.<vm_key>.azurerm_network_interface_security_group_association.this["<nic_key>-<nsg_key>"]` |

產出內容：

- `providers.tf`：包含 `azurerm` 提供者與必要的版本條件約束
- `main.tf`：包含 AVM 模組區塊與明確的相依性
- `variables.tf`：用於環境特定值
- `outputs.tf`：用於關鍵識別碼與端點
- `terraform.tfvars.example`：包含預留位置值

### 針對模組預設值對比即時屬性（強制性） (Diff Live Properties Against Module Defaults (Mandatory))

編寫初始設定後，請將探索到的每個即時資源的所有非零屬性與對應 AVM 模組 `variables.tf` 中宣告的預設值進行比較。任何即時值與模組預設值不同的屬性都必須在 Terraform 設定中明確設定。

請特別注意以下屬性類別，它們是靜默設定漂移的常見來源：

- **逾時值**（例如：公用 IP 的 `idle_timeout_in_minutes` 預設為 `4`；現有的部署通常使用 `30`）
- **網路策略旗標**（例如：子網的 `private_endpoint_network_policies` 預設為 `"Enabled"`；現有子網通常為 `"Disabled"`）
- **SKU 與分配**（例如：公用 IP 的 `sku`, `allocation_method`）
- **可用性區域**（例如：VM 區域, 公用 IP 區域）
- **備援與複寫**：儲存體與資料庫資源上的設定

透過明確的 `az` 指令擷取完整的即時屬性，例如：

```bash
az network public-ip show --ids <resource_id> --query "{idleTimeout:idleTimeoutInMinutes, sku:sku.name, zones:zones}" -o json
az network vnet subnet show --ids <resource_id> --query "{privateEndpointPolicies:privateEndpointNetworkPolicies, delegation:delegations}" -o json
```

不要僅依賴 `az resource list` 的輸出，因為它可能會省略巢狀或計算出的屬性。

明確固定模組版本：

```hcl
module "example" {
	source  = "Azure/<module>/azurerm"
	version = "<latest-compatible-version>"
}
```

### 7) 驗證產生的程式碼 (Validate Generated Code)

執行：

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan
```

預期輸出：無語法錯誤、無驗證錯誤，且計畫內容與探索到的基礎設施意圖匹配。

## 疑難排解 (Troubleshooting)

| 問題 | 可能原因 | 動作 |
|---|---|---|
| `az` 指令失敗並出現授權錯誤 | 錯誤的租用戶/訂閱，或缺少 RBAC 角色 | 重新執行 `az login`，驗證訂閱內容，確認所需的權限 |
| 探索輸出為空 | 範圍不正確或範圍內無資源 | 重新檢查範圍輸入並再次執行限定範圍的 list/show 指令 |
| 找不到資源型別的 AVM 模組 | AVM 尚未涵蓋該資源型別 | 針對該型別使用原生的 `azurerm_*` 資源並記錄此落差 |
| `terraform validate` 失敗 | 缺少變數或有未解決的相依性 | 增加所需的變數與明確的相依性，然後重新執行驗證 |
| 模組中找不到不明引數或變數 | AVM 變數名稱與 `azurerm` 提供者引數名稱不同 | 閱讀模組 README 的 `variables.tf` 或選用輸入區段以獲取正確名稱 |
| 匯入區塊失敗 — 在該位址找不到資源 | 錯誤的提供者標籤（`azurerm_` vs `azapi_`）、缺少子模組路徑或缺少 `[0]` 索引 | 執行 `grep "^resource" .terraform/modules/<key>/main*.tf` 和 `grep "^module"` 以尋找精確位址 |
| `terraform plan` 顯示匯入資源出現非預期的 `~ update` | 即時值與 AVM 模組預設值不同 | 透過 `az <resource> show` 獲取即時屬性，與模組預設值比較，增加明確的值 |
| 子資源模組提供「提供者設定不存在」 | 子資源被宣告為獨立模組，儘管父模組已擁有它們 | 檢查 README 中的必要輸入，移除不正確的獨立模組，並使用父模組記載的輸入結構來建模子資源 |
| 巢狀子資源匯入失敗並顯示「找不到資源」 | 缺少中間模組路徑、錯誤的地圖鍵值或缺少索引 | 檢查原始碼中的模組區塊以及 `count`/`for_each`；建構包含所有模組區段以及所需鍵值/索引的完整巢狀匯入位址 |
| 工具嘗試將 ARM 資源識別碼讀取為檔案路徑，或重複詢問範圍問題 | 資源識別碼未被視為 `--ids` 輸入，或代理程式不信任已提供的範圍 | 將 ARM 識別碼嚴格視為雲端識別碼，使用 `az ... --ids ...`，並在有一個有效範圍後停止提示 |

## 回應契約 (Response Contract)

傳回結果時，請提供：

1. 使用的範圍（訂閱、資源群組或資源識別碼）
2. 建立的探索檔案
3. 偵測到的資源型別
4. 選用的 AVM 模組及其版本
5. 產生或更新的 Terraform 檔案
6. 驗證指令結果
7. 需要使用者輸入的開放性缺口（若有）

## 代理程式執行規則 (Execution Rules for the Agent)

- 如果缺少範圍，請勿繼續。
- 在列出探索到的檔案與驗證輸出前，不要聲稱匯入成功。
- 在產生 Terraform 前不要跳過相依性對應。
- 優先使用 AVM 模組；明確說明每個非 AVM 回退方案的理由。
- **在編寫程式碼前，閱讀每個 AVM 模組的 README。** 必要輸入識別了該模組擁有哪些子資源。選用輸入記錄了確切的變數名稱與型別。用法範例顯示了提供者特定的慣例（`parent_id` 還是 `resource_group_name`）。跳過 README 是 AVM 匯入中程式碼錯誤的最常見原因。
- **絕不要假設 NIC、延伸模組或公用 IP 資源是獨立的。** 對於任何 AVM 模組，除非 README 明確指出需要獨立模組，否則將子資源視為父模組擁有。在建立同級模組前檢查必要輸入。
- **絕不要憑記憶編寫匯入位址。** 在 `terraform init` 後，grep 下載的模組原始碼以在編寫任何 `import {}` 區塊前發現實際的提供者（`azurerm` 還是 `azapi`）、資源標籤、子模組巢狀關係以及 `count` 與 `for_each` 的用法。
- **絕不要將 ARM 資源識別碼視為檔案路徑。** 資源識別碼屬於 Azure CLI `--ids` 引數和 API 查詢，而不屬於檔案 IO 工具。僅在提供真實的工作區路徑時才讀取本機檔案。
- **當範圍已知時，最小化提示。** 如果已提供訂閱、資源群組或特定的資源識別碼，請直接執行指令，僅在指令因缺少必要上下文而失敗時才詢問後續問題。
- **在 `terraform plan` 顯示 0 個銷毀且無非預期變更之前，不要宣告匯入完成。** 遙測 `+ create` 資源是可以接受的。任何針對真實基礎設施資源的 `~ update` 或 `- destroy` 都必須解決。

## 參考資料 (References)

- [Azure 驗證模組索引 (Terraform)](https://github.com/Azure/Azure-Verified-Modules/tree/main/docs/static/module-indexes)
- [Terraform AVM Registry 命名空間](https://registry.terraform.io/namespaces/Azure)
