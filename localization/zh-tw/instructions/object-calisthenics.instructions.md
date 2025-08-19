---
applyTo: '**/*.{cs,ts,java}'
description: 強制執行物件健身操原則，確保商業領域程式碼乾淨、易維護且健壯
---
# 物件健身操規則

> ⚠️ **警告：** 本檔案包含原始 9 條物件健身操規則。不得新增其他規則，也不得替換或移除任何規則。
> 範例可於日後補充。

## 目標
本規則強制執行物件健身操原則，確保後端（主要是商業領域程式碼）乾淨、易維護且健壯。

## 範圍與適用
- **主要焦點：** 商業領域類別（聚合、實體、值物件、領域服務）
- **次要焦點：** 應用層服務與用例處理器
- **豁免：**
  - DTO（資料傳輸物件）
  - API 模型/契約
  - 設定類別
  - 無商業邏輯的簡單資料容器
  - 基礎建設程式碼（需彈性者）

## 核心原則

1. **每個方法僅一層縮排：**
   - 方法需簡單，縮排不得超過一層。

   ```csharp
   // 不佳範例 - 方法有多層縮排
   public void SendNewsletter() {
         foreach (var user in users) {
            if (user.IsActive) {
               // Do something
               mailer.Send(user.Email);
            }
         }
   }
   // 佳範例 - 抽出方法減少縮排
   public void SendNewsletter() {
       foreach (var user in users) {
           SendEmail(user);
       }
   }
   private void SendEmail(User user) {
       if (user.IsActive) {
           mailer.Send(user.Email);
       }
   }

   // 佳範例 - 先篩選再寄信
   public void SendNewsletter() {
       var activeUsers = users.Where(user => user.IsActive);

       foreach (var user in activeUsers) {
           mailer.Send(user.Email);
       }
   }
   ```
2. **不使用 ELSE 關鍵字：**

   - 避免使用 `else`，降低複雜度並提升可讀性。
   - 以早期回傳（early return）處理條件。
   - 採用 Fail Fast 原則
   - 方法開頭用 Guard Clauses 驗證輸入與條件。

   ```csharp
   // 不佳範例 - 使用 else
   public void ProcessOrder(Order order) {
       if (order.IsValid) {
           // Process order
       } else {
           // Handle invalid order
       }
   }
   // 佳範例 - 避免 else
   public void ProcessOrder(Order order) {
       if (!order.IsValid) return;
       // Process order
   }
   ```

   Fail fast 原則範例：
   ```csharp
   public void ProcessOrder(Order order) {
       if (order == null) throw new ArgumentNullException(nameof(order));
       if (!order.IsValid) throw new InvalidOperationException("Invalid order");
       // Process order
   }
   ```

3. **包裝所有原始型別與字串：**
   - 避免直接使用原始型別。
   - 以類別包裝，賦予語意與行為。

   ```csharp
   // 不佳範例 - 直接用原始型別
   public class User {
       public string Name { get; set; }
       public int Age { get; set; }
   }
   // 佳範例 - 包裝原始型別
   public class User {
       private string name;
       private Age age;
       public User(string name, Age age) {
           this.name = name;
           this.age = age;
       }
   }
   public class Age {
       private int value;
       public Age(int value) {
           if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "年齡不可為負");
           this.value = value;
       }
   }
   ```   

4. **一級集合（First Class Collections）：**
   - 用類別封裝集合資料與行為，勿直接暴露原始資料結構。
一級集合：類別若有陣列屬性，不得有其他屬性

```csharp
   // 不佳範例 - 暴露原始集合
   public class Group {
      public int Id { get; private set; }
      public string Name { get; private set; }
      public List<User> Users { get; private set; }

      public int GetNumberOfUsersIsActive() {
         return Users
            .Where(user => user.IsActive)
            .Count();
      }
   }

   // 佳範例 - 封裝集合行為
   public class Group {
      public int Id { get; private set; }
      public string Name { get; private set; }

      public GroupUserCollection userCollection { get; private set; } // 用類別封裝使用者集合

      public int GetNumberOfUsersIsActive() {
         return userCollection
            .GetActiveUsers()
            .Count();
      }
   }
   ```

5. **每行僅一個點（One Dot per Line）：**
   - 每行僅呼叫一次方法，提升可讀性與維護性。

   ```csharp
   // 不佳範例 - 一行多個方法呼叫
   public void ProcessOrder(Order order) {
       var userEmail = order.User.GetEmail().ToUpper().Trim();
       // Do something with userEmail
   }
   // 佳範例 - 每行僅一個點
   public void ProcessOrder(Order order) {
       var user = order.User;
       var email = user.GetEmail();
       var userEmail = email.ToUpper().Trim();
       // Do something with userEmail
   }
   ```

