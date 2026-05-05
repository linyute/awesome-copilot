---
name: arize-prompt-optimization
description: "當使用生產環境追蹤資料、評估與標核來最佳化、改善或偵錯 LLM 提示詞時，請叫用此技能。此外，當使用者想要使其 AI 回應更好或提高 AI 輸出品質時，也可以使用。涵蓋從 Span 中擷取提示詞、收集效能訊號，以及使用 ax CLI 執行數據驅動的最佳化循環。"
---

# Arize 提示詞最佳化技能 (Arize Prompt Optimization Skill)

> **`SPACE`** — 所有 `--space` 旗標與 `ARIZE_SPACE` 環境變數接受空間 **名稱**（例如 `my-workspace`）或 base64 空間 **ID**（例如 `U3BhY2U6...`）。請使用 `ax spaces list` 查找您的資訊。

## 概念 (Concepts)

### 提示詞在追蹤資料中的位置 (Where Prompts Live in Trace Data)

LLM 應用程式發出的 Span 遵循 OpenInference 語義慣例。提示詞根據 Span 種類與檢測方式，儲存在不同的 Span 屬性中：

| 資料欄 | 包含內容 | 何時使用 |
|--------|-----------------|-------------|
| `attributes.llm.input_messages` | 角色型格式的結構化對話訊息（系統、使用者、助理、工具） | **主要來源**，用於基於對話的 LLM 提示詞 |
| `attributes.llm.input_messages.roles` | 角色陣列：`system`, `user`, `assistant`, `tool` | 擷取個別訊息角色 |
| `attributes.llm.input_messages.contents` | 訊息內容字串陣列 | 擷取訊息文字 |
| `attributes.input.value` | 序列化的提示詞或使用者問題（通用，適用於所有 Span 種類） | 當結構化訊息不可用時的備用方案 |
| `attributes.llm.prompt_template.template` | 帶有 `{variable}` 預留位置的範本（例如 `"Answer {question} using {context}"`） | 當應用程式使用提示詞範本時 |
| `attributes.llm.prompt_template.variables` | 範本變數值（JSON 物件） | 查看代入範本的具體值 |
| `attributes.output.value` | 模型回應文字 | 查看 LLM 產出的內容 |
| `attributes.llm.output_messages` | 結構化模型輸出（包含工具呼叫） | 檢查工具呼叫回應 |

### 依 Span 種類尋找提示詞 (Finding Prompts by Span Kind)

- **LLM Span** (`attributes.openinference.span.kind = 'LLM'`): 檢查 `attributes.llm.input_messages` 以獲取結構化對話訊息，或者檢查 `attributes.input.value` 以獲取序列化提示詞。檢查 `attributes.llm.prompt_template.template` 以獲取範本。
- **鏈 (Chain) / 代理程式 (Agent) Span**: `attributes.input.value` 包含使用者問題。實際的 LLM 提示詞位於 **子項 LLM Span** 上 — 請在追蹤樹中向下尋找。
- **工具 (Tool) Span**: `attributes.input.value` 包含工具輸入，`attributes.output.value` 包含工具結果。通常不是提示詞所在位置。

### 效能訊號欄位 (Performance Signal Columns)

這些資料欄承載了用於最佳化的回饋資料：

| 資料欄模式 | 來源 | 告訴您什麼 |
|---------------|--------|-------------------|
| `annotation.<name>.label` | 人工審核者 | 類別型等級（例如 `correct`, `incorrect`, `partial`） |
| `annotation.<name>.score` | 人工審核者 | 數值品質分數 (0.0 - 1.0) |
| `annotation.<name>.text` | 人工審核者 | 等級的自由格式說明 |
| `eval.<name>.label` | LLM-as-judge 評估 | 自動化類別評估 |
| `eval.<name>.score` | LLM-as-judge 評估 | 自動化數值分數 |
| `eval.<name>.explanation` | LLM-as-judge 評估 | 為何評估給出該分數 — **對最佳化最有價值** |
| `attributes.input.value` | 追蹤資料 | 輸入 LLM 的內容 |
| `attributes.output.value` | 追蹤資料 | LLM 產出的內容 |
| `{experiment_name}.output` | 實驗執行 | 來自特定實驗的輸出 |

## 先決條件 (Prerequisites)

直接進行任務 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔 (profiles)。

