---
applyTo: '**'
---

# Dataverse SDK for Python — 效能與最佳化指南

基於 Microsoft Dataverse 和 Azure SDK 官方效能指導。

## 1. 效能概觀

Dataverse SDK for Python 針對 Python 開發人員進行了最佳化，但在預覽版中存在一些限制：
- **最小重試策略**：預設僅重試網路錯誤
- **無 DeleteMultiple**：改用單獨刪除或更新狀態
- **有限的 OData 批次處理**：不支援通用 OData 批次處理
- **SQL 限制**：無 JOIN，WHERE/TOP/ORDER BY 限制

解決方法和最佳化策略解決了這些限制。

---

## 2. 查詢最佳化

### 使用 Select 限制資料行

```python
# ❌ 慢 - 擷取所有資料行
accounts = client.get("account", top=100)

# ✅ 快 - 僅擷取所需資料行
accounts = client.get(
    "account",
    select=["accountid", "name", "telephone1", "creditlimit"],
    top=100
)
```

**影響**：減少有效負載大小和記憶體使用量 30-50%。

---

### 高效率地使用篩選

```python
# ❌ 慢 - 擷取所有，然後在 Python 中篩選
all_accounts = client.get("account")
active_accounts = [a for a in all_accounts if a.get("statecode") == 0]

# ✅ 快 - 伺服器端篩選
accounts = client.get(
    "account",
    filter="statecode eq 0",
    top=100
)
```

**OData 篩選範例**：
```python
# 等於
filter="statecode eq 0"

# 字串包含
filter="contains(name, 'Acme')"

# 多個條件
filter="statecode eq 0 and createdon gt 2025-01-01Z"

# 不等於
filter="statecode ne 2"
```

---

### 依據排序進行可預測的分頁

```python
# 確保分頁的一致順序
accounts = client.get(
    "account",
    orderby=["createdon desc", "name asc"],
    page_size=100
)

for page in accounts:
    process_page(page)
```

---

## 3. 分頁最佳實務

### 惰性分頁 (推薦)

```python
# ✅ 最佳 - 生成器一次產生一頁
pages = client.get(
    "account",
    top=5000,              # 總限制
    page_size=200          # 每頁大小 (提示)
)

for page in pages:  # 每次迭代擷取一頁
    for record in page:
        process_record(record)  # 立即處理
```

**優點**：
- 記憶體效率高 (按需載入頁面)
- 快速的首頁結果時間
- 可根據需要提早停止

### 避免將所有內容載入記憶體

```python
# ❌ 慢 - 一次載入所有 100,000 條記錄
all_records = list(client.get("account", top=100000))
process(all_records)

# ✅ 快 - 邊處理邊前進
for page in client.get("account", top=100000, page_size=5000):
    process(page)
```

---

## 4. 批次作業

### 批次建立 (推薦)

```python
# ✅ 最佳 - 單一呼叫與多個記錄
payloads = [
    {"name": f"帳戶 {i}", "telephone1": f"555-{i:04d}"}
    for i in range(1000)
]
ids = client.create("account", payloads)  # 一次 API 呼叫，針對許多記錄
```

### 批次更新 - 廣播模式

```python
# ✅ 快 - 相同的更新應用於多個記錄
account_ids = ["id1", "id2", "id3", "..."]
client.update("account", account_ids, {"statecode": 1})  # 一次呼叫
```

### 批次更新 - 逐記錄模式

```python
# ✅ 可接受 - 每個記錄的不同更新
account_ids = ["id1", "id2", "id3"]
updates = [
    {"telephone1": "555-0100"},
    {"telephone1": "555-0200"},
    {"telephone1": "555-0300"},
]
client.update("account", account_ids, updates)
```

### 批次大小調整

根據資料表複雜度 (依 Microsoft 指導)：

| 資料表類型 | 批次大小 | 最大執行緒 |
|------------|-----------|-------------|
| OOB (帳戶、連絡人、潛在客戶) | 200-300 | 30 |
| 簡單 (少量查詢) | ≤10 | 50 |
| 中等複雜 | ≤100 | 30 |
| 大型/複雜 (超過 100 個資料行，超過 20 個查詢) | 10-20 | 10-20 |

