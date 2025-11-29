---
applyTo: ["*"]
description: "自 Java 11 發布以來，採用 Java 17 新功能的全面最佳實踐。"
---

# Java 11 到 Java 17 升級指南

## 專案情境

本指南提供全面的 GitHub Copilot 指令，用於將 Java 專案從 JDK 11 升級到 JDK 17，涵蓋主要語言功能、API 變更以及基於這兩個版本之間整合的 47 個 JEP 的遷移模式。

## 語言功能和 API 變更

### JEP 395: 記錄 (Java 16)

**遷移模式**：將資料類別轉換為記錄

```java
// Old: 傳統資料類別
public class Person {
    private final String name;
    private final int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String name() { return name; }
    public int age() { return age; }

    @Override
    public boolean equals(Object obj) { /* boilerplate */ }
    @Override
    public int hashCode() { /* boilerplate */ }
    @Override
    public String toString() { /* boilerplate */ }
}

// New: 記錄 (Java 16+)
public record Person(String name, int age) {
    // 用於驗證的緊湊建構函式
    public Person {
        if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
    }

    // 可以新增自訂方法
    public boolean isAdult() {
        return age >= 18;
    }
}
```

### JEP 409: 密封類別 (Java 17)

**遷移模式**：使用密封類別進行受限繼承

```java
// New: 密封類別階層
public sealed class Shape
    permits Circle, Rectangle, Triangle {

    public abstract double area();
}

public final class Circle extends Shape {
    private final double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public final class Rectangle extends Shape {
    private final double width, height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double area() {
        return width * height;
    }
}

public non-sealed class Triangle extends Shape {
    // 非密封允許進一步繼承
    private final double base, height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    public double area() {
        return 0.5 * base * height;
    }
}
```

### JEP 394: instanceof 的模式匹配 (Java 16)

**遷移模式**：簡化 instanceof 檢查

```java
// Old: 傳統的 instanceof 與型別轉換
public String processObject(Object obj) {
    if (obj instanceof String) {
        String str = (String) obj;
        return str.toUpperCase();
    } else if (obj instanceof Integer) {
        Integer num = (Integer) obj;
        return "Number: " + num;
    } else if (obj instanceof List<?>) {
        List<?> list = (List<?>) obj;
        return "List with " + list.size() + " elements";
    }
    return "Unknown type";
}

// New: instanceof 的模式匹配 (Java 16+)
public String processObject(Object obj) {
    if (obj instanceof String str) {
        return str.toUpperCase();
    } else if (obj instanceof Integer num) {
        return "Number: " + num;
    } else if (obj instanceof List<?> list) {
        return "List with " + list.size() + " elements";
    }
    return "Unknown type";
}

// 與密封類別搭配使用效果極佳
public String describeShape(Shape shape) {
    if (shape instanceof Circle circle) {
        return "Circle with radius " + circle.radius();
    } else if (shape instanceof Rectangle rect) {
        return "Rectangle " + rect.width() + "x" + rect.height();
    } else if (shape instanceof Triangle triangle) {
        return "Triangle with base " + triangle.base();
    }
    return "Unknown shape";
}
```

### JEP 361: Switch 表達式 (Java 14)

**遷移模式**：將 switch 陳述式轉換為表達式

```java
// Old: 傳統的 switch 陳述式
public String getDayType(DayOfWeek day) {
    String result;
    switch (day) {
        case MONDAY:
        case TUESDAY:
        case WEDNESDAY:
        case THURSDAY:
        case FRIDAY:
            result = "Workday";
            break;
        case SATURDAY:
        case SUNDAY:
            result = "Weekend";
            break;
        default:
            throw new IllegalArgumentException("Unknown day: " + day);
    }
    return result;
}

// New: Switch 表達式 (Java 14+)
public String getDayType(DayOfWeek day) {
    return switch (day) {
        case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "Workday";
        case SATURDAY, SUNDAY -> "Weekend";
    };
}

// 帶有 yield 的複雜邏輯
public int calculateScore(Grade grade) {
    return switch (grade) {
        case A -> 100;
        case B -> 85;
        case C -> 70;
        case D -> {
            System.out.println("Consider improvement");
            yield 55;
        }
        case F -> {
            System.out.println("Needs retake");
            yield 0;
        }
    };
}
```

