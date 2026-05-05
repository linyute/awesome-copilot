# 驗證 (Validation)

在部署前，針對人工標籤驗證 LLM 評審。目標是達成 >80% 的一致性。

## 需求 (Requirements)

| 需求 | 目標 |
| ----------- | ------ |
| 測試集大小 | 100 個以上的範例 |
| 平衡性 | 通過/失敗各約 50/50 |
| 準確度 (Accuracy) | >80% |
| TPR/TNR | 皆需 >70% |

## 指標 (Metrics)

| 指標 | 公式 | 何時使用 |
| ------ | ------- | -------- |
| **準確度 (Accuracy)** | (TP+TN) / 總數 | 通用 |
| **TPR (召回率 Recall)** | TP / (TP+FN) | 品質保證 |
| **TNR (特異度 Specificity)** | TN / (TN+FP) | 安全至上 (Safety-critical) |
| **Cohen's Kappa** | 超越隨機機率的一致性 | 比較評估者時 |

## 快速驗證 (Quick Validation)

```python
from sklearn.metrics import classification_report, confusion_matrix, cohen_kappa_score

print(classification_report(human_labels, evaluator_predictions))
print(f"Kappa: {cohen_kappa_score(human_labels, evaluator_predictions):.3f}")

# 獲取 TPR/TNR
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

1. 對生產環境追蹤進行採樣（錯誤、負面回饋、邊緣案例）。
2. 平衡通過/失敗範例，比例約各佔 50%。
3. 由專家為每個範例加上標籤。
4. 進行資料集版本管理（絕不修改現有的資料集）。

```python
# 良好做法 - 建立新版本
golden_v2 = golden_v1 + [new_examples]

# 錯誤做法 - 絕不修改現有內容
golden_v1.append(new_example)
```

## 警示訊號 (Warning Signs)

- 全部通過或全部失敗 → 過於寬鬆/嚴格。
- 結果隨機 → 標準不明確。
- TPR/TNR < 70% → 需要改進。

## 何時需要重新驗證 (Re-Validate When)

- 提示詞範本變更。
- 評審模型變更。
- 標準變更。
- 每個月定期執行。
