---
name: arize-evaluator
description: "針對 Arize 上的 LLM-as-judge 評估工作流程叫用此技能：建立/更新評估者、針對 Span 或實驗執行評估、任務、觸發執行 (trigger-run)、欄位映射以及持續監控。當使用者說：建立一個評估者、LLM 評審、幻覺/忠實度/正確性/相關性、執行評估、對我的 Span 或實驗進行評分、ax tasks、觸發執行、觸發評估、欄位映射、持續監控、評估查詢篩選器、評估者版本或改善評估者提示詞時使用。"
---

# Arize 評估者技能 (Arize Evaluator Skill)

> **`SPACE`** — 所有 `--space` 旗標與 `ARIZE_SPACE` 環境變數接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list` 查找您的資訊。

此技能涵蓋在 Arize 上設計、建立與執行 **LLM-as-judge 評估者**。評估者定義了評審方式；而 **任務 (task)** 則是您將其針對實際資料執行的方式。

---

## 先決條件 (Prerequisites)

直接進行任務 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔 (profiles)。

如果 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前設定檔。如果缺少設定檔或 API 金鑰錯誤，請遵循 references/ax-profiles.md 建立/更新。如果使用者沒有其金鑰，請引導他們前往 https://app.arize.com/admin > API Keys
- 空間 (Space) 未知 → 執行 `ax spaces list` 以按名稱選取，或詢問使用者
- LLM 提供者呼叫失敗（缺少 OPENAI_API_KEY / ANTHROPIC_API_KEY） → 執行 `ax ai-integrations list --space SPACE` 以檢查平台管理的認證。如果皆不存在，請要求使用者提供金鑰，或透過 **arize-ai-provider-integration** 技能建立整合。
- **安全性：** 絕不讀取 `.env` 檔案或在檔案系統中搜尋認證。使用 `ax profiles` 獲取 Arize 認證，使用 `ax ai-integrations` 獲取 LLM 提供者金鑰。如果無法透過這些管道取得認證，請詢問使用者。
- **至關重要 — 絕不編造評估結果：** 如果評估任務失敗、被取消或未產生分數，請清楚報告失敗原因並解釋出錯之處。**不要** 進行「人工評估」、捏造品質分數、估計百分比，或將任何代理程式產生的分析呈現為來自 Arize 評估系統。請改為建議：(1) 修復識別出的問題並重試，(2) 嘗試從 Arize UI 執行，(3) 使用 `ax ai-integrations list` 驗證整合認證，(4) 聯絡支援團隊：https://arize.com/support

---

## 概念 (Concepts)

### 什麼是評估者？ (What is an Evaluator?)

**評估者 (evaluator)** 是 LLM-as-judge 的定義。它包含：

| 欄位 | 描述 |
|-------|-------------|
| **範本 (Template)** | 評審提示詞。使用 `{variable}` 預留位置（例如 `{input}`, `{output}`, `{context}`），這些預留位置會在執行時透過任務的欄位映射進行填充。 |
| **分類選擇 (Classification choices)** | 允許的輸出標籤集合（例如 `factual` / `hallucinated`）。二元分類是最常見的預設值。每個選擇都可以選擇性地帶有一個數值分數。 |
| **AI 整合 (AI Integration)** | 評估者用來呼叫評審模型的已儲存 LLM 提供者認證（OpenAI, Anthropic, Bedrock 等）。 |
| **模型 (Model)** | 特定的評審模型（例如 `gpt-4o`, `claude-sonnet-4-5`）。 |
| **叫用參數 (Invocation params)** | 模型設定的選填 JSON，例如 `{"temperature": 0}`。建議使用低溫度以確保可重現性。 |
| **最佳化方向 (Optimization direction)** | 分數越高越好 (`maximize`) 還是越低越好 (`minimize`)。設定 UI 如何呈現趨勢。 |
| **資料粒度 (Data granularity)** | 評估者是在 **Span**、**Trace** 還是 **Session** 層級執行。大多數評估者在 Span 層級執行。 |

評估者具備 **版本管理 (versioned)** 功能 — 每次提示詞或模型的變更都會建立一個新的不可變版本。最新的版本為作用中版本。

### 什麼是任務？ (What is a Task?)

**任務 (task)** 是您針對實際資料執行一或多個評估者的方式。任務會附加至 **專案 (project)**（即時追蹤/Span）或 **資料集 (dataset)**（實驗執行）。一個任務包含：

| 欄位 | 描述 |
|-------|-------------|
| **評估者 (Evaluators)** | 要執行的評估者清單。您可以在一個任務中執行多個評估者。 |
| **欄位映射 (Column mappings)** | 將每個評估者的範本變數映射至 Span 或實驗執行中的實際欄位路徑（例如 `"input" → "attributes.input.value"`）。這使得評估者可以在不同專案與實驗之間移植。 |
| **查詢篩選器 (Query filter)** | SQL 風格的運算式，用於選取要評估的 Span/執行（例如 `"span_kind = 'LLM'"`）。選填但對於精確度而言很重要。 |
| **持續性 (Continuous)** | 針對專案任務：是否在新的 Span 到達時自動對其評分。 |
| **取樣率 (Sampling rate)** | 針對持續性專案任務：要評估的新 Span 比例 (0–1)。 |

---

## 資料粒度 (Data Granularity)

`--data-granularity` 旗標控制評估者對哪種資料單元進行評分。預設值為 `span`，且僅適用於 **專案任務**（不適用於資料集/實驗任務 — 那些會直接評估實驗執行）。

| 層級 | 評估對象 | 用途 | 結果欄位前綴 |
|-------|-------------------|---------|---------------------|
| `span` (預設) | 個別 Span | 問答正確性、幻覺、相關性 | `eval.{name}.label` / `.score` / `.explanation` |
| `trace` | Trace 中的所有 Span，按 `context.trace_id` 分組 | 代理程式軌跡、任務正確性 — 任何需要完整呼叫鏈的內容 | `trace_eval.{name}.label` / `.score` / `.explanation` |
| `session` | Session 中的所有 Trace，按 `attributes.session.id` 分組並按開始時間排序 | 多輪連貫性、整體語氣、對話品質 | `session_eval.{name}.label` / `.score` / `.explanation` |

### Trace 與 Session 聚合的工作原理 (How trace and session aggregation works)

針對 **Trace** 粒度，具有相同 `context.trace_id` 的 Span 會被分組在一起。在傳遞給評審模型之前，評估者範本使用的欄位值會被合併為一個單一字串（每個值截斷至 10 萬個字元）。

針對 **Session** 粒度，會先進行相同的 Trace 層級分組，然後按 `start_time` 排序 Trace 並按 `attributes.session.id` 分組。Session 層級的值總共限制在 10 萬個字元內。

### `{conversation}` 範本變數 (The `{conversation}` template variable)

在 Session 粒度下，`{conversation}` 是一個特殊的範本變數，它會呈現為 Session 中所有 Trace 的 `{input, output}` 輪次 JSON 陣列，建構自 `attributes.input.value` / `attributes.llm.input_messages`（輸入端）以及 `attributes.output.value` / `attributes.llm.output_messages`（輸出端）。

在 Span 或 Trace 粒度下，`{conversation}` 被視為一般的範本變數，並像其他變數一樣透過欄位映射進行解析。

### 多評估者任務 (Multi-evaluator tasks)

一個任務可以包含不同粒度的評估者。在執行時，系統會使用 **最高** 的粒度 (session > trace > span) 進行資料擷取，並自動 **為每個評估者拆分為一個子執行**。任務的評估者 JSON 中針對每個評估者的 `query_filter` 會進一步縮小包含哪些 Span（例如，僅 Session 中的工具呼叫 Span）。

---

## 基本 CRUD (Basic CRUD)

### AI 整合 (AI Integrations)

AI 整合儲存評估者使用的 LLM 提供者認證。如需完整 CRUD — 列出、為所有提供者（OpenAI, Anthropic, Azure, Bedrock, Vertex, Gemini, NVIDIA NIM, 自訂）建立、更新與刪除 — 請使用 **arize-ai-provider-integration** 技能。

常見情況（OpenAI）的快速參考：

```bash
# 先檢查現有的整合
ax ai-integrations list --space SPACE

