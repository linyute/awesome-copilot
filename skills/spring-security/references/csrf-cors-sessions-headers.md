# 工作階段、CSRF、CORS、標頭

## 工作階段 vs 無狀態

- 瀏覽器應用程式：預設基於工作階段（`IF_REQUIRED`），工作階段固定攻擊保護已開啟。若需要，透過 `sessionManagement(s -> s.maximumSessions(1))` 限制並行工作階段。多執行個體部署請使用 Spring Session（Redis/JDBC）。
- 權杖 API：`SessionCreationPolicy.STATELESS`；無 `JSESSIONID`、無 Cookie 驗證。
- Cookie：`server.servlet.session.cookie.secure=true`、`http-only=true`、`same-site=lax`（或 `strict`）。

## CSRF

- 對於任何使用 Cookie/工作階段（表單登入、OIDC 登入）進行驗證的應用程式，保持 CSRF **啟用**。
- 僅對無狀態 Bearer 權杖 API 停用：`csrf(csrf -> csrf.disable())`，或透過 `csrf.ignoringRequestMatchers("/webhooks/**")` 忽略特定路徑（並以其他方式驗證，例如 HMAC 簽章）。
- 具備 Cookie 工作階段的 SPA：請自 [CSRF 參考文件](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa) 使用**所安裝 Spring Security 版本的完整 SPA 設定**。使用 `CookieCsrfTokenRepository.withHttpOnlyFalse()` 時，設定必須同時具體化延遲權杖以寫入 `XSRF-TOKEN` Cookie，並在保留轉譯權杖的 BREACH 保護的同時接受其在 `X-XSRF-TOKEN` 中的原始值。單純的 `CsrfTokenRequestAttributeHandler` 不會載入延遲權杖；請勿將其呈現為完整的 SPA 設定。
- 或者，保留基於工作階段的 CSRF 並暴露一個取得權杖的端點，例如傳回已解析 `CsrfToken`（包含 `token` 與 `headerName`）的 `GET /csrf`。若需要在登入前允許該端點，並讓用戶端在初始化時擷取它，並在登入/登出清除前一個權杖後再次擷取。在不安全的請求中以傳回的標頭名稱傳送傳回的權杖；切勿以未經處理的 Cookie 權杖取代受 BREACH 保護的回應權杖。
- 驗證權杖生命週期：遺失/無效的權杖會以 403 拒絕不安全的請求，而擷取全新的權杖則允許在驗證變更前後發出授權的請求。
- 絕不允許變更狀態的 GET 請求。

## CORS

在 Spring Security 中設定 CORS，以便在授權之前處理預檢請求：

```java
http.cors(Customizer.withDefaults());

@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOrigins(List.of("https://app.example.com"));
    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    c.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    c.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/api/**", c);
    return s;
}
```

- 絕不將 `allowedOrigins("*")` 與 `allowCredentials(true)` 結合使用（無效且會被拒絕）。明確列出受信任的來源。
- 在 MVC 中，Spring Security 的 CORS 會在安全過濾器鏈中處理預檢請求。

## 安全性標頭

預設情況下已經會傳送 `X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Strict-Transport-Security`、快取控制。在需要時進行自訂：

```java
http.headers(h -> h
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none'"))
    .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
    .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000)));
```

不要呼叫 `headers.disable()`。對生產環境的 Web 應用程式強制執行 HSTS（`max-age` 至少 1 年，包含子網域）。
