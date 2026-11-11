# 依發行版本劃分的現代 Java 慣用語

本檔案中的程式碼片段已在 JDK 21 與 25 上編譯並執行過 (`-Xlint:all -Werror`)，除非另有標記。僅在專案所設定的發行版本支援時才使用該功能；切勿為了使用某項功能而調高發行版本。

## Records, sealed 型別, 模式比對 (17 / 21)

```java
public sealed interface Shape permits Circle, Rect, Group {}

public record Circle(double r) implements Shape {
    public Circle {                                   // 精簡建構子：驗證
        if (r <= 0) throw new IllegalArgumentException("r must be > 0");
    }
}
public record Rect(double w, double h) implements Shape {}
public record Group(List<Shape> items) implements Shape {
    public Group { items = List.copyOf(items); }      // 防禦性不可變複製
}

static double area(Shape s) {
    return switch (s) {                                // 窮舉式：無 default，編譯器檢查
        case Circle(double r) -> Math.PI * r * r;     // record 模式 (21)
        case Rect(double w, double h) -> w * h;
        case Group(List<Shape> items) -> items.stream().mapToDouble(Main::area).sum();
    };
}

static String describe(Object o) {
    return switch (o) {
        case null -> "null";
        case Integer i when i > 10 -> "big int " + i; // guard 條件
        case Integer i -> "int " + i;
        case String str -> "string " + str.length();
        default -> "other";
    };
}
```

- Record 為淺層不可變 (shallowly immutable)：需複製可變元件 (`List.copyOf`)。它們適合做為 DTO/值型別，但不適合做為 JPA 實體 (請參閱 `java-hibernate-jpa`)。
- 優先使用 sealed 階層與無 `default` 的窮舉式 `switch`，這樣新增子型別時，缺少處理的程式碼會在編譯時報錯。
- 21 之前 (17)：`if (o instanceof String s && !s.isBlank()) {...}` 與箭頭形式的 switch 運算式可運作；`switch` 中的 `case Integer i ->` 模式則無法運作。

## 文字區塊 (Text blocks, 15)

```java
String json = """
    {
      "name": "demo"
    }
    """;
```

縮排會相對於結尾定界符號進行去除；使用 `.formatted(...)` 填入數值；切勿藉由串接不受信任的輸入來建構 SQL/JSON。

## 虛擬執行緒 (Virtual threads, 21, final)

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Integer>> futures = new ArrayList<>();
    for (int i = 0; i < 1_000; i++) {
        int n = i;
        futures.add(executor.submit(() -> { Thread.sleep(Duration.ofMillis(10)); return n; }));
    }
    for (var f : futures) f.get();
}
Thread.ofVirtual().name("worker-", 0).start(task);   // 單一執行緒
```

已驗證：1,000 個任務（每個休眠 10 毫秒）在 JDK 21 與 25 上透過 `newVirtualThreadPerTaskExecutor` 執行；在任務內部 `Thread.currentThread().isVirtual()` 為 true。

- 用於封鎖式 I/O 工作負載 (HTTP, JDBC)；對 CPU 密集型工作無益。
- 切勿將其放入集區 (pool) 或進行快取；每個任務建立一個。使用 `Semaphore` 限制對下游資源的並行存取，而非使用集區大小。
- 避免每個任務帶有過重的 `ThreadLocal` 狀態。在 JDK 21-23 上，於 `synchronized` 內部封鎖的虛擬執行緒會釘選至其載體；JEP 491 (JDK 24) 移除了大部分此類釘選。在 21 上針對長時間封鎖的關鍵區段請使用 `ReentrantLock`。
- 架構可透過設定切換至虛擬執行緒（例如 Spring Boot 屬性）；這屬於架構範疇，非本 skill 處理範圍。

## 結構化並行與作用域數值 (Structured concurrency and scoped values)

- `ScopedValue`：在 21 上為預覽版，**在 25 中為正式版 (final)**（已驗證：在 25 上無需 `--enable-preview` 即可編譯與執行，在 21 上作為預覽 API 被拒絕）。
- `StructuredTaskScope`：在 25 與 27 上皆為**預覽版**（已驗證："is a preview API and is disabled by default"）。其 API 在 21 與 25 之間有所變更 (25 使用 `StructuredTaskScope.open()`)。未經使用者明確核准為編譯與執行啟用 `--enable-preview` 時切勿使用；Maven 需要 `<compilerArgs>--enable-preview</compilerArgs>` 以及 Surefire `argLine`。

## SequencedCollection (21)

```java
static <T> Optional<T> last(SequencedCollection<T> c) {
    return c.isEmpty() ? Optional.empty() : Optional.ofNullable(c.getLast()); // 允許 null 的集合
}
```

`getFirst/getLast/addFirst/removeLast/reversed()` 在 `List`、`Deque`、`LinkedHashSet`、`SortedSet` 上可用；在空清單上呼叫 `getFirst()` 會擲出 `NoSuchElementException`。`SequencedCollection` 的實作可能允許 null 元素（例如 `LinkedList` 與 `LinkedHashSet`），因此當結果可能為 null 時請使用 `Optional.ofNullable`。

## 較新的功能

| 功能 | 狀態 (已在 JDK 25 / 27 上驗證，除非另有標記) |
| --- | --- |
| 未命名變數 `_` | 22 中為正式版；在 21 上編譯器提示 "unnamed variables are a preview feature" |
| `Stream.gather` / `Gatherers.windowFixed(2)` | 在 25 與 27 上運作正常；在 21 上不存在 |
| 執行個體 `void main()` (精簡原始檔) | 在 25 與 27 上無需旗標即可運作 |
| `import module java.base;` | 在 25 與 27 上無需旗標即可運作 |
| `ScopedValue` | 在 25 與 27 上無需旗標即可運作 |
| `StructuredTaskScope` | 在 25 與 27 上為預覽版 |

在推薦任何其他功能之前，請先在目標 JDK 上使用 `java <File>.java` 驗證其狀態；JEP 狀態每六個月皆會變動。

## 集合與 API 常見陷阱

- `stream().toList()` (16+) 傳回不可修改的清單；`Collectors.toList()` 則不作任何保證。
- `Map.of`/`List.of` 拒絕 null，且 `Map.of` 具備未定義的反覆運算順序；當順序重要時請使用 `LinkedHashMap`。
- 切勿使用 `finalize`、`Thread.stop`、`new Integer(...)`、`Date`/`Calendar`、`SecurityManager`。