如果 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前設定檔。如果缺少設定檔或 API 金鑰錯誤，請遵循 references/ax-profiles.md 建立/更新。如果使用者沒有其金鑰，請引導他們前往 https://app.arize.com/admin > API Keys
- 空間 (Space) 未知 → 執行 `ax spaces list` 以按名稱選取，或詢問使用者
- 專案 (Project) 不明確 → 詢問使用者，或執行 `ax projects list -o json --limit 100` 並呈現為可選選項
- LLM 提供者呼叫失敗（缺少 OPENAI_API_KEY / ANTHROPIC_API_KEY） → 執行 `ax ai-integrations list --space SPACE` 以檢查平台管理的認證。如果皆不存在，請要求使用者提供金鑰，或透過 **arize-ai-provider-integration** 技能建立整合。
- **安全性：** 絕不讀取 `.env` 檔案或在檔案系統中搜尋認證。使用 `ax profiles` 獲取 Arize 認證，使用 `ax ai-integrations` 獲取 LLM 提供者金鑰。如果無法透過這些管道取得認證，請詢問使用者。

## 階段 1：擷取目前提示詞 (Phase 1: Extract the Current Prompt)

### 尋找包含提示詞的 LLM Span

```bash
# 對 LLM Span 進行採樣（提示詞所在位置）
ax spans export PROJECT --filter "attributes.openinference.span.kind = 'LLM'" -l 10 --stdout

# 依模型篩選
ax spans export PROJECT --filter "attributes.llm.model_name = 'gpt-4o'" -l 10 --stdout

# 依 Span 名稱篩選（例如特定的 LLM 呼叫）
ax spans export PROJECT --filter "name = 'ChatCompletion'" -l 10 --stdout
```

### 匯出追蹤以檢查提示詞結構

```bash
# 匯出一個 Trace 中的所有 Span
ax spans export PROJECT --trace-id TRACE_ID

# 匯出單一 Span
ax spans export PROJECT --span-id SPAN_ID
```

### 從匯出的 JSON 中擷取提示詞

```bash
# 擷取結構化對話訊息（系統 + 使用者 + 助理）
jq '.[0] | {
  messages: .attributes.llm.input_messages,
  model: .attributes.llm.model_name
}' trace_*/spans.json

# 專門擷取系統提示詞
jq '[.[] | select(.attributes.llm.input_messages.roles[]? == "system")] | .[0].attributes.llm.input_messages' trace_*/spans.json

# 擷取提示詞範本與變數
jq '.[0].attributes.llm.prompt_template' trace_*/spans.json

# 從 input.value 擷取（非結構化提示詞的備用方案）
jq '.[0].attributes.input.value' trace_*/spans.json
```

### 將提示詞重構為訊息 (Reconstruct the prompt as messages)

取得 Span 資料後，將提示詞重構為訊息陣列：

```json
[
  {"role": "system", "content": "您是一個有用的助理，負責..."},
  {"role": "user", "content": "給予 {input}，回答問題：{question}"}
]
```

如果 Span 具有 `attributes.llm.prompt_template.template`，則該提示詞使用了變數。請保留這些預留位置（`{variable}` 或 `{{variable}}`）— 它們在執行時會被代換。

## 階段 2：收集效能資料 (Phase 2: Gather Performance Data)

### 來自追蹤（生產環境回饋）(From traces (production feedback))

```bash
# 尋找錯誤 Span -- 這些通常表示提示詞失效
ax spans export PROJECT \
  --filter "status_code = 'ERROR' AND attributes.openinference.span.kind = 'LLM'" \
  -l 20 --stdout

# 尋找評估分數低的 Span
ax spans export PROJECT \
  --filter "annotation.correctness.label = 'incorrect'" \
  -l 20 --stdout

# 尋找高延遲的 Span（可能表示提示詞過於複雜）
ax spans export PROJECT \
  --filter "attributes.openinference.span.kind = 'LLM' AND latency_ms > 10000" \
  -l 20 --stdout

# 匯出錯誤追蹤以進行詳細檢查
ax spans export PROJECT --trace-id TRACE_ID
```

### 來自資料集與實驗 (From datasets and experiments)

```bash
# 匯出資料集（地面實況範例 Ground truth examples）
ax datasets export DATASET_NAME --space SPACE
# -> dataset_*/examples.json

# 匯出實驗結果（LLM 產出的內容）
ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE
# -> experiment_*/runs.json
```

