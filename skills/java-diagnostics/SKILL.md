---
name: java-diagnostics
description: '使用 JDK 工具針對 JVM 應用程式進行以徵兆為先的執行時期診斷：jcmd、jstack、jmap、jstat、JFR、GC 記錄、async-profiler、原生記憶體追蹤 (NMT) 以及 Eclipse MAT。當 Java 應用程式出現高 CPU 使用率、記憶體流失或 OutOfMemoryError、啟動緩慢、死結或執行緒飢餓、過長的 GC 暫停、原生記憶體增長或慢速請求時使用。包含安全使用的權限分級制度。'
---

# Java 診斷

從徵兆出發，挑選能回答問題的最輕量工具。

## 權限分級（務必遵守）

| 分級 | 工具 | 規則 |
|------|-------|------|
| 1. 唯讀 | `jps -l`、`jcmd <pid> help/VM.version/VM.flags/Thread.print`、`jstat`、`jstack`、讀取記錄 | 在說明精確指令後即可執行。類別長條圖（`jcmd <pid> GC.class_histogram`、`jmap -histo`、`jmap -histo:live`）**不屬於**第 1 級：它們在 safepoint 執行堆積檢查，且在大型堆積上可能會暫停應用程式執行緒，因此請將其視為第 2 級（需取得同意，並說明開銷）。預設形式與 `-histo:live` 還會額外強制觸發 full GC；`-all=true` / `jmap -histo` 會略過 full GC 但在掃描期間仍會暫停（並統計無法存取的物件）。 |
| 2. 記錄 / 附加 | JFR (`JFR.start`、`-XX:StartFlightRecording`)、async-profiler、NMT (`-XX:NativeMemoryTracking`)、啟用 GC 記錄 | 需要使用者同意。執行前先說明持續時間與預期額外負擔（JFR 預設 profile 約 1-2%；async-profiler 視模式而定；NMT summary 約 5-10%，detail 更多）。 |
| 3. 具侵入性 / 敏感 | 堆積傾印 (`GC.heap_dump`、`jmap -dump`)、`jhsdb`、印出 JVM 引數或系統屬性的指令（`jps -v/-lv/-m`、單純的 `jcmd`、`VM.system_properties`、`VM.command_line`、`jinfo`、在 Java 行程上執行 `ps aux`；它們可能洩漏機密，需遮蔽輸出）、搭配 suspend 的 JDWP、在生產環境進行的任何操作 | 需要明確同意、指明目標路徑、檢查磁碟可用空間（傾印檔案大小約等同於使用中的堆積大小），並告知暫停時間。堆積傾印包含機密資訊（密碼、權杖、個人資料）。切勿分享或上傳；遮蔽並非可靠的防護措施。請在本機分析並在分析後刪除。 |

除非使用者明確指示，否則切勿對生產環境執行第 2 級或第 3 級指令。以與目標 JVM 相同的作業系統使用者身分執行診斷工具。優先在開發或預備環境重現問題。

## 決策表

| 徵兆 | 第一步 | 後續動作 | 參考文件 |
|---------|-----------|------|-----------|
| 高 CPU 使用率 | 執行緒傾印 x3（第 1 級）+ `top -H` 將忙碌的原生執行緒 id 映射至 `nid` | JFR 或 async-profiler CPU 火焰圖（第 2 級） | [threads](references/thread-dumps.md), [jfr](references/jfr.md), [async-profiler](references/async-profiler.md) |
| 記憶體流失 / OOM | `jstat -gcutil`、間隔數分鐘執行兩次 `GC.class_histogram -all=true`（第 2 級：即使使用 `-all=true` 也會有 safepoint 暫停；若未加此參數還會觸發 full GC；在生產環境需取得同意） | 堆積傾印 + Eclipse MAT（第 3 級）或 JFR OldObjectSample（第 2 級） | [heap](references/heap.md), [gc](references/gc.md) |
| 啟動緩慢 | `-Xlog:class+load`、框架啟動/條件報告、帶時間戳記的記錄 | 從啟動時執行 JFR、async-profiler 掛鐘時間（wall-clock） | [jfr](references/jfr.md), [async-profiler](references/async-profiler.md) |
| 死結 / 執行緒飢餓 | `jcmd <pid> Thread.print`（回報死結），比較不同時間點的傾印 | 虛擬執行緒：`Thread.dump_to_file` | [threads](references/thread-dumps.md) |
| GC 暫停 | GC 記錄（`-Xlog:gc*`）與 `jstat -gc` | JFR GC 事件；調校回收器/堆積 | [gc](references/gc.md) |
| 原生記憶體增長（RSS 增長但堆積未增長） | 比較 RSS 對比堆積；啟用 NMT，`jcmd VM.native_memory baseline` / `summary.diff`（第 2 級） | async-profiler `nativemem` 或配置器工具 | [nmt](references/native-memory.md), [containers](references/containers.md) |
| 慢速請求 | 優先檢視追蹤/度量指標與記錄；Actuator 或 Dev UI（見下方） | JFR（通訊端 socket/檔案/鎖定事件）、async-profiler 掛鐘時間 | [jfr](references/jfr.md), [async-profiler](references/async-profiler.md) |
| JVM 崩潰 / 當機，無工具回應 | `hs_err_pid*.log`、core dump | `jhsdb`（第 3 級） | [basics](references/jcmd-basics.md) |

