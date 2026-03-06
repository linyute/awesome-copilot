---
description: 'Power BI 列級安全性 (RLS) 和進階安全性模式實施指南，包含動態安全性、最佳實踐和治理策略。'
applyTo: '**/*.{pbix,dax,md,txt,json,csharp,powershell}'
---

# Power BI 安全性和列級安全性最佳實踐

## 概述
本文件根據 Microsoft 的官方指導方針，提供了在 Power BI 中實施強大安全性模式的全面說明，重點關注列級安全性 (RLS)、動態安全性和治理最佳實踐。

## 列級安全性基礎

### 1. 基本 RLS 實施
```dax
// 簡單的基於使用者的篩選
[EmailAddress] = USERNAME()

// 帶有改進安全性的基於角色的篩選
IF(
    USERNAME() = "Worker",
    [Type] = "Internal",
    IF(
        USERNAME() = "Manager",
        TRUE(),
        FALSE()  // 拒絕意外使用者的存取
    )
)
```

### 2. 帶有自訂資料的動態 RLS
```dax
// 使用 CUSTOMDATA() 進行動態篩選
VAR UserRole = CUSTOMDATA()
RETURN
    SWITCH(
        UserRole,
        "SalesPersonA", [SalesTerritory] = "West",
        "SalesPersonB", [SalesTerritory] = "East",
        "Manager", TRUE(),
        FALSE()  // 預設拒絕
    )
```

### 3. 進階安全性模式
```dax
// 帶有區域查詢的層次安全性
=DimSalesTerritory[SalesTerritoryKey]=LOOKUPVALUE(
    DimUserSecurity[SalesTerritoryID], 
    DimUserSecurity[UserName], USERNAME(), 
    DimUserSecurity[SalesTerritoryID], DimSalesTerritory[SalesTerritoryKey]
)

// 多條件安全性
VAR UserTerritories = 
    FILTER(
        UserSecurity,
        UserSecurity[UserName] = USERNAME()
    )
VAR AllowedTerritories = SELECTCOLUMNS(UserTerritories, "Territory", UserSecurity[Territory])
RETURN
    [Territory] IN AllowedTerritories
```

## 嵌入式分析安全性

### 1. 靜態 RLS 實施
```csharp
// 帶有固定角色的靜態 RLS
var rlsidentity = new EffectiveIdentity(
    username: "username@contoso.com", 
    roles: new List<string>{ "MyRole" },
    datasets: new List<string>{ datasetId.ToString()}
);
```

### 2. 帶有自訂資料的動態 RLS
```csharp
// 帶有自訂資料的動態 RLS
var rlsidentity = new EffectiveIdentity(
    username: "username@contoso.com",
    roles: new List<string>{ "MyRoleWithCustomData" },
    customData: "SalesPersonA",
    datasets: new List<string>{ datasetId.ToString()}
);
```

### 3. 多資料集安全性
```json
{
    "accessLevel": "檢視",
    "identities": [
        {
            "username": "France",
            "roles": [ "CountryDynamic"],
            "datasets": [ "fe0a1aeb-f6a4-4b27-a2d3-b5df3bb28bdc" ]
        }
    ]
}
```

## 資料庫級安全性整合

### 1. SQL Server RLS 整合
```sql
-- 建立安全性架構和謂詞函式
CREATE SCHEMA Security;
GO

CREATE FUNCTION Security.tvf_securitypredicate(@SalesRep AS nvarchar(50))
    RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS tvf_securitypredicate_result
WHERE @SalesRep = USER_NAME() OR USER_NAME() = 'Manager';
GO

-- 應用安全性策略
CREATE SECURITY POLICY SalesFilter
ADD FILTER PREDICATE Security.tvf_securitypredicate(SalesRep)
ON sales.Orders
WITH (STATE = ON);
GO
```

