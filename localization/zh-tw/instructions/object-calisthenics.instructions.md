---
applyTo: '**/*.{cs,ts,java}'
description: '強制執行物件健美原則，以確保業務領域程式碼的清晰、可維護和穩健'
---
# 物件健美規則

> ⚠️ **警告：** 此檔案包含 9 條原始物件健美規則。不得新增任何額外規則，也不得替換或移除這些規則。
> 範例可以在以後需要時新增。

## 目標
此規則強制執行物件健美原則，以確保後端程式碼的清晰、可維護和穩健，**主要針對業務領域程式碼**。

## 範圍與應用程式
- **主要焦點**：業務領域類別（聚合、實體、值物件、領域服務）
- **次要焦點**：應用程式層服務和使用案例處理程式
- **豁免**：
  - DTOs (資料傳輸物件)
  - API 模型/契約
  - 配置類別
  - 不含業務邏輯的簡單資料容器
  - 需要彈性的基礎設施程式碼

## 關鍵原則

1. **每個方法只有一層縮排**：
   - 確保方法簡單且不超過一層縮排。

   ```csharp
   // Bad Example - 這個方法有多層縮排
   public void SendNewsletter() {
         foreach (var user in users) {
            if (user.IsActive) {
               // 做一些事情
               mailer.Send(user.Email);
            }
         }
   }
   // Good Example - 提取方法以減少縮排
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

   // Good Example - 在寄送電子郵件之前過濾使用者
   public void SendNewsletter() {
       var activeUsers = users.Where(user => user.IsActive);

       foreach (var user in activeUsers) {
           mailer.Send(user.Email);
       }
   }
   ```
2. **不要使用 ELSE 關鍵字**：

   - 避免使用 `else` 關鍵字以減少複雜性並提高可讀性。
   - 改用提前回傳來處理條件。
   - 使用 Fail Fast 原則
   - 使用 Guard Clauses 在方法開頭驗證輸入和條件。

   ```csharp
   // Bad Example - 使用 else
   public void ProcessOrder(Order order) {
       if (order.IsValid) {
           // 處理訂單
       } else {
           // 處理無效訂單
       }
   }
   // Good Example - 避免使用 else
   public void ProcessOrder(Order order) {
       if (!order.IsValid) return;
       // 處理訂單
   }
   ```

   Fail Fast 原則範例：
   ```csharp
   public void ProcessOrder(Order order) {
       if (order == null) throw new ArgumentNullException(nameof(order));
       if (!order.IsValid) throw new InvalidOperationException("Invalid order");
       // 處理訂單
   }
   ```

3. **包裝所有基本類型和字串**：
   - 避免直接在程式碼中使用基本類型。
   - 將它們包裝在類別中以提供有意義的上下文和行為。

   ```csharp
   // Bad Example - 直接使用基本類型
   public class User {
       public string Name { get; set; }
       public int Age { get; set; }
   }
   // Good Example - 包裝基本類型
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
           if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "年齡不能為負數");
           this.value = value;
       }
   }
   ```   

4. **第一級集合**：
   - 使用集合來封裝資料和行為，而不是暴露原始資料結構。
第一級集合：一個包含陣列作為屬性的類別不應包含任何其他屬性

```csharp
   // Bad Example - 暴露原始集合
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

   // Good Example - 封裝集合行為
   public class Group {
      public int Id { get; private set; }
      public string Name { get; private set; }

      public GroupUserCollection userCollection { get; private set; } // 使用者清單被封裝在一個類別中

      public int GetNumberOfUsersIsActive() {
         return userCollection
            .GetActiveUsers()
            .Count();
      }
   }
   ```

5. **每行一個點**：
   - 避免通過每行只有一個點來違反迪米特法則。

   ```csharp
   // Bad Example - 單行多個點
   public void ProcessOrder(Order order) {
       var userEmail = order.User.GetEmail().ToUpper().Trim();
       // 對 userEmail 做一些事情
   }
   // Good Example - 每行一個點
   public class User {
     public NormalizedEmail GetEmail() {
       return NormalizedEmail.Create(/*...*/);       
     }
   }
   public class Order {
     /*...*/
     public NormalizedEmail ConfirmationEmail() {
       return User.GetEmail();         
     }
   }
   public void ProcessOrder(Order order) {
       var confirmationEmail = order.ConfirmationEmail();
       // 對 confirmationEmail 做一些事情
   }
   ```

