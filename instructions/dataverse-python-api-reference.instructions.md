---
applyTo: '**'
---
# Dataverse SDK for Python — API 參考指南

## DataverseClient 類別
用於與 Dataverse 互動的主要客戶端。使用基礎 URL 和 Azure 憑證進行初始化。

### 主要函式

#### create(table_schema_name, records)
建立單一或批次記錄。傳回 GUID 列表。

```python
# Single record
ids = client.create("account", {"name": "Acme"})
print(ids[0])  # First GUID

# Bulk create
ids = client.create("account", [{"name": "Contoso"}, {"name": "Fabrikam"}])
```

#### get(table_schema_name, record_id=None, select, filter, orderby, top, expand, page_size)
擷取單一記錄或使用 OData 選項查詢多個記錄。

```python
# Single record
record = client.get("account", record_id="guid-here")

# Query with filter and paging
for batch in client.get(
    "account",
    filter="statecode eq 0",
    select=["name", "telephone1"],
    orderby=["createdon desc"],
    top=100,
    page_size=50
):
    for record in batch:
        print(record["name"])
```

#### update(table_schema_name, ids, changes)
更新單一或批次記錄。

```python
# Single update
client.update("account", "guid-here", {"telephone1": "555-0100"})

# Broadcast: apply same changes to many IDs
client.update("account", [id1, id2, id3], {"statecode": 1})

# Paired: one-to-one mapping
client.update("account", [id1, id2], [{"name": "A"}, {"name": "B"}])
```

#### delete(table_schema_name, ids, use_bulk_delete=True)
刪除單一或批次記錄。

```python
# Single delete
client.delete("account", "guid-here")

# Bulk delete (async)
job_id = client.delete("account", [id1, id2, id3])
```

#### create_table(table_schema_name, columns, solution_unique_name=None, primary_column_schema_name=None)
建立自訂資料表。

```python
from enum import IntEnum

class ItemStatus(IntEnum):
    ACTIVE = 1
    INACTIVE = 2
    __labels__ = {
        1033: {"ACTIVE": "Active", "INACTIVE": "Inactive"}
    }

info = client.create_table("new_MyTable", {
    "new_Title": "string",
    "new_Quantity": "int",
    "new_Price": "decimal",
    "new_Active": "bool",
    "new_Status": ItemStatus
})
print(info["entity_logical_name"])
```

#### create_columns(table_schema_name, columns)
將資料行新增至現有資料表。

```python
created = client.create_columns("new_MyTable", {
    "new_Notes": "string",
    "new_Count": "int"
})
```

#### delete_columns(table_schema_name, columns)
從資料表中移除資料行。

```python
removed = client.delete_columns("new_MyTable", ["new_Notes", "new_Count"])
```

#### delete_table(table_schema_name)
刪除自訂資料表 (不可逆)。

```python
client.delete_table("new_MyTable")
```

#### get_table_info(table_schema_name)
擷取資料表 Metadata。

```python
info = client.get_table_info("new_MyTable")
if info:
    print(info["table_logical_name"])
    print(info["entity_set_name"])
```

#### list_tables()
列出所有自訂資料表。

```python
tables = client.list_tables()
for table in tables:
    print(table)
```

#### flush_cache(kind)
清除 SDK 快取 (例如，下拉式清單標籤)。

```python
removed = client.flush_cache("picklist")
```

## DataverseConfig 類別
設定客戶端行為 (逾時、重試、語言)。

```python
from PowerPlatform.Dataverse.core.config import DataverseConfig

cfg = DataverseConfig()
cfg.http_retries = 3
cfg.http_backoff = 1.0
cfg.http_timeout = 30
cfg.language_code = 1033  # English

client = DataverseClient(base_url=url, credential=cred, config=cfg)
```

## 錯誤處理
擷取 `DataverseError` 以處理 SDK 特定的例外狀況。檢查 `is_transient` 以決定是否重試。

```python
from PowerPlatform.Dataverse.core.errors import DataverseError

try:
    client.create("account", {"name": "Test"})
except DataverseError as e:
    print(f"Code: {e.code}")
    print(f"Message: {e.message}")
    print(f"Transient: {e.is_transient}")
    print(f"Details: {e.to_dict()}")
```

## OData 篩選秘訣
- 在篩選表達式中使用確切的邏輯名稱 (小寫)
- `select` 中的資料行名稱會自動轉換為小寫
- `expand` 中的導覽屬性名稱區分大小寫

## 參考
- API 文件：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.client.dataverseclient
- 設定文件：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.core.config.dataverseconfig
- 錯誤：https://learn.microsoft.com/zh-tw/python/api/powerplatform-dataverse-client/powerplatform.dataverse.core.errors
