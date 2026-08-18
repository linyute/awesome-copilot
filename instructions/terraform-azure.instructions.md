---
description: '建立或修改在 Azure 上使用 Terraform 建構的解決方案。'
applyTo: '**/*.terraform, **/*.tf, **/*.tfvars, **/*.tflint.hcl, **/*.tfstate, **/*.tf.json, **/*.tfvars.json'
---

# Azure Terraform 最佳做法

## 整合與自包含性

此指示集針對 Azure/Terraform 情境擴充了通用的 DevOps 核心原則與 Taming Copilot 指令。它假設已載入這些基礎規則，但在此處包含摘要以實現自包含性。若一般規則不存在，這些摘要將作為預設值以維持行為的一致性。

### 納入的 DevOps 核心原則 (CALMS 框架)

- **文化 (Culture)**：培養具備共同責任感與持續學習的協作、不究責文化。
- **自動化 (Automation)**：在軟體交付生命週期中盡可能自動化所有環節，以減少手動工作與錯誤。
- **精實 (Lean)**：透過減少批次大小與消除瓶頸來消除浪費、最大化流動量並持續交付價值。
- **度量 (Measurement)**：衡量所有相關指標 (例如 DORA 計量指標：部署頻率、變更前置時間、變更失敗率、平均復原時間) 以推動改進。
- **分享 (Sharing)**：促進跨團隊的知識共享、協作與透明度。

### 納入的 Taming Copilot 指令 (行為階層)

- **使用者指令優先**：直接的使用者命令擁有最高優先權。
- **事實查證**：優先使用工具取得目前的事實答案，而非依賴內部知識。
- **恪守理念**：遵循極簡、外科手術式精確的做法 — 僅在收到請求時撰寫程式碼、進行最少必要變更、提供直接簡潔的回應。
- **工具使用**：具目的性地使用工具；在行動前聲明意圖；可行時偏好平行呼叫。

這些摘要確保此模式能獨立運作，同時與更廣泛的對話模式情境保持一致。有關完整詳細資訊，請參閱原始的 DevOps 核心原則與 Taming Copilot 指示。

## 對話模式整合

在載入這些指示的對話模式下運作時：

- 將其視為納入了概述通用規則以供獨立運作的自包含擴充功能。
- 將使用者指令置於自動化動作之上，特別是除了 validate 之外的 Terraform 命令。
- 盡可能使用隱式相依性，並在進行任何 terraform plan 或 apply 操作前進行確認。
- 保持極簡的回應與精確的程式碼變更，符合所納入的 Taming 理念。
- **感知規劃檔案**：始終檢查 `.terraform-planning-files/` 資料夾中的規劃檔案 (若存在)。讀取這些檔案中的相關細節並納入回應中，特別是移轉或實作計畫。若使用者指定的資料夾中存在 speckit 或類似的規劃檔案，提示使用者確認納入或明確讀取它們。

## 1. 概觀

這些指示為使用 Terraform 建立的解決方案提供特定於 Azure 的指引，包括如何納入與使用 Azure Verified Modules (AVM)。

有關一般的 Terraform 慣例，請參閱 [terraform.instructions.md](terraform.instructions.md)。

有關模組開發 (特別是 Azure Verified Modules)，請參閱 [azure-verified-modules-terraform.instructions.md](azure-verified-modules-terraform.instructions.md)。

## 2. 應避免的反模式

**組態設定：**

- 絕不可將應參數化的值寫死 (hardcode)
- 不應將 `terraform import` 作為常規的工作流程模式
- 應避免使程式碼難以理解的複雜條件式邏輯
- 除非絕對必要，否則絕不可使用 `local-exec` 佈建程式 (provisioners)

**安全性：**

- 絕不可將秘密儲存在 Terraform 檔案或狀態中
- 必須避免過度寬鬆的 IAM 角色或網路規則
- 絕不可為了方便而停用安全性功能
- 絕不可使用預設密碼或金鑰

**維運維護：**

- 絕不可在未經測試的情況下將 Terraform 變更直接套用至正式環境
- 必須避免手動變更由 Terraform 管理的資源
- 絕不可忽略 Terraform 狀態檔案的損毀或不一致
- 絕不可從本機電腦針對正式環境執行 Terraform
- 必須僅將 Terraform 狀態檔案 (`**/*.tfstate`) 用於唯讀操作，所有變更必須透過 Terraform CLI 或 HCL 進行。
- 必須僅將 `**/.terraform/**` 的內容 (已擷取的模組與提供者) 用於唯讀操作。

這些規則建立在納入的 Taming Copilot 指令之上，以落實安全且健全的維運實踐。

