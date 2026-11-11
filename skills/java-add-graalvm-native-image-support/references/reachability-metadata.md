# 可達性中繼資料與追蹤代理程式 (Reachability metadata and the tracing agent)

Native Image 僅包含其靜態可見的內容。任何透過動態方式觸及的項目（反射、資源、JNI、動態代理、序列化）必須透過*可達性中繼資料 (reachability metadata)* 進行描述。

## 中繼資料存放位置

專案中的 `src/main/resources/META-INF/native-image/<groupId>/<artifactId>/`（`<groupId>/<artifactId>` 子資料夾可避免 jar 之間的衝突）。存在兩種格式：

- 舊版個別功能檔案：`reflect-config.json`、`resource-config.json`、`jni-config.json`、`proxy-config.json`、`serialization-config.json`。
- 統一的 `reachability-metadata.json`（於適用於 JDK 23 的 GraalVM 中引入，並由較新版本使用）。針對新中繼資料優先使用統一格式，它支援較新的功能，但 Native Image 仍會探索 `META-INF/native-image` 底下的舊版檔案，因此請勿捨棄有效的現有設定。請檢查您所使用版本的 GraalVM 文件，並優先使用您工具鏈的追蹤代理程式重新產生中繼資料。

函式庫本身通常會發佈中繼資料，且社群的 [GraalVM 可達性中繼資料存放庫](https://github.com/oracle/graalvm-reachability-metadata) 涵蓋了許多常用函式庫。Native Build Tools 外掛在啟用時會自動提取它（Gradle 中的 `metadataRepository`，Maven 中最近外掛版本的預設行為）。先檢查現有中繼資料；若升級有所幫助，提出該升級以取得使用者核准，並在變更後重新執行 JVM 基準線。否則請為目前版本收集中繼資料或編寫中繼資料。

## 追蹤代理程式 (Tracing agent)

在 JVM 上搭配代理程式執行應用程式，同時演練每個程式碼路徑，代理程式便會寫入中繼資料。

直接執行：

```sh
java -agentlib:native-image-agent=config-output-dir=src/main/resources/META-INF/native-image/<groupId>/<artifactId> -jar target/app.jar
```

透過建置工具執行 (推薦)：

```sh
./mvnw -Pnative -Dagent=true -DskipNativeTests=true test # 在 JVM 上收集測試階段中繼資料
./gradlew -Pagent test                      # 測試期間啟用代理程式，Gradle
./gradlew -Pagent run
./gradlew metadataCopy --task test --dir src/main/resources/META-INF/native-image/<groupId>/<artifactId>
```

Maven 範例假設使用 [build-tools.md](build-tools.md) 中的純 Java `native` 設定檔，該設定檔亦將 `native:test` 繫結至 test 階段。請檢查實際專案的設定檔繫結：Spring Boot 使用獨立的 `nativeTest` 設定檔（請參閱 [spring-boot.md](spring-boot.md)）。在中繼資料收集時使用 `-DskipNativeTests=true`，使 JVM 測試仍搭配追蹤代理程式執行，而無需編譯或執行原生測試二進位檔。切勿使用 `-DskipTests` 或 `-Dmaven.test.skip`：這些參數會跳過演練代理程式所需的 JVM 測試。

Maven 代理程式寫入至 `target/native/agent-output/{test,main}`。檢視檔案以排除雜訊，接著在 Native Build Tools 外掛中設定[中繼資料複製](https://graalvm.github.io/native-build-tools/latest/maven-plugin.html#metadata-copy)，使核准的輸出在 `clean` 後得以保留並納入原生建置中：

```xml
<configuration>
  <!-- 在此保留任何現有的 Native Build Tools 設定。 -->
  <agent>
    <metadataCopy>
      <!-- 針對上述 JVM 測試命令，略過未執行的 main 階段。 -->
      <disabledStages>
        <stage>main</stage>
      </disabledStages>
      <merge>true</merge>
      <outputDirectory>${project.basedir}/src/main/resources/META-INF/native-image/${project.groupId}/${project.artifactId}</outputDirectory>
    </metadataCopy>
  </agent>
</configuration>
```

檢視 test 階段輸出後，使用以下命令持久保存：

```sh
./mvnw -Pnative -Dagent=true native:metadata-copy
```

若您僅收集了應用程式 (`main`) 階段，改為停用 `test`；為每個您未收集的階段設定 `disabledStages`。當目的地擁有完整的中繼資料集（統一的 `reachability-metadata.json` 或所有四個舊版檔案）時，`merge=true` 會與現有中繼資料合併；否則在複製前先手動合併或協調現有部分檔案，以避免捨棄有效的中繼資料。事後使用專案適當的設定檔且不帶 `-DskipNativeTests=true` 執行原生測試；中繼資料收集執行不可作為原生測試通過的證據。

針對手動應用程式執行，設定 Native Build Tools [Maven 代理程式指引](https://graalvm.github.io/native-build-tools/latest/maven-plugin.html#agent-support-running-application) 中所述的 `exec-maven-plugin` 執行，然後使用以下命令執行：

```sh
./mvnw -Pnative -Dagent=true -DskipTests -DskipNativeBuild=true package exec:exec@java-agent
```

如上述說明複製收集到的 `main` 階段，停用未收集的 `test` 階段。

請參閱 Native Build Tools 的「Agent Support」頁面以取得適用於您外掛版本的確切設定。

訣竅：

- 演練每個端點、序列化路徑與資源載入；未演練的路徑不會被擷取。
- 檢視產生的檔案並刪除雜訊 (僅限測試的類別)。
- 使用 `native-image-configure` 或代理程式的合併模式 (`config-merge-dir=`) 合併重複執行的結果。
- 變更相依性後重新執行代理程式。

## 手寫範例 (舊版格式)

反射 (`reflect-config.json`)：

```json
[
  {
    "name": "com.example.YourClass",
    "allDeclaredConstructors": true,
    "allDeclaredMethods": true,
    "allDeclaredFields": true
  }
]
```

資源 (`resource-config.json`)：

```json
{
  "resources": {
    "includes": [
      {"pattern": "\\Qapplication.properties\\E"},
      {"pattern": ".*\\.ya?ml"}
    ]
  }
}
```

JNI (`jni-config.json`)：

```json
[
  {
    "name": "com.example.NativeClass",
    "methods": [
      {"name": "nativeMethod", "parameterTypes": ["java.lang.String"]}
    ]
  }
]
```

動態代理 (`proxy-config.json`)：

```json
[
  ["com.example.Interface1", "com.example.Interface2"]
]
```

各架構提供具型別的替代方案（Spring `RuntimeHints`、Quarkus `@RegisterForReflection`、Micronaut `@Introspected`）；在架構專案中優先使用它們而非原始 JSON。
