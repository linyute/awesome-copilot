# 工具 — 僅使用 Ruff 的設定與程式碼品質

## 目錄
1. [僅使用 Ruff (取代 black、isort、flake8)](#1-僅使用-ruff-取代-blackisortflake8)
2. [pyproject.toml 中的 Ruff 組態](#2-pyprojecttoml-中的-ruff-組態)
3. [mypy 組態](#3-mypy-組態)
4. [pre-commit 組態](#4-pre-commit-組態)
5. [pytest 與涵蓋率組態](#5-pytest-與涵蓋率組態)
6. [pyproject.toml 中的開發相依項](#6-pyprojecttoml-中的開發相依項)
7. [CI 檢查作業 — 僅使用 Ruff](#7-ci-檢查作業--僅使用-ruff)
8. [遷移指南 — 移除 black 與 isort](#8-遷移指南--移除-black-與-isort)

---

## 1. 僅使用 Ruff (取代 black、isort、flake8)

**決策：** 使用 `ruff` 作為單一的檢查與格式化工具。移除 `black` 與 `isort`。

| 舊工具 (應避免) | 新工具 (應使用) | 它的作用 |
|---|---|---|
| `black` | `ruff format` | 程式碼格式化 |
| `isort` | `ruff check --select I` | 匯入排序 |
| `flake8` | `ruff check` | 風格與錯誤檢查 |
| `pyupgrade` | `ruff check --select UP` | 將語法升級至現代 Python |
| `bandit` | `ruff check --select S` | 安全性檢查 |
| 以上所有 | `ruff` | 一個工具，一個組態區段 |

**為什麼選擇 ruff？**
- 比它所取代的工具快 10–100 倍 (以 Rust 編寫)。
- 在 `pyproject.toml` 中只有一個組態區段 — 不再有 `.flake8`、`.isort.cfg`、`pyproject.toml[tool.black]` 等組態檔案的散布。
- 由 Astral 積極維護；遵循與其取代的工具相同的規則。
- `ruff format` 與 black 相容 — 現有的 black 格式化程式碼不需變更即可通過。

---

## 2. pyproject.toml 中的 Ruff 組態

```toml
[tool.ruff]
target-version = "py310"        # 支援的最低 Python 版本
line-length    = 88             # 與 black 相容的預設值
src            = ["src", "tests"]

[tool.ruff.lint]
select = [
    "E",   # pycodestyle 錯誤
    "W",   # pycodestyle 警告
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear (頗具主見但非常有用)
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade (語法現代化)
    "SIM", # flake8-simplify
    "TCH", # flake8-type-checking (將匯入移動至 TYPE_CHECKING 區塊)
    "ANN", # flake8-annotations (強制使用型別提示 — 若過於嚴格可移除)
    "S",   # flake8-bandit (安全性)
    "N",   # pep8-naming (命名規範)
]
ignore = [
    "ANN101",  # 缺少 `self` 的型別註釋
    "ANN102",  # 缺少 `cls` 的型別註釋
    "S101",    # 使用 `assert` — 在測試中是必要的
    "S603",    # subprocess 未設定 shell=True — 通常是刻意為之
    "B008",    # 請勿在預設引數中執行函式呼叫 (FastAPI/Typer 中常有誤判)
]

[tool.ruff.lint.isort]
known-first-party = ["your_package"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101", "ANN", "D"]   # 在測試中允許 assert，並跳過註釋/docstrings

[tool.ruff.format]
quote-style              = "double"   # 與 black 相容
indent-style             = "space"
skip-magic-trailing-comma = false
line-ending              = "auto"
```

### 常用的 ruff 指令

```bash
# 檢查問題 (不進行變更)
ruff check .

# 自動修正可修正的問題
ruff check --fix .

# 格式化程式碼 (取代 black)
ruff format .

# 檢查格式而不變更檔案 (CI 模式)
ruff format --check .

# 在一個指令中同時執行檢查與格式化檢查 (用於 CI)
ruff check . && ruff format --check .
```

---

## 3. mypy 組態

```toml
[tool.mypy]
python_version          = "3.10"
strict                  = true
warn_return_any         = true
warn_unused_ignores     = true
warn_redundant_casts    = true
disallow_untyped_defs   = true
disallow_incomplete_defs = true
check_untyped_defs      = true
no_implicit_optional    = true
show_error_codes        = true

# 忽略不隨附型別的第三方套件的缺失存根
[[tool.mypy.overrides]]
module = ["redis.*", "pydantic_settings.*"]
ignore_missing_imports = true
```

### 執行 mypy — 同時處理 src 與扁平配置 (flat layout)

```bash
# src 配置：
mypy src/your_package/

# 扁平配置：
mypy your_package/
```

在 CI 中，動態偵測配置：

```yaml
- name: 執行 mypy
  run: |
    if [ -d "src" ]; then
        mypy src/
    else
        mypy your_package/
    fi
```

---

## 4. pre-commit 組態

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.4.4    # 固定到特定版本；定期使用 `pre-commit autoupdate` 更新
    hooks:
      - id: ruff
        args: [--fix]       # 自動修正可修正的問題
      - id: ruff-format     # 格式化 (取代 black 掛鉤)

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.10.0
    hooks:
      - id: mypy
        additional_dependencies:
          - types-requests
          - types-redis
          # 為套件中使用的任何型別化相依項新增存根

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-toml
      - id: check-yaml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: ["--maxkb=500"]
```

### ❌ 移除這些掛鉤 (已被 ruff 取代)

```yaml
# 刪除或不要新增：
- repo: https://github.com/psf/black           # 被 ruff-format 取代
- repo: https://github.com/PyCQA/isort          # 被 ruff lint I 規則取代
- repo: https://github.com/PyCQA/flake8         # 被 ruff check 取代
- repo: https://github.com/PyCQA/autoflake      # 被 ruff check F401 取代
```

### 設定

```bash
pip install pre-commit
pre-commit install     # 安裝 git 掛鉤 — 在每次提交時執行
pre-commit run --all-files  # 對所有檔案手動執行
pre-commit autoupdate  # 將所有掛鉤更新至最新的固定版本
```

---

## 5. pytest 與涵蓋率組態

```toml
[tool.pytest.ini_options]
testpaths    = ["tests"]
addopts      = "-ra -q --strict-markers --cov=your_package --cov-report=term-missing"
asyncio_mode = "auto"    # 啟用非同步測試，不需 @pytest.mark.asyncio 裝飾器

[tool.coverage.run]
source   = ["your_package"]
branch   = true
omit     = ["**/__main__.py", "**/cli.py"]  # 從涵蓋率中排除進入點
```

```toml
[tool.coverage.report]
show_missing   = true
skip_covered   = false
fail_under     = 85        # 如果涵蓋率低於 85%，則 CI 失敗
exclude_lines  = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
    "@abstractmethod",
]
```

### asyncio_mode = "auto" — 移除 @pytest.mark.asyncio

當在 `pyproject.toml` 中設定 `asyncio_mode = "auto"` 時，**不要**在測試函式中新增 `@pytest.mark.asyncio`。該裝飾器是多餘的，並且在現代的 pytest-asyncio 中會引發警告。

```python
# 錯誤 — 當 asyncio_mode = "auto" 時，此裝飾器已棄用：
@pytest.mark.asyncio
async def test_async_operation():
    result = await my_async_func()
    assert result == expected

# 正確 — 直接使用 async def：
async def test_async_operation():
    result = await my_async_func()
    assert result == expected
```

---

## 6. pyproject.toml 中的開發相依項

將所有開發/測試工具宣告在名為 `dev` 的 `[extras]` 群組中。

```toml
[project.optional-dependencies]
dev = [
    "pytest>=8",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5",
    "ruff>=0.4",
    "mypy>=1.10",
    "pre-commit>=3.7",
    "httpx>=0.27",       # 若要測試 HTTP 傳輸
    "respx>=0.21",       # 若要在測試中模擬 httpx
]
redis = [
    "redis>=5",
]
docs = [
    "mkdocs-material>=9",
    "mkdocstrings[python]>=0.25",
]
```

安裝開發相依項：

```bash
pip install -e ".[dev]"
pip install -e ".[dev,redis]"   # 包含選用的額外相依項
```

---

## 7. CI 檢查作業 — 僅使用 Ruff

將獨立的 `black`、`isort` 和 `flake8` 步驟替換為單一的 `ruff` 步驟。

```yaml
# .github/workflows/ci.yml  — 檢查作業
lint:
  name: 檢查與型別檢查
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-python@v5
      with:
        python-version: "3.11"

    - name: 安裝開發相依項
      run: pip install -e ".[dev]"

    # 單一步驟：ruff 取代了 black + isort + flake8
    - name: ruff 檢查
      run: ruff check .

    - name: ruff 格式化檢查
      run: ruff format --check .

    - name: mypy
      run: |
        if [ -d "src" ]; then
            mypy src/
        else
            mypy $(basename $(ls -d */))/ 2>/dev/null || mypy .
        fi
```

---

## 8. 遷移指南 — 移除 black 與 isort

如果您要轉換一個使用了 `black` 和 `isort` 的現有專案：

```bash
# 1. 從開發相依項中移除 black 和 isort
pip uninstall black isort

# 2. 從 pyproject.toml 中移除 black 和 isort 組態區段
# [tool.black]  ← 刪除此區段
# [tool.isort]  ← 刪除此區段

# 3. 將 ruff 新增至開發相依項 (組態請參閱第 2 節)

# 4. 執行 ruff format 以確認現有程式碼已經相容
ruff format --check .
# ruff format 與 black 相容；輸出應該完全相同

# 5. 更新 .pre-commit-config.yaml (請參閱第 4 節)
# 移除 black 與 isort 掛鉤；新增 ruff 與 ruff-format 掛鉤

# 6. 更新 CI (請參閱第 7 節)
# 移除 black, isort, flake8 步驟；新增 ruff check + ruff format --check

# 7. 重新安裝 pre-commit 掛鉤
pre-commit uninstall
pre-commit install
pre-commit run --all-files   # 驗證是否通過檢查
```
