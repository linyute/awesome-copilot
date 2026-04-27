---
applyTo: '**'
description: '基於 OWASP Top 10 2025 的完整安全編碼標準，包含 55 個以上的反模式、偵測正規表示式、針對現代 Web 和後端框架的框架特定修復，以及 AI/LLM 安全指引。'
---

# 安全標準

針對 Web 應用程式開發的完整安全規則。每個反模式都包含嚴重程度分類、偵測方法、OWASP 2025 參考資料以及修正程式碼範例。

**嚴重程度層級：**

- **嚴重 (CRITICAL)** — 可利用的弱點。必須在合併前修復。
- **重要 (IMPORTANT)** — 顯著風險。應在同一個衝刺中修復。
- **建議 (SUGGESTION)** — 縱深防禦改進。計畫在未來的迭代中執行。

---

## OWASP Top 10 — 2025 快速參考

| # | 類別 | 關鍵緩解措施 |
|---|----------|----------------|
| A01 | 權限控制失效 | 在每個端點使用驗證中介軟體、RBAC、所有權檢查 |
| A02 | 安全設定錯誤 | 安全標頭、不對生產環境進行偵錯、無預設認證資訊 |
| A03 | 軟體與供應鏈失敗 *(新)* | `npm audit`、lock 檔案完整性、SBOM、SLSA 來源 |
| A04 | 加密失敗 | 使用 Argon2id/bcrypt 儲存密碼、全程使用 TLS、程式碼中不含機密資訊 |
| A05 | 插入 | 參數化查詢、輸入驗證、不對使用者輸入使用原始 HTML |
| A06 | 不安全設計 | 威脅建模、安全設計模式、濫用案例測試 |
| A07 | 身分驗證失敗 | 限制登入頻率、安全的會話管理、MFA |
| A08 | 軟體或資料完整性失效 | 對 CDN 指令碼使用 SRI、已簽署的構件、無不安全的反序列化 |
| A09 | 安全日誌記錄與警示失敗 | 記錄安全事件、日誌中無 PII、關聯 ID、主動警示 |
| A10 | 例外狀況處理不當 *(新)* | 處理所有錯誤、生產環境中無堆疊追蹤、失敗時保持安全 |

---

## 插入反模式 (I1-I8)

### I1: 透過字串拼接的 SQL 插入

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)`
- **OWASP**: A05

```typescript
// 不佳 (BAD)
const unsafeResult = await db.query(`SELECT * FROM users WHERE id = ${userId}`);

// 良好 (GOOD) — 參數化查詢
const safeResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### I2: NoSQL 插入 (MongoDB 運算子插入)

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `\{\s*\$(?:gt|gte|lt|lte|ne|in|nin|regex|where|exists)`
- **OWASP**: A05

```typescript
// 不佳 (BAD) — 攻擊者傳送 { "password": { "$gt": "" } }
const user = await User.findOne({ username: req.body.username, password: req.body.password });

// 良好 (GOOD) — 驗證並轉換輸入類型
const username = String(req.body.username);
const password = String(req.body.password);
const user = await User.findOne({ username });
const valid = user && await verifyPassword(user.passwordHash, password);
```

