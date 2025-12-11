---
description: 'Azure 已驗證模組 (AVM) 與 Bicep'
applyTo: '**/*.bicep, **/*.bicepparam'
---

# Azure Verified Modules (AVM) Bicep

## 概覽

Azure 已驗證模組 (AVM) 是已預建、測試並驗證的 Bicep 模組，遵循 Azure 最佳實務。使用這些模組可以更有信心地建立、更新或審查 Azure 基礎架構即程式碼（IaC）。

## 模組搜尋

### Bicep 公共註冊表

- 搜尋模組：`br/public:avm/res/{service}/{resource}:{version}`
- 瀏覽可用模組：`https://github.com/Azure/bicep-registry-modules/tree/main/avm/res`
- 範例：`br/public:avm/res/storage/storage-account:0.30.0`

### 官方 AVM 索引

- **Bicep 資源模組**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/BicepResourceModules.csv`
- **Bicep 範式模組**：`https://raw.githubusercontent.com/Azure/Azure-Verified-Modules/refs/heads/main/docs/static/module-indexes/BicepPatternModules.csv`

### 模組文件

- **GitHub 倉庫**：`https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/{service}/{resource}`
- **README**：每個模組都包含具範例的完整文件

## 模組使用

### 由範例開始

1. 在 `https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/{service}/{resource}` 審查模組的 README
2. 從模組文件複製範例程式碼
3. 使用 `br/public:avm/res/{service}/{resource}:{version}` 參照模組
4. 設定必填與選填參數

### 範例用法

```bicep
module storageAccount 'br/public:avm/res/storage/storage-account:0.30.0' = {
  name: 'storage-account-deployment'
  scope: resourceGroup()
  params: {
    name: storageAccountName
    location: location
    skuName: 'Standard_LRS'
    tags: tags
  }
}
```

### 當 AVM 模組不存在時

若特定資源類型沒有 AVM 模組，請使用 Bicep 原生資源宣告並選用最新穩定的 API 版本。

## 命名慣例

### 模組參照

- **資源模組**：`br/public:avm/res/{service}/{resource}:{version}`
- **範式模組**：`br/public:avm/ptn/{pattern}:{version}`
- 範例：`br/public:avm/res/network/virtual-network:0.7.2`

### 符號名稱

- 變數、參數、資源、模組等皆使用 lowerCamelCase
- 使用具描述性的資源型別名稱（例如使用 `storageAccount` 而非 `storageAccountName`）
- 符號名稱代表資源本身，避免在符號名稱中加上 'name' 後綴
- 避免以後綴區分變數與參數

## 版本管理

### 版本鎖定最佳實務

- 始終鎖定至特定模組版本：`:{version}`
- 使用語意版本（例如 `:0.30.0`）
- 在升級前檢閱模組變更日誌
- 在非生產環境先測試版本升級

## 開發最佳實務

### 模組搜尋與使用

- ✅ **始終** 在建立原生資源前檢查是否已有 AVM 模組
- ✅ **審閱** 模組文件與範例後再實作
- ✅ **鎖定** 模組版本
- ✅ **在可用時** 使用模組提供的類型（從模組匯入類型）
- ✅ **優先** 使用 AVM 模組，而非原生資源宣告

### 程式碼結構

- ✅ **在檔案頂端** 宣告參數並使用 `@sys.description()` 裝飾器
- ✅ **為命名參數** 指定 `@minLength()` 與 `@maxLength()`
- ✅ **謹慎使用** `@allowed()` 裝飾器以避免阻擋有效部署
- ✅ **設定** 適用於測試環境的預設值（選用低成本 SKU）
- ✅ **對複雜運算** 使用變數而非直接嵌入到資源屬性中
- ✅ **使用** `loadJsonContent()` 讀取外部設定檔

### 資源參照

