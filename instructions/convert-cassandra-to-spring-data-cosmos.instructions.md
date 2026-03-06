--- 
description: '將 Spring Boot Cassandra 應用程式轉換為使用 Spring Data Cosmos 的 Azure Cosmos DB 的逐步指南'
applyTo: '**/*.java,**/pom.xml,**/build.gradle,**/application*.properties,**/application*.yml,**/application*.conf'
---

# 綜合指南：將 Spring Boot Cassandra 應用程式轉換為使用 Spring Data Cosmos (spring-data-cosmos) 的 Azure Cosmos DB

## 適用性

本指南適用於：
- ✅ Spring Boot 2.x - 3.x 應用程式 (反應式與非反應式)
- ✅ Maven 與 Gradle 專案
- ✅ 使用 Spring Data Cassandra、Cassandra DAO 或 DataStax 驅動程式的應用程式
- ✅ 有或沒有 Lombok 的專案
- ✅ 基於 UUID 或字串的實體識別碼
- ✅ 同步與反應式 (Spring WebFlux) 應用程式

本指南不涵蓋：
- ❌ 非 Spring 框架 (Jakarta EE, Micronaut, Quarkus, 純 Java)
- ❌ 複雜的 Cassandra 功能 (實體化檢視表、UDT、計數器、自訂類型)
- ❌ 大量資料移轉 (僅限程式碼轉換 - 資料必須單獨移轉)
- ❌ Cassandra 特定功能，例如輕量級交易 (LWT) 或跨分割區的批次呼叫

## 概述

本指南提供逐步指示，說明如何將反應式 Spring Boot 應用程式從 Apache Cassandra 轉換為使用 Spring Data Cosmos 的 Azure Cosmos DB。它涵蓋了所有遇到的主要問題及其解決方案，基於實際的轉換經驗。

## 先決條件

- Java 11 或更高版本 (Spring Boot 3.x 需要 Java 17+ )
- 已安裝 Azure CLI 並經過身份驗證 (`az login`) 以進行本機開發
- 在 Azure 入口網站中建立 Azure Cosmos DB 帳戶
- Maven 3.6+ 或 Gradle 6+ (取決於您的專案)
- 對於 Spring Boot 3.x 的 Gradle 專案：確保 JAVA_HOME 環境變數指向 Java 17+
- 對於應用程式資料模型與查詢模式的基本理解

## Azure Cosmos DB 的資料庫設定

**重要事項**：在執行應用程式之前，請確保資料庫存在於您的 Cosmos DB 帳戶中。

### 選項 1：手動建立資料庫 (建議首次執行)
1. 前往 Azure 入口網站 → 您的 Cosmos DB 帳戶
2. 導覽至「資料總管」
3. 點擊「新建資料庫」
4. 輸入與您的應用程式組態相符的資料庫名稱 (檢查 `application.properties` 或 `application.yml` 中的組態資料庫名稱)
5. 選擇輸送量設定 (手動或自動調整，根據您的需求)
   - 對於開發/測試，從手動 400 RU/s 開始
   - 對於具有可變流量的生產工作負載，請使用自動調整
6. 點擊「確定」

### 選項 2：自動建立
Spring Data Cosmos 可以在首次連線時自動建立資料庫，但這需要：
- 適當的 RBAC 權限 (Cosmos DB 內建資料參與者角色)
- 如果權限不足，可能會失敗

### 容器 (集合) 建立
當應用程式啟動時，Spring Data Cosmos 將使用實體中的 `@Container` 註釋設定自動建立容器。除非您想要組態特定的輸送量或索引原則，否則不需要手動建立容器。

## 使用 Azure Cosmos DB 進行身份驗證

### 使用 DefaultAzureCredential (建議)
`DefaultAzureCredential` 身份驗證方法是開發與生產的建議方法：

**它的運作方式**：
1. 依序嘗試多個憑證來源：
   - 環境變數
   - 工作負載身分識別 (適用於 AKS)
   - 受控身分識別 (適用於 Azure VM/應用程式服務)
   - Azure CLI (`az login`)
   - Azure PowerShell
   - Azure Developer CLI

**本機開發設定**：
```bash
# 透過 Azure CLI 登入
az login

# 應用程式將自動使用您的 CLI 憑證
```

**組態** (不需要金鑰)：
```java
@Bean
public CosmosClientBuilder getCosmosClientBuilder() {
    return new CosmosClientBuilder()
        .endpoint(uri)
        .credential(new DefaultAzureCredentialBuilder().build());
}
```

**屬性檔** (application-cosmos.properties 或 application.properties)：
```properties
azure.cosmos.uri=https://<your-cosmos-account-name>.documents.azure.com:443/
azure.cosmos.database=<your-database-name>
# 使用 DefaultAzureCredential 時不需要金鑰屬性
azure.cosmos.populate-query-metrics=false
```

**注意**：將 `<your-cosmos-account-name>` 與 `<your-database-name>` 替換為您的實際值。

### 所需的 RBAC 權限
使用 DefaultAzureCredential 時，您的 Azure 身分識別需要適當的 RBAC 權限：

**常見啟動錯誤**：
```
由 Auth 封鎖的請求：讀取 DatabaseAccount 的請求被封鎖，因為主體
[xxx] 沒有執行操作所需的 RBAC 權限
[Microsoft.DocumentDB/databaseAccounts/sqlDatabases/write] 在任何範圍。
```

