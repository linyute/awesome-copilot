---
description: '逐步指南，用於將 Spring Boot JPA 應用程式轉換為使用 Azure Cosmos DB 與 Spring Data Cosmos'
applyTo: '**/*.java,**/pom.xml,**/build.gradle,**/application*.properties'
---

# 將 Spring JPA 專案轉換為 Spring Data Cosmos

本通用指南適用於任何 JPA 到 Spring Data Cosmos DB 轉換專案。

## 高階計畫

1. 交換建置依賴項（移除 JPA，新增 Cosmos + Identity）。
2. 新增 `cosmos` 設定檔和屬性。
3. 新增 Cosmos 設定，並使用適當的 Azure 身分驗證。
4. 轉換實體（ID → `String`，新增 `@Container` 和 `@PartitionKey`，移除 JPA 映射，調整關聯）。
5. 轉換儲存庫（`JpaRepository` → `CosmosRepository`）。
6. **建立服務層**，用於關聯管理和範本相容性。
7. **關鍵**：更新所有測試檔案，使其與 String ID 和 Cosmos 儲存庫配合使用。
8. 透過 `CommandLineRunner` 植入資料。
9. **關鍵**：測試執行時功能並修復範本相容性問題。

## 逐步說明

### 步驟 1 — 建置依賴項

- **Maven** (`pom.xml`)：
  - 移除依賴項 `spring-boot-starter-data-jpa`
  - 移除資料庫特定依賴項（H2、MySQL、PostgreSQL），除非在其他地方需要
  - 新增 `com.azure:azure-spring-data-cosmos:5.17.0`（或最新相容版本）
  - 新增 `com.azure:azure-identity:1.15.4`（DefaultAzureCredential 所需）
- **Gradle**：為 Gradle 語法應用相同的依賴項變更
- 移除 testcontainers 和 JPA 特定測試依賴項

### 步驟 2 — 屬性和組態

- 建立 `src/main/resources/application-cosmos.properties`：
  ```properties
  azure.cosmos.uri=${COSMOS_URI:https://localhost:8081}
  azure.cosmos.database=${COSMOS_DATABASE:petclinic}
  azure.cosmos.populate-query-metrics=false
  azure.cosmos.enable-multiple-write-locations=false
  ```
- 更新 `src/main/resources/application.properties`：
  ```properties
  spring.profiles.active=cosmos
  ```

### 步驟 3 — 具有 Azure 身分識別的組態類別

- 建立 `src/main/java/<rootpkg>/config/CosmosConfiguration.java`：
  ```java
  @Configuration
  @EnableCosmosRepositories(basePackages = "<rootpkg>")
  public class CosmosConfiguration extends AbstractCosmosConfiguration {

    @Value("${azure.cosmos.uri}")
    private String uri;

    @Value("${azure.cosmos.database}")
    private String dbName;

    @Bean
    public CosmosClientBuilder getCosmosClientBuilder() {
      return new CosmosClientBuilder().endpoint(uri).credential(new DefaultAzureCredentialBuilder().build());
    }

    @Override
    protected String getDatabaseName() {
      return dbName;
    }

    @Bean
    public CosmosConfig cosmosConfig() {
      return CosmosConfig.builder().enableQueryMetrics(false).build();
    }
  }

  ```
- **重要**：生產環境安全性請使用 `DefaultAzureCredentialBuilder().build()` 而非基於金鑰的驗證

### 步驟 4 — 實體轉換

- 目標是所有帶有 JPA 註解的類別（`@Entity`、`@MappedSuperclass`、`@Embeddable`）
- **基本實體變更**：
  - 將 `id` 欄位類型從 `Integer` 變更為 `String`
  - 新增 `@Id` 和 `@GeneratedValue` 註解
  - 新增 `@PartitionKey` 欄位（通常是 `String partitionKey`）
  - 移除所有 `jakarta.persistence` 匯入
- **關鍵 — Cosmos DB 序列化要求**：
  - **從需要持久化到 Cosmos DB 的欄位中移除所有 `@JsonIgnore` 註解**
  - **驗證實體（User、Authority）必須完全可序列化** — 密碼、權限或其他持久化欄位上不得有 `@JsonIgnore`
  - **當您需要控制 JSON 欄位名稱但仍要持久化資料時，請使用 `@JsonProperty` 而非 `@JsonIgnore`**
  - **常見的驗證序列化錯誤**：`Cannot pass null or empty values to constructor` 通常表示 `@JsonIgnore` 正在阻止所需欄位的序列化
- **實體特定變更**：
  - 將 `@Entity` 替換為 `@Container(containerName = "<plural-entity-name>")`
  - 移除 `@Table`、`@Column`、`@JoinColumn` 等
  - 移除關聯註解（`@OneToMany`、`@ManyToOne`、`@ManyToMany`）
  - 對於關聯：
    - 為一對多嵌入集合（例如，Owner 中的 `List<Pet> pets`）
    - 為多對一使用參考 ID（例如，Pet 中的 `String ownerId`）
    - **對於複雜關聯**：儲存 ID 但為範本新增暫時屬性
  - 新增建構函式以設定分割區金鑰：`setPartitionKey("entityType")`
