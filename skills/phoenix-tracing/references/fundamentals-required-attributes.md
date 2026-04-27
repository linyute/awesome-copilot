# 必要與建議屬性 (Required and Recommended Attributes)

此文件涵蓋了所有 OpenInference spans 的必要屬性與強烈建議屬性。

## 必要屬性 (Required Attribute)

**每個 span 必須包含恰好一個必要屬性：**

```json
{
  "openinference.span.kind": "LLM"
}
```

## 強烈建議屬性 (Highly Recommended Attributes)

雖然非嚴格要求，但**強烈建議**在所有 spans 上加上這些屬性，因為它們：
- 啟用評估與品質評定
- 幫助理解應用程式中的資訊流 (information flow)
- 讓追蹤對於除錯更有用

### 輸入/輸出值 (Input/Output Values)

| 屬性 | 類型 | 說明 |
|-----------|------|-------------|
| `input.value` | String | 操作的輸入（提示、查詢、文件） |
| `output.value` | String | 操作的輸出（回應、結果、回答） |

**範例：**
```json
{
  "openinference.span.kind": "LLM",
  "input.value": "法國的首都是哪裡？",
  "output.value": "法國的首都是巴黎。"
}
```

**為什麼這些屬性很重要：**
- **評估 (Evaluations)**：許多評估器（忠實度、相關性、幻覺偵測）都需要輸入與輸出來評定品質
- **資訊流**：看到輸入/輸出可以輕鬆追蹤資料在應用程式中如何轉換
- **除錯**：當出錯時，擁有實際的輸入/輸出可以讓根本原因分析快上許多
- **分析 (Analytics)**：可對相似的輸入或輸出進行模式分析

**Phoenix 行為：**
- 輸入/輸出會顯眼地顯示在 span 詳細資訊中
- 評估器可以自動存取這些值
- 可依輸入或輸出內容搜尋/過濾追蹤
- 匯出輸入/輸出以用於微調資料集 (fine-tuning datasets)

## 有效的 Span 種類 (Valid Span Kinds)

OpenInference 中恰好有 **9 種有效的 span 種類**：

| Span 種類 | 目的 | 常見使用案例 |
|-----------|---------|-----------------|
| `LLM` | 語言模型推論 | OpenAI、Anthropic、本機 LLM 呼叫 |
| `EMBEDDING` | 向量產生 | 文字轉向量轉換 |
| `CHAIN` | 應用程式流協排 (orchestration) | LangChain 鏈、自訂工作流程 |
| `RETRIEVER` | 文件/內容擷取 | 向量資料庫查詢、語義搜尋 |
| `RERANKER` | 結果重排 | 針對擷取的文件重新排名 |
| `TOOL` | 外部工具呼叫 | API 呼叫、函式執行 |
| `AGENT` | 自主推理 | ReAct 代理、規劃迴圈 |
| `GUARDRAIL` | 安全/政策檢查 | 內容審查、PII 偵測 |
| `EVALUATOR` | 品質評定 | 回答相關性、忠實度評分 |