# 若不存在則建立
ax ai-integrations create \
  --name "My OpenAI Integration" \
  --provider openAI \
  --api-key $OPENAI_API_KEY
```

複製傳回的整合 ID — 這是執行 `ax evaluators create --ai-integration-id` 時所必需的。

### 評估者 (Evaluators)

```bash
# 列出 / 取得
ax evaluators list --space SPACE
ax evaluators get ID                    # 接受名稱或 ID
ax evaluators get NAME --space SPACE   # 使用名稱而非 ID 時為必填
ax evaluators list-versions NAME_OR_ID
ax evaluators get-version VERSION_ID

# 建立（建立評估者及其第一個版本）
ax evaluators create \
  --name "Answer Correctness" \
  --space SPACE \
  --description "判斷模型答案是否正確" \
  --template-name "correctness" \
  --commit-message "Initial version" \
  --ai-integration-id INT_ID \
  --model-name "gpt-4o" \
  --include-explanations \
  --use-function-calling \
  --classification-choices '{"correct": 1, "incorrect": 0}' \
  --template '您是一名評估者。給予使用者問題與模型回應，判斷回應是否正確回答了問題。

使用者問題：{input}

模型回應：{output}

請僅使用以下其中一個標籤進行回應：correct, incorrect'

# 建立新版本（用於提示詞或模型變更 — 版本是不可變的）
ax evaluators create-version NAME_OR_ID \
  --commit-message "Added context grounding" \
  --template-name "correctness" \
  --ai-integration-id INT_ID \
  --model-name "gpt-4o" \
  --include-explanations \
  --classification-choices '{"correct": 1, "incorrect": 0}' \
  --template '更新後的提示詞...

