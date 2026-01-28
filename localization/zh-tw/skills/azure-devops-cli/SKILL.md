---
name: azure-devops-cli
description: 使用帶有 Azure DevOps 擴充功能的 Azure CLI 管理 Azure DevOps 資源，包括專案、儲存庫、流程、建構、提取請求、工作項目、成品和服務端點。在處理 Azure DevOps、az 命令、devops 自動化、CI/CD 或使用者提及 Azure DevOps CLI 時使用。
---

# Azure DevOps CLI

此技能有助於使用帶有 Azure DevOps 擴充功能的 Azure CLI 管理 Azure DevOps 資源。

**CLI 版本：** 2.81.0（截至 2025 年最新）

## 先決條件

安裝 Azure CLI 和 Azure DevOps 擴充功能：

```bash
# 安裝 Azure CLI
brew install azure-cli  # macOS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux
pip install azure-cli  # 透過 pip

# 驗證安裝
az --version

# 安裝 Azure DevOps 擴充功能
az extension add --name azure-devops
az extension show --name azure-devops
```

## CLI 結構

```
az devops          # 主要的 DevOps 命令
├── admin          # 管理 (橫幅訊息)
├── extension      # 擴充功能管理
├── project        # 小組專案
├── security       # 安全性操作
│   ├── group      # 安全性群組
│   └── permission # 安全性權限
├── service-endpoint # 服務連線
├── team           # 小組
├── user           # 使用者
├── wiki           # Wiki
├── configure      # 設定預設值
├── invoke         # 呼叫 REST API
├── login          # 身分驗證
└── logout         # 清除憑證

az pipelines       # Azure Pipelines (流程)
├── agent          # 代理程式 (Agents)
├── build          # 建構 (Builds)
├── folder         # 流程資料夾
├── pool           # 代理程式集區
├── queue          # 代理程式佇列
├── release        # 發佈 (Releases)
├── runs           # 流程執行 (Runs)
├── variable       # 流程變數
└── variable-group # 變數群組

az boards          # Azure Boards (看板)
├── area           # 區域路徑
├── iteration      # 疊代 (Iterations)
└── work-item      # 工作項目

az repos           # Azure Repos (儲存庫)
├── import         # Git 匯入
├── policy         # 分支原則 (Policies)
├── pr             # 提取請求 (Pull Requests)
└── ref            # Git 參考

az artifacts       # Azure Artifacts (成品)
└── universal      # 通用套件 (Universal Packages)
    ├── download   # 下載套件
    └── publish    # 發佈套件
```

## 身分驗證 (Authentication)

### 登入 Azure DevOps

```bash
# 互動式登入（會提示輸入個人存取權杖 PAT）
az devops login --organization https://dev.azure.com/{org}

# 使用 PAT 權杖登入
az devops login --organization https://dev.azure.com/{org} --token YOUR_PAT_TOKEN

# 登出
az devops logout --organization https://dev.azure.com/{org}
```

### 設定預設值 (Configure Defaults)

```bash
# 設定預設組織和小組專案
az devops configure --defaults organization=https://dev.azure.com/{org} project={project}

# 列出目前設定
az devops configure --list

# 啟用 Git 別名
az devops configure --use-git-aliases true
```

## 擴充功能管理 (Extension Management)

### 列出擴充功能

```bash
# 列出可用的擴充功能
az extension list-available --output table

# 列出已安裝的擴充功能
az extension list --output table
```

### 管理 Azure DevOps 擴充功能

```bash
# 安裝 Azure DevOps 擴充功能
az extension add --name azure-devops

# 更新 Azure DevOps 擴充功能
az extension update --name azure-devops

# 移除擴充功能
az extension remove --name azure-devops

# 從本地路徑安裝
az extension add --source ~/extensions/azure-devops.whl
```

## 專案 (Projects)

### 列出專案

```bash
az devops project list --organization https://dev.azure.com/{org}
az devops project list --top 10 --output table
```

### 建立專案

```bash
az devops project create \
  --name myNewProject \
  --organization https://dev.azure.com/{org} \
  --description "我的新 DevOps 專案" \
  --source-control git \
  --visibility private
```

### 顯示專案詳細資訊

```bash
az devops project show --project {project-name} --org https://dev.azure.com/{org}
```

### 刪除專案

```bash
az devops project delete --id {repo-id} --org https://dev.azure.com/{org} --yes
```

## 儲存庫 (Repositories)

### 列出儲存庫

```bash
az repos list --org https://dev.azure.com/{org} --project {project}
az repos list --output table
```

### 顯示儲存庫詳細資訊

```bash
az repos show --repository {repo-name} --project {project}
```

### 建立儲存庫

```bash
az repos create --name {repo-name} --project {project}
```

### 刪除儲存庫

```bash
az repos delete --id {repo-id} --project {project} --yes
```

### 更新儲存庫

```bash
az repos update --id {repo-id} --name {new-name} --project {project}
```

## 儲存庫匯入 (Repository Import)

### 匯入 Git 儲存庫

```bash
# 從公開的 Git 儲存庫匯入
az repos import create \
  --git-source-url https://github.com/user/repo \
  --repository {repo-name}

# 帶有身分驗證的匯入
az repos import create \
  --git-source-url https://github.com/user/private-repo \
  --repository {repo-name} \
  --user {username} \
  --password {password-or-pat}
```

## 提取請求 (Pull Requests)

### 建立提取請求

```bash
# 基本 PR 建立
az repos pr create \
  --repository {repo} \
  --source-branch {source-branch} \
  --target-branch {target-branch} \
  --title "PR 標題" \
  --description "PR 描述" \
  --open

# 帶有工作項目的 PR
az repos pr create \
  --repository {repo} \
  --source-branch {source-branch} \
  --work-items 63 64

# 帶有審查者的草案 PR
az repos pr create \
  --repository {repo} \
  --source-branch feature/new-feature \
  --target-branch main \
  --title "功能：新功能" \
  --draft true \
  --reviewers user1@example.com user2@example.com \
  --required-reviewers lead@example.com \
  --labels "優化" "待處理"
```

### 列出提取請求

```bash
# 所有 PR
az repos pr list --repository {repo}

# 按狀態篩選
az repos pr list --repository {repo} --status active

# 按建立者篩選
az repos pr list --repository {repo} --creator {email}

# 輸出為表格
az repos pr list --repository {repo} --output table
```

### 顯示 PR 詳細資訊

```bash
az repos pr show --id {pr-id}
az repos pr show --id {pr-id} --open  # 在瀏覽器中開啟
```

### 更新 PR (完成/棄用/草案)

```bash
# 完成 PR
az repos pr update --id {pr-id} --status completed

# 棄用 PR
az repos pr update --id {pr-id} --status abandoned

# 設定為草案
az repos pr update --id {pr-id} --draft true

# 發佈草案 PR
az repos pr update --id {pr-id} --draft false

# 原則通過後自動完成
az repos pr update --id {pr-id} --auto-complete true

# 設定標題和描述
az repos pr update --id {pr-id} --title "新標題" --description "新描述"
```

