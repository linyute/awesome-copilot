# RETRIEVER Spans

## 目的 (Purpose)

RETRIEVER spans 代表文件/內容擷取操作（例如：向量資料庫查詢、語義搜尋、關鍵字搜尋）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 | 必要 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | String | 必須為 "RETRIEVER" | 是 |

## 屬性參考 (Attribute Reference)

### 查詢 (Query)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `input.value` | String | 搜尋查詢文字 |

### 文件結構 (Document Schema)

| 屬性模式 | 類型 | 說明 |
|-------------------|------|-------------|
| `retrieval.documents.{i}.document.id` | String | 唯一文件識別碼 |
| `retrieval.documents.{i}.document.content` | String | 文件文字內容 |
| `retrieval.documents.{i}.document.score` | Float | 相關性分數（0-1 或距離） |
| `retrieval.documents.{i}.document.metadata` | String (JSON) | 文件 Metadata |

### 文件的扁平化模式 (Flattening Pattern for Documents)

文件使用零索引標法 (zero-indexed notation) 進行扁平化：

```
retrieval.documents.0.document.id
retrieval.documents.0.document.content
retrieval.documents.0.document.score
retrieval.documents.1.document.id
retrieval.documents.1.document.content
retrieval.documents.1.document.score
...
```

### 文件 Metadata (Document Metadata)

常見的 Metadata 欄位（以 JSON 字串形式儲存）：

```json
{
  "source": "knowledge_base.pdf",
  "page": 42,
  "section": "簡介",
  "author": "Jane Doe",
  "created_at": "2024-01-15",
  "url": "https://example.com/doc",
  "chunk_id": "chunk_123"
}
```

**包含 Metadata 的範例：**
```json
{
  "retrieval.documents.0.document.id": "doc_123",
  "retrieval.documents.0.document.content": "機器學習是一種資料分析方法...",
  "retrieval.documents.0.document.score": 0.92,
  "retrieval.documents.0.document.metadata": "{\"source\": \"ml_textbook.pdf\", \"page\": 15, \"chapter\": \"Introduction\"}"
}
```

### 排序 (Ordering)

文件按索引（0, 1, 2, ...）排序。通常為：
- 索引 0 = 分數最高的文件
- 索引 1 = 分數次高的文件
- 依此類推。

請在扁平化屬性中保留擷取順序。

### 大型文件處理 (Large Document Handling)

對於非常長的文件：
- 考慮將 `document.content` 截斷 (truncating) 至前 N 個字元
- 將完整內容儲存在獨立的文件儲存空間 (document store) 中
- 使用 `document.id` 參照完整內容

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
  "retrieval.documents.1.document.content": "機器學習演算法從資料中學習模式...",
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
