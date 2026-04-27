# Bicep 產生代理 (Bicep Generator Agent)

接收來自第 1 階段已定案的架構規格，並產生可部署的 Bicep 範本。

## 步驟 0：核實最新規格 (在產生 Bicep 之前必須執行)

請勿在 Bicep 程式碼中硬編碼 API 版本。
務必擷取您預計使用的服務之 MS 文件 Bicep 參考資料，並在使用前確認最新的穩定 apiVersion。

### 核實步驟
1. 識別要使用的服務列表
2. 為每項服務擷取 MS 文件 URL (使用 web_fetch 工具)
3. 從頁面中確認最新的穩定 API 版本
4. 使用該版本撰寫 Bicep

### 模型部署可用性檢查 (使用 Foundry/OpenAI 模型時必要)

在**產生 Bicep 之前**，核實使用者指定的模型名稱在目標區域是否實際可部署。
模型可用性視區域而定且變動頻繁 — 請勿依賴靜態知識。

**核實方法 (按優先順序)：**
1. 檢查 MS 文件的模型可用性頁面：https://learn.microsoft.com/zh-tw/azure/ai-services/openai/concepts/models
2. 或者直接透過 Azure CLI 查詢：
   ```powershell
   az cognitiveservices account list-models --name "<FOUNDRY名稱>" --resource-group "<資源群組名稱>" -o table
   ```
   (當 Foundry 資源已存在時)

**若模型在目標區域不可用：**
- 通知使用者，並建議可用的區域或替代模型
- 未經使用者核准請勿替換成不同的模型或區域

### 各項服務的 MS 文件 URL

完整的 URL 註冊表位於 `references/azure-dynamic-sources.md`。擷取時請參閱該檔案。
參考檔案位於 `.github/skills/azure-architecture-autopilot/` 路徑下。

> **重要提醒**：請務必透過 web_fetch 直接從 URL 擷取資訊，以確認最新的穩定 apiVersion。請勿盲目使用來自參考檔案或先前對話的硬編碼版本。

> **務必也核實子資源**：從父資源頁面檢查子資源 (accounts/projects, accounts/deployments, privateDnsZones/virtualNetworkLinks, privateEndpoints/privateDnsZoneGroups 等) 的 API 版本。父資源與子資源的 API 版本可能不同。

> **當發生錯誤/警告時也適用同樣原則**：若在 What-if 或部署過程中發生 API 版本相關錯誤，請勿將錯誤訊息中的版本視為「最新版本」並直接套用。在修正前，請務必重新擷取 MS 文件 URL 以確認實際最新的穩定版本。

---

## 資訊參考原則 (穩定 vs. 動態)

### 務必擷取 (動態資訊)
- API 版本 → 從 `azure-dynamic-sources.md` 中的 URL 擷取
- 模型可用性 (名稱, 版本, 區域) → 擷取
- SKU 列表/定價 → 擷取
- 區域可用性 → 擷取

### 優先參考 (穩定資訊)
- 必要的屬性模式 (`isHnsEnabled`, `allowProjectManagement` 等) → `service-gotchas.md`
- PE groupId 與 DNS 區域對照 (主要服務) → `service-gotchas.md`
- PE/安全性/命名的常用模式 → `azure-common-patterns.md`
- AI/資料服務組態指南 → `ai-data.md`

> 若對穩定資訊不確定，請向 MS 文件重新核實。但不需要每次都擷取。

---

## 未知服務的備援工作流程

當使用者要求 `ai-data.md` 範圍外的服務時：

1. **通知使用者**：「此服務超出 v1 預設範圍。將參考 MS 文件，以盡力而為 (Best-effort) 的方式產生。」
2. **擷取 API 版本**：按 `https://learn.microsoft.com/zh-tw/azure/templates/microsoft.{提供者}/{資源類型}` 格式建構 URL 並進行擷取
3. **識別資源類型/必要屬性**：從擷取到的文件中確認資源類型與必要屬性
4. **核實 PE 對照**：擷取 `https://learn.microsoft.com/zh-tw/azure/private-link/private-endpoint-dns` 以確認 groupId/DNS 區域
5. **套用常用模式**：套用來自 `azure-common-patterns.md` 的安全性/網路/命名模式
6. **撰寫 Bicep**：根據上述資訊產生模組
7. **交付給審查員**：使用 `az bicep build` 驗證編譯結果

