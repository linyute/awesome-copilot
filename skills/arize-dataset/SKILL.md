---
name: arize-dataset
description: "當建立、管理或查詢 Arize 資料集 (datasets) 與範例 (examples) 時，請叫用此技能。此外，當使用者需要用於其模型的測試資料或評估範例時也可以使用。涵蓋使用 ax CLI 進行資料集 CRUD、附加範例、匯出資料以及基於檔案的資料集建立。"
---

# Arize 資料集技能 (Arize Dataset Skill)

> **`SPACE`** — 所有 `--space` 旗標與 `ARIZE_SPACE` 環境變數接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list` 查找您的資訊。

## 概念 (Concepts)

- **資料集 (Dataset)** = 一組用於評估與實驗的範例集合，具備版本管理功能。
- **資料集版本 (Dataset Version)** = 資料集在特定時間點的快照；更新可以是原地更新 (in-place) 或建立新版本。
- **範例 (Example)** = 資料集中的單一記錄，具有任意使用者定義的欄位（例如 `question`, `answer`, `context`）。
- **空間 (Space)** = 一個組織容器；資料集隸屬於某個空間。

範例上的系統管理欄位（`id`, `created_at`, `updated_at`）由伺服器自動產生 — 絕不要將其包含在建立或附加的內容 (payload) 中。

## 先決條件 (Prerequisites)

直接進行任務 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔 (profiles)。

如果 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前設定檔。如果缺少設定檔或 API 金鑰錯誤，請遵循 references/ax-profiles.md 建立/更新。如果使用者沒有其金鑰，請引導他們前往 https://app.arize.com/admin > API Keys
- 空間 (Space) 未知 → 執行 `ax spaces list` 以按名稱選取，或詢問使用者
- 專案 (Project) 不明確 → 詢問使用者，或執行 `ax projects list -o json --limit 100` 並呈現為可選選項
- **安全性：** 絕不讀取 `.env` 檔案或在檔案系統中搜尋認證。使用 `ax profiles` 獲取 Arize 認證，使用 `ax ai-integrations` 獲取 LLM 提供者金鑰。如果無法透過這些管道取得認證，請詢問使用者。

## 列出資料集：`ax datasets list` (List Datasets: `ax datasets list`)

瀏覽空間中的資料集。輸出將傳送至 stdout。

```bash
ax datasets list
ax datasets list --space SPACE --limit 20
ax datasets list --cursor CURSOR_TOKEN
ax datasets list -o json
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `--space` | 字串 | 來自設定檔 | 依空間篩選 |
| `--limit, -l` | 整數 | 15 | 最大結果數 (1-100) |
| `--cursor` | 字串 | 無 | 來自前一次回應的分頁游標 |
| `-o, --output` | 字串 | table | 輸出格式：table, json, csv, parquet 或檔案路徑 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

## 取得資料集：`ax datasets get` (Get Dataset: `ax datasets get`)

快速中介資料 (metadata) 查詢 — 傳回資料集名稱、空間、時間戳記與版本清單。

```bash
ax datasets get NAME_OR_ID
ax datasets get NAME_OR_ID -o json
ax datasets get NAME_OR_ID --space SPACE   # 使用資料集名稱而非 ID 時為必填
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `NAME_OR_ID` | 字串 | 必填 | 資料集名稱或 ID（位置參數） |
| `--space` | 字串 | 無 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `-o, --output` | 字串 | table | 輸出格式 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

### 回應欄位 (Response fields)

| 欄位 | 類型 | 描述 |
|-------|------|-------------|
| `id` | 字串 | 資料集 ID |
| `name` | 字串 | 資料集名稱 |
| `space_id` | 字串 | 此資料集所屬的空間 |
| `created_at` | datetime | 資料集建立時間 |
| `updated_at` | datetime | 最後修改時間 |
| `versions` | 陣列 | 資料集版本清單 (id, name, dataset_id, created_at, updated_at) |

## 匯出資料集：`ax datasets export` (Export Dataset: `ax datasets export`)

將所有範例下載至檔案。對於超過 500 個範例的資料集，請使用 `--all`（無限額批次匯出）。

```bash
ax datasets export NAME_OR_ID
# -> dataset_abc123_20260305_141500/examples.json