### 2. Fabric Warehouse 安全性
```sql
-- 建立安全性架構
CREATE SCHEMA Security;
GO

-- 建立 SalesRep 評估函式
CREATE FUNCTION Security.tvf_securitypredicate(@UserName AS varchar(50))
    RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS tvf_securitypredicate_result
WHERE @UserName = USER_NAME()
OR USER_NAME() = 'BatchProcess@contoso.com';
GO

-- 使用函式建立安全性策略
CREATE SECURITY POLICY YourSecurityPolicy
ADD FILTER PREDICATE Security.tvf_securitypredicate(UserName_column)
ON sampleschema.sampletable
WITH (STATE = ON);
GO
```

## 進階安全性模式

### 1. 分頁報表安全性
```json
{
    "format": "PDF",
    "paginatedReportConfiguration":{
        "identities": [
            {"username": "john@contoso.com"}
        ]
    }
}
```

### 2. Power Pages 整合
```html
{% powerbi authentication_type:"powerbiembedded" path:"https://app.powerbi.com/groups/00000000-0000-0000-0000-000000000000/reports/00000000-0000-0000-0000-000000000001/ReportSection" roles:"pagesuser" %}
```

### 3. 多租戶安全性
```json
{
  "datasets": [
    {
      "id": "fff1a505-xxxx-xxxx-xxxx-e69f81e5b974",
    }
  ],
  "reports": [
    {
      "allowEdit": false,
      "id": "10ce71df-xxxx-xxxx-xxxx-814a916b700d"
    }
  ],
  "identities": [
    {
      "username": "YourUsername",
      "datasets": [
        "fff1a505-xxxx-xxxx-xxxx-e69f81e5b974"
      ],
      "roles": [
        "YourRole"
      ]
    }
  ],
  "datasourceIdentities": [
    {
      "identityBlob": "eyJ…",
      "datasources": [
        {
          "datasourceType": "Sql",
          "connectionDetails": {
            "server": "YourServerName.database.windows.net",
            "database": "YourDataBaseName"
          }
        }
      ]
    }
  ]
}
```

## 安全性設計模式

### 1. 部分 RLS 實施
```dax
// 為部分 RLS 建立摘要表
SalesRevenueSummary =
SUMMARIZECOLUMNS(
    Sales[OrderDate],
    "RevenueAllRegion", SUM(Sales[Revenue])
)

// 僅將 RLS 應用於詳細層級
Salesperson Filter = [EmailAddress] = USERNAME()
```

### 2. 層次安全性
```dax
// 經理可以看到所有，其他人看到自己的
VAR CurrentUser = USERNAME()
VAR UserRole = LOOKUPVALUE(
    UserRoles[Role], 
    UserRoles[Email], CurrentUser
)
RETURN
    SWITCH(
        UserRole,
        "Manager", TRUE(),
        "Salesperson", [SalespersonEmail] = CurrentUser,
        "Regional Manager", [Region] IN (
            SELECTCOLUMNS(
                FILTER(UserRegions, UserRegions[Email] = CurrentUser),
                "Region", UserRegions[Region]
            )
        ),
        FALSE()
    )
```

### 3. 基於時間的安全性
```dax
// 根據角色限制對最新資料的存取
VAR UserRole = LOOKUPVALUE(UserRoles[Role], UserRoles[Email], USERNAME())
VAR CutoffDate = 
    SWITCH(
        UserRole,
        "Executive", DATE(1900,1,1),  // 所有歷史資料
        "Manager", TODAY() - 365,     // 去年
        "Analyst", TODAY() - 90,      // 最近 90 天
        TODAY()                       // 僅當前日期
    )
RETURN
    [Date] >= CutoffDate
```

## 安全性驗證和測試

### 1. 角色驗證模式
```dax
// 安全性測試量值
Security Test = 
VAR CurrentUsername = USERNAME()
VAR ExpectedRole = "TestRole"
VAR TestResult = 
    IF(
        HASONEVALUE(SecurityRoles[Role]) && 
        VALUES(SecurityRoles[Role]) = ExpectedRole,
        "PASS: 角色應用正確",
        "FAIL: 角色不正確或多個角色"
    )
RETURN
    "使用者： " & CurrentUsername & " | " & TestResult
```