{input} / {output} / {context}'

# 僅更新中介資料（名稱、描述 — 而非提示詞）
ax evaluators update NAME_OR_ID \
  --name "New Name" \
  --description "Updated description"

# 刪除（永久性 — 移除所有版本）
ax evaluators delete NAME_OR_ID
```

**`create` 的關鍵旗標：**

| 旗標 | 必填 | 描述 |
|------|----------|-------------|
| `--name` | 是 | 評估者名稱（在空間內必須唯一） |
| `--space` | 是 | 用於建立的空間名稱或 ID |
| `--template-name` | 是 | 評估欄位名稱 — 字母數字、空格、連字號、底線 |
| `--commit-message` | 是 | 此版本的描述 |
| `--ai-integration-id` | 是 | AI 整合 ID（見上文） |
| `--model-name` | 是 | 評審模型（例如 `gpt-4o`） |
| `--template` | 是 | 帶有 `{variable}` 預留位置的提示詞（在 bash 中需使用單引號） |
| `--classification-choices` | 是 | 將選擇標籤映射至數值分數的 JSON 物件，例如 `'{"correct": 1, "incorrect": 0}'` |
| `--description` | 否 | 易於閱讀的描述 |
| `--include-explanations` | 否 | 在標籤旁包含推理過程 |
| `--use-function-calling` | 否 | 優先使用結構化函式呼叫輸出 |
| `--invocation-params` | 否 | 模型參數的 JSON，例如 `'{"temperature": 0}'` |
| `--data-granularity` | 否 | `span` (預設), `trace` 或 `session`。僅與專案任務相關，與資料集/實驗任務無關。參見資料粒度章節。 |
| `--direction` | 否 | 最佳化方向：`maximize` 或 `minimize`。設定 UI 如何呈現趨勢。 |
| `--provider-params` | 否 | 提供者特定參數的 JSON 物件 |

### 任務 (Tasks)

> `PROJECT_NAME`, `DATASET_NAME` 以及 `evaluator_id` 皆接受名稱或 base64 ID。

```bash
# 列出 / 取得
ax tasks list --space SPACE
ax tasks list --project PROJECT_NAME
ax tasks list --dataset DATASET_NAME --space SPACE
ax tasks get TASK_ID

# 建立（專案 — 持續性）
ax tasks create \
  --name "Correctness Monitor" \
  --task-type template_evaluation \
  --project PROJECT_NAME \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --is-continuous \
  --sampling-rate 0.1

# 建立（專案 — 一次性 / 回填）
ax tasks create \
  --name "Correctness Backfill" \
  --task-type template_evaluation \
  --project PROJECT_NAME \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --no-continuous

# 建立（實驗 / 資料集）
ax tasks create \
  --name "Experiment Scoring" \
  --task-type template_evaluation \
  --dataset DATASET_NAME --space SPACE \
  --experiment-ids "EXP_ID_1,EXP_ID_2" \   # 來自 `ax experiments list --space SPACE -o json` 的 base64 ID
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"output": "output"}}]' \
  --no-continuous

