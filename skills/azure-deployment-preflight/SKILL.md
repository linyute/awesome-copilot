---
name: azure-deployment-preflight
description: '對 Azure 的 Bicep 部署執行全方位的發布前驗證（preflight validation），包含範本語法驗證、模擬分析（what-if analysis）及權限檢查。在任何部署到 Azure 的動作之前使用此技能，以預覽變更、識別潛在問題並確保部署成功。當使用者提到部署到 Azure、驗證 Bicep 檔案、檢查部署權限、預覽基礎架構變更、執行 what-if 或為 azd provision 做準備時啟動。'
---

# Azure 部署發布前驗證

此技能在執行前驗證 Bicep 部署，支援 Azure CLI (`az`) 與 Azure Developer CLI (`azd`) 工作流。

## 何時使用此技能

- 在將基礎架構部署到 Azure 之前
- 在準備或檢閱 Bicep 檔案時
- 預覽部署將會產生的變更
- 驗證權限是否足以執行部署
- 在執行 `azd up`、`azd provision` 或 `az deployment` 指令之前

## 驗證流程

依序執行以下步驟。即使前一個步驟失敗，也請繼續執行下一步——在最終報告中擷取所有問題。

### 步驟 1：偵測專案類型

透過檢查專案指標來決定部署工作流：

1. **檢查 azd 專案**：在專案根目錄中尋找 `azure.yaml`
   - 如果找到 → 使用 **azd 工作流**
   - 如果未找到 → 使用 **az CLI 工作流**

2. **定位 Bicep 檔案**：尋找所有要驗證的 `.bicep` 檔案
   - 對於 azd 專案：先檢查 `infra/` 目錄，然後是專案根目錄
   - 對於獨立專案：使用使用者指定的檔案，或搜尋常用位置（`infra/`、`deploy/`、專案根目錄）

3. **自動偵測參數檔案**：針對每個 Bicep 檔案，尋找相符的參數檔案：
   - `<filename>.bicepparam` (Bicep 參數 - 偏好使用)
   - `<filename>.parameters.json` (JSON 參數)
   - 同一目錄下的 `parameters.json` 或 `parameters/<env>.json`

### 步驟 2：驗證 Bicep 語法

在嘗試部署驗證之前，執行 Bicep CLI 以檢查範本語法：

```bash
bicep build <bicep-file> --stdout
```

**擷取內容：**
- 包含行號/欄號的語法錯誤
- 警告訊息
- 建構成功/失敗狀態

**如果未安裝 Bicep CLI：**
- 在報告中註記此問題
- 繼續執行步驟 3（Azure 會在 what-if 期間驗證語法）

### 步驟 3：執行發布前驗證

根據步驟 1 偵測到的專案類型選擇適當的驗證。

#### 對於 azd 專案（存在 azure.yaml）

使用 `azd provision --preview` 來驗證部署：

```bash
azd provision --preview
```

如果指定了環境或存在多個環境：
```bash
azd provision --preview --environment <env-name>
```

#### 對於獨立 Bicep（無 azure.yaml）

從 Bicep 檔案的 `targetScope` 宣告中決定部署範圍：

| 目標範圍 | 指令 |
|--------------|---------|
| `resourceGroup` (預設) | `az deployment group what-if` |
| `subscription` | `az deployment sub what-if` |
| `managementGroup` | `az deployment mg what-if` |
| `tenant` | `az deployment tenant what-if` |

**先以 Provider 驗證等級執行：**

```bash
# 資源群組範圍（最常見）
az deployment group what-if \
  --resource-group <rg-name> \
  --template-file <bicep-file> \
  --parameters <param-file> \
  --validation-level Provider

# 訂閱範圍
az deployment sub what-if \
  --location <location> \
  --template-file <bicep-file> \
  --parameters <param-file> \
  --validation-level Provider

# 管理群組範圍
az deployment mg what-if \
  --location <location> \
  --management-group-id <mg-id> \
  --template-file <bicep-file> \
  --parameters <param-file> \
  --validation-level Provider

# 租戶範圍
az deployment tenant what-if \
  --location <location> \
  --template-file <bicep-file> \
  --parameters <param-file> \
  --validation-level Provider
```

