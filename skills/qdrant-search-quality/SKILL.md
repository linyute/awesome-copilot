---
name: qdrant-search-quality
description: "診斷並改善 Qdrant 搜尋相關性。當有人回報「搜尋結果不佳」、「結果錯誤」、「精確度 (precision) 低」、「召回率 (recall) 低」、「不相關匹配」、「遺漏預期結果」，或詢問「如何改善搜尋品質？」、「哪種嵌入模型？」、「我應該使用混合搜尋嗎？」、「我應該使用重新排名嗎？」時，請使用此技能。當搜尋品質在量化、模型變更或資料增長後下降時也請使用。"
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Qdrant 搜尋品質

首先判斷問題是出在嵌入模型、Qdrant 組態，還是搜尋策略。大多數品質問題來自於模型或資料，而非 Qdrant 本身。如果搜尋品質低落，請在調整任何參數之前，檢查切塊 (chunks) 是如何傳遞給 Qdrant 的。在句子中間進行切分會導致品質下降 30-40%。

- 從測試精確搜尋開始，以隔離問題 [搜尋 API](https://search.qdrant.tech/md/documentation/search/search/?s=search-api)


## 診斷與調優

隔離品質問題的來源，調優 HNSW 參數，並選擇正確的嵌入模型。[診斷與調優](diagnosis/SKILL.md)


## 搜尋策略

混合搜尋、重新排名、相關性回饋以及用於改善結果品質的探索 API。[搜尋策略](search-strategies/SKILL.md)
