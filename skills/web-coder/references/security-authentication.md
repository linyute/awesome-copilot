# 安全性與驗證參考 (Security & Authentication Reference)

網頁安全性、驗證、加密以及安全程式設計實踐的全面參考。

## 網頁安全性基礎 (Web Security Fundamentals)

### CIA 三要素 (CIA Triad)

資訊安全的核心原則：
- **機密性 (Confidentiality)**：僅限授權方存取資料
- **完整性 (Integrity)**：資料保持準確且未經修改
- **可用性 (Availability)**：系統與資料在需要時可供使用

### 安全性標頭 (Security Headers)

```http
# 內容安全性原則 (Content Security Policy)
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com 'nonce-<random-base64-value>'; style-src 'self' 'nonce-<random-base64-value>'; object-src 'none'

# HTTP 嚴格傳輸安全性 (HTTP Strict Transport Security)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# X-Frame-Options (點擊劫持防護)
X-Frame-Options: DENY

# X-Content-Type-Options (MIME 嗅探)
X-Content-Type-Options: nosniff

# X-XSS-Protection (舊版，建議使用 CSP 代替)
X-XSS-Protection: 1; mode=block

# Referrer-Policy
Referrer-Policy: strict-origin-when-cross-origin

# Permissions-Policy
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### CSP (內容安全性原則)

緩解 XSS 與資料隱碼攻擊。

**指示 (Directives)**：
- `default-src`：其他指示的後備方案
- `script-src`：JavaScript 來源
- `style-src`：CSS 來源
- `img-src`：圖片來源
- `font-size`：字體來源
- `connect-src`：Fetch/XMLHttpRequest 目的地
- `frame-src`：iframe 來源
- `object-src`：外掛程式來源

**值**：
- `'self'`：同源
- `'none'`：封鎖所有來源
- `'unsafe-inline'`：允許行內指令碼/樣式（應避免）
- `'unsafe-eval'`：允許 eval()（應避免）
- `https:`：僅限 HTTPS 來源
- `https://example.com`：特定網域

## HTTPS 與 TLS

### TLS (傳輸層安全性)

加密用戶端與伺服器之間傳輸中的資料。

**TLS 交握 (Handshake)**：
1. 用戶端問候 (Client Hello)（支援的版本、加密套件）
2. 伺服器問候 (Server Hello)（選擇的版本、加密套件）
3. 伺服器憑證
4. 金鑰交換
5. 完成（連線建立）

**版本**：
- TLS 1.0, 1.1（已遭取代）
- TLS 1.2（目前的標準）
- TLS 1.3（最新版本，速度更快）

### SSL 憑證

**類型**：
- **網域驗證 (DV)**：基本驗證
- **組織驗證 (OV)**：業務驗證
- **延伸驗證 (EV)**：嚴格驗證

**憑證授權單位 (Certificate Authority)**：核發憑證的受信任實體

**自我簽署 (Self-Signed)**：不被瀏覽器信任（僅限開發/測試使用）

### HSTS (HTTP 嚴格傳輸安全性)

強制瀏覽器使用 HTTPS：

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- `max-age`：持續時間（秒）
- `includeSubDomains`：套用至所有子網域
- `preload`：提交至瀏覽器預載清單

## 驗證 (Authentication)

### 驗證 (Authentication) vs 授權 (Authorization)

- **驗證**：核對身分（「您是誰？」）
- **授權**：核對權限（「您可以做什麼？」）

### 常見驗證方法

#### 1. 基於工作階段的驗證 (Session-Based Authentication)

```javascript
// 登入
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // 驗證認證資訊
  if (verifyCredentials(username, password)) {
    req.session.userId = user.id;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '認證資訊無效' });
  }
});

// 受保護的路由
app.get('/profile', requireAuth, (req, res) => {
  const user = getUserById(req.session.userId);
  res.json(user);
});

// 登出
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});
```

**優點**：簡單、伺服器控制工作階段  
**缺點**：具狀態性 (Stateful)、延展性問題、易受 CSRF 攻擊

#### 2. 基於權杖的驗證 (Token-Based Authentication - JWT)

```javascript
// 登入
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (verifyCredentials(username, password)) {
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: '認證資訊無效' });
  }
});

// 受保護的路由
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = getUserById(decoded.userId);
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: '權杖無效' });
  }
});
```

**優點**：無狀態、具延展性、可跨網域運作  
**缺點**：到期前無法撤銷、大小開銷較大

#### 3. OAuth 2.0

用於委派存取的授權框架。

**角色**：
- **資源擁有者 (Resource Owner)**：終端使用者
- **用戶端 (Client)**：要求存取的應用程式
- **授權伺服器 (Authorization Server)**：核發權杖
- **資源伺服器 (Resource Server)**：代管受保護的資源

