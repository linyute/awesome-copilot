---
mode: 'agent'
description: '建立 Spring Boot Kotlin 專案骨架'
---

# 建立 Spring Boot Kotlin 專案提示

- 請確保您的系統上安裝了以下軟體：

  - Java 21
  - Docker
  - Docker Compose

- 如果您需要自訂專案名稱，請在 [下載 Spring Boot 專案範本](./create-spring-boot-kotlin-project.prompt.md#download-spring-boot-project-template) 中更改 `artifactId` 和 `packageName`。

- 如果您需要更新 Spring Boot 版本，請在 [下載 Spring Boot 專案範本](./create-spring-boot-kotlin-project.prompt.md#download-spring-boot-project-template) 中更改 `bootVersion`。

## 檢查 Java 版本

- 在終端機中執行以下命令並檢查 Java 版本

```shell
java -version
```

## 下載 Spring Boot 專案範本

- 在終端機中執行以下命令以下載 Spring Boot 專案範本

```shell
curl https://start.spring.io/starter.zip \
  -d artifactId=${input:projectName:demo-kotlin} \
  -d bootVersion=3.4.5 \
  -d dependencies=configuration-processor,webflux,data-r2dbc,postgresql,data-redis-reactive,data-mongodb-reactive,validation,cache,testcontainers \
  -d javaVersion=21 \
  -d language=kotlin \
  -d packageName=com.example \
  -d packaging=jar \
  -d type=gradle-project-kotlin \
  -o starter.zip
```

## 解壓縮下載的檔案

- 在終端機中執行以下命令以解壓縮下載的檔案

```shell
unzip starter.zip -d ./${input:projectName:demo-kotlin}
```

## 移除下載的 zip 檔案

- 在終端機中執行以下命令以刪除下載的 zip 檔案

```shell
rm -f starter.zip
```

## 解壓縮下載的檔案

- 在終端機中執行以下命令以解壓縮下載的檔案

```shell
unzip starter.zip -d ./${input:projectName:demo-kotlin}
```

## 新增額外依賴項

- 將 `springdoc-openapi-starter-webmvc-ui` 和 `archunit-junit5` 依賴項插入 `build.gradle.kts` 檔案

```gradle.kts
dependencies {
  implementation("org.springdoc:springdoc-openapi-starter-webflux-ui:2.8.6")
  testImplementation("com.tngtech.archunit:archunit-junit5:1.2.1")
}
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

- 將 R2DBC 配置插入 `application.properties` 檔案

```properties
# R2DBC configurations
spring.r2dbc.url=r2dbc:postgresql://localhost:5432/postgres
spring.r2dbc.username=postgres
spring.r2dbc.password=rootroot

spring.sql.init.mode=always
spring.sql.init.platform=postgres
spring.sql.init.continue-on-error=true
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

- 將 `redis_data`、`postgres_data` 和 `mongo_data` 目錄插入 `.gitignore` 檔案

- 執行 gradle clean test 命令以檢查專案是否正常運作

```shell
./gradlew clean test
```

- (可選) `docker-compose up -d` 啟動服務，`./gradlew spring-boot:run` 執行 Spring Boot 專案，`docker-compose rm -sf` 停止服務。

讓我們一步一步來。
