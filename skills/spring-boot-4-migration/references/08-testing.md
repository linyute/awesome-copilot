這是權威的測試移轉參考文件。有關 Boot 4 測試撰寫模式（Testcontainers 2.0、RestTestClient、JUnit 6），請參閱 `spring-boot-testing` 技能（`references/sb4-migration.md`）。

## 測試框架變更

### 移除 Mockito 整合

`MockitoTestExecutionListener` 已移除（在 3.4 中已棄用）。

**移轉至 MockitoExtension：**
```kotlin
// Old (Spring Boot 3.x)
import org.springframework.boot.test.context.SpringBootTest
import org.mockito.Mock
import org.mockito.Captor

@SpringBootTest
class MyServiceTest {
    @Mock
    private lateinit var repository: MyRepository

    @Captor
    private lateinit var captor: ArgumentCaptor<String>
}

// New (Spring Boot 4.0)
import org.springframework.boot.test.context.SpringBootTest
import org.mockito.Mock
import org.mockito.Captor
import org.mockito.junit.jupiter.MockitoExtension
import org.junit.jupiter.api.extension.ExtendWith

@SpringBootTest
@ExtendWith(MockitoExtension::class) // Explicit extension required
class MyServiceTest {
    @Mock
    private lateinit var repository: MyRepository

    @Captor
    private lateinit var captor: ArgumentCaptor<String>
}
```

### 移除 @MockBean 與 @SpyBean

使用 `org.springframework.test.context.bean.override.mockito.MockitoBean`/`MockitoSpyBean` 取代 `org.springframework.boot.test.mock.mockito.MockBean`/`SpyBean`（Spring Framework 6.2+，因此可先在 Boot 3.5 上完成此項替換）。切片與 `@AutoConfigure*` 註釋移至各技術專用套件，例如 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`/`AutoConfigureMockMvc` 與 `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`；各自需要對應的 `spring-boot-starter-*-test` 相依性。

### @SpringBootTest 變更

`@SpringBootTest` 不再自動提供 **WebTestClient** 或 **TestRestTemplate**。在 Boot 3 上 **MockMVC** 本就已需要 `@AutoConfigureMockMvc`；僅其套件名稱發生變更。

#### MockMVC 組態

```kotlin
// Old (Spring Boot 3.x)
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
}

// New (Spring Boot 4.0)
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc.HtmlUnit

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc // New package
class ControllerTest {
    @Autowired
    private lateinit var mockMvc: MockMvc
}

// HtmlUnit configuration moved to annotation attribute
@AutoConfigureMockMvc(
    htmlUnit = HtmlUnit(webClient = false, webDriver = false)
)
```

#### WebTestClient 組態

```kotlin
// Old (Spring Boot 3.x)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebFluxTest {
    @Autowired
    private lateinit var webTestClient: WebTestClient // Available automatically
}

// New (Spring Boot 4.0)
import org.springframework.boot.webtestclient.autoconfigure.AutoConfigureWebTestClient

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient // Explicit annotation required
class WebFluxTest {
    @Autowired
    private lateinit var webTestClient: WebTestClient
}
```

#### TestRestTemplate → RestTestClient（建議）

**Spring Boot 4.0 引入了 `RestTestClient`** 作為 `TestRestTemplate` 的現代替代方案。

```kotlin
// Old approach (still works with annotation)
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate
import org.springframework.boot.resttestclient.TestRestTemplate

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate // Required in 4.0
class RestApiTest {
    @Autowired
    private lateinit var testRestTemplate: TestRestTemplate
}

// New recommended approach
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient
import org.springframework.test.web.servlet.client.RestTestClient

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient // New annotation
class RestApiTest {
    @Autowired
    private lateinit var restTestClient: RestTestClient

    @Test
    fun testEndpoint() {
        restTestClient.get()
            .uri("/api/users")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(User::class.java)
    }
}
```

**TestRestTemplate 套件變更（若仍在使用）：**

**重要：** 若繼續使用 `TestRestTemplate`，您必須：
1. 加入 `spring-boot-resttestclient` 測試相依性加上 `spring-boot-starter-restclient`（已驗證：沒有它上下文會因為 `NoClassDefFoundError: org/springframework/boot/restclient/RestTemplateBuilder` 而失敗）
2. **更新套件匯入**（類別已搬移至新套件）

**libs.versions.toml：**
```toml
[libraries]
spring-boot-resttestclient = { module = "org.springframework.boot:spring-boot-resttestclient", version.ref = "springBoot" }
spring-boot-starter-restclient = { module = "org.springframework.boot:spring-boot-starter-restclient", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    testImplementation(libs.spring.boot.resttestclient)
    testImplementation(libs.spring.boot.starter.restclient) // provides RestTemplateBuilder
}
```

**更新套件匯入（必要）：**
```kotlin
// Old package import - will cause compilation failure
// import org.springframework.boot.test.web.client.TestRestTemplate

// New package import - required in Spring Boot 4.0
import org.springframework.boot.resttestclient.TestRestTemplate
```

### @PropertyMapping 註釋重新定位

```kotlin
// Old (Spring Boot 3.x)
import org.springframework.boot.test.autoconfigure.properties.PropertyMapping
import org.springframework.boot.test.autoconfigure.properties.Skip

// New (Spring Boot 4.0)
import org.springframework.boot.test.context.PropertyMapping
import org.springframework.boot.test.context.PropertyMapping.Skip
```

