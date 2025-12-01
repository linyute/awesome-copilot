---
agent: 'agent'
description: '分析應用程式所用的 Azure 資源（IaC 檔案及/或目標資源群組中的資源），並最佳化成本——針對發現的最佳化項目建立 GitHub issue。'
---

# Azure 成本最佳化

此工作流程會分析基礎架構即程式碼（IaC）檔案與 Azure 資源，產生成本最佳化建議。針對每個最佳化機會建立獨立的 GitHub issue，並建立一個 EPIC issue 以協調執行，讓成本節省工作能高效追蹤與執行。

## 先決條件
- 已設定並驗證 Azure MCP 伺服器
- 已設定並驗證 GitHub MCP 伺服器
- 已指定目標 GitHub 儲存庫
- 已部署 Azure 資源（IaC 檔案非必要但有助益）
- 優先使用 Azure MCP 工具（`azmcp-*`），如無則用 Azure CLI

## 工作流程步驟

### 步驟 1：取得 Azure 最佳實踐
**動作**：分析前先取得成本最佳化最佳實踐
**工具**：Azure MCP 最佳實踐工具
**流程**：
1. **載入最佳實踐**：
   - 執行 `azmcp-bestpractices-get` 取得最新 Azure 最佳化指引。此指引未必涵蓋所有情境，但可作為基礎。
   - 盡量以這些實踐指引後續分析與建議
   - 在最佳化建議中引用 MCP 工具輸出或一般 Azure 文件的最佳實踐

### 步驟 2：發現 Azure 基礎架構
**動作**：動態發現並分析 Azure 資源與設定
**工具**：Azure MCP 工具 + Azure CLI 備用 + 本地檔案系統存取
**流程**：
1. **資源發現**：
   - 執行 `azmcp-subscription-list` 取得可用訂閱
   - 執行 `azmcp-group-list --subscription <subscription-id>` 取得資源群組
   - 取得相關群組內所有資源清單：
     - 用 `az resource list --subscription <id> --resource-group <name>`
   - 各資源類型優先用 MCP 工具，無則 CLI 備用：
     - `azmcp-cosmos-account-list --subscription <id>` - Cosmos DB 帳戶
     - `azmcp-storage-account-list --subscription <id>` - 儲存體帳戶
     - `azmcp-monitor-workspace-list --subscription <id>` - Log Analytics 工作區
     - `azmcp-keyvault-key-list` - Key Vault
     - `az webapp list` - Web Apps（備用）
     - `az appservice plan list` - App Service Plans（備用）
     - `az functionapp list` - Function Apps（備用）
     - `az sql server list` - SQL Servers（備用）
     - `az redis list` - Redis Cache（備用）
     - ...其他資源類型同理