**解決方案**：指派「Cosmos DB 內建資料參與者」角色：
```bash
# 取得使用者的物件 ID
PRINCIPAL_ID=$(az ad signed-in-user show --query id -o tsv)

# 指派角色 (將 <resource-group> 替換為您的實際資源群組)
az cosmosdb sql role assignment create \
  --account-name your-cosmos-account \
  --resource-group <resource-group> \
  --scope "/" \
  --principal-id $PRINCIPAL_ID \
  --role-definition-name "Cosmos DB Built-in Data Contributor"
```

**替代方案**：如果您使用 `az login` 登入，如果您是 Cosmos DB 帳戶的擁有者/參與者，您的帳戶應該已經具有權限。

### 基於金鑰的身份驗證 (僅限本機模擬器)
僅將基於金鑰的身份驗證用於本機模擬器開發：

```java
@Bean
public CosmosClientBuilder getCosmosClientBuilder() {
    // 僅限本機模擬器
    if (key != null && !key.isEmpty()) {
        return new CosmosClientBuilder()
            .endpoint(uri)
            .key(key);
    }
    // 生產：使用 DefaultAzureCredential
    return new CosmosClientBuilder()
        .endpoint(uri)
        .credential(new DefaultAzureCredentialBuilder().build());
}
```

## 重要的經驗教訓

### Java 版本要求 (Spring Boot 3.x)
**問題**：Spring Boot 3.0+ 需要 Java 17 或更高版本。使用 Java 11 會導致建構失敗。
**錯誤**：
```
找不到 org.springframework.boot:spring-boot-gradle-plugin:3.0.5 的匹配變體。
由於此元件宣告與 Java 17 相容的元件，而消費者需要與 Java 11 相容的元件，因此不相容。
```

**解決方案**：
```bash
# 檢查 Java 版本
java -version

# 將 JAVA_HOME 設定為 Java 17+
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64  # Linux
# 或
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home  # macOS

# 驗證
echo $JAVA_HOME
```

**對於 Gradle 專案**，始終使用正確的 JAVA_HOME 執行：
```bash
export JAVA_HOME=/path/to/java-17
./gradlew clean build
./gradlew bootRun
```

### Gradle 特定問題

#### 問題 1：舊組態檔衝突
**問題**：重新命名或替換 Cassandra 組態檔時，舊檔可能仍然存在，導致編譯錯誤：
```
error: 類別 CosmosConfiguration 是公開的，應在名為 CosmosConfiguration.java 的檔中宣告
```

**解決方案**：明確刪除舊的 Cassandra 組態檔：
```bash
# 尋找並刪除舊的 Cassandra 組態檔
find src/main/java -name "*CassandraConfig*.java" -o -name "*CassandraConfiguration*.java"
# 審查輸出，然後在適當時刪除
rm src/main/java/<path-to-old-config>/CassandraConfig.java
```

#### 問題 2：Repository findAllById 傳回 Iterable
**問題**：CosmosRepository 的 `findAllById()` 傳回 `Iterable<Entity>`，而不是 `List<Entity>`。直接呼叫 `.stream()` 會失敗：
```
error: 找不到符號
  符號:   方法 stream()
  位置: 介面 Iterable<YourEntity>
```

**解決方案**：正確處理 Iterable：
```java
// 錯誤 - Iterable 沒有 stream() 方法
var entities = repository.findAllById(ids).stream()...

// 正確 - 選項 1：使用 forEach 填充集合
Iterable<YourEntity> entitiesIterable = repository.findAllById(ids);
Map<String, YourEntity> entityMap = new HashMap<>();
entitiesIterable.forEach(entity -> entityMap.put(entity.getId(), entity));

// 正確 - 選項 2：先轉換為 List
List<YourEntity> entities = new ArrayList<>();
repository.findAllById(ids).forEach(entities::add);

// 正確 - 選項 3：使用 StreamSupport (Java 8+)
List<YourEntity> entities = StreamSupport.stream(
    repository.findAllById(ids).spliterator(), false)
    .collect(Collectors.toList());
```

### package-info.java javax.annotation 問題
**問題**：`package-info.java` 使用 `javax.annotation.ParametersAreNonnullByDefault` 會導致 Java 11+ 中的編譯錯誤：
```
error: 找不到符號
import javax.annotation.ParametersAreNonnullByDefault;
```

**解決方案**：移除或簡化 package-info.java 檔：
```java
// 簡單版本 - 僅套件宣告
package com.your.package;
```

### 實體建構函式問題
**問題**：使用 Lombok `@NoArgsConstructor` 搭配手動建構函式會導致重複的建構函式編譯錯誤。
**解決方案**：選擇一種方法：
- 選項 1：移除 `@NoArgsConstructor` 並保留手動建構函式
- 選項 2：移除手動建構函式並依賴 Lombok 註釋
- **最佳實務**：對於具有初始化邏輯 (例如設定分割區金鑰) 的 Cosmos 實體，請移除 `@NoArgsConstructor` 並僅使用手動建構函式。

### 業務物件建構函式移除
**問題**：從實體類別中移除 `@AllArgsConstructor` 或自訂建構函式會破壞使用這些建構函式的現有程式碼。
**影響**：對應公用程式、資料播種程式與測試檔將無法編譯。
**解決方案**：
- 移除或修改建構函式後，搜尋所有檔以尋找對這些實體的建構函式呼叫
- 替換為預設建構函式 + setter 模式：
  ```java
  // 之前 - 使用所有參數建構函式
  MyEntity entity = new MyEntity(id, field1, field2, field3);

  // 之後 - 使用預設建構函式 + setter
  MyEntity entity = new MyEntity();
  entity.setId(id);
  entity.setField1(field1);
  entity.setField2(field2);
  entity.setField3(field3);
  ```
