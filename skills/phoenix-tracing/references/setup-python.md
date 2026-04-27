# Phoenix 追蹤：Python 設定 (Setup)

**使用 `arize-phoenix-otel` 在 Python 中設定 Phoenix 追蹤。**

## Metadata

| 屬性 | 值 |
| ---------- | ----------------------------------- |
| 優先權 (Priority) | 關鍵 - 所有追蹤皆需要 |
| 設定時間 (Setup Time) | < 5 分鐘 |

## 快速開始 (僅需 3 行) (Quick Start)

```python
from phoenix.otel import register
register(project_name="my-app", auto_instrument=True)
```

**連線至 `http://localhost:6006`，自動檢測 (auto-instruments) 所有支援的函式庫。**

## 安裝 (Installation)

```bash
pip install arize-phoenix-otel
```

**支援版本：** Python 3.10-3.13

## 組態 (Configuration)

### 環境變數 (建議使用) (Environment Variables)

```bash
export PHOENIX_API_KEY="你的 API 金鑰"  # Phoenix Cloud 必要項
export PHOENIX_COLLECTOR_ENDPOINT="http://localhost:6006"  # 或 Cloud URL
export PHOENIX_PROJECT_NAME="my-app"  # 選用
```

### Python 程式碼

```python
from phoenix.otel import register

tracer_provider = register(
    project_name="my-app",              # 專案名稱
    endpoint="http://localhost:6006",   # Phoenix 端點 (endpoint)
    auto_instrument=True,               # 自動檢測支援的函式庫
    batch=True,                         # 批次處理 (預設為 True)
)
```

**參數 (Parameters)：**

- `project_name`: 專案名稱（覆蓋 `PHOENIX_PROJECT_NAME`）
- `endpoint`: Phoenix URL（覆蓋 `PHOENIX_COLLECTOR_ENDPOINT`）
- `auto_instrument`: 啟用自動檢測 (default: False)
- `batch`: 使用 BatchSpanProcessor (default: True, 建議用於生產環境)
- `protocol`: `"http/protobuf"` (預設) 或 `"grpc"`

## 自動檢測 (Auto-Instrumentation)

為您的框架安裝檢測器 (instrumentors)：

```bash
pip install openinference-instrumentation-openai      # OpenAI SDK
pip install openinference-instrumentation-langchain   # LangChain
pip install openinference-instrumentation-llama-index # LlamaIndex
# ... 視需要安裝其他項目
```

接著啟用自動檢測：

```python
register(project_name="my-app", auto_instrument=True)
```

Phoenix 會自動探索並檢測所有已安裝的 OpenInference 套件。

## 批次處理 (生產環境) (Batch Processing)

預設為啟用。可透過環境變數進行設定：

```bash
export OTEL_BSP_SCHEDULE_DELAY=5000           # 每 5 秒批次處理一次
export OTEL_BSP_MAX_QUEUE_SIZE=2048           # 佇列 2048 個 spans
export OTEL_BSP_MAX_EXPORT_BATCH_SIZE=512     # 每次批次發送 512 個 spans
```

**連結：** https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/

## 驗證 (Verification)

1. 開啟 Phoenix UI：`http://localhost:6006`
2. 導覽至您的專案
3. 執行您的應用程式
4. 檢查追蹤（會在批次延遲時間內出現）

## 疑難排解 (Troubleshooting)

**沒有追蹤：**

- 驗證 `PHOENIX_COLLECTOR_ENDPOINT` 是否與 Phoenix 伺服器相符
- 為 Phoenix Cloud 設定 `PHOENIX_API_KEY`
- 確認已安裝檢測器 (instrumentors)

**遺漏屬性：**

- 檢查 span 種類 (參閱 rules/ 目錄)
- 驗證屬性名稱 (參閱 rules/ 目錄)

## 範例 (Example)

```python
from phoenix.otel import register
from openai import OpenAI

# 啟用追蹤與自動檢測
register(project_name="my-chatbot", auto_instrument=True)

# OpenAI 已自動完成檢測
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "你好！"}]
)
```

## API 參考

- [Python OTEL API 文件](https://arize-phoenix.readthedocs.io/projects/otel/en/latest/)
- [Python Client API 文件](https://arize-phoenix.readthedocs.io/projects/client/en/latest/)
