"""
retrieval_engine.py — 基於廣度優先搜尋 (BFS) 的圖形周遊，用於內容檢索。

輸入：種子 node_ids + 深度
輸出：在周遊深度內，且經過 min_confidence 過濾的 node_ids 列表
"""
from __future__ import annotations

import sys
from pathlib import Path
from collections import deque

# 允許從父套件匯入
sys.path.insert(0, str(Path(__file__).parent.parent))

from tools import graph_store
import config


def retrieve(
    seed_node_ids: list[str],
    depth: int = config.MAX_GRAPH_DEPTH,
    min_confidence: float = config.MIN_CONFIDENCE,
    max_nodes: int = config.MAX_NODES,
) -> list[str]:
    """
    從種子節點開始進行 BFS，最多周遊 `depth` 跳 (hops)。

    回傳周遊範圍內的 node_ids 列表（包含種子節點），
    邊緣經過 min_confidence 過濾，且數量上限為 max_nodes。
    """
    visited: set[str] = set()
    # 佇列項目：(node_id, current_depth)
    queue: deque[tuple[str, int]] = deque()

    for seed in seed_node_ids:
        if seed not in visited:
            visited.add(seed)
            queue.append((seed, 0))

    while queue:
        if len(visited) >= max_nodes:
            break

        node_id, current_depth = queue.popleft()

        if current_depth >= depth:
            continue

        neighbors = graph_store.get_neighbors(node_id, min_confidence=min_confidence)
        for neighbor in neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, current_depth + 1))
                if len(visited) >= max_nodes:
                    break

    return list(visited)
