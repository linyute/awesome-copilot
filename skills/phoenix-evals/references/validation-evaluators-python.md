# 驗證評估器 (Python) (Validating Evaluators)

針對人類標記範例驗證 LLM 評估器。目標為 >80% 的 TPR/TNR/準確率 (Accuracy)。

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

## 修正生產估計 (Correct Production Estimates)

```python
def correct_estimate(observed, tpr, tnr):
    """使用已知的 TPR/TNR 調整觀察到的通過率 (observed pass rate)。"""
    return (observed - (1 - tnr)) / (tpr - (1 - tnr))
```

## 尋找分類錯誤 (Find Misclassified)

```python
# 偽陽性 (False Positives)：評估器通過，但人類標記為失敗
fp_mask = (evaluator_predictions == 1) & (human_labels == 0)
false_positives = dataset[fp_mask]

# 偽陰性 (False Negatives)：評估器失敗，但人類標記為通過
fn_mask = (evaluator_predictions == 0) & (human_labels == 1)
false_negatives = dataset[fn_mask]
```

## 警訊 (Red Flags)

- TPR 或 TNR < 70%
- TPR 與 TNR 之間存在巨大差距
- Kappa < 0.6