# 觸發執行（專案任務 — 使用資料時間視窗）
ax tasks trigger-run TASK_ID \
  --data-start-time "2026-03-20T00:00:00" \
  --data-end-time "2026-03-21T23:59:59" \
  --wait

# 觸發執行（實驗任務 — 使用實驗 ID）
ax tasks trigger-run TASK_ID \
  --experiment-ids "EXP_ID_1" \   # 來自 `ax experiments list --space SPACE -o json` 的 base64 ID
  --wait

# 監控
ax tasks list-runs TASK_ID
ax tasks get-run RUN_ID
ax tasks wait-for-run RUN_ID --timeout 300
ax tasks cancel-run RUN_ID --force
```

**觸發執行的時間格式：** `2026-03-21T09:00:00` — 不帶結尾的 `Z`。

**額外的觸發執行旗標：**

| 旗標 | 描述 |
|------|-------------|
| `--max-spans` | 處理 Span 的上限（預設為 10,000） |
| `--override-evaluations` | 對已有標籤的 Span 重新評分 |
| `--wait` / `-w` | 阻塞直到執行結束 |
| `--timeout` | 使用 `--wait` 時的等待秒數（預設為 600） |
| `--poll-interval` | 等待時的輪詢間隔秒數（預設為 5） |

**執行狀態指南：**

| 狀態 | 意義 |
|--------|---------|
| `completed`, 0 spans | 評估索引落後約 1–2 小時 — 最近內嵌的 Span 可能尚未建立索引。請將時間視窗移至至少 2 小時前的資料，或擴大時間範圍以涵蓋更多歷史資料。 |
| `cancelled` ~1s | 整合認證無效 |
| `cancelled` ~3min | 找到了 Span 但 LLM 呼叫失敗 — 請檢查模型名稱或金鑰 |
| `completed`, N > 0 | 成功 — 在 UI 中檢查分數 |

---

## 工作流程 A：為專案建立評估者 (Workflow A: Create an evaluator for a project)

當使用者說類似「*為我的 Playground Traces 專案建立一個評估者*」時使用此流程。

### 步驟 1：確認專案名稱

`ax spans export` 直接接受專案名稱 — 無需查詢 ID。如果您不知道專案名稱，請列出可用專案：

```bash
ax projects list --space SPACE -o json
```

尋找 `"name"` 相符（不區分大小寫）的條目，並在後續指令中將該名稱用作 `PROJECT`。如果您稍後在使用名稱時遇到驗證錯誤，請改用該專案的 `"id"`（base64 字串）。

### 步驟 2：瞭解要評估的內容

如果使用者已指定評估者類型（幻覺、正確性、相關性等）→ 跳至步驟 3。

如果未指定，請對最近的 Span 進行採樣，以便根據實際資料建立評估者：

```bash
ax spans export PROJECT --space SPACE -l 10 --days 30 --stdout
```

檢查 `attributes.input`, `attributes.output`, Span 種類以及任何現有標核。識別失敗模式（例如：虛構事實、離題回答、缺少上下文），並提出 **1–3 個具體的評估者構想**。讓使用者挑選。

每個建議必須包含：評估者名稱（粗體）、對其判斷內容的一句話描述，以及括號中的二元標籤配對。格式如下：

1. **名稱** — 評估對象的描述。(`label_a` / `label_b`)

範例：
1. **回應正確性 (Response Correctness)** — 代理程式的回應是否正確解決了使用者的財務查詢？ (`correct` / `incorrect`)
2. **幻覺 (Hallucination)** — 回應是否捏造了未基於所擷取上下文的事實？ (`factual` / `hallucinated`)

### 步驟 3：確認或建立 AI 整合

```bash
ax ai-integrations list --space SPACE -o json
```

如果存在合適的整合，請記下其 ID。如果不存在，請使用 **arize-ai-provider-integration** 技能建立一個。詢問使用者想要用於評審的提供者/模型。

### 步驟 4：建立評估者

使用下方的範本設計最佳實踐。保持評估者名稱與變數的 **通用性 (generic)** — 任務（步驟 6）會透過 `column_mappings` 處理專案特定的連結。

```bash
ax evaluators create \
  --name "Hallucination" \
  --space SPACE \
  --template-name "hallucination" \
  --commit-message "Initial version" \
  --ai-integration-id INT_ID \
  --model-name "gpt-4o" \
  --include-explanations \
  --use-function-calling \
  --classification-choices '{"factual": 1, "hallucinated": 0}' \
  --template '您是一名評估者。給予使用者問題與模型回應，判斷回應是屬實還是包含不支援的主張。

