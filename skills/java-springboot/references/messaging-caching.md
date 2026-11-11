# 傳訊、快取、排程、非同步

在為現有專案新增訊息代理程式、快取提供者或排程/非同步設定之前，**請務必先詢問**：每一項都會增加基礎架構與維運成本。在使用者同意後，使用由 Boot 管理的版本（針對由 Spring 管理的 artifacts 不指定明確版本）。已在 Boot 4.1.1（JDK 26 執行時期，`--release 25`）上驗證；在已知情況下標註 Boot 3 的差異。相關測試：`spring-boot-testing`；相關追蹤/度量指標：`spring-observability`。

## Kafka (Spring for Apache Kafka)

- **Boot 4：** `spring-boot-starter-kafka`（加上 `spring-boot-starter-kafka-test`）。**Boot 3：** `org.springframework.kafka:spring-kafka`（無 starter；版本由 Boot BOM 管理）。
- 生產者：`KafkaTemplate<String, String>`；消費者：`@KafkaListener`。

```java
@Component
class Events {
	private final KafkaTemplate<String, String> template;
	Events(KafkaTemplate<String, String> template) { this.template = template; }

	void publish(String key, String payload) { template.send("orders", key, payload); }

	@KafkaListener(topics = "orders", groupId = "demo")
	void on(String payload) { /* 必須具備等冪性：傳遞保證為至少一次 (at-least-once) */ }
}
```

```properties
spring.kafka.bootstrap-servers=${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
spring.kafka.consumer.auto-offset-reset=earliest
```

- 消費者必須具備**等冪性**（至少一次傳遞）；在進入生產環境之前請決定重試/寄信死信策略（搭配 `DeadLetterPublishingRecoverer` 的 `DefaultErrorHandler`）。
- 有效負載（payload）請保持為具版本的 DTO（record）；避免傳送 JPA 實體。
- 透過 Testcontainers **搭配真實代理程式進行測試**（已驗證：在 `@SpringBootTest` 中進行傳送與接收）：

```java
import org.testcontainers.kafka.KafkaContainer;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {
	@Bean @ServiceConnection
	KafkaContainer kafkaContainer() { return new KafkaContainer(DockerImageName.parse("apache/kafka-native:4.0.0")); }
}
```

  Boot 4 使用 Testcontainers 2.x（artifact 為 `org.testcontainers:testcontainers-kafka`）；Boot 3 使用 1.x（artifact 為 `org.testcontainers:kafka`）。範例中使用 `org.testcontainers.kafka.KafkaContainer`，該類別在近期的 1.x 版本與 2.x 中皆可用；請檢查專案 BOM 管理的版本是否支援 `apache/kafka-native`。請勿替換為舊版 `org.testcontainers.containers.KafkaContainer`：它需要 `confluentinc/cp-kafka` 映像檔。若專案較舊的 Testcontainers 版本缺少現代類別或原生映像檔支援，請改用舊版類別搭配相容且鎖定版本的 Confluent 映像檔，切勿隱式升級依賴項。鎖定映像檔標籤，切勿使用 `latest`。使用 `CountDownLatch`/Awaitility 等待，而非 `Thread.sleep`。

## RabbitMQ / AMQP（本技能建構未驗證）

`spring-boot-starter-amqp`（Boot 3 與 4）、使用 `RabbitTemplate` 傳送、`@RabbitListener` 接收、測試時搭配 Testcontainers RabbitMQ 模組的 `@ServiceConnection`。將佇列/交換機宣告為 `Queue`/`TopicExchange`/`Binding` bean，在檢查使用中的 Jackson 主要版本（Boot 4 = Jackson 3）後才使用 `Jackson2JsonMessageConverter` 風格的 JSON 轉換器，並設定死信交換機（dead-letter exchange）。在產生程式碼前，請查閱 Spring AMQP 參考文件以取得適用於您版本的精確轉換器類別名稱。

## 交易式 Outbox 模式

在資料庫交易內部向訊息代理程式發布訊息並非不可分割（atomic）：若在提交與傳送之間發生崩潰將會遺失訊息。當訊息絕不能遺失時，應在狀態變更的相同交易中將事件寫入 `outbox` 資料表，並由轉發器（排程輪詢器或如 Debezium 的 CDC）進行發布並標記為已傳送。消費者維持等冪性。除非使用者需要該保證，否則請勿實作此模式；對於可承受遺失的事件，使用 `@TransactionalEventListener(phase = AFTER_COMMIT)` 更為簡單。