- **關鍵 — 驗證實體模式**：
  - **對於帶有 Spring Security 的 User 實體**：將權限儲存為 `Set<String>` 而非 `Set<Authority>` 物件
  - **範例 User 實體轉換**：
    ```java
    @Container(containerName = "users")
    public class User {

      @Id
      private String id;

      @PartitionKey
      private String partitionKey = "user";

      private String login;
      private String password; // NO @JsonIgnore - 必須可序列化

      @JsonProperty("authorities") // 使用 @JsonProperty，而非 @JsonIgnore
      private Set<String> authorities = new HashSet<>(); // 儲存為字串

      // 如果需要 Spring Security 相容性，新增暫時屬性
      // @JsonIgnore - 僅用於不持久化到 Cosmos 的暫時屬性
      private Set<Authority> authorityObjects = new HashSet<>();

      // 字串權限和 Authority 物件之間的轉換方法
      public void setAuthorityObjects(Set<Authority> authorities) {
        this.authorityObjects = authorities;
        this.authorities = authorities.stream().map(Authority::getName).collect(Collectors.toSet());
      }
    }

    ```
- **關鍵 — 關聯變更的範本相容性**：
  - **將關聯轉換為 ID 參考時，保留範本存取**
  - **範例**：如果實體有 `List<Specialty> specialties` → 轉換為：
    - 儲存：`List<String> specialtyIds`（持久化到 Cosmos）
    - 範本：`@JsonIgnore private List<Specialty> specialties = new ArrayList<>()`（暫時）
    - 為兩個屬性新增 getter/setter
  - **更新實體方法邏輯**：`getNrOfSpecialties()` 應使用暫時清單
- **關鍵 — Thymeleaf/JSP 應用程式的範本相容性**：
  - **識別範本屬性存取**：在 `.html` 檔案中搜尋 `${entity.relationshipProperty}`
  - **對於範本中存取的每個關聯屬性**：
    - **儲存**：保留基於 ID 的儲存（例如，`List<String> specialtyIds`）
    - **範本存取**：新增帶有 `@JsonIgnore` 的暫時屬性（例如，`private List<Specialty> specialties = new ArrayList<>()`）
    - **範例**：

      ```java
      // 儲存在 Cosmos 中（持久化）
      private List<String> specialtyIds = new ArrayList<>();

      // 用於範本存取（暫時）
      @JsonIgnore
      private List<Specialty> specialties = new ArrayList<>();

      // 兩個屬性的 getter/setter
      public List<String> getSpecialtyIds() {
        return specialtyIds;
      }

      public List<Specialty> getSpecialties() {
        return specialties;
      }

      ```

    - **更新計數方法**：`getNrOfSpecialties()` 應使用暫時清單，而非 ID 清單
- **關鍵 — 方法簽章衝突**：
  - **將 ID 類型從 Integer 轉換為 String 時，檢查方法簽章衝突**
  - **常見衝突**：`getPet(String name)` 與 `getPet(String id)` — 兩者具有相同的簽章
  - **解決方案**：重新命名方法以使其更具體：
    - `getPet(String id)` 用於基於 ID 的查詢
    - `getPetByName(String name)` 用於基於名稱的查詢
    - `getPetByName(String name, boolean ignoreNew)` 用於條件式基於名稱的查詢
  - **更新控制器和測試中所有重新命名方法的呼叫者**
- **實體的方法更新**：
  - 將 `addVisit(Integer petId, Visit visit)` 更新為 `addVisit(String petId, Visit visit)`
  - 確保所有 ID 比較邏輯都使用 `.equals()` 而非 `==`

### 步驟 5 — 儲存庫轉換

- 變更所有儲存庫介面：
  - 從：`extends JpaRepository<Entity, Integer>`
  - 到：`extends CosmosRepository<Entity, String>`
- **查詢方法更新**：
  - 從自訂查詢中移除分頁參數
  - 將 `Page<Entity> findByX(String param, Pageable pageable)` 變更為 `List<Entity> findByX(String param)`
  - 更新 `@Query` 註解以使用 Cosmos SQL 語法
  - **替換自訂方法名稱**：`findPetTypes()` → `findAllOrderByName()`
  - **更新控制器和格式器中所有對變更方法名稱的參考**

### 步驟 6 — **建立服務層**，用於關聯管理和範本相容性

