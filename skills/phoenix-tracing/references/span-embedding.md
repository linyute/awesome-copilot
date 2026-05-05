# EMBEDDING Span (EMBEDDING Spans)

## 目的 (Purpose)

EMBEDDING Span 代表向量產生操作（針對語義搜尋進行文字轉向量的轉換）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 描述 | 是否必填 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | 字串 | 必須為 "EMBEDDING" | 是 |
| `embedding.model_name` | 字串 | 嵌入模型識別碼 | 建議填寫 |

## 屬性參考 (Attribute Reference)

### 單一嵌入 (Single Embedding)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `embedding.model_name` | 字串 | 嵌入模型識別碼 |
| `embedding.text` | 字串 | 要進行嵌入的輸入文字 |
| `embedding.vector` | 字串 (JSON 陣列) | 產生的嵌入向量 |

**範例：**
```json
{
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.text": "什麼是機器學習？",
  "embedding.vector": "[0.023, -0.012, 0.045, ..., 0.001]"
}
```

### 批次嵌入 (Batch Embeddings)

| 屬性模式 | 類型 | 描述 |
|-------------------|------|-------------|
| `embedding.embeddings.{i}.embedding.text` | 字串 | 索引 i 處的文字 |
| `embedding.embeddings.{i}.embedding.vector` | 字串 (JSON 陣列) | 索引 i 處的向量 |

**範例：**
```json
{
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.embeddings.0.embedding.text": "第一個文件",
  "embedding.embeddings.0.embedding.vector": "[0.1, 0.2, 0.3, ..., 0.5]",
  "embedding.embeddings.1.embedding.text": "第二個文件",
  "embedding.embeddings.1.embedding.vector": "[0.6, 0.7, 0.8, ..., 0.9]"
}
```

### 向量格式 (Vector Format)

向量儲存為 JSON 陣列字串：
- 維度：通常為 384, 768, 1536 或 3072。
- 格式：`"[0.123, -0.456, 0.789, ...]"`。
- 精確度：通常為小數點後 3-6 位。

**儲存考量：**
- 大型向量會顯著增加 Trace 的大小。
- 考慮在生產環境中省略向量（保留 `embedding.text` 用於偵錯）。
- 使用獨立的向量資料庫進行實際的相似度搜尋。

## 範例 (Examples)

### 單一嵌入

```json
{
  "openinference.span.kind": "EMBEDDING",
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.text": "什麼是機器學習？",
  "embedding.vector": "[0.023, -0.012, 0.045, ..., 0.001]",
  "input.value": "什麼是機器學習？",
  "output.value": "[0.023, -0.012, 0.045, ..., 0.001]"
}
```

### 批次嵌入

```json
{
  "openinference.span.kind": "EMBEDDING",
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.embeddings.0.embedding.text": "第一個文件",
  "embedding.embeddings.0.embedding.vector": "[0.1, 0.2, 0.3]",
  "embedding.embeddings.1.embedding.text": "第二個文件",
  "embedding.embeddings.1.embedding.vector": "[0.4, 0.5, 0.6]",
  "embedding.embeddings.2.embedding.text": "第三個文件",
  "embedding.embeddings.2.embedding.vector": "[0.7, 0.8, 0.9]"
}
```
