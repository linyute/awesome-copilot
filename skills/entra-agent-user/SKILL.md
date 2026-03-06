---
name: entra-agent-user
description: '從代理程式識別碼在 Microsoft Entra ID 中建立代理程式使用者，讓 AI 代理程式在 Microsoft 365 和 Azure 環境中能以具備使用者識別功能的數位員工身分運作。'
---

# 技能：在 Microsoft Entra 代理程式識別碼中建立代理程式使用者 (SKILL: Creating Agent Users in Microsoft Entra Agent ID)

## 總覽 (Overview)

**代理程式使用者 (agent user)** 是 Microsoft Entra ID 中一種專門的使用者識別，可讓 AI 代理程式以數位員工的身分運作。它允許代理程式存取嚴格要求使用者識別的 API 和服務（例如：Exchange 信箱、Teams、組織圖），同時維持適當的安全性邊界。

代理程式使用者收到的權杖包含 `idtyp=user`，這與一般代理程式識別碼（收到 `idtyp=app`）不同。

---

## 先決條件 (Prerequisites)

- 具有代理程式識別碼功能的 **Microsoft Entra 租用戶**
- 從 **代理程式識別碼藍圖** 建立的 **代理程式識別碼** (類型為 `ServiceIdentity` 的服務主體)
- 以下其中一項 **權限**：
  - `AgentIdUser.ReadWrite.IdentityParentedBy`（最低權限）
  - `AgentIdUser.ReadWrite.All`
  - `User.ReadWrite.All`
- 呼叫者必須至少具有 **代理程式識別碼管理員 (Agent ID Administrator)** 角色（在委派情境下）

> **重要事項：** `identityParentId` 必須參考真正的代理程式識別碼（透過代理程式識別碼藍圖建立），而非一般的應用程式服務主體。您可以透過檢查該服務主體是否具有 `@odata.type: #microsoft.graph.agentIdentity` 和 `servicePrincipalType: ServiceIdentity` 來進行驗證。

---

## 架構 (Architecture)

```
代理程式識別碼藍圖 (應用程式範本)
    │
    ├── 代理程式識別碼 (服務主體 - ServiceIdentity)
    │       │
    │       └── 代理程式使用者 (使用者 - agentUser) ← 1:1 關聯
    │
    └── 代理程式識別碼藍圖主體 (租用戶中的服務主體)
```

| 元件 | 類型 | 權杖宣告 (Token Claim) | 目的 |
|---|---|---|---|
| 代理程式識別碼 | 服務主體 | `idtyp=app` | 後端/API 作業 |
| 代理程式使用者 | 使用者 (`agentUser`) | `idtyp=user` | 在 M365 中以數位員工身分運作 |

---

## 步驟 1：驗證代理程式識別碼是否存在 (Verify the Agent Identity Exists)

在建立代理程式使用者之前，請確認該代理程式識別碼是正確的 `agentIdentity` 類型：

```http
GET https://graph.microsoft.com/beta/servicePrincipals/{agent-identity-id}
Authorization: Bearer <token>
```

驗證回應是否包含：
```json
{
  "@odata.type": "#microsoft.graph.agentIdentity",
  "servicePrincipalType": "ServiceIdentity",
  "agentIdentityBlueprintId": "<blueprint-id>"
}
```

### PowerShell

```powershell
Connect-MgGraph -Scopes "Application.Read.All" -TenantId "<tenant>" -UseDeviceCode -NoWelcome
Invoke-MgGraphRequest -Method GET `
  -Uri "https://graph.microsoft.com/beta/servicePrincipals/<agent-identity-id>" | ConvertTo-Json -Depth 3
```

> **常見錯誤：** 使用應用程式註冊的 `appId` 或一般應用程式服務主體的 `id` 會導致失敗。只有從藍圖建立的代理程式識別碼才有效。

---

## 步驟 2：建立代理程式使用者 (Create the Agent User)

### HTTP 請求 (HTTP Request)

```http
POST https://graph.microsoft.com/beta/users/microsoft.graph.agentUser
Content-Type: application/json
Authorization: Bearer <token>

