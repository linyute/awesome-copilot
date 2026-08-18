# 網路與異地複寫 (Networking & Geo-Replication)

## 目錄
- [異地複寫](#異地複寫)
- [區域備援](#區域備援)
- [私人端點 (Private Link)](#私人端點-private-link)
- [公用網路規則](#公用網路規則)
- [專用資料端點](#專用資料端點)
- [已連線的登錄檔](#已連線的登錄檔)
- [登錄檔傳輸管道](#登錄檔傳輸管道)

異地複寫、私人端點、公用 IP 網路規則、專用資料端點、已連線的登錄檔及傳輸管道需要 **Premium** SKU。區域備援在每個層級中皆為自動啟用。

---

## 異地複寫

單一登錄檔、單一登入伺服器，由最近的區域提供映像檔服務：

```bash
az acr replication create --registry {registry} --location westeurope
az acr replication list --registry {registry} --output table
az acr replication show --registry {registry} --name westeurope
az acr replication delete --registry {registry} --name westeurope

# 區域端點狀態（適用於 Webhook/複寫偵錯）
az acr replication update --registry {registry} --name westeurope --region-endpoint-enabled true
```

推送會自動進行複寫；客戶端持續提取 `{registry}.azurecr.io`，Traffic Manager 會路由至最近的複本。

## 區域備援

在**支援可用性區域的區域中，所有層級（Basic/Standard/Premium）的所有登錄檔皆會自動啟用**區域備援 — 不需要旗標、SKU 或操作，且無法停用。支援區域中的異地複本預設也具備區域備援能力。

請勿依賴 `zoneRedundancy` 屬性或舊版 `--zone-redundancy` 旗標：該屬性是已淘汰的產物，即使登錄檔完全具備區域備援能力，也可能顯示為 `Disabled`。不支援可用性區域的區域中的登錄檔是唯一的例外 — 請將它們（透過 `az acr import` 或傳輸管道）移轉至受支援的區域。

## 私人端點 (Private Link)

```bash
# 1. 若需要，停用端點子網路上的網路原則，然後建立端點
az network private-endpoint create --resource-group {rg} --name {registry}-pe \
  --vnet-name {vnet} --subnet {subnet} \
  --private-connection-resource-id $(az acr show --name {registry} --query id --output tsv) \
  --group-ids registry \
  --connection-name {registry}-pe-conn

# 2. 私人 DNS，使 {registry}.azurecr.io 解析為私人 IP
az network private-dns zone create --resource-group {rg} --name privatelink.azurecr.io
az network private-dns link vnet create --resource-group {rg} \
  --zone-name privatelink.azurecr.io --name {registry}-dns-link --virtual-network {vnet} --registration-enabled false
az network private-endpoint dns-zone-group create --resource-group {rg} \
  --endpoint-name {registry}-pe --name default \
  --private-dns-zone privatelink.azurecr.io --zone-name registry

# 3. 選擇性完全關閉公用存取
az acr update --name {registry} --public-network-enabled false

# 管理連線核准
az acr private-endpoint-connection list --registry-name {registry} --output table
az acr private-endpoint-connection approve --registry-name {registry} --name {connection}
```

注意事項：
- 每個私人端點都會為登錄檔**及其**資料端點 (`{registry}.{region}.data.azurecr.io`) 建立記錄 — 異地複寫的登錄檔每個區域需要一筆資料記錄。
- 停用公用存取後，標準 ACR Tasks 代理程式無法連線至登錄檔 — 請使用附加到 VNet 中子網路的專用代理程式集區，或啟用受信任的服務**以及**工作網路略過原則（見下文）。

## 公用網路規則

限制特定 IP 的公用存取，而不是（或在採用之前）完全走向私人網路：

```bash
# 預設拒絕，然後允許特定範圍
az acr update --name {registry} --default-action Deny
az acr network-rule add --name {registry} --ip-address 203.0.113.0/24
az acr network-rule list --name {registry}
az acr network-rule remove --name {registry} --ip-address 203.0.113.0/24

# 允許受信任的 Azure 服務（例如 Defender、ACI、映像檔匯入）通過防火牆
az acr update --name {registry} --allow-trusted-services true
```

⚠️ **自 2025 年 6 月 1 日起，僅使用 `--allow-trusted-services` 對於使用系統指派受控識別的 ACR Tasks 而言是不夠的** — 沒有工作網路略過原則，其執行會在受網路限制的登錄檔上收到 403 錯誤。請明確啟用它：

```bash
az resource update \
  --namespace Microsoft.ContainerRegistry --resource-type registries \
  --name {registry} --resource-group {rg} \
  --api-version 2025-06-01-preview \
  --set properties.networkRuleBypassAllowedForTasks=true
```

完全避免略過原則的替代方案：在附加到 VNet 的代理程式集區中執行工作，或使用 [acr-cli 二進位檔](https://github.com/azure/acr-cli) 在本機執行 `acr purge`。使用使用者指派身分識別的工作不受影響。

## 專用資料端點

為圖層下載提供穩定、登錄檔專屬的 FQDN (`{registry}.{region}.data.azurecr.io`)，而非共用儲存端點 — 簡化客戶端防火牆規則：

```bash
az acr update --name {registry} --data-endpoint-enabled true
az acr show-endpoints --name {registry}
```

## 已連線的登錄檔

雲端登錄檔的地端 / IoT 邊緣鏡像：

```bash
# 父登錄檔必須具有專用資料端點
az acr update --name {registry} --data-endpoint-enabled true

az acr connected-registry create --registry {registry} --name {connected-name} \
  --repository "app" "hello-world" \
  --mode ReadOnly            # 或 ReadWrite

az acr connected-registry list --registry {registry} --output table
az acr connected-registry get-settings --registry {registry} --name {connected-name} \
  --parent-protocol https --generate-password 1
az acr connected-registry deactivate --registry {registry} --name {connected-name}
```

## 登錄檔傳輸管道

透過儲存體 Blob 在不相連的雲端/租用戶之間移動映像檔（擴充功能 `acrtransfer`）：

```bash
az extension add --name acrtransfer

# 從來源登錄檔匯出至儲存體容器（Key Vault 中的 SAS 權杖）
az acr export-pipeline create --resource-group {rg} --registry {src-registry} \
  --name export-pipe \
  --secret-uri https://{vault}.vault.azure.net/secrets/{sas-secret} \
  --storage-container-uri https://{account}.blob.core.windows.net/{container}

# 在目標端匯入
az acr import-pipeline create --resource-group {rg} --registry {dst-registry} \
  --name import-pipe \
  --secret-uri https://{vault}.vault.azure.net/secrets/{sas-secret} \
  --storage-container-uri https://{account}.blob.core.windows.net/{container}

# 執行匯出
az acr pipeline-run create --resource-group {rg} --registry {src-registry} \
  --pipeline export-pipe --name run1 --pipeline-type export \
  --artifacts app:v1 app:v2 --storage-blob transfer-blob-1
```

對於簡單的同雲端複製，優先使用 `az acr import`（請參閱 `images-and-artifacts.md`）。
