# 出處（Provenance）

此技能及其參考資料改編自 Julien Dubois（本技能的貢獻者）的 **dr-jskill**。

- 來源：https://github.com/jdubois/dr-jskill
- 讀取的提交（Commit）：`29e71996048e4086bfa389268a3c6c2e49ea3f25`
- 來源授權條款：Apache License 2.0（https://www.apache.org/licenses/LICENSE-2.0）
- 改編後的內容由原作者（Julien Dubois，dr-jskill 的唯一版權所有人）依據本存放庫的 MIT 授權條款貢獻至此存放庫，且上游仍以 Apache-2.0 授權提供。重新散布改編後的檔案時，請保留署名與本聲明。

## 改編的檔案

| dr-jskill 中的來源檔案 | 改編為 |
|--------------------------|--------------|
| `SKILL.md` | `SKILL.md`（重寫、簡化、支援 Maven 與 Gradle） |
| `versions.json`、`scripts/lib/versions.mjs` | `references/versions.md`（記載的程序與遞補數值；未複製指令碼） |
| `references/CONFIGURATION.md` | `references/configuration.md`（精簡化） |
| `references/DATABASE.md` | `references/database.md`（精簡化；標註 Flyway/Liquibase 為選用） |
| `references/LOGGING.md` | `references/logging.md`（精簡化） |
| `references/SECURITY.md` | `references/security.md`（精簡至基礎概念） |
| `references/DOCKER.md`、`assets/Dockerfile`、`assets/Dockerfile-native` | `references/docker.md`、`assets/Dockerfile`、`assets/Dockerfile-native`（移除前端建構步驟） |
| `references/SPRING-BOOT-4.md` | `references/spring-boot-4.md`（精簡化） |

## 變更事項

進行了下列變更：內容已精簡、移除了前端、Azure、Git、CRaC 與 AOT 相關內容（延後處理）、新增了 Gradle 支援，並將指令碼替換為針對 start.spring.io 所記載的 `curl` 程序。
