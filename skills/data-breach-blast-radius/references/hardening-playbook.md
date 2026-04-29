# 強化攻略本

減少資料外洩影響範圍 (Blast Radius) 的優先控制措施。控制措施按**影響類別**組織，並包含特定技術堆疊的實作模式。每項控制措施都包含一個**影響範圍減少估算**。

> **如何使用：** 在識別出暴露向量後，將其與下方的控制措施對應。按 `(影響範圍減少率 × 嚴重性) / 努力` 排序你的強化藍圖。

---

## 控制措施優先順序矩陣

| 優先順序 | 控制措施 | 影響範圍減少率 | 努力 | 類別 |
|----------|---------|----------------------|--------|---------|
| P0 | 修復 IDOR/BOLA — 增加擁有權檢查 | 受影響向量減少 90% | 低 | 授權 |
| P0 | 從 API 回應中移除敏感欄位 | 受影響欄位減少 85% | 低 | 資料最小化 |
| P0 | 撤銷公開存取的儲存空間 (S3/Blob) | 受影響儲存空間減少 100% | 低 | 存取控制 |
| P0 | 從程式碼/紀錄中移除明文憑證 | 受影響秘密減少 100% | 低 | 秘密 |
| P1 | 為 T1 資料增加欄位級加密 | 加密欄位減少 80% | 中 | 加密 |
| P1 | 對 PCI 卡片資料進行遮罩/代碼化 (Tokenize) | 卡片暴露減少 95% | 中 | 代碼化 |
| P1 | 從記錄陳述式中移除 PII | 紀錄暴露減少 70% | 中 | 記錄 |
| P1 | 為未驗證的端點增加驗證 | 暴露端點減少 95% | 低 | 驗證 |
| P2 | 實作資料存取稽核記錄 | 偵測時間減少 50% | 中 | 監控 |
| P2 | 啟用資料庫活動監控 | 偵測時間減少 60% | 中 | 監控 |
| P2 | 為敏感端點增加頻率限制 | 資料採集減少 60% | 低 | 頻率限制 |
| P2 | 為 T2 敏感資料進行資料行級加密 | 加密資料行減少 70% | 中 | 加密 |
| P3 | 實作資料保留 + 自動刪除 | 陳舊資料暴露減少 40% | 高 | 資料生命週期 |
| P3 | 將分析儲存空間與生產 PII 分離 | 分析外洩減少 60% | 高 | 架構 |
| P3 | 對行為追蹤資料進行去識別化 (Pseudonymize) | 行為資料減少 70% | 中 | 去識別化 |

---

## P0 — 立即修復 (< 1 天)

### 1. 修復授權：IDOR / BOLA

**修復內容：** 損毀的物件層級授權 (Broken Object Level Authorization) — 使用者可以透過更改 ID 來存取其他使用者的資料。

**程式碼中的偵測模式：**
```python
# 有漏洞 — 無擁有權檢查
@app.get("/api/orders/{order_id}")
def get_order(order_id: int):
    return db.query(Order).filter(Order.id == order_id).first()

# 安全 — 有擁有權檢查
@app.get("/api/orders/{order_id}")
def get_order(order_id: int, current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id  # 擁有權檢查
    ).first()
    if not order:
        raise HTTPException(status_code=404)
    return order
```

```typescript
// 有漏洞
app.get('/api/users/:id/profile', authenticate, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// 安全
app.get('/api/users/:id/profile', authenticate, async (req, res) => {
  if (req.params.id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await User.findById(req.params.id);
  res.json(user);
});
```

```csharp
// 有漏洞
[HttpGet("orders/{orderId}")]
public async Task<IActionResult> GetOrder(int orderId)
{
    var order = await _db.Orders.FindAsync(orderId);
    return Ok(order);
}

// 安全
[HttpGet("orders/{orderId}")]
[Authorize]
public async Task<IActionResult> GetOrder(int orderId)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var order = await _db.Orders
        .Where(o => o.Id == orderId && o.UserId == userId)
        .FirstOrDefaultAsync();
    if (order == null) return NotFound();
    return Ok(order);
}
```

