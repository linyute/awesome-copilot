---
description: '在 Maven 或 Gradle 建構檔案中變更 Java 版本時指向 java-upgrade 技能的指標'
applyTo: '**/pom.xml, **/build.gradle, **/build.gradle.kts'
---

# Java 版本升級

當任務變更此專案的 Java 版本（編譯器發行版本、工具鏈、`java.version`）時，請使用 `java-upgrade` 技能。它會偵測目前版本，並僅載入適用於 Java 11 → 17、17 → 21 或 21 → 25 的相符指南。

如果尚未安裝該技能，請使用 `gh skills install github/awesome-copilot java-upgrade` 進行安裝，或從此存放庫複製 `skills/java-upgrade/`。

- 一次升級一個 LTS 版本，並在每個步驟後執行完整測試套件。
- 在提高目標版本之前，請先檢查專案框架與相依性所支援的最低 Java 版本。
