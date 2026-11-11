---
name: conventional-branch
description: '依據 Conventional Branch 規格（feature/、bugfix/、hotfix/、release/、chore/，加上 AI 代理前綴 ai/、copilot/、cursor/、claude/、codex/）建立 Git 分支。在建立新分支、為分支命名，或檢查分支名稱是否符合規範時使用。'
---

# Conventional Branch

遵循 [Conventional Branch](https://conventionalbranch.org) 規範建立 Git 分支 — 這是一套簡單且一致的 Git 分支命名約定。

## 分支名稱格式

```
<type>/<description>
```

### 分支類型

**目的前綴** — 描述工作的意圖：

| 類型 | 別名 | 目的 |
|------|-------|---------|
| `feature/` | `feat/` | 新功能或增強功能 |
| `bugfix/` | `fix/` | 錯誤修正 |
| `hotfix/` | — | 緊急正式環境修正 |
| `release/` | — | 發行準備（版本號中允許點號：`release/v1.2.0`） |
| `chore/` | — | 非程式碼工作（相依性、文件、組態） |

**AI 代理來源前綴** — 識別由 AI 程式碼編寫代理所產生的分支：

| 類型 | 別名 | 目的 |
|------|-------|---------|
| `ai/` | — | 適用於任何 AI 程式碼編寫代理的通用前綴 |
| `copilot/` | — | GitHub Copilot |
| `cursor/` | — | Cursor |
| `claude/` | — | Anthropic 的 Claude Code |
| `codex/` | — | OpenAI Codex |

當你知道由哪個代理產生該分支時，請使用特定廠商的前綴；使用 `ai/` 作為中立廠商的後備前綴。

### 主幹分支 (Trunk Branches)

`main`、`master` 與 `develop` 是主幹分支 — 它們不使用前綴。切勿建立與主幹分支同名的新分支；應從它們分支出來。

## 命名規則

- **僅限小寫** — 任何位置皆不可出現大寫字母
- **英數字、連字號與點號** — `a-z`、`0-9`、`-`、`.`
- **點號**在任何描述中均可使用，通常用於版本號（例如 `release/v1.2.0`、`chore/upgrade-node-v20.11`）
- **禁止底線、空格或特殊字元**
- **禁止連續連字號** (`--`)、**點號** (`..`) 或**連字號與點號相鄰** (`-.` 或 `.-`)
- 描述中**禁止開頭或結尾出現連字號或點號**

## 有效範例

```
main
master
develop
feature/add-login-page
feat/add-login-page
bugfix/fix-header-bug
fix/header-bug
hotfix/security-patch
release/v1.2.0
chore/update-dependencies
feature/issue-123-new-login
ai/refactor-auth-flow
copilot/add-login-page
cursor/fix-header-bug
claude/security-patch
codex/optimize-query
```

## 無效範例

| 分支 | 問題 |
|--------|---------|
| `Feature/Add-Login` | 包含大寫字母 |
| `feature/new--login` | 連續連字號 |
| `feature/-new-login` | 開頭連字號 |
| `feature/new-login-` | 結尾連字號 |
| `release/v1.-2.0` | 連字號與點號相鄰 |
| `fix/header bug` | 包含空格 |
| `fix/header_bug` | 包含底線 |
| `unknown/some-task` | 未知的前綴類型 |

## 描述撰寫指引

- 使用 2 到 5 個單字的 **kebab-case**
- 具描述性但保持精簡（總長約 50 個字元）
- 良好示範：`add-oauth-login`、`fix-header-overflow`、`update-ci-config`
- 不佳示範：`fix-bug`、`new-feature`

## 工作流程

**請遵循以下步驟：**

**步驟 1 — 決定分支類型**

詢問使用者（若尚未明確指定）：

- **分支類型** — 不確定時預設為 `feature`
- **簡要描述** — 此分支的用途

若使用者提及工單或問題編號，請將其納入描述中（例如 `feature/issue-123-add-oauth`）。

**步驟 2 — 驗證名稱**

依據上述**命名規則**檢查組合好的名稱。若有任何規則未通過，請予以修正：

- 全部轉為小寫
- 將底線與空格替換為連字號
- 合併連續的連字號
- 去除開頭/結尾的連字號

**步驟 3 — 偵測基準分支 (Base Branch)**

不同的存放庫使用不同的主幹分支。偵測此存放庫使用的是哪一個：

```bash
# 偏好使用遠端存放庫的預設分支
git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||'
```

若未傳回任何內容，請檢查本機存在哪個主幹分支（優先順序：`develop`、`main`、`master`）：

```bash
for b in develop main master; do
  git show-ref --verify --quiet "refs/heads/$b" && echo "$b" && break
done
```

**步驟 4 — 建立並簽出**

```bash
git checkout <base>
git pull origin <base>
git checkout -b <type>/<description>
```

**步驟 5 — 確認**

告知使用者：
- 已建立的分支名稱
- 使用者目前已切換至該新分支
- 提醒使用者：準備好時執行 `git push -u origin <branch-name>`

## 驗證

[commit-check](https://github.com/commit-check/commit-check) 會依據規範驗證分支名稱。執行 `commit-check --branch`、使用其 `check-branch` pre-commit hook，或在 GitHub Actions 中使用 [commit-check-action](https://github.com/commit-check/commit-check-action)。適用於 GitHub 規則集、GitLab、Bitbucket 與 Git hooks 的組態請參閱 https://conventionalbranch.org/enforce/。

## 與 Conventional Commits 的關聯

Conventional Branch 補充了 [Conventional Commits](https://www.conventionalcommits.org)：

| Conventional Branch | 典型的 Conventional Commit |
|---------------------|----------------------------|
| `feature/add-login` | `feat: add login page` |
| `bugfix/fix-header` | `fix: header overflow on mobile` |
| `chore/update-deps` | `chore: bump lodash to 5.0` |
| `release/v1.2.0` | `chore: release v1.2.0` |

在可能的情況下，將分支類型與認可類型對齊（例如 `feature/*` 分支搭配 `feat:` 認可）。
