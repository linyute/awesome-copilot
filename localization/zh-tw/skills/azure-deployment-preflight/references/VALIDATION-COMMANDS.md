# 驗證指令參考

此參考文件記錄了所有用於 Azure 部署發布前驗證的指令。

## Azure Developer CLI (azd)

### azd provision --preview

預覽 azd 專案的基礎架構變更，而不執行部署。

```bash
azd provision --preview [options]
```

**選項：**
| 選項 | 描述 |
|--------|-------------|
| `--environment`, `-e` | 要使用的環境名稱 |
| `--no-prompt` | 接受預設值而不進行提示 |
| `--debug` | 啟用偵錯記錄 |
| `--cwd` | 設定工作目錄 |

**範例：**

```bash
# 使用預設環境預覽
azd provision --preview

# 預覽特定環境
azd provision --preview --environment dev

# 在無提示情況下預覽 (CI/CD)
azd provision --preview --no-prompt
```

**輸出：** 顯示將被建立、修改或刪除的資源。

### azd auth login

驗證 Azure 以執行 azd 操作。

```bash
azd auth login [options]
```

**選項：**
| 選項 | 描述 |
|--------|-------------|
| `--check-status` | 檢查登入狀態而不進行登入 |
| `--use-device-code` | 使用裝置代碼流 (device code flow) |
| `--tenant-id` | 指定租戶 |
| `--client-id` | 服務主體 (service principal) 的用戶端 ID |

### azd env list

列出可用的環境。

```bash
azd env list
```

---

## Azure CLI (az)

### az deployment group what-if

預覽資源群組部署的變更。

```bash
az deployment group what-if \
  --resource-group <rg-name> \
  --template-file <bicep-file> \
  [options]
```

**必要參數：**
| 參數 | 描述 |
|-----------|-------------|
| `--resource-group`, `-g` | 目標資源群組名稱 |
| `--template-file`, `-f` | Bicep 檔案路徑 |

**選用參數：**
| 參數 | 描述 |
|-----------|-------------|
| `--parameters`, `-p` | 參數檔案或內嵌數值 |
| `--validation-level` | `Provider` (預設)、`ProviderNoRbac` 或 `Template` |
| `--result-format` | `FullResourcePayloads` (預設) 或 `ResourceIdOnly` |
| `--no-pretty-print` | 輸出原始 JSON 以供解析 |
| `--name`, `-n` | 部署名稱 |
| `--exclude-change-types` | 從輸出中排除特定的變更類型 |

**驗證等級：**
| 等級 | 描述 | 使用案例 |
|-------|-------------|----------|
| `Provider` | 包含 RBAC 檢查的完整驗證 | 預設，最徹底 |
| `ProviderNoRbac` | 完整驗證，僅需讀取權限 | 缺乏部署權限時使用 |
| `Template` | 僅進行靜態語法驗證 | 快速語法檢查 |

**範例：**

```bash
# 基本 what-if
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep

# 包含參數與完整驗證
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters main.bicepparam \
  --validation-level Provider

# 無需 RBAC 檢查的遞補方案
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --validation-level ProviderNoRbac

# JSON 輸出以供解析
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --no-pretty-print
```

### az deployment sub what-if

預覽訂閱等級部署的變更。

```bash
az deployment sub what-if \
  --location <location> \
  --template-file <bicep-file> \
  [options]
```

**必要參數：**
| 參數 | 描述 |
|-----------|-------------|
| `--location`, `-l` | 部署中繼資料的位置 |
| `--template-file`, `-f` | Bicep 檔案路徑 |

**範例：**

```bash
az deployment sub what-if \
  --location eastus \
  --template-file main.bicep \
  --parameters main.bicepparam \
  --validation-level Provider
```

### az deployment mg what-if

預覽管理群組部署的變更。

```bash
az deployment mg what-if \
  --location <location> \
  --management-group-id <mg-id> \
  --template-file <bicep-file> \
  [options]
```

**必要參數：**
| 參數 | 描述 |
|-----------|-------------|
| `--location`, `-l` | 部署中繼資料的位置 |
| `--management-group-id`, `-m` | 目標管理群組 ID |
| `--template-file`, `-f` | Bicep 檔案路徑 |

### az deployment tenant what-if

預覽租戶等級部署的變更。