### 在本地檢出 PR

```bash
# 檢出 PR 分支
az repos pr checkout --id {pr-id}

# 使用特定的遠端名稱檢出
az repos pr checkout --id {pr-id} --remote-name upstream
```

### 對 PR 進行投票

```bash
az repos pr set-vote --id {pr-id} --vote approve
az repos pr set-vote --id {pr-id} --vote approve-with-suggestions
az repos pr set-vote --id {pr-id} --vote reject
az repos pr set-vote --id {pr-id} --vote wait-for-author
az repos pr set-vote --id {pr-id} --vote reset
```

### PR 審查者 (Reviewers)

```bash
# 新增審查者
az repos pr reviewer add --id {pr-id} --reviewers user1@example.com user2@example.com

# 列出審查者
az repos pr reviewer list --id {pr-id}

# 移除審查者
az repos pr reviewer remove --id {pr-id} --reviewers user1@example.com
```

### PR 工作項目

```bash
# 將工作項目新增至 PR
az repos pr work-item add --id {pr-id} --work-items {id1} {id2}

# 列出 PR 的工作項目
az repos pr work-item list --id {pr-id}

# 從 PR 中移除工作項目
az repos pr work-item remove --id {pr-id} --work-items {id1}
```

### PR 原則 (Policies)

```bash
# 列出 PR 的原則
az repos pr policy list --id {pr-id}

# 為 PR 排除原則評估佇列
az repos pr policy queue --id {pr-id} --evaluation-id {evaluation-id}
```

## 流程 (Pipelines)

### 列出流程

```bash
az pipelines list --output table
az pipelines list --query "[?name=='myPipeline']"
az pipelines list --folder-path 'folder/subfolder'
```

### 建立流程

```bash
# 從本地儲存庫背景建立（自動偵測設定）
az pipelines create --name 'ContosoBuild' --description 'Contoso 專案的流程'

# 帶有特定分支和 YAML 路徑
az pipelines create \
  --name {pipeline-name} \
  --repository {repo} \
  --branch main \
  --yaml-path azure-pipelines.yml \
  --description "我的 CI/CD 流程"

# 為 GitHub 儲存庫建立
az pipelines create \
  --name 'GitHubPipeline' \
  --repository https://github.com/Org/Repo \
  --branch main \
  --repository-type github

# 跳過第一次執行
az pipelines create --name 'MyPipeline' --skip-run true
```

### 顯示流程

```bash
az pipelines show --id {pipeline-id}
az pipelines show --name {pipeline-name}
```

### 更新流程

```bash
az pipelines update --id {pipeline-id} --name "新名稱" --description "已更新的描述"
```

### 刪除流程

```bash
az pipelines delete --id {pipeline-id} --yes
```

### 執行流程

```bash
# 按名稱執行
az pipelines run --name {pipeline-name} --branch main

# 按 ID 執行
az pipelines run --id {pipeline-id} --branch refs/heads/main

# 帶有參數
az pipelines run --name {pipeline-name} --parameters version=1.0.0 environment=prod

# 帶有變數
az pipelines run --name {pipeline-name} --variables buildId=123 configuration=release

# 在瀏覽器中開啟結果
az pipelines run --name {pipeline-name} --open
```

## 流程執行 (Pipeline Runs)

### 列出執行

```bash
az pipelines runs list --pipeline {pipeline-id}
az pipelines runs list --name {pipeline-name} --top 10
az pipelines runs list --branch main --status completed
```

### 顯示執行詳細資訊

```bash
az pipelines runs show --run-id {run-id}
az pipelines runs show --run-id {run-id} --open
```

### 流程成品 (Pipeline Artifacts)

```bash
# 列出執行的成品
az pipelines runs artifact list --run-id {run-id}

# 下載成品
az pipelines runs artifact download \
  --artifact-name '{artifact-name}' \
  --path {local-path} \
  --run-id {run-id}

# 上傳成品
az pipelines runs artifact upload \
  --artifact-name '{artifact-name}' \
  --path {local-path} \
  --run-id {run-id}
```

### 流程執行標籤

```bash
# 為執行新增標籤
az pipelines runs tag add --run-id {run-id} --tags production v1.0

# 列出執行標籤
az pipelines runs tag list --run-id {run-id} --output table
```

## 建構 (Builds)

### 列出建構

```bash
az pipelines build list
az pipelines build list --definition {build-definition-id}
az pipelines build list --status completed --result succeeded
```

### 排入建構佇列

```bash
az pipelines build queue --definition {build-definition-id} --branch main
az pipelines build queue --definition {build-definition-id} --parameters version=1.0.0
```

### 顯示建構詳細資訊

```bash
az pipelines build show --id {build-id}
```

### 取消建構

```bash
az pipelines build cancel --id {build-id}
```

### 建構標籤

```bash
# 為建構新增標籤
az pipelines build tag add --build-id {build-id} --tags prod release

# 從建構刪除標籤
az pipelines build tag delete --build-id {build-id} --tag prod
```

## 建構定義 (Build Definitions)

### 列出建構定義

```bash
az pipelines build definition list
az pipelines build definition list --name {definition-name}
```

### 顯示建構定義

```bash
az pipelines build definition show --id {definition-id}
```

## 發佈 (Releases)

### 列出發佈

```bash
az pipelines release list
az pipelines release list --definition {release-definition-id}
```

### 建立發佈

```bash
az pipelines release create --definition {release-definition-id}
az pipelines release create --definition {release-definition-id} --description "Release v1.0"
```

### 顯示發佈

```bash
az pipelines release show --id {release-id}
```

## 發佈定義 (Release Definitions)

### 列出發佈定義

```bash
az pipelines release definition list
```

### 顯示發佈定義

```bash
az pipelines release definition show --id {definition-id}
```

## 流程變數 (Pipeline Variables)

### 列出變數

```bash
az pipelines variable list --pipeline-id {pipeline-id}
```

### 建立變數

```bash
# 非秘密變數
az pipelines variable create \
  --name {var-name} \
  --value {var-value} \
  --pipeline-id {pipeline-id}

# 秘密變數
az pipelines variable create \
  --name {var-name} \
  --secret true \
  --pipeline-id {pipeline-id}

# 帶有提示的秘密變數
az pipelines variable create \
  --name {var-name} \
  --secret true \
  --prompt true \
  --pipeline-id {pipeline-id}
```

### 更新變數

```bash
az pipelines variable update \
  --name {var-name} \
  --value {new-value} \
  --pipeline-id {pipeline-id}

# 更新秘密變數
az pipelines variable update \
  --name {var-name} \
  --secret true \
  --value "{new-secret-value}" \
  --pipeline-id {pipeline-id}
```

### 刪除變數

```bash
az pipelines variable delete --name {var-name} --pipeline-id {pipeline-id} --yes
```

## 變數群組 (Variable Groups)

### 列出變數群組

```bash
az pipelines variable-group list
az pipelines variable-group list --output table
```

### 顯示變數群組

