---
description: '使用隔離工作者模型 (isolated worker model) 構建 C# Azure Functions 的指南與最佳實務'
applyTo: '**/*.cs, **/host.json, **/local.settings.json, **/*.csproj'
---

# Azure Functions C# 開發

## 一般指令

- 對於所有以 .NET 6 或更高版本為目標的新 Azure Functions 專案，請務必使用 **隔離工作者模型 (isolated worker model)** (而非舊版 in-process 模型)。
- 在 `Program.cs` 中使用 `FunctionsApplication.CreateBuilder(args)` 或 `HostBuilder` 進行主機設定與相依性注入。
- 使用 `[Function("FunctionName")]` 裝飾函式方法，並使用強型別的觸發器與繫結屬性。
- 保持函式方法聚焦 — 每個函式應僅執行一項任務，並將業務邏輯委派給注入的服務。
- 絕對不要將業務邏輯直接放在函式方法主體內；應將其提取至透過 DI 註冊的可測試服務類別中。
- 使用透過建構函式注入的 `ILogger<T>`，而非作為函式參數傳遞的 `ILogger`，以保持結構化日誌的一致性。
- 針對所有 I/O 繫結作業，務必使用 `async/await`；絕不要使用 `.Result` 或 `.Wait()` 進行阻塞。
- 在支援的情況下，優先使用 `CancellationToken` 參數以啟用優雅的關閉。

## 專案結構與設定

- 使用 `Microsoft.Azure.Functions.Worker` 與 `Microsoft.Azure.Functions.Worker.Extensions.*` NuGet 套件。
- 在 `Program.cs` 中使用 `builder.Services.Add*` 擴充方法註冊服務，以實現簡潔的相依性注入。
- 依據領域關注點將相關函式分組至獨立類別，而非依據觸發器類型。
- 本機開發請將設定儲存於 `local.settings.json`；已部署環境請使用 Azure App Configuration 或應用程式設定。
- 絕對不要在程式碼中硬編碼連接字串或祕密；請始終從 `IConfiguration` 或環境變數讀取。
- 在已部署環境的應用程式設定中，針對祕密使用 Key Vault 參考 (`@Microsoft.KeyVault(SecretUri=...)`)。
- 使用 `Managed Identity` (`DefaultAzureCredential`) 進行 Azure 服務驗證 — 儘可能避免使用帶有金鑰的連接字串。
- 針對每種觸發器類型調整 `host.json`：在主機層級設定 `maxConcurrentCalls`、`batchSize` 與重試策略。

## 觸發器 (Triggers)

- **HttpTrigger**：生產環境端點請使用 `AuthorizationLevel.Function` 或更高層級；僅保留 `AuthorizationLevel.Anonymous` 給公開 API，且須有明確理由。使用 ASP.NET Core 整合模型時，請使用 ASP.NET Core 整合 (`UseMiddleware`, `IActionResult` 回傳)。
- **TimerTrigger**：排程請使用 NCRONTAB 表達式 (`"0 */5 * * * *"`)；生產環境請避免 `RunOnStartup = true`，因為它會在每次冷啟動時立即執行。
- **QueueTrigger / ServiceBusTrigger**：在 `host.json` 與 Azure 入口網站中設定 `MaxConcurrentCalls`、無效信件佇列 (dead-letter) 策略與 `MaxDeliveryCount`；針對進階訊息控制 (完成、放棄、死信) 直接處理 `ServiceBusReceivedMessage`。
- **BlobTrigger**：相較於基於輪詢的 Blob 觸發器，請優先使用基於 Event Grid 的 Blob 觸發器 (`Microsoft.Azure.Functions.Worker.Extensions.EventGrid`)，以獲得更低的延遲並減少儲存體交易成本。
- **EventHubTrigger**：批次處理請將 `cardinality` 設定為 `many`；批次模式請使用 `EventData[]` 或 `string[]` 參數型別；務必使用 `EventHubTriggerAttribute` 內建的檢查點機制進行檢查點設定。
- **CosmosDBTrigger**：針對 Cosmos DB 變更進行事件驅動處理時請使用變更摘要 (change feed) 觸發器；設定 `LeaseContainerName` 並將租賃容器與資料容器分開管理。

## 輸入與輸出繫結 (Input and Output Bindings)

- 若繫結涵蓋使用案例，請使用輸入繫結以宣告方式讀取資料，而非直接在函式主體內使用 SDK。
- 針對多個輸出繫結，請定義自訂回傳型別，並以適當的輸出繫結屬性標註屬性 (例如 `[QueueOutput]`, `[BlobOutput]`, `[HttpResult]`)。
- 讀寫 Blob 請使用 `[BlobInput]` 與 `[BlobOutput]`；針對大型 Blob，請優先使用 `Stream` 而非 `byte[]` 以避免記憶體壓力。
- 點讀取與簡單查詢請使用 `[CosmosDBInput]`；針對複雜查詢，請透過 DI 搭配 `Managed Identity` 注入 `CosmosClient`。
- 單一訊息傳送請使用 `[ServiceBusOutput]`；針對批次處理或進階傳送場景，請透過 DI 注入 `ServiceBusSender`。
- 避免對相同資源混用透過 DI 取得的 SDK 客戶端與基於繫結的 I/O — 每個資源請選擇一種模式以保持一致性。

## 相依性注入與設定

