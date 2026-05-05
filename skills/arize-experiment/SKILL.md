---
name: arize-experiment
description: "當建立、執行或分析 Arize 實驗時，請叫用此技能。此外，當使用者想要評估或測量模型效能、比較模型（包括 GPT-4, Claude 或其他模型），或評估其 AI 的表現時也可以使用。涵蓋使用 ax CLI 進行實驗 CRUD、匯出執行、比較結果以及評估工作流程。"
---

# Arize 實驗技能 (Arize Experiment Skill)

> **`SPACE`** — 所有 `--space` 旗標與 `ARIZE_SPACE` 環境變數接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list` 查找您的資訊。

## 概念 (Concepts)

- **實驗 (Experiment)** = 針對特定資料集版本具名的評估執行，每個範例包含一次執行。
- **實驗執行 (Experiment Run)** = 處理一個資料集範例的結果 — 包含模型輸出、選填的評估以及選填的中介資料。
- **資料集 (Dataset)** = 具備版本管理的範例集合；每個實驗都連結至一個資料集以及特定的資料集版本。
- **評估 (Evaluation)** = 附加至執行上的具名指標（例如 `correctness`, `relevance`），包含選填的標籤、分數與解釋。

典型流程：匯出資料集 → 處理每個範例 → 收集輸出與評估 → 使用執行結果建立實驗。

## 先決條件 (Prerequisites)

直接進行任務 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔 (profiles)。

如果 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前設定檔。如果缺少設定檔或 API 金鑰錯誤，請遵循 references/ax-profiles.md 建立/更新。如果使用者沒有其金鑰，請引導他們前往 https://app.arize.com/admin > API Keys
- 空間 (Space) 未知 → 執行 `ax spaces list` 以按名稱選取，或詢問使用者
- 專案 (Project) 不明確 → 詢問使用者，或執行 `ax projects list -o json --limit 100` 並呈現為可選選項
- **安全性：** 絕不讀取 `.env` 檔案或在檔案系統中搜尋認證。使用 `ax profiles` 獲取 Arize 認證，使用 `ax ai-integrations` 獲取 LLM 提供者金鑰。如果無法透過這些管道取得認證，請詢問使用者。
- **至關重要 — 絕不編造輸出結果：** 執行實驗時，您 **必須** 針對每個資料集範例呼叫使用者指定的真實模型 API。絕不編造、模擬或硬編碼模型輸出、延遲 (latency) 或評估分數。如果您無法呼叫 API（缺少 SDK、缺少認證、網路錯誤），請停止並在繼續前告知使用者所需內容。

## 列出實驗：`ax experiments list` (List Experiments: `ax experiments list`)

瀏覽實驗，可選擇依資料集篩選。輸出將傳送至 stdout。

```bash
ax experiments list
ax experiments list --dataset DATASET_NAME --space SPACE --limit 20   # DATASET_NAME: 名稱或 ID（優先使用名稱）
ax experiments list --cursor CURSOR_TOKEN
ax experiments list -o json
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `--dataset` | 字串 | 無 | 依資料集篩選 |
| `--limit, -l` | 整數 | 15 | 最大結果數 (1-100) |
| `--cursor` | 字串 | 無 | 來自前一次回應的分頁游標 |
| `-o, --output` | 字串 | table | 輸出格式：table, json, csv, parquet 或檔案路徑 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

## 取得實驗：`ax experiments get` (Get Experiment: `ax experiments get`)

快速中介資料查詢 — 傳回實驗名稱、連結的資料集/版本以及時間戳記。

```bash
ax experiments get NAME_OR_ID
ax experiments get NAME_OR_ID -o json
ax experiments get NAME_OR_ID --dataset DATASET_NAME --space SPACE   # 使用實驗名稱而非 ID 時為必填
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `NAME_OR_ID` | 字串 | 必填 | 實驗名稱或 ID（位置參數） |
| `--dataset` | 字串 | 無 | 資料集名稱或 ID（若使用實驗名稱而非 ID 則為必填） |
| `--space` | 字串 | 無 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `-o, --output` | 字串 | table | 輸出格式 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

### 回應欄位 (Response fields)

| 欄位 | 類型 | 描述 |
|-------|------|-------------|
| `id` | 字串 | 實驗 ID |
| `name` | 字串 | 實驗名稱 |
| `dataset_id` | 字串 | 連結的資料集 ID |
| `dataset_version_id` | 字串 | 所使用的特定資料集版本 |
| `experiment_traces_project_id` | 字串 | 儲存實驗追蹤 (traces) 的專案 |
| `created_at` | datetime | 實驗建立時間 |
| `updated_at` | datetime | 最後修改時間 |

## 匯出實驗：`ax experiments export` (Export Experiment: `ax experiments export`)

將所有執行結果下載至檔案。預設使用 REST API；傳遞 `--all` 以使用 Arrow Flight 進行批次傳輸。

```bash
# EXPERIMENT_NAME, DATASET_NAME: 名稱或 ID（優先使用名稱）
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE
# -> experiment_abc123_20260305_141500/runs.json

ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --all
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --output-dir ./results
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | jq '.[0]'
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `NAME_OR_ID` | 字串 | 必填 | 實驗名稱或 ID（位置參數） |
| `--dataset` | 字串 | 無 | 資料集名稱或 ID（若使用實驗名稱而非 ID 則為必填） |
| `--space` | 字串 | 無 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `--all` | 布林值 | false | 使用 Arrow Flight 進行批次匯出（見下文） |
| `--output-dir` | 字串 | `.` | 輸出目錄 |
| `--stdout` | 布林值 | false | 將 JSON 列印到 stdout 而非檔案 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

