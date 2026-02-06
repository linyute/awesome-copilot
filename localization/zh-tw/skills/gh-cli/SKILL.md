---
name: gh-cli
description: GitHub CLI (gh) 關於儲存庫、議題、提取請求、Actions、專案、發佈 (releases)、Gists、Codespaces、組織、擴充功能以及所有透過命令列進行之 GitHub 操作的全面參考手冊。
---

# GitHub CLI (gh)

GitHub CLI (gh) 的全面參考手冊 - 從命令列無縫地使用 GitHub。

**版本：** 2.85.0（截至 2026 年 1 月）

## 先決條件

### 安裝

```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install --id GitHub.cli

# 驗證安裝
gh --version
```

### 身分驗證

```bash
# 互動式登入（預設：github.com）
gh auth login

# 使用特定主機名稱登入
gh auth login --hostname enterprise.internal

# 使用權杖 (token) 登入
gh auth login --with-token < mytoken.txt

# 檢查身分驗證狀態
gh auth status

# 切換帳號
gh auth switch --hostname github.com --user username

# 登出
gh auth logout --hostname github.com --user username
```

### 設定 Git 整合

```bash
# 設定 git 使用 gh 作為憑證輔助程式 (credential helper)
gh auth setup-git

# 檢視目前的權杖 (token)
gh auth token

# 重新整理身分驗證範圍 (scopes)
gh auth refresh --scopes write:org,read:public_key
```

## CLI 結構

```
gh                          # 根命令 (Root command)
├── auth                    # 身分驗證 (Authentication)
│   ├── login
│   ├── logout
│   ├── refresh
│   ├── setup-git
│   ├── status
│   ├── switch
│   └── token
├── browse                  # 在瀏覽器中開啟 (Open in browser)
├── codespace               # GitHub Codespaces
│   ├── code
│   ├── cp
│   ├── create
│   ├── delete
│   ├── edit
│   ├── jupyter
│   ├── list
│   ├── logs
│   ├── ports
│   ├── rebuild
│   ├── ssh
│   ├── stop
│   └── view
├── gist                    # Gists
│   ├── clone
│   ├── create
│   ├── delete
│   ├── edit
│   ├── list
│   ├── rename
│   └── view
├── issue                   # 議題 (Issues)
│   ├── create
│   ├── list
│   ├── status
│   ├── close
│   ├── comment
│   ├── delete
│   ├── develop
│   ├── edit
│   ├── lock
│   ├── pin
│   ├── reopen
│   ├── transfer
│   ├── unlock
│   └── view
├── org                     # 組織 (Organizations)
│   └── list
├── pr                      # 提取請求 (Pull Requests)
│   ├── create
│   ├── list
│   ├── status
│   ├── checkout
│   ├── checks
│   ├── close
│   ├── comment
│   ├── diff
│   ├── edit
│   ├── lock
│   ├── merge
│   ├── ready
│   ├── reopen
│   ├── revert
│   ├── review
│   ├── unlock
│   ├── update-branch
│   └── view
├── project                 # 專案 (Projects)
│   ├── close
│   ├── copy
│   ├── create
│   ├── delete
│   ├── edit
│   ├── field-create
│   ├── field-delete
│   ├── field-list
│   ├── item-add
│   ├── item-archive
│   ├── item-create
│   ├── item-delete
│   ├── item-edit
│   ├── item-list
│   ├── link
│   ├── list
│   ├── mark-template
│   ├── unlink
│   └── view
├── release                 # 發佈 (Releases)
│   ├── create
│   ├── list
│   ├── delete
│   ├── delete-asset
│   ├── download
│   ├── edit
│   ├── upload
│   ├── verify
│   ├── verify-asset
│   └── view
├── repo                    # 儲存庫 (Repositories)
│   ├── create
│   ├── list
│   ├── archive
│   ├── autolink
│   ├── clone
│   ├── delete
│   ├── deploy-key
│   ├── edit
│   ├── fork
│   ├── gitignore
│   ├── license
│   ├── rename
│   ├── set-default
│   ├── sync
│   ├── unarchive
│   └── view
├── cache                   # Actions 快取 (caches)
│   ├── delete
│   └── list
├── run                     # 工作流執行 (Workflow runs)
│   ├── cancel
│   ├── delete
│   ├── download
│   ├── list
│   ├── rerun
│   ├── view
│   └── watch
├── workflow                # 工作流 (Workflows)
│   ├── disable
│   ├── enable
│   ├── list
│   ├── run
│   └── view
├── agent-task              # 代理任務 (Agent tasks)
├── alias                   # 命令別名 (Command aliases)
│   ├── delete
│   ├── import
│   ├── list
│   └── set
├── api                     # API 請求 (API requests)
├── attestation             # 成品證明 (Artifact attestations)
│   ├── download
│   ├── trusted-root
│   └── verify
├── completion              # 命令列補全 (Shell completion)
├── config                  # 設定 (Configuration)
│   ├── clear-cache
│   ├── get
│   ├── list
│   └── set
├── extension               # 擴充功能 (Extensions)
│   ├── browse
│   ├── create
│   ├── exec
│   ├── install
│   ├── list
│   ├── remove
│   ├── search
│   └── upgrade
├── gpg-key                 # GPG 金鑰 (GPG keys)
│   ├── add
│   ├── delete
│   └── list
├── label                   # 標籤 (Labels)
│   ├── clone
│   ├── create
│   ├── delete
│   ├── edit
│   └── list
├── preview                 # 預覽功能 (Preview features)
├── ruleset                 # 規則集 (Rulesets)
│   ├── check
│   ├── list
│   └── view
├── search                  # 搜尋 (Search)
│   ├── code
│   ├── commits
│   ├── issues
│   ├── prs
│   └── repos
├── secret                  # 秘密 (Secrets)
│   ├── delete
│   ├── list
│   └── set
├── ssh-key                 # SSH 金鑰 (SSH keys)
│   ├── add
│   ├── delete
│   └── list
├── status                  # 狀態概覽 (Status overview)
└── variable                # 變數 (Variables)
    ├── delete
    ├── get
    ├── list
    └── set
```