### 資料播種程式建構函式呼叫
**問題**：資料播種或初始化程式碼使用實體建構函式，這些建構函式在實體轉換為 Cosmos 註釋後可能不存在。
**解決方案**：更新資料播種元件中所有實體實例化以使用 setter：
```java
// 之前 - 基於建構函式的初始化
MyEntity entity1 = new MyEntity("entity-1", "value1", "value2");

// 之後 - 基於 setter 的初始化
MyEntity entity1 = new MyEntity();
entity1.setId("entity-1");
entity1.setField1("value1");
entity1.setField2("value2");
```

**要檢查的常見檔**：DataSeeder, DatabaseInitializer, TestDataLoader, 或任何實作 `CommandLineRunner` 的 `@Component`
```java
OwnerEntity owner1 = new OwnerEntity();
owner1.setId("owner-1");
```

### 測試檔更新要求
**問題**：測試檔引用舊的 Cassandra DAO 並使用 UUID 建構函式。
**要更新的重要檔**：
1. 移除 `MockReactiveResultSet.java` (Cassandra 特定)
2. 更新 `*ReactiveServicesTest.java` - 將 DAO 引用替換為 Cosmos 儲存庫
3. 更新 `*ReactiveControllerTest.java` - 將 DAO 引用替換為 Cosmos 儲存庫
4. 將所有 `UUID.fromString()` 替換為字串 ID
5. 替換建構函式呼叫：`new Owner(UUID.fromString(...))` 為 setter 模式

### 應用程式啟動與 DefaultAzureCredential 行為
**重要**：DefaultAzureCredential 會依序嘗試多種身份驗證方法，這是正常且預期的。

**預期的啟動日誌模式**：
```
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 EnvironmentCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 WorkloadIdentityCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 ManagedIdentityCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 SharedTokenCacheCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 IntelliJCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 AzureCliCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 AzurePowerShellCredential 不可用。
INFO c.azure.identity.ChainedTokenCredential : Azure Identity => 嘗試的憑證 AzureDeveloperCliCredential 傳回權杖
```

**要點**：
- 「不可用」訊息是**正常**的 - 它會依序嘗試每個憑證來源
- 一旦找到有效的憑證 (例如，AzureCliCredential 或 AzureDeveloperCliCredential)，它就會使用該憑證
- **不要中斷啟動程式** - 循環憑證來源需要 10-15 秒
- 應用程式通常需要 30-60 秒才能完全啟動並連線到 Cosmos DB

**成功指標**：
```
INFO c.a.c.i.RxDocumentClientImpl : 正在初始化 DocumentClient [1] 與 serviceEndpoint [https://your-account.documents.azure.com:443/]
INFO c.a.c.i.GlobalEndpointManager : 取得資料庫帳戶 {...}
INFO c.a.c.implementation.SessionContainer : 正在註冊新的集合 resourceId [...]
INFO o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat 在連接埠(s) 8944 (http) 上啟動
INFO com.your.app.Application : 應用程式在 X.XXX 秒內啟動
```

**啟動失敗疑難排解**：

1. **如果所有憑證都「不可用」**：
   ```bash
   # 使用 Azure CLI 重新驗證
az login

# 驗證登入
az account show
```

2. **如果您看到權限錯誤**：
   ```
   由 Auth 封鎖的請求：主體 [xxx] 沒有所需的 RBAC 權限
   ```
   - 確保資料庫存在於 Cosmos DB 帳戶中 (請參閱資料庫設定部分)
   - 驗證 RBAC 權限 (請參閱身份驗證部分)
   - 檢查您是否已登入正確的 Azure 訂閱

3. **連接埠已被使用**：
   ```bash
   # 尋找並終止程序
lsof -ti:8944 | xargs kill -9

# 或者在 application.properties 中更改連接埠
server.port=8945
```

### 應用程式啟動耐心
**問題**：應用程式需要 30-60 秒才能完全啟動 (編譯 + Spring Boot + Cosmos DB 連線)。
**解決方案**：
- 對於 Gradle：`./gradlew bootRun` (預設在前台執行)
- 對於 Maven：`mvn spring-boot:run`
- 如果需要，使用後台執行：`nohup ./gradlew bootRun > app.log 2>&1 &`
- **重要事項**：不要中斷啟動程式，尤其是在憑證身份驗證期間 (10-15 秒)
- 監控日誌：`tail -f app.log` 或檢查「應用程式已啟動」訊息
- 等待 Tomcat 啟動並顯示連接埠號碼，然後再測試端點

### 連接埠組態
**問題**：應用程式可能未在預設連接埠 8080 上執行。
**解決方案**：
- 檢查實際連接埠：`ss -tlnp | grep java`
- 測試連線：`curl http://localhost:<port>/petclinic/api/owners`
- 常見連接埠：8080、9966、9967

## 系統性編譯錯誤解決方案

在這次轉換過程中，我們遇到了 100 多個編譯錯誤。以下是解決這些錯誤的系統性方法：

### 步驟 1：識別殘留的 Cassandra 檔
**問題**：移除依賴項後，舊的 Cassandra 特定檔會導致編譯錯誤。
**解決方案**：系統性地刪除所有 Cassandra 特定檔：

