# Oracle 到 PostgreSQL：並行交易處理 (Concurrent Transaction Handling)

## 目錄

- 概觀
- 核心差異
- 常見錯誤症狀
- 問題情境
- 解決方案 — 具體化結果、獨立連線、單一查詢
- 偵測策略
- 需留意的錯誤訊息
- 比較表
- 最佳實踐
- 遷移檢核表

## 概觀 (Overview)

從 Oracle 遷移到 PostgreSQL 時，在處理**單一資料庫連線上的並行操作**方面存在關鍵差異。Oracle 的 ODP.NET 驅動程式允許在同一連線上同時有多個作用中的指令和結果集，而 PostgreSQL 的 Npgsql 驅動程式則強制執行嚴格的**每個連線僅限一個作用中指令**規則。如果在 PostgreSQL 中並行操作共用一個連線，原本在 Oracle 中順暢執行的程式碼將會擲出執行階段例外。

## 核心差異 (The Core Difference)

**Oracle 行為：**

- 單一連線可以有多個同時執行的作用中指令
- 允許在另一個 `DataReader` 仍開啟時開啟第二個 `DataReader`
- 同一連線上巢狀或重疊的資料庫呼叫可透明地運作

**PostgreSQL 行為：**

- 一個連線**一次僅支援一個作用中的指令**
- 嘗試在 `DataReader` 開啟時執行第二個指令會擲出例外
- 延遲載入 (Lazy-loaded) 的導覽屬性或由回呼驅動的讀取，若觸發同一連線上的額外查詢，將會失敗

## 常見錯誤症狀 (Common Error Symptoms)

在未考慮此差異的情況下遷移 Oracle 程式碼時：

```
System.InvalidOperationException: An operation is already in progress.
```

```
Npgsql.NpgsqlOperationInProgressException: A command is already in progress: <SQL text>
```

當應用程式程式碼嘗試在已有作用中 `DataReader` 或未提交指令的連線上執行新指令時，就會發生這些錯誤。

---

## 問題情境 (Problem Scenarios)

### 情境 1：在執行另一個指令時反覆運算 DataReader

```csharp
using (var reader = command1.ExecuteReader())
{
    while (reader.Read())
    {
        // 問題：在 reader 仍開啟時，
        // 於同一個連線上執行第二個指令
        using (var command2 = new NpgsqlCommand("SELECT ...", connection))
        {
            var value = command2.ExecuteScalar(); // 失敗 (FAILS)
        }
    }
}
```

### 情境 2：資料存取層中的延遲載入 / 延遲執行

```csharp
// Oracle：可運作，因為 ODP.NET 支援並行 Reader
var items = repository.GetItems(); // 回傳由開啟的 DataReader 支援的 IEnumerable
foreach (var item in items)
{
    // 問題：觸發同一連線上的第二次查詢
    var details = repository.GetDetails(item.Id); // 在 PostgreSQL 上失敗
}
```

### 情境 3：透過應用程式程式碼進行巢狀預存程序呼叫

```csharp
// Oracle：ODP.NET 處理多個作用中指令
command1.ExecuteNonQuery(); // 開始一個長時間運行的操作
command2.ExecuteScalar();   // 在 PostgreSQL 上失敗 — command1 仍在進行中
```

---

## 解決方案 (Solutions)

### 解決方案 1：在發出新指令前先具體化結果 (建議做法)

在同一個連線上執行後續指令之前，先將第一個結果集載入記憶體以關閉它。

```csharp
// 先將所有結果載入清單
var items = new List<Item>();
using (var reader = command1.ExecuteReader())
{
    while (reader.Read())
    {
        items.Add(MapItem(reader));
    }
} // reader 在此處關閉並釋放

// 現在可以安全地在同一個連線上執行另一個指令
foreach (var item in items)
{
    using (var command2 = new NpgsqlCommand("SELECT ...", connection))
    {
        command2.Parameters.AddWithValue("id", item.Id);
        var value = command2.ExecuteScalar(); // 可運作
    }
}
```

針對 LINQ / EF Core 情境，使用 `.ToList()` 強制具體化 (Materialization)：

```csharp
// 之前 (在 PostgreSQL 上失敗 — 延遲執行使連線處於忙碌狀態)
var items = dbContext.Items.Where(i => i.Active);
foreach (var item in items)
{
    var details = dbContext.Details.FirstOrDefault(d => d.ItemId == item.Id);
}

// 之後 (在發出第二次查詢前先具體化第一次查詢)
var items = dbContext.Items.Where(i => i.Active).ToList();
foreach (var item in items)
{
    var details = dbContext.Details.FirstOrDefault(d => d.ItemId == item.Id);
}
```

### 解決方案 2：針對並行操作使用獨立連線

當操作確實需要並行執行時，為每個操作開啟專用連線。

```csharp
using (var reader = command1.ExecuteReader())
{
    while (reader.Read())
    {
        // 針對巢狀查詢使用獨立連線
        using (var connection2 = new NpgsqlConnection(connectionString))
        {
            connection2.Open();
            using (var command2 = new NpgsqlCommand("SELECT ...", connection2))
            {
                var value = command2.ExecuteScalar(); // 可運作 — 不同的連線
            }
        }
    }
}
```

