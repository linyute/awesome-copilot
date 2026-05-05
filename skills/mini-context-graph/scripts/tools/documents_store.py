"""
documents_store.py — 原始文件與區塊的持久化儲存（RAG 層）。

受到 Karpathy 的 LLM Wiki 模式啟發：原始來源是不可變的，並作為事實根據儲存。
區塊是檢索單位；來源指標將圖形節點/邊緣連結回特定的區塊。

處理：
- 儲存帶有 Metadata 的原始文件
- 將文件拆分為重疊的文字視窗（區塊化）
- 透過 ID 或關鍵字搜尋檢索區塊
- 持久化至 data/documents.json
"""
from __future__ import annotations

import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import config

_DATA_DIR = Path(os.environ.get("MINI_CONTEXT_GRAPH_DATA_DIR", str(config.DATA_DIR)))
_DOCS_FILE = _DATA_DIR / "documents.json"

_CHUNK_SIZE = 500       # 每個區塊的字元數
_CHUNK_OVERLAP = 100    # 連續區塊之間的重疊字元數

_STOPWORDS = frozenset([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "to", "of", "in", "on",
    "at", "by", "for", "with", "from", "and", "or", "but", "not", "it",
    "its", "this", "that", "these", "those", "i", "you", "he", "she",
    "we", "they", "what", "which", "who", "how", "why", "when", "where",
])


def _load() -> dict:
    if _DOCS_FILE.exists():
        with open(_DOCS_FILE, "r") as f:
            return json.load(f)
    return {"documents": {}}


def _save(store: dict) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(_DOCS_FILE, "w") as f:
        json.dump(store, f, indent=2)


def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 1]


def _chunk_text(content: str, chunk_size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP) -> list[str]:
    """將內容拆分為重疊的字元視窗。"""
    chunks = []
    start = 0
    while start < len(content):
        end = start + chunk_size
        chunks.append(content[start:end].strip())
        if end >= len(content):
            break
        start += chunk_size - overlap
    return [c for c in chunks if c]


# ---------------------------------------------------------------------------
# 公開 API
# ---------------------------------------------------------------------------

def add_document(
    doc_id: str,
    title: str,
    source: str,
    content: str,
) -> dict:
    """
    儲存原始文件並自動生成區塊。

    參數：
        doc_id:  呼叫者提供的穩定識別碼（例如 "doc_001" 或檔名）。
        title:   人類可讀的標題。
        source:  來源路徑/URL（不可變的來源指標）。
        content: 要儲存並區塊化的完整原始文字。

    回傳：
        儲存的文件字典，包含產生的 chunk_ids。
    """
    store = _load()

    # 冪等：如果文件已儲存則回傳現有文件
    if doc_id in store["documents"]:
        return store["documents"][doc_id]

    raw_chunks = _chunk_text(content)
    chunks = []
    for i, text in enumerate(raw_chunks):
        chunks.append({
            "chunk_id": f"{doc_id}_chunk_{i:03d}",
            "index": i,
            "text": text,
        })

    doc = {
        "id": doc_id,
        "title": title,
        "source": source,
        "content": content,
        "chunks": chunks,
        "ingestion_date": datetime.now(timezone.utc).isoformat(),
    }
    store["documents"][doc_id] = doc
    _save(store)
    return doc


def get_document(doc_id: str) -> dict | None:
    """回傳完整的文件記錄，如果找不到則回傳 None。"""
    store = _load()
    return store["documents"].get(doc_id)


def get_chunk(chunk_id: str) -> dict | None:
    """透過 chunk_id 回傳特定區塊（搜尋所有文件）。"""
    store = _load()
    for doc in store["documents"].values():
        for chunk in doc["chunks"]:
            if chunk["chunk_id"] == chunk_id:
                return chunk
    return None


def get_chunks_for_document(doc_id: str) -> list[dict]:
    """回傳文件的所有區塊。"""
    doc = get_document(doc_id)
    if doc is None:
        return []
    return doc["chunks"]


def search_chunks(query: str, top_k: int = 5) -> list[dict]:
    """
    對區塊文字進行關鍵字搜尋。回傳按字詞重疊度排序的前 top_k 個匹配區塊
    （簡單的 TF 風格評分，不需嵌入向量）。

    回傳字典列表，包含鍵：chunk_id、doc_id、score、text。
    """
    store = _load()
    query_tokens = set(_tokenize(query))
    if not query_tokens:
        return []

    scored: list[tuple[float, dict]] = []
    for doc in store["documents"].values():
        for chunk in doc["chunks"]:
            chunk_tokens = set(_tokenize(chunk["text"]))
            overlap = len(query_tokens & chunk_tokens)
            if overlap > 0:
                score = overlap / len(query_tokens)
                scored.append((score, {
                    "chunk_id": chunk["chunk_id"],
                    "doc_id": doc["id"],
                    "doc_title": doc["title"],
                    "score": round(score, 4),
                    "text": chunk["text"],
                }))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:top_k]]


def list_documents() -> list[dict]:
    """回傳所有已儲存文件的摘要列表（無內容，無區塊）。"""
    store = _load()
    return [
        {
            "id": doc["id"],
            "title": doc["title"],
            "source": doc["source"],
            "chunk_count": len(doc["chunks"]),
            "ingestion_date": doc["ingestion_date"],
        }
        for doc in store["documents"].values()
    ]
