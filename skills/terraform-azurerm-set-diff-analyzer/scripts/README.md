# Terraform AzureRM Set 差異分析器指令稿

一個 Python 指令稿，用於分析 Terraform 計畫 (plan) JSON 並識別 AzureRM Set 類型屬性中的「誤報差異」。

## 概覽

AzureRM Provider 的 Set 類型屬性 (如 `backend_address_pool`、`security_rule` 等) 不保證順序，因此在新增或移除元素時，所有元素都會顯示為「已變更」。此指令稿可將此類「誤報差異」與實際變更區分開來。

### 使用情境

- 作為 **Agent 技能** (建議)
- 作為手動執行的 **CLI 工具**
- 用於 **CI/CD 管道**中的自動化分析

## 先決條件

- Python 3.8 或更高版本
- 無需額外套件 (僅使用標準函式庫)

## 用法

### 基本用法

```bash
# 從檔案讀取
python analyze_plan.py plan.json

# 從標準輸入 (stdin) 讀取
terraform show -json plan.tfplan | python analyze_plan.py
```

### 選項

| 選項 | 縮寫 | 描述 | 預設值 |
|--------|-------|-------------|---------|
| `--format` | `-f` | 輸出格式 (markdown/json/summary) | markdown |
| `--exit-code` | `-e` | 根據變更回傳結束代碼 | false |
| `--quiet` | `-q` | 隱藏警告 | false |
| `--verbose` | `-v` | 顯示詳細警告 | false |
| `--ignore-case` | - | 比較值時不區分大小寫 | false |
| `--attributes` | - | 自定義屬性定義檔案路徑 | (內建) |
| `--include` | - | 篩選要分析的資源 (可指定多個) | (全部) |
| `--exclude` | - | 篩選要排除的資源 (可指定多個) | (無) |

### 結束代碼 (搭配 `--exit-code`)

| 代碼 | 意義 |
|------|---------|
| 0 | 無變更，或僅有順序變更 |
| 1 | 實際的 Set 屬性變更 |
| 2 | 資源替換 (刪除 + 建立) |
| 3 | 錯誤 |

## 輸出格式

### Markdown (預設)

適用於 PR 留言與報告的人類可讀格式。

```bash
python analyze_plan.py plan.json --format markdown
```

### JSON

適用於程式化處理的結構化資料。

```bash
python analyze_plan.py plan.json --format json
```

輸出範例：
```json
{
  "summary": {
    "order_only_count": 3,
    "actual_set_changes_count": 1,
    "replace_count": 0
  },
  "has_real_changes": true,
  "resources": [...],
  "warnings": []
}
```

### 摘要 (Summary)

適用於 CI/CD 日誌的單行摘要。

```bash
python analyze_plan.py plan.json --format summary
```

輸出範例：
```
🟢 3 order-only | 🟡 1 set changes
```

## CI/CD 管道用法

### GitHub Actions

```yaml
name: Terraform Plan Analysis

on:
  pull_request:
    paths:
      - '**.tf'

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        
      - name: Terraform Init & Plan
        run: |
          terraform init
          terraform plan -out=plan.tfplan
          terraform show -json plan.tfplan > plan.json
          
      - name: Analyze Set Diff
        run: |
          python path/to/analyze_plan.py plan.json --format markdown > analysis.md
          
      - name: Comment PR
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: analysis.md
```

### GitHub Actions (使用結束代碼進行門控)

```yaml
      - name: Analyze and Gate
        run: |
          python path/to/analyze_plan.py plan.json --exit-code --format summary
        # 在結束代碼為 2 (資源替換) 時失敗
        continue-on-error: false
```

### Azure Pipelines

```yaml
- task: TerraformCLI@0
  inputs:
    command: 'plan'
    commandOptions: '-out=plan.tfplan'

- script: |
    terraform show -json plan.tfplan > plan.json
    python scripts/analyze_plan.py plan.json --format markdown > $(Build.ArtifactStagingDirectory)/analysis.md
  displayName: 'Analyze Plan'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '$(Build.ArtifactStagingDirectory)/analysis.md'
    artifactName: 'plan-analysis'
```

### 篩選範例

僅分析特定資源：
```bash
python analyze_plan.py plan.json --include application_gateway --include load_balancer
```

排除特定資源：
```bash
python analyze_plan.py plan.json --exclude virtual_network
```

## 解讀結果

| 類別 | 意義 | 建議行動 |
|----------|---------|-------------------|
| 🟢 僅順序 (Order-only) | 誤報差異，無實際變更 | 可安全忽略 |
| 🟡 實際變更 (Actual change) | Set 元素已新增/移除/修改 | 審核內容，通常為就地更新 (in-place update) |
| 🔴 資源替換 (Resource replacement) | 刪除 + 建立 | 檢查停機時間影響 |

## 自定義屬性定義

預設使用 `references/azurerm_set_attributes.json`，但您可以指定自定義定義檔案：

```bash
python analyze_plan.py plan.json --attributes /path/to/custom_attributes.json
```

定義檔案格式請參閱 `references/azurerm_set_attributes.md`。

## 限制

- 僅支援 AzureRM 資源 (`azurerm_*`)
- 可能不支援某些資源/屬性
- 對於包含 `after_unknown` (套用後才確定的值) 的屬性，比較結果可能不完整
- 對於敏感屬性 (已遮蔽)，比較結果可能不完整

## 相關文件

- [SKILL.md](../SKILL.md) - 作為 Agent 技能的用法
- [azurerm_set_attributes.md](../references/azurerm_set_attributes.md) - 屬性定義參考
