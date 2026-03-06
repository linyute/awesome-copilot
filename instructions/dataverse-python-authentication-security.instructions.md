---
applyTo: '**'
---

# Dataverse SDK for Python — 驗證與安全模式

基於 Microsoft Azure SDK 官方驗證文件和 Dataverse SDK 最佳實務。

## 1. 驗證概述

Dataverse SDK for Python 使用 Azure 身分憑證進行基於權杖的驗證。此方法遵循最小權限原則，並適用於本機開發、雲端部署和內部部署環境。

### 為何選擇基於權杖的驗證？

**相較於連線字串的優點**：
- 建立應用程式所需的特定權限 (最小權限原則)
- 憑證僅限於預期的應用程式範圍
- 使用受控身分識別，無需儲存或洩露機密
- 無縫跨環境運作，無需更改程式碼

---

## 2. 憑證類型與選擇

### 互動式瀏覽器憑證 (本機開發)

**用途**：開發人員在本機開發期間的工作站。

```python
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

# Opens browser for authentication
credential = InteractiveBrowserCredential()
client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential
)

# First use prompts for sign-in; subsequent calls use cached token
records = client.get("account")
```

**使用時機**：
- ✅ 互動式開發和測試
- ✅ 帶有 UI 的桌面應用程式
- ❌ 背景服務或排程工作

---

### 預設 Azure 憑證 (所有環境推薦)

**用途**：在多個環境 (開發 → 測試 → 生產) 中執行的應用程式。

```python
from azure.identity import DefaultAzureCredential
from PowerPlatform.Dataverse.client import DataverseClient

# Attempts credentials in this order:
# 1. Environment variables (app service principal)
# 2. Azure CLI credentials (local development)
# 3. Azure PowerShell credentials (local development)
# 4. Managed identity (when running in Azure)
credential = DefaultAzureCredential()

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential
)

records = client.get("account")
```

**優點**：
- 單一程式碼路徑適用於所有地方
- 無需特定於環境的邏輯
- 自動偵測可用的憑證
- 生產應用程式的首選

**憑證鏈**：
1. 環境變數 (`AZURE_CLIENT_ID`、`AZURE_TENANT_ID`、`AZURE_CLIENT_SECRET`)
2. Visual Studio Code 登入
3. Azure CLI (`az login`)
4. Azure PowerShell (`Connect-AzAccount`)
5. 受控身分識別 (在 Azure VM、App Service、AKS 等上執行時)

---

### 用戶端密碼憑證 (服務主體)

**用途**：無人值守驗證 (排程工作、腳本、內部部署服務)。

```python
from azure.identity import ClientSecretCredential
from PowerPlatform.Dataverse.client import DataverseClient
import os

credential = ClientSecretCredential(
    tenant_id=os.environ["AZURE_TENANT_ID"],
    client_id=os.environ["AZURE_CLIENT_ID"],
    client_secret=os.environ["AZURE_CLIENT_SECRET"]
)

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential
)

records = client.get("account")
```

**設定步驟**：
1. 在 Azure AD 中建立應用程式註冊
2. 建立用戶端密碼 (請妥善保管！)
3. 授予應用程式 Dataverse 權限
4. 將憑證儲存在環境變數或安全密碼庫中

**安全考量**：
- ⚠️ 絕不要將憑證硬編碼在原始程式碼中
- ⚠️ 將機密儲存在 Azure Key Vault 或環境變數中
- ⚠️ 定期輪換憑證
- ⚠️ 使用最低所需權限

---

### 受控身分識別憑證 (Azure 資源)

**用途**：託管在 Azure 中的應用程式 (App Service、Azure Functions、AKS、VM)。

```python
from azure.identity import ManagedIdentityCredential
from PowerPlatform.Dataverse.client import DataverseClient

# No secrets needed - Azure manages identity
credential = ManagedIdentityCredential()

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential
)

records = client.get("account")
```

**優點**：
- ✅ 無需管理機密
- ✅ 自動權杖刷新
- ✅ 高度安全
- ✅ 內建於 Azure 服務

**設定**：
1. 在 Azure 資源 (App Service、VM 等) 上啟用受控身分識別
2. 授予受控身分識別 Dataverse 權限
3. 程式碼自動使用身分識別

