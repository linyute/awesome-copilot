# Azure 動態來源註冊表 (Dynamic Sources Registry)

此檔案**僅管理經常變動之資訊的來源 (URL)**。
實際數值 (API 版本、SKU、區域等) 不記錄於此。
在產生 Bicep 之前，務必擷取下列 URL 以核實最新資訊。

---

## 1. Bicep API 版本 (務必擷取)

按服務劃分的 MS 文件 Bicep 參考資料。使用前請從這些 URL 核實最新的穩定 apiVersion。

| 服務 | MS 文件 URL |
|---------|-------------|
| CognitiveServices (Foundry/OpenAI) | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.cognitiveservices/accounts |
| AI Search | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.search/searchservices |
| 儲存體帳號 (Storage Account) | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.storage/storageaccounts |
| Key Vault | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.keyvault/vaults |
| 虛擬網路 (Virtual Network) | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.network/virtualnetworks |
| 私人端點 (Private Endpoints) | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.network/privateendpoints |
| 私人 DNS 區域 (Private DNS Zones) | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.network/privatednszones |
| Fabric | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.fabric/capacities |
| Data Factory | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.datafactory/factories |
| Application Insights | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.insights/components |
| ML 工作區 (中樞) | https://learn.microsoft.com/zh-tw/azure/templates/microsoft.machinelearningservices/workspaces |

> **務必也核實子資源**：子資源 (如 `accounts/projects`, `accounts/deployments`, `privateDnsZones/virtualNetworkLinks`) 的 API 版本可能與其父項不同。請從父項頁面跟隨子資源連結進行核實。

### 未列於上表的服務

上表僅包含 v1 範圍內的服務。對於其他服務，請按此格式建構 URL 並擷取：
```
https://learn.microsoft.com/zh-tw/azure/templates/microsoft.{提供者}/{資源類型}
```

---

## 2. 模型可用性 (使用 Foundry/OpenAI 模型時必要)

核實模型名稱在目標區域是否可部署。請勿依賴靜態知識。

| 核實方法 | URL / 指令 |
|--------------------|---------------|
| MS 文件的模型可用性頁面 | https://learn.microsoft.com/zh-tw/azure/ai-services/openai/concepts/models |
| Azure CLI (針對現有資源) | `az cognitiveservices account list-models --name "<名稱>" --resource-group "<資源群組>" -o table` |

> 若模型在目標區域不可用 → 通知使用者，並建議可用的區域或替代模型。未經使用者核准請勿替換。

---

## 3. 私人端點對照 (新增服務時)

PE groupId 與 DNS 區域對照可能會被 Azure 變更。在新增服務或需要核實時：

| 核實方法 | URL |
|--------------------|-----|
| PE DNS 整合官方文件 | https://learn.microsoft.com/zh-tw/azure/private-link/private-endpoint-dns |

> `service-gotchas.md` 中的關鍵服務對照是穩定的，但在新增服務時務必從上述 URL 重新核實。

---

## 4. 服務區域可用性

核實特定服務在特定區域是否可用：

| 核實方法 | URL |
|--------------------|-----|
| Azure 按區域劃分的服務可用性 | https://azure.microsoft.com/zh-tw/explore/global-infrastructure/products-by-region/ |

---

## 5. Azure 更新 (次要參考)

下列來源僅供**參考**。主要來源一律為 MS 官方文件。

| 來源 | URL | 目的 |
|--------|-----|---------|
| Azure 更新 (Updates) | https://azure.microsoft.com/zh-tw/updates/ | 瞭解服務變更 |
| Azure 的新功能 | 各項服務的文件「新功能」頁面 | 核實功能變更 |

---

## 決策規則：何時需要擷取 (Fetch)？

| 資訊類型 | 是否務必擷取？ | 理由 |
|-----------------|-------------|-----------|
| API 版本 | **務必擷取** | 變動頻繁；錯誤的數值會導致部署失敗 |
| 模型可用性 (名稱, 區域) | **務必擷取** | 視區域而定且變動頻繁 |
| SKU 列表 | **務必擷取** | 可能隨服務變更 |
| 區域可用性 | **務必擷取** | 各項服務的區域支援變動頻繁。務必核實使用者指定的區域是否支援該服務 |
| PE groupId 與 DNS 區域 | v1 關鍵服務可參考 `service-gotchas.md`；**新增服務或複雜組態 (如 Monitor 等) 則務必擷取** | 關鍵服務對照雖穩定，但新服務或複雜服務具有風險 |
| 必要屬性模式 | 優先參考檔案 | 近乎不可變 (如 isHnsEnabled 等) |
