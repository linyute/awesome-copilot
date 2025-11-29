---
mode: 'agent'
description: '建立 Spring Boot Java 專案骨架'
---

# 建立 Spring Boot Java 專案提示

- 請確保您的系統上安裝了以下軟體：

  - Java 21
  - Docker
  - Docker Compose

- 如果您需要自訂專案名稱，請在 [下載 Spring Boot 專案範本](./create-spring-boot-java-project.prompt.md#download-spring-boot-project-template) 中更改 `artifactId` 和 `packageName`。

- 如果您需要更新 Spring Boot 版本，請在 [下載 Spring Boot 專案範本](./create-spring-boot-java-project.prompt.md#download-spring-boot-project-template) 中更改 `bootVersion`。

## 檢查 Java 版本

- 在終端機中執行以下命令並檢查 Java 版本

```shell
java -version
```

## 下載 Spring Boot 專案範本

- 在終端機中執行以下命令以下載 Spring Boot 專案範本

```shell
curl https://start.spring.io/starter.zip \
  -d artifactId=${input:projectName:demo-java} \
  -d bootVersion=3.4.5 \
  -d dependencies=lombok,configuration-processor,web,data-jpa,postgresql,data-redis,data-mongodb,validation,cache,testcontainers \
  -d javaVersion=21 \
  -d packageName=com.example \
  -d packaging=jar \
  -d type=maven-project \
  -o starter.zip
```

## 解壓縮下載的檔案

- 在終端機中執行以下命令以解壓縮下載的檔案

```shell
unzip starter.zip -d ./${input:projectName:demo-java}
```

## 移除下載的 zip 檔案

- 在終端機中執行以下命令以刪除下載的 zip 檔案

```shell
rm -f starter.zip
```

## 變更目錄至專案根目錄

- 在終端機中執行以下命令以變更目錄至專案根目錄

```shell
cd ${input:projectName:demo-java}
```

## 新增額外依賴項

- 將 `springdoc-openapi-starter-webmvc-ui` 和 `archunit-junit5` 依賴項插入 `pom.xml` 檔案

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

## 新增 SpringDoc、Redis、JPA 和 MongoDB 配置

- 將 SpringDoc 配置插入 `application.properties` 檔案

```properties
# SpringDoc configurations
springdoc.swagger-ui.doc-expansion=none
springdoc.swagger-ui.operations-sorter=alpha
springdoc.swagger-ui.tags-sorter=alpha
```

- 將 Redis 配置插入 `application.properties` 檔案

```properties
# Redis configurations
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=rootroot
```

- 將 JPA 配置插入 `application.properties` 檔案

```properties
# JPA configurations
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=rootroot
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

- 將 MongoDB 配置插入 `application.properties` 檔案

```properties
# MongoDB configurations
spring.data.mongodb.host=localhost
spring.data.mongodb.port=27017
spring.data.mongodb.authentication-database=admin
spring.data.mongodb.username=root
spring.data.mongodb.password=rootroot
spring.data.mongodb.database=test
```

## 新增包含 Redis、PostgreSQL 和 MongoDB 服務的 `docker-compose.yaml`

- 在專案根目錄建立 `docker-compose.yaml` 並新增以下服務：`redis:6`、`postgresql:17` 和 `mongo:8`。

  - redis 服務應具有
    - 密碼 `rootroot`
    - 將埠 6379 映射到 6379
    - 將卷 `./redis_data` 掛載到 `/data`
  - postgresql 服務應具有
    - 密碼 `rootroot`
    - 將埠 5432 映射到 5432
    - 將卷 `./postgres_data` 掛載到 `/var/lib/postgresql/data`
  - mongo 服務應具有
    - initdb 根使用者名稱 `root`
    - initdb 根密碼 `rootroot`
    - 將埠 27017 映射到 27017
    - 將卷 `./mongo_data` 掛載到 `/data/db`

## 新增 `.gitignore` 檔案

- 將 `redis_data`、`postgres_data` 和 `mongo_data` 目錄插入 `.gitignore` 檔案

## 執行 Maven 測試命令

- 執行 maven clean test 命令以檢查專案是否正常運作

```shell
./mvnw clean test
```

## 執行 Maven 執行命令 (可選)

- (可選) `docker-compose up -d` 啟動服務，`./mvnw spring-boot:run` 執行 Spring Boot 專案，`docker-compose rm -sf` 停止服務。

## 讓我們一步一步來
