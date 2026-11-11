# 上下文快取

透過上下文快取最佳化 Spring Boot 測試套件的效能。

## 上下文快取如何運作

Spring 的 TestContext Framework 根據應用程式上下文的組態「索引鍵」來快取上下文。具有相同組態的測試會重複使用相同的上下文。

### 影響快取索引鍵的因素

- @ContextConfiguration
- @TestPropertySource
- @ActiveProfiles
- @WebAppConfiguration
- @MockitoBean 定義
- @TestConfiguration 匯入

## 快取索引鍵範例

### 相同索引鍵（重複使用上下文）

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest1 {
  @MockitoBean private OrderService orderService;
}

@WebMvcTest(OrderController.class)
class OrderControllerTest2 {
  @MockitoBean private OrderService orderService;
}
// Same context reused
```

### 不同索引鍵（載入新上下文）

```java
@WebMvcTest(OrderController.class)
@ActiveProfiles("test")
class OrderControllerTest1 { }

@WebMvcTest(OrderController.class)
@ActiveProfiles("integration")
class OrderControllerTest2 { }
// Different contexts loaded
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

存取：`GET /actuator/metrics/spring.test.context.cache`

### 除錯記錄

```properties
logging.level.org.springframework.test.context.cache=DEBUG
```

## 最佳化快取命中率

### 按組態將測試分組

```
 tests/
   unit/           # No context
   web/            # @WebMvcTest
   repository/     # @DataJpaTest  
   integration/    # @SpringBootTest
```

### 盡量減少 @TestPropertySource 的變異

**不佳做法（多個上下文）：**

```java
@TestPropertySource(properties = "app.feature-x=true")
class FeatureXTest { }

@TestPropertySource(properties = "app.feature-y=true")
class FeatureYTest { }
```

**較佳做法（集中分組）：**

```java
@TestPropertySource(properties = {"app.feature-x=true", "app.feature-y=true"})
class FeaturesTest { }
```

### 謹慎使用 @DirtiesContext

僅在上下文狀態確實改變時使用：

```java
@Test
@DirtiesContext // Forces context rebuild after test
void testThatModifiesBeanDefinitions() { }
```

## 最佳做法

1. **按組態分組** - 將具有相同組態的測試放在一起
2. **限制屬性變異** - 偏好使用 profile 勝過個別屬性
3. **避免 @DirtiesContext** - 偏好清理測試資料
4. **使用狹窄切片** - @WebMvcTest 對比 @SpringBootTest
5. **監控快取命中** - 偶爾啟用除錯記錄
