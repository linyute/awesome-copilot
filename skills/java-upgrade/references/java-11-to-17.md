# Java 11 至 Java 17 升級指引

## 專案背景

本指引為將 Java 專案從 JDK 11 升級至 JDK 17 提供全面的 GitHub Copilot 指示，涵蓋兩個版本之間整合的 47 項 JEP 所帶來的主要語言功能、API 變更與遷移模式。

## 語言功能與 API 變更

### JEP 395: Records (Java 16)

**遷移模式**：將資料類別轉換為 record

```java
// 舊寫法：傳統資料類別
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
    public boolean equals(Object obj) { /* 樣板程式碼 */ }
    @Override
    public int hashCode() { /* 樣板程式碼 */ }
    @Override
    public String toString() { /* 樣板程式碼 */ }
}

// 新寫法：Record (Java 16+)
public record Person(String name, int age) {
    // 簡潔建構子（Compact constructor）用於驗證
    public Person {
        if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
    }

    // 可新增自訂方法
    public boolean isAdult() {
        return age >= 18;
    }
}
```

### JEP 409: Sealed Classes (Java 17)

**遷移模式**：使用密封類別（sealed classes）限制繼承

```java
// 新寫法：密封階層（所有允許的型別必須位於相同套件/模組中；
// 最頂層的 public 型別各自存放在獨立檔案中）
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

public record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public record Rectangle(double width, double height) implements Shape {
    @Override
    public double area() {
        return width * height;
    }
}

// non-sealed 允許進一步繼承；record 隱式宣告為 final，
// 因此若型別必須維持開放擴充，請使用 class
public non-sealed class Triangle implements Shape {
    private final double base, height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    public double base() { return base; }

    @Override
    public double area() {
        return 0.5 * base * height;
    }
}
```

### JEP 394: Pattern Matching for instanceof (Java 16)

**遷移模式**：簡化 instanceof 檢查

```java
// 舊寫法：傳統 instanceof 搭配強制轉型
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

// 新寫法：instanceof 模式比對 (Java 16+)
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

// 與密封類別搭配效果絕佳
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

### JEP 361: Switch Expressions (Java 14)

**遷移模式**：將 switch 陳述式轉換為運算式

```java
// 舊寫法：傳統 switch 陳述式
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

// 新寫法：Switch 運算式 (Java 14+)
public String getDayType(DayOfWeek day) {
    return switch (day) {
        case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "Workday";
        case SATURDAY, SUNDAY -> "Weekend";
    };
}

// 搭配 yield 處理複雜邏輯
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

### JEP 406: Pattern Matching for switch (Preview in Java 17)

**遷移模式**：以模式強化 switch（預覽功能）

```java
// 需要 --enable-preview 旗標
public String formatValue(Object obj) {
    return switch (obj) {
        case String s -> "String: " + s;
        case Integer i -> "Integer: " + i;
        case null -> "null value";
        default -> "Unknown: " + obj.getClass().getSimpleName();
    };
}

// 搭配防護模式（Java 17 預覽語法：&& 防護條件；「when」關鍵字於 Java 21 加入）
public String categorizeNumber(Object obj) {
    return switch (obj) {
        case Integer i && i < 0 -> "Negative integer";
        case Integer i && i == 0 -> "Zero";
        case Integer i && i > 0 -> "Positive integer";
        case Double d && d.isNaN() -> "Not a number";
        case Number n -> "Other number: " + n;
        case null -> "null";
        default -> "Not a number";
    };
}
```

### JEP 378: Text Blocks (Java 15)

**遷移模式**：將文字區塊用於多行字串

```java
// 舊寫法：串接字串
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

// 新寫法：文字區塊 (Java 15+)
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

// 搭配字串插值方法
String json = """
              {
                "name": "%s",
                "age": %d,
                "city": "%s"
              }
              """.formatted(name, age, city);
```

### JEP 358: Helpful NullPointerExceptions (Java 14)

**遷移指引**：更佳的 NPE 偵錯（在 Java 17 中預設啟用）

