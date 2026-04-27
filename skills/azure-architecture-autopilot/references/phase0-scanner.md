# 第 0 階段：現有資源掃描代理 (Existing Resource Scanner)

此檔案包含第 0 階段的詳細說明。當使用者要求分析現有的 Azure 資源 (路徑 B) 時，請閱讀並遵循此檔案。

掃描結果將視覺化為架構圖，隨後來自使用者的自然語言修改請求將被引導至第 1 階段。

> **🚨 輸出儲存路徑規則**：所有輸出 (掃描 JSON、架構圖 HTML、Bicep 程式碼) 必須儲存在**目前工作目錄 (cwd) 下的專案資料夾**中。絕不可儲存在 `~/.copilot/session-state/` 中。session-state 目錄是暫存空間，可能會在工作階段結束時被刪除。

---

## 步驟 1：Azure 登入 + 掃描範圍選取

### 1-A：核實 Azure 登入狀態

```powershell
az account show 2>&1
```

- 若已登入 → 進入步驟 1-B
- 若未登入 → 要求使用者執行 `az login`

### 1-B：訂閱選取 (支援多選)

```powershell
az account list --output json
```

使用 `ask_user` 選項呈現訂閱列表。**可以選取多個訂閱：**
```
ask_user({
  question: "請選取要分析的 Azure 訂閱。(您可以逐一加入多個選取項)",
  choices: [
    "sub-002 (目前預設訂閱) (推薦)",
    "sub-001",
    "分析上方所有訂閱"
  ]
})
```

- 選取單一訂閱 → 僅掃描該訂閱
- 選取「分析所有」 → 掃描所有訂閱
- 若使用者想要增加訂閱 → 再次使用 ask_user 逐一加入

### 1-C：掃描範圍選取 (支援多個資源群組選取)

```
ask_user({
  question: "您想要分析哪些範圍的 Azure 資源？",
  choices: [
    "指定特定資源群組 (推薦)",
    "選取多個資源群組",
    "目前訂閱中的所有資源群組"
  ]
})
```

- **特定資源群組 (RG)** → 從 RG 列表中選取或手動輸入
- **多個 RG** → 重複呼叫 ask_user 逐一加入 RG。當使用者說「夠了」時停止。
  或者，使用者可以輸入以逗號分隔的多個 RG (例如：`rg-prod, rg-dev, rg-network`)
- **整個訂閱** → `az group list` → 掃描所有 RG (若資源眾多，請警告這可能需要一些時間)

**支援組合多個訂閱 + 多個 RG：**
- 來自訂閱 A 的 rg-prod + 來自訂閱 B 的 rg-network → 掃描兩者並顯示在單一架構圖中

---

## 架構圖階層 — 顯示多個訂閱/RG

**單一訂閱 + 單一 RG**：與先前相同 (僅 VNet 邊界)
**多個 RG (同一訂閱)**：每個 RG 顯示虛線邊界
**多個訂閱**：訂閱 > RG 的兩層級邊界

在架構圖 JSON 中傳遞階層資訊：

**在 services JSON 中新增 `subscription` 與 `resourceGroup` 欄位：**
```json
{
  "id": "foundry",
  "name": "foundry-xxx",
  "type": "ai_foundry",
  "subscription": "sub-002",
  "resourceGroup": "rg-prod",
  "details": [...]
}
```

**透過 `--hierarchy` 參數傳遞階層資訊：**
```
--hierarchy '[{"subscription":"sub-002","resourceGroups":["rg-prod","rg-dev"]},{"subscription":"sub-001","resourceGroups":["rg-network"]}]'
```

根據此資訊，架構圖指令碼將：
- 多個 RG → 將每個 RG 呈現為一個帶有虛線邊界的叢集 (標籤：RG 名稱)
- 多個訂閱 → 在較大的訂閱邊界內巢狀放置 RG 邊界
- VNet 邊界顯示在該 VNet 所屬的 RG 內部

---

## 步驟 2：資源掃描

