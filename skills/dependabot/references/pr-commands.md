# Dependabot PR 指令註解 (Dependabot PR Comment Commands)

透過註解 `@dependabot <command>` 與 Dependabot 的提取要求 (Pull Request) 互動。Dependabot 會以讚 (thumbs-up) 的表情符號回應以確認收到指令。

> **棄用通知 (2026 年 1 月 27 日)：** 以下指令已被移除：
> `@dependabot merge`, `@dependabot squash and merge`, `@dependabot cancel merge`,
> `@dependabot close`, 以及 `@dependabot reopen`。
> 請改為使用 GitHub 原生介面、CLI (`gh pr merge`)、API 或自動合併功能。

## 單一 PR 指令

| 指令 | 描述 |
|---|---|
| `@dependabot rebase` | 針對目標分支對此 PR 進行 rebase |
| `@dependabot recreate` | 重新建立此 PR，並覆蓋任何手動編輯內容 |
| `@dependabot ignore this dependency` | 關閉此 PR 並停止此依賴項目的所有未來更新 |
| `@dependabot ignore this major version` | 關閉並停止此主要版本 (major version) 的更新 |
| `@dependabot ignore this minor version` | 關閉並停止此次要版本 (minor version) 的更新 |
| `@dependabot ignore this patch version` | 關閉並停止此修補版本 (patch version) 的更新 |
| `@dependabot show DEPENDENCY_NAME ignore conditions` | 顯示該依賴項目目前所有忽略條件的表格 |

## 分組更新指令

這些指令適用於由分組版本更新或安全性更新所建立的 Dependabot PR。

| 指令 | 描述 |
|---|---|
| `@dependabot ignore DEPENDENCY_NAME` | 關閉此 PR 並停止更新此群組中的該依賴項目 |
| `@dependabot ignore DEPENDENCY_NAME major version` | 停止更新該依賴項目的主要版本 |
| `@dependabot ignore DEPENDENCY_NAME minor version` | 停止更新該依賴項目的次要版本 |
| `@dependabot ignore DEPENDENCY_NAME patch version` | 停止更新該依賴項目的修補版本 |
| `@dependabot unignore *` | 關閉目前 PR，清除群組中所有依賴項目的所有忽略條件，並開啟新的 PR |
| `@dependabot unignore DEPENDENCY_NAME` | 關閉目前 PR，清除特定依賴項目的所有忽略條件，並開啟包含其更新的新 PR |
| `@dependabot unignore DEPENDENCY_NAME IGNORE_CONDITION` | 關閉目前 PR，清除特定的忽略條件，並開啟新的 PR |

## 使用範例

### CI 通過後合併（使用 GitHub 原生功能）

自動合併是建議取代已棄用之 `@dependabot merge` 指令的方法：

```bash
# 透過 GitHub CLI 啟用自動合併
gh pr merge <PR_NUMBER> --auto --squash

# 或者透過 GitHub 網頁介面啟用自動合併：
# PR → "Enable auto-merge" → 選擇合併方式 → 確認
```

一旦所有必要的 CI 檢查都通過，GitHub 就會自動合併該 PR。

### 忽略主要版本升級

```
@dependabot ignore this major version
```

當主要版本有破壞性變更且尚未計畫遷移時非常有用。

### 檢查有效的忽略條件

```
@dependabot show express ignore conditions
```

顯示一個表格，列出目前針對 `express` 依賴項目儲存的所有忽略條件。

### 取消忽略群組中的依賴項目

```
@dependabot unignore lodash
```

關閉目前的分組 PR，清除對 `lodash` 的所有忽略條件，並開啟包含可用 `lodash` 更新的新 PR。

### 取消忽略特定條件

```
@dependabot unignore express [< 1.9, > 1.8.0]
```

僅清除針對 `express` 指定的版本範圍忽略。

## 秘訣

- **Rebase vs Recreate**：使用 `rebase` 可在保留您的審閱狀態下解決衝突。若 PR 偏離主線過多，請使用 `recreate` 重新開始。
- **在額外提交上進行強制推送**：如果您已將提交推送到 Dependabot 分支，且希望 Dependabot 在其上進行 rebase，請在您的提交訊息中包含 `[dependabot skip]`。
- **持久性忽略**：透過 PR 註解執行的忽略指令會集中儲存。為了團隊儲存庫的透明度，建議改在 `dependabot.yml` 中使用 `ignore` 設定。
- **合併 Dependabot PR**：請使用 GitHub 原生的自動合併功能、CLI (`gh pr merge`) 或網頁介面。舊的 `@dependabot merge` 指令已於 2026 年 1 月棄用。
- **關閉/重新開啟**：請使用 GitHub 網頁介面或 CLI。舊的 `@dependabot close` 和 `@dependabot reopen` 指令已於 2026 年 1 月棄用。
- **分組指令**：使用 `@dependabot unignore` 時，Dependabot 會關閉目前 PR 並開啟一個包含已更新依賴項目組合的新 PR。
