# 發佈治理 — 分支、保護、OIDC 與存取控制

## 目錄
1. [分支策略](#1-分支策略)
2. [分支保護規則](#2-分支保護規則)
3. [基於標籤的發佈模型](#3-基於標籤的發佈模型)
4. [角色型存取控制 (RBAC)](#4-角色型存取控制)
5. [使用 OIDC 的安全發佈 (受信任的發佈)](#5-使用-oidc-的安全發佈-受信任的發佈)
6. [在 CI 中驗證標籤作者](#6-在-ci-中驗證標籤作者)
7. [防止無效的發佈標籤](#7-防止無效的發佈標籤)
8. [帶有治理門檻的完整 `publish.yml`](#8-帶有治理門檻的完整-publishyml)

---

## 1. 分支策略

使用清晰的分支層級來將開發工作與可發佈的程式碼分開。

```
main          ← 穩定分支；僅接收來自 develop 或 hotfix/* 的 PR
develop       ← 整合分支；所有功能的 PR 首先合併至此
feature/*     ← 新功能 (例如：feature/add-redis-backend)
fix/*         ← 錯誤修正 (例如：fix/memory-leak-on-close)
hotfix/*      ← 緊急生產環境修正；直接 PR 到 main + 挑選 (cherry-pick) 到 develop
release/*     ← (選用) 發佈準備 (例如：release/v2.0.0)
```

### 規則

| 規則 | 為什麼 |
|---|---|
| 不得直接推送至 `main` | 防止意外破壞穩定分支 |
| 所有變更皆透過 PR | 強制在合併前進行檢閱 + CI |
| 至少需要一個核准 | 所有變更都有第二雙眼睛盯著 |
| CI 必須通過 | 絕不合併損壞的程式碼 |
| 僅標籤觸發發佈 | 禁止從分支推送進行臨時發佈 |

---

## 2. 分支保護規則

在 **GitHub → Settings → Branches → Add rule** 中為 `main` 和 `develop` 設定這些規則。

### 針對 `main`

```yaml
# 對等的 GitHub 分支保護組態 (用於說明文件)
branch: main
rules:
  - require_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
  - require_status_checks_to_pass:
      contexts:
        - "Lint, Format & Type Check"
        - "Test (Python 3.11)"   # 至少包含此項；新增所有矩陣版本
      strict: true               # 分支在合併前必須是最新狀態
  - restrict_pushes:
      allowed_actors: []         # 無人 — 僅限 PR 合併
  - require_linear_history: true # 防止在 main 上產生合併提交
```

### 針對 `develop`

```yaml
branch: develop
rules:
  - require_pull_request_reviews:
      required_approving_review_count: 1
  - require_status_checks_to_pass:
      contexts: ["CI"]
      strict: false   # 對於整合分支較不嚴格
```

### 透過 GitHub CLI 設定

```bash
# 保護 main 分支 (需要 gh CLI 和管理員權限)
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Lint, Format & Type Check", "Test (Python 3.11)"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null
}
EOF
```

---

## 3. 基於標籤的發佈模型

**只有 `main` 分支上的附註標籤 (annotated tags) 會觸發發佈。** 分支推送和 PR 合併永遠不會執行發佈。

### 標籤命名慣例

```
vMAJOR.MINOR.PATCH           # 穩定版：         v1.2.3
vMAJOR.MINOR.PATCHaN         # Alpha 版：       v2.0.0a1
vMAJOR.MINOR.PATCHbN         # Beta 版：        v2.0.0b1
vMAJOR.MINOR.PATCHrcN        # 版本候選版：      v2.0.0rc1
```

### 發佈工作流程

```bash
# 1. 透過 PR 將 develop 合併至 main (已檢閱，CI 為綠色)

# 2. 在 main 分支更新 CHANGELOG.md
#    將 [Unreleased] 項目移至 [vX.Y.Z] - YYYY-MM-DD

# 3. 提交更新日誌
git checkout main
git pull origin main
git add CHANGELOG.md
git commit -m "chore: release v1.2.3"

# 4. 建立並推送附註標籤
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3          # ← 僅推送該標籤；而非 --tags (避免推送所有標籤)

# 5. 確認：GitHub Actions publish.yml 自動觸發
#    監視：Actions 索引標籤 → publish 工作流程
#    驗證：https://pypi.org/project/your-package/
```

### 為什麼使用附註標籤？

附註標籤 (`git tag -a`) 帶有標記者身分、日期和訊息 — 輕量標籤 (lightweight tags) 則沒有。`setuptools_scm` 兩者皆可運作，但附註標籤對於發佈治理更安全，因為它們記錄了「誰」建立了標籤。

---

## 4. 角色型存取控制

| 角色 | 他們可以做什麼 |
|---|---|
| **維護者 (Maintainer)** | 建立發佈標籤、核准 PR、管理分支保護 |
| **貢獻者 (Contributor)** | 向 `develop` 開啟 PR；無法推送至 `main` 或建立發佈標籤 |
| **CI (GitHub Actions)** | 透過 OIDC 發佈至 PyPI；無法推送程式碼或建立標籤 |

### 透過 GitHub Teams 實作

```bash
# 建立 Maintainers 小組並限制標籤建立權限僅限該小組
gh api repos/{owner}/{repo}/tags/protection \
  --method POST \
  --field pattern="v*"
# 然後將允許的參與者設定為僅限 Maintainers 小組
```

---

## 5. 使用 OIDC 的安全發佈 (受信任的發佈)

**切勿將 PyPI API 權杖儲存為 GitHub 秘密。** 請改用受信任的發佈 (OIDC)。
PyPI 專案授權特定的 GitHub 存放庫 + 工作流程 + 環境 — 不需要交換長期秘密。

### 一次性 PyPI 設定

1. 前往 https://pypi.org/manage/project/your-package/settings/publishing/
2. 點擊 **Add a new publisher**
3. 填寫：
   - **Owner:** 您的 GitHub 使用者名稱
   - **Repository:** 您的存放庫名稱
   - **Workflow name:** `publish.yml`
   - **Environment name:** `release` (必須與工作流程中的 `environment:` 鍵相符)
4. 儲存。不需要權杖。

### GitHub 環境設定

1. 前往 **GitHub → Settings → Environments → New environment** → 命名為 `release`
2. 新增保護規則：**Required reviewers** (選用，但建議用於增加安全性)
3. 新增部署分支規則：**Only tags matching `v*`**

### 使用 OIDC 的極簡 `publish.yml`

```yaml
# .github/workflows/publish.yml
name: 發佈至 PyPI

on:
  push:
    tags:
      - "v[0-9]+.[0-9]+.[0-9]+*"   # 匹配 v1.0.0, v2.0.0a1, v1.2.3rc1

jobs:
  publish:
    name: 建構與發佈
    runs-on: ubuntu-latest
    environment: release       # 必須與 PyPI 受信任的發佈者環境名稱相符
    permissions:
      id-token: write          # OIDC 所需 — 向 PyPI 授予短期權杖
      contents: read

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0       # setuptools_scm 所需

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: 安裝建構工具
        run: pip install build

      - name: 建構散佈版
        run: python -m build

      - name: 驗證散佈版
        run: pip install twine ; twine check dist/*

      - name: 發佈至 PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        # 不需要 `password:` 或 `user:` — OIDC 會處理驗證
```

---

## 6. 在 CI 中驗證標籤作者

透過針對允許清單檢查 `GITHUB_ACTOR` 來限制誰可以觸發發佈。
將此作為發佈作業的**第一個步驟**，以便快速失敗。

```yaml
- name: 驗證標籤作者
  run: |
    ALLOWED_USERS=("您的-github-使用者名稱" "共同維護者-使用者名稱")
    if [[ ! " ${ALLOWED_USERS[*]} " =~ " ${GITHUB_ACTOR} " ]]; then
      echo "::error::發佈遭封鎖：${GITHUB_ACTOR} 不是授權的發佈者。"
      exit 1
    fi
    echo "已授權 ${GITHUB_ACTOR} 進行發佈。"
```

### 備註

- `GITHUB_ACTOR` 是推送標籤的人的 GitHub 使用者名稱。
- 將允許清單儲存在獨立檔案中 (例如：`.github/MAINTAINERS`) 以利維護。
- 對於團隊：將使用者名稱檢查替換為 GitHub API 呼叫以驗證團隊成員身分。

---

## 7. 防止無效的發佈標籤

拒絕由不遵循您的版本控制慣例的標籤所觸發的工作流程執行。
這可以防止來自 `test`、`backup-old` 或 `v1` 等標籤的意外發佈。

```yaml
- name: 驗證發佈標籤格式
  run: |
    # 接受：v1.0.0  v1.0.0a1  v1.0.0b2  v1.0.0rc1  v1.0.0.post1
    if [[ ! "${GITHUB_REF}" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+(a|b|rc|\.post)[0-9]*$ ]] && \
       [[ ! "${GITHUB_REF}" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "::error::標籤 '${GITHUB_REF}' 不符合要求的格式 v<MAJOR>.<MINOR>.<PATCH>[pre]。"
      exit 1
    fi
    echo "標籤格式有效：${GITHUB_REF}"
```

### 正規表示式說明

| 模式 | 匹配項 |
|---|---|
| `v[0-9]+\.[0-9]+\.[0-9]+` | `v1.0.0`, `v12.3.4` |
| `(a\|b\|rc)[0-9]*` | `v1.0.0a1`, `v2.0.0rc2` |
| `\.post[0-9]*` | `v1.0.0.post1` |

---

## 8. 帶有治理門檻的完整 `publish.yml`

結合了標籤驗證、作者檢查、TestPyPI 門檻以及生產環境發佈的完整工作流程。

```yaml
# .github/workflows/publish.yml
name: 發佈至 PyPI

on:
  push:
    tags:
      - "v[0-9]+.[0-9]+.[0-9]+*"

jobs:
  publish:
    name: 建構、驗證與發佈
    runs-on: ubuntu-latest
    environment: release
    permissions:
      id-token: write
      contents: read

    steps:
      - name: 驗證發佈標籤格式
        run: |
          if [[ ! "${GITHUB_REF}" =~ ^refs/tags/v[0-9]+\.[0-9]+\.[0-9]+(a[0-9]*|b[0-9]*|rc[0-9]*|\.post[0-9]*)?$ ]]; then
            echo "::error::無效的標籤格式：${GITHUB_REF}"
            exit 1
          fi

      - name: 驗證標籤作者
        run: |
          ALLOWED_USERS=("您的-github-使用者名稱")
          if [[ ! " ${ALLOWED_USERS[*]} " =~ " ${GITHUB_ACTOR} " ]]; then
            echo "::error::${GITHUB_ACTOR} 未獲授權進行發佈。"
            exit 1
          fi

      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: 安裝建構工具
        run: pip install build twine

      - name: 建構
        run: python -m build

      - name: 驗證散佈版
        run: twine check dist/*

      - name: 發佈至 TestPyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          repository-url: https://test.pypi.org/legacy/
        continue-on-error: true   # 非致命錯誤；如果您希望此步驟必須通過，請移除此行

      - name: 發佈至 PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
```

### 安全性核取清單

- [ ] 已配置 PyPI 受信任的發佈 (GitHub 中未儲存 API 權杖)
- [ ] GitHub `release` 環境具有分支保護：僅限符合 `v*` 的標籤
- [ ] 標籤格式驗證步驟是作業的第一個步驟
- [ ] 允許使用者清單定期維護與檢閱
- [ ] 記錄中未印出任何秘密 (檢查所有 `echo` 和 `run` 步驟)
- [ ] `permissions:` 權限範圍僅限 `id-token: write` — 而非 `write-all`
