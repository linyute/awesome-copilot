# 查詢、分頁、批次處理

## 分頁

### Offset 分頁

```java
List<Order> orders = em.createQuery("select o from Order o order by o.createdAt desc, o.id desc", Order.class)
    .setFirstResult(page * size)
    .setMaxResults(size)
    .getResultList();
```

- 務必包含具確定性的 `ORDER BY` 並附帶唯一 tiebreaker 排序鍵（`id`）。
- 龐大的 offset 速度緩慢（資料庫會掃描並丟棄資料列）。針對深度分頁請使用 keyset 分頁。

### 集合 fetch join + 分頁 (HHH000104)

```java
// 反模式
em.createQuery("select o from Order o join fetch o.lines", Order.class)
  .setMaxResults(20).getResultList();
```

Hibernate 會記錄 `HHH000104: firstResult/maxResults specified with collection fetch; applying in memory`（Hibernate 6 為：`HHH90003004`）。它會載入**所有**符合條件的資料列並在 JVM 中進行分頁：記憶體與延遲將會爆炸式增長。

修正方式（拆為兩次查詢）：

```java
List<Long> ids = em.createQuery("select o.id from Order o where exists (select 1 from o.lines) order by o.createdAt desc, o.id desc", Long.class)
    .setMaxResults(20).getResultList();

List<Order> orders = em.createQuery(
    "select distinct o from Order o join fetch o.lines where o.id in :ids order by o.createdAt desc, o.id desc",
    Order.class).setParameter("ids", ids).getResultList();
```

`exists` 篩選條件符合 inner `join fetch` 的行為（會排除沒有 lines 的訂單）；若使用 `left join fetch` 則可去除該篩選條件以保留它們。替代方案：在分頁查詢中僅 fetch to-one 關聯，並對集合依賴 `@BatchSize`/`default_batch_fetch_size`；或使用 DTO 投影。在 `@ManyToOne` 上的 fetch join 搭配分頁是安全的。

### Keyset（尋徑 seek）分頁

```java
List<Order> next = em.createQuery("""
    select o from Order o
    where (o.createdAt < :ts or (o.createdAt = :ts and o.id < :id))
    order by o.createdAt desc, o.id desc
    """, Order.class)
  .setParameter("ts", lastTs).setParameter("id", lastId)
  .setMaxResults(size).getResultList();
```

需要排序資料行上的索引（`created_at desc, id desc`），每頁時間恆定，在有資料插入時依然穩定；不支援「跳至第 N 頁」。回傳由最後一列的排序值組成的不透明游標（opaque cursor）。Hibernate 6.5+/7 在 `SelectionQuery` 上亦具備 `KeyedPage`/`KeyedResultList` API；請查閱您版本的說明文件。

### 總數計算

每頁執行獨立的 `count` 查詢代價昂貴；當 UI 能改用「是否有下一頁」時（擷取 `size + 1` 列）可略過計算總數。

## JDBC 批次處理（新增與更新）

以正整數設定批次大小啟用 JDBC 批次處理：

```properties
hibernate.jdbc.batch_size=50
```

Hibernate 可對搭配 sequence、UUID 或手動指派識別碼的實體進行新增批次處理。`IDENTITY` 會阻止實體**新增**的 JDBC 批次處理，因為 Hibernate 必須執行每次 insert 以取得其產生的 id；但它不會阻止更新的批次處理。切勿僅為了啟用批次處理而在未評估其他權衡的情況下變更現有的識別碼策略。

選用調校（需對照實際資料庫與驅動程式進行量測）：

```properties
hibernate.order_inserts=true
hibernate.order_updates=true
hibernate.jdbc.batch_versioned_data=true
```

對陳述式進行排序可將相容的操作分組，且 PostgreSQL 的 `reWriteBatchedInserts=true` / MySQL 的 `rewriteBatchedStatements=true` 可能改善驅動程式吞吐量；陳述式排序與驅動程式 rewrite 旗標均非 Hibernate JDBC 批次處理的先決條件。變更設定前請檢查 dialect、驅動程式與 Hibernate 版本。

大量寫入的撰寫模式：