### I3: 命令插入 (對使用者輸入執行 exec)

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:exec|execSync|execFile|execFileSync)\s*\(.*(?:req\.|params\.|query\.|body\.)`
- **OWASP**: A05

```typescript
// 不佳 (BAD) — Shell 插值，同步呼叫會阻塞事件迴圈
import { execFileSync } from 'node:child_process';
const unsafeOutput = execFileSync('sh', ['-c', `ls -la ${req.query.dir}`]);

// 良好 (GOOD) — 非同步 execFile、引數陣列、無 Shell、限制時間/輸出
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pExecFile = promisify(execFile);

const dir = String(req.query.dir ?? '');
if (!dir || dir.startsWith('-')) throw new Error('Invalid directory');
const { stdout: safeOutput } = await pExecFile('ls', ['-la', '--', dir], {
  timeout: 5_000,      // 當程序掛起時快速失敗
  maxBuffer: 1 << 20,  // 1 MiB 上限以防止記憶體耗盡
});

// 最佳 (BEST) — 在上述非同步、受限呼叫的基礎上增加白名單驗證
const allowedDirs = ['/data', '/public'];
if (!allowedDirs.includes(dir)) throw new Error('Invalid directory');
```

在伺服器處理器中，偏好非同步的 `execFile`/`spawn` 而非 `execFileSync`：同步變體會阻塞 Node 的事件迴圈，並可能放大 DoS 影響。務必傳遞 `timeout` 和 `maxBuffer` 來限制執行。

### I4: 透過未經消毒的 HTML 渲染產生的 XSS

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:v-html|\[innerHTML\]|dangerouslySetInner|bypassSecurityTrust)`
- **OWASP**: A05

適用於所有前端框架。每個框架都有一個會繞過預設 XSS 防護的 API：

- **React**: 帶有原始使用者內容的 `dangerouslySetInnerHTML` 屬性
- **Angular**: `[innerHTML]` 綁定或搭配未經消毒輸入的 `bypassSecurityTrustHtml`
- **Vue**: 帶有使用者控制內容的 `v-html` 指令

```typescript
// 良好 (GOOD) — 在渲染任何原始 HTML 之前先用 DOMPurify 進行消毒
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userContent);

// 最佳 (BEST) — 不需要 HTML 時使用文字插值
// React:   {userContent}
// Angular: {{ userContent }}
// Vue:     {{ userContent }}
```

### I5: 透過使用者控制的 URL 產生的 SSRF

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `fetch\((?:req\.|params\.|query\.|body\.|url|href)`
- **OWASP**: A01

```typescript
// 不佳 (BAD)
const data = await fetch(req.body.url);

// 良好 (GOOD) — 協定白名單 + 主機名稱白名單 + DNS/IP 驗證 (請參閱 TOCTOU 附註)
import { promises as dns } from 'node:dns';

function isPrivateIP(ip: string): boolean {
  // 正規化 IPv4 對應的 IPv6 (例如 ::ffff:127.0.0.1 → 127.0.0.1)
  const normalized = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  // IPv4 私有/保留/回圈範圍
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/.test(normalized)) return true;
  // IPv6 回圈、連結本地 (fe80::/10) 和唯一本地
  if (/^(::1|fe[89ab]|fc|fd)/i.test(normalized)) return true;
  return false;
}

const parsed = new URL(req.body.url);
if (parsed.protocol !== 'https:') throw new Error('Only HTTPS allowed');
const allowedHosts = ['api.example.com', 'cdn.example.com'];
if (!allowedHosts.includes(parsed.hostname)) throw new Error('Host not allowed');
// 解析所有 A/AAAA 記錄以防止透過多個 IP 進行 DNS 重新綁定
const resolved = await dns.lookup(parsed.hostname, { all: true });
if (resolved.length === 0 || resolved.some(({ address }) => isPrivateIP(address))) {
  throw new Error('Private or reserved IPs not allowed');
}
// 注意：在生產環境中，請在 HTTP 用戶端中固定已解析的 IP，以防止
// 此檢查與 fetch() 之間的 TOCTOU 重新綁定。請參閱 undici Agent 文件。
const data = await fetch(parsed.toString(), { redirect: 'error' });
```

### I6: 檔案操作中的路徑遍歷

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:readFile|readFileSync|createReadStream|path\.join)\s*\(.*(?:req\.|params\.|query\.|body\.)`
- **OWASP**: A01

```typescript
// 不佳 (BAD)
const file = fs.readFileSync(`/data/${req.params.filename}`);

// 良好 (GOOD) — 在允許的目錄內解析並驗證
import path from 'path';
const basePath = '/data';
const filePath = path.resolve(basePath, req.params.filename);
if (!filePath.startsWith(basePath + path.sep)) throw new Error('Path traversal detected');
const file = fs.readFileSync(filePath);
```

### I7: 範本插入

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:render|compile|template)\s*\(.*(?:req\.|params\.|query\.|body\.)`
- **OWASP**: A05

```typescript
// 不佳 (BAD) — 使用者輸入作為範本來源
const html = ejs.render(req.body.template, data);

// 良好 (GOOD) — 預定義範本，使用者輸入僅作為資料
const html = ejs.renderFile('./templates/page.ejs', { content: req.body.content });
```

### I8: XXE 插入 (XML 外部實體)

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:parseXml|DOMParser|xml2js|libxmljs).*(?:req\.|body\.|file)`
- **OWASP**: A05

```typescript
// 良好 (GOOD) — 在 XML 剖析器中停用外部實體
import { XMLParser } from 'fast-xml-parser';
const parser = new XMLParser({
  allowBooleanAttributes: true,
  processEntities: false,
  htmlEntities: false,
});
const result = parser.parse(req.body.xml);
```

---

## 身分驗證反模式 (AU1-AU8)

### AU1: JWT 演算法混淆 (alg:none)

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `jwt\.verify\((?![^)]*\balgorithms\b)[^)]*\)`
- **OWASP**: A07

```typescript
// 不佳 (BAD) — 接受任何演算法，包括 "none"
const decoded = jwt.verify(token, secret);

