# 工作流、最佳實作與指令碼編寫模式 (Workflows, Best Practices & Scripting Patterns)

## 目錄 (Table of Contents)
- [常見工作流](#常見工作流)
- [最佳實作](#最佳實作)
- [錯誤處理與重試模式](#錯誤處理與重試模式)
- [等冪作業的指令碼編寫模式](#等冪作業的指令碼編寫模式)
- [真實世界工作流](#實際工作流)

---

## 常見工作流 (Common Workflows)

### 從目前分支建立 PR (Create PR from current branch)

```bash
CURRENT_BRANCH=$(git branch --show-current)
az repos pr create \
  --source-branch $CURRENT_BRANCH \
  --target-branch main \
  --title "功能：$(git log -1 --pretty=%B)" \
  --open
```

### 管線失敗時建立工作項目 (Create work item on pipeline failure)

```bash
az boards work-item create \
  --title "建構 $BUILD_BUILDNUMBER 失敗" \
  --type bug \
  --org $SYSTEM_TEAMFOUNDATIONCOLLECTIONURI \
  --project $SYSTEM_TEAMPROJECT
```

### 下載最新的管線構件 (Download latest pipeline artifact)

```bash
RUN_ID=$(az pipelines runs list --pipeline {pipeline-id} --top 1 --query "[0].id" -o tsv)
az pipelines runs artifact download \
  --artifact-name 'webapp' \
  --path ./output \
  --run-id $RUN_ID
```

### 核准並完成 PR (Approve and complete PR)

```bash
# 投核准票
az repos pr set-vote --id {pr-id} --vote approve

# 完成 PR
az repos pr update --id {pr-id} --status completed
```

### 從本機存放庫建立管線 (Create pipeline from local repo)

```bash
# 從本機 git 存放庫（自動偵測存放庫、分支等）
az pipelines create --name 'CI-Pipeline' --description '持續整合'
```

### 批次更新工作項目 (Bulk update work items)

```bash
# 查詢項目並在迴圈中更新
for id in $(az boards query --wiql "SELECT ID FROM WorkItems WHERE State='New'" -o tsv); do
  az boards work-item update --id $id --state "Active"
done
```

## 最佳實作 (Best Practices)

### 驗證與安全性 (Authentication and Security)

```bash
# 使用來自環境變數的 PAT（最安全）
export AZURE_DEVOPS_EXT_PAT=$MY_PAT
az devops login --organization $ORG_URL

# 以安全方式透過管道傳送 PAT（避免殼層記錄）
echo $MY_PAT | az devops login --organization $ORG_URL

# 設定預設值以避免重複
az devops configure --defaults organization=$ORG_URL project=$PROJECT

# 使用後清除認證
az devops logout --organization $ORG_URL
```

### 等冪作業 (Idempotent Operations)

```bash
# 務必使用 --detect 進行自動偵測
az devops configure --defaults organization=$ORG_URL project=$PROJECT

# 在建立前檢查是否存在
if ! az pipelines show --id $PIPELINE_ID 2>/dev/null; then
  az pipelines create --name "$PIPELINE_NAME" --yaml-path azure-pipelines.yml
fi

# 使用 --output tsv 供殼層解析
PIPELINE_ID=$(az pipelines list --query "[?name=='MyPipeline'].id" --output tsv)

# 使用 --output json 供程式化存取
BUILD_STATUS=$(az pipelines build show --id $BUILD_ID --query "status" --output json)
```

### 指令碼安全輸出 (Script-Safe Output)

```bash
# 隱藏警告與錯誤
az pipelines list --only-show-errors

# 無輸出（對只需要執行的指令很有用）
az pipelines run --name "$PIPELINE_NAME" --output none

# 適用於殼層指令碼的 TSV 格式（乾淨，無格式化）
az repos pr list --output tsv --query "[].{ID:pullRequestId,Title:title}"

# 包含特定欄位的 JSON
az pipelines list --output json --query "[].{Name:name, ID:id, URL:url}"
```

### 管線協調 (Pipeline Orchestration)

```bash
# 執行管線並等待完成
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
  echo "管線成功"
else
  echo "管線失敗，結果為：$RESULT"
  exit 1
fi
```

### 變數群組管理 (Variable Group Management)

```bash
# 以等冪方式建立變數群組
VG_NAME="production-variables"
VG_ID=$(az pipelines variable-group list --query "[?name=='$VG_NAME'].id" -o tsv)

if [[ -z "$VG_ID" ]]; then
  VG_ID=$(az pipelines variable-group create \
    --name "$VG_NAME" \
    --variables API_URL=$API_URL API_KEY=$API_KEY \
    --authorize true \
    --query "id" -o tsv)
  echo "已建立識別碼為 $VG_ID 的變數群組"
else
  echo "變數群組已存在，識別碼為：$VG_ID"
fi
```

### 服務連線自動化 (Service Connection Automation)

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

### 提取要求自動化 (Pull Request Automation)

```bash
# 建立包含工作項目與審核者的 PR
PR_ID=$(az repos pr create \
  --repository "$REPO_NAME" \
  --source-branch "$FEATURE_BRANCH" \
  --target-branch main \
  --title "功能：$(git log -1 --pretty=%B)" \
  --description "$(git log -1 --pretty=%B)" \
  --work-items $WORK_ITEM_1 $WORK_ITEM_2 \
  --reviewers "$REVIEWER_1" "$REVIEWER_2" \
  --required-reviewers "$LEAD_EMAIL" \
  --labels "enhancement" "backlog" \
  --open \
  --query "pullRequestId" -o tsv)

# 策略通過時設定自動完成
az repos pr update --id $PR_ID --auto-complete true
```

## 錯誤處理與重試模式 (Error Handling & Retry Patterns)

### 暫時性失敗的重試邏輯 (Retry Logic for Transient Failures)

```bash
# 網路作業的重試函式
retry_command() {
  local max_attempts=3
  local attempt=1
  local delay=5

  while [[ $attempt -le $max_attempts ]]; do
    if "$@"; then
      return 0
    fi
    echo "第 $attempt 次嘗試失敗。正在 ${delay}s 後重試..."
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

### 檢查並處理錯誤 (Check and Handle Errors)

```bash
# 在作業前檢查管線是否存在
PIPELINE_ID=$(az pipelines list --query "[?name=='$PIPELINE_NAME'].id" -o tsv)

if [[ -z "$PIPELINE_ID" ]]; then
  echo "找不到管線。正在建立..."
  az pipelines create --name "$PIPELINE_NAME" --yaml-path azure-pipelines.yml
else
  echo "管線已存在，識別碼為：$PIPELINE_ID"
fi
```

### 驗證輸入 (Validate Inputs)

```bash
# 驗證必要參數
if [[ -z "$PROJECT" || -z "$REPO" ]]; then
  echo "錯誤：必須設定 PROJECT 與 REPO"
  exit 1
fi

# 檢查分支是否存在
if ! az repos ref list --repository "$REPO" --query "[?name=='refs/heads/$BRANCH']" -o tsv | grep -q .; then
  echo "錯誤：分支 $BRANCH 不存在"
  exit 1
fi
```

### 處理權限錯誤 (Handle Permission Errors)

```bash
# 嘗試作業，處理權限錯誤
if az devops security permission update \
  --id "$USER_ID" \
  --namespace "GitRepositories" \
  --project "$PROJECT" \
  --token "repoV2/$PROJECT/$REPO_ID" \
  --allow-bit 2 \
  --deny-bit 0 2>&1 | grep -q "unauthorized"; then
  echo "錯誤：權限不足，無法更新存放庫權限"
  exit 1
fi
```

### 管線失敗通知 (Pipeline Failure Notification)

```bash
# 執行管線並檢查結果
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
    --description "管線執行 $RUN_ID 失敗，結果為：$RESULT\n\nURL: $ORG_URL/$PROJECT/_build/results?buildId=$RUN_ID"
fi
```

### 優雅降級 (Graceful Degradation)

```bash
# 嘗試下載構件，回退到替代來源
if ! az pipelines runs artifact download \
  --artifact-name 'webapp' \
  --path ./output \
  --run-id $RUN_ID 2>/dev/null; then
  echo "警告：從管線執行下載失敗。正在回退到備援來源..."

  # 替代下載方法
  curl -L "$BACKUP_URL" -o ./output/backup.zip
fi
```

## 等冪作業的指令碼編寫模式 (Scripting Patterns for Idempotent Operations)

### 建立或更新模式 (Create or Update Pattern)

```bash
# 確保管線存在，如果不同則更新
ensure_pipeline() {
  local name=$1
  local yaml_path=$2

  PIPELINE=$(az pipelines list --query "[?name=='$name']" -o json)

  if [[ -z "$PIPELINE" ]]; then
    echo "正在建立管線：$name"
    az pipelines create --name "$name" --yaml-path "$yaml_path"
  else
    echo "管線已存在：$name"
  fi
}
```

### 確保變數群組 (Ensure Variable Group)

```bash
# 以等冪更新方式建立變數群組
ensure_variable_group() {
  local vg_name=$1
  shift
  local variables=("$@")

  VG_ID=$(az pipelines variable-group list --query "[?name=='$vg_name'].id" -o tsv)

  if [[ -z "$VG_ID" ]]; then
    echo "正在建立變數群組：$vg_name"
    VG_ID=$(az pipelines variable-group create \
      --name "$vg_name" \
      --variables "${variables[@]}" \
      --authorize true \
      --query "id" -o tsv)
  else
    echo "變數群組已存在：$vg_name (識別碼：$VG_ID)"
  fi

  echo "$VG_ID"
}
```

### 確保服務連線 (Ensure Service Connection)

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
    # 此處為建立邏輯
  else
    echo "服務連線已存在：$name"
    echo "$SC_ID"
  fi
}
```

### 等冪工作項目建立 (Idempotent Work Item Creation)

```bash
# 僅在不存在相同標題的工作項目時建立
create_work_item_if_new() {
  local title=$1
  local type=$2

  WI_ID=$(az boards query \
    --wiql "SELECT ID FROM WorkItems WHERE [System.WorkItemType]='$type' AND [System.Title]='$title'" 
    --query "[0].id" -o tsv)

  if [[ -z "$WI_ID" ]]; then
    echo "正在建立工作項目：$title"
    WI_ID=$(az boards work-item create --title "$title" --type "$type" --query "id" -o tsv)
  else
    echo "工作項目已存在：$title (識別碼：$WI_ID)"
  fi

  echo "$WI_ID"
}
```

### 批次等冪作業 (Bulk Idempotent Operations)

```bash
# 確保多個管線存在
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

### 設定同步 (Configuration Synchronization)

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

## 實際工作流 (Real-World Workflows)

### CI/CD 管線設定 (CI/CD Pipeline Setup)

```bash
# 設定完整的 CI/CD 管線
setup_cicd_pipeline() {
  local project=$1
  local repo=$2
  local branch=$3

  # 建立變數群組
  VG_DEV=$(ensure_variable_group "dev-vars" "ENV=dev API_URL=api-dev.com")
  VG_PROD=$(ensure_variable_group "prod-vars" "ENV=prod API_URL=api-prod.com")

  # 建立 CI 管線
  az pipelines create \
    --name "$repo-CI" \
    --repository "$repo" \
    --branch "$branch" \
    --yaml-path .azure/pipelines/ci.yml \
    --skip-run true

  # 建立 CD 管線
  az pipelines create \
    --name "$repo-CD" \
    --repository "$repo" \
    --branch "$branch" \
    --yaml-path .azure/pipelines/cd.yml \
    --skip-run true

  echo "CI/CD 管線設定完成"
}
```

### 自動化 PR 建立 (Automated PR Creation)

```bash
# 透過自動化從功能分支建立 PR
create_automated_pr() {
  local branch=$1
  local title=$2

  # 獲取分支資訊
  LAST_COMMIT=$(git log -1 --pretty=%B "$branch")
  COMMIT_SHA=$(git rev-parse "$branch")

  # 尋找相關的工作項目
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

  # 設定必要的審核者
  az repos pr reviewer add \
    --id $PR_ID \
    --reviewers $(git log -1 --pretty=format:'%ae' "$branch") \
    --required true

  echo "已建立 PR #$PR_ID"
}
```

### 管線監控與警示 (Pipeline Monitoring and Alerting)

```bash
# 監控管線並在失敗時警示
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
        -d "{\"text\": \"管線 $pipeline_name 失敗！執行識別碼：$LATEST_RUN_ID\"}"
    fi

    sleep 300 # 每 5 分鐘檢查一次
  done
}
```

### 批次工作項目管理 (Bulk Work Item Management)

```bash
# 根據查詢批次更新工作項目
bulk_update_work_items() {
  local wiql=$1
  local updates=("$@")

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

### 分支策略自動化 (Branch Policy Automation)

```bash
# 將分支策略套用至所有存放庫
apply_branch_policies() {
  local branch=$1
  local project=$2

  # 獲取所有存放庫
  REPOS=$(az repos list --project "$project" --query "[].id" -o tsv)

  for repo_id in $REPOS; do
    echo "正在將策略套用至存放庫：$repo_id"

    # 需要最少核准者
    az repos policy approver-count create \
      --blocking true \
      --enabled true \
      --branch "$branch" \
      --repository-id "$repo_id" \
      --minimum-approver-count 2 \
      --creator-vote-counts true

    # 需要工作項目連結
    az repos policy work-item-linking create \
      --blocking true \
      --branch "$branch" \
      --enabled true \
      --repository-id "$repo_id"

    # 需要建構驗證
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

### 多環境部署 (Multi-Environment Deployment)

```bash
# 跨多個環境部署
deploy_to_environments() {
  local run_id=$1
  shift
  local environments=("$@")

  # 下載構件
  ARTIFACT_NAME=$(az pipelines runs artifact list --run-id $run_id --query "[0].name" -o tsv)
  az pipelines runs artifact download \
    --artifact-name "$ARTIFACT_NAME" \
    --path ./artifacts \
    --run-id $run_id

  # 部署到每個環境
  for env in "${environments[@]}"; do
    echo "正在部署到：$env"

    # 獲取環境特定變數
    VG_ID=$(az pipelines variable-group list --query "[?name=='$env-vars'].id" -o tsv)

    # 執行部署管線
    DEPLOY_RUN_ID=$(az pipelines run \
      --name "Deploy-$env" \
      --variables ARTIFACT_PATH=./artifacts ENV="$env" \
      --query "id" -o tsv)

    # 等待部署
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
