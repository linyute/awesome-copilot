---
description: 'Razor Pages 元件和應用程式模式'
applyTo: '**/*.cshtml, **/*.cshtml.cs'
---

## Razor Pages 程式碼風格和結構

- 編寫道地的、高效的 Razor Pages 和 C#。
- 遵循框架建立時採用的慣例：以 Handler 為基礎的 PageModel，而不是將 MVC 控制器模式強加於頁面。
- 保持 PageModel 專注於請求/回應的調度；業務邏輯應屬於被注入的領域服務 (domain services)。
- 簡單的 Handler 可以保持內嵌。對於具有大量 Handler 和相依性的頁面，可以使用像 MediatR 這樣的仲介者。
- 端到端使用 async/await，使 Handler 不會阻塞請求管道。

## 命名慣例

- PageModel 類別、Handler 方法和公開成員使用 PascalCase (`CreateModel`, `OnPostAsync`, `OnPostDeleteAsync`)。
- 私有欄位和區域變數使用 camelCase，並根據 .NET 慣例在私有欄位加上 `_` 前置詞 (`_context`, `_logger`)。
- 介面名稱以 "I" 開頭 (`IEmailService`)。
- 具名 Handler 在路由時會省略 `OnPost`/`Async` 綴詞。`OnPostJoinListAsync` 透過 `handler=JoinList` 存取。

## 模型繫結和 Overposting

- 不要直接在 EF 或領域實體上放置 `[BindProperty]`。攻擊者可以發送額外的欄位，如 `IsAdmin` 或 `Secret`，繫結器將會設定它們，即使表單中沒有呈現這些欄位。
- 繫結到專用的輸入模型 (Input Model) 或檢視模型 (View Model)，僅公開頁面允許接受的屬性，然後再對應到實體。
- `TryUpdateModelAsync<T>` 配合明確的屬性允許清單是另一種選擇，特別是在編輯情境中。
- 避免在編輯時使用 `[Bind]`。排除的屬性會被重設為 `default(T)` 而不是保持原樣，這通常不是您想要的。優先選擇輸入模型。
- 不要廣泛地啟用 `[BindProperty(SupportsGet = true)]`。Razor Pages 預設跳過 GET 繫結是有原因的；請根據個別屬性選擇加入並驗證輸入內容。
- 對於自訂類型 (包括強類型識別碼)，請實作 `TryParse` 或 `TypeConverter`，以便它們能從路由和查詢值進行繫結。如果沒有實作，繫結器會將它們視為複雜類型，導致繫結靜默失敗。這類錯誤往往會浪費掉一整個下午。
- `[BindRequired]` 和 `[Required]` 是不同的東西。`[BindRequired]` 在發送的表單中「缺少」來源值時會出錯；`[Required]` 則驗證繫結的值不是 null 或空值。`[BindRequired]` 僅適用於表單繫結，因為 JSON 和 XML 會透過輸入格式化器處理。

## Handler 方法和請求流

- 成功的 POST 後務必使用 Post-Redirect-Get (PRG) 模式。傳回 `RedirectToPage("./Index")`，絕對不要傳回 `Page()`。在成功時傳回 `Page()` 意味著瀏覽器重新整理會重新提交表單。

```csharp
public async Task<IActionResult> OnPostAsync()
{
    if (!ModelState.IsValid) return Page();          // 錯誤時重新呈現
    await _service.CreateAsync(Input);
    return RedirectToPage("./Index");                // 成功時使用 PRG
}
```

- 使用 `if (!ModelState.IsValid) return Page();` 保護每個持續性路徑。客戶端驗證可以被規避；伺服器端才是具備權威性的。
- 對於單次請求的路由或查詢值，請使用 Handler 參數 (`OnGetAsync(int id)`)。對於需要在驗證錯誤時返回檢視的 POST 資料，請使用 `[BindProperty]`。
- 具名 Handler (`OnPostDeleteAsync`, `OnPostApproveAsync`) 需要在提交按鈕上使用 `asp-page-handler` 標記協助程式 (Tag Helper)。如果沒有它，一般按鈕會回退到 `OnPostAsync` 或 404。
- 如果 `OnGet` 執行昂貴的工作，請新增一個輕量級的 `OnHead`。否則 Razor Pages 會針對 HEAD 請求回退到 `OnGet`，導致每一次偵測都要支付完整的 GET 成本。
- 這裡的篩選器與 MVC 不同：`[ActionFilter]` 屬性在頁面 Handler 上會被靜默忽略。請使用 `IPageFilter` / `IAsyncPageFilter`，或在 `Program.cs` 中透過 `options.Conventions` 註冊全域慣例。

