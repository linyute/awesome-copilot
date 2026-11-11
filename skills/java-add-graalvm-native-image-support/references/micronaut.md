# Micronaut 原生映像檔 (Micronaut native images)

Micronaut 在編譯時期執行預先 (ahead-of-time, AOT) 處理，因此大部分原生映像檔中繼資料皆會自動產生。

## 命令 (Commands)

- Maven：`./mvnw package -Dpackaging=native-image` (容器建置：`./mvnw package -Dpackaging=docker-native`)
- Gradle：`./gradlew nativeCompile` (容器：`./gradlew dockerBuildNative`)
- 原生測試：`./mvnw -Pnative test` 或 `./gradlew nativeTest`，取決於產生的專案

檢查所產生專案的設定檔/任務，並使用相容的 GraalVM JDK。在標準的 Micronaut parent POM (4.10.0 與 5.0.2) 中，`graalvm` 設定註解處理；`native` 繫結 Native Build Tools 原生測試目標。單純成功的 `-Pgraalvm test` 不能作為原生測試已執行的證據。

Micronaut Maven/Gradle 外掛會為您設定 Native Build Tools 外掛；切勿重複新增。

## 反射與資源 (Reflection and resources)

1. **Bean 內部自我檢查 (introspection)**：為 POJO 加上 `@Introspected` 可避免反射：

   ```java
   @Introspected
   public class MyDto {
       private String name;
       private int value;
       // getters and setters
   }
   ```

   或為 Micronaut Serialization 型別加上 `@Serdeable`。

2. **反射**：在設定類別上加上 `@ReflectionConfig(type = MyClass.class, accessType = TypeHint.AccessType.ALL_DECLARED_CONSTRUCTORS)`（兩者皆來自 `io.micronaut.core.annotation`；`accessType` 接受 `TypeHint.AccessType[]`），或使用 `@TypeHint(MyClass.class)` 取得預設存取權限。
3. **資源**：Micronaut 沒有資源註解；在 `META-INF/native-image/<group>/<artifact>/resource-config.json`（或統一的 `reachability-metadata.json`）中列出模式，或使用 Native Build Tools 資源偵測設定。
4. **Gradle 建構引數**（僅在需要時）：

   ```groovy
   graalvmNative {
       binaries {
           main {
               buildArgs.add("--initialize-at-run-time=io.netty")
           }
       }
   }
   ```

   Micronaut 已經設定了合理的初始化預設值；僅針對特定的失敗類別新增旗標。除診斷外請避免使用 `--report-unsupported-elements-at-runtime`。

## 訣竅

- 使用 Micronaut 的編譯時期功能（`@Introspected`、`@Serdeable`、`@Client` 介面），而非執行時期反射。
- Netty 與 HTTP 用戶端微調是執行階段的考量事項；切勿藉由變更 `netty.default.allocator` 設定來修正原生建置錯誤。
- 在手動新增中繼資料前，先檢查相容的 Micronaut 模組更新是否提供中繼資料；提出任何升級以取得使用者核准，保留受管理的版本，並在事後重新執行 JVM 基準線。

指引：https://docs.micronaut.io/latest/guide/#graal
