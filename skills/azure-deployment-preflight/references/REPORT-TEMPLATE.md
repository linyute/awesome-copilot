# 發布前報告範本

在專案根目錄產生 `preflight-report.md` 時，請使用此範本結構。

---

## 範本

```markdown
# Azure 部署發布前報告

**產生時間：** {timestamp}
**狀態：** {overall-status}

---

## 摘要

| 屬性 | 數值 |
|----------|-------|
| **範本檔案** | {bicep-files} |
| **參數檔案** | {param-files-or-none} |
| **專案類型** | {azd-project | standalone-bicep} |
| **部署範圍** | {resourceGroup | subscription | managementGroup | tenant} |
| **目標** | {resource-group-name | subscription-name | mg-id} |
| **驗證等級** | {Provider | ProviderNoRbac} |

### 驗證結果

| 檢查項目 | 狀態 | 詳細資訊 |
|-------|--------|---------|
| Bicep 語法 | {✅ 通過 | ❌ 失敗 | ⚠️ 警告 | ⏭️ 已跳過} | {details} |
| What-If 分析 | {✅ 通過 | ❌ 失敗 | ⏭️ 已跳過} | {details} |
| 權限檢查 | {✅ 通過 | ⚠️ 有限 | ❌ 失敗} | {details} |

---

## 執行的工具

### 執行的指令

| 步驟 | 指令 | 結束代碼 | 持續時間 |
|------|---------|-----------|----------|
| 1 | `{command}` | {0 | 非零} | {duration} |
| 2 | `{command}` | {0 | 非零} | {duration} |

### 工具版本

| 工具 | 版本 |
|------|---------||
| Azure CLI | {version} |
| Bicep CLI | {version} |
| Azure Developer CLI | {version-or-n/a} |

---

## 問題

{if-no-issues}
✅ **未發現問題。** 部署已準備就緒，可以繼續執行。
{end-if}

{if-issues-exist}
### 錯誤

{for-each-error}
#### ❌ {error-title}

- **嚴重性：** 錯誤
- **來源：** {bicep-build | what-if | permissions}
- **位置：** {file-path}:{line}:{column} (如果適用)
- **訊息：** {error-message}
- **補救措施：** {suggested-fix}
- **文件：** {link-if-available}

{end-for-each}

### 警告

{for-each-warning}
#### ⚠️ {warning-title}

- **嚴重性：** 警告
- **來源：** {source}
- **訊息：** {warning-message}
- **建議：** {suggested-action}

{end-for-each}
{end-if}

---

## What-If 結果

{if-what-if-succeeded}

### 變更摘要

| 變更類型 | 計數 |
|-------------|-------|
| 🆕 建立 | {count} |
| 📝 修改 | {count} |
| 🗑️ 刪除 | {count} |
| ✓ 無變更 | {count} |
| ⚠️ 忽略 | {count} |

### 要建立的資源

{if-resources-to-create}
| 資源類型 | 資源名稱 |
|---------------|---------------|
| {type} | {name} |
{end-if}

{if-no-resources-to-create}
*沒有要建立的資源。*
{end-if}

### 要修改的資源

{if-resources-to-modify}
#### {resource-type}/{resource-name}

| 屬性 | 目前數值 | 新數值 |
|----------|---------------|-----------|
| {property-path} | {current} | {new} |

{end-if}

{if-no-resources-to-modify}
*沒有要修改的資源。*
{end-if}

### 要刪除的資源

{if-resources-to-delete}
| 資源類型 | 資源名稱 |
|---------------|---------------|
| {type} | {name} |

> ⚠️ **警告：** 列表中的資源將會被永久移除。
{end-if}

{if-no-resources-to-delete}
*沒有要刪除的資源。*
{end-if}

{end-if-what-if-succeeded}

{if-what-if-failed}
### What-If 分析失敗

what-if 操作無法完成。詳見「問題」章節以取得詳細資訊。
{end-if}

---

## 建議

{generate-based-on-findings}

1. {recommendation-1}
2. {recommendation-2}
3. {recommendation-3}

---

## 後續步驟

{if-all-passed}
發布前驗證已通過。您可以繼續執行部署：

**對於 azd 專案：**
```bash
azd provision
# 或
azd up
```

**對於獨立 Bicep：**
```bash
az deployment group create \
  --resource-group {rg-name} \
  --template-file {bicep-file} \
  --parameters {param-file}
