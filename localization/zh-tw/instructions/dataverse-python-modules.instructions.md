---
applyTo: '**'
---
# Dataverse SDK for Python — 完整模組參考

## 套件階層

```
PowerPlatform.Dataverse
├── client
│   └── DataverseClient
├── core
│   ├── config (DataverseConfig)
│   └── errors (DataverseError, ValidationError, MetadataError, HttpError, SQLParseError)
├── data (OData operations, metadata, SQL, file upload)
├── extensions (未來擴充功能的預留位置)
├── models (資料模型和型別的預留位置)
└── utils (公用程式和轉接器的預留位置)
```

## core.config 模組

管理客戶端連線和行為設定。

### DataverseConfig 類別

語言、逾時、重試的容器。不可變更。

```python
from PowerPlatform.Dataverse.core.config import DataverseConfig

cfg = DataverseConfig(
    language_code=1033,        # 預設英文 (美國)
    http_retries=None,         # 保留供未來使用
    http_backoff=None,         # 保留供未來使用
    http_timeout=None          # 保留供未來使用
)

# 或者使用預設靜態建構器
cfg_default = DataverseConfig.from_env()
```

**主要屬性：**
- `language_code: int = 1033` — 用於本地化標籤和訊息的 LCID。
- `http_retries: int | None` — (保留) 暫時性錯誤的最大重試次數。
- `http_backoff: float | None` — (保留) 重試之間的退避乘數。
- `http_timeout: float | None` — (保留) 請求逾時 (秒)。

## core.errors 模組

SDK 作業的結構化例外階層。

### DataverseError (基礎)

SDK 錯誤的基礎例外狀況。

```python
from PowerPlatform.Dataverse.core.errors import DataverseError

try:
    # SDK 呼叫
    pass
except DataverseError as e:
    print(f"程式碼：{e.code}")                # 錯誤類別
    print(f"子程式碼：{e.subcode}")          # 特定錯誤
    print(f"訊息：{e.message}")          # 人類可讀
    print(f"狀態：{e.status_code}")       # HTTP 狀態 (如果適用)
    print(f"暫時性：{e.is_transient}")   # 值得重試嗎？
    details = e.to_dict()                  # 轉換為字典
```

### ValidationError

資料作業期間的驗證失敗。

```python
from PowerPlatform.Dataverse.core.errors import ValidationError
```

### MetadataError

資料表/資料行建立、刪除或檢查失敗。

```python
from PowerPlatform.Dataverse.core.errors import MetadataError

try:
    client.create_table("MyTable", {...})
except MetadataError as e:
    print(f"Metadata 問題：{e.message}")
```

### HttpError

Web API HTTP 請求失敗 (4xx、5xx 等)。

```python
from PowerPlatform.Dataverse.core.errors import HttpError

try:
    client.get("account", record_id)
except HttpError as e:
    print(f"HTTP {e.status_code}：{e.message}")
    print(f"服務錯誤程式碼：{e.service_error_code}")
    print(f"關聯 ID：{e.correlation_id}")
    print(f"請求 ID：{e.request_id}")
    print(f"重試後：{e.retry_after} 秒")
    print(f"暫時性 (重試？)：{e.is_transient}")  # 429、503、504
```

### SQLParseError

使用 `query_sql()` 時的 SQL 查詢語法錯誤。

```python
from PowerPlatform.Dataverse.core.errors import SQLParseError

try:
    client.query_sql("INVALID SQL HERE")
except SQLParseError as e:
    print(f"SQL 解析錯誤：{e.message}")
```

## data 套件

低階 OData 協定、Metadata、SQL 和檔案作業 (內部委派)。

`data` 套件主要供內部使用；`client` 模組中的高階 `DataverseClient` 包裝並公開了：
- 透過 OData 進行 CRUD 作業
- Metadata 管理 (建立/更新/刪除資料表和資料行)
- SQL 查詢執行
- 檔案上傳處理

使用者透過 `DataverseClient` 函式 (例如 `create()`、`get()`、`update()`、`delete()`、`create_table()`、`query_sql()`、`upload_file()`) 與這些互動。

## extensions 套件 (預留位置)

保留用於未來擴充點 (例如，自訂轉接器、中介軟體)。

目前為空；請使用核心和客戶端模組以實現目前功能。

## models 套件 (預留位置)

保留用於未來資料模型定義和類型定義。

目前為空。資料結構以 `dict` (OData) 形式傳回，並可進行 JSON 序列化。

## utils 套件 (預留位置)

保留用於公用程式轉接器和協助函式。

目前為空。未來版本可能會新增協助函式。

## client 模組

主要使用者介面 API。

### DataverseClient 類別

所有 Dataverse 作業的高階客戶端。

```python
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.config import DataverseConfig

# 建立憑證
credential = InteractiveBrowserCredential()

# 可選配置
cfg = DataverseConfig(language_code=1033)

# 建立客戶端
client = DataverseClient(
    base_url="https://org.crm.dynamics.com",
    credential=credential,
    config=cfg  # 可選
)
```

#### CRUD 函式

- `create(table_schema_name, records)` → `list[str]` — 建立記錄，傳回 GUID。
- `get(table_schema_name, record_id=None, select, filter, orderby, top, expand, page_size)` → 記錄。
- `update(table_schema_name, ids, changes)` → `None` — 更新記錄。
- `delete(table_schema_name, ids, use_bulk_delete=True)` → `str | None` — 刪除記錄。

#### Metadata 函式

- `create_table(table_schema_name, columns, solution_unique_name, primary_column_schema_name)` → Metadata 字典。
- `create_columns(table_schema_name, columns)` → `list[str]`。
- `delete_columns(table_schema_name, columns)` → `list[str]`。
- `delete_table(table_schema_name)` → `None`。
- `get_table_info(table_schema_name)` → Metadata 字典或 `None`。
- `list_tables()` → `list[str]`。

#### SQL 與公用程式

- `query_sql(sql)` → `list[dict]` — 執行唯讀 SQL。
- `upload_file(table_schema_name, record_id, file_name_attribute, path, mode, mime_type, if_none_match)` → `None` — 上傳到檔案資料行。
- `flush_cache(kind)` → `int` — 清除 SDK 快取 (例如，`"picklist"`)。

## 匯入摘要

```python
# 主要客戶端
from PowerPlatform.Dataverse.client import DataverseClient

# 配置
from PowerPlatform.Dataverse.core.config import DataverseConfig

# 錯誤
from PowerPlatform.Dataverse.core.errors import (
    DataverseError,
    ValidationError,
    MetadataError,
    HttpError,
    SQLParseError,
)
```

## 參考

- 模組文件：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/
- 核心：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.core
- 資料：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.data
- 擴充功能：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.extensions
- 模型：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.models
- 公用程式：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.utils
- 客戶端：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.client
