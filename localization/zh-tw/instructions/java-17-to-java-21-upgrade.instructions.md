---
applyTo: ['*']
description: "自 Java 17 發布以來，採用 Java 21 新功能的全面最佳實踐。"
---

# Java 17 到 Java 21 升級指南

這些指令可協助 GitHub Copilot 協助開發人員將 Java 專案從 JDK 17 升級到 JDK 21，重點關注新的語言功能、API 變更和最佳實踐。

## JDK 18-21 中的主要語言功能

### switch 的模式匹配 (JEP 441 - 21 中的標準)

**增強型 switch 表達式和陳述式**

使用 switch 建構時：
- 建議在適當情況下將傳統 switch 轉換為模式匹配
- 使用模式匹配進行型別檢查和解構
- 範例升級模式：
```java
// 舊方法 (Java 17)
public String processObject(Object obj) {
    if (obj instanceof String) {
        String s = (String) obj;
        return s.toUpperCase();
    } else if (obj instanceof Integer) {
        Integer i = (Integer) obj;
        return i.toString();
    }
    return "unknown";
}

// 新方法 (Java 21)
public String processObject(Object obj) {
    return switch (obj) {
        case String s -> s.toUpperCase();
        case Integer i -> i.toString();
        case null -> "null";
        default -> "unknown";
    };
}
```

- 支援防護模式：
```java
switch (obj) {
    case String s when s.length() > 10 -> "Long string: " + s;
    case String s -> "Short string: " + s;
    case Integer i when i > 100 -> "Large number: " + i;
    case Integer i -> "Small number: " + i;
    default -> "Other";
}
```

### 記錄模式 (JEP 440 - 21 中的標準)

**模式匹配中的解構記錄**

使用記錄時：
- 建議使用記錄模式進行解構
- 與 switch 表達式結合以實現強大的資料處理
- 範例用法：
```java
public record Point(int x, int y) {}
public record ColoredPoint(Point point, Color color) {}

// switch 中的解構
public String describe(Object obj) {
    return switch (obj) {
        case Point(var x, var y) -> "Point at (" + x + ", " + y + ")";
        case ColoredPoint(Point(var x, var y), var color) -> 
            "Colored point at (" + x + ", " + y + ") in " + color;
        default -> "Unknown shape";
    };
}
```

- 在複雜模式匹配中使用：
```java
// 巢狀記錄模式
switch (shape) {
    case Rectangle(ColoredPoint(Point(var x1, var y1), var c1), 
                   ColoredPoint(Point(var x2, var y2), var c2)) 
        when c1 == c2 -> "Monochrome rectangle";
    case Rectangle r -> "Multi-colored rectangle";
}
```

### 虛擬執行緒 (JEP 444 - 21 中的標準)

**輕量級並行**

使用並行時：
- 建議將虛擬執行緒用於高吞吐量、並行應用程式
- 使用 `Thread.ofVirtual()` 建立虛擬執行緒
- 範例遷移模式：
```java
// 舊的平台執行緒方法
ExecutorService executor = Executors.newFixedThreadPool(100);
executor.submit(() -> {
    // 阻塞 I/O 操作
    httpClient.send(request);
});

// 新的虛擬執行緒方法
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> {
        // 阻塞 I/O 操作 - 現在可擴展到數百萬
        httpClient.send(request);
    });
}
```

- 使用結構化並行模式：
```java
// 結構化並行 (預覽)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> user = scope.fork(() -> fetchUser(userId));
    Future<String> order = scope.fork(() -> fetchOrder(orderId));
    
    scope.join();           // 加入所有子任務
    scope.throwIfFailed();  // 傳播錯誤
    
    return processResults(user.resultNow(), order.resultNow());
}
```

### 字串範本 (JEP 430 - 21 中的預覽)

**安全字串插值**

使用字串格式化時：
- 建議使用字串範本進行安全字串插值 (預覽功能)
- 使用 `--enable-preview` 啟用預覽功能
- 範例用法：
```java
// 傳統串聯
String message = "Hello, " + name + "! You have " + count + " messages.";

// 字串範本 (預覽)
String message = STR."Hello, \{name}! You have \{count} messages.";

// 安全 HTML 生成
String html = HTML."<p>User: \{username}</p>";

// 安全 SQL 查詢  
PreparedStatement stmt = SQL."SELECT * FROM users WHERE id = \{userId}";
```

### 序列化集合 (JEP 431 - 21 中的標準)

**增強型集合介面**

