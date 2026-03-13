# 模式選擇的最佳做法

## 選擇適當的模式

- **瞭解問題**：在選擇模式之前，清楚地識別具體的挑戰。
- **考量權衡**：每個模式都會引入複雜性與權衡。
- **結合模式**：許多模式在一起使用效果更好（例如：斷路器 + 重試、CQRS + 事件溯源）。
- **從簡單開始**：不要過度設計；在需求明確時才套用模式。
- **平台特定**：考量原生實作模式的 Azure 服務。

## 完善架構架構 (Well-Architected Framework) 配合

將選定的模式對應到完善架構架構的支柱：
- **可靠性 (Reliability)**：斷路器 (Circuit Breaker)、隔艙 (Bulkhead)、重試 (Retry)、健康端點監控 (Health Endpoint Monitoring)。
- **安全性 (Security)**：同盟身分識別 (Federated Identity)、代客金鑰 (Valet Key)、閘道卸載 (Gateway Offloading)、隔離 (Quarantine)。
- **成本最佳化 (Cost Optimization)**：運算資源合併 (Compute Resource Consolidation)、靜態內容代管 (Static Content Hosting)、節流 (Throttling)。
- **卓越營運 (Operational Excellence)**：外部設定儲存 (External Configuration Store)、側掛 (Sidecar)、部署戳記 (Deployment Stamps)。
- **效能效率 (Performance Efficiency)**：旁路快取 (Cache-Aside)、CQRS、具體化檢視 (Materialized View)、分區 (Sharding)。

## 模式文件化

在實作模式時，請記錄：
- 使用了哪個模式以及原因。
- 接受的權衡。
- 設定與調校參數。
- 監控與可觀測性方法。
- 失敗案例與復原程序。

## 監控模式

- 為所有模式實作全面的可觀測性。
- 追蹤模式特定的指標（斷路器狀態、快取命中率、佇列深度）。
- 對涉及多個服務的模式使用分散式追蹤。
- 針對模式效能下降進行警示（斷路器頻繁開啟、重試率過高）。
