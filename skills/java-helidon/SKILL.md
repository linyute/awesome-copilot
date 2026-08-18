---
name: 'java-helidon'
description: '取得使用 Helidon 4（SE 和 MP）開發應用程式的最佳做法。適用於在 Java 21+ 專案中使用 Helidon SE 或 Helidon MP、HttpService 路由、Helidon DB Client、MicroProfile Config、Helidon Security 或 Helidon 測試。'
---

# Helidon 最佳做法

您的目標是透過遵循既定的最佳做法，協助我撰寫高品質的 Helidon 應用程式。

## Helidon 3 → 4 API 變更

Helidon 4 重新命名或更改了在 Helidon 3 形式中廣泛出現的 API 簽章。
左側欄位在 Helidon 4 上無法編譯。在傳回產生的程式碼之前，
請對照此表格進行檢查。

| 請勿使用 (Helidon 3)                                       | 請使用 (Helidon 4)                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `io.helidon.common.http.Http.Status`                       | `io.helidon.http.Status`                                           |
| `io.helidon.webserver.Service`                             | `io.helidon.webserver.http.HttpService`                            |
| `Routing.Rules`, `update(Routing.Rules)`                   | `HttpRules`, `routing(HttpRules)`                                  |
| `request.path().param("id")`                               | `request.path().pathParameters().get("id")`                        |
| `String s = column.as(String.class)`                       | `column.getString()` or `column.get(String.class)`                 |
| `dbClient.execute(exec -> ...)` returning `Single`/`Multi` | `dbClient.execute()` returning `Optional<DbRow>` / `Stream<DbRow>` |
| `javax.*`                                                  | `jakarta.*`                                                        |
| `helidon-microprofile-tests-junit5`                        | `helidon-microprofile-testing-junit5`                              |

在 Helidon 4 中，`Value.as(Class)` 傳回 `OptionalValue<T>`，而非 `T`。這是產生的程式碼中
最常見的 Helidon 4 編譯錯誤。

## 專案設定與結構

- **程式設計模型：** 在產生程式碼之前，確定專案使用的是 Helidon SE 還是 Helidon MP。除非有明確要求，否則請勿混合這兩種程式設計模型。
- **Java 版本：** 針對 Helidon 4 應用程式使用 Java 21 或更新版本。
- **建構工具：** 使用 Maven (`pom.xml`) 或 Gradle (`build.gradle`) 進行相依性管理。
- **相依性管理：** 使用 Helidon BOM 或平台來保持 Helidon 模組版本一致。
- **套件結構：** 按功能或領域組織程式碼，例如 `com.example.app.order` 和 `com.example.app.customer`，而不是僅按技術層進行組織。

## Helidon SE

- **明確組合：** 在應用程式引導 (bootstrap) 層中明確建構服務與相依性。
- **建構函式注入：** 透過建構函式傳遞所需的相依性，並將相依性欄位宣告為 `private final`。
- **HTTP 服務：** 在專注的 `HttpService` 實作中將相關路由進行分組。
- **業務邏輯：** 將業務邏輯保留在路由處理常式之外。
- **虛擬執行緒：** 優先選擇使用 Helidon 4 基於虛擬執行緒之請求處理的直觀阻塞程式碼。沒有明確的原因請勿引入反應式 (reactive) 複雜性。Helidon 4 不是反應式的；請勿產生 `Single`、`Multi` 或 `CompletionStage` 鏈。

## Helidon MP

- **Jakarta 與 MicroProfile：** 在可用時優先選擇標準的 Jakarta EE 和 Eclipse MicroProfile API。
- **相依性注入：** 針對所需的相依性，搭配建構函式注入使用 CDI。
- **Bean 範圍：** 有意識地使用 CDI 範圍，例如 `@ApplicationScoped` 和 `@RequestScoped`。
- **正常範圍 Bean：** 為使用建構函式注入的正常範圍 (normal-scoped) Bean 新增非私有的無引數建構函式，以便能夠可攜性地建立 CDI 用戶端 Proxy。
- **業務邏輯：** 保持 Jakarta REST 資源類別輕量，並將業務操作委派給服務類別。
- **可攜性：** 當可攜性很重要時，優先選擇可攜的 Jakarta 和 MicroProfile API，而非 Helidon 特定的 API。