```bash
az pipelines variable-group show --id {group-id}
```

### 建立變數群組

```bash
az pipelines variable-group create \
  --name {group-name} \
  --variables key1=value1 key2=value2 \
  --authorize true
```

### 更新變數群組

```bash
az pipelines variable-group update \
  --id {group-id} \
  --name {new-name} \
  --description "已更新的描述"
```

### 刪除變數群組

```bash
az pipelines variable-group delete --id {group-id} --yes
```

### 變數群組變數 (Variable Group Variables)

#### 列出變數

```bash
az pipelines variable-group variable list --group-id {group-id}
```

#### 建立變數

```bash
# 非秘密變數
az pipelines variable-group variable create \
  --group-id {group-id} \
  --name {var-name} \
  --value {var-value}

# 秘密變數（如果未提供，會提示輸入值）
az pipelines variable-group variable create \
  --group-id {group-id} \
  --name {var-name} \
  --secret true

# 使用環境變數設定秘密變數
export AZURE_DEVOPS_EXT_PIPELINE_VAR_MySecret=secretvalue
az pipelines variable-group variable create \
  --group-id {group-id} \
  --name MySecret \
  --secret true
```

#### 更新變數

```bash
az pipelines variable-group variable update \
  --group-id {group-id} \
  --name {var-name} \
  --value {new-value} \
  --secret false
```

#### 刪除變數

```bash
az pipelines variable-group variable delete \
  --group-id {group-id} \
  --name {var-name}
```

## 流程資料夾 (Pipeline Folders)

### 列出資料夾

```bash
az pipelines folder list
```

### 建立資料夾

```bash
az pipelines folder create --path 'folder/subfolder' --description "我的資料夾"
```

### 刪除資料夾

```bash
az pipelines folder delete --path 'folder/subfolder'
```

### 更新資料夾

```bash
az pipelines folder update --path 'old-folder' --new-path 'new-folder'
```

## 代理程式集區 (Agent Pools)

### 列出代理程式集區

```bash
az pipelines pool list
az pipelines pool list --pool-type automation
az pipelines pool list --pool-type deployment
```

### 顯示代理程式集區

```bash
az pipelines pool show --pool-id {pool-id}
```

## 代理程式佇列 (Agent Queues)

### 列出代理程式佇列

```bash
az pipelines queue list
az pipelines queue list --pool-name {pool-name}
```

### 顯示代理程式佇列

```bash
az pipelines queue show --id {queue-id}
```

## 工作項目 (看板 Boards)

### 查詢工作項目

```bash
# 使用 WIQL 查詢
az boards query \
  --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.AssignedTo] = @Me AND [System.State] = 'Active'"

# 使用特定輸出格式進行查詢
az boards query --wiql "SELECT * FROM WorkItems" --output table
```

### 顯示工作項目

```bash
az boards work-item show --id {work-item-id}
az boards work-item show --id {work-item-id} --open
```

### 建立工作項目

```bash
# 基本工作項目
az boards work-item create \
  --title "修復登入功能錯誤" \
  --type Bug \
  --assigned-to user@example.com \
  --description "使用者無法使用 SSO 登入"

# 帶有區域和疊代的工作項目
az boards work-item create \
  --title "新功能" \
  --type "User Story" \
  --area "Project\\Area1" \
  --iteration "Project\\Sprint 1"

# 帶有自訂欄位的工作項目
az boards work-item create \
  --title "工作" \
  --type Task \
  --fields "Priority=1" "Severity=2"

# 帶有討論評論的工作項目
az boards work-item create \
  --title "議題" \
  --type Bug \
  --discussion "初步調查已完成"

# 建立後在瀏覽器中開啟
az boards work-item create --title "Bug" --type Bug --open
```

### 更新工作項目

```bash
# 更新狀態、標題和負責人
az boards work-item update \
  --id {work-item-id} \
  --state "Active" \
  --title "已更新的標題" \
  --assigned-to user@example.com

# 移動到不同區域
az boards work-item update \
  --id {work-item-id} \
  --area "{ProjectName}\\{Team}\\{Area}"

# 更改疊代
az boards work-item update \
  --id {work-item-id} \
  --iteration "{ProjectName}\\Sprint 5"

# 新增評論/討論
az boards work-item update \
  --id {work-item-id} \
  --discussion "正在處理中"

# 更新自訂欄位
az boards work-item update \
  --id {work-item-id} \
  --fields "Priority=1" "StoryPoints=5"
```

### 刪除工作項目

```bash
# 軟刪除（可以還原）
az boards work-item delete --id {work-item-id} --yes

# 永久刪除
az boards work-item delete --id {work-item-id} --destroy --yes
```

### 工作項目關聯 (Work Item Relations)

```bash
# 列出關聯
az boards work-item relation list --id {work-item-id}

# 列出支援的關聯類型
az boards work-item relation list-type

# 新增關聯
az boards work-item relation add --id {work-item-id} --relation-type parent --target-id {parent-id}

# 移除關聯
az boards work-item relation remove --id {work-item-id} --relation-id {relation-id}
```

## 區域路徑 (Area Paths)

### 列出專案的區域

```bash
az boards area project list --project {project}
az boards area project show --path "Project\\Area1" --project {project}
```

### 建立區域

```bash
az boards area project create --path "Project\\NewArea" --project {project}
```

### 更新區域

```bash
az boards area project update \
  --path "Project\\OldArea" \
  --new-path "Project\\UpdatedArea" \
  --project {project}
```

### 刪除區域

```bash
az boards area project delete --path "Project\\AreaToDelete" --project {project} --yes
```

### 區域小組管理

```bash
# 列出小組的區域
az boards area team list --team {team-name} --project {project}

# 將區域新增至小組
az boards area team add \
  --team {team-name} \
  --path "Project\\NewArea" \
  --project {project}

# 從小組中移除區域
az boards area team remove \
  --team {team-name} \
  --path "Project\\AreaToRemove" \
  --project {project}

# 更新小組區域
az boards area team update \
  --team {team-name} \
  --path "Project\\Area" \
  --project {project} \
  --include-sub-areas true
```

## 疊代 (Iterations)

### 列出專案的疊代

```bash
az boards iteration project list --project {project}
az boards iteration project show --path "Project\\Sprint 1" --project {project}
```

### 建立疊代

```bash
az boards iteration project create --path "Project\\Sprint 1" --project {project}
```

### 更新疊代

```bash
az boards iteration project update \
  --path "Project\\OldSprint" \
  --new-path "Project\\NewSprint" \
  --project {project}
```

### 刪除疊代

```bash
az boards iteration project delete --path "Project\\OldSprint" --project {project} --yes
```

### 列出小組的疊代

```bash
az boards iteration team list --team {team-name} --project {project}
```

### 將疊代新增至小組

```bash
az boards iteration team add \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}
```

### 從小組中移除疊代

```bash
az boards iteration team remove \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}
```

### 列出疊代中的工作項目

```bash
az boards iteration team list-work-items \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}
```

### 設定小組的預設疊代

