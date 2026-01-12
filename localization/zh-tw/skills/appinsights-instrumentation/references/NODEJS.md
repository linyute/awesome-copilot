## 修改程式碼

對應用程式進行下列必要的變更。

- 安裝用戶端函式庫
```
npm install @azure/monitor-opentelemetry
```

- 設定應用程式以使用 Azure Monitor
Node.js 應用程式通常會有一個在 package.json 的 "main" 屬性中列出的進入點檔案。尋找此檔案並在其中套用下列變更。
  - 在頂部引用用戶端函式庫：`const { useAzureMonitor } = require("@azure/monitor-opentelemetry");`
  - 呼叫設定方法：`useAzureMonitor();`

> 注意：設定方法應儘早呼叫，但必須在環境變數配置之後，因為它需要從環境變數中取得 App Insights 連線字串。例如，如果應用程式使用 dotenv 載入環境變數，則應在載入之後、但在其他任何操作之前呼叫設定方法。
> 注意：由於我們修改了應用程式的程式碼，因此需要重新部署才能生效。

## 設定 App Insights 連線字串

App Insights 資源有一個連線字串。將此連線字串新增為執行中應用程式的環境變數。您可以使用 Azure CLI 來查詢 App Insights 資源的連線字串。請參閱 [scripts/appinsights.ps1] 以了解查詢連線字串所需執行的 Azure CLI 指令。

取得連線字串後，將此環境變數設定為其值。

```
"APPLICATIONINSIGHTS_CONNECTION_STRING={your_application_insights_connection_string}"
```

如果應用程式具有代表其雲端執行個體的 IaC 範本（例如 Bicep 或 terraform 檔案），則應將此環境變數加入 IaC 範本中，以便在每次部署中套用。否則，請使用 Azure CLI 手動將環境變數套用至應用程式的雲端執行個體。請參閱所需執行的 Azure CLI 指令以設定此環境變數。
