---
name: foundry-agent-sync
description: "直接透過 REST API，從本地 JSON 資訊清單 (manifest) 在 Azure AI Foundry 中建立並同步基於提示詞的 AI 代理程式。與僅產生本地程式碼的鷹架 (scaffolding) 技能不同，此技能會在 Foundry 服務本身註冊代理程式 — 使其能立即用於呼叫。在使用者要求在 Foundry 中建立代理程式、同步、部署、註冊或將代理程式推送至 Foundry、更新代理程式指令，或為新儲存庫鷹架資訊清單與同步指令碼時使用。觸發程序：'create agent in foundry', 'sync foundry agents', 'deploy agents to foundry', 'register agents in foundry', 'push agents', 'create foundry agent manifest', 'scaffold agent sync'。"
---

# Foundry 代理程式同步 (Foundry Agent Sync)

## 概觀 (Overview)

透過代理程式服務 REST API，直接在 Azure AI Foundry 中建立並同步基於提示詞的 AI 代理程式。此技能會在 Foundry 服務本身註冊代理程式 — 使其能立即透過 Foundry 入口網站或 API 進行呼叫、評估與管理。每個代理程式皆透過命名的 POST 呼叫冪等地 (idempotently) 建立或更新，並使用來自本地 JSON 資訊清單檔案的定義。

> **關鍵區別：** 此技能是在 AI Foundry 內部（伺服器端）建立代理程式。它不會鷹架本地代理程式程式碼或容器映像 — 如需該功能，請使用 `microsoft-foundry` 技能的 `create` 子技能。

## 先決條件 (Prerequisites)

使用者必須擁有：

1. 一個部署有模型的 Azure AI Foundry 專案 (例如 `gpt-5-4`)
2. 已驗證且具有該 Foundry 專案存取權的 Azure CLI (`az`)
3. Foundry 專案資源上的 **Azure AI User** 角色（或更高權限）

在繼續之前，請收集這些數值：

| 數值 | 取得方式 |
|---|---|
| **Foundry 專案端點** | Azure 入口網站 → AI Foundry 專案 → 概觀 → 端點，或使用 `az resource show` |
| **訂閱 ID** | `az account show --query id -o tsv` |
| **模型部署名稱** | 在 Foundry 專案中部署的模型名稱 (例如 `gpt-5-4`) |

## 資訊清單格式 (Manifest Format)

資訊清單是一個 JSON 陣列，其中每個項目定義一個代理程式。請在常見路徑尋找它：`infra/foundry-agents.json`、`foundry-agents.json` 或 `.foundry/agents.json`。如果沒有，請建立一個。

```json
[
  {
    "useCaseId": "alert-triage",
    "description": "此代理程式功能的簡短說明。",
    "baseInstruction": "您是一位...的助理 <代理程式的系統提示詞>"
  }
]
```

### 欄位參考 (Field Reference)

| 欄位 | 必要 | 說明 |
|---|---|---|
| `useCaseId` | 是 | Kebab-case 識別碼；用於建立代理程式名稱 (`{prefix}-{useCaseId}`) |
| `description` | 是 | 以代理程式中繼資料儲存的人類可讀說明 |
| `baseInstruction` | 是 | 代理程式的系統提示詞 / 基礎指令 |

## 同步指令碼 (Sync Script)

### PowerShell (互動式 / CI)

建立或找到同步指令碼。標準路徑為 `infra/scripts/sync-foundry-agents.ps1`，但請依儲存庫佈局進行調整。

```powershell
param(
  [Parameter(Mandatory)]
  [string]$SubscriptionId,

  [Parameter(Mandatory)]
  [string]$ProjectEndpoint,

  [string]$ManifestPath = (Join-Path $PSScriptRoot '..\foundry-agents.json'),
  [string]$ModelName = 'gpt-5-4',
  [string]$AgentNamePrefix = 'myproject',
  [string]$ApiVersion = '2025-11-15-preview'
)

$ErrorActionPreference = 'Stop'

# 選用：為每個代理程式附加常見的指令後綴
$commonSuffix = ''

az account set --subscription $SubscriptionId | Out-Null
$accessToken = az account get-access-token --resource https://ai.azure.com/ --query accessToken -o tsv
if (-not $accessToken) { throw '無法取得 Foundry 存取權杖。' }

$definitions = Get-Content -Raw -Path $ManifestPath | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $accessToken" }
$results = @()

foreach ($def in $definitions) {
  $agentName = "$AgentNamePrefix-$($def.useCaseId)"
  $instructions = if ($commonSuffix) { "$($def.baseInstruction)`n`n$commonSuffix" } else { $def.baseInstruction }
  $body = @{
    definition  = @{ kind = 'prompt'; model = $ModelName; instructions = $instructions }
    description = $def.description
    metadata    = @{ useCaseId = $def.useCaseId; managedBy = 'foundry-agent-sync' }
  } | ConvertTo-Json -Depth 8

  $uri = "$($ProjectEndpoint.TrimEnd('/'))/agents/$agentName`?api-version=$ApiVersion"
  $resp = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body
  $version = $resp.version ?? $resp.latest_version ?? $resp.id ?? 'unknown'
  Write-Host "已同步 $agentName ($version)"
  $results += [pscustomobject]@{ name = $agentName; version = $version }
}

