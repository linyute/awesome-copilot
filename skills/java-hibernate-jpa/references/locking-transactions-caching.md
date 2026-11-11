# 鎖定、交易、快取

## 開放式鎖定 (Optimistic Locking，預設選擇)

```java
@Entity
class Account {
    @Version
    private long version;
}
```

- Hibernate 在 update 陳述式中加入 `WHERE version = ?`；並行的變更會擲出 `OptimisticLockException`（Hibernate: `StaleObjectStateException`）。在業務使用案例邊界處攔截它，接著重試或提示使用者重新載入。
- 使用 `Integer`/`Long`/`Instant` 作為版本型別；切勿手動修改版本。
- 搭配 DTO 來回傳輸（Web 表單）時，將版本傳送給用戶端，在提交時載入實體（`em.find`），比對提交的版本與載入的版本並拒絕不一致的請求（例如 HTTP 409）。切勿將用戶端的版本指派給受管實體：Jakarta Persistence 禁止應用程式修改版本。或者 `merge()` 一個帶有其 `@Version` 的分離實體；提供者隨後會檢查該版本並在版本過期時擲出 `OptimisticLockException`，由您在業務邊界進行處理。
- `LockModeType.OPTIMISTIC_FORCE_INCREMENT` 即使僅有子項變更也會遞增版本，這對聚合根非常實用。
- 大量 HQL 更新會忽略 `@Version`，除非寫為 `update versioned`。

## 封閉式鎖定 (Pessimistic Locking)

用於高度競爭的資料列或重試代價過高的佇列型資料表。

```java
Account a = em.find(Account.class, id, LockModeType.PESSIMISTIC_WRITE,
    Map.of("jakarta.persistence.lock.timeout", 3000));
```

- `PESSIMISTIC_WRITE` -> `SELECT ... FOR UPDATE`；`PESSIMISTIC_READ` -> 共用鎖定（視 dialect 而定）。
- 務必設定鎖定逾時；務必以一致的順序鎖定資料列以避免死結；保持交易簡短。
- 工作佇列：`FOR UPDATE SKIP LOCKED`（透過 Hibernate 的 `SKIP_LOCKED` 鎖定選項或原生 SQL）允許多個工作行程領取不同的資料列。
- 鎖定逾時支援因資料庫而異；請對照目標引擎進行驗證。
- 透過帶有 `setLockMode(...)` 與 fetch join 的查詢鎖定資料列可能會鎖定比預期更多的資料列；請僅鎖定根實體。

## 隔離層級與異常現象

Hibernate 不會改變資料庫隔離層級。預設的 `READ COMMITTED` 允許跨查詢的不可重複讀取；持續性上下文為單一 session 內依 id 載入的實體提供可重複讀取。切勿假設先讀後寫的 check-and-act 邏輯是安全的：請使用 `@Version`、鎖定或唯一性條件約束（並處理 `ConstraintViolationException`）。

## 交易邊界

- 單一使用案例 = 服務/應用程式層的單一交易，而非在存放庫或控制器中，亦非針對每個實體呼叫個別開啟交易。
- 保持持續性上下文範圍 = 交易範圍（交易範圍的 `EntityManager`）。`EntityManager` 不是執行緒安全的；切勿跨執行緒共用它或實體。
- 交易內部不得進行 HTTP 呼叫、訊息傳送或耗時運算：它們會霸佔連線與鎖定。在提交後發布事件（使用 outbox 模式以求可靠）。
- 唯讀使用案例：將交易標記為唯讀（透過框架機制）或呼叫 `session.setDefaultReadOnly(true)`；這會略過 dirty checking 快照。
- 復原（Rollback）：針對資源本地的 `EntityTransaction`，JPA 未定義依例外狀況型別自動復原的規則；請在 `catch`/`finally` 中明確呼叫 `rollback()`。自動復原規則（例如在 `RuntimeException` 上復原但在受檢例外狀況下不復原）來自外圍框架或容器，例如 Spring `@Transactional` 或 Jakarta `@Transactional`。
- 在發生持續性例外狀況後，session 處於未定義狀態：請將其捨棄，切勿繼續使用它。
- 排清（Flush）模式：`AUTO` 會在執行涉及 dirty 實體資料表的查詢前進行排清；迴圈內部非預期的排清會在記錄中表現為 select 前的 update。謹慎使用 `FlushModeType.COMMIT` 或 `em.setFlushMode`，僅在充分理解過期讀取風險時才使用。
- `merge` 會回傳受管的複本：請使用回傳的執行個體，而非傳入的引數。優先採用載入並修改受管實體的方式，而非 `merge` 分離狀態。
- 在已受管的實體上呼叫 `save`/`persist` 是多餘的：dirty checking 會在提交時自動排清變更。

## 二級快取基礎

快取層級：一級快取（持續性上下文，一律啟用，每個 session 獨立）、二級快取（每個 `SessionFactory` 獨立，需選擇啟用，跨 session 共用）、查詢快取（需選擇啟用，儲存結果 id）。

僅針對大多為讀取、載入代價高昂，且僅由本應用程式寫入（或能容忍過期資料）的資料啟用：

```properties
hibernate.cache.use_second_level_cache=true
# 需要類別路徑上具備 hibernate-jcache 與 JCache 提供者（例如 Ehcache）。
hibernate.cache.region.factory_class=jcache
```

```java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
class Country { ... }
```

- 將 `shared-cache-mode` 設為 `ENABLE_SELECTIVE`（僅快取標註 `@Cacheable` 者）是最安全的作法。
- 並行策略：`READ_ONLY`（不可變）、`NONSTRICT_READ_WRITE`（容忍過期資料）、`READ_WRITE`、`TRANSACTIONAL`（JTA）。
- 查詢快取鮮少帶來優勢：對被查詢資料表的任何寫入都會使其結果失效。預設請避免使用。
- 透過 Hibernate 執行的大量 HQL/JPQL DML 會自動使受影響的二級快取與查詢快取區域失效，且透過 Hibernate 執行的原生 DML 也會觸發快取清理（在查詢空間未知時可能會清理所有區域）。依然會過期的是目前持續性上下文中的受管實體：在執行大量 DML 之前請先排清，執行後 `clear()` 或重新整理實體。Hibernate 外部的寫入（其他應用程式、直接 JDBC）是無法被察覺的；它們需要個別的失效策略，例如 `getCache().evict(...)`。
- 多節點部署需要分散式或具失效機制的提供者；僅限本機的快取會在各節點間提供過期資料。
- 在啟用前後使用統計資訊（`hibernate.generate_statistics`）進行量測；若命中率低下，請將其移除。
- 依 id 快取實體（`find`），集合則分開快取（在集合映射上標註 `@Cache`），並保持快取實體輕巧。
