# 擷取、N+1、延遲載入、投影

## N+1 查詢

**徵兆**：單一查詢載入 N 個父實體，接著在程式碼、JSON 序列化器或 `toString` 中觸及延遲關聯時，每個父實體又額外觸發一次查詢。

**偵測**：啟用 SQL 記錄/統計資訊（`tooling-and-versions.md`），並在整合測試中斷言陳述式計數；尋找僅在 id 上有所差異的重複相同 SELECT。

```java
// 反模式：1 + N
List<Order> orders = em.createQuery("select o from Order o", Order.class).getResultList();
orders.forEach(o -> o.getLines().size());
```

### 修正 1：JOIN FETCH（特定查詢專用）

```java
List<Order> orders = em.createQuery(
    "select o from Order o left join fetch o.lines", Order.class)
  .getResultList();
```

- 可隨意 fetch 多對一/一對一關聯。每個查詢中**最多 fetch 一個集合**：在單一查詢中 fetch 兩個 bag 集合會擲出 `MultipleBagFetchException`（且聯結多個集合會導致資料列成倍膨脹）。請在相同 session 的第二個查詢中 fetch 第二個集合；持續性上下文會將它們拼接在一起。
- Hibernate 6+ 會自動對 fetch join 的根實體進行去重，因此不再需要為此加上 `DISTINCT`；在 Hibernate 5 上需加上 `DISTINCT`（可考慮使用 `hibernate.query.passDistinctThrough` 提示以避免將其傳入 SQL）。
- 切勿對集合 fetch join 進行分頁（請參閱 `queries-pagination-batching.md`）。

### 修正 2：Entity Graph（可重複使用的擷取計畫）

```java
EntityGraph<Order> g = em.createEntityGraph(Order.class);
g.addAttributeNodes("customer");
g.addSubgraph("lines").addAttributeNodes("product");

List<Order> orders = em.createQuery("select o from Order o", Order.class)
  .setHint("jakarta.persistence.fetchgraph", g)   // Hibernate 7：優先使用 query.setEntityGraph(g, GraphSemantic.FETCH)
  .getResultList();
```

`@NamedEntityGraph` 在實體上宣告 graph。Fetch graph（`fetchgraph`）將未列出的屬性視為延遲載入；Load graph（`loadgraph`）則保留映射預設值。

### 修正 3：批次擷取（無法預知存取模式時）

使用單一 `IN (...)` 查詢為多個父實體載入延遲關聯，而非執行 N 次查詢。

```java
@OneToMany(mappedBy = "order")
@BatchSize(size = 25)
private List<OrderLine> lines;
```

全域預設值：`hibernate.default_batch_fetch_size=16`（常見數值為 8-32）。將 N+1 轉變為 1 + N/size。它對延遲的 `@ManyToOne` 代理物件亦有助益。雖然不如 JOIN FETCH 精確，但這是良好的安全防護網。

### 修正 4：子查詢擷取 (Subselect Fetching)

`@Fetch(FetchMode.SUBSELECT)` 透過一次額外查詢為原始查詢的所有父實體載入集合。適用於單一已知查詢的小型結果集；若原始查詢代價高昂，此方式可能會很沉重。

### 修正 5：避開實體的投影

若呼叫端需要扁平檢視表，直接選取特定資料行（如下所示）。

## 延遲對比積極 (Lazy vs Eager)

- 預設值：`@ManyToOne`、`@OneToOne` 為 EAGER；`@OneToMany`、`@ManyToMany`、`@ElementCollection` 為 LAZY；`@Basic` 為 EAGER（`@Lob` 與 `@Basic(fetch = LAZY)` 需要位元組碼增強才能真正延遲載入）。
- 映射中的 `FetchType.EAGER` 會套用於**每一次**載入：`em.find` 會進行 join，但 JPQL/criteria 查詢在初始 SQL 中會忽略它，並透過後續的 select 載入 eager 關聯（形成隱蔽的 N+1）。請在映射中設定 `LAZY` 並依使用案例個別 fetch。
- **反向**端（`mappedBy`）上的延遲 `@OneToOne` 通常會被積極載入，因為 Hibernate 必須查詢以判斷其是否為 null；唯有在 `optional = false`（保證資料列存在）或透過位元組碼增強時，它才能成為延遲代理物件。優先使用單向擁有端；擁有端上的 `@MapsId` 本身無法解決選用反向端的 null 偵測問題。
- Hibernate 代理物件：使用 `Hibernate.initialize(x)`、`Hibernate.isInitialized(x)` 以及 `em.getReference`（僅含 id 的參照，用於設定外鍵而無需觸發 SELECT）。

## LazyInitializationException

原因：在 session 關閉後存取了延遲關聯或代理物件（通常發生在控制器中序列化實體時）。

修正方式（由優至劣）：

1. 在交易內部載入使用案例所需資料（JOIN FETCH / entity graph / 投影），並在交易服務方法**內部**映射至 DTO。
2. 僅在明確知曉數量較少時，於服務中明確初始化（`Hibernate.initialize`）。
3. 避免使用 `hibernate.enable_lazy_load_no_trans=true`：它會在任何交易外部為每次延遲載入開啟新連線，並掩蓋了 N+1 問題。

## 檢視表中的開啟工作階段 (Open Session in View, OSIV)

OSIV 會保持持續性上下文（以及資料庫連線）處於開啟狀態，直到 HTTP 回應寫入完畢，使得延遲載入在控制器與序列化器中能「正常運作」。

權衡取捨：
- 優點：在檢視表層不會出現 `LazyInitializationException`。
- 缺點：在渲染與任何遠端呼叫期間皆佔用連線（導致連線池匱乏）、從檢視表層發出的查詢脫離了交易/服務設計、隱蔽的 N+1，以及在非 auto-commit 模式下於交易外部產生額外陳述式。
- 建議：在框架預設啟用的情況下停用 OSIV，改為回傳 DTO 並在服務層定義擷取計畫。若予以保留，請監控連線佔用時間。啟用/停用屬於框架設定（Spring 的 `spring.jpa.open-in-view` 請參閱 `java-springboot`）。

## DTO 投影

用於讀取模型、清單、報表。它們會略過 dirty checking 與快照記憶體開銷。

```java
public record OrderSummary(Long id, String customerName, BigDecimal total) {}

List<OrderSummary> rows = em.createQuery(
    "select new com.acme.OrderSummary(o.id, c.name, o.total) from Order o join o.customer c",
    OrderSummary.class).getResultList();
```

- JPQL 建構子運算式（`select new ...`）需要完整的類別限定名稱；或者將資料行選取至 `Tuple`。
- Java record 可與建構子運算式搭配作為投影型別。
- 原生查詢：使用帶有 `@ConstructorResult` 的 `@SqlResultSetMapping`，或使用 `Tuple`。
- 投影後續無法延遲載入；請包含呼叫端所需的一切欄位。
- 針對寫入路徑實體依然是正確選擇：載入、變更、讓 dirty checking 進行排清。
