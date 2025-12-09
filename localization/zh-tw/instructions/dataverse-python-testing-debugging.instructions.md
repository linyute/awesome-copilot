--- 
applyTo: '**' 
--- 

# Dataverse SDK for Python — 測試與偵錯策略

基於 Azure Functions 官方和 pytest 測試模式。

## 1. 測試概觀

### Dataverse SDK 的測試金字塔

```
         整合測試  <- 使用真實 Dataverse 進行測試
              /\ 
             /  \ 
            /單元測試 (模擬) \ 
           /____________________\ 
          < 框架測試 
```

---

## 2. 使用模擬進行單元測試

### 設定測試環境

```bash
# 安裝測試相依性
pip install pytest pytest-cov unittest-mock
```

### 模擬 DataverseClient

```python
# tests/test_operations.py
import pytest
from unittest.mock import Mock, patch, MagicMock
from PowerPlatform.Dataverse.client import DataverseClient

@pytest.fixture
def mock_client():
    """提供模擬的 DataverseClient。"""
    client = Mock(spec=DataverseClient)
    return client

def test_create_account(mock_client):
    """測試使用模擬客戶端建立帳戶。"""
    
    # 設定模擬回應
    mock_client.create.return_value = ["id-123"]
    
    # 呼叫函式
    from my_app import create_account
    result = create_account(mock_client, {"name": "Acme"})
    
    # 驗證
    assert result == "id-123"
    mock_client.create.assert_called_once_with("account", {"name": "Acme"})

def test_create_account_error(mock_client):
    """測試帳戶建立中的錯誤處理。"""
    from PowerPlatform.Dataverse.core.errors import DataverseError
    
    # 設定模擬以引發錯誤
    mock_client.create.side_effect = DataverseError(
        message="帳戶已存在",
        code="validation_error",
        status_code=400
    )
    
    # 驗證是否引發錯誤
    from my_app import create_account
    with pytest.raises(DataverseError):
        create_account(mock_client, {"name": "Acme"})
```

### 測試資料結構

```python
# tests/fixtures.py
import pytest

@pytest.fixture
def sample_account():
    """用於測試的範例帳戶記錄。"""
    return {
        "accountid": "id-123",
        "name": "Acme Inc",
        "telephone1": "555-0100",
        "statecode": 0,
        "createdon": "2025-01-01T00:00:00Z"
    }

@pytest.fixture
def sample_accounts(sample_account):
    """多個範例帳戶。"""
    return [
        sample_account,
        {**sample_account, "accountid": "id-124", "name": "Fabrikam"},
        {**sample_account, "accountid": "id-125", "name": "Contoso"},
    ]

# 在測試中使用
def test_process_accounts(mock_client, sample_accounts):
    mock_client.get.return_value = iter([sample_accounts])
    # 測試處理
```

---

## 3. 模擬常見模式

### 模擬帶有分頁的取得

```python
def test_pagination(mock_client, sample_accounts):
    """測試處理分頁結果。"""
    
    # 模擬傳回帶有頁面的生成器
    mock_client.get.return_value = iter([
        sample_accounts[:2],  # 第 1 頁
        sample_accounts[2:]   # 第 2 頁
    ])
    
    from my_app import process_all_accounts
    result = process_all_accounts(mock_client)
    
    assert len(result) == 3  # 所有頁面已處理
```

### 模擬批次作業

```python
def test_bulk_create(mock_client):
    """測試批次帳戶建立。"""
    
    payloads = [
        {"name": "帳戶 1"},
        {"name": "帳戶 2"},
    ]
    
    # 模擬傳回 ID 清單
    mock_client.create.return_value = ["id-1", "id-2"]
    
    from my_app import create_accounts
    ids = create_accounts(mock_client, payloads)
    
    assert len(ids) == 2
    mock_client.create.assert_called_once_with("account", payloads)
```

### 模擬錯誤

```python
def test_rate_limiting_retry(mock_client):
    """測試速率限制的重試邏輯。"""
    from PowerPlatform.Dataverse.core.errors import DataverseError
    
    # 模擬先失敗後成功
    error = DataverseError(
        message="請求過多",
        code="http_error",
        status_code=429,
        is_transient=True
    )
    mock_client.create.side_effect = [error, ["id-123"]]
    
    from my_app import create_with_retry
    result = create_with_retry(mock_client, "account", {{}})
    
    assert result == "id-123"
    assert mock_client.create.call_count == 2  # 已重試
```

---

## 4. 整合測試

### 本機開發測試

```python
# tests/test_integration.py
import pytest
from azure.identity import InteractiveBrowserCredential
from PowerPlatform.Dataverse.client import DataverseClient

@pytest.fixture
def dataverse_client():
    """用於整合測試的真實客戶端。"""
    client = DataverseClient(
        base_url="https://myorg-dev.crm.dynamics.com",
        credential=InteractiveBrowserCredential()
    )
    return client

@pytest.mark.integration
def test_create_and_retrieve_account(dataverse_client):
    """測試建立和擷取帳戶 (對真實 Dataverse 執行)。"""
    
    # 建立
    account_id = dataverse_client.create("account", {{
        "name": "測試帳戶"
    }})[0]
    
    # 擷取
    account = dataverse_client.get("account", account_id)
    
    # 驗證
    assert account["name"] == "測試帳戶"
    
    # 清理
    dataverse_client.delete("account", account_id)
```

### 測試隔離

