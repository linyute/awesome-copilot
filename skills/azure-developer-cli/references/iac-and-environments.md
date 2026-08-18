# 基礎結構即程式碼與環境 (Infrastructure as code and environments)

## 審慎選擇提供者

### Bicep

在下列情況下使用 Bicep：

- 專案僅使用 Azure。
- 原生 Azure 資源涵蓋範圍與即時 API 支援至關重要。
- 團隊需要無狀態部署模型。
- Azure 驗證模組 (Azure Verified Modules) 涵蓋了常見的資源模式。

Bicep 是 AZD 的預設 IaC 提供者。

### Terraform

在下列情況下使用 Terraform：

- 存放庫已在使用 Terraform。
- 團隊已建立成熟的 Terraform 模組、狀態、原則與審查實務。
- 跨提供者基礎結構是實際需求。

目前的 Microsoft 文件將 AZD Terraform 支援標記為 Beta。請呈現此限制，不要僅因為熟悉而將專案移轉至 Terraform。

## Bicep 結構

將 `main.bicep` 保留為協調流程層：

```text
infra/
|-- main.bicep
|-- main.parameters.json
|-- modules/
|   |-- core/
|   |-- data/
|   |-- identity/
|   |-- observability/
|   |-- services/
```

### Bicep 實務

- 刻意宣告部署 `targetScope`。
- 對於具備內聚力的功能與重複模式使用模組。
- 當 Azure 驗證模組符合需求且團隊接受其版本控制模型時，優先採用它。
- 釘選模組版本；審查升級而非自動浮動版本。
- 為參數新增描述與驗證修飾詞。
- 透過模組向下傳遞參數，而非在每個模組內部讀取 AZD 環境變數。
- 使用遵循各資源類型長度與字元限制的確定性名稱。
- 在需要全域唯一性的地方，使用具有穩定範圍輸入的 `uniqueString`。
- 在原則允許的情況下套用一致的專案、環境、擁有者與成本標記。
- 使用受控識別與窄範圍的角色指派。
- 當以身分識別為基礎的存取可用時，避免使用金鑰與連接字串。
- 輸出後續階段所需的資源識別碼、名稱與端點。
- 切勿輸出機密值。部署輸出會複製到 AZD 環境中。

### 參數流程

使用 `main.parameters.json` 將 AZD 環境值對應至 Bicep：

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environmentName": {
      "value": "${AZURE_ENV_NAME}"
    },
    "location": {
      "value": "${AZURE_LOCATION}"
    }
  }
}
```

在進入點中匹配這些值：

```bicep
@description('Stable name of the AZD deployment environment.')
@minLength(1)
param environmentName string

@description('Primary Azure region for this deployment.')
param location string
```

使用輸出作為佈建與後續 AZD 階段之間的合約：

```bicep
output SERVICE_API_ENDPOINT_URL string = api.outputs.endpoint
```

選擇穩定的輸出名稱，因為服務、掛鉤與管道可能會將其作為環境變數取用。

在 Bicep 中使用 AZD 環境機密時：

- 使用 `@secure()` 標記 Bicep 輸入。
- 透過 `main.parameters.json` 對應 AZD 機密參照。
- 不要輸出受保護的值。
- 請注意，目前的 AZD 文件指出 `.bicepparam` 檔案不支援環境機密。

## Terraform 結構與狀態

### Terraform 實務

- 在 `azure.yaml` 中明確設定 `infra.provider: terraform`。
- 將所有由 AZD 管理的 `.tf` 檔案保留在設定的基礎結構路徑下。
- 釘選 Terraform 與提供者版本，並提交相依性鎖定檔案。
- 使用具有明確輸入與輸出的模組。
- 將敏感變數與輸出標記為 `sensitive`，但請記住敏感值仍可能存在於狀態中。
- 請勿提交 `.tfstate`、計劃檔案、損毀記錄或提供者認證。
- 避免在 AZD 與不相關的 Terraform 根模組之間分割相同 Azure 資源的擁有權。

### 驗證

Terraform 的 Azure 提供者預設使用 Azure CLI 驗證，不使用 AZD 認證快取。優先使用官方記載的單一登入設定：

```text
azd config set auth.useAzCliAuth true
az login
```

否則，`azd auth login` 和 `az login` 兩者都是必需的。

### 遠端狀態

在執行 `azd pipeline config` 或協同部署之前，先設定受保護的遠端後端：

- 在適當情況下使用專用儲存體帳戶與私人容器。
- 使用 RBAC 與網路控制限制存取。
- 根據組織原則啟用版本控制、虛擬刪除與資源鎖定等平台保護措施。
- 針對每個專案與環境使用相異的狀態金鑰。
- 將狀態視為敏感資料。
- 請勿在原始檔控制中儲存後端存取金鑰。

根據官方 Terraform 整合進行設定時，AZD 會從 `infra/provider.conf.json` 讀取 Terraform 後端設定。

## 環境策略

AZD 在下列路徑儲存本機環境狀態：

```text
.azure/
|-- config.json
|-- <environment-name>/
    |-- .env
    |-- config.json
```

整個 `.azure` 目錄應保留在原始檔控制之外。

### 命名

使用能明確表明擁有權與生命週期的名稱：

- 共用：`<project>-dev`、`<project>-test`、`<project>-prod`
- 個人：`<alias>-<purpose>` 或 `<alias>-dev`
- 暫時：`<project>-pr-<number>`（當自動化也能確保清理時）

保持名稱足夠簡短，以支援具有嚴格命名限制的資源。

### 管理

使用 AZD 指令而非手動編輯檔案：

```text
azd env new <name>
azd env list
azd env select <name>
azd env set <key> <value>
azd env get-value <key>
azd env unset <key>
azd env refresh
```

在自動化與潛在破壞性操作中，明確指定目標環境：

```text
azd provision -e <environment> --no-prompt
azd deploy -e <environment> --no-prompt
```

### 設定規則

- 保留單一 IaC 程式碼庫，並透過參數改變行為。
- 將非機密預設值保留在經審查的設定或 IaC 中，而不是在已提交的 `.azure` 檔案中。
- 將 `azd env set` 用於特定部署的非機密設定。
- 允許 IaC 輸出填入計算後的資源名稱與端點。
- 避免散佈在模組中的環境名稱條件判斷式。偏好使用明確的功能或 SKU 參數。
- 在其他執行者變更部署輸出後使用 `azd env refresh`。
- 在指令碼中不要假設目前選取的環境。

## 共用與遠端環境

當團隊成員或自動化需要共用 AZD 環境時設定 `state.remote`：

```yaml
state:
  remote:
    backend: AzureBlobStorage
    config:
      accountName: <storage-account-name>
      containerName: <project-container-name>
```

遠端 AZD 狀態會同步處理 `.env` 與 AZD `config.json`；它與 Terraform 遠端狀態是分開的。透過 AZD 進行協作的 Terraform 專案可能需要兩者：

- 用於環境設定的 AZD 遠端狀態。
- 用於受管理基礎結構狀態的 Terraform 遠端狀態。

使用最小權限 RBAC 與適當的資料保護設定來保護這兩個儲存區。