{
  "accountEnabled": true,
  "displayName": "我的代理程式使用者",
  "mailNickname": "my-agent-user",
  "userPrincipalName": "my-agent-user@yourtenant.onmicrosoft.com",
  "identityParentId": "<agent-identity-object-id>"
}
```

### 必要屬性 (Required Properties)

| 屬性 | 類型 | 說明 |
|---|---|---|
| `accountEnabled` | 布林值 | `true` 以啟用帳戶 |
| `displayName` | 字串 | 人類友善的名稱 |
| `mailNickname` | 字串 | 郵件別名（不含空格/特殊字元） |
| `userPrincipalName` | 字串 | UPN — 在租用戶中必須是唯一的 (`別名@已驗證的網域`) |
| `identityParentId` | 字串 | 父代理程式識別碼的物件識別碼 (Object ID) |

### PowerShell

```powershell
Connect-MgGraph -Scopes "User.ReadWrite.All" -TenantId "<tenant>" -UseDeviceCode -NoWelcome

$body = @{
  accountEnabled    = $true
  displayName       = "我的代理程式使用者"
  mailNickname      = "my-agent-user"
  userPrincipalName = "my-agent-user@yourtenant.onmicrosoft.com"
  identityParentId  = "<agent-identity-object-id>"
} | ConvertTo-Json

Invoke-MgGraphRequest -Method POST `
  -Uri "https://graph.microsoft.com/beta/users/microsoft.graph.agentUser" `
  -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 3
```

### 關鍵筆記 (Key Notes)

- **無密碼** — 代理程式使用者不能有密碼。他們透過其父代理程式識別碼的認證進行驗證。
- **1:1 關聯** — 每個代理程式識別碼最多只能有一個代理程式使用者。嘗試建立第二個將會傳回 `400 Bad Request`。
- `userPrincipalName` 必須是唯一的。請勿重複使用現有使用者的 UPN。

---

## 步驟 3：指派經理（選用） (Assign a Manager (Optional))

指派經理可讓代理程式使用者出現在組織圖中（例如：Teams）。

```http
PUT https://graph.microsoft.com/beta/users/{agent-user-id}/manager/$ref
Content-Type: application/json
Authorization: Bearer <token>

{
  "@odata.id": "https://graph.microsoft.com/beta/users/{manager-user-id}"
}
```

### PowerShell

```powershell
$managerBody = '{"@odata.id":"https://graph.microsoft.com/beta/users/<manager-user-id>"}'
Invoke-MgGraphRequest -Method PUT `
  -Uri "https://graph.microsoft.com/beta/users/<agent-user-id>/manager/`$ref" `
  -Body $managerBody -ContentType "application/json"
```

---

## 步驟 4：設定使用位置並指派授權（選用） (Set Usage Location and Assign Licenses (Optional))

代理程式使用者需要授權才能擁有信箱、Teams 目前狀態等。必須先設定使用位置。

### 設定使用位置 (Set Usage Location)

```http
PATCH https://graph.microsoft.com/beta/users/{agent-user-id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "usageLocation": "TW"
}
```

### 列出可用授權 (List Available Licenses)

```http
GET https://graph.microsoft.com/beta/subscribedSkus?$select=skuPartNumber,skuId,consumedUnits,prepaidUnits
Authorization: Bearer <token>
```

需要 `Organization.Read.All` 權限。

### 指派授權 (Assign a License)

```http
POST https://graph.microsoft.com/beta/users/{agent-user-id}/assignLicense
Content-Type: application/json
Authorization: Bearer <token>

{
  "addLicenses": [
    { "skuId": "<sku-id>" }
  ],
  "removeLicenses": []
}
```

### PowerShell（全部合一） (PowerShell (all in one))

```powershell
Connect-MgGraph -Scopes "User.ReadWrite.All","Organization.Read.All" -TenantId "<tenant>" -NoWelcome

