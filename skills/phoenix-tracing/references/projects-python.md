# Phoenix 追蹤：專案 (Python) (Phoenix Tracing: Projects (Python))

**使用專案 (Projects)（Phoenix 的頂層分組方式）來依應用程式組織追蹤。**

## 概觀 (Overview)

專案將單一應用程式或實驗的追蹤分組。

**用於：** 環境（開發/測試/生產）、A/B 測試、版本控制

## 設定 (Setup)

### 環境變數（建議做法） (Environment Variable (Recommended))

```bash
export PHOENIX_PROJECT_NAME="my-app-prod"
```

```python
import os
os.environ["PHOENIX_PROJECT_NAME"] = "my-app-prod"
from phoenix.otel import register
register()  # 使用 "my-app-prod"
```

### 程式碼 (Code)

```python
from phoenix.otel import register
register(project_name="my-app-prod")
```

## 使用案例 (Use Cases)

**環境：**

```python
# 開發、測試、生產
register(project_name="my-app-dev")
register(project_name="my-app-staging")
register(project_name="my-app-prod")
```

**A/B 測試：**

```python
# 比較模型
register(project_name="chatbot-gpt4")
register(project_name="chatbot-claude")
```

**版本控制：**

```python
# 追蹤版本
register(project_name="my-app-v1")
register(project_name="my-app-v2")
```

## 切換專案（僅限 Python Notebook） (Switching Projects (Python Notebooks Only))

```python
from openinference.instrumentation import dangerously_using_project
from phoenix.otel import register

register(project_name="my-app")

# 暫時切換以進行評估
with dangerously_using_project("my-eval-project"):
    run_evaluations()
```

**⚠️ 僅在 Notebook/腳本中使用，請勿用於生產環境。**
