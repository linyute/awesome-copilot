---
name: qdrant-indexing-performance-optimization
description: "診斷並修正 Qdrant 索引編製與資料擷取緩慢的問題。當有人回報「上傳很慢」、「索引花了很久時間」、「優化器卡住」、「HNSW 建構時間太長」或「資料已上傳但搜尋結果不佳」時，請使用此技能。在優化器狀態顯示錯誤、區段無法合併或遇到索引門檻問題時也請使用。"
---

# Qdrant 索引編製太慢時該怎麼辦

Qdrant 「不會」立即建構 HNSW 索引。小區段在超過 `indexing_threshold_kb` (預設：20 MB) 之前會使用暴力搜尋。在此期間搜尋較慢是刻意設計的，並非程式錯誤。

- 了解索引優化器 [索引優化器](https://search.qdrant.tech/md/documentation/operations/optimizer/?s=indexing-optimizer)


## 上傳/擷取太慢

適用於：上傳 (upload) 或更新 (upsert) API 呼叫速度緩慢。
辨識瓶頸：用戶端 (網路、分批處理) 對比伺服器端 (CPU、磁碟 I/O)

針對用戶端，優化分批處理與平行處理：

- 使用批次更新 (每次請求 64-256 個點) [Points API](https://search.qdrant.tech/md/documentation/manage-data/points/?s=upload-points)
- 使用 2-4 個平行上傳串流

針對伺服器端，優化 Qdrant 組態與索引策略：

- 建立更多分片 (3-12 個)，每個分片都有獨立的更新背景工作執行序 [分片](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/?s=sharding)
- 在 HNSW 建構前建立 Payload 索引 (可過濾的向量索引所需) [Payload 索引](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=payload-index)

適用於大型資料集的初始大量載入：

- 在大量載入期間停用 HNSW (將 `indexing_threshold_kb` 設為極高值，之後再恢復) [集合參數](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=update-collection-parameters)
- 透過設定 `m=0` 來停用 HNSW 是舊有的做法，請改用較大的 `indexing_threshold_kb`

請注意，快速且未編列索引的上傳可能會暫時使用更多 RAM，並在優化器趕上進度之前降低搜尋效能。

請參閱 https://search.qdrant.tech/md/documentation/tutorials-develop/bulk-upload/


## 優化器卡住或花費太長時間

適用於：優化器執行數小時、未完成。

- 透過 optimizations 端點 (v1.17+) 檢查實際進度 [優化監控](https://search.qdrant.tech/md/documentation/operations/optimizer/?s=optimization-monitoring)
- 大型合併與 HNSW 重建在大型資料集上確實需要數小時
- 檢查 CPU 與磁碟 I/O (HNSW 屬於 CPU 密集型，合併屬於 I/O 密集型，HDD 無法勝任)
- 如果 `optimizer_status` 顯示錯誤，請檢查記錄以查看磁碟是否已滿或區段是否損壞


## HNSW 建構時間太長

適用於：HNSW 索引建構佔據了總索引時間的絕大部分。

- 減少 `m` (預設 16，適用於大多數情況，鮮少需要 32+) [HNSW 參數](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=vector-index)
- 減少 `ef_construct` (100-200 即足夠) [HNSW 組態](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=indexing-vectors-in-hnsw)
- 保持 `max_indexing_threads` 與 CPU 核心數成比例 [組態設定](https://search.qdrant.tech/md/documentation/operations/configuration/)
- 使用 GPU 進行索引 [GPU 索引](https://search.qdrant.tech/md/documentation/operations/running-with-gpu/)

## 多租戶集合的 HNSW 索引

如果您有一個多租戶案例，其中所有資料都由某個 Payload 欄位 (例如：`tenant_id`) 分隔，您可以避免建構全域 HNSW 索引，而是依靠 `payload_m` 僅為資料子集建構 HNSW 索引。
跳過全域 HNSW 索引可以顯著減少索引編製時間。

詳情請參閱 [多租戶集合](https://search.qdrant.tech/md/documentation/manage-data/multitenancy/)。

## 額外的 Payload 索引太慢

Qdrant 為所有 Payload 索引建構額外的 HNSW 連結，以確保過濾後的向量搜尋品質不會下降。
某些 Payload 索引 (例如：帶有長文本的 `text` 欄位) 每個點可能具有非常大量的唯一值，這可能導致長久的 HNSW 建構時間。

您可以針對特定的 Payload 索引停用建構額外的 HNSW 連結，轉而依靠略慢的查詢時策略，如 ACORN。

欲了解更多關於停用額外 HNSW 連結的資訊，請參閱 [文件](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=disable-the-creation-of-extra-edges-for-payload-fields)

欲了解更多關於 ACORN 的資訊，請參閱 [文件](https://search.qdrant.tech/md/documentation/search/search/?s=acorn-search-algorithm)


## 應避免的做法

- 不要在建構 HNSW 「之後」才建立 Payload 索引 (會破壞可過濾的向量索引)
- 不要對現有集合的大量上傳使用 `m=0`，這可能會丟棄現有的 HNSW 並導致長時間的重新索引
- 不要一次上傳一個點 (每次請求的開銷會佔主導地位)
