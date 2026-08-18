# 建構與 ACR Tasks (Builds & ACR Tasks)

## 目錄
- [快速建構 (az acr build)](#快速建構-az-acr-build)
- [執行一次指令或多步驟工作 (az acr run)](#執行一次指令或多步驟工作-az-acr-run)
- [ACR Tasks (az acr task)](#acr-tasks-az-acr-task)
- [觸發程序](#觸發程序)
- [多步驟工作 YAML](#多步驟工作-yaml)
- [代理程式集區](#代理程式集區)

---

## 快速建構 (az acr build)

在 Azure 中建構並推送至登錄檔 — 不需要本機 Docker 精靈程序：

```bash
# 從目前目錄建構並推送
az acr build --registry {registry} --image app:v1 .

# 自訂 Dockerfile、建構引數、目標平台
az acr build --registry {registry} --image app:v1 \
  --file docker/Dockerfile.prod \
  --build-arg VERSION=1.2.3 \
  --platform linux/amd64 .

# 跨平台：每次建構都會為目標平台產生一個單一架構映像檔
az acr build --registry {registry} --image app:v1-arm64 --platform linux/arm64 .
# 對於真正的多架構映像檔，請在特定架構標籤下針對每個平台建構一次，
# 然後組裝並推送資訊清單清單（本機使用 docker manifest create/push 或 docker buildx）

# 直接從 Git 存放庫建構（無需本機複製）
az acr build --registry {registry} --image app:v1 https://github.com/{org}/{repo}.git#{branch}:{folder}

# 僅建構不推送（僅供驗證）
az acr build --registry {registry} --image app:test --no-push .
```

注意事項：
- 建構上下文將會上傳；請使用 `.dockerignore` 保持其精簡。
- 每次建構都標記唯一的值（Git SHA、執行 ID）— 避免依賴 `latest`。

## 執行一次指令或多步驟工作 (az acr run)

```bash
# 在登錄檔的工作執行器中執行容器指令（context /dev/null = 無上傳）
az acr run --registry {registry} --cmd '{registry}.azurecr.io/app:v1' /dev/null

# 針對目前目錄執行多步驟工作檔案
az acr run --registry {registry} --file acb.yaml .
```

## ACR Tasks (az acr task)

持久、可觸發的建構定義：

```bash
# 建立一個在每次提交至 main 時建構的工作
az acr task create --registry {registry} --name build-app \
  --image "app:{{.Run.ID}}" \
  --context https://github.com/{org}/{repo}.git#main \
  --file Dockerfile \
  --git-access-token {pat} \
  --commit-trigger-enabled true \
  --base-image-trigger-enabled true

# 手動觸發、列出、檢查
az acr task run --registry {registry} --name build-app
az acr task list --registry {registry} --output table
az acr task list-runs --registry {registry} --name build-app --output table
az acr task logs --registry {registry} --name build-app        # 最新執行
az acr task logs --registry {registry} --run-id {run-id}

# 更新 / 停用 / 刪除
az acr task update --registry {registry} --name build-app --image "app:{{.Run.ID}}"
az acr task update --registry {registry} --name build-app --status Disabled
az acr task delete --registry {registry} --name build-app --yes
```

用於 `--image` 的實用執行變數：`{{.Run.ID}}`、`{{.Run.Commit}}`、`{{.Run.Branch}}`、`{{.Run.Date}}`。

⚠️ 在**已啟用 ABAC 的登錄檔**上（`roleAssignmentMode` = `AbacRepositoryPermissions`），工作和快速建構/執行預設無法存取來源登錄檔。請將 `--source-acr-auth-id [caller]` 傳遞給 `az acr build`/`az acr run`，並將 `--source-acr-auth-id [system]`（或使用者指派的身分識別資源識別碼）傳遞給 `az acr task create`/`update`，然後授予該身分識別 `Container Registry Repository ...` 角色。請確保該工作確實具有該身分識別 — 在建立時新增 `--assign-identity [system]`，或在參照它之前在現有工作上執行 `az acr task identity assign`。

## 觸發程序

```bash
# 計時器觸發程序 (UTC 的 cron) — 例如每晚重建
az acr task timer add --registry {registry} --name build-app \
  --timer-name nightly --schedule "0 2 * * *"
az acr task timer list --registry {registry} --name build-app
az acr task timer remove --registry {registry} --name build-app --timer-name nightly
```

- **提交觸發程序**：在推送至追蹤的分支時重建 (`--commit-trigger-enabled`)。
- **基礎映像檔觸發程序**：當基礎映像檔（例如已修補的 `mcr.microsoft.com` 映像檔）更新時自動重建 (`--base-image-trigger-enabled`) — 這對於作業系統/架構修補至關重要。
- **計時器觸發程序**：Cron 排程；也是排程 `acr purge` 清理的標準方式（請參閱 `images-and-artifacts.md`）。

存取其他登錄檔或 Azure 資源的工作可以使用身分識別：

```bash
az acr task identity assign --registry {registry} --name build-app   # 系統指派
az acr task credential add --registry {registry} --name build-app \
  --login-server {other-registry}.azurecr.io --use-identity [system]
```

## 多步驟工作 YAML

`acb.yaml` — 建構、測試，僅在成功時推送：

```yaml
version: v1.1.0
steps:
  - build: -t $Registry/app:{{.Run.ID}} -f Dockerfile .
  - cmd: $Registry/app:{{.Run.ID}} run-tests
  - push:
      - $Registry/app:{{.Run.ID}}
```

```bash
# 執行一次
az acr run --registry {registry} --file acb.yaml .

# 或從 YAML 建立已觸發的工作
az acr task create --registry {registry} --name build-test-push \
  --file acb.yaml \
  --context https://github.com/{org}/{repo}.git#main \
  --git-access-token {pat}
```

## 代理程式集區

Premium SKU。專用工作運算 — 適用於更多 CPU，或是針對受網路限制的登錄檔執行工作的兩種受支援方式之一（另一種是受信任的服務 + 工作網路略過原則，請參閱 `networking-and-geo.md`）：

```bash
az acr agentpool create --registry {registry} --name pool1 --tier S2   # S1/S2/S3/I6

# 對於防火牆/VNet 情境，集區必須附加到可以連線至登錄檔私人端點的子網路 —
# 沒有 --subnet-id，它會在 VNet 之外執行
az acr agentpool create --registry {registry} --name pool1 --tier S2 \
  --subnet-id /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/{subnet}

az acr agentpool list --registry {registry} --output table

# 指定集區
az acr build --registry {registry} --agent-pool pool1 --image app:v1 .
az acr task create --registry {registry} --name build-app --agent-pool pool1 ...
```
