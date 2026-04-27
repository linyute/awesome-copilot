# 弱點類別 — 深度參考 (Vulnerability Categories — Deep Reference)

此檔案包含每個弱點類別的詳細偵測指南。
在掃描工作流程的步驟 4 中載入。

---

## 1. 隱碼攻擊 (Injection Flaws)

### SQL 隱碼攻擊 (SQL Injection)
**尋找重點：**
- SQL 查詢內部的字串連接或插補 (interpolation)
- 帶有變數的原生 `.query()`、`.execute()`、`.raw()` 呼叫
- 帶有使用者輸入的 ORM `whereRaw()`、`selectRaw()`、`orderByRaw()`
- 二次 SQL 隱碼攻擊 (Second-order SQLi)：資料先安全地儲存，稍後再不安全地使用
- 呼叫預存程序時使用未清理的輸入

**偵測訊號 (所有語言)：**
```
"SELECT ... " + variable
`SELECT ... ${variable}`
f"SELECT ... {variable}"
"SELECT ... %s" % variable   # 僅在具有正確驅動程式參數化時安全
cursor.execute("... " + input)
db.raw(`... ${req.params.id}`)
```

**安全模式 (參數化)：**
```js
db.query('SELECT * FROM users WHERE id = ?', [userId])
User.findOne({ where: { id: userId } })  // ORM 安全
```

**升級檢查器 (Escalation checkers)：**
- 查詢結果是否曾用於另一個查詢？ (二次)
- 資料表/欄位名稱是否由使用者控制？ (無法參數化 — 必須使用允許清單)

---

### 跨網站指令碼攻擊 (XSS)
**尋找重點：**
- 帶有使用者資料的 `innerHTML`、`outerHTML`、`document.write()`
- React 中的 `dangerouslySetInnerHTML`
- 範本引擎進行未逸出的轉譯：`{{{ var }}}` (Handlebars)、`!= var` (Pug)
- 帶有使用者資料的 jQuery `.html()`、`.append()`
- 帶有使用者資料的 `eval()`、`setTimeout(string)`、`setInterval(string)`
- DOM 型 (DOM-based)：將 `location.hash`、`document.referrer`、`window.name` 寫入 DOM
- 儲存型 XSS (Stored XSS)：使用者輸入儲存到資料庫，稍後在轉譯時未進行逸出

**依框架偵測：**
- **React**：預設安全，但 `dangerouslySetInnerHTML` 除外
- **Angular**：預設安全，但 `bypassSecurityTrustHtml` 除外
- **Vue**：預設安全，但 `v-html` 除外
- **原生 JS**：每一次 DOM 寫入都是可疑的

---

### 指令隱碼攻擊 (Command Injection)
**尋找重點 (Node.js)：**
```js
exec(userInput)
execSync(`ping ${host}`)
spawn('sh', ['-c', userInput])
child_process.exec('ls ' + dir)
```

**尋找重點 (Python)：**
```python
os.system(user_input)
subprocess.call(user_input, shell=True)
eval(user_input)
```

**尋找重點 (PHP)：**
```php
exec($input)
system($_GET['cmd'])
passthru($input)
`$input`  # 反引號運算子
```

**安全替代方案：** 在不使用 shell=True 的情況下使用陣列形式的 spawn/subprocess；針對指令使用允許清單。

---

### 伺服器端請求偽造 (SSRF)
**尋找重點：**
- URL 由使用者控制的 HTTP 請求
- Webhook、URL 預覽、圖片擷取功能
- 會擷取外部 URL 的 PDF 產生器
- 重新導向至使用者提供的 URL

**高風險目標：**
- AWS Metadata 服務：`169.254.169.254`
- 內部服務：`localhost`、`127.0.0.1`、`10.x.x.x`、`192.168.x.x`
- 雲端 Metadata 端點

**偵測：**
```js
fetch(req.body.url)
axios.get(userSuppliedUrl)
http.get(params.webhook)
```

---

## 2. 身份驗證與存取控制 (Authentication & Access Control)

### 物件等級授權失效 (BOLA / IDOR)
**尋找重點：**
- 資源 ID 直接取自 URL/參數，且未進行擁有權檢查
- 使用 `findById(req.params.id)` 卻未驗證 `userId === currentUser.id`
- 數值遞增 ID (容易被猜測)

**有弱點的模式範例：**
```js
// 有弱點：無擁有權檢查
app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id);
  res.json(doc);
});

// 安全：驗證擁有權
app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id });
  if (!doc) return res.status(403).json({ error: 'Forbidden' });
  res.json(doc);
});
```

---

### JWT 弱點
**尋找重點：**
- 接受 `alg: "none"`
- 弱金鑰或寫死的秘密：`secret`、`password`、`1234`
- 未進行過期 (`exp` 宣告) 驗證
- 演算法混淆 (RS256 → HS256 降級)
- JWT 儲存在 `localStorage` 中 (有 XSS 風險；偏好使用 httpOnly cookie)