6. **不縮寫：**
   - 類別、方法、變數名稱具意義，不用縮寫。

   ```csharp
   // 不佳範例 - 縮寫命名
   public class U {
       public string N { get; set; }
   }
   // 佳範例 - 意義明確命名
   public class User {
       public string Name { get; set; }
   }
   ```

7. **保持實體精簡（類別、方法、命名空間或套件）：**
   - 類別與方法保持精簡，提升可讀性與維護性。
   - 每個類別僅負單一職責，越小越好。
   
   限制：
   - 每個類別最多 10 個方法
   - 每個類別最多 50 行
   - 每個套件或命名空間最多 10 個類別

   ```csharp
   // 不佳範例 - 類別職責過多
   public class UserManager {
       public void CreateUser(string name) { /*...*/ }
       public void DeleteUser(int id) { /*...*/ }
       public void SendEmail(string email) { /*...*/ }
   }

   // 佳範例 - 單一職責小型類別
   public class UserCreator {
       public void CreateUser(string name) { /*...*/ }
   }
   public class UserDeleter {
       public void DeleteUser(int id) { /*...*/ }
   }

   public class UserUpdater {
       public void UpdateUser(int id, string name) { /*...*/ }
   }
   ```


8. **類別不可有超過兩個實例變數：**
   - 鼓勵類別僅負單一職責，實例變數最多兩個。
   - 不計 ILogger 或其他 logger 為實例變數。

   ```csharp
   // 不佳範例 - 實例變數過多
   public class UserCreateCommandHandler {
      // 不佳：實例變數太多
      private readonly IUserRepository userRepository;
      private readonly IEmailService emailService;
      private readonly ILogger logger;
      private readonly ISmsService smsService;

      public UserCreateCommandHandler(IUserRepository userRepository, IEmailService emailService, ILogger logger, ISmsService smsService) {
         this.userRepository = userRepository;
         this.emailService = emailService;
         this.logger = logger;
         this.smsService = smsService;
      }
   }

   // 佳範例：僅兩個實例變數
   public class UserCreateCommandHandler {
      private readonly IUserRepository userRepository;
      private readonly INotificationService notificationService;
      private readonly ILogger logger; // logger 不計入

      public UserCreateCommandHandler(IUserRepository userRepository, INotificationService notificationService, ILogger logger) {
         this.userRepository = userRepository;
         this.notificationService = notificationService;
         this.logger = logger;
      }
   }
   ```

9. **領域類別不可有 Getter/Setter：**
   - 領域類別不可公開 setter。
   - 用私有建構子與靜態工廠方法建立物件。
   - **注意：** 此規則主要適用於領域類別，DTO 或資料傳輸物件不在此限。

   ```csharp
   // 不佳範例 - 領域類別公開 setter
   public class User {  // 領域類別
       public string Name { get; set; } // 領域類別請避免
   }
   
   // 佳範例 - 領域類別封裝
   public class User {  // 領域類別
       private string name;
       private User(string name) { this.name = name; }
       public static User Create(string name) => new User(name);
   }
   
   // 可接受範例 - DTO 公開 setter
   public class UserDto {  // DTO - 豁免
       public string Name { get; set; } // DTO 可公開 setter
   }
   ```

## 實作指引
- **領域類別：**
  - 用私有建構子與靜態工廠方法建立實例。
  - 屬性不可公開 setter。
  - 商業領域程式碼嚴格遵守 9 條規則。

- **應用層：**
  - 用例處理器與應用服務也需遵守這些規則。
  - 著重單一職責與乾淨抽象。

- **DTO 與資料物件：**
  - 規則 3（包裝原始型別）、8（兩個實例變數）、9（不可有 getter/setter）可放寬。
  - DTO 可公開屬性與 getter/setter。

- **測試：**
  - 測試需驗證物件行為而非狀態。
  - 測試類別可放寬規則以提升可讀性與維護性。

- **程式碼審查：**
  - 商業領域與應用層程式碼審查時強制執行這些規則。
  - 基礎建設與 DTO 程式碼可彈性處理。

## 參考資料
- [Object Calisthenics - Jeff Bay 原始 9 條規則](https://www.cs.helsinki.fi/u/luontola/tdd-2009/ext/ObjectCalisthenics.pdf)
- [ThoughtWorks - Object Calisthenics](https://www.thoughtworks.com/insights/blog/object-calisthenics)
- [Clean Code: A Handbook of Agile Software Craftsmanship - Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
