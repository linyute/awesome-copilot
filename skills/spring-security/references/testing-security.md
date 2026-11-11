# 測試 Spring Security

相依性：`org.springframework.security:spring-security-test`（test 範圍，版本由 Boot 管理）。在 Boot 4 中，使用模組化測試 starter（`spring-boot-starter-webmvc-test`、`spring-boot-starter-security-test`）。

`@WebMvcTest` 套件：Boot 3.x 為 `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest`；Boot 4.x 為 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`。將 `@MockBean` 替換為 `@MockitoBean`（Spring Framework 6.2+/7）。

## 切片測試（無狀態 API 設定）

這些測試使用無狀態資源伺服器設定（`SecurityConfig`：`csrf.disable()`、`SessionCreationPolicy.STATELESS`），因此不需要 CSRF 權杖。模擬 `JwtDecoder`（`org.springframework.security.oauth2.jwt.JwtDecoder`），讓過濾器鏈可以在沒有生產環境發行者設定或外部身分識別提供者的情況下初始化。`@WithMockUser` 為授權斷言提供驗證資訊；它不提供解碼器或測試 JWT 解碼。

```java
@WebMvcTest(AccountController.class)
@Import(SecurityConfig.class)   // 除非明確匯入，否則切片不會載入你的設定
class AccountControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean AccountService service;
    @MockitoBean JwtDecoder jwtDecoder;

    @Test void anonymousGets401() throws Exception {
        mvc.perform(get("/accounts")).andExpect(status().isUnauthorized());
    }

    @Test @WithMockUser(roles = "USER")
    void userGets403OnAdmin() throws Exception {
        mvc.perform(get("/admin/accounts")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "ADMIN")
    void adminOk() throws Exception {
        mvc.perform(get("/admin/accounts")).andExpect(status().isOk());
    }

    @Test @WithMockUser
    void postWithoutCsrfTokenIsAllowed() throws Exception {
        mvc.perform(post("/accounts")).andExpect(status().isCreated());
    }
}
```

## CSRF 測試（工作階段/瀏覽器設定）

每當瀏覽器自動附加認證資訊（工作階段 Cookie、HTTP Basic、用戶端憑證）時，CSRF 皆適用；它不適用於標頭中發送的明確 Bearer 權杖。請針對保留 CSRF 啟用的個別設定進行測試（預設值），絕不要針對上述無狀態的 `SecurityConfig` 進行測試：

```java
@Configuration
@EnableWebSecurity
class BrowserSecurityConfig {
    @Bean
    SecurityFilterChain browser(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a.anyRequest().authenticated())
            .formLogin(Customizer.withDefaults()); // CSRF protection stays enabled
        return http.build();
    }
}

@WebMvcTest(AccountController.class)
@Import(BrowserSecurityConfig.class)   // not SecurityConfig
class AccountControllerCsrfTest {

    @Autowired MockMvc mvc;
    @MockitoBean AccountService service;

    @Test @WithMockUser
    void postNeedsCsrf() throws Exception {
        mvc.perform(post("/accounts")).andExpect(status().isForbidden());
        mvc.perform(post("/accounts").with(csrf())).andExpect(status().isCreated());
    }
}
```

## 後處理器

- JWT 資源伺服器：`mvc.perform(get("/api/me").with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_read"))))` 或 `jwt().jwt(j -> j.claim("roles", List.of("admin")))`。
- OIDC 登入：`.with(oidcLogin().idToken(t -> t.claim("email", "a@b.c")))`；OAuth2 登入：`oauth2Login()`。
- 不透明權杖：`opaqueToken()`；基本驗證：`httpBasic("user", "pw")`；任意使用者：`user("u").roles("X")`。
- 方法安全性：在服務測試中使用 `@WithMockUser(roles = "ADMIN")`，或使用 `@WithUserDetails` 載入真實使用者。
- 完整堆疊測試：`@SpringBootTest @AutoConfigureMockMvc`（Boot 4 套件為 `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`）。搭配 `MockMvcTester`（AssertJ）時，同樣使用 `.with(...)`。
- 測試被拒絕的路徑應與允許的路徑一樣多；驗證失敗是最重要的行為。
