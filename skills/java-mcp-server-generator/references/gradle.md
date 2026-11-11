# Gradle 專案

僅在專案使用 Gradle 或使用者要求使用 Gradle 時使用此檔案。Java 程式碼與測試均不改變。

## 建立專案

建立以下配置。請勿撰寫 `pom.xml`：

```text
project-name/
├── settings.gradle.kts
├── build.gradle.kts
└── src/
    ├── main/java/com/example/McpServerApp.java
    └── test/java/com/example/McpServerAppTest.java
```

撰寫 `settings.gradle.kts`：

```kotlin
rootProject.name = "mcp-server-demo"
```

撰寫 `build.gradle.kts`：

```kotlin
plugins {
    application
}

group = "com.example"
version = "0.1.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("io.modelcontextprotocol.sdk:mcp-bom:2.0.1"))
    implementation("io.modelcontextprotocol.sdk:mcp")
    runtimeOnly("org.slf4j:slf4j-simple:2.0.17")

    testImplementation(platform("org.junit:junit-bom:6.1.3"))
    testImplementation("org.junit.jupiter:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<JavaCompile> {
    options.release = 17
}

application {
    mainClass = "com.example.McpServerApp"
}

tasks.test {
    useJUnitPlatform()
}
```

## 建構直到測試通過

1. 若專案沒有 `gradlew` 檔案，請執行一次 `gradle wrapper`。
2. 執行 `./gradlew build installDist`。此指令會編譯程式碼並執行測試。它還會產生啟動指令碼 `build/install/mcp-server-demo/bin/mcp-server-demo`。
3. 若測試失敗，請閱讀錯誤訊息。修正伺服器或測試。
4. 再次執行 `./gradlew build installDist`。
5. 僅在建構成功時繼續進行。

## 設定用戶端

針對 VS Code，撰寫 `.vscode/mcp.json`：

```json
{
  "servers": {
    "demo": {
      "type": "stdio",
      "command": "/absolute/path/to/project/build/install/mcp-server-demo/bin/mcp-server-demo"
    }
  }
}
```

在 Windows 上，請使用 `mcp-server-demo.bat`。

## 注意事項

- Gradle 9 不會新增 JUnit Platform launcher。若缺少 `junit-platform-launcher`，`test` 任務將執行失敗。
- `application` 外掛程式不會建立可執行的 JAR。`build/libs` 中的 JAR 沒有 `Main-Class` 且不含依賴項。請使用來自 `installDist` 的啟動指令碼。
- 請勿將 `./gradlew run` 作為用戶端指令。`run` 任務不會將 stdin 傳送至伺服器。Gradle 也會將其自身輸出寫入 stdout。