## 設定

- **外部化設定：** 將非機密設定儲存在 `application.yaml` 或 `application.properties` 中。
- **Helidon SE 設定：** 使用 Helidon Config 並將設定值或具型別的設定物件傳遞給元件。
- **Helidon MP 設定：** 針對插入的應用程式設定使用 MicroProfile Config。
- **環境覆寫：** 針對與環境相關的值，使用環境變數或特定於部署的設定來源。
- **機密管理：** 切勿將憑證、API 金鑰、權杖或私密憑證寫死在程式碼中。

## Web 層

- **DTO：** 使用專門的請求與回應模型。請勿透過 API 直接公開持續性實體。
- **驗證：** 在呼叫業務邏輯之前，驗證路徑參數、查詢參數、標頭和請求內文。
- **狀態碼：** 針對成功、無效、未經授權、禁止、遺失和失敗的請求傳回適當的 HTTP 狀態碼。在 `PUT` 和 `DELETE` 上，當目標不存在時傳回 404，而不是無條件成功。
- **錯誤處理：** 在 Helidon SE 中使用集中式錯誤處理，在 Helidon MP 中使用 Jakarta REST `ExceptionMapper` 實作。
- **機敏資訊：** 請勿向用戶端公開堆疊追蹤、資料庫詳細資訊、檔案系統路徑或內部例外狀況訊息。

### Helidon SE 範例

使用 `HttpService` 以程式設計方式註冊路由。保持請求處理常式精簡，並將業務邏輯委派給服務。

```java
import io.helidon.http.Status;
import io.helidon.webserver.http.HttpRules;
import io.helidon.webserver.http.HttpService;
import io.helidon.webserver.http.ServerRequest;
import io.helidon.webserver.http.ServerResponse;

public final class CustomerHttpService implements HttpService {

    private final CustomerService customerService;

    public CustomerHttpService(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Override
    public void routing(HttpRules rules) {
        rules.get("/{id}", this::findById);
    }

    private void findById(ServerRequest request, ServerResponse response) {
        var id = request.path().pathParameters().get("id");

        customerService.findById(id)
                .ifPresentOrElse(
                        response::send,
                        () -> response.status(Status.NOT_FOUND_404).send()
                );
    }
}
```

在建構伺服器時註冊 HTTP 服務：

```java
import io.helidon.webserver.WebServer;

WebServer server = WebServer.builder()
        .routing(routing -> routing.register("/customers", customerHttpService))
        .build()
        .start();
```

### Helidon MP 範例

針對端點使用 Jakarta REST 註解，並針對相依性注入使用 CDI。

```java
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/customers")
@RequestScoped
@Produces(MediaType.APPLICATION_JSON)
public class CustomerResource {

    private final CustomerService customerService;

    protected CustomerResource() {
        this.customerService = null;
    }

    @Inject
    public CustomerResource(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GET
    @Path("/{id}")
    public Response findById(@PathParam("id") String id) {
        return customerService.findById(id)
                .map(customer -> Response.ok(customer).build())
                .orElseGet(() -> Response.status(Response.Status.NOT_FOUND).build());
    }
}
```

## 服務層

- **交易：** 圍繞完整的業務操作定義交易邊界。
- **實體對應：** 在服務邊界將持續性實體對應至 API 模型，以便服務方法簽章僅公開 API 模型。呼叫端預期為 `Optional<Customer>` 但服務傳回 `Optional<CustomerEntity>` 是常見的程式碼產生編譯錯誤。
- **並行性：** 除非存取經過適當協調，否則避免在應用程式範圍的元件中使用可變的共用狀態。

### Helidon SE 範例

