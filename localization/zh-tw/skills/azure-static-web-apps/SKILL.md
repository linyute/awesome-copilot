---
name: azure-static-web-apps
description: 協助使用 SWA CLI 建立、設定與部署 Azure Static Web Apps。用於將靜態網站部署到 Azure、設定 SWA 本地開發、設定 staticwebapp.config.json、將 Azure Functions API 加入到 SWA，或為 Static Web Apps 設定 GitHub Actions CI/CD。
---

## 總覽

Azure Static Web Apps (SWA) 裝載具備選用無伺服器 API 後端的靜態前端。SWA CLI (`swa`) 提供本地開發模擬與部署能力。

**關鍵特性：**
- 具備 API Proxy 與驗證模擬功能的本地模擬器
- 框架自動偵測與設定
- 直接部署到 Azure
- 支援資料庫連線

**設定檔：**
- `swa-cli.config.json` - CLI 設定，**由 `swa init` 建立** (切勿手動建立)
- `staticwebapp.config.json` - 執行階段設定 (路由、驗證、標頭、API 執行階段) - 可以手動建立

## 一般指示

### 安裝

```bash
npm install -D @azure/static-web-apps-cli
```

驗證：`npx swa --version`

### 快速入門工作流程

**重要事項：務必使用 `swa init` 建立設定檔。切勿手動建立 `swa-cli.config.json`。**

1. `swa init` - **必要的首要步驟** - 自動偵測框架並建立 `swa-cli.config.json`
2. `swa start` - 在 `http://localhost:4280` 執行本地模擬器
3. `swa login` - 向 Azure 進行驗證
4. `swa deploy` - 部署到 Azure

### 設定檔

**swa-cli.config.json** - 由 `swa init` 建立，請勿手動建立：
- 執行 `swa init` 進行包含框架偵測的互動式設定
- 執行 `swa init --yes` 以接受自動偵測的預設值
- 僅在初始化後為了自訂設定而編輯產生的檔案

產生的設定範例 (僅供參考)：
```json
{
  "$schema": "https://aka.ms/azure/static-web-apps-cli/schema",
  "configurations": {
    "app": {
      "appLocation": ".",
      "apiLocation": "api",
      "outputLocation": "dist",
      "appBuildCommand": "npm run build",
      "run": "npm run dev",
      "appDevserverUrl": "http://localhost:3000"
    }
  }
}
```