## 設定 (Configuration)

### 全域設定 (Global Configuration)

```bash
# 列出所有設定
gh config list

# 獲取特定的設定值
gh config list git_protocol
gh config get editor

# 設定值
gh config set editor vim
gh config set git_protocol ssh
gh config set prompt disabled
gh config set pager "less -R"

# 清除設定快取
gh config clear-cache
```

### 環境變數 (Environment Variables)

```bash
# GitHub 權杖（用於自動化）
export GH_TOKEN=ghp_xxxxxxxxxxxx

# GitHub 主機名稱
export GH_HOST=github.com

# 停用提示
export GH_PROMPT_DISABLED=true

# 自訂編輯器
export GH_EDITOR=vim

# 自訂分頁程式
export GH_PAGER=less

# HTTP 逾時
export GH_TIMEOUT=30

# 自訂儲存庫（覆寫預設值）
export GH_REPO=owner/repo

# 自訂 git 協定
export GH_ENTERPRISE_HOSTNAME=hostname
```

## 身分驗證 (gh auth)

### 登入 (Login)

```bash
# 互動式登入
gh auth login

# 基於網頁的身分驗證
gh auth login --web

# 使用剪貼簿獲取 OAuth 代碼
gh auth login --web --clipboard

# 使用特定的 git 協定
gh auth login --git-protocol ssh

# 使用自訂主機名稱 (GitHub Enterprise)
gh auth login --hostname enterprise.internal

# 從標準輸入 (stdin) 使用權杖登入
gh auth login --with-token < token.txt

# 非安全儲存（純文字）
gh auth login --insecure-storage
```

### 狀態 (Status)

```bash
# 顯示所有身分驗證狀態
gh auth status

# 僅顯示活動帳號
gh auth status --active

# 顯示特定主機名稱
gh auth status --hostname github.com

# 在輸出中顯示權杖
gh auth status --show-token

# JSON 輸出
gh auth status --json hosts

# 使用 jq 進行篩選
gh auth status --json hosts --jq '.hosts | add'
```

### 切換帳號 (Switch Accounts)

```bash
# 互動式切換
gh auth switch

# 切換到特定的使用者/主機
gh auth switch --hostname github.com --user monalisa
```

### 權杖 (Token)

```bash
# 列印身分驗證權杖
gh auth token

# 特定主機/使用者的權杖
gh auth token --hostname github.com --user monalisa
```

### 重新整理 (Refresh)

```bash
# 重新整理憑證
gh auth refresh

# 新增範圍 (scopes)
gh auth refresh --scopes write:org,read:public_key

# 移除範圍 (scopes)
gh auth refresh --remove-scopes delete_repo

# 重設為預設範圍
gh auth refresh --reset-scopes

# 使用剪貼簿
gh auth refresh --clipboard
```

### 設定 Git (Setup Git)

```bash
# 設定 git 憑證輔助程式
gh auth setup-git

# 為特定主機進行設定
gh auth setup-git --hostname enterprise.internal

# 即使主機未知也強制設定
gh auth setup-git --hostname enterprise.internal --force
```

## 瀏覽 (gh browse)

```bash
# 在瀏覽器中開啟儲存庫
gh browse

# 開啟特定路徑
gh browse script/
gh browse main.go:312

# 開啟議題或提取請求
gh browse 123

# 開啟提交 (commit)
gh browse 77507cd94ccafcf568f8560cfecde965fcfa63

# 開啟特定分支
gh browse main.go --branch bug-fix

# 開啟不同的儲存庫
gh browse --repo owner/repo

# 開啟特定頁面
gh browse --actions       # Actions 標籤頁
gh browse --projects      # 專案標籤頁
gh browse --releases      # 發佈標籤頁
gh browse --settings      # 設定頁面
gh browse --wiki          # Wiki 頁面

# 僅列印 URL 而不開啟
gh browse --no-browser
```

## 儲存庫 (gh repo)

### 建立儲存庫 (Create)

```bash
# 建立新儲存庫
gh repo create my-repo

# 建立並附帶描述
gh repo create my-repo --description "我的超讚專案"

# 建立公開儲存庫
gh repo create my-repo --public

# 建立私有儲存庫
gh repo create my-repo --private

# 建立並附帶首頁
gh repo create my-repo --homepage https://example.com

# 建立並附帶授權
gh repo create my-repo --license mit

# 建立並附帶 gitignore
gh repo create my-repo --gitignore python

# 初始化為模板儲存庫
gh repo create my-repo --template

# 在組織中建立儲存庫
gh repo create org/my-repo

# 在不複製到本地的情況下建立儲存庫
gh repo create my-repo --source=.

# 停用議題 (issues)
gh repo create my-repo --disable-issues

# 停用 wiki
gh repo create my-repo --disable-wiki
```

### 複製儲存庫 (Clone)

```bash
# 複製儲存庫
gh repo clone owner/repo

# 複製到特定目錄
gh repo clone owner/repo my-directory

# 複製特定分支
gh repo clone owner/repo --branch develop
```

### 列出儲存庫 (List)

```bash
# 列出所有儲存庫
gh repo list

# 列出特定擁有者的儲存庫
gh repo list owner

# 限制結果數量
gh repo list --limit 50

# 僅限公開儲存庫
gh repo list --public

# 僅限來源儲存庫（非分叉）
gh repo list --source

# JSON 輸出
gh repo list --json name,visibility,owner

# 表格輸出
gh repo list --limit 100 | tail -n +2

# 使用 jq 進行篩選
gh repo list --json name --jq '.[].name'
```

