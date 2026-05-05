---
name: mini-context-graph
description: |
  一個持久性、具複合效益的知識庫，結合了 Karpathy 的 LLM Wiki 模式與結構化知識圖譜 (Knowledge Graph)。
  文件僅需內嵌一次 — LLM 會撰寫 Wiki 頁面、將實體/關係擷取至圖譜中，並儲存原始內容以供證據檢索。
  知識會不斷累積並建立交叉引用；絕不從零開始重新推導。
---

# 迷你上下文圖譜技能 (Mini Context Graph Skill)

## 核心概念 (The Core Idea)

標準的 RAG 在每次查詢時都會從頭開始重新發現知識。此技能則有所不同：

1. **Wiki 層** — LLM 撰寫並維護持久性的 Markdown 頁面（總結、實體頁面、主題綜合）。交叉引用已經存在。Wiki 隨著每次內嵌而變得更加豐富。
2. **圖譜層** — 實體 (Entities) 與關係 (Relations) 僅擷取一次，並儲存為可導航的知識圖譜。BFS 遍歷可在不重新閱讀原始碼的情況下回答結構化查詢。
3. **原始來源層** — 原始文件以不可變的方式與區塊 (chunks) 一同儲存。出處 (Provenance) 連結將圖譜中的每個節點與邊緣連結回支持它的確切文字。

> LLM 負責撰寫；Python 工具負責處理所有紀錄工作。

---

## 三個層級 (Three Layers)

| 層級 | 位置 | LLM 的工作 | Python 的工作 |
|-------|-------|-------------------|-----------------|
| **原始來源 (Raw Sources)** | `data/documents.json` | 讀取（絕不修改） | 儲存區塊 + Metadata |
| **Wiki** | `wiki/` (markdown) | 撰寫/更新頁面 | 管理 index.md + log.md |
| **圖譜 (Graph)** | `data/graph.json` | 擷取實體 + 關係 | 持久化、去重、遍歷 |

---

## ⚡ 代理程式快速入門 (⚡ Quick Start for Agents)

```python
from scripts.contextgraph import ContextGraphSkill
from scripts.tools import wiki_store

skill = ContextGraphSkill()

# ===== 使用完整的 RAG + WIKI 進行內嵌 =====
# 1. 先閱讀 references/ingestion.md 與 references/ontology.md
# 2. 擷取實體與關係 (LLM 推理步驟)
entities = [
    {"name": "memory leak",   "type": "issue",  "supporting_text": "memory leaks cause crashes"},
    {"name": "system crash",  "type": "issue",  "supporting_text": "system crashes due to memory leaks"},
]
relations = [
    {"source": "memory leak", "target": "system crash", "type": "causes",
     "confidence": 1.0, "supporting_text": "System crashes due to memory leaks."},
]

result = skill.ingest_with_content(
    doc_id="doc_001",
    title="系統當機分析",
    source="/docs/incident_report.pdf",
    raw_content="系統因記憶體洩漏而當機。當物件未被釋放時，會發生記憶體洩漏。",
    entities=entities,
    relations=relations,
)
# result = {"doc_id": "doc_001", "chunk_count": 1, "nodes_added": 2, "edges_added": 1}

# 3. 為此文件撰寫 Wiki 總結頁面
wiki_store.write_page(
    category="summary",
    title="系統當機分析總結",
    content="""---
title: 系統當機分析
source_document: doc_001
tags: [summary, incident]
---

# 系統當機分析

**來源：** incident_report.pdf

## 關鍵主張 (Key Claims)

- [[memory-leak]] 導致 [[system-crash]] (信心程度：1.0)

## 實體 (Entities)

- [[memory-leak]] (問題)
- [[system-crash]] (問題)
""",
    summary="事件報告：記憶體洩漏導致系統當機。",
)

# ===== 帶有證據的查詢 =====
result = skill.query_with_evidence("為什麼系統會當機？")
# 傳回：{"query": ..., "subgraph": ..., "supporting_documents": [...], "evidence_chain": ...}

# ===== WIKI 搜尋 (回答前先閱讀 Wiki) =====
pages = wiki_store.search_wiki("memory leak")
# 傳回：[{slug, category, path, snippet}, ...]
```

---

## 操作 (Operations)

### 內嵌 (Ingest)

當使用者提供新文件時：

1. 閱讀 `references/ingestion.md` — 實體/關係擷取規則。
2. 閱讀 `references/ontology.md` — 類型標準化規則。
3. 使用您的 LLM 推理功能擷取實體與關係。
4. 呼叫 `skill.ingest_with_content(...)` — 儲存原始內容 + 區塊 + 圖譜節點 + 出處。
5. 使用 `wiki_store.write_page(category="summary", ...)` **撰寫 Wiki 總結頁面**。
6. **更新實體頁面** — 對於每個新增/更新的實體，撰寫或更新 `wiki_store.write_page(category="entity", ...)`。
7. 如果文件觸及現有的綜合主題，則 **更新主題頁面**。
8. 單次文件內嵌通常會觸及 3–10 個 Wiki 頁面。

