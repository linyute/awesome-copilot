---
name: api-breaking-change-detector
description: '透過將 C# Web API 的控制器/DTO 與其 TypeScript/JavaScript 消費者（React、Angular、Vue、Svelte、Node.js，或手寫/自動產生的 HTTP 客戶端，例如 Fetch、Axios、NSwag）交叉比對，偵測雙向的契約漂移：會破壞客戶端應用程式的後端變更（JSON 金鑰更名/移除、新增必填參數、狀態碼變動），以及前端傳送後端已不再讀取的欄位的程式碼。直接針對原始程式碼運作，而非導出的 OpenAPI 規格檔案。當使用者要求檢查 API 破壞性變更、驗證前端/後端契約同步，或在合併前審計某項 DTO/控制器變更與其 TypeScript/JS 消費者之間的相容性時使用。不適用於從規格產生新的 API 程式碼（參見 openapi-to-application-code）或建立新的端點（參見 aspnet-minimal-api-openapi）。'
---

# API 破壞性變更偵測器

您正在將 C# Web API 的實際契約（控制器、DTO、路由定義）與其 TypeScript/JavaScript 消費者交叉比對，以找出雙向的契約漂移，並在漂移進入生產環境之前將其發現。

## 何時使用

當使用者要求以下事項時觸發：
- 檢查某項 DTO/控制器變更是否會破壞前端或客戶端應用程式
- 驗證客戶端與後端的 API 契約是否仍然同步
- 在發布前，審計特定端點或整個 API 介面是否存有破壞性變更

不適用於以下用途：
- 從 OpenAPI 規格產生新的 API 程式碼（參見 `openapi-to-application-code`）
- 搭配 OpenAPI 文件建立新的端點（參見 `aspnet-minimal-api-openapi`）
- 直接比較兩份 OpenAPI 規格*檔案* — 本技能讀取的是原始程式碼，而非導出的規格

## 處理流程

1. **發現全域 JSON 與命名政策：**
   - 檢查 `Program.cs` 或 `Startup.cs` 中生效的 JSON 選項（例如 `JsonNamingPolicy.CamelCase`、`PropertyNamingPolicy`，或 Newtonsoft 的 `CamelCasePropertyNamesContractResolver`）。
   - 若已設定全域 camelCase，則 TypeScript/JavaScript 的欄位對應預設使用 `camelCase`，除非 C# 屬性上有明確的 `[JsonPropertyName("...")]` 特性予以覆寫。
   - 忽略標有 `[JsonIgnore]` 的 C# 屬性。

2. **識別 C# 契約表面。** 對範圍內的每個 Controller 動作：
   - **路由**：基礎的 `[Route("...")]` 加上動作的 `[HttpGet("...")]` / `[HttpPost("...")]`。正規化路由參數（例如 `{id:int}` 或 `{id:guid}` $\rightarrow$ `{id}`）。
   - **要求 DTO**：提取屬性名稱、型別與需求規則：
     - *符合以下條件時為必填*：標有 `[Required]`、`[BindRequired]`、使用 C# 11 的 `required` 修飾子（`public required string X`），或是沒有預設值的非可 null 值類型（`int`、`Guid`、`bool`）。
     - *符合以下條件時為選用*：可 null（`string?`、`int?`），或具有預設初始化值。
   - **回應 DTO**：屬性名稱、型別與可 null 性。
   - **明確的狀態碼**：`[ProducesResponseType(statusCode)]` 特性，以及明確的 `StatusCode(...)` 回傳路徑。

3. **找出對應的 TypeScript/JavaScript 消費者（使用正規化 URL 比對）：**
   - **自動產生的客戶端比對（高信度）：** 尋找自動產生的客戶端檔案（NSwag/OpenAPI Generator 的輸出），直接以產生的方法/介面名稱進行比對。
   - **手寫的 service/客戶端比對（中信度）：**
     - 在 TypeScript/JavaScript 檔案中搜尋 HTTP 客戶端呼叫（`fetch`、`axios`、Angular 的 `HttpClient`、`ky` 等），其正規化後的 URL 樣式與控制器的路由相符。
     - 正規化範本字串與字串拼接（例如 `${this.apiUrl}/users/${id}` 或 `baseUrl + '/users/' + userId` $\rightarrow$ `/users/{id}`）。
     - 將正規化後的路由與 C# 路由比對，不受 TypeScript/JS 中變數命名的影響。
   - **找不到比對：** 回報「未找到客戶端消費者」而非猜測 — 不要只因靜態分析未找到比對，就假設該端點未被使用。
   - 為每項發現標註是透過上述三種方法中的哪一種定位的。

4. **比較後端 → 前端/客戶端（會破壞客戶端的情況）：**
   - 被更名或移除的 DTO 屬性，但 TypeScript/JS 的介面或物件模型仍期望它
   - 新增的必填要求欄位，而客戶端從不傳送
   - 客戶端未處理的回應狀態碼（例如控制器現在回傳 409 Conflict，但客戶端的錯誤處理只處理 400/500）
   - 回應欄位的型別已改變（例如 `long` $\rightarrow$ `string`，或非可 null $\rightarrow$ 可 null），且與客戶端型別的假設不一致

5. **比較前端/客戶端 → 後端（過期/失效的客戶端程式碼 vs. 隱性錯誤）：**
   - *無害的失效欄位*：客戶端傳送一個後端會忽略且不會報錯的 payload 屬性。
   - *靜默失效的錯誤（嚴重度：高）*：客戶端邏輯讀取一個後端不再回傳的回應屬性（執行期會變成 `undefined`，並可能導致應用程式失敗）。

6. **產出報告**（參見輸出格式）。本技能不會修改程式碼。

## 輸出格式

1. **已審計的範圍** — 已審計的控制器、DTO 與 TypeScript/JavaScript 檔案，以及偵測到的 JSON 命名政策（例如透過 `Program.cs` 啟用的 `camelCase`）。
2. **後端 → 客戶端的破壞** — 依端點分組：變更了什麼、使用的比對方法（自動產生 / 正規化路由比對）、對客戶端的精確影響，以及嚴重度（編譯錯誤 vs. 靜默的執行期失敗）。
3. **客戶端 → 後端的漂移** — 被傳送或期望的過期欄位，並明確區分無害的失效欄位與靜默失效的客戶端 UI 邏輯。
4. **未找到消費者** — 未比對上的後端 DTO/端點，需要人工確認。
5. **比對信度摘要** — 依發現來源的細分：自動產生的客戶端 vs. 正規化的手寫路由 vs. 未比對上的路由。

## 準則

- **URL 正規化**：比較路由之前，一律移除查詢參數（`?status=active`），並正規化路徑參數（`${id}` / `:id` / `{id}`）。
- **命名政策**：在未檢查 `[JsonPropertyName("...")]` 或全域的 `JsonNamingPolicy.CamelCase` 設定之前，切勿假設 C# 屬性名稱與 TypeScript/JS 屬性名稱完全一致。
- **現代 C# 細節**：評估必填屬性時，檢查 C# 11 的 `required` 關鍵字與 `#nullable enable` 註記（`string?` 與 `string` 的差異）。
- **不依賴特定框架**：契約比對適用於任何 TypeScript 或 JavaScript 客戶端（Fetch、Axios、Angular、React、Vue、Svelte、Node.js）。
- **嚴禁捏造**：若找不到對應的客戶端 service 或 DTO，回報「未透過靜態搜尋找到消費者」 — 切勿僅憑寬鬆類似的類別名稱就猜測配對關係。
- **僅回報**：不修改程式碼；輸出一份可快速掃閱、可採取行動的審計報告。
