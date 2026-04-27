---
name: qdrant-monitoring-setup
description: "指導 Qdrant 監控設定，包含 Prometheus 抓取、運作狀態探查 (health probes)、混合雲指標、警報和記錄集中化。當有人問「如何設定監控」、「Prometheus 組態」、「Grafana 儀表板」、「運作狀態檢查端點」、「如何抓取混合雲」、「要設定哪些警報」、「如何集中化記錄」或「稽核記錄」時，請使用此技能。"
---

# 如何設定 Qdrant 監控

先讓 Prometheus 抓取正常運作，然後是運作狀態探查，最後是警報。在進入生產環境之前，請勿跳過監控設定。


## Prometheus 指標

適用於：首次設定指標收集或新增部署。

- 節點指標位於 `/metrics` 端點 [監控文件](https://search.qdrant.tech/md/documentation/operations/monitoring/)
- 叢集指標位於 `/sys_metrics` (僅限 Qdrant Cloud)
- 透過 `service.metrics_prefix` 組態或 `QDRANT__SERVICE__METRICS_PREFIX` 環境變數自訂前綴
- 使用 Prometheus + Grafana 的自行代管設定範例 [prometheus-monitoring 存放庫](https://github.com/qdrant/prometheus-monitoring)


## 混合雲抓取 (Scraping)

適用於：執行 Qdrant 混合雲且需要叢集層級的可視性。

不要只抓取 Qdrant 節點。在混合雲中，您管理 Kubernetes 資料平面。您還必須抓取叢集匯出器 (cluster-exporter) 和操作員 (operator) pod，以獲取完整的叢集可視性和操作員狀態。

- 混合雲 Prometheus 設定教學 [混合雲 Prometheus](https://search.qdrant.tech/md/documentation/tutorials-and-examples/hybrid-cloud-prometheus/)
- 官方 Grafana 儀表板 [Grafana 儀表板存放庫](https://github.com/qdrant/qdrant-cloud-grafana-dashboard)


## 存活 (Liveness) 與就緒 (Readiness) 探查

適用於：組態 Kubernetes 運作狀態檢查。

- 使用 `/healthz`、`/livez`、`/readyz` 取得基本狀態、存活和就緒資訊 [Kubernetes 運作狀態端點](https://search.qdrant.tech/md/documentation/operations/monitoring/?s=kubernetes-health-endpoints)


## 警報

適用於：為生產環境或混合雲部署設定警報。

- 混合雲現成提供約 11 個預先配置的 Prometheus 警報 [雲端叢集監控](https://search.qdrant.tech/md/documentation/cloud/cluster-monitoring/)
- 使用 AlertmanagerConfig 根據標籤將警報路由到 Slack、PagerDuty 或其他目標
- 至少應針對以下項設定警報：優化器錯誤、節點未就緒、複製因子 (replication factor) 低於目標、磁碟使用率 >80%


## 記錄集中化與稽核記錄

適用於：企業法規遵循需要集中化記錄或稽核線索。

- 啟用 JSON 記錄格式以進行結構化分析：在組態中將 `logger.format` 設為 `json` [組態設定](https://search.qdrant.tech/md/documentation/operations/configuration/)
- 使用 FluentD/OpenSearch 進行記錄彙整
- 稽核記錄 (v1.17+) 寫入本機檔案系統 (`/qdrant/storage/audit/`)，而非標準輸出 (stdout)。掛載一個持久化磁碟區 (Persistent Volume) 並部署一個 sidecar 容器來追蹤 (tail) 這些檔案到標準輸出，以便 DaemonSets 可以收集它們。[稽核記錄](https://search.qdrant.tech/md/documentation/operations/security/?s=audit-logging)


## 應避免的做法

- 在自行代管版本中抓取 `/sys_metrics` (僅在 Qdrant Cloud 上提供)
- 在混合雲中僅抓取 Qdrant 節點 (會遺漏叢集匯出器和操作員指標)
- 在進入生產環境前跳過監控設定 (您會後悔的)
- 針對分頁快取記憶體使用量發出警報 (它本應填滿可用 RAM，這是正常的作業系統行為)
