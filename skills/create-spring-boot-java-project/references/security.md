# 安全性基礎

對於超出基礎範圍的任何需求（OAuth2/OIDC、JWT 資源伺服器、方法安全性、CSRF/CORS 詳細資訊、安全性測試），請使用 `spring-security` 技能。本頁面涵蓋鷹架建置時的安全預設值。

## 相依性

在產生專案時新增 `security`（Boot 4：`spring-boot-starter-security`，若由 start.spring.io 產生，則在測試範圍加上 `spring-boot-starter-security-test`）。新增此相依性會在預設情況下保護每個端點。

## 最小化明確組態

```java
@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

}
```

- 針對本機開發，保留 Boot 產生的使用者與密碼編碼器設定。請勿單獨新增 `PasswordEncoder` bean：這會導致 Boot 產生的密碼維持未編碼狀態，且無法透過委派編碼器通過驗證。
- 預設拒絕：最後加上 `anyRequest().authenticated()`。
- 針對瀏覽器工作階段（sessions）保持啟用 CSRF；僅在無狀態權杖 API 中經審慎評估後停用。
- 針對正式環境密碼驗證，同時設定持續性使用者存放區與相符的 `PasswordEncoder`。使用 `PasswordEncoderFactories.createDelegatingPasswordEncoder()` 並儲存其編碼後的 `{id}hash` 數值，絕不儲存純文字。
- 請勿在本機實驗以外的場合使用 `{noop}` 密碼或 `InMemoryUserDetailsManager` 示範使用者。

## 安全預設值檢查清單

- [ ] 機密來自環境變數/機密存放區，絕不提交（參閱 [configuration.md](configuration.md)）
- [ ] 僅透過 HTTP 公開 `health` 與 `info`：`management.endpoints.web.exposure.include=health,info`
- [ ] 驗證輸入（`@Valid`、Bean Validation）並使用參數化查詢 / Spring Data
- [ ] 透過 RFC 9457 Problem Details 傳回錯誤回應：`spring.mvc.problemdetails.enabled=true`；不向用戶端輸出堆疊追蹤（`server.error.include-stacktrace=never`）
- [ ] 明確設定具備允許來源的 CORS，絕不在使用憑證時設為 `*`
- [ ] 在平台層終止 HTTPS；在 Proxy 後方設定 `server.forward-headers-strategy=framework`
- [ ] 保持相依性為最新；容器以非 root 使用者執行（參閱 [docker.md](docker.md)）