- **關鍵**：建立服務類別以橋接 Cosmos 文件儲存與現有範本預期
- **目的**：處理關聯填充並維護範本相容性
- **每個具有關聯的實體的服務模式**：
  ```java
  @Service
  public class EntityService {

    private final EntityRepository entityRepository;
    private final RelatedRepository relatedRepository;

    public EntityService(EntityRepository entityRepository, RelatedRepository relatedRepository) {
      this.entityRepository = entityRepository;
      this.relatedRepository = relatedRepository;
    }

    public List<Entity> findAll() {
      List<Entity> entities = entityRepository.findAll();
      entities.forEach(this::populateRelationships);
      return entities;
    }

    public Optional<Entity> findById(String id) {
      Optional<Entity> entityOpt = entityRepository.findById(id);
      if (entityOpt.isPresent()) {
        Entity entity = entityOpt.get();
        populateRelationships(entity);
        return Optional.of(entity);
      }
      return Optional.empty();
    }

    private void populateRelationships(Entity entity) {
      if (entity.getRelatedIds() != null && !entity.getRelatedIds().isEmpty()) {
        List<Related> related = entity
          .getRelatedIds()
          .stream()
          .map(relatedRepository::findById)
          .filter(Optional::isPresent)
          .map(Optional::get)
          .collect(Collectors.toList());
        // 為範本存取設定暫時屬性
        entity.setRelated(related);
      }
    }
  }

  ```

### 步驟 6.5 — **Spring Security 整合**（驗證的關鍵）

- **UserDetailsService 整合模式**：
  ```java
  @Service
  @Transactional
  public class DomainUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AuthorityRepository authorityRepository;

    @Override
    public UserDetails loadUserByUsername(String login) {
      log.debug("Authenticating user: {}", login);

      return userRepository
        .findOneByLogin(login)
        .map(user -> createSpringSecurityUser(login, user))
        .orElseThrow(() -> new UsernameNotFoundException("User " + login + " was not found"));
    }

    private org.springframework.security.core.userdetails.User createSpringSecurityUser(String lowercaseLogin, User user) {
      if (!user.isActivated()) {
        throw new UserNotActivatedException("User " + lowercaseLogin + " was not activated");
      }

      // 將字串權限轉換回 GrantedAuthority 物件
      List<GrantedAuthority> grantedAuthorities = user
        .getAuthorities()
        .stream()
        .map(SimpleGrantedAuthority::new)
        .collect(Collectors.toList());

      return new org.springframework.security.core.userdetails.User(user.getLogin(), user.getPassword(), grantedAuthorities);
    }
  }

  ```
- **主要驗證要求**：
  - User 實體必須完全可序列化（密碼/權限上不得有 `@JsonIgnore`）
  - 為 Cosmos DB 相容性將權限儲存為 `Set<String>`
  - 在 UserDetailsService 中，在字串權限和 `GrantedAuthority` 物件之間進行轉換
  - 新增全面的偵錯日誌以追蹤驗證流程
  - 適當地處理已啟用/已停用使用者狀態

#### **範本關聯填充模式**

每個為範本渲染返回實體的服務方法都必須填充暫時屬性：

```java
private void populateRelationships(Entity entity) {
  // 對於範本中使用的每個關聯
  if (entity.getRelatedIds() != null && !entity.getRelatedIds().isEmpty()) {
    List<Related> relatedObjects = entity
      .getRelatedIds()
      .stream()
      .map(relatedRepository::findById)
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());
    entity.setRelated(relatedObjects); // 設定暫時屬性
  }
}

```

#### **控制器中的關鍵服務使用**

- **將所有直接儲存庫呼叫替換為控制器中的服務呼叫**
- **切勿將實體直接從儲存庫返回到範本，而不進行關聯填充**
- **更新控制器**以使用服務層而非直接儲存庫
- **控制器模式變更**：

  ```java
  // 舊：直接儲存庫使用
  @Autowired
  private EntityRepository entityRepository;

  // 新：服務層使用
  @Autowired
  private EntityService entityService;
  // 更新方法呼叫
  // 舊：entityRepository.findAll()
  // 新：entityService.findAll()

  ```

### 步驟 7 — 資料植入

- 建立實作 `CommandLineRunner` 的 `@Component`：
  ```java
  @Component
  public class DataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
      if (ownerRepository.count() > 0) {
        return; // 資料已存在
      }
      // 植入帶有 String ID 的綜合測試資料
      // 使用有意義的 ID 模式："owner-1"、"pet-1"、"pettype-1" 等
    }
  }

  ```
- **關鍵 — JDK 17+ 的 BigDecimal 反射問題**：
  - **如果使用 BigDecimal 欄位**，您可能會在植入期間遇到反射錯誤
  - **錯誤模式**：`Unable to make field private final java.math.BigInteger java.math.BigDecimal.intVal accessible`
  - **解決方案**：
    1.  使用 `Double` 或 `String` 而非 `BigDecimal` 作為貨幣值
    2.  新增 JVM 參數：`--add-opens java.base/java.math=ALL-UNNAMED`
    3.  將 BigDecimal 操作包裝在 try-catch 中並妥善處理
  - **即使植入失敗，應用程式也會成功啟動** — 檢查日誌以查找植入錯誤

### 步驟 8 — 測試檔案轉換（關鍵部分）

