---
name: openapi-to-application-java-spring-boot
description: '使用規格優先 (spec-first) 方法從 OpenAPI 3 規格產生 Spring Boot (Java) 應用程式：openapi-generator (Maven 或 Gradle) 產生 API 介面與 DTO，由您實作控制器、服務、持續性、安全性與測試。當需要從 OpenAPI/Swagger 檔案建構、搭建架構或實作 Spring Boot API 時使用。'
---

# 從 OpenAPI 規格建構 Spring Boot 應用程式

規格優先 (Spec-first)：OpenAPI 檔案為單一事實來源。在建構時期**僅產生介面與 DTO** (切勿認可產生的程式碼)，然後手動撰寫實作程式碼。已於 Spring Boot 4.0.8 與 4.1.1、openapi-generator 7.26.0 (Maven 外掛程式、Gradle Groovy 及 Kotlin DSL)、JDK 21+ 驗證通過。

## 步驟 0: 偵測與收集

- 既有的 `pom.xml` / `build.gradle(.kts)`: 保留其建構工具與 Spring Boot 版本，**切勿暗中升級**，將產生器新增至其中。否則請使用 `create-spring-boot-java-project` 技能建立專案 (相依套件: `web`、`validation`、`actuator`；僅在需要時新增 `data-jpa`、`postgresql`、`security`)。
- 取得規格 (檔案、URL 或貼上的內容) 並將其儲存為 `src/main/resources/openapi/<name>.yaml`。接受 3.0.x 與 3.1.x；Swagger 2.0 必須先進行轉換。
- 僅詢問規格未回答的問題：持續性 (記憶體內部 vs 資料庫)、驗證機制、套件名稱。

## 步驟 1: 審查規格

檢查唯一的 `operationId` (它們會成為方法名稱)、`tags` (每個標籤會產生一個介面)、可重複使用的 `components/schemas`、`required` 清單、驗證條件約束 (`minLength`、`maximum`、`pattern`)、錯誤回應及 `securitySchemes`。標記缺失處並修改規格，而非修改產生的程式碼。

## 步驟 2: 設定產生器

