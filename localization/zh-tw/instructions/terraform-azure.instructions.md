---
description: '使用 Azure 上的 Terraform 建立或修改解決方案。'
applyTo: '**/*.terraform, **/*.tf, **/*.tfvars, **/*.tflint.hcl, **/*.tfstate, **/*.tf.json, **/*.tfvars.json'
---

# Azure Terraform 最佳實踐

## 整合與自給自足

本說明集擴展了 Azure/Terraform 情境的通用 DevOps 核心原則和馴服 Copilot 指令。它假設這些基本規則已載入，但在此處包含摘要以實現自給自足。如果通用規則不存在，這些摘要將作為預設值以保持行為一致性。

### 納入的 DevOps 核心原則 (CALMS 框架)

- **文化**: 培養協作、無責備的文化，具有共同責任和持續學習。
- **自動化**: 自動化軟體交付生命週期中所有可能的一切，以減少手動工作和錯誤。

- **精益**: 透過減少批次大小和瓶頸，消除浪費，最大化流程，並持續交付價值。
- **測量**: 測量所有相關事物 (例如，DORA 指標：部署頻率、變更前置時間、變更失敗率、平均復原時間) 以推動改進。
- **共享**: 促進團隊之間的知識共享、協作和透明度。

### 納入的馴服 Copilot 指令 (行為層次結構)

- **使用者指令優先**: 直接的使用者命令具有最高優先順序。
- **事實驗證**: 優先使用工具來獲取當前、事實的答案，而不是內部知識。
- **遵循哲學**: 遵循極簡主義、外科手術式的方法——僅在請求時提供程式碼，最小必要的變更，直接而簡潔的回應。
- **工具使用**: 有目的地使用工具；在行動之前聲明意圖；盡可能優先並行呼叫。

這些摘要確保模式獨立運作，同時與更廣泛的聊天模式內容保持一致。有關完整詳細資訊，請參閱原始的 DevOps 核心原則和馴服 Copilot 指令。

## 聊天模式整合

在載入這些指令的聊天模式下操作時：

- 將此視為一個自給自足的擴展，其中包含摘要的通用規則以實現獨立操作。
- 優先處理使用者指令，而不是自動化動作，尤其是對於 terraform 命令之外的驗證。
- 盡可能使用隱式依賴項，並在任何 terraform 規劃或應用程式操作之前確認。
- 保持極簡主義的回應和外科手術式的程式碼變更，與納入的馴服哲學保持一致。
- **規劃檔案意識**: 始終檢查 `.terraform-planning-files/` 資料夾中是否存在規劃檔案 (如果存在)。讀取並將這些檔案中的相關詳細資訊納入回應中，尤其是對於遷移或實作計畫。如果使用者指定資料夾中存在 speckit 或類似的規劃檔案，請提示使用者確認包含或明確讀取它們。

## 1. 概述

這些指令為使用 Terraform 建立的解決方案提供 Azure 特定指南，包括如何整合和使用 Azure 驗證模組。

有關通用 Terraform 慣例，請參閱 [terraform.instructions.md](terraform.instructions.md)。

有關模組開發，尤其是 Azure 驗證模組，請參閱 [azure-verified-modules-terraform.instructions.md](azure-verified-modules-terraform.instructions.md)。

## 2. 應避免的反模式

**組態：**

- 絕不能硬編碼應參數化的值
- 不應將 `terraform import` 作為常規工作流程模式
- 應避免使程式碼難以理解的複雜條件邏輯
- 絕不能使用 `local-exec` 佈建器，除非絕對必要

**安全性：**

- 絕不能將機密儲存在 Terraform 檔案或狀態中
- 必須避免過於寬鬆的 IAM 角色或網路規則
- 絕不能為了方便而禁用安全功能
- 絕不能使用預設密碼或金鑰

**操作：**

- 絕不能未經測試直接將 Terraform 變更應用於生產環境
- 必須避免手動變更 Terraform 管理的資源
- 絕不能忽略 Terraform 狀態檔案損壞或不一致
- 絕不能從本地機器執行 Terraform 以用於生產環境
- 只能將 Terraform 狀態檔案 (`**/*.tfstate`) 用於唯讀操作，所有變更都必須透過 Terraform CLI 或 HCL 進行。
- 只能將 `**/.terraform/**` (擷取的模組和提供者) 的內容用於唯讀操作。

