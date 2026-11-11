# 安全性基礎知識

## OIDC (Bearer 權杖 / Keycloak)

新增 `quarkus-oidc`。在 dev/test 中，未設定 `quarkus.oidc.auth-server-url` 時，Dev Services 會啟動 Keycloak 容器。

```properties
%prod.quarkus.oidc.auth-server-url=${OIDC_URL}
%prod.quarkus.oidc.client-id=${OIDC_CLIENT_ID}
quarkus.oidc.application-type=service
```

對於具有瀏覽器登入的 Web 應用程式，請使用 `quarkus.oidc.application-type=web-app`。對於不含識別提供者流程的純 JWT 驗證，請使用 `quarkus-smallrye-jwt`。

## 授權

```java
@Path("/admin")
@RolesAllowed("admin")
public class AdminResource { ... }
```

或路徑規則：

```properties
quarkus.http.auth.permission.secured.paths=/api/*
quarkus.http.auth.permission.secured.policy=authenticated
```
