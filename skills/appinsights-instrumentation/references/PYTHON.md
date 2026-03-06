## 修改程式碼

對應用程式進行下列必要的變更。

- 安裝用戶端函式庫
```
pip install azure-monitor-opentelemetry
```

- 設定應用程式以使用 Azure Monitor
Python 應用程式透過 Python 標準函式庫中的 logger 類別傳送遙測。建立一個模組來設定並建立可傳送遙測的 logger。

```python
import logging
from azure.monitor.opentelemetry import configure_azure_monitor

configure_azure_monitor(
    logger_name="<your_logger_namespace>"
)
logger = logging.getLogger("<your_logger_namespace>")
```

> 注意：由於我們修改了應用程式的程式碼，因此需要重新部署才能生效。

## 設定 App Insights 連線字串

App Insights 資源有一個連線字串。將此連線字串新增為執行中應用程式的環境變數。您可以使用 Azure CLI 來查詢 App Insights 資源的連線字串。請參閱 [scripts/appinsights.ps1] 以了解查詢連線字串所需執行的 Azure CLI 指令。

取得連線字串後，將此環境變數設定為其值。

```
"APPLICATIONINSIGHTS_CONNECTION_STRING={your_application_insights_connection_string}"
```

如果應用程式具有代表其雲端執行個體的 IaC 範本（例如 Bicep 或 terraform 檔案），則應將此環境變數加入 IaC 範本中，以便在每次部署中套用。否則，請使用 Azure CLI 手動將環境變數套用至應用程式的雲端執行個體。請參閱所需執行的 Azure CLI 指令以設定此環境變數。

## 傳送資料

建立一個已設定為傳送遙測的 logger。
```python
logger = logging.getLogger("<your_logger_namespace>")
logger.setLevel(logging.INFO)
```

然後透過呼叫其記錄方法來傳送遙測事件。
```python
logger.info("info log")
```
