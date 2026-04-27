# Phoenix 追蹤：專案 (Projects) (Python)

**使用專案 (Projects)（Phoenix 的最上層分組）按應用程式組織追蹤。**

## 總覽 (Overview)

專案 (Projects) 會將單一應用程式或實驗的追蹤進行分組。

**適用於：** 環境（開發/預發佈/生產）、A/B 測試、版本控制

## 設定 (Setup)

### 環境變數 (建議使用) (Environment Variable)

```bash
export PHOENIX_PROJECT_NAME="my-app-prod"
```

```python
import os
os.environ["PHOENIX_PROJECT_NAME"] = "my-app-prod"
from phoenix.otel import register
register()  # 使用 "my-app-prod"
```

### 程式碼

```python
from phoenix.otel import register
register(project_name="my-app-prod")
```

## 使用案例 (Use Cases)

**環境 (Environments)：**

```python
# 開發 (dev)、預發佈 (staging)、生產 (prod)
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

## 切換專案 (僅限 Python 筆記本/Notebooks)

```python
from openinference.instrumentation import dangerously_using_project
from phoenix.otel import register

register(project_name="my-app")

# 暫時切換以進行評估 (evals)
with dangerously_using_project("my-eval-project"):
    run_evaluations()
```

**⚠️ 僅在筆記本 (notebooks)/指令稿 (scripts) 中使用，請勿用於生產環境。**
