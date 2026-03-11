# Oracle 到 PostgreSQL：CURRENT_TIMESTAMP 與 NOW() 時區處理 (CURRENT_TIMESTAMP and NOW() Timezone Handling)

## 目錄 (Contents)

- 問題 (Problem)
- 行為比較 (Behavior Comparison)
- PostgreSQL 時區優先權 (PostgreSQL Timezone Precedence)
- 常見錯誤症狀 (Common Error Symptoms)
- 遷移行動 — Npgsql 設定、DateTime 正規化、預存程序、工作階段時區、應用程式程式碼 (Migration Actions)
- 整合測試模式 (Integration Test Patterns)
- 檢核表 (Checklist)

## 問題 (Problem)

Oracle 的 `CURRENT_TIMESTAMP` 會回傳**工作階段時區 (session timezone)** 中的值，並將其儲存在欄位宣告的精度中。當 .NET 透過 ODP.NET 讀回此值時，它會呈現為 `Kind=Local` 的 `DateTime`，反映用戶端的作業系統 (OS) 時區。

PostgreSQL 的 `CURRENT_TIMESTAMP` 與 `NOW()` 都會回傳錨定於 **UTC** 的 `timestamptz` (帶時區的時戳 (timestamp with time zone))，無論工作階段時區設定為何。Npgsql 如何呈現此值取決於驅動程式版本與設定：

- **Npgsql < 6 / 舊版模式 (`EnableLegacyTimestampBehavior = true`)：** `timestamptz` 欄位會以 `Kind=Unspecified` 的 `DateTime` 回傳。這是從 Oracle 遷移時發生隱性時區錯誤的根源。
- **停用舊版模式的 Npgsql 6+ (新預設值)：** `timestamptz` 欄位會以 `Kind=Utc` 的 `DateTime` 回傳，且在插入時寫入 `Kind=Unspecified` 的值會擲出例外。

尚未升級至 Npgsql 6+ 或明確選擇恢復舊版模式的專案，仍容易受到 `Kind=Unspecified` 問題的影響。這種不匹配 — 以及意外重新啟用舊版模式的難易度 — 會導致隱性資料損壞、錯誤的比較，以及極難追蹤的 N 小時誤差。

---

## 行為比較 (Behavior Comparison)

| 面向 | Oracle | PostgreSQL |
|---|---|---|
| `CURRENT_TIMESTAMP` 類型 | `TIMESTAMP WITH LOCAL TIME ZONE` | `timestamptz` (UTC 正規化) |
| 透過驅動程式獲取的用戶端 `DateTime.Kind` | `Local` | `Unspecified` (Npgsql < 6 / 舊版模式)；`Utc` (Npgsql 6+ 預設) |
| 工作階段時區影響 | 是 — 影響儲存/回傳的值 | 僅影響**顯示**；內部儲存 UTC |
| NOW() 等效項 | `SYSDATE` / `CURRENT_TIMESTAMP` | `NOW()` = `CURRENT_TIMESTAMP` (兩者皆回傳 `timestamptz`) |
| 比較時的隱式轉換 | Oracle 套用工作階段時區偏移量 | PostgreSQL 比較 UTC；工作階段時區僅供顯示 |

---

## PostgreSQL 時區優先權 (PostgreSQL Timezone Precedence)

PostgreSQL 使用下列階層解析有效的工作階段時區 (最高優先權勝出)：

| 層級 | 設定方式 |
|---|---|
| **工作階段 (Session)** | 在開啟連線時傳送 `SET TimeZone = 'UTC'` |
| **角色 (Role)** | `ALTER ROLE app_user SET TimeZone = 'UTC'` |
| **資料庫 (Database)** | `ALTER DATABASE mydb SET TimeZone = 'UTC'` |
| **伺服器 (Server)** | `postgresql.conf` → `TimeZone = 'America/New_York'` |

工作階段時區**不會**影響 `timestamptz` 欄位中儲存的 UTC 值 — 它僅控制 `SHOW timezone` 與 `::text` 轉型如何格式化用於顯示的值。若伺服器的預設時區不是 UTC，依賴 `DateTime.Kind` 或在沒有明確時區的情況下比較時戳的應用程式程式碼可能會產出不正確的結果。

---

## 常見錯誤症狀 (Common Error Symptoms)

- 從 PostgreSQL 讀取的時戳具有 `Kind=Unspecified`；與 `DateTime.UtcNow` 或 `DateTime.Now` 的比較會產出不正確的結果。
- 日期範圍查詢回傳的資料列過多或過少，因為 WHERE 子句比較是在與儲存的 UTC 值不同的時區中進行評估的。
- 整合測試在開發人員機器 (UTC 作業系統時區) 上通過，但在 CI 或生產環境 (非 UTC 時區) 中失敗。
- 帶有時戳的預存程序輸出參數抵達時帶有伺服器套用的工作階段偏移量，但在應用程式中卻與 UTC 值進行比較。

---

## 遷移行動 (Migration Actions)

### 1. 透過連線字串或 AppContext 為 UTC 設定 Npgsql

Npgsql 6+ 出貨時預設將 `EnableLegacyTimestampBehavior` 設定為 `false`，這會導致 `timestamptz` 值以 `Kind=Utc` 的 `DateTime` 回傳。仍建議在啟動時明確設定此參數，以防止意外啟用舊版模式 (例如：透過設定檔或遞移相依項目)，並讓未來的維護人員能看到此意圖：

