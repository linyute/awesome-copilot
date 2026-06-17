---
name: pinecone-rag
description: >
  使用 Pinecone 作為向量資料庫後端構建生產級 RAG 管道和持久代理記憶。當使用者提到 Pinecone、想要為語義搜索索引文件、構建檢索增強生成系統、跨會話存儲代理記憶、實施混合搜索或將 LLM 連接到可搜索知識庫時（即使他們沒有明確說「Pinecone」），務必使用此技能。當使用者詢問用於 RAG 的向量資料庫、多租戶代理的命名空間隔離、嵌入管道或將知識庫擴展到本地存儲無法處理的範圍時，也可以使用。不要用於僅限本地的向量存儲（Chroma, FAISS, pgvector）或沒有語義組件的純關鍵字搜索。
license: Apache-2.0
compatibility: "pinecone>=6.0.0, Python 3.10+"
---

# Pinecone RAG 技能

此技能引導您使用 Pinecone 構建生產級 RAG 管道或持久代理記憶系統。請從頭到尾遵循工作流程 — 在了解使用者實際需求之前，不要跳過步驟或直接跳到程式碼。

## 在開始之前 — 請詢問一個問題

在編寫任何程式碼之前，請確定適用以下哪種用例：

**A — 文件上的 RAG**: 使用者想要索引語料庫（PDF、文件、程式碼、網頁）並檢索相關區塊以支撐 LLM 的回應。

**B — 代理記憶**: 使用者希望代理能夠跨會話或跨共享知識庫的多個代理記住事實、決策或上下文。

設定過程相似，但命名空間策略和檢索模式不同。如果使用者沒有說明，請詢問：*"這是用於文件檢索、代理記憶還是兩者兼而有之？"* 然後遵循下方相關的工作流程。

---

## 第 1 步 — 選擇您的索引配置

在編寫任何程式碼之前挑選索引類型。弄錯這一點意味著以後需要重新建立索引。

**Serverless (大多數情況下推薦)**
```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="PINECONE_API_KEY")

if "my-index" not in pc.list_indexes().names():
    pc.create_index(
        name="my-index",
        dimension=1536,        # 必須與您的嵌入模型精確匹配
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
index = pc.Index("my-index")
```

**Pod-based (用於一致的高吞吐量生產環境)**
```python
from pinecone import PodSpec

pc.create_index(
    name="my-index-prod",
    dimension=1536,
    metric="cosine",
    spec=PodSpec(environment="us-east1-gcp", pod_type="p1.x1")
)
```

**維度快速參考 — 務必與您的嵌入模型精確匹配：**
| 模型 | 維度 |
|---|---|
| `text-embedding-3-small` | 1536 |
| `text-embedding-3-large` | 3072 |
| `voyage-3` / `voyage-multimodal-3` | 1024 |
| `BAAI/bge-large-en-v1.5` | 1024 |
| `intfloat/multilingual-e5-large` (阿拉伯語、馬來語、中文) | 1024 |

> **檢查點**: 索引已存在，維度與嵌入模型匹配，`index.describe_index_stats()` 返回且無錯誤。

---

## 第 2 步 — 嵌入並上傳文件

務必批量上傳 (upsert) — 絕不要一次上傳一個向量。

```python
from openai import OpenAI

client = OpenAI()

def embed(texts: list[str]) -> list[list[float]]:
    res = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return [r.embedding for r in res.data]

def upsert_docs(index, docs: list[dict], namespace: str = "default"):
    """docs = [{"id": "...", "text": "...", "metadata": {...}}]"""
    BATCH = 100
    for i in range(0, len(docs), BATCH):
        batch = docs[i:i + BATCH]
        vecs = [
            {
                "id": d["id"],
                "values": emb,
                "metadata": {**d.get("metadata", {}), "text": d["text"]}
            }
            for d, emb in zip(batch, embed([d["text"] for d in batch]))
        ]
        index.upsert(vectors=vecs, namespace=namespace)
```

**務必將原始文本存儲在元數據 (metadata) 中** — 這可以避免在檢索時進行第二次查找。

> **檢查點**: `index.describe_index_stats()` 顯示目標命名空間中的向量數量 > 0。

---

## 第 3 步 — 選擇檢索策略

### 稠密 (語義) 搜索 — 大多數情況下使用
```python
def search(index, query: str, top_k: int = 5, namespace: str = "default",
           filter: dict = None) -> list[dict]:
    [q_emb] = embed([query])
    results = index.query(
        vector=q_emb, top_k=top_k, namespace=namespace,
        include_metadata=True, filter=filter
    )
    return [{"text": m.metadata["text"], "score": m.score, "id": m.id}
            for m in results.matches]
```

### 混合搜索 (語義 + BM25 關鍵字) — 當語料庫具有精確術語時使用
當領域具有語義搜索可能遺漏的精確術語時，請使用混合搜索：法律引用、醫學代碼、產品 SKU、API 方法名稱。