**🚨 az CLI 輸出原則：**
- az CLI 輸出**務必儲存至檔案**，然後使用 `view` 讀取。直接的終端機輸出可能會被截斷。
- 每次 PowerShell 呼叫最多組合 **3 個 az 指令**。組合過多可能會導致逾時。
- 使用 `--query` JMESPath 僅擷取必要的欄位，以縮小輸出大小。

```powershell
# ✅ 正確做法 — 儲存至檔案後讀取
az resource list -g "<RG>" --query "[].{name:name,type:type,kind:kind,location:location}" -o json | Set-Content -Path "$outDir/resources.json"

# ❌ 錯誤做法 — 直接終端機輸出 (可能會被截斷)
az resource list -g "<RG>" -o json
```

### 2-A：列出所有資源 + 向使用者顯示

```powershell
$outDir = "<專案名稱>/azure-scan"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# 步驟 1：基礎資源列表 (名稱, 類型, 種類, 位置)
az resource list -g "<RG>" --query "[].{name:name,type:type,kind:kind,location:location,id:id}" -o json | Set-Content "$outDir/resources.json"
```

**🚨 在讀取 resources.json 後，您「必須」立即向使用者顯示完整的資源列表表格：**

```
📋 rg-<RG> 資源列表 (共 N 個資源)

┌─────────────────────────┬──────────────────────────────────────────────┬─────────────────┐
│ 名稱                    │ 類型                                         │ 位置            │
├─────────────────────────┼──────────────────────────────────────────────┼─────────────────┤
│ my-storage              │ Microsoft.Storage/storageAccounts             │ koreacentral    │
│ my-keyvault             │ Microsoft.KeyVault/vaults                    │ koreacentral    │
│ ...                     │ ...                                          │ ...             │
└─────────────────────────┴──────────────────────────────────────────────┴─────────────────┘

⏳ 正在擷取詳細資訊...
```

在進行詳細查詢前，請**先**顯示此表格。不要讓使用者在不知道存在哪些資源的情況下空等。

### 2-B：動態詳細查詢 — 根據 resources.json

**根據 resources.json 中發現的資源類型，動態決定詳細查詢指令。**

請勿使用硬編碼的指令列表。僅針對 resources.json 中存在的類型執行對應指令，從下表選取。

**類型 → 詳細查詢指令對照：**

