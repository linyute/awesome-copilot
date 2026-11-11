# 反應式對比阻斷式、Mutiny、傳訊

## 執行緒模型

Quarkus REST 根據方法簽章選取執行執行緒（在 3.40.1 上透過執行緒名稱檢查驗證）：

| 方法 | 執行於 |
|---|---|
| 傳回一般型別，無註釋（Quarkus REST 預設，命令式） | 工作執行緒（`executor-thread-N`） |
| `@Blocking` | 工作執行緒 |
| `@NonBlocking` | 事件迴圈（`vert.x-eventloop-thread-N`） |
| 傳回 `Uni`/`Multi`/`CompletionStage` | 事件迴圈 |
| `@RunOnVirtualThread` | 虛擬執行緒（`Thread.currentThread().isVirtual()` 為 true） |

（執行緒名稱包含 `eventloop`，而非 `event-loop`。）註釋：`io.smallrye.common.annotation.Blocking`、`NonBlocking`、`RunOnVirtualThread`。各擴充功能（Reactive Messaging、gRPC、排程器）的預設行為有所不同，因此在關鍵時刻請明確標註。

**事件迴圈常見陷阱**：絕不要在事件迴圈上呼叫阻斷式 JDBC/Panache ORM、`Thread.sleep`、`Uni.await().indefinitely()` 或檔案/HTTP 阻斷式用戶端；Vert.x 會記錄「blocked thread」警告，且 Quarkus 在 I/O 執行緒上執行阻斷式 Panache 呼叫時會擲出 `IllegalStateException`。請使用 `@Blocking`、`@RunOnVirtualThread` 或 `Uni...runSubscriptionOn(Infrastructure.getDefaultWorkerPool())` 轉移工作。

**虛擬執行緒**：`@RunOnVirtualThread` 需要 Java 21+。注意 Pinning 問題（圍繞阻斷呼叫的 `synchronized` 區塊）以及對 ThreadLocal 的依賴；用於阻斷式 I/O 密集型端點，而非 CPU 密集型工作。

## Mutiny 常見陷阱

- 在訂閱之前什麼都不會執行；從資源傳回 `Uni` 即會對其進行訂閱。在測試或 `@Blocking` 程式碼之外避免使用 `await().indefinitely()`。
- `Uni.createFrom().item(supplier)` 在訂閱執行緒（對 REST 而言為事件迴圈）上執行 supplier，因此請保持其為非阻斷（已驗證）。

## 使用 Kafka 的 SmallRye Reactive Messaging

擴充功能：`quarkus-messaging-kafka`。在新增前請先詢問使用者。當未設定 `kafka.bootstrap.servers` 時，Dev Services 會在開發/測試環境啟動 Kafka 代理器（在 3.40.1 與 3.27.6 上驗證：搭配 Docker 成功完成來回傳輸）。

```properties
mp.messaging.outgoing.words-out.topic=words
mp.messaging.incoming.words-in.topic=words
mp.messaging.incoming.words-in.auto.offset.reset=earliest
# prod
%prod.kafka.bootstrap.servers=${KAFKA_BOOTSTRAP_SERVERS}
```

```java
@ApplicationScoped
public class Words {
    @Channel("words-out") Emitter<String> emitter;
    void onStart(@Observes StartupEvent e) { emitter.send("hello"); }

    @Incoming("words-in")
    public void sink(String w) { /* process */ }
}
```

- 色彩通道名稱將設定（`mp.messaging.{incoming|outgoing}.<channel>.*`）連結至程式碼。連接器 ID 為 `smallrye-kafka`；僅在它是類別路徑上唯一的傳訊連接器時才會自動推斷（若同時安裝了 AMQP 或其他連接器，請明確設定 `mp.messaging.<direction>.<channel>.connector=smallrye-kafka`）。常見型別的序列化器會自動推斷；自訂類別請設定 `value.serializer`/`value.deserializer`，或使用 Quarkus 為可透過 Jackson 序列化之型別所產生的 JSON serde（此處未驗證；請測試它）。
- 預設執行緒遵循方法簽章：同步方法（例如 `void sink(String)`）已在工作執行緒上執行，而非同步簽章（`Uni`、`CompletionStage`、`Multi`）預設在事件迴圈上執行。`@Transactional` 隱含阻斷。為執行阻斷工作（JDBC、Panache）的非同步簽章方法新增 `@Blocking`，並使用 `@NonBlocking` 強制使用事件迴圈。
- 確認（Acknowledgement）：承載方法在傳回時會自動認可（auto-acked）；使用 `Message<T>` 與 `msg.ack()`/`nack()` 進行控制。正式環境請加入死信/失敗策略（`failure-strategy=dead-letter-queue`）。
- 對應至相同 `topic` 的不同通道名稱會透過 Kafka 傳輸（已驗證來回傳輸）。在單一應用程式中對 `@Outgoing` 與 `@Incoming` 使用相同的通道名稱是記憶體內連結，絕不會到達代理器。
- 在測試中使用 `Awaitility` 等候收集的清單進行驗證（已驗證）；對於無代理器的測試，新增測試相依性 `io.smallrye.reactive:smallrye-reactive-messaging-in-memory` 並使用 `InMemoryConnector` 切換通道（請參閱 Quarkus Kafka/傳訊指南；此處未驗證）。
- AMQP：`quarkus-messaging-amqp`（`mp.messaging.*.connector=smallrye-amqp`）；AMQP Dev Service 會啟動 ActiveMQ Artemis 代理器。此處未驗證。
