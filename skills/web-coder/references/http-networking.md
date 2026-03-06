# HTTP 與網路參考 (HTTP & Networking Reference)

HTTP 協定、網路概念以及網頁通訊的全面參考。

## HTTP (超文字傳輸協定)

用於在用戶端與伺服器之間傳輸超文字的協定。網頁資料通訊的基礎。

### HTTP 版本

- **HTTP/1.1** (1997)：基於文字、持久連線、管線化 (Pipelining)
- **HTTP/2** (2015)：二進位協定、多工 (Multiplexing)、伺服器推送 (Server push)、標頭壓縮
- **HTTP/3** (2022)：基於 QUIC (UDP)、改善效能、更佳的封包遺失處理

## 請求方法 (Request Methods)

| 方法 | 用途 | 冪等性 (Idempotent) | 安全性 (Safe) | 可快取性 (Cacheable) |
|--------|---------|------------|------|-----------|
| GET | 取得資源 | 是 | 是 | 是 |
| POST | 建立資源 | 否 | 否 | 極少情況 |
| PUT | 更新/取代資源 | 是 | 否 | 否 |
| PATCH | 部分更新 | 否 | 否 | 否 |
| DELETE | 刪除資源 | 是 | 否 | 否 |
| HEAD | 類似 GET 但無主體 | 是 | 是 | 是 |
| OPTIONS | 獲取允許的方法 | 是 | 是 | 否 |
| CONNECT | 建立通道 | 否 | 否 | 否 |
| TRACE | 回應要求 | 是 | 是 | 否 |

**安全性 (Safe)**：不會修改伺服器狀態  
**冪等性 (Idempotent)**：多次重複相同的請求與單次請求具備相同的效果

## 狀態碼 (Status Codes)

### 1xx 資訊 (Informational)

| 狀態碼 | 訊息 | 意義 |
|------|---------|---------|
| 100 | Continue | 用戶端應繼續發送請求 |
| 101 | Switching Protocols | 伺服器正在切換協定 |

### 2xx 成功 (Success)

| 狀態碼 | 訊息 | 意義 |
|------|---------|---------|
| 200 | OK | 請求成功 |
| 201 | Created | 資源已建立 |
| 202 | Accepted | 已接受但尚未處理 |
| 204 | No Content | 成功但無內容可回傳 |
| 206 | Partial Content | 部分資源（範圍要求） |

### 3xx 重新導向 (Redirection)

| 狀態碼 | 訊息 | 意義 |
|------|---------|---------|
| 301 | Moved Permanently | 資源已永久移至新位置 |
| 302 | Found | 暫時性重新導向 |
| 303 | See Other | 在不同的 URI 獲取回應 |
| 304 | Not Modified | 資源未修改（快取） |
| 307 | Temporary Redirect | 類似 302 但保留原始方法 |
| 308 | Permanent Redirect | 類似 301 但保留原始方法 |

### 4xx 用戶端錯誤 (Client Errors)

| 狀態碼 | 訊息 | 意義 |
|------|---------|---------|
| 400 | Bad Request | 語法無效 |
| 401 | Unauthorized | 需要進行驗證 |
| 403 | Forbidden | 存取被拒絕 |
| 404 | Not Found | 找不到資源 |
| 405 | Method Not Allowed | 不支援該方法 |
| 408 | Request Timeout | 請求逾時 |
| 409 | Conflict | 請求與目前狀態衝突 |
| 410 | Gone | 資源已永久移除 |
| 413 | Payload Too Large | 請求主體太大 |
| 414 | URI Too Long | URI 太長 |
| 415 | Unsupported Media Type | 不支援的媒體類型 |
| 422 | Unprocessable Entity | 語義錯誤 |
| 429 | Too Many Requests | 超過速率限制 |

### 5xx 伺服器錯誤 (Server Errors)

| 狀態碼 | 訊息 | 意義 |
|------|---------|---------|
| 500 | Internal Server Error | 通用型伺服器錯誤 |
| 501 | Not Implemented | 伺服器不支援該方法 |
| 502 | Bad Gateway | 來自上游的無效回應 |
| 503 | Service Unavailable | 伺服器暫時無法提供服務 |
| 504 | Gateway Timeout | 上游逾時 |
| 505 | HTTP Version Not Supported | 不支援該 HTTP 版本 |

