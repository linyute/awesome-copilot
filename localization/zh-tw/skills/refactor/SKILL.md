---
name: refactor
description: '進行精確的程式碼重構，在不改變行為的情況下提高可維護性。涵蓋提取函式、重新命名變數、拆解龐大函式（god functions）、提高型別安全性、消除程式碼異味以及應用設計模式。比 repo-rebuilder 的影響較小；用於漸進式改進。'
license: MIT
---

# 重構

## 概覽

在不改變外部行為的情況下改進程式碼結構和可讀性。重構是漸進式的演進，而非革命。將此用於改進現有的程式碼，而不是從頭開始重寫。

## 何時使用

在以下情況使用此技能：

- 程式碼難以理解或維護
- 函式/類別過於龐大
- 需要處理程式碼異味
- 由於程式碼結構而難以新增功能
- 使用者要求「清理此程式碼」、「重構此程式碼」、「改進此程式碼」

---

## 重構原則

### 金科玉律

1. **行為被保留** - 重構不改變程式碼的功能，只改變其實作方式
2. **小步前進** - 進行微小的變更，並在每次變更後進行測試
3. **版本控制是你的好夥伴** - 在每個安全狀態前後進行提交（commit）
4. **測試至關重要** - 沒有測試，你不是在重構，你只是在編輯
5. **一次只做一件事** - 不要將重構與功能變更混在一起

### 何時不要重構

```
- 運作正常且不會再更改的程式碼（如果沒壞...）
- 沒有測試的關鍵生產環境程式碼（先新增測試）
- 當你面臨緊迫的截止日期時
- 「只是因為」 - 需要一個明確的目的
```

---

## 常見的程式碼異味與修復方法

### 1. 過長的函式（Long Method/Function）

```diff
# 差：200 行的函式包山包海
- async function processOrder(orderId) {
-   // 50 行：獲取訂單
-   // 30 行：驗證訂單
-   // 40 行：計算定價
-   // 30 行：更新庫存
-   // 20 行：建立出貨
-   // 30 行：傳送通知
- }

# 好：拆解成專注的函式
+ async function processOrder(orderId) {
+   const order = await fetchOrder(orderId);
+   validateOrder(order);
+   const pricing = calculatePricing(order);
+   await updateInventory(order);
+   const shipment = await createShipment(order);
+   await sendNotifications(order, pricing, shipment);
+   return { order, pricing, shipment };
+ }
```

### 2. 重複的程式碼（Duplicated Code）

```diff
# 差：多處地方有相同的邏輯
- function calculateUserDiscount(user) {
-   if (user.membership === 'gold') return user.total * 0.2;
-   if (user.membership === 'silver') return user.total * 0.1;
-   return 0;
- }
-
- function calculateOrderDiscount(order) {
-   if (order.user.membership === 'gold') return order.total * 0.2;
-   if (order.user.membership === 'silver') return order.total * 0.1;
-   return 0;
- }

# 好：提取共同邏輯
+ function getMembershipDiscountRate(membership) {
+   const rates = { gold: 0.2, silver: 0.1 };
+   return rates[membership] || 0;
+ }
+
+ function calculateUserDiscount(user) {
+   return user.total * getMembershipDiscountRate(user.membership);
+ }
+
+ function calculateOrderDiscount(order) {
+   return order.total * getMembershipDiscountRate(order.user.membership);
+ }
```

### 3. 過大的類別/模組（Large Class/Module）

```diff
# 差：全能物件（God object）知道得太多
- class UserManager {
-   createUser() { /* ... */ }
-   updateUser() { /* ... */ }
-   deleteUser() { /* ... */ }
-   sendEmail() { /* ... */ }
-   generateReport() { /* ... */ }
-   handlePayment() { /* ... */ }
-   validateAddress() { /* ... */ }
-   // 還有 50 個方法...
- }

# 好：每個類別單一職責
+ class UserService {
+   create(data) { /* ... */ }
+   update(id, data) { /* ... */ }
+   delete(id) { /* ... */ }
+ }
+
+ class EmailService {
+   send(to, subject, body) { /* ... */ }
+ }
+
+ class ReportService {
+   generate(type, params) { /* ... */ }
+ }
+
+ class PaymentService {
+   process(amount, method) { /* ... */ }
+ }
```

### 4. 過長的參數列表（Long Parameter List）

```diff
# 差：太多參數
- function createUser(email, password, name, age, address, city, country, phone) {
-   /* ... */
- }

# 好：將相關參數分組
+ interface UserData {
+   email: string;
+   password: string;
+   name: string;
+   age?: number;
+   address?: Address;
+   phone?: string;
+ }
+
+ function createUser(data: UserData) {
+   /* ... */
+ }

# 更好：對複雜的建構使用生成器模式（Builder pattern）
+ const user = UserBuilder
+   .email('test@example.com')
+   .password('secure123')
+   .name('Test User')
+   .address(address)
+   .build();
```

