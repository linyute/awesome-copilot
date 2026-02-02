---
name: terraform-azurerm-set-diff-analyzer
description: 分析 AzureRM Provider 的 Terraform 計畫 (plan) JSON 輸出，以區分誤報差異 (Set 類型屬性中的僅順序變更) 與實際資源變更。在審核 Azure 資源 (如 Application Gateway、Load Balancer、Firewall、Front Door、NSG 以及其他具有 Set 類型屬性且因內部順序變更而導致偽造差異的資源) 的 terraform 計畫輸出時使用。
license: MIT
---

# Terraform AzureRM Set 差異分析器

一個用於識別由 AzureRM Provider 的 Set 類型屬性引起之 Terraform 計畫中「誤報差異」的技能，並將其與實際變更區分開來。

## 何時使用

- `terraform plan` 顯示許多變更，但您僅新增/移除了一個元素
- Application Gateway、Load Balancer、NSG 等顯示「所有元素皆已變更」
- 您希望在 CI/CD 中自動篩選誤報差異

## 背景

Terraform 的 Set 類型是按位置而非按鍵值 (key) 進行比較的，因此在新增或移除元素時，所有元素都會顯示為「已變更」。這是一個常見的 Terraform 問題，但在大量使用 Set 類型屬性的 AzureRM 資源 (如 Application Gateway、Load Balancer 和 NSG) 中尤為明顯。

這些「誤報差異」實際上並不影響資源，但它們會使審核 terraform 計畫輸出變得困難。

## 先決條件

- Python 3.8+

如果無法使用 Python，請透過您的套件管理員 (例如：`apt install python3`、`brew install python3`) 或從 [python.org](https://www.python.org/downloads/) 安裝。

## 基本用法

```bash
# 1. 產生計畫 JSON 輸出
terraform plan -out=plan.tfplan
terraform show -json plan.tfplan > plan.json

# 2. 分析
python scripts/analyze_plan.py plan.json
```

## 疑難排解

- **`python: command not found`**：請改用 `python3`，或安裝 Python
- **`ModuleNotFoundError`**：此指令稿僅使用標準函式庫；請確保 Python 版本為 3.8+

## 詳細文件

- [scripts/README.md](scripts/README.md) - 所有選項、輸出格式、結束代碼、CI/CD 範例
- [references/azurerm_set_attributes.md](references/azurerm_set_attributes.md) - 支援的資源與屬性
