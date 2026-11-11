---
description: '升級 Spring Boot 3.x 專案至 4.0 的 spring-boot-4-migration skill 指引'
applyTo: '**/pom.xml, **/build.gradle, **/build.gradle.kts, **/settings.gradle.kts, **/gradle/libs.versions.toml'
---

# Spring Boot 4.0 移轉

僅在使用者明確要求將 Spring Boot 3.x 移轉至 4（或修復由該移轉引起的失敗）時套用此內容。僅在建構檔案中編輯 Boot 版本是不夠的。3.x 內部的修補更新以及 4.0 到 4.1 的升級不在此涵蓋範圍內；針對這些升級，請遵循目標 Spring Boot 版本的[版本資訊](https://github.com/spring-projects/spring-boot/releases)與[升級指南](https://docs.spring.io/spring-boot/upgrading.html)，而非專注於 JDK 的 `java-upgrade` skill。

對於 3.x 到 4 的移轉，請使用 `spring-boot-4-migration` skill。它包含 Maven 和 Gradle 的完整工作流程與主題參考（starters、Jackson 3、測試、組態屬性、已移除的 API）。

- 先偵測目前的 Boot 版本，並在移至 4.0 之前先移轉至最新的 3.5.x。
- 在每個移轉步驟後執行建構與測試。
- 絕不讀取或列印機密資訊，例如 `.env` 檔案。

從此存放庫取得 skill：https://github.com/github/awesome-copilot/tree/main/skills/spring-boot-4-migration（使用 GitHub Copilot CLI 外掛程式市集安裝，或將資料夾複製至 `.github/skills/spring-boot-4-migration`）。