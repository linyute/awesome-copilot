--- 
description: '適用於 Salesforce 平台的 Apex 開發指南與最佳實務'
applyTo: '**/*.cls, **/*.trigger'
---

# Apex 開發

## 一般指示

- 始終使用 Salesforce 平台上最新的 Apex 功能與最佳實務。
- 為每個類別與方法編寫清晰簡潔的註解，解釋業務邏輯與任何複雜的呼叫。
- 處理邊緣案例，並實作適當的例外處理，提供有意義的錯誤訊息。
- 專注於批量化 (bulkification) - 編寫可處理多筆記錄集合而非單筆記錄的程式碼。
- 留意管理員限制 (governor limits)，並設計可有效延展的解決方案。
- 使用服務層、網域類別與選取器類別來實作適當的關注點分離。
- 在註解中記錄外部依賴項、整合點及其用途。

## 命名慣例

- **類別**: 類別名稱使用 `PascalCase`。描述性地命名類別以反映其目的。
  - 控制器 (Controllers): 後綴為 `Controller` (例如，`AccountController`)
  - 觸發處理器 (Trigger Handlers): 後綴為 `TriggerHandler` (例如，`AccountTriggerHandler`)
  - 服務類別 (Service Classes): 後綴為 `Service` (例如，`AccountService`)
  - 選取器類別 (Selector Classes): 後綴為 `Selector` (例如，`AccountSelector`)
  - 測試類別 (Test Classes): 後綴為 `Test` (例如，`AccountServiceTest`)
  - 批次類別 (Batch Classes): 後綴為 `Batch` (例如，`AccountCleanupBatch`)
  - 可佇列類別 (Queueable Classes): 後綴為 `Queueable` (例如，`EmailNotificationQueueable`)

- **方法**: 方法名稱使用 `camelCase`。使用動詞表示動作。
  - 良好範例: `getActiveAccounts()`、`updateContactEmail()`、`deleteExpiredRecords()`
  - 避免縮寫: `getAccs()` → `getAccounts()`

- **變數**: 變數名稱使用 `camelCase`。使用描述性名稱。
  - 良好範例: `accountList`、`emailAddress`、`totalAmount`
  - 除了迴圈計數器外，避免單個字母: `a` → `account`

- **常數**: 常數使用 `UPPER_SNAKE_CASE`。
  - 良好範例: `MAX_BATCH_SIZE`、`DEFAULT_EMAIL_TEMPLATE`、`ERROR_MESSAGE_PREFIX`

- **觸發器**: 觸發器命名為 `物件名稱` + 觸發事件 (例如，`AccountTrigger`、`ContactTrigger`)

## 最佳實務

### 批量化

- **始終編寫批量化程式碼** - 設計所有程式碼以處理多筆記錄集合，而非單筆記錄。
- 避免在迴圈內執行 SOQL 查詢與 DML 語句。
- 使用集合 (`List<>`、`Set<>`、`Map<>`) 以有效率地處理多筆記錄。

```apex
// 良好範例 - 批量化
public static void updateAccountRating(List<Account> accounts) {
    for (Account acc : accounts) {
        if (acc.AnnualRevenue > 1000000) {
            acc.Rating = 'Hot';
        }
    }
    update accounts;
}

// 不良範例 - 未批量化
public static void updateAccountRating(Account account) {
    if (account.AnnualRevenue > 1000000) {
        account.Rating = 'Hot';
        update account; // 為單筆記錄設計的方法中的 DML 呼叫
    }
}
```

### O(1) 查詢的 Map

- **使用 Map 進行高效查詢** - 將列表轉換為 Map，以實現 O(1) 常數時間查詢，而非 O(n) 列表迭代。
- 使用 `Map<Id, SObject>` 建構函式快速將查詢結果轉換為 Map。
- 適用於匹配相關記錄、查詢與避免巢狀迴圈。

```apex
// 良好範例 - 使用 Map 進行 O(1) 查詢
Map<Id, Account> accountMap = new Map<Id, Account>([
    SELECT Id, Name, Industry FROM Account WHERE Id IN :accountIds
]);

for (Contact con : contacts) {
    Account acc = accountMap.get(con.AccountId);
    if (acc != null) {
        con.Industry__c = acc.Industry;
    }
}

// 不良範例 - 具有 O(n²) 複雜度的巢狀迴圈
List<Account> accounts = [SELECT Id, Name, Industry FROM Account WHERE Id IN :accountIds];

for (Contact con : contacts) {
    for (Account acc : accounts) {
        if (con.AccountId == acc.Id) {
            con.Industry__c = acc.Industry;
            break;
        }
    }
}

// 良好範例 - 用於分組記錄的 Map
Map<Id, List<Contact>> contactsByAccountId = new Map<Id, List<Contact>>());
for (Contact con : contacts) {
    if (!contactsByAccountId.containsKey(con.AccountId)) {
        contactsByAccountId.put(con.AccountId, new List<Contact>());
    }
    contactsByAccountId.get(con.AccountId).add(con);
}
```

### 管理員限制

- 留意 Salesforce 管理員限制：SOQL 查詢 (100)、DML 語句 (150)、堆積大小 (6MB)、CPU 時間 (10s)。
- 使用 `System.Limits` 類別主動監控管理員限制，以在達到限制前檢查消耗。
- 使用帶有選擇性篩選器與適當索引的高效 SOQL 查詢。
- 實作 **SOQL 迴圈** 以處理大型資料集。
- 使用 **批次 Apex** 處理大量資料 (超過 50,000 筆記錄)。
- 利用 **平台快取** 減少冗餘的 SOQL 查詢。

