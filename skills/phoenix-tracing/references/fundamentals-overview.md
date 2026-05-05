# 概觀與追蹤與 Span (Overview and Traces & Spans)

本文件涵蓋了 Phoenix 中 OpenInference 追蹤 (Traces) 與 Span 的基本概念。

## 概觀 (Overview)

OpenInference 是一組基於 OpenTelemetry、針對 AI 與 LLM 應用程式的語義慣例 (semantic conventions)。Phoenix 使用這些慣例來擷取、儲存與分析來自 AI 應用程式的追蹤。

**關鍵概念：**

- **追蹤 (Traces)** 代表貫穿您應用程式的端對端要求。
- **Span** 代表追蹤中的個別操作（例如 LLM 呼叫、擷取、工具叫用）。
- **屬性 (Attributes)** 是附加在 Span 上的鍵值對，使用扁平化的點分標記法路徑。
- **Span 種類 (Span Kinds)** 將操作類型進行分類（例如 LLM, RETRIEVER, TOOL 等）。

## 追蹤與 Span (Traces and Spans)

### 追蹤階層 (Trace Hierarchy)

一個 **追蹤 (trace)** 是由 **Span** 組成的樹狀結構，代表一個完整的請求：

```
Trace ID: abc123
├─ Span 1: CHAIN (根 Span, parent_id = null)
│  ├─ Span 2: RETRIEVER (parent_id = span_1_id)
│  │  └─ Span 3: EMBEDDING (parent_id = span_2_id)
│  └─ Span 4: LLM (parent_id = span_1_id)
│     └─ Span 5: TOOL (parent_id = span_4_id)
```

### 上下文傳播 (Context Propagation)

Span 透過以下方式維持父子關係：

- `trace_id` - 追蹤中的所有 Span 皆相同。
- `span_id` - 此 Span 的唯一識別碼。
- `parent_id` - 引用父項 Span 的 `span_id`（根 Span 為 null）。

Phoenix 利用這些關係來：

- 在 UI 中建立 Span 樹的可視化。
- 在樹狀結構中向上計算累計指標（例如權杖數、錯誤數）。
- 實現巢狀查詢（例如「尋找包含發生錯誤的 LLM Span 的 CHAIN Span」）。

### Span 生命週期 (Span Lifecycle)

每個 Span 具有：

- `start_time` - 操作開始的時間（以奈秒為單位的 Unix 時間戳記）。
- `end_time` - 操作完成的時間。
- `status_code` - OK, ERROR 或 UNSET。
- `status_message` - 選填的錯誤訊息。
- `attributes` - 包含所有語義慣例屬性的物件。