// 良好 (GOOD) — 強制執行特定的演算法
const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

### AU2: 未檢查到期時間的 JWT

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `jwt\.sign\((?![^)]*\b(?:expiresIn|exp)\b)[^)]*\)`
- **OWASP**: A07

```typescript
// 不佳 (BAD) — 權杖永不過期
const token = jwt.sign({ userId: user.id }, secret);

// 良好 (GOOD) — 短效權杖
const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });
```

### AU3: 儲存在 localStorage 的 JWT

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `localStorage\.setItem\(.*(?:token|jwt|auth|session)`
- **OWASP**: A07

```typescript
// 不佳 (BAD) — 可透過 XSS 存取
localStorage.setItem('accessToken', token);

// 良好 (GOOD) — 由伺服器設定 httpOnly cookie
res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
```

### AU4: 密碼使用明文 / 快速雜湊 (MD5/SHA-1/SHA-256)

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:createHash|md5|sha1|sha256)\s*\(.*password`
- **OWASP**: A04

```typescript
// 不佳 (BAD) — 快速雜湊，無鹽值
const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');

// 良好 (GOOD) — Argon2id (OWASP 推薦)
import { hash as argon2Hash, argon2id } from 'argon2';
const hashed = await argon2Hash(password, { type: argon2id, memoryCost: 65536, timeCost: 3 });
```

### AU5: 登入時缺乏暴力破解防護

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:post|router\.post)\s*\(\s*['"]\/(?:login|signin|auth|register|reset)`
- **OWASP**: A07

```typescript
// 不佳 (BAD) — 無費率限制
app.post('/api/auth/login', loginHandler);

// 良好 (GOOD)
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.post('/api/auth/login', authLimiter, loginHandler);
```

### AU6: 登入時缺乏會話重新產生 (會話固定)

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:session|req\.session)\s*\.\s*(?:userId|user|authenticated)\s*=`
- **OWASP**: A07

```typescript
// 良好 (GOOD) — 登入成功後重新產生會話 ID 以防止固定攻擊
req.session.regenerate((err) => {
  if (err) return next(err);
  req.session.userId = user.id;
  req.session.save(next);
});
```

相關內容：在變更密碼或提升權限時，也應使該使用者的所有其他現有會話失效 (例如，透過遞增 `tokenVersion` 欄位並拒絕帶有舊版本的會話，或者透過逐一查看會話儲存區並銷毀以該使用者為鍵值的項目)。

### AU7: 不具備 state 參數的 OAuth

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `authorize\?(?![^\n#]*\bstate=)[^\n#]*`
- **OWASP**: A07

```typescript
// 良好 (GOOD) — 包含 state 參數以進行 CSRF 防護
const state = crypto.randomBytes(32).toString('hex');
session.oauthState = state;
const authUrl = `https://provider.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
```

### AU8: 公共 OAuth 用戶端缺乏 PKCE

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:authorization_code|code).*(?!.*code_challenge)`
- **OWASP**: A07

對所有公共用戶端 (SPA、行動裝置) 使用 PKCE (Proof Key for Code Exchange) 以及 S256 挑戰方法。

---

## 授權反模式 (AZ1-AZ6)

### AZ1: 新端點缺乏驗證中介軟體

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:app|router)\.\w+\s*\(\s*['"]\/api\/(?:admin|users|settings)`
- **OWASP**: A01

```typescript
// 不佳 (BAD)
router.delete('/api/users/:id', deleteUser);

// 良好 (GOOD)
router.delete('/api/users/:id', authenticate, authorize('admin'), deleteUser);
```

### AZ2: 僅限用戶端授權

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: 只有元件守衛而沒有伺服器端檢查
- **OWASP**: A01

前端守衛僅用於提升使用者體驗 (UX)。請務必在伺服器端進行驗證。

### AZ3: IDOR (不安全直接物件參考)

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `params\.(?:id|userId|orderId)` 但不具備所有權檢查
- **OWASP**: A01

```typescript
// 良好 (GOOD) — 驗證所有權
router.get('/api/orders/:orderId', authenticate, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(order);
});
```

### AZ4: 批量賦值

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:create|update|findOneAndUpdate)\s*\(\s*req\.body\s*\)`
- **OWASP**: A01

```typescript
// 不佳 (BAD)
await User.findByIdAndUpdate(id, req.body);

// 良好 (GOOD) — 明確挑選允許的欄位
const { name, email, avatar } = req.body;
await User.findByIdAndUpdate(id, { name, email, avatar });
```

### AZ5: 透過角色參數進行權限提升

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `req\.body\.role|req\.body\.isAdmin|req\.body\.permissions`
- **OWASP**: A01

```typescript
// 良好 (GOOD) — 忽略輸入中的角色
const { name, email, password } = req.body;
const user = await User.create({ name, email, password, role: 'user' });
```

### AZ6: 敏感操作缺乏重新驗證

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:delete|destroy|remove).*(?:account|user|organization)` 但不具備重新驗證
- **OWASP**: A01

在執行帳號刪除、電子郵件變更或其他敏感操作之前，要求輸入目前的密碼。

---

## 機密資訊反模式 (S1-S6)

### S1: 硬編碼 API 金鑰 / 權杖

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:password|secret|api_key|token|apiKey)\s*[:=]\s*['"][A-Za-z0-9+/=]{8,}['"]`
- **OWASP**: A04

```typescript
// 不佳 (BAD)
const API_KEY = 'sk_live_abc123def456';

// 良好 (GOOD)
const API_KEY = process.env.API_KEY;
```

### S2: .env 已提交至 Git

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `git ls-files .env` (應回傳空值)
- **OWASP**: A04

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
```

### S3: 伺服器機密資訊暴露給用戶端

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `NEXT_PUBLIC_.*(?:SECRET|PRIVATE|PASSWORD|KEY(?!.*PUBLIC))`
- **OWASP**: A02

```bash
# 不佳 (BAD)
NEXT_PUBLIC_DATABASE_URL=postgresql://...

# 良好 (GOOD)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.example.com
```

Angular：請勿將機密資訊放在組合至用戶端的 `environment.ts` 檔案中。

### S4: 設定中的預設認證資訊

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:admin|root|default|test).*(?:password|pass|pwd)\s*[:=]\s*['"](?:admin|root|password|1234|test)`
- **OWASP**: A02

使用環境變數並進行驗證 (使用 zod schema)。

### S5: CI/CD 管道日誌中的機密資訊

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:echo|console\.log|print).*(?:\$SECRET|\$TOKEN|\$PASSWORD|process\.env)`
- **OWASP**: A09

在 CI 中使用遮罩後的機密資訊。絕不要回顯包含機密資訊的環境變數。

### S6: 錯誤回應 / 堆疊追蹤中的敏感資料

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:stack|trace|query|sql).*(?:res\.json|res\.send|c\.JSON)`
- **OWASP**: A10

```typescript
// 良好 (GOOD) — 向用戶端傳送通用錯誤，詳細資訊僅保留在日誌中
app.use((err, req, res, _next) => {
  logger.error({ err, path: req.path, method: req.method });
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'Internal Server Error',
    ...(isDev && { message: err.message }),
  });
});
```

---

## 標頭反模式 (H1-H8)

### H1: 缺乏內容安全政策

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 缺乏 `Content-Security-Policy` 標頭
- **OWASP**: A02

### H2: 包含 unsafe-inline 和 unsafe-eval 的 CSP

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `Content-Security-Policy.*(?:'unsafe-inline'|'unsafe-eval')`
- **OWASP**: A02

使用基於 Nonce 的 CSP：`script-src 'self' 'nonce-{SERVER_GENERATED}'`

### H3: 缺乏強制安全傳輸技術

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 缺乏 `Strict-Transport-Security` 標頭
- **OWASP**: A02

值：`max-age=31536000; includeSubDomains; preload`

### H4: 缺乏 X-Content-Type-Options

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 缺乏 `X-Content-Type-Options: nosniff`
- **OWASP**: A02

### H5: 缺乏 X-Frame-Options

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 缺乏 `X-Frame-Options` 標頭
- **OWASP**: A02

值：`DENY`。同時設定 `Content-Security-Policy: frame-ancestors 'none'`。

### H6: 寬鬆的 Referrer-Policy

- **嚴重程度**: 建議 (SUGGESTION)
- **偵測**: `Referrer-Policy.*(?:unsafe-url|no-referrer-when-downgrade)`
- **OWASP**: A02

使用：`strict-origin-when-cross-origin`

### H7: 缺乏 Permissions-Policy

- **嚴重程度**: 建議 (SUGGESTION)
- **偵測**: 缺乏 `Permissions-Policy` 標頭
- **OWASP**: A02

值：`camera=(), microphone=(), geolocation=(), payment=()`

### H8: 具備認證資訊的 CORS 萬用字元

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:cors|Access-Control-Allow-Origin).*\*`
- **OWASP**: A02

```typescript
// 良好 (GOOD)
app.use(cors({
  origin: ['https://app.example.com', 'https://staging.example.com'],
  credentials: true,
}));
```

---

## 前端反模式 (FE1-FE8)

### FE1: 未經消毒的 HTML 渲染

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:innerHTML|v-html|dangerouslySetInner)` 但不具備 DOMPurify
- **OWASP**: A05

