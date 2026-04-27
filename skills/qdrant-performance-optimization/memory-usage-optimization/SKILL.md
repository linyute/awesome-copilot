---
name: qdrant-memory-usage-optimization
description: "診斷並減少 Qdrant 記憶體使用量。當有人回報「記憶體太高」、「RAM 持續增長」、「節點崩潰」、「記憶體不足 (OOM)」、「記憶體洩漏」，或詢問「為什麼記憶體使用量這麼高？」、「如何減少 RAM？」時，請使用此技能。在記憶體與計算不符、量化沒有幫助或節點在恢復期間崩潰時也請使用。"
---

# 了解記憶體使用量

Qdrant 運作時使用兩種類型的記憶體：

- 駐留記憶體 (Resident memory)（又稱 RSSAnon）- 用於內部資料結構（如 ID 追蹤器）的記憶體，以及必須保留在 RAM 中的元件，例如當 `always_ram=true` 時的量化向量和 Payload 索引。

- 作業系統分頁快取 (OS page cache) - 用於快取磁碟讀取的記憶體，可以根據需要釋放。原始向量通常儲存在分頁快取中，因此如果 RAM 已滿，服務不會崩潰，但效能可能會下降。

作業系統分頁快取佔用所有可用 RAM 是正常現象，但如果駐留記憶體超過總 RAM 的 80%，則是出現問題的徵兆。

## 記憶體使用量監控

- Qdrant 透過 `/metrics` 端點公開記憶體使用量。請參閱 [監控文件](https://search.qdrant.tech/md/documentation/operations/monitoring/)。

<!-- ToDo: 一旦 API 可用，討論每個元件的記憶體使用量 -->


## Qdrant 需要多少記憶體？

最佳記憶體使用量取決於案例。

- 對於一般搜尋情境，[容量規劃文件](https://search.qdrant.tech/md/documentation/operations/capacity-planning/) 中提供了通用指南。

關於大規模記憶體使用量的詳細明細，請參閱 [大規模搜尋記憶體使用量範例](https://search.qdrant.tech/md/documentation/tutorials-operations/large-scale-search/?s=memory-usage)。

Payload 索引和 HNSW 圖形也需要記憶體，以及向量本身，因此在計算中考慮它們非常重要。

此外，Qdrant 需要一些額外的記憶體用於優化。在優化期間，優化後的區段會完全載入 RAM，因此預留足夠的緩衝空間非常重要。
`max_segment_size` 越大，需要的緩衝空間就越多。


### 何時將 HNSW 索引存放在磁碟上

將頻繁使用的元件（如 HNSW 索引）放在磁碟上可能會導致嚴重的效能下降。
然而，在某些情境下，這可能是一個不錯的選擇：

- 具有低延遲磁碟的部署 - 本機 NVMe 或類似磁碟。
- 多租戶部署，其中只有一部分租戶被頻繁存取，因此一次只有一小部分資料和索引載入到 RAM 中。
- 對於啟用了 [內嵌儲存 (inline storage)](https://search.qdrant.tech/md/documentation/operations/optimize/?s=inline-storage-in-hnsw-index) 的部署。


## 如何最小化記憶體佔用空間

主要的挑戰是將那些鮮少存取的資料部分放在磁碟上。
以下是達成此目標的主要技術：

- 使用量化來僅在 RAM 中儲存壓縮向量 [量化文件](https://search.qdrant.tech/md/documentation/manage-data/quantization/)

- 使用 float16 或 int8 資料型別將向量的記憶體使用量分別減少 2 倍或 4 倍，但會在精確度上有所權衡。欲了解更多關於向量資料型別的資訊，請參閱 [文件](https://search.qdrant.tech/md/documentation/manage-data/vectors/?s=datatypes)。

- 利用 Matryoshka 表徵學習 (Matryoshka Representation Learning, MRL) 僅在 RAM 中儲存小向量，同時將大向量保留在磁碟上。關於如何將 MRL 與 Qdrant Cloud 推論結合使用的範例：[MRL 文件](https://search.qdrant.tech/md/documentation/inference/?s=reduce-vector-dimensionality-with-matryoshka-models)。

- 對於具有小型租戶的多租戶部署，向量可以存放在磁碟上，因為同一個租戶的資料是儲存在一起的 [多租戶文件](https://search.qdrant.tech/md/documentation/manage-data/multitenancy/?s=calibrate-performance)。

- 對於具有快速本機儲存且對搜尋吞吐量要求相對較低的部署，可以將向量儲存的所有元件存放在磁碟上。欲了解更多關於磁碟儲存效能影響的資訊，請參閱 [文章](https://qdrant.tech/articles/memory-consumption/)。

- 對於低 RAM 環境，請考慮 `async_scorer` 組態，它啟用了對 `io_uring` 平行磁碟存取的支援，這可以顯著提高磁碟儲存的效能。欲了解更多關於 `async_scorer` 的資訊，請參閱 [文章](https://qdrant.tech/articles/io_uring/)（僅在 Linux 核心 5.11+ 上可用）。

- 考慮將稀疏向量 (Sparse Vectors) 和文字 Payload 存放在磁碟上，因為它們通常比密集向量對磁碟更友善。
- 組態 Payload 索引存放在磁碟上 [文件](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=on-disk-payload-index)
- 組態稀疏向量索引存放在磁碟上 [文件](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=sparse-vector-index)
