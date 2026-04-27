# Phoenix 追蹤：生產指南 (Production Guide) (Python)

**關鍵提醒：請為生產部署設定批次處理 (batching)、資料遮罩 (data masking) 以及 span 過濾。**

## Metadata

| 屬性 | 值 |
|-----------|-------|
| 優先權 (Priority) | 關鍵 - 生產就緒性 |
| 影響 (Impact) | 安全性、效能 |
| 設定時間 (Setup Time) | 5-15 分鐘 |

## 批次處理 (Batch Processing)

**啟用批次處理以提升生產效率。** 批次處理透過成組發送 spans 而非個別發送，來減少網路開銷 (network overhead)。

## 資料遮罩 (PII 保護) (Data Masking (PII Protection))

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

**優先順序 (Precedence)：** 程式碼 > 環境變數 > 預設值

---

## Span 過濾 (Span Filtering)

**抑制 (Suppress) 特定的程式碼區塊：**

```python
from phoenix.otel import suppress_tracing

with suppress_tracing():
    internal_logging()  # 不會產生 spans
```
