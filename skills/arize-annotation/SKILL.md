---
name: arize-annotation
description: "當建立、管理或使用 Arize 上的標核配置 (annotation configs) 或標核佇列 (annotation queues)（類別型、連續型、自由格式），或透過 Python SDK 對專案 Span 套用人工標核時，請叫用此技能。標核配置是人工回饋的標籤結構描述；佇列則是將記錄路由至標核人員的審核工作流程。觸發詞：標核配置、標核佇列、標籤結構描述、人工回饋結構描述、批次標核 Span、update_annotations、標記佇列、標核記錄。"
---

# Arize 標核技能 (Arize Annotation Skill)

> **`SPACE`** — 所有 `--space` 旗標與 `ARIZE_SPACE` 環境變數接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list` 查找您的資訊。

此技能涵蓋 **標核配置 (annotation configs)**（標籤結構描述）與 **標核佇列 (annotation queues)**（人工審核工作流程），以及透過 Python SDK 以程式化方式標核專案 Span。

**方向：** Arize 中的人工標記會將配置定義的值附加至產品 UI 中的 **Span**、**資料集範例**、**與實驗相關的記錄** 以及 **佇列項目**。此技能涵蓋：`ax annotation-configs`、`ax annotation-queues` 以及使用 `ArizeClient.spans.update_annotations` 進行批次 Span 更新。

---

## 先決條件 (Prerequisites)

直接進行任務 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔 (profiles)。

如果 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前設定檔。如果缺少設定檔或 API 金鑰錯誤，請遵循 references/ax-profiles.md 建立/更新。如果使用者沒有其金鑰，請引導他們前往 https://app.arize.com/admin > API Keys
- 空間 (Space) 未知 → 執行 `ax spaces list` 以按名稱選取，或詢問使用者
- **安全性：** 絕不讀取 `.env` 檔案或在檔案系統中搜尋認證。使用 `ax profiles` 獲取 Arize 認證，使用 `ax ai-integrations` 獲取 LLM 提供者金鑰。如果無法透過這些管道取得認證，請詢問使用者。

---

## 概念 (Concepts)

### 什麼是標核配置？ (What is an Annotation Config?)

**標核配置 (annotation config)** 定義了單一類型人工回饋標籤的結構描述。在任何人可以標核 Span、資料集記錄、實驗輸出或佇列項目之前，空間中必須存在該標籤的配置。

| 欄位 | 描述 |
|-------|-------------|
| **名稱 (Name)** | 描述性識別碼（例如 `Correctness`, `Helpfulness`）。在空間內必須唯一。 |
| **類型 (Type)** | `categorical`（從清單中選取）、`continuous`（數值範圍）或 `freeform`（自由文字）。 |
| **值 (Values)** | 針對類別型：`{"label": str, "score": number}` 配對的陣列。 |
| **最小/最大分數 (Min/Max Score)** | 針對連續型：數值邊界。 |
| **最佳化方向 (Optimization Direction)** | 分數越高越好 (`maximize`) 還是越低越好 (`minimize`)。用於在 UI 中呈現趨勢。 |

### 標籤套用的位置（表面）(Where labels get applied (surfaces))

| 表面 | 典型路徑 |
|---------|----------------|
| **專案 Span** | Python SDK `spans.update_annotations`（見下文）及/或 Arize UI |
| **資料集範例** | Arize UI（人工標記流程）；空間中必須存在配置 |
| **實驗輸出** | 通常在 UI 中與資料集或追蹤 (traces) 一起審查 — 參見 arize-experiment, arize-dataset |
| **標核佇列項目** | `ax annotation-queues` CLI（見下文）及/或 Arize UI；空間中必須存在配置 |

在預期標籤持久化之前，請務必確保空間中存在相關的 **標核配置**。

---

## 基本 CRUD：標核配置 (Basic CRUD: Annotation Configs)

### 列出 (List)

```bash
ax annotation-configs list --space SPACE
ax annotation-configs list --space SPACE -o json
ax annotation-configs list --space SPACE --limit 20
```

### 建立 — 類別型 (Create — Categorical)

類別型配置會呈現一組固定的標籤供審核者選擇。

```bash
ax annotation-configs create \
  --name "Correctness" \
  --space SPACE \
  --type categorical \
  --value correct \
  --value incorrect \
  --optimization-direction maximize
```

常見的二元標籤配對：
- `correct` / `incorrect`
- `helpful` / `unhelpful`
- `safe` / `unsafe`
- `relevant` / `irrelevant`
- `pass` / `fail`

### 建立 — 連續型 (Create — Continuous)

連續型配置允許審核者在定義的範圍內輸入數值分數。

```bash
ax annotation-configs create \
  --name "Quality Score" \
  --space SPACE \
  --type continuous \
  --min-score 0 \
  --max-score 10 \
  --optimization-direction maximize
```

### 建立 — 自由格式 (Create — Freeform)

自由格式配置收集開放式的文字回饋。除了名稱、空間和類型外，不需要其他旗標。

```bash
ax annotation-configs create \
  --name "Reviewer Notes" \
  --space SPACE \
  --type freeform
```

### 取得 (Get)

```bash
ax annotation-configs get NAME_OR_ID
ax annotation-configs get NAME_OR_ID -o json
ax annotation-configs get NAME_OR_ID --space SPACE   # 使用名稱而非 ID 時為必填
```

### 刪除 (Delete)

```bash
ax annotation-configs delete NAME_OR_ID
ax annotation-configs delete NAME_OR_ID --space SPACE   # 使用名稱而非 ID 時為必填
ax annotation-configs delete NAME_OR_ID --force   # 跳過確認
```

**附註：** 刪除是不可逆的。此配置的任何標核佇列關聯也將在產品中移除（佇列可能保留；如有需要，請在 Arize UI 中修復關聯）。

---

## 標核佇列：`ax annotation-queues` (Annotation Queues: `ax annotation-queues`)

標核佇列將記錄（Span、資料集範例、實驗執行）路由至人工審核者。每個佇列都連結至一個或多個標核配置，這些配置定義了審核者可以套用的標籤。

### 列出 / 取得 (List / Get)

```bash
ax annotation-queues list --space SPACE
ax annotation-queues list --space SPACE -o json