**流程範例**（授權碼）：
1. 用戶端重新導向至授權伺服器
2. 使用者進行驗證並授予權限
3. 授權伺服器攜帶代碼重新導向回用戶端
4. 用戶端使用代碼交換存取權杖
5. 用戶端使用權杖存取資源

#### 4. 多要素驗證 (MFA)

需要多個驗證因素：
- **您知道的事物**：密碼
- **您擁有的事物**：電話、硬體權杖
- **您本身的事物**：生物識別

### 密碼安全性

```javascript
const bcrypt = require('bcrypt');

// 加密密碼 (Hash)
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// 驗證密碼
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

**最佳實踐**：
- ✅ 使用 bcrypt、scrypt 或 Argon2
- ✅ 最少 8 個字元（建議 12 個以上）
- ✅ 需要混合字元
- ✅ 實作速率限制
- ✅ 在失敗後實作帳號鎖定
- ❌ 永不儲存純文字密碼
- ❌ 永不限制密碼長度（在合理範圍內）
- ❌ 永不透過電子郵件傳送密碼

## 常見弱點

### XSS (跨網站指令碼攻擊)

將惡意指令碼插入網頁。

**類型**：
1. **儲存型 XSS**：惡意指令碼儲存於資料庫中
2. **反射型 XSS**：URL 中的指令碼反映在回應中
3. **DOM 型 XSS**：用戶端指令碼操作

**預防措施**：
```javascript
// ❌ 易受攻擊
element.innerHTML = userInput;

// ✅ 安全
element.textContent = userInput;

// ✅ 逸出 (Escape) HTML
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return map[match];
  });
}

// ✅ 針對富文字內容使用 DOMPurify
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

### CSRF (跨網站請求偽造)

誘騙使用者執行不想要的動作。

**預防措施**：
```javascript
// CSRF 權杖 (Token)
app.get('/form', (req, res) => {
  const csrfToken = generateToken();
  req.session.csrfToken = csrfToken;
  res.render('form', { csrfToken });
});

app.post('/transfer', (req, res) => {
  if (req.body.csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF 權杖無效' });
  }
  // 處理請求
});

// SameSite 餅乾 (Cookie) 屬性
Set-Cookie: sessionId=abc; SameSite=Strict; Secure; HttpOnly
```

### SQL 隱碼攻擊 (SQL Injection)

插入惡意的 SQL 程式碼。

**預防措施**：
```javascript
// ❌ 易受攻擊
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ 參數化查詢
const query = 'SELECT * FROM users WHERE username = ?';
db.execute(query, [username]);

// ✅ ORM/查詢建構器 (Query builder)
const user = await User.findOne({ where: { username } });
```

### CORS 錯誤設定

```javascript
// ❌ 易受攻擊（允許任何來源）
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true

// ✅ 白清單指定來源
const allowedOrigins = ['https://example.com'];
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

### 點擊劫持 (Clickjacking)

誘騙使用者點擊隱藏元件。

**預防措施**：
```http
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN

# 或使用 CSP
Content-Security-Policy: frame-ancestors 'none'
Content-Security-Policy: frame-ancestors 'self'
```

### 檔案上傳弱點

```javascript
// 驗證檔案類型
const allowedTypes = ['image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.mimetype)) {
  return res.status(400).json({ error: '檔案類型無效' });
}

// 檢查檔案大小
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  return res.status(400).json({ error: '檔案太大' });
}

// 淨化 (Sanitize) 檔名
const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_');

// 儲存於網頁根目錄之外
const uploadPath = '/secure/uploads/' + sanitizedName;

// 使用隨機檔名
const filename = crypto.randomBytes(16).toString('hex') + path.extname(file.name);
```

## 加密技術 (Cryptography)

### 加密 (Encryption) vs 雜湊 (Hashing)

- **加密**：可逆（使用金鑰解密）
- **雜湊**：單向轉換

### 對稱加密 (Symmetric Encryption)

加密與解密使用相同的金鑰。

```javascript
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text, key) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 公鑰加密 (Public-Key Cryptography)

加密（公鑰）與解密（私鑰）使用不同的金鑰。

**使用案例**：
- TLS/SSL 憑證
- 數位簽章
- SSH 金鑰

### 雜湊函式 (Hash Functions)

```javascript
const crypto = require('crypto');

// SHA-256
const hash = crypto.createHash('sha256').update(data).digest('hex');

// HMAC (具金鑰之雜湊)
const hmac = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
```

### 數位簽章 (Digital Signatures)

驗證真實性與完整性。