```bash
az boards iteration team set-default-iteration \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}
```

### 顯示預設疊代

```bash
az boards iteration team show-default-iteration \
  --team {team-name} \
  --project {project}
```

### 設定小組的待處理疊代 (Backlog Iteration)

```bash
az boards iteration team set-backlog-iteration \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}
```

### 顯示待處理疊代

```bash
az boards iteration team show-backlog-iteration \
  --team {team-name} \
  --project {project}
```

### 顯示目前疊代

```bash
az boards iteration team show --team {team-name} --project {project} --timeframe current
```

## Git 參考 (Git References)

### 列出參考（分支）

```bash
az repos ref list --repository {repo}
az repos ref list --repository {repo} --query "[?name=='refs/heads/main']"
```

### 建立參考（分支）

```bash
az repos ref create --name refs/heads/new-branch --object-type commit --object {commit-sha}
```

### 刪除參考（分支）

```bash
az repos ref delete --name refs/heads/old-branch --repository {repo} --project {project}
```

### 鎖定分支

```bash
az repos ref lock --name refs/heads/main --repository {repo} --project {project}
```

### 解鎖分支

```bash
az repos ref unlock --name refs/heads/main --repository {repo} --project {project}
```

## 儲存庫原則 (Repository Policies)

### 列出所有原則

```bash
az repos policy list --repository {repo-id} --branch main
```

### 使用設定檔建立原則

```bash
az repos policy create --config policy.json
```

### 更新/刪除原則

```bash
# 更新
az repos policy update --id {policy-id} --config updated-policy.json

# 刪除
az repos policy delete --id {policy-id} --yes
```

### 原則類型 (Policy Types)

#### 核准者人數原則 (Approver Count Policy)

```bash
az repos policy approver-count create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --minimum-approver-count 2 \
  --creator-vote-counts true
```

#### 建構原則 (Build Policy)

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

#### 工作項目連結原則 (Work Item Linking Policy)

```bash
az repos policy work-item-linking create \
  --blocking true \
  --branch main \
  --enabled true \
  --repository-id {repo-id}
```

#### 必要審查者原則 (Required Reviewer Policy)

```bash
az repos policy required-reviewer create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --required-reviewers user@example.com
```

#### 合併策略原則 (Merge Strategy Policy)

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

#### 大小寫強制原則 (Case Enforcement Policy)

```bash
az repos policy case-enforcement create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id}
```

#### 必須評論原則 (Comment Required Policy)

```bash
az repos policy comment-required create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id}
```

#### 檔案大小原則 (File Size Policy)

```bash
az repos policy file-size create \
  --blocking true \
  --enabled true \
  --branch main \
  --repository-id {repo-id} \
  --maximum-file-size 10485760  # 10MB，以位元組為單位
```

## 服務端點 (Service Endpoints)

### 列出服務端點

```bash
az devops service-endpoint list --project {project}
az devops service-endpoint list --project {project} --output table
```

### 顯示服務端點

```bash
az devops service-endpoint show --id {endpoint-id} --project {project}
```

### 建立服務端點

```bash
# 使用設定檔建立
az devops service-endpoint create --service-endpoint-configuration endpoint.json --project {project}
```

### 刪除服務端點

```bash
az devops service-endpoint delete --id {endpoint-id} --project {project} --yes
```

## 小組 (Teams)

### 列出小組

```bash
az devops team list --project {project}
```

### 顯示小組

```bash
az devops team show --team {team-name} --project {project}
```

### 建立小組

```bash
az devops team create \
  --name {team-name} \
  --description "小組描述" \
  --project {project}
```

### 更新小組

```bash
az devops team update \
  --team {team-name} \
  --project {project} \
  --name "{new-team-name}" \
  --description "已更新的描述"
```

### 刪除小組

```bash
az devops team delete --team {team-name} --project {project} --yes
```

### 顯示小組成員

```bash
az devops team list-member --team {team-name} --project {project}
```

## 使用者 (Users)

### 列出使用者

```bash
az devops user list --org https://dev.azure.com/{org}
az devops user list --top 10 --output table
```

### 顯示使用者

```bash
az devops user show --user {user-id-or-email} --org https://dev.azure.com/{org}
```

### 新增使用者

```bash
az devops user add \
  --email user@example.com \
  --license-type express \
  --org https://dev.azure.com/{org}
```

### 更新使用者

```bash
az devops user update \
  --user {user-id-or-email} \
  --license-type advanced \
  --org https://dev.azure.com/{org}
```

### 移除使用者

```bash
az devops user remove --user {user-id-or-email} --org https://dev.azure.com/{org} --yes
```

## 安全性群組 (Security Groups)

### 列出群組

```bash
# 列出專案中的所有群組
az devops security group list --project {project}

# 列出組織中的所有群組
az devops security group list --scope organization

# 帶有篩選條件的列出
az devops security group list --project {project} --subject-types vstsgroup
```

### 顯示群組詳細資訊

```bash
az devops security group show --group-id {group-id}
```

### 建立群組

```bash
az devops security group create \
  --name {group-name} \
  --description "群組描述" \
  --project {project}
```

### 更新群組

```bash
az devops security group update \
  --group-id {group-id} \
  --name "{new-group-name}" \
  --description "已更新的描述"
```

### 刪除群組

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

### 列出命名空間 (Namespaces)

```bash
az devops security permission namespace list
```

### 顯示命名空間詳細資訊

```bash
# 顯示命名空間中可用的權限
az devops security permission namespace show --namespace "GitRepositories"
```

### 列出權限

```bash
# 列出使用者/群組和命名空間的權限
az devops security permission list \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project}

# 列出特定權杖（儲存庫）的權限
az devops security permission list \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}"
```

### 顯示權限

```bash
az devops security permission show \
  --id {user-or-group-id} \
  --namespace "GitRepositories" \
  --project {project} \
  --token "repoV2/{project}/{repository-id}"
```

### 更新權限

```bash
# 授權
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

### 重設權限

```bash
# 重設特定的權限位元
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

## Wiki

### 列出 Wiki

```bash
# 列出專案中的所有 Wiki
az devops wiki list --project {project}

# 列出組織中的所有 Wiki
az devops wiki list
```

### 顯示 Wiki

```bash
az devops wiki show --wiki {wiki-name} --project {project}
az devops wiki show --wiki {wiki-name} --project {project} --open
```

### 建立 Wiki

```bash
# 建立專案 Wiki
az devops wiki create \
  --name {wiki-name} \
  --project {project} \
  --type projectWiki

# 從儲存庫建立程式碼 Wiki
az devops wiki create \
  --name {wiki-name} \
  --project {project} \
  --type codeWiki \
  --repository {repo-name} \
  --mapped-path /wiki
```

### 刪除 Wiki

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
  --content "# New Page\n\n在此填寫頁面內容..." \
  --project {project}

# 更新頁面
az devops wiki page update \
  --wiki {wiki-name} \
  --path "/existing-page" \
  --content "# Updated Page\n\n新內容..." \
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
  --message "排定的系統維護" \
  --level info  # info, warning, error

