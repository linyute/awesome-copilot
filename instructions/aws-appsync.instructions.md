---
description: '針對 AWS AppSync Event API 處理常式的生產等級指引，包含 APPSYNC_JS 執行環境限制、公用程式、模組和資料來源模式'
applyTo: '**/*.{graphql,gql,vtl,ts,js,mjs,cjs,json,yml,yaml}'
---

# AWS AppSync Event API 指引

在實作使用 `APPSYNC_JS` 執行環境的 AWS AppSync **Event API** 處理常式 (`onPublish`, `onSubscribe`) 時，請參考這些指引。

## 範圍與合約

- 圍繞頻道命名空間流程設計處理常式：`onPublish` 在廣播前執行，`onSubscribe` 在訂閱嘗試時執行。
- 保持事件合約明確且穩定。將頻道路徑和傳輸內容 (payload) 形狀視為 API 合約。
- 偏好對傳輸內容欄位進行增量變更，並避免破壞現有的訂閱者。

## 資料來源地圖 (Event API)

根據事件工作流程需求，有意圖地使用資料來源：

- Lambda：自定義運算、轉換、協調、外部 AWS/服務整合。
- DynamoDB：低延遲的事件/狀態持久化以及基於金鑰的讀取/寫入。
- RDS (Aurora)：關聯式檢查、合併 (joins) 以及更強的關聯完整性案例。
- EventBridge：將事件路由至更廣泛的事件驅動架構。
- OpenSearch：針對事件資料進行搜尋與分析。
- HTTP 端點：透過 HTTP 存取外部 API 或 AWS 服務 API。
- Bedrock：事件管線中的模型推論與 AI 增強。

僅在每一跳 (hop) 有明確理由 (驗證、持久化、增強、路由) 時，才偏好結合多個資料來源。

## 資料來源設定與 IAM (必要)

- 在 Event API 層級建立資料來源，然後將其作為命名空間整合掛載。
- 若使用服務角色，請僅授予必要的動作 (最小權限)。
- 信任原則主體必須允許 `appsync.amazonaws.com` 假設該角色。
- 盡可能使用條件限制信任：
  - 將 `aws:SourceAccount` 限制為您的帳戶。
  - 將 `aws:SourceArn` 限制為特定的 AppSync API ARN (或嚴格界定的模式)。
- 不要為了 AppSync 資料來源存取而重用廣泛的跨服務 IAM 角色。

## 執行環境限制 (務必遵循)

`APPSYNC_JS` 執行環境是受限的 JavaScript 子集。請為此環境撰寫程式碼，而非完整的 Node.js。

- 不要使用非同步模式：無 Promise、`async/await` 或背景非同步工作流程。
- 不要使用不支援的陳述式/運算子：`try/catch/finally`、`throw`、`while`、C 樣式的 `for(;;)`、`continue`、標籤 (labels)、不支援的一元運算子。
- 不要依賴執行環境程式碼中的網路或檔案系統存取。請使用 AppSync 資料來源進行 I/O。
- 不要使用遞迴或將函式作為函式引數傳遞。
- 不要依賴記載支援以外的類別 (classes) 或進階執行環境功能。
- 需要迭代時，偏好使用 `for-of` / `for-in` 迴圈。

## 處理常式流程模式

- 對於沒有資料來源整合的處理常式，直接回傳轉換後的 `ctx.events`。
- 對於具有資料來源的處理常式，使用包含 `request(ctx)` 和 `response(ctx)` 的物件形式。
- 當商業邏輯決定跳過資料來源呼叫與回應對應時，使用 `runtime.earlyReturn(...)`。
- 使用 `ctx.info.channel.path`、`ctx.info.channel.segments`、`ctx.info.channelNamespace.name` 和 `ctx.info.operation` 來驅動路由邏輯。
- 對於帶有資料來源整合的 `onPublish`，從 `response(ctx)` 回傳要廣播的事件清單。
- 對於帶有資料來源整合的 `onSubscribe`，包含一個 `response(ctx)` 函式 (若不需要後續對應，可為空)。

### `ctx.prev.result` vs `ctx.stash` (管線指引)

