# 常見錯誤 (Python) (Common Mistakes (Python))

LLM 經常根據訓練資料產生的錯誤模式。

## 舊版模型類別 (Legacy Model Classes)

```python
# 錯誤做法
from phoenix.evals import OpenAIModel, AnthropicModel
model = OpenAIModel(model="gpt-4")

# 正確做法
from phoenix.evals import LLM
llm = LLM(provider="openai", model="gpt-4o")
```

**原因**：`OpenAIModel`, `AnthropicModel` 等是 `phoenix.evals.legacy` 中的舊版 1.0 包裝器。`LLM` 類別與提供者無關，是目前的 2.0 API。

## 使用 run_evals 而非 evaluate_dataframe (Using run_evals Instead of evaluate_dataframe)

```python
# 錯誤做法 — 舊版 1.0 API
from phoenix.evals import run_evals
results = run_evals(dataframe=df, evaluators=[eval1], provide_explanation=True)
# 傳回 DataFrame 清單

# 正確做法 — 目前 2.0 API
from phoenix.evals import evaluate_dataframe
results_df = evaluate_dataframe(dataframe=df, evaluators=[eval1])
# 傳回單一 DataFrame，帶有 {name}_score 字典資料欄
```

**原因**：`run_evals` 是舊版 1.0 的批次函式。`evaluate_dataframe` 是目前的 2.0 函式，具有不同的傳回格式。

## 錯誤的結果資料欄名稱 (Wrong Result Column Names)

```python
# 錯誤做法 — 此資料欄不存在
score = results_df["relevance"].mean()

# 錯誤做法 — 資料欄存在但包含字典而非數字
score = results_df["relevance_score"].mean()

# 正確做法 — 從字典中擷取數值分數
scores = results_df["relevance_score"].apply(
    lambda x: x.get("score", 0.0) if isinstance(x, dict) else 0.0
)
score = scores.mean()
```

**原因**：`evaluate_dataframe` 傳回名為 `{name}_score` 的資料欄，其中包含如下的分數字典：`{"name": "...", "score": 1.0, "label": "...", "explanation": "..."}`。

## 棄用的 project_name 參數 (Deprecated project_name Parameter)

```python
# 錯誤做法
df = client.spans.get_spans_dataframe(project_name="my-project")

# 正確做法
df = client.spans.get_spans_dataframe(project_identifier="my-project")
```

**原因**：`project_name` 已棄用，改用 `project_identifier`，後者也接受專案 ID。

## 錯誤的 Client 建構函式 (Wrong Client Constructor)

```python
# 錯誤做法
client = Client(endpoint="https://app.phoenix.arize.com")
client = Client(url="https://app.phoenix.arize.com")

# 正確做法 — 針對遠端/雲端 Phoenix
client = Client(base_url="https://app.phoenix.arize.com", api_key="...")

# 同樣正確 — 針對本地端 Phoenix（回退至環境變數或 localhost:6006）
client = Client()
```

**原因**：參數應為 `base_url`，而非 `endpoint` 或 `url`。對於本地端執行個體，使用不帶參數的 `Client()` 即可。對於遠端執行個體，則需要 `base_url` 與 `api_key`。

## 過於激進的時間篩選器 (Too-Aggressive Time Filters)

```python
# 錯誤做法 — 經常傳回零個 Span
from datetime import datetime, timedelta
df = client.spans.get_spans_dataframe(
    project_identifier="my-project",
    start_time=datetime.now() - timedelta(hours=1),
)

# 正確做法 — 改用 limit 來控制結果大小
df = client.spans.get_spans_dataframe(
    project_identifier="my-project",
    limit=50,
)
```

**原因**：追蹤可能來自任何時段。1 小時的視窗經常會查不到任何內容。請改用 `limit=` 來控制結果大小。

## 未適當篩選 Span (Not Filtering Spans Appropriately)

