# 服務注意事項 (穩定)

按服務劃分的**非直觀必要屬性**、**常見錯誤**與 **PE 對照**摘要。
此處僅包含近乎不可變的模式。API 版本、SKU 列表與區域等動態數值不包含在內。

---

## 1. 必要屬性 (若遺漏會導致部署失敗或功能問題)

| 服務 | 必要屬性 | 遺漏後的結果 | 附註 |
|---------|------------------|-------------------|-------|
| ADLS Gen2 | `isHnsEnabled: true` | 會變為一般的 Blob 儲存體。此操作不可逆 | 必須設定 `kind: 'StorageV2'` |
| 儲存體帳號 | 名稱中不可包含特殊字元或連字號 | 部署失敗 | 僅限小寫字母與數字，3-24 個字元 |
| Foundry (AIServices) | `customSubDomainName: foundryName` | 無法建立專案，建立後無法變更 → 必須刪除並重新建立資源 | 數值需全域唯一 |
| Foundry (AIServices) | `allowProjectManagement: true` | 無法建立 Foundry 專案 | `kind: 'AIServices'` |
| Foundry (AIServices) | `identity: { type: 'SystemAssigned' }` | 專案建立失敗 | |
| Foundry 專案 | 必須與 Foundry 資源成套建立 | 無法從入口網站使用 | `accounts/projects` |
| Key Vault | `enableRbacAuthorization: true` | 存在混合使用存取政策 (Access Policy) 的風險 | |
| Key Vault | `enablePurgeProtection: true` | 生產環境必需 | |
| Fabric 容量 | 必須提供 `administration.members` | 部署失敗 | 管理員電子郵件 |
| PE 子網路 | `privateEndpointNetworkPolicies: 'Disabled'` | PE 部署失敗 | |
| PE DNS 區域 | `registrationEnabled: false` (VNet 連結) | 可能發生 DNS 衝突 | |
| PE 組態 | 三件式組合 (PE + DNS 區域 + VNet 連結 + 區域群組) | 即使有 PE，DNS 解析仍會失敗 | |

---

## 2. PE groupId 與 DNS 區域對照 (主要服務)

下列對照關係是穩定的，但在新增服務時，請從 `azure-dynamic-sources.md` 中的 PE DNS 整合文件重新核實。

| 服務 | groupId | 私人 DNS 區域 |
|---------|---------|-----------------|
| Azure OpenAI / CognitiveServices | `account` | `privatelink.cognitiveservices.azure.com` |
| ⚠️ (Foundry/AIServices 額外項) | `account` | `privatelink.openai.azure.com` ← **DNS 區域群組中務必包含這兩個區域。若遺漏，OpenAI API 的 DNS 解析會失敗** |
| Azure AI Search | `searchService` | `privatelink.search.windows.net` |
| 儲存體 (Blob/ADLS) | `blob` | `privatelink.blob.core.windows.net` |
| 儲存體 (DFS/ADLS Gen2) | `dfs` | `privatelink.dfs.core.windows.net` |
| Key Vault | `vault` | `privatelink.vaultcore.azure.net` |
| Azure ML / AI 中樞 | `amlworkspace` | `privatelink.api.azureml.ms` |
| 容器登錄 (ACR) | `registry` | `privatelink.azurecr.io` |
| Cosmos DB (SQL) | `Sql` | `privatelink.documents.azure.com` |
| Azure Cache for Redis | `redisCache` | `privatelink.redis.cache.windows.net` |
| 資料處理中心 (Data Factory) | `dataFactory` | `privatelink.datafactory.azure.net` |
| API 管理 | `Gateway` | `privatelink.azure-api.net` |
| 事件中心 (Event Hub) | `namespace` | `privatelink.servicebus.windows.net` |
| 服務匯流排 (Service Bus) | `namespace` | `privatelink.servicebus.windows.net` |
| 監視器 (AMPLS) | ⚠️ 組態複雜 — 見下方說明 | ⚠️ 需要多個 DNS 區域 — 見下方說明 |

