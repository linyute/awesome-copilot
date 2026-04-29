# Runnable 範例：CLI 應用程式

**當應用程式是從命令列叫用時** (例如：`python -m myapp`，一個使用 argparse/click 的 CLI 工具)。

**方法**：使用 `asyncio.create_subprocess_exec` 叫用 CLI 並擷取輸出。

```python
# pixie_qa/run_app.py
import asyncio
import sys

from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    query: str


class AppRunnable(pixie.Runnable[AppArgs]):
    """透過子行程驅動 CLI 應用程式。"""

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def run(self, args: AppArgs) -> None:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "myapp", "--query", args.query,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        if proc.returncode != 0:
            raise RuntimeError(f"應用程式失敗 (結束代碼 {proc.returncode})：{stderr.decode()}")
```

## 當 CLI 需要修補相依性時

如果 CLI 從外部服務讀取資料，請建立一個包裝器入口點，在執行真實 CLI 之前修補 (Patch) 相依性：

```python
# pixie_qa/patched_app.py
"""在執行真實 CLI 之前修補外部相依性的入口點。"""
import myapp.config as config
config.redis_url = "mock://localhost"

from myapp.main import main
main()
```

然後將你的 Runnable 指向該包裝器：

```python
async def run(self, args: AppArgs) -> None:
    proc = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "pixie_qa.patched_app", "--query", args.query,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
```

**註記**：對於 CLI 應用程式，`wrap(purpose="input")` 注入僅在應用程式於同一個行程中執行時有效。如果使用子行程，你可能需要透過環境變數或設定檔來傳遞測試資料。
