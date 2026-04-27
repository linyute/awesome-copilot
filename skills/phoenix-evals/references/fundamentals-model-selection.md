# 模型選擇 (Model Selection)

先進行錯誤分析 (Error analysis)，最後才考慮變更模型。

## 決策樹 (Decision Tree)

```
有效能問題？
       │
       ▼
錯誤分析是否顯示是模型問題？
    否 (NO)  → 修正提示 (prompts)、擷取 (retrieval)、工具 (tools)
    是 (YES) → 這是能力差距 (capability gap) 嗎？
              是 (YES) → 考慮變更模型
              否 (NO)  → 修正實際問題
```

## 裁判模型選擇 (Judge Model Selection)

| 原則 | 行動 |
| --------- | ------ |
| 從能力強的開始 | 先使用 gpt-4o |
| 稍後進行最佳化 | 在準則穩定後測試較便宜的模型 |
| 使用相同模型亦可 | 裁判執行的是不同的任務 |

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

## 不要隨意挑選模型 (Don't Model Shop)

```python
# 差 (BAD)
for model in ["gpt-4o", "claude-3", "gemini-pro"]:
    results = run_experiment(dataset, task, model)

# 好 (GOOD)
failures = analyze_errors(results)
# 「忽略內容」 → 修正提示 (prompt)
# 「不擅長數學」 → 也許可以嘗試更好的模型
```

## 何時有理由變更模型

- 在提示最佳化後，失敗仍持續發生
- 能力差距（推理、數學、程式碼）
- 錯誤分析證實了模型限制
