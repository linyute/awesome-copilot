---
name: dotnet-timezone
description: '針對 C# 應用程式的 .NET 時區處理指南。當使用 TimeZoneInfo、DateTimeOffset、NodaTime、UTC 轉換、日光節約時間 (DST)、跨時區排程、跨平台 Windows/IANA 時區 ID，或當 .NET 使用者需要城市、地址、地區或國家的時區以及可直接複製貼上的 C# 程式碼時使用。'
---

# .NET 時區 ( .NET Timezone)

解決 .NET 和 C# 程式碼中的時區問題，提供生產環境安全的指引以及可直接複製貼上的程式碼片段。

## 從正確的路徑開始

首先識別請求類型：

- 地址或位置查詢
- 時區 ID 查詢
- UTC/在地時間轉換
- 跨平台時區相容性
- 排程或 DST 處理
- API 或持久化設計

若不確定使用哪個函式庫，跨平台作業請預設使用 `TimeZoneConverter`。若情境涉及週期性排程或嚴格的 DST 規則，請優先選擇 `NodaTime`。

## 解析地址與位置

若使用者提供地址、城市、地區、國家或包含地名的文件：

1. 從輸入中提取每個位置。
2. 閱讀 `references/timezone-index.md` 以取得常見的 Windows 和 IANA 對應。
3. 若未列出確切位置，請根據地理位置推斷正確的 IANA 區域，然後將其對應到 Windows ID。
4. 傳回這兩種 ID 以及可直接使用的 C# 範例。

針對每個解析後的位置，請提供：

```text
位置：<解析後的地點>
Windows ID：<windows id>
IANA ID：<iana id>
UTC 位移量：<標準位移量，若相關則包含 DST 位移量>
DST：<是/否>
```

然後包含一個跨平台程式碼片段，例如：

```csharp
using TimeZoneConverter;

TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("Asia/Colombo");
DateTime local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
```

若存在多個位置，請為每個位置包含一個區塊，然後提供一個結合多時區處理的程式碼片段。

若位置具有歧義，請列出可能的時區匹配項並要求使用者選擇正確的一個。

## 查詢時區 ID

使用 `references/timezone-index.md` 進行 Windows 到 IANA 的對應。

一律提供兩種格式：

- Windows ID：用於 Windows 上的 `TimeZoneInfo.FindSystemTimeZoneById()`
- IANA ID：用於 Linux、容器、`NodaTime` 以及 `TimeZoneConverter`

## 產生程式碼

使用 `references/code-patterns.md` 並挑選最適合的最精簡模式：

- 模式 1：適用於純 Windows 程式碼的 `TimeZoneInfo`
- 模式 2：適用於跨平台轉換的 `TimeZoneConverter`
- 模式 3：適用於嚴格時區運算與 DST 敏感排程的 `NodaTime`
- 模式 4：適用於 API 與資料傳輸的 `DateTimeOffset`
- 模式 5：ASP.NET Core 持久化與呈現
- 模式 6：週期性作業與排程器
- 模式 7：模糊且無效的 DST 時間戳記

在推薦第三方函式庫時，一律包含套件安裝指引。

## 警告常見陷阱

在適用時提及相關警告：

- `TimeZoneInfo.FindSystemTimeZoneById()` 的時區 ID 是平台特定的。
- 避免在資料庫中儲存 `DateTime.Now`；應儲存 UTC。
- 將 `DateTimeKind.Unspecified` 視為臭蟲風險，除非它是刻意的輸入。
- DST 轉換可能會跳過或重複在地時間。
- Azure Windows 與 Azure Linux 環境可能預期不同的時區 ID 格式。

## 回應形式

對於地址與位置請求：

1. 傳回每個位置的解析後時區區塊。
2. 用一句話說明建議的實作方式。
3. 包含可直接複製貼上的 C# 程式碼片段。

對於程式碼與架構請求：

1. 用一句話說明建議的方法。
2. 若相關，請提供時區 ID。
3. 包含最小可行程式碼片段。
4. 若需要，請提及套件需求。
5. 若重要，請加入一項陷阱警告。

保持回應簡潔且以程式碼為先。

## 參考資料

- `references/timezone-index.md`：常見的 Windows 與 IANA 時區對應
- `references/code-patterns.md`：可直接使用的 .NET 時區模式