```bash
# 識別並刪除舊的 DAO
find . -name "*Dao.java" -o -name "*DAO.java"
# 刪除：OwnerReactiveDao, PetReactiveDao, VetReactiveDao, VisitReactiveDao

# 識別並刪除 Cassandra 對應程式
find . -name "*Mapper.java" -o -name "*EntityToOwnerMapper.java"
# 刪除：EntityToOwnerMapper, EntityToPetMapper, EntityToVetMapper, EntityToVisitMapper

# 識別並刪除舊組態
find . -name "*CassandraConfig.java" -o -name "CassandraConfiguration.java"
# 刪除：CassandraConfiguration.java

# 識別 Cassandra 的測試公用程式
find . -name "MockReactiveResultSet.java"
# 刪除：MockReactiveResultSet.java (Cassandra 特定測試公用程式)
```

### 步驟 2：執行增量編譯檢查
**方法**：在每次重大更改後，進行編譯以識別剩餘問題：

```bash
# 刪除舊檔後
mvn compile 2>&1 | grep -E "(ERROR|error)" | wc -l
# 預期：數字隨著每次修復而減少

# 更新實體建構函式後
mvn compile 2>&1 | grep "constructor"
# 識別與建構函式相關的編譯錯誤

# 修復業務物件建構函式後
mvn compile 2>&1 | grep -E "(new Owner|new Pet|new Vet|new Visit)"
# 識別需要修復的剩餘建構函式呼叫
```

### 步驟 3：系統性地修復與建構函式相關的錯誤
**模式**：搜尋特定檔類型中的所有建構函式呼叫：

```bash
# 在 MappingUtils 中尋找所有建構函式呼叫
grep -n "new Owner\|new Pet\|new Vet\|new Visit" src/main/java/**/MappingUtils.java

# 在 DataSeeder 中尋找所有建構函式呼叫
grep -n "new OwnerEntity\|new PetEntity\|new VetEntity\|new VisitEntity" src/main/java/**/DataSeeder.java

# 在測試檔中尋找所有建構函式呼叫
grep -rn "new Owner\|new Pet\|new Vet\|new Visit" src/test/java/
```

### 步驟 4：最後更新測試
**理由**：在測試程式碼之前修復應用程式程式碼，以清楚地看到所有問題：

1. 首先：更新測試儲存庫模擬 (DAO → Cosmos Repository)
2. 其次：修復測試資料中的 UUID → 字串轉換
3. 第三：更新測試設定中的建構函式呼叫
4. 最後：執行測試以驗證：`mvn test`

### 步驟 5：驗證零編譯錯誤
**最終檢查**：
```bash
# 清理並完全編譯
mvn clean compile

# 應看到：BUILD SUCCESS
# 不應看到任何 ERROR 訊息

# 驗證測試編譯
mvn test-compile

# 執行測試
mvn test
```

**成功指標**：
- `mvn compile`：BUILD SUCCESS
- `mvn test`：所有測試通過 (即使有些被跳過)
- 輸出中沒有 ERROR 訊息
- 沒有「找不到符號」錯誤
- 沒有「無法套用建構函式」錯誤

## 轉換步驟

### 1. 更新 Maven 依賴項

#### 移除 Cassandra 依賴項
```xml
<!-- 移除這些 Cassandra 依賴項 -->
<dependency>
    <groupId>com.datastax.oss</groupId>
    <artifactId>java-driver-core</artifactId>
</dependency>
<dependency>
    <groupId>com.datastax.oss</groupId>
    <artifactId>java-driver-query-builder</artifactId>
</dependency>
```

#### 新增 Azure Cosmos 依賴項
```xml
<!-- Azure Spring Data Cosmos (Java 11 相容) -->
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-spring-data-cosmos</artifactId>
    <version>3.46.0</version>
</dependency>

<!-- 用於 DefaultAzureCredential 身份驗證的 Azure Identity -->
<dependency>
    <groupId>com.azure</groupId>
    <artifactId>azure-identity</artifactId>
    <version>1.11.4</version>
</dependency>
```

#### 重要：為相容性新增版本管理
Spring Boot 2.3.x 與 Azure 函式庫存在版本衝突。將此新增到您的 `<dependencyManagement>` 部分：

```xml
<dependencyManagement>
    <dependencies>
        <!-- 覆寫 reactor-netty 版本以修復與 azure-spring-data-cosmos 的相容性 -->
        <dependency>
            <groupId>io.projectreactor.netty</groupId>
            <artifactId>reactor-netty</artifactId>
            <version>1.0.40</version>
        </dependency>
        <dependency>
            <groupId>io.projectreactor.netty</groupId>
            <artifactId>reactor-netty-http</artifactId>
            <version>1.0.40</version>
        </dependency>
        <dependency>
            <groupId>io.projectreactor.netty</groupId>
            <artifactId>reactor-netty-core</artifactId>
            <version>1.0.40</version>
        </dependency>

        <!-- 覆寫 reactor-core 版本以支援 azure-identity 所需的 Sinks API -->
        <dependency>
            <groupId>io.projectreactor</groupId>
            <artifactId>reactor-core</artifactId>
            <version>3.4.32</version>
        </dependency>

        <!-- 覆寫 Netty 版本以修復與 Azure Cosmos 用戶端的相容性 -->
        <dependency>
            <groupId>io.netty</groupId>
            <artifactId>netty-bom</artifactId>
            <version>4.1.101.Final</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>

        <!-- 覆寫 netty-tcnative 以匹配 Netty 版本 -->
        <dependency>
            <groupId>io.netty</groupId>
            <artifactId>netty-tcnative-boringssl-static</artifactId>
            <version>2.0.62.Final</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 2. 組態設定

#### 建立 Cosmos 組態類別
將您的 Cassandra 組態替換為：

```java
@Configuration
@EnableCosmosRepositories  // 非反應式儲存庫所需
@EnableReactiveCosmosRepositories  // 重要：反應式儲存庫所需
public class CosmosConfiguration extends AbstractCosmosConfiguration {

