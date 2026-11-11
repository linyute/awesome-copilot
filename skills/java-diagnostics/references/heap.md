# 堆積、長條圖、Eclipse MAT

## 第 2 級：類別長條圖（搭配 `-all=true` 不觸發 full GC，但仍有 safepoint 暫停）

```bash
jcmd <pid> GC.class_histogram -all=true | head -40   # 無 GC；包含無法存取的物件
jmap -histo <pid> | head -40                          # 無 GC
jcmd <pid> GC.class_histogram | head -40             # full GC，僅存活物件
jmap -histo:live <pid> | head -40                    # full GC，僅存活物件
```

這四種指令均在 safepoint 執行堆積檢查，在大型堆積上可能會在掃描期間暫停應用程式執行緒：在生產環境中，請先取得明確同意並說明開銷。後兩種指令還會強制觸發 full GC。前兩種避免了 full GC，但可能統計到尚未回收的垃圾物件。在有負載時相隔數分鐘採集兩次長條圖；執行個體數量與位元組數持續增長的類別即為流失嫌疑對象。

## 第 3 級：堆積傾印（需要明確同意）

執行前：說明目標路徑、檢查剩餘磁碟空間（`df -h`；約需等同使用中的堆積大小），並警告會有與堆積大小成比例的 stop-the-world 暫停。請寫入至受限目錄（`chmod 700`）。

```bash
jcmd <pid> GC.heap_dump /secure/dir/heap.hprof          # 僅存活物件 (full GC)
jcmd <pid> GC.heap_dump -all=true /secure/dir/heap.hprof # 包含無法存取的物件
```

`jmap -dump:live,format=b,file=heap.hprof <pid>` 是較舊的等效指令。該檔案是由目標 JVM 寫入，因此該路徑必須對目標 JVM 具備可寫權限（若在容器中則需位於容器內）。

**敏感資料**：堆積傾印包含記憶體中的所有內容：憑證、權杖、工作階段資料、個人資料。切勿上傳或分享（包含上傳至 AI 服務或問題追蹤器）。遮蔽並非可靠的防護措施。請在本機分析，完成後安全刪除該檔案。

發生 OOM 時自動傾印（選擇啟用的啟動旗標，由於資料敏感度與磁碟佔用仍屬於第 3 級）：

```
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/secure/dir/
```

將 `HeapDumpPath` 設定至具備充足空間的磁碟區；在容器中未設限的傾印可能會填滿節點磁碟。

## 使用 Eclipse MAT 進行分析

1. 從官方下載頁面安裝 Eclipse Memory Analyzer (https://eclipse.dev/mat/)。它需要 Java 執行時期，且堆積大小約需為傾印檔案大小的 1.5 倍（編輯 `MemoryAnalyzer.ini` 中的 `-Xmx`）。
2. 開啟 `.hprof`；優先執行 **Leak Suspects** 報告。
3. 使用 **Dominator Tree**（依保留堆積 retained heap 排序）找出佔用記憶體的來源。
4. 針對嫌疑物件，透過 **Path to GC Roots, excluding weak/soft references** 檢視其未被回收的原因。
5. 使用長條圖比對功能比較兩個傾印檔案以確認增長情況。
6. 常見原因：未設限的快取或 Map、靜態集合、未移除的監聽器、集區執行緒中的 ThreadLocal、重新部署時的 classloader 流失、過大的結果集。

MAT 發行版中提供 `ParseHeapDump.sh`（`-vmargs -Xmx...`）進行無外顯介面的批次語法解析，並產出報告 ZIP。

## 替代方案（第 2 級）

搭配 `jdk.OldObjectSample` 與 path-to-gc-roots（`path-to-gc-roots=true`）的 JFR 可找出流失候選對象而無需完整的堆積傾印；請參閱 [jfr](jfr.md)。