## 輸入資訊

第 1 階段完成後必須確定下列資訊：

```
- 服務：[服務列表 + SKU]
- 網路：是否使用私人端點 (Private Endpoint)
- 資源群組：資源群組名稱
- 位置：部署位置 (在第 1 階段與使用者確認)
- 訂閱 ID：Azure 訂閱 ID
```

## 輸出檔案結構

```
<專案名稱>/
├── main.bicep              # 主要協調 — 模組呼叫與參數傳遞
├── main.bicepparam         # 參數檔案 — 環境特定數值，不含敏感資訊
└── modules/
    ├── network.bicep           # VNet, 子網路 (包含 pe-subnet)
    ├── ai.bicep                # AI 服務 (按使用者需求設定)
    ├── storage.bicep           # ADLS Gen2 (必須設定 isHnsEnabled: true)
    ├── fabric.bicep            # Microsoft Fabric 容量 (僅在需要時)
    ├── keyvault.bicep          # Key Vault
    ├── monitoring.bicep        # Application Insights, Log Analytics (僅中樞型組態需要)
    └── private-endpoints.bicep # 所有 PE + 私人 DNS 區域 + VNet 連結 + DNS 區域群組
```

## 模組職責

### `network.bicep`
- VNet — 從參數接收 CIDR (以避免與客戶環境中現有的位址空間衝突)
- pe-subnet — 必須設定 `privateEndpointNetworkPolicies: 'Disabled'`
- 根據需要透過參數處理額外子網路

### `ai.bicep`
- **Microsoft Foundry 資源** (`Microsoft.CognitiveServices/accounts`, `kind: 'AIServices'`) — 頂層 AI 資源
  - 必須設定 `customSubDomainName: foundryName` — **建立後無法變更。若遺漏，必須刪除並重新建立資源**
  - 必須設定 `identity: { type: 'SystemAssigned' }`
  - 必須設定 `allowProjectManagement: true`
  - 模型部署 (`Microsoft.CognitiveServices/accounts/deployments`) — 在 Foundry 資源層級執行
- **⚠️ Foundry 專案** (`Microsoft.CognitiveServices/accounts/projects`) — **必須作為子資源建立**
  - 資源類型：`Microsoft.CognitiveServices/accounts/projects` (絕不可建立為獨立的 `accounts` 資源)
  - 在 Bicep 中使用 `parent: foundryAccount`
  - 錯誤範例：將專案建立為個別的 `kind: 'AIServices'` 帳號 → 無法在入口網站中被辨識
  - 正確範例：
    ```bicep
    resource foundryProject 'Microsoft.CognitiveServices/accounts/projects@<apiVersion>' = {
      parent: foundryAccount
      name: 'project-${uniqueString(resourceGroup().id)}'
      location: location
      kind: 'AIServices'
      properties: {}
    }
    ```
- **Azure AI Search** — 語義排名 (Semantic Ranking)、向量搜尋組態
- 僅當使用者明確要求或需要 ML 訓練/開源模型時，才應考慮使用中樞型 (`Microsoft.MachineLearningServices/workspaces`)。對於標準 AI/RAG 工作負載，Foundry (AIServices) 是預設首選

**⛔ CognitiveServices 禁用屬性：**
- `apiProperties.statisticsEnabled` — 此屬性不存在。切勿使用。會導致部署時出現 `ApiPropertiesInvalid` 錯誤
- `apiProperties.qnaAzureSearchEndpointId` — 僅限 QnA Maker 使用。請勿與 Foundry 搭配使用
- 請勿隨意在 `properties.apiProperties` 中加入未經核實的屬性

### `storage.bicep`
- ADLS Gen2：`isHnsEnabled: true` ← **絕不可遺漏此項**
- 容器：raw, processed, curated (或按需求設定)
- `allowBlobPublicAccess: false`, `minimumTlsVersion: 'TLS1_2'`

### `keyvault.bicep`
- `enableRbacAuthorization: true` (請勿使用存取政策模式)
- `enableSoftDelete: true`, `softDeleteRetentionInDays: 90`
- `enablePurgeProtection: true`

### `monitoring.bicep`
- Log Analytics 工作區
- Application Insights (僅中樞型組態需要 — Foundry AIServices 不需要)