在屬性中釘選版本；在修改前先在 Maven Central 或[產生器文件](https://openapi-generator.tech/docs/generators/spring)上檢查最新版本。

Maven (`pom.xml`，位於 `<build><plugins>` 中，在 `spring-boot-maven-plugin` 之前)：

```xml
<plugin>
  <groupId>org.openapitools</groupId>
  <artifactId>openapi-generator-maven-plugin</artifactId>
  <version>${openapi-generator.version}</version> <!-- 7.26.0 -->
  <executions>
    <execution>
      <goals><goal>generate</goal></goals>
      <configuration>
        <inputSpec>${project.basedir}/src/main/resources/openapi/petstore.yaml</inputSpec>
        <generatorName>spring</generatorName>
        <apiPackage>com.example.petstore.api</apiPackage>
        <modelPackage>com.example.petstore.api.model</modelPackage>
        <generateSupportingFiles>false</generateSupportingFiles>
        <configOptions>
          <interfaceOnly>true</interfaceOnly>
          <requestMappingMode>api_interface</requestMappingMode>
          <useSpringBoot4>true</useSpringBoot4>
          <useJackson3>true</useJackson3>
          <useSpringBuiltInValidation>true</useSpringBuiltInValidation>
          <useTags>true</useTags>
          <skipDefaultInterface>true</skipDefaultInterface>
          <openApiNullable>false</openApiNullable>
          <documentationProvider>none</documentationProvider>
          <annotationLibrary>none</annotationLibrary>
        </configOptions>
      </configuration>
    </execution>
  </executions>
</plugin>
```

Gradle (Groovy DSL；外掛程式 `id 'org.openapi.generator' version '7.26.0'`):

```groovy
openApiGenerate {
  generatorName = 'spring'
  inputSpec = "$projectDir/src/main/resources/openapi/petstore.yaml".toString()
  outputDir = layout.buildDirectory.dir('generated/openapi').get().asFile.path
  apiPackage = 'com.example.petstore.api'
  modelPackage = 'com.example.petstore.api.model'
  generateApiTests = false
  generateModelTests = false
  generateSupportingFiles = false
  configOptions = [interfaceOnly: 'true', requestMappingMode: 'api_interface', useSpringBoot4: 'true', useJackson3: 'true', useSpringBuiltInValidation: 'true', useTags: 'true',
    skipDefaultInterface: 'true', openApiNullable: 'false', documentationProvider: 'none', annotationLibrary: 'none']
}
sourceSets.main.java.srcDir layout.buildDirectory.dir('generated/openapi/src/main/java')
tasks.named('compileJava') { dependsOn 'openApiGenerate' }
```

Gradle (Kotlin DSL；外掛程式 `id("org.openapi.generator") version "7.26.0"`，從 Gradle 外掛程式入口網站解析，因此請在 `pluginManagement` 中保留 `gradlePluginPortal()`):

```kotlin
openApiGenerate {
    generatorName.set("spring")
    inputSpec.set("$projectDir/src/main/resources/openapi/petstore.yaml")
    outputDir.set(layout.buildDirectory.dir("generated/openapi").get().asFile.path)
    apiPackage.set("com.example.petstore.api")
    modelPackage.set("com.example.petstore.api.model")
    generateApiTests.set(false)
    generateModelTests.set(false)
    generateSupportingFiles.set(false)
    configOptions.set(mapOf("interfaceOnly" to "true", "requestMappingMode" to "api_interface", "useSpringBoot4" to "true", "useJackson3" to "true", "useSpringBuiltInValidation" to "true", "useTags" to "true",
        "skipDefaultInterface" to "true", "openApiNullable" to "false", "documentationProvider" to "none", "annotationLibrary" to "none"))
}
sourceSets.main { java.srcDir(layout.buildDirectory.dir("generated/openapi/src/main/java")) }
tasks.compileJava { dependsOn("openApiGenerate") }
```

選項注意事項:

- **Spring Boot 3.x**: 移除 `useSpringBoot4` 與 `useJackson3` (`useSpringBoot3=true` 為預設值)。Boot 4 同時需要這兩個選項；Jackson 3 僅允許與 `useSpringBoot4` 一起使用。
- **請求參數驗證:** 針對 Boot 3.2+/4 (Framework 6.1+)，在所有建構工具設定中保留 `useSpringBuiltInValidation=true`。這會從產生的 API 介面中省略型別層級的 `@Validated`，讓 MVC 透過 `HandlerMethodValidationException` 處理受條件約束的查詢/路徑參數。針對 Boot 3.0/3.1，請將此選項保留為 `false` 以保留 AOP 驗證，並明確將請求參數的 `ConstraintViolationException` 映射至 HTTP 400 及規格的錯誤內文。切勿將服務層的條件約束違規一概映射至 400。絕不要修改產生的介面來改變驗證行為。
- **基底路徑 (Base paths):** 當未產生控制器時，`requestMappingMode=api_interface` 會將類別層級的基底路徑映射放置於介面上。若為 `servers: [{url: /v1}]` 且路徑為 `/pets`，請驗證 `/v1/pets`；切勿再透過控制器映射、`server.servlet.context-path` 或 Proxy 重寫重複新增 `/v1` 前綴。
- `interfaceOnly=true` 會產生 `<Tag>Api` 介面 (帶有 `@RequestMapping`/驗證註解) 及模型。`delegatePattern=true` (替代方案) 則會產生呼叫您實作的 `<Tag>ApiDelegate` 的控制器；建議使用 `interfaceOnly`，架構較為單純。若您使用 `delegatePattern` (已在 Boot 4.1.1 上驗證): 請移除 `skipDefaultInterface` (否則會破壞產生的 delegate 並導致編譯錯誤)；僅產生 `ApiUtil.java` 作為支援檔案，否則預設的 delegate 方法會因 `cannot find symbol ApiUtil` 失敗，而完整產生的支援檔案會新增 `OpenApiGeneratorApplication` 主要類別 (在 `bootJar` 中會出現 `Unable to find a single main class`): Maven 設定為 `<supportingFilesToGenerate>ApiUtil.java</supportingFilesToGenerate>` 而非 `<generateSupportingFiles>false</generateSupportingFiles>`，Gradle 設定為 `globalProperties = [apis: '', models: '', supportingFiles: 'ApiUtil.java']`。產生的 `<Tag>ApiController` 是位於 `apiPackage` 中的 `@Controller`: 它必須位於 `@SpringBootApplication` 套件下 (例如 `com.example.demo.api`)，否則不會被掃描且端點會傳回 404。
- `documentationProvider=none` 與 `annotationLibrary=none` 可避免將 springdoc/swagger 註解引入產生的程式碼中。提供規格服務/Swagger UI 是選用的：僅在要求時新增 `org.springdoc:springdoc-openapi-starter-webmvc-ui` (Boot 4 使用 3.x 系列，Boot 3 使用 2.8.x)；已在 Boot 4.1.1 上搭配 springdoc 3.1.1 驗證 (`/v3/api-docs` 傳回 OpenAPI 3.1 JSON，`/swagger-ui/index.html` 傳回 200)。
- `openApiNullable=false` 可避免引入 `jackson-databind-nullable` 相依套件；僅在規格具有包含可為 null 欄位的 PATCH 語意時才保留為 `true`。
- 產生的模型使用 `jakarta.validation`：類別路徑中必須包含 `spring-boot-starter-validation`。必要屬性會**依照產生順序**成為建構函式引數；在呼叫建構函式前，請先閱讀 `target/generated-sources/openapi` (或 `build/generated/openapi`) 中產生的類別。
- 僅在結構描述必須映射至現有類別時，才使用 `<importMappings>`/`<typeMappings>`。

## 步驟 3: 實作

- 每個產生的 `<Tag>Api` 介面對應一個 `@RestController`，並使用 `implements` 實作它，不加額外的映射註解 (它們繼承自介面)。保持控制器精簡；將邏輯放在 `@Service` 類別中並傳回 DTO，而非實體。明確將實體映射至產生的 DTO (若專案已使用 MapStruct 則使用 MapStruct 映射器)。
- 持續性: 僅在要求時使用記憶體內部儲存；否則使用與產生的 DTO 分離的 Spring Data JPA 實體與儲存庫，在開發環境中透過 Docker Compose 使用 PostgreSQL，並依據 `java-hibernate-jpa` 技能的結構描述管理規則處理結構描述 (正式環境使用 Flyway 或 Liquibase)。請參閱 `java-springboot` 技能。
- 錯誤處理: 使用 `@RestControllerAdvice` 保留每個操作宣告的錯誤狀態、媒體類型與回應結構描述，包括驗證失敗。針對請求內文處理 `MethodArgumentNotValidException`，而在 Boot 3.2+/4 上針對查詢/路徑參數處理 `HandlerMethodValidationException`；繼承 `ResponseEntityExceptionHandler` 時覆寫相對應的處理常式。僅在規格宣告時才傳回 RFC 9457 `ProblemDetail`；否則傳回宣告的錯誤 DTO，而非 Spring 的預設驗證回應。若錯誤回應遺失或不明確，請在變更合約前先詢問，而非逕自強制套用 Problem Details 或一概使用 400/404/409 策略。
- 安全性: 使用 `spring-security` 技能映射 `securitySchemes` (JWT 資源伺服器、API 金鑰篩選器、方法安全性)。除非宣告了範圍 (scope)，否則不要產生 `useSpringSecurityPreAuthorize`。
- 切勿編輯產生的原始檔；請修改規格或產生器選項並重新建構。

## 步驟 4: 測試與驗證

- 遵循 `spring-boot-testing` 技能: 每個控制器使用 `@WebMvcTest` 切片 (模擬服務)，使用 `@SpringBootTest` + MockMvc 測試正常路徑與每個寫入操作的一項驗證失敗，資料庫程式碼使用帶有 `@ServiceConnection` 的 Testcontainers (參閱 `java-testcontainers`)。
- 涵蓋規格中的每個操作：成功、找不到、無效輸入。測試無效且受條件約束的查詢/路徑參數以及無效的請求內文。針對錯誤回應 (包括驗證失敗)，宣告其狀態、內容類型與內文結構描述，而非僅斷言狀態碼。可選用 `openapi-generator validate -i <spec>` 在 CI 中斷言規格本身保持有效，或讓建構作業在產生錯誤時直接失敗。
- 執行 `./mvnw verify` 或 `./gradlew build`，然後啟動應用程式並使用 `curl` 測試一個端點加上 `/actuator/health`。包含來自具有非根伺服器 URL 規格的端點並斷言其完整路徑，以捕捉遺失或重複的基底前綴。
- 報告: 發現的規格問題、產生器版本與選項、寫入的檔案，以及任何延後的項目。
