# 設定：Python (Setup)

執行 Phoenix 評估與實驗所需的套件 (Packages)。

## 安裝 (Installation)

```bash
# 核心 Phoenix 套件 (包含 client、evals、otel)
pip install arize-phoenix

# 或安裝個別套件
pip install arize-phoenix-client   # 僅限 Phoenix client
pip install arize-phoenix-evals    # 評估公用程式
pip install arize-phoenix-otel     # OpenTelemetry 整合
```

## LLM 供應商 (LLM Providers)

對於 LLM 作為裁判 (LLM-as-judge) 的評估器，請安裝供應商的 SDK：

```bash
pip install openai      # OpenAI
pip install anthropic   # Anthropic
pip install google-generativeai  # Google
```

## 驗證 (選用) (Validation)

```bash
pip install scikit-learn  # 用於 TPR/TNR 指標
```

## 快速驗證 (Quick Verify)

```python
from phoenix.client import Client
from phoenix.evals import LLM, ClassificationEvaluator
from phoenix.otel import register

# 所有匯入都應能正常運作
print("Phoenix Python 設定完成")
```

## 關鍵匯入項目 (Evals 2.0)

```python
from phoenix.client import Client
from phoenix.evals import (
    ClassificationEvaluator,      # LLM 分類評估器 (建議優先使用)
    LLM,                          # 與供應商無關的 LLM 包裝器
    async_evaluate_dataframe,     # 批次評估 DataFrame (建議優先使用，非同步)
    evaluate_dataframe,           # 批次評估 DataFrame (同步)
    create_evaluator,             # 用於程式碼評估器的裝飾器
    create_classifier,            # 用於 LLM 分類評估器的工廠
    bind_evaluator,               # 將欄位名稱映射至評估器參數
    Score,                        # 分數資料類別 (dataclass)
)
from phoenix.evals.utils import to_annotation_dataframe  # 將結果格式化為 Phoenix annotations
```

**建議優先使用**：`ClassificationEvaluator` 優於 `create_classifier`（提供更多參數/客製化）。
**建議優先使用**：`async_evaluate_dataframe` 優於 `evaluate_dataframe`（對於 LLM 評估有更好的吞吐量）。

**請勿使用**舊版 (legacy) 1.0 的匯入項目：`OpenAIModel`、`AnthropicModel`、`run_evals`、`llm_classify`。