## HTTP 標頭 (HTTP Headers)

### 請求標頭 (Request Headers)

```http
GET /api/users HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: application/json, text/plain
Accept-Language: en-US,en;q=0.9
Accept-Encoding: gzip, deflate, br
Authorization: Bearer token123
Cookie: sessionId=abc123
If-None-Match: "etag-value"
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
Origin: https://example.com
Referer: https://example.com/page
```

**常見請求標頭**：
- `Accept`：用戶端可接受的媒體類型
- `Accept-Encoding`：編碼格式（壓縮）
- `Accept-Language`：偏好語言
- `Authorization`：身份驗證認證資訊
- `Cache-Control`：快取指示
- `Cookie`：發送至伺服器的 Cookie
- `Content-Type`：請求主體的類型
- `Host`：目標主機與連接埠 (Port)
- `If-Modified-Since`：條件式請求
- `If-None-Match`：條件式請求 (ETag)
- `Origin`：請求來源 (CORS)
- `Referer`：前一個頁面的 URL
- `User-Agent`：用戶端資訊

### 回應標頭 (Response Headers)

```http
HTTP/1.1 200 OK
Date: Mon, 04 Mar 2026 12:00:00 GMT
Server: nginx/1.18.0
Content-Type: application/json; charset=utf-8
Content-Length: 348
Content-Encoding: gzip
Cache-Control: public, max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Mon, 04 Mar 2026 11:00:00 GMT
Access-Control-Allow-Origin: *
Set-Cookie: sessionId=xyz789; HttpOnly; Secure; SameSite=Strict
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

**常見回應標頭**：
- `Access-Control-*`：CORS 標頭
- `Cache-Control`：快取指示
- `Content-Encoding`：內容壓縮
- `Content-Length`：主體大小（位元組）
- `Content-Type`：主體的媒體類型
- `Date`：回應日期/時間
- `ETag`：資源版本識別碼
- `Expires`：到期日期
- `Last-Modified`：最後修改日期
- `Location`：重新導向 URL
- `Server`：伺服器軟體
- `Set-Cookie`：設定 Cookie
- `Strict-Transport-Security`：HSTS
- `X-Content-Type-Options`：防止 MIME 類型嗅探
- `X-Frame-Options`：點擊劫持防護

## CORS (跨來源資源共用)

允許跨來源請求的機制。

### 簡單請求 (Simple Requests)

若符合以下條件則自動允許：
- 方法：GET、HEAD 或 POST
- 僅限安全標頭
- Content-Type：`application/x-www-form-urlencoded`、`multipart/form-data` 或 `text/plain`

### 預檢請求 (Preflight Requests)

針對複雜請求，瀏覽器會先發送 OPTIONS 請求：

```http
OPTIONS /api/users HTTP/1.1
Origin: https://example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### CORS 標頭

**請求**：
- `Origin`：請求來源
- `Access-Control-Request-Method`：預定方法
- `Access-Control-Request-Headers`：預定標頭

**回應**：
- `Access-Control-Allow-Origin`：允許的來源 (* 或特定來源)
- `Access-Control-Allow-Methods`：允許的方法
- `Access-Control-Allow-Headers`：允許的標頭
- `Access-Control-Allow-Credentials`：是否允許認證資訊
- `Access-Control-Max-Age`：預檢請求快取時間
- `Access-Control-Expose-Headers`：用戶端可存取的標頭

## 快取 (Caching)

### 快取控制指示 (Cache-Control Directives)

**請求指示**：
- `no-cache`：使用快取前須與伺服器進行驗證
- `no-store`：完全不快取
- `max-age=N`：最大有效期限（秒）
- `max-stale=N`：接受最多逾期 N 秒的過時回應
- `min-fresh=N`：至少保持 N 秒的新鮮度
- `only-if-cached`：僅使用快取回應

**回應指示**：
- `public`：可由任何快取進行快取
- `private`：僅限瀏覽器進行快取
- `no-cache`：使用前務必驗證
- `no-store`：不要快取
- `max-age=N`：N 秒內維持新鮮
- `s-maxage=N`：共享快取的最大有效期限
- `must-revalidate`：過時後務必驗證
- `immutable`：內容不會變更

### 範例

