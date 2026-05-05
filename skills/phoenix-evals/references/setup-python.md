# 設定：Python (Setup: Python)

Phoenix 評估與實驗所需的套件。

## 安裝 (Installation)

```bash
# 核心 Phoenix 套件（包含用戶端、評估、otel）
pip install arize-phoenix

# 或安裝個別套件
pip install arize-phoenix-client   # 僅限 Phoenix 用戶端
pip install arize-phoenix-evals    # 評估公用程式
pip install arize-phoenix-otel     # OpenTelemetry 整合
```

## LLM 提供者 (LLM Providers)

針對 LLM-as-judge 評估者，請安裝提供者的 SDK：

```bash
pip install openai      # OpenAI
pip install anthropic   # Anthropic
pip install google-generativeai  # Google
```

## 驗證（選填） (Validation (Optional))

```bash
pip install scikit-learn  # 用於 TPR/TNR 指標
```

## 快速驗證 (Quick Verify)

```python
from phoenix.client import Client
from phoenix.evals import LLM, ClassificationEvaluator
from phoenix.otel import register

# 所有匯入都應正常運作
print("Phoenix Python 設定完成")
```

## 關鍵匯入 (評估 2.0) (Key Imports (Evals 2.0))

```python
from phoenix.client import Client
from phoenix.evals import (
    ClassificationEvaluator,      # LLM 分類評估者（優先建議）
    LLM,                          # 與提供者無關的 LLM 包裝器
    async_evaluate_dataframe,     # 批次評估 DataFrame（優先建議，非同步）
    evaluate_dataframe,           # 批次評估 DataFrame（同步）
    create_evaluator,             # 程式碼評估者的裝飾器
    create_classifier,            # LLM 分類評估者的工廠
    bind_evaluator,               # 將資料欄名稱映射至評估者參數
    Score,                        # 分數資料類別 (Score dataclass)
)
from phoenix.evals.utils import to_annotation_dataframe  # 將結果格式化為 Phoenix 標核
```

**優先建議**：使用 `ClassificationEvaluator` 而非 `create_classifier`（具備更多參數/自訂選項）。
**優先建議**：使用 `async_evaluate_dataframe` 而非 `evaluate_dataframe`（針對 LLM 評估有更好的輸送量）。

**請勿使用** 舊版 1.0 匯入：`OpenAIModel`, `AnthropicModel`, `run_evals`, `llm_classify`。
