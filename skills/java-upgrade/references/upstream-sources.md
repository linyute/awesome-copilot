# 上游來源 (java-upgrade)

在編輯之前，請先擷取**目標**版本的頁面；若發生衝突，以官方頁面為準。將 `N` 替換為目標 JDK（17、21、25）。

## JDK

- OpenJDK 發行版本頁面（各版本的 JEP 清單）：<https://openjdk.org/projects/jdk/N/>（例如 <https://openjdk.org/projects/jdk/21/>、<https://openjdk.org/projects/jdk/25/>）
- JEP 索引：<https://openjdk.org/jeps/0>
- Oracle JDK 版本資訊（不相容變更、移除項目）：<https://www.oracle.com/java/technologies/javase/21-relnote-issues.html>（將 `21` 改為目標版本）
- Oracle JDK 遷移指引：<https://docs.oracle.com/en/java/javase/21/migrate/getting-started.html> 與 <https://docs.oracle.com/en/java/javase/25/migrate/getting-started.html>
- 尋找已移除或已廢棄的 API 使用處：`jdeprscan` <https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeprscan.html>、`jdeps` <https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdeps.html>
- Adoptium 支援與發行排程：<https://adoptium.net/support/>

## 建構工具與 Agent

- Gradle / JDK 相容性矩陣：<https://docs.gradle.org/current/userguide/compatibility.html>
- Maven Compiler Plugin（`release`、`--enable-preview`）：<https://maven.apache.org/plugins/maven-compiler-plugin/>
- Lombok 變更記錄：<https://projectlombok.org/changelog>
- Byte Buddy（供 Mockito/Hibernate 使用；檢查支援的 class 檔案版本）：<https://bytebuddy.net/>
- JaCoCo 變更項目（各版本的 JDK 支援）：<https://www.jacoco.org/jacoco/trunk/doc/changes.html>
- Mockito：<https://site.mockito.org/>

## 自動化 (OpenRewrite)

- `org.openrewrite.java.migrate.UpgradeToJava17`：<https://docs.openrewrite.org/recipes/java/migrate/upgradetojava17>
- `org.openrewrite.java.migrate.UpgradeToJava21`：<https://docs.openrewrite.org/recipes/java/migrate/upgradetojava21>
- `org.openrewrite.java.migrate.UpgradeToJava25`：<https://docs.openrewrite.org/recipes/java/migrate/upgradetojava25>

## 相關工具

- 外部 Microsoft 外掛程式 `modernize-java`（<https://github.com/microsoft/modernize-java>，列於本存放庫的 `plugins/external.json`）是自動化、大型或多步驟升級的更強大選項（升級計畫、建構修正迴圈、CVE 驗證）。本技能在沒有它的情況下也能運作；請參閱 `SKILL.md` 中的「需要更強大、自動化的升級嗎？」。