### `private-endpoints.bicep`
- 每個服務的三件式組合：
  1. `Microsoft.Network/privateEndpoints` (放置於 pe-subnet)
  2. `Microsoft.Network/privateDnsZones` + VNet 連結 (`registrationEnabled: false`)
  3. `Microsoft.Network/privateEndpoints/privateDnsZoneGroups`
- 有關各服務的 DNS 區域對照，請參閱 `references/service-gotchas.md`

**⚠️ Foundry/AIServices PE DNS 規則：**
- PE groupId：`account`
- DNS 區域群組必須包含 **2 個區域**：
  1. `privatelink.cognitiveservices.azure.com`
  2. `privatelink.openai.azure.com`
- 若僅包含一個，會導致 OpenAI API 呼叫的 DNS 解析失敗 → 連線錯誤

**⚠️ ADLS Gen2 (isHnsEnabled: true) PE 規則：**
- 需要 2 個 PE：
  1. `blob` → `privatelink.blob.core.windows.net`
  2. `dfs` → `privatelink.dfs.core.windows.net`
- 若缺少 DFS PE，資料湖操作 (檔案系統建立、目錄操作) 將會失敗

### `rbac.bicep` (或內嵌於 main.bicep)

**⚠️ RBAC 角色指派 — 絕不可遺漏**

**任何具有受控識別 (`identity.type: 'SystemAssigned'`) 的服務都必須建立 RBAC 角色指派。**
僅有識別而未指派角色會導致服務間身分驗證失敗。
這不是選配項 — 而是**必要項目**。
遺漏此項將在第 3 階段審查中回報為「嚴重 (CRITICAL)」。

- 必要的 RBAC 對照：

| 來源服務 | 目標服務 | 角色 | 角色定義 ID |
|------------|-----------|------|-------------------|
| Foundry | 儲存體 | `Storage Blob Data Contributor` | `ba92f5b4-2d11-453d-a403-e96b0029c9fe` |
| Foundry | AI Search | `Search Index Data Contributor` | `8ebe5a00-799e-43f5-93ac-243d3dce84a7` |
| Foundry | AI Search | `Search Service Contributor` | `7ca78c08-252a-4471-8644-bb5ff32d4ba0` |
| App Service | Key Vault | `Key Vault Secrets User` | `4633458b-17de-408a-b874-0445c86b69e6` |
| AKS (kubeletIdentity) | ACR | `AcrPull` | `7f951dda-4ed3-4680-a7ca-43fe172d538d` |
| Data Factory | 儲存體 | `Storage Blob Data Contributor` | `ba92f5b4-2d11-453d-a403-e96b0029c9fe` |
| Data Factory | Key Vault | `Key Vault Secrets User` | `4633458b-17de-408a-b874-0445c86b69e6` |
| Databricks | 儲存體 | `Storage Blob Data Contributor` | `ba92f5b4-2d11-453d-a403-e96b0029c9fe` |

> **AKS 特殊規則**：AKS 使用 `identityProfile.kubeletidentity.objectId`，而非 `identity.principalId`。

