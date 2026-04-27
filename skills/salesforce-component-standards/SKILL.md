---
name: salesforce-component-standards
description: 'Salesforce Lightning Web Components (LWC)、Aura 元件和 Visualforce 頁面的品質標準。涵蓋 SLDS 2 合規性、協助工具 (WCAG 2.1 AA)、資料存取模式選擇、元件通訊規則、XSS 防範、CSRF 強制執行、AuraEnabled 函式中的 FLS/CRUD、檢視狀態管理以及 Jest 測試要求。在建構或審查任何 Salesforce UI 元件時，請使用此技能來強制執行平台特定的安全性與品質標準。'
---

# Salesforce 元件品質標準

將這些檢查套用至您編寫或審查的每個 LWC、Aura 元件和 Visualforce 頁面。

## 第 1 節 — LWC 品質標準

### 1.1 資料存取模式選擇

在編寫 JavaScript 控制器程式碼之前，請選擇正確的資料存取模式：

| 使用案例 | 模式 | 原因 |
|---|---|---|
| 以回應方式讀取單一紀錄 (跟隨導覽) | `@wire(getRecord, { recordId, fields })` | Lightning 資料服務 — 已快取、具回應性 |
| 單一物件的標準 CRUD 表單 | `<lightning-record-form>` 或 `<lightning-record-edit-form>` | 內建 FLS、CRUD 和協助工具 |
| 複雜的伺服器搜尋或篩選清單 | 在 `cacheable=true` 的函式上使用 `@wire(apexMethodName, { param })` | 允許快取；wire 在參數變更時重新觸發 |
| 使用者觸發的動作、DML 或不可快取的伺服器呼叫 | 強制性 `apexMethodName(params).then(...).catch(...)` | DML 所需 — 若無 `cacheable=true`，則 wired 函式不可為 `@AuraEnabled` |
| 跨元件通訊 (無共享父代) | Lightning 訊息服務 (LMS) | 解耦，可跨 DOM 邊界工作 |
| 多物件圖形關聯 | GraphQL `@wire(gql, { query, variables })` | 針對複雜的相關資料進行單次來回通訊 |

### 1.2 安全性規則

| 規則 | 強制執行 |
|---|---|
| `innerHTML` 中不可有原始使用者資料 | 在範本中使用 `{expression}` 繫結 — 框架會自動逸出。切勿使用 `this.template.querySelector('.el').innerHTML = userValue` |
| Apex `@AuraEnabled` 函式強制執行 CRUD/FLS | 在 SOQL 中使用 `WITH USER_MODE` 或明確的 `Schema.sObjectType` 檢查 |
| 元件 JavaScript 中不可有寫死的組織特定 ID | 透過搜尋取得或作為 prop 傳遞 — 切勿在原始程式碼中嵌入紀錄 ID |
| 來自父代的 `@api` 屬性：使用前先驗證 | 父代可以傳遞任何內容 — 在用作搜尋參數之前驗證類型與範圍 |

### 1.3 SLDS 2 與樣式標準

- **切勿**寫死顏色：`color: #FF3366` → 使用 `color: var(--slds-c-button-brand-color-background)` 或語義化 SLDS 權杖。
- **切勿**使用 `!important` 覆寫 SLDS 類別 — 請搭配自訂 CSS 屬性使用。
- 只要有 `<lightning-*>` 基礎元件，就請使用它們：`lightning-button`、`lightning-input`、`lightning-datatable`、`lightning-card` 等。
- 基礎元件包含內建的 SLDS 2、深色模式和協助工具 — 避免重新實作它們的行為。
- 如果使用自訂 CSS，請在宣告完成前同時測試**淺色模式**與**深色模式**。

### 1.4 協助工具要求 (WCAG 2.1 AA)

每個 LWC 元件在視為完成之前，必須通過以下所有檢查：

