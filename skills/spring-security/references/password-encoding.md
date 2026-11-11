# 密碼編碼

暴露一個 `PasswordEncoder` Bean：`PasswordEncoderFactories.createDelegatingPasswordEncoder()`（儲存 `{id}hash`，預設為 bcrypt，驗證較舊格式；`upgradeEncoding`/`UserDetailsPasswordService` 會隨著時間推移遷移雜湊值）。

- bcrypt 會在 72 位元組處截斷輸入；對於長密碼語句，請考慮使用 Argon2（需要 Bouncy Castle `bcprov`）。在生產硬體上選擇大約 100-500 毫秒的成本。
- `User.withDefaultPasswordEncoder()` 與 `InMemoryUserDetailsManager` 僅供展示與測試使用；在生產環境請以資料庫支援 `UserDetailsService`。
- 對登入端點進行速率限制並使用通用錯誤訊息，以避免使用者列舉攻擊。
