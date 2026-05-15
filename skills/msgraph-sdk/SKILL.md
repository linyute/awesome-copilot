---
name: msgraph-sdk
description: '將 Microsoft Graph SDK 整合到任何專案中 — .NET、TypeScript/JavaScript 或 Python。涵蓋驗證模式（用戶端認證、OBO、受控識別）、SDK 設定、呼叫 Graph API、批次處理、差異查詢 (Delta Query)、變更通知、節流 (Throttling) 和權限範圍。適用於從任何應用程式類型存取 Microsoft 365 資料（使用者、郵件、行事曆、Teams、檔案、SharePoint）。'
---

# Microsoft Graph SDK

在將 Microsoft Graph 整合到應用程式以存取 Microsoft 365 資料和服務時，請使用此技能。

請始終將實作建立在目前的 Microsoft Graph SDK 文件和目標語言的 SDK 版本基礎上，而不是僅依賴記憶。

## 首先確定目標語言

1. 當專案包含 `.cs`、`.csproj` 或 `.sln` 檔案，或使用者要求 C# 指引時，請使用 **.NET** 工作流程。請遵循 [references/dotnet.md](references/dotnet.md)。
2. 當專案包含 `package.json`、`.ts` 或 `.js` 檔案，或使用者要求 Node.js / 瀏覽器指引時，請使用 **TypeScript / JavaScript** 工作流程。請遵循 [references/typescript.md](references/typescript.md)。
3. 當專案包含 `.py`、`pyproject.toml` 或 `requirements.txt`，或使用者要求 Python 指引時，請使用 **Python** 工作流程。請遵循 [references/python.md](references/python.md)。
4. 如果存在多種語言，請配合正在編輯的檔案語言或詢問使用者。

## 務必參考即時文件

- Microsoft Graph 總覽：<https://learn.microsoft.com/graph/overview>
- Graph 總管（即時嘗試呼叫）：<https://developer.microsoft.com/graph/graph-explorer>
- Graph 權限參考：<https://learn.microsoft.com/graph/permissions-reference>
- 可用時，使用 Microsoft Docs MCP 工具來取得目前的 API 形狀和 SDK 範例。

## 驗證 — 選擇正確的模式

選擇錯誤的驗證流程是 Graph 整合中最常見的錯誤。在撰寫任何驗證程式碼之前，請套用此決策樹：

| 情境 | 使用流程 |
|---|---|
| 無使用者的背景服務 / 精靈 (Daemon) | **用戶端認證 (Client credentials)** (僅限應用程式) |
| 代表已登入使用者執行動作的代理程式或 API | **代理 (On-Behalf-Of, OBO)** |
| 在 Azure 中執行的應用程式 (Function, Container App, VM) | **受控識別 (Managed Identity)** (優於密鑰) |
| CLI 工具或本機開發指令碼 | **裝置代碼 (Device code)** 或 **互動式瀏覽器** |
| 單頁應用程式 (僅限瀏覽器) | **授權碼 + PKCE** |

- 需要使用者內容時，絕不要使用用戶端認證 — Graph 在權限層級（應用程式 vs. 委派）強制執行此規定。
- 在 Azure 託管的應用程式中，偏好使用 `DefaultAzureCredential`；它會先嘗試受控識別，並為本機開發提供優雅的後援。
- 絕不硬編碼密鑰。請使用環境變數、Azure Key Vault 或密鑰管理員。

## 核心 SDK 使用模式

### 建立用戶端

始終僅建構一次 `GraphServiceClient` 並重複使用它（它在內部管理權杖快取）。

傳遞來自 Azure Identity 函式庫的認證 — 絕不要手動建立原始 HTTP 用戶端。

### 進行呼叫

- 使用流暢的 (Fluent) 建立器 API：`client.Users[userId].Messages.GetAsync(...)`。
- 始終對非同步呼叫使用 `await`。
- 指定 `$select` 以限制傳回的欄位 — Graph 預設會傳回大型承載。
- 在伺服器端使用 `$filter`，而不是在記憶體中過濾傳回的集合。
- 當關聯性較小時，使用 `$expand` 在單次呼叫中擷取相關資源。

### 分頁 (Pagination)

Graph 會對集合進行分頁。絕不要假設所有項目都會在一次回應中抵達：
- 檢查回應中是否有 `@odata.nextLink`。
- 使用 SDK 的 `PageIterator` 協助工具（三種 SDK 均提供）來自動走訪頁面。
- 設定 `$top` 來控制分頁大小（最大值因資源而異，通常為 999）。

## 進階模式

### 批次要求 (Batch requests)

使用 `$batch` 端點將最多 20 個獨立的 Graph 呼叫合併到單一 HTTP 要求中。在以下情況下使用批次處理：
- 為需要預先取得多個資源的儀表板或代理程式初始化資料。
- 減少高呼叫次數作業的延遲。