**此步驟經常被忽略，但對於成功轉換至關重要**

#### A. **編譯檢查策略**

- **每次重大變更後，執行 `mvn test-compile` 以盡早發現問題**
- **在繼續之前，系統地修復編譯錯誤**
- **不要依賴 IDE — Maven 編譯會揭示所有問題**

#### B. **系統地搜尋並更新所有測試檔案**

**使用搜尋工具查找並更新每個出現的內容：**

- 搜尋：`int.*TEST.*ID` → 替換為：`String.*TEST.*ID = "test-xyz-1"`
- 搜尋：`setId\(\d+\)` → 替換為：`setId("test-id-X")`
- 搜尋：`findById\(\d+\)` → 替換為：`findById("test-id-X")`
- 搜尋：`\.findPetTypes\(\)` → 替換為：`.findAllOrderByName()`
- 搜尋：`\.findByLastNameStartingWith\(.*,.*Pageable` → 移除分頁參數

#### C. 更新測試註解和匯入

- 將 `@DataJpaTest` 替換為 `@SpringBootTest` 或適當的切片測試
- 移除 `@AutoConfigureTestDatabase` 註解
- 從測試中移除 `@Transactional`（除非是單一分割區操作）
- 移除 `org.springframework.orm` 套件的匯入

#### D. 修復所有測試檔案中的實體 ID 使用

**必須更新的關鍵檔案（搜尋整個測試目錄）：**

- `*ControllerTests.java` — 路徑變數、實體建立、模擬設定
- `*ServiceTests.java` — 儲存庫互動、實體 ID
- `EntityUtils.java` — ID 處理的公用方法
- `*FormatterTests.java` — 儲存庫方法呼叫
- `*ValidatorTests.java` — 使用 String ID 建立實體
- 整合測試類別 — 測試資料設定

#### E. **修復受儲存庫變更影響的控制器和服務類別**

- **更新呼叫儲存庫方法且簽章已變更的控制器**
- **更新使用儲存庫方法的格式器/轉換器**
- **要檢查的常見檔案**：
  - `PetTypeFormatter.java` — 通常呼叫 `findPetTypes()` 方法
  - `*Controller.java` — 可能有要移除的分頁邏輯
  - 使用儲存庫方法的服務類別

#### F. 更新測試中的儲存庫模擬

- 從儲存庫模擬中移除分頁：
  - `given(repository.findByX(param, pageable)).willReturn(pageResult)`
  - → `given(repository.findByX(param)).willReturn(listResult)`
- 更新模擬中的方法名稱：
  - `given(petTypeRepository.findPetTypes()).willReturn(types)`
  - → `given(petTypeRepository.findAllOrderByName()).willReturn(types)`

#### G. 修復測試使用的公用程式類別

- 更新 `EntityUtils.java` 或類似檔案：
  - 移除 JPA 特定例外匯入（`ObjectRetrievalFailureException`）
  - 將方法簽章從 `int id` 變更為 `String id`
  - 更新 ID 比較邏輯：`entity.getId() == entityId` → `entity.getId().equals(entityId)`
  - 將 JPA 例外替換為標準例外（`IllegalArgumentException`）

#### H. 更新 String ID 的斷言

- 變更 ID 斷言：
  - `assertThat(entity.getId()).isNotZero()` → `assertThat(entity.getId()).isNotEmpty()`
  - `assertThat(entity.getId()).isEqualTo(1)` → `assertThat(entity.getId()).isEqualTo("test-id-1")`
  - JSON 路徑斷言：`jsonPath("$.id").value(1)` → `jsonPath("$.id").value("test-id-1")`

### 步驟 9 — **執行時測試和範本相容性**

**關鍵**：編譯成功後測試正在執行的應用程式

- **啟動應用程式**：`mvn spring-boot:run`
- **瀏覽網頁介面中的所有頁面**以識別執行時錯誤
- **轉換後常見的執行時問題**：
  - 範本嘗試存取不再存在的屬性（例如，`vet.specialties`）
  - 服務層未填充暫時關聯屬性
  - 控制器未使用服務層進行關聯載入

#### **範本相容性修復**：

- **如果範本存取關聯屬性**（例如，`entity.relatedObjects`）：
  - 確保實體上存在帶有適當 getter/setter 的暫時屬性
  - 驗證服務層填充這些暫時屬性
  - 更新 `getNrOfXXX()` 方法以使用暫時清單而非 ID 清單
- **檢查日誌中的 SpEL (Spring Expression Language) 錯誤**：
  - `Property or field 'xxx' cannot be found` → 新增缺少的暫時屬性
  - `EL1008E` 錯誤 → 服務層未填充關聯

#### **服務層驗證**：

- **確保所有控制器都使用服務層**而非直接儲存庫存取
- **驗證服務方法在返回實體之前填充關聯**
- **透過網頁介面測試所有 CRUD 操作**

### 步驟 9.5 — **範本執行時驗證**（關鍵）

#### **系統化範本測試流程**

