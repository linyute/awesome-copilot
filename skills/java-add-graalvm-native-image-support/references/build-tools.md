# 建置工具設定 (Maven 與 Gradle)

針對純 Java 專案使用 GraalVM Native Build Tools 外掛。Quarkus 與 Micronaut 專案從其自身的外掛取得原生支援（或同等功能）；不要在該處重複新增。使用 Maven 與 `spring-boot-starter-parent` 的 Spring Boot 透過 parent 的 `native` 設定檔 (`pluginManagement`) 繼承其版本與設定，但若缺少您仍必須在 `<build><plugins>` 中宣告 `native-maven-plugin` 與 `spring-boot-maven-plugin`（無需版本號）；使用 Gradle 的 Spring Boot，或使用自訂 parent 的 Maven，則需要明確套用該外掛（請參閱 `spring-boot.md`）。

## 版本 (Versions)

切勿憑記憶硬式編碼版本號。在執行時期解析目前發行版本並予以鎖定：

- Maven Central：`org.graalvm.buildtools:native-maven-plugin` (search.maven.org 或 `https://repo.maven.apache.org/maven2/org/graalvm/buildtools/native-maven-plugin/maven-metadata.xml`)
- Gradle Plugin Portal：`org.graalvm.buildtools.native`
- 發行說明：https://graalvm.github.io/native-build-tools/latest/index.html

下方中，`NBT_VERSION` 代表您所解析的版本。在檔案中將其替換為真實版本號。

## Maven

將其放入 `native` 設定檔中，以確保一般建置不受影響：

```xml
<profiles>
  <profile>
    <id>native</id>
    <build>
      <plugins>
        <plugin>
          <groupId>org.graalvm.buildtools</groupId>
          <artifactId>native-maven-plugin</artifactId>
          <version>NBT_VERSION</version>
          <extensions>true</extensions>
          <executions>
            <execution>
              <id>build-native</id>
              <goals>
                <goal>compile-no-fork</goal>
              </goals>
              <phase>package</phase>
            </execution>
            <execution>
              <id>test-native</id>
              <goals>
                <goal>test</goal>
              </goals>
              <phase>test</phase>
            </execution>
          </executions>
          <configuration>
            <imageName>${project.artifactId}</imageName>
            <mainClass>com.example.Main</mainClass>
            <buildArgs>
              <buildArg>--no-fallback</buildArg>
            </buildArgs>
          </configuration>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```

將 `mainClass` 設定為專案的真實進入點（或依賴 jar 外掛所設定的 main class）。建構命令：`./mvnw -Pnative native:compile`；以原生方式執行測試：`./mvnw -Pnative test`。可執行檔輸出至 `target/`。

## Gradle

Groovy DSL：

```groovy
plugins {
  id 'application'
  id 'org.graalvm.buildtools.native' version 'NBT_VERSION'
}

graalvmNative {
  binaries {
    main {
      imageName = project.name
      mainClass = application.mainClass
      buildArgs.add('--no-fallback')
    }
  }
}
```

Kotlin DSL：

```kotlin
plugins {
  application
  id("org.graalvm.buildtools.native") version "NBT_VERSION"
}

graalvmNative {
  binaries {
    named("main") {
      imageName.set(project.name)
      mainClass.set(application.mainClass)
      buildArgs.add("--no-fallback")
    }
  }
}
```

建構命令：`./gradlew nativeCompile`；執行命令：`./gradlew nativeRun`；測試命令：`./gradlew nativeTest`。可執行檔輸出至 `build/native/nativeCompile/`。

Gradle 工具鏈：若要透過工具鏈選取 GraalVM，在 `graalvmNative.binaries.main` 中使用 `javaToolchains.launcherFor { languageVersion = JavaLanguageVersion.of(<java-version>); vendor = JvmVendorSpec.GRAAL_VM }` 設定 `javaLauncher`。否則請確保 `JAVA_HOME` 指向 GraalVM JDK。

## `--no-fallback`

後備映像檔 (Fallback images，搭售 JVM 啟動器) 在最近的 GraalVM 發行版本中已被棄用並移除，因此該旗標在這些版本中為預設行為。在較舊的工具鏈中保留該旗標，以避免隱匿失敗問題。

## 有用的建構引數 (Useful build arguments)

| 引數 | 用途 |
|---|---|
| `-Ob` | 開發時期的快速建構模式 |
| `--initialize-at-run-time=<class-or-package>` | 延遲類別初始化 |
| `--initialize-at-build-time=<class-or-package>` | 在建置期間初始化 (僅在安全時使用) |
| `-H:+ReportExceptionStackTraces` | 產生更完整的建置錯誤資訊 |
| `--gc=G1` | G1 GC (Linux, Oracle GraalVM) 以提升吞吐量；預設為 serial GC |
| `-march=native` | 僅針對建置所在 CPU 進行最佳化調整；散佈二進位檔時請避免使用 (使用 `-march=compatibility`) |
