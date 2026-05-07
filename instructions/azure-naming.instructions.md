---
applyTo: '**/*.bicep,**/*.tf,**/*.tfvars,**/*.bicepparam,**/infra/**,**/infrastructure/**'
description: '基於 Microsoft CAF (雲端採用架構) 的 Azure 資源命名慣例。在建立、檢閱或建議 Azure 資源名稱時使用。'
---

# Azure 資源命名慣例 (CAF)

來源：[定義您的命名慣例](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming) | [縮寫](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations) | [命名規則](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules)

在建立、建議或檢閱 Azure 資源名稱時，請務必遵循以下規則。

---

## 一般模式

```
<resource-type-abbr>-<workload>-<environment>-<region>-<instance>
```

**元件規則：**
- **資源類型** — 使用下方表格中的官方縮寫，放在第一位
- **工作負載 / 應用程式 / 專案** — 簡短的描述性名稱 (例如：`navigator`, `payments`)
- **環境** — `prod`, `dev`, `qa`, `stage`, `test`
- **區域** — 使用 Azure 區域短名稱：`westus`, `eastus2`, `westeurope`, `northeurope`, `uksouth`, `southeastasia`, `australiaeast` 等。
- **執行個體** — 以零填補的數字：`001`, `002`

> 某些資源類型不遵循此模式 (例如：不允許使用連字號)。請參閱 [官方縮寫與命名規則](#official-abbreviations-and-naming-rules) 以瞭解各個資源的模式與條件約束。

**一般字元規則：**
- 偏好使用小寫字母與連字號 (`-`)。除非資源類型要求，否則不使用空格或底線。
- 某些資源 **不允許使用連字號** — 請改用串接的小寫英數字 (見表格)。
- 請勿使用：`#`, `<`, `>`, `%`, `&`, `\`, `?`, `/` 或控制字元。
- 請勿在名稱中編碼敏感資料 (訂閱 ID、租用戶 ID)。
- Azure 中的大多數名稱皆為 **不區分大小寫** — 請務必以不區分大小寫的方式進行比較。
- 具有公用端點的資源不得包含保留字或商標。

---

## 命名範圍

| 範圍 | 意義 |
|-------|---------|
| **全域** | 在整個 Azure 中唯一 (具有公用端點的 PaaS) |
| **資源群組** | 在資源群組內唯一 |
| **資源** | 在父資源內唯一 |

---

## 官方縮寫與命名規則

### 管理與治理

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| 管理群組 | `mg` | 租用戶 | 1-90 | 英數字、連字號、底線、句點、括號 | `mg-platform-prod` |
| 資源群組 | `rg` | 訂閱 | 1-90 | 底線、連字號、句點、括號、字母、數字 | `rg-navigator-prod` |
| Log Analytics 工作區 | `log` | 資源群組 | 4-63 | 英數字與連字號 | `log-navigator-prod-001` |
| Application Insights | `appi` | 資源群組 | 1-260 | 不能使用：`%&\?/` | `appi-navigator-prod-001` |
| 自動化帳戶 | `aa` | 資源群組 + 區域 | 6-50 | 英數字與連字號，必須以字母開頭 | `aa-navigator-prod-001` |

### 網路

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| 虛擬網路 | `vnet` | 資源群組 | 2-64 | 英數字、底線、句點、連字號 | `vnet-shared-eastus2-001` |
| 子網路 | `snet` | 虛擬網路 | 1-80 | 英數字、底線、句點、連字號 | `snet-shared-eastus2-001` |
| 網路安全性群組 | `nsg` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `nsg-weballow-001` |
| 應用程式安全性群組 | `asg` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `asg-navigator-prod-001` |
| 網路介面 | `nic` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `nic-01-vmnavigator-prod-001` |
| 公用 IP 位址 | `pip` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `pip-navigator-prod-westus-001` |
| 負載平衡器 (內部) | `lbi` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `lbi-navigator-prod-001` |
| 負載平衡器 (外部) | `lbe` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `lbe-navigator-prod-001` |
| 應用程式閘道 | `agw` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `agw-navigator-prod-001` |
| 防火牆 | `afw` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `afw-navigator-prod-001` |
| 防火牆原則 | `afwp` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `afwp-navigator-prod-001` |
| 路由表 | `rt` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `rt-navigator-prod-001` |
| 虛擬網路閘道 | `vgw` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `vgw-shared-eastus2-001` |
| VPN 閘道 | `vpng` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `vpng-navigator-prod-001` |
| Azure Bastion | `bas` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `bas-navigator-prod-001` |
| 私用端點 | `pep` | 資源群組 | 2-64 | 英數字、底線、句點、連字號 | `pep-navigator-prod-001` |
| Traffic Manager 設定檔 | `traf` | 全域 | 1-63 | 英數字與連字號 (無句點) | `traf-navigator-prod` |
| ExpressRoute 線路 | `erc` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `erc-navigator-prod-001` |
| CDN 設定檔 | `cdnp` | 資源群組 | 1-260 | 英數字與連字號 | `cdnp-navigator-prod-001` |
| Front Door 設定檔 | `afd` | 資源群組 | 5-64 | 英數字與連字號 | `afd-navigator-prod` |

### 運算與 Web

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| 虛擬機器 | `vm` | 資源群組 | 1-15 (Windows) / 1-64 (Linux) | 無空格或：`~ ! @ # $ % ^ & * ( ) = + _ [ ] { } \| ; : . ' " , < > / ?` | `vm-sql-test-001` |
| VM 擴充集 | `vmss` | 資源群組 | 1-15 (Windows) / 1-64 (Linux) | 與 VM 相同 | `vmss-navigator-prod-001` |
| 可用性設定組 | `avail` | 資源群組 | 1-80 | 英數字、底線、句點、連字號 | `avail-navigator-prod-001` |
| App Service 方案 | `asp` | 資源群組 | 1-60 | 英數字、連字號、Unicode | `asp-navigator-prod-001` |
| Web 應用程式 | `app` | 全域 | 2-60 | 英數字、連字號、Unicode。不能以連字號開頭/結尾。 | `app-navigator-prod-001` |
| 函式應用程式 | `func` | 全域 | 2-60 | 英數字、連字號、Unicode。不能以連字號開頭/結尾。 | `func-navigator-prod-001` |
| 靜態 Web 應用程式 | `stapp` | 資源群組 | — | — | `stapp-navigator-prod-001` |
| App Service 環境 | `ase` | 資源群組 | — | — | `ase-navigator-prod-001` |

### 容器

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| AKS 叢集 | `aks` | 資源群組 | 1-63 | 英數字、底線、連字號 | `aks-navigator-prod-001` |
| AKS 系統節點集區 | `npsystem` | 受管理叢集 | 1-12 (Linux) / 1-6 (Windows) | 小寫字母與數字，不能以數字開頭 | `npsystem` |
| AKS 使用者節點集區 | `np` | 受管理叢集 | 1-12 (Linux) / 1-6 (Windows) | 小寫字母與數字，不能以數字開頭 | `npusers` |
| 容器應用程式 | `ca` | 資源群組 | 2-32 | 小寫字母、數字、連字號。必須以字母開頭，英數字結尾。 | `ca-navigator-prod-001` |
| 容器應用程式環境 | `cae` | 資源群組 | — | — | `cae-navigator-prod-001` |
| 容器執行個體 | `ci` | 資源群組 | 1-63 | 小寫字母、數字、連字號。不能以連字號開頭/結尾。 | `ci-navigator-prod-001` |
| 容器登錄 | `cr` | 全域 | 5-50 | **僅限英數字 — 不含連字號** | `crnavigatorprod001` |

### 資料庫

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| Azure SQL 伺服器 | `sql` | 全域 | 1-63 | 小寫字母、數字、連字號。不能以連字號開頭/結尾。 | `sql-navigator-prod-001` |
| Azure SQL 資料庫 | `sqldb` | SQL 伺服器 | 1-128 | 不能使用：`<>*%&:\/?` | `sqldb-navigator-prod` |
| SQL 受管理執行個體 | `sqlmi` | 全域 | 1-63 | 小寫字母、數字、連字號。不能以連字號開頭/結尾。 | `sqlmi-navigator-prod-001` |
| Azure Cosmos DB | `cosmos` | 全域 | 3-44 | 小寫字母、數字、連字號。必須以小寫字母或數字開頭。 | `cosmos-navigator-prod` |
| Azure 受控 Redis | `amr` | 全域 | 1-63 | 英數字與連字號。必須以英數字開頭/結尾。 | `amr-navigator-prod-001` |
| MySQL 伺服器 | `mysql` | 全域 | 3-63 | 小寫字母、連字號、數字。不能以連字號開頭/結尾。 | `mysql-navigator-prod-001` |
| PostgreSQL 伺服器 | `psql` | 全域 | 3-63 | 小寫字母、連字號、數字。不能以連字號開頭/結尾。 | `psql-navigator-prod-001` |

### 儲存

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| 儲存體帳戶 | `st` | 全域 | 3-24 | **僅限小寫字母與數字 — 不含連字號** | `stnavigatorprod001` |
| 備份保存庫 | `bvault` | 資源群組 | 2-50 | 英數字與連字號。必須以字母開頭。 | `bvault-navigator-prod-001` |

### 安全性

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| 金鑰保存庫 | `kv` | 全域 | 3-24 | 英數字與連字號。必須以字母開頭，以字母或數字結尾。不允許連續連字號。 | `kv-navigator-prod-001` |
| 受管理識別碼 | `id` | 資源群組 | 3-128 | 英數字、連字號、底線。必須以字母或數字開頭。 | `id-navigator-prod-001` |

### 整合

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| API 管理 | `apim` | 全域 | 1-50 | 英數字與連字號。必須以字母開頭，以英數字結尾。 | `apim-navigator-prod` |
| Service Bus 命名空間 | `sbns` | 全域 | 6-50 | 英數字與連字號。必須以字母開頭，以字母或數字結尾。 | `sbns-navigator-prod` |
| Service Bus 佇列 | `sbq` | Service Bus | 1-260 | 英數字、句點、連字號、底線、斜線 | `sbq-navigator` |
| Service Bus 主題 | `sbt` | Service Bus | 1-260 | 英數字、句點、連字號、底線、斜線 | `sbt-navigator` |
| Event Hubs 命名空間 | `evhns` | 全域 | 6-50 | 英數字與連字號。必須以字母開頭，以字母或數字結尾。 | `evhns-navigator-prod` |
| 事件中心 | `evh` | Event Hubs 命名空間 | 1-256 | 英數字、句點、連字號、底線 | `evh-navigator` |
| 邏輯應用程式 | `logic` | 資源群組 | 1-43 | 英數字、連字號、底線、句點 | `logic-navigator-prod-001` |

### AI 與機器學習

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| Azure OpenAI 服務 | `oai` | 資源群組 | 2-64 | 英數字與連字號 | `oai-navigator-prod` |
| AI 搜尋 | `srch` | 全域 | — | — | `srch-navigator-prod` |
| Azure ML 工作區 | `mlw` | 資源群組 | 3-33 | 英數字、連字號、底線 | `mlw-navigator-prod` |
| Foundry 中樞 | `hub` | 資源群組 | 3-33 | 英數字、連字號、底線 | `hub-navigator-prod` |
| Foundry 中樞專案 | `proj` | Foundry 中樞 | 3-33 | 英數字、連字號、底線 | `proj-navigator-prod` |
| Foundry 帳戶 | `aif` | 資源群組 | 2-64 | 英數字與連字號 | `aif-navigator-prod` |
| Foundry 帳戶專案 | `proj` | Foundry 帳戶 | — | — | `proj-navigator-prod` |
| Foundry 工具 (多服務) | `ais` | 資源群組 | 2-64 | 英數字與連字號 | `ais-navigator-prod` |

### 分析與 IoT

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| Azure Data Factory | `adf` | 全域 | 3-63 | 英數字與連字號。必須以英數字開頭/結尾。 | `adf-navigator-prod` |
| Azure Databricks 工作區 | `dbw` | 資源群組 | 3-64 | 英數字、底線、連字號 | `dbw-navigator-prod-001` |
| Azure Data Explorer 叢集 | `dec` | 全域 | 4-22 | 小寫字母與數字。必須以字母開頭。 | `decnavigatorprod` |
| Azure Synapse 工作區 | `synw` | 全域 | 1-50 | 小寫字母、連字號、數字。必須以字母或數字開頭/結尾。 | `synw-navigator-prod` |
| IoT 中樞 | `iot` | 全域 | 3-50 | 英數字與連字號。不能以連字號結尾。 | `iot-navigator-prod` |
| Event Grid 主題 | `evgt` | 區域 | 3-50 | 英數字與連字號 | `evgt-navigator-prod` |

### 開發人員工具

| 資源 | 縮寫 | 範圍 | 長度 | 有效字元 | 範例 |
|----------|------|-------|--------|-----------------|---------|
| App Configuration 儲存 | `appcs` | 全域 | 5-50 | 英數字與連字號。不允許超過兩個連續連字號。 | `appcs-navigator-prod` |
| SignalR | `sigr` | 全域 | 3-63 | 英數字與連字號。必須以字母開頭，以字母或數字結尾。 | `sigr-navigator-prod` |

---

## 不允許使用連字號的資源

這些資源需要串接小寫英數字 (無分隔符號)：

| 資源 | 縮寫 | 模式 |
|----------|------|---------|
| 儲存體帳戶 | `st` | `st{workload}{env}{instance}` → `stnavigatorprod001` |
| 容器登錄 | `cr` | `cr{workload}{env}{instance}` → `crnavigatorprod001` |
| Azure Data Explorer 叢集 | `dec` | `dec{workload}{env}` → `decnavigatorprod` |

---

## 範例 (CAF)

```
# 管理
rg-navigator-prod
rg-webapp-database-dev

# 網路
vnet-shared-eastus2-001
snet-shared-eastus2-001
nsg-weballow-001
pip-dc1-shared-eastus2-001
lbe-navigator-prod-001

# 運算
vm-sql-test-001
vm-sharepoint-dev-001
vmss-navigator-prod-001
asp-navigator-prod-001
app-navigator-prod-001
func-navigator-prod-001

# 容器
aks-navigator-prod-001
ca-navigator-prod-001
cae-navigator-prod-001
crnavigatorprod001        # 無連字號！

# 資料庫
sql-navigator-prod-001
sqldb-navigator-prod
cosmos-navigator-prod
psql-navigator-prod-001

# 儲存 / 安全性
stnavigatorprod001        # 無連字號！
kv-navigator-prod-001
id-navigator-prod-001

# 整合
apim-navigator-prod
sbns-navigator-prod
evhns-navigator-prod

# 監視
log-navigator-prod-001
appi-navigator-prod-001

# AI
oai-navigator-prod
srch-navigator-prod
```

---

## 請勿執行

- 除非資源類型要求，否則請勿使用底線 — 請使用連字號。
- 請勿拼寫出完整的資源類型單字 (例如：`storageaccount-myapp` → 使用 `stmyapp001`)。
- 請勿使用大寫字母 (資源不區分大小寫；慣例是使用小寫)。
- 請勿在名稱中包含敏感資料 (訂閱 ID、租用戶 ID、密碼)。
- 請勿省略環境區段 — 即使是正式環境。
- 請勿使用 `#` — 這會破壞 Azure Resource Manager 中的 URL 剖析。
- 對於具有公用端點的資源，請勿在名稱中使用保留字或商標。
- 請勿使用超過兩個連續的連字號 (例如：`app--prod` 是無效的)。
