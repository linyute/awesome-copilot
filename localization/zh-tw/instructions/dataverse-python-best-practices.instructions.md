# Dataverse SDK for Python - 最佳實務指南

## 概述
本文件為您提供從 Microsoft 官方 PowerPlatform-DataverseClient-Python 儲存庫、範例和推薦工作流程中萃取的生產就緒模式和最佳實務。

## 1. 安裝與環境設定

### 生產環境安裝
```bash
# 從 PyPI 安裝已發布的 SDK
pip install PowerPlatform-Dataverse-Client

# 安裝 Azure Identity 進行驗證
pip install azure-identity

# 可選：用於資料處理的 pandas 整合
pip install pandas
```

### 開發環境安裝
```bash
# 複製儲存庫
git clone https://github.com/microsoft/PowerPlatform-DataverseClient-Python.git
cd PowerPlatform-DataverseClient-Python

# 以可編輯模式安裝以進行即時開發
pip install -e .

# 安裝開發相依套件
pip install pytest pytest-cov black isort mypy ruff
```

### Python 版本支援
- **最低版本**：Python 3.10
- **建議版本**：Python 3.11+ 以獲得最佳效能
- **支援版本**：Python 3.10、3.11、3.12、3.13、3.14

### 驗證安裝
```python
from PowerPlatform.Dataverse import __version__
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import InteractiveBrowserCredential

print(f"SDK Version: {__version__}")
print("Installation successful!")
```

---

## 2. 驗證模式

### 互動式開發 (瀏覽器型)
```python
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

credential = InteractiveBrowserCredential()
client = DataverseClient("https://yourorg.crm.dynamics.com", credential)
```

**使用時機：** 本機開發、互動式測試、單一使用者情境。

### 生產環境 (用戶端密碼)
```python
from azure.identity import ClientSecretCredential
from PowerPlatform.Dataverse.client import DataverseClient

credential = ClientSecretCredential(
    tenant_id="your-tenant-id",
    client_id="your-client-id",
    client_secret="your-client-secret"
)
client = DataverseClient("https://yourorg.crm.dynamics.com", credential)
```

**使用時機：** 伺服器端應用程式、Azure 自動化、排程工作。

### 憑證型驗證
```python
from azure.identity import ClientCertificateCredential
from PowerPlatform.Dataverse.client import DataverseClient

credential = ClientCertificateCredential(
    tenant_id="your-tenant-id",
    client_id="your-client-id",
    certificate_path="path/to/certificate.pem"
)
client = DataverseClient("https://yourorg.crm.dynamics.com", credential)
```

**使用時機：** 高度安全環境、憑證釘選要求。

### Azure CLI 驗證
```python
from azure.identity import AzureCliCredential
from PowerPlatform.Dataverse.client import DataverseClient

credential = AzureCliCredential()
client = DataverseClient("https://yourorg.crm.dynamics.com", credential)
```

**使用時機：** 安裝 Azure CLI 的本機測試、Azure DevOps 管線。

---

## 3. 單一客戶端模式

**最佳實務**：建立一個 `DataverseClient` 實例並在整個應用程式中重複使用。

```python
# ❌ 反模式：重複建立新的客戶端
def fetch_account(account_id):
    credential = InteractiveBrowserCredential()
    client = DataverseClient("https://yourorg.crm.dynamics.com", credential)
    return client.get("account", account_id)

# ✅ 模式：單一客戶端
class DataverseService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            credential = InteractiveBrowserCredential()
            cls._instance = DataverseClient(
                "https://yourorg.crm.dynamics.com", 
                credential
            )
        return cls._instance

# 用法
service = DataverseService()
account = service.get("account", account_id)
```

---

## 4. 設定最佳化

### 連線設定
```python
from PowerPlatform.Dataverse.core.config import DataverseConfig
from PowerPlatform.Dataverse.client import DataverseClient
from azure.identity import ClientSecretCredential

config = DataverseConfig(
    language_code=1033,  # English (US)
    # 注意：http_retries、http_backoff、http_timeout 保留供內部使用
)

credential = ClientSecretCredential(tenant_id, client_id, client_secret)
client = DataverseClient("https://yourorg.crm.dynamics.com", credential, config)
```

**關鍵設定選項：**
- `language_code`：API 回應的語言 (預設：1033 代表英文)

---

## 5. CRUD 作業最佳實務

### 建立作業

#### 單一記錄
```python
record_data = {
    "name": "Contoso Ltd",
    "telephone1": "555-0100",
    "creditlimit": 100000.00,
}
created_ids = client.create("account", record_data)
record_id = created_ids[0]
print(f"建立：{record_id}")
```

