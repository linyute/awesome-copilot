# Java 21 至 Java 25 升級指引

這些指示可協助 GitHub Copilot 引導開發者將 Java 專案從 JDK 21 升級至 JDK 25，重點著重於新的語言功能、API 變更與最佳實踐。

## JDK 22-25 的語言功能與 API 變更

### 模式比對增強 (JEP 455/488/507 - 於 23-25 為預覽功能，在 25 仍為預覽)

**模式、instanceof 與 switch 中的基本型別**

處理模式比對時：
- 建議在 switch 運算式與 instanceof 檢查中使用基本型別模式（primitive type patterns）
- 傳統 switch 的升級範例：
```java
// 舊方法 (Java 21)
String s = switch (x.getStatus()) {
    case 0 -> "okay";
    case 1 -> "warning";
    case 2 -> "error";
    default -> "unknown status: " + x.getStatus();
};

// 新方法 (Java 25 預覽)
String s = switch (x.getStatus()) {
    case 0 -> "okay";
    case 1 -> "warning";
    case 2 -> "error";
    case int i -> "unknown status: " + i;
};
```

- 使用 `--enable-preview` 旗標啟用預覽功能
- 針對更複雜的條件建議使用防護模式：
```java
switch (x.getYearlyFlights()) {
    case 0 -> noCard();
    case int i when i >= 100 -> issueGoldCard();
    case int i -> issueBasicCard(i); // 處理 1-99 範圍
}
```

### Class-File API (JEP 466/484 - 於 23 為第二次預覽，於 24 成為標準功能)

**以標準 API 取代 ASM**

偵測到位元組碼操作或 class 檔案處理時：
- 建議從 ASM 函式庫遷移至標準 Class-File API
- 使用 `java.lang.classfile` 套件取代 `org.objectweb.asm`
- 遷移模式範例：
```java
// 舊 ASM 方式
ClassReader reader = new ClassReader(classBytes);
ClassWriter writer = new ClassWriter(reader, 0);
// ... ASM 操作

// 新 Class-File API 方式
ClassModel classModel = ClassFile.of().parse(classBytes);
byte[] newBytes = ClassFile.of().transformClass(classModel,
    ClassTransform.transformingMethods(methodTransform));
```

### Markdown 文件註解 (JEP 467 - 於 23 成為標準功能)

**JavaDoc 現代化**

處理 JavaDoc 註解時：
- 建議將充斥 HTML 的 JavaDoc 轉換為 Markdown 語法
- 使用 `///` 撰寫 Markdown 文件註解
- 轉換範例：
```java
// 舊 HTML JavaDoc
/**
 * Returns the <b>absolute</b> value of an {@code int} value.
 * <p>
 * If the argument is not negative, return the argument.
 * If the argument is negative, return the negation of the argument.
 * 
 * @param a the argument whose absolute value is to be determined
 * @return the absolute value of the argument
 */

// 新 Markdown JavaDoc  
/// Returns the **absolute** value of an `int` value.
///
/// If the argument is not negative, return the argument.
/// If the argument is negative, return the negation of the argument.
/// 
/// @param a the argument whose absolute value is to be determined
/// @return the absolute value of the argument
```

### 衍生 Record 建立 (JEP 468 - 未交付)

**Record 增強**

JEP 468（用於 record 的 `with` 運算式）並未隨附於 JDK 22-25 中，即使加上 `--enable-preview` 也無法使用。
- 在此功能正式交付前，請繼續使用明確的 `withX` 複製方法（或複製建構子風格）
- 模式範例：
```java
public record Person(String name, int age, String email) {
    public Person withAge(int newAge) {
        return new Person(name, newAge, email);
    }
}

Person updated = person.withAge(30);
```

### Stream Gatherers (JEP 473/485 - 於 23 為第二次預覽，於 24 成為標準功能)

**增強的 Stream 處理**

處理複雜的 stream 操作時：
- 建議使用 `Stream.gather()` 進行自訂的中繼操作
- 匯入 `java.util.stream.Gatherers` 以取得內建 gatherer
- 使用範例：
```java
// 自訂滑動視窗操作
List<List<String>> windows = stream
    .gather(Gatherers.windowSliding(3))
    .toList();

// 累加總和：fold 接收初始值供應器並發出單一結果
Optional<Integer> total = numbers.stream()
    .gather(Gatherers.fold(() -> 0, (sum, element) -> sum + element))
    .findFirst();

// 針對每個元素的累計總和
List<Integer> running = numbers.stream()
    .gather(Gatherers.scan(() -> 0, (sum, element) -> sum + element))
    .toList();
```

## 遷移警告與廢棄項目

### sun.misc.Unsafe 記憶體存取方法 (JEP 471 - 於 23 廢棄)

偵測到 `sun.misc.Unsafe` 使用時：
- 警告記憶體存取方法已被廢棄
- 建議遷移至標準替代方案：
```java
// 已廢棄：sun.misc.Unsafe 記憶體存取
Unsafe unsafe = Unsafe.getUnsafe();
unsafe.getInt(object, offset);

// 偏好方式：VarHandle API
VarHandle vh = MethodHandles.lookup()
    .findVarHandle(MyClass.class, "fieldName", int.class);
int value = (int) vh.get(object);

// 或針對堆外記憶體：Foreign Function & Memory API
MemorySegment segment = MemorySegment.ofArray(new int[10]);
int value = segment.get(ValueLayout.JAVA_INT, offset);
```