# 更新橫幅
az devops admin banner update \
  --id {banner-id} \
  --message "已更新的訊息" \
  --level warning \
  --expiration-date "2025-12-31T23:59:59Z"

# 移除橫幅
az devops admin banner remove --id {banner-id}
```

## DevOps 擴充功能 (DevOps Extensions)

管理安裝在 Azure DevOps 組織中的擴充功能（與 CLI 擴充功能不同）。

```bash
# 列出已安裝的擴充功能
az devops extension list --org https://dev.azure.com/{org}

# 搜尋市集中的擴充功能
az devops extension search --search-query "docker"

# 顯示擴充功能詳細資訊
az devops extension show --ext-id {extension-id} --org https://dev.azure.com/{org}

# 安裝擴充功能
az devops extension install \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org} \
  --publisher {publisher-id}

# 啟用擴充功能
az devops extension enable \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org}

# 停用擴充功能
az devops extension disable \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org}

# 解除安裝擴充功能
az devops extension uninstall \
  --ext-id {extension-id} \
  --org https://dev.azure.com/{org} --yes
```

## 通用套件 (Universal Packages)

### 發佈套件

```bash
az artifacts universal publish \
  --feed {feed-name} \
  --name {package-name} \
  --version {version} \
  --path {package-path} \
  --project {project}
```

### 下載套件

```bash
az artifacts universal download \
  --feed {feed-name} \
  --name {package-name} \
  --version {version} \
  --path {download-path} \
  --project {project}
```

## 代理程式 (Agents)

### 列出集區中的代理程式

```bash
az pipelines agent list --pool-id {pool-id}
```

### 顯示代理程式詳細資訊

```bash
az pipelines agent show --agent-id {agent-id} --pool-id {pool-id}
```

## Git 別名 (Git Aliases)

啟用 git 別名後：

```bash
# 啟用 Git 別名
az devops configure --use-git-aliases true

# 使用 Git 命令進行 DevOps 操作
git pr create --target-branch main
git pr list
git pr checkout 123
```

## 輸出格式 (Output Formats)

所有命令都支援多種輸出格式：

```bash
# 表格格式（人類可讀）
az pipelines list --output table

# JSON 格式（預設值，機器可讀）
az pipelines list --output json

# JSONC（帶顏色的 JSON）
az pipelines list --output jsonc

# YAML 格式
az pipelines list --output yaml

# YAMLC（帶顏色的 YAML）
az pipelines list --output yamlc

# TSV 格式（跳位字元分隔值）
az pipelines list --output tsv

# None（無輸出）
az pipelines list --output none
```

## JMESPath 查詢

篩選並轉換輸出：

```bash
# 按名稱篩選
az pipelines list --query "[?name=='myPipeline']"

# 獲取特定欄位
az pipelines list --query "[].{Name:name, ID:id}"

# 鏈式查詢
az pipelines list --query "[?name.contains('CI')].{Name:name, ID:id}" --output table

# 獲取第一個結果
az pipelines list --query "[0]"

# 獲取前 N 個結果
az pipelines list --query "[0:5]"
```

## 全域引數 (Global Arguments)

適用於所有命令：

- `--help` / `-h`：顯示說明
- `--output` / `-o`：輸出格式 (json, jsonc, none, table, tsv, yaml, yamlc)
- `--query`：JMESPath 查詢字串
- `--verbose`：增加記錄詳細程度
- `--debug`：顯示所有偵錯記錄
- `--only-show-errors`：僅顯示錯誤，隱藏警告
- `--subscription`：訂閱的名稱或 ID

## 常見參數 (Common Parameters)

| 參數                       | 描述                                                          |
| -------------------------- | ------------------------------------------------------------ |
| `--org` / `--organization` | Azure DevOps 組織 URL（例如：`https://dev.azure.com/{org}`）   |
| `--project` / `-p`         | 專案名稱或 ID                                                 |
| `--detect`                 | 從 git 設定自動偵測組織                                        |
| `--yes` / `-y`             | 跳過確認提示                                                  |
| `--open`                   | 在網頁瀏覽器中開啟                                             |

## 常見工作流 (Common Workflows)

### 從目前分支建立 PR

```bash
CURRENT_BRANCH=$(git branch --show-current)
az repos pr create \
  --source-branch $CURRENT_BRANCH \
  --target-branch main \
  --title "功能：$(git log -1 --pretty=%B)" \
  --open
```

### 流程失敗時建立工作項目

```bash
az boards work-item create \
  --title "建構 $BUILD_BUILDNUMBER 失敗" \
  --type bug \
  --org $SYSTEM_TEAMFOUNDATIONCOLLECTIONURI \
  --project $SYSTEM_TEAMPROJECT
```

### 下載最新的流程成品

```bash
RUN_ID=$(az pipelines runs list --pipeline {pipeline-id} --top 1 --query "[0].id" -o tsv)
az pipelines runs artifact download \
  --artifact-name 'webapp' \
  --path ./output \
  --run-id $RUN_ID
```

### 核准並完成 PR

```bash
# 投票核准
az repos pr set-vote --id {pr-id} --vote approve

# 完成 PR
az repos pr update --id {pr-id} --status completed
```

### 從本地儲存庫建立流程

```bash
# 從本地 git 儲存庫建立（自動偵測儲存庫、分支等）
az pipelines create --name 'CI-Pipeline' --description '持續整合 (Continuous Integration)'
```

### 批量更新工作項目

```bash
# 查詢項目並在迴圈中更新
for id in $(az boards query --wiql "SELECT ID FROM WorkItems WHERE State='New'" -o tsv); do
  az boards work-item update --id $id --state "Active"
done
```

## 最佳實踐 (Best Practices)

### 身分驗證與安全性

```bash
# 從環境變數使用 PAT（最安全）
export AZURE_DEVOPS_EXT_PAT=$MY_PAT
az devops login --organization $ORG_URL

# 安全地透過管線傳送 PAT（避免留在殼層歷史記錄中）
echo $MY_PAT | az devops login --organization $ORG_URL

# 設定預設值以避免重複輸入
az devops configure --defaults organization=$ORG_URL project=$PROJECT

# 使用後清除憑證
az devops logout --organization $ORG_URL
```

### 冪等操作 (Idempotent Operations)

```bash
# 務必使用 --detect 進行自動偵測
az devops configure --defaults organization=$ORG_URL project=$PROJECT

# 建立前先檢查是否存在
if ! az pipelines show --id $PIPELINE_ID 2>/dev/null; then
  az pipelines create --name "$PIPELINE_NAME" --yaml-path azure-pipelines.yml
fi

# 使用 --output tsv 進行指令碼剖析
PIPELINE_ID=$(az pipelines list --query "[?name=='MyPipeline'].id" --output tsv)

# 使用 --output json 進行程式化存取
BUILD_STATUS=$(az pipelines build show --id $BUILD_ID --query "status" --output json)
```

### 指令碼安全輸出 (Script-Safe Output)

