---
description: 'SAP Business Technology Platform (SAP BTP) 的 Terraform 慣例和指南。'
applyTo: '**/*.tf, **/*.tfvars, **/*.tflint.hcl, **/*.tf.json, **/*.tfvars.json'
---

# SAP BTP 上的 Terraform – 最佳實踐與慣例

## 核心原則

保持 Terraform 程式碼（code）最小化、模組化、可重複、安全且可稽核。
始終對 Terraform HCL 進行版本控制，絕不對產生的狀態進行版本控制。

## 安全性

強制項：
- 使用最新的穩定 Terraform CLI 和 provider 版本；主動升級以獲取安全修補程式。
- 請勿提交機密（secrets）、憑證（credentials）、證書（certificates）、Terraform 狀態或計畫輸出 artifact。
- 將所有機密變數和輸出標記為 `sensitive = true`。
- 偏好使用短暫/僅限寫入的 provider 驗證（Terraform >= 1.11），這樣機密就不會在狀態中永久儲存（store）。
- 最大限度地減少敏感輸出；僅發出下游自動化真正需要的內容。
- 在 CI 中持續使用 `tfsec`、`trivy`、`checkov` 進行掃描（至少選擇其中一個）。
- 定期檢閱 provider 憑證、輪換金鑰，並在支援的情況下啟用 MFA。

## 模組化

為了清晰和速度而結構化：
- 按邏輯網域（domain）拆分（例如：entitlements、服務實例）– 而不是按環境。
- 僅將模組用於可重複使用的多資源模式；避免使用單資源包裝模組。
- 保持模組層次結構扁平；避免深度巢狀和循環依賴。
- 僅透過 `outputs` 暴露必要的跨模組資料（data）（在需要時標記為敏感）。

## 可維護性

以明確性 > 隱式性為目標。
- 註釋 **為什麼**，而不是 **是什麼**；避免重述明顯的資源屬性。
- 使用參數化（變數）而不是硬程式碼（code）；僅在合理時提供預設值。
- 優先使用資料（data）來源（sources）針對外部現有基礎設施；絕不用於在相同根目錄中剛建立的資源 – 請使用輸出。
- 在通用可重複使用模組中避免使用資料（data）來源；而是要求輸入。
- 移除未使用/慢速的資料（data）來源；它們會降低計畫時間。
- 使用 `locals` 針對衍生的或重複的表達式來集中邏輯。

## 樣式與格式化

### 一般
- 資源、變數、輸出使用描述性且一致的名稱。
- 變數和 locals 使用 snake_case。
- 2 個空格縮排；執行 `terraform fmt -recursive`。

### 版面配置與檔案

建議的結構：
```text
my-sap-btp-app/
├── infra/                      # 根模組
│   ├── main.tf                 # 核心資源（大時按網域拆分）
│   ├── variables.tf            # 輸入
│   ├── outputs.tf              # 輸出
│   ├── provider.tf             # provider 設定
│   ├── locals.tf               # 本地/衍生值
│   └── environments/           # 僅是環境變數檔案
│       ├── dev.tfvars
│       ├── test.tfvars
│       └── prod.tfvars
├── .github/workflows/          # CI/CD (如果是 GitHub)
└── README.md                   # 文件
```

規則：
- 請勿為每個環境建立單獨的分支/儲存庫/資料夾（不建議的模式）。
- 保持環境漂移最小化；僅在 *.tfvars 檔案中編碼差異。
- 將過大的 `main.tf` / `variables.tf` 拆分成邏輯命名的片段（例如：`main_services.tf`、`variables_services.tf`）。
  保持命名一致。

### 資源區塊組織

順序（上 → 下）：可選的 `depends_on`，接著是 `count`/`for_each`，然後是屬性，最後是 `lifecycle`。
- 僅在 Terraform 無法推斷依賴關係時（例如：資料（data）來源需要授權）才使用 `depends_on`。
- 對於可選的單一資源使用 `count`；對於透過 map 鍵控的多個實例，使用 `for_each` 以獲得穩定的位址。
- 屬性分組：必需的優先，接著是可選的；邏輯區段之間留空行。
- 區段內按字母順序排列，以便更快掃描。

### 變數
- 每個變數：明確的 `type`、非空的 `description`。
- 偏好具體類型（`object`、`map(string)` 等）而不是 `any`。
- 避免對集合使用 null 預設值；改用空列表/maps。

### 本地變數
- 集中計算的或重複的表達式。
- 將相關的值分組到 物件（object） locals 中以保持內聚性。

### 輸出
- 僅暴露下游模組/自動化程式所消耗的內容。
- 將機密標記為 `sensitive = true`。
- 始終給予清晰的 `description`。

### 格式化與 Linting
- 執行 `terraform fmt -recursive`（CI 中的必需項目）。
- 在 pre‑commit / CI 中強制執行 `tflint`（以及可選的 `terraform validate`）。

