# 函式庫核心模式、OOP/SOLID 與型別提示 (Type Hints)

## 目錄
1. [OOP 與 SOLID 原則](#1-oop--solid-原則)
2. [型別提示最佳實作](#2-型別提示最佳實作)
3. [核心類別設計](#3-核心類別設計)
4. [工廠 / 產生器 (Builder) 模式](#4-工廠--產生器-builder-模式)
5. [組態模式](#5-組態模式)
6. [`__init__.py` — 明確的公用 API](#6-__init__py--明確的公用-api)
7. [選用後端 (外掛程式模式)](#7-選用後端-外掛程式模式)

---

## 1. OOP 與 SOLID 原則

套用這些原則以產出具備可維護性、可測試性與可擴充性的套件。
**請勿過度工程 (over-engineer)** — 應套用能解決實際問題的原則，而非一次套用所有原則。

### S — 單一職責原則 (Single Responsibility Principle)

每個類別/模組應該只有**一個改變的原因**。

```python
# 錯誤範例：一個類別同時處理資料、驗證與持久化
class UserManager:
    def validate(self, user): ...
    def save_to_db(self, user): ...
    def send_email(self, user): ...

# 正確範例：拆分職責
class UserValidator:
    def validate(self, user: User) -> None: ...

class UserRepository:
    def save(self, user: User) -> None: ...

class UserNotifier:
    def notify(self, user: User) -> None: ...
```

### O — 開放/封閉原則 (Open/Closed Principle)

對擴充開放，對修改封閉。使用 **協定 (protocols) 或 ABCs** 作為擴充點。

```python
from abc import ABC, abstractmethod

class StorageBackend(ABC):
    """定義介面一次；永遠不要為了新實作而修改它。"""
    @abstractmethod
    def get(self, key: str) -> str | None: ...
    @abstractmethod
    def set(self, key: str, value: str) -> None: ...

class MemoryBackend(StorageBackend):    # 透過子類別化進行擴充
    ...

class RedisBackend(StorageBackend):     # 新增實作而不需更動 StorageBackend
    ...
```

### L — 里氏替換原則 (Liskov Substitution Principle)

子類別必須能替換其基底類別。切勿在子類別中縮小合約範圍。

```python
class BaseProcessor:
    def process(self, data: dict) -> dict: ...

# 錯誤範例：為有效的 dict 引發 TypeError — 破壞了可替換性
class StrictProcessor(BaseProcessor):
    def process(self, data: dict) -> dict:
        if not data:
            raise TypeError("必須包含資料")  # 基底類別從未引發此錯誤

# 正確範例：接受基底類別接受的內容，履行相同的合約
class StrictProcessor(BaseProcessor):
    def process(self, data: dict) -> dict:
        if not data:
            return {}   # 優雅處理 — 相同的回傳型別，無新增的例外
```

### I — 介面隔離原則 (Interface Segregation Principle)

優先使用**小而專注的協定**，而非大型且單一的 ABCs。

```python
# 錯誤範例：強制所有實作端處理 讀取+寫入+刪除+列出
class BigStorage(ABC):
    @abstractmethod
    def read(self): ...
    @abstractmethod
    def write(self): ...
    @abstractmethod
    def delete(self): ...
    @abstractmethod
    def list_all(self): ...   # 非每個後端都需要此功能

# 正確範例：分離協定 — 用戶端僅依賴其所需的內容
from typing import Protocol

class Readable(Protocol):
    def read(self, key: str) -> str | None: ...

class Writable(Protocol):
    def write(self, key: str, value: str) -> None: ...

class Deletable(Protocol):
    def delete(self, key: str) -> None: ...
```

### D — 依賴反轉原則 (Dependency Inversion Principle)

高階模組應依賴於**抽象** (協定/ABCs)，而非具體實作。
透過 `__init__` 傳遞相依項 (建構函式注入)。

```python
# 錯誤範例：高階類別建立其自身的相依項
class ApiClient:
    def __init__(self) -> None:
        self._cache = RedisCache()   # 與 Redis 強耦合

# 正確範例：依賴於抽象；在呼叫端注入具體實作
class ApiClient:
    def __init__(self, cache: CacheBackend) -> None:  # CacheBackend 是一個協定
        self._cache = cache

# 使用者程式碼 (或測試)：
client = ApiClient(cache=RedisCache())    # 實際使用
client = ApiClient(cache=MemoryCache())  # 測試使用
```

### 組合優於繼承 (Composition Over Inheritance)

優先考慮委派給包含的物件，而非使用深層的繼承鏈。

```python
# 優先考慮此做法 (組合)：
class YourClient:
    def __init__(self, backend: StorageBackend, http: HttpTransport) -> None:
        self._backend = backend
        self._http = http

# 避免此做法 (深層繼承)：
class YourClient(BaseClient, CacheMixin, RetryMixin, LoggingMixin):
    ...    # 脆弱、難以測試、MRO (方法解析順序) 混淆
```

### 例外層級

始終為您的套件定義一個基底例外；在其下方分層定義具體例外。

```python
# your_package/exceptions.py
class YourPackageError(Exception):
    """基底例外 — 捕捉此例外以擷取任何套件錯誤。"""

class ConfigurationError(YourPackageError):
    """當套件組態錯誤時引發。"""

class AuthenticationError(YourPackageError):
    """驗證失敗時引發。"""

class RateLimitError(YourPackageError):
    """超過速率限制時引發。"""
    def __init__(self, retry_after: int) -> None:
        self.retry_after = retry_after
        super().__init__(f"已達速率限制。請在 {retry_after} 秒後重試。")
```

---

## 2. 型別提示最佳實作

遵循 PEP 484 (型別提示)、PEP 526 (變數註釋)、PEP 544 (協定)、PEP 561 (型別化套件)。對於高品質函式庫，這些並非選用項。

```python
from __future__ import annotations    # 啟用 PEP 563 延遲評估 — 務必新增此行

# 針對 引數 (ARGUMENTS)：優先使用抽象 / 協定型別 (對呼叫者更具彈性)
from collections.abc import Iterable, Mapping, Sequence, Callable

def process_items(items: Iterable[str]) -> list[int]: ...   # ✓ 接受任何可反覆運算的物件
def process_items(items: list[str]) -> list[int]: ...       # ✗ 過於受限

# 針對 回傳型別 (RETURN TYPES)：優先使用具體型別 (呼叫者清楚知道會得到什麼)
def get_names() -> list[str]: ...                           # ✓ 具體
def get_names() -> Iterable[str]: ...                       # ✗ 呼叫者無法對其進行索引

# 使用 X | Y 語法 (Python 3.10+)，而非 Union[X, Y] 或 Optional[X]
def find(key: str) -> str | None: ...                       # ✓ 現代化
def find(key: str) -> Optional[str]: ...                    # ✗ 舊式風格

# None 應放在聯集 (unions) 的最後面
def get(key: str) -> str | int | None: ...                  # ✓

# 避免使用 Any — 它會完全停用型別檢查
def process(data: Any) -> Any: ...                          # ✗ 失去所有安全性
def process(data: dict[str, object]) -> dict[str, object]:  # ✓

# 當參數接受字面意義上的任何內容時，使用 object 取代 Any
def log(value: object) -> None: ...                         # ✓

# 避免 Union 回傳型別 — 它們要求呼叫者在每個呼叫處編寫 isinstance() 檢查
def get_value() -> str | int: ...                           # ✗ 強制呼叫者進行分支判斷
```

### 協定 (Protocols) vs ABCs

```python
from typing import Protocol, runtime_checkable
from abc import ABC, abstractmethod

# 當您無法控制實作端類別時，使用 Protocol (鴨子型別)
@runtime_checkable    # 使 isinstance() 檢查在執行階段運作
class Serializable(Protocol):
    def to_dict(self) -> dict[str, object]: ...

# 當您控制類別層級並想要提供預設實作時，使用 ABC
class BaseBackend(ABC):
    @abstractmethod
    async def get(self, key: str) -> str | None: ...

    def get_or_default(self, key: str, default: str) -> str:
        result = self.get(key)
        return result if result is not None else default
```

### TypeVar 與泛型 (Generics)

```python
from typing import TypeVar, Generic

T = TypeVar("T")
T_co = TypeVar("T_co", covariant=True)   # 用於唯讀容器

class Repository(Generic[T]):
    """型別安全的泛型儲存庫。"""
    def __init__(self, model_class: type[T]) -> None:
        self._store: list[T] = []

    def add(self, item: T) -> None:
        self._store.append(item)

    def get_all(self) -> list[T]:
        return list(self._store)
```

### 用於資料容器的 dataclasses

```python
from dataclasses import dataclass, field

@dataclass(frozen=True)   # frozen=True → 不可變、可雜湊 (適用於組態/金鑰)
class Config:
    api_key: str
    timeout: int = 30
    headers: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.api_key:
            raise ValueError("api_key 不得為空")
```

### TYPE_CHECKING 防護 (避免循環匯入)

```python
from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from your_package.models import HeavyModel    # 僅在型別檢查期間匯入

def process(model: "HeavyModel") -> None:
    ...
```

### 多個特徵標記 (Signatures) 的多載 (Overload)

```python
from typing import overload

@overload
def get(key: str, default: None = ...) -> str | None: ...
@overload
def get(key: str, default: str) -> str: ...
def get(key: str, default: str | None = None) -> str | None:
    ...    # 單一實作處理兩者
```

---

## 3. 核心類別設計

您函式庫的主類別應具有簡潔、最小化的 `__init__`、所有參數的合理預設值，並針對無效輸入及早引發 `TypeError` / `ValueError`。這可以防止在呼叫時（而非建構時）出現令人困惑的錯誤。

```python
# your_package/core.py
from __future__ import annotations

from your_package.exceptions import YourPackageError


class YourClient:
    """
    用於 <您的目的> 的主要進入點。

    引數：
        api_key: 必要的驗證憑證。
        timeout: 請求逾時 (秒)。預設為 30。
        retries: 重試嘗試次數。預設為 3。

    引發：
        ValueError: 如果 api_key 為空或 timeout 為非正數。

    範例：
        >>> from your_package import YourClient
        >>> client = YourClient(api_key="sk-...")
        >>> result = client.process(data)
    """

    def __init__(
        self,
        api_key: str,
        timeout: int = 30,
        retries: int = 3,
    ) -> None:
        if not api_key:
            raise ValueError("api_key 不得為空")
        if timeout <= 0:
            raise ValueError("timeout 必須為正數")
        self._api_key = api_key
        self.timeout = timeout
        self.retries = retries

    def process(self, data: dict) -> dict:
        """
        處理資料並回傳結果。

        引數：
            data: 要處理的輸入字典。

        回傳：
            處理後的結果（以字典形式）。

        引發：
            YourPackageError: 如果處理失敗。
        """
        ...
```

### 設計規則

- 在 `__init__` 中接受所有組態，不要分散在方法呼叫中。
- 在建構時進行驗證 — 快速失敗並提供清晰的訊息。
- 保持 `__init__` 特徵標記穩定。新增帶有預設值的**僅限關鍵字 (keyword-only)** 引數是回溯相容的。移除或重新排序位置引數 (positional args) 是重大變更。

---

## 4. 工廠 / 產生器 (Builder) 模式

當使用者需要建立預先配置好的執行個體時，使用工廠函式。這可以避免在 `__init__` 中塞入十幾個關鍵字引數，並使常見情況保持簡潔。

```python
# your_package/factory.py
from __future__ import annotations

from your_package.core import YourClient
from your_package.backends.memory import MemoryBackend


def create_client(
    api_key: str,
    *,
    timeout: int = 30,
    retries: int = 3,
    backend: str = "memory",
    backend_url: str | None = None,
) -> YourClient:
    """
    回傳配置好的 YourClient 的工廠函式。

    引數：
        api_key: 必要的 API 金鑰。
        timeout: 請求逾時 (秒)。
        retries: 重試嘗試次數。
        backend: 儲存後端類型。'memory' 或 'redis' 之一。
        backend_url: 所選後端的連線網址。

    範例：
        >>> client = create_client(api_key="sk-...", backend="redis", backend_url="redis://localhost")
    """
    if backend == "redis":
        from your_package.backends.redis import RedisBackend
        _backend = RedisBackend(url=backend_url or "redis://localhost:6379")
    else:
        _backend = MemoryBackend()

    return YourClient(api_key=api_key, timeout=timeout, retries=retries, backend=_backend)
```

**為什麼使用工廠函式，而不是類別方法 (class method)？** 兩者皆可。獨立的工廠函式在測試中更容易進行模擬 (mock)，並避免將工廠邏輯耦合到類別本身。

---

## 5. 組態模式

使用資料類別 (或 Pydantic `BaseModel`) 來儲存組態。這可以為您提供免費的驗證、有助益的錯誤訊息，以及記錄每個選項的單一位置。

```python
# your_package/config.py
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class YourSettings:
    """
    YourClient 的組態。

    屬性：
        timeout: HTTP 逾時 (秒)。
        retries: 發生暫時性錯誤時的重試次數。
        base_url: 基礎 API 網址。
    """
    timeout: int = 30
    retries: int = 3
    base_url: str = "https://api.example.com"
    extra_headers: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.timeout <= 0:
            raise ValueError("timeout 必須為正數")
        if self.retries < 0:
            raise ValueError("retries 必須為非負數")
```

如果您需要載入環境變數，請使用 `pydantic-settings` 作為**選用**相依項 — 請在 `[project.optional-dependencies]` 中宣告，不要將其設為必要相依項。

---

## 6. `__init__.py` — 明確的公用 API

一個定義良好的 `__all__` 不僅僅是風格問題 — 它能確切告知使用者 (以及 IDE) 哪些部分屬於您的公用 API，並防止將內部輔助工具意外匯入為合約的一部分。

```python
# your_package/__init__.py
"""your-package: <一句話描述>。"""

from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("your-package")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"

from your_package.core import YourClient
from your_package.config import YourSettings
from your_package.exceptions import YourPackageError

__all__ = [
    "YourClient",
    "YourSettings",
    "YourPackageError",
    "__version__",
]
```

規則：
- 僅匯出預期供使用者使用的內容。內部輔助工具放在 `_utils.py` 或子模組中。
- 保持 `__init__.py` 頂層匯入的淺層化 — 避免在模組層級匯入沉重的選用相依項 (如 `redis`)。請在需要它們的類別或函式內部進行延遲匯入。
- `__version__` 始終是公用 API 的一部分 — 它允許使用者透過 `your_package.__version__` 進行偵錯。

---

## 7. 選用後端 (外掛程式模式)

此模式讓您的套件能夠現成可用 (零額外相依項) 且具有記憶體內後端，同時允許進階使用者插拔 Redis、資料庫或任何自訂儲存。

### 5.1 抽象基底類別 — 定義介面

```python
# your_package/backends/__init__.py
from abc import ABC, abstractmethod


class BaseBackend(ABC):
    """抽象儲存後端介面。

    實作此介面以新增自訂後端 (資料庫、快取等)。
    """

    @abstractmethod
    async def get(self, key: str) -> str | None:
        """根據鍵擷取數值。若未找到則回傳 None。"""
        ...

    @abstractmethod
    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        """儲存數值。選用的 TTL (秒)。"""
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        """刪除鍵。"""
        ...
```

### 5.2 記憶體內後端 — 零額外相依項

```python
# your_package/backends/memory.py
from __future__ import annotations

import asyncio
import time
from your_package.backends import BaseBackend


class MemoryBackend(BaseBackend):
    """執行緒安全的記憶體內後端。現成可用 — 無需額外相依項。"""

    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float | None]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> str | None:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if expires_at is not None and time.time() > expires_at:
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        async with self._lock:
            expires_at = time.time() + ttl if ttl is not None else None
            self._store[key] = (value, expires_at)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)
```

### 5.3 Redis 後端 — 若未安裝則引發清晰的 ImportError

關鍵設計：在 `__init__` 內部延遲匯入 `redis`，而非在模組層級匯入。這樣，即使未安裝 `redis`，`import your_package` 也永遠不會失敗。

```python
# your_package/backends/redis.py
from __future__ import annotations
from your_package.backends import BaseBackend

try:
    import redis.asyncio as aioredis
except ImportError as exc:
    raise ImportError(
        "Redis 後端需要安裝 redis 選用項：\n"
        "  pip install your-package[redis]"
    ) from exc


class RedisBackend(BaseBackend):
    """用於分散式/多程序部署的 Redis 支援儲存。"""

    def __init__(self, url: str = "redis://localhost:6379") -> None:
        self._client = aioredis.from_url(url, decode_responses=True)

    async def get(self, key: str) -> str | None:
        return await self._client.get(key)

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        await self._client.set(key, value, ex=ttl)

    async def delete(self, key: str) -> None:
        await self._client.delete(key)
```

### 5.4 使用者如何選擇後端

```python
# 預設：記憶體內，不需要額外相依項
from your_package import YourClient
client = YourClient(api_key="sk-...")

# Redis：pip install your-package[redis]
from your_package.backends.redis import RedisBackend
client = YourClient(api_key="sk-...", backend=RedisBackend(url="redis://localhost:6379"))
```
