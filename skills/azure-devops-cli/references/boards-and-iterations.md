# 工作項目、區域路徑與反覆項目 (Work Items, Area Paths & Iterations)

## 目錄 (Table of Contents)
- [工作項目 (看板)](#工作項目-看板)
- [區域路徑](#區域路徑)
- [反覆項目](#反覆項目)

---

## 工作項目 (看板) (Work Items (Boards))

### 查詢工作項目 (Query Work Items)

```bash
# WIQL 查詢
az boards query \
  --wiql "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.AssignedTo] = @Me AND [System.State] = 'Active'"

# 具有輸出格式的查詢
az boards query --wiql "SELECT * FROM WorkItems" --output table
```

### 顯示工作項目 (Show Work Item)

```bash
az boards work-item show --id {work-item-id}
az boards work-item show --id {work-item-id} --open
```

### 建立工作項目 (Create Work Item)

```bash
# 基本工作項目
az boards work-item create \
  --title "修復登入錯誤" \
  --type Bug \
  --assigned-to user@example.com \
  --description "使用者無法使用 SSO 登入"

# 包含區域與反覆項目
az boards work-item create \
  --title "新功能" \
  --type "User Story" \
  --area "Project\\Area1" \
  --iteration "Project\\Sprint 1"

# 包含自訂欄位
az boards work-item create \
  --title "工作" \
  --type Task \
  --fields "Priority=1" "Severity=2"

# 包含討論註解
az boards work-item create \
  --title "問題" \
  --type Bug \
  --discussion "初步調查已完成"

# 建立後在瀏覽器中開啟
az boards work-item create --title "Bug" --type Bug --open
```

### 更新工作項目 (Update Work Item)

```bash
# 更新狀態、標題與指派對象
az boards work-item update \
  --id {work-item-id} \
  --state "Active" \
  --title "已更新標題" \
  --assigned-to user@example.com

# 移動到不同區域
az boards work-item update \
  --id {work-item-id} \
  --area "{ProjectName}\\{Team}\\{Area}"

# 變更反覆項目
az boards work-item update \
  --id {work-item-id} \
  --iteration "{ProjectName}\\Sprint 5"

# 增加註解/討論
az boards work-item update \
  --id {work-item-id} \
  --discussion "進行中"

# 使用自訂欄位更新
az boards work-item update \
  --id {work-item-id} \
  --fields "Priority=1" "StoryPoints=5"
```

### 刪除工作項目 (Delete Work Item)

```bash
# 虛刪除（可以還原）
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

# 增加關聯
az boards work-item relation add --id {work-item-id} --relation-type parent --target-id {parent-id}

# 移除關聯
az boards work-item relation remove --id {work-item-id} --relation-id {relation-id}
```

## 區域路徑 (Area Paths)

### 列出專案的區域 (List Areas for Project)

```bash
az boards area project list --project {project}
az boards area project show --path "Project\\Area1" --project {project}
```

### 建立區域 (Create Area)

```bash
az boards area project create --path "Project\\NewArea" --project {project}
```

### 更新區域 (Update Area)

```bash
az boards area project update \
  --path "Project\\OldArea" \
  --new-path "Project\\UpdatedArea" \
  --project {project}
```

### 刪除區域 (Delete Area)

```bash
az boards area project delete --path "Project\\AreaToDelete" --project {project} --yes
```

### 區域小組管理 (Area Team Management)

```bash
# 列出小組的區域
az boards area team list --team {team-name} --project {project}

# 將區域新增至小組
az boards area team add \
  --team {team-name} \
  --path "Project\\NewArea" \
  --project {project}

# 從小組移除區域
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

## 反覆項目 (Iterations)

### 列出專案的反覆項目 (List Iterations for Project)

```bash
az boards iteration project list --project {project}
az boards iteration project show --path "Project\\Sprint 1" --project {project}
```

### 建立反覆項目 (Create Iteration)

```bash
az boards iteration project create --path "Project\\Sprint 1" --project {project}
```

### 更新反覆項目 (Update Iteration)

```bash
az boards iteration project update \
  --path "Project\\OldSprint" \
  --new-path "Project\\NewSprint" \
  --project {project}
```

### 刪除反覆項目 (Delete Iteration)

```bash
az boards iteration project delete --path "Project\\OldSprint" --project {project} --yes
```

### 小組反覆項目 (Team Iterations)

```bash
# 列出小組的反覆項目
az boards iteration team list --team {team-name} --project {project}

# 將反覆項目新增至小組
az boards iteration team add \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}

# 從小組移除反覆項目
az boards iteration team remove \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}

# 列出反覆項目中的工作項目
az boards iteration team list-work-items \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}
```

### 預設與待處理反覆項目 (Default & Backlog Iterations)

```bash
# 設定小組的預設反覆項目
az boards iteration team set-default-iteration \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}

# 顯示預設反覆項目
az boards iteration team show-default-iteration \
  --team {team-name} \
  --project {project}

# 設定小組的待處理反覆項目
az boards iteration team set-backlog-iteration \
  --team {team-name} \
  --path "Project\\Sprint 1" \
  --project {project}

# 顯示待處理反覆項目
az boards iteration team show-backlog-iteration \
  --team {team-name} \
  --project {project}

# 顯示目前的反覆項目
az boards iteration team show --team {team-name} --project {project} --timeframe current
```
