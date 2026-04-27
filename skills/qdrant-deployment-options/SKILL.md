---
name: qdrant-deployment-options
description: "指導 Qdrant 部署選擇。當有人問「如何部署 Qdrant」、「Docker 對比 Cloud」、「本機模式」、「嵌入式 Qdrant」、「Qdrant EDGE」、「哪種部署選項」、「自行代管對比雲端」或「需要最低延遲的部署」時，請使用此技能。在為新專案選擇部署類型時也請使用此技能。"
---

# 我需要哪種 Qdrant 部署方式？

從您的需求開始：受管理的維運還是完全的控制？網路延遲是否可以接受？生產環境還是製作原型？答案可以縮小到以下四個選項之一。


## 開始使用或製作原型

適用於：建構原型、執行測試、CI/CD 管線或學習 Qdrant。

- 使用本機模式 (僅限 Python)：零相依性、記憶體內或磁碟持久化，不需要伺服器 [本機模式](https://search.qdrant.tech/md/documentation/quickstart/)
- 本機模式的資料格式與伺服器「不」相容。請勿用於生產環境或基準測試。
- 若要在本機執行真實伺服器，請使用 Docker [快速入門](https://search.qdrant.tech/md/documentation/quickstart/?s=download-and-run)


## 進入生產環境 (自行代管)

適用於：您需要對基礎設施、資料落地或自訂組態有完全的控制。

- Docker 是預設的部署方式。具備完整的 Qdrant 開源功能集，設定最少。[快速入門](https://search.qdrant.tech/md/documentation/quickstart/?s=download-and-run)
- 您需自行負責維運：升級、備份、縮放、監控
- 必須手動為多節點叢集設定分散式模式 [分散式部署](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/)
- 若您希望在您的基礎設施上使用 Qdrant Cloud 的管理功能，請考慮混合雲 (Hybrid Cloud) [混合雲](https://search.qdrant.tech/md/documentation/hybrid-cloud/)


## 進入生產環境 (零維運)

適用於：您希望基礎設施受管理，具有零停機時間的更新、自動備份和重新分片 (resharding)，而不需要自己操作叢集。

- Qdrant Cloud 處理升級、縮放、備份和監控 [Qdrant Cloud](https://search.qdrant.tech/md/documentation/cloud-quickstart/)
- 自動支援跨版本升級
- 提供自行代管不具備的功能：`/sys_metrics`、受管理的重新分片、預先配置的警報


## 需要最低延遲

適用於：網路往返伺服器的延遲是不可接受的。邊緣裝置、程序內搜尋或對延遲極其敏感的應用程式。

- Qdrant EDGE：對 Qdrant 分片層級函式的程序內綁定，無網路開銷 [Qdrant EDGE](https://search.qdrant.tech/md/documentation/edge/edge-quickstart/)
- 與伺服器具有相同的資料格式。可以透過分片快照與伺服器同步。
- 僅支援單節點功能集。無分散式模式。


## 應避免的做法

- 將本機模式用於生產環境或基準測試 (未優化，資料格式不相容)
- 在沒有監控和備份策略的情況下自行代管 (您會遺失資料或錯過停機事件)
- 當您需要分散式搜尋時選擇 EDGE (僅限單節點)
- 除非有資料落地需求，否則不要挑選混合雲 (當 Qdrant Cloud 運作良好時，不必要的 Kubernetes 複雜性)
