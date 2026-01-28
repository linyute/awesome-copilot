---
name: git-commit
description: '使用約定式提交（Conventional Commit）訊息分析、智慧暫存和訊息生成來執行 git commit。當使用者要求提交變更、建立 git commit 或提及「/commit」時使用。支援：(1) 從變更中自動偵測類型和範圍，(2) 從 diff 生成約定式提交訊息，(3) 帶有選用類型/範圍/描述覆寫的互動式提交，(4) 用於邏輯分組的智慧檔案暫存'
license: MIT
allowed-tools: Bash
---

# 搭配約定式提交 (Conventional Commits) 的 Git Commit

## 概覽

使用約定式提交規範建立標準化、具語義的 Git 提交。分析實際的 diff 以確定合適的類型 (type)、範圍 (scope) 和訊息 (message)。

## 約定式提交格式

```
<類型>[選用範圍]: <描述>

[選用正文]

[選用頁尾]
```

## 提交類型 (Commit Types)

| 類型       | 目的                              |
| ---------- | --------------------------------- |
| `feat`     | 新功能                             |
| `fix`      | 錯誤修復                           |
| `docs`     | 僅文件變更                         |
| `style`    | 格式/樣式（不影響邏輯）              |
| `refactor` | 程式碼重構（無功能新增/錯誤修復）     |
| `perf`     | 效能改進                          |
| `test`     | 新增/更新測試                      |
| `build`    | 建構系統/相依性                    |
| `ci`       | CI/配置變更                       |
| `chore`    | 維護/雜項                         |
| `revert`   | 還原提交                          |

## 重大變更 (Breaking Changes)

```
# 類型/範圍後加上驚嘆號
feat!: 移除已棄用的端點 (endpoint)

# BREAKING CHANGE 頁尾
feat: 允許設定擴充其他設定

BREAKING CHANGE: `extends` 鍵的行為已變更
```

## 工作流

### 1. 分析 Diff

```bash
# 如果檔案已暫存，使用暫存的 diff
git diff --staged

# 如果尚未暫存任何內容，使用工作樹 (working tree) 的 diff
git diff

# 同時檢查狀態
git status --porcelain
```

### 2. 暫存檔案（如有需要）

如果尚未暫存任何內容，或者你想以不同的方式對變更進行分組：

```bash
# 暫存特定檔案
git add path/to/file1 path/to/file2

# 按模式暫存
git add *.test.*
git add src/components/*

# 互動式暫存
git add -p
```

**切勿提交秘密資訊** (.env, credentials.json, 私鑰)。

### 3. 生成提交訊息

分析 diff 以確定：

- **類型 (Type)**：這是哪種變更？
- **範圍 (Scope)**：受影響的是哪個區域/模組？
- **描述 (Description)**：變更內容的一行摘要（使用現在式、祈使句，少於 72 個字元）

### 4. 執行提交

```bash
# 單行
git commit -m "<類型>[範圍]: <描述>"

# 帶有正文/頁尾的多行提交
git commit -m "$(cat <<'EOF'
<類型>[範圍]: <描述>

<選用正文>

<選用頁尾>
EOF
)"
```

## 最佳實踐

- 每個提交僅包含一個邏輯變更
- 使用現在式：用「add」而非「added」
- 使用祈使句：用「fix bug」而非「fixes bug」
- 引用相關議題 (Issues)：`Closes #123`, `Refs #456`
- 描述長度保持在 72 個字元以內

## Git 安全協定 (Git Safety Protocol)

- **絕不**更新 git 設定 (config)
- **絕不**在沒有明確要求的情況下執行破壞性命令 (--force, hard reset)
- **絕不**跳過掛勾 (hooks) (--no-verify)，除非使用者要求
- **絕不**強制推送 (force push) 到 main/master 分支
- 如果提交因掛勾而失敗，請修復問題並建立**新**的提交（不要使用 amend）