| resources.json 中的類型 | 詳細查詢指令 | 輸出檔案 |
|---|---|---|
| `Microsoft.Network/virtualNetworks` | `az network vnet list -g "<RG>" --query "[].{name:name,addressSpace:addressSpace.addressPrefixes,subnets:subnets[].{name:name,prefix:addressPrefix,pePolicy:privateEndpointNetworkPolicies}}" -o json` | `vnets.json` |
| `Microsoft.Network/privateEndpoints` | `az network private-endpoint list -g "<RG>" --query "[].{name:name,subnetId:subnet.id,targetId:privateLinkServiceConnections[0].privateLinkServiceId,groupIds:privateLinkServiceConnections[0].groupIds,state:provisioningState}" -o json` | `pe.json` |
| `Microsoft.Network/networkSecurityGroups` | `az network nsg list -g "<RG>" --query "[].{name:name,location:location,subnets:subnets[].id,nics:networkInterfaces[].id}" -o json` | `nsg.json` |
| `Microsoft.CognitiveServices/accounts` | `az cognitiveservices account list -g "<RG>" --query "[].{name:name,kind:kind,sku:sku.name,endpoint:properties.endpoint,publicAccess:properties.publicNetworkAccess,location:location}" -o json` | `cognitive.json` |
| `Microsoft.Search/searchServices` | `az search service list -g "<RG>" --query "[].{name:name,sku:sku.name,publicAccess:properties.publicNetworkAccess,semanticSearch:properties.semanticSearch,location:location}" -o json 2>$null` | `search.json` |
| `Microsoft.Compute/virtualMachines` | `az vm list -g "<RG>" --query "[].{name:name,size:hardwareProfile.vmSize,os:storageProfile.osDisk.osType,location:location,nicIds:networkProfile.networkInterfaces[].id}" -o json` | `vms.json` |
| `Microsoft.Storage/storageAccounts` | `az storage account list -g "<RG>" --query "[].{name:name,sku:sku.name,kind:kind,hns:properties.isHnsEnabled,publicAccess:properties.publicNetworkAccess,location:location}" -o json` | `storage.json` |
| `Microsoft.KeyVault/vaults` | `az keyvault list -g "<RG>" --query "[].{name:name,location:location}" -o json 2>$null` | `keyvault.json` |
| `Microsoft.ContainerService/managedClusters` | `az aks list -g "<RG>" --query "[].{name:name,kubernetesVersion:kubernetesVersion,sku:sku,agentPoolProfiles:agentPoolProfiles[].{name:name,count:count,vmSize:vmSize},networkProfile:networkProfile.networkPlugin,location:location}" -o json` | `aks.json` |
| `Microsoft.Web/sites` | `az webapp list -g "<RG>" --query "[].{name:name,kind:kind,sku:appServicePlan,state:state,defaultHostName:defaultHostName,httpsOnly:httpsOnly,location:location}" -o json` | `webapps.json` |
| `Microsoft.Web/serverFarms` | `az appservice plan list -g "<RG>" --query "[].{name:name,sku:sku.name,tier:sku.tier,kind:kind,location:location}" -o json` | `appservice-plans.json` |
| `Microsoft.DocumentDB/databaseAccounts` | `az cosmosdb list -g "<RG>" --query "[].{name:name,kind:kind,databaseAccountOfferType:databaseAccountOfferType,locations:locations[].locationName,publicAccess:publicNetworkAccess}" -o json` | `cosmosdb.json` |
| `Microsoft.Sql/servers` | `az sql server list -g "<RG>" --query "[].{name:name,fullyQualifiedDomainName:fullyQualifiedDomainName,publicAccess:publicNetworkAccess,location:location}" -o json` | `sql-servers.json` |
| `Microsoft.Databricks/workspaces` | `az databricks workspace list -g "<RG>" --query "[].{name:name,sku:sku.name,url:workspaceUrl,publicAccess:parameters.enableNoPublicIp.value,location:location}" -o json 2>$null` | `databricks.json` |
| `Microsoft.Synapse/workspaces` | `az synapse workspace list -g "<RG>" --query "[].{name:name,sqlAdminLogin:sqlAdministratorLogin,publicAccess:publicNetworkAccess,location:location}" -o json 2>$null` | `synapse.json` |
| `Microsoft.DataFactory/factories` | `az datafactory list -g "<RG>" --query "[].{name:name,publicAccess:publicNetworkAccess,location:location}" -o json 2>$null` | `adf.json` |
| `Microsoft.EventHub/namespaces` | `az eventhubs namespace list -g "<RG>" --query "[].{name:name,sku:sku.name,location:location}" -o json` | `eventhub.json` |
| `Microsoft.Cache/redis` | `az redis list -g "<RG>" --query "[].{name:name,sku:sku.name,port:port,sslPort:sslPort,publicAccess:publicNetworkAccess,location:location}" -o json` | `redis.json` |
| `Microsoft.ContainerRegistry/registries` | `az acr list -g "<RG>" --query "[].{name:name,sku:sku.name,adminUserEnabled:adminUserEnabled,publicAccess:publicNetworkAccess,location:location}" -o json` | `acr.json` |
| `Microsoft.MachineLearningServices/workspaces` | `az resource show --ids "<ID>" --query "{name:name,sku:sku,kind:kind,location:location,publicAccess:properties.publicNetworkAccess,hbiWorkspace:properties.hbiWorkspace,managedNetwork:properties.managedNetwork.isolationMode}" -o json` | `mlworkspace.json` |
| `Microsoft.Insights/components` | `az monitor app-insights component show -g "<RG>" --app "<名稱>" --query "{name:name,kind:kind,instrumentationKey:instrumentationKey,workspaceResourceId:workspaceResourceId,location:location}" -o json 2>$null` | `appinsights-<名稱>.json` |
| `Microsoft.OperationalInsights/workspaces` | `az monitor log-analytics workspace show -g "<RG>" -n "<名稱>" --query "{name:name,sku:sku.name,retentionInDays:retentionInDays,location:location}" -o json` | `log-analytics-<名稱>.json` |
| `Microsoft.Network/applicationGateways` | `az network application-gateway list -g "<RG>" --query "[].{name:name,sku:sku,location:location}" -o json` | `appgateway.json` |
| `Microsoft.Cdn/profiles` / `Microsoft.Network/frontDoors` | `az afd profile list -g "<RG>" --query "[].{name:name,sku:sku,location:location}" -o json 2>$null` | `frontdoor.json` |
| `Microsoft.Network/azureFirewalls` | `az network firewall list -g "<RG>" --query "[].{name:name,sku:sku,threatIntelMode:threatIntelMode,location:location}" -o json` | `firewall.json` |
| `Microsoft.Network/bastionHosts` | `az network bastion list -g "<RG>" --query "[].{name:name,sku:sku,location:location}" -o json` | `bastion.json` |

