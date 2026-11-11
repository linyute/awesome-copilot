# Spring Boot 3.x 至 4.0 移轉指南

## 專案背景

本指南提供將 Spring Boot 專案從 3.x 版升級至 4.0 的完整 GitHub Copilot 指示，重點關注 Gradle Kotlin DSL、版本目錄（`libs.versions.toml`）以及 Kotlin 特有的考量。

**Spring Boot 4.0 的主要架構變更：**
- 採用聚焦、更小模組的模組化相依性結構
- 需要 Spring Framework 7.x
- Jakarta EE 11（以 Servlet 6.1 為基準）
- Jackson 3.x 移轉（套件命名空間變更）
- 需要 Kotlin 2.2+
- 全面的屬性重組

## 系統需求

### 最低版本要求

- **Java**：17+（偏好最新 LTS：Java 21 或 25）
- **Kotlin**：2.2.0 或更新版本
- **Spring Framework**：7.x（由 Spring Boot 4.0 管理）
- **Jakarta EE**：11（以 Servlet 6.1 為基準）
- **GraalVM**（用於原生映像檔）：25+
- **Gradle**：8.14+（Spring Boot 4 Gradle 外掛程式所必需；亦涵蓋 Kotlin DSL 與版本目錄）
- **Gradle CycloneDX 外掛程式**：3.0.0+

### 驗證相容性

```bash
# Check current versions
./gradlew --version
./gradlew dependencies --configuration runtimeClasspath
```

## 移轉前步驟

### 1. 升級至最新的 Spring Boot 3.5.x

在移轉至 4.0 之前，先升級至最新的 3.5.x 發行版本：

```kotlin
// libs.versions.toml
[versions]
springBoot = "3.5.x" # Latest 3.5 patch before migrating to 4.0 (look up the current one)
```

### 2. 清理棄用項目

移除 Spring Boot 3.x 中所有已棄用的 API 用法。這些在 4.0 中將會變成編譯錯誤：

```bash
# Build and review warnings
./gradlew clean build --warning-mode all
```

### 3. 審查相依性變更

將您的相依性對照以下內容進行比較：
- [Spring Boot 3.5.x 相依性版本](https://docs.spring.io/spring-boot/3.5/appendix/dependency-versions/coordinates.html)
- [Spring Boot 4.0.x 相依性版本](https://docs.spring.io/spring-boot/4.0/appendix/dependency-versions/coordinates.html)