- [ ] 所有表單輸入都有 `<label>` 或 `aria-label` — 切勿僅將預留位置用作標籤
- [ ] 所有僅有圖示的按鈕都有描述動作的 `alternative-text` 或 `aria-label`
- [ ] 所有互動式元素均可透過鍵盤 (Tab, Enter, Space, Escape) 觸及且可操作
- [ ] 顏色不是傳達狀態的唯一手段 — 請搭配文字、圖示或 `aria-*` 屬性使用
- [ ] 錯誤訊息透過 `aria-describedby` 與其輸入相關聯
- [ ] 強制回應視窗中的焦點管理正確 — 開啟時焦點移入視窗，關閉時移回

### 1.5 元件通訊規則

| 方向 | 機制 |
|---|---|
| 父代 → 子代 | `@api` 屬性或呼叫 `@api` 函式 |
| 子代 → 父代 | `CustomEvent` — `this.dispatchEvent(new CustomEvent('eventname', { detail: data }))` |
| 同級 / 不相關元件 | Lightning 訊息服務 (LMS) |
| 切勿使用 | `document.querySelector`、`window.*` 或發佈/訂閱 (Pub/Sub) 函式庫 |

針對 Flow 畫面元件：
- 需要到達 Flow 執行階段的事件必須設定 `bubbles: true` 且 `composed: true`。
- 公開 `@api value` 以與 Flow 變數進行雙向繫結。

### 1.6 JavaScript 效能規則

- **在 `connectedCallback` 中不可有副作用**：它在每次 DOM 附加時執行 — 避免在此處進行 DML、繁重運算或轉譯狀態變更。
- **保護 `renderedCallback`**：務必使用布林保護程式 (boolean guard) 以防止無限轉譯迴圈。
- **避免回應式屬性陷阱**：在 `renderedCallback` 內部設定回應式屬性會導致重新轉譯 — 僅在必要且有保護的情況下使用。
- **不要在元件狀態中儲存大型資料集** — 改為分頁或串流傳輸大型結果。

### 1.7 Jest 測試要求

每個處理使用者互動或擷取 Apex 資料的元件必須具備 Jest 測試：

```javascript
// 最低測試涵蓋範圍預期
it('renders the component with correct title', async () => { ... });
it('calls apex method and displays results', async () => { ... });  // Wire 模擬
it('dispatches event when button is clicked', async () => { ... });
it('shows error state when apex call fails', async () => { ... }); // 錯誤路徑
```

使用 `@salesforce/sfdx-lwc-jest` 模擬公用程式：
- `wire` 轉接器模擬：`setImmediate` + `emit({ data, error })`
- Apex 函式模擬：`jest.mock('@salesforce/apex/MyClass.myMethod', ...)`

---

## 第 2 節 — Aura 元件標準

### 2.1 何時使用 Aura vs LWC

- **新元件：一律使用 LWC**，除非目標內容僅限 Aura (例如擴充 `force:appPage`、在舊版受管理套件中使用 Aura 特定事件)。
- **將 Aura 遷移至 LWC**：優先選擇 LWC，逐一元件遷移；LWC 可以嵌入 Aura 元件內部。

### 2.2 Aura 安全性規則

- `@AuraEnabled` 控制器函式必須宣告 `with sharing` 並強制執行 CRUD/FLS — Aura **不會**自動強制執行它們。
- 切勿在 `<div>` 未繫結協助程式中將 `{!v.something}` 與未逸出的使用者資料搭配使用 — 請使用 `<ui:outputText value="{!v.text}" />` 或 `<c:something>` 來進行逸出。
- 在 SOQL / Apex 邏輯中使用來自元件屬性的所有輸入之前，請先驗證它們。

### 2.3 Aura 事件設計

- **元件事件**用於父子通訊 — 最低範圍。
- **應用程式事件**僅在元件事件無法到達目標時使用 — 它們會廣播到整個應用程式，並可能造成效能與維護問題。
- 針對混合式 LWC + Aura 堆疊：使用 Lightning 訊息服務來解耦通訊 — 不要依賴到達 LWC 元件的 Aura 應用程式事件。

