---
name: 'javax-to-jakarta-migration'
description: '將 Java 程式碼從 javax.* 遷移至 jakarta.* 命名空間。僅在使用者明確要求 javax 至 jakarta 命名空間或架構遷移（例如移轉至 Tomcat 10+/11 或 Jakarta EE），或 java-upgrade、spring-boot-4-migration 委派處理時使用。單純發現 javax 匯入不代表獲授權進行遷移。'
argument-hint: '要遷移的檔案、套件或模組'
---

# javax → jakarta 遷移 Skill (javax → jakarta Migration Skill)

## 何時使用
- 使用者明確要求遷移至 jakarta 命名空間、Tomcat 10+/11 或 Jakarta EE
- `java-upgrade` 或 `spring-boot-4-migration` 委派處理命名空間遷移

單純偵測到 `javax.*` 匯入不代表獲授權進行此遷移；應改為回報這些匯入。

在 Spring Boot 專案中，Boot BOM 負責管理 Jakarta 版本：不要鎖定下列版本，讓 Boot 版本決定 Jakarta EE 等級（Boot 4 = Jakarta EE 11, Servlet 6.1）。下列範例針對非 Boot 專案中的 Jakarta EE 10（Servlet 6.0, Tomcat 10.1+）。

## 步驟程序

### 步驟 0 — 建立基準線
先執行 `./mvnw verify` 或 `./gradlew build` 並記錄結果；切勿在失敗 (red) 的基準線上進行遷移。在專屬的認可/步驟中進行變更。

### 步驟 1 — 掃描 javax 使用情況
在程式碼庫中搜尋所有需要遷移的 `javax.*` 匯入：
```
javax.servlet.*      → jakarta.servlet.*
javax.persistence.*  → jakarta.persistence.*
javax.validation.*   → jakarta.validation.*
javax.annotation.*   → jakarta.annotation.*
javax.inject.*       → jakarta.inject.*
javax.enterprise.*   → jakarta.enterprise.*
javax.faces.*        → jakarta.faces.*
javax.ws.rs.*        → jakarta.ws.rs.*
javax.el.*           → jakarta.el.*
javax.json.*         → jakarta.json.*
javax.mail.*         → jakarta.mail.*
javax.websocket.*    → jakarta.websocket.*
```

**請勿遷移**下列項目（它們保留在 `javax.*` 中）：
- `javax.sql.*` — JDK 的一部分
- `javax.naming.*` — JDK 的一部分 (JNDI)
- `javax.crypto.*` — JDK 的一部分
- `javax.net.*` — JDK 的一部分
- `javax.security.auth.*` — JDK 的一部分
- `javax.swing.*`, `javax.xml.parsers.*` — JDK 套件

### 步驟 2 — 更新 pom.xml
替換相依性座標。選擇符合目標執行階段的 API 版本；下表適用於 Jakarta EE 10 (Tomcat 10.1+, Servlet 6.0)：

| 目標執行階段 | Jakarta EE | Servlet | Persistence | Validation | Annotations |
|----------------|-----------|---------|-------------|------------|-------------|
| Tomcat 10.0 | 9 | 5.0 | 3.0 | 3.0 | 2.0 |
| Tomcat 10.1 | 10 | 6.0 | 3.1 | 3.0 | 2.1 |
| Tomcat 11 | 11 | 6.1 | 3.2 | 3.1 | 3.0 |


| 舊座標 | 新座標 |
|-----|-----|
| `javax.servlet:javax.servlet-api` | `jakarta.servlet:jakarta.servlet-api:6.0.0` |
| `javax.persistence:javax.persistence-api` | `jakarta.persistence:jakarta.persistence-api:3.1.0` |
| `javax.validation:validation-api` | `jakarta.validation:jakarta.validation-api:3.0.2` |
| `javax.annotation:javax.annotation-api` | `jakarta.annotation:jakarta.annotation-api:2.1.1` |

### 步驟 3 — 更新 web.xml (若存在)
`version` 必須符合目標 Servlet 等級（Tomcat 10.0 為 5.0，Tomcat 10.1 為 6.0，Tomcat 11 為 6.1）；以下範例適用於 Servlet 6.0：
```xml
<!-- 舊命名空間 -->
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee" version="4.0">

<!-- 新命名空間 -->
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee" version="6.0">
```

### 步驟 4 — 更新 Java 原始檔
在 `.java` 檔案中，僅將步驟 1 所識別的 Jakarta EE `javax.` 匯入替換為其對應的 `jakarta.`；保持 JDK 套件（例如 `javax.sql`、`javax.crypto`）不變。同時檢查非 Java 參照：`persistence.xml` (`javax.persistence.*` 屬性)、`META-INF/services`、`beans.xml`、properties/YAML、字串類別名稱與反射。

### 步驟 5 — 驗證
1. 執行 `mvn clean compile` 或 `gradlew build` — 修正任何編譯錯誤
2. 執行 `mvn test` 或 `gradlew test` — 確保所有測試通過
3. 搜尋是否有任何殘留的 `javax.*` 匯入（排除 JDK 套件）

### 上游來源 (在遷移前閱讀)

擷取目標版本的頁面；發生衝突時以該頁面為主，優於本 skill。

- Jakarta EE 規格：<https://jakarta.ee/specifications/>
- Eclipse Transformer (二進位檔/位元組碼轉換)：<https://github.com/eclipse-transformer/transformer>
- OpenRewrite `org.openrewrite.java.migrate.jakarta.JavaxMigrationToJakarta`：<https://docs.openrewrite.org/recipes/java/migrate/jakarta/javaxmigrationtojakarta>
- Tomcat 9 至 10 遷移：<https://tomcat.apache.org/migration-10.html>
- Hibernate 遷移指引：<https://hibernate.org/orm/documentation/migrate/>
- Spring Boot 3 升級 (Jakarta EE 9+ 基準線)：<https://docs.spring.io/spring-boot/upgrading.html>

### 輸出
提供遷移摘要，列出所有已變更的檔案、替換的匯入以及任何需要的手動步驟。
