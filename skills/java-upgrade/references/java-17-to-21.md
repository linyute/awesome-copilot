# Java 17 至 Java 21 升級指引

這些指示可協助 GitHub Copilot 引導開發者將 Java 專案從 JDK 17 升級至 JDK 21，重點著重於新的語言功能、API 變更與最佳實踐。

## JDK 18-21 的主要語言功能

### switch 模式比對 (JEP 441 - 於 21 成為標準功能)

**增強的 switch 運算式與陳述式**

處理 switch 結構時：
- 建議在適當處將傳統 switch 轉換為模式比對
- 使用模式比對進行型別檢查與解構
- 升級模式範例：
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

- 支援防護模式（guarded patterns）：
```java
return switch (obj) {
    case String s when s.length() > 10 -> "Long string: " + s;
    case String s -> "Short string: " + s;
    case Integer i when i > 100 -> "Large number: " + i;
    case Integer i -> "Small number: " + i;
    default -> "Other";
};
```

### Record 模式 (JEP 440 - 於 21 成為標準功能)

**在模式比對中解構 Record**

處理 record 時：
- 建議使用 record 模式進行解構
- 與 switch 運算式結合以實現強大的資料處理
- 使用範例：
```java
public record Point(int x, int y) {}
public record ColoredPoint(Point point, Color color) {}

// 在 switch 中解構
public String describe(Object obj) {
    return switch (obj) {
        case Point(var x, var y) -> "Point at (" + x + ", " + y + ")";
        case ColoredPoint(Point(var x, var y), var color) -> 
            "Colored point at (" + x + ", " + y + ") in " + color;
        default -> "Unknown shape";
    };
}
```

- 用於複雜的模式比對：
```java
// 巢狀 record 模式
return switch (shape) {
    case Rectangle(ColoredPoint(Point(var x1, var y1), var c1), 
                   ColoredPoint(Point(var x2, var y2), var c2)) 
        when c1 == c2 -> "Monochrome rectangle";
    case Rectangle r -> "Multi-colored rectangle";
    default -> "Other shape";
};
```

### 虛擬執行緒 (JEP 444 - 於 21 成為標準功能)

**輕量級並行（Concurrency）**

處理並行處理時：
- 建議將虛擬執行緒用於高吞吐量、具高度並行性的應用程式
- 使用 `Thread.ofVirtual()` 建立虛擬執行緒
- 遷移模式範例：
```java
// 舊平台執行緒方式
ExecutorService executor = Executors.newFixedThreadPool(100);
executor.submit(() -> {
    // 阻斷式 I/O 操作
    httpClient.send(request);
});

// 新虛擬執行緒方式
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> {
        // 阻斷式 I/O 操作 - 現可延展至數百萬個
        httpClient.send(request);
    });
}
```

- 使用結構化並行模式：
```java
// 結構化並行 (JEP 453 - 於 21 為預覽功能，需要 --enable-preview)
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    StructuredTaskScope.Subtask<String> user = scope.fork(() -> fetchUser(userId));
    StructuredTaskScope.Subtask<String> order = scope.fork(() -> fetchOrder(orderId));
    
    scope.join();           // 等候所有子任務
    scope.throwIfFailed();  // 傳遞錯誤
    
    return processResults(user.get(), order.get());
}
```

### 字串範本 (JEP 430 - 於 21 為預覽功能)

**安全的字串插值**

處理字串格式化時：
- 建議使用字串範本進行安全的字串插值（預覽功能）
- 使用 `--enable-preview` 啟用預覽功能
- 使用範例：
```java
// 傳統串接
String message = "Hello, " + name + "! You have " + count + " messages.";

// 字串範本（預覽）
String message = STR."Hello, \{name}! You have \{count} messages.";

// FMT (java.util.FormatProcessor) 新增格式說明元
// import static java.util.FormatProcessor.FMT;
String price = FMT."Total: %8.2f\{total}";
```

在 JDK 21 上僅內建 `STR`、`FMT` 與 `RAW`。領域專屬處理器（例如用於 HTML 或 SQL）必須由專案自行實作 `StringTemplate.Processor`；請勿假設其已存在。

### 循序集合 (JEP 431 - 於 21 成為標準功能)

**增強的集合介面**