在渲染使用者控制的 HTML 之前，務必先用 DOMPurify 進行消毒。請參閱 I4。

### FE2: 對使用者輸入進行動態程式碼評估

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `eval\s*\(`
- **OWASP**: A05

改用結構化資料剖析器 (JSON.parse)。

### FE3: 不具備來源驗證的 postMessage

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `addEventListener\s*\(\s*['"]message['"].*(?!.*origin)`
- **OWASP**: A01

```typescript
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://trusted.example.com') return;
  processData(event.data);
});
```

### FE4: 原型污染

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:__proto__|constructor\.prototype|Object\.assign)\s*.*(?:req\.|body\.|query\.)`
- **OWASP**: A05

在將使用者輸入合併到物件之前，先驗證並篩選其中的鍵。

### FE5: 開放式重新導向

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:window\.location|location\.href|router\.push)\s*=\s*(?:req\.|params\.|query\.)`
- **OWASP**: A01

```typescript
// 良好 (GOOD) — 僅限相對路徑
const redirect = new URLSearchParams(window.location.search).get('redirect');
if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
  window.location.href = redirect;
}
```

### FE6: localStorage 中的敏感資料

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `localStorage\.setItem\(.*(?:token|session|credit|ssn|password)`
- **OWASP**: A07

對權杖使用 httpOnly cookie。

