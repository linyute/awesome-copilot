# 評估者：RAG 系統 (Evaluators: RAG Systems)

RAG 包含兩個截然不同的組件，需要不同的評估方法。

## 兩階段評估 (Two-Phase Evaluation)

```
檢索 (RETRIEVAL)              產生 (GENERATION)
─────────                    ──────────
查詢 → 檢索器 → 文件         文件 + 查詢 → LLM → 答案
         │                              │
    IR 指標 (IR Metrics)        LLM 評審 / 程式碼檢查
```

**優先使用 IR 指標偵錯檢索**，接著處理產生品質。

## 檢索評估 (IR 指標) (Retrieval Evaluation (IR Metrics))

使用傳統的資訊檢索 (Information Retrieval) 指標：

| 指標 | 測量內容 |
| ------ | ---------------- |
| Recall@k | 在所有相關文件中，前 k 個包含多少？ |
| Precision@k | 在擷取的 k 個文件中，有多少是相關的？ |
| MRR | 第一個相關文件的排名有多高？ |
| NDCG | 依位置加權的品質評分 |

```python
# 需要查詢-文件的相關性標籤
def recall_at_k(retrieved_ids, relevant_ids, k=5):
    retrieved_set = set(retrieved_ids[:k])
    relevant_set = set(relevant_ids)
    if not relevant_set:
        return 0.0
    return len(retrieved_set & relevant_set) / len(relevant_set)
```

## 建立檢索測試資料 (Creating Retrieval Test Data)

透過合成方式產生查詢-文件配對：

```python
# 反向過程：文件 → 該文件可回答的問題
def generate_retrieval_test(documents):
    test_pairs = []
    for doc in documents:
        # 擷取事實，產生問題
        questions = llm(f"產生 3 個此文件可回答的問題：\n{doc}")
        for q in questions:
            test_pairs.append({"query": q, "relevant_doc_id": doc.id})
    return test_pairs
```

## 產生評估 (Generation Evaluation)

針對程式碼無法測量的性質使用 LLM 評審：

| 評估 | 問題 |
| ---- | -------- |
| **忠實度 (Faithfulness)** | 所有主張是否皆受檢索到的上下文支持？ |
| **相關性 (Relevance)** | 答案是否解決了問題？ |
| **完整性 (Completeness)** | 答案是否涵蓋了上下文中的關鍵點？ |

```python
from phoenix.evals import ClassificationEvaluator, LLM

FAITHFULNESS_TEMPLATE = """給予上下文與答案，答案中的每個主張是否皆受到上下文的支持？

<context>{{context}}</context>
<answer>{{output}}</answer>

"faithful" = 所有主張皆受上下文支持
"unfaithful" = 任何主張「不」在上下文中

答案 (faithful/unfaithful)："""

faithfulness = ClassificationEvaluator(
    name="faithfulness",
    prompt_template=FAITHFULNESS_TEMPLATE,
    llm=LLM(provider="openai", model="gpt-4o"),
    choices={"unfaithful": 0, "faithful": 1}
)
```

## RAG 失敗分類法 (RAG Failure Taxonomy)

常見的待評估失敗模式：

```yaml
retrieval_failures (檢索失敗):
  - no_relevant_docs: 查詢傳回無關內容
  - partial_retrieval: 遺漏部分相關文件
  - wrong_chunk: 文件正確，但段落錯誤

generation_failures (產生失敗):
  - hallucination (幻覺): 主張不在檢索到的上下文中
  - ignored_context: 答案未使用檢索到的文件
  - incomplete (不完整): 遺漏上下文中的關鍵資訊
  - wrong_synthesis: 誤解或錯誤組合來源
```

## 評估順序 (Evaluation Order)

1. **優先進行檢索** - 如果文件錯誤，產生必將失敗。
2. **忠實度** - 答案是否基於上下文？
3. **答案品質** - 答案是否解決了問題？

在偵錯產生問題前，請先修復檢索問題。
