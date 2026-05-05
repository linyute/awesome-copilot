# Phoenix 追蹤：Python 設定 (Phoenix Tracing: Python Setup)

**使用 `arize-phoenix-otel` 在 Python 中設定 Phoenix 追蹤。**

## 中介資料 (Metadata)

| 屬性  | 值                               |
| ---------- | ----------------------------------- |
| 優先順序   | 緊急 (Critical) - 所有追蹤皆必需 |
| 設定時間 | <5 分鐘                              |

## 快速開始（3 行程式碼） (Quick Start (3 lines))

```python
from phoenix.otel import register
register(project_name="my-app", auto_instrument=True)
```

**連線至 `http://localhost:6006`，自動檢測所有支援的函式庫。**

## 安裝 (Installation)

```bash
pip install arize-phoenix-otel
```

**支援版本：** Python 3.10-3.13

## 配置 (Configuration)

### 環境變數（優先建議） (Environment Variables (Recommended))

```bash
export PHOENIX_API_KEY="your-api-key"  # Phoenix Cloud 必需
export PHOENIX_COLLECTOR_ENDPOINT="http://localhost:6006"  # 或 Cloud URL
export PHOENIX_PROJECT_NAME="my-app"  # 選填
```

### Python 程式碼 (Python Code)

```python
from phoenix.otel import register

tracer_provider = register(
    project_name="my-app",              # 專案名稱
    endpoint="http://localhost:6006",   # Phoenix 端點
    auto_instrument=True,               # 自動檢測支援的函式庫
    batch=True,                         # 批次處理（預設值：True）
)
```

**參數：**

- `project_name`：專案名稱（會覆寫 `PHOENIX_PROJECT_NAME`）
- `endpoint`：Phoenix URL（會覆寫 `PHOENIX_COLLECTOR_ENDPOINT`）
- `auto_instrument`：啟用自動檢測（預設值：False）
- `batch`：使用 BatchSpanProcessor（預設值：True，建議生產環境使用）
- `protocol`：`"http/protobuf"`（預設值）或 `"grpc"`

## 自動檢測 (Auto-Instrumentation)

為您的框架安裝檢測器：

```bash
pip install openinference-instrumentation-openai      # OpenAI SDK
pip install openinference-instrumentation-langchain   # LangChain
pip install openinference-instrumentation-llama-index # LlamaIndex
# ... 視需要安裝其他檢測器
```

然後啟用自動檢測：

```python
register(project_name="my-app", auto_instrument=True)
```

Phoenix 會自動探索並檢測所有已安裝的 OpenInference 套件。

## 批次處理（生產環境） (Batch Processing (Production))

預設為啟用。透過環境變數進行配置：

```bash
export OTEL_BSP_SCHEDULE_DELAY=5000           # 每 5 秒批次一次
export OTEL_BSP_MAX_QUEUE_SIZE=2048           # 佇列 2048 個 Span
export OTEL_BSP_MAX_EXPORT_BATCH_SIZE=512     # 每批發送 512 個 Span
```

**連結：** https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/

## 驗證 (Verification)

1. 開啟 Phoenix UI：`http://localhost:6006`
2. 導航至您的專案
3. 執行您的應用程式
4. 檢查追蹤（會在批次延遲時間內出現）

## 疑難排解 (Troubleshooting)

**無追蹤：**

- 驗證 `PHOENIX_COLLECTOR_ENDPOINT` 與 Phoenix 伺服器相符。
- 為 Phoenix Cloud 設定 `PHOENIX_API_KEY`。
- 確認已安裝檢測器。

**缺少屬性：**

- 檢查 Span 種類（見 rules/ 目錄）。
- 驗證屬性名稱（見 rules/ 目錄）。

## 範例 (Example)

```python
from phoenix.otel import register
from openai import OpenAI

# 啟用帶有自動檢測的追蹤
register(project_name="my-chatbot", auto_instrument=True)

# OpenAI 會自動被檢測
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## API 參考 (API Reference)

- [Python OTEL API 文件](https://arize-phoenix.readthedocs.io/projects/otel/en/latest/)
- [Python Client API 文件](https://arize-phoenix.readthedocs.io/projects/client/en/latest/)
