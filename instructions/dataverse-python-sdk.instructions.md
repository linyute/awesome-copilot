---
applyTo: '**'
---
# Dataverse SDK for Python — 官方快速入門

本說明總結了 Microsoft Learn 關於 Dataverse SDK for Python (預覽) 的指南，並提供了可複製的程式碼片段。

## 必要條件
- 具有讀寫權限的 Dataverse 環境
- Python 3.10+
- 可存取 PyPI 的網路

## 安裝
```bash
pip install PowerPlatform-Dataverse-Client
```

## 連線
```python
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient
from PowerPlatform.Dataverse.core.config import DataverseConfig

cfg = DataverseConfig()  # defaults to language_code=1033
client = DataverseClient(
    base_url="https://<myorg>.crm.dynamics.com",
    credential=InteractiveBrowserCredential(),
    config=cfg,
)
```
- 可選的 HTTP 設定：`cfg.http_retries`、`cfg.http_backoff`、`cfg.http_timeout`。

## CRUD 範例
```python
# Create 傳回 GUID 的 list[str]
account_id = client.create("account", {"name": "Acme, Inc.", "telephone1": "555-0100"})[0]

# 擷取單一記錄
account = client.get("account", account_id)

# 更新 (傳回 None)
client.update("account", account_id, {"telephone1": "555-0199"})

# 刪除
client.delete("account", account_id)
```

## 批次作業
```python
# 將 patch 廣播到多個 ID
ids = client.create("account", [{"name": "Contoso"}, {"name": "Fabrikam"}])
client.update("account", ids, {"telephone1": "555-0200"})

# 1:1 patch 清單
client.update("account", ids, [{"telephone1": "555-1200"}, {"telephone1": "555-1300"}])

# 批次建立
payloads = [{"name": "Contoso"}, {"name": "Fabrikam"}, {"name": "Northwind"}]
ids = client.create("account", payloads)
```

## 檔案上傳
```python
client.upload_file('account', record_id, 'sample_filecolumn', 'test.pdf')
client.upload_file('account', record_id, 'sample_filecolumn', 'test.pdf', mode='chunk', if_none_match=True)
```

## 分頁擷取多個
```python
pages = client.get(
    "account",
    select=["accountid", "name", "createdon"],
    orderby=["name asc"],
    top=10,
    page_size=3,
)
for page in pages:
    print(len(page), page[:2])
```

## 資料表 Metadata 快速入門
```python
info = client.create_table("SampleItem", {
    "code": "string",
    "count": "int",
    "amount": "decimal",
    "when": "datetime",
    "active": "bool",
})
logical = info["entity_logical_name"]
rec_id = client.create(logical, {f"{logical}name": "Sample A"})[0]
client.delete(logical, rec_id)
client.delete_table("SampleItem")
```

## 參考
- 開始使用：https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/get-started
- 處理資料：https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/work-data
- SDK 原始碼/範例：https://github.com/microsoft/PowerPlatform-DataverseClient-Python
