---
name: java-upgrade
description: '將 Java 專案升級至較新的 JDK（11 至 17、17 至 21、21 至 25）並採用新的語言與函式庫功能。從建構檔案中偵測目前的 Java 版本，接著僅載入相符的各版本指引。當使用者要求升級 Java、現代化 Java 程式碼，或採用 record、sealed class、模式比對、虛擬執行緒或其他新的 Java 功能時使用。如需自動化的端對端升級，請參閱 modernize-java 外掛程式。'
---

# Java 升級

協助逐步升級 Java 專案並安全採用新的語言功能。

## 需要更強大、自動化的升級嗎？

Microsoft 外掛程式 [`modernize-java`](https://github.com/microsoft/modernize-java)（「GitHub Copilot modernization - Java Upgrade CLI Plugin」，亦列於本存放庫的 `plugins/external.json`）可從命令列升級 Java 應用程式。它能夠：

- 分析專案、評估依賴項，並產生可供檢視與編輯的自訂升級計畫；
- 執行計畫以自動轉換程式碼庫；
- 在升級期間修正建構問題並解決遷移錯誤，同時執行測試驗證；
- 在升級後對照已知 CVE 驗證應用程式；
- 輸出適合 PR 或 CI 記錄的詳細摘要（檔案變更、更新的依賴項、測試結果、剩餘問題）。

本技能提供輕量級、逐步的指引，且在沒有該外掛程式的情況下也能運作；該外掛程式是大型或多步驟升級的更強大選項。它是獨立的 Microsoft 外掛程式，不屬於本存放庫技能的一部分。若要試用（請參閱 [外掛程式 README](https://github.com/microsoft/modernize-java) 以取得建議的模型）：

```bash
npm install -g @github/copilot
copilot plugin marketplace add microsoft/modernize-java
copilot plugin install modernize-java@modernize-java
copilot --agent modernize-java:modernize-java
```

## 工作流程

1. **偵測目前與目標版本。** 讀取 `pom.xml`（`maven.compiler.release`、`java.version`、toolchains）、`build.gradle*`（`java.toolchain`、`sourceCompatibility`）與 CI 檔案。切勿假設目標版本：若未說明請詢問使用者。
2. **每次升級一個 LTS**（11 → 17 → 21 → 25）。在每個步驟後建構並執行測試。
3. **從下表中僅載入您需要的指引。** 請勿一次載入所有指引。
4. **先更新建構設定**（編譯器 release、外掛程式、需要較新版本的依賴項），然後以小幅度、易於審查的變更逐步採用語言功能。
5. **驗證**：執行 `./mvnw verify` 或 `./gradlew build`，並在採用新功能前修正棄用與移除警告。
6. **自動化並檢查上游資料。** 在可用時使用 OpenRewrite（例如 `org.openrewrite.java.migrate.UpgradeToJava21`），並在編輯前一律擷取特定版本的官方指引；審查產生的 diff。

## 上游來源（升級前必讀）

擷取目標版本的頁面；若發生衝突，以官方頁面為準。包含建構工具與 agent 相容性頁面的完整清單：[references/upstream-sources.md](references/upstream-sources.md)。

- OpenJDK 發行版本頁面：<https://openjdk.org/projects/jdk/21/>（變更版本號碼）與 JEP 索引 <https://openjdk.org/jeps/0>
- Oracle 遷移指引：<https://docs.oracle.com/en/java/javase/21/migrate/getting-started.html>
- Oracle 版本資訊：<https://www.oracle.com/java/technologies/javase/21-relnote-issues.html>
- `jdeprscan` / `jdeps`：<https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeprscan.html>、<https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeps.html>
- Gradle 相容性矩陣：<https://docs.gradle.org/current/userguide/compatibility.html>
- OpenRewrite：<https://docs.openrewrite.org/recipes/java/migrate/upgradetojava21>

## 各版本指引

| 升級路線 | 指引 |
|---|---|
| Java 11 → 17 | [references/java-11-to-17.md](references/java-11-to-17.md) |
| Java 17 → 21 | [references/java-17-to-21.md](references/java-17-to-21.md) |
| Java 21 → 25 | [references/java-21-to-25.md](references/java-21-to-25.md) |

## 規則

- 優先採用保留行為的重構；除非使用者要求，否則請勿變更公用 API。
- 偵測專案的架構（Spring Boot、Quarkus、Jakarta EE），並在調高目標版本前檢查其最低支援的 Java 版本。
- 除非使用者選擇加入且建構明確啟用，否則請勿採用預覽功能。
- 針對 `javax.*` 到 `jakarta.*` 命名空間變更，若已安裝 `javax-to-jakarta-migration` 技能請使用它（`gh skills install github/awesome-copilot javax-to-jakarta-migration`）；否則以內嵌方式進行遷移：更新匯入、`META-INF` 服務檔案與 XML 描述元，並將依賴項升級至 Jakarta EE 9+ 對應版本。
- 若已安裝 `modernize-java` 外掛程式且使用者想要自動化升級，請交由其處理，並將本技能用於各版本指引與 `javax` 到 `jakarta` 的防護措施。