> **ADLS Gen2 備註**：當 `isHnsEnabled: true` 時，**`blob` 與 `dfs` 這兩個 PE 皆為必要**。
> - 若僅有 `blob` PE，則 Blob API 可運作，但資料湖操作 (檔案系統建立、目錄操作、`abfss://` 協定) 將會失敗。
> - DFS PE：groupId 為 `dfs`，DNS 區域為 `privatelink.dfs.core.windows.net`
>
> **⚠️ Azure 監視器私人連結 (AMPLS) 備註**：Azure 監視器無法透過單一 PE + 單一 DNS 區域來設定。它透過 Azure 監視器私人連結範圍 (AMPLS) 連接，且需要全部 **5 個 DNS 區域**：
> - `privatelink.monitor.azure.com`
> - `privatelink.oms.opinsights.azure.com`
> - `privatelink.ods.opinsights.azure.com`
> - `privatelink.agentsvc.azure-automation.net`
> - `privatelink.blob.core.windows.net` (用於 Log Analytics 資料擷取)
>
> 此對照關係較為複雜且可能變動，因此在設定 Monitor PE 時，務必擷取並核實 MS 文件：
> https://learn.microsoft.com/zh-tw/azure/azure-monitor/logs/private-link-configure

---

## 3. 常見錯誤檢核表

| 項目 | ❌ 錯誤範例 | ✅ 正確範例 |
|------|---------------------|-------------------|
| ADLS Gen2 HNS | 遺漏 `isHnsEnabled` 或設為 `false` | `isHnsEnabled: true` |
| PE 子網路 | 未設定政策 | `privateEndpointNetworkPolicies: 'Disabled'` |
| DNS 區域群組 | 僅建立了 PE | PE + DNS 區域 + VNet 連結 + DNS 區域群組 |
| Foundry 資源 | `kind: 'OpenAI'` | `kind: 'AIServices'` + `allowProjectManagement: true` |
| Foundry 資源 | 遺漏 `customSubDomainName` | `customSubDomainName: foundryName` — 建立後無法變更 |
| Foundry 專案 | 僅有 Foundry 而無專案 | 必須成套建立 |
| Key Vault 驗證 | 存取政策 (Access Policy) | `enableRbacAuthorization: true` |
| 公用網路 | 未設定 | `publicNetworkAccess: 'Disabled'` |
| 儲存體名稱 | 包含連字號 | `stmystorage` 或 `st${uniqueString(...)}` |
| API 版本 | 沿用先前對話/錯誤中的數值 | 核實 MS 文件中的最新穩定版本 |
| 區域 | 硬編碼 (`'eastus'`) | 作為參數傳遞 (`param location`) |
| 敏感值 | 在 `.bicepparam` 中使用純文字 | `@secure()` + Key Vault 參考 |

---

## 4. 服務關係決策規則

此處描述為**預設選取規則**，而非絕對判定。

### Foundry vs. Azure OpenAI vs. AI 中樞 (AI Hub)

```
預設規則：
├─ AI/RAG 工作負載 → 使用 Microsoft Foundry (kind: 'AIServices')
│   ├─ 將 Foundry 資源與 Foundry 專案成套建立
│   └─ 模型部署在 Foundry 資源層級執行 (accounts/deployments)
│
├─ 需要 ML 訓練/開源模型 → 考慮使用 AI 中樞 (MachineLearningServices)
│   └─ 僅在使用者明確要求，或需要 Foundry 不支援的功能時才使用
│
└─ 獨立的 Azure OpenAI 資源 →
    僅在使用者明確要求，或
    官方文件要求使用獨立資源時才考慮
```

> 這些規則是反映目前微軟建議的**預設選取指南**。
> Azure 產品關係可能會變動，因此不確定時請檢查 MS 文件。

### 監控

```
預設規則：
├─ Foundry (AIServices) → 不需要 Application Insights
└─ AI 中樞 (MachineLearningServices) → 需要 Application Insights + Log Analytics
```
