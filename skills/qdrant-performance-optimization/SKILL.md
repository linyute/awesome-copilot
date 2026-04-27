---
name: qdrant-performance-optimization
description: "優化 Qdrant 效能的不同技術，包括索引策略、查詢優化以及硬體考量。當您想要提高 Qdrant 部署的速度和效率時使用。"
allowed-tools:
  - Read
  - Grep
  - Glob
---


# Qdrant 效能優化

Qdrant 效能涉及不同面向，本文件作為導覽中心，引導您了解 Qdrant 效能優化的各個面向。


## 搜尋速度優化

搜尋速度有兩個不同的標準：延遲 (latency) 和吞吐量 (throughput)。
延遲是取得單次查詢回應所需的時間，而吞吐量是在給定時間範圍內可以處理的查詢數量。
根據您的案例，您可能希望優化其中一項或兩項指標。

關於搜尋速度優化的更多資訊，請參閱 [搜尋速度優化](search-speed-optimization/SKILL.md) 技能。


## 索引效能優化

Qdrant 需要建構向量索引以執行高效的相似性搜尋。建構索引所需的時間會根據您的資料集大小、硬體和組態而有所不同。

關於索引效能優化的更多資訊，請參閱 [索引效能優化](indexing-performance-optimization/SKILL.md) 技能。


## 記憶體使用量優化

向量搜尋可能是記憶體密集型的，特別是在處理大型資料集時。
Qdrant 具有彈性的記憶體管理系統，允許您精確控制哪些儲存部分保留在記憶體中，哪些儲存在磁碟上。這可以幫助您在不犧牲效能的情況下優化記憶體使用量。

關於記憶體使用量優化的更多資訊，請參閱 [記憶體使用量優化](memory-usage-optimization/SKILL.md) 技能。
