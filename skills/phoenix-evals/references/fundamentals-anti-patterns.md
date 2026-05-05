# 反模式 (Anti-Patterns)

常見錯誤與修正。

| 反模式 | 問題 | 修正 |
| ------------ | ------- | --- |
| 通用指標 | 內建分數與您的失敗案例不符 | 從錯誤分析中建構 |
| 基於感覺 (Vibe-based) | 缺乏量化 | 使用實驗進行測量 |
| 忽視人類 | 未經校準的 LLM 評審 | 驗證 TPR/TNR >80% |
| 過早自動化 | 為想像中的問題建立評估器 | 讓觀察到的失敗案例驅動 |
| 飽和盲點 | 100% 通過 = 沒有訊號 | 將能力評估保持在 50-80% |
| 相似性指標 | 在生成任務中使用 BERTScore/ROUGE | 僅用於檢索 |
| 模型切換 | 寄望模型表現更好 | 先進行錯誤分析 |
| 單次執行評分 | LLM 評審和非決定性任務會增加單次執行雜訊，在小型資料集上可能會掩蓋提示詞變更的訊號 | 當任務或評審是 LLM 呼叫時，在 `runExperiment` 上設定 `repetitions` (或增加資料集大小) |

## 量化變更

```python
from phoenix.client import Client

client = Client()
baseline = client.experiments.run_experiment(dataset=dataset, task=old_prompt, evaluators=evaluators)
improved = client.experiments.run_experiment(dataset=dataset, task=new_prompt, evaluators=evaluators)
print(f"Improvement: {improved.pass_rate - baseline.pass_rate:+.1%}")
```

## 不要將相似性用於生成

```python
# 差 (BAD)
score = bertscore(output, reference)

# 好 (GOOD)
correct_facts = check_facts_against_source(output, context)
```

## 模型切換前的錯誤分析

```python
# 差 (BAD)
for model in models:
    results = test(model)

# 好 (GOOD)
failures = analyze_errors(results)
# 然後決定是否有必要更換模型
```
