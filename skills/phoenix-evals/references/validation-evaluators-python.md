# 驗證評估者 (Python) (Validating Evaluators (Python))

針對人工標註的範例驗證 LLM 評估者。目標是達成 >80% 的 TPR/TNR/準確度。

## 計算指標 (Calculate Metrics)

```python
from sklearn.metrics import classification_report, confusion_matrix

print(classification_report(human_labels, evaluator_predictions))

cm = confusion_matrix(human_labels, evaluator_predictions)
tn, fp, fn, tp = cm.ravel()
tpr = tp / (tp + fn)
tnr = tn / (tn + fp)
print(f"TPR: {tpr:.2f}, TNR: {tnr:.2f}")
```

## 修正生產環境估計值 (Correct Production Estimates)

```python
def correct_estimate(observed, tpr, tnr):
    """使用已知的 TPR/TNR 調整觀察到的通過率。"""
    return (observed - (1 - tnr)) / (tpr - (1 - tnr))
```

## 尋找誤判案例 (Find Misclassified)

```python
# 偽陽性 (False Positives)：評估者判定通過，人工判定失敗
fp_mask = (evaluator_predictions == 1) & (human_labels == 0)
false_positives = dataset[fp_mask]

# 偽陰性 (False Negatives)：評估者判定失敗，人工判定通過
fn_mask = (evaluator_predictions == 0) & (human_labels == 1)
false_negatives = dataset[fn_mask]
```

## 警示 (Red Flags)

- TPR 或 TNR < 70%
- TPR 與 TNR 之間存在巨大差距
- Kappa < 0.6