---

### 2. 從 API 回應中移除敏感欄位

**修復內容：** 過度擷取 (Over-fetching) — API 回傳的資料多於客戶端所需。

**模式：**
```typescript
// 有漏洞 — 回傳所有欄位，包含 passwordHash, ssn
const user = await User.findById(id);
res.json(user);

// 安全 — 明確的投影 (Projection)
const user = await User.findById(id).select('id name email createdAt');
res.json(user);
```

```python
# 安全 — Pydantic 回應模型 (FastAPI)
class UserPublicResponse(BaseModel):
    id: int
    name: str
    email: str
    # 註：不包含 password_hash, ssn, date_of_birth

@app.get("/api/users/{id}", response_model=UserPublicResponse)
def get_user(id: int):
    return db.query(User).filter(User.id == id).first()
```

```java
# 安全 — 帶有 @JsonIgnore 的 DTO
public class UserResponse {
    public String id;
    public String name;
    public String email;
    // DTO 中不包含 passwordHash, ssn
}
```

---

### 3. 從程式碼中移除明文憑證

**偵測模式：**
```
# 在所有檔案中搜尋以下模式：
password\s*=\s*["'][^"']+["']
api_key\s*=\s*["'][^"']+["']
secret\s*=\s*["'][^"']+["']
token\s*=\s*["'][^"']+["']
connectionString\s*=\s*["'][^"']+["']
```

**修復模式：**
```python
# 有漏洞
DATABASE_URL = "postgresql://user:p@ssw0rd@prod-db.example.com/mydb"

# 安全
import os
DATABASE_URL = os.environ.get("DATABASE_URL")
# 在生產環境中：使用 Azure Key Vault, AWS Secrets Manager, 或 GCP Secret Manager
```

---

## P1 — 本週修復

### 4. 第 1 級資料的欄位級加密

在儲存前對敏感欄位進行加密。加密金鑰存放在 KMS 中，而非資料庫。

**Python / SQLAlchemy + Azure Key Vault：**
```python
from azure.keyvault.secrets import SecretClient
from cryptography.fernet import Fernet

# 寫入時加密
def encrypt_field(value: str, key: bytes) -> str:
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()

# 讀取時解密 (僅限獲得授權時)
def decrypt_field(encrypted_value: str, key: bytes) -> str:
    f = Fernet(key)
    return f.decrypt(encrypted_value.encode()).decode()
```

**Node.js / Prisma + AWS KMS：**
```typescript
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";

const kms = new KMSClient({ region: "us-east-1" });

async function encryptField(plaintext: string): Promise<string> {
  const { CiphertextBlob } = await kms.send(new EncryptCommand({
    KeyId: process.env.KMS_KEY_ARN,
    Plaintext: Buffer.from(plaintext),
  }));
  return Buffer.from(CiphertextBlob!).toString('base64');
}
```

**C# / EF Core + Azure Key Vault：**
```csharp
// 對 SQL Server / Azure SQL 使用 Always Encrypted
// 或手動使用 Azure Key Vault 加密
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableSensitiveDataLogging(false)));

// 在實體中：
[Column(TypeName = "nvarchar(500)")]
public string EncryptedSsn { get; set; } // 儲存 Base64 密文
```

**必須進行欄位加密的欄位 (第 1 級)：**
- SSN / 身分證字號
- 護照號碼
- 完整付款卡號 (建議：改用代碼化，見下文)
- 醫療紀錄資料 / 診斷
- 生物辨識範本

---

### 5. 將付款卡資料代碼化

**切勿儲存完整卡號。** 請改用符合 PCI 標準的保險庫 (Vault)。

**建議的供應商：**
- Stripe (透過 Elements/PaymentIntents 代碼化 — 你永遠不會接觸到卡號)
- Braintree / PayPal
- Adyen
- Square

