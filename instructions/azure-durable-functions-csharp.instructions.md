---
description: '使用隔離工作者模型 (isolated worker model) 構建 C# Azure Durable Functions 的指南與最佳實務'
applyTo: '**/*.cs, **/host.json, **/local.settings.json, **/*.csproj'
---

# Azure Durable Functions C# 開發

## 一般指令

- 對於新的 Durable Functions 專案，請務必使用 **隔離工作者模型 (isolated worker model)** 並搭配 `Microsoft.Azure.Functions.Worker.Extensions.DurableTask` NuGet 套件。
- 對於編排器 (orchestrator) 與活動 (activity) 上下文型別，請使用 `Microsoft.DurableTask` 命名空間 (`TaskOrchestrationContext`, `TaskActivityContext`)。
- 為確保清晰，請將編排器、活動、實體 (entities) 與客戶端啟動函式 (client starter functions) 分離至不同的類別或檔案中。
- 絕對不要混用編排邏輯與活動邏輯 — 編排器負責協調，活動負責執行工作。
- 在編排器函式中記錄日誌時，請務必使用 `context.CreateReplaySafeLogger(nameof(OrchestratorName))`；絕對不要在編排器中直接注入並使用 `ILogger<T>`，因為它會在每次重放 (replay) 時記錄。
- 所有編排器與活動方法請使用 `async Task` 或 `async Task<T>` — 絕不要使用 `async void`。
- 將編排器程式碼視為 **確定性且可重放安全 (deterministic and replay-safe)**：編排器內禁止使用 `DateTime.Now`、`Guid.NewGuid()`、`Random`、直接 HTTP 呼叫或非確定性 I/O。
- 在編排器內，請使用 `context.CurrentUtcDateTime` 代替 `DateTime.UtcNow`。

## 專案結構

- 在 `Program.cs` 中，透過 `builder.Services.AddDurableTaskClient()` 與 `builder.ConfigureFunctionsWorkerDefaults(x => x.UseDurableTask())` 註冊 Durable Functions 支援。
- 將編排器、活動與實體依據功能分組至資料夾 (例如 `/Orchestrations/OrderProcessing/`)，而非依據函式類型。
- 編排器名稱請加上 `Orchestrator` 後綴 (例如 `ProcessOrderOrchestrator`)，活動請加上 `Activity` 後綴 (例如 `ChargePaymentActivity`)，實體請加上 `Entity` 後綴 (例如 `CartEntity`)。
- 傳遞至 `CallActivityAsync`、`CallSubOrchestratorAsync` 與 `GetEntityStateAsync` 的活動/編排器/實體名稱，請使用常數或靜態唯讀字串以防止拼字錯誤。

## 設定檔

### local.settings.json
- 本機開發請務必包含 `AzureWebJobsStorage` 連接字串 — Durable Functions 需要儲存體來維護編排狀態。
- 本機測試使用 `"UseDevelopmentStorage=true"` 或 Azurite 連接字串 — 絕不要在本地開發使用生產環境的儲存體帳戶。
- 在 local.settings.json 中將 `FUNCTIONS_WORKER_RUNTIME` 設定為 `"dotnet-isolated"`。
- 若使用 Netherite 或 MSSQL 儲存提供者，請包含提供者特定的連接字串 (例如 Netherite 使用 `EventHubsConnection`)。
- 絕對不要將 `local.settings.json` 提交至原始碼控制 — 請將其加入 `.gitignore`；應使用包含預留位置的 `local.settings.json.example`。
- 若需要，可透過 `@Microsoft.KeyVault(...)` 參考，在本機使用 Azure Key Vault 儲存敏感值 (儲存體金鑰、Event Hub 連接字串)。