```javascript
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// 簽署
const sign = crypto.createSign('SHA256');
sign.update(data);
const signature = sign.sign(privateKey, 'hex');

// 驗證
const verify = crypto.createVerify('SHA256');
verify.update(data);
const isValid = verify.verify(publicKey, signature, 'hex');
```

## 安全程式設計實踐 (Secure Coding Practices)

### 輸入驗證

```javascript
// 驗證電子郵件
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 驗證並淨化
function sanitizeInput(input) {
  // 移除危險字元
  return input.replace(/[<>\"']/g, '');
}

// 白清單方法
function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
```

### 輸出編碼

根據內容對資料進行編碼：
- **HTML 內容**：逸出 `< > & " '`
- **JavaScript 內容**：使用 JSON.stringify()
- **URL 內容**：使用 encodeURIComponent()
- **CSS 內容**：逸出特殊字元

### 安全儲存

```javascript
// ❌ 不要將敏感資料儲存在 localStorage
localStorage.setItem('token', token); // XSS 可以存取

// ✅ 使用 HttpOnly 餅乾 (Cookie)
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});

// ✅ 針對用戶端敏感資料，先進行加密
const encrypted = encrypt(sensitiveData, encryptionKey);
sessionStorage.setItem('data', encrypted);
```

### 速率限制 (Rate Limiting)

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制每個 IP 在 windowMs 內發送 100 個請求
  message: '請求過多，請稍後再試'
});

app.use('/api/', limiter);

// 針對驗證端點進行更嚴格的限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use('/api/login', authLimiter);
```

### 錯誤處理

```javascript
// ❌ 暴露內部細節
catch (error) {
  res.status(500).json({ error: error.message });
}

// ✅ 通用錯誤訊息
catch (error) {
  console.error(error); // 內部記錄
  res.status(500).json({ error: '內部伺服器錯誤' });
}
```

## 安全性測試

### 工具
- **OWASP ZAP**：安全性掃描器
- **Burp Suite**：網頁弱點掃描器
- **nmap**：網路掃描器
- **SQLMap**：SQL 隱碼測試
- **Nikto**：網頁伺服器掃描器

### 檢查表
- [ ] 處處強制執行 HTTPS
- [ ] 已設定安全性標頭
- [ ] 已安全地實作驗證
- [ ] 所有端點皆已檢查授權
- [ ] 輸入驗證與淨化
- [ ] 輸出編碼
- [ ] CSRF 防護
- [ ] SQL 隱碼防護
- [ ] XSS 防護
- [ ] 速率限制
- [ ] 安全的工作階段管理
- [ ] 安全的密碼儲存
- [ ] 檔案上傳安全性
- [ ] 錯誤處理不會洩露資訊
- [ ] 相依套件皆為最新版本
- [ ] 安全性記錄與監控

## 術語表 (Glossary Terms)

**涵蓋的核心術語**：
- 驗證 (Authentication)
- 驗證器 (Authenticator)
- 憑證授權單位 (Certificate authority)
- 挑戰回應驗證 (Challenge-response authentication)
- CIA
- 密碼 (Cipher)
- 加密套件 (Cipher suite)
- 密文 (Ciphertext)
- 認證資訊 (Credential)
- 跨網站請求偽造 (CSRF)
- 跨網站指令碼攻擊 (XSS)
- 密碼分析 (Cryptanalysis)
- 加密技術 (Cryptography)
- 解密 (Decryption)
- 阻斷服務 (DoS)
- 數位憑證 (Digital certificate)
- 數位簽章 (Digital signature)
- 分散式阻斷服務 (DDoS)
- 加密 (Encryption)
- 同盟身分 (Federated identity)
- 指紋採集 (Fingerprinting)
- 防火牆 (Firewall)
- HSTS
- 身分提供者 (IdP)
- 中間人攻擊 (MitM)
- 多要素驗證 (Multi-factor authentication)
- 臨時值 (Nonce)
- OWASP
- 純文字 (Plaintext)
- 最小權限原則 (Principle of least privilege)
- 具權限的 (Privileged)
- 公鑰加密 (Public-key cryptography)
- 依靠方 (Relying party)
- 重放攻擊 (Replay attack)
- 鹽值 (Salt)
- 安全內容 (Secure context)
- 安全通訊端層 (SSL)
- 工作階段劫持 (Session hijacking)
- 簽章（安全性）(Signature (security))
- SQL 隱碼攻擊 (SQL injection)
- 對稱金鑰加密 (Symmetric-key cryptography)
- 傳輸層安全性 (TLS)

## 額外資源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN 網頁安全性](https://developer.mozilla.org/en-US/docs/Web/Security)
- [安全性標頭 (Security Headers)](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/)
