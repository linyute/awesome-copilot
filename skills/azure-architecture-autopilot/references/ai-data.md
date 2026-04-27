# 領域包 (Domain Pack)：AI/資料 (v1)

專門針對 Azure AI/資料工作負載的服務組態指南。
v1 範圍：Foundry, AI Search, ADLS Gen2, Key Vault, Fabric, ADF, VNet/PE。

> 必要屬性/常見錯誤 → `service-gotchas.md`
> 動態資訊 (API 版本, SKU, 區域) → `azure-dynamic-sources.md`
> 常見模式 (PE, 安全性, 命名) → `azure-common-patterns.md`

---

## 1. Microsoft Foundry (CognitiveServices)

### 資源階層 (Resource Hierarchy)

```
Microsoft.CognitiveServices/accounts (kind: 'AIServices')
├── /projects          — Foundry 專案 (入口網站存取所必需)
└── /deployments       — 模型部署 (GPT-4o, 嵌入模型等)
```

### Bicep 核心結構

```bicep
// Foundry 資源
resource foundry 'Microsoft.CognitiveServices/accounts@<fetch>' = {
  name: foundryName
  location: location
  kind: 'AIServices'
  sku: { name: '<與使用者確認>' }               // ← 在第 1 階段檢查 MS 文件後確認 SKU
  identity: { type: 'SystemAssigned' }
  properties: {
    customSubDomainName: foundryName  // ← 必要項目，且全域唯一。建立後無法變更 — 若遺漏則必須刪除並重新建立
    allowProjectManagement: true
    publicNetworkAccess: 'Disabled'
    networkAcls: { defaultAction: 'Deny' }
  }
}

// Foundry 專案 — 必須與 Foundry 成套建立
resource project 'Microsoft.CognitiveServices/accounts/projects@<fetch>' = {
  parent: foundry
  name: '${foundryName}-project'
  location: location
  sku: { name: '<與父項相同>' }
  kind: 'AIServices'
  identity: { type: 'SystemAssigned' }
  properties: {}
}

// 模型部署 — 位於 Foundry 資源層級
resource deployment 'Microsoft.CognitiveServices/accounts/deployments@<fetch>' = {
  parent: foundry
  name: '<模型名稱>'                              // ← 在第 1 階段與使用者確認
  sku: {
    name: '<部署類型>'                        // ← GlobalStandard, Standard 等 — 擷取自 MS 文件
    capacity: <與使用者確認>                    // ← 容量單位 — 透過 MS 文件核實可用範圍
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: '<模型名稱>'                           // ← 必須核實可用性 (擷取)
      version: '<擷取>'                             // ← 版本亦需擷取
    }
  }
}
```

> `@<fetch>`：從 `azure-dynamic-sources.md` 中的 URL 核實 API 版本。
> 模型名稱/版本/部署類型/容量：皆為動態資訊 — 在第 1 階段從 MS 文件擷取後與使用者確認。

---

## 2. Azure AI Search

### Bicep 核心結構

```bicep
resource search 'Microsoft.Search/searchServices@<fetch>' = {
  name: searchName
  location: location
  sku: { name: '<與使用者確認>' }
  identity: { type: 'SystemAssigned' }
  properties: {
    hostingMode: 'default'
    publicNetworkAccess: 'disabled'
    semanticSearch: '<與使用者確認>'    // disabled | free | standard — 在 MS 文件中核實
  }
}
```

### 設計備註

- PE 支援：Basic SKU 或更高版本 (在 MS 文件中核實最新限制)
- 語義排名器 (Semantic Ranker)：透過 `semanticSearch` 屬性啟動 (`disabled` | `free` | `standard`) — 核實各個 SKU 的支援情況
- 向量搜尋：在付費 SKU 上支援 (在 MS 文件中核實)
- 通常與 Foundry 搭配用於 RAG 組態

---

## 3. ADLS Gen2 (儲存體帳號)

### Bicep 核心結構