### 5. 依附情節（Feature Envy）

```diff
# 差：方法使用另一個物件的資料多於使用自己的資料
- class Order {
-   calculateDiscount(user) {
-     if (user.membershipLevel === 'gold') {
+       return this.total * 0.2;
+     }
+     if (user.accountAge > 365) {
+       return this.total * 0.1;
+     }
+     return 0;
+   }
+ }

# 好：將邏輯移至擁有該資料的物件
+ class User {
+   getDiscountRate(orderTotal) {
+     if (this.membershipLevel === 'gold') return 0.2;
+     if (this.accountAge > 365) return 0.1;
+     return 0;
+   }
+ }
+
+ class Order {
+   calculateDiscount(user) {
+     return this.total * user.getDiscountRate(this.total);
+   }
+ }
```

### 6. 基本型別迷戀（Primitive Obsession）

```diff
# 差：使用基本型別表示領域概念
- function sendEmail(to, subject, body) { /* ... */ }
- sendEmail('user@example.com', 'Hello', '...');

- function createPhone(country, number) {
-   return `${country}-${number}`;
- }

# 好：使用領域型別
+ class Email {
+   private constructor(public readonly value: string) {
+     if (!Email.isValid(value)) throw new Error('Invalid email');
+   }
+   static create(value: string) { return new Email(value); }
+   static isValid(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
+ }
+
+ class PhoneNumber {
+   constructor(
+     public readonly country: string,
+     public readonly number: string
+   ) {
+     if (!PhoneNumber.isValid(country, number)) throw new Error('Invalid phone');
+   }
+   toString() { return `${this.country}-${this.number}`; }
+   static isValid(country: string, number: string) { /* ... */ }
+ }
+
+ // 用法
+ const email = Email.create('user@example.com');
+ const phone = new PhoneNumber('1', '555-1234');
```

### 7. 神秘數值/字串（Magic Numbers/Strings）

```diff
# 差：不明所以的數值
- if (user.status === 2) { /* ... */ }
- const discount = total * 0.15;
- setTimeout(callback, 86400000);

# 好：具名常數
+ const UserStatus = {
+   ACTIVE: 1,
+   INACTIVE: 2,
+   SUSPENDED: 3
+ } as const;
+
+ const DISCOUNT_RATES = {
+   STANDARD: 0.1,
+   PREMIUM: 0.15,
+   VIP: 0.2
+ } as const;
+
+ const ONE_DAY_MS = 24 * 60 * 60 * 1000;
+
+ if (user.status === UserStatus.INACTIVE) { /* ... */ }
+ const discount = total * DISCOUNT_RATES.PREMIUM;
+ setTimeout(callback, ONE_DAY_MS);
```

### 8. 巢狀條件句（Nested Conditionals）

```diff
# 差：箭頭型程式碼（Arrow code）
- function process(order) {
-   if (order) {
-     if (order.user) {
-       if (order.user.isActive) {
-         if (order.total > 0) {
-           return processOrder(order);
+         } else {
+           return { error: 'Invalid total' };
+         }
+       } else {
+         return { error: 'User inactive' };
+       }
+     } else {
+       return { error: 'No user' };
+     }
+   } else {
+     return { error: 'No order' };
+   }
+ }

# 好：衛句（Guard clauses）/ 提早回傳
+ function process(order) {
+   if (!order) return { error: 'No order' };
+   if (!order.user) return { error: 'No user' };
+   if (!order.user.isActive) return { error: 'User inactive' };
+   if (order.total <= 0) return { error: 'Invalid total' };
+   return processOrder(order);
+ }

# 更好：使用 Result 型別
+ function process(order): Result<ProcessedOrder, Error> {
+   return Result.combine([
+     validateOrderExists(order),
+     validateUserExists(order),
+     validateUserActive(order.user),
+     validateOrderTotal(order)
+   ]).flatMap(() => processOrder(order));
+ }
```

### 9. 廢棄程式碼（Dead Code）

```diff
# 差：殘留不用的程式碼
- function oldImplementation() { /* ... */ }
- const DEPRECATED_VALUE = 5;
- import { unusedThing } from './somewhere';
- // 註解掉的程式碼
- // function oldCode() { /* ... */ }

# 好：將其移除
+ // 刪除不用的函式、匯入和註解程式碼
+ // 如果你以後還需要它，Git 歷史紀錄中都有
```

### 10. 過度親密（Inappropriate Intimacy）

