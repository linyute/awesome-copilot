---
name: arize-experiment
description: "當建立、執行或分析 Arize 實驗時呼叫此技能。涵蓋實驗 CRUD、匯出執行結果、比較結果，以及使用 ax CLI 的評估工作流程。"
---

# Arize 實驗技能 (Arize Experiment Skill)

## 概念

- **實驗 (Experiment)** = 針對特定資料集版本執行的具名評估執行，每個範例包含一次執行結果
- **實驗執行 (Experiment Run)** = 處理單一資料集範例後的結果 — 包含模型輸出、選用的評估結果以及選用的中繼資料 (Metadata)
- **資料集 (Dataset)** = 具版本管理的範例集合；每個實驗都與一個資料集及特定的資料集版本繫結
- **評估 (Evaluation)** = 附加至執行結果的具名指標 (例如：`correctness` (正確性), `relevance` (相關性))，帶有選用的標籤、分數與解釋

典型流程：匯出資料集 → 處理每個範例 → 收集輸出與評估結果 → 使用執行結果建立實驗。

## 先決條件

直接開始執行工作 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔。

若 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` (找不到指令) 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` (未經授權) / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前的設定檔。若缺少設定檔或 API 金鑰錯誤：檢查 `.env` 檔案中是否有 `ARIZE_API_KEY`，並使用它透過 references/ax-profiles.md 建立/更新設定檔。若 `.env` 中也沒有金鑰，請向使用者詢問其 Arize API 金鑰 (https://app.arize.com/admin > API Keys)
- 空間 ID (Space ID) 未知 → 檢查 `.env` 中的 `ARIZE_SPACE_ID`，或執行 `ax spaces list -o json`，或詢問使用者
- 專案不明確 → 檢查 `.env` 中的 `ARIZE_DEFAULT_PROJECT`，或詢問，或執行 `ax projects list -o json --limit 100` 並呈現為選取項

## 列出實驗：`ax experiments list`

瀏覽實驗，可選擇按資料集過濾。輸出會傳送至標準輸出 (stdout)。

```bash
ax experiments list
ax experiments list --dataset-id DATASET_ID --limit 20
ax experiments list --cursor CURSOR_TOKEN
ax experiments list -o json
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `--dataset-id` | 字串 | 無 | 按資料集過濾 |
| `--limit, -l` | 整數 | 15 | 最大結果數 (1-100) |
| `--cursor` | 字串 | 無 | 來自前一次回應的分頁游標 |
| `-o, --output` | 字串 | table | 輸出格式：table, json, csv, parquet 或檔案路徑 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

## 獲取實驗：`ax experiments get`

快速中繼資料查詢 — 回傳實驗名稱、連結的資料集/版本以及時間戳記。

```bash
ax experiments get EXPERIMENT_ID
ax experiments get EXPERIMENT_ID -o json
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `EXPERIMENT_ID` | 字串 | 必要 | 位置引數 |
| `-o, --output` | 字串 | table | 輸出格式 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

### 回應欄位

| 欄位 | 類型 | 說明 |
|-------|------|-------------|
| `id` | 字串 | 實驗 ID |
| `name` | 字串 | 實驗名稱 |
| `dataset_id` | 字串 | 連結的資料集 ID |
| `dataset_version_id` | 字串 | 使用的特定資料集版本 |
| `experiment_traces_project_id` | 字串 | 儲存實驗追蹤的專案 |
| `created_at` | 日期時間 | 實驗建立時間 |
| `updated_at` | 日期時間 | 最後修改時間 |

## 匯出實驗：`ax experiments export`

將所有執行結果下載至檔案。預設使用 REST API；若要進行大量傳輸，請傳遞 `--all` 以使用 Arrow Flight。

```bash
ax experiments export EXPERIMENT_ID
# -> experiment_abc123_20260305_141500/runs.json

ax experiments export EXPERIMENT_ID --all
ax experiments export EXPERIMENT_ID --output-dir ./results
ax experiments export EXPERIMENT_ID --stdout
ax experiments export EXPERIMENT_ID --stdout | jq '.[0]'
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `EXPERIMENT_ID` | 字串 | 必要 | 位置引數 |
| `--all` | 布林值 | false | 使用 Arrow Flight 進行批次匯出 (見下方說明) |
| `--output-dir` | 字串 | `.` | 輸出目錄 |
| `--stdout` | 布林值 | false | 將 JSON 列印至標準輸出而非檔案 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

### REST vs Flight (`--all`)

- **REST** (預設)：摩擦力較低 — 無須安裝 Arrow/Flight 依賴項，使用標準 HTTPS 連接埠，可穿透任何公司代理伺服器或防火牆。每頁限制 500 個執行結果。
- **Flight** (`--all`)：實驗執行結果超過 500 個時必要。在獨立的主機/連接埠 (`flight.arize.com:443`) 上使用 gRPC+TLS，某些公司網路可能會封鎖此連線。

**代理自動晉級規則：** 若 REST 匯出恰好回傳 500 個執行結果，結果可能已被截斷。請使用 `--all` 重新執行以獲取完整的資料集。

輸出為包含執行結果物件的 JSON 陣列：

```json
[
  {
    "id": "run_001",
    "example_id": "ex_001",
    "output": "答案是 4。",
    "evaluations": {
      "correctness": { "label": "correct", "score": 1.0 },
      "relevance": { "score": 0.95, "explanation": "直接回答了問題" }
    },
    "metadata": { "model": "gpt-4o", "latency_ms": 1234 }
  }
]
```

## 建立實驗：`ax experiments create`

從資料檔案使用執行結果建立新的實驗。

```bash
ax experiments create --name "gpt-4o-baseline" --dataset-id DATASET_ID --file runs.json
ax experiments create --name "claude-test" --dataset-id DATASET_ID --file runs.csv
```

### 旗標

| 旗標 | 類型 | 必要 | 說明 |
|------|------|----------|-------------|
| `--name, -n` | 字串 | 是 | 實驗名稱 |
| `--dataset-id` | 字串 | 是 | 執行實驗所針對的資料集 |
| `--file, -f` | 路徑 | 是 | 包含執行結果的資料檔案：CSV, JSON, JSONL 或 Parquet |
| `-o, --output` | 字串 | 否 | 輸出格式 |
| `-p, --profile` | 字串 | 否 | 組態設定檔 |

### 透過標準輸入 (stdin) 傳遞資料

使用 `--file -` 直接以管線傳送資料 — 無須暫存檔：

```bash
echo '[{"example_id": "ex_001", "output": "巴黎"}]' | ax experiments create --name "my-experiment" --dataset-id DATASET_ID --file -

# 或使用 Heredoc
ax experiments create --name "my-experiment" --dataset-id DATASET_ID --file - << 'EOF'
[{"example_id": "ex_001", "output": "巴黎"}]
EOF
```

### 執行結果檔案中的必要欄位

| 欄位 | 類型 | 必要 | 說明 |
|--------|------|----------|-------------|
| `example_id` | 字串 | 是 | 此執行結果所對應之資料集範例的 ID |
| `output` | 字串 | 是 | 模型/系統對此範例的輸出結果 |

額外的欄位將作為執行結果的 `additionalProperties` 傳遞。

## 刪除實驗：`ax experiments delete`

```bash
ax experiments delete EXPERIMENT_ID
ax experiments delete EXPERIMENT_ID --force   # 跳過確認提示
```

### 旗標

| 旗標 | 類型 | 預設值 | 說明 |
|------|------|---------|-------------|
| `DATASET_ID` | 字串 | 必要 | 位置引數 |
| `--force, -f` | 布林值 | false | 跳過確認提示 |
| `-p, --profile` | 字串 | default | 組態設定檔 |

## 實驗執行結構定義 (Schema)

每個執行結果對應一個資料集範例：

```json
{
  "example_id": "必要 -- 連結至資料集範例",
  "output": "必要 -- 模型/系統對此範例的輸出結果",
  "evaluations": {
    "metric_name": {
      "label": "選用字串標籤 (例如：'correct', 'incorrect')",
      "score": "選用數值分數 (例如：0.95)",
      "explanation": "選用自由格式文字"
    }
  },
  "metadata": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "latency_ms": 1234
  }
}
```

### 評估欄位

| 欄位 | 類型 | 必要 | 說明 |
|-------|------|----------|-------------|
| `label` | 字串 | 否 | 類別分類 (例如：`correct`, `incorrect`, `partial`) |
| `score` | 數值 | 否 | 數值品質分數 (例如：0.0 - 1.0) |
| `explanation` | 字串 | 否 | 評估的自由格式推理過程 |

每個評估項目至少應包含 `label`、`score` 或 `explanation` 其中之一。

## 工作流程

### 針對資料集執行實驗

1. 尋找或建立資料集：
   ```bash
   ax datasets list
   ax datasets export DATASET_ID --stdout | jq 'length'
   ```
2. 匯出資料集範例：
   ```bash
   ax datasets export DATASET_ID
   ```
3. 透過您的系統處理每個範例，收集輸出與評估結果
4. 建立包含 `example_id`、`output` 以及選用 `evaluations` 的執行結果檔案 (JSON 陣列)：
   ```json
   [
     {"example_id": "ex_001", "output": "4", "evaluations": {"correctness": {"label": "correct", "score": 1.0}}},
     {"example_id": "ex_002", "output": "巴黎", "evaluations": {"correctness": {"label": "correct", "score": 1.0}}}
   ]
   ```
5. 建立實驗：
   ```bash
   ax experiments create --name "gpt-4o-baseline" --dataset-id DATASET_ID --file runs.json
   ```
6. 驗證：`ax experiments get EXPERIMENT_ID`

### 比較兩個實驗

1. 匯出兩個實驗：
   ```bash
   ax experiments export EXPERIMENT_ID_A --stdout > a.json
   ax experiments export EXPERIMENT_ID_B --stdout > b.json
   ```
2. 按 `example_id` 比較評估分數：
   ```bash
   # 實驗 A 的平均正確性分數
   jq '[.[] | .evaluations.correctness.score] | add / length' a.json

   # 實驗 B 的平均正確性分數
   jq '[.[] | .evaluations.correctness.score] | add / length' b.json
   ```
3. 找出結果有差異的範例：
   ```bash
   jq -s '.[0] as $a | .[1][] | . as $run |
     {
       example_id: $run.example_id,
       b_score: $run.evaluations.correctness.score,
       a_score: ($a[] | select(.example_id == $run.example_id) | .evaluations.correctness.score)
     }' a.json b.json
   ```
4. 每個評估器的分數分佈 (通過/失敗/部分通過的計數)：
   ```bash
   # 按標籤統計實驗 A 的數量
   jq '[.[] | .evaluations.correctness.label] | group_by(.) | map({label: .[0], count: length})' a.json
   ```
5. 尋找效能退步 (Regression) (在 A 中通過但在 B 中失敗的範例)：
   ```bash
   jq -s '
     [.[0][] | select(.evaluations.correctness.label == "correct")] as $passed_a |
     [.[1][] | select(.evaluations.correctness.label != "correct") |
       select(.example_id as $id | $passed_a | any(.example_id == $id))
     ]
   ' a.json b.json
   ```

**統計顯著性附註：** 每個評估器有 30 個以上範例時，分數比較最為可靠。若範例較少，請僅將差異視為趨勢參考 — 樣本數 n=10 時 5% 的差異可能是雜訊。請隨分數一併報告樣本大小：`jq 'length' a.json`。

### 下載實驗結果進行分析

1. `ax experiments list --dataset-id DATASET_ID` -- 尋找實驗
2. `ax experiments export EXPERIMENT_ID` -- 下載至檔案
3. 解析：`jq '.[] | {example_id, score: .evaluations.correctness.score}' experiment_*/runs.json`

### 將匯出內容以管線傳送至其他工具

```bash
# 計算執行次數
ax experiments export EXPERIMENT_ID --stdout | jq 'length'

