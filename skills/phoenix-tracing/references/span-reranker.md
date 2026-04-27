# RERANKER Spans

## 目的 (Purpose)

RERANKER spans 代表對擷取的文件進行重新排序（例如：Cohere Rerank、交叉編碼器模型/cross-encoder models）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 | 必要 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | String | 必須為 "RERANKER" | 是 |

## 屬性參考 (Attribute Reference)

### 重排器參數 (Reranker Parameters)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `reranker.model_name` | String | 重排器模型識別碼 |
| `reranker.query` | String | 用於重排的查詢 |
| `reranker.top_k` | Integer | 要回傳的文件數量 |

### 輸入文件 (Input Documents)

| 屬性模式 | 類型 | 說明 |
|-------------------|------|-------------|
| `reranker.input_documents.{i}.document.id` | String | 輸入文件 ID |
| `reranker.input_documents.{i}.document.content` | String | 輸入文件內容 |
| `reranker.input_documents.{i}.document.score` | Float | 原始擷取分數 |
| `reranker.input_documents.{i}.document.metadata` | String (JSON) | 文件 Metadata |

### 輸出文件 (Output Documents)

| 屬性模式 | 類型 | 說明 |
|-------------------|------|-------------|
| `reranker.output_documents.{i}.document.id` | String | 輸出文件 ID（已重新排序） |
| `reranker.output_documents.{i}.document.content` | String | 輸出文件內容 |
| `reranker.output_documents.{i}.document.score` | Float | 新的重排分數 |
| `reranker.output_documents.{i}.document.metadata` | String (JSON) | 文件 Metadata |

### 分數比較 (Score Comparison)

輸入分數（來自擷取器）vs. 輸出分數（來自重排器）：

```json
{
  "reranker.input_documents.0.document.id": "doc_A",
  "reranker.input_documents.0.document.score": 0.7,
  "reranker.input_documents.1.document.id": "doc_B",
  "reranker.input_documents.1.document.score": 0.9,
  "reranker.output_documents.0.document.id": "doc_B",
  "reranker.output_documents.0.document.score": 0.95,
  "reranker.output_documents.1.document.id": "doc_A",
  "reranker.output_documents.1.document.score": 0.85
}
```

在此範例中：
- 輸入：doc_B (0.9) 的排名高於 doc_A (0.7)
- 輸出：doc_B 仍為最高，但兩者的分數都有所增加
- 重排器確認了擷取器的排序，但優化 (refined) 了分數

## 範例 (Examples)

### 完整的重排範例 (Complete Reranking Example)

```json
{
  "openinference.span.kind": "RERANKER",
  "reranker.model_name": "cohere-rerank-v2",
  "reranker.query": "什麼是機器學習？",
  "reranker.top_k": 2,
  "reranker.input_documents.0.document.id": "doc_123",
  "reranker.input_documents.0.document.content": "機器學習是人工智慧的一個子集...",
  "reranker.input_documents.1.document.id": "doc_456",
  "reranker.input_documents.1.document.content": "監督式學習演算法...",
  "reranker.input_documents.2.document.id": "doc_789",
  "reranker.input_documents.2.document.content": "神經網路是...",
  "reranker.output_documents.0.document.id": "doc_456",
  "reranker.output_documents.0.document.content": "監督式學習演算法...",
  "reranker.output_documents.0.document.score": 0.95,
  "reranker.output_documents.1.document.id": "doc_123",
  "reranker.output_documents.1.document.content": "機器學習是人工智慧的一個子集...",
  "reranker.output_documents.1.document.score": 0.88
}
```