6. **不要縮寫**：
   - 為類別、方法和變數使用有意義的名稱。
   - 避免可能導致混淆的縮寫。

   ```csharp
   // Bad Example - 縮寫名稱
   public class U {
       public string N { get; set; }
   }
   // Good Example - 有意義的名稱
   public class User {
       public string Name { get; set; }
   }
   ```

7. **保持實體小（類別、方法、命名空間或套件）**：
   - 限制類別和方法的資料量以提高程式碼可讀性和可維護性。
   - 每個類別應具有單一職責並盡可能小。

   約束：
   - 每個類別最多 10 個方法
   - 每個類別最多 50 行
   - 每個套件或命名空間最多 10 個類別

   ```csharp
   // Bad Example - 具有多重職責的大類別
   public class UserManager {
       public void CreateUser(string name) { /*...*/ }
       public void DeleteUser(int id) { /*...*/ }
       public void SendEmail(string email) { /*...*/ }
   }

   // Good Example - 具有單一職責的小類別
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

8. **不超過兩個實例變數的類別**：
   - 通過限制實例變數的數量來鼓勵類別具有單一職責。
   - 將實例變數的數量限制為兩個以保持簡單性。
   - 不將 ILogger 或任何其他記錄器計為實例變數。

   ```csharp
   // Bad Example - 具有多個實例變數的類別
   public class UserCreateCommandHandler {
      // 錯誤：太多實例變數
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

   // 好範例：具有兩個實例變數的類別
   public class UserCreateCommandHandler {
      private readonly IUserRepository userRepository;
      private readonly INotificationService notificationService;
      private readonly ILogger logger; // 不計為實例變數

      public UserCreateCommandHandler(IUserRepository userRepository, INotificationService notificationService, ILogger logger) {
         this.userRepository = userRepository;
         this.notificationService = notificationService;
         this.logger = logger;
      }
   }
   ```

9. **領域類別中沒有 Getter/Setter**：
   - 避免在領域類別中暴露屬性的 Setter。
   - 使用私有建構子和靜態工廠方法來物件建立。
   - **注意**：此規則主要適用於領域類別，而非 DTO 或資料傳輸物件。

   ```csharp
   // Bad Example - 具有公共 Setter 的領域類別
   public class User {  // 領域類別
       public string Name { get; set; } // 在領域類別中避免這樣做
   }

   // Good Example - 具有封裝的領域類別
   public class User {  // 領域類別
       private string name;
       private User(string name) { this.name = name; }
       public static User Create(string name) => new User(name);
   }

   // 可接受的範例 - 具有公共 Setter 的 DTO
   public class UserDto {  // DTO - 適用豁免
       public string Name { get; set; } // 對於 DTO 是可接受的
   }
   ```

## 實作指南
- **領域類別**：
  - 使用私有建構子和靜態工廠方法來建立實例。
  - 避免暴露屬性的 Setter。
  - 對業務領域程式碼嚴格應用所有 9 條規則。

- **應用程式層**：
  - 將這些規則應用於使用案例處理程式和應用程式服務。
  - 專注於維護單一職責和清晰的抽象。

- **DTO 和資料物件**：
  - 規則 3（包裝基本類型）、8（兩個實例變數）和 9（沒有 Getter/Setter）可以針對 DTO 放寬。
  - 具有 Getter/Setter 的公共屬性對於資料傳輸物件是可接受的。

- **測試**：
  - 確保測試驗證物件的行為而不是其狀態。
  - 測試類別可能為了可讀性和可維護性而放寬規則。

- **程式碼審查**：
  - 在領域和應用程式程式碼的程式碼審查期間強制執行這些規則。
  - 對基礎設施和 DTO 程式碼務實。

## 參考
- [物件健美 - Jeff Bay 的原始 9 條規則](https://www.cs.helsinki.fi/u/luontola/tdd-2009/ext/ObjectCalisthenics.pdf)
- [ThoughtWorks - 物件健美](https://www.thoughtworks.com/insights/blog/object-calisthenics)
- [Clean Code: A Handbook of Agile Software Craftsmanship - Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
