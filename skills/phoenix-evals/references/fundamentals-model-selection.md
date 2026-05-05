# 模型選擇

先進行錯誤分析，最後才更換模型。

## 決策樹

```
效能問題？
       │
       ▼
錯誤分析顯示是模型問題嗎？
    否 (NO)  → 修正提示詞、檢索、工具
    是 (YES) → 是否為能力差距？
          是 (YES) → 考慮更換模型
          否 (NO)  → 修正實際問題
```

## 評審模型選擇

| 原則 | 行動 |
| --------- | ------ |
| 從能力強的開始 | 先使用 gpt-4o |
| 稍後進行優化 | 在標準穩定後測試較便宜的模型 |
| 使用相同模型亦可 | 評審執行的是不同的任務 |

```python
# 從能力強的模型開始
judge = ClassificationEvaluator(
    llm=LLM(provider="openai", model="gpt-4o"),
    ...
)

# 驗證後，測試較便宜的模型
judge_cheap = ClassificationEvaluator(
    llm=LLM(provider="openai", model="gpt-4o-mini"),
    ...
)
# 在同一個測試集上比較 TPR/TNR
```

## 不要隨意更換模型 (Don't Model Shop)

```python
from phoenix.client import Client

client = Client()

# 差 (BAD)
for model in ["gpt-4o", "claude-3", "gemini-pro"]:
    results = client.experiments.run_experiment(
        dataset=dataset,
        task=lambda input, _model=model: task(input, model=_model),
        evaluators=evaluators,
    )

# 好 (GOOD)
failures = analyze_errors(results)
# "忽略上下文 (Ignores context)" → 修正提示詞
# "無法計算數學 (Can't do math)" → 也許嘗試更好的模型
```

## 何時更換模型是合理的

- 提示詞優化後失敗依然存在
- 能力差距 (推理、數學、程式碼)
- 錯誤分析確認了模型限制
