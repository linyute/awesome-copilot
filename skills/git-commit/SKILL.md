---
name: git-commit
description: '當使用者想要建立 Git 認可 (commit) 或將變更拆分為多個認可時使用此技能。當使用者輸入 "/commit" 或要求 Conventional Commits 時也可以使用。此技能會檢查 diff、暫存相關檔案、撰寫 Conventional Commits 訊息並執行 git commit。當使用者只需要認可訊息而不需要認可時請勿使用。請勿將其用於推送、建立 Pull Request、變基 (rebase) 或變更認可歷程記錄。'
license: MIT
compatibility: '需要 Git。`git add` 的 `--resolved` 選項需要 Git 2.56 或更高版本。較舊版本請使用步驟 3 中的後備方案。'
allowed-tools: shell(git:*)
---

# 使用 Conventional Commits 進行 Git 認可 (Git Commit with Conventional Commits)

建立遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) 規格的 Git 認可。從 diff 中取得類型 (type)、範圍 (scope) 與摘要 (summary)。

## 訊息格式 (Message Format)

```text
<type>(<scope>): <summary>

<body>

<footer>
```

- 範圍、內文與頁尾為選填項目。若無範圍，請寫成 `<type>: <summary>`。
- 摘要請使用祈使語氣：「add」，而非「added」或「adds」。
- 第一行長度請保持在 72 個字元以內。結尾請勿加上句號。
- 在內文中說明變更了什麼內容以及為什麼要變更。
- 每個頁尾請寫為 `Token: value` 或 `Token #value`，例如 `Refs: #456` 或 `Closes #123`。Conventional Commits 接受這兩種形式，但 Git 僅將 `Token: value` 視為尾註 (trailer)。在 token 中，請使用 `-` 代替空格。

## 類型 (Types)

Conventional Commits 僅定義了 `feat` 與 `fix`。其他類型來自 Angular 慣例 ([`@commitlint/config-conventional`](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional))。若存放庫有自己的清單，請使用該清單。

| 類型       | 用途                                           |
| ---------- | ---------------------------------------------- |
| `feat`     | 新功能                                         |
| `fix`      | 錯誤修正 (Bug fix)                             |
| `docs`     | 僅限文件變更                                   |
| `style`    | 僅格式調整，不影響邏輯                         |
| `refactor` | 非新功能亦非修正的程式碼重構                   |
| `perf`     | 效能改善                                       |
| `test`     | 新增或變更測試                                 |
| `build`    | 建構系統或相依套件變更                         |
| `ci`       | CI 設定檔變更                                  |
| `chore`    | 其他例行維護                                   |
| `revert`   | 還原先前的認可                                 |

## 重大變更 (Breaking Changes)

在冒號前加上 `!`，或者加入 `BREAKING CHANGE:` 頁尾。請將 token 寫為全大寫。`BREAKING-CHANGE:` 亦正確。

```text
feat(api)!: remove the v1 endpoints

BREAKING CHANGE: Clients must use the v2 endpoints.
```

## 工作流程 (Workflow)

### 1. 讀取存放庫規則

在撰寫訊息前先找出認可規則：

- commitlint 設定檔，例如 `commitlint.config.js` 或 `.commitlintrc.json`。
- `CONTRIBUTING.md`。
- 最近的認可訊息：`git log --oneline -10`。

若存放庫規則與本技能不同，請優先遵循存放庫規則。

### 2. 檢驗變更內容

```bash
git status --porcelain
git diff --staged
git diff
```

若沒有變更，請執行步驟 3 開頭的檢查。若找到 `MERGE_HEAD`，請繼續進行。若否，請告訴使用者 `git status --long` 顯示的內容。切勿建立空的認可。

### 3. 暫存檔案

首先，檢查是否有正在進行的作業。請單獨執行各命令，不要用 `&&` 串接。在子目錄中，請將此步驟中的所有命令以 `git -C <root> ...` 執行。`git rev-parse --show-toplevel` 會印出根路徑。

```bash
git rev-parse -q --verify --symbolic-full-name MERGE_HEAD
git rev-parse -q --verify --symbolic-full-name CHERRY_PICK_HEAD
git rev-parse -q --verify --symbolic-full-name REVERT_HEAD
git diff --name-only --diff-filter=U --no-relative
git status --long
```

若其作業正在進行中，`rev-parse` 命令會印出參照名稱。若否，該命令不會印出任何內容並以狀態 1 結束。`git diff` 命令會列出未合併的檔案。它可以找出沒有參照的衝突，例如來自 `git stash pop`。`git status --long` 則會顯示其他情況。

