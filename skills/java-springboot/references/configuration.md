# 設定

格式、設定檔 profile、`.env` 與密鑰基礎概念，以及簡短的 `@ConfigurationProperties` 範例已收錄於 `create-spring-boot-java-project`（`references/configuration.md`）；如需這些內容請參閱該文件，並遵循專案現有的單一格式（properties 或 YAML）。本檔案補充修改現有應用程式時所需的內容。已在 Boot 4.1.1 上驗證。

## 型別安全屬性（Record）

```java
@ConfigurationProperties(prefix = "app.mail")
@Validated
public record MailProperties(@NotBlank String from, @DefaultValue("3") @Positive int retries,
		@DefaultValue("5s") Duration timeout) {}
```

```properties
app.mail.from=noreply@example.com
```

- Record 透過其標準建構子（canonical constructor）進行綁定（建構子綁定為 record 的預設行為）。對選用值使用 `@DefaultValue`（`org.springframework.boot.context.properties.bind.DefaultValue`）；`Duration`、`DataSize`、列舉與 `List`/`Map` 均原生支援綁定（`5s`、`PT5S`、`10MB`）。
- 在應用程式類別上使用 `@ConfigurationPropertiesScan`（或 `@EnableConfigurationProperties(MailProperties.class)`）進行註冊。已驗證：當僅設定 `from` 時，該 record 作為 bean 注入，其 `retries == 3` 且 `timeout == 5s`。
- `@Validated` + `jakarta.validation` 限制條件會在設定無效時讓應用程式在啟動時失敗，這正是預期的防護行為。驗證功能需要驗證 starter（`spring-boot-starter-validation`）。
- 優先使用 `@ConfigurationProperties` 而非分散各處的 `@Value`；僅在一次性單獨值時使用 `@Value`。新增 `spring-boot-configuration-processor`（作為 optional/annotation-processor 路徑，如同 start.spring.io 的做法）以提供 IDE metadata。
- 不可變性：無 setter；巢狀設定表示為巢狀 record。
- 在需要的地方注入該 record；切勿在商業邏輯程式碼中直接讀取 `Environment`。

## 設定檔 Profile

- 在 `application.properties` 中保留適合生產環境的安全預設值；profile 專屬檔案（`application-dev.properties`）僅覆寫相異之處。透過 `SPRING_PROFILES_ACTIVE` 啟用。
- 當部署需要多個 profile 時，可使用 `spring.profiles.group.prod=prod-db,prod-observability` 組織相關的 profile。
- 對 bean 謹慎使用 `@Profile`；切勿依據 profile 名稱在應用程式邏輯中進行分支判斷。
- 請勿在 `src/main` 中提供 `test` profile；測試應使用 `src/test/resources` 或 `@TestPropertySource`（請參閱 `spring-boot-testing`）。

## 設定匯入與密鑰

```properties
spring.config.import=optional:file:.env[.properties],optional:configtree:/run/secrets/
```

- `optional:` 可在檔案不存在時避免啟動失敗（本機開發）；對於生產環境中必須存在的值請移除此關鍵字。
- 掛載為檔案的 Kubernetes/Docker 密鑰：`configtree:` 會將每個檔案映射為一個屬性（檔案名稱 = 鍵名）。
- 環境變數透過寬鬆綁定（relaxed binding）覆寫檔案（`APP_MAIL_FROM` -> `app.mail.from`）。
- 切勿提交 `.env` 或真實憑證；請提交 `.env.sample`。切勿記錄包含密鑰的屬性值，且切勿公開暴露 `/actuator/env` 與 `/actuator/configprops`（`spring-observability`、`spring-security`）。
- 除非專案已使用 Vault 或 Spring Cloud Config 等外部化設定來源，否則這些均超出範圍；請遵循其現有的匯入設定。

## 開發時期服務

### Docker Compose

新增 `spring-boot-docker-compose`（start.spring.io 會新增此依賴項，為 optional/development-only）。在專案根目錄備妥 `compose.yaml` 後，執行 `./mvnw spring-boot:run` 會自動啟動服務並連結連線詳細資訊。鎖定映像檔標籤（start.spring.io 會產生 `postgres:latest`；請替換它，參閱 `create-spring-boot-java-project` 的 `references/database.md`）。本技能驗證時未執行此項目：僅檢查產生的檔案。

### 開發時期的 Testcontainers

start.spring.io（隨附 `testcontainers` 依賴項）會在 `src/test` 中產生 `TestcontainersConfiguration` 與 `TestDemoApplication`：

```java
public class TestDemoApplication {
	public static void main(String[] args) {
		SpringApplication.from(DemoApplication::main).with(TestcontainersConfiguration.class).run(args);
	}
}
```

使用 `./mvnw spring-boot:test-run`（Gradle: `./gradlew bootTestRun`）執行。在 Boot 4.1.1 上驗證：PostgreSQL 與 Kafka 容器從 `@ServiceConnection` bean 啟動，應用程式在 `/actuator/health` 達到 `UP` 狀態，且停止應用程式時容器被移除（Ryuk）。若從其他套件使用 `TestcontainersConfiguration`，請將其設為 `public`（參閱 `create-spring-boot-java-project` 的 `references/spring-boot-4.md`）。在開發時期服務中選擇 Compose 或 Testcontainers 其一即可，不要兩者兼施，以避免兩個資料庫爭搶相同的屬性。

## Boot 3 對比 4

具有相同的屬性綁定規則。影響設定的 Boot 4 變更：Jackson 屬性針對 Jackson 3 繼續在 `spring.jackson.*` 下運作（Jackson 2 相容性位於獨立模組；請查閱遷移指南），模組化自動設定（類別移至 `org.springframework.boot.<technology>.autoconfigure`，這僅在您依類別名稱參照或排除自動設定時才有影響：`spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration`）。針對升級遷移本身請使用 `spring-boot-4-migration` 技能。