---

## 3. 特定環境配置

### 本機開發

```python
# .env file (git-ignored)
DATAVERSE_URL=https://myorg-dev.crm.dynamics.com

# Python code
import os
from azure.identity import DefaultAzureCredential
from PowerPlatform.Dataverse.client import DataverseClient

# Uses your Azure CLI credentials
credential = DefaultAzureCredential()
client = DataverseClient(
    base_url=os.environ["DATAVERSE_URL"],
    credential=credential
)
```

**設定**：使用您的開發人員帳戶執行 `az login`

---

### Azure App Service / Azure Functions

```python
from azure.identity import ManagedIdentityCredential
from PowerPlatform.Dataverse.client import DataverseClient

# Automatically uses managed identity
credential = ManagedIdentityCredential()
client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential
)
```

**設定**：在 App Service 中啟用受控身分識別，在 Dataverse 中授予權限

---

### 內部部署 / 第三方託管

```python
import os
from azure.identity import ClientSecretCredential
from PowerPlatform.Dataverse.client import DataverseClient

credential = ClientSecretCredential(
    tenant_id=os.environ["AZURE_TENANT_ID"],
    client_id=os.environ["AZURE_CLIENT_ID"],
    client_secret=os.environ["AZURE_CLIENT_SECRET"]
)

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential
)
```

**設定**：建立服務主體，安全地儲存憑證，授予 Dataverse 權限

---

## 4. 用戶端配置與連線設定

### 基本配置

```python
from PowerPlatform.Dataverse.core.config import DataverseConfig
from azure.identity import DefaultAzureCredential
from PowerPlatform.Dataverse.client import DataverseClient

cfg = DataverseConfig()
cfg.logging_enable = True  # Enable detailed logging

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=DefaultAzureCredential(),
    config=cfg
)
```

### HTTP 微調

```python
from PowerPlatform.Dataverse.core.config import DataverseConfig

cfg = DataverseConfig()

# Timeout settings
cfg.http_timeout = 30          # Request timeout in seconds

# Retry configuration
cfg.http_retries = 3           # Number of retry attempts
cfg.http_backoff = 1           # Initial backoff in seconds

# Connection reuse
cfg.connection_timeout = 5     # Connection timeout

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential,
    config=cfg
)
```

---

## 5. 安全最佳實務

### 1. 絕不硬編碼憑證

```python
# ❌ 不良範例 - 不要這麼做！
credential = ClientSecretCredential(
    tenant_id="your-tenant-id",
    client_id="your-client-id",
    client_secret="your-secret-key"  # 已洩露！
)

# ✅ 良好範例 - 使用環境變數
import os
credential = ClientSecretCredential(
    tenant_id=os.environ["AZURE_TENANT_ID"],
    client_id=os.environ["AZURE_CLIENT_ID"],
    client_secret=os.environ["AZURE_CLIENT_SECRET"]
)
```

### 2. 安全地儲存機密

**開發**：
```bash
# .env file (git-ignored)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret-key
```

**生產**：
```python
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

# Retrieve secrets from Azure Key Vault
credential = DefaultAzureCredential()
client = SecretClient(
    vault_url="https://mykeyvault.vault.azure.net",
    credential=credential
)

secret = client.get_secret("dataverse-client-secret")
```

### 3. 實施最小權限原則

```python
# 授予最小權限：
# - 如果應用程式只讀取，則只授予讀取權限
# - 如果可能，只授予特定資料表的權限
# - 憑證設定時間限制 (自動輪換)
# - 使用受控身分識別代替共享機密
```

### 4. 監控驗證事件

```python
import logging

logger = logging.getLogger("dataverse_auth")

try:
    client = DataverseClient(
        base_url="https://myorg.crm.dynamics.com",
        credential=credential
    )
    logger.info("Successfully authenticated to Dataverse")
except Exception as e:
    logger.error(f"Authentication failed: {e}")
    raise
```

### 5. 處理權杖過期

