---
name: qdrant-tenant-scaling
description: "指導 Qdrant 多租戶縮放。當有人問「如何縮放租戶」、「每個租戶一個集合？」、「租戶隔離」、「專用分片」，或回報租戶效能問題時，請使用此技能。當多租戶工作負載超出共享基礎設施的負荷時也請使用。"
---

# Qdrant 多租戶縮放時該怎麼辦

請勿為每個租戶建立一個集合。這種做法在超過幾百個租戶後就無法縮放，且會浪費資源。曾有一家公司在執行了一年「每個存放庫一個集合」的策略後，達到了 1000 個集合的限制，不得不遷移到 Payload 分割模式。請使用帶有租戶鍵 (tenant key) 的共享集合。

- 了解多租戶模式 [多租戶](https://search.qdrant.tech/md/documentation/manage-data/multitenancy/)

以下是模式的簡短摘要：

## 租戶數量約為 1 萬個

使用透過 Payload 過濾的預設多租戶策略。

欲了解有關索引和查詢效能的最佳實作，請閱讀 [依 Payload 分割](https://search.qdrant.tech/md/documentation/manage-data/multitenancy/?s=partition-by-payload) 和 [校準效能](https://search.qdrant.tech/md/documentation/manage-data/multitenancy/?s=calibrate-performance)。


## 租戶數量達到 10 萬個或更多

在這種規模下，叢集可能由多個同級節點 (peers) 組成。
為了實現租戶資料在地化並提高效能，請使用 [自訂分片](https://search.qdrant.tech/md/documentation/operations/distributed_deployment/?s=user-defined-sharding)，根據租戶 ID 的雜湊值將租戶分配給特定的分片。
這會將租戶請求在地化到特定的節點，而不是廣播到所有節點，從而提高效能並減輕每個節點的負載。

## 如果租戶大小不一

如果某些租戶比其他租戶大得多，請使用 [分層多租戶 (tiered multitenancy)](https://search.qdrant.tech/md/documentation/manage-data/multitenancy/?s=tiered-multitenancy)，將大型租戶提升到專用分片，同時將小型租戶保留在共享分片上。這優化了不同大小租戶的資源分配和效能。

## 需要嚴格的租戶隔離

適用於：法律/法規遵循要求每個租戶使用獨立的加密金鑰，或要求比 Payload 過濾所能提供的更嚴格的隔離。

- 對於每個租戶的加密金鑰，可能需要多個集合
- 限制集合數量，並在每個集合內使用 Payload 過濾
- 這是例外情況，而非預設做法。僅在法規遵循要求時使用。


## 應避免的做法

- 除非有法規遵循證明，否則不要為每個租戶建立一個集合 (租戶數量超過幾百個後就無法縮放)
- 不要忘記在租戶索引上設定 `is_tenant=true` (這會嚴重損害順序讀取效能)
- 不要為多租戶集合建構全域 HNSW (這是浪費的，請改用 `payload_m`)