---

## 第 3 節 — Visualforce 安全性標準

### 3.1 XSS 防範

```xml
<!-- ❌ 切勿 — 將原始使用者輸入轉譯為 HTML -->
<apex:outputText value="{!userInput}" escape="false" />

<!-- ✅ 務必 — 開啟自動逸出 -->
<apex:outputText value="{!userInput}" />
<!-- 預設 escape="true" — 平台會對輸出進行 HTML 編碼 -->
```

規則：對於使用者控制的資料，`escape="false"` 絕不可接受。若必須轉譯 RTF (rich text)，請在輸出前於伺服器端使用許可清單進行清理。

### 3.2 CSRF 保護

針對所有 postback 動作使用 `<apex:form>` — 平台會自動在表單中插入 CSRF 權杖。**不要**使用原始的 `<form method="POST">` HTML 元素，這會繞過 CSRF 保護。

### 3.3 控制器中的 SOQL 插入攻擊防範

```apex
// ❌ 切勿
String soql = 'SELECT Id FROM Account WHERE Name = \'' + ApexPages.currentPage().getParameters().get('name') + '\'';
List<Account> results = Database.query(soql);

// ✅ 務必 — 繫結變數
String nameParam = ApexPages.currentPage().getParameters().get('name');
List<Account> results = [SELECT Id FROM Account WHERE Name = :nameParam];
```

### 3.4 檢視狀態管理檢查清單

- [ ] 檢視狀態在 135 KB 以下 (在瀏覽器開發者工具或 Salesforce 檢視狀態索引標籤中檢查)
- [ ] 僅用於伺服器端運算的欄位宣告為 `transient`
- [ ] 大型集合不會在 postback 之間進行不必要的保存
- [ ] 針對唯讀頁面在 `<apex:page>` 上設定 `readonly="true"` 以跳過檢視狀態序列化

### 3.5 Visualforce 控制器中的 FLS / CRUD

```apex
// 讀取欄位前檢查
if (!Schema.sObjectType.Account.fields.Revenue__c.isAccessible()) {
    ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, '您沒有此欄位的存取權限。'));
    return null;
}

// 執行 DML 前檢查
if (!Schema.sObjectType.Account.isDeletable()) {
    throw new System.NoAccessException();
}
```

標準控制器會自動為繫結欄位強制執行 FLS。**自訂控制器則不會** — 必須手動強制執行 FLS。

---

## 快速參考 — 元件反模式摘要

| 反模式 | 技術 | 風險 | 修正方式 |
|---|---|---|---|
| 含有使用者資料的 `innerHTML` | LWC | XSS | 使用範本繫結 `{expression}` |
| 寫死的十六進位顏色 | LWC/Aura | 深色模式 / SLDS 2 中斷 | 使用 SLDS CSS 自訂屬性 |
| 圖示按鈕缺少 `aria-label` | LWC/Aura/VF | 協助工具失敗 | 加入 `alternative-text` 或 `aria-label` |
| `renderedCallback` 中沒有保護程式 | LWC | 無限重複轉譯迴圈 | 加入 `hasRendered` 布林保護程式 |
| 用於父子的應用程式事件 | Aura | 不必要的廣播範圍 | 改用元件事件 |
| 使用者資料上的 `escape="false"` | Visualforce | XSS | 移除 — 使用預設逸出 |
| 原始 `<form>` postback | Visualforce | CSRF 弱點 | 使用 `<apex:form>` |
| 自訂控制器上沒有 `with sharing` | VF / Apex | 資料外洩 | 加入 `with sharing` 宣告 |
| 自訂控制器中未檢查 FLS | VF / Apex | 權限提升 | 加入 `Schema.sObjectType` 檢查 |
| SOQL 與 URL 參數串接 | VF / Apex | SOQL 插入攻擊 | 使用繫結變數 |
