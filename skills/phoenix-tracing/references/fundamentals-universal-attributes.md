# 通用屬性 (Universal Attributes)

此文件涵蓋了可在 OpenInference 中用於任何 span 種類的屬性。

## 總覽 (Overview)

這些屬性可用於**任何 span 種類**，以提供額外的內容 (context)、追蹤 (tracking) 和 Metadata。

## 輸入/輸出 (Input/Output)

| 屬性 | 類型 | 說明 |
| ------------------ | ------ | ---------------------------------------------------- |
| `input.value`      | String | 操作的輸入（提示、查詢、文件） |
| `input.mime_type`  | String | MIME 類型（例如："text/plain"、"application/json"） |
| `output.value`     | String | 操作的輸出（回應、向量、結果） |
| `output.mime_type` | String | 輸出的 MIME 類型 |

### 為什麼要擷取 I/O？

**請務必為可用於評估的 spans 擷取輸入/輸出：**
- Phoenix 評估器（忠實度、相關性、問答正確性）需要 `input.value` 與 `output.value`
- Phoenix UI 會在追蹤檢視中顯眼地顯示 I/O 以便除錯
- 支援匯出 I/O 以建立微調資料集 (fine-tuning datasets)
- 為分析代理 (agent) 行為提供完整的內容

**屬性範例：**

```json
{
  "openinference.span.kind": "CHAIN",
  "input.value": "天氣如何？",
  "input.mime_type": "text/plain",
  "output.value": "我沒有存取天氣資料的權限。",
  "output.mime_type": "text/plain"
}
```

**請參閱特定語言的實作：**
- TypeScript: `instrumentation-manual-typescript.md`
- Python: `instrumentation-manual-python.md`

## 階段與使用者追蹤 (Session and User Tracking)

| 屬性 | 類型 | 說明 |
| ------------ | ------ | ---------------------------------------------- |
| `session.id` | String | 用於將相關追蹤分組的階段 (session) 識別碼 |
| `user.id`    | String | 用於個別使用者分析的使用者識別碼 |

**範例：**

```json
{
  "openinference.span.kind": "LLM",
  "session.id": "session_abc123",
  "user.id": "user_xyz789"
}
```

## Metadata

| 屬性 | 類型 | 說明 |
| ---------- | ------ | ------------------------------------------ |
| `metadata` | string | JSON 序列化的鍵值對 (key-value pairs) 物件 |

**範例：**

```json
{
  "openinference.span.kind": "LLM",
  "metadata": "{\"environment\": \"production\", \"model_version\": \"v2.1\", \"cost_center\": \"engineering\"}"
}
```