**模式：**
```typescript
// 正確 — 使用 Stripe 的代碼化
const paymentMethod = await stripe.paymentMethods.create({
  type: 'card',
  card: { token: cardToken }, // 客戶端 Stripe.js 提供的 token
});
// 儲存：paymentMethod.id (代碼) — 絕非卡號

// 錯誤 — 切勿這樣做
const cardNumber = req.body.cardNumber; // 違反第 2 級 PCI-DSS 規範
await db.save({ userId, cardNumber });   // 不要儲存原始卡片資料
```

---

### 6. 從記錄陳述式移除 PII

**要搜尋並修復的模式：**
```python
# 有漏洞
logger.info(f"User {user.email} logged in")
logger.debug(f"Payment by {user.full_name}, card ending {card_last4}")

# 安全 — 記錄不透明的識別碼，而非 PII
logger.info(f"User {user.id} authenticated", extra={"user_id": user.id})
logger.debug(f"Payment processed", extra={"user_id": user.id, "payment_id": payment_id})
```

```typescript
// 有漏洞
console.log(`Processing order for ${user.email} at ${user.address}`);

// 安全
logger.info('Processing order', { userId: user.id, orderId: order.id });
```

**可以安全記錄的結構化記錄欄位：**
- 內部使用者 ID (UUID/不透明)
- 工作階段 ID (如果是短期的且不對外分享)
- 交易/關聯 ID (Correlation IDs)
- 錯誤碼和錯誤類型
- 時間戳記
- HTTP 狀態碼
- 延遲/耗時

**不安全記錄的結構化記錄欄位：**
- 電子郵件地址
- IP 地址 (必須遮罩 — 最後一個八位元)
- 全名
- 電話號碼
- 任何第 1–3 級的敏感欄位

---

## P2 — 本次衝刺修復

### 7. 實作資料存取稽核記錄

對第 1 級和第 2 級資料的每次讀取/寫入都必須記錄到不可變的稽核記錄中。

**要記錄的內容：**
```
{
  timestamp: ISO8601,
  actor_id: "使用者 UUID",
  actor_role: "管理員|使用者|服務",
  action: "讀取|寫入|刪除|匯出",
  resource_type: "使用者|健康紀錄|付款方式",
  resource_id: "所存取紀錄的 UUID",
  fields_accessed: ["email", "phone"],  // 非內容值
  ip_address: "已遮罩的 IP",
  result: "成功|拒絕",
  correlation_id: "請求追蹤 ID"
}
```

**切勿在稽核記錄中記錄實際的敏感欄位值。**

**隔離：** 將稽核記錄儲存在與應用程式資料庫**分離**的資料庫/儲存帳戶中，並設定比應用程式資料庫更嚴格的存取控制。

---

### 8. 為敏感端點增加頻率限制 (Rate Limit)

即使存在授權漏洞，也能防止自動化的大規模資料採集。

```typescript
// Express + express-rate-limit
import rateLimit from 'express-rate-limit';

// 針對資料匯出端點的嚴格限制
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 5, // 每個 IP 每小時最多 5 次匯出
  message: 'Too many export requests'
});

// 一般資料查詢的標準限制
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100
});

app.get('/api/export', exportLimiter, authMiddleware, exportController);
app.get('/api/users/:id', lookupLimiter, authMiddleware, userController);
```

---

## P3 — 本季修復

### 9. 實作資料保留與自動刪除

**每個包含個人資料的資料表都必須有定義明確的保留原則。**

```sql
-- 為所有 PII 資料表增加保留期限欄位
ALTER TABLE users ADD COLUMN retention_expires_at TIMESTAMP;
ALTER TABLE health_records ADD COLUMN retention_expires_at TIMESTAMP;

-- 在插入時設定保留期限
INSERT INTO users (email, retention_expires_at) 
VALUES ($1, NOW() + INTERVAL '7 years');

-- 定期排程作業以刪除過期紀錄 (或進行匿名化)
DELETE FROM users 
WHERE retention_expires_at < NOW() 
AND deletion_notified_at IS NOT NULL; -- 確保已通知使用者
```

