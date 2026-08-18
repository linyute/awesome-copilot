---
name: 'azure-well-architected-review'
description: '對目前工作負載 IaC 和架構執行 Azure 架構完善架構 (Well-Architected Framework) 審查，產生調查結果並建立 GitHub 議題以進行改進。'
---

# Azure 架構完善審查 (Azure Well-Architected Review)

此工作流程針對您工作負載的 IaC 檔案與已部署的基礎結構執行結構化的 Azure 架構完善架構 (WAF) 審查。它可識別所有 5 個 WAF 支柱中的風險，並建立 GitHub 議題以追蹤補救措施。

## 先決條件
- 已設定並通過驗證的 Azure CLI (`az`)
- 存放庫中存在 IaC 檔案（Bicep、Terraform 或 ARM 範本）
- 已設定並通過驗證的 GitHub MCP 伺服器

## 工作流程步驟

### 步驟 1：載入架構完善架構參考資料
擷取最新的 Azure WAF 最佳做法：
- `https://learn.microsoft.com/en-us/azure/well-architected/`
- 使用中 Azure 服務的服務指南 (`https://learn.microsoft.com/en-us/azure/well-architected/service-guides/`)
- 與工作負載類型（SaaS、關鍵任務、AI 等）相關的專屬指引

如果 `microsoft.docs.mcp` MCP 伺服器可用，請使用它來查詢最新的支柱檢查清單和服務專屬建議。

### 步驟 2：探索 IaC 與架構
建立審查範圍，然後清點程式碼和即時環境：

1. **確認 Azure 範圍**：詢問使用者哪些訂用帳戶/資源群組在範圍內，或從 IaC 參數推斷並確認。
2. **掃描存放庫中的 IaC 檔案**：
   - Bicep：`**/*.bicep`、`bicepconfig.json`
   - Terraform：`**/*.tf`（azurerm/azapi 提供者）
   - ARM 範本：`**/azuredeploy*.json`、`**/*.template.json`、包含 `deploymentTemplate` 的 `$schema` 檔案
3. **清點即時資源**（始終執行，即使存在 IaC）：`az resource list --resource-group <rg> --output json`（或全訂用帳戶範圍），加上針對支柱檢查所需設定細節的目標 `az <service> show` 呼叫。
4. **比較 IaC 與即時清單**：標記漂移 (drift) — 存在於 Azure 中但 IaC 中不存在的資源（透過入口網站建立）、在 IaC 中定義但未部署的資源，以及設定不相符的情況。記錄步驟 3 的漂移調查結果（它們通常對應至「卓越營運」支柱）。

識別使用中的關鍵 Azure 服務（運算、資料、網路、安全性、可觀測性）並產生 Mermaid 架構圖。

### 步驟 3：逐一支柱審查

#### 支柱 1：可靠性 (Reliability)
- [ ] 區域性服務已啟用可用性區域（VM、VMSS、AKS 節點集區、App Service、SQL、儲存體 ZRS）
- [ ] 生產環境 SKU 支援所需的 SLA（關鍵路徑上沒有 Basic/Free 層級）
- [ ] Azure SQL / Cosmos DB 備份與時間點還原已設定適當的保留期
- [ ] 在 RPO 需要的地方設定異地備援（GRS/RA-GRS 儲存體、SQL 容錯移轉群組、Cosmos DB 多區域）
- [ ] 為 App Service 方案、VMSS、AKS 設定自動調整規則（生產環境沒有固定的單一執行個體）
- [ ] 在 Load Balancer / Application Gateway / Front Door 後端設定健康探查
- [ ] 為 Service Bus 佇列/訂用帳戶和 Event Grid 訂用帳戶啟用寄不出的信件處理 (Dead-lettering)
- [ ] 實作具有指數退避的重試原則以處理暫時性錯誤
- [ ] 定義災害復原計劃（記載 RTO/RPO，經測試的容錯移轉）

#### 支柱 2：安全性 (Security)
- [ ] 使用受控識別而非帶有機密或連接字串的服務主體
- [ ] IaC 或程式碼中沒有寫死的認證、金鑰或連接字串
- [ ] 機密儲存在 Azure Key Vault 中並採用 RBAC 授權（而非存取原則）
- [ ] 儲存體帳戶拒絕公用 Blob 存取，並在可能的情況下禁止共用金鑰存取
- [ ] 適用於 PaaS 資料服務的私人端點（或至少服務端點 + 防火牆規則）
- [ ] NSG 將輸入流量限制在最低所需連接埠/CIDR（沒有 `*` → `*` 允許規則）
- [ ] 所有端點強制執行 TLS 1.2+（`minimumTlsVersion`、`httpsOnly`）
- [ ] Azure RBAC 遵循最小權限（工作負載身分識別在訂用帳戶範圍內沒有 Owner/Contributor 權限）
- [ ] 在相關資源類型上啟用 Microsoft Defender for Cloud (`az security pricing list`)
- [ ] 為面向公眾的 Web 端點設定 Azure WAF（Application Gateway 或 Front Door）
- [ ] 診斷設定將安全性記錄傳送至 Log Analytics / Microsoft Sentinel

#### 支柱 3：成本最佳化 (Cost Optimization)
- [ ] 針對穩定狀態運算（VM、App Service、SQL）評估保留或節省計劃
- [ ] 儲存體生命週期管理原則將 Blob 移至非經常性/封存層
- [ ] 根據實際使用率調整適當大小的 SKU（沒有過大的 VM/App Service 方案）
- [ ] 開發/測試環境使用自動關機排程，並在符合條件時使用 Dev/Test 價格
- [ ] 設定 Azure 預算與成本警示 (`az consumption budget list`)
- [ ] 識別並移除未連結的受控磁碟與孤立的公用 IP
- [ ] 針對尖峰或低用量工作負載使用取用/無伺服器層（Functions、Container Apps、SQL 無伺服器）
- [ ] 調整 Log Analytics 保留期與資料上限設定，以避免資料擷取超額

