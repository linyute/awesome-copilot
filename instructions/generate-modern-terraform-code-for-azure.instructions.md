---
description: '為 Azure 產生現代化 Terraform 程式碼的指引'
applyTo: '**/*.tf'
---

## 1. 遵循 Terraform 與 Provider 版本限制
在產生程式碼前，請先檢視專案的 `required_version`、`required_providers` 與 `.terraform.lock.hcl`。請使用相容且明確受限的版本，而非自動將現有專案升級至最新版本。提交根模組的 provider 鎖定檔案；刻意進行的升級與其計畫應分開檢視。可重複使用的模組應宣告其支援的最低 provider 版本，並由根模組控制上限。

## 2. 整潔地組織程式碼
以合乎邏輯的檔案分離方式來結構化 Terraform 設定：

- 使用 `main.tf` 放置資源
- 使用 `variables.tf` 放置輸入變數
- 使用 `outputs.tf` 放置輸出值
- 遵循一致的命名慣例與格式設定（`terraform fmt`）

這能讓程式碼易於瀏覽與維護。

## 3. 封裝於模組中

使用 Terraform 模組將可重複使用的基礎架構元件分組。對於任何會在多個情境中使用的資源集：

- 建立一個擁有專屬變數／輸出的模組
- 參考該模組，而非複製程式碼
- 這有助於促進重複使用與一致性

## 4. 善用變數與輸出

- 使用帶有類型與描述的變數來**參數化**所有可設定的值
- 在適當時機為選用變數**提供預設值**
- **使用輸出**來公開關鍵資源屬性，供其他模組或使用者參考
- 依規定**標記敏感值**以保護機密資訊

## 5. Provider 選擇（AzureRM 與 AzAPI）

- 在大多數情境下**使用 `azurerm` provider** —— 它具備高穩定性，並涵蓋絕大多數的 Azure 服務
- 僅在需要以下情況時才**使用 `azapi` provider**：
  - 最新的 Azure 功能
  - `azurerm` 尚未支援的資源
- 在程式碼註解中**記錄此選擇**
- 如有需要可同時使用兩個 provider，但有疑問時請優先選擇 `azurerm`
- 針對 AzureRM 4.x，請透過 `subscription_id` 或 `ARM_SUBSCRIPTION_ID` 提供預期的訂用帳戶；請勿依賴 Azure CLI 的作用中訂用帳戶。變更主要版本時，請參閱 provider 的升級指南。

## 6. 最小化相依性

- 未經確認，**請勿引入**超出專案範圍的額外 provider 或模組
- 若需要特殊的 provider（例如：`random`、`tls`）或外部模組：
  - 新增註解說明原因
  - 確保使用者核准
- 保持基礎架構堆疊精簡，避免不必要的複雜性

## 7. 確保冪等性

- 撰寫可重複套用並產生相同結果的設定
- **避免非冪等動作**：
  - 每次套用時都會執行的指令碼
  - 若建立兩次可能會產生衝突的資源
- 在測試環境中經授權套用後，驗證重複的計畫；後續的計畫不應顯示非預期的變更。請勿僅為了證明冪等性而套用至正式環境。
- 使用資源生命週期設定或條件運算式，妥善處理組態漂移或外部變更

## 8. 狀態管理

- **使用遠端後端**（例如具備狀態鎖定功能的 Azure Storage）來安全地儲存 Terraform 狀態
- 啟用團隊協作
- **切勿將狀態檔案提交**至原始碼控制
- 這能防止衝突並維持基礎架構狀態的一致性

## 9. 文件與架構圖

- **維護最新的文件**
- 每當程式碼變更時，**更新 README.md** 以反映任何新的變數、輸出或使用說明
- 可考慮使用 `terraform-docs` 等工具進行自動化
- 每次重大更新後，**更新架構圖**以反映基礎架構變更
- 完善的文件與架構圖能確保整個團隊都了解基礎架構

## 10. 驗證與測試變更

- 在套用變更前，**執行 `terraform validate`** 並檢視 `terraform plan` 輸出
- 及早發現錯誤或非預期的修改
- **考慮實作自動化檢查**：
  - CI 管線
  - Pre-commit hooks
  - 強制執行格式設定、linting 與基本驗證

## 參考資料

- [Provider 需求與版本限制](https://developer.hashicorp.com/terraform/language/providers/requirements)
- [AzureRM 4.0 升級指南](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/4.0-upgrade-guide)