---
name: qdrant-search-quality-diagnosis
description: "診斷 Qdrant 搜尋品質問題。當有人回報「結果不佳」、「結果不對」、「結果不相關」、「遺漏匹配項」、「召回率 (recall) 太低」、「近似搜尋比精確搜尋差」、「哪種嵌入模型 (embedding model)」或「量化後品質下降」時，請使用此技能。當搜尋品質在無明顯變更的情況下下降時也請使用。"
---

# 如何診斷搜尋品質不佳的問題

在調優之前，請先建立基準。使用精確 KNN 作為真實基準值 (ground truth)，並與近似 HNSW 進行比較。生產環境的目標應設為召回率 (recall)@K > 95%。

## 還不知道哪裡出錯了

適用於：搜尋結果不相關或遺漏預期的匹配項，且您需要隔離原因。

- 測試時設定 `exact=true` 以繞過 HNSW 近似演算法 [搜尋 API](https://search.qdrant.tech/md/documentation/tutorials-search-engineering/retrieval-quality/?s=standard-mode-vs-exact-search)
- 精確搜尋不佳 = 模型或搜尋管線 (pipeline) 的問題。精確搜尋良好但近似搜尋不佳 = 需調優 HNSW。
- 檢查量化是否降低了品質 (比較量化前後的差異)
- 檢查過濾器是否過於嚴格 (如果是，您可能需要使用 ACORN)
- 如果切塊文件產生重複結果，使用 Grouping API 進行去重 [分組 (Grouping)](https://search.qdrant.tech/md/documentation/search/search/?s=grouping-api)

Payload 過濾與稀疏向量 (sparse vector) 搜尋是兩回事。中繼資料 (metadata)（日期、類別、標籤）存放在 Payload 中用於過濾。文字內容則存放在稀疏向量中用於搜尋。

## 近似搜尋比精確搜尋差

適用於：精確搜尋回傳良好結果，但 HNSW 近似演算法遺漏了它們。

- 在查詢時增加 `hnsw_ef` [搜尋參數](https://search.qdrant.tech/md/documentation/operations/optimize/?s=fine-tuning-search-parameters)
- 增加 `ef_construct` (高品質建議 200+) [HNSW 組態](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=vector-index)
- 增加 `m` (預設 16，高召回率建議 32) [HNSW 組態](https://search.qdrant.tech/md/documentation/manage-data/indexing/?s=vector-index)
- 在量化時啟用超取樣 (oversampling) + 重新計分 (rescore) [搭配量化進行搜尋](https://search.qdrant.tech/md/documentation/manage-data/quantization/?s=searching-with-quantization)
- 針對過濾查詢使用 ACORN (v1.16+) [ACORN](https://search.qdrant.tech/md/documentation/search/search/?s=acorn-search-algorithm)

二進位量化「需要」重新計分。若不執行，品質損失會非常嚴重。請使用超取樣 (針對二進位建議至少 3-5 倍) 來恢復召回率。在進入生產環境前，務必針對您的資料測試量化的影響。[量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/)

## 嵌入模型錯誤

適用於：精確搜尋回傳的結果同樣不佳。

針對 100-1000 個樣本查詢測試前 3 名的 MTEB 模型，衡量召回率@10。領域特定模型通常優於通用模型。[代管式推論](https://search.qdrant.tech/md/documentation/inference/)

## 未經優化的搜尋管線

適用於：精確搜尋回傳的結果同樣不佳，且使用者已確認模型選擇。

根據進階搜尋策略技能來優化搜尋。

## 應避免的做法

- 在確認模型適合該任務前先調優 Qdrant (大多數品質問題其實是模型問題)
- 使用二進位量化卻不重新計分 (會導致嚴重的品質損失)
- 將 `hnsw_ef` 設定得低於請求的結果數量 (保證召回率不佳)
- 跳過對過濾欄位建立 Payload 索引卻歸咎於品質問題 (HNSW 無法穿越被過濾掉的節點，且只有在預先設定 Payload 索引後才會建構可過濾的 HNSW)
- 在沒有基準召回率或其他搜尋相關性指標的情況下部署 (無法衡量退化情況)
- 混淆 Payload 過濾與稀疏向量搜尋 (兩者用途不同，組態也不同)