### 檢視儲存庫 (View)

```bash
# 檢視儲存庫詳細資訊
gh repo view

# 檢視特定儲存庫
gh repo view owner/repo

# JSON 輸出
gh repo view --json name,description,defaultBranchRef

# 在瀏覽器中檢視
gh repo view --web
```

### 編輯儲存庫 (Edit)

```bash
# 編輯描述
gh repo edit --description "新描述"

# 設定首頁
gh repo edit --homepage https://example.com

# 更改可見性
gh repo edit --visibility private
gh repo edit --visibility public

# 啟用/停用功能
gh repo edit --enable-issues
gh repo edit --disable-issues
gh repo edit --enable-wiki
gh repo edit --disable-wiki
gh repo edit --enable-projects
gh repo edit --disable-projects

# 設定預設分支
gh repo edit --default-branch main

# 重新命名儲存庫
gh repo rename new-name

# 封存儲存庫
gh repo archive
gh repo unarchive
```

### 刪除儲存庫 (Delete)

```bash
# 刪除儲存庫
gh repo delete owner/repo

# 無需確認直接刪除
gh repo delete owner/repo --yes
```

### 分叉儲存庫 (Fork)

```bash
# 分叉儲存庫
gh repo fork owner/repo

# 分叉到組織
gh repo fork owner/repo --org org-name

# 分叉後複製
gh repo fork owner/repo --clone

# 分叉的遠端名稱
gh repo fork owner/repo --remote-name upstream
```

### 同步分叉 (Sync)

```bash
# 與上游同步分叉
gh repo sync

# 同步特定分支
gh repo sync --branch feature

# 強制同步
gh repo sync --force
```

### 設定預設儲存庫 (Set Default)

```bash
# 設定目前目錄的預設儲存庫
gh repo set-default

# 明確設定預設值
gh repo set-default owner/repo

# 取消預設設定
gh repo set-default --unset
```

### 儲存庫自動連結 (Autolinks)

```bash
# 列出自動連結
gh repo autolink list

# 新增自動連結
gh repo autolink add \
  --key-prefix JIRA- \
  --url-template https://jira.example.com/browse/<num>

# 刪除自動連結
gh repo autolink delete 12345
```

### 儲存庫部署金鑰 (Deploy Keys)

```bash
# 列出部署金鑰
gh repo deploy-key list

# 新增部署金鑰
gh repo deploy-key add ~/.ssh/id_rsa.pub \
  --title "生產伺服器" \
  --read-only

# 刪除部署金鑰
gh repo deploy-key delete 12345
```

### Gitignore 與授權 (License)

```bash
# 檢視 gitignore 範本
gh repo gitignore

# 檢視授權範本
gh repo license mit

# 附帶全名的授權
gh repo license mit --fullname "John Doe"
```

## 議題 (gh issue)

### 建立議題 (Create)

```bash
# 互動式建立議題
gh issue create

# 建立並附帶標題
gh issue create --title "錯誤：登入功能失效"

# 建立並附帶標題與內容
gh issue create \
  --title "錯誤：登入功能失效" \
  --body "重現步驟..."

# 從檔案填寫內容
gh issue create --body-file issue.md

# 建立並附帶標籤
gh issue create --title "修復錯誤" --labels bug,high-priority

# 建立並附帶負責人
gh issue create --title "修復錯誤" --assignee user1,user2

# 在特定儲存庫中建立
gh issue create --repo owner/repo --title "議題標題"

# 從網頁建立議題
gh issue create --web
```

### 列出議題 (List)

```bash
# 列出所有開啟的議題
gh issue list

# 列出所有議題（包含已關閉的）
gh issue list --state all

# 列出已關閉的議題
gh issue list --state closed

# 限制結果數量
gh issue list --limit 50

# 按負責人篩選
gh issue list --assignee username
gh issue list --assignee @me

# 按標籤篩選
gh issue list --labels bug,enhancement

# 按里程碑篩選
gh issue list --milestone "v1.0"

# 搜尋/篩選
gh issue list --search "is:open is:issue label:bug"

# JSON 輸出
gh issue list --json number,title,state,author

# 表格檢視
gh issue list --json number,title,labels --jq '.[] | [.number, .title, .labels[].name] | @tsv'

# 顯示評論數量
gh issue list --json number,title,comments --jq '.[] | [.number, .title, .comments]'

# 排序
gh issue list --sort created --order desc
```

### 檢視議題 (View)

```bash
# 檢視議題
gh issue view 123

# 檢視並附帶評論
gh issue view 123 --comments

# 在瀏覽器中檢視
gh issue view 123 --web

# JSON 輸出
gh issue view 123 --json title,body,state,labels,comments

# 檢視特定欄位
gh issue view 123 --json title --jq '.title'
```

### 編輯議題 (Edit)

```bash
# 互動式編輯
gh issue edit 123

# 編輯標題
gh issue edit 123 --title "新標題"

# 編輯內容
gh issue edit 123 --body "新描述"

# 新增標籤
gh issue edit 123 --add-label bug,high-priority

# 移除標籤
gh issue edit 123 --remove-label stale

# 新增負責人
gh issue edit 123 --add-assignee user1,user2

# 移除負責人
gh issue edit 123 --remove-assignee user1

# 設定里程碑
gh issue edit 123 --milestone "v1.0"
```

### 關閉/重啟議題 (Close/Reopen)

```bash
# 關閉議題
gh issue close 123

# 關閉並附帶評論
gh issue close 123 --comment "已在 PR #456 中修復"

# 重啟議題
gh issue reopen 123
```

### 議題評論 (Comment)