```apex
// 良好範例 - 處理大型資料集的 SOQL 迴圈
public static void processLargeDataSet() {
    for (List<Account> accounts : [SELECT Id, Name FROM Account]) {
        // 處理 200 筆記錄的批次
        processAccounts(accounts);
    }
}

// 良好範例 - 使用 WHERE 子句減少查詢結果
List<Account> accounts = [SELECT Id, Name FROM Account WHERE IsActive__c = true LIMIT 200];
```

### 安全性與資料存取

- 在執行 SOQL 查詢或 DML 呼叫前，**始終檢查 CRUD/FLS 權限**。
- 在 SOQL 查詢中使用 `WITH SECURITY_ENFORCED` 以強制執行欄位層級安全性。
- 使用 `Security.stripInaccessible()` 移除使用者無法存取的欄位。
- 實作 `WITH SHARING` 關鍵字以強制執行共享規則的類別。
- 僅在必要時使用 `WITHOUT SHARING`，並記錄原因。
- 對於公用程式類別，使用 `INHERITED SHARING` 以繼承呼叫情境。

```apex
// 良好範例 - 檢查 CRUD 並使用 stripInaccessible
public with sharing class AccountService {
    public static List<Account> getAccounts() {
        if (!Schema.sObjectType.Account.isAccessible()) {
            throw new SecurityException('使用者沒有存取 Account 物件的權限');
        }

        List<Account> accounts = [SELECT Id, Name, Industry FROM Account WITH SECURITY_ENFORCED];

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE, accounts
        );

        return decision.getRecords();
    }
}

// 良好範例 - 用於共享規則的 WITH SHARING
public with sharing class AccountController {
    // 此類別強制執行記錄層級共享
}
```

### 例外處理

- 始終為 DML 呼叫與呼叫 (callouts) 使用 try-catch 區塊。
- 為特定的錯誤情境建立自訂例外類別。
- 適當地記錄例外以進行偵錯與監控。
- 為使用者提供有意義的錯誤訊息。

```apex
// 良好範例 - 適當的例外處理
public class AccountService {
    public class AccountServiceException extends Exception {}

    public static void safeUpdate(List<Account> accounts) {
        try {
            if (!Schema.sObjectType.Account.isUpdateable()) {
                throw new AccountServiceException('使用者沒有更新帳戶的權限');
            }
            update accounts;
        } catch (DmlException e) {
            System.debug(LoggingLevel.ERROR, 'DML 錯誤: ' + e.getMessage());
            throw new AccountServiceException('無法更新帳戶: ' + e.getMessage());
        }
    }
}
```

### SOQL 最佳實務

- 使用帶有索引欄位 (`Id`、`Name`、`OwnerId`、自訂索引欄位) 的選擇性查詢。
- 在適當情況下使用 `LIMIT` 子句限制查詢結果。
- 當只需要一筆記錄時，使用 `LIMIT 1`。
- 避免 `SELECT *` - 始終指定所需欄位。
- 使用關係查詢以最大程度地減少 SOQL 查詢的數量。
- 盡可能按索引欄位排序查詢。
- 當在 SOQL 查詢中使用使用者輸入時，**始終使用 `String.escapeSingleQuotes()`** 以防止 SOQL 注入攻擊。
- **檢查查詢選擇性** - 目標是 >10% 選擇性 (篩選器將結果減少到總記錄數的 <10%)。
- 使用 **查詢計畫** 驗證查詢效率與索引使用。
- 使用實際資料量測試查詢以確保效能。

```apex
// 良好範例 - 帶有索引欄位的選擇性查詢
List<Account> accounts = [
    SELECT Id, Name, (SELECT Id, LastName FROM Contacts)
    FROM Account
    WHERE OwnerId = :UserInfo.getUserId()
    AND CreatedDate = THIS_MONTH
    LIMIT 100
];

// 良好範例 - 單筆記錄的 LIMIT 1
Account account = [SELECT Id, Name FROM Account WHERE Name = 'Acme' LIMIT 1];

// 良好範例 - escapeSingleQuotes() 以防止 SOQL 注入
String searchTerm = String.escapeSingleQuotes(userInput);
List<Account> accounts = Database.query('SELECT Id, Name FROM Account WHERE Name LIKE \'%' + searchTerm + '%\'');

// 不良範例 - 未經跳脫的直接使用者輸入 (安全風險)
List<Account> accounts = Database.query('SELECT Id, Name FROM Account WHERE Name LIKE \'%' + userInput + '%\'');

// 良好範例 - 帶有索引欄位的選擇性查詢 (高選擇性)
List<Account> accounts = [
    SELECT Id, Name FROM Account
    WHERE OwnerId = :UserInfo.getUserId()
    AND CreatedDate = TODAY
    LIMIT 100
];

// 不良範例 - 非選擇性查詢 (掃描整個資料表)
List<Account> accounts = [
    SELECT Id, Name FROM Account
    WHERE Description LIKE '%test%'  // 未索引欄位
];

// 在開發者控制台中檢查查詢效能:
// 1. 在開發者控制台中啟用「使用查詢計畫」
// 2. 執行 SOQL 查詢並檢視「查詢計畫」索引標籤
// 3. 尋找「索引」使用情況與「資料表掃描」
// 4. 確保選擇性 > 10% 以獲得最佳效能
```

### 觸發器最佳實務

- 每個物件使用**一個觸發器**以保持清晰度並避免衝突。
- 在處理器類別中實作觸發器邏輯，而非直接在觸發器中。
- 使用觸發器框架進行一致的觸發器管理。
- 利用觸發器內容變數: `Trigger.new`、`Trigger.old`、`Trigger.newMap`、`Trigger.oldMap`。
- 檢查觸發器內容: `Trigger.isBefore`、`Trigger.isAfter`、`Trigger.isInsert` 等。

