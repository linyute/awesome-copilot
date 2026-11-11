# 保護 Actuator 端點

Actuator 端點可能會外洩設定、環境、堆積內容，並允許關機。請將它們視為管理員受攻擊面。

- 最小化暴露：`management.endpoints.web.exposure.include=health,info`（僅為爬取程式新增 `prometheus`/`metrics`）。
- 使用 `EndpointRequest` 設定規則（匯入：Boot 3.x `org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest`；Boot 4.x `org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest`；兩者皆經編譯驗證）：

```java
@Bean
@Order(1)
SecurityFilterChain actuator(HttpSecurity http) throws Exception {
    http.securityMatcher(EndpointRequest.toAnyEndpoint())
        .authorizeHttpRequests(a -> a
            .requestMatchers(EndpointRequest.to("health", "info")).permitAll()
            .anyRequest().hasRole("ACTUATOR_ADMIN"))
        .httpBasic(Customizer.withDefaults());
    return http.build();
}
```

- 定義任何 `SecurityFilterChain` 都會使 Boot 的預設鏈退讓，且上述鏈僅比對 Actuator 請求。永遠新增一個較低優先順序的 catch-all 鏈（搭配所選的驗證機制），否則每個非 Actuator 請求都不會比對到任何鏈而處於未受保護狀態：

```java
@Bean
@Order(2)
SecurityFilterChain application(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .httpBasic(Customizer.withDefaults()); // 或 formLogin / oauth2ResourceServer / oauth2Login
    return http.build();
}
```

- 絕不公開暴露 `env`、`configprops`、`heapdump`、`threaddump`、`loggers`、`shutdown`、`mappings`、`beans`。`heapdump` 可能包含秘密與個人資料。
- 考慮使用無法自網際網路存取的獨立管理連接埠（`management.server.port`）。
- 設定 `management.endpoint.health.show-details=when-authorized` 並設定 `show-components` 與角色。
- `env`/`configprops` 值的清理預設為開啟，但切勿完全依賴它。

關於健康探針、指標與追蹤，請參閱 `spring-observability` 技能。
