# Phoenix 追蹤：生產環境指南 (Python) (Phoenix Tracing: Production Guide (Python))

**至關重要：為生產環境部署配置批次處理、資料遮蔽與 Span 篩選。**

## 中介資料 (Metadata)

| 屬性 | 值 |
|-----------|-------|
| 優先順序 | 緊急 (Critical) - 生產就緒必需 |
| 影響程度 | 安全性、效能 |
| 設定時間 | 5-15 分鐘 |

## 批次處理 (Batch Processing)

**啟用批次處理以提升生產環境效率。** 批次處理透過分組發送 Span 而非逐一發送，來減少網路開銷。

## 資料遮蔽（PII 防護） (Data Masking (PII Protection))

**環境變數：**

```bash
export OPENINFERENCE_HIDE_INPUTS=true          # 隱藏 input.value
export OPENINFERENCE_HIDE_OUTPUTS=true         # 隱藏 output.value
export OPENINFERENCE_HIDE_INPUT_MESSAGES=true  # 隱藏 LLM 輸入訊息
export OPENINFERENCE_HIDE_OUTPUT_MESSAGES=true # 隱藏 LLM 輸出訊息
export OPENINFERENCE_HIDE_INPUT_IMAGES=true    # 隱藏圖片內容
export OPENINFERENCE_HIDE_INPUT_TEXT=true      # 隱藏嵌入文字
export OPENINFERENCE_BASE64_IMAGE_MAX_LENGTH=10000  # 限制圖片大小
```

**Python TraceConfig：**

```python
from phoenix.otel import register
from openinference.instrumentation import TraceConfig

config = TraceConfig(
    hide_inputs=True,
    hide_outputs=True,
    hide_input_messages=True
)
register(trace_config=config)
```

**優先順序：** 程式碼 > 環境變數 > 預設值

---

## Span 篩選 (Span Filtering)

**抑制特定程式碼區塊的追蹤：**

```python
from phoenix.otel import suppress_tracing

with suppress_tracing():
    internal_logging()  # 不會產生 Span
```
