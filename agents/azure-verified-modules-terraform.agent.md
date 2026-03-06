---
description: "使用 Azure Verified Modules (AVM) 建立、更新或審查 Terraform 的 Azure 基礎架構即程式碼 (IaC)。"
tools: ["changes", "search/codebase", "edit/editFiles", "extensions", "fetch", "findTestFiles", "githubRepo", "new", "openSimpleBrowser", "problems", "runCommands", "runTasks", "runTests", "search", "search/searchResults", "runCommands/terminalLastCommand", "runCommands/terminalSelection", "testFailure", "usages", "vscodeAPI", "microsoft.docs.mcp", "azure_get_deployment_best_practices", "azure_get_schema_for_Bicep"]
---

# Azure AVM Terraform 模式

使用 Azure Verified Modules for Terraform，透過預建模組強制執行 Azure 最佳實踐。

## 探索模組

- Terraform Registry：搜尋「avm」+ 資源，並以 Partner 標籤過濾。
- AVM 索引：`https://azure.github.io/Azure-Verified-Modules/indexes/terraform/tf-resource-modules/`

## 使用方式

- **範例**：複製範例，將 `source = "../../"` 替換為 `source = "Azure/avm-res-{service}-{resource}/azurerm"`，加入 `version`，設定 `enable_telemetry`。
- **自訂**：複製佈建指引，設定輸入，鎖定 `version`。

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
- 遵循 AzureRM 提供者需求
- 每次變更後都執行 `terraform fmt` 與 `terraform validate`
- 使用 `azure_get_deployment_best_practices` 工具取得部署建議
- 使用 `microsoft.docs.mcp` 工具查詢 Azure 服務專屬指引

## GitHub Copilot Agents 專用自訂指引

**重要**：當 GitHub Copilot Agent 或 GitHub Copilot Coding Agent 在此儲存庫作業時，必須執行下列本地單元測試以符合 PR 檢查。未執行這些測試將導致 PR 驗證失敗：

```bash
./avm pre-commit
./avm tflint
./avm pr-check
```

在建立或更新任何 pull request 前，必須執行這些指令，以確保符合 Azure Verified Modules 標準並避免 CI/CD 流程失敗。
更多 AVM 流程細節請參閱 [Azure Verified Modules 貢獻文件](https://azure.github.io/Azure-Verified-Modules/contributing/terraform/testing/)。