批次回應會無序抵達 — 請透過您分配給每個要求的 `id` 欄位來匹配它們。

### 差異查詢 (Delta queries)

使用差異查詢來累加同步變更，而不是輪詢完整集合：
- 第一次呼叫：`GET /users/delta` 傳回所有項目 + 一個 `@odata.deltaLink`。
- 後續呼叫：使用 `deltaLink` 僅接收自上次同步以來變更的內容。
- 支援對象：使用者、群組、訊息、行事曆事件、Teams 頻道等。
- 在同步執行之間持久儲存 `deltaLink`（資料庫、Blob）。

### 變更通知 (Change notifications/Webhooks)

使用 `POST /subscriptions` 訂閱資源變更：
- Graph 會將變更事件傳送至您的 HTTPS 通知 URL。
- 訂閱會過期 — 請在 `expirationDateTime` 之前續訂（最大值因資源而異；郵件/行事曆通常為 1-3 天，使用者/群組最高可達 4230 分鐘）。
- 驗證訂閱交握：Graph 在建立時會傳送一個 `validationToken` 查詢參數 — 請將其以純文字形式連同 HTTP 200 回傳。
- 使用生命週期通知 (`notificationUrl` + `lifecycleNotificationUrl`) 來處理遺漏的事件和重新授權。
- 對於高成交量情境，偏好使用 **包含資源資料的變更通知**（需要額外的加密設定）。

### 節流 (Throttling)

Graph 的節流非常嚴格。務必處理 HTTP 429：
- 讀取 `Retry-After` 標頭 — 它指定了確切的等待秒數，而不是固定的指數退避。
- SDK 內建的重試中介軟體 (Middleware) 在設定後會自動處理 429；請明確啟用它。
- 避免使用數百個平行要求衝擊 Graph 的扇出模式 (Fan-out pattern)；請改用批次處理或佇列。

## 權限

在撰寫驗證程式碼之前，請正確設定權限 — 錯誤的範圍會導致難以偵錯的 403 錯誤。

- 應用程式權限 (Application permissions) 在沒有使用者的情況下執行（精靈 / 服務）。需要管理員同意。
- 委派權限 (Delegated permissions) 在已登入使用者的內容下執行。有些需要管理員同意。
- 要求所需的 **最小權限**。Graph 的權限參考列出了每項作業的最低權限選項。
- 在編碼前，使用 Graph 總管測試呼叫實際需要的權限。
- 在 Azure 應用程式註冊中：授予 API 權限 → Microsoft Graph → 選擇類型（應用程式或委派） → 在需要處授予管理員同意。

## 常見 Graph 資源 — 快速參考

| 目標 | 資源路徑 |
|---|---|
| 取得已登入使用者的個人資料 | `GET /me` |
| 列出使用者的信箱訊息 | `GET /me/messages` |
| 傳送電子郵件 | `POST /me/sendMail` |
| 列出行事曆事件 | `GET /me/events` |
| 取得使用者的 OneDrive 根目錄 | `GET /me/drive/root/children` |
| 列出使用者加入的 Teams | `GET /me/joinedTeams` |
| 發布 Teams 頻道訊息 | `POST /teams/{id}/channels/{id}/messages` |
| 列出 SharePoint 網站清單 | `GET /sites/{siteId}/lists` |
| 跨 M365 搜尋 | `POST /search/query` |
| 列出租戶中的所有使用者（僅限應用程式） | `GET /users` |
| 取得群組成員 | `GET /groups/{id}/members` |

同樣地，在程式碼中使用 SDK 的流暢 API 來導覽至這些資源。

## 工作流程

1. 確定目標語言並閱讀對應的參考檔案。
2. 識別驗證情境並從上表中選擇正確的流程。
3. 在進行實作選擇之前，擷取目前的 SDK 文件和 Graph 總管範例。
4. 套用最小權限 — 在 Graph 權限參考中確認。
5. 從一開始就實作分頁 — 不要假設單頁回應。
6. 從第一天起就啟用針對節流的重試中介軟體。
7. 對於同步情境，偏好差異查詢而非輪詢。
8. 使用所選參考檔案中的語言特定套件名稱、驗證提供者設定和程式碼模式。

## 完成標準

- 驗證流程符合情境（不要對使用者內容呼叫預設使用用戶端認證）。
- `GraphServiceClient` 僅建構一次並重複使用。
- 所有集合讀取都處理了分頁。
- 透過重試中介軟體或明確的 `Retry-After` 邏輯處理節流 (429)。
- 權限範圍設定為所需的最小值。
- 未硬編碼任何密鑰或認證。
- 程式碼符合所選語言目前的 SDK 版本模式。
