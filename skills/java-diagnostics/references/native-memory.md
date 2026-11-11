# 原生記憶體追蹤 (Native Memory Tracking, NMT)（第 2 級：需取得同意）

當容器 RSS 增長但堆積使用量未增長時使用。NMT 追蹤的是 JVM 內部的記憶體配置（metaspace、執行緒堆疊、code cache、GC 結構，以及透過 `Internal`/`Other` 的直接緩衝區），而非任意原生函式庫的 `malloc`。

在啟動時啟用（需要重新啟動；Oracle 記載啟用 NMT 會帶來約 5-10% 的 JVM 效能下降，加上額外的 malloc 標頭記憶體，且 `detail` 開銷更高；請依據您的工作負載進行量測）：

```
-XX:NativeMemoryTracking=summary
```

接著執行：

```bash
jcmd <pid> VM.native_memory summary
jcmd <pid> VM.native_memory baseline
# ... 等待問題顯現 ...
jcmd <pid> VM.native_memory summary.diff
```

僅在短暫的工作階段中使用 `detail`（更高開銷）。無法在執行中的 JVM 上動態啟用它。

## 常見增長區域

| 類別 | 典型原因 | 緩解措施 |
|----------|---------------|-----------|
| Thread | 過多執行緒（每個堆疊約 1 MB） | 限制執行緒池上限；虛擬執行緒；`-Xss` |
| Class | Classloader 流失、動態代理 | 修復流失；`-XX:MaxMetaspaceSize` |
| Code | 龐大的 JIT code cache | `-XX:ReservedCodeCacheSize` |
| GC | 大型堆積的 Remembered sets/card tables | 設定適當的堆積大小 |
| Internal/Other | 直接 `ByteBuffer`、Netty 緩衝池 | `-XX:MaxDirectMemorySize`，檢查集區設定 |
| 未納入 NMT | JNI/原生函式庫、glibc arena | async-profiler `nativemem`；`MALLOC_ARENA_MAX=2`；配置器效能分析 |

總 RSS ≈ 堆積 + metaspace + 執行緒 + code cache + 直接緩衝區 + 原生函式庫。請對照容器記憶體限制進行比對（請參閱 [containers](containers.md)）。