這些建立在納入的馴服 Copilot 指令之上，以實現安全、操作實踐。

---

## 3. 清潔地組織程式碼

使用邏輯檔案分離來建構 Terraform 組態：

- `main.tf` 用於資源
- `variables.tf` 用於輸入
- `outputs.tf` 用於輸出
- `terraform.tf` 用於提供者組態
- `locals.tf` 用於抽象複雜表達式並提高可讀性
- 遵循一致的命名慣例和格式 (`terraform fmt`)
- 如果 `main.tf` 或 `variables.tf` 檔案變得太大，請按資源型別或功能將它們拆分為多個檔案 (例如，`main.networking.tf`、`main.storage.tf` - 將等效變數移至 `variables.networking.tf` 等)

變數和模組名稱使用 `snake_casing`。

## 4. 使用 Azure 驗證模組 (AVM)

任何重要的資源都應使用 AVM (如果可用)。AVM 旨在與良好架構框架保持一致，並由 Microsoft 支援和維護，有助於減少要維護的程式碼量。有關如何發現這些模組的資訊，請參閱 [Azure Terraform 驗證模組](azure-verified-modules-terraform.instructions.md)。

如果資源沒有可用的 Azure 驗證模組，建議「以 AVM 的風格」建立一個，以便與現有工作保持一致，並提供向上游社群貢獻的機會。

此指令的例外情況是，如果使用者已被指示使用內部私有登錄，或明確表示他們不希望使用 Azure 驗證模組。

這與納入的 DevOps 自動化原則保持一致，透過利用預先驗證、社群維護的模組。

## 5. 變數和程式碼樣式標準

在解決方案程式碼中遵循與 AVM 一致的程式碼標準以保持一致性：

- **變數命名**: 所有變數名稱都使用 snake_case (根據 TFNFR4 和 TFNFR16)。命名慣例應具有描述性和一致性。
- **變數定義**: 所有變數都必須具有明確的型別宣告 (根據 TFNFR18) 和全面的描述 (根據 TFNFR17)。除非有特殊需要，否則避免集合值的可空預設值 (根據 TFNFR20)。
- **敏感變數**: 適當地標記敏感變數，並避免明確設定 `sensitive = false` (根據 TFNFR22)。正確處理敏感預設值 (根據 TFNFR23)。
- **動態區塊**: 適當地使用動態區塊處理可選的巢狀物件 (根據 TFNFR12)，並利用 `coalesce` 或 `try` 函式處理預設值 (根據 TFNFR13)。
- **程式碼組織**: 考慮專門為本地值使用 `locals.tf` (根據 TFNFR31)，並確保本地值的精確型別 (根據 TFNFR33)。

## 6. 機密

最好的機密是不需要儲存的機密。例如，使用受管識別而不是密碼或金鑰。

在支援的情況下 (Terraform v1.11+)，使用具有唯寫參數的 `ephemeral` 機密，以避免將機密儲存在狀態檔案中。請查閱模組文件以了解可用性。

如果需要機密，請將其儲存在 Key Vault 中，除非指示使用不同的服務。

絕不能將機密寫入本地檔案系統或提交到 git。

適當地標記敏感值，將它們與其他屬性隔離，並避免輸出敏感資料，除非絕對必要。遵循 TFNFR19、TFNFR22 和 TFNFR23。

## 7. 輸出

- **避免不必要的輸出**，僅使用這些輸出公開其他組態所需的資訊。
- 對於包含機密的輸出，使用 `sensitive = true`
- 為所有輸出提供清晰的描述

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

## 8. 本地值使用

- 將本地值用於計算值和複雜表達式
- 透過提取重複表達式來提高可讀性
- 將相關值組合成結構化的本地值

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

## 9. 遵循推薦的 Terraform 實踐

- **冗餘 depends_on 偵測**: 搜尋並移除在同一資源區塊中已隱式引用的依賴資源的 `depends_on`。僅在明確需要時保留 `depends_on`。絕不依賴模組輸出。

