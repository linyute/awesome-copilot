# 帶有 JWT 的 OAuth2 資源伺服器

相依性：`spring-boot-starter-oauth2-resource-server` (Boot 3.x) 或 `spring-boot-starter-security-oauth2-resource-server` (Boot 4.x)。

## 最小設定

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://issuer.example.com/realms/demo   # discovers JWKS, validates iss
          # or: jwk-set-uri: https://issuer.example.com/.well-known/jwks.json
          audiences: my-api                                    # validates aud (Boot 3.x+)
```

```java
http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
```

盡可能使用 `issuer-uri`：它會探索 JWKS 端點並自動設定簽章與發行者驗證。針對離線/本機開發金鑰才使用 `jwk-set-uri` 或 public key。

## 自訂 JwtDecoder

```java
@Bean
JwtDecoder jwtDecoder(OAuth2TokenValidator<Jwt> validator) {
    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation("https://issuer.example.com/realms/demo");
    decoder.setJwtValidator(validator);
    return decoder;
}

@Bean
OAuth2TokenValidator<Jwt> validator() {
    return new DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer("https://issuer.example.com/realms/demo"),
        new JwtClaimValidator<List<String>>("aud", aud -> aud != null && aud.contains("my-api")));
}
```

永遠驗證過期時間（預設）、發行者與對象。除非經過刻意設計，否則切勿接受 `alg: none` 或對稱金鑰。

## 映射角色與範圍

預設情況下 `scope`/`scp` 宣告會映射至 `SCOPE_*` 權限。若角色存在於自訂宣告中：

```java
@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
        Collection<GrantedAuthority> authorities = new ArrayList<>(scopes.convert(jwt));
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles != null) roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
        return authorities;
    });
    return converter;
}
```

註冊方式：`.oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter)))`。特定提供者的宣告位置（例如 Keycloak 的 `realm_access.roles`）需要明確擷取。

## 不透明權杖

當權杖不是 JWT 時，使用 `.oauth2ResourceServer(o -> o.opaqueToken(Customizer.withDefaults()))` 並搭配 `spring.security.oauth2.resourceserver.opaquetoken.introspection-uri`、`client-id` 與 `client-secret`（來自環境變數）。

## 備註

- 無狀態：與 `SessionCreationPolicy.STATELESS` 搭配使用。
- 401 vs 403：遺失/無效權杖會回傳帶有 `WWW-Authenticate` 的 401；缺少權限的有效權杖則回傳 403。
- 保持較短的權杖生命週期；絕不記錄權杖。
