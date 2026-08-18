---
name: 'azure-container-registry-cli'
description: '透過 az acr CLI 管理 Azure Container Registry，包括登錄檔、映像檔、雲端建構、ACR Tasks、驗證、權杖、異地複寫及網路。適用於處理 ACR、az acr 指令、在 Azure 中推送/匯入/清除容器映像檔，或當使用者提及 Azure Container Registry 時。'
---

# Azure Container Registry CLI

使用 Azure CLI 的 `az acr` 指令群組管理 Azure Container Registry (ACR) 資源。

**CLI：** `az acr` 隨附於核心 Azure CLI — 不需要擴充功能（`acrtransfer` 擴充功能僅在匯出/匯入管道時需要）。

## 先決條件

```bash
# 安裝 Azure CLI
brew install azure-cli  # macOS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux
winget install Microsoft.AzureCLI  # Windows

# 登入並選取訂用帳戶
az login
az account set --subscription {subscription-id}
```

## 快速入門

```bash
# 建立登錄檔 (SKU: Basic | Standard | Premium)
az acr create --resource-group {rg} --name {registry} --sku Standard

# 針對登錄檔驗證 Docker/Podman
az acr login --name {registry}

# 在雲端建構並推送 — 不需要本機 Docker
az acr build --registry {registry} --image app:v1 .

# 從另一個登錄檔複製映像檔而無需提取/推送
az acr import --name {registry} --source mcr.microsoft.com/hello-world:latest

# 列出存放庫與標籤
az acr repository list --name {registry} --output table
az acr repository show-tags --name {registry} --repository app --orderby time_desc

# 診斷登錄檔連線能力與設定
az acr check-health --name {registry} --yes
```

## 關鍵原則

- **優先使用 `az acr build` / ACR Tasks** 而非本機 `docker build` + `docker push`：建構在 Azure 中執行、無需本機精靈程序即可運作，並與觸發程序整合。
- **優先使用 `az acr import`** 在登錄檔之間移動映像檔：它是伺服器端操作、速度更快，且不需要本機儲存空間。
- **切勿在生產環境中啟用管理員使用者** — 使用 Microsoft Entra 身分識別（RBAC 角色 `AcrPull`/`AcrPush`，或已啟用 ABAC 之登錄檔上的 `Container Registry Repository Reader`/`Writer`）、存放庫範圍權杖或受控識別。
- **Premium 專屬功能**：異地複寫、私人端點、保留原則、已連線的登錄檔、代理程式集區。（存放庫範圍權杖可在所有層級運作；在支援的區域中，所有層級皆自動具備區域備援能力。）

## CLI 結構

```
az acr
├── create / delete / list / show / update   # 登錄檔生命週期
├── login                  # Docker 認證協助程式（或 --expose-token）
├── check-health / check-name / show-usage   # 診斷與配額
├── build                  # 雲端映像檔建構（快速工作）
├── run                    # 執行一次指令 / 多步驟工作
├── task                   # ACR Tasks（觸發程序、計時器、記錄、執行）
├── agentpool              # 專用工作代理程式集區 (Premium)
├── import                 # 伺服器端將映像檔複製到登錄檔
├── repository             # 列出/顯示/刪除/取消標記存放庫與標籤、鎖定映像檔
├── manifest               # 資訊清單 Metadata、刪除、OCI 參照者
├── credential             # 管理員使用者認證（生產環境中應避免）
├── token / scope-map      # 存放庫範圍權杖 (Premium)
├── replication            # 異地複寫 (Premium)
├── network-rule           # IP 網路規則
├── private-endpoint-connection  # Private Link 核准
├── config                 # content-trust、retention、soft-delete, ...
├── cache / credential-set # 成品快取（提取快取）規則
├── webhook                # 推送/刪除事件 Webhook
├── connected-registry     # 地端 / IoT 已連線的登錄檔
└── export-pipeline / import-pipeline / pipeline-run  # acrtransfer 擴充功能
```

## 參考檔案

根據使用者的任務閱讀相關的參考檔案。每個檔案都包含其領域的完整指令語法與範例。

| 檔案 | 何時閱讀 | 涵蓋內容 |
|---|---|---|
| `references/auth-and-security.md` | 登入失敗、權限、CI/CD 或 AKS 提取存取 | `az acr login`（含 `--expose-token`）、Entra RBAC 角色、服務主體、受控識別、用於 AKS 的 `--attach-acr`、存放庫範圍權杖與範圍對應、管理員使用者、內容信任 |
| `references/build-and-tasks.md` | 在 Azure 中建構映像檔、自動化、CI 觸發程序 | `az acr build`、`az acr run`、多步驟工作 YAML、`az acr task`（Git/基礎映像檔/計時器觸發程序、記錄、執行）、代理程式集區 |
| `references/images-and-artifacts.md` | 管理存放庫、標籤、清理、儲存成本 | `az acr import`、存放庫與資訊清單指令、取消標記 vs 刪除、清除 (`acr purge`)、映像檔鎖定、保留原則、虛擬刪除、成品快取、`show-usage` |
| `references/networking-and-geo.md` | 多區域、私人存取、邊緣情境 | 異地複寫、區域備援、私人端點、網路規則、專用資料端點、已連線的登錄檔、登錄檔傳輸管道 |
