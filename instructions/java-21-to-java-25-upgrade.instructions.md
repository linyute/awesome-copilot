---
applyTo: ['*']
description: "自 Java 21 發布以來，採用 Java 25 新功能的全面最佳實踐。"
---

# Java 21 到 Java 25 升級指南

這些指令可協助 GitHub Copilot 協助開發人員將 Java 專案從 JDK 21 升級到 JDK 25，重點關注新的語言功能、API 變更和最佳實踐。

## JDK 22-25 中的語言功能和 API 變更

### 模式匹配增強 (JEP 455/488 - 23 中的預覽)

**模式、instanceof 和 switch 中的基本型別**

使用模式匹配時：
- 建議在 switch 表達式和 instanceof 檢查中使用基本型別模式
- 傳統 switch 的升級範例：
```java
// 舊方法 (Java 21)
switch (x.getStatus()) {
    case 0 -> "okay";
    case 1 -> "warning"; 
    case 2 -> "error";
    default -> "unknown status: " + x.getStatus();
}

// 新方法 (Java 25 預覽)
switch (x.getStatus()) {
    case 0 -> "okay";
    case 1 -> "warning";
    case 2 -> "error"; 
    case int i -> "unknown status: " + i;
}
```

- 使用 `--enable-preview` 旗標啟用預覽功能
- 建議使用防護模式處理更複雜的條件：
```java
switch (x.getYearlyFlights()) {
    case 0 -> ...;
    case int i when i >= 100 -> issueGoldCard();
    case int i -> ... // handle 1-99 range
}
```

### 類別檔案 API (JEP 466/484 - 23 中的第二次預覽，25 中的標準)

**使用標準 API 取代 ASM**

偵測到位元組碼操作或類別檔案處理時：
- 建議從 ASM 函式庫遷移到標準類別檔案 API
- 使用 `java.lang.classfile` 套件而不是 `org.objectweb.asm`
- 範例遷移模式：
```java
// 舊的 ASM 方法
ClassReader reader = new ClassReader(classBytes);
ClassWriter writer = new ClassWriter(reader, 0);
// ... ASM 操作

// 新的類別檔案 API 方法
ClassModel classModel = ClassFile.of().parse(classBytes);
byte[] newBytes = ClassFile.of().transform(classModel, 
    ClassTransform.transformingMethods(methodTransform));
```

### Markdown 文件註解 (JEP 467 - 23 中的標準)

**JavaDoc 現代化**

使用 JavaDoc 註解時：
- 建議將大量 HTML 的 JavaDoc 轉換為 Markdown 語法
- 使用 `///` 進行 Markdown 文件註解
- 範例轉換：
```java
// 舊的 HTML JavaDoc
/**
 * Returns the <b>absolute</b> value of an {@code int} value.
 * <p>
 * If the argument is not negative, return the argument.
 * If the argument is negative, return the negation of the argument.
 * 
 * @param a the argument whose absolute value is to be determined
 * @return the absolute value of the argument
 */

// 新的 Markdown JavaDoc  
/// Returns the **absolute** value of an `int` value.
///
/// If the argument is not negative, return the argument.
/// If the argument is negative, return the negation of the argument.
/// 
/// @param a the argument whose absolute value is to be determined
/// @return the absolute value of the argument
```

### 衍生記錄建立 (JEP 468 - 23 中的預覽)

**記錄增強**

使用記錄時：
- 建議使用 `with` 表達式建立衍生記錄
- 啟用衍生記錄建立的預覽功能
- 範例模式：
```java
// 而不是手動複製記錄
public record Person(String name, int age, String email) {
    public Person withAge(int newAge) {
        return new Person(name, newAge, email);
    }
}

// 使用衍生記錄建立 (預覽)
Person updated = person with { age = 30; };
```

### Stream 收集器 (JEP 473/485 - 23 中的第二次預覽，25 中的標準)

**增強型 Stream 處理**

處理複雜的 Stream 操作時：
- 建議使用 `Stream.gather()` 進行自訂中間操作
- 匯入 `java.util.stream.Gatherers` 以使用內建收集器
- 範例用法：
```java
// 自訂視窗操作
List<List<String>> windows = stream
    .gather(Gatherers.windowSliding(3))
    .toList();

// 帶有狀態的自訂過濾
List<Integer> filtered = numbers.stream()
    .gather(Gatherers.fold(0, (state, element) -> {
        // 自訂有狀態邏輯
        return state + element > threshold ? element : null;
    }))
    .filter(Objects::nonNull)
    .toList();
```

## 遷移警告和棄用

### sun.misc.Unsafe 記憶體存取方法 (JEP 471 - 23 中棄用)

