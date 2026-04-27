# 驗證 (Validation)

在部署之前，針對人類標記驗證 LLM 裁判。目標為 >80% 的一致性 (agreement)。

## 需求 (Requirements)

| 需求 | 目標 |
| ----------- | ------ |
| 測試集大小 | 100 個以上的範例 |
| 平衡 (Balance) | 約 50/50 的通過/失敗比例 |
| 準確率 (Accuracy) | >80% |
| TPR/TNR | 皆 >70% |

## 指標 (Metrics)

| 指標 | 公式 | 何時使用 |
| ------ | ------- | -------- |
| **準確率 (Accuracy)** | (TP+TN) / 總數 | 一般情況 |
| **TPR (召回率/Recall)** | TP / (TP+FN) | 品質保證 (Quality assurance) |
| **TNR (特異度/Specificity)** | TN / (TN+FP) | 安全至上 (Safety-critical) |
| **Cohen's Kappa** | 超出隨機機率的一致性 | 比較多個評估器 |

## 快速驗證 (Quick Validation)

```python
from sklearn.metrics import classification_report, confusion_matrix, cohen_kappa_score

print(classification_report(human_labels, evaluator_predictions))
print(f"Kappa: {cohen_kappa_score(human_labels, evaluator_predictions):.3f}")

# 取得 TPR/TNR
cm = confusion_matrix(human_labels, evaluator_predictions)
tn, fp, fn, tp = cm.ravel()
tpr = tp / (tp + fn)
tnr = tn / (tn + fp)
```

## 黃金資料集結構 (Golden Dataset Structure)

```python
golden_example = {
    "input": "法國的首都是哪裡？",
    "output": "巴黎是首都。",
    "ground_truth_label": "correct",
}
```

## 建立黃金資料集 (Building Golden Datasets)

1. 抽樣生產追蹤 (包含錯誤、負面回饋、邊緣案例)
2. 保持約 50/50 的通過/失敗平衡
3. 由專家標記每個範例
4. 對資料集進行版本控制（永不修改現有資料集）

```python
# 好 (GOOD) - 建立新版本
golden_v2 = golden_v1 + [new_examples]

# 差 (BAD) - 永不修改現有版本
golden_v1.append(new_example)
```

## 警訊 (Warning Signs)

- 全數通過或全數失敗 → 過於寬鬆/嚴格
- 結果隨機 → 準則 (criteria) 不明確
- TPR/TNR < 70% → 需要改進

## 下列情況請重新驗證

- 提示範本 (Prompt template) 變更
- 裁判模型變更
- 準則變更
- 每月定期檢查