使用者問題：{input}

模型回應：{output}

請僅使用以下其中一個標籤進行回應：hallucinated, factual'
```

### 步驟 5：詢問 — 回填、持續評估還是兩者都要？

**建議做法：** 務必先從小型回填（約 100 個歷史 Span）開始，在開啟持續監控之前驗證評估者。這能讓您在對所有未來生產 Span 進行評分之前，於已知資料上發現欄位映射錯誤、錯誤的 Span 種類以及範本問題。僅在回填確認評分正確後才啟用持續評估。

在建立任務之前，請詢問：

> 「您想要：
> (a) 對歷史 Span 執行 **回填 (backfill)**（一次性）？
> (b) 設定對未來新 Span 的 **持續 (continuous)** 評估？
> (c) **兩者都要** — 先回填以進行驗證，然後繼續自動對新 Span 進行評分？（建議）」

### 步驟 6：從實際 Span 資料確定欄位映射

不要猜測路徑。擷取樣本並檢查實際存在的欄位：

```bash
ax spans export PROJECT --space SPACE -l 5 --days 7 --stdout
```

針對每個範本變數（`{input}`, `{output}`, `{context}`），尋找相符的 JSON 路徑。常見起點 — **務必在使用前在實際資料上驗證**：

| 範本變數 | LLM Span | CHAIN Span |
|---|---|---|
| `input` | `attributes.input.value` | `attributes.input.value` |
| `output` | `attributes.llm.output_messages.0.message.content` | `attributes.output.value` |
| `context` | `attributes.retrieval.documents.contents` | — |
| `tool_output` | `attributes.input.value` (備用) | `attributes.output.value` |

**驗證 Span 種類對齊：** 如果評估者提示詞假設為 LLM 最終文字，但任務目標是 CHAIN Span（反之亦然），執行可能會取消或對錯誤的文字進行評分。確保任務上的 `query_filter` 與您映射的 Span 種類相符。

**`query_filter` 僅適用於已建立索引的屬性：** 評估者 JSON 中的 `query_filter` 是針對評估索引進行評估的，而非原始 Span 儲存。`attributes.metadata.*` 下的屬性或自訂金鑰可能未建立索引，並會靜默地不匹配任何內容。請使用知名的已建立索引屬性（如 `span_kind` 或 `attributes.llm.model_name`）進行篩選。如果篩選器在資料存在的情況下仍傳回 0 個 Span，請嘗試移除篩選器作為診斷步驟。

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

為範本引用的 **每個** 變數包含映射。遺漏一個會導致執行無法產生有效分數。

### 步驟 7：建立任務

**僅回填 (a)：**
```bash
ax tasks create \
  --name "Hallucination Backfill" \
  --task-type template_evaluation \
  --project PROJECT \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --no-continuous
```

**僅持續評估 (b)：**
```bash
ax tasks create \
  --name "Hallucination Monitor" \
  --task-type template_evaluation \
  --project PROJECT \
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"input": "attributes.input.value", "output": "attributes.output.value"}}]' \
  --is-continuous \
  --sampling-rate 0.1
```

**兩者都要 (c)：** 建立時使用 `--is-continuous`，然後在步驟 8 中觸發回填執行。

### 步驟 8：觸發回填執行（如要求）

> **評估索引落後：** 評估索引是從主追蹤儲存非同步建構的，可能落後 **1–2 小時**。對於您的第一次測試執行，請使用至少 2 小時前的結束時間視窗。如果您對過去一小時內內嵌的 Span 將 `--data-end-time` 設定為「現在」，執行將成功完成但對 0 個 Span 進行評分。

首先尋找哪些時間範圍有資料：
```bash
ax spans export PROJECT --space SPACE -l 100 --days 1 --stdout   # 先嘗試過去 24 小時
ax spans export PROJECT --space SPACE -l 100 --days 7 --stdout   # 若無則擴大範圍
```

使用來自實際 Span 的 `start_time` / `end_time` 欄位來設定視窗。對於第一次驗證執行，請將 `--max-spans` 限制在約 100 個以獲得快速回饋：

```bash
ax tasks trigger-run TASK_ID \
  --data-start-time "2026-03-20T00:00:00" \
  --data-end-time "2026-03-21T23:59:59" \
  --max-spans 100 \
  --wait
