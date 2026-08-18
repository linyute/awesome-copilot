# 驗證與安全性 (Authentication & Security)

## 目錄
- [個人登入](#個人登入)
- [Microsoft Entra RBAC 角色](#microsoft-entra-rbac-角色)
- [服務主體](#服務主體)
- [受控識別](#受控識別)
- [AKS 整合](#aks-整合)
- [存放庫範圍權杖](#存放庫範圍權杖)
- [管理員使用者](#管理員使用者)
- [內容信任](#內容信任)

---

## 個人登入

```bash
# 標準登入 — 透過您的 az login 身分連接 Docker/Podman 認證
az acr login --name {registry}

# 不使用 Docker 精靈程序：取得 Entra 存取權杖並將其傳遞給 docker login
LOGIN_SERVER=$(az acr show --name {registry} --query loginServer --output tsv)
az acr login --name {registry} --expose-token --query accessToken --output tsv | \
  docker login $LOGIN_SERVER --username 00000000-0000-0000-0000-000000000000 --password-stdin
```

注意事項：
- `az acr login` 權杖有效期間為 3 小時；到期時需重新執行。
- 使用 `az acr show --name {registry} --query loginServer --output tsv` 解析登入伺服器，而非寫死：它通常是 `{registry}.azurecr.io`，但主權雲端使用其他後置詞，且具有網域名稱標籤範圍的登錄檔會獲得雜湊後置詞。

## Microsoft Entra RBAC 角色

適用的資料平面角色取決於登錄檔的**角色指派權限模式** — 請先進行檢查：

```bash
az acr show --name {registry} --query roleAssignmentMode --output tsv
# LegacyRegistryPermissions  -> 使用 AcrPull/AcrPush/AcrDelete
# AbacRepositoryPermissions  -> 使用 Container Registry Repository Reader/Writer/Contributor
```

**舊版模式（RBAC 登錄檔權限）：**

| 角色 | 權限 |
|---|---|
| `AcrPull` | 提取映像檔 |
| `AcrPush` | 提取 + 推送映像檔 |
| `AcrDelete` | 刪除映像檔 |
| `AcrImageSigner` | 簽署映像檔（內容信任） |
| `Contributor`/`Owner` | 完整控制平面管理 + 推送/提取 |

**已啟用 ABAC 模式（RBAC 登錄檔 + ABAC 存放庫權限）：** `AcrPull`/`AcrPush`/`AcrDelete` **不受支援**，且 `Owner`/`Contributor`/`Reader` 僅授予控制平面權限。請改用：

| 角色 | 權限 |
|---|---|
| `Container Registry Repository Reader` | 讀取映像檔、標籤、Metadata（新增 ABAC 條件以限定範圍至存放庫） |
| `Container Registry Repository Writer` | 讀取 + 寫入/更新 |
| `Container Registry Repository Contributor` | 讀取 + 寫入 + 刪除 |
| `Container Registry Repository Catalog Lister` | 列出存放庫 — 僅在身分識別必須列舉目錄時指派（例如 `az acr repository list`）；對於已知存放庫的提取/推送不需要 |

```bash
# 取得登錄檔資源識別碼
ACR_ID=$(az acr show --name {registry} --query id --output tsv)

# 授予使用者、群組、服務主體或受控識別提取存取權限
az role assignment create --assignee {principal-id} --scope $ACR_ID --role AcrPull

# 列出擁有存取權限的人員/實體
az role assignment list --scope $ACR_ID --output table
```

## 服務主體

適用於無法使用 OIDC/受控識別的 CI/CD 系統：

```bash
# 建立範圍限定僅能提取的 SP
ACR_ID=$(az acr show --name {registry} --query id --output tsv)
az ad sp create-for-rbac --name {sp-name} --scopes $ACR_ID --role AcrPull

# 使用 SP 進行 Docker 登入 — 透過 stdin 傳遞機密，切勿將其作為引數傳遞
# （包含引號變數的 printf 會精確保留空白/萬用字元）
printf '%s' "$SP_PASSWORD" | docker login $LOGIN_SERVER --username {appId} --password-stdin
```

在 GitHub Actions / Azure DevOps 中，若可能，優先使用同盟認證 (OIDC) 而非 SP 密碼。

## 受控識別

適用於 Azure 運算資源（VM、App Service、Container Apps、Functions）：

```bash
# 指派系統指派的身分識別並授予其提取權限
az vm identity assign --name {vm} --resource-group {rg}
PRINCIPAL_ID=$(az vm show --name {vm} --resource-group {rg} --query identity.principalId --output tsv)
az role assignment create --assignee $PRINCIPAL_ID --scope $ACR_ID --role AcrPull
```

然後 App Service / Container Apps 可以使用自己 CLI 的 `--assign-identity` + `--acr-identity` 樣式旗標進行提取 — 不需要登錄檔密碼。

## AKS 整合

```bash
# 在叢集建立時附加
az aks create --name {cluster} --resource-group {rg} --attach-acr {registry}

# 附加/中斷連結現有叢集（向 kubelet 身分識別授予 AcrPull）
az aks update --name {cluster} --resource-group {rg} --attach-acr {registry}
az aks update --name {cluster} --resource-group {rg} --detach-acr {registry}

# 驗證叢集是否可連線至登錄檔
az aks check-acr --name {cluster} --resource-group {rg} --acr {registry}.azurecr.io
```

`--attach-acr` 需要登錄檔上的「擁有者」或「使用者存取管理員」權限。跨訂用帳戶附加可透過傳遞完整的 ACR 資源識別碼來運作。

⚠️ `--attach-acr` 會指派 `AcrPull`，這在**已啟用 ABAC 的登錄檔上不受支援**（`roleAssignmentMode` = `AbacRepositoryPermissions`）。對於這些登錄檔，請手動將 ABAC 角色指派給 kubelet 身分識別：

```bash
ACR_ID=$(az acr show --name {registry} --query id --output tsv)
KUBELET_ID=$(az aks show --name {cluster} --resource-group {rg} \
  --query identityProfile.kubeletidentity.objectId --output tsv)
az role assignment create --assignee $KUBELET_ID --scope $ACR_ID \
  --role "Container Registry Repository Reader"
# "Container Registry Repository Catalog Lister" 提取時並非必需 —
# 僅在該身分識別必須列出存放庫時才新增它
```

## 存放庫範圍權杖

適用於所有服務層級。細微且非 Entra 認證（例如外部合作夥伴、IoT 裝置）：

```bash
# 1. 建立範圍對應 (actions: content/read, content/write, content/delete, metadata/read, metadata/write)
az acr scope-map create --name {scope-map} --registry {registry} \
  --repository app content/read metadata/read \
  --description "Pull-only access to app"

# 2. 建立繫結至範圍對應的權杖
az acr token create --name {token} --registry {registry} --scope-map {scope-map}

# 3. 產生/輪替密碼（最多 2 個，可選到期日）
az acr token credential generate --name {token} --registry {registry} --password1 --expiration-in-days 30

# 使用權杖登入 — 透過 stdin 傳遞密碼，切勿作為引數傳遞
printf '%s' "$TOKEN_PWD" | docker login $LOGIN_SERVER --username {token} --password-stdin

# 停用或刪除
az acr token update --name {token} --registry {registry} --status disabled
az acr token delete --name {token} --registry {registry} --yes
```

## 管理員使用者

單一帳戶、對整個登錄檔具有完整推送/提取權限、無法依個別使用者進行稽核 — **在生產環境中保持停用**：

```bash
az acr update --name {registry} --admin-enabled false   # 建議做法
az acr credential show --name {registry}                # 檢視使用者名稱/密碼（若已啟用）
az acr credential renew --name {registry} --password-name password2   # 輪替
```

合理的使用情境：快速本機測試、僅接受使用者名稱/密碼且無法使用權杖的服務。

## 內容信任（已淘汰）

Docker 內容信任 (DCT) 正在停用：**自 2026 年 5 月 31 日起，無法在新的登錄檔（或從未啟用它的登錄檔）上啟用它**，並將於 2028 年 3 月 3 日完全移除。請勿設定 DCT — 請改用 **Notation (Notary Project)** 簽署映像檔並將簽章儲存為 OCI 成品；請參閱 ACR 文件中的「從 Docker 內容信任轉換為 Notary Project」。

```bash
# 僅限舊版 DCT 登錄檔 — 檢查或停用現有設定
az acr config content-trust show --registry {registry}
az acr config content-trust update --registry {registry} --status disabled
```

舊版 DCT 簽署者除 `AcrPush` 外還需要 `AcrImageSigner`。
