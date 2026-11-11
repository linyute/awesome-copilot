# 資料存取 (Spring Data JPA、Spring Data JDBC)

針對映射問題（N+1 理論、equals/hashCode、串聯 cascade、鎖定、批次處理），請使用 `java-hibernate-jpa` 技能；針對 PostgreSQL 預設值與 Docker Compose，請參閱 `create-spring-boot-java-project`（`references/database.md`）；針對 `@DataJpaTest` 與 Testcontainers，請參閱 `spring-boot-testing`。本檔案涵蓋上層的 Spring 整合。已在 Boot 4.1.1 與 Boot 3.5.16 上以相同的 Spring Data JPA 程式碼驗證通過。

## 存放庫（Repository）

```java
public interface OrderRepository extends JpaRepository<PurchaseOrder, Long> {

	interface CustomerView { Long getId(); String getCustomer(); }   // 介面投影

	Page<CustomerView> findByStatus(PurchaseOrder.Status status, Pageable pageable);

	@Query("select new com.example.demo.OrderSummary(o.id, o.customer, o.total) from PurchaseOrder o where o.customer = :customer")
	Page<OrderSummary> summaries(String customer, Pageable pageable);   // record DTO

	@EntityGraph(attributePaths = "items")
	Optional<PurchaseOrder> findWithItemsById(Long id);                 // 於單一查詢中擷取集合
}
```

- 簡單查閱使用衍生查詢；一旦方法名稱變長時使用 `@Query`（JPQL）；僅在 JPQL 無法表達時使用 `@Query(nativeQuery = true)`。當使用 `-parameters` 編譯時，具名參數（`:customer`）會依名稱綁定（Boot 父 POM 與 Gradle 外掛程式已啟用此設定；未加 `@Param` 亦已驗證通過）。
- **投影：** 針對讀取端點回傳介面投影（封閉式：僅包含所需欄位的 getter）或 record DTO（使用包含完整限定名稱的 `select new ...`）。
- **分頁：** `Page<T>` 會額外執行一次 `count` 查詢；當不需要總數時請使用 `Slice<T>`。務必依穩定且唯一的資料行排序（`Sort.by("id")`）；對來自使用者輸入的頁面大小設定上限（`Math.min(size, 100)`）。切勿將分頁與集合的 `JOIN FETCH` 結合（這會導致記憶體內分頁；請參閱 `java-hibernate-jpa`）。
- **N+1：** 在每個查詢中使用 `@EntityGraph` 或 `JOIN FETCH` 進行修正，關聯一律維持 `LAZY`，並在測試中斷言陳述式計數（`hibernate.generate_statistics`）。
- 設定 `spring.jpa.open-in-view=false`；在交易內部載入回應所需的資料並就地轉換為 DTO。
- **Boot 4：** JPA 切片類別已搬移：`org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`、`org.springframework.boot.jpa.test.autoconfigure.TestEntityManager`、`org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`（Boot 3 為：`org.springframework.boot.test.autoconfigure.orm.jpa.*` 與 `...autoconfigure.jdbc.*`）。Starter：`spring-boot-starter-data-jpa`（測試時加上 `spring-boot-starter-data-jpa-test`）。

## 交易（Transaction）

- 在**服務**方法（使用案例邊界）上標註 `@Transactional`，而非在控制器或存放庫上標註。讀取作業標註：`@Transactional(readOnly = true)`。
- 保持交易精簡：交易內部不得進行 HTTP 呼叫、訊息傳送或檔案 I/O；在提交後使用 `@TransactionalEventListener(phase = AFTER_COMMIT)` 或 outbox 發布事件（`references/messaging-caching.md`）。
- Spring 僅對非受檢例外狀況（unchecked exceptions）進行復原；針對受檢例外狀況請使用 `rollbackFor`。自我呼叫會略過代理機制。
- 服務層回傳 DTO，因此在交易結束後永遠不會觸發延遲載入關聯。

## 稽核（Auditing）

```java
@Configuration(proxyBeanMethods = false)
@EnableJpaAuditing
class JpaAuditingConfig {}   // 請勿放在 @SpringBootApplication 類別上

@Entity @EntityListeners(AuditingEntityListener.class)
class PurchaseOrder {
	@CreatedDate Instant createdAt;
	@LastModifiedDate Instant lastModifiedAt;
}
```

`@DataJpaTest` 不會掃描 `@Configuration` 類別：在測試中請加入 `@Import(JpaAuditingConfig.class)`，否則 `createdAt` 會保持為 `null`（已驗證）。針對 `@CreatedBy`/`@LastModifiedBy`，請提供 `AuditorAware<String>` bean（通常來自安全性上下文；請參閱 `spring-security`）。

## 結構描述管理

遵循 `java-hibernate-jpa` 的結構描述管理規則（原型開發：`update`；生產環境：搭配 `ddl-auto=validate` 的 Flyway/Liquibase；外部管理：`none`）。在 Spring Boot 中：

- **Boot 4：** 新增 `spring-boot-starter-flyway`（針對 PostgreSQL 加上 `org.flywaydb:flyway-database-postgresql`）或 `spring-boot-starter-liquibase`；自動設定隨附於 starter 中。**Boot 3：** `org.flywaydb:flyway-core`（加上 `flyway-database-postgresql`）或 `liquibase-core`。
- 遷移指令碼存放於 `src/main/resources/db/migration/V1__init.sql`；切勿編輯已套用的遷移，請新增版本。每個遷移都是一個可供審查的單元；使用 `ddl-auto=validate`，以便在實體與結構描述發生偏離時於啟動時立即報錯（已驗證：由 Flyway 建立的結構描述對上述實體順利通過 `validate`）。
- 僅在使用者需要具版本控制的遷移或應用程式準備進入生產環境時才新增它們；請勿在結構描述由外部管理的專案中新增 Flyway。

## Spring Data JDBC（替代方案）

針對不需要延遲載入、工作階段或 dirty tracking 的簡單聚合（aggregate），可選擇此方案：聚合根（aggregate root）作為整體被載入與儲存，且不存在持續性上下文。Starter 為 `spring-boot-starter-data-jdbc`（除非明確設定存放庫掃描，否則切勿在同一模組中將其與 `data-jpa` 並列：兩者都會嘗試認領存放庫）。

```java
public record Book(@Id Long id, String title, @MappedCollection(idColumn = "book") Set<Chapter> chapters) {
	public record Chapter(String name) {}
}

public interface BookRepository extends ListCrudRepository<Book, Long>, PagingAndSortingRepository<Book, Long> {
	List<Book> findByTitleStartingWith(String prefix);
}
```

- 您需自行維護結構描述（搭配 `spring.sql.init.mode=always` 的 `schema.sql`，或如上所述的 Flyway/Liquibase）；不存在 `ddl-auto`。
- `null` id 代表新增；儲存後的複本會帶有產生的 id（`repo.save` 會回傳該複本：針對 record 請使用其回傳值）。
- Boot 4 測試切片：`org.springframework.boot.data.jdbc.test.autoconfigure.DataJdbcTest`（搭配 Testcontainers PostgreSQL 與 `@AutoConfigureTestDatabase(replace = NONE)` 驗證通過）。
- 並非 JPA 的直接替代品：無 `@EntityGraph`、無延遲關聯，聚合之間的參照是透過 id 進行。
