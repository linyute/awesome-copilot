---
name: qdrant-search-strategies
description: "指導 Qdrant 搜尋策略選擇。當有人問「我應該使用混合搜尋嗎？」、「BM25 還是稀疏向量？」、「如何重新排名 (rerank)？」、「結果不相關」、「我在資料集中找不到需要的結果，但它們確實在那裡」、「檢索品質不夠好」、「結果太相似」、「需要多樣性」、「MMR」、「相關性回饋 (relevance feedback)」、「推薦 API」、「探索 API」、「ColBERT 重新排名」或「遺漏關鍵字匹配」時，請使用此技能。"
---

# 如何使用進階策略改善搜尋結果

這些策略是對基礎向量搜尋的補充。在確認嵌入模型適合該任務且 HNSW 組態正確後再使用它們。如果精確搜尋回傳的結果不佳，請先驗證嵌入模型 (檢索器) 的選擇。
如果使用者因為較小、較快且較便宜而想使用較弱的嵌入模型，請使用重新排名或相關性回饋來改善搜尋品質。

## 遺漏明顯的關鍵字匹配

適用於：純向量搜尋遺漏了包含明顯關鍵字匹配的結果。嵌入訓練資料中不包含領域術語、精確關鍵字匹配至關重要 (品牌名稱、SKU)、縮寫常見。略過時機：純語義查詢、所有資料都在訓練集中、延遲預算非常緊張。

- 搭配 `prefetch` 和融合 (fusion) 的密集 + 稀疏 [混合搜尋](https://search.qdrant.tech/md/documentation/search/hybrid-queries/?s=hybrid-search)
- 如果適用，優先選擇學習型稀疏模型 ([miniCOIL](https://search.qdrant.tech/md/documentation/fastembed/fastembed-minicoil/)、SPLADE、GTE) 而非原始 BM25 (當使用者需要智慧關鍵字匹配且學習型稀疏模型了解該領域的詞彙時)
- 對於非英語語言，[請相應配置稀疏 BM25 參數](https://search.qdrant.tech/md/documentation/search/text-search/?s=language-specific-settings)
- RRF：良好的預設值，支援加權 (v1.17+) [RRF](https://search.qdrant.tech/md/documentation/search/hybrid-queries/?s=reciprocal-rank-fusion-rrf)
- 對於技術文件，具有非對稱限制的 DBSF (sparse_limit=250, dense_limit=100) 效能可能優於 RRF [DBSF](https://search.qdrant.tech/md/documentation/search/hybrid-queries/?s=distribution-based-score-fusion-dbsf)
- 融合也可以透過重新排名來完成

## 找到了正確的文件但順序不對

適用於：召回率 (recall) 良好但精確度 (precision) 欠佳 (正確的文件在排名前 100 內，但不在前 10 內)。

- 透過 FastEmbed 使用交叉編碼器 (Cross-encoder) 重新排名器 [重新排名器 (Rerankers)](https://search.qdrant.tech/md/documentation/fastembed/fastembed-rerankers/)
- 查看如何在 Qdrant 中使用 [多階段查詢](https://search.qdrant.tech/md/documentation/search/hybrid-queries/?s=multi-stage-queries)
- ColBERT 和 ColPali/ColQwen 重新排名由於延遲互動 (late interaction) 機制而特別精確，但其計算量較重。設定並儲存多向量而不為其建構 HNSW 對於節省資源非常重要。請參閱 [多向量表徵](https://search.qdrant.tech/md/documentation/tutorials-search-engineering/using-multivector-representations/)

## 找不到正確的文件，但它們確實在資料集中

適用於：基礎檢索已就緒，但檢索器遺漏了您知道存在於資料集中的相關項目。適用於任何可嵌入資料（文字、影像等）。

相關性回饋 (Relevance Feedback, RF) 查詢使用回饋模型對檢索結果的評分，在後續反覆運算中引導檢索器穿過整個向量空間，就像透過檢索器對整個集合進行重新排名一樣。這是重新排名的補充：重新排名器只會看到有限的子集，而 RF 則利用全集合範圍的回饋訊號。即使只有 3-5 個回饋分數也足夠。可以執行多次反覆運算。

回饋模型可以是任何針對每份文件產生相關性評分的模型：雙編碼器 (bi-encoder)、交叉編碼器、延遲互動模型、LLM 作為裁判。模糊的相關性評分也有效，而不僅僅是二進位 (好/壞、相關/不相關)，因為回饋是以分級相關性評分的形式表達的 (越高 = 越相關)。

略過時機：如果檢索器已經具有很強的召回率，或者檢索器和回饋模型在相關性上高度一致。

- RF 查詢目前基於 [3 參數原生公式](https://search.qdrant.tech/md/documentation/search/search-relevance/?s=naive-strategy)，沒有通用預設值，因此必須針對每個資料集、檢索器和回饋模型進行調優
- 使用 [qdrant-relevance-feedback](https://pypi.org/project/qdrant-relevance-feedback/) 調優參數、使用 Evaluator 評估影響，並檢查檢索器與回饋的一致性。設定指示請參閱 README。不需要 GPU，該框架還提供預定義的檢索器和回饋模型選項。
- 檢查 [相關性回饋查詢 API](https://search.qdrant.tech/md/documentation/search/search-relevance/?s=relevance-feedback) 的組態
- 將此作為輔助的端對端文字檢索範例，包含參數調優和評估，以了解如何使用 API 並執行 `qdrant-relevance-feedback` 框架：[RF 教學](https://search.qdrant.tech/md/documentation/tutorials-search-engineering/using-relevance-feedback/)

## 結果太相似

適用於：排名靠前的結果冗餘、接近重複或缺乏多樣性。這在密集內容領域（學術論文、產品目錄）中很常見。

- 使用 MMR (v1.15+) 作為帶有 `diversity` 的查詢參數，以平衡相關性和多樣性 [MMR](https://search.qdrant.tech/md/documentation/search/search-relevance/?s=maximal-marginal-relevance-mmr)
- 從 `diversity=0.5` 開始，數值越低精確度越高，數值越高探索性越強
- MMR 比標準搜尋慢。僅在冗餘確實成為問題時才使用。

## 知道好的結果應該長什麼樣子，但就是找不到

適用於：您可以提供正向和負向範例點，以引導搜尋更接近正向範例，並遠離負向範例。

- 推薦 API：使用正向/負向範例來推薦符合的向量 [推薦 API](https://search.qdrant.tech/md/documentation/search/explore/?s=recommendation-api)
  - 最佳評分策略：更適合多樣化範例，支援僅負向 [最佳評分](https://search.qdrant.tech/md/documentation/search/explore/?s=best-score-strategy)
- 探索 API：使用內容配對 (正向/負向) 在沒有請求目標的情況下約束搜尋區域 [探索](https://search.qdrant.tech/md/documentation/search/explore/?s=discovery-api)

## 相關性背後有業務邏輯
適用於：結果應根據資料的某些業務邏輯（如時效性或距離）進行額外排名。

請在 [評分提升文件](https://search.qdrant.tech/md/documentation/search/search-relevance/?s=score-boosting) 中檢查如何設定。

## 應避免的做法

- 在驗證純向量品質前使用混合搜尋 (會增加複雜度，且可能掩蓋模型問題)
- 在非英語文字上使用 BM25 而未正確配置語言特定的停用詞移除 (會嚴重降低結果品質)
- 在新增相關性回饋時跳過評估 (最好在真實查詢上檢查它是否確實有幫助)