## 使用 Caffeine 進行快取

- 依賴項：`spring-boot-starter-cache`（Boot 4 加上測試 starter `spring-boot-starter-cache-test`；Boot 3 starter 名稱相同）與 `com.github.ben-manes.caffeine:caffeine`（BOM 管理）。

```java
@Configuration(proxyBeanMethods = false)
@EnableCaching
class CachingConfig {}   // 獨立專屬類別，非 @SpringBootApplication 類別

@Service
class RateService {
	@Cacheable("rates")                                   // key = 方法引數
	public Rate expensive(String currency) { ... }

	@CacheEvict(value = "rates", allEntries = true)
	public void evict() {}
}
```

```properties
spring.cache.type=caffeine
spring.cache.cache-names=rates
spring.cache.caffeine.spec=maximumSize=500,expireAfterWrite=10m
```

- 在 Boot 4.1.1 上驗證：第二次呼叫直接從快取提供，`evict()` 會強制重新載入。務必設定 `maximumSize` 與過期時間；未設限的快取會導致記憶體流失。
- 快取不可變的 DTO/record，而非受管的 JPA 實體。快取是個別 JVM 獨立的：若有多個執行個體，僅在使用者要求時才使用分散式快取（Redis），且需預期 Caffeine 在節點間會出現過期資料。
- `@Cacheable` 是基於代理機制的：自我呼叫與 `private` 方法會繞過它。請勿快取具有副作用的方法或您不打算快取的 `null` 回傳值。
- 在 `@SpringBootApplication` 中啟用快取會破壞未註冊 `CacheManager` 的切片測試（已驗證：`@DataJpaTest` 會失敗並顯示「No qualifying bean of type CacheManager」），因此需要使用專屬的 `@Configuration`。
- 若要在 Micrometer 中公開快取統計資訊，請呼叫 `recordStats`（Caffeine spec 設定 `recordStats`）；否則 Boot 會記錄快取未記錄統計資訊的警告（已觀察到）。

## 排程

```java
@Configuration(proxyBeanMethods = false)
@EnableScheduling
class SchedulingConfig {}

@Scheduled(fixedDelayString = "${app.tick:PT10S}")   // 或 cron = "0 0 * * * *", zone = "UTC"
void cleanup() { ... }
```

已驗證：`@Scheduled(fixedDelayString = "${...:100ms}")` 可在 Boot 4.1.1 上執行。優先使用 `fixedDelay` 而非 `fixedRate` 以避免重疊執行。`@Scheduled` 會在**每個執行個體**上執行：若有多個複本，請使用分散式鎖定（ShedLock）或外部排程器；僅在詢問後才新增。排程方法不接收引數，且絕不能無聲拋出未處理的例外狀況：應進行記錄與處理。

## 非同步與虛擬執行緒

```properties
spring.threads.virtual.enabled=true     # Java 21+, Boot 3.2+
```

設定此屬性後，Boot 會在虛擬執行緒上執行 Tomcat/Jetty 請求處理、`@Async` 任務（透過自動設定的 task executor）以及其他 Boot 管理的 executor。在 Boot 4.1.1 上驗證：`@Async` 方法回報 `Thread.currentThread().isVirtual() == true`。

```java
@Configuration(proxyBeanMethods = false)
@EnableAsync
class AsyncConfig {}

@Async
public CompletableFuture<Result> compute() { ... }   // 回傳 void 或 CompletableFuture
```

- 需要 Java 21+；在 Boot 3 上此屬性自 3.2 起提供。請勿在 Java 17 上啟用。
- 虛擬執行緒對阻斷式 I/O 工作負載（JDBC、HTTP）有很大助益。它們不會加速 CPU 密集型工作。連線池大小會成為瓶頸：請審慎設定 HikariCP 連線池大小，並考慮對下游呼叫進行限制。在 JDK 24 之前，阻斷式呼叫周圍的 `synchronized` 區塊會固定（pin）載體執行緒；在該處優先使用 `ReentrantLock`。
- `@Async` 與 `@Transactional` 一樣基於代理機制：呼叫者必須是另一個 bean，且除非明確傳播，否則交易/安全性上下文不會延續至非同步執行緒中。
- 當 `@Async` 回傳 `void` 時，除非設定了 `AsyncUncaughtExceptionHandler`，否則例外狀況將會遺失。
