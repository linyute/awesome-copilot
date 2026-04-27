# 架構模式 — 後端系統、組態、傳輸、CLI

## 目錄
1. [後端系統 (外掛程式/策略模式)](#1-後端系統-外掛程式策略模式)
2. [組態層 (Settings 資料類別)](#2-組態層-settings-資料類別)
3. [傳輸層 (HTTP 用戶端抽象)](#3-傳輸層-http-用戶端抽象)
4. [CLI 支援](#4-cli-支援)
5. [核心用戶端中的後端注入](#5-核心用戶端中的後端注入)
6. [決策規則](#6-決策規則)

---

## 1. 後端系統 (外掛程式/策略模式)

將您的 `backends/` 子套件結構化，使其具有明確的基礎協定、零相依性的預設實作，以及位於 extras 後方的選用沉重實作。

### 目錄配置

```
your_package/
  backends/
    __init__.py    # 匯出 BaseBackend + 工廠；保存協定 (Protocol)/ABC
    base.py        # 抽象基底類別 (ABC) 或協定定義
    memory.py      # 預設、零相依性的記憶體內 (in-memory) 實作
    redis.py       # 選用的、較重的實作 (由 extras 保護)
```

### `backends/base.py` — 抽象介面

```python
# your_package/backends/base.py
from __future__ import annotations

from abc import ABC, abstractmethod


class BaseBackend(ABC):
    """抽象儲存/處理後端。

    所有具體後端必須實作這些方法。
    切勿在模組層級匯入沉重的相依項 — 請在類別內部進行保護。
    """

    @abstractmethod
    def get(self, key: str) -> str | None:
        """根據鍵 (key) 擷取數值。當鍵不存在時回傳 None。"""
        ...

    @abstractmethod
    def set(self, key: str, value: str, ttl: int | None = None) -> None:
        """儲存帶有選用 TTL (秒) 的數值。"""
        ...

    @abstractmethod
    def delete(self, key: str) -> None:
        """移除鍵。當鍵不存在時不執行任何操作。"""
        ...

    def close(self) -> None:  # noqa: B027  (刻意非抽象)
        """選用的清理掛鉤 (hook)。在持有連線的後端中覆寫此方法。"""
```

### `backends/memory.py` — 預設零相依性實作

```python
# your_package/backends/memory.py
from __future__ import annotations

import time
from collections.abc import Iterator
from contextlib import contextmanager
from threading import Lock

from .base import BaseBackend


class MemoryBackend(BaseBackend):
    """執行緒安全的記憶體內後端。不需要外部相依項。"""

    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float | None]] = {}
        self._lock = Lock()

    def get(self, key: str) -> str | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if expires_at is not None and time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: str, ttl: int | None = None) -> None:
        expires_at = time.monotonic() + ttl if ttl is not None else None
        with self._lock:
            self._store[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)
```

### `backends/redis.py` — 選用的沉重實作

```python
# your_package/backends/redis.py
from __future__ import annotations

from .base import BaseBackend


class RedisBackend(BaseBackend):
    """Redis 支援的實作。需要：pip install your-package[redis]"""

    def __init__(self, url: str = "redis://localhost:6379/0") -> None:
        try:
            import redis as _redis
        except ImportError as exc:
            raise ImportError(
                "RedisBackend 需要 redis。"
                "請使用以下指令安裝：pip install your-package[redis]"
            ) from exc
        self._client = _redis.from_url(url, decode_responses=True)

    def get(self, key: str) -> str | None:
        return self._client.get(key)  # type: ignore[return-value]

    def set(self, key: str, value: str, ttl: int | None = None) -> None:
        if ttl is not None:
            self._client.setex(key, ttl, value)
        else:
            self._client.set(key, value)

    def delete(self, key: str) -> None:
        self._client.delete(key)

    def close(self) -> None:
        self._client.close()
```

### `backends/__init__.py` — 公用 API + 工廠

```python
# your_package/backends/__init__.py
from __future__ import annotations

from .base import BaseBackend
from .memory import MemoryBackend

__all__ = ["BaseBackend", "MemoryBackend", "get_backend"]


def get_backend(backend_type: str = "memory", **kwargs: object) -> BaseBackend:
    """工廠：回傳請求的後端執行個體。

    引數：
        backend_type: "memory" (預設) 或 "redis"。
        **kwargs: 轉發至後端建構函式。
    """
    if backend_type == "memory":
        return MemoryBackend()
    if backend_type == "redis":
        from .redis import RedisBackend  # 延遲匯入 — redis 是選用的
        return RedisBackend(**kwargs)  # type: ignore[arg-type]
    raise ValueError(f"不明的後端類型：{backend_type!r}")
```

---

## 2. 組態層 (Settings 資料類別)

將所有執行階段組態集中在一個 `config.py` 模組中。避免在整個程式碼庫中散布魔法值 (magic values) 和 `os.environ` 呼叫。

### `config.py`

```python
# your_package/config.py
from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    """您套件的所有執行階段組態。

    屬性：
        api_key: 驗證憑證。切勿記錄或洩露此資訊。
        timeout: HTTP 請求逾時 (秒)。
        retries: 發生暫時性失敗時的最大重試次數。
        base_url: API 基礎網址。在測試中使用本機伺服器覆寫此值。
    """

    api_key: str
    timeout: int = 30
    retries: int = 3
    base_url: str = "https://api.example.com/v1"

    def __post_init__(self) -> None:
        if not self.api_key:
            raise ValueError("api_key 不得為空")
        if self.timeout < 1:
            raise ValueError("timeout 必須 >= 1")
        if self.retries < 0:
            raise ValueError("retries 必須 >= 0")

    @classmethod
    def from_env(cls) -> "Settings":
        """從環境變數建構 Settings。

        必要的環境變數：YOUR_PACKAGE_API_KEY
        選用的環境變數：YOUR_PACKAGE_TIMEOUT, YOUR_PACKAGE_RETRIES
        """
        api_key = os.environ.get("YOUR_PACKAGE_API_KEY", "")
        timeout = int(os.environ.get("YOUR_PACKAGE_TIMEOUT", "30"))
        retries = int(os.environ.get("YOUR_PACKAGE_RETRIES", "3"))
        return cls(api_key=api_key, timeout=timeout, retries=retries)
```

### 使用 Pydantic (選用，適用於大型專案)

```python
# your_package/config.py  — Pydantic v2 變體
from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = Field(..., min_length=1)
    timeout: int = Field(30, ge=1)
    retries: int = Field(3, ge=0)
    base_url: str = "https://api.example.com/v1"

    model_config = {"env_prefix": "YOUR_PACKAGE_"}
```

---

## 3. 傳輸層 (HTTP 用戶端抽象)

將所有 HTTP 關注點 — 標頭、重試、逾時、錯誤解析 — 隔離在專用的 `transport/` 子套件中。核心用戶端依賴於傳輸抽象，而非直接依賴 `httpx` 或 `requests`。

### 目錄配置

```
your_package/
  transport/
    __init__.py    # 重新匯出 HttpTransport
    http.py        # 基於 httpx 的具體傳輸
```

### `transport/http.py`

```python
# your_package/transport/http.py
from __future__ import annotations

from typing import Any

import httpx

from ..config import Settings
from ..exceptions import YourPackageError, RateLimitError, AuthenticationError


class HttpTransport:
    """集中處理驗證、重試和錯誤對應的薄層 httpx 包裝器。"""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.Client(
            base_url=settings.base_url,
            timeout=settings.timeout,
            headers={"Authorization": f"Bearer {settings.api_key}"},
        )

    def request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """發送 HTTP 請求並回傳解析後的 JSON 本體。

        引發：
            AuthenticationError: 遇到 401。
            RateLimitError: 遇到 429。
            YourPackageError: 遇到所有其他非 2xx 回應。
        """
        response = self._client.request(method, path, json=json, params=params)
        self._raise_for_status(response)
        return response.json()

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code == 401:
            raise AuthenticationError("無效或過期的 API 金鑰。")
        if response.status_code == 429:
            raise RateLimitError("已超過速率限制。請稍後再試。")
        if response.is_error:
            raise YourPackageError(
                f"API 錯誤 {response.status_code}：{response.text[:200]}"
            )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "HttpTransport":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
```

### 非同步變體

```python
# your_package/transport/async_http.py
from __future__ import annotations

from typing import Any

import httpx

from ..config import Settings
from ..exceptions import YourPackageError, RateLimitError, AuthenticationError


class AsyncHttpTransport:
    """非同步 httpx 包裝器。請搭配 `async with AsyncHttpTransport(...) as t:` 使用。"""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.base_url,
            timeout=settings.timeout,
            headers={"Authorization": f"Bearer {settings.api_key}"},
        )

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        response = await self._client.request(method, path, json=json, params=params)
        self._raise_for_status(response)
        return response.json()

    def _raise_for_status(self, response: httpx.Response) -> None:
        if response.status_code == 401:
            raise AuthenticationError("無效或過期的 API 金鑰。")
        if response.status_code == 429:
            raise RateLimitError("已超過速率限制。請稍後再試。")
        if response.is_error:
            raise YourPackageError(
                f"API 錯誤 {response.status_code}：{response.text[:200]}"
            )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "AsyncHttpTransport":
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.aclose()
```

---

## 4. CLI 支援

透過 `pyproject.toml` 中的 `[project.scripts]` 新增 CLI 進入點。

### `pyproject.toml` 項目

```toml
[project.scripts]
your-cli = "your_package.cli:main"
```

安裝後，使用者可以從終端機直接執行 `your-cli --help`。

### `cli.py` — 使用 Click

```python
# your_package/cli.py
from __future__ import annotations

import sys

import click

from .config import Settings
from .core import YourClient


@click.group()
@click.version_option()
def main() -> None:
    """your-package CLI — 從命令列與 API 互動。"""


@main.command()
@click.option("--api-key", envvar="YOUR_PACKAGE_API_KEY", required=True, help="API 金鑰。")
@click.option("--timeout", default=30, show_default=True, help="請求逾時 (秒)。")
@click.argument("query")
def search(api_key: str, timeout: int, query: str) -> None:
    """搜尋 API 並列印結果。"""
    settings = Settings(api_key=api_key, timeout=timeout)
    client = YourClient(settings=settings)
    try:
        results = client.search(query)
        for item in results:
            click.echo(item)
    except Exception as exc:
        click.echo(f"錯誤：{exc}", err=True)
        sys.exit(1)
```

### `cli.py` — 使用 Typer (現代替代方案)

```python
# your_package/cli.py
from __future__ import annotations

import typer

from .config import Settings
from .core import YourClient

app = typer.Typer(help="your-package CLI。")


@app.command()
def search(
    query: str = typer.Argument(..., help="搜尋查詢。"),
    api_key: str = typer.Option(..., envvar="YOUR_PACKAGE_API_KEY"),
    timeout: int = typer.Option(30, help="請求逾時 (秒)。"),
) -> None:
    """搜尋 API 並列印結果。"""
    settings = Settings(api_key=api_key, timeout=timeout)
    client = YourClient(settings=settings)
    results = client.search(query)
    for item in results:
        typer.echo(item)


def main() -> None:
    app()
```

---

## 5. 核心用戶端中的後端注入

**關鍵：** 始終接受 `backend` 作為建構函式引數。切勿在建構函式內部實例化後端而沒有回退 (fallback) 參數 — 這會使測試變得不可能。

```python
# your_package/core.py
from __future__ import annotations

from .backends.base import BaseBackend
from .backends.memory import MemoryBackend
from .config import Settings


class YourClient:
    """主要用戶端。接受注入的後端以利於測試。

    引數：
        settings: 解析後的組態。在生產環境中使用 Settings.from_env()。
        backend:  儲存/處理後端。當為 None 時預設為 MemoryBackend。
        timeout:  已棄用 — 請改為傳遞 Settings 物件。
        retries:  已棄用 — 請改為傳遞 Settings 物件。
    """

    def __init__(
        self,
        api_key: str | None = None,
        *,
        settings: Settings | None = None,
        backend: BaseBackend | None = None,
        timeout: int = 30,
        retries: int = 3,
    ) -> None:
        if settings is None:
            if api_key is None:
                raise ValueError("請提供 'api_key' 或 'settings'。")
            settings = Settings(api_key=api_key, timeout=timeout, retries=retries)
        self._settings = settings
        # 正確 — 預設為注入，而非寫死
        self.backend: BaseBackend = backend if backend is not None else MemoryBackend()

    # ... 方法
```

### 反模式 — 切勿這樣做

```python
# 錯誤：將後端寫死；在測試中無法替換
class YourClient:
    def __init__(self, api_key: str) -> None:
        self.backend = MemoryBackend()          # ← 無法注入

# 錯誤：在匯入中寫死套件名稱字面量
from your_package.backends.memory import MemoryBackend   # 僅在 your_package 本身中可行
# 在套件內部使用相對匯入：
from .backends.memory import MemoryBackend               # ← 正確
```

---

## 6. 決策規則

```
套件是否與外部狀態 (快取、資料庫、佇列) 互動？
├── 是 → 新增 backends/ 並包含 BaseBackend + MemoryBackend
│         將選用的沉重後端放在 extras_require 之後
│
└── 否 → 完全跳過 backends/；保持 core.py 簡潔

套件是否呼叫外部 HTTP API？
├── 是 → 新增 transport/http.py；透過 Settings 注入
│
└── 否 → 跳過 transport/

套件是否需要命令列介面？
├── 是，簡單 (1–3 個指令) → 使用 argparse 或 click
│   在 pyproject.toml 中新增 [project.scripts]
│
├── 是，複雜 (子指令、外掛程式) → 使用 click 或 typer
│
└── 否 → 跳過 cli.py

執行階段行為是否取決於使用者提供的組態？
├── 是 → 新增包含 Settings 資料類別的 config.py
│   公開 Settings.from_env() 供生產環境使用
│
└── 否 → 直接在建構函式中接受參數
```
