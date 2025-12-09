---
applyTo: '**'
---

# Dataverse SDK for Python — 錯誤處理與疑難排解指南

基於 Microsoft 官方 Azure SDK 錯誤處理模式和 Dataverse SDK 特定資訊。

## 1. DataverseError 類別概述

Dataverse SDK for Python 提供結構化的例外階層，以實現穩健的錯誤處理。

### DataverseError 建構函式

```python
from PowerPlatform.Dataverse.core.errors import DataverseError

DataverseError(
    message: str,                          # 人類可讀的錯誤訊息
    code: str,                             # 錯誤類別 (例如："validation_error"、"http_error")
    subcode: str | None = None,            # 可選的特定錯誤識別碼
    status_code: int | None = None,        # HTTP 狀態碼 (如果適用)
    details: Dict[str, Any] | None = None, # 額外的診斷資訊
    source: str | None = None,             # 錯誤來源："client" 或 "server"
    is_transient: bool = False             # 錯誤是否可能在重試時成功
)
```

### 主要屬性

```python
try:
    client.get("account", record_id="invalid-id")
except DataverseError as e:
    print(f"訊息：{e.message}")           # 人類可讀訊息
    print(f"程式碼：{e.code}")                 # 錯誤類別
    print(f"子程式碼：{e.subcode}")           # 特定錯誤類型
    print(f"狀態碼：{e.status_code}")   # HTTP 狀態 (401、403、429 等)
    print(f"來源：{e.source}")             # "client" 或 "server"
    print(f"是否暫時性：{e.is_transient}") # 可以重試嗎？
    print(f"詳細資訊：{e.details}")           # 額外上下文
    
    # 轉換為字典以進行記錄
    error_dict = e.to_dict()
```

---

## 2. 常見錯誤情境

### 驗證錯誤 (401)

**原因**：憑證無效、權杖過期或設定錯誤。

```python
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.errors import DataverseError
from azure.identity import InteractiveBrowserCredential

try:
    # 憑證錯誤或權杖過期
    credential = InteractiveBrowserCredential()
    client = DataverseClient(
        base_url="https://invalid-org.crm.dynamics.com",
        credential=credential
    )
    records = client.get("account")
except DataverseError as e:
    if e.status_code == 401:
        print("驗證失敗。請檢查憑證和權杖是否過期。")
        print(f"詳細資訊：{e.message}")
        # 不要重試 - 先修正憑證
    else:
        raise
```

### 授權錯誤 (403)

**原因**：使用者缺少所請求操作的權限。

```python
try:
    # 使用者沒有讀取連絡人的權限
    records = client.get("contact")
except DataverseError as e:
    if e.status_code == 403:
        print("存取被拒。使用者缺少所需的權限。")
        print(f"支援請求 ID：{e.details.get('request_id')}")
        # 上報給管理員
    else:
        raise
```

### 找不到資源 (404)

**原因**：記錄、資料表或資源不存在。

```python
try:
    # 記錄不存在
    record = client.get("account", record_id="00000000-0000-0000-0000-000000000000")
except DataverseError as e:
    if e.status_code == 404:
        print("找不到資源。正在使用預設資料。")
        record = {"name": "未知", "id": None}
    else:
        raise
```

### 速率限制 (429)

**原因**：請求次數過多，超出服務保護限制。

**注意**：SDK 內建的重試支援很少。請手動處理暫時性一致性問題。

```python
import time

def create_with_retry(client, table_name, payload, max_retries=3):
    """使用重試邏輯建立記錄以應對速率限制。"""
    for attempt in range(max_retries):
        try:
            result = client.create(table_name, payload)
            return result
        except DataverseError as e:
            if e.status_code == 429 and e.is_transient:
                wait_time = 2 ** attempt  # 指數退避
                print(f"速率限制。將在 {wait_time} 秒後重試...")
                time.sleep(wait_time)
            else:
                raise
    
    raise Exception(f"在 {max_retries} 次重試後失敗")
```

### 伺服器錯誤 (500、502、503、504)

**原因**：暫時性服務問題或基礎設施問題。

```python
try:
    result = client.create("account", {"name": "Acme"})
except DataverseError as e:
    if 500 <= e.status_code < 600:
        print(f"伺服器錯誤 ({e.status_code})。服務可能暫時不可用。")
        # 實作帶有指數退避的重試邏輯
    else:
        raise
```

### 驗證錯誤 (400)

**原因**：請求格式無效、缺少必要欄位或違反業務規則。

```python
try:
    # 缺少必要欄位或無效資料
    client.create("account", {"telephone1": "not-a-phone-number"})
except DataverseError as e:
    if e.status_code == 400:
        print(f"驗證錯誤：{e.message}")
        if e.details:
            print(f"詳細資訊：{e.details}")
        # 記錄驗證問題以進行偵錯
    else:
        raise
```

