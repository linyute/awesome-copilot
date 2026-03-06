# 超文字傳輸協定 (HTTP) 參考

這是一份整合式的參考指南，涵蓋了 HTTP 協定、其訊息、Cookie、身分驗證、工作階段 (sessions)、標頭、方法、狀態碼及規範。所有內容皆取材自 Mozilla 開發者網路 (MDN) 網頁文件。

---

## 目錄

1. [HTTP 概觀（簡介）](#1-http-overview)
2. [HTTP 概觀](#2-an-overview-of-http)
3. [HTTP 訊息](#3-http-messages)
4. [HTTP Cookies](#4-http-cookies)
5. [HTTP 身分驗證](#5-http-authentication)
6. [HTTP 工作階段](#6-http-sessions)
7. [HTTP 標頭參考](#7-http-headers-reference)
8. [HTTP 請求方法](#8-http-request-methods)
9. [HTTP 回應狀態碼](#9-http-response-status-codes)
10. [HTTP 資源與規範](#10-http-resources-and-specifications)

---

## 1. HTTP 概觀

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP>

### 定義

**HTTP (超文字傳輸協定, Hypertext Transfer Protocol)** 是一種用於傳輸超媒體文件（如 HTML）的應用程式層協定。雖然它是為網頁瀏覽器與網頁伺服器之間的通訊而設計的，但也被用於機器對機器的通訊以及程式化 API 存取。

### 關鍵特性

- **用戶端-伺服器模型 (Client-Server Model)**：一種經典的架構，用戶端開啟連線發出請求，並等待伺服器回應。
- **無狀態協定 (Stateless Protocol)**：伺服器不會在請求之間保留工作階段資料，但 Cookie 增加了狀態處理能力。
- **可擴充性**：建立在資源、URI 及基本訊息結構的概念之上；協定隨時間演進，加入了眾多擴充功能。

### 主要主題領域

#### 指南（基礎與進階）

- **HTTP 概觀** -- 基本功能與協定堆疊位置
- **HTTP 的演進** -- HTTP/0.9, 1.0, 1.1, 2.0, 及 3.0
- **HTTP 訊息** -- 請求/回應結構與類型
- **MIME 類型** -- Content-Type 標頭與標準
- **HTTP 快取** -- 方法與標頭控制
- **HTTP 身分驗證** -- 用戶端身分驗證
- **Cookie** -- 用於狀態管理的 Set-Cookie 與 Cookie 標頭
- **重新導向 (Redirections)** -- URL 轉發技術 (3xx 狀態碼)
- **條件式請求 (Conditional Requests)** -- 取決於驗證器的結果
- **範圍請求 (Range Requests)** -- 部分資源擷取
- **內容交涉 (Content Negotiation)** -- Accept 標頭與格式偏好
- **連線管理 (HTTP/1.x)** -- 持久連線與管線化 (pipelining)
- **協定升級** -- 升級至 HTTP/2, WebSocket
- **代理伺服器與通道 (Tunneling)**
- **用戶端提示 (Client Hints)** -- 裝置與偏好 Metadata
- **網路錯誤記錄 (Network Error Logging)** -- 失敗的擷取回報

#### 安全與隱私

- **權限原則 (Permissions Policy)** -- 控制功能存取
- **CORS (跨來源資源共用, Cross-Origin Resource Sharing)** -- 跨站請求處理
- **CSP (內容安全原則, Content Security Policy)** -- 資源載入限制與攻擊減輕
- **CORP (跨來源資源原則, Cross-Origin Resource Policy)** -- 推測執行側向管道攻擊防範

### 參考文件摘要

- **HTTP 標頭**：已記錄超過 169 個標頭，包括 `Content-Type`、`Accept`、`Authorization`、`Cache-Control`、`Set-Cookie`、`Cookie`、`Access-Control-Allow-Origin`、`Content-Security-Policy` 等。
- **HTTP 請求方法**：`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, `CONNECT`, `TRACE`。
- **HTTP 回應狀態碼**：分為五類 -- 1xx 資訊性、2xx 成功、3xx 重新導向、4xx 用戶端錯誤、5xx 伺服器錯誤。

### 工具與資源

- **Firefox 開發者工具** -- 網路監控
- **HTTP Observatory** -- 網站安全設定評估
- **RedBot** -- 快取標頭驗證
- **nghttp2** -- HTTP/2 用戶端/伺服器實作
- **curl** -- 命令列資料傳輸工具

---

## 2. HTTP 概觀

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview>

### 什麼是 HTTP？

HTTP 是一種用於擷取資源（例如 HTML 文件）的協定。它是網頁上任何資料交換的基礎，並作為**用戶端-伺服器協定 (client-server protocol)** 運作，其中請求由接收者（通常是網頁瀏覽器）發起。完整的文件是由多個資源構建而成的，包括文字、佈局指令、影像、影片和指令碼。

HTTP 是一種透過 TCP 或經 TLS 加密的 TCP 連線傳送的**應用程式層協定**。雖然它是在 1990 年代初期設計的，但它仍然具備可擴充性並持續演進。

### 架構：基於 HTTP 系統的元件

#### 用戶端：使用者代理 (User-Agent)

- 代表使用者的任何工具（主要是網頁瀏覽器）。
- **一律**由其發起請求；伺服器絕不會主動發起。
- 發送初始請求以擷取 HTML 文件，然後發送額外的請求以取得 CSS、指令碼和子資源。
- 解譯 HTTP 回應並將內容呈現給使用者。

#### 網頁伺服器

- 根據用戶端請求提供文件。
- 可能是一台虛擬機器，或是共享負載的一組伺服器。
- 透過 HTTP/1.1 和 `Host` 標頭，多個伺服器可以共用同一個 IP 位址。

#### 代理 (Proxies)

位於用戶端和伺服器之間，代理執行多種功能：

- **快取**（公開或私有，如瀏覽器快取）
- **過濾**（防毒、家長控制）
- **負載平衡**（將請求分配到多台伺服器）
- **身分驗證**（控制資源存取）
- **記錄 (Logging)**（儲存歷史資訊）

代理可以是**透明的**（不加修改地轉發請求）或**非透明的**（修改請求）。

### HTTP 的基本面向

#### HTTP 很簡單

- 通常設計為人類可讀。
- HTTP 訊息可以由人類閱讀和理解，為開發者提供了更容易的測試方式。

#### HTTP 是可擴充的

- **HTTP 標頭**使協定易於擴充和實驗。
- 只要用戶端和伺服器達成共識，即可引入新功能，這是 HTTP/1.0 中引入的概念。

#### HTTP 是無狀態的，但非無工作階段的

- **無狀態**：在同一個連線上的兩個連續請求之間沒有連結。
- 儘管如此，**HTTP Cookie** 仍可實現有狀態的工作階段，允許在請求之間共用上下文和狀態。

#### HTTP 與連線

HTTP 需要可靠的傳輸協定。TCP 是基於連線且可靠的，而 UDP 則不然。

- **HTTP/1.0**：為每對請求/回應開啟一個單獨的 TCP 連線（效率低下）。
- **HTTP/1.1**：透過 `Connection` 標頭引入了**管線化 (pipelining)** 和**持久連線 (persistent connections)**。
- **HTTP/2**：在單一連線上多工處理訊息以提高效率。
- **實驗性**：QUIC 協定正作為傳輸層進行測試（建立在 UDP 之上並具備可靠性）。

### HTTP 流程

當用戶端想要與伺服器通訊時：

1. **開啟一個 TCP 連線**：用於發送請求與接收答案。用戶端可以開啟新連線、重用現有連線，或同時開啟多個連線。

2. **發送 HTTP 訊息**：

   ```
   GET / HTTP/1.1
   Host: developer.mozilla.org
   Accept-Language: fr
   ```

3. **讀取回應**：

   ```
   HTTP/1.1 200 OK
   Date: Sat, 09 Oct 2010 14:28:02 GMT
   Server: Apache
   Last-Modified: Tue, 01 Dec 2009 20:18:22 GMT
   ETag: "51142bc1-7449-479b075b2891b"
   Accept-Ranges: bytes
   Content-Length: 29769
   Content-Type: text/html

   <!doctype html>... (29769 bytes of requested web page)
   ```

4. **關閉或重用連線**以供後續請求使用。

### 可透過 HTTP 控制的內容

- **快取**：伺服器指示代理和用戶端快取哪些內容以及快取多久。
- **放寬同源約束**：瀏覽器強制執行嚴格的同源隔離；HTTP 標頭可以透過 CORS 放寬此限制。
- **身分驗證**：受保護的頁面僅能透過 `WWW-Authenticate` 或 HTTP Cookie 被特定使用者存取。
- **代理與通道**：穿越網路屏障，透過代理處理 FTP 等協定。
- **工作階段**：HTTP Cookie 將請求與伺服器狀態連結，儘管是無狀態協定也能建立工作階段。

### 基於 HTTP 的 API

- **Fetch API**：目前最常用於從 JavaScript 發出 HTTP 請求的 API，取代了舊有的 `XMLHttpRequest` API。
- **伺服器傳送事件 (Server-Sent Events)**：一種單向服務，讓伺服器可以使用 HTTP 作為傳輸機制向用戶端發送事件。

---

## 3. HTTP 訊息

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages>

### 概觀

HTTP 訊息是伺服器與用戶端之間交換資料的機制。有兩種類型：

- **請求 (Requests)**：由用戶端發送以觸發伺服器上的動作。
- **回應 (Responses)**：伺服器對請求的回答.

HTTP/1.x 訊息是基於文字的，且易於閱讀。HTTP/2 將訊息包裝在二進位分幀 (binary framing) 中，但仍維持相同的底層語義。

### HTTP 訊息結構

請求與回應都共享一個通用的結構：

```
1. 起始行 (Start-line)（描述 HTTP 版本 + 請求方法或結果的單行文字）
2. HTTP 標頭 (Headers)（關於訊息的可選 Metadata）
3. 空行（標記 Metadata 的結束）
4. 主體 (Body)（與訊息關聯的可選資料）
```

**起始行**與**標頭**統稱為**標頭部 (head)**。之後的內容稱為**主體 (body)**。

### HTTP 請求

#### 請求行 (Request-Line) 格式

```
<method> <request-target> <protocol>
```

#### 元件

**方法 (HTTP Verb)**：描述請求的意義與預期結果。常見方法包括 `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, `CONNECT`。通常僅 `PATCH`, `POST`, 和 `PUT` 請求帶有主體。

**請求目標 (URL)** -- 根據上下文分為四種類型：

1. **Origin 形式**（最常見）：具有 Host 標頭的絕對路徑。
   ```http
   GET /en-US/docs/Web/HTTP/Guides/Messages HTTP/1.1
   ```

2. **絕對形式 (Absolute Form)**：完整 URL；用於代理伺服器。
   ```http
   GET https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages HTTP/1.1
   ```

3. **授權形式 (Authority Form)**：帶有冒號的授權和連接埠；用於 `CONNECT`。
   ```http
   CONNECT developer.mozilla.org:443 HTTP/1.1
   ```

4. **星號形式 (Asterisk Form)**：僅與 `OPTIONS` 搭配使用，代表整個伺服器。
   ```http
   OPTIONS * HTTP/1.1
   ```

**通訊協定 (HTTP Version)**：通常為 `HTTP/1.1`。在 HTTP/2+ 中，訊息中不包含協定版本。

#### 請求標頭

位於起始行之後、主體之前。不區分大小寫，後接冒號和值：

```http
Host: example.com
Content-Type: application/x-www-form-urlencoded
Content-Length: 49
```

**分類**：
- **請求標頭 (Request Headers)**：提供額外的上下文（例如條件式請求）。
- **表示標頭 (Representation Headers)**：描述訊息資料的原始形式以及套用的編碼。

#### 請求主體

僅適用於 `PATCH`, `POST`, 及 `PUT` 方法。範例：

**表單資料**：
```
name=FirstName+LastName&email=bsmth%40example.com
```

**JSON**：
```json
{
  "firstName": "Brian",
  "lastName": "Smith",
  "email": "bsmth@example.com"
}
```

**多部分表單資料 (Multipart form data)**：
```http
--delimiter123
Content-Disposition: form-data; name="field1"

value1
--delimiter123
Content-Disposition: form-data; name="field2"; filename="example.txt"

文字檔案內容
--delimiter123--
```

### HTTP 回應

#### 狀態行 (Status-Line) 格式

```
<protocol> <status-code> <reason-phrase>
```

#### 元件

- **通訊協定**：訊息的 HTTP 版本。
- **狀態碼**：指示請求成功或失敗的數字代碼。
  - 2xx 成功： `200 OK`, `201 Created`, `204 No Content`
  - 3xx 重新導向： `302 Found`, `304 Not Modified`
  - 4xx 用戶端錯誤： `400 Bad Request`, `404 Not Found`
  - 5xx 伺服器錯誤： `500 Internal Server Error`, `503 Service Unavailable`
- **原因短語 (Reason Phrase)**：可選的簡短文字描述，例如 "Created" 或 "Not Found"。

#### 回應標頭

隨回應傳送的 Metadata：

```http
Content-Type: application/json
Content-Length: 256
Cache-Control: max-age=604800
Date: Fri, 13 Sep 2024 12:56:07 GMT
```

#### 回應主體

包含在大多數訊息中。可能是：
- **單一資源主體**：由 `Content-Type` 和 `Content-Length` 標頭定義，或使用 `Transfer-Encoding: chunked` 分塊。
- **多資源主體**：包含不同資訊的多個部分，與 HTML 表單和範圍請求相關聯。

注意： `201 Created` 或 `204 No Content` 等狀態碼可能沒有主體。

### HTTP/2 訊息

與 HTTP/1.x 的關鍵差異：

- 將訊息包裝在二進位分幀中（更有效率）。
- 透過 HPACK 演算法進行標頭壓縮。
- **多工 (Multiplexing)**：單一 TCP 連線可用於多個併發請求與回應。
- 在協定層級消除了前頭阻塞 (head-of-line, HOL)。

HTTP/2 使用以 `:` 開頭的**虛擬標頭欄位 (pseudo-header fields)** 取代起始行：

**請求虛擬標頭**：
```
:method: GET
:scheme: https
:authority: www.example.com
:path: /
```

**回應虛擬標頭**：
```
:status: 200
```

### HTTP/3 考量因素

- 使用 QUIC（一種建立在 UDP 而非 TCP 之上的協定）。
- 解決了 TCP 層級的前頭阻塞問題。
- 縮短了連線建立時間。
- 增強了在不穩定網路上的穩定性。
- 維持相同的核心 HTTP 語義（方法、狀態碼、標頭）。

---

## 4. HTTP Cookies

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies>

### 什麼是 Cookie？

**Cookie**（網頁 Cookie 或瀏覽器 Cookie）是伺服器傳送給使用者網頁瀏覽器的一小塊資料。瀏覽器可能會儲存 Cookie、建立新 Cookie、修改現有 Cookie，並在隨後的請求中將其傳回給同一個伺服器。Cookie 使網頁應用程式能夠儲存少量的資料並記住狀態資訊。

### 主要使用案例

1. **工作階段管理**：使用者登入狀態、購物車內容、遊戲分數及其他與工作階段相關的詳細資訊。
2. **個人化**：使用者偏好，例如顯示語言和 UI 佈景主題。
3. **追蹤**：記錄並分析使用者行為。

### 設定 Cookie

#### 伺服器端 (HTTP 標頭)

使用 `Set-Cookie` 回應標頭：

```http
HTTP/2.0 200 OK
Content-Type: text/html
Set-Cookie: yummy_cookie=chocolate
Set-Cookie: tasty_cookie=strawberry
```

#### 用戶端 (JavaScript)

使用 `Document.cookie` 屬性：

```javascript
document.cookie = "yummy_cookie=chocolate";
document.cookie = "tasty_cookie=strawberry";
console.log(document.cookie);
// 記錄 "yummy_cookie=chocolate; tasty_cookie=strawberry"
```

### 傳送 Cookie

當對某個網域發出新請求時，瀏覽器會透過 `Cookie` 請求標頭自動傳送儲存的 Cookie：

```http
GET /sample_page.html HTTP/2.0
Host: www.example.org
Cookie: yummy_cookie=chocolate; tasty_cookie=strawberry
```

### Cookie 屬性

#### 壽命控制

**永久性 Cookie** 透過 `Expires` 或 `Max-Age` 在目前工作階段結束後繼續存在：

```http
Set-Cookie: id=a3fWa; Expires=Thu, 31 Oct 2021 07:28:00 GMT;
Set-Cookie: id=a3fWa; Max-Age=2592000
```

- `Expires`：指定到期日期/時間。
- `Max-Age`：指定持續秒數（優於 `Expires`；若兩者皆設定，則以此為準）。

**工作階段 Cookie** 會在目前工作階段結束時被刪除（未設定 `Max-Age` 或 `Expires` 屬性）。

#### 移除 Cookie

再次設定該 Cookie，並將 `Max-Age` 設為 0 或將 `Expires` 日期設為過去的時間，或者使用 `Clear-Site-Data` 標頭：

```http
Set-Cookie: id=a3fWa; Max-Age=0
Clear-Site-Data: "cookies"
```

#### 範圍控制

**Domain 屬性**：指定哪些網域可以接收該 Cookie。

```http
Set-Cookie: id=a3fWa; Domain=mozilla.org
```

- 若未指定：Cookie 會傳送給設定它的伺服器，但「不包含」子網域。
- 若已指定：會傳送給該網域及其所有子網域。

**Path 屬性**：指定請求 URL 中必須存在的 URL 路徑。

```http
Set-Cookie: id=a3fWa; Path=/docs
```

符合的路徑： `/docs`, `/docs/`, `/docs/Web/`, `/docs/Web/HTTP`。不符合的路徑： `/`, `/docsets`, `/fr/docs`。

#### 安全屬性

**Secure**：僅透過 HTTPS 傳送（絕不透過未加密的 HTTP 傳送，localhost 除外）。

```http
Set-Cookie: id=a3fWa; Secure
```

**HttpOnly**：防止透過 JavaScript 的 `Document.cookie` 存取；僅能透過 HTTP 請求存取。可減輕 XSS 攻擊。

```http
Set-Cookie: id=a3fWa; HttpOnly
```

**合併使用**：

```http
Set-Cookie: id=a3fWa; Expires=Thu, 21 Oct 2021 07:28:00 GMT; Secure; HttpOnly
```

#### SameSite 屬性

控制 Cookie 是否隨跨站請求傳送：

| 值 | 行為 |
|-------|----------|
| **Strict** | 僅在源自該 Cookie 原始網站的請求中傳送。用於敏感功能（身分驗證、購物車）。 |
| **Lax** | 隨網站導覽傳送，但不隨其他跨站請求傳送。若未設定 `SameSite`，則此為預設值。 |
| **None** | 同時隨原始請求與跨站請求傳送。需要 `Secure` 屬性。 |

### Cookie 前綴（深度防禦）

- **`__Secure-`**：必須由 HTTPS 頁面搭配 `Secure` 屬性設定。
- **`__Host-`**：必須搭配 `Secure` 屬性設定，不可包含 `Domain` 屬性，且必須包含 `Path=/`。
- **`__Http-`**：必須搭配 `Secure` 標籤設定，且必須包含 `HttpOnly` 屬性。

### 安全最佳實作

1. 在敏感的 Cookie 上使用 `Secure` 和 `HttpOnly` 屬性。
2. 適當地使用 `Domain` 和 `Path` 限制範圍。
3. 透過 `SameSite` 控制跨站請求。
4. 保持敏感 Cookie 的壽命短暫。
5. 在身分驗證時重新產生工作階段 Cookie，以防止工作階段固定 (session fixation) 攻擊。
6. 在 Cookie 中儲存不透明的識別碼 (opaque identifiers)，而非直接儲存敏感資料。
7. 使用 Cookie 前綴 (`__Secure-`, `__Host-`) 進行深度防禦。

### 儲存限制

- 每個網域的最大 Cookie 數量因瀏覽器而異，通常為數百個。
- 每個 Cookie 的最大大小通常為 4KB。
- 現代的用戶端儲存替代方案：Web Storage API (`localStorage`, `sessionStorage`) 與 IndexedDB。

### 隱私與第三方 Cookie

- 第三方 Cookie 由來自不同網域的嵌入式內容設定。
- 大多數瀏覽器廠商現在預設封鎖第三方 Cookie。
- **適用法規**：GDPR (歐盟)、ePrivacy 指令 (歐盟)、加州消費者隱私法 (美國)。

### 關鍵相關標頭

- `Set-Cookie` -- 伺服器設定 Cookie。
- `Cookie` -- 用戶端傳送 Cookie。
- `Clear-Site-Data` -- 清除 Cookie 與其他網站資料。

### 規範

RFC 6265 -- HTTP 狀態管理機制。

---

## 5. HTTP 身分驗證

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication>

### 通用 HTTP 身分驗證框架

HTTP 身分驗證定義於 **RFC 7235**，並提供了一個使用伺服器與用戶端之間的挑戰與回應 (challenge-and-response) 機制進行存取控制的框架。

#### 挑戰-回應流程

1. **伺服器挑戰**：伺服器回應 `401 Unauthorized` 狀態，並包含一個 `WWW-Authenticate` 回應標頭，其中包含身分驗證挑戰的詳細資訊。
2. **用戶端回應**：用戶端透過 `Authorization` 請求標頭提供憑證。
3. **重試**：用戶端通常向使用者顯示密碼提示，然後使用正確的憑證重新發出請求。

### 身分驗證標頭

#### WWW-Authenticate 與 Proxy-Authenticate

定義存取資源所需的身分驗證方法：

```http
WWW-Authenticate: <type> realm=<realm>
Proxy-Authenticate: <type> realm=<realm>
```

- `<type>`：身分驗證架構（例如 "Basic", "Bearer"）。
- `realm`：描述受保護的區域（例如 "Access to the staging site"）。

#### Authorization 與 Proxy-Authorization

包含向伺服器或代理伺服器進行身分驗證的憑證：

```http
Authorization: <type> <credentials>
Proxy-Authorization: <type> <credentials>
```

### 代理身分驗證

使用獨立的標頭與狀態碼：

- **狀態碼**： `407 Proxy Authentication Required`
- **回應標頭**： `Proxy-Authenticate`
- **請求標頭**： `Proxy-Authorization`

### 存取控制回應代碼

| 狀態碼 | 意義 | 用法 |
|--------|---------|-------|
| **401** | Unauthorized | 憑證無效；使用者可以重試 |
| **403** | Forbidden | 憑證有效但權限不足；無法重試 |
| **404** | Not Found | 有時用於向未經授權的使用者隱藏資源的存在 |
| **407** | Proxy Authentication Required | 代理身分驗證失敗 |

### 身分驗證架構

| 架構 | 參考 | 描述 |
|--------|-----------|-------------|
| **Basic** | RFC 7617 | Base64 編碼的 username:password（需要 HTTPS） |
| **Bearer** | RFC 6750 | OAuth 2.0 持用權杖 (bearer tokens) |
| **Digest** | RFC 7616 | MD5 或 SHA-256 雜湊 |
| **HOBA** | RFC 7486 | HTTP 基於來源的驗證 (數位簽章) |
| **Mutual** | RFC 8120 | 相互驗證 |
| **Negotiate/NTLM** | RFC 4559 | Windows 整合式驗證 |
| **VAPID** | RFC 8292 | 自願性應用程式伺服器識別 |
| **SCRAM** | RFC 7804 | 加鹽挑戰回應驗證機制 |
| **AWS4-HMAC-SHA256** | AWS 文件 | AWS 簽章版本 4 |

完整清單由 IANA 維護： <https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml>

### Basic 身分驗證架構

- **標準**： RFC 7617。
- **格式**：以 base64 編碼的配對 (`username:password`) 傳輸使用者 ID 和密碼。
- **字元集**： UTF-8。

**安全考量**：
- Base64 是可逆的；憑證以明文形式呈現。
- 務必將 Basic 驗證搭配 HTTPS/TLS 使用。
- 容易受到 CSRF 攻擊；無論來源為何，憑證都會在所有請求中傳送。

#### Apache 設定

`.htaccess` 檔案：

```apacheconf
AuthType Basic
AuthName "Access to the staging site"
AuthUserFile /path/to/.htpasswd
Require valid-user
```

#### Nginx 設定

```nginx
location /status {
    auth_basic           "Access to the staging site";
    auth_basic_user_file /etc/apache2/.htpasswd;
}
```

### 安全考量

- 跨來源影像無法觸發 HTTP 身分驗證對話方塊 (Firefox 59+)。
- 現代瀏覽器對使用者名稱和密碼使用 UTF-8 編碼。
- 已棄用 URL 嵌入式憑證 (`https://username:password@www.example.com/`)；現代瀏覽器在發送請求前會從 URL 中移除憑證。

---

## 6. HTTP 工作階段

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Session>

### 概觀

用戶端-伺服器協定中的 HTTP 工作階段包含**三個階段**：

1. 用戶端建立 TCP 連線（或適當的傳輸層連線）。
2. 用戶端發送請求並等待答案。
3. 伺服器處理請求，並傳回包含狀態碼和資料的回應。

自 HTTP/1.1 起，連線在完成後不再關閉，允許用戶端在不重新建立連線的情況下發出進一步的請求。

### 階段 1：建立連線

- 由**用戶端**發起連線（而非伺服器）。
- HTTP 通常使用 **TCP** 作為傳輸層。
- **預設通訊埠**：HTTP 伺服器為 80（也可以使用 8000, 8080 等其他連接埠）。
- 伺服器在沒有明確請求的情況下無法向用戶端發送資料，但可以使用 Push API、伺服器傳送事件或 WebSocket API 來克服此限制。

### 階段 2：發送用戶端請求

用戶端請求由以 CRLF 分隔的文字指令組成，分為三個區塊：

#### 區塊 1：請求行 (Request Line)

包含請求方法、文件路徑和 HTTP 協定版本。

#### 區塊 2：HTTP 標頭

關於資料類型、語言偏好、MIME 類型以及修改伺服器行為之資料的資訊。以一個空行結尾，將標頭與資料區塊分隔開來。

#### 區塊 3：可選資料區塊 (Optional Data Block)

包含額外資料，主要由 POST 方法使用。

**範例 GET 請求**：

```http
GET / HTTP/1.1
Host: developer.mozilla.org
Accept-Language: fr

```

**範例 POST 請求**：

```http
POST /contact_form.php HTTP/1.1
Host: developer.mozilla.org
Content-Length: 64
Content-Type: application/x-www-form-urlencoded

name=Joe%20User&request=Send%20me%20one%20of%20your%20catalogue
```

#### 常見請求方法

| 方法 | 用途 |
|--------|---------|
| **GET** | 請求指定資源的資料表示形式；應僅用於擷取資料 |
| **POST** | 向伺服器發送資料以變更其狀態；常用於 HTML 表單 |

### 階段 3：伺服器回應的結構

與請求類似，伺服器回應是由以 CRLF 分隔的文字指令組成，分為三個區塊：

#### 區塊 1：狀態行 (Status Line)

HTTP 版本確認、回應狀態碼及簡短的人類可讀意義。

#### 區塊 2：HTTP 標頭

關於所發送資料（類型、大小、壓縮、快取提示）的資訊。以空行結尾。

#### 區塊 3：資料區塊

選用的資料或回應內容。

**範例成功回應 (200 OK)**：

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 55743
Connection: keep-alive
Cache-Control: s-maxage=300, public, max-age=0
Content-Language: en-US
Date: Thu, 06 Dec 2018 17:37:18 GMT
ETag: "2e77ad1dc6ab0b53a2996dfd4653c1c3"
Server: meinheld/0.6.1
Strict-Transport-Security: max-age=63072000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Vary: Accept-Encoding,Cookie
Age: 7

<!doctype html>
<html lang="en">
  ...
</html>
```

**範例重新導向 (301)**：

```http
HTTP/1.1 301 Moved Permanently
Server: Apache/2.4.37 (Red Hat)
Content-Type: text/html; charset=utf-8
Location: https://developer.mozilla.org/
```

**範例錯誤 (404)**：

```http
HTTP/1.1 404 Not Found
Content-Type: text/html; charset=utf-8
Content-Length: 38217
```

---

## 7. HTTP 標頭參考

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers>

### 概觀

HTTP 標頭允許用戶端和伺服器隨 HTTP 請求和回應傳遞額外資訊。在 HTTP/1.X 中，標頭是不區分大小寫的名稱-值對（例如 `Allow: POST`）。在 HTTP/2 及以上版本中，標頭以小寫形式出現，且虛擬標頭帶有冒號前綴（例如 `:status: 200`）。

### 依上下文分類的標頭

- **請求標頭 (Request Headers)**：包含關於要擷取的資源或關於請求資源之用戶端的資訊。
- **回應標頭 (Response Headers)**：持有關於回應的額外資訊，例如位置或伺服器詳細資訊。
- **表示標頭 (Representation Headers)**：包含關於資源主體的資訊，包括 MIME 類型、編碼與壓縮。
- **負載標頭 (Payload Headers)**：包含關於負載資料的獨立於表示方式的資訊，包括內容長度與傳輸編碼。

### 依代理處理方式分類的標頭

- **端對端標頭 (End-to-End Headers)**：必須傳輸給最終接收者。中間代理必須原封不動地重新傳輸它們，且快取必須儲存它們。
- **逐跳標頭 (Hop-by-Hop Headers)**：僅對單個傳輸層連線有意義。代理不得重新傳輸它們，且快取不得儲存它們。

### 身分驗證標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `WWW-Authenticate` | 回應 | 定義存取資源的身分驗證方法 |
| `Authorization` | 請求 | 包含向伺服器驗證使用者代理的憑證 |
| `Proxy-Authenticate` | 回應 | 定義存取代理伺服器的身分驗證方法 |
| `Proxy-Authorization` | 請求 | 包含向代理伺服器驗證的憑證 |

### 快取標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Age` | 回應 | 物件在代理快取中存在的小秒數 |
| `Cache-Control` | 兩者皆可 | 請求與回應中快取機制的指令 |
| `Clear-Site-Data` | 回應 | 清除瀏覽資料（Cookie、儲存空間、快取） |
| `Expires` | 回應 | 回應被視為過期的日期/時間 |

### 條件標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Last-Modified` | 回應 | 資源最後修改日期 |
| `ETag` | 回應 | 識別資源版本的唯一字串 |
| `If-Match` | 請求 | 僅當資源符合給定 ETag 時才套用方法 |
| `If-None-Match` | 請求 | 若資源不符合給定 ETag 則套用方法 |
| `If-Modified-Since` | 請求 | 僅當在給定日期後修改過才傳輸資源 |
| `If-Unmodified-Since` | 請求 | 僅當在日期後未修改過才傳輸資源 |
| `Vary` | 回應 | 決定如何比對標頭以進行快取決策 |

### 連線管理標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Connection` | 兩者皆可 | 控制網路連線是否保持開啟 |
| `Keep-Alive` | 兩者皆可 | 控制持久連線保持開啟的時間 |

### 內容交涉標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Accept` | 請求 | 告知伺服器可接受的資料類型 |
| `Accept-Encoding` | 請求 | 指定可接受的壓縮演算法 |
| `Accept-Language` | 請求 | 告知伺服器偏好的人類語言 |
| `Accept-Patch` | 回應 | 廣告 PATCH 請求中可接受的媒體類型 |
| `Accept-Post` | 回應 | 廣告 POST 請求中可接受的媒體類型 |

### Cookie 標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Cookie` | 請求 | 包含先前由伺服器設定的 HTTP Cookie |
| `Set-Cookie` | 回應 | 從伺服器向使用者代理傳送 Cookie |

### CORS (跨來源資源共用) 標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Access-Control-Allow-Credentials` | 回應 | 指示回應是否可隨憑證公開 |
| `Access-Control-Allow-Headers` | 回應 | 列出跨來源請求中可用的 HTTP 標頭 |
| `Access-Control-Allow-Methods` | 回應 | 指定跨來源請求允許的方法 |
| `Access-Control-Allow-Origin` | 回應 | 指示回應是否可共用 |
| `Access-Control-Expose-Headers` | 回應 | 列出跨來源回應中公開的標頭 |
| `Access-Control-Max-Age` | 回應 | 預檢請求結果可被快取多久 |
| `Access-Control-Request-Headers` | 請求 | 列出實際請求（預檢）中使用的標頭 |
| `Access-Control-Request-Method` | 請求 | 列出實際請求（預檢）中使用的方法 |
| `Origin` | 請求 | 指示擷取的來源地 |
| `Timing-Allow-Origin` | 回應 | 指定允許查看 Resource Timing API 值的來源 |

### 訊息主體資訊標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Content-Length` | 兩者皆可 | 資源的大小（十進位位元組） |
| `Content-Type` | 兩者皆可 | 指示資源的媒體類型 |
| `Content-Encoding` | 回應 | 指定使用的壓縮演算法 |
| `Content-Language` | 回應 | 描述預期的人類語言 |
| `Content-Location` | 回應 | 指示傳回資料的替代位置 |
| `Content-Disposition` | 回應 | 指示資源應行內顯示或下載 |

### 範圍請求標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Accept-Ranges` | 回應 | 指示伺服器是否支援範圍請求 |
| `Range` | 請求 | 指示伺服器應傳回文件的哪一部分 |
| `If-Range` | 請求 | 建立條件式範圍請求 |
| `Content-Range` | 回應 | 指示部分訊息在完整主體中的位置 |

### 重新導向標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Location` | 回應 | 指示頁面要重新導向到的 URL |
| `Refresh` | 回應 | 指示瀏覽器重新載入頁面或重新導向 |

### 請求上下文標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `From` | 請求 | 包含控制請求之使用者的電子郵件地址 |
| `Host` | 請求 | 指定伺服器的網域名稱及選用的連接埠 |
| `Referer` | 請求 | 前一個網頁的地址 |
| `Referrer-Policy` | 回應 | 管理 Referer 標頭中的參照來源資訊 |
| `User-Agent` | 請求 | 識別應用程式類型與軟體版本 |

### 回應上下文標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Allow` | 回應 | 列出支援的 HTTP 請求方法 |
| `Server` | 回應 | 包含原始伺服器的軟體資訊 |

### 安全標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Cross-Origin-Embedder-Policy` (COEP) | 回應 | 允許伺服器宣告嵌入者原則 |
| `Cross-Origin-Opener-Policy` (COOP) | 回應 | 防止其他網域開啟/控制視窗 |
| `Cross-Origin-Resource-Policy` (CORP) | 回應 | 防止其他網域讀取回應 |
| `Content-Security-Policy` (CSP) | 回應 | 控制使用者代理可載入的資源 |
| `Content-Security-Policy-Report-Only` | 回應 | 監控 CSP 但不強制執行 |
| `Permissions-Policy` | 回應 | 允許/拒絕框架或 iframe 中的瀏覽器功能 |
| `Strict-Transport-Security` (HSTS) | 回應 | 強制使用 HTTPS 通訊 |
| `Upgrade-Insecure-Requests` | 請求 | 發出加密回應的偏好訊號 |
| `X-Content-Type-Options` | 回應 | 停用 MIME 探測 |
| `X-Frame-Options` (XFO) | 回應 | 指示頁面是否可在框架/iframe 中轉譯 |
| `X-XSS-Protection` | 回應 | 啟用跨站指令碼過濾 |

### 擷取 Metadata 請求標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Sec-Fetch-Site` | 請求 | 發起者與目標來源之間的關係 |
| `Sec-Fetch-Mode` | 請求 | 請求模式 (cors, navigate, no-cors, same-origin, websocket) |
| `Sec-Fetch-User` | 請求 | 導覽是否由使用者啟動所觸發 |
| `Sec-Fetch-Dest` | 請求 | 請求目的地 (audio, document, script, style, etc.) |

### 傳輸編碼標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Transfer-Encoding` | 回應 | 指定資源安全傳輸的編碼形式 |
| `TE` | 請求 | 指定可接受的傳輸編碼 |
| `Trailer` | 回應 | 允許在分塊訊息末尾加入額外欄位 |

### WebSocket 標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Sec-WebSocket-Accept` | 回應 | 指示願意升級至 WebSocket |
| `Sec-WebSocket-Extensions` | 兩者皆可 | 指示支援的 WebSocket 擴充功能 |
| `Sec-WebSocket-Key` | 請求 | 包含驗證 WebSocket 用戶端意圖的索引鍵 |
| `Sec-WebSocket-Protocol` | 兩者皆可 | 指示支援的 WebSocket 子通訊協定 |
| `Sec-WebSocket-Version` | 兩者皆可 | 指示 WebSocket 協定版本 |

### 代理標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Forwarded` | 兩者皆可 | 包含來自代理伺服器面向用戶端側的資訊 |
| `Via` | 兩者皆可 | 由代理加入；出現在請求與回應標頭中 |
| `X-Forwarded-For` | 請求 | 識別透過代理的原始 IP 位址（非標準） |
| `X-Forwarded-Host` | 請求 | 識別透過代理請求的原始主機（非標準） |
| `X-Forwarded-Proto` | 請求 | 識別透過代理使用的協定（非標準） |

### 其他值得注意的標頭

| 標頭 | 類型 | 描述 |
|--------|------|-------------|
| `Alt-Svc` | 回應 | 列出到達此服務的替代方式 |
| `Date` | 回應 | 訊息產生的日期/時間 |
| `Link` | 回應 | 在 HTTP 標頭中序列化一個或多個連結 |
| `Retry-After` | 回應 | 指示後續請求前的等待時間 |
| `Server-Timing` | 回應 | 溝通請求-回應週期的指標 |
| `Upgrade` | 請求 | 用於升級至不同的通訊協定 |
| `Priority` | 兩者皆可 | 提供關於資源請求優先順序的提示 |

---

## 8. HTTP 請求方法

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods>

HTTP 定義了一組請求方法，用於指示請求的目的以及成功時的預期結果。每種方法都有特定的語義和特性。

### GET

- **用途**：請求指定資源的表示形式。應僅用於擷取資料，不應包含請求內容。
- **安全性**： 是 | **等冪性**： 是 | **可快取性**： 是

### HEAD

- **用途**：要求與 GET 請求相同的回應，但沒有回應主體。用於僅擷取標頭而不下載完整資源。
- **安全性**： 是 | **等冪性**： 是 | **可快取性**： 是

### POST

- **用途**：將實體提交至指定資源，通常會導致伺服器上的狀態變更或副作用。用於建立新資源與提交資料。
- **安全性**： 否 | **等冪性**： 否 | **可快取性**： 條件性（當回應包含明確的有效性資訊且具有相符的 `Content-Location` 標頭時）

### PUT

- **用途**：使用請求內容取代目標資源的所有目前表示形式。用於更新整個資源。
- **安全性**： 否 | **等冪性**： 是 | **可快取性**： 否

### DELETE

- **用途**：刪除指定資源。
- **安全性**： 否 | **等冪性**： 是 | **可快取性**： 否

### CONNECT

- **用途**：建立導向目標資源所識別之伺服器的通道。用於為安全連線建立通道（例如透過代理伺服器的 HTTPS）。
- **安全性**： 否 | **等冪性**： 否 | **可快取性**： 否

### OPTIONS

- **用途**：描述目標資源的通訊選項。用於探索允許的方法與能力。
- **安全性**： 是 | **等冪性**： 是 | **可快取性**： 否

### TRACE

- **用途**：沿著通往目標資源的路徑執行訊息迴路測試。用於診斷與偵錯。
- **安全性**： 是 | **等冪性**： 是 | **可快取性**： 否

### PATCH

- **用途**：對資源套用部分修改（不同於全量取代的 PUT）。
- **安全性**： 否 | **等冪性**： 否 | **可快取性**： 條件性

### 方法特性總結

| 方法 | 安全性 | 等冪性 | 可快取性 |
|--------|------|------------|-----------|
| GET | 是 | 是 | 是 |
| HEAD | 是 | 是 | 是 |
| POST | 否 | 否 | 條件性 |
| PUT | 否 | 是 | 否 |
| DELETE | 否 | 是 | 否 |
| CONNECT | 否 | 否 | 否 |
| OPTIONS | 是 | 是 | 否 |
| TRACE | 是 | 是 | 否 |
| PATCH | 否 | 否 | 條件性 |

**安全方法**：不會修改伺服器狀態的方法 -- GET, HEAD, OPTIONS, TRACE。

**等冪方法**：多次呼叫產生相同結果的方法 -- GET, HEAD, OPTIONS, TRACE, PUT, DELETE。

**規範**：所有方法皆定義於 HTTP 語義 (RFC 9110)。

---

## 9. HTTP 回應狀態碼

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status>

HTTP 回應狀態碼指示 HTTP 請求是否已成功完成。回應根據其第一位數字分為五類。

### 1xx: 資訊性回應 (100-199)

| 代碼 | 狀態 | 描述 |
|------|--------|-------------|
| **100** | Continue | 臨時回應，指示用戶端應繼續請求，或若已完成則忽略 |
| **101** | Switching Protocols | 回應 `Upgrade` 請求標頭發送；指示伺服器正在切換的通訊協定 |
| **102** | Processing | （已棄用）用於 WebDAV 環境，指示已收到請求但尚無狀態 |
| **103** | Early Hints | 主要搭配 `Link` 標頭使用，允許使用者代理開始預先載入資源 |

### 2xx: 成功回應 (200-299)

| 代碼 | 狀態 | 描述 |
|------|--------|-------------|
| **200** | OK | 請求成功；意義取決於使用的 HTTP 方法 |
| **201** | Created | 請求成功且建立了新資源（通常在 POST 或 PUT 之後） |
| **202** | Accepted | 已收到請求但尚未採取行動；旨在用於非同步或批次操作 |
| **203** | Non-Authoritative Information | 傳回的 Metadata 來自本機或第三方副本，而非原始伺服器 |
| **204** | No Content | 無內容可發送，但標頭可能有用；使用者代理可更新快取的標頭 |
| **205** | Reset Content | 告知使用者代理重設發送此請求的文件 |
| **206** | Partial Content | 回應資源部分內容的範圍請求 |
| **207** | Multi-Status | (WebDAV) 傳達關於多個資源的多個狀態碼資訊 |
| **208** | Already Reported | (WebDAV) 用於避免重複列舉內部成員 |
| **226** | IM Used | 伺服器已履行套用了實例操作的 GET 請求 |

### 3xx: 重新導向訊息 (300-399)

| 代碼 | 狀態 | 描述 |
|------|--------|-------------|
| **300** | Multiple Choices | 請求有多個可能的回應；需要代理驅動的內容交涉 |
| **301** | Moved Permanently | 請求資源的 URL 已永久變更；回應中會給出新 URL |
| **302** | Found | 請求資源的 URI 暫時變更；未來請求仍應使用相同的 URI |
| **303** | See Other | 伺服器導向用戶端使用 GET 請求在另一個 URI 取得資源 |
| **304** | Not Modified | 用於快取；告知用戶端回應未經修改，繼續使用快取版本 |
| **307** | Temporary Redirect | 伺服器使用與原始請求相同的 HTTP 方法將用戶端導向另一個 URI |
| **308** | Permanent Redirect | 資源永久地位於另一個 URI；不得更改 HTTP 方法（類似 301 但更嚴格） |

### 4xx: 用戶端錯誤回應 (400-499)

| 代碼 | 狀態 | 描述 |
|------|--------|-------------|
| **400** | Bad Request | 由於用戶端錯誤（語法錯誤、無效分幀），伺服器無法處理請求 |
| **401** | Unauthorized | 用戶端必須驗證自身身分才能取得要求的回應 |
| **402** | Payment Required | 最初用於數位付款系統；極少使用且無標準慣例 |
| **403** | Forbidden | 用戶端缺乏存取權限；伺服器拒絕（不同於 401，用戶端身分已識別） |
| **404** | Not Found | 伺服器找不到要求的資源 |
| **405** | Method Not Allowed | 請求方法已知但目標資源不支援 |
| **406** | Not Acceptable | 伺服器找不到符合使用者代理指定標準的內容 |
| **407** | Proxy Authentication Required | 類似 401，但需要透過代理進行身分驗證 |
| **408** | Request Timeout | 連線閒置時發送；伺服器想關閉未使用的連線 |
| **409** | Conflict | 請求與伺服器的目前狀態衝突 |
| **410** | Gone | 要求的內容已從伺服器永久刪除，且無轉發地址 |
| **411** | Length Required | 伺服器拒絕請求，因為未定義 `Content-Length` 標頭 |
| **412** | Precondition Failed | 用戶端標頭中的前提條件未被伺服器滿足 |
| **413** | Content Too Large | 請求主體大於伺服器定義的限制 |
| **414** | URI Too Long | 用戶端請求的 URI 長度超過伺服器願意解譯的長度 |
| **415** | Unsupported Media Type | 要求的資料媒體格式不被伺服器支援 |
| **416** | Range Not Satisfiable | `Range` 標頭指定的範圍無法被履行 |
| **417** | Expectation Failed | 無法滿足 `Expect` 請求標頭指示的預期 |
| **418** | I'm a teapot | 伺服器拒絕使用茶壺沖泡咖啡的嘗試（愚人節 RFC 2324） |
| **421** | Misdirected Request | 請求導向至無法產生回應的伺服器 |
| **422** | Unprocessable Content | (WebDAV) 格式正確但由於語義錯誤而無法處理 |
| **423** | Locked | (WebDAV) 正在存取的資源已被鎖定 |
| **424** | Failed Dependency | (WebDAV) 由於前一個請求失敗而導致請求失敗 |
| **425** | Too Early | （實驗性）伺服器不願冒險處理可能被重放的請求 |
| **426** | Upgrade Required | 伺服器拒絕目前協定，但在用戶端升級後願意處理 |
| **428** | Precondition Required | 原始伺服器要求請求必須是條件式的 |
| **429** | Too Many Requests | 使用者在給定時間內發送了太多請求（速率限制） |
| **431** | Request Header Fields Too Large | 伺服器不願處理，因為標頭欄位太大 |
| **451** | Unavailable For Legal Reasons | 法律因素無法提供該資源 |

### 5xx: 伺服器錯誤回應 (500-599)

| 代碼 | 狀態 | 描述 |
|------|--------|-------------|
| **500** | Internal Server Error | 伺服器遇到不知道如何處理的情況 |
| **501** | Not Implemented | 伺服器不支援該請求方法 |
| **502** | Bad Gateway | 伺服器（作為閘道）從上游伺服器收到無效回應 |
| **503** | Service Unavailable | 伺服器尚未準備好處理請求（維護中、過載） |
| **504** | Gateway Timeout | 伺服器（作為閘道）無法及時取得回應 |
| **505** | HTTP Version Not Supported | 請求中使用的 HTTP 版本不被伺服器支援 |
| **506** | Variant Also Negotiates | 伺服器內部內容交涉設定錯誤 |
| **507** | Insufficient Storage | (WebDAV) 無法執行該方法；伺服器無法儲存表示形式 |
| **508** | Loop Detected | (WebDAV) 伺服器在處理請求時偵測到無限迴圈 |
| **510** | Not Extended | 用戶端請求宣告了不被支援的 HTTP 擴充 |
| **511** | Network Authentication Required | 用戶端需要驗證身分以取得網路存取權限 |

**規範**：狀態碼由 RFC 9110 定義。

---

## 10. HTTP 資源與規範

> **來源：** <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Resources_and_specifications>

### 核心 HTTP 規範

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 9110 | HTTP 語義 | 網際網路標準 |
| RFC 9111 | HTTP 快取 | 網際網路標準 |
| RFC 9112 | HTTP/1.1 | 網際網路標準 |
| RFC 9113 | HTTP/2 | 建議標準 |
| RFC 9114 | HTTP/3 | 建議標準 |

### HTTP 擴充與功能

| 資源 | 標題 | 狀態 |
|----------|-------|--------|
| RFC 5861 | 過期內容的 HTTP 快取控制擴充 | 資訊性 |
| RFC 8246 | HTTP 不可變回應 | 建議標準 |
| RFC 6265 | HTTP 狀態管理機制 (Cookies) | 建議標準 |
| RFC 2145 | HTTP 版本號碼的使用與解釋 | 資訊性 |
| RFC 6585 | 額外的 HTTP 狀態碼 | 建議標準 |
| RFC 7725 | 回報法律障礙的 HTTP 狀態碼 | 標準路徑上 |

### Cookie 相關規範

| 資源 | 標題 | 狀態 |
|----------|-------|--------|
| 草案 | Cookie 前綴 | IETF 草案 |
| 草案 | Same-Site Cookies | IETF 草案 |
| 草案 | 棄用從非安全來源修改 'secure' Cookie | IETF 草案 |

### URI 與網頁連結

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 2397 | "data" URL 配置 | 建議標準 |
| RFC 3986 | 統一資源識別碼 (URI)： 通用語法 | 網際網路標準 |
| RFC 5988 | 網頁連結 (定義 Link 標頭) | 建議標準 |

### 內容與資料處理

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 7578 | 從表單傳回值： multipart/form-data | 建議標準 |
| RFC 6266 | 在 HTTP 中使用 Content-Disposition 標頭欄位 | 建議標準 |
| RFC 2183 | 溝通呈現資訊： Content-Disposition 標頭欄位 | 建議標準 |

### 網路與協定擴充

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 7239 | Forwarded HTTP 擴充 | 建議標準 |
| RFC 6455 | WebSocket 通訊協定 | 建議標準 |

### 傳輸層安全 (TLS/HTTPS)

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 5246 | TLS 通訊協定版本 1.2 | 建議標準 |
| RFC 8446 | TLS 通訊協定版本 1.3 (取代 1.2) | 建議標準 |
| RFC 2817 | 在 HTTP/1.1 內升級至 TLS | 建議標準 |

### HTTP/2 與 HTTP/3 支援

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 7541 | HPACK： HTTP/2 的標頭壓縮 | 標準路徑上 |
| RFC 7838 | HTTP 替代服務 | 標準路徑上 |
| RFC 7301 | TLS 應用程式層協定交涉擴充 | 建議標準 |

### 安全與隱私

| 資源 | 標題 | 狀態 |
|----------|-------|--------|
| RFC 6454 | 網頁來源概念 | 建議標準 |
| Fetch 規範 | 跨來源資源共用 (CORS) | 現行標準 |
| RFC 7034 | HTTP 標頭欄位 X-Frame-Options | 資訊性 |
| RFC 6797 | HTTP 嚴格傳輸安全 (HSTS) | 建議標準 |
| W3C 規範 | 升級不安全請求 | 候選建議 |
| W3C 規範 | 內容安全原則等級 3 | 工作草案 |

### 額外與實驗性

| RFC | 標題 | 狀態 |
|-----|-------|--------|
| RFC 5689 | WebDAV 的 HTTP 擴充 | 建議標準 |
| RFC 7240 | HTTP 的 Prefer 標頭 | 建議標準 |
| RFC 7486 | HTTP 基於來源的驗證 (HOBA) | 實驗性 |

### 關鍵標準機構

- **IETF** -- 網際網路工程任務組 (RFC 規範)
- **W3C** -- 全球資訊網協會
- **WHATWG** -- 網頁超文字應用程式技術工作小組
- **WICG** -- 網頁孵化器社群小組
