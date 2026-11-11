## 模組重組與 Starter 變更

### 關鍵：模組化架構

Spring Boot 4.0 引入了**更小、聚焦的模組**來取代大型單體 jar。這需要更新大多數專案中的相依性。

**函式庫作者的重要注意事項：** 由於模組化工作與套件重組，**強烈反對在同一個構件中同時支援 Spring Boot 3 與 Spring Boot 4**。函式庫作者應為每個主要版本發布獨立的構件，以避免執行階段衝突並確保乾淨的相依性管理。

### 移轉策略：選擇一種做法

#### 選項 1：技術專用 Starter（正式環境建議）

Spring Boot 涵蓋的大多數技術現在都有**專用的測試 starter 伴隨模組**。這提供了細粒度的控制。

**完整 Starter 參考：** 如需所有可用 starter（Core、Web、Database、Spring Data、Messaging、Security、Templating、Production-Ready 等）及其測試伴隨模組的完整表格，請參閱[官方 Spring Boot 4.0 移轉指南](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide#starters)。

**libs.versions.toml：**
```toml
[versions]
springBoot = "4.0.x" # Target 4.0 patch release

[libraries]
# Core starters with dedicated test modules
spring-boot-starter-webmvc = { module = "org.springframework.boot:spring-boot-starter-webmvc", version.ref = "springBoot" }
spring-boot-starter-webmvc-test = { module = "org.springframework.boot:spring-boot-starter-webmvc-test", version.ref = "springBoot" }

spring-boot-starter-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa", version.ref = "springBoot" }
spring-boot-starter-data-jpa-test = { module = "org.springframework.boot:spring-boot-starter-data-jpa-test", version.ref = "springBoot" }

spring-boot-starter-security = { module = "org.springframework.boot:spring-boot-starter-security", version.ref = "springBoot" }
spring-boot-starter-security-test = { module = "org.springframework.boot:spring-boot-starter-security-test", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.security)

    testImplementation(libs.spring.boot.starter.webmvc.test)
    testImplementation(libs.spring.boot.starter.data.jpa.test)
    testImplementation(libs.spring.boot.starter.security.test)
}
```

#### 選項 2：傳統 Starter（快速移轉，暫時性）

傳統 starter 恢復的是 Boot 3 的*模組細粒度*，而不是 Boot 3 的 starter。在 Boot 4.x 上透過移轉的 JPA + security + web 專案驗證：

- `spring-boot-starter-classic` = `spring-boot-starter` + `spring-boot-autoconfigure-classic`：所有自動組態模組，但不包含其函式庫相依性。
- `spring-boot-starter-test-classic` = `spring-boot-starter-test` + 所有 `*-test` 模組（webmvc、data-jpa、security，...）。
- 您仍然需要宣告技術 starter（`spring-boot-starter-webmvc`、`-data-jpa`、`-security`，...）：若僅宣告傳統 starter，建構會因為缺少 `jakarta.persistence`、Spring Security 與 Jackson 類別而失敗。
- 它們**不會**帶回舊套件或 `@MockBean`：測試/自動組態匯入仍然必須進行移轉（請參閱測試參考檔案）。
- `spring-boot-starter-web` 本身在 Boot 4.x 中仍可解析為 `spring-boot-starter-webmvc` 的已棄用別名。

**libs.versions.toml：**
```toml
[libraries]
spring-boot-starter-classic = { module = "org.springframework.boot:spring-boot-starter-classic", version.ref = "springBoot" }
spring-boot-starter-test-classic = { module = "org.springframework.boot:spring-boot-starter-test-classic", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.classic)
    implementation(libs.spring.boot.starter.webmvc) // technology starters are still required
    testImplementation(libs.spring.boot.starter.test.classic)
}
```

**注意**：Spring Boot 移轉指南建議最終應從傳統 starter 移轉出去（那裡未說明是否以及何時會將其移除）。請規劃向技術專用 starter 進行移轉。

#### 選項 3：直接模組相依性（進階）

用於對傳遞性相依性進行明確控制：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-webmvc = { module = "org.springframework.boot:spring-boot-webmvc", version.ref = "springBoot" }
spring-boot-webmvc-test = { module = "org.springframework.boot:spring-boot-webmvc-test", version.ref = "springBoot" }
```

### 重新命名的 Starter（破壞性變更）

在您的 `libs.versions.toml` 中更新這些 starter 名稱：

| Spring Boot 3.x | Spring Boot 4.0 | 說明 |
|----------------|-----------------|-------|
| `spring-boot-starter-web` | `spring-boot-starter-webmvc` | 明確命名 |
| `spring-boot-starter-web-services` | `spring-boot-starter-webservices` | 移除連字號 |
| `spring-boot-starter-aop` | `spring-boot-starter-aspectj` | 僅在使用 `org.aspectj.lang.annotation` 時需要 |
| `spring-boot-starter-oauth2-authorization-server` | `spring-boot-starter-security-oauth2-authorization-server` | Security 命名空間 |
| `spring-boot-starter-oauth2-client` | `spring-boot-starter-security-oauth2-client` | Security 命名空間 |
| `spring-boot-starter-oauth2-resource-server` | `spring-boot-starter-security-oauth2-resource-server` | Security 命名空間 |

**移轉範例（libs.versions.toml）：**
```toml
[libraries]
# Old (Spring Boot 3.x)
# spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "springBoot" }
# spring-boot-starter-oauth2-client = { module = "org.springframework.boot:spring-boot-starter-oauth2-client", version.ref = "springBoot" }

# New (Spring Boot 4.0)
spring-boot-starter-webmvc = { module = "org.springframework.boot:spring-boot-starter-webmvc", version.ref = "springBoot" }
spring-boot-starter-security-oauth2-client = { module = "org.springframework.boot:spring-boot-starter-security-oauth2-client", version.ref = "springBoot" }
```

### AspectJ Starter 釐清

僅在您**實際使用 AspectJ 註釋**時才引入 `spring-boot-starter-aspectj`：

```kotlin
// Only needed if code uses org.aspectj.lang.annotation package
import org.aspectj.lang.annotation.Aspect
import org.aspectj.lang.annotation.Before

@Aspect
class MyAspect {
    @Before("execution(* com.example..*(..))")
    fun beforeAdvice() { }
}
```

若未使用 AspectJ，請移除該相依性。

## 已移除的功能與替代方案

### 內嵌伺服器

#### 移除 Undertow

**Undertow 已完全移除** - 與 Servlet 6.1 基準不相容。

**移轉：**
- 使用 **Tomcat**（預設）或 **Jetty**
- **切勿**將 Spring Boot 4.0 應用程式部署至非 Servlet 6.1 容器

**libs.versions.toml：**
```toml
[libraries]
# Remove Undertow
# spring-boot-starter-undertow = { module = "org.springframework.boot:spring-boot-starter-undertow", version.ref = "springBoot" }

# Use Tomcat (default) or Jetty
spring-boot-starter-jetty = { module = "org.springframework.boot:spring-boot-starter-jetty", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.starter.webmvc) {
        exclude(group = "org.springframework.boot", module = "spring-boot-starter-tomcat")
    }
    implementation(libs.spring.boot.starter.jetty) // Alternative to Tomcat
}
```

### 會話管理

#### 移除 Spring Session Hazelcast 與 MongoDB

**由各自團隊維護**，不再納入 Spring Boot 相依性管理中。

**移轉（libs.versions.toml）：**
```toml
[versions]
hazelcast-spring-session = "3.x.x" # Check Hazelcast documentation
mongodb-spring-session = "4.x.x"   # Check MongoDB documentation