處理集合時：
- 使用新的 `SequencedCollection`、`SequencedSet`、`SequencedMap` 介面
- 跨集合型別統一存取第一個/最後一個元素
- 使用範例：
```java
// 於 List、Deque、LinkedHashSet 等新增的方法
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

### 未命名模式與變數 (JEP 443 - 於 21 為預覽功能，需要 --enable-preview)

**簡化的模式比對**

處理模式比對時：
- 對不需要的數值使用未命名模式 `_`
- 簡化 switch 運算式與 record 模式
- 使用範例：
```java
// 忽略未使用的變數
switch (ball) {
    case RedBall(_) -> "Red ball";     // 不在乎大小
    case BlueBall(var size) -> "Blue ball size " + size;
}

// 忽略 record 的部分元件
switch (point) {
    case Point(var x, _) -> "X coordinate: " + x; // 忽略 Y
    case ColoredPoint(Point(_, var y), _) -> "Y coordinate: " + y;
}

// 使用未命名變數處理例外狀況
try {
    riskyOperation();
} catch (IOException | SQLException _) {
    // 不需要例外狀況詳細資訊
    handleError();
}
```

### 作用域值 (JEP 446 - 於 21 為預覽功能，需要 --enable-preview)

**改善的上下文傳播**

處理執行緒區域資料時：
- 考慮將作用域值（Scoped Values）作為 ThreadLocal 的現代替代方案
- 針對虛擬執行緒具備更佳效能與更清晰的語意
- 使用範例：
```java
// 定義作用域值
private static final ScopedValue<String> USER_ID = ScopedValue.newInstance();

// 設定並使用作用域值
ScopedValue.where(USER_ID, "user123")
    .run(() -> {
        processRequest(); // 可在呼叫鏈中的任何位置存取 USER_ID.get()
    });

// 在巢狀方法中
public void processRequest() {
    String userId = USER_ID.get(); // "user123"
    // 依據使用者上下文處理
}
```

## API 增強功能與新特性

### 預設為 UTF-8 (JEP 400 - 於 18 成為標準功能)

處理檔案 I/O 時：
- UTF-8 現在是所有平台上的預設字元集
- 在原意使用 UTF-8 的地方移除明確的字元集指定
- 簡化範例：
```java
// 舊有的明確指定 UTF-8
Files.readString(path, StandardCharsets.UTF_8);
Files.writeString(path, content, StandardCharsets.UTF_8);

// 新的預設行為 (Java 18+)
Files.readString(path);  // 預設使用 UTF-8
Files.writeString(path, content);  // 預設使用 UTF-8
```

### 簡易網頁伺服器 (JEP 408 - 於 18 成為標準功能)

需要基本 HTTP 伺服器時：
- 使用內建的 `jwebserver` 指令或 `com.sun.net.httpserver.SimpleFileServer` API
- 非常適合測試與開發
- 使用範例：
```java
// 命令列
$ jwebserver -p 8080 -d /path/to/files

// 程式碼使用
HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
server.createContext("/", SimpleFileServer.createFileHandler(Path.of("/tmp")));
server.start();
```

### 網際網路位址解析 SPI (JEP 418 - 於 19 成為標準功能)

處理自訂 DNS 解析時：
- 實作 `InetAddressResolverProvider` 以進行自訂位址解析
- 適用於服務探索與測試情境

### 金鑰封裝機制 API (JEP 452 - 於 21 成為標準功能)

處理金鑰封裝時：
- 將 KEM API 用於金鑰封裝機制
- JDK 21 隨附 DHKEM 演算法（RFC 9180）；後量子 ML-KEM 直到 Java 24（JEP 496）才加入
- 使用範例：
```java
KeyPairGenerator kpg = KeyPairGenerator.getInstance("X25519");
KeyPair kp = kpg.generateKeyPair();

KEM kem = KEM.getInstance("DHKEM");
KEM.Encapsulator encapsulator = kem.newEncapsulator(kp.getPublic());
KEM.Encapsulated encapsulated = encapsulator.encapsulate();
```

## 廢棄與警告項目

### Finalization 廢棄 (JEP 421 - 於 18 廢棄)

遇到 `finalize()` 方法時：
- 移除 finalize 方法並使用替代方案
- 建議使用 Cleaner API 或 try-with-resources
- 遷移範例：
```java
// 已廢棄的 finalize 方式
@Override
protected void finalize() throws Throwable {
    cleanup();
}

// 搭配 Cleaner 的現代方式
private static final Cleaner CLEANER = Cleaner.create();

