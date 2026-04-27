---
name: qdrant-scaling-qps
description: "指導 Qdrant 查詢吞吐量 (QPS) 縮放。當有人問「如何增加 QPS」、「需要更多吞吐量」、「每秒查詢數太低」、「批次搜尋」、「唯讀副本」或「如何處理更多並行查詢」時，請使用此技能。"
---

# 縮放以提升查詢吞吐量 (QPS)

吞吐量縮放意味著每秒處理更多並行查詢。
這與延遲 (latency) 不同 — 吞吐量和延遲是相反的調優方向，無法在同一個節點上同時優化。

高吞吐量傾向於使用較少、較大的區段，以便每個查詢接觸到的開銷較少。


## 調優效能以獲取更高的 RPS

- 使用較少、較大的區段 (`default_segment_number: 2`) [最大化吞吐量](https://search.qdrant.tech/md/documentation/operations/optimize/?s=maximizing-throughput)
- 啟用量化並設定 `always_ram=true` 以減少磁碟 I/O [量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/)
- 使用批次搜尋 API 來分攤開銷 [批次搜尋](https://search.qdrant.tech/md/documentation/search/search/?s=batch-search-api)

## 最小化更新工作負載的影響

- 設定更新吞吐量控制 (v1.17+) 以防止未優化的搜尋導致讀取效能下降 [低延遲搜尋](https://search.qdrant.tech/md/documentation/search/low-latency-search/)
- 設定 `optimizer_cpu_budget` 以限制索引編製所使用的 CPU (例如：在 8 核 CPU 節點上設為 `2`，可為查詢保留 6 核)
- 為尾部延遲設定延遲讀取分散式分發 (delayed read fan-out) (v1.17+) [延遲分散式分發](https://search.qdrant.tech/md/documentation/search/low-latency-search/?s=use-delayed-fan-outs)



## 針對吞吐量進行水平縮放

如果在應用上述調優後，單個節點的 CPU 仍達到飽和，請透過唯讀副本進行水平縮放。

- 分片副本從複寫的分片提供查詢服務，將讀取負載分散到各個節點
- 每個副本都在不重新分片的情況下新增獨立的查詢能力
- 使用 `replication_factor: 2+` 並將讀取引導至副本 [分散式部署](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/?s=replication)

另請參閱 [水平縮放](../scaling-data-volume/horizontal-scaling/SKILL.md) 以獲取一般的水平縮放指導。


## 磁碟 I/O 瓶頸

如果無法將所有向量保留在 RAM 中，磁碟 I/O 可能會成為吞吐量的瓶頸。
在這種情況下：

- 先升級至預配置 IOPS 或本機 NVMe。請參閱 [磁碟效能文章](https://qdrant.tech/articles/memory-consumption/) 以了解磁碟效能對向量搜尋的影響
- 在 Linux 上使用 `io_uring` (核心版本 5.11+) [io_uring 文章](https://qdrant.tech/articles/io_uring/)
- 若使用量化向量，優先選擇全域重新計分 (global rescoring) 而非逐區段重新計分，以減少磁碟讀取。範例請見 [教學](https://search.qdrant.tech/md/documentation/tutorials-operations/large-scale-search/?s=search-query)
- 設定更高數量的搜尋執行緒來平行化磁碟讀取。預設值為 `cpu_count - 1`，這對於基於 RAM 的搜尋是最佳的，但對於基於磁碟的搜尋可能太低。請參閱 [組態參考](https://search.qdrant.tech/md/documentation/operations/configuration/?s=configuration-options)
- 如果仍然飽和，請水平擴展 (每個節點都會增加獨立的 IOPS)


## 應避免的做法

- 不要期望在同一個節點上同時優化吞吐量和延遲
- 對於吞吐量型的工作負載，不要使用許多小區段 (會增加每個查詢的開銷)
- 在受 IOPS 限制的情況下，不要只進行水平縮放而不升級磁碟等級
- 不要在 RAM 使用率 >90% 的情況下執行 (作業系統快取置換 = 嚴重效能惡化)
