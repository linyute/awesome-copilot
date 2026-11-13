# 工具使用模式

## GitHub CLI 模式

### 列出 Issues
```bash
# 所有開啟中的 issues
gh issue list --state open --limit 100

# 依標籤篩選（僅供提示 — 在第三階段驗證難度，切勿單憑標籤判斷）
gh issue list --state open --label "bug" --limit 50
gh issue list --state open --label "good first issue" --limit 50
gh issue list --state open --label "help-wanted" --limit 50

# 依語言篩選（若儲存庫使用語言標籤）
gh issue list --state open --label "rust" --limit 50
gh issue list --state open --label "javascript" --limit 50

# 依活躍度排序。務必傳遞 --repo；省略儲存庫時 gh search issues 會搜尋整個 GitHub。
gh search issues --repo OWNER/REPO --state open --sort updated --limit 50

# 依文字搜尋
gh issue list --state open --search "memory leak" --limit 50
```

### 檢視 Issues
```bash
# 基本檢視
gh issue view 1234

# 含留言
gh issue view 1234 --comments

# 用於剖析的 JSON 格式
gh issue view 1234 --json title,body,labels,assignees

# 檢查開啟中的關聯 PR（僅開啟中的 PR 算作競爭工作）
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api "repos/$repo/issues/1234/timeline" --paginate --jq '[.[] | select(.event == "cross-referenced") | select(.source.issue.pull_request != null) | select(.source.issue.state == "open") | .source.issue.number]'
```

### 列出 PR
```bash
# 所有開啟中的 PR
gh pr list --state open --limit 50

# 以特定分支為目標的 PR
gh pr list --state open --base main --limit 50

# 依作者篩選 PR
gh pr list --state open --author username --limit 50
```

### 檢視 PR
```bash
# 基本檢視
gh pr view 5678

# 檢視 PR 變更的檔案
gh pr diff --name-only 5678

# 檢查 PR 是否關聯至 issue（內文參考如「Fixes #1234」）
gh pr view 5678 --json body | grep -iE "(Fixes|Closes|Resolves)[[:space:]]+#"
```

### 搜尋程式碼
```bash
# 搜尋函式
gh search code "function_name" --repo owner/repo

# 搜尋檔案
gh search code "filename:config.ts" --repo owner/repo
```

## Git 模式

### 近期活動
```bash
# 最近 20 次提交
git log --oneline -20

# 過去一週的提交
git log --oneline --since="1 week ago"

# 特定作者的提交
git log --oneline --author="username" -10

# 觸及特定檔案的提交
git log --oneline -10 -- path/to/file
```

### 程式碼搜尋
```bash
# 在程式碼中搜尋模式
rg "pattern" src/
rg -i "pattern" src/  # 不區分大小寫

# 在特定檔案類型中搜尋
rg "pattern" -g "*.ts" src/
rg "pattern" -g "*.rs" src/

# 含上下文搜尋
rg -C 3 "pattern" src/  # 前後各 3 行
```

### 檔案操作
```bash
# 依名稱尋找檔案
find . -name "*.ts" -type f
find . -name "*test*" -type f

# 依內容尋找檔案
grep -r "function_name" src/
grep -l "TODO" src/**/*.ts

# 檢查檔案結構
tree -L 2 -I 'node_modules'
ls -la src/
```

### Blame 與歷史紀錄
```bash
# 誰變更了什麼
git blame path/to/file

# 特定函式的歷史紀錄
git log -p -S "function_name" -- path/to/file

# 提交之間的差異
git diff abc123..def456
```

## 組合模式

### 調查 Issue
```bash
# 取得 issue 詳細資訊
gh issue view 1234 --comments

# 尋找相關程式碼
rg "relevant_function" src/

# 檢查是否存在測試
find . -name "*test*" -type f | xargs grep -l "relevant_function"

# 檢查相關檔案的近期變更
git log --oneline -5 -- path/to/file
```

### 檢查 Issue 活躍度
```bash
# 取得 issue 時間軸（參考此 issue 的開啟中關聯 PR）
repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
gh api "repos/$repo/issues/1234/timeline" --paginate --jq '[.[] | select(.event == "cross-referenced") | select(.source.issue.pull_request != null) | select(.source.issue.state == "open") | .source.issue.number]'
# 注意：不支援 `gh issue view --json timelineItems/linkedPRs`；CLI 僅公開一組固定的 REST 欄位，
# 因此關聯 PR 偵測使用 timeline API。

# 檢查維護者活動
gh issue view 1234 --json comments | jq '.comments[].author.login'
```

### 驗證貢獻可行性
```bash
# 檢查 issue 是否已被指派
gh issue view 1234 --json assignees

# 檢查是否存在 PR（搜尋標題「與」內文以尋找對此 issue 的參考）
gh pr list --state open --search "1234 in:title"
gh pr list --state open --search "Fixes #1234"

# 檢查測試涵蓋率
find . -name "*test*" -type f | wc -l

# 檢查文件
cat CONTRIBUTING.md 2>/dev/null | head -50
```

## 錯誤處理

### 當 gh CLI 無法使用時
```bash
# 備援使用 git
git remote -v  # 取得儲存庫 URL
git log --oneline -20  # 近期活動
```

### 當驗證失敗時
```bash
# 檢查驗證狀態
gh auth status

# 提供指示
echo "Please run: gh auth login"
```

### 當達到速率限制時
```bash
# 檢查速率限制
gh api rate_limit

# 改用 git
git log --oneline -20
```