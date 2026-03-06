# Power BI 中的資料列層級安全性 (RLS)

## 概覽

資料列層級安全性根據使用者身分在資料列層級限制資料存取。使用者只能看到他們獲准檢視的資料。

## 設計原則

### 1. 在維度資料表上進行篩選
將 RLS 套用於維度，而非事實資料表：
- 效率更高（資料表較小）
- 篩選會透過關聯傳播
- 更易於維護

```dax
// 在 Customer 維度上 - 篩選會傳播到 Sales
[Region] = "West"
```

### 2. 建立最少量的角色
避免過多的角色組合：
- 每個角色 = 個別的快取
- 角色是累加的（聯集而非交集）
- 盡可能進行合併

### 3. 盡可能使用動態 RLS
資料驅動的規則具有更好的擴充性：
- 將使用者映射儲存在資料表中
- 使用 USERPRINCIPALNAME() 進行身分識別
- 使用者變更時無需變更角色

## 靜態 vs 動態 RLS

### 靜態 RLS
每個角色固定規則：
```dax
// 角色：West Region
[Region] = "West"

// 角色：East Region  
[Region] = "East"
```

**優點：** 簡單、明確
**缺點：** 無法擴充，每個群組都需要一個角色

### 動態 RLS
使用者身分驅動篩選：
```dax
// 單一角色根據登入使用者進行篩選
[ManagerEmail] = USERPRINCIPALNAME()
```

**優點：** 可擴充、自我維護
**缺點：** 需要使用者映射資料

## 實作模式

### 模式 1：直接使用者映射
維度資料表中的使用者電子郵件：
```dax
// 在 Customer 資料表上
[CustomerEmail] = USERPRINCIPALNAME()
```

### 模式 2：安全性資料表
將使用者映射到資料的獨立資料表：
```
SecurityMapping 資料表：
| UserEmail | Region |
|-----------|--------|
| joe@co.com | West  |
| sue@co.com | East  |
```

```dax
// 在 Region 維度上
[Region] IN 
    SELECTCOLUMNS(
        FILTER(SecurityMapping, [UserEmail] = USERPRINCIPALNAME()),
        "Region", [Region]
    )
```

### 模式 3：管理者階層
使用者可以看到其資料及下屬的資料：
```dax
// 使用階層的 PATH 函式
PATHCONTAINS(Employee[ManagerPath], 
    LOOKUPVALUE(Employee[EmployeeID], Employee[Email], USERPRINCIPALNAME()))
```

### 模式 4：多重規則
組合條件：
```dax
// 使用者可以看到自己的區域，或者如果他們是全域檢視者
[Region] = LOOKUPVALUE(Users[Region], Users[Email], USERPRINCIPALNAME())
|| LOOKUPVALUE(Users[IsGlobal], Users[Email], USERPRINCIPALNAME()) = TRUE()
```

## 透過 MCP 建立角色

### 列出現有角色
```
security_role_operations(operation: "List")
```

### 建立具備權限的角色
```
security_role_operations(
  operation: "Create",
  definitions: [{
    name: "Regional Sales",
    modelPermission: "Read",
    description: "按區域限制銷售資料"
  }]
)
```

### 新增資料表權限（篩選器）
```
security_role_operations(
  operation: "CreatePermissions",
  permissionDefinitions: [{
    roleName: "Regional Sales",
    tableName: "Customer",
    filterExpression: "[Region] = USERPRINCIPALNAME()"
  }]
)
```

### 取得有效權限
```
security_role_operations(
  operation: "GetEffectivePermissions",
  references: [{ name: "Regional Sales" }]
)
```

## 測試 RLS

### 在 Power BI Desktop 中
1. 模型建立索引標籤 > 檢視身分
2. 選擇要測試的角色
3. 選擇性指定使用者身分
4. 驗證資料篩選

### 測試非預期的值
對於動態 RLS，測試：
- 有效使用者
- 未知使用者（應看不到任何內容或正常報錯）
- NULL/空白值

```dax
// 防禦性模式 - 對未知使用者不傳回任何資料
IF(
    USERPRINCIPALNAME() IN VALUES(SecurityMapping[UserEmail]),
    [Region] IN SELECTCOLUMNS(...),
    FALSE()
)
```

## 常見錯誤

### 1. 僅在事實資料表上套用 RLS
**問題：** 大型資料表掃描，效能不佳
**解決方案：** 套用至維度資料表，讓關聯進行傳播

### 2. 使用 LOOKUPVALUE 取代關聯
**問題：** 成本昂貴，且無法擴充
**解決方案：** 建立適當的關聯，讓篩選流動

### 3. 預期交集行為
**問題：** 多個角色 = 聯集 (UNION)（累加性），而非交集
**解決方案：** 設計角色時請考慮聯集行為

### 4. 忘記 DirectQuery
**問題：** RLS 篩選器會變成 WHERE 子句
**解決方案：** 確保來源資料庫可以處理查詢模式

### 5. 未測試邊緣案例
**問題：** 使用者看到非預期的資料
**解決方案：** 測試：有效使用者、無效使用者、多個角色

## 雙向 RLS

對於具有 RLS 的雙向關聯：
```
啟用「雙向套用安全性篩選」
```

僅在以下情況下使用：
- RLS 需要透過多對多進行篩選
- 需要維度對維度的安全性

**警告：** 每條路徑僅允許一個雙向關聯。

## 效能考量

- RLS 會為每個查詢新增 WHERE 子句
- 篩選器中複雜的 DAX 會損害效能
- 使用真實的使用者人數進行測試
- 考慮為大型模型進行彙總

## 物件層級安全性 (OLS)

限制對整個資料表或資料欄的存取：
```
// 透過 XMLA/TMSL - 無法在 Desktop UI 中使用
```

用於：
- 隱藏敏感資料欄（薪資、身份證字號）
- 限制整個資料表
- 與 RLS 結合以實現全面的安全性

## 驗證清單

- [ ] RLS 套用至維度資料表（而非事實資料表）
- [ ] 篩選器透過關聯正確傳播
- [ ] 動態 RLS 使用 USERPRINCIPALNAME()
- [ ] 使用有效和無效使用者進行過測試
- [ ] 已處理邊緣案例（NULL、未知使用者）
- [ ] 已在負載下進行效能測試
- [ ] 角色映射已有文件記錄
- [ ] 已了解工作區角色（管理員會繞過 RLS）