```python
def bulk_create_optimized(client, table_name, payloads, batch_size=200):
    """以最佳批次大小建立記錄。"""
    for i in range(0, len(payloads), batch_size):
        batch = payloads[i:i + batch_size]
        ids = client.create(table_name, batch)
        print(f"已建立 {len(ids)} 條記錄")
        yield ids
```

---

## 5. 連線管理

### 重複使用用戶端實例

```python
# ❌ 不好 - 每次都建立新的連線
def process_batch():
    for batch in batches:
        client = DataverseClient(...)  # 成本高昂！
        client.create("account", batch)

# ✅ 好 - 重複使用連線
client = DataverseClient(...)  # 建立一次

def process_batch():
    for batch in batches:
        client.create("account", batch)  # 重複使用
```

### 全域客戶端實例

```python
# singleton_client.py
from azure.identity import DefaultAzureCredential
from PowerPlatform.Dataverse.client import DataverseClient

_client = None

def get_client():
    global _client
    if _client is None:
        _client = DataverseClient(
            base_url="https://myorg.crm.dynamics.com",
            credential=DefaultAzureCredential()
        )
    return _client

# main.py
from singleton_client import get_client

client = get_client()
records = client.get("account")
```

### 連線逾時設定

```python
from PowerPlatform.Dataverse.core.config import DataverseConfig

cfg = DataverseConfig()
cfg.http_timeout = 30         # 請求逾時
cfg.connection_timeout = 5    # 連線逾時

client = DataverseClient(
    base_url="https://myorg.crm.dynamics.com",
    credential=credential,
    config=cfg
)
```

---

## 6. 非同步作業 (未來功能)

目前是同步的，但要為非同步做準備：

```python
# 推薦的未來非同步支援模式
import asyncio

async def get_accounts_async(client):
    """未來非同步 SDK 的模式。"""
    # 當 SDK 支援非同步時：
    # accounts = await client.get("account")
    # 目前，請使用執行器進行同步
    loop = asyncio.get_event_loop()
    accounts = await loop.run_in_executor(
        None, 
        lambda: list(client.get("account"))
    )
    return accounts

# 用法
accounts = asyncio.run(get_accounts_async(client))
```

---

## 7. 檔案上傳最佳化

### 小檔案 (<128 MB)

```python
# ✅ 快 - 單一請求
client.upload_file(
    table_name="account",
    record_id=record_id,
    column_name="document_column",
    file_path="small_file.pdf"
)
```

### 大檔案 (>128 MB)

```python
# ✅ 最佳化 - 分塊上傳
client.upload_file(
    table_name="account",
    record_id=record_id,
    column_name="document_column",
    file_path="large_file.pdf",
    mode='chunk',
    if_none_match=True
)

# SDK 自動：
# 1. 將檔案分割為 4MB 分塊
# 2. 並行上傳分塊
# 3. 在伺服器端組裝
```

---

## 8. OData 查詢最佳化

### SQL 替代方案 (簡單查詢)

```python
# ✅ 有時更快 - 僅用於 SELECT 的直接 SQL
# 支援有限：單一 SELECT，可選的 WHERE/TOP/ORDER BY
records = client.get(
    "account",
    sql="SELECT accountid, name FROM account WHERE statecode = 0 ORDER BY name"
)
```

### 複雜查詢

```python
# ❌ 不支援 - JOIN、複雜的 WHERE
sql="SELECT a.accountid, c.fullname FROM account a JOIN contact c ON a.accountid = c.parentcustomerid"

# ✅ 權宜之計 - 取得帳戶，然後取得每個帳戶的連絡人
accounts = client.get("account", select=["accountid", "name"])
for account in accounts:
    contacts = client.get(
        "contact",
        filter=f"parentcustomerid eq '{account['accountid']}'"
    )
    process(account, contacts)
```

---

## 9. 記憶體管理

### 增量處理大型資料集

```python
import gc

def process_large_table(client, table_name):
    """處理數百萬條記錄而不會出現記憶體問題。"""
    
    for page in client.get(table_name, page_size=5000):
        for record in page:
            result = process_record(record)
            save_result(result)
        
        # 強制在頁面之間進行垃圾回收
        gc.collect()
```