成功編譯和應用程式啟動後：

1. **系統地瀏覽應用程式中的每個頁面**
2. **測試每個顯示實體資料的範本**：
   - 清單頁面（例如，`/vets`、`/owners`）
   - 詳細資訊頁面（例如，`/owners/{id}`、`/vets/{id}`）
   - 表單和編輯頁面
3. **尋找特定的範本錯誤**：
   - `Property or field 'relationshipName' cannot be found on object of type 'EntityName'`
   - `EL1008E` Spring Expression Language 錯誤
   - 關聯應出現的地方資料為空或缺失

#### **範本錯誤解決檢查清單**

遇到範本錯誤時：

- [ ] **從錯誤訊息中識別缺少的屬性**
- [ ] **檢查實體中是否存在作為暫時欄位的屬性**
- [ ] **驗證服務層在返回實體之前填充該屬性**
- [ ] **確保控制器使用服務層**，而非直接儲存庫存取
- [ ] **修復後再次測試特定頁面**

#### **常見範本錯誤模式**

- `Property or field 'specialties' cannot be found` → 在 Vet 實體中新增 `@JsonIgnore private List<Specialty> specialties`
- `Property or field 'pets' cannot be found` → 在 Owner 實體中新增 `@JsonIgnore private List<Pet> pets`
- 顯示空的關聯資料 → 服務未填充暫時屬性

### 步驟 10 — **系統化錯誤解決流程**

#### 編譯失敗時：

1. **首先執行 `mvn compile`** — 先修復主要原始碼問題
2. **然後執行 `mvn test-compile`** — 系統地修復每個測試編譯錯誤
3. **專注於最常見的錯誤模式**：
   - `int cannot be converted to String` → 變更測試常數和實體 setter
   - `method X cannot be applied to given types` → 移除分頁參數
   - `cannot find symbol: method Y()` → 更新為新的儲存庫方法名稱
   - 方法簽章衝突 → 重新命名衝突的方法

#### 執行時失敗時：

1. **檢查應用程式日誌**以查找特定錯誤訊息
2. **尋找範本/SpEL 錯誤**：
   - `Property or field 'xxx' cannot be found` → 新增暫時屬性到實體
   - 缺少關聯資料 → 服務層未填充關聯
3. **驗證服務層是否正在使用**
4. **測試瀏覽所有應用程式頁面**

#### 常見錯誤模式和解決方案：

- **`method findByLastNameStartingWith cannot be applied`** → 移除 `Pageable` 參數
- **`cannot find symbol: method findPetTypes()`** → 變更為 `findAllOrderByName()`
- **`incompatible types: int cannot be converted to String`** → 更新測試 ID 常數
- **`method getPet(String) is already defined`** → 重新命名一個方法（例如，`getPetByName`）
- **`cannot find symbol: method isNotZero()`** → 變更為 `isNotEmpty()` 用於 String ID
- **`Property or field 'specialties' cannot be found`** → 新增暫時屬性並在服務中填充
- **`ClassCastException: reactor.core.publisher.BlockingIterable cannot be cast to java.util.List`** → 修復儲存庫 `findAllWithEagerRelationships()` 方法以使用 StreamSupport
- **`Unable to make field...BigDecimal.intVal accessible`** → 在整個應用程式中將 BigDecimal 替換為 Double
- **健康檢查資料庫失敗** → 從健康檢查就緒組態中移除「db」

#### **範本特定執行時錯誤**

- **`Property or field 'XXX' cannot be found on object of type 'YYY'`**：

  - 根本原因：範本存取已轉換為 ID 儲存的關聯屬性
  - 解決方案：新增暫時屬性到實體 + 在服務層中填充
  - 預防：在轉換關聯之前，務必檢查範本使用情況

- **`EL1008E` Spring Expression Language 錯誤**：

  - 根本原因：服務層未填充暫時屬性
  - 解決方案：驗證 `populateRelationships()` 方法是否被呼叫並正常工作
  - 預防：在服務層實作後測試所有範本導航

- **範本中空的/null 關聯資料**：
  - 根本原因：控制器繞過服務層或服務未填充關聯
  - 解決方案：確保所有控制器方法都使用服務層進行實體檢索
  - 預防：切勿將儲存庫結果直接返回到範本

### 步驟 11 — 驗證檢查清單

轉換後，驗證：