### JEP 406: switch 的模式匹配 (Java 17 中的預覽功能)

**遷移模式**：帶有模式的增強型 switch (預覽功能)

```java
// 需要 --enable-preview 旗標
public String formatValue(Object obj) {
    return switch (obj) {
        case String s -> "String: " + s;
        case Integer i -> "Integer: " + i;
        case null -> "null value";
        case default -> "Unknown: " + obj.getClass().getSimpleName();
    };
}

// 帶有防護模式
public String categorizeNumber(Object obj) {
    return switch (obj) {
        case Integer i when i < 0 -> "Negative integer";
        case Integer i when i == 0 -> "Zero";
        case Integer i when i > 0 -> "Positive integer";
        case Double d when d.isNaN() -> "Not a number";
        case Number n -> "Other number: " + n;
        case null -> "null";
        case default -> "Not a number";
    };
}
```

### JEP 378: 文字區塊 (Java 15)

**遷移模式**：使用文字區塊處理多行字串

```java
// Old: 串聯字串
String html = "<html>\n" +
              "  <body>\n" +
              "    <h1>Hello World</h1>\n" +
              "    <p>Welcome to Java 17!</p>\n" +
              "  </body>\n" +
              "</html>";

String sql = "SELECT p.id, p.name, p.email, " +
             "       a.street, a.city, a.state " +
             "FROM person p " +
             "JOIN address a ON p.address_id = a.id " +
             "WHERE p.active = true " +
             "ORDER BY p.name";

// New: 文字區塊 (Java 15+)
String html = """
              <html>
                <body>
                  <h1>Hello World</h1>
                  <p>Welcome to Java 17!</p>
                </body>
              </html>
              """;

String sql = """
             SELECT p.id, p.name, p.email,
                    a.street, a.city, a.state
             FROM person p
             JOIN address a ON p.address_id = a.id
             WHERE p.active = true
             ORDER BY p.name
             """;

// 帶有字串插值方法
String json = """
              {
                "name": "%s",
                "age": %d,
                "city": "%s"
              }
              """.formatted(name, age, city);
```

### JEP 358: 有用的 NullPointerException (Java 14)

**遷移指南**：更好的 NPE 偵錯 (Java 17 中預設啟用)

```java
// 舊的 NPE 訊息：「執行緒 'main' 中的例外 java.lang.NullPointerException」
// 新的 NPE 訊息精確顯示哪個為 null：
// 「無法呼叫 'String.length()'，因為 'Person.getName()' 的回傳值為 null」

public class PersonProcessor {
    public void processPersons(List<Person> persons) {
        // 這將精確顯示哪個 person.getName() 回傳了 null
        persons.stream()
            .mapToInt(person -> person.getName().length())  // 如果 getName() 回傳 null，則清除 NPE
            .sum();
    }

    // 更好的錯誤訊息有助於處理複雜表達式
    public void complexExample(Map<String, List<Person>> groups) {
        // NPE 將精確顯示鏈中的哪個部分為 null
        int totalNameLength = groups.get("admins")
                                  .get(0)
                                  .getName()
                                  .length();
    }
}
```

### JEP 371: 隱藏類別 (Java 15)

**遷移模式**：用於框架和代理生成

```java
// 用於建立動態代理的框架
public class DynamicProxyExample {
    public static <T> T createProxy(Class<T> interfaceClass, InvocationHandler handler) {
        // 隱藏類別為動態生成的類別提供更好的封裝
        MethodHandles.Lookup lookup = MethodHandles.lookup();

        // 框架程式碼將使用隱藏類別以實現更好的隔離
        // 這通常由框架處理，而不是應用程式程式碼
        return interfaceClass.cast(
            Proxy.newProxyInstance(
                interfaceClass.getClassLoader(),
                new Class<?>[]{interfaceClass},
                handler
            )
        );
    }
}
```

