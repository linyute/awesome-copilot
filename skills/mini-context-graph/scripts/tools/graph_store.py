"""
graph_store.py — 圖形節點與邊緣的持久化儲存。

處理：
- 新增/去重疊節點
- 新增帶有信賴度的邊緣
- 獲取鄰居節點
- 持久化至 graph.json
"""
from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
import config

_DATA_DIR = Path(os.environ.get("MINI_CONTEXT_GRAPH_DATA_DIR", str(config.DATA_DIR)))
_GRAPH_FILE = _DATA_DIR / "graph.json"


def _load() -> dict:
    if _GRAPH_FILE.exists():
        with open(_GRAPH_FILE, "r") as f:
            return json.load(f)
    return {"nodes": {}, "edges": []}


def _save(graph: dict) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(_GRAPH_FILE, "w") as f:
        json.dump(graph, f, indent=2)


def add_node(
    name: str,
    node_type: str,
    source_document: str | None = None,
    source_chunks: list[str] | None = None,
) -> str:
    """
    如果節點不存在則新增。回傳 node_id。

    參數：
        source_document: 來自 documents_store 的 doc_id（來源指標）。
        source_chunks:   提及此實體的 chunk_ids 列表。
    """
    graph = _load()
    name_lower = name.strip().lower()

    # 去重疊：按標準化名稱搜尋
    for node_id, node in graph["nodes"].items():
        if node["name"] == name_lower:
            # 如果提供了新資訊，則合併來源
            changed = False
            if source_document and node.get("source_document") is None:
                node["source_document"] = source_document
                changed = True
            if source_chunks:
                existing = set(node.get("source_chunks") or [])
                merged = list(existing | set(source_chunks))
                if merged != list(existing):
                    node["source_chunks"] = merged
                    changed = True
            if changed:
                _save(graph)
            return node_id

    node_id = str(uuid.uuid4())[:8]
    graph["nodes"][node_id] = {
        "name": name_lower,
        "type": node_type.strip().lower(),
        "source_document": source_document,
        "source_chunks": source_chunks or [],
    }
    _save(graph)
    return node_id


def add_edge(
    source_id: str,
    target_id: str,
    relation: str,
    confidence: float,
    source_document: str | None = None,
    supporting_text: str | None = None,
    chunk_id: str | None = None,
) -> None:
    """
    在兩個節點之間新增有向邊緣。

    參數：
        source_document:  來自 documents_store 的 doc_id（來源指標）。
        supporting_text:  支持此關聯的確切文字片段。
        chunk_id:         支持文字來源的特定 chunk_id。
    """
    graph = _load()

    # 透過 來源 + 目標 + 關聯 去重疊邊緣
    relation_lower = relation.strip().lower()
    for edge in graph["edges"]:
        if (
            edge["source"] == source_id
            and edge["target"] == target_id
            and edge["type"] == relation_lower
        ):
            changed = False
            if confidence > edge["confidence"]:
                edge["confidence"] = confidence
                changed = True
            if source_document and edge.get("source_document") is None:
                edge["source_document"] = source_document
                changed = True
            if supporting_text and edge.get("supporting_text") is None:
                edge["supporting_text"] = supporting_text
                changed = True
            if chunk_id and edge.get("chunk_id") is None:
                edge["chunk_id"] = chunk_id
                changed = True
            if changed:
                _save(graph)
            return

    graph["edges"].append({
        "source": source_id,
        "target": target_id,
        "type": relation_lower,
        "confidence": confidence,
        "source_document": source_document,
        "supporting_text": supporting_text,
        "chunk_id": chunk_id,
    })
    _save(graph)


def get_neighbors(node_id: str, min_confidence: float = 0.0) -> list[str]:
    """回傳從 node_id 可到達的所有鄰居節點的 node_ids。"""
    graph = _load()
    neighbors = []
    for edge in graph["edges"]:
        if edge["confidence"] < min_confidence:
            continue
        if edge["source"] == node_id:
            neighbors.append(edge["target"])
        elif edge["target"] == node_id:
            neighbors.append(edge["source"])
    return list(set(neighbors))


def get_node(node_id: str) -> dict | None:
    """透過 ID 獲取單個節點。"""
    graph = _load()
    return graph["nodes"].get(node_id)


def get_subgraph(node_ids: list[str]) -> dict:
    """回傳由給定 node_ids 誘導的節點與邊緣。"""
    graph = _load()
    node_id_set = set(node_ids)

    nodes = {nid: graph["nodes"][nid] for nid in node_ids if nid in graph["nodes"]}
    edges = [
        e
        for e in graph["edges"]
        if e["source"] in node_id_set and e["target"] in node_id_set
    ]
    return {"nodes": nodes, "edges": edges}


def find_node_by_name(name: str) -> str | None:
    """回傳給定標準化名稱的 node_id，或回傳 None。"""
    graph = _load()
    name_lower = name.strip().lower()
    for node_id, node in graph["nodes"].items():
        if node["name"] == name_lower:
            return node_id
    return None


def link_node_to_source(node_id: str, doc_id: str, chunk_ids: list[str]) -> None:
    """將來源資訊 (doc_id + chunk_ids) 附加到現有節點。"""
    graph = _load()
    if node_id not in graph["nodes"]:
        return
    node = graph["nodes"][node_id]
    node["source_document"] = doc_id
    existing = set(node.get("source_chunks") or [])
    node["source_chunks"] = list(existing | set(chunk_ids))
    _save(graph)


def get_node_sources(node_id: str) -> dict:
    """回傳節點的來源資訊 (source_document + source_chunks)。"""
    graph = _load()
    node = graph["nodes"].get(node_id, {})
    return {
        "source_document": node.get("source_document"),
        "source_chunks": node.get("source_chunks", []),
    }