```bash
# 新增評論
gh issue comment 123 --body "這看起來不錯！"

# 編輯評論
gh issue comment 123 --edit 456789 --body "已更新評論"

# 刪除評論
gh issue comment 123 --delete 456789
```

### 議題狀態 (Status)

```bash
# 顯示議題狀態摘要
gh issue status

# 特定儲存庫的狀態
gh issue status --repo owner/repo
```

### 固定/取消固定議題 (Pin/Unpin)

```bash
# 固定議題（固定到儲存庫儀表板）
gh issue pin 123

# 取消固定議題
gh issue unpin 123
```

### 鎖定/解鎖議題 (Lock/Unlock)

```bash
# 鎖定對話
gh issue lock 123

# 鎖定並附帶原因
gh issue lock 123 --reason off-topic

# 解鎖
gh issue unlock 123
```

### 轉移議題 (Transfer)

```bash
# 轉移到另一個儲存庫
gh issue transfer 123 --repo owner/new-repo
```

### 刪除議題 (Delete)

```bash
# 刪除議題
gh issue delete 123

# 無需確認直接刪除
gh issue delete 123 --yes
```

### 開發議題 (Develop/Draft PR)

```bash
# 從議題建立草案提取請求 (Draft PR)
gh issue develop 123

# 在特定分支中建立
gh issue develop 123 --branch fix/issue-123

# 建立並指定基準分支
gh issue develop 123 --base main
```

## 提取請求 (gh pr)

### 建立提取請求 (Create)

```bash
# 互動式建立提取請求 (PR)
gh pr create

# 建立並附帶標題
gh pr create --title "功能：新增功能"

# 建立並附帶標題與內容
gh pr create \
  --title "功能：新增功能" \
  --body "此 PR 新增了..."

# 從範本填寫內容
gh pr create --body-file .github/PULL_REQUEST_TEMPLATE.md

# 設定基準分支 (base branch)
gh pr create --base main

# 設定標頭分支 (head branch)（預設：目前分支）
gh pr create --head feature-branch

# 建立草案提取請求 (Draft PR)
gh pr create --draft

# 新增負責人
gh pr create --assignee user1,user2

# 新增審查者
gh pr create --reviewer user1,user2

# 新增標籤
gh pr create --labels enhancement,feature

# 連結到議題 (Issue)
gh pr create --issue 123

# 在特定儲存庫中建立
gh pr create --repo owner/repo

# 建立後在瀏覽器中開啟
gh pr create --web
```

### 列出提取請求 (List)

```bash
# 列出開啟的 PR
gh pr list

# 列出所有 PR
gh pr list --state all

# 列出已合併的 PR
gh pr list --state merged

# 列出已關閉（未合併）的 PR
gh pr list --state closed

# 按標頭分支篩選
gh pr list --head feature-branch

# 按基準分支篩選
gh pr list --base main

# 按作者篩選
gh pr list --author username
gh pr list --author @me

# 按負責人篩選
gh pr list --assignee username

# 按標籤篩選
gh pr list --labels bug,enhancement

# 限制結果數量
gh pr list --limit 50

# 搜尋
gh pr list --search "is:open is:pr label:review-required"

# JSON 輸出
gh pr list --json number,title,state,author,headRefName

# 顯示檢查狀態
gh pr list --json number,title,statusCheckRollup --jq '.[] | [.number, .title, .statusCheckRollup[]?.status]'

# 排序
gh pr list --sort created --order desc
```

### 檢視提取請求 (View)

```bash
# 檢視 PR
gh pr view 123

# 檢視並附帶評論
gh pr view 123 --comments

# 在瀏覽器中檢視
gh pr view 123 --web

# JSON 輸出
gh pr view 123 --json title,body,state,author,commits,files

# 檢視差異 (diff)
gh pr view 123 --json files --jq '.files[].path'

# 使用 jq 查詢進行檢視
gh pr view 123 --json title,state --jq '"\(.title): \(.state)"'
```

### 檢出提取請求 (Checkout)

```bash
# 檢出 PR 分支
gh pr checkout 123

# 使用特定分支名稱檢出
gh pr checkout 123 --branch name-123

# 強制檢出
gh pr checkout 123 --force
```

### 提取請求差異 (Diff)

```bash
# 檢視 PR 差異
gh pr diff 123

# 檢視彩色差異
gh pr diff 123 --color always

# 輸出到檔案
gh pr diff 123 > pr-123.patch

# 僅檢視特定檔案的差異
gh pr diff 123 --name-only
```

### 合併提取請求 (Merge)

```bash
# 合併 PR
gh pr merge 123

# 使用特定方法合併
gh pr merge 123 --merge
gh pr merge 123 --squash
gh pr merge 123 --rebase

# 合併後刪除分支
gh pr merge 123 --delete-branch

# 合併並附帶評論
gh pr merge 123 --subject "合併 PR #123" --body "正在合併功能"

# 合併草案 PR
gh pr merge 123 --admin

# 強制合併（跳過檢查）
gh pr merge 123 --admin
```

### 關閉提取請求 (Close)

```bash
# 關閉 PR（作為草案，不合併）
gh pr close 123

# 關閉並附帶評論
gh pr close 123 --comment "因...而關閉"
```

### 重啟提取請求 (Reopen)

```bash
# 重啟已關閉的 PR
gh pr reopen 123
```

### 編輯提取請求 (Edit)

```bash
# 互動式編輯
gh pr edit 123

# 編輯標題
gh pr edit 123 --title "新標題"

# 編輯內容
gh pr edit 123 --body "新描述"

# 新增標籤
gh pr edit 123 --add-label bug,enhancement

# 移除標籤
gh pr edit 123 --remove-label stale

# 新增負責人
gh pr edit 123 --add-assignee user1,user2

# 移除負責人
gh pr edit 123 --remove-assignee user1

# 新增審查者
gh pr edit 123 --add-reviewer user1,user2

# 移除審查者
gh pr edit 123 --remove-reviewer user1

# 標記為準備好進行審查
gh pr edit 123 --ready
```