```python
from pinecone_text.sparse import BM25Encoder

bm25 = BM25Encoder().default()
bm25.fit([d["text"] for d in docs])  # 對您的語料庫擬合一次

def hybrid_search(index, query: str, top_k: int = 5, alpha: float = 0.7):
    """alpha=1.0 是純稠密；alpha=0.0 是純稀疏。"""
    dense = [v * alpha for v in embed([query])[0]]
    sparse_raw = bm25.encode_queries(query)
    sparse = {
        "indices": sparse_raw["indices"],
        "values": [v * (1 - alpha) for v in sparse_raw["values"]]
    }
    return index.query(vector=dense, sparse_vector=sparse,
                       top_k=top_k, include_metadata=True).matches
```

### 元數據過濾 — 用於在語義排序之前限定結果範圍
```python
# 精確匹配
results = index.query(vector=emb, filter={"source": {"$eq": "confluence"}})

# 組合過濾
results = index.query(vector=emb, filter={
    "$and": [
        {"category": {"$eq": "engineering"}},
        {"language": {"$in": ["en", "ar"]}}
    ]
})
```

> **檢查點**: 測試查詢返回相關結果，對於顯著匹配的內容，分數 > 0.7。

---

## 第 4A 步 — 完整 RAG 管道 (文件用例)

```python
def rag_answer(index, question: str, namespace: str = "default",
               model: str = "gpt-4o-mini") -> str:
    hits = search(index, question, top_k=5, namespace=namespace)
    context = "\n\n".join(h["text"] for h in hits)

    return client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "僅使用提供的上下文進行回答。"
                    "如果答案不在上下文中，請說明。\n\n"
                    f"上下文：\n{context}"
                )
            },
            {"role": "user", "content": question}
        ]
    ).choices[0].message.content
```

---

## 第 4B 步 — 代理記憶 (記憶用例)

使用命名空間完全隔離每個代理或使用者的記憶。每個代理一個命名空間可防止記憶在使用者或會話之間洩漏。

```python
import time, hashlib

def remember(index, agent_id: str, content: str,
             memory_type: str = "fact"):
    """為代理存儲一段記憶。"""
    mem_id = hashlib.md5(
        f"{agent_id}{content}{time.time()}".encode()
    ).hexdigest()
    [emb] = embed([content])
    index.upsert(
        vectors=[{
            "id": mem_id,
            "values": emb,
            "metadata": {
                "text": content,
                "type": memory_type,
                "timestamp": time.time(),
                "agent_id": agent_id
            }
        }],
        namespace=f"agent_{agent_id}"
    )

def recall(index, agent_id: str, query: str,
           top_k: int = 5) -> list[str]:
    """為代理召回相關記憶。"""
    return [h["text"] for h in
            search(index, query, top_k=top_k,
                   namespace=f"agent_{agent_id}")]

def forget(index, agent_id: str):
    """擦除代理的所有記憶（例如：應使用者要求）。"""
    index.delete(delete_all=True, namespace=f"agent_{agent_id}")
```

---

## 第 5 步 — 將其串聯起來並進行端到端測試

在集成到更大的系統之前運行快速冒煙測試：

```python
# 冒煙測試
upsert_docs(index, [
    {"id": "t1", "text": "Pinecone 是用於語義搜索的向量資料庫。"},
    {"id": "t2", "text": "RAG 將檢索與語言模型生成相結合。"},
])

hits = search(index, "什麼是 Pinecone？")
assert hits[0]["score"] > 0.7, f"預期高相似度，得到 {hits[0]['score']}"
print("冒煙測試通過：", hits[0]["text"])
```

> **檢查點**: 冒煙測試通過。端到端：索引 → 上傳 → 查詢 → LLM 回應正常運作，無錯誤。

---

## 常見陷阱 — 在它們變成錯誤之前修復

- **維度不匹配**: 在第一次上傳之前，始終驗證 `len(embed(["test"])[0])` 是否與索引維度匹配。
- **元數據中缺少文本**: 如果您沒有在元數據中存儲 `"text"`，則在查詢時需要第二次查找才能獲得實際內容。
- **在循環中上傳單個向量**: 始終以 100 個為一組批量處理。
- **沒有命名空間策略**: 預先決定 — 每個使用者/代理一個命名空間可防止以後難以修復的跨租戶數據洩漏。
- **在小型語料庫上擬合 BM25**: BM25 需要具代表性的語料庫來建立良好的詞頻。請至少在幾百份文件上進行擬合。

## 何時不要使用此技能

在以下情況下使用不同的方法：
- 資料集可以放入記憶體且延遲無關緊要 → 使用 FAISS 或 Chroma
- 您已經在使用 PostgreSQL 並希望避免新服務 → 使用 pgvector
- 您需要低於 5ms 的 p99 延遲且沒有外部 API 調用 → 本地向量存儲
- 使用者明確想要不同的向量資料庫 (Weaviate, Qdrant 等)