- [ ] **主應用程式編譯成功**：`mvn compile` 成功
- [ ] **所有測試檔案編譯成功**：`mvn test-compile` 成功
- [ ] **沒有編譯錯誤**：解決每個編譯錯誤
- [ ] **應用程式成功啟動**：`mvn spring-boot:run` 沒有錯誤
- [ ] **所有網頁載入成功**：瀏覽所有應用程式頁面沒有執行時錯誤
- [ ] **服務層填充關聯**：暫時屬性設定正確
- [ ] **所有範本頁面渲染沒有錯誤**：瀏覽整個應用程式
- [ ] **關聯資料顯示正確**：清單、計數和相關物件顯示正確
- [ ] **日誌中沒有 SpEL 範本錯誤**：在導航期間檢查應用程式日誌
- [ ] **暫時屬性帶有 @JsonIgnore 註解**：防止 JSON 序列化問題
- [ ] **服務層一致使用**：控制器中沒有直接儲存庫存取用於範本渲染
- [ ] 沒有剩餘的 `jakarta.persistence` 匯入
- [ ] 所有實體 ID 都是一致的 `String` 類型
- [ ] 所有儲存庫介面都擴展 `CosmosRepository<Entity, String>`
- [ ] 組態使用 `DefaultAzureCredential` 進行驗證
- [ ] 資料植入組件存在並正常工作
- [ ] 測試檔案一致使用 String ID
- [ ] 儲存庫模擬已更新為 Cosmos 方法
- [ ] 實體類別中**沒有方法簽章衝突**
- [ ] 呼叫者（控制器、測試、格式器）中**所有重新命名的方法都已更新**

### 要避免的常見陷阱

1. **不經常檢查編譯** — 每次重大變更後執行 `mvn test-compile`
2. **方法簽章衝突** — 轉換 ID 類型時的方法重載問題
3. **忘記更新方法呼叫者** — 重新命名方法時，更新所有呼叫者
4. **缺少儲存庫方法重新命名** — 自訂儲存庫方法必須在所有呼叫處更新
5. **使用基於金鑰的驗證** — 改用 `DefaultAzureCredential`
6. **混合 Integer 和 String ID** — 在所有地方，尤其是在測試中，與 String ID 保持一致
7. **未更新控制器分頁邏輯** — 當儲存庫變更時，從控制器中移除分頁
8. **保留 JPA 特定測試註解** — 替換為 Cosmos 相容的替代方案
9. **不完整的測試檔案更新** — 搜尋整個測試目錄，而不僅僅是明顯的檔案
10. **跳過執行時測試** — 始終測試正在執行的應用程式，而不僅僅是編譯
11. **缺少服務層** — 不要直接從控制器存取儲存庫
12. **忘記暫時屬性** — 範本可能需要存取關聯資料
13. **未測試範本導航** — 編譯成功不代表範本正常工作
14. **缺少範本的暫時屬性** — 範本需要物件存取，而不僅僅是 ID
15. **服務層繞過** — 控制器必須使用服務，切勿直接存取儲存庫
16. **不完整的關聯填充** — 服務方法必須填充範本使用的所有暫時屬性
17. **忘記在暫時屬性上使用 @JsonIgnore** — 防止序列化問題
18. **在持久化欄位上使用 @JsonIgnore** — **關鍵**：切勿在需要儲存在 Cosmos DB 中的欄位上使用 `@JsonIgnore`
19. **驗證序列化錯誤** — User/Authority 實體必須完全可序列化，且 `@JsonIgnore` 不得阻止所需欄位
20. **BigDecimal 反射問題** — 對於 JDK 17+ 相容性，使用替代資料類型或 JVM 參數
21. **儲存庫反應式類型轉換** — 不要將 `findAll()` 直接轉換為 `List`，請使用 `StreamSupport.stream().collect(Collectors.toList())`
22. **健康檢查資料庫參考** — 移除 JPA 後，從 Spring Boot 健康檢查中移除資料庫依賴項
23. **集合類型不匹配** — 更新服務方法以處理 String 與物件集合的一致性

### 系統地偵錯編譯問題

如果轉換後編譯失敗：

1. **從主要編譯開始**：`mvn compile` — 首先修復實體和控制器問題
2. **然後測試編譯**：`mvn test-compile` — 系統地修復每個錯誤
3. **檢查程式碼庫中剩餘的 `jakarta.persistence` 匯入**
4. **驗證所有測試常數都使用 String ID** — 搜尋 `int.*TEST.*ID`
5. **確保儲存庫方法簽章與新的 Cosmos 介面匹配**
6. **檢查實體關聯和測試中混合的 Integer/String ID 使用**
7. **驗證所有模擬都使用正確的方法名稱**（`findAllOrderByName()` 而非 `findPetTypes()`）
8. **尋找方法簽章衝突** — 透過重新命名衝突的方法來解決
9. **驗證斷言方法與 String ID 配合使用**（`isNotEmpty()` 而非 `isNotZero()`）

### 系統地偵錯執行時問題

如果成功編譯後執行時失敗：

1. **檢查應用程式啟動日誌**以查找初始化錯誤
2. **瀏覽所有頁面**以識別範本/控制器問題
3. **在日誌中尋找 SpEL 範本錯誤**：
   - `Property or field 'xxx' cannot be found` → 缺少暫時屬性
   - `EL1008E` → 服務層未填充關聯
