# .NET 時區參考索引 ( .NET Timezone Reference Index)

## Windows 與 IANA 對應

使用此檔案查詢 Windows 時區 ID 與 IANA 時區 ID 之間的常見對應關係。

### 亞洲與太平洋地區 (Asia And Pacific)

| 顯示名稱 | Windows ID | IANA ID | UTC 位移量 | DST? |
| --- | --- | --- | --- | --- |
| 斯里蘭卡標準時間 | Sri Lanka Standard Time | Asia/Colombo | +05:30 | 否 |
| 印度標準時間 | India Standard Time | Asia/Calcutta | +05:30 | 否 |
| 巴基斯坦標準時間 | Pakistan Standard Time | Asia/Karachi | +05:00 | 否 |
| 孟加拉標準時間 | Bangladesh Standard Time | Asia/Dhaka | +06:00 | 否 |
| 尼泊爾標準時間 | Nepal Standard Time | Asia/Katmandu | +05:45 | 否 |
| 東南亞標準時間 | SE Asia Standard Time | Asia/Bangkok | +07:00 | 否 |
| 新加坡標準時間 | Singapore Standard Time | Asia/Singapore | +08:00 | 否 |
| 中國標準時間 | China Standard Time | Asia/Shanghai | +08:00 | 否 |
| 東京標準時間 | Tokyo Standard Time | Asia/Tokyo | +09:00 | 否 |
| 韓國標準時間 | Korea Standard Time | Asia/Seoul | +09:00 | 否 |
| 澳洲東部標準時間 | AUS Eastern Standard Time | Australia/Sydney | +10:00/+11:00 | 是 |
| 紐西蘭標準時間 | New Zealand Standard Time | Pacific/Auckland | +12:00/+13:00 | 是 |
| 阿拉伯標準時間 | Arabian Standard Time | Asia/Dubai | +04:00 | 否 |
| 阿拉伯標準時間 (Arab) | Arab Standard Time | Asia/Riyadh | +03:00 | 否 |
| 以色列標準時間 | Israel Standard Time | Asia/Jerusalem | +02:00/+03:00 | 是 |
| 土耳其標準時間 | Turkey Standard Time | Europe/Istanbul | +03:00 | 否 |

### 歐洲 (Europe)

| 顯示名稱 | Windows ID | IANA ID | UTC 位移量 | DST? |
| --- | --- | --- | --- | --- |
| 協調世界時 | UTC | Etc/UTC | +00:00 | 否 |
| 格林威治標準時間 | GMT Standard Time | Europe/London | +00:00/+01:00 | 是 |
| 西歐標準時間 | W. Europe Standard Time | Europe/Berlin | +01:00/+02:00 | 是 |
| 中歐標準時間 | Central Europe Standard Time | Europe/Budapest | +01:00/+02:00 | 是 |
| 羅曼標準時間 | Romance Standard Time | Europe/Paris | +01:00/+02:00 | 是 |
| 東歐標準時間 | E. Europe Standard Time | Asia/Nicosia | +02:00/+03:00 | 是 |
| GTB 標準時間 | GTB Standard Time | Europe/Bucharest | +02:00/+03:00 | 是 |
| 俄羅斯標準時間 | Russian Standard Time | Europe/Moscow | +03:00 | 否 |

### 美洲 (Americas)

| 顯示名稱 | Windows ID | IANA ID | UTC 位移量 | DST? |
| --- | --- | --- | --- | --- |
| 東部標準時間 | Eastern Standard Time | America/New_York | -05:00/-04:00 | 是 |
| 中部標準時間 | Central Standard Time | America/Chicago | -06:00/-05:00 | 是 |
| 山區標準時間 | Mountain Standard Time | America/Denver | -07:00/-06:00 | 是 |
| 太平洋標準時間 | Pacific Standard Time | America/Los_Angeles | -08:00/-07:00 | 是 |
| 阿拉斯加標準時間 | Alaskan Standard Time | America/Anchorage | -09:00/-08:00 | 是 |
| 夏威夷標準時間 | Hawaiian Standard Time | Pacific/Honolulu | -10:00 | 否 |
| 加拿大中部標準時間 | Canada Central Standard Time | America/Regina | -06:00 | 否 |
| 南美東部標準時間 | SA Eastern Standard Time | America/Cayenne | -03:00 | 否 |
| 巴西東部標準時間 | E. South America Standard Time | America/Sao_Paulo | -03:00/-02:00 | 是 |

### 非洲 (Africa)

| 顯示名稱 | Windows ID | IANA ID | UTC 位移量 | DST? |
| --- | --- | --- | --- | --- |
| 南非標準時間 | South Africa Standard Time | Africa/Johannesburg | +02:00 | 否 |
| 埃及標準時間 | Egypt Standard Time | Africa/Cairo | +02:00 | 否 |
| 東非標準時間 | E. Africa Standard Time | Africa/Nairobi | +03:00 | 否 |
| 中西部非洲標準時間 | W. Central Africa Standard Time | Africa/Lagos | +01:00 | 否 |
| 摩洛哥標準時間 | Morocco Standard Time | Africa/Casablanca | +00:00/+01:00 | 是 |

## NodaTime 提供者 (NodaTime Providers)

```csharp
DateTimeZoneProviders.Tzdb["Asia/Colombo"]
DateTimeZoneProviders.Bcl["Sri Lanka Standard Time"]
```

## TimeZoneConverter 範例

```csharp
string ianaId = TZConvert.WindowsToIana("Sri Lanka Standard Time");
string windowsId = TZConvert.IanaToWindows("Asia/Colombo");
TimeZoneInfo tz = TZConvert.GetTimeZoneInfo("Asia/Colombo");
```

## 程式化搜尋

```csharp
foreach (var tz in TimeZoneInfo.GetSystemTimeZones())
{
    Console.WriteLine($"ID: {tz.Id} | 顯示名稱: {tz.DisplayName}");
}
```