```apex
// 良好範例 - 帶有處理器模式的觸發器
trigger AccountTrigger on Account (before insert, before update, after insert, after update) {
    new AccountTriggerHandler().run();
}

// 處理器類別
public class AccountTriggerHandler extends TriggerHandler {
    private List<Account> newAccounts;
    private List<Account> oldAccounts;
    private Map<Id, Account> newAccountMap;
    private Map<Id, Account> oldAccountMap;

    public AccountTriggerHandler() {
        this.newAccounts = (List<Account>) Trigger.new;
        this.oldAccounts = (List<Account>) Trigger.old;
        this.newAccountMap = (Map<Id, Account>) Trigger.newMap;
        this.oldAccountMap = (Map<Id, Account>) Trigger.oldMap;
    }

    public override void beforeInsert() {
        AccountService.setDefaultValues(newAccounts);
    }

    public override void afterUpdate() {
        AccountService.handleRatingChange(newAccountMap, oldAccountMap);
    }
}
```

### 程式碼品質最佳實務

- **使用 `isEmpty()`** - 使用內建方法檢查集合是否為空，而非大小比較。
- **使用自訂標籤** - 將使用者介面文字儲存在自訂標籤中，以實現國際化與可維護性。
- **使用常數** - 為硬程式碼值、錯誤訊息與組態值定義常數。
- **使用 `String.isBlank()` 與 `String.isNotBlank()`** - 正確檢查 null 或空字串。
- **使用 `String.valueOf()`** - 安全地將值轉換為字串以避免 null 指標例外。
- **使用安全導航運算子 `?.`** - 安全地存取屬性與方法，避免 null 指標例外。
- **使用 null 合併運算子 `??`** - 為 null 運算式提供預設值。
- **避免在迴圈中使用 `+` 進行字串串接** - 使用 `String.join()` 以獲得更好的效能。
- **使用集合方法** - 利用 `List.clone()`、`Set.addAll()`、`Map.keySet()` 簡化程式碼。
- **使用三元運算子** - 用於簡單的條件式賦值以提高可讀性。
- **使用 switch 運算式** - if-else 鏈的現代替代方案，可提高可讀性與效能。
- **使用 SObject 複製方法** - 在需要時正確複製 SObject 以避免意外的參考。

```apex
// 良好範例 - Switch 運算式 (現代 Apex)
String rating = switch on account.AnnualRevenue {
    when 0 { '冷'; }
    when 1, 2, 3 { '溫'; }
    when else { '熱'; }
};

// 良好範例 - SObjectType 上的 Switch
String objectLabel = switch on record {
    when Account a { '帳戶: ' + a.Name; }
    when Contact c { '聯絡人: ' + c.LastName; }
    when else { '未知'; }
};

// 不良範例 - if-else 鏈
String rating;
if (account.AnnualRevenue == 0) {
    rating = '冷';
} else if (account.AnnualRevenue >= 1 && account.AnnualRevenue <= 3) {
    rating = '溫';
} else {
    rating = '熱';
}

// 良好範例 - SObject 複製方法
Account original = new Account(Name = 'Acme', Industry = 'Technology');

// 淺層複製，包含 ID 與關係
Account clone1 = original.clone(true, true);

// 淺層複製，不含 ID 或關係
Account clone2 = original.clone(false, false);

// 深度複製，包含所有關係
Account clone3 = original.deepClone(true, true, true);

// 良好範例 - isEmpty() 而非大小比較
if (accountList.isEmpty()) {
    System.debug('找不到帳戶');
}

// 不良範例 - 大小比較
if (accountList.size() == 0) {
    System.debug('找不到帳戶');
}

// 良好範例 - 用於使用者介面文字的自訂標籤
final String ERROR_MESSAGE = System.Label.Account_Update_Error;
final String SUCCESS_MESSAGE = System.Label.Account_Update_Success;

// 不良範例 - 硬程式碼字串
final String ERROR_MESSAGE = '更新帳戶時發生錯誤';

// 良好範例 - 用於組態值的常數
public class AccountService {
    private static final Integer MAX_RETRY_ATTEMPTS = 3;
    private static final String DEFAULT_INDUSTRY = 'Technology';
    private static final String ERROR_PREFIX = 'AccountService 錯誤: ';

    public static void processAccounts() {
        // 使用常數
        if (retryCount > MAX_RETRY_ATTEMPTS) {
            throw new AccountServiceException(ERROR_PREFIX + '超出最大重試次數');
        }
    }
}

// 良好範例 - 用於 null 與空檢查的 isBlank()
if (String.isBlank(account.Name)) {
    account.Name = DEFAULT_NAME;
}

// 不良範例 - 多個 null 檢查
if (account.Name == null || account.Name == '') {
    account.Name = DEFAULT_NAME;
}

// 良好範例 - 用於安全轉換的 String.valueOf()
String accountId = String.valueOf(account.Id);
String revenue = String.valueOf(account.AnnualRevenue);

// 良好範例 - 安全導航運算子 (?.)
String ownerName = account?.Owner?.Name;
Integer contactCount = account?.Contacts?.size();

// 不良範例 - 巢狀 null 檢查
String ownerName;
if (account != null && account.Owner != null) {
    ownerName = account.Owner.Name;
}

// 良好範例 - null 合併運算子 (??)
String accountName = account?.Name ?? '未知帳戶';
Integer revenue = account?.AnnualRevenue ?? 0;
String industry = account?.Industry ?? DEFAULT_INDUSTRY;

// 不良範例 - 帶有 null 檢查的三元運算子
String accountName = account != null && account.Name != null ? account.Name : '未知帳戶';

// 良好範例 - 結合 ?. 與 ??
String email = contact?.Email ?? contact?.Account?.Owner?.Email ?? 'no-reply@example.com';

// 良好範例 - 迴圈中的字串串接
List<String> accountNames = new List<String>();
for (Account acc : accounts) {
    accountNames.add(acc.Name);
}
String result = String.join(accountNames, ', ');

// 不良範例 - 迴圈中的字串串接
String result = '';
for (Account acc : accounts) {
    result += acc.Name + ', '; // 效能不佳
}

// 良好範例 - 三元運算子
String status = isActive ? '啟用中' : '非啟用中';

// 良好範例 - 集合方法
List<Account> accountsCopy = accountList.clone();
Set<Id> accountIds = new Set<Id>(accountMap.keySet());
```