```bash
# 隱藏警告和錯誤
az pipelines list --only-show-errors

# 無輸出（對僅需要執行的命令很有用）
az pipelines run --name "$PIPELINE_NAME" --output none

# 用於殼層指令碼的 TSV 格式（乾淨，無格式）
az repos pr list --output tsv --query "[].{ID:pullRequestId,Title:title}"

# 帶有特定欄位的 JSON
az pipelines list --output json --query "[].{Name:name, ID:id, URL:url}"
```

### 流程協調 (Pipeline Orchestration)

```bash
# 執行流程並等待完成
RUN_ID=$(az pipelines run --name "$PIPELINE_NAME" --query "id" -o tsv)

while true; do
  STATUS=$(az pipelines runs show --run-id $RUN_ID --query "status" -o tsv)
  if [[ "$STATUS" != "inProgress" && "$STATUS" != "notStarted" ]]; then
    break
  fi
  sleep 10
done

# 檢查結果
RESULT=$(az pipelines runs show --run-id $RUN_ID --query "result" -o tsv)
if [[ "$RESULT" == "succeeded" ]]; then
  echo "流程執行成功"
else
  echo "流程執行失敗，結果為：$RESULT"
  exit 1
fi
```

### 變數群組管理

```bash
# 冪等建立變數群組
VG_NAME="production-variables"
VG_ID=$(az pipelines variable-group list --query "[?name=='$VG_NAME'].id" -o tsv)

if [[ -z "$VG_ID" ]]; then
  VG_ID=$(az pipelines variable-group create \
    --name "$VG_NAME" \
    --variables API_URL=$API_URL API_KEY=$API_KEY \
    --authorize true \
    --query "id" -o tsv)
  echo "已建立變數群組，ID 為：$VG_ID"
else
  echo "變數群組已存在，ID 為：$VG_ID"
fi
```

### 服務連線自動化

```bash
# 使用設定檔建立服務連線
cat > service-connection.json <<'EOF'
{
  "data": {
    "subscriptionId": "$SUBSCRIPTION_ID",
    "subscriptionName": "我的訂閱",
    "creationMode": "Manual",
    "serviceEndpointId": "$SERVICE_ENDPOINT_ID"
  },
  "url": "https://management.azure.com/",
  "authorization": {
    "parameters": {
      "tenantid": "$TENANT_ID",
      "serviceprincipalid": "$SP_ID",
      "authenticationType": "spnKey",
      "serviceprincipalkey": "$SP_KEY"
    },
    "scheme": "ServicePrincipal"
  },
  "type": "azurerm",
  "isShared": false,
  "isReady": true
}
EOF

az devops service-endpoint create \
  --service-endpoint-configuration service-connection.json \
  --project "$PROJECT"
```

### 提取請求自動化

```bash
# 建立帶有工作項目和審查者的 PR
PR_ID=$(az repos pr create \
  --repository "$REPO_NAME" \
  --source-branch "$FEATURE_BRANCH" \
  --target-branch main \
  --title "功能：$(git log -1 --pretty=%B)" \
  --description "$(git log -1 --pretty=%B)" \
  --work-items $WORK_ITEM_1 $WORK_ITEM_2 \
  --reviewers "$REVIEWER_1" "$REVIEWER_2" \
  --required-reviewers "$LEAD_EMAIL" \
  --labels "優化" "待處理" \
  --open \
  --query "pullRequestId" -o tsv)

# 原則通過後設定自動完成
az repos pr update --id $PR_ID --auto-complete true
```

## 錯誤處理與重試模式 (Error Handling and Retry Patterns)

### 針對暫時性失敗的重試邏輯

```bash
# 針對網路操作的重試函式
retry_command() {
  local max_attempts=3
  local attempt=1
  local delay=5

  while [[ $attempt -le $max_attempts ]]; do
    if "$@"; then
      return 0
    fi
    echo "嘗試 $attempt 失敗。將在 ${delay} 秒後重試..."
    sleep $delay
    ((attempt++))
    delay=$((delay * 2))
  done

  echo "所有 $max_attempts 次嘗試皆失敗"
  return 1
}

# 用法
retry_command az pipelines run --name "$PIPELINE_NAME"
```

### 檢查並處理錯誤

```bash
# 在操作前檢查流程是否存在
PIPELINE_ID=$(az pipelines list --query "[?name=='$PIPELINE_NAME'].id" -o tsv)

if [[ -z "$PIPELINE_ID" ]]; then
  echo "找不到流程。正在建立..."
  az pipelines create --name "$PIPELINE_NAME" --yaml-path azure-pipelines.yml
else
  echo "流程已存在，ID 為：$PIPELINE_ID"
fi
```

### 驗證輸入

```bash
# 驗證必要參數
if [[ -z "$PROJECT" || -z "$REPO" ]]; then
  echo "錯誤：必須設定 PROJECT 和 REPO"
  exit 1
fi

# 檢查分支是否存在
if ! az repos ref list --repository "$REPO" --query "[?name=='refs/heads/$BRANCH']" -o tsv | grep -q .; then
  echo "錯誤：分支 $BRANCH 不存在"
  exit 1
fi
```

### 處理權限錯誤

```bash
# 嘗試操作，處理權限錯誤
if az devops security permission update \
  --id "$USER_ID" \
  --namespace "GitRepositories" \
  --project "$PROJECT" \
  --token "repoV2/$PROJECT/$REPO_ID" \
  --allow-bit 2 \
  --deny-bit 0 2>&1 | grep -q "unauthorized"; then
  echo "錯誤：權限不足，無法更新儲存庫權限"
  exit 1
fi
```

### 流程失敗通知

```bash
# 執行流程並檢查結果
RUN_ID=$(az pipelines run --name "$PIPELINE_NAME" --query "id" -o tsv)

# 等待完成
while true; do
  STATUS=$(az pipelines runs show --run-id $RUN_ID --query "status" -o tsv)
  if [[ "$STATUS" != "inProgress" && "$STATUS" != "notStarted" ]]; then
    break
  fi
  sleep 10
done

# 檢查結果並在失敗時建立工作項目
RESULT=$(az pipelines runs show --run-id $RUN_ID --query "result" -o tsv)
if [[ "$RESULT" != "succeeded" ]]; then
  BUILD_NUMBER=$(az pipelines runs show --run-id $RUN_ID --query "buildNumber" -o tsv)

  az boards work-item create \
    --title "建構 $BUILD_NUMBER 失敗" \
    --type Bug \
    --description "流程執行 $RUN_ID 失敗，結果為：$RESULT\n\nURL：$ORG_URL/$PROJECT/_build/results?buildId=$RUN_ID"
fi
```

### 優雅降級 (Graceful Degradation)

```bash
# 嘗試下載成品，若失敗則退回到替代來源
if ! az pipelines runs artifact download \
  --artifact-name 'webapp' \
  --path ./output \
  --run-id $RUN_ID 2>/dev/null; then
  echo "警告：從流程執行下載失敗。正在退回到備份來源..."

  # 替代下載方法
  curl -L "$BACKUP_URL" -o ./output/backup.zip
fi
```