### JEP 334: JVM 常數 API (Java 12)

**遷移模式**：用於編譯時常數

```java
import java.lang.constant.*;

// 用於進階元程式設計和工具
public class ConstantExample {
    // 對於計算值使用動態常數
    public static final DynamicConstantDesc<String> COMPUTED_CONSTANT =
        DynamicConstantDesc.of(
            ConstantDescs.BSM_INVOKE,
            "computeValue",
            ConstantDescs.CD_String
        );

    // 主要由編譯器和框架開發人員使用
    public static String computeValue() {
        return "Computed at runtime, cached as constant";
    }
}
```

### JEP 415: 上下文特定反序列化過濾器 (Java 17)

**遷移模式**：增強物件反序列化的安全性

```java
import java.io.*;

public class SecureDeserialization {
    // 設定反序列化過濾器以提高安全性
    public static void setupSerializationFilters() {
        // 全域過濾器
        ObjectInputFilter globalFilter = ObjectInputFilter.Config.createFilter(
            "java.base/*;java.util/*;!*"
        );
        ObjectInputFilter.Config.setSerialFilter(globalFilter);
    }

    public <T> T deserializeSecurely(byte[] data, Class<T> expectedType) throws IOException, ClassNotFoundException {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(data);
             ObjectInputStream ois = new ObjectInputStream(bis)) {

            // 上下文特定過濾器
            ObjectInputFilter contextFilter = ObjectInputFilter.Config.createFilter(
                expectedType.getName() + ";java.lang/*;!*"
            );
            ois.setObjectInputFilter(contextFilter);

            return expectedType.cast(ois.readObject());
        }
    }
}
```

### JEP 356: 增強型偽亂數產生器 (Java 17)

**遷移模式**：使用新的亂數產生器介面

```java
import java.util.random.*;

// Old: 有限的 Random 類別
Random oldRandom = new Random();
int oldValue = oldRandom.nextInt(100);

// New: 增強型亂數產生器 (Java 17+)
RandomGenerator generator = RandomGeneratorFactory
    .of("Xoshiro256PlusPlus")
    .create(System.nanoTime());

RandomGenerator.SplittableGenerator splittableGenerator =
    RandomGeneratorFactory.of("L64X128MixRandom").create();

// 更適合平行處理
splittableGenerator.splits(4)
    .parallel()
    .mapToInt(rng -> rng.nextInt(1000))
    .forEach(System.out::println);

// 可串流的亂數值
generator.ints(10, 1, 101)
    .forEach(System.out::println);
```

## I/O 和網路改進

### JEP 380: Unix 網域通訊端通道 (Java 16)

**遷移模式**：使用 Unix 網域通訊端進行本機 IPC

```java
import java.net.UnixDomainSocketAddress;
import java.nio.channels.*;

// Old: 用於本機通訊的 TCP 通訊端
// ServerSocketChannel server = ServerSocketChannel.open();
// server.bind(new InetSocketAddress("localhost", 8080));

// New: Unix 網域通訊端 (Java 16+)
public class UnixSocketExample {
    public void createUnixDomainServer() throws IOException {
        Path socketPath = Path.of("/tmp/my-app.socket");
        UnixDomainSocketAddress address = UnixDomainSocketAddress.of(socketPath);

        try (ServerSocketChannel server = ServerSocketChannel.open(StandardProtocolFamily.UNIX)) {
            server.bind(address);

            while (true) {
                try (SocketChannel client = server.accept()) {
                    // 處理用戶端連線
                    handleClient(client);
                }
            }
        }
    }

    public void connectToUnixSocket() throws IOException {
        Path socketPath = Path.of("/tmp/my-app.socket");
        UnixDomainSocketAddress address = UnixDomainSocketAddress.of(socketPath);

        try (SocketChannel client = SocketChannel.open(address)) {
            // 與伺服器通訊
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            client.read(buffer);
        }
    }

    private void handleClient(SocketChannel client) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        int bytesRead = client.read(buffer);
        // 處理用戶端資料
    }
}
```

