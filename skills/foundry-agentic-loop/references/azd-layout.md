# SDD 解決方案的 azd 配置

[Implement](implement.md) 與 [Deploy](deploy.md) 階段的參考資料。下列所有名稱皆為範例。實際名稱請取自 `docs/spec.md`。

## 樣板架構至現有工作區 (Scaffold into an existing workspace)

Specify 會在工作區中留下 `docs/` 與 `.azure/`。使用 `--no-prompt` 的 `azd ai agent init .` 會拒絕非空白資料夾 ("confirmation declined; app was not initialized")，且採用程序會拒絕 `--force`。請改在空白資料夾中架構第一個 agent：

1. `mkdir .scaffold && cd .scaffold`，然後執行 `azd ai agent init . -e <env> --no-prompt -t <azureYamlUrl> --deploy-mode code --runtime python_3_13 --entry-point main.py --agent-name <agent>`，從範例的 `initCommand` 取得 URL (`-m` 已棄用)。當規格與範例預設值不同時，新增 `--model <model>`。
2. 將範例資料夾 (`.scaffold/src/<sample>`) 移動至 `src/agents/<agent>`，並在 `azure.yaml` 中更新該服務的 `project:` 路徑。
3. 僅在根目錄缺少時才將 `azure.yaml`、`AGENTS.md` 與 `CLAUDE.md` 移至根目錄；否則進行合併，保持根目錄 `AGENTS.md` 的 Agentic Loop 區段不變。
4. 將 `.scaffold/.azure/config.json` 與 `.scaffold/.azure/<env>/` 複製到 `.azure/`。切勿移動或覆寫 `.azure/`：它包含 `deployment-plan.md`。
5. Init 會將其檔案暫存到 git：執行 `git rm --cached -r -q --ignore-unmatch .scaffold`，接著執行 `rm -rf .scaffold`，並檢查 `git status --short` 未列出任何 `.scaffold` 路徑。
6. 在每個 agent 資料夾中編寫 `.agentignore`（而非 `.azdignore`），列出測試、評估程式、評估設定、Dockerfile、虛擬環境與 `.env*`，使程式碼套件僅攜帶執行階段檔案。

如 Implement 步驟 3 所述，使用 `azd ai agent init --src` 新增其他 agent。

## azure.yaml

保留樣板所寫入的 `ai-project` 區塊與 agent 設定，然後新增額外的服務與基礎結構層。

宣告式 skill、連線與 toolbox 服務需要以下擴充功能版本：

- `azure.ai.agents` 1.0.0-beta.17 或更新版本
- `azure.ai.connections` 與 `azure.ai.toolboxes` 1.0.0-beta.8 或更新版本
- `azure.ai.skills` 1.0.0-beta.1 或更新版本

使用 `azd ext list` 檢查已安裝的版本。僅在獲得核准後才使用 `azd extension update <id>` 進行升級。

```yaml
requiredVersions:
  azd: '>=1.32.0'
  extensions:
    azure.ai.agents: '>=1.0.0-beta.17'
    azure.ai.connections: '>=1.0.0-beta.8'
    azure.ai.toolboxes: '>=1.0.0-beta.8'
    azure.ai.skills: '>=1.0.0-beta.1'
name: claims-triage
services:
  ai-project:                          # 來自樣板架構；模型放置於此
    host: azure.ai.project
    deployments: [...]
  claims-policy:                       # Foundry skill：包含 SKILL.md 的資料夾
    host: azure.ai.skill
    uses: [ai-project]
    archive: skills/claims-policy
  claims-mcp:                          # 在 Container Apps 上的 FastMCP
    host: containerapp
    project: src/mcp/claims
    language: python
    docker: { path: Dockerfile, remoteBuild: true }
  claims-mcp-conn:
    host: azure.ai.connection
    uses: [ai-project, claims-mcp]
    category: RemoteTool
    target: ${MCP_CLAIMS_URL}
    authType: AgenticIdentityToken     # 請參閱 "MCP auth"
    audience: ${MCP_CLAIMS_AUDIENCE}
    env:
      MCP_CLAIMS_URL: ${MCP_CLAIMS_URL}
      MCP_CLAIMS_AUDIENCE: ${MCP_CLAIMS_AUDIENCE}
  claims-tools:                        # 寫入 TOOLBOX_CLAIMS_TOOLS_MCP_ENDPOINT
    host: azure.ai.toolbox
    uses: [ai-project, claims-policy, claims-mcp-conn]
    skills: [{ name: claims-policy }]
    tools:
      - type: mcp
        server_label: claims
        server_url: ${MCP_CLAIMS_URL}
        connection: claims-mcp-conn
        require_approval: never
    env: { MCP_CLAIMS_URL: ${MCP_CLAIMS_URL} }
  triage-agent:
    host: azure.ai.agent
    project: src/agents/triage-agent
    uses: [ai-project, claims-tools]
    # 保留來自樣板的 kind, name, codeConfiguration, protocols 與 container
    env:
      AZURE_AI_MODEL_DEPLOYMENT_NAME: ${AZURE_AI_MODEL_DEPLOYMENT_NAME}
      MODEL_API_BASE_URL: ${MODEL_API_BASE_URL}   # Copilot SDK agents；在佈建後設定
      TOOLBOX_ENDPOINT: ${TOOLBOX_CLAIMS_TOOLS_MCP_ENDPOINT}
  backend:
    host: containerapp
    project: src/backend
    language: python
    docker: { path: Dockerfile, remoteBuild: true }
  frontend:
    host: containerapp
    project: src/frontend
    language: js
    docker: { path: Dockerfile, remoteBuild: true }
infra:
  layers:
    - name: foundry
      provider: microsoft.foundry
      path: infra/foundry              # 僅 README.md
    - name: app
      provider: bicep
      path: infra/app
      dependsOn: [foundry]
```

