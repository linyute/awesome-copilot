---
description: '可用於使用 GitHub Copilot 為任何專案自訂的通用程式碼審查說明'
applyTo: '**'
excludeAgent: ["coding-agent"]
---

# 通用程式碼審查說明

適用於 GitHub Copilot 的全面程式碼審查指南，可適應任何專案。這些說明遵循提示工程的最佳實踐，並提供程式碼品質、安全性、測試和架構審查的結構化方法。

## 審查語言

執行程式碼審查時，請以 **正體中文** 回覆（或指定您偏好的語言）。

> **自訂提示**：將「英文」替換為「葡萄牙文 (巴西)」、「西班牙文」、「法文」等，以變更為您偏好的語言。

## 審查優先級

執行程式碼審查時，請依下列順序優先處理問題：

### 🔴 嚴重 (阻止合併)
- **安全性**：弱點、外洩的秘密、身份驗證/授權問題
- **正確性**：邏輯錯誤、資料損壞風險、競爭條件
- **破壞性變更**：API 契約變更而未版本化
- **資料遺失**：資料遺失或損壞的風險

### 🟡 重要 (需要討論)
- **程式碼品質**：嚴重違反 SOLID 原則、過度重複
- **測試覆蓋率**：關鍵路徑或新功能缺少測試
- **效能**：明顯的效能瓶頸（N+1 查詢、記憶體洩漏）
- **架構**：嚴重偏離既定模式

### 🟢 建議 (非阻塞性改進)
- **可讀性**：命名不佳、可簡化的複雜邏輯
- **優化**：不影響功能的效能改進
- **最佳實踐**：輕微偏離慣例
- **文件**：缺少或不完整的文件

## 一般審查原則

執行程式碼審查時，請遵循下列原則：

1. **具體**：引用確切的行、檔案，並提供具體範例
2. **提供上下文**：解釋為什麼這是個問題以及潛在的影響
3. **建議解決方案**：在適用時顯示更正後的程式碼，而不僅僅是指出錯誤
4. **建設性**：專注於改進程式碼，而不是批評作者
5. **認可良好實踐**：表揚寫得好的程式碼和聰明的解決方案
6. **務實**：並非所有建議都需要立即實施
7. **分組相關註解**：避免對同一主題有多個註解

## 程式碼品質標準

執行程式碼審查時，請檢查：

### 簡潔程式碼
- 變數、函式和類別的描述性和有意義的名稱
- 單一職責原則：每個函式/類別都做好一件事
- DRY (不要重複自己)：沒有程式碼重複
- 函式應小而專注（理想情況下 < 20-30 行）
- 避免深度巢狀程式碼（最多 3-4 層）
- 避免魔法數字和字串（使用常數）
- 程式碼應自我文件；僅在必要時才註解

### 範例
```javascript
// ❌ 差：命名不佳和魔法數字
function calc(x, y) {
    if (x > 100) return y * 0.15;
    return y * 0.10;
}

// ✅ 好：清晰的命名和常數
const PREMIUM_THRESHOLD = 100;
const PREMIUM_DISCOUNT_RATE = 0.15;
const STANDARD_DISCOUNT_RATE = 0.10;

function calculateDiscount(orderTotal, itemPrice) {
    const isPremiumOrder = orderTotal > PREMIUM_THRESHOLD;
    const discountRate = isPremiumOrder ? PREMIUM_DISCOUNT_RATE : STANDARD_DISCOUNT_RATE;
    return itemPrice * discountRate;
}
```

### 錯誤處理
- 適當層級的正確錯誤處理
- 有意義的錯誤訊息
- 無靜默失敗或被忽略的例外
- 快速失敗：盡早驗證輸入
- 使用適當的錯誤類型/例外

### 範例
```python
# ❌ 差：靜默失敗和通用錯誤
def process_user(user_id):
    try:
        user = db.get(user_id)
        user.process()
    except:
        pass

# ✅ 好：明確的錯誤處理
def process_user(user_id):
    if not user_id or user_id <= 0:
        raise ValueError(f"Invalid user_id: {user_id}")

    try:
        user = db.get(user_id)
    except UserNotFoundError:
        raise UserNotFoundError(f"User {user_id} not found in database")
    except DatabaseError as e:
        raise ProcessingError(f"Failed to retrieve user {user_id}: {e}")

    return user.process()
```

## 安全性審查

執行程式碼審查時，請檢查安全性問題：

- **敏感資料**：程式碼或日誌中沒有密碼、API 金鑰、權杖或個人身份資訊
- **輸入驗證**：所有使用者輸入都經過驗證和清理
- **SQL 注入**：使用參數化查詢，絕不使用字串串聯
- **身份驗證**：在存取資源前進行正確的身份驗證檢查
- **授權**：驗證使用者是否有執行動作的權限
- **加密**：使用既定的函式庫，絕不自行開發加密
- **依賴項安全性**：檢查依賴項中已知的弱點