ax annotation-queues get NAME_OR_ID --space SPACE
ax annotation-queues get NAME_OR_ID --space SPACE -o json
```

### 建立 (Create)

至少需要一個 `--annotation-config-id`。

```bash
ax annotation-queues create \
  --name "Correctness Review" \
  --space SPACE \
  --annotation-config-id CONFIG_ID \
  --annotator-email reviewer@example.com \
  --instructions "將每個回應標記為 correct 或 incorrect。" \
  --assignment-method all   # 或: random
```

重複 `--annotation-config-id` 與 `--annotator-email` 以附加多個配置或審核者。

### 更新 (Update)

提供清單旗標 (`--annotation-config-id`, `--annotator-email`) 時會 **完全替換** 現有值 — 請傳遞所有想要的值，而不僅僅是新的值。

```bash
ax annotation-queues update NAME_OR_ID --space SPACE --name "New Name"
ax annotation-queues update NAME_OR_ID --space SPACE --instructions "Updated instructions"
ax annotation-queues update NAME_OR_ID --space SPACE \
  --annotation-config-id CONFIG_ID_A \
  --annotation-config-id CONFIG_ID_B
```

### 刪除 (Delete)

```bash
ax annotation-queues delete NAME_OR_ID --space SPACE
ax annotation-queues delete NAME_OR_ID --space SPACE --force   # 跳過確認
```

### 列出記錄 (List Records)

```bash
ax annotation-queues list-records NAME_OR_ID --space SPACE
ax annotation-queues list-records NAME_OR_ID --space SPACE --limit 50 -o json
```

### 提交記錄的標核 (Submit an Annotation for a Record)

標核是按配置名稱進行 Upsert 的 — 針對每個標核配置呼叫一次。提供 `--score`、`--label` 或 `--text` 中的至少一項。

```bash
ax annotation-queues annotate-record NAME_OR_ID RECORD_ID \
  --annotation-name "Correctness" \
  --label "correct" \
  --space SPACE

ax annotation-queues annotate-record NAME_OR_ID RECORD_ID \
  --annotation-name "Quality Score" \
  --score 8.5 \
  --text "回應準確，但略顯冗長。" \
  --space SPACE
```

### 分派記錄 (Assign a Record)

分派使用者審核特定記錄：

```bash
ax annotation-queues assign-record NAME_OR_ID RECORD_ID --space SPACE
```

### 刪除記錄 (Delete Records)

```bash
ax annotation-queues delete-records NAME_OR_ID --space SPACE
```

---

## 對 Span 套用標核 (Python SDK) (Applying Annotations to Spans (Python SDK))

當您已有標籤（例如來自審核匯出或外部標記工具）時，使用 Python SDK 對 **專案 Span** 進行批次套用標核。

```python
import pandas as pd
from arize import ArizeClient

import os

client = ArizeClient(api_key=os.environ["ARIZE_API_KEY"])

# 建立帶有標核欄位的 DataFrame
# 必填：context.span_id + 至少一個 annotation.<name>.label 或 annotation.<name>.score
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
    space_id=os.environ["ARIZE_SPACE"],
    project_name="your-project",
    dataframe=annotations_df,
    validate=True,
)
```

**DataFrame 欄位結構描述：**

| 欄位 | 必填 | 描述 |
|--------|----------|-------------|
| `context.span_id` | 是 | 要標核的 Span |
| `annotation.<name>.label` | 擇一 | 類別型或自由格式標籤 |
| `annotation.<name>.score` | 擇一 | 數值分數 |
| `annotation.<name>.updated_by` | 否 | 標核人員識別碼（電子郵件或名稱） |
| `annotation.<name>.updated_at` | 否 | 自 Epoch 起算的毫秒時間戳記 |
| `annotation.notes` | 否 | 關於該 Span 的自由格式筆記 |

**限制：** 標核僅適用於提交前 31 天內的 Span。

---

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰可能無權存取此空間。請在 https://app.arize.com/admin > API Keys 進行驗證 |
| `Annotation config not found` | `ax annotation-configs list --space SPACE`（或使用 `ax annotation-configs get NAME_OR_ID --space SPACE`） |
| `409 Conflict on create` | 名稱在空間中已存在。請使用不同名稱或取得現有配置的 ID。 |
| 找不到佇列 (Queue not found) | `ax annotation-queues list --space SPACE`；驗證佇列名稱或 ID |
| 記錄未出現在佇列中 | 確保連結至佇列的標核配置已存在；檢查 `ax annotation-configs list --space SPACE` |
| Span SDK 錯誤或缺少 Span | 確認 `project_name`, `space_id` 以及 Span ID；使用 arize-trace 匯出 Span |

---

## 相關技能 (Related Skills)

- **arize-trace**：匯出 Span 以查找 Span ID 與時間範圍
- **arize-dataset**：查找資料集 ID 與範例 ID
- **arize-evaluator**：與人工標核並行的自動化 LLM-as-judge
- **arize-experiment**：連結至資料集與評估工作流程的實驗
- **arize-link**：連結至 Arize UI 中的標核配置與佇列的深層連結

---

## 儲存認證供日後使用 (Save Credentials for Future Use)

參閱 references/ax-profiles.md § 儲存認證供日後使用。
