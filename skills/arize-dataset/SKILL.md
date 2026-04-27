---
name: arize-dataset
description: "當建立、管理或查詢 Arize 資料集與範例時呼叫此技能。涵蓋資料集 CRUD、附加範例、匯出資料，以及使用 ax CLI 以檔案為基礎建立資料集。"
---

# Arize 資料集技能 (Arize Dataset Skill)

## 概念

- **資料集 (Dataset)** = 用於評估與實驗的具版本管理範例集合
- **資料集版本 (Dataset Version)** = 資料集在特定時間點的快照；更新可以是就地更新，或是建立新版本
- **範例 (Example)** = 資料集中的單一記錄，具有任意的使用者定義欄位 (例如：`question` (問題)、`answer` (回答)、`context` (內容))
- **空間 (Space)** = 組織容器；資料集隸屬於空間

範例上的系統管理欄位 (`id`, `created_at`, `updated_at`) 是由伺服器自動產生的 — 絕不要在建立或附加的承載資料中包含這些欄位。

## 先決條件

直接開始執行工作 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔。

若 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` (找不到指令) 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` (未經授權) / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前的設定檔。若缺少設定檔或 API 金鑰錯誤：檢查 `.env` 檔案中是否有 `ARIZE_API_KEY`，並使用它透過 references/ax-profiles.md 建立/更新設定檔。若 `.env` 中也沒有金鑰，請向使用者詢問其 Arize API 金鑰 (https://app.arize.com/admin > API Keys)
- 空間 ID (Space ID) 未知 → 檢查 `.env` 中的 `ARIZE_SPACE_ID`，或執行 `ax spaces list -o json`，或詢問使用者
- 專案不明確 → 檢查 `.env` 中的 `ARIZE_DEFAULT_PROJECT`，或詢問，或執行 `ax projects list -o json --limit 100` 並呈現為選取項

## 列出資料集：`ax datasets list`

瀏覽空間中的資料集。輸出會傳送至標準輸出 (stdout)。

```bash
ax datasets list
ax datasets list --space-id SPACE_ID --limit 20
ax datasets list --cursor CURSOR_TOKEN
ax datasets list -o json
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `--space-id` | 字串 | 來自設定檔 | 按空間過濾 |
| `--limit, -l` | 整數 | 15 | 最大結果數 (1-100) |
| `--cursor` | 字串 | 無 | 來自前一次回應的分頁游標 |
| `-o, --output` | 字串 | table | 輸出格式：table, json, csv, parquet 或檔案路徑 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

## 獲取資料集：`ax datasets get`

快速中繼資料 (Metadata) 查詢 — 回傳資料集名稱、空間、時間戳記與版本列表。

```bash
ax datasets get DATASET_ID
ax datasets get DATASET_ID -o json
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `DATASET_ID` | 字串 | 必要 | 位置引數 |
| `-o, --output` | 字串 | table | 輸出格式 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

### 回應欄位

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `id` | 字串 | 資料集 ID |
| `name` | 字串 | 資料集名稱 |
| `space_id` | 字串 | 此資料集所屬的空間 |
| `created_at` | 日期時間 | 資料集建立時間 |
| `updated_at` | 日期時間 | 最後修改時間 |
| `versions` | 陣列 | 資料集版本列表 (id, 名稱, 資料集 ID, 建立時間, 修改時間) |

## 匯出資料集：`ax datasets export`

將所有範例下載至檔案。若資料集超過 500 個範例，請使用 `--all` 進行無限制的批次匯出。

```bash
ax datasets export DATASET_ID
# -> dataset_abc123_20260305_141500/examples.json

ax datasets export DATASET_ID --all
ax datasets export DATASET_ID --version-id VERSION_ID
ax datasets export DATASET_ID --output-dir ./data
ax datasets export DATASET_ID --stdout
ax datasets export DATASET_ID --stdout | jq '.[0]'
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `DATASET_ID` | 字串 | 必要 | 位置引數 |
| `--version-id` | 字串 | 最新 | 匯出特定的資料集版本 |
| `--all` | 布林值 | false | 無限制的批次匯出 (用於超過 500 個範例的資料集) |
| `--output-dir` | 字串 | `.` | 輸出目錄 |
| `--stdout` | 布林值 | false | 將 JSON 列印至標準輸出而非檔案 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

**代理自動晉級規則：** 若匯出恰好回傳 500 個範例，結果可能已被截斷 — 請使用 `--all` 重新執行以獲取完整的資料集。

**匯出完整性核實：** 匯出後，請確認列數與伺服器回報的數量相符：
```bash
# 從資料集中繼資料獲取伺服器回報的數量
ax datasets get DATASET_ID -o json | jq '.versions[-1] | {version: .id, examples: .example_count}'

# 與匯出的數量進行比較
jq 'length' dataset_*/examples.json

# 若數量不符，請使用 --all 重新匯出
```

輸出為包含範例物件的 JSON 陣列。每個範例都有系統欄位 (`id`, `created_at`, `updated_at`) 以及所有使用者定義的欄位：

```json
[
  {
    "id": "ex_001",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z",
    "question": "2+2 等於多少？",
    "answer": "4",
    "topic": "數學"
  }
]
```

## 建立資料集：`ax datasets create`

從資料檔案建立新的資料集。

```bash
ax datasets create --name "我的資料集" --space-id SPACE_ID --file data.csv
ax datasets create --name "我的資料集" --space-id SPACE_ID --file data.json
ax datasets create --name "我的資料集" --space-id SPACE_ID --file data.jsonl
ax datasets create --name "我的資料集" --space-id SPACE_ID --file data.parquet
```

### 旗標

| 旗標 | 類型 | 必要 | 說明 |
|------|------|----------|-------------|
| `--name, -n` | 字串 | 是 | 資料集名稱 |
| `--space-id` | 字串 | 是 | 要建立資料集的空間 |
| `--file, -f` | 路徑 | 是 | 資料檔案：CSV, JSON, JSONL 或 Parquet |
| `-o, --output` | 字串 | 否 | 回傳資料集中繼資料的輸出格式 |
| `-p, --profile` | 字串 | 否 | 組態設定檔 |

### 透過標準輸入 (stdin) 傳遞資料

使用 `--file -` 直接以管線傳送資料 — 無須暫存檔：

```bash
echo '[{"question": "2+2 等於多少？", "answer": "4"}]' | ax datasets create --name "my-dataset" --space-id SPACE_ID --file -

# 或使用 Heredoc
ax datasets create --name "my-dataset" --space-id SPACE_ID --file - << 'EOF'
[{"question": "2+2 等於多少？", "answer": "4"}]
EOF
```

若要將列新增至現有資料集，請改用 `ax datasets append --json '[...]'` — 無須檔案。

### 支援的檔案格式

| 格式 | 副檔名 | 附註 |
|--------|-----------|-------|
| CSV | `.csv` | 欄標頭變為欄位名稱 |
| JSON | `.json` | 物件陣列 |
| JSON Lines | `.jsonl` | 每行一個物件 (不是 JSON 陣列) |
| Parquet | `.parquet` | 欄名稱變為欄位名稱；保留資料類型 |

**格式注意事項：**
- **CSV**：會遺失類型資訊 — 日期會變為字串，`null` 會變為空字串。請使用 JSON/Parquet 以保留類型。
- **JSONL**：每一行都是獨立的 JSON 物件。`.jsonl` 檔案中的 JSON 陣列 (`[{...}, {...}]`) 會導致失敗 — 請改用 `.json` 副檔名。
- **Parquet**：保留欄類型。需要在本地端使用 `pandas`/`pyarrow` 讀取：`pd.read_parquet("examples.parquet")`。

## 附加範例：`ax datasets append`

將範例新增至現有資料集。有兩種輸入模式 — 請根據需求選用。

### 內嵌 JSON (適合代理使用)

直接產生承載資料 — 無須暫存檔：

```bash
ax datasets append DATASET_ID --json '[{"question": "2+2 等於多少？", "answer": "4"}]'

ax datasets append DATASET_ID --json '[
  {"question": "什麼是重力？", "answer": "一種基本交互作用力..."},
  {"question": "什麼是光？", "answer": "電磁輻射..."}
]'
```

### 來自檔案

```bash
ax datasets append DATASET_ID --file new_examples.csv
ax datasets append DATASET_ID --file additions.json
```

### 附加至特定版本

```bash
ax datasets append DATASET_ID --json '[{"q": "..."}]' --version-id VERSION_ID
```

### 旗標

| 旗標 | 類型 | 必要 | 說明 |
|------|------|----------|-------------|
| `DATASET_ID` | 字串 | 是 | 位置引數 |
| `--json` | 字串 | 互斥 | 包含範例物件的 JSON 陣列 |
| `--file, -f` | 路徑 | 互斥 | 資料檔案 (CSV, JSON, JSONL, Parquet) |
| `--version-id` | 字串 | 否 | 附加至特定版本 (預設值：最新版本) |
| `-o, --output` | 字串 | 否 | 回傳資料集中繼資料的輸出格式 |
| `-p, --profile` | 字串 | 否 | 組態設定檔 |

必須提供 `--json` 或 `--file` 其中之一。

### 驗證

- 每個範例必須是具有至少一個使用者定義欄位的 JSON 物件
- 每次請求最多 100,000 個範例

**附加前的結構定義驗證：** 若資料集中已有範例，請在附加前檢查其結構定義，以避免欄位不符：

```bash
# 檢查資料集中現有的欄位名稱
ax datasets export DATASET_ID --stdout | jq '.[0] | keys'