### JEP 352: 非揮發性映射位元組緩衝區 (Java 14)

**遷移模式**：用於持久記憶體操作

```java
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.StandardOpenOption;

public class PersistentMemoryExample {
    public void usePersistentMemory() throws IOException {
        Path nvmFile = Path.of("/mnt/pmem/data.bin");

        try (FileChannel channel = FileChannel.open(nvmFile,
                StandardOpenOption.READ,
                StandardOpenOption.WRITE,
                StandardOpenOption.CREATE)) {

            // 映射為持久記憶體
            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, 1024,
                ExtendedMapMode.READ_WRITE_SYNC
            );

            // 寫入在崩潰後仍能持久的資料
            buffer.putLong(0, System.currentTimeMillis());
            buffer.putInt(8, 12345);

            // 強制寫入持久儲存
            buffer.force();
        }
    }
}
```

## 建構系統組態

### Maven 組態

```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <maven.compiler.release>17</maven.compiler.release>
</properties>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.11.0</version>
            <configuration>
                <release>17</release>
                <!-- 如果使用 JEP 406，則啟用預覽功能 -->
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>

        <!-- 用於執行帶有預覽功能的測試 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.0.0</version>
            <configuration>
                <argLine>--enable-preview</argLine>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Gradle 組態

```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

tasks.withType<JavaCompile> {
    options.release.set(17)
    // 如果需要，啟用預覽功能
    options.compilerArgs.addAll(listOf("--enable-preview"))
}

tasks.withType<Test> {
    useJUnitPlatform()
    // 為測試啟用預覽功能
    jvmArgs("--enable-preview")
}
```

## 棄用和移除

### JEP 411: 棄用 Security Manager 以便移除

**遷移模式**：移除 Security Manager 依賴項

```java
// Old: 使用 Security Manager
SecurityManager sm = System.getSecurityManager();
if (sm != null) {
    sm.checkPermission(new RuntimePermission("shutdownHooks"));
}

// New: 替代安全方法
// 使用應用程式層級安全性、容器或程序隔離
// 大多數應用程式不需要 Security Manager 功能
```

### JEP 398: 棄用 Applet API 以便移除

**遷移模式**：從 Applet 遷移到現代網路技術

```java
// Old: Java Applet (已棄用)
public class MyApplet extends Applet {
    @Override
    public void start() {
        // Applet 程式碼
    }
}

// New: 現代替代方案
// 1. 轉換為獨立 Java 應用程式
public class MyApplication extends JFrame {
    public MyApplication() {
        setTitle("My Application");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        // 應用程式程式碼
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            new MyApplication().setVisible(true);
        });
    }
}

// 2. 使用 Java Web Start 替代方案 (jlink)
// 3. 使用現代框架轉換為網路應用程式
```

### JEP 372: 移除 Nashorn JavaScript 引擎

**遷移模式**：使用替代 JavaScript 引擎

```java
// Old: Nashorn (在 Java 17 中移除)
// ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");

// New: 替代方法
// 1. 使用 GraalVM JavaScript 引擎
ScriptEngine engine = new ScriptEngineManager().getEngineByName("graal.js");

// 2. 使用外部 JavaScript 執行
ProcessBuilder pb = new ProcessBuilder("node", "script.js");
Process process = pb.start();

// 3. 使用基於網路的方法或嵌入式瀏覽器
```

## JVM 和效能改進

### JEP 377: ZGC - 可擴展的低延遲垃圾收集器 (Java 15)

**遷移模式**：為低延遲應用程式啟用 ZGC

```bash
# 啟用 ZGC
-XX:+UseZGC
-XX:+UnlockExperimentalVMOptions  # 在 Java 17 中不需要