### 遞迴預防

- **使用靜態變數** 追蹤遞迴呼叫並防止無限迴圈。
- 實作**斷路器模式** 以在達到閾值後停止執行。
- 記錄遞迴限制與潛在風險。

```apex
// 良好範例 - 帶有靜態變數的遞迴預防
public class AccountTriggerHandler extends TriggerHandler {
    private static Boolean hasRun = false;

    public override void afterUpdate() {
        if (!hasRun) {
            hasRun = true;
            AccountService.updateRelatedContacts(Trigger.newMap.keySet());
        }
    }
}

// 良好範例 - 帶有計數器的斷路器
public class OpportunityService {
    private static Integer recursionCount = 0;
    private static final Integer MAX_RECURSION_DEPTH = 5;

    public static void processOpportunity(Id oppId) {
        recursionCount++;

        if (recursionCount > MAX_RECURSION_DEPTH) {
            System.debug(LoggingLevel.ERROR, '超出最大遞迴深度');
            return;
        }

        try {
            // 處理商機邏輯
        } finally {
            recursionCount--;
        }
    }
}
```

### 方法可見性與封裝

- 預設情況下使用 `private` - 僅公開需要公開的方法。
- 對於子類別需要存取的方法，使用 `protected`。
- 僅對於其他類別需要呼叫的 API 使用 `public`。
- 在適當情況下，使用 `final` 關鍵字防止方法覆寫。
- 如果類別不應被擴展，則將其標記為 `final`。

```apex
// 良好範例 - 適當的封裝
public class AccountService {
    // 公開 API
    public static void updateAccounts(List<Account> accounts) {
        validateAccounts(accounts);
        performUpdate(accounts);
    }

    // 私有輔助函式 - 未公開
    private static void validateAccounts(List<Account> accounts) {
        for (Account acc : accounts) {
            if (String.isBlank(acc.Name)) {
                throw new IllegalArgumentException('帳戶名稱為必填項');
            }
        }
    }

    // 私有實作 - 未公開
    private static void performUpdate(List<Account> accounts) {
        update accounts;
    }
}

// 良好範例 - 防止擴展的 Final 關鍵字
public final class UtilityHelper {
    // 無法擴展
    public static String formatCurrency(Decimal amount) {
        return '$' + amount.setScale(2);
    }
}

// 良好範例 - 防止覆寫的 Final 方法
public virtual class BaseService {
    // 可以覆寫
    public virtual void process() {
        // 實作
    }

    // 無法覆寫
    public final void validateInput() {
        // 必須不變的關鍵驗證
    }
}
```

### 設計模式

- **服務層模式**: 將業務邏輯封裝在服務類別中。
- **斷路器模式**: 在達到閾值後停止執行，以防止重複失敗。
- **選取器模式**: 為 SOQL 查詢建立專用類別。
- **網域層模式**: 為記錄特定邏輯實作網域類別。
- **觸發器處理器模式**: 使用一致的框架進行觸發器管理。
- **建造者模式**: 用於複雜物件的建構。
- **策略模式**: 根據條件實作不同的行為。

```apex
// 良好範例 - 服務層模式
public class AccountService {
    public static void updateAccountRatings(Set<Id> accountIds) {
        List<Account> accounts = AccountSelector.selectByIds(accountIds);

        for (Account acc : accounts) {
            acc.Rating = calculateRating(acc);
        }

        update accounts;
    }

    private static String calculateRating(Account acc) {
        if (acc.AnnualRevenue > 1000000) {
            return '熱';
        } else if (acc.AnnualRevenue > 500000) {
            return '溫';
        }
        return '冷';
    }
}

// 良好範例 - 斷路器模式
public class ExternalServiceCircuitBreaker {
    private static Integer failureCount = 0;
    private static final Integer FAILURE_THRESHOLD = 3;
    private static DateTime circuitOpenedTime;
    private static final Integer RETRY_TIMEOUT_MINUTES = 5;

    public static Boolean isCircuitOpen() {
        if (circuitOpenedTime != null) {
            // 檢查重試逾時是否已過
            if (DateTime.now() > circuitOpenedTime.addMinutes(RETRY_TIMEOUT_MINUTES)) {
                // 重設斷路器
                failureCount = 0;
                circuitOpenedTime = null;
                return false;
            }
            return true;
        }
        return failureCount >= FAILURE_THRESHOLD;
    }

    public static void recordFailure() {
        failureCount++;
        if (failureCount >= FAILURE_THRESHOLD) {
            circuitOpenedTime = DateTime.now();
            System.debug(LoggingLevel.ERROR, '由於失敗，斷路器已開啟');
        }
    }

    public static void recordSuccess() {
        failureCount = 0;
        circuitOpenedTime = null;
    }

    public static HttpResponse makeCallout(String endpoint) {
        if (isCircuitOpen()) {
            throw new CircuitBreakerException('斷路器已開啟。服務不可用。');
        }

        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setTimeout(TIMEOUT_MS);
            req.setHeader('Content-Type', 'application/json');

            HttpResponse res = new Http().send(req);

            if (res.getStatusCode() == 200) {
                recordSuccess();
            } else {
                recordFailure();
            }
            return res;
        } catch (Exception e) {
            recordFailure();
            throw e;
        }
    }

    public class CircuitBreakerException extends Exception {}
}

// 良好範例 - 選取器模式
public class AccountSelector {
    public static List<Account> selectByIds(Set<Id> accountIds) {
        return [
            SELECT Id, Name, AnnualRevenue, Rating
            FROM Account
            WHERE Id IN :accountIds
            WITH SECURITY_ENFORCED
        ];
    }

    public static List<Account> selectActiveAccountsWithContacts() {
        return [
            SELECT Id, Name, (SELECT Id, LastName FROM Contacts)
            FROM Account
            WHERE IsActive__c = true
            WITH SECURITY_ENFORCED
        ];
    }
}
```