### FE7: 缺乏 CSRF 權杖

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: POST/PUT/DELETE 表單不具備 CSRF 權杖或 SameSite cookie
- **OWASP**: A01

使用雙重提交 cookie 或同步器權杖。Next.js Server Actions 透過 Origin 標頭內建了 CSRF 防護。

### FE8: 僅限用戶端的輸入驗證

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 僅在前端進行表單驗證
- **OWASP**: A05

請務必也在伺服器端進行驗證。使用 zod、joi 或 class-validator。

---

## 相依性反模式 (D1-D5)

### D1: 已知具備弱點的相依性

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `npm audit --audit-level=high` 以非零狀態結束
- **OWASP**: A03

### D2: Lock 檔案不同步

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `npm ci` 失敗
- **OWASP**: A08

### D3: 拼字錯誤劫持風險

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 手動審查新相依性的名稱
- **OWASP**: A03

### D4: 新相依性中的 Postinstall 指令碼

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: 新相依性的 package.json 中包含 `"postinstall"`
- **OWASP**: A03

### D5: 生產環境中未固定的版本

- **嚴重程度**: 建議 (SUGGESTION)
- **偵測**: `":\s*["']\*["']|":\s*["']latest["']`
- **OWASP**: A03

---

## API 反模式 (AP1-AP6)

