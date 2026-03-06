# 進階用法：輸出、查詢與參數 (Advanced Usage: Output, Queries & Parameters)

## 目錄 (Table of Contents)
- [輸出格式](#輸出格式)
- [JMESPath 查詢](#jmespath-查詢)
- [進階 JMESPath 查詢](#進階-jmespath-查詢)
- [全域引數](#全域引數)
- [常用參數](#常用參數)
- [Git 別名](#git-別名)
- [獲取說明](#獲取說明)

---

## 輸出格式 (Output Formats)

所有指令都支援多種輸出格式：

```bash
# 表格格式（人類可讀）
az pipelines list --output table

# JSON 格式（預設值，機器可讀）
az pipelines list --output json

# JSONC（有顏色的 JSON）
az pipelines list --output jsonc

# YAML 格式
az pipelines list --output yaml

# YAMLC（有顏色的 YAML）
az pipelines list --output yamlc

# TSV 格式（跳格鍵分隔值）
az pipelines list --output tsv

# None（無輸出）
az pipelines list --output none
```

## JMESPath 查詢 (JMESPath Queries)

篩選並轉換輸出：

```bash
# 依名稱篩選
az pipelines list --query "[?name=='myPipeline']"

# 獲取特定欄位
az pipelines list --query "[].{Name:name, ID:id}"

# 串接查詢
az pipelines list --query "[?name.contains('CI')].{Name:name, ID:id}" --output table

# 獲取第一個結果
az pipelines list --query "[0]"

# 獲取前 N 個
az pipelines list --query "[0:5]"
```

## 進階 JMESPath 查詢 (Advanced JMESPath Queries)

### 篩選與排序 (Filtering and Sorting)

```bash
# 依多個條件篩選
az pipelines list --query "[?name.contains('CI') && enabled==true]"

# 依狀態與結果篩選
az pipelines runs list --query "[?status=='completed' && result=='succeeded']"

# 依日期排序（遞減）
az pipelines runs list --query "sort_by([?status=='completed'], &finishTime | reverse(@))"

# 篩選後獲取前 N 個項目
az pipelines runs list --query "[?result=='succeeded'] | [0:5]"
```

### 巢狀查詢 (Nested Queries)

```bash
# 擷取巢狀屬性
az pipelines show --id $PIPELINE_ID --query "{Name:name, Repo:repository.{Name:name, Type:type}, Folder:folder}"

# 查詢建構詳細資訊
az pipelines build show --id $BUILD_ID --query "{ID:id, Number:buildNumber, Status:status, Result:result, Requested:requestedFor.displayName}"
```

### 複雜篩選 (Complex Filtering)

```bash
# 尋找具有特定 YAML 路徑的管線
az pipelines list --query "[?process.type.name=='yaml' && process.yamlFilename=='azure-pipelines.yml']"

# 尋找來自特定審核者的 PR
az repos pr list --query "[?contains(reviewers[?displayName=='John Doe'].displayName, 'John Doe')]"

# 尋找具有特定反覆項目和狀態的工作項目
az boards work-item show --id $WI_ID --query "{Title:fields['System.Title'], State:fields['System.State'], Iteration:fields['System.IterationPath']}"
```

### 彙總 (Aggregation)

```bash
# 依狀態計算項目數量
az pipelines runs list --query "groupBy([?status=='completed'], &[result]) | {Succeeded: [?key=='succeeded'][0].count, Failed: [?key=='failed'][0].count}"

# 獲取唯一的審核者
az repos pr list --query "unique_by(reviewers[], &displayName)"

# 加總數值
az pipelines runs list --query "[?result=='succeeded'] | [].{Duration:duration} | [0].Duration"
```

### 條件轉換 (Conditional Transformation)

```bash
# 格式化日期
az pipelines runs list --query "[].{ID:id, Date:createdDate, Formatted:createdDate | format_datetime(@, 'yyyy-MM-dd HH:mm')}"

# 條件式輸出
az pipelines list --query "[].{Name:name, Status:(enabled ? 'Enabled' : 'Disabled')}"

# 使用預設值擷取
az pipelines show --id $PIPELINE_ID --query "{Name:name, Folder:folder || 'Root', Description:description || 'No description'}"
```

### 複雜工作流 (Complex Workflows)

```bash
# 尋找執行時間最長的建構
az pipelines build list --query "sort_by([?result=='succeeded'], &queueTime) | reverse(@) | [0:3].{ID:id, Number:buildNumber, Duration:duration}"

# 獲取每位審核者的 PR 統計資料
az repos pr list --query "groupBy([], &reviewers[].displayName) | [].{Reviewer:@.key, Count:length(@)}"

# 尋找具有多個子項目的工作項目
az boards work-item relation list --id $PARENT_ID --query "[?rel=='System.LinkTypes.Hierarchy-Forward'] | [].{ChildID:url | split('/', @) | [-1]}"
```

## 全域引數 (Global Arguments)

適用於所有指令：

| 參數 | 說明 |
|---|---|
| `--help` / `-h` | 顯示指令說明 |
| `--output` / `-o` | 輸出格式 (json, jsonc, none, table, tsv, yaml, yamlc) |
| `--query` | 用於篩選輸出的 JMESPath 查詢字串 |
| `--verbose` | 提高日誌詳細程度 |
| `--debug` | 顯示所有偵錯日誌 |
| `--only-show-errors` | 僅顯示錯誤，隱藏警告 |
| `--subscription` | 訂閱的名稱或識別碼 |
| `--yes` / `-y` | 跳過確認提示 |

## 常用參數 (Common Parameters)

| 參數 | 說明 |
|---|---|
| `--org` / `--organization` | Azure DevOps 組織 URL（例如：`https://dev.azure.com/{org}`） |
| `--project` / `-p` | 專案名稱或識別碼 |
| `--detect` | 從 git 設定自動偵測組織 |
| `--yes` / `-y` | 跳過確認提示 |
| `--open` | 在網頁瀏覽器中開啟資源 |
| `--subscription` | Azure 訂閱（用於 Azure 資源） |

## Git 別名 (Git Aliases)

啟用 git 別名後：

```bash
# 啟用 Git 別名
az devops configure --use-git-aliases true

# 將 Git 指令用於 DevOps 作業
git pr create --target-branch main
git pr list
git pr checkout 123
```

## 獲取說明 (Getting Help)

```bash
# 一般說明
az devops --help

# 特定指令群組的說明
az pipelines --help
az repos pr --help

# 特定指令的說明
az repos pr create --help

# 搜尋範例
az find "az repos pr create"
```
