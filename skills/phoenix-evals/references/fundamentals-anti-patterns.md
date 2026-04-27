# 反模式 (Anti-Patterns)

常見錯誤與修正方式。

| 反模式 | 問題 | 修正方式 |
| ------------ | ------- | --- |
| 通用指標 (Generic metrics) | 內建分數與您的失敗情況不符 | 從錯誤分析 (error analysis) 開始建立 |
| 憑感覺 (Vibe-based) | 缺乏量化數據 | 使用實驗 (experiments) 進行測量 |
| 忽略人類標記 | LLM 裁判未經校準 | 驗證是否達成 >80% TPR/TNR |
| 過早自動化 | 針對想像中的問題建立評估器 | 由觀察到的失敗案例來驅動 |
| 飽和盲點 (Saturation blindness) | 100% 通過 = 缺乏訊號 | 將能力評估 (capability evals) 保持在 50-80% |
| 相似度指標 | 將 BERTScore/ROUGE 用於生成 (generation) | 僅用於擷取 (retrieval) |
| 頻繁切換模型 | 寄望於換個模型會更好 | 先進行錯誤分析 |

## 量化變更 (Quantify Changes)

```python
baseline = run_experiment(dataset, old_prompt, evaluators)
improved = run_experiment(dataset, new_prompt, evaluators)
print(f"Improvement: {improved.pass_rate - baseline.pass_rate:+.1%}")
```

## 不要將相似度用於生成

```python
# 差 (BAD)
score = bertscore(output, reference)

# 好 (GOOD)
correct_facts = check_facts_against_source(output, context)
```

## 在更換模型前先進行錯誤分析

```python
# 差 (BAD)
for model in models:
    results = test(model)

# 好 (GOOD)
failures = analyze_errors(results)
# 接著再決定是否需要更換模型
```
