# 錯誤處理指南

此參考文件記錄了發布前驗證期間常見的錯誤以及處理方法。

## 核心原則

**失敗時繼續執行。** 在最終報告中擷取所有問題，而不是在遇到第一個錯誤時停止。這能讓使用者完整了解需要修正的內容。

---

## 驗證錯誤

### 未登入 (Azure CLI)

**偵測：**
```
ERROR: Please run 'az login' to setup account.
ERROR: AADSTS700082: The refresh token has expired
```

**結束代碼：** 非零

**處理：**
1. 在報告中註記錯誤
2. 包含補救步驟
3. 跳過剩餘的 Azure CLI 指令
4. 如果可能，繼續執行其他驗證步驟

**報告項目：**
```markdown
#### ❌ 需要 Azure CLI 驗證

- **嚴重性：** 錯誤
- **來源：** az cli
- **訊息：** 未登入 Azure CLI
- **補救措施：** 執行 `az login` 進行驗證，然後重新執行發布前驗證
- **文件：** https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli
```

### 未登入 (azd)

**偵測：**
```
ERROR: not logged in, run `azd auth login` to login
```

**處理：**
1. 在報告中註記錯誤
2. 跳過 azd 指令
3. 建議執行 `azd auth login`

**報告項目：**
```markdown
#### ❌ 需要 Azure Developer CLI 驗證

- **嚴重性：** 錯誤
- **來源：** azd
- **訊息：** 未登入 Azure Developer CLI
- **補救措施：** 執行 `azd auth login` 進行驗證，然後重新執行發布前驗證
```

### 權杖已過期

**偵測：**
```
AADSTS700024: Client assertion is not within its valid time range
AADSTS50173: The provided grant has expired
```

**處理：**
1. 註記錯誤
2. 建議重新驗證
3. 跳過 Azure 操作

---

## 權權錯誤

### RBAC 權限不足

**偵測：**
```
AuthorizationFailed: The client '...' with object id '...' does not have authorization 
to perform action '...' over scope '...'
```

**處理：**
1. **第一次嘗試：** 使用 `--validation-level ProviderNoRbac` 重試
2. 在報告中註記權限限制
3. 如果 ProviderNoRbac 也失敗，回報具體缺少的權限

**報告項目：**
```markdown
#### ⚠️ 有限的權限驗證

- **嚴重性：** 警告
- **來源：** what-if
- **訊息：** 完整 RBAC 驗證失敗；使用唯讀驗證
- **詳細資訊：** 缺少權限：`Microsoft.Resources/deployments/write` 於範圍 `/subscriptions/xxx`
- **建議：** 在目標資源群組上請求參與者 (Contributor) 角色，或向管理員驗證部署權限
```

### 找不到資源群組

**偵測：**
```
ResourceGroupNotFound: Resource group 'xxx' could not be found.
```

**處理：**
1. 在報告中註記
2. 建議建立資源群組
3. 跳過此範圍的 what-if

**報告項目：**
```markdown
#### ❌ 資源群組不存在

- **嚴重性：** 錯誤
- **來源：** what-if
- **訊息：** 資源群組 'my-rg' 不存在
- **補救措施：** 在部署前建立資源群組：
  ```bash
  az group create --name my-rg --location eastus
  ```
```

### 訂閱存取遭拒

**偵測：**
```
SubscriptionNotFound: The subscription 'xxx' could not be found.
InvalidSubscriptionId: Subscription '...' is not valid
```

**處理：**
1. 在報告中註記
2. 建議檢查訂閱 ID
3. 列出可用的訂閱

---

## Bicep 語法錯誤

### 編譯錯誤

**偵測：**
```
/path/main.bicep(22,51) : Error BCP064: Found unexpected tokens
/path/main.bicep(10,5) : Error BCP018: Expected the "=" character at this location
```

**處理：**
1. 解析錯誤輸出以獲取行號/欄號
2. 在報告中包含所有錯誤（不要在第一個錯誤處停止）
3. 繼續執行 what-if（可能提供額外背景資訊）

**報告項目：**
```markdown
#### ❌ Bicep 語法錯誤

- **嚴重性：** 錯誤
- **來源：** bicep build
- **位置：** `main.bicep:22:51`
- **代碼：** BCP064
- **訊息：** 在插值運算式中發現未預期的語彙基元 (tokens)
- **補救措施：** 檢查第 22 行的字串插值語法
- **文件：** https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/diagnostics/bcp064
```

### 找不到模組

**偵測：**
```
Error BCP091: An error occurred reading file. Could not find file '...'
Error BCP190: The module is not valid
```

**處理：**
1. 註記缺少的模組
2. 檢查是否需要執行 `bicep restore`
3. 驗證模組路徑

### 參數檔案問題

**偵測：**
```
Error BCP032: The value must be a compile-time constant
Error BCP035: The specified object is missing required properties
```