```diff
# 差：一個類別深入接觸另一個類別
- class OrderProcessor {
-   process(order) {
-     order.user.profile.address.street;  // 太親密了
-     order.repository.connection.config;  // 破壞封裝
+   }
+ }

# 好：告訴他你要什麼，而不是叫他怎麼做（Ask, don't tell）
+ class OrderProcessor {
+   process(order) {
+     order.getShippingAddress();  // 訂單知道如何獲取地址
+     order.save();  // 訂單知道如何儲存自己
+   }
+ }
```

---

## 提取函式重構（Extract Method Refactoring）

### 重構前後

```diff
# 前：一個過長的函式
- function printReport(users) {
-   console.log('使用者報表');
-   console.log('============');
-   console.log('');
-   console.log(`使用者總數：${users.length}`);
-   console.log('');
-   console.log('有效使用者');
-   console.log('------------');
-   const active = users.filter(u => u.isActive);
-   active.forEach(u => {
-     console.log(`- ${u.name} (${u.email})`);
-   });
-   console.log('');
-   console.log(`有效人數：${active.length}`);
-   console.log('');
-   console.log('無效使用者');
-   console.log('--------------');
-   const inactive = users.filter(u => !u.isActive);
-   inactive.forEach(u => {
-     console.log(`- ${u.name} (${u.email})`);
-   });
-   console.log('');
-   console.log(`無效人數：${inactive.length}`);
- }

# 後：提取後的函式
+ function printReport(users) {
+   printHeader('使用者報表');
+   console.log(`使用者總數：${users.length}\n`);
+   printUserSection('有效使用者', users.filter(u => u.isActive));
+   printUserSection('無效使用者', users.filter(u => !u.isActive));
+ }
+
+ function printHeader(title) {
+   const line = '='.repeat(title.length);
+   console.log(title);
+   console.log(line);
+   console.log('');
+ }
+
+ function printUserSection(title, users) {
+   console.log(title);
+   console.log('-'.repeat(title.length));
+   users.forEach(u => console.log(`- ${u.name} (${u.email})`));
+   console.log('');
+   console.log(`${title.split(' ')[0]}：${users.length}`);
+   console.log('');
+ }
```

---

## 導入型別安全性（Introducing Type Safety）

### 從無型別到有型別

```diff
# 前：無型別
- function calculateDiscount(user, total, membership, date) {
-   if (membership === 'gold' && date.getDay() === 5) {
-     return total * 0.25;
-   }
-   if (membership === 'gold') return total * 0.2;
-   return total * 0.1;
- }

# 後：完整的型別安全性
+ type Membership = 'bronze' | 'silver' | 'gold';
+
+ interface User {
+   id: string;
+   name: string;
+   membership: Membership;
+ }
+
+ interface DiscountResult {
+   original: number;
+   discount: number;
+   final: number;
+   rate: number;
+ }
+
+ function calculateDiscount(
+   user: User,
+   total: number,
+   date: Date = new Date()
+ ): DiscountResult {
+   if (total < 0) throw new Error('總額不能為負數');
+
+   let rate = 0.1; // 預設為 bronze（青銅）
+
+   if (user.membership === 'gold' && date.getDay() === 5) {
+     rate = 0.25; // 金卡的週五加碼
+   } else if (user.membership === 'gold') {
+     rate = 0.2;
+   } else if (user.membership === 'silver') {
+     rate = 0.15;
+   }
+
+   const discount = total * rate;
+
+   return {
+     original: total,
+     discount,
+     final: total - discount,
+     rate
+   };
+ }
```

---

## 用於重構的設計模式（Design Patterns for Refactoring）

### 策略模式（Strategy Pattern）

```diff
# 前：條件邏輯
- function calculateShipping(order, method) {
-   if (method === 'standard') {
-     return order.total > 50 ? 0 : 5.99;
-   } else if (method === 'express') {
-     return order.total > 100 ? 9.99 : 14.99;
+   } else if (method === 'overnight') {
+     return 29.99;
+   }
+ }

# 後：策略模式
+ interface ShippingStrategy {
+   calculate(order: Order): number;
+ }
+
+ class StandardShipping implements ShippingStrategy {
+   calculate(order: Order) {
+     return order.total > 50 ? 0 : 5.99;
+   }
+ }
+
+ class ExpressShipping implements ShippingStrategy {
+   calculate(order: Order) {
+     return order.total > 100 ? 9.99 : 14.99;
+   }
+ }
+
+ class OvernightShipping implements ShippingStrategy {
+   calculate(order: Order) {
+     return 29.99;
+   }
+ }
+
+ function calculateShipping(order: Order, strategy: ShippingStrategy) {
+   return strategy.calculate(order);
+ }
```

### 責任鏈模式（Chain of Responsibility）

