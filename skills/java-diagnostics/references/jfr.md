# Java Flight Recorder（第 2 級：需取得同意）

JFR 內建於 OpenJDK 11+（以及 Oracle JDK 8u262+/OpenJDK 8u262+）中。`default` 設定的預設開銷很低（約 1% 或更少）；`profile` 設定會收集更多資訊，開銷為數個百分點。啟動前請先說明持續時間與設定。

## 啟動

啟動時：

```
-XX:StartFlightRecording=filename=/secure/dir/rec.jfr,duration=120s,settings=profile
```

在執行中的 JVM 上：

```bash
jcmd <pid> JFR.start name=diag duration=120s settings=profile filename=/secure/dir/rec.jfr
jcmd <pid> JFR.check
jcmd <pid> JFR.dump name=diag filename=/secure/dir/rec.jfr
jcmd <pid> JFR.stop name=diag
```

若要進行持續性的低開銷錄製以便在事件發生後傾印，請搭配 `settings=default` 使用 `maxage=30m maxsize=250m`，並設定 `disk=true` 限制以確保儲存空間有上限。

記憶體流失候選對象：在傾印時加入 `path-to-gc-roots=true`（`JFR.dump ... path-to-gc-roots=true`），這會包含 `jdk.OldObjectSample` 事件，且需要額外耗時。

## 分析（命令列）

```bash
jfr summary rec.jfr                               # 事件計數
jfr print --events jdk.ExecutionSample rec.jfr | head
jfr print --events jdk.GarbageCollection rec.jfr
jfr print --events jdk.JavaMonitorEnter,jdk.ThreadPark rec.jfr
jfr print --events jdk.VirtualThreadPinned rec.jfr
jfr print --json --events jdk.SocketRead rec.jfr
```

實用事件：`jdk.ExecutionSample`（CPU 忙碌方法）、`jdk.ObjectAllocationSample`（記憶體配置）、`jdk.GCPhasePause`、`jdk.JavaMonitorEnter`（鎖定競爭）、`jdk.SocketRead`/`jdk.FileRead`（慢速 I/O）、`jdk.ClassLoad`、`jdk.CPULoad`、`jdk.NativeMethodSample`。

`jdk.VirtualThreadPinned`（JDK 21+，包含在預設 profile 中，閥值為 20 毫秒）會報告在固定（pinned）狀態下被阻斷的虛擬執行緒；已在 JDK 21.0.12 與 27 上驗證。它是 `-Djdk.tracePinnedThreads` 的替代方案（後者僅限 JDK 21-23，請參閱 [thread-dumps](thread-dumps.md)）。

## JDK Mission Control

在 JDK Mission Control（JMC，可從 https://adoptium.net/jmc 或 Oracle/Eclipse 發行版個別下載）中開啟 `.jfr` 檔案。Automated Analysis 頁面會給出依優先順序排列的發現結果；Method Profiling、Memory、Lock Instances 與 I/O 頁面可進行向下深入探索。請在本機開啟錄製檔案；它們包含堆疊追蹤、系統屬性，有時還包含命令列或環境詳細資訊，因此切勿從敏感環境分享出去。
