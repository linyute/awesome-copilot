# FlowStudio MCP — 觸發程序類型

用於 Power Automate 流程定義的複製貼上式觸發程序定義。

---

## 週期 (Recurrence)

根據排程執行。

```json
"Recurrence": {
  "type": "Recurrence",
  "recurrence": {
    "frequency": "Day",
    "interval": 1,
    "startTime": "2026-01-01T08:00:00Z",
    "timeZone": "AUS Eastern Standard Time"
  }
}
```

每週特定日期：
```json
"Recurrence": {
  "type": "Recurrence",
  "recurrence": {
    "frequency": "Week",
    "interval": 1,
    "schedule": {
      "weekDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    "startTime": "2026-01-05T09:00:00Z",
    "timeZone": "AUS Eastern Standard Time"
  }
}
```

常見的 `timeZone` (時區) 數值：
- `"AUS Eastern Standard Time"` — 悉尼/墨爾本 (UTC+10/+11)
- `"UTC"` — 通用協調時間
- `"E. Australia Standard Time"` — 布里斯本 (UTC+10 無夏令時間)
- `"New Zealand Standard Time"` — 奧克蘭 (UTC+12/+13)
- `"Pacific Standard Time"` — 洛杉磯 (UTC-8/-7)
- `"GMT Standard Time"` — 倫敦 (UTC+0/+1)
- `"Taipei Standard Time"` — 台北 (UTC+8)

---

## 手動 (Manual，HTTP 請求 / Power Apps)

接收帶有 JSON 本文的 HTTP POST。

```json
"manual": {
  "type": "Request",
  "kind": "Http",
  "inputs": {
    "schema": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "value": { "type": "integer" }
      },
      "required": ["name"]
    }
  }
}
```

存取數值：`@triggerBody()?['name']`
儲存後可取得觸發程序 URL：`@listCallbackUrl()`

#### 無 Schema 變體 (接受任意 JSON)

當連入的裝載 (payload) 結構未知或多變時，可省略 Schema 以接受任何有效的 JSON 本文而不進行驗證：

```json
"manual": {
  "type": "Request",
  "kind": "Http",
  "inputs": {
    "schema": {}
  }
}
```

動態存取任何欄位：`@triggerBody()?['anyField']`

> 針對外部 Webhook (Stripe、GitHub、Employment Hero 等) 使用此方式，因為其裝載形狀可能會變更或未完全記錄。流程會接受任何 JSON，而不會因為非預期的屬性而傳回 400 錯誤。

---

## 自動化 (Automated，SharePoint 項目已建立)

```json
"When_an_item_is_created": {
  "type": "OpenApiConnectionNotification",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "OnNewItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList"
    },
    "subscribe": {
      "body": { "notificationUrl": "@listCallbackUrl()" },
      "queries": {
        "dataset": "https://mytenant.sharepoint.com/sites/mysite",
        "table": "MyList"
      }
    }
  }
}
```

存取觸發程序資料：`@triggerBody()?['ID']`、`@triggerBody()?['Title']` 等。

---

## 自動化 (Automated，SharePoint 項目已修改)

```json
"When_an_existing_item_is_modified": {
  "type": "OpenApiConnectionNotification",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline",
      "connectionName": "<connectionName>",
      "operationId": "OnUpdatedItem"
    },
    "parameters": {
      "dataset": "https://mytenant.sharepoint.com/sites/mysite",
      "table": "MyList"
    },
    "subscribe": {
      "body": { "notificationUrl": "@listCallbackUrl()" },
      "queries": {
        "dataset": "https://mytenant.sharepoint.com/sites/mysite",
        "table": "MyList"
      }
    }
  }
}
```

---

## 自動化 (Automated，Outlook：當新電子郵件送達時)

```json
"When_a_new_email_arrives": {
  "type": "OpenApiConnectionNotification",
  "inputs": {
    "host": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365",
      "connectionName": "<connectionName>",
      "operationId": "OnNewEmail"
    },
    "parameters": {
      "folderId": "Inbox",
      "to": "monitored@contoso.com",
      "isHTML": true
    },
    "subscribe": {
      "body": { "notificationUrl": "@listCallbackUrl()" }
    }
  }
}
```

---

## 子流程 (Child Flow，由另一個流程呼叫)

```json
"manual": {
  "type": "Request",
  "kind": "Button",
  "inputs": {
    "schema": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": { "type": "object" }
        }
      }
    }
  }
}
```

存取由父流程提供的資料：`@triggerBody()?['items']`

若要將資料傳回給父流程，請加入一個「回應 (Response)」動作：
```json
"Respond_to_Parent": {
  "type": "Response",
  "runAfter": { "Compose_Result": ["Succeeded"] },
  "inputs": {
    "statusCode": 200,
    "body": "@outputs('Compose_Result')"
  }
}
```