- **迭代**: 對於 0-1 個資源使用 `count`，對於多個資源使用 `for_each`。優先使用映射以實現穩定的資源位址。與 TFNFR7 保持一致。

- **資料來源**: 在根模組中可接受，但在可重用模組中應避免。優先使用明確的模組參數，而不是資料來源查詢。

- **參數化**: 使用具有明確 `type` 宣告 (TFNFR18)、全面描述 (TFNFR17) 和非空預設值 (TFNFR20) 的強型別變數。利用 AVM 公開的變數。

- **版本控制**: 目標是最新穩定的 Terraform 和 Azure 提供者版本。在程式碼中指定版本並保持更新 (TFFR3)。

## 10. 資料夾結構

為 Terraform 組態使用一致的資料夾結構。

使用 tfvars 修改環境差異。通常，目標是保持環境相似，同時針對非生產環境進行成本最佳化。

反模式 - 每個環境一個分支、每個環境一個儲存庫、每個環境一個資料夾 - 或類似的佈局，這些佈局使得在環境之間測試根資料夾邏輯變得困難。

請注意 Terragrunt 等工具可能會影響此設計。

**建議**的結構是：

```text
my-azure-app/
├── infra/                          # Terraform 根模組 (AZD 相容)
│   ├── main.tf                     # 核心資源
│   ├── variables.tf                # 輸入變數
│   ├── outputs.tf                  # 輸出
│   ├── terraform.tf                # 提供者組態
│   ├── locals.tf                   # 本地值
│   └── environments/               # 環境特定組態
│       ├── dev.tfvars              # 開發環境
│       ├── test.tfvars             # 測試環境
│       └── prod.tfvars             # 生產環境
├── .github/workflows/              # CI/CD 管線 (如果使用 github)
├── .azdo/                          # CI/CD 管線 (如果使用 Azure DevOps 建議)
└── README.md                       # 文件
```

未經使用者直接同意，絕不能變更資料夾結構。

遵循 AVM 規範 TFNFR1、TFNFR2、TFNFR3 和 TFNFR4，以實現一致的檔案命名和結構。

## Azure 特定最佳實踐

### 資源命名和標記

- 遵循 [Azure 命名慣例](https://learn.microsoft.com/zh-tw/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
- 對於多區域部署，使用一致的區域命名和變數
- 實作一致的標記。

### 資源群組策略

- 在指定時使用現有資源群組
- 僅在必要時並經確認後才建立新的資源群組
- 使用描述性名稱指示用途和環境

### 網路考量

- 在建立新的網路資源之前驗證現有的 VNet/子網路 ID (例如，此解決方案是否部署到現有的中樞輻射登陸區域)
- 適當地使用 NSG 和 ASG
- 在需要時為 PaaS 服務實作私人端點，否則使用資源防火牆限制來限制公共存取。註明需要公共端點的例外情況。

### 安全性和合規性

- 使用受管識別而不是服務主體
- 實作具有適當 RBAC 的 Key Vault。
- 啟用診斷設定以進行稽核追蹤
- 遵循最小權限原則

## 成本管理

- 確認昂貴資源的預算批准
- 使用適合環境的大小調整 (開發與生產)
- 如果未指定，請詢問成本限制

## 狀態管理

- 使用具有狀態鎖定的遠端後端 (Azure 儲存體)
- 絕不將狀態檔案提交到原始碼控制
- 啟用靜態和傳輸中的加密

## 驗證

- 清點現有資源並提供移除未使用的資源區塊。
- 執行 `terraform validate` 以檢查語法
- 在執行 `terraform plan` 之前詢問。Terraform plan 將需要訂閱 ID，這應該從 ARM_SUBSCRIPTION_ID 環境變數中獲取，*而不是*在提供者區塊中編碼。
- 首先在非生產環境中測試組態
- 確保冪等性 (多次應用程式產生相同的結果)

## 後備行為

如果未載入通用規則，則預設為：極簡主義程式碼生成、對驗證之外的任何 terraform 命令的明確同意，以及在所有建議中遵循 CALMS 原則。