---

## 3. 錯誤處理最佳實務

### 使用特定例外狀況處理

總是在處理一般例外狀況之前捕捉特定例外狀況：

```python
from PowerPlatform.Dataverse.core.errors import DataverseError
from azure.core.exceptions import AzureError

try:
    records = client.get("account", filter="statecode eq 0", top=100)
except DataverseError as e:
    # 處理 Dataverse 特定錯誤
    if e.status_code == 401:
        print("需要重新驗證")
    elif e.status_code == 404:
        print("找不到資源")
    elif e.is_transient:
        print("暫時性錯誤 - 可以重試")
    else:
        print(f"操作失敗：{e.message}")
except AzureError as e:
    # 處理 Azure SDK 錯誤 (網路、驗證等)
    print(f"Azure 錯誤：{e}")
except Exception as e:
    # 捕捉所有意外錯誤
    print(f"意外錯誤：{e}")
```

### 實作智能重試邏輯

**不重試**：
- 401 Unauthorized (驗證失敗)
- 403 Forbidden (授權失敗)
- 400 Bad Request (用戶端錯誤)
- 404 Not Found (除非資源最終會出現)

**考慮重試**：
- 408 Request Timeout
- 429 Too Many Requests (帶有指數退避)
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- 504 Gateway Timeout

```python
def should_retry(error: DataverseError) -> bool:
    """判斷操作是否應該重試。"""
    if not error.is_transient:
        return False
    
    retryable_codes = {408, 429, 500, 502, 503, 504}
    return error.status_code in retryable_codes

def call_with_exponential_backoff(func, *args, max_attempts=3, **kwargs):
    """呼叫函式並帶有指數退避重試。"""
    for attempt in range(max_attempts):
        try:
            return func(*args, **kwargs)
        except DataverseError as e:
            if should_retry(e) and attempt < max_attempts - 1:
                wait_time = 2 ** attempt  # 1s、2s、4s...
                print(f"嘗試 {attempt + 1} 失敗。將在 {wait_time} 秒後重試...")
                time.sleep(wait_time)
            else:
                raise
```

### 提取有意義的錯誤資訊

```python
import json
from datetime import datetime

def log_error_for_support(error: DataverseError):
    """記錄帶有診斷資訊的錯誤。"""
    error_info = {
        "timestamp": datetime.utcnow().isoformat(),
        "error_type": type(error).__name__,
        "message": error.message,
        "code": error.code,
        "subcode": error.subcode,
        "status_code": error.status_code,
        "source": error.source,
        "is_transient": error.is_transient,
        "details": error.details
    }
    
    print(json.dumps(error_info, indent=2))
    
    # 儲存到日誌檔案或發送到監控服務
    return error_info
```

### 優雅地處理批次作業

```python
def bulk_create_with_error_tracking(client, table_name, payloads):
    """建立多個記錄，追蹤哪些成功/失敗。"""
    results = {
        "succeeded": [],
        "failed": []
    }
    
    for idx, payload in enumerate(payloads):
        try:
            record_ids = client.create(table_name, payload)
            results["succeeded"].append({
                "payload": payload,
                "ids": record_ids
            })
        except DataverseError as e:
            results["failed"].append({
                "index": idx,
                "payload": payload,
                "error": {
                    "message": e.message,
                    "code": e.code,
                    "status": e.status_code
                }
            })
    
    return results
```

---

## 4. 啟用診斷記錄

### 配置記錄

```python
import logging
import sys

# 設定根記錄器
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dataverse_sdk.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# 配置特定記錄器
logging.getLogger('azure').setLevel(logging.DEBUG)
logging.getLogger('PowerPlatform').setLevel(logging.DEBUG)

# HTTP 記錄 (注意敏感資料)
logging.getLogger('azure.core.pipeline.policies.http_logging_policy').setLevel(logging.DEBUG)
```

### 啟用 SDK 層級記錄

```python
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.config import DataverseConfig
from azure.identity import InteractiveBrowserCredential

cfg = DataverseConfig()
cfg.logging_enable = True  # 啟用詳細記錄

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=InteractiveBrowserCredential(),
    config=cfg
)

# 現在 SDK 將記錄詳細的 HTTP 請求/回應
records = client.get("account", top=10)
```

### 解析錯誤回應

```python
import json

try:
    client.create("account", invalid_payload)
except DataverseError as e:
    # 提取結構化的錯誤詳細資訊
    if e.details and isinstance(e.details, dict):
        error_code = e.details.get('error', {}).get('code')
        error_message = e.details.get('error', {}).get('message')
        
        print(f"錯誤程式碼：{error_code}")
        print(f"錯誤訊息：{error_message}")
        
        # 某些錯誤包含巢狀詳細資訊
        if 'error' in e.details and 'details' in e.details['error']:
            for detail in e.details['error']['details']:
                print(f"  - {detail.get('code')}：{detail.get('message')}")
```