### 帶有分塊的 DataFrame 整合

```python
import pandas as pd

def load_to_dataframe_chunked(client, table_name, chunk_size=10000):
    """以分塊方式將資料載入 DataFrame。"""
    
    dfs = []
    for page in client.get(table_name, page_size=1000):
        df_chunk = pd.DataFrame(page)
        dfs.append(df_chunk)
        
        # 當達到分塊閾值時合併
        if len(dfs) >= chunk_size // 1000:
            df = pd.concat(dfs, ignore_index=True)
            process_chunk(df)
            dfs = []
    
    # 處理剩餘的
    if dfs:
        df = pd.concat(dfs, ignore_index=True)
        process_chunk(df)
```

---

## 10. 速率限制處理

SDK 的重試支援很少 - 請手動實作：

```python
import time
from PowerPlatform.Dataverse.core.errors import DataverseError

def call_with_backoff(func, max_retries=3):
    """帶有指數退避的函式呼叫，用於速率限制。"""
    
    for attempt in range(max_retries):
        try:
            return func()
        except DataverseError as e:
            if e.status_code == 429:  # 請求過多
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # 1s、2s、4s
                    print(f"速率限制。等待 {wait_time} 秒...")
                    time.sleep(wait_time)
                else:
                    raise
            else:
                raise

# 用法
ids = call_with_backoff(
    lambda: client.create("account", payload)
)
```

---

## 11. 交易一致性 (已知限制)

SDK 不提供交易保證：

```python
# ⚠️ 如果批次作業部分失敗，某些記錄可能會被建立

def create_with_consistency_check(client, table_name, payloads):
    """建立記錄並驗證所有都成功。"""
    
    try:
        ids = client.create(table_name, payloads)
        
        # 驗證所有記錄是否已建立
        created = client.get(
            table_name,
            filter=f"isof(Microsoft.Dynamics.CRM.{table_name})"
        )
        
        if len(ids) != count_created:
            print(f"⚠️ 僅建立 {count_created}/{len(ids)} 條記錄")
            # 處理部分失敗
    except Exception as e:
        print(f"建立失敗：{e}")
        # 檢查建立的內容
```

---

## 12. 監控效能

### 記錄操作持續時間

```python
import time
import logging

logger = logging.getLogger("dataverse")

def monitored_operation(operation_name):
    """用於監控操作效能的裝飾器。"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start
                logger.info(f"{operation_name}：{duration:.2f} 秒")
                return result
            except Exception as e:
                duration = time.time() - start
                logger.error(f"{operation_name} 在 {duration:.2f} 秒後失敗：{e}")
                raise
        return wrapper
    return decorator

@monitored_operation("批次建立帳戶")
def create_accounts(client, payloads):
    return client.create("account", payloads)
```

---

## 13. 效能檢查清單

| 項目 | 狀態 | 備註 |
|------|--------|-------|
| 重複使用客戶端實例 | ☐ | 建立一次，重複使用 |
| 使用 select 限制資料行 | ☐ | 僅擷取所需資料 |
| 使用 OData 在伺服器端篩選 | ☐ | 不要擷取所有資料再篩選 |
| 使用分頁並設定 page_size | ☐ | 增量處理 |
| 批次作業 | ☐ | 使用建立/更新進行多個操作 |
| 根據資料表類型調整批次大小 | ☐ | OOB=200-300，簡單=≤10 |
| 處理速率限制 (429) | ☐ | 實作指數退避 |
| 大檔案使用分塊上傳 | ☐ | SDK 處理 >128MB 的檔案 |
| 監控操作持續時間 | ☐ | 記錄時間以進行分析 |
| 使用類似生產環境的資料進行測試 | ☐ | 效能會因資料量而異 |

---

## 14. 另請參閱

- [Dataverse Web API 效能](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/optimize-performance-create-update)
- [OData 查詢選項](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/webapi/query-data-web-api)
- [SDK 處理資料](https://learn.microsoft.com/zh-tw/power-apps/developer/data-platform/sdk-python/work-data)