**動態查詢流程：**

1. 讀取 `resources.json`
2. 擷取 `type` 欄位的所有不重複值
3. 僅針對上表中相符的類型執行指令 (跳過不存在的類型)
4. 若發現不在上表中的類型 → 使用通用查詢：`az resource show --ids "<ID>" --query "{name:name,sku:sku,kind:kind,location:location,properties:properties}" -o json`
5. 分批執行指令 (每次 2-3 個)，不要一次全部執行

### 2-C：模型部署查詢 (當 Cognitive Services 存在時)

```powershell
# 針對每個 Cognitive Services 資源查詢模型部署
az cognitiveservices account deployment list --name "<名稱>" -g "<RG>" --query "[].{name:name,model:properties.model.name,version:properties.model.version,sku:sku.name}" -o json | Set-Content "$outDir/<名稱>-deployments.json"
```

### 2-D：NIC + 公用 IP 查詢 (當 VM 存在時)

```powershell
az network nic list -g "<RG>" --query "[].{name:name,subnetId:ipConfigurations[0].subnet.id,privateIp:ipConfigurations[0].privateIPAddress,publicIpId:ipConfigurations[0].publicIPAddress.id}" -o json | Set-Content "$outDir/nics.json"
az network public-ip list -g "<RG>" --query "[].{name:name,ip:ipAddress,sku:sku.name}" -o json | Set-Content "$outDir/public-ips.json"
```

從 VNet 獲取：
- `addressSpace.addressPrefixes` → CIDR
- `subnets[].name`, `subnets[].addressPrefix` → 子網路資訊
- `subnets[].privateEndpointNetworkPolicies` → PE 政策

---

## 步驟 3：推論資源間的關係

自動推論掃描到的資源之間的**關係 (連線)**，以建構架構圖所需的連線 JSON。

### 關係推論規則

**🚨 若連線不足，架構圖將失去意義。請盡可能推論出最多的關係。**

#### 確定的推論 (可直接從資源 ID/屬性核實)

| 關係類型 | 推論方法 | 連線類型 (connection type) |
|---|---|---|
| PE → 服務 | 從 PE 的 `privateLinkServiceId` 擷取服務 ID | `private` |
| PE → VNet | 從 PE 的 `subnet.id` 擷取 VNet | (呈現為 VNet 邊界) |
| Foundry → 專案 | `accounts/projects` 的父資源 | `api` |
| VM → NIC → 子網路 | 從 NIC 的 `subnet.id` 推論 VNet/子網路 | (VNet 邊界) |
| NSG → 子網路 | 從 NSG 的 `subnets[].id` 檢查已連線的子網路 | `network` |
| NSG → NIC | 從 NSG 的 `networkInterfaces[].id` 檢查已連線的 VM | `network` |
| NIC → 公用 IP | 從 NIC 的 `publicIPAddress.id` 檢查公用 IP | (包含在詳細資訊中) |
| Databricks → VNet | 工作區的 VNet 插入 (VNet Injection) 組態 | (VNet 邊界) |

