# 組織、安全性與管理 (Organization, Security & Administration)

## 目錄 (Table of Contents)
- [專案](#專案)
- [延伸模組管理](#延伸模組管理)
- [服務端點](#服務端點)
- [小組](#小組)
- [使用者](#使用者)
- [安全性群組](#安全性群組)
- [安全性權限](#安全性權限)
- [Wiki](#wiki)
- [管理](#管理)
- [DevOps 延伸模組](#devops-延伸模組)

---

## 專案 (Projects)

### 列出專案 (List Projects)

```bash
az devops project list --organization https://dev.azure.com/{org}
az devops project list --top 10 --output table
```

### 建立專案 (Create Project)

```bash
az devops project create \
  --name myNewProject \
  --organization https://dev.azure.com/{org} \
  --description "我的新 DevOps 專案" \
  --source-control git \
  --visibility private
```

### 顯示專案詳細資訊 (Show Project Details)

```bash
az devops project show --project {project-name} --org https://dev.azure.com/{org}
```

### 刪除專案 (Delete Project)

```bash
az devops project delete --id {project-id} --org https://dev.azure.com/{org} --yes
```

## 延伸模組管理 (Extension Management)

### 列出延伸模組 (List Extensions)

```bash
# 列出可用的延伸模組
az extension list-available --output table

# 列出已安裝的延伸模組
az extension list --output table
```

### 管理 Azure DevOps 延伸模組 (Manage Azure DevOps Extension)

```bash
# 安裝 Azure DevOps 延伸模組
az extension add --name azure-devops

# 更新 Azure DevOps 延伸模組
az extension update --name azure-devops

# 移除延伸模組
az extension remove --name azure-devops

# 從本機路徑安裝
az extension add --source ~/extensions/azure-devops.whl
```

## 服務端點 (Service Endpoints)

### 列出服務端點 (List Service Endpoints)

```bash
az devops service-endpoint list --project {project}
az devops service-endpoint list --project {project} --output table
```

### 顯示服務端點 (Show Service Endpoint)

```bash
az devops service-endpoint show --id {endpoint-id} --project {project}
```

### 建立服務端點 (Create Service Endpoint)

```bash
# 使用設定檔
az devops service-endpoint create --service-endpoint-configuration endpoint.json --project {project}
```

### 刪除服務端點 (Delete Service Endpoint)

```bash
az devops service-endpoint delete --id {endpoint-id} --project {project} --yes
```

## 小組 (Teams)

### 列出小組 (List Teams)

```bash
az devops team list --project {project}
```

### 顯示小組 (Show Team)

```bash
az devops team show --team {team-name} --project {project}
```

### 建立小組 (Create Team)

```bash
az devops team create \
  --name {team-name} \
  --description "小組說明" \
  --project {project}
```

### 更新小組 (Update Team)

```bash
az devops team update \
  --team {team-name} \
  --project {project} \
  --name "{new-team-name}" \
  --description "已更新說明"
```

### 刪除小組 (Delete Team)

```bash
az devops team delete --team {team-name} --project {project} --yes
```

### 顯示小組成員 (Show Team Members)

```bash
az devops team list-member --team {team-name} --project {project}
```

## 使用者 (Users)

### 列出使用者 (List Users)

```bash
az devops user list --org https://dev.azure.com/{org}
az devops user list --top 10 --output table
```

### 顯示使用者 (Show User)

```bash
az devops user show --user {user-id-or-email} --org https://dev.azure.com/{org}
```

### 新增使用者 (Add User)

```bash
az devops user add \
  --email user@example.com \
  --license-type express \
  --org https://dev.azure.com/{org}
```

### 更新使用者 (Update User)

```bash
az devops user update \
  --user {user-id-or-email} \
  --license-type advanced \
  --org https://dev.azure.com/{org}
```

### 移除使用者 (Remove User)

```bash
az devops user remove --user {user-id-or-email} --org https://dev.azure.com/{org} --yes
```

## 安全性群組 (Security Groups)

### 列出群組 (List Groups)

```bash
# 列出專案中的所有群組
az devops security group list --project {project}

# 列出組織中的所有群組
az devops security group list --scope organization

# 包含篩選的清單
az devops security group list --project {project} --subject-types vstsgroup
```

### 顯示群組詳細資訊 (Show Group Details)

```bash
az devops security group show --group-id {group-id}
```

### 建立群組 (Create Group)

```bash
az devops security group create \
  --name {group-name} \
  --description "群組說明" \
  --project {project}
```

### 更新群組 (Update Group)

```bash
az devops security group update \
  --group-id {group-id} \
  --name "{new-group-name}" \
  --description "已更新說明"
```

### 刪除群組 (Delete Group)

```bash
az devops security group delete --group-id {group-id} --yes
```

### 群組成員資格 (Group Memberships)

```bash
# 列出成員資格
az devops security group membership list --id {group-id}

# 新增成員
az devops security group membership add \
  --group-id {group-id} \
  --member-id {member-id}

# 移除成員
az devops security group membership remove \
  --group-id {group-id} \
  --member-id {member-id} --yes
```

## 安全性權限 (Security Permissions)

### 列出命名空間 (List Namespaces)

```bash
az devops security permission namespace list
```

### 顯示命名空間詳細資訊 (Show Namespace Details)

```bash
# 顯示命名空間中可用的權限
az devops security permission namespace show --namespace "GitRepositories"
```

### 列出權限 (List Permissions)

```bash
# 列出使用者/群組和命名空間的權限
az devops security permission list \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project}

# 列出特定權杖（存放庫）的權限
az devops security permission list \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}"
```

### 顯示權限 (Show Permissions)

```bash
az devops security permission show \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}"
```

### 更新權限 (Update Permissions)

```bash
# 授與權限
az devops security permission update \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}" \
  --permission-mask "Pull,Contribute"

# 拒絕權限
az devops security permission update \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}" \
  --permission-mask 0
```

### 重設權限 (Reset Permissions)

```bash
# 重設特定權限位元
az devops security permission reset \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}" \
  --permission-mask "Pull,Contribute"

# 重設所有權限
az devops security permission reset-all \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}" --yes
```

## Wiki (Wikis)

### 列出 Wiki (List Wikis)

```bash
# 列出專案中的所有 Wiki
az devops wiki list --project {project}

# 列出組織中的所有 Wiki
az devops wiki list
```

### 顯示 Wiki (Show Wiki)

```bash
az devops wiki show --wiki {wiki-name} --project {project}
az devops wiki show --wiki {wiki-name} --project {project} --open
```

### 建立 Wiki (Create Wiki)

```bash
# 建立專案 Wiki
az devops wiki create \
  --name {wiki-name} \
  --project {project} \
  --type projectWiki

# 從存放庫建立程式碼 Wiki
az devops wiki create \
  --name {wiki-name} \
  --project {project} \
  --type codeWiki \
  --repository {repo-name} \
  --mapped-path /wiki
```

### 刪除 Wiki (Delete Wiki)

```bash
az devops wiki delete --wiki {wiki-id} --project {project} --yes
```

### Wiki 頁面 (Wiki Pages)

```bash
# 列出頁面
az devops wiki page list --wiki {wiki-name} --project {project}

# 顯示頁面
az devops wiki page show \
  --wiki {wiki-name} \
  --path "/page-name" \
  --project {project}

# 建立頁面
az devops wiki page create \
  --wiki {wiki-name} \
  --path "/new-page" \
  --content "# New Page\n\nPage content here..." \
  --project {project}

# 更新頁面
az devops wiki page update \
  --wiki {wiki-name} \
  --path "/existing-page" \
  --content "# Updated Page\n\nNew content..." \
  --project {project}

# 刪除頁面
az devops wiki page delete \
  --wiki {wiki-name} \
  --path "/old-page" \
  --project {project} --yes
```

## 管理 (Administration)

### 橫幅管理 (Banner Management)

```bash
# 列出橫幅
az devops admin banner list

# 顯示橫幅詳細資訊
az devops admin banner show --id {banner-id}

# 新增橫幅
az devops admin banner add \
  --message "已排定系統維護" \
  --level info  # info, warning, error

# 更新橫幅
az devops admin banner update \
  --id {banner-id} \
  --message "已更新訊息" \
  --level warning \
  --expiration-date "2025-12-31T23:59:59Z"

# 移除橫幅
az devops admin banner remove --id {banner-id}
```

## DevOps 延伸模組 (DevOps Extensions)

管理安裝在 Azure DevOps 組織中的延伸模組（與 CLI 延伸模組不同）。

```bash
# 列出已安裝的延伸模組
az devops extension list --org https://dev.azure.com/{org}

# 搜尋市集延伸模組
az devops extension search --search-query "docker"

# 顯示延伸模組詳細資訊
az devops extension show --ext-id {extension-id} --org https://dev.azure.com/{org}

# 安裝延伸模組
az devops extension install \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org} \
  --publisher {publisher-id}

# 啟用延伸模組
az devops extension enable \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org}

# 停用延伸模組
az devops extension disable \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org}

# 解除安裝延伸模組
az devops extension uninstall \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org} --yes
```