### 範例
```java
// ❌ 差：SQL 注入弱點
String query = "SELECT * FROM users WHERE email = '" + email + "'";

// ✅ 好：參數化查詢
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ?"
);
stmt.setString(1, email);
```

```javascript
// ❌ 差：程式碼中暴露的秘密
const API_KEY = "sk_live_abc123xyz789";

// ✅ 好：使用環境變數
const API_KEY = process.env.API_KEY;
```

## 測試標準

執行程式碼審查時，請驗證測試品質：

- **覆蓋率**：關鍵路徑和新功能必須有測試
- **測試名稱**：描述性名稱，解釋正在測試的內容
- **測試結構**：清晰的 Arrange-Act-Assert 或 Given-When-Then 模式
- **獨立性**：測試不應相互依賴或依賴外部狀態
- **斷言**：使用特定斷言，避免通用 assertTrue/assertFalse
- **邊緣案例**：測試邊界條件、空值、空集合
- **適當模擬**：模擬外部依賴項，而不是領域邏輯

### 範例
```typescript
// ❌ 差：模糊的名稱和斷言
test('test1', () => {
    const result = calc(5, 10);
    expect(result).toBeTruthy();
});

// ✅ 好：描述性名稱和特定斷言
test('should calculate 10% discount for orders under $100', () => {
    const orderTotal = 50;
    const itemPrice = 20;

    const discount = calculateDiscount(orderTotal, itemPrice);

    expect(discount).toBe(2.00);
});
```

## 效能考量

執行程式碼審查時，請檢查效能問題：

- **資料庫查詢**：避免 N+1 查詢，使用適當的索引
- **演算法**：針對用例的適當時間/空間複雜度
- **快取**：利用快取來處理昂貴或重複的操作
- **資源管理**：正確清理連線、檔案、串流
- **分頁**：大型結果集應進行分頁
- **延遲載入**：僅在需要時才載入資料

### 範例
```python
# ❌ 差：N+1 查詢問題
users = User.query.all()
for user in users:
    orders = Order.query.filter_by(user_id=user.id).all()  # N+1!

# ✅ 好：使用 JOIN 或預先載入
users = User.query.options(joinedload(User.orders)).all()
for user in users:
    orders = user.orders
```

## 架構與設計

執行程式碼審查時，請驗證架構原則：

- **關注點分離**：層/模組之間有明確的邊界
- **依賴方向**：高層模組不依賴低層細節
- **介面隔離**：偏好小型、專注的介面
- **鬆散耦合**：元件應可獨立測試
- **高內聚**：相關功能組合在一起
- **一致模式**：遵循程式碼庫中的既定模式

## 文件標準

執行程式碼審查時，請檢查文件：

- **API 文件**：公共 API 必須有文件（目的、參數、回傳值）
- **複雜邏輯**：不明顯的邏輯應有解釋性註解
- **README 更新**：新增功能或變更設定時更新 README
- **破壞性變更**：清楚記載任何破壞性變更
- **範例**：為複雜功能提供使用範例

## 註解格式範本

執行程式碼審查時，請使用此格式來撰寫註解：

```markdown
**[優先級] 類別：簡要標題**

問題或建議的詳細描述。

**為什麼這很重要：**
解釋建議的影響或原因。

**建議的修正：**
[如果適用，提供程式碼範例]

**參考：** [相關文件或標準的連結]
```

### 範例註解

#### 嚴重問題
````markdown
**🔴 嚴重 - 安全性：SQL 注入弱點**

第 45 行的查詢直接將使用者輸入串聯到 SQL 字串中，
產生 SQL 注入弱點。

**為什麼這很重要：**
攻擊者可以操縱電子郵件參數以執行任意 SQL 命令，
可能會暴露或刪除所有資料庫資料。

**建議的修正：**
```sql
-- 替代方案：
query = "SELECT * FROM users WHERE email = '" + email + "'"

-- 使用：
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ?"
);
stmt.setString(1, email);
```

**參考：** OWASP SQL Injection Prevention Cheat Sheet
````

#### 重要問題
````markdown
**🟡 重要 - 測試：關鍵路徑缺少測試覆蓋率**

`processPayment()` 函式處理金融交易，但沒有退款情境的測試。

**為什麼這很重要：**
退款涉及資金流動，應徹底測試以防止
財務錯誤或資料不一致。

**建議的修正：**
新增測試案例：
```javascript
test('should process full refund when order is cancelled', () => {
    const order = createOrder({ total: 100, status: 'cancelled' });

    const result = processPayment(order, { type: 'refund' });

    expect(result.refundAmount).toBe(100);
    expect(result.status).toBe('refunded');
});
```
````