### AP1: 新端點缺乏費率限制

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A05

### AP2: 不具備深度限制的 GraphQL

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `new ApolloServer` 但不具備深度/複雜度限制
- **OWASP**: A05

```typescript
import depthLimit from 'graphql-depth-limit';
const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(5)],
  introspection: process.env.NODE_ENV !== 'production',
});
```

### AP3: 不具備驗證的檔案上傳

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `multer|formidable|busboy` 但不具備類型/大小檢查
- **OWASP**: A05

```typescript
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});
```

### AP4: 不具備簽章驗證的 Webhook

- **嚴重程度**: 嚴重 (CRITICAL)
- **OWASP**: A08

務必驗證 Webhook 簽章 (Stripe、GitHub HMAC 等)。

### AP5: API 暴露內部資訊

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `(?:stack|trace|query|sql).*(?:res\.json|res\.send)`
- **OWASP**: A10

### AP6: 缺乏請求主體大小限制

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `express\.json\(\)` 但不具備 `limit`
- **OWASP**: A05

```typescript
app.use(express.json({ limit: '100kb' }));
```

---

## AI/LLM 安全反模式 (AI1-AI3)

### AI1: 透過使用者輸入產提示詞插入

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: 使用者輸入在未經消毒的情況下拼接到 LLM 提示詞中
- **OWASP**: A05 (插入)

```typescript
// 不佳 (BAD) — 使用者輸入直接包含在提示詞中
const response = await llm.complete(`Summarize this: ${userInput}`);

// 良好 (GOOD) — 具有系統/使用者訊息分隔的結構化輸入
const response = await llm.complete({
  system: "You are a summarization assistant. Only summarize the provided text.",
  user: userInput,
});
```

### AI2: LLM 輸出在未經消毒的情況下用於 SQL/Shell

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: LLM 回應在未經驗證的情況下傳遞給 `db.query()`、`exec()` 或範本字面值
- **OWASP**: A05 (插入)

絕不要相信 LLM 輸出是安全的。將其視為不可信的使用者輸入 — 參數化查詢、跳脫 Shell 引數、在渲染前消毒 HTML。

### AI3: LLM 回應缺乏輸出驗證

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: LLM 回應在未經 Schema 驗證的情況下進行渲染或執行
- **OWASP**: A08 (軟體或資料完整性失效)

在應用程式邏輯中使用 LLM 輸出之前，先根據預期的 Schema (Zod、JSON Schema) 進行驗證。拒絕不符合預期結構的回應。

---

## 日誌反模式 (L1-L4)