```python
from azure.core.exceptions import ClientAuthenticationError
import time

def create_with_auth_retry(client, table_name, payload, max_retries=2):
    """Create record, retrying if token expired."""
    for attempt in range(max_retries):
        try:
            return client.create(table_name, payload)
        except ClientAuthenticationError:
            if attempt < max_retries - 1:
                logger.warning("Token expired, retrying...")
                time.sleep(1)
            else:
                raise
```

---

## 6. 多租戶應用程式

### 租戶感知客戶端

```python
from azure.identity import DefaultAzureCredential
from PowerPlatform.Dataverse.client import DataverseClient

def get_client_for_tenant(tenant_id: str) -> DataverseClient:
    """Get DataverseClient for specific tenant."""
    credential = DefaultAzureCredential()
    
    # Dataverse URL contains tenant-specific org
    base_url = f"https://{get_org_for_tenant(tenant_id)}.crm.dynamics.com"
    
    return DataverseClient(
        base_url=base_url,
        credential=credential
    )

def get_org_for_tenant(tenant_id: str) -> str:
    """Map tenant to Dataverse organization."""
    # Implementation depends on your multi-tenant strategy
    # Could be database lookup, configuration, etc.
    pass
```

---

## 7. 驗證疑難排解

### 錯誤：「存取被拒」 (403)

```python
try:
    client.get("account")
except DataverseError as e:
    if e.status_code == 403:
        print("User/app lacks Dataverse permissions")
        print("Ensure Dataverse security role is assigned")
```

### 錯誤：「無效憑證」 (401)

```python
# Check credential source
from azure.identity import DefaultAzureCredential

try:
    cred = DefaultAzureCredential(exclude_cli_credential=False, 
                                  exclude_powershell_credential=False)
    # Force re-authentication
    import subprocess
    subprocess.run(["az", "login"])
except Exception as e:
    print(f"Authentication failed: {e}")
```

### 錯誤：「無效租戶」

```python
# Verify tenant ID
import json
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
token = credential.get_token("https://dataverse.dynamics.com/.default")

# Decode token to verify tenant
import base64
payload = base64.b64decode(token.token.split('.')[1] + '==')
claims = json.loads(payload)
print(f"Token tenant: {claims.get('tid')}")
```

---

## 8. 憑證生命週期

### 權杖刷新

Azure Identity 自動處理權杖刷新：

```python
# Tokens are cached and refreshed automatically
credential = DefaultAzureCredential()

# First call acquires token
client.get("account")

# Subsequent calls reuse cached token
client.get("contact")

# If token expires, SDK automatically refreshes
```

### 工作階段管理

```python
class DataverseSession:
    """Manages DataverseClient lifecycle."""
    
    def __init__(self, base_url: str):
        from azure.identity import DefaultAzureCredential
        
        self.client = DataverseClient(
            base_url=base_url,
            credential=DefaultAzureCredential()
        )
    
    def __enter__(self):
        return self.client
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Cleanup if needed
        pass

# Usage
with DataverseSession("https://myorg.crm.dynamics.com") as client:
    records = client.get("account")
```

---

## 9. Dataverse 特定安全性

### 列層級安全性 (RLS)

使用者的 Dataverse 安全性角色決定可存取的記錄：

```python
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

# Each user gets client with their credentials
def get_user_client(user_username: str) -> DataverseClient:
    # User must already be authenticated
    credential = InteractiveBrowserCredential()
    
    client = DataverseClient(
        base_url="https://myorg.crm.dynamics.com",
        credential=credential
    )
    
    # User only sees records they have access to
    return client
```

### 安全性角色

分配最低所需角色：
- **系統管理員**：完全存取 (避免用於應用程式)
- **銷售經理**：銷售資料表 + 報表
- **服務代表**：服務案例 + 知識
- **自訂**：建立具有特定資料表權限的角色

---

## 10. 另請參閱

- [Azure Identity 用戶端函式庫](https://learn.microsoft.com/zh-tw/python/api/azure-identity)
- [驗證至 Azure 服務](https://learn.microsoft.com/zh-tw/azure/developer/python/sdk/authentication/overview)
- [Azure Key Vault 用於機密](https://learn.microsoft.com/zh-tw/azure/key-vault/general/overview)
- [Dataverse 安全性模型](https://learn.microsoft.com/zh-tw/power-platform/admin/security/security-overview)
