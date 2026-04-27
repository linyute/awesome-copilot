# 語言特定弱點模式 (Language-Specific Vulnerability Patterns)

在確認語言後，於步驟 1 (範圍解析) 期間載入相關區段。

---

## JavaScript / TypeScript (Node.js, React, Next.js, Express)

### 關鍵 API/呼叫 標記 (Critical APIs/calls to flag)
```js
eval()                    // 任意程式碼執行
Function('return ...')   // 與 eval 相同
child_process.exec()     // 如果使用者輸入到達此處，則會產生指令隱碼攻擊 (command injection)
fs.readFile              // 如果使用者控制路徑，則會產生路徑走訪 (path traversal)
fs.writeFile             // 如果使用者控制路徑，則會產生路徑走訪 (path traversal)
```

### Express.js 特定
```js
// 遺漏 helmet (安全性標頭)
const app = express()
// 應該要有：app.use(helmet())

// 遺漏內容大小限制 (DoS)
app.use(express.json())
// 應該要有：app.use(express.json({ limit: '10kb' }))

// CORS 設定錯誤
app.use(cors({ origin: '*' }))  // 過於寬鬆
app.use(cors({ origin: req.headers.origin }))  // 反映任何來源

// 未經驗證即信任代理 (Trust proxy)
app.set('trust proxy', true)  // 僅在已知代理後方才安全
```

### React 特定
```jsx
<div dangerouslySetInnerHTML={{ __html: userContent }} />  // XSS
<a href={userUrl}>link</a>  // javascript: URL 隱碼攻擊
```

### Next.js 特定
```js
// 未經身份驗證的伺服器動作 (Server Actions)
export async function deleteUser(id) {   // 遺漏：身份驗證檢查
  await db.users.delete(id)
}

// API 路由遺漏方法驗證
export default function handler(req, res) {
  // 應該檢查：if (req.method !== 'POST') return res.status(405)
  doSensitiveAction()
}
```

---

## Python (Django, Flask, FastAPI)

### Django 特定
```python
# 原生 SQL (Raw SQL)
User.objects.raw(f"SELECT * FROM users WHERE name = '{name}'")  # SQLi

# 遺漏 CSRF
@csrf_exempt  # 僅適用於使用權杖驗證的 API

# 生產環境中的除錯模式
DEBUG = True  # 在 settings.py 中 — 會公開堆疊追蹤

# SECRET_KEY
SECRET_KEY = 'django-insecure-...'  # 生產環境中必須變更

# ALLOWED_HOSTS
ALLOWED_HOSTS = ['*']  # 過於寬鬆
```

### Flask 特定
```python
# 除錯模式
app.run(debug=True)  # 絕不在生產環境中使用

# 秘密金鑰 (Secret key)
app.secret_key = 'dev'  # 弱金鑰

# 帶有使用者輸入的 eval/exec
eval(request.args.get('expr'))

# 帶有使用者輸入的 render_template_string (SSTI)
render_template_string(f"Hello {name}")  # 伺服器端範本隱碼攻擊 (Server-Side Template Injection)
```

### FastAPI 特定
```python
# 遺漏身份驗證相依性
@app.delete("/users/{user_id}")  # 無 Depends(get_current_user)
async def delete_user(user_id: int):
    ...

# 任意檔案讀取
@app.get("/files/{filename}")
async def read_file(filename: str):
    return FileResponse(f"uploads/{filename}")  # 路徑走訪
```

---

## Java (Spring Boot)

### Spring Boot 特定
```java
// SQL 隱碼攻擊 (SQL Injection)
String query = "SELECT * FROM users WHERE name = '" + name + "'";
jdbcTemplate.query(query, ...);

// XXE
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
// 遺漏：dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)

// 反序列化 (Deserialization)
ObjectInputStream ois = new ObjectInputStream(inputStream);
Object obj = ois.readObject();  // 僅在使用允許清單時安全

// Spring Security — 在敏感端點上使用 permitAll
.antMatchers("/admin/**").permitAll()

// Actuator 端點公開
management.endpoints.web.exposure.include=*  # 在 application.properties 中
```

---

## PHP

```php
// 查詢中直接使用使用者輸入
$result = mysql_query("SELECT * FROM users WHERE id = " . $_GET['id']);

// 檔案包含 (File inclusion)
include($_GET['page'] . ".php");  // 本地/遠端檔案包含

// eval
eval($_POST['code']);

// 帶有使用者輸入的 extract()
extract($_POST);  // 覆蓋任何變數

// 鬆散比較 (Loose comparison)
if ($password == "admin") {}  // 應使用 === 取代

// 反序列化 (Unserialize)
unserialize($_COOKIE['data']);  // 遠端程式碼執行
```

---

## Go

```go
// 指令隱碼攻擊 (Command injection)
exec.Command("sh", "-c", userInput)

// SQL 隱碼攻擊 (SQL injection)
db.Query("SELECT * FROM users WHERE name = '" + name + "'")

// 路徑走訪 (Path traversal)
filePath := filepath.Join("/uploads/", userInput)  // 應先過濾 userInput

// 不安全的 TLS
http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}

// Goroutine 洩漏 / 遺漏情境取消 (context cancellation)
go func() {
  // 無 done 通道或情境
  for { ... }
}()
```

---

## Ruby on Rails

```ruby
# SQL 隱碼攻擊 (使用佔位符是安全的替代方案)
User.where("name = '#{params[:name]}'")  # 有弱點
User.where("name = ?", params[:name])   # 安全

# 無強大參數的批次賦值 (Mass assignment)
@user.update(params[:user])  # 應該是 params.require(:user).permit(...)

# 帶有使用者輸入的 eval / send
eval(params[:code])
send(params[:method])  # 任意方法呼叫

# 重新導向至使用者提供的 URL (開放式重新導向)
redirect_to params[:url]

# YAML.load (允許建立任意物件)
YAML.load(user_input)  # 應使用 YAML.safe_load 取代
```

---

## Rust

```rust
// Unsafe 區塊 — 標記以進行手動審查
unsafe {
    // 應記錄不安全的原因
}

// 整數溢位 (除錯建構會崩潰 (panic)，發布版本會靜默環繞 (wrap))
let result = a + b;  // 針對金融數學應使用 checked_add/saturating_add

// 生產環境程式碼中的 Unwrap/expect (遇到 None/Err 會崩潰 (panic))
let value = option.unwrap();  // 偏好使用 ? 或 match

// 反序列化任意類型
serde_json::from_str::<serde_json::Value>(&user_input)  // 通常安全
// 但是：從不受信任的輸入進行 bincode::deserialize — 可能被利用
```
