# 通用屬性 (Universal Attributes)

本文件涵蓋了可用於 OpenInference 中任何 Span 種類的屬性。

## 概觀 (Overview)

這些屬性可用於 **任何 Span 種類**，以提供額外的上下文、追蹤與中介資料。

## 輸入/輸出 (Input/Output)

| 屬性 | 類型 | 描述 |
| ------------------ | ------ | ---------------------------------------------------- |
| `input.value` | 字串 | 操作的輸入（提示詞、查詢、文件） |
| `input.mime_type` | 字串 | MIME 類型（例如 "text/plain", "application/json"） |
| `output.value` | 字串 | 操作的輸出（回應、向量、結果） |
| `output.mime_type` | 字串 | 輸出的 MIME 類型 |

### 為何要擷取輸入/輸出？ (Why Capture I/O?)

**務必為評估就緒的 Span 擷取輸入/輸出：**
- Phoenix 評估者（忠實度、相關性、問答正確性）需要 `input.value` 與 `output.value`。
- Phoenix UI 會在追蹤檢視中顯眼地顯示輸入/輸出，以便進行偵錯。
- 實現匯出輸入/輸出以建立微調資料集。
- 為分析代理程式行為提供完整上下文。

**屬性範例：**

```json
{
  "openinference.span.kind": "CHAIN",
  "input.value": "今天天氣如何？",
  "input.mime_type": "text/plain",
  "output.value": "我無法存取天氣資料。",
  "output.mime_type": "text/plain"
}
```

**參見語言特定實作：**
- TypeScript：`instrumentation-manual-typescript.md`
- Python：`instrumentation-manual-python.md`

## 工作階段與使用者追蹤 (Session and User Tracking)

| 屬性 | 類型 | 描述 |
| ------------ | ------ | ---------------------------------------------- |
| `session.id` | 字串 | 用於將相關追蹤分組的工作階段識別碼 |
| `user.id` | 字串 | 用於按使用者進行分析的使用者識別碼 |

**範例：**

```json
{
  "openinference.span.kind": "LLM",
  "session.id": "session_abc123",
  "user.id": "user_xyz789"
}
```

## 中介資料 (Metadata)

| 屬性 | 類型 | 描述 |
| ---------- | ------ | ------------------------------------------ |
| `metadata` | 字串 | 以 JSON 序列化表示的鍵值對物件 |

**範例：**

```json
{
  "openinference.span.kind": "LLM",
  "metadata": "{\"environment\": \"production\", \"model_version\": \"v2.1\", \"cost_center\": \"engineering\"}"
}
```