### 準備好進行審查 (Ready for Review)

```bash
# 將草案 PR 標記為準備就緒
gh pr ready 123
```

### 提取請求檢查 (Pull Request Checks)

```bash
# 檢視 PR 檢查
gh pr checks 123

# 即時監視檢查
gh pr checks 123 --watch

# 監視間隔（秒）
gh pr checks 123 --watch --interval 5
```

### 提取請求評論 (Comment)

```bash
# 新增評論
gh pr comment 123 --body "看起來不錯！"

# 在特定行評論
gh pr comment 123 --body "修正此處" \
  --repo owner/repo \
  --head-owner owner --head-branch feature

# 編輯評論
gh pr comment 123 --edit 456789 --body "已更新"

# 刪除評論
gh pr comment 123 --delete 456789
```

### 審查提取請求 (Review)

```bash
# 審查 PR（開啟編輯器）
gh pr review 123

# 核准 (Approve) PR
gh pr review 123 --approve \
  --approve-body "LGTM!"

# 要求變更 (Request changes)
gh pr review 123 --request-changes \
  --body "請修正這些問題"

# 在 PR 上評論
gh pr review 123 --comment --body "一些想法..."

# 駁回審查
gh pr review 123 --dismiss
```

### 更新分支 (Update Branch)

```bash
# 使用最新的基準分支更新 PR 分支
gh pr update-branch 123

# 強制更新
gh pr update-branch 123 --force

# 使用合併策略
gh pr update-branch 123 --merge
```

### 鎖定/解鎖提取請求 (Lock/Unlock)

```bash
# 鎖定 PR 對話
gh pr lock 123

# 鎖定並附帶原因
gh pr lock 123 --reason off-topic

# 解鎖
gh pr unlock 123
```

### 還原提取請求 (Revert)

```bash
# 還原已合併的 PR
gh pr revert 123

# 使用特定分支名稱進行還原
gh pr revert 123 --branch revert-pr-123
```

### 提取請求狀態 (Status)

```bash
# 顯示 PR 狀態摘要
gh pr status

# 特定儲存庫的狀態
gh pr status --repo owner/repo
```

## GitHub Actions

### 工作流執行 (gh run)

```bash
# 列出工作流執行
gh run list

# 列出特定工作流
gh run list --workflow "ci.yml"

# 列出特定分支
gh run list --branch main

# 限制結果數量
gh run list --limit 20

# JSON 輸出
gh run list --json databaseId,status,conclusion,headBranch

# 檢視執行詳細資訊
gh run view 123456789

# 檢視執行並附帶詳細記錄 (verbose logs)
gh run view 123456789 --log

# 檢視特定作業 (job)
gh run view 123456789 --job 987654321

# 在瀏覽器中檢視
gh run view 123456789 --web

# 即時監視執行情況
gh run watch 123456789

# 指定間隔監視
gh run watch 123456789 --interval 5

# 重新執行失敗的執行
gh run rerun 123456789

# 重新執行特定作業
gh run rerun 123456789 --job 987654321

# 取消執行
gh run cancel 123456789

# 刪除執行
gh run delete 123456789

# 下載執行成品 (artifacts)
gh run download 123456789

# 下載特定成品
gh run download 123456789 --name build

# 下載到目錄
gh run download 123456789 --dir ./artifacts
```

### 工作流 (gh workflow)

```bash
# 列出工作流
gh workflow list

# 檢視工作流詳細資訊
gh workflow view ci.yml

# 檢視工作流 YAML
gh workflow view ci.yml --yaml

# 在瀏覽器中檢視
gh workflow view ci.yml --web

# 啟用工作流
gh workflow enable ci.yml

# 停用工作流
gh workflow disable ci.yml

# 手動執行工作流
gh workflow run ci.yml

# 附帶輸入執行
gh workflow run ci.yml \
  --raw-field \
  version="1.0.0" \
  environment="production"

# 從特定分支執行
gh workflow run ci.yml --ref develop
```

### Actions 快取 (gh cache)

```bash
# 列出快取
gh cache list

# 列出特定分支的快取
gh cache list --branch main

# 限制結果數量
gh cache list --limit 50

# 刪除快取
gh cache delete 123456789

# 刪除所有快取
gh cache delete --all
```

### Actions 秘密 (gh secret)

```bash
# 列出秘密 (secrets)
gh secret list

# 設定秘密（提示輸入值）
gh secret set MY_SECRET

# 從環境變數設定秘密
echo "$MY_SECRET" | gh secret set MY_SECRET

# 為特定環境設定秘密
gh secret set MY_SECRET --env production

# 為組織設定秘密
gh secret set MY_SECRET --org orgname

# 刪除秘密
gh secret delete MY_SECRET

# 從環境中刪除秘密
gh secret delete MY_SECRET --env production
```

### Actions 變數 (gh variable)

```bash
# 列出變數
gh variable list

# 設定變數
gh variable set MY_VAR "some-value"

# 為特定環境設定變數
gh variable set MY_VAR "value" --env production

# 為組織設定變數
gh variable set MY_VAR "value" --org orgname

# 獲取變數值
gh variable get MY_VAR

# 刪除變數
gh variable delete MY_VAR

# 從環境中刪除變數
gh variable delete MY_VAR --env production
```

## 專案 (gh project)

