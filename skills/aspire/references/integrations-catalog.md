# 整合目錄

Aspire 擁有跨 13 個類別的 **144 個以上整合**。與其維護靜態列表，不如使用 MCP 工具來獲取即時、最新的整合資料。

---

## 探索整合 (MCP 工具)

Aspire MCP 伺服器提供了兩個用於探索整合的工具 — 這些工具適用於**所有 CLI 版本** (13.1+)，且**不需要**執行 AppHost。

| 工具 | 功能 | 何時使用 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `list_integrations` | 傳回所有可用的 Aspire 裝載 (hosting) 整合及其 NuGet 套件 ID | 「資料庫有哪些可用的整合？」 / 「顯示所有與 Redis 相關的整合」 |
| `get_integration_docs` | 擷取特定整合套件的詳細文件 (設定、組態、程式碼範例) | 「如何設定 PostgreSQL？」 / 「顯示 `Aspire.Hosting.Redis` 的文件」 |

### 工作流程

1. **瀏覽** — 呼叫 `list_integrations` 以查看可用內容。依類別或關鍵字篩選結果。
2. **深入探討** — 使用套件 ID (例如 `Aspire.Hosting.Redis`) 和版本 (例如 `9.0.0`) 呼叫 `get_integration_docs` 以獲取完整的設定說明。
3. **新增** — 執行 `aspire add <integration>` 將裝載套件安裝到您的 AppHost 中。

> **提示：** 這些工具傳回的資料與[官方整合庫](https://aspire.dev/integrations/gallery/)相同。建議優先使用工具而非靜態文件 — 整合功能會經常更新。

---

## 整合模式

每個整合都遵循雙套件模式：

- **裝載套件** (`Aspire.Hosting.*`) — 將資源新增至 AppHost
- **用戶端套件** (`Aspire.*`) — 在您的服務中設定用戶端 SDK，包含健康檢查、遙測和重試
- **社群工具箱** (`CommunityToolkit.Aspire.*`) — 來自 [Aspire 社群工具箱](https://github.com/CommunityToolkit/Aspire) 的社群維護整合

```csharp
// === AppHost (裝載端) ===
var redis = builder.AddRedis("cache");  // Aspire.Hosting.Redis
var api = builder.AddProject<Projects.Api>("api")
    .WithReference(redis);

// === 服務 (用戶端) — 在 API 的 Program.cs 中 ===
builder.AddRedisClient("cache");        // Aspire.StackExchange.Redis
// 自動設定：連接字串、健康檢查、OpenTelemetry、重試
```

---

## 類別一覽

使用 `list_integrations` 檢視完整的即時列表。此摘要涵蓋了主要類別：

| 類別 | 關鍵整合 | 裝載套件範例 |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------- |
| **AI** | Azure OpenAI、OpenAI、GitHub Models、Ollama | `Aspire.Hosting.Azure.CognitiveServices` |
| **快取 (Caching)** | Redis、Garnet、Valkey、Azure Cache for Redis | `Aspire.Hosting.Redis` |
| **雲端 / Azure** | 儲存體、Cosmos DB、Service Bus、Key Vault、Event Hubs、Functions、SQL、SignalR (25+) | `Aspire.Hosting.Azure.Storage` |
| **雲端 / AWS** | AWS SDK 整合 | `Aspire.Hosting.AWS` |
| **資料庫** | PostgreSQL、SQL Server、MongoDB、MySQL、Oracle、Elasticsearch、Milvus、Qdrant、SQLite | `Aspire.Hosting.PostgreSQL` |
| **開發人員工具** | Data API Builder、開發通道 (Dev Tunnels)、Mailpit、k6、Flagd、Ngrok、Stripe | `Aspire.Hosting.DevTunnels` |
| **訊息傳送** | RabbitMQ、Kafka、NATS、ActiveMQ、LavinMQ | `Aspire.Hosting.RabbitMQ` |
| **可觀測性** | OpenTelemetry (內建)、Seq、OTel 收集器 | `Aspire.Hosting.Seq` |
| **運算** | Docker Compose、Kubernetes | `Aspire.Hosting.Docker` |
| **反向 Proxy** | YARP | `Aspire.Hosting.Yarp` |
| **安全性** | Keycloak | `Aspire.Hosting.Keycloak` |
| **框架 (Frameworks)** | JavaScript、Python、Go、Java、Rust、Bun、Deno、Orleans、MAUI、Dapr、PowerShell | `Aspire.Hosting.Python` |

有關多語言框架的方法簽章，請參閱[多語言 API](polyglot-apis.md)。

---