### 2. 資料暴露稽核
```dax
// 稽核量值以追蹤資料存取
Data Access Audit = 
VAR AccessibleRows = COUNTROWS(FactTable)
VAR TotalRows = CALCULATE(COUNTROWS(FactTable), ALL(FactTable))
VAR AccessPercentage = DIVIDE(AccessibleRows, TotalRows) * 100
RETURN
    "使用者： " & USERNAME() & 
    " | 可存取： " & FORMAT(AccessibleRows, "#,0") & 
    " | 總計： " & FORMAT(TotalRows, "#,0") & 
    " | 存取： " & FORMAT(AccessPercentage, "0.00") & "%"
```

## 治理和管理

### 1. 自動化安全性群組管理
```powershell
# 將安全性群組新增到 Power BI 工作區
# 登入 Power BI
Login-PowerBI

# 設定安全性群組物件 ID
$SGObjectID = "<security-group-object-ID>"

# 取得工作區
$pbiWorkspace = Get-PowerBIWorkspace -Filter "name eq '<workspace-name>'"

# 將安全性群組新增到工作區
Add-PowerBIWorkspaceUser -Id $($pbiWorkspace.Id) -AccessRight Member -PrincipalType Group -Identifier $($SGObjectID)
```

### 2. 安全性監控
```powershell
# 監控 Power BI 存取模式
$workspaces = Get-PowerBIWorkspace
foreach ($workspace in $workspaces) {
    $users = Get-PowerBIWorkspaceUser -Id $workspace.Id
    Write-Host "工作區： $($workspace.Name)"
    foreach ($user in $users) {
        Write-Host "  使用者： $($user.UserPrincipalName) - 存取： $($user.AccessRight)"
    }
}
```

### 3. 合規性報告
```dax
// 合規性儀表板量值
具有資料存取權限的使用者 = 
CALCULATE(
    DISTINCTCOUNT(AuditLog[Username]),
    AuditLog[AccessType] = "DataAccess",
    AuditLog[Date] >= TODAY() - 30
)

高權限使用者 = 
CALCULATE(
    DISTINCTCOUNT(UserRoles[Email]),
    UserRoles[Role] IN {"Admin", "Manager", "Executive"}
)

安全性違規 = 
CALCULATE(
    COUNTROWS(AuditLog),
    AuditLog[EventType] = "SecurityViolation",
    AuditLog[Date] >= TODAY() - 7
)
```

## 最佳實踐和反模式

### ✅ 安全性最佳實踐

#### 1. 最小權限原則
```dax
// 始終預設為限制性存取
Default Security = 
VAR UserPermissions = 
    FILTER(
        UserAccess,
        UserAccess[Email] = USERNAME()
    )
RETURN
    IF(
        COUNTROWS(UserPermissions) > 0,
        [Territory] IN SELECTCOLUMNS(UserPermissions, "Territory", UserAccess[Territory]),
        FALSE()  // 如果未明確授予，則無權存取
    )
```

#### 2. 明確的角色驗證
```dax
// 明確驗證預期角色
Role-Based Filter = 
VAR UserRole = LOOKUPVALUE(UserRoles[Role], UserRoles[Email], USERNAME())
VAR AllowedRoles = {"Analyst", "Manager", "Executive"}
RETURN
    IF(
        UserRole IN AllowedRoles,
        SWITCH(
            UserRole,
            "Analyst", [Department] = LOOKUPVALUE(UserDepartments[Department], UserDepartments[Email], USERNAME()),
            "Manager", [Region] = LOOKUPVALUE(UserRegions[Region], UserRegions[Email], USERNAME()),
            "Executive", TRUE()
        ),
        FALSE()  // 拒絕意外角色的存取
    )
```

### ❌ 應避免的安全性反模式

#### 1. 過於寬鬆的預設值
```dax
// ❌ 避免：這會授予意外使用者完全存取權限
Bad Security Filter = 
IF(
    USERNAME() = "SpecificUser",
    [Type] = "Internal",
    TRUE()  // 危險的預設值
)
```