從 [jps/jcmd 基礎](references/jcmd-basics.md) 開始以識別目標 JVM 並確認正在執行的 JDK 版本。

## 工作流程

1. 精確擷取徵兆（發生的時間、頻率、自哪項變更開始、JDK 版本、容器限制）。
2. 選擇所需的權限等級；說明指令、其額外負擔與輸出位置，並取得第 2/3 級的同意。
3. 將資料收集至專屬目錄，並附帶時間戳記。多個樣本優於單一樣本。
4. 根據資料建立假設，接著使用第二個來源予以佐證（例如執行緒傾印加上火焰圖）。
5. 進行修正，使用相同方法重新量測，並清理成果成品（傾印檔案、錄製記錄）。

## 應用程式層級深入分析（選用）

JDK 工具檢視的是 JVM；某些問題（哪個端點、哪條 SQL 查詢、哪個 bean）在應用程式層級更容易回答。選用選項，依優先順序排列：

- **Spring Boot Actuator**（`metrics`、`health`、`loggers`、`httpexchanges`）與 **Quarkus Dev UI** / Micrometer 度量指標均為內建，不需要額外工具。以最小化原則公開 Actuator 端點；針對 `heapdump` 與 `threaddump`，請遵循 `spring-observability` 技能中的原則：切勿透過公開 HTTP 暴露它們；唯一的例外是經使用者同意、帶有身分驗證、TLS 與網路限制的暫時性期間，並在事後予以移除。
- **BootUI** (https://github.com/jdubois/boot-ui , https://www.julien-dubois.com/boot-ui/)：僅限本機使用的開發者主控台，包含供 Spring Boot 與 Quarkus 選擇啟用的 MCP 伺服器。選用。其技能可透過 `gh skill install jdubois/boot-ui skills/bootui` 安裝。

若考慮使用 BootUI：

- 在新增任何依賴項或安裝該技能前先徵得使用者同意。
- 僅在 local/dev profile 中使用它；切勿在網路上暴露它，且切勿在生產環境啟用其堆積傾印、執行緒傾印端點或 MCP 伺服器。
- 優先檢查功能與版本（閱讀其 README 以取得支援的 Spring Boot / Quarkus 版本），切勿預設其功能。

請遵循專案自身的文件進行操作；本技能不重複轉載。

## 容器

有關在容器內附加工具、`-XX:MaxRAMPercentage` 與 cgroup 記憶體限制，請參閱 [containers](references/containers.md)。

## 參考資料

- [jps / jcmd 基礎](references/jcmd-basics.md)
- [執行緒傾印與死結](references/thread-dumps.md)
- [堆積、長條圖、Eclipse MAT](references/heap.md)
- [GC 記錄與 jstat](references/gc.md)
- [JFR 與 JDK Mission Control](references/jfr.md)
- [async-profiler](references/async-profiler.md)
- [原生記憶體追蹤 (NMT)](references/native-memory.md)
- [容器](references/containers.md)
- 基於偵錯工具的調查：`java-debugging` 技能。

官方文件（針對使用中的 JDK 優先以官方文件為準；將 `21` 改為您的版本）：`jcmd` <https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html>、`jfr` <https://docs.oracle.com/en/java/javase/21/docs/specs/man/jfr.html>、JFR 指引 <https://docs.oracle.com/en/java/javase/21/jfr/introduction-jdk-flight-recorder.html>、疑難排解指引 <https://docs.oracle.com/en/java/javase/21/troubleshoot/>、async-profiler 版本資訊 <https://github.com/async-profiler/async-profiler/releases>。