## 進階 JMESPath 查詢

### 篩選與排序

```bash
# 按多個條件篩選
az pipelines list --query "[?name.contains('CI') && enabled==true]"

# 按狀態和結果篩選
az pipelines runs list --query "[?status=='completed' && result=='succeeded']"

# 按日期排序（降序）
az pipelines runs list --query "sort_by([?status=='completed'], &finishTime | reverse(@))"

# 篩選後獲取前 N 個項目
az pipelines runs list --query "[?result=='succeeded'] | [0:5]"
```

### 巢狀查詢

```bash
# 擷取巢狀屬性
az pipelines show --id $PIPELINE_ID --query "{Name:name, Repo:repository.{Name:name, Type:type}, Folder:folder}"

# 查詢建構詳細資訊
az pipelines build show --id $BUILD_ID --query "{ID:id, Number:buildNumber, Status:status, Result:result, Requested:requestedFor.displayName}"
```

### 複雜篩選

```bash
# 尋找具有特定 YAML 路徑的流程
az pipelines list --query "[?process.type.name=='yaml' && process.yamlFilename=='azure-pipelines.yml']"

# 尋找來自特定審查者的 PR
az repos pr list --query "[?contains(reviewers[?displayName=='John Doe'].displayName, 'John Doe')]"

# 尋找具有特定疊代和狀態的工作項目
az boards work-item show --id $WI_ID --query "{Title:fields['System.Title'], State:fields['System.State'], Iteration:fields['System.IterationPath']}"
```

### 彙總 (Aggregation)

```bash
# 按狀態計算項目數量
az pipelines runs list --query "groupBy([?status=='completed'], &[result]) | {Succeeded: [?key=='succeeded'][0].count, Failed: [?key=='failed'][0].count}"

# 獲取唯一審查者
az repos pr list --query "unique_by(reviewers[], &displayName)"

# 加總數值
az pipelines runs list --query "[?result=='succeeded'] | [].{Duration:duration} | [0].Duration"
```

### 條件式轉換

```bash
# 格式化日期
az pipelines runs list --query "[].{ID:id, Date:createdDate, Formatted:createdDate | format_datetime(@, 'yyyy-MM-dd HH:mm')}"

# 條件式輸出
az pipelines list --query "[].{Name:name, Status:(enabled ? 'Enabled' : 'Disabled')}"

# 使用預設值擷取
az pipelines show --id $PIPELINE_ID --query "{Name:name, Folder:folder || 'Root', Description:description || 'No description'}"
```

### 複雜工作流

```bash
# 尋找執行時間最長的建構
az pipelines build list --query "sort_by([?result=='succeeded'], &queueTime) | reverse(@) | [0:3].{ID:id, Number:buildNumber, Duration:duration}"

# 獲取每位審查者的 PR 統計資料
az repos pr list --query "groupBy([], &reviewers[].displayName) | [].{Reviewer:@.key, Count:length(@)}"

# 尋找具有多個子項目的工作項目
az boards work-item relation list --id $PARENT_ID --query "[?rel=='System.LinkTypes.Hierarchy-Forward'] | [].{ChildID:url | split('/', @) | [-1]}"
```

## 用於冪等操作的指令碼模式 (Scripting Patterns for Idempotent Operations)

### 建立或更新模式

```bash
# 確保流程存在，如果不同則更新
ensure_pipeline() {
  local name=$1
  local yaml_path=$2

  PIPELINE=$(az pipelines list --query "[?name=='$name']" -o json)

  if [[ -z "$PIPELINE" ]]; then
    echo "正在建立流程：$name"
    az pipelines create --name "$name" --yaml-path "$yaml_path"
  else
    echo "流程已存在：$name"
  fi
}
```

### 確保變數群組存在

```bash
# 使用冪等更新建立變數群組
ensure_variable_group() {
  local vg_name=$1
  shift
  local variables=($@)

  VG_ID=$(az pipelines variable-group list --query "[?name=='$vg_name'].id" -o tsv)

  if [[ -z "$VG_ID" ]]; then
    echo "正在建立變數群組：$vg_name"
    VG_ID=$(az pipelines variable-group create \
      --name "$vg_name" \
      --variables "${variables[@]}" \
      --authorize true \
      --query "id" -o tsv)
  else
    echo "變數群組已存在：$vg_name (ID 為：$VG_ID)"
  fi

  echo "$VG_ID"
}
```

### 確保服務連線存在

```bash
# 檢查服務連線是否存在，若不存在則建立
ensure_service_connection() {
  local name=$1
  local project=$2

  SC_ID=$(az devops service-endpoint list \
    --project "$project" \
    --query "[?name=='$name'].id" \
    -o tsv)

  if [[ -z "$SC_ID" ]]; then
    echo "找不到服務連線。正在建立..."
    # 在此處填寫建立邏輯
  else
    echo "服務連線已存在：$name"
    echo "$SC_ID"
  fi
}
```

### 冪等工作項目建立

```bash
# 僅在具有相同標題的工作項目不存在時才建立
create_work_item_if_new() {
  local title=$1
  local type=$2

  WI_ID=$(az boards query \
    --wiql "SELECT ID FROM WorkItems WHERE [System.WorkItemType]='$type' AND [System.Title]='$title'" \
    --query "[0].id" -o tsv)

  if [[ -z "$WI_ID" ]]; then
    echo "正在建立工作項目：$title"
    WI_ID=$(az boards work-item create --title "$title" --type "$type" --query "id" -o tsv)
  else
    echo "工作項目已存在：$title (ID 為：$WI_ID)"
  fi

  echo "$WI_ID"
}
```

### 批量冪等操作

```bash
# 確保多個流程存在
declare -a PIPELINES=(
  "ci-pipeline:azure-pipelines.yml"
  "deploy-pipeline:deploy.yml"
  "test-pipeline:test.yml"
)

for pipeline in "${PIPELINES[@]}"; do
  IFS=':' read -r name yaml <<< "$pipeline"
  ensure_pipeline "$name" "$yaml"
done
```

### 配置同步

```bash
# 從設定檔同步變數群組
sync_variable_groups() {
  local config_file=$1

  while IFS=',' read -r vg_name variables; do
    ensure_variable_group "$vg_name" "$variables"
  done < "$config_file"
}

# config.csv 格式：
# prod-vars,API_URL=prod.com,API_KEY=secret123
# dev-vars,API_URL=dev.com,API_KEY=secret456
```

