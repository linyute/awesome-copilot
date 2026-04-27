---
name: qdrant-model-migration
description: "指導在 Qdrant 中無停機時間地遷移嵌入模型 (embedding model)。當有人問「如何切換嵌入模型」、「如何遷移向量」、「如何更新到新模型」、「零停機時間的模型變更」、「如何重新嵌入我的資料」或「我可以同時使用兩個模型嗎」時，請使用此技能。在升級模型維度、切換供應商或 A/B 測試模型時也請使用此技能。"
---

# 變更嵌入模型時該怎麼辦

來自不同模型的向量是不相容的。您不能在同一個向量空間中混合使用舊的和新的嵌入。您也無法向現有集合中新增新的具名向量 (named vector) 欄位。所有具名向量都必須在建立集合時定義。以下兩種遷移策略都需要建立一個新的集合。

- 在選擇策略前請先了解集合別名 [集合別名](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=collection-aliases)


## 我可以避免重新嵌入嗎？

適用於：在決定進行全面遷移前尋找捷徑。

在以下情況下，您「必須」重新嵌入：變更模型供應商 (從 OpenAI 變更為 Cohere)、變更架構 (從 CLIP 變更為 BGE)、不同模型之間的維度數量不相容，或者向僅限密集向量的集合中新增稀疏向量。

在以下情況下，您「可以」避免重新嵌入：使用 Matryoshka 模型 (使用 `dimensions` 參數產出較低維度的嵌入，從樣本資料中學習線性轉換，雖會損失一些召回率，但適合 1 億以上的資料集)。或者變更量化方式 (從二進位變更為純量)：Qdrant 會自動重新量化。[量化](https://search.qdrant.tech/md/documentation/manage-data/quantization/)


## 需要零停機時間 (別名交換)

適用於：生產環境必須保持可用。建議用於大規模的模型替換。

- 建立一個具有新模型維度和距離指標的新集合
- 在背景將所有資料重新嵌入到新集合中
- 將您的應用程式指向集合別名，而非直接指向集合名稱
- 以不可分割的方式將別名交換到新集合 [切換集合](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=switch-collection)
- 驗證搜尋品質，然後刪除舊集合

請注意，別名交換僅重新導向查詢。Payload 必須另外重新上傳。


## 需要兩個模型同時上線 (並行執行)

適用於：進行 A/B 測試模型、多模態 (密集 + 稀疏) 或在決定採用新模型前進行評估。

您無法向現有集合新增具名向量。請預先建立一個同時定義了兩個向量欄位的新集合：

- 建立同時定義了舊的和新的具名向量的新集合 [具有多個向量的集合](https://search.qdrant.tech/md/documentation/manage-data/collections/?s=collection-with-multiple-vectors)
- 從舊集合遷移資料，並保留舊具名欄位中現有的向量
- 使用 `UpdateVectors` 增量回填新模型的嵌入 [更新向量](https://search.qdrant.tech/md/documentation/manage-data/points/?s=update-vectors)
- 透過使用 `using: "old_model"` 與 `using: "new_model"` 進行查詢來比較品質
- 滿意後將別名交換到新集合

將大型多向量 (尤其是 ColBERT) 與密集向量共置會降低「所有」查詢的效能，即使是僅使用密集向量的查詢。在百萬級的點數下，使用者回報延遲從 13 秒降低到移除 ColBERT 後的 2 秒。在並行遷移期間，請將大型向量存放在磁碟上。

如果您預期未來會進行模型遷移，請在建立集合時預先定義兩個向量欄位。


## 從密集搜尋遷移至混合搜尋

適用於：向現有的僅限密集向量集合中新增稀疏/BM25 向量。這是最常見的遷移模式。

您無法向現有的僅限密集向量集合新增稀疏向量。必須重新建立：

- 建立同時定義了密集和稀疏向量組態的新集合
- 使用密集和稀疏模型重新嵌入所有資料
- 遷移 Payload，交換別名

切塊層級的稀疏向量與文件層級具有不同的 TF-IDF 特性。遷移後請測試檢索品質，特別是對於未移除停用詞的非英語文本。


## 重新嵌入的速度太慢

適用於：資料集龐大且重新嵌入成為瓶頸。

- 使用 `update_mode: insert` (v1.17+) 進行安全且等冪的遷移 [更新模式](https://search.qdrant.tech/md/documentation/manage-data/points/?s=update-mode)
- 以 `with_vectors=False` 捲動 (scroll) 舊集合，分批次重新嵌入，然後 upsert 到新集合
- 使用平行批次上傳 (每次請求 64-256 個點，2-4 個平行串流) [批次上傳](https://search.qdrant.tech/md/documentation/tutorials-develop/bulk-upload/)
- 在大量載入期間停用 HNSW (將 `indexing_threshold_kb` 設為極高值，之後再恢復)
- 對於 Qdrant Cloud 推論，切換模型是組態變更，而非管線變更 [推論文件](https://search.qdrant.tech/md/documentation/inference/)

對於 400GB 以上的資料集，預期需要數天。對於小型資料集 (<25MB)，從原始碼重新編製索引比使用遷移工具更快。


## 應避免的做法

- 假設您可以向現有集合新增具名向量 (必須在建立時定義)
- 在驗證新集合之前刪除舊集合
- 忘記在應用程式程式碼中更新查詢嵌入模型
- 使用別名交換時跳過 Payload 遷移 (別名僅重新導向查詢，不會複製資料)
- 在長時間遷移期間將 ColBERT 向量與密集向量共置 (I/O 成本會降低所有查詢的效能)
- 在未測試切塊層級 BM25 品質的情況下遷移至混合搜尋