```

在擴大到完整回填或啟用持續評估前，請先審核分數與解釋。

---

## 工作流程 B：為實驗建立評估者 (Workflow B: Create an evaluator for an experiment)

當使用者說類似「*為我的實驗建立評估者*」或「*評估我的資料集執行*」時使用此流程。

**如果使用者說「資料集」但沒有實驗：** 任務必須針對實驗（而非單純的資料集）。詢問：
> 「評估任務是針對實驗執行而非直接針對資料集。您是否需要協助先在該資料集上建立一個實驗？」

如果是，請使用 **arize-experiment** 技能建立一個，然後回到這裡。

### 步驟 1：尋找資料集與實驗名稱

```bash
ax datasets list --space SPACE
ax experiments list --dataset DATASET_NAME --space SPACE -o json
```

記下資料集名稱以及要評分的實驗名稱。這些在後續指令中接受名稱或 ID — 優先使用名稱。

### 步驟 2：瞭解要評估的內容

如果使用者已指定評估者類型 → 跳至步驟 3。

如果未指定，請檢查最近的實驗執行，以便根據實際資料建立評估者：

```bash
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | python3 -c "import sys,json; runs=json.load(sys.stdin); print(json.dumps(runs[0], indent=2))"
```

檢查 `output`, `input`, `evaluations` 以及 `metadata` 欄位。識別差距（使用者關心但尚未擁有的指標），並提出 **1–3 個評估者構想**。每個建議必須包含：評估者名稱（粗體）、一句話描述以及括號中的二元標籤配對 — 格式與工作流程 A 步驟 2 相同。

### 步驟 3：確認或建立 AI 整合

與工作流程 A 步驟 3 相同。

### 步驟 4：建立評估者

與工作流程 A 步驟 4 相同。保持變數通用。

### 步驟 5：從實際執行資料確定欄位映射

執行資料的形狀與 Span 資料不同。檢查：

```bash
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | python3 -c "import sys,json; runs=json.load(sys.stdin); print(json.dumps(runs[0], indent=2))"
```

實驗執行的常見映射：
- `output` → `"output"`（每次執行中的頂層欄位）
- `input` → 檢查它是在執行上還是在連結的資料集範例中

如果 `input` 不在執行 JSON 中，請匯出資料集範例以尋找路徑：
```bash
ax datasets export DATASET_NAME --space SPACE --stdout | python3 -c "import sys,json; ex=json.load(sys.stdin); print(json.dumps(ex[0], indent=2))"
```

### 步驟 6：建立任務

```bash
ax tasks create \
  --name "Experiment Correctness" \
  --task-type template_evaluation \
  --dataset DATASET_NAME --space SPACE \
  --experiment-ids "EXP_ID" \   # 來自 `ax experiments list --space SPACE -o json` 的 base64 ID
  --evaluators '[{"evaluator_id": "EVAL_ID", "column_mappings": {"output": "output"}}]' \
  --no-continuous
```

### 步驟 7：觸發與監控

```bash
ax tasks trigger-run TASK_ID \
  --experiment-ids "EXP_ID" \   # 來自 `ax experiments list --space SPACE -o json` 的 base64 ID
  --wait

