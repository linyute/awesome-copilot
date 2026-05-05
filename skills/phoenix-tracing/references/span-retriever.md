# RETRIEVER Span (RETRIEVER Spans)

## 目的 (Purpose)

RETRIEVER Span 代表文件/上下文擷取操作（例如向量資料庫查詢、語義搜尋、關鍵字搜尋）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | 字串 | 必須為 "RETRIEVER" | 是 |

## 屬性參考 (Attribute Reference)

### 查詢 (Query)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `input.value` | 字串 | 搜尋查詢文字 |

### 文件結構描述 (Document Schema)

| 屬性模式 | 類型 | 描述 |
|-------------------|------|-------------|
| `retrieval.documents.{i}.document.id` | 字串 | 唯一文件識別碼 |
| `retrieval.documents.{i}.document.content` | 字串 | 文件文字內容 |
| `retrieval.documents.{i}.document.score` | 浮點數 | 相關性分數（0-1 或距離） |
| `retrieval.documents.{i}.document.metadata` | 字串 (JSON) | 文件中介資料 |

### 文件的扁平化模式 (Flattening Pattern for Documents)

文件使用零基索引標記法 (zero-indexed notation) 進行扁平化：

```
retrieval.documents.0.document.id
retrieval.documents.0.document.content
retrieval.documents.0.document.score
retrieval.documents.1.document.id
retrieval.documents.1.document.content
retrieval.documents.1.document.score
...
```

### 文件中介資料 (Document Metadata)

常用的中介資料欄位（儲存為 JSON 字串）：

```json
{
  "source": "knowledge_base.pdf",
  "page": 42,
  "section": "Introduction",
  "author": "Jane Doe",
  "created_at": "2024-01-15",
  "url": "https://example.com/doc",
  "chunk_id": "chunk_123"
}
```

**帶有中介資料的範例：**
```json
{
  "retrieval.documents.0.document.id": "doc_123",
  "retrieval.documents.0.document.content": "機器學習是一種數據分析方法...",
  "retrieval.documents.0.document.score": 0.92,
  "retrieval.documents.0.document.metadata": "{\"source\": \"ml_textbook.pdf\", \"page\": 15, \"chapter\": \"Introduction\"}"
}
```

### 排序 (Ordering)

文件按索引（0, 1, 2, ...）排序。通常情況：
- 索引 0 = 分數最高的文件
- 索引 1 = 分數次高的文件
- 依此類推

在扁平化屬性中請保留擷取順序。

### 大型文件處理 (Large Document Handling)

對於非常長的文件：
- 考慮將 `document.content` 截斷為前 N 個字元。
- 將完整內容儲存在個別的文件儲存空間中。
- 使用 `document.id` 引用完整內容。

## 範例 (Examples)

### 基本向量搜尋 (Basic Vector Search)

```json
{
  "openinference.span.kind": "RETRIEVER",
  "input.value": "什麼是機器學習？",
  "retrieval.documents.0.document.id": "doc_123",
  "retrieval.documents.0.document.content": "機器學習是人工智慧的一個子集...",
  "retrieval.documents.0.document.score": 0.92,
  "retrieval.documents.0.document.metadata": "{\"source\": \"textbook.pdf\", \"page\": 42}",
  "retrieval.documents.1.document.id": "doc_456",
  "retrieval.documents.1.document.content": "機器學習演算法從數據中學習模式...",
  "retrieval.documents.1.document.score": 0.87,
  "retrieval.documents.1.document.metadata": "{\"source\": \"article.html\", \"author\": \"Jane Doe\"}",
  "retrieval.documents.2.document.id": "doc_789",
  "retrieval.documents.2.document.content": "監督式學習是機器學習的一種類型...",
  "retrieval.documents.2.document.score": 0.81,
  "retrieval.documents.2.document.metadata": "{\"source\": \"wiki.org\"}",
  "metadata.retriever_type": "vector_search",
  "metadata.vector_db": "pinecone",
  "metadata.top_k": 3
}
```