### host.json
- Durable Functions 專屬設定請置於 `"extensions": { "durableTask": { ... } }` 下 — 生產環境不要依賴預設值。
- 將 `"hubName"` 設定為有意義且環境特定的值 (例如 `"MyAppProd"`, `"MyAppDev"`)，以隔離共用同一儲存體帳戶的不同環境的 Task Hub。
- 根據預期吞吐量與託管計畫調整 `"maxConcurrentActivityFunctions"` 與 `"maxConcurrentOrchestratorFunctions"` — 預設值較保守。
- 在 Premium/Dedicated 計畫上，為長執行編排啟用擴充工作階段 (`"extendedSessionsEnabled": true`) 以減少重放開銷。
- 設定儲存提供者：在高規模場景使用 `"storageProvider": { "type": "netherite" }` 或 `"mssql"`，而非預設的 Azure Storage。
- 適當設定 `"maxQueuePollingInterval"` — 較低的值可提高回應性，但會增加 Consumption 計畫的儲存體交易成本。
- 在 `"logging": { "applicationInsights": { "samplingSettings": { ... } } }` 下設定 Application Insights 取樣率以控制遙測量。

## 編排模式

### 函式鏈結 (Function Chaining)
- 針對每個步驟皆依賴前一步驟結果的循序工作流程，使用連續的 `await context.CallActivityAsync<T>(nameof(ActivityName), input)` 呼叫。
- 在活動間僅傳遞可序列化、輕量級的資料 — 避免傳遞包含循環參考的整個領域物件。

### Fan-Out / Fan-In
- 使用多個 `context.CallActivityAsync` 進行 Fan-Out 後，使用 `Task.WhenAll(tasks)` 來聚合並行結果。
- 當針對大型集合進行 Fan-Out 時，請限制並行度 — 使用批次處理 (例如分割輸入清單) 以避免壓垮下游服務或達到 Durable Functions 儲存體限制。
- 優先使用 `List<Task<T>>` 而非動態 Task 陣列；在 await 之前擷取所有 Task 以避免重放問題。

### 非同步 HTTP API (人類互動 / 長執行)
- 從 HTTP 觸發器啟動函式呼叫 `client.ScheduleNewOrchestrationInstanceAsync`；回傳 `await client.CreateCheckStatusResponseAsync(req, instanceId)` 以提供輪詢 URL 給呼叫者。
- 結合 `context.WaitForExternalEvent<T>("EventName", timeout)` 與 `context.CreateTimer(deadline, CancellationToken)` 來實作帶逾時的核准/回呼模式。
- 務必處理逾時競爭：使用 `Task.WhenAny(externalEventTask, timerTask)`，若事件先抵達則取消計時器。

### 監控 / 輪詢模式 (Monitoring / Polling Pattern)
- 針對輪詢工作流程，使用帶有 `context.CreateTimer(context.CurrentUtcDateTime.Add(interval), CancellationToken.None)` 的 `while` 迴圈，而非使用獨立的計時器觸發函式。
- 確保監控迴圈有明確的退出條件，以避免永不終止的無限迴圈。
- 針對循環永恆工作流程，使用 `context.ContinueAsNew(input)` 來以全新狀態重新啟動編排，並防止歷史紀錄無限制增長。

### 永恆編排 (Eternal Orchestrations)
- 在編排器主體結尾使用 `context.ContinueAsNew(newInput)` 以全新狀態重新啟動長執行的循環工作流程。
- 當使用 `isKeepRunning` 模式時，在呼叫 `ContinueAsNew` 之前清空任何待處理的外部事件。
- 結合 `ContinueAsNew` 與 `context.CreateTimer` 來實作定期任務 (例如每日報表產生、快取更新)。

### 子編排 (Sub-Orchestrations)
- 使用 `context.CallSubOrchestratorAsync<T>(nameof(SubOrchestrator), instanceId, input)` 將複雜工作流程分解為可重複使用的子編排。
- 當需要冪等性 (idempotency) 或相關性 (correlation) 時，為子編排提供明確的 `instanceId`。
- 限制子編排巢狀深度以避免歷史紀錄大小問題；儘量扁平化工作流程。