### 查詢 (Query)

當使用者提出問題時：

1. **先檢查 Wiki** — 透過 `wiki_store.search_wiki(query)` 尋找相關頁面並閱讀。
2. 如果 Wiki 已有完善答案，則從 Wiki 頁面進行綜合 (快速路徑)。
3. 如果需要更深入的圖譜遍歷，請呼叫 `skill.query_with_evidence(query)`。
4. 傳回答案，並附帶來自 `supporting_documents` 的證據引用。
5. 如果答案具有價值，將其作為新的 Wiki 主題頁面歸檔。

### 檢查 (Lint)

定期對 Wiki 進行健康檢查：

```python
from scripts.tools import wiki_store
issues = wiki_store.lint_wiki()
# 傳回：{orphan_pages, missing_pages, broken_wikilinks, isolated_pages}
```

要求 LLM 審查並修復：斷掉的連結、孤立頁面、過時的主張、缺失的交叉引用。完整檢查工作流程請參閱 `references/lint.md`。

---

## 內嵌限制 (Ingestion Constraints)

- ❌ **不要** 虛構文本中不存在的實體。
- ❌ **不要** 在沒有明確文本證據的情況下新增關係。
- ❌ **不要** 新增信心程度 < 0.6 的邊緣。
- ✅ 為每個實體與關係提供 `supporting_text` — 這能實現出處追蹤。
- ✅ 為每個內嵌的文件撰寫 Wiki 總結頁面。
- ✅ 當有新資訊到達時，更新現有的實體頁面。
- ✅ 當新資料與舊主張衝突時，在 Wiki 頁面中標記矛盾。

---

## 檢索限制 (Retrieval Constraints)

- 🔒 遍歷深度 **絕不能** 超過 2 (設定：MAX_GRAPH_DEPTH)。
- 🔒 僅包含信心程度 ≥ 0.6 的邊緣 (設定：MIN_CONFIDENCE)。
- 🔒 最多傳回 50 個節點 (設定：MAX_NODES)。
- ❌ **不要** 捏造圖譜中不存在的節點或邊緣。

---

## 完整 Python API 參考 (Full Python API Reference)

| 方法 | 用途 | 何時使用 |
|--------|---------|-------------|
| `skill.ingest_with_content(doc_id, title, source, raw_content, entities, relations)` | 完整的 RAG 內嵌：原始文件 + 圖譜 + 出處 | 每一份新文件 |
| `skill.add_node(name, node_type)` | 新增單一實體（無出處） | 無來源文件的快速新增 |
| `skill.add_edge(source_name, target_name, relation, confidence)` | 新增單一關係 | 無來源文件的快速新增 |
| `skill.query(query)` | 僅限圖譜的檢索 → 子圖 | 結構化查詢 |
| `skill.query_with_evidence(query)` | 圖譜 + 出處 → 子圖 + 來源區塊 | 需要引用的查詢 |
| `wiki_store.write_page(category, title, content, summary)` | 撰寫/更新 Wiki 頁面 | 每次內嵌後；回答查詢後 |
| `wiki_store.read_page(category, title)` | 讀取 Wiki 頁面 | 回答前；用於交叉引用 |
| `wiki_store.search_wiki(query)` | 跨 Wiki 的關鍵字搜尋 | 圖譜遍歷前的快速路徑 |
| `wiki_store.list_pages(category)` | 列出所有 Wiki 頁面 | 獲取概觀 |
| `wiki_store.get_log(last_n)` | 讀取近期操作 | 瞭解 Wiki 歷史 |
| `wiki_store.lint_wiki()` | 健康檢查 | 定期維護 |
| `documents_store.list_documents()` | 列出所有內嵌的原始來源 | 稽核 / 出處檢查 |
| `documents_store.search_chunks(query)` | 區塊層級搜尋 | 尋找特定證據 |

---

## 設計哲學 (Design Philosophy)

> 「Wiki 是一個持久性的、具複合效益的產物。交叉引用已經存在。綜合內容已經反映了您閱讀過的所有內容。」— Karpathy

| 層級 | 發生了什麼 | 負責方 |
|-------|-----------|-------------|
| **LLM 推理** | 擷取、綜合、撰寫 Wiki 頁面 | 代理程式 (.md 指導檔案) |
| **Wiki 持久化** | 索引、日誌、檔案 I/O | `wiki_store.py` |
| **圖譜持久化** | 去重、索引、BFS 遍歷 | `graph_store.py`, `retrieval_engine.py` |
| **原始來源儲存** | 不可變文件 + 區塊 + 出處 | `documents_store.py` |

人類負責策劃來源並提出問題。LLM 負責撰寫 Wiki、擷取圖譜並提供帶有引用的答案。Python 負責處理所有紀錄工作。