**偵測：**
```js
jwt.verify(token, secret, { algorithms: ['HS256'] })  // 檢查演算法陣列
jwt.decode(token)  // 警告：decode 不會驗證簽名
```

---

### 遺漏身份驗證 / 授權
**尋找重點：**
- 管理或敏感端點遺漏身份驗證中介軟體 (middleware)
- 路由定義在 `app.use(authMiddleware)` 之後還是之前
- 功能旗標 (Feature flags) 或除錯端點在生產環境中仍處於公開狀態
- GraphQL 解析器 (resolvers) 在欄位層級遺漏身份驗證檢查

---

### 跨網站請求偽造 (CSRF)
**尋找重點：**
- 會變更狀態的操作 (POST/PUT/DELETE) 缺少 CSRF 權杖
- API 僅依賴 cookie 進行身份驗證，且未設定 SameSite 屬性
- 會話 (session) cookie 遺漏 `SameSite=Strict` 或 `SameSite=Lax`

---

## 3. 秘密與敏感資料公開 (Secrets & Sensitive Data Exposure)

### 程式碼中的秘密
尋找如下模式：
```
API_KEY = "sk-..."
password = "hunter2"
SECRET = "abc123"
private_key = "-----BEGIN RSA PRIVATE KEY-----"
aws_secret_access_key = "wJalrXUtn..."
```

熵啟發式 (Entropy heuristic)：在賦值情境中，長度 > 20 個字元且具有高度字元多樣性的字串
很可能是秘密，即使變數名稱沒有說明。

### 存在於日誌 / 錯誤訊息中
```js
console.log('使用者密碼：', password)
logger.info({ user, token })   // token 不應被記錄
res.status(500).json({ error: err.stack })  // 堆疊追蹤會公開內部資訊
```

### API 回應中的敏感資料
- 回傳完整的使用者物件，包括 `password_hash`、`ssn`、`credit_card`
- 在錯誤回應中包含內部 ID 或系統路徑

---

## 4. 密碼學 (Cryptography)

### 弱演算法
| 演算法 | 問題 | 替換為 |
|-----------|-------|--------------|
| MD5 | 對安全性而言已失效 | SHA-256 或 bcrypt (密碼) |
| SHA-1 | 碰撞攻擊 (Collision attacks) | SHA-256 |
| DES / 3DES | 金鑰大小過弱 | AES-256-GCM |
| RC4 | 已失效 | AES-GCM |
| ECB 模式 | 無 IV，模式清晰可見 | GCM 或具有隨機 IV 的 CBC |

### 弱隨機性
```js
// 有弱點
Math.random()                    // 非加密安全
Date.now()                       // 可預測
Math.random().toString(36)       // 弱權杖產生

// 安全
crypto.randomBytes(32)           // Node.js
secrets.token_urlsafe(32)        // Python
```

### 密碼雜湊 (Password Hashing)
```python
# 有弱點
hashlib.md5(password.encode()).hexdigest()
hashlib.sha256(password.encode()).hexdigest()

# 安全
bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
argon2.hash(password)
```

---

## 5. 不安全的相依性 (Insecure Dependencies)

### 標記重點：
- 安裝版本範圍內具有已知 CVE 的套件
- 超過 2 年未更新且無安全性更新的棄置套件
- 與其聲明用途相比，權限極其廣泛的套件
- 會拉入已知不良套件的遞移相依性 (Transitive dependencies)
- 顯著落後於目前版本的固定版本 (可能存在未修補的弱點)

### 高風險套件觀察清單：參閱 `references/vulnerable-packages.md`

---

## 6. 商業邏輯 (Business Logic)

### 競爭條件 (Race Conditions / TOCTOU)
```js
// 有弱點：先檢查後執行，且無不可分割鎖定 (atomic lock)
const balance = await getBalance(userId);
if (balance >= amount) {
  await deductBalance(userId, amount);  // 檢查與扣款之間的競爭條件
}

// 安全：使用不可分割的資料庫交易或樂觀鎖定 (optimistic locking)
await db.transaction(async (trx) => {
  const user = await User.query(trx).forUpdate().findById(userId);
  if (user.balance < amount) throw new Error('Insufficient funds');
  await user.$query(trx).patch({ balance: user.balance - amount });
});
```

### 遺漏速率限制 (Missing Rate Limiting)
標記具有下列行為的端點：
- 接受身份驗證認證資訊 (登入、2FA)
- 發送電子郵件或簡訊
- 執行昂貴的操作
- 公開使用者列舉 (密碼重設、註冊)

---

## 7. 路徑走訪 (Path Traversal)
```python
# 有弱點
filename = request.args.get('file')
with open(f'/var/uploads/{filename}') as f:  # ../../../../etc/passwd

# 安全
filename = os.path.basename(request.args.get('file'))
safe_path = os.path.join('/var/uploads', filename)
if not safe_path.startswith('/var/uploads/'):
    abort(400)
```
