# Runnable 範例：FastAPI / 網頁伺服器

**當應用程式是一個網頁伺服器** (FastAPI, Flask, Starlette) 且你需要測試完整的 HTTP 請求管線時。

**方法**：使用 `httpx.AsyncClient` 配合 `ASGITransport` 以行程內 (In-process) 方式執行 ASGI 應用程式。這是最快且最可靠的方法 — 無需子行程，也無需連接埠管理。

```python
# pixie_qa/run_app.py
import httpx
from pydantic import BaseModel
import pixie


class AppArgs(BaseModel):
    user_message: str


class AppRunnable(pixie.Runnable[AppArgs]):
    """透過行程內 ASGI 傳輸驅動 FastAPI 應用程式。"""

    _client: httpx.AsyncClient

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def setup(self) -> None:
        from myapp.main import app  # 你的 FastAPI/Starlette 應用程式執行個體

        transport = httpx.ASGITransport(app=app)
        self._client = httpx.AsyncClient(transport=transport, base_url="http://test")

    async def run(self, args: AppArgs) -> None:
        await self._client.post("/chat", json={"message": args.user_message})

    async def teardown(self) -> None:
        await self._client.aclose()
```

## ASGITransport 會跳過生命週期事件

`httpx.ASGITransport` **不會**觸發 ASGI 生命週期事件 (`startup` / `shutdown`)。如果應用程式在其生命週期中初始化資源（資料庫連線、快取、服務客戶端），你必須在 `setup()` 中手動複製該初始化過程：

```python
async def setup(self) -> None:
    # 手動複製應用程式生命週期所執行的操作
    from myapp.db import get_connection, init_db, seed_data
    import myapp.main as app_module

    conn = get_connection()
    init_db(conn)
    seed_data(conn)
    app_module.db_conn = conn  # 設定應用程式預期的模組級全域變數

    transport = httpx.ASGITransport(app=app_module.app)
    self._client = httpx.AsyncClient(transport=transport, base_url="http://test")

async def teardown(self) -> None:
    await self._client.aclose()
    # 清理手動初始化的資源
    import myapp.main as app_module
    if hasattr(app_module, "db_conn") and app_module.db_conn:
        app_module.db_conn.close()
```

## 具備共享可變狀態的並行處理

如果應用程式使用共享的可變狀態（記憶體內 SQLite、基於檔案的資料庫、全域快取），請增加一個信號量 (Semaphore) 以序列化存取：

```python
import asyncio

class AppRunnable(pixie.Runnable[AppArgs]):
    _client: httpx.AsyncClient
    _sem: asyncio.Semaphore

    @classmethod
    def create(cls) -> "AppRunnable":
        inst = cls()
        inst._sem = asyncio.Semaphore(1)
        return inst

    async def setup(self) -> None:
        from myapp.main import app
        transport = httpx.ASGITransport(app=app)
        self._client = httpx.AsyncClient(transport=transport, base_url="http://test")

    async def run(self, args: AppArgs) -> None:
        async with self._sem:
            await self._client.post("/chat", json={"message": args.user_message})

    async def teardown(self) -> None:
        await self._client.aclose()
```

僅在需要時使用信號量 — 如果應用程式使用按唯一 ID（如 call_sid, session_id）索引的每對話階段狀態，則並行呼叫會自然隔離，不需要加鎖。

## 替代方案：使用 httpx 連接外部伺服器

當應用程式無法直接匯入時（例如：複雜的啟動流程、`__main__` 中的 `uvicorn.run()`），請將其作為子行程啟動並透過 HTTP 存取：

```python
class AppRunnable(pixie.Runnable[AppArgs]):
    _client: httpx.AsyncClient

    @classmethod
    def create(cls) -> "AppRunnable":
        return cls()

    async def setup(self) -> None:
        # 假設伺服器已在執行（透過 run-with-timeout.sh 啟動）
        self._client = httpx.AsyncClient(base_url="http://localhost:8000")

    async def run(self, args: AppArgs) -> None:
        await self._client.post("/chat", json={"message": args.user_message})

    async def teardown(self) -> None:
        await self._client.aclose()
```

在執行 `pixie trace` 或 `pixie test` 之前啟動伺服器：

```bash
bash resources/run-with-timeout.sh 120 uv run python -m myapp.server
sleep 3  # 等待就緒
```
