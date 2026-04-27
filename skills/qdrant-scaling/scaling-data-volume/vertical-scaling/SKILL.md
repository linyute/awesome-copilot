---
name: qdrant-vertical-scaling
description: "指導 Qdrant 垂直縮放決策。當有人問「如何擴充節點」、「需要更多 RAM」、「升級節點大小」、「垂直縮放」、「調整叢集大小」、「垂直擴充與水平擴充的對比」，或者是目前的節點記憶體/CPU 不足時，請使用此技能。當使用者想要避免水平縮放的複雜性時也請使用。"
---

# Qdrant 需要垂直縮放時該怎麼辦

垂直縮放 (Vertical scaling) 意味著增加現有節點上的 CPU、RAM 或磁碟，而不是增加更多節點。這是考慮水平縮放之前的建議第一步。垂直縮放較簡單，可以避免分散式系統的複雜性，且是可逆的。

- Qdrant Cloud 的垂直縮放是透過 [Qdrant Cloud 主控台](https://cloud.qdrant.io/) 進行的
- 對於自行代管的部署，請調整底層虛擬機器 (VM) 或容器的資源

## 何時進行垂直縮放

適用於：目前節點資源 (RAM, CPU, 磁碟) 不足，但工作負載尚未需要進行分散式部署。

- RAM 使用率接近可用記憶體的 80% (開始發生作業系統分頁快取置換，效能會嚴重下降)
- 查詢服務或索引編製期間 CPU 達到飽和
- 磁碟空間不足以存放磁碟上的向量和 Payload
- 單個節點最多可以處理約 1 億個向量，具體取決於維度和量化情況
- 適用於對單點故障有容忍度且不要求高可用性的非生產工作負載


## 如何在 Qdrant Cloud 中進行垂直縮放

垂直縮放是透過 Qdrant Cloud 主控台管理的。

- 登入 [Qdrant Cloud 主控台](https://cloud.qdrant.io/) 或使用 [CLI 工具](https://github.com/qdrant/qcloud-cli)
- 選擇要調整大小的叢集
- 選擇較大的節點組態 (更多 RAM、CPU，或兩者兼具)
- 如果已配置複寫，升級過程將涉及無停機時間的滾動重啟
- 在調整大小前，請確保 `replication_factor: 2` 或更高，以在滾動重啟期間維持可用性

**重要事項：** 擴大規模很簡單。縮減規模需要謹慎 — 如果縮減後工作集 (working set) 不再能容納在 RAM 中，效能會因為快取置換而嚴重下降。在縮減規模前請務必進行負載測試。


## RAM 大小設定指南

RAM 是 Qdrant 效能最關鍵的資源。請使用以下指南來設定正確的大小。

- 精確估計 RAM 使用量很困難；請使用此簡單的近似公式：在 RAM 中存放全精度向量時，計算方式為 `num_vectors * dimensions * 4 bytes * 1.5`
- 使用純量量化 (scalar quantization)：除以 4 (INT8 將每個 float32 減少到 1 個位元組) [量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/)
- 使用二進位量化 (binary quantization)：除以 32 [二進位量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/?s=binary-quantization)
- 加入 HNSW 索引 (~向量資料的 20-30%)、Payload 索引和 WAL 的開銷
- 預留 20% 的緩衝空間用於優化器操作和作業系統快取
- 在調整大小前後透過 Grafana/Prometheus 監控實際使用情況 [監控](../../../qdrant-monitoring/SKILL.md)


## 當垂直縮放不再足夠時

辨識以下這些該轉向水平縮放的訊號：

- 資料量超過單個節點即使使用量化和 mmap 也無法容納的程度
- IOPS 飽和 (更多節點 = 更多獨立的磁碟 I/O)
- 需要容錯能力 (需要跨節點複寫)
- 需要透過專用分片實現租戶隔離
- 單節點 CPU 已達極限且查詢延遲無法接受
- 下一個垂直縮放步驟是目前可用的最大節點大小。您可能需要能夠暫時擴充到更大的節點大小以進行批次作業或恢復。如果您已經處於最大節點大小，您將無法執行此操作。

當您達到這些限制時，請參閱 [水平縮放](../horizontal-scaling/SKILL.md) 以獲取有關分片和節點規劃的指導。


## 應避免的做法

- 在未先進行負載測試前不要縮減 RAM 規模 (快取置換 = 嚴重延遲惡化，且可能持續數天)
- 不要忽略 80% RAM 門檻 (這是一個效能懸崖，而非逐漸下降)
- 在 Cloud 中調整大小前不要跳過複寫設定 (無副本的滾動重啟 = 停機)
- 在竭盡垂直縮放選項前不要跳到水平縮放 (會增加永久性的維運複雜度)
- 不要假設更多 CPU 總是有幫助 (受 IOPS 限制的工作負載不會因為更多核心而改善)
