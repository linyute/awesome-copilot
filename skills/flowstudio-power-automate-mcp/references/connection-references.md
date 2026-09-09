# FlowStudio MCP — 連線參考

連線參考將流程的連接器動作連接至 Power Platform 中實際經過驗證的
連線。每當您使用包含連接器動作的定義呼叫 `update_live_flow` 時，
都必須提供連線參考。

---

## 流程定義中的結構

```json
{
  "properties": {
    "definition": { ... },
    "connectionReferences": {
      "shared_sharepointonline": {
        "connectionName": "shared-sharepointonl-eeeeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
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

索引鍵為**邏輯參考名稱**（例如 `shared_sharepointonline`）。
這些名稱與每個動作的 `host` 區塊內的 `connectionName` 欄位一致。

---

## 尋找連線參考

偏好方法：在目標環境中呼叫 `list_live_connections`。使用
`search` 將結果縮小至您需要的連接器；較新的 MCP 伺服器版本
會傳回可直接貼上的範本。

```python
matches = mcp("list_live_connections",
    environmentName=ENV,
    search="shared_sharepointonline")

conn = next(c for c in matches["connections"]
            if c.get("overallStatus") == "Connected"
            or c.get("statuses", [{}])[0].get("status") == "Connected")

conn_refs = {
    "shared_sharepointonline": conn.get("connectionReferenceTemplate") or {
        "connectionName": conn["id"],
        "id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
        "source": "Invoker"
    }
}
host = conn.get("hostTemplate") or {"connectionName": "shared_sharepointonline"}
```

將 `host` 用作動作端的 `inputs.host`。將 `conn_refs` 作為
`update_live_flow(connectionReferences=conn_refs)` 傳入。

遞補方法：從現有流程複製。

對使用相同連線的**任何現有流程**呼叫 `get_live_flow`，
並複製其 `connectionReferences` 區塊。連接器前綴之後的 GUID
即為驗證使用者所擁有的連線執行個體。

```python
flow = mcp("get_live_flow", environmentName=ENV, flowName=EXISTING_FLOW_ID)
conn_refs = flow["properties"]["connectionReferences"]
# conn_refs["shared_sharepointonline"]["connectionName"]
# → "shared-sharepointonl-eeeeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"
```

> ⚠️ 連線參考是以**使用者範圍**界定的。如果連線由其他帳戶
> 擁有，`update_live_flow` 將會傳回 403
> `ConnectionAuthorizationFailed`。您必須使用其權杖存在於
> `x-api-key` 標頭中之帳戶所屬的連線。

---

## 傳遞 `connectionReferences` 至 `update_live_flow`

```python
result = mcp("update_live_flow",
    environmentName=ENV,
    flowName=FLOW_ID,
    definition=modified_definition,
    connectionReferences={
        "shared_sharepointonline": {
            "connectionName": "shared-sharepointonl-eeeeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
            "id": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"
        }
    }
)
```

僅包含該定義實際使用的連線。

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
| Approvals | `/providers/Microsoft.PowerApps/apis/shared_approvals` |
| Office 365 Users | `/providers/Microsoft.PowerApps/apis/shared_office365users` |
| Flow Management | `/providers/Microsoft.PowerApps/apis/shared_flowmanagement` |

---

## Teams 調適型卡片雙連線需求

傳送調適型卡片**且**張貼後續訊息的流程需要兩個
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

兩者皆可指向**同一個基礎 Teams 帳戶**，但必須註冊
為兩個相異的連線參考。Webhook（`OpenApiConnectionWebhook`）
使用 `shared_teams`，後續的訊息動作則使用 `shared_teams_1`。
