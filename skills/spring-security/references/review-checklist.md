# 安全性審查檢核清單（常見錯誤）

- [ ] 僅使用 Lambda DSL 與 `requestMatchers`；不使用 `WebSecurityConfigurerAdapter`、`authorizeRequests`、`antMatchers`、`and()`。
- [ ] 預設拒絕（`anyRequest().authenticated()`），具體匹配器置於前方，縮小 `permitAll` 範圍。
- [ ] 針對 Cookie 驗證的應用程式保持 CSRF 開啟；CORS 列出明確來源（允許認證時不使用 `*`）。
- [ ] 驗證 JWT 發行者、對象與過期時間；刻意且明確地映射角色/範圍。
- [ ] Actuator 受限且受保護（無公開的 `env`、`heapdump`、`threaddump`、`shutdown`、`loggers`）。
- [ ] `@PreAuthorize` 僅套用於經 Proxy 代理、非內部自我呼叫的方法；存在 `@EnableMethodSecurity`。
- [ ] 測試涵蓋針對新端點的 401、403、成功以及 CSRF 情況。