```http
# 快取 1 小時
Cache-Control: public, max-age=3600

# 不要快取
Cache-Control: no-store

# 僅在瀏覽器快取，1 小時後重新驗證
Cache-Control: private, max-age=3600, must-revalidate

# 永久快取（用於具備版本號的 URL）
Cache-Control: public, max-age=31536000, immutable
```

### 條件式請求 (Conditional Requests)

使用 ETag 或 Last-Modified 進行高效快取：

```http
GET /resource HTTP/1.1
If-None-Match: "etag-value"
If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
```

若未修改：
```http
HTTP/1.1 304 Not Modified
ETag: "etag-value"
```

## 餅乾 (Cookies)

```http
# 伺服器設定 Cookie
Set-Cookie: sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600

# 用戶端發送 Cookie
Cookie: sessionId=abc123; userId=456
```

### Cookie 屬性

- `Path=/`：Cookie 的路徑範圍
- `Domain=example.com`：Cookie 的網域範圍
- `Max-Age=N`：N 秒後到期
- `Expires=date`：在特定日期到期
- `Secure`：僅透過 HTTPS 發送
- `HttpOnly`：無法透過 JavaScript 存取
- `SameSite=Strict|Lax|None`：CSRF 防護

## REST (具象狀態傳輸)

網頁服務的架構風格。

### REST 原則

1. **用戶端-伺服器 (Client-Server)**：關注點分離
2. **無狀態 (Stateless)**：每個請求包含所有必要的資訊
3. **可快取 (Cacheable)**：回應必須定義可快取性
4. **統一介面 (Uniform Interface)**：標準化通訊
5. **分層系統 (Layered System)**：用戶端不知道是否連線至最終伺服器
6. **依需求執行程式碼 (Code on Demand)**（選用）：伺服器可傳送可執行的程式碼

### RESTful API 設計

```
GET    /users           # 列出使用者
GET    /users/123       # 取得使用者 123
POST   /users           # 建立使用者
PUT    /users/123       # 更新使用者 123（完整更新）
PATCH  /users/123       # 更新使用者 123（部分更新）
DELETE /users/123       # 刪除使用者 123

GET    /users/123/posts # 列出使用者 123 的文章
GET    /posts?author=123 # 替代方案：篩選文章
```

### HTTP 內容協商 (Content Negotiation)

```http
# 用戶端要求 JSON
Accept: application/json

# 伺服器回應 JSON
Content-Type: application/json

# 用戶端可接受多種格式
Accept: application/json, application/xml;q=0.9, text/plain;q=0.8
```

## 網路基礎概念

### TCP (傳輸控制協定)

連線導向的協定，確保資料可靠傳遞。

**TCP 交握 (Handshake)**（三向）：
1. 用戶端 → 伺服器：SYN
2. 伺服器 → 用戶端：SYN-ACK
3. 用戶端 → 伺服器：ACK

**特性**：
- 可靠傳遞（重傳機制）
- 資料循序性
- 錯誤檢查
- 流量控制
- 連線導向

### UDP (使用者資料報協定)

非連線導向的協定，用於快速傳輸資料。

**特性**：
- 快速（無交握）
- 不保證傳遞
- 無循序性
- 較低的開銷
- 用於串流、遊戲、DNS

### DNS (網域名稱系統)

將網域名稱轉譯為 IP 位址。

```
example.com → 93.184.216.34
```

**DNS 記錄類型**：
- `A`：IPv4 位址
- `AAAA`：IPv6 位址
- `CNAME`：標準名稱 (Canonical name)（別名）
- `MX`：郵件交換 (Mail exchange)
- `TXT`：文字記錄
- `NS`：名稱伺服器 (Name server)

### IP 定址

**IPv4**：`192.168.1.1` (32 位元)  
**IPv6**：`2001:0db8:85a3:0000:0000:8a2e:0370:7334` (128 位元)

### 連接埠 (Ports)

- **知名連接埠 (Well-known ports)** (0-1023)：
  - 80: HTTP
  - 443: HTTPS
  - 21: FTP
  - 22: SSH
  - 25: SMTP
  - 53: DNS
- **已註冊連接埠 (Registered ports)** (1024-49151)
- **動態連接埠 (Dynamic ports)** (49152-65535)

### 頻寬 (Bandwidth) 與延遲 (Latency)

