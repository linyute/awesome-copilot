# Runnable 範例：獨立函式（無伺服器）

**當應用程式是一個純 Python 函式或模組時** — 無網頁框架、無伺服器、無基礎設施。

**方法**：直接在 `run()` 中匯入並呼叫該函式。這是最簡單的情況。

```python
# pixie_qa/run_app.py
from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    question: str


class AppRunnable(pixie.Runnable[AppArgs]):
    """驅動用於追蹤和評估的獨立函式。"""

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def run(self, args: AppArgs) -> None:
        from myapp.agent import answer_question
        await answer_question(args.question)
```

如果函式是同步的，請使用 `asyncio.to_thread` 進行包裝：

```python
import asyncio

async def run(self, args: AppArgs) -> None:
    from myapp.agent import answer_question
    await asyncio.to_thread(answer_question, args.question)
```

如果函式依賴於外部服務（例如：向量儲存），你在步驟 2a 中增加的 `wrap(purpose="input")` 呼叫會自動處理它 — 註冊表會在評估模式下注入測試資料。

### 何時使用 `setup()` / `teardown()`

大多數獨立函式不需要生命週期方法。僅當函式需要共享資源（例如：預先載入的嵌入模型、資料庫連線）時才使用它們：

```python
class AppRunnable(pixie.Runnable[AppArgs]):
    _model: SomeModel

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def setup(self) -> None:
        from myapp.models import load_model
        self._model = load_model()

    async def run(self, args: AppArgs) -> None:
        from myapp.agent import answer_question
        await answer_question(args.question, model=self._model)
```