**遞補策略：**

如果 `--validation-level Provider` 因為權限錯誤 (RBAC) 而失敗，請使用 `ProviderNoRbac` 重試：

```bash
az deployment group what-if \
  --resource-group <rg-name> \
  --template-file <bicep-file> \
  --validation-level ProviderNoRbac
```

在報告中註記此遞補——使用者可能缺乏完整的部署權限。

### 步驟 4：擷取 What-If 結果

解析 what-if 輸出以將資源變更分類：

| 變更類型 | 符號 | 意義 |
|-------------|--------|---------|
| 建立 | `+` | 將建立新資源 |
| 刪除 | `-` | 資源將被刪除 |
| 修改 | `~` | 資源屬性將會變更 |
| 無變更 | `=` | 資源未變更 |
| 忽略 | `*` | 資源未分析（達到限制） |
| 部署 | `!` | 資源將被部署（變更未知） |

針對修改過的資源，擷取特定的屬性變更。

### 步驟 5：產生報告

在 **專案根目錄** 建立名為以下的 Markdown 報告檔案：
- `preflight-report.md`

使用 [references/REPORT-TEMPLATE.md](references/REPORT-TEMPLATE.md) 中的範本結構。

**報告章節：**
1. **摘要** - 整體狀態、時間戳記、已驗證的檔案、目標範圍
2. **執行的工具** - 執行的指令、版本、使用的驗證等級
3. **問題** - 所有錯誤與警告，包含嚴重性與補救措施
4. **What-If 結果** - 要建立/修改/刪除/未變更的資源
5. **建議** - 可執行的後續步驟

## 必要資訊

在執行驗證之前，收集以下資訊：

| 資訊 | 必要性 | 如何取得 |
|-------------|--------------|---------------|
| 資源群組 | `az deployment group` | 詢問使用者或檢查現有的 `.azure/` 設定 |
| 訂閱 | 所有部署 | `az account show` 或詢問使用者 |
| 位置 | Sub/MG/Tenant 範圍 | 詢問使用者或使用設定中的預設值 |
| 環境 | azd 專案 | `azd env list` 或詢問使用者 |

如果缺少必要資訊，請在繼續之前提示使用者。

## 錯誤處理

詳見 [references/ERROR-HANDLING.md](references/ERROR-HANDLING.md) 以取得詳細的錯誤處理指引。

**核心原則**：即使發生錯誤也繼續驗證。在最終報告中擷取所有問題。

| 錯誤類型 | 動作 |
|------------|--------|
| 未登入 | 在報告中註記，建議執行 `az login` 或 `azd auth login` |
| 權限遭拒 | 遞補至 `ProviderNoRbac`，在報告中註記 |
| Bicep 語法錯誤 | 包含所有錯誤，繼續處理其他檔案 |
| 工具未安裝 | 在報告中註記，跳過該驗證步驟 |
| 找不到資源群組 | 在報告中註記，建議建立它 |

## 工具需求

此技能使用以下工具：

- **Azure CLI** (`az`) - 建議使用版本 2.76.0+ 以支援 `--validation-level`
- **Azure Developer CLI** (`azd`) - 用於具有 `azure.yaml` 的專案
- **Bicep CLI** (`bicep`) - 用於語法驗證
- **Azure MCP 工具** - 用於文件查閱與最佳實踐

在開始前檢查工具可用性：
```bash
az --version
azd version
bicep --version
```

## 範例工作流

1. 使用者：「在我執行 Bicep 部署前幫我驗證它」
2. 代理程式偵測到 `azure.yaml` → azd 專案
3. 代理程式找到 `infra/main.bicep` 與 `infra/main.bicepparam`
4. 代理程式執行 `bicep build infra/main.bicep --stdout`
5. 代理程式執行 `azd provision --preview`
6. 代理程式在專案根目錄產生 `preflight-report.md`
7. 代理程式向使用者摘要發現結果

## 參考文件

- [驗證指令參考](references/VALIDATION-COMMANDS.md)
- [報告範本](references/REPORT-TEMPLATE.md)
- [錯誤處理指南](references/ERROR-HANDLING.md)