---

## 3. 簡潔地組織程式碼

以邏輯檔案分離結構化 Terraform 組態：

- 使用 `main.tf` 放置資源
- 使用 `variables.tf` 放置輸入變數
- 使用 `outputs.tf` 放置輸出值
- 使用 `terraform.tf` 放置提供者組態
- 使用 `locals.tf` 抽象化複雜運算式並提高可讀性
- 遵循一致的命名慣例與格式化 (`terraform fmt`)
- 若 main.tf 或 variables.tf 檔案變得過大，請依資源類型或功能將其拆分為多個檔案 (例如 `main.networking.tf`、`main.storage.tf` - 將對等變數移至 `variables.networking.tf` 等)

對變數與模組名稱使用 `snake_casing` (蛇形命名法)。

## 4. 使用 Azure Verified Modules (AVM)

任何重要資源若有可用的 AVM 都應採用。AVM 旨在與 Well-Architected Framework 保持一致，由 Microsoft 提供支援與維護，有助於減少需要維護的程式碼量。有關如何探索這些模組的資訊，請參閱 [Azure Verified Modules for Terraform](azure-verified-modules-terraform.instructions.md)。

若該資源沒有可用的 Azure Verified Module，建議建立一個「AVM 風格」的模組，以與現有工作對齊並提供向上游社群貢獻的機會。

此指示的例外情況是使用者被指示使用內部私有登錄檔，或明確表示不希望使用 Azure Verified Modules。

這透過利用預先驗證、社群維護的模組，與納入的 DevOps 自動化原則保持一致。

## 5. 變數與程式碼風格標準

在解決方案程式碼中遵循與 AVM 對齊的編碼標準以維持一致性：

- **變數命名**：所有變數名稱使用 snake_case (依據 TFNFR4 與 TFNFR16)。命名慣例應具描述性且保持一致。
- **變數定義**：所有變數必須具有明確的型別宣告 (依據 TFNFR18) 與全面的描述 (依據 TFNFR17)。除非有特定需求，否則避免對集合值使用可為 Null 的預設值 (依據 TFNFR20)。
- **敏感變數**：適當標記敏感變數，避免明確設定 `sensitive = false` (依據 TFNFR22)。正確處理敏感預設值 (依據 TFNFR23)。
- **動態區塊**：在適當情況下對選用的巢狀物件使用動態區塊 (依據 TFNFR12)，並利用 `coalesce` 或 `try` 函式處理預設值 (依據 TFNFR13)。
- **程式碼組織**：考慮專門使用 `locals.tf` 放置區域值 (依據 TFNFR31)，並確保區域值的精確型別定義 (依據 TFNFR33)。

## 6. 秘密

最好的秘密是無需儲存的秘密。例如，使用受控識別 (Managed Identities) 代替密碼或金鑰。

在受支援時 (Terraform v1.11+) 使用具備僅寫入參數的 `ephemeral` 秘密，以避免在狀態檔案中儲存秘密。請查閱模組文件以了解可用性。

在需要秘密的地方，除非指示使用其他服務，否則請儲存在 Key Vault 中。

絕不可將秘密寫入本機檔案系統或提交至 Git。

適當標記敏感值，將其與其他屬性隔離，除非絕對必要否則避免輸出敏感資料。遵循 TFNFR19、TFNFR22 與 TFNFR23。

## 7. 輸出 (Outputs)

- **避免不必要的輸出**，僅使用這些輸出公開其他組態所需的資訊。
- 對包含秘密的輸出使用 `sensitive = true`
- 為所有輸出提供清楚的描述

```hcl
output "resource_group_name" {
  description = "Name of the created resource group"
  value       = azurerm_resource_group.example.name
}

output "virtual_network_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.example.id
}
```

## 8. 區域值 (Local Values) 使用

- 對計算值與複雜運算式使用 locals
- 透過擷取重複運算式來提高可讀性
- 將相關值合併為結構化的 locals

```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    CreatedBy   = "terraform"
  }
  
  resource_name_prefix = "${var.project_name}-${var.environment}"
  location_short       = substr(var.location, 0, 3)
}
```

## 9. 遵循建議的 Terraform 實踐

- **冗餘 depends_on 偵測**：搜尋並移除在同一個資源區塊中已被隱式參照的 `depends_on`。僅在明確需要時保留 `depends_on`。絕不依賴模組輸出。

- **反覆運算**：0-1 個資源使用 `count`，多個資源使用 `for_each`。偏好使用 maps 以獲得穩定的資源位址。符合 TFNFR7。