#### 建議
````markdown
**🟢 建議 - 可讀性：簡化巢狀條件**

第 30-40 行的巢狀 if 語句使邏輯難以理解。

**為什麼這很重要：**
更簡單的程式碼更容易維護、偵錯和測試。

**建議的修正：**
```javascript
// 替代巢狀 if：
if (user) {
    if (user.isActive) {
        if (user.hasPermission('write')) {
            // do something
        }
    }
}

// 考慮衛語句：
if (!user || !user.isActive || !user.hasPermission('write')) {
    return;
}
// do something
```
````

## 審查清單

執行程式碼審查時，請系統性地驗證：

### 程式碼品質
- [ ] 程式碼遵循一致的風格和慣例
- [ ] 名稱具有描述性並遵循命名慣例
- [ ] 函式/方法小而專注
- [ ] 沒有程式碼重複
- [ ] 複雜邏輯分解為更簡單的部分
- [ ] 錯誤處理適當
- [ ] 沒有註解掉的程式碼或沒有票證的 TODO

### 安全性
- [ ] 程式碼或日誌中沒有敏感資料
- [ ] 所有使用者輸入都經過輸入驗證
- [ ] 沒有 SQL 注入弱點
- [ ] 身份驗證和授權正確實施
- [ ] 依賴項是最新且安全的

### 測試
- [ ] 新程式碼具有適當的測試覆蓋率
- [ ] 測試命名良好且專注
- [ ] 測試涵蓋邊緣案例和錯誤情境
- [ ] 測試獨立且確定
- [ ] 沒有總是通過或被註解掉的測試

### 效能
- [ ] 沒有明顯的效能問題（N+1、記憶體洩漏）
- [ ] 適當使用快取
- [ ] 高效的演算法和資料結構
- [ ] 正確的資源清理

### 架構
- [ ] 遵循既定模式和慣例
- [ ] 正確的關注點分離
- [ ] 沒有架構違規
- [ ] 依賴關係流向正確

### 文件
- [ ] 公共 API 有文件
- [ ] 複雜邏輯有解釋性註解
- [ ] 如有需要，README 已更新
- [ ] 破壞性變更已記載

## 專案特定自訂

若要為您的專案自訂此範本，請新增以下部分：

1. **語言/框架特定檢查**
   - 範例：「執行程式碼審查時，請驗證 React Hooks 遵循 Hooks 規則」
   - 範例：「執行程式碼審查時，請檢查 Spring Boot 控制器使用適當的註解」

2. **建構和部署**
   - 範例：「執行程式碼審查時，請驗證 CI/CD 流水線設定正確」
   - 範例：「執行程式碼審查時，請檢查資料庫遷移是可逆的」

3. **業務邏輯規則**
   - 範例：「執行程式碼審查時，請驗證定價計算包含所有適用稅金」
   - 範例：「執行程式碼審查時，請檢查在資料處理前已獲得使用者同意」

4. **團隊慣例**
   - 範例：「執行程式碼審查時，請驗證提交訊息遵循慣例提交格式」
   - 範例：「執行程式碼審查時，請檢查分支名稱遵循模式：type/ticket-description」

## 其他資源

有關有效的程式碼審查和 GitHub Copilot 自訂的更多資訊：

- [GitHub Copilot 提示工程](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering)
- [GitHub Copilot 自訂說明](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Awesome GitHub Copilot 儲存庫](https://github.com/github/awesome-copilot)
- [GitHub 程式碼審查指南](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests)
- [Google 工程實踐 - 程式碼審查](https://google.github.io/eng-practices/review/)
- [OWASP 安全指南](https://owasp.org/)

## 提示工程技巧

執行程式碼審查時，請應用來自 [GitHub Copilot 文件](https://docs.github.com/en/copilot/concepts/prompting/prompt-engineering) 的這些提示工程原則：

1. **先一般，後具體**：從高層架構審查開始，然後深入到實作細節
2. **提供範例**：建議變更時，引用程式碼庫中類似的模式
3. **分解複雜任務**：以邏輯區塊（安全性 → 測試 → 邏輯 → 風格）審查大型 PR
4. **避免模糊不清**：具體說明您正在處理哪個檔案、行和問題
5. **指出相關程式碼**：引用可能受變更影響的相關程式碼
6. **實驗和迭代**：如果初始審查遺漏了某些內容，請使用重點問題再次審查

## 專案上下文

這是一個通用範本。使用您的專案特定資訊自訂此部分：

- **技術棧**：[例如，Java 17、Spring Boot 3.x、PostgreSQL]
- **架構**：[例如，六邊形/清潔架構、微服務]
- **建構工具**：[例如，Gradle、Maven、npm、pip]
- **測試**：[例如，JUnit 5、Jest、pytest]
- **程式碼風格**：[例如，遵循 Google 風格指南]
