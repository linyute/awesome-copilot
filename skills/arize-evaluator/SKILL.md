---
name: arize-evaluator
description: "針對 Arize 上的「LLM 作為評判 (LLM-as-judge)」評估工作流程呼叫此技能：建立/更新評估器、針對 Span 或實驗執行評估、任務 (Tasks)、觸發執行 (Trigger-run)、欄位對照 (Column mapping) 以及持續監控。當使用者提到以下內容時使用：建立評估器、LLM 評判、幻覺/忠實度/正確性/相關性、執行評估、為我的 Span 或實驗評分、ax 任務、觸發執行、觸發評估、欄位對照、持續監控、評估查詢過濾器、評估器版本，或改進評估器提示詞。"
---

# Arize 評估器技能 (Arize Evaluator Skill)

此技能涵蓋在 Arize 上設計、建立與執行**「LLM 作為評判 (LLM-as-judge)」評估器**。評估器定義了評判標準；**任務 (Task)** 則是您針對真實資料執行評估的方式。

---

## 先決條件

直接開始執行工作 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔。

若 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` (找不到指令) 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` (未經授權) / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前的設定檔。若缺少設定檔或 API 金鑰錯誤：檢查 `.env` 檔案中是否有 `ARIZE_API_KEY`，並使用它透過 references/ax-profiles.md 建立/更新設定檔。若 `.env` 中也沒有金鑰，請向使用者詢問其 Arize API 金鑰 (https://app.arize.com/admin > API Keys)
- 空間 ID (Space ID) 未知 → 檢查 `.env` 中的 `ARIZE_SPACE_ID`，或執行 `ax spaces list -o json`，或詢問使用者
- LLM 提供者呼叫失敗 (缺少 OPENAI_API_KEY / ANTHROPIC_API_KEY) → 檢查 `.env`，若存在則載入，否則詢問使用者

---

## 概念

### 什麼是評估器 (Evaluator)？

**評估器**是「LLM 作為評判」的定義。它包含：

| 欄位 | 說明 |
|-------|-------------|
| **範本 (Template)** | 評判提示詞。使用 `{variable}` 預留位置 (例如：`{input}`, `{output}`, `{context}`)，這些位置會在執行時透過任務的欄位對照進行填寫。 |
| **分類選項** | 允許的輸出標籤集合 (例如：`factual` (事實) / `hallucinated` (幻覺))。二元分類是預設且最常見的。每個選項可選擇性地帶有一個數值分數。 |
| **AI 整合** | 評估器用於呼叫評判模型的儲存 LLM 提供者認證資訊 (OpenAI、Anthropic、Bedrock 等)。 |
| **模型 (Model)** | 特定的評判模型 (例如：`gpt-4o`, `claude-sonnet-4-5`)。 |
| **呼叫參數** | 模型設定的選用 JSON，例如 `{"temperature": 0}`。為確保可重現性，建議使用低溫度。 |
| **優化方向** | 分數越高是越好 (`maximize`) 還是越差 (`minimize`)。這決定了 UI 如何呈現趨勢。 |
| **資料細粒度** | 評估器是在 **Span**、**追蹤 (Trace)** 還是**會話 (Session)** 層級執行。大多數評估器在 Span 層級執行。 |

評估器具有**版本管理**功能 — 每次提示詞或模型的變更都會建立一個新的不可變版本。最新版本即為使用中的版本。

### 什麼是任務 (Task)？

**任務**是您針對真實資料執行一或多個評估器的方式。任務會附加至**專案** (即時追蹤/Span) 或**資料集** (實驗執行)。任務包含：

| 欄位 | 說明 |
|-------|-------------|
| **評估器** | 要執行的評估器列表。您可以在一個任務中執行多個評估器。 |
| **欄位對照** | 將每個評估器的範本變數對照至 Span 或實驗執行中的實際欄位路徑 (例如：`"input" → "attributes.input.value"`)。這使得評估器可以跨專案和實驗移植。 |
| **查詢過濾器** | 類 SQL 表達式，用於選取要評估的 Span 或實驗執行 (例如：`"span_kind = 'LLM'"` )。雖然是選填的，但對於精準度而言非常重要。 |
| **持續執行** | 針對專案任務：是否在新的 Span 到達時自動對其評分。 |
| **抽樣率** | 針對持續性的專案任務：要評估的新 Span 比例 (0–1)。 |

---

## 資料細粒度 (Data Granularity)

`--data-granularity` 旗標控制評估器評分的資料單位。預設為 `span`，且僅適用於**專案任務** (不適用於資料集/實驗任務 — 那些任務會直接評估實驗執行結果)。

| 層級 | 評估對象 | 用途 | 結果欄位前綴 |
|-------|-------------------|---------|---------------------|
| `span` (預設) | 個別 Span | 問答正確性、幻覺、相關性 | `eval.{name}.label` / `.score` / `.explanation` |
| `trace` | 追蹤中的所有 Span，按 `context.trace_id` 分組 | 代理軌跡、任務正確性 — 任何需要完整呼叫鏈的內容 | `trace_eval.{name}.label` / `.score` / `.explanation` |
| `session` | 會話中的所有追蹤，按 `attributes.session.id` 分組並按開始時間排序 | 多輪對話連貫性、整體語氣、對話品質 | `session_eval.{name}.label` / `.score` / `.explanation` |

### 追蹤與會話聚合的工作原理

對於 **追蹤 (trace)** 細粒度，共用相同 `context.trace_id` 的 Span 會被編組在一起。在傳遞給評判模型之前，評估器範本使用的欄位值會以逗號連接成單一字串 (每個值截斷至 10 萬字元)。

對於 **會話 (session)** 細粒度，會先進行追蹤層級的編組，然後追蹤按 `start_time` 排序並按 `attributes.session.id` 分組。會話層級的值上限總計為 10 萬字元。

### `{conversation}` 範本變數

在會話細粒度下，`{conversation}` 是一個特殊的範本變數，它會呈現為會話中所有追蹤的 `{input, output}` 輪次 JSON 陣列，該陣列由 `attributes.input.value` / `attributes.llm.input_messages` (輸入端) 與 `attributes.output.value` / `attributes.llm.output_messages` (輸出端) 建立而成。

在 Span 或追蹤細粒度下，`{conversation}` 被視為一般的範本變數，並像其他變數一樣透過欄位對照來解析。

### 多評估器任務

一個任務可以包含不同細粒度的評估器。系統在執行時會使用**最高**的細粒度 (session > trace > span) 來擷取資料，並自動**為每個評估器拆分為一個子執行項目**。任務的評估器 JSON 中各個評估器的 `query_filter` 會進一步縮小包含哪些 Span (例如：僅限會話中的工具呼叫 Span)。

---

## 基本 CRUD

### AI 整合

AI 整合儲存了評估器使用的 LLM 提供者認證資訊。如需完整的 CRUD 功能 — 包括列出、為所有提供者 (OpenAI, Anthropic, Azure, Bedrock, Vertex, Gemini, NVIDIA NIM, 自訂) 建立、更新及刪除 — 請使用 **arize-ai-provider-integration** 技能。

常見案例 (OpenAI) 快速參考：

```bash
# 先檢查現有的整合
ax ai-integrations list --space-id SPACE_ID

# 若不存在則建立
ax ai-integrations create \
  --name "我的 OpenAI 整合" \
  --provider openAI \
  --api-key $OPENAI_API_KEY
```

複製回傳的整合 ID — 執行 `ax evaluators create --ai-integration-id` 時需要此 ID。

### 評估器 (Evaluators)

```bash
# 列出 / 獲取
ax evaluators list --space-id SPACE_ID
ax evaluators get EVALUATOR_ID
ax evaluators list-versions EVALUATOR_ID
ax evaluators get-version VERSION_ID

# 建立 (建立評估器及其第一個版本)
ax evaluators create \
  --name "答案正確性" \
  --space-id SPACE_ID \
  --description "評判模型回答是否正確" \
  --template-name "correctness" \
  --commit-message "初始版本" \
  --ai-integration-id INT_ID \
  --model-name "gpt-4o" \
  --include-explanations \
  --use-function-calling \
  --classification-choices '{"correct": 1, "incorrect": 0}' \
  --template '您是一位評估員。給定使用者問題與模型回應，判斷該回應是否正確回答了問題。

使用者問題：{input}

模型回應：{output}

請僅回傳下列標籤之一：correct, incorrect'

# 建立新版本 (用於更改提示詞或模型 — 版本是不可變的)
ax evaluators create-version EVALUATOR_ID \
  --commit-message "新增內容基礎 (Grounding)" \
  --template-name "correctness" \
  --ai-integration-id INT_ID \
  --model-name "gpt-4o" \
  --include-explanations \
  --classification-choices '{"correct": 1, "incorrect": 0}' \
  --template '更新後的提示詞...

{input} / {output} / {context}'

# 僅更新中繼資料 (名稱、說明 — 而非提示詞)
ax evaluators update EVALUATOR_ID \
  --name "新名稱" \
  --description "更新後的說明"

# 刪除 (永久刪除 — 移除所有版本)
ax evaluators delete EVALUATOR_ID
```

**`create` 的關鍵旗標：**

| 旗標 | 必要 | 說明 |
|------|----------|-------------|
| `--name` | 是 | 評估器名稱 (空間內必須唯一) |
| `--space-id` | 是 | 要在其中建立評估器的空間 |
| `--template-name` | 是 | 評估欄位名稱 — 字母、數值、空格、連字號、底線 |
| `--commit-message` | 是 | 此版本的描述 |
| `--ai-integration-id` | 是 | AI 整合 ID (見上方說明) |
| `--model-name` | 是 | 評判模型 (例如：`gpt-4o`) |
| `--template` | 是 | 帶有 `{variable}` 預留位置的提示詞 (在 Bash 中使用單引號) |
| `--classification-choices` | 是 | 將標籤對照至數值分數的 JSON 物件，例如 `'{"correct": 1, "incorrect": 0}'` |
| `--description` | 否 | 易於閱讀的說明 |
| `--include-explanations` | 否 | 在標籤旁包含推理過程 |
| `--use-function-calling` | 否 | 偏好結構化的函式呼叫輸出 |
| `--invocation-params` | 否 | 模型參數的 JSON，例如 `'{"temperature": 0}'` |
| `--data-granularity` | 否 | `span` (預設), `trace` 或 `session`。僅與專案任務相關，與資料集/實驗任務無關。參閱「資料細粒度」章節。 |
| `--provider-params` | 否 | 提供者特定參數的 JSON 物件 |

### 任務 (Tasks)

```bash
# 列出 / 獲取
ax tasks list --space-id SPACE_ID
ax tasks list --project-id PROJ_ID
ax tasks list --dataset-id DATASET_ID
ax tasks get TASK_ID

# 建立 (專案 — 持續監控)
ax tasks create \
  --name "正確性監控" \
  --task-type template_evaluation \
  --project-id PROJ_ID \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --is-continuous \
  --sampling-rate 0.1

# 建立 (專案 — 一次性 / 回填)
ax tasks create \
  --name "正確性回填" \
  --task-type template_evaluation \
  --project-id PROJ_ID \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --no-continuous

# 建立 (實驗 / 資料集)
ax tasks create \
  --name "實驗評分" \
  --task-type template_evaluation \
  --dataset-id DATASET_ID \
  --experiment-ids "EXP_ID_1,EXP_ID_2" \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"output": "output"}}]' \
  --no-continuous

# 觸發執行 (專案任務 — 使用資料時間視窗)
ax tasks trigger-run TASK_ID \
  --data-start-time "2026-03-20T00:00:00" \
  --data-end-time "2026-03-21T23:59:59" \
  --wait

# 觸發執行 (實驗任務 — 使用實驗 ID)
ax tasks trigger-run TASK_ID \
  --experiment-ids "EXP_ID_1" \
  --wait

# 監控
ax tasks list-runs TASK_ID
ax tasks get-run RUN_ID
ax tasks wait-for-run RUN_ID --timeout 300
ax tasks cancel-run RUN_ID --force
```

**trigger-run 的時間格式：** `2026-03-21T09:00:00` — 不帶尾隨的 `Z`。

**trigger-run 的額外旗標：**

| 旗標 | 說明 |
|------|-------------|
| `--max-spans` | 處理 Span 的數量上限 (預設為 10,000) |
| `--override-evaluations` | 對已有標籤的 Span 重新評分 |
| `--wait` / `-w` | 阻塞直到執行完成 |
| `--timeout` | 使用 `--wait` 時的等待秒數 (預設為 600) |
| `--poll-interval` | 等待時的輪詢間隔秒數 (預設為 5) |

**執行狀態指南：**

| 狀態 | 意義 |
|--------|---------|
| `completed` (已完成), 0 個 Span | 該時間視窗內的評估索引中沒有 Span — 請放寬時間範圍 |
| `cancelled` (已取消) ~1s | 整合認證資訊無效 |
| `cancelled` (已取消) ~3min | 找到了 Span 但 LLM 呼叫失敗 — 檢查模型名稱或金鑰 |
| `completed` (已完成), N > 0 | 成功 — 請在 UI 中檢查分數 |

---

## 工作流程 A：為專案建立評估器

當使用者說「*為我的 Playground Traces 專案建立一個評估器*」之類的內容時使用。

### 步驟 1：將專案名稱解析為 ID

`ax spans export` 需要專案 **ID**，而非名稱 — 傳遞名稱會導致驗證錯誤。請務必先查詢 ID：

```bash
ax projects list --space-id SPACE_ID -o json
```

尋找 `"name"` 相符的項目 (不區分大小寫)。複製其 `"id"` (Base64 字串)。

### 步驟 2：瞭解要評估的內容

若使用者已指定評估器類型 (幻覺、正確性、相關性等) → 跳至步驟 3。

若未指定，請對最近的 Span 進行抽樣，以便根據實際資料建立評估器：

```bash
ax spans export PROJECT_ID --space-id SPACE_ID -l 10 --days 30 --stdout
```

檢查 `attributes.input`, `attributes.output`, Span 類型以及任何現有的標註。識別失敗模式 (例如：憑空捏造事實、回答離題、缺少上下文)，並提出 **1–3 個具體的評估器構想**。讓使用者從中挑選。

每項建議必須包含：評估器名稱 (粗體)、評判內容的單句說明，以及括號內的二元標籤對。格式如下：

1. **名稱** — 正在評判之內容的說明。(`標籤_a` / `標籤_b`)

範例：
1. **回答正確性** — 代理的回應是否正確解決了使用者的財務查詢？ (`correct` / `incorrect`)
2. **幻覺** — 回應是否捏造了未根據檢索內容證實的事實？ (`factual` / `hallucinated`)

### 步驟 3：確認或建立 AI 整合

```bash
ax ai-integrations list --space-id SPACE_ID -o json
```

若存在適合的整合，請記下其 ID。若不存在，請使用 **arize-ai-provider-integration** 技能建立一個。詢問使用者想要哪種提供者/模型作為評判模型。

### 步驟 4：建立評估器

遵循下方的範本設計最佳實務。評估器名稱與變數請保持**通用性** — 專案特定的連接將由任務 (步驟 6) 透過 `column_mappings` 處理。

```bash
ax evaluators create \
  --name "幻覺" \
  --space-id SPACE_ID \
  --template-name "hallucination" \
  --commit-message "初始版本" \
  --ai-integration-id INT_ID \
  --model-name "gpt-4o" \
  --include-explanations \
  --use-function-calling \
  --classification-choices '{"factual": 1, "hallucinated": 0}' \
  --template '您是一位評估員。給定使用者問題與模型回應，判斷該回應是事實還是包含未經證實的陳述。

使用者問題：{input}

模型回應：{output}

請僅回傳下列標籤之一：hallucinated, factual'
```

### 步驟 5：詢問 — 回填、持續監控還是兩者都要？

在建立任務前，請詢問：

> 「您想要：
> (a) 對歷史 Span 執行**回填 (Backfill)** (一次性)？
> (b) 針對未來的新 Span 設定**持續**評估？
> (c) **兩者都要** — 現在回填並保持自動為新 Span 評分？」

### 步驟 6：從實際 Span 資料中確定欄位對照

不要靠猜測來設定路徑。請擷取樣本並檢查實際存在的欄位：

```bash
ax spans export PROJECT_ID --space-id SPACE_ID -l 5 --days 7 --stdout
```

針對每個範本變數 (`{input}`, `{output}`, `{context}`)，尋找相符的 JSON 路徑。常見的出發點如下 — **請務必在使用前在實際資料上驗證**：

| 範本變數 | LLM Span | CHAIN Span |
|---|---|---|
| `input` | `attributes.input.value` | `attributes.input.value` |
| `output` | `attributes.llm.output_messages.0.message.content` | `attributes.output.value` |
| `context` | `attributes.retrieval.documents.contents` | — |
| `tool_output` | `attributes.input.value` (備援) | `attributes.output.value` |

**驗證 Span 種類一致性：** 若評估器提示詞假設的是 LLM 最終文字，但任務目標卻是 CHAIN Span (或反之)，執行可能會取消或評估錯誤的文字。請確保任務上的 `query_filter` 與您對照的 Span 種類相符。

**完整的 `--evaluators` JSON 範例：**

```json
[
  {
    "evaluator_id": "EVAL_ID",
    "query_filter": "span_kind = 'LLM'",
    "column_mappings": {
      "input": "attributes.input.value",
      "output": "attributes.llm.output_messages.0.message.content",
      "context": "attributes.retrieval.documents.contents"
    }
  }
]
```

請為範本引用的**每個**變數都包含對照設定。遺漏任一項都會導致執行時無法產生有效的評分。

### 步驟 7：建立任務

**僅回填 (a)：**
```bash
ax tasks create \
  --name "幻覺回填" \
  --task-type template_evaluation \
  --project-id PROJECT_ID \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --no-continuous
```

**僅持續監控 (b)：**
```bash
ax tasks create \
  --name "幻覺監控" \
  --task-type template_evaluation \
  --project-id PROJECT_ID \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --is-continuous \
  --sampling-rate 0.1
```

**兩者都要 (c)：** 在建立時使用 `--is-continuous`，然後依據步驟 8 另外觸發一次回填執行。

### 步驟 8：觸發回填執行 (若有要求)

先找出哪些時間範圍內有資料：
```bash
ax spans export PROJECT_ID --space-id SPACE_ID -l 100 --days 1 --stdout   # 先試試最近 24 小時
ax spans export PROJECT_ID --space-id SPACE_ID -l 100 --days 7 --stdout   # 若無資料則放寬
```

使用實際 Span 的 `start_time` / `end_time` 欄位來設定視窗。第一次測試執行請使用最近的資料。

```bash
ax tasks trigger-run TASK_ID \
  --data-start-time "2026-03-20T00:00:00" \
  --data-end-time "2026-03-21T23:59:59" \
  --wait
```

---

## 工作流程 B：為實驗建立評估器

當使用者說「*為我的實驗建立一個評估器*」或「*評估我的資料集執行結果*」之類的內容時使用。

**若使用者說「資料集」但沒有實驗：** 任務必須針對實驗 (而非單純的資料集)。請詢問：
> 「評估任務是針對實驗執行結果而非直接針對資料集執行的。您是否需要先協助為該資料集建立一個實驗？」

若是，請使用 **arize-experiment** 技能建立一個，然後再回到此處。

### 步驟 1：解析資料集與實驗

```bash
ax datasets list --space-id SPACE_ID -o json
ax experiments list --dataset-id DATASET_ID -o json
```

記下資料集 ID 以及要評分的實驗 ID。

### 步驟 2：瞭解要評估的內容

若使用者已指定評估器類型 → 跳至步驟 3。

若未指定，請檢查最近一次的實驗執行，以便根據實際資料建立評估器：

```bash
ax experiments export EXPERIMENT_ID --stdout | python3 -c "import sys,json; runs=json.load(sys.stdin); print(json.dumps(runs[0], indent=2))"
```

檢查 `output`, `input`, `evaluations` 以及 `metadata` 欄位。識別差距 (使用者關心但尚未擁有的指標)，並提出 **1–3 個評估器構想**。每項建議必須包含：評估器名稱 (粗體)、單句說明以及括號內的二元標籤對 — 格式與工作流程 A 步驟 2 相同。

### 步驟 3：確認或建立 AI 整合

與工作流程 A 步驟 3 相同。

### 步驟 4：建立評估器

與工作流程 A 步驟 4 相同。保持變數通用化。

### 步驟 5：從實際執行資料中確定欄位對照

執行資料的形狀與 Span 資料不同。檢查：

```bash
ax experiments export EXPERIMENT_ID --stdout | python3 -c "import sys,json; runs=json.load(sys.stdin); print(json.dumps(runs[0], indent=2))"
```

實驗執行的常見對照：
- `output` → `"output"` (每個執行項目中的頂層欄位)
- `input` → 檢查其是否在執行項目中，或內嵌在連結的資料集範例中

若執行項目的 JSON 中沒有 `input`，請匯出資料集範例以尋找路徑：
```bash
ax datasets export DATASET_ID --stdout | python3 -c "import sys,json; ex=json.load(sys.stdin); print(json.dumps(ex[0], indent=2))"
```

### 步驟 6：建立任務

```bash
ax tasks create \
  --name "實驗正確性" \
  --task-type template_evaluation \
  --dataset-id DATASET_ID \
  --experiment-ids "EXP_ID" \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"output": "output"}}]' \
  --no-continuous
```

### 步驟 7：觸發與監控

```bash
ax tasks trigger-run TASK_ID \
  --experiment-ids "EXP_ID" \
  --wait

ax tasks list-runs TASK_ID
ax tasks get-run RUN_ID
```

---

## 範本設計最佳實務

### 1. 使用通用且可移植的變數名稱

使用 `{input}`, `{output}` 和 `{context}` — 不要使用繫結至特定專案或 Span 屬性的名稱 (例如：不要使用 `{attributes_input_value}`)。評估器本身保持抽象；任務的 **`column_mappings`** 才是將其與特定專案或實驗中的實際欄位連接之處。這使得相同的評估器無須修改即可跨多個專案和實驗執行。

### 2. 預設使用二元標籤

使用恰好兩個明確的字串標籤 (例如：`hallucinated` / `factual`, `correct` / `incorrect`, `pass` / `fail`)。二元標籤具有以下優點：
- 最容易讓評判模型產生一致的結果
- 業界最通用
- 在儀表板中最容易解讀

若使用者堅持使用兩個以上的選項也沒關係 — 但請先推薦二元分類並解釋權衡之處 (標籤越多 → 越模糊 → 評分者間信度越低)。

### 3. 明確規定模型必須回傳的內容

範本必須告訴評判模型**僅**回傳標籤字串 — 不要回傳其他內容。提示詞中的標籤字串必須與 `--classification-choices` 中的標籤**完全一致** (拼寫相同，大小寫一致)。

正確：
```
請僅回傳下列標籤之一：hallucinated, factual
```

錯誤 (太過開放)：
```
這是否有幻覺？請回答是或否。
```

### 4. 保持低溫

傳遞 `--invocation-params '{"temperature": 0}'` 以獲得可重現的評分結果。較高的溫度會為評估結果引入雜訊。

### 5. 使用 `--include-explanations` 進行除錯

在初始設定期間，請務必包含解釋，以便您可以在大規模採信標籤前，驗證評判模型的推理是否正確。

### 6. 在 Bash 中使用單引號傳遞範本

單引號可防止 Shell 對 `{variable}` 預留位置進行內插。雙引號會導致問題：

```bash
# 正確
--template '評判此內容：{input} → {output}'

# 錯誤 — Shell 可能會解釋 { } 或導致失敗
--template "評判此內容：{input} → {output}"
```

### 7. 務必設定 `--classification-choices` 以符合您的範本標籤

`--classification-choices` 中的標籤必須與 `--template` 中引用的標籤完全一致 (拼寫相同，大小寫一致)。省略 `--classification-choices` 會導致任務執行失敗並出現「遺漏護欄與分類選項 (missing rails and classification choices)」的錯誤。

---

## 疑難排解

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰可能無權存取此空間。請至 https://app.arize.com/admin > API Keys 驗證 |
| `Evaluator not found` | 執行 `ax evaluators list --space-id SPACE_ID` |
| `Integration not found` | 執行 `ax ai-integrations list --space-id SPACE_ID` |
| `Task not found` | 執行 `ax tasks list --space-id SPACE_ID` |
| `project-id and dataset-id are mutually exclusive` | 建立任務時僅能使用其中之一 |
| `experiment-ids required for dataset tasks` | 在 `create` 和 `trigger-run` 中加入 `--experiment-ids` |
| `sampling-rate only valid for project tasks` | 從資料集任務中移除 `--sampling-rate` |
| `ax spans export` 驗證錯誤 | 傳遞專案 ID (Base64)，而非專案名稱 — 透過 `ax projects list` 查詢 |
| 範本驗證錯誤 | 在 Bash 中使用單引號包裹的 `--template '...'`；使用單大括號 `{var}`，而非雙大括號 `{{var}}` |
| 執行狀態卡在 `pending` | 執行 `ax tasks get-run RUN_ID`；然後執行 `ax tasks cancel-run RUN_ID` |
| 執行狀態為 `cancelled` ~1s | 整合認證資訊無效 — 檢查 AI 整合 |
| 執行狀態為 `cancelled` ~3min | 找到了 Span 但 LLM 呼叫失敗 — 模型名稱錯誤或金鑰有誤 |
| 執行已完成 (`completed`)，0 個 Span | 放寬時間視窗；評估索引可能未涵蓋較舊的資料 |
| UI 中沒有分數 | 修正 `column_mappings` 以符合 Span/執行項目中的實際路徑 |
| 分數看起來不對 | 加入 `--include-explanations` 並檢查評判模型在幾個樣本上的推理過程 |
| 評估器在錯誤的 Span 種類上取消 | 讓 `query_filter` 與 `column_mappings` 符合 LLM 或 CHAIN Span |
| `trigger-run` 時間格式錯誤 | 使用 `2026-03-21T09:00:00` — 不帶尾隨的 `Z` |
| 執行失敗：「missing rails and classification choices」 | 在 `ax evaluators create` 中加入 `--classification-choices '{"label_a": 1, "label_b": 0}'` — 標籤必須與範本相符 |
| 執行已完成 (`completed`)，所有 Span 皆被跳過 | 查詢過濾器與 Span 相符，但欄位對照錯誤或範本變數無法解析 — 匯出樣本 Span 並驗證路徑 |

---

## 相關技能

- **arize-ai-provider-integration**：LLM 提供者整合的完整 CRUD 功能 (建立、更新、刪除認證資訊)
- **arize-trace**：匯出 Span 以探索欄位路徑與時間範圍
- **arize-experiment**：建立實驗並匯出執行項目，以進行實驗欄位對照
- **arize-dataset**：當執行項目省略輸入欄位時，匯出資料集範例以尋找該欄位
- **arize-link**：Arize UI 中評估器與任務的深層連結

---

## 儲存認證資訊供未來使用

參閱 references/ax-profiles.md § 儲存認證資訊供未來使用。
