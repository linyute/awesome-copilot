---
applyTo: '*'
description: 'Quarkus 開發標準與指引'
---

- 適用於高品質 Quarkus 應用程式的指引，需使用 Java 17 或以上版本。

## 專案背景

- 最新 Quarkus 版本：3.x
- Java 版本：17 或以上
- 建構管理請使用 Maven 或 Gradle。
- 著重於乾淨架構、可維護性與效能。

## 開發標準

  - 為每個類別、方法及複雜邏輯撰寫清楚且簡潔的註解。
  - 公開 API 與方法請使用 Javadoc，確保使用者易於理解。
  - 專案內程式碼風格需一致，遵循 Java 慣例。
  - 遵循 Quarkus 程式撰寫標準與最佳實踐，以獲得最佳效能與可維護性。
  - 遵循 Jarkarta EE 與 MicroProfile 慣例，確保套件組織清晰。
  - 適當使用 Java 17 或以上新特性，例如 record 與 sealed 類別。


## 命名慣例
  - 類別名稱使用 PascalCase（例如：`ProductService`、`ProductResource`）。
  - 方法與變數名稱使用 camelCase（例如：`findProductById`、`isProductAvailable`）。
  - 常數名稱使用 ALL_CAPS（例如：`DEFAULT_PAGE_SIZE`）。

## Quarkus
  - 利用 Quarkus Dev Mode 加速開發流程。
  - 透過 Quarkus 擴充套件與最佳實踐進行建構時最佳化。
  - 使用 GraalVM 配合原生建構（如 quarkus-maven-plugin）以獲得最佳效能。
  - 日誌請使用 Quarkus 日誌功能（JBoss、SL4J 或 JUL），確保一致性。

### Quarkus 專屬模式
- 單例 bean 請使用 `@ApplicationScoped`，而非 `@Singleton`
- 相依性注入請使用 `@Inject`
- 優先使用 Panache repository 取代傳統 JPA repository
- 修改資料的方法請加上 `@Transactional`
- REST 端點路徑請用具描述性的 `@Path`
- REST 資源請用 `@Consumes(MediaType.APPLICATION_JSON)` 與 `@Produces(MediaType.APPLICATION_JSON)`

### REST 資源
- 一律使用 JAX-RS 標註（`@Path`、`@GET`、`@POST` 等）
- 回傳正確的 HTTP 狀態碼（200、201、400、404、500）
- 複雜回應請用 `Response` 類別
- 錯誤處理請用 try-catch 區塊
- 輸入參數請用 Bean Validation 標註驗證
- 公開端點請實作速率限制

### 資料存取
- 優先使用 Panache entity（繼承 `PanacheEntity`）取代傳統 JPA
- 複雜查詢請用 Panache repository（`PanacheRepository<T>`）
- 修改資料一律加上 `@Transactional`
- 複雜資料庫操作請用命名查詢
- 列表端點請實作分頁


### 設定
- 簡易設定請用 `application.properties` 或 `application.yaml`
- 型別安全設定類別請用 `@ConfigProperty`
- 敏感資料請優先用環境變數
- 不同環境（dev、test、prod）請用 profile


### 測試
- 整合測試請用 `@QuarkusTest`
- 單元測試請用 JUnit 5
- 原生建構測試請用 `@QuarkusIntegrationTest`
- 外部相依請用 `@QuarkusTestResource` 模擬
- REST 端點測試請用 RestAssured（`@QuarkusTestResource`）
- 修改資料的測試請加上 `@Transactional`
- 資料庫整合測試請用 test-containers

### 請勿使用以下模式：
- 測試中請勿用欄位注入（請用建構子注入）
- 請勿硬編設定值
- 請勿忽略例外狀況


## 開發流程

### 新增功能時：
1. 建立具驗證的 entity
2. 建立具自訂查詢的 repository
3. 建立商業邏輯的 service
4. 建立具適當端點的 REST resource
5. 撰寫完整測試
6. 加入適當錯誤處理
7. 更新文件

## 安全性考量

### 實作安全性時：
- 請用 Quarkus Security 擴充套件（如 `quarkus-smallrye-jwt`、`quarkus-oidc`）。
- 以 MicroProfile JWT 或 OIDC 實作角色型存取控制（RBAC）。
- 驗證所有輸入參數