```bicep
// RBAC 範例 — Foundry → 儲存體 Blob 資料參與者
resource foundryStorageRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, foundry.id, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
    principalId: foundry.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

### SQL Server 規則
- **密碼管理**：在 main.bicep 中宣告 `@secure() param sqlAdminPassword string` 並傳遞給模組
  - 請勿在模組內使用 `newGuid()` 產生 — 這會導致重新部署時密碼變更
  - 儲存為 Key Vault 密碼 (Secret)，以便部署後擷取
- **驗證方法**：預設為 `administrators.azureADOnlyAuthentication: true`
  - 許多組織政策 (如 MCAPS 等) 會阻擋獨立的 SQL 驗證
  - 僅限 AAD 驗證 + 受控識別是最安全的組態

### 網路機密處理
- **VPN 閘道共用金鑰**：`@secure() param vpnSharedKey string` — `@secure()` 為強制要求
- 絕不可在 `.bicepparam` 中包含純文字 VPN 金鑰 — 請在部署時提供或使用 Key Vault 參考
- 此規則與 SQL 密碼相同
- **適用於**：VPN 共用金鑰、ExpressRoute 授權金鑰、Wi-Fi PSK 及所有其他網路機密
- 模組參數也必須包含 `@secure()` 裝飾器

### ⚠️ 網路隔離一致性規則
- 設定 `publicNetworkAccess: 'Disabled'` 時，**務必**同時為該服務建立對應的 PE
- 若設定 publicNetworkAccess 為 Disabled 卻無 PE，會導致服務無法存取 → 部署後無法使用
- 第 3 階段審查員必須將此類不一致回報為「嚴重 (CRITICAL)」
- 發現不一致時：加入 PE 模組或將 publicNetworkAccess 恢復為 Enabled

## 強制性編碼原則

### 命名慣例
```bicep
// 使用 uniqueString 以防止命名衝突 — 一律為必要項
param foundryName string = 'foundry-${uniqueString(resourceGroup().id)}'
param searchName string = 'srch-${uniqueString(resourceGroup().id)}'
param storageName string = 'st${uniqueString(resourceGroup().id)}'  // 不允許特殊字元
param keyVaultName string = 'kv-${uniqueString(resourceGroup().id)}'
```
> **⚠️ 需要 `customSubDomainName` 的資源 (Foundry, Cognitive Services 等) 必須包含 `uniqueString()`。**
> 靜態字串 (例如：`'my-rag-chatbot'`) 可能已被其他租戶使用，導致部署失敗。
> 同樣規則適用於 Foundry 專案名稱 — `'project-${uniqueString(resourceGroup().id)}'`

### 網路隔離
```bicep
// 使用私人端點時，所有服務皆需此設定
publicNetworkAccess: 'Disabled'
networkAcls: {
  defaultAction: 'Deny'
  ipRules: []
  virtualNetworkRules: []
}
```

### 相依性管理
```bicep
// 使用資源參考建立隱含相依性，而非顯式使用 dependsOn
resource aiProject '...' = {
  properties: {
    hubResourceId: aiHub.id  // 參考 aiHub → 自動先部署 aiHub
  }
}
```

### 安全性
```bicep
// 使用 Key Vault 參考處理敏感值 — 絕不將純文字儲存在參數檔案中
@secure()
param adminPassword string  // 請勿將純文字值放入 main.bicepparam
```

### 程式碼註釋
```bicep
// Microsoft Foundry 資源 — kind: 'AIServices'
// customSubDomainName: 必要項目，全域唯一。建立後無法變更 — 若遺漏，必須刪除並重新建立資源
// allowProjectManagement: 必須為 true，否則 Foundry 專案建立會失敗
// 將 apiVersion 替換為步驟 0 中擷取的最新版本
resource foundry 'Microsoft.CognitiveServices/accounts@<步驟 0 中擷取的版本>' = {
  kind: 'AIServices'
  properties: {
    customSubDomainName: foundryName
    allowProjectManagement: true
    ...
  }
}
```

### ⚠️ Bicep 程式碼品質驗證 (產生後必須執行)

**模組宣告驗證：**
- 核實每個模組區塊中的 `name:` 屬性沒有重複
- 正確範例：`name: 'deploy-sql'`
- 錯誤範例：`name: 'name: 'deploy-sql'` (重複的 name: → 編譯錯誤)

**防止重複屬性：**
- 若同一個屬性名稱在單一資源區塊中出現超過一次，會導致編譯錯誤
- 在複雜資源 (如 VPN 閘道 (`gatewayType`)、防火牆、AKS 等) 中尤其常見
- 檢查 `az bicep build` 輸出中是否有 `BCP025: The property "xxx" is declared multiple times`

**必須執行 `az bicep build`：**
- 產生所有 Bicep 檔案後，務必執行 `az bicep build --file main.bicep`
- 修正錯誤並重新編譯
- 在核實 MS 文件中的 API 版本後，可以忽略警告 (如 BCP081 等)

## main.bicep 基礎結構

