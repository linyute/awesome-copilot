# Azure 服務名稱參考 (Azure Service Names Reference)

Azure 零售價格 API 中的 `serviceName` 欄位是**區分大小寫**的。請使用此參考文件來尋找要在篩選器中使用的精確服務名稱。

## 運算 (Compute)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| 虛擬機器 (Virtual Machines) | `Virtual Machines` |
| Azure Functions | `Functions` |
| Azure 應用程式服務 (Azure App Service) | `Azure App Service` |
| Azure 容器應用程式 (Azure Container Apps) | `Azure Container Apps` |
| Azure 容器執行個體 (Azure Container Instances) | `Container Instances` |
| Azure Kubernetes 服務 (Azure Kubernetes Service) | `Azure Kubernetes Service` |
| Azure Batch | `Azure Batch` |
| Azure Spring Apps | `Azure Spring Apps` |
| Azure VMware 解決方案 (Azure VMware Solution) | `Azure VMware Solution` |

## 儲存 (Storage)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure 儲存（Blob、檔案、佇列、資料表） | `Storage` |
| Azure NetApp Files | `Azure NetApp Files` |
| Azure 備份 (Azure Backup) | `Backup` |
| Azure Data Box | `Data Box` |

> **注意**：Blob 儲存、檔案 (Files)、磁碟儲存與 Data Lake 儲存皆包含在單一的 `Storage` 服務名稱下。請使用 `meterName` 或 `productName` 來區分它們（例如：`contains(meterName, 'Blob')`）。

## 資料庫 (Databases)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure Cosmos DB | `Azure Cosmos DB` |
| Azure SQL 資料庫 (Azure SQL Database) | `SQL Database` |
| Azure SQL 受控執行個體 (Azure SQL Managed Instance) | `SQL Managed Instance` |
| 適用於 PostgreSQL 的 Azure 資料庫 | `Azure Database for PostgreSQL` |
| 適用於 MySQL 的 Azure 資料庫 | `Azure Database for MySQL` |
| Azure Cache for Redis | `Redis Cache` |

## AI + 機器學習 (AI + Machine Learning)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure AI Foundry 模型（包含 OpenAI） | `Foundry Models` |
| Azure AI Foundry 工具 | `Foundry Tools` |
| Azure 機器學習 (Azure Machine Learning) | `Azure Machine Learning` |
| Azure 認知搜尋 (AI 搜尋) | `Azure Cognitive Search` |
| Azure Bot 服務 (Azure Bot Service) | `Azure Bot Service` |

> **注意**：Azure OpenAI 定價現在位於 `Foundry Models` 下。請使用 `contains(productName, 'OpenAI')` 或 `contains(meterName, 'GPT')` 來篩選特定的 OpenAI 模型。

## 網路 (Networking)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure 負載平衡器 (Azure Load Balancer) | `Load Balancer` |
| Azure 應用程式閘道 (Azure Application Gateway) | `Application Gateway` |
| Azure Front Door | `Azure Front Door Service` |
| Azure CDN | `Azure CDN` |
| Azure DNS | `Azure DNS` |
| Azure 虛擬網路 (Azure Virtual Network) | `Virtual Network` |
| Azure VPN 閘道 (Azure VPN Gateway) | `VPN Gateway` |
| Azure ExpressRoute | `ExpressRoute` |
| Azure 防火牆 (Azure Firewall) | `Azure Firewall` |

## 分析 (Analytics)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure Synapse Analytics | `Azure Synapse Analytics` |
| Azure Data Factory | `Azure Data Factory v2` |
| Azure 串流分析 (Azure Stream Analytics) | `Azure Stream Analytics` |
| Azure Databricks | `Azure Databricks` |
| Azure 事件中樞 (Azure Event Hubs) | `Event Hubs` |

## 整合 (Integration)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure 服務匯流排 (Azure Service Bus) | `Service Bus` |
| Azure Logic Apps | `Logic Apps` |
| Azure API 管理 (Azure API Management) | `API Management` |
| Azure 事件網格 (Azure Event Grid) | `Event Grid` |

## 管理與監控 (Management & Monitoring)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure 監視器 (Azure Monitor) | `Azure Monitor` |
| Azure Log Analytics | `Log Analytics` |
| Azure Key Vault | `Key Vault` |
| Azure 備份 (Azure Backup) | `Backup` |

## 網頁 (Web)

| 服務 | `serviceName` 值 |
|---------|-------------------|
| Azure 靜態網頁應用程式 (Azure Static Web Apps) | `Azure Static Web Apps` |
| Azure SignalR | `Azure SignalR Service` |

## 提示 (Tips)

- 若您不確定服務名稱，請**先依據 `serviceFamily` 進行篩選**，以在結果中探索有效的 `serviceName` 值。
- 範例：`serviceFamily eq 'Databases' and armRegionName eq 'eastus'` 會回傳所有的資料庫服務名稱。
- 某些服務針對不同的層級或世代具備多個 `serviceName` 條目。
