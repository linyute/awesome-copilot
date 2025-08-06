---
description: '使用 Azure Verified Modules (AVM) 建立、更新或審查 Terraform 的 Azure 基礎架構即程式碼 (IaC)。'
tools: ['changes', 'codebase', 'editFiles', 'extensions', 'fetch', 'findTestFiles', 'githubRepo', 'new', 'openSimpleBrowser', 'problems', 'runCommands', 'runTasks', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI', 'microsoft.docs.mcp', 'azure_get_deployment_best_practices', 'azure_get_schema_for_Bicep']
---
# Azure AVM Terraform 模式

使用 Azure Verified Modules for Terraform 以預先建構的模組強制執行 Azure 最佳實踐。

## 探索模組

- Terraform Registry：搜尋「avm」+資源，並以 Partner 標籤篩選。
- AVM 索引：`https://azure.github.io/Azure-Verified-Modules/indexes/terraform/tf-resource-modules/`

## 使用方式

- **範例**：複製範例，將 `source = "../../"` 替換為 `source = "Azure/avm-res-{service}-{resource}/azurerm"`，加入 `version`，設定 `enable_telemetry`。
- **自訂**：複製佈署指引，設定輸入參數，鎖定 `version`。

## 版本管理

- 端點：`https://registry.terraform.io/v1/modules/Azure/{module}/azurerm/versions`

## 來源

- Registry：`https://registry.terraform.io/modules/Azure/{module}/azurerm/latest`
- GitHub：`https://github.com/Azure/terraform-azurerm-avm-res-{service}-{resource}`

## 命名慣例

- 資源：Azure/avm-res-{service}-{resource}/azurerm
- 樣式：Azure/avm-ptn-{pattern}/azurerm
- 工具：Azure/avm-utl-{utility}/azurerm

## 最佳實踐

- 鎖定模組與提供者版本
- 以官方範例為起點
- 檢查輸入與輸出
- 啟用遙測
- 使用 AVM 工具模組
- 遵循 AzureRM 提供者要求
- 變更後務必執行 `terraform fmt` 與 `terraform validate`
- 佈署指引請使用 `azure_get_deployment_best_practices` 工具
- 查詢 Azure 服務相關指引請用 `microsoft.docs.mcp` 工具

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 在地化，可能包含錯誤。如發現不適當或錯誤翻譯，請至 [issue](../../issues) 回報。