```bicep
// ============================================================
// Azure [專案名稱] 基礎設施 — main.bicep
// 產生日期：[日期]
// ============================================================

targetScope = 'resourceGroup'

// ── 通用參數 ─────────────────────────────────────
param location string   // 在第 1 階段確認的位置 — 請勿硬編碼
param projectPrefix string
param vnetAddressPrefix string    // ← 與使用者確認。防止與現有網路衝突
param peSubnetPrefix string       // ← VNet 內 PE 專用的子網路 CIDR

// ── 網路 ───────────────────────────────────────────────
module network './modules/network.bicep' = {
  name: 'deploy-network'
  params: {
    location: location
    vnetAddressPrefix: vnetAddressPrefix
    peSubnetPrefix: peSubnetPrefix
  }
}

// ── AI/資料服務 ──────────────────────────────────────
module ai './modules/ai.bicep' = {
  name: 'deploy-ai'
  params: {
    location: location
    // 若各服務區域不同，請加入個別參數 — 從 MS 文件核實可用區域
  }
  dependsOn: [network]
}

// ── 儲存體 ───────────────────────────────────────────────
module storage './modules/storage.bicep' = {
  name: 'deploy-storage'
  params: {
    location: location
  }
}

// ── Key Vault ─────────────────────────────────────────────
module keyVault './modules/keyvault.bicep' = {
  name: 'deploy-keyvault'
  params: {
    location: location
  }
}

// ── 私人端點 (所有服務) ──────────────────────
module privateEndpoints './modules/private-endpoints.bicep' = {
  name: 'deploy-private-endpoints'
  params: {
    location: location
    vnetId: network.outputs.vnetId
    peSubnetId: network.outputs.peSubnetId
    foundryId: ai.outputs.foundryId
    searchId: ai.outputs.searchId
    storageId: storage.outputs.storageId
    keyVaultId: keyVault.outputs.keyVaultId
  }
}

// ── 輸出 ───────────────────────────────────────────────
output vnetId string = network.outputs.vnetId
output foundryEndpoint string = ai.outputs.foundryEndpoint
output searchEndpoint string = ai.outputs.searchEndpoint
```

## main.bicepparam 基礎結構

```bicep
using './main.bicep'

param location = '<在第 1 階段確認的位置>'
param projectPrefix = '<專案前綴>'
// 請勿在此處放入敏感值 — 請使用 Key Vault 參考
// 在核實各服務的可用性後設定區域
```

### `@secure()` 參數處理

當 `.bicepparam` 檔案包含 `using` 指令時，無法在 `az deployment` 中另外使用 `--parameters` 旗標。
因此，`@secure()` 參數處理必須遵循下列規則：

- **盡可能設定預設值**：`@secure() param password string = newGuid()`
- **若 @secure() 參數需要使用者輸入**：改為產生一個 JSON 參數檔案 (`main.parameters.json`)，而非使用 `.bicepparam`
- **絕不要這樣做**：同時產生使用 `.bicepparam` 與 `--parameters key=value` 的指令

## 常見錯誤檢核表

完整的檢核表位於 `references/service-gotchas.md`。關鍵摘要：

| 項目 | ❌ 錯誤做法 | ✅ 正確做法 |
|------|--------|----------|
| ADLS Gen2 | 遺漏 `isHnsEnabled` | `isHnsEnabled: true` |
| PE 子網路 | 未設定政策 | `privateEndpointNetworkPolicies: 'Disabled'` |
| PE 組態 | 僅建立 PE | PE + DNS 區域 + VNet 連結 + DNS 區域群組 |
| Foundry | `kind: 'OpenAI'` | `kind: 'AIServices'` + `allowProjectManagement: true` |
| Foundry | 遺漏 `customSubDomainName` | `customSubDomainName: foundryName` — 建立後無法變更 |
| Foundry 專案 | 未建立 | 必須與 Foundry 資源成套建立 |
| 中樞 (Hub) 使用 | 用於標準 AI | 僅在使用者明確要求或需要 ML/開源模型時使用 |
| 公用網路 | 未設定 | `publicNetworkAccess: 'Disabled'` |
| 儲存體名稱 | 包含連字號 | 僅限小寫字母 + 數字，建議使用 `uniqueString()` |
| API 版本 | 沿用先前數值 | 從 MS 文件擷取 (動態) |
| 區域 | 硬編碼 | 使用參數 + 從 MS 文件核實可用性 (動態) |

## 產生完成後

當 Bicep 產生完成時：
1. 向使用者提供產生的檔案清單及其職責的摘要報告
2. 立即過渡到第 3 階段 (Bicep 審查員)
3. 審查員遵循 `references/bicep-reviewer.md` 指引執行自動化審查與修正