使用集合時：
- 使用新的 `SequencedCollection`、`SequencedSet`、`SequencedMap` 介面
- 跨集合型別統一存取第一個/最後一個元素
- 範例用法：
```java
// Lists、Deques、LinkedHashSet 等上可用的新方法
List<String> list = List.of("first", "middle", "last");
String first = list.getFirst();  // "first"
String last = list.getLast();    // "last"
List<String> reversed = list.reversed(); // ["last", "middle", "first"]

// 適用於任何 SequencedCollection
SequencedSet<String> set = new LinkedHashSet<>();
set.addFirst("start");
set.addLast("end");
String firstElement = set.getFirst();
```

### 未命名模式和變數 (JEP 443 - 21 中的預覽)

**簡化模式匹配**

使用模式匹配時：
- 對於不需要的值使用未命名模式 `_`
- 簡化 switch 表達式和記錄模式
- 範例用法：
```java
// 忽略未使用的變數
switch (ball) {
    case RedBall(_) -> "Red ball";     // 不關心大小
    case BlueBall(var size) -> "Blue ball size " + size;
}

// 忽略記錄的部分
switch (point) {
    case Point(var x, _) -> "X coordinate: " + x; // 忽略 Y
    case ColoredPoint(Point(_, var y), _) -> "Y coordinate: " + y;
}

// 帶有未命名變數的例外處理
try {
    riskyOperation();
} catch (IOException | SQLException _) {
    // 不需要例外詳細資訊
    handleError();
}
```

### 作用域值 (JEP 446 - 21 中的預覽)

**改進的上下文傳播**

使用執行緒局部資料時：
- 考慮將作用域值作為 ThreadLocal 的現代替代方案
- 虛擬執行緒的效能更好，語義更清晰
- 範例用法：
```java
// 定義作用域值
private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();

// 設定和使用作用域值
ScopedValue.where(USER_ID, "user123")
    .run(() -> {
        processRequest(); // 可以在呼叫鏈中的任何位置存取 USER_ID.get()
    });

// 在巢狀方法中
public void processRequest() {
    String userId = USER_ID.get(); // "user123"
    // 使用使用者上下文處理
}
```

## API 增強和新功能

### 預設為 UTF-8 (JEP 400 - 18 中的標準)

使用檔案 I/O 時：
- UTF-8 現在是所有平台上的預設字元集
- 移除預期為 UTF-8 的明確字元集規範
- 範例簡化：
```java
// 舊的明確 UTF-8 規範
Files.readString(path, StandardCharsets.UTF_8);
Files.writeString(path, content, StandardCharsets.UTF_8);

// 新的預設行為 (Java 18+)
Files.readString(path);  // 預設使用 UTF-8
Files.writeString(path, content);  // 預設使用 UTF-8
```

### 簡單網頁伺服器 (JEP 408 - 18 中的標準)

需要基本 HTTP 伺服器時：
- 使用內建的 `jwebserver` 命令或 `com.sun.net.httpserver` 增強功能
- 非常適合測試和開發
- 範例用法：
```java
// 命令列
$ jwebserver -p 8080 -d /path/to/files

// 程式化用法
HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
server.createContext("/", new SimpleFileHandler(Path.of("/tmp")));
server.start();
```

### 網際網路位址解析 SPI (JEP 418 - 19 中的標準)

使用自訂 DNS 解析時：
- 實作 `InetAddressResolverProvider` 以進行自訂位址解析
- 對於服務發現和測試情境很有用

### 金鑰封裝機制 API (JEP 452 - 21 中的標準)

使用後量子密碼學時：
- 使用 KEM API 進行金鑰封裝機制
- 範例用法：
```java
KeyPairGenerator kpg = KeyPairGenerator.getInstance("ML-KEM");
KeyPair kp = kpg.generateKeyPair();

KEM kem = KEM.getInstance("ML-KEM");
KEM.Encapsulator encapsulator = kem.newEncapsulator(kp.getPublic());
KEM.Encapsulated encapsulated = encapsulator.encapsulate();
```

## 棄用和警告

### 終結棄用 (JEP 421 - 18 中棄用)

遇到 finalize() 方法時：
- 移除 finalize 方法並使用替代方案
- 建議使用 Cleaner API 或 try-with-resources
- 範例遷移：
```java
// 已棄用的 finalize 方法
@Override
protected void finalize() throws Throwable {
    cleanup();
}

// 使用 Cleaner 的現代方法
private static final Cleaner CLEANER = Cleaner.create();

public MyResource() {
    cleaner.register(this, new CleanupTask(nativeResource));
}

private static class CleanupTask implements Runnable {
    private final long nativeResource;
    
    CleanupTask(long nativeResource) {
        this.nativeResource = nativeResource;
    }
    
    public void run() {
        cleanup(nativeResource);
    }
}
```

