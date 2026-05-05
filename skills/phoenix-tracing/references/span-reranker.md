# RERANKER Span (RERANKER Spans)

## 目的 (Purpose)

RERANKER Span 代表擷取文件的重新排序操作（例如 Cohere Rerank, cross-encoder 模型）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | 字串 | 必須為 "RERANKER" | 是 |

## 屬性參考 (Attribute Reference)

### 重新排序器參數 (Reranker Parameters)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `reranker.model_name` | 字串 | 重新排序器模型識別碼 |
| `reranker.query` | 字串 | 用於重新排序的查詢 |
| `reranker.top_k` | 整數 | 傳回的文件數量 |

### 輸入文件 (Input Documents)

| 屬性模式 | 類型 | 描述 |
|-------------------|------|-------------|
| `reranker.input_documents.{i}.document.id` | 字串 | 輸入文件 ID |
| `reranker.input_documents.{i}.document.content` | 字串 | 輸入文件內容 |
| `reranker.input_documents.{i}.document.score` | 浮點數 | 原始擷取分數 |
| `reranker.input_documents.{i}.document.metadata` | 字串 (JSON) | 文件中介資料 |

### 輸出文件 (Output Documents)

| 屬性模式 | 類型 | 描述 |
|-------------------|------|-------------|
| `reranker.output_documents.{i}.document.id` | 字串 | 輸出文件 ID（已重新排序） |
| `reranker.output_documents.{i}.document.content` | 字串 | 輸出文件內容 |
| `reranker.output_documents.{i}.document.score` | 浮點數 | 新的重新排序分數 |
| `reranker.output_documents.{i}.document.metadata` | 字串 (JSON) | 文件中介資料 |

### 分數比較 (Score Comparison)

輸入分數（來自檢索器）vs 輸出分數（來自重新排序器）：

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
- 輸入：doc_B (0.9) 的排名高於 doc_A (0.7)。
- 輸出：doc_B 仍為最高，但兩者的分數皆有所提升。
- 重新排序器確認了檢索器的排序，但細化了分數。

## 範例 (Examples)

### 完整的重新排序範例 (Complete Reranking Example)

```json
{
  "openinference.span.kind": "RERANKER",
  "reranker.model_name": "cohere-rerank-v2",
  "reranker.query": "什麼是機器學習？",
  "reranker.top_k": 2,
  "reranker.input_documents.0.document.id": "doc_123",
  "reranker.input_documents.0.document.content": "機器學習是...的一個子集",
  "reranker.input_documents.1.document.id": "doc_456",
  "reranker.input_documents.1.document.content": "監督式學習演算法...",
  "reranker.input_documents.2.document.id": "doc_789",
  "reranker.input_documents.2.document.content": "神經網路是...",
  "reranker.output_documents.0.document.id": "doc_456",
  "reranker.output_documents.0.document.content": "監督式學習演算法...",
  "reranker.output_documents.0.document.score": 0.95,
  "reranker.output_documents.1.document.id": "doc_123",
  "reranker.output_documents.1.document.content": "機器學習是...的一個子集",
  "reranker.output_documents.1.document.score": 0.88
}
```