#### 批次建立 (自動最佳化)
```python
# SDK 會自動對大於 1 條記錄的陣列使用 CreateMultiple
records = [
    {"name": f"Company {i}", "creditlimit": 50000 + (i * 1000)}
    for i in range(100)
]
created_ids = client.create("account", records)
print(f"建立 {len(created_ids)} 條記錄")
```

**效能**：批次建立在內部已最佳化；無需手動批次處理。

### 讀取作業

#### 依 ID 讀取單一記錄
```python
account = client.get("account", "account-guid-here")
print(account.get("name"))
```

#### 帶有篩選和選取條件的查詢
```python
# 傳回分頁結果 (生成器)
for page in client.get(
    "account",
    filter="creditlimit gt 50000",
    select=["name", "creditlimit", "telephone1"],
    orderby="name",
    top=100
):
    for account in page:
        print(f"{account['name']}: ${account['creditlimit']}")
```

**關鍵參數：**
- `filter`：OData 篩選 (必須使用**小寫**邏輯名稱)
- `select`：要擷取的欄位 (提高效能)
- `orderby`：排序結果
- `top`：每頁最大記錄數 (預設：5000)
- `page_size`：覆寫分頁的頁面大小

#### SQL 查詢 (唯讀)
```python
# SQL 查詢是唯讀的；用於複雜分析
results = client.query_sql("""
    SELECT TOP 10 name, creditlimit 
    FROM account 
    WHERE creditlimit > 50000
    ORDER BY name
""")

for row in results:
    print(f"{row['name']}: ${row['creditlimit']}")
```

**限制：**
- 唯讀 (僅限 SELECT，無 DML)
- 對於複雜的 JOIN 和分析很有用
- 可能會被組織政策禁用

### 更新作業

#### 單一記錄
```python
client.update("account", "account-guid", {
    "creditlimit": 150000.00,
    "name": "Updated Company Name"
})
```

#### 批次更新 (廣播相同更改)
```python
# 使用相同資料更新所有選定的記錄
account_ids = ["id1", "id2", "id3"]
client.update("account", account_ids, {
    "industrycode": 1,  # Retail
    "accountmanagerid": "manager-guid"
})
```

#### 成對更新 (1:1 記錄更新)
```python
# 對於每個記錄的不同更新，發送多個呼叫
updates = {
    "id1": {"creditlimit": 100000},
    "id2": {"creditlimit": 200000},
    "id3": {"creditlimit": 300000},
}
for record_id, data in updates.items():
    client.update("account", record_id, data)
```

### 刪除作業

#### 單一記錄
```python
client.delete("account", "account-guid")
```

#### 批次刪除 (最佳化)
```python
# SDK 會自動對大型列表使用 BulkDelete
record_ids = ["id1", "id2", "id3", ...]
client.delete("account", record_ids, use_bulk_delete=True)
```

---

## 6. 錯誤處理與復原

### 例外狀況階層
```python
from PowerPlatform.Dataverse.core.errors import (
    DataverseError,           # Base class
    ValidationError,          # Validation failures
    MetadataError,           # Table/column operations
    HttpError,               # HTTP-level errors
    SQLParseError            # SQL query syntax errors
)

try:
    client.create("account", {"name": None})  # Invalid
except ValidationError as e:
    print(f"驗證失敗：{e}")
    # 處理驗證特定邏輯
except DataverseError as e:
    print(f"一般 SDK 錯誤：{e}")
    # 處理其他 SDK 錯誤
```

### 重試邏輯模式
```python
import time
from PowerPlatform.Dataverse.core.errors import HttpError

def create_with_retry(table_name, record_data, max_retries=3):
    """Create record with exponential backoff retry logic."""
    for attempt in range(max_retries):
        try:
            return client.create(table_name, record_data)
        except HttpError as e:
            if attempt == max_retries - 1:
                raise
            
            # 指數退避：1s、2s、4s
            backoff_seconds = 2 ** attempt
            print(f"嘗試 {attempt + 1} 失敗。將在 {backoff_seconds} 秒後重試...")
            time.sleep(backoff_seconds)

# 用法
created_ids = create_with_retry("account", {"name": "Contoso"})
```

### 429 (請求速率限制) 處理
```python
import time
from PowerPlatform.Dataverse.core.errors import HttpError

try:
    accounts = client.get("account", top=5000)
except HttpError as e:
    if "429" in str(e):
        # 速率限制；等待並重試
        print("速率限制。等待 60 秒...")
        time.sleep(60)
        accounts = client.get("account", top=5000)
    else:
        raise
```

---

## 7. 資料表與資料行管理

### 建立自訂資料表
```python
from enum import IntEnum

class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

# 定義具有類型的資料行
columns = {
    "new_Title": "string",
    "new_Quantity": "int",
    "new_Amount": "decimal",
    "new_Completed": "bool",
    "new_Priority": Priority,  # 建立選項集/下拉式清單
    "new_CreatedDate": "datetime"
}

table_info = client.create_table(
    "new_CustomTable",
    primary_column_schema_name="new_Name",
    columns=columns
)

print(f"建立資料表：{table_info['table_schema_name']}")
```