```diff
# 前：巢狀驗證
- function validate(user) {
-   const errors = [];
-   if (!user.email) errors.push('電子郵件必填');
+   else if (!isValidEmail(user.email)) errors.push('無效的電子郵件');
+   if (!user.name) errors.push('名稱必填');
+   if (user.age < 18) errors.push('必須年滿 18 歲');
+   if (user.country === 'blocked') errors.push('不支援該國家');
+   return errors;
+ }

# 後：責任鏈
+ abstract class Validator {
+   abstract validate(user: User): string | null;
+   setNext(validator: Validator): Validator {
+     this.next = validator;
+     return validator;
+   }
+   validate(user: User): string | null {
+     const error = this.doValidate(user);
+     if (error) return error;
+     return this.next?.validate(user) ?? null;
+   }
+ }
+
+ class EmailRequiredValidator extends Validator {
+   doValidate(user: User) {
+     return !user.email ? '電子郵件必填' : null;
+   }
+ }
+
+ class EmailFormatValidator extends Validator {
+   doValidate(user: User) {
+     return user.email && !isValidEmail(user.email) ? '無效的電子郵件' : null;
+   }
+ }
+
+ // 建構責任鏈
+ const validator = new EmailRequiredValidator()
+   .setNext(new EmailFormatValidator())
+   .setNext(new NameRequiredValidator())
+   .setNext(new AgeValidator())
+   .setNext(new CountryValidator());
```

---

## 重構步驟

### 安全重構流程

```
1. 準備 (PREPARE)
   - 確保測試存在（如果缺失，請編寫測試）
   - 提交（commit）目前狀態
   - 建立功能分支（feature branch）

2. 識別 (IDENTIFY)
   - 找出要處理的程式碼異味
   - 理解程式碼的作用
   - 規劃重構方式

3. 重構 (REFACTOR) (小步進行)
   - 進行一個微小的變更
   - 執行測試
   - 如果測試通過，則提交變更
   - 重複上述步驟

4. 驗證 (VERIFY)
   - 所有測試皆通過
   - 必要時進行手動測試
   - 效能維持不變或有所提升

5. 清理 (CLEAN UP)
   - 更新註解
   - 更新文件
   - 進行最終提交
```

---

## 重構檢查表

### 程式碼品質

- [ ] 函式短小（< 50 行）
- [ ] 函式只做一件事
- [ ] 沒有重複的程式碼
- [ ] 具描述性的名稱（變數、函式、類別）
- [ ] 沒有神秘數值/字串
- [ ] 已移除廢棄程式碼

### 結構

- [ ] 相關程式碼放在一起
- [ ] 清晰的模組界限
- [ ] 依賴關係流向單一方向
- [ ] 沒有循環依賴（circular dependencies）

### 型別安全性

- [ ] 為所有公開 API 定義型別
- [ ] 沒有無理由的 `any` 型別
- [ ] 明確標記可為空（nullable）的型別

### 測試

- [ ] 重構後的程式碼已通過測試
- [ ] 測試涵蓋邊界情況
- [ ] 所有測試皆通過

---

## 常見重構操作

| 操作                                                                 | 描述                   |
| -------------------------------------------------------------------- | ---------------------- |
| 提取函式 (Extract Method)                                            | 將程式碼片段轉化為函式 |
| 提取類別 (Extract Class)                                             | 將行為移至新類別       |
| 提取介面 (Extract Interface)                                         | 從實作中建立介面       |
| 內聯函式 (Inline Method)                                             | 將函式主體移回呼叫者   |
| 內聯類別 (Inline Class)                                              | 將類別行為移至呼叫者   |
| 上移函式 (Pull Up Method)                                            | 將函式移至父類別       |
| 下移函式 (Push Down Method)                                          | 將函式移至子類別       |
| 重新命名函式/變數 (Rename Method/Variable)                            | 提高清晰度             |
| 引入參數物件 (Introduce Parameter Object)                            | 將相關參數分組         |
| 以多型取代條件句 (Replace Conditional with Polymorphism)              | 使用多型取代 switch/if |
| 以常數取代神秘數值 (Replace Magic Number with Constant)               | 具名常數               |
| 分解條件句 (Decompose Conditional)                                   | 拆解複雜條件           |
| 合併條件句 (Consolidate Conditional)                                 | 合併重複條件           |
| 以衛句取代巢狀條件句 (Replace Nested Conditional with Guard Clauses)  | 提早回傳               |
| 引入空物件 (Introduce Null Object)                                   | 消除空值檢查           |
| 以類別/列舉取代型別代碼 (Replace Type Code with Class/Enum)            | 強型別                |
| 以委託取代繼承 (Replace Inheritance with Delegation)                 | 組合優於繼承           |
