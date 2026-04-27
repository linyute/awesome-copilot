# 軸向編碼 (Axial Coding)

將開放式筆記歸類為結構化的失敗分類架構 (failure taxonomies)。

## 流程 (Process)

1. **收集 (Gather)** - 收集開放編碼筆記
2. **模式 (Pattern)** - 將具有共同主題的筆記分組
3. **命名 (Name)** - 建立具備行動導向的類別名稱
4. **量化 (Quantify)** - 計算每個類別的失敗次數

## 分類架構範例 (Example Taxonomy)

```yaml
failure_taxonomy:
  content_quality:
    hallucination: [invented_facts, fictional_citations]
    incompleteness: [partial_answer, missing_key_info]
    inaccuracy: [wrong_numbers, wrong_dates]
  
  communication:
    tone_mismatch: [too_casual, too_formal]
    clarity: [ambiguous, jargon_heavy]
  
  context:
    user_context: [ignored_preferences, misunderstood_intent]
    retrieved_context: [ignored_documents, wrong_context]
  
  safety:
    missing_disclaimers: [legal, medical, financial]
```

## 新增 Annotation (Python)

```python
from phoenix.client import Client

client = Client()
client.spans.add_span_annotation(
    span_id="abc123",
    annotation_name="failure_category",
    label="hallucination",
    explanation="建立了一個不存在的功能",
    annotator_kind="HUMAN",
    sync=True,
)
```

## 新增 Annotation (TypeScript)

```typescript
import { addSpanAnnotation } from "@arizeai/phoenix-client/spans";

await addSpanAnnotation({
  spanAnnotation: {
    spanId: "abc123",
    name: "failure_category",
    label: "hallucination",
    explanation: "建立了一個不存在的功能",
    annotatorKind: "HUMAN",
  }
});
```

## 代理 (Agent) 失敗分類架構

```yaml
agent_failures:
  planning: [wrong_plan, incomplete_plan]
  tool_selection: [wrong_tool, missed_tool, unnecessary_call]
  tool_execution: [wrong_parameters, type_error]
  state_management: [lost_context, stuck_in_loop]
  error_recovery: [no_fallback, wrong_fallback]
```

## 轉移矩陣 (Transition Matrix) (代理)

顯示狀態之間發生失敗的位置：

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

- **MECE (相互獨立、完全窮盡)** - 每個失敗僅符合一個類別
- **具備行動導向 (Actionable)** - 類別應能提供修復建議
- **自下而上 (Bottom-up)** - 讓類別從資料中自然浮現
