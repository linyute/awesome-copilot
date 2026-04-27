# FlowStudio MCP — 觸發程序型別 (Trigger Types)

供 Power Automate 流程定義使用的觸發程序定義範本。

---

## 週期性觸發 (Recurrence)

依排程執行。

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

每週在特定日期執行：
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

常見的 `timeZone` 值：
- `"AUS Eastern Standard Time"` — 雪梨/墨爾本 (UTC+10/+11)
- `"UTC"` — 世界協調時間
- `"E. Australia Standard Time"` — 布里斯本 (UTC+10 無夏令時間)
- `"New Zealand Standard Time"` — 奧克蘭 (UTC+12/+13)
- `"Pacific Standard Time"` — 洛杉磯 (UTC-8/-7)
- `"GMT Standard Time"` — 倫敦 (UTC+0/+1)

---

## 手動 (HTTP Request / Power Apps)

接收包含 JSON 本文的 HTTP POST 請求。

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

#### 無結構描述變體 (接受任意 JSON)

當傳入負載結構未知或變動時，省略 schema 以在沒有驗證的情況下接受任何有效的 JSON 本文：

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

> 用於外部 Webhook (Stripe, GitHub, Employment Hero 等)，其中負載形狀可能會變更或未完全記錄。流程接受任何 JSON 而不會因未預期的屬性而回傳 400 錯誤。

---

## 自動化 (SharePoint 項目已建立)

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

存取觸發資料：`@triggerBody()?['ID']`, `@triggerBody()?['Title']` 等。

---

## 自動化 (SharePoint 項目已修改)

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

## 自動化 (Outlook：當收到新電子郵件時)

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

## 子流程 (由另一個流程呼叫)

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

存取父流程提供的資料：`@triggerBody()?['items']`

若要將資料回傳給父流程，請加入一個 `Response` 動作：
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
