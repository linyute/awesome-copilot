# 環境、CI、疑難排解、遷移

## Docker 可用性

Testcontainers 需要與 Docker-API 相容的常駐程式。使用 `docker info` 進行檢查。

- Docker Desktop、Rancher Desktop、Colima、OrbStack 與 Podman（相容 Docker 的通訊端 socket）均可運作。當 socket 為非標準路徑時，請設定 `DOCKER_HOST`（例如 `unix:///run/user/1000/podman/podman.sock`）；在無 root 權限的 Podman 下，若 Ryuk sidecar 無法掛載 socket，可能需要設定 `TESTCONTAINERS_RYUK_DISABLED=true`（此時需自行清理容器）。
- 設定可寫入 `~/.testcontainers.properties`（`docker.host=...`）或 `TESTCONTAINERS_*` 環境變數。
- macOS 上的 Colima：`DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` 與 `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`。
- 若無 Docker，測試會失敗並顯示「Could not find a valid Docker environment」。請修復環境，或使用 `@Testcontainers(disabledWithoutDocker = true)` 讓本機選用執行。

## CI

- GitHub Actions 的 `ubuntu-*` 執行器隨附 Docker；無需額外設定。自我裝載（self-hosted）執行器必須將 socket 開放給工作使用者。
- Docker-in-Docker CI（GitLab、容器化 Jenkins agent）：掛載主機 socket 或使用 DinD 服務並設定 `DOCKER_HOST`；若常駐程式主機不是 localhost，請設定 `TESTCONTAINERS_HOST_OVERRIDE`。
- 透過登錄檔鏡像（properties 中的 `hub.image.name.prefix` 或 `TESTCONTAINERS_HUB_IMAGE_NAME_PREFIX`）在多次執行間快取映像檔並避免 Docker Hub 速率限制。
- 私有登錄檔：`docker login`（`~/.docker/config.json` 中的憑證協助程式會被採用）。
- 請勿在 CI 中啟用容器重複使用。
- 失敗時印出容器記錄，並保持寬裕的逾時時間（大型映像檔建議設為 2 分鐘）。
- 分離單元測試與整合測試階段（搭配 `*IT` 的 `maven-failsafe-plugin`，或 Gradle `integrationTest` 任務）。

## 效能檢查清單

1. 跨類別共用 Singleton 容器（參閱 `lifecycle-and-reuse.md`）。
2. 鎖定標籤的小型映像檔（`-alpine`、slim）；在 CI 中預先提取。
3. 資料庫資料目錄使用 `withTmpFs`。
4. 截斷/復原而非重新啟動。
5. 平行啟動獨立容器（`Startables.deepStart(a, b, c).join()`、`org.testcontainers.lifecycle.Startables`）。
6. 若較輕量的替代方案能維持受測行為，請避免使用重量級服務。

## 常見錯誤

| 徵兆 | 可能原因 / 修正方式 |
| --- | --- |
| `Could not find a valid Docker environment` | 常駐程式未啟動或 socket 錯誤；設定 `DOCKER_HOST`。 |
| 容器啟動逾時 | 錯誤的等待策略、映像檔崩潰（閱讀 `getLogs()`）、資源不足；調高逾時時間。 |
| 啟動後立即連線被拒絕 | 連接埠已開啟但應用程式未就緒；使用 HTTP/記錄/健康檢查等待機制。 |
| 第一個類別成功，下一個類別失敗 | singleton 上的 `@Container` 在第一個類別結束後停止了容器；移除該標註。 |
| 容器無法連線至另一個容器 | 在網路內部使用了映射連接埠；請使用別名 + 內部連接埠。 |
| `ClassNotFoundException: ...containers.PostgreSQLContainer` | 2.x 套件遷移，請見下方。 |
| Ryuk 錯誤 | 無 root 權限/Podman socket 掛載問題；請參閱 Docker 可用性。 |
| Surefire `The exit has elapsed 30 seconds after System.exit(0)` / `going to kill self fork JVM` | 測試結束後 JVM 關閉勾點（shutdown hook）卡住（非 Testcontainers 專屬訊息）。在 JDK 21/25/27 上搭配 Testcontainers 2.0.5 + Surefire 3.5.5/3.5.6 + Docker Desktop 29.8，使用靜態 `@Container`、`@ServiceConnection` 與 Spring 管理的容器 bean 均未重現此問題（均在一秒內退出），因此 Docker Desktop、Ryuk 與 Testcontainers 2.x 本身並非主因。診斷方法：在 30 秒期間執行 `jstack <fork pid>`（或 `jcmd Thread.print`）並查看哪個勾點執行緒被封鎖（通常是應用程式或 Spring context 勾點正在關閉針對已不存在容器的連線池或用戶端，或是使用者註冊的勾點）；在容器停止前關閉此類資源，或將 `-Dsurefire.exitTimeout=<seconds>` 調低以快速失敗。 |

## 1.x 至 2.x 遷移

| 1.x | 2.x |
| --- | --- |
| `org.testcontainers:junit-jupiter` | `org.testcontainers:testcontainers-junit-jupiter` |
| `org.testcontainers:postgresql`（及其他模組） | `org.testcontainers:testcontainers-postgresql`（相同前綴規則） |
| `org.testcontainers.containers.PostgreSQLContainer<?>` | `org.testcontainers.postgresql.PostgreSQLContainer`（非泛型） |
| JUnit 4 `@Rule`/`@ClassRule` | 已移除；將測試遷移至 JUnit Jupiter |
| `DockerComposeContainer` | `ComposeContainer`（Compose v2） |
| 各模組獨立版本 | `testcontainers-bom` |

步驟：匯入 BOM、重新命名 artifacts、逐一修正各模組匯入（編譯器會標示每個搬移的類別）、移除模組容器型別的 `<?>`、轉換 JUnit 4 測試。檢查所使用模組的版本資訊；各模組的套件遵循 `org.testcontainers.<module>`。

文件：<https://java.testcontainers.org/>；發行版本：<https://github.com/testcontainers/testcontainers-java/releases>
