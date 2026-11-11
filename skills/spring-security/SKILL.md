---
name: 'spring-security'
description: '在 Spring Boot 3/4 應用程式中設定、測試與審查 Spring Security 6/7：SecurityFilterChain lambda DSL、方法安全性、帶有 JWT 的 OAuth2 資源伺服器、OIDC 登入、CSRF/CORS、密碼編碼、標頭、actuator 保護以及 MockMvc 安全性測試。在新增或審核驗證與授權時使用。'
---

# Spring Security

適用於 Spring Security 6.x（Spring Boot 3.x）與 7.x（Spring Boot 4.x）的實用指南。各主題的詳細資訊位於 `references/`。

## 安全性規則

- 絕不讀取、列印或提交秘密：`.env`、包含認證資訊的 `application-*.properties`、用戶端密鑰、私鑰、JWT 簽署金鑰。請透過環境變數或秘密管理器參照它們。
- 絕不要僅為了讓測試或展示通過而停用安全性（對所有路徑 `permitAll()`、對瀏覽器應用程式 `csrf.disable()`）。

## 首先：偵測版本

1. 尋找 Boot 版本（`pom.xml` 父項/BOM、`build.gradle(.kts)`、`libs.versions.toml`）並執行 `./mvnw dependency:tree -Dincludes=org.springframework.security` 或 `./gradlew dependencies --configuration runtimeClasspath` 以檢視 Spring Security 版本。
2. Boot 3.x -> Security 6.x；Boot 4.x -> Security 7.x。請勿混用指南：在 7.x 中，6.x 中已棄用的 API 已被移除（例如 `and()` 鏈結、`authorizeRequests`、`AntPathRequestMatcher`/`MvcRequestMatcher` 風格匹配器；請改用 lambda DSL 與 `requestMatchers(...)`）。升級時請查閱 docs.spring.io/spring-security 上的「新功能」與遷移頁面。
3. 識別應用程式類型：Servlet MVC（`SecurityFilterChain`）或 WebFlux（`SecurityWebFilterChain`、`@EnableWebFluxSecurity`）；具備工作階段的瀏覽器應用程式，或是無狀態 API。

## 核心設定

宣告一個 `SecurityFilterChain` Bean。`WebSecurityConfigurerAdapter` 已不再存在。

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**", "/public/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .csrf(csrf -> csrf.disable()); // 僅適用於無 Cookie 的無狀態權杖 API
        return http.build();
    }
}
```

經驗法則：

- 規則依序評估；將具體的匹配器置於前方，並以 `anyRequest().authenticated()` 作結（預設拒絕）。
- 當應用程式混合了 API 與瀏覽器使用者介面時，使用多個具備 `securityMatcher(...)` 與 `@Order` 的 `SecurityFilterChain` Bean。
- 加入 `@EnableMethodSecurity` 並在服務上使用 `@PreAuthorize`/`@PostAuthorize` 以取得細粒度的規則；請參閱 [方法安全性](references/method-security.md)。
- 驗證選擇：[OAuth2 資源伺服器與 JWT](references/oauth2-resource-server-jwt.md)、[OIDC 登入與 OAuth2 用戶端](references/oidc-login-oauth2-client.md)。
- 工作階段 vs 無狀態、CSRF、CORS、標頭：[Web 保護](references/csrf-cors-sessions-headers.md)。
- 密碼與使用者：[密碼編碼](references/password-encoding.md)。
- Actuator 端點：[Actuator 保護](references/actuator-protection.md)（若已安裝，亦可參閱 `spring-observability` 技能）。
- 測試：[測試安全性](references/testing-security.md)。
- 審查：[常見錯誤檢核清單](references/review-checklist.md)。

## 決策指南

| 情況 | 做法 |
|---|---|
| SPA/行動裝置/服務以 Bearer 權杖呼叫的 REST API | 資源伺服器 + JWT、無狀態、關閉 CSRF（無 Cookie 驗證） |
| 伺服器端轉譯應用程式或使用 SameSite Cookie 工作階段的 SPA | 表單登入或 OIDC 登入、工作階段、開啟 CSRF |
| 使用 BFF 模式的 SPA | 後端進行 OIDC 登入、傳遞工作階段 Cookie 至瀏覽器、透過 Cookie 儲存庫取得 CSRF 權杖 |
| 內部服務對服務通訊 | 用戶端認證流程 (Client Credentials)、接收端設定資源伺服器 |

## 相依性（透過 Boot BOM 固定版本，無明確版本號）

- Boot 3.x 上使用 `spring-boot-starter-security`，加上 `spring-boot-starter-oauth2-resource-server` 或 `spring-boot-starter-oauth2-client`。Boot 4.x 名稱：`spring-boot-starter-security-oauth2-resource-server` / `spring-boot-starter-security-oauth2-client`（舊名稱保留為已棄用別名）。
- 測試：在 Boot 3.x 上加入 `spring-security-test`（test 範圍）；在 Boot 4.x 上使用 `spring-boot-starter-security-test`（若使用相關 starter，再加上 `spring-boot-starter-security-oauth2-resource-server-test` / `-client-test`）以確保測試切片具備完整的安全測試輔助函式。

## 驗證

執行應用程式的測試加上特定於安全性的測試（請參閱 [測試安全性](references/testing-security.md)）。驗證未受保護的路徑是否傳回 401/403，受保護的路徑在具備正確身分證明文件時可成功存取，且 CSRF 可防止不安全的跨網站要求。

另請參閱（針對已安裝版本優先於本技能參考）：<https://docs.spring.io/spring-security/reference/>。