```csharp
// Program.cs / Startup.cs — 在應用程式啟動時套用一次
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);
```

停用此參數後，如果您嘗試將 `Kind=Unspecified` 的 `DateTime` 寫入 `timestamptz` 欄位，Npgsql 會擲出例外，這使得時區錯誤在插入時就會被察覺，而不是在查詢時靜默發生。

### 2. 在持久化前正規化 DateTime 值

在整個遷移後的程式碼庫中，將任何 `DateTime.Now` 替換為 `DateTime.UtcNow`。對於源自外部輸入的值 (例如：從 JSON 反序列化的使用者提供日期)，請確保在儲存前將其轉換為 UTC：

```csharp
// 之前 (Oracle 時代的程式碼 — 依賴工作階段/作業系統時區)
var timestamp = DateTime.Now;

// 之後 (與 PostgreSQL 相容)
var timestamp = DateTime.UtcNow;

// 針對外部提供的值
var utcTimestamp = dateTimeInput.Kind == DateTimeKind.Utc
    ? dateTimeInput
    : dateTimeInput.ToUniversalTime();
```

### 3. 修正使用 CURRENT_TIMESTAMP / NOW() 的預存程序

必須檢閱將 `CURRENT_TIMESTAMP` 或 `NOW()` 指派給 `timestamp without time zone` (`timestamp`) 欄位的預存程序。偏好使用 `timestamptz` 欄位或明確進行轉型：

```sql
-- 模糊：伺服器時區會影響解讀
INSERT INTO audit_log (created_at) VALUES (NOW()::timestamp);

-- 安全：一律為 UTC
INSERT INTO audit_log (created_at) VALUES (NOW() AT TIME ZONE 'UTC');

-- 或：使用 timestamptz 欄位類型，讓 PostgreSQL 原生儲存 UTC
INSERT INTO audit_log (created_at) VALUES (CURRENT_TIMESTAMP);
```

### 4. 在開啟連線時強制設定工作階段時區 (深度防禦)

不論角色或資料庫預設值為何，在開啟連線時明確設定工作階段時區。這可確保行為一致，不受伺服器設定影響：

```csharp
// Npgsql 連線字串方法
var connString = "Host=localhost;Database=mydb;Username=app;Password=...;Timezone=UTC";

// 或：透過 NpgsqlDataSourceBuilder 套用
var dataSource = new NpgsqlDataSourceBuilder(connString)
    .Build();

// 或：在每個新連線上執行
await using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand("SET TimeZone = 'UTC'", conn);
await cmd.ExecuteNonQueryAsync();
```

### 5. 應用程式程式碼 — 避免 DateTime.Kind=Unspecified

稽核所有讀取時戳欄位的存放庫與資料存取程式碼。若 Npgsql 回傳 `Unspecified`，請全域設定資料來源 (上方選項 1) 或包裝讀取操作：

```csharp
// 安全的讀取協助程式 — 在邊界處將 Unspecified 轉換為 Utc
DateTime ReadUtcDateTime(NpgsqlDataReader reader, int ordinal)
{
    var dt = reader.GetDateTime(ordinal);
    return dt.Kind == DateTimeKind.Unspecified
        ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
        : dt.ToUniversalTime();
}
```

---

## 整合測試模式 (Integration Test Patterns)

### 測試：驗證時戳是否正確持久化並以 UTC 回傳

```csharp
[Fact]
public async Task InsertedTimestamp_ShouldRoundTripAsUtc()
{
    var before = DateTime.UtcNow;

    await repository.InsertAuditEntryAsync(/* ... */);

    var retrieved = await repository.GetLatestAuditEntryAsync();

    Assert.Equal(DateTimeKind.Utc, retrieved.CreatedAt.Kind);
    Assert.True(retrieved.CreatedAt >= before,
        "持久化的 CreatedAt 不應早於插入前的 UTC 時戳。");
}
```

### 測試：驗證跨 Oracle 與 PostgreSQL 基準線的時戳比較

```csharp
[Fact]
public async Task TimestampComparison_ShouldReturnSameRowsAsOracle()
{
    var cutoff = DateTime.UtcNow.AddDays(-1);

    var oracleResults = await oracleRepository.GetEntriesAfter(cutoff);
    var postgresResults = await postgresRepository.GetEntriesAfter(cutoff);

    Assert.Equal(oracleResults.Count, postgresResults.Count);
}
```

---

## 檢核表 (Checklist)

- [ ] 在應用程式啟動時套用 `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false)`。
- [ ] 資料存取程式碼中所有的 `DateTime.Now` 用法皆已替換為 `DateTime.UtcNow`。
- [ ] 連線字串或連線開啟勾點已設定 `Timezone=UTC` / `SET TimeZone = 'UTC'`。
- [ ] 已檢閱使用 `CURRENT_TIMESTAMP` 或 `NOW()` 的預存程序；`timestamp without time zone` 欄位已明確轉型或替換為 `timestamptz`。
- [ ] 整合測試斷言擷取的時戳值為 `DateTime.Kind == Utc`。
- [ ] 測試涵蓋日期範圍查詢，以確認資料列計數與 Oracle 基準線相符。