```
## 實際應用工作流 (Real-World Workflows)

### CI/CD 流程設定

```bash
# 設定完整的 CI/CD 流程
setup_cicd_pipeline() {
  local project=$1
  local repo=$2
  local branch=$3

  # 建立變數群組
  VG_DEV=$(ensure_variable_group "dev-vars" "ENV=dev API_URL=api-dev.com")
  VG_PROD=$(ensure_variable_group "prod-vars" "ENV=prod API_URL=api-prod.com")

  # 建立 CI 流程
  az pipelines create \
    --name "$repo-CI" \
    --repository "$repo" \
    --branch "$branch" \
    --yaml-path .azure/pipelines/ci.yml \
    --skip-run true

  # 建立 CD 流程
  az pipelines create \
    --name "$repo-CD" \
    --repository "$repo" \
    --branch "$branch" \
    --yaml-path .azure/pipelines/cd.yml \
    --skip-run true

  echo "CI/CD 流程設定完成"
}
```

### 自動化 PR 建立

```bash
# 透過自動化從功能分支建立 PR
create_automated_pr() {
  local branch=$1
  local title=$2

  # 獲取分支資訊
  LAST_COMMIT=$(git log -1 --pretty=%B "$branch")
  COMMIT_SHA=$(git rev-parse "$branch")

  # 尋找相關工作項目
  WORK_ITEMS=$(az boards query \
    --wiql "SELECT ID FROM WorkItems WHERE [System.ChangedBy] = @Me AND [System.State] = 'Active'" \
    --query "[].id" -o tsv)

  # 建立 PR
  PR_ID=$(az repos pr create \
    --source-branch "$branch" \
    --target-branch main \
    --title "$title" \
    --description "$LAST_COMMIT" \
    --work-items $WORK_ITEMS \
    --auto-complete true \
    --query "pullRequestId" -o tsv)

  # 設定必要審查者
  az repos pr reviewer add \
    --id $PR_ID \
    --reviewers $(git log -1 --pretty=format:'%ae' "$branch") \
    --required true

  echo "已建立 PR #$PR_ID"
}
```

### 流程監控與警示

```bash
# 監控流程並在失敗時發出警示
monitor_pipeline() {
  local pipeline_name=$1
  local slack_webhook=$2

  while true; do
    # 獲取最新執行
    RUN_ID=$(az pipelines list --query "[?name=='$pipeline_name'] | [0].id" -o tsv)
    RUNS=$(az pipelines runs list --pipeline $RUN_ID --top 1)

    LATEST_RUN_ID=$(echo "$RUNS" | jq -r '.[0].id')
    RESULT=$(echo "$RUNS" | jq -r '.[0].result')

    # 檢查是否失敗且尚未處理
    if [[ "$RESULT" == "failed" ]]; then
      # 傳送 Slack 警示
      curl -X POST "$slack_webhook" \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"流程 $pipeline_name 失敗！執行 ID 為：$LATEST_RUN_ID\"}"
    fi

    sleep 300 # 每 5 分鐘檢查一次
  done
}
```

### 批量工作項目管理

```bash
# 根據查詢批量更新工作項目
bulk_update_work_items() {
  local wiql=$1
  local updates=($@)

  # 查詢工作項目
  WI_IDS=$(az boards query --wiql "$wiql" --query "[].id" -o tsv)

  # 更新每個工作項目
  for wi_id in $WI_IDS; do
    az boards work-item update --id $wi_id "${updates[@]}"
    echo "已更新工作項目：$wi_id"
  done
}

# 用法：bulk_update_work_items "SELECT ID FROM WorkItems WHERE State='New'" --state "Active" --assigned-to "user@example.com"
```

### 分支原則自動化

```bash
# 將分支原則套用至所有儲存庫
apply_branch_policies() {
  local branch=$1
  local project=$2

  # 獲取所有儲存庫
  REPOS=$(az repos list --project "$project" --query "[].id" -o tsv)

  for repo_id in $REPOS; do
    echo "正在將原則套用至儲存庫：$repo_id"

    # 要求最少核准者人數
    az repos policy approver-count create \
      --blocking true \
      --enabled true \
      --branch "$branch" \
      --repository-id "$repo_id" \
      --minimum-approver-count 2 \
      --creator-vote-counts true

    # 要求工作項目連結
    az repos policy work-item-linking create \
      --blocking true \
      --branch "$branch" \
      --enabled true \
      --repository-id "$repo_id"

    # 要求建構驗證
    BUILD_ID=$(az pipelines list --query "[?name=='CI'].id" -o tsv | head -1)
    az repos policy build create \
      --blocking true \
      --enabled true \
      --branch "$branch" \
      --repository-id "$repo_id" \
      --build-definition-id "$BUILD_ID" \
      --queue-on-source-update-only true
  done
}
```

### 多環境部署

```bash
# 跨多個環境部署
deploy_to_environments() {
  local run_id=$1
  shift
  local environments=($@)

  # 下載成品
  ARTIFACT_NAME=$(az pipelines runs artifact list --run-id $run_id --query "[0].name" -o tsv)
  az pipelines runs artifact download \
    --artifact-name "$ARTIFACT_NAME" \
    --path ./artifacts \
    --run-id $run_id

  # 部署至每個環境
  for env in "${environments[@]}"; do
    echo "正在部署至：$env"

    # 獲取環境特定變數
    VG_ID=$(az pipelines variable-group list --query "[?name=='$env-vars'].id" -o tsv)

    # 執行部署流程
    DEPLOY_RUN_ID=$(az pipelines run \
      --name "Deploy-$env" \
      --variables ARTIFACT_PATH=./artifacts ENV="$env" \
      --query "id" -o tsv)

    # 等待部署完成
    while true; do
      STATUS=$(az pipelines runs show --run-id $DEPLOY_RUN_ID --query "status" -o tsv)
      if [[ "$STATUS" != "inProgress" ]]; then
        break
      fi
      sleep 10
    done
  done
}
```
## 增強的全域引數 (Enhanced Global Arguments)

| 參數                 | 描述                                                   |
| -------------------- | ----------------------------------------------------- |
| `--help` / `-h`      | 顯示命令說明                                            |
| `--output` / `-o`    | 輸出格式 (json, jsonc, none, table, tsv, yaml, yamlc)  |
| `--query`            | 用於篩選輸出的 JMESPath 查詢字串                         |
| `--verbose`          | 增加記錄詳細程度                                        |
| `--debug`            | 顯示所有偵錯記錄                                        |
| `--only-show-errors` | 僅顯示錯誤，隱藏警告                                     |
| `--subscription`     | 訂閱的名稱或 ID                                         |
| `--yes` / `-y`       | 跳過確認提示                                            |

## 增強的常見參數 (Enhanced Common Parameters)

| 參數                       | 描述                                                          |
| -------------------------- | ------------------------------------------------------------ |
| `--org` / `--organization` | Azure DevOps 組織 URL（例如：`https://dev.azure.com/{org}`）   |
| `--project` / `-p`         | 專案名稱或 ID                                                  |
| `--detect`                 | 從 git 設定自動偵測組織                                         |
| `--yes` / `-y`             | 跳過確認提示                                                   |
| `--open`                   | 在網頁瀏覽器中開啟資源                                           |
| `--subscription`           | Azure 訂閱（用於 Azure 資源）                                   |

## 獲取協助 (Getting Help)

```bash
# 一般說明
az devops --help

# 特定命令小組的說明
az pipelines --help
az repos pr --help

# 特定命令的說明
az repos pr create --help

# 搜尋範例
az find "az repos pr create"
```
