# 持久化：搭配 Panache 的 Hibernate ORM

核心 JPA 對應、關聯、N+1 與查詢設計：若已安裝請使用選填的 `java-hibernate-jpa` 技能；否則遵循 Hibernate ORM 指南（<https://quarkus.io/guides/hibernate-orm>）。本檔案涵蓋 Quarkus 特有內容。擴充功能：`quarkus-hibernate-orm-panache` + JDBC 驅動程式（如 `quarkus-jdbc-postgresql`）。

## 設定

```properties
# No URL/credentials in %dev/%test: PostgreSQL Dev Service starts automatically (Docker/Podman)
# Safe default for every profile (including custom ones such as staging); use Flyway/Liquibase for real schemas
quarkus.hibernate-orm.schema-management.strategy=none
# Recreate the schema only in dev and test
%dev.quarkus.hibernate-orm.schema-management.strategy=drop-and-create
%test.quarkus.hibernate-orm.schema-management.strategy=drop-and-create
%prod.quarkus.datasource.jdbc.url=${DB_URL}
%prod.quarkus.datasource.username=${DB_USER}
%prod.quarkus.datasource.password=${DB_PASSWORD}
```

`schema-management.strategy` 已在 3.40.1 與 3.27.6 上驗證（較舊的文件使用 `quarkus.hibernate-orm.database.generation`；請保留專案使用的形式）。持久化單元設定於 `application.properties` 中，而非 `persistence.xml`。若實體位於應用程式模組中，則無需註冊。

## Active record 對比 repository（已驗證，PostgreSQL Dev Service）

```java
@Entity
public class Person extends PanacheEntity {            // active record: id is generated, public fields
    public String name;
    public static Person findByName(String n) { return find("name", n).firstResult(); }
}

@Entity
public class Book { @Id @GeneratedValue public Long id; public String title; }

@ApplicationScoped
public class BookRepository implements PanacheRepository<Book> {   // repository pattern
    public List<Book> byTitle(String t) { return list("title", t); }
}
```

對於非瑣碎領域偏好使用 Repository 模式（具可測試性、可透過 `@InjectMock` 進行模擬、保持實體為純 POJO）；僅對簡易 CRUD 使用 Active Record。對於非 `Long` 型別的 ID，使用 `PanacheRepositoryBase<E, ID>` / `PanacheEntityBase`。Panache 提供 `find`、`list`、`stream`、`count`、`delete`、`update`、`persist`、用於分頁的 `page(Page.of(i, size))`、`Sort` 以及用於投影的 `project(Dto.class)`。Panache 查詢接受簡寫 HQL（`"name"`、`"name = ?1"`、搭配 `Parameters` 的 `"from Person where name = :n"`）。

## 交易（Transactions）

```java
@ApplicationScoped
public class BookService {
    @Inject BookRepository repo;
    @Transactional                                  // jakarta.transaction.Transactional
    public Book add(String title) { Book b = new Book(); b.title = title; repo.persist(b); return b; }
}
```

- 在執行寫入的服務（或資源）方法上加上 `@Transactional`；ArC 亦會攔截自呼叫，因此呼叫同一個 Bean 上的標註方法會啟動交易。
- 程式化控制：`QuarkusTransaction.requiringNew().call(() -> ...)`（`io.quarkus.narayana.jta`），用於已驗證測試中讀回已認可的資料。
- 交易外的讀取僅在啟動的 CDI 請求上下文（例如 HTTP 請求）內運作，且 `quarkus.hibernate-orm.request-scoped.enabled` 維持其預設值 `true`；在背景工作、排程作業或傳訊消費者中，請將讀取包裝於交易中（`@Transactional` 或 `QuarkusTransaction`）；延遲關聯必須在交易內部或透過 fetch join/投影進行擷取。
- 測試：`@TestTransaction` 會回復（請參閱 `quarkus-dev-services-and-testing`）。
- 請勿使用 `open-in-view` 風格的模式；在從資源傳回前對應至 DTO record。

## Panache Next / Quarkus Data（現況）

`quarkus-data-hibernate`（「Quarkus Data Hibernate」、Panache Next、Jakarta Data 支援）在 code.quarkus.io 針對 3.40.1 標記為 `status:experimental`（透過 `https://code.quarkus.io/api/extensions` 檢查）。除非使用者要求，否則請勿在正式環境程式碼中使用它或建議移轉；請保持使用 `quarkus-hibernate-orm-panache`。在提出建議前請再次確認標籤。

## 反應式（Hibernate Reactive）取捨

搭配基於 `Uni` 的 API 與 Vert.x SQL 用戶端（`quarkus-reactive-pg-client`）的 `quarkus-hibernate-reactive-panache` 適用於全反應式技術堆疊，但是：它與 ORM 屬於不同的擴充功能集（兩者可以共存，包括在帶有 JDBC 與反應式 URL 的預設資料來源上共存，但它們擁有獨立的持久化上下文，因此每個方法請維持使用單一堆疊）、功能集較受限、除錯較困難、無 `@Transactional` 阻斷風格（需使用 `@WithTransaction`/`@WithSession`），且 Java 21+ 虛擬執行緒能以較簡易的阻斷式 ORM 帶來大部分的延展性優勢。在並行效能至關重要的情況下，預設採用阻斷式 ORM + `@RunOnVirtualThread`；僅在整個呼叫鏈皆為非阻斷時才選擇 Hibernate Reactive。此技能的建構中未對此進行驗證。

## REST Data Panache

`quarkus-hibernate-orm-rest-data-panache` 會從 Repository 介面產生 CRUD 資源；適用於原型開發，但明確的資源可提供對驗證、安全性與 DTO 的控制權。此處未進行驗證。
