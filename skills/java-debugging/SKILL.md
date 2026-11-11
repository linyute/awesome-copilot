---
name: 'java-debugging'
description: '系統化偵錯 Java 應用程式：JDWP 遠端偵錯、jdb、VS Code 與 IntelliJ attach、偵錯 Maven/Gradle 測試、Spring Boot 與 Quarkus 開發模式、容器、中斷點/記錄點以及判讀堆疊追蹤。當使用者需要找出 Java 錯誤、例外狀況、錯誤行為或失敗測試的原因，或詢問如何掛接偵錯工具時使用。'
---

# Java 偵錯 (Java Debugging)

以具可重現性、假設驅動的迴圈找出 Java 缺陷的根本原因，並在記錄不足時安全地掛接 (attach) 偵錯工具。

## 安全性規則

- 將 JDWP 僅繫結至回送介面 (loopback, `127.0.0.1`)。切勿在可連線的網路上繫結 `*:5005`；遠端主機請使用 SSH 通道或 `kubectl port-forward`。
- 針對執行中的應用程式使用 `suspend=n`。`suspend=y` 僅適用於繫結至回送介面的簡短本機測試執行（等待 IDE 掛接）。絕不在實際執行環境中啟用偵錯代理程式；JDWP 會將完整的程式碼執行權限開放給任何連線者。
- 未經使用者明確指示，切勿將偵錯工具掛接至實際執行環境。優先在本機重現，或使用唯讀診斷工具（請參閱 `java-diagnostics` skill）。
- `JAVA_TOOL_OPTIONS` 會被該環境中啟動的每個 JVM 讀取（建置工具、fork 出的測試 JVM、子處理程序），從而導致 `Address already in use` 衝突。優先將該旗標限定在您要偵錯的單一處理程序中。

## 方法論

確定性重現、最小化、判讀證據（[堆疊追蹤](references/stack-traces.md)）、使用侵入性最低的工具（優先使用記錄行或記錄點而非中斷點）測試單一可證偽的假設，接著新增迴歸測試並移除偵錯旗標與暫時性記錄。

## 依版本而異的行為 (已驗證)

- **有幫助的 NullPointerException 訊息** (JEP 358) 在 JDK 14 中預設關閉 (`-XX:+ShowCodeDetailsInExceptionMessages`)，從 JDK 15 開始預設開啟 (JEP 358 記錄了訊息格式)。來源：<https://openjdk.org/jeps/358>。
- JDWP 純 `address=5005` 在 JDK 9 之前繫結所有介面，從 JDK 9 開始繫結回送介面 (見下方說明)。
- Gradle `--debug-jvm` 傳入純位址，因此在 JDK 8 上它會接聽所有介面。

## 掛接偵錯工具 (JDWP)

啟動 JVM：

```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=127.0.0.1:5005 -jar app.jar
```

在每個 JDK 版本上一律明確寫出 `127.0.0.1:5005`：純 `address=5005` 在 JDK 9 之前接聽所有介面，從 JDK 9 開始僅接聽回送介面。在 JDK 8 及更舊版本上，可能不支援 `host:port` 格式，因此亦請透過防火牆或通道限制存取。

使用 `jdb` 掛接：

```bash
jdb -attach 127.0.0.1:5005
# stop in com.example.OrderService.place | stop at com.example.OrderService:42
# cont | next | step | locals | print order | where | catch java.lang.NullPointerException
```

### VS Code (Extension Pack for Java)

`.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Attach to JVM",
      "request": "attach",
      "hostName": "127.0.0.1",
      "port": 5005
    }
  ]
}
```

### IntelliJ IDEA

Run | Edit Configurations | + | Remote JVM Debug；主機 `127.0.0.1`，連接埠 `5005`，偵錯工具模式選取 Attach。對話方塊會顯示對應的 JVM 引數字串。

## 偵錯測試與架構

| 情境 | 命令 (連接埠 5005) |
|----------|---------------------|
| Maven Surefire 單元測試 | `mvn test -Dmaven.surefire.debug -Dtest=OrderServiceTest` |
| Maven Failsafe 整合測試 | `mvn verify -Dmaven.failsafe.debug -Dit.test=OrderIT` |
| Gradle 測試 | `gradle test --debug-jvm --tests '*OrderServiceTest'` |
| Spring Boot (Maven) | `mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=127.0.0.1:5005"` |
| Spring Boot (Gradle) | 如以下說明設定 `bootRun`，接著執行 `gradle bootRun` (回送介面, 不暫停) |
| Quarkus 開發模式 | `mvn quarkus:dev` (偵錯連接埠 5005 預設開啟；`-Ddebug=5006` 可變更連接埠，`-Ddebug=false` 停用) |

