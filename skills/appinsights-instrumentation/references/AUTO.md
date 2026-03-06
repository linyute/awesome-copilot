# 自動檢測應用程式

使用 Azure 入口網站 (Azure Portal) 為裝載在 Azure App Service 中的應用程式自動安裝 App Insights 檢測，而無需進行任何程式碼變更。僅下列類型的應用程式可以進行自動檢測。請參閱 [受支援的環境與資源提供者 (supported environments and resource providers)](https://learn.microsoft.com/azure/azure-monitor/app/codeless-overview#supported-environments-languages-and-resource-providers)。

- 裝載在 Azure App Service 中的 ASP.NET Core 應用程式
- 裝載在 Azure App Service 中的 Node.js 應用程式

建構一個 URL，引導使用者前往 Azure 入口網站中該 App Service 應用程式的 Application Insights 刀鋒視窗。
```
https://portal.azure.com/#resource/subscriptions/{subscription_id}/resourceGroups/{resource_group_name}/providers/Microsoft.Web/sites/{app_service_name}/monitoringSettings
```

使用現有的內容資訊，或詢問使用者以取得裝載該應用程式的 subscription_id、resource_group_name 以及 app_service_name。
