# CI/CD、發佈與更新日誌 (Changelog)

## 目錄
1. [更新日誌格式](#1-更新日誌格式)
2. [ci.yml — 檢查、型別檢查、測試矩陣](#2-ciyml)
3. [publish.yml — 由版本標籤觸發](#3-publishyml)
4. [PyPI 受信任的發佈 (不需 API 權杖)](#4-pypi-受信任的發佈)
5. [手動發佈備案](#5-手動發佈備案)
6. [發佈核取清單](#6-發佈核取清單)
7. [驗證 py.typed 是否包含在 wheel 中](#7-驗證-pytyped-是否包含在-wheel-中)
8. [語義化版本 (Semver) 變更類型指南](#8-語義化版本-semver-變更類型指南)

---

## 1. 更新日誌格式

維護一個遵循 [Keep a Changelog](https://keepachangelog.com/) 慣例的 `CHANGELOG.md`。
每個 PR 都應該更新 `[Unreleased]` 章節。在發佈之前，將這些項目移至帶有日期的新版本章節。

```markdown
# 更新日誌 (Changelog)

此專案的所有顯著變更都將記錄在檔案中。

格式基於 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)，
且此專案遵循 [語義化版本 (Semantic Versioning)](https://semver.org/spec/v2.0.0.html)。

---

## [Unreleased]

### 新增 (Added)
- (進行中的功能放在這裡)

---

## [1.0.0] - 2026-04-02

### 新增 (Added)
- 初始穩定版本
- 具有逐漸、嚴格和組合模式的 `YourMiddleware`
- 記憶體內後端 (無需額外相依項)
- 選用的 Redis 後端 (`pip install pkg[redis]`)
- 透過 `Depends(RouteThrottle(...))` 進行單一路由覆寫
- `py.typed` 標記 — PEP 561 型別化套件
- GitHub Actions CI：檢查、mypy、測試矩陣、受信任的發佈

### 變更 (Changed)
### 修正 (Fixed)
### 移除 (Removed)

---

## [0.1.0] - 2026-03-01

### 新增 (Added)
- 初始專案腳手架

[Unreleased]: https://github.com/you/your-package/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/you/your-package/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/you/your-package/releases/tag/v0.1.0
```

### 語義化版本 — 什麼變更會提升什麼位元

| 變更類型 | 提升位元 | 範例 |
|---|---|---|
| 重大 API 變更 | MAJOR | `1.0.0 → 2.0.0` |
| 新功能，回溯相容 | MINOR | `1.0.0 → 1.1.0` |
| 錯誤修正 | PATCH | `1.0.0 → 1.0.1` |

---

## 2. `ci.yml`

在每次推送和提取請求 (PR) 時執行。跨所有支援的 Python 版本進行測試。

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint:
    name: 檢查、格式化與型別檢查
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: 安裝開發相依項
        run: pip install -e ".[dev]"
      - name: ruff 檢查
        run: ruff check .
      - name: ruff 格式化檢查
        run: ruff format --check .
      - name: mypy
        run: |
          if [ -d "src" ]; then
              mypy src/
          else
              mypy {mod}/
          fi

  test:
    name: 測試 (Python ${{ matrix.python-version }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12", "3.13"]

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0    # setuptools_scm 讀取 git 標籤所必須

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: 安裝相依項
        run: pip install -e ".[dev]"

      - name: 執行測試並計算涵蓋率
        run: pytest --cov --cov-report=xml

      - name: 上傳涵蓋率報告
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

  test-redis:
    name: 測試 Redis 後端
    runs-on: ubuntu-latest
    services:
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: 安裝 Redis 選用項
        run: pip install -e ".[dev,redis]"

      - name: 執行 Redis 測試
        run: pytest tests/test_redis_backend.py -v
```

> **務必在每個檢出 (checkout) 步驟中新增 `fetch-depth: 0`**，當使用 `setuptools_scm` 時。
> 如果沒有完整的 git 歷史記錄，`setuptools_scm` 將找不到標籤，建構會因為版本偵測錯誤而失敗。

---

## 3. `publish.yml`

當您推送符合 `v*.*.*` 的標籤時自動觸發。使用受信任的發佈 (OIDC) — 不需要在存放庫秘密 (secrets) 中存放 API 權杖。

```yaml
# .github/workflows/publish.yml
name: 發佈至 PyPI

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  build:
    name: 建構散佈版
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0      # 對 setuptools_scm 至關重要

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: 安裝建構工具
        run: pip install build twine

      - name: 建構套件
        run: python -m build

      - name: 檢查散佈版
        run: twine check dist/*

      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish:
    name: 發佈至 PyPI
    needs: build
    runs-on: ubuntu-latest
    environment: pypi
    permissions:
      id-token: write     # 受信任的發佈 (OIDC) 所需

    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: 發佈至 PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
```

---

## 4. PyPI 受信任的發佈 (Trusted Publishing)

受信任的發佈使用 OpenID Connect (OIDC)，讓 PyPI 可以驗證發佈是否來自您特定的 GitHub Actions 工作流程 — 不需要長期有效的 API 權杖，也沒有輪換負擔。

### 一次性設定

1. 在 https://pypi.org 建立帳戶。
2. 前往 **Account → Publishing → Add a new pending publisher**。
3. 填寫：
   - GitHub 擁有者 (您的使用者名稱或組織)
   - 存放庫名稱
   - 工作流程檔案名稱：`publish.yml`
   - 環境名稱：`pypi`
4. 在 GitHub 中建立 `pypi` 環境：
   **repo → Settings → Environments → New environment → 命名為 `pypi`**

就這樣。下次您推送 `v*.*.*` 標籤時，工作流程將自動進行驗證。

---

## 5. 手動發佈備案

如果 CI 尚未設定好，或者您需要從您的電腦發佈：

```bash
pip install build twine

# 建構 wheel + sdist
python -m build

# 上傳前進行驗證
twine check dist/*

# 上傳至 PyPI
twine upload dist/*

# 或者先在 TestPyPI 上測試 (建議用於首次發佈)
twine upload --repository testpypi dist/*
pip install --index-url https://test.pypi.org/simple/ your-package
python -c "import your_package; print(your_package.__version__)"
```

---

## 6. 發佈核取清單

```
[ ] main/master 分支上所有測試皆通過
[ ] 已更新 CHANGELOG.md — 將 [Unreleased] 項目移至帶有日期的新版本章節
[ ] 更新 CHANGELOG 底部的高階差異比較連結
[ ] git tag vX.Y.Z
[ ] git push origin master --tags
[ ] 監視 GitHub Actions publish.yml 的執行情況
[ ] 在 PyPI 上驗證：pip install your-package==X.Y.Z
[ ] 測試已安裝的版本：
    python -c "import your_package; print(your_package.__version__)"
```

---

## 7. 驗證 py.typed 是否包含在 wheel 中

每次建構後，請確認包含型別化標記：

```bash
python -m build
unzip -l dist/your_package-*.whl | grep py.typed
# 必須印出：your_package/py.typed
# 如果缺失，請檢查 pyproject.toml 中的 [tool.setuptools.package-data]
```

如果它不在 wheel 中，即使您的程式碼是完整型別化的，使用者也無法獲得型別資訊。這是一個隱性失敗 — 請務必在發佈前驗證。

---

## 8. 語義化版本變更類型指南

| 變更 | 版本提升位元 | 範例 |
|---|---|---|
| 重大 API 變更 (移除/重新命名公用符號) | MAJOR | `1.2.3 → 2.0.0` |
| 新功能，回溯相容 | MINOR | `1.2.3 → 1.3.0` |
| 錯誤修正，無 API 變更 | PATCH | `1.2.3 → 1.2.4` |
| 預發佈版本 | 後綴 | `2.0.0a1 → 2.0.0rc1 → 2.0.0` |
| 僅針對封裝的修正 (無程式碼變更) | post-release | `1.2.3 → 1.2.3.post1` |
