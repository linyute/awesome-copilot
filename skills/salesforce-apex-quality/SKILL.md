---
name: salesforce-apex-quality
description: 'Salesforce 開發的 Apex 程式碼品質護欄。強制執行批次安全規則（迴圈中不得有 SOQL/DML）、共用模式要求、CRUD/FLS 安全性、防止 SOQL 插入、PNB 測試涵蓋範圍（Positive / Negative / Bulk）以及現代 Apex 慣用語。在審閱或產生 Apex 類別、觸發程式處理常式、批次工作或測試類別時使用此技能，以便在部署前發現監管限制風險、安全性漏洞和品質問題。'
---

# Salesforce Apex 品質護欄

將這些檢查套用於你撰寫或審閱的每個 Apex 類別、觸發程式和測試檔案。

## 第 1 步 — 監管限制（Governor Limit）安全性檢查

在宣告任何 Apex 檔案可接受之前，請掃描這些模式：

### 迴圈中的 SOQL 和 DML — 自動失敗

```apex
// ❌ 絕對不要 — 會導致規模化時發生 LimitException
for (Account a : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :a.Id]; // 迴圈中的 SOQL
    update a; // 迴圈中的 DML
}

// ✅ 務必這樣做 — 先收集，然後只進行一次查詢/更新
Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();
for (Contact c : [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds]) {
    if (!contactsByAccount.containsKey(c.AccountId)) {
        contactsByAccount.put(c.AccountId, new List<Contact>());
    }
    contactsByAccount.get(c.AccountId).add(c);
}
update accounts; // 在迴圈外部執行一次 DML
```

規則：如果你在 `for` 迴圈主體內看到 `[SELECT` 或 `Database.query`、`insert`、`update`、`delete`、`upsert`、`merge` — 請在繼續之前停止並重構。

## 第 2 步 — 共用模式驗證

每個類別都必須明確宣告其共用意圖。未宣告的共用會繼承自呼叫端 — 行為不可預測。

| 宣告 | 何時使用 |
|---|---|
| `public with sharing class Foo` | 所有服務、處理常式、選取器和控制器類別的預設值 |
| `public without sharing class Foo` | 僅當類別必須以提升權限執行時（例如系統級記錄、觸發程式略過）。需要說明原因的程式碼註解。 |
| `public inherited sharing class Foo` | 應尊重呼叫端共用上下文的框架進入點 |

如果類別沒有這三種宣告之一，**在撰寫任何其他內容之前先加上去**。

## 第 3 步 — CRUD / FLS 強制執行

代表使用者讀取或寫入記錄的 Apex 程式碼必須驗證物件和欄位存取。平台**不會**在 Apex 中自動強制執行 FLS 或 CRUD。

```apex
// 查詢欄位前檢查
if (!Schema.sObjectType.Contact.fields.Email.isAccessible()) {
    throw new System.NoAccessException();
}

// 或在 SOQL 中使用 WITH USER_MODE (API 56.0+)
List<Contact> contacts = [SELECT Id, Email FROM Contact WHERE AccountId = :accId WITH USER_MODE];

// 或使用 Database.query 與 AccessLevel
List<Contact> contacts = Database.query('SELECT Id, Email FROM Contact', AccessLevel.USER_MODE);
```

規則：任何可從 UI 元件、REST 端點或 `@InvocableMethod` 呼叫的 Apex 方法**必須**強制執行 CRUD/FLS。僅從受信任內容呼叫的內部服務方法可以改用 `with sharing`。

## 第 4 步 — 防止 SOQL 插入

```apex
// ❌ 絕對不要 — 將使用者輸入串接到 SOQL 字串中
String soql = 'SELECT Id FROM Account WHERE Name = \'' + userInput + '\'';

// ✅ 務必這樣做 — 繫結變數
String soql = [SELECT Id FROM Account WHERE Name = :userInput];

// ✅ 對於具有使用者控制欄位名稱的動態 SOQL — 根據白名單進行驗證
Set<String> allowedFields = new Set<String>{'Name', 'Industry', 'AnnualRevenue'};
if (!allowedFields.contains(userInput)) {
    throw new IllegalArgumentException('不允許的欄位：' + userInput);
}
```

