# 檢查指示 (Lint Instructions)

本文件定義了 Wiki 健康檢查的工作流程。

定期執行此流程（或在完成大量內嵌後）以保持 Wiki 的乾淨與準確。此模式源自 Karpathy 的 LLM Wiki：偵測矛盾、孤立頁面、損壞的連結、過時的主張以及資料差距。

---

## 何時執行 (When to Run)

- 內嵌 5 份以上的文件後。
- 當使用者要求「檢查 Wiki」或「健康檢查」時。
- 當答案看起來不一致或相互矛盾時。
- 在進行重大綜合或簡報之前。

---

## 步驟 1：執行自動化健康檢查 (Step 1: Run the Automated Health Check)

```python
from scripts.tools import wiki_store

issues = wiki_store.lint_wiki()
# 傳回：
# {
#   "orphan_pages": [存在於檔案中但不在索引中的 slug 清單],
#   "missing_pages": [存在於索引中但檔案已刪除的 slug 清單],
#   "broken_wikilinks": {slug: [損壞的連結目標]},
#   "isolated_pages": [完全沒有 Wiki 連結的 slug],
# }
```

---

## 步驟 2：針對各類問題進行分類處理 (Step 2: Triage Each Issue Type)

### 孤立頁面 (Orphan Pages)
頁面存在於磁碟上，但不在索引中。它們在搜尋中是不可見的。
**修復**：將其新增至索引或在過時時刪除。

```python
# 若要新增至索引，請重新寫入該頁面（這會自動更新索引）：
wiki_store.write_page(category="...", title="...", content=現有內容)

# 若要刪除（手動步驟 — 請先與使用者確認）：
# rm wiki/{category}/{slug}.md
```

### 缺失頁面 (Missing Pages)
存在於索引中，但檔案已被刪除。屬於懸空引用。
**修復**：根據知識重建頁面，或從索引中移除。

### 損壞的 Wiki 連結 (Broken Wikilinks)
指向不存在頁面的 `[[slug]]` 引用。
**修復**：建立缺失的頁面，或更正連結。

### 隔離頁面 (Isolated Pages)
沒有任何 `[[wikilinks]]` 的頁面 — 無法透過連結遍歷到達。
**修復**：新增連往/來自相關頁面的連結。

---

## 步驟 3：檢查矛盾之處 (Step 3: Check for Contradictions)

閱讀 Wiki 索引並掃描可能相互矛盾的頁面：

```python
pages = wiki_store.list_pages()
# 傳回 [{slug, category, summary, date}, ...]
```

尋找：
- 不同頁面中具有衝突「類型 (type)」的同一個實體。
- 不同頁面中具有不同方向的同一個關係。
- 更新/取代舊主張的較新內嵌內容。

**當您發現矛盾時：**
- 在相關實體/主題頁面中新增一個 `## 矛盾 (Contradictions)` 區塊：
  ```markdown
  ## 矛盾
  - doc_001 說 X；doc_003 說非 X — 尚未解決
  ```
- 在日誌中標記：
  ```python
  # 由 wiki_store.write_page 處理，該函式會自動附加至 log.md
  ```

---

## 步驟 4：檢查過時的主張 (Step 4: Check for Stale Claims)

審閱 N 天前內嵌的頁面（使用索引中的 `date` 欄位）。
詢問：「是否有任何較新的文件取代了此主張？」

**當主張過時時：**
- 更新頁面：新增一個 `## 已被取代 (Superseded)` 區塊或更新內文。
- 將舊主張標記為 _(已由 [[newer-doc-summary]] 取代)_。

---

## 步驟 5：檢查缺失的交叉引用 (Step 5: Check for Missing Cross-References)

對於每個實體頁面，檢查：它是否連結回所有提及它的總結頁面？
對於每個總結頁面，檢查：它是否連結至所有它所擷取的實體頁面？

**修復**：閱讀頁面並新增缺失的 `[[slug]]` 連結。

---

## 步驟 6：識別資料差距 (Step 6: Identify Data Gaps)

審閱缺乏以下內容的實體頁面：
- 適當的描述（僅為存根 stub）。
- 任何 `## 關係 (Relations)` 區塊。
- 任何 `## 提及於 (Mentioned in)` 連結。

這些是值得進行深入研究或新內嵌的候選對象。

---

## 步驟 7：記錄檢查過程 (Step 7: Log the Lint Pass)

```python
# wiki_store.write_page 會自動記錄活動。
# 針對手動檢查總結，請透過對某個主題執行 write_page 來附加至 log.md：
wiki_store.write_page(
    category="topic",
    title="檢查通過 YYYY-MM-DD",
    content="# 檢查通過\n\n## 發現的問題\n\n...\n\n## 已修復\n\n...",
    summary="檢查結果",
)
```

---

## 快速檢查指令 (Quick Lint Commands)

```python
from scripts.tools import wiki_store

# 完整健康檢查
issues = wiki_store.lint_wiki()

# 取得近期歷史
log = wiki_store.get_log(last_n=10)

# 列出所有頁面
all_pages = wiki_store.list_pages()

# 跨 Wiki 搜尋某個概念
results = wiki_store.search_wiki("memory leak")
```

---

## 規則 (Rules)

- **絕不** 在未經使用者確認的情況下刪除頁面。
- **絕不** 自動解決矛盾 — 請標記給人工審核。
- 將所有檢查結果作為 Wiki 中的一個主題頁面歸檔（以便歷史記錄可見）。
- 優先新增交叉引用，而非重寫現有內容。