```bash
# 列出專案
gh project list

# 列出特定擁有者的專案
gh project list --owner owner

# 開啟專案
gh project list --open

# 檢視專案
gh project view 123

# 檢視專案項目
gh project view 123 --format json

# 建立專案
gh project create --title "我的專案"

# 在組織中建立
gh project create --title "專案" --org orgname

# 建立並附帶讀取我檔案 (readme)
gh project create --title "專案" --readme "在此填寫描述"

# 編輯專案
gh project edit 123 --title "新標題"

# 刪除專案
gh project delete 123

# 關閉專案
gh project close 123

# 複製專案
gh project copy 123 --owner target-owner --title "複本"

# 標記模板
gh project mark-template 123

# 列出欄位
gh project field-list 123

# 建立欄位
gh project field-create 123 --title "狀態" --datatype single_select

# 刪除欄位
gh project field-delete 123 --id 456

# 列出項目
gh project item-list 123

# 建立項目
gh project item-create 123 --title "新項目"

# 將項目新增至專案
gh project item-add 123 --owner-owner --repo repo --issue 456

# 編輯項目
gh project item-edit 123 --id 456 --title "已更新標題"

# 刪除項目
gh project item-delete 123 --id 456

# 封存項目
gh project item-archive 123 --id 456

# 連結項目
gh project link 123 --id 456 --link-id 789

# 取消連結項目
gh project unlink 123 --id 456 --link-id 789

# 在瀏覽器中檢視專案
gh project view 123 --web
```

## 發佈 (gh release)

```bash
# 列出發佈 (releases)
gh release list

# 檢視最新發佈
gh release view

# 檢視特定發佈
gh release view v1.0.0

# 在瀏覽器中檢視
gh release view v1.0.0 --web

# 建立發佈
gh release create v1.0.0 \
  --notes "在此填寫發佈說明"

# 從檔案建立發佈說明
gh release create v1.0.0 --notes-file notes.md

# 建立發佈並指定目標
gh release create v1.0.0 --target main

# 建立草案發佈
gh release create v1.0.0 --draft

# 建立預發佈 (pre-release)
gh release create v1.0.0 --prerelease

# 建立發佈並附帶標題
gh release create v1.0.0 --title "版本 1.0.0"

# 將成品 (asset) 上傳至發佈
gh release upload v1.0.0 ./file.tar.gz

# 上傳多個成品
gh release upload v1.0.0 ./file1.tar.gz ./file2.tar.gz

# 上傳並附帶標籤（區分大小寫）
gh release upload v1.0.0 ./file.tar.gz --casing

# 刪除發佈
gh release delete v1.0.0

# 刪除並清除標籤 (tag)
gh release delete v1.0.0 --yes

# 刪除特定成品
gh release delete-asset v1.0.0 file.tar.gz

# 下載發佈成品
gh release download v1.0.0

# 下載特定成品
gh release download v1.0.0 --pattern "*.tar.gz"

# 下載到目錄
gh release download v1.0.0 --dir ./downloads

# 下載封存檔 (zip/tar)
gh release download v1.0.0 --archive zip

# 編輯發佈
gh release edit v1.0.0 --notes "已更新說明"

# 驗證發佈簽章
gh release verify v1.0.0

# 驗證特定成品
gh release verify-asset v1.0.0 file.tar.gz
```

## Gists (gh gist)

```bash
# 列出 gists
gh gist list

# 列出所有 gists（包含公開的）
gh gist list --public

# 限制結果數量
gh gist list --limit 20

# 檢視 gist
gh gist view abc123

# 檢視 gist 檔案
gh gist view abc123 --files

# 建立 gist
gh gist create script.py

# 建立並附帶描述
gh gist create script.py --desc "我的指令碼"

# 建立公開 gist
gh gist create script.py --public

# 建立多檔案 gist
gh gist create file1.py file2.py

# 從標準輸入 (stdin) 建立
echo "print('hello')" | gh gist create

# 編輯 gist
gh gist edit abc123

# 刪除 gist
gh gist delete abc123

# 重新命名 gist 檔案
gh gist rename abc123 --filename old.py new.py

# 複製 gist
gh gist clone abc123

# 複製到目錄
gh gist clone abc123 my-directory
```

## Codespaces (gh codespace)

```bash
# 列出 codespaces
gh codespace list

# 建立 codespace
gh codespace create

# 建立特定儲存庫的 codespace
gh codespace create --repo owner/repo

# 建立特定分支的 codespace
gh codespace create --branch develop

# 使用特定機器類型建立
gh codespace create --machine premiumLinux

# 檢視 codespace 詳細資訊
gh codespace view

# SSH 進入 codespace
gh codespace ssh

# 使用特定命令進行 SSH
gh codespace ssh --command "cd /workspaces && ls"

# 在瀏覽器中開啟 codespace
gh codespace code

# 在 VS Code 中開啟
gh codespace code --codec

# 開啟特定路徑
gh codespace code --path /workspaces/repo

# 停止 codespace
gh codespace stop

# 刪除 codespace
gh codespace delete

# 檢視記錄 (logs)
gh codespace logs

--tail 100

# 檢視連接埠 (ports)
gh codespace ports

# 轉發連接埠
gh codespace cp 8080:8080

# 重新建構 codespace
gh codespace rebuild

# 編輯 codespace
gh codespace edit --machine standardLinux

# Jupyter 支援
gh codespace jupyter

# 檔案複製到/從 codespace
gh codespace cp file.txt :/workspaces/file.txt
gh codespace cp :/workspaces/file.txt ./file.txt
```

## 組織 (gh org)

```bash
# 列出組織
gh org list

# 列出特定使用者的組織
gh org list --user username

# JSON 輸出
gh org list --json login,name,description

# 檢視組織
gh org view orgname

# 檢視組織成員
gh org view orgname --json members --jq '.members[] | .login'
```

## 搜尋 (gh search)