### REST vs Flight (`--all`)

- **REST** (預設)：門檻較低 — 無 Arrow/Flight 依賴，使用標準 HTTPS 連接埠，可穿透任何公司代理伺服器或防火牆。每頁限制為 500 次執行。
- **Flight** (`--all`)：針對超過 500 次執行的實驗所必需。在獨立的主機/連接埠 (`flight.arize.com:443`) 上使用 gRPC+TLS，某些公司網路可能會阻擋。

**代理程式自動升級規則：** 如果 REST 匯出傳回正好 500 次執行，結果很可能已被截斷。請使用 `--all` 重新執行以取得完整資料集。

輸出是一個執行物件的 JSON 陣列：

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

## 建立實驗：`ax experiments create` (Create Experiment: `ax experiments create`)

從資料檔案建立帶有執行結果的新實驗。

```bash
ax experiments create --name "gpt-4o-baseline" --dataset DATASET_NAME --space SPACE --file runs.json
ax experiments create --name "claude-test" --dataset DATASET_NAME --space SPACE --file runs.csv
```

### 旗標 (Flags)

| 旗標 | 類型 | 是否必填 | 描述 |
|------|------|----------|-------------|
| `--name, -n` | 字串 | 是 | 實驗名稱 |
| `--dataset` | 字串 | 是 | 要對其執行實驗的資料集 |
| `--space, -s` | 字串 | 否 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `--file, -f` | 路徑 | 是 | 帶有執行結果的資料檔案：CSV, JSON, JSONL 或 Parquet |
| `-o, --output` | 字串 | 否 | 輸出格式 |
| `-p, --profile` | 字串 | 否 | 配置設定檔 |

### 透過 stdin 傳遞資料 (Passing data via stdin)

使用 `--file -` 直接透過管線傳送資料 — 無需暫存檔：

```bash
echo '[{"example_id": "ex_001", "output": "巴黎"}]' | ax experiments create --name "my-experiment" --dataset DATASET_NAME --space SPACE --file -

# 或使用 heredoc
ax experiments create --name "my-experiment" --dataset DATASET_NAME --space SPACE --file - << 'EOF'
[{"example_id": "ex_001", "output": "巴黎"}]
EOF
```

### 執行結果檔案中的必填欄位 (Required columns in the runs file)

| 欄位 | 類型 | 是否必填 | 描述 |
|--------|------|----------|-------------|
| `example_id` | 字串 | 是 | 此執行所對應的資料集範例 ID |
| `output` | 字串 | 是 | 此範例的模型/系統輸出 |

額外欄位將作為執行上的 `additionalProperties` 傳遞。

## 刪除實驗：`ax experiments delete` (Delete Experiment: `ax experiments delete`)

```bash
ax experiments delete NAME_OR_ID
ax experiments delete NAME_OR_ID --dataset DATASET_NAME --space SPACE   # 使用實驗名稱而非 ID 時為必填
ax experiments delete NAME_OR_ID --force   # 跳過確認提示
```

### 旗標 (Flags)

| 旗標 | 類型 | 預設值 | 描述 |
|------|------|---------|-------------|
| `NAME_OR_ID` | 字串 | 必填 | 實驗名稱或 ID（位置參數） |
| `--dataset` | 字串 | 無 | 資料集名稱或 ID（若使用實驗名稱而非 ID 則為必填） |
| `--space` | 字串 | 無 | 空間名稱或 ID（若使用資料集名稱而非 ID 則為必填） |
| `--force, -f` | 布林值 | false | 跳過確認提示 |
| `-p, --profile` | 字串 | default | 配置設定檔 |

## 實驗執行結構描述 (Experiment Run Schema)

每次執行對應一個資料集範例：