#### 支柱 4：卓越營運 (Operational Excellence)
- [ ] 所有基礎結構均定義為 IaC（無手動入口網站變更；在可行情況下拒絕指派或套用原則）
- [ ] 跨所有資源套用一致的標記策略（擁有者、環境、成本中心）
- [ ] 為關鍵指標與服務健康狀態定義 Azure Monitor 警示
- [ ] 具備自動化部署管道（GitHub Actions / Azure Pipelines，無手動部署）
- [ ] Azure 活動記錄與資源診斷設定路由至 Log Analytics
- [ ] 為應用程式工作負載檢測 Application Insights（或 OpenTelemetry 等效工具）
- [ ] Azure Policy 指派強制執行組織標準（允許的位置、SKU、標籤）
- [ ] 具備 Runbook 或維運文件

#### 支柱 5：效能效率 (Performance Efficiency)
- [ ] 根據負載需求驗證適當大小的運算 SKU
- [ ] 在有益的地方實作快取（Azure Cache for Redis、CDN/Front Door 快取）
- [ ] 使用 Azure Front Door 或 CDN 進行全域靜態內容交付
- [ ] 根據負載指標自動調整，而非固定執行個體數量
- [ ] 資料庫效能層級適當（DTU vs vCore、彈性集區、Cosmos DB RU 自動調整）
- [ ] 將進階/區域備援儲存體用於延遲敏感的磁碟工作負載
- [ ] 為資料庫和 HTTP 用戶端使用連線集區和非同步模式

### 步驟 4：風險分類
針對每個調查結果，分類為：
- **高風險 (High Risk)**：安全性弱點、單點故障、無備份/復原
- **中風險 (Medium Risk)**：可靠性次佳、成本效率低下、效能疑慮
- **低風險 (Low Risk)**：偏離最佳做法、次要最佳化機會

### 步驟 5：使用者確認

```
🏗️ Azure 架構完善審查摘要

📊 審查結果：
• 已分析的 IaC 檔案：X
• 已識別的 Azure 服務：Y
• 總調查結果數：Z
  • 高風險：A（需立即採取行動）
  • 中風險：B（應儘快解決）
  • 低風險：C（有益的改進項）

🔴 最高優先級高風險調查結果：
1. [支柱]：[調查結果] — [重要原因]
2. [支柱]：[調查結果] — [重要原因]

💡 這將建立 Z 個個別 GitHub 議題 + 1 個 EPIC 議題。

❓ 是否繼續建立 GitHub 議題？(y/n)
```

**關卡**：僅在使用者給出明確肯定回覆（例如 "y"、"yes"）時才繼續進行步驟 6–7。若回覆為否定、模糊或缺失，**不要**建立任何 GitHub 議題 — 將完整的調查結果以格式化的 Markdown 輸出到主控台並停止。

### 步驟 6：建立個別調查結果議題
加上 "well-architected" 和支柱名稱標籤（例如 "security"、"reliability"）。

**標題**：`[WAF-<PILLAR>] [簡要調查結果] — [風險等級]`

**內文**：
````markdown
## 🏗️ 架構完善調查結果：[簡要標題]

**支柱**：[名稱] | **風險等級**：[高/中/低] | **工作量**：[低/中/高]

### 📋 說明
[對調查結果及其重要性的清楚說明]

### 🔧 補救措施

**IaC 修復**（偏好）：
```bicep
// Bicep 範例
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}
```

**Azure CLI 備用方案**：
```bash
az storage account update --name <name> --resource-group <rg> \
  --min-tls-version TLS1_2 --allow-blob-public-access false --https-only true
```

### 📚 Azure 參考資料
- [WAF 最佳做法連結]
- [Microsoft Learn 文件連結]

### ✅ 驗證
- [ ] 變更已在 IaC 中實作並部署
- [ ] Azure Policy 合規性通過（若適用）
- [ ] Microsoft Defender for Cloud 建議已解決（若適用）

**架構完善建議**：[此項目對應的 WAF 檢查清單項目]
````

### 步驟 7：建立 EPIC 追蹤議題
加上 "well-architected" 和 "epic" 標籤。

**標題**：`[EPIC] Azure 架構完善審查 — 涵蓋 5 大支柱的 X 項調查結果`

**內文**：執行摘要，包含支柱細分表格（依支柱和風險等級分類的調查結果計數）、Mermaid 架構圖、連結所有個別議題的優先順序檢查清單（高 → 中 → 低），以及成功標準：
- 所有高風險調查結果均已解決
- 中風險調查結果具有已接受的緩解計劃
- 現有 Azure Monitor 警示或 Azure Policy 合規性無退步

## 錯誤處理
- **找不到 IaC 檔案**：透過 Azure CLI (`az resource list`) 將審查限制在即時資源探索，並記錄缺口
- **Azure 權限不足**：列出審查所需的唯讀角色（讀取者、安全性讀取者）
- **GitHub 建立失敗**：將所有調查結果以格式化的 Markdown 輸出至主控台

## 成功標準
- ✅ 針對 IaC 和即時基礎結構審查了所有 5 個 WAF 支柱
- ✅ 所有調查結果均按風險等級和支柱進行分類
- ✅ 針對每個調查結果提供具備 IaC 範例的可行補救步驟
- ✅ 建立 GitHub 議題以供團隊追蹤
- ✅ 產生用於 EPIC 上下文的架構圖
- ✅ 包含 Microsoft Learn 文件參考資料
