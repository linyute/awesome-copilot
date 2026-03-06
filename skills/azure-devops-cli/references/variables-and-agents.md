# 管線變數、變數群組與代理程式 (Pipeline Variables, Variable Groups & Agents)

## 目錄 (Table of Contents)
- [管線變數](#管線變數)
- [變數群組](#變數群組)
- [管線資料夾](#管線資料夾)
- [代理程式集區](#代理程式集區)
- [代理程式佇列](#代理程式佇列)
- [代理程式](#代理程式)

---

## 管線變數 (Pipeline Variables)

### 列出變數 (List Variables)

```bash
az pipelines variable list --pipeline-id {pipeline-id}
```

### 建立變數 (Create Variable)

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

# 包含提示的秘密變數
az pipelines variable create \
  --name {var-name} \
  --secret true \
  --prompt true \
  --pipeline-id {pipeline-id}
```

### 更新變數 (Update Variable)

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

### 刪除變數 (Delete Variable)

```bash
az pipelines variable delete --name {var-name} --pipeline-id {pipeline-id} --yes
```

## 變數群組 (Variable Groups)

### 列出變數群組 (List Variable Groups)

```bash
az pipelines variable-group list
az pipelines variable-group list --output table
```

### 顯示變數群組 (Show Variable Group)

```bash
az pipelines variable-group show --id {group-id}
```

### 建立變數群組 (Create Variable Group)

```bash
az pipelines variable-group create \
  --name {group-name} \
  --variables key1=value1 key2=value2 \
  --authorize true
```

### 更新變數群組 (Update Variable Group)

```bash
az pipelines variable-group update \
  --id {group-id} \
  --name {new-name} \
  --description "已更新說明"
```

### 刪除變數群組 (Delete Variable Group)

```bash
az pipelines variable-group delete --id {group-id} --yes
```

### 變數群組變數 (Variable Group Variables)

```bash
# 列出變數
az pipelines variable-group variable list --group-id {group-id}

# 建立非秘密變數
az pipelines variable-group variable create \
  --group-id {group-id} \
  --name {var-name} \
  --value {var-value}

# 建立秘密變數（如果未提供值，則會提示輸入）
az pipelines variable-group variable create \
  --group-id {group-id} \
  --name {var-name} \
  --secret true

# 使用環境變數建立秘密變數
export AZURE_DEVOPS_EXT_PIPELINE_VAR_MySecret=secretvalue
az pipelines variable-group variable create \
  --group-id {group-id} \
  --name MySecret \
  --secret true

# 更新變數
az pipelines variable-group variable update \
  --group-id {group-id} \
  --name {var-name} \
  --value {new-value} \
  --secret false

# 刪除變數
az pipelines variable-group variable delete \
  --group-id {group-id} \
  --name {var-name}
```

## 管線資料夾 (Pipeline Folders)

### 列出資料夾 (List Folders)

```bash
az pipelines folder list
```

### 建立資料夾 (Create Folder)

```bash
az pipelines folder create --path 'folder/subfolder' --description "我的資料夾"
```

### 刪除資料夾 (Delete Folder)

```bash
az pipelines folder delete --path 'folder/subfolder'
```

### 更新資料夾 (Update Folder)

```bash
az pipelines folder update --path 'old-folder' --new-path 'new-folder'
```

## 代理程式集區 (Agent Pools)

### 列出代理程式集區 (List Agent Pools)

```bash
az pipelines pool list
az pipelines pool list --pool-type automation
az pipelines pool list --pool-type deployment
```

### 顯示代理程式集區 (Show Agent Pool)

```bash
az pipelines pool show --pool-id {pool-id}
```

## 代理程式佇列 (Agent Queues)

### 列出代理程式佇列 (List Agent Queues)

```bash
az pipelines queue list
az pipelines queue list --pool-name {pool-name}
```

### 顯示代理程式佇列 (Show Agent Queue)

```bash
az pipelines queue show --id {queue-id}
```

## 代理程式 (Agents)

### 列出集區中的代理程式 (List Agents in Pool)

```bash
az pipelines agent list --pool-id {pool-id}
```

### 顯示代理程式詳細資訊 (Show Agent Details)

```bash
az pipelines agent show --agent-id {agent-id} --pool-id {pool-id}
```
