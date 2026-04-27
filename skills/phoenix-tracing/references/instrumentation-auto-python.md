# Phoenix 追蹤：自動檢測 (Auto-Instrumentation) (Python)

**無需變更程式碼，即可自動為 LLM 呼叫建立 spans。**

## 總覽 (Overview)

自動檢測 (Auto-instrumentation) 會在執行時期 (runtime) 修補支援的函式庫，以自動建立 spans。適用於支援的框架（LangChain、LlamaIndex、OpenAI SDK 等）。對於自訂邏輯，請參閱 manual-instrumentation-python.md。

## 支援的框架 (Supported Frameworks)

**Python：**

- LLM SDKs：OpenAI、Anthropic、Bedrock、Mistral、Vertex AI、Groq、Ollama
- 框架 (Frameworks)：LangChain、LlamaIndex、DSPy、CrewAI、Instructor、Haystack
- 安裝方式：`pip install openinference-instrumentation-{name}`

## 設定 (Setup)

**安裝與啟用：**

```bash
pip install arize-phoenix-otel
pip install openinference-instrumentation-openai  # 視需要新增其他項目
```

```python
from phoenix.otel import register

register(project_name="my-app", auto_instrument=True)  # 自動探索所有已安裝的檢測器 (instrumentors)
```

**範例 (Example)：**

```python
from phoenix.otel import register
from openai import OpenAI

register(project_name="my-app", auto_instrument=True)

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "你好！"}]
)
```

追蹤 (Traces) 會出現在 Phoenix UI 中，自動擷取模型、輸入/輸出、符記 (tokens) 及計時。請參閱 span 種類檔案以取得完整的屬性結構 (attribute schemas)。

**選擇性檢測 (Selective instrumentation)**（顯式控制）：

```python
from phoenix.otel import register
from openinference.instrumentation.openai import OpenAIInstrumentor

tracer_provider = register(project_name="my-app")  # 不使用 auto_instrument
OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)
```

## 限制 (Limitations)

自動檢測**無法**擷取：

- 自訂商業邏輯
- 內部函式呼叫

**範例：**

```python
def my_custom_workflow(query: str) -> str:
    preprocessed = preprocess(query)  # 未被追蹤
    response = client.chat.completions.create(...)  # 已被追蹤（自動）
    postprocessed = postprocess(response)  # 未被追蹤
    return postprocessed
```

**解決方案：** 新增手動檢測 (manual instrumentation)：

```python
@tracer.chain
def my_custom_workflow(query: str) -> str:
    preprocessed = preprocess(query)
    response = client.chat.completions.create(...)
    postprocessed = postprocess(response)
    return postprocessed
```