## 第 5 步 — 現代 Apex 慣用語

偏好目前的語言功能 (API 62.0 / Winter '25+):

| 舊模式 | 現代替代方案 |
|---|---|
| `if (obj != null) { x = obj.Field__c; }` | `x = obj?.Field__c;` |
| `x = (y != null) ? y : defaultVal;` | `x = y ?? defaultVal;` |
| `System.assertEquals(expected, actual)` | `Assert.areEqual(expected, actual)` |
| `System.assert(condition)` | `Assert.isTrue(condition)` |
| `[SELECT ... WHERE ...]` 沒有共用上下文 | `[SELECT ... WHERE ... WITH USER_MODE]` |

## 第 6 步 — PNB 測試涵蓋範圍檢查表

每個功能都必須在所有三條路徑上進行測試。缺少任何一個都是品質失敗：

### 正向路徑 (Positive Path)
- 預期輸入 → 預期輸出。
- 判斷正確的欄位值、記錄計數或傳回值 — 不僅僅是沒有擲回例外狀況。

### 負向路徑 (Negative Path)
- 無效輸入、null 值、空集合和錯誤條件。
- 判斷是否擲回具有正確類型和訊息的例外狀況。
- 判斷當作業應該乾淨地失敗時，沒有任何記錄發生變動。

### 批次路徑 (Bulk Path)
- 在單個測試交易中插入/更新/刪除 **200–251 筆記錄**。
- 判斷所有記錄均已正確處理 — 沒有因監管限制而導致的部分失敗。
- 使用 `Test.startTest()` / `Test.stopTest()` 來隔離非同步工作的監管限制計數器。

### 測試類別規則
```apex
@isTest(SeeAllData=false)   // 強制要求 — 若無記錄在案的原因，不得有例外
private class AccountServiceTest {

    @TestSetup
    static void makeData() {
        // 在此建立所有測試資料 — 如果專案中存在處理站，請使用它
    }

    @isTest
    static void givenValidInput_whenProcessAccounts_thenFieldsUpdated() {
        // 正向路徑
        List<Account> accounts = [SELECT Id FROM Account LIMIT 10];
        Test.startTest();
        AccountService.processAccounts(accounts);
        Test.stopTest();
        // 判斷有意義的結果 — 不僅僅是沒有例外狀況
        List<Account> updated = [SELECT Status__c FROM Account WHERE Id IN :accounts];
        Assert.areEqual('Processed', updated[0].Status__c, '狀態應為 Processed');
    }
}
```

## 第 7 步 — 觸發程式架構檢查表

- [ ] 每個物件一個觸發程式。如果存在第二個觸發程式，請合併到處理常式中。
- [ ] 觸發程式主體僅包含：上下文檢查、處理常式呼叫和路由邏輯。
- [ ] 觸發程式主體中沒有商務邏輯、SOQL 或 DML。
- [ ] 如果已在使用觸發程式框架（Trigger Actions Framework、ff-apex-common、自訂基底類別）— 請擴充它。不要建立平行模式。
- [ ] 除非觸發程式需要提升的存取權限，否則處理常式類別應為 `with sharing`。

## 快速參考 — 硬式編碼反模式摘要

| 模式 | 動作 |
|---|---|
| `for` 迴圈內的 SOQL | 重構：在迴圈前查詢，操作集合 |
| `for` 迴圈內的 DML | 重構：收集變動，在迴圈後執行一次 DML |
| 類別缺少共用宣告 | 新增 `with sharing`（或記錄為何使用 `without sharing`） |
| 使用者資料上的 `escape="false"` (VF) | 移除 — 自動逸出強制執行 XSS 預防 |
| 空的 `catch` 區塊 | 新增記錄以及適當的重新擲回或錯誤處理 |
| 使用使用者輸入串接字串的 SOQL | 替換為繫結變數或白名單驗證 |
| 測試沒有 Assert | 新增有意義的 `Assert.*` 呼叫 |
| `System.assert` / `System.assertEquals` 樣式 | 升級為 `Assert.isTrue` / `Assert.areEqual` |
| 硬式編碼記錄識別碼 (`'001...'`) | 替換為查詢或插入的測試記錄識別碼 |