```java
// 舊 NPE 訊息："Exception in thread 'main' java.lang.NullPointerException"
// 新 NPE 訊息會精確顯示何者為 null：
// "Cannot invoke 'String.length()' because the return value of 'Person.getName()' is null"

public class PersonProcessor {
    public void processPersons(List<Person> persons) {
        // 這會精確顯示哪一個 person.getName() 回傳 null
        persons.stream()
            .mapToInt(person -> person.getName().length())  // 若 getName() 回傳 null 會有明確的 NPE
            .sum();
    }

    // 更明確的錯誤訊息有助於排查複雜運算式
    public void complexExample(Map<String, List<Person>> groups) {
        // NPE 會明確顯示鏈結中哪一部分為 null
        int totalNameLength = groups.get("admins")
                                  .get(0)
                                  .getName()
                                  .length();
    }
}
```

### JEP 371: Hidden Classes (Java 15)

**遷移模式**：用於框架與代理物件產生

```java
// 適用於建立動態代理的框架
public class DynamicProxyExample {
    public static <T> T createProxy(Class<T> interfaceClass, InvocationHandler handler) {
        // 隱藏類別為動態產生的類別提供更佳的封裝性
        MethodHandles.Lookup lookup = MethodHandles.lookup();

        // 框架程式碼會使用隱藏類別以獲得更好的隔離性
        // 這通常由框架處理，而非應用程式程式碼
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

### JEP 334: JVM Constants API (Java 12)

**遷移模式**：用於編譯時期常數

```java
import java.lang.constant.*;

// 用於進階中介程式設計（metaprogramming）與工具：類別與方法的名義描述元（nominal descriptors）
public class ConstantExample {
    public static void main(String[] args) {
        ClassDesc stringDesc = ClassDesc.of("java.lang.String");
        MethodTypeDesc lengthDesc = MethodTypeDesc.of(ConstantDescs.CD_int);
        System.out.println(stringDesc.descriptorString()); // Ljava/lang/String;
        System.out.println(lengthDesc.descriptorString()); // ()I
    }
}
```

### JEP 415: Context-Specific Deserialization Filters (Java 17)

**遷移模式**：增強物件還原序列化的安全性

```java
import java.io.*;

public class SecureDeserialization {
    // 設定還原序列化篩選器以維護安全性
    public static void setupSerializationFilters() {
        // 全域篩選器
        ObjectInputFilter globalFilter = ObjectInputFilter.Config.createFilter(
            "java.base/*;java.util.*;!*"
        );
        ObjectInputFilter.Config.setSerialFilter(globalFilter);
    }

    public <T> T deserializeSecurely(byte[] data, Class<T> expectedType) throws IOException, ClassNotFoundException {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(data);
             ObjectInputStream ois = new ObjectInputStream(bis)) {

            // 上下文特定篩選器
            ObjectInputFilter contextFilter = ObjectInputFilter.Config.createFilter(
                expectedType.getName() + ";java.lang.*;!*"
            );
            ois.setObjectInputFilter(contextFilter);

            return expectedType.cast(ois.readObject());
        }
    }
}
```

### JEP 356: Enhanced Pseudo-Random Number Generators (Java 17)

**遷移模式**：使用新的隨機產生器介面

```java
import java.util.random.*;

// 舊寫法：功能受限的 Random 類別
Random oldRandom = new Random();
int oldValue = oldRandom.nextInt(100);

// 新寫法：增強的隨機產生器 (Java 17+)
RandomGenerator generator = RandomGeneratorFactory
    .of("Xoshiro256PlusPlus")
    .create(System.nanoTime());

RandomGenerator.SplittableGenerator splittableGenerator =
    RandomGeneratorFactory.<RandomGenerator.SplittableGenerator>of("L64X128MixRandom").create();

// 更適合平行處理
splittableGenerator.splits(4)
    .parallel()
    .mapToInt(rng -> rng.nextInt(1000))
    .forEach(System.out::println);

