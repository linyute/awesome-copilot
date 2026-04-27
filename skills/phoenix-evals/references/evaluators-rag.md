# 評估器：RAG 系統 (RAG Systems)

RAG 包含兩個截然不同的元件，需要不同的評估方法。

## 兩階段評估 (Two-Phase Evaluation)

```
擷取 (RETRIEVAL)             生成 (GENERATION)
─────────                    ──────────
查詢 → 擷取器 → 文件          文件 + 查詢 → LLM → 回答
         │                              │
    IR 指標 (IR Metrics)        LLM 裁判 / 程式碼檢查
```

**先對擷取進行除錯** (使用 IR 指標)，然後再處理生成品質。

## 擷取評估 (IR 指標) (Retrieval Evaluation (IR Metrics))

使用傳統的資訊檢索指標：

| 指標 | 測量內容 |
| ------ | ---------------- |
| Recall@k | 在所有相關文件中，前 k 個中包含多少個？ |
| Precision@k | 在擷取的 k 個文件中，有多少個是相關的？ |
| MRR | 第一個相關文件的排名有多高？ |
| NDCG | 根據位置加權的品質 |

```python
# 需要查詢-文件相關性標籤 (relevance labels)
def recall_at_k(retrieved_ids, relevant_ids, k=5):
    retrieved_set = set(retrieved_ids[:k])
    relevant_set = set(relevant_ids)
    if not relevant_set:
        return 0.0
    return len(retrieved_set & relevant_set) / len(relevant_set)
```

## 建立擷取測試資料 (Creating Retrieval Test Data)

透過合成方式產生查詢-文件對 (query-document pairs)：

```python
# 反向過程：文件 → 該文件可回答的問題
def generate_retrieval_test(documents):
    test_pairs = []
    for doc in documents:
        # 擷取事實，產生問題
        questions = llm(f"Generate 3 questions this document answers:\n{doc}")
        for q in questions:
            test_pairs.append({"query": q, "relevant_doc_id": doc.id})
    return test_pairs
```

## 生成評估 (Generation Evaluation)

使用 LLM 裁判來評估程式碼無法測量的品質：

| 評估項目 | 問題 |
| ---- | -------- |
| **忠實度 (Faithfulness)** | 所有的主張是否都有擷取內容 (context) 的支援？ |
| **相關性 (Relevance)** | 回答是否針對問題？ |
| **完整性 (Completeness)** | 回答是否涵蓋了內容中的關鍵點？ |

```python
from phoenix.evals import ClassificationEvaluator, LLM

FAITHFULNESS_TEMPLATE = """Given the context and answer, is every claim in the answer supported by the context?

<context>{{context}}</context>
<answer>{{output}}</answer>

"faithful" = ALL claims supported by context
"unfaithful" = ANY claim NOT in context

Answer (faithful/unfaithful):"""

faithfulness = ClassificationEvaluator(
    name="faithfulness",
    prompt_template=FAITHFULNESS_TEMPLATE,
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"unfaithful": 0, "faithful": 1}
)
```

## RAG 失敗分類架構 (RAG Failure Taxonomy)

常見的待評估失敗模式：

```yaml
retrieval_failures:
  - no_relevant_docs: 查詢回傳了無關的內容
  - partial_retrieval: 漏掉了部分相關文件
  - wrong_chunk: 文件正確，但段落錯誤

generation_failures:
  - hallucination: 主張不在擷取的內容中
  - ignored_context: 回答未使用擷取的文件
  - incomplete: 遺漏內容中的關鍵資訊
  - wrong_synthesis: 誤解或錯誤地組合來源
```

## 評估順序 (Evaluation Order)

1. **擷取優先 (Retrieval first)** - 如果文件錯誤，生成也會失敗
2. **忠實度 (Faithfulness)** - 回答是否立基於內容？
3. **回答品質 (Answer quality)** - 回答是否針對問題？

在對生成進行除錯之前，請先修正擷取問題。