4. **驗證服務層是否正在使用**，而不是直接儲存庫存取
5. **檢查暫時屬性是否在服務方法中填充**
6. **透過網頁介面測試所有 CRUD 操作**
7. **驗證資料植入是否正常工作**且關聯是否維護
8. **驗證特定偵錯**：
   - `Cannot pass null or empty values to constructor` → 檢查所需欄位上的 `@JsonIgnore`
   - `BadCredentialsException` → 驗證 User 實體序列化和密碼欄位可存取性
   - 檢查日誌中是否有「DomainUserDetailsService」偵錯輸出以追蹤驗證流程

### **成功秘訣**

- **盡早且經常編譯** — 不要讓錯誤累積
- **使用全域搜尋和替換** — 查找所有模式出現並更新
- **系統化** — 在處理下一個錯誤之前，先修復所有檔案中的一種錯誤
- **仔細測試方法重新命名** — 確保所有呼叫者都已更新
- **使用有意義的 String ID** — 「owner-1」、「pet-1」而非隨機字串
- **檢查控制器類別** — 它們通常呼叫會變更簽章的儲存庫方法
- **始終測試執行時** — 編譯成功不保證範本功能正常
- **服務層至關重要** — 文件儲存和範本預期之間的橋樑

### **驗證疑難排解指南**（關鍵）

#### **常見驗證序列化錯誤**：

1. **`Cannot pass null or empty values to constructor`**：

   - **根本原因**：`@JsonIgnore` 阻止所需欄位序列化到 Cosmos DB
   - **解決方案**：從所有持久化欄位（密碼、權限等）中移除 `@JsonIgnore`
   - **驗證**：檢查 User 實體在儲存欄位上沒有 `@JsonIgnore`

2. **登入期間的 `BadCredentialsException`**：

   - **根本原因**：驗證期間密碼欄位無法存取
   - **解決方案**：確保密碼欄位在 UserDetailsService 中可序列化且可存取
   - **驗證**：在 `loadUserByUsername` 方法中新增偵錯日誌

3. **權限載入不正確**：

   - **根本原因**：權限物件儲存為複雜實體而非字串
   - **解決方案**：將權限儲存為 `Set<String>` 並在 UserDetailsService 中轉換為 `GrantedAuthority`
   - **模式**：

     ```java
     // 在 User 實體中 — 儲存在 Cosmos 中
     @JsonProperty("authorities")
     private Set<String> authorities = new HashSet<>();

     // 在 UserDetailsService 中 — 為 Spring Security 轉換
     List<GrantedAuthority> grantedAuthorities = user
       .getAuthorities()
       .stream()
       .map(SimpleGrantedAuthority::new)
       .collect(Collectors.toList());

     ```

4. **驗證期間找不到 User 實體**：
   - **根本原因**：儲存庫查詢方法無法與 String ID 配合使用
   - **解決方案**：更新儲存庫 `findOneByLogin` 方法以與 Cosmos DB 配合使用
   - **驗證**：獨立測試儲存庫方法

#### **驗證偵錯檢查清單**：

- [ ] User 實體完全可序列化（持久化欄位上沒有 `@JsonIgnore`）
- [ ] 密碼欄位可存取且不為 null
- [ ] 權限儲存為 `Set<String>`
- [ ] UserDetailsService 將字串權限轉換為 `GrantedAuthority`
- [ ] 儲存庫方法與 String ID 配合使用
- [ ] 驗證服務中啟用偵錯日誌
- [ ] 適當地檢查使用者啟用狀態
- [ ] 使用已知憑證（admin/admin）測試登入

### **常見執行時問題和解決方案**

#### **問題 1：儲存庫反應式類型轉換錯誤**

**錯誤**：`ClassCastException: reactor.core.publisher.BlockingIterable cannot be cast to java.util.List`

**根本原因**：Cosmos 儲存庫返回反應式類型（`Iterable`），但舊版 JPA 程式碼預期 `List`

**解決方案**：在儲存庫方法中正確轉換反應式類型：

```java
// 錯誤 — 直接轉換失敗
default List<Entity> customFindMethod() {
    return (List<Entity>) this.findAll(); // ClassCastException!
}

// 正確 — 將 Iterable 轉換為 List
default List<Entity> customFindMethod() {
    return StreamSupport.stream(this.findAll().spliterator(), false)
            .collect(Collectors.toList());
}
```

**要檢查的檔案**：

- 所有帶有自訂預設方法的儲存庫介面
- 從 Cosmos 儲存庫呼叫返回 `List<Entity>` 的任何方法
- 匯入 `java.util.stream.StreamSupport` 和 `java.util.stream.Collectors`

#### **問題 2：Java 17+ 中的 BigDecimal 反射問題**

**錯誤**：`Unable to make field private final java.math.BigInteger java.math.BigDecimal.intVal accessible`

**根本原因**：Java 17+ 模組系統限制了序列化期間對 BigDecimal 內部欄位的反射存取

**解決方案**：

1. **對於簡單情況，替換為 Double**：

   ```java
   // 之前：BigDecimal 欄位
   private BigDecimal amount;

   // 之後：Double 欄位（如果精度要求允許）
   private Double amount;

   ```