    @Value("${azure.cosmos.uri}")
    private String uri;

    @Value("${azure.cosmos.database}")
    private String database;

    @Bean
    public CosmosClientBuilder getCosmosClientBuilder() {
        return new CosmosClientBuilder()
            .endpoint(uri)
            .credential(new DefaultAzureCredential());
    }

    @Bean
    public CosmosAsyncClient cosmosAsyncClient(CosmosClientBuilder cosmosClientBuilder) {
        return cosmosClientBuilder.buildAsyncClient();
    }

    @Bean
    public CosmosClientBuilderFactory cosmosFactory(CosmosAsyncClient cosmosAsyncClient) {
        return new CosmosClientBuilderFactory(cosmosAsyncClient);
    }

    @Bean
    public ReactiveCosmosTemplate reactiveCosmosTemplate(CosmosClientBuilderFactory cosmosClientBuilderFactory) {
        return new ReactiveCosmosTemplate(cosmosClientBuilderFactory, database);
    }

    @Override
    protected String getDatabaseName() {
        return database;
    }
}
```

**重要注意事項**：
- **需要這兩個註釋**：@EnableCosmosRepositories 與 @EnableReactiveCosmosRepositories
- 缺少 @EnableReactiveCosmosRepositories 將導致反應式儲存庫出現「沒有符合條件的 bean」錯誤

#### 應用程式屬性
新增 cosmos 設定檔組態：

```properties
# application-cosmos.properties
azure.cosmos.uri=https://your-cosmos-account.documents.azure.com:443/
azure.cosmos.database=your-database-name
```

### 3. 實體轉換

#### 從 Cassandra 轉換為 Cosmos 註釋

**之前 (Cassandra)：**
```java
@Table(value = "entity_table")
public class EntityName {
    @PartitionKey
    private UUID id;

    @ClusteringColumn
    private String fieldName;

    @Column("column_name")
    private String anotherField;
}
```

**之後 (Cosmos)：**
```java
@Container(containerName = "entities")
public class EntityName {
    @Id
    private String id;  // 從 UUID 變更為字串

    @PartitionKey
    private String fieldName;  // 選擇適當的分割區金鑰

    private String anotherField;

    // 產生字串 ID
    public EntityName() {
        this.id = UUID.randomUUID().toString();
    }
}
```

#### 主要變更：
- 將 `@Table` 替換為 `@Container(containerName = "...")`
- 將 `@PartitionKey` 變更為 Cosmos 分割區金鑰策略
- 將所有 ID 從 `UUID` 轉換為 `String`
- 移除 `@Column` 註釋 (Cosmos 使用欄位名稱)
- 移除 `@ClusteringColumn` (不適用於 Cosmos)

### 4. 儲存庫轉換

#### 使用 Cosmos 儲存庫替換 Cassandra 資料存取層

**如果您的應用程式使用 DAO 或自訂資料存取類別：**

**之前 (Cassandra DAO 模式)：**
```java
@Repository
public class EntityReactiveDao {
    // 自訂 Cassandra 查詢方法
}
```

**之後 (Cosmos 儲存庫)：**
```java
@Repository
public interface EntityCosmosRepository extends ReactiveCosmosRepository<EntityName, String> {

    @Query("SELECT * FROM entities e WHERE e.fieldName = @fieldName")
    Flux<EntityName> findByFieldName(@Param("fieldName") String fieldName);

    @Query("SELECT * FROM entities e WHERE e.id = @id")
    Mono<EntityName> findEntityById(@Param("id") String id);
}
```

**如果您的應用程式使用 Spring Data Cassandra 儲存庫：**

**之前：**
```java
@Repository
public interface EntityCassandraRepository extends ReactiveCassandraRepository<EntityName, UUID> {
    // Cassandra 特定方法
}
```

**之後：**
```java
@Repository
public interface EntityCosmosRepository extends ReactiveCosmosRepository<EntityName, String> {
    // 將現有方法轉換為 Cosmos 查詢
}
```

**如果您的應用程式使用直接 CqlSession 或 Cassandra 驅動程式：**
- 使用儲存庫模式替換直接驅動程式呼叫
- 將 CQL 查詢轉換為 Cosmos SQL 語法
- 實作如上所示的儲存庫介面

#### 要點：
- **重要事項**：對於反應式程式設計，使用 `ReactiveCosmosRepository<Entity, String>` (而非 CosmosRepository)
- 對於非反應式應用程式，使用 `CosmosRepository<Entity, String>`
- **儲存庫介面變更**：如果從現有的 Cassandra 儲存庫/DAO 轉換，請確保所有儲存庫介面都擴展 ReactiveCosmosRepository
- **常見錯誤**：「沒有符合條件的 ReactiveCosmosRepository 類型的 bean」= 缺少 @EnableReactiveCosmosRepositories
- **如果使用自訂資料存取類別**：轉換為儲存庫模式以實現更好的整合
- **如果已經使用 Spring Data**：將介面擴展從 ReactiveCassandraRepository 更改為 ReactiveCosmosRepository
- 使用 `@Query` 註釋和類似 SQL 的語法 (而非 CQL) 實作自訂查詢
- 所有查詢參數都必須使用 `@Param` 註釋

### 5. 服務層更新

#### 更新服務類別以進行反應式程式設計 (如果適用)

**如果您的應用程式有服務層：**

**重要事項**：服務方法必須傳回 Flux/Mono，而非 Iterable/Optional

```java
@Service
public class EntityReactiveServices {
    private final EntityCosmosRepository repository;

