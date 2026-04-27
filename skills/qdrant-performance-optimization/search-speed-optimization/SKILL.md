---
name: qdrant-search-speed-optimization
description: "診斷並修正 Qdrant 搜尋緩慢的問題。當有人回報「搜尋很慢」、「高延遲」、「查詢花費太長時間」、「QPS 過低」、「吞吐量過低」、「過濾搜尋很慢」或「搜尋原本很快現在變慢」時，請使用此技能。在組態變更或資料增長導致搜尋效能下降時也請使用。"
---

# 診斷問題

搜尋效能下降可能有幾種原因。最常見的原因包括：

* 記憶體壓力：如果工作集 (working set) 超過可用 RAM
* 複雜請求 (例如：高 `hnsw_ef`、無 Payload 索引的複雜過濾條件)
* 正在競爭資源的背景程序 (例如：大量上傳後優化器仍在執行)
* 叢集問題 (例如：網路問題、硬體退化)


## 單次查詢太慢 (延遲)

適用於：無論負載如何，單次查詢都花費太長時間。

### 診斷步驟：

- 檢查相同請求的第二次執行是否明顯更快 (表示有記憶體壓力)
- 嘗試使用 `with_payload: false` 和 `with_vectors: false` 執行相同的查詢，以判斷 Payload 擷取是否為瓶頸
- 如果請求使用了過濾器，嘗試逐一移除過濾器，以判斷特定的過濾條件是否為瓶頸

### 常見修正方案：

- 微調 HNSW 參數：[微調搜尋](https://search.qdrant.tech/md/documentation/operations/optimize/?s=fine-tuning-search-parameters)
- 啟用記憶體內量化：[純量量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/?s=scalar-quantization)
- 使用 Matryoshka 模型減少向量維度：[Matryoshka 模型](https://search.qdrant.tech/md/documentation/inference/?s=reduce-vector-dimensionality-with-matryoshka-models)
- 針對高維度向量使用超取樣 (oversampling) + 重新計分 (rescore) [搭配量化進行搜尋](https://search.qdrant.tech/md/documentation/manage-data/quantization/?s=searching-with-quantization)
- 在 Linux 上針對磁碟負載重的任務啟用 io_uring [io_uring](https://qdrant.tech/articles/io_uring/)


## 無法處理足夠的 QPS (吞吐量)

適用於：系統在負載下無法提供足夠的每秒查詢數。

- 減少區段數量 (將 `default_segment_number` 設為 2) [最大化吞吐量](https://search.qdrant.tech/md/documentation/operations/optimize/?s=maximizing-throughput)
- 使用批次搜尋 API 取代單次查詢 [批次搜尋](https://search.qdrant.tech/md/documentation/search/search/?s=batch-search-api)
- 啟用量化以降低 CPU 成本 [純量量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/?s=scalar-quantization)
- 新增副本 (replicas) 以分散讀取負載 [複寫](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/?s=replication)


## 過濾搜尋很慢

適用於：過濾搜尋明顯慢於未過濾搜尋。這是除了記憶體之外，SA 最常收到的投訴。

- 在過濾欄位上建立 Payload 索引 [Payload 索引](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=payload-index)
- 針對主要的過濾條件使用 `is_tenant=true`：[租戶索引](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=tenant-index)
- 針對複雜過濾條件嘗試 ACORN 演算法：[ACORN](https://search.qdrant.tech/md/documentation/search/search/?s=acorn-search-algorithm)
- 避免使用 `nested` 過濾條件作為主要過濾器。它可能會強制 Qdrant 讀取原始 Payload 數值而非使用索引。
- 如果 Payload 索引是在建構 HNSW 之後才新增的，請觸發重新編制索引以建立可過濾的子圖連結。


## 搭配平行更新優化搜尋效能

### 診斷步驟

- 嘗試使用 `indexed_only=true` 參數執行相同的查詢，如果查詢速度明顯加快，表示優化器仍在執行中且尚未索引所有區段。
- 如果即使沒有查詢，CPU 或 IO 使用率也很高，這也表示優化器正在執行。

### 建議的組態變更

- 降低 `optimizer_cpu_budget` 以為查詢預留更多 CPU
- 使用 `prevent_unoptimized=true` 來防止為搜尋建立包含大量未索引資料的區段。相反地，一旦區段達到所謂的 indexing_threshold，所有額外的點都將以「延遲狀態 (deferred state)」新增。

欲了解更多資訊，請參閱 [此處](https://search.qdrant.tech/md/documentation/search/low-latency-search/?s=query-indexed-data-only)。


## 應避免的做法

- 將量化的 `always_ram` 設為 `false` (每次搜尋都會導致磁碟大幅震盪)
- 針對對延遲敏感的生產環境將 HNSW 放在磁碟上 (僅適用於冷儲存)
- 為了吞吐量而增加區段數量 (相反：越少越好)
- 在每個欄位都建立 Payload 索引 (浪費記憶體)
- 在檢查優化器狀態之前指責 Qdrant
