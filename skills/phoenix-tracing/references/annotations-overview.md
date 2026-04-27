# 標記 (Annotations) 總覽

標記 (Annotations) 可讓您針對追蹤 (traces)、spans、文件和階段 (sessions) 加入人類或自動化回饋。標記對於評估、品質評定以及建立訓練資料集至關重要。

## 標記類型 (Annotation Types)

Phoenix 支援四種標記類型：

| 類型 | 目標 | 目的 | 範例使用案例 |
| ----------------------- | -------------------------------- | ---------------------------------------- | -------------------------------- |
| **Span 標記** | 個別 span | 針對特定操作的回饋 | 「此 LLM 回應很準確」 |
| **文件標記** | RETRIEVER (擷取器) span 中的文件 | 針對擷取文件相關性的回饋 | 「此文件沒有幫助」 |
| **追蹤標記** | 整個追蹤 | 針對端到端互動的回饋 | 「使用者對結果感到滿意」 |
| **階段標記** | 使用者階段 | 針對多輪對話的回饋 | 「階段成功結束」 |

## 標記欄位 (Annotation Fields)

每個標記都包含以下欄位：

### 必要欄位 (Required Fields)

| 欄位 | 類型 | 說明 |
| --------- | ------ | ----------------------------------------------------------------------------- |
| 實體 ID (Entity ID) | String | 目標實體的 ID (span_id、trace_id、session_id 或 document_position) |
| `name` | String | 標記名稱/標籤（例如：「quality」、「relevance」、「helpfulness」） |

### 結果欄位 (至少需提供一個)

| 欄位 | 類型 | 說明 |
| ------------- | ----------------- | ----------------------------------------------------------------- |
| `label` | String (選用) | 類別值（例如：「good」、「bad」、「relevant」、「irrelevant」） |
| `score` | Float (選用) | 數值（通常為 0-1，但可以是任何範圍） |
| `explanation` | String (選用) | 針對標記的純文字解釋 |

必須提供 `label`、`score` 或 `explanation` 中的**至少一個**。

### 選用欄位 (Optional Fields)

| 欄位 | 類型 | 說明 |
| ---------------- | ------ | --------------------------------------------------------------------------------------- |
| `annotator_kind` | String | 誰建立了此標記：「HUMAN」、「LLM」或「CODE」（預設為「HUMAN」） |
| `identifier` | String | 用於更新或插入 (upsert) 行為的唯一識別碼（若名稱+實體+識別碼相同，則更新現有內容） |
| `metadata` | Object | 以鍵值對 (key-value pairs) 形式呈現的自訂 Metadata |

## 標記器類型 (Annotator Kinds)

| 類型 | 說明 | 範例 |
| ------- | ------------------------------ | --------------------------------- |
| `HUMAN` | 來自人類的手動回饋 | 使用者評分、專家標籤 |
| `LLM` | 來自 LLM 的自動化回饋 | GPT-4 評估回應品質 |
| `CODE` | 來自程式碼的自動化回饋 | 基於規則的檢查、啟發式 (heuristics) |

## 範例 (Examples)

**品質評定：**

- `quality` - 整體品質 (label: good/fair/poor, score: 0-1)
- `correctness` - 事實準確性 (label: correct/incorrect, score: 0-1)
- `helpfulness` - 使用者滿意度 (label: helpful/not_helpful, score: 0-1)

**RAG 特定：**

- `relevance` - 文件與查詢的相關性 (label: relevant/irrelevant, score: 0-1)
- `faithfulness` - 回答是否立基於內容 (label: faithful/unfaithful, score: 0-1)

**安全：**

- `toxicity` - 包含有害內容 (score: 0-1)
- `pii_detected` - 包含個人識別資訊 (label: yes/no)
