---
name: arize-prompt-optimization
description: "當使用生產環境追蹤資料、評估與標註來優化、改進或除錯 LLM 提示詞時，呼叫此技能。涵蓋從 Span 中擷取提示詞、收集效能訊號，以及使用 ax CLI 執行資料驅動的優化迴圈。"
---

# Arize 提示詞優化技能 (Arize Prompt Optimization Skill)

## 概念

### 提示詞在追蹤資料中的位置

LLM 應用程式發出的 Span 遵循 OpenInference 語義慣例。提示詞根據 Span 種類與檢測方式，儲存在不同的 Span 屬性中：

| 欄位 | 內容 | 何時使用 |
|--------|-----------------|-------------|
| `attributes.llm.input_messages` | 採角色制格式的結構化聊天訊息 (系統、使用者、助理、工具) | 基於聊天的 LLM 提示詞之**主要來源** |
| `attributes.llm.input_messages.roles` | 角色陣列：`system`, `user`, `assistant`, `tool` | 擷取個別訊息角色 |
| `attributes.llm.input_messages.contents` | 訊息內容字串陣列 | 擷取訊息文字 |
| `attributes.input.value` | 序列化提示詞或使用者問題 (通用，適用於所有 Span 種類) | 當結構化訊息不可用時的備援方案 |
| `attributes.llm.prompt_template.template` | 帶有 `{variable}` 預留位置的範本 (例如：`"Answer {question} using {context}"`) | 當應用程式使用提示詞範本時 |
| `attributes.llm.prompt_template.variables` | 範本變數值 (JSON 物件) | 查看代入範本的具體數值 |
| `attributes.output.value` | 模型回應文字 | 查看 LLM 產出的內容 |
| `attributes.llm.output_messages` | 結構化模型輸出 (包含工具呼叫) | 檢查工具呼叫回應 |

### 按 Span 種類尋找提示詞

- **LLM Span** (`attributes.openinference.span.kind = 'LLM'`)：檢查 `attributes.llm.input_messages` 以獲取結構化聊天訊息，或檢查 `attributes.input.value` 以獲取序列化提示詞。檢查 `attributes.llm.prompt_template.template` 以獲取範本。
- **鏈/代理 (Chain/Agent) Span**：`attributes.input.value` 包含使用者的問題。實際的 LLM 提示詞位於**子項 LLM Span** 上 — 請向下導航追蹤樹。
- **工具 (Tool) Span**：`attributes.input.value` 包含工具輸入，`attributes.output.value` 包含工具結果。通常不是提示詞所在位置。

### 效能訊號欄位

這些欄位承載了用於優化的回饋資料：

| 欄位模式 | 來源 | 提供的資訊 |
|---------------|--------|-------------------|
| `annotation.<name>.label` | 人工審查員 | 類別評等 (例如：`correct`, `incorrect`, `partial`) |
| `annotation.<name>.score` | 人工審查員 | 數值品質分數 (例如：0.0 - 1.0) |
| `annotation.<name>.text` | 人工審查員 | 對評等的自由格式解釋 |
| `eval.<name>.label` | LLM 作為評判的評估 | 自動化類別評估 |
| `eval.<name>.score` | LLM 作為評判的評估 | 自動化數值分數 |
| `eval.<name>.explanation` | LLM 作為評判的評估 | 為何評估給予該分數 — **對優化最有價值** |
| `attributes.input.value` | 追蹤資料 | LLM 的輸入內容 |
| `attributes.output.value` | 追蹤資料 | LLM 的產出內容 |
| `{experiment_name}.output` | 實驗執行結果 | 來自特定實驗的輸出 |

## 先決條件

直接開始執行工作 — 執行您需要的 `ax` 指令。請勿預先檢查版本、環境變數或設定檔。

