---
description: 'Terraform 慣例與指引'
applyTo: '**/*.tf'
---

# Terraform 慣例

## 一般指引

- 使用 Terraform 來佈建與管理基礎設施。
- Terraform 設定檔請使用版本控制。

## 安全性

- 一律使用最新穩定版的 Terraform 及其提供者。
  - 定期更新 Terraform 設定以納入安全修補與改進。
- 機密資訊請以安全方式儲存，例如 AWS Secrets Manager 或 SSM Parameter Store。
  - 定期輪替憑證與機密。
  - 能自動輪替機密時請自動化。
- 使用 AWS 環境變數參照 AWS Secrets Manager 或 SSM Parameter Store 儲存的值。
  - 可避免機密值出現在 Terraform 狀態檔。
- 切勿將 AWS 憑證、API 金鑰、密碼、憑證或 Terraform 狀態檔提交至版本控制。
  - 使用 `.gitignore` 排除含機密資訊的檔案。
- 所有機密變數皆標註 `sensitive = true`。
  - 可防止敏感值顯示於 Terraform plan 或 apply 輸出。
- 使用 IAM 角色與政策控管資源存取。
  - 權限分配遵循最小權限原則。
- 使用安全群組與網路 ACL 控管資源網路存取。
- 儘可能將資源部署於私有子網。
  - 僅需直接連網的資源（如負載平衡器或 NAT gateway）才用公有子網。
- 敏感資料靜態與傳輸時皆加密。
  - EBS、S3、RDS 皆啟用加密。
  - 服務間通訊皆用 TLS。
- 定期審查與稽核 Terraform 設定檔安全性。
  - 使用 `trivy`、`tfsec` 或 `checkov` 掃描安全問題。

## 模組化

- 各主要基礎設施元件請分開專案：
  - 降低複雜度
  - 易於管理與維護
  - 加速 `plan` 與 `apply` 操作
  - 可獨立開發與部署
  - 降低誤改無關資源風險
- 使用模組避免設定重複。
  - 模組用於封裝相關資源與設定。
  - 模組可簡化複雜設定並提升可讀性。
  - 避免模組間循環相依。
  - 僅在有價值時使用模組，避免不必要抽象層。
    - 單一資源勿用模組，僅群組相關資源時使用。
    - 避免過度巢狀，保持模組層級淺。
- 使用 `output` 區塊公開重要基礎設施資訊。
  - outputs 提供其他模組或使用者所需資訊。
  - outputs 含敏感資料時請標註 `sensitive = true`。

## 可維護性

- 優先可讀性、清晰度與可維護性。
- 複雜設定請加註解說明設計決策。
- 撰寫簡潔、有效率且慣用的設定，易於理解。
- 避免硬編碼，請用變數設定。
  - 變數適當時請設預設值。
- 使用 data source 取得現有資源資訊，避免手動設定。
  - 可降低錯誤風險，確保設定即時且可因應不同環境。
  - 同一設定檔內建立的資源勿用 data source，請用 outputs。
  - 移除不必要的 data source，避免拖慢 `plan` 與 `apply`。
- 多次使用的值請用 `locals` 以確保一致性。

## 風格與格式

- 資源命名與組織遵循 Terraform 最佳實務。
  - 資源、變數、outputs 皆用具描述性名稱。
  - 命名慣例全專案一致。
- 格式遵循 **Terraform Style Guide**。
  - 縮排一致（每層 2 空格）。
- 相關資源請同檔案分組。
  - 資源群組命名一致（如 `providers.tf`、`variables.tf`、`network.tf`、`ecs.tf`、`mariadb.tf`）。
- `depends_on` 區塊請放在資源定義最前面，明確依賴關係。
  - 僅必要時用 `depends_on`，避免循環相依。
- `for_each` 與 `count` 區塊請放在資源定義最前面，明確資源實例化邏輯。
  - 集合用 `for_each`，數值迴圈用 `count`。
  - 若有 `depends_on`，請放在其後。
- `lifecycle` 區塊請放在資源定義最後。
- providers、變數、data source、資源、outputs 於各檔案內皆依字母排序，方便瀏覽。
- 區塊內屬性分組，相關屬性同組。
  - 必填屬性在前，選填在後，並加註解。
  - 屬性組間以空行分隔提升可讀性。
  - 屬性於各組內皆依字母排序。
- 邏輯區塊間以空行分隔。
- 用 `terraform fmt` 自動格式化設定。
- 用 `terraform validate` 檢查語法錯誤與設定有效性。
- 用 `tflint` 檢查風格違規並確保最佳實務。
  - 定期執行 `tflint` 及早發現風格問題。

## 文件

- 變數與 outputs 皆加上 `description` 與 `type` 屬性。
  - 說明請清楚簡潔，能解釋用途。
  - 變數型別請適當（如 `string`、`number`、`bool`、`list`、`map`）。
- Terraform 設定檔請以註解補充說明。
  - 資源與變數皆加註解說明用途。
  - 複雜設定或決策皆加註解。
  - 避免冗餘註解，註解需具備價值與清晰度。
- 每個專案皆加上 `README.md`，說明專案概述與結構。
  - 包含設定與使用說明。
- 用 `terraform-docs` 自動產生設定文件。

## 測試

- 撰寫測試以驗證 Terraform 設定功能。
  - 測試檔請用 `.tftest.hcl` 副檔名。
  - 測試涵蓋正向與負向情境。
  - 測試需具備冪等性，可多次執行且無副作用。