public MyResource() {
    CLEANER.register(this, new CleanupTask(nativeResource));
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

### 動態 Agent 載入 (JEP 451 - 於 21 發出警告)

處理 agent 或 instrumentation 時：
- 若需要可新增 `-XX:+EnableDynamicAgentLoading` 以隱藏警告
- 考慮在啟動時載入 agent，而非動態載入
- 更新工具以改用啟動時 agent 載入

## 建構設定更新

### 預覽功能

針對使用預覽功能的專案：
- 在編譯器與執行時期新增 `--enable-preview`
- Maven 設定：
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

- Gradle 設定：
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

### 虛擬執行緒設定

針對使用虛擬執行緒的應用程式：
- 不需要特殊的 JVM 旗標（於 21 成為標準功能）
- 可考慮使用這些系統屬性進行偵錯：
```bash
-Djdk.virtualThreadScheduler.parallelism=N  # 設定承載執行緒數量
-Djdk.virtualThreadScheduler.maxPoolSize=N  # 設定最大集區大小
```

## 執行時期與 GC 改進

### 分代 ZGC (JEP 439 - 於 21 提供)

設定記憶體回收時：
- 嘗試分代 ZGC（Generational ZGC）以獲得更佳效能
- 啟用方式：`-XX:+UseZGC -XX:+ZGenerational`
- 監控配置模式與 GC 行為

## 遷移策略

### 逐步升級程序

1. **更新建構工具**：確保 Maven/Gradle 支援 JDK 21
2. **採用語言功能**：
   - 從 switch 模式比對開始（標準功能）
   - 在有益處的地方新增 record 模式
   - 針對 I/O 密集型應用程式考慮虛擬執行緒
3. **預覽功能**：僅在特定使用案例需要時啟用
4. **測試**：全面的測試，特別是針對並行性變更
5. **效能**：使用新的 GC 選項進行基準測試

### 程式碼審查檢查清單

為 Java 21 升級審查程式碼時：
- [ ] 將適當的 instanceof 鏈結轉換為 switch 運算式
- [ ] 將 record 模式用於資料解構
- [ ] 在適當處將 ThreadLocal 替換為 ScopedValues（於 21 為預覽功能）
- [ ] 針對高並行情境考慮虛擬執行緒
- [ ] 移除明確的 UTF-8 字元集指定
- [ ] 將 finalize() 方法替換為 Cleaner 或 try-with-resources
- [ ] 對第一個/最後一個元素的存取模式使用 SequencedCollection 方法
- [ ] 僅針對使用中的預覽功能新增 preview 旗標

### 常見遷移模式

1. **Switch 增強**：
   ```java
   // 從 instanceof 鏈結轉為 switch 運算式
   if (obj instanceof String s) return processString(s);
   else if (obj instanceof Integer i) return processInt(i);
   // 轉變為：
   return switch (obj) {
       case String s -> processString(s);
       case Integer i -> processInt(i);
       default -> processDefault(obj);
   };
   ```

2. **採用虛擬執行緒**：
   ```java
   // 從平台執行緒轉為虛擬執行緒
   Executors.newFixedThreadPool(200)
   // 轉變為：
   Executors.newVirtualThreadPerTaskExecutor()
   ```

3. **使用 Record 模式**：
   ```java
   // 從手動解構轉為 record 模式
   if (point instanceof Point p) {
       int x = p.x();
       int y = p.y();
   }
   // 轉變為：
   if (point instanceof Point(var x, var y)) {
       // 直接使用 x 與 y
   }
   ```

## 效能考量

- 虛擬執行緒在阻斷式 I/O 方面表現優異，但對 CPU 密集型任務可能無明顯助益
- 分代 ZGC 可為多數應用程式降低 GC 負擔
- switch 中的模式比對通常比 instanceof 鏈結更有效率
- SequencedCollection 方法提供 O(1) 的第一個/最後一個元素存取
- 對於虛擬執行緒，作用域值（Scoped Values）的負擔比 ThreadLocal 更低

## 測試建議

- 在高並行下測試虛擬執行緒應用程式
- 驗證模式比對涵蓋所有預期案例
- 針對分代 ZGC 與其他回收器進行效能測試
- 跨不同平台驗證 UTF-8 預設行為
- 在投入生產環境之前徹底測試預覽功能

請記住僅在明確需要時啟用預覽功能，並在部署至生產環境前於預備環境進行徹底測試。
