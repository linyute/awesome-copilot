---
name: quarkus-native-and-container
description: '建構 Quarkus 原生執行檔（Mandrel/GraalVM）、透過反射註冊修正原生執行失敗、測試原生二進位檔，並產出容器映像檔與 Kubernetes/OpenShift 資訊清單。在 Quarkus 專案中進行原生、Docker、Jib 或 Kubernetes 工作時使用。'
---

# Quarkus 原生與容器

請先檢查專案的 Quarkus 版本。對於一般（非 Quarkus）GraalVM 工作，若已安裝請使用選填的 `java-add-graalvm-native-image-support` 技能（否則請參閱 GraalVM 文件 <https://www.graalvm.org/latest/reference-manual/native-image/>）。

## 原生建構

```bash
# container build: no local GraalVM needed (Docker/Podman required)
./mvnw package -Dnative -Dquarkus.native.container-build=true
# local Mandrel/GraalVM (JAVA_HOME / GRAALVM_HOME must point to it)
./mvnw package -Dnative
# Gradle, Quarkus 3.10+ (add -Dquarkus.native.container-build=true without a local Mandrel)
./gradlew build -Dquarkus.native.enabled=true -Dquarkus.package.jar.enabled=false
# Gradle, older Quarkus
./gradlew build -Dquarkus.package.type=native
```

`quarkus.package.type` 在 3.10 中已棄用（3.10 移轉指南以 `quarkus.native.enabled` 與 `quarkus.package.jar.*` 取代它）；在 3.40 中仍接受此設定但會發出警告。透過 Gradle 驗證的版本門禁：在 3.9.5 上 `-Dquarkus.native.enabled=true -Dquarkus.package.jar.enabled=false` 會被忽略（「Unrecognized configuration key」警告）且僅建構出 JVM `quarkus-app`，而 `-Dquarkus.package.type=native` 則產出原生執行程式；在 3.10.0、3.27.6 與 3.40.1 上新索引鍵均能產出原生執行程式（3.10.0 亦接受帶有棄用警告的舊索引鍵）。在產生的 `pom.xml` 中的 Maven `native` 設定檔在傳遞 `-Dnative` 時已預設設定 `quarkus.native.enabled=true`、`quarkus.package.jar.enabled=false` 與 `skipITs=false`。

本機建構已在 macOS arm64 上搭配從 <https://github.com/graalvm/mandrel/releases> 取得的對應 Quarkus 版本的 Mandrel tarball 完成驗證（針對 3.40.1 為 `mandrel-java25-macos-aarch64-25.0.4.1-Final.tar.gz`，解壓縮至任意位置，`JAVA_HOME` 指向其 `Contents/Home`；Xcode 命令列工具即可）：3.40.1 Maven `package -Dnative` 約花費 70 秒，搭配兩個旗標的 Gradle `build` 約花費 2.5 分鐘；執行檔為 Mach-O 執行檔，啟動時間約 0.04 秒，且 `./mvnw verify -Dnative` 針對它成功執行了 `*IT`。Quarkus 會檢查 Mandrel/GraalVM 版本：3.40 拒絕 23.1（「Out of date version of GraalVM or Mandrel detected ... Quarkus currently supports 25.0.0」），因此在 3.40 上使用 Mandrel 25，在 3.27.6 上使用 `mandrel-java21-macos-aarch64-23.1.12.1-Final`（在該版本上 Maven `verify -Dnative` 與 Gradle 均已驗證）。

二進位檔：`target/*-runner`（Maven）或 `build/*-runner`（Gradle）。在 macOS 或 Windows 上的容器建構會產生無法在主機上執行的 Linux ELF：請在 Linux 容器中執行（例如 `docker run -v "$PWD/target:/w:ro" registry.access.redhat.com/ubi9/ubi-minimal /w/<name>-runner`，透過 `QUARKUS_DATASOURCE_*` 環境變數傳遞資料來源），並注意 `./mvnw verify -Dnative` 此時在 `*IT` 中會以 `Exit code is: '126'` 失敗。Mandrel 是 Red Hat 為 Quarkus 提供的 GraalVM 發行版本；容器建構會拉取與專案相符的 Mandrel 建構器映像檔（3.40.1 使用 `quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-25`，Mandrel 25.0.4.1，包含拉取映像檔約需 2.5 分鐘）；若有需要可使用 `quarkus.native.builder-image` 進行覆寫。原生建構速度較慢且耗費記憶體（數 GB）；請在 CI 或依需求執行，而非在每次測試執行時建構。

## 常見原生建構失敗

| 徵兆 | 修正方式 |
|---|---|
| 執行階段出現 `ClassNotFoundException` / `NoSuchMethodException`（反射、DTO 的 JSON 序列化） | 標註 `@RegisterForReflection`（或針對第三方型別在持有者類別上標註 `@RegisterForReflection(targets = ...)`），或在 `src/main/resources` 中放置 `reflection-config.json` 並設定 `quarkus.native.additional-build-args=-H:ReflectionConfigurationFiles=reflection-config.json` |
| 缺少資源檔案 | `quarkus.native.resources.includes=templates/**` |
| 函式庫不支援原生編譯 | 尋找 Quarkus 擴充功能，或選擇其他函式庫 |
| 在建構時初始化的類別發生損壞 | 透過 `quarkus.native.additional-build-args` 設定 `--initialize-at-run-time=...` |
| 建構期間出現 `OutOfMemoryError` | 增加容器記憶體或提高 `quarkus.native.native-image-xmx` |
| 動態代理 / 序列化 | 透過註釋或擴充功能進行註冊 |

