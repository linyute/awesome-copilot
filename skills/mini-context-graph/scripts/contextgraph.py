"""
contextgraph.py — 內容圖形技能 (Context Graph Skill) 的主要介面。

此檔案僅用於協作。所有 LLM 推理邏輯均存在於 .md 檔案中。
此處的 Python 僅將確定性的儲存與檢索工具連接在一起。

代理程式用法：
- ingest()：代理程式閱讀 ingestion.md + ontology.md，提取實體/關聯，
            然後直接呼叫工具方法。
- query()：代理程式閱讀 retrieval.md，呼叫 index_store.search + retrieval_engine.retrieve，
            然後呼叫 graph_store.get_subgraph 並回傳結果。
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import config
from tools import graph_store, index_store, ontology_store, retrieval_engine, documents_store


class ContextGraphSkill:

    def ingest(self, documents: list[str]) -> None:
        """
        引入文件至內容圖形的協作進入點。

        代理程式 (Copilot) 必須：
          1. 閱讀 ingestion.md 以了解實體/關聯提取規則。
          2. 閱讀 ontology.md 以套用類型標準化。
          3. 為每份文件產生一個包含實體 + 關聯的 JSON。
          4. 對於每個實體：
             - ontology_store.add_type(entity["type"])
             - node_id = graph_store.add_node(entity["name"], entity["type"])
             - index_store.add_entity(entity["name"], node_id)
          5. 對於每個關聯（如果信賴度 >= MIN_CONFIDENCE）：
             - ontology_store.add_relation(relation["type"])
             - source_id = graph_store.find_node_by_name(relation["source"])
             - target_id = graph_store.find_node_by_name(relation["target"])
             - graph_store.add_edge(source_id, target_id, relation["type"], relation["confidence"])

        此方法不會呼叫任何 LLM。它僅用於記載代理程式合約。
        """
        raise NotImplementedError(
            "ingest() 必須由遵循 ingestion.md 的 Copilot 代理程式驅動。"
            "在 LLM 提取後直接呼叫工具方法。"
        )

    def query(self, query: str) -> dict:
        """
        為查詢檢索子圖的協作進入點。

        代理程式 (Copilot) 必須：
          1. 閱讀 retrieval.md 以了解檢索策略。
          2. 呼叫 index_store.search(query) 以獲取種子 node_ids。
          3. 呼叫 retrieval_engine.retrieve(seed_ids, depth=MAX_GRAPH_DEPTH) 進行擴展。
          4. 呼叫 graph_store.get_subgraph(node_ids) 以建構結果。
          5. 回傳子圖字典。

        此方法不會呼叫任何 LLM。它僅用於記載代理程式合約。
        如果直接呼叫，則回傳空子圖。
        """
        seed_ids = index_store.search(query)
        if not seed_ids:
            return {"nodes": {}, "edges": []}

        node_ids = retrieval_engine.retrieve(
            seed_ids,
            depth=config.MAX_GRAPH_DEPTH,
            min_confidence=config.MIN_CONFIDENCE,
            max_nodes=config.MAX_NODES,
        )
        return graph_store.get_subgraph(node_ids)

    # ------------------------------------------------------------------
    # 便利包裝函式 — 代理程式可直接呼叫這些
    # ------------------------------------------------------------------

    def add_node(self, name: str, node_type: str) -> str:
        """將節點新增至圖形與索引。回傳 node_id。"""
        canonical_type = ontology_store.normalize_type(node_type)
        ontology_store.add_type(canonical_type)
        node_id = graph_store.add_node(name, canonical_type)
        index_store.add_entity(name, node_id)
        return node_id

    def add_edge(
        self, source_name: str, target_name: str, relation: str, confidence: float
    ) -> None:
        """如果兩個節點均存在且信賴度符合要求，則在它們之間新增邊緣（透過名稱）。"""
        if confidence < config.MIN_CONFIDENCE:
            return

        source_id = graph_store.find_node_by_name(source_name)
        target_id = graph_store.find_node_by_name(target_name)
        if source_id is None or target_id is None:
            return

        canonical_relation = ontology_store.normalize_relation(relation)
        ontology_store.add_relation(canonical_relation)
        graph_store.add_edge(source_id, target_id, canonical_relation, confidence)

    # ------------------------------------------------------------------
    # LLM Wiki + RAG 方法 — 儲存原始內容與來源指標
    # ------------------------------------------------------------------

    def ingest_with_content(
        self,
        doc_id: str,
        title: str,
        source: str,
        raw_content: str,
        entities: list[dict],
        relations: list[dict],
    ) -> dict:
        """
        完整 RAG 引入：儲存原始文件 + 區塊，然後將每個圖形節點/邊緣的來源指標
        連結回原始區塊。

        代理程式必須：
          1. 閱讀 raw_content。
          2. 閱讀 ingestion.md 與 ontology.md 以了解提取規則。
          3. 提取實體與關聯（LLM 推理步驟）。
          4. 攜帶結果呼叫此方法。

        參數：
            doc_id:      穩定的文件識別碼（例如 "doc_001"）。
            title:       人類可讀的文件標題。
            source:      來源路徑或 URL（不可變，從不修改）。
            raw_content: 文件的完整文字。
            entities:    字典列表：[{name, type, supporting_text?}, ...]
            relations:   字典列表：[{source, target, type, confidence,
                                          supporting_text?, chunk_hint?}, ...]

        回傳：
            摘要字典：{doc_id, chunk_count, nodes_added, edges_added}
        """
        # 步驟 1：儲存原始文件並自動區塊化
        doc = documents_store.add_document(doc_id, title, source, raw_content)
        chunks = doc["chunks"]

        def _find_best_chunk(text: str) -> str | None:
            """尋找與給定跨度重疊最多的文字區塊。"""
            if not text or not chunks:
                return None
            text_lower = text.lower()
            best_chunk_id = None
            best_score = 0
            for chunk in chunks:
                if text_lower in chunk["text"].lower():
                    return chunk["chunk_id"]
                # 備援：計算重疊單字數
                words_text = set(text_lower.split())
                words_chunk = set(chunk["text"].lower().split())
                score = len(words_text & words_chunk)
                if score > best_score:
                    best_score = score
                    best_chunk_id = chunk["chunk_id"]
            return best_chunk_id

        nodes_added = 0
        # 步驟 2：引入帶有來源指標的實體
        for entity in entities:
            supporting = entity.get("supporting_text", "")
            chunk_id = _find_best_chunk(supporting)
            chunk_ids = [chunk_id] if chunk_id else []

            canonical_type = ontology_store.normalize_type(entity["type"])
            ontology_store.add_type(canonical_type)
            node_id = graph_store.add_node(
                entity["name"],
                canonical_type,
                source_document=doc_id,
                source_chunks=chunk_ids,
            )
            index_store.add_entity(entity["name"], node_id)
            nodes_added += 1

        edges_added = 0
        # 步驟 3：引入帶有來源指標的關聯
        for rel in relations:
            if rel.get("confidence", 0) < config.MIN_CONFIDENCE:
                continue

            supporting = rel.get("supporting_text", "")
            chunk_id = _find_best_chunk(supporting) or rel.get("chunk_hint")

            source_id = graph_store.find_node_by_name(rel["source"])
            target_id = graph_store.find_node_by_name(rel["target"])
            if source_id is None or target_id is None:
                continue

            canonical_relation = ontology_store.normalize_relation(rel["type"])
            ontology_store.add_relation(canonical_relation)
            graph_store.add_edge(
                source_id,
                target_id,
                canonical_relation,
                rel["confidence"],
                source_document=doc_id,
                supporting_text=supporting or None,
                chunk_id=chunk_id,
            )
            edges_added += 1

        return {
            "doc_id": doc_id,
            "chunk_count": len(chunks),
            "nodes_added": nodes_added,
            "edges_added": edges_added,
        }

    def query_with_evidence(self, query: str) -> dict:
        """
        查詢圖形並回傳子圖，以及支持的原始文件與區塊（證據鏈）。

        回傳：
            {
              "query": str,
              "subgraph": {"nodes": {...}, "edges": [...]},
              "supporting_documents": [
                {
                  "doc_id": str,
                  "doc_title": str,
                  "supporting_chunks": [{"chunk_id": str, "text": str}, ...]
                }
              ],
              "evidence_chain": str   # 人類可讀的摘要路徑
            }
        """
        subgraph = self.query(query)
        if not subgraph["nodes"]:
            return {
                "query": query,
                "subgraph": subgraph,
                "supporting_documents": [],
                "evidence_chain": "未找到匹配節點。",
            }

        # 收集來自節點與邊緣的所有來源指標
        docs_chunks: dict[str, list[str]] = {}  # doc_id -> [chunk_ids]

        for node in subgraph["nodes"].values():
            doc_id = node.get("source_document")
            if doc_id:
                docs_chunks.setdefault(doc_id, [])
                docs_chunks[doc_id].extend(node.get("source_chunks") or [])

        for edge in subgraph["edges"]:
            doc_id = edge.get("source_document")
            if doc_id:
                docs_chunks.setdefault(doc_id, [])
                if edge.get("chunk_id"):
                    docs_chunks[doc_id].append(edge["chunk_id"])

        # 從 documents_store 解析區塊文字
        supporting_documents = []
        for doc_id, chunk_ids in docs_chunks.items():
            doc = documents_store.get_document(doc_id)
            if doc is None:
                continue
            seen = set()
            chunks_out = []
            for cid in chunk_ids:
                if cid in seen:
                    continue
                seen.add(cid)
                chunk = documents_store.get_chunk(cid)
                if chunk:
                    chunks_out.append({"chunk_id": cid, "text": chunk["text"]})
            if chunks_out:
                supporting_documents.append({
                    "doc_id": doc_id,
                    "doc_title": doc["title"],
                    "supporting_chunks": chunks_out,
                })

        # 建構一個簡單的證據鏈字串
        chain_parts = []
        for edge in subgraph["edges"]:
            src_node = subgraph["nodes"].get(edge["source"], {})
            tgt_node = subgraph["nodes"].get(edge["target"], {})
            src_name = src_node.get("name", edge["source"])
            tgt_name = tgt_node.get("name", edge["target"])
            chain_parts.append(f"{src_name} --[{edge['type']}]--> {tgt_name}")
        evidence_chain = " | ".join(chain_parts) if chain_parts else "子圖中沒有邊緣。"

        return {
            "query": query,
            "subgraph": subgraph,
            "supporting_documents": supporting_documents,
            "evidence_chain": evidence_chain,
        }