### 組態管理

#### 自訂中繼資料類型與自訂設定

- **推薦自訂中繼資料類型 (CMT)** 用於可部署的組態資料。
- 使用 **自訂設定** 用於因環境而異的使用者特定或組織特定資料。
- CMT 可打包、可部署，並可用於驗證規則與公式。
- 自訂設定支援階層 (組織、設定檔、使用者)，但不可部署。

```apex
// 良好範例 - 使用自訂中繼資料類型
List<API_Configuration__mdt> configs = [
    SELECT Endpoint__c, Timeout__c, Max_Retries__c
    FROM API_Configuration__mdt
    WHERE DeveloperName = 'Production_API'
    LIMIT 1
];

if (!configs.isEmpty()) {
    String endpoint = configs[0].Endpoint__c;
    Integer timeout = Integer.valueOf(configs[0].Timeout__c);
}

// 良好範例 - 使用自訂設定 (使用者特定)
User_Preferences__c prefs = User_Preferences__c.getInstance(UserInfo.getUserId());
Boolean darkMode = prefs.Dark_Mode_Enabled__c;

// 良好範例 - 使用自訂設定 (組織層級)
Org_Settings__c orgSettings = Org_Settings__c.getOrgDefaults();
Integer maxRecords = Integer.valueOf(orgSettings.Max_Records_Per_Query__c);
```

#### 命名認證與 HTTP 呼叫

- **始終使用命名認證** 進行外部 API 端點與驗證。
- 避免在程式碼中硬程式碼 URL、權杖或認證。
- 使用 `callout:NamedCredential` 語法進行安全、可部署的整合。
- **始終檢查 HTTP 狀態碼** 並優雅地處理錯誤。
- 設定適當的逾時以防止長時間執行的呼叫。
- 對於可佇列與批次處理類別，使用 `Database.AllowsCallouts` 介面。

```apex
// 良好範例 - 使用命名認證
public class ExternalAPIService {
    private static final String NAMED_CREDENTIAL = 'callout:External_API';
    private static final Integer TIMEOUT_MS = 120000; // 120 秒

    public static Map<String, Object> getExternalData(String recordId) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(NAMED_CREDENTIAL + '/api/records/' + recordId);
        req.setMethod('GET');
        req.setTimeout(TIMEOUT_MS);
        req.setHeader('Content-Type', 'application/json');

        try {
            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            } else if (res.getStatusCode() == 404) {
                throw new NotFoundException('找不到記錄: ' + recordId);
            } else if (res.getStatusCode() >= 500) {
                throw new ServiceUnavailableException('外部服務錯誤: ' + res.getStatus());
            } else {
                throw new CalloutException('意外的回應: ' + res.getStatusCode());
            }
        } catch (System.CalloutException e) {
            System.debug(LoggingLevel.ERROR, '呼叫失敗: ' + e.getMessage());
            throw new ExternalAPIException('無法檢索資料', e);
        }
    }

    public class ExternalAPIException extends Exception {}
    public class NotFoundException extends Exception {}
    public class ServiceUnavailableException extends Exception {}
}

// 良好範例 - 帶有 JSON 主體的 POST 請求
public static String createExternalRecord(Map<String, Object> data) {
    HttpRequest req = new HttpRequest();
    req.setEndpoint(NAMED_CREDENTIAL + '/api/records');
    req.setMethod('POST');
    req.setTimeout(TIMEOUT_MS);
    req.setHeader('Content-Type', 'application/json');
    req.setBody(JSON.serialize(data));

    HttpResponse res = new Http().send(req);

    if (res.getStatusCode() == 201) {
        Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        return (String) result.get('id');
    } else {
        throw new CalloutException('無法建立記錄: ' + res.getStatus());
    }
}
```

### 常見註解

- `@AuraEnabled` - 將方法公開給 Lightning Web 元件與 Aura 元件。
- `@AuraEnabled(cacheable=true)` - 為唯讀方法啟用用戶端快取。
- `@InvocableMethod` - 使方法可從流程與程序產生器呼叫。
- `@InvocableVariable` - 定義可呼叫方法的輸入/輸出參數。
- `@TestVisible` - 僅將私有成員公開給測試類別。
- `@SuppressWarnings('PMD.RuleName')` - 抑制特定的 PMD 警告。
- `@RemoteAction` - 將方法公開給 Visualforce JavaScript 遠端呼叫 (舊版)。
- `@Future` - 非同步執行方法。
- `@Future(callout=true)` - 允許在未來方法中進行 HTTP 呼叫。

```apex
// 良好範例 - 用於 LWC 的 AuraEnabled
public with sharing class AccountController {
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [SELECT Id, Name FROM Account WITH SECURITY_ENFORCED LIMIT 10];
    }

    @AuraEnabled
    public static void updateAccount(Id accountId, String newName) {
        Account acc = new Account(Id = accountId, Name = newName);
        update acc;
    }
}

// 良好範例 - 用於流程的 InvocableMethod
public class FlowActions {
    @InvocableMethod(label='傳送電子郵件通知' description='傳送電子郵件給帳戶擁有人')
    public static List<Result> sendNotification(List<Request> requests) {
        List<Result> results = new List<Result>();

        for (Request req : requests) {
            Result result = new Result();
            try {
                // 傳送電子郵件邏輯
                result.success = true;
                result.message = '電子郵件傳送成功';
            } catch (Exception e) {
                result.success = false;
                result.message = e.getMessage();
            }
            results.add(result);
        }
        return results;
    }

    public class Request {
        @InvocableVariable(required=true label='帳戶 ID')
        public Id accountId;

        @InvocableVariable(label='電子郵件範本')
        public String templateName;
    }

    public class Result {
        @InvocableVariable
        public Boolean success;

        @InvocableVariable
        public String message;
    }
}

// 良好範例 - 用於測試私有方法的 TestVisible
public class AccountService {
    @TestVisible
    private static Boolean validateAccountName(String name) {
        return String.isNotBlank(name) && name.length() > 3;
    }
}
```