### 取得資料表 Metadata
```python
table_info = client.get_table_info("account")
print(f"結構描述名稱：{table_info['table_schema_name']}")
print(f"邏輯名稱：{table_info['table_logical_name']}")
print(f"實體集：{table_info['entity_set_name']}")
print(f"主 ID：{table_info['primary_id_attribute']}")
```

### 列出所有資料表
```python
tables = client.list_tables()
for table in tables:
    print(f"{table['table_schema_name']} ({table['table_logical_name']})")
```

### 資料行管理
```python
# 將資料行新增至現有資料表
client.create_columns("new_CustomTable", {
    "new_Status": "string",
    "new_Priority": "int"
})

# 刪除資料行
client.delete_columns("new_CustomTable", ["new_Status", "new_Priority"])

# 刪除資料表
client.delete_table("new_CustomTable")
```

---

## 8. 分頁與大型結果集

### 分頁模式
```python
# 分頁擷取所有帳戶
all_accounts = []
for page in client.get(
    "account",
    top=500,      # 每頁記錄數
    page_size=500
):
    all_accounts.extend(page)
    print(f"擷取頁面，包含 {len(page)} 條記錄")

print(f"總計：{len(all_accounts)} 條記錄")
```

### 使用續頁權杖進行手動分頁
```python
# 對於複雜的分頁情境
skip_count = 0
page_size = 1000

while True:
    page = client.get("account", top=page_size, skip=skip_count)
    if not page:
        break
    
    print(f"頁面 {skip_count // page_size + 1}：{len(page)} 條記錄")
    skip_count += page_size
```

---

## 9. 檔案作業

### 上傳小檔案 (< 128 MB)
```python
from pathlib import Path

file_path = Path("document.pdf")
record_id = "account-guid"

# 對於小檔案，單一 PATCH 上傳
response = client.upload_file(
    table_name="account",
    record_id=record_id,
    file_column_name="new_documentfile",
    file_path=file_path
)
print(f"上傳成功：{response}")
```

### 上傳帶有分塊的大檔案
```python
from pathlib import Path

file_path = Path("large_video.mp4")
record_id = "account-guid"

# SDK 自動處理大檔案的分塊
response = client.upload_file(
    table_name="account",
    record_id=record_id,
    file_column_name="new_videofile",
    file_path=file_path,
    chunk_size=4 * 1024 * 1024  # 4 MB 分塊
)
print(f"分塊上傳完成")
```

---

## 10. OData 篩選最佳化

### 大小寫敏感性規則
```python
# ❌ 錯誤：大寫邏輯名稱
results = client.get("account", filter="Name eq 'Contoso'")

# ✅ 正確：小寫邏輯名稱
results = client.get("account", filter="name eq 'Contoso'")

# ✅ 必要時，值區分大小寫
results = client.get("account", filter="name eq 'Contoso Ltd'")
```

### 篩選表達式範例
```python
# 相等
client.get("account", filter="name eq 'Contoso'")

# 大於 / 小於
client.get("account", filter="creditlimit gt 50000")
client.get("account", filter="createdon lt 2024-01-01")

# 字串包含
client.get("account", filter="contains(name, 'Ltd')")

# AND/OR 作業
client.get("account", filter="(name eq 'Contoso') and (creditlimit gt 50000)")
client.get("account", filter="(industrycode eq 1) or (industrycode eq 2)")

# NOT 作業
client.get("account", filter="not(statecode eq 1)")
```

### 選取與展開
```python
# 選取特定資料行 (提高效能)
client.get("account", select=["name", "creditlimit", "telephone1"])

# 展開相關記錄
client.get(
    "account",
    expand=["parentaccountid($select=name)"],
    select=["name", "parentaccountid"]
)
```

---

## 11. 快取管理

### 清除快取
```python
# 在批次作業後清除 SDK 內部快取
client.flush_cache()

# 有用時機：
# - Metadata 變更 (資料表/資料行建立)
# - 批次刪除
# - Metadata 同步
```

---

## 12. 效能最佳實務

### 應做事項 ✅
1. **使用 `select` 參數**：只擷取所需資料行
   ```python
   client.get("account", select=["name", "creditlimit"])
   ```

2. **批次作業**：一次建立/更新多條記錄
   ```python
   ids = client.create("account", [record1, record2, record3])
   ```

3. **使用分頁**：不要一次載入所有記錄
   ```python
   for page in client.get("account", top=1000):
       process_page(page)
   ```