#### 合理的推論 (同一 RG 內服務間的常見模式)

| 關係類型 | 推論條件 | 連線類型 (connection type) |
|---|---|---|
| Foundry → AI Search | 兩者存在於同一 RG → 推論為 RAG 連線 | `api` (標籤：「RAG Search」) |
| Foundry → 儲存體 | 兩者存在於同一 RG → 推論為資料連線 | `data` (標籤：「資料」) |
| AI Search → 儲存體 | 兩者存在於同一 RG → 推論為索引連線 | `data` (標籤：「編製索引」) |
| 服務 → Key Vault | 同一 RG 內存在 Key Vault → 推論為機密管理 | `security` (標籤：「機密」) |
| VM → Foundry/Search | 同一 RG 內存在 VM 與 AI 服務 → 推論為 API 呼叫 | `api` (標籤：「API」) |
| DI → Foundry | 同一 RG 內存在 Document Intelligence 與 Foundry → 推論為 OCR/擷取連線 | `api` (標籤：「OCR/擷取」) |
| ADF → 儲存體 | 同一 RG 內存在 ADF 與儲存體 → 推論為資料管線 | `data` (標籤：「管線」) |
| ADF → SQL | 同一 RG 內存在 ADF 與 SQL → 推論為資料來源 | `data` (標籤：「來源」) |
| Databricks → 儲存體 | 兩者存在於同一 RG → 推論為資料湖連線 | `data` (標籤：「資料湖」) |

#### 推論後的使用者確認

向使用者顯示推論出的連線列表並要求確認：
```
> **⏳ 已推論資源間的關係** — 請核實下列內容是否正確。

推論出的連線：
- Foundry → AI Search (RAG Search)
- Foundry → 儲存體 (資料)
- VM → Foundry (API 呼叫)
- Document Intelligence → Foundry (OCR/擷取)

這些看起來正確嗎？如果您想要加入或移除任何連線，請告訴我。
```

#### 無法推論的關係

可能存在無法使用上述規則推論出的連線。使用者可以自由手動加入額外的連線。

### 模型部署查詢 (當 Foundry 資源存在時)

```powershell
az cognitiveservices account deployment list --name "<FOUNDRY名稱>" -g "<RG>" --query "[].{name:name,model:properties.model.name,version:properties.model.version,sku:sku.name}" -o json
```

將每個部署的模型名稱、版本與 SKU 加入 Foundry 節點的詳細資訊中。

---

## 步驟 4：服務/連線 JSON 轉換

將掃描結果轉換為內建架構圖引擎的輸入格式。

### 資源類型 → 架構圖類型 (Diagram type) 對照

| Azure 資源類型 | 架構圖類型 |
|---|---|
| `Microsoft.CognitiveServices/accounts` (kind: AIServices) | `ai_foundry` |
| `Microsoft.CognitiveServices/accounts` (kind: OpenAI) | `openai` |
| `Microsoft.CognitiveServices/accounts` (kind: FormRecognizer) | `document_intelligence` |
| `Microsoft.CognitiveServices/accounts` (kind: TextAnalytics 等) | `ai_foundry` (預設) |
| `Microsoft.CognitiveServices/accounts/projects` | `ai_foundry` |
| `Microsoft.Search/searchServices` | `search` |
| `Microsoft.Storage/storageAccounts` | `storage` |
| `Microsoft.KeyVault/vaults` | `keyvault` |
| `Microsoft.Databricks/workspaces` | `databricks` |
| `Microsoft.Sql/servers` | `sql_server` |
| `Microsoft.Sql/servers/databases` | `sql_database` |
| `Microsoft.DocumentDB/databaseAccounts` | `cosmos_db` |
| `Microsoft.Web/sites` | `app_service` |
| `Microsoft.ContainerService/managedClusters` | `aks` |
| `Microsoft.Web/sites` (kind: functionapp) | `function_app` |
| `Microsoft.Synapse/workspaces` | `synapse` |
| `Microsoft.Fabric/capacities` | `fabric` |
| `Microsoft.DataFactory/factories` | `adf` |
| `Microsoft.Compute/virtualMachines` | `vm` |
| `Microsoft.Network/privateEndpoints` | `pe` |
| `Microsoft.Network/virtualNetworks` | (呈現為 VNet 邊界 — 不包含在 services 中) |
| `Microsoft.Network/networkSecurityGroups` | `nsg` |
| `Microsoft.Network/bastionHosts` | `bastion` |
| `Microsoft.OperationalInsights/workspaces` | `log_analytics` |
| `Microsoft.Insights/components` | `app_insights` |
| 其他 | `default` |