### 合併資料集 + 實驗以進行分析 (Merge dataset + experiment for analysis)

透過 `example_id` 合併兩個檔案，以便同時查看輸入、輸出與評估結果：

```bash
# 計算範例與執行次數
jq 'length' dataset_*/examples.json
jq 'length' experiment_*/runs.json

# 檢視單一合併記錄
jq -s '
  .[0] as $dataset |
  .[1][0] as $run |
  ($dataset[] | select(.id == $run.example_id)) as $example |
  {
    input: $example,
    output: $run.output,
    evaluations: $run.evaluations
  }
' dataset_*/examples.json experiment_*/runs.json

# 尋找失敗範例（評估分數 < 門檻）
jq '[.[] | select(.evaluations.correctness.score < 0.5)]' experiment_*/runs.json
```

### 識別要最佳化的內容 (Identify what to optimize)

在失敗中尋找模式：

1. **將輸出與地面實況進行比較**：LLM 輸出與預期有哪些不同？
2. **閱讀評估解釋**：`eval.*.explanation` 告訴您失敗的 **原因**。
3. **檢查標核文字**：人工回饋描述了具體問題。
4. **尋找冗長度不符**：輸出是否相對於地面實況過長或過短。
5. **檢查格式合規性**：輸出是否符合預期格式？

## 階段 3：最佳化提示詞 (Phase 3: Optimize the Prompt)

### 最佳化中介提示詞 (The Optimization Meta-Prompt)

使用此範本產生改進版本的提示詞。填入三個預留位置，然後發送給您的 LLM（GPT-4o, Claude 等）：

````
您是提示詞最佳化專家。根據原始基準提示詞及其關聯的效能資料（輸入、輸出、評估標籤與解釋），產生一個改進結果的新版本。

原始基準提示詞 (ORIGINAL BASELINE PROMPT)
========================

{在此處貼上原始提示詞}

========================

效能資料 (PERFORMANCE DATA)
================

以下記錄顯示了目前提示詞的表現。每筆記錄包含輸入、LLM 輸出與評估回饋：

{在此處貼上記錄}

================

如何使用這些資料

1. 比較輸出：查看 LLM 產生的內容與預期內容。
2. 審閱評估分數：檢查哪些範例評分較差以及原因。
3. 檢視標核內容：人工回饋顯示了哪些有效，哪些無效。
4. 識別模式：尋找跨多個範例的常見問題。
5. 專注於失敗：輸出與預期值不同的資料列是需要修復的重點。

對齊策略 (ALIGNMENT STRATEGY)

- 如果輸出包含地面實況中不存在的額外文字或推理，請移除鼓勵解釋或冗長推理的指示。
- 如果輸出遺漏資訊，請新增包含該資訊的指示。
- 如果輸出格式錯誤，請新增明確的格式指示。
- 專注於輸出與目標不同的資料列 -- 這些是需要修復的失敗點。

規則

維持結構：
- 使用與目前提示詞相同的範本變數（{var} 或 {{var}}）。
- 不要更動已經運作良好的部分。
- 保留原始提示詞中精確的傳回格式指示。

避免過度擬合 (Avoid Overfitting)：
- **不要** 逐字將範例複製到提示詞中。
- **不要** 精確引用特定的測試資料輸出。
- **而是**：擷取導致輸出好壞的 **本質**。
- **而是**：加入一般性的指引與原則。
- **而是**：如果加入少樣本 (few-shot) 範例，請建立能展示原則的 **合成 (SYNTHETIC) 範例**，而非使用上述的實際資料。

目標：建立一個能良好類化至新輸入的提示詞，而非一個死記硬背測試資料的提示詞。

輸出格式

將修訂後的提示詞作為訊息的 JSON 陣列傳回：

[
  {"role": "system", "content": "..."},
  {"role": "user", "content": "..."}
]

並提供一個簡短的推理區塊（項目清單），說明：
- 您發現了哪些問題。
- 修訂後的提示詞如何解決這些問題。
````

### 準備效能資料 (Preparing the performance data)

在貼入範本前，將記錄格式化為 JSON 陣列：