# 擷取所有輸出
ax experiments export EXPERIMENT_ID --stdout | jq '.[].output'

# 獲取低分執行結果
ax experiments export EXPERIMENT_ID --stdout | jq '[.[] | select(.evaluations.correctness.score < 0.5)]'

# 轉換為 CSV
ax experiments export EXPERIMENT_ID --stdout | jq -r '.[] | [.example_id, .output, .evaluations.correctness.score] | @csv'
```

## 相關技能

- **arize-dataset**：建立或匯出此實驗所針對的資料集 → 先使用 `arize-dataset`
- **arize-prompt-optimization**：使用實驗結果來改進提示詞 → 下一步是 `arize-prompt-optimization`
- **arize-trace**：為失敗的實驗執行檢查個別的 Span 追蹤 → 使用 `arize-trace`
- **arize-link**：從實驗執行結果產生可點選的 UI 連結至追蹤 → 使用 `arize-link`

## 疑難排解

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰錯誤、已過期，或無權存取此空間。使用 references/ax-profiles.md 修復設定檔。 |
| `No profile found` | 未設定任何設定檔。參閱 references/ax-profiles.md 建立一個。 |
| `Experiment not found` | 使用 `ax experiments list` 驗證實驗 ID |
| `Invalid runs file` | 每個執行結果必須具有 `example_id` 與 `output` 欄位 |
| `example_id mismatch` | 確保 `example_id` 數值與資料集中的 ID 相符 (匯出資料集以核實) |
| `No runs found` | 匯出回傳空值 -- 透過 `ax experiments get` 驗證實驗是否具有執行結果 |
| `Dataset not found` | 連結的資料集可能已被刪除；請使用 `ax datasets list` 檢查 |

## 儲存認證資訊供未來使用

參閱 references/ax-profiles.md § 儲存認證資訊供未來使用。