### services JSON 建構規則

```json
{
  "id": "資源名稱 (小寫，移除特殊字元)",
  "name": "實際資源名稱",
  "type": "從上表確定的類型",
  "sku": "實際 SKU (若可用)",
  "private": true/false,  // 若連接了 PE 則為 true
  "details": ["屬性1", "屬性2", ...]
}
```

**詳細資訊 (details) 應包含的內容：**
- 端點 (Endpoint) URL
- SKU/層級詳情
- kind (AIServices, OpenAI 等)
- 模型部署列表 (Foundry)
- 關鍵屬性 (isHnsEnabled, semanticSearch 等)
- 區域

### VNet 資訊 → `--vnet-info` 參數

若發現 VNet，透過 `--vnet-info` 在邊界標籤中顯示：
```
--vnet-info "10.0.0.0/16 | pe-subnet: 10.0.1.0/24 | <區域>"
```

### PE 節點產生

若發現 PE，請為每個 PE 新增獨立節點，並使用 `private` 類型連接至對應服務：
```json
{"id": "pe_<服務ID>", "name": "PE: <服務名稱>", "type": "pe", "details": ["groupId: <groupId>", "<狀態>"]}
```

---

## 步驟 5：架構圖產生 + 向使用者呈現

架構圖檔名：`<專案名稱>/00_arch_current.html`

使用掃描的 RG 名稱作為預設專案名稱：
```
ask_user({
  question: "請選擇專案名稱。(這將成為儲存掃描結果的資料夾名稱)",
  choices: ["<RG名稱>", "azure-analysis"]
})
```

產生架構圖後，進行回報：
```
## 目前的 Azure 架構

[互動式架構圖 — 00_arch_current.html]

掃描到的資源 (共 N 個)：
[依資源類型分類的摘要表]

您想要在此處進行什麼變更？
- 🔧 效能改進 (「太慢了」、「增加吞吐量」)
- 💰 成本優化 (「降低成本」、「讓它更便宜」)
- 🔒 安全性強化 (「加入 PE」、「阻擋公用存取」)
- 🌐 網路變更 (「切分 VNet」、「加入 Bastion」)
- ➕ 新增/移除資源 (「新增 VM」、「刪除此項」)
- 📊 監控/營運 (「設定日誌」、「加入警示」)
- 🤔 診斷 (「此架構是否正確？」、「哪裡有問題？」)
- 或者直接取得架構圖並在此結束
```

---

## 步驟 6：修改對話 → 過渡到第 1 階段

當使用者要求修改時，過渡到第 1 階段 (phase1-advisor.md)。
這是**路徑 B 的進入點**，使用現有的掃描結果作為基準。

### 自然語言修改請求處理 — 釐清問題模式

透過詢問釐清問題，使使用者模糊的請求變得具體：

**🔧 效能**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「太慢了」 / 「回應時間太長」 | 「哪個服務很慢？我們應該升級 SKU 還是更改區域？」 |
| 「我想要增加吞吐量」 | 「要增加哪個服務的吞吐量？擴展 (Scale out)？增加 DTU/RU？」 |
| 「AI Search 索引太慢」 | 「我們應該增加分區嗎？將 SKU 升級至 S2？」 |

