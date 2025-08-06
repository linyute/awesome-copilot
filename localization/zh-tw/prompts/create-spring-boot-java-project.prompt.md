---
mode: 'agent'
tools: ['changes', 'codebase', 'editFiles', 'findTestFiles', 'problems', 'runCommands', 'runTests', 'search', 'searchResults', 'terminalLastCommand', 'testFailure', 'usages']
description: '建立 Spring Boot Java 專案骨架'
---

# 建立 Spring Boot Java 專案提示

- 請確保你的系統已安裝下列軟體：

  - Java 21
  - Docker
  - Docker Compose

- 若需自訂專案名稱，請在 [下載 Spring Boot 專案範本](./create-spring-boot-java-project.prompt.md#download-spring-boot-project-template) 章節修改 `artifactId` 與 `packageName`。

- 若需更新 Spring Boot 版本，請在 [下載 Spring Boot 專案範本](./create-spring-boot-java-project.prompt.md#download-spring-boot-project-template) 章節修改 `bootVersion`。

## 檢查 Java 版本

- 在終端機執行下列指令，檢查 Java 版本

```shell
java -version
```

## 下載 Spring Boot 專案範本

- 在終端機執行下列指令下載 Spring Boot 專案範本

```shell
curl https://start.spring.io/starter.zip \
  -d artifactId=demo \
  -d bootVersion=3.4.5 \
  -d dependencies=lombok,configuration-processor,web,data-jpa,postgresql,data-redis,data-mongodb,validation,cache,testcontainers \
  -d javaVersion=21 \
  -d packageName=com.example \
  -d packaging=jar \
  -d type=maven-project \
  -o starter.zip
```

## 解壓縮下載的檔案

- 在終端機執行下列指令解壓縮下載的檔案

```shell
unzip starter.zip -d .
```

## 刪除下載的 zip 檔案

- 在終端機執行下列指令刪除下載的 zip 檔案

```shell
rm -f starter.zip
```

## 新增額外相依套件

- 在 `pom.xml` 檔案中加入 `springdoc-openapi-starter-webmvc-ui` 與 `archunit-junit5` 相依套件

```xml
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.8.6</version>
</dependency>
<dependency>
  <groupId>com.tngtech.archunit</groupId>
  <artifactId>archunit-junit5</artifactId>
  <version>1.2.1</version>
  <scope>test</scope>
</dependency>
```

## 新增 SpringDoc、Redis、JPA 與 MongoDB 設定

- 在 `application.properties` 檔案中加入 SpringDoc 設定

```properties
# SpringDoc 設定
springdoc.swagger-ui.doc-expansion=none
springdoc.swagger-ui.operations-sorter=alpha
springdoc.swagger-ui.tags-sorter=alpha
```

- 在 `application.properties` 檔案中加入 Redis 設定

```properties
# Redis 設定
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=rootroot
```

- 在 `application.properties` 檔案中加入 JPA 設定

```properties
# JPA 設定
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=rootroot
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

- 在 `application.properties` 檔案中加入 MongoDB 設定

```properties
# MongoDB 設定
spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.authentication-database=admin
spring.data.mongodb.username=root
spring.data.mongodb.password=rootroot
spring.data.mongodb.database=test
```

## 新增 `docker-compose.yaml`，包含 Redis、PostgreSQL 與 MongoDB 服務

- 在專案根目錄建立 `docker-compose.yaml`，並新增下列服務：`redis:6`、`postgresql:17`、`mongo:8`。

  - redis 服務需設定
    - 密碼 `rootroot`
    - 對應埠 6379 到 6379
    - 掛載目錄 `./redis_data` 到 `/data`
  - postgresql 服務需設定
    - 密碼 `rootroot`
    - 對應埠 5432 到 5432
    - 掛載目錄 `./postgres_data` 到 `/var/lib/postgresql/data`
  - mongo 服務需設定
    - initdb root 使用者 `root`
    - initdb root 密碼 `rootroot`
    - 對應埠 27017 到 27017
    - 掛載目錄 `./mongo_data` 到 `/data/db`

## 新增 `.gitignore` 檔案

- 在 `.gitignore` 檔案中加入 `redis_data`、`postgres_data`、`mongo_data` 目錄

## 執行 Maven 測試指令

- 執行 maven clean test 指令，檢查專案是否正常

```shell
./mvnw clean test
```

## 執行 Maven run 指令（選用）

- （選用）可執行 `docker-compose up -d` 啟動服務，`./mvnw spring-boot:run` 執行 Spring Boot 專案，`docker-compose rm -sf` 停止服務。

## 讓我們一步一步完成

---

**免責聲明**：本文件由 [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot) 翻譯為繁體中文，可能包含錯誤。如發現不適當或錯誤之翻譯，請至 [issue](../../issues) 回報。