```java
for (int i = 0; i < items.size(); i++) {
    em.persist(items.get(i));
    if ((i + 1) % batchSize == 0) {
        em.flush();
        em.clear();      // 釋放記憶體與 dirty-checking 開銷
    }
}
```

保持 `batchSize` 等於 `hibernate.jdbc.batch_size`。若可接受部分進度保存，可分塊進行 commit（各自獨立的交易）。

在 `clear()` 之後參照的實體處於分離狀態；請重新載入或使用 `getReference`。

## 大量作業與 StatelessSession

- 跨多列的更新：基於集合操作的 `update Order o set o.status = :s where ...`（會繞過生命週期回呼、除非標明 `versioned` 否則繞過 `@Version`，並繞過 cascade；Hibernate 會自動使受影響的二級快取區域失效，但目前持續性上下文中的受管實體會過期，因此請在執行前排清，執行後清理 context 或重新整理實體）。
- 純粹的 ETL/匯入：使用 `StatelessSession`（無持續性上下文、無 dirty checking、無 cascade）搭配 `insert`/`update`。
  - Hibernate 6：它會繞過二級快取，並使用 `hibernate.jdbc.batch_size` 進行 JDBC 批次處理。
  - Hibernate 7：預設使用二級快取（若不需要可依個別 session 停用），且 `hibernate.jdbc.batch_size` 對其無效；需透過 `StatelessSession.setJdbcBatchSize(n)` 設定批次大小，並優先使用批次操作 `insertMultiple`/`updateMultiple`/`upsertMultiple`/`deleteMultiple`。
  - 請確認您精確版本的 API。
- 串流讀取：使用 `query.getResultStream()`/`scroll` 搭配 `hibernate.jdbc.fetch_size`；關閉串流並定期清理 context。許多驅動程式（如 PostgreSQL）僅在關閉 autocommit 且設定了 fetch size 的交易內部才支援串流。

## 查詢健全常規

- 綁定參數；切勿將使用者輸入串接至 JPQL/原生 SQL 中。
- `IN` 清單：龐大的清單會撐爆 SQL 快取；Hibernate 透過 `hibernate.query.in_clause_parameter_padding=true` 對參數進行填充，且資料庫對參數數量亦有上限，因此請進行分塊處理（例如 500-1000 個一組）。
- `hibernate.query.fail_on_pagination_over_collection_fetch=true` 僅在 Hibernate 真正會在記憶體中進行分頁時才擲出例外狀況。僅限 Hibernate 7.4+（7.4 查詢語言指引：「在 Hibernate 7.4 之前，limits 與多值 fetch joins 無法良好配合」；在 7.0-7.3 上，集合 fetch join 的分頁在所有 dialect 上均保留在記憶體中，因此該防護在該處很有用）。在 7.4 原始碼（`SqmQueryImpl`/`AbstractSqmSelectionQuery`）中驗證：當 dialect 支援子查詢中的 `LIMIT`/`OFFSET`（`supportsOffsetInSubquery`，在 PostgreSQL、MySQL、H2 等為 true）時，Hibernate 7.4+ 會將分頁下推至衍生資料表中，因此 `join fetch` + `setMaxResults`（以及此類查詢上的 Spring Data `Pageable`）由資料庫進行分頁，該設定絕不會觸發。它僅在 dialect 缺乏該支援時或強制進行記憶體內限制時才會觸發；否則將記錄舊有的 `HHH000104` 警告。在 7.4+ 搭配此類 dialect 時請勿將其作為防護手段：檢查產生的 SQL 是否包含 `limit`/`fetch first`，為了可攜性仍優先採用兩步驟（先查 id，再 fetch）模式。
- 針對載入實體但從不修改的讀取路徑使用 `@QueryHints(readOnly)`/`setHint("org.hibernate.readOnly", true)`。
- 為了可攜性優先使用 JPQL/HQL 或 Criteria；針對資料庫專屬功能（視窗函式、`SKIP LOCKED`、upsert）使用原生 SQL，並映射至 DTO。
- `existsBy` 風格檢查：使用 `select 1 ... fetch first 1 rows only` / `count(*) > 0` 代替載入實體。
- 檢查產生的 SQL 中是否有僅需 2 個資料行卻進行類似 `select *` 的實體載入：改用投影。
