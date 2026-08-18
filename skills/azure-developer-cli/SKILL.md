---
name: 'azure-developer-cli'
description: '使用目前的 Microsoft 指引設計、建立、審查、移轉或疑難排解 Azure Developer CLI (azd) 專案。適用於 azd、azure.yaml、AZD 範本、infra 下的 Bicep 或 Terraform、AZD 環境與機密、掛鉤、部署工作流程，以及由 azd 管理的 CI/CD。'
license: 'MIT'
---

# Azure Developer CLI 最佳做法 (Azure Developer CLI best practices)

使用此技能產出可維護、安全且具備環境感知能力的 `azd` 專案。當存放庫慣例已經一致時，優先採用存放庫慣例，並進行能改進專案的最小完整變更。

## 從存放庫探索開始

在編輯之前：

1. 尋找 `azure.yaml`、設定的 `infra.path`、來源專案、部署指令碼、`.gitignore` 及管道定義。
2. 在推斷服務或 IaC 提供者之前，先閱讀 `azure.yaml`。
3. 識別任務是建立、移轉、審查、部署還是疑難排解。
4. 僅在需要特定環境操作時才識別作用中環境。
5. 閱讀相關參考資料：
   - 存放庫版面配置或 `azure.yaml`：[references/project-structure.md](references/project-structure.md)
   - Bicep、Terraform、參數、輸出或環境：[references/iac-and-environments.md](references/iac-and-environments.md)
   - 機密、掛鉤、CI/CD、部署或疑難排解：[references/security-cicd-operations.md](references/security-cicd-operations.md)
   - 可能已變更的產品細節：[references/official-docs.md](references/official-docs.md)

當 `azure.yaml` 另有說明時，不要假設預設的 `infra` 路徑、預設的 Bicep 提供者或單一服務。

## 套用安全防護措施

- 切勿提交 `.azure`、環境 `.env` 檔案、認證、包含機密的部署輸出、本機 Terraform 狀態或產生的部署成品。
- 切勿在 `azure.yaml`、IaC 參數檔案、掛鉤、原始檔控制、將被記錄的指令引數或 IaC 輸出中放置文字機密。
- 優先使用受控識別與 RBAC。當機密不可避免時，使用 Key Vault 參照與 `azd env set-secret`。
- 在執行可以建立、修改或刪除 Azure 資源的指令之前，請先確認目標環境、訂用帳戶、租用戶、區域與預期範圍。
- 將使用者明確要求部署、佈建、終止或設定管道視為對該指定操作的核准。否則，在執行 `azd up`、`azd provision`、`azd deploy`、`azd down` 或 `azd pipeline config` 之前請先詢問。
- 除非使用者要求進行架構變更，否則不要將 Bicep 替換為 Terraform、將 Terraform 替換為 Bicep，或替換既有的主控服務。
- 保留在目前 `azd` 專案之外擁有的資源與狀態。

## 使用以下預設值

| 考量層面 | 偏好的預設值 |
| --- | --- |
| 專案資訊清單 | 存放庫根目錄下的單一 `azure.yaml` |
| 應用程式程式碼 | 每個可獨立部署的服務位於 `src/<service-name>` |
| 基礎結構 | 具有精簡進入點與可重複使用模組的 `infra` |
| IaC 提供者 | Bicep，除非存放庫或使用者選擇 Terraform |
| 部署環境 | 針對開發 (dev)、測試 (test)、預行 (staging) 與生產 (production) 使用獨立命名的環境 |
| 本機 AZD 狀態 | `.azure/<environment-name>` 並排除在原始檔控制之外 |
| 共用環境狀態 | 由 Azure Blob Storage 支援的 AZD 遠端環境 |
| 機密 | 優先使用受控識別/RBAC，其次為 Key Vault 參照 |
| 自動化指令碼 | 位於 `scripts/azd` 下的簡短且等冪 (idempotent) 指令碼 |
| CI 驗證 | 支援時使用工作負載識別同盟/OIDC |
| 日常開發 | 簡單工作流程使用 `azd up`；受控工作流程使用獨立階段 |