Surefire/Failsafe 偵錯模式與 `--debug-jvm` 會暫停直到偵錯工具掛接為止，這適用於本機執行。Surefire 與 Failsafe 接受自訂代理程式字串而非純旗標，例如 `-Dmaven.surefire.debug="-agentlib:jdwp=transport=dt_socket,server=y,suspend=y,address=127.0.0.1:5005"`。在 JDK 26 上針對 Gradle 9.7 `--debug-jvm`、Maven Surefire 3.5 `-Dmaven.surefire.debug` 與 Quarkus 3.40 開發模式已驗證接聽器位於 `127.0.0.1`（透過 `lsof -nP -iTCP:5005 -sTCP:LISTEN`）；Gradle 7.6.4、8.0.2 (JDK 17)、8.5 (JDK 21) 與 8.14.3 亦接聽於 `127.0.0.1`。Gradle 傳遞純 `address=5005`（無主機名稱），因此繫結位址來自 JDK：JDK 9+ 上為回送介面，但在 JDK 8 上為所有介面（`0.0.0.0:5005`，在搭配 Gradle 7.6.4 與 8.14.3 的 `eclipse-temurin:8-jdk` 容器中檢查）。較舊的 Gradle/外掛版本未進行測試；在共用網路或 JDK 8 上請執行相同的 `lsof` 檢查並使用明確的回送代理程式。

明確的 Gradle 設定 (Gradle 7.6+；`debugOptions.host` 於 7.6 中新增；Kotlin DSL)：

```kotlin
tasks.withType<Test> {
    debugOptions { enabled.set(true); host.set("127.0.0.1"); port.set(5005); server.set(true); suspend.set(true) }
}

// BootRun 繼承自 JavaExec 而非 Test；當套用 Boot 外掛時需另外單獨設定。
tasks.named<JavaExec>("bootRun") {
    debugOptions { enabled.set(true); host.set("127.0.0.1"); port.set(5005); server.set(true); suspend.set(false) }
}
```

接著執行 `gradle test --tests '*OrderServiceTest'` 或 `gradle bootRun`，而不帶 `--debug-jvm`（該參數會啟用暫停）。僅設定您正在偵錯的任務；切勿同時在連接埠 5005 上執行兩個接聽器。針對 7.6 之前的 Gradle，改在目標任務上使用 `jvmArgs("-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=127.0.0.1:5005")`（本機測試使用 `suspend=y`），且不同時啟用 `debugOptions` 或 `--debug-jvm`。在 JDK 8 及更舊版本上，保留上述的防火牆/通道預防措施。

## 容器 (Containers)

僅將連接埠發佈至回送介面，並讓 JVM 在容器內接聽：

```bash
docker run --rm -p 127.0.0.1:5005:5005 \
  -e JAVA_TOOL_OPTIONS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005" my-app
```

在容器內部代理程式必須繫結 `*` 連接埠對應才能運作，因此 JDWP（完整程式碼執行權）可被相同 Docker 網路上的任何其他容器存取；`127.0.0.1:` 對應僅能封鎖來自其他主機的存取。僅在沒有不受信任容器共用網路的開發者機器上使用此方式：在僅包含此容器的專屬使用者定義網路（非共用的預設 bridge）上執行，或在容器內部將代理程式保持在 `127.0.0.1` 並透過 `docker exec`/`kubectl port-forward` 風格的轉發存取而非發佈該連接埠。針對 Kubernetes，僅對開發/預備環境 pod 使用 `kubectl port-forward pod/<name> 5005:5005`。

## 常見陷阱

- **熱程式碼替換 (Hot code replace)** 僅置換方法主體；新增/刪除方法或欄位或變更簽章需要重新啟動（或使用 Quarkus 開發模式 / Spring DevTools）。
- **缺少偵錯資訊**：未帶 `-g` 編譯的程式碼會顯示變數不可用（Maven 與 Gradle 預設皆會包含）。在 Lambda 中，請單步進入 (step into) Lambda 主體。
- **海森堡錯誤/競爭條件 (Heisenbugs/races)**：暫停會改變時序。優先使用記錄點、執行緒傾印 (thread dumps) 或 JFR；僅暫停目前執行緒，而非所有執行緒。
- **非同步與反應式程式碼**：堆疊追蹤顯示排程器框架，而非呼叫者。僅在開發時使用 IDE 非同步堆疊追蹤、相互關聯識別碼或 Reactor `Hooks.onOperatorDebug()`。
- **虛擬執行緒 (JDK 21+)**：可能存在數千個；使用 `jcmd <pid> Thread.dump_to_file -format=json file.json` 取得概觀。
- **逾時**：長時間暫停可能會觸發 HTTP、資料庫或活動訊號 (heartbeat) 逾時；請在本機適當提高這些數值。
- **toString() 副作用**：偵錯工具評估會呼叫 `toString()`，這可能會觸發延遲載入或改變狀態。

## 選用的程式碼導覽輔助工具

若已設定 Copilot CLI `lsp` 工具（請參閱 `lsp-setup` skill），前往定義、尋找參考與呼叫階層可協助追蹤執行路徑。此工具為選用；grep 與閱讀程式碼亦同樣有效。

## 參考資料

- [判讀堆疊追蹤](references/stack-traces.md)
- 針對執行階段徵兆（CPU、記憶體、死結、啟動緩慢），請使用 `java-diagnostics` skill。

官方工具文件（針對所使用的 JDK 請優先參考官方文件而非本 skill；將 `21` 改為您的版本）：`jcmd` <https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html>，JDK 疑難排解手冊 <https://docs.oracle.com/en/java/javase/21/troubleshoot/>。