```bicep
resource storage 'Microsoft.Storage/storageAccounts@<fetch>' = {
  name: storageName        // 僅限小寫字母與數字，不含連字號
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    isHnsEnabled: true                 // ← 絕不可遺漏此項
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Disabled'
    networkAcls: { defaultAction: 'Deny' }
  }
}

// 容器
resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@<fetch>' = {
  name: '${storage.name}/default/raw'
}
```

### 設計備註

- `isHnsEnabled` 在建立後無法變更 → 若遺漏則必須重新建立資源
- PE：根據使用案例，可能同時需要 `blob` 與 `dfs` 兩種 PE
- 常見容器：`raw`, `processed`, `curated`

---

## 4. Microsoft Fabric

### Bicep 核心結構

```bicep
resource fabric 'Microsoft.Fabric/capacities@<fetch>' = {
  name: fabricName
  location: location
  sku: { name: '<與使用者確認>', tier: 'Fabric' }
  properties: {
    administration: {
      members: [ '<管理員電子郵件>' ]    // ← 必要項目，否則部署會失敗
    }
  }
}
```

### 設計備註

- 僅能透過 Bicep 佈建容量 (Capacity)
- 工作區 (Workspace)、Lakehouse、資料倉儲 (Warehouse) 等必須在入口網站中手動建立
- 與使用者確認管理員電子郵件 (`ask_user`)

### 在第 1 階段新增時的必要確認項目

在對話中新增 Fabric 時，必須先透過 ask_user 確認下列項目，再更新架構圖：

- [ ] **SKU/容量**：F2, F4, F8, ... — 在從 MS 文件擷取可用 SKU 後提供選項
- [ ] **administration.members**：管理員電子郵件 — 否則部署會失敗

> 請勿隨意包含使用者未要求的子工作負載 (OneLake, 資料管線, 資料倉儲等)。僅能透過 Bicep 佈建容量。

---

## 5. Azure Data Factory

### Bicep 核心結構

```bicep
resource adf 'Microsoft.DataFactory/factories@<fetch>' = {
  name: adfName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    publicNetworkAccess: 'Disabled'
  }
}
```

### 設計備註

- 自行裝載的整合執行階段 (Self-hosted Integration Runtime) 需要在 Bicep 之外手動設定
- 主要用於地端資料擷取案例
- PE groupId：`dataFactory`

---

## 6. AML / AI 中樞 (AI Hub) (MachineLearningServices)

### 何時使用

```
決策規則：
├─ 一般 AI/RAG → 使用 Foundry (AIServices)
└─ 需要 ML 訓練、開源模型 → 考慮使用 AI 中樞
    └─ 僅在使用者明確要求時使用
```

### Bicep 核心結構

```bicep
resource hub 'Microsoft.MachineLearningServices/workspaces@<fetch>' = {
  name: hubName
  location: location
  kind: 'Hub'
  sku: { name: '<與使用者確認>', tier: '<與使用者確認>' }  // 例如：Basic/Basic — 在 MS 文件中核實可用 SKU
  identity: { type: 'SystemAssigned' }
  properties: {
    friendlyName: hubName
    storageAccount: storage.id
    keyVault: keyVault.id
    applicationInsights: appInsights.id    // AI 中樞必要項
    publicNetworkAccess: 'Disabled'
  }
}
```

### AI 中樞相依性

使用 AI 中樞時需要的額外資源：
- 儲存體帳號
- Key Vault
- Application Insights + Log Analytics 工作區
- 容器登錄 (選用)

---

## 7. 常見 AI/資料架構組合

### RAG 聊天機器人

```
Foundry (AIServices) + 專案
├── <對話模型> (chat)              — 在第 1 階段檢查可用性後確認
├── <嵌入模型> (embedding)         — 在第 1 階段檢查可用性後確認
├── AI Search (向量 + 語義)
├── ADLS Gen2 (文件儲存)
└── Key Vault (機密)
+ 完整的 VNet/PE 組態
```

### 資料平台

```
Fabric 容量 (分析)
├── ADLS Gen2 (資料湖)
├── ADF (擷取)
└── Key Vault (機密)
+ VNet/PE 組態
```
