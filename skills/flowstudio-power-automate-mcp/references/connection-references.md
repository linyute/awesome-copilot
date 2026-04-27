# FlowStudio MCP — 連接參考 (Connection References)

連接參考將流程的連接器動作，連結至 Power Platform 中真實且已驗證的連接。每當您呼叫 `update_live_flow` 並使用包含連接器動作的定義時，都需要這些參考。

---

## 流程定義中的結構

```json
{
  "properties": {
    "definition": { ... },
    "connectionReferences": {
      "shared_sharepointonline": {
        "connectionName": "shared-sharepointonl-62599557c-1f33-4aec-b4c0-a6e4afcae3be",
        "id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
        "displayName": "SharePoint"
      },
      "shared_office365": {
        "connectionName": "shared-office365-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        "id": "/providers/Microsoft.PowerApps/apis/shared_office365",
        "displayName": "Office 365 Outlook"
      }
    }
  }
}
```

鍵 (Keys) 為 **邏輯參考名稱** (例如 `shared_sharepointonline`)。
這些名稱必須符合每個動作 `host` 區塊內的 `connectionName` 欄位。

---

## 尋找連接 GUID

對 **任何使用相同連接的現有流程** 呼叫 `get_live_flow`，並複製 `connectionReferences` 區塊。連接器前綴之後的 GUID 即為由驗證使用者所擁有的連接執行個體。

```python
flow = mcp("get_live_flow", environmentName=ENV, flowName=EXISTING_FLOW_ID)
conn_refs = flow["properties"]["connectionReferences"]
# conn_refs["shared_sharepointonline"]["connectionName"]
# → "shared-sharepointonl-62599557c-1f33-4aec-b4c0-a6e4afcae3be"
```

> ⚠️ 連接參考是 **使用者範圍 (user-scoped)** 的。如果連接由其他帳戶擁有，`update_live_flow` 將回傳 403 `ConnectionAuthorizationFailed`。您必須使用屬於 `x-api-key` 標頭中權杖所對應帳戶的連接。

---

## 將 `connectionReferences` 傳遞給 `update_live_flow`

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=modified_definition,
    connectionReferences={
        "shared_sharepointonline": {
            "connectionName": "shared-sharepointonl-62599557c-1f33-4aec-b4c0-a6e4afcae3be",
            "id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"
        }
    }
)
```

僅包含定義實際使用的連接。

---

## 常見連接器 API ID

| 服務 | API ID |
|---|---|
| SharePoint Online | `/providers/Microsoft.PowerApps/apis/shared_sharepointonline` |
| Office 365 Outlook | `/providers/Microsoft.PowerApps/apis/shared_office365` |
| Microsoft Teams | `/providers/Microsoft.PowerApps/apis/shared_teams` |
| OneDrive for Business | `/providers/Microsoft.PowerApps/apis/shared_onedriveforbusiness` |
| Azure AD | `/providers/Microsoft.PowerApps/apis/shared_azuread` |
| HTTP with Azure AD | `/providers/Microsoft.PowerApps/apis/shared_webcontents` |
| SQL Server | `/providers/Microsoft.PowerApps/apis/shared_sql` |
| Dataverse | `/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps` |
| Azure Blob Storage | `/providers/Microsoft.PowerApps/apis/shared_azureblob` |
| Approvals (核准) | `/providers/Microsoft.PowerApps/apis/shared_approvals` |
| Office 365 Users | `/providers/Microsoft.PowerApps/apis/shared_office365users` |
| Flow Management | `/providers/Microsoft.PowerApps/apis/shared_flowmanagement` |

---

## Teams 調適型卡片雙重連接需求

傳送調適型卡片 **並** 張貼後續訊息的流程，需要兩個獨立的 Teams 連接：

```json
"connectionReferences": {
  "shared_teams": {
    "connectionName": "shared-teams-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "id": "/providers/Microsoft.PowerApps/apis/shared_teams"
  },
  "shared_teams_1": {
    "connectionName": "shared-teams-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "id": "/providers/Microsoft.PowerApps/apis/shared_teams"
  }
}
```

兩者皆可指向 **同一個基礎 Teams 帳戶**，但必須註冊為兩個不同的連接參考。Webhook (`OpenApiConnectionWebhook`) 使用 `shared_teams`，後續的訊息動作則使用 `shared_teams_1`。
