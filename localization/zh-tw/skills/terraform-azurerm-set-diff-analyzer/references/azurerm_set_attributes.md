# AzureRM Set 類型屬性參考

本文件說明 `azurerm_set_attributes.json` 的概覽與維護。

> **最後更新日期**：2026 年 1 月 28 日

## 概覽

`azurerm_set_attributes.json` 是 AzureRM Provider 中被視為 Set 類型的屬性定義檔案。
`analyze_plan.py` 指令稿會讀取此 JSON，以識別 Terraform 計畫中的「誤報差異」。

### 什麼是 Set 類型屬性？

Terraform 的 Set 類型是一種**不保證順序**的集合。
因此，在新增或移除元素時，未變更的元素可能會顯示為「已變更」。
這被稱為「誤報差異」。

## JSON 檔案結構

### 基本格式

```json
{
  "resources": {
    "azurerm_resource_type": {
      "attribute_name": "key_attribute"
    }
  }
}
```

- **key_attribute**：唯一識別 Set 元素的屬性 (例如：`name`、`id`)
- **null**：當沒有鍵值 (key) 屬性時 (比較整個元素)

### 嵌套格式

當一個 Set 屬性包含另一個 Set 屬性時：

```json
{
  "rewrite_rule_set": {
    "_key": "name",
    "rewrite_rule": {
      "_key": "name",
      "condition": "variable",
      "request_header_configuration": "header_name"
    }
  }
}
```

- **`_key`**：該層級 Set 元素的鍵值屬性
- **其他鍵 (Other keys)**：嵌套 Set 屬性的定義

### 範例：azurerm_application_gateway

```json
"azurerm_application_gateway": {
  "backend_address_pool": "name",           // 簡單 Set (鍵值為 name)
  "rewrite_rule_set": {                     // 嵌套 Set
    "_key": "name",
    "rewrite_rule": {
      "_key": "name",
      "condition": "variable"
    }
  }
}
```

## 維護

### 新增屬性

1. **查閱官方文件**
   - 在 [Terraform Registry](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs) 中搜尋該資源
   - 確認該屬性被列為 「Set of ...」
   - 某些資源 (如 `azurerm_application_gateway`) 會明確標註 Set 屬性

2. **檢查原始碼 (更可靠)**
   - 在 [AzureRM Provider GitHub](https://github.com/hashicorp/terraform-provider-azurerm) 中搜尋該資源
   - 確認架構定義中的 `Type: pluginsdk.TypeSet`
   - 識別 Set 的 `Schema` 中可作為 `_key` 的屬性

3. **新增至 JSON**
   ```json
   "azurerm_new_resource": {
     "set_attribute": "key_attribute"
   }
   ```

4. **測試**
   ```bash
   # 使用實際計畫進行驗證
   python3 scripts/analyze_plan.py your_plan.json
   ```

### 識別鍵值 (Key) 屬性

| 常見鍵值屬性 | 用法 |
|---------------------|-------|
| `name` | 具名區塊 (最常見) |
| `id` | 資源識別碼 (ID) 參考 |
| `location` | 地理位置 |
| `address` | 網路位址 |
| `host_name` | 主機名稱 |
| `null` | 當不存在鍵值時 (比較整個元素) |

## 相關工具

### analyze_plan.py

分析 Terraform 計畫 JSON 以識別誤報差異。

```bash
# 基本用法
terraform show -json plan.tfplan | python3 scripts/analyze_plan.py

# 從檔案讀取
python3 scripts/analyze_plan.py plan.json

# 使用自定義屬性檔案
python3 scripts/analyze_plan.py plan.json --attributes /path/to/custom.json
```

## 支援的資源

目前支援的資源請直接參考 `azurerm_set_attributes.json`：

```bash
# 列出資源
jq '.resources | keys' azurerm_set_attributes.json
```

關鍵資源：
- `azurerm_application_gateway` - 後端集區、接聽程式、規則等。
- `azurerm_firewall_policy_rule_collection_group` - 規則集合
- `azurerm_frontdoor` - 後端集區、路由
- `azurerm_network_security_group` - 安全性規則
- `azurerm_virtual_network_gateway` - IP 配置、VPN 用戶端配置

## 注意事項

- 屬性行為可能因 Provider/API 版本而異
- 隨著名稱可用，需要新增新的資源和屬性
- 定義深度嵌套結構的所有層級可提高準確性
