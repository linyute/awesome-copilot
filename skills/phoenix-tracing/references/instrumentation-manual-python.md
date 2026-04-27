# 手動檢測 (Manual Instrumentation) (Python)

使用裝飾器 (decorators) 或上下文管理器 (context managers) 新增自訂 spans，以實現細粒度的追蹤控制。

## 設定 (Setup)

```bash
pip install arize-phoenix-otel
```

```python
from phoenix.otel import register
tracer_provider = register(project_name="my-app")
tracer = tracer_provider.get_tracer(__name__)
```

## 快速參考 (Quick Reference)

| Span 種類 | 裝飾器 | 使用案例 |
|-----------|-----------|----------|
| CHAIN | `@tracer.chain` | 協排 (Orchestration)、工作流程、管線 (pipelines) |
| RETRIEVER | `@tracer.retriever` | 向量搜尋、文件擷取 |
| TOOL | `@tracer.tool` | 外部 API 呼叫、函式執行 |
| AGENT | `@tracer.agent` | 多步驟推理、規劃 |
| LLM | `@tracer.llm` | LLM API 呼叫（僅限手動） |
| EMBEDDING | `@tracer.embedding` | 嵌入 (Embedding) 產生 |
| RERANKER | `@tracer.reranker` | 文件重排 |
| GUARDRAIL | `@tracer.guardrail` | 安全檢查、內容審查 |
| EVALUATOR | `@tracer.evaluator` | LLM 評估、品質檢查 |

## 裝飾器方式 (建議使用) (Decorator Approach)

**適用於：** 完整函式檢測、自動 I/O 擷取

```python
@tracer.chain
def rag_pipeline(query: str) -> str:
    docs = retrieve_documents(query)
    ranked = rerank(docs, query)
    return generate_response(ranked, query)

@tracer.retriever
def retrieve_documents(query: str) -> list[dict]:
    results = vector_db.search(query, top_k=5)
    return [{"content": doc.text, "score": doc.score} for doc in results]

@tracer.tool
def get_weather(city: str) -> str:
    response = requests.get(f"https://api.weather.com/{city}")
    return response.json()["weather"]
```

**自訂 span 名稱：**

```python
@tracer.chain(name="rag-pipeline-v2")
def my_workflow(query: str) -> str:
    return process(query)
```

## 上下文管理器方式 (Context Manager Approach)

**適用於：** 部分函式檢測、自訂屬性、動態控制

```python
from opentelemetry.trace import Status, StatusCode
import json

def retrieve_with_metadata(query: str):
    with tracer.start_as_current_span(
        "vector_search",
        openinference_span_kind="retriever"
    ) as span:
        span.set_attribute("input.value", query)

        results = vector_db.search(query, top_k=5)

        documents = [
            {
                "document.id": doc.id,
                "document.content": doc.text,
                "document.score": doc.score
            }
            for doc in results
        ]
        span.set_attribute("retrieval.documents", json.dumps(documents))
        span.set_status(Status(StatusCode.OK))

        return documents
```

## 擷取輸入/輸出 (Capturing Input/Output)

**請務必為可用於評估的 spans 擷取輸入/輸出 (I/O)。**

### 自動 I/O 擷取 (裝飾器)

裝飾器會自動擷取輸入引數與回傳值：

```python  theme={null}
@tracer.chain
def handle_query(user_input: str) -> str:
    result = agent.generate(user_input)
    return result.text

# 自動擷取：
# - input.value: user_input
# - output.value: result.text
# - input.mime_type / output.mime_type: 自動偵測
```

### 手動 I/O 擷取 (上下文管理器)

使用 `set_input()` 和 `set_output()` 進行簡單的 I/O 擷取：

```python  theme={null}
from opentelemetry.trace import Status, StatusCode

def handle_query(user_input: str) -> str:
    with tracer.start_as_current_span(
        "query.handler",
        openinference_span_kind="chain"
    ) as span:
        span.set_input(user_input)

        result = agent.generate(user_input)

        span.set_output(result.text)
        span.set_status(Status(StatusCode.OK))

        return result.text
```

**擷取的內容：**

```json
{
  "input.value": "What is 2+2?",
  "input.mime_type": "text/plain",
  "output.value": "2+2 equals 4.",
  "output.mime_type": "text/plain"
}
```

**為什麼這很重要：**
- Phoenix 評估器需要 `input.value` 與 `output.value`
- Phoenix UI 會顯眼地顯示 I/O 以便除錯
- 支援匯出資料以用於微調資料集 (fine-tuning datasets)

### 包含額外 Metadata 的自訂 I/O

在 I/O 之外，使用 `set_attribute()` 設定自訂屬性：

```python  theme={null}
def process_query(query: str):
    with tracer.start_as_current_span(
        "query.process",
        openinference_span_kind="chain"
    ) as span:
        # 標準 I/O
        span.set_input(query)

        # 自訂 Metadata
        span.set_attribute("input.length", len(query))

        result = llm.generate(query)

        # 標準輸出
        span.set_output(result.text)

        # 自訂 Metadata
        span.set_attribute("output.tokens", result.usage.total_tokens)
        span.set_status(Status(StatusCode.OK))

        return result
```

## 另請參閱

- **Span 屬性：** `span-chain.md`、`span-retriever.md`、`span-tool.md`、`span-llm.md`、`span-agent.md`、`span-embedding.md`、`span-reranker.md`、`span-guardrail.md`、`span-evaluator.md`
- **自動檢測 (Auto-instrumentation)：** `instrumentation-auto-python.md` 用於框架整合
- **API 文件：** https://docs.arize.com/phoenix/tracing/manual-instrumentation