偵測到 `sun.misc.Unsafe` 使用時：
- 警告已棄用的記憶體存取方法
- 建議遷移到標準替代方案：
```java
// 已棄用：sun.misc.Unsafe 記憶體存取
Unsafe unsafe = Unsafe.getUnsafe();
unsafe.getInt(object, offset);

// 首選：VarHandle API
VarHandle vh = MethodHandles.lookup()
    .findVarHandle(MyClass.class, "fieldName", int.class);
int value = (int) vh.get(object);

// 或用於堆外：外部函式和記憶體 API
MemorySegment segment = MemorySegment.ofArray(new int[10]);
int value = segment.get(ValueLayout.JAVA_INT, offset);
```

### JNI 使用警告 (JEP 472 - 24 中的警告)

偵測到 JNI 使用時：
- 警告即將到來的 JNI 使用限制
- 建議為使用 JNI 的應用程式新增 `--enable-native-access` 旗標
- 建議盡可能遷移到外部函式和記憶體 API
- 為原生存取新增 module-info.java 條目：
```java
module com.example.app {
    requires jdk.unsupported; // 用於剩餘的 JNI 使用
}
```

## 垃圾收集更新

### ZGC 分代模式 (JEP 474 - 23 中的預設)

組態垃圾收集時：
- 預設 ZGC 現在使用分代模式
- 如果明確使用非分代 ZGC，請更新 JVM 旗標：
```bash
# 明確的非分代模式 (將顯示棄用警告)
-XX:+UseZGC -XX:-ZGenerational

# 預設分代模式
-XX:+UseZGC
```

### G1 改進 (JEP 475 - 24 中實作)

使用 G1GC 時：
- 不需要程式碼變更 - 內部 JVM 優化
- 使用 C2 編譯器可能會看到改進的編譯效能

## 向量 API (JEP 469 - 25 中的第八個孵化器)

處理數值計算時：
- 建議使用向量 API 進行 SIMD 操作 (仍在孵化中)
- 新增 `--add-modules jdk.incubator.vector`
- 範例用法：
```java
import jdk.incubator.vector.*;

// 傳統純量計算
for (int i = 0; i < a.length; i++) {
    c[i] = a[i] + b[i];
}

// 向量化計算
var species = IntVector.SPECIES_PREFERRED;
for (int i = 0; i < a.length; i += species.length()) {
    var va = IntVector.fromArray(species, a, i);
    var vb = IntVector.fromArray(species, b, i);
    var vc = va.add(vb);
    vc.intoArray(c, i);
}
```

## 編譯和建構組態

### 預覽功能

對於使用預覽功能的專案：
- 將 `--enable-preview` 新增到編譯器參數
- 將 `--enable-preview` 新增到執行時參數
- Maven 組態：
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

- Gradle 組態：
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

### 逐步升級流程

1. **更新建構工具**：確保 Maven/Gradle 支援 JDK 25
2. **更新依賴項**：檢查 JDK 25 相容性
3. **處理警告**：處理來自 JEP 471/472 的棄用警告
4. **啟用預覽功能**：如果使用模式匹配或其他預覽功能
5. **徹底測試**：特別是對於使用 JNI 或 sun.misc.Unsafe 的應用程式
6. **效能測試**：使用新的 ZGC 預設值驗證 GC 行為

### 程式碼審查清單

審查 Java 25 升級程式碼時：
- [ ] 將 ASM 使用替換為類別檔案 API
- [ ] 將複雜的 HTML JavaDoc 轉換為 Markdown
- [ ] 在適用情況下在 switch 表達式中使用基本模式
- [ ] 將 sun.misc.Unsafe 替換為 VarHandle 或 FFM API
- [ ] 為 JNI 使用新增原生存取權限
- [ ] 使用 Stream 收集器進行複雜的 Stream 操作
- [ ] 更新預覽功能的建構組態

### 測試考量

- 使用 `--enable-preview` 旗標測試預覽功能
- 驗證 JNI 應用程式是否適用於原生存取警告
- 使用新的 ZGC 分代模式進行效能測試
- 使用 Markdown 註解驗證 JavaDoc 生成

## 常見陷阱

1. **預覽功能依賴項**：在沒有明確文件的情況下，不要在函式庫程式碼中使用預覽功能
2. **原生存取**：直接或間接使用 JNI 的應用程式可能需要 `--enable-native-access` 組態
3. **不安全遷移**：不要延遲從 sun.misc.Unsafe 遷移 - 棄用警告表示未來將移除
4. **模式匹配範圍**：基本模式適用於所有基本型別，而不僅僅是 int
5. **記錄增強**：衍生記錄建立在 Java 23 中需要預覽旗標

## 效能考量

- ZGC 分代模式可能會提高大多數工作負載的效能
- 類別檔案 API 減少了與 ASM 相關的開銷
- Stream 收集器為複雜的 Stream 操作提供更好的效能
- G1GC 改進減少了 JIT 編譯開銷

請記住，在將 Java 25 升級部署到生產系統之前，請在預備環境中徹底測試。