- 使用 `Azure.Extensions.AspNetCore.Configuration.Secrets` 套件的 `services.AddAzureClients()` 方法，並搭配 `DefaultAzureCredential`，將所有外部客戶端 (例如 `BlobServiceClient`, `ServiceBusClient`, `CosmosClient`) 註冊為單例 (singleton)。
- 針對強型別設定區段，請使用 `IOptions<T>` 或 `IOptionsMonitor<T>`。
- 避免在函式中使用 `static` 狀態；所有共用狀態皆應透過 DI 註冊的服務流動。
- 透過 `IHttpClientFactory` 註冊 `HttpClient` 執行個體，以管理連接池並避免 Socket 耗盡。

## 錯誤處理與重試

- 在 `host.json` 中使用帶有 `fixedDelay` 或 `exponentialBackoff` 策略的 `"retry"` 設定，以配置觸發器層級的重試策略。
- 針對程式碼層級的短暫故障處理，請使用 `Microsoft.Extensions.Http.Resilience` 或 Polly v8 (`ResiliencePipeline`) 並採用重試、斷路器 (circuit breaker) 與逾時策略。
- 在重新拋出或歸入無效信件佇列前，務必捕捉特定異常並記錄帶有結構化內容 (例如 correlation ID, 輸入識別碼) 的日誌。
- 針對在所有重試後仍失敗的訊息使用無效信件佇列；在函式處理常式中絕不要無聲吞下異常。
- 針對 HTTP 觸發器，對於預期的錯誤條件，請回傳適當的 `IActionResult` 型別 (`BadRequestObjectResult`, `NotFoundObjectResult`)，而非拋出異常。

## 可觀測性與記錄 (Observability and Logging)

- 使用帶有結構化日誌屬性的 `ILogger<T>`：`_logger.LogInformation("Processing message {MessageId}", messageId)`。
- 在 `Program.cs` 中透過 `builder.Services.AddApplicationInsightsTelemetryWorkerService()` 與 `builder.Logging.AddApplicationInsights()` 設定 Application Insights。
- 除了自動收集的內容外，請使用 `TelemetryClient` 進行自訂事件、度量與相依性追蹤。
- 在 `host.json` 的 `"logging"` 下設定適當的記錄層級，以避免生產環境產生過高的遙測成本。
- 針對分散式追蹤內容在函式與下游服務間的傳播，使用 `System.Diagnostics` 中的 `Activity` 與 `ActivitySource`。
- 避免在任何日誌語句中記錄敏感資料 (PII, 祕密, 連接字串)。

## 效能與可擴展性

- 保持函式啟動時間最小化：將昂貴的初始化延遲載入至單例，而非函式建構函式。
- 針對事件驅動、不可預測的工作負載使用 Consumption 計畫；針對低延遲、高吞吐量或 VNet 整合場景使用 Premium 或 Dedicated 計畫。
- 針對 CPU 密集工作，請卸載至背景 `Task` 或使用 Durable Functions，而非阻塞函式主機執行緒。
- 儘可能批次處理作業：在單一函式調用中處理 `IEnumerable<EventData>` 或 `ServiceBusReceivedMessage[]` 陣列，而非一次一則訊息。
- 根據託管計畫與預期吞吐量適當設定 `FUNCTIONS_WORKER_PROCESS_COUNT` 與 `maxConcurrentCalls`。
- 在應用程式設定中啟用 `WEBSITE_RUN_FROM_PACKAGE=1`，透過直接從部署套件執行來加快冷啟動速度。

## 安全性

- 在處理前務必驗證並清理 HTTP 觸發器輸入；請使用 FluentValidation 或資料註釋 (Data Annotations)。
- 針對內部 API 到 API 的呼叫，請使用存儲於 Key Vault 中的函式金鑰，並搭配 `AuthorizationLevel.Function`。
- 在公開 API 前整合 Azure API Management (APIM)，以處理驗證、速率限制與路由。
- 針對敏感函式，使用 App Service 網路功能 (IP 限制、私人端點) 限制輸入存取。
- 絕對不要記錄包含 PII 或祕密的請求主體。

## 測試

- 使用標準 xUnit/NUnit 搭配 Mock 相依性，獨立於函式主機對服務類別進行單元測試。
- 使用 `Azurite` (本機 Azure Storage 模擬器) 與 `TestServer` 或 Azure Functions Core Tools 對函式進行整合測試。
- 在可用時使用 `Microsoft.Azure.Functions.Worker.Testing` 協助程式來建構 Mock `FunctionContext` 執行個體。
- 避免測試觸發器本身的管線；測試焦點應放在提取至服務中的業務邏輯。

## 現有程式碼審查指引

- 若專案使用舊版 **in-process 模型** (`FunctionsStartup`, `IWebJobsStartup`)，請建議遷移至隔離工作者模型，並透過 `dotnet-isolated-process-guide` 提供遷移路徑。
- 若在程式碼或設定檔中發現硬編碼的連接字串或儲存體帳戶金鑰，請標記並建議以 `DefaultAzureCredential` 與 Key Vault 參考取代。
- 若生產應用程式的 `TimerTrigger` 設定了 `RunOnStartup = true`，請將其標記為風險，並建議改用部署位置 (deployment slots) 或功能旗標 (feature flags)。
- 若任何函式中使用 `async void`，請立即標記 — 請改用 `async Task`。
- 若函式內手動以 `Thread.Sleep` 或 `Task.Delay` 實作重試邏輯，請建議替換為主機層級的重試策略或 Polly resilience pipelines。
