# 部署 — 完整的參考資料

Aspire 將**編排 (orchestration)** (執行什麼) 與**部署 (deployment)** (在哪裡執行) 分開。`aspire publish` 命令會將您的 AppHost 資源模型轉換為目標平台的部署資訊清單 (manifests)。

---

## 發佈 (Publish) vs 部署 (Deploy)

| 概念 | 功能 |
|---|---|
| **`aspire publish`** | 產生部署構件 (artifacts) (Dockerfile、Helm 圖表、Bicep 等) |
| **部署** | 透過 CI/CD 管線執行產生的構件 |

Aspire **不會**直接進行部署。它會產生資訊清單 — 由您來部署它們。

---

## 支援的目標

### Docker

**套件：** `Aspire.Hosting.Docker`

```bash
aspire publish -p docker -o ./docker-output
```

產生：
- `docker-compose.yml` — 與您的 AppHost 相符的服務定義
- 每個 .NET 專案的 `Dockerfile`
- 環境變數組態
- 磁碟區掛載 (Volume mounts)
- 網路組態

```csharp
// 用於 Docker 發佈的 AppHost 組態
var api = builder.AddProject<Projects.Api>("api")
    .PublishAsDockerFile();  // 覆寫預設的發佈行為
```

### Kubernetes

**套件：** `Aspire.Hosting.Kubernetes`

```bash
aspire publish -p kubernetes -o ./k8s-output
```

產生：
- Kubernetes YAML 資訊清單 (Deployments, Services, ConfigMaps, Secrets)
- Helm 圖表 (選用)
- Ingress 組態
- 基於 AppHost 組態的資源限制

```csharp
// AppHost：自訂 K8s 發佈
var api = builder.AddProject<Projects.Api>("api")
    .WithReplicas(3)                    // 映射到 K8s 複本 (replicas)
    .WithExternalHttpEndpoints();       // 映射到 Ingress/LoadBalancer
```

### Azure 容器應用程式 (Azure Container Apps)

**套件：** `Aspire.Hosting.Azure.AppContainers`

```bash
aspire publish -p azure -o ./azure-output
```

產生：
- 用於 Azure 容器應用程式環境的 Bicep 範本
- 每個服務的容器應用程式定義
- Azure Container Registry 組態
- 受控識別 (Managed identity) 組態
- Dapr 元件 (如果使用 Dapr 整合)
- VNET 組態

```csharp
// AppHost：Azure 特定組態
var api = builder.AddProject<Projects.Api>("api")
    .WithExternalHttpEndpoints()        // 映射到外部 Ingress
    .WithReplicas(3);                   // 映射到最小複本數

// 自動佈建 Azure 資源
var storage = builder.AddAzureStorage("storage");   // 建立儲存體帳戶 (Storage Account)
var cosmos = builder.AddAzureCosmosDB("cosmos");    // 建立 Cosmos DB 帳戶
var sb = builder.AddAzureServiceBus("messaging");   // 建立 Service Bus 命名空間
```

### Azure App Service

**套件：** `Aspire.Hosting.Azure.AppService`

```bash
aspire publish -p appservice -o ./appservice-output
```

產生：
- 用於 App Service 方案和 Web 應用程式的 Bicep 範本
- 連接字串組態
- 應用程式設定

---

## 資源模型到部署的映射

| AppHost 概念 | Docker Compose | Kubernetes | Azure 容器應用程式 |
|---|---|---|---|
| `AddProject<T>()` | 具有 Dockerfile 的 `service` | `Deployment` + `Service` | `Container App` |
| `AddContainer()` | 具有 `image:` 的 `service` | `Deployment` + `Service` | `Container App` |
| `AddRedis()` | `service: redis` | `StatefulSet` | 受控 Redis |
| `AddPostgres()` | `service: postgres` | `StatefulSet` | Azure PostgreSQL |
| `.WithReference()` | `environment:` 變數 | `ConfigMap` / `Secret` | 應用程式設定 |
| `.WithReplicas(n)` | `deploy: replicas: n` | `replicas: n` | `minReplicas: n` |
| `.WithVolume()` | `volumes:` | `PersistentVolumeClaim` | Azure 檔案 (Azure Files) |
| `.WithHttpEndpoint()` | `ports:` | `Service` 連接埠 | Ingress |
| `.WithExternalHttpEndpoints()` | `ports:` (主機) | `Ingress` / `LoadBalancer` | 外部 Ingress |
| `AddParameter(secret: true)` | `.env` 檔案 | `Secret` | Key Vault 參考 |

---

## CI/CD 整合

### GitHub Actions 範例

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'

      - name: Install Aspire CLI
        run: curl -sSL https://aspire.dev/install.sh | bash

      - name: Generate manifests
        run: aspire publish -p azure -o ./deploy

      - name: Deploy to Azure
        uses: azure/arm-deploy@v2
        with:
          template: ./deploy/main.bicep
          parameters: ./deploy/main.parameters.json
```

### Azure DevOps 範例

```yaml
trigger:
  branches:
    include: [main]

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: UseDotNet@2
    inputs:
      version: '10.0.x'

  - script: curl -sSL https://aspire.dev/install.sh | bash
    displayName: 'Install Aspire CLI'

  - script: aspire publish -p azure -o $(Build.ArtifactStagingDirectory)/deploy
    displayName: 'Generate deployment manifests'

  - task: AzureResourceManagerTemplateDeployment@3
    inputs:
      deploymentScope: 'Resource Group'
      templateLocation: '$(Build.ArtifactStagingDirectory)/deploy/main.bicep'
```

---

## 環境特定組態

### 將參數用於秘密

```csharp
// AppHost
var dbPassword = builder.AddParameter("db-password", secret: true);
var postgres = builder.AddPostgres("db", password: dbPassword);
```

在部署中：
- **Docker：** 從 `.env` 檔案載入
- **Kubernetes：** 從 `Secret` 資源載入
- **Azure：** 透過受控識別 (Managed identity) 從 Key Vault 載入

### 條件式資源

```csharp
// 在生產環境中使用 Azure 服務，在本地使用模擬器
if (builder.ExecutionContext.IsPublishMode)
{
    var cosmos = builder.AddAzureCosmosDB("cosmos");    // 真正的 Azure 資源
}
else
{
    var cosmos = builder.AddAzureCosmosDB("cosmos")
        .RunAsEmulator();                                // 本地模擬器
}
```

---

## 開發容器 (Dev Containers) 與 GitHub Codespaces

Aspire 範本包含 `.devcontainer/` 組態：

```json
{
  "name": "Aspire App",
  "image": "mcr.microsoft.com/devcontainers/dotnet:10.0",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/node:1": {}
  },
  "postCreateCommand": "curl -sSL https://aspire.dev/install.sh | bash",
  "forwardPorts": [18888],
  "portsAttributes": {
    "18888": { "label": "Aspire 儀表板" }
  }
}
```

連接埠轉送在 Codespaces 中會自動運作 — 儀表板和所有服務端點都可以透過轉送的 URL 存取。
