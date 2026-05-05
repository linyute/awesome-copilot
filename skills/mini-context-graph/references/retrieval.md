# 檢索指示 (Retrieval Instructions)

本文件定義了代理程式如何使用雙層檢索策略回答查詢：
**Wiki 優先**（快速路徑），接著是 **帶有證據的圖譜遍歷**（深度路徑）。

---

## 概觀 (Overview)

檢索是一個 7 步驟的流程：

1. 解析查詢。
2. **先檢查 Wiki**（快速路徑）。
3. 在圖譜中尋找種子節點 (seed nodes)。
4. 透過 BFS 擴展圖譜。
5. 修剪雜訊節點。
6. 建構帶有出處的子圖。
7. 傳回結構化上下文。

---

## 步驟 1：解析查詢 (Step 1: Parse the Query)

閱讀查詢字串並識別：
- **關鍵名詞片語**：潛在的實體名稱（例如：「系統當機」、「記憶體洩漏」）。
- **關鍵字**：個別具意義的單字（例如：「當機」、「洩漏」、「記憶體」）。
- 將所有字詞正規化為 **小寫**。

忽略停用詞（例如：「the」, 「a」, 「is」, 「why」, 「does」, 「how」, 「what」）。

---

## 步驟 2：先檢查 Wiki（快速路徑） (Step 2: Check the Wiki First (Fast Path))

在觸及圖譜之前，先搜尋 Wiki。Wiki 包含已編譯的知識 — 
交叉引用已解析、矛盾已標記、綜合內容已撰寫。

```python
from scripts.tools import wiki_store

results = wiki_store.search_wiki(query)
```

針對每個相關結果，閱讀該頁面：

```python
content = wiki_store.read_page_by_slug(result["slug"])
```

**如果 Wiki 已有充分的答案：**
- 從 Wiki 頁面進行綜合。
- 引用來源頁面（例如：「根據 [[memory-leak]] 與 [[system-crash]]...」）。
- 如果答案具有價值且尚未被記錄，將其作為新的 Wiki 主題頁面歸檔：
  ```python
  wiki_store.write_page(category="topic", title="系統當機的原因", content=..., summary=...)
  ```
- **提前傳回** — 無需圖譜遍歷。

**如果 Wiki 答案不完整或缺失：** 繼續執行步驟 3。

---

## 步驟 3：尋找種子節點 (Step 3: Find Seed Nodes)

使用原始查詢字串呼叫 `index_store.search(query)`。

這會傳回與實體名稱或關鍵字相符的節點 ID。

如果未找到種子節點：
- 嘗試使用步驟 1 中的個別關鍵字進行搜尋。
- 如果仍無結果，則傳回空子圖：「未發現相關實體。」

---

## 步驟 4：擴展圖譜 (BFS) (Step 4: Expand the Graph (BFS))

呼叫 `retrieval_engine.retrieve(seed_node_ids, depth=2)`。

從種子節點開始執行 BFS：
- **深度 1**：直接鄰居。
- **深度 2**：鄰居的鄰居。

規則：
- 僅遍歷信心程度 ≥ MIN_CONFIDENCE (來自 config.py) 的邊緣。
- **不要** 遍歷超過深度 2。
- 收集所有訪問過的節點 ID。

---

## 步驟 5：修剪節點 (Step 5: Prune Nodes)

- 將總節點數限制在 MAX_NODES (來自 config.py) 以內。
- 優先順序：
  1. 種子節點（務必包含）。
  2. 深度為 1 的節點。
  3. 深度為 2 的節點（視空間許可而定）。
- 移除僅具微弱連接的節點（邊緣信心程度 < MIN_CONFIDENCE）。

---

## 步驟 6：建構帶有出處的子圖 (Step 6: Build the Subgraph with Provenance)

對於標準查詢，呼叫：

```python
subgraph = skill.query(query)
# 傳回：{"nodes": {node_id: {name, type, source_document, source_chunks}},
#           "edges": [{source, target, type, confidence, source_document, supporting_text, chunk_id}]}
```

對於需要證據（引用、事實檢查）的查詢，呼叫：

```python
result = skill.query_with_evidence(query)
# 傳回：
# {
#   "query": str,
#   "subgraph": {"nodes": {...}, "edges": [...]},
#   "supporting_documents": [
#     {
#       "doc_id": str,
#       "doc_title": str,
#       "supporting_chunks": [{"chunk_id": str, "text": str}, ...]
#     }
#   ],
#   "evidence_chain": "memory leak --[causes]--> system crash"
# }
```

---

## 步驟 7：傳回結構化上下文 (Step 7: Return Structured Context)

傳回結果，包含：
- **子圖 (Subgraph)**：節點 + 邊緣（圖譜答案）。
- **支持文件 (Supporting documents)**：證明每個關係的來源區塊。
- **證據鏈 (Evidence chain)**：易於理解的路徑總結。
- **Wiki 參考**：連結至步驟 2 中找到的相關 Wiki 頁面。

**如果答案具有價值，將其存回 Wiki：**

```python
wiki_store.write_page(
    category="topic",
    title=query,
    content=f"# {query}\n\n**證據鏈：** {result['evidence_chain']}\n\n...",
    summary="...",
)
```

這樣一來，未來針對相同主題的查詢就能立即在 Wiki 中找到答案。

---

## 規則 (Rules)

- **絕不** 捏造圖譜中不存在的節點或邊緣。
- **絕不** 遍歷超過深度 2。
- **務必** 在檢查圖譜前先檢查 Wiki（Wiki 優先）。
- 務必在結果中包含種子節點，即使它們沒有邊緣。
- 修剪時優先選擇信心程度較高的邊緣。
- 將有價值的答案作為主題頁面存回 Wiki。
- 如果未找到相關節點，傳回空子圖（而非錯誤）。