### 動態代理載入 (JEP 451 - 21 中的警告)

使用代理或檢測時：
- 如果需要，新增 `-XX:+EnableDynamicAgentLoading` 以抑制警告
- 考慮在啟動時而不是動態載入代理
- 更新工具以使用啟動代理載入

## 建構組態更新

### 預覽功能

對於使用預覽功能的專案：
- 將 `--enable-preview` 新增到編譯器和執行時
- Maven 組態：
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <release>21</release>
        <compilerArgs>
            <arg>--enable-preview</arg>
        </compilerArgs>
    </configuration>
</plugin>

<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <argLine>--enable-preview</argLine>
    </configuration>
</plugin>
```

- Gradle 組態：
```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("--enable-preview")
}

tasks.withType<Test> {
    jvmArgs("--enable-preview")
}
```

### 虛擬執行緒組態

對於使用虛擬執行緒的應用程式：
- 不需要特殊的 JVM 旗標 (21 中的標準功能)
- 考慮這些系統屬性用於偵錯：
```bash
-Djdk.virtualThreadScheduler.parallelism=N  # 設定載體執行緒計數
-Djdk.virtualThreadScheduler.maxPoolSize=N  # 設定最大池大小
```

## 執行時和 GC 改進

### 分代 ZGC (JEP 439 - 21 中可用)

組態垃圾收集時：
- 嘗試分代 ZGC 以獲得更好的效能
- 使用：`-XX:+UseZGC -XX:+ZGenerational` 啟用
- 監控分配模式和 GC 行為

## 遷移策略

### 逐步升級流程

1. **更新建構工具**：確保 Maven/Gradle 支援 JDK 21
2. **語言功能採用**： 
   - 從 switch 的模式匹配開始 (標準)
   - 在有益的情況下新增記錄模式
   - 考慮將虛擬執行緒用於 I/O 密集型應用程式
3. **預覽功能**：僅在特定使用案例需要時啟用
4. **測試**：全面測試，特別是並行變更
5. **效能**：使用新的 GC 選項進行基準測試

### 程式碼審查清單

審查 Java 21 升級程式碼時：
- [ ] 將適當的 instanceof 鏈轉換為 switch 表達式
- [ ] 使用記錄模式進行資料解構
- [ ] 在適當情況下將 ThreadLocal 替換為 ScopedValues
- [ ] 考慮將虛擬執行緒用於高並行情境
- [ ] 移除明確的 UTF-8 字元集規範
- [ ] 將 finalize() 方法替換為 Cleaner 或 try-with-resources
- [ ] 使用 SequencedCollection 方法進行第一個/最後一個存取模式
- [ ] 僅對正在使用的預覽功能新增預覽旗標

### 常見遷移模式

1. **Switch 增強**：
   ```java
   // 從 instanceof 鏈到 switch 表達式
   if (obj instanceof String s) return processString(s);
   else if (obj instanceof Integer i) return processInt(i);
   // 變成：
   return switch (obj) {
       case String s -> processString(s);
       case Integer i -> processInt(i);
       default -> processDefault(obj);
   };
   ```

2. **虛擬執行緒採用**：
   ```java
   // 從平台執行緒到虛擬執行緒
   Executors.newFixedThreadPool(200)
   // 變成：
   Executors.newVirtualThreadPerTaskExecutor()
   ```

3. **記錄模式用法**：
   ```java
   // 從手動解構到記錄模式
   if (point instanceof Point p) {
       int x = p.x();
       int y = p.y();
   }
   // 變成：
   if (point instanceof Point(var x, var y)) {
       // 直接使用 x 和 y
   }
   ```

## 效能考量

- 虛擬執行緒在阻塞 I/O 方面表現出色，但可能對 CPU 密集型任務沒有幫助
- 分代 ZGC 可以減少大多數應用程式的 GC 開銷
- switch 中的模式匹配通常比 instanceof 鏈更有效率
- SequencedCollection 方法提供對第一個/最後一個元素的 O(1) 存取
- 作用域值對於虛擬執行緒的開銷比 ThreadLocal 低

## 測試建議

- 在高並行下測試虛擬執行緒應用程式
- 驗證模式匹配涵蓋所有預期情況
- 使用分代 ZGC 與其他收集器進行效能測試
- 驗證不同平台上的 UTF-8 預設行為
- 在生產使用前徹底測試預覽功能

請記住，僅在特別需要時才啟用預覽功能，並在部署到生產環境之前在預備環境中徹底測試。
