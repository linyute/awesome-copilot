# Spring Boot 3 與 4 的差異（產生或編輯程式碼時）

請先偵測專案的 Spring Boot 主要版本（參閱 [versions.md](versions.md)）；僅套用相符的小節。請對照 [Spring Boot 4.0 移轉指南](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)進行驗證。

## 基準線

| | Boot 3.x | Boot 4.x |
|--|----------|----------|
| Spring Framework | 6.x | 7.x |
| Java | 17+ | 17+（建議 25） |
| Jakarta EE | 10 | 11 |
| Jackson | 2 (`com.fasterxml.jackson.databind`) | 3 (`tools.jackson.databind`) |
| Testcontainers | 1.x | 2.x |

## Boot 4 中常見的中斷變更

1. **模組化 starter。** Web 為 `spring-boot-starter-webmvc`（而非 `-web`），且每種技術都有對應的測試 starter（`spring-boot-starter-webmvc-test`、`spring-boot-starter-data-jpa-test`...）。請使用 start.spring.io 產生，而非自行猜測產物名稱。
2. **Jackson 3。** 僅 API 類別變更命名空間（`tools.jackson.databind.ObjectMapper`）；註解仍維持在 `com.fasterxml.jackson.annotation`。
3. **測試註解位置變更**，例如 `@WebMvcTest` 現為 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`。`@MockitoBean` / `@MockitoSpyBean` 取代了 `@MockBean` / `@SpyBean`（自 3.4 起棄用並在 Boot 4 中移除；在 Boot 3.4+ 允許的所有地方使用新註解）。參閱 `spring-boot-testing` 技能。
4. **Testcontainers 2.x。** 產物帶有前綴（`testcontainers-postgresql`、`testcontainers-junit-jupiter`）且類別命名空間已變更（`org.testcontainers.postgresql.PostgreSQLContainer`）。若使用 Boot 3 請維持 1.x 名稱。
5. **AOT/原生建構的主要類別。** 若 `process-aot` 找不到 main 類別，請將 `<start-class>`（Maven 屬性）設定為完整符合資格的 `@SpringBootApplication` 類別名稱。
6. 若測試位於子套件中，**將產生的 `TestcontainersConfiguration` 設為 public**。

## Boot 3 專案

當專案使用 Boot 3 時請保持在 Boot 3（start.spring.io 無法產生新的 3.x 專案，參閱 [versions.md](versions.md)）：使用 `spring-boot-starter-web`、`org.testcontainers.containers.PostgreSQLContainer`（Testcontainers 1.x）、`@MockBean`、Jackson 2。除非使用者要求，否則請勿移轉；Boot 3.5 → 4.0 是一項獨立且需審慎評估的升級。