Helidon SE 服務通常是具有明確提供相依性的純 Java 類別。

```java
public final class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Optional<Customer> findById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Customer ID is required");
        }

        return customerRepository.findById(id);
    }

    public Customer create(CreateCustomerRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }

        var customer = new Customer(request.id(), request.name().trim());

        customerRepository.save(customer);
        return customer;
    }
}
```

明確建構相依性圖形：

```java
var repository = new DbCustomerRepository(dbClient);
var service = new CustomerService(repository);
var httpService = new CustomerHttpService(service);
```

### Helidon MP 範例

使用 CDI 範圍和建構函式注入。當業務操作變更持續性狀態時，在服務層套用交易。在此處將持續性實體對應至 API 模型，以便服務絕不向呼叫端洩漏 `CustomerEntity`。

```java
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CustomerService {

    private final JpaCustomerRepository customerRepository;

    protected CustomerService() {
        this.customerRepository = null;
    }

    @Inject
    public CustomerService(JpaCustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Optional<Customer> findById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Customer ID is required");
        }

        return customerRepository.findById(id)
                .map(Customer::fromEntity);
    }

    @Transactional
    public Customer create(CreateCustomerRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }

        var entity = new CustomerEntity(request.id(), request.name().trim());

        customerRepository.save(entity);
        return Customer.fromEntity(entity);
    }
}
```

## 資料層

- **資料庫存取：** 使用 Helidon DB Client、Jakarta Persistence 或專案已建立的其他持續性機制。
- **參數化查詢：** 務必使用參數繫結或預先編譯陳述式 (prepared statements)。切勿將不受信任的輸入串接至 SQL 中。
- **資料行存取子：** 使用 `column("name").getString()`（或 `getInt()`、`getLong()` 等）或 `column("name").get(String.class)` 讀取具型別的資料行值。在 Helidon 4 中，`DbColumn.as(String.class)` 傳回 `OptionalValue<String>`，而非 `String`。
- **可為 Null 的資料行：** 透過 `asOptional()` 或其他可感知 Optional 的存取子讀取可為 Null 的資料行。當資料行值為 Null 時，直接呼叫 `getString()` 及類似的存取子會擲回例外狀況。
- **資料列對應：** 對於整列對應，`DbRow.as(Customer.class)` 直接傳回對應的執行個體，但需要透過 `DbMapperProvider` service-loader 項目註冊的 `DbMapper`。對於少數簡單的存放庫，優先選擇明確的資料行讀取；當相同的資料列形狀在多處對應時，請引入 `DbMapper`。
- **移轉：** 使用資料庫移轉工具進行結構描述變更，而不是自動進行破壞性的結構描述更新。
- **實體分離：** 請勿將資料庫實體直接公開為 API 協定。

### Helidon SE 範例

搭配參數化陳述式使用 Helidon DB Client。在存放庫內部將資料庫資料列對應到應用程式模型。

```java
import io.helidon.dbclient.DbClient;

public final class DbCustomerRepository implements CustomerRepository {

    private static final String FIND_BY_ID =
            "SELECT id, name FROM customers WHERE id = :id";

    private static final String INSERT =
            "INSERT INTO customers (id, name) VALUES (:id, :name)";

    private final DbClient dbClient;

    public DbCustomerRepository(DbClient dbClient) {
        this.dbClient = dbClient;
    }

    @Override
    public Optional<Customer> findById(String id) {
        return dbClient.execute()
                .createGet(FIND_BY_ID)
                .addParam("id", id)
                .execute()
                .map(row -> new Customer(
                        row.column("id").getString(),
                        row.column("name").getString()
                ));
    }

    @Override
    public void save(Customer customer) {
        dbClient.execute()
                .createInsert(INSERT)
                .addParam("id", customer.id())
                .addParam("name", customer.name())
                .execute();
    }
}
```

具名陳述式也可以儲存在設定中，而不是在 Java 中嵌入 SQL：

