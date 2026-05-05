"""
template_agent_workflow.py — 用於引入 (ingest) 與查詢內容圖形的範本代理程式指令碼。

此指令碼示範了代理程式應遵循的完整工作流程：
1. 閱讀 Markdown 指引檔案
2. 透過 LLM 推理提取實體/關聯
3. 呼叫 Python 方法進行持久化
4. 查詢圖形
5. 優雅地處理錯誤

請複製並改編此範本以用於您的代理程式實作。
"""

import json
import sys
from pathlib import Path

# 將工具新增至路徑
sys.path.insert(0, str(Path(__file__).parent))

from contextgraph import ContextGraphSkill


def ingest_document(skill: ContextGraphSkill, document: str) -> dict:
    """
    步驟 1：代理程式閱讀 ingestion.md 與 ontology.md
    步驟 2：代理程式使用 LLM 提取實體與關聯
    步驟 3：呼叫 Python 方法進行持久化（此處使用靜態提取進行模擬）

    在真實的代理程式中，請將靜態提取替換為 LLM 呼叫。
    """
    print(f"\n[引入] 正在處理文件：\n{document}\n")

    # --- 步驟 1 與 2：LLM 提取階段（由 ingestion.md + ontology.md 指引） ---
    # 在真實的代理程式中，這將使用 LLM 推理。
    # 目前我們將模擬一個提取結果：

    extraction_result = {
        "entities": [
            {"name": "記憶體洩漏", "type": "issue"},
            {"name": "系統崩潰", "type": "issue"},
            {"name": "物件", "type": "component"},
        ],
        "relations": [
            {
                "source": "記憶體洩漏",
                "target": "系統崩潰",
                "type": "causes",
                "confidence": 1.0,
            },
            {
                "source": "物件",
                "target": "記憶體洩漏",
                "type": "contributes to",
                "confidence": 0.9,
            },
        ],
    }

    print(f"[LLM] 已提取的實體 + 關聯：")
    print(json.dumps(extraction_result, indent=2, ensure_ascii=False))

    # --- 步驟 3：持久化階段（呼叫 Python 方法） ---
    errors = []
    added_nodes = {}

    for entity in extraction_result["entities"]:
        try:
            node_id = skill.add_node(entity["name"], entity["type"])
            added_nodes[entity["name"]] = node_id
            print(f"  ✓ 已新增節點：{entity['name']} (id: {node_id}, 類型：{entity['type']})")
        except Exception as e:
            errors.append(f"無法新增節點 {entity['name']}：{e}")
            print(f"  ✗ 新增節點時發生錯誤 {entity['name']}：{e}")

    for relation in extraction_result["relations"]:
        # 驗證兩個端點是否存在
        if relation["source"] not in added_nodes or relation["target"] not in added_nodes:
            error_msg = f"無法新增邊緣：來源或目標缺失"
            errors.append(error_msg)
            print(f"  ✗ 跳過邊緣 {relation['source']} → {relation['target']}：{error_msg}")
            continue

        # 驗證信賴度門檻值
        if relation["confidence"] < 0.6:
            error_msg = f"信賴度 {relation['confidence']} < 0.6（最低門檻值）"
            errors.append(error_msg)
            print(f"  ✗ 跳過邊緣 {relation['source']} → {relation['target']}：{error_msg}")
            continue

        try:
            skill.add_edge(
                source_name=relation["source"],
                target_name=relation["target"],
                relation=relation["type"],
                confidence=relation["confidence"],
            )
            print(
                f"  ✓ 已新增邊緣：{relation['source']} "
                f"--[{relation['type']}]→ {relation['target']} "
                f"(信賴度：{relation['confidence']})"
            )
        except Exception as e:
            errors.append(f"無法新增邊緣 {relation['source']} → {relation['target']}：{e}")
            print(f"  ✗ 新增邊緣時發生錯誤：{e}")

    return {
        "success": len(errors) == 0,
        "nodes_added": len(added_nodes),
        "edges_added": len(extraction_result["relations"]) - len(
            [e for e in errors if "skip edge" in e.lower() or "跳過邊緣" in e]
        ),
        "errors": errors,
    }


def query_graph(skill: ContextGraphSkill, query: str) -> dict:
    """
    查詢圖形以獲取內容，從而回答使用者的問題。

    步驟 1：閱讀 retrieval.md
    步驟 2：呼叫 skill.query()，其內部處理 BFS + 子圖提取
    步驟 3：回傳結構化內容
    """
    print(f"\n[查詢] {query}\n")

    try:
        subgraph = skill.query(query)

        if not subgraph["nodes"]:
            print("  ℹ 在圖形中找不到相關實體。")
            return {
                "success": True,
                "query": query,
                "subgraph": subgraph,
                "nodes_found": 0,
                "edges_found": 0,
            }

        print(f"  ✓ 已檢索到具有 {len(subgraph['nodes'])} 個節點、{len(subgraph['edges'])} 條邊緣的子圖")
        print(f"\n  節點：")
        for node_id, node in subgraph["nodes"].items():
            print(f"    - {node['name']} (類型：{node['type']}, id: {node_id})")

        print(f"\n  邊緣：")
        for edge in subgraph["edges"]:
            source_name = subgraph["nodes"][edge["source"]]["name"]
            target_name = subgraph["nodes"][edge["target"]]["name"]
            print(
                f"    - {source_name} --[{edge['type']}]→ {target_name} "
                f"(信賴度：{edge['confidence']})"
            )

        return {
            "success": True,
            "query": query,
            "subgraph": subgraph,
            "nodes_found": len(subgraph["nodes"]),
            "edges_found": len(subgraph["edges"]),
        }

    except Exception as e:
        error_msg = f"查詢失敗：{e}"
        print(f"  ✗ {error_msg}")
        return {"success": False, "query": query, "error": error_msg}


def main():
    """示範：引入一份文件，然後查詢圖形。"""
    skill = ContextGraphSkill()

    # ===== 引入 =====
    document = """
    系統崩潰源於記憶體洩漏。
    當物件未釋放時會發生記憶體洩漏。
    """

    result = ingest_document(skill, document)
    print(f"\n[引入結果] 已新增節點：{result['nodes_added']}, " f"已新增邊緣：{result['edges_added']}")
    if result["errors"]:
        print(f"錯誤：{result['errors']}")

    # ===== 檢索 =====
    queries = [
        "為什麼系統會崩潰？",
        "什麼原因導致記憶體洩漏？",
    ]

    for query in queries:
        result = query_graph(skill, query)
        if result["success"]:
            print(f"  找到節點：{result['nodes_found']}, 找到邊緣：{result['edges_found']}")
        else:
            print(f"  錯誤：{result['error']}")


if __name__ == "__main__":
    main()