### L1: 安全事件未記錄

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A09

記錄：身分驗證失敗、拒絕存取、觸發費率限制、輸入驗證失敗、密碼變更。

### L2: 日誌中的敏感資料

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `(?:log|logger)\.\w+\(.*(?:password|token|secret|ssn|credit)`
- **OWASP**: A09

```typescript
import pino from 'pino';
const logger = pino({ redact: ['req.headers.authorization', 'req.body.password'] });
```

### L3: 缺乏追蹤 ID

- **嚴重程度**: 建議 (SUGGESTION)
- **OWASP**: A09

### L4: 日誌插入

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `console\.log\(.*\+.*(?:req\.|user\.|body\.)`
- **OWASP**: A09

改用結構化日誌記錄 (JSON、自動跳脫) 而非字串拼接。

---

## 框架特定：React / Next.js (RX1-RX4)

### RX1: 不具備驗證的伺服器操作

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `'use server'` 函式但不具備 `auth()` 或會話檢查
- **OWASP**: A01

```typescript
'use server';
import { auth } from '@/auth';
export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') throw new Error('Unauthorized');
  await db.user.delete({ where: { id } });
}
```

### RX2: 用戶端中的 process.env 不具備 NEXT_PUBLIC_

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `'use client'` 檔案存取不具備 `NEXT_PUBLIC_` 的 `process.env`
- **OWASP**: A02

### RX3: RSC 序列化洩漏資料

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A01

在將資料庫物件傳遞給用戶端元件之前，僅挑選所需的欄位。

### RX4: middleware.ts 未保護 API 路由

- **嚴重程度**: 重要 (IMPORTANT)
- **偵測**: `config.matcher` 未涵蓋 `/api/`
- **OWASP**: A01

---

## 框架特定：Angular (NG1-NG3)

### NG1: 搭配使用者輸入使用 bypassSecurityTrustHtml

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `bypassSecurityTrust(?:Html|Script|Style|Url|ResourceUrl)`
- **OWASP**: A05

在呼叫 bypassSecurityTrust 之前，務必先用 DOMPurify 進行消毒。

### NG2: 範本運算式插入

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A05

請勿搭配使用者控制的範本使用 JitCompilerFactory。

### NG3: HttpInterceptor 未附加驗證

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A07

對驗證權杖使用集中化的 `HttpInterceptorFn`。

---

## 框架特定：Express (EX1-EX4)

### EX1: 缺乏 helmet.js

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A02

```typescript
import helmet from 'helmet';
app.use(helmet());
app.disable('x-powered-by');
```

### EX2: express.json() 不具備主體大小限制

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A05

```typescript
app.use(express.json({ limit: '100kb' }));
```

### EX3: 不具備安全旗標的 Cookie

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A07

```typescript
res.cookie('session', value, {
  httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3600000, path: '/',
});
```

### EX4: 錯誤處理器暴露堆疊追蹤

- **嚴重程度**: 重要 (IMPORTANT)
- **OWASP**: A10

僅在開發模式下暴露錯誤詳細資訊。

---

## 框架特定：Go (GO1-GO3)

### GO1: 將 math/rand 用於安全操作

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: 在安全相關檔案中匯入 `math/rand`
- **OWASP**: A04

改用 `crypto/rand` 以取得具備加密安全性的隨機值。

### GO2: TLS InsecureSkipVerify

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `InsecureSkipVerify:\s*true`
- **OWASP**: A04

改用系統 CA 池 (預設)。

### GO3: SQL 中的字串內插

- **嚴重程度**: 嚴重 (CRITICAL)
- **偵測**: `fmt\.Sprintf\s*\(.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)`
- **OWASP**: A05

```go
// 良好 (GOOD) — 參數化
db.Where("id = ?", userID).Find(&user)
```

---

## 安全標頭範本