### 非同步 Apex

- 對於簡單的非同步呼叫與呼叫，使用 **@future** 方法。
- 對於需要鏈結的複雜非同步呼叫，使用 **可佇列 Apex**。
- 對於處理大量資料 (>50,000 筆記錄)，使用 **批次 Apex**。
  - 使用 `Database.Stateful` 在批次執行中維護狀態 (例如，計數器、彙總)。
  - 若沒有 `Database.Stateful`，批次類別是無狀態的，且實例變數會在批次之間重設。
  - 使用有狀態批次時，請留意管理員限制。
- 對於定期呼叫，使用 **排程 Apex**。
  - 建立單獨的 **可排程類別** 以排程批次作業。
  - 切勿在同一個類別中同時實作 `Database.Batchable` 與 `Schedulable`。
- 對於事件驅動架構與解耦整合，使用 **平台事件**。
  - 使用 `EventBus.publish()` 發佈事件，進行非同步、發送即忘的通訊。
  - 使用平台事件物件上的觸發器訂閱事件。
  - 適用於整合、微服務與跨組織通訊。
- 根據處理複雜性與管理員限制**優化批次大小**。
  - 預設批次大小為 200，但可從 1 調整到 2000。
  - 對於複雜處理或呼叫，使用較小的批次 (50-100)。
  - 對於簡單的 DML 呼叫，使用較大的批次 (200)。
  - 使用實際資料量進行測試以找到最佳大小。

```apex
// 良好範例 - 用於解耦通訊的平台事件
public class OrderEventPublisher {
    public static void publishOrderCreated(List<Order> orders) {
        List<Order_Created__e> events = new List<Order_Created__e>();

        for (Order ord : orders) {
            Order_Created__e event = new Order_Created__e(
                Order_Id__c = ord.Id,
                Order_Amount__c = ord.TotalAmount,
                Customer_Id__c = ord.AccountId
            );
            events.add(event);
        }

        // 發佈事件
        List<Database.SaveResult> results = EventBus.publish(events);

        // 檢查錯誤
        for (Database.SaveResult result : results) {
            if (!result.isSuccess()) {
                for (Database.Error error : result.getErrors()) {
                    System.debug('發佈事件時發生錯誤: ' + error.getMessage());
                }
            }
        }
    }
}

// 良好範例 - 平台事件觸發器 (訂閱者)
trigger OrderCreatedTrigger on Order_Created__e (after insert) {
    List<Task> tasksToCreate = new List<Task>();

    for (Order_Created__e event : Trigger.new) {
        Task t = new Task(
            Subject = '追蹤訂單',
            WhatId = event.Order_Id__c,
            Priority = '高'
        );
        tasksToCreate.add(t);
    }

    if (!tasksToCreate.isEmpty()) {
        insert tasksToCreate;
    }
}

// 良好範例 - 根據複雜性優化批次大小
public class ComplexProcessingBatch implements Database.Batchable<SObject>, Database.AllowsCallouts {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([ 
            SELECT Id, Name FROM Account WHERE IsActive__c = true
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Account> scope) {
        // 帶有呼叫的複雜處理 - 使用較小的批次大小
        for (Account acc : scope) {
            // 進行 HTTP 呼叫
            HttpResponse res = ExternalAPIService.getAccountData(acc.Id);
            // 處理回應
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('批次已完成');
    }
}

// 對於呼叫密集型處理，以較小的批次大小執行
Database.executeBatch(new ComplexProcessingBatch(), 50);

// 良好範例 - 簡單 DML 批次
public class SimpleDMLBatch implements Database.Batchable<SObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([ 
            SELECT Id, Status__c FROM Order WHERE Status__c = 'Draft'
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Order> scope) {
        for (Order ord : scope) {
            ord.Status__c = '待處理';
        }
        update scope;
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('批次已完成');
    }
}

// 對於簡單的 DML，以較大的批次大小執行
Database.executeBatch(new SimpleDMLBatch(), 200);

// 良好範例 - 可佇列 Apex
public class EmailNotificationQueueable implements Queueable, Database.AllowsCallouts {
    private List<Id> accountIds;

    public EmailNotificationQueueable(List<Id> accountIds) {
        this.accountIds = accountIds;
    }

    public void execute(QueueableContext context) {
        List<Account> accounts = [SELECT Id, Name, Email__c FROM Account WHERE Id IN :accountIds];

        for (Account acc : accounts) {
            sendEmail(acc);
        }

        // 如果需要，鏈結另一個作業
        if (hasMoreWork()) {
            System.enqueueJob(new AnotherQueueable());
        }
    }

    private void sendEmail(Account acc) {
        // 電子郵件傳送邏輯
    }

    private Boolean hasMoreWork() {
        return false;
    }
}

// 良好範例 - 無狀態批次 Apex (預設)
public class AccountCleanupBatch implements Database.Batchable<SObject> {
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name FROM Account WHERE LastActivityDate < LAST_N_DAYS:365
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Account> scope) {
        delete scope;
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('批次已完成');
    }
}

// 良好範例 - 有狀態批次 Apex (在批次之間維護狀態)
public class AccountStatsBatch implements Database.Batchable<SObject>, Database.Stateful {
    private Integer recordsProcessed = 0;
    private Integer totalRevenue = 0;

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, AnnualRevenue FROM Account WHERE IsActive__c = true
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Account> scope) {
        for (Account acc : scope) {
            recordsProcessed++;
            totalRevenue += (Integer) acc.AnnualRevenue;
        }
    }

    public void finish(Database.BatchableContext bc) {
        // 狀態已維護: recordsProcessed 與 totalRevenue 保留其值
        System.debug('處理的總記錄數: ' + recordsProcessed);
        System.debug('總收入: ' + totalRevenue);

        // 傳送摘要電子郵件或建立摘要記錄
    }
}

// 良好範例 - 排程批次的排程類別
public class AccountCleanupScheduler implements Schedulable {
    public void execute(SchedulableContext sc) {
        // 以 200 的批次大小執行批次
        Database.executeBatch(new AccountCleanupBatch(), 200);
    }
}

// 排程批次每天凌晨 2 點執行
// 在匿名 Apex 或設定程式碼中執行此呼叫:
// String cronExp = '0 0 2 * * ?';
// System.schedule('每日帳戶清理', cronExp, new AccountCleanupScheduler());
```

