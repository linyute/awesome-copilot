# 容器 (Containers)

## 記憶體大小設定

- JVM 在 JDK 10+ 與 8u191+ 中具備容器感知能力（cgroup 限制）。
- 堆積預設為容器限制的 25%。請使用 `-XX:MaxRAMPercentage=75.0`（若有顯著的原生/堆外記憶體使用量，則使用更低的值，例如 50-70）取代固定的 `-Xmx`，使堆積能隨容器限制自動延展。
- 為 metaspace、執行緒堆疊、code cache、直接緩衝區保留餘裕空間；在堆積狀態健康的情況下發生 OOM-kill（結束代碼 137，`OOMKilled`）通常指向原生記憶體增長（請參閱 [native-memory](native-memory.md)）。
- 驗證 JVM 所識別的數值：`java -XX:+PrintFlagsFinal -version | grep -E 'MaxHeapSize|MaxRAMPercentage|ActiveProcessorCount'` 與 `jcmd <pid> VM.flags`。

## 附加診斷工具

- `jcmd`/`jstack` 必須在**容器內部**執行（相同的 PID 命名空間與使用者）：`docker exec -it <c> jcmd 1 Thread.print`、`kubectl exec <pod> -- jcmd 1 Thread.print`。僅含 JRE 的映像檔缺少這些工具。
- 請勿為了新增工具而重新建構生產環境映像檔。優先採用共用行程命名空間的暫時性偵錯容器（`kubectl debug -it <pod> --image=<jdk-image> --target=<container>`），且僅在取得明確同意後進行。
- 輸出檔案是由目標 JVM 寫入容器的檔案系統中；使用 `kubectl cp` / `docker cp` 將其複製出來，隨後在容器中將其刪除。針對堆積傾印需注意暫時性儲存空間（ephemeral storage）的限制。
- 第 1/2/3 級規則依然適用；生產環境 pod 需要使用者明確指示。

## CPU

過少的 CPU 或 CFS 節流（throttling）會導致延遲並引發 GC 執行緒飢餓。請檢查 `-XX:ActiveProcessorCount`、節流度量指標（`container_cpu_cfs_throttled_seconds_total`）以及執行緒池大小設定。

## 偵錯

有關將 JDWP 連接埠映射至 `127.0.0.1`，請參閱 `java-debugging` 技能。