ax datasets export NAME_OR_ID --all
ax datasets export NAME_OR_ID --version-id VERSION_ID
ax datasets export NAME_OR_ID --output-dir ./data
ax datasets export NAME_OR_ID --stdout
ax datasets export NAME_OR_ID --stdout | jq '.[0]'
ax datasets export NAME_OR_ID --space SPACE   # 使用資料集名稱而非 ID 時為必填
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `NAME_OR_ID` | 字串 | 必填 | 資料集名稱或 ID（位置參數） |
| `--space` | 字串 | 無 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `--version-id` | 字串 | 最新 | 匯出特定資料集版本 |
| `--all` | 布林值 | false | 無限額批次匯出（用於超過 500 個範例的資料集） |
| `--output-dir` | 字串 | `.` | 輸出目錄 |
| `--stdout` | 布林值 | false | 將 JSON 列印到 stdout 而非檔案 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

**代理程式自動升級規則：** 如果匯出傳回正好 500 個範例，結果很可能已被截斷 — 請使用 `--all` 重新執行以取得完整資料集。

**匯出完整性驗證：** 匯出後，確認列數與伺服器報告的內容一致：
```bash
# 從資料集中介資料取得伺服器報告的數量
ax datasets get DATASET_NAME --space SPACE -o json | jq '.versions[-1] | {version: .id, examples: .example_count}'

# 與匯出的內容進行比較
jq 'length' dataset_*/examples.json

# 如果數量不同，請使用 --all 重新匯出
```

輸出是一個範例物件的 JSON 陣列。每個範例都有系統欄位（`id`, `created_at`, `updated_at`）加上所有使用者定義的欄位：

```json
[
  {
    "id": "ex_001",
    "created_at": "2026-01-15T10:00:00Z",
    "updated_at": "2026-01-15T10:00:00Z",
    "question": "2+2 等於多少？",
    "answer": "4",
    "topic": "math"
  }
]
```

## 建立資料集：`ax datasets create` (Create Dataset: `ax datasets create`)

從資料檔案建立新資料集。

```bash
ax datasets create --name "My Dataset" --space SPACE --file data.csv
ax datasets create --name "My Dataset" --space SPACE --file data.json
ax datasets create --name "My Dataset" --space SPACE --file data.jsonl
ax datasets create --name "My Dataset" --space SPACE --file data.parquet
```

### 旗標 (Flags)

| 旗標 | 類型 | 是否必填 | 描述 |
|------|------|----------|-------------|
| `--name, -n` | 字串 | 是 | 資料集名稱 |
| `--space` | 字串 | 是 | 用於建立資料集的空間 |
| `--file, -f` | 路徑 | 是 | 資料檔案：CSV, JSON, JSONL 或 Parquet |
| `-o, --output` | 字串 | 否 | 傳回的資料集中介資料的輸出格式 |
| `-p, --profile` | 字串 | 否 | 配置設定檔 |

### 透過 stdin 傳遞資料 (Passing data via stdin)

使用 `--file -` 直接透過管線傳送資料 — 無需暫存檔：

```bash
echo '[{"question": "2+2 等於多少？", "answer": "4"}]' | ax datasets create --name "my-dataset" --space SPACE --file -

# 或使用 heredoc
ax datasets create --name "my-dataset" --space SPACE --file - << 'EOF'
[{"question": "2+2 等於多少？", "answer": "4"}]
EOF
```

若要將資料列新增至現有資料集，請改用 `ax datasets append --json '[...]'` — 無需檔案。

### 支援的檔案格式 (Supported file formats)

| 格式 | 副檔名 | 附註 |
|--------|-----------|-------|
| CSV | `.csv` | 欄位標頭 (Column headers) 成為欄位名稱 |
| JSON | `.json` | 物件陣列 |
| JSON Lines | `.jsonl` | 每行一個物件（非 JSON 陣列） |
| Parquet | `.parquet` | 欄名稱成為欄位名稱；保留類型 |

**格式注意事项：**
- **CSV**：會遺失類型資訊 — 日期變成字串，`null` 變成空字串。使用 JSON/Parquet 可保留類型。
- **JSONL**：每行是一個獨立的 JSON 物件。`.jsonl` 檔案中的 JSON 陣列 (`[{...}, {...}]`) 會失敗 — 請改用 `.json` 副檔名。
- **Parquet**：保留欄位類型。需要在本地端使用 `pandas`/`pyarrow` 讀取：`pd.read_parquet("examples.parquet")`。

