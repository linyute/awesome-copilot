# Failsafe：執行 `*IT` 整合測試 (Maven)

## 常見陷阱

Surefire 執行 `*Test`、`Test*`、`*Tests`、`*TestCase`。名為 `*IT` / `IT*` / `*ITCase` 的類別則由 **maven-failsafe-plugin** 執行。若 Failsafe 僅在 `<pluginManagement>` 中宣告（或完全未宣告），它絕不會綁定到生命週期：`*IT` 類別能通過編譯但**靜默地絕不執行**，且 `./mvnw test` 或 `./mvnw package` 仍會回報成功。

Spring Boot 的 parent POM 在 `<pluginManagement>` 中設定了 Failsafe（包含 `integration-test` 與 `verify` 目標），但**未**啟動它。

## 修正方式

在 `<build><plugins>` 中宣告外掛程式並綁定目標：

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-failsafe-plugin</artifactId>
      <executions>
        <execution>
          <goals>
            <goal>integration-test</goal>
            <goal>verify</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

版本由 `spring-boot-starter-parent` 管理；若專案未使用它，請明確釘選一個版本。

## 執行與驗證

```bash
./mvnw verify
```

`verify` 會執行 `integration-test` 然後執行 `verify`（在 IT 失敗時判定建構失敗）。不要針對 IT 使用 `./mvnw test` 或 `package`，也不要單獨使用 `integration-test`：此時測試失敗不會使建構失敗。

確認它們已執行：輸出中必須包含 `failsafe:<version>:integration-test` 行（Maven 3.10 列印 `--- failsafe:3.5.6:integration-test (default)`；較舊的 Maven 列印 `maven-failsafe-plugin:...`）以及針對您 `*IT` 類別的 `Tests run: N`（亦可查看 `target/failsafe-reports/`）。若 N 為 0 或缺少該外掛程式行，則表示缺少綁定。

## 替代方案

- 將整合測試命名為 `*Test` 並使用 Surefire 執行（最簡單；不進行分離）。
- Gradle 沒有此問題：將它們放在 `test` 中，或定義獨立的測試套件（JVM Test Suite 外掛程式，已透過 Boot 4.1 驗證；原始碼位於 `src/integrationTest/java`，失敗的測試會導致 `./gradlew build` 失敗）：

```groovy
plugins { id 'jvm-test-suite' }

testing {
    suites {
        integrationTest(JvmTestSuite) {
            useJUnitJupiter()
            dependencies {
                implementation project()
                implementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
            }
            targets { all { testTask.configure { shouldRunAfter(test) } } }
        }
    }
}

tasks.named('check') { dependsOn testing.suites.integrationTest }
```
