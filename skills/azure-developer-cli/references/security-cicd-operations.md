# 安全性、掛鉤、CI/CD 與維運 (Security, hooks, CI/CD, and operations)

## 身分識別與機密處理

使用以下優先順序：

1. 具備最小權限 RBAC 的受控識別。
2. 用於 CI/CD 的工作負載識別同盟。
3. 透過 `azd env set-secret` 的 Key Vault 參照。
4. 僅在不存在以身分識別為基礎的選項時使用短期機密資料。

切勿：

- 在 `.azure/<environment>/.env` 中儲存純文字機密。
- 提交環境檔案、認證、憑證或 Terraform 狀態。
- 將機密放入 IaC 輸出中。
- 在掛鉤或管道中隨意輸出 (echo) 環境值。
- 在 Shell 或 CI 系統可能記錄時，直接在指令行上傳遞機密。
- 在資源群組或資源範圍足夠時授予廣泛的訂用帳戶角色。

`azd env set-secret <name>` 在 AZD 環境中儲存 Key Vault 參照。僅在需要時解析它：

- 將其對應至 `@secure()` Bicep 參數。
- 為掛鉤處理程序使用掛鉤 `secrets` 對應。
- 在包含 Key Vault 參照的管道變數或包含已解析值的管道機密之間進行選擇。

當管道身分識別可以讀取 Key Vault 時，偏好參照方法，因為輪替時不需要重新發佈已解析的管道機密。

## 掛鉤 (Hooks)

將掛鉤用於驗證、產生的執行階段設定、資料準備、冒煙檢查 (smoke checks) 或 IaC 及原生 AZD 行為無法表達的生命週期協調。

### 掛鉤規則

- 優先使用外部指令碼而非冗長的行內指令。
- 將指令碼儲存在 `scripts/azd` 下。
- 明確設定 `shell: sh` 或 `shell: pwsh`。
- 當語法不同時提供 `windows` 與 `posix` 實作。
- 使用相對於記載之掛鉤工作目錄的路徑。
- 使指令碼具備等冪性且可安全地重新執行。
- 保持 `continueOnError` 為 false，除非該操作僅供可觀測性使用或確實可選。
- 在 CI 中使用非互動式行為。
- 若可重現的工具設定可以執行一次，則不要在每次執行時都安裝未釘選的相依性。
- 請勿記錄機密值或所有環境變數。
- 在將掛鉤與完整部署結合之前，先使用 `azd hooks run <hook-name>` 進行測試。

範例：

```yaml
hooks:
  preprovision:
    windows:
      shell: pwsh
      run: ./scripts/azd/validate.ps1
      interactive: false
      continueOnError: false
    posix:
      shell: sh
      run: ./scripts/azd/validate.sh
      interactive: false
      continueOnError: false
```

將根掛鉤用於整個專案。將特定服務的掛鉤放在該服務的 `azure.yaml` 項目下。

## 部署工作流程

正常的 AZD 生命週期為：

1. 打包應用程式成品。
2. 佈建或更新基礎結構。
3. 部署應用程式成品。

`azd up` 是方便的組合工作流程，適用於日常開發與簡單部署。

在下列情況下使用獨立指令：

- 基礎結構審查或核准必須在部署前進行。
- 應用程式經常重新部署而無需變更基礎結構。
- 疑難排解需要隔離打包、佈建或部署失敗。
- 複雜的相依性需要自訂順序。

```text
azd package
azd provision -e <environment>
azd deploy -e <environment>
```

僅在實際相依性需要其他順序時自訂 `workflows.up.steps`，例如在需要產生端點的建構之前進行佈建。不要僅為了反映管道的命名慣例而自訂工作流程。

## 全端與多服務相依性

- 在實作前繪製服務相依性圖譜。
- 讓 Bicep 或 Terraform 處理單向基礎結構相依性。
- 使用佈建輸出取得部署期間所需的端點與名稱。
- 當設定必須在不重建的情況下變更時，使用執行階段設定（例如 Azure 應用程式組態或產生的設定檔）。
- 避免前端與後端服務之間的循環編譯時期相依性。
- 僅在輸出與執行階段設定無法解決相依性時才使用掛鉤或自訂工作流程。
- 在開發、測試與類生產環境中獨立測試該策略。

## CI/CD

### 管道設計

健全的管道分離以下階段：

1. 應用程式格式化、Lint、建構與測試。
2. IaC 格式化與靜態驗證。
3. 在正確範圍內進行 What-if 或計劃審查。
4. 使用明確的 AZD 環境進行佈建。
5. 部署。
6. 冒煙或健康驗證。
7. 生產核准與復原/清理程序。

使用：

- 自動化中使用 `--no-prompt`。
- 固定的 `-e` 或 `--environment`。
- 生產環境使用受保護的環境與必要審查者。
- 並行控制以防止對單一環境進行同時寫入。
- 限定於目標環境的最小權限身分識別。
- 具備受管理更新程序的釘選 Action 與工具版本。

### `azd pipeline config`

目前的 Microsoft 文件將 `azd pipeline config` 標記為 Beta。在執行它之前：

- 審查與範本隨附的管道定義。
- 確認存放庫、組織、環境、訂用帳戶與驗證模式。
- 預期存放庫、身分識別、變數、機密、提交、推送與管道副作用。
- 在生產使用前審查產生的工作流程與權限變更。
- 當 `pipeline.variables` 或 `pipeline.secrets` 變更時重新執行它。

對於 GitHub Actions，AZD 預設會針對受支援的情境設定 OIDC/同盟認證。目前文件指出 AZD Terraform 管道流程不支援 OIDC，因此請明確評估驗證權衡，而非靜默切換回長期認證。

對於 Terraform，在管道設定前設定受保護的遠端狀態。

## 驗證與預覽

在執行會變更 Azure 的指令之前執行本機檢查：

### Bicep

```text
az bicep build --file infra/main.bicep
```

在範本宣告的範圍內使用 Azure 部署 What-if。不要假設資源群組範圍。

### Terraform

```text
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

僅在確認後端、工作區/狀態金鑰、變數與 Azure 身分識別後才使用 `terraform plan`。

### AZD 與應用程式

- 執行現有的應用程式檢查。
- 獨立執行相關掛鉤。
- 執行 `azd package` 以驗證服務路徑與打包。
- 確認 IaC 輸出與部署期間取用的變數相符。
- 在佈建、部署或 down 之前檢查環境名稱。

## 疑難排解順序

1. 識別失敗是屬於打包、佈建、部署、掛鉤、驗證還是資源探索。
2. 重新執行最小的失敗階段，而非 `azd up`。
3. 檢查選取的環境以及預期的訂用帳戶、租用戶與區域。
4. 檢查 `azure.yaml` 路徑、提供者、服務名稱、主控類型與資源探索標籤。
5. 當 Azure 狀態在其他地方變更時，使用 `azd env refresh` 重新整理環境輸出。
6. 對於 Terraform，驗證 AZD 與 Azure CLI 驗證以及正確的遠端狀態。
7. 對於掛鉤，直接執行掛鉤並驗證其 Shell、工作目錄與環境相依性。
8. 僅在需要時使用偵錯記錄，並在分享記錄前遮蔽敏感值。

## 清理

- 在執行 `azd down` 之前確認確切的環境。
- 說明清理可能會刪除包含資料的資源。
- 保留外部擁有或共用的資源。
- 對於暫時性環境，自動化清理並包含針對失敗管道執行的備用方案。
- 驗證刪除，而非假設指令成功。