    public EntityReactiveServices(EntityCosmosRepository repository) {
        this.repository = repository;
    }

    // 正確：傳回 Flux<EntityName>
    public Flux<EntityName> findAll() {
        return repository.findAll();
    }

    // 正確：傳回 Mono<EntityName>
    public Mono<EntityName> findById(String id) {
        return repository.findById(id);
    }

    // 正確：傳回 Mono<EntityName>
    public Mono<EntityName> save(EntityName entity) {
        return repository.save(entity);
    }

    // 自訂查詢 - 必須傳回 Flux/Mono
    public Flux<EntityName> findByFieldName(String fieldName) {
        return repository.findByFieldName(fieldName);
    }

    // 要避免的錯誤模式：
    // public Iterable<EntityName> findAll() - 將導致編譯錯誤
    // public Optional<EntityName> findById() - 將導致編譯錯誤
    // repository.findAll().collectList() - 不必要的阻擋
}
```

**如果您的應用程式在控制器中直接注入儲存庫：**
- 考慮新增服務層以實現更好的關注點分離
- 更新控制器依賴項以使用新的 Cosmos 儲存庫
- 確保整個呼叫鏈中正確處理反應式類型

**常見問題：**
- **編譯錯誤**：使用 Iterable 傳回類型時「無法解析方法」
- **運行時錯誤**：不必要地嘗試呼叫 .collectList() 或 .block()
- **效能**：阻擋反應式流違背了反應式程式設計的目的

### 6. 控制器更新 (如果適用)

#### 更新 REST 控制器以使用字串 ID

**如果您的應用程式有 REST 控制器：**

**之前：**
```java
@GetMapping("/entities/{entityId}")
public Mono<EntityDto> getEntity(@PathVariable UUID entityId) {
    return entityService.findById(entityId);
}
```

**之後：**
```java
@GetMapping("/entities/{entityId}")
public Mono<EntityDto> getEntity(@PathVariable String entityId) {
    return entityService.findById(entityId);
}
```

**如果您的應用程式不使用控制器：**
- 將相同的 UUID → 字串轉換原則套用到您的資料存取層
- 更新任何接受/傳回實體 ID 的外部 API 或介面

### 7. 資料對應公用程式 (如果適用)

#### 更新領域物件與實體之間的對應

**如果您的應用程式使用對應公用程式或轉換器：**

```java
public class MappingUtils {

    // 將領域物件轉換為實體
    public static EntityName toEntity(DomainObject domain) {
        EntityName entity = new EntityName();
        entity.setId(domain.getId()); // 現在是字串而非 UUID
        entity.setFieldName(domain.getFieldName());
        entity.setAnotherField(domain.getAnotherField());
        // ... 其他欄位
        return entity;
    }

    // 將實體轉換為領域物件
    public static DomainObject toDomain(EntityName entity) {
        DomainObject domain = new DomainObject();
        domain.setId(entity.getId());
        domain.setFieldName(entity.getFieldName());
        domain.setAnotherField(entity.getAnotherField());
        // ... 其他欄位
        return domain;
    }
}
```

**如果您的應用程式不使用明確對應：**
- 確保您的程式碼庫中 ID 類型使用一致
- 更新任何物件建構或複製邏輯以處理字串 ID

### 8. 測試更新

#### 更新測試類別

**重要事項**：所有測試檔都必須更新以使用字串 ID 與 Cosmos 儲存庫：

```java
**如果您的應用程式有單元測試：**

```java
@ExtendWith(MockitoExtension.class)
class EntityReactiveServicesTest {

    @Mock
    private EntityCosmosRepository entityRepository; // 已更新為 Cosmos 儲存庫

    @InjectMocks
    private EntityReactiveServices entityService;

    @Test
    void testFindById() {
        String entityId = "test-entity-id"; // 從 UUID 變更為字串
        EntityName mockEntity = new EntityName();
        mockEntity.setId(entityId);

        when(entityRepository.findById(entityId)).thenReturn(Mono.just(mockEntity));

        StepVerifier.create(entityService.findById(entityId))
            .expectNext(mockEntity)
            .verifyComplete();
    }
}
```

**如果您的應用程式有整合測試：**
- 更新測試資料設定以使用字串 ID
- 將 Cassandra 測試容器替換為 Cosmos DB 模擬器 (如果可用)
- 將測試查詢替換為 Cosmos SQL 語法而非 CQL

