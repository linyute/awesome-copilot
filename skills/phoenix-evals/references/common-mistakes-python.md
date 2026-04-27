# 常見錯誤 (Python) (Common Mistakes)

LLM 經常根據訓練資料產生錯誤的模式。

## 舊版模型類別 (Legacy Model Classes)

```python
# 錯誤 (WRONG)
from phoenix.evals import OpenAIModel, AnthropicModel
model = OpenAIModel(model="gpt-4")

# 正確 (RIGHT)
from phoenix.evals import LLM
llm = LLM(provider="openai", model="gpt-4o")
```

**原因**：`OpenAIModel`、`AnthropicModel` 等是 `phoenix.evals.legacy` 中的舊版 1.0 包裝器。
`LLM` 類別與供應商無關，是目前的 2.0 API。

## 使用 run_evals 而非 evaluate_dataframe

```python
# 錯誤 (WRONG) — 舊版 1.0 API
from phoenix.evals import run_evals
results = run_evals(dataframe=df, evaluators=[eval1], provide_explanation=True)
# 回傳 DataFrames 列表

# 正確 (RIGHT) — 目前 2.0 API
from phoenix.evals import evaluate_dataframe
results_df = evaluate_dataframe(dataframe=df, evaluators=[eval1])
# 回傳單一 DataFrame，其中包含 {name}_score 字典欄位
```

**原因**：`run_evals` 是舊版 1.0 的批次函式。`evaluate_dataframe` 是目前的
2.0 函式，具有不同的回傳格式。

## 錯誤的結果欄位名稱

```python
# 錯誤 (WRONG) — 欄位不存在
score = results_df["relevance"].mean()

# 錯誤 (WRONG) — 欄位存在但包含字典而非數字
score = results_df["relevance_score"].mean()

# 正確 (RIGHT) — 從字典中擷取數值分數
scores = results_df["relevance_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
score = scores.mean()
```

**原因**：`evaluate_dataframe` 回傳名為 `{name}_score` 的欄位，其中包含分數字典 (Score dicts)，
例如 `{"name": "...", "score": 1.0, "label": "...", "explanation": "..."}`。

## 已棄用的 project_name 參數

```python
# 錯誤 (WRONG)
df = client.spans.get_spans_dataframe(project_name="my-project")

# 正確 (RIGHT)
df = client.spans.get_spans_dataframe(project_identifier="my-project")
```

**原因**：`project_name` 已被棄用，改用 `project_identifier`，它也
接受專案 ID。

## 錯誤的用戶端建構函式 (Client Constructor)

```python
# 錯誤 (WRONG)
client = Client(endpoint="https://app.phoenix.arize.com")
client = Client(url="https://app.phoenix.arize.com")

# 正確 (RIGHT) — 用於遠端/雲端 Phoenix
client = Client(base_url="https://app.phoenix.arize.com", api_key="...")

# 同樣正確 (ALSO RIGHT) — 用於本機 Phoenix (會退而使用環境變數或 localhost:6006)
client = Client()
```

**原因**：參數是 `base_url`，而非 `endpoint` 或 `url`。對於本機執行個體，
不帶參數的 `Client()` 即可正常運作。對於遠端執行個體，則需要 `base_url` 和 `api_key`。

## 過於激進的時間過濾器

```python
# 錯誤 (WRONG) — 經常回傳零個 spans
from datetime import datetime, timedelta
df = client.spans.get_spans_dataframe(
    project_identifier="my-project",
    start_time=datetime.now() - timedelta(hours=1),
)

# 正確 (RIGHT) — 使用 limit 來控制結果大小
df = client.spans.get_spans_dataframe(
    project_identifier="my-project",
    limit=50,
)
```

**原因**：追蹤 (Traces) 可能來自任何時間段。1 小時的視窗經常回傳
不到任何內容。請改用 `limit=` 來控制結果大小。

## 未適當過濾 Spans

