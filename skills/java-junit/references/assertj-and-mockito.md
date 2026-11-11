# AssertJ 與 Mockito 模式

所有程式碼片段均在 JDK 21（AssertJ 3.27.7、Mockito 5.23.0、JUnit 5.14.4 與 6.0.3）上編譯並通過測試，除非另有標註。

## AssertJ

僅在專案已依賴 `org.assertj:assertj-core`（或使用者同意）時使用。從 `org.assertj.core.api.Assertions` 進行靜態匯入。

```java
// 集合
assertThat(people).hasSize(2).extracting(Person::name).containsExactly("Ann", "Bob");
assertThat(people).extracting(Person::name, Person::age)
    .containsExactlyInAnyOrder(tuple("Bob", 25), tuple("Ann", 30));
assertThat(people).filteredOn(p -> p.age() > 26).singleElement();
assertThat(people).allSatisfy(p -> assertThat(p.age()).isPositive());
assertThat(Map.of("k", 1)).containsOnly(entry("k", 1));

// 物件圖（無 equals 的 record 與 POJO）
assertThat(actual).usingRecursiveComparison().isEqualTo(expected);

// 例外狀況
assertThatThrownBy(() -> Integer.parseInt("x"))
    .isInstanceOf(NumberFormatException.class)
    .hasMessageContaining("\"x\"");
assertThatExceptionOfType(IllegalStateException.class)
    .isThrownBy(() -> service.run())
    .withMessage("boom")
    .withCauseInstanceOf(RuntimeException.class);
assertThatCode(() -> parse("1")).doesNotThrowAnyException();

// optional
assertThat(Optional.of("x")).contains("x");
assertThat(Optional.empty()).isEmpty();
```

優先使用 `containsExactly`（順序重要）或 `containsExactlyInAnyOrder`，而非 `contains`（若有多餘元素仍會通過測試）。`extracting` 在失敗時提供易讀的差異比對。

### 軟斷言（報告所有失敗）

```java
SoftAssertions.assertSoftly(s -> {
    s.assertThat(result.status()).isEqualTo(200);
    s.assertThat(result.body()).contains("ok");
});
```

或使用 JUnit 擴充功能針對個別類別設定（內建於 `assertj-core`）：

```java
@ExtendWith(SoftAssertionsExtension.class)
class ResultTest {
    @InjectSoftAssertions SoftAssertions softly;   // org.assertj.core.api.junit.jupiter
    @Test void t() { softly.assertThat(1).isEqualTo(1); }
}
```

Jupiter 對應項：`assertAll(() -> ..., () -> ...)`。

撰寫本文時 AssertJ 4 僅處於里程碑版本；除非專案已使用 4，否則請保持在 3.x。

## Mockito

依賴項：`org.mockito:mockito-junit-jupiter`（會引入 `mockito-core`）。

```java
@ExtendWith(MockitoExtension.class)
class OrdersTest {
    @Mock Orders.Repo repo;
    @Mock Orders.Notifier notifier;
    @Captor ArgumentCaptor<String> message;

    @Test
    void place_should_saveAndNotify() {
        var orders = new Orders(repo, notifier, FIXED_CLOCK);   // 明確建構；優先於 @InjectMocks
        var result = orders.place("book");

        verify(repo).save(result);
        verify(notifier).send(message.capture());
        assertThat(message.getValue()).startsWith("placed book");
    }

    @Test
    void require_should_throw_when_missing() {
        when(repo.find(7L)).thenReturn(Optional.empty());
        ...
    }
}
```

- **嚴格性（Strictness）**：`MockitoExtension` 使用嚴格 stub。已驗證：從未使用的 stub 會導致測試失敗並擲出 `UnnecessaryStubbingException`。stub 方法上的引數不相符也會被報告（`PotentialStubbingProblem`）。個別類別/巢狀類別選擇退出方式：`@MockitoSettings(strictness = Strictness.LENIENT)`；個別 stub 方式：`lenient().when(...)`。
- **Stubbing**：`when(x.m()).thenReturn(v)`；針對 `void` 或要擲出例外狀況：`doThrow(...).when(x).m()`。優先回傳數值，而非驗證呼叫。
- **驗證（Verification）**：驗證屬於行為的副作用（已傳送訊息、已儲存實體）。使用 `verify(x, never()).m()` 代表「絕不能發生」。避免將 `verifyNoMoreInteractions` 作為預設設定；它會將測試與實作細節強烈偶合。
- **擷取器（Captor）**：`@Captor ArgumentCaptor<T>` 或 `ArgumentCaptor.forClass(T.class)`；對 `getValue()`/`getAllValues()` 進行斷言。
- **引數比對器（Argument matchers）**：若其中一個引數使用比對器（`any()`、`eq()`），則所有引數都必須使用比對器。
- **不要 mock**：record/值物件、集合、`String`、屬於簡單資料的自有型別、受測類別本身、`java.time.Clock`（請使用 `Clock.fixed`）。若測試必須 stub 多個呼叫，優先使用記憶體內假存放庫（in-memory fake repository），而非 mock。
- **僅在邊界處 mock 屬於自己的型別**；將第三方型別包裝在自己的介面中，並 mock 該介面。

