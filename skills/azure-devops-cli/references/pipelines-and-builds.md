# 管線、建構與發行 (Pipelines, Builds & Releases)

## 目錄 (Table of Contents)
- [管線](#管線)
- [管線執行](#管線執行)
- [建構](#建構)
- [建構定義](#建構定義)
- [發行](#發行)
- [發行定義](#發行定義)
- [通用套件 (構件)](#通用套件-構件)

---

## 管線 (Pipelines)

### 列出管線 (List Pipelines)

```bash
az pipelines list --output table
az pipelines list --query "[?name=='myPipeline']"
az pipelines list --folder-path 'folder/subfolder'
```

### 建立管線 (Create Pipeline)

```bash
# 從本機存放庫內容（自動偵測設定）
az pipelines create --name 'ContosoBuild' --description 'Contoso 專案的管線'

# 包含特定的分支與 YAML 路徑
az pipelines create \
  --name {pipeline-name} \
  --repository {repo} \
  --branch main \
  --yaml-path azure-pipelines.yml \
  --description "我的 CI/CD 管線"

# 針對 GitHub 存放庫
az pipelines create \
  --name 'GitHubPipeline' \
  --repository https://github.com/Org/Repo \
  --branch main \
  --repository-type github

# 跳過第一次執行
az pipelines create --name 'MyPipeline' --skip-run true
```

### 顯示管線 (Show Pipeline)

```bash
az pipelines show --id {pipeline-id}
az pipelines show --name {pipeline-name}
```

### 更新管線 (Update Pipeline)

```bash
az pipelines update --id {pipeline-id} --name "新名稱" --description "已更新說明"
```

### 刪除管線 (Delete Pipeline)

```bash
az pipelines delete --id {pipeline-id} --yes
```

### 執行管線 (Run Pipeline)

```bash
# 依名稱執行
az pipelines run --name {pipeline-name} --branch main

# 依識別碼執行
az pipelines run --id {pipeline-id} --branch refs/heads/main

# 包含參數
az pipelines run --name {pipeline-name} --parameters version=1.0.0 environment=prod

# 包含變數
az pipelines run --name {pipeline-name} --variables buildId=123 configuration=release

# 在瀏覽器中開啟結果
az pipelines run --name {pipeline-name} --open
```

## 管線執行 (Pipeline Runs)

### 列出執行 (List Runs)

```bash
az pipelines runs list --pipeline {pipeline-id}
az pipelines runs list --name {pipeline-name} --top 10
az pipelines runs list --branch main --status completed
```

### 顯示執行詳細資訊 (Show Run Details)

```bash
az pipelines runs show --run-id {run-id}
az pipelines runs show --run-id {run-id} --open
```

### 管線構件 (Pipeline Artifacts)

```bash
# 列出一次執行的構件
az pipelines runs artifact list --run-id {run-id}

# 下載構件
az pipelines runs artifact download \
  --artifact-name '{artifact-name}' \
  --path {local-path} \
  --run-id {run-id}

# 上傳構件
az pipelines runs artifact upload \
  --artifact-name '{artifact-name}' \
  --path {local-path} \
  --run-id {run-id}
```

### 管線執行標籤 (Pipeline Run Tags)

```bash
# 為執行增加標籤
az pipelines runs tag add --run-id {run-id} --tags production v1.0

# 列出執行標籤
az pipelines runs tag list --run-id {run-id} --output table
```

## 建構 (Builds)

### 列出建構 (List Builds)

```bash
az pipelines build list
az pipelines build list --definition {build-definition-id}
az pipelines build list --status completed --result succeeded
```

### 將建構加入佇列 (Queue Build)

```bash
az pipelines build queue --definition {build-definition-id} --branch main
az pipelines build queue --definition {build-definition-id} --parameters version=1.0.0
```

### 顯示建構詳細資訊 (Show Build Details)

```bash
az pipelines build show --id {build-id}
```

### 取消建構 (Cancel Build)

```bash
az pipelines build cancel --id {build-id}
```

### 建構標籤 (Build Tags)

```bash
# 為建構增加標籤
az pipelines build tag add --build-id {build-id} --tags prod release

# 從建構刪除標籤
az pipelines build tag delete --build-id {build-id} --tag prod
```

## 建構定義 (Build Definitions)

### 列出建構定義 (List Build Definitions)

```bash
az pipelines build definition list
az pipelines build definition list --name {definition-name}
```

### 顯示建構定義 (Show Build Definition)

```bash
az pipelines build definition show --id {definition-id}
```

## 發行 (Releases)

### 列出發行 (List Releases)

```bash
az pipelines release list
az pipelines release list --definition {release-definition-id}
```

### 建立發行 (Create Release)

```bash
az pipelines release create --definition {release-definition-id}
az pipelines release create --definition {release-definition-id} --description "發行 v1.0"
```

### 顯示發行 (Show Release)

```bash
az pipelines release show --id {release-id}
```

## 發行定義 (Release Definitions)

### 列出發行定義 (List Release Definitions)

```bash
az pipelines release definition list
```

### 顯示發行定義 (Show Release Definition)

```bash
az pipelines release definition show --id {definition-id}
```

## 通用套件 (構件) (Universal Packages (Artifacts))

### 發佈套件 (Publish Package)

```bash
az artifacts universal publish \
  --feed {feed-name} \
  --name {package-name} \
  --version {version} \
  --path {package-path} \
  --project {project}
```

### 下載套件 (Download Package)

```bash
az artifacts universal download \
  --feed {feed-name} \
  --name {package-name} \
  --version {version} \
  --path {download-path} \
  --project {project}
```
