## 核心框架變更

### 可為 Null 性註釋：JSpecify

Spring Boot 4.0 在整個程式碼庫中加入了 **JSpecify 可為 null 性註釋**。

**影響：**
- Kotlin null 安全性可能會標記新的警告/錯誤
- Null 檢查工具（SpotBugs、NullAway）可能會回報新問題
- **RestClient 方法（如 `body()`）現在已明確標記為可為 null** - 請始終檢查 null 或使用 `Objects.requireNonNull()`

**Kotlin 的移轉：**
```kotlin
// Explicit nullable types may be required
fun processUser(id: String?): User? {
    val nonNullId = id ?: return null // findById now requires a non-null ID
    return userRepository.findById(nonNullId).orElse(null) // Optional<User> -> User?
}

// RestClient body() can return null
val body: String? = restClient.get()
    .uri("https://api.example.com/data")
    .retrieve()
    .body(String::class.java) // Nullable - handle appropriately

if (body != null) {
    println(body.length)
}
```

**Actuator 端點參數：**
- 不能使用 `javax.annotations.NonNull` 或 `org.springframework.lang.Nullable`
- 請改用 `org.jspecify.annotations.Nullable`

**libs.versions.toml：**
```toml
[libraries]
jspecify = { module = "org.jspecify:jspecify", version = "1.0.0" }
```

### 套件重定位

#### BootstrapRegistry

**舊版匯入：**
```kotlin
import org.springframework.boot.BootstrapRegistry
```

**新版匯入：**
```kotlin
import org.springframework.boot.bootstrap.BootstrapRegistry
```

#### EnvironmentPostProcessor

**舊版匯入：**
```kotlin
import org.springframework.boot.env.EnvironmentPostProcessor
```

**新版匯入：**
```kotlin
import org.springframework.boot.EnvironmentPostProcessor
```

**更新 `META-INF/spring.factories`：**
```properties
# Old
org.springframework.boot.env.EnvironmentPostProcessor=com.example.MyPostProcessor

# New
org.springframework.boot.EnvironmentPostProcessor=com.example.MyPostProcessor
```

**注意：** 已棄用的形式暫時仍然可用，但未來將被移除。

#### Entity Scan

**舊版匯入：**
```kotlin
import org.springframework.boot.autoconfigure.domain.EntityScan
```

**新版匯入：**
```kotlin
import org.springframework.boot.persistence.autoconfigure.EntityScan
```

### 記錄（Logging）變更

#### Logback 預設字元集

記錄檔現在預設為 **UTF-8**（與 Log4j2 一致）：

**logback-spring.xml（明確設定）：**
```xml
<configuration>
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>app.log</file>
        <encoder>
            <charset>UTF-8</charset> <!-- Now default -->
            <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
        </encoder>
    </appender>
</configuration>
```

**主控台記錄：** 若可用（Java 17+）則使用 `Console#charset()`，否則退回使用 UTF-8。這在保持編碼一致的同時，提供了更好的平台相容性。

### DevTools 變更

#### 預設停用即時重載（Live Reload）

**application.yml：**
```yaml
spring:
  devtools:
    livereload:
      enabled: true # Must explicitly enable in 4.0
```

**libs.versions.toml：**
```toml
[libraries]
spring-boot-devtools = { module = "org.springframework.boot:spring-boot-devtools", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    developmentOnly(libs.spring.boot.devtools)
}
```

### PropertyMapper API 行為變更

**破壞性變更：** 當來源為 `null` 時，預設不再呼叫適配器/述詞方法。

**移轉模式：**
```kotlin
// Old behavior (Spring Boot 3.x)
map.from(source::method).to(destination::method)
// Calls destination.method(null) if source returns null

// New behavior (Spring Boot 4.0)
map.from(source::method).to(destination::method)
// Skips call if source returns null

// Explicit null handling (new)
map.from(source::method).always().to(destination::method)
// Always calls destination.method(value), even if null
```

**已移除的方法：** `alwaysApplyingNotNull()` - 請移除此組態：Boot 4 預設會略過 null 來源值。請勿將其替換為 `always()`，後者會明確傳遞 null；請將 `always()` 保留給有意接受 null 的對應。

**移轉範例：** 檢閱 [Spring Boot 認可 239f384ac0](https://github.com/spring-projects/spring-boot/commit/239f384ac0893d151b89f204886874c6adb00001) 以了解 Spring Boot 本身如何適應新的 API。