ax tasks list-runs TASK_ID
ax tasks get-run RUN_ID
```

---

## 範本設計最佳實踐 (Best Practices for Template Design)

### 1. 使用通用、具可移植性的變數名稱

請使用 `{input}`, `{output}` 以及 `{context}` — 不要使用與特定專案或 Span 屬性綁定的名稱（例如不要使用 `{attributes_input_value}`）。評估者本身保持抽象；**任務的 `column_mappings`** 才是您將其與特定專案或實驗中實際欄位連結的地方。這使得同一個評估者可以在不修改的情況下於多個專案與實驗中執行。

### 2. 預設使用二元標籤 (Binary labels)

請使用恰好兩個明確的字串標籤（例如 `hallucinated` / `factual`, `correct` / `incorrect`, `pass` / `fail`）。二元標籤具有以下優點：
- 評審模型最容易產生一致的結果
- 業界最通用
- 在儀表板中最容易解讀

如果使用者堅持要有兩個以上的選擇，那也沒問題 — 但請優先建議二元標籤並解釋權衡取捨（標籤越多 → 越模糊 → 評分者間信度 Inter-rater reliability 越低）。

### 3. 明確規定模型必須傳回的內容

範本必須指示評審模型 **僅** 回應標籤字串 — 不要包含其他內容。提示詞中的標籤字串必須與 `--classification-choices` 中的標籤 **完全匹配**（拼寫一致、大小寫一致）。

良好做法：
```
請僅使用以下其中一個標籤進行回應：hallucinated, factual
```

不良做法（過於開放）：
```
這是幻覺嗎？請回答是或否。
```

### 4. 保持低溫

傳遞 `--invocation-params '{"temperature": 0}'` 以獲得可重現的評分。較高的溫度會為評估結果引入雜訊。

### 5. 使用 `--include-explanations` 進行偵錯

在初始設定期間，請務必包含解釋，以便在規模化信任標籤之前驗證評審的推理是否正確。

### 6. 在 Bash 中使用單引號傳遞範本

單引號可防止 Shell 對 `{variable}` 預留位置進行插值。雙引號會導致問題：

```bash
# 正確
--template '評審此項：{input} → {output}'

# 錯誤 — Shell 可能會解讀 { } 或失敗
--template "評審此項：{input} → {output}"
```

### 7. 務必設定 `--classification-choices` 以匹配您的範本標籤

`--classification-choices` 中的標籤必須與 `--template` 中引用的標籤完全匹配（拼寫一致、大小寫一致）。遺漏 `--classification-choices` 會導致任務執行失敗，並出現「缺少邊界規則與分類選擇 (missing rails and classification choices)」的錯誤。

---

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `401 Unauthorized` | API 金鑰可能無權存取此空間。請在 https://app.arize.com/admin > API Keys 進行驗證 |
| `Evaluator not found` | `ax evaluators list --space SPACE` |
| `Integration not found` | `ax ai-integrations list --space SPACE` |
| `Task not found` | `ax tasks list --space SPACE` |
| `project and dataset-id are mutually exclusive` | 建立任務時僅能使用其中之一 |
| `experiment-ids required for dataset tasks` | 在 `create` 與 `trigger-run` 中加入 `--experiment-ids` |
| `sampling-rate only valid for project tasks` | 從資料集任務中移除 `--sampling-rate` |
| `ax spans export` 發生驗證錯誤 | 專案名稱通常有效；如果仍出現驗證錯誤，請透過 `ax projects list --space SPACE -o json` 查詢 base64 專案 ID 並改用 `id` 欄位 |
| 範本驗證錯誤 | 在 Bash 中使用單引號包覆的 `--template '...'`；使用單大括號 `{var}` 而非雙大括號 `{{var}}` |
| 執行卡在 `pending` | `ax tasks get-run RUN_ID`；然後 `ax tasks cancel-run RUN_ID` |
| 執行狀態為 `cancelled` ~1s | 整合認證無效 — 請檢查 AI 整合 |
| 執行狀態為 `cancelled` ~3min | 找到了 Span 但 LLM 呼叫失敗 — 錯誤的模型名稱或金鑰失效 |
| `completed`, 0 spans | 擴大時間視窗；評估索引可能尚未涵蓋較舊的資料 |
| UI 中無分數 | 修復 `column_mappings` 以匹配 Span/執行中的實際路徑 |
| 分數看起來不正確 | 加入 `--include-explanations` 並檢查部分樣本的評審推理 |
| 評估者因 Span 種類錯誤而取消 | 使 `query_filter` 與 `column_mappings` 與 LLM vs CHAIN Span 匹配 |
| `trigger-run` 時間格式錯誤 | 使用 `2026-03-21T09:00:00` — 不帶結尾的 `Z` |
| 執行失敗：「missing rails and classification choices」 | 在 `ax evaluators create` 中加入 `--classification-choices '{"label_a": 1, "label_b": 0}'` — 標籤必須與範本匹配 |
| `completed`, 所有 Span 被跳過 | 查詢篩選器匹配了 Span，但欄位映射錯誤或範本變數無法解析 — 匯出樣本 Span 並驗證路徑 |
| 設定了 `query_filter` 但評分了 0 個 Span | 篩選器屬性可能未在評估索引中建立索引。`attributes.metadata.*` 與自訂屬性通常未建立索引。請改用 `span_kind` 或 `attributes.llm.model_name`，或移除篩選器以確認視窗中存在 Span。 |

### 診斷已取消的執行 (Diagnosing cancelled runs)

當任務執行被取消（狀態為 `cancelled`）時，請依序遵循以下檢查清單：

**1. 檢查整合認證**
```bash
ax ai-integrations list --space SPACE -o json
```
驗證評估者使用的整合 ID 是否存在且具備有效認證。如果整合已被刪除或 API 金鑰已過期，執行會在約 1 秒內取消。

**2. 驗證模型名稱**
```bash
ax evaluators get EVALUATOR_NAME --space SPACE -o json
```
檢查 `model_name` 欄位。拼字錯誤或已淘汰的模型會導致 LLM 呼叫失敗，執行會在約 3 分鐘後取消。

**3. 匯出樣本 Span/執行並與 column_mappings 比較路徑**

針對專案任務：
```bash
ax spans export PROJECT --space SPACE -l 1 --days 7 --stdout | python3 -m json.tool
```

針對實驗任務：
```bash
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE --stdout | python3 -c "import sys,json; runs=json.load(sys.stdin); print(json.dumps(runs[0], indent=2)) if runs else print('No runs')"
```

將匯出的 JSON 路徑與任務的 `column_mappings` 進行比較。針對每個範本變數，確認映射的路徑確實存在。常見的不符情況：
- 在實驗執行上將 `output` 映射至 `attributes.output.value`（應僅為 `output`）
- 在 CHAIN Span 上將 `input` 映射至 `attributes.input.value`，而實際路徑為 `attributes.llm.input_messages`
- 將 `context` 映射至正在篩選的 Span 種類中不存在的路徑

**4. 檢查 `data_start_time` 是否非 Epoch 時間**

如果 `trigger-run` 使用了 `0`, `1970-01-01` 或空字串作為開始時間，則時間視窗無效。請務必從實際 Span 時間戳記衍生：
```bash
ax spans export PROJECT --space SPACE -l 5 --days 30 --stdout | python3 -c "
import sys, json
spans = json.load(sys.stdin)
for s in spans:
    print(s.get('start_time', 'N/A'), s.get('end_time', 'N/A'))
