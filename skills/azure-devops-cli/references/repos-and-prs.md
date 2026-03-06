# 存放庫與提取要求 (Repositories & Pull Requests)

## 目錄 (Table of Contents)
- [存放庫](#存放庫)
- [存放庫匯入](#存放庫匯入)
- [提取要求](#提取要求)
- [Git 參考](#git-參考)
- [存放庫策略](#存放庫策略)

---

## 存放庫 (Repositories)

### 列出存放庫 (List Repositories)

```bash
az repos list --org https://dev.azure.com/{org} --project {project}
az repos list --output table
```

### 顯示存放庫詳細資訊 (Show Repository Details)

```bash
az repos show --repository {repo-name} --project {project}
```

### 建立存放庫 (Create Repository)

```bash
az repos create --name {repo-name} --project {project}
```

### 刪除存放庫 (Delete Repository)

```bash
az repos delete --id {repo-id} --project {project} --yes
```

### 更新存放庫 (Update Repository)

```bash
az repos update --id {repo-id} --name {new-name} --project {project}
```

## 存放庫匯入 (Repository Import)

### 匯入 Git 存放庫 (Import Git Repository)

```bash
# 從公用 Git 存放庫匯入
az repos import create \
  --git-source-url https://github.com/user/repo \
  --repository {repo-name}

# 包含驗證的匯入
az repos import create \
  --git-source-url https://github.com/user/private-repo \
  --repository {repo-name} \
  --user {username} \
  --password {password-or-pat}
```

## 提取要求 (Pull Requests)

### 建立提取要求 (Create Pull Request)

```bash
# 基本 PR 建立
az repos pr create \
  --repository {repo} \
  --source-branch {source-branch} \
  --target-branch {target-branch} \
  --title "PR 標題" \
  --description "PR 說明" \
  --open

# 包含工作項目的 PR
az repos pr create \
  --repository {repo} \
  --source-branch {source-branch} \
  --work-items 63 64

# 包含審核者的草稿 PR
az repos pr create \
  --repository {repo} \
  --source-branch feature/new-feature \
  --target-branch main \
  --title "功能：新功能" \
  --draft true \
  --reviewers user1@example.com user2@example.com \
  --required-reviewers lead@example.com \
  --labels "enhancement" "backlog"
```

### 列出提取要求 (List Pull Requests)

```bash
# 所有 PR
az repos pr list --repository {repo}

# 依狀態篩選
az repos pr list --repository {repo} --status active

# 依建立者篩選
az repos pr list --repository {repo} --creator {email}

# 輸出為表格
az repos pr list --repository {repo} --output table
```

### 顯示 PR 詳細資訊 (Show PR Details)

```bash
az repos pr show --id {pr-id}
az repos pr show --id {pr-id} --open  # 在瀏覽器中開啟
```

### 更新 PR (完成/放棄/草稿) (Update PR (Complete/Abandon/Draft))

```bash
# 完成 PR
az repos pr update --id {pr-id} --status completed

# 放棄 PR
az repos pr update --id {pr-id} --status abandoned

# 設定為草稿
az repos pr update --id {pr-id} --draft true

# 發佈草稿 PR
az repos pr update --id {pr-id} --draft false

# 策略通過時自動完成
az repos pr update --id {pr-id} --auto-complete true

# 設定標題與說明
az repos pr update --id {pr-id} --title "新標題" --description "新說明"
```

### 在本機取出 PR (Checkout PR Locally)

```bash
# 取出 PR 分支
az repos pr checkout --id {pr-id}

# 包含特定遠端的取出
az repos pr checkout --id {pr-id} --remote-name upstream
```

### 對 PR 投票 (Vote on PR)

```bash
az repos pr set-vote --id {pr-id} --vote approve
az repos pr set-vote --id {pr-id} --vote approve-with-suggestions
az repos pr set-vote --id {pr-id} --vote reject
az repos pr set-vote --id {pr-id} --vote wait-for-author
az repos pr set-vote --id {pr-id} --vote reset
```

### PR 審核者 (PR Reviewers)

```bash
# 增加審核者
az repos pr reviewer add --id {pr-id} --reviewers user1@example.com user2@example.com

# 列出審核者
az repos pr reviewer list --id {pr-id}

# 移除審核者
az repos pr reviewer remove --id {pr-id} --reviewers user1@example.com
```

### PR 工作項目 (PR Work Items)

```bash
# 將工作項目新增至 PR
az repos pr work-item add --id {pr-id} --work-items {id1} {id2}

# 列出 PR 工作項目
az repos pr work-item list --id {pr-id}

# 從 PR 移除工作項目
az repos pr work-item remove --id {pr-id} --work-items {id1}
```

### PR 策略 (PR Policies)

```bash
# 列出 PR 的策略
az repos pr policy list --id {pr-id}

# 為 PR 將策略評估加入佇列
az repos pr policy queue --id {pr-id} --evaluation-id {evaluation-id}
```

## Git 參考 (Git References)

### 列出參考 (分支) (List References (Branches))

```bash
az repos ref list --repository {repo}
az repos ref list --repository {repo} --query "[?name=='refs/heads/main']"
```

### 建立參考 (分支) (Create Reference (Branch))

```bash
az repos ref create --name refs/heads/new-branch --object-type commit --object {commit-sha}
```

### 刪除參考 (分支) (Delete Reference (Branch))

```bash
az repos ref delete --name refs/heads/old-branch --repository {repo} --project {project}
```

### 鎖定/解除鎖定分支 (Lock/Unlock Branch)

```bash
az repos ref lock --name refs/heads/main --repository {repo} --project {project}
az repos ref unlock --name refs/heads/main --repository {repo} --project {project}
```

## 存放庫策略 (Repository Policies)

### 列出所有策略 (List All Policies)

```bash
az repos policy list --repository {repo-id} --branch main
```

### 建立/更新/刪除策略 (Create/Update/Delete Policy)

```bash
# 從設定檔建立
az repos policy create --config policy.json

# 更新
az repos policy update --id {policy-id} --config updated-policy.json

# 刪除
az repos policy delete --id {policy-id} --yes
```

### 核准者計數策略 (Approver Count Policy)

```bash
az repos policy approver-count create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --minimum-approver-count 2 \
  --creator-vote-counts true
```

### 建構策略 (Build Policy)

```bash
az repos policy build create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --build-definition-id {definition-id} \
  --queue-on-source-update-only true \
  --valid-duration 720
```

### 工作項目連結策略 (Work Item Linking Policy)

```bash
az repos policy work-item-linking create \
  --blocking true \
  --branch main \
  --enabled true \
  --repository-id {repo-id}
```

### 必要審核者策略 (Required Reviewer Policy)

```bash
az repos policy required-reviewer create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --required-reviewers user@example.com
```

### 合併策略策略 (Merge Strategy Policy)

```bash
az repos policy merge-strategy create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --allow-squash true \
  --allow-rebase true \
  --allow-no-fast-forward true
```

### 大小寫強制執行策略 (Case Enforcement Policy)

```bash
az repos policy case-enforcement create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id}
```

### 必要註解策略 (Comment Required Policy)

```bash
az repos policy comment-required create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id}
```

### 檔案大小策略 (File Size Policy)

```bash
az repos policy file-size create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --maximum-file-size 10485760  # 10MB，以位元組為單位
```