2. **對於高精度要求，使用 String**：

   ```java
   // 儲存為 String，並在需要時轉換
   private String amount; // 儲存 "1500.00"

   public BigDecimal getAmountAsBigDecimal() {
     return new BigDecimal(amount);
   }

  ```

3. **新增 JVM 參數**（如果必須保留 BigDecimal）：
   ```
   --add-opens java.base/java.math=ALL-UNNAMED
   ```

#### **問題 3：健康檢查資料庫依賴項**

**錯誤**：應用程式健康檢查失敗，尋找已移除的資料庫組件

**根本原因**：移除 JPA/資料庫依賴項後，Spring Boot 健康檢查仍引用它們

**解決方案**：更新健康檢查組態：

```yaml
# 在 application.yml 中 — 從健康檢查中移除資料庫
management:
  health:
    readiness:
      include: 'ping,diskSpace' # 如果存在，移除 'db'
```

**要檢查的檔案**：

- 所有 `application*.yml` 組態檔案
- 移除任何資料庫特定的健康指標
- 檢查執行器端點組態

#### **問題 4：服務中的集合類型不匹配**

**錯誤**：將實體關聯轉換為基於 String 的儲存時的類型不匹配錯誤

**根本原因**：實體轉換後，服務方法預期不同的集合類型

**解決方案**：更新服務方法以處理新的實體結構：

```java
// 之前：實體關聯
public Set<RelatedEntity> getRelatedEntities() {
    return entity.getRelatedEntities(); // 直接實體參考
}

// 之後：基於 String 的關聯與轉換
public Set<RelatedEntity> getRelatedEntities() {
    return entity.getRelatedEntityIds()
        .stream()
        .map(relatedRepository::findById)
        .filter(Optional::isPresent)
        .map(Optional::get)
        .collect(Collectors.toSet());
}
```

### **增強的錯誤解決流程**

#### **常見錯誤模式和解決方案**：

1. **反應式類型轉換錯誤**：
   - **模式**：`cannot be cast to java.util.List`
   - **修復**：使用 `StreamSupport.stream().collect(Collectors.toList())`
   - **檔案**：帶有自訂預設方法的儲存庫介面

2. **BigDecimal 序列化錯誤**：
   - **模式**：`Unable to make field...BigDecimal.intVal accessible`
   - **修復**：替換為 Double、String，或新增 JVM 模組開啟
   - **檔案**：實體類別、DTO、資料初始化類別

3. **健康檢查資料庫錯誤**：
   - **模式**：健康檢查失敗，尋找資料庫
   - **修復**：從健康檢查組態中移除資料庫參考
   - **檔案**：application.yml 組態檔案

4. **集合類型轉換錯誤**：
   - **模式**：實體關聯處理中的類型不匹配
   - **修復**：更新服務方法以處理基於 String 的實體參考
   - **檔案**：服務類別、DTO、實體關聯方法

#### **增強的驗證檢查清單**：
- [ ] **儲存庫反應式轉換已處理**：集合返回沒有 ClassCastException
- [ ] **BigDecimal 相容性已解決**：Java 17+ 序列化正常工作
- [ ] **健康檢查已更新**：健康組態中沒有資料庫依賴項
- [ ] **服務層集合處理**：基於 String 的實體參考正常工作
- [ ] **資料植入完成**：日誌中出現「Data seeding completed」訊息
- [ ] **應用程式完全啟動**：前端和後端都可存取
- [ ] **驗證正常工作**：可以登入而沒有序列化錯誤
- [ ] **CRUD 操作功能正常**：所有實體操作都透過 UI 正常工作

## **快速參考：常見遷移後修復**

### **要檢查的頂級執行時問題**

1. **儲存庫集合轉換**：
   ```java
   // 修復任何返回集合的儲存庫方法：
   default List<Entity> customFindMethod() {
       return StreamSupport.stream(this.findAll().spliterator(), false)
               .collect(Collectors.toList());
   }
   
   ```

2. **BigDecimal 相容性 (Java 17+)**：

   ```java
   // 將 BigDecimal 欄位替換為替代方案：
   private Double amount; // 或 String 用於高精度

   ```

3. **健康檢查組態**：
   ```yaml
   # 從健康檢查中移除資料庫依賴項：
   management:
     health:
       readiness:
         include: 'ping,diskSpace'
   ```

### **驗證轉換模式**

- **從需要 Cosmos DB 持久化的欄位中移除 `@JsonIgnore`**
- **將複雜物件儲存為簡單類型**（例如，權限作為 `Set<String>`）
- **在服務/儲存庫層中，在簡單類型和複雜類型之間進行轉換**

### **範本/UI 相容性模式**

- **新增帶有 `@JsonIgnore` 的暫時屬性**，用於 UI 存取相關資料
- **使用服務層**在渲染之前填充暫時關聯
- **切勿將儲存庫結果直接返回到範本**，而不進行關聯填充