// 可串流的隨機數值
generator.ints(10, 1, 101)
    .forEach(System.out::println);
```

## I/O 與網路改進

### JEP 380: Unix-Domain Socket Channels (Java 16)

**遷移模式**：使用 Unix domain socket 進行本機 IPC

```java
import java.io.IOException;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.file.Path;

// 舊寫法：本機通訊使用 TCP socket
// ServerSocketChannel server = ServerSocketChannel.open();
// server.bind(new InetSocketAddress("localhost", 8080));

// 新寫法：Unix domain socket (Java 16+)
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

### JEP 352: Non-Volatile Mapped Byte Buffers (Java 14)

**遷移模式**：用於非揮發性記憶體操作

```java
import java.io.IOException;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import jdk.nio.mapmode.ExtendedMapMode; // module jdk.nio.mapmode

public class PersistentMemoryExample {
    public void usePersistentMemory() throws IOException {
        Path nvmFile = Path.of("/mnt/pmem/data.bin");

        try (FileChannel channel = FileChannel.open(nvmFile,
                StandardOpenOption.READ,
                StandardOpenOption.WRITE,
                StandardOpenOption.CREATE)) {

            // 映射為非揮發性記憶體
            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, 1024,
                ExtendedMapMode.READ_WRITE_SYNC
            );

            // 寫入在崩潰後依然留存的資料
            buffer.putLong(0, System.currentTimeMillis());
            buffer.putInt(8, 12345);

            // 強制寫入至永久儲存區
            buffer.force();
        }
    }
}
```

## 建構系統設定

### Maven 設定

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
                <!-- 若使用 JEP 406 請啟用預覽功能 -->
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>

        <!-- 用於搭配預覽功能執行測試 -->
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

### Gradle 設定

```kotlin
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

tasks.withType<JavaCompile> {
    options.release.set(17)
    // 若需要請啟用預覽功能
    options.compilerArgs.addAll(listOf("--enable-preview"))
}

tasks.withType<Test> {
    useJUnitPlatform()
    // 為測試啟用預覽功能
    jvmArgs("--enable-preview")
}
```

## 廢棄與移除項目

### JEP 411: Deprecate the Security Manager for Removal

**遷移模式**：移除 Security Manager 依賴項

```java
// 舊寫法：使用 Security Manager
SecurityManager sm = System.getSecurityManager();
if (sm != null) {
    sm.checkPermission(new RuntimePermission("shutdownHooks"));
}

// 新寫法：替代安全性方法
// 使用應用程式層級安全性、容器或行程隔離
// 多數應用程式不需要 Security Manager 功能
```

### JEP 398: Deprecate the Applet API for Removal

**遷移模式**：從 Applet 遷移至現代 Web 技術

```java
// 舊寫法：Java Applet（已廢棄）
public class MyApplet extends Applet {
    @Override
    public void start() {
        // Applet 程式碼
    }
}

// 新寫法：現代替代方案
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
// 3. 使用現代框架轉換為 Web 應用程式
```

### JEP 372: Remove the Nashorn JavaScript Engine

**遷移模式**：使用替代的 JavaScript 引擎

```java
// 舊寫法：Nashorn（在 Java 17 中已移除）
// ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");

// 新寫法：替代方案
// 1. 使用 GraalVM JavaScript 引擎
ScriptEngine engine = new ScriptEngineManager().getEngineByName("graal.js");

// 2. 使用外部 JavaScript 執行程序
ProcessBuilder pb = new ProcessBuilder("node", "script.js");
Process process = pb.start();

// 3. 使用 Web 型方法或內嵌瀏覽器
```

## JVM 與效能改進

### JEP 377: ZGC - A Scalable Low-Latency Garbage Collector (Java 15)

**遷移模式**：為低延遲應用程式啟用 ZGC

```bash
# 啟用 ZGC
-XX:+UseZGC   # 自 Java 15 起已可用於生產環境；無需實驗性解鎖旗標

# 監控 ZGC 效能
-Xlog:gc*:file=gc.log
```