```java
@RegisterForReflection(targets = ExternalDto.class)
public record ProductDto(String name) {}
```

偏好使用 Quarkus 擴充功能（它們會自動註冊反射）而非原始函式庫。已驗證：Panache + Quarkus REST 應用程式原生建構並搭配 record DTO 提供 JSON；Quarkus REST 會自行註冊傳回型別，因此 `@RegisterForReflection` 主要用於僅透過反射存取的型別（自訂序列化、第三方型別）。這兩列情況均在 3.40.1 上重現（本機 Mandrel 25）：呼叫 `Class.forName("org.acme.Hidden").getDeclaredConstructor().newInstance()` 的資源在原生二進位檔中傳回 HTTP 500 `ClassNotFoundException: org.acme.Hidden`，並在新增 `src/main/resources/reflection-config.json`（`[{ "name": "org.acme.Hidden", "allDeclaredConstructors": true }]`）搭配文件記載的 `-H:ReflectionConfigurationFiles=reflection-config.json`（相對檔案名稱自 `src/main/resources` 解析）後正常運作。對於執行階段初始化這一列，強制在建構時初始化的類別中的 `static final java.util.Random`（`--initialize-at-build-time=org.acme.Holder`）導致建構失敗並提示「Detected an instance of Random/SplittableRandom class in the image heap ... mark it explicitly for run time initialization with '--initialize-at-run-time=<culprit>'」；切換為 `--initialize-at-run-time=org.acme.Holder` 解決了此問題，亦可與反射旗標合併於單一逗點分隔的 `quarkus.native.additional-build-args` 中。Quarkus 產生的 native-image 功能會呼叫 `RuntimeClassInitialization.initializeAtBuildTime("")` 然後套用明確的執行階段覆寫，因此類別預設為建構時初始化。因此您自己的靜態初始化器（隨機種子、時鐘、環境變數讀取、執行緒）也可能導致此失敗，而不僅僅是函式庫。

## 測試原生二進位檔

```java
@QuarkusIntegrationTest
class GreetingResourceIT extends GreetingResourceTest {}
```

```bash
./mvnw verify -Dnative
```

`@QuarkusIntegrationTest` 黑箱測試在 `verify` 階段（Failsafe）針對原生二進位檔執行；無 CDI 插入。

## 容器映像檔

```bash
quarkus extension add container-image-jib      # or container-image-docker
./mvnw package -Dquarkus.container-image.build=true
./mvnw package -Dnative -Dquarkus.native.container-build=true -Dquarkus.container-image.build=true
```

`container-image-jib` 推送無需 Docker 常駐程式：在 `DOCKER_HOST` 指向不存在通訊端的情況下，`./mvnw package -Dquarkus.container-image.build=true -Dquarkus.container-image.push=true -Dquarkus.container-image.registry=localhost:5055 -Dquarkus.container-image.insecure=true -Dquarkus.container-image.group=acme` 將 `acme/q340m:1.0.0-SNAPSHOT` 推送至本機 `registry:2`（3.40.1，JVM 映像檔）。若無 `push=true`，Jib 會將映像檔載入本機 Docker/Podman，且在無可用執行階段時以 `Cannot get an executable name when no container runtime is available` 失敗。未找到或測試僅產生 tar 的輸出；推送的映像檔未進行執行。

手動建構的 Dockerfile 位於 `src/main/docker`（`Dockerfile.jvm`、`Dockerfile.native`、`Dockerfile.native-micro`）。設定 `quarkus.container-image.registry/group/name/tag`，並傳遞 `-Dquarkus.container-image.push=true` 進行推送。使用釘選的基底映像檔標籤並以非 root 身分執行。

## Kubernetes / OpenShift

```bash
quarkus extension add kubernetes     # or: quarkus extension add openshift
./mvnw package
```

資訊清單會產生於 `target/kubernetes/kubernetes.yml`（與 `.json`，適用於 `kubernetes` 擴充功能），以及 `target/kubernetes/openshift.yml`（適用於 `openshift`）。透過屬性自訂；前綴遵循目標（Kubernetes 為 `quarkus.kubernetes.*`，OpenShift 為 `quarkus.openshift.*`）：

```properties
quarkus.kubernetes.replicas=2
quarkus.kubernetes.ingress.expose=true
quarkus.kubernetes.env.secrets=app-secrets
quarkus.kubernetes.resources.requests.memory=128Mi
```

產生的 Deployment 預設沒有探針；安裝 `quarkus-smallrye-health` 後它會包含存活度、整備度與啟動探針（`/q/health/live`、`/q/health/ready`、`/q/health/started`），且它為 `env.secrets` 設定了 `envFrom.secretRef`（已在 3.40.1 上驗證）。使用 `quarkus.kubernetes.deploy=true` 或 `kubectl apply -f target/kubernetes/kubernetes.yml` 進行部署。在 OpenShift 上，使用位於 `quarkus.openshift.*` 底下的相同屬性，透過 `quarkus.openshift.route.expose=true` 將服務以 Route 公開（Kubernetes 改用 `quarkus.kubernetes.ingress.expose=true`），並使用 `oc apply -f target/kubernetes/openshift.yml`（或 `quarkus.openshift.deploy=true`）套用。在套用前檢視產生的 YAML；讓機密遠離它。

另請參閱：原生執行檔 <https://quarkus.io/guides/building-native-image>；透過 `quarkus update` 升級（<https://quarkus.io/guides/update-quarkus>）；GraalVM 版本資訊 <https://www.graalvm.org/release-notes/>。