**若有正在進行的作業或有未合併的檔案**，請勿取消暫存檔案。切勿拆分認可。索引 (index) 保留了該作業的結果。若取消暫存檔案，Git 會丟棄另一側的變更或移除衝突項目。

- 若 `git status --long` 顯示「rebase in progress」、「You are in the middle of an am session」、「Cherry-pick currently in progress」或「Revert currently in progress」，請停下並通知使用者。
- 執行 `git status --porcelain=v2`。開頭為 `u` 的行表示未合併的檔案。只有在滿足下列所有條件時，才可以解決該檔案：
  - 該行以 `u UU N...` 或 `u AA N...` 開頭。
  - 該行上的每種模式均為 `100644`、`100755` 或 `000000`。
  - `git diff --no-relative` 未顯示該檔案為 `Binary files differ`。
- 詢問使用者如何解決所有其他未合併的檔案。Git 無法在這些檔案中找到衝突標記。`git add --resolved` 與下列檢查會暫存這些檔案而不發出警告。只有在使用者解決後，才能暫存其中的每個檔案：`git add -- <path>`。
- 在 Git 2.56 或更高版本中，使用 `git add --resolved -- <paths>` 暫存可解決的檔案。
- 在較舊的 Git 中，檢查這些檔案並加以暫存：

```bash
git diff --check -- path/to/file1 path/to/file2
git add -- path/to/file1 path/to/file2
```

- 只有在 `git diff --check` 未找到「leftover conflict marker」行時才暫存檔案。請忽略來自另一分支的空白字元警告。
- 接著，在任何 Git 版本中，執行 `git diff --name-only --no-relative` 與 `git ls-files --others --exclude-standard`。它們會列出其他檔案中的編輯。請略過仍處於未合併狀態的檔案。
- 向使用者顯示這些路徑。詢問它們是否屬於該認可。僅使用 `git add -- <paths>` 暫存經核准的路徑。
- Git 會對部分路徑加上引號，例如含有非 ASCII 字元的路徑。`git add` 在處理加上引號的路徑時會失敗。請就這些檔案向使用者確認。

**若沒有正在進行的作業且沒有未合併的檔案**，請將單一邏輯變更放入各認可中。若已暫存的檔案包含多個變更，請先取消暫存其他變更的檔案。然後暫存此變更的檔案：

```bash
git reset -q -- path/to/other-file1 path/to/other-file2
git add -- path/to/file1 path/to/file2
git add -- '*.test.*'
git add -- src/components/
```

- 請將 glob 放在引號內。若沒有引號，shell 會展開 glob 且無法找到子目錄中的檔案。
- 請勿使用 `git add -p` 或 `git add -i`。這些命令會等待人員輸入。
- 使用 `git diff --staged --name-only` 檢查已暫存的檔案清單。切勿認可機密資訊，例如 `.env` 檔案、`credentials.json` 或私密金鑰。

### 4. 撰寫訊息

從 diff 中取得各個部分：

- **Type**：變更的種類。
- **Scope**：變更影響的模組或區域。
- **Summary**：在一行內說明變更了什麼內容。

### 5. 認可 (Commit)

當步驟 3 找到 `MERGE_HEAD`、`CHERRY_PICK_HEAD` 或 `REVERT_HEAD` 時，請執行 `git commit --no-edit`，不帶任何路徑且不帶 `--cleanup` 選項。這會保留 Git 預先準備的訊息。切勿撰寫新的 `-m` 訊息。該訊息可以保留來自 Git 的 `Conflicts:` 註解行，請勿將其移除。

在所有其他情況下：

使用不同的 `-m` 選項提供每個段落。Git 會在段落之間插入空白行。此命令適用於 Bash、PowerShell 與其他 shell。

```bash
git commit -m "feat(auth): add token refresh"
git commit -m "fix(parser): accept empty input" -m "An empty file caused a crash." -m "Closes: #123"
```

若為長訊息，請將訊息寫入暫存檔。然後執行 `git commit -F <file>`。

### 6. 確認認可正確無誤

```bash
git log -1 --stat --first-parent
git status --porcelain
```

## 安全守則 (Safety Rules)

- 請勿變更 Git 設定。
- 除非使用者特別指示，否則請勿使用 `--no-verify`。攔截勾點 (hooks) 可能位於 `.git/hooks` 或 Git 設定中。
- 若 hook 失敗，Git 不會建立認可。請修正問題、重新暫存檔案，然後再次執行相同的 `git commit` 命令。請勿使用 `--amend`，因為它會變更先前的認可。
- 除非使用者指示，否則請勿變更認可歷程記錄。請勿使用 `git reset --hard`、`git rebase` 或實驗性的 `git history` 命令。
- 除非使用者指示，否則請勿進行推送。請勿強制推送到預設分支。