## 測試

- 生產程式碼**始終實現 100% 程式碼覆蓋率** (最低要求 75%)。
- 編寫**有意義的測試**，驗證業務邏輯，而不僅僅是程式碼覆蓋率。
- 使用 `@TestSetup` 方法建立跨測試方法共享的測試資料。
- 使用 `Test.startTest()` 和 `Test.stopTest()` 重設管理員限制。
- 測試**正面情境**、**負面情境**與**批量情境** (200+ 筆記錄)。
- 使用 `System.runAs()` 測試不同的使用者內容與權限。
- 使用 `Test.setMock()` 模擬外部呼叫。
- 切勿使用 `@SeeAllData=true` - 始終在測試中建立測試資料。
- **使用 `Assert` 類別方法** 進行斷言，而非已棄用的 `System.assert*()` 方法。
- 始終為斷言添加描述性失敗訊息以提高清晰度。

```apex
// 良好範例 - 綜合測試類別
@IsTest
private class AccountServiceTest {
    @TestSetup
    static void setupTestData() {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(
                Name = '測試帳戶 ' + i,
                AnnualRevenue = i * 10000
            ));
        }
        insert accounts;
    }

    @IsTest
    static void testUpdateAccountRatings_Positive() {
        // 安排
        List<Account> accounts = [SELECT Id FROM Account];
        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

        // 執行
        Test.startTest();
        AccountService.updateAccountRatings(accountIds);
        Test.stopTest();

        // 斷言
        List<Account> updatedAccounts = [
            SELECT Id, Rating FROM Account WHERE AnnualRevenue > 1000000
        ];
        for (Account acc : updatedAccounts) {
            Assert.areEqual('熱', acc.Rating, '高收入帳戶的評級應為熱');
        }
    }

    @IsTest
    static void testUpdateAccountRatings_NoAccess() {
        // 建立存取受限的使用者
        User testUser = createTestUser();

        List<Account> accounts = [SELECT Id FROM Account LIMIT 1];
        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

        Test.startTest();
        System.runAs(testUser) {
            try {
                AccountService.updateAccountRatings(accountIds);
                Assert.fail('預期發生 SecurityException');
            } catch (SecurityException e) {
                Assert.isTrue(true, '如預期般拋出 SecurityException');
            }
        }
        Test.stopTest();
    }

    @IsTest
    static void testBulkOperation() {
        List<Account> accounts = [SELECT Id FROM Account];
        Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

        Test.startTest();
        AccountService.updateAccountRatings(accountIds);
        Test.stopTest();

        List<Account> updatedAccounts = [SELECT Id, Rating FROM Account];
        Assert.areEqual(200, updatedAccounts.size(), '所有帳戶都應已處理');
    }

    private static User createTestUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = '標準使用者' LIMIT 1];
        return new User(
            Alias = 'testuser',
            Email = 'testuser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = '測試',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'testuser' + DateTime.now().getTime() + '@test.com'
        );
    }
}
```

## 常見程式碼異味與反模式

- **迴圈中的 DML/SOQL** - 始終批量化程式碼以避免管理員限制例外。
- **硬程式碼 ID** - 改用自訂設定、自訂中繼資料或動態查詢。
- **深層巢狀條件** - 將邏輯提取到單獨的方法中以提高清晰度。
- **大型方法** - 讓方法專注於單一職責 (最多 30-50 行)。
- **魔術數字** - 使用命名常數以提高清晰度與可維護性。
- **重複程式碼** - 將通用邏輯提取到可重複使用的函式或類別中。
- **遺漏 null 檢查** - 始終驗證輸入參數與查詢結果。

```apex
// 不良範例 - 迴圈中的 DML
for (Account acc : accounts) {
    acc.Rating = '熱';
    update acc; // 避免: 迴圈中的 DML
}

// 良好範例 - 批量化 DML
for (Account acc : accounts) {
    acc.Rating = '熱';
}
update accounts;

// 不良範例 - 硬程式碼 ID
Account acc = [SELECT Id FROM Account WHERE Id = '001000000000001'];

// 良好範例 - 動態查詢
Account acc = [SELECT Id FROM Account WHERE Name = :accountName LIMIT 1];

// 不良範例 - 魔術數字
if (accounts.size() > 200) {
    // 處理
}

// 良好範例 - 命名常數
private static final Integer MAX_BATCH_SIZE = 200;
if (accounts.size() > MAX_BATCH_SIZE) {
    // 處理
}
```

## 文件與註解

