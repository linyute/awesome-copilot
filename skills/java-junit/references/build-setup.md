# JUnit 5/6 建構設定

下方版本用於驗證執行（JDK 21 與 25、Maven 3.10.0、Gradle 9.8.1）。在鎖定版本之前，請重新檢查 Maven Central 上的最新版本，若專案已有現有版本則予以保留。

## Maven

```xml
<properties>
  <junit.version>6.0.3</junit.version>      <!-- 5.14.4 可搭配相同的測試程式碼運作；6.x 的 Java 基準為 17 -->
</properties>
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.junit</groupId>
      <artifactId>junit-bom</artifactId>
      <version>${junit.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<dependencies>
  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
<build>
  <plugins>
    <plugin>
      <artifactId>maven-surefire-plugin</artifactId>
      <version>3.6.0</version>
    </plugin>
    <plugin>
      <artifactId>maven-failsafe-plugin</artifactId>
      <version>3.6.0</version>
      <executions>
        <execution>
          <goals><goal>integration-test</goal><goal>verify</goal></goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

切換版本進行試驗性執行：`mvn verify -Djunit.version=5.14.4`（之所以可行是因為版本為屬性）。若父項（例如 Spring Boot）管理 JUnit，請審慎覆寫該屬性或 BOM 並告知使用者。

指令：`mvn test`（單元測試，Surefire）、`mvn verify`（單元測試 + 透過 Failsafe 執行 `*IT`）、`mvn -Dtest=FooTest#bar test`、`mvn -Dit.test=FooIT verify`。

### JaCoCo (0.8.15)

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.15</version>
  <executions>
    <execution><goals><goal>prepare-agent</goal></goals></execution>
    <execution>
      <id>report</id><phase>verify</phase><goals><goal>report</goal></goals>
    </execution>
    <!-- 選用關卡；僅在專案已強制執行時使用 -->
    <execution>
      <id>check</id><phase>verify</phase><goals><goal>check</goal></goals>
      <configuration>
        <rules><rule><element>BUNDLE</element>
          <limits><limit><counter>LINE</counter><value>COVEREDRATIO</value><minimum>0.80</minimum></limit></limits>
        </rule></rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

若 Surefire/Failsafe 設定了 `<argLine>`，其必須以 `@{argLine}` 開頭，否則 JaCoCo agent 會被捨棄。反之，若有字面值 `@{argLine}` 卻沒有 `prepare-agent` 執行，fork 的 JVM 會執行失敗（`Error: could not open '{argLine}'`，已驗證）。報告路徑：`target/site/jacoco/index.html`。

### PIT 變異測試（已驗證：在 JDK 21 上使用 pitest-maven 1.30.1 + pitest-junit5-plugin 1.2.3 搭配 JUnit 6.0.3）

```xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <version>1.30.1</version>
  <dependencies>
    <dependency>
      <groupId>org.pitest</groupId>
      <artifactId>pitest-junit5-plugin</artifactId>
      <version>1.2.3</version>
    </dependency>
  </dependencies>
  <configuration>
    <targetClasses><param>com.example.*</param></targetClasses>
  </configuration>
</plugin>
```

執行：`mvn test-compile org.pitest:pitest-maven:mutationCoverage`（報告位於 `target/pit-reports`）。PIT 也會讀取 Surefire 的 `argLine`；若其中包含未解析的 `@{argLine}`，請在 PIT 執行時傳入 `-DargLine=-Dpit=1`（已驗證的暫時解決方案）。Gradle 對應項：`info.solidsoft.pitest` 外掛程式（此處未驗證）。

## Gradle (Kotlin DSL)

```kotlin
plugins { java; jacoco }
repositories { mavenCentral() }

dependencies {
    testImplementation(platform("org.junit:junit-bom:6.0.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")   // Gradle 9 必需
}

tasks.test {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}
```

將整合測試作為 JVM Test Suite（已驗證；`src/integrationTest/java`）：

```kotlin
testing {
    suites {
        register<JvmTestSuite>("integrationTest") {
            useJUnitJupiter("6.0.3") // 自訂套件不會繼承單元測試的 BOM；保持版本相同
            dependencies { implementation(project()) }
            targets.all { testTask.configure { shouldRunAfter(tasks.test) } }
        }
    }
}
tasks.check { dependsOn(testing.suites.named("integrationTest")) }
```

指令：`./gradlew test`、`./gradlew test --tests 'demo.OrdersTest'`（也會執行其巢狀類別）、`./gradlew check`，報告位於 `build/reports/tests/test/index.html` 與 `build/reports/jacoco`。在 JUnit 5 上的試驗性執行：當版本從 Gradle 屬性讀取時使用 `./gradlew test -PjunitVersion=5.14.4`。

Groovy DSL 僅語法不同（`testImplementation platform('org.junit:junit-bom:6.0.3')`、`jvmArgs '-javaagent:...'`）。
