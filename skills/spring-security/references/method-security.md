# 方法安全性

在 `@Configuration` 類別上以 `@EnableMethodSecurity` 啟用（取代 `@EnableGlobalMethodSecurity`）。`@PreAuthorize`、`@PostAuthorize`、`@PreFilter`、`@PostFilter` 預設開啟；`@Secured` 與 JSR-250 需要 `securedEnabled = true` / `jsr250Enabled = true`。

```java
@Service
class DocumentService {

    @PreAuthorize("hasRole('ADMIN') or #owner == authentication.name")
    List<Document> findByOwner(String owner) { ... }

    @PreAuthorize("hasAuthority('SCOPE_documents.write')")
    void save(Document d) { ... }

    @PostAuthorize("returnObject.owner == authentication.name")
    Document load(Long id) { ... }
}
```

指引：

- `hasRole('ADMIN')` 會檢查權限 `ROLE_ADMIN`；`hasAuthority('SCOPE_x')` 則精確比對字串。JWT scope 預設會轉換為 `SCOPE_` 權限。
- 將註解置於服務層方法（或控制器）上，絕不要放在 private 方法或自我呼叫上：它們依賴代理機制，否則會被略過。
- 針對複雜規則偏好使用自訂 Bean：`@PreAuthorize("@documentAuth.canEdit(#id, authentication)")`。
- Meta 註解可保持規則易讀：`@Target(METHOD) @Retention(RUNTIME) @PreAuthorize("hasRole('ADMIN')") @interface IsAdmin {}`。
- 方法安全性是補充而非取代 URL 規則：請保留預設拒絕的過濾器鏈。
- 使用 `@WithMockUser` 進行測試（請參閱 [測試](testing-security.md)）；缺少代理機制會表現為在未經身分驗證的情況下測試通過。