### helmet.js (Express)

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
}));
app.disable('x-powered-by');
```

---

## JWT 驗證核取清單

1. 使用預期的演算法驗證簽章 — 拒絕 `alg: none`
2. 強制執行演算法：`algorithms: ['RS256']` 或 `['ES256']`
3. 檢查 `exp` — 拒絕過期的權杖
4. 檢查 `iat` — 拒絕簽發時間過久的權杖
5. 檢查 `aud` — 拒絕非預定給此服務使用的權杖
6. 檢查 `iss` — 拒絕來自未知簽發者的權杖
7. 儲存在 httpOnly cookie 中 — 而非 localStorage
8. 使用短效存取權杖 (15 分鐘) + 重新整理權杖輪替
9. 定期輪替簽章金鑰

---

## 安全 Cookie 旗標

```
Set-Cookie: session=value; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

| 旗標 | 用途 | 何時使用 |
|------|---------|-------------|
| `HttpOnly` | 無法透過 JavaScript 存取 (防止 XSS 權杖竊取) | 總是使用 |
| `Secure` | 僅透過 HTTPS 傳送 | 總是使用 |
| `SameSite=Strict` | 僅在同站請求時傳送 (最強的 CSRF 防護) | 驗證/會話 cookie |
| `SameSite=Lax` | 在頂層導覽時傳送 (中等強度 CSRF 防護) | 需要跨站頂層導覽的 cookie (例如 OAuth 回傳) |
| `Path=/` | 限制 cookie 範圍 | 總是使用 |
| `Max-Age` | 明確到期時間 (優於 `Expires`) | 總是使用 |

---

## 安全核取清單

### 身分驗證與會話
- [ ] 密碼使用 Argon2id 或 bcrypt 進行雜湊 (成本 >= 12)
- [ ] JWT 使用 RS256/ES256 簽署，在驗證時強制執行演算法
- [ ] 存取權杖到期時間 <= 15 分鐘
- [ ] 重新整理權杖：單次使用、已輪替、儲存在 httpOnly cookie 中
- [ ] 在登入、註冊和重設密碼時進行費率限制
- [ ] 身分驗證後重新產生會話
- [ ] 特權帳號可使用 MFA

### 授權
- [ ] 每個 API 端點都有驗證中介軟體
- [ ] 對所有資源存取進行所有權檢查 (防止 IDOR)
- [ ] 伺服器端授權 (前端守衛僅用於提升使用者體驗)
- [ ] 防止批量賦值 (明確選擇欄位)
- [ ] 敏感操作需要重新驗證

### 輸入與輸出
- [ ] 所有使用者輸入都在伺服器端驗證 (使用 zod/joi/class-validator)
- [ ] 對所有資料庫操作使用參數化查詢
- [ ] 在渲染使用者內容時，對 HTML 輸出進行消毒 (使用 DOMPurify)
- [ ] 錯誤回應在生產環境中不暴露堆疊追蹤

### 機密資訊
- [ ] 原始碼中無硬編碼機密資訊
- [ ] `.env` 檔案包含在 `.gitignore` 中
- [ ] 伺服器機密資訊不暴露給用戶端 (機密資訊不使用 NEXT_PUBLIC_)
- [ ] 啟動時驗證環境變數

### 標頭
- [ ] 已設定內容安全政策 (偏好基於 Nonce 的政策)
- [ ] 具備預載入的強制安全傳輸技術 (HSTS)
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Permissions-Policy 限制未使用的 API
- [ ] CORS 限制在已知來源

### 相依性
- [ ] 在 CI 中通過 `npm audit` (或同等工具)
- [ ] 提交 lock 檔案並使用 `npm ci` 進行驗證
- [ ] 審查新相依性是否存在拼字錯誤劫持和 postinstall 指令碼
- [ ] 生產環境中不使用萬用字元或 "latest" 版本

### 日誌記錄
- [ ] 記錄安全事件 (身分驗證失敗、拒絕存取、費率限制)
- [ ] 日誌中無敏感資料 (密碼、權杖、PII)
- [ ] 使用帶有關聯 ID 的結構化日誌記錄
- [ ] 針對異常模式配置警示