# 監控 ZGC 效能
-XX:+LogVMOutput
-XX:LogFile=gc.log
```

### JEP 379: Shenandoah - 低暫停時間垃圾收集器 (Java 15)

**遷移模式**：為一致的延遲啟用 Shenandoah

```bash
# 啟用 Shenandoah
-XX:+UseShenandoahGC
-XX:+UnlockExperimentalVMOptions  # 在 Java 17 中不需要

# Shenandoah 調優
-XX:ShenandoahGCHeuristics=adaptive
```

### JEP 341: 預設 CDS 檔案 (Java 12) 和 JEP 350: 動態 CDS 檔案 (Java 13)

**遷移模式**：改進啟動效能

```bash
# CDS 預設啟用，但您可以建立自訂檔案
# 建立自訂 CDS 檔案
java -XX:DumpLoadedClassList=classes.lst -cp myapp.jar com.example.Main
java -Xshare:dump -XX:SharedClassListFile=classes.lst -XX:SharedArchiveFile=myapp.jsa -cp myapp.jar

# 使用自訂 CDS 檔案
java -XX:SharedArchiveFile=myapp.jsa -cp myapp.jar com.example.Main
```

## 測試和遷移策略

### 階段 1: 基礎 (第 1-2 週)

1. **更新建構系統**

   - 修改 Java 17 的 Maven/Gradle 組態
   - 更新 CI/CD 管道
   - 驗證依賴項相容性

2. **處理移除和棄用**
   - 移除 Nashorn JavaScript 引擎使用
   - 取代已棄用的 Applet API
   - 更新 Security Manager 使用

### 階段 2: 語言功能 (第 3-4 週)

1. **實作記錄**

   - 將資料類別轉換為記錄
   - 在緊湊建構函式中新增驗證
   - 測試序列化相容性

2. **新增模式匹配**
   - 轉換 instanceof 鏈
   - 實作型別安全轉換模式

### 階段 3: 進階功能 (第 5-6 週)

1. **Switch 表達式**

   - 將 switch 陳述式轉換為表達式
   - 使用新的箭頭語法
   - 實作複雜的 yield 邏輯

2. **文字區塊**
   - 取代串聯的多行字串
   - 更新 SQL 和 HTML 生成
   - 使用格式化方法

### 階段 4: 密封類別 (第 7-8 週)

1. **設計密封階層**

   - 識別繼承限制
   - 實作密封類別模式
   - 與模式匹配結合

2. **測試和驗證**
   - 全面測試覆蓋率
   - 效能基準測試
   - 相容性驗證

## 效能考量

### 記錄與傳統類別

- 記錄更節省記憶體
- 更快的建立和相等檢查
- 自動序列化支援
- 考慮用於資料傳輸物件

### 模式匹配效能

- 消除冗餘型別檢查
- 減少轉換開銷
- 更好的 JVM 優化機會
- 與密封類別一起使用以實現窮舉

### Switch 表達式優化

- 更高效的位元組碼生成
- 更好的常數摺疊
- 改進的分支預測
- 用於複雜的條件邏輯

## 最佳實踐

1. **將記錄用於資料類別**

   - 不可變資料容器
   - API 資料傳輸物件
   - 組態物件

2. **策略性地應用模式匹配**

   - 取代 instanceof 鏈
   - 與密封類別一起使用
   - 與 switch 表達式結合

3. **採用文字區塊處理多行內容**

   - SQL 查詢
   - JSON 範本
   - HTML 內容
   - 組態檔案

4. **使用密封類別進行設計**

   - 領域建模
   - 狀態機
   - 代數資料型別
   - API 演進控制

5. **利用增強型偽亂數產生器**
   - 平行處理情境
   - 高品質亂數
   - 統計應用程式
   - 遊戲和模擬

本全面指南使 GitHub Copilot 能夠在將 Java 11 專案升級到 Java 17 時提供上下文適當的建議，重點關注語言增強、API 改進和現代 Java 開發實踐。
