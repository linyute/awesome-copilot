## 修改程式碼

對應用程式進行下列必要的變更。

- 安裝用戶端函式庫
```
dotnet add package Azure.Monitor.OpenTelemetry.AspNetCore
```

- 設定應用程式以使用 Azure Monitor
ASP.NET Core 應用程式通常會有一個「建置」應用程式的 Program.cs 檔案。尋找此檔案並套用下列變更。
  - 在頂部加入 `using Azure.Monitor.OpenTelemetry.AspNetCore;`
  - 在呼叫 `builder.Build()` 之前，加入此行 `builder.Services.AddOpenTelemetry().UseAzureMonitor();`。

> 注意：由於我們修改了應用程式的程式碼，因此應用程式需要重新部署才能生效。

## 設定 App Insights 連線字串

App Insights 資源有一個連線字串。將此連線字串新增為執行中應用程式的環境變數。您可以使用 Azure CLI 來查詢 App Insights 資源的連線字串。請參閱 [scripts/appinsights.ps1](../../../../skills/appinsights-instrumentation/scripts/appinsights.ps1) 以了解查詢連線字串所需執行的 Azure CLI 指令。

取得連線字串後，將此環境變數設定為其值。

```
"APPLICATIONINSIGHTS_CONNECTION_STRING={您的_application_insights_連線字串}"
```

如果應用程式具有代表其雲端執行個體的 IaC 範本（例如 Bicep 或 terraform 檔案），則應將此環境變數加入 IaC 範本中，以便在每次部署中套用。否則，請使用 Azure CLI 手動將環境變數套用至應用程式的雲端執行個體。請參閱 [scripts/appinsights.ps1](../../../../skills/appinsights-instrumentation/scripts/appinsights.ps1) 以了解設定此環境變數所需執行的 Azure CLI 指令。

> 重要：請勿修改 appsettings.json。這是設定 App Insights 的過時方式。環境變數是目前建議的新方式。