```bash
# 搜尋程式碼
gh search code "TODO"

# 在特定儲存庫中搜尋
gh search code "TODO" --repo owner/repo

# 搜尋提交 (commits)
gh search commits "fix bug"

# 搜尋議題 (issues)
gh search issues "label:bug state:open"

# 搜尋 PR
gh search prs "is:open is:pr review:required"

# 搜尋儲存庫
gh search repos "stars:>1000 language:python"

# 限制結果數量
gh search repos "topic:api" --limit 50

# JSON 輸出
gh search repos "stars:>100" --json name,description,stargazers

# 排序結果
gh search repos "language:rust" --order desc --sort stars

# 使用副檔名搜尋
gh search code "import" --extension py

# 網頁搜尋（在瀏覽器中開啟）
gh search prs "is:open" --web
```

## 標籤 (gh label)

```bash
# 列出標籤
gh label list

# 建立標籤
gh label create bug --color "d73a4a" --description "功能運作不正常"

# 使用十六進位顏色建立
gh label create enhancement --color "#a2eeef"

# 編輯標籤
gh label edit bug --name "bug-report" --color "ff0000"

# 刪除標籤
gh label delete bug

# 從儲存庫複製標籤
gh label clone owner/repo

# 複製到特定儲存庫
gh label clone owner/repo --repo target/repo
```

## SSH 金鑰 (gh ssh-key)

```bash
# 列出 SSH 金鑰
gh ssh-key list

# 新增 SSH 金鑰
gh ssh-key add ~/.ssh/id_rsa.pub --title "我的筆記型電腦"

# 新增特定類型的金鑰
gh ssh-key add ~/.ssh/id_ed25519.pub --type "authentication"

# 刪除 SSH 金鑰
gh ssh-key delete 12345

# 按標題刪除
gh ssh-key delete --title "我的筆記型電腦"
```

## GPG 金鑰 (gh gpg-key)

```bash
# 列出 GPG 金鑰
gh gpg-key list

# 新增 GPG 金鑰
gh gpg-key add ~/.ssh/id_rsa.pub

# 刪除 GPG 金鑰
gh gpg-key delete 12345

# 按金鑰 ID 刪除
gh gpg-key delete ABCD1234
```

## 狀態 (gh status)

```bash
# 顯示狀態概覽
gh status

# 特定儲存庫的狀態
gh status --repo owner/repo

# JSON 輸出
gh status --json
```

## 設定 (gh config)

```bash
# 列出所有設定
gh config list

# 獲取特定值
gh config get editor

# 設定值
gh config set editor vim

# 設定 git 協定
gh config set git_protocol ssh

# 清除快取
gh config clear-cache

# 設定提示行為
gh config set prompt disabled
gh config set prompt enabled
```

## 擴充功能 (gh extension)

```bash
# 列出已安裝的擴充功能
gh extension list

# 搜尋擴充功能
gh extension search github

# 安裝擴充功能
gh extension install owner/extension-repo

# 從分支安裝
gh extension install owner/extension-repo --branch develop

# 升級擴充功能
gh extension upgrade extension-name

# 移除擴充功能
gh extension remove extension-name

# 建立新擴充功能
gh extension create my-extension

# 瀏覽擴充功能
gh extension browse

# 執行擴充功能命令
gh extension exec my-extension --arg value
```

## 別名 (gh alias)

```bash
# 列出別名
gh alias list

# 設定別名
gh alias set prview 'pr view --web'

# 設定命令列別名 (shell alias)
gh alias set co 'pr checkout' --shell

# 刪除別名
gh alias delete prview

# 匯入別名
gh alias import ./aliases.sh
```

## API 請求 (gh api)

```bash
# 發送 API 請求
gh api /user

# 帶有方法的請求
gh api --method POST /repos/owner/repo/issues \
  --field title="議題標題" \
  --field body="議題內容"

# 帶有標頭的請求
gh api /user \
  --header "Accept: application/vnd.github.v3+json"

# 帶有分頁的請求
gh api /user/repos --paginate

# 原始輸出（無格式）
gh api /user --raw

# 在輸出中包含標頭
gh api /user --include

# 靜音模式（無進度輸出）
gh api /user --silent

# 從檔案輸入
gh api --input request.json

# 對回應進行 jq 查詢
gh api /user --jq '.login'

# 從回應中獲取欄位
gh api /repos/owner/repo --jq '.stargazers_count'

# GitHub Enterprise
gh api /user --hostname enterprise.internal

# GraphQL 查詢
gh api graphql \
  -f query='
  {
    viewer {
      login
      repositories(first: 5) {
        nodes {
          name
        }
      }
    }
  }'
```

## 規則集 (gh ruleset)

```bash
# 列出規則集
gh ruleset list

# 檢視規則集
gh ruleset view 123

# 檢查規則集
gh ruleset check --branch feature

# 檢查特定儲存庫
gh ruleset check --repo owner/repo --branch main
```

## 證明 (gh attestation)

```bash
# 下載證明 (attestation)
gh attestation download owner/repo \
  --artifact-id 123456

# 驗證證明
gh attestation verify owner/repo

# 獲取受信任的根 (trusted root)
gh attestation trusted-root
```

## 命令列補全 (gh completion)

```bash
# 產生命令列補全指令碼
gh completion -s bash > ~/.gh-complete.bash
gh completion -s zsh > ~/.gh-complete.zsh
gh completion -s fish > ~/.gh-complete.fish
gh completion -s powershell > ~/.gh-complete.ps1

# 特定殼層 (shell) 的說明
gh completion --shell=bash
gh completion --shell=zsh
```

## 預覽 (gh preview)

```bash
# 列出預覽功能
gh preview

# 執行預覽腳本
gh preview prompter
```

## 代理任務 (gh agent-task)