### 實體函式 (Stateful Entities)
- 使用實作 `TaskEntity<TState>` 的類別式語法來定義實體，以進行型別化、封裝的狀態管理。
- 僅透過實體操作 (`entity.State`) 存取實體狀態；絕對不要直接讀寫實體儲存體。
- 在活動中使用 `context.Entities.CallEntityAsync<T>`，或在編排器中使用 `context.Entities.SignalEntityAsync` 進行「發後即忘」 (fire-and-forget) 的實體操作。
- 在編排器中，若不需要回傳值，優先使用 `SignalEntityAsync` 而非 `CallEntityAsync` 以避免不必要的阻塞。
- 針對需要分散式計數器、分散式鎖定、聚合器或每使用者/每會話狀態的場景使用實體。
- 保持實體狀態小且可序列化；避免在實體狀態中儲存大型 Blob 或無限制增長的集合。

## 活動函式 (Activity Functions)

- 活動函式應聚焦於單一工作單元 — 它們是唯一執行 I/O (資料庫讀寫、HTTP 呼叫、佇列傳送) 的地方。
- 透過建構函式 DI 將服務 (例如 `IRepository`, `IHttpClientFactory`) 注入至包含活動函式的類別；不要在活動方法內使用 `[FromServices]`。
- 活動應儘可能 **冪等 (idempotent)** — 編排器可能會在重試時多次呼叫相同的活動。
- 使用 `TaskActivityContext` 型別作為活動內容；使用注入的 `ILogger<T>` 記錄日誌 (非重放安全日誌 — 活動不會被重放)。
- 活動僅回傳可序列化型別；避免回傳包含導覽屬性的領域實體。

## 錯誤處理與補償

- 在編排器內將 `context.CallActivityAsync` 呼叫包裝在 try/catch 區塊中，以處理 `TaskFailedException` 進行優雅的錯誤處理與補償。
- 當步驟在工作流程中途失敗時，在 catch 區塊中呼叫撤銷活動來實作補償交易 (Saga 模式)。
- 在活動呼叫上使用 `RetryPolicy` (透過 `new TaskOptions(new RetryPolicy(maxRetries, firstRetryInterval))`)，針對短暫失敗進行自動重試與退避。
- 區分短暫錯誤 (重試) 與業務錯誤 (快速失敗並補償) — 驗證或授權失敗不要重試。
- 若編排進入無法自我解決的錯誤狀態，務必透過 Durable Functions 管理 API 或客戶端終止卡住的編排。

## 計時器 (Timers)

- 編排器內的持久延遲請使用 `context.CreateTimer(fireAt, CancellationToken)` — 絕對不要使用 `Task.Delay` 或 `Thread.Sleep`。
- 務必取消不再需要的計時器 (例如外部事件在計時器觸發前抵達時)，透過傳遞並取消 `CancellationTokenSource`。
- 在 Consumption 計畫上，避免在生產環境使用極短的計時器間隔 (小於 1 分鐘)；可能會導致過高的儲存體輪詢成本。

## 執行個體管理 (Instance Management)

- 當編排需要與業務實體相關聯時，請使用有意義、具確定性的 `instanceId` (例如 `$"order-{orderId}"`)，而非 GUID。
- 在排程新編排前，使用 `client.GetInstanceMetadataAsync(instanceId)` 檢查是否已有現存執行個體，以防止重複編排 (單例模式)。
- 在管理 API 或管理函式中進行生命週期管理時，請使用 `client.TerminateInstanceAsync`, `client.SuspendInstanceAsync` 與 `client.ResumeInstanceAsync`。
- 定期使用 `client.PurgeInstanceAsync` 或批次清除來清除已完成/失敗的編排歷史紀錄，以控制 Task Hub 儲存體成長。

## 可觀測性 (Observability)