```python
# 錯誤 (WRONG) — 擷取所有 spans，包括內部 LLM 呼叫、擷取器 (retrievers) 等。
df = client.spans.get_spans_dataframe(project_identifier="my-project")

# 正確的端到端評估 (RIGHT for end-to-end evaluation) — 僅過濾頂層 spans
df = client.spans.get_spans_dataframe(
    project_identifier="my-project",
    root_spans_only=True,
)

# 正確的 RAG 評估 (RIGHT for RAG evaluation) — 擷取子 spans 以獲取擷取器/LLM 指標
all_spans = client.spans.get_spans_dataframe(
    project_identifier="my-project",
)
retriever_spans = all_spans[all_spans["span_kind"] == "RETRIEVER"]
llm_spans = all_spans[all_spans["span_kind"] == "LLM"]
```

**原因**：對於端到端評估（例如整體回答品質），請使用 `root_spans_only=True`。
對於 RAG 系統，您通常需要分別處理子 spans — 擷取器 spans 用於
DocumentRelevance (文件相關性)，而 LLM spans 用於 Faithfulness (忠實度)。請為您的評估目標選擇正確的 span 層級。

## 假設 Span 輸出為純文字

```python
# 錯誤 (WRONG) — 輸出可能是 JSON 而非純文字
df["output"] = df["attributes.output.value"]

# 正確 (RIGHT) — 解析 JSON 並擷取回答 (answer) 欄位
import json

def extract_answer(output_value):
    if not isinstance(output_value, str):
        return str(output_value) if output_value is not None else ""
    try:
        parsed = json.loads(output_value)
        if isinstance(parsed, dict):
            for key in ("answer", "result", "output", "response"):
                if key in parsed:
                    return str(parsed[key])
    except (json.JSONDecodeError, TypeError):
        pass
    return output_value

df["output"] = df["attributes.output.value"].apply(extract_answer)
```

**原因**：LangChain 和其他框架經常從根 spans 輸出結構化的 JSON，
例如 `{"context": "...", "question": "...", "answer": "..."}`。評估器需要
實際的回答文字，而非原始 JSON。

## 將 @create_evaluator 用於基於 LLM 的評估

```python
# 錯誤 (WRONG) — @create_evaluator 不會呼叫 LLM
@create_evaluator(name="relevance", kind="llm")
def relevance(input: str, output: str) -> str:
    pass  # 不涉及 LLM

# 正確 (RIGHT) — 使用 ClassificationEvaluator 進行基於 LLM 的評估
from phoenix.evals import ClassificationEvaluator, LLM

relevance = ClassificationEvaluator(
    name="relevance",
    prompt_template="Is this relevant?\n{{input}}\n{{output}}\nAnswer:",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
```

**原因**：`@create_evaluator` 包裝了一個純 Python 函式。設定 `kind="llm"`
會將其標記為基於 LLM，但您必須自行在函式內實作 LLM 呼叫。該裝飾器不會為您呼叫 LLM。
對於大多數基於 LLM 的評估，建議優先使用 `ClassificationEvaluator`，它會自動處理
LLM 呼叫、結構化輸出解析和解釋 (explanations)。

## 使用 llm_classify 而非 ClassificationEvaluator

```python
# 錯誤 (WRONG) — 舊版 1.0 API
from phoenix.evals import llm_classify
results = llm_classify(
    dataframe=df,
    template=template_str,
    model=model,
    rails=["relevant", "irrelevant"],
)

# 正確 (RIGHT) — 目前 2.0 API
from phoenix.evals import ClassificationEvaluator, async_evaluate_dataframe, LLM

classifier = ClassificationEvaluator(
    name="relevance",
    prompt_template=template_str,
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[classifier])
```

**原因**：`llm_classify` 是舊版 1.0 函式。目前的模式是使用
`ClassificationEvaluator` 建立評估器，並使用 `async_evaluate_dataframe()` 執行。

## 使用 HallucinationEvaluator

```python
# 錯誤 (WRONG) — 已棄用
from phoenix.evals import HallucinationEvaluator
eval = HallucinationEvaluator(model)

# 正確 (RIGHT) — 使用 FaithfulnessEvaluator
from phoenix.evals.metrics import FaithfulnessEvaluator
from phoenix.evals import LLM
eval = FaithfulnessEvaluator(llm=LLM(provider="openai", model="gpt-4o"))
```

**原因**：`HallucinationEvaluator` 已棄用。`FaithfulnessEvaluator` 是其替代方案，
使用 "faithful"/"unfaithful" (忠實/不忠實) 標籤，並將分數最大化 (1.0 = 忠實)。
