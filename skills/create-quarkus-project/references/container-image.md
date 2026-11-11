# 容器映像

## 基於擴充功能 (無需 Dockerfile)

```bash
quarkus extension add container-image-jib     # 或 container-image-docker
./mvnw package -Dquarkus.container-image.build=true
```

```properties
quarkus.container-image.group=myorg
quarkus.container-image.name=demo
quarkus.container-image.tag=1.0.0
# 推送：搭配 quarkus.container-image.registry=ghcr.io 使用 -Dquarkus.container-image.push=true
```

Jib 會自行建構映像 (已驗證：`myorg/demo:1.0.0`，192 MB，出現在本機 Docker 常駐程式中)。推送至登錄檔時不需要常駐程式；未指定 `push` 時它會載入至本機常駐程式。docker 擴充功能使用 `src/main/docker/Dockerfile.jvm` / `Dockerfile.native`。僅新增一個 `container-image-*` 擴充功能：若有多個，組建會因 `IllegalStateException` 而失敗 (已透過 jib + openshift 驗證)。

## 在 src/main/docker 中產生的 Dockerfile

- `Dockerfile.jvm` (fast-jar 配置)、`Dockerfile.legacy-jar`、`Dockerfile.native`、`Dockerfile.native-micro`。

```bash
./mvnw package
docker build -f src/main/docker/Dockerfile.jvm -t myorg/demo:jvm .
docker run -p 8080:8080 myorg/demo:jvm
```

以非 root 身分執行，透過環境變數 (`QUARKUS_DATASOURCE_JDBC_URL`, ...) 傳遞組態，並釘選基礎映像標籤。有關原生映像和 Kubernetes 資訊清單，請參閱 `quarkus-native-and-container` 技能。
