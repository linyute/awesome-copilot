# 總覽與追蹤 (Traces) & Spans

此文件涵蓋了 Phoenix 中 OpenInference 追蹤 (traces) 與 spans 的基本概念。

## 總覽 (Overview)

OpenInference 是一套基於 OpenTelemetry、針對 AI 與 LLM 應用程式的語義慣例 (semantic conventions)。Phoenix 使用這些慣例來擷取、儲存及分析來自 AI 應用程式的追蹤。

**關鍵概念：**

- **追蹤 (Traces)** 代表流經應用程式的端到端請求
- **Spans** 代表追蹤中的個別操作（LLM 呼叫、擷取、工具呼叫）
- **屬性 (Attributes)** 是附加到 spans 的鍵值對 (key-value pairs)，使用扁平化的點號標法 (dot-notation) 路徑
- **Span 種類 (Span Kinds)** 將操作類型進行歸類（例如 LLM、RETRIEVER、TOOL 等）

## 追蹤 (Traces) 與 Spans

### 追蹤階層 (Trace Hierarchy)

**追蹤**是代表完整請求的 **spans** 樹狀結構：

```
追蹤 ID (Trace ID): abc123
├─ Span 1: CHAIN (根 span, parent_id = null)
│  ├─ Span 2: RETRIEVER (parent_id = span_1_id)
│  │  └─ Span 3: EMBEDDING (parent_id = span_2_id)
│  └─ Span 4: LLM (parent_id = span_1_id)
│     └─ Span 5: TOOL (parent_id = span_4_id)
```

### 上下文傳遞 (Context Propagation)

Spans 透過以下方式維持父子關係：

- `trace_id` - 同一追蹤中的所有 spans 皆相同
- `span_id` - 此 span 的唯一識別碼
- `parent_id` - 參照父 span 的 `span_id`（根 spans 為 null）

Phoenix 使用這些關係來：

- 在 UI 中建立 span 樹狀視覺化圖表
- 在樹狀結構中向上計算累計指標（符記/tokens、錯誤）
- 啟用巢狀查詢（例如：「尋找包含出錯 LLM spans 的 CHAIN spans」）

### Span 生命週期 (Span Lifecycle)

每個 span 具有：

- `start_time` - 操作何時開始（以奈秒為單位的 Unix 時間戳記）
- `end_time` - 操作何時完成
- `status_code` - OK、ERROR 或 UNSET
- `status_message` - 選用的錯誤訊息
- `attributes` - 包含所有語義慣例屬性的物件