```
{end-if}

{if-issues-exist}
請在部署前解決上述問題。修正後：

1. 重新執行發布前驗證以確認修正
2. 當所有檢查都通過後，繼續執行部署
{end-if}

---

*報告由 Azure 部署發布前驗證技能產生*
```

---

## 狀態數值

### 整體狀態

| 狀態 | 意義 | 視覺標示 |
|--------|---------|--------|
| **通過** | 所有檢查均成功，可以安全部署 | ✅ |
| **通過但有警告** | 檢查成功，但請檢閱警告 | ⚠️ |
| **失敗** | 一或多個檢查失敗 | ❌ |

### 個別檢查狀態

| 狀態 | 意義 |
|--------|---------|
| ✅ 通過 | 檢查成功完成 |
| ❌ 失敗 | 檢查發現錯誤 |
| ⚠️ 警告 | 檢查通過但有警告 |
| ⏭️ 已跳過 | 檢查已跳過（工具不可用等） |

---

## 範例報告

```markdown
# Azure 部署發布前報告

**產生時間：** 2026-01-16T14:32:00Z
**狀態：** ⚠️ 通過但有警告

---

## 摘要

| 屬性 | 數值 |
|----------|-------|
| **範本檔案** | `infra/main.bicep` |
| **參數檔案** | `infra/main.bicepparam` |
| **專案類型** | azd 專案 |
| **部署範圍** | subscription |
| **目標** | my-subscription |
| **驗證等級** | Provider |

### 驗證結果

| 檢查項目 | 狀態 | 詳細資訊 |
|-------|--------|---------|
| Bicep 語法 | ✅ 通過 | 未發現錯誤 |
| What-If 分析 | ⚠️ 警告 | 因巢狀範本限制，1 個資源被忽略 |
| 權限檢查 | ✅ 通過 | 已驗證完整的部署權限 |

---

## 執行的工具

### 執行的指令

| 步驟 | 指令 | 結束代碼 | 持續時間 |
|------|---------|-----------|----------|
| 1 | `bicep build infra/main.bicep --stdout` | 0 | 1.2s |
| 2 | `azd provision --preview --environment dev` | 0 | 8.4s |

### 工具版本

| 工具 | 版本 |
|------|---------||
| Azure CLI | 2.76.0 |
| Bicep CLI | 0.25.3 |
| Azure Developer CLI | 1.9.0 |

---

## 問題

### 警告

#### ⚠️ 達到巢狀範本限制

- **嚴重性：** 警告
- **來源：** what-if
- **訊息：** 由於達到巢狀範本擴充限制，1 個資源被忽略
- **建議：** 在部署後手動檢閱被忽略的資源

---

## What-If 結果

### 變更摘要

| 變更類型 | 計數 |
|-------------|-------|
| 🆕 建立 | 3 |
| 📝 修改 | 1 |
| 🗑️ 刪除 | 0 |
| ✓ 無變更 | 2 |
| ⚠️ 忽略 | 1 |

### 要建立的資源

| 資源類型 | 資源名稱 |
|---------------|---------------|
| Microsoft.Resources/resourceGroups | rg-myapp-dev |
| Microsoft.Storage/storageAccounts | stmyappdev |
| Microsoft.Web/sites | app-myapp-dev |

### 要修改的資源

#### Microsoft.KeyVault/vaults/kv-myapp-dev

| 屬性 | 目前數值 | 新數值 |
|----------|---------------|-----------|
| properties.sku.name | standard | premium |
| tags.environment | staging | dev |

### 要刪除的資源

*沒有要刪除的資源。*

---

## 建議

1. 檢閱儲存體帳戶名稱 `stmyappdev` 以確保符合命名需求
2. 確認 Key Vault SKU 從 standard 升級為 premium 是刻意的行為
3. 部署後應驗證被忽略的巢狀範本資源

---

## 後續步驟

發布前驗證已通過，但有警告。請檢閱上述警告，然後繼續：

```bash
azd provision --environment dev
```

---

*報告由 Azure 部署發布前驗證技能產生*
```

---

## 格式指引

1. **使用一致的表情符號** 以利視覺掃描
2. **包含行號** 當引用 Bicep 錯誤時
3. **針對每個問題提供可執行的補救措施**
4. **提供文件連結** (如果可用)
5. **按嚴重性排序問題** (錯誤在前，接著是警告)
6. **在「後續步驟」中包含指令範例**

```