### 內嵌 mock 製作器與 JDK 21+ agent 警告

Mockito 5 預設使用內嵌 mock 製作器（inline mock maker）。在沒有 agent 的 JDK 21+ 上，Mockito 會自我附加（self-attach），建構輸出會顯示：

```
Mockito is currently self-attaching to enable the inline-mock-maker. This will no longer work in future releases of the JDK. ...
WARNING: A Java agent has been loaded dynamically (.../byte-buddy-agent-....jar)
WARNING: Dynamic loading of agents will be disallowed by default in a future release
```

**僅適用於 Mockito 5.14.0+**：透過將 `mockito-core` 註冊為 agent 來修正（已驗證：在 JDK 21 上警告消失）。Agent 進入點是在 [Mockito 5.14.0](https://github.com/mockito/mockito/releases/tag/v5.14.0) 引進；較早的 5.x jar 缺少 `Premain-Class` manifest 項目，因此搭配 `-javaagent` 使用會導致測試 JVM 中止。

套用以下任一片段之前，請先檢查解析出的 `mockito-core` 版本（`./mvnw dependency:tree -Dincludes=org.mockito:mockito-core` 或 `./gradlew dependencyInsight --dependency mockito-core --configuration testRuntimeClasspath`）。保留專案的 BOM/版本目錄（version catalog）管理，並在升級前徵詢同意。若版本低於 5.14.0 且未核准升級，請勿使用這些片段；請遵循該版本記載的 instrumentation 設定。

Maven（`maven-dependency-plugin` 的 `properties` goal 會公開 `${org.mockito:mockito-core:jar}`；使用 JaCoCo 時保留 `@{argLine}`）：

```xml
<plugin>
  <artifactId>maven-dependency-plugin</artifactId>
  <executions>
    <execution><goals><goal>properties</goal></goals></execution>
  </executions>
</plugin>
<plugin>
  <artifactId>maven-surefire-plugin</artifactId>
  <configuration>
    <argLine>@{argLine} -javaagent:${org.mockito:mockito-core:jar}</argLine>
  </configuration>
</plugin>
```

（若無 JaCoCo，請移除 `@{argLine}`；若有字面值 `@{argLine}` 卻無 JaCoCo `prepare-agent`，Maven 將無法解析它且 JVM 會啟動失敗。）若整合測試使用 Mockito，請將相同的 `argLine` 新增至 Failsafe。

Gradle（Kotlin DSL）：

```kotlin
val mockitoAgent: Configuration by configurations.creating
dependencies {
    testImplementation("org.mockito:mockito-junit-jupiter:5.23.0")
    mockitoAgent("org.mockito:mockito-core:5.23.0") { isTransitive = false }
}
tasks.test { jvmArgs("-javaagent:${mockitoAgent.asPath}") }
```

保持兩個 Mockito 版本一致（或使用 BOM/版本目錄）。在 JDK 25 上，ByteBuddy 仍可能印出 `sun.misc.Unsafe` 的「terminally deprecated」警告；這是來自依賴項的無害雜訊（在 byte-buddy 1.18.3 中見過）。除非測試實際失敗，否則請勿使用 `--add-opens` 旗標來「修正」它。

## 參數化與巢狀測試

```java
@ParameterizedTest
@NullAndEmptySource
@ValueSource(strings = {" ", "\t"})
void rejectsBlank(String item) { ... }

@ParameterizedTest(name = "sign({0}) = {1}")
@CsvSource({"-5,-1", "0,0", "9,1"})
void sign(int in, int out) { ... }

@ParameterizedTest
@MethodSource("pairs")
void viaMethodSource(int in, int out) { ... }
static Stream<Arguments> pairs() { return Stream.of(Arguments.of(-2, -1), Arguments.of(2, 1)); }
```

`@Nested` 類別能檢視外部類別的 mock 與 `@BeforeEach`。Maven 會將每個巢狀類別回報為其自有的測試類別（`OrdersTest$Evens`），且外部類別可能會顯示 `Tests run: 0`；此屬正常現象，請檢查總數。