```json
{
  "example_id": "必填 -- 連結至資料集範例",
  "output": "必填 -- 此範例的模型/系統輸出",
  "evaluations": {
    "metric_name": {
      "label": "選填字串標籤（例如 'correct', 'incorrect'）",
      "score": "選填數值分數（例如 0.95）",
      "explanation": "選填自由格式文字"
    }
  },
  "metadata": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "latency_ms": 1234
  }
}
```

### 評估欄位 (Evaluation fields)

| 欄位 | 類型 | 是否必填 | 描述 |
|-------|------|----------|-------------|
| `label` | 字串 | 否 | 類別型分類（例如 `correct`, `incorrect`, `partial`） |
| `score` | 數字 | 否 | 數值品質分數（例如 0.0 - 1.0） |
| `explanation` | 字串 | 否 | 評估的自由格式推理過程 |

每次評估應至少存在 `label`、`score` 或 `explanation` 其中之一。

## 工作流程 (Workflows)

### 針對資料集執行實驗 (Run an experiment against a dataset)

1. 尋找或建立資料集：
   ```bash
   ax datasets list --space SPACE
   ax datasets export DATASET_NAME --space SPACE --stdout | jq 'length'
   ```
2. 匯出資料集範例：
   ```bash
   ax datasets export DATASET_NAME --space SPACE
   ```
3. 為每個範例呼叫真實模型 API 並收集輸出。使用 `ax datasets export --stdout` 將範例直接透過管線傳送至推論腳本 (inference script)：

   ```bash
   ax datasets export DATASET_NAME --space SPACE --stdout | python3 infer.py > runs.json
   ```

   撰寫 `infer.py` 以從 stdin 讀取範例、呼叫目標模型，並將執行結果 JSON 寫入 stdout。下方的腳本是一個範本 — 請先檢查匯出的資料集 JSON 以找到正確的輸入欄位名稱，然後取消註解使用者想要的提供者區塊：

   ```python
   import json, sys, time

   examples = json.load(sys.stdin)
   runs = []

   for ex in examples:
       # 檢查匯出的 JSON 以尋找正確欄位（例如 "input", "question", "prompt"）
       user_input = ex.get("input") or ex.get("question") or ex.get("prompt") or str(ex)

       start = time.time()

       # === 在此處呼叫真實模型 API — 絕不編造或模擬 ===
       # 取消註解並調整使用者要求的提供者區塊：
       #
       # OpenAI (pip install openai — 使用 OPENAI_API_KEY 環境變數):
       #   from openai import OpenAI
       #   resp = OpenAI().chat.completions.create(
       #       model="gpt-4o",
       #       messages=[{"role": "user", "content": user_input}]
       #   )
       #   output_text = resp.choices[0].message.content
       #
       # Anthropic (pip install anthropic — 使用 ANTHROPIC_API_KEY 環境變數):
       #   import anthropic
       #   resp = anthropic.Anthropic().messages.create(
       #       model="claude-sonnet-4-6", max_tokens=1024,
       #       messages=[{"role": "user", "content": user_input}]
       #   )
       #   output_text = resp.content[0].text
       #
       # Google Gemini (pip install google-genai — 使用 GOOGLE_API_KEY 環境變數):
       #   from google import genai
       #   resp = genai.Client().models.generate_content(
       #       model="gemini-2.5-pro", contents=user_input
       #   )
       #   output_text = resp.text
       #
       # 自訂 / OpenAI 相容代理 (pip install openai — 使用 CUSTOM_BASE_URL + CUSTOM_API_KEY 環境變數):
       # 用於 Azure OpenAI, NVIDIA NIM, 本地端 Ollama 或任何 OpenAI 相容端點，
       # 包含測試整合代理。與 `ax ai-integrations create` 中的 `custom` 提供者匹配。
       #   import os
       #   from openai import OpenAI
       #   resp = OpenAI(
       #       base_url=os.environ["CUSTOM_BASE_URL"],          # 例如 https://my-proxy.example.com/v1
       #       api_key=os.environ.get("CUSTOM_API_KEY", "none"),
       #   ).chat.completions.create(
       #       model=os.environ.get("CUSTOM_MODEL", "default"),
       #       messages=[{"role": "user", "content": user_input}]
       #   )
       #   output_text = resp.choices[0].message.content

       latency_ms = round((time.time() - start) * 1000)
       runs.append({
           "example_id": ex["id"],
           "output": output_text,
           "metadata": {"model": "MODEL_NAME", "latency_ms": latency_ms}
       })
       print(f"  {ex['id']}: {latency_ms}ms", file=sys.stderr)

   json.dump(runs, sys.stdout, indent=2)
   ```

   **執行前：** 安裝提供者 SDK (`pip install openai` / `anthropic` / `google-genai`) 並確保已在您的 Shell 中將 API 金鑰設定為環境變數。如果您無法存取 API，請停止並告知使用者所需內容。

