## Jackson 3 移轉

### 主要重大變更：套件命名空間

Jackson 3 變更了 **Group ID 與套件名稱**：

| 元件 | 舊版 (Jackson 2) | 新版 (Jackson 3) |
|-----------|----------------|-----------------|
| Group ID | `com.fasterxml.jackson` | `tools.jackson` |
| 套件 | `com.fasterxml.jackson.*` | `tools.jackson.*` |
| 例外 | `jackson-annotations` | 仍使用 `com.fasterxml.jackson.core` group |

**libs.versions.toml：**
```toml
[versions]
jackson = "3.1.5" # Managed by Spring Boot 4.x; use the version from your Boot BOM

[libraries]
# Jackson 3 uses new group ID
jackson-databind = { module = "tools.jackson.core:jackson-databind", version.ref = "jackson" }
jackson-module-kotlin = { module = "tools.jackson.module:jackson-module-kotlin", version.ref = "jackson" }

# Exception: annotations still use old group
# (its version stays 2.x, e.g. 2.22; do not reuse the Jackson 3 version; omit the version when the Boot BOM manages it)
jackson-annotations = { module = "com.fasterxml.jackson.core:jackson-annotations" }
```

### 類別與註釋重新命名

更新匯入與註釋：

| Spring Boot 3.x | Spring Boot 4.0 |
|----------------|-----------------|
| `Jackson2ObjectMapperBuilderCustomizer` | `JsonMapperBuilderCustomizer` |
| `JsonObjectSerializer` | `ObjectValueSerializer` |
| `JsonObjectDeserializer` | `ObjectValueDeserializer` |
| `@JsonComponent` | `@JacksonComponent` |
| `@JsonMixin` | `@JacksonMixin` |

**移轉範例：**
```kotlin
// Old (Spring Boot 3.x)
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer
import org.springframework.boot.jackson.JsonComponent

@JsonComponent
class CustomSerializer : JsonSerializer<MyType>() { }

@Configuration
class JacksonConfig {
    @Bean
    fun customizer(): Jackson2ObjectMapperBuilderCustomizer {
        return Jackson2ObjectMapperBuilderCustomizer { builder ->
            builder.simpleDateFormat("yyyy-MM-dd")
        }
    }
}

// New (Spring Boot 4.0)
import tools.jackson.databind.ObjectMapper
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer
import org.springframework.boot.jackson.JacksonComponent
import tools.jackson.databind.ValueSerializer

@JacksonComponent
class CustomSerializer : ValueSerializer<MyType>() { }

@Configuration
class JacksonConfig {
    @Bean
    fun customizer(): JsonMapperBuilderCustomizer {
        return JsonMapperBuilderCustomizer { builder ->
            builder.defaultDateFormat(SimpleDateFormat("yyyy-MM-dd"))
        }
    }
}
```

### 組態屬性變更

**application.yml 移轉：**
```yaml
# Old (Spring Boot 3.x)
spring:
  jackson:
    deserialization:
      read-enums-using-to-string: true
    serialization:
      write-dates-as-timestamps: false

# New (Spring Boot 4.0)
spring:
  jackson:
    datatype:
      enum:
        read-enums-using-to-string: true
      datetime:
        write-dates-as-timestamps: false
```

### Jackson 2 相容性模組（暫時性）

為了平滑移轉，請使用**臨時相容性模組**（已棄用，未來將移除）：

**libs.versions.toml：**
```toml
[libraries]
spring-boot-jackson2 = { module = "org.springframework.boot:spring-boot-jackson2", version.ref = "springBoot" }
```

**build.gradle.kts：**
```kotlin
dependencies {
    implementation(libs.spring.boot.jackson2)
}
```

**application.yml（為 MVC 與命令式 HTTP 用戶端選取 Jackson 2 對應器）：**
```yaml
spring:
  http:
    converters:
      preferred-json-mapper: jackson2
```

對於 WebFlux 與反應式 HTTP 用戶端，請改用 `spring.http.codecs.preferred-json-mapper=jackson2`。若應用程式同時使用轉換器與轉碼器堆疊，請同時設定這兩個屬性。

在 `spring.jackson2.*` 底下設定相容性對應器。驗證其 Jackson 2 模組與自訂序列化器是否已套用至 HTTP 請求/回應本文。

這與 `spring.jackson.use-jackson2-defaults=true` 不同：該屬性保留 Jackson 3 `JsonMapper` 但使其預設行為與 Jackson 2 一致。它不會選取 Jackson 2 相容性對應器，也不會讓 Jackson 2 模組在 Jackson 3 下運作。

**規劃從此模組移轉出去** - 它將在未來版本中被移除。
