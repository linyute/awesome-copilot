# 本體論指示 (Ontology Instructions)

本文件定義了維護與演進上下文圖譜所使用的動態本體論 (Ontology) 的規則。

---

## 核心原則 (Core Principle)

本體論 **並非固定不變的**。類型與關係會隨著文件內嵌而出現。
然而，本體論必須保持 **精簡、一致且可重複使用**。

---

## 實體類型規則 (Entity Type Rules)

### 正規化 (Normalization)

在指派實體類型時，請套用以下轉換：
1. 轉換為 **小寫**。
2. 去除首尾空白。
3. 將底線與連字號替換為空格。
4. 使用下方的映射表合併同義類型。

### 同義詞映射（實體類型） (Synonym Mapping (Entity Types))

| 變體 | 標準類型 (Canonical Type) |
|---------|---------------|
| component, module, class, function | 組件 (component) |
| bug, defect, fault, error, failure | 問題 (issue) |
| server, host, machine, node | 基礎架構 (infrastructure) |
| user, person, operator, admin, actor | 參與者 (actor) |
| app, application, service, program, software | 軟體 (software) |
| database, datastore, db, storage | 儲存 (storage) |
| api, endpoint, interface, connection | 介面 (interface) |
| event, incident, occurrence, trigger | 事件 (event) |
| concept, idea, principle, theory | 概念 (concept) |
| process, thread, task, job, workflow | 程序 (process) |

### 新增類型 (Adding New Types)

如果實體不符合任何現有類型：
- 若其確實獨特，則建立一個 **新類型**。
- 保持標籤簡短（1-3 個字，小寫）。
- 在建立新類型前，考慮現有類型是否足夠接近。

### 限制 (Constraint)

- 整個本體論中最多約 50 個不同的實體類型。
- 若接近上限，請合併相似類型而非建立新類型。

---

## 關係類型規則 (Relation Type Rules)

### 正規化 (Normalization)

在指派關係類型時：
1. 轉換為 **小寫**。
2. 去除空白。
3. 使用 **現在式** 的動詞片語（例如：「導致 (causes)」、「包含 (contains)」、「使用 (uses)」）。
4. 使用下方的映射表合併同義詞。

### 同義詞映射（關係類型） (Synonym Mapping (Relation Types))

| 變體 | 標準關係 (Canonical Relation) |
|---------|-------------------|
| triggers, leads to, results in, produces | 導致 (causes) |
| is part of, belongs to, lives in, sits in | 包含 (contains) |
| depends on, requires, needs | 依賴於 (depends on) |
| uses, calls, invokes, consumes | 使用 (uses) |
| affects, impacts, influences | 影響 (affects) |
| creates, instantiates, spawns | 建立 (creates) |
| connects to, links to, references | 連結至 (connects to) |
| inherits from, extends, subclasses | 擴充 (extends) |
| reads from, queries, fetches | 讀取自 (reads from) |
| writes to, stores in, persists to | 寫入至 (writes to) |

### 新增關係 (Adding New Relations)

- 僅在沒有現有類型能準確描述該關係時，才新增關係類型。
- 優先使用標準關係而非建立新關係。

---

## 本體論更新協定 (Ontology Update Protocol)

在處理從 `ingestion.md` 擷取的實體/關係時：

1. 針對每個實體類型：
   - 執行同義詞映射。
   - 呼叫 `ontology_store.normalize_type(type_name)` 取得標準形式。
   - 呼叫 `ontology_store.add_type(canonical_type)` 進行註冊。

2. 針對每個關係類型：
   - 執行同義詞映射。
   - 呼叫 `ontology_store.normalize_relation(relation_name)` 取得標準形式。
   - 呼叫 `ontology_store.add_relation(canonical_relation)` 進行註冊。

3. 在圖譜中建立節點與邊緣時，請使用 **標準 (canonical)** 的類型/關係名稱。
