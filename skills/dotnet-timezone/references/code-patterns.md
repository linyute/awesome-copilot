# .NET 時區程式碼模式 ( .NET Timezone Code Patterns)

## 模式 1：基礎 TimeZoneInfo (Basic TimeZoneInfo)

僅當應用程式僅限於 Windows 且可接受 Windows 時區 ID 時使用。

```csharp
DateTime utcNow = DateTime.UtcNow;
TimeZoneInfo sriLankaTz = TimeZoneInfo.FindSystemTimeZoneById("Sri Lanka Standard Time");
DateTime localTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, sriLankaTz);

DateTime backToUtc = TimeZoneInfo.ConvertTimeToUtc(localTime, sriLankaTz);

TimeZoneInfo tokyoTz = TimeZoneInfo.FindSystemTimeZoneById("Tokyo Standard Time");
DateTime tokyoTime = TimeZoneInfo.ConvertTime(localTime, sriLankaTz, tokyoTz);
```

若是 Linux、容器或混合環境，請改用 `TimeZoneConverter` 或 `NodaTime`。

## 模式 2：使用 TimeZoneConverter 實現跨平台 (Cross-Platform With TimeZoneConverter)

建議大多數執行於 Windows 與 Linux 上的 .NET 應用程式使用此預設選項。

```xml
<PackageReference Include="TimeZoneConverter" Version="6.*" />
```

```csharp
using TimeZoneConverter;

TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("Asia/Colombo");
DateTime converted = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
```

這也接受 Windows ID：

```csharp
TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("Sri Lanka Standard Time");
```

## 模式 3：NodaTime

適用於嚴格的時區運算、週期性排程或對正確性要求極高的日光節約時間 (DST) 邊際案例。

```xml
<PackageReference Include="NodaTime" Version="3.*" />
```

```csharp
using NodaTime;

DateTimeZone colomboZone = DateTimeZoneProviders.Tzdb["Asia/Colombo"];
Instant now = SystemClock.Instance.GetCurrentInstant();
ZonedDateTime colomboTime = now.InZone(colomboZone);

DateTimeZone tokyoZone = DateTimeZoneProviders.Tzdb["Asia/Tokyo"];
ZonedDateTime tokyoTime = colomboTime.WithZone(tokyoZone);

LocalDateTime localDt = new LocalDateTime(2024, 6, 15, 14, 30, 0);
ZonedDateTime zoned = colomboZone.AtStrictly(localDt);
Instant utcInstant = zoned.ToInstant();
```

## 模式 4：適用於 API 的 DateTimeOffset (DateTimeOffset For APIs)

對於跨服務或處理程序邊界的數值，優先使用 `DateTimeOffset`。

```csharp
using TimeZoneConverter;

DateTimeOffset utcNow = DateTimeOffset.UtcNow;
TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("Asia/Colombo");
DateTimeOffset colomboTime = TimeZoneInfo.ConvertTime(utcNow, tz);
```

## 模式 5：ASP.NET Core 儲存與呈現 (ASP.NET Core Persistence And Presentation)

儲存 UTC，並在邊界進行轉換。

```csharp
using TimeZoneConverter;

entity.CreatedAtUtc = DateTime.UtcNow;

public DateTimeOffset ToUserTime(DateTime utc, string userIanaTimezone)
{
    var tz = TZConvert.GetTimeZoneInfo(userIanaTimezone);
    return TimeZoneInfo.ConvertTimeFromUtc(utc, tz);
}
```

## 模式 6：排程與週期性作業 (Scheduling And Recurring Jobs)

在排程之前，將面向使用者的在地時間轉換為 UTC。

```csharp
using TimeZoneConverter;

TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("Asia/Colombo");
DateTime scheduledLocal = new DateTime(2024, 12, 1, 9, 0, 0, DateTimeKind.Unspecified);
DateTime scheduledUtc = TimeZoneInfo.ConvertTimeToUtc(scheduledLocal, tz);
```

搭配 Hangfire：

```csharp
RecurringJob.AddOrUpdate(
    "morning-job",
    () => DoWork(),
    "0 9 * * *",
    new RecurringJobOptions { TimeZone = tz });
```

## 模式 7：模糊且無效的 DST 時間 (Ambiguous And Invalid DST Times)

當時區遵守日光節約時間時，檢查重複或跳過的在地時間戳記。

```csharp
using TimeZoneConverter;

TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("America/New_York");
DateTime localTime = new DateTime(2024, 11, 3, 1, 30, 0);

if (tz.IsAmbiguousTime(localTime))
{
    var offsets = tz.GetAmbiguousTimeOffsets(localTime);
    var standardOffset = offsets.Min();
    var dto = new DateTimeOffset(localTime, standardOffset);
}

if (tz.IsInvalidTime(localTime))
{
    localTime = localTime.AddHours(1);
}
```

## 常見錯誤 (Common Mistakes)

| 錯誤 | 較佳做法 |
| --- | --- |
| 在伺服器程式碼中使用 `DateTime.Now` | 使用 `DateTime.UtcNow` |
| 在資料庫中儲存在地時間戳記 | 儲存 UTC 並在顯示時轉換 |
| 硬寫入位移量，例如 `+05:30` | 使用時區 ID |
| 在 Windows 上使用 `FindSystemTimeZoneById("Asia/Colombo")` | 使用 `TZConvert.GetTimeZoneInfo("Asia/Colombo")` |
| 比較來自不同時區的在地 `DateTime` 值 | 比較 UTC 或使用 `DateTimeOffset` |
| 建立 `DateTime` 時未指定其 Kind 語意 | 使用 `Utc`、`Local` 或深思熟慮過的 `Unspecified` |

## 決策指南 (Decision Guide)

- 僅在具有 Windows ID 的純 Windows 程式碼中使用 `TimeZoneInfo`。
- 對於大多數跨平台應用程式，使用 `TimeZoneConverter`。
- 當 DST 運算或行事曆準確性為核心需求時，使用 `NodaTime`。
- 對於 API 與序列化的時間戳記，使用 `DateTimeOffset`。
