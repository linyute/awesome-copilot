---
name: qdrant-monitoring-debugging
description: "使用指標和觀測工具診斷 Qdrant 生產環境問題。當有人回報「優化器卡住」、「索引太慢」、「記憶體太高」、「OOM 崩潰」、「查詢太慢」、「延遲突增」或「搜尋原本很快現在變慢」時，請使用此技能。在效能下降且無明顯組態變更時也請使用。"
---

# 如何使用指標偵錯 Qdrant

首先檢查優化器狀態。大多數生產環境問題都可以追溯到活躍的優化程序在爭奪資源。如果優化器正常，請檢查記憶體，然後是請求指標。


## 優化器卡住或太慢

適用於：優化器執行數小時、未完成或顯示錯誤。

- 使用 `/collections/{collection_name}/optimizations` 端點 (v1.17+) 檢查狀態 [優化監控](https://search.qdrant.tech/md/documentation/operations/optimizer/?s=optimization-monitoring)
- 查詢時可帶選用的詳細資料旗標：`?with=queued,completed,idle_segments`
- 回傳：已排入佇列的優化計數、活躍優化器類型、涉及的區段、進度追蹤
- 網頁 UI 有一個「Optimizations」索引標籤，包含時間軸檢視以及各項任務的持續時間指標 [Web UI](https://search.qdrant.tech/md/documentation/operations/optimizer/?s=web-ui)
- 如果集合資訊中 `optimizer_status` 顯示錯誤，請檢查記錄以查看磁碟是否已滿或區段是否損壞
- 大型合併和 HNSW 重建在大型資料集上確實需要數小時。在假設卡住前，請先檢查進度。


## 記憶體似乎太高

適用於：記憶體超出預期、節點因 OOM 崩潰或記憶體持續增長。

- 透過 `/metrics` 提供的程序記憶體指標（RSS、分配的位元組、分頁錯誤）
- Qdrant 使用兩種類型的 RAM：駐留記憶體 (resident memory)（又稱 RSSAnon，用於資料結構、量化向量）和作業系統分頁快取 (page cache)（快取的磁碟讀取）。分頁快取填滿可用 RAM 是正常現象。[記憶體文章](https://qdrant.tech/articles/memory-consumption/)
- 如果駐留記憶體 (RSSAnon) 超過總 RAM 的 80%，請進行調查
- 檢查 `/telemetry` 以獲取各個集合的點計數和向量組態明細
- 預估預期記憶體：向量部分為 `num_vectors * dimensions * 4 bytes * 1.5`，外加 Payload 和索引開銷 [容量規劃](https://search.qdrant.tech/md/documentation/operations/capacity-planning/)
- 導致非預期增長的常見原因：量化向量設定為 `always_ram=true`、Payload 索引過多、優化期間 `max_segment_size` 過大


## 查詢變慢

適用於：查詢速度比預期慢，且您需要找出原因。

- 追蹤每個端點的 `rest_responses_avg_duration_seconds` 和 `rest_responses_max_duration_seconds`
- 使用長條圖指標 `rest_responses_duration_seconds` (v1.8+) 在 Grafana 中進行百分位數分析
- 對等的 gRPC 指標帶有 `grpc_responses_` 前綴
- 先檢查優化器狀態。活躍的優化會爭奪 CPU 和 I/O，從而降低搜尋延遲。
- 透過集合資訊檢查區段數量。大量上傳後過多未合併的區段會導致搜尋變慢。
- 比較過濾後與未過濾的查詢時間。巨大差距表示缺少 Payload 索引。[Payload 索引](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=payload-index)


## 應避免的做法

- 在偵錯查詢變慢時忽略優化器狀態 (最常見的根源)
- 當分頁快取填滿 RAM 時假設有記憶體洩漏 (正常作業系統行為)
- 在優化器執行時進行組態變更 (會導致連鎖的重新優化)
- 在檢查大量載入是否剛剛完成前指責 Qdrant (未合併的區段)