- ✅ **使用** 符號名稱參照（例如 `storageAccount.id`），避免使用 `reference()` 或 `resourceId()`
- ✅ **建立** 依賴關係時以符號名稱表示，而非明確使用 `dependsOn`
- ✅ **使用** `existing` 關鍵字取用其他資源屬性
- ✅ **透過點記法** 存取模組輸出（例如 `storageAccount.outputs.resourceId`）

### 資源命名

- ✅ **使用** `uniqueString()` 並搭配具意義的前綴以產生唯一名稱
- ✅ **加上** 前綴（因某些資源名稱不可以數字開頭）
- ✅ **遵守** 資源特定的命名限制（長度、允許字元）

### 子資源

- ✅ **避免** 過度巢狀的子資源
- ✅ **使用** `parent` 屬性或巢狀方式，而非手動組合名稱

### 安全性

- ❌ **切勿** 在輸出中包含機密或金鑰
- ✅ **在輸出中使用** 資源屬性（例如 `storageAccount.outputs.primaryBlobEndpoint`）
- ✅ **啟用** 管理式身分（managed identities）當可能時
- ✅ **在啟用網路隔離時** 停用公開存取

### 類型

- ✅ **在可用時從模組匯入類型**：`import { deploymentType } from './module.bicep'`
- ✅ **為複雜參數結構使用** 使用者定義類型
- ✅ **對變數使用** 類型推斷

### 文件記錄

- ✅ **在複雜邏輯處加入** 有助理解的 `//` 註解
- ✅ **在所有參數上使用** `@sys.description()` 並提供清楚說明
- ✅ **記錄** 不明顯的設計決策

## 驗證需求

### 建置驗證（必要）

對 Bicep 檔案做出任何修改後，執行下列指令以確保所有檔案能成功建置：

```shell
# 確保 Bicep CLI 為最新
az bicep upgrade

# 建置並驗證變更的 Bicep 檔案
az bicep build --file main.bicep
```

### Bicep 參數檔

- ✅ **在修改 `*.bicep` 檔案時** 必須更新相對應的 `*.bicepparam` 檔案
- ✅ **驗證** 參數檔與目前的參數定義相符
- ✅ **在提交前測試** 使用參數檔進行部署

## 工具整合

### 使用可用工具

- **結構資訊**：使用 `azure_get_schema_for_Bicep` 取得資源結構資訊
- **部署建議**：使用 `azure_get_deployment_best_practices` 工具
- **服務文件**：使用 `microsoft.docs.mcp` 取得 Azure 服務相關指引

### GitHub Copilot 整合

在處理 Bicep 時：

1. 在建立資源前檢查是否已有 AVM 模組
2. 以官方模組範例做為起點
3. 在所有變更後執行 `az bicep build`
4. 更新相對應的 `.bicepparam` 檔案
5. 記錄自訂或與範例不同之處

## 疑難排解

### 常見問題

1. **模組版本**：在模組參照中始終指定精確版本
2. **遺失的相依性**：確保相依資源在相依模組之前建立
3. **驗證失敗**：執行 `az bicep build` 以找出語法/型別錯誤
4. **參數檔**：參數變更時務必更新 `.bicepparam` 檔

### 支援資源

- **AVM 文件**：`https://azure.github.io/Azure-Verified-Modules/`
- **Bicep 註冊表**：`https://github.com/Azure/bicep-registry-modules`
- **Bicep 文件**：`https://learn.microsoft.com/azure/azure-resource-manager/bicep/`
- **最佳實務**：`https://learn.microsoft.com/azure/azure-resource-manager/bicep/best-practices`

## 合規檢查清單

在提交任何 Bicep 程式碼前：

- [ ] 在可用時使用 AVM 模組
- [ ] 模組版本已鎖定
- [ ] 程式碼能成功建置（`az bicep build`）
- [ ] 已更新相對應的 `.bicepparam` 檔案
- [ ] 所有參數皆使用 `@sys.description()`
- [ ] 參照使用符號名稱
- [ ] 輸出中未包含機密
- [ ] 在適當時匯入/定義類型
- [ ] 對複雜邏輯加入註解
- [ ] 遵循 lowerCamelCase 命名慣例