- 若解析器/函式按步驟執行，且下一步相依於上一步的輸出，請使用 `ctx.prev.result`。
- 將 `ctx.prev.result` 作為連續管線函式之間預設的資料交接機制。
- 當您需要跨多個管線階段共享資料，且該資料不僅僅是前一個步驟的結果時，請使用 `ctx.stash`。
- 在 `ctx.stash` 中僅儲存小型的、有意圖的 Metadata (例如旗標、ID、關聯上下文)，不要複製大型的傳輸內容。
- 當 `ctx.prev.result` 已經提供所需的值時，不要在 `ctx.stash` 中重複儲存完整的前一步結果。

## 錯誤與授權流程

- 不要在處理常式中使用 `throw`。請使用 AppSync 執行環境支援的 `util.error(...)` 和 `util.appendError(...)` 模式。
- 對於發佈失敗，回傳包含安全訊息 (無內部細節) 的明確執行階段錯誤。
- 對於處理常式層級的商業授權拒絕，使用處理常式程式碼中記載的未經授權 (unauthorized) 工具。
- 保持錯誤傳輸內容為非敏感資訊。絕不洩漏秘密、原始堆疊追蹤或內部識別碼。

## 內建公用程式

使用 `util` 取得執行環境安全的輔助工具。

- 編碼工具：
  - `util.urlEncode`, `util.urlDecode`
  - `util.base64Encode`, `util.base64Decode`
- 執行環境工具：
  - `runtime.earlyReturn(obj)` 用於停止目前的處理常式執行，並跳過資料來源與回應評估。

## 內建模組

使用來自 `@aws-appsync/utils` 的官方模組，並保持程式碼宣告式。

- DynamoDB 模組匯入：
  - `import * as ddb from '@aws-appsync/utils/dynamodb'`
- RDS 模組匯入：
  - `import { ... } from '@aws-appsync/utils/rds'`

### DynamoDB 用法

盡可能偏好使用模組輔助工具，而非手寫的請求物件。

- 核心輔助工具包含：`get`、`put`、`remove`、`update`、`query`、`scan`、`sync`。
- 批次輔助工具：`batchGet`、`batchPut`、`batchDelete`。
- 交易輔助工具：`transactGet`、`transactWrite`。
- 對於 `update`，偏好使用如遞增/附加/新增/移除等作業輔助工具，以進行安全的修補式 (patch-style) 變更。
- 優先使用模型金鑰與索引進行查詢。除非有正當理由，否則避免使用 `scan`。
- 必要時使用條件以確保正確性與樂觀並行 (optimistic concurrency)。
- 對於突發的發佈流程，偏好使用 `batchPut`/`batchDelete` (或在需要原子性時使用 `transactWrite`)，而非許多單一項目作業。
- 保持 DynamoDB 批次大小在服務/API 限制內，並對輸入進行具決定性的分塊 (chunk)。

### Lambda 用法

對於 Event API Lambda 資料來源請求，請使用：

- `operation: 'Invoke'`
- 選用的 `invocationType: 'RequestResponse' | 'Event'`
- 為 Lambda 合約明確定義的 `payload` 形狀

指引：

- 當處理常式流程相依於 Lambda 輸出時，請使用 `RequestResponse`。
- 對於發送後不理 (fire-and-forget) 的副作用，請僅使用 `Event`。
- 在 `response(ctx)` 中驗證 `ctx.result` 並對映到精確的傳出事件形狀。
- 在 Event API 處理常式中，Lambda 作業支援為 `Invoke`；在此不要依賴 GraphQL 樣式的 `BatchInvoke`。
- 如果您在 Event API 流程中需要 Lambda 批次處理，請在一次 `Invoke` 中發送陣列傳輸內容，並在 Lambda 內部實作項目級別的彙整/部分失敗處理。

### 直接 Lambda 整合 (無處理常式程式碼)

您可以配置命名空間處理常式使用直接 Lambda 整合 (`Behavior: DIRECT`)，而無需編寫 `onPublish`/`onSubscribe` 程式碼。

- `REQUEST_RESPONSE` 模式：
  - `onPublish` Lambda 回傳 `{ events?: OutgoingEvent[], error?: string }`。
  - `onSubscribe` Lambda 回傳 `null` 表示成功，或 `{ error: string }` 表示拒絕。
