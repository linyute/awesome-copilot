# 社群文件、PR 核取清單、反模式與發佈核取清單

## 目錄
1. [README.md 必要章節](#1-readmemd-必要章節)
2. [Docstrings — Google 風格](#2-docstrings--google-風格)
3. [CONTRIBUTING.md 範本](#3-contributingmd)
4. [SECURITY.md 範本](#4-securitymd)
5. [GitHub 問題範本](#5-github-問題範本)
6. [PR 核取清單](#6-pr-核取清單)
7. [應避免的反模式](#7-應避免的反模式)
8. [主要發佈核取清單](#8-主要發佈核取清單)

---

## 1. `README.md` 必要章節

一份好的 README 是推廣採用最重要的檔案。使用者會在 30 秒內根據 README 決定是否使用您的函式庫。

```markdown
# your-package

> 一句話描述 — 它是做什麼的，以及為什麼它很有用。

[![PyPI version](https://badge.fury.io/py/your-package.svg)](https://pypi.org/project/your-package/)
[![Python Versions](https://img.shields.io/pypi/pyversions/your-package)](https://pypi.org/project/your-package/)
[![CI](https://github.com/you/your-package/actions/workflows/ci.yml/badge.svg)](https://github.com/you/your-package/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/you/your-package/branch/master/graph/badge.svg)](https://codecov.io/gh/you/your-package)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 安裝

pip install your-package

# 搭配 Redis 後端：
pip install "your-package[redis]"

## 快速入門

(一個可直接複製貼上執行的範例 — 不需要額外設定即可執行)

from your_package import YourClient

client = YourClient(api_key="sk-...")
result = client.process({"input": "value"})
print(result)

## 功能特色

- 功能 1
- 功能 2

## 組態

| 參數 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| api_key | str | 必填 | 驗證憑證 |
| timeout | int | 30 | 請求逾時 (秒) |
| retries | int | 3 | 重試嘗試次數 |

## 後端

簡短比較 — 記憶體內 vs Redis — 以及何時使用各個後端。

## 貢獻

請參閱 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 更新日誌

請參閱 [CHANGELOG.md](./CHANGELOG.md)

## 授權

MIT — 請參閱 [LICENSE](./LICENSE)
```

---

## 2. Docstrings — Google 風格

為每個公用類別、方法和函式使用 Google 風格的 docstrings。IDE 會將這些顯示為工具提示，mkdocs/sphinx 可以從中自動產生文件，並向貢獻者清晰地傳達意圖。

```python
class YourClient:
    """
    用於 <目的> 的主要用戶端。

    引數：
        api_key: 驗證憑證。
        timeout: 請求逾時 (秒)。預設為 30。
        retries: 重試嘗試次數。預設為 3。

    引發：
        ValueError: 如果 api_key 為空或 timeout 為非正數。

    範例：
        >>> from your_package import YourClient
        >>> client = YourClient(api_key="sk-...")
        >>> result = client.process({"input": "value"})
    """
```

---

## 3. `CONTRIBUTING.md`

```markdown
# 貢獻至 your-package

## 開發設定

git clone https://github.com/you/your-package
cd your-package
pip install -e ".[dev]"
pre-commit install

## 執行測試

pytest

## 執行檢查

ruff check .
black . --check
mypy your_package/

## 提交 PR

1. 分叉 (Fork) 存放庫
2. 建立功能分支：`git checkout -b feat/your-feature`
3. 進行更改並附帶測試
4. 確保 CI 通過：`pre-commit run --all-files && pytest`
5. 更新 `CHANGELOG.md` 中的 `[Unreleased]` 章節
6. 開啟 PR — 使用 PR 範本

## 提交訊息格式 (Conventional Commits)

- `feat: 新增 Redis 後端`
- `fix: 修正逾時時的重試行為`
- `docs: 更新 README 快速入門`
- `chore: 將 ruff 提升至 0.5`
- `test: 為記憶體內後端新增邊緣案例`

## 回報錯誤

使用 GitHub 問題範本。請包含 Python 版本、套件版本以及一個最小可重現範例。
```

---

## 4. `SECURITY.md`

```markdown
# 安全性原則

## 支援的版本

| 版本 | 是否支援 |
|---|---|
| 1.x.x   | 是       |
| < 1.0   | 否       |

## 回報弱點

請勿針對安全性弱點開啟公開的 GitHub 問題。

回報管道：GitHub 私人安全性回報 (偏好)
或電子郵件：security@yourdomain.com

請包含：
- 弱點描述
- 重現步驟
- 潛在影響
- 建議修正方案 (如果有)

我們的目標是在 48 小時內確認收到，並在 14 天內解決。
```

---

## 5. GitHub 問題範本

### `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: 錯誤回報 (Bug Report)
about: 回報一個可重現的錯誤
labels: bug
---

**Python 版本：**
**套件版本：**

**描述錯誤：**

**最小可重現範例：**
```python
# 在此貼上程式碼
```

**預期行為：**

**實際行為：**
```

### `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: 功能請求 (Feature Request)
about: 建議一項新功能或增強功能
labels: enhancement
---

**這將解決的問題：**

**建議的解決方案：**

**考慮過的替代方案：**
```

---

## 6. PR 核取清單

在要求檢閱前必須檢查所有項目。CI 必須完全為綠色。

### 程式碼品質門檻
```
[ ] ruff check . — 零錯誤
[ ] black . --check — 零格式問題
[ ] isort . --check-only — 匯入排序正確
[ ] mypy your_package/ — 零型別錯誤
[ ] pytest — 所有測試皆通過
[ ] 涵蓋率 >= 80% (由 pyproject.toml 中的 fail_under 強制執行)
[ ] 所有 GitHub Actions 工作流程皆為綠色
```

### 結構
```
[ ] pyproject.toml：name, dynamic/version, description, requires-python, license, authors,
    keywords (10+), classifiers, dependencies, 所有 [project.urls] 皆已填寫
[ ] 若使用 setuptools_scm，則 dynamic = ["version"]
[ ] [tool.setuptools_scm] 具有 local_scheme = "no-local-version"
[ ] 若使用 setuptools_scm，則必須存在 setup.py 墊片 (shim)
[ ] 套件目錄中存在 py.typed 標記檔案 (空檔案)
[ ] py.typed 列在 [tool.setuptools.package-data] 中
[ ] pyproject.toml 中具有 "Typing :: Typed" 分類器
[ ] __init__.py 具有 __all__ 並列出所有公用符號
[ ] __version__ 透過 importlib.metadata 取得 (而非寫死的字串)
```

### 測試
```
[ ] conftest.py 具有用於用戶端和後端的共享 fixture
[ ] 已測試核心成功路徑 (happy path)
[ ] 已測試錯誤條件與邊緣案例
[ ] 每個後端皆已獨立測試
[ ] Redis 後端在帶有 redis 服務的獨立 CI 作業中測試 (如果適用)
[ ] pyproject.toml 中具有 asyncio_mode = "auto" (用於非同步測試)
[ ] 所有 CI 檢出步驟中皆具有 fetch-depth: 0
```

### 選用後端 (如果適用)
```
[ ] BaseBackend 抽象類別定義了介面
[ ] MemoryBackend 可在零額外相依項下運作
[ ] RedisBackend 若未安裝 redis，則會引發帶有明確 pip 安裝提示的 ImportError
[ ] 兩個後端皆已獨立進行單元測試
[ ] 在 [project.optional-dependencies] 中宣告了 redis 選用項
[ ] README 顯示了兩種安裝路徑 (基礎版與 [redis])
```

### 更新日誌與文件
```
[ ] 已在 [Unreleased] 下更新 CHANGELOG.md
[ ] README 具有：說明、安裝、快速入門、組態表、徽章、授權
[ ] 所有公用符號皆具有 Google 風格的 docstrings
[ ] CONTRIBUTING.md：開發設定、測試/檢查指令、PR 指示
[ ] SECURITY.md：支援的版本、回報流程
[ ] .github/ISSUE_TEMPLATE/bug_report.md
[ ] .github/ISSUE_TEMPLATE/feature_request.md
```

### CI/CD
```
[ ] ci.yml：檢查 + mypy + 測試矩陣 (所有支援的 Python 版本)
[ ] ci.yml：為帶有 redis 服務的 Redis 後端建立獨立作業
[ ] publish.yml：由 v*.*.* 標籤觸發，使用受信任的發佈 (OIDC)
[ ] 所有工作流程檢出步驟中皆具有 fetch-depth: 0
[ ] 在 GitHub 存放庫 Settings → Environments 中建立了 pypi 環境
[ ] 存放庫秘密中無 API 權杖
```

---

## 7. 應避免的反模式

| 反模式 | 為什麼不好 | 正確做法 |
|---|---|---|
| 使用 setuptools_scm 時寫死 `__version__ = "1.0.0"` | 在第一個 git 標籤後就會過時 | 使用 `importlib.metadata.version()` |
| CI 檢出中缺少 `fetch-depth: 0` | setuptools_scm 找不到標籤 → 版本 = `0.0.0+dev` | 在**每個**檢出步驟中新增 `fetch-depth: 0` |
| 未設定 `local_scheme` | `+g<hash>` 後綴會導致 PyPI 上傳失敗 (拒絕本機版本) | `local_scheme = "no-local-version"` |
| 缺少 `py.typed` 檔案 | IDE 和 mypy 不會將套件視為已型別化 | 在套件根目錄建立空的 `py.typed` |
| `py.typed` 不在 `package-data` 中 | 已安裝的 wheel 中缺少該檔案 — 無效 | 新增至 `[tool.setuptools.package-data]` |
| 在模組頂部匯入選用相依項 | 所有使用者在 `import your_package` 時會遇到 `ImportError` | 在需要它的函式/類別內部進行延遲匯入 |
| 在 `setup.py` 中重複中繼資料 (metadata) | 與 `pyproject.toml` 衝突；內容會產生偏移 | 保持 `setup.py` 僅為 3 行的墊片 |
| 涵蓋率組態中沒有 `fail_under` | 涵蓋率倒退不會被察覺 | 設定 `fail_under = 80` |
| CI 中沒有 mypy | 型別錯誤會默默累積 | 在 `ci.yml` 中新增 mypy 步驟 |
| GitHub Secrets 中存放 PyPI API 權杖 | 安全風險，輪換負擔 | 使用受信任的發佈 (OIDC) |
| 直接提交至 `main`/`master` | 繞過 CI 檢查 | 透過 `no-commit-to-branch` pre-commit 掛鉤強制執行 |
| CHANGELOG 中缺少 `[Unreleased]` 章節 | 變更會堆積並在發佈時被遺忘 | 每個 PR 保持 `[Unreleased]` 更新 |
| 在函式庫中固定精確的相依項版本 | 破毀使用者的相依項解析 | 僅使用 `>=` 下限；避免使用 `==` |
| `__init__.py` 中沒有 `__all__` | 使用者可能會意外匯入內部輔助函式 | 在每個公用符號中宣告 `__all__` |
| 測試中使用 `from your_package import *` | 即使匯入損壞，測試也能通過 | 始終使用明確匯入 |
| 沒有 `SECURITY.md` | 沒有負責任的弱點揭露路徑 | 新增帶有回應時程的檔案 |
| 型別提示中到處都是 `Any` | 完全破毀了 mypy 的作用 | 對於真正的任意值使用 `object` |
| `Union` 回傳型別 | 強制每個呼叫者編寫 `isinstance()` 檢查 | 回傳具體型別；使用多載 (overloads) |
| `setup.cfg` + `pyproject.toml` 同時存在 | 衝突且讓貢獻者感到困惑 | 將所有內容遷移至 `pyproject.toml` |
| 在未標記標籤的提交上發佈 | 版本號碼毫無意義 | 發佈前始終標記標籤 |
| 未在所有支援的 Python 版本上測試 | 損壞是由使用者而非您發現的 | 在 CI 中進行矩陣測試 |
| `license = {text = "MIT"}` (舊格式) | 已棄用；PEP 639 使用 SPDX 字串 | `license = "MIT"` |
| 沒有問題範本 | 錯誤回報不一致 | 新增 `bug_report.md` + `feature_request.md` |

---

## 8. 主要發佈核取清單

在推送發佈標籤前，請檢查每一項。CI 必須完全為綠色。

### 程式碼品質
```
[ ] ruff check . — 零錯誤
[ ] ruff format . --check — 零格式問題
[ ] mypy src/your_package/ — 零型別錯誤
[ ] pytest — 所有測試皆通過
[ ] 涵蓋率 >= 80% (由 pyproject.toml 中的 fail_under 強制執行)
[ ] 所有 GitHub Actions CI 作業皆為綠色 (檢查 + 測試矩陣)
```

### 專案結構
```
[ ] pyproject.toml — name, description, requires-python, license (SPDX 字串), authors,
    keywords (10+), classifiers (Python 版本 + Typing :: Typed), urls (所有 5 個欄位)
[ ] 已設定 dynamic = ["version"] (如果使用 setuptools_scm 或 hatch-vcs)
[ ] [tool.setuptools_scm] 具有 local_scheme = "no-local-version"
[ ] 如果使用 setuptools_scm，則必須存在 setup.py 墊片
[ ] 存在 py.typed 標記檔案 (套件根目錄中的空檔案)
[ ] py.typed 列在 [tool.setuptools.package-data] 中
[ ] pyproject.toml 中具有 "Typing :: Typed" 分類器
[ ] __init__.py 具有 __all__ 並列出所有公用符號
[ ] __version__ 從 importlib.metadata 讀取 (而非寫死的)
```

### 測試
```
[ ] conftest.py 具有用於用戶端和後端的共享 fixture
[ ] 已測試核心成功路徑
[ ] 已測試錯誤條件與邊緣案例
[ ] 每個後端皆已獨立測試
[ ] pyproject.toml 中具有 asyncio_mode = "auto" (用於非同步測試)
[ ] 所有 CI 檢出步驟中皆具有 fetch-depth: 0
```

### CHANGELOG 與文件
```
[ ] CHANGELOG.md：[Unreleased] 項目已移至帶有日期的新版本章節
[ ] README 具有：說明、安裝指令、快速入門、組態表、徽章
[ ] 所有公用符號皆具有 Google 風格的 docstrings
[ ] CONTRIBUTING.md：開發設定、測試/檢查指令、PR 指示
[ ] SECURITY.md：支援的版本、帶有時程的回報流程
```

### 版本控制
```
[ ] 在您計劃標記標籤的提交上，所有 CI 檢查皆已通過
[ ] CHANGELOG.md 已更新並提交
[ ] Git 標籤遵循 v1.2.3 格式 (語義化版本，v 前綴)
[ ] 建構的 wheel 名稱中不會出現過時的 local_scheme 後綴
```

### CI/CD
```
[ ] ci.yml：檢查 + mypy + 測試矩陣 (所有支援的 Python 版本)
[ ] publish.yml：由 v*.*.* 標籤觸發，使用受信任的發佈 (OIDC)
[ ] 在 GitHub 存放庫 Settings → Environments 中建立了 pypi 環境
[ ] 存放庫秘密中無儲存的 API 權杖
```

### 發佈指令序列
```bash
# 1. 執行完整的本機驗證
ruff check . ; ruff format . --check ; mypy src/your_package/ ; pytest

# 2. 更新 CHANGELOG.md — 將 [Unreleased] 移至 [x.y.z]
# 3. 提交更新日誌
git add CHANGELOG.md
git commit -m "chore: prepare release vX.Y.Z"

# 4. 標記標籤並推送 — 這將自動觸發 publish.yml
git tag vX.Y.Z
git push origin main --tags

# 5. 監視：https://github.com/<您>/<套件>/actions
# 6. 驗證：https://pypi.org/project/your-package/
```
