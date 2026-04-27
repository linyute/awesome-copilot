---
name: qdrant-minimize-latency
description: "指導 Qdrant 查詢延遲優化。當有人問「搜尋很慢」、「如何降低延遲」、「p99 太高」、「尾部延遲 (tail latency)」、「單次查詢太慢」、「如何讓搜尋更快」或「延遲突增」時，請使用此技能。"
---

# 縮放以降低查詢延遲

單次查詢的延遲是由查詢執行路徑中最慢的元件決定的。它有時與吞吐量相關，但不總是如此 — 吞吐量和延遲是相反的調優方向。

低延遲優化旨在為單次查詢利用最大的資源飽和度，而吞吐量優化則旨在最小化單次查詢的資源使用量，以允許更多平行查詢。

## 調優效能以獲得較低延遲

- 增加區段數量以匹配 CPU 核心數 (`default_segment_number: 16`) [最小化延遲](https://search.qdrant.tech/md/documentation/operations/optimize/?s=minimizing-latency)
- 將量化向量和 HNSW 保留在 RAM 中 (`always_ram=true`)
- 在查詢時減少 `hnsw_ef` (以精確度/召回率換取速度) [搜尋參數](https://search.qdrant.tech/md/documentation/operations/optimize/?s=fine-tuning-search-parameters)
- 使用本機 NVMe 磁碟，避免使用網路連接儲存

## 記憶體壓力與延遲

RAM 是影響延遲最關鍵的資源。如果工作集超過可用 RAM，作業系統快取置換 (cache eviction) 會導致嚴重且持續的延遲惡化。

- 優先垂直擴充 RAM。如果工作集 >80%，則此操作至關重要。
- 使用量化：純量量化 (減少 4 倍) 或二進位量化 (減少 16 倍) [量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/)
- 如果過濾不頻繁，請將 Payload 索引移至磁碟 [磁碟 Payload 索引](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=on-disk-payload-index)
- 設定 `optimizer_cpu_budget` 以限制背景優化所使用的 CPU
- 排程索引編製：在離峰時段設定較高的 `indexing_threshold`


## 針對延遲進行垂直縮放

更多的 RAM 和更快的 CPU 會直接降低延遲。請參閱 [垂直縮放](../scaling-data-volume/vertical-scaling/SKILL.md) 以獲取節點大小設定指南。


## 應避免的做法

- 不要期望在同一個節點上同時優化延遲和吞吐量
- 對於延遲敏感的工作負載，不要使用少數大型區段 (每個區段搜尋所需的時間更長)
- 不要在 RAM 使用率 >90% 的情況下執行 (快取置換會導致嚴重的延遲惡化，且可能持續數天)
- 在效能除錯期間不要忽略優化器狀態
- 在沒有進行負載測試的情況下不要縮減 RAM 規模 (快取置換會導致長達數天的延遲事件)