- 編排器內的所有記錄請使用 `context.CreateReplaySafeLogger(nameof(Orchestrator))` 以防止重放期間產生重複的日誌條目。
- 編排器與啟動函式的所有日誌語句中，皆應記錄 `instanceId` 以利端對端追蹤。
- 使用搭配 Durable Functions 整合的 Application Insights 來追蹤編排生命週期事件、活動持續時間與失敗。
- 透過 Durable Functions HTTP 管理 API 端點 (`/runtime/webhooks/durabletask/instances`) 或 Durable Functions Monitor VS Code 擴充功能來監控編排健康狀態。
- 在 `host.json` 中設定 `durableTask.maxConcurrentOrchestratorFunctions` 與 `durableTask.maxConcurrentActivityFunctions` 以控制並行度並防止資源耗盡。

## 儲存體與 Task Hub 設定

- 在 `host.json` 的 `"extensions": { "durableTask": { "hubName": "MyTaskHub" } }` 下設定 Task Hub 名稱，以隔離共用同一儲存體帳戶的不同環境 (開發/預備/生產)。
- 每個環境使用不同的儲存體帳戶或 Task Hub 名稱，以避免跨環境干擾。
- 針對高吞吐量場景，使用 **Netherite** 或 **MSSQL** 儲存提供者，而非預設的 Azure Storage 提供者，以改善效能並降低成本。
- 避免將大型酬載 (>64KB) 直接儲存為編排輸入/輸出；應將大型資料儲存於 Blob Storage 中，並傳遞參考 (URL/ID)。

## 測試 Durable Functions

- 針對編排器單元測試，請使用 `Microsoft.Azure.Functions.Worker.Extensions.DurableTask.Tests` NuGet 套件 (若可用) 或手動 Mock `TaskOrchestrationContext`。
- 將活動函式作為一般方法進行隔離測試 — 為其相依性 (儲存庫、HTTP 客戶端) 注入 Mock 並驗證回傳值。
- 使用測試工具或手動 Mock Mock `context.CallActivityAsync`, `context.CreateTimer` 與 `context.WaitForExternalEvent` 來測試編排器邏輯。
- 避免測試 Durable Functions 執行階段本身 (事件來源、重放) — 測試焦點應放在編排器與活動內的業務邏輯。
- 使用 Azurite 或隔離的 Azure Storage 帳戶進行整合測試，以測試端對端工作流程，包括 starter → 編排器 → 活動 → 完成。
- 在測試中使用確定性執行個體 ID (例如 `$"test-{Guid.NewGuid()}"`)，以透過 `client.GetInstanceMetadataAsync` 查詢並驗證編排狀態。
- 透過 Mock `context.CreateTimer` 立即觸發並驗證編排器是否處理逾時分支來測試逾時場景。
- 透過強迫活動失敗 (在 Mock 活動中拋出異常) 並斷言編排器呼叫補償活動來測試補償/錯誤處理。
- 在整合測試中使用 `client.WaitForInstanceCompletionAsync` 而非輪詢 — 它會阻塞直到編排完成或逾時。
- 針對實體測試，在測試編排器中使用 `context.Entities.SignalEntityAsync`，並在編排完成後透過 `client.ReadEntityStateAsync` 驗證實體狀態。

## 現有程式碼審查指引

- 若編排器內使用 `DateTime.UtcNow` 或 `DateTime.Now`，請標記並替換為 `context.CurrentUtcDateTime`。
- 若編排器內使用 `Guid.NewGuid()` 或 `Random`，請標記為非確定性並移動至活動中。
- 若編排器內有直接 HTTP 呼叫 (`HttpClient.GetAsync` 等)，請立即標記並將該呼叫移動至活動函式中。
- 若編排器內使用 `Task.Delay` 或 `Thread.Sleep`，請替換為 `context.CreateTimer`。
- 若編排歷史紀錄在長執行迴圈中無限制成長而未使用 `ContinueAsNew`，請建議加入 `ContinueAsNew` 以重設歷史紀錄。
- 若實體狀態儲存大型集合或 blob 資料，建議將大型資料外部化至 Blob Storage，並僅在實體狀態中儲存參考。
- 若活動函式不具冪等性且工作流程無重試/補償邏輯，請將其標記為可靠性風險。
