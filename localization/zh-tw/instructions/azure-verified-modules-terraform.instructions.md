---
description: 'Azure Verified Modules (AVM) 與 Terraform'
applyTo: '**/*.terraform, **/*.tf, **/*.tfvars, **/*.tfstate, **/*.tflint.hcl, **/*.tf.json, **/*.tfvars.json'
---

# Azure Verified Modules (AVM) Terraform

## 概述

Azure Verified Modules (AVM) 是預先建置、測試並驗證的 Terraform 與 Bicep 模組，遵循 Azure 最佳實踐。使用這些模組可安心建立、更新或審查 Azure 基礎架構即程式碼（IaC）。

## GitHub Copilot Agents 專用自訂指引

**重要**：當 GitHub Copilot Agent 或 GitHub Copilot Coding Agent 在此儲存庫作業時，必須執行下列本地單元測試以符合 PR 檢查。未執行這些測試將導致 PR 驗證失敗：

```bash
./avm pre-commit
./avm tflint
./avm pr-check
```

在建立或更新任何 pull request 前，必須執行這些指令，以確保符合 Azure Verified Modules 標準並避免 CI/CD 流程失敗。
更多 AVM 流程細節請參閱 [Azure Verified Modules 貢獻文件](https://azure.github.io/Azure-Verified-Modules/contributing/terraform/testing/)。

**未執行這些測試將導致 PR 驗證失敗並無法成功合併。**

## 模組探索

### Terraform Registry

- 搜尋「avm」+ 資源名稱
- 以「Partner」標籤過濾，尋找官方 AVM 模組
- 範例：搜尋「avm storage account」→ 以 Partner 過濾

### 官方 AVM 索引

> **注意：** 以下連結總是指向主分支上 CSV 檔案的最新版本。因此，這些檔案可能會隨時間變化。如果您需要特定時間點的版本，請考慮使用 URL 中的特定發布標籤。

- **Terraform 資源模組**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/TerraformResourceModules.csv`
- **Terraform 模式模組**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/TerraformPatternModules.csv`
- **Terraform 公用程式模組**：`https://raw.githubusercontent.com/Azure/Azure-Verified-temp/localization/zh-tw/instructions/azure-verified-modules-terraform.instructions.md`

## Terraform 模組使用方式

### 由範例開始

1. 從模組文件複製範例程式碼
2. 將 `source = "../../"` 替換為 `source = "Azure/avm-res-{service}-{resource}/azurerm"`
3. 加入 `version = "~> 1.0"`（請用最新版本）
4. 設定 `enable_telemetry = true`

### 從零開始

1. 從模組文件複製佈建指引
2. 設定必要與選用輸入參數
3. 鎖定模組版本
4. 啟用遙測

### 使用範例

```hcl
module "storage_account" {
  source  = "Azure/avm-res-storage-storageaccount/azurerm"
  version = "~> 0.1"

  enable_telemetry    = true
  location            = "East US"
  name                = "mystorageaccount"
  resource_group_name = "my-rg"

  # 其他設定...
}
```

## 命名慣例

### 模組類型

- **資源模組**：`Azure/avm-res-{service}-{resource}/azurerm`
  - 範例：`Azure/avm-res-storage-storageaccount/azurerm`
- **樣式模組**：`Azure/avm-ptn-{pattern}/azurerm`
  - 範例：`Azure/avm-ptn-aks-enterprise/azurerm`
- **工具模組**：`Azure/avm-utl-{utility}/azurerm`
  - 範例：`Azure/avm-utl-regions/azurerm`

### 服務命名

- 服務與資源請用 kebab-case
- 遵循 Azure 服務命名（如 `storage-storageaccount`、`network-virtualnetwork`）

## 版本管理

### 查詢可用版本

- 端點：`https://registry.terraform.io/v1/modules/Azure/{module}/azurerm/versions`
- 範例：`https://registry.terraform.io/v1/modules/Azure/avm-res-storage-storageaccount/azurerm/versions`

### 版本鎖定最佳實踐

- 使用悲觀版本約束：`version = "~> 1.0"`
- 生產環境請鎖定特定版本：`version = "1.2.3"`
- 升級前請務必檢查 changelog

## 模組來源

### Terraform Registry

- **URL 格式**：`https://registry.terraform.io/modules/Azure/{module}/azurerm/latest`
- **範例**：`https://registry.terraform.io/modules/Azure/avm-res-storage-storageaccount/azurerm/latest`

### GitHub 倉庫

- **URL 格式**：`https://github.com/Azure/terraform-azurerm-avm-{type}-{service}-{resource}`
- **範例**：
  - 資源：`https://github.com/Azure/terraform-azurerm-avm-res-storage-storageaccount`
  - 樣式：`https://github.com/Azure/terraform-azurerm-avm-ptn-aks-enterprise`

## 開發最佳實踐

### 模組使用

- ✅ **必須**鎖定模組與提供者版本
- ✅ **以官方範例為起點**
- ✅ **實作前檢查所有輸入與輸出**
- ✅ **啟用遙測**：`enable_telemetry = true`
- ✅ **使用 AVM 工具模組處理常見樣式**
- ✅ **遵循 AzureRM 提供者需求與限制**

### 程式品質

- ✅ **每次變更後都執行 `terraform fmt`**
- ✅ **每次變更後都執行 `terraform validate`**
- ✅ **使用有意義的變數名稱與描述**
- ✅ **加入適當標籤與中繼資料**
- ✅ **複雜設定需加註解說明**

### 驗證需求

建立或更新 pull request 前：

```bash
# 格式化程式碼
terraform fmt -recursive

# 驗證語法
terraform validate

# AVM 專屬驗證（強制）
./avm pre-commit
./avm tflint
./avm pr-check
```

## 工具整合

### 使用可用工具

- **部署指引**：使用 `azure_get_deployment_best_practices` 工具
- **服務文件**：使用 `microsoft.docs.mcp` 工具查詢 Azure 服務專屬指引
- **Schema 資訊**：Bicep 資源請用 `azure_get_schema_for_Bicep`

### GitHub Copilot 整合

在 AVM 倉庫作業時：

1. 建立新資源前，務必先檢查現有模組
2. 以官方範例為起點
3. 提交前執行所有驗證測試
4. 文件化所有自訂或偏離範例之處

## 常見樣式

### 資源群組模組

```hcl
module "resource_group" {
  source  = "Azure/avm-res-resources-resourcegroup/azurerm"
  version = "~> 0.1"

  enable_telemetry = true
  location         = var.location
  name            = var.resource_group_name
}
```

### 虛擬網路模組

```hcl
module "virtual_network" {
  source  = "Azure/avm-res-network-virtualnetwork/azurerm"
  version = "~> 0.1"

  enable_telemetry    = true
  location            = module.resource_group.location
  name                = var.vnet_name
  resource_group_name = module.resource_group.name
  address_space       = ["10.0.0.0/16"]
}
```

## 疑難排解

### 常見問題

1. **版本衝突**：務必檢查模組與提供者版本相容性
2. **缺少相依資源**：確保所有必要資源已先建立
3. **驗證失敗**：提交前執行 AVM 驗證工具
4. **文件參考**：務必參考最新模組文件

### 支援資源

- **AVM 文件**：`https://azure.github.io/Azure-Verified-Modules/`
- **GitHub Issues**：請在各模組 GitHub 倉庫回報問題
- **社群**：Azure Terraform Provider GitHub 討論區

## 合規檢查清單

提交任何 AVM 相關程式碼前：

- [ ] 已鎖定模組版本
- [ ] 已啟用遙測
- [ ] 程式碼已格式化（`terraform fmt`）
- [ ] 程式碼已驗證（`terraform validate`）
- [ ] AVM pre-commit 檢查通過（`./avm pre-commit`）
- [ ] TFLint 檢查通過（`./avm tflint`）
- [ ] AVM PR 檢查通過（`./avm pr-check`）
- [ ] 文件已更新
- [ ] 範例已測試且可運作
