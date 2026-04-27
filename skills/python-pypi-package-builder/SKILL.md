---
name: python-pypi-package-builder
description: '這是一個端對端的技能，用於建構、測試、檢查、版本控制並發佈生產級別的 Python 函式庫到 PyPI。涵蓋所有四種建構後端 (setuptools+setuptools_scm, hatchling, flit, poetry)、PEP 440 版本控制、語義化版本、動態 git 標籤版本控制、OOP/SOLID 設計、型別提示 (PEP 484/526/544/561)、受信任的發佈 (OIDC) 以及完整的 PyPA 封裝流程。適用於：建立 Python 套件、可透過 pip 安裝的 SDK、CLI 工具、框架外掛程式、pyproject.toml 設定、py.typed、setuptools_scm、semver、mypy、pre-commit、GitHub Actions CI/CD 或 PyPI 發佈。'
---

# Python PyPI 套件建構器技能

這是一份完整且經過實戰測試的指南，用於建構、測試、檢查、版本控制、型別化以及發佈生產級別的 Python 函式庫到 PyPI — 從第一次提交到社群就緒的發佈。

> **AI 代理程式指示：** 在撰寫任何一行程式碼或建立任何檔案之前，請閱讀整份文件。這裡包含了關於版面配置、後端、版本控制策略、模式、CI 的每項決策規則。請依序遵循決策樹。此技能適用於任何 Python 套件類型（公用程式、SDK、CLI、外掛程式、資料函式庫）。請勿跳過任何章節。

---

## 快速導覽