```bash
# 列出代理任務
gh agent-task list

# 檢視代理任務
gh agent-task view 123

# 建立代理任務
gh agent-task create --description "我的任務"
```

## 全域旗標 (Global Flags)

| 旗標                       | 描述                                      |
| -------------------------- | ---------------------------------------- |
| `--help` / `-h`            | 顯示命令的說明                             |
| `--version`                | 顯示 gh 版本                              |
| `--repo [HOST/]OWNER/REPO` | 選擇另一個儲存庫                           |
| `--hostname HOST`          | GitHub 主機名稱                           |
| `--jq EXPRESSION`          | 篩選 JSON 輸出                            |
| `--json FIELDS`            | 輸出包含指定欄位的 JSON                    |
| `--template STRING`        | 使用 Go 範本格式化 JSON                   |
| `--web`                    | 在瀏覽器中開啟                            |
| `--paginate`               | 進行額外的 API 呼叫                       |
| `--verbose`                | 顯示詳細輸出                              |
| `--debug`                  | 顯示偵錯輸出                              |
| `--timeout SECONDS`        | API 請求的最大持續時間                     |
| `--cache CACHE`            | 快取控制（預設為 default、force、bypass）   |

## 輸出格式化 (Output Formatting)

### JSON 輸出 (JSON Output)

```bash
# 基本 JSON
gh repo view --json name,description

# 巢狀欄位
gh repo view --json owner,name --jq '.owner.login + "/" + .name'

# 陣列操作
gh pr list --json number,title --jq '.[] | select(.number > 100)'

# 複雜查詢
gh issue list --json number,title,labels \
  --jq '.[] | {number, title: .title, tags: [.labels[].name]}'
```

### 範本輸出 (Template Output)

```bash
# 自訂範本
gh repo view \
  --template '{{.name}}: {{.description}}'

# 多行範本
gh pr view 123 \
  --template '標題：{{.title}}
作者：{{.author.login}}
狀態：{{.state}}
'
```

## 常見工作流 (Common Workflows)

### 從議題建立 PR (Create PR from Issue)

```bash
# 從議題建立分支
gh issue develop 123 --branch feature/issue-123

# 進行變更、提交、推送
git add .
git commit -m "修正議題 #123"
git push

# 建立連結至議題的 PR
gh pr create --title "修正 #123" --body "關閉 #123"
```

### 批量操作 (Bulk Operations)

```bash
# 關閉多個議題
gh issue list --search "label:stale" \
  --json number \
  --jq '.[].number' | \
  xargs -I {} gh issue close {} --comment "因過時而關閉"

# 為多個 PR 新增標籤
gh pr list --search "review:required" \
  --json number \
  --jq '.[].number' | \
  xargs -I {} gh pr edit {} --add-label needs-review
```

### 儲存庫設定工作流 (Repository Setup Workflow)

```bash
# 建立儲存庫並進行初始設定
gh repo create my-project --public \
  --description "我的超讚專案" \
  --clone \
  --gitignore python \
  --license mit

cd my-project

# 設定分支
git checkout -b develop
git push -u origin develop

# 建立標籤
gh label create bug --color "d73a4a" --description "錯誤回報"
gh label create enhancement --color "a2eeef" --description "功能請求"
gh label create documentation --color "0075ca" --description "文件"
```

### CI/CD 工作流 (CI/CD Workflow)

```bash
# 執行工作流並等待
RUN_ID=$(gh workflow run ci.yml --ref main --jq '.databaseId')

# 監視執行情況
gh run watch "$RUN_ID"

# 完成後下載成品
gh run download "$RUN_ID" --dir ./artifacts
```

### 分叉同步工作流 (Fork Sync Workflow)

```bash
# 分叉儲存庫
gh repo fork original/repo --clone

cd repo

# 新增上游遠端 (upstream remote)
git remote add upstream https://github.com/original/repo.git

# 同步分叉
gh repo sync

# 或手動同步
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## 環境設定 (Environment Setup)

### 殼層整合 (Shell Integration)

```bash
# 新增至 ~/.bashrc 或 ~/.zshrc
eval "$(gh completion -s bash)"  # 或 zsh/fish

# 建立實用的別名 (aliases)
alias gs='gh status'
alias gpr='gh pr view --web'
alias gir='gh issue view --web'
alias gco='gh pr checkout'
```

### Git 設定 (Git Configuration)

```bash
# 使用 gh 作為憑證輔助程式
gh auth setup-git

# 將 gh 設定為儲存庫操作的預設值
git config --global credential.helper 'gh !gh auth setup-git'

# 或手動設定
git config --global credential.helper github
```

## 最佳實踐 (Best Practices)

1. **身分驗證**：對自動化流程使用環境變數

   ```bash
   export GH_TOKEN=$(gh auth token)
   ```

2. **預設儲存庫**：設定預設值以避免重複輸入

   ```bash
   gh repo set-default owner/repo
   ```

3. **JSON 剖析**：使用 jq 進行複雜的資料擷取

   ```bash
   gh pr list --json number,title --jq '.[] | select(.title | contains("fix"))'
   ```

4. **分頁**：對大型結果集使用 --paginate

   ```bash
   gh issue list --state all --paginate
   ```

5. **快取**：對頻繁存取的資料使用快取控制
   ```bash
   gh api /user --cache force
   ```

## 獲取協助 (Getting Help)

```bash
# 一般說明
gh --help

# 命令說明
gh pr --help
gh issue create --help

# 說明主題
gh help formatting
gh help environment
gh help exit-codes
gh help accessibility
```

## 參考資料 (References)

- 官方手冊：https://cli.github.com/manual/
- GitHub 文件：https://docs.github.com/en/github-cli
- REST API：https://docs.github.com/en/rest
- GraphQL API：https://docs.github.com/en/graphql