**處理：**
1. 註記參數問題
2. 指出哪些參數有問題
3. 建議修正方法

---

## 工具未安裝

### 找不到 Azure CLI

**偵測：**
```
'az' is not recognized as an internal or external command
az: command not found
```

**處理：**
1. 在報告中註記
2. 提供安裝指示。
  - 如果可用，使用 Azure MCP `extension_cli_install` 工具來獲取安裝指示。
  - 否則，在 https://learn.microsoft.com/en-us/cli/azure/install-azure-cli 尋找指示。
3. 跳過 az 指令

**報告項目：**
```markdown
#### ⏭️ 未安裝 Azure CLI

- **嚴重性：** 警告
- **來源：** 環境
- **訊息：** 未安裝 Azure CLI (az) 或未包含在 PATH 中
- **補救措施：** 安裝 Azure CLI <在此處新增安裝指示>
- **影響：** 跳過了使用 az 指令的 what-if 驗證
```

### 找不到 Bicep CLI

**偵測：**
```
'bicep' is not recognized as an internal or external command
bicep: command not found
```

**處理：**
1. 在報告中註記
2. Azure CLI 可能內建 Bicep —— 嘗試執行 `az bicep build`
3. 提供安裝連結

**報告項目：**
```markdown
#### ⏭️ 未安裝 Bicep CLI

- **嚴重性：** 警告
- **來源：** 環境
- **訊息：** 未安裝 Bicep CLI
- **補救措施：** 安裝 Bicep CLI：https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install
- **影響：** 跳過了語法驗證；Azure 將在 what-if 期間進行驗證
```

### 找不到 Azure Developer CLI

**偵測：**
```
'azd' is not recognized as an internal or external command
azd: command not found
```

**處理：**
1. 如果存在 `azure.yaml`，則此工具是必要的
2. 如果可能，遞補至 Azure CLI 指令
3. 在報告中註記

---

## What-If 特定錯誤

### 巢狀範本限制

**偵測：**
```
The deployment exceeded the nested template limit of 500
```

**處理：**
1. 註記為警告（非錯誤）
2. 說明受影響的資源顯示為「忽略 (Ignore)」
3. 建議進行手動檢閱

### 不支援範本連結

**偵測：**
```
templateLink references in nested deployments won't be visible in what-if
```

**處理：**
1. 註記為警告
2. 說明限制
3. 資源將在實際部署期間進行驗證

### 未評估的運算式

**偵測：** 屬性顯示為函式名稱，如 `[utcNow()]` 而非數值

**處理：**
1. 註記為資訊性內容
2. 說明這些是在部署時評估的
3. 非錯誤

---

## 網路錯誤

### 逾時

**偵測：**
```
Connection timed out
Request timed out
```

**處理：**
1. 建議重試
2. 檢查網路連線性
3. 可能表示 Azure 服務有問題

### SSL/TLS 錯誤

**偵測：**
```
SSL: CERTIFICATE_VERIFY_FAILED
unable to get local issuer certificate
```

**處理：**
1. 在報告中註記
2. 可能表示 Proxy 或公司防火牆問題
3. 建議檢查 SSL 設定

---

## 遞補策略

當主要驗證失敗時，依序嘗試遞補：

```
Provider (完整 RBAC 驗證)
    ↓ 權限錯誤失敗
ProviderNoRbac (不檢查寫入權限的驗證)
    ↓ 失敗
Template (僅靜態語法)
    ↓ 失敗
回報所有失敗並跳過 what-if 分析
```

**務必繼續產生報告**，即使所有驗證步驟都失敗。

---

## 錯誤報告彙總

當發生多個錯誤時，邏輯性地彙總它們：

1. **按來源分組** (bicep, what-if, 權限)
2. **按嚴重性排序** (錯誤排在警告之前)
3. **去重複** 相似的錯誤
4. **在頂端提供摘要計數**

範例：
```markdown
## 問題

發現 **3 個錯誤** 與 **2 個警告**

### 錯誤 (3)

1. [Bicep 語法錯誤 - main.bicep:22:51](#error-1)
2. [Bicep 語法錯誤 - main.bicep:45:10](#error-2)
3. [找不到資源群組](#error-3)

### 警告 (2)

1. [有限的權限驗證](#warning-1)
2. [達到巢狀範本限制](#warning-2)
```

---

## 結束代碼參考

| 工具 | 結束代碼 | 意義 |
|------|-----------|---------|
| az | 0 | 成功 |
| az | 1 | 一般錯誤 |
| az | 2 | 找不到指令 |
| az | 3 | 缺少必要的引數 |
| azd | 0 | 成功 |
| azd | 1 | 錯誤 |
| bicep | 0 | 建構成功 |
| bicep | 1 | 建構失敗（有錯誤） |
| bicep | 2 | 建構成功但有警告 |
