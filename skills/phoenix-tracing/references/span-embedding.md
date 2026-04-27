# EMBEDDING Spans

## 目的 (Purpose)

EMBEDDING spans 代表向量產生操作（例如用於語義搜尋的文字轉向量轉換）。

## 必要屬性 (Required Attributes)

| 屬性 | 類型 | 說明 | 必要 |
|-----------|------|-------------|----------|
| `openinference.span.kind` | String | 必須為 "EMBEDDING" | 是 |
| `embedding.model_name` | String | 嵌入模型識別碼 | 建議 |

## 屬性參考 (Attribute Reference)

### 單一嵌入 (Single Embedding)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `embedding.model_name` | String | 嵌入模型識別碼 |
| `embedding.text` | String | 要嵌入的輸入文字 |
| `embedding.vector` | String (JSON 陣列) | 產生的嵌入向量 |

**範例：**
```json
{
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.text": "什麼是機器學習？",
  "embedding.vector": "[0.023, -0.012, 0.045, ..., 0.001]"
}
```

### 批次嵌入 (Batch Embeddings)

| 屬性模式 | 類型 | 說明 |
|-------------------|------|-------------|
| `embedding.embeddings.{i}.embedding.text` | String | 索引為 i 的文字 |
| `embedding.embeddings.{i}.embedding.vector` | String (JSON 陣列) | 索引為 i 的向量 |

**範例：**
```json
{
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.embeddings.0.embedding.text": "第一份文件",
  "embedding.embeddings.0.embedding.vector": "[0.1, 0.2, 0.3, ..., 0.5]",
  "embedding.embeddings.1.embedding.text": "第二份文件",
  "embedding.embeddings.1.embedding.vector": "[0.6, 0.7, 0.8, ..., 0.9]"
}
```

### 向量格式 (Vector Format)

向量以 JSON 陣列字串形式儲存：
- 維度 (Dimensions)：通常為 384、768、1536 或 3072
- 格式：`"[0.123, -0.456, 0.789, ...]" `
- 精確度 (Precision)：通常為 3-6 位小數

**儲存考量 (Storage Considerations)：**
- 大型向量可能會顯著增加追蹤大小 (trace size)
- 在生產環境中請考慮省略向量（保留 `embedding.text` 以供除錯使用）
- 使用獨立的向量資料庫進行實際的相似度搜尋

## 範例 (Examples)

### 單一嵌入 (Single Embedding)

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

### 批次嵌入 (Batch Embeddings)

```json
{
  "openinference.span.kind": "EMBEDDING",
  "embedding.model_name": "text-embedding-ada-002",
  "embedding.embeddings.0.embedding.text": "第一份文件",
  "embedding.embeddings.0.embedding.vector": "[0.1, 0.2, 0.3]",
  "embedding.embeddings.1.embedding.text": "第二份文件",
  "embedding.embeddings.1.embedding.vector": "[0.4, 0.5, 0.6]",
  "embedding.embeddings.2.embedding.text": "第三份文件",
  "embedding.embeddings.2.embedding.vector": "[0.7, 0.8, 0.9]"
}
```