**如果您的應用程式沒有測試：**
- 考慮新增基本測試以驗證轉換是否正常運作
- 專注於測試 ID 轉換與基本 CRUD 呼叫
```

### 9. 常見問題與解決方案

#### 問題 1：NoClassDefFoundError 與 reactor.core.publisher.Sinks
**問題**：Azure Identity 函式庫需要較新的 Reactor Core 版本
**錯誤**：`java.lang.NoClassDefFoundError: reactor/core/publisher/Sinks`
**根本原因**：Spring Boot 2.3.x 使用較舊的 reactor-core，沒有 Sinks API
**解決方案**：在 dependencyManagement 中新增 reactor-core 版本覆寫 (請參閱步驟 1)

#### 問題 2：NoSuchMethodError 與 Netty Epoll 方法
**問題**：Spring Boot Netty 與 Azure Cosmos 需求之間的版本不匹配
**錯誤**：`java.lang.NoSuchMethodError: 'boolean io.netty.channel.epoll.Epoll.isTcpFastOpenClientSideAvailable()'`
**根本原因**：Spring Boot 2.3.x 使用 Netty 4.1.51.Final，Azure 需要較新的方法
**解決方案**：新增 netty-bom 4.1.101.Final 版本覆寫 (請參閱步驟 1)

#### 問題 3：NoSuchMethodError 與 SSL Context
**問題**：Netty TLS 原生函式庫版本不匹配
**錯誤**：`java.lang.NoSuchMethodError: 'boolean io.netty.internal.tcnative.SSLContext.setCurvesList(long, java.lang.String[])'`
**根本原因**：netty-tcnative 版本與升級後的 Netty 不相容
**解決方案**：新增 netty-tcnative-boringssl-static 2.0.62.Final 版本覆寫 (請參閱步驟 1)

#### 問題 4：ReactiveCosmosRepository bean 未建立
**問題**：缺少 @EnableReactiveCosmosRepositories 註釋
**錯誤**：`找不到 'ReactiveCosmosRepository' 類型的合格 bean`
**根本原因**：只有 @EnableCosmosRepositories 不會建立反應式儲存庫 bean
**解決方案**：在組態中同時新增 @EnableCosmosRepositories 與 @EnableReactiveCosmosRepositories

#### 問題 5：儲存庫介面編譯錯誤
**問題**：使用 CosmosRepository 而非 ReactiveCosmosRepository
**錯誤**：`無法解析 'CosmosRepository' 中的方法 'findAll()'`
**根本原因**：CosmosRepository 傳回 Iterable，而非 Flux
**解決方案**：將所有儲存庫介面更改為擴展 ReactiveCosmosRepository<Entity, String>

#### 問題 6：服務層反應式類型不匹配
**問題**：服務方法傳回 Iterable/Optional 而非 Flux/Mono
**錯誤**：`所需類型：Flux<Entity> 提供：Iterable<Entity>`
**根本原因**：儲存庫方法傳回反應式類型，服務必須匹配
**解決方案**：更新所有服務方法簽章以傳回 Flux/Mono

#### 問題 7：DefaultAzureCredential 身份驗證失敗
**問題**：DefaultAzureCredential 找不到憑證
**錯誤**：`鏈中所有憑證都不可用` 或特定憑證不可用訊息
**根本原因**：沒有有效的 Azure 憑證來源可用

**解決方案**：
1. **對於本機開發**：確保 Azure CLI 登入
   ```bash
   az login
   # 驗證登入
   az account show
   ```

2. **對於 Azure 託管應用程式**：確保受控身分識別已啟用並具有適當的 RBAC 權限

3. **檢查憑證鏈順序**：DefaultAzureCredential 依此順序嘗試：
   - 環境變數 → 工作負載身分識別 → 受控身分識別 → Azure CLI → PowerShell → 開發人員 CLI


#### 問題 8：資料庫找不到錯誤
**問題**：應用程式啟動失敗，出現資料庫找不到錯誤
**錯誤**：`找不到資料庫 'your-database-name'` 或 `找不到資源`
**根本原因**：Cosmos DB 帳戶中不存在資料庫

**解決方案**：首次執行前建立資料庫 (請參閱資料庫設定部分)：
```bash
# 透過 Azure CLI
az cosmosdb sql database create \
  --account-name your-cosmos-account \
  --name your-database-name \
  --resource-group your-resource-group

# 或者透過 Azure 入口網站 (建議首次設定)
# 入口網站 → Cosmos DB → 資料總管 → 新增資料庫
```

**注意**：容器 (集合) 將從實體 `@Container` 註釋自動建立，但資料庫本身可能需要首先存在，具體取決於您的 RBAC 權限。

#### 問題 9：RBAC 權限錯誤
**問題**：應用程式失敗，出現權限拒絕錯誤
**錯誤**：
```
由 Auth 封鎖的請求：主體 [xxx] 沒有所需的 RBAC 權限
執行操作 [Microsoft.DocumentDB/databaseAccounts/sqlDatabases/write]
```

**根本原因**：您的 Azure 身分識別缺少所需的 Cosmos DB 權限

**解決方案**：指派「Cosmos DB 內建資料參與者」角色：
```bash
# 取得資源群組
RESOURCE_GROUP=$(az cosmosdb show --name your-cosmos-account --query resourceGroup -o tsv 2>/dev/null)

# 如果上述失敗，列出所有 Cosmos 帳戶以尋找它
az cosmosdb list --query "[?name=='your-cosmos-account'].{name:name, resourceGroup:resourceGroup}" -o table

# 指派角色
az cosmosdb sql role assignment create \
  --account-name your-cosmos-account \
  --resource-group $RESOURCE_GROUP \
  --scope "/" \
  --principal-id $(az ad signed-in-user show --query id -o tsv) \
  --role-definition-name "Cosmos DB Built-in Data Contributor"
```

**替代方案**：入口網站 → Cosmos DB → 存取控制 (IAM) → 新增角色指派 → 「Cosmos DB 內建資料參與者」

#### 問題 10：分割區金鑰策略差異
**問題**：Cassandra 叢集金鑰與 Cosmos 分割區金鑰不直接對應
**錯誤**：跨分割區查詢或效能不佳
**根本原因**：不同的資料分佈策略
**解決方案**：根據查詢模式選擇適當的分割區金鑰，通常是查詢最頻繁的欄位

#### 問題 10：UUID 到字串轉換問題
**問題**：測試檔和控制器仍使用 UUID 類型
**錯誤**：`無法將 UUID 轉換為字串` 或類型不匹配錯誤
**根本原因**：並非所有出現的 UUID 都已轉換為字串
**解決方案**：系統地搜尋並替換所有 UUID 引用為字串

### 10. 資料播種 (如果適用)

#### 實作資料填充

**如果您的應用程式需要初始資料：**

```java
@Component
public class DataSeeder implements CommandLineRunner {