## 實作工作流程

### 1. 建立應用程式模型

- 為每個可獨立部署的元件定義一個 `services` 項目。
- 保持服務索引鍵穩定，因為它們參與資源探索與部署。
- 將每個服務對應至其對應的 `project`、`language` 與 `host`。
- 將共用基礎結構保留在 IaC 中，而不是捏造一個假的可部署服務。
- 使用受支援的 `azure.yaml` 欄位宣告相依性，而不是依賴檔案順序。

### 2. 建立基礎結構模型

- 將 `main.bicep` 或 `main.tf` 作為協調流程進入點。
- 將可重複使用或可獨立理解的基礎結構拆分為模組。
- 將特定環境的值參數化；不要針對每個環境分岔 IaC 樹狀結構。
- 僅輸出部署或應用程式設定所需的穩定、非機密值。
- 使用包含專案與環境的確定性命名與一致標記。
- 將角色指派新增至身分識別，而不是分發服務金鑰。
- 僅在獨立範圍或生命週期相依性具有正當理由時使用基礎結構層。

### 3. 建立環境模型

- 使用可預測的名稱，例如共用環境使用 `<project>-dev`，個人環境使用 `<alias>-dev`。
- 使用 `azd env set`、`azd env unset` 與 `azd env set-secret`，而非直接編輯 `.env`。
- 在指令碼和自動化中使用 `-e` 或 `--environment`，使目標明確。
- 在其他執行者變更環境後，使用 `azd env refresh` 同步處理部署輸出。
- 當團隊共用環境狀態時，設定 AZD 遠端狀態。

### 4. 僅針對生命週期缺口新增掛鉤

- 優先使用宣告式 IaC 與原生服務設定，而非掛鉤。
- 將根掛鉤用於整個專案的行為，將服務掛鉤用於特定服務的行為。
- 將重要掛鉤邏輯保留在 `scripts/azd` 下已建立版本的指令碼中。
- 明確設定 `shell`。必要時提供 `windows` 與 `posix` 變體。
- 使掛鉤具備等冪性、在 CI 中為非互動式，並在發生錯誤時失敗（除非故意設定為非封鎖性失敗）。
- 使用 `azd hooks run <hook-name>` 獨立測試掛鉤。

### 5. 審慎建構 CI/CD

- 將管道定義與範本一起保留，並審查 `azd pipeline config` 產生的變更。
- 在提供者支援的情況下使用短期同盟認證。
- 在佈建之前執行測試與 IaC 驗證。
- 在自動化中使用明確的環境與 `--no-prompt`。
- 新增受保護的生產環境與核准關卡。
- 對於 Terraform，在管道設定之前設定受保護的遠端狀態，並考慮目前的 AZD 驗證限制。

## 完成前進行驗證

僅執行適用於該存放庫的檢查：

```text
Application: existing formatter, linter, type-check, build, and tests
Bicep:      az bicep build --file infra/main.bicep
Terraform:  terraform fmt -check -recursive
            terraform init -backend=false
            terraform validate
AZD hooks:  azd hooks run <hook-name>
Packaging:  azd package
```

對於 Bicep what-if 或 Terraform plan，選擇正確的部署範圍與環境。這些檢查可以向 Azure 進行驗證或讀取遠端狀態，因此請遵循安全防護措施。

驗證以下事項：

- `azure.yaml` 路徑存在，且服務設定與來源專案相符。
- IaC 進入點和提供者與 `azure.yaml` 一致。
- 所需的部署輸出與服務、掛鉤及管道所取用的變數相符。
- `.gitignore` 排除了 `.azure`、機密、本機狀態與產生的成品。
- 任何機密皆未出現在追蹤的內容或指令輸出中。
- 文件說明了先決條件、環境建立、部署、驗證與清理。

## 回報結果

說明：

- 變更的檔案與行為。
- IaC 提供者與環境假設。
- 執行的檢查。
- 刻意未執行的任何會變更雲端的指令。
- 解決方案所依賴的任何 Beta 或預覽功能。

除非目標環境確實已部署並通過驗證，否則不要聲稱部署成功。