```yaml
db:
  source: "jdbc"
  connection:
    url: "jdbc:postgresql://localhost:5432/customers"
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  statements:
    find-customer-by-id: >
      SELECT id, name
      FROM customers
      WHERE id = :id
```

依名稱參照具名陳述式，而非傳遞 SQL 文字：

```java
return dbClient.execute()
        .createNamedGet("find-customer-by-id")
        .addParam("id", id)
        .execute()
        .map(row -> new Customer(
                        row.column("id").getString(),
                        row.column("name").getString()
        ));
```

### Helidon MP 範例

在 CDI 管理的存放庫中使用 Jakarta Persistence。將交易邊界保留在服務層。存放庫處理實體；服務將其對應至 API 模型。

```java
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@ApplicationScoped
public class JpaCustomerRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<CustomerEntity> findById(String id) {
        return Optional.ofNullable(entityManager.find(CustomerEntity.class, id));
    }

    public void save(CustomerEntity customer) {
        entityManager.persist(customer);
    }
}
```

與公用 API 模型分開定義持續性實體：

```java
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customers")
public class CustomerEntity {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    protected CustomerEntity() {
    }

    public CustomerEntity(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String id() {
        return id;
    }

    public String name() {
        return name;
    }
}
```

API 模型保持不受持續性註解的影響，並擁有對應邏輯：

```java
public record Customer(String id, String name) {

    public static Customer fromEntity(CustomerEntity entity) {
        return new Customer(entity.id(), entity.name());
    }
}
```

## 可觀測性

- **健康檢查：** 在 SE 中使用 Helidon Health，或在 MP 中使用 MicroProfile Health 進行存活與就緒檢查。
- **計量指標：** 使用 Helidon Metrics 或 MicroProfile Metrics 進行維運與業務度量。
- **追蹤：** 跨輸入與輸出服務呼叫傳播追蹤上下文。
- **基數：** 避免使用使用者 ID、請求 ID、電子郵件地址和原始 URL 作為計量標記。

## 記錄

- **記錄 API：** 使用專案設定的記錄 API 與實作。
- **機敏資訊：** 切勿記錄密碼、存取權杖、授權標頭、Cookie 或完整的機敏請求內文。也不要在計量或追蹤屬性中放置機密或個人資訊。

## 測試

- **單元測試：** 使用 JUnit 5 為業務服務撰寫單元測試。
- **Helidon SE 測試：** 針對完整伺服器測試使用帶有 `@ServerTest` 的 `helidon-webserver-testing-junit5`，針對僅路由測試使用 `@RoutingTest`。這些會在動態選取的連接埠上啟動伺服器，並注入繫結至該連接埠的 `Http1Client`。切勿寫死連接埠。
- **Helidon MP 測試：** 使用帶有 `@HelidonTest` 的 `helidon-microprofile-testing-junit5`，它會為測試類別啟動 CDI 容器和伺服器。對照使用中的 Helidon 版本確認構件座標，因為此模組在 4.x 版本之間進行了重新命名。
- **Testcontainers：** 考慮針對使用真實資料庫、訊息代理程式或其他基礎結構的整合測試使用 Testcontainers。
- **失敗路徑：** 測試驗證失敗、遺失資源、外部服務失敗和授權失敗。

## 安全性

- **Helidon Security：** 使用 Helidon Security 或受支援的 Jakarta 和 MicroProfile 安全 API 進行驗證與授權。
- **授權：** 在明確的應用程式邊界強制執行權限，並預設拒絕受保護的操作。
- **JWT 與 OIDC：** 驗證權杖簽章、簽發者、受眾和到期時間。
- **TLS：** 針對生產環境流量使用 TLS，並驗證傳出連線的憑證。
- **CORS：** 明確設定允許的來源。請勿將萬用字元來源與認證結合使用。
- **機密：** 將機密儲存在受保護的環境設定或專用的機密管理系統中。
- **傳出請求：** 驗證傳出目的地以降低伺服器端請求偽造 (SSRF) 風險。
