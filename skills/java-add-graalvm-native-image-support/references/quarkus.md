# Quarkus 原生映像檔 (Quarkus native images)

Quarkus 由 `quarkus-native-and-container` skill 處理，該 skill 為原生建置、容器映像檔建置與 Kubernetes 資訊清單的單一事實來源。在偵測到該架構後請移交給它處理。

- 原生支援已內建於 Quarkus 中；不要新增 Native Build Tools 外掛。
- 容器建置 (`-Dquarkus.native.container-build=true`) 不需要本機 GraalVM 或 Mandrel，僅需要 Docker 或 Podman。
- 若未安裝 `quarkus-native-and-container` skill，請參閱 https://quarkus.io/guides/building-native-image。