# 設定使用位置
Invoke-MgGraphRequest -Method PATCH `
  -Uri "https://graph.microsoft.com/beta/users/<agent-user-id>" `
  -Body '{"usageLocation":"TW"}' -ContentType "application/json"

# 指派授權
$licenseBody = '{"addLicenses":[{"skuId":"<sku-id>"}],"removeLicenses":[]}'
Invoke-MgGraphRequest -Method POST `
  -Uri "https://graph.microsoft.com/beta/users/<agent-user-id>/assignLicense" `
  -Body $licenseBody -ContentType "application/json"
```

> **提示：** 您也可以透過 **Entra 系統管理中心** 進行授權指派，路徑為：識別 (Identity) → 使用者 (Users) → 所有使用者 (All users) → 選取代理程式使用者 → 授權與應用程式 (Licenses and apps)。

---

## 佈建時間 (Provisioning Times)

| 服務 | 預估時間 |
|---|---|
| Exchange 信箱 | 5–30 分鐘 |
| Teams 可用性 | 15 分鐘 – 24 小時 |
| 組織圖 / 人員搜尋 | 最長 24–48 小時 |
| SharePoint / OneDrive | 5–30 分鐘 |
| 全域通訊錄 | 最長 24 小時 |

---

## 代理程式使用者功能 (Agent User Capabilities)

- ✅ 已加入 Microsoft Entra 群組（包括動態群組）
- ✅ 存取僅限使用者的 API (`idtyp=user` 權杖)
- ✅ 擁有信箱、行事曆和聯絡人
- ✅ 參與 Teams 聊天和頻道
- ✅ 出現在組織圖和人員搜尋中
- ✅ 已加入管理單位
- ✅ 已指派授權

## 代理程式使用者安全性限制 (Agent User Security Constraints)

- ❌ 不能有密碼、通行密鑰 (passkey) 或互動式登入
- ❌ 不能被指派具備權限的系統管理員角色
- ❌ 不能被加入至可指派角色的群組
- ❌ 預設權限與來賓使用者類似
- ❌ 無法使用自訂角色指派

---

## 疑難排解 (Troubleshooting)

| 錯誤 | 原因 | 修正方式 |
|---|---|---|
| `Agent user IdentityParent does not exist` | `identityParentId` 指向不存在或非代理程式識別碼的物件 | 驗證該識別碼是 `agentIdentity` 服務主體，而非一般的應用程式 |
| `400 Bad Request` (identityParentId already linked) | 該代理程式識別碼已連結代理程式使用者 | 每個代理程式識別碼僅支援一個代理程式使用者 |
| `409 Conflict` on UPN | `userPrincipalName` 已被佔用 | 使用唯一的 UPN |
| 授權指派失敗 | 未設定使用位置 | 在指派授權前先設定 `usageLocation` |

---

## 參考資料 (References)

- [代理程式識別碼 (Agent identities)](https://learn.microsoft.com/zh-tw/entra/agent-id/identity-platform/agent-identities)
- [代理程式使用者 (Agent users)](https://learn.microsoft.com/zh-tw/entra/agent-id/identity-platform/agent-users)
- [代理程式服務主體 (Agent service principals)](https://learn.microsoft.com/zh-tw/entra/agent-id/identity-platform/agent-service-principals)
- [建立代理程式識別碼藍圖 (Create agent identity blueprint)](https://learn.microsoft.com/zh-tw/entra/agent-id/identity-platform/create-blueprint)
- [建立代理程式識別碼 (Create agent identities)](https://learn.microsoft.com/zh-tw/entra/agent-id/identity-platform/create-delete-agent-identities)
- [agentUser 資源類型 (Graph API)](https://learn.microsoft.com/en-us/graph/api/resources/agentuser?view=graph-rest-beta)
- [建立 agentUser (Graph API)](https://learn.microsoft.com/en-us/graph/api/agentuser-post?view=graph-rest-beta)