若 `ax` 指令失敗，請根據錯誤進行疑難排解：
- `command not found` (找不到指令) 或版本錯誤 → 參閱 references/ax-setup.md
- `401 Unauthorized` (未經授權) / 缺少 API 金鑰 → 執行 `ax profiles show` 以檢查目前的設定檔。若缺少設定檔或 API 金鑰錯誤：檢查 `.env` 檔案中是否有 `ARIZE_API_KEY`，並使用它透過 references/ax-profiles.md 建立/更新設定檔。若 `.env` 中也沒有金鑰，請向使用者詢問其 Arize API 金鑰 (https://app.arize.com/admin > API Keys)
- 空間 ID (Space ID) 未知 → 檢查 `.env` 中的 `ARIZE_SPACE_ID`，或執行 `ax spaces list -o json`，或詢問使用者
- 專案不明確 → 檢查 `.env` 中的 `ARIZE_DEFAULT_PROJECT`，或詢問，或執行 `ax projects list -o json --limit 100` 並呈現為選取項
- LLM 提供者呼叫失敗 (缺少 OPENAI_API_KEY / ANTHROPIC_API_KEY) → 檢查 `.env`，若存在則載入，否則詢問使用者

## 第 1 階段：擷取目前的提示詞

### 尋找包含提示詞的 LLM Span

```bash
# 列出 LLM Span (提示詞所在位置)
ax spans list PROJECT_ID --filter "attributes.openinference.span.kind = 'LLM'" --limit 10

# 按模型過濾
ax spans list PROJECT_ID --filter "attributes.llm.model_name = 'gpt-4o'" --limit 10

# 按 Span 名稱過濾 (例如：特定的 LLM 呼叫)
ax spans list PROJECT_ID --filter "name = 'ChatCompletion'" --limit 10
```

### 匯出追蹤以檢查提示詞結構

```bash
# 匯出追蹤中的所有 Span
ax spans export --trace-id TRACE_ID --project PROJECT_ID

# 匯出單一 Span
ax spans export --span-id SPAN_ID --project PROJECT_ID
```

### 從匯出的 JSON 中擷取提示詞

```bash
# 擷取結構化聊天訊息 (系統 + 使用者 + 助理)
jq '.[0] | {
  messages: .attributes.llm.input_messages,
  model: .attributes.llm.model_name
}' trace_*/spans.json

# 特別擷取系統提示詞 (System Prompt)
jq '[.[] | select(.attributes.llm.input_messages.roles[]? == "system")] | .[0].attributes.llm.input_messages' trace_*/spans.json

# 擷取提示詞範本與變數
jq '.[0].attributes.llm.prompt_template' trace_*/spans.json

# 從 input.value 擷取 (非結構化提示詞的備援方案)
jq '.[0].attributes.input.value' trace_*/spans.json
```

### 將提示詞重構為訊息

一旦獲得 Span 資料，即可將提示詞重構為訊息陣列：

```json
[
  {"role": "system", "content": "您是一位很有幫助的助理，負責..."},
  {"role": "user", "content": "根據 {input}，回答問題：{question}"}
]
```

若 Span 具有 `attributes.llm.prompt_template.template`，則該提示詞使用了變數。請保留這些預留位置 (`{variable}` 或 `{{variable}}`) — 它們會在執行時被替換。

## 第 2 階段：收集效能資料

### 來自追蹤 (生產環境回饋)

```bash
# 尋找錯誤 Span -- 這些代表提示詞失敗
ax spans list PROJECT_ID \
  --filter "status_code = 'ERROR' AND attributes.openinference.span.kind = 'LLM'" \
  --limit 20

# 尋找評估分數較低的 Span
ax spans list PROJECT_ID \
  --filter "annotation.correctness.label = 'incorrect'" \
  --limit 20

# 尋找高延遲 Span (可能代表提示詞過於複雜)
ax spans list PROJECT_ID \
  --filter "attributes.openinference.span.kind = 'LLM' AND latency_ms > 10000" \
  --limit 20

# 匯出錯誤追蹤以進行詳細檢查
ax spans export --trace-id TRACE_ID --project PROJECT_ID
```

### 來自資料集與實驗

```bash
# 匯出資料集 (地面實況 (Ground truth) 範例)
ax datasets export DATASET_ID
# -> dataset_*/examples.json

# 匯出實驗結果 (LLM 產出的內容)
ax experiments export EXPERIMENT_ID
# -> experiment_*/runs.json
```

### 合併資料集 + 實驗以進行分析

透過 `example_id` 合併這兩個檔案，以同時查看輸入、輸出與評估結果：

```bash
# 統計範例與執行次數
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

# 尋找失敗的範例 (評估分數 < 門檻值)
jq '[.[] | select(.evaluations.correctness.score < 0.5)]' experiment_*/runs.json
```

### 識別要優化的內容

在失敗案例中尋找模式：

1. **與地面實況比較輸出**：LLM 輸出在哪裡與預期不符？
2. **閱讀評估解釋**：`eval.*.explanation` 會告訴您為何某項評估失敗。
3. **檢查標註文字**：人工回饋會描述具體問題。
4. **尋找冗長度不匹配**：輸出內容相對於地面實況是否過長或過短。
5. **檢查格式合規性**：輸出是否符合預期格式。

## 第 3 階段：優化提示詞

### 優化元提示詞 (Meta-Prompt)

使用此範本產生提示詞的改進版本。填入三個預留位置，並將其傳送至您的 LLM (GPT-4o, Claude 等)：

````
您是提示詞優化專家。給定原始基準提示詞以及相關的效能資料（輸入、輸出、評估標籤和解釋），
請產生一個改進結果的修正版本。

原始基準提示詞
========================

{在此貼入原始提示詞}

========================

效能資料
================

下列記錄顯示了目前提示詞的執行狀況。每條記錄包含輸入、LLM 輸出和評估回饋：

{在此貼入記錄}

================

如何使用這些資料

1. 比較輸出：查看 LLM 產生的內容與預期內容的差異
2. 審閱評估分數：檢查哪些範例得分較低以及原因
3. 檢查標註：人工回饋顯示了哪些做法奏效，哪些無效
4. 識別模式：尋找多個範例中共同出現的問題
5. 關注失敗案例：輸出與預期值「不同」的列是需要修復的重點

對齊策略

- 若輸出包含地面實況中不存在的多餘文字或推理，請移除鼓勵解釋或詳細推理的指令
- 若輸出缺失資訊，請加入包含該資訊的指令
- 若輸出格式錯誤，請加入明確的格式指令
- 關注輸出與目標不同的列 -- 這些是需要修復的失敗案例

規則

維持結構：
- 使用與目前提示詞相同的範本變數（{var} 或 {{var}}）
- 不要更改已經奏效的部分
- 保留原始提示詞中確切的回傳格式指令

避免過度擬合 (Overfitting)：
- 不要逐字將範例複製到提示詞中
- 不要精確引用測試資料的特定輸出
- 相反地：擷取區分良好輸出與不良輸出的「精髓」
- 相反地：加入一般的指引與原則
- 相反地：若加入少樣本範例 (Few-shot examples)，請建立能演示原則的「合成範例」，而非使用上述的真實資料

目標：建立一個能良好泛化至新輸入的提示詞，而非一個死記硬背測試資料的提示詞。

輸出格式

以訊息的 JSON 陣列形式回傳修正後的提示詞：

[
  {"role": "system", "content": "..."},
  {"role": "user", "content": "..."}
]

並提供一個簡短的推理章節（條列式）解釋：
- 您發現了哪些問題
- 修正後的提示詞如何解決這些問題
````

### 準備效能資料

在貼入範本前，將記錄格式化為 JSON 陣列：

```bash
# 從資料集 + 實驗：合併並選取相關欄位
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

# 從匯出的 Span：擷取帶有標註的輸入/輸出對
jq '[.[] | select(.attributes.openinference.span.kind == "LLM") | {
  input: .attributes.input.value,
  output: .attributes.output.value,
  status: .status_code,
  model: .attributes.llm.model_name
}]' trace_*/spans.json
```

### 套用修正後的提示詞

在 LLM 回傳修正後的訊息陣列後：

1. 並排比較原始提示詞與修正後的提示詞。
2. 核實所有範本變數皆已保留。
3. 檢查格式指令是否完好。
4. 在全面部署前，先在少數範例上進行測試。

## 第 4 階段：迭代

### 優化迴圈

```
1. 擷取提示詞    -> 第 1 階段 (執行一次)
2. 執行實驗      -> ax experiments create ...
3. 匯出結果      -> ax experiments export EXPERIMENT_ID
4. 分析失敗案例  -> 使用 jq 尋找低分案例
5. 執行元提示詞  -> 帶著新的失敗資料執行第 3 階段
6. 套用修正後的提示詞
7. 從步驟 2 開始重複
```

### 衡量改進效果

```bash
# 比較不同實驗的分數
# 實驗 A (基準)
jq '[.[] | .evaluations.correctness.score] | add / length' experiment_a/runs.json

# 實驗 B (已優化)
jq '[.[] | .evaluations.correctness.score] | add / length' experiment_b/runs.json

# 尋找從失敗變為通過的範例數量
jq -s '
  [.[0][] | select(.evaluations.correctness.label == "incorrect")] as $fails |
  [.[1][] | select(.evaluations.correctness.label == "correct") |
    select(.example_id as $id | $fails | any(.example_id == $id))
  ] | length
' experiment_a/runs.json experiment_b/runs.json
```

### A/B 比較兩個提示詞

1. 針對同一個資料集建立兩個實驗，各使用不同的提示詞版本。
2. 匯出兩者：`ax experiments export EXP_A` 與 `ax experiments export EXP_B`。
3. 比較平均分數、失敗率以及特定範例的狀態反轉。
4. 檢查效能退步 (Regression) — 即在提示詞 A 中通過但在提示詞 B 中失敗的範例。

## 提示詞工程最佳實務

在撰寫或修正提示詞時套用以下技術：

| 技術 | 何時套用 | 範例 |
|-----------|--------------|---------|
| 清晰、詳細的指令 | 輸出模糊或離題 | 「將情緒分類為下列之一：正向、負向、中立」 |
| 指令置於開頭 | 模型忽略後續指令 | 將任務說明置於範例之前 |
| 步驟拆解 | 複雜的多步驟流程 | 「首先擷取實體，接著對每個實體分類，最後進行摘要」 |
| 特定人格 (Persona) | 需要一致的風格/語氣 | 「您是一位為機構投資者撰稿的高級財務分析師」 |
| 分隔符權杖 (Delimiter) | 各個章節混雜在一起 | 使用 `---`, `###` 或 XML 標籤分隔輸入與指令 |
| 少樣本範例 | 輸出格式需要澄清 | 展示 2-3 個合成的輸入/輸出對 |
| 指定輸出長度 | 回應過長或過短 | 「請以恰好 2-3 句話回答」 |
| 推理指令 | 準確性至關重要 | 「在回答前請先逐步思考」 |
| 「我不知道」指引 | 存在幻覺風險 | 「若答案不在提供的內容中，請說『我沒有足夠的資訊』」 |

### 變數保留

優化使用範本變數的提示詞時：

- **單大括號** (`{variable}`)：Python f-string / Jinja 風格。在 Arize 中最常用。
- **雙大括號** (`{{variable}}`)：Mustache 風格。當框架有此要求時使用。
- 優化過程中絕不新增或移除變數預留位置。
- 絕不重新命名變數 — 執行時的替換取決於精確的名稱。
- 若要加入少樣本範例，請使用字面值 (Literal values)，而非變數預留位置。

## 工作流程

### 從失敗的追蹤優化提示詞

1. 尋找失敗的追蹤：
   ```bash
   ax traces list PROJECT_ID --filter "status_code = 'ERROR'" --limit 5
   ```
2. 匯出追蹤：
   ```bash
   ax spans export --trace-id TRACE_ID --project PROJECT_ID
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
5. 帶著提示詞與錯誤內容填寫優化元提示詞 (第 3 階段)。
6. 套用修正後的提示詞。

### 使用資料集與實驗進行優化

1. 尋找資料集與實驗：
   ```bash
   ax datasets list
   ax experiments list --dataset-id DATASET_ID
   ```
2. 匯出兩者：
   ```bash
   ax datasets export DATASET_ID
   ax experiments export EXPERIMENT_ID
   ```
3. 為元提示詞準備合併後的資料。
4. 執行優化元提示詞。
5. 使用修正後的提示詞建立新實驗以衡量改進效果。

### 對產生錯誤格式的提示詞進行除錯

1. 匯出輸出格式錯誤的 Span：
   ```bash
   ax spans list PROJECT_ID \
     --filter "attributes.openinference.span.kind = 'LLM' AND annotation.format.label = 'incorrect'" \
     --limit 10 -o json > bad_format.json
   ```
2. 查看 LLM 產出的內容與預期內容的差異。
3. 在提示詞中加入明確的格式指令 (JSON 結構定義、範例、分隔符)。
4. 常見修復方法：加入一個展示確切所需輸出格式的少樣本範例。

### 減少 RAG 提示詞中的幻覺

1. 尋找模型產生幻覺的追蹤：
   ```bash
   ax spans list PROJECT_ID \
     --filter "annotation.faithfulness.label = 'unfaithful'" \
     --limit 20
   ```
2. 一併匯出並檢查檢索器 (Retriever) 與 LLM Span：
   ```bash
   ax spans export --trace-id TRACE_ID --project PROJECT_ID
   jq '[.[] | {kind: .attributes.openinference.span.kind, name, input: .attributes.input.value, output: .attributes.output.value}]' trace_*/spans.json
   ```
3. 檢查檢索到的內容是否確實包含答案。
4. 在系統提示詞中加入基礎 (Grounding) 指令：「僅使用提供的內容中的資訊。若答案不在內容中，請說明這一點。」

## 疑難排解

| 問題 | 解決方案 |
|---------|----------|
| `ax: command not found` | 參閱 references/ax-setup.md |
| `No profile found` | 未設定任何設定檔。參閱 references/ax-profiles.md 建立一個。 |
| Span 上沒有 `input_messages` | 檢查 Span 種類 -- 鏈/代理 Span 將提示詞儲存在子項 LLM Span 上，而非其自身。 |
| 提示詞範本為 `null` | 並非所有檢測都會發出 `prompt_template`。請改用 `input_messages` 或 `input.value`。 |
| 優化後變數遺失 | 核實修正後的提示詞保留了原始提示詞中所有的 `{var}` 預留位置。 |
| 優化後結果變差 | 檢查是否過度擬合 -- 元提示詞可能死記了測試資料。請確保少樣本範例是合成的。 |
| 沒有評估/標註欄位 | 請先執行評估 (透過 Arize UI 或 SDK)，然後重新匯出。 |
| 找不到實驗輸出欄位 | 欄位名稱為 `{experiment_name}.output` -- 請透過 `ax experiments get` 檢查確切的實驗名稱。 |
| `jq` 在 Span JSON 上出錯 | 確保您的目標檔案路徑正確 (例如：`trace_*/spans.json`)。 |
