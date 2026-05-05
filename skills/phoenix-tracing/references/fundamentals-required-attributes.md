# 必要與建議屬性 (Required and Recommended Attributes)

本文件涵蓋了所有 OpenInference Span 的必要屬性以及強烈建議的屬性。

## 必要屬性 (Required Attribute)

**每個 Span「必須」具有恰好一個必要屬性：**

```json
{
  "openinference.span.kind": "LLM"
}
```

## 強烈建議屬性 (Highly Recommended Attributes)

雖然非嚴格要求，但強烈建議在所有 Span 上使用這些屬性，因為它們：
- 實現評估與品質評定。
- 幫助瞭解應用程式中的資訊流。
- 使追蹤在偵錯時更有用。

### 輸入/輸出值 (Input/Output Values)

| 屬性 | 類型 | 描述 |
|-----------|------|-------------|
| `input.value` | 字串 | 操作的輸入（提示詞、查詢、文件） |
| `output.value` | 字串 | 操作的輸出（回應、結果、答案） |

**範例：**
```json
{
  "openinference.span.kind": "LLM",
  "input.value": "法國的首都是哪裡？",
  "output.value": "法國的首都是巴黎。"
}
```

**為什麼這些屬性很重要：**
- **評估**：許多評估者（忠實度、相關性、幻覺偵測）需要輸入與輸出兩者來評定品質。
- **資訊流**：查看輸入/輸出可讓您輕鬆追蹤資料在應用程式中的轉換過程。
- **偵錯**：當出現問題時，具備實際的輸入/輸出能讓根本原因分析變得更快。
- **分析**：實現對類似輸入或輸出的模式分析。

**Phoenix 的行為：**
- 輸入/輸出顯眼地顯示在 Span 細節中。
- 評估者可以自動存取這些值。
- 依輸入或輸出內容搜尋/篩選追蹤。
- 匯出輸入/輸出以用於微調資料集。

## 有效的 Span 種類 (Valid Span Kinds)

OpenInference 中恰好有 **9 種有效的 Span 種類**：

| Span 種類 | 目的 | 常見使用案例 |
|-----------|---------|-----------------|
| `LLM` | 語言模型推論 | OpenAI, Anthropic, 本地端 LLM 呼叫 |
| `EMBEDDING` | 向量產生 | 文字轉向量的轉換 |
| `CHAIN` | 應用程式流程編排 | LangChain 鏈、自訂工作流程 |
| `RETRIEVER` | 文件/上下文擷取 | 向量資料庫查詢、語義搜尋 |
| `RERANKER` | 結果重新排序 | 對擷取的文件進行重新排序 |
| `TOOL` | 外部工具叫用 | API 呼叫、函式執行 |
| `AGENT` | 自主推理 | ReAct 代理程式、規劃循環 |
| `GUARDRAIL` | 安全性/政策檢查 | 內容審核、PII 偵測 |
| `EVALUATOR` | 品質評定 | 答案相關性、忠實度評分 |