```python
# tests/conftest.py
import pytest

@pytest.fixture(scope="function")
def test_account(dataverse_client):
    """建立測試帳戶，測試後清理。"""
    
    account_id = dataverse_client.create("account", {{
        "name": "測試帳戶"
    }})[0]
    
    yield account_id
    
    # 清理
    try:
        dataverse_client.delete("account", account_id)
    except:
        pass  # 已刪除

# 用法
def test_update_account(dataverse_client, test_account):
    """測試更新帳戶。"""
    dataverse_client.update("account", test_account, {"telephone1": "555-0100"})
    
    account = dataverse_client.get("account", test_account)
    assert account["telephone1"] == "555-0100"
```

---

## 5. Pytest 設定

### pytest.ini

```ini
[pytest]
# 預設跳過整合測試
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

markers =
    integration: 將測試標記為整合測試 (使用 -m integration 執行)
    slow: 將測試標記為慢速
    unit: 將測試標記為單元測試
```

### 執行測試

```bash
# 僅限單元測試
pytest

# 單元 + 整合
pytest -m "unit or integration"

# 僅限整合
pytest -m integration

# 帶有覆蓋率
pytest --cov=my_app tests/

# 特定測試
pytest tests/test_operations.py::test_create_account
```

---

## 6. 覆蓋率分析

### 產生覆蓋率報告

```bash
# 執行帶有覆蓋率的測試
pytest --cov=my_app --cov-report=html tests/

# 查看覆蓋率
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
```

### 覆蓋率設定 (.coveragerc)

```ini
[run]
branch = True
source = my_app

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:

[html]
directory = htmlcov
```

---

## 7. 使用 print/logging 進行偵錯

### 啟用偵錯記錄

```python
import logging
import sys

# 設定記錄
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('debug.log')
    ]
)

# 啟用 SDK 記錄
logging.getLogger('PowerPlatform').setLevel(logging.DEBUG)
logging.getLogger('azure').setLevel(logging.DEBUG)

# 在測試中
def test_with_logging(mock_client):
    logger = logging.getLogger(__name__)
    logger.debug("開始測試")
    
    result = my_function(mock_client)
    
    logger.debug(f"結果：{result}")
```

### Pytest 擷取輸出

```bash
# 在測試中顯示 print/logging 輸出
pytest -s tests/

# 僅在失敗時擷取並顯示
pytest --tb=short tests/
```

---

## 8. 效能測試

### 測量操作持續時間

```python
import pytest
import time

def test_bulk_create_performance(dataverse_client):
    """測試批次建立效能。"""
    
    payloads = [{"name": f"帳戶 {i}"} for i in range(1000)]
    
    start = time.time()
    ids = dataverse_client.create("account", payloads)
    duration = time.time() - start
    
    assert len(ids) == 1000
    assert duration < 10  # 應在 10 秒內完成
    
    print(f"在 {duration:.2f} 秒內建立 1000 條記錄 ({1000/duration:.0f} 條記錄/秒)")
```

### Pytest Benchmark 外掛程式

```bash
pip install pytest-benchmark
```

```python
def test_query_performance(benchmark, dataverse_client):
    """基準測試查詢效能。"""
    
    def get_accounts():
        return list(dataverse_client.get("account", top=100))
    
    result = benchmark(get_accounts)
    assert len(result) <= 100
```

---

## 9. 常見測試模式

### 測試重試邏輯

```python
def test_retry_on_transient_error(mock_client):
    """測試暫時性錯誤的重試。"""
    from PowerPlatform.Dataverse.core.errors import DataverseError
    
    error = DataverseError(
        message="逾時",
        code="http_error",
        status_code=408,
        is_transient=True
    )
    
    # 先失敗後成功
    mock_client.create.side_effect = [error, ["id-123"]]
    
    from my_app import create_with_retry
    result = create_with_retry(mock_client, "account", {{}})
    
    assert result == "id-123"
```

### 測試篩選條件建立

```python
def test_filter_builder():
    """測試 OData 篩選條件生成。"""
    from my_app import build_account_filter
    
    # 測試案例
    assert build_account_filter(status="active") == "statecode eq 0"
    assert build_account_filter(name="Acme") == "contains(name, 'Acme')"
    assert build_account_filter(status="active", name="Acme") \
        == "statecode eq 0 and contains(name, 'Acme')"
```

### 測試錯誤處理

```python
def test_handles_missing_record(mock_client):
    """測試處理 404 錯誤。"""
    from PowerPlatform.Dataverse.core.errors import DataverseError
    
    mock_client.get.side_effect = DataverseError(
        message="找不到",
        code="http_error",
        status_code=404
    )
    
    from my_app import get_account_safe
    result = get_account_safe(mock_client, "invalid-id")
    
    assert result is None  # 傳回 None 而不是引發錯誤
```

---

## 10. 偵錯檢查清單

| 問題 | 偵錯步驟 |
|-------|-------------|
| 測試意外失敗 | 新增 `-s` 旗標以查看列印輸出 |
| 模擬未呼叫 | 檢查函式名稱/參數是否完全匹配 |
| 真實 API 失敗 | 檢查憑證、URL、權限 |
| 測試中的速率限制 | 新增延遲或使用較小的批次 |
| 找不到資料 | 驗證記錄是否已建立且未被清理 |
| 斷言錯誤 | 列印實際值與預期值 |

---

## 11. 另請參閱

- [Pytest 文件](https://docs.pytest.org/)
- [unittest.mock 參考](https://docs.python.org/3/library/unittest.mock.html)
- [Azure Functions 測試](https://learn.microsoft.com/zh-tw/azure/azure-functions/functions-reference-python#unit-testing)
- [Dataverse SDK 範例](https://github.com/microsoft/PowerPlatform-DataverseClient-Python/tree/main/examples)
