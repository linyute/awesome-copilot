---
name: arize-annotation
description: "當建立、管理或使用 Arize 標註組態 (類別型、連續型、自由格式)，或透過 Python SDK 對專案 Span 進行人工標註時，呼叫此技能。組態是在 Arize UI 中對 Span 與其他介面進行人工回饋的標籤結構定義 (Schema)。觸發詞：標註組態、標籤結構定義、人工回饋結構定義、批次標註 Span、update_annotations。"
---

# Arize 標註技能 (Arize Annotation Skill)

此技能專注於**標註組態 (Annotation configs)** — 即人工回饋標籤的結構定義 — 以及透過 Python SDK **以程式化方式標註專案 Span**。Arize UI 中的人工審查 (包括標註佇列、資料集與實驗) 仍依賴這些組態；目前尚無用於佇列的 `ax` CLI。

**方向：** Arize 中的人工標註會將組態定義的數值附加到產品 UI 中的 **Span**、**資料集範例**、**實驗相關記錄**以及**佇列項目**。此文件涵蓋的內容包括：`ax annotation-configs` 指令，以及使用 `ArizeClient.spans.update_annotations` 進行的批次 Span 更新。

---

## 先決條件

直接開始執行工作 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔。

若 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` (找不到指令) 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` (未經授權) / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前的設定檔。若缺少設定檔或 API 金鑰錯誤：檢查 `.env` 檔案中是否有 `ARIZE_API_KEY`，並使用它透過 references/ax-profiles.md 建立/更新設定檔。若 `.env` 中也沒有金鑰，請向使用者詢問其 Arize API 金鑰 (https://app.arize.com/admin > API Keys)
- 空間 ID (Space ID) 未知 → 檢查 `.env` 中的 `ARIZE_SPACE_ID`，或執行 `ax spaces list -o json`，或詢問使用者

---

## 概念

### 什麼是標註組態 (Annotation Config)？

**標註組態**定義了單一類型人工回饋標籤的結構定義。在任何人標註 Span、資料集記錄、實驗輸出或佇列項目之前，空間中必須先存在該標籤的組態。

| 欄位 | 說明 |
|-------|-------------|
| **名稱 (Name)** | 描述性識別碼 (例如：`Correctness`, `Helpfulness`)。在空間中必須是唯一的。 |
| **類型 (Type)** | `categorical` (類別型，從列表中選取)、`continuous` (連續型，數值範圍) 或 `freeform` (自由格式，自由文字)。 |
| **數值 (Values)** | 類別型：`{"label": str, "score": number}` 鍵值對的陣列。 |
| **最小/最大分數** | 連續型：數值邊界。 |
| **優化方向** | 分數越高是越好 (`maximize`) 還是越差 (`minimize`)。用於在 UI 中呈現趨勢。 |

### 標籤套用的位置 (介面)

| 介面 | 典型路徑 |
|---------|----------------|
| **專案 Span** | Python SDK `spans.update_annotations` (如下所示) 及/或 Arize UI |
| **資料集範例** | Arize UI (人工標註流程)；空間中必須存在組態 |
| **實驗輸出** | 通常在 UI 中隨資料集或追蹤 (Trace) 一併審查 — 參閱 arize-experiment, arize-dataset |
| **標註佇列項目** | Arize UI；必須存在組態 — 此處尚未記錄 `ax` 佇列指令 |

請務必確保空間中存在相關的**標註組態**，標籤才能成功持久化。

---

## 基本 CRUD：標註組態

### 列出 (List)

```bash
ax annotation-configs list --space-id SPACE_ID
ax annotation-configs list --space-id SPACE_ID -o json
ax annotation-configs list --space-id SPACE_ID --limit 20
```

### 建立 (Create) — 類別型 (Categorical)

類別型組態提供一組固定的標籤供審查人員選擇。

```bash
ax annotation-configs create \
  --name "Correctness" \
  --space-id SPACE_ID \
  --type categorical \
  --values '[{"label": "correct", "score": 1}, {"label": "incorrect", "score": 0}]' \
  --optimization-direction maximize
```

常見的二元標籤對：
- `correct` (正確) / `incorrect` (不正確)
- `helpful` (有幫助) / `unhelpful` (無幫助)
- `safe` (安全) / `unsafe` (不安全)
- `relevant` (相關) / `irrelevant` (不相關)
- `pass` (通過) / `fail` (失敗)

### 建立 (Create) — 連續型 (Continuous)

連續型組態讓審查人員在定義的範圍內輸入數值分數。

```bash
ax annotation-configs create \
  --name "Quality Score" \
  --space-id SPACE_ID \
  --type continuous \
  --minimum-score 0 \
  --maximum-score 10 \
  --optimization-direction maximize
```

### 建立 (Create) — 自由格式 (Freeform)

自由格式組態收集開放式文字回饋。除了名稱、空間和類型外，不需要額外旗標。

```bash
ax annotation-configs create \
  --name "Reviewer Notes" \
  --space-id SPACE_ID \
  --type freeform
```

### 獲取 (Get)

```bash
ax annotation-configs get ANNOTATION_CONFIG_ID
ax annotation-configs get ANNOTATION_CONFIG_ID -o json
```

### 刪除 (Delete)

```bash
ax annotation-configs delete ANNOTATION_CONFIG_ID
ax annotation-configs delete ANNOTATION_CONFIG_ID --force   # 跳過確認
```

**注意：** 刪除操作不可逆。產品中與此組態關聯的所有標註佇列也會被移除 (佇列本身可能保留；如有需要，請在 Arize UI 中修復關聯)。

---

## 將標註套用至 Span (Python SDK)

當您已有標籤時 (例如：來自審查匯出或外部標註工具)，請使用 Python SDK 將標註批次套用至**專案 Span**。

```python
import pandas as pd
from arize import ArizeClient

import os

client = ArizeClient(api_key=os.environ["ARIZE_API_KEY"])

# 建立包含標註欄位的 DataFrame
# 必要欄位：context.span_id + 至少一個 annotation.<name>.label 或 annotation.<name>.score
annotations_df = pd.DataFrame([
    {
        "context.span_id": "span_001",
        "annotation.Correctness.label": "correct",
        "annotation.Correctness.updated_by": "reviewer@example.com",
    },
    {
        "context.span_id": "span_002",
        "annotation.Correctness.label": "incorrect",
        "annotation.Correctness.updated_by": "reviewer@example.com",
    },
])

response = client.spans.update_annotations(
    space_id=os.environ["ARIZE_SPACE_ID"],
    project_name="your-project",
    dataframe=annotations_df,
    validate=True,
)
```

**DataFrame 欄位結構定義 (Schema)：**

| 欄位 | 必要 | 說明 |
|--------|----------|-------------|
| `context.span_id` | 是 | 要標註的 Span |
| `annotation.<name>.label` | 二擇一 | 類別型或自由格式標籤 |
| `annotation.<name>.score` | 二擇一 | 數值分數 |
| `annotation.<name>.updated_by` | 否 | 標註人員識別碼 (電子郵件或名稱) |
| `annotation.<name>.updated_at` | 否 | 自 Unix 紀元以來的毫秒數時間戳記 |
| `annotation.notes` | 否 | 關於該 Span 的自由格式備註 |

**限制：** 標註僅適用於提交前 31 天內的 Span。

---

## 疑難排解

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰可能無權存取此空間。請至 https://app.arize.com/admin > API Keys 進行驗證 |
| `Annotation config not found` | 執行 `ax annotation-configs list --space-id SPACE_ID` |
| `409 Conflict on create` | 該空間中已存在同名組態。請使用不同名稱或獲取現有組態 ID。 |
| UI 中的人工審查 / 佇列 | 請使用 Arize 應用程式；確保組態存在 — 目前尚無 `ax` 標註佇列 CLI |
| Span SDK 錯誤或缺少 Span | 確認 `project_name`、`space_id` 與 Span ID；使用 arize-trace 匯出 Span |

---

## 相關技能

- **arize-trace**：匯出 Span 以尋找 Span ID 與時間範圍
- **arize-dataset**：尋找資料集 ID 與範例 ID
- **arize-evaluator**：自動化 LLM 作為評判，輔助人工標註
- **arize-experiment**：與資料集及評估工作流程繫結的實驗
- **arize-link**：Arize UI 中標註組態與佇列的深層連結

---

## 儲存認證資訊供未來使用

參閱 references/ax-profiles.md § 儲存認證資訊供未來使用。
