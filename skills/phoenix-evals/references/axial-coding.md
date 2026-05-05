# 軸心式編碼 (Axial Coding)

將開放式的筆記分組為結構化的失敗分類法。

## 流程 (Process)

1. **收集 (Gather)** - 收集開放式編碼筆記。
2. **尋找模式 (Pattern)** - 將具有共同主題的筆記分組。
3. **命名 (Name)** - 建立具備行動導向的類別名稱。
4. **量化 (Quantify)** - 計算每個類別的失敗次數。

## 分類法範例 (Example Taxonomy)

```yaml
failure_taxonomy:
  內容品質 (content_quality):
    hallucination (幻覺): [invented_facts, fictional_citations]
    incompleteness (不完整): [partial_answer, missing_key_info]
    inaccuracy (不準確): [wrong_numbers, wrong_dates]
  
  溝通 (communication):
    tone_mismatch (語氣不符): [too_casual, too_formal]
    clarity (清晰度): [ambiguous, jargon_heavy]
  
  上下文 (context):
    user_context (使用者上下文): [ignored_preferences, misunderstood_intent]
    retrieved_context (檢索到的上下文): [ignored_documents, wrong_context]
  
  安全 (safety):
    missing_disclaimers (缺少免責聲明): [legal, medical, financial]
```

## 新增標核 (Python) (Add Annotation (Python))

```python
from phoenix.client import Client

client = Client()
client.spans.add_span_annotation(
    span_id="abc123",
    annotation_name="failure_category",
    label="hallucination",
    explanation="捏造了不存在的功能",
    annotator_kind="HUMAN",
    sync=True,
)
```

## 新增標核 (TypeScript) (Add Annotation (TypeScript))

```typescript
import { addSpanAnnotation } from "@arizeai/phoenix-client/spans";

await addSpanAnnotation({
  spanAnnotation: {
    spanId: "abc123",
    name: "failure_category",
    label: "hallucination",
    explanation: "捏造了不存在的功能",
    annotatorKind: "HUMAN",
  }
});
```

## 代理程式失敗分類法 (Agent Failure Taxonomy)

```yaml
agent_failures:
  規劃 (planning): [wrong_plan, incomplete_plan]
  工具選取 (tool_selection): [wrong_tool, missed_tool, unnecessary_call]
  工具執行 (tool_execution): [wrong_parameters, type_error]
  狀態管理 (state_management): [lost_context, stuck_in_loop]
  錯誤恢復 (error_recovery): [no_fallback, wrong_fallback]
```

## 轉移矩陣（代理程式） (Transition Matrix (Agents))

顯示狀態間發生失敗的位置：

```python
def build_transition_matrix(conversations, states):
    matrix = defaultdict(lambda: defaultdict(int))
    for conv in conversations:
        if conv["failed"]:
            last_success = find_last_success(conv)
            first_failure = find_first_failure(conv)
            matrix[last_success][first_failure] += 1
    return pd.DataFrame(matrix).fillna(0)
```

## 原則 (Principles)

- **MECE** - 每個失敗僅符合一個類別。
- **具行動導向 (Actionable)** - 類別能暗示修復方案。
- **由下而上 (Bottom-up)** - 讓類別從數據中自然出現。