**💰 成本**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「我想要降低成本」 | 「要降低哪個服務的成本？調降 SKU？清理未使用的資源？」 |
| 「這要花多少錢？」 | 從 MS 文件查詢定價資訊，並根據目前 SKU 提供預估成本 |
| 「這是開發環境，所以越便宜越好」 | 「我們應該切換到免費 (Free)/基礎 (Basic) 層級嗎？哪些服務？」 |

**🔒 安全性**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「強化安全性」 | 「我們應該為沒有 PE 的服務加入 PE 嗎？檢查 RBAC？停用 publicNetworkAccess？」 |
| 「阻擋公用存取」 | 「是否要為所有服務套用 PE + publicNetworkAccess: Disabled？」 |
| 「管理金鑰」 | 「我們應該加入 Key Vault 並透過受控識別連接嗎？」 |

**🌐 網路**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「加入 PE」 | 「針對哪個服務？要一次為所有服務都加入嗎？」 |
| 「切分 VNet」 | 「要切分哪些子網路？我們是否也要加入 NSG？」 |
| 「加入 Bastion」 | 「正在為 VM 存取加入 Azure Bastion。請指定子網路 CIDR。」 |

**➕ 新增/移除資源**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「新增 VM」 | 「需要多少台？什麼 SKU？同一個 VNet 嗎？什麼作業系統？」 |
| 「新增 Fabric」 | 「什麼 SKU？管理員電子郵件為何？」 |
| 「刪除此項」 | 「您確定要移除 [資源名稱] 嗎？連線的 PE 也會一併被移除。」 |

**📊 監控/營運**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「我想要查看日誌」 | 「我們應該加入 Log Analytics 工作區並連接診斷設定嗎？」 |
| 「設定警示」 | 「針對哪些指標？CPU？錯誤率？回應時間？」 |
| 「連結 Application Insights」 | 「連結至哪個服務？App Service？Function App？」 |

**🔄 遷移/變更**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「更改區域」 | 「要更改到哪個區域？我會核實該區域是否支援所有服務。」 |
| 「將 SQL 換成 Cosmos」 | 「需要哪種 Cosmos DB API 類型？(SQL/MongoDB/Cassandra) 我也可以提供資料遷移指南。」 |
| 「將 Foundry 換成 AI 中樞」 | 「僅當需要 ML 訓練/開源模型時才適合使用 AI 中樞。讓我核實您的使用案例。」 |

**🤔 診斷/提問**

| 使用者請求 | 釐清問題範例 |
|---|---|
| 「哪裡有問題？」 | 分析目前組態 (publicNetworkAccess 已開啟, PE 未連線, SKU 不當等) 並建議改進方案 |
| 「此架構是否正確？」 | 根據 Well-Architected 框架進行審查 (安全性、可靠性、效能、成本、營運) |
| 「PE 連線是否正確？」 | 使用 `az network private-endpoint show` 檢查連線狀態並報告 |
| 「直接給我架構圖」 | 不要過渡到第 1 階段；提供 00_arch_current.html 路徑並結束 |

修改方案定案後：
1. 套用第 1 階段的差異確認規則 (Delta Confirmation Rule)
2. 進行事實核實 (Fact-check) (交叉驗證 MS 文件)
3. 產生更新後的架構圖 (01_arch_diagram_draft.html)
4. 使用者確認 → 進入第 2–4 階段

---

## 掃描效能優化

- 若資源超過 50 個，請警告使用者：「資源眾多，掃描可能需要一些時間。」
- 先執行 `az resource list` 確定資源總數，再進行詳細查詢。
- 優先查詢關鍵服務 (Foundry, Search, Storage, KeyVault, VNet, PE)，其餘資源僅透過 `az resource show` 收集基礎資訊。
- 隨時向使用者報告進度：
  > **⏳ 正在掃描資源** — 已完成 N 個中的 M 個

---

## 處理不支援的資源

對於不在架構圖類型對照表中的資源類型：
- 以 `default` 類型顯示 (問號圖示)
- 在詳細資訊中包含資源名稱與類型
- 向使用者顯示，但不嘗試進行關係推論