```bash
az deployment tenant what-if \
  --location <location> \
  --template-file <bicep-file> \
  [options]
```

**必要參數：**
| 參數 | 描述 |
|-----------|-------------|
| `--location`, `-l` | 部署中繼資料的位置 |
| `--template-file`, `-f` | Bicep 檔案路徑 |

### az login

驗證 Azure CLI。

```bash
az login [options]
```

**選項：**
| 選項 | 描述 |
|--------|-------------|
| `--tenant`, `-t` | 租戶 ID 或網域 |
| `--use-device-code` | 使用裝置代碼流 |
| `--service-principal` | 以服務主體身分登入 |

### az account show

顯示目前的訂閱背景。

```bash
az account show
```

### az group exists

檢查資源群組是否存在。

```bash
az group exists --name <rg-name>
```

---

## Bicep CLI

### bicep build

將 Bicep 編譯為 ARM JSON 並驗證語法。

```bash
bicep build <bicep-file> [options]
```

**選項：**
| 選項 | 描述 |
|--------|-------------|
| `--stdout` | 輸出至 stdout 而非檔案 |
| `--outdir` | 輸出目錄 |
| `--outfile` | 輸出檔案路徑 |
| `--no-restore` | 跳過模組還原 |

**範例：**

```bash
# 驗證語法 (輸出至 stdout，不建立檔案)
bicep build main.bicep --stdout > /dev/null

# 建構至特定目錄
bicep build main.bicep --outdir ./build

# 驗證多個檔案
for f in *.bicep; do bicep build "$f" --stdout; done
```

**錯誤輸出格式：**
```
/path/to/file.bicep(22,51) : Error BCP064: Found unexpected tokens in interpolated expression.
/path/to/file.bicep(22,51) : Error BCP004: The string at this location is not terminated.
```

格式：`<檔案>(<行號>,<欄號>) : <嚴重性> <代碼>: <訊息>`

### bicep --version

檢查 Bicep CLI 版本。

```bash
bicep --version
```

---

## 參數檔案偵測

### Bicep 參數 (.bicepparam)

現代化的 Bicep 參數檔案 (建議使用)：

```bicep
using './main.bicep'

param location = 'eastus'
param environment = 'dev'
param tags = {
  environment: 'dev'
  project: 'myapp'
}
```

**偵測模式：** `<範本名稱>.bicepparam`

### JSON 參數 (.parameters.json)

傳統的 ARM 參數檔案：

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "location": { "value": "eastus" },
    "environment": { "value": "dev" }
  }
}
```

**偵測模式：**
- `<範本名稱>.parameters.json`
- `parameters.json`
- `parameters/<env>.json`

### 搭配指令使用參數

```bash
# Bicep 參數檔案
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters main.bicepparam

# JSON 參數檔案
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters @parameters.json

# 內嵌參數覆寫
az deployment group what-if \
  --resource-group my-rg \
  --template-file main.bicep \
  --parameters main.bicepparam \
  --parameters location=westus
```

---

## 決定部署範圍

檢查 Bicep 檔案的 `targetScope` 宣告：

```bicep
// 資源群組 (如果未指定，則為預設值)
targetScope = 'resourceGroup'

// 訂閱
targetScope = 'subscription'

// 管理群組
targetScope = 'managementGroup'

// 租戶
targetScope = 'tenant'
```

**範圍與指令對應：**

| targetScope | 指令 | 必要參數 |
|-------------|---------|---------------------|
| `resourceGroup` | `az deployment group what-if` | `--resource-group` |
| `subscription` | `az deployment sub what-if` | `--location` |
| `managementGroup` | `az deployment mg what-if` | `--location`, `--management-group-id` |
| `tenant` | `az deployment tenant what-if` | `--location` |

---

## 版本需求

| 工具 | 最低版本 | 建議版本 | 關鍵功能 |
|------|-----------------|---------------------|--------------|
| Azure CLI | 2.14.0 | 2.76.0+ | `--validation-level` 切換參數 |
| Azure Developer CLI | 1.0.0 | 最新版本 | `--preview` 旗標 |
| Bicep CLI | 0.4.0 | 最新版本 | 最佳的錯誤訊息 |

**檢查版本：**
```bash
az --version
azd version
bicep --version
```