2. **IaC 偵測**：
   - 用 `file_search` 掃描 IaC 檔案：「**/*.bicep」、「**/*.tf」、「**/main.json」、「**/*template*.json」
   - 解析資源定義以了解預期設定
   - 與已發現資源比對，找出差異
   - 註明 IaC 檔案存在以利後續建議
   - 請勿使用其他儲存庫檔案，僅限 IaC 檔案。其他檔案不具權威性。
   - 若未找到 IaC 檔案，請停止並回報未發現 IaC 檔案。

3. **設定分析**：
   - 擷取各資源目前 SKU、層級與設定
   - 辨識資源間關聯與相依
   - 繪製資源使用模式（如有）

### 步驟 3：收集使用量指標並驗證現有成本
**動作**：收集使用量資料並驗證實際資源成本
**工具**：Azure MCP 監控工具 + Azure CLI
**流程**：
1. **尋找監控來源**：
   - 用 `azmcp-monitor-workspace-list --subscription <id>` 找 Log Analytics 工作區
   - 用 `azmcp-monitor-table-list --subscription <id> --workspace <name> --table-type "CustomLog"` 找可用資料

2. **執行使用量查詢**：
   - 用 `azmcp-monitor-log-query` 執行預設查詢：
     - 查詢：「recent」取得近期活動模式
     - 查詢：「errors」取得錯誤級日誌
   - 自訂分析可用 KQL 查詢：
   ```kql
   // App Services CPU 使用率
   AppServiceAppLogs
   | where TimeGenerated > ago(7d)
   | summarize avg(CpuTime) by Resource, bin(TimeGenerated, 1h)
   
   // Cosmos DB RU 使用量  
   AzureDiagnostics
   | where ResourceProvider == "MICROSOFT.DOCUMENTDB"
   | where TimeGenerated > ago(7d)
   | summarize avg(RequestCharge) by Resource
   
   // 儲存體帳戶存取模式
   StorageBlobLogs
   | where TimeGenerated > ago(7d)
   | summarize RequestCount=count() by AccountName, bin(TimeGenerated, 1d)
   ```

3. **計算基準指標**：
   - CPU/記憶體平均使用率
   - 資料庫吞吐量模式
   - 儲存體存取頻率
   - Function 執行率

4. **驗證現有成本**：
   - 依步驟 2 發現的 SKU/層級設定
   - 於 https://azure.microsoft.com/pricing/ 查詢現行 Azure 價格，或用 `az billing` 指令
   - 記錄：資源 → 現有 SKU → 預估月費
   - 計算現實月總費用後再進行建議

### 步驟 4：產生成本最佳化建議
**動作**：分析資源找出最佳化機會
**工具**：本地分析已收集資料
**流程**：
1. **依資源類型套用最佳化模式**：
   
   **運算最佳化**：
   - App Service Plans：依 CPU/記憶體使用率調整規模
   - Function Apps：低用量時 Premium → Consumption 計畫
   - 虛擬機：縮減過大實例
   
   **資料庫最佳化**：
   - Cosmos DB：
     - 固定型 → 無伺服器，適合變動工作負載
     - 依實際用量調整 RU/s
   - SQL Database：依 DTU 使用率調整服務層級
   
   **儲存體最佳化**：
   - 實施生命週期政策（熱 → 冷 → 歸檔）
   - 合併重複儲存體帳戶
   - 依存取模式調整儲存層級
   
   **基礎架構最佳化**：
   - 移除未用/重複資源
   - 有效處用自動擴展
   - 排程非生產環境

2. **計算有憑據的節省金額**：
   - 現有成本 → 目標成本 = 節省金額
   - 記錄現有與目標設定的價格來源

3. **計算建議優先分數**：
   ```
   優先分數 = (價值分數 × 月節省金額) / (風險分數 × 實作天數)
   
   高優先：分數 > 20
   中優先：分數 5-20
   低優先：分數 < 5
   ```

4. **驗證建議**：
   - 確認 Azure CLI 指令正確
   - 驗證節省金額計算
   - 評估實作風險與前置條件
   - 所有節省計算均需有佐證

### 步驟 5：使用者確認
**動作**：呈現摘要並取得同意後才建立 GitHub issue
**流程**：
1. **顯示最佳化摘要**：
   ```
   🎯 Azure 成本最佳化摘要
   
   📊 分析結果：
   • 分析資源總數：X
   • 現有月費：$X 
   • 潛在月節省：$Y 
   • 最佳化機會：Z
   • 高優先項目：N
   
   🏆 建議：
   1. [資源]：[現有 SKU] → [目標 SKU] = $X/月節省 - [風險等級] | [實作工時]
   2. [資源]：[現有設定] → [目標設定] = $Y/月節省 - [風險等級] | [實作工時]
   3. [資源]：[現有設定] → [目標設定] = $Z/月節省 - [風險等級] | [實作工時]
   ...依此類推
   
   💡 將建立：
   • Y 個獨立 GitHub issue（每項最佳化一個）
   • 1 個 EPIC issue 協調執行
   
   ❓ 是否繼續建立 GitHub issue？(y/n)
   ```

2. **等待使用者確認**：僅在使用者同意後才繼續

### 步驟 6：建立獨立最佳化 issue
**動作**：針對每個最佳化機會建立獨立 GitHub issue，標記「cost-optimization」（綠色）、「azure」（藍色）。
**MCP 工具需求**：每項建議用 `create_issue`
**流程**：
1. **依下列範本建立獨立 issue**：

   **標題格式**：`[COST-OPT] [資源類型] - [簡要說明] - $X/月節省`
   
   **內容範本**：
   ```markdown
   ## 💰 成本最佳化：[簡要標題]
   
   **月節省金額**：$X | **風險等級**：[低/中/高] | **實作工時**：X 天
   
   ### 📋 說明
   [清楚說明最佳化內容與必要性]
   
   ### 🔧 實作
   
   **偵測到 IaC 檔案**：[是/否 - 依 file_search 結果]
   
   ```bash
   # 若有 IaC 檔案：顯示 IaC 修改與部署
   # 檔案：infrastructure/bicep/modules/app-service.bicep
   # 變更：sku.name: 'S3' → 'B2'
   az deployment group create --resource-group [rg] --template-file infrastructure/bicep/main.bicep
   
   # 若無 IaC 檔案：直接 Azure CLI 指令 + 警告
   # ⚠️ 未發現 IaC 檔案。如有其他位置，請優先修改。
   az appservice plan update --name [plan] --sku B2
   ```
   
   ### 📊 佐證
   - 現有設定：[細節]
   - 使用模式：[監控資料佐證]
   - 成本影響：$X/月 → $Y/月
   - 最佳實踐對齊：[如適用，引用 Azure 最佳實踐]
   
   ### ✅ 驗證步驟
   - [ ] 非生產環境測試
   - [ ] 確認無效能下降
   - [ ] 於 Azure 成本管理確認費用降低
   - [ ] 更新監控與警示（如需）
   
   ### ⚠️ 風險與注意事項
   - [風險 1 與緩解]
   - [風險 2 與緩解]
   
   **優先分數**：X | **價值**：X/10 | **風險**：X/10
   ```

### 步驟 7：建立 EPIC 協調 issue
**動作**：建立追蹤所有最佳化工作的主 issue。標記「cost-optimization」（綠色）、「azure」（藍色）、「epic」（紫色）。
**MCP 工具需求**：EPIC 用 `create_issue`
**關於 mermaid 原理圖**：請確認 mermaid 語法正確，並依無障礙指引建立原理圖（樣式、顏色等）。
**流程**：
1. **建立 EPIC issue**：

   **標題**：`[EPIC] Azure 成本最佳化計畫 - $X/月潛在節省`
   
   **內容範本**：
   ```markdown
   # 🎯 Azure 成本最佳化 EPIC
   
   **潛在總節省**：$X/月 | **執行時程**：X 週
   
   ## 📊 執行摘要
   - **分析資源數**：X
   - **最佳化機會**：Y  
   - **潛在月節省總額**：$X
   - **高優先項目**：N
   
   ## 🏗️ 現有架構概覽
   
   ```mermaid
   graph TB
       subgraph "Resource Group: [name]"
           [產生的架構原理圖，顯示現有資源與成本]
       end
   ```
   
   ## 📋 執行追蹤
   
   ### 🚀 高優先（優先執行）
   - [ ] #[issue-number]：[標題] - $X/月節省
   - [ ] #[issue-number]：[標題] - $X/月節省
   
   ### ⚡ 中優先 
   - [ ] #[issue-number]：[標題] - $X/月節省
   - [ ] #[issue-number]：[標題] - $X/月節省
   
   ### 🔄 低優先（可有可無）
   - [ ] #[issue-number]：[標題] - $X/月節省
   
   ## 📈 進度追蹤
   - **已完成**：Y 項最佳化中的 0 項
   - **已實現節省**：$0 / $X/月
   - **執行狀態**：尚未開始
   
   ## 🎯 成功標準
   - [ ] 所有高優先最佳化已執行
   - [ ] 已實現節省 >80%
   - [ ] 未發現效能下降
   - [ ] 成本監控儀表板已更新
   
   ## 📝 備註
   - 完成 issue 後請更新本 EPIC
   - 監控實際與預估節省
   - 建議定期進行成本最佳化檢討
   ```

## 錯誤處理
- **成本驗證**：若節省估算缺乏佐證或與 Azure 價格不符，請重新驗證設定與價格來源
- **Azure 驗證失敗**：請提供手動 Azure CLI 設定步驟
- **未發現資源**：建立資訊性 issue 通知 Azure 資源尚未部署
- **GitHub 建立失敗**：將格式化建議輸出至主控台
- **使用量資料不足**：註明限制並僅提供設定型建議

## 成功標準
- ✅ 所有成本估算均依實際資源設定與 Azure 價格驗證
- ✅ 每項最佳化均建立獨立 issue（可追蹤與分派）
- ✅ EPIC issue 提供完整協調與追蹤
- ✅ 所有建議均含具體可執行 Azure CLI 指令
- ✅ 優先分數有助於 ROI 導向執行
- ✅ 架構原理圖忠實反映現況
- ✅ 使用者確認避免不必要的 issue 建立
