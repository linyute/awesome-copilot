# OIDC 登入與 OAuth2 用戶端

相依性：`spring-boot-starter-oauth2-client` (Boot 3.x) 或 `spring-boot-starter-security-oauth2-client` (Boot 4.x；測試套件 `spring-boot-starter-security-oauth2-client-test`)。

## 使用 OIDC 提供者登入

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: ${OIDC_CLIENT_ID}
            client-secret: ${OIDC_CLIENT_SECRET}
            scope: openid,profile,email
        provider:
          keycloak:
            issuer-uri: https://issuer.example.com/realms/demo
```

```java
http
    .authorizeHttpRequests(a -> a.anyRequest().authenticated())
    .oauth2Login(Customizer.withDefaults())
    .logout(l -> l.logoutSuccessHandler(oidcLogoutHandler));
```

- 用戶端 ID/密鑰來自環境變數或秘密存放區；絕不要硬式編碼或列印出來。
- 常見的提供者（Google、GitHub、Facebook）僅需要 `client-id`/`client-secret`；Okta 與其他 OIDC 提供者還需要 `issuer-uri`。
- 使用 `OidcClientInitiatedLogoutSuccessHandler` 進行 RP 起始的登出。
- 對於公用用戶端，帶有 PKCE 的授權碼流程為預設值；切勿使用隱含流程或密碼流程。

## 映射權限

使用 `GrantedAuthoritiesMapper` Bean 或 `OAuth2UserService`/`OidcUserService` 進行自訂，將提供者宣告（群組、角色）轉換為 `ROLE_*` 權限。

## 呼叫其他 API (OAuth2 用戶端)

- Servlet 應用程式：設定 `OAuth2AuthorizedClientManager` 並將 `RestClient` 與 `OAuth2ClientHttpRequestInterceptor` 搭配使用，或將 `WebClient` 與 `ServletOAuth2AuthorizedClientExchangeFilterFunction` 搭配使用（`ServerOAuth2AuthorizedClientExchangeFilterFunction` 僅適用於 WebFlux）。
- 服務對服務通訊使用 `authorization-grant-type: client_credentials`。
- 請查閱 Spring Security 參考文件以了解你所使用版本中可用的確切 `RestClient` 支援。

## 工作階段與 BFF

OIDC 登入會產生 HTTP 工作階段；保持 CSRF 啟用並設定 Cookie（`SameSite`、`Secure`、`HttpOnly`），如 [Web 保護](csrf-cors-sessions-headers.md) 所述。