# 驗證您的新資料是否具有相符的欄位名稱
echo '[{"question": "..."}]' | jq '.[0] | keys'

# 兩個輸出應該顯示相同的使用者定義欄位
```

欄位是自由格式的：新範例中的額外欄位會被新增，而缺失的欄位會變為 null。然而，欄位名稱的拼寫錯誤 (例如：`queston` 與 `question`) 會隱含地建立新欄位 — 請在附加前核對拼寫。

## 刪除資料集：`ax datasets delete`

```bash
ax datasets delete DATASET_ID
ax datasets delete DATASET_ID --force   # 跳過確認提示
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `DATASET_ID` | 字串 | 必要 | 位置引數 |
| `--force, -f` | 布林值 | false | 跳過確認提示 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

## 工作流程

### 按名稱尋找資料集

使用者通常按名稱而非 ID 引用資料集。在執行其他指令前，請先將名稱解析為 ID：

```bash
# 按名稱尋找資料集 ID
ax datasets list -o json | jq '.[] | select(.name == "eval-set-v1") | .id'

# 若列表有分頁，請獲取更多
ax datasets list -o json --limit 100 | jq '.[] | select(.name | test("eval-set")) | {id, name}'
```

### 從檔案建立資料集用於評估

1. 準備包含評估欄位的 CSV/JSON/Parquet 檔案 (例如：`input` (輸入), `expected_output` (預期輸出))
   - 若是內嵌產生資料，請透過標準輸入使用 `--file -` 進行傳送 (見「建立資料集」章節)
