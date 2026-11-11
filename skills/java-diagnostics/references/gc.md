# GC 記錄與 jstat

## 統一 GC 記錄 (JDK 9+)

在啟動時啟用需要重新啟動，因此請將其視為第 2 級；其開銷很低。

```
-Xlog:gc*=info:file=/var/log/app/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
```

在執行中的 JVM 上啟用（第 2 級）：

```bash
jcmd <pid> VM.log what=gc*=info output=gc.log decorators=uptime,time
jcmd <pid> VM.log list
```

JDK 8 則改用 `-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:gc.log`。

## jstat（第 1 級）

```bash
jstat -gcutil <pid> 1000 10      # 使用率百分比，每 1 秒取樣一次，共 10 次
jstat -gc <pid> 1000 10          # 容量與大小（KB）
jstat -gccause <pid> 1000 5      # 上次 GC 原因
```

觀察重點：每次 full/mixed GC 後的老年代（`O`）佔用率。若持續攀升，應懷疑有記憶體流失（請參閱 [heap](heap.md)）。`FGC`/`FGCT` 上升代表頻繁發生 full GC。

## 解讀指引

- 長時間暫停：檢視每個事件的暫停時間與原因（`Allocation Failure`、`Humongous Allocation`、`Metadata GC Threshold`、`System.gc()`）。
- 伴隨高晉升率（promotion）的頻繁 young GC：配置速率過高或年輕代（young gen）過小。
- GC 後堆積接近上限：堆積過小或有記憶體流失；未經檢查請勿盲目調大 `-Xmx`。
- 暫停目標：G1 預設為 `-XX:MaxGCPauseMillis=200`；ZGC 與 Shenandoah 鎖定亞毫秒級暫停，但會消耗更多 CPU/記憶體開銷。每次僅變更一個調校旗標並比對記錄。
- GCeasy 或 GCViewer 等工具可視覺化記錄，但 GC 記錄可能揭露內部主機名稱與大小配置；切勿從敏感環境上傳。
- JFR 亦會記錄 GC 事件（`jdk.GarbageCollection`、`jdk.GCPhasePause`）；請參閱 [jfr](jfr.md)。