## 專案結構和慣例

- 共用的版面配置 (Layout)、分部檢視 (Partial) 和範本應放在 `Pages/Shared/`，而不是 `Views/Shared/`。Razor Pages 從頁面資料夾向上遞迴搜尋檢視到 `Pages/`，混合 MVC 慣例只會與框架產生衝突。
- 在 `Pages/_ViewStart.cshtml` 中設定 `Layout`。使用 `Pages/_ViewImports.cshtml` 處理 `@namespace`、`@addTagHelper` 和共用指示詞。
- 保持 `.cshtml` 和 `.cshtml.cs` 放在一起。頁面局部性 (locality) 是使用 Razor Pages 的主要原因之一，將它們拆分到不同資料夾會失去這個優勢。

## 安全性

- 信任 Razor 預設的 `@` 表達式 HTML 編碼。不要在使用者提供的內容上使用 `@Html.Raw()`；它會停用編碼並開啟 XSS 之門。
- 堅持使用 `<form method="post">` 和表單標記協助程式，以便自動注入防偽權杖 (Antiforgery Token)。對於 AJAX 或 `fetch`，請使用 `@Html.AntiForgeryToken()` 呈現權杖，並將其作為 `RequestVerificationToken` 標頭傳送。
- 不要將秘密 (Secrets) 提交到 `appsettings.json`。使用 `appsettings.{Environment}.json` 進行環境覆寫，在本機使用使用者秘密 (`dotnet user-secrets`)，在生產環境使用 Azure Key Vault 或環境變數。透過 `IOptions<T>` 進行繫結。

## PageModel 中的相依性注入

- 注意單例 (Singleton) 中包含限於範圍 (Scoped) 的「受困相依性」(Captive Dependency) 陷阱。如果單例持有對範圍服務 (如 EF `DbContext`) 的參考，該執行個體將會在多個請求之間洩漏。這是 PageModel 相關服務中常見的錯誤。
- 不要將 `DbContext` 註冊為 `Singleton`。預設的 `AddDbContext` 註冊為 `Scoped` 是有原因的。

## Page Handler 中的 Entity Framework Core

- 在將 EF 實體傳回到檢視之前，先使用 `.Select(...)` 將其投影到 DTO 或檢視模型。直接傳遞具有導覽屬性的實體會導致延遲載入例外狀況、N+1 查詢或在檢視呈現時產生序列化循環。
- 在唯讀查詢 (如列表頁面或不含編輯的詳細資訊頁面) 上使用 `.AsNoTracking()`。變更追蹤器在這些地方會產生不必要的開銷。
- 當透過主索引鍵擷取且不含 `Include` 時，優先使用 `FindAsync(key)` 而不是 `FirstOrDefaultAsync(x => x.Id == key)`。`FindAsync` 會先檢查變更追蹤器。

## 狀態管理

- `TempData` 用於一次性的、跨重定向的訊息，如 PRG 之後的快閃通知。它預設為讀取一次且經過 Cookie 序列化，不能替代工作階段儲存 (Session storage)。
- 對於實際的個別使用者工作階段狀態，請使用 `ISession`。對於單次請求的資料，請使用 `HttpContext.Items`。對於單次請求內的共用狀態，請使用請求範圍的 DI 服務。
- 當一個值需要在不被消耗的情況下經歷多次重定向時，請呼叫 `TempData.Keep()` 或 `TempData.Peek()`。

## 測試

- 直接對 `PageModel` 類別進行單元測試。使用模擬相依性 (Moq, NSubstitute) 具現化它們，並對傳回的 `IActionResult` 進行斷言：`PageResult` 用於重新呈現，`RedirectToPageResult` 用於成功的 PRG，`NotFoundResult` 用於 404 路徑。
- 對於練習路由、模型繫結和防偽權杖的整合測試，請使用 `WebApplicationFactory<TEntryPoint>` 配合 `Microsoft.AspNetCore.Mvc.Testing`。
- 在測試讀取 `ModelState` 的 Handler 時，請手動使用 `PageModel.ModelState.AddModelError(...)` 填入內容。繫結管道在單元測試中不會執行。