### azure.yaml 規則

- **平台變數：** 切勿在 agent 的 `env` 中設定 `FOUNDRY_*` 或 `AGENT_*` 名稱，因為平台會予以插入。Deploy 會將 `AGENT_<SERVICE>_NAME`、`_VERSION` 與 `_<PROTOCOL>_ENDPOINT` 寫入 azd 環境中。
- **未經升級核准的舊版擴充功能：** 移除 skill、連線與 toolbox 服務。在具等冪性的 `postprovision` 攔截勾點 (hook) 中重新建立它們，該攔截勾點依序執行下列命令：
  1. `azd ai skill create|update <name> --file ./skills/<name>`
  2. `azd ai connection create <name> --kind remote-tool --target <url> --auth-type agentic-identity --audience <aud> --force`
  3. `azd ai toolbox create <name> --from-file <file>`

  請參閱 [foundry-toolbox.md](foundry-toolbox.md)。
- **MCP 驗證：** agent 身分識別透過連線呼叫 MCP 工具（[rbac-contract.md](rbac-contract.md)）。
  - **無金鑰 (預設)：** 使用 `AgenticIdentityToken`，並以 MCP 伺服器的 Entra 應用程式識別碼 URI 作為對象 (audience)。MCP 伺服器使用 Container Apps 驗證來驗證權杖，該驗證必須允許 agent 的用戶端識別碼（[部署後的授權](#部署後的授權)）。這需要一個 Entra 應用程式註冊，由部署者建立或來自 Microsoft Graph Bicep 擴充功能；在 `docs/implementation.md` 中記錄每個註冊的顯示名稱與應用程式識別碼以便拆除清理。若租用戶封鎖了應用程式註冊，請將關卡回報為 `blocked`。
  - **無驗證：** 僅在針對合成或公開資料的唯讀工具上，並在獲得明確核准的情況下使用 `authType: None`。在規格中將其記錄為假設。

## infra/app (搭配 AVM 的 Bicep)

`main.bicep` 設定 `targetScope = 'resourceGroup'` 並部署至 `AZURE_RESOURCE_GROUP`。Foundry 層會先建立 `rg-<env>`。`microsoft.foundry` 提供者可能會將帳戶與專案置於其專屬的群組中（`AZURE_FOUNDRY_RESOURCE_GROUP`，例如 `rg-<env>-foundry`）：在具備 `scope: resourceGroup(aiResourceGroupName)` 的模組中引用它們，並建立其角色指派與專案連線。

將每個 AVM 模組鎖定在其最新版本。可在 `https://mcr.microsoft.com/v2/bicep/avm/res/<path>/tags/list` 找到。

| 模組或資源 | 用途 |
| --- | --- |
| `managed-identity/user-assigned-identity` | 每個應用程式一個身分識別；將其 `AZURE_CLIENT_ID` 傳遞給應用程式 |
| `operational-insights/workspace`, `insights/component` | Log Analytics 與 Application Insights |
| `Microsoft.CognitiveServices/accounts/projects/connections@2025-04-01-preview` | 將 App Insights 連接至現有專案。設定 `category: 'AppInsights'`、`target` 為元件識別碼、`authType: 'ApiKey'`、`isSharedToAll: true`、`credentials.key` 為連線字串，以及 `metadata: { ApiType: 'Azure', ResourceId: <component ID> }`。 |
| `container-registry/registry` | 停用管理員使用者的 Basic SKU；授與 AcrPull 給每個應用程式身分識別 |
| `app/managed-environment` | Consumption 設定檔，記錄傳送至工作區 |
| `app/container-app` ×n | 請參閱 [Container app 設定](#container-app-設定) |
| `Microsoft.Authorization/roleAssignments` | 每個 [RBAC 契約](rbac-contract.md)列一個，例如後端 → 帳戶上的 Foundry User 以及應用程式 → Monitoring Metrics Publisher。依定義 ID 引用角色。 |

### Container app 設定

- 為每個應用程式標記 `azd-service-name: <service key>`。
- 將映像檔設定為 `empty(<app>Image) ? '<placeholder>' : <app>Image`，其中 `<app>Image` 來自 `${SERVICE_<NAME>_IMAGE_NAME=}`，且首次佈建預留位置為 `mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`，如此重新佈建即可保留已部署的映像檔。
- 透過 `registries` 使用應用程式的身分識別提取映像檔。
- 將 `targetPort` 設定為應用程式的實際連接埠。
- 名稱保持在 32 個字元以內。

### 部署後的授權

託管 agent 的執行階段身分識別僅在部署後存在。具等冪性的 `postdeploy` 攔截勾點會建立其 [RBAC 契約](rbac-contract.md)列與 MCP 允許清單。針對每個 agent：

1. 執行 `azd ai agent show <agent> --output json --no-prompt` 並讀取 `instance_identity` 與 `blueprint` 的主體識別碼與用戶端識別碼。
2. 僅將執行階段列授與執行個體主體；blueprint 會傳回 `PrincipalTypeNotSupported`。先使用 `az role assignment list --assignee <id> --role <role> --scope <scope>` 檢查，僅在遺漏時執行 `az role assignment create --assignee-object-id <id> --assignee-principal-type ServicePrincipal`。
3. 針對每個無金鑰 MCP 應用程式（以及 agent 呼叫的任何其他 Easy Auth 應用程式），允許其 toolbox 所觸及的每個 agent 的執行個體與 blueprint 用戶端識別碼：若為共用 toolbox 則包含所有 agent。使用 `azd env set` 將排序後的清單以逗點分隔儲存，例如 `MCP_ALLOWED_CLIENT_IDS`。Bicep 將其 `split()` 至 `validation.defaultAuthorizationPolicy.allowedApplications`，以便重新佈建時保留。若清單為空，toolbox 的 `tools/list` 會傳回 403。
4. 修補線上應用程式：`az rest` GET `https://management.azure.com<appId>/authConfigs/current?api-version=2024-03-01`，設定 `allowedApplications`，然後 PUT。

授權需要 2–5 分鐘才能生效：以輪詢退避機制重試首次託管呼叫，直到指定期限為止，而非重新部署未變更的程式碼。在 `azd up` 或 `azd deploy` 之後，使用 `az role assignment list --assignee <principalId> --all` 以及各應用程式的 `authConfigs/current` 進行確認；若遺漏任何項目，執行 `azd hooks run postdeploy --no-prompt` 並再次檢查。

### 參數

`main.parameters.json` 對應來自 azd 環境的數值，包含來自 foundry 層的輸出：

```json
{
  "parameters": {
    "environmentName": { "value": "${AZURE_ENV_NAME}" },
    "location": { "value": "${AZURE_LOCATION}" },
    "principalId": { "value": "${AZURE_PRINCIPAL_ID}" },
    "aiAccountName": { "value": "${AZURE_AI_ACCOUNT_NAME}" },
    "aiProjectName": { "value": "${AZURE_AI_PROJECT_NAME}" },
    "aiResourceGroupName": { "value": "${AZURE_FOUNDRY_RESOURCE_GROUP}" },
    "projectEndpoint": { "value": "${FOUNDRY_PROJECT_ENDPOINT}" },
    "mcpAllowedClientIds": { "value": "${MCP_ALLOWED_CLIENT_IDS=}" },
    "backendImage": { "value": "${SERVICE_BACKEND_IMAGE_NAME=}" }
  }
}
```

### 輸出

每個輸出都會成為 azd 環境變數：

- `AZURE_CONTAINER_REGISTRY_ENDPOINT` (container app 部署需要此變數)
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- 各應用程式的 `SERVICE_<NAME>_URI`
- `MCP_<NAME>_URL`，包含 MCP 路由，例如 `/mcp`

## 應用程式佈線 (App wiring)

- **後端：** 接收 `FOUNDRY_PROJECT_ENDPOINT`、agent 名稱與 `AZURE_CLIENT_ID` 作為環境變數。它使用針對 `https://ai.azure.com/.default` 的權杖呼叫 agent 的專屬端點，如[託管整合檢查點](hosted-integration-checkpoint.md)所述。
- **前端：** nginx 提供 Vite 建置成果，並透過 nginx 映像檔的 `templates/` 替換將 `/api` 代理至 `${BACKEND_URL}`。這不需要 CORS，也不需要建置時期的 URL。
- **遙測：** 每個應用程式都會接收 `APPLICATIONINSIGHTS_CONNECTION_STRING`（[observability.md](observability.md)）。