### 解決方案 3：重構為單一查詢

在可能的情況下，使用 JOIN 或子查詢將巢狀查閱合併為單一查詢，以完全消除對並行指令的需求。

```csharp
// 之前：同一個連線上的兩個連續查詢
var order = GetOrder(orderId);          // 查詢 1
var details = GetOrderDetails(orderId); // 查詢 2 (若查詢 1 的 Reader 仍開啟則失敗)

// 之後：使用 JOIN 的單一查詢
using (var command = new NpgsqlCommand(
    "SELECT o.*, d.* FROM orders o JOIN order_details d ON o.id = d.order_id WHERE o.id = @id",
    connection))
{
    command.Parameters.AddWithValue("id", orderId);
    using (var reader = command.ExecuteReader())
    {
        // 處理合併後的結果集
    }
}
```

---

## 偵測策略 (Detection Strategy)

### 程式碼檢閱檢核表

- [ ] 搜尋開啟 `DataReader` 並在關閉前呼叫其他資料庫方法的動作
- [ ] 尋找資料存取方法中會延遲執行的 `IEnumerable` 回傳型別（代表開啟的 Reader）
- [ ] 識別未加上 `.ToList()` / `.ToArray()` 且在發出進一步查詢時進行反覆運算的 EF Core 查詢
- [ ] 檢查應用程式程式碼中是否有共用連線的巢狀預存程序呼叫

### 常見搜尋位置

- 資料存取層與存放庫類別
- 編排多個存放庫呼叫的服務方法
- 反覆運算查詢結果並對每列執行查閱的程式碼路徑
- 在資料反覆運算期間觸發的事件處理常式或回呼

### 搜尋模式 (Search Patterns)

```regex
ExecuteReader\(.*\)[\s\S]*?Execute(Scalar|NonQuery|Reader)\(
```

```regex
\.Where\(.*\)[\s\S]*?foreach[\s\S]*?dbContext\.
```

---

## 需留意的錯誤訊息 (Error Messages to Watch For)

| 錯誤訊息 | 可能原因 |
|---------------|--------------|
| `An operation is already in progress` | 在同一個連線上，當 `DataReader` 開啟時執行了第二個指令 |
| `A command is already in progress: <SQL>` | Npgsql 偵測到單一連線上重疊的指令執行 |
| `The connection is already in state 'Executing'` | 並行使用導致的連線狀態衝突 |

---

## 比較表：Oracle vs. PostgreSQL (Comparison Table)

| 面向 | Oracle (ODP.NET) | PostgreSQL (Npgsql) |
|--------|------------------|---------------------|
| **並行指令** | 每個連線多個作用中指令 | 每個連線一個作用中指令 |
| **多個開啟的 DataReader** | 支援 | 不支援 — 必須先關閉/具體化 |
| **反覆運算期間的巢狀資料庫呼叫** | 透明運作 | 擲出 `InvalidOperationException` |
| **延遲執行安全性** | 可安全地反覆運算與查詢 | 必須在發出新查詢前具體化 (`.ToList()`) |
| **連線集區影響** | 較低的連線需求 | 若大量使用解決方案 2，可能需要更多集區連線 |

---

## 最佳實踐 (Best Practices)

1. **儘早具體化** — 在反覆運算並發出進一步資料庫呼叫之前，先對查詢結果呼叫 `.ToList()` 或 `.ToArray()`。這是最簡單且最可靠的修復方法。

2. **稽核資料存取模式** — 檢閱所有存放庫與資料存取方法，尋找呼叫端在反覆運算時會發出額外查詢的延遲執行回傳型別 (`IEnumerable`, `IQueryable`)。

3. **偏好單一查詢** — 在可行的情況下，將巢狀查閱合併為 JOIN 或子查詢，以完全消除並行指令模式。

4. **必要時隔離連線** — 如果確實需要並行操作，請使用獨立連線而非嘗試共用。

5. **測試反覆運算工作流程** — 整合測試應涵蓋程式碼反覆運算結果集並對每列執行額外資料庫操作的情境，因為這些是最常見的失敗點。

## 遷移檢核表 (Migration Checklist)

- [ ] 識別所有並行執行多個指令於單一連線的程式碼路徑
- [ ] 找出由開啟的 Reader 支援延遲執行的 `IEnumerable` 資料存取方法
- [ ] 在延遲結果與進一步查詢一併反覆運算的地方，加入 `.ToList()` / `.ToArray()` 具體化
- [ ] 在適當時，將巢狀資料庫呼叫重構為使用獨立連線或合併查詢
- [ ] 驗證 EF Core 導覽屬性與延遲載入不會觸發並行連線使用
- [ ] 更新整合測試以涵蓋反覆運算資料存取模式
- [ ] 如果廣泛使用解決方案 2 (獨立連線)，請對連線集區大小進行負載測試

## 參考資料 (References)

- [Npgsql 文件：基礎用法](https://www.npgsql.org/doc/basic-usage.html)
- [PostgreSQL 文件：並行控制 (Concurrency Control)](https://www.postgresql.org/docs/current/mvcc.html)
- [Npgsql GitHub：多重作用中結果集 (MARS) 討論](https://github.com/npgsql/npgsql/issues/462)
