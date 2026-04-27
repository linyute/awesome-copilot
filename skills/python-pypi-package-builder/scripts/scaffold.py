#!/usr/bin/env python3
"""
scaffold.py — 產生生產等級的 Python PyPI 套件結構。

用法：
    python scaffold.py --name my-package
    python scaffold.py --name my-package --layout src
    python scaffold.py --name my-package --build hatchling

選項：
    --name      PyPI 套件名稱（小寫，連字號）。必要。
    --layout    'flat' (預設值) 或 'src'。
    --build     'setuptools' (預設值，使用 setuptools_scm) 或 'hatchling'。
    --author    作者姓名（預設值：Your Name）。
    --email     作者電子郵件（預設值：you@example.com）。
    --output    輸出目錄（預設值：目前目錄）。
"""

import argparse
import os
import sys
import textwrap
from pathlib import Path


# ---------------------------------------------------------------------------
# 輔助函式
# ---------------------------------------------------------------------------

def pkg_name(pypi_name: str) -> str:
    """將 'my-pkg' 轉換為 'my_pkg'。"""
    return pypi_name.replace("-", "_")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip(), encoding="utf-8")
    print(f"  已建立  {path}")


def touch(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.touch()
    print(f"  已建立  {path}")


# ---------------------------------------------------------------------------
# 檔案產生器
# ---------------------------------------------------------------------------

def gen_pyproject_setuptools(name: str, mod: str, author: str, email: str, layout: str) -> str:
    packages_find = (
        'where = ["src"]' if layout == "src" else f'include = ["{mod}*"]'
    )
    pkg_data_key = f"src/{mod}" if layout == "src" else mod
    pythonpath = "" if layout == "src" else '\npythonpath    = ["."]'
    return f'''\
[build-system]
requires = ["setuptools>=68", "wheel", "setuptools_scm"]
build-backend = "setuptools.build_meta"

[project]
name = "{name}"
dynamic = ["version"]
description = "<您的描述>"
readme = "README.md"
requires-python = ">=3.10"
license = {{text = "MIT"}}
authors = [
    {{name = "{author}", email = "{email}"}},
]
keywords = [
    "python",
    # 新增 10-15 個特定關鍵字 — 它們會影響 PyPI 的可搜尋性
]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Software Development :: Libraries :: Python Modules",
    "Typing :: Typed",
]
dependencies = [
    # 在此列出您的執行階段依賴項目。保持精簡。
    # 範例："httpx>=0.24", "pydantic>=2.0"
]
]

[project.optional-dependencies]
redis = [
    "redis>=4.2",
]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.21",
    "httpx>=0.24",
    "pytest-cov>=4.0",
    "ruff>=0.4",
    "black>=24.0",
    "isort>=5.13",
    "mypy>=1.0",
    "pre-commit>=3.0",
    "build",
    "twine",
]

[project.urls]
Homepage      = "https://github.com/yourusername/{name}"
Documentation = "https://github.com/yourusername/{name}#readme"
Repository    = "https://github.com/yourusername/{name}"
"Bug Tracker" = "https://github.com/yourusername/{name}/issues"
Changelog     = "https://github.com/yourusername/{name}/blob/master/CHANGELOG.md"

[tool.setuptools.packages.find]
{packages_find}

[tool.setuptools.package-data]
{mod} = ["py.typed"]

[tool.setuptools_scm]
version_scheme = "post-release"
local_scheme   = "no-local-version"

[tool.ruff]
target-version = "py310"
line-length    = 100

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "SIM", "C4", "PTH"]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101"]

[tool.black]
line-length    = 100
target-version = ["py310", "py311", "py312", "py313"]

[tool.isort]
profile     = "black"
line_length = 100

[tool.mypy]
python_version        = "3.10"
warn_return_any       = true
warn_unused_configs   = true
disallow_untyped_defs = true
ignore_missing_imports = true
strict                = false

[tool.pytest.ini_options]
asyncio_mode  = "auto"
testpaths     = ["tests"]{pythonpath}
python_files  = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
addopts       = "-v --tb=short --cov={mod} --cov-report=term-missing"

[tool.coverage.run]
source = ["{mod}"]
omit   = ["tests/*"]

[tool.coverage.report]
fail_under   = 80
show_missing = true
'''


def gen_pyproject_hatchling(name: str, mod: str, author: str, email: str) -> str:
    return f'''\
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "{name}"
version = "0.1.0"
description = "<您的描述>"
readme = "README.md"
requires-python = ">=3.10"
license = {{text = "MIT"}}
authors = [
    {{name = "{author}", email = "{email}"}},
]
keywords = ["python"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Typing :: Typed",
]
dependencies = [
    # 在此列出您的執行階段依賴項目。
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.21",
    "httpx>=0.24",
    "pytest-cov>=4.0",
    "ruff>=0.4",
    "black>=24.0",
    "isort>=5.13",
    "mypy>=1.0",
    "pre-commit>=3.0",
    "build",
    "twine",
]

[project.urls]
Homepage  = "https://github.com/yourusername/{name}"
Changelog = "https://github.com/yourusername/{name}/blob/master/CHANGELOG.md"

[tool.hatch.build.targets.wheel]
packages = ["{mod}"]

[tool.hatch.build.targets.wheel.sources]
"{mod}" = "{mod}"

[tool.ruff]
target-version = "py310"
line-length    = 100

[tool.black]
line-length = 100

[tool.isort]
profile = "black"

[tool.mypy]
python_version = "3.10"
disallow_untyped_defs = true
ignore_missing_imports = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths    = ["tests"]
addopts      = "-v --tb=short --cov={mod} --cov-report=term-missing"

[tool.coverage.report]
fail_under   = 80
show_missing = true
'''


def gen_init(name: str, mod: str) -> str:
    return f'''\
"""{name}: <單行描述>."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("{name}")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"

from {mod}.core import YourClient
from {mod}.config import YourSettings
from {mod}.exceptions import YourPackageError

__all__ = [
    "YourClient",
    "YourSettings",
    "YourPackageError",
    "__version__",
]
'''


def gen_core(mod: str) -> str:
    return f'''\
from __future__ import annotations

from {mod}.exceptions import YourPackageError


class YourClient:
    """
    <您的目的> 的主要進入點。

    參數：
        api_key: 必要的驗證認證。
        timeout: 請求逾時（秒）。預設值為 30。
        retries: 重試次數。預設值為 3。

    引發：
        ValueError: 如果 api_key 為空或 timeout 非正數。

    範例：
        >>> from {mod} import YourClient
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
            raise ValueError("api_key must not be empty")
        if timeout <= 0:
            raise ValueError("timeout must be positive")
        self._api_key = api_key
        self.timeout = timeout
        self.retries = retries

    def process(self, data: dict) -> dict:
        """
        處理資料並傳回結果。

        參數：
            data: 要處理的輸入字典。

        傳回值：
            以字典形式傳回處理後的結果。

        引發：
            YourPackageError: 如果處理失敗。
        """
        raise NotImplementedError
'''


def gen_exceptions(mod: str) -> str:
    return f'''\
class YourPackageError(Exception):
    """{mod} 的基礎例外狀況。"""


class YourPackageConfigError(YourPackageError):
    """在設定無效時引發。"""
'''


def gen_backends_init() -> str:
    return '''\
from abc import ABC, abstractmethod


class BaseBackend(ABC):
    """抽象儲存後端介面。"""

    @abstractmethod
    async def get(self, key: str) -> str | None:
        """根據鍵 (key) 擷取值。如果找不到則傳回 None。"""
        ...

    @abstractmethod
    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        """儲存一個值。選用的 TTL（秒）。"""
        ...

    @abstractmethod
    async def delete(self, key: str) -> None:
        """刪除一個鍵。"""
        ...
'''


def gen_memory_backend() -> str:
    return '''\
from __future__ import annotations

import asyncio
import time

from . import BaseBackend


class MemoryBackend(BaseBackend):
    """執行緒安全的記憶體內後端。零額外依賴項目。"""

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
'''


def gen_conftest(name: str, mod: str) -> str:
    return f'''\
import pytest

from {mod}.backends.memory import MemoryBackend
from {mod}.core import YourClient


@pytest.fixture
def memory_backend() -> MemoryBackend:
    return MemoryBackend()


@pytest.fixture
def client(memory_backend: MemoryBackend) -> YourClient:
    return YourClient(
        api_key="test-key",
        backend=memory_backend,
    )
'''


def gen_test_core(mod: str) -> str:
    return f'''\
import pytest

from {mod} import YourClient
from {mod}.exceptions import YourPackageError


def test_client_creates_with_valid_key() -> None:
    client = YourClient(api_key="sk-test")
    assert client is not None


def test_client_raises_on_empty_key() -> None:
    with pytest.raises(ValueError, match="api_key"):
        YourClient(api_key="")


def test_client_raises_on_invalid_timeout() -> None:
    with pytest.raises(ValueError, match="timeout"):
        YourClient(api_key="sk-test", timeout=-1)
'''


def gen_test_backends() -> str:
    return '''\
import pytest
from your_package.backends.memory import MemoryBackend


@pytest.mark.asyncio
async def test_set_and_get() -> None:
    backend = MemoryBackend()
    await backend.set("key1", "value1")
    result = await backend.get("key1")
    assert result == "value1"


@pytest.mark.asyncio
async def test_get_missing_key_returns_none() -> None:
    backend = MemoryBackend()
    result = await backend.get("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_delete_removes_key() -> None:
    backend = MemoryBackend()
    await backend.set("key1", "value1")
    await backend.delete("key1")
    result = await backend.get("key1")
    assert result is None


@pytest.mark.asyncio
async def test_different_keys_are_independent() -> None:
    backend = MemoryBackend()
    await backend.set("key1", "a")
    await backend.set("key2", "b")
    assert await backend.get("key1") == "a"
    assert await backend.get("key2") == "b"
'''


def gen_ci_yml(name: str, mod: str) -> str:
    return f'''\
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint:
    name: Lint, Format & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install dev dependencies
        run: pip install -e ".[dev]"
      - name: ruff
        run: ruff check .
      - name: black
        run: black . --check
      - name: isort
        run: isort . --check-only
      - name: mypy
        run: mypy {mod}/

  test:
    name: Test (Python ${{{{ matrix.python-version }}}})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12", "3.13"]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: ${{{{ matrix.python-version }}}}
      - name: Install dependencies
        run: pip install -e ".[dev]"
      - name: Run tests with coverage
        run: pytest --cov --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          fail_ci_if_error: false
'''


def gen_publish_yml() -> str:
    return '''\
name: Publish to PyPI

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  build:
    name: Build distribution
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install build tools
        run: pip install build twine
      - name: Build package
        run: python -m build
      - name: Check distribution
        run: twine check dist/*
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish:
    name: Publish to PyPI
    needs: build
    runs-on: ubuntu-latest
    environment: pypi
    permissions:
      id-token: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
'''


def gen_precommit() -> str:
    return '''\
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
'''


def gen_changelog(name: str) -> str:
    return f'''\
# 更新日誌 (Changelog)

此專案的所有顯著變更都將記錄在此檔案中。

格式基於 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)，
且此專案遵循 [語意化版本 (Semantic Versioning)](https://semver.org/spec/v2.0.0.html)。

---

## [未發佈]

### 新增
- 初始專案腳手架 (scaffold)

[未發佈]: https://github.com/yourusername/{name}/commits/master
'''


def gen_readme(name: str, mod: str) -> str:
    return f'''\
# {name}

> 單行描述 — 它的功能以及為什麼有用。

[![PyPI version](https://badge.fury.io/py/{name}.svg)](https://pypi.org/project/{name}/)
[![Python Versions](https://img.shields.io/pypi/pyversions/{name})](https://pypi.org/project/{name}/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 安裝

```bash
pip install {name}
```

## 快速開始

```python
from {mod} import YourClient

client = YourClient(api_key="sk-...")
result = client.process({{"input": "value"}})
print(result)
```

## 設定

| 參數 | 類型 | 預設值 | 描述 |
|---|---|---|---|
| api_key | str | 必要 | 驗證認證 |
| timeout | int | 30 | 請求逾時（秒） |
| retries | int | 3 | 重試次數 |

## 貢獻

請參閱 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 更新日誌

請參閱 [CHANGELOG.md](./CHANGELOG.md)

## 授權

MIT — 請參閱 [LICENSE](./LICENSE)
'''


def gen_setup_py() -> str:
    return '''\
# 用於舊式可編輯安裝相容性的精簡墊片。
# 所有設定都位在 pyproject.toml 中。
from setuptools import setup

setup()
'''


def gen_license(author: str) -> str:
    return f'''\
MIT License

Copyright (c) 2026 {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
'''


# ---------------------------------------------------------------------------
# 主要腳手架
# ---------------------------------------------------------------------------

def scaffold(
    name: str,
    layout: str,
    build: str,
    author: str,
    email: str,
    output: str,
) -> None:
    mod = pkg_name(name)
    root = Path(output) / name
    pkg_root = root / "src" / mod if layout == "src" else root / mod

    print(f"\n正在建立腳手架 {name!r} ({layout} 佈局, {build} 建構後端)\n")

    # 套件原始碼
    touch(pkg_root / "py.typed")
    write(pkg_root / "__init__.py", gen_init(name, mod))
    write(pkg_root / "core.py", gen_core(mod))
    write(pkg_root / "exceptions.py", gen_exceptions(mod))
    write(pkg_root / "backends" / "__init__.py", gen_backends_init())
    write(pkg_root / "backends" / "memory.py", gen_memory_backend())

    # 測試
    write(root / "tests" / "__init__.py", "")
    write(root / "tests" / "conftest.py", gen_conftest(name, mod))
    write(root / "tests" / "test_core.py", gen_test_core(mod))
    write(root / "tests" / "test_backends.py", gen_test_backends())

    # CI
    write(root / ".github" / "workflows" / "ci.yml", gen_ci_yml(name, mod))
    write(root / ".github" / "workflows" / "publish.yml", gen_publish_yml())
    write(
        root / ".github" / "ISSUE_TEMPLATE" / "bug_report.md",
        """\
---
name: Bug Report
about: Report a reproducible bug
labels: bug
---

**Python version:**
**Package version:**

**Describe the bug:**

**Minimal reproducible example:**
```python
# paste here
```

**Expected behavior:**

**Actual behavior:**
""",
    )
    write(
        root / ".github" / "ISSUE_TEMPLATE" / "feature_request.md",
        """\
---
name: Feature Request
about: Suggest a new feature
labels: enhancement
---

**Problem this would solve:**

**Proposed solution:**

**Alternatives considered:**
""",
    )

    # 組態檔案
    write(root / ".pre-commit-config.yaml", gen_precommit())
    write(root / "CHANGELOG.md", gen_changelog(name))
    write(root / "README.md", gen_readme(name, mod))
    write(root / "LICENSE", gen_license(author))

    # pyproject.toml + setup.py
    if build == "setuptools":
        write(root / "pyproject.toml", gen_pyproject_setuptools(name, mod, author, email, layout))
        write(root / "setup.py", gen_setup_py())
    else:
        write(root / "pyproject.toml", gen_pyproject_hatchling(name, mod, author, email))

    # .gitignore
    write(
        root / ".gitignore",
        """\
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
*.egg-info/
.eggs/
*.egg
.env
.venv
venv/
.mypy_cache/
.ruff_cache/
.pytest_cache/
htmlcov/
.coverage
cov_annotate/
*.xml
""",
    )

    print(f"\n完成！已建立 {root.resolve()}")
    print("\n下一步：")
    print(f"  cd {name}")
    print("  git init && git add .")
    print('  git commit -m "chore: initial scaffold"')
    print("  pip install -e '.[dev]'")
    print("  pre-commit install")
    print("  pytest")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="建立生產等級的 Python PyPI 套件腳手架。"
    )
    parser.add_argument(
        "--name",
        required=True,
        help="PyPI 套件名稱（小寫，連字號）。範例：my-package",
    )
    parser.add_argument(
        "--layout",
        choices=["flat", "src"],
        default="flat",
        help="專案佈局：'flat' (預設值) 或 'src'。",
    )
    parser.add_argument(
        "--build",
        choices=["setuptools", "hatchling"],
        default="setuptools",
        help="建構後端：'setuptools' (預設值，使用 setuptools_scm) 或 'hatchling'。",
    )
    parser.add_argument("--author", default="Your Name", help="作者姓名。")
    parser.add_argument("--email", default="you@example.com", help="作者電子郵件。")
    parser.add_argument("--output", default=".", help="輸出目錄（預設值：.）。")
    args = parser.parse_args()

    # 驗證名稱
    import re
    if not re.match(r"^[a-z][a-z0-9\-]*$", args.name):
        print(
            f"錯誤：--name 必須僅包含小寫字母、數字和連字號。得到：{args.name!r}",
            file=sys.stderr,
        )
        sys.exit(1)

    target = Path(args.output) / args.name
    if target.exists():
        print(f"錯誤：{target} 已存在。", file=sys.stderr)
        sys.exit(1)

    scaffold(
        name=args.name,
        layout=args.layout,
        build=args.build,
        author=args.author,
        email=args.email,
        output=args.output,
    )


if __name__ == "__main__":
    main()