```bash
# 來自資料集 + 實驗：合併並選取相關欄位
jq -s '
  .[0] as $ds |
  [.[1][] | . as $run |
    ($ds[] | select(.id == $run.example_id)) as $ex |
    {
      input: $ex.input,
      expected: $ex.expected_output,
      actual_output: $run.output,
      eval_score: $run.evaluations.correctness.score,
      eval_label: $run.evaluations.correctness.label,
      eval_explanation: $run.evaluations.correctness.explanation
    }
  ]
' dataset_*/examples.json experiment_*/runs.json

# 來自匯出的 Span：擷取帶有標核的輸入/輸出配對
jq '[.[] | select(.attributes.openinference.span.kind == "LLM") | {
  input: .attributes.input.value,
  output: .attributes.output.value,
  status: .status_code,
  model: .attributes.llm.model_name
}]' trace_*/spans.json
```

### 套用修訂後的提示詞 (Applying the revised prompt)

在 LLM 傳回修訂後的訊息陣列後：

1. 並排比較原始與修訂後的提示詞。
2. 驗證所有範本變數皆已保留。
3. 檢查格式指示是否完整。
4. 在正式部署前先在少數範例上進行測試。

## 階段 4：迭代 (Phase 4: Iterate)

### 最佳化循環 (The optimization loop)

```
1. 擷取提示詞    -> 階段 1 (執行一次)
2. 執行實驗      -> ax experiments create ...
3. 匯出結果      -> ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE
4. 分析失敗      -> 使用 jq 尋找低分結果
5. 執行中介提示詞 -> 階段 3，使用新的失敗資料
6. 套用修訂後的提示詞
7. 從步驟 2 重複
```

### 測量改進程度 (Measure improvement)

```bash
# 比較不同實驗間的分數
# 實驗 A (基準)
jq '[.[] | .evaluations.correctness.score] | add / length' experiment_a/runs.json

# 實驗 B (已最佳化)
jq '[.[] | .evaluations.correctness.score] | add / length' experiment_b/runs.json

# 尋找從失敗翻轉為通過的範例
jq -s '
  [.[0][] | select(.evaluations.correctness.label == "incorrect")] as $fails |
  [.[1][] | select(.evaluations.correctness.label == "correct") |
    select(.example_id as $id | $fails | any(.example_id == $id))
  ] | length
' experiment_a/runs.json experiment_b/runs.json
```

### A/B 比較兩個提示詞

1. 針對同一個資料集建立兩個實驗，每個實驗使用不同的提示詞版本。
2. 匯出兩者：`ax experiments export EXP_A` 與 `ax experiments export EXP_B`。
3. 比較平均分數、失敗率與特定範例的翻轉情況。
4. 檢查退化 (regressions) — 使用提示詞 A 通過但使用提示詞 B 失敗的範例。

## 提示工程最佳實踐 (Prompt Engineering Best Practices)

在編寫或修訂提示詞時套用以下方法：

| 技術 | 何時套用 | 範例 |
|-----------|--------------|---------|
| 清晰、詳細的指示 | 輸出過於模糊或離題 | 「將情感分類為以下其中之一：正向 (positive)、負向 (negative)、中性 (neutral)」 |
| 指示置於開頭 | 模型忽略後續指示 | 在範例之前放置任務描述 |
| 逐步分解 | 複雜的多步驟流程 | 「首先擷取實體，然後對每個實體進行分類，最後進行總結」 |
| 特定人格 (Personas) | 需要一致的風格/語氣 | 「您是一位為機構投資者撰稿的高級財務分析師」 |
| 分隔符號權杖 (Delimiter tokens) | 各區塊混雜在一起 | 使用 `---`, `###` 或 XML 標籤將輸入與指示分開 |
| 少樣本 (Few-shot) 範例 | 輸出格式需要澄清 | 展示 2-3 個合成的輸入/輸出配對 |
| 輸出長度規範 | 回應過長或過短 | 「請用恰好 2-3 個句子回答」 |
| 推理指示 | 準確性至關重要 | 「回答前請先逐步思考」 |
| 「我不知道」指引 | 存在幻覺風險 | 「如果答案不在提供的上下文中，請說『我沒有足夠的資訊』」 |

### 變數保留 (Variable preservation)

最佳化使用範本變數的提示詞時：

- **單大括號** (`{variable}`): Python f-string / Jinja 風格。在 Arize 中最為常見。
- **雙大括號** (`{{variable}}`): Mustache 風格。在框架要求時使用。
- 最佳化過程中 **絕不** 新增或移除變數預留位置。
- **絕不** 重新命名變數 — 執行時的代換取決於精確的名稱。
- 加入少樣本範例時，請使用字面值，而非變數預留位置。

