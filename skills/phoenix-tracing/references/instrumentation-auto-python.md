# Phoenix 追蹤：自動檢測 (Python) (Phoenix Tracing: Auto-Instrumentation (Python))

**無需變更程式碼即可自動為 LLM 呼叫建立 Span。**

## 概觀 (Overview)

自動檢測在執行階段對支援的函式庫進行補丁 (patch)，以自動建立 Span。適用於支援的框架（LangChain, LlamaIndex, OpenAI SDK 等）。對於自訂邏輯，請參考 manual-instrumentation-python.md。

## 支援的框架 (Supported Frameworks)

**Python：**

- LLM SDK：OpenAI, Anthropic, Bedrock, Mistral, Vertex AI, Groq, Ollama
- 框架：LangChain, LlamaIndex, DSPy, CrewAI, Instructor, Haystack
- 安裝方式：`pip install openinference-instrumentation-{名稱}`

## 設定 (Setup)

**安裝並啟用：**

```bash
pip install arize-phoenix-otel
pip install openinference-instrumentation-openai  # 視需要新增其他檢測器
```

```python
from phoenix.otel import register

register(project_name="my-app", auto_instrument=True)  # 自動探索所有已安裝的檢測器
```

**範例：**

```python
from phoenix.otel import register
from openai import OpenAI

register(project_name="my-app", auto_instrument=True)

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "您好！"}]
)
```

Trace 將顯示在 Phoenix UI 中，並自動擷取模型、輸入/輸出、權杖與時序。完整屬性結構描述請參閱 Span 種類相關檔案。

**選擇性檢測**（明確控制）：

```python
from phoenix.otel import register
from openinference.instrumentation.openai import OpenAIInstrumentor

tracer_provider = register(project_name="my-app")  # 不使用 auto_instrument
OpenAIInstrumentor().instrument(tracer_provider=tracer_provider)
```

## 限制 (Limitations)

自動檢測「不會」擷取：

- 自訂商業邏輯
- 內部的函式呼叫

**範例：**

```python
def my_custom_workflow(query: str) -> str:
    preprocessed = preprocess(query)  # 不會被追蹤
    response = client.chat.completions.create(...)  # 會被追蹤（自動）
    postprocessed = postprocess(response)  # 不會被追蹤
    return postprocessed
```

**解決方案：** 新增手動檢測：

```python
@tracer.chain
def my_custom_workflow(query: str) -> str:
    preprocessed = preprocess(query)
    response = client.chat.completions.create(...)
    postprocessed = postprocess(response)
    return postprocessed
```