```python
# 錯誤做法 — 獲取所有 Span，包含內部的 LLM 呼叫、檢索器等
df = client.spans.get_spans_dataframe(project_identifier="my-project")

# 針對端對端評估的正確做法 — 篩選至頂層 Span
df = client.spans.get_spans_dataframe(
    project_identifier="my-project",
    root_spans_only=True,
)

# 針對 RAG 評估的正確做法 — 分別獲取子項 Span 以取得檢索器/LLM 指標
all_spans = client.spans.get_spans_dataframe(
    project_identifier="my-project",
)
retriever_spans = all_spans[all_spans["span_kind"] == "RETRIEVER"]
llm_spans = all_spans[all_spans["span_kind"] == "LLM"]
```

**原因**：對於端對端評估（例如整體答案品質），請使用 `root_spans_only=True`。對於 RAG 系統，您通常需要分別獲取子項 Span — 針對文件相關性 (DocumentRelevance) 使用檢索器 Span，針對忠實度 (Faithfulness) 使用 LLM Span。請為您的評估目標選擇正確的 Span 層級。

## 假設 Span 輸出為純文字 (Assuming Span Output is Plain Text)

```python
# 錯誤做法 — 輸出可能是 JSON 而非純文字
df["output"] = df["attributes.output.value"]

# 正確做法 — 解析 JSON 並擷取答案欄位
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

**原因**：LangChain 與其他框架經常從根 Span 輸出結構化 JSON，例如 `{"context": "...", "question": "...", "answer": "..."}`。評估者需要實際的答案文字，而非原始 JSON。

## 對基於 LLM 的評估使用 @create_evaluator (Using @create_evaluator for LLM-Based Evaluation)

```python
# 錯誤做法 — @create_evaluator 並不會呼叫 LLM
@create_evaluator(name="relevance", kind="llm")
def relevance(input: str, output: str) -> str:
    pass  # 此處並未涉及 LLM

# 正確做法 — 對於基於 LLM 的評估，請使用 ClassificationEvaluator
from phoenix.evals import ClassificationEvaluator, LLM

relevance = ClassificationEvaluator(
    name="relevance",
    prompt_template="這項是否相關？\n{{input}}\n{{output}}\n答案：",
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
```

**原因**：`@create_evaluator` 包裝的是純 Python 函式。設定 `kind="llm"` 僅是將其標記為基於 LLM，但您必須自己在函式內實作 LLM 呼叫。該裝飾器不會替您呼叫 LLM。對於大多數基於 LLM 的評估，優先建議使用 `ClassificationEvaluator`，它會自動處理 LLM 呼叫、結構化輸出解析與解釋。

## 使用 llm_classify 而非 ClassificationEvaluator (Using llm_classify Instead of ClassificationEvaluator)

```python
# 錯誤做法 — 舊版 1.0 API
from phoenix.evals import llm_classify
results = llm_classify(
    dataframe=df,
    template=template_str,
    model=model,
    rails=["relevant", "irrelevant"],
)

# 正確做法 — 目前 2.0 API
from phoenix.evals import ClassificationEvaluator, async_evaluate_dataframe, LLM

classifier = ClassificationEvaluator(
    name="relevance",
    prompt_template=template_str,
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"relevant": 1.0, "irrelevant": 0.0},
)
results_df = await async_evaluate_dataframe(dataframe=df, evaluators=[classifier])
```

**原因**：`llm_classify` 是舊版 1.0 的函式。目前的模式是使用 `ClassificationEvaluator` 建立評估者，並使用 `async_evaluate_dataframe()` 執行。

## 使用 HallucinationEvaluator (Using HallucinationEvaluator)

```python
# 錯誤做法 — 已棄用
from phoenix.evals import HallucinationEvaluator
eval = HallucinationEvaluator(model)

# 正確做法 — 請使用 FaithfulnessEvaluator
from phoenix.evals.metrics import FaithfulnessEvaluator
from phoenix.evals import LLM
eval = FaithfulnessEvaluator(llm=LLM(provider="openai", model="gpt-4o"))
```

**原因**：`HallucinationEvaluator` 已棄用。`FaithfulnessEvaluator` 是其替代品，使用 「faithful」/「unfaithful」標籤並搭配最佳化得分（1.0 = faithful）。
