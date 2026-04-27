# 測試與程式碼品質

## 目錄
1. [conftest.py](#1-conftestpy)
2. [單元測試](#2-單元測試)
3. [後端單元測試](#3-後端單元測試)
4. [執行測試](#4-執行測試)
5. [程式碼品質工具](#5-程式碼品質工具)
6. [Pre-commit 掛鉤](#6-pre-commit-掛鉤)

---

## 1. `conftest.py`

使用 `conftest.py` 定義共享的 fixture。保持 fixture 專注 — 每個 fixture 僅負責一個關注點。
對於非同步測試，請在 `pyproject.toml` 中使用 `pytest-asyncio` 並設定 `asyncio_mode = "auto"`。

```python
# tests/conftest.py
import pytest
from your_package.core import YourClient
from your_package.backends.memory import MemoryBackend


@pytest.fixture
def memory_backend() -> MemoryBackend:
    return MemoryBackend()


@pytest.fixture
def client(memory_backend: MemoryBackend) -> YourClient:
    return YourClient(
        api_key="test-key",
        backend=memory_backend,
    )
```

---

## 2. 單元測試

測試成功路徑 (happy path) 以及邊緣案例（例如：無效輸入、錯誤條件）。

```python
# tests/test_core.py
import pytest
from your_package import YourClient
from your_package.exceptions import YourPackageError


def test_client_creates_with_valid_key():
    client = YourClient(api_key="sk-test")
    assert client is not None


def test_client_raises_on_empty_key():
    with pytest.raises(ValueError, match="api_key"):
        YourClient(api_key="")


def test_client_raises_on_invalid_timeout():
    with pytest.raises(ValueError, match="timeout"):
        YourClient(api_key="sk-test", timeout=-1)


@pytest.mark.asyncio
async def test_process_returns_expected_result(client: YourClient):
    result = await client.process({"input": "value"})
    assert "output" in result


@pytest.mark.asyncio
async def test_process_raises_on_invalid_input(client: YourClient):
    with pytest.raises(YourPackageError):
        await client.process({})  # 空輸入應導致失敗
```

---

## 3. 後端單元測試

獨立測試每個後端，與函式庫的其餘部分隔離。這使得診斷失敗原因變得更容易，並確保您的抽象介面確實得到了正確的實作。

```python
# tests/test_backends.py
import pytest
from your_package.backends.memory import MemoryBackend


@pytest.mark.asyncio
async def test_set_and_get():
    backend = MemoryBackend()
    await backend.set("key1", "value1")
    result = await backend.get("key1")
    assert result == "value1"


@pytest.mark.asyncio
async def test_get_missing_key_returns_none():
    backend = MemoryBackend()
    result = await backend.get("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_delete_removes_key():
    backend = MemoryBackend()
    await backend.set("key1", "value1")
    await backend.delete("key1")
    result = await backend.get("key1")
    assert result is None


@pytest.mark.asyncio
async def test_ttl_expires_entry():
    import asyncio
    backend = MemoryBackend()
    await backend.set("key1", "value1", ttl=1)
    await asyncio.sleep(1.1)
    result = await backend.get("key1")
    assert result is None


@pytest.mark.asyncio
async def test_different_keys_are_independent():
    backend = MemoryBackend()
    await backend.set("key1", "a")
    await backend.set("key2", "b")
    assert await backend.get("key1") == "a"
    assert await backend.get("key2") == "b"
    await backend.delete("key1")
    assert await backend.get("key2") == "b"
```

---

## 4. 執行測試

```bash
pip install -e ".[dev]"
pytest                           # 執行所有測試
pytest --cov --cov-report=html   # 產出 HTML 涵蓋率報告 (在瀏覽器中開啟)
pytest -k "test_middleware"      # 依名稱過濾
pytest -x                        # 遇到第一個失敗即停止
pytest -v                        # 詳細輸出
```

`pyproject.toml` 中的涵蓋率組態會強制執行最低門檻 (`fail_under = 80`)。如果您低於此門檻，CI 將會失敗，這會自動捕捉到涵蓋率的倒退。

---

## 5. 程式碼品質工具

### Ruff (檢查 — 取代了 flake8、pylint 及許多其他工具)

```bash
pip install ruff
ruff check .           # 檢查問題
ruff check . --fix     # 自動修正安全的問題
```

Ruff 極其快速，可取代 Python 檢查生態系統中的大部分工具。請在 `pyproject.toml` 中進行組態 — 請參閱 `references/pyproject-toml.md` 以取得完整組態。

### Black (格式化)

```bash
pip install black
black .                # 格式化所有檔案
black . --check        # CI 模式 — 僅報告問題而不修改檔案
```

### isort (匯入排序)

```bash
pip install isort
isort .                # 排序匯入
isort . --check-only   # CI 模式
```

請務必在 `[tool.isort]` 中設定 `profile = "black"` — 否則 black 和 isort 將會產生衝突。

### mypy (靜態型別檢查)

```bash
pip install mypy
mypy your_package/   # 僅對套件原始碼進行型別檢查
```

常見修正方案：

- `ignore_missing_imports = true` — 忽略未型別化的第三方相依項
- `from __future__ import annotations` — 啟用 PEP 563 延遲評估 (相容於 Python 3.9)
- `pip install types-redis` — redis 函式庫的型別存根 (stubs)

### 一次執行所有工具

```bash
ruff check . && black . --check && isort . --check-only && mypy your_package/
```

---

## 6. Pre-commit 掛鉤

Pre-commit 在每次提交前自動執行所有品質工具，確保問題永遠不會到達 CI。
每個複製的專案只需執行一次 `pre-commit install` 即可安裝。

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  - repo: https://github.com/psf/black
    rev: 24.4.2
    hooks:
      - id: black

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies: [types-redis]  # 為型別化相依項新增存根

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-toml
      - id: check-merge-conflict
      - id: debug-statements
      - id: no-commit-to-branch
        args: [--branch, master, --branch, main]
```

```bash
pip install pre-commit
pre-commit install           # 每個複製專案安裝一次
pre-commit run --all-files   # 手動執行所有掛鉤 (在首次安裝前很有用)
```

`no-commit-to-branch` 掛鉤可防止意外直接提交到 `main`/`master` 分支，這將會跳過 CI 檢查。請務必在功能分支上工作。