### JNI 使用警告 (JEP 472 - 於 24 發出警告)

偵測到 JNI 使用時：
- 警告即將對 JNI 使用施加的限制
- 建議為使用 JNI 的應用程式新增 `--enable-native-access` 旗標
- 在可能的情況下建議遷移至 Foreign Function & Memory API
- 明確授予原生存取權限：`--enable-native-access=ALL-UNNAMED`（類別路徑）或 `--enable-native-access=com.example.app`（模組），或在可執行 JAR manifest 中設定 `Enable-Native-Access: ALL-UNNAMED`

## 記憶體回收更新

### ZGC 分代模式 (JEP 474 - 於 23 成為預設，JEP 490 - 於 24 移除未分代模式)

設定記憶體回收時：
- 自 JDK 23 起 ZGC 預設使用分代模式，且非分代模式已在 JDK 24 中移除
- 從 JVM 旗標中移除 `-XX:-ZGenerational`（以及現在多餘的 `-XX:+ZGenerational`）：
```bash
# 在 JDK 24+ 中分代模式為唯一模式（非分代 ZGC 已被移除）
-XX:+UseZGC

# -XX:-ZGenerational / -XX:+ZGenerational 已過時；請從啟動指令碼中移除
```

### G1 改進 (JEP 475 - 於 24 實作)

使用 G1GC 時：
- 無需變更程式碼 - 屬於內部 JVM 最佳化
- 搭配 C2 編譯器時可能可見編譯效能改善

## Vector API (JEP 469/508 - 在 25 仍為育成階段)

處理數值運算時：
- 建議將 Vector API 用於 SIMD 操作（仍處於育成階段）
- 新增 `--add-modules jdk.incubator.vector`
- 使用範例：
```java
import jdk.incubator.vector.*;

// 傳統純量運算
for (int i = 0; i < a.length; i++) {
    c[i] = a[i] + b[i];
}

// 向量化運算
var species = IntVector.SPECIES_PREFERRED;
int i = 0;
for (; i < species.loopBound(a.length); i += species.length()) {
    var va = IntVector.fromArray(species, a, i);
    var vb = IntVector.fromArray(species, b, i);
    va.add(vb).intoArray(c, i);
}
for (; i < a.length; i++) { // 純量結尾
    c[i] = a[i] + b[i];
}
```

## 編譯與建構設定

### 預覽功能

針對使用預覽功能的專案：
- 在編譯器引數新增 `--enable-preview`
- 在執行時期引數新增 `--enable-preview`
- Maven 設定：
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <release>25</release>
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
        languageVersion = JavaLanguageVersion.of(25)
    }
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("--enable-preview")
}

tasks.withType<Test> {
    jvmArgs("--enable-preview")
}
```

## 遷移策略

### 逐步升級程序

1. **更新建構工具**：確保 Maven/Gradle 支援 JDK 25
2. **更新依賴項**：檢查 JDK 25 相容性
3. **處理警告**：處理來自 JEP 471/472 的廢棄警告
4. **啟用預覽功能**：若使用模式比對或其他預覽功能
5. **徹底測試**：特別是針對使用 JNI 或 sun.misc.Unsafe 的應用程式
6. **效能測試**：使用新的 ZGC 預設值驗證 GC 行為

### 程式碼審查檢查清單

為 Java 25 升級審查程式碼時：
- [ ] 以 Class-File API 取代 ASM 使用
- [ ] 將複雜的 HTML JavaDoc 轉換為 Markdown
- [ ] 在適用處將基本型別模式用於 switch 運算式
- [ ] 以 VarHandle 或 FFM API 取代 sun.misc.Unsafe
- [ ] 為 JNI 使用新增原生存取權限
- [ ] 將 Stream gatherers 用於複雜的 stream 操作
- [ ] 為預覽功能更新建構設定

### 測試考量

- 針對預覽功能搭配 `--enable-preview` 旗標進行測試
- 驗證 JNI 應用程式在原生存取警告下能正常運作
- 針對新的 ZGC 分代模式進行效能測試
- 驗證 Markdown 註解的 JavaDoc 產出

## 常見陷阱

1. **預覽功能依賴項**：若無明確說明文件，切勿在函式庫程式碼中使用預覽功能
2. **原生存取**：直接或間接使用 JNI 的應用程式可能需要 `--enable-native-access` 設定
3. **Unsafe 遷移**：請勿推遲從 sun.misc.Unsafe 遷移 — 廢棄警告代表未來將會移除
4. **模式比對範圍**：基本型別模式適用於所有基本型別，而不僅是 int
5. **Record 增強**：衍生 record 建立（`with` 運算式）在任何 JDK 25 模式下均不可用；請使用明確的 `withX` 複製方法

## 效能考量

- ZGC 分代模式可能改善多數工作負載的效能
- Class-File API 可減少 ASM 相關的負擔
- Stream gatherers 為複雜 stream 操作提供更佳效能
- G1GC 改進減少了 JIT 編譯負擔

請記住在部署 Java 25 升級至生產系統之前，務必先於預備環境進行徹底測試。