## 附加範例：`ax datasets append` (Append Examples: `ax datasets append`)

將範例新增至現有資料集。有兩種輸入模式 — 使用適合的一種。

### 內嵌 JSON (Agent 友善) (Inline JSON (agent-friendly))

直接產生內容 — 無需暫存檔：

```bash
ax datasets append DATASET_NAME --space SPACE --json '[{"question": "2+2 等於多少？", "answer": "4"}]'

ax datasets append DATASET_NAME --space SPACE --json '[
  {"question": "什麼是重力？", "answer": "一種基本作用力..."},
  {"question": "什麼是光？", "answer": "電磁輻射..."}
]'
```

### 從檔案 (From a file)

```bash
ax datasets append DATASET_NAME --space SPACE --file new_examples.csv
ax datasets append DATASET_NAME --space SPACE --file additions.json
```

### 附加至特定版本 (To a specific version)

```bash
ax datasets append DATASET_NAME --space SPACE --json '[{"q": "..."}]' --version-id VERSION_ID
```

### 旗標 (Flags)

| 旗標 | 類型 | 是否必填 | 描述 |
|------|------|----------|-------------|
| `NAME_OR_ID` | 字串 | 是 | 資料集名稱或 ID（位置參數）；使用名稱時請加入 `--space` |
| `--space` | 字串 | 否 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `--json` | 字串 | 互斥 (mutex) | 範例物件的 JSON 陣列 |
| `--file, -f` | 路徑 | 互斥 (mutex) | 資料檔案 (CSV, JSON, JSONL, Parquet) |
| `--version-id` | 字串 | 否 | 附加至特定版本（預設：最新） |
| `-o, --output` | 字串 | 否 | 傳回的資料集中介資料的輸出格式 |
| `-p, --profile` | 字串 | 否 | 配置設定檔 |

必須提供 `--json` 或 `--file` 其中之一。

### 驗證 (Validation)

- 每個範例必須是一個至少包含一個使用者定義欄位的 JSON 物件
- 每次請求最多 100,000 個範例

**附加前的結構描述驗證：** 如果資料集已有範例，請在附加前檢查其結構描述，以避免靜默的欄位不符：

```bash
# 檢查資料集中現有的欄位名稱
ax datasets export DATASET_NAME --space SPACE --stdout | jq '.[0] | keys'

# 驗證您的新資料是否具有相符的欄位名稱
echo '[{"question": "..."}]' | jq '.[0] | keys'

# 兩個輸出應顯示相同的使用者定義欄位
```

欄位是自由格式的：新範例中的額外欄位會被新增，而缺失的欄位會變成 null。然而，欄位名稱中的拼字錯誤（例如 `queston` vs `question`）會靜默地建立新欄位 — 附加前請驗證拼字。

## 刪除資料集：`ax datasets delete` (Delete Dataset: `ax datasets delete`)

```bash
ax datasets delete NAME_OR_ID
ax datasets delete NAME_OR_ID --space SPACE   # 使用資料集名稱而非 ID 時為必填
ax datasets delete NAME_OR_ID --force   # 跳過確認提示
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `NAME_OR_ID` | 字串 | 必填 | 資料集名稱或 ID（位置參數） |
| `--space` | 字串 | 無 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `--force, -f` | 布林值 | false | 跳過確認提示 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

## 工作流程 (Workflows)

### 依名稱尋找資料集 (Find a dataset by name)

所有資料集指令皆直接接受名稱或 ID。您可以將資料集名稱作為位置參數傳遞（不使用 ID 時請加入 `--space SPACE`）：

```bash
# 直接使用名稱
ax datasets get "eval-set-v1" --space SPACE
ax datasets export "eval-set-v1" --space SPACE

# 或者如果需要 base64 ID，請透過 list 將名稱解析為 ID
ax datasets list -o json | jq '.[] | select(.name == "eval-set-v1") | .id'
```

### 從檔案建立評估用資料集 (Create a dataset from file for evaluation)

1. 準備一個包含評估欄位（例如 `input`, `expected_output`）的 CSV/JSON/Parquet 檔案
   - 如果是內嵌產生資料，請透過 `--file -` 使用管線傳送（參見「建立資料集」章節）
2. `ax datasets create --name "eval-set-v1" --space SPACE --file eval_data.csv`
3. 驗證：`ax datasets get DATASET_NAME --space SPACE`
4. 使用資料集名稱來執行實驗

### 將範例新增至現有資料集 (Add examples to an existing dataset)

```bash
# 尋找資料集
ax datasets list --space SPACE