- `EVENT` 模式：
  - 調用是非同步的；AppSync 不會等待 Lambda 回應。
  - 對於發佈，事件照常繼續廣播。
- 若 Lambda 在請求/回應模式下回傳 `error`，則在啟用記錄時會被記錄，且不會作為詳細的內部錯誤傳輸內容回傳。

當整個命名空間行為可以集中在 Lambda 中，且您不需要 `APPSYNC_JS` 請求/回應對映邏輯時，請偏好直接 Lambda 整合。

### HTTP/EventBridge/RDS/OpenSearch/Bedrock

使用非 DynamoDB 資料來源時：

- HTTP：回傳 `resourcePath`、`method`、選用的 `params` (`headers`、`query`、`body`)；檢查 `ctx.result.statusCode`、`ctx.result.body` 和 `ctx.error`。
- EventBridge：使用 `operation: 'PutEvents'` 並從 `ctx.events` 建構具決定性的事件條目。
- RDS：偏好使用 SQL 輔助工具和 `createPgStatement`/`createMySQLStatement`；不要內插不安全的 SQL。
- OpenSearch：保持請求路徑/參數明確，並僅從 `ctx.result` 對映所需的欄位。
- Bedrock：明確定義 `operation` (`InvokeModel` 或 `Converse`) 並包含提示注入 (prompt-injection) 防範措施。

## 批次作業 (必要指引)

- 在目標資料來源原生支援且事件語義允許分組的地方，偏好批次處理。
- DynamoDB：
  - 使用 `batchGet`、`batchPut`、`batchDelete` 進行非原子性的大量作業。
  - 當需要原子性 (全有或全無) 的行為時，請使用 `transactGet`、`transactWrite`。
  - 驗證並限制單次請求的項目數量；將大型批次進行分塊。
- Lambda：
  - Event API JS 處理常式請求使用具有選用 `invocationType` 的 `operation: 'Invoke'`。
  - 處理常式請求物件中沒有 Event API `BatchInvoke` 作業。
  - 對於虛擬批次 Lambda 模式，向一次調用發送清單傳輸內容，並回傳具決定性的逐項結果結構。
- 保持排序保證明確：若下游取用者相依於順序，請保留並記錄排序金鑰。

## 安全性與資料安全

- 將 `ctx.identity`、標頭和傳輸內容欄位視為不可信的輸入。
- 針對每個資料來源強制執行最小權限 IAM。
- 在寫入作業前以及轉發轉換後的事件前加入驗證。
- 絕不將秘密硬編碼在處理常式程式碼中。
- 對於公開用途，保持預設值為保守 (在無效狀態下拒絕/未授權)。

## 工具、TypeScript 與建構

- 使用 `@aws-appsync/eslint-plugin` (至少使用 `plugin:@aws-appsync/base`)。
- 當配置了 TypeScript 工具時，使用 `plugin:@aws-appsync/recommended`。
- TypeScript 不會由 AppSync 執行環境直接執行。請在部署前轉譯為受支援的 JavaScript。
- 使用外部化的 `@aws-appsync/utils` 匯入進行封裝，並提供 Source Map 以供偵錯。

## 可觀察性與營運

- 為處理常式和資料來源整合啟用 CloudWatch 記錄。
- 使用結構化、低基數 (low-cardinality) 的欄位進行記錄 (頻道命名空間/路徑、作業、請求 ID)。
- 加入可警示的訊號：處理常式錯誤、資料來源錯誤、延遲回歸。
- 保持回應轉換為具決定性，並使用多事件傳輸內容進行測試。

## 最低品質檢核表

- [ ] 僅使用 `APPSYNC_JS` 支援的執行環境功能。
- [ ] 無 `throw`，無 async/promise 用法，無不支援的迴圈/控制結構。
- [ ] 錯誤流程使用執行環境支援的工具，並回傳非敏感訊息。
- [ ] `onPublish` 和 `onSubscribe` 行為明確且經過測試。
- [ ] 資料來源請求/回應對映為具決定性且符合架構安全。
- [ ] Lambda/DynamoDB 合約已記錄並經過驗證。
- [ ] 已啟用 `@aws-appsync/eslint-plugin` 的 Lint 檢查。
