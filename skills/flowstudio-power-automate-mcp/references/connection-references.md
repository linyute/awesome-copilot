# FlowStudio MCP — 連線參考 (Connection References)

連線參考將流程的連接器動作串接至 Power Platform 中真實且已驗證的
連線。每當您呼叫 `update_live_flow` 且定義中包含連接器動作時，
皆必須提供連線參考。

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

鍵值為 **邏輯參考名稱** (例如 `shared_sharepointonline`)。
這些必須與每個動作之 `host` 區塊內的 `connectionName` 欄位相符。

---

## 尋找連線 GUID

在 **任何使用相同連線的現有流程** 上呼叫 `get_live_flow`
並複製 `connectionReferences` 區塊。連接器前綴之後的 GUID 即為
驗證使用者所擁有的連線執行個體。

```python
flow = mcp("get_live_flow", environmentName=ENV, flowName=EXISTING_FLOW_ID)
conn_refs = flow["properties"]["connectionReferences"]
# conn_refs["shared_sharepointonline"]["connectionName"]
# → "shared-sharepointonl-62599557c-1f33-4aec-b4c0-a6e4afcae3be"
```

> ⚠️ 連線參考具備 **使用者範圍**。如果連線由另一個帳戶擁有，
> `update_live_flow` 將會傳回 403 `ConnectionAuthorizationFailed`。
> 您必須使用屬於該帳戶的連線，該帳戶即為 `x-api-key` 標頭中權杖的擁有者。

---

## 將 `connectionReferences` 傳遞至 `update_live_flow`

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

僅包含定義中實際使用到的連線。

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
| 核准 | `/providers/Microsoft.PowerApps/apis/shared_approvals` |
| Office 365 使用者 | `/providers/Microsoft.PowerApps/apis/shared_office365users` |
| 流程管理 | `/providers/Microsoft.PowerApps/apis/shared_flowmanagement` |

---

## Teams 自適應卡片雙連線需求

傳送自適應卡片 **且** 張貼後續訊息的流程需要兩個
獨立的 Teams 連線：

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

兩者皆可指向 **同一個底層 Teams 帳戶**，但必須註冊為
兩個不同的連線參考。Webhook (`OpenApiConnectionWebhook`) 
使用 `shared_teams`，而後續的訊息動作則使用 `shared_teams_1`。
