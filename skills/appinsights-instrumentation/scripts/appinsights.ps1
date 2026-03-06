# 建立 App Insights 資源 (共 3 個步驟)
## 新增 Application Insights 擴充功能
az extension add -n application-insights
## 建立 Log Analytics 工作區
az monitor log-analytics workspace create --resource-group $resourceGroupName --workspace-name $logAnalyticsWorkspaceName --location $azureRegionName
## 建立 Application Insights 資源
az monitor app-insights component create --app $applicationInsightsResourceName --location $azureRegionName --resource-group $resourceGroupName --workspace $logAnalyticsWorkspaceName

# 查詢 App Insights 的連線字串
az monitor app-insights component show --app $applicationInsightsResourceName --resource-group $resourceGroupName --query connectionString --output tsv

# 設定 App Service 的環境變數
az webapp config appsettings set --resource-group $resourceGroupName --name $appName --settings $key=$value

# 設定 Container App 的環境變數
# 或更新現有的 container app
az containerapp update -n $containerAppName -g $resourceGroupName --set-env-vars $key=$value

# 設定 Function App 的環境變數
az functionapp config appsettings set --name $functionName --resource-group $ResourceGroupName --settings $key=$value
