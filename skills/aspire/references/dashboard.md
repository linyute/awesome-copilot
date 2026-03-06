# 儀表板 — 完整的參考資料

Aspire 儀表板為分散式應用程式中的所有資源提供即時可觀測性。它會隨 `aspire run` 自動啟動，也可以獨立執行。

---

## 功能

### 資源檢視 (Resources view)

顯示所有資源 (專案、容器、可執行檔)，包含：

- **名稱**與**類型** (專案、容器、可執行檔)
- **狀態** (Starting, Running, Stopped, FailedToStart 等)
- **啟動時間**與**執行時間 (uptime)**
- **端點** — 每個公開端點的可點擊 URL
- **來源** — 專案路徑、容器映像或可執行檔路徑
- **動作** — 停止、啟動、重新啟動按鈕

### 主控台記錄 (Console logs)

來自所有資源的彙總原始 stdout/stderr：

- 依資源名稱篩選
- 在記錄中搜尋
- 具有暫停功能的自動捲動
- 依資源區分顏色代碼

### 結構化記錄 (Structured logs)

應用程式層級的結構化記錄 (透過 ILogger, OpenTelemetry)：

- 可依資源、記錄層級、類別、訊息內容進行**篩選**
- **可展開** — 點擊以檢視包含所有屬性的完整記錄項目
- 與追蹤**相互關聯** — 點擊以跳轉至相關追蹤
- 支援 .NET ILogger 結構化記錄屬性
- 支援任何語言的 OpenTelemetry 記錄訊號

### 分散式追蹤 (Distributed traces)

跨所有服務的端對端要求追蹤：

- **瀑布檢視 (Waterfall view)** — 顯示包含計時的完整呼叫鏈
- **範圍 (Span) 詳細資訊** — HTTP 方法、URL、狀態碼、持續時間
- **資料庫範圍** — SQL 查詢、連線詳細資訊
- **訊息範圍** — 佇列操作、主題發佈
- **錯誤醒目提示** — 失敗的範圍顯示為紅色
- **跨服務相關性** — .NET 會自動傳播追蹤內容；其他語言則需手動傳播

### 計量 (Metrics)

即時和歷史計量：

- **執行階段計量** — CPU、記憶體、GC、執行緒集區
- **HTTP 計量** — 要求率、錯誤率、延遲百分位數
- **自訂計量** — 您的服務透過 OpenTelemetry 發送的任何計量
- **可圖表化** — 每個計量的時間序列圖表

### GenAI 視覺化檢視器 (GenAI Visualizer)

對於使用 AI/LLM 整合的應用程式：

- **權杖 (Token) 使用量** — 提示權杖、完成權杖、每次要求的總權杖量
- **提示/完成配對** — 查看傳送的確切提示和收到的回應
- **模型 Metadata** — 哪個模型、溫度 (temperature)、最大權杖數
- **延遲** — 每次 AI 呼叫的時間
- 需要服務透過 OpenTelemetry 發送 [GenAI 語意慣例](https://opentelemetry.io/docs/specs/semconv/gen-ai/)

---

## 儀表板 URL

預設情況下，儀表板在自動分配的連接埠上執行。您可以透過以下方式找到它：

- 當 `aspire run` 啟動時的終端機輸出中
- 透過 MCP：`list_resources` 工具
- 使用 `--dashboard-port` 覆寫：

```bash
aspire run --dashboard-port 18888
```

---

## 獨立儀表板 (Standalone Dashboard)

在不使用 AppHost 的情況下執行儀表板 — 這對於已發送 OpenTelemetry 的現有應用程式非常有用：

```bash
docker run --rm -d 
  -p 18888:18888 
  -p 4317:18889 
  mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

| 連接埠 | 目的 |
| ---------------- | ------------------------------------------------------------ |
| `18888` | 儀表板網頁 UI |
| `4317` → `18889` | OTLP gRPC 接收器 (標準 OTel 連接埠 → 儀表板內部) |

### 設定您的服務

將您的 OpenTelemetry 匯出器指向儀表板：

```bash
# 適用於任何語言 OpenTelemetry SDK 的環境變數
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=my-service
```

### Docker Compose 範例

```yaml
services:
  dashboard:
    image: mcr.microsoft.com/dotnet/aspire-dashboard:latest
    ports:
      - "18888:18888"
      - "4317:18889"

  api:
    build: ./api
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://dashboard:18889
      - OTEL_SERVICE_NAME=api

  worker:
    build: ./worker
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://dashboard:18889
      - OTEL_SERVICE_NAME=worker
```

---

## 儀表板組態

### 驗證

獨立儀表板支援透過瀏覽器權杖 (browser tokens) 進行驗證：

```bash
docker run --rm -d \
  -p 18888:18888 \
  -p 4317:18889 \
  -e DASHBOARD__FRONTEND__AUTHMODE=BrowserToken \
  -e DASHBOARD__FRONTEND__BROWSERTOKEN__TOKEN=my-secret-token \
  mcr.microsoft.com/dotnet/aspire-dashboard:latest
```

### OTLP 組態

```bash
# 透過 gRPC 接受 OTLP (預設)
-e DASHBOARD__OTLP__GRPC__ENDPOINT=http://0.0.0.0:18889

# 透過 HTTP 接受 OTLP
-e DASHBOARD__OTLP__HTTP__ENDPOINT=http://0.0.0.0:18890

# 要求 OTLP 使用 API 金鑰
-e DASHBOARD__OTLP__AUTHMODE=ApiKey
-e DASHBOARD__OTLP__PRIMARYAPIKEY=my-api-key
```

### 資源限制

```bash
# 限制保留的記錄項目數
-e DASHBOARD__TELEMETRYLIMITS__MAXLOGCOUNT=10000

# 限制保留的追蹤項目數
-e DASHBOARD__TELEMETRYLIMITS__MAXTRACECOUNT=10000

# 限制計量資料點
-e DASHBOARD__TELEMETRYLIMITS__MAXMETRICCOUNT=50000
```

---

## Copilot 整合

儀表板與 VS Code 中的 GitHub Copilot 整合：

- 詢問有關資源狀態的問題
- 使用自然語言查詢記錄和追蹤
- MCP 伺服器 (請參閱 [MCP 伺服器](mcp-server.md)) 提供橋樑

---

## 非 .NET 服務遙測

為了讓非 .NET 服務出現在儀表板中，它們必須發送 OpenTelemetry 訊號。當使用 `.WithReference()` 時，Aspire 會自動插入 OTLP 端點環境變數：

### Python (OpenTelemetry SDK)

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
import os

# Aspire 會自動插入 OTEL_EXPORTER_OTLP_ENDPOINT
endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint)))
trace.set_tracer_provider(provider)
```

### JavaScript (OpenTelemetry SDK)

```javascript
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-grpc");

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4317",
    })
  )
);
provider.register();
```
