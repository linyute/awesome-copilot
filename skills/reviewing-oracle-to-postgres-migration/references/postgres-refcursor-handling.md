# Oracle 到 PostgreSQL：用戶端應用程式中的 Refcursor 處理 (Refcursor Handling in Client Applications)

## 核心差異 (The Core Difference)

Oracle 的驅動程式會自動解開 `SYS_REFCURSOR` 輸出參數，直接在資料讀取器 (Data Reader) 中呈現結果集。而 PostgreSQL 的 Npgsql 驅動程式則是回傳一個**游標名稱** (例如：`"<unnamed portal 1>"` )。用戶端必須發出額外的 `FETCH ALL FROM "<cursor_name>"` 指令來擷取實際的資料列。

若未考慮到此差異，會導致：

```
System.IndexOutOfRangeException: Field not found in row: <column_name>
```

這是因為讀取器僅包含游標名稱參數，而非預期的結果欄位。

> **交易需求：** PostgreSQL 的 Refcursor 的範圍限定於交易內。預存程序呼叫與 `FETCH` 都必須在同一個明確的交易中執行，否則游標可能會在自動提交 (Autocommit) 機制下於擷取完成前關閉。

## 解決方案：明確解開 Refcursor (C#)

```csharp
public IEnumerable<User> GetUsers(int departmentId)
{
    var users = new List<User>();
    using var connection = new NpgsqlConnection(connectionString);
    connection.Open();

    // Refcursor 的範圍限定於交易內 — 將呼叫與 FETCH 包裝在同一個交易中。
    using var tx = connection.BeginTransaction();

    using var command = new NpgsqlCommand("get_users", connection, tx)
    {
        CommandType = CommandType.StoredProcedure
    };
    command.Parameters.AddWithValue("p_department_id", departmentId);
    var refcursorParam = new NpgsqlParameter("cur_result", NpgsqlDbType.Refcursor)
    {
        Direction = ParameterDirection.Output
    };
    command.Parameters.Add(refcursorParam);

    // 執行程序以開啟游標。
    command.ExecuteNonQuery();

    // 取得游標名稱，然後擷取實際資料。
    string cursorName = (string)refcursorParam.Value;
    using var fetchCommand = new NpgsqlCommand($"FETCH ALL FROM \"{cursorName}\"", connection, tx);
    using var reader = fetchCommand.ExecuteReader();
    while (reader.Read())
    {
        users.Add(new User
        {
            UserId   = reader.GetInt32(reader.GetOrdinal("user_id")),
            UserName = reader.GetString(reader.GetOrdinal("user_name")),
            Email    = reader.GetString(reader.GetOrdinal("email"))
        });
    }

    tx.Commit();
    return users;
}
```

## 可重複使用的協助程式 (Reusable Helper)

從協助程式回傳作用中的 `NpgsqlDataReader` 會導致底層的 `NpgsqlCommand` 未被釋放，並造成權責不明。建議改在協助程式內部具體化 (Materialize) 結果：

```csharp
public static class PostgresHelpers
{
    public static List<T> ExecuteRefcursorProcedure<T>(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        string procedureName,
        Dictionary<string, object> parameters,
        string refcursorParameterName,
        Func<NpgsqlDataReader, T> map)
    {
        using var command = new NpgsqlCommand(procedureName, connection, transaction)
        {
            CommandType = CommandType.StoredProcedure
        };
        foreach (var (key, value) in parameters)
            command.Parameters.AddWithValue(key, value);

        var refcursorParam = new NpgsqlParameter(refcursorParameterName, NpgsqlDbType.Refcursor)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(refcursorParam);
        command.ExecuteNonQuery();

        string cursorName = (string)refcursorParam.Value;
        if (string.IsNullOrEmpty(cursorName))
            return new List<T>();

        // fetchCommand 在此處釋放；結果在回傳前已完全具體化。
        using var fetchCommand = new NpgsqlCommand($"FETCH ALL FROM \"{cursorName}\"", connection, transaction);
        using var reader = fetchCommand.ExecuteReader();

        var results = new List<T>();
        while (reader.Read())
            results.Add(map(reader));
        return results;
    }
}

// 用法：
using var connection = new NpgsqlConnection(connectionString);
connection.Open();
using var tx = connection.BeginTransaction();

var users = PostgresHelpers.ExecuteRefcursorProcedure(
    connection, tx,
    "get_users",
    new Dictionary<string, object> { { "p_department_id", departmentId } },
    "cur_result",
    r => new User
    {
        UserId   = r.GetInt32(r.GetOrdinal("user_id")),
        UserName = r.GetString(r.GetOrdinal("user_name")),
        Email    = r.GetString(r.GetOrdinal("email"))
    });

tx.Commit();
```

## Oracle vs. PostgreSQL 總結 (Summary)

| 面向 | Oracle (ODP.NET) | PostgreSQL (Npgsql) |
|--------|------------------|---------------------|
| **游標回傳** | 結果集直接呈現於資料讀取器中 | 游標名稱字串儲存於輸出參數中 |
| **資料存取** | `ExecuteReader()` 立即回傳資料列 | `ExecuteNonQuery()` → 取得游標名稱 → `FETCH ALL FROM` |
| **交易** | 透明運作 | 呼叫 (CALL) 與擷取 (FETCH) 必須共用同一個交易 |
| **多個游標** | 自動化 | 每個游標都需要獨立的 `FETCH` 指令 |
| **資源存續期** | 由驅動程式管理 | 游標維持開啟狀態，直到被擷取或交易結束 |

## 遷移檢核表 (Migration Checklist)

- [ ] 識別所有回傳 `SYS_REFCURSOR` (Oracle) / `refcursor` (PostgreSQL) 的預存程序
- [ ] 將 `ExecuteReader()` 替換為 `ExecuteNonQuery()` → 取得游標名稱 → `FETCH ALL FROM`
- [ ] 將每對「呼叫與擷取」包裝在明確的交易中
- [ ] 確保指令與讀取器皆已釋放（偏好在協助程式內部具體化結果）
- [ ] 更新單元測試與整合測試

## 參考資料 (References)

- [PostgreSQL 文件：游標 (Cursors)](https://www.postgresql.org/docs/current/plpgsql-cursors.html)
- [PostgreSQL FETCH 指令](https://www.postgresql.org/docs/current/sql-fetch.html)
- [Npgsql Refcursor 支援](https://github.com/npgsql/npgsql/issues/1887)
