# Web 安全參考

> 來源：<https://developer.mozilla.org/en-US/docs/Web/Security>

## 概觀

Web 安全致力於保護敏感資訊（客戶資料、密碼、銀行資訊、內部演算法），防止未經授權的存取，以免導致競爭劣勢、服務中斷或客戶隱私遭侵犯。

## 安全 vs. 隱私

- **安全 (Security)**：保護私人資料和系統，防止未經授權的存取（包括內部和外部資料）。
- **隱私 (Privacy)**：讓使用者能夠控制資料的收集、儲存和使用，並保有透明度與同意權。

## 瀏覽器提供的安全功能

### 同源政策 (Same-Origin Policy, SOP) 與 CORS

- **同源政策**：限制來自某個來源的文件或指令碼與來自另一個來源的資源進行互動。
- **CORS** (跨來源資源共用, Cross-Origin Resource Sharing)：一種 HTTP 標頭機制，允許伺服器在需要時許可跨來源資源請求。

### HTTP 通訊安全

- **HTTPS/TLS**：在傳輸過程中加密資料，防止第三方攔截。
- **憑證透明度 (Certificate Transparency, CT)**：一個開放框架，透過公開記錄防止憑證誤發。

### 安全內容與功能權限

瀏覽器將「強大功能」（通知、網路攝影機、GPU、付款）限制於：

- 安全內容（透過 `window` 或 `worker` 進行 HTTPS/TLS 傳遞）。
- 透過 Permissions API 取得明確的使用者許可。
- 使用者啟動（暫時性啟動 -- 需要使用者執行點擊等動作）。

## 高階安全考量

### 1. 負責任地儲存用戶端資料

- 限制第三方 Cookie 的使用。
- 為移除跨站 Cookie 做好準備。
- 實作替代的持久化方法。

### 2. 保護使用者身分並管理登入

- 使用具有內建安全功能的知名框架。
- 實作**多因素驗證 (MFA)**。
- 使用專用 API：
  - Web Authentication API
  - Federated Credential Management (FedCM) API

**登入安全提示：**

- 強制執行強密碼策略。
- 教育使用者防範**網路釣魚 (Phishing)** 攻擊。
- 在登入頁面實作**速率限制 (Rate limiting)**。
- 使用 **CAPTCHA (驗證碼)** 挑戰。
- 使用唯一的工作階段 ID (Session ID) 管理工作階段。
- 閒置一段時間後自動登出。

### 3. 不要在 URL 查詢字串中包含敏感資料

- 避免在含有敏感資料的請求中使用 GET 方法（可能會透過 Referer 標頭被攔截）。
- 改用 POST 請求。
- 防範 CSRF 和重放攻擊。

### 4. 強制執行使用原則

- **內容安全原則 (Content Security Policy, CSP)**：控制可以從何處載入影像和指令碼；減輕 XSS 和資料插入攻擊。
- **Permissions Policy (權限原則)**：封鎖對特定「強大功能」的存取。

### 5. 維持資料完整性

- **子資源完整性 (Subresource Integrity, SRI)**：對擷取的資源（來自 CDN）進行加密雜湊驗證。
- **MIME 類型驗證**：使用 `X-Content-Type-Options` 標頭防止 MIME 探測 (sniffing)。
- **Access-Control-Allow-Origin**：管理跨來源資源共用。

### 6. 清理表單輸入

- **用戶端驗證**：使用 HTML 表單驗證提供即時回饋。
- **輸出編碼**：安全地顯示使用者輸入，而不將其作為程式碼執行。
- **伺服器端驗證**：至關重要；用戶端驗證很容易被規避。
- **轉義特殊字元**：防止執行碼插入（SQL 插入、JavaScript 執行）。

### 7. 防範點擊劫持 (Clickjacking)

- **X-Frame-Options**：HTTP 標頭，防止網頁在 `<frame>`、`<iframe>`、`<embed>` 或 `<object>` 中轉譯。
- **CSP frame-ancestors**：指定可以嵌入網頁的有效父代。

## 常見安全攻擊

| 攻擊 | 描述 |
|---|---|
| 點擊劫持 (Clickjacking) | 誘騙使用者點擊隱藏的 UI 元件 |
| 跨站指令碼 (Cross-Site Scripting, XSS) | 將惡意指令碼插入受信任的網站 |
| 跨站請求偽造 (Cross-Site Request Forgery, CSRF) | 強制已驗證的使用者執行不想要的動作 |
| 跨站洩漏 (Cross-Site Leaks, XS-Leaks) | 從側向管道推論使用者資訊 |
| SQL 插入 (SQL Injection) | 透過使用者輸入插入惡意 SQL |
| 網路釣魚 (Phishing) | 冒充受信任實體以竊取認證資訊 |
| 中間人攻擊 (Man-in-the-Middle, MITM) | 攔截兩方之間的通訊 |
| 伺服器端請求偽造 (Server-Side Request Forgery, SSRF) | 操縱伺服器發出非預期的請求 |
| 子網域奪取 (Subdomain Takeover) | 利用懸空的 DNS 記錄 |
| 供應鏈攻擊 (Supply Chain Attacks) | 危害第三方依賴項 |
| 原型污染 (Prototype Pollution) | 將屬性插入 JavaScript 物件原型 |

## 關鍵 HTTP 安全標頭

| 標頭 | 用途 |
|---|---|
| `Strict-Transport-Security` | 強制僅限 HTTPS 存取 |
| `X-Frame-Options` | 防止點擊劫持 |
| `X-Content-Type-Options` | 防止 MIME 探測 |
| `Content-Security-Policy` | 控制資源載入與 XSS 防護 |
| `Access-Control-Allow-Origin` | 管理 CORS |

## 實作指南

1. 內容安全原則 (CSP)
2. 跨來源資源共用 (CORS)
3. 子資源完整性 (SRI)
4. 傳輸層安全 (TLS)
5. 安全 Cookie 設定
6. MIME 類型驗證
7. 參照來源原則 (Referrer Policy)
8. 跨來源資源原則 (Cross-Origin Resource Policy, CORP)

## 身分驗證方法

- 通行密鑰 (Passkeys)
- 一次性密碼 (OTP)
- 同盟身分 (Federated identity)
- 密碼身分驗證

## 相關資源

- [網頁上的隱私](https://developer.mozilla.org/en-US/docs/Web/Privacy)
- [OWASP 速查表系列](https://cheatsheetseries.owasp.org/)
- [Mozilla 安全部落格](https://blog.mozilla.org/security/)