| 此檔案中的章節 | 涵蓋內容 |
|---|---|
| [1. 技能觸發](#1-技能觸發) | 何時載入此技能 |
| [2. 套件類型決策](#2-套件類型決策) | 辨識您正在建構的內容 |
| [3. 資料夾結構決策](#3-資料夾結構決策) | src/ vs 扁平 (flat) vs 單一存放庫 (monorepo) |
| [4. 建構後端決策](#4-建構後端決策) | setuptools / hatchling / flit / poetry |
| [5. PyPA 封裝流程](#5-pypa-封裝流程) | 標準發佈管線 |
| [6. 專案結構範本](#6-專案結構範本) | 每個選項的完整版面配置 |
| [7. 版本控制策略](#7-版本控制策略) | PEP 440, semver, 動態 vs 靜態 |

| 參考檔案 | 涵蓋內容 |
|---|---|
| `references/pyproject-toml.md` | 所有四種後端範本、`setuptools_scm`、`py.typed`、工具組態 |
| `references/library-patterns.md` | OOP/SOLID、型別提示、核心類別設計、工廠、協定、CLI |
| `references/testing-quality.md` | `conftest.py`、單元/後端/非同步測試、ruff/mypy/pre-commit |
| `references/ci-publishing.md` | `ci.yml`、`publish.yml`、受信任的發佈、TestPyPI、CHANGELOG、發佈核取清單 |
| `references/community-docs.md` | README、docstrings、CONTRIBUTING、SECURITY、反模式、主要核取清單 |
| `references/architecture-patterns.md` | 後端系統 (外掛程式/策略)、組態層、傳輸層、CLI、後端注入 |
| `references/versioning-strategy.md` | PEP 440、SemVer、預發佈、setuptools_scm 深入探討、flit 靜態、決策引擎 |
| `references/release-governance.md` | 分支策略、分支保護、OIDC、標籤作者驗證、防止無效標籤 |
| `references/tooling-ruff.md` | 僅使用 Ruff 的設定 (取代 black/isort)、mypy 組態、pre-commit、asyncio_mode=auto |

**腳手架腳本：** 執行 `python skills/python-pypi-package-builder/scripts/scaffold.py --name 您的套件名稱`
以在一個指令中產生整個目錄版面配置、虛設檔案 (stub files) 和 `pyproject.toml`。

---

## 1. 技能觸發

每當使用者想要執行以下操作時，請載入此技能：

- 建立、建構腳手架或發佈 Python 套件或函式庫到 PyPI
- 建構可透過 pip 安裝的 SDK、公用程式、CLI 工具或框架擴充功能
- 為 Python 專案設定 `pyproject.toml`、檢查、mypy、pre-commit 或 GitHub Actions
- 了解版本控制 (`setuptools_scm`、PEP 440、semver、靜態版本控制)
- 了解 PyPA 規格：`py.typed`、`MANIFEST.in`、`RECORD`、分類器
- 使用受信任的發佈 (OIDC) 或 API 權杖發佈到 PyPI
- 重構現有套件以遵循現代 Python 封裝標準
- 為 Python 函式庫新增型別提示、協定 (protocols)、ABCs 或 dataclasses
- 將 OOP/SOLID 設計模式套用到 Python 套件
- 在建構後端 (setuptools, hatchling, flit, poetry) 之間做出選擇

**遇到以下語句時也會觸發：** 「建構 Python SDK」、「發佈我的函式庫」、「設定 PyPI CI」、
「建立 pip 套件」、「如何發佈到 PyPI」、「pyproject.toml 說明」、「PEP 561 型別化」、
「setuptools_scm 版本」、「semver Python」、「PEP 440」、「git tag 發佈」、「受信任的發佈」。

---

## 2. 套件類型決策

在撰寫任何程式碼**之前**，先辨識使用者正在建構的內容。每種類型都有不同的模式。

### 決策表

| 類型 | 核心模式 | 進入點 | 關鍵相依項 | 範例套件 |
|---|---|---|---|---|
| **公用程式函式庫** | 純函式 + 輔助工具模組 | 僅限匯入 API | 極少 | `arrow`, `humanize`, `boltons`, `more-itertools` |
| **API 用戶端 / SDK** | 帶有方法、驗證、重試邏輯的類別 | 僅限匯入 API | `httpx` 或 `requests` | `boto3`, `stripe-python`, `openai` |
| **CLI 工具** | 指令函式 + 引數解析器 | `[project.scripts]` 或 `[project.entry-points]` | `click` 或 `typer` | `black`, `ruff`, `httpie`, `rich` |
| **框架外掛程式** | 外掛程式類別、掛鉤註冊 | `[project.entry-points."framework.plugin"]` | 框架相依項 | `pytest-*`, `django-*`, `flask-*` |
| **資料處理函式庫** | 類別 + 功能管線 | 僅限匯入 API | 選用：`numpy`, `pandas` | `pydantic`, `marshmallow`, `cerberus` |
| **混合 / 通用** | 上述類型的組合 | 視情況而定 | 視情況而定 | 許多現實世界的套件 |

**決策規則：** 如果不明確，請詢問使用者。套件可以組合多種類型（例如：帶有 CLI 進入點的 SDK） — 請使用主類型來進行結構化決策，並在其上添加次要類型的模式。

有關每種類型的實作模式，請參閱 `references/library-patterns.md`。

### 套件命名規則

- PyPI 名稱：全小寫、連字號 — `my-python-library`
- Python 匯入名稱：底線 — `my_python_library`
- 開始前請檢查可用性：https://pypi.org/search/
- 避免與熱門套件名稱重疊（先驗證 `pip install <名稱>` 會失敗）

---

## 3. 資料夾結構決策

### 決策樹

```
套件是否具有 5 個以上的內部模組，或者有多個貢獻者，或者具有複雜的子套件？
├── 是 → 使用 src/ 配置 (layout)
│         理由：防止在開發期間意外匯入未安裝的程式碼；
│         將原始碼與專案根目錄檔案分開；PyPA 針對大型專案的建議做法。
│
├── 否 → 它是否為單一模組、專注的套件（例如：一個檔案 + 輔助工具）？
│         ├── 是 → 使用 扁平 (flat) 配置
│         └── 否 (中等複雜度) → 使用 扁平配置，如果成長則遷移到 src/
│
└── 它是否為同一個命名空間下的多個相關套件（例如：myorg.http, myorg.db）？
          └── 是 → 使用 命名空間/單一存放庫 (namespace/monorepo) 配置
```

### 快速規則摘要

| 情況 | 使用建議 |
|---|---|
| 新專案，未來規模未知 | `src/` 配置 (最安全的預設值) |
| 單一用途，1–4 個模組 | 扁平配置 |
| 大型函式庫，多位貢獻者 | `src/` 配置 |
| 一個存放庫中有多個套件 | 命名空間 / 單一存放庫 |
| 遷移舊有的扁平專案 | 保持扁平；在下一個主版本遷移到 `src/` |

---

## 4. 建構後端決策

### 決策樹

```
使用者是否需要自動從 git 標籤衍生版本？
├── 是 → 使用 setuptools + setuptools_scm
│         (git tag v1.0.0 → 這就是您的發佈工作流程)
│
└── 否 → 使用者是否想要一個全能工具（相依項 + 建構 + 發佈）？
          ├── 是 → 使用 poetry (v2+ 支援標準的 [project] 資料表)
          │
          └── 否 → 該套件是否為純 Python 且無 C 擴充功能？
                    ├── 是，偏好最少組態 → 使用 flit
                    │   (零組態，自動從 __version__ 探索版本)
                    │
                    └── 是，偏好現代且快速 → 使用 hatchling
                        (零組態、外掛程式系統、不需要 setup.py)

套件是否具有 C/Cython/Fortran 擴充功能？
└── 是 → 必須使用 setuptools (唯一完整支援原生擴充功能的後端)
```

### 後端比較

| 後端 | 版本來源 | 組態 | C 擴充功能 | 最適合 |
|---|---|---|---|---|
| `setuptools` + `setuptools_scm` | git 標籤 (自動) | `pyproject.toml` + 選用的 `setup.py` 墊片 | 支援 | 具有 git 標籤發佈的專案；任何複雜度 |
| `hatchling` | 手動或外掛程式 | 僅 `pyproject.toml` | 不支援 | 新的純 Python 專案；快速、現代 |
| `flit` | `__init__.py` 中的 `__version__` | 僅 `pyproject.toml` | 不支援 | 非常簡單、單一模組的套件 |
| `poetry` | `pyproject.toml` 欄位 | 僅 `pyproject.toml` | 不支援 | 想要整合式相依項管理的小組 |

有關所有四種完整的 `pyproject.toml` 範本，請參閱 `references/pyproject-toml.md`。

---

## 5. PyPA 封裝流程

這是從原始碼到使用者安裝的標準端對端流程。
**發佈前必須了解每個步驟。**

```
1. 原始碼樹 (SOURCE TREE)
   您的程式碼在版本控制系統中 (git)
   └── pyproject.toml 描述中繼資料 + 建構系統

2. 建構 (BUILD)
   python -m build
   └── 在 dist/ 中產生兩個構件：
       ├── *.tar.gz   → 原始碼散佈版 (sdist)
       └── *.whl      → 建構散佈版 (wheel) — pip 的首選

3. 驗證 (VALIDATE)
   twine check dist/*
   └── 檢查中繼資料、README 渲染效果以及 PyPI 相容性

4. 測試發佈 (TEST PUBLISH) (僅限首次發佈)
   twine upload --repository testpypi dist/*
   └── 驗證：pip install --index-url https://test.pypi.org/simple/ 您的套件

5. 發佈 (PUBLISH)
   twine upload dist/*          ← 手動備案
   或 GitHub Actions publish.yml  ← 推薦做法 (受信任的發佈 / OIDC)

6. 使用者安裝 (USER INSTALL)
   pip install 您的套件
   pip install "您的套件[extra]"
```

### 關鍵 PyPA 概念

| 概念 | 它的含義 |
|---|---|
| **sdist** | 原始碼散佈版 — 您的原始碼 + 中繼資料；當沒有 wheel 可用時使用 |
| **wheel (.whl)** | 預建二進位檔 — pip 直接解壓到 site-packages；無需建構步驟 |
| **PEP 517/518** | 透過 `pyproject.toml [build-system]` 資料表實現的標準建構系統介面 |
| **PEP 621** | `pyproject.toml` 中的標準 `[project]` 資料表；所有現代後端都支援它 |
| **PEP 639** | `license` 鍵作為 SPDX 字串（例如：`"MIT"`, `"Apache-2.0"`） — 而非 `{text = "MIT"}` |
| **PEP 561** | `py.typed` 空標記檔案 — 告知 mypy/IDE 此套件提供型別資訊 |

有關完整的 CI 工作流程和發佈設定，請參閱 `references/ci-publishing.md`。

---

## 6. 專案結構範本

### A. src/ 配置 (推薦作為新專案的預設值)

```
your-package/
├── src/
│   └── your_package/
│       ├── __init__.py           # 公用 API: __all__, __version__
│       ├── py.typed              # PEP 561 標記 — 空檔案
│       ├── core.py               # 主要實作
│       ├── client.py             # (API 用戶端類型) 或移除
│       ├── cli.py                # (CLI 類型) click/typer 指令，或移除
│       ├── config.py             # 設定 / 組態資料類別
│       ├── exceptions.py         # 自訂例外層級
│       ├── models.py             # 資料類別、Pydantic 模型、TypedDicts
│       ├── utils.py              # 內部輔助工具 (若為私有則加上 _utils 前綴)
│       ├── types.py              # 共享的型別別名與 TypeVars
│       └── backends/             # (外掛程式模式) — 若不需要則移除
│           ├── __init__.py       # 協定 / ABC 介面定義
│           ├── memory.py         # 預設零相依性實作
│           └── redis.py          # 選用的沉重實作
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # 共享的 fixtures
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_core.py
│   │   ├── test_config.py
│   │   └── test_models.py
│   ├── integration/
│   │   ├── __init__.py
│   │   └── test_backends.py
│   └── e2e/                      # 選用：端對端測試
│       └── __init__.py
├── docs/                         # 選用：mkdocs 或 sphinx
├── scripts/
│   └── scaffold.py
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── publish.yml
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── .pre-commit-config.yaml
├── pyproject.toml
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
├── README.md
└── .gitignore
```

### B. 扁平配置 (小型 / 專注的套件)

```
your-package/
├── your_package/         # ← 在根目錄，不在 src/ 內部
│   ├── __init__.py
│   ├── py.typed
│   └── ... (內部結構相同)
├── tests/
└── ... (頂層檔案相同)
```

### C. 命名空間 / 單一存放庫配置 (多個相關套件)

```
your-org/
├── packages/
│   ├── your-org-core/
│   │   ├── src/your_org/core/
│   │   └── pyproject.toml
│   ├── your-org-http/
│   │   ├── src/your_org/http/
│   │   └── pyproject.toml
│   └── your-org-cli/
│       ├── src/your_org/cli/
│       └── pyproject.toml
├── .github/workflows/
└── README.md
```

每個子套件都有自己的 `pyproject.toml`。它們透過 PEP 420 隱含命名空間套件（命名空間根目錄中沒有 `__init__.py`）共用 `your_org` 命名空間。

### 內部模組指南

| 檔案 | 用途 | 何時包含 |
|---|---|---|
| `__init__.py` | 公用 API 表面；重新匯出；`__version__` | 始終包含 |
| `py.typed` | PEP 561 型別化套件標記 (空檔案) | 始終包含 |
| `core.py` | 主要類別 / 核心邏輯 | 始終包含 |
| `config.py` | 設定資料類別或 Pydantic 模型 | 當可組態時 |
| `exceptions.py` | 例外層級 (`YourBaseError` → 具體錯誤) | 始終包含 |
| `models.py` | 資料模型 / DTOs / TypedDicts | 當資料量大時 |
| `utils.py` | 內部輔助工具 (不屬於公用 API) | 視需要而定 |
| `types.py` | 共享的 `TypeVar`, `TypeAlias`, `Protocol` 定義 | 當型別複雜時 |
| `cli.py` | CLI 進入點 (click/typer) | 僅限 CLI 類型 |
| `backends/` | 外掛程式/策略模式 | 當有可換掉的實作時 |
| `_compat.py` | Python 版本相容性墊片 | 需要支援 3.9–3.13 相容性時 |

---

## 7. 版本控制策略

### PEP 440 — 標準規範

```
正式形式： N[.N]+[{a|b|rc}N][.postN][.devN]

範例：
  1.0.0          穩定版本
  1.0.0a1        Alpha (預發佈)
  1.0.0b2        Beta
  1.0.0rc1       版本候選
  1.0.0.post1    發佈後修正 (例如：僅封裝修正)
  1.0.0.dev1     開發快照 (不適用於 PyPI)
```

### 語義化版本 (Semantic Versioning) (推薦)

```
MAJOR.MINOR.PATCH

MAJOR：重大的 API 變更 (移除/重新命名公用函式/類別/引數)
MINOR：新功能，完全回溯相容
PATCH：錯誤修正，無 API 變更
```

### 使用 setuptools_scm 的動態版本控制 (推薦用於 git 標籤工作流程)

```bash
# 運作方式：
git tag v1.0.0          →  安裝的版本 = 1.0.0
git tag v1.1.0          →  安裝的版本 = 1.1.0
(標籤後的提交)          →  版本 = 1.1.0.post1 (針對 PyPI 移除後綴)

# 在程式碼中 — 使用 setuptools_scm 時切勿寫死：
from importlib.metadata import version, PackageNotFoundError
try:
    __version__ = version("您的套件名稱")
except PackageNotFoundError:
    __version__ = "0.0.0-dev"    # 針對未安裝的開發簽出版本的回退值
```

必要的 `pyproject.toml` 組態：
```toml
[tool.setuptools_scm]
version_scheme = "post-release"
local_scheme   = "no-local-version"   # 防止 +g<雜湊值> 導致 PyPI 上傳失敗
```

**至關重要：** 在每個 CI 檢出步驟中始終設定 `fetch-depth: 0`。如果沒有完整的 git 歷史記錄，`setuptools_scm` 將找不到標籤，建構版本會默默回退到 `0.0.0+dev`。

### 靜態版本控制 (flit, hatchling 手動設定, poetry)

```python
# your_package/__init__.py
__version__ = "1.0.0"    # 每次發佈前手動更新此處
```

### 相依項版本指定符最佳實作

```toml
# 在 [project] 相依項中：
"httpx>=0.24"            # 最低版本 — 函式庫優先建議使用
"httpx>=0.24,<1.0"       # 僅在已知下一個主版本有重大變更時設定上限
"httpx==0.27.0"          # 僅在應用程式中精確固定，不在函式庫中這樣做

# 絕不在函式庫中這樣做 — 這會破壞使用者的相依項解析：
# "httpx~=0.24.0"        # 過於嚴苛
# "httpx==0.27.*"        # 脆弱
```

### 提升版本 → 發佈流程

```bash
# 1. 更新 CHANGELOG.md — 將 [Unreleased] 項目移至 [x.y.z] - YYYY-MM-DD
# 2. 提交更新日誌
git add CHANGELOG.md
git commit -m "chore: 準備發佈 vX.Y.Z"
# 3. 標記標籤並推送 — 這將自動觸發 publish.yml
git tag vX.Y.Z
git push origin main --tags
# 4. 監視 GitHub Actions → 在 https://pypi.org/project/您的套件名稱/ 進行驗證
```

有關所有四種後端的完整 pyproject.toml 範本，請參閱 `references/pyproject-toml.md`。

---

## 下一步

了解結構與決策後：

1. **設定 `pyproject.toml`** → `references/pyproject-toml.md`
   所有四種後端範本 (setuptools+scm, hatchling, flit, poetry)、完整工具組態、
   `py.typed` 設定、版本控制組態。

2. **撰寫您的函式庫程式碼** → `references/library-patterns.md`
   OOP/SOLID 原則、型別提示 (PEP 484/526/544/561)、核心類別設計、工廠函式、
   `__init__.py`、外掛程式/後端模式、CLI 進入點。

3. **新增測試與程式碼品質** → `references/testing-quality.md`
   `conftest.py`、單元/後端/非同步測試、參數化、ruff/mypy/pre-commit 設定。

4. **設定 CI/CD 與發佈** → `references/ci-publishing.md`
   `ci.yml`、`publish.yml`（搭配受信任的發佈，OIDC，無須 API 權杖）、CHANGELOG 格式、
   發佈核取清單。

5. **針對社群/OSS 進行磨練** → `references/community-docs.md`
   README 章節、docstring 格式、CONTRIBUTING、SECURITY、問題範本、反模式
   表格以及主要發佈核取清單。

6. **設計後端、組態、傳輸、CLI** → `references/architecture-patterns.md`
   後端系統 (外掛程式/策略模式)、Settings 資料類別、HTTP 傳輸層、
   搭配 click/typer 的 CLI、後端注入規則。

7. **選擇並實作版本控制策略** → `references/versioning-strategy.md`
   PEP 440 正式形式、SemVer 規則、預發佈識別碼、setuptools_scm 深入探討、
   flit 靜態版本控制、決策引擎 (預設/初學者/極簡)。

8. **治理發佈並保護發佈管線** → `references/release-governance.md`
   分支策略、分支保護規則、OIDC 受信任的發佈設定、CI 中的標籤作者
   驗證、標籤格式強制執行、完整的治理型 `publish.yml`。

9. **使用 Ruff 簡化工具** → `references/tooling-ruff.md`
   僅使用 Ruff 的設定（取代 black/isort/flake8）、mypy 組態、pre-commit 掛鉤、
   asyncio_mode=auto (移除 @pytest.mark.asyncio)、遷移指南。