## 文件

強制項：
- 所有變數和輸出上的 `description` + `type`。
- 簡潔的根 `README.md`：目的、先決條件、驗證模型、用法（init/plan/apply）、測試、回滾。
- 使用 `terraform-docs` 產生模組 文件（document）（如果可能，新增到 CI）。
- 僅在澄清不顯而易見的決策或約束時才新增註釋。

## 狀態管理
- 使用支援鎖定的遠端後端（例如：Terraform Cloud、AWS S3、GCS、Azure Storage）。避免使用 SAP BTP Object Store（不具備可靠鎖定和安全的足夠功能）。
- 絕不提交 `*.tfstate` 或備份。
- 對靜態和傳輸中的狀態進行加密；根據最小權限原則限制存取。

## 驗證
- 在提交前執行 `terraform validate`（語法和內部檢查）。
- 在 `terraform plan` 之前與使用者確認（需要驗證和全域帳戶子網域）。透過環境變數或 tfvars 提供驗證；絕不要在 provider 區塊中內嵌機密。
- 首先在非生產環境中測試；確保應用是冪等的。

## 測試
- 對於模組邏輯和不變式，使用 Terraform 測試框架（`*.tftest.hcl`）。
- 涵蓋成功和失敗路徑；保持測試無狀態/冪等。
- 在可行時，偏好模擬外部資料（data）來源。

## SAP BTP Provider 特有項

指南：
- 使用 `data "btp_subaccount_service_plan"` 解析服務計畫 ID，並從該資料（data）來源引用 `serviceplan_id`。

範例（example）：
```terraform
data "btp_subaccount_service_plan" "example" {
  subaccount_id = var.subaccount_id
  service_name  = "your_service_name"
  plan_name     = "your_plan_name"
}

resource "btp_subaccount_service_instance" "example" {
  subaccount_id  = var.subaccount_id
  serviceplan_id = data.btp_subaccount_service_plan.example.id
  name           = "my-example-instance"
}
```

明確的依賴關係（provider 無法推斷）：
```terraform
resource "btp_subaccount_entitlement" "example" {
  subaccount_id = var.subaccount_id
  service_name  = "your_service_name"
  plan_name     = "your_plan_name"
}

data "btp_subaccount_service_plan" "example" {
  subaccount_id = var.subaccount_id
  service_name  = "your_service_name"
  plan_name     = "your_plan_name"
  depends_on    = [btp_subaccount_entitlement.example]
}
```

訂閱也依賴於授權；當 provider 無法透過屬性推斷連結時（匹配 `service_name`/`plan_name` ↔ `app_name`），請新增 `depends_on`。

## 工具整合（integration）

### HashiCorp Terraform MCP 伺服器
使用 Terraform MCP 伺服器進行互動式綱要搜尋（search）、資源區塊起草和驗證。
1. 安裝並執行伺服器（請參閱 https://github.com/mcp/hashicorp/terraform-mcp-server）。
2. 將其作為工具新增到您的 Copilot / MCP 客戶端配置中。
3. 在撰寫之前查詢 provider 綱要（例如：列出資源、資料（data）來源）。
4. 產生資源區塊草稿，然後手動精煉命名和標記標準。
5. 驗證計畫摘要（絕不包含機密）；在 `apply` 之前與檢閱者確認差異。

### Terraform 註冊表
參考 SAP BTP provider 文件（docs）：https://registry.terraform.io/providers/SAP/btp/latest/docs 以獲取權威的資源和資料（data）來源欄位。如果不確定或存在疑問，請將 MCP 回應與註冊表 文件（document）進行交叉檢查。

## 反模式（避免）

配置：
- 硬程式碼（code）環境特有值（使用變數和 tfvars）。
- 例行性使用 `terraform import`（僅限遷移）。
- 複雜/模糊的條件邏輯和動態區塊，這會降低清晰度。
- 除非存在不可避免的整合（integration）間隔，否則避免使用 `local-exec` provisioners。
- 除非有明確理由，否則避免在同一根目錄中混合使用 SAP BTP provider 和 Cloud Foundry provider（拆分模組）。

安全性：
- 在 HCL、狀態或 VCS 中儲存（store）機密。
- 為提高速度而禁用加密、驗證或掃描。
- 使用預設密碼/金鑰或跨環境重複使用憑證。

操作：
- 在沒有事先非生產驗證的情況下直接應用於生產環境。
- 在 Terraform 以外進行手動漂移更改。
- 忽略狀態不一致/損壞症狀。
- 在不受控制的本地筆記型電腦上執行生產應用（使用 CI/CD 或經批准的執行程序）。
- 從原始 `*.tfstate` 讀取業務 資料（data），而不是輸出/資料（data）來源。

所有更改都必須透過 Terraform CLI + HCL 流動 – 絕不要手動變更狀態。
