# Context 快取 (Context Caching)

透過 Context 快取優化 Spring Boot 測試套件的效能。

## Context 快取的工作原理

Spring 的 TestContext 框架會根據應用程式 Context 的配置「鍵值」(key) 來快取它們。具有相同配置的測試會重用同一個 Context。

### 影響快取鍵值的因素

- @ContextConfiguration
- @TestPropertySource
- @ActiveProfiles
- @WebAppConfiguration
- @MockitoBean 定義
- @TestConfiguration 匯入

## 快取鍵值範例

### 相同鍵值 (重用 Context)

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest1 {
  @MockitoBean private OrderService orderService;
}

@WebMvcTest(OrderController.class)
class OrderControllerTest2 {
  @MockitoBean private OrderService orderService;
}
// 重用同一個 Context
```

### 不同鍵值 (載入新 Context)

```java
@WebMvcTest(OrderController.class)
@ActiveProfiles("test")
class OrderControllerTest1 { }

@WebMvcTest(OrderController.class)
@ActiveProfiles("integration")
class OrderControllerTest2 { }
// 載入不同的 Context
```

## 檢視快取統計資料

### Spring Boot Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: metrics
```

存取路徑：`GET /actuator/metrics/spring.test.context.cache`

### 偵錯記錄 (Debug Logging)

```properties
logging.level.org.springframework.test.context.cache=DEBUG
```

## 優化快取命中率

### 依配置將測試分組

```
 tests/
   unit/           # 無 Context
   web/            # @WebMvcTest
   repository/     # @DataJpaTest  
   integration/    # @SpringBootTest
```

### 減少 @TestPropertySource 的變動

**不佳 (產生多個 Context)：**

```java
@TestPropertySource(properties = "app.feature-x=true")
class FeatureXTest { }

@TestPropertySource(properties = "app.feature-y=true")
class FeatureYTest { }
```

**較佳 (分組)：**

```java
@TestPropertySource(properties = {"app.feature-x=true", "app.feature-y=true"})
class FeaturesTest { }
```

### 謹慎使用 @DirtiesContext

僅在 Context 狀態確實發生變化時使用：

```java
@Test
@DirtiesContext // 測試後強制重建 Context
void testThatModifiesBeanDefinitions() { }
```

## 最佳實務

1. **依配置分組** - 將具有相同配置的測試放在一起
2. **限制屬性變動** - 優先使用 Profiles 而非個別屬性
3. **避免使用 @DirtiesContext** - 優先考慮測試資料清理
4. **使用狹窄的切片 (Slices)** - @WebMvcTest vs @SpringBootTest
5. **監控快取命中情況** - 偶爾啟用偵錯記錄