    private final EntityCosmosRepository entityRepository;

    @Override
    public void run(String... args) throws Exception {
        if (entityRepository.count().block() == 0) {
            // 播種初始資料
            EntityName entity = new EntityName();
            entity.setFieldName("範例值");
            entity.setAnotherField("範例資料");

            entityRepository.save(entity).block();
        }
    }
}
```

**如果您的應用程式有現有的資料移轉需求：**
- 建立移轉指令碼以從 Cassandra 匯出並匯入到 Cosmos DB
- 考慮資料轉換需求 (UUID 到字串轉換)
- 規劃 Cassandra 與 Cosmos 資料模型之間的任何結構描述差異

**如果您的應用程式不需要資料播種：**
- 跳過此步驟並繼續驗證

### 11. 應用程式設定檔

#### 更新 application.yml 以用於 Cosmos 設定檔
```yaml
spring:
  profiles:
    active: cosmos

---
spring:
  profiles: cosmos

azure:
  cosmos:
    uri: ${COSMOS_URI:https://your-account.documents.azure.com:443/}
    database: ${COSMOS_DATABASE:your-database}
```

## 驗證步驟

1. **編譯檢查**：`mvn compile` 應該成功且沒有錯誤
2. **測試檢查**：`mvn test` 應該通過更新的測試案例
3. **運行時檢查**：應用程式應該啟動且沒有版本衝突
4. **連線檢查**：應用程式應該成功連線到 Cosmos DB
5. **資料檢查**：CRUD 呼叫應該透過 API 正常運作
6. **UI 檢查**：前端應該顯示來自 Cosmos DB 的資料

## 最佳實務

1. **ID 策略**：始終使用字串 ID 而非 UUID 作為 Cosmos DB
2. **分割區策略**：設計分割區金鑰以均勻分佈負載
3. **查詢設計**：使用 @Query 註釋進行自訂查詢，而非方法命名慣例
4. **反應式程式設計**：在整個服務層中堅持 Flux/Mono 模式
5. **版本管理**：始終包含 Spring Boot 2.x 專案的依賴項版本覆寫
6. **測試**：更新所有測試檔以使用字串 ID 並模擬 Cosmos 儲存庫
7. **身份驗證**：使用 DefaultAzureCredential 進行生產就緒身份驗證

## 疑難排解命令

```bash
# 檢查依賴項與版本衝突
mvn dependency:tree | grep -E "(reactor|netty|cosmos)"

# 驗證特定的問題依賴項
mvn dependency:tree | grep "reactor-core"
mvn dependency:tree | grep "reactor-netty"
mvn dependency:tree | grep "netty-tcnative"

# 測試連線
curl http://localhost:8080/api/entities

# 檢查 Azure 登入狀態
az account show

# 清理並重建 (通常可修復依賴項問題)
mvn clean compile

# 以偵錯日誌執行以進行依賴項解析
mvn dependency:resolve -X

# 專門檢查編譯錯誤
mvn compile 2>&1 | grep -E "(ERROR|error)"

# 以偵錯執行以進行運行時問題
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

# 檢查應用程式日誌以尋找版本衝突
grep -E "(NoSuchMethodError|NoClassDefFoundError|reactor|netty)" application.log
```

## 典型錯誤序列與解決方案

根據實際轉換經驗，您可能會依此順序遇到這些錯誤：

### **階段 1：編譯錯誤**
1. **缺少依賴項** → 新增 azure-spring-data-cosmos 與 azure-identity
2. **組態類別錯誤** → 建立 CosmosConfiguration (如果尚不存在)
3. **實體註釋錯誤** → 將 @Table 轉換為 @Container 等
4. **儲存庫介面錯誤** → 更改為 ReactiveCosmosRepository (如果使用儲存庫模式)

### **階段 2：Bean 建立錯誤**
5. **「沒有符合條件的 ReactiveCosmosRepository 類型 bean」** → 新增 @EnableReactiveCosmosRepositories
6. **服務層類型不匹配** → 將 Iterable 更改為 Flux，Optional 更改為 Mono (如果使用服務層)

### **階段 3：運行時版本衝突** (最複雜)
7. **NoClassDefFoundError: reactor.core.publisher.Sinks** → 新增 reactor-core 3.4.32 覆寫
8. **NoSuchMethodError: Epoll.isTcpFastOpenClientSideAvailable** → 新增 netty-bom 4.1.101.Final 覆寫
9. **NoSuchMethodError: SSLContext.setCurvesList** → 新增 netty-tcnative-boringssl-static 2.0.62.Final 覆寫

### **階段 4：身份驗證與連線**
10. **ManagedIdentityCredential 身份驗證不可用** → 執行 `az login --use-device-code`
11. **應用程式成功啟動** → 已連線到 Cosmos DB！

**重要事項**：請依序解決這些問題。不要跳過 - 每個階段都必須在下一個階段出現之前解決。

## 效能考量

1. **分割區策略**：設計分割區金鑰以均勻分佈負載
2. **查詢優化**：使用索引並盡可能避免跨分割區查詢
3. **連線池**：Cosmos 用戶端自動管理連線
4. **請求單位**：監控 RU 消耗並根據需要調整輸送量
5. **批量呼叫**：使用批次呼叫進行多個文件更新

本指南涵蓋了從 Cassandra 轉換為 Cosmos DB 的所有主要方面，包括在實際情境中遇到的所有版本衝突與身份驗證問題。
