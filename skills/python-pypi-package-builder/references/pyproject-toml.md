# pyproject.toml、後端、版本控制與型別化套件

## 目錄
1. [完整的 pyproject.toml — setuptools + setuptools_scm](#1-完整的-pyprojecttoml)
2. [hatchling (現代、零組態)](#2-hatchling-現代零組態)
3. [flit (極簡，版本源自 `__version__`)](#3-flit-極簡版本源自-__version__)
4. [poetry (整合式相依項管理器)](#4-poetry-整合式相依項管理器)
5. [版本控制策略 — PEP 440、語義化版本、相依項指定](#5-版本控制策略-pep-440語義化版本相依項指定)
6. [setuptools_scm — 源自 git 標籤的動態版本](#6-動態版本控制-使用-setuptools_scm)
7. [用於舊版可編輯安裝的 setup.py 墊片 (shim)](#7-setuppy-墊片)
8. [PEP 561 型別化套件 (py.typed)](#8-型別化套件-pep-561)

---

## 1. 完整的 pyproject.toml

### setuptools + setuptools_scm (建議用於 git 標籤版本控制)

```toml
[build-system]
requires = ["setuptools>=68", "wheel", "setuptools_scm"]
build-backend = "setuptools.build_meta"

[project]
name = "your-package"
dynamic = ["version"]           # 版本源自 git 標籤，透過 setuptools_scm 取得
description = "<您的描述> — <關鍵功能 1>, <關鍵功能 2>"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"                # PEP 639 SPDX 表達式 (字串，而非 {text = "MIT"})
license-files = ["LICENSE"]
authors = [
    {name = "您的姓名", email = "you@example.com"},
]
maintainers = [
    {name = "您的姓名", email = "you@example.com"},
]
keywords = [
    "python",
    # 新增 10-15 個描述您函式庫的特定關鍵字 — 它們會影響 PyPI 的可搜尋性
]
classifiers = [
    "Development Status :: 3 - Alpha",          # 穩定版本時請改為 5
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Topic :: Software Development :: Libraries :: Python Modules",
    "Typing :: Typed",          # 隨附 py.typed 時請新增此項
]
dependencies = [
    # 在此列出您的執行階段相依項。請保持精簡。
    # 範例："httpx>=0.24", "pydantic>=2.0"
    # 如果您的函式庫沒有必要的執行階段相依項，請留空。
]

[project.optional-dependencies]
redis = [
    "redis>=4.2",               # 選用的沉重後端
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
Homepage      = "https://github.com/yourusername/your-package"
Documentation = "https://github.com/yourusername/your-package#readme"
Repository    = "https://github.com/yourusername/your-package"
"Bug Tracker" = "https://github.com/yourusername/your-package/issues"
Changelog     = "https://github.com/yourusername/your-package/blob/master/CHANGELOG.md"

# --- Setuptools 組態 ---
[tool.setuptools.packages.find]
include = ["your_package*"]   # 扁平配置 (flat layout)
# 針對 src/ 配置，請使用：
# where = ["src"]

[tool.setuptools.package-data]
your_package = ["py.typed"]  # 在 wheel 中隨附 py.typed 標記

# --- setuptools_scm：源自 git 標籤的版本 ---
[tool.setuptools_scm]
version_scheme = "post-release"
local_scheme   = "no-local-version"  # 防止 +local 後綴導致 PyPI 上傳失敗

# --- Ruff (檢查) ---
[tool.ruff]
target-version = "py310"
line-length    = 100

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "SIM", "C4", "PTH", "RUF"]
ignore = ["E501"]   # 行長度由格式化工具強制執行

[tool.ruff.lint.per-file-ignores]
"tests/*"   = ["S101", "ANN"]    # 在測試中允許 assert 並忽略註釋
"scripts/*" = ["T201"]           # 在腳本中允許 print

[tool.ruff.format]
quote-style = "double"

# --- Black (格式化) ---
[tool.black]
line-length    = 100
target-version = ["py310", "py311", "py312", "py313"]

# --- isort (匯入排序) ---
[tool.isort]
profile     = "black"
line_length = 100

# --- mypy (靜態型別檢查) ---
[tool.mypy]
python_version         = "3.10"
warn_return_any        = true
warn_unused_configs    = true
warn_unused_ignores    = true
disallow_untyped_defs  = true
disallow_any_generics  = true
ignore_missing_imports = true
strict                 = false     # 若要最大嚴格度，請設為 true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false     # 在測試中放寬標準

# --- pytest ---
[tool.pytest.ini_options]
asyncio_mode  = "auto"
testpaths     = ["tests"]
pythonpath    = ["."]          # 用於扁平配置；若為 src/ 配置則移除
python_files  = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
addopts       = "-v --tb=short --cov=your_package --cov-report=term-missing"

# --- 涵蓋率 (Coverage) ---
[tool.coverage.run]
source = ["your_package"]
omit   = ["tests/*"]

[tool.coverage.report]
fail_under   = 80
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
    "@abstractmethod",
]
```

---

## 2. hatchling (現代、零組態)

最適合不需要 C 擴充功能的純 Python 專案。不需要 `setup.py`。使用 `hatch-vcs` 進行 git 標籤版本控制，或省略它以手動提升版本。

```toml
[build-system]
requires = ["hatchling", "hatch-vcs"]     # hatch-vcs 用於 git 標籤版本控制
build-backend = "hatchling.build"

[project]
name = "your-package"
dynamic = ["version"]            # 移除此行並新增 version = "1.0.0" 以手動控制版本
description = "一句話描述"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
license-files = ["LICENSE"]
authors = [{name = "您的姓名", email = "you@example.com"}]
keywords = ["python"]
classifiers = [
    "Development Status :: 3 - Alpha",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Typing :: Typed",
]
dependencies = []

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-cov>=5.0", "ruff>=0.6", "mypy>=1.10"]

[project.urls]
Homepage  = "https://github.com/yourusername/your-package"
Changelog = "https://github.com/yourusername/your-package/blob/master/CHANGELOG.md"

# --- Hatchling 建構組態 ---
[tool.hatch.build.targets.wheel]
packages = ["src/your_package"]    # src/ 配置
# packages = ["your_package"]      # ← 扁平配置

[tool.hatch.version]
source = "vcs"                     # 透過 hatch-vcs 進行 git 標籤版本控制

[tool.hatch.version.raw-options]
local_scheme = "no-local-version"

# ruff, mypy, pytest, coverage 區段 — 與上述 setuptools 範本相同
```

---

## 3. flit (極簡，版本源自 `__version__`)

最適合非常簡單、單一模組的套件。零組態。版本直接從 `your_package/__init__.py` 讀取。一律需要一個**靜態字串**作為 `__version__`。

```toml
[build-system]
requires = ["flit_core>=3.9"]
build-backend = "flit_core.buildapi"

[project]
name = "your-package"
dynamic = ["version", "description"]  # 從 __init__.py 的 __version__ 和 docstring 讀取
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
authors = [{name = "您的姓名", email = "you@example.com"}]
classifiers = [
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Typing :: Typed",
]
dependencies = []

[project.urls]
Homepage = "https://github.com/yourusername/your-package"

# flit 會自動從 your_package/__init__.py 讀取 __version__。
# 請確保 __init__.py 包含：__version__ = "1.0.0" (靜態字串 — flit 不支援
# 透過 importlib.metadata 進行動態版本探索)
```

---

## 4. poetry (整合式相依項 + 建構管理器)

最適合希望使用單一工具來管理相依項、建構與發佈的小組。Poetry v2+ 支援標準的 `[project]` 資料表。

```toml
[build-system]
requires = ["poetry-core>=2.0"]
build-backend = "poetry.core.masonry.api"

[project]
name = "your-package"
version = "1.0.0"
description = "一句話描述"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
authors = [{name = "您的姓名", email = "you@example.com"}]
classifiers = [
    "Programming Language :: Python :: 3",
    "Typing :: Typed",
]
dependencies = []   # poetry v2+ 使用標準的 [project] 資料表

[project.optional-dependencies]
dev = ["pytest>=8.0", "ruff>=0.6", "mypy>=1.10"]

# 選用：僅針對 poetry 特定功能使用 [tool.poetry]
[tool.poetry.group.dev.dependencies]
# Poetry 特定的群組語法 (替代 [project.optional-dependencies])
pytest = ">=8.0"
```

---

## 5. 版本控制策略

### PEP 440 — 標準規範

```
正式形式： N[.N]+[{a|b|rc}N][.postN][.devN]

範例：
  1.0.0          穩定版本 (Stable release)
  1.0.0a1        Alpha (預發佈)
  1.0.0b2        Beta
  1.0.0rc1       版本候選 (Release candidate)
  1.0.0.post1    發佈後修正 (例如：僅封裝修正 — 無程式碼變更)
  1.0.0.dev1     開發快照 (切勿上傳至 PyPI)
```

### 語義化版本 (SemVer) — 建議用於所有函式庫

```
MAJOR.MINOR.PATCH

MAJOR：重大的 API 變更 (移除/重新命名公用函式/類別/引數)
MINOR：新功能，完全回溯相容
PATCH：錯誤修正，無 API 變更
```

| 變更 | 提升位元 | 範例 |
|---|---|---|
| 移除 / 重新命名公用函式 | MAJOR | `1.2.3 → 2.0.0` |
| 新增公用函式 | MINOR | `1.2.3 → 1.3.0` |
| 錯誤修正，無 API 變更 | PATCH | `1.2.3 → 1.2.4` |
| 新的預發佈版本 | 後綴 | `2.0.0a1`, `2.0.0rc1` |

### 程式碼中的版本 — 從套件中繼資料讀取

```python
# your_package/__init__.py
from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("your-package")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"    # 針對未安裝的開發簽出版本的回退值
```

使用 setuptools_scm 時，切勿寫死 `__version__ = "1.0.0"` — 它在第一次 git 標籤後就會過時。請一律使用 `importlib.metadata`。

### 相依項版本指定最佳實作

```toml
# 在 [project] 相依項中 — 針對函式庫：
"httpx>=0.24"            # 最低版本 — 函式庫優先建議使用；讓使用者自由升級
"httpx>=0.24,<1.0"       # 僅在已知下一個主版本有重大變更時才設定上限

# 僅針對應用程式 (絕不適用於函式庫)：
"httpx==0.27.0"          # 精確固定 — 會破壞函式庫中的相依項解析

# 在函式庫中切勿這樣做：
# "httpx~=0.24.0"        # 相容發佈運算子 — 過於嚴苛
# "httpx==0.27.*"        # 萬用字元固定 — 脆弱
```

---

## 6. 動態版本控制 — 使用 `setuptools_scm`

`setuptools_scm` 會讀取您的 git 標籤並自動設定套件版本 — 不再需要在每次發佈前手動編輯版本字串。

### 運作方式

```
git tag v1.0.0        →  套件版本 = 1.0.0
git tag v1.1.0        →  套件版本 = 1.1.0
(標籤後的提交)        →  版本 = 1.1.0.post1+g<雜湊值> (上傳至 PyPI 時會移除後綴)
```

`local_scheme = "no-local-version"` 會移除 `+g<雜湊值>` 後綴，因此 PyPI 上傳永遠不會因為「不允許本機版本標籤」錯誤而失敗。

### 在執行階段存取版本

```python
# your_package/__init__.py
from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("your-package")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"  # 針對未安裝的開發簽出版本的回退值
```

使用 setuptools_scm 時，切勿寫死 `__version__ = "1.0.0"` — 它在第一個標籤後就會過時。

### 完整的發佈流程 (僅需如此 — 無需其他操作)

```bash
git tag v1.2.0
git push origin master --tags
# GitHub Actions publish.yml 會自動觸發
```

---

## 7. `setup.py` 墊片 (Shim)

一些較舊的工具和 IDE 仍預期會有一個 `setup.py`。保持它為三行的墊片即可 — 所有實際的組態都保留在 `pyproject.toml` 中。

```python
# setup.py — 僅為薄層墊片。所有組態皆位於 pyproject.toml 中。
from setuptools import setup

setup()
```

切勿將 `name`、`version`、`dependencies` 或任何其他中繼資料從 `pyproject.toml` 重複複製到 `setup.py`。如果您在該處複製任何內容，它最終會產生偏移並導致令人困惑的衝突。

---

## 8. 型別化套件 (PEP 561)

一個正確宣告的型別化套件意味著 mypy、pyright 和 IDE 會自動獲取您的型別提示，而不需要您的使用者進行任何額外設定。

### 步驟 1：建立標記檔案

```bash
# 檔案必須存在；其內容並不重要 — 它的存在就是信號。
touch your_package/py.typed
```

### 步驟 2：將其包含在 wheel 中

已在上述範本中包含：

```toml
[tool.setuptools.package-data]
your_package = ["py.typed"]
```

### 步驟 3：新增 PyPI 分類器

```toml
classifiers = [
    ...
    "Typing :: Typed",
]
```

### 步驟 4：為所有公用函式加上型別註釋

```python
# 良好 — 完整型別化
def process(
    self,
    data: dict[str, object],
    *,
    timeout: int = 30,
) -> dict[str, object]:
    ...

# 不良 — mypy 會標記此項，且 IDE 不會為使用者提供自動補全
def process(self, data, timeout=30):
    ...
```

### 步驟 5：驗證 py.typed 是否包含在 wheel 中

```bash
python -m build
unzip -l dist/your_package-*.whl | grep py.typed
# 必須顯示：your_package/py.typed
```

如果缺失，請檢查您的 `[tool.setuptools.package-data]` 組態。