## 工作流程 (Workflows)

### 從失敗的追蹤中最佳化提示詞 (Optimize a prompt from a failing trace)

1. 尋找失敗的追蹤：
   ```bash
   ax traces list PROJECT --filter "status_code = 'ERROR'" --limit 5
   ```
2. 匯出該 Trace：
   ```bash
   ax spans export PROJECT --trace-id TRACE_ID
   ```
3. 從 LLM Span 中擷取提示詞：
   ```bash
   jq '[.[] | select(.attributes.openinference.span.kind == "LLM")][0] | {
     messages: .attributes.llm.input_messages,
     template: .attributes.llm.prompt_template,
     output: .attributes.output.value,
     error: .attributes.exception.message
   }' trace_*/spans.json
   ```
4. 從錯誤訊息或輸出中識別失敗原因。
5. 將提示詞與錯誤上下文填入最佳化中介提示詞（階段 3）。
6. 套用修訂後的提示詞。

### 使用資料集與實驗進行最佳化 (Optimize using a dataset and experiment)

1. 尋找資料集與實驗：
   ```bash
   ax datasets list --space SPACE
   ax experiments list --dataset DATASET_NAME --space SPACE
   ```
2. 匯出兩者：
   ```bash
   ax datasets export DATASET_NAME --space SPACE
   ax experiments export EXPERIMENT_NAME --dataset DATASET_NAME --space SPACE
   ```
3. 準備用於中介提示詞的合併資料。
4. 執行最佳化中介提示詞。
5. 使用修訂後的提示詞建立新實驗以測量改進程度。

### 偵錯產出格式錯誤的提示詞 (Debug a prompt that produces wrong format)

1. 匯出輸出格式錯誤的 Span：
   ```bash
   ax spans export PROJECT \
     --filter "attributes.openinference.span.kind = 'LLM' AND annotation.format.label = 'incorrect'" \
     -l 10 --stdout > bad_format.json
   ```
2. 查看 LLM 產出的內容與預期的差異。
3. 在提示詞中加入明確的格式指示（JSON Schema、範例、分隔符號）。
4. 常見修補方案：加入顯示精確預期輸出格式的少樣本範例。

### 減少 RAG 提示詞中的幻覺 (Reduce hallucination in a RAG prompt)

1. 尋找模型產生幻覺的追蹤：
   ```bash
   ax spans export PROJECT \
     --filter "annotation.faithfulness.label = 'unfaithful'" \
     -l 20 --stdout
   ```
2. 同時匯出並檢查檢索器 (retriever) 與 LLM Span：
   ```bash
   ax spans export PROJECT --trace-id TRACE_ID
   jq '[.[] | {kind: .attributes.openinference.span.kind, name, input: .attributes.input.value, output: .attributes.output.value}]' trace_*/spans.json
   ```
3. 檢查擷取的上下文是否確實包含答案。
4. 在系統提示詞中加入基礎指引 (grounding instructions)：「僅使用提供之上下文中的資訊。如果答案不在上下文中，請如實說明。」

## 疑難排解 (Troubleshooting)

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `No profile found` | 未配置設定檔。參閱 references/ax-profiles.md 建立一個。 |
| Span 上無 `input_messages` | 檢查 Span 種類 — 鏈/代理程式 Span 將提示詞儲存在子項 LLM Span 上，而非自身上 |
| 提示詞範本為 `null` | 並非所有檢測都會發出 `prompt_template`。請改用 `input_messages` 或 `input.value` |
| 最佳化後變數遺失 | 驗證修訂後的提示詞是否保留了原始提示詞中所有的 `{var}` 預留位置 |
| 最佳化使結果變差 | 檢查是否過度擬合 — 中介提示詞可能死記了測試資料。請確保少樣本範例是合成的 |
| 無評估/標核欄位 | 先執行評估（透過 Arize UI 或 SDK），然後重新匯出 |
| 找不到實驗輸出欄位 | 欄位名稱為 `{experiment_name}.output` -- 透過 `ax experiments get` 檢查精確的實驗名稱 |
| Span JSON 發生 `jq` 錯誤 | 確保您指向了正確的檔案路徑（例如 `trace_*/spans.json`） |

## 儲存認證供日後使用 (Save Credentials for Future Use)

參閱 references/ax-profiles.md § 儲存認證供日後使用。
