# 使用 jdtls 實現 Java 程式碼智慧功能

[lsp-servers.md](lsp-servers.md) 中 Java 項目的詳細說明。LSP 對於 Java 是選用的：建構、測試與執行時期診斷在沒有它的情況下仍可運作。

## JDK：兩件不同的事物

- **jdtls 執行時期 JDK**：jdtls 需要透過 `JAVA_HOME` 或 `PATH` 找到的近期 JDK（目前版本為 21+）。
- **專案 JDK**：您程式碼鎖定的版本（`maven.compiler.release`、`java.toolchain`）。亦請安裝相符的 JDK；若 jdtls 找不到相符版本，它會回退至其自身的執行時期，且可能會針對較新的語言功能回報假性錯誤。

## 專案匯入

- Maven：jdtls 會讀取 `pom.xml`（支援多模組）。執行一次 `./mvnw -q compile`，讓依賴項進入 `~/.m2`。
- Gradle：若有 Gradle wrapper（`gradlew`），jdtls 會使用它。執行一次 `./gradlew classes`。
- 在存放庫根目錄（或模組根目錄）開啟 Copilot CLI，以確保能找到建構檔案。
- 在大量編輯 `pom.xml` / `build.gradle` 之後，重啟工作階段（`/exit`，重新啟動）以重新匯入專案。

## 工作區（資料）目錄

`-data .jdtls-workspace` 會保留各專案的索引，避免跨專案的類別路徑污染。刪除它可重設過期的索引；請將其加入 git-ignore。切勿在兩個執行中的 jdtls 執行個體之間共用同一個資料目錄。

## 效能

- 堆積（Heap）：`--jvm-arg=-Xmx2G` 對多數專案已足夠；針對非常龐大的多模組建構可調升至 4G。
- 首次啟動會建立索引，可能需要 30-60 秒或更久；在此期間 `workspaceSymbol` 可能為空。可暫時回退使用 grep。
- 同一時間請僅保留一個已設定的 Java 伺服器。

## Lombok 與註解處理器

除非將 Lombok agent 傳遞給 JVM，否則 jdtls 無法看到 Lombok 產生的成員（`@Getter`、builder），例如 `--jvm-arg=-javaagent:<path-to>/lombok.jar`（此路徑取決於具體機器；請在使用者層級設定中設定，切勿提交至存放庫檔案中）。MapStruct、Immutables 與其他處理器需要啟用註解處理，並透過先前的建構產出原始碼。請將產生程式碼上的「cannot resolve method」錯誤視為可能的誤報，並透過 `./mvnw compile` 或 `./gradlew classes` 進行確認。

## `lsp` 操作為 Java 提供的功能

| 操作 | 用途 |
|---|---|
| `goToDefinition` / `goToImplementation` | 跳轉至型別，或介面的實作 |
| `findReferences` | 所有使用處，解析多載與匯入 |
| `incomingCalls` / `outgoingCalls` | 呼叫階層 |
| `hover` | 型別資訊與 Javadoc |
| `documentSymbol` / `workspaceSymbol` | 檔案的大綱，或依名稱搜尋型別 |
| `rename` | 跨檔案的語意重新命名 |

參數為從 1 開始計算的 `line` 與 `character`，但 `documentSymbol`（僅檔案）與 `workspaceSymbol`（查詢字串）除外。針對符號相關問題優先使用 `lsp`；非符號文字（屬性、記錄訊息）則使用 grep。

## 疑難排解

| 徵兆 | 修正方式 |
|---|---|
| `/lsp` 未顯示 Java 伺服器 | 檢查 `which jdtls` 與設定檔位置；重啟工作階段 |
| 到處出現未解析的匯入 | 執行一次 Maven/Gradle 建構；刪除 `.jdtls-workspace` |
| 伺服器立即結束 | 檢查 jdtls 所使用的 JDK 版本（`java -version`）；透過 `jdtls --help` 確認 wrapper 旗標 |
| 記憶體不足或速度緩慢 | 調升 `-Xmx`；關閉其他 Java 伺服器 |
| 語言層級錯誤 | 安裝專案的 JDK 並確保建構檔案宣告了該版本 |

## 出處

改編自 [jdubois/dr-jskill](https://github.com/jdubois/dr-jskill)（`references/JDTLS.md`、`assets/lsp.json`），讀取自 commit `29e71996048e4086bfa389268a3c6c2e49ea3f25`。由其原作者（Julien Dubois，dr-jskill 的唯一著作權持有人）根據本存放庫的 MIT 授權條款貢獻於此；上游仍以 Apache-2.0 授權提供。經重新調整與精簡；無主機專屬路徑。
