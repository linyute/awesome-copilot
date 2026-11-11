# 識別碼與實體設計

## 識別碼產生策略

| 策略 | 批次新增 | 備註 |
| --- | --- | --- |
| `SEQUENCE` | 是 | 在 PostgreSQL、Oracle、SQL Server、MariaDB、H2、Db2 上的最佳預設值。 |
| `IDENTITY` | 否（Hibernate 必須執行每次 insert 以取得 id） | 當資料庫不支援 sequence 時使用（較舊的 MySQL）；需接受較慢的大量新增。 |
| `TABLE` | 是，但存在高度競爭 | 應避免使用。 |
| `AUTO` | 視 dialect 而定 | 當 dialect 支援時 Hibernate 6+ 會挑選 sequence；建議明確指定。 |
| `UUID` | 是 | 用戶端產生；無需資料庫往返。 |

### 搭配 Pooled 最佳化工具的 Sequence

```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
private Long id;
```

- `allocationSize`（預設為 50）必須等於資料庫中 sequence 的 `INCREMENT BY`。兩者不相符會導致重複索引鍵錯誤或產生浪費的間隙。Hibernate 預設使用 pooled 最佳化工具：一次 sequence 呼叫即可保留 `allocationSize` 個 id。
- 插入資料列的其他應用程式或 SQL 指令碼必須使用相同的增量，或以相容方式從 sequence 取得 id。
- 在資料庫遷移指令碼中建立 sequence（`CREATE SEQUENCE order_seq START WITH 1 INCREMENT BY 50`）。

### UUID

```java
@Id
@GeneratedValue(strategy = GenerationType.UUID)   // Jakarta Persistence 3.1+
private UUID id;
```

隨機的 v4 UUID 在大型資料表上會導致 B-tree 索引零碎化；優先採用由應用程式產生的時間排序 id（UUIDv7）或 Hibernate 的 `@UuidGenerator(style = UuidGenerator.Style.TIME)`（Hibernate 6.x；請查閱您版本的說明文件以取得 v7 選項）。儲存為原生 `uuid` 資料行，而非 `varchar(36)`。

### 反模式

- 在需要大量載入資料的資料表上使用 `IDENTITY`。
- 會變更的自然鍵；請使用代理鍵加上唯一性條件約束，或使用 `@NaturalId`。
- `@GenericGenerator`（Hibernate 專屬，在 6.5+ 廢棄）：請使用 `@SequenceGenerator`、`@UuidGenerator`，或為您版本記錄的較新 id 產生器標註。

## equals 與 hashCode

問題所在：在 persist 之前 id 為 null；預設的物件身分相等性在分離/合併的執行個體間會破壞 `Set` 語意；Hibernate 代理物件是子類別，因此 `getClass()` 比對會失敗。

選項 A（產生的 id，建議模式）：

```java
@Override
public final boolean equals(Object o) {
    if (this == o) return true;
    if (o == null) return false;
    Class<?> oClass = o instanceof HibernateProxy p
            ? p.getHibernateLazyInitializer().getPersistentClass() : o.getClass();
    Class<?> thisClass = this instanceof HibernateProxy p
            ? p.getHibernateLazyInitializer().getPersistentClass() : getClass();
    if (thisClass != oClass) return false;                  // 代理安全、對稱
    Book other = (Book) o;
    Object thisId = this instanceof HibernateProxy p
            ? p.getHibernateLazyInitializer().getInternalIdentifier() : getId();
    Object otherId = other instanceof HibernateProxy p
            ? p.getHibernateLazyInitializer().getInternalIdentifier() : other.getId();
    return thisId != null && thisId.equals(otherId);
}

@Override
public final int hashCode() {
    return this instanceof HibernateProxy p
            ? p.getHibernateLazyInitializer().getPersistentClass().hashCode()
            : getClass().hashCode();   // 每個持久化類別為常數；在 persist 前後保持穩定
}
```

將兩個方法均宣告為 `final`，使 Hibernate 不會攔截它們並在方法本體執行前初始化代理物件。針對代理物件請使用 `getInternalIdentifier()`：不同於 `getIdentifier()` 或被攔截的 `getId()`，即使啟用了 JPA 代理相容性，它也不會初始化代理物件。這是 Hibernate 專屬模式，非跨提供者的可攜式 JPA 作法。

