# Spring Boot 原生映像檔 (Spring Boot native images)

Spring Boot 3.x 及更新版本透過 Spring AOT 支援 GraalVM 原生映像檔。檢查組建中的 Spring Boot 版本：3.x 需要 Java 17+ 以及與該發行版本之 Spring Boot 文件相符的 GraalVM；請務必在您 Spring Boot 版本的參考文件 (https://docs.spring.io/spring-boot/reference/packaging/native-image/index.html) 中確認確切受支援的 GraalVM 版本。

## 運作方式

- Spring Boot Maven 外掛 / Gradle 外掛在建置時期執行 **AOT 處理**，產生 bean 定義與執行階段提示 (runtime hints)。
- `spring-boot-starter-parent` 定義了一個 `native` 設定檔，該設定檔僅在 `pluginManagement` 中設定 `native-maven-plugin` 與 `spring-boot-maven-plugin` (`process-aot` 執行)，因此繼承了版本與設定，但外掛本身並未套用。使用 start.spring.io 建立的專案已在 `<build><plugins>` 中宣告了這兩者；針對缺少 `org.graalvm.buildtools:native-maven-plugin` 的現有專案，宣告它與 `spring-boot-maven-plugin` 且無需版本或設定。在 `spring-boot-starter-parent` 3.5.0 POM 中驗證無誤。
- 使用 Gradle 時，在 `org.springframework.boot` 旁套用 `org.graalvm.buildtools.native` 外掛會啟動 AOT 任務 (`processAot`, `processTestAot`)。
- 若未使用 Spring parent（自訂 parent / BOM 匯入），請遵循 `build-tools.md` 自行新增 Native Build Tools 外掛，並為 Spring Boot 外掛宣告 `process-aot`。

## 命令 (Commands)

| 目標 | Maven | Gradle |
|---|---|---|
| 原生可執行檔 | `./mvnw -Pnative native:compile` | `./gradlew nativeCompile` |
| 原生容器映像檔 (Cloud Native Buildpacks，需要 Docker) | `./mvnw -Pnative spring-boot:build-image` | `./gradlew bootBuildImage` |
| 原生測試 | `./mvnw -PnativeTest test` | `./gradlew nativeTest` |
| 在 JVM 上執行 AOT 以進行偵錯 | `./mvnw spring-boot:process-aot` 然後搭配 `-Dspring.aot.enabled=true` 執行 | `./gradlew processAot` |

請注意，搭配 buildpacks 的 `build-image` 不需要本機 GraalVM：建構器會提供。當需要額外引數時，透過外掛的 `<environment>` / `bootBuildImage { environment }` 設定 `BP_NATIVE_IMAGE_BUILD_ARGUMENTS` / `BP_JVM_VERSION`。

在 Boot 4.1.1 搭配 Oracle GraalVM 25.0.4 (arm64, web + actuator + validation) 上驗證：`./mvnw -Pnative native:compile`（無需事先 `package`）耗時約 2 分 40 秒，`./gradlew nativeCompile` 約 3 分 50 秒，兩者皆產生 102 MB 的二進位檔，在約 80 MB RSS 下於 0.07-0.23 秒內啟動。Gradle 工具鏈必須指向 GraalVM JDK（若未自動偵測請使用 `-Dorg.gradle.java.installations.paths=<graalvm home>`）。Gradle `bootBuildImage`（當套用 `org.graalvm.buildtools.native` 時 Boot 會啟用原生支援；若無相符工具鏈請設定 `environment = ['BP_JVM_VERSION': '25']`）在 native-build-tools 1.1.7 與 1.1.8 下亦建置了正常運作的映像檔並在 0.1-0.2 秒內啟動。偶發的 `Invalid logger interface ...hibernate.validator...Log (implementation not found)` 崩潰與 [native-build-tools#1017](https://github.com/graalvm/native-build-tools/issues/1017) 相符（jar 中的 hibernate-validator 可達性中繼資料被 jboss-logging 中繼資料覆寫）；該問題未重現，因此在信任該映像檔之前，請檢查 jar 中的 `META-INF/native-image/org.hibernate.validator/*/reachability-metadata.json` 檔案較大（約 150 KB）、更新外掛，並執行映像檔發送請求至 `/actuator/health`。

先在 JVM 上檢查 `spring.aot.enabled=true`：它能比完整的原生建置更快暴露大部分 AOT 問題。

## 自訂執行階段提示 (Custom runtime hints)

僅在函式庫或您自有的程式碼使用了 AOT 無法推斷的反射、資源或序列化時使用：

```java
import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

public class MyRuntimeHints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.reflection().registerType(MyClass.class,
            MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
            MemberCategory.INVOKE_DECLARED_METHODS);
        hints.resources().registerPattern("custom-config/*.properties");
        hints.serialization().registerType(MySerializableClass.class);
    }
}
```

```java
@SpringBootApplication
@ImportRuntimeHints(MyRuntimeHints.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

替代方案：在 bean 或設定類別上針對 Jackson 綁定的 DTO 加上 `@RegisterReflectionForBinding(MyDto.class)`，以及在自訂註解上加上 `@Reflective`。使用 `RuntimeHintsPredicates` 測試提示。

## 常見問題

1. **Jackson DTO / mix-in**：使用 `@RegisterReflectionForBinding` 或 `hints.reflection()` 註冊型別；包含 mix-in 類別。Record 通常無需額外提示即可正常運作。
2. **資源**：註冊非標準資源模式 (`hints.resources().registerPattern(...)`)。`application.properties`/`application.yml` 已預設處理。
3. **Logback**：Spring 的 AOT 支援標準 Logback 設定 (`logback-spring.xml`)。自訂 Logback 元件可能需要反射提示。
4. **條件式 bean**：`@Profile`、`@ConditionalOnProperty` 等在 AOT 中是在**建置時期**評估。改變 bean 結構的屬性必須在建置時固定；執行階段的覆寫不會新增或移除 bean。
5. **動態代理 / CGLIB**：Spring 元件由 AOT 處理；第三方代理需要 `proxy-config` 提示。
6. **缺少中繼資料的函式庫**：檢查是否有相容的更新，但在升級前需取得使用者核准並在事後重新執行 JVM 基準線。若維持目前版本，請使用追蹤代理程式（請參閱 `reachability-metadata.md`）。
7. 原生測試中的 **Testcontainers / 測試切片 (test slices)**：原生測試請遵循 Spring Boot 參考資料；部分測試不支援以原生方式執行。
