# 專案結構與 `azure.yaml` (Project structure and `azure.yaml`)

## 建議的存放庫版面配置

將此作為預設值，而非重組已經一致的存放庫的理由：

```text
.
|-- .azure/                         # 產生的本機 AZD 環境狀態；已忽略
|-- .devcontainer/                  # 選擇性可重現的開發人員環境
|-- .github/
|   |-- workflows/
|       |-- azure-dev.yml           # 選擇性 GitHub Actions 管道
|-- infra/
|   |-- main.bicep                  # Bicep 協調流程進入點
|   |-- main.parameters.json        # AZD 環境至 Bicep 參數對應
|   |-- modules/
|       |-- core/                   # 共用平台資源
|       |-- app/                    # 應用程式專屬資源
|-- scripts/
|   |-- azd/                        # 掛鉤與部署輔助指令碼
|-- src/
|   |-- api/                        # 可獨立部署的服務
|   |-- web/                        # 可獨立部署的服務
|-- tests/
|-- .gitignore
|-- azure.yaml
|-- README.md
```

對於 Terraform，使用標準的 `infra` 版面配置：

```text
infra/
|-- main.tf
|-- providers.tf
|-- variables.tf
|-- outputs.tf
|-- provider.conf.json              # AZD 遠端後端設定（使用時）
|-- modules/
```

### 結構規則

- 將 `azure.yaml` 放置在專案根目錄。
- 保持應用程式原始碼獨立於部署資產。
- 保持 IaC 進入點精簡；將資源細節移入模組。
- 按職責或生命週期組織模組，而非每個資源一個任意檔案。
- 將掛鉤指令碼保留在 `infra` 之外，除非指令碼專屬於某個基礎結構層。
- 避免提交特定環境的原始碼樹狀結構（如 `infra/dev`、`infra/test` 和 `infra/prod`）。使用參數。
- 將測試保留在其正常的語言慣例附近；不要僅為了符合此範例而移動它們。
- 僅在維護並測試過的情況下包含 `.devcontainer`。

## `azure.yaml` 基準

新增結構描述指令以供編輯器驗證：

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/Azure/azure-dev/main/schemas/v1.0/azure.yaml.json
name: sample-app

infra:
  provider: bicep
  path: ./infra
  module: main

services:
  api:
    project: ./src/api
    language: ts
    host: appservice
  web:
    project: ./src/web
    dist: dist
    language: ts
    host: staticwebapp
```

即使 Bicep、`infra` 和 `main` 是預設值，明確的 `infra` 區塊在清晰度至關重要時非常有用。

## 資訊清單設計檢查清單

### 頂層設定

- `name` 為小寫，以英數字元開頭與結尾，且僅使用英數字元和連字號。
- 當存放庫作為範本分發時，`metadata.template` 識別來源範本與版本。
- `infra.provider`、`infra.path` 與 `infra.module` 與實際存放庫相符。
- 當專案相依於最低 AZD 或擴充功能版本時，使用 `requiredVersions`。
- 僅在部署順序確實需要時，`workflows` 才覆寫預設值。
- 當團隊共用 AZD 環境時，在專案範圍設定 `state.remote`。

### 服務

- 服務代表可部署的應用程式程式碼，而不是資料庫、Key Vault 或其他共用資源。
- 服務名稱簡短、有意義且穩定。
- `project` 指向服務根目錄並使用相對路徑。
- `language`、`host`、`dist`、容器與遠端建構設定與服務建構方式相符。
- Container Apps 服務使用 `project` 或 `image`，不能同時使用兩者。
- 僅在透過 `azd-service-name` 標籤的標準 AZD 探索無法使用或刻意略過時，才設定 `resourceName`。
- 相依性使用受支援的 `uses` 關聯，而非隱式假設。
- 環境變數使用替換或 IaC 輸出，而非寫死的環境值。

### 資源與基礎結構

- 共用的 Azure 資源保留在 IaC 中。
- 服務模組與 AZD 服務名稱保持一致，以確保資源探索可預測。
- 自訂資源群組名稱包含環境識別碼，並符合 Azure 命名限制。
- 基礎結構層保留給獨立佈建的單元、不同範圍或掛鉤協調的相依性。
- 當 AZD 無法推斷時，使用 `dependsOn` 明確宣告層相依性。

### 管道與掛鉤

- `pipeline.variables` 包含非機密設定。
- 僅在管道必須儲存已解析的值而非 Key Vault 參照時，才使用 `pipeline.secrets`。
- 根掛鉤處理整個專案的工作；服務掛鉤處理單一服務。
- 掛鉤指令碼使用明確的 Shell 與可攜式路徑。
- 掛鉤不重複應用程式測試或宣告式 IaC 行為。

## 可重複使用的 AZD 專案之 README 需求

記載：

1. 架構與已部署的 Azure 服務。
2. 本機先決條件，包括 AZD 與提供者專屬工具。
3. 驗證需求。
4. 如何建立或選取環境。
5. 所需的非機密變數以及如何設定它們。
6. 如何在不公開其值的情況下提供機密。
7. 如何執行、測試、佈建、部署、監控與疑難排解。
8. 預期的計費資源。
9. 如何安全地清理。
10. 任何 Beta 或預覽相依性，包括適用的 Terraform 或管道功能。

請勿在可重複使用的文件中放置實際的訂用帳戶識別碼、租用戶識別碼、揭露敏感系統的機密名稱或生產端點。