2. `ax datasets create --name "eval-set-v1" --space-id SPACE_ID --file eval_data.csv`
3. 驗證：`ax datasets get DATASET_ID`
4. 使用資料集 ID 來執行實驗

### 將範例新增至現有資料集

```bash
# 尋找資料集
ax datasets list

# 內嵌或從檔案附加 (完整語法見「附加範例」章節)
ax datasets append DATASET_ID --json '[{"question": "...", "answer": "..."}]'
ax datasets append DATASET_ID --file additional_examples.csv
```

### 下載資料集用於離線分析

1. `ax datasets list` -- 尋找資料集
2. `ax datasets export DATASET_ID` -- 下載至檔案
3. 解析 JSON：`jq '.[] | .question' dataset_*/examples.json`

### 匯出特定版本

```bash
# 列出版本
ax datasets get DATASET_ID -o json | jq '.versions'

# 匯出該版本
ax datasets export DATASET_ID --version-id VERSION_ID
```

### 迭代資料集

1. 匯出目前版本：`ax datasets export DATASET_ID`
2. 在本地端修改範例
3. 附加新列：`ax datasets append DATASET_ID --file new_rows.csv`
4. 或建立全新的版本：`ax datasets create --name "eval-set-v2" --space-id SPACE_ID --file updated_data.json`

### 將匯出內容以管線傳送至其他工具

```bash
# 計算範例數量
ax datasets export DATASET_ID --stdout | jq 'length'

# 擷取單一欄位
ax datasets export DATASET_ID --stdout | jq '.[].question'

# 使用 jq 轉換為 CSV
ax datasets export DATASET_ID --stdout | jq -r '.[] | [.question, .answer] | @csv'
```

## 資料集範例結構定義 (Schema)

範例是自由格式的 JSON 物件。沒有固定的結構定義 — 欄位由您提供的資料決定。系統管理欄位由伺服器新增：

| 欄位 | 類型 | 管理者 | 附註 |
|-------|------|-----------|-------|
| `id` | 字串 | 伺服器 | 自動產生的 UUID。更新時必要，建立/附加時禁用 |
| `created_at` | 日期時間 | 伺服器 | 不可變的建立時間戳記 |
| `updated_at` | 日期時間 | 伺服器 | 在修改時自動更新 |
| *(任何使用者欄位)* | 任何 JSON 類型 | 使用者 | 字串、數值、布林值、null、巢狀物件、陣列 |


## 相關技能

- **arize-trace**：匯出生產環境 Span，以瞭解要在資料集中放入哪些資料 → 使用 `arize-trace`
- **arize-experiment**：針對此資料集執行評估 → 下一步是 `arize-experiment`
- **arize-prompt-optimization**：使用資料集與實驗結果來改進提示詞 → 使用 `arize-prompt-optimization`

## 疑難排解

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰錯誤、已過期，或無權存取此空間。使用 references/ax-profiles.md 修復設定檔。 |
| `No profile found` | 未設定任何設定檔。參閱 references/ax-profiles.md 建立一個。 |
| `Dataset not found` | 使用 `ax datasets list` 驗證資料集 ID |
| `File format error` | 支援格式：CSV, JSON, JSONL, Parquet。使用 `--file -` 從標準輸入讀取。 |
| `platform-managed column` | 從建立/附加的承載資料中移除 `id`, `created_at`, `updated_at` |
| `reserved column` | 移除 `time`, `count` 或任何 `source_record_*` 欄位 |
| `Provide either --json or --file` | 附加操作需要確切一個輸入來源 |
| `Examples array is empty` | 確保您的 JSON 陣列或檔案包含至少一個範例 |
| `not a JSON object` | `--json` 陣列中的每個元素必須是 `{...}` 物件，而非字串或數值 |

## 儲存認證資訊供未來使用

參閱 references/ax-profiles.md § 儲存認證資訊供未來使用。