#### 2. 複雜的安全性邏輯
```dax
// ❌ 避免：過於複雜的安全性難以稽核
Overly Complex Security = 
IF(
    OR(
        AND(USERNAME() = "User1", WEEKDAY(TODAY()) <= 5),
        AND(USERNAME() = "User2", HOUR(NOW()) >= 9, HOUR(NOW()) <= 17),
        AND(CONTAINS(VALUES(SpecialUsers[Email]), SpecialUsers[Email], USERNAME()), [Priority] = "High")
    ),
    [Type] IN {"Internal", "Confidential"},
    [Type] = "Public"
)
```

## 安全性整合模式

### 1. Azure AD 整合
```csharp
// 使用 Azure AD 使用者上下文產生權杖
var tokenRequest = new GenerateTokenRequestV2(
    reports: new List<GenerateTokenRequestV2Report>() { new GenerateTokenRequestV2Report(reportId) },
    datasets: datasetIds.Select(datasetId => new GenerateTokenRequestV2Dataset(datasetId.ToString())).ToList(),
    targetWorkspaces: targetWorkspaceId != Guid.Empty ? new List<GenerateTokenRequestV2TargetWorkspace>() { new GenerateTokenRequestV2TargetWorkspace(targetWorkspaceId) } : null,
    identities: new List<EffectiveIdentity> { rlsIdentity }
);

var embedToken = pbiClient.EmbedToken.GenerateToken(tokenRequest);
```

### 2. 服務主體驗證
```csharp
// 帶有 RLS 的服務主體用於嵌入式場景
public EmbedToken GetEmbedToken(Guid reportId, IList<Guid> datasetIds, [Optional] Guid targetWorkspaceId)
{
    PowerBIClient pbiClient = this.GetPowerBIClient();

    var rlsidentity = new EffectiveIdentity(
       username: "username@contoso.com",
       roles: new List<string>{ "MyRole" },
       datasets: new List<string>{ datasetId.ToString()}
    );
    
    var tokenRequest = new GenerateTokenRequestV2(
        reports: new List<GenerateTokenRequestV2Report>() { new GenerateTokenRequestV2Report(reportId) },
        datasets: datasetIds.Select(datasetId => new GenerateTokenRequestV2Dataset(datasetId.ToString())).ToList(),
        targetWorkspaces: targetWorkspaceId != Guid.Empty ? new List<GenerateTokenRequestV2TargetWorkspace>() { new GenerateTokenRequestV2TargetWorkspace(targetWorkspaceId) } : null,
        identities: new List<EffectiveIdentity> { rlsidentity }
    );

    var embedToken = pbiClient.EmbedToken.GenerateToken(tokenRequest);

    return embedToken;
}
```

## 安全性監控和稽核

### 1. 存取模式分析
```dax
// 識別異常存取模式
Unusual Access Pattern = 
VAR UserAccessCount = 
    CALCULATE(
        COUNTROWS(AccessLog),
        AccessLog[Date] >= TODAY() - 7
    )
VAR AvgUserAccess = 
    CALCULATE(
        AVERAGE(AccessLog[AccessCount]),
        ALL(AccessLog[Username]),
        AccessLog[Date] >= TODAY() - 30
    )
RETURN
    IF(
        UserAccessCount > AvgUserAccess * 3,
        "⚠️ 高活動",
        "正常"
    )
```

### 2. 資料洩露檢測
```dax
// 檢測潛在的資料暴露
Potential Data Exposure = 
VAR UnexpectedAccess = 
    CALCULATE(
        COUNTROWS(AccessLog),
        AccessLog[AccessResult] = "Denied",
        AccessLog[Date] >= TODAY() - 1
    )
RETURN
    IF(
        UnexpectedAccess > 10,
        "🚨 多次存取拒絕 - 需要審查",
        "正常"
    )
```

請記住：安全性是分層的 - 透過適當的身份驗證、授權、資料加密、網路安全和全面的稽核來實施深度防禦。定期審查和測試安全性實施，以確保它們符合當前要求和合規性標準。