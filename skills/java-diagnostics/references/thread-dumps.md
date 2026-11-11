# 執行緒傾印與死結（第 1 級）

```bash
jcmd <pid> Thread.print              # 建議首選；包含死結報告
jcmd <pid> Thread.print -l           # 亦列出可擁有的同步器/鎖定
jstack <pid>                         # 較舊的等效工具
```

請勿將 `kill -3 <pid>` / SIGQUIT 作為無條件的回退手段。在 Unix 上，僅在驗證目標 JVM 已安裝其執行緒傾印 SIGQUIT 處理常式且 stdout/stderr 已被擷取後才使用。明確排除搭配 `-Xrs` / `-XX:+ReduceSignalUsage` 啟動的 JVM，或具備未知/自訂信號處理的 JVM：若無 JVM 處理常式，SIGQUIT 可能會終止行程並產生 core dump。若無法驗證信號處理機制，請勿發送該信號；請改為解決 `jcmd`/attach 權限問題。請參閱 [JDK 啟動器 `-Xrs` 文件](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html) 與 [Linux 信號預設值](https://man7.org/linux/man-pages/man7/signal.7.html)。

相隔 **5-10 秒採集 3 次傾印**，以檢視變動趨勢。單次傾印只是快照，無法看出趨勢。執行緒傾印包含堆疊框架與執行緒名稱，可能包含請求資料；請勿公開分享。

## 高 CPU 使用率：映射忙碌執行緒

```bash
top -H -p <pid>                      # 找出忙碌的原生執行緒 id（十進位）
printf '%x\n' <tid>                  # 轉換為十六進位，比對傾印中的 "nid=0x..."
```

檢查忙碌執行緒是否為應用程式程式碼、GC 執行緒（`GC Thread`、`G1 Conc`）或 JIT 編譯器執行緒（`C2 CompilerThread`）。

## 死結

`Thread.print` 會以「Found one Java-level deadlock」結尾並列出鎖定循環。否則尋找許多阻斷在相同監視器（`waiting to lock <0x...>`）上的 `BLOCKED` 執行緒，而該監視器的持有者本身亦在等待中。執行緒飢餓表現為集區中的所有執行緒都在相同的呼叫中處於 `WAITING`/`TIMED_WAITING`（例如連線池的 `getConnection`、阻塞式 HTTP 呼叫），同時佇列持續增長。

## 虛擬執行緒 (JDK 21+)

`Thread.print` 不會列出虛擬執行緒。請使用：

```bash
jcmd <pid> Thread.dump_to_file -format=json threads.json
jcmd <pid> Thread.dump_to_file threads.txt
```

`Thread.print` 僅顯示平台執行緒（在 JDK 27 上已驗證虛擬執行緒未列出，但在 `Thread.dump_to_file` 中存在）。固定（pinned）的虛擬執行緒（在 JDK 21-23 上阻斷在 `synchronized` 內部，或在任何版本上的原生框架）可透過 JFR 事件 `jdk.VirtualThreadPinned` 進行調查（請參閱 [jfr](jfr.md)）。`-Djdk.tracePinnedThreads=full`（或 `short`，僅印出持有監視器的框架）僅在 JDK 21-23 上有效：在 21.0.12 上它印出了 `VirtualThread[#20,vt-pinned]/runnable@ForkJoinPool-1-worker-1 reason:MONITOR` 附帶堆疊與 `<== monitors:1`。JEP 491 在 JDK 24 中將其移除（在 27 上驗證為無任何輸出）。自 JDK 24 起，`synchronized` 不再固定執行緒；原生框架與類別初始化程式仍會固定（在 JDK 27 上，一個在靜態初始化程式內休眠的虛擬執行緒被 JFR 回報為 `pinnedReason = "VM call to Pin$Slow.<clinit> on stack"`）。在 JDK 21-23 上相同的 JFR 事件亦可運作（在 21.0.12 上針對 `synchronized` 案例已驗證）。

## 閱讀提示

- 狀態：`RUNNABLE`（在 CPU 上或處於原生 I/O）、`BLOCKED`（等待監視器）、`WAITING`/`TIMED_WAITING`（park、sleep、wait）。
- 處於 `socketRead0` 的 `RUNNABLE` 通常是在等待網路，而非消耗 CPU。
- 依相同頂層框架對執行緒分組，以找出主導的模式。