### JEP 379: Shenandoah - A Low-Pause-Time Garbage Collector (Java 15)

**遷移模式**：為穩定延遲啟用 Shenandoah

```bash
# 啟用 Shenandoah
# 並非所有 JDK 組建均包含此功能（例如 Oracle JDK）；在支援的發行版中自 Java 15 起可用於生產環境
-XX:+UseShenandoahGC

# Shenandoah 調校
-XX:ShenandoahGCHeuristics=adaptive
```

### JEP 341: Default CDS Archives (Java 12) & JEP 350: Dynamic CDS Archives (Java 13)

**遷移模式**：改善啟動效能

```bash
# CDS 預設啟用，但您可建立自訂封存檔
# 建立自訂 CDS 封存檔
java -XX:DumpLoadedClassList=classes.lst -cp myapp.jar com.example.Main
java -Xshare:dump -XX:SharedClassListFile=classes.lst -XX:SharedArchiveFile=myapp.jsa -cp myapp.jar

# 使用自訂 CDS 封存檔
java -XX:SharedArchiveFile=myapp.jsa -cp myapp.jar com.example.Main
```

## 測試與遷移策略

### 第 1 階段：基礎整備（第 1-2 週）

1. **更新建構系統**

   - 為 Java 17 修改 Maven/Gradle 設定
   - 更新 CI/CD 管線
   - 驗證依賴項相容性

2. **處理移除與廢棄項目**
   - 移除 Nashorn JavaScript 引擎的使用
   - 替換已廢棄的 Applet API
   - 更新 Security Manager 的使用方式

### 第 2 階段：語言功能（第 3-4 週）

1. **實作 Record**

   - 將資料類別轉換為 record
   - 在簡潔建構子中新增驗證
   - 測試序列化相容性

2. **新增模式比對**
   - 轉換 instanceof 鏈結
   - 實作型別安全的轉型模式

### 第 3 階段：進階功能（第 5-6 週）

1. **Switch 運算式**

   - 將 switch 陳述式轉換為運算式
   - 使用新箭頭語法
   - 實作複雜 yield 邏輯

2. **文字區塊**
   - 替換串接的多行字串
   - 更新 SQL 與 HTML 產生邏輯
   - 使用格式化方法

### 第 4 階段：密封類別（第 7-8 週）

1. **設計密封階層**

   - 識別繼承限制
   - 實作密封類別模式
   - 與模式比對結合

2. **測試與驗證**
   - 全面的測試涵蓋率
   - 效能基準測試
   - 相容性驗證

## 效能考量

### Record 對比傳統類別

- Record 更加節省記憶體
- 建立速度與相等性檢查更為迅速
- 自動序列化支援
- 建議用於資料傳輸物件（DTO）

### 模式比對效能

- 消除多餘的型別檢查
- 減少強制轉型負擔
- 提供更佳的 JVM 最佳化機會
- 與密封類別搭配使用以實現窮舉性檢查（exhaustiveness）

### Switch 運算式最佳化

- 產生更有效率的位元組碼
- 更佳的常數摺疊
- 改善分支預測
- 用於複雜條件邏輯

## 最佳實踐

1. **將 Record 用於資料類別**

   - 不可變資料容器
   - API 資料傳輸物件
   - 設定物件

2. **策略性套用模式比對**

   - 替換 instanceof 鏈結
   - 與密封類別搭配使用
   - 與 switch 運算式結合

3. **採用文字區塊處理多行內容**

   - SQL 查詢
   - JSON 範本
   - HTML 內容
   - 設定檔

4. **使用密封類別進行設計**

   - 領域建模
   - 狀態機
   - 代數資料型別
   - API 演進控制

5. **善用增強的隨機產生器**
   - 平行處理情境
   - 高品質隨機數
   - 統計應用
   - 遊戲與模擬

這份全面的指引使 GitHub Copilot 能夠在將 Java 11 專案升級至 Java 17 時提供適切的建議，重點著重於語言增強、API 改進與現代 Java 開發實踐。