**Python 排程清理：**
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

async def purge_expired_records():
    await db.execute(
        "DELETE FROM user_sessions WHERE expires_at < NOW()"
    )
    # 使用者匿名化 (如果必須保留財務紀錄，則不要刪除)
    await db.execute("""
        UPDATE users SET 
            email = CONCAT('deleted_', id, '@redacted.invalid'),
            phone = NULL,
            address = NULL,
            date_of_birth = NULL
        WHERE retention_expires_at < NOW() AND deleted_at IS NULL
    """)

scheduler = AsyncIOScheduler()
scheduler.add_job(purge_expired_records, 'cron', hour=2)  # 每天凌晨 2 點
scheduler.start()
```

---

### 10. 將行為與分析資料去識別化 (Pseudonymize)

在分析中將直接的使用者識別碼替換為去識別化的權仗 (Token)。

```python
import hashlib
import hmac

PSEUDONYM_SALT = os.environ.get("PSEUDONYM_SALT")  # 存放在 Key Vault

def pseudonymize_user_id(real_user_id: str) -> str:
    """
    單向：分析師可以追蹤跨工作階段的行為，
    但若沒有加鹽 (Salt) 則無法識別真實使用者。
    """
    return hmac.new(
        PSEUDONYM_SALT.encode(), 
        real_user_id.encode(), 
        hashlib.sha256
    ).hexdigest()

# 在分析事件中
analytics.track({
    "user_id": pseudonymize_user_id(user.id),  # 非真實使用者 ID
    "event": "page_viewed",
    "page": request.path,
    "timestamp": datetime.utcnow().isoformat()
})
```

---

## 快速上手檢查表 (< 1 天內完成)

- [ ] 搜尋所有檔案中的硬編碼秘密 → 移至環境變數 / Key Vault
- [ ] 檢查所有 `SELECT *` 查詢 → 增加明確的資料行清單，排除敏感欄位
- [ ] 驗證儲存貯體/容器 → 封鎖公開存取
- [ ] 移除列印請求本文的 `console.log` / `logger.debug` 呼叫
- [ ] 為所有工作階段 Cookie 增加 `HttpOnly; Secure; SameSite=Strict`
- [ ] 驗證 `/api/admin/*` 路由是否需要管理員角色檢查
- [ ] 確認密碼重設權杖在 < 15 分鐘內過期
- [ ] 檢查生產環境中的 500 錯誤回應不包含堆疊追蹤
- [ ] 驗證 `.env` 和秘密檔案已加入 `.gitignore`
- [ ] 執行 `git log --all --full-history -- "*.env"` 以檢查歷史秘密提交

---

## 套用控制措施後的影響範圍減少率

在報告強化藍圖時，請使用以下估計值：

| 套用的控制措施 | 影響範圍減少率 | 理由 |
|----------------|----------------------|---------------|
| 修復所有 IDOR 漏洞 | 80–90% | 大多數外洩情境都是利用授權缺陷 |
| 為 T1 資料進行欄位加密 | 75–85% | 若無 KMS 金鑰，加密資料即毫無用處 |
| 從記錄中移除 PII | 40–60% | 記錄存取的控制通常比資料庫存取鬆散 |
| 付款資料代碼化 | 針對卡片資料減少 95% | 標準 PCI-DSS 合規性可消除卡片資料風險範圍 |
| 為資料端點設定頻率限制 | 30–50% | 限制自動化採集攻擊的規模 |
| 強制執行資料保留 | 20–40% | 減少「資料湖」效應 — 可被盜取的資料減少 |
| 稽核記錄 + 異常偵測 | 0% 預防，但偵測時間縮短 60% | 外洩能更快被發現 |
| 分析資料去識別化 | 針對分析資料減少 60–70% | 分析資料與身份脫鉤 |
| 架構：將分析與 PII 分離 | 50–70% | 分析儲存空間外洩不會洩漏 PII 價值 |