常數 `hashCode` 對於中等大小（數百個）的實體集合完全適用；無論如何，記憶體中龐大的實體集合本就是一種設計壞味道。在代理物件上呼叫 `getClass()` 會回傳產生的子類別，因此兩個方法均先解析出持久化類別（`Hibernate.getClass(x)` 亦具相同效果但會初始化代理物件）。類別比對保持了 `equals` 的對稱性並與 `hashCode` 一致；對於子類別應等於其父型別的實體階層架構，請改為與根實體類別進行比對。

使用以下情境進行驗證：兩個相異的暫時性書籍（不相等）、同一本書在 persist 前後（hash 不變），以及在關閉 entity manager 後一個未初始化的 `em.getReference(Book.class, id)`。將該分離的代理物件新增至 `HashSet`、在雙向上將其與具有相同 id 的分離書籍進行比對，以及呼叫 `contains` 均不得擲出例外狀況或初始化代理物件。亦需檢查在代理物件仍處於附加狀態時無額外 SQL 產生，包含在設定了 `hibernate.jpa.compliance.proxy=true` 的情況下。

選項 B（商業鍵/自然鍵）：使用 getter 比對不可變且唯一的屬性（ISBN、電子郵件）。在相同欄位上實作 `hashCode`。將其標記為 `@NaturalId`。切勿使用可變欄位。

選項 C（用戶端指派的 UUID id）：比對/雜湊 UUID；它從建構之初即已存在。

切勿在 `equals`/`hashCode`/`toString` 中包含關聯或延遲集合。

## 實體上的 Lombok

- **切勿**在實體上使用 `@Data`、`@EqualsAndHashCode`、`@ToString`（預設行為）：它們會觸及延遲集合（引發載入或 `LazyInitializationException`）、導致雙向關聯中的無限遞迴，並使 `hashCode` 在 persist 之後發生改變。
- 選擇性使用 `@Getter`/`@Setter`（集合與 id 上通常不應存在 setter），並搭配僅包含基本欄位的 `@ToString(onlyExplicitlyIncluded = true)`。
- `@Builder` 與 `@AllArgsConstructor` 會略過不變性約束並需要受保護的無引數建構子（`@NoArgsConstructor(access = AccessLevel.PROTECTED)`）；請以 `@Builder.Default` 初始化集合。
- 實體必須為非 final 且具備非 private 的無引數建構子（以供 Hibernate 代理物件使用）；請勿將欄位設為 `final`。

## Record 對比實體

- Java record 無法成為實體：實體需要無引數建構子、可變性以及非 final 類別。（Hibernate 6+ 確實支援將 record 作為 `@Embeddable` 元件以及作為投影/DTO 型別。）
- 將 record 用於 DTO、投影與可內嵌元件；實體請保持為 class。

## 列舉與轉換器

- `@Enumerated(EnumType.STRING)`（易讀、對順序調換具彈性）。當常數重新排序或插入時，`ORDINAL` 會出錯。
- 若必須在儲存層級拒絕無效值，請新增資料庫 check 條件約束或原生/PostgreSQL 列舉映射。
- 自訂型別：使用 `AttributeConverter<X, Y>` 搭配 `@Converter(autoApply = false)` 並在屬性上標註 `@Convert`。轉換器必須為無狀態且 null 安全，且不會套用於 id 或某些 JPQL 比對中；請測試比對轉換屬性的查詢。
- 優先使用 `java.time` 型別而非 `java.util.Date`；使用 UTC 時區的 `Instant`/`OffsetDateTime`（`hibernate.jdbc.time_zone=UTC`）。
- `BigDecimal` 資料行：請設定 `precision` 與 `scale`。

## 其他設計重點

- 使用 `@Embeddable` 建立內嵌值物件，而非零散的資料行。
- 在聚合根上使用 `@Version` 實現開放式鎖定（`locking-transactions-caching.md`）。
- 將唯讀參考實體標記為 `@Immutable`。
- `@ElementCollection` 僅用於小型值集合；龐大或需要查詢的集合應擁有自有的實體。
- 優先使用 `Long`/`UUID` 包裝型別識別碼（null 代表暫時性狀態）。