**staticwebapp.config.json** (位於應用程式原始碼或輸出資料夾) - 此檔案可以手動建立用於執行階段設定：
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*", "/css/*"]
  },
  "routes": [
    { "route": "/api/*", "allowedRoles": ["authenticated"] }
  ],
  "platform": {
    "apiRuntime": "node:20"
  }
}
```

## 命令列參考

### swa login

向 Azure 驗證以進行部署。

```bash
swa login                              # 互動式登入
swa login --subscription-id <id>       # 特定訂閱
swa login --clear-credentials          # 清除快取的認證
```

**旗標：** `--subscription-id, -S` | `--resource-group, -R` | `--tenant-id, -T` | `--client-id, -C` | `--client-secret, -CS` | `--app-name, -n`

### swa init

根據現有的前端與 (選用) API 設定新的 SWA 專案。自動偵測框架。

```bash
swa init                    # 互動式設定
swa init --yes              # 接受預設值
```

### swa build

建構前端及/或 API。

```bash
swa build                   # 使用設定進行建構
swa build --auto            # 自動偵測並建構
swa build myApp             # 建構特定設定
```

**旗標：** `--app-location, -a` | `--api-location, -i` | `--output-location, -O` | `--app-build-command, -A` | `--api-build-command, -I`

### swa start

啟動本地開發模擬器。

```bash
swa start                                    # 從 outputLocation 提供服務
swa start ./dist                             # 提供特定資料夾服務
swa start http://localhost:3000              # Proxy 到開發伺服器
swa start ./dist --api-location ./api        # 包含 API 資料夾
swa start http://localhost:3000 --run "npm start"  # 自動啟動開發伺服器
```

**常見框架連接埠：**
| 框架 | 連接埠 |
|-----------|------|
| React/Vue/Next.js | 3000 |
| Angular | 4200 |
| Vite | 5173 |

**關鍵旗標：**
- `--port, -p` - 模擬器連接埠 (預設值：4280)
- `--api-location, -i` - API 資料夾路徑
- `--api-port, -j` - API 連接埠 (預設值：7071)
- `--run, -r` - 啟動開發伺服器的命令
- `--open, -o` - 自動開啟瀏覽器
- `--ssl, -s` - 啟用 HTTPS

### swa deploy

部署到 Azure Static Web Apps。

```bash
swa deploy                              # 使用設定進行部署
swa deploy ./dist                       # 部署特定資料夾
swa deploy --env production             # 部署到生產環境
swa deploy --deployment-token <TOKEN>   # 使用部署權杖
swa deploy --dry-run                    # 預覽而不部署
```

**取得部署權杖：**
- Azure 入口網站：Static Web App → 總覽 → 管理部署權杖
- CLI：`swa deploy --print-token`
- 環境變數：`SWA_CLI_DEPLOYMENT_TOKEN`

**關鍵旗標：**
- `--env` - 目標環境 (`preview` 或 `production`)
- `--deployment-token, -d` - 部署權杖
- `--app-name, -n` - Azure SWA 資源名稱

### swa db

初始化資料庫連線。

```bash
swa db init --database-type mssql
swa db init --database-type postgresql
swa db init --database-type cosmosdb_nosql
```

## 案例

### 從現有前端與後端建立 SWA

**務必在執行 `swa start` 或 `swa deploy` 前執行 `swa init`。請勿手動建立 `swa-cli.config.json`。**

```bash
# 1. 安裝 CLI
npm install -D @azure/static-web-apps-cli

# 2. 初始化 - 必要：使用自動偵測的設定建立 swa-cli.config.json
npx swa init              # 互動模式
# 或
npx swa init --yes        # 接受自動偵測的預設值

# 3. 建構應用程式 (如果需要)
npm run build

# 4. 本地測試 (使用來自 swa-cli.config.json 的設定)
npx swa start

# 5. 部署
npx swa login
npx swa deploy --env production
```

### 加入 Azure Functions 後端

1. **建立 API 資料夾：**
```bash
mkdir api && cd api
func init --worker-runtime node --model V4
func new --name message --template "HTTP trigger"
```

2. **範例函式** (`api/src/functions/message.js`)：
```javascript
const { app } = require('@azure/functions');

app.http('message', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request) => {
        const name = request.query.get('name') || 'World';
        return { jsonBody: { message: `Hello, ${name}!` } };
    }
});
```

3. **在 `staticwebapp.config.json` 中設定 API 執行階段**：
```json
{
  "platform": { "apiRuntime": "node:20" }
}
```

4. **在 `swa-cli.config.json` 中更新 CLI 設定**：
```json
{
  "configurations": {
    "app": { "apiLocation": "api" }
  }
}
```

5. **本地測試：**
```bash
npx swa start ./dist --api-location ./api
# 在 http://localhost:4280/api/message 存取 API
```

**支援的 API 執行階段：** `node:18`, `node:20`, `node:22`, `dotnet:8.0`, `dotnet-isolated:8.0`, `python:3.10`, `python:3.11`

### 設定 GitHub Actions 部署

1. **在 Azure 入口網站或透過 Azure CLI 建立 SWA 資源**
2. **連結 GitHub 儲存庫** - 工作流程會自動產生，或手動建立：

`.github/workflows/azure-static-web-apps.yml`：
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: /
          api_location: api
          output_location: dist

  close_pr:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: close
```

3. **加入密碼：** 將部署權杖複製到儲存庫密碼 `AZURE_STATIC_WEB_APPS_API_TOKEN`

**工作流程設定：**
- `app_location` - 前端原始碼路徑
- `api_location` - API 原始碼路徑
- `output_location` - 建構後的輸出資料夾
- `skip_app_build: true` - 如果已預先建構則跳過
- `app_build_command` - 自訂建構命令

## 疑難排解

| 問題 | 解決方案 |
|-------|----------|
| 用戶端路由出現 404 | 將具備 `rewrite: "/index.html"` 的 `navigationFallback` 加入到 `staticwebapp.config.json` |
| API 傳回 404 | 驗證 `api` 資料夾結構，確保已設定 `platform.apiRuntime`，檢查函式匯出 |
| 找不到建構輸出 | 驗證 `output_location` 是否與實際的建構輸出目錄相符 |
| 本地驗證無法運作 | 使用 `/.auth/login/<provider>` 存取驗證模擬器 UI |
| CORS 錯誤 | `/api/*` 下的 API 是同源的；外部 API 需要 CORS 標頭 |
| 部署權杖已過期 | 在 Azure 入口網站 → Static Web App → 管理部署權杖中重新產生 |
| 設定未套用 | 確保 `staticwebapp.config.json` 位於 `app_location` 或 `output_location` |
| 本地 API 逾時 | 預設為 45 秒；最佳化函式或檢查是否有阻斷呼叫 |

**偵錯命令：**
```bash
swa start --verbose log        # 詳細輸出
swa deploy --dry-run           # 預覽部署
swa --print-config             # 顯示解析後的設定
```