**頻寬**：單位時間內傳輸的資料量 (Mbps, Gbps)  
**延遲**：資料傳輸的時間延遲（毫秒）

**來回通訊時間 (RTT)**：請求到達伺服器並回傳回應所需的時間

## WebSockets

在單一 TCP 連線上進行全雙工通訊。

```javascript
// 用戶端
const ws = new WebSocket('wss://example.com/socket');

ws.onopen = () => {
  console.log('連線成功');
  ws.send('哈囉伺服器！');
};

ws.onmessage = (event) => {
  console.log('收到訊息：', event.data);
};

ws.onerror = (error) => {
  console.error('發生錯誤：', error);
};

ws.onclose = () => {
  console.log('連線已中斷');
};

// 關閉連線
ws.close();
```

**使用案例**：即時通訊、即時更新、遊戲、協作編輯

## 伺服器發送事件 (SSE)

伺服器透過 HTTP 將更新推送到用戶端。

```javascript
// 用戶端
const eventSource = new EventSource('/events');

eventSource.onmessage = (event) => {
  console.log('新訊息：', event.data);
};

eventSource.addEventListener('custom-event', (event) => {
  console.log('自訂事件：', event.data);
});

eventSource.onerror = (error) => {
  console.error('發生錯誤：', error);
};

// 關閉連線
eventSource.close();
```

```http
// 伺服器回應
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: 第一則訊息

data: 第二則訊息

event: custom-event
data: 自訂事件資料
```

## 最佳實踐

### 應做事項 (Do's)
- ✅ 處處強制執行 HTTPS
- ✅ 實作妥善的快取策略
- ✅ 使用適當的 HTTP 方法
- ✅ 回傳具備意義的狀態碼
- ✅ 實作速率限制
- ✅ 使用壓縮技術 (gzip, brotli)
- ✅ 設定正確的 CORS 標頭
- ✅ 實作適當的錯誤處理
- ✅ 使用連線池 (Connection pooling)
- ✅ 監控網路效能

### 禁忌事項 (Don'ts)
- ❌ 針對敏感資料使用 HTTP
- ❌ 忽略 CORS 安全性
- ❌ 回傳錯誤的狀態碼（例如：錯誤時回傳 200）
- ❌ 快取敏感資料
- ❌ 傳送大型且未壓縮的回應
- ❌ 跳過 SSL/TLS 憑證驗證
- ❌ 在 URL 中儲存認證資訊
- ❌ 在錯誤訊息中暴露內部伺服器細節
- ❌ 使用同步請求

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- Ajax
- ALPN
- 頻寬 (Bandwidth)
- 可快取 (Cacheable)
- 餅乾 (Cookie)
- CORS
- CORS 安全清單請求標頭 (CORS-safelisted request header)
- CORS 安全清單回應標頭 (CORS-safelisted response header)
- 網路爬蟲 (Crawler)
- 有效連線類型 (Effective connection type)
- Fetch 指示 (Fetch directive)
- Fetch Metadata 請求標頭 (Fetch metadata request header)
- 禁止的請求標頭 (Forbidden request header)
- 禁止的回應標頭名稱 (Forbidden response header name)
- FTP
- 一般標頭 (General header)
- 標頭阻塞 (HOL blocking)
- HTTP
- HTTP 內容 (HTTP content)
- HTTP 標頭 (HTTP header)
- HTTP/2
- HTTP/3
- HTTPS
- HTTPS RR
- 冪等 (Idempotent)
- IMAP
- 延遲 (Latency)
- 封包 (Packet)
- POP3
- 連接埠 (Port)
- 代理伺服器 (Proxy server)
- QUIC
- 速率限制 (Rate limit)
- 請求標頭 (Request header)
- 回應標頭 (Response header)
- REST
- 來回通訊時間 (RTT)
- RTCP
- RTP
- 安全 (HTTP 方法) (Safe (HTTP Methods))
- SMTP
- TCP
- TCP 交握 (TCP handshake)
- TCP 慢啟動 (TCP slow start)
- UDP
- WebSockets

## 額外資源

- [MDN HTTP 指南](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [HTTP/2 規格](https://http2.github.io/)
- [HTTP/3 原理解析](https://http3-explained.haxx.se/)
- [REST API 教學](https://restfulapi.net/)
