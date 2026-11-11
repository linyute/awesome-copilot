# 安全性：OIDC、角色、JWT

擴充功能：`quarkus-oidc`（服務使用 Bearer Token，Web 應用程式使用授權碼流程）。在新增前請先詢問使用者。自行核發權杖的替代方案：`quarkus-smallrye-jwt`（`mp.jwt.verify.publickey.location`、`mp.jwt.verify.issuer`）。

## Keycloak Dev Service（已在 3.40.1 與 3.27.6 上驗證）

使用 `quarkus-oidc` 且未設定 `quarkus.oidc.auth-server-url` 時，開發/測試模式會啟動 Keycloak 並匯入帶有使用者 `alice`（admin、user）與 `bob`（user）、用戶端為 `quarkus-app` 的 `quarkus` realm。第一次啟動較慢（拉取映像檔約需 50 秒）。自訂角色：

```properties
quarkus.keycloak.devservices.roles.alice=admin,user
quarkus.keycloak.devservices.roles.bob=user
```

Dev UI（`/q/dev-ui`，OpenID Connect 卡片）可以登入並取得權杖。正式環境請從環境變數/機密存放區設定 `%prod.quarkus.oidc.auth-server-url=${OIDC_URL}`、`%prod.quarkus.oidc.client-id` 與 `credentials.secret`；切勿存入 git。

## Bearer（服務）與 Web 應用程式模式

- 預設 `quarkus.oidc.application-type=service`：預期 `Authorization: Bearer <jwt>`。
- 瀏覽器應用程式：`quarkus.oidc.application-type=web-app`（會話 Cookie，重導向至 IdP）。搭配 `quarkus.http.auth.permission.*` 設定路徑規則。

## 授權

```java
@Path("/secure")
public class SecuredResource {
    @Inject SecurityIdentity identity;

    @GET @Path("/me") @Authenticated
    public String me() { return identity.getPrincipal().getName(); }

    @GET @Path("/admin") @RolesAllowed("admin")
    public String admin() { return "admin ok"; }
}
```

已驗證結果：無權杖傳回 401；`alice` 的權杖在 `/secure/admin` 上獲得 200；`bob` 在該處獲得 403 且在 `/secure/me` 獲得 200。

- 預設安全：`quarkus.security.jaxrs.deny-unannotated-endpoints=true`（此處未驗證）。
- 細部權限檢查：使用帶有 `SecurityIdentity` 權限檢查器的 `@PermissionsAllowed("read")`，或 `@PermissionChecker` 方法（`quarkus-security`）；或插入 `SecurityIdentity` 並檢查 `identity.hasRole(...)`。此處未驗證。
- JWT 宣告（Claims）：插入 `org.eclipse.microprofile.jwt.JsonWebToken`（搭配 `quarkus-oidc`，`@Inject JsonWebToken jwt; jwt.getClaim("email")`）。預設角色查閱：若存在 `groups` 宣告則以其為準；否則為 Keycloak 的 `realm_access/roles`，且在設定用戶端 ID 時為 `resource_access/<quarkus.oidc.client-id>/roles`（帶有非空 `groups` 的權杖即使存在 realm 角色也會使用 groups）。使用 `quarkus.oidc.roles.role-claim-path` 覆寫。
- 使用使用者權杖呼叫下游服務：`quarkus-rest-client-oidc-token-propagation`；使用服務自身身分：`quarkus-rest-client-oidc-filter`。此處未驗證。

## 測試

- 單元測試風格：使用 `quarkus-test-security` 的 `@TestSecurity(user = "u", roles = "admin")`（已驗證：admin 為 200，其他角色為 403）。
- 針對 Dev Service 的真實權杖：`quarkus-test-keycloak-server` 提供 `io.quarkus.test.keycloak.client.KeycloakTestClient`；`given().auth().oauth2(new KeycloakTestClient().getAccessToken("alice"))`（已驗證）。亦請參閱 `quarkus-dev-services-and-testing`。
- Keycloak 容器需要 Docker；依賴它的測試應在存在容器的環境中執行。
