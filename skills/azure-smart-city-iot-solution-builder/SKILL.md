---
name: azure-smart-city-iot-solution-builder
description: '設計並規劃端對端 Azure IoT 與智慧城市解決方案：需求、架構、安全性、維運、成本，以及包含具體實作成品的階段性交付計劃。'
---

# Azure 智慧城市 IoT 解決方案建置器

使用此技能來重建並標準化 Azure IoT 與智慧城市解決方案的完整工作流程。

## 何時使用

當使用者詢問以下內容時，請使用此技能：

- 「我想在 Azure 上建置一個 IoT 解決方案」
- 「用於交通、照明或廢棄物處理的智慧城市架構」
- 「我該如何連接裝置、分析和警示？」
- 「我需要一個城市平台的藍圖和待辦清單」

## 目標

- 將高階構想轉換為可部署的架構。
- 盡可能重複使用現有的 Azure 專屬技能。
- 產生團隊可以實作的具體成品。

## 工作流程

### 0) 強制性文件檢閱 (在任何架構設計之前)

在提出涉及邊緣運算的架構或技術決策之前，請先檢閱 Azure IoT Edge 文件：

- https://learn.microsoft.com/azure/iot-edge/

最少需檢閱的頁面：

- 什麼是 Azure IoT Edge
- 執行階段架構
- 支援的系統
- 版本歷程記錄/版本說明
- 適用於該場景的 Linux/Windows 快速入門

如果無法諮詢文件，請明確說明這一點，並以清楚標註的假設繼續進行。

### 1) 範圍與限制

收集並確認：

- 城市領域：行動力、停車、空氣品質、水資源、能源、公共安全、廢棄物處理等。
- 規模：裝置數量、遙測頻率、保留期、區域。
- 延遲與可用性目標。
- 法規與隱私限制。
- 欲整合的現有系統 (SCADA、GIS、ERP、售票系統、API)。

### 2) 能力地圖

將平台拆分為多層：

- 裝置與邊緣：入網、身分、韌體、OTA、邊緣處理。
- 擷取與傳訊：指令與控制、事件路由、緩衝。
- 資料與分析：熱路徑 vs 冷路徑、儀表板、歷程分析。
- 維運：觀測性、事故流程、SLO。
- 控管：RBAC、秘密、原則、網路隔離。

### 3) Azure 服務選擇 (參考)

- 裝置連線：Azure IoT Hub、Azure IoT Operations、IoT Edge。
- 事件串流：Event Hubs、Service Bus、Event Grid。
- 儲存：Blob Storage、Data Lake、Cosmos DB、SQL。
- 分析：Azure Data Explorer、Stream Analytics、Fabric/Synapse。
- API 與應用程式：API Management、App Service、Container Apps、Functions。
- 監控：Azure Monitor、Application Insights、Log Analytics。
- 安全性：Key Vault、Defender for IoT、私人端點、受控識別。

### 4) 非功能性設計

定義並記錄：

- 可靠性模型 (區域/區域性、重試、無效信件處理、重播)。
- 安全控制 (零信任、加密、秘密輪轉、最小權限)。
- 成本控制 (保留層級、調整規模、自動縮放、工作負載排程)。
- 資料生命週期 (原始、處理、彙總、封存)。

### 5) 交付計劃

建立分階段執行：

- 階段 1：試點區域或單一使用案例。
- 階段 2：多領域整合。
- 階段 3：城市規模的推出與最佳化。

針對每個階段，包含：

- 結束準則
- 相依性
- 風險與緩解措施
- KPI 組合

## 優先重複使用其他技能

技能有兩個來源：

- 執行階段提供的技能 (此存放庫之外)：僅在 Copilot 主機環境公開時可用。
- 本機存放庫技能 (此存放庫)：作為 `skills/` 下的本機檔案提供。

### 執行階段提供的 Azure 技能 (選填)

如果執行環境中有提供，請委派給這些特化技能以獲取更深入的指引：

- `azure-kubernetes`
- `azure-messaging`
- `azure-observability`
- `azure-storage`
- `azure-rbac`
- `azure-cost`
- `azure-validate`
- `azure-deploy`

### 本機存放庫替代方案 (在此存放庫中使用)

當執行階段技能不可用時，優先使用此存放庫中的現有本機技能：

- `azure-architecture-autopilot` 用於架構產生與精煉。
- `azure-resource-visualizer` 用於資源關係圖。
- `azure-role-selector` 用於角色選擇指引。
- `az-cost-optimize` 和 `azure-pricing` 用於成本與價格分析。
- `azure-deployment-preflight` 用於部署前檢查。
- `appinsights-instrumentation` 用於遙測檢測模式。

如果沒有特化技能可用，請繼續使用此技能並保持假設明確。

## 必要輸出成品

務必提供以下輸出：

1. 智慧城市解決方案摘要 (範圍、假設、限制)。
2. 參考架構 (元件與資料流)。
3. 安全與控管檢查清單。
4. 成本與擴展策略。
5. 分階段實作待辦清單 (長篇故事 (epic) 與里程碑)。

## 輸出範本

使用此回應結構：

1. 背景與目標
2. 建議架構
3. 技術決策與權衡
4. 安全、維運與成本控制
5. 分階段實作計劃
6. 風險與待解決問題

## 指引

- 在驗證前提條件之前，不要直接跳到部署。
- 對於關鍵的城市工作負載，不要建議單一區域生產。
- 不要遺漏維運負責權 (誰處理事故、SLA、變更時段)。
- 清楚區分假設與已證實的事實。