4. **重複使用客戶端實例**：建立一次，重複使用多次
   ```python
   client = DataverseClient(url, credential)  # Once
   # 在整個應用程式中重複使用
   ```

5. **在伺服器上應用篩選**：讓 Dataverse 在傳回之前進行篩選
   ```python
   client.get("account", filter="creditlimit gt 50000")
   ```

### 不應做事項 ❌
1. **不要擷取所有資料行**：指定您需要的資料行
   ```python
   # 慢
   client.get("account")
   ```

2. **不要在迴圈中建立記錄**：將它們批次處理
   ```python
   # 慢
   for record in records:
       client.create("account", record)
   ```

3. **不要一次載入所有結果**：使用分頁
   ```python
   # 慢
   all_accounts = list(client.get("account"))
   ```

4. **不要重複建立新的客戶端**：重複使用單一實例
   ```python
   # 低效率
   for i in range(100):
       client = DataverseClient(url, credential)
   ```

---

## 13. 常見模式摘要

### 模式：Upsert (建立或更新)
```python
def upsert_account(name, data):
    """建立帳戶或在存在時更新。"""
    try:
        # 嘗試尋找現有的
        results = list(client.get("account", filter=f"name eq '{name}'"))
        if results:
            account_id = results[0]['accountid']
            client.update("account", account_id, data)
            return account_id, "updated"
        else:
            ids = client.create("account", {"name": name, **data})
            return ids[0], "created"
    except Exception as e:
        print(f"Upsert 失敗：{e}")
        raise
```

### 模式：帶有錯誤復原的批次作業
```python
def create_with_recovery(records):
    """建立記錄並追蹤每條記錄的錯誤。"""
    results = {"success": [], "failed": []}
    
    try:
        ids = client.create("account", records)
        results["success"] = ids
    except Exception as e:
        # 如果批次失敗，則嘗試單獨的記錄
        for i, record in enumerate(records):
            try:
                ids = client.create("account", record)
                results["success"].append(ids[0])
            except Exception as e:
                results["failed"].append({"index": i, "record": record, "error": str(e)})
    
    return results
```

---

## 14. 相依套件與版本

### 核心相依套件
- **azure-identity** >= 1.17.0 (驗證)
- **azure-core** >= 1.30.2 (HTTP 客戶端)
- **requests** >= 2.32.0 (HTTP 請求)
- **Python** >= 3.10

### 可選相依套件
- **pandas** (資料處理)
- **reportlab** (用於檔案範例的 PDF 產生)

### 開發工具
- **pytest** >= 7.0.0 (測試)
- **black** >= 23.0.0 (程式碼格式化)
- **mypy** >= 1.0.0 (類型檢查)
- **ruff** >= 0.1.0 (語法檢查)

---

## 15. 常見問題疑難排解

### ImportError: 沒有名為 'PowerPlatform' 的模組
```bash
# 驗證安裝
pip show PowerPlatform-Dataverse-Client

# 重新安裝
pip install --upgrade PowerPlatform-Dataverse-Client

# 檢查虛擬環境是否已啟用
which python  # 應顯示虛擬環境路徑
```

### 驗證失敗
```python
# 驗證憑證是否具有 Dataverse 存取權
# 測試時先嘗試互動式驗證
from azure.identity import InteractiveBrowserCredential
credential = InteractiveBrowserCredential(
    tenant_id="your-tenant-id"  # 如果有多個租戶，請指定
)

# 檢查組織 URL 格式
# ✓ https://yourorg.crm.dynamics.com
# ❌ https://yourorg.crm.dynamics.com/
# ❌ https://yourorg.crm4.dynamics.com (區域性)
```

### HTTP 429 速率限制
```python
# 降低請求頻率
# 實施指數退避 (請參閱錯誤處理章節)
# 減少頁面大小
client.get("account", top=500)  # 而不是 5000
```

### MetadataError: 找不到資料表
```python
# 驗證資料表是否存在 (結構描述名稱在存在性方面不區分大小寫，但在 API 方面區分大小寫)
tables = client.list_tables()
print([t['table_schema_name'] for t in tables])

# 使用確切的結構描述名稱
table_info = client.get_table_info("new_customprefixed_table")
```

### SQL 查詢未啟用
```python
# query_sql() 需要組織配置
# 如果已禁用，則退回 OData
try:
    results = client.query_sql("SELECT * FROM account")
except Exception:
    # 退回 OData
    results = client.get("account")
```

---

## 參考連結
- [官方儲存庫](https://github.com/microsoft/PowerPlatform-DataverseClient-Python)
- [PyPI 套件](https://pypi.org/project/PowerPlatform-Dataverse-Client/)
- [Azure Identity 文件](https://learn.microsoft.com/zh-tw/python/api/overview/azure/identity-readme)
- [Dataverse Web API 文件](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/webapi/overview)