# 使用資料集名稱進行內嵌附加或從檔案附加（完整語法參見「附加範例」章節）
ax datasets append DATASET_NAME --space SPACE --json '[{"question": "...", "answer": "..."}]'
ax datasets append DATASET_NAME --space SPACE --file additional_examples.csv
```

### 下載資料集進行離線分析 (Download dataset for offline analysis)

1. `ax datasets list --space SPACE` -- 尋找資料集名稱
2. `ax datasets export DATASET_NAME --space SPACE` -- 下載至檔案
3. 解析 JSON：`jq '.[] | .question' dataset_*/examples.json`

### 匯出特定版本 (Export a specific version)

```bash
# 列出版本
ax datasets get DATASET_NAME --space SPACE -o json | jq '.versions'

# 匯出該版本
ax datasets export DATASET_NAME --space SPACE --version-id VERSION_ID
```

### 迭代資料集 (Iterate on a dataset)

1. 匯出目前版本：`ax datasets export DATASET_NAME --space SPACE`
2. 在本地端修改範例
3. 附加新資料列：`ax datasets append DATASET_NAME --space SPACE --file new_rows.csv`
4. 或者建立一個全新的版本：`ax datasets create --name "eval-set-v2" --space SPACE --file updated_data.json`

### 將匯出內容透過管線傳送至其他工具 (Pipe export to other tools)

```bash
# 計算範例數量
ax datasets export DATASET_NAME --space SPACE --stdout | jq 'length'

# 擷取單一欄位
ax datasets export DATASET_NAME --space SPACE --stdout | jq '.[].question'

# 使用 jq 轉換為 CSV
ax datasets export DATASET_NAME --space SPACE --stdout | jq -r '.[] | [.question, .answer] | @csv'
```

## 資料集範例結構描述 (Dataset Example Schema)

範例是自由格式的 JSON 物件。沒有固定的結構描述 — 資料欄取決於您提供的欄位。系統管理欄位由伺服器新增：

| 欄位 | 類型 | 管理者 | 附註 |
|-------|------|-----------|-------|
| `id` | 字串 | 伺服器 | 自動產生的 UUID。更新時必填，建立/附加時禁止使用 |
| `created_at` | datetime | 伺服器 | 不可變的建立時間戳記 |
| `updated_at` | datetime | 伺服器 | 修改時自動更新 |
| *(任何使用者欄位)* | 任何 JSON 類型 | 使用者 | 字串、數字、布林值、null、巢狀物件、陣列 |

## 相關技能 (Related Skills)

- **arize-trace**：匯出生產環境 Span，以瞭解要在資料集中放入哪些資料 → 使用 `arize-trace`
- **arize-experiment**：對此資料集執行評估 → 下一步是 `arize-experiment`
- **arize-prompt-optimization**：使用資料集 + 實驗結果來改善提示詞 → 使用 `arize-prompt-optimization`

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰錯誤、過期或無權存取此空間。使用 references/ax-profiles.md 修復設定檔。 |
| `No profile found` | 未配置設定檔。參閱 references/ax-profiles.md 建立一個。 |
| `Dataset not found` | 透過 `ax datasets list` 驗證資料集 ID |
| `File format error` | 支援：CSV, JSON, JSONL, Parquet。使用 `--file -` 從 stdin 讀取。 |
| `platform-managed column` | 從建立/附加的 payload 中移除 `id`, `created_at`, `updated_at` |
| `reserved column` | 移除 `time`, `count` 或任何 `source_record_*` 欄位 |
| `Provide either --json or --file` | 附加操作需要恰好一個輸入來源 |
| `Examples array is empty` | 確保您的 JSON 陣列或檔案至少包含一個範例 |
| `not a JSON object` | `--json` 陣列中的每個元素都必須是 `{...}` 物件，而非字串或數字 |

## 儲存認證供日後使用 (Save Credentials for Future Use)

參閱 references/ax-profiles.md § 儲存認證供日後使用。