- 類別與方法使用 JavaDoc 樣式註解。
- 包含 `@author` 與 `@date` 標籤以進行追蹤。
- 包含 `@description`、`@param`、`@return` 與 `@throws` 標籤。
- 僅在適用時才包含 `@param`、`@return` 與 `@throws` 標籤。
- 對於沒有傳回值的方法，請勿使用 `@return void`。
- 記錄複雜的業務邏輯與設計決策。
- 保持註解與程式碼變更同步更新。

```apex
/**
 * @author 你的姓名
 * @date 2025-01-01
 * @description 用於管理帳戶記錄的服務類別
 */
public with sharing class AccountService {

    /**
     * @author 你的姓名
     * @date 2025-01-01
     * @description 根據年收入更新帳戶的評級
     * @param accountIds 要更新的帳戶 ID 集合
     * @throws AccountServiceException 如果使用者缺乏更新權限
     */
    public static void updateAccountRatings(Set<Id> accountIds) {
        // 實作
    }
}
```

## 部署與 DevOps

- 使用 **Salesforce CLI** 進行來源驅動的開發。
- 利用 **暫存組織 (scratch orgs)** 進行開發與測試。
- 使用 Salesforce CLI、GitHub Actions 或 Jenkins 等工具實作 **CI/CD 管道**。
- 使用 **解鎖套件 (unlocked packages)** 進行模組化部署。
- 作為部署驗證的一部分執行 **Apex 測試**。
- 使用 **Salesforce 程式碼分析器** 掃描程式碼以檢查品質與安全問題。

```bash
# Salesforce CLI 命令 (sf)
sf project deploy start                    # 將來源部署到組織
sf project deploy start --dry-run          # 驗證部署而不實際部署
sf apex run test --test-level RunLocalTests # 執行本機 Apex 測試
sf apex get test --test-run-id <id>        # 取得測試結果
sf project retrieve start                  # 從組織檢索來源

# Salesforce 程式碼分析器命令
sf code-analyzer rules                     # 列出所有可用的規則
sf code-analyzer rules --rule-selector eslint:Recommended  # 列出建議的 ESLint 規則
sf code-analyzer rules --workspace ./force-app             # 列出特定工作空間的規則
sf code-analyzer run                       # 使用建議規則執行分析
sf code-analyzer run --rule-selector pmd:Recommended       # 執行 PMD 建議規則
sf code-analyzer run --rule-selector "Security"           # 執行帶有安全標籤的規則
sf code-analyzer run --workspace ./force-app --target "**/*.cls"  # 分析 Apex 類別
sf code-analyzer run --severity-threshold 3               # 以嚴重性閾值執行分析
sf code-analyzer run --output-file results.html           # 將結果輸出到 HTML 檔案
sf code-analyzer run --output-file results.csv            # 將結果輸出到 CSV 檔案
sf code-analyzer run --view detail                        # 顯示詳細的違規資訊
```

## 效能優化

- 使用帶有索引欄位的**選擇性 SOQL 查詢**。
- 針對昂貴的呼叫實作**延遲載入**。
- 針對長時間執行的呼叫使用**非同步處理**。
- 使用 **偵錯記錄** 與 **事件監控** 進行監控。
- 使用 **ApexGuru** 與 **Scale Center** 獲取效能洞察。

### 平台快取

- 使用 **平台快取** 儲存常用資料並減少 SOQL 查詢。
- `Cache.OrgPartition` - 在組織中的所有使用者與會話之間共享。
- `Cache.SessionPartition` - 僅限於使用者會話。
- 實作適當的快取失效策略。
- 優雅地處理快取遺失，並回退到資料庫查詢。

```apex
// 良好範例 - 使用組織快取
public class AccountCacheService {
    private static final String CACHE_PARTITION = 'local.AccountCache';
    private static final Integer TTL_SECONDS = 3600; // 1 小時

    public static Account getAccount(Id accountId) {
        Cache.OrgPartition orgPart = Cache.Org.getPartition(CACHE_PARTITION);
        String cacheKey = 'Account_' + accountId;

        // 嘗試從快取中取得
        Account acc = (Account) orgPart.get(cacheKey);

        if (acc == null) {
            // 快取遺失 - 查詢資料庫
            acc = [
                SELECT Id, Name, Industry, AnnualRevenue
                FROM Account
                WHERE Id = :accountId
                LIMIT 1
            ];

            // 將其儲存在帶有 TTL 的快取中
            orgPart.put(cacheKey, acc, TTL_SECONDS);
        }

        return acc;
    }

    public static void invalidateCache(Id accountId) {
        Cache.OrgPartition orgPart = Cache.Org.getPartition(CACHE_PARTITION);
        String cacheKey = 'Account_' + accountId;
        orgPart.remove(cacheKey);
    }
}

// 良好範例 - 使用會話快取
public class UserPreferenceCache {
    private static final String CACHE_PARTITION = 'local.UserPrefs';

    public static Map<String, Object> getUserPreferences() {
        Cache.SessionPartition sessionPart = Cache.Session.getPartition(CACHE_PARTITION);
        String cacheKey = 'UserPrefs_' + UserInfo.getUserId();

        Map<String, Object> prefs = (Map<String, Object>) sessionPart.get(cacheKey);

        if (prefs == null) {
            // 從資料庫或自訂設定載入偏好設定
            prefs = new Map<String, Object>{ 
                'theme' => 'dark',
                'language' => 'zh_TW'
            };
            sessionPart.put(cacheKey, prefs);
        }

        return prefs;
    }
}
```

## 建構與驗證

- 在新增或修改程式碼後，驗證專案是否繼續成功建構。
- 執行所有相關的 Apex 測試類別以確保沒有迴歸。
- 使用 Salesforce CLI: `sf apex run test --test-level RunLocalTests`
- 確保程式碼覆蓋率達到最低 75% 的要求 (目標 100%)。
- 使用 Salesforce 程式碼分析器檢查程式碼品質問題: `sf code-analyzer run --severity-threshold 2`
- 在部署前檢閱違規並解決它們。
