---
name: conventional-branch
description: '建立遵循 Conventional Branch 規範的 Git 分支 (feature/, bugfix/, hotfix/, release/, chore/)。在建立新分支、命名分支或檢查分支名稱是否符合規範時使用。'
---

# Conventional Branch (傳統分支命名規範)

建立遵循 [Conventional Branch](https://conventional-branch.github.io) 規範的 Git 分支 — 一種用於命名 Git 分支的簡單、一致的慣例。

## 分支名稱格式

```
<類型>/<描述>
```

### 分支類型

| 類型 | 別名 | 用途 |
|------|-------|---------|
| `feature/` | `feat/` | 新功能或增強 |
| `bugfix/` | `fix/` | 錯誤修復 |
| `hotfix/` | — | 緊急生產環境修復 |
| `release/` | — | 發佈準備 (版本中允許使用點：`release/v1.2.0`) |
| `chore/` | — | 非程式碼任務 (依賴項、文件、配置) |

### 主幹分支 (Trunk Branches)

`main`、`master` 和 `develop` 是主幹分支 — 它們不使用前綴。切勿建立與主幹分支同名的新分支；請從它們分支出來。

## 命名規則

- **僅限小寫** — 任何地方都不得有大寫字母
- **字母數字、連字號和點** — `a-z`, `0-9`, `-`, `.`
- **僅在 `release/` 版本描述中允許點** (例如：`release/v1.2.0`)
- **無底線、空格或特殊字元**
- **無連續連字號** (`--`)、**連續點** (`..`) 或 **連字號-點鄰接** (`-.` 或 `.-`)
- **描述中無前導或尾隨連字號或點**

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
```

## 無效範例

| 分支 | 問題 |
|--------|---------|
| `Feature/Add-Login` | 大寫字母 |
| `feature/new--login` | 連續連字號 |
| `feature/-new-login` | 前導連字號 |
| `feature/new-login-` | 尾隨連字號 |
| `release/v1.-2.0` | 連字號與點鄰接 |
| `fix/header bug` | 空格 |
| `fix/header_bug` | 底線 |
| `unknown/some-task` | 未知的類型前綴 |

## 描述指南

- 使用 **kebab-case** (連字號分隔)，2-5 個單字
- 具描述性但簡潔 (總共約 50 個字元)
- 好的：`add-oauth-login`, `fix-header-overflow`, `update-ci-config`
- 壞的：`fix-bug`, `new-feature`

## 工作流程

**請遵循以下步驟：**

**第 1 步 — 確定分支類型**

詢問使用者 (如果尚未明確)：

- **分支類型** — 不確定時預設為 `feature`
- **簡短描述** — 分支的用途

如果使用者提到票證或問題編號，請將其包含在描述中 (例如：`feature/issue-123-add-oauth`)。

**第 2 步 — 驗證名稱**

根據上述的 **命名規則** 檢查組裝後的名稱。如果任何規則失敗，請修正它：

- 將所有內容改為小寫
- 將底線和空格替換為連字號
- 收合連續連字號
- 移除前導/尾隨連字號

**第 3 步 — 偵測基礎分支**

不同的儲存庫使用不同的主幹分支。偵測此儲存庫使用的分支：

```bash
# 偏好遠端的預設分支
git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||'
```

如果該指令未傳回任何內容，請檢查本地存在的主幹分支 (優先順序：`develop`, `main`, `master`)：

```bash
for b in develop main master; do
  git show-ref --verify --quiet "refs/heads/$b" && echo "$b" && break
done
```

**第 4 步 — 建立並切換分支**

```bash
git checkout <base>
git pull origin <base>
git checkout -b <type>/<description>
```

**第 5 步 — 確認**

告知使用者：
- 建立的分支名稱
- 他們現在位於新分支上
- 提醒他們：準備好後使用 `git push -u origin <branch-name>`

## 與 Conventional Commits 的關係

Conventional Branch 與 [Conventional Commits](https://www.conventionalcommits.org) 互補：

| Conventional Branch | 典型的 Conventional Commit |
|---------------------|----------------------------|
| `feature/add-login` | `feat: add login page` |
| `bugfix/fix-header` | `fix: header overflow on mobile` |
| `chore/update-deps` | `chore: bump lodash to 5.0` |
| `release/v1.2.0` | `chore: release v1.2.0` |

盡可能將分支類型與提交類型對齊 (例如，`feature/*` 分支對應 `feat:` 提交)。