---

## 5. Dataverse 特定錯誤處理

### 處理 OData 查詢錯誤

```python
try:
    # 無效的 OData 篩選條件
    records = client.get(
        "account",
        filter="invalid_column eq 0"
    )
except DataverseError as e:
    if "invalid column" in e.message.lower():
        print("檢查 OData 資料行名稱和語法")
    else:
        print(f"查詢錯誤：{e.message}")
```

### 處理檔案上傳錯誤

```python
try:
    client.upload_file(
        table_name="account",
        record_id=record_id,
        column_name="document_column",
        file_path="large_file.pdf"
    )
except DataverseError as e:
    if e.status_code == 413:
        print("檔案太大。請使用分塊上傳模式。")
    elif e.status_code == 400:
        print("無效的資料行或檔案格式。")
    else:
        raise
```

### 處理資料表 Metadata 作業

```python
try:
    # 建立自訂資料表
    table_def = {
        "SchemaName": "new_CustomTable",
        "DisplayName": "Custom Table"
    }
    client.create("EntityMetadata", table_def)
except DataverseError as e:
    if "already exists" in e.message:
        print("資料表已存在")
    elif "permission" in e.message.lower():
        print("建立資料表的權限不足")
    else:
        raise
```

---

## 6. 監控與警示

### 使用監控包裝用戶端呼叫

```python
from functools import wraps
import time

def monitor_operation(operation_name):
    """用於監控 SDK 操作的裝飾器。"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                print(f"✓ {operation_name} 在 {duration:.2f} 秒內完成")
                return result
            except DataverseError as e:
                duration = time.time() - start_time
                print(f"✗ {operation_name} 在 {duration:.2f} 秒後失敗")
                print(f"  錯誤：{e.code} ({e.status_code})：{e.message}")
                raise
        return wrapper
    return decorator

@monitor_operation("擷取帳戶")
def get_accounts(client):
    return client.get("account", top=100)

# 用法
try:
    accounts = get_accounts(client)
except DataverseError:
    print("操作失敗 - 請查看日誌以了解詳細資訊")
```

---

## 7. 常見疑難排解清單

| 問題 | 診斷 | 解決方案 |
|-------|-----------|----------|
| 401 未經授權 | 權杖過期或憑證錯誤 | 使用有效的憑證重新驗證 |
| 403 禁止存取 | 使用者缺少權限 | 向管理員請求存取權限 |
| 404 找不到 | 記錄/資料表不存在 | 驗證結構描述名稱和記錄 ID |
| 429 速率限制 | 請求過多 | 實作指數退避重試 |
| 500+ 伺服器錯誤 | 服務問題 | 使用指數退避重試；檢查狀態頁面 |
| 400 錯誤請求 | 無效請求格式 | 檢查 OData 語法、欄位名稱、必要欄位 |
| 網路逾時 | 連線問題 | 檢查網路，增加 DataverseConfig 中的逾時時間 |
| InvalidOperationException | 外掛程式/工作流程錯誤 | 檢查 Dataverse 中的外掛程式日誌 |

---

## 8. 記錄最佳實務

```python
import logging
import json
from datetime import datetime

class DataverseErrorHandler:
    """集中式錯誤處理和記錄。"""
    
    def __init__(self, log_file="dataverse_errors.log"):
        self.logger = logging.getLogger("DataverseSDK")
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.ERROR)
    
    def log_error(self, error: DataverseError, context: str = ""):
        """記錄帶有上下文的錯誤以進行偵錯。"""
        error_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "context": context,
            "error": error.to_dict()
        }
        
        self.logger.error(json.dumps(error_record, indent=2))
    
    def is_retryable(self, error: DataverseError) -> bool:
        """檢查錯誤是否可以重試。"""
        return error.is_transient and error.status_code in {408, 429, 500, 502, 503, 504}

# 用法
error_handler = DataverseErrorHandler()

try:
    client.create("account", payload)
except DataverseError as e:
    error_handler.log_error(e, "create_account_batch_1")
    if error_handler.is_retryable(e):
        print("將重試此操作")
    else:
        print("操作永久失敗")
```

---

## 9. 另請參閱

- [DataverseError API 參考](https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.core.errors.dataverseerror)
- [Azure SDK 錯誤處理](https://learn.microsoft.com/zh-tw/azure/developer/python/sdk/fundamentals/errors)
- [Dataverse SDK 入門](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/get-started)
- [服務保護 API 限制](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/optimize-performance-create-update)