"
```

**5. 驗證 Span 種類是否符合評估者範圍**

如果評估者建立時使用了 `--data-granularity trace`，但任務的 `query_filter` 為 `span_kind = 'LLM'`，則執行可能找不到符合條件的資料而取消。確保粒度與篩選器一致。

**6. 檢查所有範本變數是否皆可解析**

評估者範本中的每個 `{variable}` 必須在 `column_mappings` 中有對應的條目，且該條目解析為非 null 值。針對實際 Span 測試解析情況：
```bash
ax spans export PROJECT --space SPACE -l 3 --days 7 --stdout | python3 -c "
import sys, json
spans = json.load(sys.stdin)
# 將這些路徑替換為您實際的 column_mappings 值
mappings = {'input': 'attributes.input.value', 'output': 'attributes.output.value'}
for i, span in enumerate(spans):
    print(f'--- Span {i} ---')
    for var, path in mappings.items():
        parts = path.split('.')
        val = span
        for p in parts:
            val = val.get(p) if isinstance(val, dict) else None
        status = 'FOUND' if val else 'MISSING'
        print(f'  {var} ({path}): {status} — {str(val)[:80] if val else \"null\"}')
"
```
如果任何變數在所有 Span 上都顯示 MISSING，請修復欄位映射或調整 `query_filter` 以針對不同的 Span 種類。

---

## 相關技能 (Related Skills)

- **arize-ai-provider-integration**：LLM 提供者整合的完整 CRUD（建立、更新、刪除認證）
- **arize-trace**：匯出 Span 以發現資料欄路徑與時間範圍
- **arize-experiment**：建立實驗並匯出執行，以用於實驗欄位映射
- **arize-dataset**：當執行遺漏輸入欄位時，匯出資料集範例以尋找輸入欄位
- **arize-link**：將評估者與任務連結至 Arize UI 的深層連結

---

## 儲存認證供日後使用 (Save Credentials for Future Use)

參閱 references/ax-profiles.md § 儲存認證供日後使用。