[libraries]
# Explicit versions required
spring-session-hazelcast = { module = "com.hazelcast:spring-session-hazelcast", version.ref = "hazelcast-spring-session" }
spring-session-mongodb = { module = "org.springframework.session:spring-session-data-mongodb", version.ref = "mongodb-spring-session" }
```

### 反應式傳訊

#### 移除 Pulsar Reactive

Spring Pulsar 放棄了 Reactor 支援 - 反應式 Pulsar 用戶端已移除。

**移轉：**
- 使用命令式 Pulsar 用戶端
- 或移轉至替代反應式傳訊（Kafka、RabbitMQ）

### 測試

#### 移除 Spock Framework

**Spock 尚未支援 Groovy 5**（Spring Boot 4.0 所需）。

**移轉：**
- 搭配 Kotlin 使用 JUnit 5
- 或等待 Spock 支援 Groovy 5 相容性

### 建構功能

#### 移除可執行 Jar 啟動指令碼

已移除用於「完全可執行」jar 的內嵌啟動指令碼（Unix 特有，用途有限）。

**build.gradle.kts（移除）：**
```kotlin
// Remove this configuration
tasks.bootJar {
    launchScript() // No longer supported
}
```

**替代方案：**
- 直接使用 `java -jar app.jar`
- 使用 Gradle Application 外掛程式取得原生啟動器
- 使用 systemd 服務檔案

#### 移除傳統 Uber-Jar 載入器

傳統 uber-jar 載入器已移除。從建構中移除任何載入器實作組態。

**Maven (pom.xml) - 移除：**
```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <loaderImplementation>CLASSIC</loaderImplementation> <!-- REMOVE THIS -->
            </configuration>
        </plugin>
    </plugins>
</build>
```

**Gradle (build.gradle.kts) - 移除：**
```kotlin
tasks.bootJar {
    loaderImplementation = org.springframework.boot.loader.tools.LoaderImplementation.CLASSIC // REMOVE THIS
}
```