4. 驗證執行結果檔案：
   ```bash
   python3 -c "import json; runs=json.load(open('runs.json')); print(f'{len(runs)} runs'); print(json.dumps(runs[0], indent=2))"
   ```
   每次執行必須具備 `example_id` 與 `output`。選填欄位：`evaluations`, `metadata`。
5. 建立實驗：
   ```bash
   ax experiments create --name "gpt-4o-baseline" --dataset DATASET_NAME --space SPACE --file runs.json
   ```
6. 驗證：`ax experiments get "gpt-4o-baseline" --dataset DATASET_NAME --space SPACE`

### 比較兩個實驗 (Compare two experiments)

1. 匯出兩個實驗：
   ```bash
   ax experiments export "experiment-a" --dataset DATASET_NAME --space SPACE --stdout > a.json
   ax experiments export "experiment-b" --dataset DATASET_NAME --space SPACE --stdout > b.json
   ```
2. 依 `example_id` 比較評估分數：
   ```bash
   # 實驗 A 的平均正確性分數
   jq '[.[] | .evaluations.correctness.score] | add / length' a.json

   # 實驗 B 亦同
   jq '[.[] | .evaluations.correctness.score] | add / length' b.json
   ```
3. 尋找結果不同的範例：
   ```bash
   jq -s '.[0] as $a | .[1][] | . as $run |
     {
       example_id: $run.example_id,
       b_score: $run.evaluations.correctness.score,
       a_score: ($a[] | select(.example_id == $run.example_id) | .evaluations.correctness.score)
     }' a.json b.json
   ```
4. 每個評估者的分數分佈（通過/失敗/部分 通過的計數）：
   ```bash
   # 依標籤計數 (實驗 A)
   jq '[.[] | .evaluations.correctness.label] | group_by(.) | map({label: .[0], count: length})' a.json
   ```
5. 尋找退化 (regressions)（在 A 中通過但在 B 中失敗的範例）：
   ```bash
   jq -s '
     [.[0][] | select(.evaluations.correctness.label == "correct")] as $passed_a |
     [.[1][] | select(.evaluations.correctness.label != "correct") |
       select(.example_id as $id | $passed_a | any(.example_id == $id))
     ]
   ' a.json b.json
   ```

**統計顯著性附註：** 當每個評估者至少有 30 個範例時，分數比較最為可靠。若範例較少，請將差異僅視為趨勢方向 — 在 n=10 的情況下，5% 的差異可能是雜訊。請在回報分數時同時提供樣本數：`jq 'length' a.json`。

### 下載實驗結果進行分析 (Download experiment results for analysis)

1. `ax experiments list --dataset DATASET_NAME --space SPACE` -- 尋找實驗
2. `ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE` -- 下載至檔案
3. 解析：`jq '.[] | {example_id, score: .evaluations.correctness.score}' experiment_*/runs.json`

### 將匯出內容透過管線傳送至其他工具 (Pipe export to other tools)

```bash
# 計算執行次數
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | jq 'length'

# 擷取所有輸出
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | jq '.[].output'

# 取得低分執行結果
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | jq '[.[] | select(.evaluations.correctness.score < 0.5)]'

# 轉換為 CSV
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | jq -r '.[] | [.example_id, .output, .evaluations.correctness.score] | @csv'
```

## 相關技能 (Related Skills)

- **arize-dataset**：建立或匯出此實驗所對應的資料集 → 請先使用 `arize-dataset`
- **arize-prompt-optimization**：使用實驗結果來改善提示詞 → 下一步是 `arize-prompt-optimization`
- **arize-trace**：檢查失敗實驗執行的個別 Span Trace → 使用 `arize-trace`
- **arize-link**：從實驗執行產出可點擊的 UI Trace 連結 → 使用 `arize-link`

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰錯誤、過期或無權存取此空間。使用 references/ax-profiles.md 修復設定檔。 |
| `No profile found` | 未配置設定檔。參閱 references/ax-profiles.md 建立一個。 |
| `Experiment not found` | 使用 `ax experiments list --space SPACE` 驗證實驗名稱 |
| `Invalid runs file` | 每次執行必須具備 `example_id` 與 `output` 欄位 |
| `example_id mismatch` | 確保 `example_id` 值與資料集中的 ID 匹配（匯出資料集進行驗證） |
| `No runs found` | 匯出傳回空結果 -- 透過 `ax experiments get` 驗證實驗是否包含執行結果 |
| `Dataset not found` | 連結的資料集可能已被刪除；透過 `ax datasets list` 檢查 |

## 儲存認證供日後使用 (Save Credentials for Future Use)

參閱 references/ax-profiles.md § 儲存認證供日後使用。
