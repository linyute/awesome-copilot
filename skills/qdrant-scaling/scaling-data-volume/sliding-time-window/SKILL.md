---
name: qdrant-sliding-time-window
description: "指導 Qdrant 中的滑動時間視窗縮放。當有人問「只有最近的資料才重要」、「如何使舊向量過期」、「基於時間的資料旋轉」、「如何高效地刪除舊資料」、「社交媒體動態搜尋」、「新聞搜尋」、「帶保留期限的日誌搜尋」或「如何僅保留過去 N 個月的資料」時，請使用此技能。"
---

# 使用滑動時間視窗進行縮放

當只有最近的資料需要快速搜尋時使用 — 例如社交媒體貼文、新聞文章、支援票證、日誌、職缺列表。舊資料要麼變得無關緊要，要麼可以忍受較慢的存取速度。

三種策略：**分片旋轉 (shard rotation)** (推薦做法)、**集合旋轉 (collection rotation)** (當每個時段的組態不同時) 以及 **過濾並刪除 (filter-and-delete)** (最簡單，用於持續清理)。


## 分片旋轉 (推薦做法)

適用於：資料具有自然的時間邊界 (每日、每週、每月)。這是首選，因為查詢可以在單個請求中跨越所有時間段，而不需要應用程式層級的分散式分發 (fan-out)。[使用者定義分片](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/?s=user-defined-sharding)

1. 建立一個啟用了使用者定義分片的集合
2. 每個時間段建立一個分片鍵 (例如：`2025-01`、`2025-02`、...、`2025-06`)
3. 將資料擷取到目前時段的分片鍵中
4. 當新時段開始時，建立一個新的分片鍵並重新導向寫入
5. 刪除保留視窗之外的最舊分片鍵

- 刪除分片鍵可以立即回收所有資源 (無碎片，無優化器開銷)
- 在旋轉前預先建立下一個時段的分片鍵，以避免寫入中斷
- 在查詢時使用 `shard_key_selector` 僅搜尋特定時段以提高效率
- 分片鍵可以放置在特定的節點上，以實現冷熱分層


## 集合旋轉 (別名交換)

適用於：您需要為每個時段進行特定的集合組態 (例如：不同的量化或儲存設定)。[集合別名](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=collection-aliases)

1. 每個時間段建立一個集合，將一個寫入別名指向最新建立的集合
2. 平行查詢所有活躍的集合，並在用戶端合併結果
3. 當新時段開始時，建立新集合並交換寫入別名 [切換集合](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=switch-collection)
4. 刪除視窗之外的最舊集合

與分片旋轉相比的權衡：允許各個集合之間的組態差異，但需要應用程式層級的分散式分發以及更多的維運開銷。


## 過濾並刪除

適用於：資料持續到達且沒有明確的時間邊界，或者您希望使用最簡單的設定。

1. 在每個點上儲存一個 `timestamp` Payload，並對其建立 Payload 索引 [Payload 索引](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=payload-index)
2. 在查詢時使用 `range` 條件過濾到所需的視窗 [範圍過濾器](https://search.qdrant.tech/md/documentation/search/filtering/?s=range)
3. 定期使用依過濾器刪除的功能來刪除過期的點 [刪除點](https://search.qdrant.tech/md/documentation/manage-data/points/?s=delete-points)

- 在離峰時段分批執行清理 (1 萬到 5 萬個點)，以避免優化器鎖定
- 刪除並非沒有代價：標記為刪除 (tombstoned) 的點會降低搜尋效能，直到優化器壓縮區段為止
- 不會立即回收磁碟空間 (壓縮是非同步的)


## 冷熱分層

適用於：最近的資料需要快速的記憶體內搜尋，較舊的資料應保持可搜尋但效能較低。

- **分片旋轉：** 將目前的分片鍵放置在快速儲存節點上，透過分片放置功能將較舊的分片鍵移至較便宜的節點。所有查詢仍透過單個集合進行。
- **集合旋轉：** 將目前的集合保留在 RAM 中 (`always_ram: true`)，將較舊的集合移至 mmap/磁碟上的向量儲存。[量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/)


## 應避免的做法

- 對於每日有數百萬次刪除的高流量時間序列，不要使用過濾並刪除 (應改用旋轉)
- 不要忘記為時間戳記欄位建立索引 (無索引的範圍過濾會導致全表掃描)
- 當分片旋轉就足夠時，不要使用集合旋轉 (不必要的發散複雜度)
- 在驗證其時段已完全超出保留視窗之前，不要捨棄分片鍵或集合
- 不要跳過預先建立下一個時段的分片鍵或集合 (旋轉期間的寫入失敗很難恢復)
