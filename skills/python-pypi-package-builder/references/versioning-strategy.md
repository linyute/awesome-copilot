# 版本控制策略 — PEP 440、語義化版本與決策引擎

## 目錄
1. [PEP 440 — 標準規範](#1-pep-440--標準規範)
2. [語義化版本 (SemVer)](#2-語義化版本-semver)
3. [預發佈識別碼](#3-預發佈識別碼)
4. [版本控制決策引擎](#4-版本控制決策引擎)
5. [動態版本控制 — setuptools_scm (推薦)](#5-動態版本控制--setuptools_scm-推薦)
6. [搭配 hatch-vcs 外掛程式的 Hatchling](#6-搭配-hatch-vcs-外掛程式的-hatchling)
7. [靜態版本控制 — flit](#7-靜態版本控制--flit)
8. [靜態版本控制 — hatchling 手動設定](#8-靜態版本控制--hatchling-手動設定)
9. [切勿寫死版本號碼 (flit 除外)](#9-切勿寫死版本號碼-flit-除外)
10. [相依項版本指定符](#10-相依項版本指定符)
11. [PyPA 發佈指令](#11-pypa-發佈指令)

---

## 1. PEP 440 — 標準規範

所有 Python 套件版本都必須符合 [PEP 440](https://peps.python.org/pep-0440/)。
不符合規範的版本（例如：`1.0-beta`、`2023.1.1.dev`）將被 PyPI 拒絕。

```
正式形式： N[.N]+[{a|b|rc}N][.postN][.devN]

1.0.0            穩定版本 (Stable release)
1.0.0a1          Alpha 預發佈版
1.0.0b2          Beta 預發佈版
1.0.0rc1         發佈候選版 (Release candidate)
1.0.0.post1      發佈後修正 (相同程式碼庫的封裝修正)
1.0.0.dev1       開發快照 — 請勿上傳至 PyPI
2.0.0            主版本發佈 (重大變更)
```

### 紀元 (Epoch) 前綴 (罕見)

```
1!1.0.0          紀元 1；當您需要跳過舊有的命名配置時使用
```

僅將紀元作為修復損壞版本序列的最後手段。

---

## 2. 語義化版本 (SemVer)

SemVer 可以乾淨地映射到 PEP 440。始終使用 `MAJOR.MINOR.PATCH` 格式：

```
MAJOR  當您進行不相容的 API 變更時增加 (重新命名、移除、破壞性變更)
MINOR  當您以回溯相容的方式新增功能時增加 (新功能)
PATCH  當您進行回溯相容的錯誤修正時增加

範例：
  1.0.0 → 1.0.1   錯誤修正，無 API 變更
  1.0.0 → 1.1.0   新增了方法；現有 API 保持原樣
  1.0.0 → 2.0.0   公用方法被重新命名或移除
```

### 什麼算作重大變更 (Breaking Change)？

| 變更 | 是否為重大變更？ |
|---|---|
| 重新命名公用函式 | 是 — `MAJOR` |
| 移除參數 | 是 — `MAJOR` |
| 新增必要的參數 | 是 — `MAJOR` |
| 新增帶有預設值的選用參數 | 否 — `MINOR` |
| 新增新的函式/類別 | 否 — `MINOR` |
| 修正錯誤 | 否 — `PATCH` |
| 更新相依項的下限 | 否 (通常) — `PATCH` |
| 更新相依項的上限 (具破壞性) | 是 — `MAJOR` |

---

## 3. 預發佈識別碼

在發佈穩定版本之前，使用預發佈版本來獲取使用者回饋。
pip 預設**不會**安裝預發佈版本（`pip install pkg` 會跳過它們）。
使用者必須選擇加入：`pip install "pkg==2.0.0a1"` 或 `pip install --pre pkg`。

```
1.0.0a1    Alpha-1：非常早期；預期會有錯誤；API 可能會變動
1.0.0b1    Beta-1：功能完整；API 趨於穩定；尋求更廣泛的回饋
1.0.0rc1   發佈候選版：程式碼凍結；穩定前的最後測試
1.0.0      穩定版：可用於生產環境
```

### 遞增規則

```
開始：       1.0.0a1
更多 Alpha： 1.0.0a2, 1.0.0a3
進入 Beta：  1.0.0b1 (計數器重設)
進入 RC：    1.0.0rc1
穩定版：     1.0.0
```

---

## 4. 版本控制決策引擎

在編寫任何程式碼之前，請使用此決策樹來挑選正確的版本控制策略。

```
專案是否使用 git 並透過版本標籤 (version tags) 標記發佈？
├── 是 → setuptools + setuptools_scm (預設 — 最適合大多數專案)
│         Git 標籤 v1.0.0 會自動成為安裝的版本。
│         不需要手動提升版本。
│
└── 否 — 專案是否為簡單的單一模組函式庫，且發佈頻率較低？
          ├── 是 → flit
          │         在 __init__.py 中設定 __version__ = "1.0.0"。
          │         在每次發佈前手動更新。
          │
          └── 否 — 小組是否想要一個整合式的建構 + 相依項管理工具？
                    ├── 是 → poetry
                    │         在 [tool.poetry] 的 version 欄位中管理版本。
                    │
                    └── 否 → hatchling (現代、快速、純 Python)
                              使用 hatch-vcs 外掛程式進行動態版本控制
                              或在 [project] 中手動設定版本。

套件是否具有 C/Cython/Fortran 擴充功能？
└── 是 (一律) → setuptools (唯一完整支援原生擴充功能的後端)
```

### 摘要表

| 後端 | 版本來源 | 最適合 |
|---|---|---|
| `setuptools` + `setuptools_scm` | Git 標籤 — 完全自動化 | 新專案的預設選擇 |
| `hatchling` + `hatch-vcs` | Git 標籤 — 透過外掛程式自動化 | hatchling 使用者 |
| `flit` | `__init__.py` 中的 `__version__` | 極其簡單、組態最少的情況 |
| `poetry` | `[tool.poetry] version` 欄位 | 整合式相依項 + 建構管理 |
| `hatchling` 手動 | `[project] version` 欄位 | 一次性的靜態版本控制 |

---

## 5. 動態版本控制 — setuptools_scm (推薦)

`setuptools_scm` 會讀取目前的 git 標籤，並在建構時計算版本。
不需要額外的 `__version__` 更新步驟 — 只需要標記標籤並推送即可。

### `pyproject.toml` 組態

```toml
[build-system]
requires      = ["setuptools>=70", "setuptools_scm>=8"]
build-backend = "setuptools.backends.legacy:build"

[project]
name    = "your-package"
dynamic = ["version"]

[tool.setuptools_scm]
version_scheme = "post-release"
local_scheme   = "no-local-version"   # 防止 +g<hash> 破壞 PyPI 上傳
```

### `__init__.py` — 正確的版本存取方式

```python
# your_package/__init__.py
from importlib.metadata import version, PackageNotFoundError

try:
    __version__ = version("your-package")
except PackageNotFoundError:
    # 套件未安裝 (從原始碼簽出執行，未執行 pip install -e .)
    __version__ = "0.0.0.dev0"

__all__ = ["__version__"]
```

### 版本如何計算

```
git tag v1.0.0            →  已安裝版本 = "1.0.0"
v1.0.0 之後的 3 次提交    →  已安裝版本 = "1.0.0.post3+g<雜湊值>" (僅限開發)
git tag v1.1.0            →  已安裝版本 = "1.1.0"
```

透過 `local_scheme = "no-local-version"`，`+g<雜湊值>` 後綴會在 PyPI 上傳時被移除，但在本機仍保持可見。

### 關鍵的 CI 需求

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0    # 必須 — 若無此項，git 將沒有標籤歷史記錄
                      # setuptools_scm 會靜默地回退到 0.0.0+d<日期>
```

**每一個**安裝或建構套件的 CI 作業都必須設定 `fetch-depth: 0`。

### 偵錯版本問題

```bash
# 檢查 setuptools_scm 目前會產出的版本：
python -m setuptools_scm

# 如果您看到 0.0.0+d...，表示：
# 1. 從 HEAD 無法連及任何標籤，或者
# 2. CI 中未設定 fetch-depth: 0
```

---

## 6. Hatchling 搭配 hatch-vcs 外掛程式

對於已經在使用 hatchling 的小組，這是一個 setuptools_scm 的替代方案。

```toml
[build-system]
requires      = ["hatchling", "hatch-vcs"]
build-backend = "hatchling.build"

[project]
name    = "your-package"
dynamic = ["version"]

[tool.hatch.version]
source = "vcs"

[tool.hatch.build.hooks.vcs]
version-file = "src/your_package/_version.py"
```

以與 setuptools_scm 相同的方式存取版本：

```python
from importlib.metadata import version, PackageNotFoundError
try:
    __version__ = version("your-package")
except PackageNotFoundError:
    __version__ = "0.0.0.dev0"
```

---

## 7. 靜態版本控制 — flit

僅在手動提升版本可以接受的簡單、單一模組套件中使用 flit。

### `pyproject.toml`

```toml
[build-system]
requires      = ["flit_core>=3.9"]
build-backend = "flit_core.buildapi"

[project]
name = "your-package"
dynamic = ["version", "description"]
```

### `__init__.py`

```python
"""your-package — 一個專注於單一用途的公用程式。"""
__version__ = "1.2.0"   # flit 會讀取此值；在每次發佈前手動更新
```

**flit 的例外情況：** 這是唯一一種將 `__version__` 寫死是正確的做法。
flit 透過匯入 `__init__.py` 並讀取 `__version__` 來探索版本。

### flit 的發佈流程

```bash
# 1. 在 __init__.py 中提升 __version__
# 2. 更新 CHANGELOG.md
# 3. 提交變更
git add src/your_package/__init__.py CHANGELOG.md
git commit -m "chore: 發佈版本 v1.2.0"
# 4. 標記標籤 (flit 也可以直接發佈)
git tag v1.2.0
git push origin v1.2.0
# 5. 建構並發佈
flit publish
# 或者
python -m build && twine upload dist/*
```

---

## 8. 靜態版本控制 — hatchling 手動設定

```toml
[build-system]
requires      = ["hatchling"]
build-backend = "hatchling.build"

[project]
name    = "your-package"
version = "1.0.0"   # 手動設定；在每次發佈前更新
```

在每次發佈前更新 `pyproject.toml` 中的 `version`。不需要 `__version__`
（照常透過 `importlib.metadata.version()` 存取）。

---

## 9. 切勿寫死版本號碼 (flit 除外)

當**不**使用 flit 時，在 `__init__.py` 中寫死 `__version__` 會建立雙重事實來源，且隨著時間推移會產生分歧。

```python
# 錯誤 — 當使用 setuptools_scm、hatchling 或 poetry 時：
__version__ = "1.0.0"    # 會過時；與安裝的套件版本產生分歧

# 正確 — 適用於除 flit 以外的所有後端：
from importlib.metadata import version, PackageNotFoundError
try:
    __version__ = version("your-package")
except PackageNotFoundError:
    __version__ = "0.0.0.dev0"
```

---

## 10. 相依項版本指定符

選擇正確的指定符樣式，以避免對使用者的環境造成污染。

```toml
# [project] 相依項 — 函式庫最佳實作：

"httpx>=0.24"            # 僅指定最低版本 — 優先推薦；讓使用者自由升級
"httpx>=0.24,<2.0"       # 僅在已知下一個主版本有重大變更時設定上限
"requests>=2.28,<3.0"    # 對於眾所周知的重大版本破壞是可以接受的

# 應用程式 / CLI (固定版本是可以的)：
"httpx==0.27.2"          # 鎖定精確版本以實現可重現的部署

# 在函式庫中絕不這樣做：
# "httpx~=0.24.0"        # 過於嚴苛；阻礙次要版本升級
# "httpx==0.27.*"        # 不是有效的 PEP 440
# "httpx"                # 無約束；容易因未來變更而損壞
```

---

## 11. PyPA 發佈指令

從程式碼到使用者安裝的正式序列。

```bash
# 步驟 1：標記發佈標籤 (如果已設定，將自動觸發 CI publish.yml)
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# 步驟 2 (僅作為手動備案)：在本機建構
python -m build
# 產出：
#   dist/your_package-1.2.3.tar.gz   (sdist)
#   dist/your_package-1.2.3-py3-none-any.whl  (wheel)

# 步驟 3：驗證
twine check dist/*

# 步驟 4：先在 TestPyPI 上測試 (首次發佈或有重大變更時)
twine upload --repository testpypi dist/*
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple/ your-package==1.2.3

# 步驟 5：發佈到正式的 PyPI
twine upload dist/*
# 或者透過 GitHub Actions (推薦)：
# 推送標籤 → publish.yml 執行 → pypa/gh-action-pypi-publish 透過 OIDC 處理上傳

# 步驟 6：驗證
pip install your-package==1.2.3
python -c "import your_package; print(your_package.__version__)"
```