$results | Format-Table -AutoSize
```

### Bash (Bicep 部署指令碼 / CI)

若要透過 `Microsoft.Resources/deploymentScripts` 進行自動化部署，請使用執行以下步驟的 Bash 指令碼：

1. 使用受控識別 (managed identity) 進行驗證：`az login --identity --username "$CLIENT_ID"`
2. 取得 Foundry 權杖：`az account get-access-token --resource https://ai.azure.com/`
3. 從 `FOUNDRY_AGENT_DEFINITIONS` 環境變數（JSON 字串）迭代定義
4. 將每個代理程式 POST 至 `{endpoint}/agents/{name}?api-version=2025-11-15-preview`

## Bicep 整合 (選用)

若要在基礎設施部署期間自動執行同步：

1. **在編譯時間載入資訊清單**：
   ```bicep
   var agentDefinitions = loadJsonContent('foundry-agents.json')
   ```

2. **建立使用者指派受控識別 (User-Assigned Managed Identity)**，並在 Foundry 專案上具備 **Azure AI User** 角色。

3. **建立 `Microsoft.Resources/deploymentScripts`** 資源 (型別 `AzureCLI`)，該資源需：
   - 使用受控識別
   - 透過 `loadTextContent` 載入 Bash 同步指令碼
   - 將專案端點、定義與模型作為環境變數傳遞

透過 `deployFoundryAgents` 參數進行控制，讓團隊可選擇加入/退出。

## 工作流程 (Workflow)

### 步驟 1 — 找到或鷹架資訊清單

在儲存庫中搜尋 `foundry-agents.json`。如果不存在，請詢問使用者他們需要什麼代理程式並建立資訊清單。

### 步驟 2 — 找到或鷹架同步指令碼

搜尋 `sync-foundry-agents.ps1` 或 `foundry-agent-sync.sh`。如果缺少，請使用上述範本建立 PowerShell 指令碼，並調整：
- `$AgentNamePrefix` 以符合專案名稱
- `$ModelName` 至使用者的部署模型
- `$ManifestPath` 至實際的資訊清單路徑

### 步驟 3 — 收集參數

詢問使用者：
- Foundry 專案端點
- 訂閱 ID
- 模型部署名稱 (預設：`gpt-5-4`)
- 代理程式名稱前綴 (預設：Kebab-case 格式的儲存庫名稱)

### 步驟 4 — 執行同步

使用收集到的參數執行 PowerShell 指令碼：

```powershell
.\infra\scripts\sync-foundry-agents.ps1 `
  -SubscriptionId '<sub-id>' `
  -ProjectEndpoint '<endpoint>' `
  -ModelName '<model>' `
  -AgentNamePrefix '<prefix>'
```

### 步驟 5 — 驗證

透過列出代理程式來確認已同步的代理程式：

```powershell
$token = az account get-access-token --resource https://ai.azure.com/ --query accessToken -o tsv
$endpoint = '<project-endpoint>'
Invoke-RestMethod -Uri "$endpoint/agents?api-version=2025-11-15-preview" `
  -Headers @{ Authorization = "Bearer $token" }
```

## REST API 參考

| 作業 | 方法 | URL |
|---|---|---|
| 建立/更新代理程式 | POST | `{projectEndpoint}/agents/{agentName}?api-version=2025-11-15-preview` |
| 列出代理程式 | GET | `{projectEndpoint}/agents?api-version=2025-11-15-preview` |
| 取得代理程式 | GET | `{projectEndpoint}/agents/{agentName}?api-version=2025-11-15-preview` |
| 刪除代理程式 | DELETE | `{projectEndpoint}/agents/{agentName}?api-version=2025-11-15-preview` |

### 建立/更新負載 (Payload)

```json
{
  "definition": {
    "kind": "prompt",
    "model": "<deployed-model-name>",
    "instructions": "<system prompt>"
  },
  "description": "<agent description>",
  "metadata": {
    "useCaseId": "<use-case-id>",
    "managedBy": "foundry-agent-sync"
  }
}
```

## 疑難排解 (Troubleshooting)

| 症狀 | 原因 | 修復方法 |
|---|---|---|
| `401 Unauthorized` | 權杖過期或對象 (audience) 錯誤 | 重新執行 `az account get-access-token --resource https://ai.azure.com/` |
| `403 Forbidden` | 遺失 Azure AI User 角色 | 在 Foundry 專案範圍指派該角色 |
| `404 Not Found` | 專案端點錯誤 | 驗證端點是否包含 `/api/projects/{projectName}` |
| 找不到模型 | 模型未部署在專案中 | 先在 AI Foundry 入口網站部署模型 |
| 定義空白 | 資訊清單路徑錯誤 | 檢查 `-ManifestPath` 是否指向 JSON 檔案 |
