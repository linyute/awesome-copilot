# 內嵌指示 (Ingestion Instructions)

本文件定義了代理程式如何從原始文件中擷取實體 (entities) 與關係 (relations)。

---

## 步驟 1：閱讀文件 (Step 1: Read the Document)

仔細閱讀提供的文本。識別：
- **實體 (Entities)**：指的是現實世界中的物件、系統、組件、參與者、概念或事件的名詞片語。
- **關係 (Relations)**：描述一個實體如何影響、包含、導致、使用另一個實體或與之相關的動詞片語。

---

## 步驟 2：擷取實體 (Step 2: Extract Entities)

針對每個實體：
- 記錄其 **名稱**（正規化：小寫，去除首尾空白）。
- 指派一個 **類型**：分類該實體的簡短標籤（1-3 個字）。

### 實體類型範例 (Entity Type Examples)

| 實體名稱 | 建議類型 |
|-------------|---------------|
| Python 解譯器 | 軟體 (software) |
| 記憶體洩漏 | 問題 (issue) |
| 作業系統 | 系統 (system) |
| 資料庫 | 基礎架構 (infrastructure) |
| 使用者 | 參與者 (actor) |
| API 端點 | 介面 (interface) |
| 伺服器 | 基礎架構 (infrastructure) |

**規則：**
- 類型必須足夠通用，以便在不同文件間重複使用。
- **不要** 為每個實體建立唯一的類型（例如：避免 `python-interpreter-type`）。
- 使用 `ontology.md` 的正規化規則來規範化類型。

---

## 步驟 3：擷取關係 (Step 3: Extract Relations)

對於在文本中有明確連接的每一對實體：
- 記錄 **來源 (source)** 實體名稱。
- 記錄 **目標 (target)** 實體名稱。
- 記錄 **關係類型**：動詞或動詞片語（正規化：小寫）。
- 指派一個介於 0 到 1 之間的 **信心 (confidence)** 分數：
  - 1.0 = 明確陳述（「A 導致 B」）
  - 0.8 = 強烈暗示（「A 與 B 相關聯」）
  - 0.6 = 微弱暗示（「A 可能影響 B」）
  - < 0.6 = **不要** 包含

---

## 步驟 4：輸出格式 (Step 4: Output Format)

產生一個採用此精確格式的 JSON 物件：

```json
{
  "entities": [
    { "name": "實體名稱", "type": "實體類型", "supporting_text": "提到此實體的確切引文" }
  ],
  "relations": [
    {
      "source": "來源實體名稱",
      "target": "目標實體名稱",
      "type": "關係類型",
      "confidence": 0.9,
      "supporting_text": "證明此關係的確切引文"
    }
  ]
}
```

`supporting_text` 欄位是 **出處追蹤所必需的**。它必須是文件中提到或支持該實體/關係的逐字或近乎逐字的引文。這是將圖譜節點與邊緣連結回其來源的關鍵。

---

## 規則 (Rules)

- 所有名稱與類型必須為 **小寫**。
- 僅包含 **兩個實體** 皆存在於實體清單中的關係。
- **不要** 發明文本中未支持的實體或關係。
- 優先 **重複使用本體論 (ontology) 中現有的實體與關係類型**，而非建立新類型。
- 一個實體可以出現在多個關係中（作為來源或目標）。
- 務必包含 `supporting_text` — 這能實現證據檢索與稽核追蹤。

---

## 步驟 5：撰寫 Wiki 頁面（必填） (Step 5: Write Wiki Pages (Required))

在呼叫 `skill.ingest_with_content(...)` 之後，您 **必須** 撰寫 Wiki 頁面：

### 5a. 為文件撰寫總結頁面 (Write a summary page for the document)

```python
from scripts.tools import wiki_store

wiki_store.write_page(
    category="summary",
    title=f"{title} 總結",
    content=f"""---
title: {title}
source_document: {doc_id}
tags: [summary]
---

# {title}

**來源：** {source}

## 關鍵主張 (Key Claims)

{chr(10).join(f'- [[{r["source"].replace(" ", "-")}]] {r["type"]} [[{r["target"].replace(" ", "-")}]] (信心程度：{r["confidence"]})' for r in relations)}

## 實體 (Entities)

{chr(10).join(f'- [[{e["name"].replace(" ", "-")}]] ({e["type"]})' for e in entities)}

## 開放性問題 (Open Questions)

- (在此處新增閱讀文件後產生的問題)
""",
    summary=f"{title} 的總結",
)
```

### 5b. 撰寫或更新實體頁面 (Write or update entity pages)

對於尚未存在於 Wiki 中的每個 **新** 實體，撰寫實體頁面：

```python
wiki_store.write_page(
    category="entity",
    title=entity_name,
    content=f"""---
title: {entity_name}
type: {entity_type}
source_document: {doc_id}
tags: [{entity_type}]
---

# {entity_name}

(來自文件或既有知識的描述。)

## 關係 (Relations)

(列出從關係中擷取的相關實體的 Wiki 連結。)

## 提及於 (Mentioned in)

- [[{doc_id}-summary]]
""",
    summary=f"{entity_name}: {entity_type}",
)
```

對於 **現有** 的實體頁面，請閱讀目前的頁面並附加新資訊、更新關係，或標記矛盾之處。

---

## 範例 (Example)

**輸入文件：**
```
系統因記憶體洩漏而當機。
當物件未被釋放時，會發生記憶體洩漏。
```

**預期的擷取輸出：**
```json
{
  "entities": [
    { "name": "system crash", "type": "issue",     "supporting_text": "系統因記憶體洩漏而當機" },
    { "name": "memory leak",  "type": "issue",     "supporting_text": "記憶體洩漏發生在..." },
    { "name": "object",       "type": "component", "supporting_text": "物件未被釋放" }
  ],
  "relations": [
    {
      "source": "memory leak",
      "target": "system crash",
      "type": "causes",
      "confidence": 1.0,
      "supporting_text": "系統因記憶體洩漏而當機。"
    },
    {
      "source": "object",
      "target": "memory leak",
      "type": "contributes to",
      "confidence": 0.9,
      "supporting_text": "當物件未被釋放時，會發生記憶體洩漏。"
    }
  ]
}
```