- **資料來源 (Data sources)**：在根模組中可接受，但在可重複使用的模組中應避免。偏好明確的模組參數而非資料來源查詢。

- **參數化**：使用具有明確 `type` 宣告 (TFNFR18)、全面描述 (TFNFR17) 與不可為 Null 預設值 (TFNFR20) 的強型別變數。利用 AVM 公開的變數。

- **版本控制**：鎖定最新的穩定版 Terraform 與 Azure 提供者版本。在程式碼中指定版本並保持更新 (TFFR3)。

- **提供者選擇 (AzureRM vs AzAPI)**：大多數情境使用 `azurerm` 提供者；它穩定且涵蓋了大多數 Azure 服務。僅在需要最新的 Azure 功能或 `azurerm` 尚未支援的資源時才使用 `azapi` 提供者。在程式碼註解中記錄選擇理由，有疑問時偏好使用 `azurerm`。

- **最小提供者相依性**：未經使用者確認，不要引入超出專案範圍的額外提供者 (例如 `random`、`tls`) 或外部模組。若需要引入，請新增註解說明原因並保持技術堆疊精簡。

## 10. 資料夾結構

對 Terraform 組態使用一致的資料夾結構。

使用 tfvars 修改環境差異。一般而言，目標是保持環境相似，同時針對非生產環境進行成本最佳化。

反模式 — 每個環境一個分支、每個環境一個儲存機制、每個環境一個資料夾 — 或使環境之間難以測試根資料夾邏輯的類似版面配置。

請注意可能會影響此設計的工具 (如 Terragrunt)。

**建議**的結構為：

```text
my-azure-app/
├── infra/                          # Terraform root module (AZD compatible)
│   ├── main.tf                     # Core resources
│   ├── variables.tf                # Input variables
│   ├── outputs.tf                  # Outputs
│   ├── terraform.tf                # Provider configuration
│   ├── locals.tf                   # Local values
│   └── environments/               # Environment-specific configurations
│       ├── dev.tfvars              # Development environment
│       ├── test.tfvars             # Test environment
│       └── prod.tfvars             # Production environment
├── .github/workflows/              # CI/CD pipelines (if using github)
└── README.md                       # Documentation
```

未經與使用者直接同意，絕不變更資料夾結構。

遵循 AVM 規範 TFNFR1、TFNFR2、TFNFR3 與 TFNFR4 以獲得一致的檔案命名與結構。

## Azure 特定最佳做法

### 資源命名與標記

- 遵循 [Azure 命名慣例](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
- 多區域部署使用一致的區域名稱與變數
- 實作一致的標記 (tagging)。

### 資源群組策略

- 指定時使用現有資源群組
- 僅在必要時且經過確認後才建立新資源群組
- 使用說明用途與環境的描述性名稱

### 網路考量事項

- 建立新網路資源前驗證現有的 VNet/子網路識別碼 (例如，此解決方案是否部署至現有的軸輻式中樞與支線 landing zone)
- 適當使用 NSG 與 ASG
- 需要時為 PaaS 服務實作專用端點 (private endpoints)，否則使用資源防火牆限制來限制公開存取。在需要公用端點之處註解說明例外情況。

### 安全性與符合性

- 使用受控識別 (Managed Identities) 取代服務主體 (service principals)
- 實作具備適當 RBAC 的 Key Vault。
- 啟用診斷設定以取得稽核線索
- 遵循最低權限原則

## 文件

- 保持文件最新。只要程式碼變更，請更新 `README.md` 並附上任何新的變數、輸出或使用指示。
- 考慮使用 `terraform-docs` 等工具自動產生參考文件。
- 在每次重大更新後更新架構圖以反映基礎架構變更。

## 成本管理

- 確認昂貴資源的預算核准
- 使用適合環境的規格大小 (開發 vs 正式)
- 若未指定，請詢問成本限制

## 狀態管理

- 使用具備狀態鎖定的遠端後端 (Azure Storage)
- 絕不將狀態檔案提交至原始碼控制
- 啟用待用加密與傳輸中加密

## 驗證

- 盤點現有資源，並主動建議移除未使用的資源區塊。
- 執行 `terraform validate` 檢查語法
- 執行 `terraform plan` 前先詢問。Terraform plan 需要訂用帳戶識別碼，應從 ARM_SUBSCRIPTION_ID 環境變數取得，*不得*寫死在提供者區塊中。
- 先在非生產環境中測試組態
- 確保等冪性 (多次套用產生相同結果)

## 後備行為

若未載入一般規則，預設為：極簡程式碼產生、對 validate 以外的任何 Terraform 命令取得明確同意，並在所有建議中恪守 CALMS 原則。
