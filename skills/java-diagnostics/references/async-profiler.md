# async-profiler（第 2 級：需取得同意）

產生火焰圖的低開銷取樣效能分析工具（支援 CPU、掛鐘時間、記憶體配置、鎖定、原生記憶體）。專案網址：https://github.com/async-profiler/async-profiler 。請從其 GitHub Releases 頁面下載**鎖定版本的發行版**並驗證總和檢查碼（release API 為每個 asset 列出了 sha256 摘要）；請勿將指令碼直接以管線傳遞至 shell。執行前請說明效能分析的持續時間與模式。請查閱所使用版本的 README 以取得最新旗標。下列指令是在 4.5 版本上執行（macOS 版本附加至執行中的 JDK 27 JVM，以及 `linux-arm64` 版本附加至 `eclipse-temurin:21` 容器中的 JDK 21 JVM）；`nativemem` 需要 4.0 或更新版本，且在無競爭情況下 `-e lock` 會印出「No samples were collected」。

## 使用方式（3.x/4.x 啟動器 `asprof`）

```bash
asprof -d 30 -e cpu -f /secure/dir/cpu.html <pid>      # CPU 火焰圖，30 秒
asprof -d 30 -e wall -t -f wall.html <pid>             # 各執行緒的掛鐘時間（慢速請求、啟動）
asprof -d 30 -e alloc -f alloc.html <pid>              # 記憶體配置
asprof -d 30 -e lock -f lock.html <pid>                # 鎖定競爭
asprof -d 60 -e nativemem -f native.html <pid>         # 原生記憶體配置 (4.0+)；使用 -f native.jfr 接著以 `jfrconv --nativemem --leak` 進行流失分析
```

作為 Java agent 用於啟動時效能分析：

```
-agentpath:/path/to/libasyncProfiler.so=start,event=cpu,file=/secure/dir/startup.html
```

報告會在 JVM 正常結束時寫入（已驗證：`timeout 5 java -agentpath:...` 在收到 SIGTERM 時產出了 HTML）。

在瀏覽器中開啟 HTML 火焰圖：頂部寬大的圖塊即為時間消耗所在。對於延遲問題（阻塞於 I/O 的執行緒）使用 `wall`，對於 CPU 燃燒使用 `cpu`。

## 權限與注意事項

- Linux 上的 `cpu` 模式使用 `perf_events`。若失敗，請檢查 `/proc/sys/kernel/perf_event_paranoid`（需要較低的值，或 `CAP_PERFMON`/`CAP_SYS_ADMIN`）以及 `kptr_restrict`。變更這些 sysctl 屬於主機層級的安全性變更：請詢問使用者，切勿無聲修改，且切勿在共用/生產主機上修改。若無法修改，請使用 `-e ctimer`（4.x 文件：類似 `cpu` 但不需要 perf_events，無核心堆疊；`-e itimer` 亦可接受並在 4.5 中執行過）。在 4.5 的預設 Docker Desktop 容器中（`perf_event_paranoid=2`，無額外功能權限），一般的 `-e cpu`、`itimer`、`wall`、`alloc`、`lock`、`nativemem` 以及 `-agentpath` 形式均在未放寬安全性的情況下順利運作，因此在放寬任何權限前請先嘗試一般指令。
- 在 Docker 中，預設的 seccomp profile 會封鎖 `perf_event_open`（未執行 `--cap-add SYS_ADMIN` / `seccomp=unconfined` 變體）；搭配放寬的安全性執行（`--cap-add SYS_ADMIN`、`--security-opt seccomp=unconfined`）會削弱隔離性：僅限開發環境。
- 附加（Attach）操作需要與 JVM 相同的作業系統使用者。支援 macOS 但有限制（無 perf events）。
- 火焰圖可能會暴露專有程式碼的類別與方法名稱；請妥善處理。
- 偵錯符號：在目標上啟用 `-XX:+UnlockDiagnosticVMOptions -XX:+DebugNonSafepoints` 可獲得更精確的歸屬分析（需要重新啟動）。
